import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import {
  ArrowLeft, Shield, Wallet, CreditCard, Building2, Smartphone, Landmark,
  ChevronDown, ChevronRight, ArrowRightLeft, FileText, Globe, Server,
  CheckCircle2, AlertTriangle, Clock, Zap, Lock, BarChart3, Users,
  TrendingUp, Banknote, HelpCircle, BookOpen, PhoneCall, Mail,
  User, ShieldCheck, Database, Network, Eye, Layers, Crown, Building,
  KeyRound, Scale, Cpu, Fingerprint, Settings, MonitorSmartphone,
} from "lucide-react";

const GHS_SYMBOL = "₵";

function Section({ id, title, icon: Icon, children, defaultOpen = false }: { id: string; title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden" id={id} data-testid={`section-${id}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-muted/50 transition-colors"
        data-testid={`button-toggle-${id}`}
      >
        <Icon className="w-5 h-5 text-teal-500 flex-shrink-0" />
        <span className="text-base sm:text-lg font-semibold flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-border">{children}</div>}
    </div>
  );
}

function PricingTable() {
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        All fees are in Ghana Cedis (GHS). Volume-based discounts apply automatically as your monthly transaction count increases.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" data-testid="table-pricing">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 border border-border font-semibold">Transaction Type</th>
              <th className="text-center p-3 border border-border font-semibold">Tier 1<br /><span className="text-[10px] text-muted-foreground font-normal">0–100/mo</span></th>
              <th className="text-center p-3 border border-border font-semibold">Tier 2<br /><span className="text-[10px] text-muted-foreground font-normal">101–1,000/mo</span></th>
              <th className="text-center p-3 border border-border font-semibold">Tier 3<br /><span className="text-[10px] text-muted-foreground font-normal">1,001+/mo</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-border font-medium">Credit Report Pull</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}2.50</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}2.00</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}1.50</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="p-3 border border-border font-medium">API Call</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}0.10</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}0.07</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}0.05</td>
            </tr>
            <tr>
              <td className="p-3 border border-border font-medium">Batch Upload (per batch)</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}5.00</td>
              <td className="p-3 border border-border text-center">{GHS_SYMBOL}3.50</td>
              <td className="p-3 border border-border text-center text-muted-foreground">Contact sales</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="p-3 border border-border font-medium">Cross-Border Query</td>
              <td className="p-3 border border-border text-center" colSpan={3}>{GHS_SYMBOL}3.50 (flat rate)</td>
            </tr>
            <tr>
              <td className="p-3 border border-border font-medium">Dispute Filing</td>
              <td className="p-3 border border-border text-center" colSpan={3}>{GHS_SYMBOL}1.00 (flat rate)</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="p-3 border border-border font-medium">Data Export</td>
              <td className="p-3 border border-border text-center" colSpan={3}>{GHS_SYMBOL}2.00 (flat rate)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        * Pricing shown is for the Ghana deployment. Volume tiers reset on the 1st of each month.
        Enterprise pricing and custom volume agreements are available — <a href="/contact-sales" className="text-teal-500 underline">contact our sales team</a>.
      </p>
    </div>
  );
}

export default function PartnerDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" data-testid="link-back-home">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Home</Link>
          </Button>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-teal-500" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" data-testid="text-partner-docs-title">
              Platform Documentation
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl" data-testid="text-partner-docs-subtitle">
            Whether you're a consumer checking your own credit, a fintech building on our API, a commercial bank integrating at scale, or a central bank deploying sovereign infrastructure — this guide covers everything you need to connect to {PLATFORM_COMPANY_NAME}.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-teal-500/10 text-teal-500 border-teal-500/30">Ghana Deployment</Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Bank of Ghana Compliant</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">BoG CRB v1.1</Badge>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/30">Sovereign Isolation Available</Badge>
          </div>
        </div>

        <nav className="mb-8 rounded-xl border border-border bg-muted/30 p-4" data-testid="nav-table-of-contents">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {[
              { href: "#overview", label: "Platform Overview", icon: Globe },
              { href: "#client-tiers", label: "Client Tiers & Who Connects", icon: Layers },
              { href: "#consumers", label: "Consumer Accounts", icon: User },
              { href: "#medium-clients", label: "MFIs, Fintechs & Medium Clients", icon: TrendingUp },
              { href: "#licensed-institutions", label: "Licensed Banks & Bureaus", icon: Landmark },
              { href: "#sovereign", label: "Central Banks & Sovereign Deployment", icon: Crown },
              { href: "#pricing", label: "Pricing & Fees", icon: CreditCard },
              { href: "#wallet", label: "Prepaid Wallet System", icon: Wallet },
              { href: "#payment-methods", label: "Accepted Payment Methods", icon: Banknote },
              { href: "#revenue-split", label: "Revenue Split Model", icon: ArrowRightLeft },
              { href: "#onboarding", label: "Onboarding Steps", icon: CheckCircle2 },
              { href: "#technical", label: "Technical Integration", icon: Server },
              { href: "#compliance", label: "Compliance & Security", icon: Shield },
              { href: "#sla", label: "SLA & Support", icon: Clock },
              { href: "#faq", label: "Frequently Asked Questions", icon: HelpCircle },
              { href: "#contact", label: "Contact & Next Steps", icon: PhoneCall },
            ].map(item => (
              <a key={item.href} href={item.href} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-foreground">
                <item.icon className="w-3.5 h-3.5 text-teal-500" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-3">
          <Section id="overview" title="Platform Overview" icon={Globe} defaultOpen={true}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{PLATFORM_COMPANY_NAME}</strong> is a centralized credit data hub (CDH v2.5) that serves the entire financial ecosystem — from individual consumers managing their own credit profiles, to small fintechs building credit products, to tier-1 commercial banks, to central banks overseeing national credit infrastructure.
              </p>
              <p>
                The platform operates on a flexible multi-tier model that adapts to the size and needs of each participant:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><User className="w-4 h-4 text-emerald-500" /> Consumers</h4>
                  <p>Check your own credit score, review your credit history, file disputes, and manage consent for who can access your data — all through a self-service portal.</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Medium Clients</h4>
                  <p>MFIs, fintechs, and digital lenders get affordable API access, alternative credit scoring with telco data, and volume-based pricing that scales with you.</p>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-500" /> Licensed Institutions</h4>
                  <p>Commercial banks and licensed credit bureaus get full-featured integration — maker-checker workflows, RBAC, core banking/RTGS integration, and batch processing.</p>
                </div>
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Crown className="w-4 h-4 text-violet-500" /> Sovereign / Central Banks</h4>
                  <p>National regulators and central banks get a fully isolated deployment — data sovereignty, dedicated infrastructure, macroeconomic NPL dashboards, and on-premise options.</p>
                </div>
              </div>
              <p>
                The system supports <strong className="text-foreground">10 million+ records</strong> and is compliant with Bank of Ghana Credit Reporting Bureau (BoG CRB v1.1) regulations. All monetary amounts are in <strong className="text-foreground">Ghana Cedis ({GHS_SYMBOL})</strong>.
              </p>
            </div>
          </Section>

          <Section id="client-tiers" title="Client Tiers & Who Connects" icon={Layers}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>The platform serves four distinct tiers. Each tier has different access levels, pricing, and integration requirements:</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" data-testid="table-client-tiers">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 border border-border font-semibold">Feature</th>
                      <th className="text-center p-3 border border-border font-semibold">
                        <span className="flex items-center justify-center gap-1"><User className="w-3 h-3" /> Consumer</span>
                      </th>
                      <th className="text-center p-3 border border-border font-semibold">
                        <span className="flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Growth</span>
                      </th>
                      <th className="text-center p-3 border border-border font-semibold">
                        <span className="flex items-center justify-center gap-1"><Landmark className="w-3 h-3" /> Commercial</span>
                      </th>
                      <th className="text-center p-3 border border-border font-semibold">
                        <span className="flex items-center justify-center gap-1"><Crown className="w-3 h-3" /> Sovereign</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Who it's for", consumer: "Individuals", growth: "MFIs, Fintechs, Digital Lenders", commercial: "Tier-1/2 Banks, Licensed Bureaus", sovereign: "Central Banks, Regulators" },
                      { feature: "Access method", consumer: "Self-service portal", growth: "API + Web portal", commercial: "API + Portal + Batch", sovereign: "Isolated deployment" },
                      { feature: "View own credit report", consumer: "Yes", growth: "—", commercial: "—", sovereign: "Full oversight" },
                      { feature: "Pull credit reports", consumer: "—", growth: "Yes (API)", commercial: "Yes (API + Batch)", sovereign: "Yes (all methods)" },
                      { feature: "Submit borrower data", consumer: "—", growth: "Yes", commercial: "Yes + Batch", sovereign: "National scope" },
                      { feature: "Alternative data (telco)", consumer: "—", growth: "Yes", commercial: "Yes", sovereign: "Yes" },
                      { feature: "Maker-checker workflows", consumer: "—", growth: "—", commercial: "Yes", sovereign: "Yes" },
                      { feature: "Core banking integration", consumer: "—", growth: "—", commercial: "Yes (RTGS)", sovereign: "Yes" },
                      { feature: "RBAC & SSO", consumer: "Basic", growth: "Role-based", commercial: "Full RBAC + SSO", sovereign: "Full + SAML" },
                      { feature: "Data isolation", consumer: "Shared", growth: "Shared", commercial: "Shared (org-scoped)", sovereign: "Fully isolated" },
                      { feature: "NPL & macro dashboards", consumer: "—", growth: "—", commercial: "—", sovereign: "Yes" },
                      { feature: "Infrastructure", consumer: "Cloud", growth: "Cloud", commercial: "Cloud", sovereign: "Dedicated / On-premise" },
                      { feature: "Pricing", consumer: "Free", growth: "From ₵499/mo", commercial: "From ₵3,500/mo", sovereign: "Custom" },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                        <td className="p-2.5 border border-border font-medium text-xs">{row.feature}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.consumer}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.growth}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.commercial}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.sovereign}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section id="consumers" title="Consumer Accounts" icon={User}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                Individual consumers can access the platform to manage their own credit profile. Consumer accounts are <strong className="text-foreground">free of charge</strong> and designed for personal use.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Eye className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-foreground">View Your Credit Report</h4>
                  <p className="text-xs">Access your full credit history, see all accounts reported by lenders, view your credit score and score methodology. Know exactly where you stand.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">Dispute Errors</h4>
                  <p className="text-xs">Found something wrong? File a dispute directly through the portal. Track the status of your dispute and receive notification when it's resolved.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Manage Consent</h4>
                  <p className="text-xs">Control who can access your credit data. View all consent records, revoke access, and see an audit trail of every inquiry made on your file.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <MonitorSmartphone className="w-5 h-5 text-violet-500" />
                  <h4 className="font-semibold text-foreground">Mobile-Friendly</h4>
                  <p className="text-xs">Access your credit profile from any device. The consumer portal is fully responsive and designed for mobile users.</p>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <h4 className="font-semibold text-foreground mb-2">How to Register as a Consumer</h4>
                <ol className="space-y-1.5 text-xs list-decimal list-inside">
                  <li>Visit the <a href="/consumer/register" className="text-teal-500 underline">Consumer Portal</a> or <a href="/my-credit" className="text-teal-500 underline">My Credit</a> page</li>
                  <li>Enter your full name, email, phone number, and national ID (Ghana Card)</li>
                  <li>Accept the consent terms for credit data access</li>
                  <li>Verify your identity via OTP or email confirmation</li>
                  <li>View your credit report instantly — no cost, no bureau affiliation needed</li>
                </ol>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-xs"><strong className="text-foreground">Cost:</strong> Consumer accounts are completely free. There is no charge for checking your own credit score or filing disputes. This is your legal right under the Bank of Ghana Credit Reporting Act.</p>
              </div>
            </div>
          </Section>

          <Section id="medium-clients" title="MFIs, Fintechs & Medium Clients (Growth Tier)" icon={TrendingUp}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                The <strong className="text-foreground">Growth tier</strong> is designed for digital lenders, microfinance institutions, and fintech companies that need API access to credit data without the complexity of enterprise integration.
              </p>

              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-500" /> Growth Plan</h4>
                  <div>
                    <span className="text-2xl font-bold text-foreground">{GHS_SYMBOL}499</span>
                    <span className="text-muted-foreground text-xs"> / month</span>
                  </div>
                </div>
                <p className="text-xs mb-3">+ per-transaction fees (see pricing table below). 14-day free trial available.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "REST API Access", desc: "Pull credit reports and submit borrower data via a modern REST API with OAuth 2.1 authentication. SDKs available for common languages.", icon: Server },
                  { title: "Telco Alternative Scoring", desc: "Access credit scores built from mobile money history, airtime usage, and telecom data — ideal for scoring unbanked or thin-file borrowers.", icon: Smartphone },
                  { title: "Web Portal", desc: "Don't want to build an integration? Use our web portal to manually pull reports, submit data, and manage your account.", icon: MonitorSmartphone },
                  { title: "Up to 5 Users", desc: "Invite team members with role-based access. Analyst, manager, and admin roles included.", icon: Users },
                  { title: "Volume Discounts", desc: "Transaction fees decrease automatically as your monthly volume grows. The more you use, the less you pay per query.", icon: TrendingUp },
                  { title: "Webhook Notifications", desc: "Get real-time notifications when disputes are filed, data is updated, or consent changes occur.", icon: Zap },
                ].map(item => (
                  <div key={item.title} className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1.5"><item.icon className="w-3.5 h-3.5 text-teal-500" />{item.title}</h4>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">What You Need to Connect</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Business registration certificate</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Affiliation with a licensed credit bureau (we can help you connect with one)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> API-capable development team (or use our web portal)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Initial wallet funding of at least {GHS_SYMBOL}500</li>
                </ul>
              </div>

              <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700" data-testid="button-start-trial-growth">
                <Link href="/start-trial">Start 14-Day Free Trial →</Link>
              </Button>
            </div>
          </Section>

          <Section id="licensed-institutions" title="Licensed Banks & Credit Bureaus (Commercial Tier)" icon={Landmark}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                The <strong className="text-foreground">Commercial tier</strong> is built for tier-1 and tier-2 commercial banks, licensed credit bureaus, and major financial institutions that need enterprise-grade integration, compliance workflows, and high-volume processing.
              </p>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-500" /> Commercial Plan</h4>
                  <div>
                    <span className="text-xs text-muted-foreground">Starting at </span>
                    <span className="text-2xl font-bold text-foreground">{GHS_SYMBOL}3,500</span>
                    <span className="text-muted-foreground text-xs"> / month</span>
                  </div>
                </div>
                <p className="text-xs">+ per-transaction fees + one-time integration fee. Volume commitments may reduce per-transaction costs.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Full API + Batch Processing", desc: "REST API for real-time queries plus CSV/Excel/IFF batch file uploads for nightly data submissions. Handle millions of records efficiently.", icon: Database },
                  { title: "Maker-Checker Workflows", desc: "Enforce four-eyes principle for critical operations — data submissions, large queries, dispute resolutions. Full audit trail on every action.", icon: ShieldCheck },
                  { title: "Role-Based Access Control (RBAC)", desc: "Granular roles: analyst, manager, compliance officer, admin. Separate access for consumer vs. business credit divisions.", icon: KeyRound },
                  { title: "Core Banking / RTGS Integration", desc: "Integrate with your core banking system and RTGS infrastructure. Automated data feeds and reconciliation.", icon: Building },
                  { title: "SSO & Enterprise Auth", desc: "Google OAuth, Microsoft Azure AD, and SAML 2.0 single sign-on. Enforce MFA across your organization.", icon: Fingerprint },
                  { title: "Dedicated SLA Support", desc: "4-hour support response, 99.9% uptime guarantee, dedicated account manager, and priority escalation.", icon: Clock },
                ].map(item => (
                  <div key={item.title} className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1.5"><item.icon className="w-3.5 h-3.5 text-blue-500" />{item.title}</h4>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">For Licensed Credit Bureaus</h4>
                <p className="text-xs mb-2">If you are a BoG-licensed credit bureau, you can use {PLATFORM_COMPANY_NAME} as your core infrastructure — the technology backbone that powers your bureau operations.</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> White-label capability — your banks and lenders interact with <em>your bureau</em>, powered by our infrastructure</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Set your own pricing to your downstream clients (banks, MFIs, fintechs)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Revenue split: you keep 80% of every transaction, 20% goes to platform (negotiable)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Prepaid wallet system — fund your wallet, fees are deducted automatically per transaction</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Monthly license fee covers platform access, data storage, regulatory reporting, and support</li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">What Banks & Large Institutions Need</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> BoG banking license or regulatory approval</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Affiliation with a licensed credit bureau on the platform</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> IT team capable of API or batch integration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Signed data sharing and compliance agreement</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Designated compliance officer for CRB reporting</li>
                </ul>
              </div>

              <Button asChild size="sm" variant="outline" data-testid="button-contact-sales-commercial">
                <Link href="/contact-sales">Contact Sales for Commercial Pricing →</Link>
              </Button>
            </div>
          </Section>

          <Section id="sovereign" title="Central Banks & Sovereign Deployment" icon={Crown}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                The <strong className="text-foreground">Sovereign tier</strong> is designed exclusively for central banks, national regulators, and government financial oversight bodies. It provides a <strong className="text-foreground">fully isolated, dedicated deployment</strong> of the {PLATFORM_COMPANY_NAME} platform — no shared infrastructure, no shared data, complete control.
              </p>

              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-violet-500/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><Crown className="w-5 h-5 text-violet-500" /> Sovereign Plan</h4>
                  <div>
                    <span className="text-2xl font-bold text-foreground">Custom</span>
                    <span className="text-muted-foreground text-xs ml-1">pricing</span>
                  </div>
                </div>
                <p className="text-xs">Perpetual licensing available. Includes dedicated infrastructure, on-site deployment option, and full platform source access for audit.</p>
              </div>

              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <h4 className="font-semibold text-foreground mb-3">What Makes Sovereign Different</h4>
                <p className="text-xs mb-3">Unlike the shared-cloud tiers used by bureaus and banks, the Sovereign deployment is a <strong className="text-foreground">completely separate instance</strong> of the platform:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: "Full Data Sovereignty", desc: "All data stays within your jurisdiction. No data leaves your borders. Dedicated database, dedicated application servers, dedicated encryption keys.", icon: Shield },
                    { title: "Isolated Infrastructure", desc: "Your deployment runs on dedicated cloud infrastructure or on-premise servers. No shared resources with any other organization.", icon: Database },
                    { title: "Macroeconomic NPL Dashboards", desc: "National-level non-performing loan dashboards, sector-level risk analysis, systemic risk indicators, and early warning systems.", icon: BarChart3 },
                    { title: "Regulatory Oversight Tools", desc: "Monitor all credit bureaus operating under your jurisdiction. View aggregate data submissions, compliance metrics, and dispute resolution rates.", icon: Scale },
                    { title: "On-Premise Deployment", desc: "Deploy the full platform within your own data center. We provide installation, configuration, training, and ongoing support.", icon: Cpu },
                    { title: "Custom Integrations", desc: "Direct integration with national payment systems (GhIPSS, Ghana Interbank Payment), national ID systems (Ghana Card / NIA), and banking supervision tools.", icon: Settings },
                  ].map(item => (
                    <div key={item.title} className="rounded-lg border border-border bg-background p-3">
                      <h4 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1.5"><item.icon className="w-3.5 h-3.5 text-violet-500" />{item.title}</h4>
                      <p className="text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">Sovereign Deployment Requirements</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-violet-500 flex-shrink-0" /> Central bank or national regulatory authority mandate</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-violet-500 flex-shrink-0" /> Designated project team for deployment coordination</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-violet-500 flex-shrink-0" /> Data center facilities (for on-premise) or approved cloud provider (AWS, Azure, GCP)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-violet-500 flex-shrink-0" /> Security and compliance team for audit and penetration testing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-violet-500 flex-shrink-0" /> Formal procurement process — we support RFP/RFQ responses</li>
                </ul>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">Licensing Model</p>
                    <p className="text-xs">
                      Sovereign deployments can be licensed as a perpetual license (one-time fee + annual maintenance) or as a managed service (annual subscription including hosting, updates, and support). Both options include full source code access for audit purposes. Pricing is determined through direct negotiation based on scope, population served, and infrastructure requirements.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild size="sm" variant="outline" data-testid="button-request-briefing-sovereign">
                <Link href="/contact-sales?tier=sovereign">Request Executive Briefing →</Link>
              </Button>
            </div>
          </Section>

          <Section id="pricing" title="Pricing & Transaction Fees" icon={CreditCard}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                {PLATFORM_COMPANY_NAME} uses a <strong className="text-foreground">per-transaction pricing model</strong> for Growth and Commercial tiers. Consumer accounts are free. Sovereign pricing is custom.
              </p>
              <PricingTable />

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">Monthly License Fees</p>
                    <p className="text-xs">
                      In addition to per-transaction fees, institutions pay a monthly platform license fee based on their tier:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li><strong className="text-foreground">Consumer:</strong> Free — no fees</li>
                      <li><strong className="text-foreground">Growth:</strong> From {GHS_SYMBOL}499/month — includes 5 user seats and standard support</li>
                      <li><strong className="text-foreground">Commercial:</strong> From {GHS_SYMBOL}3,500/month — includes unlimited users, SSO, and dedicated support</li>
                      <li><strong className="text-foreground">Sovereign:</strong> Custom — negotiated based on deployment scope and infrastructure</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="wallet" title="Prepaid Wallet System" icon={Wallet}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                All paying institutions (Growth, Commercial, and Bureau licensees) operate on a <strong className="text-foreground">prepaid wallet model</strong>. Fund your wallet first, then process transactions. This ensures zero credit risk and guarantees uninterrupted service.
              </p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Consumer accounts and Sovereign deployments do not use the wallet system. Consumers access the platform for free, and Sovereign clients have custom billing arrangements.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-foreground">Real-Time Deductions</h4>
                  <p className="text-xs">Every billable transaction (credit report pull, API call, batch upload, etc.) is deducted from your wallet instantly. No invoices, no delays.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">Full Transparency</h4>
                  <p className="text-xs">Every deduction is recorded in your transaction ledger. View your balance, transaction history, and spending patterns in real time.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Low Balance Alerts</h4>
                  <p className="text-xs">When your balance drops below the threshold (default: {GHS_SYMBOL}500), you'll receive alerts. We recommend maintaining at least one week's expected volume.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Lock className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-foreground">Insufficient Funds</h4>
                  <p className="text-xs">If your wallet balance is insufficient, the transaction will be recorded but marked as <strong>unbilled</strong>. Ensure your wallet is always funded to avoid disruption.</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-3">How Wallet Billing Works</h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
                  {[
                    { n: "1", label: "Fund your wallet", color: "teal" },
                    { n: "2", label: "Process transactions", color: "blue" },
                    { n: "3", label: "Fees deducted instantly", color: "emerald" },
                    { n: "4", label: "Top up when low", color: "amber" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2`}>
                        <span className={`w-6 h-6 rounded-full bg-${step.color}-500/20 text-${step.color}-500 flex items-center justify-center text-xs font-bold`}>{step.n}</span>
                        <span>{step.label}</span>
                      </div>
                      {i < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
                      {i < 3 && <ChevronDown className="w-4 h-4 text-muted-foreground sm:hidden" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section id="payment-methods" title="Accepted Payment Methods" icon={Banknote}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>Fund your wallet using any of the following methods. All amounts are in Ghana Cedis ({GHS_SYMBOL}).</p>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-500" /> Mobile Money
                  </h4>
                  <p className="text-xs mb-2">Instant wallet funding via mobile money. Supported providers:</p>
                  <div className="flex flex-wrap gap-2">
                    {["MTN MoMo", "Vodafone Cash", "AirtelTigo Money"].map(p => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Processing time: Instant to 5 minutes. Transaction limits apply per provider.</p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-500" /> Bank Transfer
                  </h4>
                  <p className="text-xs mb-2">Direct bank transfer to our settlement account. Supported banks:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "GCB Bank", "Ecobank Ghana", "Stanbic Bank", "Absa Bank Ghana",
                      "Fidelity Bank", "Zenith Bank Ghana", "Access Bank Ghana",
                      "CalBank", "Prudential Bank", "Republic Bank Ghana",
                      "Standard Chartered Ghana", "UBA Ghana", "Bank of Africa Ghana",
                      "First National Bank Ghana", "Societe Generale Ghana",
                      "National Investment Bank", "ADB (Agric Dev Bank)",
                      "First Atlantic Bank",
                    ].map(b => (
                      <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Processing time: Same-day for GhIPSS instant payments; 1–2 business days for standard transfers.</p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-violet-500" /> Card / Stripe
                  </h4>
                  <p className="text-xs">Pay with Visa, Mastercard, or other international cards via our Stripe integration. Ideal for international institutions or fintech partners. Processing time: Instant.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="revenue-split" title="Revenue Split Model (Bureaus)" icon={ArrowRightLeft}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Credit bureaus that license {PLATFORM_COMPANY_NAME} as their infrastructure operate under a <strong className="text-foreground">revenue-sharing model</strong>:
              </p>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Platform Fee (default)</span>
                    <span className="text-teal-500">20%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Bureau Revenue</span>
                    <span className="text-blue-500">80%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>
              <p className="text-xs">
                <strong className="text-foreground">Example:</strong> A bank pulls a credit report at {GHS_SYMBOL}2.50. The platform automatically takes {GHS_SYMBOL}0.50 (20%) as the platform fee, and {GHS_SYMBOL}2.00 (80%) remains as the bureau's revenue. This happens in real time with every transaction.
              </p>
              <p className="text-xs">
                The default platform fee is 20%, but this is <strong className="text-foreground">negotiable</strong> based on volume commitments and contract terms. Contact sales for enterprise arrangements.
              </p>
              <p className="text-xs">
                <strong className="text-foreground">Note:</strong> This revenue split applies only to the bureau tier. Banks and MFIs on the Growth or Commercial tier pay transaction fees directly — they don't participate in the revenue split.
              </p>
            </div>
          </Section>

          <Section id="onboarding" title="Onboarding Steps" icon={CheckCircle2}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>The onboarding process varies by client type. Select your path:</p>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><User className="w-4 h-4 text-emerald-500" /> Consumer Onboarding</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "Register on portal",
                    "Verify identity (OTP/email)",
                    "View your credit report",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                      <span>{step}</span>
                      {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-2 text-muted-foreground">Total time: Under 10 minutes. No cost. <a href="/consumer/register" className="text-teal-500 underline">Register now →</a></p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-500" /> Institution Onboarding (Growth / Commercial / Bureau)</h4>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Apply & Register", desc: "Create your organization account. Provide business registration details, institution type, and primary contact information.", link: "/signup", linkText: "Register Now", time: "5 minutes" },
                    { step: 2, title: "Compliance Review", desc: "Our team reviews your application for BoG CRB compliance. Bureaus: we verify your CRB license. Banks/MFIs: we verify regulatory status and bureau affiliation.", time: "1–3 business days" },
                    { step: 3, title: "Agreement & Pricing", desc: "Sign the platform usage agreement. Bureaus negotiate platform fee and license terms. Banks/MFIs confirm their tier and pricing.", time: "1–2 business days" },
                    { step: 4, title: "Fund Your Wallet", desc: "Top up your prepaid wallet via Mobile Money, bank transfer, or card. We recommend at least ₵1,000 to get started.", time: "Instant to same-day" },
                    { step: 5, title: "Technical Integration", desc: "Receive API credentials (OAuth 2.1 client ID/secret). Integrate via REST API, web portal, or batch uploads. Our team provides integration support.", time: "1–5 business days" },
                    { step: 6, title: "Go Live", desc: "Complete a test transaction in sandbox mode, then switch to production. Start submitting data and pulling credit reports.", time: "Same day" },
                  ].map(item => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                          <Badge variant="outline" className="text-[9px] text-muted-foreground"><Clock className="w-2.5 h-2.5 mr-0.5 inline" /> {item.time}</Badge>
                        </div>
                        <p className="text-xs">{item.desc}</p>
                        {item.link && (
                          <Button asChild variant="link" size="sm" className="h-auto p-0 mt-0.5 text-teal-500 text-xs" data-testid={`link-onboarding-step-${item.step}`}>
                            <Link href={item.link}>{item.linkText} →</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Crown className="w-4 h-4 text-violet-500" /> Sovereign / Central Bank Onboarding</h4>
                <div className="space-y-2 text-xs">
                  {[
                    { step: 1, title: "Executive Briefing", desc: "Request an executive briefing to understand the Sovereign deployment model, data sovereignty guarantees, and licensing terms." },
                    { step: 2, title: "Technical Assessment", desc: "Our team assesses your infrastructure requirements — cloud vs. on-premise, data center specs, network topology, and security requirements." },
                    { step: 3, title: "Procurement & Agreement", desc: "We support your formal procurement process (RFP/RFQ). Negotiate licensing terms — perpetual or annual subscription." },
                    { step: 4, title: "Deployment & Configuration", desc: "We deploy and configure your isolated instance. Custom integrations with national ID systems, payment infrastructure, and regulatory tools." },
                    { step: 5, title: "Staff Training", desc: "On-site training for your technical and operational teams. Documentation, runbooks, and knowledge transfer." },
                    { step: 6, title: "Go Live & Ongoing Support", desc: "Staged rollout — pilot with select bureaus, then national deployment. Dedicated support team and quarterly business reviews." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{item.step}</span>
                      <div>
                        <span className="font-semibold text-foreground">{item.title}:</span> {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-3 text-muted-foreground">Total timeline: 3–6 months from briefing to go-live. <a href="/contact-sales?tier=sovereign" className="text-teal-500 underline">Request executive briefing →</a></p>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">Free Trial Available (Growth & Commercial)</p>
                    <p className="text-xs">New institutions can start with a 14-day free trial. No credit card required — <a href="/start-trial" className="text-teal-500 underline">start your trial now</a>.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="technical" title="Technical Integration Requirements" icon={Server}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Connect to {PLATFORM_COMPANY_NAME} via REST API, web portal, or batch file upload — depending on your tier and needs:</p>

              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">Authentication</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> OAuth 2.1 with client credentials grant</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> JWT bearer tokens with configurable expiry</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> API key authentication for server-to-server calls</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Google OAuth, Microsoft Azure AD, and SAML 2.0 SSO <Badge variant="outline" className="text-[8px] ml-1">Commercial+</Badge></li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Multi-factor authentication (TOTP) — available on all tiers</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> WebAuthn/biometric authentication <Badge variant="outline" className="text-[8px] ml-1">Commercial+</Badge></li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">API Capabilities</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Credit report pull (consumer & business)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Borrower data submission (individual & batch)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Credit account creation & updates</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Dispute management</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cross-border entity queries (PAPSS integration)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Webhook notifications for real-time events</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Idempotency support on critical endpoints</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Telco alternative data scoring APIs <Badge variant="outline" className="text-[8px] ml-1">All tiers</Badge></li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">Data Formats & Standards</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> JSON REST API (Content-Type: application/json)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> CSV/Excel batch upload support <Badge variant="outline" className="text-[8px] ml-1">Commercial+</Badge></li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> BoG CRB v1.1 data format compliance</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> IFF (International Financial Format) file processing</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> PAPSS cross-border settlement integration</li>
                  </ul>
                </div>

                <p className="text-xs">
                  Full API documentation with interactive explorer: <a href="/api-docs" className="text-teal-500 underline">API Documentation</a>.
                  Ghana-specific integration guides: <a href="/ghana-docs" className="text-teal-500 underline">Ghana Documentation</a>.
                </p>
              </div>
            </div>
          </Section>

          <Section id="compliance" title="Compliance & Security" icon={Shield}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{PLATFORM_COMPANY_NAME} is built with security and regulatory compliance at its core — across all tiers:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Bank of Ghana CRB v1.1", desc: "Full compliance with BoG Credit Reporting Bureau regulations, including data standards, retention policies, and reporting requirements." },
                  { title: "Data Encryption", desc: "AES-256 encryption at rest, TLS 1.3 in transit. PII fields encrypted with dedicated keys and salts. Sovereign tier gets dedicated encryption infrastructure." },
                  { title: "Access Control", desc: "Role-based access control (RBAC) with maker-checker workflows for critical operations. MFA enforced. SAML 2.0 for enterprise SSO." },
                  { title: "Audit Trail", desc: "SHA-256 cryptographic audit logs with blockchain anchoring for tamper-proof evidence. Every data access, modification, and report pull is logged." },
                  { title: "Data Retention", desc: "Configurable retention policies per jurisdiction. Ghana default: 7 years. Automated data disposal with audit-trail preservation." },
                  { title: "Consent Management", desc: "Full borrower consent tracking. GDPR-aligned consent workflows with granular purpose tracking. Consumer portal for managing own consents." },
                  { title: "Data Sovereignty", desc: "Sovereign tier guarantees all data stays within your jurisdiction. Dedicated database, dedicated servers, dedicated keys — no shared infrastructure." },
                  { title: "Penetration Testing", desc: "Regular security audits and penetration testing. SAST scanning, dependency auditing, and vulnerability management." },
                ].map(item => (
                  <div key={item.title} className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-teal-500" />{item.title}</h4>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="sla" title="Service Level Agreement (SLA)" icon={Clock}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" data-testid="table-sla">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 border border-border font-semibold">Metric</th>
                      <th className="text-center p-3 border border-border font-semibold">Consumer</th>
                      <th className="text-center p-3 border border-border font-semibold">Growth</th>
                      <th className="text-center p-3 border border-border font-semibold">Commercial</th>
                      <th className="text-center p-3 border border-border font-semibold">Sovereign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: "Uptime Guarantee", consumer: "99%", growth: "99.5%", commercial: "99.9%", sovereign: "99.99%" },
                      { metric: "API Response Time", consumer: "Best-effort", growth: "<500ms", commercial: "<200ms", sovereign: "<100ms" },
                      { metric: "Support Response", consumer: "48 hours", growth: "24 hours", commercial: "4 hours", sovereign: "1 hour" },
                      { metric: "Support Channels", consumer: "Email", growth: "Email", commercial: "Email, Phone", sovereign: "Dedicated Team" },
                      { metric: "Data Backup", consumer: "Daily", growth: "Daily", commercial: "Hourly", sovereign: "Real-time" },
                      { metric: "Infrastructure", consumer: "Shared", growth: "Shared", commercial: "Shared (priority)", sovereign: "Dedicated" },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                        <td className="p-2.5 border border-border font-medium text-xs">{row.metric}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.consumer}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.growth}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.commercial}</td>
                        <td className="p-2.5 border border-border text-center text-xs">{row.sovereign}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section id="faq" title="Frequently Asked Questions" icon={HelpCircle}>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { q: "I'm an individual — can I check my own credit for free?", a: "Yes. Consumer accounts are completely free. Visit the Consumer Portal or My Credit page, register with your Ghana Card details, and view your full credit report at no charge. This is your legal right under the Bank of Ghana Credit Reporting Act." },
                { q: "I'm a small fintech — do I need to go through a bureau?", a: "For the Ghana deployment, yes — banks and fintechs typically connect through a licensed credit bureau. If you don't yet have a bureau relationship, we can help connect you with one. Alternatively, if you're interested in becoming a direct data provider, contact our sales team." },
                { q: "What's the difference between Growth and Commercial?", a: "Growth is for smaller institutions (MFIs, fintechs, digital lenders) — up to 5 users, standard API, volume-based pricing from ₵499/mo. Commercial adds maker-checker workflows, batch processing, core banking integration, SSO, and dedicated support — from ₵3,500/mo." },
                { q: "What is the Sovereign deployment?", a: "Sovereign is a completely isolated instance of the platform for central banks and regulators. It runs on dedicated infrastructure (cloud or on-premise), has its own database and encryption, and never shares resources with any other client. It includes NPL dashboards, regulatory oversight tools, and direct integration with national infrastructure." },
                { q: "What is the minimum wallet balance to start?", a: "There is no enforced minimum, but we recommend at least ₵500 to ensure uninterrupted service. Our system alerts you when your balance drops below your configured threshold." },
                { q: "How quickly are wallet top-ups reflected?", a: "Mobile Money top-ups are typically instant (under 5 minutes). Bank transfers via GhIPSS are same-day. Standard bank transfers take 1–2 business days." },
                { q: "Can I get a refund of my wallet balance?", a: "Yes, unused wallet balance can be withdrawn at any time to your registered bank account or Mobile Money wallet. Withdrawals are processed within 1–2 business days." },
                { q: "What happens if my wallet runs out mid-transaction?", a: "The transaction will be processed but marked as unbilled. You will need to fund your wallet to clear the outstanding balance. We strongly recommend enabling low-balance alerts." },
                { q: "How is the platform fee percentage determined for bureaus?", a: "The default platform fee is 20% of each transaction. This is negotiable for high-volume bureaus and can be adjusted based on your annual volume commitment." },
                { q: "What data formats are accepted for batch uploads?", a: "We accept CSV, Excel (.xlsx), and IFF (International Financial Format) files. Templates and data dictionaries are available in our documentation portal." },
                { q: "Is there a sandbox/test environment?", a: "Yes, every account starts with access to a sandbox environment. You can test your integration without incurring charges or affecting live data." },
                { q: "Can a central bank see all bureau data?", a: "Yes — on a Sovereign deployment, the central bank has regulatory oversight over all credit bureaus operating on the platform. You can view aggregate data submissions, compliance metrics, dispute resolution rates, and NPL indicators across all bureaus." },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <p className="font-semibold text-foreground mb-1">{item.q}</p>
                  <p className="text-xs text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="contact" title="Contact & Next Steps" icon={PhoneCall}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>Ready to connect? Choose the path that fits your needs:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <User className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">I'm a Consumer</p>
                  <p className="text-xs mb-2">Check your credit for free</p>
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 w-full" data-testid="button-consumer-register">
                    <Link href="/consumer/register">Open Consumer Portal</Link>
                  </Button>
                </div>
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">I'm a Fintech / MFI</p>
                  <p className="text-xs mb-2">Start with a free trial</p>
                  <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 w-full" data-testid="button-start-trial">
                    <Link href="/start-trial">Start Free Trial</Link>
                  </Button>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                  <Landmark className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">I'm a Bank / Bureau</p>
                  <p className="text-xs mb-2">Talk to our sales team</p>
                  <Button asChild size="sm" variant="outline" className="w-full" data-testid="button-contact-sales">
                    <Link href="/contact-sales">Contact Sales</Link>
                  </Button>
                </div>
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 text-center">
                  <Crown className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">I'm a Central Bank / Regulator</p>
                  <p className="text-xs mb-2">Request a sovereign briefing</p>
                  <Button asChild size="sm" variant="outline" className="w-full" data-testid="button-request-briefing-sovereign-contact">
                    <Link href="/contact-sales?tier=sovereign">Request Briefing</Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <Mail className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-foreground text-sm mb-1">Email</p>
                  <p className="text-xs">partnerships@africacredithub.com</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <PhoneCall className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-foreground text-sm mb-1">Phone</p>
                  <p className="text-xs">+233 (0) 30 XXX XXXX</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-foreground text-sm mb-1">Documentation</p>
                  <p className="text-xs"><a href="/api-docs" className="text-teal-500 underline">API Docs</a> · <a href="/ghana-docs" className="text-teal-500 underline">Ghana Docs</a></p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {PLATFORM_COMPANY_NAME}. All rights reserved.</p>
          <p className="mt-1">Licensed and regulated under the Bank of Ghana Credit Reporting Act.</p>
        </div>
      </div>
    </div>
  );
}
