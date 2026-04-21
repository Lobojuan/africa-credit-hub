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
  super_admin: "Your training covers every feature — platform navigation, credit operations, AI tools, administration, system configuration, and regulatory reporting.",
  admin: "Your training covers platform navigation, borrower management, credit operations, disputes, AI tools, administration, and regulatory reporting.",
  lender: "Your training covers platform navigation, borrower management, credit accounts & scoring, disputes, and AI & cross-border tools.",
  regulator: "Your training covers platform navigation, disputes & compliance, AI & cross-border analytics, and regulatory oversight & reporting.",
  viewer: "Your training covers platform navigation and borrower management so you can confidently find and read credit records.",
};

export const OVERALL_PASS_PERCENT = 70;
