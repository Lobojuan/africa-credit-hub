import { getServerCountryConfig } from "./country-mode";

interface AccountLike {
  status: string;
  currentBalance?: string | null;
  currency?: string | null;
}

interface JudgmentLike {
  status: string;
}

export interface CreditScoreResult {
  score: number;
  reasonCodes: string[];
}

export function calculateCreditScore(
  accounts: AccountLike[],
  inquiryCount: number,
  judgments: JudgmentLike[] = [],
  isPep = false
): CreditScoreResult {
  const reasonCodes: string[] = [];

  if (accounts.length === 0) {
    reasonCodes.push("THIN_FILE_LIMITED_HISTORY");
    return { score: 600, reasonCodes };
  }

  const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
  const currentCount = accounts.filter(a => a.status === "current").length;
  const closedCount = accounts.filter(a => a.status === "closed").length;
  const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
  const restructuredCount = accounts.filter(a => a.status === "restructured").length;
  const activeJudgments = judgments.filter(j => j.status === "active").length;

  const positiveAccounts = currentCount + closedCount;
  const onTimeRatio = positiveAccounts / accounts.length;

  let score = Math.round(
    300
    + (onTimeRatio * 500)
    - (delinquentCount * 50)
    - (writtenOffCount * 75)
    - (restructuredCount * 20)
    - (activeJudgments * 40)
    - (Math.min(inquiryCount, 20) * 5)
  );

  score = Math.max(300, Math.min(850, score));

  if (delinquentCount > 0) reasonCodes.push("DELINQUENT_ACCOUNTS");
  if (writtenOffCount > 0) reasonCodes.push("WRITTEN_OFF_ACCOUNTS");
  if (restructuredCount > 0) reasonCodes.push("RESTRUCTURED_ACCOUNTS");
  if (activeJudgments > 0) reasonCodes.push("ACTIVE_COURT_JUDGMENTS");
  if (inquiryCount > 5) reasonCodes.push("HIGH_INQUIRY_VOLUME");

  const totalDebt = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  if (totalDebt > 1000000) reasonCodes.push("HIGH_DEBT_LEVEL");
  if (isPep) reasonCodes.push("POLITICALLY_EXPOSED_PERSON");
  if (onTimeRatio > 0.8 && delinquentCount === 0) reasonCodes.push("STRONG_REPAYMENT_HISTORY");
  if (accounts.length >= 3 && onTimeRatio === 1 && writtenOffCount === 0) reasonCodes.push("EXCELLENT_PAYMENT_RECORD");
  if (reasonCodes.length === 0) reasonCodes.push("GOOD_STANDING");

  return { score, reasonCodes };
}

export function getDefaultCurrencyCode(): string {
  const config = getServerCountryConfig();
  return config?.currency || "USD";
}
