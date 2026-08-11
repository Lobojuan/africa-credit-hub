import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileCheck2, Scale, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Decision = {
  id: string; decisionType: string; status: string; proposedAmount?: string; effectiveDate: string; rationale: string;
  policyReference: string; evidenceReference: string; requestedBy: string; requestedByName?: string; reviewedByName?: string;
  reviewNotes?: string; executionEvidenceReference?: string; executionNotes?: string; executedByName?: string; createdAt: string;
};

type DecisionResponse = {
  case: { id: string; creditAccountId: string; accountNumber: string; borrowerName: string; currentExposure: string; currency: string; stage: string; status: string };
  decisions: Decision[];
  boundary: string;
};

const currentDate = new Date().toISOString().slice(0, 10);
const labels: Record<string, string> = { restructure: "Restructure", cure_reage: "Cure / re-age", write_off: "Write-off" };

export default function NplDecisionGovernancePage() {
  const caseId = new URLSearchParams(window.location.search).get("caseId") || "";
  const endpoint = `/api/npl-cases/${caseId}/decisions`;
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposal, setProposal] = useState({ decisionType: "restructure", proposedAmount: "", effectiveDate: currentDate, rationale: "", policyReference: "", evidenceReference: "" });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<Record<string, { evidence: string; notes: string }>>({});
  const { data, isLoading } = useQuery<DecisionResponse>({ queryKey: [endpoint], enabled: Boolean(caseId) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [endpoint] });
    queryClient.invalidateQueries({ queryKey: [`/api/npl-cases/${caseId}/events`] });
  };

  const submit = useMutation({
    mutationFn: async () => {
      const body = { ...proposal, proposedAmount: proposal.decisionType === "cure_reage" || !proposal.proposedAmount ? undefined : proposal.proposedAmount };
      return (await apiRequest("POST", endpoint, body)).json();
    },
    onSuccess: () => { refresh(); setProposal((value) => ({ ...value, proposedAmount: "", rationale: "", policyReference: "", evidenceReference: "" })); toast({ title: "Decision submitted", description: "A different authorised checker must review it." }); },
    onError: (error: Error) => toast({ title: "Proposal not submitted", description: error.message, variant: "destructive" }),
  });

  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => (await apiRequest("POST", `/api/npl-decisions/${id}/review`, { decision, reviewNotes: reviewNotes[id] || "" })).json(),
    onSuccess: (_, input) => { refresh(); toast({ title: `Decision ${input.decision}`, description: "The independent review was appended to the immutable case chronology." }); },
    onError: (error: Error) => toast({ title: "Review not recorded", description: error.message, variant: "destructive" }),
  });

  const recordExecution = useMutation({
    mutationFn: async (id: string) => (await apiRequest("POST", `/api/npl-decisions/${id}/execution`, { executionDate: currentDate, executionEvidenceReference: execution[id]?.evidence || "", executionNotes: execution[id]?.notes || "" })).json(),
    onSuccess: () => { refresh(); toast({ title: "Execution evidence recorded", description: "Credit-account and accounting reconciliation remain required." }); },
    onError: (error: Error) => toast({ title: "Execution not recorded", description: error.message, variant: "destructive" }),
  });

  if (!caseId) return <main className="p-8"><Card><CardHeader><CardTitle>Select an NPL case first</CardTitle></CardHeader><CardContent><Link href="/npl-case-ledger"><Button>Open case ledger</Button></Link></CardContent></Card></main>;

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="npl-decision-governance-page">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Four-eyes remediation control</p><h1 className="mt-2 text-3xl font-bold">NPL Decision Governance</h1><p className="mt-2 text-muted-foreground">{isLoading ? "Loading case…" : `${data?.case.borrowerName || "Borrower"} · ${data?.case.accountNumber || ""}`}</p></div><Link href={`/npl-case-ledger?creditAccountId=${encodeURIComponent(data?.case.creditAccountId || "")}`}><Button variant="outline" className="gap-2"><ArrowLeft className="size-4" />Case ledger</Button></Link></header>

    <Card className="border-primary/20 bg-primary/5" data-testid="npl-decision-safety-boundary"><CardContent className="grid gap-4 p-5 md:grid-cols-3"><div><p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" />Independent checker</p><p className="text-sm text-muted-foreground">The maker can never approve their own proposal.</p></div><div><p className="flex items-center gap-2 font-semibold"><Scale className="size-4" />No silent accounting</p><p className="text-sm text-muted-foreground">Approval does not change the credit account, IFRS 9 stage, provision or GL.</p></div><div><p className="flex items-center gap-2 font-semibold"><FileCheck2 className="size-4" />Execution evidence</p><p className="text-sm text-muted-foreground">Bank execution needs a dated source reference and later reconciliation.</p></div></CardContent></Card>

    {data?.case && <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Facility</p><p className="font-semibold">{data.case.accountNumber}</p></div><div><p className="text-xs text-muted-foreground">Exposure</p><p className="font-semibold">{data.case.currency} {Number(data.case.currentExposure).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div><div><p className="text-xs text-muted-foreground">Case stage</p><Badge variant="outline">{data.case.stage}</Badge></div><div><p className="text-xs text-muted-foreground">Boundary</p><p className="text-xs">{data.boundary}</p></div></CardContent></Card>}

    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"><Card data-testid="npl-decision-proposal-form"><CardHeader><CardTitle>Submit remediation proposal</CardTitle><CardDescription>Policy, evidence and rationale are mandatory before checker review.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label>Decision</Label><Select value={proposal.decisionType} onValueChange={(decisionType) => setProposal({ ...proposal, decisionType, proposedAmount: decisionType === "cure_reage" ? "" : proposal.proposedAmount })}><SelectTrigger data-testid="npl-decision-type"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>{proposal.decisionType !== "cure_reage" && <div><Label htmlFor="decision-amount">Proposed affected amount ({data?.case.currency || "currency"}){proposal.decisionType === "write_off" ? " (required)" : ""}</Label><Input id="decision-amount" type="number" min="0.01" step="0.01" value={proposal.proposedAmount} onChange={(event) => setProposal({ ...proposal, proposedAmount: event.target.value })} /></div>}<div><Label htmlFor="decision-effective">Proposed effective date</Label><Input id="decision-effective" type="date" min={currentDate} value={proposal.effectiveDate} onChange={(event) => setProposal({ ...proposal, effectiveDate: event.target.value })} /></div><div><Label htmlFor="decision-policy">Policy / committee mandate</Label><Input id="decision-policy" value={proposal.policyReference} onChange={(event) => setProposal({ ...proposal, policyReference: event.target.value })} /></div><div><Label htmlFor="decision-evidence">Source evidence reference</Label><Input id="decision-evidence" value={proposal.evidenceReference} onChange={(event) => setProposal({ ...proposal, evidenceReference: event.target.value })} /></div><div><Label htmlFor="decision-rationale">Rationale</Label><Textarea id="decision-rationale" value={proposal.rationale} onChange={(event) => setProposal({ ...proposal, rationale: event.target.value })} /></div><Button data-testid="submit-npl-decision" onClick={() => submit.mutate()} disabled={submit.isPending || proposal.rationale.length < 20 || proposal.policyReference.length < 3 || proposal.evidenceReference.length < 3 || (proposal.decisionType === "write_off" && !proposal.proposedAmount)}>Submit for independent review</Button></CardContent></Card>

      <Card data-testid="npl-decision-register"><CardHeader><CardTitle>Decision register</CardTitle><CardDescription>{data?.decisions.length || 0} governed proposal{data?.decisions.length === 1 ? "" : "s"}</CardDescription></CardHeader><CardContent className="space-y-4">{data?.decisions.map((item) => <div key={item.id} className="rounded-xl border p-4" data-testid={`npl-decision-${item.id}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{labels[item.decisionType] || item.decisionType}</p><p className="text-xs text-muted-foreground">Maker {item.requestedByName || item.requestedBy} · effective {item.effectiveDate}</p></div><Badge variant={item.status === "rejected" ? "destructive" : item.status === "approved" || item.status === "execution_recorded" ? "default" : "outline"}>{item.status.replaceAll("_", " ")}</Badge></div>{item.proposedAmount && <p className="mt-2 font-semibold">{data.case.currency} {Number(item.proposedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>}<p className="mt-2 text-sm">{item.rationale}</p><p className="mt-2 text-xs text-muted-foreground">Policy {item.policyReference} · evidence {item.evidenceReference}</p>{item.reviewedByName && <p className="mt-2 text-xs">Checker {item.reviewedByName}: {item.reviewNotes}</p>}{item.status === "pending" && item.requestedBy === user?.id && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Awaiting a different authorised checker.</p>}{item.status === "pending" && item.requestedBy !== user?.id && <div className="mt-4 space-y-3"><Textarea aria-label={`Review notes ${item.id}`} placeholder="Independent checker rationale" value={reviewNotes[item.id] || ""} onChange={(event) => setReviewNotes({ ...reviewNotes, [item.id]: event.target.value })} /><div className="flex gap-2"><Button size="sm" className="gap-1" disabled={(reviewNotes[item.id] || "").length < 10 || review.isPending} onClick={() => review.mutate({ id: item.id, decision: "approved" })} data-testid={`approve-npl-decision-${item.id}`}><CheckCircle2 className="size-4" />Approve</Button><Button size="sm" variant="destructive" className="gap-1" disabled={(reviewNotes[item.id] || "").length < 10 || review.isPending} onClick={() => review.mutate({ id: item.id, decision: "rejected" })}><XCircle className="size-4" />Reject</Button></div></div>}{item.status === "approved" && <div className="mt-4 space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-sm font-semibold">Record bank execution evidence</p><Input aria-label={`Execution evidence ${item.id}`} placeholder="Core/committee/GL reference" value={execution[item.id]?.evidence || ""} onChange={(event) => setExecution({ ...execution, [item.id]: { evidence: event.target.value, notes: execution[item.id]?.notes || "" } })} /><Textarea aria-label={`Execution notes ${item.id}`} placeholder="What the bank executed; reconciliation remains required" value={execution[item.id]?.notes || ""} onChange={(event) => setExecution({ ...execution, [item.id]: { evidence: execution[item.id]?.evidence || "", notes: event.target.value } })} /><Button size="sm" disabled={(execution[item.id]?.evidence || "").length < 3 || (execution[item.id]?.notes || "").length < 10 || recordExecution.isPending} onClick={() => recordExecution.mutate(item.id)} data-testid={`execute-npl-decision-${item.id}`}>Record execution evidence</Button></div>}{item.status === "execution_recorded" && <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800">Execution evidence {item.executionEvidenceReference} recorded by {item.executedByName || "bank operator"}. Reconcile the authoritative account and accounting records next.</p>}</div>)}{!isLoading && !data?.decisions.length && <p className="py-8 text-center text-sm text-muted-foreground">No remediation proposals have been submitted for this case.</p>}</CardContent></Card></section>
  </main>;
}
