import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { getDefaultFallbackCurrency } from "@/lib/country-mode";
import {
  ArrowLeft, Printer, FileText, Download, Building2, Search,
  AlertTriangle, Shield, Gavel, CheckCircle2,
  Activity, Landmark, BarChart3, Loader2,
  Briefcase, FileBarChart, Brain, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Borrower, CreditAccount, CreditInquiry, CourtJudgment, ConsentRecord, PaymentHistory } from "@shared/schema";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

interface BusinessReportData {
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
}

const SIC_CODES: Record<string, string> = {
  "0100": "Agriculture", "1000": "Mining", "1500": "Construction",
  "2000": "Manufacturing - Food", "2800": "Manufacturing - Chemicals",
  "3500": "Manufacturing - Machinery", "4000": "Transportation",
  "4800": "Communications", "5000": "Wholesale Trade", "5200": "Retail Trade",
  "6000": "Banking", "6100": "Non-Bank Financial", "6200": "Securities",
  "6300": "Insurance", "6500": "Real Estate", "7000": "Services - Hospitality",
  "7300": "Business Services", "7500": "Auto Services", "8000": "Health Services",
  "8200": "Education", "9100": "Government", "9900": "Non-Classifiable",
};

function getRiskScoreInterpretation(score: number) {
  if (score >= 80) return { label: "Very Low Risk", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", desc: "Pays bills within agreed terms" };
  if (score >= 65) return { label: "Low Risk", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", desc: "Generally reliable payment behaviour" };
  if (score >= 50) return { label: "Moderate Risk", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", desc: "Some delays may occur" };
  if (score >= 30) return { label: "High Risk", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", desc: "Significant risk of late payment" };
  return { label: "Very High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", desc: "High probability of payment failure" };
}

function getDelinquencyInterpretation(score: number) {
  if (score >= 80) return { label: "Very Low", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", desc: "Very low probability of late payment" };
  if (score >= 65) return { label: "Below Average", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", desc: "Below average probability of late payment" };
  if (score >= 50) return { label: "Average", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", desc: "Average probability of late payment" };
  if (score >= 30) return { label: "Above Average", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", desc: "Above average probability of late payment" };
  return { label: "High", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", desc: "High probability of late payment" };
}

function getFailureInterpretation(score: number) {
  if (score >= 80) return { label: "Very Low", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", desc: "Very low likelihood of business failure" };
  if (score >= 65) return { label: "Low", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", desc: "Low likelihood of business failure" };
  if (score >= 50) return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", desc: "Moderate likelihood of business failure" };
  if (score >= 30) return { label: "Elevated", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", desc: "Elevated likelihood of business failure" };
  return { label: "High", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", desc: "High likelihood of business failure" };
}

function deriveBusinessScores(report: BusinessReportData) {
  const baseScore = report.summary.creditScore;
  const normalizedBase = Math.round(((baseScore - 300) / 550) * 100);
  const riskScore = Math.min(100, Math.max(0, normalizedBase));

  const delinqPenalty = report.summary.delinquentAccounts * 10;
  const writtenOffPenalty = report.summary.writtenOffAccounts * 15;
  const delinquencyScore = Math.min(100, Math.max(0, normalizedBase - delinqPenalty - writtenOffPenalty));

  const judgmentPenalty = report.summary.judgmentCount * 12;
  const restructurePenalty = report.summary.restructuredAccounts * 8;
  const failureScore = Math.min(100, Math.max(0, normalizedBase - judgmentPenalty - restructurePenalty - (writtenOffPenalty / 2)));

  return { riskScore, delinquencyScore, failureScore };
}

function buildTradePaymentSummary(accounts: CreditAccount[]) {
  const openAccounts = accounts.filter(a => a.status !== "closed");
  if (openAccounts.length === 0) return { onTime: 0, early: 0, delayed: 0, total: 0 };
  const current = openAccounts.filter(a => a.status === "current" && (a.daysInArrears || 0) === 0).length;
  const delayed = openAccounts.filter(a => (a.daysInArrears || 0) > 0).length;
  const early = openAccounts.length - current - delayed;
  const total = openAccounts.length;
  return {
    onTime: total > 0 ? Math.round((current / total) * 100) : 0,
    early: total > 0 ? Math.round((Math.max(0, early) / total) * 100) : 0,
    delayed: total > 0 ? Math.round((delayed / total) * 100) : 0,
    total,
  };
}

function buildRiskAssessment(report: BusinessReportData) {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const scores = deriveBusinessScores(report);

  const tradePayment = buildTradePaymentSummary(report.accounts);
  if (tradePayment.onTime >= 70) strengths.push("Strong payment performance");
  if (report.summary.judgmentCount === 0) strengths.push("No adverse legal records");
  if (report.summary.writtenOffAccounts === 0) strengths.push("No written-off accounts");
  if (report.summary.activeAccounts >= 3) strengths.push("Established credit relationships");

  const totalDebt = parseFloat(report.summary.totalDebt);
  const totalLimit = report.accounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
  const leverage = totalLimit > 0 ? (totalDebt / totalLimit) : 0;
  if (leverage <= 0.6) strengths.push("Moderate leverage");
  else concerns.push("High leverage ratio");

  const oldestAccount = report.accounts.reduce((oldest, a) => {
    const d = a.disbursementDate ? new Date(a.disbursementDate) : null;
    return d && (!oldest || d < oldest) ? d : oldest;
  }, null as Date | null);
  const historyYears = oldestAccount ? Math.floor((Date.now() - oldestAccount.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
  if (historyYears >= 3) strengths.push("Stable operating history");

  if (report.summary.delinquentAccounts > 0) concerns.push(`${report.summary.delinquentAccounts} delinquent account(s)`);
  if (report.summary.writtenOffAccounts > 0) concerns.push(`${report.summary.writtenOffAccounts} written-off account(s)`);
  if (report.summary.judgmentCount > 0) concerns.push(`${report.summary.judgmentCount} court judgment(s) recorded`);
  if (tradePayment.delayed > 30) concerns.push("Significant payment delays");

  if (strengths.length === 0) strengths.push("Limited data to assess strengths");
  if (concerns.length === 0) concerns.push("No significant concerns identified");

  let overallRisk = "LOW–MODERATE RISK";
  if (scores.riskScore < 30 || report.summary.writtenOffAccounts > 0) overallRisk = "HIGH RISK";
  else if (scores.riskScore < 50 || report.summary.delinquentAccounts > 0) overallRisk = "MODERATE–HIGH RISK";
  else if (scores.riskScore >= 65) overallRisk = "LOW RISK";

  return { strengths, concerns, overallRisk };
}

function SectionHeader({ icon: Icon, title, count, number }: { icon: any; title: string; count?: number; number?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 print:mb-2">
      <h2 className="text-base font-bold flex items-center gap-2 print:text-sm">
        {number !== undefined && (
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 print:w-5 print:h-5 print:text-[8px]">
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

function TableCell({ children, className = "", header = false, colSpan }: { children: React.ReactNode; className?: string; header?: boolean; colSpan?: number }) {
  const Tag = header ? "th" : "td";
  return (
    <Tag colSpan={colSpan} className={`px-3 py-2 text-left print:px-1.5 print:py-1 ${header ? "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 print:text-[8px]" : "text-xs print:text-[9px]"} ${className}`}>
      {children}
    </Tag>
  );
}

function ScoreCard({ title, score, interpretation, description }: {
  title: string; score: number;
  interpretation: { label: string; color: string; bg: string; desc: string };
  description: string;
}) {
  return (
    <div className={`rounded-xl p-4 print:p-2 ${interpretation.bg} border`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 print:text-[8px]">{title}</p>
      <div className="flex items-end gap-2 mb-1">
        <p className={`text-3xl font-black print:text-xl ${interpretation.color}`} data-testid={`text-${title.toLowerCase().replace(/\s/g, '-')}`}>
          {score}
        </p>
        <span className="text-[10px] text-muted-foreground mb-1 print:text-[8px]">/ 100</span>
      </div>
      <Badge variant="outline" className="text-[9px] mb-1 print:text-[7px]">{interpretation.label}</Badge>
      <p className="text-[10px] text-muted-foreground mt-1 print:text-[8px]">{description}</p>
    </div>
  );
}

export default function BusinessCreditReportPage() {
  const [, params] = useRoute("/business-credit-report/:borrowerId");
  const [, navigate] = useLocation();
  const { i18n } = useTranslation();
  const borrowerId = params?.borrowerId;
  const [purpose, setPurpose] = useState("new_credit");
  const [includeAI, setIncludeAI] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/credit-reports/generate", {
        borrowerId,
        purpose,
        includeAI,
      });
      return res.json();
    },
  });

  const report = generateMutation.data as BusinessReportData | undefined;

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      const currentLang = i18n.language?.startsWith("fr") ? "fr" : i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("sw") ? "sw" : i18n.language?.startsWith("pt") ? "pt" : "en";
      const res = await apiRequest("POST", "/api/credit-reports/download-pdf", {
        reportData: report,
        lang: currentLang,
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Business_Credit_Report_${report.serialNumber}.pdf`;
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
        <p>No business selected</p>
        <Button variant="ghost" onClick={() => navigate("/businesses")} className="mt-4" data-testid="button-back-businesses">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Businesses
        </Button>
      </div>
    );
  }

  const scores = report ? deriveBusinessScores(report) : null;
  const tradePayment = report ? buildTradePaymentSummary(report.accounts) : null;
  const riskAssessment = report ? buildRiskAssessment(report) : null;

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/businesses")} data-testid="button-back-businesses">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-business-report-title">Business Credit Report</h1>
            <p className="text-sm text-muted-foreground">Comprehensive commercial credit information report (D&B format)</p>
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
                  <SelectTrigger data-testid="select-business-report-purpose">
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
                    data-testid="toggle-include-ai-biz"
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
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="mt-6"
                data-testid="button-generate-business-report"
              >
                <FileText className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Generate Business Credit Report"}
              </Button>
            </div>
            {generateMutation.isError && (
              <p className="text-sm text-destructive" data-testid="text-report-error">Failed to generate report. Please try again.</p>
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
        <div ref={printRef} className="space-y-5 print:space-y-3" data-testid="business-report-content">
          <div className="flex items-center justify-end gap-2 flex-wrap print:hidden">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading} data-testid="button-download-business-pdf">
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-business-report">
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>

          <Card className="border-2 border-primary/20 overflow-hidden print:border print:border-border print:shadow-none">
            <div className="p-6 print:p-4" style={{ background: "linear-gradient(135deg, hsl(210 60% 20%) 0%, hsl(220 50% 15%) 100%)" }}>
              <div className="flex items-center justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-6 h-6" />
                    <h1 className="text-lg font-bold print:text-base">Business Credit Report</h1>
                  </div>
                  <p className="text-sm text-white/70 print:text-[10px]">Cross-Jurisdictional Central Data Hub v2.5</p>
                  <p className="text-xs text-white/50 mt-1 print:text-[8px]">{PLATFORM_COMPANY_NAME}</p>
                </div>
                <div className="text-right">
                  <div className="bg-card/10 rounded-lg px-4 py-2 print:px-2 print:py-1">
                    <p className="text-[10px] text-white/60 uppercase tracking-wider print:text-[8px]">Report Number</p>
                    <p className="text-sm font-mono font-bold print:text-[10px]" data-testid="text-business-serial-number">{report.serialNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 print:p-3 space-y-4 print:space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2 text-xs">
                <InfoField label="Report Number" value={report.serialNumber} />
                <InfoField label="Report Date" value={new Date(report.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
                <InfoField label="Institution Name" value={report.requestedBy?.institution || "—"} />
                <InfoField label="Requested By" value={report.requestedBy?.fullName || "—"} />
              </div>
            </div>
          </Card>

          <Card data-testid="card-company-identification">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={Building2} title="Company Identification" number={1} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2">
                <InfoField label="Business Legal Name" value={report.borrower.companyName || "—"} />
                <InfoField label="Business Trade Name" value={report.borrower.tradingName || report.borrower.companyName || "—"} />
                <InfoField label="ACB Identification #" value={report.borrower.id?.toString() || "—"} />
                <InfoField label="Registration Number" value={report.borrower.businessRegNumber || "—"} />
                <InfoField label="Incorporation Date" value={report.borrower.registrationDate || report.borrower.commencementDate || "—"} />
                <InfoField label="Tax Identification #" value={report.borrower.tinNumber || "—"} />
                <InfoField label="Business Type" value={report.borrower.businessTypeCode || report.borrower.sector || "—"} />
                <InfoField label="Industry (SIC)" value={
                  report.borrower.sectorIndustryCode
                    ? `${report.borrower.sectorIndustryCode} - ${SIC_CODES[report.borrower.sectorIndustryCode] || report.borrower.sector || "See SIC table"}`
                    : report.borrower.sector || "—"
                } />
                <InfoField label="Registered Address" value={[report.borrower.address, report.borrower.city, report.borrower.region, report.borrower.country].filter(Boolean).join(", ") || "—"} />
                <InfoField label="Digital Address" value={report.borrower.postalAddress1 || report.borrower.postalCode || "—"} />
                <InfoField label="Phone" value={report.borrower.phone || report.borrower.homeTelephone || "—"} />
                <InfoField label="Email" value={report.borrower.email || "—"} />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-business-profile">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={Briefcase} title="Business Profile" number={2} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2">
                <InfoField label="Nature of Business" value={report.borrower.sector || report.borrower.businessTypeCode || "—"} />
                <InfoField label="Employees" value={report.borrower.numberOfDependants?.toString() || "—"} />
                <InfoField label="Annual Turnover/Sales" value={
                  report.borrower.turnoverAmount
                    ? formatCurrency(report.borrower.turnoverAmount.toString(), report.borrower.turnoverCurrency || getDefaultFallbackCurrency())
                    : "—"
                } />
                <InfoField label="Ownership" value={report.borrower.ownerOrTenant || "—"} />
                <InfoField label="Key Directors" value={report.borrower.employerName || "—"} />
                <InfoField label="Affiliated Companies" value={report.borrower.previousBusinessName || "—"} />
                {report.borrower.website && <InfoField label="Website" value={report.borrower.website} />}
              </div>
            </CardContent>
          </Card>

          {scores && (
            <Card data-testid="card-credit-scores">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={BarChart3} title="Credit Scores & Ratings" number={3} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:gap-2 mb-4 print:mb-2">
                  <ScoreCard
                    title="Risk Score"
                    score={scores.riskScore}
                    interpretation={getRiskScoreInterpretation(scores.riskScore)}
                    description={getRiskScoreInterpretation(scores.riskScore).desc}
                  />
                  <ScoreCard
                    title="Delinquency Score"
                    score={scores.delinquencyScore}
                    interpretation={getDelinquencyInterpretation(scores.delinquencyScore)}
                    description={getDelinquencyInterpretation(scores.delinquencyScore).desc}
                  />
                  <ScoreCard
                    title="Failure Score"
                    score={scores.failureScore}
                    interpretation={getFailureInterpretation(scores.failureScore)}
                    description={getFailureInterpretation(scores.failureScore).desc}
                  />
                </div>

                <div className="border rounded-lg overflow-hidden print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Score Range</TableCell>
                        <TableCell header>Risk Level</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { range: "80 – 100", level: "Very Low Risk", color: "text-green-600 dark:text-green-400" },
                        { range: "65 – 79", level: "Low Risk", color: "text-emerald-600 dark:text-emerald-400" },
                        { range: "50 – 64", level: "Moderate Risk", color: "text-yellow-600 dark:text-yellow-400" },
                        { range: "30 – 49", level: "High Risk", color: "text-orange-600 dark:text-orange-400" },
                        { range: "Below 30", level: "Very High Risk", color: "text-red-600 dark:text-red-400" },
                      ].map(row => (
                        <tr key={row.range} className="hover:bg-muted/20">
                          <TableCell className="font-mono font-medium">{row.range}</TableCell>
                          <TableCell className={`font-semibold ${row.color}`}>{row.level}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-banking-facilities">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={Landmark} title="Banking & Credit Facilities" number={4} count={report.accounts.length} />
              {(() => {
                const banks = [...new Set(report.accounts.map(a => a.lenderInstitution))];
                const primaryBank = banks[0] || "—";
                const otherBanks = banks.slice(1);
                return (
                  <>
                    <div className="mb-4 print:mb-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Primary Bank</p>
                      <div className="grid grid-cols-2 gap-4 print:gap-2">
                        <InfoField label="Name" value={primaryBank} />
                      </div>
                    </div>
                    {otherBanks.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Other Banks</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 print:gap-1">
                          {otherBanks.map((bank, i) => (
                            <div key={i} className="bg-muted/30 rounded-lg p-2 text-xs font-medium print:text-[9px]">{bank}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {report.accounts.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto print:border-border">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Institution</TableCell>
                        <TableCell header>Account #</TableCell>
                        <TableCell header>Facility Type</TableCell>
                        <TableCell header className="text-right">Original Amount</TableCell>
                        <TableCell header className="text-right">Current Balance</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Maturity</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.accounts.map(account => (
                        <tr key={account.id} className="hover:bg-muted/20" data-testid={`facility-row-${account.id}`}>
                          <TableCell className="font-medium">{account.lenderInstitution}</TableCell>
                          <TableCell className="font-mono">{account.accountNumber}</TableCell>
                          <TableCell className="capitalize">{account.accountType?.replace(/_/g, " ") || "—"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(account.originalAmount, account.currency || getDefaultFallbackCurrency())}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(account.currentBalance, account.currency || getDefaultFallbackCurrency())}</TableCell>
                          <TableCell>
                            <Badge
                              variant={account.status === "current" ? "default" : account.status === "closed" ? "secondary" : "destructive"}
                              className="text-[9px] capitalize print:text-[7px]"
                            >
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{account.maturityDate || "—"}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No credit facilities on file</p>
              )}
            </CardContent>
          </Card>

          {tradePayment && (
            <Card data-testid="card-trade-payment">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Activity} title="Trade Payment History" number={5} />
                <div className="grid grid-cols-3 gap-4 print:gap-2 mb-4 print:mb-2">
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border print:p-2">
                    <p className="text-3xl font-black text-green-600 dark:text-green-400 print:text-xl">{tradePayment.onTime}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1 print:text-[8px]">Payments on Time</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border print:p-2">
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400 print:text-xl">{tradePayment.early}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1 print:text-[8px]">Early Payments</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border print:p-2">
                    <p className="text-3xl font-black text-red-600 dark:text-red-400 print:text-xl">{tradePayment.delayed}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1 print:text-[8px]">Slightly Delayed</p>
                  </div>
                </div>

                <div className="h-4 rounded-full overflow-hidden flex bg-muted print:h-3">
                  {tradePayment.onTime > 0 && (
                    <div className="bg-green-500 dark:bg-green-400 h-full transition-all" style={{ width: `${tradePayment.onTime}%` }} />
                  )}
                  {tradePayment.early > 0 && (
                    <div className="bg-blue-500 dark:bg-blue-400 h-full transition-all" style={{ width: `${tradePayment.early}%` }} />
                  )}
                  {tradePayment.delayed > 0 && (
                    <div className="bg-red-500 dark:bg-red-400 h-full transition-all" style={{ width: `${tradePayment.delayed}%` }} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2 print:text-[8px]">
                  Based on {tradePayment.total} open trade account{tradePayment.total !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-public-filings">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={Gavel} title="Public Filings & Legal Events" number={6} />
              <div className="border rounded-lg overflow-hidden print:border-border">
                <table className="w-full text-xs print:text-[9px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <TableCell header>Filing Type</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Details</TableCell>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/20">
                      <TableCell className="font-medium">Registrar General Status</TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-[9px] print:text-[7px]">
                          {report.borrower.registrationDate ? "Registered" : "Not Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.borrower.businessRegNumber ? `Reg. No: ${report.borrower.businessRegNumber}` : "—"}
                      </TableCell>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <TableCell className="font-medium">Collateral Registry (Central Bank)</TableCell>
                      <TableCell>
                        <Badge variant={report.accounts.some(a => a.collateralType) ? "secondary" : "outline"} className="text-[9px] print:text-[7px]">
                          {report.accounts.some(a => a.collateralType) ? "Collateral Registered" : "No Records"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.accounts.filter(a => a.collateralType).length} collateral record(s)
                      </TableCell>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <TableCell className="font-medium">Court Judgments</TableCell>
                      <TableCell>
                        <Badge variant={report.courtJudgments.length > 0 ? "destructive" : "default"} className="text-[9px] print:text-[7px]">
                          {report.courtJudgments.length > 0 ? `${report.courtJudgments.length} Record(s)` : "None"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.courtJudgments.length > 0
                          ? report.courtJudgments.map(j => `${j.caseNumber} (${j.status})`).join(", ")
                          : "No adverse legal records"}
                      </TableCell>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <TableCell className="font-medium">Tax Compliance</TableCell>
                      <TableCell>
                        <Badge variant={report.borrower.tinNumber ? "default" : "outline"} className="text-[9px] print:text-[7px]">
                          {report.borrower.tinNumber ? "TIN on File" : "Not Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.borrower.tinNumber ? `TIN: ${report.borrower.tinNumber}` : "No tax identification number on file"}
                      </TableCell>
                    </tr>
                  </tbody>
                </table>
              </div>

              {report.courtJudgments.length > 0 && (
                <div className="mt-4 print:mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Court Judgment Details</p>
                  <div className="border border-destructive/30 rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-red-50 dark:bg-red-950/20">
                          <TableCell header>Case No.</TableCell>
                          <TableCell header>Court</TableCell>
                          <TableCell header>Type</TableCell>
                          <TableCell header className="text-right">Amount</TableCell>
                          <TableCell header>Date</TableCell>
                          <TableCell header>Status</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {report.courtJudgments.map(j => (
                          <tr key={j.id} className="hover:bg-muted/20">
                            <TableCell className="font-mono">{j.caseNumber}</TableCell>
                            <TableCell>{j.court}</TableCell>
                            <TableCell className="capitalize">{j.judgmentType.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-right font-semibold">{j.amount ? formatCurrency(j.amount, j.currency || getDefaultFallbackCurrency()) : "—"}</TableCell>
                            <TableCell>{j.judgmentDate}</TableCell>
                            <TableCell>
                              <Badge variant={j.status === "active" ? "destructive" : "default"} className="text-[9px] capitalize print:text-[7px]">{j.status}</Badge>
                            </TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-collections-defaults">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={AlertTriangle} title="Collections & Defaults" number={7} />
              {(() => {
                const collectionsAccounts = report.accounts.filter(a => a.status === "written_off" || a.status === "default");
                const pastDueAccounts = report.accounts.filter(a => (a.daysInArrears || 0) > 0 && a.status !== "written_off" && a.status !== "default");
                return (
                  <>
                    {collectionsAccounts.length > 0 ? (
                      <div className="mb-4 print:mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Accounts in Collection</p>
                        <div className="border border-destructive/30 rounded-lg overflow-hidden print:border-border">
                          <table className="w-full text-xs print:text-[9px]">
                            <thead>
                              <tr className="bg-red-50 dark:bg-red-950/20">
                                <TableCell header>Creditor</TableCell>
                                <TableCell header>Account #</TableCell>
                                <TableCell header className="text-right">Amount</TableCell>
                                <TableCell header>Status</TableCell>
                                <TableCell header>Date Reported</TableCell>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {collectionsAccounts.map(a => (
                                <tr key={a.id} className="hover:bg-muted/20">
                                  <TableCell className="font-medium">{a.lenderInstitution}</TableCell>
                                  <TableCell className="font-mono">{a.accountNumber}</TableCell>
                                  <TableCell className="text-right font-semibold text-destructive">{formatCurrency(a.currentBalance, a.currency || getDefaultFallbackCurrency())}</TableCell>
                                  <TableCell>
                                    <Badge variant="destructive" className="text-[9px] capitalize print:text-[7px]">
                                      {a.status === "written_off" ? "Written Off" : "Default"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{a.writtenOffDate || a.updatedAt ? new Date(a.writtenOffDate || a.updatedAt!).toLocaleDateString("en-GB") : "—"}</TableCell>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4 print:mb-2">No accounts in collection</p>
                    )}

                    {pastDueAccounts.length > 0 ? (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Past Due Obligations</p>
                        <div className="border border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden print:border-border">
                          <table className="w-full text-xs print:text-[9px]">
                            <thead>
                              <tr className="bg-amber-50 dark:bg-amber-950/20">
                                <TableCell header>Creditor</TableCell>
                                <TableCell header>Account #</TableCell>
                                <TableCell header className="text-right">Balance</TableCell>
                                <TableCell header className="text-right">Days Overdue</TableCell>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {pastDueAccounts.map(a => (
                                <tr key={a.id} className="hover:bg-muted/20">
                                  <TableCell className="font-medium">{a.lenderInstitution}</TableCell>
                                  <TableCell className="font-mono">{a.accountNumber}</TableCell>
                                  <TableCell className="text-right font-semibold">{formatCurrency(a.currentBalance, a.currency || getDefaultFallbackCurrency())}</TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={a.daysInArrears! > 90 ? "destructive" : "secondary"} className="text-[9px] print:text-[7px]">
                                      {a.daysInArrears} days
                                    </Badge>
                                  </TableCell>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No past due obligations</p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {(() => {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            const recentInquiries = report.inquiries.filter(inq => {
              if (!inq.createdAt) return true;
              return new Date(inq.createdAt) >= twelveMonthsAgo;
            });
            const hardInquiries = recentInquiries.filter(i => ["new_credit", "collection"].includes(i.purpose));
            const softInquiries = recentInquiries.filter(i => !["new_credit", "collection"].includes(i.purpose));
            return (
              <Card data-testid="card-credit-inquiries">
                <CardContent className="p-5 print:p-3">
                  <SectionHeader icon={Search} title="Credit Inquiries (Last 12 Months)" number={8} count={recentInquiries.length} />
                  <div className="flex items-center gap-4 mb-3 print:mb-2">
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-lg print:px-2 print:py-1">
                      <p className="text-2xl font-black print:text-lg" data-testid="text-total-inquiries">{recentInquiries.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Inquiries</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-lg print:px-2 print:py-1">
                      <p className="text-2xl font-black print:text-lg">{hardInquiries.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Hard Inquiries</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-lg print:px-2 print:py-1">
                      <p className="text-2xl font-black print:text-lg">{softInquiries.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Soft Inquiries</p>
                    </div>
                  </div>

                  {recentInquiries.length > 0 ? (
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
                          {recentInquiries.map(inq => {
                            const isHard = ["new_credit", "collection"].includes(inq.purpose);
                            return (
                              <tr key={inq.id} className="hover:bg-muted/20" data-testid={`inquiry-row-${inq.id}`}>
                                <TableCell className="font-medium">{inq.institution}</TableCell>
                                <TableCell className="capitalize">{inq.purpose.replace(/_/g, " ")}</TableCell>
                                <TableCell>
                                  <Badge variant={isHard ? "destructive" : "secondary"} className="text-[9px] print:text-[7px]">
                                    {isHard ? "Hard" : "Soft"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={inq.consentProvided ? "default" : "destructive"} className="text-[9px] print:text-[7px]">
                                    {inq.consentProvided ? "Yes" : "No"}
                                  </Badge>
                                </TableCell>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 print:py-2">No credit inquiries in the last 12 months</p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <Card data-testid="card-financial-summary">
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={FileBarChart} title="Financial Summary (Last 3 Years)" number={9} />
              {(() => {
                const currentYear = new Date().getFullYear();
                const totalDebt = parseFloat(report.summary.totalDebt);
                const totalLimit = report.accounts.reduce((s, a) => s + parseFloat(a.originalAmount || "0"), 0);
                const turnover = report.borrower.turnoverAmount ? parseFloat(report.borrower.turnoverAmount.toString()) : 0;
                const currency = report.borrower.turnoverCurrency || getDefaultFallbackCurrency();

                const years = [
                  {
                    year: currentYear,
                    revenue: turnover,
                    netProfit: turnover > 0 ? turnover * 0.12 : 0,
                    totalAssets: totalLimit > 0 ? totalLimit * 1.4 : turnover * 0.8,
                    totalLiabilities: totalDebt,
                  },
                  {
                    year: currentYear - 1,
                    revenue: turnover > 0 ? turnover * 0.92 : 0,
                    netProfit: turnover > 0 ? turnover * 0.92 * 0.10 : 0,
                    totalAssets: totalLimit > 0 ? totalLimit * 1.3 : turnover * 0.75,
                    totalLiabilities: totalDebt * 0.85,
                  },
                  {
                    year: currentYear - 2,
                    revenue: turnover > 0 ? turnover * 0.85 : 0,
                    netProfit: turnover > 0 ? turnover * 0.85 * 0.08 : 0,
                    totalAssets: totalLimit > 0 ? totalLimit * 1.2 : turnover * 0.7,
                    totalLiabilities: totalDebt * 0.7,
                  },
                ];

                return (
                  <div className="border rounded-lg overflow-hidden print:border-border">
                    <table className="w-full text-xs print:text-[9px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <TableCell header>Year</TableCell>
                          <TableCell header className="text-right">Revenue ({currency})</TableCell>
                          <TableCell header className="text-right">Net Profit ({currency})</TableCell>
                          <TableCell header className="text-right">Total Assets ({currency})</TableCell>
                          <TableCell header className="text-right">Total Liabilities ({currency})</TableCell>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {years.map(y => (
                          <tr key={y.year} className="hover:bg-muted/20">
                            <TableCell className="font-bold">{y.year}</TableCell>
                            <TableCell className="text-right font-semibold">{y.revenue > 0 ? formatCurrency(y.revenue.toFixed(2), currency) : "—"}</TableCell>
                            <TableCell className={`text-right font-semibold ${y.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {y.netProfit > 0 ? formatCurrency(y.netProfit.toFixed(2), currency) : "—"}
                            </TableCell>
                            <TableCell className="text-right">{y.totalAssets > 0 ? formatCurrency(y.totalAssets.toFixed(2), currency) : "—"}</TableCell>
                            <TableCell className="text-right">{y.totalLiabilities > 0 ? formatCurrency(y.totalLiabilities.toFixed(2), currency) : "—"}</TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 print:p-2">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold print:text-[8px]">
                  Data Source Disclaimer
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 print:text-[8px]">
                  Financial figures are estimated from credit facility data and reported annual turnover. These are indicative projections — 
                  audited financial statements should be obtained directly from the business for definitive figures.
                </p>
              </div>
            </CardContent>
          </Card>

          {riskAssessment && (
            <Card data-testid="card-risk-assessment">
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Shield} title="Risk Assessment Summary" number={10} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2 mb-4 print:mb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Strengths</p>
                    <div className="space-y-1.5">
                      {riskAssessment.strengths.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 text-xs print:p-1 print:text-[9px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Concerns</p>
                    <div className="space-y-1.5">
                      {riskAssessment.concerns.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs print:p-1 print:text-[9px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator className="my-4 print:my-2" />

                <div className="text-center py-4 print:py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 print:text-[8px]">Overall Risk Rating</p>
                  <Badge
                    className={`text-lg px-6 py-2 font-bold print:text-sm ${
                      riskAssessment.overallRisk.includes("HIGH") && !riskAssessment.overallRisk.includes("LOW")
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : riskAssessment.overallRisk.includes("MODERATE")
                        ? "bg-yellow-500 text-black hover:bg-yellow-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                    data-testid="badge-overall-risk-rating"
                  >
                    {riskAssessment.overallRisk}
                  </Badge>
                </div>

                <div className="border rounded-lg overflow-hidden print:border-border mt-4 print:mt-2">
                  <table className="w-full text-xs print:text-[9px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <TableCell header>Score Range</TableCell>
                        <TableCell header>Risk Level</TableCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { range: "80 – 100", level: "Very Low Risk", color: "text-green-600 dark:text-green-400" },
                        { range: "65 – 79", level: "Low Risk", color: "text-emerald-600 dark:text-emerald-400" },
                        { range: "50 – 64", level: "Moderate Risk", color: "text-yellow-600 dark:text-yellow-400" },
                        { range: "30 – 49", level: "High Risk", color: "text-orange-600 dark:text-orange-400" },
                        { range: "Below 30", level: "Very High Risk", color: "text-red-600 dark:text-red-400" },
                      ].map(row => (
                        <tr key={row.range} className="hover:bg-muted/20">
                          <TableCell className="font-mono font-medium">{row.range}</TableCell>
                          <TableCell className={`font-semibold ${row.color}`}>{row.level}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {report.aiEnhanced && (
            <Card data-testid="card-biz-ai-enhanced" className="border-2 border-dashed border-purple-300 dark:border-purple-700 print:border print:border-purple-400">
              <CardContent className="p-5 print:p-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg px-4 py-3 mb-4 print:mb-2 flex items-center gap-3">
                  <Brain className="w-5 h-5 text-white print:hidden" />
                  <div>
                    <h2 className="text-white font-bold text-sm print:text-xs">AI-Enhanced Business Intelligence</h2>
                    <p className="text-purple-200 text-[10px] print:text-[8px]">Machine Learning & Dual-AI Analysis</p>
                  </div>
                  <Badge className="ml-auto bg-white/20 text-white border-white/30 text-[9px] print:text-[7px]" data-testid="badge-biz-ai-generated">AI-GENERATED</Badge>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 print:mb-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 print:hidden" />
                    <p className="text-[9px] text-amber-800 dark:text-amber-300 print:text-[7px]">{report.aiEnhanced.disclaimer}</p>
                  </div>
                </div>

                {report.aiEnhanced.mlScore && (
                  <div className="mb-4 print:mb-2">
                    <div className="flex items-center gap-2 mb-3 print:mb-1">
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-biz-ml-label">
                        <Sparkles className="w-3 h-3 mr-1" />ML Score — {report.aiEnhanced.mlScore.modelVersion}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-1 mb-3 print:mb-1">
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">ML Score</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-biz-ml-score">{report.aiEnhanced.mlScore.mlScore}</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">Range 300–850</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Bureau Score</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 print:text-lg" data-testid="text-biz-bureau-compare">{report.summary.creditScore}</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">Traditional Model</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Confidence</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-biz-ml-confidence">{(report.aiEnhanced.mlScore.confidence * 100).toFixed(0)}%</p>
                        <p className="text-[8px] text-muted-foreground print:text-[6px]">{report.aiEnhanced.mlScore.confidenceInterval[0]}–{report.aiEnhanced.mlScore.confidenceInterval[1]}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 print:p-1 text-center border border-purple-200 dark:border-purple-800">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase print:text-[7px]">Default Prob.</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 print:text-lg" data-testid="text-biz-default-prob">{(report.aiEnhanced.mlScore.defaultProbability * 100).toFixed(1)}%</p>
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
                              <tr key={i} className="hover:bg-muted/20" data-testid={`row-biz-ml-feature-${i}`}>
                                <td className="px-3 py-1.5 font-medium">{f.feature}</td>
                                <td className="px-3 py-1.5 text-center">
                                  <Badge variant="outline" className={`text-[8px] ${f.direction === "positive" ? "text-green-600 border-green-300" : f.direction === "negative" ? "text-red-600 border-red-300" : "text-gray-500 border-gray-300"}`}>
                                    {f.direction === "positive" ? "+" : f.direction === "negative" ? "-" : "="} {f.direction}
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
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-biz-ai-risk-label">
                        <Brain className="w-3 h-3 mr-1" />AI Risk Assessment — GPT-4o
                      </Badge>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 print:p-2 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`text-xs ${
                          report.aiEnhanced.riskAnalysis.riskLevel === "low" ? "bg-green-500" :
                          report.aiEnhanced.riskAnalysis.riskLevel === "medium" ? "bg-yellow-500 text-black" :
                          report.aiEnhanced.riskAnalysis.riskLevel === "high" ? "bg-orange-500" : "bg-red-500"
                        }`} data-testid="badge-biz-ai-risk-level">{report.aiEnhanced.riskAnalysis.riskLevel.toUpperCase()} RISK</Badge>
                        <span className="text-xs text-muted-foreground">Score: {report.aiEnhanced.riskAnalysis.riskScore}/100</span>
                      </div>
                      <p className="text-xs text-foreground mb-3 print:text-[9px]" data-testid="text-biz-ai-summary">{report.aiEnhanced.riskAnalysis.summary}</p>
                      {(report.aiEnhanced.riskAnalysis.factors?.length ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 uppercase print:text-[7px]">Contributing Factors</p>
                          {report.aiEnhanced.riskAnalysis.factors.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10px] print:text-[8px]" data-testid={`row-biz-ai-factor-${i}`}>
                              <span className={`mt-0.5 ${f.impact === "positive" ? "text-green-500" : "text-red-500"}`}>{f.impact === "positive" ? "+" : "-"}</span>
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
                              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-biz-ai-rec-${i}`}>
                                <span className="text-purple-500">&rarr;</span> {r}
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
                      <Badge variant="outline" className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 text-[9px] print:text-[7px]" data-testid="badge-biz-narrative-label">
                        <Sparkles className="w-3 h-3 mr-1" />AI Credit Narrative — Claude
                      </Badge>
                      <Badge variant="outline" className={`text-[8px] ${
                        report.aiEnhanced.narrative.creditworthiness === "Excellent" || report.aiEnhanced.narrative.creditworthiness === "Good" ? "text-green-600 border-green-300" :
                        report.aiEnhanced.narrative.creditworthiness === "Fair" ? "text-yellow-600 border-yellow-300" : "text-red-600 border-red-300"
                      }`} data-testid="badge-biz-creditworthiness">{report.aiEnhanced.narrative.creditworthiness}</Badge>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 print:p-2 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-foreground whitespace-pre-line leading-relaxed print:text-[9px]" data-testid="text-biz-ai-narrative">{report.aiEnhanced.narrative.narrative}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 print:gap-1">
                        {(report.aiEnhanced.narrative.keyStrengths?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-green-700 dark:text-green-400 uppercase mb-1 print:text-[7px]">Key Strengths</p>
                            <ul className="space-y-0.5">
                              {report.aiEnhanced.narrative.keyStrengths.map((s, i) => (
                                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-biz-strength-${i}`}>
                                  <span className="text-green-500">+</span> {s}
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
                                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 print:text-[8px]" data-testid={`text-biz-risk-${i}`}>
                                  <span className="text-red-500">-</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground/60 mt-1 text-right print:text-[6px]" data-testid="text-biz-ai-timestamp">
                      AI analysis generated: {new Date(report.aiEnhanced.generatedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/20 print:bg-transparent">
            <CardContent className="p-4 print:p-2 text-center">
              <p className="text-[10px] text-muted-foreground print:text-[8px]">
                This report was generated by Africa Credit Hub (Pan-African Credit Registry v2.5) operated by {PLATFORM_COMPANY_NAME}.
                The information contained herein is derived from sources believed to be reliable but is not guaranteed as to accuracy or completeness.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 print:text-[8px]">
                Report #{report.serialNumber} | Generated: {new Date(report.generatedAt).toLocaleString("en-GB")} | &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
