import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrandColors } from "@/hooks/use-brand-colors";
import {
  DollarSign, TrendingUp, Users, Building2, Activity,
  Server, Clock, Zap, BarChart3, PieChart, RefreshCw, Target, ArrowUpRight,
  Shield, CheckCircle2, AlertTriangle, XCircle, Briefcase, Award, TrendingDown,
  Percent, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";


function MetricCard({ title, value, subtitle, icon: Icon, trend, testId }: {
  title: string; value: string | number; subtitle: string; icon: any; trend?: string; testId?: string;
}) {
  return (
    <Card data-testid={testId || `metric-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-600 border-green-500/20">{trend}</Badge>}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "excellent") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (status === "good") return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    excellent: "bg-green-500/10 text-green-600 border-green-500/20",
    good: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    needs_work: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  const labels: Record<string, string> = { excellent: "Excellent", good: "Good", needs_work: "Needs Work" };
  return <Badge variant="outline" className={`text-[10px] ${styles[status] || ""}`}>{labels[status] || status}</Badge>;
}

export default function PlatformMetricsPage() {
  const brandColors = useBrandColors();
  const COLORS = [brandColors.accent, brandColors.accentLight, brandColors.chartSecondary, brandColors.chartAccent];
  const { data: metrics, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ["/api/admin/platform-metrics"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="metrics-loading">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="metrics-error">
        <Activity className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load platform metrics</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { revenue, subscriptions, users, organizations, api, uptime, system, projections, cohortData, investorReadiness } = metrics;

  return (
    <div className="space-y-6" data-testid="platform-metrics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Metrics</h1>
          <p className="text-muted-foreground text-sm mt-1">Business intelligence, investor KPIs, and operational analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-metrics">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={`$${(revenue.mrr || 0).toLocaleString()}`}
          subtitle={`ARR: $${(revenue.arr || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="Recurring"
        />
        <MetricCard
          title="Active Organizations"
          value={organizations.active}
          subtitle={`${organizations.total} total | ${subscriptions.trialCount || 0} trials | ${subscriptions.churnedCount || 0} churned`}
          icon={Building2}
        />
        <MetricCard
          title="Total Users"
          value={users.total}
          subtitle={`${users.active} active, ${users.admins} admins`}
          icon={Users}
        />
        <MetricCard
          title="API Requests Today"
          value={(api.todayRequests || 0).toLocaleString()}
          subtitle={`${api.totalRequests?.toLocaleString() || 0} all-time`}
          icon={Activity}
        />
      </div>

      {investorReadiness && (
        <Card data-testid="card-investor-readiness">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Investor Readiness Scorecard
              <Badge className="ml-auto text-sm px-3" variant={investorReadiness.grade.startsWith("A") ? "default" : "secondary"}>
                Grade: {investorReadiness.grade}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${investorReadiness.overallScore}%`,
                      background: investorReadiness.overallScore >= 70 ? "hsl(142, 76%, 36%)" : investorReadiness.overallScore >= 40 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)"
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right">{investorReadiness.overallScore}/100</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Net Revenue Retention", value: `${revenue.nrr}%`, target: "> 120%", status: investorReadiness.nrrStatus },
                { label: "Rule of 40", value: `${revenue.ruleOf40}`, target: "> 40", status: investorReadiness.ruleOf40Status },
                { label: "LTV / CAC Ratio", value: `${revenue.ltvCacRatio}x`, target: "> 3x", status: investorReadiness.ltvCacStatus },
                { label: "CAC Payback", value: `${revenue.paybackMonths} mo`, target: "< 12 months", status: investorReadiness.paybackStatus },
                { label: "Gross Churn", value: `${revenue.grossChurnRate}%`, target: "< 5% monthly", status: investorReadiness.churnStatus },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg border bg-muted/30 space-y-1.5" data-testid={`readiness-${item.label.toLowerCase().replace(/[\s\/]/g, "-")}`}>
                  <div className="flex items-center justify-between">
                    <StatusIcon status={item.status} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">Target: {item.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-investor-kpis">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Unit Economics & SaaS Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">MRR Growth</p>
              <p className="text-lg font-bold text-primary">{revenue.growthRate || 0}%</p>
              <p className="text-[10px] text-muted-foreground">month-over-month</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">LTV</p>
              <p className="text-lg font-bold">${(revenue.ltv || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{revenue.avgMonthsRetained || 0}mo avg retention</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">CAC</p>
              <p className="text-lg font-bold">${(revenue.cac || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{revenue.paybackMonths || 0}mo payback</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">ARPU</p>
              <p className="text-lg font-bold">${revenue.arpu || 0}</p>
              <p className="text-[10px] text-muted-foreground">per org/month</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Gross Retention</p>
              <p className="text-lg font-bold">{revenue.grossRetention || 0}%</p>
              <p className="text-[10px] text-muted-foreground">excl. expansion</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className="text-lg font-bold text-green-600">{revenue.profitMargin || 0}%</p>
              <p className="text-[10px] text-muted-foreground">est. gross margin</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Trial Conversion</p>
              <p className="text-lg font-bold">{revenue.trialConversion || 0}%</p>
              <p className="text-[10px] text-muted-foreground">trial to paid</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Burn Multiple</p>
              <p className="text-lg font-bold">{revenue.burnMultiple || 0}x</p>
              <p className="text-[10px] text-muted-foreground">lower is better</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Magic Number</p>
              <p className="text-lg font-bold">{revenue.magicNumber || 0}</p>
              <p className="text-[10px] text-muted-foreground">sales efficiency</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Rev / Employee</p>
              <p className="text-lg font-bold">${(revenue.revenuePerEmployee || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">ARR per admin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-valuation-estimate">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Valuation Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estimated Enterprise Value</p>
              <p className="text-3xl font-bold text-primary">${(revenue.estimatedValuation || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{revenue.valuationMultiple || 0}x ARR multiple</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">ARR</p>
                <p className="font-bold">${(revenue.arr || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Expansion MRR</p>
                <p className="font-bold">${(revenue.expansionRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Contraction</p>
                <p className="font-bold text-red-600">-${(revenue.contractionRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Multiple based on NRR ({revenue.nrr}%) and Rule of 40 ({revenue.ruleOf40}). SaaS companies with NRR &gt; 120% and Rule of 40 &gt; 60 typically trade at 12-20x ARR. This estimate uses a {revenue.valuationMultiple}x multiple.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projections && projections.length > 0 && (
          <Card data-testid="card-growth-projection">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                12-Month Revenue Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-w-0 min-h-0 w-full">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={projections}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="mrr" stroke={brandColors.accent} fill={brandColors.accent} fillOpacity={0.15} name="Projected MRR" />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {cohortData && cohortData.length > 0 && (
          <Card data-testid="card-cohort-retention">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Cohort Retention (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Cohort</th>
                      <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Size</th>
                      {[0, 1, 2, 3, 4, 5].map(m => (
                        <th key={m} className="text-center py-1.5 px-2 font-medium text-muted-foreground">M{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((c: any) => (
                      <tr key={c.cohort} className="border-t border-border/30">
                        <td className="py-1.5 px-2 font-medium">{c.cohort}</td>
                        <td className="py-1.5 px-2 text-center">{c.size}</td>
                        {[0, 1, 2, 3, 4, 5].map(m => {
                          const val = c.retained[m];
                          if (val == null) return <td key={m} className="py-1.5 px-2 text-center text-muted-foreground">—</td>;
                          const pct = c.size > 0 ? Math.round((val / c.size) * 100) : 0;
                          const bg = pct >= 90 ? "bg-green-500/20" : pct >= 70 ? "bg-yellow-500/15" : "bg-red-500/15";
                          return (
                            <td key={m} className={`py-1.5 px-2 text-center rounded ${bg}`}>
                              {pct}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="ARPU"
          value={`$${revenue.arpu || 0}`}
          subtitle="Average revenue per org"
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${api.avgResponseTime || 0}ms`}
          subtitle={`P95: ${api.p95ResponseTime || 0}ms | P99: ${api.p99ResponseTime || 0}ms`}
          icon={Zap}
        />
        <MetricCard
          title="Uptime SLA"
          value={`${uptime.slaPercentage || 100}%`}
          subtitle={`Since ${uptime.since ? new Date(uptime.since).toLocaleDateString() : "N/A"}`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-api-traffic">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              API Traffic (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 min-h-0 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={api.hourlyData || []}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="requests" stroke={brandColors.accent} fill={brandColors.accent} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-daily-volume">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Daily Request Volume (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 min-h-0 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={api.dailyData || []}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                <Bar dataKey="requests" fill={brandColors.accentLight} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-subscription-tiers">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Subscription Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.tierBreakdown?.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="min-w-0 min-h-0 w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie data={subscriptions.tierBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="tier">
                      {subscriptions.tierBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {subscriptions.tierBreakdown.map((t: any, i: number) => (
                    <div key={t.tier} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div>
                        <p className="text-sm font-medium capitalize">{t.tier}</p>
                        <p className="text-xs text-muted-foreground">{t.count} orgs — ${t.revenue?.toLocaleString()}/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No subscription data available</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-endpoints">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" />
              Top API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(api.topEndpoints || []).map((ep: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[250px]">{ep.endpoint}</code>
                  <Badge variant="outline" className="text-xs">{ep.count.toLocaleString()}</Badge>
                </div>
              ))}
              {(!api.topEndpoints || api.topEndpoints.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No endpoint data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-status-codes">
          <CardHeader>
            <CardTitle className="text-sm">HTTP Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(api.statusBreakdown || []).map((s: any) => (
                <div key={s.bucket} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Badge variant={s.bucket === "2xx" ? "default" : s.bucket === "3xx" ? "secondary" : "destructive"} className="text-xs">
                    {s.bucket}
                  </Badge>
                  <span className="text-sm font-medium">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-system-info">
          <CardHeader>
            <CardTitle className="text-sm">System Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Node.js</span>
                <p className="font-medium">{system.nodeVersion}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Heap Memory</span>
                <p className="font-medium">{system.memoryUsedMb} / {system.memoryTotalMb} MB</p>
              </div>
              <div>
                <span className="text-muted-foreground">DB Pool</span>
                <p className="font-medium">{system.dbPoolIdle} / {system.dbPoolTotal} idle</p>
              </div>
              <div>
                <span className="text-muted-foreground">Req/s</span>
                <p className="font-medium">{api.requestsPerSecond}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
