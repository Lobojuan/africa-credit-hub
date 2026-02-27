import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  testId?: string;
  colorIndex?: number;
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

export function StatCard({ title, value, subtitle, icon: Icon, testId, colorIndex = 0 }: StatCardProps) {
  const style = iconStyles[colorIndex % iconStyles.length];

  return (
    <Card data-testid={testId} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-extrabold mt-1.5 truncate tracking-tight" data-testid={`${testId}-value`}>{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm"
            style={{ background: style.bg }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
