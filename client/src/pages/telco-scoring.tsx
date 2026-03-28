import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Cell
} from "recharts";
import {
  Smartphone, Signal, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  XCircle, Plus, Loader2, ChevronRight, BarChart3, Wallet, Phone, Brain, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, Users, Activity, Zap, Globe, DollarSign,
  Target, PieChart, Award, MapPin, Clock, ShieldCheck, Percent, Banknote, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TelcoProfile, TelcoCreditScore } from "@shared/schema";

function getRiskColor(tier: string) {
  switch (tier) {
    case "very_low": return "text-green-600 dark:text-green-400";
    case "low": return "text-emerald-600 dark:text-emerald-400";
    case "medium": return "text-yellow-600 dark:text-yellow-400";
    case "high": return "text-orange-600 dark:text-orange-400";
    case "very_high": return "text-red-600 dark:text-red-400";
    default: return "text-muted-foreground";
  }
}

function getRiskBadgeVariant(tier: string): "default" | "secondary" | "destructive" | "outline" {
  switch (tier) {
    case "very_low": case "low": return "default";
    case "medium": return "secondary";
    case "high": case "very_high": return "destructive";
    default: return "outline";
  }
}

function getRiskLabel(tier: string) {
  return tier.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getRiskIcon(tier: string) {
  switch (tier) {
    case "very_low": case "low": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "medium": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "high": case "very_high": return <XCircle className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4" />;
  }
}

interface TelcoAnalytics {
  overview: {
    totalProfilesScored: number;
    totalApproved: number;
    totalDeclined: number;
    approvalRate: number;
    avgRiskScore: number;
    totalCreditExtended: number;
    avgCreditLimit: number;
  };
  financialInclusion: {
    previouslyUnbanked: number;
    firstTimeBorrowers: number;
    unbankedPercentage: number;
    countriesServed: number;
    womenBorrowers: number;
    ruralBorrowers: number;
  };
  performance: {
    avgScoringTimeSeconds: number;
    modelAccuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    giniCoefficient: number;
    ksStatistic: number;
  };
  roi: {
    costPerScore: number;
    revenuePerScore: number;
    grossMarginPercent: number;
    traditionalNPLPercent: number;
    aiDrivenNPLPercent: number;
    nplReductionPercent: number;
    projectedPortfolioUsd: number;
    defaultSavingsUsd: number;
    scoringRevenueUsd: number;
    annualizedROI: number;
  };
  countryBreakdown: Record<string, { profiles: number; scored: number; approved: number; avgLimit: number; totalVolume: number }>;
  tierBreakdown: Record<string, number>;
  kycBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string; value: string | number; subtitle?: string; icon: any; trend?: string; color?: string;
}) {
  return (
    <Card data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color || ""}`}>{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 shrink-0 ml-2">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        {trend && <Badge variant="outline" className="mt-2 text-[10px] bg-green-500/10 text-green-600 border-green-500/20">{trend}</Badge>}
      </CardContent>
    </Card>
  );
}

function AnalyticsDashboard({ analytics }: { analytics: TelcoAnalytics }) {
  const { overview, financialInclusion, performance, roi, countryBreakdown, tierBreakdown, kycBreakdown } = analytics;

  const countryFlags: Record<string, string> = {
    Ghana: "🇬🇭", Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿", Rwanda: "🇷🇼",
    "Sierra Leone": "🇸🇱", Nigeria: "🇳🇬", Ethiopia: "🇪🇹", Senegal: "🇸🇳",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Profiles Scored" value={overview.totalProfilesScored.toLocaleString()} icon={Users} subtitle="Total AI assessments" />
        <KpiCard title="Approved" value={overview.totalApproved.toLocaleString()} icon={CheckCircle} subtitle={`${overview.approvalRate.toFixed(1)}% approval rate`} color="text-green-600 dark:text-green-400" />
        <KpiCard title="Credit Extended" value={`$${overview.totalCreditExtended.toLocaleString()}`} icon={Banknote} subtitle={`Avg $${overview.avgCreditLimit.toLocaleString()}/borrower`} />
        <KpiCard title="Countries" value={financialInclusion.countriesServed} icon={Globe} subtitle="Markets active" />
        <KpiCard title="Model Accuracy" value={`${performance.modelAccuracy}%`} icon={Target} subtitle={`Gini: ${performance.giniCoefficient}`} color="text-blue-600 dark:text-blue-400" />
        <KpiCard title="NPL Reduction" value={`${roi.nplReductionPercent.toFixed(1)}%`} icon={ShieldCheck} subtitle={`${roi.traditionalNPLPercent}% → ${roi.aiDrivenNPLPercent}%`} color="text-green-600 dark:text-green-400" trend={`$${roi.defaultSavingsUsd.toLocaleString()} saved`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4" /> Financial Inclusion Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Previously Unbanked</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" data-testid="text-unbanked-count">{financialInclusion.previouslyUnbanked}</span>
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">{financialInclusion.unbankedPercentage}%</Badge>
              </div>
            </div>
            <Progress value={financialInclusion.unbankedPercentage} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">First-Time Borrowers</span>
              <span className="text-sm font-bold">{financialInclusion.firstTimeBorrowers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Women Borrowers</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{financialInclusion.womenBorrowers}</span>
                <Badge variant="outline" className="text-[10px]">{overview.totalApproved > 0 ? Math.round((financialInclusion.womenBorrowers / overview.totalApproved) * 100) : 0}%</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rural Borrowers</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{financialInclusion.ruralBorrowers}</span>
                <Badge variant="outline" className="text-[10px]">{overview.totalApproved > 0 ? Math.round((financialInclusion.ruralBorrowers / overview.totalApproved) * 100) : 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> ROI & Unit Economics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cost per Score</span>
              <span className="text-sm font-bold" data-testid="text-cost-per-score">${roi.costPerScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenue per Score</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">${roi.revenuePerScore.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Margin</span>
              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">{roi.grossMarginPercent}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scoring Revenue</span>
              <span className="text-sm font-bold">${roi.scoringRevenueUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Default Savings</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">${roi.defaultSavingsUsd.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Annualized ROI</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-annualized-roi">{roi.annualizedROI.toLocaleString()}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Model Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scoring Speed</span>
              <span className="text-sm font-bold">{performance.avgScoringTimeSeconds}s avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <span className="text-sm font-bold">{performance.modelAccuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">False Positive Rate</span>
              <span className="text-sm font-bold">{performance.falsePositiveRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">False Negative Rate</span>
              <span className="text-sm font-bold">{performance.falseNegativeRate}%</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gini Coefficient</span>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">{performance.giniCoefficient}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">KS Statistic</span>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">{performance.ksStatistic}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">NPL Traditional vs AI</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-500 line-through">{roi.traditionalNPLPercent}%</span>
                <ArrowDownRight className="w-3 h-3 text-green-500" />
                <span className="text-xs font-bold text-green-600">{roi.aiDrivenNPLPercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Live Applicant Scoring</CardTitle>
                <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full font-semibold">
                  <Activity size={12} /> Processing
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-5 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/40" data-testid="xai-risk-tier">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">AI Risk Tier</span>
                <span className="text-5xl font-black text-emerald-500">2</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">Low Risk Profile</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Info size={14} className="text-blue-500"/> Reason Codes (Explainability)
                </h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground"><span className="font-semibold text-foreground">Positive:</span> Consistent utility payments over 6 months indicate strong financial discipline.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground"><span className="font-semibold text-foreground">Positive:</span> High wallet retention rate; user does not immediately cash out inbound P2P transfers.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground"><span className="font-semibold text-foreground">Flag:</span> 2 instances of emergency airtime advances in the last 30 days.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground"><span className="font-semibold text-foreground">Positive:</span> Regular income pattern detected from employer P2P transfers.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground"><span className="font-semibold text-foreground">Risk:</span> Dormant period of 12 days detected in last 90-day window.</p>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Algorithmic Feature Attribution</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Weight of MoMo KPIs influencing the current AI credit model</p>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-feature-attribution">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      { feature: "Utility Payments", weight: 85 },
                      { feature: "Wallet Retention", weight: 72 },
                      { feature: "P2P Regularity", weight: 65 },
                      { feature: "Merchant Txns", weight: 58 },
                      { feature: "Income Pattern", weight: 50 },
                      { feature: "SIM Tenure", weight: 42 },
                      { feature: "KYC Level", weight: 35 },
                      { feature: "Airtime Advances", weight: -25 },
                      { feature: "Dormant Periods", weight: -45 },
                      { feature: "Device Changes", weight: -30 },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="feature" type="category" width={115} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                      {[85, 72, 65, 58, 50, 42, 35, -25, -45, -30].map((w, i) => (
                        <Cell key={`cell-${i}`} fill={w > 0 ? "#3b82f6" : "#ef4444"} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" /> MoMo Ecosystem Cash Flow Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-cashflow-trends">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: "Jan", inflows: 4000, outflows: 2400 },
                      { month: "Feb", inflows: 3000, outflows: 1398 },
                      { month: "Mar", inflows: 2000, outflows: 9800 },
                      { month: "Apr", inflows: 2780, outflows: 3908 },
                      { month: "May", inflows: 1890, outflows: 4800 },
                      { month: "Jun", inflows: 2390, outflows: 3800 },
                      { month: "Jul", inflows: 3200, outflows: 2900 },
                      { month: "Aug", inflows: 3800, outflows: 3100 },
                      { month: "Sep", inflows: 4200, outflows: 2800 },
                      { month: "Oct", inflows: 3600, outflows: 3400 },
                      { month: "Nov", inflows: 4500, outflows: 2600 },
                      { month: "Dec", inflows: 5100, outflows: 3200 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="inflows" name="Total Inflows" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="outflows" name="Total Outflows" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Country Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Country</TableHead>
                  <TableHead className="text-xs text-right">Scored</TableHead>
                  <TableHead className="text-xs text-right">Approved</TableHead>
                  <TableHead className="text-xs text-right">Rate</TableHead>
                  <TableHead className="text-xs text-right">Avg Limit</TableHead>
                  <TableHead className="text-xs text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(countryBreakdown).sort((a, b) => b[1].totalVolume - a[1].totalVolume).map(([country, data]) => (
                  <TableRow key={country} data-testid={`row-country-${country.toLowerCase().replace(/\s/g, "-")}`}>
                    <TableCell className="text-sm font-medium">
                      <span className="mr-1">{countryFlags[country] || "🌍"}</span> {country}
                    </TableCell>
                    <TableCell className="text-sm text-right">{data.scored}</TableCell>
                    <TableCell className="text-sm text-right">{data.approved}</TableCell>
                    <TableCell className="text-sm text-right">
                      <Badge variant="outline" className="text-[10px]">{data.scored > 0 ? Math.round((data.approved / data.scored) * 100) : 0}%</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right">${data.avgLimit.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right font-medium">${data.totalVolume.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Risk Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(tierBreakdown).filter(([, count]) => count > 0).map(([tier, count]) => {
                  const total = Object.values(tierBreakdown).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    very_low: "bg-green-500", low: "bg-emerald-500", medium: "bg-yellow-500",
                    high: "bg-orange-500", very_high: "bg-red-500",
                  };
                  return (
                    <div key={tier} className="flex items-center gap-3" data-testid={`tier-bar-${tier}`}>
                      <div className="w-24 text-xs font-medium">{getRiskLabel(tier)}</div>
                      <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[tier] || "bg-primary"} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-xs font-bold">{count}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> KYC Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(kycBreakdown).map(([level, count]) => {
                  const colors: Record<string, string> = {
                    none: "border-red-500/30 bg-red-500/5",
                    basic: "border-yellow-500/30 bg-yellow-500/5",
                    standard: "border-blue-500/30 bg-blue-500/5",
                    full: "border-green-500/30 bg-green-500/5",
                  };
                  return (
                    <div key={level} className={`text-center p-3 rounded-lg border ${colors[level] || ""}`} data-testid={`kyc-${level}`}>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{level}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface DecisionRule {
  id: string;
  name: string;
  maxAllowableRiskTier: number;
  minUtilityPayments: number;
  minWalletRetentionPct: number;
  minSimAgeDays: number;
  maxDormantDays: number;
  minKycLevel: string;
  maxCreditLimitUsd: string;
  autoDisburseApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DecisionLog {
  id: string;
  ruleId: string;
  profileId: string;
  status: string;
  riskScore: number;
  riskTier: string;
  creditLimitUsd: string;
  reasonCode: string;
  rejectionReasons: string | null;
  disbursementRef: string | null;
  smsNotificationSent: boolean;
  applicantMsisdn: string;
  country: string;
  decidedAt: string;
}

function DecisionEnginePanel({ profiles }: { profiles: TelcoProfile[] }) {
  const { toast } = useToast();
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<DecisionRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: "Default Policy",
    maxAllowableRiskTier: 3,
    minUtilityPayments: 2,
    minWalletRetentionPct: 20,
    minSimAgeDays: 90,
    maxDormantDays: 30,
    minKycLevel: "basic",
    maxCreditLimitUsd: "500",
    autoDisburseApproved: false,
    isActive: true,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery<DecisionRule[]>({
    queryKey: ["/api/telco/decision-rules"],
  });

  const { data: decisionLogs, isLoading: logsLoading } = useQuery<DecisionLog[]>({
    queryKey: ["/api/telco/decision-logs"],
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: typeof ruleForm) => {
      const res = await apiRequest("POST", "/api/telco/decision-rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/decision-rules"] });
      setShowCreateRule(false);
      toast({ title: "Decision rule created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof ruleForm> }) => {
      const res = await apiRequest("PUT", `/api/telco/decision-rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/decision-rules"] });
      setEditingRule(null);
      toast({ title: "Decision rule updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const runDecisionMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await apiRequest("POST", `/api/telco/decision-engine/${profileId}`, { periodDays: 90 });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/decision-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/analytics"] });
      const decision = data.decision;
      toast({
        title: decision.status === "rejected" ? "Application Rejected" : "Application Approved",
        description: decision.status === "approved_disbursed"
          ? `Funds disbursed to ${decision.applicantMsisdn} ($${Number(decision.creditLimitUsd).toLocaleString()})`
          : decision.status === "approved_pending"
          ? `Approved for $${Number(decision.creditLimitUsd).toLocaleString()} — pending disbursement`
          : `Reason: ${decision.reasonCode?.substring(0, 100)}`,
        variant: decision.status === "rejected" ? "destructive" : "default",
      });
    },
    onError: (e: Error) => toast({ title: "Decision engine error", description: e.message, variant: "destructive" }),
  });

  const activeRule = rules?.find(r => r.isActive);
  const approvedLogs = decisionLogs?.filter(l => l.status !== "rejected") || [];
  const rejectedLogs = decisionLogs?.filter(l => l.status === "rejected") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <KpiCard title="Active Rules" value={rules?.filter(r => r.isActive).length || 0} icon={ShieldCheck} subtitle="Decision policies" />
        <KpiCard title="Total Decisions" value={decisionLogs?.length || 0} icon={Activity} subtitle="Processed through engine" />
        <KpiCard title="Auto-Approved" value={approvedLogs.length} icon={CheckCircle} subtitle={`${decisionLogs?.length ? Math.round((approvedLogs.length / decisionLogs.length) * 100) : 0}% approval rate`} color="text-green-600 dark:text-green-400" />
        <KpiCard title="Rejected" value={rejectedLogs.length} icon={XCircle} subtitle="With regulatory reason codes" color="text-red-600 dark:text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Decision Rules
              </CardTitle>
              <Button size="sm" onClick={() => setShowCreateRule(true)} data-testid="button-create-rule">
                <Plus className="w-3 h-3 mr-1" /> New Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : rules && rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map(rule => (
                  <div key={rule.id} className={`p-4 rounded-lg border ${rule.isActive ? "border-blue-200 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/10" : "border-border bg-muted/20"}`} data-testid={`rule-card-${rule.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{rule.name}</span>
                        {rule.isActive && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingRule(rule);
                        setRuleForm({
                          name: rule.name,
                          maxAllowableRiskTier: rule.maxAllowableRiskTier,
                          minUtilityPayments: rule.minUtilityPayments,
                          minWalletRetentionPct: rule.minWalletRetentionPct,
                          minSimAgeDays: rule.minSimAgeDays,
                          maxDormantDays: rule.maxDormantDays,
                          minKycLevel: rule.minKycLevel,
                          maxCreditLimitUsd: rule.maxCreditLimitUsd,
                          autoDisburseApproved: rule.autoDisburseApproved,
                          isActive: rule.isActive,
                        });
                      }} data-testid={`button-edit-rule-${rule.id}`}>
                        Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Max Risk Tier</span>
                        <p className="font-bold">{rule.maxAllowableRiskTier}/5</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Utility Pmts</span>
                        <p className="font-bold">{rule.minUtilityPayments}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Wallet Ret.</span>
                        <p className="font-bold">{rule.minWalletRetentionPct}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Auto-Disburse</span>
                        <p className="font-bold">{rule.autoDisburseApproved ? "ON" : "OFF"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min SIM Age</span>
                        <p className="font-bold">{rule.minSimAgeDays}d</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Dormant</span>
                        <p className="font-bold">{rule.maxDormantDays}d</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min KYC</span>
                        <p className="font-bold capitalize">{rule.minKycLevel}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Credit</span>
                        <p className="font-bold">${Number(rule.maxCreditLimitUsd).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No decision rules configured</p>
                <p className="text-sm text-muted-foreground mt-1">Create a rule to enable automated decisioning</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Run Decision Engine
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Select a MoMo profile to evaluate against the active decision rule</p>
          </CardHeader>
          <CardContent>
            {!activeRule ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-60" />
                <p className="font-semibold text-sm">No active rule</p>
                <p className="text-xs text-muted-foreground mt-1">Create and activate a decision rule first</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {profiles.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`decision-profile-${profile.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Signal className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{profile.msisdn}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{profile.provider} · {profile.country}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runDecisionMutation.mutate(profile.id)}
                      disabled={runDecisionMutation.isPending}
                      data-testid={`button-run-decision-${profile.id}`}
                    >
                      {runDecisionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                      Evaluate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {decisionLogs && decisionLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Decision History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">MSISDN</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Risk</TableHead>
                  <TableHead className="text-xs text-right">Credit Limit</TableHead>
                  <TableHead className="text-xs">Reason / Ref</TableHead>
                  <TableHead className="text-xs text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisionLogs.slice(0, 50).map(log => (
                  <TableRow key={log.id} data-testid={`decision-log-${log.id}`}>
                    <TableCell className="text-xs font-medium">{log.applicantMsisdn}</TableCell>
                    <TableCell>
                      {log.status === "approved_disbursed" ? (
                        <Badge variant="default" className="text-[10px] bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Disbursed</Badge>
                      ) : log.status === "approved_pending" ? (
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold">{log.riskScore}/5</TableCell>
                    <TableCell className="text-xs text-right">${Number(log.creditLimitUsd).toLocaleString()}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {log.disbursementRef || log.reasonCode?.substring(0, 80)}
                    </TableCell>
                    <TableCell className="text-xs text-right">{log.decidedAt ? new Date(log.decidedAt).toLocaleDateString() : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateRule || !!editingRule} onOpenChange={(open) => { if (!open) { setShowCreateRule(false); setEditingRule(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Decision Rule" : "Create Decision Rule"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingRule) {
              updateRuleMutation.mutate({ id: editingRule.id, data: ruleForm });
            } else {
              createRuleMutation.mutate(ruleForm);
            }
          }} className="space-y-4" data-testid="form-decision-rule">
            <div>
              <Label>Rule Name</Label>
              <Input data-testid="input-rule-name" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Allowable Risk Tier (1-5)</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min={1} max={5} value={ruleForm.maxAllowableRiskTier} onChange={e => setRuleForm({ ...ruleForm, maxAllowableRiskTier: parseInt(e.target.value) })} className="flex-1 accent-blue-600" data-testid="slider-max-risk" />
                  <span className="text-lg font-bold w-8 text-center" data-testid="text-max-risk-value">{ruleForm.maxAllowableRiskTier}</span>
                </div>
              </div>
              <div>
                <Label>Min Utility Payments</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={20} value={ruleForm.minUtilityPayments} onChange={e => setRuleForm({ ...ruleForm, minUtilityPayments: parseInt(e.target.value) })} className="flex-1 accent-blue-600" data-testid="slider-min-utility" />
                  <span className="text-lg font-bold w-8 text-center">{ruleForm.minUtilityPayments}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Wallet Retention (%)</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={100} step={5} value={ruleForm.minWalletRetentionPct} onChange={e => setRuleForm({ ...ruleForm, minWalletRetentionPct: parseInt(e.target.value) })} className="flex-1 accent-blue-600" data-testid="slider-wallet-retention" />
                  <span className="text-lg font-bold w-10 text-center">{ruleForm.minWalletRetentionPct}%</span>
                </div>
              </div>
              <div>
                <Label>Min SIM Age (days)</Label>
                <Input data-testid="input-sim-age" type="number" value={ruleForm.minSimAgeDays} onChange={e => setRuleForm({ ...ruleForm, minSimAgeDays: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Dormant Days</Label>
                <Input data-testid="input-max-dormant" type="number" value={ruleForm.maxDormantDays} onChange={e => setRuleForm({ ...ruleForm, maxDormantDays: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Min KYC Level</Label>
                <Select value={ruleForm.minKycLevel} onValueChange={v => setRuleForm({ ...ruleForm, minKycLevel: v })}>
                  <SelectTrigger data-testid="select-min-kyc"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="full">Full KYC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Credit Limit (USD)</Label>
                <Input data-testid="input-max-credit" type="number" value={ruleForm.maxCreditLimitUsd} onChange={e => setRuleForm({ ...ruleForm, maxCreditLimitUsd: e.target.value })} />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                  <input
                    type="checkbox"
                    checked={ruleForm.autoDisburseApproved}
                    onChange={e => setRuleForm({ ...ruleForm, autoDisburseApproved: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                    data-testid="checkbox-auto-disburse"
                  />
                  <div>
                    <Label className="text-xs font-semibold">Auto-Disburse</Label>
                    <p className="text-[10px] text-muted-foreground">Instantly send funds on approval</p>
                  </div>
                </div>
              </div>
            </div>
            {editingRule && (
              <div className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                <input
                  type="checkbox"
                  checked={ruleForm.isActive}
                  onChange={e => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                  data-testid="checkbox-active"
                />
                <Label className="text-xs font-semibold">Active</Label>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={createRuleMutation.isPending || updateRuleMutation.isPending} data-testid="button-submit-rule">
              {(createRuleMutation.isPending || updateRuleMutation.isPending) ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TelcoScoringPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [scoreDetailId, setScoreDetailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  const [profileForm, setProfileForm] = useState({
    msisdn: "",
    provider: "mtn" as string,
    country: "Ghana",
    kycLevel: "basic" as string,
    deviceType: "",
    simRegistrationDate: "",
    consentGranted: true,
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<{
    totalProfiles: number; totalScores: number; avgRiskScore: number; approvalRate: number; tierBreakdown: Record<string, number>;
  }>({ queryKey: ["/api/telco/dashboard"] });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<TelcoAnalytics>({
    queryKey: ["/api/telco/analytics"],
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery<TelcoProfile[]>({
    queryKey: ["/api/telco/profiles"],
  });

  const { data: scores, isLoading: scoresLoading } = useQuery<TelcoCreditScore[]>({
    queryKey: ["/api/telco/scores"],
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await apiRequest("POST", "/api/telco/profiles", {
        ...data,
        consentDate: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/analytics"] });
      setProfileDialogOpen(false);
      setProfileForm({ msisdn: "", provider: "mtn", country: "Ghana", kycLevel: "basic", deviceType: "", simRegistrationDate: "", consentGranted: true });
      toast({ title: "Telco profile created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const scoreMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await apiRequest("POST", `/api/telco/score/${profileId}`, { periodDays: 90 });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/analytics"] });
      if (data.score?.profileId) {
        setExpandedProfileId(data.score.profileId);
      }
      toast({ title: "Telco credit score generated", description: `Risk: ${getRiskLabel(data.score.riskTier)} (${data.score.riskScore}/5)` });
    },
    onError: (e: Error) => {
      toast({ title: "Scoring failed", description: e.message, variant: "destructive" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/telco/seed-demo", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/telco/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telco/scores"] });
      toast({ title: "Demo data seeded", description: data.message });
    },
    onError: (e: Error) => {
      toast({ title: "Seed failed", description: e.message, variant: "destructive" });
    },
  });

  const hasData = (dashboardStats?.totalProfiles || 0) > 0;
  const hasScores = (dashboardStats?.totalScores || 0) > 0;

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-telco-title">Telco Credit Scoring</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">AI-driven mobile money analytics for credit assessment of unbanked populations</p>
        </div>
        <div className="flex gap-2">
          {!hasData && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-demo">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Load Demo Data
            </Button>
          )}
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-profile">
                <Plus className="w-4 h-4 mr-2" />
                Add MoMo Profile
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Mobile Money Profile</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createProfileMutation.mutate(profileForm); }} className="space-y-4" data-testid="form-add-profile">
              <div>
                <Label>MSISDN (Phone Number)</Label>
                <Input data-testid="input-msisdn" value={profileForm.msisdn} onChange={(e) => setProfileForm({ ...profileForm, msisdn: e.target.value })} placeholder="+233XXXXXXXXX" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Provider</Label>
                  <Select value={profileForm.provider} onValueChange={(v) => setProfileForm({ ...profileForm, provider: v })}>
                    <SelectTrigger data-testid="select-provider"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">MTN</SelectItem>
                      <SelectItem value="vodafone">Vodafone</SelectItem>
                      <SelectItem value="airtel">Airtel</SelectItem>
                      <SelectItem value="safaricom">Safaricom</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="glo">Glo</SelectItem>
                      <SelectItem value="tigo">Tigo</SelectItem>
                      <SelectItem value="africell">Africell</SelectItem>
                      <SelectItem value="econet">Econet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Select value={profileForm.country} onValueChange={(v) => setProfileForm({ ...profileForm, country: v })}>
                    <SelectTrigger data-testid="select-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="max-h-[280px]">
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                      <SelectItem value="Rwanda">Rwanda</SelectItem>
                      <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                      <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                      <SelectItem value="Senegal">Senegal</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="Cameroon">Cameroon</SelectItem>
                      <SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
                      <SelectItem value="Zambia">Zambia</SelectItem>
                      <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                      <SelectItem value="Mozambique">Mozambique</SelectItem>
                      <SelectItem value="Mali">Mali</SelectItem>
                      <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                      <SelectItem value="Malawi">Malawi</SelectItem>
                      <SelectItem value="Benin">Benin</SelectItem>
                      <SelectItem value="DRC Congo">DRC Congo</SelectItem>
                      <SelectItem value="Togo">Togo</SelectItem>
                      <SelectItem value="Guinea">Guinea</SelectItem>
                      <SelectItem value="Niger">Niger</SelectItem>
                      <SelectItem value="Chad">Chad</SelectItem>
                      <SelectItem value="Liberia">Liberia</SelectItem>
                      <SelectItem value="Madagascar">Madagascar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>KYC Level</Label>
                  <Select value={profileForm.kycLevel} onValueChange={(v) => setProfileForm({ ...profileForm, kycLevel: v })}>
                    <SelectTrigger data-testid="select-kyc"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="full">Full KYC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Device Type</Label>
                  <Input data-testid="input-device" value={profileForm.deviceType} onChange={(e) => setProfileForm({ ...profileForm, deviceType: e.target.value })} placeholder="e.g. Smartphone" />
                </div>
              </div>
              <div>
                <Label>SIM Registration Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!profileForm.simRegistrationDate ? "text-muted-foreground" : ""}`}
                      data-testid="button-sim-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {profileForm.simRegistrationDate ? (() => { const [y,m,d] = profileForm.simRegistrationDate.split("-").map(Number); return format(new Date(y, m-1, d), "PPP"); })() : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={profileForm.simRegistrationDate ? (() => { const [y,m,d] = profileForm.simRegistrationDate.split("-").map(Number); return new Date(y, m-1, d); })() : undefined}
                      onSelect={(date) => setProfileForm({ ...profileForm, simRegistrationDate: date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : "" })}
                      initialFocus
                      disabled={(date) => date > new Date()}
                      data-testid="calendar-sim-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full" disabled={createProfileMutation.isPending} data-testid="button-submit-profile">
                {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {hasData ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Analytics & ROI
            </TabsTrigger>
            <TabsTrigger value="decision-engine" data-testid="tab-decision-engine">
              <Zap className="w-4 h-4 mr-1.5" /> Decision Engine
            </TabsTrigger>
            <TabsTrigger value="profiles" data-testid="tab-profiles">
              <Smartphone className="w-4 h-4 mr-1.5" /> Profiles
            </TabsTrigger>
            <TabsTrigger value="scores" data-testid="tab-scores">
              <Brain className="w-4 h-4 mr-1.5" /> Scores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            {analyticsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : analytics && hasScores ? (
              <AnalyticsDashboard analytics={analytics} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No analytics data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate credit scores on the Profiles tab to see analytics, KPIs, and ROI metrics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="decision-engine" className="space-y-4">
            <DecisionEnginePanel profiles={profiles || []} />
          </TabsContent>

          <TabsContent value="profiles" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground">MoMo Profiles</p>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-total-profiles">{dashboardStats?.totalProfiles || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground">Scores Generated</p>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-total-scores">{dashboardStats?.totalScores || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground">Avg Risk Score</p>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-avg-risk">{dashboardStats?.avgRiskScore || "N/A"}<span className="text-sm text-muted-foreground">/5</span></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-muted-foreground">Approval Rate</p>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-approval-rate">{dashboardStats?.approvalRate || 0}%</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="space-y-3">
              {profilesLoading ? (
                <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
              ) : profiles && profiles.length > 0 ? (
                profiles.map(profile => {
                  const profileScores = (scores || []).filter(s => s.profileId === profile.id);
                  const isExpanded = expandedProfileId === profile.id;
                  return (
                  <Card
                    key={profile.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setExpandedProfileId(isExpanded ? null : profile.id)}
                    data-testid={`card-profile-${profile.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Signal className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" data-testid={`text-msisdn-${profile.id}`}>{profile.msisdn}</p>
                            <p className="text-xs text-muted-foreground capitalize">{profile.provider} · {profile.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{profile.kycLevel} KYC</Badge>
                          <Badge variant="outline" className="text-[10px]">{profile.deviceType || "Unknown"}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); scoreMutation.mutate(profile.id); }}
                            disabled={scoreMutation.isPending}
                            data-testid={`button-score-${profile.id}`}
                          >
                            {scoreMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3 mr-1" />}
                            Score
                          </Button>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      {profile.simRegistrationDate && (
                        <p className="text-xs text-muted-foreground mt-2">SIM Registered: {profile.simRegistrationDate}</p>
                      )}

                      {isExpanded && (
                        <div className="mt-4 space-y-4" data-testid={`profile-detail-${profile.id}`}>
                          <Separator />
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-[10px] text-muted-foreground mb-1">Phone Number</p>
                              <p className="text-sm font-semibold">{profile.msisdn}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">Country</p>
                              </div>
                              <p className="text-sm font-semibold">{profile.country}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Signal className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">Provider</p>
                              </div>
                              <p className="text-sm font-semibold capitalize">{profile.provider}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Shield className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">KYC Level</p>
                              </div>
                              <p className="text-sm font-semibold capitalize">{profile.kycLevel}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Smartphone className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">Device Type</p>
                              </div>
                              <p className="text-sm font-semibold">{profile.deviceType || "Unknown"}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">SIM Registered</p>
                              </div>
                              <p className="text-sm font-semibold">{profile.simRegistrationDate || "N/A"}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-[10px] text-muted-foreground mb-1">Device Changes (90d)</p>
                              <p className="text-sm font-semibold">{profile.deviceChanges90d ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-1 mb-1">
                                <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">Consent</p>
                              </div>
                              <p className="text-sm font-semibold">{profile.consentGranted ? "Granted" : "Not granted"}</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-1 mb-1">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">Account Status</p>
                            </div>
                            <Badge variant={profile.accountStatus === "active" ? "default" : "secondary"} className="text-[10px] capitalize mt-1">{profile.accountStatus}</Badge>
                          </div>

                          {profileScores.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Credit Score History ({profileScores.length} score{profileScores.length !== 1 ? "s" : ""})</p>
                              <div className="space-y-2">
                                {profileScores.map(score => (
                                  <div key={score.id} className="p-3 rounded-lg border border-border bg-card" data-testid={`profile-score-${score.id}`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        {getRiskIcon(score.riskTier)}
                                        <span className={`font-bold ${getRiskColor(score.riskTier)}`}>{score.riskScore}/5</span>
                                        <Badge variant={getRiskBadgeVariant(score.riskTier)} className="text-[10px]">{getRiskLabel(score.riskTier)}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {score.creditLimit && Number(score.creditLimit) > 0 && (
                                          <Badge variant="outline" className="text-[10px]">
                                            <Wallet className="w-3 h-3 mr-1" />${Number(score.creditLimit).toLocaleString()}
                                          </Badge>
                                        )}
                                        {score.approvalRecommendation ? (
                                          <Badge variant="default" className="text-[10px] bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                                        ) : (
                                          <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{score.reasonCode}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {score.scoredAt ? new Date(score.scoredAt).toLocaleDateString() : ""} · {score.aiProvider}/{score.aiModel} · {score.evaluationPeriodDays}d window
                                    </p>
                                    {score.detailedRationale && (
                                      <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{score.detailedRationale}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-muted/30 text-center">
                              <Brain className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                              <p className="text-xs text-muted-foreground">No scores generated yet for this profile</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={(e) => { e.stopPropagation(); scoreMutation.mutate(profile.id); }}
                                disabled={scoreMutation.isPending}
                                data-testid={`button-score-detail-${profile.id}`}
                              >
                                {scoreMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                                Generate AI Credit Score
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="font-semibold" data-testid="text-no-profiles">No MoMo profiles yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add a mobile money profile to begin scoring</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="scores" className="space-y-4">
            {scoresLoading ? (
              <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
            ) : scores && scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map(score => (
                  <Card
                    key={score.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setScoreDetailId(scoreDetailId === score.id ? null : score.id)}
                    data-testid={`card-score-${score.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(score.riskTier)}
                          <span className={`font-bold text-lg ${getRiskColor(score.riskTier)}`} data-testid={`text-risk-score-${score.id}`}>
                            {score.riskScore}/5
                          </span>
                          <Badge variant={getRiskBadgeVariant(score.riskTier)} className="text-[10px]">{getRiskLabel(score.riskTier)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {score.creditLimit && Number(score.creditLimit) > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              <Wallet className="w-3 h-3 mr-1" />${Number(score.creditLimit).toLocaleString()}
                            </Badge>
                          )}
                          {score.approvalRecommendation ? (
                            <Badge variant="default" className="text-[10px] bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{score.reasonCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {score.scoredAt ? new Date(score.scoredAt).toLocaleDateString() : ""} · {score.aiProvider}/{score.aiModel} · {score.evaluationPeriodDays}d window
                        {score.country && <span> · {score.country}</span>}
                      </p>

                      {scoreDetailId === score.id && (
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <p className="text-sm" data-testid={`text-rationale-${score.id}`}>{score.detailedRationale}</p>

                          {(() => {
                            const kpi = score.kpiSnapshot ? JSON.parse(score.kpiSnapshot) : null;
                            if (!kpi) return null;
                            return (
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-muted-foreground mb-1 font-medium">Cash Flow</p>
                                  <p>Inflows: ${kpi.financialMetrics?.totalInflowsUsd?.toLocaleString()}</p>
                                  <p>Outflows: ${kpi.financialMetrics?.totalOutflowsUsd?.toLocaleString()}</p>
                                  <p>Variance: {kpi.financialMetrics?.inflowVarianceCoefficient?.toFixed(2)}</p>
                                  <p>Wallet Retention: {((kpi.financialMetrics?.walletRetentionRatio || 0) * 100).toFixed(0)}%</p>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-muted-foreground mb-1 font-medium">Payment Behavior</p>
                                  <p>Utility Payments: {kpi.financialMetrics?.utilityPaymentsCount}</p>
                                  <p>Consistency: {((kpi.financialMetrics?.utilityPaymentConsistencyScore || 0) * 100).toFixed(0)}%</p>
                                  <p>Merchant Payments: {kpi.financialMetrics?.merchantPaymentsCount}</p>
                                  <p>Merchant Volume: ${kpi.financialMetrics?.merchantPaymentsVolume?.toLocaleString()}</p>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-muted-foreground mb-1 font-medium">Telemetric</p>
                                  <p>SIM Age: {kpi.telemetricMetrics?.simAgeDays?.toLocaleString()} days</p>
                                  <p>Airtime Advances: {kpi.telemetricMetrics?.airtimeAdvanceFrequency}</p>
                                  <p>Device Changes: {kpi.telemetricMetrics?.deviceChangesLast90Days}</p>
                                  <p>KYC: {kpi.telemetricMetrics?.kycLevel}</p>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-muted-foreground mb-1 font-medium">Network & Risk</p>
                                  <p>P2P Peers: {kpi.networkMetrics?.uniqueP2pCounterparties}</p>
                                  <p>Merchant %: {kpi.networkMetrics?.percentageTransfersToMerchants?.toFixed(1)}%</p>
                                  <p>Income: {kpi.networkMetrics?.regularIncomeDetected ? "Detected" : "Not detected"}</p>
                                  <p>Dormant Gap: {kpi.riskIndicators?.dormantPeriodDays} days</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="font-semibold" data-testid="text-no-scores">No scores generated yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Go to Profiles tab and click "Score" to generate AI credit assessments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Telco Credit Scoring Platform</h2>
          <p className="text-muted-foreground text-center max-w-lg mb-6">
            Score unbanked and underbanked populations using mobile money transaction data.
            Load demo data to explore the full platform with pre-computed AI credit scores,
            KPIs, and ROI analytics across 7 African countries.
          </p>
          <Button size="lg" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-demo-hero">
            {seedMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
            Load Demo Data (19 Profiles, 7 Countries)
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Includes pre-computed AI scores, KPI snapshots, and full transaction histories</p>
        </div>
      )}
    </div>
  );
}
