import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Layers, Play, Shield, ShieldCheck, Sparkles, Landmark, Banknote, CheckCircle2, FileSearch, LockKeyhole, UserCheck, FileCheck2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PRODUCT_ORDER, PRODUCT_REGISTRY } from "@/lib/products";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

const platformDemoVideo = "/marketing/platform-demo.mp4";

export default function MasterLandingPage() {
  const { t, i18n } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const year = new Date().getFullYear();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const pillars = [
    ...PRODUCT_ORDER.map((id) => ({ ...PRODUCT_REGISTRY[id], kind: "product" as const })),
    {
      id: "forensics",
      kind: "service" as const,
      name: t("landingShell.forensics.name"),
      tagline: t("landingShell.forensics.tagline"),
      description: t("landingShell.forensics.description"),
      action: t("landingShell.forensics.action"),
      href: "/forensics",
      icon: FileSearch,
      accentFrom: "hsl(340 70% 48%)",
      accentTo: "hsl(12 85% 52%)",
      accentText: "hsl(340 62% 38%)",
    },
  ];

  useEffect(() => {
    document.title = i18n.resolvedLanguage?.startsWith("fr")
      ? `${brand} — Opérations de risque bancaire maîtrisées`
      : `${brand} — Controlled Bank Risk Operations`;
  }, [brand, i18n.resolvedLanguage]);

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
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><Link href="/for-lenders" data-testid="link-for-lenders">For Lenders</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><Link href="/for-regulators" data-testid="link-for-regulators">For Regulators</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex"><Link href="/forensics" data-testid="link-forensics">Diagnostic</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><Link href="/financial-inclusion" data-testid="link-impact">Impact</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex"><Link href="/contact-sales" data-testid="link-pricing">Pricing</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex"><Link href="/press" data-testid="link-press">Press</Link></Button>
            <ThemeToggle />
            <LanguageSwitcher />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/contact-sales" data-testid="button-header-diagnostic">{t("landingShell.ctaDiagnostic")}</Link></Button>
            <Button asChild size="sm"><Link href="/login" data-testid="button-signin">{t("landingShell.masterHero.ctaPrimary")}</Link></Button>
          </nav>
        </div>
      </header>

      <main>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="text-center lg:text-left">
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
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button asChild size="lg" className="gap-2"><Link href="/contact-sales" data-testid="cta-request-diagnostic">{t("landingShell.ctaDiagnostic")} <ArrowRight className="w-4 h-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="gap-2"><Link href="/demo" data-testid="cta-explore-demo">{t("landingShell.ctaDemo")} <ArrowRight className="w-4 h-4" /></Link></Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300 lg:justify-start" data-testid="landing-trust-signals">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-3.5 text-emerald-600" />{t("landingShell.trustSignal1")}</span>
            <span className="inline-flex items-center gap-1.5"><UserCheck className="size-3.5 text-emerald-600" />{t("landingShell.trustSignal2")}</span>
            <span className="inline-flex items-center gap-1.5"><FileCheck2 className="size-3.5 text-emerald-600" />{t("landingShell.trustSignal3")}</span>
          </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl dark:border-slate-700" data-testid="landing-video-panel">
            {!videoUnavailable ? (
              <>
                <video
                  ref={videoRef}
                  src={videoRequested ? platformDemoVideo : undefined}
                  playsInline
                  preload="none"
                  controls={videoPlaying}
                  className="aspect-video w-full bg-slate-950 object-cover"
                  data-testid="video-platform-demo"
                  onEnded={() => setVideoPlaying(false)}
                  onError={() => setVideoUnavailable(true)}
                  onCanPlay={() => {
                    if (videoRequested && videoPlaying) {
                      videoRef.current?.play().catch(() => setVideoPlaying(false));
                    }
                  }}
                >
                  <track
                    kind="captions"
                    src="/marketing/platform-demo.en.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                </video>
                {!videoPlaying && (
                  <button
                    type="button"
                    aria-label={t("landingShell.video.play")}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 p-6 text-center transition-colors hover:bg-slate-950/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                    onClick={() => {
                      setVideoRequested(true);
                      setVideoPlaying(true);
                    }}
                    data-testid="button-play-landing-video"
                  >
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-xl transition-transform group-hover:scale-105"><Play className="ml-1 size-7" /></span>
                    <span className="mt-4 text-base font-semibold text-white">{t("landingShell.video.title")}</span>
                    <span className="mt-1 max-w-sm text-sm text-slate-200">{t("landingShell.video.subtitle")}</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center p-8 text-center text-white">
                <Play className="size-8 text-slate-300" />
                <p className="mt-3 font-semibold">{t("landingShell.video.unavailable")}</p>
                <p className="mt-1 text-sm text-slate-300">{t("landingShell.video.unavailableDetail")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 text-center mb-6" data-testid="text-pillars-title">
          {t("landingShell.pillarsTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isPilot = p.kind === "product" && p.status !== "live";
            return (
              <Card
                key={p.id}
                className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 hover-elevate transition-all"
                data-testid={`card-product-${p.id}`}
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
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider" data-testid={`badge-status-${p.id}`}>
                        {t("products.loto.comingSoon")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1" data-testid={`text-product-name-${p.id}`}>
                    {p.kind === "product" ? t(p.nameKey, p.englishName) : p.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3" data-testid={`text-product-tagline-${p.id}`}>
                    {p.kind === "product" ? t(p.taglineKey, p.englishTagline) : p.tagline}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1" data-testid={`text-product-desc-${p.id}`}>
                    {p.kind === "product" ? t(p.descKey, p.englishDesc) : p.description}
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    className="mt-5 -ml-3 self-start gap-1.5 font-semibold"
                    style={{ color: p.accentText }}
                    data-testid={`button-learn-${p.id}`}
                  >
                    <Link href={p.kind === "product" ? p.publicLanding : p.href}>
                      {p.kind === "product" ? t(`products.${p.id}.learnMore`, `Learn about ${p.englishName}`) : p.action}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">{t("landingShell.adoptionEyebrow")}</p>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-adoption-title">{t("landingShell.adoptionTitle")}</h2>
            <p className="mt-3 text-slate-300" data-testid="text-adoption-subtitle">{t("landingShell.adoptionSubtitle")}</p>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-white/15 bg-white/5 p-5" data-testid={`card-adoption-${n}`}>
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-400 font-bold text-slate-950">{n}</div>
                <h3 className="mt-4 font-bold">{t(`landingShell.adoptionStep${n}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(`landingShell.adoptionStep${n}Body`)}</p>
              </div>
            ))}
          </div>
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
          <Button asChild variant="outline" className="gap-2"><Link href="/security" data-testid="button-security"><Shield className="w-4 h-4" />Security</Link></Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50" data-testid="text-faq-title">{t("landingShell.faqTitle")}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{t("landingShell.faqSubtitle")}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Card key={n} className="border-slate-200/80 dark:border-slate-800" data-testid={`card-faq-${n}`}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">{t(`landingShell.faq${n}Question`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(`landingShell.faq${n}Answer`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4" />
            <span data-testid="text-footer-line">{t("landingShell.footerLine", { year, brand })}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/for-lenders" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-footer-for-lenders">For Lenders</Link>
            <Link href="/for-regulators" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-footer-for-regulators">For Regulators</Link>
            <Link href="/financial-inclusion" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-footer-impact">Impact</Link>
            <Link href="/press" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-footer-press">Press</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-terms">Terms</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-privacy">Privacy</Link>
            <Link href="/contact-sales" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" data-testid="link-contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
