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

export async function generatePortfolioIntelligence() {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a senior credit risk analyst for the Pan-African Credit Registry (CDH v2.0) operating in Ghana. Currency is ${defaultCurrency} (Ghana Cedis). Analyze the portfolio data and generate a comprehensive intelligence report. You must respond in valid JSON with this exact structure:
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
}`
      },
      {
        role: "user",
        content: `Analyze this credit portfolio and generate a comprehensive intelligence report with predictions, early warnings, and actionable recommendations:\n\n${portfolioContext}`
      }
    ],
    max_tokens: 4000,
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const content = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(content);
  } catch {
    return { executiveSummary: raw, overallRiskRating: "moderate", portfolioHealthScore: 50 };
  }
}

async function buildLiveContext(): Promise<string> {
  try {
    const [stats, institutions, orgs, retentionPolicies, exchangeRates, borrowersResult, allAccounts, disputes] = await Promise.all([
      storage.getDashboardStats().catch(() => null),
      storage.getInstitutions(1, 100).catch(() => ({ data: [], total: 0 })),
      storage.getOrganizations().catch(() => []),
      storage.getRetentionPolicies().catch(() => []),
      storage.getExchangeRates().catch(() => []),
      storage.getBorrowers(1, 200).catch(() => ({ data: [], total: 0 })),
      storage.getAllCreditAccounts().catch(() => []),
      storage.getDisputes().catch(() => []),
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
        nationalId: b.nationalId || "N/A",
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
        flags: statusFlags,
        accountDetails: bAccounts.map(a => `${a.accountType}: GHS ${parseFloat(a.currentBalance || "0").toLocaleString()} (${a.status}${parseInt(a.daysInArrears || "0") > 0 ? `, ${a.daysInArrears}d arrears` : ""})`).join("; "),
      };
    });

    borrowerProfiles.sort((a, b) => (b.defaulted + b.delinquent + b.writtenOff) - (a.defaulted + a.delinquent + a.writtenOff) || b.maxArrears - a.maxArrears || b.totalBalance - a.totalBalance);

    const borrowerList = borrowerProfiles.map(bp => {
      const flagStr = bp.flags.length > 0 ? ` [${bp.flags.join(", ")}]` : "";
      return `  - ${bp.name} (${bp.type}, ID: ${bp.nationalId}) | ${bp.accountCount} accounts | Outstanding: GHS ${bp.totalBalance.toLocaleString()} | Max Arrears: ${bp.maxArrears}d${flagStr}\n    Contact: ${bp.contact}\n    Address: ${bp.address}\n    Accounts: ${bp.accountDetails || "None"}`;
    }).join("\n");

    return `
=== LIVE SYSTEM DATA (real-time from database) ===
Total Borrowers: ${stats?.totalBorrowers?.toLocaleString() || "N/A"}
Total Credit Accounts: ${stats?.totalAccounts?.toLocaleString() || "N/A"}
Total Outstanding Portfolio: GHS ${stats?.totalOutstanding ? parseFloat(stats.totalOutstanding).toLocaleString() : "N/A"}
Delinquent Accounts: ${stats?.delinquentAccounts?.toLocaleString() || "N/A"}
Defaulted Accounts: ${stats?.defaultAccounts?.toLocaleString() || "N/A"}
Total Credit Inquiries: ${stats?.totalInquiries?.toLocaleString() || "N/A"}
Pending Approvals: ${stats?.pendingApprovalCount?.toLocaleString() || "N/A"}
Open Disputes: ${stats?.openDisputeCount?.toLocaleString() || "N/A"}
${stats?.outstandingByCurrency ? `Outstanding by Currency:\n${stats.outstandingByCurrency.map(b => `  - ${b.currency}: ${parseFloat(b.total).toLocaleString()}`).join("\n")}` : ""}

Connected Institutions (${institutions.total}):
${institutionList || "  None registered"}

Organizations (${orgs.length}):
${orgList || "  None"}

Data Retention Policies:
${retentionList || "  Default policies"}

Exchange Rates: ${rateInfo}
Rates are updated automatically every 6 hours from live market data.

=== BORROWER PORTFOLIO (all ${borrowersResult.total} borrowers, sorted by risk — worst first) ===
${borrowerList || "  No borrowers"}
=== END LIVE DATA ===`.trim();
  } catch (err) {
    return "=== LIVE DATA UNAVAILABLE ===";
  }
}

export async function chatWithAI(messages: { role: string; content: string }[], userRole?: string) {
  const defaultCurrency = getDefaultCurrencyCode();
  const liveContext = await buildLiveContext();

  const systemMessage = {
    role: "system" as const,
    content: `You are the AI Assistant for the Pan-African Credit Registry — Credit Data Hub (CDH v2.0), built by Carlson Capital & Systems In Motion Limited. You have full knowledge of the platform and access to live system data.

=== PLATFORM OVERVIEW ===
The CDH v2.0 is a multi-tenant SaaS credit registry platform currently operating in Ghana mode, regulated by the Bank of Ghana (BoG). Default currency: ${defaultCurrency} (Ghana Cedis). The platform serves banks, microfinance institutions, savings & loans companies, and rural banks across Ghana.

=== PLATFORM FEATURES ===
1. DASHBOARD: Real-time analytics with 8 KPI cards (borrowers, accounts, outstanding portfolio, delinquent/default accounts, inquiries, pending approvals, open disputes). Interactive charts showing portfolio growth trends, account status distribution, and loan type breakdown. Africa map visualization. Currency conversion with live exchange rates.

2. BORROWER MANAGEMENT: Individual and corporate borrower registration with Ghana Card (NIA) validation. Fields include national ID, TIN, date of birth, employment status, monthly income, PEP (Politically Exposed Person) flagging, address, city, region. Supports borrower search with fuzzy matching for duplicate detection.

3. CREDIT ACCOUNTS: Full lifecycle management — account creation, status tracking (current/delinquent/default/closed/restructured/written-off), balance updates, payment history. Account types: Personal Loan, Mortgage, Auto Loan, Business Loan, Microfinance, Credit Card, Overdraft, Trade Finance, Leasing, Student Loan, Agricultural Loan. Tracks: original amount, current balance, interest rate, collateral, days in arrears.

4. CREDIT SEARCH & REPORTS: Search by name, national ID, or account number. Generates comprehensive credit reports with sections: Credit Profile Overview, Institution Details, Liability Summary, Product Composition, Facility Details (with BoG payment history codes and account status codes), Dishonoured Cheques, Guaranteed Loans, Court Judgments, Consent Records, Credit Search Inquiry History, Score Methodology & Validation. AI-powered risk analysis and report summaries available.

5. CREDIT SCORING: Algorithmic scoring on a 300-850 scale. Five factors: Payment History (35%), Credit Utilization (30%), Credit History Length (15%), Credit Mix (10%), New Credit (10%). Score bands: Excellent (750-850), Good (700-749), Fair (650-699), Poor (550-649), Very Poor (300-549). Model validation metrics: Gini coefficient, KS statistic, Rank Ordering, Stress Testing, Probability of Default (PD).

6. BANK OF GHANA CRB v1.1 COMPLIANCE:
   - File identifiers: CONC (Consumer Credit), BUSC (Business Credit), CONJ (Consumer Joint), BUSJ (Business Joint), COND (Consumer Delinquent), BUSD (Business Delinquent)
   - 13 NDIA Payment History codes: OK (Current), 30/60/90/120/180/210/240/270/270+ (Days Past Due), ND (New/No Data), P (Paid Up), X (Delayed CAGD)
   - Account Status codes A-Z with full legend
   - Asset Classification: A (Current), B (OLEM), C (Substandard), D (Doubtful), E (Loss)
   - Facility types (101-129), repayment frequencies, sector/sub-sector codes
   - Batch upload supporting BoG format CSV/XLSX files
   - BoG Export page for generating compliant data files

7. DISPUTE MANAGEMENT: Full dispute lifecycle with SLA tracking. Dispute types: incorrect balance, wrong status, identity theft, duplicate entry, unauthorized inquiry, data quality. Status flow: open -> under_review -> resolved/rejected. SLA deadlines enforced. Dispute resolution audit trail maintained.

8. CONSENT MANAGEMENT: Tracks borrower consent for credit inquiries per Credit Reporting Act 726. Records consent type, purpose, grantor, and validity period.

9. AUDIT TRAIL: Tamper-evident audit logs with SHA-256 hash chain. Tracks all CRUD operations, login events, data exports, and system changes. Includes IP address, user ID, timestamp, and action details.

10. REGULATORY COMPLIANCE DASHBOARD: Jurisdiction-specific compliance monitoring. Data retention enforcement across 54 African countries. AI-generated compliance reports per country.

11. BATCH UPLOAD: Bulk data ingestion via CSV/XLSX files for borrowers, credit accounts, and BoG CRB format files. Validation, error reporting, and preview before commit.

12. INSTITUTION MANAGEMENT: Register and manage financial institutions (banks, MFIs, savings & loans, rural banks, insurance companies). Self-registration with approval workflow. Tracks BIC/SWIFT codes, license numbers, regulatory status.

13. USER MANAGEMENT: Role-based access control with roles: super_admin, admin, lender, regulator, auditor, viewer. Features: password policies (90-day expiry, complexity requirements), 3-attempt lockout, session timeouts, TOTP MFA, IP tracking.

14. BILLING & SUBSCRIPTIONS: Stripe-integrated billing for institutions. Subscription tiers with usage-based pricing for credit inquiries and data submissions.

15. API ACCESS: REST API for external integrations. API key management with per-institution keys. OAuth 2.1 support. Endpoints for borrower lookup, credit report generation, data submission.

16. EXCHANGE RATES: Live rates for 42 African currencies + USD/EUR/GBP. Auto-updated every 6 hours. Manual refresh available. Currency conversion on all financial displays.

17. DOCUMENTATION: 9 platform documents (API Guide, UAT Test Document, Systems Documentation, Users Manual, SRS Traceability Matrix, Data Dictionary, Deployment Guide, Security & Compliance Report, Liberia Marketing Proposal). 8 Ghana-specific documents (SLA Agreement, Compliance Framework, E2E Test Plan, Data Standards Reference, Data Protection Policy, Operational Procedures, API Integration Guide, Data Connections Policy). All available as rendered HTML with PDF download.

18. MULTI-LANGUAGE: English, French, Portuguese, Arabic (RTL), and Swahili.

19. CHATBOT: This AI assistant plus FAQ mode and dispute filing mode.

20. DATA RETENTION: Configurable per jurisdiction. Ghana: 7 years. Automated cleanup scheduler runs every 24 hours.

=== NAVIGATION GUIDE ===
- Dashboard: / (home page)
- Borrowers: /borrowers (list), /borrowers/:id (detail)
- Credit Accounts: /credit-accounts
- Credit Search: /search
- Credit Reports: /reports
- Disputes: /disputes
- Pending Approvals: /approvals
- Consent Management: /consent
- Helpdesk: /helpdesk
- Audit Trail: /audit
- Regulatory Compliance: /regulatory-compliance
- BoG Export: /bog-export
- Batch Upload: /batch-upload
- User Management: /users (admin only)
- Institutions: /institutions (admin only)
- Billing: /billing
- Retention Policies: /retention-policies
- Exchange Rates: /exchange-rates
- API Admin: /api-admin
- API Keys: /api-keys
- Documentation: /documentation
- Ghana Docs: /ghana-docs
- App Guide: /guide
- Help: /help
- About: /about

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
- You have access to the live system data shown above. Use exact numbers when answering questions about the system.
- When users ask about features, explain how to navigate to them using the sidebar menu.
- When users ask about regulations, reference the specific Ghanaian laws (Act 726, Act 843).
- When discussing financial amounts, always use GHS (Ghana Cedis) unless the user specifies otherwise.
- Be professional, concise, and helpful. Format responses clearly with bullet points or numbered lists when appropriate.
- If a user asks how to do something, give step-by-step instructions referencing the actual UI pages and buttons.
- You are speaking with a ${userRole || "user"} role user. Tailor your responses to their access level.
- Do not make up data. If something is not in the live data above, say you don't have that specific information.
- For technical API questions, reference the API Integration Guide available at /documentation.
- The platform is built by Carlson Capital & Systems In Motion Limited.`
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
    temperature: 0.4,
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
