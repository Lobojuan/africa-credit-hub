import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Smartphone, Signal, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  XCircle, Plus, Loader2, ChevronRight, BarChart3, Wallet, Phone, Brain, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, Users, Activity, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function TelcoScoringPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [scoreDetailId, setScoreDetailId] = useState<string | null>(null);

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
      toast({ title: "Demo data seeded", description: data.message });
    },
    onError: (e: Error) => {
      toast({ title: "Seed failed", description: e.message, variant: "destructive" });
    },
  });

  const selectedScore = scores?.find(s => s.id === scoreDetailId);
  const kpiData = selectedScore?.kpiSnapshot ? JSON.parse(selectedScore.kpiSnapshot) : null;

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
          {(!profiles || profiles.length === 0) && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-demo">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Seed Demo Data
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {dashboardStats && dashboardStats.totalScores > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /><span className="font-semibold text-sm">Risk Tier Distribution</span></div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(dashboardStats.tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  {getRiskIcon(tier)}
                  <span className="text-sm font-medium">{getRiskLabel(tier)}</span>
                  <Badge variant={getRiskBadgeVariant(tier)} className="text-xs" data-testid={`badge-tier-${tier}`}>{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Smartphone className="w-5 h-5" /> MoMo Profiles</h2>
          {profilesLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ) : profiles && profiles.length > 0 ? (
            <div className="space-y-3">
              {profiles.map(profile => (
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
              ))}
            </div>
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

        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Zap className="w-5 h-5" /> Recent Scores</h2>
          {scoresLoading ? (
            <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ) : scores && scores.length > 0 ? (
            <div className="space-y-3">
              {scores.slice(0, 10).map(score => (
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
                    </p>

                    {scoreDetailId === score.id && (
                      <div className="mt-4 space-y-3">
                        <Separator />
                        <p className="text-sm" data-testid={`text-rationale-${score.id}`}>{score.detailedRationale}</p>

                        {score.creditLimit && (
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Suggested Credit Limit: ${Number(score.creditLimit).toLocaleString()}</span>
                          </div>
                        )}

                        {(() => {
                          const kpi = score.kpiSnapshot ? JSON.parse(score.kpiSnapshot) : null;
                          if (!kpi) return null;
                          return (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-muted-foreground mb-1">Cash Flow</p>
                                <p className="font-medium">Inflows: ${kpi.financialMetrics?.totalInflowsUsd?.toLocaleString()}</p>
                                <p className="font-medium">Variance: {kpi.financialMetrics?.inflowVarianceCoefficient}</p>
                                <p className="font-medium">Wallet Retention: {(kpi.financialMetrics?.walletRetentionRatio * 100).toFixed(0)}%</p>
                              </div>
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-muted-foreground mb-1">Behavior</p>
                                <p className="font-medium">Utility Payments: {kpi.financialMetrics?.utilityPaymentsCount}</p>
                                <p className="font-medium">Consistency: {(kpi.financialMetrics?.utilityPaymentConsistencyScore * 100).toFixed(0)}%</p>
                                <p className="font-medium">Merchant %: {kpi.networkMetrics?.percentageTransfersToMerchants}%</p>
                              </div>
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-muted-foreground mb-1">Telemetric</p>
                                <p className="font-medium">SIM Age: {kpi.telemetricMetrics?.simAgeDays} days</p>
                                <p className="font-medium">Airtime Advances: {kpi.telemetricMetrics?.airtimeAdvanceFrequency}</p>
                                <p className="font-medium">KYC: {kpi.telemetricMetrics?.kycLevel}</p>
                              </div>
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-muted-foreground mb-1">Network</p>
                                <p className="font-medium">P2P Peers: {kpi.networkMetrics?.uniqueP2pCounterparties}</p>
                                <p className="font-medium">Income: {kpi.networkMetrics?.regularIncomeDetected ? "Detected" : "Not detected"}</p>
                                <p className="font-medium">Salary Credits: {kpi.networkMetrics?.salaryCreditsCount}</p>
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
                <p className="text-sm text-muted-foreground mt-1">Select a profile and click "Score" to generate an AI credit assessment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
