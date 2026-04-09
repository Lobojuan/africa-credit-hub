export function calculateOpenBankingScore(profile: {
  avgMonthlyInflow: number; avgMonthlyOutflow: number; monthsOfData: number;
  regularIncomeStreams: number; gamblingTransactions: number;
  salaryCreditsDetected: boolean; rentPaymentsDetected: boolean;
  utilityPaymentsDetected: boolean; nsfEvents: number;
}): number {
  let score = 50;
  if (profile.salaryCreditsDetected) score += 15;
  if (profile.regularIncomeStreams >= 2) score += 10;
  if (profile.monthsOfData >= 6) score += 10;
  const sr = profile.avgMonthlyInflow > 0
    ? (profile.avgMonthlyInflow - profile.avgMonthlyOutflow) / profile.avgMonthlyInflow : 0;
  if (sr >= 0.2) score += 10; else if (sr < 0) score -= 15;
  if (profile.rentPaymentsDetected) score += 5;
  if (profile.utilityPaymentsDetected) score += 5;
  score -= profile.gamblingTransactions * 2;
  score -= profile.nsfEvents * 5;
  return Math.max(0, Math.min(100, score));
}
