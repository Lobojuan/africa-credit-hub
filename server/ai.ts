import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { getDefaultCurrencyCode } from "./credit-score";

export type AIProvider = "openai" | "claude";

export type AITaskType =
  | "data_analysis"
  | "customer_chat"
  | "legal_review"
  | "credit_risk"
  | "compliance"
  | "narrative";

export function isValidProvider(value: unknown): value is AIProvider {
  return value === "openai" || value === "claude";
}

export function parseProvider(value: unknown): AIProvider {
  if (isValidProvider(value)) return value;
  return "claude";
}

export function parseOptionalProvider(value: unknown): AIProvider | undefined {
  if (isValidProvider(value)) return value;
  return undefined;
}

const TASK_ROUTING: Record<AITaskType, { primary: AIProvider; fallback: AIProvider }> = {
  data_analysis:  { primary: "openai", fallback: "claude" },
  credit_risk:    { primary: "openai", fallback: "claude" },
  customer_chat:  { primary: "claude", fallback: "openai" },
  legal_review:   { primary: "claude", fallback: "openai" },
  compliance:     { primary: "claude", fallback: "openai" },
  narrative:      { primary: "claude", fallback: "openai" },
};

function getProviderForTask(taskType: AITaskType, explicitProvider?: AIProvider): { primary: AIProvider; fallback: AIProvider } {
  if (explicitProvider) {
    const other: AIProvider = explicitProvider === "openai" ? "claude" : "openai";
    return { primary: explicitProvider, fallback: other };
  }
  return TASK_ROUTING[taskType];
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const MAX_ALLOWED_TOKENS = 4000;

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  taskType: AITaskType,
  options: { maxTokens?: number; temperature?: number; explicitProvider?: AIProvider } = {}
): Promise<{ text: string; provider: AIProvider; usedFallback: boolean }> {
  const requestedTokens = options.maxTokens ?? 2000;
  if (requestedTokens > MAX_ALLOWED_TOKENS) {
    console.warn(`[AI] Requested ${requestedTokens} tokens exceeds cap of ${MAX_ALLOWED_TOKENS}. Clamping to max.`);
  }
  const maxTokens = Math.min(requestedTokens, MAX_ALLOWED_TOKENS);
  const { temperature = 0.3, explicitProvider } = options;
  const routing = getProviderForTask(taskType, explicitProvider);

  async function callProvider(provider: AIProvider): Promise<string> {
    if (provider === "claude") {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      return response.content[0]?.type === "text" ? response.content[0].text : "{}";
    } else {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      });
      return response.choices[0]?.message?.content || "{}";
    }
  }

  try {
    const text = await callProvider(routing.primary);
    return { text, provider: routing.primary, usedFallback: false };
  } catch (primaryError: any) {
    console.error(`[AI Router] Primary model (${routing.primary}) failed for ${taskType}: ${primaryError.message}. Falling back to ${routing.fallback}...`);
    try {
      const text = await callProvider(routing.fallback);
      return { text, provider: routing.fallback, usedFallback: true };
    } catch (fallbackError: any) {
      console.error(`[AI Router] Fallback model (${routing.fallback}) also failed: ${fallbackError.message}`);
      throw new Error(`Both AI providers failed. Primary (${routing.primary}): ${primaryError.message}. Fallback (${routing.fallback}): ${fallbackError.message}`);
    }
  }
}

export async function dualAIEnsemble(
  quantPrompt: string,
  compliancePromptTemplate: (quantResult: string) => string,
  options: { quantMaxTokens?: number; complianceMaxTokens?: number; temperature?: number } = {}
): Promise<{ quantResult: string; complianceResult: string; quantProvider: AIProvider; complianceProvider: AIProvider }> {
  const { quantMaxTokens = 1000, complianceMaxTokens = 1500, temperature = 0.1 } = options;

  let quantText: string;
  let quantProvider: AIProvider = "openai";
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: quantPrompt }],
      max_tokens: quantMaxTokens,
      temperature,
      response_format: { type: "json_object" },
    });
    quantText = gptResponse.choices[0]?.message?.content || "{}";
  } catch (gptErr: any) {
    console.warn(`[DualAI] GPT-4o quant step failed: ${gptErr.message}, falling back to Claude`);
    quantProvider = "claude";
    const claudeResponse = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: quantMaxTokens,
      messages: [{ role: "user", content: quantPrompt }],
    });
    quantText = claudeResponse.content[0]?.type === "text" ? claudeResponse.content[0].text : "{}";
  }

  const compliancePrompt = compliancePromptTemplate(quantText);
  let complianceText: string;
  let complianceProvider: AIProvider = "claude";
  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: complianceMaxTokens,
      messages: [{ role: "user", content: compliancePrompt }],
    });
    complianceText = claudeResponse.content[0]?.type === "text" ? claudeResponse.content[0].text : "{}";
  } catch (claudeErr: any) {
    console.warn(`[DualAI] Claude compliance step failed: ${claudeErr.message}, falling back to GPT-4o`);
    complianceProvider = "openai";
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: compliancePrompt }],
      max_tokens: complianceMaxTokens,
      temperature: 0.3,
    });
    complianceText = gptResponse.choices[0]?.message?.content || "{}";
  }

  return { quantResult: quantText, complianceResult: complianceText, quantProvider, complianceProvider };
}

export async function analyzeCreditRisk(borrowerId: string | number, provider?: AIProvider) {
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) throw new Error("Borrower not found");

  const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
  const disputes = await storage.getDisputesByBorrower(borrowerId);
  const defaultCurrency = getDefaultCurrencyCode();

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
  const activeCount = accounts.filter(a => a.status === "current" || a.status === "closed").length;
  const openDisputeCount = disputes.filter(d => d.status === "open" || d.status === "under_review").length;

  const borrowerProfile = `
Borrower: ${borrower.firstName} ${borrower.lastName}
Type: ${borrower.borrowerType || "individual"}
Country: ${borrower.country || "Unknown"}
Employment: ${borrower.employmentStatus || "Unknown"}
Monthly Income: ${borrower.monthlyIncome || "Not reported"}
PEP Status: ${borrower.isPep ? "Yes" : "No"}
Number of Credit Accounts: ${accounts.length}
Active/Current Accounts: ${activeCount}
Delinquent/Default Accounts: ${delinquentCount}
Total Outstanding Balance: ${defaultCurrency} ${totalBalance.toLocaleString()}
Open Disputes: ${openDisputeCount}
Account Details:
${accounts.map(a => `  - ${a.accountType}: ${a.currency || defaultCurrency} ${parseFloat(a.currentBalance || "0").toLocaleString()} | Status: ${a.status} | Opened: ${a.dateOpened || "Unknown"}`).join("\n")}
  `.trim();

  const systemPrompt = `You are an expert credit risk analyst for the Pan-African Credit Registry. Analyze borrower profiles and provide structured risk assessments. All monetary amounts are in ${defaultCurrency} (${defaultCurrency === "GHS" ? "Ghana Cedis" : defaultCurrency}). You must respond in valid JSON format with these fields:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": <number 0-100, higher = more risky>,
  "summary": "<2-3 sentence executive summary>",
  "factors": [{"factor": "<name>", "impact": "positive" | "negative" | "neutral", "detail": "<explanation>"}],
  "recommendations": ["<actionable recommendation>"],
  "regulatoryFlags": ["<any compliance concerns>"]
}`;
  const userPrompt = `Analyze this borrower's credit risk:\n\n${borrowerProfile}`;

  const result = await generateAIResponse(systemPrompt, userPrompt, "credit_risk", {
    maxTokens: 1500,
    temperature: 0.3,
    ...(provider && { explicitProvider: provider }),
  });
  if (result.usedFallback) {
    console.log(`[AI Router] analyzeCreditRisk completed via fallback (${result.provider})`);
  }

  return parseJSON(result.text, {
    riskLevel: "medium",
    riskScore: 50,
    summary: "Analysis completed. Please try again if content is incomplete.",
    factors: [],
    recommendations: [],
    regulatoryFlags: [],
  });
}

export async function generateReportSummary(borrowerId: string | number, provider?: AIProvider, language?: string) {
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) throw new Error("Borrower not found");

  const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
  const disputes = await storage.getDisputesByBorrower(borrowerId);
  const defaultCurrency = getDefaultCurrencyCode();

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);

  const reportData = `
Borrower: ${borrower.firstName} ${borrower.lastName} (${borrower.borrowerType || "individual"})
Country: ${borrower.country || "Unknown"} | ID: ${borrower.nationalId || "N/A"}
Employment: ${borrower.employmentStatus || "Unknown"} | Income: ${borrower.monthlyIncome || "Not reported"}

Credit Accounts (${accounts.length}):
${accounts.map(a => `  ${a.accountType} — ${a.currency || defaultCurrency} ${parseFloat(a.currentBalance || "0").toLocaleString()} — Status: ${a.status} — Opened: ${a.dateOpened || "Unknown"}`).join("\n")}

Total Outstanding: ${defaultCurrency} ${totalBalance.toLocaleString()}
Disputes: ${disputes.length} total, ${disputes.filter(d => d.status === "open").length} open
  `.trim();

  const langNames: Record<string, string> = { en: "English", fr: "French", ar: "Arabic", sw: "Swahili", pt: "Portuguese" };
  const targetLang = langNames[language || "en"] || "English";
  const langInstruction = targetLang !== "English" ? ` You MUST write the entire summary in ${targetLang}. Every word, heading, and sentence must be in ${targetLang} — do not use English at all.` : "";

  const systemPrompt = `You are a credit report summarizer for the Pan-African Credit Registry. All monetary amounts are in ${defaultCurrency} (${defaultCurrency === "GHS" ? "Ghana Cedis" : defaultCurrency}). Generate clear, professional, plain-language summaries of credit reports suitable for non-technical readers such as bank officers and regulators. Include key highlights, concerns, and an overall assessment. Keep it concise but comprehensive (3-5 paragraphs). Use professional financial language. Always reference amounts in ${defaultCurrency}.${langInstruction}`;
  const userPrompt = `Generate a plain-language credit report summary${targetLang !== "English" ? ` in ${targetLang}` : ""}:\n\n${reportData}`;

  const result = await generateAIResponse(systemPrompt, userPrompt, "narrative", {
    maxTokens: 1000,
    temperature: 0.4,
    ...(provider && { explicitProvider: provider }),
  });
  if (result.usedFallback) {
    console.log(`[AI Router] generateReportSummary completed via fallback (${result.provider})`);
  }

  return {
    summary: result.text,
    borrowerName: `${borrower.firstName} ${borrower.lastName}`,
    generatedAt: new Date().toISOString(),
  };
}

function sanitizeForPrompt(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/[<>{}[\]]/g, "").replace(/\n/g, " ").slice(0, 100);
}

async function buildPortfolioData() {
  const [stats, borrowersResult, allAccounts, disputes, institutions] = await Promise.all([
    storage.getDashboardStats(),
    storage.getBorrowers(1, 200),
    storage.getAllCreditAccounts(),
    storage.getDisputes(),
    storage.getInstitutions(1, 100),
  ]);

  const accountsByBorrower: Record<string, typeof allAccounts> = {};
  for (const acc of allAccounts) {
    const bid = String(acc.borrowerId);
    if (!accountsByBorrower[bid]) accountsByBorrower[bid] = [];
    accountsByBorrower[bid].push(acc);
  }

  const disputesByBorrower: Record<string, number> = {};
  for (const d of disputes) {
    const bid = String(d.borrowerId);
    disputesByBorrower[bid] = (disputesByBorrower[bid] || 0) + 1;
  }

  const borrowerProfiles = borrowersResult.data.map(b => {
    const bAccounts = accountsByBorrower[String(b.id)] || [];
    const totalBalance = bAccounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
    const originalTotal = bAccounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
    const delinquent = bAccounts.filter(a => a.status === "delinquent").length;
    const defaulted = bAccounts.filter(a => a.status === "default").length;
    const writtenOff = bAccounts.filter(a => a.status === "written_off").length;
    const current = bAccounts.filter(a => a.status === "current").length;
    const closed = bAccounts.filter(a => a.status === "closed").length;
    const maxArrears = Math.max(0, ...bAccounts.map(a => parseInt(a.daysInArrears || "0") || 0));
    const disputeCount = disputesByBorrower[String(b.id)] || 0;
    const name = b.borrowerType === "corporate" ? (b.companyName || "Unknown Corp") : `${b.firstName || ""} ${b.lastName || ""}`.trim();

    return {
      name, id: b.id, type: b.borrowerType || "individual", nationalId: b.nationalId,
      phone: b.phone, email: b.email, address: b.address, city: b.city, region: b.region,
      accountCount: bAccounts.length, totalBalance, originalTotal,
      current, delinquent, defaulted, writtenOff, closed,
      maxArrears, disputeCount, isPep: b.isPep || false,
      employmentStatus: b.employmentStatus, monthlyIncome: b.monthlyIncome,
      accounts: bAccounts.map(a => ({
        type: a.accountType, balance: parseFloat(a.currentBalance || "0"),
        original: parseFloat(a.originalAmount || "0"), status: a.status,
        arrears: parseInt(a.daysInArrears || "0") || 0, lender: a.lenderInstitution,
        dateOpened: a.dateOpened, interestRate: a.interestRate,
      })),
    };
  });

  const accountsByType: Record<string, { count: number; balance: number; delinquent: number; defaulted: number }> = {};
  for (const acc of allAccounts) {
    const t = acc.accountType || "Other";
    if (!accountsByType[t]) accountsByType[t] = { count: 0, balance: 0, delinquent: 0, defaulted: 0 };
    accountsByType[t].count++;
    accountsByType[t].balance += parseFloat(acc.currentBalance || "0");
    if (acc.status === "delinquent") accountsByType[t].delinquent++;
    if (acc.status === "default") accountsByType[t].defaulted++;
  }

  const accountsByLender: Record<string, { count: number; balance: number; delinquent: number; defaulted: number }> = {};
  for (const acc of allAccounts) {
    const lender = acc.lenderInstitution || "Unknown";
    if (!accountsByLender[lender]) accountsByLender[lender] = { count: 0, balance: 0, delinquent: 0, defaulted: 0 };
    accountsByLender[lender].count++;
    accountsByLender[lender].balance += parseFloat(acc.currentBalance || "0");
    if (acc.status === "delinquent") accountsByLender[lender].delinquent++;
    if (acc.status === "default") accountsByLender[lender].defaulted++;
  }

  return { stats, borrowerProfiles, accountsByType, accountsByLender, totalAccounts: allAccounts.length, totalDisputes: disputes.length, institutions: institutions.data };
}

export async function generatePortfolioIntelligence(provider?: AIProvider) {
  const data = await buildPortfolioData();
  const defaultCurrency = getDefaultCurrencyCode();

  const riskBorrowers = data.borrowerProfiles
    .filter(b => b.delinquent > 0 || b.defaulted > 0 || b.writtenOff > 0 || b.maxArrears > 30)
    .sort((a, b) => (b.defaulted + b.delinquent + b.writtenOff) - (a.defaulted + a.delinquent + a.writtenOff) || b.maxArrears - a.maxArrears);

  const portfolioContext = `
PORTFOLIO DATA:
Total Borrowers: ${data.stats.totalBorrowers}
Total Accounts: ${data.stats.totalAccounts}
Outstanding: ${defaultCurrency} ${parseFloat(data.stats.totalOutstanding).toLocaleString()}
Delinquent Accounts: ${data.stats.delinquentAccounts}
Defaulted Accounts: ${data.stats.defaultAccounts}
Open Disputes: ${data.stats.openDisputeCount}

ACCOUNTS BY PRODUCT TYPE:
${Object.entries(data.accountsByType).map(([type, d]) => `${type}: ${d.count} accounts, ${defaultCurrency} ${d.balance.toLocaleString()} outstanding, ${d.delinquent} delinquent, ${d.defaulted} defaulted`).join("\n")}

ACCOUNTS BY LENDER:
${Object.entries(data.accountsByLender).map(([lender, d]) => `${lender}: ${d.count} accounts, ${defaultCurrency} ${d.balance.toLocaleString()} outstanding, ${d.delinquent} delinquent, ${d.defaulted} defaulted`).join("\n")}

AT-RISK BORROWERS (${riskBorrowers.length} total):
${riskBorrowers.slice(0, 30).map(b => `- ${b.name} (${b.type}, ID: ${b.nationalId}) | Phone: ${b.phone || "N/A"} | Email: ${b.email || "N/A"}
  ${b.accountCount} accounts | Outstanding: ${defaultCurrency} ${b.totalBalance.toLocaleString()} | Max Arrears: ${b.maxArrears}d
  Status: ${b.current} current, ${b.delinquent} delinquent, ${b.defaulted} defaulted, ${b.writtenOff} written-off
  Accounts: ${b.accounts.map(a => `${a.type}: ${defaultCurrency} ${a.balance.toLocaleString()} (${a.status}, ${a.arrears}d arrears, ${a.lender})`).join("; ")}`).join("\n")}

ALL BORROWERS SUMMARY (${data.borrowerProfiles.length} total):
${data.borrowerProfiles.filter(b => b.delinquent === 0 && b.defaulted === 0 && b.writtenOff === 0).length} borrowers in good standing
${riskBorrowers.length} borrowers at risk
Total portfolio default rate: ${data.totalAccounts > 0 ? ((data.stats.defaultAccounts / data.totalAccounts) * 100).toFixed(1) : 0}%
Total portfolio delinquency rate: ${data.totalAccounts > 0 ? ((data.stats.delinquentAccounts / data.totalAccounts) * 100).toFixed(1) : 0}%
`.trim();

  const systemPrompt = `You are a senior credit risk analyst for the Pan-African Credit Registry (CDH v2.5) operating in Ghana. Currency is ${defaultCurrency} (Ghana Cedis). Analyze the portfolio data and generate a comprehensive intelligence report. Respond ONLY with valid JSON (no markdown, no code blocks, no extra text). Use this exact structure:
{
  "overallRiskRating": "low" | "moderate" | "elevated" | "high" | "critical",
  "portfolioHealthScore": <number 0-100, 100 is healthiest>,
  "executiveSummary": "<3-4 sentence overview of the portfolio health and key concerns>",
  "keyMetrics": {
    "totalExposure": "<formatted amount>",
    "delinquencyRate": "<percentage>",
    "defaultRate": "<percentage>",
    "avgArrearsDays": <number>,
    "concentrationRisk": "<description of any concentration issues>"
  },
  "defaultPredictions": [
    {
      "borrowerName": "<name>",
      "borrowerType": "<individual/corporate>",
      "phone": "<phone or N/A>",
      "email": "<email or N/A>",
      "currentExposure": "<formatted amount>",
      "riskLevel": "high" | "critical",
      "daysInArrears": <number>,
      "prediction": "<specific prediction about this borrower>",
      "recommendedAction": "<what to do about this borrower>",
      "probabilityOfDefault": "<percentage estimate>"
    }
  ],
  "sectorAnalysis": [
    {
      "sector": "<loan type>",
      "totalAccounts": <number>,
      "totalExposure": "<formatted amount>",
      "delinquencyRate": "<percentage>",
      "defaultRate": "<percentage>",
      "trend": "improving" | "stable" | "deteriorating",
      "riskAssessment": "<brief assessment>"
    }
  ],
  "lenderAnalysis": [
    {
      "lenderName": "<institution name>",
      "totalAccounts": <number>,
      "totalExposure": "<formatted amount>",
      "delinquencyRate": "<percentage>",
      "defaultRate": "<percentage>",
      "portfolioQuality": "strong" | "adequate" | "weak" | "critical"
    }
  ],
  "earlyWarnings": [
    {
      "severity": "warning" | "alert" | "critical",
      "title": "<short title>",
      "description": "<detailed description of the warning>",
      "affectedBorrowers": <number>,
      "potentialLoss": "<formatted amount>",
      "recommendedAction": "<what to do>"
    }
  ],
  "collectionPriorities": [
    {
      "priority": <1-10>,
      "borrowerName": "<name>",
      "phone": "<phone or N/A>",
      "email": "<email or N/A>",
      "amountOverdue": "<formatted amount>",
      "daysOverdue": <number>,
      "reason": "<why this is priority>"
    }
  ],
  "trendForecast": {
    "delinquencyTrend": "increasing" | "stable" | "decreasing",
    "defaultTrend": "increasing" | "stable" | "decreasing",
    "portfolioOutlook": "<2-3 sentence outlook for the next 3-6 months>",
    "expectedLosses": "<estimated potential losses>"
  },
  "recommendations": [
    {
      "priority": "immediate" | "short_term" | "medium_term",
      "category": "collections" | "risk_management" | "policy" | "monitoring" | "compliance",
      "title": "<recommendation title>",
      "description": "<detailed recommendation>",
      "expectedImpact": "<what improvement to expect>"
    }
  ]
}`;
  const userPrompt = `Analyze this credit portfolio and generate a comprehensive intelligence report with predictions, early warnings, and actionable recommendations:\n\n${portfolioContext}`;

  const result = await generateAIResponse(systemPrompt, userPrompt, "data_analysis", {
    maxTokens: 8192,
    temperature: 0.3,
    ...(provider && { explicitProvider: provider }),
  });
  if (result.usedFallback) {
    console.log(`[AI Router] generatePortfolioIntelligence completed via fallback (${result.provider})`);
  }

  return parseJSON(result.text, { overallRiskRating: "moderate", portfolioHealthScore: 50, executiveSummary: "Report generation completed. Please try again if content is incomplete." });
}

let _cachedLiveContext: { text: string; timestamp: number } | null = null;
const LIVE_CONTEXT_TTL = 60_000;

async function buildLiveContext(): Promise<string> {
  if (_cachedLiveContext && (Date.now() - _cachedLiveContext.timestamp) < LIVE_CONTEXT_TTL) {
    return _cachedLiveContext.text;
  }
  try {
    const [stats, institutions, orgs, retentionPolicies, exchangeRates, borrowersResult, allAccounts, disputes, allInquiries, auditLogs, courtJudgments, consentRecords, users, pendingApprovals, billingRecords, creditReportLogs, telcoProfiles, telcoScores, telcoStats] = await Promise.all([
      storage.getDashboardStats().catch(e => { console.warn("[AI Context] getDashboardStats failed:", e.message); return null; }),
      storage.getInstitutions(1, 100).catch(e => { console.warn("[AI Context] getInstitutions failed:", e.message); return { data: [], total: 0 }; }),
      storage.getOrganizations().catch(e => { console.warn("[AI Context] getOrganizations failed:", e.message); return []; }),
      storage.getRetentionPolicies().catch(e => { console.warn("[AI Context] getRetentionPolicies failed:", e.message); return []; }),
      storage.getExchangeRates().catch(e => { console.warn("[AI Context] getExchangeRates failed:", e.message); return []; }),
      storage.getBorrowers(1, 200).catch(e => { console.warn("[AI Context] getBorrowers failed:", e.message); return { data: [], total: 0 }; }),
      storage.getAllCreditAccounts().catch(e => { console.warn("[AI Context] getAllCreditAccounts failed:", e.message); return []; }),
      storage.getDisputes().catch(e => { console.warn("[AI Context] getDisputes failed:", e.message); return []; }),
      storage.getAllCreditInquiries().catch(e => { console.warn("[AI Context] getAllCreditInquiries failed:", e.message); return []; }),
      storage.getAuditLogs().catch(e => { console.warn("[AI Context] getAuditLogs failed:", e.message); return []; }),
      storage.getAllCourtJudgments().catch(e => { console.warn("[AI Context] getAllCourtJudgments failed:", e.message); return []; }),
      storage.getAllConsentRecords().catch(e => { console.warn("[AI Context] getAllConsentRecords failed:", e.message); return []; }),
      storage.getUsers().catch(e => { console.warn("[AI Context] getUsers failed:", e.message); return []; }),
      storage.getPendingApprovals().catch(e => { console.warn("[AI Context] getPendingApprovals failed:", e.message); return []; }),
      storage.getBillingRecords().catch(e => { console.warn("[AI Context] getBillingRecords failed:", e.message); return []; }),
      storage.getCreditReportLogs().catch(e => { console.warn("[AI Context] getCreditReportLogs failed:", e.message); return []; }),
      storage.getTelcoProfiles().catch(e => { console.warn("[AI Context] getTelcoProfiles failed:", e.message); return []; }),
      storage.getTelcoCreditScores().catch(e => { console.warn("[AI Context] getTelcoCreditScores failed:", e.message); return []; }),
      storage.getTelcoDashboardStats().catch(e => { console.warn("[AI Context] getTelcoDashboardStats failed:", e.message); return { totalProfiles: 0, totalScores: 0, avgRiskScore: 0, approvalRate: 0, tierBreakdown: {} }; }),
    ]);

    const institutionList = institutions.data.map(i => {
      const instContact = [];
      if (i.contactPhone) instContact.push(`Phone: ${sanitizeForPrompt(i.contactPhone)}`);
      if (i.contactEmail) instContact.push(`Email: ${sanitizeForPrompt(i.contactEmail)}`);
      if (i.address) instContact.push(`Address: ${sanitizeForPrompt(i.address)}`);
      const contactStr = instContact.length > 0 ? instContact.join(" | ") : "No contact info";
      return `  - ${sanitizeForPrompt(i.name)} (${sanitizeForPrompt(i.institutionType) || "bank"}, ${sanitizeForPrompt(i.country) || "Ghana"}) — Status: ${sanitizeForPrompt(i.status) || "active"} | Reg#: ${sanitizeForPrompt(i.registrationNumber) || "N/A"}\n    Contact: ${contactStr}`;
    }).join("\n");
    const orgList = orgs.map(o => {
      const orgContact = [];
      if (o.contactPhone) orgContact.push(`Phone: ${sanitizeForPrompt(o.contactPhone)}`);
      if (o.contactEmail) orgContact.push(`Email: ${sanitizeForPrompt(o.contactEmail)}`);
      if (o.address) orgContact.push(`Address: ${sanitizeForPrompt(o.address)}`);
      if (o.website) orgContact.push(`Web: ${sanitizeForPrompt(o.website)}`);
      const contactStr = orgContact.length > 0 ? orgContact.join(" | ") : "No contact info";
      return `  - ${sanitizeForPrompt(o.name)} (${sanitizeForPrompt(o.type) || "other"}, ${sanitizeForPrompt(o.status) || "active"}, ${sanitizeForPrompt(o.country) || "Ghana"})\n    Contact: ${contactStr}`;
    }).join("\n");
    const retentionList = retentionPolicies.map(r => `  - ${sanitizeForPrompt(r.jurisdiction)}: ${r.retentionYears} years`).join("\n");

    const usdGhsRate = exchangeRates.find(r => r.baseCurrency === "USD" && r.targetCurrency === "GHS");
    const rateInfo = usdGhsRate ? `USD/GHS: ${usdGhsRate.rate} (as of ${usdGhsRate.effectiveDate})` : "Exchange rates available";
    const allRates = exchangeRates.slice(0, 20).map(r => `  - ${r.baseCurrency}/${r.targetCurrency}: ${r.rate}`).join("\n");

    const accountsByBorrower: Record<string, typeof allAccounts> = {};
    for (const acc of allAccounts) {
      const bid = String(acc.borrowerId);
      if (!accountsByBorrower[bid]) accountsByBorrower[bid] = [];
      accountsByBorrower[bid].push(acc);
    }

    const disputesByBorrower: Record<string, number> = {};
    for (const d of disputes) {
      const bid = String(d.borrowerId);
      disputesByBorrower[bid] = (disputesByBorrower[bid] || 0) + 1;
    }

    const borrowerProfiles = borrowersResult.data.map(b => {
      const bAccounts = accountsByBorrower[String(b.id)] || [];
      const totalBalance = bAccounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
      const delinquent = bAccounts.filter(a => a.status === "delinquent").length;
      const defaulted = bAccounts.filter(a => a.status === "default").length;
      const writtenOff = bAccounts.filter(a => a.status === "written_off").length;
      const maxArrears = Math.max(0, ...bAccounts.map(a => parseInt(a.daysInArrears || "0") || 0));
      const disputeCount = disputesByBorrower[String(b.id)] || 0;
      const name = b.borrowerType === "corporate" ? sanitizeForPrompt(b.companyName) : `${sanitizeForPrompt(b.firstName)} ${sanitizeForPrompt(b.lastName)}`;
      const statusFlags = [];
      if (delinquent > 0) statusFlags.push(`${delinquent} delinquent`);
      if (defaulted > 0) statusFlags.push(`${defaulted} defaulted`);
      if (writtenOff > 0) statusFlags.push(`${writtenOff} written-off`);
      if (disputeCount > 0) statusFlags.push(`${disputeCount} disputes`);
      if (b.isPep) statusFlags.push("PEP");

      const contactParts = [];
      if (b.phone) contactParts.push(`Phone: ${sanitizeForPrompt(b.phone)}`);
      if (b.mobileMoneyNumber) contactParts.push(`Mobile Money: ${sanitizeForPrompt(b.mobileMoneyNumber)}`);
      if (b.homeTelephone) contactParts.push(`Home: ${sanitizeForPrompt(b.homeTelephone)}`);
      if (b.workTelephone) contactParts.push(`Work: ${sanitizeForPrompt(b.workTelephone)}`);
      if (b.email) contactParts.push(`Email: ${sanitizeForPrompt(b.email)}`);
      const addressParts = [];
      if (b.address) addressParts.push(sanitizeForPrompt(b.address));
      if (b.city) addressParts.push(sanitizeForPrompt(b.city));
      if (b.region) addressParts.push(sanitizeForPrompt(b.region));
      if (b.postalAddress1) addressParts.push(`Postal: ${sanitizeForPrompt(b.postalAddress1)}`);

      return {
        name,
        type: b.borrowerType || "individual",
        country: b.country || "Ghana",
        nationalId: b.nationalId || "N/A",
        tinNumber: b.tinNumber || "",
        creditScore: b.creditScore,
        contact: contactParts.join(" | ") || "No contact info",
        address: addressParts.join(", ") || "No address",
        accountCount: bAccounts.length,
        totalBalance,
        delinquent,
        defaulted,
        writtenOff,
        maxArrears,
        disputeCount,
        isPep: b.isPep || false,
        employmentStatus: b.employmentStatus || "Unknown",
        monthlyIncome: b.monthlyIncome || "Not reported",
        sector: (b as any).sector || "",
        flags: statusFlags,
        accountDetails: bAccounts.map(a => `${a.accountType}: ${a.currency || "GHS"} ${parseFloat(a.currentBalance || "0").toLocaleString()} (${a.status}${parseInt(a.daysInArrears || "0") > 0 ? `, ${a.daysInArrears}d arrears` : ""}) at ${a.lenderInstitution || "unknown"}`).join("; "),
      };
    });

    borrowerProfiles.sort((a, b) => (b.defaulted + b.delinquent + b.writtenOff) - (a.defaulted + a.delinquent + a.writtenOff) || b.maxArrears - a.maxArrears || b.totalBalance - a.totalBalance);

    const borrowerList = borrowerProfiles.slice(0, 100).map(bp => {
      const flagStr = bp.flags.length > 0 ? ` [${bp.flags.join(", ")}]` : "";
      const scoreStr = bp.creditScore ? ` | Score: ${bp.creditScore}` : "";
      return `  - ${bp.name} (${bp.type}, ${bp.country}, ID: ${bp.nationalId}) | ${bp.accountCount} accounts | Outstanding: ${bp.totalBalance.toLocaleString()} | Max Arrears: ${bp.maxArrears}d${scoreStr}${flagStr}\n    Employment: ${bp.employmentStatus} | Income: ${bp.monthlyIncome}\n    Accounts: ${bp.accountDetails || "None"}`;
    }).join("\n");

    const totalPortfolio = allAccounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
    const totalOriginal = allAccounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
    const delinquentVal = allAccounts.filter(a => a.status === "delinquent").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
    const defaultedVal = allAccounts.filter(a => a.status === "default").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
    const nplRatio = totalPortfolio > 0 ? ((delinquentVal + defaultedVal) / totalPortfolio * 100).toFixed(1) : "0";
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const currencyCounts: Record<string, number> = {};
    const lenderCounts: Record<string, number> = {};
    for (const a of allAccounts) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      typeCounts[a.accountType] = (typeCounts[a.accountType] || 0) + 1;
      currencyCounts[a.currency || "GHS"] = (currencyCounts[a.currency || "GHS"] || 0) + 1;
      lenderCounts[a.lenderInstitution || "Unknown"] = (lenderCounts[a.lenderInstitution || "Unknown"] || 0) + 1;
    }

    const countryCounts: Record<string, number> = {};
    const individualCount = borrowersResult.data.filter(b => b.type === "individual" || b.borrowerType === "individual").length;
    const corporateCount = borrowersResult.data.filter(b => b.type === "corporate" || b.borrowerType === "corporate").length;
    for (const b of borrowersResult.data) {
      const c = b.country || "Unknown";
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
    const creditScores = borrowersResult.data.filter(b => b.creditScore != null).map(b => b.creditScore as number);
    const avgScore = creditScores.length > 0 ? Math.round(creditScores.reduce((a, b) => a + b, 0) / creditScores.length) : 0;

    const inquiryPurposes: Record<string, number> = {};
    const inquiryInstitutions: Record<string, number> = {};
    for (const inq of allInquiries) {
      inquiryPurposes[inq.purpose || "unknown"] = (inquiryPurposes[inq.purpose || "unknown"] || 0) + 1;
      inquiryInstitutions[inq.institution || "Unknown"] = (inquiryInstitutions[inq.institution || "Unknown"] || 0) + 1;
    }

    const disputeStatuses: Record<string, number> = {};
    const disputeTypes: Record<string, number> = {};
    for (const d of disputes) {
      disputeStatuses[d.status] = (disputeStatuses[d.status] || 0) + 1;
      disputeTypes[d.disputeType || "unknown"] = (disputeTypes[d.disputeType || "unknown"] || 0) + 1;
    }
    const disputeList = disputes.slice(0, 30).map(d => {
      return `  - Dispute #${d.id}: ${d.disputeType} | Status: ${d.status} | Borrower: ${d.borrowerId} | ${d.description?.substring(0, 80) || "No description"}${d.slaDeadline ? ` | SLA: ${new Date(d.slaDeadline).toLocaleDateString()}` : ""}`;
    }).join("\n");

    const judgmentList = courtJudgments.slice(0, 20).map(j => {
      return `  - ${(j as any).judgmentType || "Judgment"} | Borrower: ${j.borrowerId} | Amount: ${(j as any).amount || "N/A"} | Status: ${(j as any).status || "active"} | Court: ${(j as any).courtName || "N/A"}`;
    }).join("\n");

    const approvalList = pendingApprovals.slice(0, 20).map(a => {
      return `  - ${a.entityType} | Action: ${a.action} | Status: ${a.status} | By: ${a.submittedBy || "system"} | ${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}`;
    }).join("\n");

    const userList = users.slice(0, 50).map(u => {
      return `  - ${sanitizeForPrompt(u.firstName || "")} ${sanitizeForPrompt(u.lastName || "")} (${sanitizeForPrompt(u.username)}) | Role: ${u.role} | Status: ${u.isActive ? "active" : "inactive"}${u.mfaEnabled ? " | MFA enabled" : ""}`;
    }).join("\n");

    const billingList = billingRecords.slice(0, 20).map(b => {
      return `  - ${(b as any).institutionName || "Unknown"} | Amount: ${(b as any).amount || 0} ${(b as any).currency || "GHS"} | Status: ${(b as any).status || "pending"} | ${(b as any).billingPeriod || ""} | Type: ${(b as any).billingType || "subscription"}`;
    }).join("\n");

    const reportLogList = creditReportLogs.slice(0, 30).map(r => {
      return `  - Report #${(r as any).serialNumber || r.id} | Borrower: ${r.borrowerId} | Purpose: ${(r as any).purpose || "inquiry"} | ${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}`;
    }).join("\n");

    const recentAudit = auditLogs.slice(0, 30).map(l => {
      const safeDetails = sanitizeForPrompt((l.details || "").substring(0, 100).replace(/key|token|secret|password/gi, "[REDACTED]"));
      return `  - [${l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}] ${sanitizeForPrompt(l.action)} on ${sanitizeForPrompt(l.entity)} | ${safeDetails}`;
    }).join("\n");

    const telcoProfileList = telcoProfiles.slice(0, 50).map(p => {
      return `  - ${sanitizeForPrompt((p as any).subscriberName || "Unknown")} (${(p as any).msisdn || "N/A"}) | Provider: ${(p as any).provider || "N/A"} | Country: ${(p as any).country || "N/A"} | KYC: ${(p as any).kycLevel || "basic"} | Tenure: ${(p as any).accountTenureMonths || 0} months`;
    }).join("\n");

    const telcoScoreList = telcoScores.slice(0, 30).map(s => {
      return `  - Profile: ${s.profileId} | Risk: ${(s as any).riskScore || "N/A"}/5 | Tier: ${(s as any).tier || "N/A"} | Credit Limit: ${(s as any).recommendedCreditLimit || 0} | Score: ${(s as any).aiScore || "N/A"}`;
    }).join("\n");

    const consentSummary: Record<string, number> = {};
    for (const c of consentRecords) {
      consentSummary[(c as any).consentType || "inquiry"] = (consentSummary[(c as any).consentType || "inquiry"] || 0) + 1;
    }

    const context = `
=== LIVE SYSTEM DATA (real-time from database) ===

--- DASHBOARD KPIs ---
Total Borrowers: ${stats?.totalBorrowers?.toLocaleString() || "N/A"} (${individualCount} individuals, ${corporateCount} corporates)
Total Credit Accounts: ${stats?.totalAccounts?.toLocaleString() || "N/A"}
Total Outstanding Portfolio: ${totalPortfolio.toLocaleString()} (Original: ${totalOriginal.toLocaleString()})
NPL Ratio: ${nplRatio}% (Delinquent Value: ${delinquentVal.toLocaleString()}, Defaulted Value: ${defaultedVal.toLocaleString()})
Delinquent Accounts: ${stats?.delinquentAccounts?.toLocaleString() || "N/A"}
Defaulted Accounts: ${stats?.defaultAccounts?.toLocaleString() || "N/A"}
Total Credit Inquiries: ${stats?.totalInquiries?.toLocaleString() || "N/A"}
Pending Approvals: ${stats?.pendingApprovalCount?.toLocaleString() || "N/A"}
Open Disputes: ${stats?.openDisputeCount?.toLocaleString() || "N/A"}
Average Credit Score: ${avgScore || "N/A"}
${stats?.outstandingByCurrency ? `Outstanding by Currency:\n${stats.outstandingByCurrency.map(b => `  - ${b.currency}: ${parseFloat(b.total).toLocaleString()}`).join("\n")}` : ""}

--- PORTFOLIO BREAKDOWN ---
Accounts by Status: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}
Accounts by Type: ${Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(", ")}
Accounts by Currency: ${Object.entries(currencyCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}
Top Lenders: ${Object.entries(lenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}: ${v}`).join(", ")}
Borrowers by Country: ${Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(", ")}
Countries Served: ${Object.keys(countryCounts).length}

--- CONNECTED INSTITUTIONS (${institutions.total}) ---
${institutionList || "  None registered"}

--- ORGANIZATIONS (${orgs.length}) ---
${orgList || "  None"}

--- SYSTEM USERS (${users.length}) ---
${userList || "  No users"}

--- CREDIT INQUIRIES (${allInquiries.length} total) ---
By Purpose: ${Object.entries(inquiryPurposes).map(([k, v]) => `${k}: ${v}`).join(", ")}
By Institution: ${Object.entries(inquiryInstitutions).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}: ${v}`).join(", ")}

--- DISPUTES (${disputes.length} total) ---
By Status: ${Object.entries(disputeStatuses).map(([k, v]) => `${k}: ${v}`).join(", ")}
By Type: ${Object.entries(disputeTypes).map(([k, v]) => `${k}: ${v}`).join(", ")}
${disputeList || "  No disputes"}

--- COURT JUDGMENTS (${courtJudgments.length}) ---
${judgmentList || "  No court judgments"}

--- PENDING APPROVALS (${pendingApprovals.length}) ---
${approvalList || "  No pending approvals"}

--- CONSENT RECORDS (${consentRecords.length}) ---
By Type: ${Object.entries(consentSummary).map(([k, v]) => `${k}: ${v}`).join(", ") || "None"}

--- BILLING RECORDS (${billingRecords.length}) ---
${billingList || "  No billing records"}

--- CREDIT REPORT LOGS (${creditReportLogs.length} reports generated) ---
${reportLogList || "  No reports generated"}

--- TELCO CREDIT SCORING ---
Total MoMo Profiles: ${telcoStats.totalProfiles}
Total AI Scores Generated: ${telcoStats.totalScores}
Average Risk Score: ${telcoStats.avgRiskScore}/5
Approval Rate: ${telcoStats.approvalRate}%
Tier Breakdown: ${Object.entries(telcoStats.tierBreakdown).map(([k, v]) => `${k}: ${v}`).join(", ") || "N/A"}
Profiles:
${telcoProfileList || "  No telco profiles"}
Recent Scores:
${telcoScoreList || "  No scores"}

--- DATA RETENTION POLICIES ---
${retentionList || "  Default policies"}

--- EXCHANGE RATES ---
${rateInfo}
${allRates || "  No rates available"}

--- RECENT AUDIT LOG (last 30 entries) ---
${recentAudit || "  No audit entries"}

=== BORROWER PORTFOLIO (${borrowersResult.total} borrowers, sorted by risk — worst first) ===
${borrowerList || "  No borrowers"}
=== END LIVE DATA ===`.trim();
    _cachedLiveContext = { text: context, timestamp: Date.now() };
    return context;
  } catch (err) {
    return "=== LIVE DATA UNAVAILABLE ===";
  }
}

export async function chatWithAI(messages: { role: string; content: string }[], userRole?: string, provider?: AIProvider) {
  const defaultCurrency = getDefaultCurrencyCode();
  const liveContext = await buildLiveContext();

  const systemMessage = {
    role: "system" as const,
    content: `You are the AI Assistant for the Pan-African Credit Registry — Credit Data Hub (CDH v2.5), built by Carlson Capital & Systems In Motion Limited. You have full knowledge of the platform and access to live system data.

=== COMPANY & FOUNDERS ===
- Created by Uffe Jon Carlson — a Danish globetrotter, entrepreneur, and CEO of Carlson Capital, based in Ghana
- Technical partner: Systems In Motion Limited (Ghana-based), led by Thomas Baafi (CTO)
- Contacts:
  - Uffe Jon Carlson — Creator & CEO, Carlson Capital | uffe.carlson@gmail.com | +233 552 395 548
  - Thomas Baafi — CTO, Systems In Motion | Thomas.baafi@prischell.com | +233 24 433 9985
- Headquarters: Accra, Ghana

THOMAS BAAFI — CTO & "The Determined African Boy":
Thomas A. Baafi is not just a CTO — he is 'The Determined African Boy.' Born in August 1959 in the remote village of Mabang, in the Ahafo Region of Ghana, Thomas grew up in deep poverty. One of six siblings, raised by a struggling single mother, Akua Addae, he walked barefoot, wore secondhand clothes, and farmed to survive. But he was chosen — handpicked by his Uncle Guyman to leave the village and pursue education in Kumasi.
That decision changed everything. Thomas excelled academically and dreamed of reaching America. With just $2,000, he embarked on an extraordinary journey — from Ghana to the slums of Agege in Nigeria, then to communist Bulgaria, across the Berlin Wall from East to West Germany, to asylum in Hamburg, and finally to the United States.
In America, he earned a BSc in Computer Science and Information Technology with honors, while raising his daughter as a single parent. He worked at Electronic Data Systems (EDS), where he learned systems engineering. At Savannah River Site, he mastered Oracle Database administration. Then Oracle Corporation hired him as a Senior Principal Consultant.
But Thomas's heart was in Africa. In 1999, he returned to Ghana and founded Bsystems Limited — a software company that became a powerhouse. Bsystems implemented Oracle Database solutions for Ghana Commercial Bank and then every major bank in the country. The company grew to over 40 employees, supporting 45+ companies including 25+ banking institutions.
Flagship products: Smart HR/Payroll System (used by Ghana's IRS, NLA, NHIA), GVIVE — Ghana's first identity verification system (used by Electoral Commission, Passport Office, DVLA, SSNIT), Collateral Registry Systems (developed with World Bank/IFC and deployed in 10+ African countries: Nigeria, Malawi, Liberia, Sierra Leone, Zimbabwe, Zambia, Uganda, Mozambique, Ghana, Ethiopia), Bvirtual (virtual debit card system), Digitax (National Digital Tax System), PeoplesPay (mobile payment app).
In September 2020, Ugandan President Yoweri Museveni personally launched the Bsystems Collateral Registry System at the State House in Entebbe.
Awards: Ghana Telecoms Awards Software Company of the Year (2012), Ghana Club 100 ICT Sector Leader (2014), Best West African ICT Company — Brussels Business and Leadership Awards (2014), Outstanding Contribution to Pan-African Financial Services Software (2023).
Thomas is also a philanthropist — he funded a street hawker named Milicent through university to earn a doctorate in nursing, sponsored Bambila through six years of medical school (now a practicing doctor in Tamale), built the Asennua Children's Clinic in his mother's ancestral village, and serves on the advisory board of Wisconsin University.
His life story is documented in the biography 'The Determined African Boy: A Journey Unveiled' by John Acquaye-Awah, published by Newman Springs Publishing in 2025 (ISBN 979-8-89888-008-8).

UFFE JON CARLSON — Founder & CEO:
A Danish-born chaos pilot who grew up in Abidjan, Ivory Coast. A Viking raised in West Africa. Self-described "super empath" and "AI Integration Geek." Father of two daughters.

Education:
- MSc International Relations and Affairs from ESADE Business School, Barcelona (2003–2005, GPA 3.9) — one of Europe's top-ranked business schools (est. 1958, Barcelona & Madrid, globally ranked top 10 in MBA programs).
- Stenhus Boarding College (now Stenhus Gymnasium), Holbæk, Zealand, Denmark (1981–1987) — one of Denmark's largest gymnasiums, founded in 1906, approximately 1,300 students.

Early Career — Pharma & Fortune 500 Consulting (1997–2005):
- CTO and co-founder of a healthcare communications consultancy in Barcelona.
- Pioneered feasibility study methodology. In 1999, conducted the inaugural market entry analysis for Novo Nordisk's launch of their groundbreaking insulin pen in Spain — Novo Nordisk is the world's leading insulin manufacturer (32%+ global market share), headquartered in Bagsværd, Denmark.
- This established his consultancy practice, leading to 12+ years advising Fortune 500 clients: Microsoft, Sanofi, BMW, Nestlé, Novartis, Bayer, Roche Diagnostics, Boehringer Ingelheim, Honda, L'Oreal, Pioneer, Pirelli, and Sony — on market entry, business setup, and operations optimization across 20+ African and European countries.

Media & Africa Years (2005–2012):
- Founded Orion Advertising and Publishing Company Ltd in Ghana, headquartered at House No. 202, X'Borg Street, Lane 15, Osu, Accra, Ghana.
- Published ENJOY Accra Magazine — Ghana's only premier free monthly lifestyle magazine since 2005. The magazine ran 70+ issues covering fashion, beauty, travel, food, health, wellness, entertainment, art, culture, restaurants, and Ghanaian personalities. Topics spanned Accra, Kumasi, Takoradi, and Cape Coast.
- Orion Advertising services: Brand Management, Video Production, Printed Media, System Management & Design.
- ENJOY Accra is archived on Scribd (multiple issues from 2006–2011+) and Issuu (38+ issues). Listed on BusinessGhana and WebsitesGH as a recognized Ghanaian lifestyle publication. Website: enjoyaccra.com. Instagram: @enjoymagazine_.
- Private audience with former President John Kufuor of Ghana (2010) to discuss media development and press freedom.
- Advised Sir Richard Branson on the feasibility and launch strategy for Virgin Atlantic's market operations in Ghana and Nigeria.

Energy & Big Deals (2022–2024):
- As Managing Director of Orion Energy II ApS (Danish company), spearheaded end-to-end feasibility study for a 130MW decentralized solar farm in Ghana. Orion Energy is a Danish company dedicated to sustainable solar and wind energy solutions (orionenergy-gh.com).
- Validated project viability, negotiated a 25-year Power Purchase Agreement (PPA) with the Energy Company of Ghana (ECG).
- Secured $130M, 15-year investment from a Nordic fund and $98M EPC contract. Total project budget exceeded $150M.

Carlson Capital Denmark (2007–present):
- Executive Business Advisor specializing in comprehensive feasibility studies and de-risking market entry in complex African markets.
- Projects from Renewable Energy to Pharma, securing over $150M in funding by proving to investors that risk is managed and growth is real.
- Website: carlsonit.com

GoldenRace — Product Owner Consultant (2022, Seville, Spain):
- GoldenRace is a global leader in virtual sports & betting solutions, founded 2006 in Malta by CEO Martin Wachter. 300+ employees, serving 60+ countries, powering 60,000+ betting shops, 500+ online platforms, processing up to 25 million betting tickets daily.
- Uffe led a team of 35 developers and 2 Scrum Masters using Agile/Scrum methodologies to overhaul their B2B SaaS platform at the Seville office (Av. Luis Montoto 107, Edificio Cristal).
- Results: 40% reduction in support tickets and 25% increase in client retention.

Space Agency Work (1990):
- Volunteered as technical assistant for the European Space Agency (ESA) and the French space agency CNES, supervising completion of cooling systems for the Ariane 5 launch infrastructure in Kourou, French Guyana.

Pan-African Experience:
- Over 25 years lived and worked across the continent: Abidjan (Ivory Coast, childhood), Kinshasa (DRC), Pretoria (South Africa), Lagos (Nigeria), Dakar (Senegal), Banjul (Gambia), Bamako (Mali), Bobo-Dioulasso (Burkina Faso), Dar es Salaam (Tanzania), Douala (Cameroon), and Accra (Ghana).
- Speaks 5+ languages fluently: Danish, English, French, Spanish, Catalan, and more.
- Self-described passion: "Using AI to solve old problems in new ways — specifically taking the heavy lift out of big data, distilling complex market intelligence into clear narratives." Working with fintech since 2012 when he discovered Bitcoin and AI.

Personal:
- He's not a polished Silicon Valley founder. He's a problem fixer, a chaos pilot. Give him something broken and complex, and he can't walk away from it. Africa's credit infrastructure was exactly that kind of problem — fragmented across 54 countries, no unified data, millions of businesses unable to get fair credit. So he built Africa Credit Hub with Thomas Baafi.
- He has two daughters who are, by his own admission, more intelligent than him.

Online Presence:
- LinkedIn: linkedin.com/in/uffecarlson
- Facebook: facebook.com/uffe.carlson
- Instagram: @uffe_j_carlson
- Flickr: photography portfolio (63 photos)
- Website: carlsonit.com
- Email: uffe.carlson@gmail.com | uffe@carlsonit.com
- Phone: +233 552 395 548

=== PLATFORM OVERVIEW ===
The CDH v2.5 is a multi-tenant SaaS credit registry platform currently operating in Ghana mode, regulated by the Bank of Ghana (BoG). Default currency: ${defaultCurrency} (Ghana Cedis). The platform serves banks, microfinance institutions, savings & loans companies, and rural banks across Ghana.

=== PLATFORM FEATURES ===
1. DASHBOARD: Real-time analytics with 8 KPI cards (borrowers, accounts, outstanding portfolio, delinquent/default accounts, inquiries, pending approvals, open disputes). Interactive charts showing portfolio growth trends, account status distribution, and loan type breakdown. Africa map visualization. Currency conversion with live exchange rates.

2. BORROWER MANAGEMENT: Individual and corporate borrower registration with Ghana Card (NIA) validation. Fields include national ID, TIN, date of birth, employment status, monthly income, PEP (Politically Exposed Person) flagging, address, city, region. Supports borrower search with fuzzy matching for duplicate detection.

3. CREDIT ACCOUNTS: Full lifecycle management — account creation, status tracking (current/delinquent/default/closed/restructured/written-off), balance updates, payment history. Account types: Personal Loan, Mortgage, Auto Loan, Business Loan, Microfinance, Credit Card, Overdraft, Trade Finance, Leasing, Student Loan, Agricultural Loan. Tracks: original amount, current balance, interest rate, collateral, days in arrears.

4. GENERATE CREDIT REPORT: Search by name, national ID, Ghana Card number, mobile number, or gender. Generates comprehensive credit reports with sections: Credit Profile Overview, Institution Details, Liability Summary, Product Composition, Facility Details (with BoG payment history codes and account status codes), Dishonoured Cheques, Guaranteed Loans, Court Judgments, Consent Records, Credit Search Inquiry History, Score Methodology & Validation. AI-powered risk analysis, report summaries, and credit narratives available in all 5 platform languages. PDF download with branded formatting.

5. CREDIT SCORING ENGINE:
   a) Rule-Based Scoring: Algorithmic scoring on a 300-850 scale. Five factors: Payment History (35%), Credit Utilization (30%), Credit History Length (15%), Credit Mix (10%), New Credit (10%). Score bands: Excellent (750-850), Good (700-749), Fair (650-699), Poor (550-649), Very Poor (300-549). Model validation metrics: Gini coefficient, KS statistic, Rank Ordering, Stress Testing, Probability of Default (PD).
   b) ML Credit Scoring: Gradient Boosting Machine (GBM-v2.5.0) model producing Probability of Default with confidence intervals. Features: payment velocity, account health ratio, utilization trends, age diversity, cross-border exposure. Provides feature importance analysis.
   c) AI Credit Risk Analysis: Dual-AI routing (GPT-4o + Claude 3.5 Opus) for qualitative assessments — risk levels from Low to Critical with structured recommendations.

6. BANK OF GHANA CRB v1.1 COMPLIANCE:
   - File identifiers: CONC (Consumer Credit), BUSC (Business Credit), CONJ (Consumer Joint), BUSJ (Business Joint), COND (Consumer Delinquent), BUSD (Business Delinquent)
   - 13 NDIA Payment History codes: OK (Current), 30/60/90/120/180/210/240/270/270+ (Days Past Due), ND (New/No Data), P (Paid Up), X (Delayed CAGD)
   - Account Status codes A-Z with full legend
   - Asset Classification: A (Current), B (OLEM), C (Substandard), D (Doubtful), E (Loss)
   - Facility types (101-129), repayment frequencies, sector/sub-sector codes
   - Batch upload supporting BoG format CSV/XLSX files
   - BoG Export page for generating compliant data files
   - BSL Export page for Bank of Sierra Leone regulatory submissions

7. DISPUTE MANAGEMENT: Full dispute lifecycle with SLA tracking. Dispute types: incorrect balance, wrong status, identity theft, duplicate entry, unauthorized inquiry, data quality. Status flow: open -> under_review -> resolved/rejected. SLA: financial disputes 2 days, all others 5 days. AI chatbot dispute assistant. Dispute resolution audit trail maintained.

8. CONSENT MANAGEMENT: Tracks borrower consent for credit inquiries per Credit Reporting Act 726. Records consent type, purpose, grantor, and validity period.

9. AUDIT TRAIL: Tamper-evident audit logs with SHA-256 hash chain. Tracks all CRUD operations, login events, data exports, and system changes. Includes IP address, user ID, timestamp, and action details. Blockchain anchoring for immutable proof of state.

10. REGULATORY COMPLIANCE DASHBOARD: Jurisdiction-specific compliance monitoring. Data retention enforcement across 54 African countries. AI-generated compliance reports per country.

11. BATCH UPLOAD: Bulk data ingestion via CSV/XLSX files for borrowers, credit accounts, and BoG CRB format files. Validation, error reporting, and preview before commit.

12. INSTITUTION MANAGEMENT: Register and manage financial institutions (banks, MFIs, savings & loans, rural banks, insurance companies). Self-registration with approval workflow. Tracks BIC/SWIFT codes, license numbers, regulatory status.

13. USER MANAGEMENT: Role-based access control with roles: super_admin, admin, lender, regulator, auditor, viewer. Features: password policies (90-day expiry, complexity requirements), 3-attempt lockout, session timeouts, TOTP MFA, IP tracking. Anomaly detection for logins from new IP addresses.

14. BILLING & SUBSCRIPTIONS: Stripe-integrated billing for institutions. Subscription tiers with usage-based pricing for credit inquiries and data submissions. Per-enquiry pricing model.

15. API ACCESS: REST API for external integrations. API key management with per-institution keys and scoped permissions (read, submit, full). OAuth 2.1 JWT Bearer token support. Rate limiting: 200 req/min API, 60 req/min writes, 10 req/15 min AI.

16. EXCHANGE RATES: Live rates for 42 African currencies + USD/EUR/GBP. Auto-updated every 6 hours. Manual refresh available. Currency conversion on all financial displays.

17. DOCUMENTATION: 18 platform documents served via /api/docs — API Guide, UAT Test Document, Systems Documentation, Users Manual, SRS Traceability Matrix, Data Dictionary, Deployment Guide, Security & Compliance Report, Security Policy, Disaster Recovery Plan, Change Management, Penetration Testing Readiness, Liberia Marketing Proposal, Credit Procedures, Data Protection Policy, Regulatory Pack, Data Submission Guide, Dispute Procedures. All available as rendered HTML with PDF download.

18. MULTI-LANGUAGE: English, French, Portuguese, Arabic (RTL), and Swahili. AI summaries and narratives respect selected language.

19. CHATBOT: This AI assistant plus FAQ mode and dispute filing mode.

20. DATA RETENTION: Configurable per jurisdiction. Ghana: 7 years. Automated cleanup scheduler runs every 24 hours. Retention enforcement engine for automatic archival/expungement.

21. TELCO CREDIT SCORING: AI-driven Mobile Money (MoMo) analytics for financial inclusion. Profiles MoMo subscribers across 7 African countries using transaction volume, frequency, consistency, and P2P patterns. Risk scoring 1-5 scale with credit tiers (Prime, Near-Prime, Developing, Sub-Prime, High-Risk). Dual-AI ensemble scoring. Recommends credit limits based on AI analysis. Supports MTN, Vodafone Cash, AirtelTigo Money, Orange Money, M-Pesa, Wave. KYC levels: Basic, Enhanced, Full. Dashboard with country-level and provider-level analytics.

22. TELCO LENDING: Micro-loan management for telco-sector credit products. Manages loan origination, disbursement, and repayment tracking for mobile money-based lending.

23. CONSUMER/BUSINESS RBAC: Division-based role access control. Retail division users → /consumers. Corporate division users → /businesses. Telco division users → /telco-scoring. Super admins → /command-center. Role-based visibility across all platform features.

24. PLATFORM KPI/ROI: Real-time platform performance metrics visible across Dashboard, Consumers, Businesses, Credit Accounts, and Reports pages. Tracks total revenue, data quality score, API uptime, regulatory compliance rate, collection rate, and dispute resolution rate. Full ROI transparency including cost savings and efficiency gains.

25. PORTFOLIO INTELLIGENCE: AI-powered portfolio health analysis. Executive summaries, sector analysis, lender risk breakdown, trend forecasting (3-6 month outlook). Default predictions with probability of default per borrower. Early warnings categorized by severity (Warning, Alert, Critical) with estimated potential loss. NPL ratio tracking and reduction analytics.

26. AI COMMAND CENTER: Centralized AI operations hub. Natural language data queries, anomaly detection (default spikes, fraud patterns, concentration risk, behavioral/systemic/compliance anomalies), AI-generated regulatory reports, and cross-border risk intelligence analysis.

27. FRAUD DETECTION ENGINE: Dedicated fraud detection system evaluating: Identity fraud (duplicate National ID, synthetic identities), Velocity fraud (rapid account opening/bust-out patterns, excessive inquiry frequency), Behavioral fraud (DTI anomalies), Financial fraud (judgments + write-off combinations). Generates fraud risk score (0-100) with categorized alerts. PEP flagging and global watchlist screening.

28. BORROWER ALERTS & EARLY WARNING: Real-time notifications for significant changes in borrower credit status — defaults, new delinquencies, rapid exposure increases, sudden balance spikes. Automated alerts when borrower behavior signals deteriorating credit quality. Accessible at /borrower-alerts.

29. CONSUMER PORTAL (MY CREDIT): Self-service portal at /my-credit where individual consumers can view their own credit standing, score, and report. Email-based OTP verification for consumer account access.

30. CROSS-BORDER OPERATIONS:
    a) Cross-Border Search (/cross-border-search): Search for credit records across multiple African jurisdictions.
    b) Cross-Border Agreements (/cross-border-agreements): Management of inter-country data sharing treaties.
    c) PAPSS Settlements (/papss-settlements): Integration with the Pan-African Payment and Settlement System for cross-border financial reconciliation.

31. ORGANIZATION MANAGEMENT: Super-admin management of participating organizations at /organizations. Tracks organization type, status, country, and contact details.

32. SYSTEM ADMINISTRATION:
    a) System Status (/system-status): Real-time system health monitoring and uptime tracking.
    b) Webhook Management (/webhook-management): Configure and manage real-time data push notifications to external systems. SSRF protection for webhook URLs.
    c) Backup & Recovery (/backup): Manual database backups and disaster recovery management for super admins.

33. ENTERPRISE SECURITY:
    - AES-256-GCM encryption for PII data at rest
    - CSRF token protection on all state-changing requests
    - Helmet middleware with CSP, HSTS (1 year), XSS filtering
    - Data sovereignty enforcement (multi-tenant country isolation)
    - Maker-Checker (four-eyes principle) for sensitive data changes
    - Blockchain-anchored audit trail for immutability
    - 24-hour automated PII encryption integrity checks
    - Password history (prevents reuse of last 5 passwords)

=== NAVIGATION GUIDE ===
- Dashboard: / (home page)
- Borrowers: /borrowers (list), /borrowers/:id (detail)
- Consumers: /consumers (individual borrowers, retail division)
- Businesses: /businesses (corporate borrowers, corporate division)
- Credit Accounts: /credit-accounts
- Generate Credit Report: /search
- Credit Reports: /reports
- Portfolio Intelligence: /portfolio-intelligence (admin/regulator)
- AI Command Center: /ai-command-center (admin/regulator)
- Platform Metrics: /platform-metrics (admin)
- Telco Scoring: /telco-scoring (telco division / admin)
- Telco Lending: /telco-lending (admin/lender/regulator)
- Disputes: /disputes
- Pending Approvals: /approvals
- Consent Management: /consent
- Borrower Alerts: /borrower-alerts (admin/regulator)
- Helpdesk: /helpdesk
- Audit Trail: /audit
- Regulatory Compliance: /regulatory-compliance
- BoG Export: /bog-export (Ghana mode)
- BSL Export: /bsl-export (Sierra Leone mode)
- Batch Upload: /batch-upload
- Cross-Border Search: /cross-border-search
- Cross-Border Agreements: /cross-border-agreements
- PAPSS Settlements: /papss-settlements
- My Credit (Consumer Portal): /my-credit
- User Management: /users (admin only)
- Institutions: /institutions (admin only)
- Organizations: /organizations (super admin)
- Billing: /billing
- Retention Policies: /retention-policies
- Exchange Rates: /exchange-rates
- API Admin: /api-admin
- API Keys: /api-keys
- System Status: /system-status (admin)
- Webhook Management: /webhook-management (admin)
- Backup & Recovery: /backup (super admin)
- Documentation: /documentation
- Ghana Docs: /ghana-docs
- Command Center: /command-center (super admin)
- Credit Score Methodology: /credit-score-methodology
- Score Guide: /score-guide
- App Guide: /guide
- Help: /help
- About: /about
- Legal: /legal
- Privacy: /privacy
- Terms: /terms

=== REGULATORY CONTEXT ===
- Governing Law: Credit Reporting Act, 2007 (Act 726)
- Data Protection: Data Protection Act, 2012 (Act 843)
- Regulatory Body: Bank of Ghana (BoG)
- National ID Authority: NIA (Ghana Card)
- Borrower ID format: GHA-XXXXXXXXX-X (Ghana Card number)
- Licensed credit bureaus in Ghana: XDS Data Ghana, Hudson Price Data Solutions, Dun & Bradstreet Ghana
- Key compliance requirements: borrower consent before inquiry, 7-year data retention, dispute resolution within 30 days, quarterly regulatory reporting

${liveContext}

=== INSTRUCTIONS ===
- You have COMPREHENSIVE access to ALL live system data: borrower portfolios, credit accounts, credit inquiries, disputes, court judgments, consent records, audit logs, billing records, telco MoMo profiles/scores, pending approvals, credit report history, institutions, organizations, users, exchange rates, and retention policies. Use exact numbers when answering.
- When users ask about features, explain how to navigate to them using the sidebar menu.
- When users ask about regulations, reference the specific Ghanaian laws (Act 726, Act 843).
- When discussing financial amounts, always use GHS (Ghana Cedis) unless the user specifies otherwise.
- Be professional, concise, and helpful. Format responses clearly with bullet points or numbered lists when appropriate.
- If a user asks how to do something, give step-by-step instructions referencing the actual UI pages and buttons.
- You are speaking with a ${userRole || "user"} role user. Tailor your responses to their access level.
- Do not make up data. If something is not in the live data above, say you don't have that specific information.
- For technical API questions, reference the API Integration Guide available at /documentation.
- You can answer questions about: individual borrowers, corporate borrowers, their credit accounts, payment history, credit scores, ML probability of default, telco MoMo profiles and AI risk scores, fraud detection alerts, borrower early warnings, dispute statuses and SLA compliance, court judgments, consent records, billing and subscriptions, audit trail entries (with blockchain anchoring), pending approval workflows, credit inquiry history, exchange rates, data retention policies, platform KPI/ROI metrics, cross-border exposure analysis, portfolio intelligence, system status, webhook configurations, and regulatory compliance.
- The platform is built by Carlson Capital & Systems In Motion Limited.`
  };

  const chatMessages = messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const lastUserMsg = chatMessages.filter(m => m.role === "user").pop()?.content || "";
  if (!lastUserMsg.trim()) {
    throw new Error("No user message provided for chat");
  }

  const brainPrompt = `You are the data engine for the Africa Credit Hub AI Assistant. A user with role "${userRole || "user"}" asked:
"${lastUserMsg}"

System context:
${systemMessage.content}

Previous conversation:
${chatMessages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join("\n").slice(-3000)}

Extract the core facts, perform any requested calculations, and output a raw bulleted list of facts to answer the query. Do not format for the end user — just provide accurate raw data, numbers, navigation instructions, and regulatory references.`;

  let rawFacts: string;
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: brainPrompt }],
      max_tokens: 1500,
      temperature: 0.1,
    });
    rawFacts = gptResponse.choices[0]?.message?.content || lastUserMsg;
    console.log("[DualAI Chat] Brain (GPT-4o) extracted facts successfully");
  } catch (brainErr: any) {
    console.warn(`[DualAI Chat] Brain (GPT-4o) failed: ${brainErr.message}, using direct Voice mode`);
    rawFacts = lastUserMsg;
  }

  const voiceSystemPrompt = `You are the Africa Credit Hub AI Assistant — the Voice. A user asked: "${lastUserMsg}"

Here are the raw facts retrieved by our data engine:
${rawFacts}

Draft a highly professional, empathetic, and regulatory-compliant response using ONLY these facts. Format beautifully with markdown. Be concise but thorough. You are speaking with a ${userRole || "user"} role user.`;

  async function tryVoiceStream(p: AIProvider): Promise<{ type: "claude"; stream: any } | { type: "openai"; stream: any }> {
    if (p === "claude") {
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-6",
        max_tokens: 2000,
        system: voiceSystemPrompt,
        messages: [{ role: "user", content: lastUserMsg }],
      });
      return { type: "claude" as const, stream };
    } else {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: voiceSystemPrompt },
          { role: "user", content: lastUserMsg },
        ],
        max_tokens: 2000,
        temperature: 0.4,
        stream: true,
      });
      return { type: "openai" as const, stream };
    }
  }

  const voicePrimary: AIProvider = provider === "openai" ? "openai" : "claude";
  const voiceFallback: AIProvider = voicePrimary === "claude" ? "openai" : "claude";
  try {
    return await tryVoiceStream(voicePrimary);
  } catch (primaryError: any) {
    console.error(`[DualAI Chat] Voice (${voicePrimary}) failed: ${primaryError.message}. Falling back to ${voiceFallback}...`);
    return await tryVoiceStream(voiceFallback);
  }
}

export async function generateComplianceReport(country: string, provider?: AIProvider) {
  const systemPrompt = `You are a regulatory compliance expert for African credit bureaus. Generate detailed compliance reports for specific countries. Respond in valid JSON:
{
  "country": "<country name>",
  "regulatoryBody": "<name of financial regulator>",
  "complianceScore": <0-100>,
  "dataProtectionLaw": "<applicable law>",
  "creditBureauRegulation": "<specific regulation>",
  "retentionRequirements": "<data retention rules>",
  "reportingRequirements": ["<requirement>"],
  "riskAreas": [{"area": "<name>", "severity": "low"|"medium"|"high", "detail": "<explanation>"}],
  "recommendations": ["<recommendation>"],
  "lastUpdated": "<date>"
}`;
  const userPrompt = `Generate a regulatory compliance report for credit bureau operations in ${country}.`;

  const result = await generateAIResponse(systemPrompt, userPrompt, "compliance", {
    maxTokens: 2000,
    temperature: 0.3,
    ...(provider && { explicitProvider: provider }),
  });
  if (result.usedFallback) {
    console.log(`[AI Router] generateComplianceReport completed via fallback (${result.provider})`);
  }

  return parseJSON(result.text, { country, summary: "Compliance report generated. Please try again if content is incomplete.", complianceScore: 0 });
}

export async function callAI(systemPrompt: string, userPrompt: string, provider?: AIProvider, maxTokens = 2000, temperature = 0.3, taskType: AITaskType = "narrative"): Promise<string> {
  const result = await generateAIResponse(systemPrompt, userPrompt, taskType, {
    maxTokens,
    temperature,
    ...(provider && { explicitProvider: provider }),
  });
  if (result.usedFallback) {
    console.log(`[AI Router] callAI completed via fallback (${result.provider}) for taskType=${taskType}`);
  }
  return result.text;
}

export function parseJSON(raw: string, fallback: Record<string, unknown> = {}) {
  let content = raw.trim();
  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonBlockMatch) {
    content = jsonBlockMatch[1].trim();
  } else {
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  }
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  try { return JSON.parse(content); } catch { return { ...fallback, rawText: raw }; }
}

export async function generateCreditNarrative(borrowerId: string | number, provider?: AIProvider, language?: string) {
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) throw new Error("Borrower not found");
  const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
  const disputes = await storage.getDisputesByBorrower(borrowerId);
  const defaultCurrency = getDefaultCurrencyCode();
  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
  const name = borrower.borrowerType === "corporate" ? (borrower.companyName || "Unknown") : `${borrower.firstName} ${borrower.lastName}`;

  const profile = `
Borrower: ${name} (${borrower.borrowerType || "individual"})
Country: ${borrower.country || "Unknown"} | National ID: ${borrower.nationalId || "N/A"}
Employment: ${borrower.employmentStatus || "Unknown"} | Monthly Income: ${borrower.monthlyIncome || "Not reported"}
PEP Status: ${borrower.isPep ? "Yes — Politically Exposed Person" : "No"}
Credit Accounts: ${accounts.length} total
Active: ${accounts.filter(a => a.status === "current").length} | Delinquent: ${delinquentCount} | Closed: ${accounts.filter(a => a.status === "closed").length}
Total Outstanding: ${defaultCurrency} ${totalBalance.toLocaleString()}
Open Disputes: ${disputes.filter(d => d.status === "open" || d.status === "under_review").length}
Account Details:
${accounts.map(a => `  - ${a.accountType} at ${a.lenderInstitution || "Unknown"}: ${a.currency || defaultCurrency} ${parseFloat(a.currentBalance || "0").toLocaleString()} (original ${a.currency || defaultCurrency} ${parseFloat(a.originalAmount || "0").toLocaleString()}) | Status: ${a.status} | Rate: ${a.interestRate || "N/A"}% | Opened: ${a.dateOpened || "Unknown"} | Arrears: ${a.daysInArrears || "0"} days`).join("\n")}
Dispute History:
${disputes.length > 0 ? disputes.map(d => `  - ${d.disputeType}: ${d.status} — ${d.description || "No details"}`).join("\n") : "  No disputes on record"}
  `.trim();

  const langNames: Record<string, string> = { en: "English", fr: "French", ar: "Arabic", sw: "Swahili", pt: "Portuguese" };
  const targetLang = langNames[language || "en"] || "English";
  const langInstruction = targetLang !== "English" ? ` You MUST write the entire narrative, strengths, risks, and recommendations in ${targetLang}. Every word must be in ${targetLang} — do not use English at all.` : "";

  const systemPrompt = `You are a senior credit analyst writing a narrative credit report for a loan committee at an African bank. Write a professional, readable narrative (not bullet points) that a bank executive would present to their board. Cover: overall credit standing, repayment behavior, risk factors, any red flags, and a final recommendation. Use ${defaultCurrency} for all amounts. Write 4-6 paragraphs. Be specific — reference actual account types, amounts, and status. End with a clear creditworthiness assessment: Excellent, Good, Fair, Below Average, or Poor.${langInstruction} Respond in JSON:
{
  "narrative": "<the full narrative text>",
  "creditworthiness": "Excellent" | "Good" | "Fair" | "Below Average" | "Poor",
  "keyStrengths": ["<strength>"],
  "keyRisks": ["<risk>"],
  "recommendedActions": ["<action>"]
}`;

  const raw = await callAI(systemPrompt, `Write a credit narrative for this borrower${targetLang !== "English" ? ` in ${targetLang}` : ""}:\n\n${profile}`, provider, 2500, 0.3, "narrative");
  return { ...parseJSON(raw, { creditworthiness: "Fair" }), borrowerName: name, generatedAt: new Date().toISOString() };
}

export async function detectAnomalies(provider?: AIProvider, orgId?: string, country?: string) {
  const data = await buildPortfolioData();
  const defaultCurrency = getDefaultCurrencyCode();

  const portfolioSummary = `
Portfolio Overview:
- Total Borrowers: ${data.borrowerProfiles.length}
- Total Accounts: ${data.totalAccounts}
- Open Disputes: ${data.totalDisputes}
- Account Types: ${Object.entries(data.accountsByType).map(([t, v]) => `${t}: ${v.count} accounts, ${defaultCurrency} ${v.balance.toLocaleString()}, ${v.delinquent} delinquent, ${v.defaulted} defaulted`).join("; ")}
- By Lender: ${Object.entries(data.accountsByLender).map(([l, v]) => `${l}: ${v.count} accounts, ${v.delinquent + v.defaulted} non-performing`).join("; ")}

High-Risk Borrowers:
${data.borrowerProfiles.filter(b => b.delinquent > 0 || b.defaulted > 0 || b.maxArrears > 30).slice(0, 20).map(b => `  ${b.name} (${b.type}): ${b.accountCount} accounts, ${b.delinquent} delinquent, ${b.defaulted} defaulted, ${b.maxArrears} days max arrears, ${defaultCurrency} ${b.totalBalance.toLocaleString()}`).join("\n")}

All Borrowers Payment Patterns:
${data.borrowerProfiles.slice(0, 50).map(b => `  ${b.name}: ${b.accountCount} accounts, current=${b.current}, delinquent=${b.delinquent}, default=${b.defaulted}, maxArrears=${b.maxArrears}, balance=${defaultCurrency} ${b.totalBalance.toLocaleString()}`).join("\n")}
  `.trim();

  const systemPrompt = `You are an AI risk monitoring system for the Pan-African Credit Registry. Analyze portfolio data and detect anomalies, unusual patterns, and emerging risks. Look for:
1. Sudden changes in default/delinquency concentration
2. Unusual borrower behavior (multiple defaults, rapid account opening)
3. Lender concentration risk
4. Geographic or sector-specific stress
5. Potential fraud patterns (duplicate profiles, synthetic identities)
6. Systemic risks affecting multiple institutions

Respond in JSON:
{
  "alerts": [
    {
      "severity": "critical" | "warning" | "info",
      "category": "default_spike" | "fraud_pattern" | "concentration_risk" | "behavioral" | "systemic" | "compliance",
      "title": "<short alert title>",
      "description": "<detailed explanation>",
      "affectedEntities": ["<borrower or lender names>"],
      "recommendedAction": "<what to do>"
    }
  ],
  "riskScore": <0-100 overall portfolio risk>,
  "summary": "<2-3 sentence executive summary of portfolio health>"
}`;

  const raw = await callAI(systemPrompt, `Analyze this portfolio for anomalies and risks:\n\n${portfolioSummary}`, provider, 3000, 0.3, "data_analysis");
  return { ...parseJSON(raw, { alerts: [], riskScore: 50 }), analyzedAt: new Date().toISOString() };
}

export async function generateRegulatoryReport(country: string, provider?: AIProvider, orgId?: string) {
  const data = await buildPortfolioData();
  const defaultCurrency = getDefaultCurrencyCode();

  const countryBorrowers = data.borrowerProfiles;
  const totalExposure = countryBorrowers.reduce((s, b) => s + b.totalBalance, 0);
  const nplCount = countryBorrowers.reduce((s, b) => s + b.delinquent + b.defaulted, 0);
  const totalAccounts = countryBorrowers.reduce((s, b) => s + b.accountCount, 0);

  const portfolioContext = `
Registry Data for ${country}:
- Registered Borrowers: ${countryBorrowers.length}
- Total Credit Accounts: ${totalAccounts}
- Total Outstanding Exposure: ${defaultCurrency} ${totalExposure.toLocaleString()}
- Non-Performing Accounts: ${nplCount}
- NPL Ratio: ${totalAccounts > 0 ? ((nplCount / totalAccounts) * 100).toFixed(1) : 0}%
- By Account Type: ${Object.entries(data.accountsByType).map(([t, v]) => `${t}: ${v.count} (${v.delinquent + v.defaulted} NPL)`).join(", ")}
- By Institution: ${Object.entries(data.accountsByLender).map(([l, v]) => `${l}: ${v.count} accounts`).join(", ")}
- Active Disputes: ${data.totalDisputes}
  `.trim();

  const systemPrompt = `You are a regulatory reporting specialist for African central banks. Generate a formal regulatory submission report that meets central bank requirements. The report should be structured like an official filing. Use ${defaultCurrency} for amounts. Respond in JSON:
{
  "reportTitle": "<formal title>",
  "reportingPeriod": "<current quarter>",
  "regulatoryBody": "<relevant central bank or regulator for ${country}>",
  "applicableLaws": ["<relevant laws>"],
  "executiveSummary": "<3-4 paragraph formal summary>",
  "portfolioMetrics": {
    "totalBorrowers": <number>,
    "totalAccounts": <number>,
    "totalExposure": "<formatted amount>",
    "nplRatio": "<percentage>",
    "provisioningRecommendation": "<amount or percentage>"
  },
  "complianceStatus": [
    {"requirement": "<name>", "status": "compliant" | "partially_compliant" | "non_compliant", "detail": "<explanation>"}
  ],
  "riskAssessment": "<paragraph on systemic risks>",
  "dataQualityMetrics": {
    "completeness": "<percentage>",
    "accuracy": "<assessment>",
    "timeliness": "<assessment>"
  },
  "recommendations": ["<recommendation>"],
  "nextActions": ["<required action with deadline>"]
}`;

  const raw = await callAI(systemPrompt, `Generate a regulatory report for ${country} credit bureau operations:\n\n${portfolioContext}`, provider, 3000, 0.3, "compliance");
  return { ...parseJSON(raw, { reportTitle: `${country} Regulatory Report` }), generatedAt: new Date().toISOString(), country };
}

export async function naturalLanguageQuery(query: string, provider?: AIProvider, orgId?: string, country?: string) {
  const data = await buildPortfolioData();
  const defaultCurrency = getDefaultCurrencyCode();

  const dataContext = `
Available data:
- ${data.borrowerProfiles.length} borrowers with fields: name, type (individual/corporate), country, accountCount, totalBalance, current, delinquent, defaulted, writtenOff, closed, maxArrears, disputeCount, isPep, employmentStatus, monthlyIncome
- ${data.totalAccounts} credit accounts with types: ${Object.keys(data.accountsByType).join(", ")}
- Account statuses: current, delinquent, default, closed, restructured, written_off
- Lenders: ${Object.keys(data.accountsByLender).join(", ")}
- Currency: ${defaultCurrency}

Full borrower dataset (first 100):
${data.borrowerProfiles.slice(0, 100).map(b => `${b.name} | ${b.type} | accounts=${b.accountCount} | balance=${b.totalBalance} | current=${b.current} | delinquent=${b.delinquent} | defaulted=${b.defaulted} | arrears=${b.maxArrears}d | disputes=${b.disputeCount} | pep=${b.isPep}`).join("\n")}
  `.trim();

  const systemPrompt = `You are a data query assistant for the Pan-African Credit Registry. Users ask questions in plain English about their credit portfolio data. You have access to the full dataset. Answer the question accurately using the data provided. Be specific with numbers, names, and amounts. Use ${defaultCurrency} for currency. Respond in JSON:
{
  "answer": "<clear, detailed answer to the question>",
  "dataPoints": [
    {"label": "<metric name>", "value": "<value>"}
  ],
  "matchingEntities": [
    {"name": "<borrower or entity name>", "detail": "<relevant info>"}
  ],
  "visualization": "table" | "number" | "list" | "chart",
  "followUpQuestions": ["<suggested follow-up question>"]
}`;

  const raw = await callAI(systemPrompt, `User question: "${query}"\n\nData:\n${dataContext}`, provider, 2000, 0.3, "data_analysis");
  return { ...parseJSON(raw, { answer: "Unable to process query" }), query, answeredAt: new Date().toISOString() };
}

export async function analyzeCrossBorderRisk(provider?: AIProvider) {
  const data = await buildPortfolioData();
  const defaultCurrency = getDefaultCurrencyCode();

  const borrowersByCountry: Record<string, typeof data.borrowerProfiles> = {};
  for (const b of data.borrowerProfiles) {
    for (const a of b.accounts) {
      const lender = a.lender || "Unknown";
      if (!borrowersByCountry[lender]) borrowersByCountry[lender] = [];
      borrowersByCountry[lender].push(b);
    }
  }

  const crossBorderContext = `
Cross-Border Credit Registry Data:
Total Borrowers: ${data.borrowerProfiles.length}
Total Accounts: ${data.totalAccounts}
Institutions: ${data.institutions.map(i => `${i.name} (${i.country || "Unknown"})`).join(", ")}

Exposure by Lender/Institution:
${Object.entries(data.accountsByLender).map(([l, v]) => `${l}: ${v.count} accounts, ${defaultCurrency} ${v.balance.toLocaleString()}, NPL: ${v.delinquent + v.defaulted}`).join("\n")}

Borrowers with Multiple Lenders:
${data.borrowerProfiles.filter(b => {
  const lenders = new Set(b.accounts.map(a => a.lender));
  return lenders.size > 1;
}).slice(0, 20).map(b => {
  const lenders = [...new Set(b.accounts.map(a => a.lender))];
  return `${b.name}: ${b.accountCount} accounts across ${lenders.join(", ")} — total ${defaultCurrency} ${b.totalBalance.toLocaleString()}, delinquent=${b.delinquent}`;
}).join("\n")}

High Exposure Borrowers (top 20 by balance):
${data.borrowerProfiles.sort((a, b) => b.totalBalance - a.totalBalance).slice(0, 20).map(b => `${b.name} (${b.type}): ${defaultCurrency} ${b.totalBalance.toLocaleString()}, ${b.accountCount} accounts, ${b.delinquent} delinquent`).join("\n")}
  `.trim();

  const systemPrompt = `You are a cross-border risk intelligence analyst for the Pan-African Credit Registry. Analyze multi-institutional and multi-country credit exposure. Identify borrowers with obligations across multiple institutions, concentration risks, and hidden exposure that single-country bureaus would miss. Respond in JSON:
{
  "crossBorderExposures": [
    {
      "borrowerName": "<name>",
      "totalExposure": "<amount>",
      "institutions": ["<institution names>"],
      "riskLevel": "low" | "medium" | "high" | "critical",
      "concern": "<why this is flagged>"
    }
  ],
  "concentrationRisks": [
    {
      "type": "institutional" | "sectoral" | "geographic",
      "entity": "<name>",
      "exposure": "<amount or percentage>",
      "detail": "<explanation>"
    }
  ],
  "hiddenExposures": "<paragraph on exposures that single-country bureaus would miss>",
  "systemicRisk": {
    "level": "low" | "moderate" | "elevated" | "high",
    "summary": "<assessment>"
  },
  "recommendations": ["<recommendation>"]
}`;

  const raw = await callAI(systemPrompt, `Analyze cross-border and multi-institutional credit risk:\n\n${crossBorderContext}`, provider, 3000, 0.3, "data_analysis");
  return { ...parseJSON(raw, { systemicRisk: { level: "moderate" } }), analyzedAt: new Date().toISOString() };
}

export async function generateLoanRecommendation(borrowerId: string | number, loanAmount: number, loanType: string, provider?: AIProvider) {
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) throw new Error("Borrower not found");
  const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
  const disputes = await storage.getDisputesByBorrower(borrowerId);
  const defaultCurrency = getDefaultCurrencyCode();
  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const totalOriginal = accounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
  const name = borrower.borrowerType === "corporate" ? (borrower.companyName || "Unknown") : `${borrower.firstName} ${borrower.lastName}`;

  const profile = `
LOAN APPLICATION:
Requested Amount: ${defaultCurrency} ${loanAmount.toLocaleString()}
Loan Type: ${loanType}

APPLICANT PROFILE:
Name: ${name} (${borrower.borrowerType || "individual"})
Country: ${borrower.country || "Unknown"}
Employment: ${borrower.employmentStatus || "Unknown"}
Monthly Income: ${borrower.monthlyIncome || "Not reported"}
PEP Status: ${borrower.isPep ? "Yes" : "No"}

EXISTING CREDIT OBLIGATIONS:
Total Accounts: ${accounts.length}
Current/Performing: ${accounts.filter(a => a.status === "current").length}
Delinquent: ${accounts.filter(a => a.status === "delinquent").length}
Defaulted: ${accounts.filter(a => a.status === "default").length}
Total Outstanding Balance: ${defaultCurrency} ${totalBalance.toLocaleString()}
Total Original Credit Extended: ${defaultCurrency} ${totalOriginal.toLocaleString()}
Max Days in Arrears: ${Math.max(0, ...accounts.map(a => parseInt(a.daysInArrears || "0") || 0))}

ACCOUNT DETAILS:
${accounts.map(a => `  ${a.accountType} at ${a.lenderInstitution || "N/A"}: ${a.currency || defaultCurrency} ${parseFloat(a.currentBalance || "0").toLocaleString()} | Status: ${a.status} | Rate: ${a.interestRate || "N/A"}% | Arrears: ${a.daysInArrears || "0"}d`).join("\n")}

DISPUTE HISTORY:
${disputes.length > 0 ? disputes.map(d => `  ${d.disputeType}: ${d.status}`).join("\n") : "  Clean — no disputes"}

DEBT-TO-INCOME: ${borrower.monthlyIncome ? `${((totalBalance / (parseFloat(borrower.monthlyIncome) * 12)) * 100).toFixed(1)}% of annual income` : "Cannot calculate — income not reported"}
  `.trim();

  const systemPrompt = `You are a senior credit decisioning AI for the Pan-African Credit Registry. Based on the applicant's full credit profile and existing obligations, provide a loan approval recommendation. Be rigorous but fair. Consider African lending context — mobile money history, informal employment, and thin-file borrowers. Use ${defaultCurrency}. Respond in JSON:
{
  "decision": "approve" | "approve_with_conditions" | "decline",
  "confidence": <0-100>,
  "reasoning": "<3-4 paragraph detailed explanation of the decision>",
  "riskScore": <0-100, higher = riskier>,
  "conditions": ["<condition if approve_with_conditions>"],
  "suggestedTerms": {
    "maxAmount": "<recommended max loan amount>",
    "suggestedRate": "<interest rate range>",
    "maxTenor": "<recommended max loan term>",
    "collateralRequired": true | false,
    "collateralType": "<if required>"
  },
  "keyFactors": [
    {"factor": "<name>", "impact": "positive" | "negative", "weight": "high" | "medium" | "low", "detail": "<explanation>"}
  ],
  "debtServiceCoverage": "<ratio or assessment>",
  "comparativeRisk": "<how this borrower compares to the portfolio average>"
}`;

  const raw = await callAI(systemPrompt, `Evaluate this loan application:\n\n${profile}`, provider, 2500, 0.3, "credit_risk");
  return { ...parseJSON(raw, { decision: "decline", confidence: 0 }), borrowerName: name, requestedAmount: loanAmount, loanType, generatedAt: new Date().toISOString() };
}
