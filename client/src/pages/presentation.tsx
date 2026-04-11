import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Shield, BarChart3, Brain, Globe, AlertTriangle,
  Building2, Users, FileText, Lock, TrendingUp, Smartphone, Eye, CheckCircle,
  XCircle, AlertCircle, Zap, Database, ArrowLeft, Maximize2, Minimize2
} from "lucide-react";

const SLIDES = [
  { id: "title", type: "title" },
  { id: "market-problem", type: "market-problem" },
  { id: "npl-crisis", type: "npl-crisis" },
  { id: "credit-gap", type: "credit-gap" },
  { id: "solution", type: "solution" },
  { id: "consumer-reports", type: "consumer-reports" },
  { id: "corporate-reports", type: "corporate-reports" },
  { id: "scoring-engine", type: "scoring-engine" },
  { id: "alternative-data", type: "alternative-data" },
  { id: "fraud-detection", type: "fraud-detection" },
  { id: "portfolio-intelligence", type: "portfolio-intelligence" },
  { id: "dashboard-analytics", type: "dashboard-analytics" },
  { id: "security", type: "security" },
  { id: "compliance", type: "compliance" },
  { id: "why-ach", type: "why-ach" },
  { id: "who-its-for", type: "who-its-for" },
  { id: "facility-types", type: "facility-types" },
  { id: "pricing", type: "pricing" },
  { id: "cta", type: "cta" },
];

function SlideWrapper({ children, bg = "dark" }: { children: React.ReactNode; bg?: "dark" | "light" | "accent" }) {
  const bgClass = bg === "dark"
    ? "bg-[#0a0e1a] text-white"
    : bg === "accent"
    ? "bg-gradient-to-br from-[#0f1629] via-[#162044] to-[#1a1040] text-white"
    : "bg-white text-[#1a1a2e]";
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-8 md:p-16 ${bgClass} overflow-y-auto`}>
      {children}
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
      <div className="text-3xl md:text-4xl font-bold text-[#4f8cff] mb-1">{value}</div>
      <div className="text-sm text-white/70">{label}</div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color = "#4f8cff" }: { icon: any; title: string; desc: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left">
      <Icon className="w-6 h-6 mb-3" style={{ color }} />
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div className="text-xs text-white/60 leading-relaxed">{desc}</div>
    </div>
  );
}

function CompareRow({ feature, cdh, others, othersIcon }: { feature: string; cdh: string; others: string; othersIcon: "x" | "warn" }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-white/5 text-sm">
      <div className="text-white/80">{feature}</div>
      <div className="flex items-center gap-2 text-emerald-400"><CheckCircle className="w-4 h-4" />{cdh}</div>
      <div className="flex items-center gap-2 text-white/50">
        {othersIcon === "x" ? <XCircle className="w-4 h-4 text-red-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
        {others}
      </div>
    </div>
  );
}

function SlideContent({ type }: { type: string }) {
  switch (type) {
    case "title":
      return (
        <SlideWrapper bg="accent">
          <div className="text-center max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs text-white/70 mb-4">
              <Globe className="w-3.5 h-3.5" /> Confidential & Proprietary
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Africa Credit Hub
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
              Comprehensive credit reporting for consumers & corporations — powering smarter lending decisions across Ghana's financial sector
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/40">
              <span>Credit reference and risk intelligence services</span>
              <span className="hidden md:inline">|</span>
              <span>dashboard.africacredithub.com/ghana</span>
            </div>
            <p className="text-xs text-white/30 mt-8">Presented by Uffe Jon Carlson · Carlson Capital · 2026</p>
          </div>
        </SlideWrapper>
      );

    case "market-problem":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Ghana's Banks Are Lending at High Risk</h2>
            <p className="text-center text-white/60 max-w-2xl mx-auto">
              Better credit data means better lending decisions. Ghana's banks need comprehensive, real-time credit intelligence to reduce NPLs and expand access to credit.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard value="23" label="Universal Banks" sub="Ghana's 23 universal banks" />
              <StatCard value="GHS 252B" label="Banking Assets" sub="Total financial sector assets (34% growth)" />
              <StatCard value="15.1M" label="Bureau Enquiries/yr" sub="Credit bureau enquiries in 2024" />
              <StatCard value="115%" label="Growth" sub="Credit bureau enquiries YoY growth" />
            </div>
            <p className="text-xs text-center text-white/30 mt-4">Source: Bank of Ghana Credit Reporting Report, 2024</p>
          </div>
        </SlideWrapper>
      );

    case "npl-crisis":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Ghana NPL Crisis</h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md mx-auto">
              <div className="text-5xl font-bold text-red-400">22.7%</div>
              <div className="text-sm text-white/70 mt-2">Ghana NPL Ratio (Dec 2024)</div>
              <div className="text-xs text-white/40 mt-1">Nearly 4x the global average of 5.8%</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-2xl font-bold text-amber-400">GHS 17.4B</div>
                <div className="text-xs text-white/60 mt-1">NPL Stock (June 2024)</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-2xl font-bold text-white/80">35%</div>
                <div className="text-xs text-white/60 mt-1">NPL Reduction with Africa Credit Hub</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-2xl font-bold text-emerald-400">$2.4M</div>
                <div className="text-xs text-white/60 mt-1">Est. Annual Savings Per Bank</div>
              </div>
            </div>
            <p className="text-xs text-center text-white/30">Source: Bank of Ghana Financial Stability Review, 2024</p>
          </div>
        </SlideWrapper>
      );

    case "credit-gap":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">The Credit Reporting Gap</h2>
            <p className="text-center text-white/60 max-w-xl mx-auto">
              Data fragmentation across multiple bureaus creates blind spots. A unified platform gives lenders the complete picture they need.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-red-400">Fragmented Credit Data</h3>
                <p className="text-sm text-white/60">3 separate credit bureaus with limited data sharing between them — XDS Data, Dun & Bradstreet, and Hudson</p>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Corporate Blind Spots</div>
                  <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Thin Consumer Files</div>
                  <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> No Alternative Data</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-emerald-400">Africa Credit Hub Solution</h3>
                <p className="text-sm text-white/60">A unified credit data platform delivering comprehensive consumer and corporate credit reports — built for Ghana's regulatory framework under Act 726 & L.I. 2394.</p>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Full ecosystem</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Consumer + Corporate Reports</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 6+ alternative data sources</div>
                </div>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "solution":
      return (
        <SlideWrapper bg="accent">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Platform Overview</h2>
              <p className="text-white/60">Built for Ghana's Financial Ecosystem</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard icon={FileText} title="Consumer & Corporate Reports" desc="Complete individual credit histories, scores (300–850), and corporate financial health indicators" />
              <FeatureCard icon={Brain} title="AI/ML Scoring Engine" desc="AI-generated score based on payment history, utilization, account age & mix" color="#a78bfa" />
              <FeatureCard icon={Smartphone} title="Alternative Data (MoMo, Telco)" desc="MTN MoMo, Vodafone Cash, AirtelTigo Money transactions for financial inclusion" color="#f59e0b" />
              <FeatureCard icon={Shield} title="Fraud Detection" desc="AI-powered fraud prevention tailored for Ghana's financial landscape" color="#ef4444" />
              <FeatureCard icon={TrendingUp} title="Early Warning System" desc="Predict borrower defaults up to 6 months before they happen" color="#10b981" />
              <FeatureCard icon={BarChart3} title="Dashboard & Analytics" desc="Intelligent dashboards with real-time portfolio monitoring and NPL tracking" color="#06b6d4" />
            </div>
          </div>
        </SlideWrapper>
      );

    case "consumer-reports":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Consumer Credit Reports</h2>
              <p className="text-white/60 max-w-2xl mx-auto">Comprehensive credit intelligence on every Ghanaian consumer — empowering lenders to make informed decisions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Credit Score (300–850)</h4>
                <p className="text-sm text-white/60">AI-generated score based on payment history, utilization, account age & mix</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Credit Account Lifecycle</h4>
                <p className="text-sm text-white/60">All active & closed credit facilities, balances, limits, and repayment status</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Identity Verification</h4>
                <p className="text-sm text-white/60">Ghana Card, TIN, Voter ID, SSNIT — multi-document identity confirmation</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Payment History</h4>
                <p className="text-sm text-white/60">24-month rolling payment performance across all lenders</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Cross-Lender Intelligence</h4>
                <p className="text-sm text-white/60">See a borrower's complete exposure across all 23 universal banks and non-bank lenders</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-[#4f8cff] mb-3">Adverse Information</h4>
                <p className="text-sm text-white/60">Defaults, write-offs, legal actions, and bankruptcy records</p>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "corporate-reports":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Corporate & SME Credit Reports</h2>
              <p className="text-white/60 max-w-2xl mx-auto">Deep business credit intelligence for Ghana's corporate sector — from SMEs to large enterprises</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">Business Credit Score</h4>
                <p className="text-sm text-white/60">Business credit profiles, director linkages, financial health indicators, and cross-entity risk assessment</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">Corporate Facilities</h4>
                <p className="text-sm text-white/60">Aggregate exposure across all participating financial institutions in Ghana</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">Registration & Governance</h4>
                <p className="text-sm text-white/60">RGD registration, TIN, directors, shareholders, and ownership structure</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">Trade Credit History</h4>
                <p className="text-sm text-white/60">Payment behavior with suppliers, banks, and other creditors</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">Legal & Compliance</h4>
                <p className="text-sm text-white/60">Court judgments, regulatory actions, and compliance history</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-3">KYC Document Vault</h4>
                <p className="text-sm text-white/60">Centralized document storage with verification status tracking</p>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "scoring-engine":
      return (
        <SlideWrapper bg="accent">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Credit Reports & Scoring Engine</h2>
              <p className="text-white/60">Branded credit reports for consumers and corporates, downloadable and API-accessible</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-4xl font-bold text-[#4f8cff] mb-2">300–850</div>
                <div className="text-sm font-semibold mb-1">Credit Score Range</div>
                <div className="text-xs text-white/50">Ghana Market Calibrated</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-2">&lt;30s</div>
                <div className="text-sm font-semibold mb-1">Report Generation</div>
                <div className="text-xs text-white/50">Instant credit decisions powered by AI</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-4xl font-bold text-amber-400 mb-2">AI/ML</div>
                <div className="text-sm font-semibold mb-1">Dual-Engine Scoring</div>
                <div className="text-xs text-white/50">GPT-4o + Claude 3.5 Opus</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h4 className="font-semibold mb-3">Score Factors</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
                <div><div className="text-lg font-bold text-[#4f8cff]">35%</div>Payment History</div>
                <div><div className="text-lg font-bold text-[#4f8cff]">30%</div>Credit Utilization</div>
                <div><div className="text-lg font-bold text-[#4f8cff]">15%</div>Credit History Length</div>
                <div><div className="text-lg font-bold text-[#4f8cff]">10%</div>Credit Mix</div>
                <div><div className="text-lg font-bold text-[#4f8cff]">10%</div>New Credit</div>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "alternative-data":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Alternative Data Sources (Ghana)</h2>
              <p className="text-white/60">Expanding credit intelligence beyond traditional banking data</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard icon={Smartphone} title="Mobile Money (MoMo)" desc="MTN MoMo, Vodafone Cash, AirtelTigo Money transactions" color="#f59e0b" />
              <FeatureCard icon={Zap} title="Telco Data" desc="Airtime usage, recharge patterns & data spend" color="#8b5cf6" />
              <FeatureCard icon={Building2} title="Utility Bills" desc="Electricity & water payment consistency (ECG)" color="#06b6d4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-amber-400 mb-2">Ghana Mobile Money Market</h4>
                <p className="text-sm text-white/60">Annual transaction volume — largest in West Africa</p>
                <p className="text-xs text-white/30 mt-2">Source: GSMA Mobile Money Regulatory Index</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-emerald-400 mb-2">Financial Inclusion</h4>
                <p className="text-sm text-white/60">Reaching thin-file consumers with no traditional banking history through MoMo and telco data</p>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "fraud-detection":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Real-Time Fraud Detection</h2>
              <p className="text-white/60">AI-powered fraud prevention tailored for Ghana's financial landscape</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-red-400 mb-3">Synthetic Identity Detection</h4>
                <div className="space-y-2 text-sm text-white/60">
                  <p>Identify fabricated identities using Ghana Card verification</p>
                  <div className="flex items-center gap-2 text-xs text-white/40"><AlertTriangle className="w-3 h-3" /> Fake Ghana Card numbers</div>
                  <div className="flex items-center gap-2 text-xs text-white/40"><AlertTriangle className="w-3 h-3" /> Mismatched biometrics</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-amber-400 mb-3">Velocity Checks</h4>
                <div className="space-y-2 text-sm text-white/60">
                  <p>Detect multiple loan applications across banks in short timeframes</p>
                  <div className="flex items-center gap-2 text-xs text-white/40"><AlertTriangle className="w-3 h-3" /> 5+ applications in 24 hours</div>
                  <div className="flex items-center gap-2 text-xs text-white/40"><AlertTriangle className="w-3 h-3" /> Cross-bank stacking</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-purple-400 mb-3">Default Prediction</h4>
                <p className="text-sm text-white/60">Predict borrower defaults up to 6 months before they happen — for both consumer and corporate portfolios</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-semibold text-cyan-400 mb-3">Exposure Monitoring</h4>
                <div className="space-y-2 text-sm text-white/60">
                  <p>Automated alerts when borrower behavior signals deteriorating credit quality</p>
                  <div className="flex items-center gap-2 text-xs text-white/40"><AlertTriangle className="w-3 h-3" /> Sudden exposure spikes</div>
                </div>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "portfolio-intelligence":
      return (
        <SlideWrapper bg="accent">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">AI Portfolio Intelligence</h2>
              <p className="text-white/60">Predictive analytics powered by GPT-4o — helping Ghana's banks reduce the 22.7% NPL ratio through early warning and intelligent risk management</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value="95%" label="Fraud Detection Rate" />
              <StatCard value="35%" label="NPL Reduction" />
              <StatCard value="6mo" label="Early Warning" sub="Predict defaults early" />
              <StatCard value="99.9%" label="Uptime SLA" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-sm text-white/60 text-center">Banks using Africa Credit Hub analytics have reduced NPL ratios by up to 35% through proactive portfolio management</p>
            </div>
          </div>
        </SlideWrapper>
      );

    case "dashboard-analytics":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Intelligent Dashboard & Analytics</h2>
              <p className="text-white/60">Real-time portfolio monitoring, risk alerts, and regulatory reporting</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard icon={BarChart3} title="Real-time Updates" desc="Live portfolio data with instant alerts on borrower status changes" color="#4f8cff" />
              <FeatureCard icon={Eye} title="Cross-Lender Linking" desc="Aggregate exposure across all participating financial institutions" color="#10b981" />
              <FeatureCard icon={FileText} title="Regulatory Reporting" desc="Supervisory oversight and systemic risk monitoring dashboards" color="#f59e0b" />
              <FeatureCard icon={Users} title="Borrower Registry" desc="Unified registry of every consumer and corporate borrower in Ghana" color="#8b5cf6" />
              <FeatureCard icon={Database} title="Audit Trail" desc="Every enquiry, score change, and data update fully logged per Bank of Ghana requirements" color="#06b6d4" />
              <FeatureCard icon={Brain} title="AI Insights" desc="Systemic risk dashboards with predictive analytics and compliance monitoring" color="#ef4444" />
            </div>
          </div>
        </SlideWrapper>
      );

    case "security":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Enterprise-Grade Security</h2>
              <p className="text-white/60">Built specifically for Ghana's regulatory environment</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <Lock className="w-6 h-6 text-[#4f8cff] mb-3" />
                <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
                <p className="text-sm text-white/60">AES-256-GCM encryption for all PII data at rest and in transit</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <Shield className="w-6 h-6 text-emerald-400 mb-3" />
                <h4 className="font-semibold mb-2">4-Tier RBAC</h4>
                <p className="text-sm text-white/60">Admin, Manager, Analyst, Viewer with granular permissions</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <Database className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-semibold mb-2">SHA-256 Audit Trail</h4>
                <p className="text-sm text-white/60">Tamper-evident hash chain with blockchain anchoring</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <Smartphone className="w-6 h-6 text-purple-400 mb-3" />
                <h4 className="font-semibold mb-2">Multi-Factor Auth</h4>
                <p className="text-sm text-white/60">SMS OTP, authenticator apps, and hardware keys</p>
              </div>
            </div>
            <div className="text-center text-xs text-white/30">
              🏛️ BoG approved data centers · SOC 2 Type II · ISO 27001 compliant
            </div>
          </div>
        </SlideWrapper>
      );

    case "compliance":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Ghana Regulatory Compliance</h2>
              <p className="text-white/60">Fully compliant with Ghana's Credit Reporting Act (Act 726), Data Protection Act (Act 843), and Bank of Ghana directives</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-lg font-bold text-[#4f8cff] mb-2">Credit Reporting Act</div>
                <div className="text-xs text-white/50">Act 726 (2007)</div>
                <div className="text-xs text-white/40 mt-1">Full compliance with credit reporting legislation</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-lg font-bold text-emerald-400 mb-2">Data Protection Act</div>
                <div className="text-xs text-white/50">Act 843 (2012)</div>
                <div className="text-xs text-white/40 mt-1">Privacy and data protection compliance</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-lg font-bold text-amber-400 mb-2">BoG Directives</div>
                <div className="text-xs text-white/50">L.I. 2394</div>
                <div className="text-xs text-white/40 mt-1">Expanded institutional participation requirements</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <p className="text-sm text-white/60">Record of all credit checks made by financial institutions — every enquiry, score change, and data update fully logged</p>
            </div>
          </div>
        </SlideWrapper>
      );

    case "why-ach":
      return (
        <SlideWrapper bg="accent">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Why Choose Africa Credit Hub Over Existing Bureaus?</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 overflow-x-auto">
              <div className="grid grid-cols-3 gap-4 pb-3 border-b border-white/10 text-sm font-semibold">
                <div>Feature</div>
                <div className="text-emerald-400">Africa Credit Hub</div>
                <div className="text-white/50">Existing Bureaus</div>
              </div>
              <CompareRow feature="Consumer Reports" cdh="Both unified" others="Single institution" othersIcon="x" />
              <CompareRow feature="Corporate Reports" cdh="Full ecosystem" others="Corporate focus" othersIcon="warn" />
              <CompareRow feature="Scoring" cdh="AI-powered" others="Basic models" othersIcon="warn" />
              <CompareRow feature="Alternative Data" cdh="6+ sources" others="Traditional only" othersIcon="x" />
              <CompareRow feature="Fraud Detection" cdh="Real-time AI" others="Basic checks" othersIcon="warn" />
              <CompareRow feature="API Integration" cdh="API-first" others="Custom integrations" othersIcon="warn" />
              <CompareRow feature="Data Submission" cdh="Real-time + batch" others="Batch-heavy" othersIcon="warn" />
              <CompareRow feature="Compliance" cdh="Act 726, L.I. 2394, Act 843" others="Compliant" othersIcon="warn" />
              <CompareRow feature="Go-Live" cdh="24 hours" others="12-24 months" othersIcon="x" />
            </div>
          </div>
        </SlideWrapper>
      );

    case "who-its-for":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Who It's For</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
                <Building2 className="w-8 h-8 text-[#4f8cff] mx-auto" />
                <h4 className="font-semibold">Universal Banks</h4>
                <p className="text-sm text-white/60">Ghana's 23 universal banks — reduce NPLs and improve credit decisioning</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
                <Users className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-semibold">MFIs & Rural Banks</h4>
                <p className="text-sm text-white/60">Plus MFIs, rural banks, fintechs, and savings & loans</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
                <Smartphone className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="font-semibold">Fintechs & Digital Lenders</h4>
                <p className="text-sm text-white/60">Digital credit providers under BoG license</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Bank of Ghana</h4>
                <p className="text-xs text-white/50">Supervisory oversight and systemic risk monitoring</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <Globe className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Insurance Companies</h4>
                <p className="text-xs text-white/50">Credit check & scoring for underwriting</p>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "facility-types":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center">Supported Facility Types in Ghana</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Personal Loans", "Mortgages", "Auto Loans", "Business Loans", "Microfinance", "Credit Cards", "Overdrafts", "Trade Finance", "Leasing", "Student Loans", "Agricultural Loans", "Asset Finance"].map((f) => (
                <div key={f} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-sm text-white/70">{f}</div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <h4 className="font-semibold mb-2">Credit Account Lifecycle Management</h4>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                {["Application", "Approval", "Active", "Delinquent", "Default", "Restructured", "Written Off", "Closed"].map((s, i) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="bg-[#4f8cff]/20 text-[#4f8cff] rounded px-2 py-0.5">{s}</span>
                    {i < 7 && <ChevronRight className="w-3 h-3 text-white/20" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "pricing":
      return (
        <SlideWrapper bg="dark">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">Choose Your Plan</h2>
              <p className="text-white/60">Select the plan that fits your institution's size and needs. Scale as you grow.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h4 className="font-bold text-lg">Starter</h4>
                <p className="text-xs text-white/50">Per-enquiry pricing</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Consumer & corporate reports</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Credit check & scoring</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />API integration support</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Dedicated onboarding call</li>
                </ul>
              </div>
              <div className="bg-[#4f8cff]/10 border border-[#4f8cff]/30 rounded-xl p-6 space-y-4 ring-1 ring-[#4f8cff]/20">
                <h4 className="font-bold text-lg text-[#4f8cff]">Professional</h4>
                <p className="text-xs text-white/50">Volume discounts for banks</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Everything in Starter</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />AI Portfolio Intelligence</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Fraud Detection</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Alternative data</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />24/7 support</li>
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h4 className="font-bold text-lg">Enterprise</h4>
                <p className="text-xs text-white/50">Custom enterprise plans</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Everything in Professional</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Core banking system connectors</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />24/7 technical support</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />Affordable pricing</li>
                </ul>
              </div>
            </div>
          </div>
        </SlideWrapper>
      );

    case "cta":
      return (
        <SlideWrapper bg="accent">
          <div className="text-center max-w-2xl space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">Modernize Ghana's Credit Reporting Infrastructure</h2>
            <p className="text-lg text-white/60">
              Connect your core banking system via API and start generating credit reports instantly.
            </p>
            <p className="text-sm text-white/40">Full access to consumer & corporate credit reports. No commitment required. Dedicated Ghana onboarding support.</p>
            <div className="space-y-3 mt-8">
              <p className="text-sm text-white/50">uffe.carlson@gmail.com · +233 552 395 549</p>
              <p className="text-sm text-white/50">Uffe Jon Carlson · Carlson Capital</p>
              <p className="text-xs text-white/30 mt-4">africacredithub.com</p>
            </div>
            <p className="text-xs text-white/20 mt-8">© 2026 Africa Credit Hub · Carlson Capital. Confidential & Proprietary.</p>
          </div>
        </SlideWrapper>
      );

    default:
      return null;
  }
}

export default function PresentationPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const goNext = useCallback(() => setCurrentSlide((s) => Math.min(s + 1, SLIDES.length - 1)), []);
  const goPrev = useCallback(() => setCurrentSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape" && isFullscreen) { setIsFullscreen(false); }
      if (e.key === "f" || e.key === "F") { setIsFullscreen((f) => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isFullscreen]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-[100] bg-[#0a0e1a] flex flex-col"
    : "w-full h-[calc(100vh-2rem)] flex flex-col bg-[#0a0e1a] rounded-xl overflow-hidden";

  return (
    <div className={isFullscreen ? "" : "p-2 md:p-4"} data-testid="presentation-page">
      <div className={containerClass}>
        <div className="flex-1 relative overflow-hidden">
          <SlideContent type={SLIDES[currentSlide].type} />
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0e1a] border-t border-white/5">
          <div className="flex items-center gap-2">
            {!isFullscreen && (
              <button onClick={() => navigate("/")} className="text-white/30 hover:text-white/60 transition p-1" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs text-white/30">{currentSlide + 1} / {SLIDES.length}</span>
          </div>

          <div className="flex items-center gap-1">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition ${i === currentSlide ? "bg-[#4f8cff]" : "bg-white/15 hover:bg-white/30"}`}
                data-testid={`dot-slide-${i}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen((f) => !f)} className="text-white/30 hover:text-white/60 transition p-1" data-testid="button-fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={goPrev} disabled={currentSlide === 0} className="text-white/40 hover:text-white disabled:opacity-20 transition p-1" data-testid="button-prev-slide">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} disabled={currentSlide === SLIDES.length - 1} className="text-white/40 hover:text-white disabled:opacity-20 transition p-1" data-testid="button-next-slide">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
