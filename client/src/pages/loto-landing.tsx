import { useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronRight, Ticket, ScanLine, Activity, Award, Layers, Bell,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import { PRODUCT_REGISTRY } from "@/lib/products";

export default function LotoLandingPage() {
  const { t } = useTranslation();
  const brand = PLATFORM_COMPANY_NAME;
  const p = PRODUCT_REGISTRY.loto;

  useEffect(() => {
    document.title = `${t("loto.pageTitle", "Loto Fiscal")} — ${brand}`;
  }, [brand, t]);

  const features = [
    { icon: ScanLine, titleKey: "loto.feature1Title", bodyKey: "loto.feature1Body" },
    { icon: Activity, titleKey: "loto.feature2Title", bodyKey: "loto.feature2Body" },
    { icon: Award,    titleKey: "loto.feature3Title", bodyKey: "loto.feature3Body" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
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
            <Link href="/login"><Button size="sm" variant="outline" data-testid="button-signin">Sign in</Button></Link>
          </nav>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200/50 dark:border-emerald-900/30">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-9 flex items-center gap-1.5 text-xs text-emerald-900 dark:text-emerald-200">
            <Link href="/" className="hover:underline font-medium" data-testid="link-breadcrumb-home">{brand}</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="font-semibold" data-testid="text-breadcrumb-current">{t("loto.pageTitle", "Loto Fiscal")}</span>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-10 text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
        >
          <Ticket className="w-10 h-10" />
        </div>
        <Badge className="mb-5 bg-emerald-600 hover:bg-emerald-600 text-white" data-testid="badge-pilot">
          {t("products.loto.badge", "Pilot launching Q3 2026")}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]" data-testid="text-page-title">
          {t("loto.pageTitle", "Loto Fiscal")}
        </h1>
        <p className="mt-3 text-base md:text-lg font-medium text-slate-500 dark:text-slate-400" data-testid="text-page-subtitle">
          {t("loto.pageSubtitle")}
        </p>
        <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed" data-testid="text-coming-soon-body">
          {t("loto.comingSoonBody")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact-sales">
            <Button
              size="lg"
              className="gap-2 text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
              data-testid="button-notify-me"
            >
              <Bell className="w-4 h-4" />
              {t("loto.notifyMe")}
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              {t("loto.backHome")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
