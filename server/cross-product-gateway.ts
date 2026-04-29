/**
 * CROSS-PRODUCT DATA BRIDGE — Single point of consent enforcement and audit
 * for every data flow between Credit Bureau, Collateral Registry, and Loto Fiscal.
 *
 * RULES (enforced at the gateway, not the call sites):
 * 1. Every cross-product read MUST go through this module. No exceptions.
 * 2. Every call validates an active, non-expired, purpose-matched consent.
 * 3. Every call writes an audit_logs row tagged action="cross_product_access".
 * 4. The gateway does not silently fall back. Missing consent => CrossProductError.
 *
 * Lint convention: any cross-product import outside this file is a code review
 * red flag (e.g. importing loto_receipts inside server/credit-* without going
 * through gateway.getMerchantReceiptFeatures() defeats the purpose).
 */

import { db } from "./db";
import { eq, and, or, gte, lte, sql, desc, isNull, inArray } from "drizzle-orm";
import {
  crossProductConsents,
  lotoMerchants,
  lotoReceipts,
  alternativeData,
  auditLogs,
  borrowers,
  collateralItems,
  creditAccounts,
  creditScoreHistory,
  creditInquiries,
  type CrossProductConsent,
  type LotoMerchant,
  type LotoReceipt,
  type CollateralItem,
} from "@shared/schema";

export type ProductId = "loto" | "credit" | "collateral";
export type CrossProductPurpose =
  | "merchant_credit_profile"
  | "consumer_spending_credit"
  | "bureau_reputation_badge"
  | "collateral_credit_view"
  | "credit_collateral_view";

export const DEFAULT_CONSENT_DURATION_MONTHS = 12;

export class CrossProductError extends Error {
  code: "no_consent" | "consent_expired" | "consent_revoked" | "wrong_purpose" | "subject_not_found";
  constructor(code: CrossProductError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

interface GatewayCallContext {
  callerProduct: ProductId;
  targetProduct: ProductId;
  purpose: CrossProductPurpose;
  userId?: string;            // session user making the call (for audit)
  ip?: string;
}

interface SubjectRef {
  borrowerId?: string;
  merchantId?: string;
  consumerUserId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT CHECKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the most recent matching consent row REGARDLESS of status/expiry,
 * so the caller can produce an explicit `no_consent` vs `consent_revoked`
 * vs `consent_expired` denial reason. Filtering happens in `requireConsent`.
 */
async function findLatestMatchingConsent(
  subject: SubjectRef,
  source: ProductId,
  target: ProductId,
  purpose: CrossProductPurpose,
): Promise<CrossProductConsent | null> {
  const subjectConditions = [];
  if (subject.borrowerId) subjectConditions.push(eq(crossProductConsents.borrowerId, subject.borrowerId));
  if (subject.merchantId) subjectConditions.push(eq(crossProductConsents.merchantId, subject.merchantId));
  if (subject.consumerUserId) subjectConditions.push(eq(crossProductConsents.userId, subject.consumerUserId));
  if (subjectConditions.length === 0) return null;

  const [row] = await db.select().from(crossProductConsents).where(
    and(
      or(...subjectConditions),
      eq(crossProductConsents.sourceProduct, source),
      eq(crossProductConsents.targetProduct, target),
      eq(crossProductConsents.purpose, purpose),
    )
  ).orderBy(desc(crossProductConsents.grantedAt)).limit(1);

  return row ?? null;
}

/**
 * Returns the most recent ACTIVE+UNEXPIRED consent for the (subject, source,
 * target, purpose) tuple. Used by callers that only care about happy-path
 * authorization, not denial-reason classification.
 */
async function findActiveConsent(
  subject: SubjectRef,
  source: ProductId,
  target: ProductId,
  purpose: CrossProductPurpose,
): Promise<CrossProductConsent | null> {
  const latest = await findLatestMatchingConsent(subject, source, target, purpose);
  if (!latest) return null;
  if (latest.status !== "active") return null;
  if (latest.expiresAt && latest.expiresAt < new Date()) return null;
  return latest;
}

async function logAccess(
  ctx: GatewayCallContext,
  consent: CrossProductConsent | null,
  subject: SubjectRef,
  outcome: "ok" | "denied",
  reason?: string,
) {
  const subjectId = subject.borrowerId ?? subject.merchantId ?? subject.consumerUserId ?? "unknown";
  // Convention (kept consistent with consent rows): source = data origin
  // (the product whose data is being read = ctx.targetProduct), target =
  // data consumer (the product asking = ctx.callerProduct).
  const details = JSON.stringify({
    sourceProduct: ctx.targetProduct,
    targetProduct: ctx.callerProduct,
    purpose: ctx.purpose,
    consentId: consent?.id ?? null,
    outcome,
    reason: reason ?? null,
    subjectKind: subject.borrowerId ? "borrower" : subject.merchantId ? "merchant" : "consumer",
  });
  try {
    await db.insert(auditLogs).values({
      userId: ctx.userId ?? null,
      action: "cross_product_access",
      entity: ctx.targetProduct, // entity = the product whose data was accessed (origin)
      entityId: subjectId,
      details,
      ipAddress: ctx.ip ?? null,
    });
  } catch (err) {
    console.error("[gateway] audit log write failed", err);
  }
}

async function requireConsent(
  ctx: GatewayCallContext,
  subject: SubjectRef,
): Promise<CrossProductConsent> {
  // Convention: source = data origin (the product that holds the data), target = data consumer (the caller).
  // ctx.targetProduct is the product whose data we're reading; ctx.callerProduct is the product asking.
  // We look up the LATEST matching consent (any status) so we can classify the
  // denial reason precisely instead of collapsing every failure to no_consent.
  const latest = await findLatestMatchingConsent(subject, ctx.targetProduct, ctx.callerProduct, ctx.purpose);
  if (!latest) {
    await logAccess(ctx, null, subject, "denied", "no_consent");
    throw new CrossProductError("no_consent", `No consent on file for ${ctx.callerProduct}->${ctx.targetProduct}/${ctx.purpose}`);
  }
  if (latest.status === "revoked" || latest.revokedAt) {
    await logAccess(ctx, latest, subject, "denied", "consent_revoked");
    throw new CrossProductError("consent_revoked", "Consent revoked");
  }
  if (latest.expiresAt && latest.expiresAt < new Date()) {
    await logAccess(ctx, latest, subject, "denied", "consent_expired");
    throw new CrossProductError("consent_expired", "Consent expired");
  }
  if (latest.status !== "active") {
    await logAccess(ctx, latest, subject, "denied", "no_consent");
    throw new CrossProductError("no_consent", `Consent in non-active state: ${latest.status}`);
  }
  return latest;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT-TO-FEATURES EXTRACTOR — receipts → alternative_data signals
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantReceiptFeatures {
  totalReceipts: number;
  totalTurnover: number;
  averageMonthlyTurnover: number;
  monthsWithActivity: number;
  averageReceiptsPerMonth: number;
  largestMonthlyTurnover: number;
  smallestMonthlyTurnover: number;
  trend: "growing" | "stable" | "declining" | "new";
  trendDelta: number; // pct change between first and last full month
  monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
  // Aggregated category mix (e.g. groceries / fuel / pharmacy / transport).
  // Used by consumer alternative-data uplift so the bureau sees stable
  // spending categories alongside totals/frequency. Fully derivable from
  // receipt rows: no PII or merchant identifiers leak through.
  categoryAggregates: { category: string; receipts: number; turnover: number; sharePct: number }[];
  topCategory: string | null;
  reasonCodes: string[];
  currency: string;
  vatActivityScore: number; // 300-850 like a credit score
  lastReceiptAt: string | null;
}

export function computeReceiptFeatures(receipts: LotoReceipt[]): MerchantReceiptFeatures {
  const sorted = [...receipts].sort((a, b) => +new Date(a.issuedAt) - +new Date(b.issuedAt));
  const currency = sorted[0]?.currency || "XOF";
  const lastReceiptAt = sorted.length ? sorted[sorted.length - 1].issuedAt.toISOString() : null;
  if (sorted.length === 0) {
    return {
      totalReceipts: 0, totalTurnover: 0, averageMonthlyTurnover: 0, monthsWithActivity: 0,
      averageReceiptsPerMonth: 0, largestMonthlyTurnover: 0, smallestMonthlyTurnover: 0,
      trend: "new", trendDelta: 0, monthlyBreakdown: [],
      categoryAggregates: [], topCategory: null,
      reasonCodes: ["NO_RECEIPT_HISTORY"],
      currency, vatActivityScore: 300, lastReceiptAt: null,
    };
  }
  const buckets: Record<string, { receipts: number; turnover: number }> = {};
  const catBuckets: Record<string, { receipts: number; turnover: number }> = {};
  let totalTurnover = 0;
  for (const r of sorted) {
    const d = new Date(r.issuedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets[key]) buckets[key] = { receipts: 0, turnover: 0 };
    buckets[key].receipts++;
    const amt = parseFloat(String(r.amount));
    buckets[key].turnover += amt;
    totalTurnover += amt;
    const cat = (r.category && r.category.trim().length > 0) ? r.category.trim().toLowerCase() : "uncategorized";
    if (!catBuckets[cat]) catBuckets[cat] = { receipts: 0, turnover: 0 };
    catBuckets[cat].receipts++;
    catBuckets[cat].turnover += amt;
  }
  const monthlyBreakdown = Object.entries(buckets)
    .map(([month, v]) => ({ month, receipts: v.receipts, turnover: v.turnover }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const monthsWithActivity = monthlyBreakdown.length;
  const averageMonthlyTurnover = totalTurnover / Math.max(1, monthsWithActivity);
  const averageReceiptsPerMonth = sorted.length / Math.max(1, monthsWithActivity);
  const largestMonthlyTurnover = Math.max(...monthlyBreakdown.map(m => m.turnover));
  const smallestMonthlyTurnover = Math.min(...monthlyBreakdown.map(m => m.turnover));

  let trend: MerchantReceiptFeatures["trend"] = "stable";
  let trendDelta = 0;
  if (monthlyBreakdown.length === 1) {
    trend = "new";
  } else {
    const first = monthlyBreakdown[0].turnover;
    const last = monthlyBreakdown[monthlyBreakdown.length - 1].turnover;
    if (first > 0) {
      trendDelta = ((last - first) / first) * 100;
      if (trendDelta >= 15) trend = "growing";
      else if (trendDelta <= -15) trend = "declining";
      else trend = "stable";
    }
  }

  const reasonCodes: string[] = [];
  if (averageReceiptsPerMonth >= 30) reasonCodes.push("STRONG_RECEIPT_FREQUENCY");
  else if (averageReceiptsPerMonth >= 10) reasonCodes.push("MODERATE_RECEIPT_FREQUENCY");
  else reasonCodes.push("LOW_RECEIPT_FREQUENCY");
  if (trend === "growing") reasonCodes.push("GROWING_TURNOVER");
  if (trend === "declining") reasonCodes.push("RECENT_DROP_IN_VOLUME");
  if (monthsWithActivity >= 6) reasonCodes.push("CONSISTENT_RECEIPT_HISTORY");
  if (monthsWithActivity < 3) reasonCodes.push("THIN_RECEIPT_FILE");
  if (sorted.length === 0) reasonCodes.push("NO_RECEIPT_HISTORY");
  if (totalTurnover > 1_000_000) reasonCodes.push("HIGH_TURNOVER_VOLUME");

  // Simple receipt-derived "VAT Activity Score" 300-850 to align with credit-bureau UX
  let score = 500;
  score += Math.min(120, averageReceiptsPerMonth * 4);          // up to +120 for activity
  score += Math.min(100, monthsWithActivity * 10);              // up to +100 for tenure
  if (trend === "growing") score += 50;
  if (trend === "declining") score -= 40;
  if (totalTurnover > 5_000_000) score += 60;
  else if (totalTurnover > 1_000_000) score += 30;
  score = Math.max(300, Math.min(850, Math.round(score)));

  const categoryAggregates = Object.entries(catBuckets)
    .map(([category, v]) => ({
      category,
      receipts: v.receipts,
      turnover: v.turnover,
      sharePct: totalTurnover > 0 ? Math.round((v.turnover / totalTurnover) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.turnover - a.turnover);
  const topCategory = categoryAggregates[0]?.category ?? null;
  if (categoryAggregates.length >= 3) reasonCodes.push("DIVERSE_SPENDING_CATEGORIES");

  return {
    totalReceipts: sorted.length,
    totalTurnover,
    averageMonthlyTurnover,
    monthsWithActivity,
    averageReceiptsPerMonth,
    largestMonthlyTurnover,
    smallestMonthlyTurnover,
    trend,
    trendDelta,
    categoryAggregates,
    topCategory,
    monthlyBreakdown,
    reasonCodes,
    currency,
    vatActivityScore: score,
    lastReceiptAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC GATEWAY API
// ─────────────────────────────────────────────────────────────────────────────

export const gateway = {
  /** Loto Fiscal merchant receipt-derived features for credit scoring. */
  async getMerchantReceiptFeatures(
    merchantId: string,
    callerCtx: { userId?: string; ip?: string },
  ): Promise<{ merchant: LotoMerchant; features: MerchantReceiptFeatures; consent: CrossProductConsent }> {
    const ctx: GatewayCallContext = {
      callerProduct: "credit", targetProduct: "loto", purpose: "merchant_credit_profile",
      userId: callerCtx.userId, ip: callerCtx.ip,
    };
    const [merchant] = await db.select().from(lotoMerchants).where(eq(lotoMerchants.id, merchantId));
    if (!merchant) {
      await logAccess(ctx, null, { merchantId }, "denied", "subject_not_found");
      throw new CrossProductError("subject_not_found", "merchant not found");
    }
    const consent = await requireConsent(ctx, { merchantId });
    const receipts = await db.select().from(lotoReceipts)
      .where(eq(lotoReceipts.merchantId, merchantId)).orderBy(desc(lotoReceipts.issuedAt));
    const features = computeReceiptFeatures(receipts);
    await logAccess(ctx, consent, { merchantId }, "ok");
    return { merchant, features, consent };
  },

  /** Consumer aggregated spending insights for credit scoring. */
  async getConsumerSpendingFeatures(
    consumerUserId: string,
    callerCtx: { userId?: string; ip?: string },
  ): Promise<{ features: MerchantReceiptFeatures; consent: CrossProductConsent }> {
    const ctx: GatewayCallContext = {
      callerProduct: "credit", targetProduct: "loto", purpose: "consumer_spending_credit",
      userId: callerCtx.userId, ip: callerCtx.ip,
    };
    const consent = await requireConsent(ctx, { consumerUserId });
    const receipts = await db.select().from(lotoReceipts).where(eq(lotoReceipts.consumerUserId, consumerUserId));
    const features = computeReceiptFeatures(receipts);
    await logAccess(ctx, consent, { consumerUserId }, "ok");
    return { features, consent };
  },

  /**
   * Loto-side: bureau reputation badge for a merchant (credit -> loto).
   * The badge is computed from the merchant's verified VAT receipt history
   * (Loto Fiscal data) — this is what makes the badge a *bureau-derived*
   * reputation signal even when the merchant has no separate borrower
   * credit-bureau profile yet. The badge object always contains every
   * field the UI renders so the API contract is stable.
   */
  async getBureauBadgeForMerchant(
    merchantId: string,
    callerCtx: { userId?: string; ip?: string },
  ): Promise<{
    badge: {
      tier: "platinum" | "gold" | "silver" | "bronze" | "building";
      score: number;
      totalReceipts: number;
      monthsWithActivity: number;
      trend: string;
      issuedAt: string;
      hasBureauProfile: boolean;
      bureauScore: number | null;
    };
    consent: CrossProductConsent;
  } | null> {
    // Convention (kept consistent across the gateway): callerProduct = the
    // product CONSUMING the data, targetProduct = the product where the data
    // lives. The DGI Bureau Reputation Badge is issued by the credit bureau
    // (the consumer) from loto-side receipt history (the origin), so caller
    // is "credit" and target is "loto" — this matches the consent row tuple
    // (sourceProduct=loto, targetProduct=credit) granted at merchant opt-in.
    const ctx: GatewayCallContext = {
      callerProduct: "credit", targetProduct: "loto", purpose: "bureau_reputation_badge",
      userId: callerCtx.userId, ip: callerCtx.ip,
    };
    const [merchant] = await db.select().from(lotoMerchants).where(eq(lotoMerchants.id, merchantId));
    if (!merchant) return null;
    const consent = await requireConsent(ctx, { merchantId });

    // Pull receipts directly (we already have consent and we're inside the gateway).
    const receipts = await db.select().from(lotoReceipts).where(eq(lotoReceipts.merchantId, merchantId));
    const features = computeReceiptFeatures(receipts);

    // Derive the badge tier from the VAT activity score (300–850 scale).
    let tier: "platinum" | "gold" | "silver" | "bronze" | "building";
    const s = features.vatActivityScore;
    if (s >= 740) tier = "platinum";
    else if (s >= 670) tier = "gold";
    else if (s >= 580) tier = "silver";
    else if (s >= 500) tier = "bronze";
    else tier = "building";

    // If the merchant is also linked to a borrower with a bureau profile,
    // surface that as supplementary signal (does not change the tier).
    let hasBureauProfile = false;
    let bureauScore: number | null = null;
    if (merchant.borrowerId) {
      const [latestScore] = await db.select().from(creditScoreHistory)
        .where(eq(creditScoreHistory.borrowerId, merchant.borrowerId))
        .orderBy(desc(creditScoreHistory.createdAt)).limit(1);
      if (latestScore) {
        hasBureauProfile = true;
        bureauScore = latestScore.score ?? null;
      }
    }

    await logAccess(ctx, consent, { merchantId }, "ok");
    return {
      badge: {
        tier,
        score: features.vatActivityScore,
        totalReceipts: features.totalReceipts,
        monthsWithActivity: features.monthsWithActivity,
        trend: features.trend,
        issuedAt: new Date().toISOString(),
        hasBureauProfile,
        bureauScore,
      },
      consent,
    };
  },

  /** Credit -> Collateral: list active collateral items for a borrower in a credit report. */
  async getCollateralForBorrower(
    borrowerId: string,
    callerCtx: { userId?: string; ip?: string },
  ): Promise<{ items: CollateralItem[]; consent: CrossProductConsent }> {
    const ctx: GatewayCallContext = {
      callerProduct: "credit", targetProduct: "collateral", purpose: "credit_collateral_view",
      userId: callerCtx.userId, ip: callerCtx.ip,
    };
    const consent = await requireConsent(ctx, { borrowerId });
    const items = await db.select().from(collateralItems).where(eq(collateralItems.borrowerId, borrowerId));
    await logAccess(ctx, consent, { borrowerId }, "ok");
    return { items, consent };
  },

  /** Collateral -> Credit: borrower credit snapshot for collateral detail page. */
  async getCreditSnapshotForBorrower(
    borrowerId: string,
    callerCtx: { userId?: string; ip?: string },
  ): Promise<{
    summary: {
      score: number | null;
      activeAccounts: number;
      totalDebt: string;
      recentInquiries: number;
      recentInquiryWindowDays: number;
    };
    consent: CrossProductConsent;
  }> {
    const ctx: GatewayCallContext = {
      callerProduct: "collateral", targetProduct: "credit", purpose: "collateral_credit_view",
      userId: callerCtx.userId, ip: callerCtx.ip,
    };
    const consent = await requireConsent(ctx, { borrowerId });
    const accounts = await db.select().from(creditAccounts).where(eq(creditAccounts.borrowerId, borrowerId));
    const [latestScore] = await db.select().from(creditScoreHistory)
      .where(eq(creditScoreHistory.borrowerId, borrowerId))
      .orderBy(desc(creditScoreHistory.createdAt)).limit(1);
    const activeAccounts = accounts.filter(a => a.status !== "closed").length;
    const totalDebt = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0).toFixed(2);
    const recentWindowDays = 90;
    const since = new Date(Date.now() - recentWindowDays * 24 * 60 * 60 * 1000);
    const recentInquiriesRows = await db.select().from(creditInquiries)
      .where(and(eq(creditInquiries.borrowerId, borrowerId), gte(creditInquiries.createdAt, since)));
    await logAccess(ctx, consent, { borrowerId }, "ok");
    return {
      summary: {
        score: latestScore?.score ?? null,
        activeAccounts,
        totalDebt,
        recentInquiries: recentInquiriesRows.length,
        recentInquiryWindowDays: recentWindowDays,
      },
      consent,
    };
  },

  /** Internal helper exposed for tests and routes — does NOT bypass consent. */
  __findActiveConsent: findActiveConsent,
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — sync receipt features into alternative_data table for use by
// existing credit scoring engine. Called nightly (or on-demand for demo).
// ─────────────────────────────────────────────────────────────────────────────

export async function syncMerchantReceiptsToAlternativeData(
  merchantId: string,
  callerCtx: { userId?: string; ip?: string },
): Promise<{ inserted: boolean; features: MerchantReceiptFeatures }> {
  // Goes through the gateway so consent is enforced.
  const { merchant, features } = await gateway.getMerchantReceiptFeatures(merchantId, callerCtx);
  if (!merchant.borrowerId) return { inserted: false, features };

  // Replace any existing fiscal_receipts row for this borrower
  await db.delete(alternativeData).where(
    and(
      eq(alternativeData.borrowerId, merchant.borrowerId),
      eq(alternativeData.source, "fiscal_receipts"),
    )
  );

  const dataStart = features.monthlyBreakdown[0]?.month
    ? new Date(features.monthlyBreakdown[0].month + "-01")
    : null;
  const dataEnd = features.lastReceiptAt ? new Date(features.lastReceiptAt) : null;

  await db.insert(alternativeData).values({
    borrowerId: merchant.borrowerId,
    source: "fiscal_receipts",
    provider: "loto_fiscal",
    status: "active",
    totalTransactions: features.totalReceipts,
    onTimePayments: features.totalReceipts, // every receipt = a verified payment from consumer to merchant
    latePayments: 0,
    averageMonthlyAmount: features.averageMonthlyTurnover.toFixed(2),
    currency: features.currency,
    dataStartDate: dataStart,
    dataEndDate: dataEnd,
    consentDate: new Date(),
    rawScore: features.vatActivityScore,
  });
  return { inserted: true, features };
}
