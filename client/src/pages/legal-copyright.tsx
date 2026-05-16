import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Download, FileText, Globe, Scale, Lock, BookOpen,
  Building2, AlertTriangle, Gavel, ScrollText, Users, Database,
  Key, Eye, Copyright,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SectionCard({ icon: Icon, title, children, id }: {
  icon: LucideIcon; title: string; children: React.ReactNode; id: string;
}) {
  return (
    <Card className="border-border/50" data-testid={`section-${id}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

export default function LegalCopyrightPage() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const currentLang = i18n.language?.startsWith("fr") ? "fr" : i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("sw") ? "sw" : i18n.language?.startsWith("pt") ? "pt" : "en";

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/copyright/download-pdf?lang=${currentLang}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UCH_Copyright_IP_Protection_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t("legal.downloadFull"), description: t("legal.downloadNote") });
    } catch {
      toast({ title: t("legal.downloadFull"), description: t("common.error", "Download failed"), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="section-banner mb-8 relative z-10">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="page-header-bar" />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="heading-legal">
                <Copyright className="w-6 h-6" />
                {t("legal.title")}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {t("legal.subtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="gap-2"
            data-testid="button-download-copyright-pdf"
          >
            <Download className="w-4 h-4" />
            {downloading ? t("legal.generatingPdf") : t("legal.downloadFull")}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Card className="border-primary/20 bg-primary/5" data-testid="card-copyright-notice">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-10 h-10 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">{t("legal.copyrightNotice")}</h2>
                <p className="text-sm font-semibold text-foreground">
                  © 2026 Universal Credit Hub Ltd — All rights reserved.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Owner: <strong className="text-foreground">Uffe Jon Carlson / Carlson Capital</strong> — Registered in Ghana
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Legal: <a href="mailto:uffe.carlson@gmail.com" className="text-primary hover:underline">uffe.carlson@gmail.com</a>
                  {" · "}+233 552 395548{" · "}+1 646 980 5659
                </p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {t("legal.copyrightDesc")}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" data-testid="badge-confidential">
                    <Lock className="w-3 h-3 mr-1" /> {t("legal.confidential")}
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-proprietary">
                    <Key className="w-3 h-3 mr-1" /> {t("legal.proprietary")}
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-ref">
                    <FileText className="w-3 h-3 mr-1" /> UCH-IP-2026-001
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-jurisdiction">
                    <Globe className="w-3 h-3 mr-1" /> Ghana Copyright Act 2005 (Act 690)
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={FileText} title={t("legal.scopeTitle")} id="scope">
            <p>{t("legal.scopeIntro")}</p>
            <ul className="space-y-1.5 ml-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5 text-[8px]">&#9679;</span>
                  <span>{t(`legal.scope${i}`)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={Building2} title={t("legal.ownershipTitle")} id="ownership">
            <p dangerouslySetInnerHTML={{ __html: t("legal.ownershipP1") }} />
            <p>{t("legal.ownershipP2")}</p>
            <p>{t("legal.ownershipP3")}</p>
          </SectionCard>
        </div>

        <SectionCard icon={Globe} title={t("legal.jurisdictionTitle")} id="jurisdiction">
          <p>{t("legal.jurisdictionIntro")}</p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
            {[
              { flag: "🇬🇭", name: "Ghana", law: "Copyright Act, 2005 (Act 690)" },
              { flag: "🇳🇬", name: "Nigeria", law: "Copyright Act (Cap C28)" },
              { flag: "🇰🇪", name: "Kenya", law: "Copyright Act, 2001" },
              { flag: "🇿🇦", name: "South Africa", law: "Copyright Act 98 of 1978" },
              { flag: "🇷🇼", name: "Rwanda", law: "Law No. 31/2009" },
              { flag: "🇹🇿", name: "Tanzania", law: "Copyright Act No. 7, 1999" },
              { flag: "🇺🇬", name: "Uganda", law: "Copyright Act, Cap. 222" },
              { flag: "🇪🇹", name: "Ethiopia", law: "Proclamation No. 410/2004" },
              { flag: "🇸🇱", name: "Sierra Leone", law: "Copyright Act 2011" },
              { flag: "🇱🇷", name: "Liberia", law: "IP Act 2016, Title 24" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-base">{c.flag}</span>
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground">— {c.law}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <p className="text-xs" dangerouslySetInnerHTML={{ __html: t("legal.jurisdictionIntl") }} />
        </SectionCard>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={Scale} title={t("legal.licensingTitle")} id="licensing">
            <div className="space-y-2">
              {[
                { type: t("legal.licInstitutional"), desc: t("legal.licInstitutionalDesc") },
                { type: t("legal.licGovernment"), desc: t("legal.licGovernmentDesc") },
                { type: t("legal.licTelco"), desc: t("legal.licTelcoDesc") },
                { type: t("legal.licApi"), desc: t("legal.licApiDesc") },
              ].map((lic, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{lic.type}</Badge>
                  <span className="text-xs">{lic.desc}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <p className="text-xs">{t("legal.licNote")}</p>
          </SectionCard>

          <SectionCard icon={AlertTriangle} title={t("legal.restrictionsTitle")} id="restrictions">
            <p>{t("legal.restrictionsIntro")}</p>
            <ul className="space-y-1 ml-1 text-xs">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-[8px]">&#9679;</span>
                  <span>{t(`legal.restrict${i}`)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={Lock} title={t("legal.tradeSecretsTitle")} id="trade-secrets">
            <p>{t("legal.tradeSecretsIntro")}</p>
            <ul className="space-y-1 ml-1 text-xs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 text-[8px]">&#9679;</span>
                  <span>{t(`legal.ts${i}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2">{t("legal.tsNote")}</p>
          </SectionCard>

          <SectionCard icon={Database} title={t("legal.dataProtectionTitle")} id="data-protection">
            <p>{t("legal.dataProtectionP1")}</p>
            <p className="text-xs">{t("legal.dataProtectionIntro")}</p>
            <ul className="space-y-0.5 ml-1 text-xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 text-[8px]">&#9679;</span>
                  <span>{t(`legal.dp${i}`)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard icon={Gavel} title={t("legal.enforcementTitle")} id="enforcement">
          <p>{t("legal.enforcementIntro")}</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {[
              { label: t("legal.enfInjunctive"), desc: t("legal.enfInjunctiveDesc") },
              { label: t("legal.enfCompensatory"), desc: t("legal.enfCompensatoryDesc") },
              { label: t("legal.enfProfits"), desc: t("legal.enfProfitsDesc") },
              { label: t("legal.enfCriminal"), desc: t("legal.enfCriminalDesc") },
              { label: t("legal.enfAdmin"), desc: t("legal.enfAdminDesc") },
              { label: t("legal.enfTechnical"), desc: t("legal.enfTechnicalDesc") },
            ].map((r, i) => (
              <div key={i} className="p-2.5 rounded-md bg-muted/50 border border-border/50">
                <p className="text-xs font-semibold text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={ScrollText} title={t("legal.disputeTitle")} id="disputes">
          <div className="space-y-2">
            <p dangerouslySetInnerHTML={{ __html: t("legal.disputeStep1") }} />
            <p dangerouslySetInnerHTML={{ __html: t("legal.disputeStep2") }} />
            <p dangerouslySetInnerHTML={{ __html: t("legal.disputeStep3") }} />
            <p dangerouslySetInnerHTML={{ __html: t("legal.disputeStep4") }} />
          </div>
          <Separator className="my-3" />
          <p className="text-xs" dangerouslySetInnerHTML={{ __html: t("legal.disputeGoverning") }} />
        </SectionCard>

        <SectionCard icon={Eye} title={t("legal.termTitle")} id="term">
          <p dangerouslySetInnerHTML={{ __html: t("legal.termP1") }} />
          <p>{t("legal.termP2")}</p>
        </SectionCard>

        <Card className="border-muted" data-testid="card-contact">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-muted-foreground shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{t("legal.contactTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Universal Credit Hub Ltd</strong><br />
                  Owner: <strong className="text-foreground">Uffe Jon Carlson / Carlson Capital</strong><br />
                  Registered in Ghana — IP Reference: UCH-IP-2026-001
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Legal / IP enforcement:</span>{" "}
                    <a href="mailto:uffe.carlson@gmail.com" className="text-primary hover:underline">uffe.carlson@gmail.com</a>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Phone (Ghana):</span> +233 552 395548
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Phone (USA):</span> +1 646 980 5659
                  </p>
                  <p className="pt-1 text-muted-foreground/70 italic">{t("legal.contactDesc")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Button
            onClick={handleDownloadPdf}
            disabled={downloading}
            size="lg"
            className="gap-2"
            data-testid="button-download-copyright-pdf-bottom"
          >
            <Download className="w-5 h-5" />
            {downloading ? t("legal.generatingPdf") : t("legal.downloadComplete")}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">{t("legal.downloadNote")}</p>
        </div>
      </div>
    </div>
  );
}
