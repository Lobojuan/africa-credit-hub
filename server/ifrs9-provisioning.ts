/**
 * IFRS 9 provisioning workbench — calculation primitives only.
 *
 * This module produces a transparent draft expected-credit-loss calculation.
 * It must be driven by a bank-approved, versioned policy and independently
 * reviewed before any provision, interest-recognition or general-ledger action.
 */

export type Ifrs9Stage = "stage_1" | "stage_2" | "stage_3";

export type Ifrs9Policy = {
  id: string;
  version: string;
  country: string;
  sicrDaysPastDue: number;
  defaultDaysPastDue: number;
  cureMonthsRequired: number;
  creditImpairedStatuses: readonly string[];
};

export type EclScenario = {
  id: string;
  label: string;
  weight: number;
  pdMultiplier: number;
  lgdMultiplier: number;
};

export type EclExposure = {
  grossCarryingAmount: number;
  undrawnCommitment?: number;
  creditConversionFactor?: number;
  effectiveInterestRateAnnual: number;
  pd12Month: number;
  lifetimePd: number;
  lgd: number;
  lifetimeMonths: number;
  daysPastDue: number;
  accountStatus: string;
  restructured?: boolean;
  previouslyCreditImpaired?: boolean;
  monthsPerformingAfterCure?: number;
};

export type DraftEclResult = {
  stage: Ifrs9Stage;
  ead: number;
  pdBasis: "12_month" | "lifetime";
  horizonMonths: number;
  discountFactor: number;
  probabilityWeightedEcl: number;
  scenarioResults: Array<{ id: string; label: string; weight: number; pd: number; lgd: number; discountedEcl: number }>;
  reasons: string[];
  accountingTreatment: "gross_carrying_amount_interest" | "net_carrying_amount_interest";
  reviewRequired: true;
};

function requireRate(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be a decimal between 0 and 1`);
}

function requireMoney(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative number`);
}

function inferStage(exposure: EclExposure, policy: Ifrs9Policy): Pick<DraftEclResult, "stage" | "pdBasis" | "horizonMonths" | "reasons" | "accountingTreatment"> {
  const status = exposure.accountStatus.trim().toLowerCase();
  const isCreditImpaired = policy.creditImpairedStatuses.map(value => value.toLowerCase()).includes(status)
    || exposure.daysPastDue >= policy.defaultDaysPastDue;
  // A cure cannot be inferred merely from time passing. The facility must be
  // currently performing with no arrears, and its prior impairment must be
  // explicitly evidenced by the source system/policy workflow.
  const curedEnough = Boolean(exposure.previouslyCreditImpaired)
    && status === "current"
    && exposure.daysPastDue === 0
    && (exposure.monthsPerformingAfterCure ?? 0) >= policy.cureMonthsRequired;

  if (isCreditImpaired && !curedEnough) {
    return {
      stage: "stage_3", pdBasis: "lifetime", horizonMonths: exposure.lifetimeMonths,
      reasons: [status !== "current" ? `Credit-impaired status: ${status}` : `${exposure.daysPastDue} days past due meets the policy default threshold`, curedEnough ? "" : "Cure threshold has not been met"].filter(Boolean),
      accountingTreatment: "net_carrying_amount_interest",
    };
  }

  if (exposure.daysPastDue >= policy.sicrDaysPastDue || Boolean(exposure.restructured) || curedEnough) {
    const reasons = [
      exposure.daysPastDue >= policy.sicrDaysPastDue ? `${exposure.daysPastDue} days past due meets the SICR threshold` : "",
      exposure.restructured ? "Restructured facility requires policy review" : "",
      curedEnough ? "Cured credit-impaired facility remains in lifetime ECL pending policy-approved migration" : "",
    ].filter(Boolean);
    return { stage: "stage_2", pdBasis: "lifetime", horizonMonths: exposure.lifetimeMonths, reasons, accountingTreatment: "gross_carrying_amount_interest" };
  }

  return {
    stage: "stage_1", pdBasis: "12_month", horizonMonths: Math.min(12, exposure.lifetimeMonths),
    reasons: ["No policy-defined significant increase in credit risk identified"],
    accountingTreatment: "gross_carrying_amount_interest",
  };
}

/** Calculates a draft ECL. Values are decimals (for example 0.025 = 2.5%). */
export function calculateDraftEcl(exposure: EclExposure, policy: Ifrs9Policy, scenarios: readonly EclScenario[]): DraftEclResult {
  requireMoney(exposure.grossCarryingAmount, "grossCarryingAmount");
  requireMoney(exposure.undrawnCommitment ?? 0, "undrawnCommitment");
  requireRate(exposure.creditConversionFactor ?? 0, "creditConversionFactor");
  requireRate(exposure.effectiveInterestRateAnnual, "effectiveInterestRateAnnual");
  requireRate(exposure.pd12Month, "pd12Month");
  requireRate(exposure.lifetimePd, "lifetimePd");
  requireRate(exposure.lgd, "lgd");
  if (!Number.isFinite(exposure.lifetimeMonths) || exposure.lifetimeMonths <= 0) throw new Error("lifetimeMonths must be greater than zero");
  if (!Number.isFinite(exposure.daysPastDue) || exposure.daysPastDue < 0) throw new Error("daysPastDue must be a non-negative number");
  if (!scenarios.length) throw new Error("At least one forward-looking scenario is required");

  const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.000001) throw new Error("Scenario weights must total 1");
  scenarios.forEach((scenario) => {
    requireRate(scenario.weight, `scenario ${scenario.id} weight`);
    if (!Number.isFinite(scenario.pdMultiplier) || scenario.pdMultiplier < 0) throw new Error(`scenario ${scenario.id} pdMultiplier must be non-negative`);
    if (!Number.isFinite(scenario.lgdMultiplier) || scenario.lgdMultiplier < 0) throw new Error(`scenario ${scenario.id} lgdMultiplier must be non-negative`);
  });

  const classification = inferStage(exposure, policy);
  const basePd = classification.pdBasis === "12_month" ? exposure.pd12Month : exposure.lifetimePd;
  const ead = exposure.grossCarryingAmount + (exposure.undrawnCommitment ?? 0) * (exposure.creditConversionFactor ?? 0);
  const discountFactor = 1 / Math.pow(1 + exposure.effectiveInterestRateAnnual, classification.horizonMonths / 12);
  const scenarioResults = scenarios.map((scenario) => {
    const pd = Math.min(1, basePd * scenario.pdMultiplier);
    const lgd = Math.min(1, exposure.lgd * scenario.lgdMultiplier);
    return { id: scenario.id, label: scenario.label, weight: scenario.weight, pd, lgd, discountedEcl: ead * pd * lgd * discountFactor };
  });
  const probabilityWeightedEcl = scenarioResults.reduce((sum, scenario) => sum + scenario.weight * scenario.discountedEcl, 0);

  return { ...classification, ead, discountFactor, scenarioResults, probabilityWeightedEcl, reviewRequired: true };
}

/** Illustrative policy only. A bank must create, approve and version its own policy before use. */
export const GHANA_IFRS9_DRAFT_POLICY: Ifrs9Policy = {
  id: "ghana-ifrs9-draft", version: "draft-not-for-posting", country: "Ghana",
  sicrDaysPastDue: 30, defaultDaysPastDue: 90, cureMonthsRequired: 3,
  creditImpairedStatuses: ["default", "written_off"],
};
