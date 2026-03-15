import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ScoreFactor {
  name: string;
  impact: number;
  maxImpact: number;
  direction: "positive" | "negative" | "neutral";
  description: string;
  weight: number;
}

export function ScoreFactors({ factors, compact }: { factors: ScoreFactor[]; compact?: boolean }) {
  if (!factors || factors.length === 0) return null;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"} data-testid="score-factors">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Key Score Factors
      </p>
      {factors.map((factor, i) => {
        const isPositive = factor.direction === "positive";
        const isNegative = factor.direction === "negative";

        return (
          <div
            key={i}
            className={`flex items-center gap-3 ${compact ? "p-2" : "p-2.5"} rounded-lg border transition-colors ${
              isPositive ? "border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20" :
              isNegative ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20" :
              "border-border bg-muted/30"
            }`}
            data-testid={`score-factor-${i}`}
          >
            <div className={`p-1.5 rounded-md ${
              isPositive ? "bg-green-100 dark:bg-green-900/30" :
              isNegative ? "bg-red-100 dark:bg-red-900/30" :
              "bg-muted"
            }`}>
              {isPositive && <ArrowUpRight className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
              {isNegative && <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
              {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${compact ? "" : "text-sm"}`}>{factor.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    isPositive ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40" :
                    isNegative ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40" :
                    "text-muted-foreground bg-muted"
                  }`}>
                    {factor.impact > 0 ? "+" : ""}{factor.impact} pts
                  </span>
                  <span className="text-[9px] text-muted-foreground">{factor.weight}%</span>
                </div>
              </div>
              {!compact && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{factor.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
