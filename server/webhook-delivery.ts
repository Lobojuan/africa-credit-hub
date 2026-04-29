import crypto from "crypto";
import { db } from "./db";
import { webhookSubscriptions, webhookDeliveryLogs } from "@shared/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";
import { isSafeWebhookUrl } from "./lib/url-safety";

export const WEBHOOK_EVENTS = [
  "borrower.created",
  "borrower.updated",
  "credit_account.created",
  "credit_report.generated",
  "dispute.filed",
  "dispute.resolved",
  "score.computed",
  "payment.recorded",
  "alert.triggered",
  "batch.completed",
  // Loto Fiscal — DGI / tax-authority subscriptions for direct
  // ingestion into the ministry's own systems. Emitted by the Loto
  // admin endpoints when a merchant is flagged, a receipt is verified
  // by the cryptographic verifier, or a draw is closed.
  "merchant.flagged",
  "receipt.verified",
  "draw.closed",
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000];

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function attemptDelivery(
  sub: { id: string; url: string; secret: string; events: string[] | null; failureCount: number | null },
  event: WebhookEvent,
  payload: string,
  attemptNumber: number,
): Promise<boolean> {
  if (!isSafeWebhookUrl(sub.url)) {
    console.warn(`[Webhook] Blocked unsafe URL for subscription ${sub.id}`);
    return false;
  }

  const signature = signPayload(payload, sub.secret);

  let responseStatus = 0;
  let responseBody = "";
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(sub.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CDH-Signature": `sha256=${signature}`,
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": event,
        "X-Webhook-Timestamp": new Date().toISOString(),
        "User-Agent": "CDH-Registry/2.6.0",
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    responseStatus = response.status;
    responseBody = (await response.text()).substring(0, 500);
    success = response.status >= 200 && response.status < 300;
  } catch (err: any) {
    responseBody = err.message?.substring(0, 500) || "Delivery failed";
  }

  try {
    const logValues: any = {
      subscriptionId: sub.id,
      event,
      payload: payload.substring(0, 2000),
      responseStatus,
      responseBody,
      success,
      attemptNumber,
    };

    if (!success && attemptNumber < MAX_RETRIES) {
      const delayMs = RETRY_DELAYS_MS[attemptNumber - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      logValues.nextRetryAt = new Date(Date.now() + delayMs);
    }

    await db.insert(webhookDeliveryLogs).values(logValues);

    await db.update(webhookSubscriptions)
      .set({
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: success ? "success" : "failed",
        failureCount: success ? 0 : (sub.failureCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(webhookSubscriptions.id, sub.id));

    if (!success && (sub.failureCount || 0) >= 9) {
      await db.update(webhookSubscriptions)
        .set({ status: "disabled", updatedAt: new Date() })
        .where(eq(webhookSubscriptions.id, sub.id));
      console.log(`[Webhook] Disabled subscription ${sub.id} after 10 consecutive failures`);
    }
  } catch (logErr) {
    console.error("[Webhook] Failed to log delivery:", logErr);
  }

  return success;
}

export async function deliverWebhook(
  event: WebhookEvent,
  data: Record<string, any>,
  organizationId?: string
) {
  try {
    const conditions = [eq(webhookSubscriptions.status, "active")];
    if (organizationId) {
      conditions.push(eq(webhookSubscriptions.organizationId, organizationId));
    }

    const subs = await db.select().from(webhookSubscriptions).where(and(...conditions));

    const matching = subs.filter(s => {
      if (!s.events || s.events.length === 0) return true;
      return s.events.includes(event) || s.events.includes("*");
    });

    for (const sub of matching) {
      const payload = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
        webhookId: crypto.randomUUID(),
      });

      await attemptDelivery(sub, event, payload, 1);
    }
  } catch (err) {
    console.error("[Webhook] Delivery error:", err);
  }
}

async function processRetries() {
  try {
    const pendingRetries = await db.select().from(webhookDeliveryLogs)
      .where(
        and(
          eq(webhookDeliveryLogs.success, false),
          lte(webhookDeliveryLogs.nextRetryAt, new Date()),
        )
      )
      .limit(50);

    for (const log of pendingRetries) {
      if (!log.payload || !log.subscriptionId) continue;
      const attempt = (log.attemptNumber || 1) + 1;
      if (attempt > MAX_RETRIES) {
        await db.update(webhookDeliveryLogs)
          .set({ nextRetryAt: null })
          .where(eq(webhookDeliveryLogs.id, log.id));
        continue;
      }

      const subs = await db.select().from(webhookSubscriptions)
        .where(and(eq(webhookSubscriptions.id, log.subscriptionId), eq(webhookSubscriptions.status, "active")))
        .limit(1);

      if (subs.length === 0) {
        await db.update(webhookDeliveryLogs)
          .set({ nextRetryAt: null })
          .where(eq(webhookDeliveryLogs.id, log.id));
        continue;
      }

      const sub = subs[0];

      await db.update(webhookDeliveryLogs)
        .set({ nextRetryAt: null })
        .where(eq(webhookDeliveryLogs.id, log.id));

      await attemptDelivery(sub, log.event as WebhookEvent, log.payload, attempt);
    }
  } catch (err) {
    console.error("[Webhook] Retry processing error:", err);
  }
}

setInterval(processRetries, 60_000);

export async function getWebhookSubscriptions(organizationId: string) {
  return db.select().from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.organizationId, organizationId));
}

export async function getWebhookDeliveryHistory(subscriptionId: string, limit = 20) {
  return db.select().from(webhookDeliveryLogs)
    .where(eq(webhookDeliveryLogs.subscriptionId, subscriptionId))
    .orderBy(webhookDeliveryLogs.deliveredAt)
    .limit(limit);
}
