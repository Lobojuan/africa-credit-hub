import { useState, useEffect, useRef } from "react";
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
  Target,
  BarChart3,
  Building2,
  Loader2,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  Eye,
  ShieldAlert,
  Flame,
  CircleDot,
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
    low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 dark:text-emerald-400 border-emerald-500/30",
    moderate: "bg-blue-500/15 text-blue-700 dark:text-blue-300 dark:text-blue-400 border-blue-500/30",
    elevated: "bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:text-amber-400 border-amber-500/30",
    high: "bg-orange-500/15 text-orange-700 dark:text-orange-300 dark:text-orange-400 border-orange-500/30",
    critical: "bg-red-500/15 text-red-700 dark:text-red-300 dark:text-red-400 border-red-500/30",
  };
  return colors[rating] || colors.moderate;
}

function getRiskGlow(rating: RiskRating) {
  const glows: Record<RiskRating, string> = {
    low: "shadow-emerald-500/20",
    moderate: "shadow-blue-500/20",
    elevated: "shadow-amber-500/20",
    high: "shadow-orange-500/20",
    critical: "shadow-red-500/20",
  };
  return glows[rating] || glows.moderate;
}

function getSeverityColor(severity: Severity) {
  const colors: Record<Severity, string> = {
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:text-amber-400 border-amber-500/30",
    alert: "bg-orange-500/10 text-orange-700 dark:text-orange-300 dark:text-orange-400 border-orange-500/30",
    critical: "bg-red-500/10 text-red-700 dark:text-red-300 dark:text-red-400 border-red-500/30",
  };
  return colors[severity] || colors.warning;
}

function getSeverityIcon(severity: Severity) {
  if (severity === "critical") return <Flame className="w-4 h-4 text-red-500" />;
  if (severity === "alert") return <ShieldAlert className="w-4 h-4 text-orange-500" />;
  return <Eye className="w-4 h-4 text-amber-500" />;
}

function getTrendIcon(trend: Trend) {
  if (trend === "improving" || trend === "decreasing") return <TrendingDown className="w-5 h-5 text-emerald-500" />;
  if (trend === "deteriorating" || trend === "increasing") return <TrendingUp className="w-5 h-5 text-red-500" />;
  return <Activity className="w-5 h-5 text-muted-foreground" />;
}

function getTrendLabel(trend: Trend) {
  if (trend === "improving" || trend === "decreasing") return "text-emerald-600 dark:text-emerald-400";
  if (trend === "deteriorating" || trend === "increasing") return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function getQualityColor(quality: Quality) {
  const colors: Record<Quality, string> = {
    strong: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 dark:text-emerald-400 border-emerald-500/30",
    adequate: "bg-blue-500/15 text-blue-700 dark:text-blue-300 dark:text-blue-400 border-blue-500/30",
    weak: "bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:text-amber-400 border-amber-500/30",
    critical: "bg-red-500/15 text-red-700 dark:text-red-300 dark:text-red-400 border-red-500/30",
  };
  return colors[quality] || colors.adequate;
}

function getPriorityColor(priority: Priority) {
  const colors: Record<Priority, string> = {
    immediate: "bg-red-500/15 text-red-700 dark:text-red-300 dark:text-red-400 border-red-500/30",
    short_term: "bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:text-amber-400 border-amber-500/30",
    medium_term: "bg-blue-500/15 text-blue-700 dark:text-blue-300 dark:text-blue-400 border-blue-500/30",
  };
  return colors[priority] || colors.medium_term;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display}</>;
}

function HealthScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = animatedScore >= 75 ? "text-emerald-500" : animatedScore >= 50 ? "text-amber-500" : animatedScore >= 25 ? "text-orange-500" : "text-red-500";
  const glowColor = animatedScore >= 75 ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" : animatedScore >= 50 ? "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" : animatedScore >= 25 ? "drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]" : "drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]";
  const bgColor = animatedScore >= 75 ? "bg-emerald-500" : animatedScore >= 50 ? "bg-amber-500" : animatedScore >= 25 ? "bg-orange-500" : "bg-red-500";
  const label = animatedScore >= 75 ? "Healthy" : animatedScore >= 50 ? "Fair" : animatedScore >= 25 ? "At Risk" : "Critical";

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const dashArray = animatedScore * 2.64;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-40 h-40 ${glowColor} transition-all duration-1000`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className={`${color} transition-all ease-out`}
            strokeDasharray={`${dashArray} 264`} strokeLinecap="round"
            style={{ transitionDuration: "1500ms", filter: "drop-shadow(0 0 6px currentColor)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color} transition-colors duration-500`} data-testid="text-health-score">
            <AnimatedCounter value={score} />
          </span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${bgColor} animate-pulse-glow`} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, delay = 0 }: { label: string; value: string | number; icon: React.ReactNode; delay?: number }) {
  return (
    <div className="group relative p-4 rounded-xl bg-gradient-to-br from-background to-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = true, count, testId, accentColor }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; count?: number; testId?: string; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `${testId}-content`;
  return (
    <Card className="glass-card gradient-border overflow-hidden" data-testid={testId}>
      <CardHeader className="py-0 px-0">
        <button
          type="button"
          className="w-full py-4 px-5 flex items-center justify-between cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-xl"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          data-testid={`button-toggle-${testId}`}
        >
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className={`w-8 h-8 rounded-lg ${accentColor || "bg-primary/10"} flex items-center justify-center`}>
              {icon}
            </div>
            {title}
            {count !== undefined && (
              <Badge variant="secondary" className="ml-1 text-xs font-bold tabular-nums">{count}</Badge>
            )}
          </CardTitle>
          <div className={`w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      </CardHeader>
      <div id={contentId} role="region" className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <CardContent className="pt-0 px-5 pb-5">{children}</CardContent>
      </div>
    </Card>
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

export default function PortfolioIntelligencePage() {
  useTranslation();
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/portfolio-intelligence");
      return res.json();
    },
    onSuccess: (data) => {
      setReport(data);
      setError(null);
      setShowReport(false);
      setTimeout(() => setShowReport(true), 100);
    },
    onError: (e: Error) => { setError(e.message || "Failed to generate report. Please try again."); },
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-[0.07]">
          <Brain className="w-32 h-32 animate-float" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-page-title">
                  AI Portfolio Intelligence
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <PulsingDot color="bg-emerald-500" />
                  <span className="text-xs text-muted-foreground font-medium">Powered by GPT-4o</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm max-w-lg mt-2">
              Predictive analytics, early warnings, and actionable insights generated from your live portfolio data
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            size="lg"
            className="gap-2.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 text-base px-6"
            data-testid="button-generate-report"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {report ? "Refresh Analysis" : "Generate Report"}
              </>
            )}
          </Button>
        </div>
      </div>

      {!report && !generateMutation.isPending && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Target className="w-6 h-6 text-red-500" />, label: "Default Predictions", desc: "Identify clients likely to default", gradient: "from-red-500/10 to-red-500/5", border: "border-red-500/20" },
            { icon: <AlertTriangle className="w-6 h-6 text-amber-500" />, label: "Early Warnings", desc: "Catch problems before they grow", gradient: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/20" },
            { icon: <Phone className="w-6 h-6 text-primary" />, label: "Collection Priorities", desc: "Know who to call first", gradient: "from-primary/10 to-primary/5", border: "border-primary/20" },
            { icon: <BarChart3 className="w-6 h-6 text-emerald-500" />, label: "Sector Analysis", desc: "Performance by loan type", gradient: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20" },
          ].map((item, i) => (
            <Card key={i} className={`glass-card gradient-border bg-gradient-to-br ${item.gradient} ${item.border} hover:-translate-y-1 transition-all duration-300`}
              style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="flex flex-col items-center text-center py-8 px-4">
                <div className="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-3 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {generateMutation.isPending && (
        <Card className="glass-card overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Brain className="w-10 h-10 text-primary motion-safe:animate-pulse" />
              </div>
              <div className="absolute -inset-3 rounded-full border-2 border-primary/20 motion-safe:animate-ping" style={{ animationDuration: "2s" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2 relative">Analyzing Your Portfolio</h3>
            <p className="text-muted-foreground text-sm relative mb-6 text-center max-w-sm">
              AI is processing borrower profiles, credit histories, risk patterns, and generating predictions...
            </p>
            <div className="flex gap-1.5 relative">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary motion-safe:animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && !generateMutation.isPending && (
        <Card className="glass-card border-red-500/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">{error}</p>
            <Button onClick={() => { setError(null); generateMutation.mutate(); }} variant="outline" className="gap-2" data-testid="button-retry">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {report && !generateMutation.isPending && (
        <div className={`space-y-5 transition-all duration-700 ${showReport ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className={`glass-card lg:col-span-2 overflow-hidden border-l-4 ${
              report.overallRiskRating === "low" ? "border-l-emerald-500" :
              report.overallRiskRating === "moderate" ? "border-l-blue-500" :
              report.overallRiskRating === "elevated" ? "border-l-amber-500" :
              report.overallRiskRating === "high" ? "border-l-orange-500" : "border-l-red-500"
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <Shield className="w-5 h-5 text-primary" />
                  Executive Summary
                  <Badge className={`text-sm px-3 py-1 shadow-lg ${getRiskColor(report.overallRiskRating)} ${getRiskGlow(report.overallRiskRating)}`} data-testid="badge-risk-rating">
                    {report.overallRiskRating?.toUpperCase()} RISK
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed" data-testid="text-executive-summary">{report.executiveSummary}</p>
                {report.keyMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <MetricCard label="Total Exposure" value={report.keyMetrics.totalExposure}
                      icon={<CircleDot className="w-4 h-4 text-primary" />} delay={0} />
                    <MetricCard label="Delinquency Rate" value={report.keyMetrics.delinquencyRate}
                      icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} delay={100} />
                    <MetricCard label="Default Rate" value={report.keyMetrics.defaultRate}
                      icon={<ShieldAlert className="w-4 h-4 text-red-500" />} delay={200} />
                    <MetricCard label="Avg Days in Arrears" value={`${report.keyMetrics.avgArrearsDays}d`}
                      icon={<Clock className="w-4 h-4 text-orange-500" />} delay={300} />
                    <div className="sm:col-span-2">
                      <MetricCard label="Concentration Risk" value={report.keyMetrics.concentrationRisk}
                        icon={<Target className="w-4 h-4 text-primary" />} delay={400} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card premium-glow flex items-center justify-center">
              <CardContent className="py-8">
                <HealthScoreGauge score={report.portfolioHealthScore || 50} />
              </CardContent>
            </Card>
          </div>

          {report.trendForecast && (
            <Card className="glass-card gradient-border overflow-hidden relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  Portfolio Forecast
                  <Badge variant="secondary" className="text-xs">3-6 Months</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Delinquency Trend", value: report.trendForecast.delinquencyTrend, icon: getTrendIcon(report.trendForecast.delinquencyTrend) },
                    { label: "Default Trend", value: report.trendForecast.defaultTrend, icon: getTrendIcon(report.trendForecast.defaultTrend) },
                    { label: "Expected Losses", value: report.trendForecast.expectedLosses, icon: <Zap className="w-5 h-5 text-amber-500" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover:border-primary/20 transition-all duration-300">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className={`text-sm font-bold capitalize ${i < 2 ? getTrendLabel(item.value as Trend) : "text-amber-600 dark:text-amber-400"}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-sm leading-relaxed" data-testid="text-portfolio-outlook">
                    {report.trendForecast.portfolioOutlook}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {report.earlyWarnings && report.earlyWarnings.length > 0 && (
            <CollapsibleSection
              title="Early Warnings"
              icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
              count={report.earlyWarnings.length}
              testId="section-early-warnings"
              accentColor="bg-amber-500/10"
            >
              <div className="space-y-3">
                {report.earlyWarnings.map((w, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${getSeverityColor(w.severity)} transition-all duration-300 hover:shadow-md`} data-testid={`warning-${i}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        {getSeverityIcon(w.severity)}
                        <Badge className={getSeverityColor(w.severity)} variant="outline">{w.severity.toUpperCase()}</Badge>
                        <span className="font-semibold text-sm">{w.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                        <PulsingDot color={w.severity === "critical" ? "bg-red-500" : w.severity === "alert" ? "bg-orange-500" : "bg-amber-500"} />
                        {w.affectedBorrowers} borrowers
                      </div>
                    </div>
                    <p className="text-sm mb-3 leading-relaxed">{w.description}</p>
                    <div className="flex items-center justify-between text-xs gap-4">
                      <span className="font-medium">Potential Loss: <strong className="text-foreground">{w.potentialLoss}</strong></span>
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <ArrowRight className="w-3.5 h-3.5" />{w.recommendedAction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.defaultPredictions && report.defaultPredictions.length > 0 && (
            <CollapsibleSection
              title="Default Predictions"
              icon={<Target className="w-5 h-5 text-red-500" />}
              count={report.defaultPredictions.length}
              testId="section-default-predictions"
              accentColor="bg-red-500/10"
            >
              <div className="space-y-3">
                {report.defaultPredictions.map((p, i) => (
                  <div key={i} className="group p-5 rounded-xl border bg-gradient-to-br from-card to-muted/10 hover:shadow-lg hover:border-primary/20 transition-all duration-300" data-testid={`prediction-${i}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.riskLevel === "critical" ? "bg-red-500/10" : "bg-orange-500/10"}`}>
                          <Flame className={`w-4 h-4 ${p.riskLevel === "critical" ? "text-red-500" : "text-orange-500"}`} />
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{p.borrowerName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({p.borrowerType})</span>
                        </div>
                      </div>
                      <Badge className={`${p.riskLevel === "critical" ? "bg-red-500/15 text-red-700 dark:text-red-300 dark:text-red-400 border-red-500/30 shadow-red-500/20" : "bg-orange-500/15 text-orange-700 dark:text-orange-300 dark:text-orange-400 border-orange-500/30 shadow-orange-500/20"} shadow-lg`} variant="outline">
                        {p.probabilityOfDefault} PD
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-muted/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Exposure</p>
                        <p className="text-xs font-bold">{p.currentExposure}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Arrears</p>
                        <p className="text-xs font-bold">{p.daysInArrears}d</p>
                      </div>
                      {p.phone && p.phone !== "N/A" && (
                        <a href={`tel:${p.phone}`} className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors">
                          <Phone className="w-3.5 h-3.5" />{p.phone}
                        </a>
                      )}
                      {p.email && p.email !== "N/A" && (
                        <a href={`mailto:${p.email}`} className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors truncate">
                          <Mail className="w-3.5 h-3.5" /><span className="truncate">{p.email}</span>
                        </a>
                      )}
                    </div>
                    <p className="text-sm mb-2 leading-relaxed">{p.prediction}</p>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <ArrowRight className="w-3.5 h-3.5" />{p.recommendedAction}
                    </div>
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
              accentColor="bg-primary/10"
            >
              <div className="space-y-2.5">
                {report.collectionPriorities.map((c, i) => (
                  <div key={i} className="group flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-card to-muted/10 hover:shadow-md hover:border-primary/20 transition-all duration-300" data-testid={`collection-${i}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-sm ${
                      c.priority <= 3 ? "bg-gradient-to-br from-red-500 to-red-600 text-white" :
                      c.priority <= 6 ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white" :
                      "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    }`}>
                      #{c.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{c.borrowerName}</span>
                        <Badge variant="secondary" className={`text-xs shrink-0 ${c.daysOverdue > 180 ? "bg-red-500/10 text-red-700 dark:text-red-300 dark:text-red-400" : c.daysOverdue > 90 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:text-amber-400" : ""}`}>
                          {c.daysOverdue}d overdue
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold mb-1">{c.amountOverdue}</p>
                      <div className="flex items-center gap-2 justify-end">
                        {c.phone && c.phone !== "N/A" && (
                          <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors" data-testid={`link-call-${i}`} title={`Call ${c.phone}`}>
                            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </a>
                        )}
                        {c.email && c.email !== "N/A" && (
                          <a href={`mailto:${c.email}`} className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors" data-testid={`link-email-${i}`} title={`Email ${c.email}`}>
                            <Mail className="w-4 h-4 text-primary" />
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
              icon={<BarChart3 className="w-5 h-5 text-emerald-500" />}
              count={report.sectorAnalysis.length}
              defaultOpen={false}
              testId="section-sector-analysis"
              accentColor="bg-emerald-500/10"
            >
              <div className="space-y-2.5">
                {report.sectorAnalysis.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-gradient-to-r from-card to-muted/10 hover:border-primary/20 transition-all duration-300" data-testid={`sector-${i}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s.sector}</span>
                        <Badge variant="secondary" className="text-xs">{s.totalAccounts} accounts</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(s.trend)}
                        <span className={`text-xs font-medium capitalize ${getTrendLabel(s.trend)}`}>{s.trend}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded-lg bg-muted/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Exposure</p>
                        <p className="text-xs font-bold">{s.totalExposure}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Delinquency</p>
                        <p className="text-xs font-bold">{s.delinquencyRate}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Default</p>
                        <p className="text-xs font-bold">{s.defaultRate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.lenderAnalysis && report.lenderAnalysis.length > 0 && (
            <CollapsibleSection
              title="Lender Analysis"
              icon={<Building2 className="w-5 h-5 text-blue-500" />}
              count={report.lenderAnalysis.length}
              defaultOpen={false}
              testId="section-lender-analysis"
              accentColor="bg-blue-500/10"
            >
              <div className="space-y-2.5">
                {report.lenderAnalysis.map((l, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-card to-muted/10 hover:border-primary/20 transition-all duration-300" data-testid={`lender-${i}`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{l.lenderName}</span>
                        <Badge className={getQualityColor(l.portfolioQuality)} variant="outline">{l.portfolioQuality}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{l.totalAccounts} accounts</span>
                        <span>Delinquency: <strong className="text-foreground">{l.delinquencyRate}</strong></span>
                        <span>Default: <strong className="text-foreground">{l.defaultRate}</strong></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{l.totalExposure}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <CollapsibleSection
              title="Strategic Recommendations"
              icon={<Zap className="w-5 h-5 text-amber-500" />}
              count={report.recommendations.length}
              testId="section-recommendations"
              accentColor="bg-amber-500/10"
            >
              <div className="space-y-3">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="p-5 rounded-xl border bg-gradient-to-br from-card to-muted/10 hover:shadow-md hover:border-primary/20 transition-all duration-300" data-testid={`recommendation-${i}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getPriorityColor(r.priority)} shadow-sm`} variant="outline">
                        {r.priority.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{r.category.replace("_", " ")}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{r.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-300 dark:text-emerald-400 font-medium">{r.expectedImpact}</span>
                    </div>
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
