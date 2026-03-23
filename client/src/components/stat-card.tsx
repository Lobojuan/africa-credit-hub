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
      className={`group relative overflow-hidden transition-all duration-500 border border-border/40 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 ${onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" : ""}`}
      style={{
        background: isDark ? cardGradient.dark : cardGradient.light,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="p-5 pb-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">{title}</p>
            <p className={`${valueFontSize(value)} font-black mt-2 tracking-tight leading-tight text-foreground drop-shadow-sm`} data-testid={`${testId}-value`}>{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0 relative">
            <div className="absolute inset-0 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-full" style={{ background: style.glow }} />

            <div
              className="relative flex items-center justify-center w-12 h-12 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 z-10"
              style={{
                background: style.bg,
                boxShadow: `0 4px 14px -2px ${style.glow}, inset 0 1px 1px rgba(255,255,255,0.2)`,
              }}
            >
              <Icon className="w-5 h-5 text-white drop-shadow-md" />
            </div>
            {onClick && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1.5 transition-all duration-300" />
            )}
          </div>
        </div>
        {chartData && chartData.length > 0 && (
          <div className="mt-4 -mx-2" data-testid={`${testId}-sparkline`}>
            <ResponsiveContainer width="100%" height={44}>
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
                  animationDuration={1500}
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
