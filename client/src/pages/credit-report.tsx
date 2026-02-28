import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import {
  ArrowLeft, Printer, FileText, User, Building2, CreditCard, Search,
  AlertTriangle, Shield, Gavel, CheckCircle2, XCircle, Clock, Flag,
  Calendar, MapPin, Phone, Mail, Briefcase, Hash, TrendingUp, Activity
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

function getPaymentStatusIcon(status: string) {
  switch (status) {
    case "on_time": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "late": return <Clock className="w-4 h-4 text-yellow-500" />;
    case "missed": return <XCircle className="w-4 h-4 text-red-500" />;
    case "partial": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
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

function SectionHeader({ icon: Icon, title, count }: { icon: any; title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 print:mb-2">
      <h2 className="text-base font-bold flex items-center gap-2 print:text-sm">
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

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/search")} data-testid="button-back-search">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-report-title">Credit Report</h1>
            <p className="text-sm text-muted-foreground">Generate a comprehensive credit report</p>
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
        <div ref={printRef} className="space-y-6 print:space-y-3" data-testid="credit-report-content">
          <div className="flex items-center justify-end gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-report">
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>

          <Card className="border-2 border-primary/20 overflow-hidden print:border print:border-gray-300 print:shadow-none">
            <div className="p-6 print:p-4" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
              <div className="flex items-center justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-6 h-6" />
                    <h1 className="text-xl font-bold print:text-base">Credit Registry Report</h1>
                  </div>
                  <p className="text-sm text-white/70 print:text-[10px]">Cross-Jurisdictional Central Data Hub v1.1</p>
                  <p className="text-xs text-white/50 mt-1 print:text-[8px]">Systems In Motion Limited</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/10 rounded-lg px-4 py-2 print:px-2 print:py-1">
                    <p className="text-[10px] text-white/60 uppercase tracking-wider print:text-[8px]">Serial Number</p>
                    <p className="text-sm font-mono font-bold print:text-[10px]" data-testid="text-serial-number">{report.serialNumber}</p>
                  </div>
                  <p className="text-[10px] text-white/50 mt-2 print:text-[8px]">
                    Generated: {new Date(report.generatedAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  {report.requestedBy && (
                    <p className="text-[10px] text-white/50 print:text-[8px]">
                      By: {report.requestedBy.fullName} ({report.requestedBy.institution})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 print:p-4 space-y-1 bg-muted/30">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 shrink-0 print:w-10 print:h-10">
                  {report.borrower.type === "corporate" ? (
                    <Building2 className="w-7 h-7 text-primary print:w-5 print:h-5" />
                  ) : (
                    <User className="w-7 h-7 text-primary print:w-5 print:h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold print:text-base" data-testid="text-report-borrower-name">
                    {report.borrower.type === "corporate"
                      ? report.borrower.companyName
                      : `${report.borrower.firstName} ${report.borrower.lastName}`}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] capitalize">{report.borrower.type}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{report.borrower.nationalId}</span>
                    {report.summary.isPep && (
                      <Badge variant="destructive" className="text-[10px]" data-testid="badge-report-pep">
                        <Flag className="w-3 h-3 mr-1" /> PEP
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2">
            <Card className={`${getScoreGrade(report.summary.creditScore).bg} border-0`}>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Credit Score</p>
                <p className={`text-3xl font-black mt-1 print:text-xl ${getScoreGrade(report.summary.creditScore).color}`} data-testid="text-report-score">
                  {report.summary.creditScore}
                </p>
                <Badge variant="outline" className="mt-1 text-[10px] print:text-[8px]">
                  {getScoreGrade(report.summary.creditScore).label}
                </Badge>
                <p className="text-[9px] text-muted-foreground mt-1 print:text-[7px]">Range: 300–850</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Accounts</p>
                <p className="text-3xl font-black mt-1 print:text-xl">{report.summary.totalAccounts}</p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">{report.summary.activeAccounts} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Total Debt</p>
                <p className="text-2xl font-black mt-1 print:text-lg">{formatCurrency(report.summary.totalDebt, "ETB", { compact: true })}</p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">Outstanding</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center print:p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-[8px]">Risk Items</p>
                <p className="text-3xl font-black mt-1 print:text-xl text-destructive">
                  {report.summary.delinquentAccounts + report.summary.writtenOffAccounts + report.summary.judgmentCount}
                </p>
                <p className="text-[10px] text-muted-foreground print:text-[8px]">
                  {report.summary.delinquentAccounts} delinq. · {report.summary.judgmentCount} judgments
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
                        {isPositive ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span>{getReasonCodeLabel(code)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={User} title="Personal / Company Information" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:gap-2">
                {report.borrower.type === "individual" ? (
                  <>
                    <InfoField label="Full Name" value={`${report.borrower.firstName} ${report.borrower.lastName}`} />
                    <InfoField label="Date of Birth" value={report.borrower.dateOfBirth || "—"} />
                    <InfoField label="Gender" value={report.borrower.gender || "—"} />
                    <InfoField label="National ID" value={report.borrower.nationalId} />
                    <InfoField label="TIN" value={report.borrower.tinNumber || "—"} />
                    <InfoField label="Employer" value={report.borrower.employerName || "—"} />
                    <InfoField label="Occupation" value={report.borrower.occupation || "—"} />
                  </>
                ) : (
                  <>
                    <InfoField label="Company Name" value={report.borrower.companyName || "—"} />
                    <InfoField label="Registration" value={report.borrower.businessRegNumber || "—"} />
                    <InfoField label="Sector" value={report.borrower.sector || "—"} />
                    <InfoField label="TIN" value={report.borrower.tinNumber || "—"} />
                  </>
                )}
                <InfoField label="Phone" value={report.borrower.phone || "—"} />
                <InfoField label="Email" value={report.borrower.email || "—"} />
                <InfoField label="Address" value={[report.borrower.address, report.borrower.city, report.borrower.region].filter(Boolean).join(", ") || "—"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 print:p-3">
              <SectionHeader icon={CreditCard} title="Credit Accounts" count={report.accounts.length} />
              {report.accounts.length > 0 ? (
                <div className="space-y-4 print:space-y-2">
                  {report.accounts.map((account) => {
                    const currency = account.currency || "ETB";
                    const history = report.paymentHistory?.[account.id] || [];
                    return (
                      <div key={account.id} className="border rounded-lg overflow-hidden print:border-gray-300" data-testid={`report-account-${account.id}`}>
                        <div className="p-4 bg-muted/30 print:p-2">
                          <div className="flex items-center justify-between gap-3 mb-3 print:mb-1">
                            <div>
                              <p className="text-sm font-bold print:text-[11px]">{account.accountNumber}</p>
                              <p className="text-xs text-muted-foreground print:text-[9px]">{account.lenderInstitution} · {account.accountType}</p>
                            </div>
                            <Badge variant={getStatusColor(account.status)} className="text-[10px] capitalize print:text-[8px]">{account.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-1">
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Original Amount</p>
                              <p className="text-sm font-semibold print:text-[10px]">{formatCurrency(account.originalAmount, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Current Balance</p>
                              <p className="text-sm font-semibold print:text-[10px]">{formatCurrency(account.currentBalance, currency)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Interest Rate</p>
                              <p className="text-sm font-semibold print:text-[10px]">
                                {account.isInterestFree ? "Interest-Free" : `${account.interestRate || "—"}%`}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Days in Arrears</p>
                              <p className={`text-sm font-semibold print:text-[10px] ${(account.daysInArrears || 0) > 0 ? "text-destructive" : ""}`}>
                                {account.daysInArrears || 0}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 print:gap-1 print:mt-1">
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Disbursement</p>
                              <p className="text-xs font-medium print:text-[9px]">{account.disbursementDate || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground print:text-[8px]">Maturity</p>
                              <p className="text-xs font-medium print:text-[9px]">{account.maturityDate || "—"}</p>
                            </div>
                            {account.collateralType && (
                              <div>
                                <p className="text-[10px] text-muted-foreground print:text-[8px]">Collateral</p>
                                <p className="text-xs font-medium print:text-[9px]">{account.collateralType} — {formatCurrency(account.collateralValue || "0", currency)}</p>
                              </div>
                            )}
                            {(account.restructureCount || 0) > 0 && (
                              <div>
                                <p className="text-[10px] text-muted-foreground print:text-[8px]">Restructures</p>
                                <p className="text-xs font-medium text-amber-600 print:text-[9px]">{account.restructureCount}x</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {history.length > 0 && (
                          <div className="p-4 border-t print:p-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 print:text-[8px] print:mb-1">
                              Payment Performance (Last {history.length} Periods)
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1">
                              {history.map((ph, i) => (
                                <div key={i} className="text-center" title={`${ph.period}: ${ph.status}`}>
                                  <div className="flex justify-center mb-0.5">
                                    {getPaymentStatusIcon(ph.status)}
                                  </div>
                                  <p className="text-[8px] text-muted-foreground truncate">{ph.period}</p>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground print:mt-1">
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> On time</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" /> Late</span>
                              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Missed</span>
                              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Partial</span>
                            </div>
                          </div>
                        )}
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
                <SectionHeader icon={Gavel} title="Court Judgments & Public Records" count={report.courtJudgments.length} />
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
                  <table className="w-full text-sm print:text-[10px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Case No.</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Court</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Amount</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.courtJudgments.map((j) => (
                        <tr key={j.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono print:px-1.5 print:py-1">{j.caseNumber}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{j.court}</td>
                          <td className="px-3 py-2 capitalize print:px-1.5 print:py-1">{j.judgmentType.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{j.amount ? formatCurrency(j.amount, j.currency || "ETB") : "—"}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{j.judgmentDate}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">
                            <Badge variant={j.status === "active" ? "destructive" : "default"} className="text-[10px] capitalize print:text-[8px]">{j.status}</Badge>
                          </td>
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
              <SectionHeader icon={Search} title="Credit Inquiries" count={report.inquiries.length} />
              {report.inquiries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
                  <table className="w-full text-sm print:text-[10px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Institution</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Purpose</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Consent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium print:px-1.5 print:py-1">{inq.institution}</td>
                          <td className="px-3 py-2 capitalize print:px-1.5 print:py-1">{inq.purpose.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">
                            {inq.consentProvided ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </td>
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

          {report.consentRecords && report.consentRecords.length > 0 && (
            <Card>
              <CardContent className="p-5 print:p-3">
                <SectionHeader icon={Shield} title="Consent Records" count={report.consentRecords.length} />
                <div className="border rounded-lg overflow-hidden print:border-gray-300">
                  <table className="w-full text-sm print:text-[10px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Granted To</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Purpose</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Receipt</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold print:px-1.5 print:py-1 print:text-[8px]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.consentRecords.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium print:px-1.5 print:py-1">{c.grantedTo}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{c.purpose}</td>
                          <td className="px-3 py-2 font-mono text-xs print:px-1.5 print:py-1">{c.receiptNumber}</td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">
                            <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-[10px] capitalize print:text-[8px]">{c.status}</Badge>
                          </td>
                          <td className="px-3 py-2 print:px-1.5 print:py-1">{c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("en-GB") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/20 print:bg-white">
            <CardContent className="p-5 print:p-3">
              <div className="text-center space-y-2 print:space-y-1">
                <Separator className="mb-4 print:mb-2" />
                <p className="text-xs text-muted-foreground print:text-[8px]">
                  This credit report was generated by the Credit Registry System operated by Systems In Motion Limited.
                </p>
                <p className="text-xs text-muted-foreground print:text-[8px]">
                  Report Serial: <span className="font-mono font-semibold">{report.serialNumber}</span> · 
                  Generated: {new Date(report.generatedAt).toLocaleString("en-GB")}
                  {report.requestedBy && ` · Requested by: ${report.requestedBy.fullName} (${report.requestedBy.institution})`}
                </p>
                <p className="text-[10px] text-muted-foreground/60 print:text-[7px]">
                  The information contained in this report has been compiled from data submitted by participating financial institutions. 
                  Systems In Motion Limited does not guarantee the accuracy, completeness, or timeliness of the information.
                  This report is confidential and intended solely for the authorized recipient.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
