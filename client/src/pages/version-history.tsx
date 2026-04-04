import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Shield,
  Users,
  CreditCard,
  Search,
  Upload,
  DollarSign,
  FileText,
  Bot,
  Key,
  Smartphone,
  Zap,
  Archive,
  Link2,
  Camera,
  Languages,
  Moon,
  LayoutDashboard,
  Clock,
  Scale,
  FileSpreadsheet,
  Database,
  Building2,
  CheckCircle,
  Brain,
  BarChart3,
  Bell,
  FileCheck,
  BookOpen,
  PanelLeft,
  Palette,
  Wrench,
  MapPin,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type VersionEntry = {
  version: string;
  dateKey: string;
  tagKey: string;
  descriptionKey: string;
  features: {
    icon: LucideIcon;
    titleKey: string;
    descriptionKey: string;
  }[];
};

const versions: VersionEntry[] = [
  {
    version: "v2.5",
    dateKey: "versionHistory.v25.date",
    tagKey: "versionHistory.v25.tag",
    descriptionKey: "versionHistory.v25.description",
    features: [
      { icon: Palette, titleKey: "versionHistory.v25.f1.title", descriptionKey: "versionHistory.v25.f1.desc" },
      { icon: Search, titleKey: "versionHistory.v25.f2.title", descriptionKey: "versionHistory.v25.f2.desc" },
      { icon: FileText, titleKey: "versionHistory.v25.f3.title", descriptionKey: "versionHistory.v25.f3.desc" },
      { icon: Globe, titleKey: "versionHistory.v25.f4.title", descriptionKey: "versionHistory.v25.f4.desc" },
      { icon: Phone, titleKey: "versionHistory.v25.f5.title", descriptionKey: "versionHistory.v25.f5.desc" },
      { icon: Wrench, titleKey: "versionHistory.v25.f6.title", descriptionKey: "versionHistory.v25.f6.desc" },
      { icon: Shield, titleKey: "versionHistory.v25.f7.title", descriptionKey: "versionHistory.v25.f7.desc" },
      { icon: Clock, titleKey: "versionHistory.v25.f8.title", descriptionKey: "versionHistory.v25.f8.desc" },
    ],
  },
  {
    version: "v2.1",
    dateKey: "versionHistory.v21.date",
    tagKey: "versionHistory.v21.tag",
    descriptionKey: "versionHistory.v21.description",
    features: [
      { icon: Brain, titleKey: "versionHistory.v21.f1.title", descriptionKey: "versionHistory.v21.f1.desc" },
      { icon: BarChart3, titleKey: "versionHistory.v21.f2.title", descriptionKey: "versionHistory.v21.f2.desc" },
      { icon: Bell, titleKey: "versionHistory.v21.f3.title", descriptionKey: "versionHistory.v21.f3.desc" },
      { icon: Shield, titleKey: "versionHistory.v21.f4.title", descriptionKey: "versionHistory.v21.f4.desc" },
      { icon: Upload, titleKey: "versionHistory.v21.f5.title", descriptionKey: "versionHistory.v21.f5.desc" },
      { icon: BookOpen, titleKey: "versionHistory.v21.f6.title", descriptionKey: "versionHistory.v21.f6.desc" },
      { icon: PanelLeft, titleKey: "versionHistory.v21.f7.title", descriptionKey: "versionHistory.v21.f7.desc" },
      { icon: FileCheck, titleKey: "versionHistory.v21.f8.title", descriptionKey: "versionHistory.v21.f8.desc" },
    ],
  },
  {
    version: "v2.0",
    dateKey: "versionHistory.v20.date",
    tagKey: "versionHistory.v20.tag",
    descriptionKey: "versionHistory.v20.description",
    features: [
      { icon: FileSpreadsheet, titleKey: "versionHistory.v20.f1.title", descriptionKey: "versionHistory.v20.f1.desc" },
      { icon: Database, titleKey: "versionHistory.v20.f2.title", descriptionKey: "versionHistory.v20.f2.desc" },
      { icon: CheckCircle, titleKey: "versionHistory.v20.f3.title", descriptionKey: "versionHistory.v20.f3.desc" },
      { icon: FileText, titleKey: "versionHistory.v20.f4.title", descriptionKey: "versionHistory.v20.f4.desc" },
      { icon: Shield, titleKey: "versionHistory.v20.f5.title", descriptionKey: "versionHistory.v20.f5.desc" },
      { icon: Building2, titleKey: "versionHistory.v20.f6.title", descriptionKey: "versionHistory.v20.f6.desc" },
      { icon: Scale, titleKey: "versionHistory.v20.f7.title", descriptionKey: "versionHistory.v20.f7.desc" },
      { icon: CreditCard, titleKey: "versionHistory.v20.f8.title", descriptionKey: "versionHistory.v20.f8.desc" },
    ],
  },
  {
    version: "v1.2",
    dateKey: "versionHistory.v12.date",
    tagKey: "versionHistory.v12.tag",
    descriptionKey: "versionHistory.v12.description",
    features: [
      { icon: Languages, titleKey: "versionHistory.v12.f1.title", descriptionKey: "versionHistory.v12.f1.desc" },
      { icon: Globe, titleKey: "versionHistory.v12.f2.title", descriptionKey: "versionHistory.v12.f2.desc" },
      { icon: DollarSign, titleKey: "versionHistory.v12.f3.title", descriptionKey: "versionHistory.v12.f3.desc" },
      { icon: FileText, titleKey: "versionHistory.v12.f4.title", descriptionKey: "versionHistory.v12.f4.desc" },
      { icon: Users, titleKey: "versionHistory.v12.f5.title", descriptionKey: "versionHistory.v12.f5.desc" },
      { icon: Moon, titleKey: "versionHistory.v12.f6.title", descriptionKey: "versionHistory.v12.f6.desc" },
      { icon: Smartphone, titleKey: "versionHistory.v12.f7.title", descriptionKey: "versionHistory.v12.f7.desc" },
      { icon: Clock, titleKey: "versionHistory.v12.f8.title", descriptionKey: "versionHistory.v12.f8.desc" },
      { icon: Scale, titleKey: "versionHistory.v12.f9.title", descriptionKey: "versionHistory.v12.f9.desc" },
    ],
  },
  {
    version: "v1.1",
    dateKey: "versionHistory.v11.date",
    tagKey: "versionHistory.v11.tag",
    descriptionKey: "versionHistory.v11.description",
    features: [
      { icon: Shield, titleKey: "versionHistory.v11.f1.title", descriptionKey: "versionHistory.v11.f1.desc" },
      { icon: Search, titleKey: "versionHistory.v11.f2.title", descriptionKey: "versionHistory.v11.f2.desc" },
      { icon: Bot, titleKey: "versionHistory.v11.f3.title", descriptionKey: "versionHistory.v11.f3.desc" },
      { icon: Key, titleKey: "versionHistory.v11.f4.title", descriptionKey: "versionHistory.v11.f4.desc" },
      { icon: Zap, titleKey: "versionHistory.v11.f5.title", descriptionKey: "versionHistory.v11.f5.desc" },
      { icon: Upload, titleKey: "versionHistory.v11.f6.title", descriptionKey: "versionHistory.v11.f6.desc" },
      { icon: DollarSign, titleKey: "versionHistory.v11.f7.title", descriptionKey: "versionHistory.v11.f7.desc" },
      { icon: Archive, titleKey: "versionHistory.v11.f8.title", descriptionKey: "versionHistory.v11.f8.desc" },
      { icon: Link2, titleKey: "versionHistory.v11.f9.title", descriptionKey: "versionHistory.v11.f9.desc" },
      { icon: Search, titleKey: "versionHistory.v11.f10.title", descriptionKey: "versionHistory.v11.f10.desc" },
      { icon: Camera, titleKey: "versionHistory.v11.f11.title", descriptionKey: "versionHistory.v11.f11.desc" },
    ],
  },
  {
    version: "v1.0",
    dateKey: "versionHistory.v10.date",
    tagKey: "versionHistory.v10.tag",
    descriptionKey: "versionHistory.v10.description",
    features: [
      { icon: Shield, titleKey: "versionHistory.v10.f1.title", descriptionKey: "versionHistory.v10.f1.desc" },
      { icon: Users, titleKey: "versionHistory.v10.f2.title", descriptionKey: "versionHistory.v10.f2.desc" },
      { icon: CreditCard, titleKey: "versionHistory.v10.f3.title", descriptionKey: "versionHistory.v10.f3.desc" },
      { icon: FileText, titleKey: "versionHistory.v10.f4.title", descriptionKey: "versionHistory.v10.f4.desc" },
      { icon: Scale, titleKey: "versionHistory.v10.f5.title", descriptionKey: "versionHistory.v10.f5.desc" },
      { icon: LayoutDashboard, titleKey: "versionHistory.v10.f6.title", descriptionKey: "versionHistory.v10.f6.desc" },
      { icon: Globe, titleKey: "versionHistory.v10.f7.title", descriptionKey: "versionHistory.v10.f7.desc" },
      { icon: CreditCard, titleKey: "versionHistory.v10.f8.title", descriptionKey: "versionHistory.v10.f8.desc" },
      { icon: Shield, titleKey: "versionHistory.v10.f9.title", descriptionKey: "versionHistory.v10.f9.desc" },
    ],
  },
];

export default function VersionHistoryPage() {
  const { t } = useTranslation();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-version-history-title">
          {t("versionHistory.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-version-history-subtitle">
          {t("versionHistory.subtitle")}
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

        <div className="space-y-8">
          {versions.map((ver, vi) => (
            <div key={ver.version} className="relative sm:pl-12" data-testid={`version-entry-${ver.version}`}>
              <div className="hidden sm:flex absolute left-0 top-3 w-8 h-8 rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-bold z-10">
                {vi + 1}
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg sm:text-xl" data-testid={`text-version-${ver.version}`}>
                      {ver.version}
                    </CardTitle>
                    <Badge variant={vi === 0 ? "default" : "secondary"} className="text-[10px]">
                      {t(ver.tagKey)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{t(ver.dateKey)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(ver.descriptionKey)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ver.features.map((feat, fi) => (
                      <div
                        key={fi}
                        className="flex gap-3 p-3 rounded-lg border bg-muted/30"
                        data-testid={`feature-${ver.version}-${fi}`}
                      >
                        <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <feat.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{t(feat.titleKey)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t(feat.descriptionKey)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
