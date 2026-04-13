import { generateAIResponse, dualAIEnsemble } from "./ai";
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

export function computeRuleBasedTelcoScore(
  profile: TelcoProfile,
  kpis: TelcoKPIs
): {
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
} {
  const fm = kpis.financialMetrics;
  const tm = kpis.telemetricMetrics;
  const nm = kpis.networkMetrics;
  const ri = kpis.riskIndicators;

  let weightedScore = 0;
  const factors: Array<{ factor: string; impact: string; detail: string }> = [];

  // 1. Cash Flow Stability (30%)
  let cashFlowScore = 3;
  if (fm.inflowVarianceCoefficient < 0.3 && fm.totalInflowsUsd > 800) {
    cashFlowScore = 1;
    factors.push({ factor: "Cash Flow Stability", impact: "positive", detail: `Strong inflows ($${fm.totalInflowsUsd.toFixed(0)}) with low variance (${fm.inflowVarianceCoefficient.toFixed(2)})` });
  } else if (fm.inflowVarianceCoefficient < 0.5 && fm.totalInflowsUsd > 300) {
    cashFlowScore = 2;
    factors.push({ factor: "Cash Flow Stability", impact: "positive", detail: `Moderate inflows ($${fm.totalInflowsUsd.toFixed(0)}) with acceptable variance` });
  } else if (fm.inflowVarianceCoefficient > 0.8 || fm.totalInflowsUsd < 100) {
    cashFlowScore = 5;
    factors.push({ factor: "Cash Flow Stability", impact: "negative", detail: `Low inflows ($${fm.totalInflowsUsd.toFixed(0)}) or high variance (${fm.inflowVarianceCoefficient.toFixed(2)})` });
  } else if (fm.inflowVarianceCoefficient > 0.5) {
    cashFlowScore = 4;
    factors.push({ factor: "Cash Flow Stability", impact: "negative", detail: `Moderate-to-high variance (${fm.inflowVarianceCoefficient.toFixed(2)})` });
  } else {
    factors.push({ factor: "Cash Flow Stability", impact: "neutral", detail: `Average cash flow pattern` });
  }
  weightedScore += cashFlowScore * 0.30;

  // 2. Bill Payment Consistency (20%)
  let billScore = 3;
  if (fm.utilityPaymentConsistencyScore > 0.8 && fm.utilityPaymentsCount >= 6) {
    billScore = 1;
    factors.push({ factor: "Bill Payment Consistency", impact: "positive", detail: `Excellent consistency (${fm.utilityPaymentConsistencyScore.toFixed(2)}) with ${fm.utilityPaymentsCount} payments` });
  } else if (fm.utilityPaymentConsistencyScore > 0.5) {
    billScore = 2;
    factors.push({ factor: "Bill Payment Consistency", impact: "positive", detail: `Good consistency (${fm.utilityPaymentConsistencyScore.toFixed(2)})` });
  } else if (fm.utilityPaymentsCount < 3) {
    billScore = 4;
    factors.push({ factor: "Bill Payment Consistency", impact: "negative", detail: `Few utility payments (${fm.utilityPaymentsCount})` });
  } else {
    factors.push({ factor: "Bill Payment Consistency", impact: "neutral", detail: `Average bill payment pattern` });
  }
  weightedScore += billScore * 0.20;

  // 3. Liquidity Stress (20%)
  let liquidityScore = 3;
  if (tm.airtimeAdvanceFrequency === 0 && ri.cashOutImmediatelyAfterCashIn === 0) {
    liquidityScore = 1;
    factors.push({ factor: "Liquidity Stress", impact: "positive", detail: "No airtime advances or immediate cash-out patterns" });
  } else if (tm.airtimeAdvanceFrequency <= 2) {
    liquidityScore = 2;
    factors.push({ factor: "Liquidity Stress", impact: "neutral", detail: `Low airtime advance frequency (${tm.airtimeAdvanceFrequency})` });
  } else if (tm.airtimeAdvanceFrequency > 3) {
    liquidityScore = 5;
    factors.push({ factor: "Liquidity Stress", impact: "negative", detail: `High airtime advance frequency (${tm.airtimeAdvanceFrequency}) indicates cash flow stress` });
  }
  weightedScore += liquidityScore * 0.20;

  // 4. Network Quality (15%)
  let networkScore = 3;
  if (nm.uniqueP2pCounterparties > 20 && nm.percentageTransfersToMerchants > 30) {
    networkScore = 1;
    factors.push({ factor: "Network Quality", impact: "positive", detail: `Diverse network (${nm.uniqueP2pCounterparties} counterparties, ${nm.percentageTransfersToMerchants}% merchant)` });
  } else if (nm.uniqueP2pCounterparties > 10) {
    networkScore = 2;
    factors.push({ factor: "Network Quality", impact: "positive", detail: `Good network diversity (${nm.uniqueP2pCounterparties} counterparties)` });
  } else if (nm.uniqueP2pCounterparties < 5) {
    networkScore = 5;
    factors.push({ factor: "Network Quality", impact: "negative", detail: `Limited network (${nm.uniqueP2pCounterparties} counterparties)` });
  } else {
    factors.push({ factor: "Network Quality", impact: "neutral", detail: `Average network quality` });
  }
  weightedScore += networkScore * 0.15;

  // 5. Identity & Stability (15%)
  let stabilityScore = 3;
  if (tm.simAgeDays > 1000 && profile.kycLevel === "full") {
    stabilityScore = 1;
    factors.push({ factor: "Identity & Stability", impact: "positive", detail: `Mature SIM (${tm.simAgeDays} days) with full KYC` });
  } else if (tm.simAgeDays > 365) {
    stabilityScore = 2;
    factors.push({ factor: "Identity & Stability", impact: "positive", detail: `Established SIM (${tm.simAgeDays} days)` });
  } else if (tm.simAgeDays < 180) {
    stabilityScore = 4;
    factors.push({ factor: "Identity & Stability", impact: "negative", detail: `New SIM (${tm.simAgeDays} days) — limited history` });
  } else {
    factors.push({ factor: "Identity & Stability", impact: "neutral", detail: `Moderate SIM age (${tm.simAgeDays} days)` });
  }
  weightedScore += stabilityScore * 0.15;

  const riskScore = Math.max(1, Math.min(5, Math.round(weightedScore)));
  const tiers = ["very_low", "low", "medium", "high", "very_high"];
  const riskTier = tiers[riskScore - 1];
  const approved = riskScore <= 3;
  const creditLimit = approved ? Math.min(500, Math.round(fm.totalInflowsUsd * 0.2)) : 0;

  const reasonCodes: Record<number, string> = {
    1: "EXCELLENT_PROFILE", 2: "GOOD_PROFILE", 3: "MODERATE_RISK",
    4: "ELEVATED_RISK", 5: "HIGH_RISK",
  };

  const rationale = `Rule-Based Assessment for ${profile.msisdn} (${profile.provider}, ${profile.country})\n\n` +
    `This subscriber received a risk score of ${riskScore}/5 (${riskTier.replace("_", " ")}) based on deterministic KPI analysis over ${kpis.evaluationPeriodDays} days. ` +
    `Total inflows: $${fm.totalInflowsUsd.toFixed(2)}, variance coefficient: ${fm.inflowVarianceCoefficient.toFixed(2)}, ` +
    `wallet retention: ${(fm.walletRetentionRatio * 100).toFixed(0)}%. ` +
    `The subscriber has ${nm.uniqueP2pCounterparties} unique counterparties and ${fm.utilityPaymentsCount} utility payments ` +
    `with a consistency score of ${fm.utilityPaymentConsistencyScore.toFixed(2)}.\n\n` +
    `Credit limit recommendation: $${creditLimit} USD. ${approved ? "Approval recommended." : "Decline recommended — risk exceeds threshold."}`;

  return {
    riskScore,
    riskTier,
    approvalRecommendation: approved,
    suggestedCreditLimitUsd: creditLimit,
    reasonCode: reasonCodes[riskScore] || "ASSESSMENT_COMPLETE",
    detailedRationale: rationale,
    keyFactors: factors,
    regulatoryNote: `Scored using deterministic rule-based engine. No AI models were used. Data processed in compliance with ${profile.country} data protection regulations.`,
    aiProvider: "rule-based",
    aiModel: "KPI Rule Engine v1.0",
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
  const kpiJson = JSON.stringify(kpis, null, 2);

  const quantPrompt = `You are a quantitative credit risk analyst. Analyze this telecom mobile money profile and compute risk metrics.

SUBSCRIBER: ${profile.msisdn} (${profile.provider}, ${profile.country}, KYC: ${profile.kycLevel})

KPI DATA (${kpis.evaluationPeriodDays}-day window):
${kpiJson}

SCORING RULES:
- Risk Score: 1 (Very Low Risk) to 5 (Very High Risk)
- Risk Tier: very_low (1), low (2), medium (3), high (4), very_high (5)
- Credit limit: max 20% of total inflows, capped at $500 for new profiles
- Approval: recommend if risk_score <= 3

CRITERIA WEIGHTS:
1. Cash Flow Stability (30%): variance coefficient <0.3=excellent, >0.8=poor; wallet retention ratio
2. Bill Payment Consistency (20%): utility consistency >0.8=excellent; regular bill payments
3. Liquidity Stress (20%): airtime advances >3/quarter=concerning; immediate cash-out patterns
4. Network Quality (15%): >20 unique counterparties=good; >30% merchant payments=positive
5. Identity Stability (15%): SIM age >365d=good; KYC full=excellent

Output JSON ONLY: {"risk_score": <1-5>, "risk_tier": "<very_low|low|medium|high|very_high>", "credit_limit_usd": <number>, "approval_recommendation": <boolean>, "key_factors": [{"factor": "<name>", "impact": "<positive|negative|neutral>", "detail": "<brief>"}]}`;

  const complianceTemplate = (quantResult: string) =>
    `You are a regulatory compliance officer for an African credit bureau. The quantitative AI engine produced this assessment:

${quantResult}

Subscriber: ${profile.msisdn} (${profile.provider}, ${profile.country}, KYC: ${profile.kycLevel})
Raw KPIs: ${kpiJson}

Write a regulatory-compliant assessment. Output JSON ONLY:
{
  "reason_code": "<PRIMARY_REASON_CODE e.g. CASH_FLOW_STABLE, HIGH_VARIANCE, LOW_ACTIVITY>",
  "detailed_rationale": "<2-3 paragraph professional explanation of the credit decision, referencing specific KPI values>",
  "regulatory_note": "<data protection and regulatory compliance note for ${profile.country}>"
}`;

  try {
    const ensemble = await dualAIEnsemble(quantPrompt, complianceTemplate, {
      quantMaxTokens: 1000,
      complianceMaxTokens: 1500,
      temperature: 0.1,
    });

    const quantMatch = ensemble.quantResult.match(/\{[\s\S]*\}/);
    const quantData = quantMatch ? JSON.parse(quantMatch[0]) : JSON.parse(ensemble.quantResult);

    const complianceMatch = ensemble.complianceResult.match(/\{[\s\S]*\}/);
    const complianceData = complianceMatch ? JSON.parse(complianceMatch[0]) : JSON.parse(ensemble.complianceResult);

    return {
      riskScore: quantData.risk_score || 3,
      riskTier: quantData.risk_tier || "medium",
      approvalRecommendation: quantData.approval_recommendation ?? false,
      suggestedCreditLimitUsd: quantData.credit_limit_usd || 0,
      reasonCode: complianceData.reason_code || "ASSESSMENT_COMPLETE",
      detailedRationale: complianceData.detailed_rationale || ensemble.complianceResult,
      keyFactors: quantData.key_factors || [],
      regulatoryNote: complianceData.regulatory_note || "",
      aiProvider: `${ensemble.quantProvider}+${ensemble.complianceProvider}`,
      aiModel: `${ensemble.quantProvider === "openai" ? "gpt-4o" : "claude-opus-4-6"}+${ensemble.complianceProvider === "claude" ? "claude-opus-4-6" : "gpt-4o"} (Dual-AI Ensemble)`,
    };
  } catch (ensembleErr: any) {
    console.warn(`[TelcoScoring] Dual-AI ensemble failed: ${ensembleErr.message}, falling back to single-model`);
    const result = await generateAIResponse(
      TELCO_SCORING_SYSTEM_PROMPT,
      `Evaluate this mobile money subscriber for credit scoring:\nSubscriber: ${profile.msisdn} (${profile.provider}, ${profile.country})\nKPIs:\n${kpiJson}\nProvide assessment in JSON format with: risk_score, risk_tier, approval_recommendation, suggested_credit_limit_usd, reason_code, detailed_rationale, key_factors, regulatory_note`,
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
        riskScore: 3, riskTier: "medium", approvalRecommendation: false, suggestedCreditLimitUsd: 0,
        reasonCode: "PARSE_ERROR", detailedRationale: result.text, keyFactors: [],
        regulatoryNote: "Unable to parse structured response",
        aiProvider: result.provider, aiModel: result.provider === "openai" ? "gpt-4o" : "claude-opus-4-6",
      };
    }
  }
}
