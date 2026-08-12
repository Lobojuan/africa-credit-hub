/**
 * Deterministic metrics for a governed NPL reduction plan.
 *
 * These calculations describe the gap between the scoped loan portfolio and a
 * bank-approved target. They do not classify an account, authorise a cure or
 * write-off, or replace the bank's regulatory return.
 */

export type NplPortfolioInputs = {
  grossLoanExposure: number;
  grossNplExposure: number;
  watchlistExposure: number;
  assignedNplExposure: number;
  targetNplRatio: number;
};

export type NplReductionMetrics = NplPortfolioInputs & {
  currentNplRatio: number;
  targetNplExposure: number;
  requiredNplReduction: number;
  relativeNplReductionRequired: number;
  assignmentCoveragePct: number;
  withinTarget: boolean;
};

function requireNonNegative(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
}
function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateNplReductionMetrics(input: NplPortfolioInputs): NplReductionMetrics {
  requireNonNegative(input.grossLoanExposure, "grossLoanExposure");
  requireNonNegative(input.grossNplExposure, "grossNplExposure");
  requireNonNegative(input.watchlistExposure, "watchlistExposure");
  requireNonNegative(input.assignedNplExposure, "assignedNplExposure");
  if (!Number.isFinite(input.targetNplRatio) || input.targetNplRatio < 0 || input.targetNplRatio > 100) {
    throw new Error("targetNplRatio must be between 0 and 100");
  }
  if (input.grossNplExposure > input.grossLoanExposure) {
    throw new Error("grossNplExposure cannot exceed grossLoanExposure");
  }
  if (input.assignedNplExposure > input.grossNplExposure) {
    throw new Error("assignedNplExposure cannot exceed grossNplExposure");
  }

  const currentNplRatio = input.grossLoanExposure > 0
    ? (input.grossNplExposure / input.grossLoanExposure) * 100
    : 0;
  const targetNplExposure = input.grossLoanExposure * (input.targetNplRatio / 100);
  const requiredNplReduction = Math.max(0, input.grossNplExposure - targetNplExposure);

  return {
    ...input,
    currentNplRatio: round(currentNplRatio),
    targetNplExposure: round(targetNplExposure),
    requiredNplReduction: round(requiredNplReduction),
    relativeNplReductionRequired: input.grossNplExposure > 0
      ? round((requiredNplReduction / input.grossNplExposure) * 100)
      : 0,
    assignmentCoveragePct: input.grossNplExposure > 0
      ? round((input.assignedNplExposure / input.grossNplExposure) * 100)
      : 100,
    withinTarget: currentNplRatio <= input.targetNplRatio,
  };
}
