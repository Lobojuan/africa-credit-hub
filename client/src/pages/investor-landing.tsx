import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { isGhanaMode } from "@/lib/country-mode";
import {
  Shield, Globe, Users, CreditCard, BarChart3, Zap,
  CheckCircle2, ArrowRight, Building2, Scale, Lock,
  Languages, MapPin, TrendingUp, Bot, Upload,
  ChevronDown, Play, Star, Eye, FileText, Clock,
  Database, Layers, AlertTriangle, Target, Workflow,
  Search, Gavel, Settings, Key, RefreshCw, Landmark,
  PieChart, LineChart, Map, Fingerprint, ShieldCheck,
  UserCheck, FileCheck, Timer, BadgeCheck, Network,
  BookOpen, Headphones, Receipt, ServerCog, Banknote,
  CircleDollarSign, Activity, Hash, ChevronRight,
  Sparkles, MonitorSmartphone, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@assets/investor-hero.png";
import dashboardImage from "@assets/investor-dashboard.png";
import mobileImage from "@assets/investor-mobile.png";
import networkImage from "@assets/investor-network.png";

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
    title: "Fragmented Credit Data",
    desc: "Africa's 54 nations each have isolated credit information systems. A borrower defaulting in Kenya can freely obtain credit in Nigeria with no record trail, creating billions in hidden risk exposure.",
  },
  {
    icon: Languages,
    title: "Language & Regulatory Barriers",
    desc: "Operating across Anglophone, Francophone, Lusophone, and Arabophone regions requires navigating 5 official AU languages and dozens of conflicting regulatory frameworks simultaneously.",
  },
  {
    icon: CircleDollarSign,
    title: "Currency Complexity",
    desc: "With 42+ active currencies, financial institutions cannot accurately assess cross-border exposure without real-time exchange rate management and multi-currency portfolio aggregation.",
  },
  {
    icon: Shield,
    title: "No Unified Compliance Standard",
    desc: "Each country has distinct data retention laws, consent requirements, and reporting obligations. No existing system provides a unified compliance framework across all African jurisdictions.",
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


function launchDemo() {
  window.location.href = `/api/demo-login`;
}

export default function InvestorLandingPage() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeModuleCategory, setActiveModuleCategory] = useState(0);

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
            Purpose-built for central banks, commercial banks, MFIs, and fintechs
            by <strong className="text-foreground/80">Systems In Motion Limited</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button size="lg" className="text-sm px-8 gap-2 shadow-lg" onClick={() => navigate("/start-trial")} data-testid="cta-try-demo">
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

      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Platform Preview
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Enterprise Analytics at Your Fingertips
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                CDH v2.0 delivers real-time credit intelligence through interactive dashboards,
                geographic visualization, and role-based views — designed for decision-makers
                managing portfolio risk across the continent.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Interactive KPI dashboards with drill-down analytics",
                  "Geographic heat maps showing portfolio distribution across 54 countries",
                  "Real-time credit score computation with AI-powered explainability",
                  "Multi-currency exposure tracking with automated exchange rates",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={launchDemo} className="gap-2" data-testid="cta-preview-demo">
                <Play className="w-4 h-4" />
                See It Live
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src={dashboardImage}
                  alt="CDH v2.0 Analytics Dashboard showing credit portfolio metrics"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 sm:w-40 rounded-xl overflow-hidden border-2 border-background shadow-xl">
                <img
                  src={mobileImage}
                  alt="Consumer credit check on mobile device"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">The Challenges You Face</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The Credit Data Problems Costing Your Institution
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Fragmented credit data across 54 nations means hidden borrower risk, 
              compliance complexity, and missed lending opportunities. Sound familiar?
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
              <span className="text-sm font-medium">CDH v2.0 solves all four challenges in a single, unified platform.</span>
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
                  alt="Pan-African data network connecting 54 countries"
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
              Experience it yourself — instantly access the full platform with demo data:
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
            <Button onClick={launchDemo} className="gap-2" data-testid="cta-live-data-demo">
              <Play className="w-4 h-4" />
              Launch Demo — No Login Required
            </Button>
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
              { step: "1", title: "Start Free Trial", desc: "Register your organization and get full admin access for 14 days. No credit card required. Explore every feature with real data.", cta: "Start Trial", action: () => navigate("/start-trial"), testId: "step-demo" },
              { step: "2", title: "Choose Your Plan", desc: "Standard for MFIs and fintechs. Professional for regional banks. Enterprise for central banks and tier-1 institutions.", cta: "View Pricing", action: () => navigate("/pricing"), testId: "step-pricing" },
              { step: "3", title: "Go Live", desc: "Connect via API or batch upload. Configure your regulatory profile. Start managing credit data across your jurisdictions.", cta: "Explore Platform", action: launchDemo, testId: "step-deploy" },
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
            <Badge variant="outline" className="mb-4">Why Institutions Choose CDH</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The Only Platform Built for All of Africa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Existing alternatives cover a single country or sub-region. CDH is the only credit registry 
              platform designed for pan-African operation from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center p-6">
              <CardContent className="pt-2">
                <div className="text-4xl font-bold text-primary mb-2">54</div>
                <p className="font-semibold text-sm mb-1">Countries Covered</p>
                <p className="text-xs text-muted-foreground">Complete continental coverage. No competitor covers more than a single region. Deploy once, operate everywhere.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-2">
                <div className="text-4xl font-bold text-primary mb-2">37+</div>
                <p className="font-semibold text-sm mb-1">Central Bank Mandates</p>
                <p className="text-xs text-muted-foreground">Credit reporting is becoming mandatory across Africa. CDH ensures your institution is compliant in every jurisdiction you operate.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-2">
                <div className="text-4xl font-bold text-primary mb-2">350M+</div>
                <p className="font-semibold text-sm mb-1">Underserved Adults</p>
                <p className="text-xs text-muted-foreground">Over 350 million adults lack access to formal credit. Alternative data scoring lets your institution serve this untapped market.</p>
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
                  The Market Is Moving — Don't Get Left Behind
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Scale, title: "Regulatory Mandates Accelerating", desc: "37+ African central banks are enacting credit reporting legislation. Compliance is becoming mandatory, not optional." },
                    { icon: Globe, title: "AfCFTA Requires Data Harmonization", desc: "The African Continental Free Trade Area (1.4B people) needs harmonized financial data for cross-border lending." },
                    { icon: Network, title: "Digital Infrastructure Is Ready", desc: "Mobile money (M-Pesa, MTN MoMo) and 43% internet penetration mean the rails exist to deploy SaaS at scale." },
                    { icon: Users, title: "350M+ Financially Excluded Adults", desc: "Alternative data scoring can bring them into the credit system — but only with shared data infrastructure." },
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
              data-testid="cta-bottom-demo"
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
            <p>Pan-African Credit Registry — CDH v2.1</p>
            <p>&copy; {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
