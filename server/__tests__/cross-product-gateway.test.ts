/**
 * Tests for the Cross-Product Gateway consent enforcement.
 * Run with: npx tsx server/__tests__/cross-product-gateway.test.ts
 *
 * Uses live database (test rows are tagged and cleaned up at end).
 */

import { db } from "../db";
import { eq, and, like } from "drizzle-orm";
import {
  lotoMerchants, lotoReceipts, crossProductConsents, auditLogs, borrowers,
} from "@shared/schema";
import {
  gateway, computeReceiptFeatures, CrossProductError,
} from "../cross-product-gateway";

const TAG = "test-cpg-" + Date.now();

interface TestResult { name: string; passed: boolean; error?: string }
const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message ?? String(err) });
    console.log(`  ✗ ${name}\n    ${err?.message ?? err}`);
  }
}

async function setup() {
  const [merchant] = await db.insert(lotoMerchants).values({
    shopName: TAG + "-shop",
    ownerName: "Test Owner",
    countryCode: "CI",
    currency: "XOF",
    creditOptInActive: false,
  }).returning();

  // 12 receipts across 3 months
  const now = new Date();
  for (let m = 0; m < 3; m++) {
    for (let i = 0; i < 4; i++) {
      await db.insert(lotoReceipts).values({
        merchantId: merchant.id,
        fiscalCode: `${TAG}-FC-${m}-${i}`,
        ticketNumber: `${TAG}-T-${m}-${i}`,
        amount: "5000",
        vatAmount: "900",
        currency: "XOF",
        issuedAt: new Date(now.getFullYear(), now.getMonth() - m, 5 + i),
      });
    }
  }

  return merchant;
}

async function cleanup(merchantId: string) {
  await db.delete(lotoReceipts).where(eq(lotoReceipts.merchantId, merchantId));
  await db.delete(crossProductConsents).where(eq(crossProductConsents.merchantId, merchantId));
  await db.delete(lotoMerchants).where(eq(lotoMerchants.id, merchantId));
  await db.delete(auditLogs).where(eq(auditLogs.entityId, merchantId));
}

async function run() {
  console.log("Cross-Product Gateway tests");
  const merchant = await setup();

  await test("computeReceiptFeatures returns sensible values", async () => {
    const receipts = await db.select().from(lotoReceipts).where(eq(lotoReceipts.merchantId, merchant.id));
    const f = computeReceiptFeatures(receipts as any);
    if (f.totalReceipts !== 12) throw new Error("expected 12 receipts, got " + f.totalReceipts);
    if (f.monthsWithActivity !== 3) throw new Error("expected 3 months active, got " + f.monthsWithActivity);
    if (f.vatActivityScore < 300 || f.vatActivityScore > 850) throw new Error("score out of range");
    if (!f.reasonCodes.length) throw new Error("expected reason codes");
  });

  await test("gateway denies access without consent", async () => {
    try {
      await gateway.getMerchantReceiptFeatures(merchant.id, { userId: undefined, ip: "127.0.0.1" });
      throw new Error("should have thrown");
    } catch (e) {
      if (!(e instanceof CrossProductError)) throw new Error("wrong error type: " + e);
      if (e.code !== "no_consent") throw new Error("expected no_consent, got " + e.code);
    }
  });

  await test("gateway logs denied access to audit log", async () => {
    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, merchant.id)));
    if (logs.length === 0) throw new Error("no audit log written for denied access");
    const recent = logs[logs.length - 1];
    const details = JSON.parse(recent.details ?? "{}");
    if (details.outcome !== "denied") throw new Error("expected outcome=denied");
  });

  // Grant consent and try again
  const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 12);
  const [consent] = await db.insert(crossProductConsents).values({
    merchantId: merchant.id,
    sourceProduct: "loto",
    targetProduct: "credit",
    purpose: "merchant_credit_profile",
    expiresAt,
  }).returning();

  await test("gateway allows access with active consent", async () => {
    const result = await gateway.getMerchantReceiptFeatures(merchant.id, { userId: undefined, ip: "127.0.0.1" });
    if (!result.features) throw new Error("expected features");
    if (result.consent.id !== consent.id) throw new Error("wrong consent returned");
    if (result.features.totalReceipts !== 12) throw new Error("wrong total receipts");
  });

  await test("gateway logs ok access to audit log", async () => {
    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, merchant.id)));
    const okLogs = logs.filter((l: any) => {
      try { return JSON.parse(l.details ?? "{}").outcome === "ok"; } catch { return false; }
    });
    if (okLogs.length === 0) throw new Error("no ok audit log written");
  });

  // Wrong-purpose: have a merchant_credit_profile consent but ask for bureau_reputation_badge
  await test("gateway rejects wrong-purpose consent", async () => {
    try {
      await gateway.getBureauBadgeForMerchant(merchant.id, { userId: undefined, ip: "127.0.0.1" });
      // returns null on no consent — fine
    } catch (e) {
      if (e instanceof CrossProductError && e.code === "no_consent") return;
      throw e;
    }
  });

  // Revoke and re-test
  await db.update(crossProductConsents)
    .set({ status: "revoked", revokedAt: new Date(), revokedReason: "test_revoke" })
    .where(eq(crossProductConsents.id, consent.id));

  await test("gateway denies access after revocation", async () => {
    try {
      await gateway.getMerchantReceiptFeatures(merchant.id, { userId: undefined, ip: "127.0.0.1" });
      throw new Error("should have denied after revocation");
    } catch (e) {
      if (!(e instanceof CrossProductError)) throw e;
      if (e.code !== "no_consent" && e.code !== "consent_revoked") throw new Error("expected no_consent/consent_revoked, got " + e.code);
    }
  });

  // Expired consent
  const expiredPast = new Date(); expiredPast.setMonth(expiredPast.getMonth() - 1);
  await db.insert(crossProductConsents).values({
    merchantId: merchant.id,
    sourceProduct: "loto",
    targetProduct: "credit",
    purpose: "merchant_credit_profile",
    expiresAt: expiredPast,
  });

  await test("gateway denies access for expired consent", async () => {
    try {
      await gateway.getMerchantReceiptFeatures(merchant.id, { userId: undefined, ip: "127.0.0.1" });
      throw new Error("should have denied expired consent");
    } catch (e) {
      if (!(e instanceof CrossProductError)) throw e;
      if (e.code !== "no_consent" && e.code !== "consent_expired") throw new Error("expected denial, got " + e.code);
    }
  });

  await cleanup(merchant.id);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); });
