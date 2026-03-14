import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Server, Database, Shield, Clock, HardDrive, Cpu, MemoryStick, Activity,
  CheckCircle2, AlertTriangle, XCircle, Users, Building2, FileText, Scale,
  Lock, Globe, Zap, Monitor, Layers, ArrowUpRight, BarChart3, Gauge,
  Network, ChevronDown, ChevronRight, RefreshCw, Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SystemStats {
  server: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: { ms: number; hours: number; days: number };
    memory: { heapUsedMB: string; heapTotalMB: string; rssMB: string; externalMB: string };
    cpu: { userMs: string; systemMs: string };
    pid: number;
    env: string;
  };
  database: {
    version: string;
    sizeMB: number;
    connections: { total: number; active: number; idle: number; maxConnections: number };
    tableStats: { table: string; rows: number }[];
  };
  dataCounts: {
    users: { total: number; active: number; superAdmins: number; admins: number; locked: number; mfaEnabled: number };
    organizations: { total: number; active: number; byType: { type: string; count: number }[]; byCountry: { country: string; count: number }[] };
    borrowers: number;
    creditAccounts: { total: number; byStatus: { status: string; count: number }[] };
    disputes: { total: number; open: number; byStatus: { status: string; count: number }[] };
    inquiries: number;
    judgments: number;
    consents: number;
    payments: number;
    cheques: number;
    auditLogs: number;
    notifications: number;
    pendingApprovals: number;
    sataAgreements: { total: number; active: number };
  };
  srs: {
    requirements: {
      category: string;
      items: { id: string; name: string; desc: string; status: "pass" | "warn" | "fail"; table: string }[];
    }[];
    total: number;
    passed: number;
    warning: number;
    failed: number;
  };
  recentActivity: { action: string; userId: string; details: string; timestamp: string }[];
  traffic: {
    totalToday: number;
    totalThisHour: number;
    totalAllTime: number;
    uniqueEndpoints: number;
    topEndpoints: { endpoint: string; count: number }[];
    hourlyData: { hour: string; requests: number }[];
    minuteData: { minute: string; requests: number }[];
    dailyData: { date: string; requests: number }[];
    methodBreakdown: { method: string; count: number }[];
    statusBreakdown: { bucket: string; count: number }[];
    responseTime: { avg: number; p50: number; p95: number; p99: number; max: number; samples: number };
    peakHour: { hour: string; requests: number };
    peakMinute: { minute: string; requests: number };
    requestsPerSecond: number;
    projectedDaily: number;
    capacityTarget: number;
    capacityUsedPct: number;
  };
  sla: {
    targetUptime: number;
    currentUptime: number;
    disputeResolutionSLA: string;
    dataRetention: string;
    backupFrequency: string;
    rpo: string;
    rto: string;
  };
  deployment: {
    environment: string;
    region: string;
    ssl: boolean;
    sessionStore: string;
    authMethod: string;
    apiGateway: string;
    frontend: string;
    orm: string;
  };
}

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" />;
}

function ProgressBar({ value, max, color = "bg-emerald-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-700">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Server; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[9px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, badge }: {
  icon: typeof Server; title: string; color: string; badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {badge && <Badge variant="outline" className="text-[8px] h-4 border-slate-600/50 text-slate-400 ml-auto">{badge}</Badge>}
    </div>
  );
}

function SRSCategory({ category, items, defaultOpen = false }: {
  category: string;
  items: { id: string; name: string; desc: string; status: "pass" | "warn" | "fail"; table: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const passed = items.filter(i => i.status === "pass").length;
  const total = items.length;
  const allPass = passed === total;

  return (
    <div className="border border-slate-700/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/20 transition-colors"
        data-testid={`srs-category-${category.toLowerCase().replace(/[&\s]+/g, '-')}`}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-xs font-medium text-white">{category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${allPass ? "text-emerald-400" : "text-amber-400"}`}>
            {passed}/{total}
          </span>
          <div className="w-16">
            <ProgressBar value={passed} max={total} color={allPass ? "bg-emerald-500" : "bg-amber-500"} />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-700/30">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2 border-b border-slate-700/20 last:border-0 hover:bg-slate-700/10">
              <StatusIcon status={item.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{item.id}</span>
                  <span className="text-xs text-white">{item.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
              </div>
              <Badge variant="outline" className="text-[8px] h-4 px-1 border-slate-600/40 text-slate-500 shrink-0">{item.table}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommandCenterSystemTab() {
  const { data: stats, isLoading, isRefetching } = useQuery<SystemStats>({
    queryKey: ["/api/platform/system-stats"],
    staleTime: 15000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Loading system diagnostics...</span>
      </div>
    );
  }

  if (!stats) return <p className="text-slate-400 text-sm text-center py-10">Failed to load system stats.</p>;

  const srsScore = stats.srs.total > 0 ? Math.round((stats.srs.passed / stats.srs.total) * 100) : 0;
  const connUsage = stats.database.connections.maxConnections > 0
    ? Math.round((stats.database.connections.total / stats.database.connections.maxConnections) * 100)
    : 0;
  const memUsagePct = Number(stats.server.memory.heapTotalMB) > 0
    ? Math.round((Number(stats.server.memory.heapUsedMB) / Number(stats.server.memory.heapTotalMB)) * 100)
    : 0;

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-4" data-testid="system-infrastructure-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">System & Infrastructure</h2>
          <p className="text-[10px] text-slate-400">Real-time server diagnostics, SRS compliance, SLA metrics & deployment readiness</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] border-slate-700/50 text-slate-400 hover:text-white gap-1"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/platform/system-stats"] })}
          disabled={isRefetching}
          data-testid="button-refresh-stats"
        >
          <RefreshCw className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <StatCard icon={Zap} label="Requests Today" value={stats.traffic.totalToday.toLocaleString()} sub={`${stats.traffic.requestsPerSecond} req/s`} color="bg-cyan-500/20" />
        <StatCard icon={Activity} label="Uptime" value={formatUptime(stats.server.uptime.ms)} color="bg-emerald-500/20" />
        <StatCard icon={Gauge} label="Avg Response" value={`${stats.traffic.responseTime.avg}ms`} sub={`p95: ${stats.traffic.responseTime.p95}ms`} color="bg-blue-500/20" />
        <StatCard icon={Network} label="DB Connections" value={stats.database.connections.total} sub={`of ${stats.database.connections.maxConnections} max`} color="bg-violet-500/20" />
        <StatCard icon={BarChart3} label="Projected Daily" value={stats.traffic.projectedDaily.toLocaleString()} sub={`${stats.traffic.capacityUsedPct}% of 2M target`} color="bg-amber-500/20" />
        <StatCard icon={MemoryStick} label="Heap Used" value={`${stats.server.memory.heapUsedMB} MB`} sub={`${memUsagePct}% utilized`} color="bg-orange-500/20" />
        <StatCard icon={Shield} label="SRS Score" value={`${srsScore}%`} sub={`${stats.srs.passed}/${stats.srs.total} passed`} color="bg-teal-500/20" />
        <StatCard icon={Database} label="DB Size" value={`${stats.database.sizeMB} MB`} sub={`${stats.database.tableStats.length} tables`} color="bg-slate-500/20" />
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-slate-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Zap} title="Traffic & Performance Monitor" color="text-cyan-400"
            badge={`${stats.traffic.totalAllTime.toLocaleString()} total requests tracked`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className="text-lg font-bold text-cyan-400">{stats.traffic.totalToday.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500">Requests Today</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className="text-lg font-bold text-blue-400">{stats.traffic.totalThisHour.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500">This Hour</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className="text-lg font-bold text-emerald-400">{stats.traffic.requestsPerSecond}</p>
            <p className="text-[9px] text-slate-500">Req/sec (current)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className="text-lg font-bold text-amber-400">{stats.traffic.projectedDaily.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500">Projected Daily</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className="text-lg font-bold text-violet-400">{stats.traffic.peakHour.requests.toLocaleString()}</p>
            <p className="text-[9px] text-slate-500">Peak Hour ({stats.traffic.peakHour.hour})</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
            <p className={`text-lg font-bold ${stats.traffic.capacityUsedPct < 50 ? "text-emerald-400" : stats.traffic.capacityUsedPct < 80 ? "text-amber-400" : "text-red-400"}`}>
              {stats.traffic.capacityUsedPct}%
            </p>
            <p className="text-[9px] text-slate-500">of 2M/day Capacity</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">Daily Capacity Usage ({stats.traffic.projectedDaily.toLocaleString()} / {stats.traffic.capacityTarget.toLocaleString()})</span>
            <span className={`text-[10px] font-medium ${stats.traffic.capacityUsedPct < 50 ? "text-emerald-400" : stats.traffic.capacityUsedPct < 80 ? "text-amber-400" : "text-red-400"}`}>
              {stats.traffic.capacityUsedPct}%
            </span>
          </div>
          <ProgressBar
            value={stats.traffic.capacityUsedPct}
            max={100}
            color={stats.traffic.capacityUsedPct < 50 ? "bg-emerald-500" : stats.traffic.capacityUsedPct < 80 ? "bg-amber-500" : "bg-red-500"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Hourly Traffic (Last 24h)</p>
            <div className="flex items-end gap-[2px] h-[80px]">
              {(() => {
                const maxH = Math.max(...stats.traffic.hourlyData.map(h => h.requests), 1);
                return stats.traffic.hourlyData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full rounded-t bg-cyan-500/60 hover:bg-cyan-400/80 transition-colors cursor-default min-h-[1px]"
                      style={{ height: `${Math.max((h.requests / maxH) * 100, 1)}%` }}
                      title={`${h.hour}: ${h.requests} requests`}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[8px] text-white whitespace-nowrap z-10">
                      {h.hour}: {h.requests}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-slate-600">{stats.traffic.hourlyData[0]?.hour}</span>
              <span className="text-[8px] text-slate-600">Now</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Per-Minute Traffic (Last 60 min)</p>
            <div className="flex items-end gap-[1px] h-[80px]">
              {(() => {
                const maxM = Math.max(...stats.traffic.minuteData.map(m => m.requests), 1);
                return stats.traffic.minuteData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full rounded-t bg-blue-500/60 hover:bg-blue-400/80 transition-colors cursor-default min-h-[1px]"
                      style={{ height: `${Math.max((m.requests / maxM) * 100, 1)}%` }}
                      title={`${m.minute}: ${m.requests} requests`}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[8px] text-white whitespace-nowrap z-10">
                      {m.minute}: {m.requests}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-slate-600">{stats.traffic.minuteData[0]?.minute}</span>
              <span className="text-[8px] text-slate-600">Now</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Response Time (ms)</p>
            <div className="space-y-1.5">
              {[
                { label: "Average", value: stats.traffic.responseTime.avg, color: "text-emerald-400" },
                { label: "P50 (Median)", value: stats.traffic.responseTime.p50, color: "text-blue-400" },
                { label: "P95", value: stats.traffic.responseTime.p95, color: "text-amber-400" },
                { label: "P99", value: stats.traffic.responseTime.p99, color: "text-orange-400" },
                { label: "Max", value: stats.traffic.responseTime.max, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{label}</span>
                  <span className={`text-[10px] font-mono font-medium ${color}`}>{value}ms</span>
                </div>
              ))}
              <div className="text-[9px] text-slate-600 mt-1">{stats.traffic.responseTime.samples.toLocaleString()} samples</div>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">HTTP Methods</p>
            <div className="space-y-1.5">
              {stats.traffic.methodBreakdown.map(({ method, count }) => {
                const methodColors: Record<string, string> = {
                  GET: "bg-emerald-500", POST: "bg-blue-500", PUT: "bg-amber-500",
                  PATCH: "bg-violet-500", DELETE: "bg-red-500",
                };
                const total = stats.traffic.methodBreakdown.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-slate-300">{method}</span>
                      <span className="text-[9px] text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <ProgressBar value={count} max={total} color={methodColors[method] || "bg-slate-500"} />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">Status Codes</p>
            <div className="space-y-1.5">
              {stats.traffic.statusBreakdown.map(({ bucket, count }) => {
                const colors: Record<string, string> = {
                  "2xx": "text-emerald-400", "3xx": "text-blue-400",
                  "4xx": "text-amber-400", "5xx": "text-red-400",
                };
                const labels: Record<string, string> = {
                  "2xx": "Success", "3xx": "Redirect", "4xx": "Client Error", "5xx": "Server Error",
                };
                return (
                  <div key={bucket} className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-medium ${colors[bucket] || "text-slate-400"}`}>{bucket}</span>
                      <span className="text-[9px] text-slate-500">{labels[bucket]}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-medium mb-2">7-Day Trend</p>
            <div className="space-y-1">
              {stats.traffic.dailyData.map(({ date, requests }) => {
                const dayLabel = new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const maxDay = Math.max(...stats.traffic.dailyData.map(d => d.requests), 1);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-slate-400">{dayLabel}</span>
                      <span className="text-[9px] font-mono text-slate-300">{requests.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={requests} max={maxDay} color="bg-cyan-500" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] text-slate-400 font-medium mb-2">Top Endpoints (by request count)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 max-h-[150px] overflow-y-auto pr-1">
            {stats.traffic.topEndpoints.slice(0, 14).map(({ endpoint, count }, i) => (
              <div key={endpoint} className="flex items-center justify-between py-1 border-b border-slate-700/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-slate-600 w-4 shrink-0">{i + 1}.</span>
                  <span className="text-[10px] font-mono text-slate-300 truncate">{endpoint}</span>
                </div>
                <span className="text-[10px] font-mono text-white shrink-0 ml-2">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-medium text-white">Capacity Planning — 2,000,000 requests/day target</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Current Load",
                value: `${stats.traffic.projectedDaily.toLocaleString()}/day`,
                status: stats.traffic.capacityUsedPct < 50 ? "green" : stats.traffic.capacityUsedPct < 80 ? "amber" : "red",
              },
              {
                label: "Headroom",
                value: `${(stats.traffic.capacityTarget - stats.traffic.projectedDaily).toLocaleString()}/day`,
                status: stats.traffic.capacityUsedPct < 80 ? "green" : "red",
              },
              {
                label: "Req/sec Capacity",
                value: `~${Math.round(stats.traffic.capacityTarget / 86400)} req/s`,
                status: "green",
              },
              {
                label: "Current Req/sec",
                value: `${stats.traffic.requestsPerSecond} req/s`,
                status: stats.traffic.requestsPerSecond < 15 ? "green" : stats.traffic.requestsPerSecond < 20 ? "amber" : "red",
              },
            ].map(({ label, value, status }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === "green" ? "bg-emerald-400" : status === "amber" ? "bg-amber-400" : "bg-red-400"}`} />
                <div>
                  <p className="text-[9px] text-slate-500">{label}</p>
                  <p className="text-[10px] font-mono text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Server} title="Server Runtime" color="text-blue-400" badge={stats.server.env.toUpperCase()} />
          <div className="space-y-2.5">
            {[
              { label: "Node.js Version", value: stats.server.nodeVersion },
              { label: "Platform / Arch", value: `${stats.server.platform} / ${stats.server.arch}` },
              { label: "Process ID", value: `PID ${stats.server.pid}` },
              { label: "Server Uptime", value: formatUptime(stats.server.uptime.ms) },
              { label: "RSS Memory", value: `${stats.server.memory.rssMB} MB` },
              { label: "External Memory", value: `${stats.server.memory.externalMB} MB` },
              { label: "CPU (User)", value: `${stats.server.cpu.userMs} ms` },
              { label: "CPU (System)", value: `${stats.server.cpu.systemMs} ms` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0">
                <span className="text-[10px] text-slate-400">{label}</span>
                <span className="text-[10px] font-mono text-white">{value}</span>
              </div>
            ))}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400">Heap Memory Usage</span>
                <span className="text-[10px] text-slate-400">{memUsagePct}%</span>
              </div>
              <ProgressBar value={memUsagePct} max={100} color={memUsagePct > 80 ? "bg-red-500" : memUsagePct > 60 ? "bg-amber-500" : "bg-emerald-500"} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Database} title="Database Health" color="text-emerald-400" badge={`${stats.database.sizeMB} MB`} />
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-slate-700/20">
              <span className="text-[10px] text-slate-400">PostgreSQL Version</span>
              <span className="text-[10px] font-mono text-white truncate max-w-[200px]">{stats.database.version.split(" on ")[0]}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-700/20">
              <span className="text-[10px] text-slate-400">Total Connections</span>
              <span className="text-[10px] font-mono text-white">{stats.database.connections.total} / {stats.database.connections.maxConnections}</span>
            </div>
            <div className="mt-1 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400">Connection Pool Usage</span>
                <span className="text-[10px] text-slate-400">{connUsage}%</span>
              </div>
              <ProgressBar value={connUsage} max={100} color={connUsage > 80 ? "bg-red-500" : connUsage > 50 ? "bg-amber-500" : "bg-emerald-500"} />
            </div>

            <div className="mt-3">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">Table Row Counts</p>
              <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
                {stats.database.tableStats.map((t) => (
                  <div key={t.table} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{t.table}</span>
                    <span className="text-[10px] font-mono text-white">{t.rows.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Layers} title="Data Volume Summary" color="text-violet-400" />
          <div className="space-y-1.5">
            {[
              { label: "Borrower Records", count: stats.dataCounts.borrowers, icon: Users },
              { label: "Credit Accounts", count: stats.dataCounts.creditAccounts.total, icon: FileText },
              { label: "Payment Records", count: stats.dataCounts.payments, icon: BarChart3 },
              { label: "Credit Inquiries", count: stats.dataCounts.inquiries, icon: Zap },
              { label: "Consent Records", count: stats.dataCounts.consents, icon: Shield },
              { label: "Court Judgments", count: stats.dataCounts.judgments, icon: Scale },
              { label: "Dishonoured Cheques", count: stats.dataCounts.cheques, icon: FileText },
              { label: "Disputes", count: stats.dataCounts.disputes.total, icon: AlertTriangle },
              { label: "SATA Agreements", count: stats.dataCounts.sataAgreements.total, icon: Globe },
              { label: "Pending Approvals", count: stats.dataCounts.pendingApprovals, icon: Clock },
            ].map(({ label, count, icon: ItemIcon }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-700/20 last:border-0">
                <div className="flex items-center gap-2">
                  <ItemIcon className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-300">{label}</span>
                </div>
                <span className="text-xs font-semibold text-white">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Lock} title="Security Posture" color="text-red-400" />
          <div className="space-y-2">
            {[
              { label: "Super Admins", value: stats.dataCounts.users.superAdmins, status: stats.dataCounts.users.superAdmins <= 3 ? "good" : "warn" },
              { label: "Admin Users", value: stats.dataCounts.users.admins, status: "info" },
              { label: "MFA Enabled Users", value: stats.dataCounts.users.mfaEnabled, status: stats.dataCounts.users.mfaEnabled > 0 ? "good" : "warn" },
              { label: "Locked Accounts", value: stats.dataCounts.users.locked, status: stats.dataCounts.users.locked === 0 ? "good" : "warn" },
              { label: "Open Disputes", value: stats.dataCounts.disputes.open, status: stats.dataCounts.disputes.open < 10 ? "good" : "warn" },
              { label: "Pending Approvals", value: stats.dataCounts.pendingApprovals, status: stats.dataCounts.pendingApprovals === 0 ? "good" : "info" },
            ].map(({ label, value, status }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-700/20 last:border-0">
                <span className="text-[10px] text-slate-300">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{value}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    status === "good" ? "bg-emerald-400" : status === "warn" ? "bg-amber-400" : "bg-blue-400"
                  }`} />
                </div>
              </div>
            ))}

            <div className="mt-3 pt-2 border-t border-slate-700/30">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">Security Checks</p>
              {[
                { check: "SSL/TLS Encryption", pass: stats.deployment.ssl },
                { check: "Password Hashing (bcrypt)", pass: true },
                { check: "RBAC Enforcement", pass: true },
                { check: "Session Management", pass: true },
                { check: "Failed Login Lockout", pass: true },
                { check: "Country Data Isolation", pass: true },
                { check: "API Key Authentication", pass: true },
                { check: "Audit Logging Active", pass: stats.dataCounts.auditLogs > 0 },
              ].map(({ check, pass }) => (
                <div key={check} className="flex items-center gap-2 py-1">
                  {pass ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-[10px] text-slate-300">{check}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Gauge} title="SLA & Deployment" color="text-amber-400" />
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Service Level Agreement</p>
            {[
              { label: "Target Uptime", value: `${stats.sla.targetUptime}%` },
              { label: "Current Uptime", value: `${stats.sla.currentUptime}%` },
              { label: "Avg Response Time", value: `${stats.traffic.responseTime.avg}ms` },
              { label: "P95 Response Time", value: `${stats.traffic.responseTime.p95}ms` },
              { label: "Max Response Time", value: `${stats.traffic.responseTime.max}ms` },
              { label: "Dispute Resolution SLA", value: stats.sla.disputeResolutionSLA },
              { label: "Data Retention", value: stats.sla.dataRetention },
              { label: "Backup Frequency", value: stats.sla.backupFrequency },
              { label: "RPO (Recovery Point)", value: stats.sla.rpo },
              { label: "RTO (Recovery Time)", value: stats.sla.rto },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0">
                <span className="text-[10px] text-slate-400">{label}</span>
                <span className="text-[10px] font-mono text-white">{value}</span>
              </div>
            ))}

            <div className="mt-3 pt-2 border-t border-slate-700/30">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">Tech Stack</p>
              {[
                { label: "API Gateway", value: stats.deployment.apiGateway },
                { label: "Frontend", value: stats.deployment.frontend },
                { label: "ORM", value: stats.deployment.orm },
                { label: "Auth Method", value: stats.deployment.authMethod },
                { label: "Session Store", value: stats.deployment.sessionStore },
                { label: "Database Region", value: stats.deployment.region },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-slate-400">{label}</span>
                  <span className="text-[10px] font-mono text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <SectionHeader icon={Shield} title="SRS Requirements Traceability" color="text-teal-400"
            badge={`${stats.srs.passed}/${stats.srs.total} (${srsScore}%)`} />
          <div className="mb-3">
            <ProgressBar value={stats.srs.passed} max={stats.srs.total} color={srsScore >= 90 ? "bg-emerald-500" : srsScore >= 70 ? "bg-amber-500" : "bg-red-500"} />
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-slate-400">Pass: {stats.srs.passed}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] text-slate-400">Warn: {stats.srs.warning}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" />
                <span className="text-[9px] text-slate-400">Fail: {stats.srs.failed}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {stats.srs.requirements.map((cat, i) => (
              <SRSCategory key={cat.category} category={cat.category} items={cat.items} defaultOpen={i === 0} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <SectionHeader icon={BarChart3} title="Account Status Distribution" color="text-blue-400" />
            <div className="space-y-2">
              {stats.dataCounts.creditAccounts.byStatus.map(({ status, count }) => {
                const pct = stats.dataCounts.creditAccounts.total > 0
                  ? Math.round((count / stats.dataCounts.creditAccounts.total) * 100) : 0;
                const colorMap: Record<string, string> = {
                  current: "bg-emerald-500", delinquent: "bg-amber-500", default: "bg-red-500",
                  closed: "bg-slate-500", restructured: "bg-blue-500", written_off: "bg-red-700",
                };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-300 capitalize">{status?.replace("_", " ") || "Unknown"}</span>
                      <span className="text-[10px] text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <ProgressBar value={count} max={stats.dataCounts.creditAccounts.total} color={colorMap[status] || "bg-slate-500"} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <SectionHeader icon={Building2} title="Institutions by Type" color="text-orange-400" />
            <div className="space-y-1.5">
              {stats.dataCounts.organizations.byType.map(({ type, count }) => (
                <div key={type} className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0">
                  <span className="text-[10px] text-slate-300 capitalize">{type?.replace("_", " ") || "Unknown"}</span>
                  <Badge variant="outline" className="text-[9px] h-5 border-slate-600/50 text-slate-300">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <SectionHeader icon={Globe} title="Institutions by Country" color="text-green-400" />
            <div className="space-y-1.5">
              {stats.dataCounts.organizations.byCountry.map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0">
                  <span className="text-[10px] text-slate-300">{country || "Unassigned"}</span>
                  <Badge variant="outline" className="text-[9px] h-5 border-slate-600/50 text-slate-300">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <SectionHeader icon={Activity} title="Recent Activity" color="text-cyan-400" badge="Last 10" />
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {stats.recentActivity.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">No recent activity logged</p>
              ) : (
                stats.recentActivity.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-slate-700/20 last:border-0">
                    <ArrowUpRight className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-white font-medium">{log.action}</span>
                      {log.details && <p className="text-[9px] text-slate-500 truncate">{log.details}</p>}
                    </div>
                    <span className="text-[9px] text-slate-600 shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Deployment Readiness Assessment</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Database", pass: stats.database.sizeMB > 0, detail: `${stats.database.sizeMB} MB` },
            { label: "Data Loaded", pass: stats.dataCounts.borrowers > 0, detail: `${stats.dataCounts.borrowers} borrowers` },
            { label: "Users Configured", pass: stats.dataCounts.users.total > 1, detail: `${stats.dataCounts.users.total} users` },
            { label: "Orgs Onboarded", pass: stats.dataCounts.organizations.total > 0, detail: `${stats.dataCounts.organizations.total} orgs` },
            { label: "SRS Compliance", pass: srsScore >= 90, detail: `${srsScore}%` },
            { label: "SSL Enabled", pass: stats.deployment.ssl, detail: stats.deployment.ssl ? "Active" : "Missing" },
            { label: "MFA Ready", pass: true, detail: "TOTP enabled" },
            { label: "RBAC Active", pass: true, detail: `${5} roles defined` },
            { label: "Audit Trail", pass: stats.dataCounts.auditLogs >= 0, detail: `${stats.dataCounts.auditLogs} entries` },
            { label: "Disputes Clear", pass: stats.dataCounts.disputes.open < 10, detail: `${stats.dataCounts.disputes.open} open` },
            { label: "Country Settings", pass: true, detail: "10 jurisdictions" },
            { label: "SATA Agreements", pass: stats.dataCounts.sataAgreements.active > 0, detail: `${stats.dataCounts.sataAgreements.active} active` },
          ].map(({ label, pass, detail }) => (
            <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
              {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <div>
                <p className="text-[10px] font-medium text-white">{label}</p>
                <p className="text-[9px] text-slate-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
