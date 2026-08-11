import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, Target } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ReductionMetrics = {
  grossLoanExposure: number;
  grossNplExposure: number;
  watchlistExposure: number;
  assignedNplExposure: number;
  targetNplRatio: number;
  currentNplRatio: number;
  targetNplExposure: number;
  requiredNplReduction: number;
  relativeNplReductionRequired: number;
  assignmentCoveragePct: number;
  withinTarget: boolean;
};

type Plan = {
  title: string;
  targetDate: string;
  targetNplRatio: number;
  executiveOwner: string;
  boardEvidenceReference: string;
  strategySummary: string;
  milestones: Array<{ date: string; targetNplRatio: number; actions: string }>;
  baselineSnapshot: ReductionMetrics;
};

type Workspace = {
  country: string | null;
  reportingCurrency: string | null;
  currencyCount: number;
  portfolioReadyForPlan: boolean;
  blockingReason: string | null;
  nplFacilities: number;
  watchlistFacilities: number;
  metrics: ReductionMetrics | null;
  methodology: string;
  active: null | { approvalId: string; approvedAt: string | null; plan: Plan };
  pending: Array<{ approvalId: string; createdAt: string; plan: Plan }>;
};

const initialForm = {
  title: "Ghana NPL Reduction Plan",
  targetDate: "2026-12-31",
  targetNplRatio: "10",
  executiveOwner: "",
  boardEvidenceReference: "",
  strategySummary: "",
  interimDate: "2026-10-31",
  interimRatio: "",
  interimActions: "",
  finalActions: "",
};

function money(value: number, currency: string | null) {
  return `${currency || "Reporting currency"} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
export function NplReductionPlanCard({ canSubmit }: { canSubmit: boolean }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const { data, isLoading, isError } = useQuery<Workspace>({ queryKey: ["/api/npl-reduction-plan"] });
  const submit = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/npl-reduction-plan", {
        title: form.title,
        targetDate: form.targetDate,
        targetNplRatio: Number(form.targetNplRatio),
        executiveOwner: form.executiveOwner,
        boardEvidenceReference: form.boardEvidenceReference,
        strategySummary: form.strategySummary,
        milestones: [
          { date: form.interimDate, targetNplRatio: Number(form.interimRatio), actions: form.interimActions },
          { date: form.targetDate, targetNplRatio: Number(form.targetNplRatio), actions: form.finalActions },
        ],
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Plan submitted", description: "A different authorised reviewer must approve the NPL reduction plan." });
      queryClient.invalidateQueries({ queryKey: ["/api/npl-reduction-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
    },
    onError: (error: Error) => toast({ title: "Plan was not submitted", description: error.message, variant: "destructive" }),
  });
  const metrics = data?.metrics;
  const validForm = Boolean(
    form.executiveOwner.trim()
    && form.boardEvidenceReference.trim()
    && form.strategySummary.trim().length >= 20
    && form.interimRatio
    && Number(form.interimRatio) >= Number(form.targetNplRatio)
    && form.interimActions.trim().length >= 10
    && form.finalActions.trim().length >= 10
  );

  return <Card data-testid="npl-reduction-plan" className="border-primary/30">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" />Board NPL reduction plan</CardTitle>
          <CardDescription className="mt-2">A reconciled 10% target gap, dated milestones and maker-checker evidence for management and regulatory review.</CardDescription>
        </div>
        {data?.active ? <Badge className="bg-emerald-600">Approved plan active</Badge> : data?.pending?.length ? <Badge variant="secondary">Awaiting independent approval</Badge> : <Badge variant="outline">No approved plan</Badge>}
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      {isLoading ? <p className="text-sm text-muted-foreground">Reconciling the authorised portfolio scope…</p> : isError ? <p className="text-sm text-destructive">The NPL plan workspace could not be loaded.</p> : data?.blockingReason ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200" data-testid="npl-plan-blocking-reason">{data.blockingReason}</div> : metrics ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Current gross NPL ratio</p><p className="mt-1 text-2xl font-bold" data-testid="npl-current-ratio">{metrics.currentNplRatio.toFixed(2)}%</p><p className="text-xs text-muted-foreground">{data?.nplFacilities || 0} classified facilities</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Approved / regulatory target</p><p className="mt-1 text-2xl font-bold text-primary">{metrics.targetNplRatio.toFixed(2)}%</p><p className="text-xs text-muted-foreground">By {data?.active?.plan.targetDate || "31 Dec 2026"}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Exposure reduction required</p><p className="mt-1 text-2xl font-bold">{money(metrics.requiredNplReduction, data?.reportingCurrency || null)}</p><p className="text-xs text-muted-foreground">{metrics.relativeNplReductionRequired.toFixed(2)}% of current gross NPL exposure</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Active collections coverage</p><p className="mt-1 text-2xl font-bold">{metrics.assignmentCoveragePct.toFixed(2)}%</p><p className="text-xs text-muted-foreground">NPL exposure with an active owner</p></div>
      </div> : <div className="rounded-lg border p-4 text-sm text-muted-foreground">Load and reconcile an approved bank loan tape before calculating or submitting the plan.</div>}

      {data?.active && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm" data-testid="npl-active-plan"><p className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="size-4" />{data.active.plan.title}</p><p className="mt-1 text-muted-foreground">Owner: {data.active.plan.executiveOwner} · Board evidence: {data.active.plan.boardEvidenceReference} · {data.active.plan.milestones.length} monitored milestones</p></div>}

      <p className="text-xs text-muted-foreground">{data?.methodology || "UCH displays a controlled management calculation only. The bank's reconciled regulatory return remains authoritative."}</p>

      {canSubmit && !data?.active && <form className="space-y-4 rounded-xl border p-4" data-testid="npl-plan-form" onSubmit={(event) => { event.preventDefault(); submit.mutate(); }}>
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">Submit the Board plan for independent approval</p><p className="text-xs text-muted-foreground">Do not use placeholder targets or evidence references.</p></div><Link href="/approvals"><Button type="button" variant="outline" size="sm" className="gap-2"><FileCheck2 className="size-4" />Open approvals</Button></Link></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label htmlFor="npl-plan-owner">Executive owner</Label><Input id="npl-plan-owner" value={form.executiveOwner} onChange={(event) => setForm({ ...form, executiveOwner: event.target.value })} placeholder="Chief Risk Officer" /></div>
          <div><Label htmlFor="npl-plan-evidence">Board evidence reference</Label><Input id="npl-plan-evidence" value={form.boardEvidenceReference} onChange={(event) => setForm({ ...form, boardEvidenceReference: event.target.value })} placeholder="Board minute / approved plan reference" /></div>
        </div>
        <div><Label htmlFor="npl-plan-summary">Reduction strategy</Label><Textarea id="npl-plan-summary" value={form.strategySummary} onChange={(event) => setForm({ ...form, strategySummary: event.target.value })} placeholder="State the bank-approved cure, recovery, restructuring, collateral, legal and fresh-inflow controls." /></div>
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label htmlFor="npl-plan-interim-date">Interim review date</Label><Input id="npl-plan-interim-date" type="date" value={form.interimDate} max={form.targetDate} onChange={(event) => setForm({ ...form, interimDate: event.target.value })} /></div>
          <div><Label htmlFor="npl-plan-interim-ratio">Interim target %</Label><Input id="npl-plan-interim-ratio" type="number" min="0" max="100" step="0.01" value={form.interimRatio} onChange={(event) => setForm({ ...form, interimRatio: event.target.value })} /></div>
          <div><Label htmlFor="npl-plan-target-date">Final target</Label><Input id="npl-plan-target-date" value={`${form.targetNplRatio}% by ${form.targetDate}`} disabled /></div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label htmlFor="npl-plan-interim-actions">Interim actions and accountable output</Label><Textarea id="npl-plan-interim-actions" value={form.interimActions} onChange={(event) => setForm({ ...form, interimActions: event.target.value })} /></div>
          <div><Label htmlFor="npl-plan-final-actions">Final actions and evidence</Label><Textarea id="npl-plan-final-actions" value={form.finalActions} onChange={(event) => setForm({ ...form, finalActions: event.target.value })} /></div>
        </div>
        <Button type="submit" disabled={!data?.portfolioReadyForPlan || !validForm || submit.isPending}>{submit.isPending ? "Submitting…" : "Submit governed plan"}</Button>
      </form>}
    </CardContent>
  </Card>;
}
