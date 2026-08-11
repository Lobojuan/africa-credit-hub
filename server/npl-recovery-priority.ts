/**
 * NPL Recovery Priority Ranking Engine
 *
 * Computes a transparent 0–100 priority score for non-performing loan cases.
 * The score drives collection-team workload routing; it is NOT a credit
 * decision and does NOT feed into the borrower's credit file.
 *
 * Factor weights (sum = 100):
 *   Arrears recency          25 pts
 *   Collateral coverage      30 pts  (with staleness haircut)
 *   Restructure history      20 pts
 *   BoG asset classification 15 pts
 *   Legal routing            10 pts
 *
 * Any case with hasLegalFlag=true is placed in the "legal-track" band
 * regardless of numeric score.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const RECOVERY_PRIORITY_BANDS = [
  "high",
  "medium",
  "low",
  "legal-track",
] as const;

export type RecoveryPriorityBand = (typeof RECOVERY_PRIORITY_BANDS)[number];

/** BoG (Bank of Ghana) prudential asset classification codes */
export type BoGClassification =
  | "OLEM"        // Other Loans Especially Mentioned
  | "SUBSTANDARD" // Substandard
  | "DOUBTFUL"    // Doubtful
  | "LOSS";       // Loss

export interface RecoveryPriorityInput {
  /** Days since last payment was received */
  daysSinceLastPayment: number;

  /** Outstanding principal in minor currency units (e.g. pesewas) */
  outstandingPrincipalMinor: bigint;

  /** Appraised collateral value in minor currency units */
  collateralValueMinor: bigint;

  /** Days since the collateral valuation was performed */
  collateralValuationAgeDays: number;

  /** Number of previous restructuring agreements on this case */
  priorRestructureCount: number;

  /** BoG prudential classification for this loan */
  bogClassification: BoGClassification;

  /**
   * True if the case has been referred to legal / external collections.
   * Overrides band to "legal-track" regardless of numeric score.
   */
  hasLegalFlag: boolean;
}

export interface RecoveryPriorityFactorBreakdown {
  arrearsScore: number;
  collateralScore: number;
  restructureScore: number;
  classificationScore: number;
  legalScore: number;
  collateralStalenessMultiplier: number;
}

export interface RecoveryPriorityResult {
  score: number;
  band: RecoveryPriorityBand;
  factorBreakdown: RecoveryPriorityFactorBreakdown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEIGHTS = {
  arrears: 25,
  collateral: 30,
  restructure: 20,
  classification: 15,
  legal: 10,
} as const;

/**
 * Collateral staleness haircut schedule.
 * A stale valuation is worth less; older = lower multiplier.
 * Applied as (collateralValue × multiplier) before coverage ratio.
 * Uses ×1000 integer arithmetic to avoid floating-point drift.
 */
const STALENESS_SCHEDULE: Array<{ maxAgeDays: number; multiplierX1000: number }> = [
  { maxAgeDays: 180, multiplierX1000: 1000 }, // ≤180 d → 1.00×
  { maxAgeDays: 365, multiplierX1000: 900 },  // ≤365 d → 0.90×
  { maxAgeDays: 730, multiplierX1000: 750 },  // ≤730 d → 0.75×
];
/** Fallback for valuations older than 730 days */
const STALENESS_FALLBACK_X1000 = 500; // 0.50×

// BoG classification → maximum points this factor can contribute
const CLASSIFICATION_SCORE_MAP: Record<BoGClassification, number> = {
  OLEM: 3,        // Still performing-ish, lowest urgency lift
  SUBSTANDARD: 6,
  DOUBTFUL: 10,
  LOSS: 15,       // Maximum urgency
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Clamp a value to [0, max] and round to nearest integer. */
function clamp(value: number, max: number): number {
  return Math.min(Math.max(Math.round(value), 0), max);
}

/**
 * Return the staleness multiplier × 1000 for a valuation of the given age.
 * E.g. 400 days → 900 (representing 0.90×).
 */
function stalenessMultiplierX1000(ageDays: number): number {
  for (const bracket of STALENESS_SCHEDULE) {
    if (ageDays <= bracket.maxAgeDays) {
      return bracket.multiplierX1000;
    }
  }
  return STALENESS_FALLBACK_X1000;
}

// ---------------------------------------------------------------------------
// Factor scorers
// ---------------------------------------------------------------------------

/**
 * Arrears recency score (0–25).
 * Longer overdue → higher score (more urgent to recover).
 *
 * Thresholds:
 *   <  30 d →  0 pts
 *    30–89 d →  8 pts
 *    90–179 d → 16 pts
 *   180–364 d → 21 pts
 *   ≥ 365 d → 25 pts
 */
function scoreArrears(daysSinceLastPayment: number): number {
  if (daysSinceLastPayment < 30) return 0;
  if (daysSinceLastPayment < 90) return 8;
  if (daysSinceLastPayment < 180) return 16;
  if (daysSinceLastPayment < 365) return 21;
  return WEIGHTS.arrears; // 25
}

/**
 * Collateral coverage score (0–30).
 * Lower coverage → higher score (harder to recover from collateral).
 *
 * Effective collateral = appraised value × staleness multiplier.
 * Coverage ratio      = effective collateral / outstanding principal.
 *
 *   ratio ≥ 1.50 →  0 pts  (over-collateralised, low recovery urgency)
 *   ratio ≥ 1.00 →  8 pts
 *   ratio ≥ 0.75 → 16 pts
 *   ratio ≥ 0.50 → 22 pts
 *   ratio <  0.50 → 30 pts (severely under-collateralised)
 *   principal = 0 →  0 pts (edge-case guard)
 */
function scoreCollateral(
  outstandingPrincipalMinor: bigint,
  collateralValueMinor: bigint,
  collateralValuationAgeDays: number,
): { score: number; stalenessMultiplierX1000: number } {
  const multiplierX1000 = stalenessMultiplierX1000(collateralValuationAgeDays);

  if (outstandingPrincipalMinor <= 0n) {
    return { score: 0, stalenessMultiplierX1000: multiplierX1000 };
  }

  // Effective collateral in minor units (BigInt arithmetic, then convert for ratio)
  const effectiveCollateralMinor =
    (collateralValueMinor * BigInt(multiplierX1000)) / 1000n;

  // Convert to Number only for the ratio — precision is sufficient here
  // (GHS amounts are unlikely to exceed Number.MAX_SAFE_INTEGER / 1000)
  const ratio =
    Number(effectiveCollateralMinor) / Number(outstandingPrincipalMinor);

  let score: number;
  if (ratio >= 1.5) score = 0;
  else if (ratio >= 1.0) score = 8;
  else if (ratio >= 0.75) score = 16;
  else if (ratio >= 0.5) score = 22;
  else score = WEIGHTS.collateral; // 30

  return { score, stalenessMultiplierX1000: multiplierX1000 };
}

/**
 * Restructure history score (0–20).
 * More restructures → higher score (higher default risk, needs attention).
 *
 *   0 prior →  0 pts
 *   1 prior →  7 pts
 *   2 prior → 14 pts
 *   ≥3 prior → 20 pts
 */
function scoreRestructure(priorRestructureCount: number): number {
  if (priorRestructureCount <= 0) return 0;
  if (priorRestructureCount === 1) return 7;
  if (priorRestructureCount === 2) return 14;
  return WEIGHTS.restructure; // 20
}

/**
 * BoG asset classification score (0–15).
 * Maps directly from the CLASSIFICATION_SCORE_MAP constant.
 */
function scoreClassification(bogClassification: BoGClassification): number {
  return CLASSIFICATION_SCORE_MAP[bogClassification] ?? 0;
}

/**
 * Legal routing score (0–10).
 * If the case already has a legal flag it earns the full 10 points AND
 * will be placed in the "legal-track" band by the main function.
 */
function scoreLegal(hasLegalFlag: boolean): number {
  return hasLegalFlag ? WEIGHTS.legal : 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the NPL recovery priority score and band for a single case.
 *
 * @param input - Case data required for scoring
 * @returns score (0–100), band, and full factor breakdown
 */
export function calculateRecoveryPriorityScore(
  input: RecoveryPriorityInput,
): RecoveryPriorityResult {
  const {
    daysSinceLastPayment,
    outstandingPrincipalMinor,
    collateralValueMinor,
    collateralValuationAgeDays,
    priorRestructureCount,
    bogClassification,
    hasLegalFlag,
  } = input;

  const arrearsScore = clamp(
    scoreArrears(daysSinceLastPayment),
    WEIGHTS.arrears,
  );

  const { score: rawCollateralScore, stalenessMultiplierX1000: multiplierX1000 } =
    scoreCollateral(
      outstandingPrincipalMinor,
      collateralValueMinor,
      collateralValuationAgeDays,
    );
  const collateralScore = clamp(rawCollateralScore, WEIGHTS.collateral);

  const restructureScore = clamp(
    scoreRestructure(priorRestructureCount),
    WEIGHTS.restructure,
  );

  const classificationScore = clamp(
    scoreClassification(bogClassification),
    WEIGHTS.classification,
  );

  const legalScore = clamp(scoreLegal(hasLegalFlag), WEIGHTS.legal);

  const score = clamp(
    arrearsScore + collateralScore + restructureScore + classificationScore + legalScore,
    100,
  );

  // Legal flag overrides band assignment regardless of numeric score
  let band: RecoveryPriorityBand;
  if (hasLegalFlag) {
    band = "legal-track";
  } else if (score >= 70) {
    band = "high";
  } else if (score >= 40) {
    band = "medium";
  } else {
    band = "low";
  }

  return {
    score,
    band,
    factorBreakdown: {
      arrearsScore,
      collateralScore,
      restructureScore,
      classificationScore,
      legalScore,
      collateralStalenessMultiplier: multiplierX1000 / 1000,
    },
  };
}
