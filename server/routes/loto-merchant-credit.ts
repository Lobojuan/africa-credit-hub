/**
 * Loto Fiscal — Merchant Credit Profile Router
 *
 * Mounted at /api/loto in routes.ts (with requireAuth applied at mount time).
 *
 * Endpoints:
 *   GET  /merchants/:merchantId/credit-breakdown
 *   POST /merchants/me/credit-opt-in    (unified toggle: enable=true|false)
 *   POST /merchants/me/credit-opt-out   (thin wrapper)
 *   POST /merchant/credit-opt-in        (singular alias)
 *   POST /merchant/credit-opt-out       (singular alias)
 *   POST /consumers/me/credit-opt-in    (consumer credit bridge unified toggle)
 *   POST /consumers/me/credit-opt-out   (thin wrapper)
 *
 * Access rules for credit-breakdown:
 *   - Merchant owner (merchant.userId === session.userId): always allowed
 *   - platform_owner / super_admin: always allowed
 *   - lender / regulator / admin: allowed only when merchant has an active
 *     merchant_credit_profile consent (merchant opted in to sharing)
 *   - Any other role: 403 access_denied
 *
 * Credit score contribution (credit-breakdown):
 *   Sourced from the persisted rawScore in alternative_data (written by
 *   buildMerchantAltData at opt-in time). Falls back to a live complianceScore
 *   when no record exists (not opted in or just purged).
 *   Source label: "Loto Fiscal Compliance" — matches the provider value stored
 *   in the alternative_data row so UCH credit reports render the correct name.
 *
 * On-time ratio:
 *   Uses unique flagged receiptIds (Set dedup) so one receipt with N open flags
 *   still counts as exactly 1 late transaction. Clamped to [0, 1].
 */

import { Router, Request, Response } from "express";
import type { Session, SessionData } from "express-session";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  lotoReceipts,
  lotoFraudFlags,
  alternativeData,
  borrowers,
  type AlternativeData,
} from "@shared/schema";
import { isPlatformPrivileged } from "./middleware";
import { computeMerchantComplianceScore } from "../loto-fraud-rules";
import {
  buildMerchantAltData,
  purgeMerchantAltData,
  buildFiscalReceiptsAltData,
  purgeFiscalReceiptsAltData,
  normaliseBorrowerCountry,
  PipelineCountryError,
} from "../loto-credit-pipeline";

// Express session is augmented in server/index.ts — SessionData has userId, userRole, etc.
type TypedSession = Session & Partial<SessionData>;

const router = Router();

function safeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ─── POST /merchants/me/credit-opt-in  (unified toggle + backward-compat alias) ─
//
// The "Build Credit" toggle in the Loto workspace sends `{ enable: boolean }` to
// this single endpoint for both opt-in and opt-out. Backward-compatible with the
// older two-endpoint API: callers may also use `/merchants/me/credit-opt-out`
// (kept below) or the singular alias `/merchant/credit-opt-in` added at the end
// of this file for task-spec compatibility.
//
// When enable === true (or omitted — defaults to true):
//   1. Sets loto_merchants.credit_opt_in_active = true
//   2. Creates an active merchant_credit_profile consent in cross_product_consents
//      (expires in 1 year; renewable by the nightly refresh job)
//   3. Runs the compliance pipeline to upsert the alternative_data record
//      (source="merchant", provider="loto_fiscal_{cc}", rawScore, metadata.displayLabel)
//
// When enable === false:
//   1. Revokes all active merchant_credit_profile consents (access gate blocks
//      third-party reads immediately — before the alt-data purge)
//   2. Sets loto_merchants.credit_opt_in_active = false
//   3. Purges the alternative_data record (source="merchant") for the linked borrower
//
// Response:
//   opt-in:  { optInActive: true,  altDataInserted: boolean, consentId: string }
//   opt-out: { optInActive: false, altDataPurged: number, consentsRevoked: number }

async function handleMerchantOptIn(
  req: Request,
  res: Response,
  forceEnable?: boolean,
): Promise<void> {
  try {
    const session = req.session as TypedSession;
    const userId = session.userId;
    if (!userId) { res.status(401).json({ message: "unauthenticated" }); return; }

    const merchant = await storage.getLotoMerchantByUserId(userId);
    if (!merchant) { res.status(404).json({ message: "merchant_not_found" }); return; }

    const merchantRecord = merchant as {
      id: string;
      countryCode: string;
      borrowerId: string | null;
      userId: string;
    };

    // Determine intent. Defaults to enable=true when body is absent.
    // Guard: when called as a plain route handler Express passes `next` as the
    // third argument. Use typeof to avoid treating a function as the flag.
    const enable = typeof forceEnable === "boolean" ? forceEnable : (req.body?.enable !== false);

    if (enable) {
      // ── OPT-IN ──────────────────────────────────────────────────────────────
      await storage.updateLotoMerchantOptIn(merchantRecord.id, true);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const baseConsent = {
        userId,
        merchantId: merchantRecord.id,
        borrowerId: merchantRecord.borrowerId ?? undefined,
        sourceProduct: "loto" as const,
        targetProduct: "credit" as const,
        status: "active" as const,
        expiresAt,
        grantedByIp: req.ip ?? null,
      };

      // Opt-in creates TWO consent purposes that flow from the same merchant decision:
      //   1. merchant_credit_profile  — lenders may pull verified VAT receipt history
      //      into the bureau credit profile (and into alternative_data scoring).
      //   2. bureau_reputation_badge  — the local-tax-authority Bureau Reputation Badge
      //      (tier / receipts / active months) can be issued to the merchant's workspace
      //      and exposed on lender views. Both are revoked together on opt-out.
      const consent = await storage.createCrossProductConsent({
        ...baseConsent,
        purpose: "merchant_credit_profile",
        scopeNote: "Merchant opted in to sharing Loto Fiscal compliance data with credit bureau",
      });
      await storage.createCrossProductConsent({
        ...baseConsent,
        purpose: "bureau_reputation_badge",
        scopeNote: "Merchant opted in to issuing the local Bureau Reputation Badge from verified VAT receipts",
      });

      let altDataInserted = false;
      try {
        const result = await buildMerchantAltData(merchantRecord.id, merchantRecord.countryCode);
        altDataInserted = result.inserted;
      } catch (pipeErr) {
        // PipelineCountryError = no borrower link yet / country mismatch.
        // Opt-in still succeeds — the nightly refresh inserts alt-data once linked.
        if (!(pipeErr instanceof PipelineCountryError)) throw pipeErr;
      }

      res.json({ optInActive: true, altDataInserted, consentId: consent.id });
    } else {
      // ── OPT-OUT ─────────────────────────────────────────────────────────────
      // Revoke consent FIRST so access gate blocks third-party reads immediately,
      // even before the alternative_data purge completes.
      const activeConsents = await storage.getCrossProductConsents({ merchantId: merchantRecord.id });
      const typedConsents = activeConsents as Array<{ id: string; purpose: string; status: string }>;
      // Revoke BOTH purposes that opt-in created (merchant_credit_profile + bureau_reputation_badge).
      const REVOCABLE_PURPOSES = new Set(["merchant_credit_profile", "bureau_reputation_badge"]);
      const toRevoke = typedConsents.filter(
        c => REVOCABLE_PURPOSES.has(c.purpose) && c.status === "active",
      );
      await Promise.all(toRevoke.map(c => storage.revokeCrossProductConsent(c.id, "merchant_opted_out")));

      await storage.updateLotoMerchantOptIn(merchantRecord.id, false);

      let altDataPurged = 0;
      if (merchantRecord.borrowerId) {
        altDataPurged = await purgeMerchantAltData(merchantRecord.borrowerId);
      }

      res.json({ optInActive: false, altDataPurged, consentsRevoked: toRevoke.length });
    }
  } catch (e) {
    res.status(500).json({ message: safeError(e) });
  }
}

router.post("/merchants/me/credit-opt-in", handleMerchantOptIn);

// ─── POST /merchants/me/credit-opt-out ────────────────────────────────────────
// Explicit opt-out endpoint (thin wrapper around handleMerchantOptIn with
// forceEnable=false). Retained for backward-compatibility with clients that call
// the two distinct endpoints instead of the unified toggle.
router.post("/merchants/me/credit-opt-out", (req: Request, res: Response) => {
  return handleMerchantOptIn(req, res, false);
});

// ─── Singular aliases: /merchant/credit-opt-in and /merchant/credit-opt-out ───
// The task spec defines paths without the trailing 's' on "merchant".
// Both aliases proxy to the same unified handleMerchantOptIn toggle.
router.post("/merchant/credit-opt-in", handleMerchantOptIn);
router.post("/merchant/credit-opt-out", (req: Request, res: Response) => {
  return handleMerchantOptIn(req, res, false);
});

// ─── GET /merchants/:merchantId/credit-breakdown ──────────────────────────────

router.get("/merchants/:merchantId/credit-breakdown", async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const session = req.session as TypedSession;
    const userId = session.userId;
    const userRole = session.userRole ?? "";
    if (!userId) return res.status(401).json({ message: "unauthenticated" });

    const merchant = await storage.getLotoMerchantById(merchantId);
    if (!merchant) return res.status(404).json({ message: "merchant_not_found" });

    const merchantRecord = merchant as {
      id: string;
      shopName: string;
      countryCode: string;
      currency: string;
      creditOptInActive: boolean;
      borrowerId: string | null;
      userId: string;
    };

    const isOwner = merchantRecord.userId === userId;
    const isPlatformAdmin = isPlatformPrivileged(userRole);

    if (!isOwner && !isPlatformAdmin) {
      const isPrivilegedRole =
        userRole === "lender" || userRole === "regulator" || userRole === "admin";
      if (!isPrivilegedRole) {
        return res.status(403).json({ message: "access_denied" });
      }
      const consents = await storage.getCrossProductConsents({ merchantId });
      const typedConsents = consents as Array<{ purpose: string; status: string }>;
      const hasActiveConsent = typedConsents.some(
        c => c.purpose === "merchant_credit_profile" && c.status === "active",
      );
      if (!hasActiveConsent) {
        return res.status(403).json({ message: "no_active_merchant_consent" });
      }
    }

    const receipts = await db
      .select({
        id: lotoReceipts.id,
        vatAmount: lotoReceipts.vatAmount,
        currency: lotoReceipts.currency,
        issuedAt: lotoReceipts.issuedAt,
        category: lotoReceipts.category,
      })
      .from(lotoReceipts)
      .where(and(eq(lotoReceipts.merchantId, merchantId), eq(lotoReceipts.isDemo, false)));

    const allFlags = await db
      .select({
        id: lotoFraudFlags.id,
        ruleCode: lotoFraudFlags.ruleCode,
        severity: lotoFraudFlags.severity,
        summary: lotoFraudFlags.summary,
        status: lotoFraudFlags.status,
        receiptId: lotoFraudFlags.receiptId,
      })
      .from(lotoFraudFlags)
      .where(eq(lotoFraudFlags.merchantId, merchantId));

    const openFlags = allFlags.filter(f => f.status === "open");
    const openFraudFlagsCount = openFlags.length;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const sixtyDaysAgo = now - 60 * 86400000;

    const lastReceiptTs = receipts.length > 0
      ? receipts.reduce((l, r) => Math.max(l, new Date(r.issuedAt).getTime()), 0)
      : null;
    const daysSinceLastReceipt = lastReceiptTs
      ? Math.floor((now - lastReceiptTs) / 86400000)
      : 999;
    const receiptsLast30Days = receipts.filter(
      r => new Date(r.issuedAt).getTime() >= thirtyDaysAgo,
    ).length;
    const receiptsPrev30Days = receipts.filter(r => {
      const t = new Date(r.issuedAt).getTime();
      return t >= sixtyDaysAgo && t < thirtyDaysAgo;
    }).length;
    const monthOverMonthDeltaPct =
      receiptsPrev30Days > 0
        ? ((receiptsLast30Days - receiptsPrev30Days) / receiptsPrev30Days) * 100
        : receiptsLast30Days > 0
        ? 50
        : 0;
    const categoryDiversity = new Set(receipts.map(r => r.category).filter(Boolean)).size;

    const { score: complianceScore, breakdown: complianceBreakdown } =
      computeMerchantComplianceScore({
        daysSinceLastReceipt,
        receiptsLast30Days,
        monthOverMonthDeltaPct,
        categoryDiversity,
        openFraudFlags: openFraudFlagsCount,
      });

    const monthBuckets: Record<string, number> = {};
    for (const r of receipts) {
      const d = new Date(r.issuedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[key] = (monthBuckets[key] ?? 0) + parseFloat(String(r.vatAmount ?? 0));
    }
    const vatTrend: { month: string; vat: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      vatTrend.push({ month: key, vat: monthBuckets[key] ?? 0 });
    }

    const FRAUD_RULES = [
      "DUPLICATE_FISCAL_CODE",
      "STRUCTURED_SUBTHRESHOLD",
      "GHOST_MERCHANT",
      "ABNORMAL_HOUR",
      "SINGLE_DEVICE_BURST",
    ];
    const activeRuleCodes = new Set(openFlags.map(f => f.ruleCode));
    const fraudRuleResults = FRAUD_RULES.map(rule => ({
      ruleCode: rule,
      pass: !activeRuleCodes.has(rule),
      flag: allFlags.find(f => f.ruleCode === rule) ?? null,
    }));

    // Fetch the persisted alternative_data record written by buildMerchantAltData at opt-in.
    let altDataRecord: AlternativeData | null = null;
    if (merchantRecord.borrowerId) {
      const [altRow] = await db
        .select()
        .from(alternativeData)
        .where(
          and(
            eq(alternativeData.borrowerId, merchantRecord.borrowerId),
            eq(alternativeData.source, "merchant"),
          ),
        )
        .limit(1);
      altDataRecord = altRow ?? null;
    }

    // On-time ratio: unique flagged receiptIds — one receipt with N flags = 1 late payment.
    // Clamped to [0, 1] to prevent negative values.
    const flaggedReceiptIds = new Set(
      openFlags.map(f => f.receiptId).filter((id): id is string => Boolean(id)),
    );
    const onTimeCount = Math.max(0, receipts.length - flaggedReceiptIds.size);
    const altOnTimeRatio =
      receipts.length > 0
        ? Math.min(1, Math.max(0, onTimeCount / receipts.length))
        : 0;

    // rawScore: prefer the persisted value (written at opt-in by buildMerchantAltData).
    // Falls back to live complianceScore when no record is present.
    const rawScore: number =
      typeof altDataRecord?.rawScore === "number" ? altDataRecord.rawScore : complianceScore;

    // Display label: prefer metadata.displayLabel (set by buildMerchantAltData) so the
    // human-readable bureau name is consistent across breakdown, credit report, and PDF.
    // Falls back to the machine provider identifier (e.g. "loto_fiscal_ci") when the
    // persisted record predates the metadata field.
    // altDataRecord.metadata is typed as `unknown` (jsonb) by Drizzle — one cast to
    // the known shape is sufficient.
    type AltDataMetadata = { displayLabel?: string } | null | undefined;
    const altDataMeta = altDataRecord?.metadata as AltDataMetadata;
    const sourceDisplayLabel = altDataMeta?.displayLabel ?? altDataRecord?.provider ?? "Loto Fiscal Compliance";

    // Max contribution is +30 pts. Compliance score is 0–90 scale.
    const altDataBonus = Math.round(Math.min(90, Math.max(0, rawScore)) / 90 * 30);
    const creditScoreContribution = {
      altDataBonus,
      source: sourceDisplayLabel,
      onTimeRatio: Math.round(altOnTimeRatio * 100),
      rawScore,
      description:
        "Merchant compliance score contribution to business credit profile (max +30 pts)",
      persisted: altDataRecord !== null,
    };

    // e-Impots / DGI verification fields from persisted metadata
    type FullMeta = { displayLabel?: string; verifiedByAuthority?: boolean | null; authorityName?: string | null; fiscalVerificationAdapter?: string | null } | null | undefined;
    const fullMeta = altDataRecord?.metadata as FullMeta;

    res.json({
      merchant: {
        id: merchantRecord.id,
        shopName: merchantRecord.shopName,
        countryCode: merchantRecord.countryCode,
        currency: merchantRecord.currency,
        creditOptInActive: merchantRecord.creditOptInActive,
        borrowerId: merchantRecord.borrowerId,
        fiscalId: (merchantRecord as any).fiscalId ?? null,
        fiscalIdVerified: (merchantRecord as any).fiscalIdVerified ?? false,
      },
      complianceScore,
      complianceBreakdown,
      vatTrend,
      fraudRuleResults,
      openFraudFlags: openFlags,
      altDataRecord,
      creditScoreContribution,
      receiptCount: receipts.length,
      // e-Impots verification status — sourced from the persisted metadata so the UI
      // can show a "DGI Verified" badge without an extra API call.
      fiscalVerification: {
        verifiedByAuthority: fullMeta?.verifiedByAuthority ?? null,
        authorityName: fullMeta?.authorityName ?? null,
        adapter: fullMeta?.fiscalVerificationAdapter ?? null,
      },
    });
  } catch (e) {
    res.status(500).json({ message: safeError(e) });
  }
});

// ─── Consumer credit bridge ───────────────────────────────────────────────────
//
// POST /consumers/me/credit-opt-in  (unified toggle: enable=true|false)
// POST /consumers/me/credit-opt-out (thin wrapper → enable=false)
//
// Consumers (Loto Fiscal ticket-buyers) can opt in to share their verified
// fiscal receipt history as alternative data for their personal credit score.
//
// When enable === true (opt-in):
//   1. Resolves the linked borrower record by matching session user email.
//   2. Creates fiscal_receipts_credit + consumer_spending_credit consents
//      (12-month expiry, renewable by nightly refresh).
//   3. Runs buildFiscalReceiptsAltData to immediately upsert the aggregate.
//
// When enable === false (opt-out):
//   1. Revokes ALL active fiscal_receipts_credit + consumer_spending_credit consents.
//   2. Purges the alternative_data record (source="fiscal_receipts") for the borrower.
//
// Response:
//   opt-in:  { optInActive: true,  altDataInserted: boolean, borrowerId: string }
//   opt-out: { optInActive: false, altDataPurged: number, consentsRevoked: number }

const CONSUMER_REVOCABLE_PURPOSES = new Set([
  "fiscal_receipts_credit",
  "consumer_spending_credit",
]);

async function handleConsumerOptIn(
  req: Request,
  res: Response,
  forceEnable?: boolean,
): Promise<void> {
  try {
    const session = req.session as TypedSession;
    const userId = session.userId;
    if (!userId) { res.status(401).json({ message: "unauthenticated" }); return; }

    // Resolve borrower by email matching (same pattern as routes.ts findBorrowerForUser).
    const user = await storage.getUser(userId);
    if (!user?.email) { res.status(404).json({ message: "no_user_email" }); return; }
    const [borrower] = await db
      .select()
      .from(borrowers)
      .where(eq(borrowers.email, user.email))
      .limit(1);

    const enable = typeof forceEnable === "boolean" ? forceEnable : (req.body?.enable !== false);

    if (enable) {
      // ── OPT-IN ──────────────────────────────────────────────────────────────
      if (!borrower) {
        res.status(404).json({ message: "no_linked_borrower" });
        return;
      }

      const resolvedCountryCode = normaliseBorrowerCountry(borrower.country);
      if (!resolvedCountryCode) {
        res.status(400).json({ message: "borrower_country_unresolvable" });
        return;
      }

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const baseConsent = {
        userId,
        borrowerId: borrower.id,
        merchantId: undefined as string | undefined,
        sourceProduct: "loto" as const,
        targetProduct: "credit" as const,
        status: "active" as const,
        expiresAt,
        grantedByIp: req.ip ?? null,
      };

      // Two consent purposes mirroring the merchant pattern:
      //   1. fiscal_receipts_credit  — receipt history feeds credit score (primary)
      //   2. consumer_spending_credit — spending insights gate for gateway checks
      await storage.createCrossProductConsent({
        ...baseConsent,
        purpose: "fiscal_receipts_credit",
        scopeNote: "Consumer opted in to share Loto Fiscal receipt history with credit bureau",
      });
      await storage.createCrossProductConsent({
        ...baseConsent,
        purpose: "consumer_spending_credit",
        scopeNote: "Consumer opted in to share verified spending insights with credit bureau",
      });

      let altDataInserted = false;
      try {
        const result = await buildFiscalReceiptsAltData(
          userId,
          borrower.id,
          resolvedCountryCode,
          borrower.country,
        );
        altDataInserted = result.inserted;
      } catch (pipeErr) {
        if (!(pipeErr instanceof PipelineCountryError)) throw pipeErr;
        // Country mismatch (or no receipts yet) — opt-in still succeeds;
        // nightly refresh will populate alt-data once receipts arrive.
      }

      res.json({ optInActive: true, altDataInserted, borrowerId: borrower.id });
    } else {
      // ── OPT-OUT ─────────────────────────────────────────────────────────────
      // Revoke consents first so the access gate blocks immediately.
      const activeConsents = await storage.getCrossProductConsents({ userId });
      const typedConsents = activeConsents as Array<{ id: string; purpose: string; status: string }>;
      const toRevoke = typedConsents.filter(
        c => CONSUMER_REVOCABLE_PURPOSES.has(c.purpose) && c.status === "active",
      );
      await Promise.all(toRevoke.map(c => storage.revokeCrossProductConsent(c.id, "consumer_opted_out")));

      let altDataPurged = 0;
      if (borrower?.id) {
        altDataPurged = await purgeFiscalReceiptsAltData(borrower.id);
      }

      res.json({ optInActive: false, altDataPurged, consentsRevoked: toRevoke.length });
    }
  } catch (e) {
    res.status(500).json({ message: safeError(e) });
  }
}

router.post("/consumers/me/credit-opt-in", handleConsumerOptIn);
router.post("/consumers/me/credit-opt-out", (req: Request, res: Response) => {
  return handleConsumerOptIn(req, res, false);
});

export default router;
