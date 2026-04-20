import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Rocket,
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  CheckSquare,
  AlertCircle,
  Gavel,
  FileCheck,
  Building2,
  Receipt,
  Headset,
  Upload,
  Shield,
  Settings,
  Key,
  Globe,
  BarChart3,
  Bell,
  HelpCircle,
  Lock,
  Smartphone,
  Eye,
  Brain,
  Network,
  UserCheck,
  Activity,
  Server,
} from "lucide-react";

interface HelpSection {
  id: string;
  icon: typeof Rocket;
  title: string;
  description: string;
  steps: string[];
  roles?: string[];
}

function getHelpSections(t: TFunction): HelpSection[] {
  return [
    {
      id: "getting-started",
      icon: Rocket,
      title: t("manual.gettingStarted.title", "Getting Started"),
      description: t("manual.gettingStarted.desc", "Learn how to log in, navigate the system, switch languages, and manage your session."),
      steps: [
        t("manual.gettingStarted.s1", "Navigate to the system URL provided by your administrator."),
        t("manual.gettingStarted.s2", "Enter your username and password on the login page and click 'Sign In'."),
        t("manual.gettingStarted.s3", "Alternatively, sign in using Google, Microsoft, Apple, or Enterprise SSO via the social login buttons below the form."),
        t("manual.gettingStarted.s4", "If prompted, change your password on first login (must be 8+ characters with uppercase, lowercase, digit, and special character)."),
        t("manual.gettingStarted.s5", "After login, enable Multi-Factor Authentication (MFA/TOTP) from your profile for extra security using any authenticator app (e.g., Google Authenticator, Authy)."),
        t("manual.gettingStarted.s6", "Use the language switcher in the top header to toggle between five languages — English, French, Portuguese, Arabic, and Swahili."),
        t("manual.gettingStarted.s7", "Use the theme toggle (sun/moon icon) to switch between light and dark mode."),
        t("manual.gettingStarted.s8", "Navigate using the sidebar on the left — click the hamburger icon to collapse/expand it. The sidebar is organized into twelve sections: Overview, Credit Data, Reports & Scoring, Data Management, Workflows, Intelligence, Oversight & Compliance, Cross-Border, Administration, API & Integrations, Infrastructure, and Help & Resources. Sections and items you don't have access to are automatically hidden based on your role."),
        t("manual.gettingStarted.s9", "Your session will automatically expire after 15 minutes of inactivity. You will be redirected to the login page."),
        t("manual.gettingStarted.s10", "Click the logout button (arrow icon) in the top-right header to sign out manually."),
      ],
    },
    {
      id: "dashboard",
      icon: LayoutDashboard,
      title: t("manual.dashboard.title", "Dashboard"),
      description: t("manual.dashboard.desc", "Understand the stat cards, charts, Africa map, and how to drill down into system metrics."),
      steps: [
        t("manual.dashboard.s1", "The dashboard displays summary stat cards: Total Borrowers, Credit Accounts, Active Disputes, and Pending Approvals — each with a sparkline showing 7-day trends."),
        t("manual.dashboard.s2", "Click any stat card to open a detail sheet showing the underlying records."),
        t("manual.dashboard.s3", "Items in the detail sheet are clickable — they navigate to the relevant detail page."),
        t("manual.dashboard.s4", "Below the cards, interactive charts show 12-month portfolio growth, account status breakdown (Current, Delinquent, Default), and distribution by loan type."),
        t("manual.dashboard.s5", "The interactive Africa map shows all 54 countries color-coded by activity level. Hover over any country for borrower and account counts."),
        t("manual.dashboard.s6", "The 'Recent Credit Accounts' section shows the latest loan activity across all institutions."),
        t("manual.dashboard.s7", "The 'Recent Activity' section shows the most recent audit trail entries."),
        t("manual.dashboard.s8", "All data refreshes automatically when you navigate back to the dashboard."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "borrowers",
      icon: Users,
      title: t("manual.borrowers.title", "Consumers & Business Management"),
      description: t("manual.borrowers.desc", "Register, search, and manage individual consumers and corporate business borrower records."),
      steps: [
        t("manual.borrowers.s1", "The system separates borrowers into 'Consumers' (individuals) and 'Businesses' (corporates) — each with a dedicated list view in the sidebar."),
        t("manual.borrowers.s2", "Super Admins also see a combined 'Borrowers (All)' view showing all record types."),
        t("manual.borrowers.s3", "Use the search bar to filter by name, national ID, phone, or email."),
        t("manual.borrowers.s4", "Click 'Register Borrower' to add a new record. Select Individual or Corporate."),
        t("manual.borrowers.s5", "For individuals: fill in first name, last name, national ID, date of birth, gender, phone, email, address, city, region, employer, occupation."),
        t("manual.borrowers.s6", "For corporates: fill in company name, business registration number, national ID/TIN, sector, phone, email, address, city, region."),
        t("manual.borrowers.s7", "Toggle the PEP (Politically Exposed Person) flag if applicable and provide details."),
        t("manual.borrowers.s8", "Set education level, institution, and employment history as needed."),
        t("manual.borrowers.s9", "New registrations are submitted through the maker-checker workflow — a different authorized user must approve the change. A pending-approval amber banner appears on records awaiting review."),
        t("manual.borrowers.s10", "Click any row to view the full detail page with credit accounts, inquiries, court judgments, consent records, AI Risk Analysis, and credit report generation."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "consumer-portal",
      icon: UserCheck,
      title: t("manual.consumerPortal.title", "Consumer Self-Service Portal"),
      description: t("manual.consumerPortal.desc", "How individuals can register, check their own credit, and file disputes."),
      steps: [
        t("manual.consumerPortal.s1", "The Consumer Portal is available at '/my-credit' — it lets individuals check their own credit standing."),
        t("manual.consumerPortal.s2", "Consumers register directly via '/consumer/register' with their national ID and personal details — no admin setup needed."),
        t("manual.consumerPortal.s3", "Once registered, consumers see their credit score, active credit accounts, dispute history, and consent records."),
        t("manual.consumerPortal.s4", "Consumers can file disputes directly from the portal if they find incorrect information."),
        t("manual.consumerPortal.s5", "The portal is a read-only view of credit data — consumers cannot modify records."),
        t("manual.consumerPortal.s6", "The portal supports all five platform languages (EN, FR, PT, AR, SW)."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "credit-accounts",
      icon: CreditCard,
      title: t("manual.creditAccounts.title", "Credit Accounts"),
      description: t("manual.creditAccounts.desc", "Create and manage loan records with 42+ currency support."),
      steps: [
        t("manual.creditAccounts.s1", "Navigate to 'Credit Accounts' in the sidebar."),
        t("manual.creditAccounts.s2", "Click 'Add Account' to create a new credit account."),
        t("manual.creditAccounts.s3", "Select the borrower from the dropdown list."),
        t("manual.creditAccounts.s4", "Enter lender institution, account number, and select the account type (Personal Loan, Mortgage, Vehicle Loan, Business Loan, etc.)."),
        t("manual.creditAccounts.s5", "Set the account status: Current, Delinquent, Default, Closed, Restructured, or Written Off."),
        t("manual.creditAccounts.s6", "Enter original amount, current balance, and interest rate."),
        t("manual.creditAccounts.s7", "Select the currency from 42+ supported currencies (ETB, GHS, UGX, LRD, USD, EUR, GBP, KES, TZS, RWF, NGN, ZAR, XOF, XAF, EGP, MAD, CNY, and many more)."),
        t("manual.creditAccounts.s8", "Set disbursement date, maturity date, collateral type, and collateral value."),
        t("manual.creditAccounts.s9", "Toggle 'Interest Free' for Sharia-compliant or interest-free loans."),
        t("manual.creditAccounts.s10", "Set grace period (months) and restructure count if applicable."),
        t("manual.creditAccounts.s11", "The payment history grid shows 12 periods of payment performance per account."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender"],
    },
    {
      id: "credit-search",
      icon: Search,
      title: t("manual.creditSearch.title", "Credit Search"),
      description: t("manual.creditSearch.desc", "Structured search with Consumer, Business, Telco, and General tabs."),
      steps: [
        t("manual.creditSearch.s1", "Navigate to 'Credit Search' in the sidebar."),
        t("manual.creditSearch.s2", "The search page has four structured tabs — Consumer, Business, Telco, and General."),
        t("manual.creditSearch.s3", "Consumer tab: search by name, national ID, phone number, or email to find individual borrowers."),
        t("manual.creditSearch.s4", "Business tab: search by company name, registration number, or TIN to find corporate borrowers."),
        t("manual.creditSearch.s5", "Telco tab: search telco subscriber profiles by provider, MSISDN, or account ID."),
        t("manual.creditSearch.s6", "General tab: broad cross-entity search across all record types."),
        t("manual.creditSearch.s7", "Click 'View Report' next to a result to generate their full credit report."),
        t("manual.creditSearch.s8", "Credit reports include personal/company information, credit score (300-850), reason codes, all credit accounts, payment history, court judgments, and consent records."),
        t("manual.creditSearch.s9", "Business borrowers get a separate Business Credit Report format with corporate-specific sections."),
        t("manual.creditSearch.s10", "PDF reports can be downloaded in all five languages using the language selector."),
        t("manual.creditSearch.s11", "All searches are logged in the audit trail for compliance."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "score-methodology",
      icon: BarChart3,
      title: t("manual.scoreMethodology.title", "Score Methodology"),
      description: t("manual.scoreMethodology.desc", "Understand how credit scores are calculated and what each grade means."),
      steps: [
        t("manual.scoreMethodology.s1", "Navigate to 'Score Methodology' in the sidebar to view the scoring model."),
        t("manual.scoreMethodology.s2", "Credit scores range from 300 to 850 using a weighted factor model."),
        t("manual.scoreMethodology.s3", "Scoring factors include: payment history, credit utilization, length of credit history, credit mix, and new inquiries."),
        t("manual.scoreMethodology.s4", "Grade bands: 750–850 Excellent, 670–749 Good, 580–669 Fair, 450–579 Poor, 300–449 Very Poor."),
        t("manual.scoreMethodology.s5", "Reason codes explain specific factors affecting each borrower's score (e.g., DELINQUENT_ACCOUNTS, HIGH_DEBT_LEVEL)."),
        t("manual.scoreMethodology.s6", "A public Score Guide is available at '/score-guide' for external stakeholders."),
      ],
      roles: ["super_admin", "admin", "lender"],
    },
    {
      id: "telco",
      icon: Smartphone,
      title: t("manual.telco.title", "Telco Scoring & Lending"),
      description: t("manual.telco.desc", "Mobile network data for alternative credit scoring and micro-lending."),
      steps: [
        t("manual.telco.s1", "Navigate to 'Telco Scoring' in the sidebar to view and score telco subscriber profiles."),
        t("manual.telco.s2", "Telco scores are based on airtime usage, mobile money transactions, top-up frequency, and data consumption."),
        t("manual.telco.s3", "These alternative credit scores serve the unbanked population who lack traditional credit history."),
        t("manual.telco.s4", "Navigate to 'Telco Lending' to manage micro-loans originated through telco channels."),
        t("manual.telco.s5", "Telco lending uses automated decisioning based on telco scores."),
        t("manual.telco.s6", "Search telco profiles by provider, MSISDN, or account ID — empty filters browse all profiles."),
        t("manual.telco.s7", "Telco scores complement traditional bureau scores for a more complete credit picture."),
      ],
      roles: ["super_admin", "admin", "lender", "regulator"],
    },
    {
      id: "maker-checker",
      icon: CheckSquare,
      title: t("manual.makerChecker.title", "Maker-Checker Workflow"),
      description: t("manual.makerChecker.desc", "How data changes are submitted, reviewed, and approved."),
      steps: [
        t("manual.makerChecker.s1", "When you create or modify a borrower record, the change is submitted as a 'pending approval' rather than applied immediately."),
        t("manual.makerChecker.s2", "Navigate to 'Pending Approvals' in the sidebar to see all submitted changes."),
        t("manual.makerChecker.s3", "Each approval shows the entity type, action, and submission timestamp."),
        t("manual.makerChecker.s4", "Click 'Review' to open the change request details."),
        t("manual.makerChecker.s5", "Review the payload data showing the proposed changes."),
        t("manual.makerChecker.s6", "Add optional review notes explaining your decision."),
        t("manual.makerChecker.s7", "Click 'Approve' to accept the change or 'Reject' to deny it."),
        t("manual.makerChecker.s8", "Self-approval prevention: You cannot approve a change that you submitted. A different authorized user must review it."),
        t("manual.makerChecker.s9", "Only Admin, Regulator, and Super Admin roles can approve or reject changes."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "disputes",
      icon: AlertCircle,
      title: t("manual.disputes.title", "Dispute Management"),
      description: t("manual.disputes.desc", "File, track, and resolve data disputes with SLA tracking."),
      steps: [
        t("manual.disputes.s1", "Navigate to 'Disputes' in the sidebar."),
        t("manual.disputes.s2", "Click 'File Dispute' to create a new dispute."),
        t("manual.disputes.s3", "Select the borrower and optionally the credit account involved."),
        t("manual.disputes.s4", "Choose the dispute type: Data Error, Identity Theft, Unauthorized Inquiry, Duplicate Record, Incorrect Balance, Wrong Status, or Other."),
        t("manual.disputes.s5", "Select the correction type: Financial (2-day SLA) or Non-Financial (5-day SLA)."),
        t("manual.disputes.s6", "Provide a detailed description of the issue."),
        t("manual.disputes.s7", "The system automatically calculates the SLA deadline based on the correction type."),
        t("manual.disputes.s8", "Disputes progress through statuses: Open, Under Review, Resolved, or Rejected."),
        t("manual.disputes.s9", "If the SLA deadline passes without resolution, the dispute is marked as 'BREACHED'."),
        t("manual.disputes.s10", "To resolve a dispute, click it and enter resolution notes."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "borrower-alerts",
      icon: Bell,
      title: t("manual.borrowerAlerts.title", "Borrower Alerts"),
      description: t("manual.borrowerAlerts.desc", "System-generated alerts for significant borrower events."),
      steps: [
        t("manual.borrowerAlerts.s1", "Navigate to 'Borrower Alerts' in the sidebar."),
        t("manual.borrowerAlerts.s2", "View alerts for new delinquencies, status changes, large balance movements, PEP flag changes, and SLA breaches."),
        t("manual.borrowerAlerts.s3", "Alerts are color-coded by severity: High (red), Medium (amber), Low (blue)."),
        t("manual.borrowerAlerts.s4", "Filter alerts by type, date range, or institution."),
        t("manual.borrowerAlerts.s5", "Click any alert to navigate to the borrower or record that triggered it."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "court-judgments",
      icon: Gavel,
      title: t("manual.courtJudgments.title", "Court Judgments"),
      description: t("manual.courtJudgments.desc", "Record and track court judgments, liens, and bankruptcies."),
      steps: [
        t("manual.courtJudgments.s1", "Court judgments are visible on the borrower detail page under 'Court Judgments'."),
        t("manual.courtJudgments.s2", "To add a judgment, use the form on the borrower detail page or via the API."),
        t("manual.courtJudgments.s3", "Enter the case number, court name, and judgment type (Lien, Bankruptcy, Lawsuit, Civil, Criminal)."),
        t("manual.courtJudgments.s4", "Specify the judgment amount, date, and current status (Active, Satisfied, Vacated, Appealed)."),
        t("manual.courtJudgments.s5", "Court judgments affect the borrower's credit score and appear on credit reports."),
        t("manual.courtJudgments.s6", "Only Admin, Regulator, and Super Admin roles can create court judgments."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "consent",
      icon: FileCheck,
      title: t("manual.consent.title", "Consent Management"),
      description: t("manual.consent.desc", "Grant, track, and revoke data subject consent with receipt numbers."),
      steps: [
        t("manual.consent.s1", "Navigate to 'Consent Management' in the sidebar."),
        t("manual.consent.s2", "Click 'Grant Consent' to create a new consent record."),
        t("manual.consent.s3", "Enter the borrower ID and specify who consent is granted to."),
        t("manual.consent.s4", "Select the purpose of consent and the consent type: Data Collection, Data Sharing, or Credit Inquiry."),
        t("manual.consent.s5", "Each consent record is assigned a unique receipt number in format CR-{timestamp}-{random}."),
        t("manual.consent.s6", "The status shows as 'Active' for current consent or 'Revoked' if withdrawn."),
        t("manual.consent.s7", "To revoke consent, click the 'Revoke' button on an active consent record."),
        t("manual.consent.s8", "Consent records appear on the borrower's credit report."),
        t("manual.consent.s9", "Filter consent records by borrower ID using the filter field."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "portfolio-intelligence",
      icon: BarChart3,
      title: t("manual.portfolioIntelligence.title", "Portfolio Intelligence"),
      description: t("manual.portfolioIntelligence.desc", "AI-driven portfolio analytics with deep-dive analysis."),
      steps: [
        t("manual.portfolioIntelligence.s1", "Navigate to 'Portfolio Intelligence' in the sidebar."),
        t("manual.portfolioIntelligence.s2", "View concentration risk, sector exposure, geographic distribution, and vintage analysis."),
        t("manual.portfolioIntelligence.s3", "AI-generated insights highlight emerging risks and opportunities across your credit book."),
        t("manual.portfolioIntelligence.s4", "Trend forecasting helps predict portfolio performance."),
        t("manual.portfolioIntelligence.s5", "Available to Admin, Super Admin, and Regulator roles."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "ai-command-center",
      icon: Brain,
      title: t("manual.aiCommandCenter.title", "AI Command Center"),
      description: t("manual.aiCommandCenter.desc", "Natural-language interface to query and analyze registry data."),
      steps: [
        t("manual.aiCommandCenter.s1", "Navigate to 'AI Command Center' in the sidebar."),
        t("manual.aiCommandCenter.s2", "Type natural-language questions like 'Show me all defaulted borrowers in Ghana' or 'What is the NPL ratio for microfinance institutions?'"),
        t("manual.aiCommandCenter.s3", "The AI interprets your query, runs the appropriate analysis, and returns formatted results with charts and tables."),
        t("manual.aiCommandCenter.s4", "It combines GPT-4o intelligence with real-time registry data."),
        t("manual.aiCommandCenter.s5", "Use it for ad-hoc analysis, regulatory queries, or quick data lookups."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "regulatory-dashboard",
      icon: Eye,
      title: t("manual.regulatoryDashboard.title", "Regulatory Dashboard"),
      description: t("manual.regulatoryDashboard.desc", "High-level supervisory overview for regulators and senior management."),
      steps: [
        t("manual.regulatoryDashboard.s1", "Navigate to 'Regulatory Dashboard' in the sidebar."),
        t("manual.regulatoryDashboard.s2", "See NPL ratios across institutions, data submission compliance rates, and dispute resolution performance."),
        t("manual.regulatoryDashboard.s3", "View sector exposure breakdowns and institutional comparisons."),
        t("manual.regulatoryDashboard.s4", "This dashboard is designed for a panoramic view of credit market health across jurisdictions."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "compliance",
      icon: Eye,
      title: t("manual.compliance.title", "Regulatory Compliance"),
      description: t("manual.compliance.desc", "Compliance metrics with traffic-light indicators and AI-powered reports."),
      steps: [
        t("manual.compliance.s1", "Navigate to 'Regulatory Compliance' in the sidebar."),
        t("manual.compliance.s2", "View compliance metrics: data submission rates, dispute resolution SLA performance, consent coverage, and NPL ratios."),
        t("manual.compliance.s3", "Traffic-light indicators show green (compliant), yellow (at risk), or red (non-compliant)."),
        t("manual.compliance.s4", "Use the 'Generate AI Compliance Report' button with the country selector to produce an AI-powered compliance assessment for any of the 54 African jurisdictions."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "bog-bsl-export",
      icon: FileText,
      title: t("manual.bogBslExport.title", "Regulatory Export (BOG / BSL)"),
      description: t("manual.bogBslExport.desc", "Generate regulatory submission files for central banks."),
      steps: [
        t("manual.bogBslExport.s1", "Depending on your country mode, the sidebar shows either 'BOG Export' (Bank of Ghana) or 'BSL Export' (Bank of Sierra Leone)."),
        t("manual.bogBslExport.s2", "Generate regulatory submission files in the format required by the central bank."),
        t("manual.bogBslExport.s3", "BOG Export follows BoG CRB v1.1 standards for Ghana."),
        t("manual.bogBslExport.s4", "BSL Export follows Bank of Sierra Leone reporting standards."),
        t("manual.bogBslExport.s5", "Files include batch upload data, borrower records, and credit accounts formatted per regulatory requirements."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "cross-border",
      icon: Network,
      title: t("manual.crossBorder.title", "Cross-Border Features"),
      description: t("manual.crossBorder.desc", "Pan-African data sharing, cross-border search, and PAPSS settlements."),
      steps: [
        t("manual.crossBorder.s1", "The Cross-Border section enables pan-African data sharing (requires valid data-sharing agreement)."),
        t("manual.crossBorder.s2", "'Agreements' manages bilateral and multilateral data-sharing agreements between countries."),
        t("manual.crossBorder.s3", "'Cross-Border Search' lets authorized users search borrower records across jurisdictions for cross-border entity resolution."),
        t("manual.crossBorder.s4", "'PAPSS Settlements' integrates with the Pan-African Payment and Settlement System for cross-border payment tracking and reconciliation."),
        t("manual.crossBorder.s5", "Access is controlled per user role and agreement scope."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender"],
    },
    {
      id: "institutions",
      icon: Building2,
      title: t("manual.institutions.title", "Institution Management"),
      description: t("manual.institutions.desc", "Register and approve data provider institutions."),
      steps: [
        t("manual.institutions.s1", "Navigate to 'Institutions' in the sidebar (Admin/Super Admin only)."),
        t("manual.institutions.s2", "Click 'Register Institution' to add a new data provider."),
        t("manual.institutions.s3", "Enter the institution name, type (Bank, MFI, Utility, Telecom, Digital Lender, SACCO), and registration number."),
        t("manual.institutions.s4", "Select the country and set the submission frequency (Daily, Weekly, Monthly)."),
        t("manual.institutions.s5", "Provide contact email, phone, and address."),
        t("manual.institutions.s6", "Newly registered institutions start with 'Pending' status."),
        t("manual.institutions.s7", "Click 'Approve' on a pending institution to activate it."),
        t("manual.institutions.s8", "Approved institutions can be assigned API keys for programmatic data submission."),
      ],
      roles: ["super_admin", "admin"],
    },
    {
      id: "billing",
      icon: Receipt,
      title: t("manual.billing.title", "Billing"),
      description: t("manual.billing.desc", "Create invoices and track payments for data provider institutions."),
      steps: [
        t("manual.billing.s1", "Navigate to 'Billing' in the sidebar (Admin/Regulator only)."),
        t("manual.billing.s2", "View summary cards showing Total Revenue, Pending Amount, and Overdue Amount."),
        t("manual.billing.s3", "Click 'Create Invoice' to generate a new invoice."),
        t("manual.billing.s4", "Select the institution and service type (Data Submission, Credit Report, API Access, Subscription)."),
        t("manual.billing.s5", "Enter the amount, currency, and billing period (start and end dates)."),
        t("manual.billing.s6", "Track invoice payment status: Pending, Paid, or Overdue."),
        t("manual.billing.s7", "Click any billing row to view detailed invoice information."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "helpdesk",
      icon: Headset,
      title: t("manual.helpdesk.title", "Helpdesk"),
      description: t("manual.helpdesk.desc", "Inquiry Service Unit portal for consumer dispute and consent management."),
      steps: [
        t("manual.helpdesk.s1", "Navigate to 'Helpdesk' in the sidebar."),
        t("manual.helpdesk.s2", "Use the search bar to find a borrower by name, national ID, or TIN."),
        t("manual.helpdesk.s3", "Select a borrower from the search results to view their information."),
        t("manual.helpdesk.s4", "View the borrower's existing disputes and consent records."),
        t("manual.helpdesk.s5", "Use 'File Dispute' to create a dispute on behalf of the borrower."),
        t("manual.helpdesk.s6", "Use 'Grant Consent' to create a consent record from the helpdesk."),
        t("manual.helpdesk.s7", "Summary cards show Open Inquiries, SLA Breaches, and Resolved Today counts."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "batch-upload",
      icon: Upload,
      title: t("manual.batchUpload.title", "Batch Upload"),
      description: t("manual.batchUpload.desc", "Upload credit account data in bulk via JSON or CSV files."),
      steps: [
        t("manual.batchUpload.s1", "Navigate to 'Batch Upload' in the sidebar."),
        t("manual.batchUpload.s2", "Click 'Upload Data' or drag and drop a JSON or CSV file."),
        t("manual.batchUpload.s3", "Alternatively, paste JSON data directly into the text area."),
        t("manual.batchUpload.s4", "Click 'Submit Batch' to process the upload."),
        t("manual.batchUpload.s5", "The system validates each record individually — valid records are imported, invalid ones are rejected."),
        t("manual.batchUpload.s6", "View the upload results showing counts of succeeded and failed records."),
        t("manual.batchUpload.s7", "For failed records, review the error report showing the row number and specific error message."),
        t("manual.batchUpload.s8", "Use the 'Sample Format' section to see the expected data structure."),
      ],
      roles: ["super_admin", "admin", "lender"],
    },
    {
      id: "audit-trail",
      icon: Shield,
      title: t("manual.auditTrail.title", "Audit Trail"),
      description: t("manual.auditTrail.desc", "View complete activity logs with SHA-256 hash chaining."),
      steps: [
        t("manual.auditTrail.s1", "Navigate to 'Audit Trail' in the sidebar (Admin/Regulator/Super Admin only)."),
        t("manual.auditTrail.s2", "View the chronological list of all system activities."),
        t("manual.auditTrail.s3", "Each entry shows: timestamp, action type, entity, details, IP address, and user ID."),
        t("manual.auditTrail.s4", "The audit log uses SHA-256 hash chaining — entries cannot be tampered with."),
        t("manual.auditTrail.s5", "Toggle between table and timeline views."),
        t("manual.auditTrail.s6", "Use date range filters to narrow results."),
        t("manual.auditTrail.s7", "Export filtered records as CSV or Excel using the export buttons."),
        t("manual.auditTrail.s8", "All user actions including logins, data changes, approvals, and API calls are logged."),
      ],
      roles: ["super_admin", "admin", "regulator"],
    },
    {
      id: "user-management",
      icon: Settings,
      title: t("manual.userManagement.title", "User Management"),
      description: t("manual.userManagement.desc", "Create and manage system users with five roles and MFA support."),
      steps: [
        t("manual.userManagement.s1", "Navigate to 'User Management' in the sidebar (Admin/Super Admin only)."),
        t("manual.userManagement.s2", "Click 'Add User' to create a new system user."),
        t("manual.userManagement.s3", "Enter username, password, full name, email, and institution."),
        t("manual.userManagement.s4", "Assign one of five roles: Super Admin (multi-country full access), Admin (full access within country), Regulator (compliance + approvals), Lender (data entry for own institution), or Viewer (read-only)."),
        t("manual.userManagement.s5", "Set the user status: Active, Suspended, or Deactivated."),
        t("manual.userManagement.s6", "Click any user row to edit their details."),
        t("manual.userManagement.s7", "Password policy: 8+ characters, uppercase, lowercase, digit, special character."),
        t("manual.userManagement.s8", "Passwords expire after 90 days — users are prompted to change them."),
        t("manual.userManagement.s9", "Accounts lock after 3 failed login attempts for 15 minutes."),
        t("manual.userManagement.s10", "Users can enable MFA/TOTP from their profile for two-factor authentication."),
      ],
      roles: ["super_admin", "admin"],
    },
    {
      id: "command-center",
      icon: Server,
      title: t("manual.commandCenter.title", "Command Center & Organizations"),
      description: t("manual.commandCenter.desc", "Multi-country management console for Super Admins."),
      steps: [
        t("manual.commandCenter.s1", "Navigate to 'Command Center' in the sidebar (Super Admin only)."),
        t("manual.commandCenter.s2", "The Command Center is a multi-country management console for overseeing all jurisdictions."),
        t("manual.commandCenter.s3", "Switch country contexts, manage system-wide settings, and view cross-country metrics."),
        t("manual.commandCenter.s4", "'Organizations' manages top-level organizational entities that group institutions."),
        t("manual.commandCenter.s5", "These features are exclusive to the Super Admin role for centralized platform governance."),
      ],
      roles: ["super_admin"],
    },
    {
      id: "system-admin",
      icon: Activity,
      title: t("manual.systemAdmin.title", "System Administration"),
      description: t("manual.systemAdmin.desc", "System status, backups, webhooks, retention policies, and platform metrics."),
      steps: [
        t("manual.systemAdmin.s1", "'System Status' shows real-time health of all services — database, API, background jobs, and integrations with green/yellow/red indicators."),
        t("manual.systemAdmin.s2", "'Backup & Recovery' (Super Admin) manages database backups with restore capabilities. Backups can be triggered manually or run on schedule."),
        t("manual.systemAdmin.s3", "'Webhook Management' configures outbound event notifications to external systems. Webhooks notify external systems of key events in real time."),
        t("manual.systemAdmin.s4", "'Retention Policies' sets data retention rules per regulation."),
        t("manual.systemAdmin.s5", "'Platform Metrics' tracks system-wide usage statistics including API call volume and user activity."),
        t("manual.systemAdmin.s6", "'Exchange Rates' manages 42+ African currencies. View current rates, update manually, or let the system auto-sync every 6 hours."),
      ],
      roles: ["super_admin", "admin"],
    },
    {
      id: "api-keys",
      icon: Key,
      title: t("manual.apiKeys.title", "API Key Management"),
      description: t("manual.apiKeys.desc", "Generate and manage API keys for external institution access."),
      steps: [
        t("manual.apiKeys.s1", "Navigate to 'API Keys' in the sidebar (Admin/Super Admin only)."),
        t("manual.apiKeys.s2", "Click 'Generate Key' to create a new API key."),
        t("manual.apiKeys.s3", "Select the institution the key belongs to (must be an approved institution)."),
        t("manual.apiKeys.s4", "Enter a label (e.g., 'Production Key', 'Test Key')."),
        t("manual.apiKeys.s5", "Choose the permission level: Submit Only, Read Only, or Full Access."),
        t("manual.apiKeys.s6", "Copy the generated API key immediately — it will not be shown again."),
        t("manual.apiKeys.s7", "The key prefix (e.g., sim_xxxxxxxx) is displayed for identification."),
        t("manual.apiKeys.s8", "Track last-used timestamps to monitor key activity."),
        t("manual.apiKeys.s9", "Click 'Revoke' to permanently disable a key."),
      ],
      roles: ["super_admin", "admin"],
    },
    {
      id: "external-api",
      icon: Globe,
      title: t("manual.externalApi.title", "External API"),
      description: t("manual.externalApi.desc", "Programmatic data submission and retrieval via REST API."),
      steps: [
        t("manual.externalApi.s1", "All external API endpoints are under /api/external/v1/."),
        t("manual.externalApi.s2", "Authenticate requests with the X-API-Key header containing your issued API key."),
        t("manual.externalApi.s3", "POST /borrowers — Create borrower records (single or batch array)."),
        t("manual.externalApi.s4", "GET /borrowers/search — Search borrowers by national ID, name, or query."),
        t("manual.externalApi.s5", "GET /borrowers/:id/credit-report — Generate a full credit report with score."),
        t("manual.externalApi.s6", "POST /credit-accounts — Submit credit account data (single or batch)."),
        t("manual.externalApi.s7", "POST /payment-history — Submit payment history records."),
        t("manual.externalApi.s8", "POST /court-judgments — Submit court judgment records."),
        t("manual.externalApi.s9", "GET /health — Check API availability (no authentication required)."),
        t("manual.externalApi.s10", "View the full API documentation at '/api-docs' (publicly accessible)."),
      ],
      roles: ["super_admin", "admin"],
    },
    {
      id: "ai-features",
      icon: Brain,
      title: t("manual.aiFeatures.title", "AI-Powered Features"),
      description: t("manual.aiFeatures.desc", "AI risk analysis, AI report summaries, and the AI chatbot assistant."),
      steps: [
        t("manual.aiFeatures.s1", "On any borrower's detail page, click the purple 'AI Risk Analysis' button for an AI-powered risk assessment with score, risk factors, and recommendations."),
        t("manual.aiFeatures.s2", "On credit reports, use 'AI Summary' for a plain-language overview of the borrower's credit profile."),
        t("manual.aiFeatures.s3", "The floating chatbot (bottom-right corner) lets you ask questions, file disputes, or browse FAQs without leaving the page."),
        t("manual.aiFeatures.s4", "Click the Sparkles icon in the chatbot to switch to AI Assistant mode — it uses GPT-4o to answer questions about credit data, regulations, and system features."),
        t("manual.aiFeatures.s5", "AI analysis considers all borrower data including accounts, disputes, and payment history."),
        t("manual.aiFeatures.s6", "AI responses are generated fresh each time based on current data."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "reports",
      icon: BarChart3,
      title: t("manual.reports.title", "Reports & Export"),
      description: t("manual.reports.desc", "Generate portfolio analytics and export data as CSV or Excel."),
      steps: [
        t("manual.reports.s1", "Navigate to 'Credit Reports' in the sidebar."),
        t("manual.reports.s2", "View summary cards: Registered Borrowers, Total Exposure, Non-performing, NPL Ratio."),
        t("manual.reports.s3", "Review the 'Portfolio by Institution' breakdown showing exposure per lender."),
        t("manual.reports.s4", "Review the 'Portfolio by Loan Type' breakdown showing exposure per product."),
        t("manual.reports.s5", "Click 'Export Portfolio CSV' to download portfolio data as a CSV file."),
        t("manual.reports.s6", "Click 'Export Borrowers CSV' to download borrower data as a CSV file."),
        t("manual.reports.s7", "Export as Excel (XLSX) for formatted headers with teal styling."),
        t("manual.reports.s8", "Regulatory analytics include NPL ratios, portfolio breakdowns, and SLA breach tracking."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("manual.notifications.title", "Notifications"),
      description: t("manual.notifications.desc", "Stay informed about approvals, disputes, and system alerts."),
      steps: [
        t("manual.notifications.s1", "The notification bell in the top header shows the count of unread notifications."),
        t("manual.notifications.s2", "Click the bell icon to view your notifications."),
        t("manual.notifications.s3", "Notifications are generated for: approval requests, approval results, dispute filings, and system alerts."),
        t("manual.notifications.s4", "Click a notification to mark it as read and navigate to the relevant page."),
        t("manual.notifications.s5", "Use 'Mark all read' to clear all unread notification badges."),
        t("manual.notifications.s6", "Notifications are sorted with the most recent first."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "documents",
      icon: FileText,
      title: t("manual.documents.title", "Documentation & Resources"),
      description: t("manual.documents.desc", "Downloadable documents, Ghana-specific docs, app guide, and version history."),
      steps: [
        t("manual.documents.s1", "Navigate to 'Documentation' in the sidebar to access general documents — API Guide, UAT, Systems, Users Manual, SRS Matrix, Data Dictionary, Deployment Guide, Security Report, Security Policy, DR Plan, Change Management, Pentest Readiness, and Liberia Proposal."),
        t("manual.documents.s2", "Navigate to 'Ghana Docs' (in Ghana mode) for Ghana-specific documents — SLA, Compliance Framework, E2E Test Plan, Data Standards, Data Protection Policy, Operations Manual, Ghana API Guide, and Connections Policy."),
        t("manual.documents.s3", "All documents are available in five languages (EN, FR, PT, AR, SW) and can be downloaded as PDF or Markdown."),
        t("manual.documents.s4", "Use the 'App Guide' for an animated walkthrough of all platform features."),
        t("manual.documents.s5", "Check 'Version History' for release notes and changelog."),
        t("manual.documents.s6", "'Legal & Copyright' contains terms and legal information."),
        t("manual.documents.s7", "'About' shows platform version and system information."),
      ],
      roles: ["super_admin", "admin", "regulator", "lender", "viewer"],
    },
    {
      id: "faq",
      icon: HelpCircle,
      title: t("manual.faq.title", "Frequently Asked Questions"),
      description: t("manual.faq.desc", "Common questions and answers about using the Credit Registry System."),
      steps: [
        t("manual.faq.s1", "Q: How do I reset my password? — Click the user menu and select 'Change Password', or contact your administrator."),
        t("manual.faq.s2", "Q: How do I enable MFA? — After login, go to your profile and click 'Enable MFA'. Scan the QR code with any authenticator app (Google Authenticator, Authy, etc.)."),
        t("manual.faq.s3", "Q: Why can't I approve my own submission? — The maker-checker workflow requires a different user to review and approve changes for data integrity."),
        t("manual.faq.s4", "Q: What happens when a dispute SLA is breached? — The dispute is flagged as 'BREACHED' and appears in regulatory reports for escalation."),
        t("manual.faq.s5", "Q: How many currencies are supported? — 42+ African currencies plus USD, EUR, and GBP for international settlement."),
        t("manual.faq.s6", "Q: What are the supported jurisdictions? — All 54 African countries are supported as a pan-African credit registry."),
        t("manual.faq.s7", "Q: How do I switch languages? — Use the language switcher (globe icon) in the top header bar. English, French, Portuguese, Arabic, and Swahili are available."),
        t("manual.faq.s8", "Q: What is a PEP flag? — Politically Exposed Person designation for individuals holding prominent public functions."),
        t("manual.faq.s9", "Q: How long before my session times out? — Sessions expire after 15 minutes of inactivity."),
        t("manual.faq.s10", "Q: What credit score ranges are used? — 300-850 scale: 750–850 Excellent, 670–749 Good, 580–669 Fair, 450–579 Poor, 300–449 Very Poor."),
        t("manual.faq.s11", "Q: How do I generate an API key? — Navigate to API Keys (Admin/Super Admin only), click 'Generate Key', select institution and permissions."),
        t("manual.faq.s12", "Q: What social login options are available? — Google, Microsoft, Apple, and Enterprise SSO (SAML)."),
        t("manual.faq.s13", "Q: How does the Consumer Portal work? — Individuals register at '/consumer/register' and view their credit data at '/my-credit' — no system login required."),
        t("manual.faq.s14", "Q: What are telco scores? — Alternative credit scores based on mobile network data (airtime, mobile money, top-ups) for unbanked populations."),
      ],
    },
  ];
}

const roleAccessMatrix = [
  { moduleKey: "dashboardReports", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "consumersBiz", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "creditAccounts", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "creditSearch", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "disputesConsent", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "helpdesk", super_admin: true, admin: true, regulator: true, lender: true, viewer: true },
  { moduleKey: "telco", super_admin: true, admin: true, regulator: true, lender: true, viewer: false },
  { moduleKey: "portfolioIntelligence", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "aiCommandCenter", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "regulatoryDashboard", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "pendingApprovals", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "auditTrail", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "crossBorder", super_admin: true, admin: true, regulator: true, lender: true, viewer: false },
  { moduleKey: "borrowerAlerts", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "billing", super_admin: true, admin: true, regulator: true, lender: false, viewer: false },
  { moduleKey: "batchUpload", super_admin: true, admin: true, regulator: false, lender: true, viewer: false },
  { moduleKey: "userManagement", super_admin: true, admin: true, regulator: false, lender: false, viewer: false },
  { moduleKey: "institutions", super_admin: true, admin: true, regulator: false, lender: false, viewer: false },
  { moduleKey: "apiKeys", super_admin: true, admin: true, regulator: false, lender: false, viewer: false },
  { moduleKey: "commandCenter", super_admin: true, admin: false, regulator: false, lender: false, viewer: false },
  { moduleKey: "organizations", super_admin: true, admin: false, regulator: false, lender: false, viewer: false },
  { moduleKey: "backupRecovery", super_admin: true, admin: false, regulator: false, lender: false, viewer: false },
];

export default function OnlineManualPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const helpSections = useMemo(() => getHelpSections(t), [t]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const q = searchQuery.toLowerCase();
    return helpSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.steps.some((step) => step.toLowerCase().includes(q))
    );
  }, [searchQuery, helpSections]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1000px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-help-title">
            {t("help.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4" data-testid="text-help-subtitle">
          {t("help.subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("help.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-help-search"
        />
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold" data-testid="text-quick-start-title">{t("help.quickStart")}</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
              <span>{t("help.qs1")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
              <span>{t("help.qs2")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
              <span>{t("help.qs3")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="shrink-0 mt-0.5">4</Badge>
              <span>{t("help.qs4")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold" data-testid="text-role-access-title">{t("help.roleAccess")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("help.roleAccessDesc")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-role-access">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">{t("help.module")}</th>
                  <th className="text-center py-2 px-2 font-medium">Super Admin</th>
                  <th className="text-center py-2 px-2 font-medium">Admin</th>
                  <th className="text-center py-2 px-2 font-medium">Regulator</th>
                  <th className="text-center py-2 px-2 font-medium">Lender</th>
                  <th className="text-center py-2 px-2 font-medium">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {roleAccessMatrix.map((row) => (
                  <tr key={row.moduleKey} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{t(`manual.roleModule.${row.moduleKey}`, row.moduleKey)}</td>
                    <td className="text-center py-2 px-2">{row.super_admin ? "\u2713" : "\u2014"}</td>
                    <td className="text-center py-2 px-2">{row.admin ? "\u2713" : "\u2014"}</td>
                    <td className="text-center py-2 px-2">{row.regulator ? "\u2713" : "\u2014"}</td>
                    <td className="text-center py-2 px-2">{row.lender ? "\u2713" : "\u2014"}</td>
                    <td className="text-center py-2 px-2">{row.viewer ? "\u2713" : "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-results">{t("help.noResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2" data-testid="accordion-help-sections">
          {filteredSections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border rounded-md px-4"
              data-testid={`accordion-section-${section.id}`}
            >
              <AccordionTrigger className="gap-3" data-testid={`trigger-section-${section.id}`}>
                <div className="flex items-center gap-3 text-left">
                  <section.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-semibold">{section.title}</span>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">{section.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-8">
                  {section.roles && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{t("help.availableTo")}:</span>
                      {section.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ol className="space-y-2">
                    {section.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground shrink-0 w-5 text-right">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
