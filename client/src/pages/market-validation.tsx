import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrandColors } from "@/hooks/use-brand-colors";
import {
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
  Shield, Globe, ArrowRight, TrendingUp, CheckCircle2,
  Users, Building2, AlertTriangle, Target, MapPin,
  BarChart3, Landmark, Scale, DollarSign, LineChart,
  Zap, Lock, Network, PieChart, Activity, Mail, Phone,
} from "lucide-react";

const TAM_DATA = [
  { region: "West Africa", countries: "Nigeria, Ghana, Senegal, Ivory Coast + 12", banks: 180, mfis: 420, fintechs: 310, highlight: "Largest volume — Nigeria alone has 20+ commercial banks" },
  { region: "East Africa", countries: "Kenya, Tanzania, Ethiopia, Uganda + 9", banks: 140, mfis: 380, fintechs: 250, highlight: "M-Pesa maturity enables easy SaaS fee collection" },
  { region: "Southern Africa", countries: "South Africa, Zambia, Mozambique + 7", banks: 95, mfis: 190, fintechs: 180, highlight: "Highest ARPU — South Africa supports premium pricing" },
  { region: "Central Africa", countries: "DRC, Cameroon, Gabon + 6", banks: 55, mfis: 120, fintechs: 60, highlight: "Underserved market — least competition, highest growth potential" },
  { region: "North Africa", countries: "Egypt, Morocco, Tunisia + 3", banks: 85, mfis: 95, fintechs: 140, highlight: "Egypt is fastest-growing VC destination in Africa" },
];

const DEMAND_SIGNALS = [
  {
    icon: Landmark,
    title: "Central Bank Mandates",
    evidence: "37 of 54 African countries have enacted or are drafting credit reporting legislation. Central banks require licensed credit bureaus to submit standardized data — creating mandatory demand.",
    source: "World Bank Financial Sector Assessment Programs (FSAPs)",
    strength: "Very Strong",
  },
  {
    icon: DollarSign,
    title: "$4.8T Credit Information Gap",
    evidence: "Africa's credit-to-GDP ratio averages 28% vs. 150%+ in developed markets. The inability to assess borrower risk costs the continent an estimated $4.8 trillion in unrealized credit, directly traceable to fragmented credit data.",
    source: "IMF Financial Development Index, AfDB Research",
    strength: "Very Strong",
  },
  {
    icon: Globe,
    title: "AfCFTA Cross-Border Acceleration",
    evidence: "The African Continental Free Trade Area (3.4B GDP) requires harmonized financial data for cross-border lending. PAPSS (Pan-African Payment & Settlement System) is live — credit data is the missing layer.",
    source: "African Union / Afreximbank PAPSS Reports",
    strength: "Strong",
  },
  {
    icon: Users,
    title: "350M+ Financially Excluded Adults",
    evidence: "Over 350 million African adults have no access to formal financial services. Alternative data scoring (mobile money, utility payments) can bring them into the credit system — but only with a shared data infrastructure.",
    source: "World Bank Global Findex Database 2021",
    strength: "Very Strong",
  },
  {
    icon: Activity,
    title: "$47B African Fintech Revenue by 2028",
    evidence: "Fintech infrastructure (KYC, credit scoring APIs, data rails) is the highest-value vertical in the African fintech ecosystem. CDH sits at the infrastructure layer — enabling other businesses to operate.",
    source: "McKinsey Africa Fintech Report",
    strength: "Strong",
  },
  {
    icon: Lock,
    title: "36+ African Data Protection Laws Creating Compliance Pressure",
    evidence: "Data protection laws across South Africa (POPIA), Nigeria (NDPA 2023), Kenya (DPA 2019), Ghana (DPA 2012), the AU Malabo Convention, and 30+ other African jurisdictions create compliance complexity that only a purpose-built multi-jurisdiction platform can handle at scale.",
    source: "National data protection authorities, African Union",
    strength: "Strong",
  },
];

const COMPETITIVE_LANDSCAPE = [
  {
    name: "TransUnion Africa",
    coverage: "South Africa + 5",
    weakness: "Single-region focus. No pan-African coverage. Legacy on-premise architecture. No alternative data scoring.",
    ourAdvantage: "54-country coverage, cloud-native, ML-enhanced scoring with mobile money data",
  },
  {
    name: "Experian Africa",
    coverage: "South Africa + 3",
    weakness: "Concentrated in Southern Africa. Enterprise-only pricing excludes MFIs and fintechs. No cross-border entity resolution.",
    ourAdvantage: "Multi-tier pricing for all institution sizes. Cross-border fuzzy matching across jurisdictions.",
  },
  {
    name: "CRB Africa (Kenya)",
    coverage: "Kenya only",
    weakness: "Single-country system. No multi-currency support. No regulatory compliance engine for other jurisdictions.",
    ourAdvantage: "42+ currencies, per-country regulatory profiles, 5 AU language support",
  },
  {
    name: "XDS Data (South Africa)",
    coverage: "South Africa + 2",
    weakness: "Limited to Southern Africa. No API-first architecture. No webhook event system.",
    ourAdvantage: "OAuth 2.1 API platform, HMAC-signed webhooks, developer portal with sandbox",
  },
  {
    name: "In-House Bureau Systems",
    coverage: "1 country each",
    weakness: "Siloed per-country builds. Cannot share data cross-border. No standardized scoring. No compliance automation.",
    ourAdvantage: "Unified platform eliminates duplication. Central banks can adopt once for entire jurisdiction.",
  },
];

const PRICING_VALIDATION = [
  {
    tier: "Standard",
    price: "$299/mo",
    segment: "MFIs, Small Fintechs",
    marketRef: "African mid-market SaaS: $100–$500/mo. HR platforms charge $1–$7/employee/mo. Our per-institution pricing at $299 is well within the mid-market SaaS range for specialized B2B tools.",
    verdict: "Market-Aligned",
  },
  {
    tier: "Professional",
    price: "$799/mo",
    segment: "Regional Banks, DFIs",
    marketRef: "Specialized agritech platforms target ~$600/mo ARPU. EOR services reach $300/employee/mo in Kenya. At $799 for mission-critical credit infrastructure, pricing is competitive for the value delivered.",
    verdict: "Market-Aligned",
  },
  {
    tier: "Enterprise",
    price: "$2,499/mo",
    segment: "Central Banks, Tier-1 Banks",
    marketRef: "Enterprise fintech contracts exceed $8,000–$10,000/mo. South African ERP implementations cost R1.5M–R5M+ ($80K–$265K+). Our Enterprise tier at $2,499 is 75% below the enterprise ceiling.",
    verdict: "Conservative",
  },
  {
    tier: "Usage-Based",
    price: "Per-transaction",
    segment: "All Tiers",
    marketRef: "Transactional models are standard in African fintech. Logistics platforms take 13% commissions. Our per-query credit reports and API calls create predictable, usage-correlated revenue that scales with adoption.",
    verdict: "Market-Standard",
  },
];

const TRACTION_MILESTONES = [
  { status: "complete", label: "Production-ready platform (CDH v2.5) with 16 integrated modules" },
  { status: "complete", label: "Live platform with 102K+ borrower records and 172K+ credit accounts across 2 countries" },
  { status: "complete", label: "Full regulatory compliance engine covering 54 African jurisdictions" },
  { status: "complete", label: "ML credit scoring with alternative data (mobile money, utility payments)" },
  { status: "complete", label: "Usage-based billing engine with multi-currency revenue tracking" },
  { status: "complete", label: "API platform with OAuth 2.1, webhooks, and developer documentation" },
  { status: "complete", label: "POPIA, NDPA, Ghana DPA, Kenya DPA, Malabo Convention + 36 African DPA frameworks implemented" },
  { status: "next", label: "First pilot deployment — Ghana (Bank of Ghana regulatory alignment)" },
  { status: "next", label: "Sierra Leone expansion — BSL export format already built" },
  { status: "next", label: "Enterprise sales to 3 Tier-1 banks across West and East Africa" },
  { status: "future", label: "10-country rollout across West, East, and Southern Africa" },
  { status: "future", label: "Open Banking API gateway and RegTech automation suite" },
];

export default function MarketValidationPage() {
  const [, navigate] = useLocation();
  const brandColors = useBrandColors();

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="market-validation-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/solutions")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Market Validation</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/solutions")} data-testid="link-back-solutions">Platform Overview</Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/pricing")} data-testid="link-pricing">Pricing</Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/security")} data-testid="link-security">Security</Button>
            <Button size="sm" className="text-xs" onClick={() => navigate("/start-trial")} data-testid="button-start-trial">
              Start Free Trial <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">Market Validation</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-mv-title">
            Why Africa Needs CDH — And Why Now
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Data-backed market validation for pan-African credit infrastructure.
            Every claim is sourced, every pricing tier is benchmarked, and every competitor gap is documented.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>$47B Market by 2028</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>37+ Central Bank Mandates</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>350M+ Underserved Adults</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Zero Pan-African Competitors</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30" data-testid="section-tam">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Total Addressable Market by Region</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            500+ financial institutions across 54 countries — segmented by region with institution counts
          </p>
          <div className="space-y-3">
            {TAM_DATA.map((r) => (
              <Card key={r.region} data-testid={`card-tam-${r.region.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="sm:w-48 flex-shrink-0">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {r.region}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.countries}</p>
                    </div>
                    <div className="flex gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{r.banks}</div>
                        <p className="text-[10px] text-muted-foreground">Banks</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{r.mfis}</div>
                        <p className="text-[10px] text-muted-foreground">MFIs</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{r.fintechs}</div>
                        <p className="text-[10px] text-muted-foreground">Fintechs</p>
                      </div>
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                      <Zap className="w-3 h-3 text-yellow-500 inline mr-1" />
                      {r.highlight}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full border border-primary/30 bg-primary/5">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">555</div>
                <p className="text-[10px] text-muted-foreground">Banks</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">1,205</div>
                <p className="text-[10px] text-muted-foreground">MFIs</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">940</div>
                <p className="text-[10px] text-muted-foreground">Fintechs</p>
              </div>
              <div className="text-center border-l border-primary/20 pl-4">
                <div className="text-xl font-bold text-primary">2,700+</div>
                <p className="text-[10px] text-muted-foreground">Total Addressable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4" data-testid="section-demand">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Demand Signals & Market Evidence</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Six independent data points validating urgent market demand for pan-African credit infrastructure
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMAND_SIGNALS.map((signal) => (
              <Card key={signal.title} data-testid={`card-demand-${signal.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <signal.icon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-sm">{signal.title}</h3>
                    </div>
                    <Badge variant="outline" className={signal.strength === "Very Strong" ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]" : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"}>
                      {signal.strength}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{signal.evidence}</p>
                  <p className="text-[10px] text-muted-foreground/70 italic">Source: {signal.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30" data-testid="section-competitors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Competitive Landscape Analysis</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            No existing player covers more than a single African region. CDH is the only pan-continental solution.
          </p>
          <div className="space-y-3">
            {COMPETITIVE_LANDSCAPE.map((comp) => (
              <Card key={comp.name} data-testid={`card-comp-${comp.name.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-2">
                      <h3 className="font-semibold text-sm">{comp.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Coverage: {comp.coverage}</p>
                    </div>
                    <div className="lg:col-span-5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-red-600 mb-0.5">Their Limitation</p>
                          <p className="text-xs text-muted-foreground">{comp.weakness}</p>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-green-600 mb-0.5">Our Advantage</p>
                          <p className="text-xs text-muted-foreground">{comp.ourAdvantage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Key Takeaway</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Every existing competitor is confined to a single country or sub-region. None offer multi-currency support, 
                  cross-border entity resolution, or alternative data scoring. CDH is the only platform designed from day one 
                  for pan-African operation — creating a category of one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4" data-testid="section-pricing-validation">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Pricing Validation Against Market Benchmarks</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Every pricing tier validated against real African SaaS revenue data and comparable platforms
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRICING_VALIDATION.map((pv) => (
              <Card key={pv.tier} data-testid={`card-pricing-${pv.tier.toLowerCase()}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{pv.tier} — {pv.price}</h3>
                      <p className="text-[10px] text-muted-foreground">{pv.segment}</p>
                    </div>
                    <Badge variant="outline" className={
                      pv.verdict === "Conservative" ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]" :
                      "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                    }>
                      {pv.verdict}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pv.marketRef}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">$28.5K</div>
              <p className="text-xs font-medium">Target Monthly Revenue (Yr 1)</p>
              <p className="text-[10px] text-muted-foreground mt-1">Aligned with African SaaS median of ~$28,500/mo for early-stage startups</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">$58K</div>
              <p className="text-xs font-medium">Investor Pitch Benchmark</p>
              <p className="text-[10px] text-muted-foreground mt-1">Average monthly revenue for successful African SaaS startups at pitch stage</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">5x ARR</div>
              <p className="text-xs font-medium">Target Valuation Multiple</p>
              <p className="text-[10px] text-muted-foreground mt-1">Fintech infrastructure in Africa commands 5–8x ARR. At $343K ARR = $1.7M–$2.7M valuation</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30" data-testid="section-traction">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Traction & Milestone Roadmap</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            What's been built, what's next, and the path to market
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-2">
              {TRACTION_MILESTONES.map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`milestone-${i}`}>
                  {m.status === "complete" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : m.status === "next" ? (
                    <Target className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{m.label}</p>
                  </div>
                  <Badge variant="outline" className={
                    m.status === "complete" ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]" :
                    m.status === "next" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]" :
                    "text-[10px]"
                  }>
                    {m.status === "complete" ? "Built" : m.status === "next" ? "Next" : "Vision"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4" data-testid="section-why-now">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Why Now — Convergence of Forces</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Five macro-trends creating a once-in-a-generation window for pan-African credit infrastructure
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Scale, title: "Regulatory Push", desc: "37+ African central banks enacting credit reporting laws. Compliance is no longer optional — creating mandatory institutional demand." },
              { icon: Globe, title: "AfCFTA Integration", desc: "The world's largest free trade area (1.4B people) requires financial data harmonization. PAPSS is live. Credit data is the missing layer." },
              { icon: Network, title: "Digital Infrastructure", desc: "Mobile money (M-Pesa, MTN MoMo) created the rails. Internet penetration hit 43%. The infrastructure now exists to deploy SaaS at scale." },
              { icon: TrendingUp, title: "VC Capital Inflow", desc: "African fintech funding reached $3.3B in 2022. Investors actively seeking infrastructure plays. B2B fintech is the highest-conviction thesis." },
              { icon: Building2, title: "No Incumbent", desc: "Unlike Europe (SCHUFA) or the US (FICO), Africa has no dominant pan-continental credit bureau. The market is wide open for a first mover." },
            ].map((item) => (
              <Card key={item.title} data-testid={`card-whynow-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="pt-5 pb-4 text-center">
                  <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-xs mb-2">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">The Opportunity is Clear</h2>
          <p className="text-muted-foreground mb-6 text-sm max-w-xl mx-auto">
            A $47B market with mandatory demand, zero pan-African competitors, and a production-ready platform 
            already covering all 54 countries. The question is not whether Africa needs credit infrastructure — 
            it's who builds it first.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" onClick={() => navigate("/start-trial")} data-testid="button-cta-trial">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/solutions")} data-testid="button-cta-solutions">
              Platform Overview
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} data-testid="button-cta-pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] text-muted-foreground/80">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Africa Credit Hub</p>
              <p>Pan-African Credit Data Infrastructure</p>
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
        </div>
        <div className="border-t border-border/30 py-3 px-4">
          <p className="max-w-7xl mx-auto text-center text-[10px] text-muted-foreground/60">&copy; {new Date().getFullYear()} {PLATFORM_COMPANY_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
