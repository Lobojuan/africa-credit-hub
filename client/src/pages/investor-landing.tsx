import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { isGhanaMode } from "@/lib/country-mode";
import {
  Shield, Globe, Users, CreditCard, BarChart3, Zap,
  CheckCircle2, ArrowRight, Building2, Scale, Lock,
  Languages, MapPin, TrendingUp, Bot, Upload,
  ChevronDown, Star, Eye, FileText, Clock,
  Database, Layers, AlertTriangle, Target, Workflow,
  Search, Gavel, Settings, Key, RefreshCw, Landmark,
  PieChart, LineChart, Map, Fingerprint, ShieldCheck,
  UserCheck, FileCheck, Timer, BadgeCheck, Network,
  BookOpen, Headphones, Receipt, ServerCog, Banknote,
  CircleDollarSign, Activity, Hash, ChevronRight,
  Sparkles, MonitorSmartphone, Brain, Mail, Phone, X, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@assets/investor-hero.png";
import dashboardImage from "@assets/app-dashboard.png";
import mobileImage from "@assets/app-consumer-portal.png";
import networkImage from "@assets/app-command-center.png";
import borrowersImage from "@assets/app-borrowers.png";
import creditAccountsImage from "@assets/app-credit-accounts.png";
import auditImage from "@assets/app-audit.png";
import reportsImage from "@assets/app-reports.png";
import aiPortfolioImage from "@assets/app-ai-portfolio.png";

function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

const HERO_STATS = [
  { value: 54, suffix: "", label: "African Countries", icon: Globe },
  { value: 102, suffix: "K+", label: "Borrower Records", icon: Users },
  { value: 172, suffix: "K+", label: "Credit Accounts", icon: CreditCard },
  { value: 42, suffix: "+", label: "Currencies Supported", icon: Banknote },
  { value: 79, suffix: "+", label: "SRS Requirements", icon: ShieldCheck },
  { value: 5, suffix: "", label: "AU Languages", icon: Languages },
];

const PROBLEM_STATEMENTS = [
  {
    icon: AlertTriangle,
    title: "A $331 Billion African Credit Gap",
    desc: "Sub-Saharan Africa's SME financing gap stands at $331 billion. 51% of Africa's 44 million formal MSMEs lack necessary financing. SMEs represent 90% of all private sector businesses and generate 80% of jobs — yet remain starved of capital. (World Bank/IFC)",
  },
  {
    icon: TrendingUp,
    title: "Banks Lending Blind Across the Continent",
    desc: "Credit bureau coverage ranges from 70% in South Africa to just 13.9% in Nigeria — and far lower across most of the continent. Non-performing loan ratios average 17% in Sub-Saharan Africa vs. 5.8% globally. Banks are losing billions lending without data. (IMF)",
  },
  {
    icon: CircleDollarSign,
    title: "$1.1 Trillion in Untapped Transaction Data",
    desc: "Africa's 1.1 billion mobile money accounts processed $1.1 trillion in 2024 — 74% of all global mobile money transactions. Yet only 7% of adults borrow via mobile. This data can power credit scoring across all 54 countries. (GSMA 2025)",
  },
  {
    icon: Users,
    title: "350M+ Adults Excluded from Credit",
    desc: "42% of Sub-Saharan African adults remain unbanked. Only 24% borrow formally. 100M+ lack official ID. Women are 12 percentage points less likely to have accounts — the $1.7 trillion gender finance gap is the continent's biggest untapped opportunity. (World Bank Findex 2024)",
  },
];

const PLATFORM_MODULES = [
  {
    category: "Credit Data Management",
    color: "hsl(175 55% 28%)",
    modules: [
      {
        icon: Users,
        title: "Borrower Registry",
        details: [
          "Individual and corporate borrower profiles with national ID, TIN, and passport tracking",
          "Politically Exposed Person (PEP) status flagging for enhanced due diligence",
          "Auto-generated unique avatars for visual identification across the platform",
          "ID document and photo upload with secure storage and retrieval",
        ],
      },
      {
        icon: CreditCard,
        title: "Credit Account Lifecycle",
        details: [
          "Full lifecycle tracking from disbursement through maturity, including restructuring and write-off",
          "Support for all major facility types: term loans, overdrafts, trade finance, mortgages, leasing",
          "12-period payment performance history grid for each account",
          "Collateral tracking with valuation and lien status management",
        ],
      },
      {
        icon: Search,
        title: "Cross-Border Entity Resolution",
        details: [
          "Fuzzy matching engine using PostgreSQL trigram similarity (pg_trgm)",
          "Matches borrowers across jurisdictions by name, passport, or tax ID",
          "Identifies duplicate entities and related parties across institutional boundaries",
          "Confidence scoring for match quality with manual review workflows",
        ],
      },
      {
        icon: FileText,
        title: "Credit Report Generation",
        details: [
          "Automated credit scoring (300-850 range) with algorithmic reason codes",
          "Comprehensive reports with unique serial numbers for audit traceability",
          "Risk item breakdowns: NPL ratios, court judgments, and payment arrears",
          "PDF-ready output with institutional branding and regulatory disclaimers",
        ],
      },
    ],
  },
  {
    category: "Security & Compliance",
    color: "hsl(200 60% 35%)",
    modules: [
      {
        icon: Lock,
        title: "Enterprise Security",
        details: [
          "4-tier RBAC: Admin, Regulator, Lender, Viewer with granular route-level enforcement",
          "TOTP-based MFA with QR code provisioning and backup recovery",
          "Password complexity requirements with 90-day forced rotation",
          "15-minute idle session timeout with automatic lockout after 3 failed attempts",
        ],
      },
      {
        icon: Workflow,
        title: "Maker-Checker Workflows",
        details: [
          "Four-eye principle for all sensitive data modifications",
          "Maker submits changes; independent Checker (Regulator/Admin) approves or rejects",
          "Full change diff tracking showing exact field modifications",
          "Audit trail for every approval decision with timestamps and reviewer identity",
        ],
      },
      {
        icon: Hash,
        title: "Tamper-Evident Audit Trail",
        details: [
          "Every action logged: login, create, update, delete, export, and approval events",
          "SHA-256 hash chain links each entry to its predecessor, preventing retroactive tampering",
          "IP address, user agent, and session tracking for forensic analysis",
          "Immutable audit log accessible to Admin and Regulator roles only",
        ],
      },
      {
        icon: Scale,
        title: "Regulatory Compliance Dashboard",
        details: [
          "SRS traceability matrix tracking 79+ requirements with implementation status",
          "Per-country regulatory profile management with custom data retention periods",
          "Consent management: borrower consent tracking with grant/revoke and receipt generation",
          "Court judgment and lien tracking integrated into borrower risk profiles",
        ],
      },
    ],
  },
  {
    category: "Operations & Integration",
    color: "hsl(43 65% 45%)",
    modules: [
      {
        icon: Upload,
        title: "Batch Data Operations",
        details: [
          "Bulk credit account submission via JSON, CSV, and XBRL/XML formats",
          "Row-level validation with detailed error reporting and partial success handling",
          "Progress tracking with real-time status updates during large uploads",
          "Template downloads for each format to guide data providers",
        ],
      },
      {
        icon: RefreshCw,
        title: "Exchange Rate Management",
        details: [
          "42+ African and global currencies with automated rate fetching every 6 hours",
          "Manual rate override capability for central bank official rates",
          "Cross-currency portfolio aggregation for accurate total exposure calculation",
          "Historical rate tracking for time-series analysis and reporting",
        ],
      },
      {
        icon: Key,
        title: "API Administration",
        details: [
          "External API configuration management with health monitoring",
          "OAuth 2.1-compatible API key generation with granular scope permissions",
          "Per-institution API credentials with usage tracking and rate limiting",
          "Automated connectivity testing with status reporting",
        ],
      },
      {
        icon: Timer,
        title: "Data Retention Engine",
        details: [
          "Country-specific retention policies (e.g., 7 years for Ethiopia, 5 for Kenya)",
          "Automated scheduler runs every 24 hours to enforce retention rules",
          "Two-phase process: archive expired records first, then permanent expunge",
          "Full audit trail of all retention actions for regulatory proof of compliance",
        ],
      },
    ],
  },
  {
    category: "Intelligence & User Experience",
    color: "hsl(280 50% 40%)",
    modules: [
      {
        icon: BarChart3,
        title: "Visual Analytics Dashboard",
        details: [
          "12-month portfolio growth area chart with borrower and account trend lines",
          "Account status donut chart: current, delinquent, default, restructured, closed",
          "Loan type distribution horizontal bar chart across all facility types",
          "Regional activity breakdown across 5 African sub-regions with country-level stats",
        ],
      },
      {
        icon: Bot,
        title: "AI Chatbot Assistant",
        details: [
          "Conversational interface for guided dispute filing and resolution tracking",
          "FAQ knowledge base spanning 15 categories with keyword search",
          "Multilingual support across all 5 AU languages",
          "Context-aware help suggestions based on current page and user role",
        ],
      },
      {
        icon: Headphones,
        title: "Inquiry Service Helpdesk",
        details: [
          "Consumer dispute management with automated SLA monitoring",
          "Configurable SLA timers: 2 days for financial disputes, 5 for non-financial",
          "Breach detection with escalation notifications for overdue cases",
          "Full dispute lifecycle: filing, investigation, resolution, and closure",
        ],
      },
      {
        icon: Globe,
        title: "5 AU Language Localization",
        details: [
          "Complete UI translation: English, French, Portuguese, Arabic, and Swahili",
          "Arabic RTL (right-to-left) layout support with automatic text direction",
          "All documentation available in EN, FR, AR, and SW",
          "Dynamic language switching without page reload",
        ],
      },
    ],
  },
  {
    category: "v2.0 — Competitive Differentiators",
    color: "hsl(340 55% 42%)",
    modules: [
      {
        icon: TrendingUp,
        title: "Credit Score Explainability",
        details: [
          "Factor-by-factor breakdown of every credit score with weights and impact indicators",
          "Transparent reason codes aligned with regulatory expectations for lending decisions",
          "Visual factor bars showing positive and negative contributors side-by-side",
          "Exportable score explanations for inclusion in loan decision audit trails",
        ],
      },
      {
        icon: Activity,
        title: "Alternative Data Scoring",
        details: [
          "Integrates mobile money, utility payments, and telco usage into credit scoring",
          "Addresses thin-file borrowers with no traditional credit history — key for financial inclusion",
          "Alternative data bonus of up to 90 points for borrowers with consistent on-time records",
          "Strong Alternative Data reason code when 90%+ on-time with 12+ transactions",
        ],
      },
      {
        icon: Fingerprint,
        title: "Fraud Detection Layer",
        details: [
          "Real-time fraud risk scoring on every borrower profile using velocity and pattern analysis",
          "Detects rapid-fire applications, geographic anomalies, and identity verification failures",
          "Risk-level badges (Low / Medium / High / Critical) displayed on borrower profiles",
          "Configurable alert thresholds and automated fraud flagging for investigation",
        ],
      },
      {
        icon: UserCheck,
        title: "Consumer Self-Service Portal",
        details: [
          "Public-facing mobile-first portal for borrowers to check their own credit score",
          "Identity verification via National ID + date of birth before any data is shown",
          "Rate-limited and privacy-hardened — consumers see only their score and rating, nothing else",
          "Fully responsive design works on any device without a separate mobile app",
        ],
      },
      {
        icon: ServerCog,
        title: "Enhanced API Developer Portal",
        details: [
          "Interactive sandbox for partner institutions to test API calls with live responses",
          "Code examples in multiple languages (cURL, Python, Node.js, Java) for rapid integration",
          "Webhook event documentation with payload schemas and delivery retry policies",
          "Authentication flow guides with step-by-step OAuth 2.1 integration instructions",
        ],
      },
      {
        icon: Receipt,
        title: "Usage-Based Billing Engine",
        details: [
          "Per-transaction metering wired to credit reports, disputes, batch uploads, and searches",
          "Volume-based pricing tiers with automatic tier progression as usage grows",
          "Multi-currency revenue tracking with per-country and per-organization breakdowns",
          "Billing dashboard with real-time usage analytics and invoice generation",
        ],
      },
    ],
  },
];

const USE_CASES = [
  {
    icon: Landmark,
    role: "Central Banks & Regulators",
    title: "Supervisory Oversight",
    scenarios: [
      "Monitor aggregate NPL ratios across all licensed banks in real-time",
      "Enforce data quality standards with maker-checker approval workflows",
      "Track cross-border borrower exposure across multiple jurisdictions",
      "Generate regulatory compliance reports with full SRS traceability",
      "Set and enforce country-specific data retention policies automatically",
    ],
  },
  {
    icon: Building2,
    role: "Commercial Banks",
    title: "Credit Risk Management",
    scenarios: [
      "Query comprehensive credit reports before loan disbursement decisions",
      "Identify hidden exposure through cross-border entity resolution matching",
      "Submit credit data via batch upload (CSV/JSON/XBRL) for portfolio reporting",
      "Manage API keys for automated integration with core banking systems",
      "Track delinquent accounts with automated status transition monitoring",
    ],
  },
  {
    icon: PieChart,
    role: "Development Finance Institutions",
    title: "Portfolio Intelligence",
    scenarios: [
      "Aggregate multi-currency exposure with real-time exchange rate conversion",
      "Analyze regional credit distribution across all 54 African markets",
      "Generate comprehensive portfolio analytics with interactive dashboards",
      "Monitor data retention compliance across jurisdictions with different laws",
      "Access tamper-evident audit trails for governance and transparency reporting",
    ],
  },
  {
    icon: Network,
    role: "Microfinance & Fintechs",
    title: "Financial Inclusion",
    scenarios: [
      "Access shared credit histories to extend credit to underbanked populations",
      "Submit borrower data via simple CSV uploads without complex integration",
      "Leverage AI chatbot for borrower dispute handling and resolution",
      "Participate in the credit ecosystem with role-appropriate access controls",
      "Benefit from standardized credit scoring across the African continent",
    ],
  },
];

const COMPETITIVE_ADVANTAGES = [
  {
    metric: "54",
    label: "Countries",
    desc: "Only platform covering the entire African continent. No competitor addresses more than a single region.",
  },
  {
    metric: "79+",
    label: "SRS Requirements",
    desc: "Full regulatory traceability matrix with documented implementation status for every requirement.",
  },
  {
    metric: "42+",
    label: "Currencies",
    desc: "Real-time exchange rate management with automated 6-hour refresh cycles for accurate cross-border valuation.",
  },
  {
    metric: "5",
    label: "AU Languages",
    desc: "Complete localization including Arabic RTL support, covering every African Union working language.",
  },
  {
    metric: "4",
    label: "Security Tiers",
    desc: "RBAC, MFA, maker-checker, and SHA-256 hash-chain audit trails for enterprise-grade data protection.",
  },
  {
    metric: "24/7",
    label: "Automation",
    desc: "Automated retention enforcement, exchange rate updates, SLA monitoring, and compliance checking.",
  },
];



export default function InvestorLandingPage() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeModuleCategory, setActiveModuleCategory] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    if (!lightboxImg) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImg(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [lightboxImg]);

  useEffect(() => {
    document.title = isGhanaMode() 
      ? "Ghana Credit Registry System | CDH v2.1 — Systems In Motion Limited"
      : "Pan-African Credit Registry | CDH v2.1 — Modernize Your Credit Infrastructure";
    const meta = document.querySelector('meta[name="description"]');
    const content = "The only SRS-compliant credit registry platform covering all 54 African countries. Built for central banks, commercial banks, MFIs, and fintechs to manage credit risk, ensure compliance, and expand financial inclusion.";
    if (meta) {
      meta.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Challenges", id: "problem" },
    { label: "Platform", id: "platform" },
    { label: "Solutions", id: "use-cases" },
    { label: "Why CDH", id: "advantage" },
    { label: "Market", id: "market-proof" },
    { label: "Pricing", id: "pricing-link" },
    { label: "Security", id: "security-link" },
  ];

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
              <span className="text-[10px] text-muted-foreground ml-1.5">v2.1</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="text-[11px] px-2 hidden lg:inline-flex"
                onClick={() => {
                  if (item.id === "pricing-link") {
                    navigate("/pricing");
                  } else if (item.id === "security-link") {
                    navigate("/security");
                  } else {
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs ml-2"
              onClick={() => navigate("/login")}
              data-testid="nav-login"
            >
              Log In
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => navigate("/start-trial")}
              data-testid="nav-start-trial"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
          <div
            className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, hsl(175 55% 28%) 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, hsl(43 80% 55%) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(175 55% 28%)" }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(43 80% 55%)" }} />
          <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "hsl(200 60% 40%)" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1 font-medium" data-testid="badge-version">
            <Star className="w-3 h-3 mr-1" />
            CDH v2.1 — Trusted by Financial Institutions Across Africa
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block">Modernize Your</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(175 55% 32%), hsl(175 55% 22%), hsl(43 80% 50%))" }}
            >
              Credit Infrastructure
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            The only SRS-compliant credit registry platform covering
            all <strong className="text-foreground">54 African countries</strong>. Manage credit risk,
            ensure regulatory compliance, and expand financial inclusion — all from
            one unified platform.
          </p>

          <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto mb-10">
            Purpose-built for central banks, commercial banks, MFIs, and fintechs.
            Designed in <strong className="text-foreground/80">Accra, Ghana</strong> by{" "}
            <strong className="text-foreground/80">Carlson Capital &amp; Systems In Motion Limited</strong> — 
            for Africa, by people who live and work here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button size="lg" className="text-sm px-8 gap-2 shadow-lg" onClick={() => navigate("/start-trial")} data-testid="cta-try-trial">
              <ArrowRight className="w-4 h-4" />
              Start a Free Trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/pricing")}
              data-testid="cta-explore"
            >
              View Plans & Pricing
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-3 text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <stat.icon className="w-4 h-4 mx-auto mb-1.5 text-primary/70" />
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-5 h-5 mx-auto text-muted-foreground/50" />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 border-b border-border/30 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground mb-5 font-medium uppercase tracking-wider">Compliant with African Regulatory Frameworks</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { code: "POPIA", country: "South Africa" },
              { code: "NDPR/NDPA", country: "Nigeria" },
              { code: "DPA 2012", country: "Ghana" },
              { code: "DPA 2019", country: "Kenya" },
              { code: "Law 058/2021", country: "Rwanda" },
              { code: "BoG CRB", country: "Bank of Ghana" },
              { code: "CBN", country: "Central Bank of Nigeria" },
              { code: "GDPR", country: "International" },
            ].map((reg) => (
              <div key={reg.code} className="flex items-center gap-1.5" data-testid={`reg-badge-${reg.code.toLowerCase().replace(/\s/g, "-")}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">{reg.code}</span>
                <span className="text-[10px] text-muted-foreground">({reg.country})</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              "M-Pesa & Mobile Money payments",
              "PAPSS cross-border settlements",
              "42+ African currencies",
              "5 AU languages",
              "Offline batch processing",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[11px] text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Platform Preview
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Your Credit Portfolio, One Dashboard
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                See total borrowers, outstanding balances, delinquency rates, and NPL ratios
                in real time. Drill into any metric. Switch currencies. Filter by institution.
                This is what your team sees every day.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Live KPIs: borrowers, accounts, outstanding exposure, delinquencies",
                  "Multi-currency tracking with GHS, NGN, KES, ZAR, and 40+ African currencies",
                  "Portfolio growth trends and account status breakdown charts",
                  "One-click export to CSV and Excel for regulatory reporting",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/start-trial")} className="gap-2" data-testid="cta-preview-trial">
                <ArrowRight className="w-4 h-4" />
                Start Free Trial
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src={dashboardImage}
                  alt="CDH v2.1 dashboard showing 159 borrowers, 305 credit accounts, GHS 12.1M outstanding, and portfolio analytics"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, hsl(175 55% 40%) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(43 80% 50%) 0%, transparent 50%)`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <Badge className="mb-4 text-xs bg-gradient-to-r from-primary/20 to-yellow-500/20 text-primary border-primary/30">
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered — What Sets CDH Apart
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The Only African Credit Registry With Built-In AI
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              Traditional credit bureaus give you data. CDH gives you intelligence. Our AI engine —
              powered by GPT-4o — analyzes your live portfolio and turns raw credit data into
              predictions, warnings, and actions your team can act on today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16">
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
              <img
                src={aiPortfolioImage}
                alt="AI Portfolio Intelligence dashboard showing Default Predictions, Early Warnings, Collection Priorities, and Sector Analysis powered by GPT-4o"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-6">AI Portfolio Intelligence</h3>
              <div className="space-y-5">
                {[
                  {
                    icon: AlertTriangle,
                    title: "Default Predictions",
                    desc: "AI analyzes payment history, account health, and cross-border patterns to flag which borrowers are likely to default — before they miss a payment.",
                    color: "text-red-500",
                    bg: "bg-red-500/10",
                  },
                  {
                    icon: Eye,
                    title: "Early Warning System",
                    desc: "Automatic severity scoring (Warning, Alert, Critical) on at-risk accounts. Your team gets notified with time to intervene, not after the damage is done.",
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    icon: TrendingUp,
                    title: "Trend Forecasting",
                    desc: "3-to-6 month projections on delinquency and default trends across your entire portfolio. Plan provisions, not react to surprises.",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                  },
                  {
                    icon: Target,
                    title: "Collection Priorities",
                    desc: "AI ranks overdue accounts by recovery probability and recommends specific actions — call, restructure, or escalate — so your team focuses where it matters.",
                    color: "text-green-500",
                    bg: "bg-green-500/10",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${feature.bg}`}>
                      <feature.icon className={`w-4.5 h-4.5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">{feature.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Brain,
                title: "ML Credit Scoring",
                desc: "Gradient boosting model scores borrowers 300-850 with confidence intervals. Goes beyond payment history to factor velocity, utilization trends, and cross-border activity.",
                badge: "GBM v2.1",
              },
              {
                icon: ShieldCheck,
                title: "Fraud Detection",
                desc: "Real-time velocity checks catch bust-out patterns. Identity matching flags duplicate National IDs and synthetic identities. PEP screening built in.",
                badge: "Real-Time",
              },
              {
                icon: Activity,
                title: "Alternative Data",
                desc: "Score thin-file borrowers using mobile money transactions, utility payments, and telco data. Critical for the 57% of Africans without traditional credit history.",
                badge: "Mobile Money",
              },
              {
                icon: Headphones,
                title: "AI Dispute Assistant",
                desc: "Intelligent chatbot guides borrowers and officers through dispute resolution. NLP understands intent, generates summaries, and recommends resolutions automatically.",
                badge: "GPT-4o",
              },
            ].map((ai) => (
              <Card key={ai.title} className="border border-border/60 hover:border-primary/30 transition-colors" data-testid={`ai-${ai.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                      <ai.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{ai.badge}</Badge>
                  </div>
                  <h4 className="font-semibold text-sm mb-1.5">{ai.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ai.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-yellow-500/5 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Why AI Changes Everything for African Lending</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Africa has 1.4 billion people but only 43% have any formal credit history.
                  Traditional scoring models fail here. CDH's AI fills the gap — using mobile money data,
                  payment velocity, and cross-border patterns to assess creditworthiness where conventional
                  bureaus see nothing. The result: more approvals, fewer defaults, and financial inclusion
                  at continental scale.
                </p>
              </div>
              <Button onClick={() => navigate("/ai-demo")} size="lg" className="gap-2 shrink-0" data-testid="cta-ai-trial">
                <Zap className="w-4 h-4" />
                Try AI Features Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">The Data Speaks</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Africa's Credit Infrastructure Crisis — In Numbers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              World Bank, IMF, and IFC data reveals the scale of the problem. These aren't projections —
              they're the reality facing every financial institution operating in Africa today.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {PROBLEM_STATEMENTS.map((problem) => (
              <Card key={problem.title} className="border border-border/60" data-testid={`problem-${problem.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
                      <problem.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-2">{problem.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{problem.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">CDH v2.1 addresses all four challenges in a single, unified platform — backed by real data.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Platform Deep Dive</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              16 Integrated Modules, One Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Every capability a pan-African credit bureau requires — from borrower registration
              to regulatory compliance — built into a cohesive, production-ready system.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {PLATFORM_MODULES.map((cat, i) => (
              <button
                key={cat.category}
                onClick={() => setActiveModuleCategory(i)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeModuleCategory === i
                    ? "text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={activeModuleCategory === i ? { background: cat.color } : {}}
                data-testid={`tab-module-${i}`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {PLATFORM_MODULES[activeModuleCategory].modules.map((mod) => (
              <Card key={mod.title} className="border border-border/60 hover:border-primary/20 transition-colors" data-testid={`module-${mod.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${PLATFORM_MODULES[activeModuleCategory].color}, ${PLATFORM_MODULES[activeModuleCategory].color}dd)` }}
                    >
                      <mod.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm mb-3">{mod.title}</h3>
                      <ul className="space-y-2">
                        {mod.details.map((detail, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src={networkImage}
                  alt="Platform Command Center showing 10 African country jurisdictions with borrower and account counts"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4 text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Continental Coverage
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Connected Across the Entire Continent
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                CDH v2.0 is the only credit registry platform engineered for all 54 African nations —
                bridging Anglophone, Francophone, Lusophone, and Arabophone regions with
                unified data standards and real-time cross-border intelligence.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: "54", label: "Countries", desc: "Full continental coverage" },
                  { value: "42+", label: "Currencies", desc: "Real-time exchange rates" },
                  { value: "5", label: "Languages", desc: "Including Arabic RTL" },
                  { value: "24/7", label: "Automated", desc: "Continuous monitoring" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/50 bg-card p-3 text-center">
                    <div className="text-lg font-bold text-primary">{item.value}</div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="use-cases" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Built For Your Institution</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How Your Institution Benefits
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Whether you're a central bank, commercial bank, MFI, or fintech lender,
              CDH delivers the specific capabilities your team needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {USE_CASES.map((uc) => (
              <Card key={uc.role} className="border border-border/60" data-testid={`usecase-${uc.role.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 45% 22%))" }}
                    >
                      <uc.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{uc.role}</p>
                      <h3 className="font-semibold text-sm">{uc.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {uc.scenarios.map((scenario, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">{scenario}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="advantage" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Why Choose CDH</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What Sets CDH Apart
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              No other platform gives your institution this combination of coverage,
              compliance, and capability — purpose-built for Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {COMPETITIVE_ADVANTAGES.map((adv) => (
              <div
                key={adv.label}
                className="rounded-xl border border-border/60 bg-card p-5 text-center hover:border-primary/30 transition-colors"
                data-testid={`advantage-${adv.label.toLowerCase()}`}
              >
                <div
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, hsl(175 55% 32%), hsl(43 80% 50%))" }}
                >
                  {adv.metric}
                </div>
                <p className="text-xs font-semibold mb-2">{adv.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Production-Ready Platform</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Deploy Today, Not Next Year
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              CDH isn't a roadmap — it's a production system with real data you can explore right now.
              Every module works. Every feature is live.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Borrower Profiles", value: "102,000+", detail: "Individual & corporate entities across all 54 countries" },
              { label: "Credit Accounts", value: "172,000+", detail: "Full lifecycle data with payment histories and collateral" },
              { label: "Audit Trail Entries", value: "Active", detail: "SHA-256 hash-chain verified, tamper-evident logging" },
              { label: "Exchange Rates", value: "42+ Pairs", detail: "Auto-refreshed every 6 hours from live market data" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 bg-card p-4 text-center" data-testid={`live-data-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="text-lg sm:text-xl font-bold text-primary mb-1">{item.value}</div>
                <p className="text-xs font-medium mb-1.5">{item.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Start your 14-day free trial and explore the full platform with sample data:
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {[
                { role: "Admin", desc: "Full system access", icon: Settings },
                { role: "Regulator", desc: "Supervisory oversight", icon: Gavel },
                { role: "Bank Officer", desc: "Credit operations", icon: Building2 },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card text-xs">
                  <r.icon className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{r.role}</span>
                  <span className="text-muted-foreground">— {r.desc}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/start-trial")} className="gap-2" data-testid="cta-live-data-trial">
              <ArrowRight className="w-4 h-4" />
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">
              <MonitorSmartphone className="w-3 h-3 mr-1" />
              See the Platform
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Every Screen, Built for Africa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              These are real screenshots from the platform. What you see is what your team gets on day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { img: borrowersImage, title: "Borrower Management", desc: "Individual and corporate borrower records with tags, country, and sector classification. Search by name, ID, phone, or email." },
              { img: creditAccountsImage, title: "Credit Accounts", desc: "Full loan portfolio view with institution, balance, interest rate, status tracking, and days in arrears across multiple currencies." },
              { img: reportsImage, title: "Credit Reports & Analytics", desc: "Generate D&B-style credit reports per borrower. Portfolio stats including total exposure, NPL ratio, and institution breakdown." },
              { img: auditImage, title: "Audit Trail & Compliance", desc: "Tamper-proof audit log with SHA-256 hash chain. Filter by action type, entity, date range. Export to CSV or Excel." },
            ].map((screen, i) => (
              <div key={i} className="group rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer" data-testid={`screenshot-${i}`} onClick={() => setLightboxImg({ src: screen.img, title: screen.title })}>
                <div className="overflow-hidden relative">
                  <img
                    src={screen.img}
                    alt={screen.title}
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/70 rounded-full p-3 shadow-lg">
                      <ZoomIn className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{screen.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{screen.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl overflow-hidden border border-border/50 shadow-2xl" data-testid="screenshot-consumer">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
              <div className="p-6 sm:p-10">
                <Badge variant="outline" className="mb-3 text-xs">Consumer Self-Service</Badge>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Credit Check Portal</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Give borrowers a public-facing portal to check their own credit score.
                  Identity verification via National ID and date of birth. No login required.
                  Builds trust, reduces disputes, meets regulatory transparency requirements.
                </p>
                <Button onClick={() => navigate("/my-credit")} variant="outline" className="gap-2" data-testid="cta-consumer-portal">
                  <Eye className="w-4 h-4" />
                  View Consumer Portal
                </Button>
              </div>
              <div className="overflow-hidden relative group cursor-pointer" onClick={() => setLightboxImg({ src: mobileImage, title: "Credit Check Portal" })}>
                <img
                  src={mobileImage}
                  alt="Consumer self-service credit check portal with National ID verification"
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/70 rounded-full p-3 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tech" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Enterprise-Grade Security</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for Institutional Trust
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Your credit data requires the highest levels of protection. CDH implements 
              defense-in-depth security that satisfies central bank audit requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {[
              { icon: Lock, title: "Encrypted Sessions", text: "End-to-end encryption with httpOnly secure cookies and automatic session expiry" },
              { icon: Fingerprint, title: "Multi-Factor Auth", text: "TOTP-based MFA with QR provisioning and biometric WebAuthn (fingerprint/face)" },
              { icon: Hash, title: "Tamper-Proof Audit", text: "SHA-256 hash chain links every log entry — impossible to modify retroactively" },
              { icon: ShieldCheck, title: "Role-Based Access", text: "4-tier RBAC: Admin, Regulator, Lender, Viewer with route-level enforcement" },
              { icon: Scale, title: "Regulatory Compliance", text: "POPIA, NDPR, Ghana DPA, GDPR frameworks with automated data retention" },
              { icon: BadgeCheck, title: "Maker-Checker Workflows", text: "Four-eye principle for all sensitive data modifications with full change tracking" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <item.icon className="w-5 h-5 mb-2 text-primary/70" />
                <p className="font-semibold text-xs mb-1">{item.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="sm" className="text-xs gap-2" onClick={() => navigate("/security")} data-testid="cta-security-deep">
              <Shield className="w-3.5 h-3.5" />
              View Full Security & Compliance Details
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Getting Started</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Simple Onboarding, Immediate Value
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Go from sign-up to production in days, not months. CDH is designed for rapid deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: "1", title: "Start Free Trial", desc: "Register your organization and get full admin access for 14 days. No credit card required. Explore every feature with real data.", cta: "Start Trial", action: () => navigate("/start-trial"), testId: "step-trial" },
              { step: "2", title: "Choose Your Plan", desc: "Standard for MFIs and fintechs. Professional for regional banks. Enterprise for central banks and tier-1 institutions.", cta: "View Pricing", action: () => navigate("/pricing"), testId: "step-pricing" },
              { step: "3", title: "Go Live", desc: "Connect via API or batch upload. Configure your regulatory profile. Start managing credit data across your jurisdictions.", cta: "Contact Sales", action: () => window.location.href = "mailto:uffe.carlson@gmail.com", testId: "step-deploy" },
            ].map((item) => (
              <Card key={item.step} className="border border-border/60" data-testid={item.testId}>
                <CardContent className="p-5 sm:p-6 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold"
                    style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 45% 22%))" }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                  <Button variant="outline" size="sm" className="text-xs" onClick={item.action}>
                    {item.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="market-proof" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">World Bank &amp; IMF Data</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The Numbers Don't Lie
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Data from the World Bank, IMF, IFC, and GSMA shows a continent ready for modern credit infrastructure.
              CDH is the only platform built to serve all 54 African markets from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="text-center p-5">
              <CardContent className="pt-2">
                <div className="text-3xl font-bold text-primary mb-1">$331B</div>
                <p className="font-semibold text-xs mb-1">Africa SME Financing Gap</p>
                <p className="text-[11px] text-muted-foreground">51% of Africa's 44 million formal MSMEs lack financing. SMEs drive 80% of jobs yet remain locked out of credit.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Source: World Bank / IFC</p>
              </CardContent>
            </Card>
            <Card className="text-center p-5">
              <CardContent className="pt-2">
                <div className="text-3xl font-bold text-primary mb-1">$1.1T</div>
                <p className="font-semibold text-xs mb-1">Mobile Money Transactions</p>
                <p className="text-[11px] text-muted-foreground">1.1 billion registered accounts generating data that can power alternative credit scoring across the continent.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Source: GSMA 2025</p>
              </CardContent>
            </Card>
            <Card className="text-center p-5">
              <CardContent className="pt-2">
                <div className="text-3xl font-bold text-primary mb-1">17%</div>
                <p className="font-semibold text-xs mb-1">Avg NPL Ratio (SSA)</p>
                <p className="text-[11px] text-muted-foreground">Banks across Africa are making bad loans without credit data. Nearly 3x the global average of 5.8%. Better data = fewer defaults.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Source: IMF Financial Soundness</p>
              </CardContent>
            </Card>
            <Card className="text-center p-5">
              <CardContent className="pt-2">
                <div className="text-3xl font-bold text-primary mb-1">42%</div>
                <p className="font-semibold text-xs mb-1">Adults Still Unbanked</p>
                <p className="text-[11px] text-muted-foreground">350M+ adults excluded from formal credit. Only 24% borrow formally. 100M+ lack official ID documents.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Source: World Bank Findex 2024</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-sm mb-5 text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              How CDH Compares to Alternatives
            </h3>
            <div className="space-y-3">
              {[
                { name: "TransUnion / Experian Africa", gap: "Coverage limited to South Africa + a few countries. No pan-African reach. Legacy on-premise architecture.", solve: "CDH covers all 54 countries with cloud-native multi-tenant architecture and cross-border entity resolution." },
                { name: "Country-Specific Bureaus (e.g. CRB Kenya)", gap: "Single-country systems with no cross-border capability. Separate systems per jurisdiction.", solve: "One platform across all jurisdictions. Your team learns one system, not dozens." },
                { name: "Building In-House", gap: "Years of development per country. No data sharing across institutions. No regulatory compliance automation.", solve: "Production-ready today with 16 integrated modules, regulatory compliance engine, and automated data retention." },
              ].map((comp) => (
                <Card key={comp.name} data-testid={`comp-${comp.name.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-xs">{comp.name}</h4>
                      </div>
                      <div className="lg:col-span-5">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-medium text-red-600 mb-0.5">Their Limitation</p>
                            <p className="text-xs text-muted-foreground">{comp.gap}</p>
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-5">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-medium text-green-600 mb-0.5">CDH Advantage</p>
                            <p className="text-xs text-muted-foreground">{comp.solve}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  What You Get With CDH
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Pan-African Compliance Engine", desc: "Per-country regulatory rules, export formats, and data protection for POPIA, NDPR, Ghana DPA, GDPR, and more — pre-built, not custom." },
                    { name: "Cross-Border Entity Resolution", desc: "Identify borrowers across jurisdictions by name, passport, or tax ID. No more hidden exposure from unlinked accounts." },
                    { name: "ML Credit Scoring with Alternative Data", desc: "Score thin-file borrowers using mobile money, utility payments, and telco data. Expand your lending safely." },
                    { name: "Blockchain-Anchored Audit Trail", desc: "Tamper-proof compliance evidence using Merkle tree verification. Satisfy any regulatory audit with confidence." },
                    { name: "API-First Integration", desc: "OAuth 2.1 API, HMAC-signed webhooks, and developer sandbox. Connect to your core banking system in days, not months." },
                    { name: "Multi-Currency Portfolio View", desc: "42+ currencies with automated exchange rates. See your total cross-border exposure in any denomination." },
                  ].map((m) => (
                    <div key={m.name} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  The Data Is Clear — Africa Needs Credit Infrastructure Now
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, title: "4.2% GDP Growth Across Africa (2025)", desc: "The African Development Bank forecasts 4.2% growth in 2025, with East Africa at 5.7%. Credit infrastructure must scale with this growth. (AfDB/World Bank)" },
                    { icon: Activity, title: "1,263 Fintechs Need Credit Data", desc: "Africa's fintech ecosystem tripled from 450 (2020) to 1,263 companies. The $230B financial services market grows 10% annually — all need credit data APIs. (IFC)" },
                    { icon: Scale, title: "Only 24% Borrow Formally", desc: "35% still rely on family and friends. Only 7% borrow via mobile money despite 40% having accounts. The lending infrastructure hasn't caught up with payments. (World Bank Findex 2024)" },
                    { icon: Banknote, title: "11.6% Average Borrowing Cost", desc: "African countries pay 8.5 percentage points more than US benchmarks. Germany borrows at 2.29%, Zambia at 22.5%. Better credit data reduces this premium. (IMF)" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">Source:</strong> World Bank Global Findex, IMF Financial Development Index, 
                    McKinsey Africa Fintech Report. Institutions that adopt credit infrastructure early gain a structural 
                    advantage as regulatory mandates expand.
                  </p>
                  <button
                    onClick={() => navigate("/market-validation")}
                    className="mt-2 text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-1"
                    data-testid="link-market-validation"
                  >
                    See full market analysis with sources <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover opacity-[0.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Instant Access — No Sign-Up Required</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Modernize Your Credit Operations?
          </h2>
          <p className="text-muted-foreground mb-3 text-sm sm:text-base max-w-xl mx-auto">
            Explore the full platform with live data. See dashboards, borrower management, 
            credit scoring, cross-border matching, and regulatory compliance in action.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8 max-w-md mx-auto">
            Register in under 2 minutes. Full admin access for 14 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="text-sm px-10 gap-2 shadow-lg"
              onClick={() => navigate("/start-trial")}
              data-testid="cta-bottom-trial"
            >
              <ArrowRight className="w-4 h-4" />
              Start a Free Trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/pricing")}
              data-testid="cta-bottom-pricing"
            >
              <CreditCard className="w-4 h-4" />
              View Plans & Pricing
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/security")}
              data-testid="cta-bottom-security"
            >
              <Shield className="w-4 h-4" />
              Security & Compliance
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">Africa Credit Hub</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Pan-African Credit Registry — CDH v2.1</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                Cross-jurisdictional credit data infrastructure serving 54 African countries. Built for banks, MFIs, regulators, and fintechs.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <MapPin className="w-3 h-3" />
                <span>Accra, Greater Accra Region, Ghana</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Carlson Capital</p>
              <div className="space-y-2 text-[11px] text-muted-foreground/80">
                <p className="font-medium text-foreground/80">Uffe Jon Carlson</p>
                <a href="mailto:uffe.carlson@gmail.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-3 h-3" />uffe.carlson@gmail.com
                </a>
                <a href="tel:+233552395548" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-3 h-3" />+233 552 395 548
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Systems In Motion</p>
              <div className="space-y-2 text-[11px] text-muted-foreground/80">
                <p className="font-medium text-foreground/80">Thomas Baafi</p>
                <a href="mailto:Thomas.baafi@prischell.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-3 h-3" />Thomas.baafi@prischell.com
                </a>
                <a href="tel:+233244339985" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-3 h-3" />+233 24 433 9985
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
            <p>&copy; {new Date().getFullYear()} Carlson Capital & Systems In Motion Limited. All rights reserved.</p>
            <p>africacredithub.com</p>
          </div>
        </div>
      </footer>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8 animate-in fade-in-0 duration-200"
          onClick={() => setLightboxImg(null)}
          data-testid="lightbox-overlay"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            data-testid="lightbox-close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            <p className="text-white/80 text-sm font-medium">{lightboxImg.title}</p>
          </div>
          <img
            src={lightboxImg.src}
            alt={lightboxImg.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            data-testid="lightbox-image"
          />
        </div>
      )}
    </div>
  );
}
