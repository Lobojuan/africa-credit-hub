import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Banknote, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronLeft, Wallet, Globe, Search, X, Shield, ShieldCheck,
  Smartphone, Users, ArrowUpRight, BarChart3, DollarSign, PieChart, RefreshCw,
  FileText, Send, CreditCard, CalendarDays, Receipt, Eye, Loader2, History,
  Fingerprint, ScrollText, Ban, Check, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TelcoLoan, TelcoLoanRepayment, TelcoConsentEvent } from "@shared/schema";

const COUNTRIES = ["Ghana", "Kenya", "Nigeria", "Sierra Leone", "South Africa", "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Egypt"];
const LOAN_STATUSES = ["pending_disbursement", "disbursed", "active", "repaying", "paid_off", "defaulted", "written_off", "restructured"];

const COUNTRY_CURRENCIES: Record<string, { symbol: string; code: string }> = {
  "Ghana": { symbol: "GH₵", code: "GHS" }, "Kenya": { symbol: "KSh", code: "KES" },
  "Nigeria": { symbol: "₦", code: "NGN" }, "Sierra Leone": { symbol: "Le", code: "SLL" },
  "South Africa": { symbol: "R", code: "ZAR" }, "Tanzania": { symbol: "TSh", code: "TZS" },
  "Uganda": { symbol: "USh", code: "UGX" }, "Rwanda": { symbol: "RF", code: "RWF" },
  "Ethiopia": { symbol: "Br", code: "ETB" }, "Egypt": { symbol: "E£", code: "EGP" },
};

function getCur(country?: string | null) {
  return COUNTRY_CURRENCIES[country || ""] || { symbol: "$", code: "USD" };
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending_disbursement: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    disbursed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    repaying: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    paid_off: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    defaulted: "bg-red-500/10 text-red-500 border-red-500/20",
    written_off: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    restructured: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getDisbursementColor(status: string) {
  const colors: Record<string, string> = {
    pending: "text-yellow-500", processing: "text-blue-500",
    confirmed: "text-green-500", failed: "text-red-500", reversed: "text-orange-500",
  };
  return colors[status] || "text-muted-foreground";
}

type PortfolioStats = {
  totalDisbursed: number; totalOutstanding: number; totalRepaid: number;
  activeLoans: number; defaultedLoans: number; paidOffLoans: number;
  defaultRate: number; collectionRate: number;
  par30: number; par60: number; par90: number;
  avgLoanSize: number; totalLoans: number;
};

export default function TelcoLending() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [loansPage, setLoansPage] = useState(1);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [repaymentDialogOpen, setRepaymentDialogOpen] = useState(false);
  const [repaymentLoanId, setRepaymentLoanId] = useState<string | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [consentProfileId, setConsentProfileId] = useState("");
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [consentAction, setConsentAction] = useState<"grant" | "revoke">("grant");
  const [consentMethod, setConsentMethod] = useState("web_portal");
  const [consentPurpose, setConsentPurpose] = useState("credit_scoring");

  const { data: portfolioStats, isLoading: statsLoading } = useQuery<PortfolioStats>({
    queryKey: ["/api/telco/loans/portfolio", filterCountry],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCountry) params.set("country", filterCountry);
      const res = await fetch(`/api/telco/loans/portfolio?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  type PaginatedLoans = { data: TelcoLoan[]; total: number; page: number; totalPages: number };
  const { data: loansData, isLoading: loansLoading } = useQuery<PaginatedLoans>({
    queryKey: ["/api/telco/loans", loansPage, filterCountry, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(loansPage), limit: "50" });
      if (filterCountry) params.set("country", filterCountry);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/telco/loans?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: consentSummary } = useQuery<{ total: number; active: number; revoked: number; byMethod: Record<string, number> }>({
    queryKey: ["/api/telco/consent-summary", filterCountry],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCountry) params.set("country", filterCountry);
      const res = await fetch(`/api/telco/consent-summary?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: selectedLoan } = useQuery<TelcoLoan>({
    queryKey: ["/api/telco/loans", selectedLoanId],
    queryFn: async () => {
      const res = await fetch(`/api/telco/loans/${selectedLoanId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedLoanId,
  });

  const { data: loanRepayments } = useQuery<TelcoLoanRepayment[]>({
    queryKey: ["/api/telco/loans", selectedLoanId, "repayments"],
    queryFn: async () => {
      const res = await fetch(`/api/telco/loans/${selectedLoanId}/repayments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedLoanId,
  });

  const { data: consentEvents } = useQuery<TelcoConsentEvent[]>({
    queryKey: ["/api/telco/consent", consentProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/telco/consent/${consentProfileId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!consentProfileId && consentProfileId.length > 5,
  });

  const disburseMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await apiRequest("POST", `/api/telco/loans/${loanId}/disburse`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Loan disbursed", description: "Funds have been released" });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/loans"] });
    },
    onError: (e: any) => toast({ title: "Disbursement failed", description: e.message, variant: "destructive" }),
  });

  const repaymentMutation = useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: string; amount: string }) => {
      const res = await apiRequest("POST", `/api/telco/loans/${loanId}/repayments`, {
        amountDue: amount,
        amountPaid: amount,
        status: "paid",
        paidAt: new Date().toISOString(),
        dueDate: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Repayment recorded" });
      setRepaymentDialogOpen(false);
      setRepaymentAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/telco/loans"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const consentMutation = useMutation({
    mutationFn: async (data: { profileId: string; action: string; method: string; purpose: string }) => {
      const res = await apiRequest("POST", "/api/telco/consent", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Consent ${consentAction === "grant" ? "granted" : "revoked"}`, description: `Receipt: ${data.consentReceiptId}` });
      setConsentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/telco/consent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/consent-summary"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const loans = loansData?.data;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-lending-title">
            <Banknote className="w-6 h-6 text-primary" /> Telco Lending & Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Loan lifecycle management, disbursements, repayments, and consent compliance</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="portfolio" className="text-xs" data-testid="tab-portfolio">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Portfolio
          </TabsTrigger>
          <TabsTrigger value="loans" className="text-xs" data-testid="tab-loans">
            <CreditCard className="w-3.5 h-3.5 mr-1" /> Loans
          </TabsTrigger>
          <TabsTrigger value="consent" className="text-xs" data-testid="tab-consent">
            <Fingerprint className="w-3.5 h-3.5 mr-1" /> Consent
          </TabsTrigger>
        </TabsList>

        {/* ─── PORTFOLIO TAB ─── */}
        <TabsContent value="portfolio" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-[160px] text-xs" data-testid="select-portfolio-country">
                <Globe className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
            </div>
          ) : portfolioStats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Total Disbursed</span>
                    </div>
                    <p className="text-xl font-bold" data-testid="text-total-disbursed">{getCur(filterCountry).symbol}{portfolioStats.totalDisbursed.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Outstanding</span>
                    </div>
                    <p className="text-xl font-bold" data-testid="text-outstanding">{getCur(filterCountry).symbol}{portfolioStats.totalOutstanding.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Total Repaid</span>
                    </div>
                    <p className="text-xl font-bold" data-testid="text-total-repaid">{getCur(filterCountry).symbol}{portfolioStats.totalRepaid.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-violet-500" />
                      <span className="text-xs text-muted-foreground">Avg Loan Size</span>
                    </div>
                    <p className="text-xl font-bold">{getCur(filterCountry).symbol}{portfolioStats.avgLoanSize.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Active Loans</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="text-active-loans">{portfolioStats.activeLoans}</p>
                    <p className="text-[11px] text-muted-foreground">{portfolioStats.totalLoans} total loans</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-teal-500" />
                      <span className="text-xs text-muted-foreground">Paid Off</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-500">{portfolioStats.paidOffLoans}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-muted-foreground">Defaulted</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{portfolioStats.defaultedLoans}</p>
                    <p className="text-[11px] text-muted-foreground">Default rate: {portfolioStats.defaultRate}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Collection Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-500">{portfolioStats.collectionRate}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Portfolio at Risk (PAR)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">PAR 30+</span>
                        <span className="text-sm font-bold">{portfolioStats.par30}%</span>
                      </div>
                      <Progress value={portfolioStats.par30} className="h-2" data-testid="progress-par30" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">PAR 60+</span>
                        <span className="text-sm font-bold">{portfolioStats.par60}%</span>
                      </div>
                      <Progress value={portfolioStats.par60} className="h-2" data-testid="progress-par60" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">PAR 90+</span>
                        <span className="text-sm font-bold text-red-500">{portfolioStats.par90}%</span>
                      </div>
                      <Progress value={portfolioStats.par90} className="h-2" data-testid="progress-par90" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Banknote className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No portfolio data yet</p>
                <p className="text-sm text-muted-foreground mt-1">Approve and disburse loans from the Decision Engine to see portfolio metrics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── LOANS TAB ─── */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Select value={filterCountry} onValueChange={(v) => { setFilterCountry(v === "all" ? "" : v); setLoansPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="select-loans-country">
                <Globe className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setLoansPage(1); }}>
              <SelectTrigger className="h-8 w-[160px] text-xs" data-testid="select-loans-status">
                <CreditCard className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {LOAN_STATUSES.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterCountry || filterStatus) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setFilterCountry(""); setFilterStatus(""); setLoansPage(1); }}>
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{loansData?.total?.toLocaleString() || 0} loans</span>
          </div>

          {loansLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ) : loans && loans.length > 0 ? (
            <div className="space-y-2">
              {loans.map(loan => {
                const cur = getCur(loan.country);
                return (
                  <Card key={loan.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedLoanId(selectedLoanId === loan.id ? null : loan.id)} data-testid={`card-loan-${loan.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold">{cur.symbol}{Number(loan.loanAmount).toLocaleString()}</span>
                            <span className="text-[11px] text-muted-foreground">{loan.profileId?.slice(0, 20)}...</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] border ${getStatusColor(loan.status)}`}>
                            {getStatusLabel(loan.status)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            <span className={getDisbursementColor(loan.disbursementStatus)}>{loan.disbursementStatus}</span>
                          </Badge>
                          {loan.country && <Badge variant="secondary" className="text-[10px]">{loan.country}</Badge>}
                          {loan.daysInArrears && loan.daysInArrears > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">{loan.daysInArrears}d arrears</Badge>
                          ) : null}
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedLoanId === loan.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span>Tenor: {loan.tenorDays}d</span>
                        <span>Rate: {Number(loan.interestRate)}%</span>
                        <span>Repaid: {cur.symbol}{Number(loan.amountRepaid || 0).toLocaleString()}</span>
                        <span>Outstanding: {cur.symbol}{Number(loan.outstandingBalance).toLocaleString()}</span>
                        {loan.dueDate && <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>}
                      </div>

                      {selectedLoanId === loan.id && (
                        <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <Separator />
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg border border-border bg-card">
                              <p className="text-[10px] text-muted-foreground mb-1">Total Repayable</p>
                              <p className="text-sm font-bold">{cur.symbol}{Number(loan.totalRepayable).toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-card">
                              <p className="text-[10px] text-muted-foreground mb-1">Disbursement Ref</p>
                              <p className="text-sm font-mono">{loan.disbursementRef || "—"}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-card">
                              <p className="text-[10px] text-muted-foreground mb-1">Disbursed At</p>
                              <p className="text-sm">{loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleString() : "—"}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-card">
                              <p className="text-[10px] text-muted-foreground mb-1">Repayment</p>
                              <p className="text-sm">{loan.repaymentFrequency?.replace(/_/g, " ")} ({loan.installmentCount} inst.)</p>
                            </div>
                          </div>

                          {loanRepayments && loanRepayments.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <History className="w-3.5 h-3.5" /> Repayment History
                              </p>
                              <div className="space-y-1">
                                {loanRepayments.map(r => (
                                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={r.status === "paid" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge>
                                      <span>#{r.installmentNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span>{cur.symbol}{Number(r.amountPaid || 0).toLocaleString()}</span>
                                      <span className="text-muted-foreground">{r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "pending"}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {loan.status === "pending_disbursement" && (
                              <Button size="sm" className="text-xs" onClick={() => disburseMutation.mutate(loan.id)} disabled={disburseMutation.isPending} data-testid={`button-disburse-${loan.id}`}>
                                {disburseMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                                Disburse Funds
                              </Button>
                            )}
                            {["disbursed", "active", "repaying"].includes(loan.status) && (
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRepaymentLoanId(loan.id); setRepaymentDialogOpen(true); }} data-testid={`button-repay-${loan.id}`}>
                                <Receipt className="w-3 h-3 mr-1" /> Record Repayment
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold" data-testid="text-no-loans">No loans yet</p>
                <p className="text-sm text-muted-foreground mt-1">Loans are created when profiles are approved through the Decision Engine</p>
              </CardContent>
            </Card>
          )}

          {loansData && loansData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">Page {loansData.page} of {loansData.totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={loansPage <= 1} onClick={() => setLoansPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={loansPage >= loansData.totalPages} onClick={() => setLoansPage(p => p + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── CONSENT TAB ─── */}
        <TabsContent value="consent" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ScrollText className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Events</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-consent-total">{consentSummary?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Active Consents</span>
                </div>
                <p className="text-2xl font-bold text-green-500" data-testid="text-consent-active">{consentSummary?.active || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Revoked</span>
                </div>
                <p className="text-2xl font-bold text-red-500" data-testid="text-consent-revoked">{consentSummary?.revoked || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint className="w-4 h-4 text-violet-500" />
                  <span className="text-xs text-muted-foreground">By Method</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {consentSummary?.byMethod && Object.entries(consentSummary.byMethod).map(([method, cnt]) => (
                    <Badge key={method} variant="secondary" className="text-[10px]">{method}: {cnt}</Badge>
                  ))}
                  {(!consentSummary?.byMethod || Object.keys(consentSummary.byMethod).length === 0) && (
                    <span className="text-xs text-muted-foreground">No data</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Manage Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                Grant or revoke data processing consent for MoMo subscribers. All consent actions are logged with timestamp, method, IP, and generate a unique receipt ID for regulatory compliance.
              </p>
              <Button size="sm" onClick={() => setConsentDialogOpen(true)} data-testid="button-manage-consent">
                <Fingerprint className="w-3.5 h-3.5 mr-1" /> Record Consent Action
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4" /> Consent Event Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter Profile ID to view consent history..."
                  value={consentProfileId}
                  onChange={(e) => setConsentProfileId(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-consent-profile"
                />
              </div>
              {consentEvents && consentEvents.length > 0 ? (
                <div className="space-y-2">
                  {consentEvents.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-xs">
                      <div className="flex items-center gap-2">
                        {ev.action === "grant" ? <Check className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-red-500" />}
                        <div>
                          <p className="font-medium">{ev.action === "grant" ? "Consent Granted" : "Consent Revoked"}</p>
                          <p className="text-muted-foreground">{ev.purpose} via {ev.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px]">{ev.consentReceiptId}</p>
                        <p className="text-muted-foreground">{ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ""}</p>
                        {ev.ipAddress && <p className="text-muted-foreground">IP: {ev.ipAddress}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : consentProfileId.length > 5 ? (
                <p className="text-xs text-muted-foreground">No consent events found for this profile</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Repayment Dialog */}
      <Dialog open={repaymentDialogOpen} onOpenChange={setRepaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" /> Record Repayment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                placeholder="Enter repayment amount"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                data-testid="input-repayment-amount"
              />
            </div>
            <Button
              className="w-full"
              disabled={!repaymentAmount || repaymentMutation.isPending}
              onClick={() => repaymentLoanId && repaymentMutation.mutate({ loanId: repaymentLoanId, amount: repaymentAmount })}
              data-testid="button-submit-repayment"
            >
              {repaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Submit Repayment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consent Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5" /> Record Consent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Profile ID</Label>
              <Input
                placeholder="Enter telco profile ID"
                value={consentProfileId}
                onChange={(e) => setConsentProfileId(e.target.value)}
                data-testid="input-consent-dialog-profile"
              />
            </div>
            <div>
              <Label className="text-xs">Action</Label>
              <Select value={consentAction} onValueChange={(v) => setConsentAction(v as "grant" | "revoke")}>
                <SelectTrigger data-testid="select-consent-action"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant Consent</SelectItem>
                  <SelectItem value="revoke">Revoke Consent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Method</Label>
              <Select value={consentMethod} onValueChange={setConsentMethod}>
                <SelectTrigger data-testid="select-consent-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ussd">USSD</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="app">Mobile App</SelectItem>
                  <SelectItem value="web_portal">Web Portal</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="ivr">IVR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Purpose</Label>
              <Select value={consentPurpose} onValueChange={setConsentPurpose}>
                <SelectTrigger data-testid="select-consent-purpose"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_scoring">Credit Scoring</SelectItem>
                  <SelectItem value="loan_assessment">Loan Assessment</SelectItem>
                  <SelectItem value="data_sharing">Data Sharing</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!consentProfileId || consentMutation.isPending}
              onClick={() => consentMutation.mutate({ profileId: consentProfileId, action: consentAction, method: consentMethod, purpose: consentPurpose })}
              data-testid="button-submit-consent"
            >
              {consentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
              {consentAction === "grant" ? "Grant Consent" : "Revoke Consent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
