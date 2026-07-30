import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardCheck,
  CreditCard, FileSearch, FileText, Landmark, LockKeyhole, Radar,
  ShieldAlert, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Scenario = {
  id: "whole" | "npl" | "consent" | "operations" | "reporting" | "credit";
  title: string;
  shortTitle: string;
  description: string;
  signal: string;
  impact: string;
  finding: string;
  action: string;
  result: string;
  href: string;
  icon: typeof Radar;
  tone: string;
};

const scenarios: Scenario[] = [
  { id: "npl", title: "Stop loans becoming NPLs", shortTitle: "NPL & IFRS 9", description: "Explore an early-warning queue, data-readiness checks and a governed IFRS 9 work path.", signal: "12 facilities deteriorating", impact: "GH¢18.4m exposure needs review", finding: "Arrears, restructures and missing payment dates weaken early intervention.", action: "Validate the loan tape, assign an owner and back-test the warning rules.", result: "A bank-owned NPL reduction pilot with baseline, target and monthly evidence.", href: "/npl-early-warning", icon: Radar, tone: "bg-amber-500/10 text-amber-700" },
  { id: "consent", title: "Prove consent and collateral controls", shortTitle: "Consent & collateral", description: "See how sensitive actions, documents and secured interests are evidenced and reviewed.", signal: "8 evidence exceptions", impact: "3 actions need consent review", finding: "Consent scope, document evidence and collateral references do not reconcile consistently.", action: "Confirm purpose, owner and approval trail before sensitive action is allowed.", result: "A traceable exception register and a remediation plan for control owners.", href: "/consent", icon: ShieldCheck, tone: "bg-violet-500/10 text-violet-700" },
  { id: "operations", title: "Resolve fraud and failed transactions", shortTitle: "Fraud & resolution", description: "Trace a customer issue from alert to evidence, accountable review and bank-approved outcome.", signal: "34 cases beyond SLA", impact: "6 high-priority exceptions", finding: "Channel evidence and resolution ownership are fragmented across operations teams.", action: "Reconcile the event, route only genuine exceptions to people and retain the decision trail.", result: "A resolution-first pilot with a measurable SLA and no autonomous reversal.", href: "/transaction-resolution", icon: ShieldAlert, tone: "bg-rose-500/10 text-rose-700" },
  { id: "reporting", title: "Make reporting evidence-ready", shortTitle: "Reporting & prudential", description: "Identify gaps in data quality, concentration oversight, filing calendars and review evidence.", signal: "5 control gaps", impact: "2 evidence packs incomplete", finding: "Data validation and independent review happen too late in the reporting cycle.", action: "Map each return to source data, validation rules, owner, deadline and evidence.", result: "A bank-owned reporting control plan; no automatic regulator submission.", href: "/regulatory-evidence-packs", icon: Landmark, tone: "bg-emerald-500/10 text-emerald-700" },
  { id: "credit", title: "See the core Credit Hub", shortTitle: "Credit intelligence", description: "Walk through borrower, credit-account, affordability and reasoned credit-review capabilities.", signal: "4 decision inputs missing", impact: "Thin-file review incomplete", finding: "Credit decisions need consented evidence, explainable scoring and an accountable officer review.", action: "Complete the evidence profile, score within policy and preserve the human decision.", result: "A controlled credit-intelligence pilot for one agreed lending segment.", href: "/credit", icon: CreditCard, tone: "bg-sky-500/10 text-sky-700" },
];

const wholeBankScenario: Scenario = {
  id: "whole",
  title: "Improve the whole bank",
  shortTitle: "Whole-bank transformation",
  description: "See every UCH workstream as one sequenced management diagnostic and remediation programme.",
  signal: "5 connected workstreams",
  impact: "One management risk view",
  finding: "Credit risk, customer operations, consent, collateral and reporting controls share data, ownership and evidence dependencies. Improving one in isolation can leave the wider control gap open.",
  action: "Run a bank-wide, file-first management diagnostic, validate findings with each accountable executive and sequence the remedies by risk and dependency.",
  result: "A phased 90-day plan: stabilise data and evidence first, prove high-value controls next, then integrate bank-approved workflows.",
  href: "/bank-risk-diagnostic",
  icon: Building2,
  tone: "bg-primary/10 text-primary",
};

const demoScenarios = [wholeBankScenario, ...scenarios];

export default function DemoBoardPage() {
  const [selectedId, setSelectedId] = useState<Scenario["id"]>("whole");
  const [reportOpen, setReportOpen] = useState(false);
  const [name, setName] = useState("");
  const selected = useMemo(() => demoScenarios.find((scenario) => scenario.id === selectedId)!, [selectedId]);
  const Icon = selected.icon;

  return <main className="min-h-screen bg-muted/20" data-testid="public-demo-board">
    <header className="border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span>Universal Credit Hub</Link>
        <div className="flex items-center gap-2"><Badge variant="outline" className="hidden sm:inline-flex">Synthetic demo environment</Badge><Link href="/contact-sales"><Button size="sm">Talk to our team <ArrowRight className="size-4" /></Button></Link></div>
      </div>
    </header>

    <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <Badge variant="outline" className="border-primary/30 bg-background">No registration required</Badge>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">Choose the banking problem. See the controlled fix.</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground md:text-lg">Start with one banking problem—or choose the whole-bank path. This interactive board uses fictional data to demonstrate how UCH identifies risk, preserves evidence and turns accepted gaps into a bank-owned remediation or pilot. It is not a live bank environment, audit or regulatory filing.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs"><span className="rounded-full border bg-background px-3 py-1.5">No real customer data</span><span className="rounded-full border bg-background px-3 py-1.5">No production actions</span><span className="rounded-full border bg-background px-3 py-1.5">Management diagnostic, not certification</span></div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8" aria-labelledby="demo-scenarios-title">
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Interactive scenarios</p><h2 id="demo-scenarios-title" className="text-2xl font-bold">What would you like to improve?</h2></div><Badge variant="secondary">Whole bank + 5 UCH workstreams</Badge></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {demoScenarios.map((scenario) => { const ScenarioIcon = scenario.icon; const isSelected = scenario.id === selectedId; return <button type="button" key={scenario.id} onClick={() => setSelectedId(scenario.id)} className={`rounded-xl border bg-card p-4 text-left transition ${isSelected ? "border-primary ring-2 ring-primary/15" : "hover:border-primary/40"}`} data-testid={`demo-scenario-${scenario.id}`}><span className={`mb-3 flex size-9 items-center justify-center rounded-lg ${scenario.tone}`}><ScenarioIcon className="size-4" /></span><p className="text-sm font-semibold">{scenario.shortTitle}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{scenario.description}</p></button>; })}
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 md:grid-cols-[1.4fr_.9fr] md:px-8">
      <Card className="overflow-hidden" data-testid="demo-scenario-workspace">
        <CardHeader className="border-b bg-card"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className={`flex size-11 items-center justify-center rounded-xl ${selected.tone}`}><Icon className="size-5" /></span><div><CardTitle>{selected.title}</CardTitle><CardDescription className="mt-1">Synthetic scenario — fictional data only</CardDescription></div></div><Badge variant="outline">Demo mode</Badge></div></CardHeader>
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-muted/40 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signal</p><p className="mt-2 font-semibold">{selected.signal}</p></div><div className="rounded-xl border bg-muted/40 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Management impact</p><p className="mt-2 font-semibold">{selected.impact}</p></div><div className="rounded-xl border bg-muted/40 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Control status</p><p className="mt-2 font-semibold text-amber-700">Needs bank review</p></div></div>
          <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4"><p className="flex items-center gap-2 font-semibold"><FileSearch className="size-4 text-primary" />What UCH finds</p><p className="mt-2 text-sm text-muted-foreground">{selected.finding}</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-4"><p className="flex items-center gap-2 font-semibold"><ClipboardCheck className="size-4 text-primary" />Controlled next action</p><p className="mt-2 text-sm text-muted-foreground">{selected.action}</p></div><div className="rounded-xl border p-4"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-emerald-600" />If the bank proceeds</p><p className="mt-2 text-sm text-muted-foreground">{selected.result}</p></div></div>
          {selected.id === "whole" && <div className="grid gap-2 rounded-xl border bg-muted/30 p-4 sm:grid-cols-5" data-testid="whole-bank-workstreams">{scenarios.map((scenario) => <div key={scenario.id} className="rounded-lg bg-background p-2 text-center text-xs font-medium">{scenario.shortTitle}</div>)}</div>}
          <div className="flex flex-wrap gap-3"><Button onClick={() => setReportOpen(true)} data-testid="button-open-virtual-report"><FileText className="size-4" />Create virtual management report</Button><Link href={selected.href}><Button variant="outline">Explore related UCH workspace <ArrowRight className="size-4" /></Button></Link></div>
        </CardContent>
      </Card>

      <Card className="border-primary/20" data-testid="demo-next-steps"><CardHeader><Sparkles className="mb-2 size-5 text-primary" /><CardTitle>From demo to bank outcome</CardTitle><CardDescription>UCH only proceeds after the bank approves the engagement, scope and data boundary.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex gap-3"><span className="font-bold text-primary">1</span><p><strong>Paid management diagnostic.</strong> File-first, read-only assessment with named owners.</p></div><div className="flex gap-3"><span className="font-bold text-primary">2</span><p><strong>Bank validates findings.</strong> Evidence, severity and assumptions are reviewed before reporting.</p></div><div className="flex gap-3"><span className="font-bold text-primary">3</span><p><strong>Measured pilot.</strong> Agreed baseline, target and acceptance test—not a vague promise.</p></div><div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground"><LockKeyhole className="mr-1 inline size-3" />No server access, live holds, reversals, accounting posts or regulator submissions are enabled by this demo.</div><Link href="/contact-sales"><Button variant="outline" className="w-full">Book a management diagnostic <ArrowRight className="size-4" /></Button></Link></CardContent></Card>
    </section>

    {reportOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Virtual management report" data-testid="virtual-management-report"><div className="mx-auto my-6 max-w-2xl rounded-2xl bg-background shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><Badge variant="outline">Synthetic preview</Badge><h2 className="mt-2 text-xl font-bold">UCH Management Diagnostic — virtual report</h2></div><Button variant="ghost" size="icon" onClick={() => setReportOpen(false)} aria-label="Close report"><X className="size-5" /></Button></div><div className="space-y-5 p-5"><div className="grid gap-3 sm:grid-cols-2"><div><label className="text-sm font-medium" htmlFor="demo-report-name">Bank or team name</label><Input id="demo-report-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example Bank" /></div><div className="rounded-lg bg-muted p-3 text-sm"><p className="text-muted-foreground">Assessment focus</p><p className="mt-1 font-semibold">{selected.shortTitle}</p></div></div><div className="rounded-xl border p-4"><p className="font-semibold">Draft finding</p><p className="mt-2 text-sm text-muted-foreground">{selected.finding}</p></div><div className="rounded-xl border p-4"><p className="font-semibold">Recommended controlled next step</p><p className="mt-2 text-sm text-muted-foreground">{selected.action}</p></div><div className="rounded-xl bg-primary/5 p-4 text-sm"><p className="font-semibold">Proposed 90-day outcome</p><p className="mt-1 text-muted-foreground">{selected.result}</p></div><p className="text-xs text-muted-foreground">Prepared for {name.trim() || "your bank"}. This virtual report uses fictional data, is not retained or emailed by this demo, and is not an audit, legal opinion or regulatory filing.</p><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setReportOpen(false)}>Keep exploring</Button><Link href="/contact-sales"><Button>Request a real diagnostic <ArrowRight className="size-4" /></Button></Link></div></div></div></div>}
  </main>;
}
