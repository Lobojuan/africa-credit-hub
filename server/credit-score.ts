import { getServerCountryConfig } from "./country-mode";

interface AccountLike {
  status: string;
  currentBalance?: string | null;
  currency?: string | null;
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

export function calculateCreditScore(
  accounts: AccountLike[],
  inquiryCount: number,
  judgments: JudgmentLike[] = [],
  isPep = false,
  alternativeData: AlternativeDataLike[] = []
): CreditScoreResult {
  const reasonCodes: string[] = [];
  const factors: ScoreFactor[] = [];

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

  const delinquencyPenalty = delinquentCount * 50;
  if (delinquentCount > 0) {
    factors.push({
      name: "Delinquent Accounts",
      impact: -delinquencyPenalty,
      maxImpact: 0,
      direction: "negative",
      description: `${delinquentCount} account${delinquentCount > 1 ? "s" : ""} past due or in default`,
      weight: 20,
    });
  }

  const writeOffPenalty = writtenOffCount * 75;
  if (writtenOffCount > 0) {
    factors.push({
      name: "Written-Off Accounts",
      impact: -writeOffPenalty,
      maxImpact: 0,
      direction: "negative",
      description: `${writtenOffCount} account${writtenOffCount > 1 ? "s" : ""} written off as uncollectable`,
      weight: 15,
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
      weight: 10,
    });
  }

  const inquiryPenalty = Math.min(inquiryCount, 20) * 5;
  factors.push({
    name: "Credit Inquiries",
    impact: -inquiryPenalty,
    maxImpact: -100,
    direction: inquiryCount <= 3 ? "positive" : inquiryCount <= 8 ? "neutral" : "negative",
    description: `${inquiryCount} credit inquir${inquiryCount === 1 ? "y" : "ies"} in the last 12 months`,
    weight: 10,
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
      weight: 10,
    });

    if (altOnTimeRatio > 0.9 && totalAltTxns >= 12) reasonCodes.push("STRONG_ALTERNATIVE_DATA");
  }

  let score = Math.round(
    300
    + (onTimeRatio * 500)
    - (delinquentCount * 50)
    - (writtenOffCount * 75)
    - (restructuredCount * 20)
    - (activeJudgments * 40)
    - (Math.min(inquiryCount, 20) * 5)
    + altDataBonus
  );

  score = Math.max(300, Math.min(850, score));

  if (delinquentCount > 0) reasonCodes.push("DELINQUENT_ACCOUNTS");
  if (writtenOffCount > 0) reasonCodes.push("WRITTEN_OFF_ACCOUNTS");
  if (restructuredCount > 0) reasonCodes.push("RESTRUCTURED_ACCOUNTS");
  if (activeJudgments > 0) reasonCodes.push("ACTIVE_COURT_JUDGMENTS");
  if (inquiryCount > 5) reasonCodes.push("HIGH_INQUIRY_VOLUME");

  if (totalDebt > 1000000) reasonCodes.push("HIGH_DEBT_LEVEL");
  if (isPep) reasonCodes.push("POLITICALLY_EXPOSED_PERSON");
  if (onTimeRatio > 0.8 && delinquentCount === 0) reasonCodes.push("STRONG_REPAYMENT_HISTORY");
  if (accounts.length >= 3 && onTimeRatio === 1 && writtenOffCount === 0) reasonCodes.push("EXCELLENT_PAYMENT_RECORD");
  if (reasonCodes.length === 0) reasonCodes.push("GOOD_STANDING");

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return { score, reasonCodes, factors };
}

export function getDefaultCurrencyCode(): string {
  const config = getServerCountryConfig();
  return config?.currency || "USD";
}
