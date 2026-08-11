export const NPL_CASE_STAGES = ["watchlist", "npl", "workout", "legal", "resolved"] as const;
export type NplCaseStage = typeof NPL_CASE_STAGES[number];

export const NPL_EVENT_TYPES = [
  "case_opened",
  "npl_inflow_observed",
  "cash_recovery_observed",
  "legal_recovery_observed",
  "workflow_stage_changed",
  "collection_activity_linked",
  "note",
] as const;
export type NplEventType = typeof NPL_EVENT_TYPES[number];

function decimalToMinor(value: string | number): bigint {
  const normalized = String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Exposure amounts must use no more than two decimal places");
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -minor : minor;
}

function minorToDecimal(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function applyObservedNplEvent(input: {
  currentExposure: string | number;
  eventType: NplEventType;
  amount?: string | number | null;
}) {
  const before = decimalToMinor(input.currentExposure);
  if (before < 0n) throw new Error("Current exposure cannot be negative");
  const amount = input.amount === null || input.amount === undefined || input.amount === "" ? 0n : decimalToMinor(input.amount);
  const financial = ["case_opened", "npl_inflow_observed", "cash_recovery_observed", "legal_recovery_observed"].includes(input.eventType);
  if (financial && amount <= 0n) throw new Error("This observed financial event requires a positive amount");
  if (!financial && amount !== 0n) throw new Error("Non-financial case events cannot change exposure");
  let after = before;
  if (input.eventType === "case_opened" || input.eventType === "npl_inflow_observed") after += amount;
  if (input.eventType === "cash_recovery_observed" || input.eventType === "legal_recovery_observed") after -= amount;
  if (after < 0n) throw new Error("An observed recovery cannot exceed the case exposure");
  return { exposureBefore: minorToDecimal(before), exposureAfter: minorToDecimal(after), amount: minorToDecimal(amount) };
}

export function calculateNplExposureWaterfall(input: {
  openingExposure: string | number;
  closingExposure: string | number;
  authoritativeCreditExposure?: string | number;
  events: Array<{ eventType: NplEventType; amount: string | number | null }>;
}) {
  const opening = decimalToMinor(input.openingExposure);
  const closing = decimalToMinor(input.closingExposure);
  let inflows = 0n;
  let cashRecoveries = 0n;
  let legalRecoveries = 0n;
  for (const event of input.events) {
    const amount = event.amount === null ? 0n : decimalToMinor(event.amount);
    if (event.eventType === "case_opened" || event.eventType === "npl_inflow_observed") inflows += amount;
    if (event.eventType === "cash_recovery_observed") cashRecoveries += amount;
    if (event.eventType === "legal_recovery_observed") legalRecoveries += amount;
  }
  const calculatedClosing = opening + inflows - cashRecoveries - legalRecoveries;
  const authoritative = input.authoritativeCreditExposure === undefined ? null : decimalToMinor(input.authoritativeCreditExposure);
  return {
    openingExposure: minorToDecimal(opening),
    observedInflows: minorToDecimal(inflows),
    observedCashRecoveries: minorToDecimal(cashRecoveries),
    observedLegalRecoveries: minorToDecimal(legalRecoveries),
    calculatedClosingExposure: minorToDecimal(calculatedClosing),
    closingExposure: minorToDecimal(closing),
    reconciliationDifference: minorToDecimal(closing - calculatedClosing),
    reconciled: closing === calculatedClosing,
    authoritativeCreditExposure: authoritative === null ? null : minorToDecimal(authoritative),
    authoritativeDifference: authoritative === null ? null : minorToDecimal(authoritative - closing),
    authoritativeReconciled: authoritative === null ? null : authoritative === closing,
  };
}
