import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Shield, Check, ArrowRight, Globe, Users, Zap, Lock,
  Building2, Brain, BarChart3, Headphones, ChevronDown, Mail, Phone, MapPin,
  Server, GraduationCap, Wrench, Database, FileCheck, Landmark,
} from "lucide-react";


const PLANS = [
  {
    name: "Standard",
    price: 299,
    period: "month",
    description: "For smaller financial institutions getting started with credit reporting",
    users: "Up to 10 users",
    highlight: false,
    features: [
      "Core credit data submission",
      "Basic credit report generation",
      "Up to 10 user accounts",
      "Single-country deployment",
      "Standard API access (1,000 calls/day)",
      "Email support (48h response)",
      "Basic fraud detection",
      "African data protection compliance (POPIA, NDPR, Ghana DPA, GDPR)",
      "Monthly data exports",
      "Standard dashboards",
    ],
  },
  {
    name: "Professional",
    price: 799,
    period: "month",
    description: "For growing institutions needing advanced analytics and multi-country support",
    users: "Up to 50 users",
    highlight: true,
    features: [
      "Everything in Standard, plus:",
      "Advanced ML credit scoring (GBM v2.5)",
      "Up to 50 user accounts",
      "Multi-country deployment (up to 5)",
      "Priority API access (10,000 calls/day)",
      "Cross-border credit searches",
      "Portfolio intelligence suite",
      "WebAuthn biometric authentication",
      "Real-time WebSocket notifications",
      "Maker-checker approval workflows",
      "Regulatory compliance dashboards",
      "Priority support (24h response)",
      "Batch upload processing",
    ],
  },
  {
    name: "Enterprise",
    price: 1999,
    period: "month",
    description: "For large-scale deployments across multiple African jurisdictions",
    users: "Unlimited users",
    highlight: false,
    features: [
      "Everything in Professional, plus:",
      "Unlimited user accounts",
      "Pan-African deployment (54 countries)",
      "Unlimited API access",
      "PAPSS cross-border settlements",
      "Blockchain audit anchoring",
      "Custom regulatory exports (BoG, BSL)",
      "Dedicated AI chatbot assistant",
      "White-label capabilities",
      "Custom data retention policies",
      "SLA guarantee (99.9% uptime)",
      "Dedicated account manager",
      "On-premise deployment option",
      "Custom integrations",
    ],
  },
];

const CB_PACKAGE = [
  { icon: FileCheck, item: "Software License (Perpetual)", desc: "Full CDH v2.5 platform license — unlimited modules, all 54 jurisdictions, AI/ML suite, blockchain audit", cost: "$450,000" },
  { icon: Server, item: "Server Infrastructure & Cloud Setup", desc: "Production + DR environments, load balancers, SSL, backups, monitoring, CDN configuration", cost: "$85,000" },
  { icon: Wrench, item: "Installation, Configuration & Integration", desc: "Core banking API integration, SWIFT/RTGS connectivity, regulatory export pipelines, SSO/LDAP setup", cost: "$120,000" },
  { icon: Database, item: "Data Migration & Legacy System Integration", desc: "Historical credit data import, deduplication, entity resolution, data quality validation", cost: "$75,000" },
  { icon: Landmark, item: "Regulatory Customization", desc: "Local data protection compliance, central bank reporting formats, national ID verification, local currency config", cost: "$65,000" },
  { icon: GraduationCap, item: "Staff Training (40 hours, up to 30 users)", desc: "Administrator, analyst, and compliance officer training modules with certification", cost: "$35,000" },
  { icon: Headphones, item: "Year 1 Support & Maintenance", desc: "24/7 dedicated support, SLA guarantee (99.9%), security patches, feature updates, quarterly reviews", cost: "$95,000" },
];

const CB_TOTAL = "$925,000";
const CB_ANNUAL_MAINTENANCE = "$95,000";

const USAGE_PRICING = [
  { service: "Credit Report Pull", standard: "$0.50", volume: "$0.35", enterprise: "$0.20" },
  { service: "API Call (external)", standard: "$0.01", volume: "$0.007", enterprise: "$0.004" },
  { service: "Batch Upload (per record)", standard: "$0.10", volume: "$0.07", enterprise: "$0.04" },
  { service: "Cross-Border Query", standard: "$1.00", volume: "$0.70", enterprise: "$0.40" },
  { service: "Dispute Filing", standard: "$2.00", volume: "$1.40", enterprise: "$0.80" },
  { service: "Data Export", standard: "$5.00", volume: "$3.50", enterprise: "$2.00" },
];

const TELCO_PRICING = [
  { service: "AI Credit Score (MoMo)", standard: "$0.50", volume: "$0.25", enterprise: "$0.12" },
  { service: "Loan Decision Engine", standard: "$0.30", volume: "$0.15", enterprise: "$0.08" },
  { service: "MoMo Data Import (per tx)", standard: "$0.05", volume: "$0.03", enterprise: "$0.01" },
  { service: "Consent Management", standard: "$0.02", volume: "$0.01", enterprise: "$0.01" },
  { service: "Loan Disbursement", standard: "$0.25", volume: "$0.15", enterprise: "$0.08" },
  { service: "Score + Decide (one call)", standard: "$0.70", volume: "$0.35", enterprise: "$0.18" },
];

const FAQS = [
  {
    q: "How does multi-country deployment work?",
    a: "Each country operates as an independent tenant with its own regulatory configuration, data protection rules, and currency settings. Data is isolated per jurisdiction while enabling authorized cross-border searches.",
  },
  {
    q: "What currencies do you support?",
    a: "We support 42+ African currencies including GHS, NGN, KES, ZAR, ETB, TZS, UGX, RWF, SLL, and EGP, with real-time exchange rate conversion powered by our integrated currency engine.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, we offer a 14-day free trial with full admin access. No credit card required. Click 'Start Free Trial' on any plan to register your organization and get started instantly.",
  },
  {
    q: "How is data privacy handled?",
    a: "We comply with 36+ African data protection laws including South Africa's POPIA, Nigeria's NDPA, Ghana's DPA, Kenya's DPA, the AU Malabo Convention, and each country's local regulations. GDPR is also supported for clients with EU exposure. Data is encrypted at rest (AES-256) and in transit (TLS 1.3), with full audit trails and blockchain anchoring for tamper-proof records.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Usage-based charges are prorated.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const brandColors = useBrandColors();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const discount = billingPeriod === "annual" ? 0.8 : 1;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="pricing-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/solutions")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Pricing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/solutions")} data-testid="link-back-solutions">
              Overview
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/security")} data-testid="link-security">
              Security
            </Button>
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/login")} data-testid="nav-login">
              Log In
            </Button>
            <Button size="sm" className="text-xs" onClick={() => navigate("/start-trial")} data-testid="button-start-trial">
              Start Free Trial
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">Transparent Pricing</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-title">
            Simple, Predictable Pricing for<br />Every Stage of Growth
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start small and scale across the continent. All plans include core credit registry functionality,
            regulatory compliance tools, and enterprise-grade security.
          </p>

          <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1 mb-12">
            <Button
              variant={billingPeriod === "monthly" ? "default" : "ghost"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setBillingPeriod("monthly")}
              data-testid="button-monthly"
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === "annual" ? "default" : "ghost"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setBillingPeriod("annual")}
              data-testid="button-annual"
            >
              Annual
              <Badge className="ml-1.5 text-[10px]" variant="secondary">Save 20%</Badge>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative text-left ${plan.highlight ? "border-primary shadow-lg scale-105 z-10" : "border-border"}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">${Math.round(plan.price * discount)}</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    {billingPeriod === "annual" && (
                      <span className="text-xs text-muted-foreground line-through ml-2">${plan.price}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.users}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full mb-6"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => navigate("/start-trial")}
                    data-testid={`button-start-${plan.name.toLowerCase()}`}
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.startsWith("Everything") ? (
                          <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30" data-testid="section-central-bank">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">
              <Landmark className="w-3 h-3 mr-1" />
              Central Bank & National Registry
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-cb-title">
              Total Software Delivery Package
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Complete turnkey deployment for central banks and national credit registries.
              Includes perpetual licensing, infrastructure, installation, training, and first-year support.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {CB_PACKAGE.map((row, i) => (
              <Card key={i} data-testid={`cb-item-${i}`}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: brandColors.iconGradientSubtle }}>
                      <row.icon className="w-5 h-5" style={{ color: brandColors.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-sm">{row.item}</p>
                        <span className="font-bold text-base whitespace-nowrap">{row.cost}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{row.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/30 shadow-lg" data-testid="cb-total-card">
            <CardContent className="py-6 px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Delivery Package</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl font-bold" style={{ color: brandColors.accent }} data-testid="text-cb-total">{CB_TOTAL}</span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Annual maintenance after Year 1: <span className="font-semibold text-foreground">{CB_ANNUAL_MAINTENANCE}/year</span> (includes 24/7 support, updates & security patches)
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="lg" onClick={() => navigate("/start-trial")} data-testid="button-cb-contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Request Proposal
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">Custom quotes for multi-country deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Shield, title: "Sovereign Hosting", desc: "On-premise or private cloud within national borders — full data sovereignty compliance" },
              { icon: Building2, title: "Multi-Bank Onboarding", desc: "Structured rollout to all licensed financial institutions with API integration support" },
              { icon: Globe, title: "Pan-African Scalability", desc: "Expand to additional ECOWAS, EAC, or SADC member states with shared infrastructure" },
            ].map((item) => (
              <Card key={item.title} className="border-border/50">
                <CardContent className="py-5 px-4 text-center">
                  <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: brandColors.accent }} />
                  <p className="font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" data-testid="text-usage-title">Usage-Based Pricing</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Pay only for what you use, with volume discounts as you scale
          </p>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-usage-pricing">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-center py-3 px-4 font-medium">Standard</th>
                    <th className="text-center py-3 px-4 font-medium">Volume (1k+)</th>
                    <th className="text-center py-3 px-4 font-medium">Enterprise (10k+)</th>
                  </tr>
                </thead>
                <tbody>
                  {USAGE_PRICING.map((row) => (
                    <tr key={row.service} className="border-b last:border-0">
                      <td className="py-3 px-4">{row.service}</td>
                      <td className="text-center py-3 px-4">{row.standard}</td>
                      <td className="text-center py-3 px-4">{row.volume}</td>
                      <td className="text-center py-3 px-4">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" data-testid="text-telco-pricing-title">Telco Integration Pricing</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Purpose-built for MTN, Orange, Tigo, Airtel, and Safaricom — AI-powered credit scoring from mobile money data
          </p>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-telco-pricing">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-center py-3 px-4 font-medium">Standard</th>
                    <th className="text-center py-3 px-4 font-medium">Volume (5k+)</th>
                    <th className="text-center py-3 px-4 font-medium">Enterprise (50k+)</th>
                  </tr>
                </thead>
                <tbody>
                  {TELCO_PRICING.map((row) => (
                    <tr key={row.service} className="border-b last:border-0">
                      <td className="py-3 px-4">{row.service}</td>
                      <td className="text-center py-3 px-4">{row.standard}</td>
                      <td className="text-center py-3 px-4">{row.volume}</td>
                      <td className="text-center py-3 px-4">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center mt-3">
            All telco pricing is per API call in USD. Local currency pricing available. Contact sales for custom enterprise contracts.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Trusted Across the Continent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Globe, label: "54 Countries", desc: "Pan-African coverage" },
              { icon: Lock, label: "Enterprise Security", desc: "SOC 2 + POPIA/NDPA ready" },
              { icon: Brain, label: "ML Credit Scoring", desc: "Gradient boosting model" },
              { icon: Headphones, label: "24/7 Support", desc: "Dedicated team" },
            ].map((item) => (
              <div key={item.label} className="p-4">
                <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" data-testid="text-faq-title">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} data-testid={`faq-${i}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{faq.q}</p>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  {expandedFaq === i && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Start a free trial to explore the full platform, or contact our team for a custom quote.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/start-trial")} data-testid="button-cta-trial">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/solutions")} data-testid="button-cta-overview">
              Back to Overview
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
          <p className="max-w-7xl mx-auto text-center text-[10px] text-muted-foreground/60">&copy; {new Date().getFullYear()} Carlson Capital & Systems In Motion Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
