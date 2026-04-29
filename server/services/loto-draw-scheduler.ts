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

import { storage } from "../storage";
import { generateCommitment, runDraw } from "./loto-draw-engine";
import type { LotoCountryDrawConfig, LotoDraw } from "@shared/schema";

const TICK_MS = 60_000;
let timer: NodeJS.Timeout | null = null;
let busy = false;

interface ScheduleArgs {
  countryCode: string;
  periodStart: Date;
  periodEnd: Date;
  scheduledFor: Date;
  tiersOverride?: { tier: string; label: string; prizeAmount: string | number; slotCount: number }[];
  currencyOverride?: string;
}

/**
 * Build a draw with a fresh commitment + frozen tier snapshot copied from
 * the country config. Exported so HTTP routes (admin "schedule next draw"
 * and "run demo") share the same path used by the cadence scheduler.
 */
export async function scheduleNewDraw(args: ScheduleArgs) {
  const config = await storage.getLotoCountryDrawConfig(args.countryCode);
  const tierSrc = args.tiersOverride ?? (config?.defaultTiers as any[] | undefined) ?? [];
  if (!tierSrc.length) throw new Error("no_tiers_configured");
  const currency = args.currencyOverride ?? config?.currency;
  if (!currency) throw new Error("no_currency_configured");
  const drawNumber = await storage.getNextLotoDrawNumber(args.countryCode);
  const commitment = generateCommitment();
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
      countryCode: args.countryCode,
      drawNumber,
      status: "scheduled",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      scheduledFor: args.scheduledFor,
      commitmentHash: commitment.commitmentHash,
      currency,
      serverSeed: commitment.serverSeed,
      serverNonce: commitment.serverNonce,
    } as any,
    tiers,
  });
  // Audit trail (Task #283 transparency requirement). Failure here must not
  // block the draw — audit storage hiccups should never lose a scheduled draw.
  try {
    await storage.createAuditLog({
      action: "loto_draw_scheduled",
      entity: "loto_draw",
      entityId: result.draw.id,
      userId: null as any,
      details: JSON.stringify({
        countryCode: args.countryCode,
        drawNumber,
        scheduledFor: args.scheduledFor.toISOString(),
        commitmentHash: commitment.commitmentHash,
        tiers: tiers.length,
      }),
      ipAddress: null as any,
      userAgent: null as any,
      organizationId: null as any,
    } as any);
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
  // Look at the most recent draws for this country; if any are open or
  // scheduled with scheduledFor still in the future, we already have one
  // queued and we shouldn't pile up duplicates.
  const recent = await storage.listLotoDraws({ countryCode: config.countryCode, limit: 5 });
  const hasUpcoming = recent.some((d) =>
    (d.status === "scheduled" || d.status === "open") &&
    new Date(d.scheduledFor).getTime() > now.getTime(),
  );
  if (hasUpcoming) return null;
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
