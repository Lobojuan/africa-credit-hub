import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  testId?: string;
  colorIndex?: number;
  onClick?: () => void;
  sparklineData?: number[];
}

const ACCENT_COLORS = [
  { icon: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400", stroke: "#3b82f6" },
  { icon: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400", stroke: "#8b5cf6" },
  { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400", stroke: "#10b981" },
  { icon: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400", stroke: "#f59e0b" },
  { icon: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400", stroke: "#f43f5e" },
  { icon: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400", stroke: "#06b6d4" },
];

export function StatCard({ title, value, subtitle, icon: Icon, trend, testId, colorIndex = 0, onClick, sparklineData }: StatCardProps) {
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
  const sparkData = sparklineData?.map(v => ({ v }));
  const gradientId = `sparkGrad-${colorIndex}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div
      className="nordic-stat cursor-pointer group"
      data-testid={testId}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" :
            trend === "down" ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400" :
            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>

      <div className="space-y-0.5 mb-3">
        <p className="text-2xl font-semibold text-foreground tracking-tight" data-testid={testId ? `${testId}-value` : undefined}>{value}</p>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </div>

      {sparkData && sparkData.length > 0 && (
        <div className="h-10 -mx-1" data-testid={testId ? `${testId}-sparkline` : undefined}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color.stroke} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color.stroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color.stroke}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
