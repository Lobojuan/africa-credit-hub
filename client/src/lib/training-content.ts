export interface TrainingQuestion {
  id: string;
  question: string;
  correct: boolean;
  explanation: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedMinutes: number;
  passPercent: number;
  questions: TrainingQuestion[];
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: "platform-overview",
    title: "Platform Overview & Navigation",
    description: "Learn how to log in, navigate the sidebar, understand user roles, and find your way around the system.",
    icon: "Monitor",
    color: "from-blue-500 to-blue-600",
    estimatedMinutes: 8,
    passPercent: 70,
    questions: [
      {
        id: "po-1",
        question: "The system supports five user roles: Super Admin, Administrator, Regulator, Lender, and Viewer.",
        correct: true,
        explanation: "Correct. Each role has different access levels — Super Admin sees everything across all countries, while Viewer has read-only access.",
      },
      {
        id: "po-2",
        question: "All users of every role can see every menu item in the sidebar.",
        correct: false,
        explanation: "Not quite. Menu items are automatically hidden based on your role. Lenders do not see Administrator or Regulator-only sections.",
      },
      {
        id: "po-3",
        question: "You can enable Multi-Factor Authentication (MFA/TOTP) from your profile after logging in.",
        correct: true,
        explanation: "Correct. MFA/TOTP can be activated from your profile page using any authenticator app for added security.",
      },
      {
        id: "po-4",
        question: "After 5 failed login attempts your account is temporarily locked.",
        correct: false,
        explanation: "The lockout threshold is 3 failed attempts, not 5. This protects against brute-force attacks.",
      },
      {
        id: "po-5",
        question: "The platform covers all 54 African countries and supports more than 42 currencies.",
        correct: true,
        explanation: "Correct. The Pan-African Credit Registry covers all 54 African countries with 42+ currencies and five interface languages.",
      },
      {
        id: "po-6",
        question: "Passwords never expire in this system.",
        correct: false,
        explanation: "Passwords expire every 90 days for security. The system will prompt you to change your password when it expires.",
      },
      {
        id: "po-7",
        question: "Social login options include Google, Microsoft, Apple, and Enterprise SSO.",
        correct: true,
        explanation: "Correct. These four social/SSO providers are available on the login page as alternative sign-in methods.",
      },
      {
        id: "po-8",
        question: "A Super Admin can only see data for their own country.",
        correct: false,
        explanation: "Super Admins see data across ALL countries and institutions. Country-level restriction applies to the Administrator role.",
      },
    ],
  },
  {
    id: "borrower-management",
    title: "Borrower Management",
    description: "Registering consumers and businesses, the maker-checker approval process, and borrower profiles.",
    icon: "Users",
    color: "from-teal-500 to-teal-600",
    estimatedMinutes: 10,
    passPercent: 70,
    questions: [
      {
        id: "bm-1",
        question: "When you add a new borrower, the record is immediately active without any further steps.",
        correct: false,
        explanation: "Newly created records enter the maker-checker approval queue. A different authorized user must approve the record before it becomes active.",
      },
      {
        id: "bm-2",
        question: "National IDs must be unique within a country.",
        correct: true,
        explanation: "Correct. Each national ID can only be registered once within a country to prevent duplicate records.",
      },
      {
        id: "bm-3",
        question: "The PEP flag should be set for Politically Exposed Persons.",
        correct: true,
        explanation: "Correct. PEP (Politically Exposed Person) is a regulatory requirement — this flag triggers enhanced due diligence in reports.",
      },
      {
        id: "bm-4",
        question: "A Lender role user can see all borrowers across all institutions.",
        correct: false,
        explanation: "Lenders only see borrowers associated with their own institution. Administrators see all borrowers across all institutions.",
      },
      {
        id: "bm-5",
        question: "Borrowers are separated into two categories: Consumers (individuals) and Businesses (corporates).",
        correct: true,
        explanation: "Correct. The sidebar has separate 'Consumers' and 'Businesses' sections, each with a dedicated list view and form.",
      },
      {
        id: "bm-6",
        question: "You can filter the borrower list by name, national ID, phone, or email.",
        correct: true,
        explanation: "Correct. The search bar on the borrower list supports all four of these filter criteria.",
      },
      {
        id: "bm-7",
        question: "A Viewer role user can add new borrower records.",
        correct: false,
        explanation: "Viewer has read-only access. Only Lender and Administrator roles can create new borrower records.",
      },
      {
        id: "bm-8",
        question: "You can generate an AI Risk Analysis from a borrower's detail page.",
        correct: true,
        explanation: "Correct. The purple 'AI Risk Analysis' button on the borrower detail page generates an AI-powered risk score with key factors and recommendations.",
      },
    ],
  },
  {
    id: "credit-accounts-scoring",
    title: "Credit Accounts & Scoring",
    description: "Managing credit facilities, understanding the bureau score model, and generating credit reports.",
    icon: "CreditCard",
    color: "from-purple-500 to-purple-600",
    estimatedMinutes: 10,
    passPercent: 70,
    questions: [
      {
        id: "cs-1",
        question: "The bureau credit score ranges from 300 to 850.",
        correct: true,
        explanation: "Correct. The scoring model uses a 300–850 scale. Higher scores represent lower credit risk, with 750+ rated Excellent.",
      },
      {
        id: "cs-2",
        question: "A score of 720 would be classified as 'Fair' on the system's grading scale.",
        correct: false,
        explanation: "720 falls in the 'Good' band (700–749). 'Fair' covers scores from 650 to 699.",
      },
      {
        id: "cs-3",
        question: "Credit reports can be downloaded as PDFs in all five platform languages.",
        correct: true,
        explanation: "Correct. The PDF language selector allows downloading reports in English, French, Portuguese, Arabic, or Swahili.",
      },
      {
        id: "cs-4",
        question: "Each generated credit report receives a unique serial number for audit tracking.",
        correct: true,
        explanation: "Correct. Serial numbers ensure every report can be traced and verified in the audit trail.",
      },
      {
        id: "cs-5",
        question: "For Islamic finance products, there is no special option in the credit account form.",
        correct: false,
        explanation: "There is an 'Interest-Free' checkbox specifically for Islamic finance products when creating or editing a credit account.",
      },
      {
        id: "cs-6",
        question: "The system only supports a single currency per institution.",
        correct: false,
        explanation: "The system supports 42+ African currencies simultaneously, with automatic exchange rate conversion for multi-currency exposure consolidation.",
      },
      {
        id: "cs-7",
        question: "Payment history is the most heavily weighted factor in the credit score calculation.",
        correct: true,
        explanation: "Correct. Payment history carries the highest weight in the scoring model, followed by credit utilization, length of credit, credit mix, and new inquiries.",
      },
      {
        id: "cs-8",
        question: "Business borrowers get a different credit report format from individual consumers.",
        correct: true,
        explanation: "Correct. Business Credit Reports have a separate format tailored to corporate entities, distinct from the individual Consumer Credit Report.",
      },
    ],
  },
  {
    id: "disputes-compliance",
    title: "Disputes & Compliance",
    description: "Filing and resolving disputes, SLA deadlines, the audit trail, and regulatory compliance tools.",
    icon: "Shield",
    color: "from-amber-500 to-amber-600",
    estimatedMinutes: 10,
    passPercent: 70,
    questions: [
      {
        id: "dc-1",
        question: "Financial corrections have a 2-day SLA and non-financial corrections have a 5-day SLA.",
        correct: true,
        explanation: "Correct. These SLA thresholds are set by regulation. Breached SLAs appear in regulatory reports automatically.",
      },
      {
        id: "dc-2",
        question: "You can approve a record that you yourself submitted in the maker-checker system.",
        correct: false,
        explanation: "You cannot approve your own submissions. The maker-checker system requires a different authorized user to approve every change.",
      },
      {
        id: "dc-3",
        question: "The audit log uses SHA-256 hash chaining to prevent tampering.",
        correct: true,
        explanation: "Correct. Every audit entry is hash-chained to the previous one, making it impossible to alter the record without detection.",
      },
      {
        id: "dc-4",
        question: "Disputes approaching their SLA deadline are highlighted in red in the dispute list.",
        correct: true,
        explanation: "Correct. The dispute list uses red highlighting to flag items nearing or past their SLA deadline so staff can prioritize them.",
      },
      {
        id: "dc-5",
        question: "The Regulatory Compliance dashboard only shows data for the current month.",
        correct: false,
        explanation: "The dashboard shows ongoing compliance metrics including submission rates, SLA performance, consent coverage, and NPL ratios — not limited to one month.",
      },
      {
        id: "dc-6",
        question: "The BOG Export is used for Bank of Ghana regulatory submissions.",
        correct: true,
        explanation: "Correct. BOG Export generates files in the BoG CRB v1.1 format required by the Bank of Ghana. BSL Export is the equivalent for Sierra Leone.",
      },
      {
        id: "dc-7",
        question: "Only Super Admins and Administrators can approve or reject maker-checker submissions.",
        correct: false,
        explanation: "Regulators can also approve or reject submissions. The approval roles are: Administrator, Regulator, and Super Admin.",
      },
      {
        id: "dc-8",
        question: "The audit trail can be exported as CSV or Excel.",
        correct: true,
        explanation: "Correct. Use the export buttons on the Audit Trail page after applying date range filters to download filtered records in CSV or Excel format.",
      },
    ],
  },
  {
    id: "ai-cross-border",
    title: "AI Features & Cross-Border",
    description: "AI-powered risk analysis, the AI Command Center, Telco scoring, and cross-border data sharing.",
    icon: "Brain",
    color: "from-violet-500 to-violet-600",
    estimatedMinutes: 8,
    passPercent: 70,
    questions: [
      {
        id: "ai-1",
        question: "The AI Command Center lets you ask questions in plain language, such as 'Show me all defaulted borrowers in Ghana'.",
        correct: true,
        explanation: "Correct. The AI Command Center is a natural-language interface that interprets your query, runs the analysis, and returns results with charts and tables.",
      },
      {
        id: "ai-2",
        question: "Telco scores can replace traditional bureau scores entirely.",
        correct: false,
        explanation: "Telco scores are designed to complement, not replace, traditional bureau scores. They provide alternative credit scoring for unbanked individuals.",
      },
      {
        id: "ai-3",
        question: "Cross-border access to borrower records requires a valid data-sharing agreement between countries.",
        correct: true,
        explanation: "Correct. Bilateral or multilateral data-sharing agreements must be in place before cross-border searches are permitted.",
      },
      {
        id: "ai-4",
        question: "The AI Risk Analysis button on the borrower detail page is green in color.",
        correct: false,
        explanation: "The AI Risk Analysis button has a purple gradient style, distinguishing it from other action buttons on the page.",
      },
      {
        id: "ai-5",
        question: "PAPSS stands for the Pan-African Payment and Settlement System.",
        correct: true,
        explanation: "Correct. PAPSS is integrated into the cross-border module to track and reconcile cross-border payment settlements in real time.",
      },
      {
        id: "ai-6",
        question: "Telco scoring uses factors such as airtime usage, mobile money transactions, and top-up frequency.",
        correct: true,
        explanation: "Correct. These mobile usage patterns help generate alternative credit scores for people who lack traditional credit histories.",
      },
      {
        id: "ai-7",
        question: "Portfolio Intelligence provides analysis of individual borrowers only.",
        correct: false,
        explanation: "Portfolio Intelligence analyzes the entire credit portfolio — concentration risk, sector exposure, geographic distribution, and trend forecasting across many borrowers.",
      },
      {
        id: "ai-8",
        question: "The floating chatbot in the bottom-right corner has an AI Assistant mode.",
        correct: true,
        explanation: "Correct. Click the Sparkles icon in the chatbot to switch to AI Assistant mode for answering questions about credit data and regulations.",
      },
    ],
  },
  {
    id: "administration-roles",
    title: "Administration & Roles",
    description: "Managing users, institutions, exchange rates, system administration, and understanding role permissions.",
    icon: "Settings",
    color: "from-rose-500 to-rose-600",
    estimatedMinutes: 8,
    passPercent: 70,
    questions: [
      {
        id: "ar-1",
        question: "The Command Center console is available to all Administrator role users.",
        correct: false,
        explanation: "The Command Center is exclusive to the Super Admin role. It provides multi-country oversight and is not visible to regular Administrators.",
      },
      {
        id: "ar-2",
        question: "Newly registered institutions start with a 'Pending' status and must be approved.",
        correct: true,
        explanation: "Correct. New institutions go through an approval step before becoming active participants in the registry.",
      },
      {
        id: "ar-3",
        question: "Exchange rates in the system are only updated manually by an administrator.",
        correct: false,
        explanation: "The system can auto-sync exchange rates every 6 hours. Administrators can also update rates manually when needed.",
      },
      {
        id: "ar-4",
        question: "A Lender role user can create and manage other users.",
        correct: false,
        explanation: "User management is restricted to the Administrator and Super Admin roles. Lenders cannot create or modify user accounts.",
      },
      {
        id: "ar-5",
        question: "Webhook Management allows you to configure outbound event notifications to external systems.",
        correct: true,
        explanation: "Correct. Webhooks notify external systems (like your own core banking system) of key events in real time.",
      },
      {
        id: "ar-6",
        question: "A Regulator role can view the Regulatory Dashboard.",
        correct: true,
        explanation: "Correct. The Regulatory Dashboard is designed specifically for Regulators and senior management to oversee credit market health.",
      },
      {
        id: "ar-7",
        question: "System Status shows health indicators for the database, API, background jobs, and integrations.",
        correct: true,
        explanation: "Correct. Each service component displays a green (healthy), yellow (warning), or red (critical) indicator on the System Status page.",
      },
      {
        id: "ar-8",
        question: "Batch upload supports only CSV files.",
        correct: false,
        explanation: "Batch upload supports both CSV and JSON formats. You can also paste JSON data directly into the text area on the upload page.",
      },
    ],
  },
];

export const OVERALL_PASS_PERCENT = 70;

export function getModuleById(id: string): TrainingModule | undefined {
  return TRAINING_MODULES.find((m) => m.id === id);
}
