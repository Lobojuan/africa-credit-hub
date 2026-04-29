/**
 * Loto Notification Dispatcher — Task #286.
 *
 * Coordinates the per-event flows by:
 *   1. Composing the audience (winners / eligible reminder list / inactive
 *      merchants) from the storage layer.
 *   2. Rendering the right template at the right language.
 *   3. Persisting one row per send into `loto_outbound_messages`.
 *   4. Dispatching through the messaging adapter and updating the row.
 *
 * Audit: winner SMS dispatch is audit-logged separately
 * (`loto_winner_notified`). Reminder + merchant inactivity dispatch are
 * NOT individually audited (they are routine marketing-style nudges) but
 * the outbound table itself is the source of truth and the admin
 * dashboard derives stats from it.
 */

import { storage } from "../storage";
import type {
  InsertAuditLog, InsertLotoOutboundMessage,
  LotoConsumerMessagingPrefs, LotoDraw, LotoDrawWinner, LotoOutboundMessage,
} from "@shared/schema";
import { adapterForMessaging, normalisePhoneE164, type MessagingProvider } from "./loto-messaging-adapter";
import { renderTemplate, type MessageLanguage } from "./loto-message-templates";

const RETRY_LIMIT = 4; // 1, 2, 4, 8 minute backoff windows.
const RETRY_BATCH = 50;

async function writeAudit(action: string, entityId: string, details: Record<string, unknown>): Promise<void> {
  try {
    const log: InsertAuditLog = {
      action,
      entity: "loto_outbound_message",
      entityId,
      userId: null,
      details: JSON.stringify(details),
      ipAddress: null,
      organizationId: null,
    };
    await storage.createAuditLog(log);
  } catch {
    // Never abort dispatch on audit failure.
  }
}

interface ResolveAudienceResult {
  recipientUserId: string | null;
  language: MessageLanguage;
  e164: string | null;
  optOutReminders: boolean;
}

async function resolveConsumer(userId: string | null, fallbackPhone: string | null, countryCode: string): Promise<ResolveAudienceResult> {
  let prefs: LotoConsumerMessagingPrefs | undefined;
  if (userId) {
    prefs = await storage.getLotoConsumerMessagingPrefs(userId);
  }
  const language: MessageLanguage = (prefs?.language as MessageLanguage | undefined) ?? "en";
  const verifiedPhone = prefs?.verifiedPhone ?? null;
  const phone = verifiedPhone ?? fallbackPhone;
  return {
    recipientUserId: userId,
    language,
    e164: normalisePhoneE164(phone, countryCode),
    optOutReminders: prefs?.optOutReminders ?? false,
  };
}

async function dispatchOne(row: LotoOutboundMessage): Promise<void> {
  const adapter = adapterForMessaging(row.provider as MessagingProvider);
  if (row.channel === "sms") {
    const result = await adapter.sendSms({
      to: row.recipient,
      body: row.payload.body,
      countryCode: row.countryCode,
      templateKey: row.templateKey,
    });
    if (result.success) {
      await storage.markLotoOutboundMessageDispatched(row.id, result.providerRef);
    } else {
      await storage.markLotoOutboundMessageFailed(row.id, result.error ?? "send_failed");
    }
    return;
  }
  if (row.channel === "ussd") {
    // USSD outbound is the synchronous response path — once persisted there
    // is nothing more to do here. Mark dispatched.
    await storage.markLotoOutboundMessageDispatched(row.id, row.providerRef);
    return;
  }
  // Push channel: in-app bell already fires elsewhere; this row exists for
  // audit only. Mark dispatched.
  await storage.markLotoOutboundMessageDispatched(row.id, null);
}

/**
 * Winner notifications. Called by the draw engine immediately after
 * winners are persisted. Sends one SMS per winner that has a usable phone
 * number; falls back to a `skipped` row for winners without a verified or
 * fallback phone (audit shows they were considered).
 *
 * Winner SMS ignores the `optOutReminders` preference — a prize win is a
 * legal/financial event, not a marketing nudge.
 */
export async function dispatchWinnerNotifications(draw: LotoDraw, winners: LotoDrawWinner[]): Promise<{ queued: number; skipped: number }> {
  if (winners.length === 0) return { queued: 0, skipped: 0 };
  const config = await storage.getLotoCountryDrawConfig(draw.countryCode);
  const provider = (config?.payoutProvider ?? "simulated") as MessagingProvider;
  let queued = 0;
  let skipped = 0;
  for (const w of winners) {
    // Winner notifications are mandatory: try messaging prefs first, then
    // fall back to the consumer-account phone (joined via users.email).
    // The fallback resolver returns ambiguous=true when the email is shared
    // by multiple users or consumer accounts; in that case we MUST NOT route
    // the SMS — record an explicit skip with reason `ambiguous_fallback_identity`
    // to avoid leaking winner data to an unrelated person.
    const fb = w.consumerUserId
      ? await storage.getConsumerPhoneFallback(w.consumerUserId)
      : { phone: null, ambiguous: false };
    const audience = await resolveConsumer(w.consumerUserId, fb.phone, draw.countryCode);
    const baseInsert: InsertLotoOutboundMessage = {
      countryCode: draw.countryCode,
      channel: "sms",
      templateKey: "winner_sms",
      language: audience.language,
      recipient: audience.e164 ?? "unknown",
      recipientUserId: audience.recipientUserId,
      drawId: draw.id,
      winnerId: w.id,
      merchantId: null,
      payload: { body: "", vars: {} },
      provider,
    };
    if (!audience.e164 || fb.ambiguous) {
      // Persist a `skipped` row (terminal status) for audit; never attempt
      // dispatch and never retry. Ambiguous fallback identity is treated as
      // a hard skip to prevent leaking winner info to an unrelated recipient.
      const reason = fb.ambiguous ? "ambiguous_fallback_identity" : "no_recipient_phone";
      const row = await storage.createLotoOutboundMessage(baseInsert);
      await storage.markLotoOutboundMessageSkipped(row.id, reason);
      skipped++;
      await writeAudit("loto_winner_notify_skipped", row.id, {
        winnerId: w.id, drawId: draw.id, reason,
      });
      continue;
    }
    const rendered = renderTemplate("winner_sms", audience.language, {
      amount: w.prizeAmount,
      currency: w.currency,
      ticket: w.receiptId.slice(0, 8).toUpperCase(),
      drawNumber: String(draw.drawNumber),
    });
    const row = await storage.createLotoOutboundMessage({
      ...baseInsert,
      payload: rendered,
    });
    await dispatchOne(row);
    queued++;
    await writeAudit("loto_winner_notified", row.id, {
      winnerId: w.id, drawId: draw.id, language: audience.language, recipientMasked: audience.e164.slice(0, -4) + "****",
    });
  }
  return { queued, skipped };
}

/**
 * Draw reminder. Called by the scheduler when an open draw has its
 * `periodEnd` within the next 24 hours and no reminder dispatch has yet
 * occurred for that (drawId, recipient) pair.
 *
 * We dedupe purely on the outbound table — a draw_reminder_sms row keyed
 * to a (drawId, recipientUserId) means the consumer has already been
 * reminded for that draw.
 */
export async function dispatchDrawReminders(draw: LotoDraw, now: Date = new Date()): Promise<{ queued: number; skipped: number }> {
  const hoursToClose = (new Date(draw.periodEnd).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursToClose <= 0 || hoursToClose > 24) return { queued: 0, skipped: 0 };
  const config = await storage.getLotoCountryDrawConfig(draw.countryCode);
  const provider = (config?.payoutProvider ?? "simulated") as MessagingProvider;
  const audience = await storage.listConsumersWithReceiptsInPeriod(
    draw.countryCode,
    new Date(draw.periodStart),
    new Date(draw.periodEnd),
  );
  // Existing rows for this draw (so we don't double-send).
  const existing = await storage.listLotoOutboundMessagesRecent({ countryCode: draw.countryCode, limit: 1000 });
  const sentTo = new Set<string>();
  for (const r of existing) {
    if (r.drawId === draw.id && r.templateKey === "draw_reminder_sms" && r.recipientUserId) {
      sentTo.add(r.recipientUserId);
    }
  }
  let queued = 0;
  let skipped = 0;
  const closesIn = `${Math.ceil(hoursToClose)}h`;
  for (const c of audience) {
    if (sentTo.has(c.userId)) { skipped++; continue; }
    const resolved = await resolveConsumer(c.userId, c.phone, draw.countryCode);
    if (resolved.optOutReminders) {
      // Persist a `skipped` row so the admin dashboard can show the user
      // was considered (and intentionally not contacted).
      const row = await storage.createLotoOutboundMessage({
        countryCode: draw.countryCode, channel: "sms", templateKey: "draw_reminder_sms",
        language: resolved.language, recipient: resolved.e164 ?? "unknown",
        recipientUserId: c.userId, drawId: draw.id, winnerId: null, merchantId: null,
        payload: { body: "", vars: {} }, provider,
      });
      await storage.markLotoOutboundMessageSkipped(row.id, "consumer_opted_out");
      skipped++;
      continue;
    }
    if (!resolved.e164) { skipped++; continue; }
    const rendered = renderTemplate("draw_reminder_sms", resolved.language, {
      drawNumber: String(draw.drawNumber),
      tickets: String(c.ticketCount),
      closesIn,
    });
    const row = await storage.createLotoOutboundMessage({
      countryCode: draw.countryCode,
      channel: "sms",
      templateKey: "draw_reminder_sms",
      language: resolved.language,
      recipient: resolved.e164,
      recipientUserId: c.userId,
      drawId: draw.id,
      winnerId: null,
      merchantId: null,
      payload: rendered,
      provider,
    });
    await dispatchOne(row);
    queued++;
  }
  return { queued, skipped };
}

/**
 * Merchant inactivity alert. Daily-cadence job: a merchant who has issued
 * zero receipts in the configured inactivity window gets one SMS per
 * 7-day window (deduped by template + merchantId on the outbound table).
 */
export async function dispatchMerchantInactivityAlerts(countryCode: string, days: number, now: Date = new Date()): Promise<{ queued: number; skipped: number }> {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const merchants = await storage.listMerchantsInactiveSince(countryCode, since);
  if (merchants.length === 0) return { queued: 0, skipped: 0 };
  const config = await storage.getLotoCountryDrawConfig(countryCode);
  const provider = (config?.payoutProvider ?? "simulated") as MessagingProvider;
  const dedupeWindow = 7 * 24 * 60 * 60 * 1000;
  const recent = await storage.listLotoOutboundMessagesRecent({ countryCode, limit: 1000 });
  const sentMerchants = new Set<string>();
  for (const r of recent) {
    if (
      r.templateKey === "merchant_inactive_sms" &&
      r.merchantId &&
      r.createdAt &&
      now.getTime() - new Date(r.createdAt).getTime() < dedupeWindow
    ) {
      sentMerchants.add(r.merchantId);
    }
  }
  let queued = 0;
  let skipped = 0;
  for (const m of merchants) {
    if (sentMerchants.has(m.merchantId)) { skipped++; continue; }
    const resolved = await resolveConsumer(m.userId, m.phone, countryCode);
    if (!resolved.e164) { skipped++; continue; }
    const rendered = renderTemplate("merchant_inactive_sms", resolved.language, {
      shop: m.shopName,
      days: String(days),
    });
    const row = await storage.createLotoOutboundMessage({
      countryCode,
      channel: "sms",
      templateKey: "merchant_inactive_sms",
      language: resolved.language,
      recipient: resolved.e164,
      recipientUserId: m.userId,
      drawId: null,
      winnerId: null,
      merchantId: m.merchantId,
      payload: rendered,
      provider,
    });
    await dispatchOne(row);
    queued++;
  }
  return { queued, skipped };
}

/**
 * Retry worker — picks rows whose backoff window has elapsed and re-runs
 * the adapter. Bounded to RETRY_LIMIT attempts to prevent runaway sends
 * against a permanently-broken recipient.
 */
export async function retryPendingMessages(now: Date = new Date()): Promise<{ retried: number; succeeded: number; failed: number }> {
  const rows = await storage.listLotoOutboundMessagesForRetry(now, { maxAttempts: RETRY_LIMIT, limit: RETRY_BATCH });
  let succeeded = 0;
  let failed = 0;
  for (const row of rows) {
    await dispatchOne(row);
    // Re-fetch this exact row by id to read its post-dispatch status — the
    // scheduler logs and admin dashboard rely on these counters being real.
    const after = await storage.getLotoOutboundMessageById(row.id);
    if (after?.status === "dispatched") succeeded++;
    else failed++;
  }
  return { retried: rows.length, succeeded, failed };
}

export const NotificationDispatcher = {
  dispatchWinnerNotifications,
  dispatchDrawReminders,
  dispatchMerchantInactivityAlerts,
  retryPendingMessages,
};
