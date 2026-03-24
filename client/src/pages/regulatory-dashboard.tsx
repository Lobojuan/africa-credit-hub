import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Users,
  CreditCard,
  BarChart3,
  Database,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardData {
  summary: {
    totalBorrowers: number;
    totalAccounts: number;
    totalInstitutions: number;
    totalExposure: string;
    nplCount: number;
    nplRatio: string;
    nplExposure: string;
    statusBreakdown: {
      current: number;
      delinquent: number;
      default: number;
      closed: number;
      restructured: number;
      writtenOff: number;
    };
  };
  dataQuality: {
    nationalIdCoverage: string;
    phoneCoverage: string;
    emailCoverage: string;
    overallScore: string;
  };
  sectorNpl: Array<{
    sector: string;
    totalAccounts: number;
    nplAccounts: number;
    nplRatio: string;
    totalExposure: string;
    nplExposure: string;
  }>;
  institutionCompliance: Array<{
    name: string;
    totalAccounts: number;
    nplAccounts: number;
    nplRatio: string;
    totalExposure: string;
    lastSubmission: string | null;
    dataQualityScore: string;
  }>;
}

const PIE_COLORS = [
  "hsl(152 60% 42%)",
  "hsl(42 85% 55%)",
  "hsl(12 76% 52%)",
  "hsl(215 65% 50%)",
  "hsl(280 55% 52%)",
  "hsl(172 62% 30%)",
];

function formatCurrency(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

function getNplColor(ratio: string): string {
  const r = parseFloat(ratio);
  if (r <= 5) return "text-emerald-600 dark:text-emerald-400";
  if (r <= 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getNplBadgeVariant(ratio: string): "default" | "secondary" | "destructive" | "outline" {
  const r = parseFloat(ratio);
  if (r <= 5) return "secondary";
  if (r <= 10) return "outline";
  return "destructive";
}

function getComplianceStatus(lastSubmission: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!lastSubmission) return { label: "No Data", variant: "outline" };
  const daysSince = (Date.now() - new Date(lastSubmission).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) return { label: "On Time", variant: "secondary" };
  if (daysSince <= 60) return { label: "Overdue", variant: "outline" };
  return { label: "Critical", variant: "destructive" };
}

function getDataQualityBadge(score: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const s = parseFloat(score);
  if (s >= 80) return { label: "Good", variant: "secondary" };
  if (s >= 50) return { label: "Fair", variant: "outline" };
  return { label: "Poor", variant: "destructive" };
}

function QualityBar({ label, value, testId }: { label: string; value: string; testId: string }) {
  const pct = parseFloat(value);
  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, subtitle, testId, colorIndex = 0 }: {
  icon: typeof Building2;
  title: string;
  value: string | number;
  subtitle?: string;
  testId: string;
  colorIndex?: number;
}) {
  const bgColors = [
    "from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/5",
    "from-amber-500/10 to-amber-500/5 dark:from-amber-500/15 dark:to-amber-500/5",
    "from-red-500/10 to-red-500/5 dark:from-red-500/15 dark:to-red-500/5",
    "from-blue-500/10 to-blue-500/5 dark:from-blue-500/15 dark:to-blue-500/5",
    "from-purple-500/10 to-purple-500/5 dark:from-purple-500/15 dark:to-purple-500/5",
    "from-teal-500/10 to-teal-500/5 dark:from-teal-500/15 dark:to-teal-500/5",
  ];
  const iconColors = [
    "text-emerald-600 dark:text-emerald-400",
    "text-amber-600 dark:text-amber-400",
    "text-red-600 dark:text-red-400",
    "text-blue-600 dark:text-blue-400",
    "text-purple-600 dark:text-purple-400",
    "text-teal-600 dark:text-teal-400",
  ];

  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className={`flex items-center gap-3 rounded-md p-3 bg-gradient-to-br ${bgColors[colorIndex % bgColors.length]}`}>
          <Icon className={`w-5 h-5 shrink-0 ${iconColors[colorIndex % iconColors.length]}`} />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegulatoryDashboardPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/regulatory/dashboard"],
  });

  if (isLoading || !data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { summary, dataQuality, sectorNpl, institutionCompliance } = data;

  const statusPieData = [
    { name: "Current", value: summary.statusBreakdown.current },
    { name: "Delinquent", value: summary.statusBreakdown.delinquent },
    { name: "Default", value: summary.statusBreakdown.default },
    { name: "Closed", value: summary.statusBreakdown.closed },
    { name: "Restructured", value: summary.statusBreakdown.restructured },
    { name: "Written Off", value: summary.statusBreakdown.writtenOff },
  ].filter(d => d.value > 0);

  const sectorChartData = sectorNpl.slice(0, 10).map(s => ({
    name: s.sector.length > 15 ? s.sector.slice(0, 13) + ".." : s.sector,
    nplRatio: parseFloat(s.nplRatio),
    fullName: s.sector,
  }));

  const dqBadge = getDataQualityBadge(dataQuality.overallScore);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reg-dashboard-title">
          {t("regulatoryDashboard.title", "Regulatory Dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-reg-dashboard-subtitle">
          {t("regulatoryDashboard.subtitle", "Central bank oversight and compliance monitoring")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard icon={Users} title={t("regulatoryDashboard.totalBorrowers", "Total Borrowers")} value={summary.totalBorrowers.toLocaleString()} testId="stat-total-borrowers" colorIndex={0} />
        <SummaryCard icon={CreditCard} title={t("regulatoryDashboard.totalAccounts", "Total Accounts")} value={summary.totalAccounts.toLocaleString()} testId="stat-total-accounts" colorIndex={3} />
        <SummaryCard icon={Building2} title={t("regulatoryDashboard.institutions", "Institutions")} value={summary.totalInstitutions} testId="stat-total-institutions" colorIndex={4} />
        <SummaryCard icon={TrendingUp} title={t("regulatoryDashboard.totalExposure", "Total Exposure")} value={formatCurrency(summary.totalExposure)} testId="stat-total-exposure" colorIndex={1} />
        <SummaryCard icon={AlertTriangle} title={t("regulatoryDashboard.nplRatio", "NPL Ratio")} value={`${summary.nplRatio}%`} subtitle={`${summary.nplCount} accounts`} testId="stat-npl-ratio" colorIndex={2} />
        <SummaryCard icon={Database} title={t("regulatoryDashboard.dataQuality", "Data Quality")} value={`${dataQuality.overallScore}%`} testId="stat-data-quality" colorIndex={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-semibold">{t("regulatoryDashboard.portfolioStatus", "Portfolio Status Breakdown")}</CardTitle>
          </CardHeader>
          <CardContent data-testid="chart-portfolio-status">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" nameKey="name">
                    {statusPieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-semibold">{t("regulatoryDashboard.dataQualityMetrics", "Data Quality Metrics")}</CardTitle>
            <Badge variant={dqBadge.variant} data-testid="badge-data-quality">{dqBadge.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-2" data-testid="panel-data-quality">
            <QualityBar label={t("regulatoryDashboard.nationalIdCoverage", "National ID Coverage")} value={dataQuality.nationalIdCoverage} testId="quality-national-id" />
            <QualityBar label={t("regulatoryDashboard.phoneCoverage", "Phone Number Coverage")} value={dataQuality.phoneCoverage} testId="quality-phone" />
            <QualityBar label={t("regulatoryDashboard.emailCoverage", "Email Coverage")} value={dataQuality.emailCoverage} testId="quality-email" />
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{t("regulatoryDashboard.overallScore", "Overall Data Quality Score")}</span>
                <span className="text-lg font-bold">{dataQuality.overallScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-semibold">
            <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("regulatoryDashboard.sectorNplHeatmap", "Sector NPL Heatmap")}
          </CardTitle>
        </CardHeader>
        <CardContent data-testid="chart-sector-npl">
          {sectorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "NPL Ratio"]}
                  labelFormatter={(label: string) => {
                    const item = sectorChartData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }}
                />
                <Bar dataKey="nplRatio" fill="hsl(12 76% 52%)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">No sector data</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("regulatoryDashboard.institutionCompliance", "Institution Compliance")}
          </CardTitle>
        </CardHeader>
        <CardContent data-testid="table-institution-compliance">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t("regulatoryDashboard.institution", "Institution")}</TableHead>
                  <TableHead className="text-xs text-right">{t("regulatoryDashboard.accounts", "Accounts")}</TableHead>
                  <TableHead className="text-xs text-right">{t("regulatoryDashboard.nplAccounts", "NPL")}</TableHead>
                  <TableHead className="text-xs text-right">{t("regulatoryDashboard.nplRatioCol", "NPL %")}</TableHead>
                  <TableHead className="text-xs text-right">{t("regulatoryDashboard.exposure", "Exposure")}</TableHead>
                  <TableHead className="text-xs">{t("regulatoryDashboard.lastSubmission", "Last Submission")}</TableHead>
                  <TableHead className="text-xs">{t("regulatoryDashboard.complianceStatus", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutionCompliance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      {t("regulatoryDashboard.noInstitutions", "No institution data")}
                    </TableCell>
                  </TableRow>
                ) : (
                  institutionCompliance.map((inst, idx) => {
                    const compliance = getComplianceStatus(inst.lastSubmission);
                    return (
                      <TableRow key={idx} data-testid={`row-institution-${idx}`}>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{inst.name}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{inst.totalAccounts.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{inst.nplAccounts}</TableCell>
                        <TableCell className={`text-xs text-right font-semibold tabular-nums ${getNplColor(inst.nplRatio)}`}>
                          {inst.nplRatio}%
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatCurrency(inst.totalExposure)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inst.lastSubmission ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(inst.lastSubmission).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={compliance.variant} data-testid={`badge-compliance-${idx}`}>
                            {compliance.variant === "secondary" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {compliance.variant === "destructive" && <XCircle className="w-3 h-3 mr-1" />}
                            {compliance.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("regulatoryDashboard.sectorDetails", "Sector NPL Details")}</CardTitle>
          </CardHeader>
          <CardContent data-testid="table-sector-npl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("regulatoryDashboard.sector", "Sector")}</TableHead>
                    <TableHead className="text-xs text-right">{t("regulatoryDashboard.total", "Total")}</TableHead>
                    <TableHead className="text-xs text-right">{t("regulatoryDashboard.npl", "NPL")}</TableHead>
                    <TableHead className="text-xs text-right">{t("regulatoryDashboard.ratio", "Ratio")}</TableHead>
                    <TableHead className="text-xs text-right">{t("regulatoryDashboard.nplExposure", "NPL Exposure")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectorNpl.map((s, idx) => (
                    <TableRow key={idx} data-testid={`row-sector-${idx}`}>
                      <TableCell className="text-xs font-medium">{s.sector}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{s.totalAccounts}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{s.nplAccounts}</TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge variant={getNplBadgeVariant(s.nplRatio)} className="text-[10px]">
                          {s.nplRatio}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatCurrency(s.nplExposure)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("regulatoryDashboard.nplExposureSummary", "NPL Exposure Summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2" data-testid="panel-npl-summary">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{t("regulatoryDashboard.totalExposure", "Total Exposure")}</p>
                <p className="text-xl font-bold" data-testid="text-total-exposure">{formatCurrency(summary.totalExposure)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{t("regulatoryDashboard.nplExposureLabel", "NPL Exposure")}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400" data-testid="text-npl-exposure">{formatCurrency(summary.nplExposure)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{t("regulatoryDashboard.nplRatio", "NPL Ratio")}</span>
                <span className={`text-sm font-bold ${getNplColor(summary.nplRatio)}`}>{summary.nplRatio}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-700"
                  style={{ width: `${Math.min(parseFloat(summary.nplRatio), 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400" data-testid="text-delinquent-count">{summary.statusBreakdown.delinquent}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t("regulatoryDashboard.delinquent", "Delinquent")}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-default-count">{summary.statusBreakdown.default}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t("regulatoryDashboard.defaulted", "Defaulted")}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-800 dark:text-red-200 dark:text-red-300" data-testid="text-written-off-count">{summary.statusBreakdown.writtenOff}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t("regulatoryDashboard.writtenOff", "Written Off")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
