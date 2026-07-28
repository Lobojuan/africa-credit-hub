import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  FileCheck2,
  Landmark,
  Radar,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Control = {
  title: string;
  description: string;
  outcome: string;
  href: string;
  action: string;
  icon: typeof ShieldAlert;
  tone: string;
  testId: string;
};

const controls: Control[] = [
  {
    title: "Protect money",
    description: "Screen transaction, device, beneficiary, location, and velocity signals before release.",
    outcome: "Hold, step-up authentication, or allow - each decision is auditable.",
    href: "/transaction-fraud-monitor",
    action: "Open Fraud Monitor",
    icon: ShieldAlert,
    tone: "text-red-600 bg-red-500/10",
    testId: "control-fraud",
  },
  {
    title: "Resolve customer issues",
    description: "Work failed transfers, double debits, cash-dispense failures, and account freezes from one controlled queue.",
    outcome: "Verify evidence, record the decision, hand off to core banking, and notify the customer.",
    href: "/transaction-resolution",
    action: "Open Resolution Desk",
    icon: ArrowRightLeft,
    tone: "text-blue-600 bg-blue-500/10",
    testId: "control-resolution",
  },
  {
    title: "Stop loans becoming NPLs",
    description: "Prioritise arrears, restructures, and account-status deterioration before the loan becomes a loss.",
    outcome: "Assign the at-risk facility to Collections with an accountable owner.",
    href: "/npl-early-warning",
    action: "Open Early Warning",
    icon: Radar,
    tone: "text-amber-600 bg-amber-500/10",
    testId: "control-npl",
  },
  {
    title: "Prove compliance",
    description: "Review fraud alerts, consent and identity exceptions, and the evidence needed for an accountable decision.",
    outcome: "No sensitive action proceeds without a recorded, reviewable control trail.",
    href: "/compliance-queue",
    action: "Open Compliance Queue",
    icon: FileCheck2,
    tone: "text-violet-600 bg-violet-500/10",
    testId: "control-compliance",
  },
  {
    title: "Manage prudential risk",
    description: "Monitor funding concentration, liquidity and capital signals before they become a board or regulator issue.",
    outcome: "Escalate the right risk owner with the evidence behind every signal.",
    href: "/prudential-radar",
    action: "Open Prudential Radar",
    icon: Landmark,
    tone: "text-emerald-600 bg-emerald-500/10",
    testId: "control-prudential",
  },
  {
    title: "Prepare the board view",
    description: "Move from fragmented reports to a single evidence-led view of credit, operational and regulatory risk.",
    outcome: "Drill from a board-level trend to the actual cases and decisions behind it.",
    href: "/regulatory-dashboard",
    action: "Open Risk Dashboard",
    icon: TrendingUp,
    tone: "text-slate-700 bg-slate-500/10",
    testId: "control-board-risk",
  },
];

export default function BankControlCenterPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="bank-control-center">
      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <Badge variant="outline" className="border-primary/30 bg-background/80">Bank operations command centre</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">What needs your attention today?</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Start with the banking outcome you need to control. UCH connects the operational desk, approval trail, and evidence - it never moves funds or makes regulated decisions on its own.
        </p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/bank-pilot-readiness"><Button className="gap-2" data-testid="button-start-bank-pilot">Set up the NPL &amp; consent pilot <ArrowRight className="size-4" /></Button></Link><Link href="/bank-integration-readiness"><Button variant="outline" data-testid="button-open-integration-readiness">Check integration readiness</Button></Link></div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Bank controls">
        {controls.map((control) => {
          const Icon = control.icon;
          return (
            <Card key={control.title} className="flex flex-col" data-testid={control.testId}>
              <CardHeader>
                <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${control.tone}`}><Icon className="size-5" /></div>
                <CardTitle>{control.title}</CardTitle>
                <CardDescription className="min-h-12">{control.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Control outcome:</span> {control.outcome}</p>
                <Link href={control.href}><Button variant="outline" className="w-full justify-between" data-testid={`${control.testId}-open`}>{control.action}<ArrowRight className="size-4" /></Button></Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-amber-500/30 bg-amber-500/5" data-testid="bank-control-guardrail">
        <CardContent className="flex gap-3 p-5 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <p><span className="font-semibold">Control principle:</span> AI may identify, investigate, and recommend. A bank-approved user remains responsible for any customer-data use, credit action, reversal, hold, filing, or release.</p>
        </CardContent>
      </Card>
    </main>
  );
}
