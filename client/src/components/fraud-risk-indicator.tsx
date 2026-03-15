import { ShieldAlert, ShieldCheck, ShieldX, Shield, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface FraudAlert {
  type: string;
  severity: string;
  title: string;
  description: string;
  score: number;
}

interface FraudCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface FraudRiskData {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  alerts: FraudAlert[];
  checks: FraudCheck[];
}

function getRiskConfig(level: string) {
  switch (level) {
    case "critical": return { icon: ShieldX, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", barColor: "bg-red-500", label: "Critical Risk" };
    case "high": return { icon: ShieldAlert, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", barColor: "bg-orange-500", label: "High Risk" };
    case "medium": return { icon: Shield, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", barColor: "bg-yellow-500", label: "Medium Risk" };
    default: return { icon: ShieldCheck, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", barColor: "bg-green-500", label: "Low Risk" };
  }
}

export function FraudRiskIndicator({ data }: { data: FraudRiskData }) {
  const [expanded, setExpanded] = useState(false);
  const config = getRiskConfig(data.riskLevel);
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden`} data-testid="fraud-risk-indicator">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
        data-testid="button-toggle-fraud-details"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" data-testid="text-fraud-risk-label">{config.label}</span>
              <Badge variant="outline" className="text-[10px]" data-testid="badge-fraud-score">
                Score: {data.riskScore}/100
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.alerts.length} alert{data.alerts.length !== 1 ? "s" : ""} · {data.checks.filter(c => c.status === "pass").length}/{data.checks.length} checks passed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${config.barColor} rounded-full transition-all`} style={{ width: `${data.riskScore}%` }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
          {data.alerts.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Alerts</p>
              {data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-background/60 border border-border/50" data-testid={`fraud-alert-${i}`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                  <div>
                    <p className="text-xs font-semibold">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px]">{alert.type}</Badge>
                      <Badge variant="outline" className="text-[9px]">{alert.severity}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verification Checks</p>
            {data.checks.map((check, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs" data-testid={`fraud-check-${i}`}>
                {check.status === "pass" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                {check.status === "warn" && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                {check.status === "fail" && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="font-medium">{check.name}</span>
                <span className="text-muted-foreground ml-auto text-[11px]">{check.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FraudRiskBadge({ riskLevel, riskScore }: { riskLevel: string; riskScore: number }) {
  const config = getRiskConfig(riskLevel);
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`} data-testid="badge-fraud-risk">
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      <span className="opacity-60">({riskScore})</span>
    </div>
  );
}
