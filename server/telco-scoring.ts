import { generateAIResponse } from "./ai";
import type { MomoTransaction, TelcoProfile } from "@shared/schema";

export interface TelcoKPIs {
  evaluationPeriodDays: number;
  financialMetrics: {
    totalInflowsUsd: number;
    totalOutflowsUsd: number;
    inflowVarianceCoefficient: number;
    averageDailyWalletBalance: number;
    walletRetentionRatio: number;
    utilityPaymentsCount: number;
    utilityPaymentConsistencyScore: number;
    merchantPaymentsCount: number;
    merchantPaymentsVolume: number;
  };
  telemetricMetrics: {
    airtimeAdvanceFrequency: number;
    airtimeAdvanceRepaymentDaysAvg: number;
    simAgeDays: number;
    deviceChangesLast90Days: number;
    kycLevel: string;
  };
  networkMetrics: {
    uniqueP2pCounterparties: number;
    percentageTransfersToMerchants: number;
    incomingVsOutgoingRatio: number;
    regularIncomeDetected: boolean;
    salaryCreditsCount: number;
  };
  riskIndicators: {
    cashOutImmediatelyAfterCashIn: number;
    lateNightTransactionsPercent: number;
    roundAmountTransactionsPercent: number;
    dormantPeriodDays: number;
  };
}

export function computeTelcoKPIs(
  profile: TelcoProfile,
  transactions: MomoTransaction[],
  periodDays: number = 90
): TelcoKPIs {
  const now = new Date();
  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const filtered = transactions.filter(t => new Date(t.transactionDate) >= cutoff);

  const inflows = filtered.filter(t =>
    ["p2p_receive", "cash_in", "salary_credit", "loan_disbursement", "savings_withdrawal", "international_transfer"].includes(t.transactionType)
  );
  const outflows = filtered.filter(t =>
    ["p2p_send", "merchant_payment", "bill_payment", "airtime_purchase", "cash_out", "loan_repayment", "savings_deposit"].includes(t.transactionType)
  );

  const totalInflows = inflows.reduce((s, t) => s + Number(t.amount), 0);
  const totalOutflows = outflows.reduce((s, t) => s + Number(t.amount), 0);

  const dailyInflows: Record<string, number> = {};
  inflows.forEach(t => {
    const day = new Date(t.transactionDate).toISOString().split("T")[0];
    dailyInflows[day] = (dailyInflows[day] || 0) + Number(t.amount);
  });
  const dailyValues = Object.values(dailyInflows);
  const meanDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
  const variance = dailyValues.length > 1
    ? dailyValues.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) / (dailyValues.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const inflowVarianceCoefficient = meanDaily > 0 ? stdDev / meanDaily : 1;

  const balances = filtered.filter(t => t.balanceAfter != null).map(t => Number(t.balanceAfter));
  const avgBalance = balances.length > 0 ? balances.reduce((a, b) => a + b, 0) / balances.length : 0;

  const walletRetention = totalInflows > 0 ? Math.min(1, avgBalance / (totalInflows / Math.max(1, periodDays) * 30)) : 0;

  const utilityTxns = filtered.filter(t => t.transactionType === "bill_payment" || t.category === "utility");
  const merchantTxns = filtered.filter(t => t.transactionType === "merchant_payment" || t.isMerchant);

  const months = new Set(utilityTxns.map(t => new Date(t.transactionDate).toISOString().slice(0, 7)));
  const expectedMonths = Math.ceil(periodDays / 30);
  const utilityConsistency = expectedMonths > 0 ? months.size / expectedMonths : 0;

  const airtimeAdvances = filtered.filter(t => t.transactionType === "airtime_advance");

  const simRegDate = profile.simRegistrationDate ? new Date(profile.simRegistrationDate) : null;
  const simAgeDays = simRegDate ? Math.floor((now.getTime() - simRegDate.getTime()) / (24 * 60 * 60 * 1000)) : 0;

  const p2pCounterparties = new Set([
    ...filtered.filter(t => t.transactionType === "p2p_send" && t.counterpartyMsisdn).map(t => t.counterpartyMsisdn),
    ...filtered.filter(t => t.transactionType === "p2p_receive" && t.counterpartyMsisdn).map(t => t.counterpartyMsisdn),
  ]);

  const totalTxnCount = filtered.length || 1;
  const merchantPercent = (merchantTxns.length / totalTxnCount) * 100;

  const salaryCredits = filtered.filter(t => t.transactionType === "salary_credit");
  const regularIncome = salaryCredits.length >= Math.floor(periodDays / 30);

  const incomingCount = inflows.length || 1;
  const outgoingCount = outflows.length || 1;

  const roundAmounts = filtered.filter(t => Number(t.amount) % 100 === 0 && Number(t.amount) > 0);

  const lateNight = filtered.filter(t => {
    const hour = new Date(t.transactionDate).getHours();
    return hour >= 23 || hour < 5;
  });

  const sortedByDate = [...filtered].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
  let maxGap = 0;
  for (let i = 1; i < sortedByDate.length; i++) {
    const gap = (new Date(sortedByDate[i].transactionDate).getTime() - new Date(sortedByDate[i - 1].transactionDate).getTime()) / (24 * 60 * 60 * 1000);
    if (gap > maxGap) maxGap = gap;
  }

  return {
    evaluationPeriodDays: periodDays,
    financialMetrics: {
      totalInflowsUsd: Math.round(totalInflows * 100) / 100,
      totalOutflowsUsd: Math.round(totalOutflows * 100) / 100,
      inflowVarianceCoefficient: Math.round(inflowVarianceCoefficient * 100) / 100,
      averageDailyWalletBalance: Math.round(avgBalance * 100) / 100,
      walletRetentionRatio: Math.round(walletRetention * 100) / 100,
      utilityPaymentsCount: utilityTxns.length,
      utilityPaymentConsistencyScore: Math.round(utilityConsistency * 100) / 100,
      merchantPaymentsCount: merchantTxns.length,
      merchantPaymentsVolume: Math.round(merchantTxns.reduce((s, t) => s + Number(t.amount), 0) * 100) / 100,
    },
    telemetricMetrics: {
      airtimeAdvanceFrequency: airtimeAdvances.length,
      airtimeAdvanceRepaymentDaysAvg: 0,
      simAgeDays,
      deviceChangesLast90Days: profile.deviceChanges90d || 0,
      kycLevel: profile.kycLevel || "basic",
    },
    networkMetrics: {
      uniqueP2pCounterparties: p2pCounterparties.size,
      percentageTransfersToMerchants: Math.round(merchantPercent * 100) / 100,
      incomingVsOutgoingRatio: Math.round((incomingCount / outgoingCount) * 100) / 100,
      regularIncomeDetected: regularIncome,
      salaryCreditsCount: salaryCredits.length,
    },
    riskIndicators: {
      cashOutImmediatelyAfterCashIn: 0,
      lateNightTransactionsPercent: Math.round((lateNight.length / totalTxnCount) * 100 * 100) / 100,
      roundAmountTransactionsPercent: Math.round((roundAmounts.length / totalTxnCount) * 100 * 100) / 100,
      dormantPeriodDays: Math.round(maxGap),
    },
  };
}

const TELCO_SCORING_SYSTEM_PROMPT = `You are an expert Credit Risk Analyst AI specializing in the African digital lending and mobile money market. You evaluate mobile money (MoMo) transaction profiles to determine creditworthiness for unbanked and underbanked populations.

SCORING RULES:
- Risk Score: 1 (Very Low Risk / Excellent) to 5 (Very High Risk / Poor)
- Risk Tiers: very_low (score 1), low (score 2), medium (score 3), high (score 4), very_high (score 5)

EVALUATION CRITERIA (weighted importance):
1. CASH FLOW STABILITY (30%): Regular inflows, low variance coefficient (<0.3 = excellent, >0.8 = poor), wallet retention ratio
2. UTILITY & BILL PAYMENT CONSISTENCY (20%): Regular utility payments signal financial discipline. Consistency score >0.8 = excellent
3. LIQUIDITY STRESS INDICATORS (20%): Airtime advance frequency (>3/quarter = concerning), immediate cash-out after cash-in patterns
4. NETWORK QUALITY (15%): Diverse counterparties (>20 = good), merchant payment percentage (>30% = positive), regular income detection
5. IDENTITY & STABILITY (15%): SIM age (>365 days = good, >1000 = excellent), KYC level, device stability

FEW-SHOT EXAMPLES:

GOOD BORROWER (Risk Score: 1-2):
- Total inflows: $800+/quarter, variance <0.2
- Utility consistency: >0.9, 6+ utility payments
- Zero airtime advances, SIM age >1000 days
- 30+ unique counterparties, 40%+ merchant payments
- Regular salary credits detected

BORDERLINE BORROWER (Risk Score: 3):
- Total inflows: $300-800/quarter, variance 0.3-0.5
- Utility consistency: 0.5-0.8, 3-5 utility payments
- 1-2 airtime advances, SIM age 180-365 days
- 15-30 counterparties, 20-40% merchant payments
- Irregular but present income pattern

HIGH RISK BORROWER (Risk Score: 4-5):
- Total inflows: <$300/quarter, variance >0.8
- Utility consistency: <0.5, <3 utility payments
- 3+ airtime advances, SIM age <180 days
- <15 counterparties, <20% merchant payments
- No regular income, high late-night transaction %

OUTPUT FORMAT (strictly JSON):
{
  "risk_score": <1-5>,
  "risk_tier": "<very_low|low|medium|high|very_high>",
  "approval_recommendation": <true|false>,
  "suggested_credit_limit_usd": <number>,
  "reason_code": "<PRIMARY_REASON>",
  "detailed_rationale": "<2-3 paragraph human-readable explanation>",
  "key_factors": [
    {"factor": "<name>", "impact": "<positive|negative|neutral>", "detail": "<explanation>"}
  ],
  "regulatory_note": "<data protection compliance note>"
}`;

export async function generateTelcoCreditScore(
  profile: TelcoProfile,
  kpis: TelcoKPIs
): Promise<{
  riskScore: number;
  riskTier: string;
  approvalRecommendation: boolean;
  suggestedCreditLimitUsd: number;
  reasonCode: string;
  detailedRationale: string;
  keyFactors: Array<{ factor: string; impact: string; detail: string }>;
  regulatoryNote: string;
  aiProvider: string;
  aiModel: string;
}> {
  const userPrompt = `Evaluate this mobile money subscriber profile for credit scoring:

SUBSCRIBER INFO:
- MSISDN: ${profile.msisdn}
- Provider: ${profile.provider}
- Country: ${profile.country}
- KYC Level: ${profile.kycLevel}
- Account Status: ${profile.accountStatus}

KPI PROFILE (${kpis.evaluationPeriodDays}-day evaluation period):
${JSON.stringify(kpis, null, 2)}

Provide your assessment in the specified JSON format.`;

  const result = await generateAIResponse(
    TELCO_SCORING_SYSTEM_PROMPT,
    userPrompt,
    "credit_risk",
    { temperature: 0.2, maxTokens: 2000 }
  );

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result.text);

    return {
      riskScore: parsed.risk_score || 3,
      riskTier: parsed.risk_tier || "medium",
      approvalRecommendation: parsed.approval_recommendation ?? false,
      suggestedCreditLimitUsd: parsed.suggested_credit_limit_usd || 0,
      reasonCode: parsed.reason_code || "ASSESSMENT_COMPLETE",
      detailedRationale: parsed.detailed_rationale || result.text,
      keyFactors: parsed.key_factors || [],
      regulatoryNote: parsed.regulatory_note || "",
      aiProvider: result.provider,
      aiModel: result.provider === "openai" ? "gpt-4o" : "claude-opus-4-6",
    };
  } catch {
    return {
      riskScore: 3,
      riskTier: "medium",
      approvalRecommendation: false,
      suggestedCreditLimitUsd: 0,
      reasonCode: "PARSE_ERROR",
      detailedRationale: result.text,
      keyFactors: [],
      regulatoryNote: "Unable to parse structured response",
      aiProvider: result.provider,
      aiModel: result.provider === "openai" ? "gpt-4o" : "claude-opus-4-6",
    };
  }
}
