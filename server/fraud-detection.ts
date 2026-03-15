interface FraudCheckInput {
  borrowerId: string;
  nationalId: string;
  phone?: string | null;
  email?: string | null;
  accountCount: number;
  inquiryCount: number;
  recentInquiries: number;
  duplicateIdCount: number;
  isPep: boolean;
  hasActiveJudgments: boolean;
  writtenOffCount: number;
  totalDebt: number;
  monthlyIncome: number;
  accountCreatedRecently: number;
}

export interface FraudAlert {
  type: "velocity" | "identity" | "behavioral" | "financial";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  score: number;
}

export interface FraudRiskResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  alerts: FraudAlert[];
  checks: FraudCheck[];
}

export interface FraudCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export function calculateFraudRisk(input: FraudCheckInput): FraudRiskResult {
  const alerts: FraudAlert[] = [];
  const checks: FraudCheck[] = [];
  let riskScore = 0;

  if (input.recentInquiries > 10) {
    riskScore += 25;
    alerts.push({
      type: "velocity",
      severity: "high",
      title: "Excessive Credit Inquiries",
      description: `${input.recentInquiries} credit inquiries in the last 30 days indicates potential credit shopping fraud`,
      score: 25,
    });
    checks.push({ name: "Inquiry Velocity", status: "fail", detail: `${input.recentInquiries} inquiries in 30 days (threshold: 10)` });
  } else if (input.recentInquiries > 5) {
    riskScore += 10;
    alerts.push({
      type: "velocity",
      severity: "medium",
      title: "Elevated Credit Inquiries",
      description: `${input.recentInquiries} recent inquiries — monitor for credit shopping patterns`,
      score: 10,
    });
    checks.push({ name: "Inquiry Velocity", status: "warn", detail: `${input.recentInquiries} inquiries in 30 days` });
  } else {
    checks.push({ name: "Inquiry Velocity", status: "pass", detail: `${input.recentInquiries} inquiries — within normal range` });
  }

  if (input.accountCreatedRecently > 5) {
    riskScore += 20;
    alerts.push({
      type: "velocity",
      severity: "high",
      title: "Rapid Account Opening",
      description: `${input.accountCreatedRecently} new accounts opened in 90 days — possible bust-out fraud pattern`,
      score: 20,
    });
    checks.push({ name: "Account Opening Velocity", status: "fail", detail: `${input.accountCreatedRecently} accounts in 90 days` });
  } else if (input.accountCreatedRecently > 3) {
    riskScore += 8;
    checks.push({ name: "Account Opening Velocity", status: "warn", detail: `${input.accountCreatedRecently} accounts in 90 days` });
  } else {
    checks.push({ name: "Account Opening Velocity", status: "pass", detail: `${input.accountCreatedRecently} accounts in 90 days` });
  }

  if (input.duplicateIdCount > 1) {
    riskScore += 30;
    alerts.push({
      type: "identity",
      severity: "critical",
      title: "Duplicate National ID Detected",
      description: `National ID appears on ${input.duplicateIdCount} borrower records — potential identity fraud or synthetic identity`,
      score: 30,
    });
    checks.push({ name: "Identity Uniqueness", status: "fail", detail: `ID found on ${input.duplicateIdCount} records` });
  } else {
    checks.push({ name: "Identity Uniqueness", status: "pass", detail: "National ID is unique in the system" });
  }

  if (!input.phone && !input.email) {
    riskScore += 10;
    alerts.push({
      type: "identity",
      severity: "medium",
      title: "Missing Contact Information",
      description: "No phone or email on file — limits identity verification capability",
      score: 10,
    });
    checks.push({ name: "Contact Verification", status: "warn", detail: "No phone or email available" });
  } else {
    checks.push({ name: "Contact Verification", status: "pass", detail: "Contact information available" });
  }

  if (input.isPep) {
    riskScore += 15;
    alerts.push({
      type: "behavioral",
      severity: "medium",
      title: "Politically Exposed Person",
      description: "Enhanced due diligence required for PEP borrowers under AML regulations",
      score: 15,
    });
    checks.push({ name: "PEP Status", status: "warn", detail: "Borrower flagged as PEP" });
  } else {
    checks.push({ name: "PEP Status", status: "pass", detail: "Not a politically exposed person" });
  }

  if (input.monthlyIncome > 0 && input.totalDebt > input.monthlyIncome * 60) {
    riskScore += 20;
    alerts.push({
      type: "financial",
      severity: "high",
      title: "Debt-to-Income Anomaly",
      description: `Total debt exceeds 60x monthly income — possible income misrepresentation or overleveraging`,
      score: 20,
    });
    checks.push({ name: "Debt-to-Income Ratio", status: "fail", detail: `DTI ratio: ${Math.round(input.totalDebt / input.monthlyIncome)}x` });
  } else if (input.monthlyIncome > 0 && input.totalDebt > input.monthlyIncome * 36) {
    riskScore += 8;
    checks.push({ name: "Debt-to-Income Ratio", status: "warn", detail: `DTI ratio: ${Math.round(input.totalDebt / input.monthlyIncome)}x` });
  } else if (input.monthlyIncome > 0) {
    checks.push({ name: "Debt-to-Income Ratio", status: "pass", detail: `DTI ratio: ${Math.round(input.totalDebt / input.monthlyIncome)}x` });
  } else {
    checks.push({ name: "Debt-to-Income Ratio", status: "warn", detail: "No income data available" });
  }

  if (input.hasActiveJudgments && input.writtenOffCount > 0) {
    riskScore += 15;
    alerts.push({
      type: "behavioral",
      severity: "high",
      title: "Negative Credit Pattern",
      description: "Combination of active court judgments and written-off accounts indicates systemic default behavior",
      score: 15,
    });
    checks.push({ name: "Negative Credit Pattern", status: "fail", detail: "Active judgments + write-offs detected" });
  } else if (input.hasActiveJudgments || input.writtenOffCount > 0) {
    riskScore += 5;
    checks.push({ name: "Negative Credit Pattern", status: "warn", detail: input.hasActiveJudgments ? "Active court judgments" : "Written-off accounts" });
  } else {
    checks.push({ name: "Negative Credit Pattern", status: "pass", detail: "No negative credit patterns" });
  }

  riskScore = Math.min(100, riskScore);

  let riskLevel: "low" | "medium" | "high" | "critical";
  if (riskScore >= 70) riskLevel = "critical";
  else if (riskScore >= 45) riskLevel = "high";
  else if (riskScore >= 20) riskLevel = "medium";
  else riskLevel = "low";

  return { riskScore, riskLevel, alerts, checks };
}
