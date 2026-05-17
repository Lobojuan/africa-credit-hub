import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download, BookOpen, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#0d9488";
const GOLD = "#f59e0b";

interface PlaybookMeta {
  market: string;
  title: string;
  flag: string;
  region: string;
  summary: string;
  regulator: string;
  pdfFile: string;
  currency: string;
  viewUrl: string | null;
}

const PLAYBOOKS: PlaybookMeta[] = [
  {
    market: "ghana",
    title: "Ghana Demo Playbook",
    flag: "🇬🇭",
    region: "West Africa",
    summary: "Africa's largest gold producer; Bank of Ghana CRB regulatory framework; 34M population with growing digital finance ecosystem.",
    regulator: "Bank of Ghana",
    pdfFile: "ghana-demo-playbook.pdf",
    currency: "GHS",
    viewUrl: "/sales/ghana-playbook",
  },
  {
    market: "nigeria",
    title: "Nigeria Demo Playbook",
    flag: "🇳🇬",
    region: "West Africa",
    summary: "Africa's largest economy; CBN credit bureau framework with BVN biometric integration; 220M+ population driving fintech growth.",
    regulator: "Central Bank of Nigeria",
    pdfFile: "nigeria-demo-playbook.pdf",
    currency: "NGN",
    viewUrl: "/sales/nigeria-playbook",
  },
  {
    market: "kenya",
    title: "Kenya Demo Playbook",
    flag: "🇰🇪",
    region: "East Africa",
    summary: "East Africa's fintech hub; CBK-licensed CRB ecosystem with M-Pesa mobile money integration; 55M population leading digital lending.",
    regulator: "Central Bank of Kenya",
    pdfFile: "kenya-demo-playbook.pdf",
    currency: "KES",
    viewUrl: "/sales/kenya-playbook",
  },
  {
    market: "civ",
    title: "Côte d'Ivoire Demo Playbook",
    flag: "🇨🇮",
    region: "UEMOA / West Africa",
    summary: "UEMOA's largest economy; BCEAO regulatory framework; Loto Fiscal DGI integration; key gateway to francophone African markets.",
    regulator: "BCEAO / UEMOA",
    pdfFile: "civ-demo-playbook.pdf",
    currency: "XOF",
    viewUrl: "/sales/cotedivoire-playbook",
  },
  {
    market: "south-africa",
    title: "South Africa Demo Playbook",
    flag: "🇿🇦",
    region: "Southern Africa",
    summary: "Africa's most developed financial market; SARB-licensed credit bureau ecosystem; 60M population with sophisticated banking infrastructure.",
    regulator: "South African Reserve Bank",
    pdfFile: "south-africa-demo-playbook.pdf",
    currency: "ZAR",
    viewUrl: "/sales/south-africa-playbook",
  },
  {
    market: "egypt",
    title: "Egypt Demo Playbook",
    flag: "🇪🇬",
    region: "North Africa",
    summary: "North Africa's largest economy; CBE digital banking transformation; 105M population with Fawry instant-payments infrastructure.",
    regulator: "Central Bank of Egypt",
    pdfFile: "egypt-demo-playbook.pdf",
    currency: "EGP",
    viewUrl: null,
  },
  {
    market: "ethiopia",
    title: "Ethiopia Demo Playbook",
    flag: "🇪🇹",
    region: "East Africa",
    summary: "Fastest-growing African economy; NBE financial inclusion drive; 120M+ population with telebirr mobile money expansion.",
    regulator: "National Bank of Ethiopia",
    pdfFile: "ethiopia-demo-playbook.pdf",
    currency: "ETB",
    viewUrl: null,
  },
];

export default function PlaybookIndexPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const role = user?.role;
  if (role !== "super_admin" && role !== "platform_owner") {
    return <Redirect to="/dashboard" />;
  }

  async function handleDownload(pb: PlaybookMeta) {
    setDownloading(pb.market);
    try {
      const res = await fetch(`/api/sales/playbooks/${pb.market}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UCH-${pb.title.replace(/ Demo Playbook$/, "").replace(/\s+/g, "-")}-Demo-Playbook.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: `${pb.title} saved to your downloads folder.` });
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0f766e 100%)` }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-white opacity-90" />
            <Badge
              className="text-xs font-semibold uppercase tracking-wider border-0"
              style={{ background: GOLD, color: "#1a1a1a" }}
            >
              Sales Playbooks
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="heading-playbook-index">
            Market Demo Playbooks
          </h1>
          <p className="text-teal-100 text-base max-w-2xl">
            Confidential sales materials for each market. Download the PDF for your upcoming pitch or investor meeting.
          </p>
          <div className="mt-4 flex items-center gap-2 text-teal-200 text-sm">
            <Globe className="h-4 w-4" />
            <span>{PLAYBOOKS.length} markets available — May 2026</span>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: GOLD }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {PLAYBOOKS.map((pb) => (
            <Card
              key={pb.market}
              className="border border-border/60 hover:border-teal-400/60 hover:shadow-md transition-all duration-200 flex flex-col"
              data-testid={`card-playbook-${pb.market}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none" aria-hidden="true">{pb.flag}</span>
                    <div>
                      <h2 className="font-semibold text-foreground text-base leading-tight" data-testid={`text-title-${pb.market}`}>
                        {pb.title}
                      </h2>
                      <span className="text-xs text-muted-foreground mt-0.5 block">{pb.region}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 font-mono">
                    {pb.currency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1" data-testid={`text-summary-${pb.market}`}>
                  {pb.summary}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span>Regulator: <span className="font-medium text-foreground">{pb.regulator}</span></span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 gap-2 text-white"
                    style={{ background: TEAL }}
                    onClick={() => handleDownload(pb)}
                    disabled={downloading === pb.market}
                    data-testid={`button-download-${pb.market}`}
                  >
                    <Download className="h-4 w-4" />
                    {downloading === pb.market ? "Generating…" : "Download PDF"}
                  </Button>
                  {pb.viewUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      data-testid={`link-view-${pb.market}`}
                    >
                      <a href={pb.viewUrl}>View</a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      data-testid={`link-view-${pb.market}`}
                      title="In-platform viewer coming soon — use PDF download"
                    >
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border/50 bg-muted/30 px-6 py-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> New market playbooks added to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">exports/</code> are automatically included here — no code changes needed.
          Downloads are audit-logged. This page is restricted to super-admin and platform-owner accounts.
        </div>
      </div>
    </div>
  );
}
