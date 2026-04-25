import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

const STEPS = [
  { id: "institution", label: "Register your institution", url: "/institutions", role: ["admin","super_admin"] },
  { id: "user", label: "Invite a team member", url: "/users", role: ["admin","super_admin"] },
  { id: "borrower", label: "Register your first borrower", url: "/borrowers", role: ["admin","super_admin","lender"] },
  { id: "credit_account", label: "Add a credit account", url: "/credit-accounts", role: ["admin","super_admin","lender"] },
  { id: "report", label: "Generate a credit report", url: "/reports", role: ["admin","super_admin","lender","regulator"] },
];

const STORAGE_KEY = "cdh_onboarding_dismissed";

export function OnboardingChecklist() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("cdh_onboarding_steps") || "[]"); }
    catch { return []; }
  });

  if (dismissed || !user) return null;
  const role = (user as any).role || "lender";
  const steps = STEPS.filter(s => s.role.includes(role));
  const pct = Math.round((completed.length / steps.length) * 100);
  if (pct === 100) return null;

  function markDone(id: string, url: string) {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    localStorage.setItem("cdh_onboarding_steps", JSON.stringify(next));
    navigate(url);
  }

  return (
    <Card className="border-primary/30 bg-primary/5 mb-4" data-testid="card-onboarding">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Getting Started</span>
            <span className="text-xs text-muted-foreground">{pct}% complete</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
              aria-label={collapsed ? "Expand onboarding checklist" : "Collapse onboarding checklist"}
              onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
              aria-label="Dismiss onboarding checklist"
              data-testid="button-dismiss-onboarding"
              onClick={() => { setDismissed(true); localStorage.setItem(STORAGE_KEY, "1"); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Progress value={pct} className="h-1.5 mt-1" />
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {steps.map(step => {
              const done = completed.includes(step.id);
              return (
                <button key={step.id}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors text-sm
                    ${done ? "opacity-50" : "hover:bg-primary/10"}`}
                  onClick={() => !done && markDone(step.id, step.url)}
                  data-testid={`step-${step.id}`}>
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <Circle className="h-4 w-4 text-primary/60 shrink-0" />
                  }
                  <span className={done ? "line-through text-muted-foreground" : ""}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
