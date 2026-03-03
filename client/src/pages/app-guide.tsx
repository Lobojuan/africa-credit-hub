import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, CreditCard, Search, FileText, Shield, Settings,
  CheckSquare, AlertCircle, Upload, Building2, Headset, Globe, DollarSign,
  Scale, ChevronRight, ChevronLeft, Play, Pause, SkipForward, RotateCcw,
  Monitor, UserCheck, Eye, MousePointerClick,
  BarChart3, MapPin,
  BookOpen, HelpCircle, FileCheck, Layers, Target,
  Info, Zap, Volume2, VolumeX, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Slide {
  id: string;
  section: string;
  sectionIcon: any;
  title: string;
  narration: string;
  visual: string;
  highlight?: string;
  roleNotes?: { role: string; note: string }[];
  tips?: string[];
}

const slides: Slide[] = [
  {
    id: "welcome",
    section: "Welcome",
    sectionIcon: Globe,
    title: "Welcome to the Credit Registry System",
    narration: "This walkthrough will guide you through every feature of the Pan-African Credit Registry System. The system covers all 54 African countries, supports 42+ currencies, and provides comprehensive credit information management. Let's take a tour of what you'll find inside.",
    visual: "hero",
  },
  {
    id: "login",
    section: "Getting Started",
    sectionIcon: Monitor,
    title: "Logging In",
    narration: "To get started, enter your username and password on the login page and click 'Sign In'. The system supports four user roles — Administrator, Regulator, Lender, and Viewer — each with different access levels. Your role determines which features and data you can see.",
    visual: "login",
    tips: [
      "Passwords expire every 90 days for security",
      "After 3 failed attempts, your account is temporarily locked",
      "Two-factor authentication (MFA) can be enabled for extra security",
    ],
  },
  {
    id: "sidebar",
    section: "Getting Started",
    sectionIcon: Monitor,
    title: "Navigating the Sidebar",
    narration: "Once logged in, the sidebar on the left is your main navigation. It's organized into sections: Core features at the top (Dashboard, Borrowers, Credit Accounts, Search, Batch Upload), then Reports & Compliance, System administration, Integrations, and Resources. Sections collapse and expand by clicking their headers. Items you don't have access to are automatically hidden based on your role.",
    visual: "sidebar",
    highlight: "sidebar",
  },
  {
    id: "dashboard-overview",
    section: "Dashboard",
    sectionIcon: LayoutDashboard,
    title: "Your Dashboard — The Command Center",
    narration: "The Dashboard is your landing page after login. At the top, four summary cards show you the key numbers at a glance: Total Borrowers, Total Credit Accounts, Active Disputes, and Pending Approvals. These update in real time as data flows into the system. Click any card to jump directly to that section.",
    visual: "dashboard",
    roleNotes: [
      { role: "Administrator", note: "You see data across ALL institutions and countries" },
      { role: "Lender", note: "Numbers reflect only YOUR institution's data" },
      { role: "Regulator", note: "You see data within your regulatory jurisdiction" },
    ],
  },
  {
    id: "dashboard-charts",
    section: "Dashboard",
    sectionIcon: LayoutDashboard,
    title: "Portfolio Growth & Analytics Charts",
    narration: "Below the summary cards, you'll see interactive charts. The area chart shows 12 months of portfolio growth — borrower and account trends over time. Hover over any point to see exact numbers. Next to it, a donut chart breaks down accounts by status (Current, Delinquent, Default, etc.) and a horizontal bar chart shows distribution by loan type. These give you an instant picture of portfolio health.",
    visual: "charts",
    tips: [
      "Charts are interactive — hover for detailed tooltips",
      "Colors automatically adjust in dark mode",
      "Charts resize responsively on smaller screens",
    ],
  },
  {
    id: "dashboard-map",
    section: "Dashboard",
    sectionIcon: LayoutDashboard,
    title: "Africa Coverage Map",
    narration: "The interactive map shows all 54 African countries color-coded by activity level. Darker shading means more borrowers registered. Hover over any country to see a tooltip with the country name, borrower count, and account count. This gives you a geographic view of the registry's cross-border coverage at a glance.",
    visual: "map",
  },
  {
    id: "borrowers-list",
    section: "Borrowers",
    sectionIcon: Users,
    title: "Viewing the Borrower List",
    narration: "Click 'Borrowers' in the sidebar. You'll see a table listing all borrowers with columns for Name, Type (Individual or Corporate), National ID, Country, Status, and Risk Level. Use the search bar at the top to filter by name or ID. Click any column header to sort the list.",
    visual: "table-borrowers",
    roleNotes: [
      { role: "Administrator", note: "You see ALL borrowers across all institutions and countries" },
      { role: "Lender", note: "You see borrowers associated with YOUR institution only" },
      { role: "Viewer", note: "Read-only access — you won't see Add or Edit buttons" },
    ],
  },
  {
    id: "borrowers-add",
    section: "Borrowers",
    sectionIcon: Users,
    title: "Adding a New Borrower",
    narration: "Click the '+ Add Borrower' button at the top right. A form appears where you select Individual or Corporate. For individuals, fill in First Name, Last Name, National ID, Date of Birth, Gender, Phone, Email, Address, and Country. For corporates, fill in Company Name, Business Registration Number, TIN, and Sector. After submitting, the record enters the maker-checker approval queue — another authorized user must approve it before it becomes active.",
    visual: "form-borrower",
    roleNotes: [
      { role: "Administrator", note: "You can add borrowers from any country" },
      { role: "Lender", note: "You add borrowers for your institution — goes through approval" },
      { role: "Viewer", note: "You CANNOT add borrowers" },
    ],
    tips: [
      "National ID must be unique within a country",
      "Set the PEP flag for Politically Exposed Persons",
      "Select the correct country — it determines the jurisdiction",
    ],
  },
  {
    id: "borrower-detail",
    section: "Borrowers",
    sectionIcon: Users,
    title: "Borrower Detail Page",
    narration: "Click any borrower row to open their full profile. Here you see all their information, linked credit accounts with payment history, credit inquiries, court judgments, and consent records. From this page, you can generate a comprehensive credit report by clicking the 'Generate Credit Report' button.",
    visual: "detail-borrower",
  },
  {
    id: "credit-accounts",
    section: "Credit Accounts",
    sectionIcon: CreditCard,
    title: "Managing Credit Accounts",
    narration: "Navigate to 'Credit Accounts' in the sidebar. The table shows all credit facilities: Account Number, Borrower, Institution, Type, Status, Currency, Original Amount, Current Balance, and Days in Arrears. Click '+ Add Account' to record a new credit facility. You'll need to select the borrower, fill in facility details, and optionally add collateral information. The system supports 42+ African currencies.",
    visual: "table-accounts",
    roleNotes: [
      { role: "Administrator", note: "Full access to add accounts for any institution" },
      { role: "Lender", note: "Add accounts for YOUR institution only — goes through approval" },
      { role: "Viewer", note: "Read-only access to account information" },
    ],
    tips: [
      "For Islamic finance, check the 'Interest-Free' checkbox",
      "Days in Arrears should reflect the latest reporting date",
    ],
  },
  {
    id: "search",
    section: "Global Search",
    sectionIcon: Search,
    title: "Searching the Registry",
    narration: "Click 'Global Search' in the sidebar. Type any name, national ID, TIN, passport number, or account number. The system searches across borrowers, credit accounts, and institutions simultaneously. Results appear grouped by category with relevance ranking. Cross-border entity resolution automatically finds matches across different jurisdictions.",
    visual: "search",
    tips: [
      "Partial matching is supported — no need to type the full name",
      "Filter results by country using the country dropdown",
      "Click any result to navigate directly to the record",
    ],
  },
  {
    id: "credit-report",
    section: "Credit Reports",
    sectionIcon: FileText,
    title: "Generating Credit Reports",
    narration: "From a borrower's detail page, click 'Generate Credit Report'. Select the purpose — New Credit Application, Periodic Review, Collection, Regulatory, or Portfolio Monitoring. The system produces a comprehensive D&B-style report with: a Credit Profile Overview with 11 key indicators, liability breakdown by institution, aging analysis (1-30, 31-60, 61-90 days, etc.), credit exposure by product, and detailed facility cards with 24-month payment history grids.",
    visual: "report",
    tips: [
      "Each report gets a unique serial number for audit tracking",
      "Bureau Score ranges from 300 to 850 with grade and factor analysis",
      "Click 'Print Report' to generate a printer-friendly version",
      "Every report generation is logged in the audit trail",
    ],
  },
  {
    id: "batch-upload",
    section: "Batch Upload",
    sectionIcon: Upload,
    title: "Uploading Records in Bulk",
    narration: "Click 'Batch Upload' in the sidebar. Select whether you're uploading Borrowers or Credit Accounts, then choose your CSV file. Download the template first to see the required column format. The system validates every row and shows a summary: successful imports, errors, and what went wrong. Fix any errors and re-upload the failed rows.",
    visual: "upload",
    roleNotes: [
      { role: "Administrator", note: "Can upload for any institution" },
      { role: "Lender", note: "Upload for your institution — records go through maker-checker" },
    ],
    tips: [
      "Date format must be YYYY-MM-DD",
      "Currency codes must be valid ISO 4217 (ETB, KES, NGN, etc.)",
      "Maximum file size is 10MB per upload",
    ],
  },
  {
    id: "disputes",
    section: "Disputes",
    sectionIcon: AlertCircle,
    title: "Managing Disputes",
    narration: "Navigate to 'Disputes' in the sidebar. Here you can view all dispute cases with their status, priority, and SLA deadline. Click '+ New Dispute' to file a data accuracy concern — select the borrower, the disputed record, the dispute type, and describe the issue. The system automatically assigns a priority and SLA timeline. Disputes approaching or past their deadline are highlighted in red.",
    visual: "disputes",
    roleNotes: [
      { role: "Administrator", note: "Can manage all disputes and assign investigators" },
      { role: "Lender", note: "Can file disputes about your records and respond to disputes" },
      { role: "Regulator", note: "Can oversee dispute resolution and escalate" },
    ],
  },
  {
    id: "approvals",
    section: "Approvals",
    sectionIcon: CheckSquare,
    title: "Maker-Checker Approvals",
    narration: "Go to 'Pending Approvals' in the sidebar. When any user creates or modifies a record, the change enters this approval queue. You'll see the submitter, record type, and what changed. Click to see full before/after details. Click 'Approve' to apply or 'Reject' with a reason to deny. Important: you cannot approve your own submissions — this is a compliance requirement.",
    visual: "approval",
    roleNotes: [
      { role: "Administrator", note: "Can approve/reject ANY pending change" },
      { role: "Regulator", note: "Can approve/reject within your jurisdiction" },
    ],
    tips: [
      "You cannot approve your own submissions",
      "All approval actions are logged in the audit trail",
    ],
  },
  {
    id: "audit",
    section: "Audit Trail",
    sectionIcon: Shield,
    title: "Tamper-Evident Audit Trail",
    narration: "Click 'Audit Trail' in the sidebar. This page records every action in the system: record creations, modifications, report generations, login attempts, approvals, and more. Each entry shows Timestamp, User, Action, Entity, Details, and IP Address. The audit log uses SHA-256 hash chaining — entries cannot be modified or deleted. Use date filters to find specific events, or export to CSV for regulatory reporting.",
    visual: "audit",
    roleNotes: [
      { role: "Administrator", note: "Full visibility of all audit entries" },
      { role: "Regulator", note: "View audit entries within your regulatory scope" },
    ],
  },
  {
    id: "institutions",
    section: "Administration",
    sectionIcon: Building2,
    title: "Institution Management",
    narration: "Navigate to 'Institutions' in the sidebar (Admin only). View and manage all registered financial institutions — their code, name, type (Commercial Bank, Microfinance, Development Finance), country, status, and contact details. Click '+ Add Institution' to register a new participating institution in the registry.",
    visual: "institutions",
  },
  {
    id: "users",
    section: "Administration",
    sectionIcon: Settings,
    title: "User Management & Roles",
    narration: "Go to 'User Management' (Admin only). Here you create and manage user accounts. Each user has a role: Administrator (full access), Regulator (oversight, audit, approvals), Lender (add/edit own institution data), or Viewer (read-only). Each user is linked to an institution. Password policies enforce complexity and 90-day expiry. Deactivated users lose access but their audit history is preserved.",
    visual: "users",
  },
  {
    id: "exchange-rates",
    section: "Administration",
    sectionIcon: DollarSign,
    title: "Exchange Rate Management",
    narration: "Under the Integrations section, find 'Exchange Rates' (Admin only). The system supports 42+ African currencies. View current exchange rates, update them manually, or let the system auto-sync every 6 hours. These rates are used when consolidating multi-currency exposure in credit reports and dashboard analytics.",
    visual: "exchange",
  },
  {
    id: "compliance",
    section: "Compliance",
    sectionIcon: Scale,
    title: "Regulatory Compliance Dashboard",
    narration: "Navigate to 'Regulatory Compliance' in the sidebar. This dashboard shows compliance metrics: data submission rates, dispute resolution SLA performance, consent coverage, and NPL ratios by jurisdiction. Traffic-light indicators show green (compliant), yellow (at risk), or red (non-compliant). Use this to monitor your institution's compliance posture across all jurisdictions.",
    visual: "compliance",
    roleNotes: [
      { role: "Administrator", note: "System-wide compliance metrics" },
      { role: "Regulator", note: "Metrics for your regulatory jurisdiction" },
    ],
  },
  {
    id: "helpdesk",
    section: "Support",
    sectionIcon: Headset,
    title: "Getting Help",
    narration: "Need assistance? Use the Helpdesk to submit support tickets, the Online Manual for searchable help articles, or the Documentation page for technical API documentation. You can also use the chatbot (the floating button in the bottom-right corner) to ask questions about the system, file disputes, or browse FAQs — all without leaving the page.",
    visual: "help",
  },
  {
    id: "end",
    section: "That's It!",
    sectionIcon: Globe,
    title: "You're Ready to Go",
    narration: "That covers all the key features of the Credit Registry System. Remember: the sidebar is your main navigation, the dashboard gives you real-time overview, and every action is logged for audit compliance. If you need help, use the chatbot, helpdesk, or online manual. You can replay this guide anytime from the sidebar under 'App Guide'.",
    visual: "end",
  },
];

const SLIDE_DURATION = 12000;

function VisualMockup({ type }: { type: string }) {
  const mockupClass = "rounded-xl border-2 border-border/50 overflow-hidden shadow-lg";
  
  switch (type) {
    case "hero":
      return (
        <div className={`${mockupClass} p-8 text-center`} style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
          <Globe className="w-16 h-16 text-white/80 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Pan-African Credit Registry</h3>
          <p className="text-white/60 mt-2 text-sm">Cross-Jurisdictional Central Data Hub v1.2</p>
          <div className="flex justify-center gap-6 mt-6">
            {[{ n: "54", l: "Countries" }, { n: "42+", l: "Currencies" }, { n: "100K+", l: "Borrowers" }].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "login":
      return (
        <div className={`${mockupClass} bg-background p-6`}>
          <div className="max-w-xs mx-auto space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl mx-auto mb-2" style={{ background: "linear-gradient(135deg, hsl(43 80% 55%), hsl(33 75% 48%))" }}>
                <Globe className="w-6 h-6 text-white m-3" />
              </div>
              <p className="font-bold text-sm">Credit Registry System</p>
            </div>
            <div><p className="text-[10px] text-muted-foreground mb-1">Username</p><div className="h-9 border rounded-md bg-muted/20 flex items-center px-3"><span className="text-xs text-muted-foreground">admin</span></div></div>
            <div><p className="text-[10px] text-muted-foreground mb-1">Password</p><div className="h-9 border rounded-md bg-muted/20 flex items-center px-3"><span className="text-xs text-muted-foreground">••••••••</span></div></div>
            <div className="h-9 bg-primary rounded-md flex items-center justify-center"><span className="text-xs text-primary-foreground font-medium">Sign In</span></div>
          </div>
        </div>
      );
    case "sidebar":
      return (
        <div className={`${mockupClass} bg-background flex`}>
          <div className="w-48 border-r p-3 space-y-1 shrink-0" style={{ background: "hsl(var(--sidebar-background, var(--background)))" }}>
            <div className="flex items-center gap-2 p-2 mb-3">
              <div className="w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, hsl(43 80% 55%), hsl(33 75% 48%))" }} />
              <span className="text-xs font-bold">Credit Registry</span>
            </div>
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: Users, label: "Borrowers" },
              { icon: CreditCard, label: "Credit Accounts" },
              { icon: Search, label: "Global Search" },
              { icon: Upload, label: "Batch Upload" },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] ${item.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            ))}
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider px-2.5 pt-2">Reports & Compliance</p>
            {[
              { icon: FileText, label: "Credit Reports" },
              { icon: AlertCircle, label: "Disputes" },
              { icon: CheckSquare, label: "Approvals" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-muted-foreground">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <ArrowRight className="w-6 h-6 text-primary/30 mx-auto animate-pulse" />
              <p className="text-xs text-muted-foreground mt-2">Click any item to navigate</p>
            </div>
          </div>
        </div>
      );
    case "dashboard":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total Borrowers", value: "2,847", color: "border-l-4 border-l-blue-400" },
              { label: "Credit Accounts", value: "4,312", color: "border-l-4 border-l-teal-400" },
              { label: "Active Disputes", value: "23", color: "border-l-4 border-l-amber-400" },
              { label: "Pending Approvals", value: "15", color: "border-l-4 border-l-purple-400" },
            ].map(c => (
              <div key={c.label} className={`rounded-lg p-3 border shadow-sm ${c.color}`}>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="text-xl font-black mt-1">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 border rounded-lg p-3 h-24">
              <p className="text-[9px] font-semibold text-muted-foreground mb-2">Portfolio Growth</p>
              <div className="flex items-end gap-0.5 h-14">
                {[30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-3 h-24 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-green-400 border-r-amber-400 border-b-red-400" />
            </div>
          </div>
        </div>
      );
    case "charts":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <p className="text-[9px] font-semibold text-muted-foreground mb-2">12-Month Portfolio Trend</p>
              <div className="flex items-end gap-0.5 h-20">
                {[25, 30, 35, 32, 40, 45, 42, 50, 55, 52, 60, 65].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t relative" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 bg-primary/15 rounded-t" />
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/30 rounded-t" style={{ height: `${h * 0.6}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[7px] text-muted-foreground">Mar '25</span>
                <span className="text-[7px] text-muted-foreground">Feb '26</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <p className="text-[9px] font-semibold text-muted-foreground mb-2">Account Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-[5px] border-green-400 border-r-amber-400 border-b-red-400 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[8px]">Current 72%</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[8px]">Delinquent 18%</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[8px]">Default 10%</span></div>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[9px] font-semibold text-muted-foreground mb-2">Loan Types</p>
                <div className="space-y-1">
                  {[{ l: "Term Loan", w: "80%" }, { l: "Overdraft", w: "55%" }, { l: "Mortgage", w: "35%" }].map(b => (
                    <div key={b.l} className="flex items-center gap-2">
                      <span className="text-[8px] w-14 text-muted-foreground">{b.l}</span>
                      <div className="flex-1 h-2.5 bg-muted rounded-full"><div className="h-full bg-primary/40 rounded-full" style={{ width: b.w }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case "map":
      return (
        <div className={`${mockupClass} bg-background p-4`}>
          <p className="text-[9px] font-semibold text-muted-foreground mb-3">Africa Coverage — 54 Countries</p>
          <div className="flex items-center justify-center gap-6">
            <div className="relative">
              <Globe className="w-28 h-28 text-primary/15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg p-2.5 border min-w-[140px]">
                <p className="text-[9px] font-semibold">🇰🇪 Kenya</p>
                <p className="text-[8px] text-muted-foreground">328 borrowers · 512 accounts</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 border">
                <p className="text-[9px] font-semibold">🇳🇬 Nigeria</p>
                <p className="text-[8px] text-muted-foreground">456 borrowers · 789 accounts</p>
              </div>
              <div className="flex items-center gap-1.5 px-1">
                {[
                  { c: "bg-primary/80", l: "High" },
                  { c: "bg-primary/40", l: "Med" },
                  { c: "bg-primary/10", l: "Low" },
                ].map(l => (
                  <div key={l.l} className="flex items-center gap-0.5">
                    <div className={`w-3 h-2 rounded-sm ${l.c}`} />
                    <span className="text-[7px] text-muted-foreground">{l.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case "table-borrowers":
      return (
        <div className={`${mockupClass} bg-background`}>
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Borrowers</span></div>
            <div className="h-7 px-3 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground font-medium">+ Add Borrower</span></div>
          </div>
          <div className="p-3"><div className="h-8 border rounded-md bg-muted/20 flex items-center px-3"><Search className="w-3 h-3 text-muted-foreground mr-2" /><span className="text-[10px] text-muted-foreground">Search borrowers...</span></div></div>
          <table className="w-full text-[10px]">
            <thead><tr className="bg-muted/50 text-muted-foreground"><th className="px-3 py-1.5 text-left">Name</th><th className="px-3 py-1.5 text-left">Type</th><th className="px-3 py-1.5 text-left">National ID</th><th className="px-3 py-1.5 text-left">Country</th><th className="px-3 py-1.5 text-left">Status</th></tr></thead>
            <tbody>
              {[
                { name: "Amara Osei", type: "Individual", id: "GHA-29384756", country: "🇬🇭 Ghana", status: "Active" },
                { name: "Safaricom Holdings", type: "Corporate", id: "KEN-87654321", country: "🇰🇪 Kenya", status: "Active" },
                { name: "Fatima El-Rashid", type: "Individual", id: "EGY-11223344", country: "🇪🇬 Egypt", status: "Under Review" },
              ].map((r, i) => (
                <tr key={i} className="border-t"><td className="px-3 py-2 font-medium">{r.name}</td><td className="px-3 py-2">{r.type}</td><td className="px-3 py-2 font-mono text-[9px]">{r.id}</td><td className="px-3 py-2">{r.country}</td><td className="px-3 py-2"><Badge variant={r.status === "Active" ? "default" : "secondary"} className="text-[8px]">{r.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "form-borrower":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Add New Borrower</span></div>
          <div className="flex gap-2 mb-2">
            <div className="h-8 px-4 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground">Individual</span></div>
            <div className="h-8 px-4 border rounded-md flex items-center"><span className="text-[10px] text-muted-foreground">Corporate</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["First Name *", "Last Name *", "National ID *", "Date of Birth", "Country *", "Phone", "Email", "Employer"].map(f => (
              <div key={f}><p className="text-[9px] text-muted-foreground mb-1">{f}</p><div className="h-8 border rounded-md bg-muted/10" /></div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <div className="h-8 px-4 border rounded-md flex items-center"><span className="text-[10px]">Cancel</span></div>
            <div className="h-8 px-4 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground">Submit for Approval</span></div>
          </div>
        </div>
      );
    case "detail-borrower":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm font-bold">Amara Osei</p><p className="text-[10px] text-muted-foreground">Individual · GHA-29384756 · 🇬🇭 Ghana</p></div>
            <div className="ml-auto h-8 px-3 bg-primary rounded-md flex items-center"><FileText className="w-3 h-3 text-primary-foreground mr-1.5" /><span className="text-[10px] text-primary-foreground">Generate Credit Report</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ l: "Credit Score", v: "720", c: "text-green-600" }, { l: "Total Accounts", v: "3" }, { l: "Outstanding", v: "GHS 125,000" }].map(c => (
              <div key={c.l} className="border rounded-lg p-2.5 text-center"><p className="text-[8px] text-muted-foreground">{c.l}</p><p className={`text-base font-bold ${c.c || ""}`}>{c.v}</p></div>
            ))}
          </div>
          <div className="border rounded-lg p-2.5"><p className="text-[9px] font-semibold mb-1.5">Credit Accounts</p><div className="space-y-1">{["Term Loan — GHS 50,000 — Current", "Overdraft — GHS 75,000 — Current"].map(a => <div key={a} className="text-[9px] text-muted-foreground py-1 border-b last:border-0">{a}</div>)}</div></div>
        </div>
      );
    case "table-accounts":
      return (
        <div className={`${mockupClass} bg-background`}>
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Credit Accounts</span></div>
            <div className="h-7 px-3 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground font-medium">+ Add Account</span></div>
          </div>
          <table className="w-full text-[10px]">
            <thead><tr className="bg-muted/50 text-muted-foreground"><th className="px-3 py-1.5 text-left">Account #</th><th className="px-3 py-1.5 text-left">Borrower</th><th className="px-3 py-1.5 text-left">Type</th><th className="px-3 py-1.5 text-right">Balance</th><th className="px-3 py-1.5 text-left">Status</th></tr></thead>
            <tbody>
              {[
                { acc: "TL-2024-001", name: "Amara Osei", type: "Term Loan", bal: "GHS 50,000", s: "Current" },
                { acc: "OD-2024-015", name: "Safaricom", type: "Overdraft", bal: "KES 2.5M", s: "Current" },
                { acc: "MG-2024-008", name: "F. El-Rashid", type: "Mortgage", bal: "EGP 850K", s: "Delinquent" },
              ].map((r, i) => (
                <tr key={i} className="border-t"><td className="px-3 py-2 font-mono">{r.acc}</td><td className="px-3 py-2">{r.name}</td><td className="px-3 py-2">{r.type}</td><td className="px-3 py-2 text-right font-medium">{r.bal}</td><td className="px-3 py-2"><Badge variant={r.s === "Current" ? "default" : "destructive"} className="text-[8px]">{r.s}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "search":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-2"><Search className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Global Search</span></div>
          <div className="h-10 border-2 border-primary/30 rounded-lg bg-muted/10 flex items-center px-3"><Search className="w-4 h-4 text-muted-foreground mr-2" /><span className="text-xs">Amara</span><span className="text-xs text-muted-foreground animate-pulse">|</span></div>
          <div className="space-y-1.5">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Borrowers</p>
            {[{ n: "Amara Osei", d: "Individual · GHA-29384756 · Ghana" }, { n: "Amara Diallo", d: "Individual · SEN-55667788 · Senegal" }].map(r => (
              <div key={r.n} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/10">
                <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                <div><p className="text-[10px] font-medium">{r.n}</p><p className="text-[8px] text-muted-foreground">{r.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      );
    case "report":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="p-3 rounded-lg text-white" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 45% 22%))" }}>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /><span className="text-[11px] font-bold">Comprehensive Credit Information Report</span></div>
            <p className="text-[8px] text-white/50 mt-0.5">Serial: CR-2026-AXBK7F</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[{ l: "Bureau Score", v: "720", c: "text-green-600 dark:text-green-400" }, { l: "Facilities", v: "3" }, { l: "Outstanding", v: "GHS 125K" }, { l: "Risk Items", v: "0", c: "text-green-600 dark:text-green-400" }].map(c => (
              <div key={c.l} className="border rounded-lg p-2 text-center"><p className="text-[7px] text-muted-foreground uppercase">{c.l}</p><p className={`text-sm font-black ${c.c || ""}`}>{c.v}</p></div>
            ))}
          </div>
          <div className="space-y-1 text-[9px]">
            {["1. Credit Profile Overview (11 indicators)", "2. Classification by Institution", "3. Liability Summary with Aging Buckets", "4. Facility Details + 24-Month Payment Grid"].map(s => (
              <div key={s} className="flex items-center gap-1.5 text-muted-foreground"><ChevronRight className="w-3 h-3 text-primary shrink-0" />{s}</div>
            ))}
          </div>
        </div>
      );
    case "upload":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Batch Upload</span></div>
          <div className="flex gap-2">
            <div className="h-8 px-4 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground">Borrowers</span></div>
            <div className="h-8 px-4 border rounded-md flex items-center"><span className="text-[10px] text-muted-foreground">Credit Accounts</span></div>
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-[10px] text-muted-foreground mt-2">Drop your CSV file here or click to browse</p>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>
            <span className="text-[10px] text-green-700 dark:text-green-300">245 of 250 records imported successfully</span>
          </div>
        </div>
      );
    case "disputes":
      return (
        <div className={`${mockupClass} bg-background`}>
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Disputes</span></div>
            <div className="h-7 px-3 bg-primary rounded-md flex items-center"><span className="text-[10px] text-primary-foreground">+ New Dispute</span></div>
          </div>
          <div className="divide-y">
            {[
              { id: "DSP-001", status: "Open", priority: "High", sla: "2 days left", color: "text-amber-600" },
              { id: "DSP-002", status: "Under Investigation", priority: "Medium", sla: "5 days left", color: "text-blue-600" },
              { id: "DSP-003", status: "Resolved", priority: "Low", sla: "Completed", color: "text-green-600" },
            ].map(d => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2 text-[10px]">
                <span className="font-mono text-muted-foreground">{d.id}</span>
                <Badge variant={d.status === "Resolved" ? "default" : "secondary"} className="text-[8px]">{d.status}</Badge>
                <span className="text-muted-foreground ml-auto">{d.priority}</span>
                <span className={`text-[9px] font-medium ${d.color}`}>{d.sla}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "approval":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-2`}>
          <div className="flex items-center gap-2 mb-1"><CheckSquare className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Pending Approvals</span></div>
          {[
            { user: "cbe_user", action: "New Borrower: Tadesse Bekele", time: "2 hours ago" },
            { user: "dashen_user", action: "Modified Account: OD-2024-015", time: "5 hours ago" },
          ].map(a => (
            <div key={a.action} className="flex items-center gap-2 p-2.5 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-[10px] font-medium truncate">{a.action}</p><p className="text-[8px] text-muted-foreground">By {a.user} · {a.time}</p></div>
              <div className="flex gap-1 shrink-0">
                <div className="h-7 px-2.5 bg-green-100 dark:bg-green-900/30 rounded text-[9px] flex items-center text-green-700 dark:text-green-300 font-medium">Approve</div>
                <div className="h-7 px-2.5 bg-red-100 dark:bg-red-900/30 rounded text-[9px] flex items-center text-red-700 dark:text-red-300 font-medium">Reject</div>
              </div>
            </div>
          ))}
        </div>
      );
    case "audit":
      return (
        <div className={`${mockupClass} bg-background`}>
          <div className="flex items-center gap-2 p-3 border-b"><Shield className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Audit Trail</span><Badge variant="outline" className="text-[8px] ml-auto">Tamper-Evident</Badge></div>
          <div className="divide-y text-[10px]">
            {[
              { time: "14:32:05", user: "admin", action: "GENERATE_REPORT", detail: "Credit report CR-2026-AXBK7F" },
              { time: "14:28:11", user: "cbe_user", action: "CREATE_BORROWER", detail: "New borrower: Tadesse B." },
              { time: "14:15:43", user: "admin", action: "APPROVE_CHANGE", detail: "Approved account OD-2024" },
            ].map(e => (
              <div key={e.time} className="flex items-center gap-3 px-3 py-2">
                <span className="font-mono text-muted-foreground text-[9px]">{e.time}</span>
                <span className="text-muted-foreground">{e.user}</span>
                <Badge variant="outline" className="text-[8px]">{e.action}</Badge>
                <span className="text-muted-foreground ml-auto truncate max-w-[150px]">{e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "institutions":
      return (
        <div className={`${mockupClass} bg-background`}>
          <div className="flex items-center gap-2 p-3 border-b"><Building2 className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Institutions</span></div>
          <div className="divide-y text-[10px]">
            {[
              { name: "Commercial Bank of Ethiopia", type: "Commercial Bank", country: "🇪🇹 Ethiopia" },
              { name: "Equity Bank Kenya", type: "Commercial Bank", country: "🇰🇪 Kenya" },
              { name: "First Bank Nigeria", type: "Commercial Bank", country: "🇳🇬 Nigeria" },
            ].map(i => (
              <div key={i.name} className="flex items-center gap-3 px-3 py-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{i.name}</span>
                <span className="text-muted-foreground ml-auto">{i.type}</span>
                <span>{i.country}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "users":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">User Management</span></div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: "Administrator", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300", desc: "Full access" },
              { role: "Regulator", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", desc: "Oversight + approvals" },
              { role: "Lender", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300", desc: "Own institution data" },
              { role: "Viewer", color: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300", desc: "Read-only access" },
            ].map(r => (
              <div key={r.role} className={`rounded-lg p-2.5 ${r.color}`}>
                <p className="text-[10px] font-semibold">{r.role}</p>
                <p className="text-[8px] opacity-75">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "exchange":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-2`}>
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Exchange Rates — 42+ Currencies</span></div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { pair: "USD/ETB", rate: "56.78" }, { pair: "USD/KES", rate: "153.25" }, { pair: "USD/NGN", rate: "1,560.00" },
              { pair: "USD/ZAR", rate: "18.42" }, { pair: "USD/EGP", rate: "30.95" }, { pair: "USD/GHS", rate: "14.85" },
            ].map(r => (
              <div key={r.pair} className="border rounded-lg p-2 text-center"><p className="text-[8px] text-muted-foreground">{r.pair}</p><p className="text-[11px] font-bold">{r.rate}</p></div>
            ))}
          </div>
        </div>
      );
    case "compliance":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-3`}>
          <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /><span className="text-xs font-semibold">Regulatory Compliance</span></div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Data Submission", v: "98%", c: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
              { l: "Dispute SLA", v: "95%", c: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
              { l: "Consent Coverage", v: "87%", c: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
            ].map(m => (
              <div key={m.l} className={`rounded-lg p-2.5 text-center ${m.c}`}><p className="text-[8px] opacity-70">{m.l}</p><p className="text-lg font-black">{m.v}</p></div>
            ))}
          </div>
        </div>
      );
    case "help":
      return (
        <div className={`${mockupClass} bg-background p-4 space-y-2`}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Headset, label: "Helpdesk", desc: "Submit support tickets" },
              { icon: BookOpen, label: "Online Manual", desc: "Searchable help articles" },
              { icon: FileText, label: "Documentation", desc: "Technical API docs" },
            ].map(h => (
              <div key={h.label} className="border rounded-lg p-3 text-center">
                <h.icon className="w-6 h-6 text-primary mx-auto mb-1.5" />
                <p className="text-[10px] font-semibold">{h.label}</p>
                <p className="text-[8px] text-muted-foreground">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 p-2 bg-primary/5 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="text-primary-foreground text-xs">💬</span></div>
            <div><p className="text-[10px] font-semibold">Chatbot Assistant</p><p className="text-[8px] text-muted-foreground">Click the floating button (bottom-right) anytime</p></div>
          </div>
        </div>
      );
    case "end":
      return (
        <div className={`${mockupClass} p-8 text-center`} style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">You're All Set!</h3>
          <p className="text-white/60 mt-2 text-sm max-w-sm mx-auto">Explore the system, add records, generate reports, and monitor compliance across all 54 African countries.</p>
          <p className="text-white/40 text-xs mt-4">Replay this guide anytime from the sidebar → App Guide</p>
        </div>
      );
    default:
      return (
        <div className={`${mockupClass} bg-muted/30 h-32 flex items-center justify-center`}>
          <Monitor className="w-10 h-10 text-muted-foreground/20" />
        </div>
      );
  }
}

export default function AppGuidePage() {
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;
  const slide = slides[currentSlide];

  const stopTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const startTimers = useCallback(() => {
    stopTimers();
    setProgress(0);
    const step = 50;
    const increments = SLIDE_DURATION / step;
    let count = 0;
    progressRef.current = setInterval(() => {
      count++;
      setProgress((count / increments) * 100);
    }, step);
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= totalSlides - 1) {
          setIsPlaying(false);
          stopTimers();
          return prev;
        }
        return prev + 1;
      });
    }, SLIDE_DURATION);
  }, [totalSlides, stopTimers]);

  useEffect(() => {
    if (isPlaying) {
      startTimers();
    } else {
      stopTimers();
    }
    return stopTimers;
  }, [isPlaying, currentSlide, startTimers, stopTimers]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setProgress(0);
    if (isPlaying) {
      startTimers();
    }
  };

  const togglePlay = () => {
    if (!isPlaying && currentSlide >= totalSlides - 1) {
      setCurrentSlide(0);
    }
    setIsPlaying(!isPlaying);
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
  };
  const prevSlide = () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  };
  const restart = () => {
    goToSlide(0);
    setIsPlaying(true);
  };

  const SectionIcon = slide.sectionIcon;

  return (
    <div className="h-full flex flex-col bg-background" data-testid="page-app-guide">
      <div className="w-full h-1 bg-muted shrink-0">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${((currentSlide + (isPlaying ? progress / 100 : 0)) / totalSlides) * 100}%` }}
          data-testid="guide-progress-bar"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <SectionIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{slide.section}</p>
                <h1 className="text-xl font-bold tracking-tight truncate" data-testid="text-guide-title">{slide.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={restart} data-testid="button-guide-restart">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prevSlide} disabled={currentSlide === 0} data-testid="button-guide-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="default" size="icon" className="h-9 w-9" onClick={togglePlay} data-testid="button-guide-play">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={nextSlide} disabled={currentSlide >= totalSlides - 1} data-testid="button-guide-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-2 tabular-nums" data-testid="text-guide-counter">
                {currentSlide + 1} / {totalSlides}
              </span>
            </div>
          </div>

          <div className="relative">
            <div
              key={slide.id}
              className="animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <VisualMockup type={slide.visual} />
            </div>
          </div>

          <div
            key={`narr-${slide.id}`}
            className="animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" data-testid="text-guide-narration">
                  {slide.narration}
                </p>

                {slide.roleNotes && slide.roleNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> What each role sees
                    </p>
                    {slide.roleNotes.map(rn => (
                      <div key={rn.role} className="flex items-start gap-2 text-xs">
                        <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">{rn.role}</Badge>
                        <span className="text-muted-foreground">{rn.note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.tips && slide.tips.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Tips
                    </p>
                    <ul className="space-y-1">
                      {slide.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-amber-700/80 dark:text-amber-300/80 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-1 justify-center flex-wrap" data-testid="guide-slide-dots">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? "w-8 bg-primary"
                    : idx < currentSlide
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/20"
                }`}
                data-testid={`guide-dot-${idx}`}
              />
            ))}
          </div>

          {currentSlide >= totalSlides - 1 && !isPlaying && (
            <div className="flex items-center justify-center gap-3 py-4 animate-in fade-in duration-500">
              <Button variant="outline" onClick={restart} data-testid="button-guide-replay">
                <RotateCcw className="w-4 h-4 mr-2" /> Replay Guide
              </Button>
              <Button onClick={() => navigate("/")} data-testid="button-guide-go-dashboard">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-2 flex items-center justify-between shrink-0 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${isPlaying ? progress : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isPlaying ? "Auto-advancing..." : currentSlide >= totalSlides - 1 ? "Walkthrough complete" : "Paused"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {Math.ceil(((totalSlides - currentSlide) * SLIDE_DURATION) / 60000)} min remaining
        </span>
      </div>
    </div>
  );
}
