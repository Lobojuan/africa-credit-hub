import webpush from "web-push";
import { db } from "./db";
import { consumerAccounts, borrowers } from "@shared/schema";
import { eq, or, ilike } from "drizzle-orm";
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
    "mailto:support@africacredithub.com",
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
    const [account] = await db.select({
      pushEndpoint: consumerAccounts.pushEndpoint,
      pushKeys: consumerAccounts.pushKeys,
    }).from(consumerAccounts).where(eq(consumerAccounts.id, consumerAccountId)).limit(1);

    if (!account?.pushEndpoint || account.pushEndpoint === "browser-notifications-enabled") return;

    const keys = account.pushKeys as any;
    if (!keys?.p256dh || !keys?.auth) return;

    getVapidKeys();

    await webpush.sendNotification(
      { endpoint: account.pushEndpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      JSON.stringify({ title, body, icon: "/pwa-icon-192.png" })
    );
    logger.info(`[Push] Sent to consumer ${consumerAccountId}`);
  } catch (e: any) {
    logger.warn(`[Push] Failed to send push: ${e.message}`);
  }
}

export async function sendPushToBorrowerConsumer(borrowerNationalId: string, title: string, body: string): Promise<void> {
  try {
    const [account] = await db.select({
      id: consumerAccounts.id,
      pushEndpoint: consumerAccounts.pushEndpoint,
      pushKeys: consumerAccounts.pushKeys,
    }).from(consumerAccounts).where(ilike(consumerAccounts.nationalId, borrowerNationalId)).limit(1);

    if (!account) return;
    await sendPushToConsumerAccount(account.id, title, body);
  } catch {}
}

export { getVapidKeys };
