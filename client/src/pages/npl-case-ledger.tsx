import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenCheck, CalendarRange, CheckCircle2, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type NplCase = {
  id: string; creditAccountId: string; borrowerId: string; collectionAssignmentId?: string; stage: string; status: string;
  baselineExposure: string; currentExposure: string; currency: string; ownerName?: string; accountNumber: string;
  borrowerName: string; eventCount: number; lastEventDate: string; openedAt: string;
};

type NplEvent = {
  id: string; sequence: number; eventType: string; eventDate: string; amount?: string; exposureBefore: string;
  exposureAfter: string; stageBefore: string; stageAfter: string; evidenceReference?: string; notes: string; createdByName?: string;
};

type Waterfall = {
  period: { start: string; end: string }; consolidated: boolean; methodology: string;
  series: Array<{ currency: string; openingExposure: string; observedInflows: string; observedCashRecoveries: string; observedLegalRecoveries: string; closingExposure: string; reconciliationDifference: string; reconciled: boolean; authoritativeCreditExposure: string | null; authoritativeDifference: string | null; authoritativeReconciled: boolean | null }>;
};

const eventLabels: Record<string, string> = {
  npl_inflow_observed: "Observed NPL inflow",
  cash_recovery_observed: "Observed cash recovery",
  legal_recovery_observed: "Observed legal recovery",
  workflow_stage_changed: "Workflow stage changed",
  collection_activity_linked: "Link Collections activity",
  note: "Case note",
  case_opened: "Case opened",
};

const financialEvents = new Set(["npl_inflow_observed", "cash_recovery_observed", "legal_recovery_observed"]);
const today = new Date().toISOString().slice(0, 10);

function money(currency: string, value: string) {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function NplCaseLedgerPage() {
  const { toast } = useToast();
  const accountId = new URLSearchParams(window.location.search).get("creditAccountId") || "";
  const [period, setPeriod] = useState({ start: `${today.slice(0, 7)}-01`, end: today });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState({ evidenceReference: "", notes: "" });
  const [eventForm, setEventForm] = useState({ eventType: "note", eventDate: today, amount: "", stageAfter: "npl", evidenceReference: "", notes: "" });

  const casesUrl = accountId ? `/api/npl-cases?creditAccountId=${encodeURIComponent(accountId)}` : "/api/npl-cases";
  const { data: cases = [], isLoading } = useQuery<NplCase[]>({ queryKey: [casesUrl] });
  useEffect(() => { if (!selectedCaseId && cases[0]) setSelectedCaseId(cases[0].id); }, [cases, selectedCaseId]);
  const selectedCase = cases.find((item) => item.id === selectedCaseId) || cases[0];
  const { data: events = [] } = useQuery<NplEvent[]>({ queryKey: [`/api/npl-cases/${selectedCaseId}/events`], enabled: Boolean(selectedCaseId) });
  const waterfallUrl = `/api/npl-cases/waterfall/summary?start=${period.start}&end=${period.end}`;
  const { data: waterfall } = useQuery<Waterfall>({ queryKey: [waterfallUrl] });

  const openCase = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/npl-cases", { creditAccountId: accountId, openedDate: today, ...openForm });
      return response.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [casesUrl] });
      queryClient.invalidateQueries({ queryKey: [waterfallUrl] });
      setSelectedCaseId(created.id);
      toast({ title: "NPL case opened", description: "The baseline exposure and immutable opening event are now recorded." });
    },
    onError: (error: Error) => toast({ title: "Case not opened", description: error.message, variant: "destructive" }),
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      if (!selectedCase) throw new Error("Select an NPL case");
      const body: Record<string, unknown> = { eventType: eventForm.eventType, eventDate: eventForm.eventDate, evidenceReference: eventForm.evidenceReference || undefined, notes: eventForm.notes };
      if (financialEvents.has(eventForm.eventType)) body.amount = eventForm.amount;
      if (eventForm.eventType === "workflow_stage_changed") body.stageAfter = eventForm.stageAfter;
      const response = await apiRequest("POST", `/api/npl-cases/${selectedCase.id}/events`, body);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [casesUrl] });
      queryClient.invalidateQueries({ queryKey: [`/api/npl-cases/${selectedCaseId}/events`] });
      queryClient.invalidateQueries({ queryKey: [waterfallUrl] });
      setEventForm((value) => ({ ...value, amount: "", evidenceReference: "", notes: "" }));
      toast({ title: "Immutable event appended", description: "The exposure projection and case chronology were updated together." });
    },
    onError: (error: Error) => toast({ title: "Event not recorded", description: error.message, variant: "destructive" }),
  });

  const maxExposure = useMemo(() => Math.max(1, ...(waterfall?.series.flatMap((item) => [Number(item.openingExposure), Number(item.closingExposure), Number(item.observedInflows)]) || [1])), [waterfall]);

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="npl-case-ledger-page">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Observed remediation evidence</p><h1 className="mt-2 text-3xl font-bold tracking-tight">NPL Case Ledger & Exposure Waterfall</h1><p className="mt-2 max-w-3xl text-muted-foreground">Follow each at-risk facility through an append-only chronology while keeping Collections, accounting decisions and regulatory classification under their existing governed owners.</p></div><div className="flex gap-2"><Link href="/npl-early-warning"><Button variant="outline" className="gap-2"><ArrowLeft className="size-4" />NPL desk</Button></Link><Link href="/collections"><Button variant="outline">Collections</Button></Link></div></header>

    <Card className="border-primary/20 bg-primary/5" data-testid="npl-ledger-safety-boundary"><CardContent className="grid gap-4 p-5 md:grid-cols-3"><div><p className="font-semibold">Append-only evidence</p><p className="text-sm text-muted-foreground">Database controls reject updates and deletes to case events.</p></div><div><p className="font-semibold">Observed movement only</p><p className="text-sm text-muted-foreground">Recoveries and inflows require a dated source reference; they are not autonomous bank decisions.</p></div><div><p className="font-semibold">No false FX total</p><p className="text-sm text-muted-foreground">The waterfall remains separate by currency until the bank approves conversion controls.</p></div></CardContent></Card>

    <Card data-testid="npl-exposure-waterfall"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Scale className="size-5 text-primary" />Observed exposure waterfall</CardTitle><CardDescription>{waterfall?.methodology || "Loading controlled case movements…"}</CardDescription></div><div className="flex gap-2"><div><Label htmlFor="waterfall-start">From</Label><Input id="waterfall-start" type="date" value={period.start} onChange={(event) => setPeriod({ ...period, start: event.target.value })} /></div><div><Label htmlFor="waterfall-end">To</Label><Input id="waterfall-end" type="date" value={period.end} onChange={(event) => setPeriod({ ...period, end: event.target.value })} /></div></div></div></CardHeader><CardContent className="space-y-5">{waterfall?.series.length ? waterfall.series.map((item) => <div key={item.currency} className="rounded-xl border p-4" data-testid={`waterfall-${item.currency}`}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{item.currency} movement</p><div className="flex gap-2"><Badge variant="outline" className={item.reconciled ? "border-emerald-500/30 text-emerald-700" : "border-red-500/30 text-red-700"}>{item.reconciled ? "Ledger reconciled" : `Ledger difference ${item.reconciliationDifference}`}</Badge><Badge variant="outline" className={item.authoritativeReconciled ? "border-emerald-500/30 text-emerald-700" : "border-amber-500/30 text-amber-700"}>{item.authoritativeReconciled ? "Credit account matched" : `Account difference ${item.authoritativeDifference}`}</Badge></div></div><div className="grid gap-3 sm:grid-cols-6"><div><p className="text-xs text-muted-foreground">Opening</p><p className="font-semibold">{money(item.currency, item.openingExposure)}</p></div><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="size-3 text-red-600" />Inflows</p><p className="font-semibold text-red-700">+{money(item.currency, item.observedInflows)}</p></div><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingDown className="size-3 text-emerald-600" />Cash</p><p className="font-semibold text-emerald-700">−{money(item.currency, item.observedCashRecoveries)}</p></div><div><p className="text-xs text-muted-foreground">Legal recovery</p><p className="font-semibold text-emerald-700">−{money(item.currency, item.observedLegalRecoveries)}</p></div><div><p className="text-xs text-muted-foreground">Ledger closing</p><p className="font-semibold">{money(item.currency, item.closingExposure)}</p></div><div><p className="text-xs text-muted-foreground">Credit accounts now</p><p className="font-semibold">{money(item.currency, item.authoritativeCreditExposure || "0")}</p></div></div><div className="mt-4 flex h-3 gap-1 overflow-hidden rounded-full bg-muted"><span className="bg-slate-500" style={{ width: `${Math.max(1, Number(item.openingExposure) / maxExposure * 100)}%` }} /><span className="bg-red-500" style={{ width: `${Number(item.observedInflows) / maxExposure * 100}%` }} /><span className="bg-emerald-500" style={{ width: `${Number(item.observedCashRecoveries) / maxExposure * 100}%` }} /></div></div>) : <p className="py-6 text-center text-sm text-muted-foreground">No governed NPL cases exist in this scope and period yet.</p>}</CardContent></Card>

    {accountId && !isLoading && cases.length === 0 && <Card data-testid="open-npl-case-form"><CardHeader><CardTitle>Open the controlled case</CardTitle><CardDescription>This facility has no NPL ledger yet. Its current credit-account balance becomes the immutable baseline.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="case-evidence">Opening evidence reference</Label><Input id="case-evidence" value={openForm.evidenceReference} onChange={(event) => setOpenForm({ ...openForm, evidenceReference: event.target.value })} placeholder="Loan-tape run, signed control total or committee reference" /></div><div><Label htmlFor="case-notes">Opening rationale</Label><Textarea id="case-notes" value={openForm.notes} onChange={(event) => setOpenForm({ ...openForm, notes: event.target.value })} placeholder="Explain the controlled watchlist/NPL entry evidence" /></div><Button onClick={() => openCase.mutate()} disabled={openCase.isPending || openForm.evidenceReference.length < 3 || openForm.notes.length < 10} data-testid="open-npl-case">Open append-only case</Button></CardContent></Card>}

    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><Card data-testid="npl-case-register"><CardHeader><CardTitle>Case register</CardTitle><CardDescription>{isLoading ? "Loading…" : `${cases.length} facility case${cases.length === 1 ? "" : "s"} in this view`}</CardDescription></CardHeader><CardContent className="space-y-2">{cases.map((item) => <button type="button" key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`w-full rounded-lg border p-4 text-left hover:bg-muted/40 ${selectedCase?.id === item.id ? "border-primary bg-primary/5" : ""}`}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{item.borrowerName || "Unnamed borrower"}</p><p className="text-sm text-muted-foreground">{item.accountNumber} · {item.eventCount} events</p></div><Badge variant="outline">{item.stage}</Badge></div><p className="mt-3 text-lg font-semibold">{money(item.currency, item.currentExposure)}</p><p className="text-xs text-muted-foreground">Baseline {money(item.currency, item.baselineExposure)} · last {item.lastEventDate}</p></button>)}</CardContent></Card>

      <div className="space-y-6">{selectedCase && <Card className="border-primary/20" data-testid="npl-decision-governance-link"><CardHeader><CardTitle>Remediation decision governance</CardTitle><CardDescription>Route restructuring, cure/re-age and write-off proposals through independent maker-checker review before bank execution.</CardDescription></CardHeader><CardContent><Link href={`/npl-decision-governance?caseId=${encodeURIComponent(selectedCase.id)}`}><Button data-testid="open-npl-decision-governance">Open decision governance</Button></Link></CardContent></Card>}{selectedCase && <Card data-testid="append-npl-event-form"><CardHeader><CardTitle>Append observed event</CardTitle><CardDescription>{selectedCase.accountNumber} · Current projection {money(selectedCase.currency, selectedCase.currentExposure)}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Event</Label><Select value={eventForm.eventType} onValueChange={(eventType) => setEventForm({ ...eventForm, eventType })}><SelectTrigger data-testid="npl-event-type"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(eventLabels).filter(([value]) => value !== "case_opened").map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="npl-event-date">Evidence date</Label><Input id="npl-event-date" type="date" max={today} value={eventForm.eventDate} onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })} /></div></div>{financialEvents.has(eventForm.eventType) && <div><Label htmlFor="npl-event-amount">Observed amount ({selectedCase.currency})</Label><Input id="npl-event-amount" type="number" min="0.01" step="0.01" value={eventForm.amount} onChange={(event) => setEventForm({ ...eventForm, amount: event.target.value })} /></div>}{eventForm.eventType === "workflow_stage_changed" && <div><Label>Workflow stage</Label><Select value={eventForm.stageAfter} onValueChange={(stageAfter) => setEventForm({ ...eventForm, stageAfter })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["watchlist", "npl", "workout", "legal", "resolved"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>}<div><Label htmlFor="npl-event-evidence">Evidence reference{(financialEvents.has(eventForm.eventType) || eventForm.eventType === "collection_activity_linked") ? " (required)" : ""}</Label><Input id="npl-event-evidence" value={eventForm.evidenceReference} onChange={(event) => setEventForm({ ...eventForm, evidenceReference: event.target.value })} placeholder={eventForm.eventType === "collection_activity_linked" ? "Collections assignment ID" : "Core, receipt, GL or committee reference"} /></div><div><Label htmlFor="npl-event-notes">Evidence note</Label><Textarea id="npl-event-notes" value={eventForm.notes} onChange={(event) => setEventForm({ ...eventForm, notes: event.target.value })} /></div><Button onClick={() => addEvent.mutate()} disabled={addEvent.isPending || eventForm.notes.length < 10 || (financialEvents.has(eventForm.eventType) && (!eventForm.amount || !eventForm.evidenceReference))} data-testid="append-npl-event">Append immutable event</Button></CardContent></Card>}

      {selectedCase && <Card data-testid="npl-event-timeline"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" />Immutable chronology</CardTitle><CardDescription>Newest first. Corrections are appended as new evidence; prior events are never overwritten.</CardDescription></CardHeader><CardContent className="space-y-3">{events.map((event) => <div key={event.id} className="relative border-l-2 border-primary/20 pl-4"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-primary" /><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">#{event.sequence} {eventLabels[event.eventType] || event.eventType}</p><Badge variant="outline">{event.eventDate}</Badge>{event.amount && <Badge variant="secondary">{money(selectedCase.currency, event.amount)}</Badge>}</div><p className="mt-1 text-sm">{event.notes}</p><p className="mt-1 text-xs text-muted-foreground">Exposure {money(selectedCase.currency, event.exposureBefore)} → {money(selectedCase.currency, event.exposureAfter)} · {event.stageBefore} → {event.stageAfter}{event.evidenceReference ? ` · evidence ${event.evidenceReference}` : ""}</p></div>)}</CardContent></Card>}</div></section>
  </main>;
}
