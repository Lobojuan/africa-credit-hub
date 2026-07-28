import { ArrowRight, CheckCircle2, ClipboardCheck, FileCheck2, Radar, ShieldCheck, Upload } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PilotStep = {
  number: string;
  title: string;
  description: string;
  proof: string;
  href: string;
  action: string;
  icon: typeof Upload;
};

const steps: PilotStep[] = [
  {
    number: "1",
    title: "Load the pilot loan tape",
    description: "Start with one agreed portfolio. Load borrower, facility, repayment, arrears, restructure, and collections-owner data using the bank-approved extract.",
    proof: "Data owner signs off the import completeness and exceptions before decisions are made.",
    href: "/batch-upload",
    action: "Open data intake",
    icon: Upload,
  },
  {
    number: "2",
    title: "Run controlled risk and consent decisions",
    description: "Use the early-warning queue to assign at-risk facilities to Collections. For sensitive customer-data or instrument actions, record consent and route evidence exceptions to review.",
    proof: "Every recommendation, consent record, assignment, and approval remains traceable to a person.",
    href: "/npl-early-warning",
    action: "Open NPL early warning",
    icon: Radar,
  },
  {
    number: "3",
    title: "Prove the control works",
    description: "Prepare an evidence pack for the agreed monthly NPL or prudential return, obtain independent review, then record the bank's own filing reference.",
    proof: "A bank reviewer can trace a board or regulator statement back to the underlying records and approvals.",
    href: "/regulatory-evidence-packs",
    action: "Prepare evidence pack",
    icon: FileCheck2,
  },
];

export default function BankPilotReadinessPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8" data-testid="bank-pilot-readiness">
      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <Badge variant="outline" className="border-primary/30 bg-background/80">90-day bank pilot</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Set up a controlled NPL and consent pilot</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          This path turns UCH's existing credit-risk, consent, and evidence controls into one bank-owned pilot. Start small, use approved data, and measure results before expansion.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Bank pilot steps">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className="flex flex-col" data-testid={`pilot-step-${step.number}`}>
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{step.number}</span>
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription className="min-h-24">{step.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Pilot evidence:</span> {step.proof}</p>
                <Link href={step.href}><Button className="w-full justify-between" variant={step.number === "2" ? "default" : "outline"} data-testid={`button-pilot-step-${step.number}`}>{step.action}<ArrowRight className="size-4" /></Button></Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card data-testid="pilot-consent-gate">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-violet-600" />Consent &amp; Evidence Gate</CardTitle><CardDescription>Use this before a credit-file pull, open-banking link, sensitive instruction, or other customer-data action.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-3"><Link href="/consent"><Button variant="outline">Manage consent</Button></Link><Link href="/forgery-review"><Button variant="outline">Review evidence exceptions</Button></Link></CardContent>
        </Card>
        <Card data-testid="pilot-success-criteria">
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-emerald-600" />Agree success criteria first</CardTitle><CardDescription>Use bank data to measure early flags, collections ownership, consent coverage, filing timeliness, and human-review turnaround—not AI activity alone.</CardDescription></CardHeader>
          <CardContent><div className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />The bank remains the decision-maker for holds, reversals, credit action, consent, and filings.</div></CardContent>
        </Card>
      </section>
    </main>
  );
}
