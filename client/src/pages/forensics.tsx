import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/seo";

const english = {
  eyebrow: "UCH Bank Diagnostic & Forensics",
  title: "See the control gaps before they become losses.",
  subtitle: "A controlled diagnostic for banks that need a fact-based view of NPL risk, IFRS 9 readiness, fraud operations, collateral evidence and data quality before a full platform programme.",
  primary: "Request a diagnostic",
  secondary: "Explore the demo",
  includesTitle: "What the diagnostic covers",
  includes: [
    "Portfolio and NPL early-warning data readiness",
    "IFRS 9 evidence, staging and governance readiness",
    "Fraud, failed-transaction and complaint-control traceability",
    "Collateral, consent and document-evidence controls",
    "Prudential reporting, data quality and accountable remediation",
  ],
  howTitle: "A controlled engagement - not a black box.",
  steps: [
    ["Agree scope", "The bank controls the scope, data access, named owners and permitted environment."],
    ["Analyse evidence", "UCH maps data and control evidence to a governed risk and remediation view."],
    ["Deliver management actions", "Your team receives prioritised findings, evidence references and a bank-owned next-step plan."],
  ],
  boundaryTitle: "Important boundary",
  boundary: "The diagnostic does not make lending, provisioning, regulatory or customer decisions. It uses bank-approved data access only and does not replace independent audit, legal advice or regulator approval.",
  deliverableTitle: "What your management team receives",
  deliverables: ["Executive diagnostic", "Prioritised remediation backlog", "Evidence and ownership matrix", "Pilot-readiness recommendation"],
};

const french = {
  eyebrow: "Diagnostic et forensique bancaire UCH",
  title: "Identifiez les lacunes de contrôle avant qu'elles ne deviennent des pertes.",
  subtitle: "Un diagnostic contrôlé pour les banques qui veulent une vue factuelle du risque NPL, de la préparation IFRS 9, des opérations fraude, des preuves de garanties et de la qualité des données avant un programme plateforme complet.",
  primary: "Demander un diagnostic",
  secondary: "Explorer la démo",
  includesTitle: "Ce que couvre le diagnostic",
  includes: ["Préparation des données portefeuille et alerte précoce NPL", "Preuves, classification et gouvernance IFRS 9", "Traçabilité fraude, transactions échouées et réclamations", "Contrôles des garanties, consentements et preuves documentaires", "Reporting prudentiel, qualité des données et remédiation responsable"],
  howTitle: "Un engagement contrôlé, pas une boîte noire.",
  steps: [["Définir le périmètre", "La banque contrôle le périmètre, l'accès aux données, les responsables nommés et l'environnement autorisé."], ["Analyser les preuves", "UCH cartographie les données et preuves de contrôle dans une vue de risque et de remédiation gouvernée."], ["Livrer les actions de direction", "Votre équipe reçoit des constats priorisés, des références de preuve et un plan d'étapes détenu par la banque."]],
  boundaryTitle: "Limite importante",
  boundary: "Le diagnostic ne prend pas de décisions de crédit, de provisionnement, réglementaires ou client. Il utilise uniquement un accès aux données approuvé par la banque et ne remplace pas un audit indépendant, un avis juridique ou une approbation réglementaire.",
  deliverableTitle: "Ce que reçoit votre équipe de direction",
  deliverables: ["Diagnostic exécutif", "Backlog de remédiation priorisé", "Matrice des preuves et responsables", "Recommandation de préparation au pilote"],
};

export default function ForensicsPage() {
  const { i18n } = useTranslation();
  const copy = i18n.resolvedLanguage?.startsWith("fr") ? french : english;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" data-testid="public-forensics-page">
      <Seo title="Bank Diagnostic & Forensics for African Banks | Universal Credit Hub" description="A controlled bank diagnostic for NPL risk, IFRS 9 readiness, fraud operations, collateral evidence and data quality. Bank-approved access and management-owned remediation." canonical="/forensics" />
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge variant="secondary" className="mb-5"><FileSearch className="mr-1.5 size-3.5" />{copy.eyebrow}</Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50 md:text-6xl">{copy.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">{copy.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact-sales?service=bank-diagnostic"><Button size="lg" className="gap-2" data-testid="button-request-diagnostic">{copy.primary}<ArrowRight className="size-4" /></Button></Link>
              <Link href="/demo"><Button size="lg" variant="outline" data-testid="button-forensics-demo">{copy.secondary}</Button></Link>
            </div>
          </div>
          <Card className="border-blue-200/80 bg-white/80 shadow-xl dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="p-6 md:p-8">
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white"><ShieldCheck className="size-6" /></div>
              <h2 className="text-xl font-bold">{copy.includesTitle}</h2>
              <ul className="mt-5 space-y-3">
                {copy.includes.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y bg-white/70 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{copy.howTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.steps.map(([title, body], index) => <Card key={title}><CardContent className="p-6"><span className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2 md:px-6">
        <Card className="border-amber-300/70 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-950/20"><CardContent className="p-6"><h2 className="font-bold">{copy.boundaryTitle}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.boundary}</p></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-2"><UsersRound className="size-5 text-blue-600" /><h2 className="font-bold">{copy.deliverableTitle}</h2></div><ul className="mt-4 grid gap-2 text-sm text-muted-foreground">{copy.deliverables.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-600" />{item}</li>)}</ul></CardContent></Card>
      </section>
    </main>
  );
}
