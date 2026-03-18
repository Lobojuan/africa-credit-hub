import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Check, ArrowRight, Globe, Users, Zap, Lock,
  Building2, Brain, BarChart3, Headphones, ChevronDown, Mail, Phone, MapPin,
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
      "Advanced ML credit scoring (GBM v2.1)",
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

const USAGE_PRICING = [
  { service: "Credit Report Pull", standard: "$0.50", volume: "$0.35", enterprise: "$0.20" },
  { service: "API Call (external)", standard: "$0.01", volume: "$0.007", enterprise: "$0.004" },
  { service: "Batch Upload (per record)", standard: "$0.10", volume: "$0.07", enterprise: "$0.04" },
  { service: "Cross-Border Query", standard: "$1.00", volume: "$0.70", enterprise: "$0.40" },
  { service: "Dispute Filing", standard: "$2.00", volume: "$1.40", enterprise: "$0.80" },
  { service: "Data Export", standard: "$5.00", volume: "$3.50", enterprise: "$2.00" },
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
    a: "We comply with GDPR, Ghana's Data Protection Act, and each country's local data protection regulations. Data is encrypted at rest and in transit, with full audit trails and blockchain anchoring for tamper-proof records.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Usage-based charges are prorated.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
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
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}>
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

      <section className="py-16 px-4 bg-muted/30">
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

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Trusted Across the Continent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Globe, label: "54 Countries", desc: "Pan-African coverage" },
              { icon: Lock, label: "Enterprise Security", desc: "SOC 2 + GDPR ready" },
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
