import { useLocation, Link } from "wouter";
import { Check, ArrowRight, Building2, TrendingUp, Crown, User, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GHS = "₵";

const plans = [
  {
    id: "consumer",
    icon: User,
    name: "Personal",
    tagline: "For individuals",
    price: "Free",
    priceNote: "Always free",
    accent: "hsl(265 50% 55%)",
    accentLight: "hsl(265 50% 55% / 0.08)",
    badge: null,
    cta: "Create Free Account",
    ctaHref: "/consumer/register",
    features: [
      "View your credit score (300–850)",
      "Full personal credit report",
      "Dispute management",
      "Score tracking over time",
      "Secure identity verification",
      "Download PDF report",
    ],
  },
  {
    id: "growth",
    icon: TrendingUp,
    name: "Growth",
    tagline: "For MFIs, fintechs & digital lenders",
    price: `${GHS}499`,
    priceNote: "per month + usage",
    accent: "hsl(168 60% 40%)",
    accentLight: "hsl(168 60% 40% / 0.08)",
    badge: null,
    cta: "Start Free Trial",
    ctaHref: "/start-trial",
    features: [
      "Up to 5 users",
      "Standard REST API access",
      "Credit report generation",
      "Batch data upload",
      "Basic portfolio dashboard",
      "Volume-based pricing on usage",
      "Wallet funding from " + GHS + "500",
      "Email support",
    ],
  },
  {
    id: "commercial",
    icon: Building2,
    name: "Commercial",
    tagline: "For Tier-1 & Tier-2 banks",
    price: `${GHS}3,500`,
    priceNote: "per month + usage",
    accent: "hsl(215 55% 48%)",
    accentLight: "hsl(215 55% 48% / 0.08)",
    badge: "Most Popular",
    cta: "Contact Sales",
    ctaHref: "/contact-sales?tier=commercial",
    features: [
      "Unlimited users",
      "Maker-checker workflows",
      "Core banking / RTGS integration",
      "Batch processing & XBRL upload",
      "AI credit risk analysis",
      "Regulatory reporting (BoG CRB v1.1)",
      "Multi-jurisdiction data access",
      "SSO / SAML enterprise login",
      "Dedicated support",
    ],
  },
  {
    id: "sovereign",
    icon: Crown,
    name: "Sovereign",
    tagline: "For central banks & regulators",
    price: "Custom",
    priceNote: "contact us for pricing",
    accent: "hsl(38 80% 48%)",
    accentLight: "hsl(38 80% 48% / 0.08)",
    badge: null,
    cta: "Contact Sales",
    ctaHref: "/contact-sales?tier=sovereign",
    features: [
      "Everything in Commercial",
      "Sovereign data isolation",
      "National credit registry setup",
      "Central bank oversight tools",
      "54 African jurisdictions",
      "Custom data retention policy",
      "On-premise / private cloud option",
      "SLA-backed uptime guarantee",
      "Dedicated implementation team",
    ],
  },
];

const usageRates = [
  { label: "Credit Report", tier1: `${GHS}5.00`, tier2: `${GHS}3.50`, tier3: `${GHS}3.50` },
  { label: "Credit Inquiry", tier1: `${GHS}2.50`, tier2: `${GHS}2.00`, tier3: `${GHS}1.50` },
  { label: "API Call", tier1: `${GHS}0.10`, tier2: `${GHS}0.07`, tier3: `${GHS}0.05` },
  { label: "Batch XBRL Submission", tier1: `${GHS}3.50`, tier2: `${GHS}3.50`, tier3: `${GHS}3.50` },
  { label: "Bulk Data Ingestion", tier1: `${GHS}1.00`, tier2: `${GHS}1.00`, tier3: `${GHS}1.00` },
  { label: "Batch Cheques / Judgments", tier1: `${GHS}2.00`, tier2: `${GHS}2.00`, tier3: `${GHS}2.00` },
];

export default function PricingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "hsl(215 25% 97%)" }}>
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(215 50% 48%), hsl(215 45% 38%))" }}>
            <Globe className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">Africa Credit Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-home">Home</Button>
          </Link>
          <Link href="/login">
            <Button size="sm" data-testid="link-login">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs font-medium px-3 py-1">Transparent Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4" data-testid="text-pricing-title">
            Plans for every institution
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            From individual consumers to central banks. Pay only for what you use on top of your monthly plan.
          </p>
          <p className="text-sm text-muted-foreground mt-2">All fees in Ghana Cedis (GHS). Volume discounts apply automatically.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className="relative rounded-2xl bg-white border border-border flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 inset-x-0 text-center py-1.5 text-xs font-semibold text-white"
                    style={{ background: plan.accent }}>
                    {plan.badge}
                  </div>
                )}

                <div className={`p-6 ${plan.badge ? "pt-10" : ""}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: plan.accentLight }}>
                    <Icon className="w-5 h-5" style={{ color: plan.accent }} />
                  </div>

                  <h2 className="text-lg font-bold text-foreground mb-1">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{plan.tagline}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground ml-2">{plan.priceNote}</span>
                  </div>

                  <Button
                    className="w-full mb-6 gap-2"
                    variant={plan.badge ? "default" : "outline"}
                    style={plan.badge ? { background: plan.accent, borderColor: plan.accent } : {}}
                    onClick={() => navigate(plan.ctaHref)}
                    data-testid={`button-cta-${plan.id}`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>

                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-20">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Usage-Based Pricing
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rates apply per transaction. Volume discounts activate automatically as your monthly usage grows.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-4 font-semibold text-foreground">Service</th>
                  <th className="text-center p-4 font-semibold text-foreground">
                    Tier 1<br /><span className="text-xs text-muted-foreground font-normal">0–100 / mo</span>
                  </th>
                  <th className="text-center p-4 font-semibold text-foreground">
                    Tier 2<br /><span className="text-xs text-muted-foreground font-normal">101–1,000 / mo</span>
                  </th>
                  <th className="text-center p-4 font-semibold text-foreground">
                    Tier 3<br /><span className="text-xs text-muted-foreground font-normal">1,001+ / mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageRates.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="p-4 font-medium text-foreground">{row.label}</td>
                    <td className="p-4 text-center text-muted-foreground">{row.tier1}</td>
                    <td className="p-4 text-center text-muted-foreground">{row.tier2}</td>
                    <td className="p-4 text-center text-muted-foreground">{row.tier3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl text-white text-center px-6 py-14"
          style={{ background: "linear-gradient(135deg, hsl(215 55% 40%), hsl(215 50% 32%))" }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Not sure which plan fits?</h2>
          <p className="text-white/75 mb-8 max-w-md mx-auto">
            Our team will help you find the right plan and walk you through the setup. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-foreground hover:bg-white/90 font-semibold gap-2"
              onClick={() => navigate("/contact-sales")}
              data-testid="button-contact-sales"
            >
              Talk to Sales <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 gap-2"
              onClick={() => navigate("/start-trial")}
              data-testid="button-start-trial"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground border-t border-border mt-4">
        <Link href="/" className="hover:underline">Home</Link>
        {" · "}
        <Link href="/terms" className="hover:underline">Terms</Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {" · "}
        <Link href="/contact-sales" className="hover:underline">Contact</Link>
      </footer>
    </div>
  );
}
