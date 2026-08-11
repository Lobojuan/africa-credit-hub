import { describe, expect, it } from "vitest";
import { calculateNplReductionMetrics } from "../npl-reduction-plan";

describe("calculateNplReductionMetrics", () => {
  it("calculates the exposure reduction required to reach a 10% ceiling", () => {
    const result = calculateNplReductionMetrics({
      grossLoanExposure: 1_000_000,
      grossNplExposure: 230_900,
      watchlistExposure: 80_000,
      assignedNplExposure: 180_000,
      targetNplRatio: 10,
    });

    expect(result.currentNplRatio).toBe(23.09);
    expect(result.targetNplExposure).toBe(100_000);
    expect(result.requiredNplReduction).toBe(130_900);
    expect(result.relativeNplReductionRequired).toBe(56.69);
    expect(result.assignmentCoveragePct).toBe(77.96);
    expect(result.withinTarget).toBe(false);
  });

  it("does not report a reduction gap for a portfolio already within target", () => {
    const result = calculateNplReductionMetrics({
      grossLoanExposure: 1_000_000,
      grossNplExposure: 80_000,
      watchlistExposure: 20_000,
      assignedNplExposure: 80_000,
      targetNplRatio: 10,
    });

    expect(result.requiredNplReduction).toBe(0);
    expect(result.withinTarget).toBe(true);
    expect(result.assignmentCoveragePct).toBe(100);
  });

  it("rejects inconsistent portfolio inputs", () => {
    expect(() => calculateNplReductionMetrics({
      grossLoanExposure: 100,
      grossNplExposure: 120,
      watchlistExposure: 0,
      assignedNplExposure: 0,
      targetNplRatio: 10,
    })).toThrow(/cannot exceed/);
  });
});
