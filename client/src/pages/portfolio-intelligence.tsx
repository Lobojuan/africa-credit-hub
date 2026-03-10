import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Phone,
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Building2,
  Loader2,
  Activity,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";

type RiskRating = "low" | "moderate" | "elevated" | "high" | "critical";
type Severity = "warning" | "alert" | "critical";
type Trend = "improving" | "stable" | "deteriorating" | "increasing" | "decreasing";
type Priority = "immediate" | "short_term" | "medium_term";
type Quality = "strong" | "adequate" | "weak" | "critical";

interface PortfolioReport {
  overallRiskRating: RiskRating;
  portfolioHealthScore: number;
  executiveSummary: string;
  keyMetrics: {
    totalExposure: string;
    delinquencyRate: string;
    defaultRate: string;
    avgArrearsDays: number;
    concentrationRisk: string;
  };
  defaultPredictions: Array<{
    borrowerName: string;
    borrowerType: string;
    phone: string;
    email: string;
    currentExposure: string;
    riskLevel: string;
    daysInArrears: number;
    prediction: string;
    recommendedAction: string;
    probabilityOfDefault: string;
  }>;
  sectorAnalysis: Array<{
    sector: string;
    totalAccounts: number;
    totalExposure: string;
    delinquencyRate: string;
    defaultRate: string;
    trend: Trend;
    riskAssessment: string;
  }>;
  lenderAnalysis: Array<{
    lenderName: string;
    totalAccounts: number;
    totalExposure: string;
    delinquencyRate: string;
    defaultRate: string;
    portfolioQuality: Quality;
  }>;
  earlyWarnings: Array<{
    severity: Severity;
    title: string;
    description: string;
    affectedBorrowers: number;
    potentialLoss: string;
    recommendedAction: string;
  }>;
  collectionPriorities: Array<{
    priority: number;
    borrowerName: string;
    phone: string;
    email: string;
    amountOverdue: string;
    daysOverdue: number;
    reason: string;
  }>;
  trendForecast: {
    delinquencyTrend: Trend;
    defaultTrend: Trend;
    portfolioOutlook: string;
    expectedLosses: string;
  };
  recommendations: Array<{
    priority: Priority;
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}

function getRiskColor(rating: RiskRating) {
  const colors: Record<RiskRating, string> = {
    low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    moderate: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    elevated: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    high: "bg-orange-500/10 text-orange-700 border-orange-500/30",
    critical: "bg-red-500/10 text-red-700 border-red-500/30",
  };
  return colors[rating] || colors.moderate;
}

function getSeverityColor(severity: Severity) {
  const colors: Record<Severity, string> = {
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    alert: "bg-orange-500/10 text-orange-700 border-orange-500/30",
    critical: "bg-red-500/10 text-red-700 border-red-500/30",
  };
  return colors[severity] || colors.warning;
}

function getTrendIcon(trend: Trend) {
  if (trend === "improving" || trend === "decreasing") return <TrendingDown className="w-4 h-4 text-emerald-600" />;
  if (trend === "deteriorating" || trend === "increasing") return <TrendingUp className="w-4 h-4 text-red-600" />;
  return <Activity className="w-4 h-4 text-muted-foreground" />;
}

function getQualityColor(quality: Quality) {
  const colors: Record<Quality, string> = {
    strong: "bg-emerald-500/10 text-emerald-700",
    adequate: "bg-blue-500/10 text-blue-700",
    weak: "bg-amber-500/10 text-amber-700",
    critical: "bg-red-500/10 text-red-700",
  };
  return colors[quality] || colors.adequate;
}

function getPriorityColor(priority: Priority) {
  const colors: Record<Priority, string> = {
    immediate: "bg-red-500/10 text-red-700",
    short_term: "bg-amber-500/10 text-amber-700",
    medium_term: "bg-blue-500/10 text-blue-700",
  };
  return colors[priority] || colors.medium_term;
}

function HealthScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : score >= 25 ? "text-orange-500" : "text-red-500";
  const bgColor = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : score >= 25 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className={color}
            strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`} data-testid="text-health-score">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${bgColor}`} />
        <span className="text-sm font-medium">Portfolio Health</span>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = true, count, testId }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; count?: number; testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="glass-card" data-testid={testId}>
      <CardHeader className="cursor-pointer py-3 px-4" onClick={() => setOpen(!open)} data-testid={`button-toggle-${testId}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
            {count !== undefined && <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>}
          </CardTitle>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>}
    </Card>
  );
}

export default function PortfolioIntelligencePage() {
  const { t } = useTranslation();
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/portfolio-intelligence");
      return res.json();
    },
    onSuccess: (data) => { setReport(data); setError(null); },
    onError: (e: Error) => { setError(e.message || "Failed to generate report. Please try again."); },
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            AI Portfolio Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">Predictive analytics, early warnings, and actionable insights powered by AI</p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          size="lg"
          className="gap-2"
          data-testid="button-generate-report"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Portfolio...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {report ? "Refresh Analysis" : "Generate Intelligence Report"}
            </>
          )}
        </Button>
      </div>

      {!report && !generateMutation.isPending && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Intelligence Ready</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Click the button above to generate a comprehensive AI-powered analysis of your entire credit portfolio.
              The report includes default predictions, early warnings, collection priorities, and strategic recommendations.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                { icon: <Target className="w-5 h-5" />, label: "Default Predictions" },
                { icon: <AlertTriangle className="w-5 h-5" />, label: "Early Warnings" },
                { icon: <Phone className="w-5 h-5" />, label: "Collection Priorities" },
                { icon: <BarChart3 className="w-5 h-5" />, label: "Sector Analysis" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="text-primary">{item.icon}</div>
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {generateMutation.isPending && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Portfolio</h3>
            <p className="text-muted-foreground text-sm">
              AI is processing borrower data, account histories, and risk patterns...
            </p>
          </CardContent>
        </Card>
      )}

      {error && !generateMutation.isPending && (
        <Card className="glass-card border-red-500/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">{error}</p>
            <Button onClick={() => { setError(null); generateMutation.mutate(); }} variant="outline" className="gap-2" data-testid="button-retry">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {report && !generateMutation.isPending && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={`text-sm px-3 py-1 ${getRiskColor(report.overallRiskRating)}`} data-testid="badge-risk-rating">
                    {report.overallRiskRating?.toUpperCase()} RISK
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed" data-testid="text-executive-summary">{report.executiveSummary}</p>
                {report.keyMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Exposure</p>
                      <p className="text-sm font-semibold" data-testid="text-total-exposure">{report.keyMetrics.totalExposure}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Delinquency Rate</p>
                      <p className="text-sm font-semibold" data-testid="text-delinquency-rate">{report.keyMetrics.delinquencyRate}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Default Rate</p>
                      <p className="text-sm font-semibold" data-testid="text-default-rate">{report.keyMetrics.defaultRate}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Avg Days in Arrears</p>
                      <p className="text-sm font-semibold">{report.keyMetrics.avgArrearsDays}d</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Concentration Risk</p>
                      <p className="text-sm font-semibold">{report.keyMetrics.concentrationRisk}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card flex items-center justify-center">
              <CardContent className="py-6">
                <HealthScoreGauge score={report.portfolioHealthScore || 50} />
              </CardContent>
            </Card>
          </div>

          {report.trendForecast && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Portfolio Forecast (3-6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {getTrendIcon(report.trendForecast.delinquencyTrend)}
                    <div>
                      <p className="text-xs text-muted-foreground">Delinquency Trend</p>
                      <p className="text-sm font-semibold capitalize">{report.trendForecast.delinquencyTrend}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {getTrendIcon(report.trendForecast.defaultTrend)}
                    <div>
                      <p className="text-xs text-muted-foreground">Default Trend</p>
                      <p className="text-sm font-semibold capitalize">{report.trendForecast.defaultTrend}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Losses</p>
                      <p className="text-sm font-semibold">{report.trendForecast.expectedLosses}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-portfolio-outlook">
                  {report.trendForecast.portfolioOutlook}
                </p>
              </CardContent>
            </Card>
          )}

          {report.earlyWarnings && report.earlyWarnings.length > 0 && (
            <CollapsibleSection
              title="Early Warnings"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              count={report.earlyWarnings.length}
              testId="section-early-warnings"
            >
              <div className="space-y-3">
                {report.earlyWarnings.map((w, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(w.severity)}`} data-testid={`warning-${i}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(w.severity)} variant="outline">{w.severity.toUpperCase()}</Badge>
                        <span className="font-semibold text-sm">{w.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{w.affectedBorrowers} borrowers</span>
                    </div>
                    <p className="text-sm mb-2">{w.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Potential Loss: <strong>{w.potentialLoss}</strong></span>
                      <span className="text-muted-foreground flex items-center gap-1"><ArrowRight className="w-3 h-3" />{w.recommendedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.defaultPredictions && report.defaultPredictions.length > 0 && (
            <CollapsibleSection
              title="Default Predictions"
              icon={<Target className="w-5 h-5 text-red-600" />}
              count={report.defaultPredictions.length}
              testId="section-default-predictions"
            >
              <div className="space-y-3">
                {report.defaultPredictions.map((p, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card" data-testid={`prediction-${i}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-sm">{p.borrowerName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({p.borrowerType})</span>
                      </div>
                      <Badge className={p.riskLevel === "critical" ? "bg-red-500/10 text-red-700" : "bg-orange-500/10 text-orange-700"} variant="outline">
                        {p.probabilityOfDefault} PD
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                      <span>Exposure: <strong className="text-foreground">{p.currentExposure}</strong></span>
                      <span>Arrears: <strong className="text-foreground">{p.daysInArrears}d</strong></span>
                      {p.phone && p.phone !== "N/A" && (
                        <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="w-3 h-3" />{p.phone}
                        </a>
                      )}
                      {p.email && p.email !== "N/A" && (
                        <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Mail className="w-3 h-3" />{p.email}
                        </a>
                      )}
                    </div>
                    <p className="text-sm mb-1">{p.prediction}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />{p.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.collectionPriorities && report.collectionPriorities.length > 0 && (
            <CollapsibleSection
              title="Collection Priorities"
              icon={<Phone className="w-5 h-5 text-primary" />}
              count={report.collectionPriorities.length}
              testId="section-collection-priorities"
            >
              <div className="space-y-2">
                {report.collectionPriorities.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-card" data-testid={`collection-${i}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">#{c.priority}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{c.borrowerName}</span>
                        <Badge variant="secondary" className="text-xs">{c.daysOverdue}d overdue</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{c.amountOverdue}</p>
                      <div className="flex items-center gap-2 justify-end mt-0.5">
                        {c.phone && c.phone !== "N/A" && (
                          <a href={`tel:${c.phone}`} className="text-primary hover:underline" data-testid={`link-call-${i}`} title={`Call ${c.phone}`}>
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {c.email && c.email !== "N/A" && (
                          <a href={`mailto:${c.email}`} className="text-primary hover:underline" data-testid={`link-email-${i}`} title={`Email ${c.email}`}>
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.sectorAnalysis && report.sectorAnalysis.length > 0 && (
            <CollapsibleSection
              title="Sector Analysis"
              icon={<BarChart3 className="w-5 h-5 text-primary" />}
              count={report.sectorAnalysis.length}
              defaultOpen={false}
              testId="section-sector-analysis"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Sector</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Accounts</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Exposure</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Delinquency</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Default</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sectorAnalysis.map((s, i) => (
                      <tr key={i} className="border-b last:border-0" data-testid={`sector-${i}`}>
                        <td className="py-2.5 font-medium">{s.sector}</td>
                        <td className="py-2.5 text-right">{s.totalAccounts}</td>
                        <td className="py-2.5 text-right">{s.totalExposure}</td>
                        <td className="py-2.5 text-right">{s.delinquencyRate}</td>
                        <td className="py-2.5 text-right">{s.defaultRate}</td>
                        <td className="py-2.5 text-center">{getTrendIcon(s.trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          {report.lenderAnalysis && report.lenderAnalysis.length > 0 && (
            <CollapsibleSection
              title="Lender Analysis"
              icon={<Building2 className="w-5 h-5 text-primary" />}
              count={report.lenderAnalysis.length}
              defaultOpen={false}
              testId="section-lender-analysis"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Lender</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Accounts</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Exposure</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Delinquency</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Default</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.lenderAnalysis.map((l, i) => (
                      <tr key={i} className="border-b last:border-0" data-testid={`lender-${i}`}>
                        <td className="py-2.5 font-medium">{l.lenderName}</td>
                        <td className="py-2.5 text-right">{l.totalAccounts}</td>
                        <td className="py-2.5 text-right">{l.totalExposure}</td>
                        <td className="py-2.5 text-right">{l.delinquencyRate}</td>
                        <td className="py-2.5 text-right">{l.defaultRate}</td>
                        <td className="py-2.5 text-center">
                          <Badge className={getQualityColor(l.portfolioQuality)} variant="outline">{l.portfolioQuality}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <CollapsibleSection
              title="Strategic Recommendations"
              icon={<Zap className="w-5 h-5 text-amber-600" />}
              count={report.recommendations.length}
              testId="section-recommendations"
            >
              <div className="space-y-3">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card" data-testid={`recommendation-${i}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(r.priority)} variant="outline">{r.priority.replace("_", " ").toUpperCase()}</Badge>
                      <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                      <span className="font-semibold text-sm">{r.title}</span>
                    </div>
                    <p className="text-sm mb-1">{r.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expected Impact: {r.expectedImpact}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}
