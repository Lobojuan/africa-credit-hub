import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Download, Users, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import type { CreditAccount } from "@shared/schema";

export default function ReportsPage() {
  const { t } = useTranslation();

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

  const lenderBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number; delinquent: number; currencies: Record<string, number> }>>((acc, a) => {
    if (!acc[a.lenderInstitution]) acc[a.lenderInstitution] = { count: 0, total: 0, delinquent: 0, currencies: {} };
    acc[a.lenderInstitution].count++;
    const balance = parseFloat(a.currentBalance || "0");
    acc[a.lenderInstitution].total += balance;
    const cur = a.currency || "ETB";
    acc[a.lenderInstitution].currencies[cur] = (acc[a.lenderInstitution].currencies[cur] || 0) + balance;
    if (a.status === "delinquent" || a.status === "default") acc[a.lenderInstitution].delinquent++;
    return acc;
  }, {}) : {};

  const typeBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number; currencies: Record<string, number> }>>((acc, a) => {
    if (!acc[a.accountType]) acc[a.accountType] = { count: 0, total: 0, currencies: {} };
    acc[a.accountType].count++;
    const balance = parseFloat(a.currentBalance || "0");
    acc[a.accountType].total += balance;
    const cur = a.currency || "ETB";
    acc[a.accountType].currencies[cur] = (acc[a.accountType].currencies[cur] || 0) + balance;
    return acc;
  }, {}) : {};

  const renderCurrencyBreakdown = (currencies: Record<string, number>) => {
    const entries = Object.entries(currencies).sort((a, b) => b[1] - a[1]);
    if (entries.length === 1) {
      return <p className="text-sm font-medium">{formatCurrency(entries[0][1], entries[0][0], { compact: true })}</p>;
    }
    return (
      <div className="text-right">
        {entries.map(([cur, val]) => (
          <p key={cur} className="text-sm font-medium">{formatCurrency(val, cur, { compact: true })}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-reports-title">{t('reports.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-portfolio" onClick={() => window.open("/api/reports/export?format=csv&type=portfolio", "_blank")}>
            <Download className="w-4 h-4 mr-2" />{t('reports.exportPortfolio')}
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export-borrowers" onClick={() => window.open("/api/reports/export?format=csv&type=borrowers", "_blank")}>
            <Download className="w-4 h-4 mr-2" />{t('reports.exportBorrowers')}
          </Button>
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
                    <p className="text-xs text-muted-foreground">{t('reports.registeredBorrowers')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('reports.totalExposure')}</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totalOutstanding, "ETB", { compact: true })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reports.nonPerforming')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('reports.nplRatio')}</p>
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
            <h3 className="text-sm font-semibold">{t('reports.portfolioByInstitution')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.exposureByLender')}</p>
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
                      <p className="text-xs text-muted-foreground">{data.count} {t('reports.accountsCount')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {renderCurrencyBreakdown(data.currencies)}
                        {data.delinquent > 0 && (
                          <p className="text-[10px] text-destructive">{data.delinquent} {t('reports.nonPerformingCount')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t('reports.noData')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{t('reports.portfolioByLoanType')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.exposureByProduct')}</p>
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
                      <p className="text-xs text-muted-foreground">{data.count} {t('reports.accountsCount')}</p>
                    </div>
                    <div className="shrink-0">
                      {renderCurrencyBreakdown(data.currencies)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t('reports.noData')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
