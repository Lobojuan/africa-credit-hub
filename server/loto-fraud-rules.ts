/**
 * Loto Fiscal — deterministic fraud detection rules.
 *
 * The DGI (and equivalent tax authorities) cannot rely on opaque ML scores
 * during the pilot phase: every flag must be explainable to a merchant,
 * reviewable by a human, and reproducible from raw evidence. This module
 * implements five rules over the lotoReceipts / lotoMerchants tables and
 * upserts the resulting flags into loto_fraud_flags so the dashboard can
 * triage them.
 *
 * Each rule produces a `signature` that is stable for the same logical
 * detection. The unique index (countryCode, ruleCode, signature) on
 * loto_fraud_flags means re-running the engine after partial triage will
 * NOT create duplicates: open flags get refreshed evidence, while resolved
 * or dismissed flags stay closed (we do not reopen them).
 */

import crypto from "crypto";
import { db } from "./db";
import {
  lotoMerchants,
  lotoReceipts,
  lotoFraudFlags,
  type LotoFraudFlag,
} from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

export type FraudRuleCode =
  | "DUPLICATE_FISCAL_CODE"
  | "STRUCTURED_SUBTHRESHOLD"
  | "GHOST_MERCHANT"
  | "ABNORMAL_HOUR"
  | "SINGLE_DEVICE_BURST";

export interface DetectedFlag {
  ruleCode: FraudRuleCode;
  severity: "low" | "medium" | "high" | "critical";
  countryCode: string;
  merchantId?: string | null;
  receiptId?: string | null;
  deviceId?: string | null;
  summary: string;
  signature: string;
  evidence: Record<string, unknown>;
}

interface ReceiptRow {
  id: string;
  merchantId: string;
  fiscalCode: string;
  amount: string;
  currency: string;
  issuedAt: Date;
  category: string | null;
  countryCode: string;
}

interface MerchantRow {
  id: string;
  shopName: string;
  countryCode: string;
  registeredAt: Date;
}

const SUBTHRESHOLD_BAND_RATIO = 0.85; // receipts at 85-100% of a "round" prize threshold are suspicious
const SUBTHRESHOLD_BANDS = [10000, 50000, 100000, 500000, 1000000]; // XOF / KES / NGN bands work well
const GHOST_MERCHANT_DAYS = 30;
const ABNORMAL_HOUR_START = 0; // 0..5 inclusive
const ABNORMAL_HOUR_END = 5;
const SINGLE_DEVICE_BURST_PER_MIN = 4;

function sig(...parts: (string | number | undefined | null)[]) {
  return crypto.createHash("sha1").update(parts.map((p) => String(p ?? "")).join("|")).digest("hex").slice(0, 24);
}

/** Rule 1: identical fiscal codes issued more than once (replay / cloning). */
function ruleDuplicateFiscalCodes(receipts: ReceiptRow[]): DetectedFlag[] {
  const groups = new Map<string, ReceiptRow[]>();
  for (const r of receipts) {
    const key = `${r.countryCode}|${r.fiscalCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const out: DetectedFlag[] = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const ids = group.map((g) => g.id).sort();
    const merchantIds = Array.from(new Set(group.map((g) => g.merchantId)));
    out.push({
      ruleCode: "DUPLICATE_FISCAL_CODE",
      severity: merchantIds.length > 1 ? "critical" : "high",
      countryCode: group[0].countryCode,
      merchantId: merchantIds.length === 1 ? merchantIds[0] : null,
      receiptId: group[0].id,
      summary: `Fiscal code ${group[0].fiscalCode} appears ${group.length}× across ${merchantIds.length} merchant(s)`,
      signature: sig("dup", key),
      evidence: { fiscalCode: group[0].fiscalCode, occurrences: group.length, receiptIds: ids, merchantIds },
    });
  }
  return out;
}

/** Rule 2: structured small amounts that cluster just below a prize-eligibility band. */
function ruleStructuredSubthreshold(receipts: ReceiptRow[]): DetectedFlag[] {
  const byMerchant = new Map<string, ReceiptRow[]>();
  for (const r of receipts) {
    if (!byMerchant.has(r.merchantId)) byMerchant.set(r.merchantId, []);
    byMerchant.get(r.merchantId)!.push(r);
  }
  const out: DetectedFlag[] = [];
  for (const [merchantId, list] of byMerchant) {
    for (const band of SUBTHRESHOLD_BANDS) {
      const lower = band * SUBTHRESHOLD_BAND_RATIO;
      const upper = band - 1;
      const inBand = list.filter((r) => {
        const amt = parseFloat(r.amount);
        return amt >= lower && amt <= upper;
      });
      if (inBand.length < 5) continue; // need a real cluster
      const sample = inBand.slice(0, 10).map((r) => ({ id: r.id, amount: r.amount, issuedAt: r.issuedAt }));
      out.push({
        ruleCode: "STRUCTURED_SUBTHRESHOLD",
        severity: inBand.length >= 15 ? "high" : "medium",
        countryCode: list[0].countryCode,
        merchantId,
        summary: `${inBand.length} receipts clustered just below the ${band.toLocaleString()} ${list[0].currency} threshold`,
        signature: sig("sub", merchantId, band),
        evidence: { band, count: inBand.length, sample },
      });
    }
  }
  return out;
}

/** Rule 3: merchants registered >30d ago with zero verified receipts. */
function ruleGhostMerchant(merchants: MerchantRow[], receipts: ReceiptRow[]): DetectedFlag[] {
  const receiptCounts = new Map<string, number>();
  for (const r of receipts) receiptCounts.set(r.merchantId, (receiptCounts.get(r.merchantId) ?? 0) + 1);
  const cutoff = Date.now() - GHOST_MERCHANT_DAYS * 24 * 3600 * 1000;
  const out: DetectedFlag[] = [];
  for (const m of merchants) {
    if (+m.registeredAt > cutoff) continue;
    if ((receiptCounts.get(m.id) ?? 0) > 0) continue;
    out.push({
      ruleCode: "GHOST_MERCHANT",
      severity: "medium",
      countryCode: m.countryCode,
      merchantId: m.id,
      summary: `${m.shopName} has zero receipts ${GHOST_MERCHANT_DAYS}+ days after registration`,
      signature: sig("ghost", m.id),
      evidence: { shopName: m.shopName, registeredAt: m.registeredAt, daysSinceRegistered: Math.floor((Date.now() - +m.registeredAt) / 86400000) },
    });
  }
  return out;
}

/** Rule 4: receipts issued in the 0..5 AM local window (proxied as UTC for the pilot). */
function ruleAbnormalHour(receipts: ReceiptRow[]): DetectedFlag[] {
  const byMerchant = new Map<string, ReceiptRow[]>();
  for (const r of receipts) {
    const h = r.issuedAt.getUTCHours();
    if (h < ABNORMAL_HOUR_START || h > ABNORMAL_HOUR_END) continue;
    if (!byMerchant.has(r.merchantId)) byMerchant.set(r.merchantId, []);
    byMerchant.get(r.merchantId)!.push(r);
  }
  const out: DetectedFlag[] = [];
  for (const [merchantId, list] of byMerchant) {
    if (list.length < 3) continue;
    out.push({
      ruleCode: "ABNORMAL_HOUR",
      severity: list.length >= 10 ? "high" : "medium",
      countryCode: list[0].countryCode,
      merchantId,
      summary: `${list.length} receipts issued between 00:00 and 05:00 (UTC) — outside normal trading hours`,
      signature: sig("hour", merchantId, new Date().toISOString().slice(0, 10)),
      evidence: { count: list.length, hours: list.map((r) => r.issuedAt.toISOString()) },
    });
  }
  return out;
}

/** Rule 5: device or merchant emitting >4 receipts/minute (replay / scripted). */
function ruleSingleDeviceBurst(receipts: ReceiptRow[]): DetectedFlag[] {
  const byMerchant = new Map<string, ReceiptRow[]>();
  for (const r of receipts) {
    if (!byMerchant.has(r.merchantId)) byMerchant.set(r.merchantId, []);
    byMerchant.get(r.merchantId)!.push(r);
  }
  const out: DetectedFlag[] = [];
  for (const [merchantId, list] of byMerchant) {
    list.sort((a, b) => +a.issuedAt - +b.issuedAt);
    let bestBurst = 0;
    let bestStart: Date | null = null;
    let i = 0;
    for (let j = 0; j < list.length; j++) {
      while (i < j && +list[j].issuedAt - +list[i].issuedAt > 60_000) i++;
      const window = j - i + 1;
      if (window > bestBurst) {
        bestBurst = window;
        bestStart = list[i].issuedAt;
      }
    }
    if (bestBurst <= SINGLE_DEVICE_BURST_PER_MIN) continue;
    out.push({
      ruleCode: "SINGLE_DEVICE_BURST",
      severity: bestBurst >= 10 ? "critical" : "high",
      countryCode: list[0].countryCode,
      merchantId,
      summary: `${bestBurst} receipts within 60 seconds at ${bestStart?.toISOString()}`,
      signature: sig("burst", merchantId, bestStart?.toISOString()),
      evidence: { peakRate: bestBurst, windowStart: bestStart },
    });
  }
  return out;
}

export interface RunFraudScanOptions {
  countryCode: string;
  /** Only consider receipts issued in the last N days. Default 60. */
  windowDays?: number;
}

export interface RunFraudScanResult {
  rulesEvaluated: number;
  detectionsFound: number;
  flagsUpserted: number;
  byRule: Record<string, number>;
}

/**
 * Run the rules engine for one country and persist results.
 * Returns counts so the admin endpoint can echo a summary.
 */
export async function runFraudScan(opts: RunFraudScanOptions): Promise<RunFraudScanResult> {
  const windowDays = opts.windowDays ?? 60;
  const since = new Date(Date.now() - windowDays * 86400000);

  const receipts = (await db
    .select({
      id: lotoReceipts.id,
      merchantId: lotoReceipts.merchantId,
      fiscalCode: lotoReceipts.fiscalCode,
      amount: lotoReceipts.amount,
      currency: lotoReceipts.currency,
      issuedAt: lotoReceipts.issuedAt,
      category: lotoReceipts.category,
      countryCode: lotoMerchants.countryCode,
    })
    .from(lotoReceipts)
    .innerJoin(lotoMerchants, eq(lotoReceipts.merchantId, lotoMerchants.id))
    .where(and(eq(lotoMerchants.countryCode, opts.countryCode), sql`${lotoReceipts.issuedAt} >= ${since}`))) as ReceiptRow[];

  const merchants = (await db
    .select({
      id: lotoMerchants.id,
      shopName: lotoMerchants.shopName,
      countryCode: lotoMerchants.countryCode,
      registeredAt: lotoMerchants.registeredAt,
    })
    .from(lotoMerchants)
    .where(eq(lotoMerchants.countryCode, opts.countryCode))) as MerchantRow[];

  const detections = [
    ...ruleDuplicateFiscalCodes(receipts),
    ...ruleStructuredSubthreshold(receipts),
    ...ruleGhostMerchant(merchants, receipts),
    ...ruleAbnormalHour(receipts),
    ...ruleSingleDeviceBurst(receipts),
  ];

  const byRule: Record<string, number> = {};
  let upserts = 0;
  for (const d of detections) {
    byRule[d.ruleCode] = (byRule[d.ruleCode] ?? 0) + 1;
    // Upsert: refresh evidence/severity/summary if an open flag exists,
    // otherwise insert a new one. Closed/dismissed flags are NOT reopened.
    const existing = await db
      .select()
      .from(lotoFraudFlags)
      .where(
        and(
          eq(lotoFraudFlags.countryCode, d.countryCode),
          eq(lotoFraudFlags.ruleCode, d.ruleCode),
          eq(lotoFraudFlags.signature, d.signature),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(lotoFraudFlags).values({
        countryCode: d.countryCode,
        ruleCode: d.ruleCode,
        severity: d.severity,
        merchantId: d.merchantId ?? undefined,
        receiptId: d.receiptId ?? undefined,
        deviceId: d.deviceId ?? undefined,
        summary: d.summary,
        signature: d.signature,
        status: "open",
        evidence: d.evidence,
      });
      upserts++;
    } else if (existing[0].status === "open") {
      await db
        .update(lotoFraudFlags)
        .set({
          severity: d.severity,
          summary: d.summary,
          evidence: d.evidence,
          detectedAt: new Date(),
        })
        .where(eq(lotoFraudFlags.id, existing[0].id));
      upserts++;
    }
  }

  return { rulesEvaluated: 5, detectionsFound: detections.length, flagsUpserted: upserts, byRule };
}

/**
 * Compute a deterministic 0..100 compliance score per merchant.
 * Inputs are weighted: recency 30, frequency 25, growth 20, category mix 15,
 * fraud-flag penalty 10. Documented here so a merchant audit can reproduce
 * the exact score from raw inputs.
 */
export function computeMerchantComplianceScore(input: {
  daysSinceLastReceipt: number;
  receiptsLast30Days: number;
  monthOverMonthDeltaPct: number;
  categoryDiversity: number; // distinct categories in window
  openFraudFlags: number;
}): { score: number; breakdown: Record<string, number> } {
  const recency = Math.max(0, 30 - Math.min(30, input.daysSinceLastReceipt));
  const frequency = Math.min(25, input.receiptsLast30Days * 0.5);
  const growth = Math.max(0, Math.min(20, 10 + input.monthOverMonthDeltaPct / 5));
  const diversity = Math.min(15, input.categoryDiversity * 3);
  const penalty = Math.min(10, input.openFraudFlags * 2);
  const breakdown = { recency, frequency, growth, diversity, penalty: -penalty };
  const score = Math.max(0, Math.min(100, recency + frequency + growth + diversity - penalty));
  return { score: Math.round(score), breakdown };
}

export type { LotoFraudFlag };
