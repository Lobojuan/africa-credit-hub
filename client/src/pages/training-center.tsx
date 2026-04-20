import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getModules, OVERALL_PASS_PERCENT, type TrainingModule, type TrainingQuestion } from "@/lib/training-content";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Monitor, Users, CreditCard, Shield, Brain, Settings,
  CheckCircle2, XCircle, Trophy, BookOpen, Clock, ChevronRight,
  RotateCcw, ArrowLeft, Star, GraduationCap, Target, Award,
  Check, X, AlertCircle,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Monitor, Users, CreditCard, Shield, Brain, Settings,
};

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

function getPercent(score: number, total: number) {
  return Math.round((score / total) * 100);
}

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? BookOpen;
  return <Icon className={className} />;
}

function ModuleCard({
  module,
  attempt,
  onStart,
}: {
  module: TrainingModule;
  attempt?: BestAttempt;
  onStart: () => void;
}) {
  const pct = attempt ? getPercent(attempt.score, attempt.totalQuestions) : null;
  const passed = attempt?.passed ?? false;
  const attempted = !!attempt;

  return (
    <Card
      className="relative overflow-hidden border border-border/60 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onStart}
      data-testid={`card-training-module-${module.id}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${module.color}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} text-white shrink-0`}>
            <ModuleIcon name={module.icon} className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {attempted ? (
              passed ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800">
                  <XCircle className="w-3 h-3 mr-1" /> Retry
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Not started</Badge>
            )}
            {pct !== null && (
              <span className="text-xs text-muted-foreground">Best: {pct}%</span>
            )}
          </div>
        </div>
        <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
          {module.title}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed line-clamp-2">
          {module.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {attempted && (
          <Progress value={pct ?? 0} className="h-1.5 mb-3" />
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {module.questions.length} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{module.estimatedMinutes} min
            </span>
          </div>
          <span className="flex items-center gap-1 font-medium text-primary">
            {attempted ? "Retry" : "Start"} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionCard({
  question,
  onAnswer,
  showExplanation,
  lastCorrect,
  questionNumber,
  total,
}: {
  question: TrainingQuestion;
  onAnswer: (answer: boolean) => void;
  showExplanation: boolean;
  lastCorrect: boolean | null;
  questionNumber: number;
  total: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {questionNumber} of {total}</span>
        <span>{Math.round(((questionNumber - 1) / total) * 100)}% complete</span>
      </div>
      <Progress value={((questionNumber - 1) / total) * 100} className="h-2" />

      <Card className="border-2 border-border/60" data-testid="card-question">
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
            className="h-16 text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={() => onAnswer(true)}
            data-testid="button-answer-true"
          >
            <Check className="w-5 h-5 mr-2" /> True
          </Button>
          <Button
            size="lg"
            className="h-16 text-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            onClick={() => onAnswer(false)}
            data-testid="button-answer-false"
          >
            <X className="w-5 h-5 mr-2" /> False
          </Button>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 p-4 space-y-2 ${
            lastCorrect
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-red-500 bg-red-50 dark:bg-red-950/30"
          }`}
          data-testid="card-explanation"
        >
          <div className="flex items-center gap-2 font-semibold">
            {lastCorrect ? (
              <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400">Correct!</span></>
            ) : (
              <><XCircle className="w-5 h-5 text-red-600" /><span className="text-red-700 dark:text-red-400">Incorrect</span></>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function ResultScreen({
  module,
  answers,
  onRetry,
  onHome,
}: {
  module: TrainingModule;
  answers: AnswerRecord[];
  onRetry: () => void;
  onHome: () => void;
}) {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const pct = getPercent(score, total);
  const passed = pct >= module.passPercent;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`rounded-2xl p-8 text-center space-y-4 ${
        passed
          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
          : "bg-gradient-to-br from-red-500 to-rose-600"
      } text-white`}>
        <div className="flex justify-center">
          {passed ? <Trophy className="w-16 h-16 opacity-90" /> : <AlertCircle className="w-16 h-16 opacity-90" />}
        </div>
        <div>
          <h2 className="text-3xl font-bold">{pct}%</h2>
          <p className="text-lg font-semibold opacity-90 mt-1">
            {passed ? "Well done — you passed!" : "Not quite — try again"}
          </p>
          <p className="text-sm opacity-75 mt-1">
            {score} correct out of {total} questions
          </p>
        </div>
        <div className="bg-white/20 rounded-xl px-4 py-2 inline-block text-sm">
          Pass threshold: {module.passPercent}%
        </div>
      </div>

      <Card className="border border-border/60" data-testid="card-result-summary">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" /> Answer Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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

function OverallProgress({ attempts }: { attempts: BestAttempt[] }) {
  const total = TRAINING_MODULES.length;
  const passed = attempts.filter((a) => a.passed).length;
  const attempted = attempts.length;
  const certified = passed === total;

  return (
    <div className={`rounded-2xl p-6 ${certified ? "bg-gradient-to-br from-amber-400 to-yellow-500" : "bg-gradient-to-br from-slate-700 to-slate-800"} text-white`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {certified ? <Award className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
            <span className="font-bold text-lg">
              {certified ? "Fully Certified!" : "Training Progress"}
            </span>
          </div>
          <p className="text-sm opacity-80">
            {certified
              ? "You have passed all modules. Well done!"
              : `${passed} of ${total} modules passed · ${total - attempted} not yet started`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{passed}<span className="text-2xl opacity-70">/{total}</span></div>
          <div className="text-xs opacity-70 mt-0.5">modules passed</div>
        </div>
      </div>
      {!certified && (
        <div className="mt-4">
          <Progress value={(passed / total) * 100} className="h-2 bg-white/30 [&>div]:bg-white" />
        </div>
      )}
    </div>
  );
}

export default function TrainingCenter() {
  const { i18n } = useTranslation();
  const TRAINING_MODULES = useMemo(() => getModules(i18n.language), [i18n.language]);

  const [screen, setScreen] = useState<Screen>("home");
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<AnswerRecord[]>([]);
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);

  const { data: progressData = [], isLoading } = useQuery<BestAttempt[]>({
    queryKey: ["/api/training/progress"],
  });

  const submitAttempt = useMutation({
    mutationFn: (body: {
      moduleId: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      answers: AnswerRecord[];
    }) => apiRequest("POST", "/api/training/attempts", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] });
    },
  });

  function startModule(module: TrainingModule) {
    setActiveModule(module);
    setQuiz({
      module,
      currentIndex: 0,
      answers: [],
      showExplanation: false,
      lastAnswerCorrect: null,
    });
    setScreen("quiz");
  }

  function handleAnswer(userAnswer: boolean) {
    if (!quiz || quiz.showExplanation) return;
    const question = quiz.module.questions[quiz.currentIndex];
    const correct = userAnswer === question.correct;
    const record: AnswerRecord = { questionId: question.id, userAnswer, correct };

    setQuiz((prev) => prev ? {
      ...prev,
      answers: [...prev.answers, record],
      showExplanation: true,
      lastAnswerCorrect: correct,
    } : prev);
  }

  function handleNext() {
    if (!quiz) return;
    const nextIndex = quiz.currentIndex + 1;

    if (nextIndex >= quiz.module.questions.length) {
      const allAnswers = quiz.answers;
      const score = allAnswers.filter((a) => a.correct).length;
      const total = allAnswers.length;
      const pct = getPercent(score, total);
      const passed = pct >= quiz.module.passPercent;

      setFinalAnswers(allAnswers);
      setActiveModule(quiz.module);
      setScreen("result");

      submitAttempt.mutate({
        moduleId: quiz.module.id,
        score,
        totalQuestions: total,
        passed,
        answers: allAnswers,
      });
    } else {
      setQuiz((prev) => prev ? {
        ...prev,
        currentIndex: nextIndex,
        showExplanation: false,
        lastAnswerCorrect: null,
      } : prev);
    }
  }

  function getBestAttempt(moduleId: string): BestAttempt | undefined {
    return progressData.find((a) => a.moduleId === moduleId);
  }

  if (screen === "result" && activeModule) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          onClick={() => setScreen("home")}
          data-testid="button-back-to-home"
        >
          <ArrowLeft className="w-4 h-4" /> Training Center
        </button>
        <ResultScreen
          module={activeModule}
          answers={finalAnswers}
          onRetry={() => startModule(activeModule)}
          onHome={() => setScreen("home")}
        />
      </div>
    );
  }

  if (screen === "quiz" && quiz) {
    const currentQ = quiz.module.questions[quiz.currentIndex];
    const isLast = quiz.currentIndex === quiz.module.questions.length - 1;

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setScreen("home")}
            data-testid="button-exit-quiz"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${quiz.module.color} text-white`}>
              <ModuleIcon name={quiz.module.icon} className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm truncate max-w-[180px]">{quiz.module.title}</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground w-20 text-right">
            {quiz.answers.filter((a) => a.correct).length} correct
          </div>
        </div>

        <QuestionCard
          question={currentQ}
          onAnswer={handleAnswer}
          showExplanation={quiz.showExplanation}
          lastCorrect={quiz.lastAnswerCorrect}
          questionNumber={quiz.currentIndex + 1}
          total={quiz.module.questions.length}
        />

        {quiz.showExplanation && (
          <Button
            className="w-full mt-6 h-12 text-base"
            onClick={handleNext}
            data-testid="button-next-question"
          >
            {isLast ? (
              <><Trophy className="w-4 h-4 mr-2" /> See Results</>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <GraduationCap className="w-7 h-7 text-primary" />
            Training Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete all six modules to earn your Africa Credit Hub certification. Pass each quiz with {OVERALL_PASS_PERCENT}% or higher.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">
            {progressData.filter((a) => a.passed).length}/{TRAINING_MODULES.length} passed
          </span>
        </div>
      </div>

      {!isLoading && (
        <OverallProgress attempts={progressData} />
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Training Modules
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRAINING_MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                attempt={getBestAttempt(module.id)}
                onStart={() => startModule(module)}
              />
            ))}
          </div>
        )}
      </div>

      <Card className="border border-dashed border-border/60 bg-muted/30" data-testid="card-tips">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Study tips</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Questions are True/False — read each statement carefully before answering</li>
                <li>• After each answer you will see an explanation — use these to learn from mistakes</li>
                <li>• You need {OVERALL_PASS_PERCENT}% or higher in each module to pass (6 of 8 correct)</li>
                <li>• You can retry any module as many times as you like — only your best score is recorded</li>
                <li>• Use the Score Guide and Online Manual pages as study references before each quiz</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
