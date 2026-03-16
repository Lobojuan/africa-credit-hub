import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Wifi, Clock, CheckCircle2, AlertTriangle, Shield, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

function StatusBadge({ status }: { status: string }) {
  const color = status === "operational" || status === "ok" || status === "healthy"
    ? "bg-green-500/10 text-green-600 border-green-500/20"
    : status === "degraded"
    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    : "bg-red-500/10 text-red-600 border-red-500/20";
  return (
    <Badge variant="outline" className={color} data-testid={`status-badge-${status}`}>
      {status === "operational" || status === "ok" || status === "healthy" ? (
        <CheckCircle2 className="w-3 h-3 mr-1" />
      ) : (
        <AlertTriangle className="w-3 h-3 mr-1" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function SystemStatusPage() {
  const { data: status, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ["/api/admin/status-detail"],
    refetchInterval: 30000,
  });

  const { data: health } = useQuery<any>({
    queryKey: ["/api/admin/health-detail"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="status-loading">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="status-error">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load system status</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const services = status?.services || {};
  const hourlyUptime = status?.hourlyUptime || [];
  const hasServices = Object.keys(services).length > 0;
  const allOperational = hasServices && Object.values(services).every((s: any) => s === "operational");

  return (
    <div className="space-y-6" data-testid="system-status-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">System Status</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time platform health and uptime monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-status">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className={allOperational ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {allOperational ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-overall-status">
                {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {status?.platform} v{status?.version} — Up since {status?.uptime?.since ? new Date(status.uptime.since).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-3xl font-bold text-green-600" data-testid="text-sla-percentage">
                {status?.uptime?.slaPercentage || 100}%
              </div>
              <div className="text-xs text-muted-foreground">SLA Uptime (Target: {status?.uptime?.slaTarget || 99.9}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(services).map(([name, st]: [string, any]) => (
          <Card key={name} data-testid={`card-service-${name}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {name === "api" && <Server className="w-4 h-4 text-muted-foreground" />}
                  {name === "database" && <Database className="w-4 h-4 text-muted-foreground" />}
                  {name === "websocket" && <Wifi className="w-4 h-4 text-muted-foreground" />}
                  {name === "batchProcessing" && <Cpu className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium text-sm capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                </div>
                <StatusBadge status={st} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-uptime">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-uptime">{health.uptime?.formatted || "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-1">Since {health.uptime?.since ? new Date(health.uptime.since).toLocaleString() : "N/A"}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-database-health">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusBadge status={health.database?.status || "ok"} />
                <span className="text-sm text-muted-foreground">{health.database?.responseMs}ms latency</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pool: {health.database?.pool?.idle}/{health.database?.pool?.total} idle | {health.database?.pool?.waiting} waiting
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-memory">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-memory">
                {health.memory?.heapUsed || 0} MB
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {health.memory?.heapTotal || 0} MB heap ({health.memory?.rss || 0} MB RSS)
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${health.memory?.heapTotal ? Math.min((health.memory.heapUsed / health.memory.heapTotal) * 100, 100) : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {hourlyUptime.length > 0 && (
        <Card data-testid="card-hourly-uptime">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              24-Hour Uptime & Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyUptime}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis yAxisId="pct" domain={[90, 100]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="ms" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar yAxisId="pct" dataKey="pct" fill="hsl(175, 55%, 28%)" radius={[2, 2, 0, 0]} name="Uptime %" />
                <Bar yAxisId="ms" dataKey="avg_ms" fill="hsl(175, 55%, 50%)" radius={[2, 2, 0, 0]} name="Avg ms" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-infrastructure">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Infrastructure Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Platform</span>
              <p className="font-medium">{status?.platform || "CDH"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Version</span>
              <p className="font-medium">v{status?.version || "2.1.0"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Node.js</span>
              <p className="font-medium">{health?.node || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Environment</span>
              <p className="font-medium capitalize">{health?.environment || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
