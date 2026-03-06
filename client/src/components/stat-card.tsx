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
  { bg: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 70% 48%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(14 70% 50%) 0%, hsl(4 65% 45%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(142 55% 40%) 0%, hsl(152 50% 35%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(200 60% 45%) 0%, hsl(210 55% 38%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(280 50% 50%) 0%, hsl(270 45% 42%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(350 60% 50%) 0%, hsl(340 55% 42%) 100%)" },
  { bg: "linear-gradient(135deg, hsl(175 40% 35%) 0%, hsl(185 35% 28%) 100%)" },
];

const cardGradients = [
  { light: "linear-gradient(135deg, hsl(175 55% 28% / 0.04) 0%, hsl(175 45% 22% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(175 55% 28% / 0.08) 0%, hsl(175 45% 22% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(43 80% 55% / 0.04) 0%, hsl(33 70% 48% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(43 80% 55% / 0.08) 0%, hsl(33 70% 48% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(14 70% 50% / 0.04) 0%, hsl(4 65% 45% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(14 70% 50% / 0.08) 0%, hsl(4 65% 45% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(142 55% 40% / 0.04) 0%, hsl(152 50% 35% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(142 55% 40% / 0.08) 0%, hsl(152 50% 35% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(200 60% 45% / 0.04) 0%, hsl(210 55% 38% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(200 60% 45% / 0.08) 0%, hsl(210 55% 38% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(280 50% 50% / 0.04) 0%, hsl(270 45% 42% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(280 50% 50% / 0.08) 0%, hsl(270 45% 42% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(350 60% 50% / 0.04) 0%, hsl(340 55% 42% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(350 60% 50% / 0.08) 0%, hsl(340 55% 42% / 0.02) 100%)" },
  { light: "linear-gradient(135deg, hsl(175 40% 35% / 0.04) 0%, hsl(185 35% 28% / 0.01) 100%)", dark: "linear-gradient(135deg, hsl(175 40% 35% / 0.08) 0%, hsl(185 35% 28% / 0.02) 100%)" },
];

function valueFontSize(val: string | number): string {
  const len = String(val).length;
  if (len > 14) return "text-base";
  if (len > 10) return "text-lg";
  return "text-2xl";
}

const sparklineColors = [
  { stroke: "hsl(175 55% 28%)", gradientStart: "hsl(175 55% 28% / 0.35)", gradientEnd: "hsl(175 55% 28% / 0.02)" },
  { stroke: "hsl(43 80% 55%)", gradientStart: "hsl(43 80% 55% / 0.35)", gradientEnd: "hsl(43 80% 55% / 0.02)" },
  { stroke: "hsl(14 70% 50%)", gradientStart: "hsl(14 70% 50% / 0.35)", gradientEnd: "hsl(14 70% 50% / 0.02)" },
  { stroke: "hsl(142 55% 40%)", gradientStart: "hsl(142 55% 40% / 0.35)", gradientEnd: "hsl(142 55% 40% / 0.02)" },
  { stroke: "hsl(200 60% 45%)", gradientStart: "hsl(200 60% 45% / 0.35)", gradientEnd: "hsl(200 60% 45% / 0.02)" },
  { stroke: "hsl(280 50% 50%)", gradientStart: "hsl(280 50% 50% / 0.35)", gradientEnd: "hsl(280 50% 50% / 0.02)" },
  { stroke: "hsl(350 60% 50%)", gradientStart: "hsl(350 60% 50% / 0.35)", gradientEnd: "hsl(350 60% 50% / 0.02)" },
  { stroke: "hsl(175 40% 35%)", gradientStart: "hsl(175 40% 35% / 0.35)", gradientEnd: "hsl(175 40% 35% / 0.02)" },
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
      className={`group transition-all duration-300 border border-border/60 hover:shadow-lg hover:-translate-y-0.5 ${onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" : ""}`}
      style={{ background: isDark ? cardGradient.dark : cardGradient.light }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`${valueFontSize(value)} font-extrabold mt-1.5 tracking-tight leading-tight break-words`} data-testid={`${testId}-value`}>{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300"
              style={{ background: style.bg }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            {onClick && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            )}
          </div>
        </div>
        {chartData && chartData.length > 0 && (
          <div className="mt-3 -mx-1" data-testid={`${testId}-sparkline`}>
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
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
