import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, FileCheck2, ShieldAlert, Upload } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WarningCase = {
  collection_assignment_id: string | null;
  credit_account_id: string;
  borrower_id: string;
  account_number: string;
  account_type: string;
  current_balance: string;
  amount_overdue: string | null;
  currency: string;
  account_status: string;
  days_in_arrears: number;
  restructure_count: number;
  next_payment_date: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  country: string | null;
  severity: "watch" | "elevated" | "high" | "critical";
  signals: string[];
  isAssigned: boolean;
};

type PilotReadiness = {
  facilitiesLoaded: number;
  atRiskFacilities: number;
  assignedFacilities: number;
  incompleteFacilities: number;
  dataCompletenessPct: number;
  readyForRiskReview: boolean;
};

type MacroRiskOverlay = {
  country: string;
  profile: {
    title: string;
    purpose: string;
    dataStatusMessage: string;
    drivers: Array<{ id: string; label: string; transmission: string }>;
    guardrail: string;
  } | null;
  sectorExposure?: Array<{
    sector: string;
    facilities: number;
    atRiskFacilities: number;
    totalExposure: string;
    atRiskExposure: string;
    sensitivity: "elevated" | "high" | "not_mapped";
    rationale: string;
  }>;
  message?: string;
  approvedObservation?: {
    observedAt: string;
    source: string;
    inflationAnnualPct: number;
    policyRatePct: number;
    currencyDepreciationYtdPct: number;
    sectorCashflowRisk: "low" | "elevated" | "high";
    notes?: string;
    approvedAt: string;
  } | null;
};

const severityClass: Record<WarningCase["severity"], string> = {
  watch: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  elevated: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 border-red-500/20",
};

function borrowerName(item: WarningCase) {
  return item.company_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || "Unnamed borrower";
}

export default function NplEarlyWarningPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canAssign = ["admin", "super_admin", "platform_owner", "lender"].includes(user?.role || "");
  const [macroForm, setMacroForm] = useState({ observedAt: new Date().toISOString().slice(0, 10), source: "", inflationAnnualPct: "", policyRatePct: "", currencyDepreciationYtdPct: "", sectorCashflowRisk: "elevated", notes: "" });
  const { data, isLoading, isError } = useQuery<{ generatedAt: string; cases: WarningCase[] }>({ queryKey: ["/api/npl-early-warning"] });
  const { data: readiness, isLoading: readinessLoading } = useQuery<PilotReadiness>({ queryKey: ["/api/npl-early-warning/pilot-readiness"] });
  const { data: macroRisk, isLoading: macroRiskLoading } = useQuery<MacroRiskOverlay>({ queryKey: ["/api/npl-early-warning/macro-risk"] });
  const cases = data?.cases || [];
  const summary = useMemo(() => ({
    critical: cases.filter((item) => item.severity === "critical").length,
    unassigned: cases.filter((item) => !item.isAssigned).length,
    exposure: cases.reduce((total, item) => total + Number(item.current_balance || 0), 0),
  }), [cases]);

  const assignToCollections = useMutation({
    mutationFn: async (item: WarningCase) => {
      const priority = item.severity === "critical" ? "urgent" : item.severity === "high" ? "high" : "medium";
      const response = await apiRequest("POST", "/api/collections/assignments", {
        borrowerId: item.borrower_id,
        creditAccountId: item.credit_account_id,
        priority,
        amountOutstanding: item.amount_overdue || item.current_balance,
        currency: item.currency,
        dueDate: item.next_payment_date,
        notes: `NPL early warning: ${item.signals.join("; ")}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/npl-early-warning"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/assignments"] });
      toast({ title: "Assigned to Collections", description: "The at-risk facility now has an operational owner." });
    },
    onError: (error: Error) => toast({ title: "Could not assign case", description: error.message, variant: "destructive" }),
  });

  const submitMacroObservation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/npl-early-warning/macro-observations", {
        ...macroForm,
        inflationAnnualPct: Number(macroForm.inflationAnnualPct),
        policyRatePct: Number(macroForm.policyRatePct),
        currencyDepreciationYtdPct: Number(macroForm.currencyDepreciationYtdPct),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted for approval", description: "A different authorised reviewer must approve this observation before UCH displays it." });
      setMacroForm((value) => ({ ...value, source: "", inflationAnnualPct: "", policyRatePct: "", currencyDepreciationYtdPct: "", notes: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
    },
    onError: (error: Error) => toast({ title: "Could not submit macro observation", description: error.message, variant: "destructive" }),
  });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="npl-early-warning-desk">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Credit risk operations</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">NPL Early Warning Desk</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Live arrears and account-status signals that need an owner before they become losses.</p>
        </div>
        <Link href="/collections"><Button variant="outline" className="gap-2">Open Collections <ArrowRight className="h-4 w-4" /></Button></Link>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Critical cases</CardDescription><CardTitle className="text-3xl text-red-600">{isLoading ? "—" : summary.critical}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">90+ DPD, defaulted, or written-off facilities</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Need an owner</CardDescription><CardTitle className="text-3xl text-amber-600">{isLoading ? "—" : summary.unassigned}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">At-risk facilities not yet in Collections</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>At-risk exposure</CardDescription><CardTitle className="text-3xl">{isLoading ? "—" : summary.exposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Current balance across the live warning queue</CardContent></Card>
        <Card data-testid="npl-pilot-data-quality"><CardHeader className="pb-2"><CardDescription>Pilot data quality</CardDescription><CardTitle className={`text-3xl ${readiness?.readyForRiskReview ? "text-emerald-600" : "text-amber-600"}`}>{readinessLoading ? "—" : `${readiness?.dataCompletenessPct ?? 0}%`}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{readinessLoading ? "Checking loan-tape completeness…" : readiness?.facilitiesLoaded ? `${readiness.facilitiesLoaded.toLocaleString()} facilities loaded · ${readiness.incompleteFacilities} need correction` : "Load an approved pilot loan tape to begin"}</CardContent></Card>
      </section>

      <Card className="border-primary/20 bg-primary/5" data-testid="npl-pilot-control-strip">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="font-semibold">NPL pilot control path</p><p className="mt-1 text-sm text-muted-foreground">Load a bank-approved extract, correct the completeness exceptions, assign every at-risk facility, then preserve the monthly evidence pack for independent review.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/batch-upload"><Button variant="outline" className="gap-2"><Upload className="size-4" />Data intake</Button></Link><Link href="/regulatory-evidence-packs"><Button variant="outline" className="gap-2"><FileCheck2 className="size-4" />Evidence pack</Button></Link></div>
        </CardContent>
      </Card>

      <Card data-testid="npl-macro-risk-overlay">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />{macroRisk?.profile?.title || "Macro-risk profile"}</CardTitle>
          <CardDescription>{macroRiskLoading ? "Loading controlled macro-risk guidance…" : macroRisk?.profile?.purpose || macroRisk?.message || "Select a country with an approved macro-risk profile."}</CardDescription>
        </CardHeader>
        {macroRisk?.profile && <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Data gate:</span> {macroRisk.profile.dataStatusMessage}</div>
          {macroRisk.approvedObservation ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm" data-testid="npl-approved-macro-observation"><p className="font-semibold text-emerald-800">Approved observation · {macroRisk.approvedObservation.observedAt}</p><p className="mt-1 text-muted-foreground">Inflation {macroRisk.approvedObservation.inflationAnnualPct}% · Policy rate {macroRisk.approvedObservation.policyRatePct}% · FX depreciation {macroRisk.approvedObservation.currencyDepreciationYtdPct}% · Sector cashflow {macroRisk.approvedObservation.sectorCashflowRisk}. Source: {macroRisk.approvedObservation.source}</p></div> : <div className="rounded-lg border p-3 text-sm text-muted-foreground">No approved Ghana macro observation is active yet. Submit one below, then use Pending Approvals for independent review.</div>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {macroRisk.profile.drivers.map((driver) => <div key={driver.id} className="rounded-lg border p-3"><p className="font-medium text-sm">{driver.label}</p><p className="mt-1 text-xs text-muted-foreground">{driver.transmission}</p></div>)}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{macroRisk.country} portfolio sectors requiring scenario mapping</p>
            {(macroRisk.sectorExposure?.length || 0) === 0 ? <p className="text-sm text-muted-foreground">No Ghana facilities are available in this authorised scope yet.</p> : <div className="grid gap-2 md:grid-cols-2">{macroRisk.sectorExposure?.map((sector) => <div key={sector.sector} className="flex items-start justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium text-sm">{sector.sector}</p><p className="mt-1 text-xs text-muted-foreground">{sector.atRiskFacilities} at-risk of {sector.facilities} facilities · {sector.rationale}</p></div><Badge variant="outline" className={sector.sensitivity === "high" ? "border-red-500/30 bg-red-500/10 text-red-700" : sector.sensitivity === "elevated" ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : ""}>{sector.sensitivity === "not_mapped" ? "map" : sector.sensitivity}</Badge></div>)}</div>}
          </div>
          <p className="text-xs text-muted-foreground">{macroRisk.profile.guardrail}</p>
          {canAssign && macroRisk.country === "Ghana" && <form className="space-y-3 rounded-lg border p-4" data-testid="form-npl-macro-observation" onSubmit={(event) => { event.preventDefault(); submitMacroObservation.mutate(); }}>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-sm">Submit Ghana macro observation</p><Link href="/approvals"><Button type="button" variant="outline" size="sm">Open approvals</Button></Link></div>
            <div className="grid gap-3 md:grid-cols-3"><div><Label htmlFor="macro-observed-at">Observation date</Label><Input id="macro-observed-at" type="date" value={macroForm.observedAt} onChange={(e) => setMacroForm({ ...macroForm, observedAt: e.target.value })} required /></div><div><Label htmlFor="macro-inflation">Annual inflation %</Label><Input id="macro-inflation" type="number" step="0.01" value={macroForm.inflationAnnualPct} onChange={(e) => setMacroForm({ ...macroForm, inflationAnnualPct: e.target.value })} required /></div><div><Label htmlFor="macro-policy">Policy rate %</Label><Input id="macro-policy" type="number" step="0.01" value={macroForm.policyRatePct} onChange={(e) => setMacroForm({ ...macroForm, policyRatePct: e.target.value })} required /></div><div><Label htmlFor="macro-fx">FX depreciation YTD %</Label><Input id="macro-fx" type="number" step="0.01" value={macroForm.currencyDepreciationYtdPct} onChange={(e) => setMacroForm({ ...macroForm, currencyDepreciationYtdPct: e.target.value })} required /></div><div><Label htmlFor="macro-cashflow">Sector cashflow risk</Label><select id="macro-cashflow" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={macroForm.sectorCashflowRisk} onChange={(e) => setMacroForm({ ...macroForm, sectorCashflowRisk: e.target.value as "low" | "elevated" | "high" })}><option value="low">Low</option><option value="elevated">Elevated</option><option value="high">High</option></select></div><div><Label htmlFor="macro-source">Source</Label><Input id="macro-source" value={macroForm.source} onChange={(e) => setMacroForm({ ...macroForm, source: e.target.value })} placeholder="Approved bank / regulator source" required /></div></div>
            <div><Label htmlFor="macro-notes">Notes (optional)</Label><Textarea id="macro-notes" value={macroForm.notes} onChange={(e) => setMacroForm({ ...macroForm, notes: e.target.value })} /></div><Button type="submit" disabled={submitMacroObservation.isPending}>{submitMacroObservation.isPending ? "Submitting…" : "Submit for independent approval"}</Button>
          </form>}
        </CardContent>}
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-orange-600" />Prioritised facilities</CardTitle><CardDescription>Signals are calculated from current account status, days in arrears, and restructuring history.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : isError ? <p className="text-sm text-destructive">Unable to load the early-warning queue.</p> : cases.length === 0 ? <div className="py-12 text-center text-muted-foreground"><CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-emerald-600" />No facilities currently meet the warning threshold.</div> : (
            <div className="divide-y">
              {cases.map((item) => (
                <div key={item.credit_account_id} className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={severityClass[item.severity]}>{item.severity}</Badge><span className="font-semibold">{borrowerName(item)}</span><span className="text-sm text-muted-foreground">{item.account_number}</span></div>
                    <p className="text-sm text-muted-foreground">{item.signals.join(" · ")} · {item.currency} {Number(item.current_balance || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.isAssigned ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />In Collections</Badge> : canAssign ? <Button size="sm" className="gap-2" disabled={assignToCollections.isPending} onClick={() => assignToCollections.mutate(item)}><AlertTriangle className="h-4 w-4" />Assign to Collections</Button> : <Badge variant="outline">Awaiting lender action</Badge>}
                    <Link href={`/credit-accounts`}><Button size="sm" variant="ghost">Review</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
