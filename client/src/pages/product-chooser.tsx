import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PRODUCT_ORDER,
  PRODUCT_REGISTRY,
  getAccessibleProducts,
  writeActiveProduct,
  type ProductDefinition,
} from "@/lib/products";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

export default function ProductChooserPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const brand = PLATFORM_COMPANY_NAME;

  const accessibleIds = useMemo(() => {
    const list = getAccessibleProducts(user?.role);
    return new Set(list.map((p) => p.id));
  }, [user?.role]);

  useEffect(() => {
    document.title = `${t("chooser.welcome")} — ${brand}`;
  }, [brand, t]);

  const choose = (p: ProductDefinition) => {
    if (!accessibleIds.has(p.id)) return;
    writeActiveProduct(p.id);
    setLocation(p.primaryAuthRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Platform</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50" data-testid="text-welcome">
          {t("chooser.welcome")}
          {user?.fullName ? <span className="text-slate-400">, {user.fullName.split(" ")[0]}</span> : null}
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300" data-testid="text-subtitle">
          {t("chooser.subtitle")}
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRODUCT_ORDER.map((id) => {
            const p = PRODUCT_REGISTRY[id];
            const Icon = p.icon;
            const accessible = accessibleIds.has(id);
            const isPilot = p.status !== "live";
            return (
              <Card
                key={id}
                className={`relative overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all ${
                  accessible ? "hover-elevate cursor-pointer" : "opacity-60"
                }`}
                onClick={() => accessible && choose(p)}
                data-testid={`card-chooser-${id}`}
              >
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${p.accentFrom}, ${p.accentTo})` }} />
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
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1" data-testid={`text-chooser-name-${id}`}>
                    {t(p.nameKey, p.englishName)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3" data-testid={`text-chooser-tagline-${id}`}>
                    {t(p.taglineKey, p.englishTagline)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1" data-testid={`text-chooser-desc-${id}`}>
                    {t(p.descKey, p.englishDesc)}
                  </p>
                  <div className="mt-5">
                    {accessible ? (
                      <Button
                        className="gap-2 text-white"
                        style={{ background: `linear-gradient(135deg, ${p.accentFrom}, ${p.accentTo})` }}
                        onClick={(e) => { e.stopPropagation(); choose(p); }}
                        data-testid={`button-enter-${id}`}
                      >
                        {t(`products.${id}.enter`, `Enter ${p.englishName}`)}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" data-testid={`text-locked-${id}`}>
                        <Lock className="w-3.5 h-3.5" />
                        {t("chooser.locked")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400" data-testid="text-tip">
          {t("chooser.tip")}
        </p>
      </section>
    </div>
  );
}
