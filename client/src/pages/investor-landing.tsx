import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Shield, Globe, Users, CreditCard, BarChart3, Zap,
  CheckCircle2, ArrowRight, Building2, Scale, Lock,
  Languages, MapPin, TrendingUp, Bot, Upload,
  ChevronDown, Play, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(end * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={ref}>{prefix}{count.toLocaleString()}{suffix}</div>;
}

const HERO_STATS = [
  { value: 54, suffix: "", label: "African Countries", icon: Globe },
  { value: 102, suffix: "K+", label: "Borrower Records", icon: Users },
  { value: 172, suffix: "K+", label: "Credit Accounts", icon: CreditCard },
  { value: 42, suffix: "+", label: "Currencies Supported", icon: TrendingUp },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "RBAC with 4 role tiers, TOTP MFA, maker-checker workflows, tamper-evident audit trails with SHA-256 hash chains, and 15-minute session timeout.",
    tag: "Security",
  },
  {
    icon: Globe,
    title: "Pan-African Coverage",
    desc: "All 54 African countries with jurisdiction-specific data retention policies, regulatory compliance tracking, and cross-border entity resolution.",
    tag: "Coverage",
  },
  {
    icon: Languages,
    title: "5 AU Languages",
    desc: "Full localization in English, French, Portuguese, Arabic (with RTL), and Swahili — covering all African Union working languages.",
    tag: "i18n",
  },
  {
    icon: CreditCard,
    title: "Credit Intelligence",
    desc: "Algorithmic credit scoring (300-850), credit report generation with serial numbers, payment history grids, and NPL ratio analytics.",
    tag: "Analytics",
  },
  {
    icon: Scale,
    title: "Regulatory Compliance",
    desc: "SRS traceability matrix with 79+ requirements, per-country regulatory dashboards, consent management, and court judgment tracking.",
    tag: "Compliance",
  },
  {
    icon: Building2,
    title: "Multi-Institution",
    desc: "Self-service institution registration, API key management with granular permissions, OAuth 2.1 token exchange, and per-institution billing.",
    tag: "Enterprise",
  },
  {
    icon: Upload,
    title: "Batch Operations",
    desc: "JSON, CSV, and XBRL upload formats with validation, error reporting, and bulk credit account submission for data providers.",
    tag: "Data",
  },
  {
    icon: Bot,
    title: "AI Chatbot Assistant",
    desc: "Guided dispute filing, FAQ browsing across 15 categories, and keyword search — all multilingual with conversational UI.",
    tag: "AI",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    desc: "Interactive Recharts dashboards with portfolio trend analysis, account status breakdowns, geographic coverage, and drill-down capabilities.",
    tag: "Dashboard",
  },
];

const TECH_STACK = [
  { name: "React + TypeScript", desc: "Modern, type-safe frontend" },
  { name: "Express.js", desc: "High-performance API backend" },
  { name: "PostgreSQL + Drizzle", desc: "Enterprise-grade data layer" },
  { name: "Recharts", desc: "Interactive data visualization" },
  { name: "Tailwind CSS + shadcn/ui", desc: "Polished component library" },
  { name: "i18next", desc: "5-language localization engine" },
];

const TESTIMONIAL_POINTS = [
  "Covers the entire African continent — no other credit bureau system matches this scope",
  "SRS-compliant with full traceability across 79+ regulatory requirements",
  "Production-ready with 102K+ seeded borrower records for realistic demos",
  "Built for investors: interactive guided tour, live data, and role-based access",
];

export default function InvestorLandingPage() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "Pan-African Credit Registry System | CDH v1.2 — Systems In Motion Limited";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "The first SRS-compliant credit information sharing platform covering all 54 African countries with 42+ currencies, 5 AU languages, and enterprise-grade security.");
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "The first SRS-compliant credit information sharing platform covering all 54 African countries with 42+ currencies, 5 AU languages, and enterprise-grade security.";
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="investor-landing">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">v1.2</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hidden sm:inline-flex"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="nav-features"
            >
              Features
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hidden sm:inline-flex"
              onClick={() => {
                document.getElementById("tech")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="nav-tech"
            >
              Technology
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => navigate("/")}
              data-testid="nav-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, hsl(175 55% 28%) 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, hsl(43 80% 55%) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: "hsl(175 55% 28%)" }}
          />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: "hsl(43 80% 55%)" }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge
            variant="secondary"
            className="mb-6 text-xs px-3 py-1 font-medium"
            data-testid="badge-version"
          >
            <Star className="w-3 h-3 mr-1" />
            Cross-Jurisdictional CDH v1.2 — Systems In Motion Limited
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block">Pan-African</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(175 55% 32%), hsl(175 55% 22%), hsl(43 80% 50%))",
              }}
            >
              Credit Registry System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The first fully SRS-compliant credit information sharing platform covering
            all <strong className="text-foreground">54 African countries</strong>, with multi-currency support,
            5 AU languages, and enterprise-grade security — built to transform
            financial inclusion across the continent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button
              size="lg"
              className="text-sm px-8 gap-2 shadow-lg"
              onClick={() => navigate("/")}
              data-testid="cta-try-demo"
            >
              <Play className="w-4 h-4" />
              Try Interactive Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="cta-explore"
            >
              Explore Features
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary/70" />
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-5 h-5 mx-auto text-muted-foreground/50" />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Platform Capabilities</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Enterprise Features, Continental Scale
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Purpose-built for African credit markets with deep regulatory integration,
              multi-jurisdiction compliance, and production-ready infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="group border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                data-testid={`feature-${feature.tag.toLowerCase()}`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                      style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 45% 22%))" }}
                    >
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                          {feature.tag}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs">Why CDH v1.2</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Built for the African Opportunity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TESTIMONIAL_POINTS.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card"
              >
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tech" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs">Technology</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Modern, Production-Ready Stack
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Built with proven technologies for reliability, maintainability, and scale.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="rounded-lg border border-border/50 bg-card p-4 text-center hover:border-primary/30 transition-colors"
                data-testid={`tech-${tech.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
              >
                <p className="font-semibold text-xs mb-1">{tech.name}</p>
                <p className="text-[10px] text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(175 55% 28%) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-xl mx-auto">
            Explore the full system with our interactive demo. Choose from Admin,
            Regulator, or Bank Officer roles to see role-based access in action —
            complete with a guided tour.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="text-sm px-10 gap-2 shadow-lg"
              onClick={() => navigate("/")}
              data-testid="cta-bottom-demo"
            >
              <Play className="w-4 h-4" />
              Launch Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/")}
              data-testid="cta-bottom-login"
            >
              <Lock className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}
              >
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Systems In Motion Limited</span>
            </div>
            <p>Cross-Jurisdictional Central Data Hub & Credit Registry System v1.2</p>
            <p>Confidential &amp; Proprietary</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
