import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, Users, Building2, Activity,
  Server, Clock, Zap, BarChart3, PieChart, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(175, 55%, 28%)", "hsl(175, 55%, 45%)", "hsl(175, 55%, 62%)", "hsl(200, 55%, 45%)"];

function MetricCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle: string; icon: any; trend?: string;
}) {
  return (
    <Card data-testid={`metric-${title.toLowerCase().replace(/\s/g, "-")}`}>
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

export default function PlatformMetricsPage() {
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

  const { revenue, subscriptions, users, organizations, api, uptime, system } = metrics;

  return (
    <div className="space-y-6" data-testid="platform-metrics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Metrics</h1>
          <p className="text-muted-foreground text-sm mt-1">Business intelligence and operational analytics</p>
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
          subtitle={`${organizations.total} total registered`}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="ARPU"
          value={`$${revenue.arpu || 0}`}
          subtitle="Average revenue per user"
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
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={api.hourlyData || []}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="hsl(175, 55%, 28%)" fill="hsl(175, 55%, 28%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={api.dailyData || []}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="requests" fill="hsl(175, 55%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                <ResponsiveContainer width="50%" height={200}>
                  <RePieChart>
                    <Pie data={subscriptions.tierBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="tier">
                      {subscriptions.tierBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
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
