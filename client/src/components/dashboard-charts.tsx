import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MonthlyTrend {
  month: string;
  borrowers: number;
  accounts: number;
  outstanding: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface TypeBreakdown {
  type: string;
  count: number;
}

interface DashboardChartsProps {
  monthlyTrend?: MonthlyTrend[];
  statusBreakdown?: StatusBreakdown[];
  typeBreakdown?: TypeBreakdown[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  current: "hsl(172, 62%, 26%)",
  delinquent: "hsl(42, 85%, 53%)",
  default: "hsl(0, 76%, 40%)",
  closed: "hsl(210, 12%, 44%)",
  restructured: "hsl(215, 65%, 48%)",
};

const PIE_COLORS = [
  "hsl(172, 62%, 26%)",
  "hsl(42, 85%, 53%)",
  "hsl(0, 76%, 40%)",
  "hsl(210, 12%, 44%)",
  "hsl(215, 65%, 48%)",
  "hsl(152, 60%, 38%)",
];

const BAR_COLORS = [
  "hsl(172, 62%, 26%)",
  "hsl(42, 85%, 53%)",
  "hsl(12, 76%, 48%)",
  "hsl(152, 60%, 38%)",
  "hsl(215, 65%, 48%)",
  "hsl(280, 55%, 50%)",
  "hsl(350, 65%, 50%)",
  "hsl(172, 45%, 35%)",
];

const FALLBACK_TREND: MonthlyTrend[] = (() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data: MonthlyTrend[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({ month: months[d.getMonth()], borrowers: 0, accounts: 0, outstanding: 0 });
  }
  return data;
})();

const FALLBACK_STATUS: StatusBreakdown[] = [];

const FALLBACK_TYPES: TypeBreakdown[] = [];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg p-3.5 shadow-xl text-sm">
      <p className="font-bold mb-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2.5 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize text-xs">{entry.name}:</span>
          <span className="font-bold text-xs">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg p-3.5 shadow-xl text-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: item.payload.fill }} />
        <span className="font-bold capitalize">{item.name}</span>
      </div>
      <p className="mt-1.5 text-muted-foreground text-xs">
        {item.value.toLocaleString()} accounts ({((item.value / item.payload.total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function DashboardCharts({ monthlyTrend, statusBreakdown, typeBreakdown, isLoading }: DashboardChartsProps) {
  const trendData = monthlyTrend && monthlyTrend.length > 0 ? monthlyTrend : FALLBACK_TREND;
  const statusData = statusBreakdown && statusBreakdown.length > 0 ? statusBreakdown : FALLBACK_STATUS;
  const typeData = typeBreakdown && typeBreakdown.length > 0 ? typeBreakdown : FALLBACK_TYPES;

  const statusTotal = useMemo(() => statusData.reduce((sum, d) => sum + d.count, 0), [statusData]);

  const statusWithTotal = useMemo(
    () => statusData.map(d => ({ ...d, total: statusTotal })),
    [statusData, statusTotal]
  );

  const sortedTypes = useMemo(
    () => [...typeData].sort((a, b) => b.count - a.count),
    [typeData]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="charts-loading">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border border-border/60">
            <CardContent className="p-5">
              <div className="h-[280px] bg-muted/30 rounded-md animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="dashboard-charts">
      <Card className="lg:col-span-2 border border-border/30 card-shine premium-glow" data-testid="chart-portfolio-trend">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-bold">Portfolio Growth</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">12-month borrower and account trends</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="min-w-0 min-h-0 w-full">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBorrowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(172, 62%, 26%)" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="hsl(172, 62%, 26%)" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="hsl(172, 62%, 26%)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradAccounts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(42, 85%, 53%)" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="hsl(42, 85%, 53%)" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="hsl(42, 85%, 53%)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 44%, 0.12)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(210, 12%, 44%, 0.4)" />
              <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(210, 12%, 44%, 0.4)" tickFormatter={formatCompact} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="borrowers"
                name="Borrowers"
                stroke="hsl(172, 62%, 26%)"
                strokeWidth={2.5}
                fill="url(#gradBorrowers)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, fill: "hsl(172, 62%, 26%)" }}
              />
              <Area
                type="monotone"
                dataKey="accounts"
                name="Accounts"
                stroke="hsl(42, 85%, 53%)"
                strokeWidth={2.5}
                fill="url(#gradAccounts)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, fill: "hsl(42, 85%, 53%)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/30 card-shine premium-glow" data-testid="chart-account-status">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-bold">Account Status</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{statusTotal.toLocaleString()} total accounts</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="min-w-0 min-h-0 w-full">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusWithTotal}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="status"
                labelLine={false}
                label={renderPieLabel}
              >
                {statusWithTotal.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs capitalize text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border border-border/30 card-shine premium-glow" data-testid="chart-account-types">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-bold">Loan Types Distribution</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Breakdown by account type</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="min-w-0 min-h-0 w-full">
          <ResponsiveContainer width="100%" height={Math.max(200, sortedTypes.length * 44)}>
            <BarChart data={sortedTypes} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210, 12%, 44%, 0.12)" />
              <XAxis type="number" tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(210, 12%, 44%, 0.4)" tickFormatter={formatCompact} />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(210, 12%, 44%, 0.4)"
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Accounts" radius={[0, 4, 4, 0]} barSize={24}>
                {sortedTypes.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
