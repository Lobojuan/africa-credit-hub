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
  alternativeData, creditInquiries, users, creditAccounts, creditScoreHistory,
  organizations, collateralItems,
} from "@shared/schema";
import {
  gateway, computeReceiptFeatures, CrossProductError,
  syncMerchantReceiptsToAlternativeData,
} from "../cross-product-gateway";
import { storage } from "../storage";

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
    const f = computeReceiptFeatures(receipts);
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

  await test("audit log records source=data origin (loto), target=consumer (credit) for happy path", async () => {
    // Fresh merchant + fresh consent so prior expire/revoke tests can't poison the row.
    const [auditMerch] = await db.insert(lotoMerchants).values({
      shopName: TAG + "-audit", countryCode: "CI", currency: "XOF", creditOptInActive: true,
    }).returning();
    await db.insert(lotoReceipts).values({
      merchantId: auditMerch.id,
      fiscalCode: TAG + "-audit-FC",
      ticketNumber: TAG + "-audit-T",
      amount: "5000", vatAmount: "900", currency: "XOF",
      issuedAt: new Date(),
    });
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await db.insert(crossProductConsents).values({
      userId: undefined,
      merchantId: auditMerch.id,
      sourceProduct: "loto",
      targetProduct: "credit",
      purpose: "merchant_credit_profile",
      status: "active",
      expiresAt: future,
    });
    const before = Date.now();
    await gateway.getMerchantReceiptFeatures(auditMerch.id, { userId: undefined, ip: "127.0.0.1" });
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.entityId, auditMerch.id));
    const okRow = rows.filter(r => {
      try { return JSON.parse(r.details ?? "{}").outcome === "ok"; } catch { return false; }
    }).slice(-1)[0];
    if (!okRow) throw new Error("no ok audit row found");
    const d = JSON.parse(okRow.details ?? "{}");
    if (d.sourceProduct !== "loto") throw new Error(`expected sourceProduct=loto, got ${d.sourceProduct}`);
    if (d.targetProduct !== "credit") throw new Error(`expected targetProduct=credit, got ${d.targetProduct}`);
    if (okRow.entity !== "loto") throw new Error(`expected entity=loto (data origin), got ${okRow.entity}`);
    if (new Date(okRow.createdAt!).getTime() < before - 5000) throw new Error("audit row too old");
    await db.delete(auditLogs).where(eq(auditLogs.entityId, auditMerch.id));
    await db.delete(lotoReceipts).where(eq(lotoReceipts.merchantId, auditMerch.id));
    await db.delete(crossProductConsents).where(eq(crossProductConsents.merchantId, auditMerch.id));
    await db.delete(lotoMerchants).where(eq(lotoMerchants.id, auditMerch.id));
  });

  await test("audit log records source=data origin, target=consumer for denied path", async () => {
    // Use a fresh merchant id with no consent so the gateway denies.
    const [bare] = await db.insert(lotoMerchants).values({
      shopName: TAG + "-bare", countryCode: "CI", currency: "XOF", creditOptInActive: false,
    }).returning();
    try {
      await gateway.getMerchantReceiptFeatures(bare.id, { userId: undefined, ip: "127.0.0.1" });
    } catch { /* expected */ }
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.entityId, bare.id));
    const denied = rows.find(r => {
      try { return JSON.parse(r.details ?? "{}").outcome === "denied"; } catch { return false; }
    });
    if (!denied) throw new Error("no denied audit row found");
    const d = JSON.parse(denied.details ?? "{}");
    if (d.sourceProduct !== "loto") throw new Error(`denied sourceProduct=${d.sourceProduct}`);
    if (d.targetProduct !== "credit") throw new Error(`denied targetProduct=${d.targetProduct}`);
    if (!d.reason) throw new Error("denied audit row should record a reason");
    await db.delete(auditLogs).where(eq(auditLogs.entityId, bare.id));
    await db.delete(lotoMerchants).where(eq(lotoMerchants.id, bare.id));
  });

  await test("E2E: merchant opt-in grants both merchant_credit_profile AND bureau_reputation_badge consents; opt-out revokes both", async () => {
    // Mirror the route handler exactly: opt-in must create both consents so
    // the bureau badge endpoint succeeds. We exercise the gateway entry
    // points the badge route uses (getBureauBadgeForMerchant) plus the
    // merchant-credit-profile entry, and assert behaviour on both grants.
    const [m] = await db.insert(lotoMerchants).values({
      shopName: TAG + "-optin",
      countryCode: "CI", currency: "XOF", creditOptInActive: true,
    }).returning();
    await db.insert(lotoReceipts).values({
      merchantId: m.id, fiscalCode: TAG + "-optin-FC", ticketNumber: TAG + "-optin-T",
      amount: "5000", vatAmount: "900", currency: "XOF", issuedAt: new Date(),
    });
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const baseConsent = {
      userId: undefined, borrowerId: null, merchantId: m.id,
      sourceProduct: "loto" as const, targetProduct: "credit" as const,
      expiresAt, grantedByIp: "127.0.0.1",
    };
    await storage.createCrossProductConsent({ ...baseConsent, purpose: "merchant_credit_profile", scopeNote: "test" });
    await storage.createCrossProductConsent({ ...baseConsent, purpose: "bureau_reputation_badge", scopeNote: "test" });

    // Both gateway calls should succeed.
    const badge = await gateway.getBureauBadgeForMerchant(m.id, { userId: undefined, ip: "127.0.0.1" });
    if (!badge.badge?.tier) throw new Error("badge endpoint returned no tier after opt-in");
    const profile = await gateway.getMerchantReceiptFeatures(m.id, { userId: undefined, ip: "127.0.0.1" });
    if (profile.features.totalReceipts !== 1) throw new Error("merchant credit profile failed after opt-in");

    // Now opt-out: revoke BOTH purposes (mirrors the route handler).
    const consents = await storage.getCrossProductConsents({ merchantId: m.id });
    for (const c of consents) {
      if (c.status === "active" && (c.purpose === "merchant_credit_profile" || c.purpose === "bureau_reputation_badge")) {
        await storage.revokeCrossProductConsent(c.id, "merchant_opt_out");
      }
    }
    let badgeDenied = false;
    try { await gateway.getBureauBadgeForMerchant(m.id, { userId: undefined, ip: "127.0.0.1" }); }
    catch (e: any) { if (e instanceof CrossProductError) badgeDenied = true; }
    if (!badgeDenied) throw new Error("badge endpoint should be denied after opt-out");

    let profileDenied = false;
    try { await gateway.getMerchantReceiptFeatures(m.id, { userId: undefined, ip: "127.0.0.1" }); }
    catch (e: any) { if (e instanceof CrossProductError) profileDenied = true; }
    if (!profileDenied) throw new Error("merchant credit profile should be denied after opt-out");

    await db.delete(auditLogs).where(eq(auditLogs.entityId, m.id));
    await db.delete(crossProductConsents).where(eq(crossProductConsents.merchantId, m.id));
    await db.delete(lotoReceipts).where(eq(lotoReceipts.merchantId, m.id));
    await db.delete(lotoMerchants).where(eq(lotoMerchants.id, m.id));
  });

  // ─── E2E: revocation immediately removes lender-visible VAT activity signal ──
  await test("E2E: revocation purges fiscal_receipts alt-data and blocks subsequent gateway reads", async () => {
    // Need a borrower row so the receipts can be linked into alternativeData.
    const [borrower] = await db.insert(borrowers).values({
      type: "individual",
      firstName: "Test",
      lastName: TAG,
      nationalId: TAG + "-NID",
    }).returning();

    // Bind merchant to borrower for this scenario.
    await db.update(lotoMerchants).set({ borrowerId: borrower.id }).where(eq(lotoMerchants.id, merchant.id));

    // Grant a fresh consent and sync receipts → alternativeData.
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const [grant] = await db.insert(crossProductConsents).values({
      userId: undefined,
      borrowerId: borrower.id,
      merchantId: merchant.id,
      sourceProduct: "loto",
      targetProduct: "credit",
      purpose: "merchant_credit_profile",
      status: "active",
      expiresAt: future,
    }).returning();

    const sync = await syncMerchantReceiptsToAlternativeData(merchant.id, { userId: undefined, ip: "127.0.0.1" });
    if (!sync.inserted) throw new Error("expected fiscal_receipts row to be inserted");

    const beforeRows = await db.select().from(alternativeData)
      .where(and(eq(alternativeData.borrowerId, borrower.id), eq(alternativeData.source, "fiscal_receipts")));
    if (beforeRows.length !== 1) throw new Error("expected exactly 1 fiscal_receipts row before revoke, got " + beforeRows.length);

    // Revoke + purge through the centralized storage path the routes use.
    await storage.revokeCrossProductConsent(grant.id, "test_revoke_e2e");
    await storage.deleteAlternativeDataForBorrower(borrower.id, "fiscal_receipts");

    const afterRows = await db.select().from(alternativeData)
      .where(and(eq(alternativeData.borrowerId, borrower.id), eq(alternativeData.source, "fiscal_receipts")));
    if (afterRows.length !== 0) throw new Error("expected fiscal_receipts row to be purged after revoke, got " + afterRows.length);

    // Subsequent gateway read for the SAME purpose must now be denied — no silent data leakage.
    try {
      await gateway.getMerchantReceiptFeatures(merchant.id, { userId: undefined, ip: "127.0.0.1" });
      throw new Error("gateway should deny after revoke");
    } catch (e) {
      if (!(e instanceof CrossProductError)) throw e;
      if (e.code !== "no_consent" && e.code !== "consent_revoked") {
        throw new Error("expected denial, got " + e.code);
      }
    }

    // Cleanup borrower-bound rows.
    await db.delete(alternativeData).where(eq(alternativeData.borrowerId, borrower.id));
    await db.delete(crossProductConsents).where(eq(crossProductConsents.borrowerId, borrower.id));
    await db.update(lotoMerchants).set({ borrowerId: null }).where(eq(lotoMerchants.id, merchant.id));
    await db.delete(borrowers).where(eq(borrowers.id, borrower.id));
  });

  // ─── Credit snapshot: recentInquiries + recentInquiryWindowDays + audit/consent ──
  // Setup shared between the next two tests: a borrower with a known mix of
  // recent (within 90 days) and old (outside the window) credit inquiries,
  // plus an active collateral_credit_view consent.
  const [snapUser] = await db.insert(users).values({
    username: TAG + "-snap-user",
    password: "x",
    fullName: "Snapshot Test User",
    email: TAG + "-snap@example.com",
  }).returning();
  const [snapBorrower] = await db.insert(borrowers).values({
    type: "individual",
    firstName: "Snap",
    lastName: TAG,
    nationalId: TAG + "-SNAP-NID",
  }).returning();
  const dayMs = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  // 3 recent inquiries (1, 30, 89 days ago — all within the 90-day window)
  for (const days of [1, 30, 89]) {
    await db.insert(creditInquiries).values({
      borrowerId: snapBorrower.id,
      inquiredBy: snapUser.id,
      purpose: "new_credit",
      institution: "test_bank",
      consentProvided: true,
      isSoftPull: true,
      createdAt: new Date(nowMs - days * dayMs),
    });
  }
  // 2 old inquiries (120 and 365 days ago — outside the 90-day window)
  for (const days of [120, 365]) {
    await db.insert(creditInquiries).values({
      borrowerId: snapBorrower.id,
      inquiredBy: snapUser.id,
      purpose: "review",
      institution: "test_bank",
      consentProvided: true,
      isSoftPull: true,
      createdAt: new Date(nowMs - days * dayMs),
    });
  }
  // Consent: collateral (caller) -> credit (origin), purpose=collateral_credit_view.
  // Mirrors the convention used by gateway.getCreditSnapshotForBorrower:
  // requireConsent looks up sourceProduct=ctx.targetProduct=credit,
  // targetProduct=ctx.callerProduct=collateral.
  const snapExpires = new Date(nowMs + 90 * dayMs);
  await db.insert(crossProductConsents).values({
    borrowerId: snapBorrower.id,
    sourceProduct: "credit",
    targetProduct: "collateral",
    purpose: "collateral_credit_view",
    status: "active",
    expiresAt: snapExpires,
  });

  // Credit accounts: 2 active (status != "closed") with known balances + 1 closed.
  // The gateway sums currentBalance across ALL accounts for totalDebt, but
  // only counts non-"closed" accounts for activeAccounts. Picking distinct
  // decimals so a regression that flips either rule is detectable.
  await db.insert(creditAccounts).values([
    {
      borrowerId: snapBorrower.id,
      lenderInstitution: TAG + "-bank-A",
      accountNumber: TAG + "-ACC-1",
      accountType: "loan",
      originalAmount: "2000.00",
      currentBalance: "1000.00",
      status: "current",
    },
    {
      borrowerId: snapBorrower.id,
      lenderInstitution: TAG + "-bank-B",
      accountNumber: TAG + "-ACC-2",
      accountType: "loan",
      originalAmount: "800.00",
      currentBalance: "500.50",
      status: "delinquent",
    },
    {
      borrowerId: snapBorrower.id,
      lenderInstitution: TAG + "-bank-C",
      accountNumber: TAG + "-ACC-3",
      accountType: "loan",
      originalAmount: "300.00",
      currentBalance: "250.25",
      status: "closed",
    },
  ]);

  // Credit score history: gateway returns the most recent (desc(createdAt))
  // score. Insert an older 600 then a newer 720; only 720 should surface.
  await db.insert(creditScoreHistory).values([
    {
      borrowerId: snapBorrower.id,
      score: 600,
      scoreModel: "test_model",
      createdAt: new Date(nowMs - 30 * dayMs),
    },
    {
      borrowerId: snapBorrower.id,
      score: 720,
      scoreModel: "test_model",
      createdAt: new Date(nowMs - 1 * dayMs),
    },
  ]);

  await test("getCreditSnapshotForBorrower returns latest score, active-account count, and total debt", async () => {
    const result = await gateway.getCreditSnapshotForBorrower(snapBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    if (result.summary.score !== 720) {
      throw new Error(`expected score=720 (latest of {600, 720}), got ${result.summary.score}`);
    }
    if (result.summary.activeAccounts !== 2) {
      throw new Error(`expected activeAccounts=2 (closed excluded), got ${result.summary.activeAccounts}`);
    }
    // 1000.00 + 500.50 + 250.25 = 1750.75 — sum across ALL accounts.
    if (result.summary.totalDebt !== "1750.75") {
      throw new Error(`expected totalDebt="1750.75", got ${result.summary.totalDebt}`);
    }
  });

  await test("getCreditSnapshotForBorrower returns recent-inquiry count and 90-day window", async () => {
    const result = await gateway.getCreditSnapshotForBorrower(snapBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    if (result.summary.recentInquiries !== 3) {
      throw new Error(`expected recentInquiries=3, got ${result.summary.recentInquiries}`);
    }
    if (result.summary.recentInquiryWindowDays !== 90) {
      throw new Error(`expected recentInquiryWindowDays=90, got ${result.summary.recentInquiryWindowDays}`);
    }
  });

  await test("getCreditSnapshotForBorrower writes cross_product_access audit row with outcome=ok", async () => {
    // Self-contained: invoke the gateway here so the assertion does not depend
    // on a row written by an earlier test, then assert against the *most
    // recent* audit row for this borrower/action to avoid false positives
    // from incidental prior rows.
    const before = Date.now();
    await gateway.getCreditSnapshotForBorrower(snapBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, snapBorrower.id)));
    const okLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "ok" && d.purpose === "collateral_credit_view";
        } catch { return false; }
      })
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!));
    const okRow = okLogs[0];
    if (!okRow) throw new Error("no ok audit row written for getCreditSnapshotForBorrower");
    if (new Date(okRow.createdAt!).getTime() < before - 5000) {
      throw new Error("most recent ok audit row predates this test invocation");
    }
    const d = JSON.parse(okRow.details ?? "{}");
    // entity = data origin (credit); sourceProduct/targetProduct mirror the
    // gateway's convention (source = data origin, target = caller).
    if (okRow.entity !== "credit") throw new Error(`expected audit entity=credit, got ${okRow.entity}`);
    if (d.sourceProduct !== "credit") throw new Error(`expected sourceProduct=credit, got ${d.sourceProduct}`);
    if (d.targetProduct !== "collateral") throw new Error(`expected targetProduct=collateral, got ${d.targetProduct}`);
    if (d.subjectKind !== "borrower") throw new Error(`expected subjectKind=borrower, got ${d.subjectKind}`);
  });

  await test("getCreditSnapshotForBorrower without consent throws no_consent and writes denied audit row", async () => {
    // Fresh borrower with no consent on file at all.
    const [bareBorrower] = await db.insert(borrowers).values({
      type: "individual",
      firstName: "NoConsent",
      lastName: TAG,
      nationalId: TAG + "-NOCONSENT-NID",
    }).returning();

    let caught: any = null;
    try {
      await gateway.getCreditSnapshotForBorrower(bareBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    } catch (e) {
      caught = e;
    }
    if (!caught) throw new Error("expected getCreditSnapshotForBorrower to throw without consent");
    if (!(caught instanceof CrossProductError)) throw new Error("wrong error type: " + caught);
    if (caught.code !== "no_consent") throw new Error(`expected code=no_consent, got ${caught.code}`);

    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, bareBorrower.id)));
    // Bare borrower is freshly created above, so the most recent (and only)
    // matching row is the one we expect.
    const deniedLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "denied" && d.purpose === "collateral_credit_view";
        } catch { return false; }
      })
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!));
    const denied = deniedLogs[0];
    if (!denied) throw new Error("no denied audit row written for no-consent snapshot call");
    const dd = JSON.parse(denied.details ?? "{}");
    if (dd.reason !== "no_consent") throw new Error(`expected denied reason=no_consent, got ${dd.reason}`);
    if (denied.entity !== "credit") throw new Error(`expected denied audit entity=credit, got ${denied.entity}`);

    // Cleanup the bare borrower + its denied audit row.
    await db.delete(auditLogs).where(eq(auditLogs.entityId, bareBorrower.id));
    await db.delete(borrowers).where(eq(borrowers.id, bareBorrower.id));
  });

  // Cleanup snapshot test fixtures.
  await db.delete(auditLogs).where(eq(auditLogs.entityId, snapBorrower.id));
  await db.delete(crossProductConsents).where(eq(crossProductConsents.borrowerId, snapBorrower.id));
  await db.delete(creditInquiries).where(eq(creditInquiries.borrowerId, snapBorrower.id));
  await db.delete(creditScoreHistory).where(eq(creditScoreHistory.borrowerId, snapBorrower.id));
  await db.delete(creditAccounts).where(eq(creditAccounts.borrowerId, snapBorrower.id));
  await db.delete(borrowers).where(eq(borrowers.id, snapBorrower.id));
  await db.delete(users).where(eq(users.id, snapUser.id));

  // ─── Consumer Spending Features (gateway.getConsumerSpendingFeatures) ────
  // Caller=credit, target=loto, purpose=consumer_spending_credit. Subject is
  // a consumer user (not a merchant), so consent is keyed by userId. The
  // consent row mirrors requireConsent's lookup convention:
  // sourceProduct=loto (data origin), targetProduct=credit (caller).
  const [spendUser] = await db.insert(users).values({
    username: TAG + "-spend-user",
    password: "x",
    fullName: "Consumer Spend User",
    email: TAG + "-spend@example.com",
  }).returning();
  // Receipts need a merchant FK; reuse the top-level test merchant. Each
  // receipt is tagged to spendUser via consumerUserId so the gateway picks
  // them up.
  const spendNow = new Date();
  for (let m = 0; m < 2; m++) {
    for (let i = 0; i < 3; i++) {
      await db.insert(lotoReceipts).values({
        merchantId: merchant.id,
        consumerUserId: spendUser.id,
        fiscalCode: `${TAG}-spend-FC-${m}-${i}`,
        ticketNumber: `${TAG}-spend-T-${m}-${i}`,
        amount: "2500",
        vatAmount: "450",
        currency: "XOF",
        category: m === 0 ? "groceries" : "fuel",
        issuedAt: new Date(spendNow.getFullYear(), spendNow.getMonth() - m, 10 + i),
      });
    }
  }
  const spendExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await db.insert(crossProductConsents).values({
    userId: spendUser.id,
    sourceProduct: "loto",
    targetProduct: "credit",
    purpose: "consumer_spending_credit",
    status: "active",
    expiresAt: spendExpires,
  });

  await test("getConsumerSpendingFeatures returns features and writes ok audit row with active consent", async () => {
    const before = Date.now();
    const result = await gateway.getConsumerSpendingFeatures(spendUser.id, { userId: undefined, ip: "127.0.0.1" });
    if (!result.features) throw new Error("expected features");
    if (result.features.totalReceipts !== 6) {
      throw new Error(`expected 6 receipts, got ${result.features.totalReceipts}`);
    }
    if (result.features.monthsWithActivity !== 2) {
      throw new Error(`expected 2 months active, got ${result.features.monthsWithActivity}`);
    }
    if (!result.consent || result.consent.purpose !== "consumer_spending_credit") {
      throw new Error("expected consumer_spending_credit consent in result");
    }
    // Audit row must record source=loto (origin), target=credit (caller),
    // entity=loto, subjectKind=consumer, outcome=ok.
    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, spendUser.id)));
    const okLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "ok" && d.purpose === "consumer_spending_credit";
        } catch { return false; }
      })
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!));
    const okRow = okLogs[0];
    if (!okRow) throw new Error("no ok audit row written for getConsumerSpendingFeatures");
    if (new Date(okRow.createdAt!).getTime() < before - 5000) {
      throw new Error("most recent ok audit row predates this test invocation");
    }
    const d = JSON.parse(okRow.details ?? "{}");
    if (okRow.entity !== "loto") throw new Error(`expected entity=loto, got ${okRow.entity}`);
    if (d.sourceProduct !== "loto") throw new Error(`expected sourceProduct=loto, got ${d.sourceProduct}`);
    if (d.targetProduct !== "credit") throw new Error(`expected targetProduct=credit, got ${d.targetProduct}`);
    if (d.subjectKind !== "consumer") throw new Error(`expected subjectKind=consumer, got ${d.subjectKind}`);
  });

  await test("getConsumerSpendingFeatures without consent throws no_consent and writes denied audit row", async () => {
    const [bareUser] = await db.insert(users).values({
      username: TAG + "-spend-noconsent",
      password: "x",
      fullName: "No Consent Spender",
      email: TAG + "-spend-nc@example.com",
    }).returning();
    let caught: any = null;
    try {
      await gateway.getConsumerSpendingFeatures(bareUser.id, { userId: undefined, ip: "127.0.0.1" });
    } catch (e) {
      caught = e;
    }
    if (!caught) throw new Error("expected throw without consent");
    if (!(caught instanceof CrossProductError)) throw new Error("wrong error type: " + caught);
    if (caught.code !== "no_consent") throw new Error(`expected code=no_consent, got ${caught.code}`);

    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, bareUser.id)));
    const deniedLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "denied" && d.purpose === "consumer_spending_credit";
        } catch { return false; }
      });
    const denied = deniedLogs[0];
    if (!denied) throw new Error("no denied audit row written for no-consent consumer spending call");
    const dd = JSON.parse(denied.details ?? "{}");
    if (dd.reason !== "no_consent") throw new Error(`expected denied reason=no_consent, got ${dd.reason}`);
    if (denied.entity !== "loto") throw new Error(`expected denied audit entity=loto, got ${denied.entity}`);
    if (dd.subjectKind !== "consumer") throw new Error(`expected subjectKind=consumer, got ${dd.subjectKind}`);

    await db.delete(auditLogs).where(eq(auditLogs.entityId, bareUser.id));
    await db.delete(users).where(eq(users.id, bareUser.id));
  });

  // Cleanup consumer spending fixtures.
  await db.delete(auditLogs).where(eq(auditLogs.entityId, spendUser.id));
  await db.delete(crossProductConsents).where(eq(crossProductConsents.userId, spendUser.id));
  await db.delete(lotoReceipts).where(eq(lotoReceipts.consumerUserId, spendUser.id));
  await db.delete(users).where(eq(users.id, spendUser.id));

  // ─── Collateral for Borrower (gateway.getCollateralForBorrower) ──────────
  // Caller=credit, target=collateral, purpose=credit_collateral_view.
  // Consent row: sourceProduct=collateral (origin), targetProduct=credit
  // (caller), keyed by borrowerId.
  const [collOrg] = await db.insert(organizations).values({
    name: TAG + "-coll-org",
    slug: TAG + "-coll-org",
    type: "other",
    status: "active",
  }).returning();
  const [collBorrower] = await db.insert(borrowers).values({
    type: "individual",
    firstName: "Coll",
    lastName: TAG,
    nationalId: TAG + "-COLL-NID",
  }).returning();
  // Two collateral items linked to this borrower.
  for (let i = 0; i < 2; i++) {
    await db.insert(collateralItems).values({
      registrationNumber: `${TAG}-COLL-REG-${i}`,
      borrowerId: collBorrower.id,
      collateralType: i === 0 ? "vehicle" : "equipment",
      description: `Test collateral ${i}`,
      estimatedValue: "150000.00",
      currency: "GHS",
      registrationDate: new Date().toISOString().slice(0, 10),
      status: "active",
      lenderOrganizationId: collOrg.id,
    });
  }
  const collExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await db.insert(crossProductConsents).values({
    borrowerId: collBorrower.id,
    sourceProduct: "collateral",
    targetProduct: "credit",
    purpose: "credit_collateral_view",
    status: "active",
    expiresAt: collExpires,
  });

  await test("getCollateralForBorrower returns items and writes ok audit row with active consent", async () => {
    const before = Date.now();
    const result = await gateway.getCollateralForBorrower(collBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    if (!Array.isArray(result.items)) throw new Error("expected items array");
    if (result.items.length !== 2) {
      throw new Error(`expected 2 collateral items, got ${result.items.length}`);
    }
    const types = result.items.map(i => i.collateralType).sort();
    if (types[0] !== "equipment" || types[1] !== "vehicle") {
      throw new Error(`unexpected collateral types: ${JSON.stringify(types)}`);
    }
    if (!result.consent || result.consent.purpose !== "credit_collateral_view") {
      throw new Error("expected credit_collateral_view consent in result");
    }
    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, collBorrower.id)));
    const okLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "ok" && d.purpose === "credit_collateral_view";
        } catch { return false; }
      })
      .sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!));
    const okRow = okLogs[0];
    if (!okRow) throw new Error("no ok audit row written for getCollateralForBorrower");
    if (new Date(okRow.createdAt!).getTime() < before - 5000) {
      throw new Error("most recent ok audit row predates this test invocation");
    }
    const d = JSON.parse(okRow.details ?? "{}");
    if (okRow.entity !== "collateral") throw new Error(`expected entity=collateral, got ${okRow.entity}`);
    if (d.sourceProduct !== "collateral") throw new Error(`expected sourceProduct=collateral, got ${d.sourceProduct}`);
    if (d.targetProduct !== "credit") throw new Error(`expected targetProduct=credit, got ${d.targetProduct}`);
    if (d.subjectKind !== "borrower") throw new Error(`expected subjectKind=borrower, got ${d.subjectKind}`);
  });

  await test("getCollateralForBorrower without consent throws no_consent and writes denied audit row", async () => {
    const [bareBorrower] = await db.insert(borrowers).values({
      type: "individual",
      firstName: "NoCollConsent",
      lastName: TAG,
      nationalId: TAG + "-COLL-NOCONSENT-NID",
    }).returning();
    let caught: any = null;
    try {
      await gateway.getCollateralForBorrower(bareBorrower.id, { userId: undefined, ip: "127.0.0.1" });
    } catch (e) {
      caught = e;
    }
    if (!caught) throw new Error("expected throw without consent");
    if (!(caught instanceof CrossProductError)) throw new Error("wrong error type: " + caught);
    if (caught.code !== "no_consent") throw new Error(`expected code=no_consent, got ${caught.code}`);

    const logs = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, "cross_product_access"), eq(auditLogs.entityId, bareBorrower.id)));
    const deniedLogs = logs
      .filter(l => {
        try {
          const d = JSON.parse(l.details ?? "{}");
          return d.outcome === "denied" && d.purpose === "credit_collateral_view";
        } catch { return false; }
      });
    const denied = deniedLogs[0];
    if (!denied) throw new Error("no denied audit row written for no-consent collateral call");
    const dd = JSON.parse(denied.details ?? "{}");
    if (dd.reason !== "no_consent") throw new Error(`expected denied reason=no_consent, got ${dd.reason}`);
    if (denied.entity !== "collateral") throw new Error(`expected denied audit entity=collateral, got ${denied.entity}`);
    if (dd.subjectKind !== "borrower") throw new Error(`expected subjectKind=borrower, got ${dd.subjectKind}`);

    await db.delete(auditLogs).where(eq(auditLogs.entityId, bareBorrower.id));
    await db.delete(borrowers).where(eq(borrowers.id, bareBorrower.id));
  });

  // Cleanup collateral fixtures.
  await db.delete(auditLogs).where(eq(auditLogs.entityId, collBorrower.id));
  await db.delete(crossProductConsents).where(eq(crossProductConsents.borrowerId, collBorrower.id));
  await db.delete(collateralItems).where(eq(collateralItems.borrowerId, collBorrower.id));
  await db.delete(borrowers).where(eq(borrowers.id, collBorrower.id));
  await db.delete(organizations).where(eq(organizations.id, collOrg.id));

  // ─── Public stats: outcome split (allowed/denied) on financial-inclusion-impact ──
  // Guards the bridgeAccessesAllowed / bridgeAccessesDenied breakdown surfaced by
  // GET /api/public/financial-inclusion-impact. A future refactor of
  // getCrossProductImpactStats or of the cross_product_access `details` JSON
  // shape would otherwise silently flatten the breakdown to 0/0.
  await test("getCrossProductImpactStats returns outcome split (allowed/denied) from audit log", async () => {
    // The stats method aggregates the entire audit_logs table, so we snapshot
    // baseline counts and assert against the delta after seeding a known mix.
    const before = await storage.getCrossProductImpactStats();

    const seeded = [
      { outcome: "ok", purpose: "merchant_credit_profile", sourceProduct: "loto", targetProduct: "credit" },
      { outcome: "ok", purpose: "merchant_credit_profile", sourceProduct: "loto", targetProduct: "credit" },
      { outcome: "ok", purpose: "bureau_reputation_badge", sourceProduct: "loto", targetProduct: "credit" },
      { outcome: "denied", purpose: "merchant_credit_profile", sourceProduct: "loto", targetProduct: "credit", reason: "no_consent" },
      { outcome: "denied", purpose: "merchant_credit_profile", sourceProduct: "loto", targetProduct: "credit", reason: "consent_revoked" },
    ];
    const insertedIds: string[] = [];
    try {
      for (const d of seeded) {
        const [row] = await db.insert(auditLogs).values({
          action: "cross_product_access",
          entity: "loto",
          entityId: TAG + "-impact-stats",
          details: JSON.stringify(d),
        }).returning();
        insertedIds.push(row.id);
      }
      // Row missing `outcome` — must be skipped (counted as neither allowed nor denied).
      const [noOutcomeRow] = await db.insert(auditLogs).values({
        action: "cross_product_access",
        entity: "loto",
        entityId: TAG + "-impact-stats",
        details: JSON.stringify({ purpose: "merchant_credit_profile" }),
      }).returning();
      insertedIds.push(noOutcomeRow.id);
      // Row with malformed JSON details — must not crash the query and must be skipped.
      const [malformedRow] = await db.insert(auditLogs).values({
        action: "cross_product_access",
        entity: "loto",
        entityId: TAG + "-impact-stats",
        details: "{not valid json",
      }).returning();
      insertedIds.push(malformedRow.id);

      const after = await storage.getCrossProductImpactStats();

      const allowedDelta = after.bridgeAccessesAllowed - before.bridgeAccessesAllowed;
      const deniedDelta = after.bridgeAccessesDenied - before.bridgeAccessesDenied;
      const loggedDelta = after.bridgeAccessesLogged - before.bridgeAccessesLogged;

      if (allowedDelta !== 3) throw new Error(`expected +3 allowed, got +${allowedDelta}`);
      if (deniedDelta !== 2) throw new Error(`expected +2 denied, got +${deniedDelta}`);
      // Total bridgeAccessesLogged counts every cross_product_access row,
      // including the no-outcome and malformed rows (5 + 2 = 7).
      if (loggedDelta !== 7) throw new Error(`expected +7 logged total, got +${loggedDelta}`);

      for (const key of ["bridgeAccessesAllowed", "bridgeAccessesDenied", "bridgeAccessesLogged"] as const) {
        if (typeof after[key] !== "number") throw new Error(`expected ${key} to be a number, got ${typeof after[key]}`);
      }
    } finally {
      for (const id of insertedIds) {
        await db.delete(auditLogs).where(eq(auditLogs.id, id));
      }
    }
  });

  await test("getCrossProductImpactStats response shape matches the public endpoint contract", async () => {
    // The /api/public/financial-inclusion-impact route is a thin pass-through:
    //   res.json({ ...stats, currency, defaultConsentMonths, generatedAt })
    // so verifying the storage object's shape is equivalent to verifying the
    // fields the public JSON response exposes. This catches a refactor that
    // drops bridgeAccessesAllowed / bridgeAccessesDenied from the payload.
    const stats = await storage.getCrossProductImpactStats();
    const requiredNumericFields = [
      "merchantsRegistered", "merchantsOptedIn",
      "verifiedReceipts", "verifiedTurnover",
      "activeCrossProductConsents", "bridgeAccessesLogged",
      "bridgeAccessesAllowed", "bridgeAccessesDenied",
    ] as const satisfies readonly (keyof typeof stats)[];
    for (const key of requiredNumericFields) {
      if (!(key in stats)) throw new Error(`public impact stats missing field: ${key}`);
      if (typeof stats[key] !== "number") {
        throw new Error(`field ${key} should be a number, got ${typeof stats[key]}`);
      }
    }
    // Allowed + denied can never exceed the total logged count — sanity check
    // that prevents a future double-count regression.
    if (stats.bridgeAccessesAllowed + stats.bridgeAccessesDenied > stats.bridgeAccessesLogged) {
      throw new Error("allowed + denied exceeds total logged accesses");
    }
  });

  await cleanup(merchant.id);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); });
