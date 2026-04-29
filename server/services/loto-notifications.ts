/**
 * Loto notifications dispatcher.
 *
 * High-level helpers used by:
 *   * loto-draw-engine.ts            → sendWinnerNotifications()
 *   * loto-draw-scheduler.ts (tick)  → enqueueDrawReminders(),
 *                                      enqueueMerchantInactivityAlerts(),
 *                                      processOutboundQueue()
 *   * USSD route handler             → sendClaimInstructionsSms()
 *
 * Two phases per outbound message:
 *   1. ENQUEUE — render the template, persist a row in loto_outbound_messages
 *      with status='pending'. This is what the audit log + admin dashboard
 *      see; no carrier call has happened yet.
 *   2. DISPATCH — the queue worker picks pending rows whose scheduledAt is
 *      due, hands them to the per-country MessagingAdapter (simulated by
 *      default, NEVER real in DEMO mode), and updates status with attempts +
 *      exponential backoff on failure.
 *
 * In-app push channel: when channel === "push" the dispatcher ALSO writes a
 * row to the platform-wide `notifications` table so the existing notification
 * bell (`client/src/components/notification-bell.tsx`) surfaces winner +
 * merchant alerts alongside everything else.
 */

import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  selectAdapter,
  toE164,
  type MessagingAdapterId,
} from "./loto-messaging-adapter";
import {
  renderTemplate,
  type LotoTemplateKey,
  type SupportedLanguage,
} from "./loto-message-templates";
import type {
  LotoDraw,
  LotoDrawWinner,
  LotoOutboundMessage,
} from "@shared/schema";

const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 60_000; // 1m, 2m, 4m, 8m, 16m

interface EnqueueArgs {
  userId?: string | null;
  recipientPhone?: string | null;
  countryCode: string;
  language?: string;
  channel: "sms" | "push" | "ussd";
  templateKey: LotoTemplateKey;
  vars: Record<string, unknown>;
  purpose: string;
  adapter?: MessagingAdapterId | string;
  scheduledAt?: Date;
  /** Title shown in the notification bell (push channel only). */
  pushTitle?: string;
  /** Deep link for the bell entry (push channel only). */
  pushLink?: string;
}

/** Narrow shapes of the rows returned by raw-SQL queries below.
 *  Each MUST extend Record<string, unknown> to satisfy Drizzle's
 *  db.execute<T>() constraint without resorting to `any`. */
type PrefsRecipientRow = {
  user_id: string;
  verified_phone: string;
  language: string;
} & Record<string, unknown>;

type MerchantInactivityRow = {
  id: string;
  name: string;
  country_code: string;
  phone: string | null;
  user_id: string | null;
  days: number;
} & Record<string, unknown>;

type VerifiedConsumerRow = {
  user_id: string;
  language: string;
} & Record<string, unknown>;

/**
 * Render + enqueue. Returns the persisted row OR null if rendering / phone
 * normalisation failed (logged as a "skipped" row so the admin dashboard can
 * see why nothing was sent).
 */
export async function enqueueOutboundMessage(args: EnqueueArgs): Promise<LotoOutboundMessage | null> {
  const lang = (args.language ?? "en") as SupportedLanguage;
  const { body, language: usedLang } = renderTemplate(args.templateKey, lang, args.vars, args.countryCode);

  // SMS / USSD require a recipient phone — normalise to E.164 or skip.
  let phone: string | null = null;
  if (args.channel !== "push") {
    phone = toE164(args.recipientPhone ?? null);
    if (!phone) {
      // Persist as 'skipped' so the admin can see who was skipped and why.
      const skipped = await storage.createLotoOutboundMessage({
        userId: args.userId ?? null,
        recipientPhone: args.recipientPhone ?? null,
        countryCode: args.countryCode,
        language: usedLang,
        channel: args.channel,
        templateKey: args.templateKey,
        body,
        payload: args.vars,
        purpose: args.purpose,
        adapter: args.adapter ?? "simulated",
        scheduledAt: args.scheduledAt,
      });
      await storage.updateLotoOutboundMessageStatus(skipped.id, {
        status: "skipped",
        lastError: "phone_unnormalisable",
      });
      return null;
    }
  }

  const row = await storage.createLotoOutboundMessage({
    userId: args.userId ?? null,
    recipientPhone: phone,
    countryCode: args.countryCode,
    language: usedLang,
    channel: args.channel,
    templateKey: args.templateKey,
    body,
    payload: args.vars,
    purpose: args.purpose,
    adapter: args.adapter ?? "simulated",
    scheduledAt: args.scheduledAt,
  });

  // Push delivery: integrate with the existing notifications table so the
  // bell badge fires immediately. We still keep the loto_outbound_messages
  // row so the admin dashboard's audit trail is complete.
  if (args.channel === "push" && args.userId) {
    try {
      await storage.createNotification({
        userId: args.userId,
        type: args.purpose.startsWith("winner") ? "loto_winner" : "loto_alert",
        title: args.pushTitle ?? body.split(".")[0]?.slice(0, 80) ?? "Loto Fiscal",
        message: body,
        country: args.countryCode,
        link: args.pushLink ?? "/loto-fiscal",
      });
    } catch (err) {
      // Notification bell is best-effort — we never let it block the
      // audit-log row insert above.
      // eslint-disable-next-line no-console
      console.error("[loto-notifications] notification bell write failed:", err);
    }
  }

  return row;
}

/** Dispatch one queued row. Caller does no error-handling — we update the row. */
export async function dispatchOutboundMessage(row: LotoOutboundMessage): Promise<void> {
  if (row.channel === "push") {
    // Push rows are already surfaced via the notifications table at enqueue
    // time (see enqueueOutboundMessage). Mark sent so the admin dashboard
    // shows the delivery as complete.
    await storage.updateLotoOutboundMessageStatus(row.id, {
      status: "sent",
      dispatchedAt: new Date(),
      providerRef: `push-${row.id}`,
      incrementAttempts: true,
    });
    return;
  }

  const adapter = selectAdapter(row.adapter);
  if (!row.recipientPhone) {
    await storage.updateLotoOutboundMessageStatus(row.id, {
      status: "skipped",
      lastError: "missing_recipient",
      incrementAttempts: true,
    });
    return;
  }

  const result = await adapter.sendSms({
    to: row.recipientPhone,
    body: row.body,
    countryCode: row.countryCode,
    templateKey: row.templateKey,
  });

  if (result.status === "sent") {
    await storage.updateLotoOutboundMessageStatus(row.id, {
      status: "sent",
      providerRef: result.providerRef,
      incrementAttempts: true,
      dispatchedAt: new Date(),
    });
    return;
  }

  // Failure — increment attempts and schedule next retry with exponential
  // backoff, OR mark permanently failed once the cap is reached.
  const nextAttempt = row.attempts + 1;
  if (nextAttempt >= MAX_ATTEMPTS) {
    await storage.updateLotoOutboundMessageStatus(row.id, {
      status: "failed",
      lastError: result.error ?? "send_failed",
      incrementAttempts: true,
    });
    return;
  }
  const delay = BACKOFF_BASE_MS * Math.pow(2, nextAttempt - 1);
  await storage.updateLotoOutboundMessageStatus(row.id, {
    status: "pending",
    lastError: result.error ?? "send_failed",
    incrementAttempts: true,
    scheduledAt: new Date(Date.now() + delay),
  });
}

/** Drain up to N pending rows (called from the scheduler tick). */
export async function processOutboundQueue(limit = 25): Promise<{ dispatched: number; failed: number }> {
  const pending = await storage.listPendingLotoOutboundMessages(limit);
  let dispatched = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      await dispatchOutboundMessage(row);
      dispatched++;
    } catch (err) {
      failed++;
      await storage.updateLotoOutboundMessageStatus(row.id, {
        status: "pending",
        lastError: err instanceof Error ? err.message : String(err),
        incrementAttempts: true,
        scheduledAt: new Date(Date.now() + BACKOFF_BASE_MS),
      });
    }
  }
  return { dispatched, failed };
}

// -------------------------------------------------------------------------
// High-level helpers — the rest of the codebase imports only these.
// -------------------------------------------------------------------------

/**
 * Called from loto-draw-engine.ts after winners are persisted and audit log
 * 'loto_draw_completed' is written. Sends:
 *   * a winner SMS (regulatory; bypasses opt-out)
 *   * an in-app push (tap-to-claim) — surfaces in the platform notification
 *     bell via the notifications table.
 * for every winner with a known consumer account.
 *
 * NOTE: winner notifications are intentionally separate from prize-claim
 * SMS (sent later via sendClaimInstructionsSms) and from the
 * 'loto_payout_dispatched' audit entry — Task #286 mandates audit-log
 * separation for winner / claim flows.
 */
export async function sendWinnerNotifications(args: {
  draw: LotoDraw;
  winners: LotoDrawWinner[];
  adapterId?: string;
}): Promise<void> {
  for (const winner of args.winners) {
    if (!winner.consumerUserId) continue;
    const prefs = await storage.getLotoConsumerMessagingPrefs(winner.consumerUserId);
    const lang = (prefs?.language ?? "en") as SupportedLanguage;
    const phone = prefs?.verifiedPhone ?? null;
    const vars = {
      winnerName: "", // populated client-side from user name; SMS keeps neutral.
      prizeAmount: winner.prizeAmount,
      currency: winner.currency,
      ticketRef: winner.receiptId.slice(0, 10),
      drawNumber: args.draw.drawNumber,
    };

    // Winner SMS — bypasses the consumer opt-out (regulatory). Only enqueued
    // when we have a verified phone; otherwise the in-app push is the only
    // canonical channel.
    if (phone) {
      await enqueueOutboundMessage({
        userId: winner.consumerUserId,
        recipientPhone: phone,
        countryCode: args.draw.countryCode,
        language: lang,
        channel: "sms",
        templateKey: "winner_sms",
        vars,
        purpose: "winner_notification",
        adapter: args.adapterId,
      });
    }

    // In-app push always enqueued — also writes to the platform notifications
    // table so the bell icon shows the alert immediately.
    await enqueueOutboundMessage({
      userId: winner.consumerUserId,
      countryCode: args.draw.countryCode,
      language: lang,
      channel: "push",
      templateKey: "winner_push",
      vars,
      purpose: "winner_notification",
      adapter: args.adapterId,
      pushTitle: `You won ${winner.currency} ${winner.prizeAmount}!`,
      pushLink: "/loto-fiscal",
    });
  }
}

/**
 * T-24h reminder: scan all draws closing within (24h ± window). For each,
 * enumerate consumers who:
 *   * are scoped to the draw's country (verified phone present),
 *   * have NOT opted out of reminders, AND
 *   * hold at least one VAT receipt within the draw's period (i.e. they are
 *     actually eligible for THAT draw — not just any global pref row).
 * Then enqueue one SMS each. Idempotent: we de-dupe via a
 * "draw_reminder:{drawId}" purpose marker so a re-tick within the window
 * doesn't double-send.
 */
export async function enqueueDrawReminders(now: Date = new Date()): Promise<{ enqueued: number }> {
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const upcoming = await storage.listLotoDraws({ limit: 50 });
  let enqueued = 0;

  for (const draw of upcoming) {
    if (draw.status !== "scheduled" && draw.status !== "open") continue;
    const t = draw.scheduledFor.getTime();
    if (t < windowStart.getTime() || t > windowEnd.getTime()) continue;

    // Idempotency: if any reminder row exists for this draw already, skip.
    const existing = await storage.listLotoOutboundMessages({
      countryCode: draw.countryCode,
      purpose: `draw_reminder:${draw.id}`,
      limit: 1,
    });
    if (existing.length > 0) continue;

    const recipients = await loadEligibleReminderRecipients({
      countryCode: draw.countryCode,
      periodStart: draw.periodStart,
      periodEnd: draw.periodEnd,
    });
    const hoursLeft = Math.max(1, Math.round((t - now.getTime()) / 3_600_000));
    for (const r of recipients) {
      await enqueueOutboundMessage({
        userId: r.userId,
        recipientPhone: r.phone,
        countryCode: draw.countryCode,
        language: r.language,
        channel: "sms",
        templateKey: "draw_reminder_sms",
        vars: { hoursLeft, ticketCount: r.ticketCount },
        purpose: `draw_reminder:${draw.id}`,
      });
      enqueued++;
    }
  }
  return { enqueued };
}

/**
 * Returns consumers who are eligible for a reminder for the given draw —
 * country-scoped via the merchant's countryCode (since prefs has no country
 * column), opted-in, and holding ≥1 receipt issued during the draw period.
 *
 * The caller's country is determined by which receipts they hold; this
 * mirrors the draw engine's eligibility rule and prevents cross-country
 * mis-targeting (e.g. a CI consumer being SMS'd about a GH draw).
 */
async function loadEligibleReminderRecipients(args: {
  countryCode: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<Array<{ userId: string; phone: string; language: SupportedLanguage; ticketCount: number }>> {
  const rows = await db.execute<PrefsRecipientRow & { ticket_count: number }>(sql`
    SELECT p.user_id,
           p.verified_phone,
           p.language,
           COUNT(r.id)::int AS ticket_count
    FROM loto_consumer_messaging_prefs p
    INNER JOIN loto_receipts r ON r.consumer_user_id = p.user_id
    INNER JOIN loto_merchants m ON m.id = r.merchant_id
    WHERE p.opt_out_reminders = false
      AND p.verified_phone IS NOT NULL
      AND m.country_code = ${args.countryCode}
      AND r.issued_at >= ${args.periodStart}
      AND r.issued_at <= ${args.periodEnd}
    GROUP BY p.user_id, p.verified_phone, p.language
    HAVING COUNT(r.id) >= 1
    LIMIT 500
  `);
  return rows.rows.map((r) => ({
    userId: r.user_id,
    phone: r.verified_phone,
    language: ((r.language as SupportedLanguage) ?? "en"),
    ticketCount: Number(r.ticket_count),
  }));
}

/**
 * Daily merchant inactivity check — any merchant who hasn't issued a
 * verified VAT receipt in 7+ days gets one SMS + in-app push to their
 * registered contact phone. Idempotent per (merchantId, ISO-week).
 */
export async function enqueueMerchantInactivityAlerts(now: Date = new Date()): Promise<{ enqueued: number }> {
  const inactive = await db.execute<MerchantInactivityRow>(sql`
    SELECT m.id,
           m.shop_name AS name,
           m.country_code,
           u.phone AS phone,
           m.user_id,
           EXTRACT(DAY FROM now() - COALESCE(MAX(r.issued_at), m.registered_at))::int AS days
    FROM loto_merchants m
    LEFT JOIN loto_receipts r ON r.merchant_id = m.id
    LEFT JOIN users u ON u.id = m.user_id
    GROUP BY m.id, u.phone
    HAVING EXTRACT(DAY FROM now() - COALESCE(MAX(r.issued_at), m.registered_at)) >= 7
    LIMIT 200
  `);

  const isoWeek = `${now.getUTCFullYear()}W${Math.floor(now.getUTCDate() / 7)}`;
  let enqueued = 0;
  for (const m of inactive.rows) {
    const purpose = `merchant_inactivity:${m.id}:${isoWeek}`;
    const existing = await storage.listLotoOutboundMessages({
      countryCode: m.country_code, purpose, limit: 1,
    });
    if (existing.length > 0) continue;

    const vars = { shopName: m.name, daysSinceLastReceipt: m.days };
    if (m.phone) {
      await enqueueOutboundMessage({
        userId: m.user_id,
        recipientPhone: m.phone,
        countryCode: m.country_code,
        language: "en",
        channel: "sms",
        templateKey: "merchant_inactivity_sms",
        vars,
        purpose,
      });
      enqueued++;
    }
    if (m.user_id) {
      await enqueueOutboundMessage({
        userId: m.user_id,
        countryCode: m.country_code,
        language: "en",
        channel: "push",
        templateKey: "merchant_inactivity_push",
        vars,
        purpose,
        pushTitle: "Loto Fiscal — receipt activity has stalled",
        pushLink: "/loto-fiscal",
      });
      enqueued++;
    }
  }
  return { enqueued };
}

/**
 * USSD claim handoff — sent right after a consumer dials the claim flow on
 * USSD. Lives in its own purpose ("prize_claim") so the audit log keeps
 * winner-detection and prize-claim flows separate (Task #286).
 *
 * Caller MUST already have verified that the destination phone belongs to a
 * consumer who registered it in loto_consumer_messaging_prefs. The route
 * handler enforces this; we re-enforce by refusing to enqueue if no userId
 * matched — defence in depth for the verified-phone constraint.
 */
export async function sendClaimInstructionsSms(args: {
  countryCode: string; phone: string; language?: string;
  prizeAmount: string; currency: string; ticketRef: string;
  userId: string;
}): Promise<LotoOutboundMessage | null> {
  if (!args.userId) {
    // Hard refusal — see contract above.
    throw new Error("sendClaimInstructionsSms requires a verified consumer userId");
  }
  return enqueueOutboundMessage({
    userId: args.userId,
    recipientPhone: args.phone,
    countryCode: args.countryCode,
    language: args.language ?? "en",
    channel: "sms",
    templateKey: "claim_instructions_sms",
    vars: {
      prizeAmount: args.prizeAmount,
      currency: args.currency,
      ticketRef: args.ticketRef,
    },
    purpose: "prize_claim",
  });
}

/** Exposed for the USSD route to find the consumer behind a verified phone. */
export async function findConsumerByVerifiedPhone(phone: string): Promise<{ userId: string; language: SupportedLanguage } | null> {
  const r = await db.execute<VerifiedConsumerRow>(sql`
    SELECT user_id, language
    FROM loto_consumer_messaging_prefs
    WHERE verified_phone = ${phone}
    LIMIT 1
  `);
  const row = r.rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    language: ((row.language as SupportedLanguage) ?? "en"),
  };
}
