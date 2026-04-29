import { useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Layers, Shield, ShieldCheck, Sparkles, Landmark, Banknote, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PRODUCT_ORDER, PRODUCT_REGISTRY } from "@/lib/products";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

export default function MasterLandingPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();

  useEffect(() => {
    document.title = `${brand} — ${t("platform.brand.tagline")}`;
  }, [brand, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-950/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white shadow-md group-hover:shadow-lg transition-shadow">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100" data-testid="text-brand-name">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">Platform</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 md:gap-2">
            <Link href="/pricing" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-pricing">Pricing</Button></Link>
            <Link href="/security" className="hidden md:inline-flex"><Button variant="ghost" size="sm" data-testid="link-security">Security</Button></Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/login"><Button size="sm" data-testid="button-signin">{t("landingShell.masterHero.ctaPrimary")}</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-12 md:pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-5 text-xs font-medium" data-testid="badge-eyebrow">
            <Sparkles className="w-3 h-3 mr-1.5" />
            {t("landingShell.masterHero.eyebrow")}
          </Badge>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05] whitespace-pre-line"
            data-testid="text-hero-title"
          >
            {t("landingShell.masterHero.title")}
          </h1>
          <p className="mt-5 md:mt-7 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed" data-testid="text-hero-subtitle">
            {t("landingShell.masterHero.subtitle", { brand })}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"><Button size="lg" className="gap-2" data-testid="button-cta-primary">{t("landingShell.masterHero.ctaPrimary")} <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/pricing"><Button size="lg" variant="outline" data-testid="button-cta-secondary">{t("landingShell.masterHero.ctaSecondary")}</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6" data-testid="text-pillars-title">
          {t("landingShell.pillarsTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRODUCT_ORDER.map((id) => {
            const p = PRODUCT_REGISTRY[id];
            const Icon = p.icon;
            const isPilot = p.status !== "live";
            return (
              <Card
                key={id}
                className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 hover-elevate transition-all"
                data-testid={`card-product-${id}`}
              >
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${p.accentFrom}, ${p.accentTo})` }}
                />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {isPilot && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider" data-testid={`badge-status-${id}`}>
                        {t("products.loto.comingSoon")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1" data-testid={`text-product-name-${id}`}>
                    {t(p.nameKey, p.englishName)}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3" data-testid={`text-product-tagline-${id}`}>
                    {t(p.taglineKey, p.englishTagline)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1" data-testid={`text-product-desc-${id}`}>
                    {t(p.descKey, p.englishDesc)}
                  </p>
                  <Link href={p.publicLanding}>
                    <Button
                      variant="ghost"
                      className="mt-5 -ml-3 self-start gap-1.5 font-semibold"
                      style={{ color: p.accentText }}
                      data-testid={`button-learn-${id}`}
                    >
                      {t(`products.${id}.learnMore`, `Learn about ${p.englishName}`)}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6" data-testid="text-audiences-title">
          {t("landingShell.audiencesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="border-slate-200/80 dark:border-slate-800 hover-elevate transition-all" data-testid="card-audience-government">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50" data-testid="text-audience-government-title">
                    {t("landingShell.audienceGovTitle")}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1" data-testid="text-audience-government-tagline">
                    {t("landingShell.audienceGovTagline")}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex gap-2.5" data-testid={`text-audience-gov-bullet-${i}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{t(`landingShell.audienceGovBullet${i}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 dark:border-slate-800 hover-elevate transition-all" data-testid="card-audience-banks">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm shrink-0">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50" data-testid="text-audience-banks-title">
                    {t("landingShell.audienceBanksTitle")}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1" data-testid="text-audience-banks-tagline">
                    {t("landingShell.audienceBanksTagline")}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex gap-2.5" data-testid={`text-audience-banks-bullet-${i}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t(`landingShell.audienceBanksBullet${i}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50" data-testid="text-how-title">
              {t("landingShell.howTitle")}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300" data-testid="text-how-subtitle">
              {t("landingShell.howSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-slate-200/80 dark:border-slate-800" data-testid={`card-how-${n}`}>
                <CardContent className="p-5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 text-sm font-bold flex items-center justify-center mb-3">
                    {n}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-1.5" data-testid={`text-how-step-${n}-title`}>
                    {t(`landingShell.howStep${n}Title`)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed" data-testid={`text-how-step-${n}-body`}>
                    {t(`landingShell.howStep${n}Body`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50" data-testid="text-trust-title">{t("landingShell.trustTitle")}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300" data-testid="text-trust-subtitle">{t("landingShell.trustSubtitle")}</p>
          </div>
          <Link href="/security"><Button variant="outline" className="gap-2" data-testid="button-security"><Shield className="w-4 h-4" />Security</Button></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span data-testid="text-footer-line">{t("landingShell.footerLine", { year, brand })}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-terms">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-privacy">Privacy</Link>
            <Link href="/contact-sales" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
