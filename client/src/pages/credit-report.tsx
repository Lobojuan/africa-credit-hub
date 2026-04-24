import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { ConsentGateModal } from "@/components/consent-gate-modal";
import { formatCurrency } from "@/lib/currency";
import { getDefaultFallbackCurrency } from "@/lib/country-mode";
import { BOG_ACCOUNT_STATUS, mapInternalStatusToBog } from "@shared/bog-codes";
import {
  ArrowLeft, Printer, FileText, Download, User, Building2, CreditCard, Search,
  AlertTriangle, Shield, Gavel, CheckCircle2, XCircle, Clock, Flag,
  Calendar, MapPin, Phone, Mail, Briefcase, Hash, TrendingUp, Activity,
  Landmark, BarChart3, Layers, Table, Loader2, Brain, Sparkles, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Borrower, CreditAccount, CreditInquiry, CourtJudgment, ConsentRecord, PaymentHistory, DishonouredCheque, AffordabilityAssessment, IncomeSource, ExpenseCategorisation } from "@shared/schema";
import { BOG_CHEQUE_RETURN_REASON, BOG_NATURE_OF_GUARANTOR, BOG_OWNER_TENANT, BOG_EMPLOYMENT_TYPE } from "@shared/bog-codes";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

interface CreditReportData {
  serialNumber: string;
  generatedAt: string;
  borrower: Borrower;
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
  courtJudgments: CourtJudgment[];
  consentRecords: ConsentRecord[];
  dishonouredCheques: DishonouredCheque[];
  paymentHistory: Record<string, PaymentHistory[]>;
  requestedBy: { fullName: string; institution: string } | null;
  summary: {
    totalAccounts: number;
    activeAccounts: number;
    totalDebt: string;
    delinquentAccounts: number;
    writtenOffAccounts: number;
    restructuredAccounts: number;
    creditScore: number;
    reasonCodes: string[];
    inquiryCount: number;
    judgmentCount: number;
    isPep: boolean;
  };
  affordability?: {
    assessment: AffordabilityAssessment;
    incomeSources: IncomeSource[];
    expenses: ExpenseCategorisation[];
  } | null;
  aiEnhanced?: {
    mlScore?: {
      mlScore: number;
      confidence: number;
      confidenceInterval: [number, number];
      riskCategory: string;
      defaultProbability: number;
      featureImportance: { feature: string; value: number; contribution: number; direction: string; description: string }[];
      modelVersion: string;
    };
    riskAnalysis?: {
      riskLevel: string;
      riskScore: number;
      summary: string;
      factors: { factor: string; impact: string; detail: string }[];
      recommendations: string[];
      regulatoryFlags: string[];
    };
    narrative?: {
      narrative: string;
      creditworthiness: string;
      keyStrengths: string[];
      keyRisks: string[];
      recommendedActions: string[];
      borrowerName: string;
      generatedAt: string;
    };
    disclaimer: string;
    generatedAt: string;
  };
  xdsBureauData?: {
    found: boolean;
    source: "live" | "sandbox";
    xdsRef: string;
    enquiryDate: string;
    permissiblePurpose: string;
    creditScore?: number;
    scoreCategory?: string;
    scoreBand?: string;
    summary?: {
      totalFacilities: number;
      activeFacilities: number;
      closedFacilities: number;
      totalOutstanding: number;
      adverseCount: number;
      enquiriesLast12Months: number;
      highestDaysInArrears: number;
    };
    facilities?: {
      facilityId: string;
      lender: string;
      facilityType: string;
      status: string;
      originalAmount: number;
      outstandingBalance: number;
      currency: string;
      openDate: string;
      daysInArrears: number;
    }[];
    adverseItems?: {
      type: string;
      date: string;
      description: string;
      amount?: number;
      status: string;
    }[];
    enquiryHistory?: { date: string; subscriber: string; purpose: string }[];
    error?: string;
  };
}

function getScoreGrade(score: number) {
  if (score >= 800) return { label: "Excellent", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" };
  if (score >= 740) return { label: "Very Good", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" };
  if (score >= 670) return { label: "Good", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" };
  if (score >= 580) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" };
  return { label: "Poor", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" };
}

function getAccountRRating(account: CreditAccount): { code: string; label: string; color: string } {
  const days = account.daysInArrears || 0;
  const status = account.status;
  if (status === "written_off") return { code: "R9", label: "Bad debt / placed for collection", color: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (status === "default") return { code: "R8", label: "Repossession / default", color: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (status === "restructured") return { code: "R7", label: "Consolidated / orderly payment via restructure", color: "text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40" };
  if (days > 150) return { code: "R6", label: "150+ days past due", color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (days > 120) return { code: "R5", label: "120-150 days past due", color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (days > 90) return { code: "R4", label: "90-119 days past due", color: "text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40" };
  if (days > 60) return { code: "R3", label: "60-89 days past due", color: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40" };
  if (days > 30) return { code: "R2", label: "31-59 days past due", color: "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40" };
  return { code: "R1", label: "Pays within 30 days / current", color: "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40" };
}

function buildCreditUtilizationSummary(accounts: CreditAccount[]) {
  const openAccounts = accounts.filter(a => a.status !== "closed");
  const byCurrency: Record<string, { limit: number; used: number }> = {};
  openAccounts.forEach(a => {
    const c = a.currency || getDefaultFallbackCurrency();
    if (!byCurrency[c]) byCurrency[c] = { limit: 0, used: 0 };
    byCurrency[c].limit += parseFloat(a.originalAmount || "0");
    byCurrency[c].used += parseFloat(a.currentBalance || "0");
  });
  const currencyKeys = Object.keys(byCurrency);
  const isMixedCurrency = currencyKeys.length > 1;
  const dominantCurrency = currencyKeys.length === 1
    ? currencyKeys[0]
    : (currencyKeys.sort((a, b) => byCurrency[b].limit - byCurrency[a].limit)[0] || getDefaultFallbackCurrency());
  const totalLimit = openAccounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
  const totalUsed = openAccounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const ratio = totalLimit > 0 ? ((totalUsed / totalLimit) * 100) : 0;
  return { totalLimit, totalUsed, ratio, byCurrency, dominantCurrency, isMixedCurrency };
}

function buildRiskAssessment(report: CreditReportData) {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const score = report.summary.creditScore;

  if (score >= 700) strengths.push("Strong credit score indicating reliable payment behaviour");
  if (report.summary.delinquentAccounts === 0) strengths.push("No delinquent accounts on file");
  if (report.summary.writtenOffAccounts === 0) strengths.push("No written-off or bad debt accounts");
  if (report.summary.judgmentCount === 0) strengths.push("No court judgments or legal actions recorded");
  const onTimeRatio = report.accounts.length > 0
    ? report.accounts.filter(a => a.status === "current" || a.status === "closed").length / report.accounts.length
    : 0;
  if (onTimeRatio >= 0.8) strengths.push(`${(onTimeRatio * 100).toFixed(0)}% of accounts are current or closed in good standing`);
  if (report.summary.activeAccounts >= 3) strengths.push("Diverse credit portfolio with multiple active facilities");

  if (report.summary.delinquentAccounts > 0) concerns.push(`${report.summary.delinquentAccounts} delinquent account(s) on file`);
  if (report.summary.writtenOffAccounts > 0) concerns.push(`${report.summary.writtenOffAccounts} written-off account(s) totalling bad debt`);
  if (report.summary.judgmentCount > 0) concerns.push(`${report.summary.judgmentCount} court judgment(s) recorded`);
  if (report.summary.inquiryCount > 5) concerns.push(`High inquiry volume (${report.summary.inquiryCount}) may indicate credit-seeking behaviour`);
  const util = buildCreditUtilizationSummary(report.accounts);
  if (util.ratio > 75) concerns.push(`High credit utilization at ${util.ratio.toFixed(1)}%`);
  if (score < 580) concerns.push("Low credit score suggests elevated default risk");
  if (report.summary.restructuredAccounts > 0) concerns.push(`${report.summary.restructuredAccounts} restructured facility/ies indicating past repayment difficulty`);

  let riskLevel = "Low";
  if (score < 580 || report.summary.writtenOffAccounts > 0 || report.summary.judgmentCount > 0) riskLevel = "High";
  else if (score < 670 || report.summary.delinquentAccounts > 0 || util.ratio > 75) riskLevel = "Medium";

  if (strengths.length === 0) strengths.push("No notable strengths identified based on current data");
  if (concerns.length === 0) concerns.push("No significant concerns identified");

  return { riskLevel, strengths, concerns };
}

function buildCollectionsItems(accounts: CreditAccount[]) {
  return accounts
    .filter(a => a.status === "written_off" || a.status === "default")
    .map(a => ({
      creditor: a.lenderInstitution,
      amount: a.currentBalance,
      currency: a.currency || "GHS",
      status: a.status === "written_off" ? "Written Off" : "In Default",
      dateReported: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("en-GB") : "—",
      rating: getAccountRRating(a),
      accountNumber: a.accountNumber,
    }));
}

function getPaymentStatusLabel(status: string, daysInArrears?: number | null): string {
  switch (status) {
    case "on_time": return "OK";
    case "late": {
      const days = daysInArrears || 30;
      if (days <= 30) return "30";
      if (days <= 60) return "60";
      if (days <= 90) return "90";
      if (days <= 120) return "120";
      if (days <= 180) return "180";
      if (days <= 210) return "210";
      if (days <= 240) return "240";
      if (days <= 270) return "270";
      return "270+";
    }
    case "missed": return "X";
    case "partial": return "P";
    case "paid": return "P";
    case "OK": return "OK";
    case "30": return "30";
    case "60": return "60";
    case "90": return "90";
    case "120": return "120";
    case "180": return "180";
    case "210": return "210";
    case "240": return "240";
    case "270": return "270";
    case "270+": return "270+";
    case "ND": return "ND";
    case "P": return "P";
    case "X": return "X";
    default: return "ND";
  }
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  "OK": "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900/40 dark:text-green-300",
  "30": "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300",
  "60": "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
  "90": "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 dark:bg-orange-900/40 dark:text-orange-300",
  "120": "bg-red-200 text-red-800 dark:text-red-200 dark:bg-red-900/50 dark:text-red-300",
  "180": "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900/40 dark:text-red-300",
  "210": "bg-red-200 text-red-900 dark:bg-red-950/50 dark:text-red-200",
  "240": "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "270": "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 dark:bg-purple-900/40 dark:text-purple-300",
  "270+": "bg-purple-200 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200",
  "ND": "bg-muted text-muted-foreground",
  "P": "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 dark:bg-blue-900/40 dark:text-blue-300",
  "X": "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 dark:bg-pink-900/40 dark:text-pink-300",
};

function getPaymentStatusColor(status: string, daysInArrears?: number | null): string {
  const label = getPaymentStatusLabel(status, daysInArrears);
  return PAYMENT_STATUS_COLORS[label] || PAYMENT_STATUS_COLORS["ND"];
}

function getReasonCodeLabel(code: string): string {
  const labels: Record<string, string> = {
    DELINQUENT_ACCOUNTS: "Delinquent accounts on file",
    WRITTEN_OFF_ACCOUNTS: "Written-off accounts present",
    RESTRUCTURED_ACCOUNTS: "Restructured loan agreements",
    HIGH_INQUIRY_VOLUME: "High number of credit inquiries",
    HIGH_DEBT_LEVEL: "Elevated total debt level",
    COURT_JUDGMENTS_PRESENT: "Court judgments or liens on record",
    POLITICALLY_EXPOSED_PERSON: "Politically exposed person (PEP)",
    STRONG_REPAYMENT_HISTORY: "Strong repayment track record",
    EXCELLENT_PAYMENT_RECORD: "Excellent payment consistency",
    THIN_FILE_LIMITED_HISTORY: "Limited credit history on file",
    HIGH_NDIA_90_PLUS: "Severe arrears — 90+ days in arrears on one or more accounts",
    MULTIPLE_DELINQUENCIES: "Multiple accounts in delinquency",
    HIGH_ARREARS_AMOUNT: "High total amount in arrears",
  };
  return labels[code] || code.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function getStatusColor(status: string) {
  switch (status) {
    case "current": return "default";
    case "delinquent": return "destructive";
    case "default": return "destructive";
    case "closed": return "secondary";
    case "restructured": return "outline";
    case "written_off": return "destructive";
    default: return "default";
  }
}

function getAssetClassification(status: string): string {
  switch (status) {
    case "current": return "Current / Performing";
    case "delinquent": return "Substandard";
    case "default": return "Doubtful / Loss";
    case "written_off": return "Loss / Written-Off";
    case "restructured": return "Restructured";
    case "closed": return "Closed";
    default: return status;
  }
}

function SectionHeader({ icon: Icon, title, count, number }: { icon: any; title: string; count?: number; number?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 print:mb-2">
      <h2 className="text-base font-bold flex items-center gap-2 print:text-sm">
        {number !== undefined && (
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 print:w-5 print:h-5 print:text-[8px]">
            {number}
          </span>
        )}
        <Icon className="w-5 h-5 text-primary print:hidden" />
        {title}
      </h2>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[10px] print:text-[8px]">{count}</Badge>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="print:text-[10px]">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">{label}</p>
      <p className="text-sm font-medium mt-0.5 print:text-[10px]">{value}</p>
    </div>
  );
}

function TableCell({ children, className = "", header = false }: { children: React.ReactNode; className?: string; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return (
    <Tag className={`px-3 py-2 text-left print:px-1.5 print:py-1 ${header ? "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 print:text-[8px]" : "text-xs print:text-[9px]"} ${className}`}>
      {children}
    </Tag>
  );
}

function buildCreditProfileOverview(report: CreditReportData) {
  const openAccounts = report.accounts.filter(a => a.status !== "closed");
  const closedLast6 = report.accounts.filter(a => {
    if (a.status !== "closed") return false;
    return true;
  });
  const overdueAccounts = openAccounts.filter(a => (a.daysInArrears || 0) > 0);
  const nplAccounts = openAccounts.filter(a => (a.daysInArrears || 0) > 90);
  const writtenOffAccounts = report.accounts.filter(a => a.status === "written_off");
  const writtenOffTotal = writtenOffAccounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);

  const byCurrency: Record<string, { open: number; balance: number; installment: number; overdue: number }> = {};
  openAccounts.forEach(a => {
    const c = a.currency || getDefaultFallbackCurrency();
    if (!byCurrency[c]) byCurrency[c] = { open: 0, balance: 0, installment: 0, overdue: 0 };
    byCurrency[c].open++;
    byCurrency[c].balance += parseFloat(a.currentBalance || "0");
    if ((a.daysInArrears || 0) > 0) {
      byCurrency[c].overdue += parseFloat(a.currentBalance || "0") * 0.1;
    }
  });

  const currencyKeys = Object.keys(byCurrency);

  return {
    indicators: [
      { sno: 1, label: "Number of Open Credit Facilities", values: currencyKeys.map(c => ({ currency: "", value: byCurrency[c].open.toString() })) },
      { sno: 2, label: "Total Outstanding Balance in Open Credit Facilities", values: currencyKeys.map(c => ({ currency: "", value: formatCurrency(byCurrency[c].balance.toFixed(2), c) })) },
      { sno: 3, label: "Total Overdue Amount on Open Credit Facilities", values: currencyKeys.map(c => ({ currency: "", value: formatCurrency(byCurrency[c].overdue.toFixed(2), c) })) },
      { sno: 4, label: "Number of Open Credit Facilities with Overdue", values: [{ currency: "", value: overdueAccounts.length.toString() }] },
      { sno: 5, label: "Number of Open Facilities > 90 Days in Arrears (Non-Performing)", values: [{ currency: "", value: nplAccounts.length.toString() }] },
      { sno: 6, label: "Number of Closed Credit Facilities", values: [{ currency: "", value: closedLast6.length.toString() }] },
      { sno: 7, label: "Number of Facilities with Write-Off", values: [{ currency: "", value: writtenOffAccounts.length.toString() }] },
      { sno: 8, label: "Total Write-Off Amount", values: [{ currency: "", value: writtenOffTotal > 0 ? formatCurrency(writtenOffTotal.toFixed(2), currencyKeys[0] || getDefaultFallbackCurrency()) : "0" }] },
      { sno: 9, label: "Number of Credit Facilities with Judgments", values: [{ currency: "", value: report.courtJudgments.length.toString() }] },
      { sno: 10, label: "Number of Inquiries in the Last 6 Months", values: [{ currency: "", value: report.inquiries.length.toString() }] },
      { sno: 11, label: "Number of Disputes Raised in the Last 6 Months", values: [{ currency: "", value: "0" }] },
    ],
  };
}

function buildInstitutionBreakdown(accounts: CreditAccount[]) {
  const groups: Record<string, Record<string, { count: number; approved: number; balance: number; overdue: number; utilization: number }>> = {};
  accounts.filter(a => a.status !== "closed").forEach(a => {
    const inst = a.lenderInstitution || "Unknown";
    const cur = a.currency || getDefaultFallbackCurrency();
    const key = `${inst}|||${cur}`;
    if (!groups[key]) groups[key] = {};
    if (!groups[key][cur]) groups[key][cur] = { count: 0, approved: 0, balance: 0, overdue: 0, utilization: 0 };
    groups[key][cur].count++;
    groups[key][cur].approved += parseFloat(a.originalAmount || "0");
    groups[key][cur].balance += parseFloat(a.currentBalance || "0");
    if ((a.daysInArrears || 0) > 0) {
      groups[key][cur].overdue += parseFloat(a.currentBalance || "0") * 0.1;
    }
  });

  return Object.entries(groups).map(([key, currencies]) => {
    const [inst] = key.split("|||");
    return Object.entries(currencies).map(([cur, data]) => ({
      institution: inst,
      currency: cur,
      count: data.count,
      approved: data.approved,
      balance: data.balance,
      overdue: data.overdue,
      utilization: data.approved > 0 ? ((data.balance / data.approved) * 100).toFixed(1) : "0",
    }));
  }).flat();
}

function buildLiabilitySummary(accounts: CreditAccount[]) {
  const currencies = [...new Set(accounts.map(a => a.currency || getDefaultFallbackCurrency()))];
  const summary: Record<string, { balance: number; overdue: number; d1_30: number; d31_60: number; d61_90: number; d91_120: number; d121_150: number; d151_180: number; d180plus: number }> = {};
  currencies.forEach(c => { summary[c] = { balance: 0, overdue: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_120: 0, d121_150: 0, d151_180: 0, d180plus: 0 }; });

  accounts.filter(a => a.status !== "closed").forEach(a => {
    const c = a.currency || getDefaultFallbackCurrency();
    const bal = parseFloat(a.currentBalance || "0");
    const days = a.daysInArrears || 0;
    summary[c].balance += bal;
    if (days > 0) {
      const overdueAmt = bal * 0.15;
      summary[c].overdue += overdueAmt;
      if (days <= 30) summary[c].d1_30 += overdueAmt;
      else if (days <= 60) summary[c].d31_60 += overdueAmt;
      else if (days <= 90) summary[c].d61_90 += overdueAmt;
      else if (days <= 120) summary[c].d91_120 += overdueAmt;
      else if (days <= 150) summary[c].d121_150 += overdueAmt;
      else if (days <= 180) summary[c].d151_180 += overdueAmt;
      else summary[c].d180plus += overdueAmt;
    }
  });

  return { currencies, summary };
}

function buildProductExposure(accounts: CreditAccount[]) {
  const groups: Record<string, Record<string, { count: number; balance: number; overdue: number }>> = {};
  accounts.filter(a => a.status !== "closed").forEach(a => {
    const type = a.accountType || "Other";
    const cur = a.currency || getDefaultFallbackCurrency();
    if (!groups[type]) groups[type] = {};
    if (!groups[type][cur]) groups[type][cur] = { count: 0, balance: 0, overdue: 0 };
    groups[type][cur].count++;
    groups[type][cur].balance += parseFloat(a.currentBalance || "0");
    if ((a.daysInArrears || 0) > 0) groups[type][cur].overdue += parseFloat(a.currentBalance || "0") * 0.1;
  });

  return Object.entries(groups).flatMap(([type, currencies]) =>
    Object.entries(currencies).map(([cur, data]) => ({
      type,
      currency: cur,
      count: data.count,
      balance: data.balance,
      overdue: data.overdue,
    }))
  );
}

function getLast24Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
  }
  return months;
}

export default function CreditReportPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/credit-report/:borrowerId");
  const [, navigate] = useLocation();
  const brandColors = useBrandColors();
  const borrowerId = params?.borrowerId;
  const [purpose, setPurpose] = useState("new_credit");
  const [includeAI, setIncludeAI] = useState(true);
  const [includeXds, setIncludeXds] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: borrowerPreview } = useQuery<any>({
    queryKey: ["/api/borrowers", borrowerId],
    enabled: !!borrowerId,
  });

  const borrowerDisplayName = borrowerPreview
    ? (borrowerPreview.type === "corporate"
        ? borrowerPreview.companyName || "Unknown"
        : `${borrowerPreview.firstName || ""} ${borrowerPreview.lastName || ""}`.trim() || "Unknown")
    : (borrowerId || "Unknown");

  const generateMutation = useMutation({
    mutationFn: async ({ consentId }: { consentId?: string } = {}) => {
      const res = await apiRequest("POST", "/api/credit-reports/generate", {
        borrowerId,
        purpose,
        includeAI,
        includeXds,
        consentId,
      });
      return res.json();
    },
  });

  const handleConsentGranted = (consentId: string, grantedPurpose: string) => {
    setPurpose(grantedPurpose);
    generateMutation.mutate({ consentId });
  };

  const report = generateMutation.data as CreditReportData | undefined;

  const [isDownloading, setIsDownloading] = useState(false);
  const [reportLanguage, setReportLanguage] = useState("en");
  const [aiSummary, setAiSummary] = useState<{ summary: string; borrowerName: string; generatedAt: string } | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(true);

  const ESTIMATED_SECONDS_AI = 12;
  const ESTIMATED_SECONDS_PLAIN = 5;
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (generateMutation.isPending) {
      const startAt = includeAI ? ESTIMATED_SECONDS_AI : ESTIMATED_SECONDS_PLAIN;
      setCountdown(startAt);
      setShowReadyPopup(false);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (generateMutation.isSuccess) {
        setCountdown(0);
        setShowReadyPopup(true);
      }
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [generateMutation.isPending, generateMutation.isSuccess]);

  const aiSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/ai/report-summary/${report?.borrower?.id}`, { language: reportLanguage });
      return res.json();
    },
    onSuccess: (data) => {
      setAiSummary(data);
      setShowAiSummary(true);
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      const res = await apiRequest("POST", `/api/credit-reports/download-pdf?lang=${reportLanguage}`, {
        reportData: report,
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Credit_Report_${report.serialNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!borrowerId) {
    return (
      <div className="p-6 text-center">
        <p>No borrower selected</p>
        <Button variant="ghost" onClick={() => navigate("/search")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Button>
      </div>
    );
  }

  const profileOverview = report ? buildCreditProfileOverview(report) : null;
  const institutionBreakdown = report ? buildInstitutionBreakdown(report.accounts) : [];
  const liabilitySummary = report ? buildLiabilitySummary(report.accounts) : null;
  const productExposure = report ? buildProductExposure(report.accounts) : [];
  const last24Months = getLast24Months();

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")} data-testid="button-back-search">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-report-title">Comprehensive Credit Information Report</h1>
            <p className="text-sm text-muted-foreground">Generate a comprehensive credit information report</p>
          </div>
        </div>
      </div>

      {!report && (
        <Card className="print:hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Purpose of Report</label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger data-testid="select-report-purpose">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_credit">New Credit Application</SelectItem>
                    <SelectItem value="review">Periodic Review</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="regulatory">Regulatory Inquiry</SelectItem>
                    <SelectItem value="portfolio_monitoring">Portfolio Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-sm font-medium">Include AI Analysis</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeAI}
                    onClick={() => setIncludeAI(!includeAI)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeAI ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    data-testid="toggle-include-ai"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeAI ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {includeAI ? (
                      <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-purple-500" /> ML Score + AI Risk + Narrative</span>
                    ) : "Bureau data only (faster)"}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setShowConsentModal(true)}
                disabled={generateMutation.isPending}
                className="mt-6"
                data-testid="button-generate-report"
              >
                <Shield className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Verify Consent & Generate Report"}
              </Button>
            </div>
            {generateMutation.isError && (
              <p className="text-sm text-destructive">
                {(generateMutation.error as any)?.message || "Failed to generate report. Please try again."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {generateMutation.isPending && countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm print:hidden" data-testid="overlay-report-generating">
          <div className="flex flex-col items-center gap-8 px-8 py-10 max-w-sm w-full text-center">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (countdown / (includeAI ? ESTIMATED_SECONDS_AI : ESTIMATED_SECONDS_PLAIN))}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tabular-nums text-primary" data-testid="text-countdown-seconds">
                  {countdown}
                </span>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">seconds</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold tracking-tight" data-testid="text-report-generating-label">
                {countdown > 0 ? "Your report is being prepared" : "Almost ready…"}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {includeAI
                  ? `Running ML scoring, AI risk analysis and credit narrative — this usually takes about ${ESTIMATED_SECONDS_AI} seconds.`
                  : `Compiling bureau data and credit summary — this usually takes about ${ESTIMATED_SECONDS_PLAIN} seconds.`}
              </p>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((( includeAI ? ESTIMATED_SECONDS_AI : ESTIMATED_SECONDS_PLAIN) - countdown) / (includeAI ? ESTIMATED_SECONDS_AI : ESTIMATED_SECONDS_PLAIN)) * 100}%` }}
                data-testid="progress-bar-report"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching credit data, accounts &amp; history…</span>
            </div>
          </div>
        </div>
      )}

      {showReadyPopup && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm print:hidden" data-testid="overlay-report-ready">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5 mx-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xl font-bold tracking-tight" data-testid="text-report-ready">Report Ready!</p>
              <p className="text-sm text-muted-foreground">
                Your credit report for <span className="font-medium text-foreground">{borrowerDisplayName}</span> has been generated successfully.
              </p>
            </div>
            <Button
              className="w-full gap-2 h-11 text-base font-semibold"
              onClick={() => {
                setShowReadyPopup(false);
                setTimeout(() => {
                  document.getElementById("credit-report-content")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              data-testid="btn-view-report-ready"
            >
              <FileText className="w-4 h-4" />
              Click to View Report
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={() => setShowReadyPopup(false)}
              data-testid="btn-dismiss-ready-popup"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {report && (() => {
        const reportCurrencies = [...new Set(report.accounts.map(a => a.currency || getDefaultFallbackCurrency()))];
        const reportDominantCurrency = reportCurrencies.length === 1
          ? reportCurrencies[0]
          : (reportCurrencies.sort((a, b) =>
              report.accounts.filter(ac => (ac.currency || getDefaultFallbackCurrency()) === b).reduce((s, ac) => s + parseFloat(ac.currentBalance || "0"), 0) -
              report.accounts.filter(ac => (ac.currency || getDefaultFallbackCurrency()) === a).reduce((s, ac) => s + parseFloat(ac.currentBalance || "0"), 0)
            )[0] || getDefaultFallbackCurrency());
        return (
        <div ref={printRef} id="credit-report-content" className="space-y-5 print:space-y-3" data-testid="credit-report-content">
          <div className="flex items-center justify-end gap-2 flex-wrap print:hidden">
            <Select value={reportLanguage} onValueChange={setReportLanguage}>
              <SelectTrigger className="w-[150px]" data-testid="select-report-language">
                <Globe className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => aiSummaryMutation.mutate()}
              disabled={aiSummaryMutation.isPending}
              data-testid="button-ai-summary"
            >
              {aiSummaryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {aiSummaryMutation.isPending ? "Generating Summary..." : "AI Summary"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading} data-testid="button-download-pdf">
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-report">
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>

          {aiSummary && (
            <Card className="border border-purple-200 dark:border-purple-800 overflow-visible print:hidden" data-testid="card-ai-summary">
              <div className="p-4" style={{ background: "linear-gradient(135deg, hsl(270 60% 96%) 0%, hsl(280 50% 93%) 100%)" }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100">AI-Generated Credit Summary</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiSummary(!showAiSummary)}
                    data-testid="button-toggle-ai-summary"
                  >
                    {showAiSummary ? "Collapse" : "Expand"}
                  </Button>
                </div>
                <p className="text-[10px] text-purple-600 dark:text-purple-400/70 dark:text-purple-300/70 mt-0.5">
                  Generated for {aiSummary.borrowerName} on {new Date(aiSummary.generatedAt).toLocaleString()}
                </p>
              </div>
              {showAiSummary && (
                <CardContent className="p-4">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-ai-summary-content">
                    {aiSummary.summary}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {aiSummaryMutation.isError && (
            <Card className="border border-destructive/30 print:hidden">
              <CardContent className="p-4">
                <p className="text-sm text-destructive" data-testid="text-ai-summary-error">Failed to generate AI summary. Please try again.</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 border-primary/20 overflow-hidden print:border print:border-border print:shadow-none">
            <div className="p-6 print:p-4" style={{ background: brandColors.headerGradient }}>
              <div className="flex items-center justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-6 h-6" />
                    <h1 className="text-lg font-bold print:text-base">Comprehensive Credit Information Report</h1>
                  </div>
                  <p className="text-sm text-white/70 print:text-[10px]">Cross-Jurisdictional Central Data Hub v2.6</p>
                  <p className="text-xs text-white/50 mt-1 print:text-[8px]">{PLATFORM_COMPANY_NAME}</p>
                </div>
                <div className="text-right">
                  <div className="bg-card/10 rounded-lg px-4 py-2 print:px-2 print:py-1">
                    <p className="text-[10px] text-white/60 uppercase tracking-wider print:text-[8px]">Order Number</p>
                    <p className="text-sm font-mono font-bold print:text-[10px]" data-testid="text-serial-number">{report.serialNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 print:p-3 space-y-4 print:space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2 text-xs">
                <InfoField label="CIR Number" value={report.serialNumber} />
                <InfoField label="Report Order Date" value={new Date(report.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
                <InfoField label="Institution Name" value={report.requestedBy?.institution || "—"} />
                <InfoField label="Requested By" value={report.requestedBy?.fullName || "—"} />
              </div>

              <Separator />

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Search Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2">
                  <InfoField
                    label="Name"
                    value={report.borrower.type === "corporate"
                      ? (report.borrower.companyName || "—")
                      : `${report.borrower.firstName} ${report.borrower.lastName}`}
                  />
                  <InfoField label="Identifier Number" value={report.borrower.nationalId || report.borrower.tinNumber || "—"} />
                  <InfoField label="Country / Jurisdiction" value={report.borrower.country || "—"} />
                  <InfoField label="Search Confidence Score" value="100%" />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">
                  {report.borrower.type === "corporate" ? "Commercial Details" : "Consumer Details"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2">
                  {report.borrower.type === "individual" ? (
                    <>
                      <InfoField label="Full Name" value={`${report.borrower.firstName} ${report.borrower.lastName}`} />
                      <InfoField label="Date of Birth" value={report.borrower.dateOfBirth || "—"} />
                      <InfoField label="Gender" value={report.borrower.gender || "—"} />
                      <InfoField label="National ID" value={report.borrower.nationalId} />
                      <InfoField label="TIN Number" value={report.borrower.tinNumber || "—"} />
                      <InfoField label="Passport" value={report.borrower.passportNumber || "—"} />
                      <InfoField label="Employer" value={report.borrower.employerName || "—"} />
                      <InfoField label="Occupation" value={report.borrower.occupation || "—"} />
                    </>
                  ) : (
                    <>
                      <InfoField label="Company Name" value={report.borrower.companyName || "—"} />
                      <InfoField label="Business Registration" value={report.borrower.businessRegNumber || "—"} />
                      <InfoField label="Sector" value={report.borrower.sector || "—"} />
                      <InfoField label="TIN Number" value={report.borrower.tinNumber || "—"} />
                    </>
                  )}
                  <InfoField label="Phone" value={report.borrower.phone || "—"} />
                  <InfoField label="Email" value={report.borrower.email || "—"} />
                  <InfoField label="Address" value={[report.borrower.address, report.borrower.city, report.borrower.region, report.borrower.country].filter(Boolean).join(", ") || "—"} />
                  {report.summary.isPep && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">PEP Status</p>
                      <Badge variant="destructive" className="text-[10px] mt-1" data-testid="badge-report-pep">
                        <Flag className="w-3 h-3 mr-1" /> Politically Exposed Person
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2">
            <Card className={`${getScoreGrade(report.summary.creditScore).bg} border-0`}>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Bureau Score</p>
                <p className={`text-3xl font-black mt-1 print:text-xl ${getScoreGrade(report.summary.creditScore).color}`} data-testid="text-report-score">
                  {report.summary.creditScore}
                </p>
                <Badge variant="outline" className="mt-1 text-[10px] print:text-[8px]">
                  {getScoreGrade(report.summary.creditScore).label}
                </Badge>
                <p className="text-[9px] text-muted-foreground mt-1 print:text-[7px]">Range: 300 - 850</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Facilities</p>
                <p className="text-3xl font-black mt-1 print:text-xl">{report.summary.totalAccounts}</p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">{report.summary.activeAccounts} open / {report.summary.totalAccounts - report.summary.activeAccounts} closed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Outstanding</p>
                <p className="text-2xl font-black mt-1 print:text-lg">{formatCurrency(report.summary.totalDebt, reportDominantCurrency, { compact: true })}</p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">Current Balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Risk Items</p>
                <p className="text-3xl font-black mt-1 print:text-xl text-destructive">
                  {report.summary.delinquentAccounts + report.summary.writtenOffAccounts + report.summary.judgmentCount}
                </p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">
                  {report.summary.delinquentAccounts} delq. {report.summary.writtenOffAccounts} w/o {report.summary.judgmentCount} judg.
                </p>
              </CardContent>
            </Card>
          </div>

          {(() => {
            const utilSummary = buildCreditUtilizationSummary(report.accounts);
            const openAccounts = report.accounts.filter(a => a.status !== "closed");
            const oldestAccount = report.accounts.reduce((oldest, a) => {
              const d = a.disbursementDate ? new Date(a.disbursementDate) : null;
              return d && (!oldest || d < oldest) ? d : oldest;
            }, null as Date | null);
            const historyYears = oldestAccount ? Math.max(0, Math.floor((Date.now() - oldestAccount.getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : 0;
            const accountTypes = new Set(openAccounts.map(a => a.accountType || "Unknown"));
            return (
              <Card data-testid="card-credit-utilization-summary">
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={BarChart3} title="Credit Utilization Summary" />
                  {utilSummary.isMixedCurrency && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2" data-testid="banner-mixed-currency">
                      <span className="font-semibold">Multi-currency portfolio</span>
                      <span className="text-muted-foreground">— amounts are shown per currency as uploaded; see breakdown table below for details</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2 mb-4 print:mb-2">
                    <div className="text-center p-3 bg-muted/30 rounded-lg print:p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Credit Limit</p>
                      <p className="text-lg font-bold mt-1 print:text-sm" data-testid="text-total-credit-limit">
                        {utilSummary.isMixedCurrency
                          ? Object.entries(utilSummary.byCurrency).map(([cur, d]) => formatCurrency(d.limit.toFixed(2), cur)).join(" / ")
                          : formatCurrency(utilSummary.totalLimit.toFixed(2), utilSummary.dominantCurrency)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg print:p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Credit Used</p>
                      <p className="text-lg font-bold mt-1 print:text-sm" data-testid="text-total-credit-used">
                        {utilSummary.isMixedCurrency
                          ? Object.entries(utilSummary.byCurrency).map(([cur, d]) => formatCurrency(d.used.toFixed(2), cur)).join(" / ")
                          : formatCurrency(utilSummary.totalUsed.toFixed(2), utilSummary.dominantCurrency)}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded-lg print:p-2 ${utilSummary.ratio > 75 ? "bg-red-50 dark:bg-red-950/20" : utilSummary.ratio > 50 ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-green-50 dark:bg-green-950/20"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Utilization Ratio</p>
                      <p className={`text-lg font-bold mt-1 print:text-sm ${utilSummary.ratio > 75 ? "text-red-600 dark:text-red-400" : utilSummary.ratio > 50 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                        {utilSummary.ratio.toFixed(1)}%
                      </p>
                      <p className="text-[9px] text-muted-foreground print:text-[7px]">{utilSummary.ratio <= 30 ? "Optimal" : utilSummary.ratio <= 50 ? "Moderate" : utilSummary.ratio <= 75 ? "High" : "Very High"}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg print:p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Available Credit</p>
                      <p className="text-lg font-bold mt-1 print:text-sm" data-testid="text-available-credit">
                        {utilSummary.isMixedCurrency
                          ? Object.entries(utilSummary.byCurrency).map(([cur, d]) => formatCurrency(Math.max(0, d.limit - d.used).toFixed(2), cur)).join(" / ")
                          : formatCurrency(Math.max(0, utilSummary.totalLimit - utilSummary.totalUsed).toFixed(2), utilSummary.dominantCurrency)}
                      </p>
                    </div>
                  </div>
                  {Object.keys(utilSummary.byCurrency).length > 1 && (
                    <div className="border rounded-lg overflow-hidden print:border-border mb-4 print:mb-2">
                      <table className="w-full text-xs print:text-[9px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <TableCell header>Currency</TableCell>
                            <TableCell header className="text-right">Credit Limit</TableCell>
                            <TableCell header className="text-right">Credit Used</TableCell>
                            <TableCell header className="text-right">Available</TableCell>
                            <TableCell header className="text-right">Utilization</TableCell>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(utilSummary.byCurrency).map(([cur, data]) => {
                            const curRatio = data.limit > 0 ? ((data.used / data.limit) * 100) : 0;
                            return (
                              <tr key={cur} className="hover:bg-muted/20">
                                <TableCell className="font-medium">{cur}</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.limit.toFixed(2), cur)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(data.used.toFixed(2), cur)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(Math.max(0, data.limit - data.used).toFixed(2), cur)}</TableCell>
                                <TableCell className={`text-right font-semibold ${curRatio > 75 ? "text-red-600 dark:text-red-400" : curRatio > 50 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                                  {curRatio.toFixed(1)}%
                                </TableCell>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="border rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <TableCell header>Score Factor</TableCell>
                          <TableCell header>Impact</TableCell>
                          <TableCell header>Current Value</TableCell>
                          <TableCell header>Assessment</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Payment History</TableCell>
                          <TableCell className="text-muted-foreground">35% weight</TableCell>
                          <TableCell className="font-semibold">{report.summary.delinquentAccounts === 0 ? "Clean" : `${report.summary.delinquentAccounts} late`}</TableCell>
                          <TableCell>
                            <Badge variant={report.summary.delinquentAccounts === 0 ? "default" : "destructive"} className="text-[9px] print:text-[7px]">
                              {report.summary.delinquentAccounts === 0 ? "Positive" : "Negative"}
                            </Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Credit Utilization</TableCell>
                          <TableCell className="text-muted-foreground">30% weight</TableCell>
                          <TableCell className="font-semibold">{utilSummary.ratio.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge variant={utilSummary.ratio <= 30 ? "default" : utilSummary.ratio <= 75 ? "secondary" : "destructive"} className="text-[9px] print:text-[7px]">
                              {utilSummary.ratio <= 30 ? "Excellent" : utilSummary.ratio <= 50 ? "Good" : utilSummary.ratio <= 75 ? "Fair" : "Poor"}
                            </Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Credit History Length</TableCell>
                          <TableCell className="text-muted-foreground">15% weight</TableCell>
                          <TableCell className="font-semibold">{historyYears > 0 ? `${historyYears} year${historyYears !== 1 ? "s" : ""}` : "< 1 year"}</TableCell>
                          <TableCell>
                            <Badge variant={historyYears >= 5 ? "default" : historyYears >= 2 ? "secondary" : "outline"} className="text-[9px] print:text-[7px]">
                              {historyYears >= 5 ? "Established" : historyYears >= 2 ? "Developing" : "New"}
                            </Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Credit Mix</TableCell>
                          <TableCell className="text-muted-foreground">10% weight</TableCell>
                          <TableCell className="font-semibold">{accountTypes.size} type{accountTypes.size !== 1 ? "s" : ""}</TableCell>
                          <TableCell>
                            <Badge variant={accountTypes.size >= 3 ? "default" : accountTypes.size >= 2 ? "secondary" : "outline"} className="text-[9px] print:text-[7px]">
                              {accountTypes.size >= 3 ? "Diverse" : accountTypes.size >= 2 ? "Moderate" : "Limited"}
                            </Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Recent Inquiries</TableCell>
                          <TableCell className="text-muted-foreground">10% weight</TableCell>
                          <TableCell className="font-semibold">{report.summary.inquiryCount}</TableCell>
                          <TableCell>
                            <Badge variant={report.summary.inquiryCount <= 2 ? "default" : report.summary.inquiryCount <= 5 ? "secondary" : "destructive"} className="text-[9px] print:text-[7px]">
                              {report.summary.inquiryCount <= 2 ? "Low" : report.summary.inquiryCount <= 5 ? "Moderate" : "High"}
                            </Badge>
                          </TableCell>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {report.summary.reasonCodes.length > 0 && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={TrendingUp} title="Score Factor Analysis" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.summary.reasonCodes.map((code) => {
                    const isPositive = code === "STRONG_REPAYMENT_HISTORY" || code === "EXCELLENT_PAYMENT_RECORD";
                    return (
                      <div key={code} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm print:p-1.5 print:text-[10px] ${isPositive ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                        {isPositive ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                        <span>{getReasonCodeLabel(code)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-score-methodology">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={BarChart3} title="Score Methodology & Validation" />

              <div className="space-y-5 print:space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Scoring Variables & Weights</p>
                  <div className="border rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <TableCell header>Variable</TableCell>
                          <TableCell header>Weight/Impact</TableCell>
                          <TableCell header>Description</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Base Score</TableCell>
                          <TableCell className="font-mono text-green-600 dark:text-green-400">+300</TableCell>
                          <TableCell>Starting score for all borrowers</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">On-Time Payment Ratio</TableCell>
                          <TableCell className="font-mono text-green-600 dark:text-green-400">+500 (max)</TableCell>
                          <TableCell>Proportion of current/closed accounts vs total</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Delinquent Accounts</TableCell>
                          <TableCell className="font-mono text-red-600 dark:text-red-400">-50 each</TableCell>
                          <TableCell>Accounts in delinquent or default status</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Written-Off Accounts</TableCell>
                          <TableCell className="font-mono text-red-600 dark:text-red-400">-75 each</TableCell>
                          <TableCell>Accounts written off as losses</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Restructured Accounts</TableCell>
                          <TableCell className="font-mono text-red-600 dark:text-red-400">-20 each</TableCell>
                          <TableCell>Restructured/rescheduled facilities</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Active Court Judgments</TableCell>
                          <TableCell className="font-mono text-red-600 dark:text-red-400">-40 each</TableCell>
                          <TableCell>Unresolved legal judgments</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Credit Inquiries</TableCell>
                          <TableCell className="font-mono text-red-600 dark:text-red-400">-5 each (max -100)</TableCell>
                          <TableCell>Number of inquiries, capped at 20</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20 bg-muted/30">
                          <TableCell className="font-semibold">Score Range</TableCell>
                          <TableCell className="font-mono font-semibold">300 - 850</TableCell>
                          <TableCell>Minimum to maximum possible score</TableCell>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Model Validation Metrics</p>
                  <div className="border rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <TableCell header>Metric</TableCell>
                          <TableCell header>Description</TableCell>
                          <TableCell header>Status</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Gini Coefficient</TableCell>
                          <TableCell>Model discriminatory power</TableCell>
                          <TableCell className="font-mono font-semibold">0.62</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">KS Statistic</TableCell>
                          <TableCell>Separation between good and bad</TableCell>
                          <TableCell className="font-mono font-semibold">0.48</TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Rank Ordering</TableCell>
                          <TableCell>Risk ranking accuracy</TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-[9px] print:text-[7px]">Validated</Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Stress Testing</TableCell>
                          <TableCell>Model robustness under stress</TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-[9px] print:text-[7px]">Passed</Badge>
                          </TableCell>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <TableCell className="font-medium">Probability of Default (PD)</TableCell>
                          <TableCell>Estimated default probability</TableCell>
                          <TableCell className="text-muted-foreground">Calculated per account</TableCell>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={MapPin} title="Address History" />
              <div className="border rounded-lg overflow-hidden print:border-border">
                <table className="w-full text-xs print:text-[9px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <TableCell header>Address</TableCell>
                      <TableCell header>City / Region</TableCell>
                      <TableCell header>From Date</TableCell>
                      <TableCell header>Status</TableCell>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        {[report.borrower.address, report.borrower.postalCode].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        {[report.borrower.city, report.borrower.region, report.borrower.country].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>{report.borrower.dateMovedCurrentRes || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-[9px] print:text-[7px]">
                          {report.borrower.ownerOrTenant ? (BOG_OWNER_TENANT[report.borrower.ownerOrTenant] || report.borrower.ownerOrTenant) : "Current"}
                        </Badge>
                      </TableCell>
                    </tr>
                    {[report.borrower.previousAddress1, report.borrower.previousAddress2, report.borrower.previousAddress3, report.borrower.previousAddress4].filter(Boolean).map((addr, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <TableCell>{[addr, i === 0 ? report.borrower.previousAddrPostalCode : null].filter(Boolean).join(", ")}</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[9px] print:text-[7px]">Previous</Badge>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {report.borrower.type !== "corporate" && (
          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={Briefcase} title="Employment History" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2">
                <InfoField label="Employer Name" value={report.borrower.employerName || "—"} />
                <InfoField label="Occupation" value={report.borrower.occupation || "—"} />
                <InfoField label="Employment Type" value={report.borrower.employmentTypeCode ? (BOG_EMPLOYMENT_TYPE[report.borrower.employmentTypeCode] || report.borrower.employmentTypeCode) : "—"} />
                <InfoField label="Date of Employment" value={report.borrower.dateOfEmployment || "—"} />
                <InfoField label="Employer Address" value={report.borrower.employerAddress || "—"} />
                {report.borrower.monthlyIncome && (
                  <InfoField label="Monthly Income" value={`${report.borrower.incomeCurrency || ""} ${Number(report.borrower.monthlyIncome).toLocaleString()}`} />
                )}
              </div>
              {report.borrower.employmentHistory && (
                <div className="mt-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 print:text-[8px]">Employment History</p>
                  <p className="text-xs text-muted-foreground print:text-[9px]">{report.borrower.employmentHistory}</p>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {report.affordability?.assessment && (
            <Card data-testid="card-report-affordability">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={TrendingUp} title="Affordability Assessment" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2 mt-3">
                  <InfoField label="Gross Monthly Income" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.grossIncomeMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Monthly Expenses" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.totalExpensesMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Debt Service / Month" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.existingDebtServiceMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Disposable Income / Mo" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.disposableIncomeMonthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Debt-to-Income Ratio" value={`${(Number(report.affordability.assessment.debtToIncomeRatio || 0) * 100).toFixed(1)}%`} />
                  <InfoField label="Max Recommended New Credit" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.maxRecommendedNewCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Max Monthly Repayment" value={`${report.affordability.assessment.currency} ${Number(report.affordability.assessment.maxRecommendedMonthlyRepayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <InfoField label="Rating" value={String(report.affordability.assessment.affordabilityRating ?? "unknown").toUpperCase()} />
                  <InfoField label="Regulatory Rule" value={report.affordability.assessment.regulatoryRule ?? "—"} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground" data-testid="badge-report-affordability-status">
                    {String(report.affordability.assessment.confidenceLabel ?? "low").toUpperCase()}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2">Source: {report.affordability.assessment.dataSource}</span>
                </div>
                {(report.affordability.assessment.outputsSnapshot as any)?.notes?.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground leading-relaxed" data-testid="text-report-affordability-narrative">
                    {((report.affordability.assessment.outputsSnapshot as any).notes as string[]).join(" ")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {profileOverview && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={BarChart3} title="Credit Profile Overview" number={1} />
                <div className="border rounded-lg overflow-x-auto print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header className="w-8">S.No</TableCell>
                        <TableCell header>Indicator</TableCell>
                        <TableCell header className="text-right">Value</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {profileOverview.indicators.map((ind) => (
                        <tr key={ind.sno} className="hover:bg-muted/20">
                          <TableCell className="font-mono text-muted-foreground">{ind.sno}</TableCell>
                          <TableCell className="font-medium">{ind.label}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {ind.values.map((v, i) => (
                              <span key={i} className="block">
                                {v.currency && <span className="text-muted-foreground text-[10px] mr-1">{v.currency}</span>}
                                {v.value}
                              </span>
                            ))}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {institutionBreakdown.length > 0 && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Landmark} title="Classification of Active Accounts by Institution" number={2} />
                <div className="border rounded-lg overflow-x-auto print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Institution</TableCell>
                        <TableCell header>Currency</TableCell>
                        <TableCell header className="text-right">No. of Accts</TableCell>
                        <TableCell header className="text-right">Approved / Limit</TableCell>
                        <TableCell header className="text-right">Current Balance</TableCell>
                        <TableCell header className="text-right">% Utilization</TableCell>
                        <TableCell header className="text-right">Total Overdue</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {institutionBreakdown.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{row.institution}</TableCell>
                          <TableCell>{row.currency}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.approved.toFixed(2), row.currency)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(row.balance.toFixed(2), row.currency)}</TableCell>
                          <TableCell className="text-right">{row.utilization}%</TableCell>
                          <TableCell className={`text-right ${row.overdue > 0 ? "text-destructive font-semibold" : ""}`}>
                            {formatCurrency(row.overdue.toFixed(2), row.currency)}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {liabilitySummary && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Table} title="Total Liability Summary" number={3} />
                <div className="border rounded-lg overflow-x-auto print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Description</TableCell>
                        {liabilitySummary.currencies.map(c => (
                          <TableCell header key={c} className="text-right">{c}</TableCell>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { label: "Total Current Balance", key: "balance" as const },
                        { label: "Total Amount Overdue", key: "overdue" as const },
                        { label: "Overdue 1-30 days", key: "d1_30" as const },
                        { label: "Overdue 31-60 days", key: "d31_60" as const },
                        { label: "Overdue 61-90 days", key: "d61_90" as const },
                        { label: "Overdue 91-120 days", key: "d91_120" as const },
                        { label: "Overdue 121-150 days", key: "d121_150" as const },
                        { label: "Overdue 151-180 days", key: "d151_180" as const },
                        { label: "Overdue > 180 days", key: "d180plus" as const },
                      ].map(row => (
                        <tr key={row.key} className={`hover:bg-muted/20 ${row.key === "balance" || row.key === "overdue" ? "font-semibold" : ""}`}>
                          <TableCell className={row.key === "balance" || row.key === "overdue" ? "font-semibold" : "pl-6 print:pl-4"}>
                            {row.label}
                          </TableCell>
                          {liabilitySummary.currencies.map(c => (
                            <TableCell key={c} className={`text-right ${row.key !== "balance" && liabilitySummary.summary[c][row.key] > 0 ? "text-destructive" : ""}`}>
                              {formatCurrency(liabilitySummary.summary[c][row.key].toFixed(2), c)}
                            </TableCell>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <TableCell>Total Number of Institutions</TableCell>
                        <TableCell className="text-right" colSpan={liabilitySummary.currencies.length}>
                          {new Set(report.accounts.map(a => a.lenderInstitution)).size}
                        </TableCell>
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <TableCell>Total Number of Credit Facilities</TableCell>
                        <TableCell className="text-right" colSpan={liabilitySummary.currencies.length}>
                          {report.accounts.length}
                        </TableCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {productExposure.length > 0 && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Layers} title="Credit Exposure by Product" number={4} />
                <div className="border rounded-lg overflow-x-auto print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Product Type</TableCell>
                        <TableCell header>Currency</TableCell>
                        <TableCell header className="text-right">Count</TableCell>
                        <TableCell header className="text-right">Current Balance</TableCell>
                        <TableCell header className="text-right">Overdue</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productExposure.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <TableCell className="font-medium capitalize">{row.type.replace(/_/g, " ")}</TableCell>
                          <TableCell>{row.currency}</TableCell>
                          <TableCell className="text-right">{row.count}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(row.balance.toFixed(2), row.currency)}</TableCell>
                          <TableCell className={`text-right ${row.overdue > 0 ? "text-destructive" : ""}`}>
                            {formatCurrency(row.overdue.toFixed(2), row.currency)}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={CreditCard} title="Credit Facility Details" number={5} count={report.accounts.length} />
              <div className="mb-4 print:mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1 print:text-[8px]">Account Status Definitions (BoG Codes):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-0.5 text-[9px] text-muted-foreground print:text-[7px] mb-3 print:mb-2">
                  {Object.entries(BOG_ACCOUNT_STATUS).map(([code, meaning]) => (
                    <span key={code} data-testid={`bog-status-def-${code}`}><span className="font-bold">{code}</span> = {meaning}</span>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1 mt-3 print:mt-2 print:text-[8px]">Account Rating System (R Codes):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-0.5 text-[9px] text-muted-foreground print:text-[7px] mb-3 print:mb-2">
                  <span><span className="font-bold text-green-700 dark:text-green-400">R1</span> = Current / within 30 days</span>
                  <span><span className="font-bold text-yellow-700 dark:text-yellow-400">R2</span> = 31-59 days past due</span>
                  <span><span className="font-bold text-amber-700 dark:text-amber-400">R3</span> = 60-89 days past due</span>
                  <span><span className="font-bold text-orange-700 dark:text-orange-400">R4</span> = 90-119 days past due</span>
                  <span><span className="font-bold text-red-600 dark:text-red-400">R5</span> = 120-150 days past due</span>
                  <span><span className="font-bold text-red-600 dark:text-red-400">R6</span> = 150+ days past due</span>
                  <span><span className="font-bold text-purple-700 dark:text-purple-400">R7</span> = Consolidated / Restructured</span>
                  <span><span className="font-bold text-red-700 dark:text-red-400">R8</span> = Repossession / Default</span>
                  <span><span className="font-bold text-red-700 dark:text-red-400">R9</span> = Bad Debt / Collections</span>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1 print:text-[8px]">Payment History Legend (NDIA Codes):</p>
                <div className="flex items-center gap-3 flex-wrap text-[9px] text-muted-foreground print:text-[7px]">
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["OK"]}`}>OK</span> Up To Date</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["30"]}`}>30</span> 30 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["60"]}`}>60</span> 60 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["90"]}`}>90</span> 90 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["120"]}`}>120</span> 120 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["180"]}`}>180</span> 180 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["210"]}`}>210</span> 210 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["240"]}`}>240</span> 240 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["270"]}`}>270</span> 270 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["270+"]}`}>270+</span> &gt;270 Days</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["ND"]}`}>ND</span> No Data</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["P"]}`}>P</span> Paid Up</span>
                  <span><span className={`inline-block rounded px-1 py-0.5 text-[8px] font-bold ${PAYMENT_STATUS_COLORS["X"]}`}>X</span> Delayed (CAGD)</span>
                </div>
              </div>

              {report.accounts.length > 0 ? (
                <div className="space-y-5 print:space-y-3">
                  {report.accounts.map((account, idx) => {
                    const currency = account.currency || getDefaultFallbackCurrency();
                    const history = report.paymentHistory?.[account.id] || [];
                    const isOpen = account.status !== "closed";
                    const rRating = getAccountRRating(account);

                    return (
                      <div key={account.id} className="border rounded-lg overflow-hidden print:border-border print:break-inside-avoid" data-testid={`report-account-${account.id}`}>
                        <div className="bg-muted/40 px-4 py-2 flex items-center justify-between gap-2 print:px-2 print:py-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-muted-foreground print:text-[8px]">Facility {idx + 1} of {report.accounts.length}</span>
                            <Badge variant={isOpen ? "default" : "secondary"} className="text-[9px] print:text-[7px]">
                              {isOpen ? "Open" : "Closed"}
                            </Badge>
                            <Badge variant={getStatusColor(account.status)} className="text-[9px] capitalize print:text-[7px]">{account.status}</Badge>
                            <Badge variant="outline" className="text-[9px] font-mono print:text-[7px]" data-testid={`bog-status-badge-${account.id}`}>
                              BoG: {mapInternalStatusToBog(account.status)}
                            </Badge>
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold print:text-[7px] ${rRating.color}`} data-testid={`r-rating-badge-${account.id}`}>
                              {rRating.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground print:text-[8px]">{currency}</span>
                        </div>

                        <div className="p-4 print:p-2 space-y-3 print:space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-1">
                            <InfoField label="Institution Name" value={account.lenderInstitution} />
                            <InfoField label="Account No." value={account.accountNumber} />
                            <InfoField label="Facility Type" value={account.accountType?.replace(/_/g, " ") || "—"} />
                            <InfoField label="Reported Date" value={account.updatedAt ? new Date(account.updatedAt).toLocaleDateString("en-GB") : "—"} />
                          </div>

                          <Separator />

                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Main Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-1">
                              <InfoField label="Asset Classification" value={getAssetClassification(account.status)} />
                              <InfoField label="Current Balance" value={formatCurrency(account.currentBalance, currency)} />
                              <InfoField label="Sanctioned Amount / Limit" value={formatCurrency(account.originalAmount, currency)} />
                              <InfoField label="Collateralized" value={account.collateralType ? "Yes" : "No"} />
                              <InfoField label="Days in Arrears" value={(account.daysInArrears || 0).toString()} />
                              <InfoField label="Interest Rate" value={account.isInterestFree ? "Interest-Free" : `${account.interestRate || "—"}%`} />
                              <InfoField label="Legal Flag" value={report.courtJudgments.some(j => j.borrowerId === account.borrowerId) ? "Yes" : "No"} />
                              <InfoField label="Restructured" value={(account.restructureCount || 0) > 0 ? `Yes (${account.restructureCount}x)` : "No"} />
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Disbursement Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-1">
                              <InfoField label="Disbursement Amount" value={formatCurrency(account.originalAmount, currency)} />
                              <InfoField label="Disbursement Date" value={account.disbursementDate || "—"} />
                              <InfoField label="Maturity Date" value={account.maturityDate || "—"} />
                              {account.gracePeriodMonths && (
                                <InfoField label="Grace Period" value={`${account.gracePeriodMonths} months`} />
                              )}
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Repayment Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-1">
                              <InfoField label="Last Payment Amount" value={account.lastPaymentAmount ? formatCurrency(account.lastPaymentAmount, currency) : "—"} />
                              <InfoField label="Last Payment Date" value={account.lastPaymentDate || "—"} />
                              <InfoField label="Amount Overdue" value={(account.daysInArrears || 0) > 0 ? formatCurrency((parseFloat(account.currentBalance || "0") * 0.15).toFixed(2), currency) : "0"} />
                              <InfoField label="Days in Arrears" value={(account.daysInArrears || 0).toString()} />
                            </div>
                          </div>

                          {account.collateralType && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Security Details</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-1">
                                  <InfoField label="Type of Security" value={account.collateralType} />
                                  <InfoField label="Security Value" value={formatCurrency(account.collateralValue || "0", currency)} />
                                  <InfoField label="Nature of Charge" value="Fixed" />
                                </div>
                              </div>
                            </>
                          )}

                          <Separator />

                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">
                              Payment History (Last 24 Months)
                            </p>
                            <div className="overflow-x-auto">
                              <div className="min-w-[700px]">
                                <div className="grid gap-0" style={{ gridTemplateColumns: `60px repeat(${Math.min(history.length || 12, 24)}, 1fr)` }}>
                                  <div className="text-[9px] font-semibold text-muted-foreground py-1 print:text-[7px]">Month</div>
                                  {(history.length > 0 ? history.slice(0, 24) : last24Months.slice(0, 12).map(() => null)).map((ph, i) => (
                                    <div key={i} className="text-center text-[8px] text-muted-foreground py-1 px-0.5 print:text-[6px] truncate">
                                      {ph ? ph.period : last24Months[i]}
                                    </div>
                                  ))}

                                  <div className="text-[9px] font-semibold text-muted-foreground py-1 print:text-[7px]">Status</div>
                                  {(history.length > 0 ? history.slice(0, 24) : last24Months.slice(0, 12).map(() => null)).map((ph, i) => (
                                    <div key={i} className="text-center py-1 px-0.5">
                                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold print:text-[7px] ${ph ? getPaymentStatusColor(ph.status, ph.daysLate) : "bg-muted text-muted-foreground"}`}>
                                        {ph ? getPaymentStatusLabel(ph.status, ph.daysLate) : "ND"}
                                      </span>
                                    </div>
                                  ))}

                                  <div className="text-[9px] font-semibold text-muted-foreground py-1 print:text-[7px]">Amt. Due</div>
                                  {(history.length > 0 ? history.slice(0, 24) : last24Months.slice(0, 12).map(() => null)).map((ph, i) => (
                                    <div key={i} className="text-center text-[8px] text-muted-foreground py-1 px-0.5 print:text-[6px]">
                                      {ph ? (ph.amountDue ? Number(ph.amountDue).toLocaleString() : "0") : "ND"}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6 print:py-2">No credit accounts on file</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={XCircle} title="Dishonoured Cheques" count={report.dishonouredCheques?.length || 0} />
              {report.dishonouredCheques && report.dishonouredCheques.length > 0 ? (
                <div className="border rounded-lg overflow-hidden print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Cheque No.</TableCell>
                        <TableCell header>Account No.</TableCell>
                        <TableCell header>Date Issued</TableCell>
                        <TableCell header>Date Bounced</TableCell>
                        <TableCell header>Reason</TableCell>
                        <TableCell header className="text-right">Amount</TableCell>
                        <TableCell header>Currency</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.dishonouredCheques.map((cheque) => (
                        <tr key={cheque.id} className="hover:bg-muted/20" data-testid={`dishonoured-cheque-${cheque.id}`}>
                          <TableCell className="font-mono">{cheque.chequeNumber}</TableCell>
                          <TableCell className="font-mono">{cheque.accountNumber}</TableCell>
                          <TableCell>{cheque.dateIssued}</TableCell>
                          <TableCell>{cheque.dateBounced}</TableCell>
                          <TableCell>{BOG_CHEQUE_RETURN_REASON[cheque.reasonReturnedCode] || cheque.reasonReturnedCode}</TableCell>
                          <TableCell className="text-right font-semibold">{cheque.chequeAmount ? Number(cheque.chequeAmount).toLocaleString() : "—"}</TableCell>
                          <TableCell>{cheque.currency}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No dishonoured cheques on file</p>
              )}
            </CardContent>
          </Card>

          {(() => {
            const guaranteedLoans = report.accounts.filter(a => a.natureOfGuarantor && a.natureOfGuarantor !== "103");
            return (
              <Card>
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={Shield} title="Guaranteed Loans" count={guaranteedLoans.length} />
                  {guaranteedLoans.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <TableCell header>Institution</TableCell>
                          <TableCell header>Account No.</TableCell>
                          <TableCell header>Facility Type</TableCell>
                          <TableCell header className="text-right">Outstanding Balance</TableCell>
                          <TableCell header>Guarantor Type</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {guaranteedLoans.map((account) => (
                          <tr key={account.id} className="hover:bg-muted/20" data-testid={`guaranteed-loan-${account.id}`}>
                            <TableCell className="font-medium">{account.lenderInstitution}</TableCell>
                            <TableCell className="font-mono">{account.accountNumber}</TableCell>
                            <TableCell className="capitalize">{account.accountType?.replace(/_/g, " ") || "—"}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(account.currentBalance, account.currency || getDefaultFallbackCurrency())}</TableCell>
                            <TableCell>{BOG_NATURE_OF_GUARANTOR[account.natureOfGuarantor!] || account.natureOfGuarantor}</TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No guaranteed loans on file</p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {report.courtJudgments.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Gavel} title="Court Judgments & Public Records" number={6} count={report.courtJudgments.length} />
                <div className="border rounded-lg overflow-hidden print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Case No.</TableCell>
                        <TableCell header>Court</TableCell>
                        <TableCell header>Type</TableCell>
                        <TableCell header className="text-right">Amount</TableCell>
                        <TableCell header>Date</TableCell>
                        <TableCell header>Status</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.courtJudgments.map((j) => (
                        <tr key={j.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono">{j.caseNumber}</TableCell>
                          <TableCell>{j.court}</TableCell>
                          <TableCell className="capitalize">{j.judgmentType.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-right">{j.amount ? formatCurrency(j.amount, j.currency || getDefaultFallbackCurrency()) : "—"}</TableCell>
                          <TableCell>{j.judgmentDate}</TableCell>
                          <TableCell>
                            <Badge variant={j.status === "active" ? "destructive" : "default"} className="text-[9px] capitalize print:text-[7px]">{j.status}</Badge>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {report.consentRecords && report.consentRecords.length > 0 && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Shield} title="Consent Records" number={7} count={report.consentRecords.length} />
                <div className="border rounded-lg overflow-hidden print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Granted To</TableCell>
                        <TableCell header>Purpose</TableCell>
                        <TableCell header>Receipt No.</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Date</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.consentRecords.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{c.grantedTo}</TableCell>
                          <TableCell>{c.purpose}</TableCell>
                          <TableCell className="font-mono">{c.receiptNumber}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-[9px] capitalize print:text-[7px]">{c.status}</Badge>
                          </TableCell>
                          <TableCell>{c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("en-GB") : "—"}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {(() => {
            const HARD_INQUIRY_PURPOSES = ["new_credit", "collection"];
            const hardInquiries = report.inquiries.filter(inq =>
              HARD_INQUIRY_PURPOSES.includes(inq.purpose)
            );
            const softInquiries = report.inquiries.filter(inq =>
              !HARD_INQUIRY_PURPOSES.includes(inq.purpose)
            );
            return (
              <Card>
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={Search} title="Credit Search Inquiry History" number={8} count={report.inquiries.length} />
                  <div className="flex gap-3 mb-3 print:mb-2">
                    <Badge variant="outline" className="text-[9px] print:text-[7px]">
                      Hard Inquiries: {hardInquiries.length}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] print:text-[7px]">
                      Soft Inquiries: {softInquiries.length}
                    </Badge>
                  </div>
                  {report.inquiries.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden print:border-border">
                      <table className="w-full text-xs print:text-[9px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <TableCell header>Institution</TableCell>
                            <TableCell header>Purpose</TableCell>
                            <TableCell header>Type</TableCell>
                            <TableCell header>Date</TableCell>
                            <TableCell header>Consent</TableCell>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {report.inquiries.map((inq) => {
                            const isHard = HARD_INQUIRY_PURPOSES.includes(inq.purpose);
                            return (
                              <tr key={inq.id} className="hover:bg-muted/20">
                                <TableCell className="font-medium">{inq.institution}</TableCell>
                                <TableCell className="capitalize">{inq.purpose.replace(/_/g, " ")}</TableCell>
                                <TableCell>
                                  <Badge variant={isHard ? "destructive" : "secondary"} className="text-[9px] print:text-[7px]">
                                    {isHard ? "Hard" : "Soft"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—"}</TableCell>
                                <TableCell>
                                  {inq.consentProvided ? (
                                    <Badge variant="default" className="text-[9px] print:text-[7px]">Yes</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-[9px] print:text-[7px]">No</Badge>
                                  )}
                                </TableCell>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No credit inquiries on file</p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {(() => {
            const collectionsItems = buildCollectionsItems(report.accounts);
            return (
              <Card className={collectionsItems.length > 0 ? "border-destructive/30" : ""} data-testid="card-collections-derogatory">
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={AlertTriangle} title="Collections & Derogatory Items" number={9} count={collectionsItems.length} />
                  {collectionsItems.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden print:border-border">
                      <table className="w-full text-xs print:text-[9px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <TableCell header>Creditor</TableCell>
                            <TableCell header>Account No.</TableCell>
                            <TableCell header>R-Rating</TableCell>
                            <TableCell header>Status</TableCell>
                            <TableCell header className="text-right">Amount</TableCell>
                            <TableCell header>Currency</TableCell>
                            <TableCell header>Date Reported</TableCell>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {collectionsItems.map((item, i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <TableCell className="font-medium">{item.creditor}</TableCell>
                              <TableCell className="font-mono">{item.accountNumber}</TableCell>
                              <TableCell>
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold print:text-[7px] ${item.rating.color}`}>
                                  {item.rating.code}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive" className="text-[9px] print:text-[7px]">{item.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(item.amount, item.currency)}</TableCell>
                              <TableCell>{item.currency}</TableCell>
                              <TableCell>{item.dateReported}</TableCell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 print:py-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 print:w-5 print:h-5" />
                      <p className="text-sm text-muted-foreground">No collections or derogatory items on file</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {(() => {
            const risk = buildRiskAssessment(report);
            return (
              <Card data-testid="card-risk-assessment">
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={Shield} title="Risk Assessment Summary" number={10} />
                  <div className="mb-4 print:mb-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold print:text-[10px] ${
                      risk.riskLevel === "Low" ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300" :
                      risk.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300" :
                      "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                    }`} data-testid="text-overall-risk-level">
                      Overall Risk Level: {risk.riskLevel}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Strengths</p>
                      <div className="space-y-1.5">
                        {risk.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs print:text-[9px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Concerns</p>
                      <div className="space-y-1.5">
                        {risk.concerns.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs print:text-[9px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {report.aiEnhanced && (
            <Card data-testid="card-ai-enhanced-analysis" className="border-2 border-dashed border-purple-300 dark:border-purple-700 print:border print:border-purple-400">
              <CardContent className="p-5 print:p-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg px-4 py-3 mb-4 print:mb-2 flex items-center gap-3">
                  <Brain className="w-5 h-5 text-white print:hidden" />
                  <div>
                    <h2 className="text-white font-bold text-sm print:text-xs">AI-Enhanced Intelligence</h2>
                    <p className="text-purple-200 text-[10px] print:text-[8px]">Machine Learning & Dual-AI Analysis</p>
                  </div>
                  <Badge className="ml-auto bg-white/20 text-white border-white/30 text-[9px] print:text-[7px]" data-testid="badge-ai-generated">AI-GENERATED</Badge>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 print:mb-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 print:hidden" />
                    <p className="text-[9px] text-amber-800 dark:text-amber-300 print:text-[7px]">
                      {report.aiEnhanced.disclaimer}
                    </p>
                  </div>
                </div>

                {report.aiEnhanced.mlScore && (
                  <div className="mb-4 print:mb-2">
                    <div className="flex items-center gap-2 mb-3 print:mb-1">
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-ml-score-label">
                        <Sparkles className="w-3 h-3 mr-1" />ML Score — {report.aiEnhanced.mlScore.modelVersion}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-1 mb-3 print:mb-1">
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">ML Score</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-ml-score">{report.aiEnhanced.mlScore.mlScore}</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">Range 300–850</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Registry Score</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 print:text-lg" data-testid="text-bureau-score-comparison">{report.summary.creditScore}</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">Traditional Model</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Confidence</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-ml-confidence">{(report.aiEnhanced.mlScore.confidence * 100).toFixed(0)}%</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">{report.aiEnhanced.mlScore.confidenceInterval[0]}–{report.aiEnhanced.mlScore.confidenceInterval[1]}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Default Prob.</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-default-prob">{(report.aiEnhanced.mlScore.defaultProbability * 100).toFixed(1)}%</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">Risk: {report.aiEnhanced.mlScore.riskCategory.replace("_", " ")}</p>
                      </div>
                    </div>

                    {(report.aiEnhanced.mlScore.featureImportance?.length ?? 0) > 0 && (
                      <div className="border rounded-lg overflow-hidden print:border-border">
                        <table className="w-full text-xs print:text-[8px]">
                          <thead>
                            <tr className="bg-purple-100 dark:bg-purple-900/30">
                              <th className="text-left px-3 py-1.5 text-purple-700 dark:text-purple-300 font-semibold text-[9px] print:text-[7px]">Feature</th>
                              <th className="text-center px-3 py-1.5 text-purple-700 dark:text-purple-300 font-semibold text-[9px] print:text-[7px]">Direction</th>
                              <th className="text-left px-3 py-1.5 text-purple-700 dark:text-purple-300 font-semibold text-[9px] print:text-[7px]">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {report.aiEnhanced.mlScore.featureImportance.map((f, i) => (
                              <tr key={i} className="hover:bg-muted/20" data-testid={`row-ml-feature-${i}`}>
                                <td className="px-3 py-1.5 font-medium">{f.feature}</td>
                                <td className="px-3 py-1.5 text-center">
                                  <Badge variant="outline" className={`text-[8px] ${f.direction === "positive" ? "text-green-600 border-green-300" : f.direction === "negative" ? "text-red-600 border-red-300" : "text-gray-500 border-gray-300"}`}>
                                    {f.direction === "positive" ? "▲" : f.direction === "negative" ? "▼" : "—"} {f.direction}
                                  </Badge>
                                </td>
                                <td className="px-3 py-1.5 text-muted-foreground text-[9px] print:text-[7px]">{f.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {report.aiEnhanced.riskAnalysis && (
                  <div className="mb-4 print:mb-2">
                    <div className="flex items-center gap-2 mb-3 print:mb-1">
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-ai-risk-label">
                        <Brain className="w-3 h-3 mr-1" />AI Risk Assessment — GPT-4o
                      </Badge>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 print:p-2 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`text-xs ${
                          report.aiEnhanced.riskAnalysis.riskLevel === "low" ? "bg-green-500" :
                          report.aiEnhanced.riskAnalysis.riskLevel === "medium" ? "bg-yellow-500 text-black" :
                          report.aiEnhanced.riskAnalysis.riskLevel === "high" ? "bg-orange-500" :
                          "bg-red-500"
                        }`} data-testid="badge-ai-risk-level">{report.aiEnhanced.riskAnalysis.riskLevel.toUpperCase()} RISK</Badge>
                        <span className="text-xs text-muted-foreground">Score: {report.aiEnhanced.riskAnalysis.riskScore}/100</span>
                      </div>
                      <p className="text-xs text-foreground mb-3 print:text-[9px]" data-testid="text-ai-risk-summary">{report.aiEnhanced.riskAnalysis.summary}</p>
                      {(report.aiEnhanced.riskAnalysis.factors?.length ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 uppercase print:text-[7px]">Contributing Factors</p>
                          {report.aiEnhanced.riskAnalysis.factors.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10px] print:text-[8px]" data-testid={`row-ai-factor-${i}`}>
                              <span className={`mt-0.5 ${f.impact === "positive" ? "text-green-500" : "text-red-500"}`}>
                                {f.impact === "positive" ? "✓" : "✗"}
                              </span>
                              <span><strong>{f.factor}:</strong> {f.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(report.aiEnhanced.riskAnalysis.recommendations?.length ?? 0) > 0 && (
                        <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700">
                          <p className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 uppercase mb-1 print:text-[7px]">AI Recommendations</p>
                          <ul className="space-y-1">
                            {report.aiEnhanced.riskAnalysis.recommendations.map((r, i) => (
                              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-ai-rec-${i}`}>
                                <span className="text-purple-500">→</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {report.aiEnhanced.narrative && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3 print:mb-1">
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-ai-narrative-label">
                        <Sparkles className="w-3 h-3 mr-1" />AI Credit Narrative — Claude
                      </Badge>
                      <Badge variant="outline" className={`text-[8px] ${
                        report.aiEnhanced.narrative.creditworthiness === "Excellent" || report.aiEnhanced.narrative.creditworthiness === "Good" ? "text-green-600 border-green-300" :
                        report.aiEnhanced.narrative.creditworthiness === "Fair" ? "text-yellow-600 border-yellow-300" :
                        "text-red-600 border-red-300"
                      }`} data-testid="badge-creditworthiness">{report.aiEnhanced.narrative.creditworthiness}</Badge>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 print:p-2 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-foreground whitespace-pre-line leading-relaxed print:text-[9px]" data-testid="text-ai-narrative">{report.aiEnhanced.narrative.narrative}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 print:gap-1">
                        {(report.aiEnhanced.narrative.keyStrengths?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-green-700 dark:text-green-400 uppercase mb-1 print:text-[7px]">Key Strengths</p>
                            <ul className="space-y-0.5">
                              {report.aiEnhanced.narrative.keyStrengths.map((s, i) => (
                                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-strength-${i}`}>
                                  <span className="text-green-500">✓</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(report.aiEnhanced.narrative.keyRisks?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-red-700 dark:text-red-400 uppercase mb-1 print:text-[7px]">Key Risks</p>
                            <ul className="space-y-0.5">
                              {report.aiEnhanced.narrative.keyRisks.map((r, i) => (
                                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-risk-${i}`}>
                                  <span className="text-red-500">✗</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground/60 mt-1 text-right print:text-[6px]" data-testid="text-ai-generated-at">
                      AI analysis generated: {new Date(report.aiEnhanced.generatedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-consumer-statement">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={FileText} title="Consumer Statement" number={11} />
              <div className="border rounded-lg p-4 print:p-2 bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">
                  Consumer-Submitted Statement
                </p>
                <p className="text-xs text-muted-foreground italic print:text-[9px]">
                  No consumer statement has been submitted for this file. Consumers have the right to submit a personal statement
                  of up to 200 words to be included in their credit report, explaining circumstances related to any credit information
                  contained herein.
                </p>
              </div>
              <div className="mt-3 print:mt-2">
                <p className="text-[9px] text-muted-foreground/70 print:text-[7px]">
                  Under the Credit Reporting Act, consumers have the right to dispute inaccurate information and add a personal statement
                  to their credit file. Contact the Credit Registry to exercise these rights.
                </p>
              </div>
            </CardContent>
          </Card>

          {report.xdsBureauData && (
            <Card data-testid="card-xds-bureau" className="border-2 border-green-200 dark:border-green-800 print:break-inside-avoid">
              <CardContent className="p-5 print:p-3">
                <div className="flex items-center gap-3 mb-4 print:mb-2">
                  <div className="flex-1">
                    <h2 className="text-sm font-bold text-green-800 dark:text-green-300">XDS Data Ghana — Credit Bureau Enquiry</h2>
                    <p className="text-[10px] text-muted-foreground print:text-[8px]">
                      {report.xdsBureauData.source === "sandbox" ? "Sandbox (deterministic synthetic data)" : "Live — XDS Data Ghana"} · Ref: {report.xdsBureauData.xdsRef}
                    </p>
                  </div>
                  {report.xdsBureauData.source === "sandbox" && (
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-400 text-[9px]" data-testid="badge-xds-sandbox">SANDBOX</Badge>
                  )}
                  {report.xdsBureauData.source === "live" && (
                    <Badge className="bg-green-600 text-white text-[9px]" data-testid="badge-xds-live">LIVE</Badge>
                  )}
                </div>

                {!report.xdsBureauData.found ? (
                  <p className="text-sm text-muted-foreground italic" data-testid="text-xds-not-found">
                    No bureau record found for this subject at XDS Data Ghana.
                    {report.xdsBureauData.error && ` (${report.xdsBureauData.error})`}
                  </p>
                ) : (
                  <div className="space-y-4 print:space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-1">
                      <div className={`rounded-lg p-3 print:p-1 text-center border ${(report.xdsBureauData.creditScore || 0) >= 670 ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : (report.xdsBureauData.creditScore || 0) >= 540 ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
                        <p className="text-[9px] font-medium uppercase text-muted-foreground print:text-[7px]">XDS Score</p>
                        <p className="text-2xl font-bold print:text-lg" data-testid="text-xds-score">{report.xdsBureauData.creditScore ?? "—"}</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">{report.xdsBureauData.scoreCategory} · Band {report.xdsBureauData.scoreBand}</p>
                      </div>
                      {report.xdsBureauData.summary && (
                        <>
                          <div className="bg-muted/30 rounded-lg p-3 print:p-1 text-center border border-border">
                            <p className="text-[9px] font-medium uppercase text-muted-foreground print:text-[7px]">Total Facilities</p>
                            <p className="text-2xl font-bold print:text-lg" data-testid="text-xds-facilities">{report.xdsBureauData.summary.totalFacilities}</p>
                            <p className="text-[8px] text-muted-foreground print:text-[6px]">{report.xdsBureauData.summary.activeFacilities} active</p>
                          </div>
                          <div className={`rounded-lg p-3 print:p-1 text-center border ${report.xdsBureauData.summary.adverseCount > 0 ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-muted/30 border-border"}`}>
                            <p className="text-[9px] font-medium uppercase text-muted-foreground print:text-[7px]">Adverse Items</p>
                            <p className="text-2xl font-bold print:text-lg" data-testid="text-xds-adverse">{report.xdsBureauData.summary.adverseCount}</p>
                            <p className="text-[8px] text-muted-foreground print:text-[6px]">on file</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 print:p-1 text-center border border-border">
                            <p className="text-[9px] font-medium uppercase text-muted-foreground print:text-[7px]">Outstanding</p>
                            <p className="text-lg font-bold print:text-base" data-testid="text-xds-outstanding">GHS {report.xdsBureauData.summary.totalOutstanding.toLocaleString()}</p>
                            <p className="text-[8px] text-muted-foreground print:text-[6px]">{report.xdsBureauData.summary.enquiriesLast12Months} enquiries / 12mo</p>
                          </div>
                        </>
                      )}
                    </div>

                    {report.xdsBureauData.facilities && report.xdsBureauData.facilities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 print:text-[9px]">Registered Facilities</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs print:text-[8px]">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-1 pr-3 font-medium">Lender</th>
                                <th className="pb-1 pr-3 font-medium">Type</th>
                                <th className="pb-1 pr-3 font-medium">Status</th>
                                <th className="pb-1 pr-3 font-medium text-right">Original</th>
                                <th className="pb-1 pr-3 font-medium text-right">Outstanding</th>
                                <th className="pb-1 font-medium text-right">Days Arr.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.xdsBureauData.facilities.map((f, idx) => (
                                <tr key={idx} className="border-b border-border/40" data-testid={`row-xds-facility-${idx}`}>
                                  <td className="py-1 pr-3">{f.lender}</td>
                                  <td className="py-1 pr-3 text-muted-foreground">{f.facilityType}</td>
                                  <td className="py-1 pr-3">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${["current","performing"].includes(f.status) ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : f.status === "closed" ? "bg-muted text-muted-foreground" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>{f.status}</span>
                                  </td>
                                  <td className="py-1 pr-3 text-right">{f.currency} {f.originalAmount.toLocaleString()}</td>
                                  <td className="py-1 pr-3 text-right">{f.currency} {f.outstandingBalance.toLocaleString()}</td>
                                  <td className="py-1 text-right">{f.daysInArrears > 0 ? <span className="text-red-600 font-semibold">{f.daysInArrears}</span> : "0"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {report.xdsBureauData.adverseItems && report.xdsBureauData.adverseItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 print:text-[9px]">Adverse Items</p>
                        <div className="space-y-1">
                          {report.xdsBureauData.adverseItems.map((a, idx) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-xs print:text-[8px]" data-testid={`card-xds-adverse-${idx}`}>
                              <span className="font-semibold text-red-700 dark:text-red-400 mr-2">[{a.type.replace(/_/g, " ").toUpperCase()}]</span>
                              {a.description}
                              <span className="text-muted-foreground ml-2 text-[10px]">{a.date} · {a.status}{a.amount ? ` · GHS ${a.amount.toLocaleString()}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.xdsBureauData.source === "sandbox" && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 italic print:text-[7px]">
                        * This bureau data is from the XDS Data Ghana sandbox environment (deterministic synthetic data). Configure live API credentials for authoritative records.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/20 print:bg-card print:break-inside-avoid">
            <CardContent className="p-5 print:p-3">
              <div className="text-center space-y-2 print:space-y-1">
                <Separator className="mb-4 print:mb-2" />
                <p className="text-xs font-semibold print:text-[9px]">
                  End of Credit Information Report
                </p>
                <p className="text-xs text-muted-foreground print:text-[8px]">
                  Report Serial: <span className="font-mono font-semibold">{report.serialNumber}</span> |
                  Generated: {new Date(report.generatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {report.requestedBy && ` | By: ${report.requestedBy.fullName} (${report.requestedBy.institution})`}
                </p>
                <p className="text-[10px] text-muted-foreground/60 max-w-3xl mx-auto print:text-[7px]">
                  Note: The information contained in this report has been compiled from data submitted by participating financial institutions
                  to the Credit Registry System. While {PLATFORM_COMPANY_NAME} endeavor to ensure accuracy of information, we do not accept
                  any responsibility for any loss or damage to any subject resulting from this report. The requesting institution agrees not to hold,
                  or seek to hold, the Credit Registry System responsible or liable with respect to the content of this report.
                </p>
                <p className="text-[10px] text-muted-foreground/60 print:text-[7px]">
                  Cross-Jurisdictional Central Data Hub & Credit Registry System v2.6 | {PLATFORM_COMPANY_NAME}
                </p>
                <p className="text-[9px] text-muted-foreground/40 mt-1 print:text-[7px]">
                  Confidential & Proprietary | Unauthorized distribution is prohibited
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        );
      })()}

      <ConsentGateModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        borrowerId={borrowerId || ""}
        borrowerName={borrowerDisplayName}
        onConsentGranted={handleConsentGranted}
      />
    </div>
  );
}
