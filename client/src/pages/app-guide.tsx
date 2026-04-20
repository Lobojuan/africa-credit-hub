import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, CreditCard, Search, FileText, Shield, Settings,
  CheckSquare, AlertCircle, Upload, Building2, Headset, Globe, DollarSign,
  Scale, ChevronRight, ChevronLeft, Play, Pause, RotateCcw,
  Monitor, MapPin, BookOpen, ArrowRight, Brain, Bell, Sparkles,
  Smartphone, Eye, Activity, UserCheck, BarChart3, Network, Lock, Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandColors, withAlpha } from "@/hooks/use-brand-colors";

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

function getSlides(t: (key: string, fallback: string) => string): Slide[] {
  return [
    {
      id: "welcome", section: t("appGuide.slides.welcome.section", "Welcome"), sectionIcon: Globe,
      title: t("appGuide.slides.welcome.title", "Welcome to the Credit Registry System"),
      narration: t("appGuide.slides.welcome.narration", "This walkthrough will guide you through every feature of the Pan-African Credit Registry System. The system covers all 54 African countries, supports 42+ currencies, and provides comprehensive credit information management across five languages — English, French, Portuguese, Arabic, and Swahili. Let's take a tour of what you'll find inside."),
      visual: "hero",
    },
    {
      id: "login", section: t("appGuide.slides.login.section", "Getting Started"), sectionIcon: Monitor,
      title: t("appGuide.slides.login.title", "Logging In"),
      narration: t("appGuide.slides.login.narration", "To get started, enter your username and password on the login page and click 'Sign In'. You can also sign in using Google, Microsoft, Apple, or Enterprise SSO via the social login buttons below the form. The system supports five user roles — Super Admin, Administrator, Regulator, Lender, and Viewer — each with different access levels. After login, you can enable Multi-Factor Authentication (MFA/TOTP) from your profile for extra security using any authenticator app."),
      visual: "login",
      tips: [
        t("appGuide.slides.login.tip0", "Passwords expire every 90 days for security"),
        t("appGuide.slides.login.tip1", "After 3 failed attempts, your account is temporarily locked"),
        t("appGuide.slides.login.tip2", "Enable MFA/TOTP from your profile for two-factor authentication"),
        t("appGuide.slides.login.tip3", "Social login supports Google, Microsoft, Apple, and Enterprise SSO"),
      ],
    },
    {
      id: "sidebar", section: t("appGuide.slides.sidebar.section", "Getting Started"), sectionIcon: Monitor,
      title: t("appGuide.slides.sidebar.title", "Navigating the Sidebar"),
      narration: t("appGuide.slides.sidebar.narration", "Once logged in, the sidebar on the left is your main navigation. It's organized into twelve sections: Overview (Dashboard, Portfolio Intelligence, Platform Metrics), Credit Data (Consumers, Businesses, Credit Accounts, Credit Search, Institutions), Reports & Scoring (Credit Reports, Score Methodology, AI Reports), Data Management (Batch Upload, Data Quality, Exchange Rates), Workflows (Disputes, Pending Approvals, Consent, Helpdesk, Alerts, Collections), Intelligence (AI Command Center, Telco Scoring & Lending, Find Connections), Oversight & Compliance (Regulatory Dashboard, Audit Trail, Compliance Queue, BOG/BSL Export), Cross-Border (Agreements, Cross-Border Search, PAPSS Settlements), Administration (Command Center, Organizations, Users, Billing, Webhooks, Retention), API & Integrations (API Keys, API Docs, Webhook Management), Infrastructure (System Status, Backup, Security), and Help & Resources (App Guide, Documentation, Ghana Docs, Helpdesk). Items you don't have access to are automatically hidden based on your role."),
      visual: "sidebar", highlight: "sidebar",
    },
    {
      id: "dashboard-overview", section: t("appGuide.slides.dashboardOverview.section", "Dashboard"), sectionIcon: LayoutDashboard,
      title: t("appGuide.slides.dashboardOverview.title", "Your Dashboard — The Command Center"),
      narration: t("appGuide.slides.dashboardOverview.narration", "The Dashboard is your landing page after login. At the top, summary cards show you the key numbers at a glance: Total Borrowers, Total Credit Accounts, Active Disputes, and Pending Approvals. Each card includes a sparkline mini-chart showing 7-day trends below the stat number. These update in real time as data flows into the system. Look for the notification bell in the header area — it shows a red badge with your unread notification count."),
      visual: "dashboard",
      roleNotes: [
        { role: t("appGuide.slides.dashboardOverview.role0Role", "Super Admin"), note: t("appGuide.slides.dashboardOverview.role0Note", "You see data across ALL countries and institutions") },
        { role: t("appGuide.slides.dashboardOverview.role1Role", "Administrator"), note: t("appGuide.slides.dashboardOverview.role1Note", "You see data across all institutions in your country") },
        { role: t("appGuide.slides.dashboardOverview.role2Role", "Lender"), note: t("appGuide.slides.dashboardOverview.role2Note", "Numbers reflect only YOUR institution's data") },
        { role: t("appGuide.slides.dashboardOverview.role3Role", "Regulator"), note: t("appGuide.slides.dashboardOverview.role3Note", "You see data within your regulatory jurisdiction") },
      ],
    },
    {
      id: "dashboard-charts", section: t("appGuide.slides.dashboardCharts.section", "Dashboard"), sectionIcon: LayoutDashboard,
      title: t("appGuide.slides.dashboardCharts.title", "Portfolio Growth & Analytics Charts"),
      narration: t("appGuide.slides.dashboardCharts.narration", "Below the summary cards, interactive charts appear. The area chart shows 12 months of portfolio growth. A donut chart breaks down accounts by status (Current, Delinquent, Default) and a horizontal bar chart shows distribution by loan type. Hover over any element for detailed tooltips."),
      visual: "charts",
      tips: [
        t("appGuide.slides.dashboardCharts.tip0", "Charts are interactive — hover for detailed tooltips"),
        t("appGuide.slides.dashboardCharts.tip1", "Colors automatically adjust in dark mode"),
        t("appGuide.slides.dashboardCharts.tip2", "Charts resize responsively on smaller screens"),
      ],
    },
    {
      id: "dashboard-map", section: t("appGuide.slides.dashboardMap.section", "Dashboard"), sectionIcon: LayoutDashboard,
      title: t("appGuide.slides.dashboardMap.title", "Africa Coverage Map"),
      narration: t("appGuide.slides.dashboardMap.narration", "The interactive map shows all 54 African countries color-coded by activity level. Darker shading means more borrowers registered. Hover over any country to see a tooltip with the country name, borrower count, and account count."),
      visual: "map",
    },
    {
      id: "consumer-portal", section: t("appGuide.slides.consumerPortal.section", "Consumer Portal"), sectionIcon: UserCheck,
      title: t("appGuide.slides.consumerPortal.title", "Consumer Self-Service Portal"),
      narration: t("appGuide.slides.consumerPortal.narration", "The Consumer Portal at '/my-credit' lets individuals check their own credit standing. Consumers can register via '/consumer/register' with their national ID and personal details. Once registered, they can view their credit score, credit accounts, dispute history, and consent records — all without needing a system login. This self-service portal supports all five platform languages."),
      visual: "consumer-portal",
      tips: [
        t("appGuide.slides.consumerPortal.tip0", "Consumers register directly — no admin setup needed"),
        t("appGuide.slides.consumerPortal.tip1", "The portal shows a read-only view of their credit data"),
        t("appGuide.slides.consumerPortal.tip2", "Consumers can file disputes directly from the portal"),
      ],
    },
    {
      id: "borrowers-list", section: t("appGuide.slides.borrowersList.section", "Borrowers"), sectionIcon: Users,
      title: t("appGuide.slides.borrowersList.title", "Consumers & Businesses"),
      narration: t("appGuide.slides.borrowersList.narration", "The system separates borrowers into Consumers (individuals) and Businesses (corporates). Click 'Consumers' or 'Businesses' in the sidebar to see dedicated list views with columns for Name, National ID, Country, Status, and Risk Level. Super Admins also see a combined 'Borrowers (All)' view. Use the search bar to filter by name, ID, phone, or email."),
      visual: "table-borrowers",
      roleNotes: [
        { role: t("appGuide.slides.borrowersList.role0Role", "Administrator"), note: t("appGuide.slides.borrowersList.role0Note", "You see ALL borrowers across all institutions") },
        { role: t("appGuide.slides.borrowersList.role1Role", "Lender"), note: t("appGuide.slides.borrowersList.role1Note", "You see borrowers associated with YOUR institution only") },
        { role: t("appGuide.slides.borrowersList.role2Role", "Viewer"), note: t("appGuide.slides.borrowersList.role2Note", "Read-only access — no Add or Edit buttons") },
      ],
    },
    {
      id: "borrowers-add", section: t("appGuide.slides.borrowersAdd.section", "Borrowers"), sectionIcon: Users,
      title: t("appGuide.slides.borrowersAdd.title", "Adding a New Borrower"),
      narration: t("appGuide.slides.borrowersAdd.narration", "Click 'Register Borrower' to open the registration form. Select Individual or Corporate, then fill in the required fields including national ID, contact details, employer, and education level. After submitting, the record enters the maker-checker approval queue — another authorized user must approve it before it becomes active. A pending-approval amber banner appears on records awaiting review."),
      visual: "form-borrower",
      tips: [
        t("appGuide.slides.borrowersAdd.tip0", "National ID must be unique within a country"),
        t("appGuide.slides.borrowersAdd.tip1", "Set the PEP flag for Politically Exposed Persons"),
        t("appGuide.slides.borrowersAdd.tip2", "Select the correct country — it determines the jurisdiction"),
      ],
    },
    {
      id: "borrower-detail", section: t("appGuide.slides.borrowerDetail.section", "Borrowers"), sectionIcon: Users,
      title: t("appGuide.slides.borrowerDetail.title", "Borrower Detail Page"),
      narration: t("appGuide.slides.borrowerDetail.narration", "Click any borrower row to open their full profile. See all linked credit accounts, payment history, credit inquiries, court judgments, and consent records. Generate a comprehensive credit report by clicking the 'Generate Credit Report' button. You'll also find the purple-gradient 'AI Risk Analysis' button — click it to get an AI-powered risk assessment with a risk score, key risk factors, actionable recommendations, and regulatory flags."),
      visual: "detail-borrower",
    },
    {
      id: "credit-accounts", section: t("appGuide.slides.creditAccounts.section", "Credit Accounts"), sectionIcon: CreditCard,
      title: t("appGuide.slides.creditAccounts.title", "Managing Credit Accounts"),
      narration: t("appGuide.slides.creditAccounts.narration", "Navigate to 'Credit Accounts' in the sidebar. The table shows all credit facilities: Account Number, Borrower, Institution, Type, Status, Currency, Amount, and Days in Arrears. Click '+ Add Account' to record a new facility. The system supports 42+ African currencies with automatic exchange rate conversion."),
      visual: "table-accounts",
      tips: [
        t("appGuide.slides.creditAccounts.tip0", "For Islamic finance, check the 'Interest-Free' checkbox"),
        t("appGuide.slides.creditAccounts.tip1", "Days in Arrears should reflect the latest reporting date"),
        t("appGuide.slides.creditAccounts.tip2", "Supports 42+ currencies including ETB, GHS, NGN, KES, ZAR, XOF, and more"),
      ],
    },
    {
      id: "search", section: t("appGuide.slides.search.section", "Credit Search"), sectionIcon: Search,
      title: t("appGuide.slides.search.title", "Structured Credit Search"),
      narration: t("appGuide.slides.search.narration", "Click 'Credit Search' in the sidebar. The search page has four structured tabs — Consumer, Business, Telco, and General. The Consumer tab searches by name, national ID, or phone. The Business tab searches by company name, registration number, or TIN. The Telco tab searches telco subscriber profiles by provider, MSISDN, or account ID. The General tab performs a broad cross-entity search. Each tab returns detailed results with direct links to reports."),
      visual: "search",
      tips: [
        t("appGuide.slides.search.tip0", "Use the tab that matches your search type for best results"),
        t("appGuide.slides.search.tip1", "Partial matching is supported — no need to type the full name"),
        t("appGuide.slides.search.tip2", "All searches are logged in the audit trail for compliance"),
      ],
    },
    {
      id: "credit-report", section: t("appGuide.slides.creditReport.section", "Credit Reports"), sectionIcon: FileText,
      title: t("appGuide.slides.creditReport.title", "Generating Credit Reports"),
      narration: t("appGuide.slides.creditReport.narration", "From a borrower's detail page, click 'Generate Credit Report'. The system produces a comprehensive D&B-style report with a Credit Profile Overview, liability breakdown, aging analysis, credit exposure, and detailed facility cards with 24-month payment history grids. Use the 'AI Summary' button to generate a plain-language overview. When downloading as PDF, choose from all five languages — English, French, Portuguese, Arabic, or Swahili — using the language selector. Business borrowers get a separate Business Credit Report format."),
      visual: "report",
      tips: [
        t("appGuide.slides.creditReport.tip0", "Each report gets a unique serial number for audit tracking"),
        t("appGuide.slides.creditReport.tip1", "Bureau Score ranges from 300 to 850 with grade and factor analysis"),
        t("appGuide.slides.creditReport.tip2", "Every report generation is logged in the audit trail"),
        t("appGuide.slides.creditReport.tip3", "PDF reports are available in EN, FR, PT, AR, and SW"),
      ],
    },
    {
      id: "score-methodology", section: t("appGuide.slides.scoreMethodology.section", "Credit Reports"), sectionIcon: BarChart3,
      title: t("appGuide.slides.scoreMethodology.title", "Score Methodology"),
      narration: t("appGuide.slides.scoreMethodology.narration", "Navigate to 'Score Methodology' in the sidebar to understand how credit scores are calculated. The page explains the 300–850 scoring model, the weight of each factor (payment history, credit utilization, length of credit, credit mix, and new inquiries), grade bands (Excellent, Good, Fair, Poor, Very Poor), and how reason codes are assigned. A public Score Guide is also available at '/score-guide' for external stakeholders."),
      visual: "score-methodology",
    },
    {
      id: "telco", section: t("appGuide.slides.telco.section", "Telco"), sectionIcon: Smartphone,
      title: t("appGuide.slides.telco.title", "Telco Scoring & Lending"),
      narration: t("appGuide.slides.telco.narration", "The Telco module brings mobile network data into credit decisioning. 'Telco Scoring' lets you view and score telco subscriber profiles — airtime usage, mobile money transactions, top-up frequency, and data consumption — to generate alternative credit scores for the unbanked. 'Telco Lending' manages micro-loans originated through telco channels with automated decisioning based on telco scores. Search telco profiles by provider, MSISDN, or account ID."),
      visual: "telco",
      tips: [
        t("appGuide.slides.telco.tip0", "Telco scores complement traditional bureau scores"),
        t("appGuide.slides.telco.tip1", "Supports major African mobile networks and mobile money providers"),
        t("appGuide.slides.telco.tip2", "Search allows empty filters to browse all telco profiles"),
      ],
    },
    {
      id: "batch-upload", section: t("appGuide.slides.batchUpload.section", "Operations"), sectionIcon: Upload,
      title: t("appGuide.slides.batchUpload.title", "Uploading Records in Bulk"),
      narration: t("appGuide.slides.batchUpload.narration", "Click 'Batch Upload' in the sidebar. Select Borrowers or Credit Accounts, then choose your CSV or JSON file. Download the template first for the required column format. The system validates every row and shows a summary of successful imports and errors. You can also paste JSON data directly."),
      visual: "upload",
      tips: [
        t("appGuide.slides.batchUpload.tip0", "Date format must be YYYY-MM-DD"),
        t("appGuide.slides.batchUpload.tip1", "Currency codes must be valid ISO 4217 (ETB, KES, NGN, etc.)"),
        t("appGuide.slides.batchUpload.tip2", "Maximum file size is 10MB per upload"),
      ],
    },
    {
      id: "disputes", section: t("appGuide.slides.disputes.section", "Operations"), sectionIcon: AlertCircle,
      title: t("appGuide.slides.disputes.title", "Managing Disputes"),
      narration: t("appGuide.slides.disputes.narration", "Navigate to 'Disputes' in the sidebar. View all dispute cases with their status, priority, and SLA deadline. File a new dispute by selecting the borrower, disputed record, dispute type, and description. Financial corrections have a 2-day SLA, non-financial corrections have a 5-day SLA. Disputes approaching their deadline are highlighted in red. Breached SLAs appear in regulatory reports."),
      visual: "disputes",
    },
    {
      id: "approvals", section: t("appGuide.slides.approvals.section", "Operations"), sectionIcon: CheckSquare,
      title: t("appGuide.slides.approvals.title", "Maker-Checker Approvals"),
      narration: t("appGuide.slides.approvals.narration", "Go to 'Pending Approvals'. When any user creates or modifies a record, the change enters this queue. Click to see full before/after details. Click 'Approve' to apply or 'Reject' with a reason. Important: you cannot approve your own submissions. Only Admin, Regulator, and Super Admin roles can approve or reject changes."),
      visual: "approval",
      tips: [
        t("appGuide.slides.approvals.tip0", "You cannot approve your own submissions"),
        t("appGuide.slides.approvals.tip1", "All approval actions are logged in the audit trail"),
      ],
    },
    {
      id: "borrower-alerts", section: t("appGuide.slides.borrowerAlerts.section", "Operations"), sectionIcon: Bell,
      title: t("appGuide.slides.borrowerAlerts.title", "Borrower Alerts"),
      narration: t("appGuide.slides.borrowerAlerts.narration", "Navigate to 'Borrower Alerts' in the sidebar. This page shows system-generated alerts for significant borrower events — new delinquencies, status changes, large balance movements, PEP flag changes, and SLA breaches. Alerts are color-coded by severity and can be filtered by type, date range, or institution."),
      visual: "borrower-alerts",
    },
    {
      id: "audit", section: t("appGuide.slides.audit.section", "Oversight"), sectionIcon: Shield,
      title: t("appGuide.slides.audit.title", "Tamper-Evident Audit Trail"),
      narration: t("appGuide.slides.audit.narration", "Click 'Audit Trail' to see every action: record creations, modifications, report generations, login attempts, and approvals. Each entry shows Timestamp, User, Action, Entity, and Details. The audit log uses SHA-256 hash chaining — entries cannot be tampered with. Toggle between table and timeline views, use date range filters to narrow results, and export filtered records as CSV or Excel using the export buttons."),
      visual: "audit",
    },
    {
      id: "regulatory-dashboard", section: t("appGuide.slides.regulatoryDashboard.section", "Oversight"), sectionIcon: Eye,
      title: t("appGuide.slides.regulatoryDashboard.title", "Regulatory Dashboard"),
      narration: t("appGuide.slides.regulatoryDashboard.narration", "Navigate to 'Regulatory Dashboard' for a high-level supervisory overview. See NPL ratios across institutions, data submission compliance rates, dispute resolution performance, and sector exposure breakdowns. This dashboard is designed for regulators and senior management who need a panoramic view of credit market health across jurisdictions."),
      visual: "regulatory-dashboard",
      roleNotes: [
        { role: t("appGuide.slides.regulatoryDashboard.role0Role", "Regulator"), note: t("appGuide.slides.regulatoryDashboard.role0Note", "Primary view for regulatory oversight") },
        { role: t("appGuide.slides.regulatoryDashboard.role1Role", "Administrator"), note: t("appGuide.slides.regulatoryDashboard.role1Note", "Full access to all regulatory metrics") },
      ],
    },
    {
      id: "compliance", section: t("appGuide.slides.compliance.section", "Oversight"), sectionIcon: Scale,
      title: t("appGuide.slides.compliance.title", "Regulatory Compliance"),
      narration: t("appGuide.slides.compliance.narration", "Navigate to 'Regulatory Compliance'. This dashboard shows compliance metrics: data submission rates, dispute resolution SLA performance, consent coverage, and NPL ratios. Traffic-light indicators show green (compliant), yellow (at risk), or red (non-compliant). Use the 'Generate AI Compliance Report' button with the country selector to produce an AI-powered compliance assessment for any of the 54 African jurisdictions."),
      visual: "compliance",
    },
    {
      id: "bog-bsl-export", section: t("appGuide.slides.bogBslExport.section", "Oversight"), sectionIcon: FileText,
      title: t("appGuide.slides.bogBslExport.title", "Regulatory Export (BOG / BSL)"),
      narration: t("appGuide.slides.bogBslExport.narration", "Depending on your country mode, the sidebar shows either 'BOG Export' (Ghana — Bank of Ghana) or 'BSL Export' (Sierra Leone — Bank of Sierra Leone). These pages let you generate regulatory submission files in the format required by the central bank — batch upload data, borrower records, and credit accounts formatted per BoG CRB v1.1 or BSL standards."),
      visual: "bog-export",
    },
    {
      id: "cross-border", section: t("appGuide.slides.crossBorder.section", "Cross-Border"), sectionIcon: Network,
      title: t("appGuide.slides.crossBorder.title", "Cross-Border Features"),
      narration: t("appGuide.slides.crossBorder.narration", "The Cross-Border section enables pan-African data sharing. 'Agreements' manages bilateral and multilateral data-sharing agreements between countries. 'Cross-Border Search' lets authorized users search borrower records across jurisdictions for cross-border entity resolution. 'PAPSS Settlements' integrates with the Pan-African Payment and Settlement System for cross-border payment tracking and reconciliation."),
      visual: "cross-border",
      tips: [
        t("appGuide.slides.crossBorder.tip0", "Cross-border access requires a valid data-sharing agreement"),
        t("appGuide.slides.crossBorder.tip1", "PAPSS settlements track real-time cross-border payments"),
        t("appGuide.slides.crossBorder.tip2", "Access is controlled per user role and agreement scope"),
      ],
    },
    {
      id: "portfolio-intelligence", section: t("appGuide.slides.portfolioIntelligence.section", "AI Features"), sectionIcon: BarChart3,
      title: t("appGuide.slides.portfolioIntelligence.title", "Portfolio Intelligence"),
      narration: t("appGuide.slides.portfolioIntelligence.narration", "Navigate to 'Portfolio Intelligence' for AI-driven portfolio analytics. This page provides deep-dive analysis of your credit portfolio — concentration risk, sector exposure, geographic distribution, vintage analysis, and trend forecasting. AI-generated insights highlight emerging risks and opportunities across your book."),
      visual: "portfolio-intelligence",
      roleNotes: [
        { role: t("appGuide.slides.portfolioIntelligence.role0Role", "Administrator"), note: t("appGuide.slides.portfolioIntelligence.role0Note", "Full portfolio view across all institutions") },
      ],
    },
    {
      id: "ai-command-center", section: t("appGuide.slides.aiCommandCenter.section", "AI Features"), sectionIcon: Brain,
      title: t("appGuide.slides.aiCommandCenter.title", "AI Command Center"),
      narration: t("appGuide.slides.aiCommandCenter.narration", "The AI Command Center is your natural-language interface to the entire registry. Ask questions like 'Show me all defaulted borrowers in Ghana' or 'What is the NPL ratio for microfinance institutions?' The AI interprets your query, runs the appropriate analysis, and returns formatted results with charts and tables. It combines GPT-4o intelligence with real-time registry data."),
      visual: "ai-command-center",
    },
    {
      id: "ai-features", section: t("appGuide.slides.aiFeatures.section", "AI Features"), sectionIcon: Brain,
      title: t("appGuide.slides.aiFeatures.title", "AI-Powered Intelligence"),
      narration: t("appGuide.slides.aiFeatures.narration", "The platform integrates AI for intelligent analysis throughout. On any borrower's detail page, click the purple 'AI Risk Analysis' button to get a comprehensive risk assessment with score, risk factors, and recommendations. On credit reports, use 'AI Summary' for a plain-language overview. The floating chatbot (bottom-right) includes an AI Assistant mode for answering questions about credit data and regulations with streaming responses."),
      visual: "ai-features",
      tips: [
        t("appGuide.slides.aiFeatures.tip0", "AI analysis considers all borrower data including accounts, disputes, and payment history"),
        t("appGuide.slides.aiFeatures.tip1", "AI responses are generated fresh each time based on current data"),
        t("appGuide.slides.aiFeatures.tip2", "The AI chatbot supports streaming responses for real-time interaction"),
      ],
    },
    {
      id: "institutions", section: t("appGuide.slides.institutions.section", "Administration"), sectionIcon: Building2,
      title: t("appGuide.slides.institutions.title", "Institution Management"),
      narration: t("appGuide.slides.institutions.narration", "Navigate to 'Institutions' (Admin only). View and manage all registered financial institutions — their code, name, type (Bank, MFI, Utility, Telecom, Digital Lender, SACCO), country, status, and contact details. Click '+ Add Institution' to register a new participating institution. Newly registered institutions start with 'Pending' status and must be approved."),
      visual: "institutions",
    },
    {
      id: "users", section: t("appGuide.slides.users.section", "Administration"), sectionIcon: Settings,
      title: t("appGuide.slides.users.title", "User Management & Roles"),
      narration: t("appGuide.slides.users.narration", "Go to 'User Management' (Admin only). Create and manage user accounts with five roles: Super Admin (multi-country full access), Administrator (full access within country), Regulator (oversight and approvals), Lender (own institution data entry), or Viewer (read-only). Password policies enforce complexity and 90-day expiry. Accounts lock after 3 failed login attempts."),
      visual: "users",
    },
    {
      id: "command-center", section: t("appGuide.slides.commandCenter.section", "Administration"), sectionIcon: Server,
      title: t("appGuide.slides.commandCenter.title", "Command Center & Organizations"),
      narration: t("appGuide.slides.commandCenter.narration", "Super Admins have access to the 'Command Center' — a multi-country management console for overseeing all jurisdictions, switching country contexts, and managing system-wide settings. The 'Organizations' page manages top-level organizational entities that group institutions. These features are exclusive to the Super Admin role for centralized platform governance."),
      visual: "command-center",
      roleNotes: [
        { role: t("appGuide.slides.commandCenter.role0Role", "Super Admin"), note: t("appGuide.slides.commandCenter.role0Note", "Exclusive access — not visible to other roles") },
      ],
    },
    {
      id: "exchange-rates", section: t("appGuide.slides.exchangeRates.section", "Administration"), sectionIcon: DollarSign,
      title: t("appGuide.slides.exchangeRates.title", "Exchange Rate Management"),
      narration: t("appGuide.slides.exchangeRates.narration", "Under Administration, find 'Exchange Rates' (Admin only). The system supports 42+ African currencies. View current rates, update manually, or let the system auto-sync every 6 hours. These rates are used when consolidating multi-currency exposure in credit reports."),
      visual: "exchange",
    },
    {
      id: "system-admin", section: t("appGuide.slides.systemAdmin.section", "Administration"), sectionIcon: Activity,
      title: t("appGuide.slides.systemAdmin.title", "System Administration"),
      narration: t("appGuide.slides.systemAdmin.narration", "Several tools keep the platform running smoothly. 'System Status' shows real-time health of all services — database, API, background jobs, and integrations. 'Backup & Recovery' (Super Admin) manages database backups with restore capabilities. 'Webhook Management' configures outbound event notifications to external systems. 'Retention Policies' sets data retention rules per regulation. 'Platform Metrics' tracks system-wide usage statistics."),
      visual: "system-admin",
      tips: [
        t("appGuide.slides.systemAdmin.tip0", "System Status shows green/yellow/red health indicators"),
        t("appGuide.slides.systemAdmin.tip1", "Backups can be triggered manually or run on schedule"),
        t("appGuide.slides.systemAdmin.tip2", "Webhooks notify external systems of key events in real time"),
      ],
    },
    {
      id: "helpdesk", section: t("appGuide.slides.helpdesk.section", "Support"), sectionIcon: Headset,
      title: t("appGuide.slides.helpdesk.title", "Getting Help"),
      narration: t("appGuide.slides.helpdesk.narration", "Need assistance? Use the Helpdesk for support tickets, the Online Manual for searchable help articles, or the Documentation page for downloadable guides — 13 general documents plus 8 Ghana-specific documents, all available in five languages with PDF download. The floating chatbot (bottom-right) lets you ask questions, file disputes, or browse FAQs without leaving the page. Click the Sparkles icon in the chatbot to switch to AI Assistant mode."),
      visual: "help",
    },
    {
      id: "notifications", section: t("appGuide.slides.notifications.section", "Notifications"), sectionIcon: Bell,
      title: t("appGuide.slides.notifications.title", "Real-Time Notifications"),
      narration: t("appGuide.slides.notifications.narration", "The notification bell in the header keeps you informed of important events — new disputes, approval requests, system alerts, and more. A red badge shows your unread count. Click the bell to see recent notifications, click any notification to navigate to the relevant page, or mark them all as read."),
      visual: "notifications",
    },
    {
      id: "excel-export", section: t("appGuide.slides.excelExport.section", "Reports & Export"), sectionIcon: FileText,
      title: t("appGuide.slides.excelExport.title", "Excel & CSV Export"),
      narration: t("appGuide.slides.excelExport.narration", "On the Reports page, download portfolio data, borrower lists, or audit trail records in both CSV and Excel (XLSX) format. Excel files include formatted headers with teal styling. On the Audit Trail page, use the export buttons after applying date range filters to download just the filtered records."),
      visual: "export",
    },
    {
      id: "api-usage", section: t("appGuide.slides.apiUsage.section", "Administration"), sectionIcon: Building2,
      title: t("appGuide.slides.apiUsage.title", "API Usage Analytics"),
      narration: t("appGuide.slides.apiUsage.narration", "Administrators can monitor API usage from the 'API Administration' page. Switch to the 'API Usage Analytics' tab to see total requests today, requests this hour, and a breakdown of the most-called endpoints. A bar chart shows hourly request volume for the last 24 hours. The public API documentation is available at '/api-docs'."),
      visual: "api-usage",
      roleNotes: [
        { role: t("appGuide.slides.apiUsage.role0Role", "Administrator"), note: t("appGuide.slides.apiUsage.role0Note", "Only administrators and super admins can view API usage analytics") },
      ],
    },
    {
      id: "end", section: t("appGuide.slides.end.section", "That's It!"), sectionIcon: Globe,
      title: t("appGuide.slides.end.title", "You're Ready to Go"),
      narration: t("appGuide.slides.end.narration", "That covers all the key features — AI-powered risk analysis, AI Command Center, Portfolio Intelligence, Telco Scoring & Lending, Cross-Border data sharing, Consumer Self-Service Portal, multi-language support in five languages, real-time notifications, regulatory exports, and comprehensive system administration. The platform spans 54 African countries with 42+ currencies. Remember: the sidebar is your main navigation, the dashboard gives you real-time overview, and every action is logged for audit compliance. Replay this guide anytime from 'App Guide' in the sidebar."),
      visual: "end",
    },
  ];
}

const SLIDE_DURATION = 12000;

function GlowOrb({ className, color }: { className?: string; color: string }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} style={{ background: color }} />;
}

function VisualMockup({ type, isActive }: { type: string; isActive: boolean }) {
  const brandColors = useBrandColors();
  const base = `rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"}`;

  switch (type) {
    case "hero":
      return (
        <div className={`${base} relative`} style={{ background: brandColors.heroGradient }}>
          <GlowOrb className="w-64 h-64 -top-20 -right-20" color={brandColors.glowA} />
          <GlowOrb className="w-48 h-48 -bottom-10 -left-10" color={brandColors.glowB} />
          <div className="relative z-10 p-10 text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: brandColors.iconGradient, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Pan-African Credit Registry</h3>
            <p className="text-white/40 mt-2 text-sm font-medium tracking-wide">Cross-Jurisdictional Central Data Hub v2.5</p>
            <div className="flex justify-center gap-10 mt-8">
              {[{ n: "54", l: "Countries" }, { n: "42+", l: "Currencies" }, { n: "100K+", l: "Borrowers" }, { n: "5", l: "Languages" }].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-3xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>{s.n}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "login":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="p-8">
            <div className="max-w-[280px] mx-auto space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ background: brandColors.iconGradient }}>
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold text-sm">Credit Registry System</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sign in to continue</p>
              </div>
              <div><p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Username</p><div className="h-10 border rounded-lg bg-muted/30 flex items-center px-3 shadow-inner"><span className="text-xs text-muted-foreground">admin</span></div></div>
              <div><p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Password</p><div className="h-10 border rounded-lg bg-muted/30 flex items-center px-3 shadow-inner"><span className="text-xs text-muted-foreground tracking-widest">••••••••</span></div></div>
              <div className="h-10 rounded-lg flex items-center justify-center font-semibold text-sm text-white shadow-lg" style={{ background: brandColors.headerGradientSubtle }}>Sign In <ArrowRight className="w-4 h-4 ml-2" /></div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["Google", "Microsoft", "Apple", "Enterprise SSO"].map(p => (
                  <div key={p} className="h-8 border rounded-lg flex items-center justify-center text-[9px] text-muted-foreground hover:bg-muted/20 transition-colors">{p}</div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                <Lock className="w-3 h-3 text-purple-500 shrink-0" />
                <p className="text-[9px] text-muted-foreground">MFA/TOTP available after login</p>
              </div>
            </div>
          </div>
        </div>
      );
    case "sidebar":
      return (
        <div className={`${base} bg-card border border-border/50 flex`}>
          <div className="w-52 border-r p-4 space-y-1 shrink-0 bg-muted/30">
            <div className="flex items-center gap-2.5 p-2 mb-4">
              <div className="w-8 h-8 rounded-xl shadow-md" style={{ background: brandColors.iconGradient }} />
              <span className="text-xs font-bold tracking-tight">Credit Registry</span>
            </div>
            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-[0.2em] px-3 pb-1">Global View</p>
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: BarChart3, label: "Portfolio Intelligence" },
              { icon: Brain, label: "AI Command Center" },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors ${item.active ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}>
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
            ))}
            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-[0.2em] px-3 pt-2 pb-1">Borrowers</p>
            {[
              { icon: Users, label: "Consumers" },
              { icon: Building2, label: "Businesses" },
              { icon: CreditCard, label: "Credit Accounts" },
              { icon: Search, label: "Credit Search" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground">
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
            ))}
            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-[0.2em] px-3 pt-2 pb-1">Operations</p>
            {[
              { icon: Upload, label: "Batch Upload" },
              { icon: AlertCircle, label: "Disputes" },
              { icon: CheckSquare, label: "Approvals" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground">
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
            ))}
            <p className="text-[8px] text-muted-foreground/50 uppercase tracking-[0.2em] px-3 pt-2 pb-1">Oversight</p>
            {[
              { icon: Eye, label: "Regulatory Dashboard" },
              { icon: Shield, label: "Audit Trail" },
              { icon: Globe, label: "Cross-Border" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground">
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
            ))}
          </div>
          <div className="flex-1 p-6 flex items-center justify-center bg-background/50">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ArrowRight className="w-5 h-5 text-primary/50" />
              </div>
              <p className="text-xs text-muted-foreground">Click any item to navigate</p>
              <p className="text-[10px] text-muted-foreground/50">Menu adapts to your role</p>
            </div>
          </div>
        </div>
      );
    case "dashboard":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-4`}>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Borrowers", value: "102,462", icon: Users, gradient: "from-blue-500 to-blue-600" },
              { label: "Credit Accounts", value: "172,359", icon: CreditCard, gradient: "from-teal-500 to-teal-600" },
              { label: "Active Disputes", value: "23", icon: AlertCircle, gradient: "from-amber-500 to-amber-600" },
              { label: "Pending Approvals", value: "15", icon: CheckSquare, gradient: "from-purple-500 to-purple-600" },
            ].map(c => (
              <div key={c.label} className="relative rounded-xl p-4 border shadow-sm overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${c.gradient}`} />
                <c.icon className="w-4 h-4 text-muted-foreground/40 mb-2" />
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="text-xl font-black mt-1 tracking-tight">{c.value}</p>
                <div className="flex items-end gap-[2px] h-3 mt-1.5">
                  {[3, 5, 4, 6, 5, 7, 6].map((h, j) => (
                    <div key={j} className="flex-1 rounded-t-sm" style={{ height: `${h * 14}%`, background: `linear-gradient(to top, ${withAlpha(brandColors.accentLight, 0.5)}, ${withAlpha(brandColors.accentLight, 0.1)})` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 border rounded-xl p-4 h-28">
              <p className="text-[10px] font-semibold text-muted-foreground mb-3">Portfolio Growth — 12 Months</p>
              <div className="flex items-end gap-[3px] h-16">
                {[30, 35, 42, 38, 45, 52, 48, 55, 62, 58, 65, 72].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm relative" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 rounded-t-sm" style={{ background: `linear-gradient(to top, ${withAlpha(brandColors.accentLight, 0.6)}, ${withAlpha(brandColors.accentLight, 0.15)})` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-xl p-4 h-28 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full relative">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(142 70% 45%)" strokeWidth="4" strokeDasharray="63 88" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(45 90% 50%)" strokeWidth="4" strokeDasharray="16 88" strokeDashoffset="-63" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(0 70% 50%)" strokeWidth="4" strokeDasharray="9 88" strokeDashoffset="-79" />
                </svg>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">Account Status</p>
            </div>
          </div>
        </div>
      );
    case "charts":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-4`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-xl p-4">
              <p className="text-[10px] font-semibold text-muted-foreground mb-3">12-Month Portfolio Trend</p>
              <div className="flex items-end gap-[3px] h-24">
                {[25, 30, 38, 32, 42, 48, 44, 52, 58, 54, 62, 68].map((h, i) => (
                  <div key={i} className="flex-1 relative" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 rounded-t" style={{ background: `linear-gradient(to top, ${withAlpha(brandColors.accentLight, 0.5)}, ${withAlpha(brandColors.accentLight, 0.08)})` }} />
                    <div className="absolute bottom-0 left-0 right-0 rounded-t" style={{ height: `${h * 0.55}%`, background: `linear-gradient(to top, ${withAlpha(brandColors.chartSecondary, 0.7)}, ${withAlpha(brandColors.chartSecondary, 0.2)})` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[8px] text-muted-foreground">Mar '25</span>
                <span className="text-[8px] text-muted-foreground">Feb '26</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border rounded-xl p-4">
                <p className="text-[10px] font-semibold text-muted-foreground mb-3">Account Status</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="5" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(142 70% 45%)" strokeWidth="5" strokeDasharray="63 88" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(45 90% 50%)" strokeWidth="5" strokeDasharray="16 88" strokeDashoffset="-63" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(0 70% 50%)" strokeWidth="5" strokeDasharray="9 88" strokeDashoffset="-79" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    {[{ c: "bg-green-500", l: "Current", v: "72%" }, { c: "bg-amber-500", l: "Delinquent", v: "18%" }, { c: "bg-red-500", l: "Default", v: "10%" }].map(s => (
                      <div key={s.l} className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${s.c}`} /><span className="text-[9px] text-muted-foreground">{s.l}</span><span className="text-[9px] font-semibold ml-auto">{s.v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-[10px] font-semibold text-muted-foreground mb-3">Loan Types</p>
                <div className="space-y-2">
                  {[{ l: "Term Loan", w: "82%", v: "82%" }, { l: "Overdraft", w: "58%", v: "58%" }, { l: "Mortgage", w: "37%", v: "37%" }].map(b => (
                    <div key={b.l}>
                      <div className="flex items-center justify-between mb-0.5"><span className="text-[9px] text-muted-foreground">{b.l}</span><span className="text-[9px] font-semibold">{b.v}</span></div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: b.w, background: `linear-gradient(to right, ${brandColors.accentLight}, ${brandColors.chartSecondary})` }} /></div>
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
        <div className={`${base} border border-border/50 relative overflow-hidden`} style={{ background: "linear-gradient(135deg, hsl(200 30% 12%), hsl(210 25% 16%))" }}>
          <GlowOrb className="w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color={brandColors.accentLight} />
          <div className="relative z-10 p-6">
            <p className="text-[11px] font-semibold text-white/70 mb-4">Africa Coverage — 54 Countries</p>
            <div className="flex items-center justify-center gap-8">
              <div className="relative">
                <Globe className="w-32 h-32 text-white/8" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <MapPin className="w-8 h-8 text-primary" style={{ filter: `drop-shadow(0 0 8px ${brandColors.accentMuted})` }} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { flag: "🇰🇪", name: "Kenya", b: "3,284", a: "5,128" },
                  { flag: "🇳🇬", name: "Nigeria", b: "4,567", a: "7,892" },
                  { flag: "🇪🇹", name: "Ethiopia", b: "2,891", a: "4,312" },
                ].map(c => (
                  <div key={c.name} className="rounded-xl p-3 border border-white/10 min-w-[180px]" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
                    <p className="text-[11px] font-semibold text-white">{c.flag} {c.name}</p>
                    <p className="text-[9px] text-white/50">{c.b} borrowers · {c.a} accounts</p>
                  </div>
                ))}
                <div className="flex items-center gap-3 px-2 pt-1">
                  {[{ c: "bg-primary", l: "High" }, { c: "bg-primary/50", l: "Medium" }, { c: "bg-primary/20", l: "Low" }].map(l => (
                    <div key={l.l} className="flex items-center gap-1">
                      <div className={`w-3 h-2 rounded-sm ${l.c}`} />
                      <span className="text-[8px] text-white/40">{l.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case "table-borrowers":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Borrowers</span><Badge variant="secondary" className="text-[9px]">102,462</Badge></div>
            <div className="h-8 px-4 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>+ Add Borrower</div>
          </div>
          <div className="p-3"><div className="h-9 border rounded-lg bg-muted/20 flex items-center px-3 shadow-inner"><Search className="w-3.5 h-3.5 text-muted-foreground mr-2" /><span className="text-[11px] text-muted-foreground">Search borrowers...</span></div></div>
          <table className="w-full text-[11px]">
            <thead><tr className="bg-muted/30"><th className="px-4 py-2 text-left text-muted-foreground font-medium">Name</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Type</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">National ID</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Country</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Status</th></tr></thead>
            <tbody>
              {[
                { name: "Amara Osei", type: "Individual", id: "GHA-29384756", country: "🇬🇭 Ghana", status: "Active" },
                { name: "Safaricom Holdings", type: "Corporate", id: "KEN-87654321", country: "🇰🇪 Kenya", status: "Active" },
                { name: "Fatima El-Rashid", type: "Individual", id: "EGY-11223344", country: "🇪🇬 Egypt", status: "Under Review" },
              ].map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/20 transition-colors"><td className="px-4 py-2.5 font-medium">{r.name}</td><td className="px-4 py-2.5">{r.type}</td><td className="px-4 py-2.5 font-mono text-[10px]">{r.id}</td><td className="px-4 py-2.5">{r.country}</td><td className="px-4 py-2.5"><Badge variant={r.status === "Active" ? "default" : "secondary"} className="text-[9px]">{r.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "form-borrower":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Add New Borrower</span></div>
          <div className="flex gap-2">
            <div className="h-9 px-5 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>Individual</div>
            <div className="h-9 px-5 border rounded-lg flex items-center text-[11px] text-muted-foreground">Corporate</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["First Name *", "Last Name *", "National ID *", "Date of Birth", "Country *", "Phone", "Email", "Employer"].map(f => (
              <div key={f}><p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{f}</p><div className="h-9 border rounded-lg bg-muted/20 shadow-inner" /></div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <div className="h-9 px-5 border rounded-lg flex items-center text-[11px]">Cancel</div>
            <div className="h-9 px-5 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>Submit for Approval</div>
          </div>
        </div>
      );
    case "detail-borrower":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: brandColors.iconGradientSubtle }}><Users className="w-7 h-7 text-primary" /></div>
            <div><p className="text-base font-bold">Amara Osei</p><p className="text-[11px] text-muted-foreground">Individual · GHA-29384756 · 🇬🇭 Ghana</p></div>
            <div className="ml-auto flex gap-2">
              <div className="h-9 px-4 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: "linear-gradient(135deg, hsl(270 60% 50%), hsl(280 55% 40%))" }}><Brain className="w-3.5 h-3.5 mr-2" />AI Risk Analysis</div>
              <div className="h-9 px-4 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}><FileText className="w-3.5 h-3.5 mr-2" />Credit Report</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ l: "Credit Score", v: "720", c: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" }, { l: "Total Accounts", v: "3", bg: "bg-blue-50 dark:bg-blue-950/20" }, { l: "Outstanding", v: "GHS 125K", bg: "bg-amber-50 dark:bg-amber-950/20" }].map(c => (
              <div key={c.l} className={`rounded-xl p-3.5 text-center ${c.bg} border`}><p className="text-[9px] text-muted-foreground uppercase tracking-wider">{c.l}</p><p className={`text-xl font-black mt-1 ${c.c || ""}`}>{c.v}</p></div>
            ))}
          </div>
          <div className="border rounded-xl p-4"><p className="text-[10px] font-semibold mb-2">Credit Accounts</p><div className="space-y-1.5">{["Term Loan — GHS 50,000 — Current", "Overdraft — GHS 75,000 — Current"].map(a => <div key={a} className="text-[10px] text-muted-foreground py-1.5 border-b last:border-0 flex items-center gap-2"><CreditCard className="w-3 h-3 text-primary/50" />{a}</div>)}</div></div>
        </div>
      );
    case "table-accounts":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Credit Accounts</span><Badge variant="secondary" className="text-[9px]">172,359</Badge></div>
            <div className="h-8 px-4 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>+ Add Account</div>
          </div>
          <table className="w-full text-[11px]">
            <thead><tr className="bg-muted/30"><th className="px-4 py-2 text-left text-muted-foreground font-medium">Account #</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Borrower</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Type</th><th className="px-4 py-2 text-right text-muted-foreground font-medium">Balance</th><th className="px-4 py-2 text-left text-muted-foreground font-medium">Status</th></tr></thead>
            <tbody>
              {[
                { acc: "TL-2024-001", name: "Amara Osei", type: "Term Loan", bal: "GHS 50,000", s: "Current" },
                { acc: "OD-2024-015", name: "Safaricom PLC", type: "Overdraft", bal: "KES 2.5M", s: "Current" },
                { acc: "MG-2024-008", name: "F. El-Rashid", type: "Mortgage", bal: "EGP 850K", s: "Delinquent" },
              ].map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/20 transition-colors"><td className="px-4 py-2.5 font-mono text-[10px]">{r.acc}</td><td className="px-4 py-2.5 font-medium">{r.name}</td><td className="px-4 py-2.5">{r.type}</td><td className="px-4 py-2.5 text-right font-semibold">{r.bal}</td><td className="px-4 py-2.5"><Badge variant={r.s === "Current" ? "default" : "destructive"} className="text-[9px]">{r.s}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "search":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Search className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Generate Credit Report</span></div>
          <div className="h-12 border-2 border-primary/30 rounded-xl bg-muted/10 flex items-center px-4 shadow-inner"><Search className="w-5 h-5 text-muted-foreground mr-3" /><span className="text-sm">Amara</span><span className="text-sm text-muted-foreground animate-pulse">|</span></div>
          <div className="space-y-2">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.15em]">Borrowers</p>
            {[{ n: "Amara Osei", d: "Individual · GHA-29384756 · Ghana" }, { n: "Amara Diallo", d: "Individual · SEN-55667788 · Senegal" }].map(r => (
              <div key={r.n} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                <div><p className="text-[11px] font-semibold">{r.n}</p><p className="text-[9px] text-muted-foreground">{r.d}</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      );
    case "report":
      return (
        <div className={`${base} bg-card border border-border/50 space-y-4`}>
          <div className="p-5 rounded-t-2xl text-white relative overflow-hidden" style={{ background: brandColors.headerGradient }}>
            <GlowOrb className="w-32 h-32 -top-10 -right-10" color={brandColors.glowB} />
            <div className="relative z-10 flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <div>
                <span className="text-sm font-bold">Comprehensive Credit Information Report</span>
                <p className="text-[9px] text-white/40 mt-0.5">Serial: CR-2026-AXBK7F · Generated: 03 Mar 2026</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[{ l: "Bureau Score", v: "720", c: "text-green-600 dark:text-green-400" }, { l: "Facilities", v: "3" }, { l: "Outstanding", v: "GHS 125K" }, { l: "Risk Items", v: "0", c: "text-green-600 dark:text-green-400" }].map(c => (
                <div key={c.l} className="border rounded-xl p-3 text-center"><p className="text-[8px] text-muted-foreground uppercase tracking-wider">{c.l}</p><p className={`text-base font-black mt-1 ${c.c || ""}`}>{c.v}</p></div>
              ))}
            </div>
            <div className="space-y-1.5">
              {["1. Credit Profile Overview (11 indicators)", "2. Classification by Institution", "3. Liability Summary with Aging Buckets", "4. Facility Details + 24-Month Payment Grid"].map(s => (
                <div key={s} className="flex items-center gap-2 text-[10px] text-muted-foreground"><ChevronRight className="w-3 h-3 text-primary shrink-0" />{s}</div>
              ))}
            </div>
          </div>
        </div>
      );
    case "upload":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Batch Upload</span></div>
          <div className="flex gap-2">
            <div className="h-9 px-5 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>Borrowers</div>
            <div className="h-9 px-5 border rounded-lg flex items-center text-[11px] text-muted-foreground">Credit Accounts</div>
          </div>
          <div className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center bg-primary/[0.02]">
            <Upload className="w-10 h-10 text-primary/20 mx-auto" />
            <p className="text-xs text-muted-foreground mt-3">Drop your CSV file here or click to browse</p>
            <p className="text-[9px] text-muted-foreground/50 mt-1">Max 10MB · Download template first</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0"><span className="text-white text-xs font-bold">✓</span></div>
            <div><p className="text-[11px] font-semibold text-green-700 dark:text-green-300">245 of 250 records imported</p><p className="text-[9px] text-green-600 dark:text-green-400/70 dark:text-green-400/50">5 rows had validation errors</p></div>
          </div>
        </div>
      );
    case "disputes":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Disputes</span></div>
            <div className="h-8 px-4 rounded-lg flex items-center text-white text-[11px] font-semibold shadow-md" style={{ background: brandColors.headerGradientSubtle }}>+ New Dispute</div>
          </div>
          <div className="divide-y">
            {[
              { id: "DSP-001", status: "Open", priority: "High", sla: "2 days left", sc: "text-amber-600 dark:text-amber-400", bc: "bg-amber-100 dark:bg-amber-900/30" },
              { id: "DSP-002", status: "Under Review", priority: "Medium", sla: "5 days left", sc: "text-blue-600 dark:text-blue-400", bc: "bg-blue-100 dark:bg-blue-900/30" },
              { id: "DSP-003", status: "Resolved", priority: "Low", sla: "Completed", sc: "text-green-600 dark:text-green-400", bc: "bg-green-100 dark:bg-green-900/30" },
            ].map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-[10px] text-muted-foreground w-16">{d.id}</span>
                <Badge variant="secondary" className="text-[9px]">{d.status}</Badge>
                <span className="text-[10px] text-muted-foreground">{d.priority}</span>
                <span className={`text-[10px] font-semibold ml-auto ${d.sc}`}>{d.sla}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "approval":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-3`}>
          <div className="flex items-center gap-2 mb-1"><CheckSquare className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Pending Approvals</span><Badge variant="secondary" className="text-[9px] ml-2">2</Badge></div>
          {[
            { user: "cbe_user", action: "New Borrower: Tadesse Bekele", time: "2 hours ago" },
            { user: "dashen_user", action: "Modified Account: OD-2024-015", time: "5 hours ago" },
          ].map(a => (
            <div key={a.action} className="flex items-center gap-3 p-3.5 border rounded-xl hover:bg-muted/20 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-sm" />
              <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold truncate">{a.action}</p><p className="text-[9px] text-muted-foreground">By {a.user} · {a.time}</p></div>
              <div className="flex gap-1.5 shrink-0">
                <div className="h-7 px-3 bg-green-500 rounded-lg text-[10px] flex items-center text-white font-semibold shadow-sm">Approve</div>
                <div className="h-7 px-3 bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg text-[10px] flex items-center text-red-600 dark:text-red-400 font-semibold">Reject</div>
              </div>
            </div>
          ))}
        </div>
      );
    case "audit":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="flex items-center gap-2 p-4 border-b"><Shield className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Audit Trail</span><Badge variant="outline" className="text-[9px] ml-auto">SHA-256 Hash Chain</Badge></div>
          <div className="divide-y">
            {[
              { time: "14:32:05", user: "admin", action: "GENERATE_REPORT", detail: "Credit report CR-2026-AXBK7F" },
              { time: "14:28:11", user: "cbe_user", action: "CREATE_BORROWER", detail: "New borrower: Tadesse Bekele" },
              { time: "14:15:43", user: "admin", action: "APPROVE_CHANGE", detail: "Approved account OD-2024-015" },
            ].map(e => (
              <div key={e.time} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-[10px] text-muted-foreground">{e.time}</span>
                <span className="text-[11px] font-medium w-20">{e.user}</span>
                <Badge variant="outline" className="text-[9px] font-mono">{e.action}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[180px]">{e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "institutions":
      return (
        <div className={`${base} bg-card border border-border/50`}>
          <div className="flex items-center gap-2 p-4 border-b"><Building2 className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Institutions</span></div>
          <div className="divide-y">
            {[
              { name: "Commercial Bank of Ethiopia", type: "Commercial Bank", country: "🇪🇹 Ethiopia" },
              { name: "Equity Bank Kenya", type: "Commercial Bank", country: "🇰🇪 Kenya" },
              { name: "First Bank Nigeria", type: "Commercial Bank", country: "🇳🇬 Nigeria" },
            ].map(i => (
              <div key={i.name} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
                <span className="text-[11px] font-semibold">{i.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{i.type}</span>
                <span className="text-[11px]">{i.country}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "users":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">User Management — 5 Roles</span></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: "Super Admin", color: "from-red-500 to-red-600", desc: "Multi-country full access", icon: Server },
              { role: "Administrator", color: "from-purple-500 to-purple-600", desc: "Full access within country", icon: Shield },
              { role: "Regulator", color: "from-blue-500 to-blue-600", desc: "Oversight + approvals", icon: Scale },
              { role: "Lender", color: "from-green-500 to-green-600", desc: "Own institution data", icon: Building2 },
              { role: "Viewer", color: "from-gray-400 to-gray-500", desc: "Read-only access", icon: Search },
            ].map(r => (
              <div key={r.role} className="rounded-xl p-4 border relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${r.color}`} />
                <div className="flex items-center gap-2 mt-1">
                  <r.icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-[11px] font-bold">{r.role}</p>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "exchange":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Exchange Rates</span><Badge variant="secondary" className="text-[9px]">42+ Currencies</Badge></div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { pair: "USD/ETB", rate: "56.78", change: "+0.12" }, { pair: "USD/KES", rate: "153.25", change: "-0.34" }, { pair: "USD/NGN", rate: "1,560", change: "+2.50" },
              { pair: "USD/ZAR", rate: "18.42", change: "+0.08" }, { pair: "USD/EGP", rate: "30.95", change: "-0.15" }, { pair: "USD/GHS", rate: "14.85", change: "+0.22" },
            ].map(r => (
              <div key={r.pair} className="border rounded-xl p-3 text-center hover:bg-muted/20 transition-colors">
                <p className="text-[9px] text-muted-foreground font-medium">{r.pair}</p>
                <p className="text-base font-black mt-0.5">{r.rate}</p>
                <p className={`text-[8px] mt-0.5 ${r.change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>{r.change}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "compliance":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Regulatory Compliance</span></div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Data Submission", v: "98%", c: "from-green-500 to-green-600" },
              { l: "Dispute SLA", v: "95%", c: "from-green-500 to-green-600" },
              { l: "Consent Coverage", v: "87%", c: "from-amber-500 to-amber-600" },
            ].map(m => (
              <div key={m.l} className="rounded-xl p-4 text-center border relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-r ${m.c} opacity-10`} style={{ height: m.v }} />
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider relative z-10">{m.l}</p>
                <p className="text-2xl font-black mt-1 relative z-10">{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "help":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Headset, label: "Helpdesk", desc: "Submit support tickets", gradient: "from-blue-500 to-blue-600" },
              { icon: BookOpen, label: "Online Manual", desc: "Searchable help articles", gradient: "from-purple-500 to-purple-600" },
              { icon: FileText, label: "Documentation", desc: "API & technical docs", gradient: "from-teal-500 to-teal-600" },
            ].map(h => (
              <div key={h.label} className="border rounded-xl p-4 text-center relative overflow-hidden hover:bg-muted/20 transition-colors">
                <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${h.gradient}`} />
                <h.icon className="w-7 h-7 text-primary mx-auto mb-2 mt-1" />
                <p className="text-[11px] font-bold">{h.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shrink-0"><Headset className="w-5 h-5 text-primary-foreground" /></div>
            <div><p className="text-[11px] font-bold">AI Chatbot Assistant</p><p className="text-[9px] text-muted-foreground">Always available — click the floating button (bottom-right)</p></div>
          </div>
        </div>
      );
    case "ai-features":
      return (
        <div className={`${base} bg-card border border-border/50 space-y-4`}>
          <div className="p-5 rounded-t-2xl text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 60% 45%), hsl(280 50% 35%))" }}>
            <GlowOrb className="w-32 h-32 -top-10 -right-10" color="hsl(270 60% 60%)" />
            <div className="relative z-10 flex items-center gap-3">
              <Brain className="w-5 h-5" />
              <div>
                <span className="text-sm font-bold">AI-Powered Risk Analysis</span>
                <p className="text-[9px] text-white/40 mt-0.5">GPT-4o Intelligence Engine</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(45 90% 50%)" strokeWidth="3" strokeDasharray="68 94" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center"><p className="text-lg font-black">72</p><p className="text-[7px] text-muted-foreground">/100</p></div>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-[9px]">MEDIUM RISK</Badge>
                <div className="space-y-1">
                  {["High debt-to-income ratio (62%)", "3 recent credit inquiries", "Short credit history (< 2 years)"].map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />{f}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl border bg-purple-50 dark:bg-purple-950/20">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <p className="text-[10px] text-muted-foreground">AI recommendations and regulatory flags included</p>
            </div>
          </div>
        </div>
      );
    case "notifications":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-4`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><span className="text-[8px] text-white font-bold">3</span></div>
            </div>
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: AlertCircle, title: "New dispute filed", desc: "DSP-047 by Amara Osei", time: "2 min ago", ic: "text-amber-500" },
              { icon: CheckSquare, title: "Approval needed", desc: "New borrower: Fatima El-Rashid", time: "15 min ago", ic: "text-blue-500" },
              { icon: Shield, title: "System update", desc: "Exchange rates synced successfully", time: "1 hour ago", ic: "text-green-500" },
            ].map(n => (
              <div key={n.title} className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5"><n.icon className={`w-4 h-4 ${n.ic}`} /></div>
                <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold">{n.title}</p><p className="text-[9px] text-muted-foreground">{n.desc}</p></div>
                <span className="text-[9px] text-muted-foreground shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
          <div className="text-center"><span className="text-[10px] text-primary font-medium">Mark all as read</span></div>
        </div>
      );
    case "export":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Reports Export</span></div>
            <div className="flex gap-2">
              <div className="h-8 px-3 rounded-lg flex items-center text-[10px] font-semibold border hover:bg-muted/20 transition-colors gap-1.5"><FileText className="w-3 h-3" />CSV</div>
              <div className="h-8 px-3 rounded-lg flex items-center text-white text-[10px] font-semibold shadow-md gap-1.5" style={{ background: brandColors.headerGradientSubtle }}><FileText className="w-3 h-3" />Excel</div>
            </div>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 text-[9px] font-semibold text-white" style={{ background: brandColors.headerGradientSubtle }}>
              {["Name", "Account #", "Balance", "Status"].map(h => <div key={h} className="px-3 py-2">{h}</div>)}
            </div>
            {[
              ["Amara Osei", "TL-2024-001", "GHS 50,000", "Current"],
              ["Safaricom PLC", "OD-2024-015", "KES 2.5M", "Current"],
              ["F. El-Rashid", "MG-2024-008", "EGP 850K", "Delinquent"],
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-4 text-[10px] border-t">
                {row.map((cell, j) => <div key={j} className={`px-3 py-2 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{cell}</div>)}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">Excel files include formatted headers with teal styling</p>
        </div>
      );
    case "api-usage":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-4`}>
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">API Usage Analytics</span></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Requests Today", value: "1,247", icon: Globe, gradient: "from-blue-500 to-blue-600" },
              { label: "This Hour", value: "89", icon: Monitor, gradient: "from-teal-500 to-teal-600" },
            ].map(c => (
              <div key={c.label} className="relative rounded-xl p-4 border shadow-sm overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${c.gradient}`} />
                <c.icon className="w-4 h-4 text-muted-foreground/40 mb-1" />
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="text-xl font-black mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground mb-3">Hourly Volume — Last 24h</p>
            <div className="flex items-end gap-[3px] h-20">
              {[20, 35, 28, 42, 55, 48, 62, 38, 45, 72, 58, 65, 42, 35, 28, 50, 68, 75, 60, 45, 38, 52, 48, 30].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: `linear-gradient(to top, ${withAlpha(brandColors.accentLight, 0.6)}, ${withAlpha(brandColors.accentLight, 0.15)})` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] text-muted-foreground">24h ago</span>
              <span className="text-[8px] text-muted-foreground">Now</span>
            </div>
          </div>
        </div>
      );
    case "consumer-portal":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Consumer Self-Service Portal</span></div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Credit Score", value: "742", sub: "Good", gradient: "from-green-500 to-green-600" },
              { label: "Active Accounts", value: "3", sub: "All current", gradient: "from-blue-500 to-blue-600" },
              { label: "Disputes", value: "0", sub: "None open", gradient: "from-teal-500 to-teal-600" },
            ].map(c => (
              <div key={c.label} className="relative rounded-xl p-4 border text-center overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${c.gradient}`} />
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">{c.label}</p>
                <p className="text-2xl font-black mt-1">{c.value}</p>
                <p className="text-[9px] text-muted-foreground">{c.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-blue-50 dark:bg-blue-950/20">
            <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-[10px] text-muted-foreground">Consumers register and view their own credit data — no system login required</p>
          </div>
        </div>
      );
    case "score-methodology":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Score Methodology — 300 to 850</span></div>
          <div className="space-y-2">
            {[
              { grade: "Excellent", range: "750–850", color: "bg-green-500", w: "100%" },
              { grade: "Good", range: "700–749", color: "bg-blue-500", w: "82%" },
              { grade: "Fair", range: "650–699", color: "bg-amber-500", w: "64%" },
              { grade: "Poor", range: "550–649", color: "bg-orange-500", w: "46%" },
              { grade: "Very Poor", range: "300–549", color: "bg-red-500", w: "28%" },
            ].map(b => (
              <div key={b.grade} className="flex items-center gap-3">
                <span className="text-[10px] font-semibold w-16 text-right">{b.grade}</span>
                <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden"><div className={`h-full ${b.color} rounded-full`} style={{ width: b.w }} /></div>
                <span className="text-[9px] text-muted-foreground w-14">{b.range}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "telco":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Telco Scoring & Lending</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground">Telco Score Factors</p>
              {[
                { l: "Airtime Usage", v: "85%", c: "bg-blue-500" },
                { l: "Mobile Money", v: "72%", c: "bg-green-500" },
                { l: "Top-up Frequency", v: "91%", c: "bg-purple-500" },
                { l: "Data Usage", v: "68%", c: "bg-amber-500" },
              ].map(f => (
                <div key={f.l}>
                  <div className="flex justify-between mb-0.5"><span className="text-[9px] text-muted-foreground">{f.l}</span><span className="text-[9px] font-semibold">{f.v}</span></div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden"><div className={`h-full ${f.c} rounded-full`} style={{ width: f.v }} /></div>
                </div>
              ))}
            </div>
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground">Micro-Loan Pipeline</p>
              {[
                { status: "Approved", count: "234", c: "text-green-600" },
                { status: "Pending", count: "58", c: "text-amber-600" },
                { status: "Disbursed", count: "189", c: "text-blue-600" },
                { status: "Repaid", count: "1,204", c: "text-teal-600" },
              ].map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{s.status}</span>
                  <span className={`text-sm font-bold ${s.c}`}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "borrower-alerts":
      return (
        <div className={`${base} bg-card border border-border/50 p-5 space-y-3`}>
          <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Borrower Alerts</span></div>
          <div className="space-y-2">
            {[
              { severity: "High", title: "New delinquency detected", borrower: "Amara Osei", color: "border-l-red-500 bg-red-50 dark:bg-red-950/20" },
              { severity: "Medium", title: "Large balance movement", borrower: "Safaricom Holdings", color: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20" },
              { severity: "Low", title: "Status changed to Current", borrower: "Fatima El-Rashid", color: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20" },
            ].map(a => (
              <div key={a.title} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${a.color}`}>
                <div><p className="text-[11px] font-semibold">{a.title}</p><p className="text-[9px] text-muted-foreground">{a.borrower}</p></div>
                <Badge variant="outline" className="ml-auto text-[8px]">{a.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      );
    case "regulatory-dashboard":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Regulatory Dashboard</span></div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "NPL Ratio", value: "4.2%", color: "text-green-600" },
              { label: "Submission Rate", value: "98%", color: "text-green-600" },
              { label: "SLA Performance", value: "95%", color: "text-green-600" },
              { label: "Sectors Covered", value: "12", color: "text-blue-600" },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3 border text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className={`text-lg font-black mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "bog-export":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Regulatory Export</span></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "BOG Export", desc: "Bank of Ghana — CRB v1.1 format", icon: "🇬🇭" },
              { label: "BSL Export", desc: "Bank of Sierra Leone format", icon: "🇸🇱" },
            ].map(e => (
              <div key={e.label} className="border rounded-xl p-4 text-center hover:bg-muted/20 transition-colors">
                <p className="text-2xl mb-2">{e.icon}</p>
                <p className="text-[11px] font-bold">{e.label}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "cross-border":
      return (
        <div className={`${base} border border-border/50 relative overflow-hidden`} style={{ background: "linear-gradient(135deg, hsl(200 30% 12%), hsl(210 25% 16%))" }}>
          <GlowOrb className="w-48 h-48 top-0 right-0" color={brandColors.accentLight} />
          <div className="relative z-10 p-6 space-y-4">
            <div className="flex items-center gap-2"><Network className="w-4 h-4 text-white/70" /><span className="text-sm font-semibold text-white">Cross-Border Data Sharing</span></div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Agreements", icon: FileText, desc: "Bilateral & multilateral" },
                { label: "Cross-Border Search", icon: Search, desc: "Multi-jurisdiction lookup" },
                { label: "PAPSS Settlements", icon: DollarSign, desc: "Pan-African payments" },
              ].map(f => (
                <div key={f.label} className="rounded-xl p-3 text-center border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <f.icon className="w-5 h-5 text-white/60 mx-auto mb-2" />
                  <p className="text-[10px] font-semibold text-white">{f.label}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "portfolio-intelligence":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Portfolio Intelligence</span></div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Concentration Risk", value: "Low", color: "text-green-600" },
              { label: "Sector Diversity", value: "High", color: "text-green-600" },
              { label: "Trend", value: "Improving", color: "text-blue-600" },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3 border text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className={`text-sm font-black mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2">AI-Generated Insights</p>
            <div className="space-y-1.5">
              {["Microfinance sector shows 12% growth — consider exposure limits", "NPL ratio trending down across all regions", "Geographic diversification score improved by 8%"].map(i => (
                <div key={i} className="flex items-start gap-2"><Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" /><p className="text-[9px] text-muted-foreground">{i}</p></div>
              ))}
            </div>
          </div>
        </div>
      );
    case "ai-command-center":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="p-4 rounded-xl text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 60% 45%), hsl(280 50% 35%))" }}>
            <div className="flex items-center gap-2"><Brain className="w-5 h-5" /><span className="text-sm font-bold">AI Command Center</span></div>
            <p className="text-[9px] text-white/50 mt-1">Natural-language interface to the entire registry</p>
          </div>
          <div className="border rounded-xl p-3 bg-muted/20">
            <p className="text-[10px] text-muted-foreground italic">"Show me all defaulted borrowers in Ghana with balances over GHS 100,000"</p>
          </div>
          <div className="border rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-purple-500" /><span className="text-[10px] font-semibold">AI Response</span></div>
            <p className="text-[9px] text-muted-foreground">Found 12 defaulted borrowers in Ghana matching criteria. Total exposure: GHS 4.2M across 3 institutions...</p>
          </div>
        </div>
      );
    case "command-center":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Server className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Command Center</span><Badge variant="destructive" className="text-[8px]">Super Admin</Badge></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Countries", value: "12", icon: Globe },
              { label: "Organizations", value: "8", icon: Building2 },
              { label: "Total Users", value: "342", icon: Users },
              { label: "System Health", value: "100%", icon: Activity },
            ].map(c => (
              <div key={c.label} className="border rounded-xl p-3 flex items-center gap-3">
                <c.icon className="w-5 h-5 text-muted-foreground" />
                <div><p className="text-[9px] text-muted-foreground">{c.label}</p><p className="text-base font-black">{c.value}</p></div>
              </div>
            ))}
          </div>
        </div>
      );
    case "system-admin":
      return (
        <div className={`${base} bg-card border border-border/50 p-6 space-y-4`}>
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">System Administration</span></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "System Status", desc: "Real-time health monitoring", icon: Activity, color: "text-green-500" },
              { label: "Backup & Recovery", desc: "Database backup management", icon: Server, color: "text-blue-500" },
              { label: "Webhooks", desc: "Outbound event notifications", icon: Network, color: "text-purple-500" },
              { label: "Retention Policies", desc: "Data retention rules", icon: Shield, color: "text-amber-500" },
            ].map(t => (
              <div key={t.label} className="border rounded-xl p-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                <t.icon className={`w-5 h-5 ${t.color} shrink-0`} />
                <div><p className="text-[10px] font-semibold">{t.label}</p><p className="text-[8px] text-muted-foreground">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      );
    case "end":
      return (
        <div className={`${base} relative overflow-hidden`} style={{ background: brandColors.heroGradient }}>
          <GlowOrb className="w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color={brandColors.glowA} />
          <GlowOrb className="w-48 h-48 -bottom-10 -right-10" color={brandColors.glowB} />
          <div className="relative z-10 p-10 text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">You're All Set!</h3>
            <p className="text-white/50 mt-3 text-sm max-w-md mx-auto leading-relaxed">Explore the system, add records, generate reports, and monitor compliance across all 54 African countries with 42+ currencies and five languages.</p>
            <p className="text-white/30 text-xs mt-6">Replay this guide anytime from the sidebar → App Guide</p>
          </div>
        </div>
      );
    default:
      return (
        <div className={`${base} bg-muted/30 h-32 flex items-center justify-center rounded-2xl`}>
          <Monitor className="w-10 h-10 text-muted-foreground/20" />
        </div>
      );
  }
}

export default function AppGuidePage() {
  const { t } = useTranslation();
  const slides = getSlides(t as (key: string, fallback: string) => string);
  const brandColors = useBrandColors();
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;
  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === totalSlides - 1;

  const stopTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const startTimers = useCallback(() => {
    stopTimers();
    setProgress(0);
    const step = 50;
    progressRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + (step / SLIDE_DURATION) * 100, 100));
    }, step);
    intervalRef.current = setInterval(() => {
      setSlideDirection("next");
      setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : prev));
    }, SLIDE_DURATION);
  }, [stopTimers, totalSlides]);

  useEffect(() => {
    if (isLastSlide) {
      setIsPlaying(false);
      stopTimers();
      return;
    }
    if (isPlaying) startTimers();
    else stopTimers();
    return stopTimers;
  }, [isPlaying, currentSlide, startTimers, stopTimers, isLastSlide]);

  const goTo = (index: number) => {
    setSlideDirection(index > currentSlide ? "next" : "prev");
    setCurrentSlide(index);
    setProgress(0);
  };

  const next = () => { if (currentSlide < totalSlides - 1) { setSlideDirection("next"); setCurrentSlide(prev => prev + 1); setProgress(0); } };
  const prev = () => { if (currentSlide > 0) { setSlideDirection("prev"); setCurrentSlide(prev => prev - 1); setProgress(0); } };

  const sections = slides.reduce<{ name: string; startIndex: number; count: number }[]>((acc, s, i) => {
    if (!acc.length || acc[acc.length - 1].name !== s.section) {
      acc.push({ name: s.section, startIndex: i, count: 1 });
    } else {
      acc[acc.length - 1].count++;
    }
    return acc;
  }, []);

  const currentSection = sections.find(s => currentSlide >= s.startIndex && currentSlide < s.startIndex + s.count);

  return (
    <div className="min-h-screen bg-background" data-testid="page-app-guide">
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .slide-in-right { animation: slideInRight 0.5s ease-out; }
        .slide-in-left { animation: slideInLeft 0.5s ease-out; }
        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
      `}</style>

      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: brandColors.iconGradient }}>
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold tracking-tight leading-none">App Guide</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Africa Credit Hub v2.5</p>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none px-2">
              {sections.map((sec) => {
                const isActive = currentSection?.name === sec.name;
                const isPast = currentSlide > sec.startIndex + sec.count - 1;
                return (
                  <button
                    key={sec.name}
                    onClick={() => goTo(sec.startIndex)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
                      isActive ? "bg-primary text-primary-foreground shadow-md" : isPast ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`nav-section-${sec.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {sec.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground font-mono mr-1">{currentSlide + 1}/{totalSlides}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev} disabled={currentSlide === 0} data-testid="button-prev"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPlaying(!isPlaying)} data-testid="button-play-pause">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next} disabled={isLastSlide} data-testid="button-next"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="h-0.5 bg-muted -mx-4 sm:-mx-6" data-testid="guide-progress-bar">
            <div className="h-full transition-all duration-100 ease-linear rounded-full" style={{ width: `${((currentSlide) / (totalSlides - 1)) * 100}%`, background: `linear-gradient(to right, ${brandColors.accentLight}, ${brandColors.secondary})` }} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div key={currentSlide} className={slideDirection === "next" ? "slide-in-right" : "slide-in-left"}>
          <div className="flex items-center gap-2 mb-2">
            <slide.sectionIcon className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em]">{slide.section}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-6" data-testid="text-slide-title">{slide.title}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5 order-2 lg:order-1">
              <p className="text-base text-muted-foreground leading-relaxed" data-testid="text-slide-narration">{slide.narration}</p>

              {slide.roleNotes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">By Role</p>
                  {slide.roleNotes.map(rn => (
                    <div key={rn.role} className="flex items-start gap-2.5 text-sm">
                      <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">{rn.role}</Badge>
                      <span className="text-muted-foreground text-[12px]">{rn.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {slide.tips && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Tips</p>
                  {slide.tips.map(tip => (
                    <div key={tip} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              )}

              {isPlaying && !isLastSlide && (
                <div className="pt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${brandColors.accentLight}, ${brandColors.chartSecondary})` }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1.5">Auto-advancing in {Math.max(0, Math.ceil((100 - progress) / 100 * 12))}s</p>
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <VisualMockup type={slide.visual} isActive={true} />
            </div>
          </div>
        </div>

        {isLastSlide && (
          <div className="flex items-center justify-center gap-4 mt-10 fade-in-up">
            <Button size="lg" variant="outline" className="gap-2" onClick={() => { setCurrentSlide(0); setIsPlaying(true); setProgress(0); }} data-testid="button-replay">
              <RotateCcw className="w-4 h-4" />
              Replay Guide
            </Button>
            <Button size="lg" className="gap-2 shadow-lg" style={{ background: brandColors.headerGradientSubtle }} onClick={() => navigate("/")} data-testid="button-go-dashboard">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-xl py-2.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-6 h-2" : "w-2 h-2 hover:bg-primary/40"
              }`}
              style={{
                background: i === currentSlide
                  ? `linear-gradient(to right, ${brandColors.accentLight}, ${brandColors.secondary})`
                  : i < currentSlide
                    ? brandColors.accentMuted
                    : "hsl(var(--muted-foreground) / 0.15)"
              }}
              data-testid={`dot-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
