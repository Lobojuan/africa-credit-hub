import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrandColors } from "@/hooks/use-brand-colors";
import {
  Shield,
  Globe,
  Building2,
  Users,
  Target,
  Award,
  Scale,
  Landmark,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Heart,
  Lightbulb,
  Lock,
  Layers,
  Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function StatBlock({ value, label }: { value: string; label: string }) {
  const brandColors = useBrandColors();
  return (
    <div className="text-center px-3">
      <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ background: brandColors.textGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] mt-1 font-medium">{label}</p>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  const brandColors = useBrandColors();
  return (
    <Card className="group hover-elevate border-border/50 transition-all duration-300" data-testid={`card-value-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: brandColors.iconGradientSubtle }}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h4 className="font-semibold text-sm mb-2">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ year, title, description }: { year: string; title: string; description: string }) {
  const brandColors = useBrandColors();
  return (
    <div className="flex gap-4" data-testid={`timeline-${year}`}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: brandColors.headerGradient }}>
          {year.slice(-2)}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-8">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{year}</p>
        <h4 className="font-semibold text-sm mt-1">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
  );
}

function TeamCard({ name, role, icon: Icon }: { name: string; role: string; icon: LucideIcon }) {
  const brandColors = useBrandColors();
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card" data-testid={`team-${role.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: brandColors.iconGradientSubtle }}>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{role}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();
  const brandColors = useBrandColors();

  return (
    <div className="min-h-screen pb-16">
      <div className="relative overflow-hidden rounded-2xl mx-4 mt-4 mb-8" style={{ background: brandColors.heroGradient }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]" style={{ backgroundImage: brandColors.heroDotPattern, backgroundSize: "50px 50px" }} />
          <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: brandColors.glowA }} />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: brandColors.glowB }} />
        </div>

        <div className="relative z-10 px-6 sm:px-10 py-12 sm:py-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: brandColors.iconGradient, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Badge className="mb-4 text-[10px] px-3 py-0.5 bg-card/10 text-white/80 border-white/10 hover:bg-card/10">
            Est. 2024
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.15]">
            Carlson Capital &<br />Systems In Motion Limited
          </h1>
          <p className="text-white/50 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
            Building Africa's definitive credit information infrastructure — one country, one institution, one borrower at a time.
          </p>
          <div className="flex justify-center gap-8 sm:gap-12 mt-8">
            <StatBlock value="54" label="Countries" />
            <StatBlock value="42+" label="Currencies" />
            <StatBlock value="v2.0" label="Platform" />
            <StatBlock value="5" label="Languages" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-14">

        <section data-testid="section-mission">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Our Mission</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Target className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-semibold mb-2">The Challenge</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Africa faces a $4.8 trillion credit information gap. Fragmented data across 54 jurisdictions, 42+ currencies, and dozens of regulatory frameworks makes sound lending decisions nearly impossible. Without reliable credit histories, billions in capital remain locked away from the entrepreneurs, farmers, and families who need it most.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Lightbulb className="w-6 h-6 mb-3" style={{ color: brandColors.secondary }} />
                <h3 className="font-semibold mb-2">Our Answer</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Cross-Jurisdictional Central Data Hub (CDH) v2.0 is the first SRS-compliant credit information sharing platform built for all 54 African countries. We unify credit data across borders, languages, and currencies — giving regulators oversight, lenders confidence, and borrowers fair access to capital.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section data-testid="section-who-we-are">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Who We Are</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: brandColors.iconGradient }}>
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Carlson Capital</h3>
                      <p className="text-[11px] text-muted-foreground">Strategic Capital & Advisory</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Carlson Capital provides the strategic investment framework and financial architecture that powers the CDH platform. With deep expertise in African capital markets and regulatory environments, Carlson Capital ensures the platform meets the fiduciary and compliance standards required by central banks and development finance institutions across the continent.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Systems In Motion Limited</h3>
                      <p className="text-[11px] text-muted-foreground">Technology & Platform Development</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Systems In Motion Limited is the technology arm responsible for designing, building, and operating the Credit Registry System. As the Registry Operator and Data Controller, the team delivers enterprise-grade software that handles multi-tenant data isolation, regulatory export engines, real-time credit scoring, and cross-border entity resolution — all built on modern, scalable infrastructure.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
                  Together, Carlson Capital and Systems In Motion Limited form a partnership uniquely positioned at the intersection of African finance and technology — combining regulatory expertise with engineering excellence to build credit infrastructure that serves the entire continent.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section data-testid="section-values">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ValueCard icon={Scale} title="Regulatory Integrity" description="Every feature is built to meet or exceed the standards set by African central banks, from BoG CRB v1.1 to pan-continental SRS frameworks." />
            <ValueCard icon={Lock} title="Data Sovereignty" description="Multi-tenant architecture ensures each institution's data remains isolated, encrypted, and subject to the jurisdiction-specific retention policies of its home country." />
            <ValueCard icon={Heart} title="Financial Inclusion" description="By creating reliable credit histories for underserved populations, we help unlock access to capital for millions of borrowers across Africa." />
            <ValueCard icon={Globe} title="Pan-African Reach" description="Purpose-built for the continent's diversity — 54 countries, 42+ currencies, 5 AU languages, and full RTL support for Arabic-speaking nations." />
            <ValueCard icon={Network} title="Interoperability" description="REST APIs, OAuth 2.1 authentication, XBRL batch uploads, and pipe-delimited BoG exports ensure seamless integration with any banking system." />
            <ValueCard icon={Award} title="Excellence" description="Production-grade from day one — maker-checker workflows, tamper-evident audit trails, TOTP MFA, and SHA-256 hash-chained logs as standard." />
          </div>
        </section>

        <section data-testid="section-platform">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">The Platform</h2>
          </div>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 sm:p-8" style={{ background: brandColors.iconGradientSubtle }}>
                <h3 className="font-bold mb-1">Cross-Jurisdictional Central Data Hub (CDH) v2.0</h3>
                <p className="text-xs text-muted-foreground">Credit Registry System | Carlson Capital & Systems In Motion Limited</p>
              </div>
              <div className="p-6 sm:p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: Users, title: "Borrower Management", desc: "Individual and corporate borrower registration with ID photos, national ID verification (Ghana Card, SA ID, NIN, etc.), and fuzzy duplicate detection across jurisdictions." },
                  { icon: TrendingUp, title: "Credit Scoring", desc: "Algorithmic scoring engine (300-850 scale) with weighted factor analysis, reason codes, and comprehensive credit report generation." },
                  { icon: Shield, title: "Maker-Checker Workflow", desc: "Dual-authorization control on all data modifications — every change requires a second authorized user to approve before taking effect." },
                  { icon: Landmark, title: "Regulatory Compliance", desc: "Multi-jurisdiction regulatory engine — BoG, CBN, CBK, SARB export formats with 36+ data protection law mappings, jurisdiction-specific data retention, and SRS compliance tracking dashboard." },
                  { icon: Globe, title: "Multi-Language", desc: "Full interface support for English, French, Portuguese, Arabic (with RTL layout), and Swahili — all five African Union working languages." },
                  { icon: Building2, title: "Multi-Tenant SaaS", desc: "Organization-scoped data isolation with self-registration, onboarding wizard, subscription billing, and platform administration." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3" data-testid={`platform-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: brandColors.iconGradientSubtle }}>
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section data-testid="section-journey">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Our Journey</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6 sm:p-8">
              <TimelineItem year="2024" title="Foundation" description="Carlson Capital and Systems In Motion Limited established the partnership with a mandate to build Africa's first cross-jurisdictional credit registry." />
              <TimelineItem year="2025" title="Platform Architecture" description="Designed the multi-tenant SaaS architecture covering 54 African countries, 42+ currencies, and 5 AU languages. Built core RBAC, borrower management, and credit scoring engine." />
              <TimelineItem year="2026 Q1" title="CDH v1.0 — v1.2" description="Launched the foundation platform with enterprise features: TOTP MFA, OAuth 2.1, AI chatbot, entity resolution, exchange rates, XBRL uploads, full internationalization, and mobile-responsive design." />
              <TimelineItem year="2026 Q1" title="CDH v2.0 — Ghana Launch" description="Achieved full Bank of Ghana CRB v1.1 compliance. Deployed Ghana-specific mode with 85 borrowers, 181 credit accounts, 17 institutions, pipe-delimited export engine, and BoG code catalogs." />
            </CardContent>
          </Card>
        </section>

        <section data-testid="section-leadership">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Leadership</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <TeamCard name="Executive Leadership" role="Strategic Direction & Capital Markets" icon={Briefcase} />
            <TeamCard name="Platform Engineering" role="CDH Architecture & Development" icon={Layers} />
            <TeamCard name="Regulatory Affairs" role="Central Bank Compliance & Policy" icon={Scale} />
            <TeamCard name="Data Operations" role="Credit Data Quality & Governance" icon={Shield} />
            <TeamCard name="Client Success" role="Institutional Onboarding & Support" icon={Users} />
            <TeamCard name="Pan-African Expansion" role="Country Deployment & Partnerships" icon={Globe} />
          </div>
        </section>

        <section data-testid="section-contact">
          <div className="flex items-center gap-3 mb-6">
            <div className="page-header-bar" />
            <h2 className="text-xl font-bold tracking-tight">Contact</h2>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6 sm:p-8">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Headquarters</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Accra, Greater Accra Region<br />Ghana, West Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">General Inquiries</p>
                    <p className="text-xs text-muted-foreground mt-1">Uffe Jon Carlson — uffe.carlson@gmail.com · +233 552 395 548</p>
                    <p className="text-xs text-muted-foreground">Thomas Baafi — Thomas.baafi@prischell.com · +233 24 433 9985</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Platform</p>
                    <p className="text-xs text-muted-foreground mt-1">CDH v2.0 Credit Registry</p>
                    <p className="text-xs text-muted-foreground">Ghana Mode Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="border-t border-border/50 mt-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] text-muted-foreground/80">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Africa Credit Hub</p>
              <p>Cross-Jurisdictional CDH & Credit Registry v2.1</p>
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /><span>Accra, Ghana</span></div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">Carlson Capital</p>
              <p className="font-medium text-foreground/70">Uffe Jon Carlson</p>
              <a href="mailto:uffe.carlson@gmail.com" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="w-3 h-3" />uffe.carlson@gmail.com</a>
              <a href="tel:+233552395548" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="w-3 h-3" />+233 552 395 548</a>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">Systems In Motion</p>
              <p className="font-medium text-foreground/70">Thomas Baafi</p>
              <a href="mailto:Thomas.baafi@prischell.com" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="w-3 h-3" />Thomas.baafi@prischell.com</a>
              <a href="tel:+233244339985" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="w-3 h-3" />+233 24 433 9985</a>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-6 pb-2">&copy; {new Date().getFullYear()} Carlson Capital & Systems In Motion Limited. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
