import { describe, expect, it } from "vitest";
import { calculateDraftEcl, GHANA_IFRS9_DRAFT_POLICY } from "../ifrs9-provisioning";

const scenarios = [
  { id: "base", label: "Base", weight: 0.6, pdMultiplier: 1, lgdMultiplier: 1 },
  { id: "downside", label: "Downside", weight: 0.4, pdMultiplier: 1.5, lgdMultiplier: 1.2 },
];

const base = {
  grossCarryingAmount: 100_000, effectiveInterestRateAnnual: 0.12,
  pd12Month: 0.02, lifetimePd: 0.10, lgd: 0.45, lifetimeMonths: 36,
  daysPastDue: 0, accountStatus: "current",
};

describe("calculateDraftEcl", () => {
  it("uses 12-month ECL for a performing Stage 1 facility", () => {
    const result = calculateDraftEcl(base, GHANA_IFRS9_DRAFT_POLICY, scenarios);
    expect(result.stage).toBe("stage_1");
    expect(result.pdBasis).toBe("12_month");
    expect(result.ead).toBe(100_000);
    expect(result.probabilityWeightedEcl).toBeGreaterThan(0);
    expect(result.reviewRequired).toBe(true);
  });

  it("moves a 30 DPD facility to Stage 2 lifetime ECL", () => {
    const result = calculateDraftEcl({ ...base, daysPastDue: 30 }, GHANA_IFRS9_DRAFT_POLICY, scenarios);
    expect(result.stage).toBe("stage_2");
    expect(result.pdBasis).toBe("lifetime");
    expect(result.probabilityWeightedEcl).toBeGreaterThan(calculateDraftEcl(base, GHANA_IFRS9_DRAFT_POLICY, scenarios).probabilityWeightedEcl);
  });

  it("keeps a defaulted facility in Stage 3 until the policy cure period is met", () => {
    const result = calculateDraftEcl({ ...base, daysPastDue: 95, accountStatus: "default", monthsPerformingAfterCure: 2 }, GHANA_IFRS9_DRAFT_POLICY, scenarios);
    expect(result.stage).toBe("stage_3");
    expect(result.accountingTreatment).toBe("net_carrying_amount_interest");
  });

  it("keeps a cured default in Stage 2 lifetime ECL for reviewed migration", () => {
    const result = calculateDraftEcl({ ...base, daysPastDue: 95, accountStatus: "default", monthsPerformingAfterCure: 3 }, GHANA_IFRS9_DRAFT_POLICY, scenarios);
    expect(result.stage).toBe("stage_2");
    expect(result.reasons.join(" ")).toMatch(/Cured credit-impaired/);
  });

  it("includes undrawn commitments through the approved conversion factor", () => {
    const result = calculateDraftEcl({ ...base, undrawnCommitment: 20_000, creditConversionFactor: 0.5 }, GHANA_IFRS9_DRAFT_POLICY, scenarios);
    expect(result.ead).toBe(110_000);
  });

  it("rejects scenario sets that are not probability weighted", () => {
    expect(() => calculateDraftEcl(base, GHANA_IFRS9_DRAFT_POLICY, [{ ...scenarios[0], weight: 0.9 }])).toThrow(/weights must total 1/i);
  });
});
