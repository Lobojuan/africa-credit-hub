/**
 * Loto draw scheduler — two responsibilities:
 *
 *   1. Cadence-based draw creation. For every active country config that has
 *      no future open/scheduled draw on the books, create the next one with
 *      a fresh commitment hash. The draw is opened immediately and scheduled
 *      to run at the cadence-derived next slot (weekly / monthly / annual).
 *
 *   2. Execution. Pick up scheduled draws whose `scheduledFor` has elapsed
 *      and run them via the engine. Idempotent: runDraw() short-circuits if
 *      the draw is already closed/verified, and persistLotoDrawResults uses
 *      a conditional update so a concurrent worker can't double-run.
 *
 * Both phases write tamper-evident audit-log rows so regulators can track
 * every schedule + execution event without trusting the engine code.
 */

import { randomUUID } from "crypto";
import { storage } from "../storage";
import { computeCommitmentHash, generateCommitment, runDraw } from "./loto-draw-engine";
import {
  dispatchDrawReminders,
  dispatchMerchantInactivityAlerts,
  retryPendingMessages,
} from "./loto-notification-dispatcher";
import type { InsertAuditLog, LotoCountryDrawConfig, LotoDefaultTier, LotoDraw } from "@shared/schema";

const TICK_MS = 60_000;
let timer: NodeJS.Timeout | null = null;
let busy = false;

interface ScheduleArgs {
  countryCode: string;
  periodStart: Date;
  periodEnd: Date;
  scheduledFor: Date;
  tiersOverride?: LotoDefaultTier[];
  currencyOverride?: string;
}

/**
 * Build a draw with a fresh commitment + frozen tier snapshot copied from
 * the country config. Exported so HTTP routes (admin "schedule next draw"
 * and "run demo") share the same path used by the cadence scheduler.
 */
export async function scheduleNewDraw(args: ScheduleArgs) {
  const config = await storage.getLotoCountryDrawConfig(args.countryCode);
  const tierSrc: LotoDefaultTier[] = args.tiersOverride ?? (config?.defaultTiers ?? []);
  if (!tierSrc.length) throw new Error("no_tiers_configured");
  const currency = args.currencyOverride ?? config?.currency;
  if (!currency) throw new Error("no_currency_configured");
  const drawNumber = await storage.getNextLotoDrawNumber(args.countryCode);

  // Pre-generate the draw id so the commitment can be bound to drawId +
  // periodEnd + countryCode (Task #283 spec). This makes the published
  // commitment one-time-use against this specific draw and nothing else.
  const drawId = randomUUID();
  const seed = generateCommitment();
  const commitmentHash = computeCommitmentHash({
    serverSeed: seed.serverSeed,
    serverNonce: seed.serverNonce,
    drawId,
    periodEndIso: args.periodEnd.toISOString(),
    countryCode: args.countryCode,
  });

  const tiers = tierSrc.map((t, idx) => ({
    tier: t.tier,
    label: t.label,
    prizeAmount: String(t.prizeAmount),
    currency,
    slotCount: Number(t.slotCount),
    position: idx,
  }));
  const result = await storage.createLotoDrawWithTiers({
    draw: {
      id: drawId,
      countryCode: args.countryCode,
      drawNumber,
      status: "scheduled",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      scheduledFor: args.scheduledFor,
      commitmentHash,
      currency,
      serverSeed: seed.serverSeed,
      serverNonce: seed.serverNonce,
    },
    tiers,
  });
  // Audit trail (Task #283 transparency requirement). Failure here must not
  // block the draw — audit storage hiccups should never lose a scheduled draw.
  try {
    const auditLog: InsertAuditLog = {
      action: "loto_draw_scheduled",
      entity: "loto_draw",
      entityId: result.draw.id,
      userId: null,
      details: JSON.stringify({
        countryCode: args.countryCode,
        drawNumber,
        scheduledFor: args.scheduledFor.toISOString(),
        commitmentHash,
        tiers: tiers.length,
      }),
      ipAddress: null,
      userAgent: null,
      organizationId: null,
    };
    await storage.createAuditLog(auditLog);
  } catch { /* swallow */ }
  return result;
}

/** Compute the next cadence slot at the configured drawTimeUtc. */
export function computeNextDrawSlot(cadence: string, drawTimeUtc: string, now: Date = new Date()): {
  periodStart: Date; periodEnd: Date; scheduledFor: Date;
} {
  const [hh, mm] = drawTimeUtc.split(":").map((s) => parseInt(s, 10));
  const hours = Number.isFinite(hh) ? hh : 20;
  const minutes = Number.isFinite(mm) ? mm : 0;

  if (cadence === "weekly") {
    // Weeks are Mon..Sun (UTC). Next slot = next Monday at HH:MM unless we're
    // before this week's Monday-HH:MM, in which case it's this Monday.
    const day = now.getUTCDay(); // 0=Sun..6=Sat
    const daysSinceMon = (day + 6) % 7; // 0 if Mon, 6 if Sun
    const thisMon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMon, hours, minutes, 0));
    const slot = thisMon > now ? thisMon : new Date(thisMon.getTime() + 7 * 24 * 3600_000);
    const periodStart = new Date(slot.getTime() - 7 * 24 * 3600_000);
    return { periodStart, periodEnd: slot, scheduledFor: slot };
  }
  if (cadence === "annual") {
    const thisYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, hours, minutes, 0));
    const slot = thisYear > now
      ? thisYear
      : new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, hours, minutes, 0));
    const periodStart = new Date(Date.UTC(slot.getUTCFullYear() - 1, 0, 1, hours, minutes, 0));
    return { periodStart, periodEnd: slot, scheduledFor: slot };
  }
  // "monthly" (default)
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, hours, minutes, 0));
  const slot = thisMonth > now
    ? thisMonth
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, hours, minutes, 0));
  const periodStart = new Date(Date.UTC(slot.getUTCFullYear(), slot.getUTCMonth() - 1, 1, hours, minutes, 0));
  return { periodStart, periodEnd: slot, scheduledFor: slot };
}

/**
 * If the country has an active config and no upcoming draw, schedule the
 * next cadence slot. Returns the created draw or null if nothing to do.
 */
export async function ensureNextDrawForCountry(config: LotoCountryDrawConfig, now: Date = new Date()): Promise<LotoDraw | null> {
  if (!config.active) return null;
  // Look at the most recent draws for this country; if ANY draw is still
  // scheduled or open we don't queue another one — even if it's already
  // past its scheduledFor (it just hasn't run yet). The Phase-2 executor
  // tick will pick it up and only after it transitions to closed/verified
  // will the next slot be allowed. This prevents back-to-back duplicates
  // when a single tick is delayed.
  const recent = await storage.listLotoDraws({ countryCode: config.countryCode, limit: 5 });
  const hasUnresolved = recent.some((d) => d.status === "scheduled" || d.status === "open" || d.status === "drawing");
  if (hasUnresolved) return null;
  const slot = computeNextDrawSlot(config.cadence, config.drawTimeUtc, now);
  const result = await scheduleNewDraw({
    countryCode: config.countryCode,
    periodStart: slot.periodStart,
    periodEnd: slot.periodEnd,
    scheduledFor: slot.scheduledFor,
  });
  return result.draw;
}

async function tick() {
  if (busy) return;
  busy = true;
  try {
    // Phase 1: cadence-based scheduling for every active country.
    try {
      const configs = await storage.listLotoCountryDrawConfigs();
      for (const config of configs) {
        try {
          const created = await ensureNextDrawForCountry(config);
          if (created) {
            // eslint-disable-next-line no-console
            console.info(`[loto-scheduler] scheduled next draw for ${config.countryCode} #${created.drawNumber} at ${created.scheduledFor.toISOString()}`);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[loto-scheduler] cadence scheduling failed for ${config.countryCode}:`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[loto-scheduler] config listing failed:", err instanceof Error ? err.message : err);
    }

    // Phase 2: execute due draws.
    const due = await storage.listScheduledLotoDrawsDue(new Date());
    for (const draw of due) {
      try {
        // eslint-disable-next-line no-console
        console.info(`[loto-scheduler] running draw ${draw.id} (country=${draw.countryCode}, #${draw.drawNumber})`);
        const result = await runDraw(draw.id);
        // eslint-disable-next-line no-console
        console.info(`[loto-scheduler] completed draw ${draw.id}, winners=${result.winners.length}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[loto-scheduler] failed to run draw ${draw.id}:`, err instanceof Error ? err.message : err);
      }
    }

    // Phase 3: T-24h reminders + merchant inactivity (Task #286). Each
    // dispatch is best-effort and idempotent on the outbound table.
    try {
      const allDraws = await storage.listLotoDraws({ limit: 50 });
      const now = new Date();
      for (const d of allDraws) {
        if (d.status !== "scheduled" && d.status !== "open") continue;
        const hoursToClose = (new Date(d.periodEnd).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursToClose <= 0 || hoursToClose > 24) continue;
        try {
          const summary = await dispatchDrawReminders(d, now);
          if (summary.queued > 0) {
            // eslint-disable-next-line no-console
            console.info(`[loto-scheduler] draw reminders for ${d.countryCode} #${d.drawNumber}: queued=${summary.queued} skipped=${summary.skipped}`);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[loto-scheduler] reminder dispatch failed for ${d.id}:`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[loto-scheduler] reminder phase failed:", err instanceof Error ? err.message : err);
    }

    // Phase 4: retry pending/failed outbound messages.
    try {
      const r = await retryPendingMessages(new Date());
      if (r.retried > 0) {
        // eslint-disable-next-line no-console
        console.info(`[loto-scheduler] retried ${r.retried} outbound messages`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[loto-scheduler] retry phase failed:", err instanceof Error ? err.message : err);
    }

    // Phase 5: daily merchant-inactivity sweep — cheap dedupe handled in dispatcher.
    try {
      const configs = await storage.listLotoCountryDrawConfigs();
      for (const cfg of configs) {
        try {
          await dispatchMerchantInactivityAlerts(cfg.countryCode, 7);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[loto-scheduler] inactivity dispatch failed for ${cfg.countryCode}:`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[loto-scheduler] inactivity phase failed:", err instanceof Error ? err.message : err);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[loto-scheduler] tick failed:", err instanceof Error ? err.message : err);
  } finally {
    busy = false;
  }
}

export function startLotoDrawScheduler() {
  if (timer) return;
  // Run shortly after boot, then on a 60s cadence.
  setTimeout(() => { tick().catch(() => {}); }, 5_000);
  timer = setInterval(() => { tick().catch(() => {}); }, TICK_MS);
  // eslint-disable-next-line no-console
  console.info("[loto-scheduler] started");
}

export function stopLotoDrawScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
