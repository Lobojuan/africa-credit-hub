import { useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ChevronRight, Package, Search, ShieldCheck, FileCheck2, Globe, Trophy, Layers,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { PRODUCT_REGISTRY } from "@/lib/products";

export default function CollateralLandingPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const p = PRODUCT_REGISTRY.collateral;

  useEffect(() => {
    document.title = `${t("products.collateral.name", "Collateral Registry")} — ${brand}`;
  }, [brand, t]);

  const features = [
    { icon: Trophy,      titleKey: "collateralLanding.feature1Title", bodyKey: "collateralLanding.feature1Body" },
    { icon: ShieldCheck, titleKey: "collateralLanding.feature2Title", bodyKey: "collateralLanding.feature2Body" },
    { icon: FileCheck2,  titleKey: "collateralLanding.feature3Title", bodyKey: "collateralLanding.feature3Body" },
    { icon: Globe,       titleKey: "collateralLanding.feature4Title", bodyKey: "collateralLanding.feature4Body" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur-sm bg-white/80 dark:bg-slate-950/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-platform">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">Platform</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/login"><Button size="sm" data-testid="button-signin">{t("collateralLanding.ctaPrimary")}</Button></Link>
          </nav>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200/50 dark:border-amber-900/30">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-9 flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
            <Link href="/" className="hover:underline font-medium" data-testid="link-breadcrumb-home">{brand}</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="font-semibold" data-testid="text-breadcrumb-current">{t("products.collateral.name", "Collateral Registry")}</span>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-12 md:pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-5 text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" data-testid="badge-eyebrow">
            <Package className="w-3 h-3 mr-1.5" />
            {t("collateralLanding.eyebrow")}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05] whitespace-pre-line" data-testid="text-hero-title">
            {t("collateralLanding.heroTitle")}
          </h1>
          <p className="mt-5 md:mt-7 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed" data-testid="text-hero-subtitle">
            {t("collateralLanding.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="gap-2 text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
                data-testid="button-cta-primary"
              >
                {t("collateralLanding.ctaPrimary")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-cta-secondary">
                <Search className="w-4 h-4" />
                {t("collateralLanding.ctaSecondary")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="border-slate-200/80 dark:border-slate-800 hover-elevate" data-testid={`card-feature-${i}`}>
                <CardContent className="p-6">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm mb-4"
                    style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1.5" data-testid={`text-feature-title-${i}`}>
                    {t(f.titleKey)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed" data-testid={`text-feature-body-${i}`}>
                    {t(f.bodyKey)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("landingShell.footerLine", { year: new Date().getFullYear(), brand })}
        </div>
      </footer>
    </div>
  );
}
