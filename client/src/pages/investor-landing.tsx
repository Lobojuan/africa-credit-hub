import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
      "Generate investor-grade portfolio analytics with interactive dashboards",
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

const TECH_ARCHITECTURE = [
  { name: "React 19 + TypeScript", desc: "Type-safe, component-driven frontend with hot reload", icon: Layers },
  { name: "Express.js", desc: "High-performance RESTful API with session management", icon: ServerCog },
  { name: "PostgreSQL + Drizzle ORM", desc: "Enterprise-grade relational data with type-safe queries", icon: Database },
  { name: "Recharts", desc: "Interactive, responsive data visualization library", icon: LineChart },
  { name: "Tailwind CSS + shadcn/ui", desc: "Consistent design system with 50+ UI components", icon: Layers },
  { name: "i18next", desc: "Internationalization engine with RTL and 5-language support", icon: Languages },
  { name: "SHA-256 Hash Chains", desc: "Tamper-evident cryptographic audit trail integrity", icon: Hash },
  { name: "TOTP MFA", desc: "Time-based one-time password multi-factor authentication", icon: Fingerprint },
];

const ROADMAP_ITEMS = [
  { phase: "Current", title: "CDH v1.2", items: ["Full 54-country coverage", "42+ currency support", "Maker-checker workflows", "Visual analytics dashboard", "AI chatbot assistant"], status: "live" },
  { phase: "Next", title: "CDH v1.3", items: ["Real-time WebSocket notifications", "Mobile-responsive PWA", "Biometric authentication", "Advanced ML credit scoring", "Blockchain audit anchoring"], status: "planned" },
  { phase: "Future", title: "CDH v2.0", items: ["Open Banking API gateway", "RegTech automation suite", "Predictive default modeling", "Digital identity integration", "Pan-African credit passport"], status: "vision" },
];

export default function InvestorLandingPage() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeModuleCategory, setActiveModuleCategory] = useState(0);

  useEffect(() => {
    document.title = "Pan-African Credit Registry System | CDH v1.2 — Systems In Motion Limited";
    const meta = document.querySelector('meta[name="description"]');
    const content = "The first SRS-compliant credit information sharing platform covering all 54 African countries with 42+ currencies, 5 AU languages, and enterprise-grade security.";
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
    { label: "Problem", id: "problem" },
    { label: "Platform", id: "platform" },
    { label: "Use Cases", id: "use-cases" },
    { label: "Advantage", id: "advantage" },
    { label: "Technology", id: "tech" },
    { label: "Roadmap", id: "roadmap" },
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
              <span className="text-[10px] text-muted-foreground ml-1.5">v1.2</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="text-[11px] px-2 hidden lg:inline-flex"
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
              >
                {item.label}
              </Button>
            ))}
            <Button
              size="sm"
              className="text-xs ml-2"
              onClick={() => navigate("/")}
              data-testid="nav-login"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Live Demo
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
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(175 55% 28%)" }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(43 80% 55%)" }} />
          <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "hsl(200 60% 40%)" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1 font-medium" data-testid="badge-version">
            <Star className="w-3 h-3 mr-1" />
            Cross-Jurisdictional CDH v1.2 — Systems In Motion Limited
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block">Pan-African</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(175 55% 32%), hsl(175 55% 22%), hsl(43 80% 50%))" }}
            >
              Credit Registry System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            The first fully SRS-compliant credit information sharing platform covering
            all <strong className="text-foreground">54 African countries</strong> — purpose-built for
            central banks, commercial banks, DFIs, and fintechs to transform credit risk
            management across the continent.
          </p>

          <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto mb-10">
            Built by <strong className="text-foreground/80">Systems In Motion Limited</strong> to address
            Africa's $4.8 trillion credit information gap.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button size="lg" className="text-sm px-8 gap-2 shadow-lg" onClick={() => navigate("/")} data-testid="cta-try-demo">
              <Play className="w-4 h-4" />
              Try Interactive Demo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="cta-explore"
            >
              Explore the Opportunity
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

      <section id="problem" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">The Problem</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Africa's Credit Information Crisis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              With 1.4 billion people across 54 nations, Africa has no unified credit information
              infrastructure. This creates systemic risk for lenders and excludes hundreds of millions
              from formal credit markets.
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
              <span className="text-sm font-medium">CDH v1.2 solves all four challenges in a single, unified platform.</span>
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

      <section id="use-cases" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Use Cases</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Who Benefits and How
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              CDH v1.2 serves every participant in the African credit ecosystem —
              from central bank supervisors to microfinance lenders.
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
            <Badge variant="outline" className="mb-4 text-xs">Competitive Advantage</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why CDH v1.2 Stands Alone
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              No other credit bureau platform addresses Africa's unique challenges at this scale,
              depth, and regulatory rigor.
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
            <Badge variant="outline" className="mb-4 text-xs">Live System Data</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Production-Ready, Not a Prototype
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              CDH v1.2 ships with a fully seeded database for realistic evaluation.
              Every feature works with real data — not mockups or placeholders.
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
              Try it yourself — log in with any of the demo roles and explore with real data:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { role: "Admin", desc: "Full system access" },
                { role: "Regulator", desc: "Supervisory oversight" },
                { role: "Bank Officer", desc: "Credit operations" },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{r.role}</span>
                  <span className="text-muted-foreground">— {r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tech" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Technology Architecture</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Enterprise-Grade Technical Foundation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Built with proven, battle-tested technologies chosen for reliability,
              security, and long-term maintainability.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {TECH_ARCHITECTURE.map((tech) => (
              <div
                key={tech.name}
                className="rounded-xl border border-border/50 bg-card p-4 text-center hover:border-primary/30 transition-colors"
                data-testid={`tech-${tech.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
              >
                <tech.icon className="w-5 h-5 mx-auto mb-2 text-primary/70" />
                <p className="font-semibold text-xs mb-1">{tech.name}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h3 className="font-semibold text-sm mb-4 text-center">Security Architecture Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Lock, text: "End-to-end session encryption with httpOnly cookies" },
                  { icon: Fingerprint, text: "TOTP multi-factor authentication with QR provisioning" },
                  { icon: Hash, text: "SHA-256 hash chain audit trail (tamper-evident)" },
                  { icon: ShieldCheck, text: "Route-level RBAC enforcement on all API endpoints" },
                  { icon: Timer, text: "15-min idle timeout + account lockout after 3 failures" },
                  { icon: FileCheck, text: "90-day password rotation with complexity requirements" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">Product Roadmap</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Vision & Growth Trajectory
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              CDH v1.2 is a production-ready foundation with a clear path to becoming
              the definitive credit infrastructure layer for the African continent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ROADMAP_ITEMS.map((phase) => (
              <Card
                key={phase.phase}
                className={`border ${phase.status === "live" ? "border-primary/40 shadow-md" : "border-border/60"}`}
                data-testid={`roadmap-${phase.phase.toLowerCase()}`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant={phase.status === "live" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {phase.status === "live" ? "LIVE" : phase.status === "planned" ? "PLANNED" : "VISION"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{phase.phase}</span>
                  </div>
                  <h3 className="font-bold text-base mb-3">{phase.title}</h3>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {phase.status === "live" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(175 55% 28%) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            See It in Action
          </h2>
          <p className="text-muted-foreground mb-3 text-sm sm:text-base max-w-xl mx-auto">
            Explore the full system with our interactive demo. Choose from Admin,
            Regulator, or Bank Officer roles to see role-based access in action —
            complete with a guided walkthrough tour.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8 max-w-md mx-auto">
            No installation required. Live data. Full functionality. Try every feature described above.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="text-sm px-10 gap-2 shadow-lg"
              onClick={() => navigate("/")}
              data-testid="cta-bottom-demo"
            >
              <Play className="w-4 h-4" />
              Launch Interactive Demo
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
            <p>Confidential & Proprietary</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
