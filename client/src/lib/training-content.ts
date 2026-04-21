import { TRAINING_TRANSLATIONS } from "./training-translations";

export type UserRole = "super_admin" | "admin" | "lender" | "regulator" | "viewer";

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
  roles: UserRole[];
}

const MODULE_META = [
  {
    id: "platform-overview",
    tKey: "platformOverview" as const,
    icon: "Monitor",
    color: "from-blue-500 to-blue-600",
    estimatedMinutes: 8,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender", "regulator", "viewer"] as UserRole[],
    questions: [
      { id: "po-1", qk: "q1q" as const, ek: "q1e" as const, correct: true },
      { id: "po-2", qk: "q2q" as const, ek: "q2e" as const, correct: false },
      { id: "po-3", qk: "q3q" as const, ek: "q3e" as const, correct: true },
      { id: "po-4", qk: "q4q" as const, ek: "q4e" as const, correct: false },
      { id: "po-5", qk: "q5q" as const, ek: "q5e" as const, correct: true },
      { id: "po-6", qk: "q6q" as const, ek: "q6e" as const, correct: false },
      { id: "po-7", qk: "q7q" as const, ek: "q7e" as const, correct: true },
      { id: "po-8", qk: "q8q" as const, ek: "q8e" as const, correct: false },
    ],
  },
  {
    id: "borrower-management",
    tKey: "borrowerManagement" as const,
    icon: "Users",
    color: "from-teal-500 to-teal-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender", "viewer"] as UserRole[],
    questions: [
      { id: "bm-1", qk: "q1q" as const, ek: "q1e" as const, correct: false },
      { id: "bm-2", qk: "q2q" as const, ek: "q2e" as const, correct: true },
      { id: "bm-3", qk: "q3q" as const, ek: "q3e" as const, correct: true },
      { id: "bm-4", qk: "q4q" as const, ek: "q4e" as const, correct: false },
      { id: "bm-5", qk: "q5q" as const, ek: "q5e" as const, correct: true },
      { id: "bm-6", qk: "q6q" as const, ek: "q6e" as const, correct: true },
      { id: "bm-7", qk: "q7q" as const, ek: "q7e" as const, correct: false },
      { id: "bm-8", qk: "q8q" as const, ek: "q8e" as const, correct: true },
    ],
  },
  {
    id: "credit-accounts-scoring",
    tKey: "creditAccountsScoring" as const,
    icon: "CreditCard",
    color: "from-purple-500 to-purple-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender"] as UserRole[],
    questions: [
      { id: "cs-1", qk: "q1q" as const, ek: "q1e" as const, correct: true },
      { id: "cs-2", qk: "q2q" as const, ek: "q2e" as const, correct: false },
      { id: "cs-3", qk: "q3q" as const, ek: "q3e" as const, correct: true },
      { id: "cs-4", qk: "q4q" as const, ek: "q4e" as const, correct: true },
      { id: "cs-5", qk: "q5q" as const, ek: "q5e" as const, correct: false },
      { id: "cs-6", qk: "q6q" as const, ek: "q6e" as const, correct: false },
      { id: "cs-7", qk: "q7q" as const, ek: "q7e" as const, correct: true },
      { id: "cs-8", qk: "q8q" as const, ek: "q8e" as const, correct: true },
    ],
  },
  {
    id: "disputes-compliance",
    tKey: "disputesCompliance" as const,
    icon: "Shield",
    color: "from-amber-500 to-amber-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender", "regulator"] as UserRole[],
    questions: [
      { id: "dc-1", qk: "q1q" as const, ek: "q1e" as const, correct: true },
      { id: "dc-2", qk: "q2q" as const, ek: "q2e" as const, correct: false },
      { id: "dc-3", qk: "q3q" as const, ek: "q3e" as const, correct: true },
      { id: "dc-4", qk: "q4q" as const, ek: "q4e" as const, correct: true },
      { id: "dc-5", qk: "q5q" as const, ek: "q5e" as const, correct: false },
      { id: "dc-6", qk: "q6q" as const, ek: "q6e" as const, correct: true },
      { id: "dc-7", qk: "q7q" as const, ek: "q7e" as const, correct: false },
      { id: "dc-8", qk: "q8q" as const, ek: "q8e" as const, correct: true },
    ],
  },
  {
    id: "ai-cross-border",
    tKey: "aiCrossBorder" as const,
    icon: "Brain",
    color: "from-violet-500 to-violet-600",
    estimatedMinutes: 8,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender", "regulator"] as UserRole[],
    questions: [
      { id: "ai-1", qk: "q1q" as const, ek: "q1e" as const, correct: true },
      { id: "ai-2", qk: "q2q" as const, ek: "q2e" as const, correct: false },
      { id: "ai-3", qk: "q3q" as const, ek: "q3e" as const, correct: true },
      { id: "ai-4", qk: "q4q" as const, ek: "q4e" as const, correct: false },
      { id: "ai-5", qk: "q5q" as const, ek: "q5e" as const, correct: true },
      { id: "ai-6", qk: "q6q" as const, ek: "q6e" as const, correct: true },
      { id: "ai-7", qk: "q7q" as const, ek: "q7e" as const, correct: false },
      { id: "ai-8", qk: "q8q" as const, ek: "q8e" as const, correct: true },
    ],
  },
  {
    id: "administration-roles",
    tKey: "administrationRoles" as const,
    icon: "Settings",
    color: "from-rose-500 to-rose-600",
    estimatedMinutes: 8,
    passPercent: 70,
    roles: ["super_admin", "admin"] as UserRole[],
    questions: [
      { id: "ar-1", qk: "q1q" as const, ek: "q1e" as const, correct: false },
      { id: "ar-2", qk: "q2q" as const, ek: "q2e" as const, correct: true },
      { id: "ar-3", qk: "q3q" as const, ek: "q3e" as const, correct: false },
      { id: "ar-4", qk: "q4q" as const, ek: "q4e" as const, correct: false },
      { id: "ar-5", qk: "q5q" as const, ek: "q5e" as const, correct: true },
      { id: "ar-6", qk: "q6q" as const, ek: "q6e" as const, correct: true },
      { id: "ar-7", qk: "q7q" as const, ek: "q7e" as const, correct: true },
      { id: "ar-8", qk: "q8q" as const, ek: "q8e" as const, correct: false },
    ],
  },
];

const HARDCODED_MODULES: TrainingModule[] = [
  {
    id: "system-configuration",
    title: "System Configuration & APIs",
    description: "API key management, webhook setup, exchange rate overrides, audit logs, multi-tenant isolation, and the Command Center.",
    icon: "Terminal",
    color: "from-cyan-500 to-cyan-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin"],
    questions: [
      {
        id: "sc-1",
        question: "API keys for each institution can be generated and managed from the API Configuration page.",
        correct: true,
        explanation: "Correct. The API Configuration page allows Super Admins to create, rotate, and revoke API keys per institution with configurable scopes and rate limits.",
      },
      {
        id: "sc-2",
        question: "Webhook endpoints can use plain HTTP without any encryption.",
        correct: false,
        explanation: "Webhook endpoints must use HTTPS. Plain HTTP endpoints are rejected to ensure event payloads are encrypted in transit and cannot be intercepted.",
      },
      {
        id: "sc-3",
        question: "The platform can automatically sync exchange rates every 6 hours from a configured provider.",
        correct: true,
        explanation: "Correct. Auto-sync is configurable per currency. Super Admins can also override any rate manually from the Exchange Rates page when needed.",
      },
      {
        id: "sc-4",
        question: "Audit log entries can be permanently deleted by a Super Admin to free up storage space.",
        correct: false,
        explanation: "Audit logs are immutable — no user, including Super Admins, can delete them. This ensures a tamper-proof regulatory trail for all system actions.",
      },
      {
        id: "sc-5",
        question: "Multi-tenant isolation means each institution can only see borrower records that belong to their own institution.",
        correct: true,
        explanation: "Correct. Tenant isolation is enforced at the database query level. Cross-institution data access requires explicit Super Admin grants or regulatory permissions.",
      },
      {
        id: "sc-6",
        question: "The Command Center is accessible to all logged-in users including Lenders and Viewers.",
        correct: false,
        explanation: "The Command Center is restricted to Super Admin only. It provides multi-country oversight, platform health metrics, billing controls, and system-wide configuration.",
      },
      {
        id: "sc-7",
        question: "A Super Admin can manually override a currency exchange rate when the auto-synced rate is incorrect.",
        correct: true,
        explanation: "Correct. Manual overrides are logged in the audit trail with a reason code and the approving Super Admin's identity for full traceability.",
      },
      {
        id: "sc-8",
        question: "Failed webhook deliveries are automatically retried with increasing delays between attempts.",
        correct: true,
        explanation: "Correct. The system uses exponential backoff for webhook retries. Failed deliveries are visible in the Webhook Management page with full delivery logs.",
      },
    ],
  },
  {
    id: "regulatory-oversight",
    title: "Regulatory Oversight & Reporting",
    description: "Regulatory dashboard, BoG and BSL export formats, compliance queue, cross-border agreements, and regulator permissions.",
    icon: "Landmark",
    color: "from-emerald-600 to-green-700",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin", "regulator"],
    questions: [
      {
        id: "ro-1",
        question: "The Regulatory Dashboard shows NPL ratios, submission rates, and consent coverage across all institutions.",
        correct: true,
        explanation: "Correct. The Regulatory Dashboard provides a real-time view of portfolio health including NPL ratios, SLA compliance, data submission rates, and borrower consent coverage.",
      },
      {
        id: "ro-2",
        question: "The BoG export file format complies with Bank of Ghana CRB v1.1 regulations.",
        correct: true,
        explanation: "Correct. The BoG export generates structured files in the exact format required by the Bank of Ghana Credit Reporting Bureau v1.1 specification.",
      },
      {
        id: "ro-3",
        question: "A Regulator role user can directly edit or delete borrower records from the Regulatory Dashboard.",
        correct: false,
        explanation: "Regulators have read-only access to borrower records. They can view data, run reports, and approve maker-checker submissions, but cannot directly create, edit, or delete records.",
      },
      {
        id: "ro-4",
        question: "The Compliance Queue shows records that have been flagged and are awaiting regulatory review or correction.",
        correct: true,
        explanation: "Correct. The Compliance Queue aggregates flagged records — including dispute escalations, SLA breaches, and data quality issues — in one place for efficient regulatory review.",
      },
      {
        id: "ro-5",
        question: "Cross-border credit searches can be performed by any user without any prior agreements.",
        correct: false,
        explanation: "Cross-border searches require a valid data-sharing agreement between the countries involved. The system enforces this — searches are blocked until an active agreement is on file.",
      },
      {
        id: "ro-6",
        question: "The BSL (Bank of Sierra Leone) export uses the same file format as the BoG (Bank of Ghana) export.",
        correct: false,
        explanation: "BSL and BoG exports use different formats that comply with each regulator's specific data standards. The system generates country-specific files automatically based on the target regulator.",
      },
      {
        id: "ro-7",
        question: "Regulators can approve or reject maker-checker submissions from institutions via the platform.",
        correct: true,
        explanation: "Correct. The Regulator role has approval rights in the maker-checker workflow. This ensures regulatory sign-off on significant data changes before they become permanent.",
      },
      {
        id: "ro-8",
        question: "The Regulatory Dashboard can be filtered by institution type, country, and date range.",
        correct: true,
        explanation: "Correct. All three filter dimensions are available, allowing regulators to drill into specific markets, institution categories, or time periods for targeted oversight.",
      },
    ],
  },
  {
    id: "loan-origination-collateral",
    title: "Loan Origination & Collateral Registry",
    description: "Full loan lifecycle management, 7 loan types, maker-checker approval, amortization schedules, collateral pledging, and asset tracking.",
    icon: "Banknote",
    color: "from-orange-500 to-orange-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin", "lender"],
    questions: [
      {
        id: "lo-1",
        question: "A loan application submitted by a Lender must go through the maker-checker approval process before disbursement.",
        correct: true,
        explanation: "Correct. All loan origination submissions enter the maker-checker queue. An Admin or Super Admin must review and approve the application before funds can be disbursed.",
      },
      {
        id: "lo-2",
        question: "The Loan Origination module supports only one type of loan product.",
        correct: false,
        explanation: "The platform supports 7 loan types: Personal, Business, Mortgage, Auto, Education, Agriculture, and Microfinance — each with configurable terms, rates, and approval rules.",
      },
      {
        id: "lo-3",
        question: "An amortization schedule is automatically generated when a loan is approved and disbursed.",
        correct: true,
        explanation: "Correct. The system generates a full amortization schedule on disbursal, showing each repayment date, principal, interest, and outstanding balance for the full loan term.",
      },
      {
        id: "lo-4",
        question: "Collateral registered in the Collateral Registry can only be linked to one loan at a time.",
        correct: true,
        explanation: "Correct. Each collateral asset is linked to a single active loan. Attempting to pledge an already-encumbered asset against a second loan is blocked by the system.",
      },
      {
        id: "lo-5",
        question: "The Collateral Registry tracks asset type, value, location, document reference, and lien status.",
        correct: true,
        explanation: "Correct. Each collateral record stores asset type (land, vehicle, equipment, etc.), estimated value, geographic location, document reference number, and current lien status.",
      },
      {
        id: "lo-6",
        question: "Once a loan is disbursed, its terms (rate, tenure, amount) can be freely edited by any user.",
        correct: false,
        explanation: "Disbursed loan terms are locked. Modifications require a formal amendment process with maker-checker approval and are logged in the audit trail to preserve regulatory integrity.",
      },
      {
        id: "lo-7",
        question: "A Lender can approve their own loan application to speed up processing.",
        correct: false,
        explanation: "Maker-checker rules prohibit self-approval. The user who submits an application cannot be the same user who approves it — a separate authorized approver is always required.",
      },
      {
        id: "lo-8",
        question: "Releasing collateral from the Collateral Registry is only allowed after the linked loan is fully repaid.",
        correct: true,
        explanation: "Correct. The system enforces lien integrity — collateral can only be released (marked as unencumbered) once the linked loan reaches a Closed or Fully Repaid status.",
      },
    ],
  },
  {
    id: "billing-revenue",
    title: "Billing & Revenue Management",
    description: "Wallet and prepaid billing, transaction-based monetization, two-tier revenue split, institution fee management, and settlement & payout.",
    icon: "Wallet",
    color: "from-green-600 to-emerald-700",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin"],
    questions: [
      {
        id: "br-1",
        question: "The platform uses a transaction-based billing model where institutions are charged per credit inquiry or report generated.",
        correct: true,
        explanation: "Correct. The monetization model is transaction-based. Each credit search, report generation, and API call is metered and billed against the institution's prepaid wallet balance.",
      },
      {
        id: "br-2",
        question: "The two-tier revenue split means 100% of transaction fees go directly to the platform operator.",
        correct: false,
        explanation: "The two-tier split divides revenue between the platform operator and the registered data provider. The split percentage is configurable per institution and per transaction type.",
      },
      {
        id: "br-3",
        question: "An institution's prepaid wallet balance can go negative without any restriction.",
        correct: false,
        explanation: "When a wallet balance reaches zero, API access and report generation are suspended for that institution until the wallet is topped up. Negative balances are not permitted.",
      },
      {
        id: "br-4",
        question: "Super Admins can view billing records, top-up history, and transaction logs from the Billing page.",
        correct: true,
        explanation: "Correct. The Billing page provides a full financial history per institution: wallet top-ups, transaction debits, revenue splits, payout records, and outstanding balances.",
      },
      {
        id: "br-5",
        question: "Settlement and payout to data providers is processed automatically based on a configurable schedule.",
        correct: true,
        explanation: "Correct. The settlement engine calculates each data provider's earned share and generates payout records on the configured cycle (daily, weekly, or monthly).",
      },
      {
        id: "br-6",
        question: "Institution Analytics shows usage metrics including the number of API calls, report generations, and search queries per day.",
        correct: true,
        explanation: "Correct. The Institution Analytics dashboard breaks down daily event counts by type — credit searches, report generations, batch uploads, and API calls — with billing impact shown alongside.",
      },
      {
        id: "br-7",
        question: "A Super Admin can set different fee rates for different transaction types within the same institution.",
        correct: true,
        explanation: "Correct. Fee structures are configurable per transaction type per institution. For example, credit report generation can carry a different fee than a basic credit search.",
      },
      {
        id: "br-8",
        question: "White-label branding for an institution (custom colors, logo, domain) is configured from the Billing page.",
        correct: false,
        explanation: "White-label branding is configured from the Institution Branding page, not the Billing page. Billing covers financial settings; branding covers visual identity and custom domain configuration.",
      },
    ],
  },
  {
    id: "data-management-export",
    title: "Data Management & Export",
    description: "Export Center with AES-256 encryption, retention policies, data subject erasure (GDPR), bulk upload (XBRL/IFF), and export history audit trail.",
    icon: "Database",
    color: "from-slate-600 to-slate-700",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin"],
    questions: [
      {
        id: "dm-1",
        question: "The Export Center can produce a full data portability export of all borrowers, accounts, and audit logs.",
        correct: true,
        explanation: "Correct. The Export Center generates a comprehensive ZIP export covering borrowers, credit accounts, consent records, and audit logs — suitable for data portability or DR purposes.",
      },
      {
        id: "dm-2",
        question: "Exports from the Export Center can be optionally encrypted with AES-256 and verified with a SHA-256 integrity hash.",
        correct: true,
        explanation: "Correct. When encryption is enabled, the export is AES-256 encrypted with the passphrase you set. A SHA-256 hash is always generated so recipients can verify the file's integrity.",
      },
      {
        id: "dm-3",
        question: "Data retention policies can be configured to automatically archive or delete records older than a defined threshold.",
        correct: true,
        explanation: "Correct. Retention Policies define a country, data type, retention period, and enforcement action (flag, archive, or delete). The retention scanner enforces these on a scheduled basis.",
      },
      {
        id: "dm-4",
        question: "An Erasure Request permanently deletes all data linked to a borrower including credit accounts, consents, and audit logs.",
        correct: false,
        explanation: "Erasure Requests delete borrower PII and directly linked records, but audit logs are immutable and cannot be erased. This preserves the regulatory trail while honouring data subject rights.",
      },
      {
        id: "dm-5",
        question: "The IFF bulk upload format is used for importing structured credit data from international financial institutions.",
        correct: true,
        explanation: "Correct. The IFF (International Financial Format) upload accepts XML files from external institutions in a standardised format, enabling bulk import of structured credit portfolio data.",
      },
      {
        id: "dm-6",
        question: "Admins are rate-limited to 5 exports per hour to prevent system overload.",
        correct: true,
        explanation: "Correct. The export rate limiter allows a maximum of 5 exports per hour per Admin. Super Admins have the same limit in the standard configuration, and consumers are limited to 1 per day.",
      },
      {
        id: "dm-7",
        question: "The Retention Policy Scanner can be run globally across all countries by both Admin and Super Admin.",
        correct: false,
        explanation: "The Retention Policy Scanner is country-scoped for Admins (they only scan their own country's data). Super Admins can run a global scan across all countries simultaneously.",
      },
      {
        id: "dm-8",
        question: "The Export History tab provides an audit trail of all previous exports including who ran them and when.",
        correct: true,
        explanation: "Correct. Export History logs every export with timestamp, user, export type, record count, encryption status, and file size — providing a full chain of custody for all data exports.",
      },
    ],
  },
  {
    id: "consumer-onboarding",
    title: "Consumer Portal & Institution Onboarding",
    description: "Consumer self-service registration and credit checks, institution registration approval workflow, white-label branding, and fraud prevention.",
    icon: "UserCheck",
    color: "from-pink-500 to-rose-600",
    estimatedMinutes: 10,
    passPercent: 70,
    roles: ["super_admin", "admin"],
    questions: [
      {
        id: "co-1",
        question: "Consumers can register on the Consumer Portal without needing an admin to create their account first.",
        correct: true,
        explanation: "Correct. The Consumer Portal (/consumer/register) allows individuals to self-register using their national ID and personal details. Dual-channel verification (SMS + email) confirms identity.",
      },
      {
        id: "co-2",
        question: "Once registered on the Consumer Portal, individuals can view their credit score, accounts, and dispute history.",
        correct: true,
        explanation: "Correct. Authenticated consumers can view their bureau score, linked credit accounts, dispute history, consent records, and download their full credit report as a PDF.",
      },
      {
        id: "co-3",
        question: "A new institution can begin accessing borrower data immediately after completing the registration form.",
        correct: false,
        explanation: "Institution registration requires Super Admin approval before access is granted. The platform validates BRN (Business Registration Number), checks for duplicate entities, and flags fraud signals before approval.",
      },
      {
        id: "co-4",
        question: "The institution onboarding process includes Business Registration Number (BRN) validation to prevent fraudulent registrations.",
        correct: true,
        explanation: "Correct. BRN validation is part of the fraud prevention layer in institution onboarding. Duplicate BRNs, mismatched company details, and suspicious patterns trigger a hold for Super Admin review.",
      },
      {
        id: "co-5",
        question: "White-label branding allows each institution to set their own primary/secondary colors, logo, tagline, and custom domain.",
        correct: true,
        explanation: "Correct. The Institution Branding page allows full white-label customization: color palette, logo URL, tagline, support contact, footer text, and a custom domain — with a live portal preview.",
      },
      {
        id: "co-6",
        question: "Consumers can file disputes directly from the Consumer Portal without contacting the institution.",
        correct: true,
        explanation: "Correct. The Consumer Portal includes a dispute filing dialog where consumers select the dispute type, provide a description, and reference an account. The system creates a 5-business-day SLA case automatically.",
      },
      {
        id: "co-7",
        question: "Super Admins can approve, reject, or request more information from institutions awaiting onboarding approval.",
        correct: true,
        explanation: "Correct. The Institutions page shows all pending registrations with full details. Super Admins can approve, reject with a reason, or place on hold pending additional documentation.",
      },
      {
        id: "co-8",
        question: "Consumers are limited to one credit score lookup per day to prevent system abuse.",
        correct: true,
        explanation: "Correct. The Consumer Portal rate-limits credit score lookups to protect system resources and prevent misuse. The limit resets daily and is enforced per verified consumer account.",
      },
    ],
  },
];

export function getModules(lang: string): TrainingModule[] {
  const t = TRAINING_TRANSLATIONS[lang] ?? TRAINING_TRANSLATIONS["en"];
  const translated = MODULE_META.map((meta) => {
    const tx = t[meta.tKey];
    return {
      id: meta.id,
      title: tx.title,
      description: tx.description,
      icon: meta.icon,
      color: meta.color,
      estimatedMinutes: meta.estimatedMinutes,
      passPercent: meta.passPercent,
      roles: meta.roles,
      questions: meta.questions.map((q) => ({
        id: q.id,
        question: tx[q.qk],
        correct: q.correct,
        explanation: tx[q.ek],
      })),
    };
  });
  return [...translated, ...HARDCODED_MODULES];
}

export function getModulesForRole(lang: string, role: UserRole): TrainingModule[] {
  return getModules(lang).filter((m) => m.roles.includes(role));
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  lender: "Lender",
  regulator: "Regulator",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Your training covers all 12 modules — platform navigation, credit operations, AI tools, loan origination & collateral, billing & revenue, data management & export, consumer portal, administration, system configuration, and regulatory reporting.",
  admin: "Your training covers 9 modules — platform navigation, borrower management, credit operations, disputes, AI tools, loan origination, data management & export, consumer portal, and regulatory reporting.",
  lender: "Your training covers 5 modules — platform navigation, borrower management, credit accounts & scoring, disputes, and loan origination & collateral.",
  regulator: "Your training covers 4 modules — platform navigation, disputes & compliance, AI & cross-border analytics, and regulatory oversight & reporting.",
  viewer: "Your training covers 2 modules — platform navigation and borrower management so you can confidently find and read credit records.",
};

export const OVERALL_PASS_PERCENT = 70;
