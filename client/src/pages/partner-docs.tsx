import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import {
  ArrowLeft, Shield, Wallet, CreditCard, Building2, Smartphone, Landmark,
  ChevronDown, ChevronRight, ArrowRightLeft, FileText, Globe, Server,
  CheckCircle2, AlertTriangle, Clock, Zap, Lock, BarChart3, Users,
  TrendingUp, Banknote, HelpCircle, BookOpen, PhoneCall, Mail,
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
        All fees are in Ghana Cedis (GHS) pesewas. Volume-based discounts apply automatically as your monthly transaction count increases.
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
              Partner Documentation
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl" data-testid="text-partner-docs-subtitle">
            Everything credit bureaus, banks, MFIs, and fintechs need to know about connecting to {PLATFORM_COMPANY_NAME} — pricing, payments, technical requirements, and compliance.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-teal-500/10 text-teal-500 border-teal-500/30">Ghana Deployment</Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Bank of Ghana Compliant</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">BoG CRB v1.1</Badge>
          </div>
        </div>

        <nav className="mb-8 rounded-xl border border-border bg-muted/30 p-4" data-testid="nav-table-of-contents">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {[
              { href: "#overview", label: "Platform Overview", icon: Globe },
              { href: "#who-connects", label: "Who Should Connect", icon: Users },
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
                <strong className="text-foreground">{PLATFORM_COMPANY_NAME}</strong> is a centralized credit data hub (CDH v2.5) designed to serve as the infrastructure layer for credit reporting in Ghana. The platform operates under a <strong className="text-foreground">two-tier licensing model</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-500" /> For Credit Bureaus</h4>
                  <p>License the platform infrastructure to operate your bureau. You set your own pricing to banks and lenders while paying the platform a percentage of every transaction as a licensing fee.</p>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-500" /> For Banks, MFIs & Fintechs</h4>
                  <p>Access credit reports, submit data, and manage borrower records through your bureau. You interact with the platform through your bureau's API or web portal.</p>
                </div>
              </div>
              <p>
                The system is designed for <strong className="text-foreground">10 million+ records</strong> and is compliant with Bank of Ghana Credit Reporting Bureau (BoG CRB v1.1) regulations. All monetary amounts are in <strong className="text-foreground">Ghana Cedis ({GHS_SYMBOL})</strong>.
              </p>
            </div>
          </Section>

          <Section id="who-connects" title="Who Should Connect" icon={Users}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>The platform serves multiple institution types across Ghana's financial ecosystem:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  { type: "Licensed Credit Bureaus", desc: "Operate your bureau on our infrastructure. Set your own pricing, manage your data providers, and serve your lending clients.", tag: "Primary", color: "teal" },
                  { type: "Commercial Banks", desc: "Submit borrower data and pull credit reports through your licensed bureau. Integrate via API or web portal.", tag: "Via Bureau", color: "blue" },
                  { type: "Microfinance Institutions (MFIs)", desc: "Access affordable credit scoring and report generation. Volume-based pricing reduces costs at scale.", tag: "Via Bureau", color: "blue" },
                  { type: "Fintech Lenders", desc: "Real-time API access for instant credit decisions. REST API with OAuth 2.1 authentication.", tag: "Via Bureau", color: "blue" },
                  { type: "Insurance Companies", desc: "Assess credit risk for underwriting decisions. Read-only access to credit histories.", tag: "Via Bureau", color: "blue" },
                  { type: "Mobile Network Operators (MNOs)", desc: "Contribute telco payment data for alternative credit scoring. Telco lending lifecycle management available.", tag: "Data Provider", color: "amber" },
                ].map(item => (
                  <div key={item.type} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{item.type}</span>
                      <Badge variant="outline" className={`text-[9px] bg-${item.color}-500/10 text-${item.color}-500 border-${item.color}-500/30`}>{item.tag}</Badge>
                    </div>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="pricing" title="Pricing & Transaction Fees" icon={CreditCard}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                {PLATFORM_COMPANY_NAME} uses a <strong className="text-foreground">per-transaction pricing model</strong> with automatic volume discounts. There are no hidden fees — you only pay for what you use, deducted from your prepaid wallet in real time.
              </p>
              <PricingTable />

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">Monthly License Fee (Bureaus Only)</p>
                    <p className="text-xs">
                      In addition to per-transaction fees, credit bureaus pay a monthly platform license fee. This is negotiated individually based on expected volume, bureau size, and service level. The license fee covers access to the full platform infrastructure, data storage, regulatory reporting tools, and ongoing support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="wallet" title="Prepaid Wallet System" icon={Wallet}>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                {PLATFORM_COMPANY_NAME} operates on a <strong className="text-foreground">prepaid wallet model</strong>. Before processing any transactions, you must fund your wallet. This ensures zero credit risk and guarantees uninterrupted service.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-foreground">Real-Time Deductions</h4>
                  <p className="text-xs">Every billable transaction (credit report pull, API call, batch upload, etc.) is deducted from your wallet instantly at the time of the transaction. No invoices, no delays.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">Full Transparency</h4>
                  <p className="text-xs">Every deduction is recorded in your transaction ledger. View your balance, transaction history, and spending patterns in real time through your dashboard.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Low Balance Alerts</h4>
                  <p className="text-xs">When your balance drops below the configured threshold (default: {GHS_SYMBOL}500), you'll receive alerts. We recommend maintaining at least one week's worth of expected transaction volume in your wallet.</p>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <Lock className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-foreground">Insufficient Funds</h4>
                  <p className="text-xs">If your wallet balance is insufficient for a transaction, the transaction will be recorded but marked as <strong>unbilled</strong>. To avoid service interruption, ensure your wallet is always funded.</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <h4 className="font-semibold text-foreground mb-3">How Wallet Billing Works</h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Fund your wallet</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <ChevronDown className="w-4 h-4 text-muted-foreground sm:hidden" />
                  <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Process transactions</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <ChevronDown className="w-4 h-4 text-muted-foreground sm:hidden" />
                  <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Fees deducted instantly</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <ChevronDown className="w-4 h-4 text-muted-foreground sm:hidden" />
                  <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Top up when low</span>
                  </div>
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
                Credit bureaus operate under a <strong className="text-foreground">revenue-sharing model</strong> with {PLATFORM_COMPANY_NAME}. Here's how it works:
              </p>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-full">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Platform Fee (default)</span>
                      <span className="text-teal-500">20%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: "20%" }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-foreground">
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
              </div>
              <p className="text-xs">
                <strong className="text-foreground">Example:</strong> A bank pulls a credit report at {GHS_SYMBOL}2.50. The platform automatically takes {GHS_SYMBOL}0.50 (20%) as the platform fee, and {GHS_SYMBOL}2.00 (80%) remains as the bureau's revenue. This split happens in real time with every transaction — no manual reconciliation needed.
              </p>
              <p className="text-xs">
                The default platform fee is 20%, but this is negotiable based on volume commitments and contract terms. Contact sales for enterprise arrangements.
              </p>
            </div>
          </Section>

          <Section id="onboarding" title="Onboarding Steps" icon={CheckCircle2}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Getting connected to {PLATFORM_COMPANY_NAME} is straightforward. Here's the process:</p>

              <div className="space-y-3">
                {[
                  { step: 1, title: "Apply & Register", desc: "Create your organization account through our registration portal. Provide your business registration details, institution type, and primary contact information.", link: "/signup", linkText: "Register Now", time: "5 minutes" },
                  { step: 2, title: "Compliance Review", desc: "Our team reviews your application for BoG CRB compliance. For credit bureaus, we verify your CRB license. For banks/MFIs, we verify your regulatory status and bureau affiliation.", time: "1–3 business days" },
                  { step: 3, title: "Agreement & Pricing", desc: "Sign the platform usage agreement. For bureaus: negotiate your platform fee percentage and monthly license terms. For banks/MFIs: your bureau handles pricing directly.", time: "1–2 business days" },
                  { step: 4, title: "Fund Your Wallet", desc: "Top up your prepaid wallet via Mobile Money, bank transfer, or card payment. We recommend an initial funding of at least ₵1,000 to get started.", time: "Instant to same-day" },
                  { step: 5, title: "Technical Integration", desc: "Receive your API credentials (OAuth 2.1 client ID/secret). Integrate using our REST API, use the web portal, or set up batch file uploads. Our team provides integration support.", time: "1–5 business days" },
                  { step: 6, title: "Go Live", desc: "Complete a test transaction in sandbox mode, then switch to production. Start submitting data and pulling credit reports.", time: "Same day" },
                ].map(item => (
                  <div key={item.step} className="flex gap-3 rounded-lg border border-border p-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <Badge variant="outline" className="text-[9px] text-muted-foreground"><Clock className="w-2.5 h-2.5 mr-0.5 inline" /> {item.time}</Badge>
                      </div>
                      <p className="text-xs">{item.desc}</p>
                      {item.link && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-teal-500 text-xs" data-testid={`link-onboarding-step-${item.step}`}>
                          <Link href={item.link}>{item.linkText} →</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mt-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">Free Trial Available</p>
                    <p className="text-xs">New institutions can start with a 14-day free trial. No credit card required — <a href="/start-trial" className="text-teal-500 underline">start your trial now</a>.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section id="technical" title="Technical Integration Requirements" icon={Server}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Connect to {PLATFORM_COMPANY_NAME} via our REST API or web portal. Here are the key technical details:</p>

              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">Authentication</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> OAuth 2.1 with client credentials grant</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> JWT bearer tokens with configurable expiry</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> API key authentication for server-to-server calls</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Google OAuth and Microsoft Azure AD SSO supported</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Multi-factor authentication (TOTP) available</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">API Capabilities</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Credit report pull (consumer & business)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Borrower data submission (individual & batch)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Credit account creation & updates</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Dispute management</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cross-border entity queries</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Webhook notifications for real-time events</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Idempotency support on critical endpoints</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <h4 className="font-semibold text-foreground mb-2">Data Formats & Standards</h4>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> JSON REST API (Content-Type: application/json)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> CSV/Excel batch upload support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> BoG CRB v1.1 data format compliance</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> IFF (International Financial Format) file processing</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> PAPSS cross-border settlement integration</li>
                  </ul>
                </div>

                <p className="text-xs">
                  Full API documentation with interactive explorer is available at <a href="/api-docs" className="text-teal-500 underline">API Documentation</a>.
                  Ghana-specific integration guides are available at <a href="/ghana-docs" className="text-teal-500 underline">Ghana Documentation</a>.
                </p>
              </div>
            </div>
          </Section>

          <Section id="compliance" title="Compliance & Security" icon={Shield}>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{PLATFORM_COMPANY_NAME} is built with security and regulatory compliance at its core:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Bank of Ghana CRB v1.1", desc: "Full compliance with BoG Credit Reporting Bureau regulations, including data standards, retention policies, and reporting requirements." },
                  { title: "Data Encryption", desc: "AES-256 encryption at rest, TLS 1.3 in transit. PII fields encrypted with dedicated encryption keys and salts." },
                  { title: "Access Control", desc: "Role-based access control (RBAC) with maker-checker workflows for critical operations. Multi-factor authentication enforced." },
                  { title: "Audit Trail", desc: "SHA-256 cryptographic audit logs with blockchain anchoring for tamper-proof evidence. Every data access, modification, and report pull is logged." },
                  { title: "Data Retention", desc: "Configurable retention policies per jurisdiction. Ghana default: 7 years. Automated data disposal with audit-trail preservation." },
                  { title: "Consent Management", desc: "Full borrower consent tracking and management. GDPR-aligned consent workflows with granular purpose tracking." },
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
                      <th className="text-center p-3 border border-border font-semibold">Growth</th>
                      <th className="text-center p-3 border border-border font-semibold">Commercial</th>
                      <th className="text-center p-3 border border-border font-semibold">Sovereign</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-border font-medium">Uptime Guarantee</td>
                      <td className="p-3 border border-border text-center">99.5%</td>
                      <td className="p-3 border border-border text-center">99.9%</td>
                      <td className="p-3 border border-border text-center">99.99%</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-3 border border-border font-medium">API Response Time</td>
                      <td className="p-3 border border-border text-center">&lt;500ms</td>
                      <td className="p-3 border border-border text-center">&lt;200ms</td>
                      <td className="p-3 border border-border text-center">&lt;100ms</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-medium">Support Response</td>
                      <td className="p-3 border border-border text-center">24 hours</td>
                      <td className="p-3 border border-border text-center">4 hours</td>
                      <td className="p-3 border border-border text-center">1 hour</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-3 border border-border font-medium">Support Channels</td>
                      <td className="p-3 border border-border text-center">Email</td>
                      <td className="p-3 border border-border text-center">Email, Phone</td>
                      <td className="p-3 border border-border text-center">Dedicated Team</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-medium">Data Backup</td>
                      <td className="p-3 border border-border text-center">Daily</td>
                      <td className="p-3 border border-border text-center">Hourly</td>
                      <td className="p-3 border border-border text-center">Real-time</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section id="faq" title="Frequently Asked Questions" icon={HelpCircle}>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { q: "What is the minimum wallet balance to start?", a: "There is no enforced minimum, but we recommend at least ₵500 to ensure uninterrupted service. Our system alerts you when your balance drops below your configured threshold." },
                { q: "How quickly are wallet top-ups reflected?", a: "Mobile Money top-ups are typically instant (under 5 minutes). Bank transfers via GhIPSS are same-day. Standard bank transfers take 1–2 business days." },
                { q: "Can I get a refund of my wallet balance?", a: "Yes, unused wallet balance can be withdrawn at any time to your registered bank account or Mobile Money wallet. Withdrawals are processed within 1–2 business days." },
                { q: "What happens if my wallet runs out mid-transaction?", a: "The transaction will be processed but marked as unbilled. You will need to fund your wallet to clear the outstanding balance. We strongly recommend enabling low-balance alerts to avoid this." },
                { q: "Can banks connect directly without a bureau?", a: "In the Ghana deployment, banks and MFIs typically connect through a licensed credit bureau. If you're interested in becoming a direct data provider, contact our sales team to discuss options." },
                { q: "Is there a sandbox/test environment?", a: "Yes, every account starts with access to a sandbox environment. You can test your integration without incurring charges or affecting live data." },
                { q: "How is the platform fee percentage determined?", a: "The default platform fee is 20% of each transaction. This is negotiable for high-volume bureaus and can be adjusted based on your annual volume commitment." },
                { q: "What data formats are accepted for batch uploads?", a: "We accept CSV, Excel (.xlsx), and IFF (International Financial Format) files. Templates and data dictionaries are available in our documentation portal." },
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
              <p>Ready to connect? Here's how to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 text-center">
                  <Mail className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">Email Sales</p>
                  <p className="text-xs">partnerships@africacredithub.com</p>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                  <PhoneCall className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">Call Us</p>
                  <p className="text-xs">+233 (0) 30 XXX XXXX</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <FileText className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">Apply Online</p>
                  <p className="text-xs"><a href="/signup" className="text-teal-500 underline">Register your institution →</a></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button asChild className="bg-teal-600 hover:bg-teal-700" data-testid="button-register-now">
                  <Link href="/signup">Register Your Institution</Link>
                </Button>
                <Button asChild variant="outline" data-testid="button-contact-sales">
                  <Link href="/contact-sales">Contact Sales</Link>
                </Button>
                <Button asChild variant="outline" data-testid="button-start-trial">
                  <Link href="/start-trial">Start Free Trial</Link>
                </Button>
                <Button asChild variant="ghost" data-testid="button-api-docs">
                  <Link href="/api-docs">API Documentation</Link>
                </Button>
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
