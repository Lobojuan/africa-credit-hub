import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Building2, Layers, Landmark, ShieldCheck, FileText,
  Lock, Eye, Globe, CheckCircle2, Network, Users, Database, Activity,
  Scale, BarChart3,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { Seo } from "@/components/seo";

const PILLARS = [
  { icon: Eye, title: "Real-time supervisory window", body: "Live access to participating-lender activity, default rates, NPL trajectories and concentration risk by sector or geography." },
  { icon: ShieldCheck, title: "Consent-first by design", body: "Every consumer cross-product data flow requires an active consent record with explicit purpose and expiry. Revocation is immediate." },
  { icon: FileText, title: "Regulator-ready exports", body: "Built-in templates for BoG (Ghana), CBN (Nigeria), BCEAO (UEMOA), BEAC (CEMAC), CBK (Kenya), BSL (Sierra Leone). One click. CSV, JSON, regulator XML." },
  { icon: Lock, title: "Privacy by architecture", body: "PII encrypted at rest. MFA-protected operator access. RBAC. Blockchain-anchored audit chain that cannot be silently rewritten." },
  { icon: Network, title: "Cross-bureau cooperation", body: "Run inter-bureau lookups across participating jurisdictions while respecting national data-sovereignty rules." },
  { icon: Globe, title: "Built for 4 legal regimes", body: "OHADA, UCC-9, English Common Law, French Civil Law — collateral registry behaviour adapts automatically." },
];

const REGIMES = [
  { regime: "OHADA Uniform Act on Securities", scope: "17 West & Central African states", testid: "regime-ohada" },
  { regime: "UCC Article 9", scope: "U.S.-derived movable security framework, used as reference for Liberia & Anglophone reforms", testid: "regime-ucc9" },
  { regime: "English Common Law", scope: "Ghana, Nigeria, Kenya, Sierra Leone, Uganda, Tanzania, +6 more", testid: "regime-common" },
  { regime: "French Civil Law", scope: "Algeria, Morocco, Tunisia, Madagascar, Djibouti", testid: "regime-civil" },
];

const REGULATOR_BADGES = [
  { name: "BoG", country: "Ghana" },
  { name: "CBN", country: "Nigeria" },
  { name: "BCEAO", country: "UEMOA" },
  { name: "BEAC", country: "CEMAC" },
  { name: "CBK", country: "Kenya" },
  { name: "BSL", country: "Sierra Leone" },
];

const ASKS = [
  "Pilot deployment in a sandbox isolated from your production bureau",
  "Read-only supervisor account with full audit-trail visibility",
  "Bespoke regulator export to your existing reporting schema",
  "On-prem option for sovereignty-sensitive deployments",
  "Joint research access (anonymised) for financial-inclusion studies",
];

export default function ForRegulatorsPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-950" data-testid="page-for-regulators">
      <Seo
        title={`For Regulators — Supervisory infrastructure for African credit | ${brand}`}
        description="Central banks, supervisors and ministries: a real-time supervisory window into credit-bureau activity, with consent-first architecture, blockchain-anchored audit, and regulator-ready exports for BoG, CBN, BCEAO, BEAC, CBK, BSL."
        canonical="/for-regulators"
      />
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-950/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-700 via-cyan-600 to-blue-500 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">For Regulators</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 md:gap-2">
            <Link href="/for-lenders" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-for-lenders">For Lenders</Button></Link>
            <Link href="/financial-inclusion" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-impact">Impact</Button></Link>
            <Link href="/security" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-security">Security</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/contact-sales"><Button size="sm" data-testid="button-supervisor-access">Request supervisor access</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 text-center">
        <Badge className="mb-5 bg-blue-700 text-white"><Landmark className="w-3 h-3 mr-1.5" />For central banks · supervisors · ministries</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]" data-testid="text-hero-title">
          Modern supervisory infrastructure for African credit.
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
          A live supervisory window into bureau, collateral and fiscal-receipt activity — built consent-first, audit-anchored, and exportable to your existing reporting templates.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact-sales"><Button size="lg" className="gap-2 bg-blue-700 hover:bg-blue-800" data-testid="button-pilot">Request a sandbox pilot <ArrowRight className="w-4 h-4" /></Button></Link>
          <Link href="/security"><Button size="lg" variant="outline" data-testid="button-security-brief"><FileText className="w-4 h-4 mr-2" />Security & compliance brief</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <div className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-4">Regulator export templates available</div>
        <div className="flex flex-wrap justify-center gap-2">
          {REGULATOR_BADGES.map((r) => (
            <Badge key={r.name} variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-400 px-3 py-1.5" data-testid={`badge-regulator-${r.name.toLowerCase()}`}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              <span className="font-bold">{r.name}</span>
              <span className="ml-1.5 text-slate-500 dark:text-slate-400 text-xs">{r.country}</span>
            </Badge>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-14">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6">What you get as a supervisor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-slate-200/80 dark:border-slate-800 hover-elevate transition-all" data-testid={`card-pillar-${p.title.toLowerCase().replace(/[^a-z]/g, "-").slice(0, 30)}`}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-cyan-600 text-white flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Scale className="w-10 h-10 mx-auto text-blue-700 mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Four legal regimes. One platform.</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Collateral registry, dispute handling and consent rules adapt to your jurisdiction's framework — not the other way around.</p>
          </div>
          <Card className="border-slate-200/80 dark:border-slate-800 max-w-3xl mx-auto">
            <CardContent className="p-0 divide-y divide-slate-200 dark:divide-slate-800">
              {REGIMES.map((r) => (
                <div key={r.regime} className="grid grid-cols-1 md:grid-cols-3 gap-2 px-6 py-4" data-testid={r.testid}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{r.regime}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 md:col-span-2">{r.scope}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <Card className="border-slate-200/80 dark:border-slate-800" data-testid="card-audit-trail">
            <CardContent className="p-6">
              <Activity className="w-8 h-8 text-blue-700 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">A supervisory window that doesn't lie</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Every cross-product access is logged with: who pulled it, what consent ID authorised it, what purpose was declared, and which records were touched. The chain is anchored to a public blockchain so no participant can quietly rewrite history.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  "Real-time activity feed (latency &lt; 1s)",
                  "Filter by lender, purpose, jurisdiction or risk segment",
                  "Tamper-evident hash anchor every 6 hours",
                  "Read-only API for your supervisory tools",
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-700 shrink-0" /><span dangerouslySetInnerHTML={{ __html: line }} /></li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 dark:border-slate-800" data-testid="card-financial-inclusion">
            <CardContent className="p-6">
              <BarChart3 className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Measurable financial-inclusion impact</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Public dashboard you can cite in policy: verified merchants, opt-in rates, denied vs. allowed bridge accesses with denial reasons, and the share of credit decisions that included alternative-data signals.
              </p>
              <Link href="/financial-inclusion"><Button variant="outline" size="sm" className="gap-2" data-testid="button-impact-dashboard">Open the live impact dashboard <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-700 to-cyan-700 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <Users className="w-10 h-10 mb-3 opacity-90" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Let's run a sandbox pilot together.</h2>
              <p className="text-blue-50 leading-relaxed mb-5">
                We can stand up an isolated environment with anonymised seed data inside a week. Your team gets supervisor accounts, audit access, and an export template tailored to your existing returns. No commitment.
              </p>
              <ul className="space-y-2 mb-6">
                {ASKS.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" data-testid={`ask-${i}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 opacity-90" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact-sales"><Button size="lg" variant="secondary" className="gap-2 text-blue-800" data-testid="button-cta-pilot">Request a pilot <ArrowRight className="w-4 h-4" /></Button></Link>
                <a href="mailto:regulators@africacredithub.com"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" data-testid="button-cta-email">regulators@africacredithub.com</Button></a>
              </div>
            </div>
            <div className="space-y-3">
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">Supervisory dashboards</div><div className="text-3xl font-bold">12</div><div className="text-xs text-blue-100">pre-built views</div></CardContent></Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">Pilot deployment time</div><div className="text-3xl font-bold">5 days</div><div className="text-xs text-blue-100">sandbox to first query</div></CardContent></Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">Audit chain anchoring</div><div className="text-3xl font-bold">6 hr</div><div className="text-xs text-blue-100">tamper-evidence cycle</div></CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>© {year} {brand}. Public-interest infrastructure for African credit.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Home</Link>
            <Link href="/for-lenders" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">For Lenders</Link>
            <Link href="/press" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Press</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
