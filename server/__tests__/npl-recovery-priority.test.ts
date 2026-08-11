/**
 * Unit tests for the NPL Recovery Priority Ranking Engine
 *
 * Tests cover:
 *   1. Band categorisation (high / medium / low thresholds)
 *   2. Collateral staleness discount schedule
 *   3. Legal-track routing (overrides numeric score)
 *   4. Input validation edge cases
 *   5. Factor breakdown transparency (scores sum correctly)
 */

import { describe, it, expect } from "vitest";
import {
  calculateRecoveryPriorityScore,
  RECOVERY_PRIORITY_BANDS,
  type RecoveryPriorityInput,
} from "../npl-recovery-priority";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_INPUT: RecoveryPriorityInput = {
  daysSinceLastPayment: 90,            // 16 pts arrears
  outstandingPrincipalMinor: 100_000n, // GHS 1 000.00
  collateralValueMinor: 150_000n,      // GHS 1 500.00  → 1.5× ratio → 0 pts collateral
  collateralValuationAgeDays: 30,      // fresh → 1.00× multiplier
  priorRestructureCount: 0,            // 0 pts restructure
  bogClassification: "OLEM",           // 3 pts classification
  hasLegalFlag: false,                 // 0 pts legal
};
// Expected base score: 16 + 0 + 0 + 3 + 0 = 19 → band "low"

// ---------------------------------------------------------------------------
// 1. Band categorisation
// ---------------------------------------------------------------------------

describe("Band categorisation", () => {
  it("scores ≥70 → high band", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 400,       // 25 pts
      collateralValueMinor: 0n,        // 0 coverage → 30 pts
      priorRestructureCount: 3,        // 20 pts
      bogClassification: "LOSS",       // 15 pts
      hasLegalFlag: false,             // 0 pts
    };
    // 25 + 30 + 20 + 15 + 0 = 90
    const { score, band } = calculateRecoveryPriorityScore(input);
    expect(score).toBe(90);
    expect(band).toBe("high");
  });

  it("scores 40–69 → medium band", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 200,       // 21 pts
      collateralValueMinor: 80_000n,   // 0.8× ratio → 16 pts
      priorRestructureCount: 1,        // 7 pts
      bogClassification: "SUBSTANDARD",// 6 pts
      hasLegalFlag: false,             // 0 pts
    };
    // 21 + 16 + 7 + 6 + 0 = 50
    const { score, band } = calculateRecoveryPriorityScore(input);
    expect(score).toBe(50);
    expect(band).toBe("medium");
  });

  it("scores <40 → low band", () => {
    const { score, band } = calculateRecoveryPriorityScore(BASE_INPUT);
    expect(score).toBe(19);
    expect(band).toBe("low");
  });

  it("score is clamped to 100", () => {
    const input: RecoveryPriorityInput = {
      daysSinceLastPayment: 999,
      outstandingPrincipalMinor: 100_000n,
      collateralValueMinor: 0n,
      collateralValuationAgeDays: 0,
      priorRestructureCount: 99,
      bogClassification: "LOSS",
      hasLegalFlag: true,
    };
    const { score } = calculateRecoveryPriorityScore(input);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("RECOVERY_PRIORITY_BANDS constant contains all four bands", () => {
    expect(RECOVERY_PRIORITY_BANDS).toContain("high");
    expect(RECOVERY_PRIORITY_BANDS).toContain("medium");
    expect(RECOVERY_PRIORITY_BANDS).toContain("low");
    expect(RECOVERY_PRIORITY_BANDS).toContain("legal-track");
    expect(RECOVERY_PRIORITY_BANDS).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// 2. Collateral staleness discount
// ---------------------------------------------------------------------------

describe("Collateral staleness discount", () => {
  const principalMinor = 100_000n; // GHS 1 000.00
  // Collateral set to exactly 1.2× principal → fresh valuation = 1.20 ratio → 8 pts
  const collateralMinor = 120_000n; // GHS 1 200.00

  it("≤180 days → 1.00× multiplier (no haircut)", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: principalMinor,
      collateralValueMinor: collateralMinor,
      collateralValuationAgeDays: 180,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralStalenessMultiplier).toBe(1.0);
    // ratio = 120 000 × 1.00 / 100 000 = 1.20 → 8 pts
    expect(factorBreakdown.collateralScore).toBe(8);
  });

  it("181–365 days → 0.90× multiplier", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: principalMinor,
      collateralValueMinor: collateralMinor,
      collateralValuationAgeDays: 270,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralStalenessMultiplier).toBe(0.9);
    // ratio = 120 000 × 0.90 / 100 000 = 1.08 → still ≥1.0 → 8 pts
    expect(factorBreakdown.collateralScore).toBe(8);
  });

  it("366–730 days → 0.75× multiplier", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: principalMinor,
      collateralValueMinor: collateralMinor,
      collateralValuationAgeDays: 500,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralStalenessMultiplier).toBe(0.75);
    // ratio = 120 000 × 0.75 / 100 000 = 0.90 → ≥0.75 → 16 pts
    expect(factorBreakdown.collateralScore).toBe(16);
  });

  it("≥731 days → 0.50× multiplier", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: principalMinor,
      collateralValueMinor: collateralMinor,
      collateralValuationAgeDays: 731,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralStalenessMultiplier).toBe(0.5);
    // ratio = 120 000 × 0.50 / 100 000 = 0.60 → ≥0.50 → 22 pts
    expect(factorBreakdown.collateralScore).toBe(22);
  });

  it("severely under-collateralised → 30 pts collateral", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: 100_000n,
      collateralValueMinor: 30_000n, // 0.30 ratio even before haircut
      collateralValuationAgeDays: 0,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralScore).toBe(30);
  });

  it("zero outstanding principal → 0 pts collateral (no division by zero)", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      outstandingPrincipalMinor: 0n,
      collateralValueMinor: 50_000n,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.collateralScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Legal-track routing
// ---------------------------------------------------------------------------

describe("Legal-track routing", () => {
  it("hasLegalFlag=true → band='legal-track' regardless of score", () => {
    // Low-scoring case
    const lowInput: RecoveryPriorityInput = {
      ...BASE_INPUT,
      hasLegalFlag: true,
    };
    const low = calculateRecoveryPriorityScore(lowInput);
    expect(low.band).toBe("legal-track");

    // High-scoring case
    const highInput: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 400,
      collateralValueMinor: 0n,
      priorRestructureCount: 3,
      bogClassification: "LOSS",
      hasLegalFlag: true,
    };
    const high = calculateRecoveryPriorityScore(highInput);
    expect(high.band).toBe("legal-track");
    expect(high.score).toBeGreaterThanOrEqual(70); // score is still computed
  });

  it("hasLegalFlag=true → legalScore=10", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      hasLegalFlag: true,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.legalScore).toBe(10);
  });

  it("hasLegalFlag=false → legalScore=0", () => {
    const { factorBreakdown } = calculateRecoveryPriorityScore(BASE_INPUT);
    expect(factorBreakdown.legalScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Input validation edge cases
// ---------------------------------------------------------------------------

describe("Input edge cases", () => {
  it("daysSinceLastPayment=0 → arrears score 0", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 0,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.arrearsScore).toBe(0);
  });

  it("daysSinceLastPayment=29 → arrears score 0", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 29,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.arrearsScore).toBe(0);
  });

  it("daysSinceLastPayment=365 → arrears score 25", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      daysSinceLastPayment: 365,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.arrearsScore).toBe(25);
  });

  it("priorRestructureCount=0 → restructureScore=0", () => {
    const { factorBreakdown } = calculateRecoveryPriorityScore(BASE_INPUT);
    expect(factorBreakdown.restructureScore).toBe(0);
  });

  it("priorRestructureCount=3 → restructureScore=20", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      priorRestructureCount: 3,
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.restructureScore).toBe(20);
  });

  it("bogClassification=LOSS → classificationScore=15", () => {
    const input: RecoveryPriorityInput = {
      ...BASE_INPUT,
      bogClassification: "LOSS",
    };
    const { factorBreakdown } = calculateRecoveryPriorityScore(input);
    expect(factorBreakdown.classificationScore).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// 5. Factor breakdown transparency
// ---------------------------------------------------------------------------

describe("Factor breakdown transparency", () => {
  it("factorBreakdown scores sum to the overall score", () => {
    const inputs: RecoveryPriorityInput[] = [
      BASE_INPUT,
      { ...BASE_INPUT, daysSinceLastPayment: 400, bogClassification: "LOSS" },
      { ...BASE_INPUT, hasLegalFlag: true, priorRestructureCount: 2 },
    ];
    for (const input of inputs) {
      const { score, factorBreakdown } = calculateRecoveryPriorityScore(input);
      const sumOfFactors =
        factorBreakdown.arrearsScore +
        factorBreakdown.collateralScore +
        factorBreakdown.restructureScore +
        factorBreakdown.classificationScore +
        factorBreakdown.legalScore;
      expect(sumOfFactors).toBe(score);
    }
  });

  it("factorBreakdown contains all required keys", () => {
    const { factorBreakdown } = calculateRecoveryPriorityScore(BASE_INPUT);
    expect(factorBreakdown).toHaveProperty("arrearsScore");
    expect(factorBreakdown).toHaveProperty("collateralScore");
    expect(factorBreakdown).toHaveProperty("restructureScore");
    expect(factorBreakdown).toHaveProperty("classificationScore");
    expect(factorBreakdown).toHaveProperty("legalScore");
    expect(factorBreakdown).toHaveProperty("collateralStalenessMultiplier");
  });

  it("collateralStalenessMultiplier is always in [0.5, 1.0]", () => {
    const ages = [0, 90, 181, 366, 731, 9999];
    for (const age of ages) {
      const { factorBreakdown } = calculateRecoveryPriorityScore({
        ...BASE_INPUT,
        collateralValuationAgeDays: age,
      });
      expect(factorBreakdown.collateralStalenessMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(factorBreakdown.collateralStalenessMultiplier).toBeLessThanOrEqual(1.0);
    }
  });
});
