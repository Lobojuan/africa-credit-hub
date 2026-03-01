import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";

interface HelpSection {
  id: string;
  icon: typeof Rocket;
  title: string;
  description: string;
  steps: string[];
  roles?: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    icon: Rocket,
    title: "Getting Started",
    description: "Learn how to log in, navigate the system, switch languages, and manage your session.",
    steps: [
      "Navigate to the system URL provided by your administrator.",
      "Enter your username and password on the login page and click 'Sign In'.",
      "If prompted, change your password on first login (must be 8+ characters with uppercase, lowercase, digit, and special character).",
      "Use the language switcher in the top header to toggle between English and French.",
      "Use the theme toggle (sun/moon icon) to switch between light and dark mode.",
      "Navigate using the sidebar on the left — click the hamburger icon to collapse/expand it.",
      "Your session will automatically expire after 15 minutes of inactivity. You will be redirected to the login page.",
      "Click the logout button (arrow icon) in the top-right header to sign out manually.",
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Understand the 8 stat cards and how to drill down into system metrics.",
    steps: [
      "The dashboard displays 8 stat cards: Total Borrowers, Credit Accounts, Outstanding, Delinquent, Defaults, Inquiries, Pending Approvals, and Open Disputes.",
      "Click any stat card to open a detail sheet showing the underlying records.",
      "Items in the detail sheet are clickable — they navigate to the relevant detail page.",
      "The 'Recent Credit Accounts' section shows the latest loan activity across all institutions.",
      "The 'Recent Activity' section shows the most recent audit trail entries.",
      "All data refreshes automatically when you navigate back to the dashboard.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "borrowers",
    icon: Users,
    title: "Borrower Management",
    description: "Register, search, and manage individual and corporate borrower records.",
    steps: [
      "Navigate to 'Borrowers' in the sidebar to view all registered borrowers.",
      "Use the search bar to filter borrowers by name, national ID, phone, or email.",
      "Click 'Register Borrower' to add a new borrower record.",
      "Select the borrower type: 'Individual' or 'Corporate'.",
      "For individuals: fill in first name, last name, national ID, date of birth, gender, phone, email, address, city, region, employer, occupation.",
      "For corporates: fill in company name, business registration number, national ID/TIN, sector, phone, email, address, city, region.",
      "Toggle the PEP (Politically Exposed Person) flag if applicable and provide details.",
      "Set education level, institution, and employment history as needed.",
      "New registrations are submitted through the maker-checker workflow — a different authorized user must approve the change.",
      "Click any borrower row to view their full detail page with credit accounts, inquiries, court judgments, and consent records.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "credit-accounts",
    icon: CreditCard,
    title: "Credit Accounts",
    description: "Create and manage loan records with multi-currency support.",
    steps: [
      "Navigate to 'Credit Accounts' in the sidebar.",
      "Click 'Add Account' to create a new credit account.",
      "Select the borrower from the dropdown list.",
      "Enter lender institution, account number, and select the account type (Personal Loan, Mortgage, Vehicle Loan, Business Loan, etc.).",
      "Set the account status: Current, Delinquent, Default, Closed, Restructured, or Written Off.",
      "Enter original amount, current balance, and interest rate.",
      "Select the currency from 17 supported currencies (ETB, GHS, UGX, LRD, USD, EUR, GBP, KES, TZS, RWF, NGN, ZAR, XOF, XAF, EGP, MAD, CNY).",
      "Set disbursement date, maturity date, collateral type, and collateral value.",
      "Toggle 'Interest Free' for Sharia-compliant or interest-free loans.",
      "Set grace period (months) and restructure count if applicable.",
      "The payment history grid shows 12 periods of payment performance per account.",
    ],
    roles: ["admin", "regulator", "lender"],
  },
  {
    id: "credit-search",
    icon: Search,
    title: "Credit Search & Reports",
    description: "Search borrowers and generate credit reports with scores.",
    steps: [
      "Navigate to 'Credit Search' in the sidebar.",
      "Enter a name, national ID, phone number, or email in the search bar.",
      "Click 'Search' to find matching borrowers.",
      "Click 'View Report' next to a borrower to generate their full credit report.",
      "The credit report includes: personal/company information, credit score (300-850), reason codes, all credit accounts, payment history, court judgments, and consent records.",
      "Credit scores are categorized: 750+ Excellent, 700-749 Good, 650-699 Fair, 550-649 Poor, below 550 Very Poor.",
      "Reason codes explain factors affecting the score (e.g., DELINQUENT_ACCOUNTS, HIGH_DEBT_LEVEL, STRONG_REPAYMENT_HISTORY).",
      "Each report is assigned a unique serial number in format CR-{YEAR}-{ID}.",
      "Use the print button to generate a printable version of the report.",
      "For bulk searches, use the bulk credit search feature to check multiple IDs at once.",
      "All searches are logged in the audit trail and require borrower consent.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "maker-checker",
    icon: CheckSquare,
    title: "Maker-Checker Workflow",
    description: "How data changes are submitted, reviewed, and approved.",
    steps: [
      "When you create or modify a borrower record, the change is submitted as a 'pending approval' rather than applied immediately.",
      "Navigate to 'Pending Approvals' in the sidebar to see all submitted changes.",
      "Each approval shows the entity type, action, and submission timestamp.",
      "Click 'Review' to open the change request details.",
      "Review the payload data showing the proposed changes.",
      "Add optional review notes explaining your decision.",
      "Click 'Approve' to accept the change or 'Reject' to deny it.",
      "Self-approval prevention: You cannot approve a change that you submitted. A different authorized user must review it.",
      "Only Admin and Regulator roles can approve or reject changes.",
    ],
    roles: ["admin", "regulator"],
  },
  {
    id: "disputes",
    icon: AlertCircle,
    title: "Dispute Management",
    description: "File, track, and resolve data disputes with SLA tracking.",
    steps: [
      "Navigate to 'Disputes' in the sidebar.",
      "Click 'File Dispute' to create a new dispute.",
      "Select the borrower and optionally the credit account involved.",
      "Choose the dispute type: Data Error, Identity Theft, Unauthorized Inquiry, Duplicate Record, Incorrect Balance, Wrong Status, or Other.",
      "Select the correction type: Financial (2-day SLA) or Non-Financial (5-day SLA).",
      "Provide a detailed description of the issue.",
      "The system automatically calculates the SLA deadline based on the correction type.",
      "Disputes progress through statuses: Open, Under Review, Resolved, or Rejected.",
      "If the SLA deadline passes without resolution, the dispute is marked as 'BREACHED'.",
      "To resolve a dispute, click it and enter resolution notes.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "court-judgments",
    icon: Gavel,
    title: "Court Judgments",
    description: "Record and track court judgments, liens, and bankruptcies.",
    steps: [
      "Court judgments are visible on the borrower detail page under 'Court Judgments'.",
      "To add a judgment, use the form on the borrower detail page or via the API.",
      "Enter the case number, court name, and judgment type (Lien, Bankruptcy, Lawsuit, Civil, Criminal).",
      "Specify the judgment amount, date, and current status (Active, Satisfied, Vacated, Appealed).",
      "Court judgments affect the borrower's credit score and appear on credit reports.",
      "Only Admin and Regulator roles can create court judgments.",
    ],
    roles: ["admin", "regulator"],
  },
  {
    id: "consent",
    icon: FileCheck,
    title: "Consent Management",
    description: "Grant, track, and revoke data subject consent with receipt numbers.",
    steps: [
      "Navigate to 'Consent Management' in the sidebar.",
      "Click 'Grant Consent' to create a new consent record.",
      "Enter the borrower ID and specify who consent is granted to.",
      "Select the purpose of consent and the consent type: Data Collection, Data Sharing, or Credit Inquiry.",
      "Each consent record is assigned a unique receipt number in format CR-{timestamp}-{random}.",
      "The status shows as 'Active' for current consent or 'Revoked' if withdrawn.",
      "To revoke consent, click the 'Revoke' button on an active consent record.",
      "Consent records appear on the borrower's credit report.",
      "Filter consent records by borrower ID using the filter field.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "institutions",
    icon: Building2,
    title: "Institution Management",
    description: "Register and approve data provider institutions.",
    steps: [
      "Navigate to 'Institutions' in the sidebar (Admin only).",
      "Click 'Register Institution' to add a new data provider.",
      "Enter the institution name, type (Bank, MFI, Utility, Telecom, Digital Lender, SACCO), and registration number.",
      "Select the country and set the submission frequency (Daily, Weekly, Monthly).",
      "Provide contact email, phone, and address.",
      "Newly registered institutions start with 'Pending' status.",
      "Click 'Approve' on a pending institution to activate it.",
      "Approved institutions can be assigned API keys for programmatic data submission.",
    ],
    roles: ["admin"],
  },
  {
    id: "billing",
    icon: Receipt,
    title: "Billing",
    description: "Create invoices and track payments for data provider institutions.",
    steps: [
      "Navigate to 'Billing' in the sidebar (Admin/Regulator only).",
      "View summary cards showing Total Revenue, Pending Amount, and Overdue Amount.",
      "Click 'Create Invoice' to generate a new invoice.",
      "Select the institution and service type (Data Submission, Credit Report, API Access, Subscription).",
      "Enter the amount, currency, and billing period (start and end dates).",
      "Track invoice payment status: Pending, Paid, or Overdue.",
      "Click any billing row to view detailed invoice information.",
    ],
    roles: ["admin", "regulator"],
  },
  {
    id: "helpdesk",
    icon: Headset,
    title: "Helpdesk",
    description: "Inquiry Service Unit portal for consumer dispute and consent management.",
    steps: [
      "Navigate to 'Helpdesk' in the sidebar.",
      "Use the search bar to find a borrower by name, national ID, or TIN.",
      "Select a borrower from the search results to view their information.",
      "View the borrower's existing disputes and consent records.",
      "Use 'File Dispute' to create a dispute on behalf of the borrower.",
      "Use 'Grant Consent' to create a consent record from the helpdesk.",
      "Summary cards show Open Inquiries, SLA Breaches, and Resolved Today counts.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "batch-upload",
    icon: Upload,
    title: "Batch Upload",
    description: "Upload credit account data in bulk via JSON or CSV files.",
    steps: [
      "Navigate to 'Batch Upload' in the sidebar.",
      "Click 'Upload Data' or drag and drop a JSON or CSV file.",
      "Alternatively, paste JSON data directly into the text area.",
      "Click 'Submit Batch' to process the upload.",
      "The system validates each record individually — valid records are imported, invalid ones are rejected.",
      "View the upload results showing counts of succeeded and failed records.",
      "For failed records, review the error report showing the row number and specific error message.",
      "Use the 'Sample Format' section to see the expected data structure.",
    ],
    roles: ["admin", "lender"],
  },
  {
    id: "audit-trail",
    icon: Shield,
    title: "Audit Trail",
    description: "View complete activity logs of all system operations.",
    steps: [
      "Navigate to 'Audit Trail' in the sidebar (Admin/Regulator only).",
      "View the chronological list of all system activities.",
      "Each entry shows: timestamp, action type, entity, details, IP address, and user ID.",
      "Use the filter bar to search by action, entity, or details.",
      "Click any audit entry to view full details in a dialog.",
      "All user actions including logins, data changes, approvals, and API calls are logged.",
      "IP addresses are tracked for security compliance.",
    ],
    roles: ["admin", "regulator"],
  },
  {
    id: "user-management",
    icon: Settings,
    title: "User Management",
    description: "Create and manage system users, roles, and access levels.",
    steps: [
      "Navigate to 'User Management' in the sidebar (Admin only).",
      "Click 'Add User' to create a new system user.",
      "Enter username, password, full name, email, and institution.",
      "Assign a role: Admin (full access), Regulator (compliance + approvals), Lender (data entry), or Viewer (read-only).",
      "Set the user status: Active, Suspended, or Deactivated.",
      "Click any user row to edit their details.",
      "Password policy: 8+ characters, uppercase, lowercase, digit, special character.",
      "Passwords expire after 90 days — users are prompted to change them.",
      "Accounts lock after 3 failed login attempts for 15 minutes.",
    ],
    roles: ["admin"],
  },
  {
    id: "api-keys",
    icon: Key,
    title: "API Key Management",
    description: "Generate and manage API keys for external institution access.",
    steps: [
      "Navigate to 'API Keys' in the sidebar (Admin only).",
      "Click 'Generate Key' to create a new API key.",
      "Select the institution the key belongs to (must be an approved institution).",
      "Enter a label (e.g., 'Production Key', 'Test Key').",
      "Choose the permission level: Submit Only, Read Only, or Full Access.",
      "Copy the generated API key immediately — it will not be shown again.",
      "The key prefix (e.g., sim_xxxxxxxx) is displayed for identification.",
      "Track last-used timestamps to monitor key activity.",
      "Click 'Revoke' to permanently disable a key.",
    ],
    roles: ["admin"],
  },
  {
    id: "external-api",
    icon: Globe,
    title: "External API",
    description: "Programmatic data submission and retrieval via REST API.",
    steps: [
      "All external API endpoints are under /api/external/v1/.",
      "Authenticate requests with the X-API-Key header containing your issued API key.",
      "POST /borrowers — Create borrower records (single or batch array).",
      "GET /borrowers/search — Search borrowers by national ID, name, or query.",
      "GET /borrowers/:id/credit-report — Generate a full credit report with score.",
      "POST /credit-accounts — Submit credit account data (single or batch).",
      "POST /payment-history — Submit payment history records.",
      "POST /court-judgments — Submit court judgment records.",
      "GET /health — Check API availability (no authentication required).",
      "View the full API documentation page for detailed request/response formats.",
    ],
    roles: ["admin"],
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Reports & Export",
    description: "Generate portfolio analytics and export data as CSV.",
    steps: [
      "Navigate to 'Credit Reports' in the sidebar.",
      "View summary cards: Registered Borrowers, Total Exposure, Non-performing, NPL Ratio.",
      "Review the 'Portfolio by Institution' breakdown showing exposure per lender.",
      "Review the 'Portfolio by Loan Type' breakdown showing exposure per product.",
      "Click 'Export Portfolio CSV' to download portfolio data as a CSV file.",
      "Click 'Export Borrowers CSV' to download borrower data as a CSV file.",
      "Regulatory analytics include NPL ratios, portfolio breakdowns, and SLA breach tracking.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Stay informed about approvals, disputes, and system alerts.",
    steps: [
      "The notification bell in the top header shows the count of unread notifications.",
      "Click the bell icon to view your notifications.",
      "Notifications are generated for: approval requests, approval results, dispute filings, and system alerts.",
      "Click a notification to mark it as read.",
      "Use 'Mark all read' to clear all unread notification badges.",
      "Notifications are sorted with the most recent first.",
    ],
    roles: ["admin", "regulator", "lender", "viewer"],
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "Frequently Asked Questions",
    description: "Common questions and answers about using the Credit Registry System.",
    steps: [
      "Q: How do I reset my password? — Click the user menu and select 'Change Password', or contact your administrator.",
      "Q: Why can't I approve my own submission? — The maker-checker workflow requires a different user to review and approve changes for data integrity.",
      "Q: What happens when a dispute SLA is breached? — The dispute is flagged as 'BREACHED' and appears in regulatory reports for escalation.",
      "Q: How many currencies are supported? — 42+ African currencies plus USD, EUR, and GBP for international settlement.",
      "Q: What are the supported jurisdictions? — All 54 African countries are supported as a pan-African credit registry.",
      "Q: How do I switch languages? — Use the language switcher (globe icon) on the login page or in the top header bar. English, French, and Portuguese are available.",
      "Q: What is a PEP flag? — Politically Exposed Person designation for individuals holding prominent public functions.",
      "Q: How long before my session times out? — Sessions expire after 15 minutes of inactivity (NFR-SEC-09).",
      "Q: What credit score ranges are used? — 300-850 scale: 750+ Excellent, 700-749 Good, 650-699 Fair, 550-649 Poor, below 550 Very Poor.",
      "Q: How do I generate an API key? — Navigate to API Keys (Admin only), click 'Generate Key', select institution and permissions.",
    ],
  },
];

const roleAccessMatrix = [
  { module: "Dashboard & Reports", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Borrower Management", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Credit Accounts", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Credit Search", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Disputes & Consent", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Helpdesk", admin: true, regulator: true, lender: true, viewer: true },
  { module: "Pending Approvals", admin: true, regulator: true, lender: false, viewer: false },
  { module: "Audit Trail", admin: true, regulator: true, lender: false, viewer: false },
  { module: "Billing", admin: true, regulator: true, lender: false, viewer: false },
  { module: "Batch Upload", admin: true, regulator: false, lender: true, viewer: false },
  { module: "User Management", admin: true, regulator: false, lender: false, viewer: false },
  { module: "Institutions", admin: true, regulator: false, lender: false, viewer: false },
  { module: "API Keys", admin: true, regulator: false, lender: false, viewer: false },
];

export default function OnlineManualPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const q = searchQuery.toLowerCase();
    return helpSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.steps.some((step) => step.toLowerCase().includes(q))
    );
  }, [searchQuery]);

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
                  <th className="text-center py-2 px-2 font-medium">Admin</th>
                  <th className="text-center py-2 px-2 font-medium">Regulator</th>
                  <th className="text-center py-2 px-2 font-medium">Lender</th>
                  <th className="text-center py-2 px-2 font-medium">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {roleAccessMatrix.map((row) => (
                  <tr key={row.module} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{row.module}</td>
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
