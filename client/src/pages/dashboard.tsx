import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Users, CreditCard, Search, AlertTriangle, DollarSign, ShieldAlert,
  CheckSquare, AlertCircle, TrendingUp, Activity, X, ExternalLink,
  Building2, MapPin, UserCheck, BarChart3, Banknote, Clock, Gavel
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/currency";
import type { CreditAccount, AuditLog, ExchangeRate } from "@shared/schema";

const DISPLAY_CURRENCIES = [
  { code: "USD", label: "USD ($)", symbol: "$" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "GBP", label: "GBP (£)", symbol: "£" },
  { code: "ETB", label: "ETB (Br)", symbol: "Br" },
  { code: "KES", label: "KES (KSh)", symbol: "KSh" },
  { code: "NGN", label: "NGN (₦)", symbol: "₦" },
  { code: "ZAR", label: "ZAR (R)", symbol: "R" },
  { code: "EGP", label: "EGP (E£)", symbol: "E£" },
  { code: "GHS", label: "GHS (₵)", symbol: "₵" },
  { code: "TZS", label: "TZS (TSh)", symbol: "TSh" },
  { code: "UGX", label: "UGX (USh)", symbol: "USh" },
  { code: "XAF", label: "XAF (FCFA)", symbol: "FCFA" },
  { code: "XOF", label: "XOF (CFA)", symbol: "CFA" },
  { code: "MAD", label: "MAD", symbol: "MAD" },
  { code: "RWF", label: "RWF (FRw)", symbol: "FRw" },
];

function buildRateMap(rates: ExchangeRate[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rates) {
    map.set(`${r.fromCurrency}-${r.toCurrency}`, parseFloat(r.rate));
    const inv = parseFloat(r.rate);
    if (inv > 0) map.set(`${r.toCurrency}-${r.fromCurrency}`, 1 / inv);
  }
  return map;
}

function convertViaUSD(amount: number, from: string, to: string, rateMap: Map<string, number>): number | null {
  if (from === to) return amount;
  const direct = rateMap.get(`${from}-${to}`);
  if (direct) return amount * direct;
  const toUSD = from === "USD" ? 1 : rateMap.get(`${from}-USD`);
  const fromUSD = to === "USD" ? 1 : rateMap.get(`USD-${to}`);
  if (toUSD && fromUSD) return amount * toUSD * fromUSD;
  return null;
}

function getStatusColor(status: string) {
  switch (status) {
    case "current": return "default";
    case "delinquent": return "destructive";
    case "default": return "destructive";
    case "closed": return "secondary";
    case "restructured": return "outline";
    default: return "default";
  }
}

function BreakdownTable({ data, columns }: {
  data: any[];
  columns: { key: string; label: string; format?: (v: any) => string }[];
}) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">No data available</p>;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {columns.map(col => (
              <th key={col.key} className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-3 py-2.5 text-sm">
                  {col.format ? col.format(row[col.key]) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarBreakdown({ data, labelKey, valueKey, total }: {
  data: any[];
  labelKey: string;
  valueKey: string;
  total?: number;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => Number(d[valueKey])));
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const val = Number(item[valueKey]);
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate mr-2">{item[labelKey]}</span>
              <span className="text-muted-foreground shrink-0">
                {val.toLocaleString()}
                {total ? ` (${((val / total) * 100).toFixed(1)}%)` : ""}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, hsl(175 55% 28%), hsl(43 80% 55%))",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DetailType = "borrowers" | "accounts" | "outstanding" | "delinquent" | "defaults" | "inquiries" | "approvals" | "disputes" | null;

const detailConfig: Record<string, { title: string; icon: any; navigateTo: string }> = {
  borrowers: { title: "Borrower Details", icon: Users, navigateTo: "/borrowers" },
  accounts: { title: "Credit Account Details", icon: CreditCard, navigateTo: "/credit-accounts" },
  outstanding: { title: "Outstanding Portfolio", icon: DollarSign, navigateTo: "/credit-accounts" },
  delinquent: { title: "Delinquent Accounts", icon: AlertTriangle, navigateTo: "/credit-accounts" },
  defaults: { title: "Defaulted Accounts", icon: ShieldAlert, navigateTo: "/credit-accounts" },
  inquiries: { title: "Credit Inquiries", icon: Search, navigateTo: "/search" },
  approvals: { title: "Pending Approvals", icon: CheckSquare, navigateTo: "/approvals" },
  disputes: { title: "Open Disputes", icon: AlertCircle, navigateTo: "/disputes" },
};

function DetailContent({ type, data }: { type: DetailType; data: any }) {
  if (!data || !type) return <Skeleton className="h-40 w-full" />;

  switch (type) {
    case "borrowers":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4" /> By Type</h4>
            <BarBreakdown data={data.byType} labelKey="type" valueKey="count" />
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">PEP Flagged Borrowers</p>
              <p className="text-2xl font-extrabold text-amber-600">{data.pepCount?.toLocaleString()}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top Cities</h4>
            <BarBreakdown data={data.byCity} labelKey="city" valueKey="count" />
          </div>
          {data.recent && data.recent.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Recently Added</h4>
              <BreakdownTable
                data={data.recent}
                columns={[
                  { key: "firstName", label: "Name", format: (v: any) => v || "—" },
                  { key: "type", label: "Type" },
                  { key: "city", label: "City", format: (v: any) => v || "—" },
                ]}
              />
            </div>
          )}
        </div>
      );

    case "accounts":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> By Status</h4>
            <BarBreakdown data={data.byStatus} labelKey="status" valueKey="count" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> By Account Type</h4>
            <BarBreakdown data={data.byType} labelKey="type" valueKey="count" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Top Institutions</h4>
            <BreakdownTable
              data={data.byInstitution}
              columns={[
                { key: "institution", label: "Institution" },
                { key: "count", label: "Accounts", format: (v: any) => Number(v).toLocaleString() },
                { key: "total", label: "Total Balance", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
              ]}
            />
          </div>
        </div>
      );

    case "outstanding":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Banknote className="w-4 h-4" /> By Currency</h4>
            <BreakdownTable
              data={data.byCurrency}
              columns={[
                { key: "currency", label: "Currency" },
                { key: "count", label: "Accounts", format: (v: any) => Number(v).toLocaleString() },
                { key: "total", label: "Outstanding", format: (v: any) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
              ]}
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Top Institutions by Outstanding</h4>
            <BreakdownTable
              data={data.byInstitution}
              columns={[
                { key: "institution", label: "Institution" },
                { key: "count", label: "Accounts", format: (v: any) => Number(v).toLocaleString() },
                { key: "total", label: "Outstanding", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
              ]}
            />
          </div>
        </div>
      );

    case "delinquent":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> By Institution</h4>
            <BreakdownTable
              data={data.byInstitution}
              columns={[
                { key: "institution", label: "Institution" },
                { key: "count", label: "Delinquent", format: (v: any) => Number(v).toLocaleString() },
                { key: "totalOverdue", label: "Total Overdue", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
              ]}
            />
          </div>
          {data.accounts && data.accounts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Top Delinquent Accounts (by Days in Arrears)</h4>
              <BreakdownTable
                data={data.accounts.slice(0, 10)}
                columns={[
                  { key: "accountNumber", label: "Account" },
                  { key: "lenderInstitution", label: "Institution" },
                  { key: "daysInArrears", label: "Days Late", format: (v: any) => `${v} days` },
                  { key: "currentBalance", label: "Balance", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
                ]}
              />
            </div>
          )}
        </div>
      );

    case "defaults":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> By Institution</h4>
            <BreakdownTable
              data={data.byInstitution}
              columns={[
                { key: "institution", label: "Institution" },
                { key: "count", label: "Defaulted", format: (v: any) => Number(v).toLocaleString() },
                { key: "totalDefaulted", label: "Total Defaulted", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
              ]}
            />
          </div>
          {data.accounts && data.accounts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Top Defaulted Accounts</h4>
              <BreakdownTable
                data={data.accounts.slice(0, 10)}
                columns={[
                  { key: "accountNumber", label: "Account" },
                  { key: "lenderInstitution", label: "Institution" },
                  { key: "currentBalance", label: "Default Amount", format: (v: any) => formatCurrency(v, "ETB", { compact: true }) },
                  { key: "accountType", label: "Type" },
                ]}
              />
            </div>
          )}
        </div>
      );

    case "inquiries":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> By Purpose</h4>
            <BarBreakdown data={data.byPurpose} labelKey="purpose" valueKey="count" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> By Institution</h4>
            <BarBreakdown data={data.byInstitution} labelKey="institution" valueKey="count" />
          </div>
          {data.recent && data.recent.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Recent Inquiries</h4>
              <BreakdownTable
                data={data.recent.slice(0, 8)}
                columns={[
                  { key: "institution", label: "Institution" },
                  { key: "purpose", label: "Purpose" },
                  { key: "createdAt", label: "Date", format: (v: any) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                ]}
              />
            </div>
          )}
        </div>
      );

    case "approvals":
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> By Entity Type</h4>
            <BarBreakdown data={data.byType} labelKey="type" valueKey="count" />
          </div>
          {data.items && data.items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Pending Items</h4>
              <BreakdownTable
                data={data.items.slice(0, 10)}
                columns={[
                  { key: "entityType", label: "Type" },
                  { key: "action", label: "Action" },
                  { key: "createdAt", label: "Requested", format: (v: any) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                ]}
              />
            </div>
          )}
        </div>
      );

    case "disputes":
      return (
        <div className="space-y-6">
          {data.slaBreached > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold">SLA Breached</p>
                <p className="text-2xl font-extrabold text-red-600">{data.slaBreached}</p>
                <p className="text-xs text-muted-foreground">Disputes past their SLA deadline</p>
              </div>
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> By Dispute Type</h4>
            <BarBreakdown data={data.byType} labelKey="type" valueKey="count" />
          </div>
          {data.items && data.items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Gavel className="w-4 h-4" /> Active Disputes</h4>
              <BreakdownTable
                data={data.items.slice(0, 10)}
                columns={[
                  { key: "disputeType", label: "Type" },
                  { key: "description", label: "Description", format: (v: any) => v?.substring(0, 40) + (v?.length > 40 ? "..." : "") },
                  { key: "status", label: "Status" },
                  { key: "slaDeadline", label: "SLA Deadline", format: (v: any) => {
                    if (!v) return "—";
                    const d = new Date(v);
                    const isPast = d < new Date();
                    return isPast ? `⚠ ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                  }},
                ]}
              />
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selectedDetail, setSelectedDetail] = useState<DetailType>(null);
  const [displayCurrency, setDisplayCurrency] = useState(() => {
    return localStorage.getItem("dashboard_currency") || "USD";
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    outstandingByCurrency: { currency: string; total: string }[];
    delinquentAccounts: number;
    defaultAccounts: number;
    pendingApprovalCount: number;
    openDisputeCount: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: exchangeRates } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/exchange-rates"],
  });

  const rateMap = useMemo(() => buildRateMap(exchangeRates || []), [exchangeRates]);

  const convertedOutstanding = useMemo(() => {
    if (!stats?.outstandingByCurrency || rateMap.size === 0) return null;
    let total = 0;
    let hasConversion = false;
    for (const bucket of stats.outstandingByCurrency) {
      const amount = parseFloat(bucket.total);
      if (amount === 0) continue;
      const converted = convertViaUSD(amount, bucket.currency, displayCurrency, rateMap);
      if (converted !== null) {
        total += converted;
        hasConversion = true;
      }
    }
    return hasConversion ? total : null;
  }, [stats?.outstandingByCurrency, displayCurrency, rateMap]);

  const convertAmount = useCallback((value: string | number, fromCurrency: string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || rateMap.size === 0) return null;
    return convertViaUSD(num, fromCurrency, displayCurrency, rateMap);
  }, [displayCurrency, rateMap]);

  const handleCurrencyChange = (val: string) => {
    setDisplayCurrency(val);
    localStorage.setItem("dashboard_currency", val);
  };

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: [`/api/dashboard/details/${selectedDetail}`],
    enabled: !!selectedDetail,
  });

  const { data: recentAccounts, isLoading: accountsLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const config = selectedDetail ? detailConfig[selectedDetail] : null;
  const DetailIcon = config?.icon;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-dashboard-title">{t('dashboard.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={displayCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-dashboard-currency">
              <Banknote className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code} data-testid={`currency-option-${c.code}`}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live Data</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border border-border/60"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : stats ? (
          <>
            <StatCard title={t('dashboard.totalBorrowers')} value={stats.totalBorrowers.toLocaleString()} icon={Users} testId="stat-borrowers" colorIndex={0} onClick={() => setSelectedDetail("borrowers")} />
            <StatCard title={t('dashboard.creditAccounts')} value={stats.totalAccounts.toLocaleString()} icon={CreditCard} testId="stat-accounts" colorIndex={1} onClick={() => setSelectedDetail("accounts")} />
            <StatCard title={t('dashboard.outstanding')} value={formatCurrency(stats.totalOutstanding, "ETB", { compact: true })} icon={DollarSign} testId="stat-outstanding" colorIndex={2} onClick={() => setSelectedDetail("outstanding")} />
            <StatCard title={t('dashboard.delinquent')} value={stats.delinquentAccounts.toLocaleString()} icon={AlertTriangle} testId="stat-delinquent" subtitle={t('dashboard.delinquentSub')} colorIndex={3} onClick={() => setSelectedDetail("delinquent")} />
            <StatCard title={t('dashboard.defaults')} value={stats.defaultAccounts.toLocaleString()} icon={ShieldAlert} testId="stat-defaults" subtitle={t('dashboard.defaultsSub')} colorIndex={4} onClick={() => setSelectedDetail("defaults")} />
            <StatCard title={t('dashboard.inquiries')} value={stats.totalInquiries.toLocaleString()} icon={Search} testId="stat-inquiries" colorIndex={5} onClick={() => setSelectedDetail("inquiries")} />
            <StatCard title={t('dashboard.pendingApprovals')} value={stats.pendingApprovalCount.toLocaleString()} icon={CheckSquare} testId="stat-approvals" subtitle={t('dashboard.pendingApprovalsSub')} colorIndex={6} onClick={() => setSelectedDetail("approvals")} />
            <StatCard title={t('dashboard.openDisputes')} value={stats.openDisputeCount.toLocaleString()} icon={AlertCircle} testId="stat-disputes" subtitle={t('dashboard.openDisputesSub')} colorIndex={7} onClick={() => setSelectedDetail("disputes")} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-card to-background">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t('dashboard.recentAccounts')}</h3>
                  <p className="text-[11px] text-muted-foreground">{t('dashboard.recentAccountsSub')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-semibold">{recentAccounts?.length || 0} {t('dashboard.total')}</Badge>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/credit-accounts")} data-testid="link-view-all-accounts">
                  View All <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentAccounts && recentAccounts.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentAccounts.slice(0, 6).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    data-testid={`row-account-${account.id}`}
                    onClick={() => {
                      if (account.borrowerId) navigate(`/borrowers/${account.borrowerId}`);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{account.accountNumber}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{account.lenderInstitution} &middot; {account.accountType}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(account.currentBalance, account.currency, { compact: true })}</p>
                      </div>
                      <Badge variant={getStatusColor(account.status)} className="text-[10px] capitalize font-medium">
                        {account.status}
                      </Badge>
                      <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noAccounts')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-card to-background">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 70% 48%) 100%)" }}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t('dashboard.recentActivity')}</h3>
                  <p className="text-[11px] text-muted-foreground">{t('dashboard.recentActivitySub')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-semibold">{auditLogs?.length || 0} {t('dashboard.entries')}</Badge>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/audit")} data-testid="link-view-all-audit">
                  View All <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {logsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="divide-y divide-border/50">
                {auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    data-testid={`row-audit-${log.id}`}
                    onClick={() => navigate("/audit")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{log.details || log.action}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.entity} &middot; {log.action}
                        {log.ipAddress && <span> &middot; {log.ipAddress}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedDetail} onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-dashboard-detail">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {DetailIcon && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
                    <DetailIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <SheetTitle className="text-lg">{config?.title}</SheetTitle>
              </div>
            </div>
          </SheetHeader>
          <div className="py-6">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <DetailContent type={selectedDetail} data={detailData} />
            )}
          </div>
          {config && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => { setSelectedDetail(null); navigate(config.navigateTo); }}
                data-testid="button-navigate-detail"
              >
                Go to {config.title} Page
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
