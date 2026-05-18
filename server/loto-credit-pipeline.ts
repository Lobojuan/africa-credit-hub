/**
 * LOTO → CREDIT BRIDGE PIPELINE
 *
 * Reads a consumer's verified fiscal receipt history from loto_receipts and
 * upserts one `alternative_data` record (source = "fiscal_receipts") for the
 * linked borrower in the credit bureau.
 *
 * Also manages the merchant pipeline: reads a merchant's receipt + fraud-flag
 * data and upserts one `alternative_data` record (source = "merchant") for the
 * linked BUSINESS borrower, including a deterministic compliance score.
 *
 * ISOLATION RULES (enforced inside every query):
 * - Only receipts issued by merchants in `countryCode` are read.
 * - The borrower must also be registered in the same country.
 * - Demo receipts (`is_demo = true`) are excluded from every aggregate.
 * - Cross-country reads throw a PipelineCountryError — no silent fallback.
 *
 * This file is in the bridge-isolation ALLOWLIST and may import lotoMerchants,
 * lotoReceipts, lotoFraudFlags, crossProductConsents, and alternativeData
 * directly from @shared/schema. All other server files must go through the gateway.
 */

import { db } from "./db";
import { eq, and, isNull, or } from "drizzle-orm";
import {
  lotoMerchants,
  lotoReceipts,
  lotoFraudFlags,
  crossProductConsents,
  alternativeData,
  borrowers,
  users,
} from "@shared/schema";
import { computeMerchantComplianceScore } from "./loto-fraud-rules";
import { getFiscalAdapterByCountry } from "./services/loto-fiscal-adapter";

export class PipelineCountryError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "PipelineCountryError";
  }
}

export interface FiscalReceiptsAggregate {
  totalTransactions: number;
  onTimePayments: number;
  latePayments: number;
  averageMonthlyAmount: string;
  currency: string;
  dataStartDate: Date | null;
  dataEndDate: Date | null;
  countryCode: string;
  provider: string;
}

export interface MerchantAltDataAggregate {
  merchantId: string;
  borrowerId: string | null;
  complianceScore: number;
  complianceBreakdown: Record<string, number>;
  totalTransactions: number;
  onTimePayments: number;
  latePayments: number;
  averageMonthlyVat: string;
  currency: string;
  vatTrend: { month: string; vat: number }[];
  openFraudFlagsCount: number;
  countryCode: string;
  provider: string;
  /** Whether the DGI / e-Impots authority confirmed the merchant's fiscal ID as valid + TVA-registered. */
  verifiedByAuthority?: boolean | null;
  /** Canonical name returned by the fiscal authority (e.g. raisonSociale from DGI). */
  authorityName?: string | null;
  /** The adapter used for verification (e.g. "ci_dgi", "simulated"). */
  fiscalVerificationAdapter?: string | null;
}

/**
 * Normalises a borrower country string (e.g. "Côte d'Ivoire" or "Ghana") to
 * the 2-letter ISO code used by loto_merchants.country_code. Returns the
 * original string lowercased if no mapping is found (safe fallback for the
 * isolation check; the query simply returns zero rows).
 */
export function normaliseBorrowerCountry(country: string | null | undefined): string {
  if (!country) return "";
  const map: Record<string, string> = {
    "côte d'ivoire": "CI",
    "cote d'ivoire": "CI",
    "ivory coast": "CI",
    "ghana": "GH",
    "ethiopia": "ET",
    "nigeria": "NG",
    "kenya": "KE",
    "senegal": "SN",
    "south africa": "ZA",
    "cameroon": "CM",
    "mali": "ML",
    "burkina faso": "BF",
    "togo": "TG",
    "benin": "BJ",
    "niger": "NE",
    "guinea": "GN",
  };
  const lc = country.trim().toLowerCase();
  return map[lc] ?? country.trim().toUpperCase().slice(0, 2);
}

/**
 * Aggregate the consumer's loto receipt history for a single country into the
 * fields needed by `alternative_data`.
 *
 * @param userId       Institution user id (may also be a loto consumer userId)
 * @param borrowerId   Borrower record to attach the aggregate to
 * @param countryCode  2-letter country code (e.g. "CI"). Used as the country
 *                     isolation fence — only receipts from merchants in this
 *                     country are included.
 * @param borrowerCountry  Raw country string from the borrower record. Must
 *                         normalise to `countryCode`; throws if it doesn't.
 */
export async function buildFiscalReceiptsAltData(
  userId: string,
  borrowerId: string,
  countryCode: string,
  borrowerCountry: string | null | undefined,
): Promise<{ inserted: boolean; aggregate: FiscalReceiptsAggregate }> {
  const normalisedBorrowerCode = normaliseBorrowerCountry(borrowerCountry);

  if (!normalisedBorrowerCode || normalisedBorrowerCode.toUpperCase() !== countryCode.toUpperCase()) {
    throw new PipelineCountryError(
      `Country mismatch: borrower is registered in "${borrowerCountry ?? "unknown"}" ` +
      `(normalised: "${normalisedBorrowerCode || "empty"}") but pipeline was called for ` +
      `countryCode "${countryCode}". Cross-country reads are forbidden.`,
    );
  }

  const receipts = await db
    .select({
      id: lotoReceipts.id,
      amount: lotoReceipts.amount,
      vatAmount: lotoReceipts.vatAmount,
      currency: lotoReceipts.currency,
      issuedAt: lotoReceipts.issuedAt,
    })
    .from(lotoReceipts)
    .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
    .where(
      and(
        or(
          eq(lotoReceipts.consumerUserId, userId),
        ),
        eq(lotoMerchants.countryCode, countryCode.toUpperCase()),
        eq(lotoReceipts.isDemo, false),
      ),
    );

  if (receipts.length === 0) {
    return {
      inserted: false,
      aggregate: {
        totalTransactions: 0,
        onTimePayments: 0,
        latePayments: 0,
        averageMonthlyAmount: "0.00",
        currency: "XOF",
        dataStartDate: null,
        dataEndDate: null,
        countryCode,
        provider: `loto_fiscal_${countryCode.toLowerCase()}`,
      },
    };
  }

  const sorted = [...receipts].sort((a, b) =>
    new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime(),
  );

  const currency = sorted[0]?.currency ?? "XOF";
  const dataStartDate = new Date(sorted[0].issuedAt);
  const dataEndDate = new Date(sorted[sorted.length - 1].issuedAt);

  const monthBuckets: Record<string, number> = {};
  for (const r of sorted) {
    const d = new Date(r.issuedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthBuckets[key]) monthBuckets[key] = 0;
    monthBuckets[key] += parseFloat(String(r.vatAmount ?? 0));
  }

  const monthCount = Object.keys(monthBuckets).length;
  const totalVat = Object.values(monthBuckets).reduce((s, v) => s + v, 0);
  const averageMonthlyAmount = (totalVat / Math.max(1, monthCount)).toFixed(2);

  const aggregate: FiscalReceiptsAggregate = {
    totalTransactions: receipts.length,
    onTimePayments: receipts.length,
    latePayments: 0,
    averageMonthlyAmount,
    currency,
    dataStartDate,
    dataEndDate,
    countryCode,
    provider: `loto_fiscal_${countryCode.toLowerCase()}`,
  };

  await db.delete(alternativeData).where(
    and(
      eq(alternativeData.borrowerId, borrowerId),
      eq(alternativeData.source, "fiscal_receipts"),
    ),
  );

  await db.insert(alternativeData).values({
    borrowerId,
    source: "fiscal_receipts",
    provider: aggregate.provider,
    status: "active",
    totalTransactions: aggregate.totalTransactions,
    onTimePayments: aggregate.onTimePayments,
    latePayments: aggregate.latePayments,
    averageMonthlyAmount: aggregate.averageMonthlyAmount,
    currency: aggregate.currency,
    dataStartDate: aggregate.dataStartDate,
    dataEndDate: aggregate.dataEndDate,
    consentDate: new Date(),
  });

  return { inserted: true, aggregate };
}

/**
 * Purge the fiscal_receipts alternative_data record for a borrower.
 * Called on consent revocation.
 */
export async function purgeFiscalReceiptsAltData(borrowerId: string): Promise<number> {
  const result = await db
    .delete(alternativeData)
    .where(
      and(
        eq(alternativeData.borrowerId, borrowerId),
        eq(alternativeData.source, "fiscal_receipts"),
      ),
    )
    .returning({ id: alternativeData.id });
  return result.length;
}

/**
 * Build/refresh the `alternative_data` record (source = "merchant") for the
 * business borrower linked to a Loto merchant.
 *
 * Reads the merchant's verified receipt history and open fraud flags, computes
 * the deterministic compliance score (0-100), then upserts one row with
 * source = "merchant". Country isolation is strictly enforced: the merchant's
 * registered countryCode must equal the `countryCode` argument.
 *
 * @param merchantId   Loto merchant primary key
 * @param countryCode  2-letter ISO country code. Must match merchant.countryCode.
 */
export async function buildMerchantAltData(
  merchantId: string,
  countryCode: string,
): Promise<{ inserted: boolean; aggregate: MerchantAltDataAggregate }> {
  const [merchant] = await db
    .select()
    .from(lotoMerchants)
    .where(eq(lotoMerchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    throw new PipelineCountryError(`Merchant ${merchantId} not found`);
  }

  if (merchant.countryCode.toUpperCase() !== countryCode.toUpperCase()) {
    throw new PipelineCountryError(
      `Country mismatch: merchant "${merchantId}" is registered in "${merchant.countryCode}" ` +
      `but pipeline was called for countryCode "${countryCode}". Cross-country reads are forbidden.`,
    );
  }

  if (!merchant.borrowerId) {
    return {
      inserted: false,
      aggregate: {
        merchantId,
        borrowerId: null,
        complianceScore: 0,
        complianceBreakdown: { recency: 0, frequency: 0, growth: 0, diversity: 0, penalty: 0 },
        totalTransactions: 0,
        onTimePayments: 0,
        latePayments: 0,
        averageMonthlyVat: "0.00",
        currency: merchant.currency,
        vatTrend: buildEmptyVatTrend(),
        openFraudFlagsCount: 0,
        countryCode,
        provider: `loto_fiscal_${countryCode.toLowerCase()}`,
      },
    };
  }

  // Verify the linked borrower is registered in the same country as the merchant.
  // This prevents a CI merchant from feeding credit data into a GH borrower profile
  // (or any other cross-country write), enforcing the isolation fence at the data level.
  const [borrower] = await db
    .select({ id: borrowers.id, country: borrowers.country })
    .from(borrowers)
    .where(eq(borrowers.id, merchant.borrowerId))
    .limit(1);

  if (!borrower) {
    throw new PipelineCountryError(
      `Borrower "${merchant.borrowerId}" linked to merchant "${merchantId}" not found. ` +
      `Cannot write cross-entity alternative_data.`,
    );
  }

  const normalisedBorrowerCode = normaliseBorrowerCountry(borrower.country);
  if (normalisedBorrowerCode.toUpperCase() !== merchant.countryCode.toUpperCase()) {
    throw new PipelineCountryError(
      `Borrower country mismatch: borrower "${merchant.borrowerId}" is registered in ` +
      `"${borrower.country}" (normalised: "${normalisedBorrowerCode}") but merchant ` +
      `"${merchantId}" is in "${merchant.countryCode}". Cross-country borrower links ` +
      `are forbidden — data will not be written to credit bureau.`,
    );
  }

  // ── e-Impots / DGI fiscal authority verification ───────────────────────────
  // Call the pluggable fiscal adapter to verify the merchant's NCC (Côte d'Ivoire)
  // or equivalent fiscal ID against the tax authority's registry. This runs at
  // opt-in time (and on every nightly refresh) so the alt-data record always
  // reflects the latest verification status.
  //
  // Hard rules:
  //   - In DEMO mode (PRODUCTION_MODE !== "true"): SimulatedFiscalAdapter is used
  //     automatically — no real DGI call is ever made.
  //   - If the merchant has no fiscalId recorded yet: verification is skipped
  //     (verifiedByAuthority = null) — the compliance pipeline still runs.
  //   - On adapter error: logged, verification is skipped, pipeline continues.
  let verifiedByAuthority: boolean | null = null;
  let authorityName: string | null = null;
  let fiscalVerificationAdapter: string | null = null;

  if (merchant.fiscalId) {
    try {
      const adapter = getFiscalAdapterByCountry(countryCode);
      fiscalVerificationAdapter = adapter.id;
      const verifyResult = await adapter.verify({
        fiscalId: merchant.fiscalId,
        countryCode,
        merchantName: merchant.shopName,
      });
      verifiedByAuthority = verifyResult.verified;
      authorityName = verifyResult.authorityName ?? null;
      console.info(
        `[loto-credit-pipeline] NCC=${merchant.fiscalId} country=${countryCode} ` +
        `adapter=${adapter.id} verified=${verifyResult.verified} msg="${verifyResult.message}"`,
      );
    } catch (adapterErr) {
      console.error(
        `[loto-credit-pipeline] fiscal adapter error for merchant ${merchantId}: ` +
        (adapterErr as Error).message,
      );
      // Verification failure is non-fatal — compliance pipeline still runs.
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
    .where(
      and(
        eq(lotoReceipts.merchantId, merchantId),
        eq(lotoReceipts.isDemo, false),
      ),
    );

  const openFlags = await db
    .select({
      id: lotoFraudFlags.id,
      ruleCode: lotoFraudFlags.ruleCode,
      receiptId: lotoFraudFlags.receiptId,
    })
    .from(lotoFraudFlags)
    .where(
      and(
        eq(lotoFraudFlags.merchantId, merchantId),
        eq(lotoFraudFlags.status, "open"),
      ),
    );

  const openFraudFlagsCount = openFlags.length;

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;
  const sixtyDaysAgo = now - 60 * 86400000;

  const lastReceiptTs = receipts.length > 0
    ? receipts.reduce((latest, r) => {
        const t = new Date(r.issuedAt).getTime();
        return t > latest ? t : latest;
      }, 0)
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

  const monthOverMonthDeltaPct = receiptsPrev30Days > 0
    ? ((receiptsLast30Days - receiptsPrev30Days) / receiptsPrev30Days) * 100
    : receiptsLast30Days > 0 ? 50 : 0;

  const categories = new Set(receipts.map(r => r.category).filter(Boolean));
  const categoryDiversity = categories.size;

  const { score: complianceScore, breakdown: rawBreakdown } = computeMerchantComplianceScore({
    daysSinceLastReceipt,
    receiptsLast30Days,
    monthOverMonthDeltaPct,
    categoryDiversity,
    openFraudFlags: openFraudFlagsCount,
  });

  const complianceBreakdown: Record<string, number> = rawBreakdown;

  const flaggedReceiptIds = new Set(openFlags.map(f => f.receiptId).filter(Boolean));
  const onTimePayments = receipts.length - flaggedReceiptIds.size;
  const latePayments = flaggedReceiptIds.size;

  const monthBuckets: Record<string, number> = {};
  for (const r of receipts) {
    const d = new Date(r.issuedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthBuckets[key]) monthBuckets[key] = 0;
    monthBuckets[key] += parseFloat(String(r.vatAmount ?? 0));
  }
  const monthCount = Object.keys(monthBuckets).length;
  const totalVat = Object.values(monthBuckets).reduce((s, v) => s + v, 0);
  const averageMonthlyVat = (totalVat / Math.max(1, monthCount)).toFixed(2);

  const vatTrend = buildVatTrend(monthBuckets, 6);

  const currency = receipts[0]?.currency ?? merchant.currency;

  const dataStartDate = receipts.length > 0
    ? new Date(Math.min(...receipts.map(r => new Date(r.issuedAt).getTime())))
    : null;
  const dataEndDate = receipts.length > 0
    ? new Date(Math.max(...receipts.map(r => new Date(r.issuedAt).getTime())))
    : null;

  const aggregate: MerchantAltDataAggregate = {
    merchantId,
    borrowerId: merchant.borrowerId,
    complianceScore,
    complianceBreakdown,
    totalTransactions: receipts.length,
    onTimePayments,
    latePayments,
    averageMonthlyVat,
    currency,
    vatTrend,
    openFraudFlagsCount,
    countryCode,
    // Machine-readable, country-scoped provider identifier.
    // Format: loto_fiscal_{2-letter-ISO} (e.g. "loto_fiscal_ci" for Côte d'Ivoire).
    // The human-readable display label ("Loto Fiscal Compliance") is stored in the
    // metadata.displayLabel field so credit report renderers can show the correct
    // bureau name without re-deriving it from the provider code.
    provider: `loto_fiscal_${countryCode.toLowerCase()}`,
    verifiedByAuthority,
    authorityName,
    fiscalVerificationAdapter,
  };

  await db.delete(alternativeData).where(
    and(
      eq(alternativeData.borrowerId, merchant.borrowerId),
      eq(alternativeData.source, "merchant"),
    ),
  );

  await db.insert(alternativeData).values({
    borrowerId: merchant.borrowerId,
    source: "merchant",
    provider: aggregate.provider,
    status: "active",
    totalTransactions: aggregate.totalTransactions,
    onTimePayments: aggregate.onTimePayments,
    latePayments: aggregate.latePayments,
    averageMonthlyAmount: aggregate.averageMonthlyVat,
    currency: aggregate.currency,
    dataStartDate,
    dataEndDate,
    consentDate: new Date(),
    rawScore: complianceScore,
    // Persist the full compliance breakdown so credit-breakdown endpoint and PDF report
    // can surface granular rule scores without re-computing from live data.
    metadata: {
      // Human-readable display label for the provider (shown in credit reports/UI).
      // Kept separate from the machine-readable `provider` field so both identifiers
      // are available without re-deriving one from the other.
      displayLabel: "Loto Fiscal Compliance",
      complianceBreakdown,
      openFraudFlagsCount,
      vatTrend: aggregate.vatTrend,
      // e-Impots / DGI NCC verification result (set below after adapter call).
      // verifiedByAuthority=true means the DGI confirmed the merchant's NCC is valid
      // and subject to TVA at the time the alt-data record was written.
      verifiedByAuthority: aggregate.verifiedByAuthority ?? null,
      authorityName: aggregate.authorityName ?? null,
      fiscalVerificationAdapter: aggregate.fiscalVerificationAdapter ?? null,
      computedAt: new Date().toISOString(),
    },
  });

  return { inserted: true, aggregate };
}

/**
 * Purge the merchant alternative_data record (source = "merchant") for a borrower.
 * Called on consent revocation (merchant opt-out).
 */
export async function purgeMerchantAltData(borrowerId: string): Promise<number> {
  const result = await db
    .delete(alternativeData)
    .where(
      and(
        eq(alternativeData.borrowerId, borrowerId),
        eq(alternativeData.source, "merchant"),
      ),
    )
    .returning({ id: alternativeData.id });
  return result.length;
}

/**
 * Nightly refresh: find all active fiscal_receipts_credit consents and re-run
 * the pipeline for each, keeping the alternative_data record current as new
 * receipts arrive.
 *
 * Returns a summary for logging.
 */
export async function refreshAllFiscalReceiptsConsents(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const activeConsents = await db
    .select()
    .from(crossProductConsents)
    .where(
      and(
        eq(crossProductConsents.purpose, "fiscal_receipts_credit"),
        eq(crossProductConsents.status, "active"),
      ),
    );

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const consent of activeConsents) {
    if (!consent.userId || !consent.borrowerId) {
      skipped++;
      continue;
    }
    try {
      const expiresAt = consent.expiresAt ? new Date(consent.expiresAt) : null;
      if (expiresAt && expiresAt < new Date()) {
        skipped++;
        continue;
      }

      const [borrower] = await db
        .select({ country: borrowers.country })
        .from(borrowers)
        .where(eq(borrowers.id, consent.borrowerId))
        .limit(1);

      if (!borrower) {
        skipped++;
        continue;
      }

      const countryCode = normaliseBorrowerCountry(borrower.country);
      if (!countryCode) {
        skipped++;
        continue;
      }

      await buildFiscalReceiptsAltData(
        consent.userId,
        consent.borrowerId,
        countryCode,
        borrower.country,
      );
      processed++;
    } catch (err) {
      console.error(
        `[loto-credit-pipeline] refresh error for consent ${consent.id}:`,
        err,
      );
      errors++;
    }
  }

  return { processed, skipped, errors };
}

/**
 * Nightly refresh: find all active merchant_credit_profile consents and
 * re-run buildMerchantAltData for each, keeping the alternative_data record
 * current as new receipts and fraud flags arrive.
 */
export async function refreshAllMerchantConsents(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const activeConsents = await db
    .select()
    .from(crossProductConsents)
    .where(
      and(
        eq(crossProductConsents.purpose, "merchant_credit_profile"),
        eq(crossProductConsents.status, "active"),
      ),
    );

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const consent of activeConsents) {
    if (!consent.merchantId) {
      skipped++;
      continue;
    }
    try {
      const expiresAt = consent.expiresAt ? new Date(consent.expiresAt) : null;
      if (expiresAt && expiresAt < new Date()) {
        skipped++;
        continue;
      }

      const [merchant] = await db
        .select({ id: lotoMerchants.id, countryCode: lotoMerchants.countryCode, borrowerId: lotoMerchants.borrowerId })
        .from(lotoMerchants)
        .where(eq(lotoMerchants.id, consent.merchantId))
        .limit(1);

      if (!merchant?.borrowerId) {
        skipped++;
        continue;
      }

      await buildMerchantAltData(merchant.id, merchant.countryCode);
      processed++;
    } catch (err) {
      console.error(
        `[loto-credit-pipeline] merchant refresh error for consent ${consent.id}:`,
        err,
      );
      errors++;
    }
  }

  return { processed, skipped, errors };
}

function buildVatTrend(
  monthBuckets: Record<string, number>,
  months: number,
): { month: string; vat: number }[] {
  const trend: { month: string; vat: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trend.push({ month: key, vat: monthBuckets[key] ?? 0 });
  }
  return trend;
}

function buildEmptyVatTrend(): { month: string; vat: number }[] {
  return buildVatTrend({}, 6);
}
