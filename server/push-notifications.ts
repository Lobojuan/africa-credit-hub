import webpush from "web-push";
import { db } from "./db";
import { consumerAccounts, consumerPushSubscriptions, borrowers } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import { createLogger } from "./logger";

const logger = createLogger("push");

let vapidKeys: { publicKey: string; privateKey: string } | null = null;

function getVapidKeys(): { publicKey: string; privateKey: string } {
  if (vapidKeys) return vapidKeys;

  const pubKey = process.env.VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;

  if (pubKey && privKey) {
    vapidKeys = { publicKey: pubKey, privateKey: privKey };
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    logger.info("[Push] Generated ephemeral VAPID keys — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars for persistence");
  }

  webpush.setVapidDetails(
    "mailto:support@universalcredithub.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return vapidKeys;
}

export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey;
}

export async function sendPushToConsumerAccount(consumerAccountId: string, title: string, body: string): Promise<void> {
  try {
    // Fan out to ALL registered subscriptions for this consumer (multi-device)
    const subs = await db.select().from(consumerPushSubscriptions).where(eq(consumerPushSubscriptions.consumerAccountId, consumerAccountId));
    if (subs.length === 0) return;

    getVapidKeys();
    const payload = JSON.stringify({ title, body, icon: "/pwa-icon-192.png" });

    await Promise.allSettled(subs.map(async (sub) => {
      const keys = sub.keys as { p256dh?: string; auth?: string } | null;
      if (!keys?.p256dh || !keys?.auth) return;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          payload
        );
        logger.info(`[Push] Sent to consumer ${consumerAccountId} endpoint ...${sub.endpoint.slice(-20)}`);
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Endpoint gone — clean it up
          await db.delete(consumerPushSubscriptions).where(eq(consumerPushSubscriptions.id, sub.id)).catch(() => {});
          logger.info(`[Push] Removed expired subscription for consumer ${consumerAccountId}`);
        } else {
          logger.warn(`[Push] Failed push for consumer ${consumerAccountId}: ${e.message}`);
        }
      }
    }));
  } catch (e: any) {
    logger.warn(`[Push] sendPushToConsumerAccount error: ${e.message}`);
  }
}

export async function sendPushToBorrowerConsumer(borrowerNationalId: string, title: string, body: string): Promise<void> {
  try {
    const [account] = await db.select({ id: consumerAccounts.id })
      .from(consumerAccounts)
      .where(ilike(consumerAccounts.nationalId, borrowerNationalId))
      .limit(1);
    if (!account) return;
    await sendPushToConsumerAccount(account.id, title, body);
  } catch {}
}

export { getVapidKeys };
