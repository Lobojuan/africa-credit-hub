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
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/copyright/download-pdf");
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CDH_Copyright_IP_Protection_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: "Copyright document PDF is downloading." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" });
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
                Legal & Copyright
              </h1>
              <p className="text-white/70 text-sm mt-1">
                Intellectual Property Protection — Pan-African Credit Data Hub
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
            {downloading ? "Generating PDF..." : "Download Full Document"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Card className="border-primary/20 bg-primary/5" data-testid="card-copyright-notice">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-10 h-10 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">Copyright Notice</h2>
                <p className="text-sm font-semibold text-foreground">
                  &copy; 2024–2026 Carlson Capital & Systems In Motion Limited. All Rights Reserved.
                </p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  The Pan-African Credit Data Hub (CDH) v2.5, including all source code, object code,
                  algorithms, user interfaces, database schemas, documentation, and related materials,
                  is the exclusive intellectual property of Carlson Capital & Systems In Motion Limited.
                  No part of this software may be reproduced, distributed, modified, reverse-engineered,
                  or transmitted without prior written consent.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" data-testid="badge-confidential">
                    <Lock className="w-3 h-3 mr-1" /> Confidential
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-proprietary">
                    <Key className="w-3 h-3 mr-1" /> Proprietary
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-ref">
                    <FileText className="w-3 h-3 mr-1" /> CDH-IP-2026-001
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={FileText} title="Scope of Protection" id="scope">
            <p>Copyright protection covers all components of the Platform:</p>
            <ul className="space-y-1.5 ml-1">
              {[
                "Multi-country credit bureau management system",
                "Telco credit scoring engine & lending lifecycle",
                "Proprietary algorithms (NDIA scoring, entity matching)",
                "User interface designs (Pan-African & Scandinavian themes)",
                "Database architecture & schema designs",
                "API specifications & integration protocols",
                "All documentation & training materials",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5 text-[8px]">&#9679;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={Building2} title="Ownership" id="ownership">
            <p>
              All rights, title, and interest in the Platform are the <strong className="text-foreground">exclusive
              property of Carlson Capital & Systems In Motion Limited</strong>, incorporated in the Republic of Ghana.
            </p>
            <p>
              No transfer of ownership shall be implied from any license agreement, service contract,
              or deployment arrangement unless expressly stated in a separate written agreement.
            </p>
            <p>
              Works created by employees, contractors, or consultants in the course of developing the
              Platform are "works made for hire" with copyright vesting in the Company.
            </p>
          </SectionCard>
        </div>

        <SectionCard icon={Globe} title="Jurisdictional Coverage" id="jurisdiction">
          <p>Copyright protection is claimed under the laws of the following jurisdictions:</p>
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
          <p className="text-xs">
            <strong className="text-foreground">International:</strong> Berne Convention, WIPO Copyright Treaty (WCT),
            TRIPS Agreement, ARIPO (Banjul Protocol), OAPI (Bangui Agreement), African Continental Free Trade Area (AfCFTA).
          </p>
        </SectionCard>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={Scale} title="License Categories" id="licensing">
            <div className="space-y-2">
              {[
                { type: "Institutional", desc: "Banks, credit bureaus, and financial institutions" },
                { type: "Government", desc: "Central banks and regulatory bodies" },
                { type: "Telco Partner", desc: "Telecommunications companies for scoring & lending APIs" },
                { type: "API Integration", desc: "Third-party systems connecting via REST APIs" },
              ].map((lic, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{lic.type}</Badge>
                  <span className="text-xs">{lic.desc}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <p className="text-xs">
              All access is granted exclusively through written license agreements.
              No license is implied by possession, demonstration, or evaluation.
            </p>
          </SectionCard>

          <SectionCard icon={AlertTriangle} title="Restrictions" id="restrictions">
            <p>Unless expressly authorized in writing, no Licensee may:</p>
            <ul className="space-y-1 ml-1 text-xs">
              {[
                "Copy, reproduce, or duplicate source code or components",
                "Reverse-engineer, decompile, or derive source code",
                "Modify, adapt, or create derivative works",
                "Sublicense, rent, lease, or transfer access",
                "Remove or alter copyright notices or trademarks",
                "Use the Platform to develop competing products",
                "Disclose confidential architectural or algorithm details",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive mt-1 text-[8px]">&#9679;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard icon={Lock} title="Trade Secrets" id="trade-secrets">
            <p>Trade secret protection is asserted over:</p>
            <ul className="space-y-1 ml-1 text-xs">
              {[
                "Credit scoring algorithms and model parameters",
                "Telco behavioral scoring dimensions and thresholds",
                "Entity matching probability models",
                "Security architecture and encryption schemes",
                "Database optimization and indexing strategies",
                "Regulatory compliance logic configurations",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 text-[8px]">&#9679;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2">
              Protection maintained through role-based access controls, encrypted communications,
              repository restrictions, and NDA requirements.
            </p>
          </SectionCard>

          <SectionCard icon={Database} title="Database Rights & Data Protection" id="data-protection">
            <p>
              The structural design and organization of all databases constitute original compilations
              protected by copyright. Sui generis database rights are asserted over databases populated
              through substantial investment.
            </p>
            <p className="text-xs">Compliance maintained with:</p>
            <ul className="space-y-0.5 ml-1 text-xs">
              {[
                "Ghana Data Protection Act, 2012 (Act 843)",
                "Nigeria Data Protection Act 2023",
                "Kenya Data Protection Act, 2019",
                "South Africa POPIA (Act 4 of 2013)",
                "Malabo Convention on Cyber Security",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 text-[8px]">&#9679;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard icon={Gavel} title="Enforcement & Remedies" id="enforcement">
          <p>The Company shall vigorously enforce its intellectual property rights. Available remedies include:</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {[
              { label: "Injunctive Relief", desc: "Court orders to halt infringing activity" },
              { label: "Compensatory Damages", desc: "Recovery for actual losses suffered" },
              { label: "Account of Profits", desc: "Disgorgement of infringer profits" },
              { label: "Criminal Prosecution", desc: "Referral for willful infringement" },
              { label: "Administrative Action", desc: "Complaints to IP offices and commissions" },
              { label: "Technical Measures", desc: "License revocation and DRM enforcement" },
            ].map((r, i) => (
              <div key={i} className="p-2.5 rounded-md bg-muted/50 border border-border/50">
                <p className="text-xs font-semibold text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={ScrollText} title="Dispute Resolution & Governing Law" id="disputes">
          <div className="space-y-2">
            <p><strong className="text-foreground">Step 1 — Negotiation:</strong> Good-faith negotiation within 30 days of written notice.</p>
            <p><strong className="text-foreground">Step 2 — Mediation:</strong> Under Ghana Alternative Dispute Resolution Act, 2010 (Act 798).</p>
            <p><strong className="text-foreground">Step 3 — Arbitration:</strong> Binding arbitration via Ghana Arbitration Centre or Kigali International Arbitration Centre (KIAC) for East African disputes.</p>
            <p><strong className="text-foreground">Step 4 — Litigation:</strong> Injunctive relief from any court of competent jurisdiction at any time.</p>
          </div>
          <Separator className="my-3" />
          <p className="text-xs">
            <strong className="text-foreground">Governing Law:</strong> Laws of the Republic of Ghana, without regard to conflict of law principles.
          </p>
        </SectionCard>

        <SectionCard icon={Eye} title="Term & Duration" id="term">
          <p>
            Under Ghana's Copyright Act, 2005, copyright in a work made by a body corporate endures for
            <strong className="text-foreground"> seventy (70) years</strong> from the date of first publication.
            First publication date: <strong className="text-foreground">January 2024</strong>.
          </p>
          <p>
            Trade secret protection continues indefinitely for so long as the information remains
            confidential and derives economic value from its secrecy.
          </p>
        </SectionCard>

        <Card className="border-muted" data-testid="card-contact">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-muted-foreground shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Contact — Intellectual Property Department</h3>
                <p className="text-sm text-muted-foreground">
                  Carlson Capital & Systems In Motion Limited<br />
                  Accra, Republic of Ghana
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  For licensing inquiries, copyright matters, or infringement reports, please contact the
                  Company through official channels.
                </p>
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
            {downloading ? "Generating PDF..." : "Download Complete Copyright Document (PDF)"}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            The downloadable PDF contains the full 15-section legal document with signature pages.
          </p>
        </div>
      </div>
    </div>
  );
}
