import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Users, CreditCard, Search, AlertTriangle, DollarSign, ShieldAlert, CheckSquare, AlertCircle, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/currency";
import type { CreditAccount, AuditLog } from "@shared/schema";

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

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    delinquentAccounts: number;
    defaultAccounts: number;
    pendingApprovalCount: number;
    openDisputeCount: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: recentAccounts, isLoading: accountsLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
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
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border border-border/60"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : stats ? (
          <>
            <StatCard title={t('dashboard.totalBorrowers')} value={stats.totalBorrowers} icon={Users} testId="stat-borrowers" colorIndex={0} />
            <StatCard title={t('dashboard.creditAccounts')} value={stats.totalAccounts} icon={CreditCard} testId="stat-accounts" colorIndex={1} />
            <StatCard title={t('dashboard.outstanding')} value={formatCurrency(stats.totalOutstanding, "ETB", { compact: true })} icon={DollarSign} testId="stat-outstanding" colorIndex={2} />
            <StatCard title={t('dashboard.delinquent')} value={stats.delinquentAccounts} icon={AlertTriangle} testId="stat-delinquent" subtitle={t('dashboard.delinquentSub')} colorIndex={3} />
            <StatCard title={t('dashboard.defaults')} value={stats.defaultAccounts} icon={ShieldAlert} testId="stat-defaults" subtitle={t('dashboard.defaultsSub')} colorIndex={4} />
            <StatCard title={t('dashboard.inquiries')} value={stats.totalInquiries} icon={Search} testId="stat-inquiries" colorIndex={5} />
            <StatCard title={t('dashboard.pendingApprovals')} value={stats.pendingApprovalCount} icon={CheckSquare} testId="stat-approvals" subtitle={t('dashboard.pendingApprovalsSub')} colorIndex={6} />
            <StatCard title={t('dashboard.openDisputes')} value={stats.openDisputeCount} icon={AlertCircle} testId="stat-disputes" subtitle={t('dashboard.openDisputesSub')} colorIndex={7} />
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
              <Badge variant="secondary" className="text-[10px] font-semibold">{recentAccounts?.length || 0} {t('dashboard.total')}</Badge>
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
                  <div key={account.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors" data-testid={`row-account-${account.id}`}>
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
              <Badge variant="secondary" className="text-[10px] font-semibold">{auditLogs?.length || 0} {t('dashboard.entries')}</Badge>
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
                  <div key={log.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors" data-testid={`row-audit-${log.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{log.details || log.action}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.entity} &middot; {log.action}
                        {log.ipAddress && <span> &middot; {log.ipAddress}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </p>
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
    </div>
  );
}
