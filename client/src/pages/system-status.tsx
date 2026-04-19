import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Wifi, Clock, CheckCircle2, AlertTriangle, Shield, Cpu, HardDrive, RefreshCw, Archive, Download, Upload, Trash2, Loader2, XCircle, Globe, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface BackupRecord {
  id: string;
  filename: string;
  type: string;
  sizeMB: number;
  status: string;
  createdAt: string;
  createdBy: string;
  tables: number;
  rows: number;
  durationMs: number;
  notes?: string;
}

interface BackupStatus {
  schedulerRunning: boolean;
  lastAutoBackup: string | null;
  nextAutoBackup: string | null;
  totalBackups: number;
  totalSizeMB: number;
  backupDir: string;
}

function BackupManagementPanel() {
  const { toast } = useToast();
  const [backupType, setBackupType] = useState<"full" | "schema" | "data">("full");
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ backups: BackupRecord[]; status: BackupStatus }>({
    queryKey: ["/api/backups"],
    staleTime: 15000,
  });

  const createMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", "/api/backups", { type });
      return res.json();
    },
    onSuccess: (d: BackupRecord) => {
      toast({ title: "Backup created", description: `${d.filename} (${d.sizeMB}MB)` });
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/backups/${id}/restore`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Restore complete", description: "Database has been restored successfully" });
      setConfirmRestore(null);
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
      setConfirmRestore(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/backups/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Backup deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const backups = data?.backups || [];
  const status = data?.status;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Card data-testid="panel-backup-management">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Backup & Recovery
            {status?.schedulerRunning && (
              <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Auto-backup active
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-7 text-xs gap-1" data-testid="button-refresh-backups">
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-lg bg-muted border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Total Backups</p>
            <p className="text-xl font-bold text-foreground" data-testid="text-total-backups">{status?.totalBackups ?? 0}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Total Size</p>
            <p className="text-xl font-bold text-foreground" data-testid="text-total-size">{(status?.totalSizeMB ?? 0).toFixed(1)} MB</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Last Backup</p>
            <p className="text-sm font-medium text-foreground" data-testid="text-last-backup">
              {status?.lastAutoBackup ? timeAgo(status.lastAutoBackup) : "None"}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Next Auto-Backup</p>
            <p className="text-sm font-medium text-foreground" data-testid="text-next-backup">
              {status?.nextAutoBackup ? formatDate(status.nextAutoBackup) : "Pending"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
          <span className="text-xs text-muted-foreground mr-1">Create backup:</span>
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value as any)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
            data-testid="select-backup-type"
          >
            <option value="full">Full (schema + data)</option>
            <option value="schema">Schema only</option>
            <option value="data">Data only</option>
          </select>
          <Button
            size="sm"
            onClick={() => createMutation.mutate(backupType)}
            disabled={createMutation.isPending}
            className="h-7 text-xs gap-1"
            data-testid="button-create-backup"
          >
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
            {createMutation.isPending ? "Creating..." : "Create Backup Now"}
          </Button>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No backups yet. Create your first backup above or wait for the automated daily backup.
            </div>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors"
                data-testid={`backup-row-${backup.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {backup.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : backup.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{backup.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {backup.type} · {backup.sizeMB} MB · {backup.tables} tables · {formatDuration(backup.durationMs)} · {formatDate(backup.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {backup.status === "completed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(`/api/backups/${backup.id}/download`, "_blank")}
                        title="Download"
                        data-testid={`button-download-${backup.id}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600"
                        onClick={() => setConfirmRestore(backup.id)}
                        title="Restore"
                        data-testid={`button-restore-${backup.id}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    onClick={() => deleteMutation.mutate(backup.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                    data-testid={`button-delete-${backup.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {confirmRestore && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs font-medium text-amber-600 mb-2">
              Are you sure you want to restore this backup? This will overwrite the current database.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => restoreMutation.mutate(confirmRestore)}
                disabled={restoreMutation.isPending}
                data-testid="button-confirm-restore"
              >
                {restoreMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Yes, Restore Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setConfirmRestore(null)}
                data-testid="button-cancel-restore"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground">
          Automated backups run daily. Up to 30 automated backups are retained. Restoring a backup will replace all current data.
        </p>
      </CardContent>
    </Card>
  );
}

const REGISTRY_LABELS: Record<string, { label: string; country: string; assetType: string }> = {
  ghana_dvla:        { label: "Ghana DVLA", country: "Ghana", assetType: "Vehicle" },
  sa_natis:          { label: "SA NaTIS", country: "South Africa", assetType: "Vehicle" },
  ghana_lands:       { label: "Ghana Lands Commission", country: "Ghana", assetType: "Property" },
  kenya_ntsa:        { label: "Kenya NTSA", country: "Kenya", assetType: "Vehicle" },
  nigeria_frsc:      { label: "Nigeria FRSC / MVAA", country: "Nigeria", assetType: "Vehicle" },
  uganda_ursb_motor: { label: "Uganda URSB", country: "Uganda", assetType: "Vehicle" },
  ethiopia_motor:    { label: "Ethiopia MVAA", country: "Ethiopia", assetType: "Vehicle" },
  liberia_motor:     { label: "Liberia Motor Registry", country: "Liberia", assetType: "Vehicle" },
  manual:            { label: "Manual Entry", country: "Any", assetType: "Any" },
};

function RegistryStatusPanel() {
  const { data, isLoading, refetch } = useQuery<Record<string, { live: boolean; url?: string }>>({
    queryKey: ["/api/trace/registry-status"],
    staleTime: 60000,
  });

  const registries = Object.entries(REGISTRY_LABELS);
  const liveCount = data ? Object.values(data).filter(r => r.live).length : 0;
  const totalCount = registries.filter(([k]) => k !== "manual").length;

  return (
    <Card data-testid="card-registry-status">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Asset Registry Connections
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{liveCount}/{totalCount} live</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} data-testid="button-refresh-registry">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking registries...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {registries.filter(([k]) => k !== "manual").map(([key, meta]) => {
              const status = data?.[key];
              const isLive = status?.live ?? false;
              return (
                <div key={key} data-testid={`registry-row-${key}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio className={`w-3 h-3 shrink-0 ${isLive ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <div className="min-w-0">
                      <p className="font-medium truncate" data-testid={`text-registry-label-${key}`}>{meta.label}</p>
                      <p className="text-[11px] text-muted-foreground">{meta.country} · {meta.assetType}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    data-testid={`badge-registry-status-${key}`}
                    className={isLive
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                      : "bg-muted/50 text-muted-foreground border-border text-[10px]"}
                  >
                    {isLive ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                    {isLive ? "Live" : "Stub"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">
          Set registry API credentials (e.g. <code className="bg-muted px-1 rounded">GHANA_DVLA_API_URL</code> + <code className="bg-muted px-1 rounded">GHANA_DVLA_API_KEY</code>) to activate live lookups. Stubs remain active until credentials are configured.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SystemStatusPage() {
  const brandColors = useBrandColors();
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

      <BackupManagementPanel />

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
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                <YAxis yAxisId="pct" domain={[90, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="ms" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} />
                <Bar yAxisId="pct" dataKey="pct" fill={brandColors.accent} radius={[2, 2, 0, 0]} name="Uptime %" />
                <Bar yAxisId="ms" dataKey="avg_ms" fill={brandColors.chartSecondary} radius={[2, 2, 0, 0]} name="Avg ms" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <RegistryStatusPanel />

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
              <p className="font-medium">{status?.platform || "Africa Credit Hub"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Version</span>
              <p className="font-medium">v{status?.version || "2.5.0"}</p>
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
