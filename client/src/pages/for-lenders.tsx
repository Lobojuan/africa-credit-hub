import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Building2, Layers, Banknote, TrendingUp, ShieldCheck,
  Zap, FileSearch, Network, Globe, Receipt, CheckCircle2, Activity,
  Database, Lock, BarChart3,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { Seo } from "@/components/seo";

interface ValueProp { icon: typeof Banknote; title: string; body: string; }
const VALUE_PROPS: ValueProp[] = [
  { icon: TrendingUp, title: "Approve more, lose less", body: "Pull a unified credit report combining traditional bureau data, collateral history, and fiscal-receipt activity — the deepest applicant picture available in Africa." },
  { icon: Zap, title: "240ms decision latency", body: "Real-time scoring, batch portfolio refresh, and webhook callbacks. No 24-hour bureau lag." },
  { icon: ShieldCheck, title: "Regulator-ready by default", body: "Every report carries a consent ID, purpose, and audit trail. BoG, CBN, BCEAO, BEAC, CBK, BSL-formatted exports built in." },
  { icon: Receipt, title: "See thin-file merchants", body: "Fiscal-receipt-derived VAT Activity Score (300–850) lets you safely lend to merchants with no traditional credit history." },
  { icon: Network, title: "Cross-bureau lookup", body: "One query searches across all participating institutions. No duplicate inquiries, no blind spots." },
  { icon: Database, title: "API + UI + bulk", body: "REST API, web console, batch CSV upload, webhook events. Plug in within a week." },
];

const STEPS = [
  { n: 1, title: "Apply for institutional access", body: "Submit credentials and your central-bank lending license. Approval typically within 5 business days." },
  { n: 2, title: "Provision API keys & users", body: "Get sandbox + production keys, invite analysts and risk officers, set RBAC." },
  { n: 3, title: "Pull your first report", body: "Search by national ID, business registration, or phone. Receive a full credit report with optional VAT Activity, collateral, and inter-bureau data." },
  { n: 4, title: "Scale with batch & webhooks", body: "Refresh portfolios overnight. Subscribe to default events. Run regulator exports monthly." },
];

const REPORT_INCLUDES = [
  "Credit score (300–850) with reason codes",
  "12-month payment history across all participating lenders",
  "Active and closed credit accounts",
  "Inquiries log (last 24 months)",
  "Disputes and resolutions",
  "Court judgments and dishonoured cheques",
  "Collateral interests filed against the borrower",
  "VAT Activity Score (where consented)",
  "Cross-bureau matches (where consented)",
  "Identity verification result",
];

const PRICING_TIERS = [
  { tier: "Pilot", price: "Free 30 days", desc: "Up to 500 reports, sandbox + production, all features.", testid: "tier-pilot" },
  { tier: "Growth", price: "From $0.45 / report", desc: "Pay-as-you-go, volume tiers, monthly billing.", testid: "tier-growth" },
  { tier: "Enterprise", price: "Custom", desc: "Annual commitment, SLA, dedicated success manager, on-prem option.", testid: "tier-enterprise" },
];

export default function ForLendersPage() {
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-950" data-testid="page-for-lenders">
      <Seo
        title={`For Lenders — Approve more, lose less | ${brand}`}
        description="Banks, MFIs, fintechs and lessors: get pan-African credit reports, collateral lookups, and fiscal-receipt scoring through one regulator-ready API. Approve more borrowers, including thin-file merchants. 240ms decision latency."
        canonical="/for-lenders"
      />
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-950/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-600 via-blue-600 to-violet-600 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">For Lenders</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 md:gap-2">
            <Link href="/for-regulators" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-for-regulators">For Regulators</Button></Link>
            <Link href="/financial-inclusion" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-impact">Impact</Button></Link>
            <Link href="/api-docs" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-api-docs">API docs</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/contact-sales"><Button size="sm" data-testid="button-talk-to-sales">Talk to sales</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 text-center">
        <Badge className="mb-5 bg-emerald-600 text-white"><Banknote className="w-3 h-3 mr-1.5" />Built for banks, MFIs, fintechs & lessors</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]" data-testid="text-hero-title">
          Approve more borrowers.<br className="hidden md:inline" /> Lose fewer naira.
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
          The most complete view of an African applicant: credit history, collateral interests, and fiscal-receipt activity — through one regulator-ready API.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/start-trial"><Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-cta-trial">Start a 30-day pilot <ArrowRight className="w-4 h-4" /></Button></Link>
          <Link href="/api-docs"><Button size="lg" variant="outline" data-testid="button-cta-api"><FileSearch className="w-4 h-4 mr-2" />Read the API docs</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Activity, value: "240ms", label: "decision latency" },
            { icon: TrendingUp, value: "94.2%", label: "match accuracy" },
            { icon: Globe, value: "54", label: "countries covered" },
            { icon: ShieldCheck, value: "100%", label: "audit-logged" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-slate-200/80 dark:border-slate-800" data-testid={`stat-${s.label.replace(/\s+/g, "-")}`}>
                <CardContent className="p-4 text-center">
                  <Icon className="w-5 h-5 mx-auto mb-2 text-emerald-600" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-14">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6">Why lenders pick us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VALUE_PROPS.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title} className="border-slate-200/80 dark:border-slate-800 hover-elevate transition-all" data-testid={`card-value-${v.title.toLowerCase().replace(/[^a-z]/g, "-").slice(0, 30)}`}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{v.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">From sign-up to first decision in a week</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Most lenders are pulling live reports within 5 business days of approval.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <Card key={s.n} className="border-slate-200/80 dark:border-slate-800" data-testid={`card-step-${s.n}`}>
                <CardContent className="p-5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center mb-3">{s.n}</div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">What's in a credit report</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-5">Single API call returns the full picture — opt-in fields are gated by active consent and tagged in the response.</p>
            <Card className="border-slate-200/80 dark:border-slate-800">
              <CardContent className="p-0 divide-y divide-slate-200 dark:divide-slate-800">
                {REPORT_INCLUDES.map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-5 py-3 text-sm" data-testid={`report-line-${i}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200">{line}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">Pricing</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-5">Transparent. No setup fees. No surprise add-ons.</p>
            <div className="space-y-3">
              {PRICING_TIERS.map((p) => (
                <Card key={p.tier} className="border-slate-200/80 dark:border-slate-800" data-testid={p.testid}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-50">{p.tier}</h3>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{p.price}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{p.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <Link href="/pricing"><Button variant="outline" size="sm" data-testid="button-full-pricing">See full pricing</Button></Link>
              <Link href="/contact-sales"><Button size="sm" data-testid="button-talk-pricing">Talk to sales</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <BarChart3 className="w-10 h-10 text-emerald-600 mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">Lend to merchants you'd previously have to decline</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Verified VAT receipts from Loto Fiscal compose a 300–850 score for thin-file merchants. With consent, you see monthly turnover, frequency, growth trend, and reason codes — the same way you'd read a traditional credit report.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/financial-inclusion"><Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-see-impact">See the impact <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link href="/loto"><Button variant="outline" data-testid="button-about-loto">About Loto Fiscal</Button></Link>
              </div>
            </div>
            <div className="space-y-3">
              <Card className="border-slate-200/80 dark:border-slate-800"><CardContent className="p-4"><div className="text-xs text-slate-500 dark:text-slate-400 mb-1">VAT Activity Score</div><div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">742</div><div className="text-xs text-slate-500 mt-1">Reason: STRONG_RECEIPT_FREQUENCY</div></CardContent></Card>
              <Card className="border-slate-200/80 dark:border-slate-800"><CardContent className="p-4"><div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Verified turnover (6mo)</div><div className="text-2xl font-bold text-slate-900 dark:text-slate-50">XOF 18.4M</div><div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">↑ 12% growth trend</div></CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
        <Lock className="w-10 h-10 mx-auto text-slate-700 dark:text-slate-300 mb-3" />
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">Compliance, baked in.</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">
          PII encrypted at rest. MFA & RBAC for every operator. Consent ID and purpose recorded for every cross-product call. Blockchain-anchored audit trail. Regulator-formatted exports for BoG, CBN, BCEAO, BEAC, CBK, BSL.
        </p>
        <Link href="/security"><Button size="lg" variant="outline" className="gap-2" data-testid="button-security"><ShieldCheck className="w-4 h-4" />Read the security & compliance brief</Button></Link>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>© {year} {brand}. Built for African lenders.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Home</Link>
            <Link href="/for-regulators" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">For Regulators</Link>
            <Link href="/press" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Press</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
