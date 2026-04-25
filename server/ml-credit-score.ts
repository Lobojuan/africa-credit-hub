interface MLAccountInput {
  status: string;
  currentBalance?: string | null;
  currency?: string | null;
  openedDate?: string | Date | null;
  lastPaymentDate?: string | Date | null;
  creditLimit?: string | null;
  monthlyPayment?: string | null;
}

interface MLAlternativeData {
  source: string;
  totalTransactions: number | null;
  onTimePayments: number | null;
  latePayments: number | null;
  status: string;
  averageMonthlyAmount?: string | null;
}

export interface MLScoreFactor {
  feature: string;
  value: number;
  contribution: number;
  direction: "positive" | "negative" | "neutral";
  description: string;
}

export interface MLCreditScoreResult {
  mlScore: number;
  confidence: number;
  confidenceInterval: [number, number];
  riskCategory: "very_low" | "low" | "moderate" | "high" | "very_high";
  defaultProbability: number;
  featureImportance: MLScoreFactor[];
  modelVersion: string;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function safeNum(v: string | number | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? fallback : n;
}

function monthsSince(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

function computePaymentVelocity(accounts: MLAccountInput[]): number {
  const recent = accounts.filter(a => {
    const months = monthsSince(a.lastPaymentDate);
    return months <= 6 && (a.status === "current" || a.status === "closed");
  });
  return accounts.length > 0 ? recent.length / accounts.length : 0;
}

function computeUtilizationTrend(accounts: MLAccountInput[]): number {
  const withLimits = accounts.filter(a => safeNum(a.creditLimit) > 0);
  if (withLimits.length === 0) return 0.5;
  const avgUtil = withLimits.reduce((sum, a) => {
    const balance = safeNum(a.currentBalance);
    const limit = safeNum(a.creditLimit, 1);
    return sum + Math.min(balance / limit, 1);
  }, 0) / withLimits.length;
  return avgUtil;
}

function computeAccountAgeDiversity(accounts: MLAccountInput[]): number {
  if (accounts.length === 0) return 0;
  const ages = accounts.map(a => monthsSince(a.openedDate)).filter(a => a > 0);
  if (ages.length === 0) return 0;
  const avgAge = ages.reduce((s, a) => s + a, 0) / ages.length;
  const maxAge = Math.max(...ages);
  const diversity = Math.min(ages.length / 5, 1) * 0.5 + Math.min(avgAge / 60, 1) * 0.3 + Math.min(maxAge / 120, 1) * 0.2;
  return diversity;
}

function computeCrossBorderExposure(accounts: MLAccountInput[]): number {
  const currencies = new Set(accounts.map(a => a.currency).filter(Boolean));
  return Math.min(currencies.size / 3, 1);
}

function computeDebtServiceRatio(accounts: MLAccountInput[]): number {
  const totalMonthly = accounts.reduce((s, a) => s + safeNum(a.monthlyPayment), 0);
  const totalBalance = accounts.reduce((s, a) => s + safeNum(a.currentBalance), 0);
  if (totalBalance === 0) return 0;
  return Math.min(totalMonthly / (totalBalance * 0.03 + 1), 2);
}

function computeAltDataReliability(altData: MLAlternativeData[]): number {
  const active = altData.filter(d => d.status === "active");
  if (active.length === 0) return 0;
  const totalTx = active.reduce((s, d) => s + (d.totalTransactions || 0), 0);
  const onTime = active.reduce((s, d) => s + (d.onTimePayments || 0), 0);
  const ratio = totalTx > 0 ? onTime / totalTx : 0;
  const sourceDiversity = Math.min(new Set(active.map(d => d.source)).size / 4, 1);
  const volumeScore = Math.min(totalTx / 100, 1);
  return ratio * 0.5 + sourceDiversity * 0.3 + volumeScore * 0.2;
}

export interface AfricanRiskFactors {
  isAgriculturalBorrower?: boolean;
  seasonalIncomeVolatility?: number;
  foreignCurrencyDebtRatio?: number;
  informalSavingsGroupMember?: boolean;
  susuChamaMonthsActive?: number;
  hasUntitledLandCollateral?: boolean;
  regionalStabilityScore?: number;
}

export function calculateMLCreditScore(
  accounts: MLAccountInput[],
  inquiryCount: number,
  judgmentCount: number,
  isPep: boolean,
  alternativeData: MLAlternativeData[] = [],
  africanRiskFactors: AfricanRiskFactors = {}
): MLCreditScoreResult {
  const featureImportance: MLScoreFactor[] = [];

  const paymentVelocity = computePaymentVelocity(accounts);
  const utilization = computeUtilizationTrend(accounts);
  const ageDiversity = computeAccountAgeDiversity(accounts);
  const crossBorder = computeCrossBorderExposure(accounts);
  const debtService = computeDebtServiceRatio(accounts);
  const altReliability = computeAltDataReliability(alternativeData);

  const statusCounts = { current: 0, delinquent: 0, default: 0, closed: 0, written_off: 0, restructured: 0 };
  accounts.forEach(a => {
    const s = a.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });

  const totalAccounts = accounts.length;
  const healthRatio = totalAccounts > 0
    ? (statusCounts.current + statusCounts.closed) / totalAccounts
    : 0;

  const w = {
    paymentVelocity: 0.20,
    healthRatio: 0.18,
    utilization: 0.15,
    ageDiversity: 0.12,
    debtService: 0.10,
    altData: 0.10,
    inquiries: 0.05,
    judgments: 0.05,
    crossBorder: 0.03,
    pep: 0.02,
  };

  let logit = -0.5;

  const pvContrib = paymentVelocity * 3.5 * w.paymentVelocity;
  logit += pvContrib;
  featureImportance.push({
    feature: "Payment Velocity",
    value: Math.round(paymentVelocity * 100),
    contribution: Math.round(pvContrib * 100),
    direction: paymentVelocity > 0.5 ? "positive" : paymentVelocity < 0.3 ? "negative" : "neutral",
    description: `${Math.round(paymentVelocity * 100)}% of accounts show recent payment activity`,
  });

  const hrContrib = healthRatio * 3.0 * w.healthRatio;
  logit += hrContrib;
  featureImportance.push({
    feature: "Account Health Ratio",
    value: Math.round(healthRatio * 100),
    contribution: Math.round(hrContrib * 100),
    direction: healthRatio > 0.7 ? "positive" : healthRatio < 0.4 ? "negative" : "neutral",
    description: `${Math.round(healthRatio * 100)}% of accounts in good standing`,
  });

  const utilContrib = (1 - utilization) * 2.5 * w.utilization;
  logit += utilContrib;
  featureImportance.push({
    feature: "Credit Utilization",
    value: Math.round(utilization * 100),
    contribution: Math.round(utilContrib * 100),
    direction: utilization < 0.3 ? "positive" : utilization > 0.7 ? "negative" : "neutral",
    description: `Average utilization at ${Math.round(utilization * 100)}%`,
  });

  const ageContrib = ageDiversity * 2.0 * w.ageDiversity;
  logit += ageContrib;
  featureImportance.push({
    feature: "Account Age & Diversity",
    value: Math.round(ageDiversity * 100),
    contribution: Math.round(ageContrib * 100),
    direction: ageDiversity > 0.5 ? "positive" : "neutral",
    description: `Credit history depth and variety score: ${Math.round(ageDiversity * 100)}`,
  });

  const dsContrib = Math.min(debtService, 1) * 1.5 * w.debtService;
  logit += dsContrib;
  featureImportance.push({
    feature: "Debt Service Capacity",
    value: Math.round(debtService * 100),
    contribution: Math.round(dsContrib * 100),
    direction: debtService > 0.5 ? "positive" : "neutral",
    description: `Debt service capacity indicator: ${Math.round(debtService * 100)}%`,
  });

  const altContrib = altReliability * 2.0 * w.altData;
  logit += altContrib;
  featureImportance.push({
    feature: "Alternative Data Reliability",
    value: Math.round(altReliability * 100),
    contribution: Math.round(altContrib * 100),
    direction: altReliability > 0.5 ? "positive" : altReliability > 0 ? "neutral" : "neutral",
    description: altReliability > 0
      ? `Alternative data from ${alternativeData.filter(d => d.status === "active").length} source(s)`
      : "No alternative data available",
  });

  const inqPenalty = Math.min(inquiryCount / 10, 1) * -1.5 * w.inquiries;
  logit += inqPenalty;
  featureImportance.push({
    feature: "Credit Inquiries",
    value: inquiryCount,
    contribution: Math.round(inqPenalty * 100),
    direction: inquiryCount <= 3 ? "neutral" : "negative",
    description: `${inquiryCount} recent credit inquiries`,
  });

  const judgPenalty = Math.min(judgmentCount, 5) * -0.8 * w.judgments;
  logit += judgPenalty;
  if (judgmentCount > 0) {
    featureImportance.push({
      feature: "Court Judgments",
      value: judgmentCount,
      contribution: Math.round(judgPenalty * 100),
      direction: "negative",
      description: `${judgmentCount} active court judgment(s)`,
    });
  }

  const cbContrib = crossBorder * 0.5 * w.crossBorder;
  logit += cbContrib;
  if (crossBorder > 0) {
    featureImportance.push({
      feature: "Cross-Border Exposure",
      value: Math.round(crossBorder * 100),
      contribution: Math.round(cbContrib * 100),
      direction: "neutral",
      description: "Multi-currency credit activity detected",
    });
  }

  if (isPep) {
    const pepPenalty = -0.3 * w.pep;
    logit += pepPenalty;
    featureImportance.push({
      feature: "PEP Status",
      value: 1,
      contribution: Math.round(pepPenalty * 100),
      direction: "negative",
      description: "Politically Exposed Person — elevated risk factor",
    });
  }

  // ── African-specific risk factors ─────────────────────────────────
  const {
    isAgriculturalBorrower = false,
    seasonalIncomeVolatility = 0,
    foreignCurrencyDebtRatio = 0,
    informalSavingsGroupMember = false,
    susuChamaMonthsActive = 0,
    hasUntitledLandCollateral = false,
    regionalStabilityScore = 1.0,
  } = africanRiskFactors;

  if (isAgriculturalBorrower) {
    const volatility = clamp(seasonalIncomeVolatility, 0, 1);
    const agriPenalty = volatility > 0.5 ? -(volatility - 0.3) * 0.6 : 0.05;
    logit += agriPenalty;
    featureImportance.push({
      feature: "Agricultural / Seasonal Income",
      value: Math.round(volatility * 100),
      contribution: Math.round(agriPenalty * 100),
      direction: agriPenalty >= 0 ? "neutral" : "negative",
      description: volatility > 0.5
        ? `High seasonal income volatility (${Math.round(volatility * 100)}%) — cash-flow risk`
        : "Agricultural borrower with manageable seasonal income",
    });
  }

  if (foreignCurrencyDebtRatio > 0) {
    const fxRisk = clamp(foreignCurrencyDebtRatio, 0, 1);
    const fxPenalty = fxRisk > 0.4 ? -(fxRisk - 0.2) * 0.7 : 0;
    logit += fxPenalty;
    if (Math.abs(fxPenalty) > 0.01) {
      featureImportance.push({
        feature: "Currency Devaluation Exposure",
        value: Math.round(fxRisk * 100),
        contribution: Math.round(fxPenalty * 100),
        direction: "negative",
        description: `${Math.round(fxRisk * 100)}% of debt is foreign-currency denominated — devaluation risk`,
      });
    }
  }

  if (informalSavingsGroupMember) {
    const chamaMonths = Math.min(susuChamaMonthsActive, 36);
    const chamaBoost = 0.05 + (chamaMonths / 36) * 0.10;
    logit += chamaBoost;
    featureImportance.push({
      feature: "Informal Savings Group (Susu/Chama)",
      value: chamaMonths,
      contribution: Math.round(chamaBoost * 100),
      direction: "positive",
      description: `Active member for ${chamaMonths} months — demonstrates financial discipline`,
    });
  }

  if (hasUntitledLandCollateral) {
    const landPenalty = -0.12;
    logit += landPenalty;
    featureImportance.push({
      feature: "Untitled Land Collateral",
      value: 1,
      contribution: Math.round(landPenalty * 100),
      direction: "negative",
      description: "Collateral includes untitled land — enforcement risk if borrower defaults",
    });
  }

  if (regionalStabilityScore < 0.8) {
    const stabilityPenalty = -(1 - regionalStabilityScore) * 0.5;
    logit += stabilityPenalty;
    featureImportance.push({
      feature: "Regional Stability",
      value: Math.round(regionalStabilityScore * 100),
      contribution: Math.round(stabilityPenalty * 100),
      direction: "negative",
      description: `Regional stability index ${Math.round(regionalStabilityScore * 100)}% — elevated macro-environment risk`,
    });
  }

  const delinqInteraction = statusCounts.delinquent > 0 && utilization > 0.7
    ? -0.5 * (statusCounts.delinquent / Math.max(totalAccounts, 1))
    : 0;
  logit += delinqInteraction;

  const writeoffInteraction = statusCounts.written_off > 0
    ? -0.8 * (statusCounts.written_off / Math.max(totalAccounts, 1))
    : 0;
  logit += writeoffInteraction;

  if (totalAccounts === 0) {
    logit = 0.1;
  }

  const probability = sigmoid(logit);
  const mlScore = Math.round(300 + probability * 550);
  const clampedScore = clamp(mlScore, 300, 850);

  const baseConfidence = totalAccounts === 0 ? 0.3 : Math.min(0.5 + totalAccounts * 0.04, 0.95);
  const altBoost = altReliability > 0 ? 0.05 : 0;
  const confidence = Math.round(clamp(baseConfidence + altBoost, 0.3, 0.98) * 100) / 100;

  const margin = Math.round((1 - confidence) * 75);
  const confidenceInterval: [number, number] = [
    clamp(clampedScore - margin, 300, 850),
    clamp(clampedScore + margin, 300, 850),
  ];

  const defaultProbability = Math.round((1 - probability) * 10000) / 10000;

  let riskCategory: MLCreditScoreResult["riskCategory"];
  if (clampedScore >= 750) riskCategory = "very_low";
  else if (clampedScore >= 670) riskCategory = "low";
  else if (clampedScore >= 580) riskCategory = "moderate";
  else if (clampedScore >= 450) riskCategory = "high";
  else riskCategory = "very_high";

  featureImportance.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    mlScore: clampedScore,
    confidence,
    confidenceInterval,
    riskCategory,
    defaultProbability,
    featureImportance,
    modelVersion: "ACH-Scorecard-v1.0",
  };
}
