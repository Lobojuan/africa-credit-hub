import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, CreditCard, Search, FileText, Shield, Settings,
  CheckSquare, AlertCircle, Upload, Building2, Headset, Globe, DollarSign,
  Scale, ChevronRight, Play,
  Monitor, UserCheck, Eye, MousePointerClick,
  BarChart3, MapPin,
  BookOpen, HelpCircle, FileCheck, Layers, Target,
  Info, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Role = "admin" | "regulator" | "lender" | "viewer";

interface GuideSection {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  roles: Role[];
  steps: {
    title: string;
    description: string;
    visual: "dashboard" | "form" | "table" | "detail" | "chart" | "map" | "upload" | "settings" | "search" | "approval" | "report" | "custom";
    roleNotes?: Partial<Record<Role, string>>;
    tips?: string[];
  }[];
}

const guideSections: GuideSection[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    subtitle: "Your command center for credit registry data",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Understanding the Dashboard",
        description: "When you log in, you land on the Dashboard. This page gives you a real-time overview of the entire credit registry. At the top, you see four summary cards showing Total Borrowers, Total Credit Accounts, Active Disputes, and Pending Approvals. These numbers update automatically as new data enters the system.",
        visual: "dashboard",
        tips: [
          "Click any summary card to navigate directly to that section",
          "Numbers shown reflect your access level — lenders see only their own institution's data",
        ],
      },
      {
        title: "Portfolio Growth Chart",
        description: "Below the summary cards, you'll find a 12-month area chart showing borrower and account growth trends. Hover over any point to see the exact count for that month. The blue area represents total borrowers, and the teal area shows credit accounts. This helps you understand portfolio growth over time.",
        visual: "chart",
        tips: ["The chart is responsive and adjusts to your screen size", "Dark mode automatically adjusts chart colors"],
      },
      {
        title: "Account Status & Loan Type Charts",
        description: "Next to the growth chart, you'll see two visualizations: a donut chart breaking down accounts by status (Current, Delinquent, Default, Closed, etc.) and a horizontal bar chart showing the distribution by loan type (Term Loan, Overdraft, Mortgage, etc.). These give you an instant picture of portfolio health.",
        visual: "chart",
      },
      {
        title: "Africa Coverage Map",
        description: "The interactive map shows all 54 African countries. Countries are color-coded by activity level — darker shading means more borrowers. Hover over any country to see a tooltip with the country name, number of borrowers, and number of accounts. This gives you a geographic view of the registry's cross-border coverage.",
        visual: "map",
        tips: ["Countries with no activity appear in light gray", "The map legend explains the color scale"],
      },
    ],
  },
  {
    id: "borrowers",
    icon: Users,
    title: "Managing Borrowers",
    subtitle: "Add, search, and view borrower profiles",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Viewing the Borrower List",
        description: "Click 'Borrowers' in the sidebar. You'll see a table listing all borrowers with columns for Name, Type (Individual/Corporate), National ID, Country, Status, and Risk Level. Use the search bar at the top to filter by name, ID, or other fields. Click column headers to sort.",
        visual: "table",
        roleNotes: {
          admin: "You see all borrowers across all institutions and countries",
          lender: "You see borrowers associated with your institution",
          regulator: "You see all borrowers within your regulatory jurisdiction",
          viewer: "You have read-only access — no Add or Edit buttons are shown",
        },
      },
      {
        title: "Adding a New Borrower",
        description: "Click the '+ Add Borrower' button at the top right. A form appears where you select the borrower type (Individual or Corporate). For individuals, fill in: First Name, Last Name, National ID, Date of Birth, Gender, Phone, Email, Address, City, Country, and optionally TIN, Passport Number, Employer, and Occupation. For corporate borrowers, fill in: Company Name, Business Registration Number, TIN, Sector, Phone, Email, and Address details.",
        visual: "form",
        roleNotes: {
          admin: "You can add borrowers from any country and institution",
          lender: "You can add borrowers for your institution. The record goes through maker-checker approval",
          viewer: "You cannot add borrowers",
          regulator: "You can view but typically do not add borrowers directly",
        },
        tips: [
          "National ID is required and must be unique within a country",
          "Select the correct country from the dropdown — this determines jurisdiction",
          "PEP (Politically Exposed Person) flag can be set for high-risk individuals",
          "After submitting, the record enters 'Pending Approval' status (maker-checker workflow)",
        ],
      },
      {
        title: "Viewing Borrower Details",
        description: "Click any borrower row to open their detail page. Here you see their full profile, associated credit accounts, payment history, inquiries, court judgments, and consent records. You can also generate a comprehensive credit report from this page by clicking 'Generate Credit Report'.",
        visual: "detail",
        tips: [
          "The detail page shows a risk assessment summary at the top",
          "Each credit account has its own payment timeline",
          "You can navigate to the credit report directly from here",
        ],
      },
    ],
  },
  {
    id: "credit-accounts",
    icon: CreditCard,
    title: "Credit Accounts",
    subtitle: "View and manage credit facilities",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Credit Accounts List",
        description: "Navigate to 'Credit Accounts' in the sidebar. The table shows all credit facilities with columns for Account Number, Borrower, Institution, Type, Status, Currency, Original Amount, Current Balance, and Days in Arrears. Use filters to narrow by status, institution, or account type.",
        visual: "table",
        roleNotes: {
          admin: "You see all accounts across all institutions",
          lender: "You see accounts reported by your institution",
          regulator: "You see accounts across your jurisdiction for oversight",
          viewer: "Read-only view of accounts you have access to",
        },
      },
      {
        title: "Adding a Credit Account",
        description: "Click '+ Add Account' to create a new credit facility record. Select the borrower from the dropdown (or search by name/ID), then fill in: Institution, Account Number, Account Type (Term Loan, Overdraft, Mortgage, Credit Card, Trade Finance, etc.), Original Amount, Current Balance, Currency, Interest Rate, Disbursement Date, Maturity Date, Status, and optionally Collateral Type and Value.",
        visual: "form",
        roleNotes: {
          admin: "Full access to add accounts for any institution",
          lender: "Add accounts for your institution only. Goes through maker-checker",
          viewer: "Cannot add accounts",
          regulator: "Typically view-only for credit accounts",
        },
        tips: [
          "The system supports 42+ African currencies — select the correct one",
          "For interest-free (Islamic finance) accounts, check the 'Interest-Free' box",
          "Collateral information is optional but improves credit assessment quality",
          "Days in Arrears should reflect the latest reporting date",
        ],
      },
    ],
  },
  {
    id: "search",
    icon: Search,
    title: "Global Search",
    subtitle: "Search across the entire registry",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Using Global Search",
        description: "Click 'Global Search' in the sidebar. Type a name, national ID, TIN, passport number, or account number into the search box. The system searches across all borrowers, credit accounts, and institutions simultaneously. Results are grouped by type and ranked by relevance.",
        visual: "search",
        tips: [
          "Search supports partial matching — you don't need to type the full name",
          "Cross-border entity resolution automatically finds matches across jurisdictions",
          "Click any search result to navigate directly to the record",
        ],
      },
      {
        title: "Generating a Credit Report from Search",
        description: "After finding a borrower in search results, click their name to view their profile, then click 'Generate Credit Report'. Select the purpose of the report (New Credit Application, Periodic Review, Collection, Regulatory, or Portfolio Monitoring). The system generates a comprehensive D&B-style report with credit profile overview, liability summary, facility details, payment history grids, and more.",
        visual: "report",
        roleNotes: {
          admin: "Can generate reports for any borrower",
          lender: "Can generate reports — each generation is logged for audit",
          regulator: "Full report access for regulatory oversight",
          viewer: "May be restricted from generating reports depending on configuration",
        },
      },
    ],
  },
  {
    id: "batch-upload",
    icon: Upload,
    title: "Batch Upload",
    subtitle: "Upload multiple records at once via CSV",
    roles: ["admin", "lender"],
    steps: [
      {
        title: "Preparing Your CSV File",
        description: "Before uploading, prepare your CSV file with the required columns. For borrowers: FirstName, LastName, Type, NationalId, Country, Phone, Email, etc. For credit accounts: BorrowerId, AccountNumber, AccountType, OriginalAmount, Currency, Status, etc. Download the template from the upload page to see the exact format.",
        visual: "upload",
        tips: [
          "The first row must be column headers",
          "Date format should be YYYY-MM-DD",
          "Currency codes must be valid ISO 4217 codes (ETB, KES, NGN, etc.)",
          "Maximum file size is 10MB per upload",
        ],
      },
      {
        title: "Uploading and Processing",
        description: "Click 'Batch Upload' in the sidebar, then select your record type (Borrowers or Credit Accounts). Click 'Choose File' to select your CSV, then click 'Upload'. The system validates each row and shows you a summary: how many records were successfully imported, how many had errors, and what the errors were. Failed rows can be corrected and re-uploaded.",
        visual: "upload",
        roleNotes: {
          admin: "Can upload for any institution",
          lender: "Can upload for your institution — records go through maker-checker",
        },
      },
    ],
  },
  {
    id: "disputes",
    icon: AlertCircle,
    title: "Disputes Management",
    subtitle: "Track and resolve data accuracy disputes",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Viewing Disputes",
        description: "Navigate to 'Disputes' in the sidebar. The page shows all dispute cases with columns for ID, Borrower, Type, Status (Open, Under Investigation, Resolved, Escalated), Priority, and SLA Deadline. Disputes that are approaching or past their SLA deadline are highlighted in red.",
        visual: "table",
        tips: [
          "SLA deadlines are automatically set based on dispute type and jurisdiction",
          "The system sends notifications when SLAs are approaching",
        ],
      },
      {
        title: "Filing a New Dispute",
        description: "Click '+ New Dispute' to raise a data accuracy concern. Select the borrower, the specific record being disputed, the dispute type (Incorrect Balance, Wrong Status, Identity Error, etc.), and provide a detailed description. Attach any supporting documents. The dispute is assigned a priority and SLA timeline automatically.",
        visual: "form",
        roleNotes: {
          admin: "Can manage all disputes and assign investigators",
          lender: "Can file disputes and respond to disputes about your records",
          regulator: "Can oversee dispute resolution and escalate if needed",
          viewer: "Read-only access to dispute status",
        },
      },
    ],
  },
  {
    id: "approvals",
    icon: CheckSquare,
    title: "Pending Approvals (Maker-Checker)",
    subtitle: "Review and approve submitted changes",
    roles: ["admin", "regulator"],
    steps: [
      {
        title: "Understanding the Maker-Checker Workflow",
        description: "When a user creates or modifies a record, the change doesn't take effect immediately. Instead, it enters a 'Pending Approval' queue. A different user with approval authority must review and either approve or reject the change. This ensures data integrity and prevents unauthorized modifications.",
        visual: "approval",
      },
      {
        title: "Reviewing and Approving Changes",
        description: "Go to 'Pending Approvals' in the sidebar. You'll see a list of all pending changes showing the Submitter, Record Type, Change Description, and Submission Date. Click a record to see the full before/after details. Click 'Approve' to apply the change or 'Reject' with a reason to deny it.",
        visual: "approval",
        roleNotes: {
          admin: "Can approve/reject any pending change. Cannot approve your own submissions",
          regulator: "Can approve/reject changes within your jurisdiction",
        },
        tips: [
          "You cannot approve your own submissions — this is a compliance requirement",
          "Rejected changes can be resubmitted by the original maker after corrections",
          "All approval/rejection actions are logged in the audit trail",
        ],
      },
    ],
  },
  {
    id: "credit-reports",
    icon: FileText,
    title: "Credit Reports",
    subtitle: "Generate comprehensive D&B-style credit reports",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Generating a Credit Report",
        description: "Navigate to a borrower's detail page and click 'Generate Credit Report'. Select the purpose (New Credit Application, Periodic Review, Collection, Regulatory, or Portfolio Monitoring). The system compiles data from all sources and generates a comprehensive report.",
        visual: "report",
      },
      {
        title: "Understanding the Credit Report",
        description: "The report follows an international D&B-style format and includes: a Credit Profile Overview table with 11 key indicators, Classification by Institution showing exposure per lender, a Total Liability Summary with aging buckets (1-30, 31-60, 61-90, 91-120, 121-150, 151-180, 180+ days), Credit Exposure by Product, Inquiry History, and detailed Facility Cards for each credit account showing Main Details, Disbursement Details, Repayment Details, Security Details, and a 24-month Payment History grid.",
        visual: "report",
        tips: [
          "Each report has a unique serial number for tracking",
          "Reports can be printed using the Print button",
          "The Bureau Score (300-850) is calculated from payment history, delinquencies, write-offs, inquiries, and judgments",
          "Score Factor Analysis explains what drives the credit score up or down",
        ],
      },
    ],
  },
  {
    id: "consent",
    icon: FileCheck,
    title: "Consent Management",
    subtitle: "Manage borrower data sharing consent",
    roles: ["admin", "regulator", "lender", "viewer"],
    steps: [
      {
        title: "Managing Consent Records",
        description: "Navigate to 'Consent Management' in the sidebar. This shows all consent authorizations granted by borrowers for their data to be shared. Each record includes the borrower name, the institution granted access, purpose, receipt number, status (Active/Revoked/Expired), and dates.",
        visual: "table",
        tips: [
          "Consent is required before generating credit reports in many jurisdictions",
          "Expired consents are automatically flagged",
          "Borrowers can revoke consent at any time",
        ],
      },
    ],
  },
  {
    id: "audit",
    icon: Shield,
    title: "Audit Trail",
    subtitle: "Tamper-evident log of all system actions",
    roles: ["admin", "regulator"],
    steps: [
      {
        title: "Viewing the Audit Trail",
        description: "Click 'Audit Trail' in the sidebar. This page shows every action taken in the system in chronological order: record creations, modifications, deletions, report generations, login attempts, approval actions, and more. Each entry shows the Timestamp, User, Action, Entity, Details, and IP Address.",
        visual: "table",
        roleNotes: {
          admin: "Full visibility of all audit entries across the system",
          regulator: "Can view audit entries within your regulatory scope",
        },
        tips: [
          "Audit logs are tamper-evident — they cannot be modified or deleted",
          "Use the date filters to narrow to a specific time period",
          "Export the audit trail to CSV for regulatory reporting",
        ],
      },
    ],
  },
  {
    id: "institutions",
    icon: Building2,
    title: "Institution Management",
    subtitle: "Manage participating financial institutions",
    roles: ["admin"],
    steps: [
      {
        title: "Managing Institutions",
        description: "Go to 'Institutions' in the sidebar. You'll see a list of all registered financial institutions with their Code, Name, Type (Commercial Bank, Microfinance, Development Finance, etc.), Country, Status, and Contact Info. Click '+ Add Institution' to register a new participating institution.",
        visual: "table",
        roleNotes: {
          admin: "Only admins can add, edit, or deactivate institutions",
        },
      },
    ],
  },
  {
    id: "user-management",
    icon: Settings,
    title: "User Management",
    subtitle: "Create and manage system users",
    roles: ["admin"],
    steps: [
      {
        title: "Managing Users",
        description: "Navigate to 'User Management' in the sidebar. The page lists all system users with their Username, Full Name, Role, Institution, Status, and Last Login. Click '+ Add User' to create a new user account.",
        visual: "settings",
      },
      {
        title: "Understanding Roles",
        description: "The system has four roles with different access levels:\n\n• Admin — Full access to all features, user management, system configuration\n• Regulator — Oversight access, audit trails, compliance reports, approvals\n• Lender — Add/edit borrowers and accounts for their institution, file disputes\n• Viewer — Read-only access to data and reports",
        visual: "settings",
        tips: [
          "Each user is assigned to a specific institution",
          "Password policies enforce minimum complexity and expiration",
          "Deactivated users cannot log in but their audit history is preserved",
        ],
      },
    ],
  },
  {
    id: "exchange-rates",
    icon: DollarSign,
    title: "Exchange Rates",
    subtitle: "Manage multi-currency exchange rates",
    roles: ["admin"],
    steps: [
      {
        title: "Managing Exchange Rates",
        description: "Go to 'Exchange Rates' under the Integrations section. The system supports 42+ African currencies. The page shows current exchange rates relative to the base currency. Rates can be updated manually or configured to sync automatically. These rates are used when consolidating multi-currency exposure in credit reports.",
        visual: "settings",
      },
    ],
  },
  {
    id: "regulatory",
    icon: Scale,
    title: "Regulatory Compliance",
    subtitle: "Monitor compliance metrics and regulatory reporting",
    roles: ["admin", "regulator"],
    steps: [
      {
        title: "Compliance Dashboard",
        description: "Navigate to 'Regulatory Compliance' in the sidebar. This page shows compliance metrics including data submission rates, dispute resolution SLA performance, consent coverage, and NPL (Non-Performing Loan) ratios by jurisdiction. Traffic-light indicators show green (compliant), yellow (at risk), or red (non-compliant).",
        visual: "dashboard",
        roleNotes: {
          admin: "See system-wide compliance metrics",
          regulator: "See compliance metrics for your jurisdiction",
        },
      },
    ],
  },
];

const roleInfo: Record<Role, { label: string; color: string; icon: any; description: string }> = {
  admin: { label: "Administrator", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: Settings, description: "Full system access. Can manage users, institutions, configurations, and approve changes." },
  regulator: { label: "Regulator", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Scale, description: "Oversight access. Can view all data, audit trails, compliance reports, and approve changes." },
  lender: { label: "Lender", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: Building2, description: "Institutional access. Can add borrowers and accounts for their institution, file disputes." },
  viewer: { label: "Viewer", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300", icon: Eye, description: "Read-only access. Can view data and reports but cannot create or modify records." },
};

function VisualMockup({ type }: { type: string }) {
  switch (type) {
    case "dashboard":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total Borrowers", value: "2,847" },
              { label: "Credit Accounts", value: "4,312" },
              { label: "Active Disputes", value: "23" },
              { label: "Pending Approvals", value: "15" },
            ].map((item) => (
              <div key={item.label} className="bg-background rounded-lg p-3 border shadow-sm">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-lg font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-background rounded-lg p-3 border h-20 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="w-32 bg-background rounded-lg p-3 border h-20 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </div>
        </div>
      );
    case "table":
      return (
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <div className="flex items-center gap-2 p-2 border-b bg-background">
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-7 w-20 bg-primary/10 rounded ml-auto" />
          </div>
          <div className="divide-y">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-background">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-5 w-14 bg-green-100 dark:bg-green-900/30 rounded-full ml-auto" />
              </div>
            ))}
          </div>
        </div>
      );
    case "form":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {["First Name", "Last Name", "National ID", "Country"].map(label => (
              <div key={label}>
                <p className="text-[9px] text-muted-foreground mb-1">{label}</p>
                <div className="h-8 bg-background border rounded" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-8 w-20 bg-primary/20 rounded" />
          </div>
        </div>
      );
    case "chart":
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-end gap-1 h-16">
            {[30, 45, 40, 55, 50, 65, 60, 75, 70, 80, 85, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t transition-all" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted-foreground">Jan</span>
            <span className="text-[8px] text-muted-foreground">Dec</span>
          </div>
        </div>
      );
    case "map":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center h-24">
          <Globe className="w-12 h-12 text-primary/20" />
          <div className="ml-3 space-y-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-primary/80" />
              <span className="text-[8px] text-muted-foreground">High activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-primary/40" />
              <span className="text-[8px] text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-primary/10" />
              <span className="text-[8px] text-muted-foreground">Low</span>
            </div>
          </div>
        </div>
      );
    case "upload":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="border-2 border-dashed rounded-lg p-6 text-center bg-background">
            <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">Drop CSV file here or click to browse</p>
          </div>
          <div className="flex gap-2">
            <div className="h-2 flex-1 bg-primary/30 rounded-full" />
          </div>
        </div>
      );
    case "approval":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2 p-3 bg-background rounded border">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="flex-1">
              <div className="h-3 w-40 bg-muted rounded" />
              <div className="h-2 w-24 bg-muted rounded mt-1" />
            </div>
            <div className="flex gap-1">
              <div className="h-7 w-16 bg-green-100 dark:bg-green-900/30 rounded text-[9px] flex items-center justify-center text-green-700 dark:text-green-300 font-medium">Approve</div>
              <div className="h-7 w-14 bg-red-100 dark:bg-red-900/30 rounded text-[9px] flex items-center justify-center text-red-700 dark:text-red-300 font-medium">Reject</div>
            </div>
          </div>
        </div>
      );
    case "report":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary/40" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["Score", "Facilities", "Outstanding", "Risk"].map(label => (
              <div key={label} className="bg-background rounded p-2 border text-center">
                <p className="text-[8px] text-muted-foreground">{label}</p>
                <p className="text-xs font-bold mt-0.5">—</p>
              </div>
            ))}
          </div>
          <div className="h-6 bg-background border rounded" />
          <div className="h-6 bg-background border rounded" />
        </div>
      );
    case "search":
      return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground/40" />
            <div className="h-8 flex-1 bg-background border rounded" />
          </div>
          <div className="space-y-1.5">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 p-2 bg-background rounded border">
                <Users className="w-3.5 h-3.5 text-muted-foreground/30" />
                <div className="h-3 w-32 bg-muted rounded" />
                <Badge variant="secondary" className="text-[8px] ml-auto">Individual</Badge>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="border rounded-lg p-4 bg-muted/30 h-16 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-muted-foreground/20" />
        </div>
      );
  }
}

export default function AppGuidePage() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [expandedSection, setExpandedSection] = useState<string | null>("dashboard");

  const filteredSections = selectedRole === "all"
    ? guideSections
    : guideSections.filter(s => s.roles.includes(selectedRole));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8" data-testid="page-app-guide">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-guide-title">Application Walkthrough Guide</h1>
            <p className="text-sm text-muted-foreground">Step-by-step visual guide to the Credit Registry System</p>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">How to use this guide</p>
              <p className="text-sm text-muted-foreground mt-1">
                This guide walks you through every feature of the Credit Registry System with visual examples and
                role-specific instructions. Select your role below to see only the features available to you, or
                leave it on "All Roles" to see everything. Click on any section to expand the detailed walkthrough.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-semibold mb-3">Filter by your role:</p>
        <div className="flex flex-wrap gap-2" data-testid="role-filter">
          <Button
            variant={selectedRole === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole("all")}
            data-testid="button-role-all"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            All Roles
          </Button>
          {(Object.entries(roleInfo) as [Role, typeof roleInfo[Role]][]).map(([role, info]) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(role)}
              data-testid={`button-role-${role}`}
            >
              <info.icon className="w-4 h-4 mr-1.5" />
              {info.label}
            </Button>
          ))}
        </div>

        {selectedRole !== "all" && (
          <div className={`mt-3 p-3 rounded-lg flex items-center gap-3 ${roleInfo[selectedRole].color}`}>
            {(() => { const Icon = roleInfo[selectedRole].icon; return <Icon className="w-5 h-5 shrink-0" />; })()}
            <div>
              <p className="text-sm font-semibold">{roleInfo[selectedRole].label}</p>
              <p className="text-xs opacity-80">{roleInfo[selectedRole].description}</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Sections</p>
          <nav className="space-y-0.5">
            {filteredSections.map(section => {
              const isActive = expandedSection === section.id;
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setExpandedSection(isActive ? null : section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}
                  data-testid={`nav-guide-${section.id}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{section.title}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="md:col-span-3">
          {expandedSection ? (
            (() => {
              const section = filteredSections.find(s => s.id === expandedSection);
              if (!section) return null;
              const Icon = section.icon;
              return (
                <div className="space-y-6" data-testid={`guide-section-${section.id}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{section.title}</h2>
                        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      {section.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-[9px] ${roleInfo[role].color}`}>
                          {roleInfo[role].label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {section.steps.map((step, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="text-sm font-bold">{step.title}</h3>
                        </div>

                        <VisualMockup type={step.visual} />

                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{step.description}</p>

                        {step.roleNotes && selectedRole !== "all" && step.roleNotes[selectedRole] && (
                          <div className={`p-3 rounded-lg text-sm ${roleInfo[selectedRole].color}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <UserCheck className="w-4 h-4 shrink-0" />
                              <span className="font-semibold text-xs">For {roleInfo[selectedRole].label}:</span>
                            </div>
                            <p className="text-xs opacity-90">{step.roleNotes[selectedRole]}</p>
                          </div>
                        )}

                        {step.roleNotes && selectedRole === "all" && (
                          <div className="space-y-1.5">
                            {(Object.entries(step.roleNotes) as [Role, string][]).map(([role, note]) => (
                              <div key={role} className={`p-2 rounded-lg text-xs ${roleInfo[role].color}`}>
                                <span className="font-semibold">{roleInfo[role].label}:</span>{" "}
                                <span className="opacity-90">{note}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {step.tips && step.tips.length > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" /> Tips
                            </p>
                            <ul className="space-y-1">
                              {step.tips.map((tip, ti) => (
                                <li key={ti} className="text-xs text-amber-700/80 dark:text-amber-300/80 flex items-start gap-1.5">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MousePointerClick className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a section from the left to see the walkthrough</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <Card className="bg-muted/20">
        <CardContent className="p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Quick Reference: What Can Each Role Do?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Feature</th>
                  {(Object.entries(roleInfo) as [Role, typeof roleInfo[Role]][]).map(([role, info]) => (
                    <th key={role} className="text-center py-2 px-3">
                      <Badge variant="outline" className={`text-[9px] ${info.color}`}>{info.label}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: "View Dashboard", admin: true, regulator: true, lender: true, viewer: true },
                  { feature: "View Borrowers", admin: true, regulator: true, lender: true, viewer: true },
                  { feature: "Add Borrowers", admin: true, regulator: false, lender: true, viewer: false },
                  { feature: "View Credit Accounts", admin: true, regulator: true, lender: true, viewer: true },
                  { feature: "Add Credit Accounts", admin: true, regulator: false, lender: true, viewer: false },
                  { feature: "Global Search", admin: true, regulator: true, lender: true, viewer: true },
                  { feature: "Generate Credit Reports", admin: true, regulator: true, lender: true, viewer: true },
                  { feature: "Batch Upload", admin: true, regulator: false, lender: true, viewer: false },
                  { feature: "File Disputes", admin: true, regulator: true, lender: true, viewer: false },
                  { feature: "Approve/Reject Changes", admin: true, regulator: true, lender: false, viewer: false },
                  { feature: "View Audit Trail", admin: true, regulator: true, lender: false, viewer: false },
                  { feature: "Manage Users", admin: true, regulator: false, lender: false, viewer: false },
                  { feature: "Manage Institutions", admin: true, regulator: false, lender: false, viewer: false },
                  { feature: "Exchange Rates", admin: true, regulator: false, lender: false, viewer: false },
                  { feature: "API Administration", admin: true, regulator: false, lender: false, viewer: false },
                  { feature: "Regulatory Compliance", admin: true, regulator: true, lender: false, viewer: false },
                  { feature: "Retention Policies", admin: true, regulator: true, lender: false, viewer: false },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{row.feature}</td>
                    {(["admin", "regulator", "lender", "viewer"] as Role[]).map(role => (
                      <td key={role} className="text-center py-2 px-3">
                        {row[role] ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold leading-5">✓</span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] leading-5">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20">
        <CardContent className="p-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Need More Help?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => navigate("/help")} className="p-4 bg-background rounded-lg border text-left hover:border-primary/30 transition-colors" data-testid="link-help-manual">
              <BookOpen className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold">Online Manual</p>
              <p className="text-xs text-muted-foreground mt-1">Searchable help articles with FAQs and detailed instructions</p>
            </button>
            <button onClick={() => navigate("/documentation")} className="p-4 bg-background rounded-lg border text-left hover:border-primary/30 transition-colors" data-testid="link-help-docs">
              <FileText className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold">Documentation</p>
              <p className="text-xs text-muted-foreground mt-1">Technical documentation for API integration and system architecture</p>
            </button>
            <button onClick={() => navigate("/helpdesk")} className="p-4 bg-background rounded-lg border text-left hover:border-primary/30 transition-colors" data-testid="link-help-helpdesk">
              <Headset className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold">Helpdesk</p>
              <p className="text-xs text-muted-foreground mt-1">Submit a support ticket for technical issues or questions</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
