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
  current: "hsl(175, 55%, 28%)",
  delinquent: "hsl(43, 80%, 55%)",
  default: "hsl(0, 72%, 42%)",
  closed: "hsl(200, 10%, 46%)",
  restructured: "hsl(200, 60%, 45%)",
};

const PIE_COLORS = [
  "hsl(175, 55%, 28%)",
  "hsl(43, 80%, 55%)",
  "hsl(0, 72%, 42%)",
  "hsl(200, 10%, 46%)",
  "hsl(200, 60%, 45%)",
  "hsl(142, 55%, 40%)",
];

const BAR_COLORS = [
  "hsl(175, 55%, 28%)",
  "hsl(43, 80%, 55%)",
  "hsl(14, 70%, 50%)",
  "hsl(142, 55%, 40%)",
  "hsl(200, 60%, 45%)",
  "hsl(280, 50%, 50%)",
  "hsl(350, 60%, 50%)",
  "hsl(175, 40%, 35%)",
];

const FALLBACK_TREND: MonthlyTrend[] = (() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data: MonthlyTrend[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = months[d.getMonth()];
    const base = 800 + (11 - i) * 120 + Math.floor(Math.random() * 80);
    data.push({
      month: monthLabel,
      borrowers: base,
      accounts: Math.floor(base * 1.8),
      outstanding: Math.floor(base * 45000),
    });
  }
  return data;
})();

const FALLBACK_STATUS: StatusBreakdown[] = [
  { status: "current", count: 1240 },
  { status: "delinquent", count: 185 },
  { status: "default", count: 62 },
  { status: "closed", count: 340 },
  { status: "restructured", count: 45 },
];

const FALLBACK_TYPES: TypeBreakdown[] = [
  { type: "Personal Loan", count: 520 },
  { type: "Mortgage", count: 310 },
  { type: "Business Loan", count: 280 },
  { type: "Auto Loan", count: 195 },
  { type: "Credit Card", count: 165 },
  { type: "Microfinance", count: 142 },
];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md p-3 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover border border-border rounded-md p-3 shadow-md text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.payload.fill }} />
        <span className="font-semibold capitalize">{item.name}</span>
      </div>
      <p className="mt-1 text-muted-foreground">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="dashboard-charts">
      <Card className="lg:col-span-2 border border-border/60" data-testid="chart-portfolio-trend">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-semibold">Portfolio Growth</h3>
            <p className="text-xs text-muted-foreground mt-0.5">12-month borrower and account trends</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBorrowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175, 55%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(175, 55%, 28%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAccounts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 80%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 80%, 55%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 10%, 46%, 0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 46%, 0.5)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 46%, 0.5)" tickFormatter={formatCompact} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="borrowers"
                name="Borrowers"
                stroke="hsl(175, 55%, 28%)"
                strokeWidth={2.5}
                fill="url(#gradBorrowers)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="accounts"
                name="Accounts"
                stroke="hsl(43, 80%, 55%)"
                strokeWidth={2.5}
                fill="url(#gradAccounts)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border/60" data-testid="chart-account-status">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-semibold">Account Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{statusTotal.toLocaleString()} total accounts</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
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
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border border-border/60" data-testid="chart-account-types">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 p-5">
          <div>
            <h3 className="text-sm font-semibold">Loan Types Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown by account type</p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ResponsiveContainer width="100%" height={Math.max(200, sortedTypes.length * 44)}>
            <BarChart data={sortedTypes} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(200, 10%, 46%, 0.15)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 46%, 0.5)" tickFormatter={formatCompact} />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 11 }}
                stroke="hsl(200, 10%, 46%, 0.5)"
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
        </CardContent>
      </Card>
    </div>
  );
}
