import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, ScanLine, Activity, Award, Bell } from "lucide-react";
import { PRODUCT_REGISTRY } from "@/lib/products";

export default function LotoWorkspacePage() {
  const { t } = useTranslation();
  const loto = PRODUCT_REGISTRY.loto;
  const Icon = Ticket;

  useEffect(() => {
    document.title = `${t("products.loto.name", loto.englishName)} — ${t("products.loto.badge", loto.englishBadge ?? "")}`;
  }, [t, loto]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto" data-testid="page-loto-workspace">
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${loto.accentFrom}, ${loto.accentTo})` }}
        >
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-loto-title">
              {t("products.loto.name", loto.englishName)}
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
              data-testid="badge-loto-status"
            >
              {t("products.loto.badge", loto.englishBadge ?? "Pilot launching Q3 2026")}
            </Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground" data-testid="text-loto-subtitle">
            {t("loto.pageSubtitle")}
          </p>
        </div>
      </div>

      <Card className="mb-6 border-dashed">
        <CardContent className="p-6 md:p-8 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
          <h2 className="text-lg md:text-xl font-semibold mb-2" data-testid="text-loto-coming-soon-title">
            {t("loto.comingSoonTitle")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto" data-testid="text-loto-coming-soon-body">
            {t("loto.comingSoonBody")}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: ScanLine, titleKey: "loto.feature1Title", bodyKey: "loto.feature1Body" },
          { icon: Activity, titleKey: "loto.feature2Title", bodyKey: "loto.feature2Body" },
          { icon: Award, titleKey: "loto.feature3Title", bodyKey: "loto.feature3Body" },
        ].map((f, i) => {
          const FIcon = f.icon;
          return (
            <Card key={i} data-testid={`card-loto-feature-${i + 1}`}>
              <CardContent className="p-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3"
                  style={{ background: `linear-gradient(135deg, ${loto.accentFrom}, ${loto.accentTo})` }}
                >
                  <FIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">{t(f.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.bodyKey)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
