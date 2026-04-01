import { getServerCountryConfig } from "./country-mode";

interface AccountLike {
  status: string;
  currentBalance?: string | null;
  currency?: string | null;
  daysInArrears?: number | null;
  amountOverdue?: string | null;
}

interface JudgmentLike {
  status: string;
}

interface AlternativeDataLike {
  source: string;
  totalTransactions: number | null;
  onTimePayments: number | null;
  latePayments: number | null;
  status: string;
}

export interface ScoreFactor {
  name: string;
  impact: number;
  maxImpact: number;
  direction: "positive" | "negative" | "neutral";
  description: string;
  weight: number;
}

export interface CreditScoreResult {
  score: number;
  reasonCodes: string[];
  factors: ScoreFactor[];
}

function classifyNDIA(days: number): { bucket: string; penalty: number; risk: string } {
  if (days <= 0) return { bucket: "Performing", penalty: 0, risk: "none" };
  if (days <= 30) return { bucket: "1-30 days", penalty: 15, risk: "early" };
  if (days <= 90) return { bucket: "31-90 days", penalty: 40, risk: "moderate" };
  if (days <= 180) return { bucket: "91-180 days", penalty: 70, risk: "high" };
  return { bucket: "180+ days", penalty: 100, risk: "default" };
}

export function calculateCreditScore(
  rawAccounts: AccountLike[],
  inquiryCount: number,
  judgments: JudgmentLike[] = [],
  isPep = false,
  alternativeData: AlternativeDataLike[] = []
): CreditScoreResult {
  const reasonCodes: string[] = [];
  const factors: ScoreFactor[] = [];

  const validAccounts = rawAccounts.filter(a => a.status != null && a.status !== undefined);
  const invalidRatio = rawAccounts.length > 0 ? (rawAccounts.length - validAccounts.length) / rawAccounts.length : 0;

  if (invalidRatio > 0.5) {
    return {
      score: 300,
      reasonCodes: ["INVALID_INPUT"],
      factors: [{
        name: "Data Quality",
        impact: 0,
        maxImpact: 500,
        direction: "negative" as const,
        description: `Over 50% of account records have invalid or missing status fields (${rawAccounts.length - validAccounts.length} of ${rawAccounts.length})`,
        weight: 100,
      }],
    };
  }

  const accounts = validAccounts.map(a => ({
    ...a,
    currentBalance: a.currentBalance ? String(Math.max(0, parseFloat(a.currentBalance) || 0)) : a.currentBalance,
    amountOverdue: a.amountOverdue ? String(Math.max(0, parseFloat(a.amountOverdue) || 0)) : a.amountOverdue,
  }));

  if (accounts.length === 0) {
    reasonCodes.push("THIN_FILE_LIMITED_HISTORY");
    factors.push({
      name: "Payment History",
      impact: 0,
      maxImpact: 500,
      direction: "neutral",
      description: "No credit accounts on file to evaluate payment behavior",
      weight: 35,
    });
    return { score: 600, reasonCodes, factors };
  }

  const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
  const currentCount = accounts.filter(a => a.status === "current").length;
  const closedCount = accounts.filter(a => a.status === "closed").length;
  const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
  const restructuredCount = accounts.filter(a => a.status === "restructured").length;
  const activeJudgments = judgments.filter(j => j.status === "active").length;

  const positiveAccounts = currentCount + closedCount;
  const onTimeRatio = positiveAccounts / accounts.length;

  const paymentHistoryPoints = Math.round(onTimeRatio * 500);
  factors.push({
    name: "Payment History",
    impact: paymentHistoryPoints,
    maxImpact: 500,
    direction: paymentHistoryPoints >= 400 ? "positive" : paymentHistoryPoints >= 250 ? "neutral" : "negative",
    description: `${Math.round(onTimeRatio * 100)}% of accounts in good standing (${positiveAccounts} of ${accounts.length})`,
    weight: 35,
  });

  let ndiaPenalty = 0;
  let ndia90PlusCount = 0;
  let totalDaysInArrears = 0;
  const ndiaDistribution = { performing: 0, early: 0, moderate: 0, high: 0, defaultBucket: 0 };

  for (const acct of accounts) {
    const days = acct.daysInArrears ?? 0;
    totalDaysInArrears += days;
    const classification = classifyNDIA(days);
    ndiaPenalty += classification.penalty;

    if (classification.risk === "none") ndiaDistribution.performing++;
    else if (classification.risk === "early") ndiaDistribution.early++;
    else if (classification.risk === "moderate") ndiaDistribution.moderate++;
    else if (classification.risk === "high") { ndiaDistribution.high++; ndia90PlusCount++; }
    else if (classification.risk === "default") { ndiaDistribution.defaultBucket++; ndia90PlusCount++; }
  }

  const ndiaDesc = [];
  if (ndiaDistribution.performing > 0) ndiaDesc.push(`${ndiaDistribution.performing} performing`);
  if (ndiaDistribution.early > 0) ndiaDesc.push(`${ndiaDistribution.early} early (1-30d)`);
  if (ndiaDistribution.moderate > 0) ndiaDesc.push(`${ndiaDistribution.moderate} moderate (31-90d)`);
  if (ndiaDistribution.high > 0) ndiaDesc.push(`${ndiaDistribution.high} high risk (91-180d)`);
  if (ndiaDistribution.defaultBucket > 0) ndiaDesc.push(`${ndiaDistribution.defaultBucket} default (180+d)`);

  factors.push({
    name: "NDIA (Arrears Severity)",
    impact: -ndiaPenalty,
    maxImpact: -(accounts.length * 100),
    direction: ndiaPenalty === 0 ? "positive" : ndiaPenalty <= 30 ? "neutral" : "negative",
    description: `Arrears classification: ${ndiaDesc.join(", ")}`,
    weight: 20,
  });

  let totalArrearsAmount = 0;
  for (const acct of accounts) {
    totalArrearsAmount += parseFloat(acct.amountOverdue || "0");
  }

  let arrearsPenalty = 0;
  if (totalArrearsAmount > 0) {
    if (totalArrearsAmount <= 5000) arrearsPenalty = 10;
    else if (totalArrearsAmount <= 50000) arrearsPenalty = 25;
    else if (totalArrearsAmount <= 200000) arrearsPenalty = 50;
    else if (totalArrearsAmount <= 1000000) arrearsPenalty = 75;
    else arrearsPenalty = 100;
  }

  factors.push({
    name: "Amount in Arrears",
    impact: -arrearsPenalty,
    maxImpact: -100,
    direction: arrearsPenalty === 0 ? "positive" : arrearsPenalty <= 25 ? "neutral" : "negative",
    description: totalArrearsAmount > 0
      ? `Total overdue balance of ${totalArrearsAmount.toLocaleString()} across delinquent accounts`
      : "No outstanding arrears — all accounts current",
    weight: 10,
  });

  const writeOffPenalty = writtenOffCount * 75;
  if (writtenOffCount > 0) {
    factors.push({
      name: "Written-Off Accounts",
      impact: -writeOffPenalty,
      maxImpact: 0,
      direction: "negative",
      description: `${writtenOffCount} account${writtenOffCount > 1 ? "s" : ""} written off as uncollectable`,
      weight: 10,
    });
  }

  const restructurePenalty = restructuredCount * 20;
  if (restructuredCount > 0) {
    factors.push({
      name: "Restructured Accounts",
      impact: -restructurePenalty,
      maxImpact: 0,
      direction: "negative",
      description: `${restructuredCount} account${restructuredCount > 1 ? "s" : ""} required restructuring`,
      weight: 5,
    });
  }

  const judgmentPenalty = activeJudgments * 40;
  if (activeJudgments > 0) {
    factors.push({
      name: "Court Judgments",
      impact: -judgmentPenalty,
      maxImpact: 0,
      direction: "negative",
      description: `${activeJudgments} active court judgment${activeJudgments > 1 ? "s" : ""} on record`,
      weight: 5,
    });
  }

  const inquiryPenalty = Math.min(inquiryCount, 20) * 5;
  factors.push({
    name: "Credit Inquiries",
    impact: -inquiryPenalty,
    maxImpact: -100,
    direction: inquiryCount <= 3 ? "positive" : inquiryCount <= 8 ? "neutral" : "negative",
    description: `${inquiryCount} credit inquir${inquiryCount === 1 ? "y" : "ies"} in the last 12 months`,
    weight: 5,
  });

  const totalDebt = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const debtDirection = totalDebt > 1000000 ? "negative" : totalDebt > 500000 ? "neutral" : "positive";
  factors.push({
    name: "Debt Level",
    impact: 0,
    maxImpact: 0,
    direction: debtDirection,
    description: `Total outstanding balance of ${totalDebt.toLocaleString()}`,
    weight: 5,
  });

  let altDataBonus = 0;
  const activeAltData = alternativeData.filter(d => d.status === "active");
  if (activeAltData.length > 0) {
    let totalAltTxns = 0;
    let totalAltOnTime = 0;
    for (const d of activeAltData) {
      totalAltTxns += d.totalTransactions || 0;
      totalAltOnTime += d.onTimePayments || 0;
    }
    const altOnTimeRatio = totalAltTxns > 0 ? totalAltOnTime / totalAltTxns : 0;
    altDataBonus = Math.round(altOnTimeRatio * 30 * Math.min(activeAltData.length, 3));

    const sourceLabels: Record<string, string> = {
      mobile_money: "Mobile Money",
      utility: "Utility Payments",
      telco: "Telco Data",
      rent: "Rent Payments",
      insurance: "Insurance",
      merchant: "Merchant Data",
    };
    const sources = activeAltData.map(d => sourceLabels[d.source] || d.source).join(", ");
    factors.push({
      name: "Alternative Data",
      impact: altDataBonus,
      maxImpact: 90,
      direction: altDataBonus >= 20 ? "positive" : altDataBonus >= 10 ? "neutral" : "positive",
      description: `${activeAltData.length} source${activeAltData.length > 1 ? "s" : ""} (${sources}), ${Math.round(altOnTimeRatio * 100)}% on-time from ${totalAltTxns} transactions`,
      weight: 5,
    });

    if (altOnTimeRatio > 0.9 && totalAltTxns >= 12) reasonCodes.push("STRONG_ALTERNATIVE_DATA");
  }

  let score = Math.round(
    300
    + (onTimeRatio * 500)
    - ndiaPenalty
    - arrearsPenalty
    - (writtenOffCount * 75)
    - (restructuredCount * 20)
    - (activeJudgments * 40)
    - (Math.min(inquiryCount, 20) * 5)
    + altDataBonus
  );

  score = Math.max(300, Math.min(850, score));

  if (ndia90PlusCount > 0) reasonCodes.push("HIGH_NDIA_90_PLUS");
  if (delinquentCount >= 2) reasonCodes.push("MULTIPLE_DELINQUENCIES");
  if (totalArrearsAmount > 50000) reasonCodes.push("HIGH_ARREARS_AMOUNT");
  if (delinquentCount > 0) reasonCodes.push("DELINQUENT_ACCOUNTS");
  if (writtenOffCount > 0) reasonCodes.push("WRITTEN_OFF_ACCOUNTS");
  if (restructuredCount > 0) reasonCodes.push("RESTRUCTURED_ACCOUNTS");
  if (activeJudgments > 0) reasonCodes.push("ACTIVE_COURT_JUDGMENTS");
  if (inquiryCount > 5) reasonCodes.push("HIGH_INQUIRY_VOLUME");

  if (totalDebt > 1000000) reasonCodes.push("HIGH_DEBT_LEVEL");
  if (isPep) reasonCodes.push("POLITICALLY_EXPOSED_PERSON");
  if (onTimeRatio > 0.8 && delinquentCount === 0 && ndiaPenalty === 0) reasonCodes.push("STRONG_REPAYMENT_HISTORY");
  if (accounts.length >= 3 && onTimeRatio === 1 && writtenOffCount === 0 && ndiaPenalty === 0) reasonCodes.push("EXCELLENT_PAYMENT_RECORD");
  if (reasonCodes.length === 0) reasonCodes.push("GOOD_STANDING");

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return { score, reasonCodes, factors };
}

export function getDefaultCurrencyCode(): string {
  const config = getServerCountryConfig();
  return config?.currency || "USD";
}
