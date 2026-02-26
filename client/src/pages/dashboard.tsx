import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, Search, AlertTriangle, DollarSign, ShieldAlert, CheckSquare, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import type { CreditAccount, AuditLog } from "@shared/schema";

function formatCurrency(value: string | number, currency = "ETB") {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const sym = currency === "USD" ? "USD" : "ETB";
  if (num >= 1_000_000) return `${sym} ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${sym} ${(num / 1_000).toFixed(0)}K`;
  return `${sym} ${num.toFixed(0)}`;
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

export default function Dashboard() {
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
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Credit Registry System Overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : stats ? (
          <>
            <StatCard title="Total Borrowers" value={stats.totalBorrowers} icon={Users} testId="stat-borrowers" />
            <StatCard title="Credit Accounts" value={stats.totalAccounts} icon={CreditCard} testId="stat-accounts" />
            <StatCard title="Outstanding" value={formatCurrency(stats.totalOutstanding)} icon={DollarSign} testId="stat-outstanding" />
            <StatCard title="Delinquent" value={stats.delinquentAccounts} icon={AlertTriangle} testId="stat-delinquent" subtitle="Accounts past due" />
            <StatCard title="Defaults" value={stats.defaultAccounts} icon={ShieldAlert} testId="stat-defaults" subtitle="Non-performing" />
            <StatCard title="Inquiries" value={stats.totalInquiries} icon={Search} testId="stat-inquiries" />
            <StatCard title="Pending Approvals" value={stats.pendingApprovalCount} icon={CheckSquare} testId="stat-approvals" subtitle="Awaiting review" />
            <StatCard title="Open Disputes" value={stats.openDisputeCount} icon={AlertCircle} testId="stat-disputes" subtitle="Active cases" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">Recent Credit Accounts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest loan activity across institutions</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{recentAccounts?.length || 0} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentAccounts && recentAccounts.length > 0 ? (
              <div className="divide-y">
                {recentAccounts.slice(0, 6).map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3 px-5 py-3" data-testid={`row-account-${account.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{account.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{account.lenderInstitution} &middot; {account.accountType}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(account.currentBalance, account.currency)}</p>
                      </div>
                      <Badge variant={getStatusColor(account.status)} className="text-[10px] capitalize">
                        {account.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No accounts found</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">Recent Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Audit trail of system operations</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{auditLogs?.length || 0} entries</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {logsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="divide-y">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 px-5 py-3" data-testid={`row-audit-${log.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{log.details || log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.entity} &middot; {log.action}
                        {log.ipAddress && <span> &middot; {log.ipAddress}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No activity recorded</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
