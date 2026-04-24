import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  getModulesForRole, OVERALL_PASS_PERCENT, ROLE_LABELS, ROLE_DESCRIPTIONS,
  type TrainingModule, type TrainingQuestion, type UserRole,
} from "@/lib/training-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Monitor, Users, CreditCard, Shield, Brain, Settings, Terminal, Landmark,
  CheckCircle2, XCircle, Trophy, BookOpen, Clock, ChevronRight,
  RotateCcw, ArrowLeft, Star, GraduationCap, Target, Award,
  Check, X, AlertCircle, ExternalLink, Printer,
  Gavel, DollarSign, Bell, ClipboardList, Cpu, BarChart, Smartphone, Globe, Server,
  Banknote, Wallet, Database, UserCheck,
  Zap, Flame, Lock, Play, Medal, TrendingUp,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Monitor, Users, CreditCard, Shield, Brain, Settings, Terminal, Landmark,
  Gavel, DollarSign, Bell, ClipboardList, Cpu, BarChart, Smartphone, Globe, Server,
  Banknote, Wallet, Database, UserCheck,
};

const XP_PER_PASS = 150;
const XP_PER_ATTEMPT = 20;
const XP_PER_LEVEL = 500;

const LEVEL_NAMES = [
  "Trainee", "Junior Analyst", "Credit Analyst", "Senior Analyst",
  "Credit Specialist", "Senior Specialist", "Credit Expert", "Registry Master",
];

const MODULE_DIFFICULTY: Record<string, number> = {
  "platform-overview": 1, "borrower-management": 1, "borrower-alerts-monitoring": 1,
  "credit-accounts-scoring": 2, "disputes-compliance": 2, "loan-origination-collateral": 2,
  "consent-management": 2, "administration-roles": 2, "court-judgments-dishonoured-cheques": 2,
  "ai-cross-border": 3, "decision-engine": 3, "portfolio-intelligence": 3,
  "telco-lending-scoring": 3, "system-configuration": 3, "regulatory-oversight": 3,
  "data-management-export": 3, "billing-revenue": 3, "papss-settlements": 3,
  "collections-debt-management": 2, "consumer-onboarding": 2, "backup-system-status": 3,
};

const LEADERBOARD_PEERS = [
  { name: "K. Asante", passes: 21, avg: 98 },
  { name: "A. Boateng", passes: 19, avg: 95 },
  { name: "E. Mensah", passes: 18, avg: 92 },
  { name: "S. Osei", passes: 15, avg: 88 },
  { name: "D. Ankrah", passes: 12, avg: 84 },
  { name: "F. Quaye", passes: 10, avg: 79 },
];

type Screen = "home" | "quiz" | "result";

interface AnswerRecord {
  questionId: string;
  userAnswer: boolean;
  correct: boolean;
}

interface QuizState {
  module: TrainingModule;
  currentIndex: number;
  answers: AnswerRecord[];
  showExplanation: boolean;
  lastAnswerCorrect: boolean | null;
}

interface BestAttempt {
  moduleId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

interface Achievement {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  hint: string;
}

function getPercent(score: number, total: number) {
  return Math.round((score / total) * 100);
}

function computeXP(progress: BestAttempt[]) {
  const xp = progress.reduce((sum, a) => {
    return sum + (a.passed ? XP_PER_PASS : XP_PER_ATTEMPT);
  }, 0);
  const level = Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, LEVEL_NAMES.length);
  const xpInLevel = xp % XP_PER_LEVEL;
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  return { xp, level, xpInLevel, levelName };
}

function computeStreak(progress: BestAttempt[]): number {
  if (!progress.length) return 0;
  const days = new Set(
    progress.map((a) => new Date(a.completedAt).toDateString())
  );
  const sorted = Array.from(days).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let check = new Date();
  check.setHours(0, 0, 0, 0);
  for (const d of sorted) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((check.getTime() - day.getTime()) / 86400000);
    if (diff <= 1) { streak++; check = day; }
    else break;
  }
  return streak;
}

function computeAchievements(progress: BestAttempt[], totalModules: number): Achievement[] {
  const passed = progress.filter((a) => a.passed);
  const avgScore = passed.length
    ? Math.round(passed.reduce((s, a) => s + getPercent(a.score, a.totalQuestions), 0) / passed.length)
    : 0;
  const hasPerfect = passed.some((a) => a.score === a.totalQuestions);

  return [
    {
      id: "first_steps", label: "First Steps", icon: <Play className="w-4 h-4" />,
      color: "from-blue-500 to-blue-600", hint: "Complete your first module attempt",
      unlocked: progress.length >= 1,
    },
    {
      id: "quick_learner", label: "Quick Learner", icon: <Zap className="w-4 h-4" />,
      color: "from-yellow-500 to-amber-500", hint: "Pass your first module",
      unlocked: passed.length >= 1,
    },
    {
      id: "on_fire", label: "On Fire", icon: <Flame className="w-4 h-4" />,
      color: "from-orange-500 to-red-500", hint: "Pass 5 modules",
      unlocked: passed.length >= 5,
    },
    {
      id: "halfway", label: "Halfway There", icon: <TrendingUp className="w-4 h-4" />,
      color: "from-teal-500 to-cyan-500", hint: `Pass ${Math.ceil(totalModules / 2)} modules`,
      unlocked: passed.length >= Math.ceil(totalModules / 2),
    },
    {
      id: "perfectionist", label: "Perfectionist", icon: <Star className="w-4 h-4" />,
      color: "from-purple-500 to-violet-600", hint: "Score 100% on any module",
      unlocked: hasPerfect,
    },
    {
      id: "top_scorer", label: "Top Scorer", icon: <Medal className="w-4 h-4" />,
      color: "from-emerald-500 to-green-600", hint: "Maintain 90%+ average score",
      unlocked: avgScore >= 90 && passed.length >= 3,
    },
    {
      id: "certified", label: "Certified", icon: <Award className="w-4 h-4" />,
      color: "from-amber-400 to-yellow-500", hint: "Pass all modules for your role",
      unlocked: passed.length === totalModules && totalModules > 0,
    },
  ];
}

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? BookOpen;
  return <Icon className={className} />;
}

function DifficultyStars({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 40, passed }: { pct: number; size?: number; passed: boolean }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/20" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={passed ? "#22c55e" : "#f59e0b"}
        strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function ModuleCard({ module, attempt, onStart }: {
  module: TrainingModule;
  attempt?: BestAttempt;
  onStart: () => void;
}) {
  const pct = attempt ? getPercent(attempt.score, attempt.totalQuestions) : null;
  const passed = attempt?.passed ?? false;
  const attempted = !!attempt;
  const difficulty = MODULE_DIFFICULTY[module.id] ?? 2;
  const isNew = !attempted;

  return (
    <div
      className={`relative rounded-2xl border cursor-pointer group transition-all duration-200 overflow-hidden
        ${passed
          ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-background hover:shadow-emerald-100 dark:hover:shadow-none"
          : "border-border/60 bg-card hover:border-primary/40"}
        hover:shadow-lg hover:-translate-y-0.5`}
      onClick={onStart}
      data-testid={`card-training-module-${module.id}`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${module.color}`} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${module.color} text-white shrink-0 shadow-sm`}>
            <ModuleIcon name={module.icon} className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-end gap-1.5 mt-0.5">
            <div className="flex items-center gap-1 bg-primary/8 dark:bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
              <Zap className="w-3 h-3" /> +{XP_PER_PASS} XP
            </div>
            <DifficultyStars stars={difficulty} />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
            {module.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {module.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {module.questions.length}q</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{module.estimatedMinutes}m</span>
          </div>
          {attempted && pct !== null && (
            <span className={`font-semibold ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              Best: {pct}%
            </span>
          )}
        </div>

        {attempted && pct !== null && (
          <div className="space-y-1.5">
            <Progress value={pct} className={`h-1.5 ${passed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"}`} />
          </div>
        )}

        <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors
          ${passed
            ? "bg-emerald-500 text-white group-hover:bg-emerald-600"
            : isNew
            ? "bg-primary text-primary-foreground group-hover:bg-primary/90"
            : "bg-amber-500 text-white group-hover:bg-amber-600"}`}
        >
          <span className="flex items-center gap-1.5">
            {passed ? <><CheckCircle2 className="w-4 h-4" /> Passed — Play Again</> :
             isNew  ? <><Play className="w-4 h-4" /> Start Module</> :
                      <><RotateCcw className="w-4 h-4" /> Retry</>}
          </span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function DailyChallengeBanner({ module, onStart }: { module: TrainingModule; onStart: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white cursor-pointer group"
      onClick={onStart}
      data-testid="card-daily-challenge"
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,white,transparent)]" />
      <div className="relative flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 shrink-0 backdrop-blur-sm">
            <Zap className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Daily Focus</span>
              <Badge className="bg-yellow-400/30 text-yellow-200 border-yellow-400/40 text-xs py-0 px-1.5">2× XP</Badge>
            </div>
            <p className="font-bold text-base truncate">{module.title}</p>
            <p className="text-sm text-white/70 truncate hidden sm:block">{module.description.split(",")[0]}</p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-white text-indigo-700 hover:bg-white/90 font-bold gap-1.5 shadow-md"
          data-testid="button-daily-challenge"
        >
          <Play className="w-3.5 h-3.5" /> Start
        </Button>
      </div>
    </div>
  );
}

function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Achievements</h2>
      <div className="flex flex-wrap gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.unlocked ? a.label : `Locked: ${a.hint}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all
              ${a.unlocked
                ? `bg-gradient-to-r ${a.color} text-white border-transparent shadow-sm`
                : "bg-muted/50 text-muted-foreground border-border/40 grayscale"}`}
            data-testid={`badge-achievement-${a.id}`}
          >
            {a.unlocked ? a.icon : <Lock className="w-3 h-3" />}
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLeaderboard({ userPassCount, userAvgScore, totalModules, userName }: {
  userPassCount: number;
  userAvgScore: number;
  totalModules: number;
  userName: string;
}) {
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const userEntry = { name: `${userInitials} (You)`, passes: userPassCount, avg: userAvgScore, isUser: true };
  const allEntries = [
    ...LEADERBOARD_PEERS.map((p) => ({ ...p, isUser: false })),
    userEntry,
  ].sort((a, b) => b.passes - a.passes || b.avg - a.avg).slice(0, 6);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card className="border-border/60" data-testid="card-leaderboard">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Leaderboard</span>
        </div>
        <div className="space-y-2">
          {allEntries.map((entry, i) => (
            <div
              key={entry.name}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors
                ${entry.isUser
                  ? "bg-primary/10 border border-primary/20 font-semibold"
                  : "hover:bg-muted/40"}`}
              data-testid={entry.isUser ? "row-leaderboard-user" : `row-leaderboard-${i}`}
            >
              <span className="w-5 text-center text-base shrink-0">
                {medals[i] ?? <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
              </span>
              <span className={`flex-1 truncate text-xs ${entry.isUser ? "text-primary" : ""}`}>
                {entry.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.min(entry.passes, totalModules)}/{totalModules}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function XpHeroPanel({ progress, totalModules, role, userName, onViewCertificate }: {
  progress: BestAttempt[];
  totalModules: number;
  role: UserRole;
  userName: string;
  onViewCertificate: () => void;
}) {
  const { xp, level, xpInLevel, levelName } = computeXP(progress);
  const streak = computeStreak(progress);
  const passed = progress.filter((a) => a.passed).length;
  const attempted = progress.length;
  const avgScore = passed
    ? Math.round(progress.filter((a) => a.passed).reduce((s, a) => s + getPercent(a.score, a.totalQuestions), 0) / passed)
    : 0;
  const isCertified = passed === totalModules && totalModules > 0;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  return (
    <div className={`relative overflow-hidden rounded-2xl text-white
      ${isCertified
        ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500"
        : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"}`}
    >
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
      <div className="relative p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold">{isCertified ? "🎓" : "⚡"} {userName}</span>
                <Badge className={`text-xs font-bold border-white/30 ${isCertified ? "bg-white/30 text-white" : "bg-white/10 text-white/90"}`}>
                  {ROLE_LABELS[role]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-sm font-semibold ${isCertified ? "text-white/90" : "text-indigo-300"}`}>
                  Level {level} — {levelName}
                </span>
                <span className="text-white/40 text-xs">· {xp} XP total</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">XP Progress</span>
                <span className="text-white/80 font-medium">{xpInLevel} / {XP_PER_LEVEL} XP to Level {level + 1}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isCertified ? "bg-white" : "bg-gradient-to-r from-blue-400 to-indigo-400"}`}
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold">{streak}</span>
                <span className="text-xs text-white/60">day streak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">{passed}/{totalModules}</span>
                <span className="text-xs text-white/60">passed</span>
              </div>
              {attempted > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold">{avgScore}%</span>
                  <span className="text-xs text-white/60">avg score</span>
                </div>
              )}
            </div>

            {isCertified && (
              <button
                onClick={onViewCertificate}
                className="flex items-center gap-1.5 text-sm font-bold underline underline-offset-2 text-white/90 hover:text-white"
                data-testid="button-view-certificate"
              >
                <Award className="w-4 h-4" /> View My Certificate
              </button>
            )}
          </div>

          <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-end">
            <div className="text-center bg-white/10 rounded-2xl px-5 py-3">
              <div className="text-4xl font-black">{passed}</div>
              <div className="text-xs text-white/60 mt-0.5">of {totalModules} passed</div>
            </div>
            {isCertified && (
              <div className="text-center">
                <Trophy className="w-10 h-10 text-white mx-auto" />
                <div className="text-xs font-bold mt-1 text-white/80">Certified!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question, onAnswer, showExplanation, lastCorrect, questionNumber, total,
}: {
  question: TrainingQuestion;
  onAnswer: (answer: boolean) => void;
  showExplanation: boolean;
  lastCorrect: boolean | null;
  questionNumber: number;
  total: number;
}) {
  const pct = Math.round(((questionNumber - 1) / total) * 100);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {questionNumber} of {total}</span>
        <span className="font-semibold text-primary">{pct}% complete</span>
      </div>
      <div className="space-y-1">
        <Progress value={pct} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-violet-500" />
      </div>

      <Card className="border-2 border-border/60 shadow-sm" data-testid="card-question">
        <CardContent className="p-6">
          <p className="text-lg font-medium leading-relaxed text-center min-h-[72px] flex items-center justify-center" data-testid="text-question">
            {question.question}
          </p>
        </CardContent>
      </Card>

      {!showExplanation ? (
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-16 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 dark:shadow-none"
            onClick={() => onAnswer(true)}
            data-testid="button-answer-true"
          >
            <Check className="w-5 h-5 mr-2" /> True
          </Button>
          <Button
            size="lg"
            className="h-16 text-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-md shadow-red-200 dark:shadow-none"
            onClick={() => onAnswer(false)}
            data-testid="button-answer-false"
          >
            <X className="w-5 h-5 mr-2" /> False
          </Button>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 p-4 space-y-2 transition-all ${
            lastCorrect
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-red-400 bg-red-50 dark:bg-red-950/30"
          }`}
          data-testid="card-explanation"
        >
          <div className="flex items-center gap-2 font-bold text-base">
            {lastCorrect ? (
              <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400">Correct! +3 XP</span></>
            ) : (
              <><XCircle className="w-5 h-5 text-red-600" /><span className="text-red-700 dark:text-red-400">Incorrect — study the explanation</span></>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ module, answers, onRetry, onHome }: {
  module: TrainingModule;
  answers: AnswerRecord[];
  onRetry: () => void;
  onHome: () => void;
}) {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const pct = getPercent(score, total);
  const passed = pct >= module.passPercent;
  const xpEarned = passed ? XP_PER_PASS : XP_PER_ATTEMPT;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-2xl p-8 text-center space-y-4 text-white ${
        passed
          ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600"
          : "bg-gradient-to-br from-slate-700 to-slate-800"
      }`}>
        <div className="flex justify-center">
          {passed ? <Trophy className="w-16 h-16 drop-shadow-lg" /> : <AlertCircle className="w-16 h-16 opacity-80" />}
        </div>
        <div>
          <h2 className="text-4xl font-black">{pct}%</h2>
          <p className="text-lg font-bold opacity-90 mt-1">
            {passed ? "Module Passed! 🎉" : "Not quite — give it another go"}
          </p>
          <p className="text-sm opacity-70 mt-1">{score} correct out of {total} questions</p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-300" /> +{xpEarned} XP earned
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
            Pass threshold: {module.passPercent}%
          </div>
        </div>
      </div>

      <Card className="border border-border/60" data-testid="card-result-summary">
        <CardContent className="p-5 space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Answer Review
          </p>
          {answers.map((a, i) => {
            const q = module.questions[i];
            return (
              <div
                key={a.questionId}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  a.correct
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}
                data-testid={`row-answer-${i}`}
              >
                <div className="mt-0.5 shrink-0">
                  {a.correct
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : <XCircle className="w-4 h-4 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onRetry} data-testid="button-retry">
          <RotateCcw className="w-4 h-4 mr-2" /> Try Again
        </Button>
        <Button className="flex-1" onClick={onHome} data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" /> All Modules
        </Button>
      </div>
    </div>
  );
}

function CertificateView({ userName, issuedDate, modules, roleLabel }: {
  userName: string;
  issuedDate: string;
  modules: TrainingModule[];
  roleLabel: string;
}) {
  return (
    <div id="training-certificate" className="bg-white text-gray-900 rounded-xl overflow-hidden" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div className="h-3" style={{ background: "linear-gradient(90deg, #1a5276, #1e8449, #b7950b)" }} />
      <div className="px-10 py-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a5276, #154360)" }}>
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base text-gray-900 leading-tight" style={{ fontFamily: "system-ui, sans-serif" }}>Africa Credit Hub</div>
              <div className="text-xs text-gray-500" style={{ fontFamily: "system-ui, sans-serif" }}>Pan-African Credit Registry System</div>
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>Certificate of Completion</div>
          <div className="w-16 h-px mx-auto" style={{ background: "#b7950b" }} />
        </div>
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>This is to certify that</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{userName}</p>
          <p className="text-sm text-gray-500" style={{ fontFamily: "system-ui, sans-serif" }}>
            has successfully completed all required training modules for the <strong className="text-gray-700">{roleLabel}</strong> role and passed all assessments of the
          </p>
          <p className="text-lg font-semibold text-gray-800 mt-1">Africa Credit Hub Operator Certification Programme</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6 py-4 border-y border-gray-100">
          {modules.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-xs text-gray-600" style={{ fontFamily: "system-ui, sans-serif" }}>
              <span className="text-emerald-600 font-bold">✓</span> {m.title}
            </div>
          ))}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>Issue Date</div>
            <div className="text-sm font-semibold text-gray-700">{issuedDate}</div>
          </div>
          <div className="text-center">
            <div className="w-20 h-px bg-gray-400 mb-1" />
            <div className="text-xs text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>Authorised Signature</div>
            <div className="text-xs text-gray-600 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>Africa Credit Hub</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>Certification Level</div>
            <div className="text-sm font-semibold text-gray-700">{roleLabel}</div>
          </div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, #1a5276, #1e8449, #b7950b)" }} />
    </div>
  );
}

function CertificateModal({ open, onClose, userName, issuedDate, modules, roleLabel }: {
  open: boolean;
  onClose: () => void;
  userName: string;
  issuedDate: string;
  modules: TrainingModule[];
  roleLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" data-testid="modal-certificate">
        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <Award className="w-7 h-7" />
            <h2 className="text-xl font-bold">Congratulations, {userName}!</h2>
          </div>
          <p className="text-sm text-white/80">You have passed all {roleLabel} training modules and earned your certification.</p>
        </div>
        <div className="p-6 space-y-4">
          <CertificateView userName={userName} issuedDate={issuedDate} modules={modules} roleLabel={roleLabel} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()} data-testid="button-print-certificate">
              <Printer className="w-4 h-4" /> Print Certificate
            </Button>
            <Button className="flex-1 gap-2" onClick={onClose} data-testid="button-go-to-dashboard">
              Go to Dashboard <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainingCenter() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const role = (user?.role as UserRole) ?? "viewer";
  const TRAINING_MODULES = useMemo(() => getModulesForRole(i18n.language, role), [i18n.language, role]);

  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<AnswerRecord[]>([]);
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const justCertifiedRef = useRef(false);

  const { data: progressData = [], isLoading } = useQuery<BestAttempt[]>({
    queryKey: ["/api/training/progress"],
  });

  const submitAttempt = useMutation({
    mutationFn: (body: { moduleId: string; score: number; totalQuestions: number; passed: boolean; answers: AnswerRecord[] }) =>
      apiRequest("POST", "/api/training/attempts", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] }),
  });

  const totalModules = TRAINING_MODULES.length;
  const passedCount = progressData.filter((a) => a.passed).length;
  const isCertified = passedCount === totalModules && totalModules > 0;
  const userName = user?.fullName || user?.username || "Analyst";
  const issuedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const achievements = useMemo(() => computeAchievements(progressData, totalModules), [progressData, totalModules]);

  const dailyChallengeModule = useMemo(() => {
    return TRAINING_MODULES.find((m) => !progressData.find((p) => p.moduleId === m.id && p.passed))
      ?? TRAINING_MODULES[0];
  }, [TRAINING_MODULES, progressData]);

  const avgScore = passedCount > 0
    ? Math.round(progressData.filter((a) => a.passed).reduce((s, a) => s + getPercent(a.score, a.totalQuestions), 0) / passedCount)
    : 0;

  function startModule(module: TrainingModule) {
    setActiveModule(module);
    setQuiz({ module, currentIndex: 0, answers: [], showExplanation: false, lastAnswerCorrect: null });
    setScreen("quiz");
  }

  function handleAnswer(userAnswer: boolean) {
    if (!quiz || quiz.showExplanation) return;
    const question = quiz.module.questions[quiz.currentIndex];
    const correct = userAnswer === question.correct;
    setQuiz((prev) => prev ? { ...prev, answers: [...prev.answers, { questionId: question.id, userAnswer, correct }], showExplanation: true, lastAnswerCorrect: correct } : prev);
  }

  function handleNext() {
    if (!quiz) return;
    const nextIndex = quiz.currentIndex + 1;
    if (nextIndex >= quiz.module.questions.length) {
      const allAnswers = quiz.answers;
      const score = allAnswers.filter((a) => a.correct).length;
      const total = allAnswers.length;
      const passed = getPercent(score, total) >= quiz.module.passPercent;
      setFinalAnswers(allAnswers);
      setActiveModule(quiz.module);
      setScreen("result");
      if (passed) {
        const prevPassed = progressData.filter((a) => a.passed && a.moduleId !== quiz.module.id).length;
        if (prevPassed + 1 === totalModules) justCertifiedRef.current = true;
      }
      submitAttempt.mutate({ moduleId: quiz.module.id, score, totalQuestions: total, passed, answers: allAnswers });
    } else {
      setQuiz((prev) => prev ? { ...prev, currentIndex: nextIndex, showExplanation: false, lastAnswerCorrect: null } : prev);
    }
  }

  useEffect(() => {
    if (justCertifiedRef.current && isCertified) {
      justCertifiedRef.current = false;
      setScreen("home");
      setShowCertModal(true);
    }
  }, [isCertified]);

  function getBestAttempt(moduleId: string) {
    return progressData.find((a) => a.moduleId === moduleId);
  }

  if (screen === "result" && activeModule) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" onClick={() => setScreen("home")} data-testid="button-back-to-home">
          <ArrowLeft className="w-4 h-4" /> Training Center
        </button>
        <ResultScreen module={activeModule} answers={finalAnswers} onRetry={() => startModule(activeModule)} onHome={() => setScreen("home")} />
      </div>
    );
  }

  if (screen === "quiz" && quiz) {
    const currentQ = quiz.module.questions[quiz.currentIndex];
    const isLast = quiz.currentIndex === quiz.module.questions.length - 1;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setScreen("home")} data-testid="button-exit-quiz">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${quiz.module.color} text-white`}>
              <ModuleIcon name={quiz.module.icon} className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm truncate max-w-[180px]">{quiz.module.title}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-primary">
            <Zap className="w-4 h-4 text-yellow-500" />
            {quiz.answers.filter((a) => a.correct).length} correct
          </div>
        </div>
        <QuestionCard question={currentQ} onAnswer={handleAnswer} showExplanation={quiz.showExplanation} lastCorrect={quiz.lastAnswerCorrect} questionNumber={quiz.currentIndex + 1} total={quiz.module.questions.length} />
        {quiz.showExplanation && (
          <Button className="w-full mt-6 h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" onClick={handleNext} data-testid="button-next-question">
            {isLast ? <><Trophy className="w-4 h-4 mr-2" /> See Results</> : <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <CertificateModal open={showCertModal} onClose={() => { setShowCertModal(false); navigate("/dashboard"); }} userName={userName} issuedDate={issuedDate} modules={TRAINING_MODULES} roleLabel={ROLE_LABELS[role]} />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <GraduationCap className="w-6 h-6 text-primary" /> Training Center
          </h1>
          <Badge variant="outline" className="text-xs font-semibold" data-testid="badge-user-role">
            {ROLE_LABELS[role]}
          </Badge>
        </div>

        {!isLoading && (
          <XpHeroPanel
            progress={progressData}
            totalModules={totalModules}
            role={role}
            userName={userName}
            onViewCertificate={() => setShowCertModal(true)}
          />
        )}

        {!isLoading && dailyChallengeModule && !isCertified && (
          <DailyChallengeBanner module={dailyChallengeModule} onStart={() => startModule(dailyChallengeModule)} />
        )}

        {!isLoading && <AchievementBadges achievements={achievements} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-start">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Training Modules — {passedCount}/{totalModules} passed
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRAINING_MODULES.map((module) => (
                  <ModuleCard key={module.id} module={module} attempt={getBestAttempt(module.id)} onStart={() => startModule(module)} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            {!isLoading && (
              <MiniLeaderboard userPassCount={passedCount} userAvgScore={avgScore} totalModules={totalModules} userName={userName} />
            )}

            <Card className="border-dashed border-border/60 bg-muted/20" data-testid="card-tips">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Study Tips
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex gap-1.5"><span className="text-primary font-bold shrink-0">→</span> True/False format — read carefully</li>
                  <li className="flex gap-1.5"><span className="text-primary font-bold shrink-0">→</span> Explanations appear after each answer</li>
                  <li className="flex gap-1.5"><span className="text-primary font-bold shrink-0">→</span> Need {OVERALL_PASS_PERCENT}%+ to pass (6/8 correct)</li>
                  <li className="flex gap-1.5"><span className="text-primary font-bold shrink-0">→</span> Retry any module — best score counts</li>
                  <li className="flex gap-1.5"><span className="text-primary font-bold shrink-0">→</span> Pass all modules to earn your certificate</li>
                </ul>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/50 p-4 text-center space-y-1">
              <Zap className="w-5 h-5 text-indigo-500 mx-auto" />
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Each pass = +{XP_PER_PASS} XP</p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Level up every {XP_PER_LEVEL} XP</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
