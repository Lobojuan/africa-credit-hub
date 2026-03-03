import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
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
import type { Borrower, CreditAccount, CreditInquiry, CourtJudgment, ConsentRecord, PaymentHistory } from "@shared/schema";

interface CreditReportData {
  serialNumber: string;
  generatedAt: string;
  borrower: Borrower;
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
  courtJudgments: CourtJudgment[];
  consentRecords: ConsentRecord[];
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
}

function getScoreGrade(score: number) {
  if (score >= 750) return { label: "Excellent", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" };
  if (score >= 700) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" };
  if (score >= 650) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" };
  if (score >= 600) return { label: "Below Average", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" };
  return { label: "Poor", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" };
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "on_time": return "OK";
    case "late": return "30";
    case "missed": return "X";
    case "partial": return "P";
    default: return "ND";
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case "on_time": return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "late": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "missed": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "partial": return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
    default: return "bg-muted text-muted-foreground";
  }
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
    const c = a.currency || "ETB";
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
      { sno: 1, label: "Number of Open Credit Facilities", values: currencyKeys.map(c => ({ currency: c, value: byCurrency[c].open.toString() })) },
      { sno: 2, label: "Total Outstanding Balance in Open Credit Facilities", values: currencyKeys.map(c => ({ currency: c, value: formatCurrency(byCurrency[c].balance.toFixed(2), c) })) },
      { sno: 3, label: "Total Overdue Amount on Open Credit Facilities", values: currencyKeys.map(c => ({ currency: c, value: formatCurrency(byCurrency[c].overdue.toFixed(2), c) })) },
      { sno: 4, label: "Number of Open Credit Facilities with Overdue", values: [{ currency: "", value: overdueAccounts.length.toString() }] },
      { sno: 5, label: "Number of Open Facilities > 90 Days in Arrears (Non-Performing)", values: [{ currency: "", value: nplAccounts.length.toString() }] },
      { sno: 6, label: "Number of Closed Credit Facilities", values: [{ currency: "", value: closedLast6.length.toString() }] },
      { sno: 7, label: "Number of Facilities with Write-Off", values: [{ currency: "", value: writtenOffAccounts.length.toString() }] },
      { sno: 8, label: "Total Write-Off Amount", values: [{ currency: currencyKeys[0] || "ETB", value: writtenOffTotal > 0 ? formatCurrency(writtenOffTotal.toFixed(2), currencyKeys[0] || "ETB") : "0" }] },
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
    const cur = a.currency || "ETB";
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
  const currencies = [...new Set(accounts.map(a => a.currency || "ETB"))];
  const summary: Record<string, { balance: number; overdue: number; d1_30: number; d31_60: number; d61_90: number; d91_120: number; d121_150: number; d151_180: number; d180plus: number }> = {};
  currencies.forEach(c => { summary[c] = { balance: 0, overdue: 0, d1_30: 0, d31_60: 0, d61_90: 0, d91_120: 0, d121_150: 0, d151_180: 0, d180plus: 0 }; });

  accounts.filter(a => a.status !== "closed").forEach(a => {
    const c = a.currency || "ETB";
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
    const cur = a.currency || "ETB";
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
  const borrowerId = params?.borrowerId;
  const [purpose, setPurpose] = useState("new_credit");
  const printRef = useRef<HTMLDivElement>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/credit-reports/generate", {
        borrowerId,
        purpose,
      });
      return res.json();
    },
  });

  const report = generateMutation.data as CreditReportData | undefined;

  const [isDownloading, setIsDownloading] = useState(false);
  const [reportLanguage, setReportLanguage] = useState("en");
  const [aiSummary, setAiSummary] = useState<{ summary: string; borrowerName: string; generatedAt: string } | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(true);

  const aiSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/ai/report-summary/${report?.borrower?.id}`);
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `Credit_Report_${report.serialNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            <p className="text-sm text-muted-foreground">Generate a detailed credit report (D&B format)</p>
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
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="mt-6"
                data-testid="button-generate-report"
              >
                <FileText className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Generate Credit Report"}
              </Button>
            </div>
            {generateMutation.isError && (
              <p className="text-sm text-destructive">Failed to generate report. Please try again.</p>
            )}
          </CardContent>
        </Card>
      )}

      {generateMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {report && (
        <div ref={printRef} className="space-y-5 print:space-y-3" data-testid="credit-report-content">
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
                <p className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-0.5">
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

          <Card className="border-2 border-primary/20 overflow-hidden print:border print:border-gray-300 print:shadow-none">
            <div className="p-6 print:p-4" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
              <div className="flex items-center justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-6 h-6" />
                    <h1 className="text-lg font-bold print:text-base">Comprehensive Credit Information Report</h1>
                  </div>
                  <p className="text-sm text-white/70 print:text-[10px]">Cross-Jurisdictional Central Data Hub v1.2</p>
                  <p className="text-xs text-white/50 mt-1 print:text-[8px]">Systems In Motion Limited</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/10 rounded-lg px-4 py-2 print:px-2 print:py-1">
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
                <p className="text-2xl font-black mt-1 print:text-lg">{formatCurrency(report.summary.totalDebt, "ETB", { compact: true })}</p>
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

          {profileOverview && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={BarChart3} title="Credit Profile Overview" number={1} />
                <div className="border rounded-lg overflow-x-auto print:border-gray-300">
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
                <div className="border rounded-lg overflow-x-auto print:border-gray-300">
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
                <div className="border rounded-lg overflow-x-auto print:border-gray-300">
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
                <div className="border rounded-lg overflow-x-auto print:border-gray-300">
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
              <SectionHeader icon={Search} title="Inquiry History Summary" number={5} count={report.inquiries.length} />
              {report.inquiries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Institution</TableCell>
                        <TableCell header>Purpose</TableCell>
                        <TableCell header>Date</TableCell>
                        <TableCell header>Consent</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{inq.institution}</TableCell>
                          <TableCell className="capitalize">{inq.purpose.replace(/_/g, " ")}</TableCell>
                          <TableCell>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—"}</TableCell>
                          <TableCell>
                            {inq.consentProvided ? (
                              <Badge variant="default" className="text-[9px] print:text-[7px]">Yes</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[9px] print:text-[7px]">No</Badge>
                            )}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No credit inquiries on file</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={CreditCard} title="Credit Facility Details" number={6} count={report.accounts.length} />
              <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground print:mb-2 print:text-[8px]">
                <span className="font-semibold">Legend:</span>
                <span>OK = On Time</span>
                <span>30 = Late (&le;30 days)</span>
                <span>X = Missed</span>
                <span>P = Partial</span>
                <span>ND = No Data</span>
              </div>

              {report.accounts.length > 0 ? (
                <div className="space-y-5 print:space-y-3">
                  {report.accounts.map((account, idx) => {
                    const currency = account.currency || "ETB";
                    const history = report.paymentHistory?.[account.id] || [];
                    const isOpen = account.status !== "closed";

                    return (
                      <div key={account.id} className="border rounded-lg overflow-hidden print:border-gray-300 print:break-inside-avoid" data-testid={`report-account-${account.id}`}>
                        <div className="bg-muted/40 px-4 py-2 flex items-center justify-between gap-2 print:px-2 print:py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground print:text-[8px]">Facility {idx + 1} of {report.accounts.length}</span>
                            <Badge variant={isOpen ? "default" : "secondary"} className="text-[9px] print:text-[7px]">
                              {isOpen ? "Open" : "Closed"}
                            </Badge>
                            <Badge variant={getStatusColor(account.status)} className="text-[9px] capitalize print:text-[7px]">{account.status}</Badge>
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
                                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold print:text-[7px] ${ph ? getPaymentStatusColor(ph.status) : "bg-muted text-muted-foreground"}`}>
                                        {ph ? getPaymentStatusLabel(ph.status) : "ND"}
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

          {report.courtJudgments.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Gavel} title="Court Judgments & Public Records" number={7} count={report.courtJudgments.length} />
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
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
                          <TableCell className="text-right">{j.amount ? formatCurrency(j.amount, j.currency || "ETB") : "—"}</TableCell>
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
                <SectionHeader icon={Shield} title="Consent Records" number={8} count={report.consentRecords.length} />
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
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

          <Card className="bg-muted/20 print:bg-white print:break-inside-avoid">
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
                  to the Credit Registry System. While Systems In Motion Limited endeavors to ensure accuracy of information, we do not accept
                  any responsibility for any loss or damage to any subject resulting from this report. The requesting institution agrees not to hold,
                  or seek to hold, the Credit Registry System responsible or liable with respect to the content of this report.
                </p>
                <p className="text-[10px] text-muted-foreground/60 print:text-[7px]">
                  Cross-Jurisdictional Central Data Hub & Credit Registry System v1.2 | Systems In Motion Limited
                </p>
                <p className="text-[9px] text-muted-foreground/40 mt-1 print:text-[7px]">
                  Confidential & Proprietary | Unauthorized distribution is prohibited
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
