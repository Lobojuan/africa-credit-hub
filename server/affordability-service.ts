import { storage } from "./storage";
import { db } from "./db";
import { incomeSources as incomeSourcesTable, expenseCategorisations as expenseCategorisationsTable, affordabilityAssessments as affordabilityAssessmentsTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateAIResponse } from "./ai";
import { computeTelcoKPIs } from "./telco-scoring";
import type {
  Borrower, MomoTransaction, TelcoProfile, CreditAccount,
  IncomeSource, ExpenseCategorisation, AffordabilityAssessment,
} from "@shared/schema";

// ==================== TYPES ====================

export type NormalisedTxn = {
  date: Date;
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  counterparty?: string | null;
  narration?: string | null;
  category?: string | null;
};

export type IncomeSourceCandidate = {
  sourceType: "salary" | "business_income" | "government_benefit" | "remittance" | "rental" | "investment" | "pension" | "freelance" | "momo_inflow" | "other";
  description: string;
  amountMonthly: number;
  currency: string;
  frequency: string;
  confidence: number;
  evidenceType: string;
  evidenceRef?: string;
};

export type ExpenseCandidate = {
  category: "rent" | "utilities" | "food" | "transport" | "debt_servicing" | "education" | "healthcare" | "telecom" | "discretionary" | "transfers_out" | "other";
  amountMonthly: number;
  currency: string;
  source: string;
  detail?: string;
};

export type AffordabilityResult = {
  borrowerId: string;
  country: string | null;
  currency: string;
  dataSource: "open_banking" | "bank_statement_pdf" | "momo_only" | "self_declared" | "hybrid";
  periodDays: number;
  grossIncomeMonthly: number;
  totalExpensesMonthly: number;
  existingDebtServiceMonthly: number;
  disposableIncomeMonthly: number;
  debtToIncomeRatio: number;
  maxRecommendedNewCredit: number;
  maxRecommendedMonthlyRepayment: number;
  affordabilityRating: "strong" | "adequate" | "tight" | "stressed" | "unknown";
  confidenceLabel: "high" | "medium" | "low";
  regulatoryRule: string;
  incomeSources: IncomeSourceCandidate[];
  expenses: ExpenseCandidate[];
  notes: string[];
};

// ==================== COUNTRY RULES ====================

export type CountryAffordabilityRule = {
  code: string;
  name: string;
  regulator: string;
  /** Maximum portion of disposable income that can service a NEW loan (0-1) */
  maxDsrOfDisposable: number;
  /** Maximum total debt-to-income ratio (0-1) */
  maxDti: number;
  /** Default loan term in months used to derive max credit principal */
  defaultTermMonths: number;
  /** Subsistence reserve percentage of gross income (0-1) */
  subsistenceReservePct: number;
};

const COUNTRY_RULES: Record<string, CountryAffordabilityRule> = {
  ghana: {
    code: "GH", name: "Ghana", regulator: "Bank of Ghana",
    maxDsrOfDisposable: 0.5, maxDti: 0.5, defaultTermMonths: 24, subsistenceReservePct: 0.3,
  },
  nigeria: {
    code: "NG", name: "Nigeria", regulator: "Central Bank of Nigeria",
    maxDsrOfDisposable: 0.55, maxDti: 0.65, defaultTermMonths: 24, subsistenceReservePct: 0.3,
  },
  kenya: {
    code: "KE", name: "Kenya", regulator: "Central Bank of Kenya",
    maxDsrOfDisposable: 0.6, maxDti: 0.6, defaultTermMonths: 36, subsistenceReservePct: 0.33,
  },
  southafrica: {
    code: "ZA", name: "South Africa", regulator: "National Credit Regulator",
    maxDsrOfDisposable: 0.5, maxDti: 0.5, defaultTermMonths: 60, subsistenceReservePct: 0.4,
  },
  default: {
    code: "DEFAULT", name: "Default", regulator: "Local Regulator",
    maxDsrOfDisposable: 0.5, maxDti: 0.5, defaultTermMonths: 24, subsistenceReservePct: 0.3,
  },
};

export function getAffordabilityRule(country?: string | null): CountryAffordabilityRule {
  if (!country) return COUNTRY_RULES.default;
  const key = country.toLowerCase().replace(/[\s_-]/g, "");
  return COUNTRY_RULES[key] || COUNTRY_RULES.default;
}

// ==================== OPEN BANKING ADAPTER ====================

export type OpenBankingProvider = "mono" | "stitch" | "okra" | "stub";

export type OpenBankingAccount = {
  provider: OpenBankingProvider;
  accountId: string;
  accountName: string;
  currency: string;
  bank: string;
};

export type OpenBankingResult = {
  account: OpenBankingAccount;
  transactions: NormalisedTxn[];
};

function pickProvider(country?: string | null): OpenBankingProvider {
  const c = (country || "").toLowerCase();
  if (process.env.MONO_API_KEY && (c.includes("nigeria") || c.includes("ghana") || c.includes("kenya") || c.includes("south africa"))) return "mono";
  if (process.env.STITCH_API_KEY && c.includes("south africa")) return "stitch";
  if (process.env.OKRA_API_KEY && c.includes("nigeria")) return "okra";
  return "stub";
}

/**
 * Fetch transactions for a linked open-banking account.
 * In stub mode, generates a deterministic synthetic dataset based on borrower id.
 */
export async function fetchOpenBankingTransactions(
  borrower: Borrower,
  opts: { provider?: OpenBankingProvider; accountId?: string; periodDays?: number } = {}
): Promise<OpenBankingResult> {
  const provider = opts.provider || pickProvider(borrower.country);
  const periodDays = opts.periodDays ?? 90;
  const currency = borrower.incomeCurrency || "GHS";

  if (provider === "stub") {
    return generateStubBankingData(borrower, periodDays, currency);
  }

  // Real adapter would dispatch on `provider` here. Tokens / clients omitted for brevity.
  // Implementations would call e.g. https://api.withmono.com/accounts/:id/transactions
  // For now, fall back to stub so the pipeline still works in dev.
  console.warn(`[Affordability] Provider ${provider} requested but live adapter not yet wired — using stub.`);
  return generateStubBankingData(borrower, periodDays, currency);
}

function generateStubBankingData(borrower: Borrower, periodDays: number, currency: string): OpenBankingResult {
  const seed = parseInt(borrower.id.replace(/[^0-9]/g, "").slice(0, 8) || "1", 10) || 1;
  const rng = mulberry32(seed);
  const baseSalary = parseFloat(borrower.monthlyIncome || "0") || (1500 + Math.floor(rng() * 3500));
  const txns: NormalisedTxn[] = [];
  const now = Date.now();
  const months = Math.max(1, Math.round(periodDays / 30));
  for (let m = 0; m < months; m++) {
    const monthStart = new Date(now - (m + 1) * 30 * 86400000);
    // Salary on the 28th-ish
    txns.push({
      date: new Date(monthStart.getTime() + 27 * 86400000),
      amount: baseSalary,
      currency, direction: "credit",
      counterparty: "ACME PAYROLL", narration: "SALARY CREDIT",
    });
    // Rent
    txns.push({
      date: new Date(monthStart.getTime() + 1 * 86400000),
      amount: Math.round(baseSalary * 0.25),
      currency, direction: "debit",
      counterparty: "LANDLORD", narration: "RENT PAYMENT",
    });
    // Utilities
    txns.push({
      date: new Date(monthStart.getTime() + 5 * 86400000),
      amount: Math.round(baseSalary * 0.05),
      currency, direction: "debit",
      counterparty: "ECG ELECTRICITY", narration: "ELECTRICITY BILL",
    });
    // Telecom
    txns.push({
      date: new Date(monthStart.getTime() + 7 * 86400000),
      amount: Math.round(baseSalary * 0.03),
      currency, direction: "debit",
      counterparty: "MTN", narration: "AIRTIME",
    });
    // Groceries (multiple)
    for (let g = 0; g < 4; g++) {
      txns.push({
        date: new Date(monthStart.getTime() + (8 + g * 5) * 86400000),
        amount: Math.round(baseSalary * 0.04 + rng() * baseSalary * 0.02),
        currency, direction: "debit",
        counterparty: g % 2 ? "SHOPRITE" : "MAXMART", narration: "GROCERIES",
      });
    }
    // Transport
    txns.push({
      date: new Date(monthStart.getTime() + 12 * 86400000),
      amount: Math.round(baseSalary * 0.08),
      currency, direction: "debit",
      counterparty: "BOLT", narration: "TRANSPORT",
    });
    // Discretionary
    txns.push({
      date: new Date(monthStart.getTime() + 20 * 86400000),
      amount: Math.round(baseSalary * 0.06 + rng() * baseSalary * 0.05),
      currency, direction: "debit",
      counterparty: "ENTERTAINMENT", narration: "MISC SPEND",
    });
  }
  return {
    account: {
      provider: "stub",
      accountId: `stub-${borrower.id.slice(0, 8)}`,
      accountName: borrower.firstName ? `${borrower.firstName} ${borrower.lastName}` : (borrower.companyName || "Borrower"),
      currency,
      bank: "Stub Bank",
    },
    transactions: txns,
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ==================== BANK STATEMENT PDF PARSER ====================

/**
 * Parse a PDF bank statement buffer into normalised transactions using LLM extraction.
 * Falls back gracefully if AI is unavailable or PDF text extraction fails.
 */
export async function parseBankStatementPdf(pdfBuffer: Buffer, currency: string = "GHS"): Promise<NormalisedTxn[]> {
  let text = "";
  try {
    const pdfParse: any = (await import("pdf-parse")).default || (await import("pdf-parse"));
    const result = await pdfParse(pdfBuffer);
    text = (result.text || "").slice(0, 30000);
  } catch (err: any) {
    console.warn(`[Affordability] PDF text extraction failed: ${err.message}`);
    return [];
  }
  if (!text || text.length < 50) return [];

  const systemPrompt = `You are a financial statement parser. Extract transactions from a bank statement and return JSON.
Output strictly: {"transactions":[{"date":"YYYY-MM-DD","amount":<number>,"direction":"credit|debit","counterparty":"<name>","narration":"<text>"}]}.
Amounts are positive numbers.`;
  const userPrompt = `Currency: ${currency}\nStatement text (truncated):\n${text}\n\nReturn JSON only.`;
  try {
    const ai = await generateAIResponse(systemPrompt, userPrompt, "narrative", { temperature: 0.1, maxTokens: 3000 });
    const match = ai.text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    const out: NormalisedTxn[] = [];
    for (const t of parsed.transactions || []) {
      const d = new Date(t.date);
      const amt = Number(t.amount);
      if (isNaN(d.getTime()) || !isFinite(amt) || amt <= 0) continue;
      out.push({
        date: d, amount: amt, currency,
        direction: t.direction === "credit" ? "credit" : "debit",
        counterparty: t.counterparty || null,
        narration: t.narration || null,
      });
    }
    return out;
  } catch (err: any) {
    console.warn(`[Affordability] LLM PDF parse failed: ${err.message}`);
    return [];
  }
}

// ==================== INCOME CLASSIFIER ====================

const SALARY_KEYWORDS = /\b(salary|payroll|wages|stipend|monthly\s*pay|net\s*pay)\b/i;
const GOVT_KEYWORDS = /\b(govt|government|grant|benefit|pension|nhif|nssf|tin)\b/i;
const REMITTANCE_KEYWORDS = /\b(remit|western\s*union|moneygram|wise|world\s*remit)\b/i;
const RENTAL_KEYWORDS = /\b(rent\s*(received|income))\b/i;

export function classifyIncome(txns: NormalisedTxn[], currency: string): IncomeSourceCandidate[] {
  const credits = txns.filter(t => t.direction === "credit");
  if (credits.length === 0) return [];

  // Group by counterparty to detect recurrence
  const groups = new Map<string, NormalisedTxn[]>();
  for (const t of credits) {
    const key = (t.counterparty || t.narration || "unknown").toUpperCase().trim();
    const arr = groups.get(key) || [];
    arr.push(t);
    groups.set(key, arr);
  }

  const monthsSpan = Math.max(1, monthSpan(credits));
  const candidates: IncomeSourceCandidate[] = [];

  for (const [key, arr] of groups.entries()) {
    if (arr.length < 2) continue; // require recurrence
    const total = arr.reduce((s, t) => s + t.amount, 0);
    const monthly = total / monthsSpan;
    if (monthly < 10) continue;

    const txt = `${key} ${arr.map(t => t.narration || "").join(" ")}`;
    let sourceType: IncomeSourceCandidate["sourceType"] = "other";
    if (SALARY_KEYWORDS.test(txt)) sourceType = "salary";
    else if (GOVT_KEYWORDS.test(txt)) sourceType = "government_benefit";
    else if (REMITTANCE_KEYWORDS.test(txt)) sourceType = "remittance";
    else if (RENTAL_KEYWORDS.test(txt)) sourceType = "rental";
    else if (arr.length >= 3) sourceType = "business_income";

    // Confidence: more frequent + less variance = higher confidence
    const amounts = arr.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;
    const recurrenceScore = Math.min(1, arr.length / monthsSpan);
    const confidence = Math.round(Math.max(20, Math.min(95, recurrenceScore * 60 + (1 - Math.min(1, cv)) * 35)));

    candidates.push({
      sourceType,
      description: key.slice(0, 80),
      amountMonthly: round2(monthly),
      currency,
      frequency: arr.length / monthsSpan >= 0.9 ? "monthly" : (arr.length / monthsSpan >= 1.8 ? "bi-monthly" : "irregular"),
      confidence,
      evidenceType: "transaction_pattern",
      evidenceRef: `${arr.length} credits over ${monthsSpan} mo`,
    });
  }

  // Sort by amount desc, return top 5
  candidates.sort((a, b) => b.amountMonthly - a.amountMonthly);
  return candidates.slice(0, 5);
}

// ==================== EXPENSE CATEGORISER ====================

const EXPENSE_RULES: Array<{ category: ExpenseCandidate["category"]; pattern: RegExp }> = [
  { category: "rent", pattern: /\b(rent|landlord|lease)\b/i },
  { category: "utilities", pattern: /\b(electric|ecg|nawec|kplc|water|gwsc|ghana\s*water|gas)\b/i },
  { category: "telecom", pattern: /\b(mtn|vodafone|airteltigo|airtel|safaricom|glo|9mobile|airtime|data\s*bundle)\b/i },
  { category: "food", pattern: /\b(shoprite|maxmart|melcom|spar|pick\s*n\s*pay|grocer|supermarket|restaurant|food)\b/i },
  { category: "transport", pattern: /\b(uber|bolt|yango|fuel|petrol|diesel|trotro|taxi|transport|metro)\b/i },
  { category: "debt_servicing", pattern: /\b(loan|repayment|emi|installment|mortgage|credit\s*card)\b/i },
  { category: "education", pattern: /\b(school|tuition|university|college|fees)\b/i },
  { category: "healthcare", pattern: /\b(hospital|clinic|pharmacy|medical|nhis)\b/i },
  { category: "transfers_out", pattern: /\b(transfer|p2p|send\s*money)\b/i },
];

export async function categoriseExpenses(txns: NormalisedTxn[], currency: string, useLlmFallback: boolean = false): Promise<ExpenseCandidate[]> {
  const debits = txns.filter(t => t.direction === "debit");
  const monthsSpan = Math.max(1, monthSpan(debits));
  const buckets: Record<string, { total: number; count: number; details: string[] }> = {};

  const unknown: NormalisedTxn[] = [];
  for (const t of debits) {
    const text = `${t.counterparty || ""} ${t.narration || ""}`;
    let matched: ExpenseCandidate["category"] | null = null;
    for (const rule of EXPENSE_RULES) {
      if (rule.pattern.test(text)) { matched = rule.category; break; }
    }
    if (!matched) {
      if (useLlmFallback && unknown.length < 30) {
        unknown.push(t);
        continue;
      }
      matched = "discretionary";
    }
    const b = buckets[matched] || { total: 0, count: 0, details: [] };
    b.total += t.amount;
    b.count += 1;
    if (b.details.length < 3 && t.counterparty) b.details.push(t.counterparty);
    buckets[matched] = b;
  }

  // LLM fallback for unknowns (cheap: one call)
  if (useLlmFallback && unknown.length > 0) {
    try {
      const list = unknown.map((t, i) => `${i + 1}. ${t.counterparty || ""} | ${t.narration || ""} | ${t.amount}`).join("\n");
      const sys = `Categorise each transaction. Output JSON: {"categories":["rent"|"utilities"|"food"|"transport"|"debt_servicing"|"education"|"healthcare"|"telecom"|"discretionary"|"transfers_out"|"other", ...]} in same order.`;
      const ai = await generateAIResponse(sys, list, "narrative", { temperature: 0.1, maxTokens: 500 });
      const m = ai.text.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const cats: string[] = parsed.categories || [];
        for (let i = 0; i < unknown.length; i++) {
          const t = unknown[i];
          const cat = (cats[i] as ExpenseCandidate["category"]) || "discretionary";
          const valid: ExpenseCandidate["category"][] = ["rent","utilities","food","transport","debt_servicing","education","healthcare","telecom","discretionary","transfers_out","other"];
          const c = valid.includes(cat) ? cat : "discretionary";
          const b = buckets[c] || { total: 0, count: 0, details: [] };
          b.total += t.amount;
          b.count += 1;
          if (b.details.length < 3 && t.counterparty) b.details.push(t.counterparty);
          buckets[c] = b;
        }
      } else {
        unknown.forEach(t => {
          const b = buckets["discretionary"] || { total: 0, count: 0, details: [] };
          b.total += t.amount; b.count += 1;
          buckets["discretionary"] = b;
        });
      }
    } catch (err: any) {
      console.warn(`[Affordability] LLM expense fallback failed: ${err.message}`);
      unknown.forEach(t => {
        const b = buckets["discretionary"] || { total: 0, count: 0, details: [] };
        b.total += t.amount; b.count += 1;
        buckets["discretionary"] = b;
      });
    }
  }

  return Object.entries(buckets).map(([cat, b]) => ({
    category: cat as ExpenseCandidate["category"],
    amountMonthly: round2(b.total / monthsSpan),
    currency,
    source: "transaction_categorisation",
    detail: `${b.count} txns; sample: ${b.details.join(", ")}`,
  })).sort((a, b) => b.amountMonthly - a.amountMonthly);
}

// ==================== MOMO ADAPTER ====================

function momoToNormalised(txns: MomoTransaction[]): NormalisedTxn[] {
  const credits = ["p2p_receive", "cash_in", "salary_credit", "loan_disbursement", "savings_withdrawal", "international_transfer"];
  return txns.map(t => ({
    date: new Date(t.transactionDate),
    amount: Number(t.amount),
    currency: t.currency || "GHS",
    direction: credits.includes(t.transactionType) ? "credit" : "debit",
    counterparty: t.counterpartyName || t.counterpartyMsisdn,
    narration: t.narration || t.transactionType,
    category: t.category,
  }));
}

// ==================== ORCHESTRATOR ====================

export type ComputeOpts = {
  source?: "open_banking" | "bank_statement_pdf" | "momo_only" | "auto";
  pdfBuffer?: Buffer;
  openBankingProvider?: OpenBankingProvider;
  openBankingAccountId?: string;
  periodDays?: number;
  computedBy?: string;
  useLlmFallback?: boolean;
  /** When true, skip the borrower-consent check (use only for internal admin/audit flows that already validated consent). */
  skipConsentCheck?: boolean;
};

export type AffordabilityInputsSnapshot = {
  transactionCount: number;
  hasMomo: boolean;
};

export type AffordabilityOutputsSnapshot = {
  incomeSources: IncomeSourceCandidate[];
  expenses: ExpenseCandidate[];
  notes: string[];
};

/**
 * Verify that the borrower has granted consent for affordability / financial-data analysis,
 * either via an active ConsentRecord (preferred) or the legacy borrower.consentProvided flag.
 */
export async function hasAffordabilityConsent(borrowerId: string, _borrower?: Borrower): Promise<{ ok: boolean; reason?: string; consentId?: string }> {
  const records = await storage.getConsentRecordsByBorrower(borrowerId);
  const acceptableNeedles = ["affordability", "credit", "financial", "openbanking", "datasharing"];
  const active = records.find(r => {
    if (r.status !== "active") return false;
    const t = (r.consentType || "").toLowerCase().replace(/[\s_-]/g, "");
    return acceptableNeedles.some(n => t.includes(n));
  });
  if (active) return { ok: true, consentId: active.id };
  return { ok: false, reason: "Borrower has not granted an active consent record for affordability / credit / financial-data analysis." };
}

export async function computeAffordability(borrower: Borrower, opts: ComputeOpts = {}): Promise<{ assessment: AffordabilityAssessment; result: AffordabilityResult }> {
  // 0. Consent gate — borrower must have granted permission for affordability/financial-data analysis.
  if (!opts.skipConsentCheck) {
    const consent = await hasAffordabilityConsent(borrower.id, borrower);
    if (!consent.ok) {
      const err: any = new Error(consent.reason || "Borrower consent required for affordability assessment.");
      err.statusCode = 403;
      err.code = "CONSENT_REQUIRED";
      throw err;
    }
  }
  const periodDays = opts.periodDays || 90;
  const country = borrower.country || null;
  const rule = getAffordabilityRule(country);
  const currency = borrower.incomeCurrency || (country ? guessCurrency(country) : "GHS");
  const notes: string[] = [];

  // 1. Choose data source
  let txns: NormalisedTxn[] = [];
  let dataSource: AffordabilityResult["dataSource"] = "self_declared";
  let confidenceLabel: AffordabilityResult["confidenceLabel"] = "low";

  if (opts.source === "bank_statement_pdf" && opts.pdfBuffer) {
    txns = await parseBankStatementPdf(opts.pdfBuffer, currency);
    if (txns.length > 0) { dataSource = "bank_statement_pdf"; confidenceLabel = "medium"; notes.push(`Parsed ${txns.length} transactions from bank statement PDF.`); }
    else notes.push("PDF parser returned no transactions; falling back.");
  }

  if (txns.length === 0 && (opts.source === "open_banking" || opts.source === "auto" || !opts.source)) {
    try {
      const ob = await fetchOpenBankingTransactions(borrower, { provider: opts.openBankingProvider, accountId: opts.openBankingAccountId, periodDays });
      if (ob.transactions.length > 0) {
        txns = ob.transactions;
        // Mark stub data as self_declared (lowest trust) so downstream decisioning never treats synthetic data as verified open banking.
        dataSource = ob.account.provider === "stub" ? "self_declared" : "open_banking";
        confidenceLabel = ob.account.provider === "stub" ? "low" : "high";
        notes.push(`Open banking (${ob.account.provider}) returned ${txns.length} transactions for account ${ob.account.accountId}.`);
        if (ob.account.provider === "stub") notes.push("STUB / synthetic data — NOT a verified bank feed. Output is for demo only and must not be used for credit decisioning. Connect Mono/Stitch/Okra for verified results.");
      }
    } catch (err: any) {
      notes.push(`Open banking lookup failed: ${err.message}`);
    }
  }

  // MoMo fallback
  if (txns.length === 0 || opts.source === "momo_only") {
    const profile = await storage.getTelcoProfileByMsisdn(borrower.phone || "");
    if (profile) {
      const momo = await storage.getMomoTransactions(profile.id);
      if (momo.length > 0) {
        const momoTxns = momoToNormalised(momo);
        if (txns.length === 0) {
          txns = momoTxns;
          dataSource = "momo_only";
          confidenceLabel = "medium";
          notes.push(`MoMo-only path: ${momoTxns.length} transactions from ${profile.provider}.`);
        } else {
          txns = txns.concat(momoTxns);
          dataSource = "hybrid";
          notes.push(`Hybrid: combined banking + ${momoTxns.length} MoMo transactions.`);
        }
      }
    }
  }

  // 2. Classify income
  let incomeSources = classifyIncome(txns, currency);
  let grossIncomeMonthly = incomeSources.reduce((s, i) => s + i.amountMonthly, 0);

  // 3. Categorise expenses
  let expenses = await categoriseExpenses(txns, currency, opts.useLlmFallback);
  let totalExpensesMonthly = expenses.reduce((s, e) => s + e.amountMonthly, 0);

  // 4. Existing debt servicing — from credit accounts + debt_servicing expense bucket
  const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
  const activeAccts = accounts.filter(a => a.status === "current" || a.status === "delinquent");
  const debtFromAccounts = activeAccts.reduce((s, a) => s + (Number(a.scheduledInstallmentAmount) || 0), 0);
  const debtFromTxns = expenses.find(e => e.category === "debt_servicing")?.amountMonthly || 0;
  const existingDebtServiceMonthly = Math.max(debtFromAccounts, debtFromTxns);

  // 5. Self-declared fallback
  if (grossIncomeMonthly === 0) {
    const declared = parseFloat(borrower.monthlyIncome || "0");
    if (declared > 0) {
      grossIncomeMonthly = declared;
      incomeSources = [{
        sourceType: "other", description: "Self-declared income",
        amountMonthly: declared, currency, frequency: "monthly",
        confidence: 30, evidenceType: "self_declared",
      }];
      if (dataSource === "self_declared") confidenceLabel = "low";
      notes.push("Used self-declared income — no transaction-derived income detected.");
    }
  }

  // 6. Apply country rule
  const subsistence = grossIncomeMonthly * rule.subsistenceReservePct;
  const disposableIncomeMonthly = Math.max(0, grossIncomeMonthly - totalExpensesMonthly - existingDebtServiceMonthly);
  const debtToIncomeRatio = grossIncomeMonthly > 0 ? existingDebtServiceMonthly / grossIncomeMonthly : 0;
  const subsistenceHeadroom = Math.max(0, grossIncomeMonthly - subsistence - existingDebtServiceMonthly);
  const dtiHeadroom = Math.max(0, grossIncomeMonthly * rule.maxDti - existingDebtServiceMonthly);
  const maxRecommendedMonthlyRepayment = round2(Math.min(
    disposableIncomeMonthly * rule.maxDsrOfDisposable,
    subsistenceHeadroom,
    dtiHeadroom,
  ));
  const maxRecommendedNewCredit = round2(maxRecommendedMonthlyRepayment * rule.defaultTermMonths);

  // 7. Rating
  let affordabilityRating: AffordabilityResult["affordabilityRating"] = "unknown";
  if (grossIncomeMonthly > 0) {
    const dsr = existingDebtServiceMonthly / Math.max(1, grossIncomeMonthly);
    const dispRatio = disposableIncomeMonthly / Math.max(1, grossIncomeMonthly);
    if (dispRatio > 0.5 && dsr < 0.2) affordabilityRating = "strong";
    else if (dispRatio > 0.3 && dsr < rule.maxDti * 0.6) affordabilityRating = "adequate";
    else if (dispRatio > 0.1 && dsr < rule.maxDti) affordabilityRating = "tight";
    else affordabilityRating = "stressed";
  }

  const result: AffordabilityResult = {
    borrowerId: borrower.id,
    country,
    currency,
    dataSource,
    periodDays,
    grossIncomeMonthly: round2(grossIncomeMonthly),
    totalExpensesMonthly: round2(totalExpensesMonthly),
    existingDebtServiceMonthly: round2(existingDebtServiceMonthly),
    disposableIncomeMonthly: round2(disposableIncomeMonthly),
    debtToIncomeRatio: round4(debtToIncomeRatio),
    maxRecommendedNewCredit,
    maxRecommendedMonthlyRepayment,
    affordabilityRating,
    confidenceLabel,
    regulatoryRule: `${rule.regulator} — Max DSR ${(rule.maxDsrOfDisposable * 100).toFixed(0)}% of disposable, Max DTI ${(rule.maxDti * 100).toFixed(0)}%, term ${rule.defaultTermMonths}m, subsistence ${(rule.subsistenceReservePct * 100).toFixed(0)}%`,
    incomeSources,
    expenses,
    notes,
  };

  // 8. Persist snapshot — replace prior fine-grained rows for this borrower atomically
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  const assessment = await db.transaction(async (tx) => {
    await tx.delete(incomeSourcesTable).where(eq(incomeSourcesTable.borrowerId, borrower.id));
    await tx.delete(expenseCategorisationsTable).where(eq(expenseCategorisationsTable.borrowerId, borrower.id));
    if (incomeSources.length > 0) {
      await tx.insert(incomeSourcesTable).values(incomeSources.map(s => ({
        borrowerId: borrower.id,
        sourceType: s.sourceType,
        description: s.description,
        amountMonthly: s.amountMonthly.toFixed(2),
        currency: s.currency,
        frequency: s.frequency,
        confidence: s.confidence.toFixed(2),
        evidenceType: s.evidenceType,
        evidenceRef: s.evidenceRef || null,
        detectedFrom: dataSource,
        verifiedAt: new Date(),
        organizationId: borrower.organizationId || null,
      })));
    }
    if (expenses.length > 0) {
      await tx.insert(expenseCategorisationsTable).values(expenses.map(e => ({
        borrowerId: borrower.id,
        category: e.category,
        amountMonthly: e.amountMonthly.toFixed(2),
        currency: e.currency,
        periodDays,
        source: e.source,
        detail: e.detail || null,
        organizationId: borrower.organizationId || null,
      })));
    }
    const [created] = await tx.insert(affordabilityAssessmentsTable).values({
      borrowerId: borrower.id,
      country: result.country,
      currency,
      dataSource,
      periodDays,
      grossIncomeMonthly: result.grossIncomeMonthly.toFixed(2),
      totalExpensesMonthly: result.totalExpensesMonthly.toFixed(2),
      existingDebtServiceMonthly: result.existingDebtServiceMonthly.toFixed(2),
      disposableIncomeMonthly: result.disposableIncomeMonthly.toFixed(2),
      debtToIncomeRatio: result.debtToIncomeRatio.toFixed(4),
      maxRecommendedNewCredit: result.maxRecommendedNewCredit.toFixed(2),
      maxRecommendedMonthlyRepayment: result.maxRecommendedMonthlyRepayment.toFixed(2),
      affordabilityRating,
      confidenceLabel,
      regulatoryRule: result.regulatoryRule,
      inputsSnapshot: { transactionCount: txns.length, hasMomo: dataSource === "momo_only" || dataSource === "hybrid" } satisfies AffordabilityInputsSnapshot,
      outputsSnapshot: { incomeSources, expenses, notes } satisfies AffordabilityOutputsSnapshot,
      computedBy: opts.computedBy || null,
      expiresAt,
      organizationId: borrower.organizationId || null,
    }).returning();
    return created;
  });

  // 9. Verified-income write-back: only when income came from a real verified bank feed
  //    (open_banking with non-stub provider) and the value differs materially from the borrower's record.
  if (dataSource === "open_banking" && grossIncomeMonthly > 0) {
    const declared = parseFloat(borrower.monthlyIncome || "0");
    const drift = Math.abs(grossIncomeMonthly - declared) / Math.max(1, declared);
    if (declared === 0 || drift >= 0.05) {
      await storage.updateBorrower(borrower.id, {
        monthlyIncome: grossIncomeMonthly.toFixed(2),
        incomeCurrency: currency,
      });
      result.notes.push(`Borrower record updated with verified monthly income ${grossIncomeMonthly.toFixed(2)} ${currency} (was ${declared.toFixed(2)}).`);
    }
  }

  return { assessment, result };
}

// ==================== HELPERS ====================

function monthSpan(txns: NormalisedTxn[]): number {
  if (txns.length < 2) return 1;
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const days = (sorted[sorted.length - 1].date.getTime() - sorted[0].date.getTime()) / 86400000;
  return Math.max(1, days / 30);
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }

function guessCurrency(country: string): string {
  const map: Record<string, string> = {
    ghana: "GHS", nigeria: "NGN", kenya: "KES", "south africa": "ZAR", southafrica: "ZAR",
    rwanda: "RWF", tanzania: "TZS", uganda: "UGX", ethiopia: "ETB", liberia: "LRD",
    "sierra leone": "SLE", sierraleone: "SLE",
  };
  return map[country.toLowerCase()] || "USD";
}
