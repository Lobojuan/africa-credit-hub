import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, BadgeCheck, BarChart3, CheckCircle2, ClipboardCheck,
  FileCheck2, FileLock2, FileSearch, Landmark, LockKeyhole,
  Radar, ShieldAlert, ShieldCheck, Upload, UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AssessmentArea = {
  id: string;
  title: string;
  description: string;
  outcome: string;
  href: string;
  action: string;
  icon: typeof Radar;
  tone: string;
};

const assessmentAreas: AssessmentArea[] = [
  {
    id: "npl",
    title: "NPL & IFRS 9 readiness",
    description: "Test loan-tape completeness, arrears migration, early-warning coverage and the inputs needed for governed provision work.",
    outcome: "A prioritised risk watchlist and a back-test plan; never an automatic provision or accounting post.",
    href: "/npl-early-warning",
    action: "Open NPL desk",
    icon: Radar,
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    id: "consent",
    title: "Consent, collateral & evidence",
    description: "Identify missing consent, approval-trail and collateral-evidence controls around sensitive customer and secured-lending actions.",
    outcome: "A traceable exception register and a bank-owned remediation path.",
    href: "/consent",
    action: "Open consent controls",
    icon: ShieldCheck,
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  {
    id: "operations",
    title: "Fraud, failed transactions & complaints",
    description: "Map data, ownership and reconciliation gaps in the bank's exception and resolution process.",
    outcome: "A resolution-control design; live holds, reversals and customer contact remain bank-approved actions.",
    href: "/transaction-resolution",
    action: "Open resolution desk",
    icon: ShieldAlert,
    tone: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  {
    id: "reporting",
    title: "Reporting & prudential controls",
    description: "Review data quality, reporting calendar, concentration signals and evidence retained for management and regulatory review.",
    outcome: "A control-gap register with accountable owners and evidence references.",
    href: "/regulatory-evidence-packs",
    action: "Open evidence packs",
    icon: Landmark,
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
];

const engagementSteps = [
  { id: "authorise", title: "Authorise the engagement", description: "Record sponsor, permitted purpose, approved scope and named data owner.", icon: FileLock2 },
  { id: "intake", title: "Load read-only extracts", description: "Use the bank-approved file contract. No administrator access or production writes.", icon: Upload },
  { id: "validate", title: "Validate findings", description: "Bank owners review the evidence, assumptions and severity before anything is reported.", icon: FileSearch },
  { id: "convert", title: "Agree the remedy", description: "Turn an accepted finding into a bank-owned remediation or a measurable 90-day UCH pilot.", icon: BadgeCheck },
];

export default function BankRiskDiagnosticPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["npl", "consent", "reporting"]);
  const selectedCount = selectedAreas.length;
  const active = engagementSteps[activeStep];
  const completion = useMemo(() => `${activeStep + 1} of ${engagementSteps.length}`, [activeStep]);

  const toggleArea = (areaId: string) => {
    setSelectedAreas((current) => current.includes(areaId)
      ? current.filter((id) => id !== areaId)
      : [...current, areaId]);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="bank-risk-diagnostic">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-primary to-slate-900 p-6 text-primary-foreground shadow-sm md:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <Badge className="border-white/20 bg-white/10 text-primary-foreground hover:bg-white/10">Management diagnostic · file-first · bank controlled</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Find the risk. Prove the gap. Fix what matters.</h1>
          <p className="mt-3 max-w-3xl text-sm text-primary-foreground/80 md:text-base">
            A guided, read-only assessment for a bank's approved data extracts. UCH helps teams identify control and data gaps, validate them with accountable owners, and turn accepted findings into a remediation plan or a measured pilot.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-primary-foreground/85">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">No production writes</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">No unrestricted server access</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Management diagnostic — not an audit or certification</span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]" aria-label="Diagnostic engagement path">
        <Card data-testid="diagnostic-engagement-path">
          <CardHeader>
            <div className="flex items-center justify-between gap-3"><div><CardTitle>Engagement path</CardTitle><CardDescription>Move from authority to an evidenced decision, one controlled stage at a time.</CardDescription></div><Badge variant="outline">{completion}</Badge></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {engagementSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isComplete = index < activeStep;
                return <button key={step.id} type="button" onClick={() => setActiveStep(index)} className={`rounded-xl border p-4 text-left transition-colors ${isActive ? "border-primary bg-primary/5" : "hover:border-primary/40"}`} data-testid={`diagnostic-step-${step.id}`}>
                  <div className="mb-3 flex items-center justify-between"><span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${isComplete ? "bg-emerald-600 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{isComplete ? <CheckCircle2 className="size-4" /> : index + 1}</span><Icon className="size-4 text-primary" /></div>
                  <p className="text-sm font-semibold">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </button>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 p-4" data-testid="diagnostic-active-step">
              <div><p className="font-medium">Now: {active.title}</p><p className="mt-1 text-sm text-muted-foreground">{active.description}</p></div>
              {activeStep === 1 ? <Link href="/batch-upload"><Button data-testid="button-diagnostic-data-intake">Open secure file intake <ArrowRight className="size-4" /></Button></Link> : <Button variant="outline" onClick={() => setActiveStep(Math.min(activeStep + 1, engagementSteps.length - 1))} data-testid="button-diagnostic-next">Continue <ArrowRight className="size-4" /></Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5" data-testid="diagnostic-safety-boundary">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="size-5 text-amber-700" />Bank data boundary</CardTitle><CardDescription>Keep the assessment defensible from day one.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Allowed:</span> bank-approved, read-only extracts within an authorised purpose and retention period.</p>
            <p><span className="font-semibold text-foreground">Required:</span> sponsor, data owner, scope, data-processing terms and bank validation of every material finding.</p>
            <p><span className="font-semibold text-foreground">Excluded:</span> unrestricted server access, autonomous holds/reversals, regulatory filing or audit opinions.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="diagnostic-scope-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-primary">Assessment scope</p><h2 id="diagnostic-scope-heading" className="text-2xl font-bold tracking-tight">Choose the questions the bank wants answered</h2><p className="mt-1 text-sm text-muted-foreground">Start with up to three domains. Each selected domain becomes a finding and remediation workstream.</p></div><Badge variant="secondary" data-testid="diagnostic-selected-count">{selectedCount} selected</Badge></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {assessmentAreas.map((area) => {
            const Icon = area.icon;
            const selected = selectedAreas.includes(area.id);
            return <Card key={area.id} className={`flex flex-col transition-colors ${selected ? "border-primary shadow-sm" : ""}`} data-testid={`diagnostic-area-${area.id}`}>
              <CardHeader><div className="mb-3 flex items-center justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${area.tone}`}><Icon className="size-5" /></span><Button variant={selected ? "default" : "outline"} size="sm" onClick={() => toggleArea(area.id)} aria-pressed={selected} data-testid={`button-toggle-diagnostic-${area.id}`}>{selected ? "Included" : "Add"}</Button></div><CardTitle className="text-base">{area.title}</CardTitle><CardDescription className="min-h-20">{area.description}</CardDescription></CardHeader>
              <CardContent className="mt-auto space-y-3"><p className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Result:</span> {area.outcome}</p><Link href={area.href}><Button variant="ghost" size="sm" className="w-full justify-between">{area.action}<ArrowRight className="size-4" /></Button></Link></CardContent>
            </Card>;
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Diagnostic outcomes">
        <Card data-testid="diagnostic-output-findings"><CardHeader><FileSearch className="mb-2 size-5 text-primary" /><CardTitle className="text-base">Evidence-backed findings</CardTitle><CardDescription>Every finding records source extract, control affected, severity, owner and the bank's validation status.</CardDescription></CardHeader></Card>
        <Card data-testid="diagnostic-output-board"><CardHeader><BarChart3 className="mb-2 size-5 text-primary" /><CardTitle className="text-base">Management risk pack</CardTitle><CardDescription>A board-ready view of priority gaps, assumptions, remediation options and unresolved decisions—not a regulator filing.</CardDescription></CardHeader></Card>
        <Card data-testid="diagnostic-output-pilot"><CardHeader><ClipboardCheck className="mb-2 size-5 text-primary" /><CardTitle className="text-base">Measured next step</CardTitle><CardDescription>Accepted gaps become a bank-owned remediation plan or a fixed-scope UCH pilot with baseline, target, owner and acceptance test.</CardDescription></CardHeader></Card>
      </section>

      <Card className="border-primary/20 bg-primary/5" data-testid="diagnostic-next-action">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><UsersRound className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Ready to scope a bank engagement?</p><p className="mt-1 text-sm text-muted-foreground">Start with authority and a data owner, then use the agreed extract contract. Findings become actionable only after the bank validates them.</p></div></div><div className="flex flex-wrap gap-2"><Link href="/bank-pilot-readiness"><Button variant="outline">Open pilot path</Button></Link><Link href="/bank-integration-readiness"><Button>Check integration readiness <ArrowRight className="size-4" /></Button></Link></div></CardContent>
      </Card>
    </main>
  );
}
