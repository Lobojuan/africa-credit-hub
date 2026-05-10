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

const REGULATOR_BADGES = [
  { name: "BoG", country: "Ghana" },
  { name: "CBN", country: "Nigeria" },
  { name: "BCEAO", country: "UEMOA" },
  { name: "BEAC", country: "CEMAC" },
  { name: "CBK", country: "Kenya" },
  { name: "BSL", country: "Sierra Leone" },
];

interface Pillar { icon: typeof Eye; title: string; body: string; }
interface Regime { regime: string; scope: string; testid: string; }

export default function ForRegulatorsPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  const PILLARS: Pillar[] = [
    { icon: Eye,        title: t("forRegulators.pillar1Title"), body: t("forRegulators.pillar1Body") },
    { icon: ShieldCheck,title: t("forRegulators.pillar2Title"), body: t("forRegulators.pillar2Body") },
    { icon: FileText,   title: t("forRegulators.pillar3Title"), body: t("forRegulators.pillar3Body") },
    { icon: Lock,       title: t("forRegulators.pillar4Title"), body: t("forRegulators.pillar4Body") },
    { icon: Network,    title: t("forRegulators.pillar5Title"), body: t("forRegulators.pillar5Body") },
    { icon: Globe,      title: t("forRegulators.pillar6Title"), body: t("forRegulators.pillar6Body") },
  ];

  const REGIMES: Regime[] = [
    { regime: t("forRegulators.regime1"),  scope: t("forRegulators.regime1Scope"), testid: "regime-ohada" },
    { regime: t("forRegulators.regime2"),  scope: t("forRegulators.regime2Scope"), testid: "regime-ucc9" },
    { regime: t("forRegulators.regime3"),  scope: t("forRegulators.regime3Scope"), testid: "regime-common" },
    { regime: t("forRegulators.regime4"),  scope: t("forRegulators.regime4Scope"), testid: "regime-civil" },
  ];

  const ASKS: string[] = [
    t("forRegulators.ask1"),
    t("forRegulators.ask2"),
    t("forRegulators.ask3"),
    t("forRegulators.ask4"),
    t("forRegulators.ask5"),
  ];

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
            <Link href="/contact-sales"><Button size="sm" data-testid="button-supervisor-access">{t("forRegulators.ctaRequest")}</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 text-center">
        <Badge className="mb-5 bg-blue-700 text-white"><Landmark className="w-3 h-3 mr-1.5" />{t("forRegulators.badgeLabel")}</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05] whitespace-pre-line" data-testid="text-hero-title">
          {t("forRegulators.headline")}
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
          {t("forRegulators.subheadline")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact-sales"><Button size="lg" className="gap-2 bg-blue-700 hover:bg-blue-800" data-testid="button-pilot">{t("forRegulators.ctaSandbox")} <ArrowRight className="w-4 h-4" /></Button></Link>
          <Link href="/security"><Button size="lg" variant="outline" data-testid="button-security-brief"><FileText className="w-4 h-4 mr-2" />{t("forRegulators.ctaSecurityBrief")}</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <div className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-4">{t("forRegulators.exportBadgesTitle")}</div>
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
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6">{t("forRegulators.pillarsSectionTitle")}</h2>
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t("forRegulators.regimesTitle")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{t("forRegulators.regimesSubtitle")}</p>
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">{t("forRegulators.auditTitle")}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{t("forRegulators.auditBody")}</p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  t("forRegulators.auditItem1"),
                  t("forRegulators.auditItem2"),
                  t("forRegulators.auditItem3"),
                  t("forRegulators.auditItem4"),
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-700 shrink-0" /><span>{line}</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 dark:border-slate-800" data-testid="card-financial-inclusion">
            <CardContent className="p-6">
              <BarChart3 className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">{t("forRegulators.inclusionTitle")}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{t("forRegulators.inclusionBody")}</p>
              <Link href="/financial-inclusion"><Button variant="outline" size="sm" className="gap-2" data-testid="button-impact-dashboard">{t("forRegulators.inclusionCta")} <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-700 to-cyan-700 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <Users className="w-10 h-10 mb-3 opacity-90" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t("forRegulators.pilotTitle")}</h2>
              <p className="text-blue-50 leading-relaxed mb-5">{t("forRegulators.pilotBody")}</p>
              <ul className="space-y-2 mb-6">
                {ASKS.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" data-testid={`ask-${i}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 opacity-90" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact-sales"><Button size="lg" variant="secondary" className="gap-2 text-blue-800" data-testid="button-cta-pilot">{t("forRegulators.pilotCta")} <ArrowRight className="w-4 h-4" /></Button></Link>
                <a href="mailto:regulators@africacredithub.com"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" data-testid="button-cta-email">regulators@africacredithub.com</Button></a>
              </div>
            </div>
            <div className="space-y-3">
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">{t("forRegulators.stat1Label")}</div><div className="text-3xl font-bold">12</div><div className="text-xs text-blue-100">{t("forRegulators.stat1Sub")}</div></CardContent></Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">{t("forRegulators.stat2Label")}</div><div className="text-3xl font-bold">5 days</div><div className="text-xs text-blue-100">{t("forRegulators.stat2Sub")}</div></CardContent></Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur"><CardContent className="p-4"><div className="text-xs text-blue-100 mb-1">{t("forRegulators.stat3Label")}</div><div className="text-3xl font-bold">6 hr</div><div className="text-xs text-blue-100">{t("forRegulators.stat3Sub")}</div></CardContent></Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>© {year} {brand}. {t("forRegulators.footerTagline")}</span>
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
