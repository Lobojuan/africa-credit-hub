import { TRAINING_TRANSLATIONS } from "./training-translations";

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

const MODULE_META = [
  {
    id: "platform-overview",
    tKey: "platformOverview" as const,
    icon: "Monitor",
    color: "from-blue-500 to-blue-600",
    estimatedMinutes: 8,
    passPercent: 70,
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

export function getModules(lang: string): TrainingModule[] {
  const t = TRAINING_TRANSLATIONS[lang] ?? TRAINING_TRANSLATIONS["en"];
  return MODULE_META.map((meta) => {
    const tx = t[meta.tKey];
    return {
      id: meta.id,
      title: tx.title,
      description: tx.description,
      icon: meta.icon,
      color: meta.color,
      estimatedMinutes: meta.estimatedMinutes,
      passPercent: meta.passPercent,
      questions: meta.questions.map((q) => ({
        id: q.id,
        question: tx[q.qk],
        correct: q.correct,
        explanation: tx[q.ek],
      })),
    };
  });
}

export const OVERALL_PASS_PERCENT = 70;
