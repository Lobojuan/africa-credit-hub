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
  Sparkles, MonitorSmartphone, Brain, Mail, Phone, X, ZoomIn, Play,
  Trophy, XCircle, Medal, Cpu, Wifi, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useBrandColors, withAlpha } from "@/hooks/use-brand-colors";
import { useTranslation } from "react-i18next";
import heroImage from "@assets/investor-hero.png";
import dashboardImage from "@assets/app-dashboard.png";
import mobileImage from "@assets/app-consumer-portal.png";
import networkImage from "@assets/app-command-center.png";
import borrowersImage from "@assets/app-borrowers.png";
import creditAccountsImage from "@assets/app-credit-accounts.png";
import auditImage from "@assets/app-audit.png";
import reportsImage from "@assets/app-reports.png";
import aiPortfolioImage from "@assets/app-ai-portfolio.png";
import platformDemoVideo from "@assets/39a45e79-6d03-456d-8d41-f5c491f40a66_1774472320799.mp4";
import { PLATFORM_COMPANY_NAME, PLATFORM_SUPPORT_EMAIL, supportEmailHref } from "@/lib/platform-config";

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
  { value: 8, suffix: "", label: "Languages", icon: Languages },
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
    color: "brand-accent",
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
    color: "brand-secondary",
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
          "Multilingual support across all 8 languages",
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
        title: "8-Language Localization",
        details: [
          "Complete UI translation: English, French, Portuguese, Arabic, Swahili, Spanish, Simplified Chinese, and Traditional Chinese",
          "Arabic RTL (right-to-left) layout support with automatic text direction",
          "All documentation available in EN, FR, AR, SW, ES, ZH-S, and ZH-T",
          "Dynamic language switching without page reload",
        ],
      },
    ],
  },
  {
    category: "v2.6 — Competitive Differentiators",
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
          "Volume-based billing tiers with automatic tier progression as usage grows",
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
    metric: "8",
    label: "Languages",
    desc: "Complete localization including Arabic RTL, Spanish, Simplified Chinese, and Traditional Chinese support.",
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
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const brandColors = useBrandColors();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const resolveModuleColor = (color: string) =>
    color === "brand-accent" ? brandColors.accent : color === "brand-secondary" ? brandColors.secondary : color;
  const previousTheme = useRef<string | null>(null);

  useEffect(() => {
    previousTheme.current = theme;
  }, []);

  useEffect(() => {
    if (!lightboxImg) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImg(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [lightboxImg]);

  useEffect(() => {
    document.title = isGhanaMode() 
      ? `Ghana Credit Registry System | Africa Credit Hub v2.6 — ${PLATFORM_COMPANY_NAME}`
      : "Pan-African Credit Registry | Africa Credit Hub v2.6 — Modernize Your Credit Infrastructure";
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
    { label: "Why Us", id: "advantage" },
    { label: "Market", id: "market-proof" },
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
              style={{ background: brandColors.headerGradient }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Africa Credit Hub</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">v2.6</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs hidden sm:inline-flex" onClick={() => navigate("/security")} data-testid="nav-security-link">
              Security
            </Button>
            <ThemeToggle />
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate("/login")}
              data-testid="nav-login"
            >
              {t('landing.logIn')}
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => navigate("/start-trial")}
              data-testid="nav-start-trial"
            >
              {t('landing.startFreeTrial')}
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
              backgroundImage: brandColors.heroDotPattern,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: brandColors.glowA }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: brandColors.glowB }} />
          <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "hsl(200 60% 40%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-right flex flex-col justify-center lg:items-end">
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 font-medium" data-testid="badge-version">
                <Star className="w-3 h-3 mr-1" />
                {t('landing.versionBadge')}
              </Badge>

              <div className="flex items-center gap-2 mb-6 justify-center lg:justify-end" data-testid="system-clock">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground/80 font-mono tracking-tight">
                  {currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  {" "}
                  {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  {" GMT"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
                <span className="block">{t('landing.heroTitle1')}</span>
                <span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: brandColors.textGradient }}
                >
                  {t('landing.heroTitle2')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('landing.heroDesc') }}
              />

              <p className="text-sm text-muted-foreground/80 max-w-xl mb-8"
                dangerouslySetInnerHTML={{ __html: t('landing.heroSubDesc') }}
              />

              <div className="flex flex-col sm:flex-row items-center lg:items-end justify-center lg:justify-end gap-3 mb-8">
                <Button size="lg" className="text-sm px-8 gap-2 shadow-lg" onClick={() => navigate("/start-trial")} data-testid="cta-try-trial">
                  <ArrowRight className="w-4 h-4" />
                  {t('landing.startTrial')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-sm px-8 gap-2"
                  onClick={() => navigate("/contact-sales")}
                  data-testid="cta-explore"
                >
                  {t('landing.contactSales')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-xl bg-black relative" style={{ maxHeight: "470px" }}>
                <video
                  ref={videoRef}
                  src={platformDemoVideo}
                  playsInline
                  controls={videoPlaying}
                  className="w-auto h-full max-h-[470px] mx-auto"
                  data-testid="video-platform-demo"
                  onEnded={() => setVideoPlaying(false)}
                />
                {!videoPlaying && (
                  <button
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer transition-all hover:bg-black/30 group"
                    onClick={() => {
                      setVideoPlaying(true);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                      }
                    }}
                    data-testid="button-play-video"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-black ml-1" />
                    </div>
                    <span className="text-white/80 text-xs mt-3 font-medium tracking-wide">Watch Intro</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto mt-12 lg:mt-16">
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

          <div className="mt-12 animate-bounce">
            <ChevronDown className="w-5 h-5 mx-auto text-muted-foreground/50" />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 border-b border-border/30 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground mb-5 font-medium uppercase tracking-wider">{t('landing.compliantWith')}</p>
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
              t('landing.mobileMoney'),
              t('landing.papss'),
              t('landing.currencies42'),
              t('landing.auLanguages'),
              t('landing.offlineBatch'),
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
                {t('landing.platformPreview')}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                {t('landing.dashboardTitle')}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                {t('landing.dashboardDesc')}
              </p>
              <div className="space-y-3 mb-6">
                {[
                  t('landing.dashboardF1'),
                  t('landing.dashboardF2'),
                  t('landing.dashboardF3'),
                  t('landing.dashboardF4'),
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/start-trial")} className="gap-2" data-testid="cta-preview-trial">
                <ArrowRight className="w-4 h-4" />
                {t('landing.startFreeTrial')}
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <img
                  src={dashboardImage}
                  alt="Africa Credit Hub v2.6 dashboard showing borrowers, credit accounts, and portfolio analytics"
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
          backgroundImage: `radial-gradient(circle at 20% 50%, ${brandColors.accentLight} 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${brandColors.secondary} 0%, transparent 50%)`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs border-primary/30 bg-background/80">
              <Brain className="w-3 h-3 mr-1 text-primary" />
              {t('landing.aiBadge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.aiTitle')}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              {t('landing.aiDesc')}
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
              <h3 className="text-xl sm:text-2xl font-bold mb-6">{t('landing.aiPortfolioTitle')}</h3>
              <div className="space-y-5">
                {[
                  {
                    icon: AlertTriangle,
                    title: t('landing.aiDefaultTitle'),
                    desc: t('landing.aiDefaultDesc'),
                    color: "text-red-500",
                    bg: "bg-red-500/10",
                  },
                  {
                    icon: Eye,
                    title: t('landing.aiEarlyTitle'),
                    desc: t('landing.aiEarlyDesc'),
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    icon: TrendingUp,
                    title: t('landing.aiTrendTitle'),
                    desc: t('landing.aiTrendDesc'),
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                  },
                  {
                    icon: Target,
                    title: t('landing.aiCollectionTitle'),
                    desc: t('landing.aiCollectionDesc'),
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
                title: t('landing.aiMlTitle'),
                desc: t('landing.aiMlDesc'),
                badge: t('landing.aiMlBadge'),
              },
              {
                icon: ShieldCheck,
                title: t('landing.aiFraudTitle'),
                desc: t('landing.aiFraudDesc'),
                badge: t('landing.aiFraudBadge'),
              },
              {
                icon: Activity,
                title: t('landing.aiAltTitle'),
                desc: t('landing.aiAltDesc'),
                badge: t('landing.aiAltBadge'),
              },
              {
                icon: Headphones,
                title: t('landing.aiDisputeTitle'),
                desc: t('landing.aiDisputeDesc'),
                badge: t('landing.aiDisputeBadge'),
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
                <h3 className="text-lg sm:text-xl font-bold mb-2">{t('landing.aiWhyTitle')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.aiWhyDesc')}
                </p>
              </div>
              <Button onClick={() => navigate("/ai-demo")} size="lg" className="gap-2 shrink-0" data-testid="cta-ai-trial">
                <Zap className="w-4 h-4" />
                {t('landing.aiTryFeatures')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.problemBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.problemTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {t('landing.problemDesc')}
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
              <span className="text-sm font-medium">Africa Credit Hub v2.6 addresses all four challenges in a single, unified platform — backed by real data.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.solutionBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.solutionTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.solutionDesc')}
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
                style={activeModuleCategory === i ? { background: resolveModuleColor(cat.color) } : {}}
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
                      style={{ background: `linear-gradient(135deg, ${resolveModuleColor(PLATFORM_MODULES[activeModuleCategory].color)}, ${withAlpha(resolveModuleColor(PLATFORM_MODULES[activeModuleCategory].color), 0.87)})` }}
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
                Africa Credit Hub v2.6 is the only credit registry platform engineered for all 54 African nations —
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
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.useCaseBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.useCaseTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.useCaseDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {USE_CASES.map((uc) => (
              <Card key={uc.role} className="border border-border/60" data-testid={`usecase-${uc.role.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ background: brandColors.headerGradient }}
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
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.advantageBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.advantageTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.advantageDesc')}
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
                  style={{ backgroundImage: brandColors.textGradient }}
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
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.prodBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              {t('landing.prodTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              {t('landing.prodDesc')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: t('landing.prodBorrowerProfiles'), value: t('landing.prodBorrowerValue'), detail: t('landing.prodBorrowerDetail') },
              { label: t('landing.prodCreditAccounts'), value: t('landing.prodCreditValue'), detail: t('landing.prodCreditDetail') },
              { label: t('landing.prodAuditTrail'), value: t('landing.prodAuditValue'), detail: t('landing.prodAuditDetail') },
              { label: t('landing.prodExchangeRates'), value: t('landing.prodExchangeValue'), detail: t('landing.prodExchangeDetail') },
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
              {t('landing.prodTrialPrompt')}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {[
                { role: t('landing.prodRoleAdmin'), desc: t('landing.prodRoleAdminDesc'), icon: Settings },
                { role: t('landing.prodRoleRegulator'), desc: t('landing.prodRoleRegulatorDesc'), icon: Gavel },
                { role: t('landing.prodRoleBankOfficer'), desc: t('landing.prodRoleBankOfficerDesc'), icon: Building2 },
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
              {t('landing.startFreeTrial')}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">
              <MonitorSmartphone className="w-3 h-3 mr-1" />
              {t('landing.screenshotsBadge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.screenshotsTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {t('landing.screenshotsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { img: borrowersImage, title: t('landing.screenshotBorrowers'), desc: t('landing.screenshotBorrowersDesc') },
              { img: creditAccountsImage, title: t('landing.screenshotCredits'), desc: t('landing.screenshotCreditsDesc') },
              { img: reportsImage, title: t('landing.screenshotReports'), desc: t('landing.screenshotReportsDesc') },
              { img: auditImage, title: t('landing.screenshotAudit'), desc: t('landing.screenshotAuditDesc') },
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
                <Badge variant="outline" className="mb-3 text-xs">{t('landing.consumerBadge')}</Badge>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">{t('landing.consumerTitle')}</h3>
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
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.securityBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.securityTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.securityDesc')}
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
              {t('landing.securityViewFull')}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs">{t('landing.onboardBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.onboardTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.onboardDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: "1", title: t('landing.onboardStep1Title'), desc: t('landing.onboardStep1Desc'), cta: t('landing.onboardStep1Cta'), action: () => navigate("/start-trial"), testId: "step-trial" },
              { step: "2", title: t('landing.onboardStep2Title'), desc: t('landing.onboardStep2Desc'), cta: t('landing.onboardStep2Cta'), action: () => navigate("/contact-sales"), testId: "step-pricing" },
              { step: "3", title: t('landing.onboardStep3Title'), desc: t('landing.onboardStep3Desc'), cta: t('landing.onboardStep3Cta'), action: () => window.open(supportEmailHref(), "_blank", "noopener,noreferrer"), testId: "step-deploy" },
            ].map((item) => (
              <Card key={item.step} className="border border-border/60" data-testid={item.testId}>
                <CardContent className="p-5 sm:p-6 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold"
                    style={{ background: brandColors.headerGradient }}
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

      {/* ═══════════════════════════════════════════════════════════
          GLOBAL COMPETITIVE INTELLIGENCE SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="vs-global" className="py-20 sm:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Trophy className="w-3 h-3" />
              Global Competitive Intelligence
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why African Institutions Choose Us Over Experian, TransUnion & Equifax<br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: brandColors.textGradient }}>
                {" "}Across All of Africa
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              The global credit bureau giants built empires in North America and Europe — then stopped. Experian has direct operations in roughly 12 African countries. TransUnion operates in 8. Equifax has no African operations. Africa Credit Hub was designed from the ground up to serve every African nation.
            </p>
          </div>

          {/* Industry Snapshot Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              { val: "$7.5B", label: "Experian Annual Revenue (FY2025)", sub: "Yet direct operations in only ~12 of 54 African nations", icon: DollarSign, color: "text-red-500" },
              { val: "8 / 54", label: "African Countries (TransUnion)", sub: "The most Africa-focused global bureau still misses 46 nations", icon: Globe, color: "text-amber-500" },
              { val: "0 / 54", label: "African Countries (Equifax)", sub: "The world's No.2 bureau by market cap has no African operations", icon: XCircle, color: "text-red-500" },
              { val: "488K+", label: "CFPB Consumer Complaints", sub: "Filed against Big 3 bureaus 2021–2024 — CFPB public database", icon: AlertTriangle, color: "text-amber-500" },
            ].map((item) => (
              <Card key={item.label} className="text-center p-4 border-border/60">
                <CardContent className="pt-2">
                  <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                  <div className="text-2xl font-bold mb-1">{item.val}</div>
                  <p className="text-xs font-semibold mb-1">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Head-to-Head Comparison Table */}
          <div className="mb-14">
            <h3 className="font-bold text-center text-base mb-6">Feature-by-Feature: Africa Credit Hub vs. The World's Largest Bureaus</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-[26%]">Feature</th>
                    <th className="py-3 px-3 text-center font-bold w-[22%]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: brandColors.headerGradient, color: "white" }}>
                        <Trophy className="w-3 h-3" />
                        Africa Credit Hub
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center text-muted-foreground font-semibold w-[17%]">Experian</th>
                    <th className="py-3 px-3 text-center text-muted-foreground font-semibold w-[17%]">TransUnion</th>
                    <th className="py-3 px-3 text-center text-muted-foreground font-semibold w-[18%]">Equifax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    {
                      feature: "African Countries Covered",
                      us: "54 / 54 — Every Nation",
                      experian: "~12 / 54",
                      transunion: "8 / 54",
                      equifax: "0 / 54",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Platform Languages",
                      us: "8 (incl. Arabic RTL, Chinese, Spanish)",
                      experian: "1–2",
                      transunion: "1–2",
                      equifax: "1",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Supported Currencies",
                      us: "42+ African + major FX",
                      experian: "1–3",
                      transunion: "1–3",
                      equifax: "1",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "AI Command Center (NL queries)",
                      us: "✓ Full natural-language AI",
                      experian: "✗ None",
                      transunion: "✗ None",
                      equifax: "✗ None",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Telco & Mobile Money Scoring",
                      us: "✓ Built-in alternative scoring",
                      experian: "✗ Not for Africa",
                      transunion: "⚠ Pilot only",
                      equifax: "✗ None",
                      usGood: true, exGood: false, tuGood: null, eqGood: false,
                    },
                    {
                      feature: "Islamic Finance (Interest-Free)",
                      us: "✓ Native flag per account",
                      experian: "✗",
                      transunion: "✗",
                      equifax: "✗",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "PAPSS Cross-Border Integration",
                      us: "✓ Real-time settlement tracking",
                      experian: "✗",
                      transunion: "✗",
                      equifax: "✗",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Maker-Checker Dual Approval",
                      us: "✓ Built-in every write operation",
                      experian: "✗ Not standard",
                      transunion: "✗ Not standard",
                      equifax: "✗",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Architecture",
                      us: "Cloud-native multi-tenant SaaS",
                      experian: "Legacy + SaaS hybrid",
                      transunion: "Legacy + SaaS hybrid",
                      equifax: "Legacy mainframe",
                      usGood: true, exGood: null, tuGood: null, eqGood: false,
                    },
                    {
                      feature: "Time to Deploy New Country",
                      us: "Instant — already live",
                      experian: "18–24 months",
                      transunion: "12–18 months",
                      equifax: "N/A (not in Africa)",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Automated Regulatory Exports",
                      us: "✓ BoG, BSL, CBN, and more",
                      experian: "✗ Manual process",
                      transunion: "✗ Manual process",
                      equifax: "N/A",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Blockchain Audit Trail",
                      us: "✓ SHA-256 hash-chained",
                      experian: "✗",
                      transunion: "✗",
                      equifax: "✗",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                    {
                      feature: "Consumer Self-Service Portal",
                      us: "✓ Full self-service + dispute filing",
                      experian: "⚠ Basic (mature markets only)",
                      transunion: "⚠ Basic (SA only)",
                      equifax: "N/A",
                      usGood: true, exGood: null, tuGood: null, eqGood: false,
                    },
                    {
                      feature: "Pricing Model",
                      us: "Transparent SaaS subscription",
                      experian: "Opaque enterprise licensing",
                      transunion: "Opaque enterprise licensing",
                      equifax: "Per-query + licensing",
                      usGood: true, exGood: false, tuGood: false, eqGood: false,
                    },
                  ].map((row) => (
                    <tr key={row.feature} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground/90">{row.feature}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">{row.us}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.exGood === false ? (
                          <span className="text-red-500/80">{row.experian}</span>
                        ) : row.exGood === null ? (
                          <span className="text-amber-500/90">{row.experian}</span>
                        ) : (
                          <span className="text-muted-foreground">{row.experian}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.tuGood === false ? (
                          <span className="text-red-500/80">{row.transunion}</span>
                        ) : row.tuGood === null ? (
                          <span className="text-amber-500/90">{row.transunion}</span>
                        ) : (
                          <span className="text-muted-foreground">{row.transunion}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.eqGood === false ? (
                          <span className="text-red-500/80">{row.equifax}</span>
                        ) : (
                          <span className="text-muted-foreground">{row.equifax}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              Sources: Experian Annual Report FY2025, TransUnion 2024 Investor Day, Equifax 10-K 2024, GSMA 2025, World Bank Findex 2024, CFPB Complaint Database. Feature comparisons reflect publicly documented product capabilities.
            </p>
          </div>

          {/* Why We Win — 4 Big Differentiators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {[
              {
                icon: Globe,
                title: "54 vs. 8 Countries",
                sub: "Widest Pan-African Footprint",
                desc: "TransUnion — the most Africa-focused global bureau — operates in 8 countries. Africa Credit Hub's platform and regulatory frameworks are configured for all 54 African nations, from one system with one API and zero per-country licensing overhead.",
                accent: "from-blue-500/10 to-blue-600/5",
                iconColor: "text-blue-500",
              },
              {
                icon: Cpu,
                title: "AI-Native From Day One",
                sub: "Not a Bolt-On Feature",
                desc: "While incumbents retrofit AI onto 30-year-old mainframes, our AI Command Center, Portfolio Intelligence, and real-time Risk Analysis were built into the architecture from the ground up.",
                accent: "from-purple-500/10 to-purple-600/5",
                iconColor: "text-purple-500",
              },
              {
                icon: Wifi,
                title: "Built to Score the Unbanked",
                sub: "Alternative Data Module Included",
                desc: "Studies show African lenders cannot score 70%+ of applicants using traditional bureau data alone (Credolab, 2024). Our Telco Scoring module is built to ingest airtime, M-Pesa, and top-up data — extending credit visibility to thin-file borrowers incumbents can't assess.",
                accent: "from-green-500/10 to-green-600/5",
                iconColor: "text-green-500",
              },
              {
                icon: Zap,
                title: "Hours. Not 24 Months.",
                sub: "Deployment Speed Advantage",
                desc: "Legacy bureau deployments typically take 18–24 months per new country. Africa Credit Hub's regulatory frameworks and platform are pre-configured for all 54 jurisdictions — institutions can begin filing data within hours of onboarding.",
                accent: "from-amber-500/10 to-amber-600/5",
                iconColor: "text-amber-500",
              },
            ].map((item) => (
              <Card key={item.title} className={`bg-gradient-to-br ${item.accent} border-border/60`}>
                <CardContent className="pt-5 pb-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-background/80 mb-3 ${item.iconColor}`}>
                    <item.icon className="w-4.5 h-4.5 w-5 h-5" />
                  </div>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${item.iconColor}`}>{item.sub}</p>
                  <h4 className="font-bold text-base mb-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Competitor Deep-Dives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              {
                name: "Experian",
                revenue: "$7.52B revenue (FY2025)",
                hq: "Dublin, Ireland",
                africaCount: "~12 countries",
                rating: "Limited Africa footprint",
                weaknesses: [
                  "South Africa is the only country with substantial direct operations",
                  "Additional African presence primarily via 2019 Compuscan acquisition",
                  "Legacy on-premise architecture dominates many deployments",
                  "No pan-African multi-currency credit view",
                  "No Islamic finance or PAPSS integration",
                  "English-first platform; limited African language support",
                  "No AI Command Center or natural-language portfolio queries",
                ],
              },
              {
                name: "TransUnion",
                revenue: "$4.0B revenue (2024)",
                hq: "Chicago, USA",
                africaCount: "8 countries",
                rating: "Most Africa-focused global bureau",
                weaknesses: [
                  "Only 8 of 54 African countries — West, Central, North Africa uncovered",
                  "No presence in Nigeria, Ethiopia, Egypt, Tanzania, Ghana, or DRC",
                  "Fragmented country-by-country deployments with inconsistent data models",
                  "No AI Command Center or portfolio-level natural-language intelligence",
                  "Telco alternative scoring is pilot-stage only, not production-ready",
                  "No PAPSS integration or cross-border settlement tracking",
                  "No Islamic finance product support built into the platform",
                ],
              },
              {
                name: "Equifax",
                revenue: "$5.53B revenue (2024)",
                hq: "Atlanta, USA",
                africaCount: "0 countries",
                rating: "No African operations",
                weaknesses: [
                  "Zero African presence — entirely absent from all 54 nations",
                  "Strategic focus is Americas (US, Canada, Brazil) and select European markets",
                  "2017 breach (147M records) highlighted legacy mainframe security risks",
                  "Mainframe-first architecture with an acknowledged multi-year modernisation lag",
                  "No multi-currency African credit view or regional data model",
                  "No Arabic, Swahili, or French (Africa context) platform support",
                  "Not a viable option for African financial institutions by design",
                ],
              },
            ].map((comp) => (
              <Card key={comp.name} className="border-border/60">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm">{comp.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{comp.revenue} · {comp.hq}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">{comp.africaCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-muted/50">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[10px] text-muted-foreground font-medium">Africa status: {comp.rating}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Why They Fall Short in Africa</p>
                  <ul className="space-y-1.5">
                    {comp.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{w}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Market Opportunity CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Medal className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">The Opportunity</p>
                  </div>
                  <h3 className="font-bold text-lg mb-2">The Global Credit Bureau Market Reaches $191B by 2029</h3>
                  <p className="text-sm text-muted-foreground mb-3">Africa is the fastest-growing region — and the least served. With a CAGR of 13% and 350M+ unscored adults, this is the largest untapped credit data market on earth. The AI credit scoring market alone is growing at 25.9% CAGR. Africa Credit Hub is the only platform built to capture it.</p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { val: "$191B", desc: "Global bureau market by 2029 (13% CAGR)" },
                      { val: "350M+", desc: "Unbanked adults with no credit score" },
                      { val: "25.9%", desc: "AI credit scoring CAGR (2024–2031)" },
                      { val: "1,263", desc: "African fintechs needing credit data APIs" },
                    ].map((s) => (
                      <div key={s.val} className="text-center">
                        <div className="text-lg font-bold text-primary">{s.val}</div>
                        <div className="text-[10px] text-muted-foreground max-w-[100px]">{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    className="gap-2 text-sm"
                    onClick={() => window.location.href = "/start-trial"}
                    data-testid="cta-vs-global-trial"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Start Free — No Credit Card
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-sm"
                    onClick={() => window.location.href = "/market-validation"}
                    data-testid="cta-vs-global-market"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Full Market Analysis
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">Sources: Fortune Business Insights, World Bank, GSMA, IFC, CFPB</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      <section id="market-proof" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">{t('landing.marketBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.marketTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t('landing.marketDesc')}
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
              How Africa Credit Hub Compares to Alternatives
            </h3>
            <div className="space-y-3">
              {[
                { name: "Experian Africa (~12 countries)", gap: "Direct operations primarily in South Africa, with ~11 additional countries via the 2019 Compuscan acquisition. No presence across West, Central, or North Africa. Legacy architecture with no AI Command Center, no Islamic finance module, and no PAPSS integration.", solve: "Africa Credit Hub's platform and regulatory frameworks are configured for all 54 countries. AI-native from day one, 8 languages, 42+ currencies, PAPSS integration, Islamic finance support — built for the full continent, not retrofitted." },
                { name: "TransUnion Africa (8 countries)", gap: "Operates in 8 of 54 African countries: Botswana, Kenya, Namibia, Rwanda, South Africa, eSwatini, Zambia, Malawi. No presence in Nigeria, Ethiopia, Egypt, Tanzania, Ghana, or DRC. No AI Command Center, no portfolio-level intelligence, and no PAPSS or Islamic finance support.", solve: "One platform, 54 countries, instant cross-border entity resolution. Portfolio Intelligence covers your entire book — not one country at a time. No separate contracts per jurisdiction." },
                { name: "Equifax (0 African Countries)", gap: "Zero African operations. Entirely absent from all 54 African nations. Builds for Americas and Europe only. Also suffered a 2017 breach of 147M records, exposing systemic security debt in legacy mainframe architecture.", solve: "Not a viable option for African institutions — but included here to illustrate the gap. Africa Credit Hub provides what the world's No.2 bureau cannot: a purpose-built, cloud-native, fully-compliant pan-African credit registry." },
                { name: "Country-Specific Bureaus (e.g. CRB Kenya, CreditInfo)", gap: "Single-country systems with no cross-border capability. Each jurisdiction requires a separate contract, separate integration, separate data model, and separate staff training. Fails for any cross-border lender.", solve: "One platform across all jurisdictions with unified data models. Your team learns one system, one API, and one workflow — regardless of how many African countries you operate in." },
                { name: "Building In-House", gap: "18–24 months of development per country. No data sharing across institutions. Regulatory compliance automation must be custom-built and updated constantly. Estimated cost: $10M–$50M+ per country.", solve: "Production-ready today with 16 integrated modules, full regulatory compliance engine, automated SLA monitoring, and pre-built BoG/BSL/CBN export formats. Go live within hours." },
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
                            <p className="text-[10px] font-medium text-green-600 mb-0.5">Our Advantage</p>
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
                  What You Get With Africa Credit Hub
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
            <span className="text-xs font-medium">{t('landing.ctaBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-3 text-sm sm:text-base max-w-xl mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button
              size="lg"
              className="text-sm px-10 gap-2 shadow-lg"
              onClick={() => navigate("/start-trial")}
              data-testid="cta-bottom-trial"
            >
              <ArrowRight className="w-4 h-4" />
              {t('landing.ctaStartTrial')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/contact-sales")}
              data-testid="cta-bottom-contact"
            >
              <CreditCard className="w-4 h-4" />
              {t('landing.contactSales')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-sm px-8 gap-2"
              onClick={() => navigate("/security")}
              data-testid="cta-bottom-security"
            >
              <Shield className="w-4 h-4" />
              {t('landing.footerSecurity')}
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
                  style={{ background: brandColors.headerGradient }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">Africa Credit Hub</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Pan-African Credit Registry — Africa Credit Hub v2.6</p>
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
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Contact</p>
              <div className="space-y-2 text-[11px] text-muted-foreground/80">
                <a href={supportEmailHref()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-3 h-3" />{PLATFORM_SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
            <p>&copy; {new Date().getFullYear()} {PLATFORM_COMPANY_NAME}. All rights reserved.</p>
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
