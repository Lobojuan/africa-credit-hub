import { useTranslation } from "react-i18next";
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
interface Step { n: number; title: string; body: string; }
interface PricingTier { tier: string; price: string; desc: string; testid: string; }

export default function ForLendersPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  const VALUE_PROPS: ValueProp[] = [
    { icon: TrendingUp, title: t("forLenders.prop1Title"), body: t("forLenders.prop1Body") },
    { icon: Zap,        title: t("forLenders.prop2Title"), body: t("forLenders.prop2Body") },
    { icon: ShieldCheck,title: t("forLenders.prop3Title"), body: t("forLenders.prop3Body") },
    { icon: Receipt,    title: t("forLenders.prop4Title"), body: t("forLenders.prop4Body") },
    { icon: Network,    title: t("forLenders.prop5Title"), body: t("forLenders.prop5Body") },
    { icon: Database,   title: t("forLenders.prop6Title"), body: t("forLenders.prop6Body") },
  ];

  const STEPS: Step[] = [
    { n: 1, title: t("forLenders.step1Title"), body: t("forLenders.step1Body") },
    { n: 2, title: t("forLenders.step2Title"), body: t("forLenders.step2Body") },
    { n: 3, title: t("forLenders.step3Title"), body: t("forLenders.step3Body") },
    { n: 4, title: t("forLenders.step4Title"), body: t("forLenders.step4Body") },
  ];

  const REPORT_INCLUDES: string[] = [
    t("forLenders.reportItem1"),
    t("forLenders.reportItem2"),
    t("forLenders.reportItem3"),
    t("forLenders.reportItem4"),
    t("forLenders.reportItem5"),
    t("forLenders.reportItem6"),
    t("forLenders.reportItem7"),
    t("forLenders.reportItem8"),
    t("forLenders.reportItem9"),
    t("forLenders.reportItem10"),
  ];

  const PRICING_TIERS: PricingTier[] = [
    { tier: t("forLenders.tierPilot"),      price: t("forLenders.tierPilotPrice"),      desc: t("forLenders.tierPilotDesc"),      testid: "tier-pilot" },
    { tier: t("forLenders.tierGrowth"),     price: t("forLenders.tierGrowthPrice"),     desc: t("forLenders.tierGrowthDesc"),     testid: "tier-growth" },
    { tier: t("forLenders.tierEnterprise"), price: t("forLenders.tierEnterprisePrice"), desc: t("forLenders.tierEnterpriseDesc"), testid: "tier-enterprise" },
  ];

  const STATS = [
    { icon: Activity,    value: "240ms", label: t("forLenders.statLatency") },
    { icon: TrendingUp,  value: "94.2%", label: t("forLenders.statAccuracy") },
    { icon: Globe,       value: "54",    label: t("forLenders.statCountries") },
    { icon: ShieldCheck, value: "100%",  label: t("forLenders.statAudited") },
  ];

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
            <Link href="/contact-sales"><Button size="sm" data-testid="button-talk-to-sales">{t("forLenders.contactCta")}</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 text-center">
        <Badge className="mb-5 bg-emerald-600 text-white"><Banknote className="w-3 h-3 mr-1.5" />{t("forLenders.badgeLabel")}</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05] whitespace-pre-line" data-testid="text-hero-title">
          {t("forLenders.headline")}
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
          {t("forLenders.subheadline")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/start-trial"><Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-cta-trial">{t("forLenders.ctaTrial")} <ArrowRight className="w-4 h-4" /></Button></Link>
          <Link href="/api-docs"><Button size="lg" variant="outline" data-testid="button-cta-api"><FileSearch className="w-4 h-4 mr-2" />{t("forLenders.ctaApiDocs")}</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => {
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
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6">{t("forLenders.whyUsTitle")}</h2>
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t("forLenders.stepsHeading")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{t("forLenders.stepsSubtitle")}</p>
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">{t("forLenders.reportSectionTitle")}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-5">{t("forLenders.reportSubtitle")}</p>
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">{t("forLenders.pricingSectionTitle")}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-5">{t("forLenders.pricingSubtitle")}</p>
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
              <Link href="/pricing"><Button variant="outline" size="sm" data-testid="button-full-pricing">{t("forLenders.linkFullPricing")}</Button></Link>
              <Link href="/contact-sales"><Button size="sm" data-testid="button-talk-pricing">{t("forLenders.contactCta")}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <BarChart3 className="w-10 h-10 text-emerald-600 mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">{t("forLenders.merchantTitle")}</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">{t("forLenders.merchantBody")}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/financial-inclusion"><Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-see-impact">{t("forLenders.merchantCtaImpact")} <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link href="/loto"><Button variant="outline" data-testid="button-about-loto">{t("forLenders.merchantCtaLoto")}</Button></Link>
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">{t("forLenders.complianceTitle")}</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">{t("forLenders.complianceBody")}</p>
        <Link href="/security"><Button size="lg" variant="outline" className="gap-2" data-testid="button-security"><ShieldCheck className="w-4 h-4" />{t("forLenders.complianceCta")}</Button></Link>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>© {year} {brand}. {t("forLenders.footerTagline")}</span>
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
