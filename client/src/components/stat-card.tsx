import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon, ChevronRight } from "lucide-react";
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

const iconStyles = [
  { bg: "linear-gradient(135deg, hsl(172 62% 30%) 0%, hsl(172 50% 22%) 100%)", glow: "hsl(172 62% 26% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(42 85% 55%) 0%, hsl(32 78% 46%) 100%)", glow: "hsl(42 85% 53% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(12 76% 52%) 0%, hsl(2 70% 44%) 100%)", glow: "hsl(12 76% 48% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(152 60% 42%) 0%, hsl(162 55% 34%) 100%)", glow: "hsl(152 60% 38% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(215 65% 50%) 0%, hsl(225 60% 42%) 100%)", glow: "hsl(215 65% 48% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(280 55% 52%) 0%, hsl(270 50% 44%) 100%)", glow: "hsl(280 55% 50% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(350 65% 52%) 0%, hsl(340 60% 44%) 100%)", glow: "hsl(350 65% 50% / 0.25)" },
  { bg: "linear-gradient(135deg, hsl(172 45% 38%) 0%, hsl(182 40% 30%) 100%)", glow: "hsl(172 45% 35% / 0.25)" },
];

const cardGradients = [
  { light: "linear-gradient(135deg, hsl(172 62% 26% / 0.06) 0%, hsl(172 50% 22% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(172 62% 26% / 0.10) 0%, hsl(172 50% 22% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(42 85% 53% / 0.06) 0%, hsl(32 78% 46% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(42 85% 53% / 0.10) 0%, hsl(32 78% 46% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(12 76% 48% / 0.06) 0%, hsl(2 70% 44% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(12 76% 48% / 0.10) 0%, hsl(2 70% 44% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(152 60% 38% / 0.06) 0%, hsl(162 55% 34% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(152 60% 38% / 0.10) 0%, hsl(162 55% 34% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(215 65% 48% / 0.06) 0%, hsl(225 60% 42% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(215 65% 48% / 0.10) 0%, hsl(225 60% 42% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(280 55% 50% / 0.06) 0%, hsl(270 50% 44% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(280 55% 50% / 0.10) 0%, hsl(270 50% 44% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(350 65% 50% / 0.06) 0%, hsl(340 60% 44% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(350 65% 50% / 0.10) 0%, hsl(340 60% 44% / 0.025) 100%)" },
  { light: "linear-gradient(135deg, hsl(172 45% 35% / 0.06) 0%, hsl(182 40% 30% / 0.015) 100%)", dark: "linear-gradient(135deg, hsl(172 45% 35% / 0.10) 0%, hsl(182 40% 30% / 0.025) 100%)" },
];

function valueFontSize(val: string | number): string {
  const len = String(val).length;
  if (len > 14) return "text-base";
  if (len > 10) return "text-lg";
  return "text-2xl";
}

const sparklineColors = [
  { stroke: "hsl(172 62% 30%)", gradientStart: "hsl(172 62% 30% / 0.4)", gradientEnd: "hsl(172 62% 30% / 0.02)" },
  { stroke: "hsl(42 85% 53%)", gradientStart: "hsl(42 85% 53% / 0.4)", gradientEnd: "hsl(42 85% 53% / 0.02)" },
  { stroke: "hsl(12 76% 48%)", gradientStart: "hsl(12 76% 48% / 0.4)", gradientEnd: "hsl(12 76% 48% / 0.02)" },
  { stroke: "hsl(152 60% 38%)", gradientStart: "hsl(152 60% 38% / 0.4)", gradientEnd: "hsl(152 60% 38% / 0.02)" },
  { stroke: "hsl(215 65% 48%)", gradientStart: "hsl(215 65% 48% / 0.4)", gradientEnd: "hsl(215 65% 48% / 0.02)" },
  { stroke: "hsl(280 55% 50%)", gradientStart: "hsl(280 55% 50% / 0.4)", gradientEnd: "hsl(280 55% 50% / 0.02)" },
  { stroke: "hsl(350 65% 50%)", gradientStart: "hsl(350 65% 50% / 0.4)", gradientEnd: "hsl(350 65% 50% / 0.02)" },
  { stroke: "hsl(172 45% 35%)", gradientStart: "hsl(172 45% 35% / 0.4)", gradientEnd: "hsl(172 45% 35% / 0.02)" },
];

export function StatCard({ title, value, subtitle, icon: Icon, testId, colorIndex = 0, onClick, sparklineData }: StatCardProps) {
  const style = iconStyles[colorIndex % iconStyles.length];
  const sparkColor = sparklineColors[colorIndex % sparklineColors.length];
  const cardGradient = cardGradients[colorIndex % cardGradients.length];
  const chartData = sparklineData?.map((v, i) => ({ v, i }));
  const gradientId = `sparkGrad-${colorIndex}`;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <Card
      data-testid={testId}
      className={`group card-shine premium-glow transition-all duration-400 border border-border/30 hover:border-border/50 hover:shadow-xl hover:-translate-y-1.5 ${onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" : ""}`}
      style={{
        background: isDark ? cardGradient.dark : cardGradient.light,
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{title}</p>
            <p className={`${valueFontSize(value)} font-extrabold mt-2.5 tracking-tight leading-tight break-words`} data-testid={`${testId}-value`}>{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-medium">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl group-hover:scale-110 transition-all duration-400"
              style={{
                background: style.bg,
                boxShadow: `0 4px 14px -2px ${style.glow}`,
              }}
            >
              <Icon className="w-5.5 h-5.5 text-white drop-shadow-sm" />
            </div>
            {onClick && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            )}
          </div>
        </div>
        {chartData && chartData.length > 0 && (
          <div className="mt-3.5 -mx-1" data-testid={`${testId}-sparkline`}>
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor.gradientStart} />
                    <stop offset="100%" stopColor={sparkColor.gradientEnd} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor.stroke}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
