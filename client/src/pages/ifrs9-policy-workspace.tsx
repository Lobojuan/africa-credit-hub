import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Workspace = { active: null | { approvalId: string; approvedAt: string | null; policy: { id: string; version: string; country: string; effectiveDate: string; owner: string; modelVersion: string; sicrDaysPastDue: number; defaultDaysPastDue: number; cureMonthsRequired: number }; evidenceReference: string }; pending: Array<{ approvalId: string; createdAt: string; policy: { id: string; version: string; effectiveDate: string; owner: string }; evidenceReference: string }> };

const defaultPolicy = {
  id: "ghana-retail-ifrs9", version: "2026.1", country: "Ghana", effectiveDate: "2026-08-01T00:00:00.000Z", owner: "Chief Risk Officer", modelVersion: "bank-model-version-required",
  sicrDaysPastDue: 30, defaultDaysPastDue: 90, cureMonthsRequired: 3, creditImpairedStatuses: ["default", "written_off"],
};
const scenarios = [
  { id: "base", label: "Base", weight: 0.6, pdMultiplier: 1, lgdMultiplier: 1 },
  { id: "downside", label: "Downside", weight: 0.4, pdMultiplier: 1.4, lgdMultiplier: 1.15 },
];

export default function Ifrs9PolicyWorkspacePage() {
  const [owner, setOwner] = useState(defaultPolicy.owner);
  const [evidenceReference, setEvidenceReference] = useState("");
  const { data, isLoading } = useQuery<Workspace>({ queryKey: ["/api/ifrs9/policy-workspace"] });
  const submit = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ifrs9/policy-workspace", { policy: { ...defaultPolicy, owner }, scenarios, evidenceReference });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/ifrs9/policy-workspace"] }),
  });

  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8" data-testid="ifrs9-policy-workspace">
    <header className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
      <div className="flex items-center gap-2 text-primary"><Landmark className="size-5" /><p className="text-xs font-semibold uppercase tracking-widest">IFRS 9 governance workspace</p></div>
      <h1 className="mt-3 text-3xl font-bold">Approve policy before calculating ECL</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">UCH can calculate transparent draft ECL only from a bank-approved policy. It cannot post provisions, alter interest recognition, or create a general-ledger journal.</p>
    </header>

    <section className="grid gap-4 md:grid-cols-2">
      <Card data-testid="ifrs9-active-policy"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600" />Active approved policy</CardTitle><CardDescription>Only an independently approved policy can be used for a draft ECL request.</CardDescription></CardHeader><CardContent>{isLoading ? <p className="text-muted-foreground">Checking governed policy status…</p> : data?.active ? <div className="space-y-2"><Badge className="bg-emerald-600">Approved</Badge><p className="font-semibold">{data.active.policy.id} · {data.active.policy.version}</p><p className="text-sm text-muted-foreground">Effective {new Date(data.active.policy.effectiveDate).toLocaleDateString()} · owner: {data.active.policy.owner}</p><p className="text-sm text-muted-foreground">Evidence: {data.active.evidenceReference}</p></div> : <p className="text-sm text-amber-700 dark:text-amber-400">No policy is approved for this organisation and country. Draft ECL is intentionally blocked.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Pending approvals</CardTitle><CardDescription>Maker–checker prevents the author from activating their own provisioning policy.</CardDescription></CardHeader><CardContent>{data?.pending?.length ? <ul className="space-y-3">{data.pending.map((item) => <li key={item.approvalId} className="rounded-lg border p-3 text-sm"><p className="font-medium">{item.policy.id} · {item.policy.version}</p><p className="text-muted-foreground">Owner: {item.policy.owner} · evidence: {item.evidenceReference}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No policy awaiting review.</p>}</CardContent></Card>
    </section>

    <Card data-testid="ifrs9-policy-submit"><CardHeader><CardTitle>Submit a bank policy for independent review</CardTitle><CardDescription>The values below are a Ghana working template—not an approved UCH policy. Replace the owner, model version, thresholds, scenarios and evidence reference with the bank’s signed methodology before submitting.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="ifrs9-owner">Policy owner</Label><Input id="ifrs9-owner" value={owner} onChange={(event) => setOwner(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="ifrs9-evidence">Approval / methodology evidence reference</Label><Input id="ifrs9-evidence" placeholder="e.g. BRC-2026-014 / signed policy repository" value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} /></div></div><div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">Template thresholds: SICR {defaultPolicy.sicrDaysPastDue} DPD · default {defaultPolicy.defaultDaysPastDue} DPD · cure {defaultPolicy.cureMonthsRequired} months. Scenarios: base 60%, downside 40%. These remain draft until a different authorised checker approves them.</div>{submit.isError && <p className="text-sm text-destructive">{submit.error.message}</p>}{submit.isSuccess && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Submitted for independent approval.</p>}<div className="flex flex-wrap gap-3"><Button disabled={!evidenceReference.trim() || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? "Submitting…" : "Submit for approval"}</Button><Link href="/approvals"><Button variant="outline">Open approvals</Button></Link><Link href="/npl-early-warning"><Button variant="outline">Back to NPL desk</Button></Link></div></CardContent></Card>
  </main>;
}
