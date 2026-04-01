import crypto from "crypto";
import { db } from "./db";
import { webhookSubscriptions, webhookDeliveryLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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
            "User-Agent": "CDH-Registry/2.5.0",
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
        await db.insert(webhookDeliveryLogs).values({
          subscriptionId: sub.id,
          event,
          payload: payload.substring(0, 2000),
          responseStatus,
          responseBody,
          success,
          attemptNumber: 1,
        });

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
    }
  } catch (err) {
    console.error("[Webhook] Delivery error:", err);
  }
}

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
