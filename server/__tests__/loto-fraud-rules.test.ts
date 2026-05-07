/**
 * Unit tests for server/loto-fraud-rules.ts
 *
 * All 5 rules + computeMerchantComplianceScore are tested with deterministic
 * in-memory fixtures — no database is touched.
 */

import { describe, it, expect } from "vitest";
import {
  ruleDuplicateFiscalCodes,
  ruleStructuredSubthreshold,
  ruleGhostMerchant,
  ruleAbnormalHour,
  ruleSingleDeviceBurst,
  computeMerchantComplianceScore,
  type ReceiptRow,
  type MerchantRow,
} from "../loto-fraud-rules";

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function receipt(overrides: Partial<ReceiptRow> = {}): ReceiptRow {
  return {
    id: "r-001",
    merchantId: "m-001",
    fiscalCode: "FC-001",
    amount: "5000",
    currency: "XOF",
    issuedAt: new Date("2026-04-01T10:00:00Z"),
    category: "food",
    countryCode: "CI",
    ...overrides,
  };
}

function merchant(overrides: Partial<MerchantRow> = {}): MerchantRow {
  return {
    id: "m-001",
    shopName: "Test Shop",
    countryCode: "CI",
    registeredAt: new Date(Date.now() - 60 * 86400_000),
    ...overrides,
  };
}

// ─── Rule 1: DUPLICATE_FISCAL_CODE ───────────────────────────────────────────

describe("Rule 1 — DUPLICATE_FISCAL_CODE", () => {
  it("returns no flags when all fiscal codes are unique", () => {
    const receipts = [
      receipt({ id: "r-1", fiscalCode: "FC-001" }),
      receipt({ id: "r-2", fiscalCode: "FC-002" }),
      receipt({ id: "r-3", fiscalCode: "FC-003" }),
    ];
    expect(ruleDuplicateFiscalCodes(receipts)).toHaveLength(0);
  });

  it("returns a flag when the same fiscal code appears twice for the same merchant", () => {
    const receipts = [
      receipt({ id: "r-1", fiscalCode: "DUP", merchantId: "m-1" }),
      receipt({ id: "r-2", fiscalCode: "DUP", merchantId: "m-1" }),
    ];
    const flags = ruleDuplicateFiscalCodes(receipts);
    expect(flags).toHaveLength(1);
    expect(flags[0].ruleCode).toBe("DUPLICATE_FISCAL_CODE");
    expect(flags[0].severity).toBe("high");
    expect(flags[0].evidence).toMatchObject({ occurrences: 2 });
  });

  it("escalates to critical when the same fiscal code spans multiple merchants", () => {
    const receipts = [
      receipt({ id: "r-1", fiscalCode: "DUP", merchantId: "m-A" }),
      receipt({ id: "r-2", fiscalCode: "DUP", merchantId: "m-B" }),
    ];
    const flags = ruleDuplicateFiscalCodes(receipts);
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("critical");
    expect(flags[0].merchantId).toBeNull();
  });

  it("produces stable, deterministic signatures for the same fiscal code", () => {
    const receipts = [
      receipt({ id: "r-1", fiscalCode: "STABLE", countryCode: "CI" }),
      receipt({ id: "r-2", fiscalCode: "STABLE", countryCode: "CI" }),
    ];
    const a = ruleDuplicateFiscalCodes(receipts);
    const b = ruleDuplicateFiscalCodes(receipts);
    expect(a[0].signature).toBe(b[0].signature);
  });

  it("treats the same fiscal code in two countries as independent flags", () => {
    const receipts = [
      receipt({ id: "r-1", fiscalCode: "CROSS", countryCode: "CI" }),
      receipt({ id: "r-2", fiscalCode: "CROSS", countryCode: "CI" }),
      receipt({ id: "r-3", fiscalCode: "CROSS", countryCode: "SN" }),
      receipt({ id: "r-4", fiscalCode: "CROSS", countryCode: "SN" }),
    ];
    const flags = ruleDuplicateFiscalCodes(receipts);
    expect(flags).toHaveLength(2);
    const countries = flags.map((f) => f.countryCode).sort();
    expect(countries).toEqual(["CI", "SN"]);
  });
});

// ─── Rule 2: STRUCTURED_SUBTHRESHOLD ─────────────────────────────────────────

describe("Rule 2 — STRUCTURED_SUBTHRESHOLD", () => {
  it("returns no flags for a merchant with fewer than 5 in-band receipts", () => {
    const receipts = Array.from({ length: 4 }, (_, i) =>
      receipt({ id: `r-${i}`, amount: "9500", currency: "XOF" })
    );
    expect(ruleStructuredSubthreshold(receipts)).toHaveLength(0);
  });

  it("flags a merchant with 5+ receipts clustered just below 10,000 XOF", () => {
    const receipts = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-sub", amount: "9200", currency: "XOF" })
    );
    const flags = ruleStructuredSubthreshold(receipts);
    expect(flags).toHaveLength(1);
    expect(flags[0].ruleCode).toBe("STRUCTURED_SUBTHRESHOLD");
    expect(flags[0].severity).toBe("medium");
    expect(flags[0].evidence).toMatchObject({ band: 10000, count: 5 });
  });

  it("escalates to high when 15+ receipts are clustered below the band", () => {
    const receipts = Array.from({ length: 15 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-high", amount: "9100", currency: "XOF" })
    );
    const flags = ruleStructuredSubthreshold(receipts);
    expect(flags[0].severity).toBe("high");
  });

  it("does not flag amounts above or exactly at the threshold", () => {
    const receipts = Array.from({ length: 10 }, (_, i) =>
      receipt({ id: `r-${i}`, amount: "10000", currency: "XOF" })
    );
    expect(ruleStructuredSubthreshold(receipts)).toHaveLength(0);
  });

  it("does not flag amounts below the lower band boundary", () => {
    const receipts = Array.from({ length: 10 }, (_, i) =>
      receipt({ id: `r-${i}`, amount: "8000", currency: "XOF" })
    );
    expect(ruleStructuredSubthreshold(receipts)).toHaveLength(0);
  });

  it("produces stable signatures for the same merchant + band combination", () => {
    const receipts = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-sig", amount: "9200" })
    );
    const a = ruleStructuredSubthreshold(receipts);
    const b = ruleStructuredSubthreshold(receipts);
    expect(a[0].signature).toBe(b[0].signature);
  });
});

// ─── Rule 3: GHOST_MERCHANT ───────────────────────────────────────────────────

describe("Rule 3 — GHOST_MERCHANT", () => {
  it("returns no flags when a merchant registered recently (< 30d)", () => {
    const m = merchant({ registeredAt: new Date(Date.now() - 5 * 86400_000) });
    expect(ruleGhostMerchant([m], [])).toHaveLength(0);
  });

  it("returns no flags when an old merchant has receipts", () => {
    const m = merchant({ id: "m-active", registeredAt: new Date(Date.now() - 60 * 86400_000) });
    const r = receipt({ merchantId: "m-active" });
    expect(ruleGhostMerchant([m], [r])).toHaveLength(0);
  });

  it("flags a merchant registered >30d ago with zero receipts", () => {
    const m = merchant({ id: "m-ghost", registeredAt: new Date(Date.now() - 45 * 86400_000) });
    const flags = ruleGhostMerchant([m], []);
    expect(flags).toHaveLength(1);
    expect(flags[0].ruleCode).toBe("GHOST_MERCHANT");
    expect(flags[0].severity).toBe("medium");
    expect(flags[0].merchantId).toBe("m-ghost");
  });

  it("ignores receipts from a different merchant when checking ghost status", () => {
    const m = merchant({ id: "m-ghost2", registeredAt: new Date(Date.now() - 60 * 86400_000) });
    const otherReceipt = receipt({ merchantId: "m-other" });
    const flags = ruleGhostMerchant([m], [otherReceipt]);
    expect(flags).toHaveLength(1);
  });

  it("produces stable signatures for the same merchant", () => {
    const m = merchant({ id: "m-ghost3", registeredAt: new Date(Date.now() - 50 * 86400_000) });
    const a = ruleGhostMerchant([m], []);
    const b = ruleGhostMerchant([m], []);
    expect(a[0].signature).toBe(b[0].signature);
  });
});

// ─── Rule 4: ABNORMAL_HOUR ────────────────────────────────────────────────────

describe("Rule 4 — ABNORMAL_HOUR", () => {
  it("returns no flags for normal business-hours receipts", () => {
    const receipts = [
      receipt({ id: "r-1", issuedAt: new Date("2026-04-01T09:00:00Z") }),
      receipt({ id: "r-2", issuedAt: new Date("2026-04-01T14:00:00Z") }),
      receipt({ id: "r-3", issuedAt: new Date("2026-04-01T17:00:00Z") }),
    ];
    expect(ruleAbnormalHour(receipts)).toHaveLength(0);
  });

  it("returns no flags when fewer than 3 night receipts exist for a merchant", () => {
    const receipts = [
      receipt({ id: "r-1", issuedAt: new Date("2026-04-01T02:00:00Z") }),
      receipt({ id: "r-2", issuedAt: new Date("2026-04-01T03:30:00Z") }),
    ];
    expect(ruleAbnormalHour(receipts)).toHaveLength(0);
  });

  it("flags a merchant with 3+ receipts issued between 00:00 and 05:00 UTC", () => {
    const receipts = [
      receipt({ id: "r-1", merchantId: "m-night", issuedAt: new Date("2026-04-01T01:00:00Z") }),
      receipt({ id: "r-2", merchantId: "m-night", issuedAt: new Date("2026-04-01T02:30:00Z") }),
      receipt({ id: "r-3", merchantId: "m-night", issuedAt: new Date("2026-04-01T04:45:00Z") }),
    ];
    const flags = ruleAbnormalHour(receipts);
    expect(flags).toHaveLength(1);
    expect(flags[0].ruleCode).toBe("ABNORMAL_HOUR");
    expect(flags[0].severity).toBe("medium");
  });

  it("escalates to high when 10+ night receipts are present", () => {
    const receipts = Array.from({ length: 10 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-night-high", issuedAt: new Date(`2026-04-${String(i + 1).padStart(2, "0")}T03:00:00Z`) })
    );
    const flags = ruleAbnormalHour(receipts);
    expect(flags[0].severity).toBe("high");
  });

  it("does not flag receipts issued exactly at 06:00 UTC (boundary)", () => {
    const receipts = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `r-${i}`, issuedAt: new Date("2026-04-01T06:00:00Z") })
    );
    expect(ruleAbnormalHour(receipts)).toHaveLength(0);
  });
});

// ─── Rule 5: SINGLE_DEVICE_BURST ─────────────────────────────────────────────

describe("Rule 5 — SINGLE_DEVICE_BURST", () => {
  it("returns no flags when receipts are spread over multiple minutes", () => {
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const receipts = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `r-${i}`, issuedAt: new Date(base + i * 60_000) })
    );
    expect(ruleSingleDeviceBurst(receipts)).toHaveLength(0);
  });

  it("returns no flags when exactly 4 receipts are within 60s (threshold is >4)", () => {
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const receipts = Array.from({ length: 4 }, (_, i) =>
      receipt({ id: `r-${i}`, issuedAt: new Date(base + i * 10_000) })
    );
    expect(ruleSingleDeviceBurst(receipts)).toHaveLength(0);
  });

  it("flags a merchant with 5 receipts within 60 seconds", () => {
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const receipts = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-burst", issuedAt: new Date(base + i * 10_000) })
    );
    const flags = ruleSingleDeviceBurst(receipts);
    expect(flags).toHaveLength(1);
    expect(flags[0].ruleCode).toBe("SINGLE_DEVICE_BURST");
    expect(flags[0].severity).toBe("high");
    expect(flags[0].evidence).toMatchObject({ peakRate: 5 });
  });

  it("escalates to critical when burst size is 10+", () => {
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const receipts = Array.from({ length: 10 }, (_, i) =>
      receipt({ id: `r-${i}`, merchantId: "m-burst-crit", issuedAt: new Date(base + i * 5_000) })
    );
    const flags = ruleSingleDeviceBurst(receipts);
    expect(flags[0].severity).toBe("critical");
  });

  it("detects a burst window inside a larger spread of receipts", () => {
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const spread = Array.from({ length: 3 }, (_, i) =>
      receipt({ id: `spread-${i}`, merchantId: "m-mixed", issuedAt: new Date(base + i * 120_000) })
    );
    const burst = Array.from({ length: 5 }, (_, i) =>
      receipt({ id: `burst-${i}`, merchantId: "m-mixed", issuedAt: new Date(base + 600_000 + i * 8_000) })
    );
    const flags = ruleSingleDeviceBurst([...spread, ...burst]);
    expect(flags).toHaveLength(1);
    expect(flags[0].evidence).toMatchObject({ peakRate: 5 });
  });
});

// ─── computeMerchantComplianceScore ──────────────────────────────────────────

describe("computeMerchantComplianceScore", () => {
  it("returns 90 for an ideal merchant with no flags and recent activity (max achievable)", () => {
    // recency(30) + frequency(25) + growth(20) + diversity(15) − penalty(0) = 90
    const { score } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 50,
      monthOverMonthDeltaPct: 50,
      categoryDiversity: 5,
      openFraudFlags: 0,
    });
    expect(score).toBe(90);
  });

  it("returns 0 or very low for a ghost merchant with open flags", () => {
    const { score } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 999,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: -100,
      categoryDiversity: 0,
      openFraudFlags: 5,
    });
    expect(score).toBeLessThanOrEqual(10);
  });

  it("recency component caps at 30 points (30 - min(30, days))", () => {
    const { breakdown: a } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: 0,
      categoryDiversity: 0,
      openFraudFlags: 0,
    });
    const { breakdown: b } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 30,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: 0,
      categoryDiversity: 0,
      openFraudFlags: 0,
    });
    expect(a.recency).toBe(30);
    expect(b.recency).toBe(0);
  });

  it("frequency component caps at 25 (receipts × 0.5)", () => {
    const { breakdown } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 100,
      monthOverMonthDeltaPct: 0,
      categoryDiversity: 0,
      openFraudFlags: 0,
    });
    expect(breakdown.frequency).toBe(25);
  });

  it("penalty component caps at 10 and is reflected as negative", () => {
    const { breakdown, score: scoreHigh } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: 0,
      categoryDiversity: 0,
      openFraudFlags: 10,
    });
    const { score: scoreZero } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: 0,
      categoryDiversity: 0,
      openFraudFlags: 0,
    });
    expect(breakdown.penalty).toBe(-10);
    expect(scoreHigh).toBeLessThan(scoreZero);
  });

  it("score never goes below 0 regardless of inputs", () => {
    const { score } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 999,
      receiptsLast30Days: 0,
      monthOverMonthDeltaPct: -999,
      categoryDiversity: 0,
      openFraudFlags: 100,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("score never exceeds 100 regardless of inputs", () => {
    const { score } = computeMerchantComplianceScore({
      daysSinceLastReceipt: 0,
      receiptsLast30Days: 9999,
      monthOverMonthDeltaPct: 9999,
      categoryDiversity: 9999,
      openFraudFlags: 0,
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it("breakdown keys sum correctly to the score (within rounding)", () => {
    const input = {
      daysSinceLastReceipt: 5,
      receiptsLast30Days: 20,
      monthOverMonthDeltaPct: 10,
      categoryDiversity: 3,
      openFraudFlags: 1,
    };
    const { score, breakdown } = computeMerchantComplianceScore(input);
    const rawSum = breakdown.recency + breakdown.frequency + breakdown.growth + breakdown.diversity + breakdown.penalty;
    expect(score).toBe(Math.round(rawSum));
  });
});
