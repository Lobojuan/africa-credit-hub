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

function valueFontSize(val: string | number): string {
  const len = String(val).length;
  if (len > 14) return "text-base";
  if (len > 10) return "text-lg";
  return "text-2xl";
}

const sparklineColors = [
  { stroke: "hsl(175 55% 28%)", fill: "hsl(175 55% 28% / 0.15)" },
  { stroke: "hsl(43 80% 55%)", fill: "hsl(43 80% 55% / 0.15)" },
  { stroke: "hsl(14 70% 50%)", fill: "hsl(14 70% 50% / 0.15)" },
  { stroke: "hsl(142 55% 40%)", fill: "hsl(142 55% 40% / 0.15)" },
  { stroke: "hsl(200 60% 45%)", fill: "hsl(200 60% 45% / 0.15)" },
  { stroke: "hsl(280 50% 50%)", fill: "hsl(280 50% 50% / 0.15)" },
  { stroke: "hsl(350 60% 50%)", fill: "hsl(350 60% 50% / 0.15)" },
  { stroke: "hsl(175 40% 35%)", fill: "hsl(175 40% 35% / 0.15)" },
];

export function StatCard({ title, value, subtitle, icon: Icon, testId, colorIndex = 0, onClick, sparklineData }: StatCardProps) {
  const style = iconStyles[colorIndex % iconStyles.length];
  const sparkColor = sparklineColors[colorIndex % sparklineColors.length];
  const chartData = sparklineData?.map((v, i) => ({ v, i }));

  return (
    <Card
      data-testid={testId}
      className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-border/60 ${onClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" : ""}`}
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
              className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm"
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
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor.stroke}
                  fill={sparkColor.fill}
                  strokeWidth={1.5}
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
