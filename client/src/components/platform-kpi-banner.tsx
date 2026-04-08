import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Building2, Shield,
  Target, BarChart3, AlertTriangle, CheckCircle, Globe, Percent,
  Banknote, Activity, FileText, ArrowDownRight, ShieldCheck, CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { detectLocalCurrency, getCurrencySymbol } from "@/lib/currency";

function useCurrencySymbol(): string {
  const code = detectLocalCurrency();
  return getCurrencySymbol(code);
}

interface PlatformKPIs {
  portfolio: {
    totalValue: number;
    totalOriginal: number;
    totalAccounts: number;
    currentAccounts: number;
    delinquentAccounts: number;
    defaultedAccounts: number;
    closedAccounts: number;
    nplRatio: number;
    delinquencyRate: number;
    defaultRate: number;
    collectionRate: number;
    avgInterestRate: number;
    avgLoanSize: number;
    accountTypes: Record<string, number>;
  };
  borrowers: {
    total: number;
    individuals: number;
    corporates: number;
    avgAccountsPerBorrower: number;
    avgCreditScore: number;
    medianCreditScore: number;
    countriesServed: number;
  };
  operations: {
    institutionsServed: number;
    reportsGenerated: number;
    pendingApprovals: number;
    openDisputes: number;
    disputeResolutionRate: number;
    approvalTurnaroundDays: number;
    dataAccuracyPercent: number;
    slaCompliancePercent: number;
  };
  roi: {
    traditionalNPLPercent: number;
    platformNPLPercent: number;
    nplReductionPercent: number;
    portfolioSavingsUsd: number;
    costPerReport: number;
    revenuePerReport: number;
    reportingRevenueUsd: number;
    reportingCostUsd: number;
    reportingMarginPercent: number;
    annualizedROI: number;
  };
}

function KpiTile({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string; icon: any; color?: string; trend?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40" data-testid={`kpi-tile-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`p-1.5 rounded-md shrink-0 ${color || "bg-primary/10"}`}>
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-base font-bold leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        {trend && <Badge variant="outline" className="text-[9px] mt-1 bg-green-500/10 text-green-600 border-green-500/20">{trend}</Badge>}
      </div>
    </div>
  );
}

export function usePlatformKPIs() {
  return useQuery<PlatformKPIs>({
    queryKey: ["/api/platform-kpis"],
    staleTime: 60000,
  });
}

export function DashboardKPISection() {
  const { data: kpis, isLoading } = usePlatformKPIs();
  const cs = useCurrencySymbol();

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
  );
  if (!kpis) return null;

  return (
    <div className="space-y-4" data-testid="section-platform-kpis">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile label="Portfolio Value" value={`${cs}${(kpis.portfolio.totalValue / 1000000).toFixed(1)}M`} icon={Banknote} sub={`${kpis.portfolio.totalAccounts.toLocaleString()} accounts`} />
        <KpiTile label="NPL Ratio" value={`${kpis.portfolio.nplRatio}%`} icon={Shield} sub={`Industry avg: ${kpis.roi.traditionalNPLPercent}%`} color="bg-green-500/10" trend={kpis.roi.nplReductionPercent > 0 ? `${kpis.roi.nplReductionPercent}% below avg` : undefined} />
        <KpiTile label="Countries" value={kpis.borrowers.countriesServed} icon={Globe} sub={`${kpis.operations.institutionsServed} institutions`} />
        <KpiTile label="Avg Credit Score" value={kpis.borrowers.avgCreditScore} icon={Target} sub={`Median: ${kpis.borrowers.medianCreditScore}`} />
        <KpiTile label="Data Accuracy" value={`${kpis.operations.dataAccuracyPercent}%`} icon={CheckCircle} sub={`SLA: ${kpis.operations.slaCompliancePercent}%`} color="bg-blue-500/10" />
        <KpiTile label="Default Savings" value={`${cs}${(kpis.roi.portfolioSavingsUsd / 1000).toFixed(0)}K`} icon={ShieldCheck} sub={`ROI: ${kpis.roi.annualizedROI}%`} color="bg-green-500/10" trend={`${cs}${kpis.roi.revenuePerReport}/report revenue`} />
      </div>
    </div>
  );
}

export function ConsumerKPIBanner({ filteredCount, recentDays }: { filteredCount?: number; recentDays?: number }) {
  const { data: kpis, isLoading } = usePlatformKPIs();

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (!kpis) return null;

  const scoreBand = kpis.borrowers.avgCreditScore >= 700 ? "Good" : kpis.borrowers.avgCreditScore >= 580 ? "Fair" : "Below Avg";
  const displayCount = (recentDays && recentDays > 0 && filteredCount !== undefined) ? filteredCount : kpis.borrowers.individuals;
  const sub = (recentDays && recentDays > 0) ? `of ${kpis.borrowers.individuals.toLocaleString()} total` : `of ${kpis.borrowers.total.toLocaleString()} total borrowers`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="consumer-kpi-banner">
      <KpiTile label="Individual Borrowers" value={displayCount.toLocaleString()} icon={Users} sub={sub} />
      <KpiTile label="Platform Avg Score" value={kpis.borrowers.avgCreditScore} icon={Target} sub={`Band: ${scoreBand}`} color={kpis.borrowers.avgCreditScore >= 700 ? "bg-green-500/10" : "bg-yellow-500/10"} />
      <KpiTile label="Platform Delinquency" value={`${kpis.portfolio.delinquencyRate}%`} icon={AlertTriangle} sub={`${kpis.portfolio.delinquentAccounts} accounts across portfolio`} color={kpis.portfolio.delinquencyRate > 10 ? "bg-red-500/10" : "bg-green-500/10"} />
      <KpiTile label="Portfolio Quality" value={`${(100 - kpis.portfolio.nplRatio).toFixed(1)}%`} icon={ShieldCheck} sub={`NPL: ${kpis.portfolio.nplRatio}%`} color="bg-green-500/10" trend={kpis.roi.nplReductionPercent > 0 ? `${kpis.roi.nplReductionPercent}% below industry` : undefined} />
    </div>
  );
}

export function BusinessKPIBanner({ filteredCount, recentDays }: { filteredCount?: number; recentDays?: number }) {
  const { data: kpis, isLoading } = usePlatformKPIs();
  const cs = useCurrencySymbol();

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (!kpis) return null;

  const displayCount = (recentDays && recentDays > 0 && filteredCount !== undefined) ? filteredCount : kpis.borrowers.corporates;
  const sub = (recentDays && recentDays > 0) ? `of ${kpis.borrowers.corporates.toLocaleString()} total` : `across ${kpis.borrowers.countriesServed} countries`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="business-kpi-banner">
      <KpiTile label="Corporate Borrowers" value={displayCount.toLocaleString()} icon={Building2} sub={sub} />
      <KpiTile label="Platform Avg Facility" value={`${cs}${(kpis.portfolio.avgLoanSize / 1000).toFixed(0)}K`} icon={Banknote} sub={`${kpis.portfolio.avgInterestRate.toFixed(1)}% avg rate`} />
      <KpiTile label="Platform Default Rate" value={`${kpis.portfolio.defaultRate}%`} icon={Shield} sub={`${kpis.portfolio.defaultedAccounts} defaulted across portfolio`} color={kpis.portfolio.defaultRate > 5 ? "bg-red-500/10" : "bg-green-500/10"} />
      <KpiTile label="Collection Rate" value={`${kpis.portfolio.collectionRate.toFixed(1)}%`} icon={DollarSign} sub="Platform repayment efficiency" color="bg-blue-500/10" />
    </div>
  );
}

export function CreditAccountKPIBanner({ filteredCount, recentDays }: { filteredCount?: number; recentDays?: number }) {
  const { data: kpis, isLoading } = usePlatformKPIs();
  const cs = useCurrencySymbol();

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-5 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (!kpis) return null;

  const displayCount = (recentDays && recentDays > 0 && filteredCount !== undefined) ? filteredCount : kpis.portfolio.totalAccounts;
  const portfolioSub = (recentDays && recentDays > 0) ? `${displayCount.toLocaleString()} accounts (of ${kpis.portfolio.totalAccounts.toLocaleString()} total)` : `${kpis.portfolio.totalAccounts.toLocaleString()} accounts`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="credit-account-kpi-banner">
      <KpiTile label="Total Portfolio" value={`${cs}${(kpis.portfolio.totalValue / 1000000).toFixed(1)}M`} icon={Banknote} sub={portfolioSub} />
      <KpiTile label="Current" value={kpis.portfolio.currentAccounts.toLocaleString()} icon={CheckCircle} sub={`${(kpis.portfolio.currentAccounts / Math.max(kpis.portfolio.totalAccounts, 1) * 100).toFixed(1)}% of total`} color="bg-green-500/10" />
      <KpiTile label="NPL Ratio" value={`${kpis.portfolio.nplRatio}%`} icon={Shield} sub={`Industry: ${kpis.roi.traditionalNPLPercent}%`} color={kpis.portfolio.nplRatio < kpis.roi.traditionalNPLPercent ? "bg-green-500/10" : "bg-red-500/10"} trend={kpis.roi.nplReductionPercent > 0 ? `${kpis.roi.nplReductionPercent}% better` : undefined} />
      <KpiTile label="Avg Interest Rate" value={`${kpis.portfolio.avgInterestRate.toFixed(1)}%`} icon={Percent} sub={`Avg size: ${cs}${(kpis.portfolio.avgLoanSize / 1000).toFixed(0)}K`} />
      <KpiTile label="Collection Rate" value={`${kpis.portfolio.collectionRate.toFixed(1)}%`} icon={DollarSign} sub="Repayment performance" color="bg-blue-500/10" />
    </div>
  );
}

export function ReportsKPIBanner() {
  const { data: kpis, isLoading } = usePlatformKPIs();
  const cs = useCurrencySymbol();

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="reports-kpi-banner">
      <KpiTile label="Reports Generated" value={kpis.operations.reportsGenerated.toLocaleString()} icon={FileText} sub={`${cs}${kpis.roi.costPerReport}/report cost`} />
      <KpiTile label="Revenue per Report" value={`${cs}${kpis.roi.revenuePerReport.toFixed(2)}`} icon={DollarSign} sub={`Margin: ${kpis.roi.reportingMarginPercent}%`} color="bg-green-500/10" />
      <KpiTile label="Reporting Revenue" value={`${cs}${kpis.roi.reportingRevenueUsd.toLocaleString()}`} icon={TrendingUp} sub={`Cost: ${cs}${kpis.roi.reportingCostUsd.toLocaleString()}`} trend={`${kpis.roi.reportingMarginPercent}% gross margin`} />
      <KpiTile label="Platform ROI" value={`${kpis.roi.annualizedROI}%`} icon={ShieldCheck} sub={`${cs}${(kpis.roi.portfolioSavingsUsd / 1000).toFixed(0)}K default savings`} color="bg-green-500/10" />
    </div>
  );
}

export function FullROICard() {
  const { data: kpis, isLoading } = usePlatformKPIs();
  const cs = useCurrencySymbol();

  if (isLoading || !kpis) return null;

  return (
    <Card data-testid="card-full-roi">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Platform ROI & Value Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">NPL Impact</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500 line-through">{kpis.roi.traditionalNPLPercent}%</span>
              <ArrowDownRight className="w-3 h-3 text-green-500" />
              <span className="text-sm font-bold text-green-600">{kpis.roi.platformNPLPercent}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{kpis.roi.nplReductionPercent}% reduction</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Default Savings</p>
            <p className="text-lg font-bold text-green-600">{cs}{kpis.roi.portfolioSavingsUsd.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Prevented losses</p>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold">{cs}{kpis.roi.costPerReport}</p>
            <p className="text-[10px] text-muted-foreground">Cost/Report</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{cs}{kpis.roi.revenuePerReport}</p>
            <p className="text-[10px] text-muted-foreground">Revenue/Report</p>
          </div>
          <div>
            <p className="text-lg font-bold">{kpis.roi.reportingMarginPercent}%</p>
            <p className="text-[10px] text-muted-foreground">Gross Margin</p>
          </div>
        </div>
        <Separator />
        <div className="text-center py-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Annualized ROI</p>
          <p className="text-3xl font-extrabold text-green-600" data-testid="text-platform-roi">{kpis.roi.annualizedROI}%</p>
          <p className="text-xs text-muted-foreground mt-1">Including portfolio savings + reporting revenue</p>
        </div>
      </CardContent>
    </Card>
  );
}
