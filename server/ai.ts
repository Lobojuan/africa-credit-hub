import OpenAI from "openai";
import { storage } from "./storage";
import { getDefaultCurrencyCode } from "./credit-score";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function analyzeCreditRisk(borrowerId: string | number) {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert credit risk analyst for the Pan-African Credit Registry. Analyze borrower profiles and provide structured risk assessments. All monetary amounts are in ${defaultCurrency} (${defaultCurrency === "GHS" ? "Ghana Cedis" : defaultCurrency}). You must respond in valid JSON format with these fields:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": <number 0-100, higher = more risky>,
  "summary": "<2-3 sentence executive summary>",
  "factors": [{"factor": "<name>", "impact": "positive" | "negative" | "neutral", "detail": "<explanation>"}],
  "recommendations": ["<actionable recommendation>"],
  "regulatoryFlags": ["<any compliance concerns>"]
}`
      },
      {
        role: "user",
        content: `Analyze this borrower's credit risk:\n\n${borrowerProfile}`
      }
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const content = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(content);
  } catch {
    return {
      riskLevel: "medium",
      riskScore: 50,
      summary: raw,
      factors: [],
      recommendations: [],
      regulatoryFlags: [],
    };
  }
}

export async function generateReportSummary(borrowerId: string | number) {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a credit report summarizer for the Pan-African Credit Registry. All monetary amounts are in ${defaultCurrency} (${defaultCurrency === "GHS" ? "Ghana Cedis" : defaultCurrency}). Generate clear, professional, plain-language summaries of credit reports suitable for non-technical readers such as bank officers and regulators. Include key highlights, concerns, and an overall assessment. Keep it concise but comprehensive (3-5 paragraphs). Use professional financial language. Always reference amounts in ${defaultCurrency}.`
      },
      {
        role: "user",
        content: `Generate a plain-language credit report summary:\n\n${reportData}`
      }
    ],
    max_tokens: 1000,
    temperature: 0.4,
  });

  return {
    summary: response.choices[0]?.message?.content || "Unable to generate summary.",
    borrowerName: `${borrower.firstName} ${borrower.lastName}`,
    generatedAt: new Date().toISOString(),
  };
}

export async function chatWithAI(messages: { role: string; content: string }[], userRole?: string) {
  const defaultCurrency = getDefaultCurrencyCode();
  const systemMessage = {
    role: "system" as const,
    content: `You are the Pan-African Credit Registry AI Assistant, an expert in credit bureau operations, African financial regulations, and the Credit Data Hub (CDH v1.2) platform.

Your knowledge includes:
- Credit scoring methodologies (300-850 scale)
- Pan-African banking regulations across all 54 African countries
- Dispute resolution processes and SLA requirements
- Data retention policies and GDPR/data protection compliance
- Multi-currency operations (42 African currencies + USD/EUR/GBP)
- Cross-border entity resolution
- Anti-money laundering (AML) and Know Your Customer (KYC) requirements
- Credit account types (personal loans, mortgages, business credit, trade finance)
- Regulatory reporting requirements

The system is currently operating in Ghana mode. The default currency is ${defaultCurrency} (Ghana Cedis). The regulatory body is the Bank of Ghana.

You help users with:
- Understanding credit data and reports
- Navigating the platform features
- Explaining regulatory requirements by country
- Answering questions about credit risk assessment
- Providing guidance on dispute management
- Explaining compliance requirements

Be professional, concise, and helpful. When discussing regulations, specify the relevant jurisdiction. If unsure about specific country regulations, say so rather than guessing. Always use ${defaultCurrency} when referencing monetary amounts unless the user specifies otherwise.

The user's role is: ${userRole || "user"}.`
  };

  const chatMessages = [
    systemMessage,
    ...messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: chatMessages,
    max_tokens: 2000,
    temperature: 0.5,
    stream: true,
  });

  return stream;
}

export async function generateComplianceReport(country: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a regulatory compliance expert for African credit bureaus. Generate detailed compliance reports for specific countries. Respond in valid JSON:
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
}`
      },
      {
        role: "user",
        content: `Generate a regulatory compliance report for credit bureau operations in ${country}.`
      }
    ],
    max_tokens: 2000,
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const content = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(content);
  } catch {
    return { country, summary: raw, complianceScore: 0 };
  }
}
