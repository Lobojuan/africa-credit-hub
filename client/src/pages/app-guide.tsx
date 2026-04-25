import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Monitor, Users, CreditCard, Search, FileText, AlertCircle, CheckSquare,
  Brain, Smartphone, Globe, Shield, Settings, Building2, DollarSign,
  Database, UserCheck, Banknote, Wallet, BarChart3, Network, Bell,
  Upload, Eye, Scale, Key, ChevronRight, ChevronDown, ArrowRight,
  BookOpen, Lightbulb, MapPin, Lock, Activity, Landmark, Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandColors, withAlpha } from "@/hooks/use-brand-colors";

type UserRole = "super_admin" | "admin" | "lender" | "regulator" | "viewer";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; description: string }> = {
  super_admin: { label: "Super Admin", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30", description: "Full platform access — all 18 topic areas" },
  admin:       { label: "Administrator", color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-100 dark:bg-blue-900/30",   description: "Institution-level operations — 16 topic areas" },
  lender:      { label: "Lender",        color: "text-teal-700 dark:text-teal-300",   bg: "bg-teal-100 dark:bg-teal-900/30",   description: "Credit origination & borrower tools — 10 topic areas" },
  regulator:   { label: "Regulator",     color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30", description: "Oversight, compliance & reporting — 9 topic areas" },
  viewer:      { label: "Viewer",        color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-900/30", description: "Read-only browsing — 4 topic areas" },
};

interface Step {
  title: string;
  description: string;
  tip?: string;
  path?: string;
}

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  roles: UserRole[];
  steps: Step[];
}

const GUIDES: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Log in, set up MFA, and orientate yourself on your first day.",
    icon: Monitor,
    iconColor: "text-blue-500",
    roles: ["super_admin", "admin", "lender", "regulator", "viewer"],
    steps: [
      { title: "Open the login page", description: "Navigate to the platform URL. Enter your username and password, then click Sign In. Google login is also available. If you have a passkey registered, enter your username and click 'Sign in with Passkey' to authenticate with Touch ID, Face ID, or a security key — no password needed.", path: "/" },
      { title: "Set up MFA and/or a Passkey", description: "After logging in, click 'Enable MFA' in the top header to set up TOTP two-factor authentication — scan the QR code with Google Authenticator, Authy, or any compatible app. Or click 'Passkey' to register your device biometric (Touch ID / Face ID) for fully password-free sign-in. Both can be active at the same time.", tip: "Passkeys are phishing-resistant and the strongest login method available. MFA adds a second factor on top of your password." },
      { title: "Set your display language", description: "Click your avatar → Profile Settings → Language. The platform supports English, French, Portuguese, Arabic, and Swahili. Your preference is saved per-account." },
      { title: "Explore the sidebar", description: "The left sidebar is your main navigation. Sections automatically show only the pages you have access to based on your role. Sections collapse and expand — click any section header." },
      { title: "Check your notification bell", description: "The bell icon in the top-right header shows real-time alerts — new disputes, approval requests, SLA breaches, and system events. A red badge shows unread count.", tip: "Set up email notifications from your profile to stay informed even when offline." },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard & Overview",
    description: "Read key metrics, portfolio trends, and the Africa coverage map.",
    icon: BarChart3,
    iconColor: "text-indigo-500",
    roles: ["super_admin", "admin", "lender", "regulator", "viewer"],
    steps: [
      { title: "Read the summary cards", description: "The top row shows Total Borrowers, Total Credit Accounts, Active Disputes, and Pending Approvals — each with a 7-day sparkline trend. Super Admins see platform-wide totals; Lenders see their institution only.", path: "/dashboard" },
      { title: "Explore the portfolio charts", description: "Below the cards: a 12-month area chart (portfolio growth), a donut chart (account status breakdown — Current / Delinquent / Default), and a bar chart (loan type distribution). Hover any element for detailed tooltips." },
      { title: "View the Africa coverage map", description: "The interactive map shows all 54 African countries colour-coded by borrower density. Hover any country for a tooltip showing borrower count and account count." },
      { title: "Switch to Portfolio Intelligence", description: "Click 'Portfolio Intelligence' in the sidebar for AI-driven deep analytics — concentration risk, geographic distribution, vintage analysis, and trend forecasting.", path: "/portfolio-intelligence" },
      { title: "Check Platform Metrics (Super Admin)", description: "Super Admins can access Platform Metrics for system-wide health stats — API call volumes, active sessions, error rates, and uptime.", tip: "Platform Metrics is only visible to Super Admin accounts.", path: "/platform-metrics" },
    ],
  },
  {
    id: "borrower-management",
    title: "Borrower Management",
    description: "Register, search, and manage consumer and business borrowers.",
    icon: Users,
    iconColor: "text-teal-500",
    roles: ["super_admin", "admin", "lender", "viewer"],
    steps: [
      { title: "Browse the borrower lists", description: "Click 'Consumers' for individual borrowers or 'Businesses' for corporate borrowers in the sidebar. Each list shows Name, National ID, Country, Status, and Risk Level.", path: "/consumers" },
      { title: "Search for a borrower", description: "Use the search bar at the top of any list to filter by name, national ID, phone, or email. Partial matches are supported — no need to type the full name." },
      { title: "Register a new borrower", description: "Click '+ Register Borrower'. Choose Individual or Corporate, then complete all required fields: national ID, contact details, employer, country, and education level. Submit to enter the maker-checker queue.", tip: "National ID must be unique within a country. Set the PEP flag for Politically Exposed Persons." },
      { title: "Review a borrower's full profile", description: "Click any borrower row to open their detail page. See linked credit accounts, payment history, credit inquiries, court judgments, consent records, and the bureau score card." },
      { title: "Read the Lending Decision panel", description: "At the top of every borrower summary you will see a large colour-coded verdict — APPROVE (green), REFER (amber), or DECLINE (red) — calculated automatically from credit score, defaults, and active account history. No manual input is needed.", tip: "DECLINE = any default on record or score below 500. REFER = score 500–649 or no active accounts. APPROVE = score 650+ with no defaults." },
      { title: "Walk through the Path to Approval with the client", description: "For DECLINE or REFER verdicts, click 'Path to Approval' to expand a numbered, time-stamped recovery roadmap. Steps already met by the client — such as documented income — are auto-marked Done. Walk the borrower through the remaining steps so they know exactly what to fix and how long it will take.", tip: "A DECLINE client with good income typically needs 12–15 months of clean repayment history. A REFER client can often unlock a conditional loan within 3–6 months with collateral or a guarantor." },
      { title: "Run an AI risk assessment", description: "On the borrower detail page, click the purple 'AI Risk Analysis' button. The AI returns a risk score, key risk factors, regulatory flags, and actionable recommendations in seconds." },
      { title: "Wait for maker-checker approval", description: "All new borrowers and edits go into 'Pending Approvals'. A second authorised user must approve or reject before the record becomes active. You cannot approve your own submissions." },
    ],
  },
  {
    id: "credit-accounts",
    title: "Credit Accounts & Scoring",
    description: "Manage credit facilities, understand bureau scoring, and generate credit reports.",
    icon: CreditCard,
    iconColor: "text-purple-500",
    roles: ["super_admin", "admin", "lender"],
    steps: [
      { title: "View all credit accounts", description: "Click 'Credit Accounts' in the sidebar. The table shows Account Number, Borrower, Institution, Type, Status, Currency, Amount, and Days in Arrears.", path: "/credit-accounts" },
      { title: "Add a new credit account", description: "Click '+ Add Account'. Select the borrower, account type (mortgage, auto, personal, etc.), currency, credit limit, and repayment terms. The system supports 42+ African currencies.", tip: "For Islamic finance products, check the 'Interest-Free' checkbox before saving." },
      { title: "Understand the bureau score", description: "Navigate to 'Score Methodology' to see how the 300–850 score is calculated — payment history (35%), credit utilisation (30%), length of credit (15%), credit mix (10%), new inquiries (10%).", path: "/score-methodology" },
      { title: "Generate a credit report", description: "From any borrower's detail page, click 'Generate Credit Report'. The report includes a credit profile overview, liability breakdown, aging analysis, and 24-month payment grid.", tip: "PDF reports are available in all 8 languages. Each report gets a unique serial number for audit tracking." },
      { title: "Use AI Summary on a report", description: "Inside a generated credit report, click 'AI Summary' for a plain-language overview written by the AI — useful for sharing with stakeholders who need a quick read." },
    ],
  },
  {
    id: "credit-search",
    title: "Credit Search",
    description: "Run structured searches across consumers, businesses, telco subscribers, and cross-border entities.",
    icon: Search,
    iconColor: "text-cyan-500",
    roles: ["super_admin", "admin", "lender", "regulator", "viewer"],
    steps: [
      { title: "Open Credit Search", description: "Click 'Credit Search' in the sidebar. Four tabs appear: Consumer, Business, Telco, and General.", path: "/credit-search" },
      { title: "Search by consumer identity", description: "On the Consumer tab, search by full name, national ID, or phone number. Results link directly to borrower profiles and credit reports." },
      { title: "Search by business identity", description: "On the Business tab, search by company name, business registration number (BRN), or Tax Identification Number (TIN)." },
      { title: "Search telco subscribers", description: "On the Telco tab, search by provider name, MSISDN (mobile number), or account ID to find telco-linked credit profiles for unbanked individuals." },
      { title: "Use General cross-entity search", description: "The General tab performs a broad search across all entity types — useful when you're unsure whether you're looking for a consumer, business, or telco profile.", tip: "All searches are logged in the audit trail for regulatory compliance." },
    ],
  },
  {
    id: "loan-origination",
    title: "Loan Origination & Collateral",
    description: "Originate loans through the 7-type lifecycle, manage amortization, and register collateral.",
    icon: Banknote,
    iconColor: "text-orange-500",
    roles: ["super_admin", "admin", "lender"],
    steps: [
      { title: "Open Loan Origination", description: "Click 'Loan Origination' in the sidebar under Credit Data. The list shows all active, pending, and closed loan applications.", path: "/loan-origination" },
      { title: "Start a new loan application", description: "Click '+ New Loan Application'. Select the borrower, loan type (Personal, Business, Mortgage, Auto, Education, Agriculture, or Microfinance), currency, amount, tenure, and interest rate." },
      { title: "Review the amortization schedule", description: "After entering loan details, the system auto-generates an amortization schedule showing each repayment date, principal, interest, and outstanding balance. Review it before submitting." },
      { title: "Submit for maker-checker approval", description: "Click Submit. The application enters Pending Approvals. An Admin or Super Admin (not the submitter) must approve it before disbursement is triggered.", tip: "You cannot approve your own loan applications." },
      { title: "Register collateral", description: "Click 'Collateral Registry' in the sidebar. Click '+ Register Collateral'. Enter asset type (land, vehicle, equipment, securities), estimated value, location, and document reference.", path: "/collateral-registry" },
      { title: "Verify vehicle collateral via DVLA", description: "For vehicle or motor vehicle collateral, enter the DVLA reference number in the 'DVLA Reference' field on the collateral form. The system checks the Ghana DVLA database in real time and displays the registered owner and encumbrance status before you save.", tip: "DVLA verification prevents fraud — always verify before accepting a vehicle as collateral." },
      { title: "Verify land collateral via Lands Commission", description: "For land or real estate collateral, enter the title deed number in the 'Lands Commission Reference' field. The system queries the Lands Commission registry to confirm ownership, parcel boundaries, and any existing charges.", tip: "Lands Commission verification is mandatory for mortgage-secured loans in Ghana." },
      { title: "Link collateral to a loan", description: "From the Collateral Registry, open an asset record and click 'Link to Loan'. Select the approved loan. The asset is now marked as encumbered and the lien is recorded.", tip: "One asset can only be linked to one active loan at a time." },
      { title: "Release collateral after repayment", description: "Once a loan reaches Fully Repaid or Closed status, open the linked collateral record and click 'Release Lien'. The asset returns to unencumbered status." },
    ],
  },
  {
    id: "disputes",
    title: "Disputes & Compliance",
    description: "File, track, and resolve disputes with SLA enforcement and regulatory escalation.",
    icon: AlertCircle,
    iconColor: "text-red-500",
    roles: ["super_admin", "admin", "lender", "regulator"],
    steps: [
      { title: "View the disputes queue", description: "Click 'Disputes' in the sidebar. The list shows all cases with Status, Priority, Borrower, and SLA deadline. Red rows mean the deadline is approaching or breached.", path: "/disputes" },
      { title: "File a new dispute", description: "Click '+ File Dispute'. Select the affected borrower, the disputed record, the dispute type (Financial Correction, Data Error, Identity Dispute, etc.), and write a clear description." },
      { title: "Understand SLA deadlines", description: "Financial corrections have a 2-business-day SLA. Non-financial corrections have a 5-business-day SLA. The system highlights approaching deadlines in amber and breaches in red." },
      { title: "Resolve a dispute", description: "Open any dispute case. Review the evidence, add internal notes, then click 'Resolve' with a resolution description. The status updates and the borrower's record is corrected if applicable." },
      { title: "Escalate to regulator", description: "If a dispute cannot be resolved internally, use 'Escalate'. This moves the case to the Regulatory Compliance Queue where a Regulator can review and intervene.", tip: "Breached SLA disputes appear automatically in regulatory reports." },
      { title: "View the Compliance Queue", description: "Regulators can see all flagged and escalated records from 'Compliance Queue' in the sidebar. Filter by type, severity, or date range.", path: "/compliance-queue" },
    ],
  },
  {
    id: "maker-checker",
    title: "Maker-Checker Approvals",
    description: "Review, approve, or reject all pending record submissions from your team.",
    icon: CheckSquare,
    iconColor: "text-green-500",
    roles: ["super_admin", "admin", "regulator"],
    steps: [
      { title: "Open Pending Approvals", description: "Click 'Pending Approvals' in the sidebar. All submitted changes — new borrowers, edited records, loan applications, bulk uploads — queue here.", path: "/pending-approvals" },
      { title: "Review a submission", description: "Click any pending item. A before/after comparison shows exactly what changed. For new records, you see the full details submitted by the maker." },
      { title: "Approve the change", description: "If the submission is correct and compliant, click 'Approve'. The record becomes active immediately and the maker is notified." },
      { title: "Reject with a reason", description: "If there's an issue, click 'Reject' and enter a clear reason. The maker is notified and can correct and resubmit. Your reason is logged in the audit trail.", tip: "You cannot approve your own submissions — self-approval is blocked by the system." },
      { title: "Filter by submission type", description: "Use the filter tabs to separate Borrower submissions, Credit Account submissions, Loan Applications, and Bulk Upload batches for more efficient review." },
    ],
  },
  {
    id: "ai-intelligence",
    title: "AI Features & Intelligence",
    description: "Use the AI Command Center, portfolio AI, and borrower risk analysis tools.",
    icon: Brain,
    iconColor: "text-violet-500",
    roles: ["super_admin", "admin", "lender", "regulator"],
    steps: [
      { title: "Open the AI Command Center", description: "Click 'AI Command Center' in the Intelligence section of the sidebar. Type a natural-language query — e.g. 'Show me all defaulted borrowers in Ghana' — and the AI runs the analysis.", path: "/ai-command-center" },
      { title: "Run a borrower AI risk analysis", description: "On any borrower detail page, click the purple 'AI Risk Analysis' button. You'll receive a risk score, key risk factors, regulatory flags, and recommended actions." },
      { title: "Read the Predictive Default Risk card", description: "On borrowers with medium or high risk, the 'Predictive Default Risk' card appears on their detail page. It shows the probability of default within 90 days (Low / Medium / High), a confidence percentage, and three contributing risk factors drawn from the African-trained ML model — covering payment behaviour, open banking signals, and cross-lender exposure.", tip: "The card is hidden for low-risk borrowers to reduce noise. Medium and high risk borrowers always display it for proactive intervention." },
      { title: "Use AI on credit reports", description: "Inside any generated credit report, click 'AI Summary'. The AI produces a plain-language narrative of the borrower's credit standing — ideal for non-technical stakeholders." },
      { title: "Explore Portfolio Intelligence", description: "Click 'Portfolio Intelligence' in the sidebar. The AI highlights concentration risks, sector exposures, vintage trends, and emerging portfolio risks with supporting charts.", path: "/portfolio-intelligence" },
      { title: "Use the AI chatbot assistant", description: "The floating chat icon in the bottom-right corner opens the Credit Registry Assistant. Ask questions about data, regulations, or how to use any feature — it responds with streaming answers." },
      { title: "Generate a compliance AI report", description: "In Regulatory Compliance, click 'Generate AI Compliance Report'. Select a country and the AI produces a detailed compliance assessment for that jurisdiction.", path: "/regulatory-compliance" },
    ],
  },
  {
    id: "telco-crossborder",
    title: "Telco & Cross-Border",
    description: "Score unbanked telco users, manage cross-border agreements, and track PAPSS settlements.",
    icon: Globe,
    iconColor: "text-sky-500",
    roles: ["super_admin", "admin", "lender", "regulator"],
    steps: [
      { title: "View telco subscriber profiles", description: "Click 'Telco Scoring' in the sidebar. Browse subscriber profiles showing airtime usage, mobile money transactions, top-up frequency, and data consumption.", path: "/telco-scoring" },
      { title: "Generate a telco credit score", description: "Open a telco profile and click 'Generate Score'. The model produces an alternative credit score based on mobile behaviour — extending credit access to the unbanked." },
      { title: "Manage telco loans", description: "Click 'Telco Lending' for micro-loans originated through telco channels. These use automated decisioning based on telco scores.", path: "/telco-lending" },
      { title: "Set up cross-border agreements", description: "Click 'Cross-Border Agreements' in the sidebar. Add bilateral or multilateral data-sharing agreements between African countries before any cross-border search is permitted.", path: "/cross-border-agreements" },
      { title: "Run a cross-border search", description: "Click 'Cross-Border Search'. Select source and target countries (an agreement must exist), enter the borrower identity, and the system searches across jurisdictions." },
      { title: "Track PAPSS settlements", description: "Click 'PAPSS Settlements'. Monitor cross-border payment flows tracked through the Pan-African Payment and Settlement System — real-time reconciliation between institutions.", path: "/papss-settlements" },
    ],
  },
  {
    id: "regulatory-reporting",
    title: "Regulatory Reporting",
    description: "Access the regulatory dashboard, generate BoG/BSL/CBK/CBN exports, and manage the compliance queue.",
    icon: Landmark,
    iconColor: "text-emerald-600",
    roles: ["super_admin", "admin", "regulator"],
    steps: [
      { title: "Open the Regulatory Dashboard", description: "Click 'Regulatory Dashboard' in the sidebar. See NPL ratios, data submission rates, dispute resolution performance, and sector exposure across all institutions.", path: "/regulatory-dashboard" },
      { title: "Filter by country, institution, and date", description: "Use the filter controls at the top of the Regulatory Dashboard to drill into specific markets, institution categories, or time periods." },
      { title: "Generate a BoG or BSL export", description: "Click 'BOG Export' (Ghana) or 'BSL Export' (Sierra Leone) in the sidebar. Generate regulatory submission files in the exact format required by the central bank.", path: "/bog-export" },
      { title: "Generate a CBK export (Kenya)", description: "Click 'CBK Export' in the sidebar. Select the reporting period and institution filter, then click Generate. The export produces a Central Bank of Kenya-formatted CRB submission file ready for direct upload.", path: "/cbk-export", tip: "CBK exports include all credit accounts, NPL flags, and restructured facilities — no manual formatting needed." },
      { title: "Generate a CBN export (Nigeria)", description: "Click 'CBN Export' in the sidebar. Generate a Central Bank of Nigeria-compliant credit bureau data file. Supports both individual and corporate borrower schedules in the CBN prescribed XML format.", path: "/cbn-export" },
      { title: "Review the Compliance Queue", description: "Click 'Compliance Queue' to see all records flagged for regulatory attention — SLA breaches, data quality issues, escalated disputes.", path: "/compliance-queue" },
      { title: "Run an AI compliance report", description: "In 'Regulatory Compliance', select a country from the dropdown and click 'Generate AI Compliance Report' for an AI-powered jurisdiction assessment." },
      { title: "View the Audit Trail", description: "Click 'Audit Trail' for a tamper-evident log of every action on the platform. Filter by user, action type, or date. Export as CSV or Excel.", path: "/audit-trail", tip: "Audit logs use SHA-256 hash chaining — they cannot be modified by anyone, including Super Admins." },
    ],
  },
  {
    id: "user-management",
    title: "User & Institution Management",
    description: "Create users, assign roles, manage institutions, and configure exchange rates.",
    icon: Building2,
    iconColor: "text-blue-600",
    roles: ["super_admin", "admin"],
    steps: [
      { title: "Manage users", description: "Click 'Users' in the Administration section. See all users with their role, institution, status, and last login. Click any user to view or edit their profile.", path: "/users" },
      { title: "Add a new user", description: "Click '+ Add User'. Enter their name, email, and username. Assign a role (Admin, Lender, Regulator, or Viewer) and link them to an institution. They'll receive an email invite." },
      { title: "Manage institutions", description: "Click 'Institutions' to see all registered financial institutions — banks, MFIs, SACCOs, etc. View their status, country, type, and billing balance.", path: "/institutions" },
      { title: "Approve a new institution", description: "Institutions that self-register via the signup form appear as Pending. Click the institution and choose Approve or Reject (with a reason). Super Admins do final approval." },
      { title: "Configure exchange rates", description: "Click 'Exchange Rates' in the sidebar. View all 42+ African currency rates. Enable auto-sync for automatic updates every 6 hours, or enter a manual override rate.", path: "/exchange-rates", tip: "Manual rate overrides are logged in the audit trail with a reason code." },
      { title: "Set up Webhooks", description: "Click 'Webhook Management'. Add HTTPS webhook endpoints to receive real-time event notifications — borrower additions, dispute updates, approval decisions. Failed deliveries retry automatically.", path: "/webhooks" },
    ],
  },
  {
    id: "billing-revenue",
    title: "Billing & Revenue Management",
    description: "Monitor institution wallets, review transaction billing, configure revenue splits, and process settlements.",
    icon: Wallet,
    iconColor: "text-green-600",
    roles: ["super_admin"],
    steps: [
      { title: "Open the Billing page", description: "Click 'Billing' under Administration in the sidebar. See each institution's prepaid wallet balance, transaction history, and top-up records.", path: "/billing" },
      { title: "Understand the billing model", description: "The platform uses transaction-based billing: each credit search, report generation, and API call is debited from the institution's prepaid wallet. When the balance reaches zero, API access is suspended." },
      { title: "Configure revenue split per institution", description: "From an institution's billing settings, set the revenue split percentage between the platform operator and the data provider. This determines each party's share of every transaction." },
      { title: "View Institution Analytics", description: "Click 'Institution Analytics'. See daily event counts by type (credit searches, report generations, API calls) alongside billing impact for any institution.", path: "/institution-analytics" },
      { title: "Monitor settlements & payouts", description: "The settlement engine calculates data provider earnings on your configured cycle (daily, weekly, monthly) and generates payout records. Review these under Billing → Settlement History." },
      { title: "Configure white-label branding", description: "From an institution record, click 'Branding'. Set primary/secondary colors, logo URL, tagline, support contact, footer text, and custom domain. A live preview shows how the portal appears to their users.", tip: "White-label branding is separate from billing — both are managed per institution." },
    ],
  },
  {
    id: "data-management",
    title: "Data Management & Export",
    description: "Export encrypted data, configure retention policies, process erasure requests, and run bulk uploads.",
    icon: Database,
    iconColor: "text-slate-600",
    roles: ["super_admin", "admin"],
    steps: [
      { title: "Open the Export Center", description: "Click 'Export Center' (under Administration or Data Management). Choose your export scope — all borrowers, credit accounts, audit logs, or a combined package.", path: "/export-center" },
      { title: "Enable AES-256 encryption", description: "Before generating an export, toggle 'Encrypt Export' and enter a passphrase. The ZIP is encrypted with AES-256. A SHA-256 integrity hash is always generated for verification." },
      { title: "Configure retention policies", description: "Click 'Retention Policies'. Add policies by country, data type, and retention period. Choose an enforcement action: Flag (notify only), Archive (move to cold storage), or Delete (permanent removal).", path: "/retention-policies" },
      { title: "Run the retention scanner", description: "After configuring policies, click 'Run Scanner'. Admins scan their own country's data; Super Admins can run a global scan across all countries." },
      { title: "Process an erasure request", description: "Click 'Erasure Requests'. When a data subject exercises their right to erasure (GDPR-style), create an Erasure Request for their record. The system removes PII and linked records, preserving the immutable audit log.", tip: "Audit logs are never erased — they are preserved to maintain the regulatory chain of custody." },
      { title: "Bulk upload via XBRL or IFF", description: "Click 'Batch Upload' in the sidebar. For structured institutional data, select 'IFF Format' (international financial format XML) or 'XBRL'. Download the template, populate it, and upload.", path: "/batch-upload" },
      { title: "Review export history", description: "The Export History tab shows every previous export — timestamp, user, scope, record count, encryption status, and file size. This is your export chain-of-custody audit trail." },
    ],
  },
  {
    id: "consumer-portal",
    title: "Consumer Portal & Institution Onboarding",
    description: "Understand how consumers self-register and how institutions are onboarded and approved.",
    icon: UserCheck,
    iconColor: "text-pink-500",
    roles: ["super_admin", "admin"],
    steps: [
      { title: "View the Consumer Portal", description: "The Consumer Portal at /my-credit is a public-facing self-service portal. Consumers register at /consumer/register using their national ID and personal details.", path: "/my-credit" },
      { title: "Consumer verification", description: "After submitting the registration form, consumers receive dual-channel verification (SMS + email). Only verified consumers can log in and view their credit data." },
      { title: "What consumers can see", description: "Authenticated consumers can view their bureau score, linked credit accounts, dispute history, consent records, and download a PDF credit report. They are rate-limited to 1 score lookup per day." },
      { title: "Consumer dispute filing", description: "Consumers can file disputes directly from their portal — selecting the dispute type, affected account, and description. This creates a standard 5-business-day SLA case in the disputes queue." },
      { title: "Review institution registration requests", description: "New institutions self-register via /signup. Their application appears as Pending in the Institutions list. Review the BRN, company details, country, and institution type before approving.", path: "/institutions" },
      { title: "Approve or reject an institution", description: "Super Admins click Approve to grant platform access, or Reject with a reason. Approved institutions receive login credentials and their billing wallet is activated." },
      { title: "Configure institution branding", description: "After approval, open the institution record and click Branding to set their white-label appearance — logo, colors, tagline, custom domain, and support contact." },
    ],
  },
  {
    id: "system-configuration",
    title: "System Configuration & APIs",
    description: "Manage API keys, configure webhooks, control maintenance mode, and monitor system health.",
    icon: Terminal,
    iconColor: "text-cyan-600",
    roles: ["super_admin"],
    steps: [
      { title: "Manage API keys", description: "Click 'API Keys' in the API & Integrations section. Generate new keys per institution with configurable scopes (read, write, report) and rate limits.", path: "/api-keys" },
      { title: "Rotate or revoke an API key", description: "Open any API key record. Click 'Rotate' to generate a new key (the old one is immediately invalidated) or 'Revoke' to permanently disable access. All actions are audit-logged." },
      { title: "Set up webhooks", description: "Click 'Webhook Management'. Add HTTPS endpoints for institutions to receive real-time event notifications. Failed deliveries retry with exponential backoff — view full delivery logs per endpoint.", path: "/webhooks" },
      { title: "Override exchange rates", description: "Click 'Exchange Rates'. Toggle auto-sync per currency or enter a manual override. Manual overrides require a reason code and are logged for full traceability.", path: "/exchange-rates" },
      { title: "Toggle maintenance mode", description: "Under System Settings, use the Maintenance Mode toggle to put the platform into a read-only state for scheduled maintenance. Only Super Admins can toggle this — all API writes are blocked during maintenance.", tip: "Always notify institutions before enabling maintenance mode." },
      { title: "Check system status", description: "Click 'System Status' in the Infrastructure section for real-time health metrics — API response times, database latency, error rates, and active sessions.", path: "/system-status" },
      { title: "Review security settings", description: "Click 'Security' in Infrastructure for password policy, login anomaly detection, active session management, and PII encryption configuration.", path: "/security" },
    ],
  },
  {
    id: "open-banking",
    title: "Open Banking & Alternative Data",
    description: "Connect African open banking providers, pull live bank statements, and enrich borrower profiles with alternative data.",
    icon: Network,
    iconColor: "text-sky-600",
    roles: ["super_admin", "admin", "lender", "regulator"],
    steps: [
      { title: "Open the Open Banking hub", description: "Click 'Open Banking' in the sidebar under Credit Data. The hub lists all connected African open banking providers — covering Ghana (GhIPSS), Kenya (Open Banking Kenya), Nigeria (NIBSS Open Banking), South Africa (Open Finance SA), and more.", path: "/open-banking" },
      { title: "Connect a bank account for a borrower", description: "On any borrower detail page, click 'Link Bank Account'. The borrower authenticates with their bank via the open banking OAuth flow. Once connected, live account data is pulled immediately.", tip: "The borrower must provide explicit consent — the system creates a dated consent record automatically." },
      { title: "View live bank statement data", description: "After connection, open the 'Bank Statements' tab on the borrower profile. See categorised transactions — salary credits, recurring bills, cash withdrawals — going back 12 months." },
      { title: "Review income and cash-flow analysis", description: "The system auto-calculates average monthly income, income stability score, recurring expense ratio, and net disposable income from the connected bank data. These figures feed directly into the credit score." },
      { title: "Enrich profiles with mobile money data", description: "For unbanked borrowers, connect mobile money accounts (M-Pesa, MTN MoMo, Airtel Money, Wave) as an alternative data source. Transaction patterns and float balances contribute to the alternative credit score." },
      { title: "Manage data provider consents", description: "Click 'Consent Management' in the sidebar. All open banking and mobile money consents are listed with their scope, expiry date, and revocation option. Borrowers can revoke at any time, which triggers immediate data deletion.", path: "/consent-management" },
      { title: "Monitor cross-lender risk alerts", description: "The platform aggregates open banking signals across all participating lenders to detect simultaneous multi-lender applications. A red 'Cross-Lender Alert' badge appears on the borrower profile when suspicious simultaneous borrowing is detected.", tip: "Cross-lender alerts are shared across all member institutions in real time — powered by the open banking data layer." },
    ],
  },
  {
    id: "predictive-risk",
    title: "Predictive Default Risk",
    description: "Understand and act on the African-trained ML model that predicts 90-day default probability for each borrower.",
    icon: Activity,
    iconColor: "text-rose-500",
    roles: ["super_admin", "admin"],
    steps: [
      { title: "Find the Predictive Default Risk card", description: "On any borrower detail page, scroll to the 'Predictive Default Risk' card. It appears for Medium and High risk borrowers only — Low risk borrowers do not show the card to reduce noise.", tip: "If a borrower you expect to see the card for does not show it, their current ML risk level is Low." },
      { title: "Read the default probability score", description: "The card shows the probability of default within the next 90 days as a percentage (e.g. 67%), a confidence level (e.g. High Confidence — 89%), and a colour-coded risk band: green (Low <30%), amber (Medium 30–69%), red (High ≥70%)." },
      { title: "Review the three contributing risk factors", description: "Below the score, three key factors explain why the model arrived at this prediction — for example: 'Irregular payment cadence over last 6 months', 'Multiple simultaneous open banking applications detected', 'Cross-lender exposure above country average'. These are drawn from payment behaviour, open banking signals, and cross-lender data." },
      { title: "Run the AI Risk Analysis for deeper detail", description: "Click the purple 'AI Risk Analysis' button on the same borrower page for a fuller AI-generated narrative including regulatory flags, recommended actions, and a comparison against the country peer group.", tip: "The Predictive Default Risk card uses the ML model output; the AI Risk Analysis uses the language model — they complement each other." },
      { title: "Use the Portfolio Intelligence view for cohort analysis", description: "Click 'Portfolio Intelligence' in the sidebar. Filter by Risk Level = High to see all High-risk borrowers in your portfolio ranked by default probability. Use this for proactive outreach before defaults occur.", path: "/portfolio-intelligence" },
      { title: "Understand the model's African training data", description: "Navigate to 'Score Methodology' and select the 'ML Model' tab. The model was trained on payment history from 18 African markets, open banking transaction patterns, telco payment data, and cross-lender exposure records — specifically calibrated for African economic cycles and informal income patterns.", path: "/score-methodology" },
      { title: "Export High-risk borrowers for intervention", description: "From 'Export Center', select 'High-Risk Borrower Extract'. This produces a CSV of all borrowers with a 90-day default probability above your configured threshold — ready for your collections or relationship management team.", path: "/export-center" },
    ],
  },
];

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function AppGuidePage() {
  const [, setLocation] = useLocation();
  const { accent: primary } = useBrandColors();
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    if (selectedRole === "all") return GUIDES;
    return GUIDES.filter((g) => g.roles.includes(selectedRole as UserRole));
  }, [selectedRole]);

  const roleButtons: { value: UserRole | "all"; label: string }[] = [
    { value: "all", label: "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Administrator" },
    { value: "lender", label: "Lender" },
    { value: "regulator", label: "Regulator" },
    { value: "viewer", label: "Viewer" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: withAlpha(primary, 0.15) }}>
              <BookOpen className="w-5 h-5" style={{ color: primary }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Step-by-Step Platform Guide</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pick your role to see exactly what you need to learn</p>
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Filter by Role</p>
          <div className="flex flex-wrap gap-2">
            {roleButtons.map((rb) => {
              const isActive = selectedRole === rb.value;
              const cfg = rb.value !== "all" ? ROLE_CONFIG[rb.value as UserRole] : null;
              return (
                <button
                  key={rb.value}
                  onClick={() => { setSelectedRole(rb.value); setOpenGuide(null); }}
                  data-testid={`role-filter-${rb.value}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    isActive
                      ? "border-transparent text-white shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  style={isActive ? { backgroundColor: primary } : {}}
                >
                  {rb.label}
                </button>
              );
            })}
          </div>

          {/* Role description */}
          {selectedRole !== "all" && (
            <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${ROLE_CONFIG[selectedRole as UserRole].bg} ${ROLE_CONFIG[selectedRole as UserRole].color}`}>
              <Lightbulb className="w-4 h-4 flex-shrink-0" />
              {ROLE_CONFIG[selectedRole as UserRole].description}
            </div>
          )}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredGuides.length}</span> guide{filteredGuides.length !== 1 ? "s" : ""}
          {selectedRole !== "all" ? ` for ${ROLE_CONFIG[selectedRole as UserRole].label}` : ""}
        </p>

        {/* Guide Cards */}
        <div className="space-y-3">
          {filteredGuides.map((guide) => {
            const Icon = guide.icon;
            const isOpen = openGuide === guide.id;
            return (
              <div
                key={guide.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Card Header */}
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setOpenGuide(isOpen ? null : guide.id)}
                  data-testid={`guide-card-${guide.id}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${guide.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{guide.title}</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{guide.steps.length} steps</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{guide.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {guide.roles.map((r) => <RoleBadge key={r} role={r} />)}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Steps Panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4">
                    <ol className="space-y-4">
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-4" data-testid={`guide-step-${guide.id}-${idx}`}>
                          {/* Step number */}
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                            style={{ backgroundColor: primary }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{step.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                                {step.tip && (
                                  <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    <span>{step.tip}</span>
                                  </div>
                                )}
                              </div>
                              {step.path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs flex-shrink-0 h-7 px-3"
                                  onClick={() => setLocation(step.path!)}
                                  data-testid={`guide-goto-${guide.id}-${idx}`}
                                >
                                  Go there <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {guide.roles.map((r) => <RoleBadge key={r} role={r} />)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-gray-400"
                        onClick={() => setOpenGuide(null)}
                      >
                        Collapse
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <div className="mt-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: withAlpha(primary, 0.12) }}>
            <BookOpen className="w-5 h-5" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Want deeper reading?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              The full technical documentation, API reference, and training modules are available below.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setLocation("/training")} data-testid="link-training-center">
                Training Center
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLocation("/docs")} data-testid="link-documentation">
                Full Documentation
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLocation("/api-docs")} data-testid="link-api-docs">
                API Reference
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
