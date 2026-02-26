import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Users, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreditAccount } from "@shared/schema";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1_000_000) return `ETB ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `ETB ${(num / 1_000).toFixed(0)}K`;
  return `ETB ${num.toFixed(0)}`;
}

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    delinquentAccounts: number;
    defaultAccounts: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: accounts, isLoading: accountsLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const lenderBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number; delinquent: number }>>((acc, a) => {
    if (!acc[a.lenderInstitution]) acc[a.lenderInstitution] = { count: 0, total: 0, delinquent: 0 };
    acc[a.lenderInstitution].count++;
    acc[a.lenderInstitution].total += parseFloat(a.currentBalance || "0");
    if (a.status === "delinquent" || a.status === "default") acc[a.lenderInstitution].delinquent++;
    return acc;
  }, {}) : {};

  const typeBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number }>>((acc, a) => {
    if (!acc[a.accountType]) acc[a.accountType] = { count: 0, total: 0 };
    acc[a.accountType].count++;
    acc[a.accountType].total += parseFloat(a.currentBalance || "0");
    return acc;
  }, {}) : {};

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reports-title">Credit Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Portfolio analysis and statistical reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Registered Borrowers</p>
                    <p className="text-xl font-bold">{stats.totalBorrowers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Exposure</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Non-performing</p>
                    <p className="text-xl font-bold">{stats.delinquentAccounts + stats.defaultAccounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">NPL Ratio</p>
                    <p className="text-xl font-bold">
                      {stats.totalAccounts > 0
                        ? (((stats.delinquentAccounts + stats.defaultAccounts) / stats.totalAccounts) * 100).toFixed(1)
                        : "0"}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Portfolio by Institution</h3>
            <p className="text-xs text-muted-foreground">Exposure breakdown by lender</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : Object.keys(lenderBreakdown).length > 0 ? (
              <div className="divide-y">
                {Object.entries(lenderBreakdown).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{data.count} accounts</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(data.total)}</p>
                        {data.delinquent > 0 && (
                          <p className="text-[10px] text-destructive">{data.delinquent} non-performing</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Portfolio by Loan Type</h3>
            <p className="text-xs text-muted-foreground">Exposure breakdown by product</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : Object.keys(typeBreakdown).length > 0 ? (
              <div className="divide-y">
                {Object.entries(typeBreakdown).sort((a, b) => b[1].total - a[1].total).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{type}</p>
                      <p className="text-xs text-muted-foreground">{data.count} accounts</p>
                    </div>
                    <p className="text-sm font-medium shrink-0">{formatCurrency(data.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
