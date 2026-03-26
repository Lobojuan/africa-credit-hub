import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Smartphone, Signal, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  XCircle, Plus, Loader2, ChevronRight, BarChart3, Wallet, Phone, Brain, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, Users, Activity, Zap, Globe, DollarSign,
  Target, PieChart, Award, MapPin, Clock, ShieldCheck, Percent, Banknote
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

export default function TelcoScoringPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
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
                  <Input data-testid="input-country" value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} required />
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
                <Input data-testid="input-sim-date" type="date" value={profileForm.simRegistrationDate} onChange={(e) => setProfileForm({ ...profileForm, simRegistrationDate: e.target.value })} />
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
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Analytics & ROI
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
                profiles.map(profile => (
                  <Card key={profile.id} className="hover-elevate cursor-pointer" data-testid={`card-profile-${profile.id}`}>
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
                        </div>
                      </div>
                      {profile.simRegistrationDate && (
                        <p className="text-xs text-muted-foreground mt-2">SIM Registered: {profile.simRegistrationDate}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
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
