import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  TrendingDown, TrendingUp, ShieldAlert, Activity, Play, RotateCcw,
  BarChart3, Scale, ArrowRightLeft, CheckCircle2, AlertTriangle,
  Clock, Landmark, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STAGE_COLORS = {
  performing: "#10b981",
  watchlist: "#f59e0b",
  substandard: "#f97316",
  doubtful: "#ef4444",
  loss: "#7f1d1d",
};

const IFRS9_COLORS = {
  stage_1: "#10b981",
  stage_2: "#f59e0b",
  stage_3: "#ef4444",
};

function money(value: string | number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(value: string | number | null | undefined) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

export default function NplPortfolioDashboardPage() {
  const { toast } = useToast();
  const [matrixDays, setMatrixDays] = useState("90");
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().slice(0, 10));

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useQuery<{
    summaryDate: string;
    grossLoanExposure: string;
    nplExposure: string;
    watchlistExposure: string;
    substandardExposure: string;
    doubtfulExposure: string;
    lossExposure: string;
    totalFacilities: number;
    nplFacilities: number;
    watchlistFacilities: number;
    nplRatio: string;
    watchlistRatio: string;
    coverageRatio: string;
    provisionRatio: string;
    stage1Exposure: string;
    stage2Exposure: string;
    stage3Exposure: string;
    stage1Provision: string;
    stage2Provision: string;
    stage3Provision: string;
    inflowsStage1To2: number;
    inflowsStage2To3: number;
    curesStage3To2: number;
    curesStage2To1: number;
    writeOffs: number;
    nplAssignedToCollection: number;
    nplNotAssigned: number;
    generatedAt: string;
    methodology: string;
  }>({
    queryKey: ["/api/npl/portfolio-summary", summaryDate],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/npl/portfolio-summary?date=${summaryDate}`);
      return res.json();
    },
  });

  const {
    data: matrix,
    isLoading: matrixLoading,
  } = useQuery<{
    periodDays: number;
    matrix: Record<string, Record<string, { count: number; exposure: string; avgDpdAfter: number }>>;
    flowRates: Array<{ from: string; to: string; flowRate: number }>;
    methodology: string;
  }>({
    queryKey: ["/api/npl/migration-matrix", matrixDays],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/npl/migration-matrix?days=${matrixDays}`);
      return res.json();
    },
  });

  const classifyNow = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/npl/classify-now");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Classification complete",
        description: `${data.classificationsInserted} classifications, ${data.migrationsInserted} migrations, ${data.collectionsTriggered} auto-collections in ${data.durationMs}ms`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/npl/portfolio-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/npl/migration-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/npl-early-warning"] });
    },
    onError: (error: Error) => {
      toast({ title: "Classification failed", description: error.message, variant: "destructive" });
    },
  });

  const stageBreakdown = summary
    ? [
        { name: "Performing", value: Number(summary.grossLoanExposure) - Number(summary.nplExposure) - Number(summary.watchlistExposure), fill: STAGE_COLORS.performing },
        { name: "Watchlist", value: Number(summary.watchlistExposure), fill: STAGE_COLORS.watchlist },
        { name: "Substandard", value: Number(summary.substandardExposure), fill: STAGE_COLORS.substandard },
        { name: "Doubtful", value: Number(summary.doubtfulExposure), fill: STAGE_COLORS.doubtful },
        { name: "Loss", value: Number(summary.lossExposure), fill: STAGE_COLORS.loss },
      ].filter((s) => s.value > 0)
    : [];

  const ifrs9Breakdown = summary
    ? [
        { name: "Stage 1", value: Number(summary.stage1Exposure), provision: Number(summary.stage1Provision), fill: IFRS9_COLORS.stage_1 },
        { name: "Stage 2", value: Number(summary.stage2Exposure), provision: Number(summary.stage2Provision), fill: IFRS9_COLORS.stage_2 },
        { name: "Stage 3", value: Number(summary.stage3Exposure), provision: Number(summary.stage3Provision), fill: IFRS9_COLORS.stage_3 },
      ].filter((s) => s.value > 0)
    : [];

  const stages = ["performing", "watchlist", "substandard", "doubtful", "loss"];
  const matrixData = matrix
    ? stages.flatMap((from) =>
        stages.map((to) => ({
          from,
          to,
          count: matrix.matrix[from]?.[to]?.count || 0,
          exposure: Number(matrix.matrix[from]?.[to]?.exposure || 0),
        }))
      )
    : [];

  const flowRateData = matrix?.flowRates.map((f) => ({
    name: `${f.from} → ${f.to}`,
    rate: Number((f.flowRate * 100).toFixed(2)),
  })) || [];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="npl-portfolio-dashboard">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IFRS 9 &amp; BoG NPL Portfolio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">NPL Portfolio Dashboard</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Real-time NPL ratio, coverage, IFRS 9 stage breakdown, and migration flows.
            Classifications run automatically every 24 hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => classifyNow.mutate()}
            disabled={classifyNow.isPending}
            className="gap-2"
            data-testid="btn-classify-now"
          >
            {classifyNow.isPending ? <RotateCcw className="size-4 animate-spin" /> : <Play className="size-4" />}
            {classifyNow.isPending ? "Classifying…" : "Run classification now"}
          </Button>
          <Link href="/npl-early-warning">
            <Button variant="outline" className="gap-2">
              NPL Early Warning <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Safety banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="font-semibold">Automated classifications</p>
            <p className="text-sm text-muted-foreground">DPD thresholds and status triggers map to BoG NPL stages and IFRS 9 stages automatically.</p>
          </div>
          <div>
            <p className="font-semibold">Independent reconciliation required</p>
            <p className="text-sm text-muted-foreground">Portfolio numbers are draft until the bank reconciles against its own GL and loan tape.</p>
          </div>
          <div>
            <p className="font-semibold">Audit trail</p>
            <p className="text-sm text-muted-foreground">Every classification and migration is timestamped and immutable.</p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gross loan exposure</CardDescription>
            <CardTitle className="text-2xl">{summaryLoading ? "—" : summaryError ? "Error" : `GHS ${money(summary?.grossLoanExposure ?? null)}`}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summaryLoading ? "Loading…" : `${summary?.totalFacilities || 0} facilities · Written-off excluded`}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>NPL ratio</CardDescription>
            <CardTitle className={`text-2xl ${Number(summary?.nplRatio || 0) > 0.1 ? "text-red-600" : "text-emerald-600"}`}>
              {summaryLoading ? "—" : summaryError ? "Error" : pct(summary?.nplRatio ?? null)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summaryLoading ? "Loading…" : `GHS ${money(summary?.nplExposure ?? null)} NPL exposure · ${summary?.nplFacilities || 0} facilities`}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coverage ratio</CardDescription>
            <CardTitle className="text-2xl">
              {summaryLoading ? "—" : summaryError ? "Error" : pct(summary?.coverageRatio ?? null)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summaryLoading ? "Loading…" : `Provisions / NPL exposure · GHS ${money(summary?.stage1Provision ?? null)} + ${money(summary?.stage2Provision ?? null)} + ${money(summary?.stage3Provision ?? null)}`}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Watchlist ratio</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {summaryLoading ? "—" : summaryError ? "Error" : pct(summary?.watchlistRatio ?? null)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summaryLoading ? "Loading…" : `GHS ${money(summary?.watchlistExposure ?? null)} · ${summary?.watchlistFacilities || 0} facilities`}
          </CardContent>
        </Card>
      </section>

      {/* Charts row */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* NPL Stage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-5 text-primary" />
              NPL Stage Breakdown
            </CardTitle>
            <CardDescription>By gross exposure</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : summaryError ? (
              <p className="text-sm text-destructive">Unable to load portfolio summary.</p>
            ) : stageBreakdown.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No portfolio data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stageBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {stageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `GHS ${money(value)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* IFRS 9 Stage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              IFRS 9 Stage Breakdown
            </CardTitle>
            <CardDescription>Exposure and provision by ECL stage</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : summaryError ? (
              <p className="text-sm text-destructive">Unable to load portfolio summary.</p>
            ) : ifrs9Breakdown.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No portfolio data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ifrs9Breakdown} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `GHS ${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => `GHS ${money(value)}`} />
                  <Legend />
                  <Bar dataKey="value" name="Exposure" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="provision" name="Provision" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Migration Matrix */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="size-5 text-primary" />
                Migration Matrix
              </CardTitle>
              <CardDescription>Stage transitions over the selected period</CardDescription>
            </div>
            <Select value={matrixDays} onValueChange={setMatrixDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {matrixLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !matrix ? (
            <p className="py-12 text-center text-muted-foreground">No migration data available.</p>
          ) : (
            <>
              {/* Matrix grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground">From \ To</th>
                      {stages.map((s) => (
                        <th key={s} className="px-2 py-2 text-center font-medium capitalize">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((from) => (
                      <tr key={from} className="border-b">
                        <td className="px-2 py-2 font-medium capitalize">{from}</td>
                        {stages.map((to) => {
                          const cell = matrix.matrix[from]?.[to];
                          const count = cell?.count || 0;
                          return (
                            <td key={to} className="px-2 py-2 text-center">
                              {count > 0 ? (
                                <Badge variant="outline" className={from === to ? "border-emerald-500/30 text-emerald-700" : "border-amber-500/30 text-amber-700"}>
                                  {count}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Flow rates bar chart */}
              {flowRateData.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Flow rates (% of origin stage)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={flowRateData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Provision Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-5 text-primary" />
            Provision Summary
          </CardTitle>
          <CardDescription>ECL by IFRS 9 stage</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : summaryError ? (
            <p className="text-sm text-destructive">Unable to load provision summary.</p>
          ) : !summary ? (
            <p className="py-12 text-center text-muted-foreground">No provision data available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <p className="font-semibold">Stage 1 — Performing</p>
                </div>
                <p className="mt-2 text-2xl font-bold">GHS {money(summary.stage1Exposure)}</p>
                <p className="text-sm text-muted-foreground">Provision: GHS {money(summary.stage1Provision)}</p>
                <p className="text-sm text-muted-foreground">Rate: {Number(summary.stage1Exposure) > 0 ? ((Number(summary.stage1Provision) / Number(summary.stage1Exposure)) * 100).toFixed(2) : "0.00"}%</p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <p className="font-semibold">Stage 2 — SICR</p>
                </div>
                <p className="mt-2 text-2xl font-bold">GHS {money(summary.stage2Exposure)}</p>
                <p className="text-sm text-muted-foreground">Provision: GHS {money(summary.stage2Provision)}</p>
                <p className="text-sm text-muted-foreground">Rate: {Number(summary.stage2Exposure) > 0 ? ((Number(summary.stage2Provision) / Number(summary.stage2Exposure)) * 100).toFixed(2) : "0.00"}%</p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-600" />
                  <p className="font-semibold">Stage 3 — Credit Impaired</p>
                </div>
                <p className="mt-2 text-2xl font-bold">GHS {money(summary.stage3Exposure)}</p>
                <p className="text-sm text-muted-foreground">Provision: GHS {money(summary.stage3Provision)}</p>
                <p className="text-sm text-muted-foreground">Rate: {Number(summary.stage3Exposure) > 0 ? ((Number(summary.stage3Provision) / Number(summary.stage3Exposure)) * 100).toFixed(2) : "0.00"}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Collection Status
          </CardTitle>
          <CardDescription>NPL facilities assigned to collections</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : summaryError || !summary ? (
            <p className="text-sm text-muted-foreground">No collection data available.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Assigned to Collections</p>
                  <p className="text-2xl font-bold">{summary.nplAssignedToCollection}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Not Yet Assigned</p>
                  <p className="text-2xl font-bold">{summary.nplNotAssigned}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footnote */}
      <p className="text-xs text-muted-foreground">
        {summary?.methodology || "Gross NPL exposure / gross loan exposure. Written-off balances excluded. Provisions based on BoG-standard rates. Independent bank reconciliation required before GL posting."}
      </p>
    </main>
  );
}
