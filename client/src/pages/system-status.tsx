import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Wifi, Clock, CheckCircle2, AlertTriangle, Shield, Cpu, HardDrive, RefreshCw, Archive, Download, Upload, Trash2, Loader2, XCircle, Globe, Radio, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { useState, useEffect } from "react";
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

function XdsBureauStatusPanel() {
  const { data, isLoading, refetch } = useQuery<{ live: boolean; sandbox: boolean; url?: string }>({
    queryKey: ["/api/xds/status"],
    staleTime: 60000,
  });

  return (
    <Card data-testid="card-xds-status">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" />
          XDS Data Ghana — Credit Bureau
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} data-testid="button-refresh-xds">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking XDS bureau...
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" data-testid="row-xds-connection">
            <div className="flex items-center gap-2">
              <Radio className={`w-3 h-3 ${data?.live && !data?.sandbox ? "text-emerald-500" : data?.live && data?.sandbox ? "text-amber-500" : "text-muted-foreground/40"}`} />
              <div>
                <p className="font-medium">XDS Data Ghana Bureau API</p>
                <p className="text-[11px] text-muted-foreground">Ghana · Credit Bureau · Scores, Facilities, Adverse Items</p>
              </div>
            </div>
            <Badge
              variant="outline"
              data-testid="badge-xds-connection-status"
              className={
                data?.live && !data?.sandbox
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                  : data?.live && data?.sandbox
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                  : "bg-muted/50 text-muted-foreground border-border text-[10px]"
              }
            >
              {data?.live && !data?.sandbox && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
              {data?.live && data?.sandbox && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
              {!data?.live && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
              {data?.live && data?.sandbox ? "Sandbox" : data?.live ? "Live" : "Not configured"}
            </Badge>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">
          {data?.live && !data?.sandbox
            ? `Connected to production XDS Data Ghana bureau API at ${data?.url || "configured URL"}.`
            : data?.live && data?.sandbox
            ? "Running against the built-in XDS sandbox (deterministic synthetic data). Set XDS_GHANA_API_URL and XDS_GHANA_API_KEY environment secrets to switch to production."
            : "XDS bureau integration not configured. Set XDS_GHANA_API_URL and XDS_GHANA_API_KEY environment secrets to enable Ghana credit bureau lookups."
          }
        </p>
      </CardContent>
    </Card>
  );
}

interface RegistryTestResult {
  provider: string;
  configured: boolean;
  sandbox: boolean;
  reachable: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
  source: "live" | "sandbox" | "not_configured";
}

interface RegistryHealthEntry {
  provider: string;
  lastCheckedAt: string | null;
  lastStatus: "ok" | "fail" | "unknown";
  consecutiveFailures: number;
  latencyMs?: number;
  error?: string;
  alertSent: boolean;
}

interface RegistryHealthConfigData {
  alertEmail: string | null;
  slackWebhookUrl: string | null;
  checkIntervalMinutes: number;
  retentionDays: number | null;
  effectiveRetentionDays: number;
  currentIntervalMinutes: number;
  updatedAt: string | null;
}

interface RegistryCleanupStats {
  lastRanAt: string | null;
  deletedCount: number | null;
  retentionDays: number | null;
}

function RegistryHealthConfigPanel() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ alertEmail: string; slackWebhookUrl: string; checkIntervalMinutes: string; retentionDays: string } | null>(null);

  const { data, isLoading } = useQuery<RegistryHealthConfigData>({
    queryKey: ["/api/admin/registry-health-config"],
    staleTime: 30000,
    enabled: open,
  });

  const { data: cleanupStats } = useQuery<RegistryCleanupStats>({
    queryKey: ["/api/admin/registry-health-cleanup-stats"],
    staleTime: 60000,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && form === null) {
      setForm({
        alertEmail: data.alertEmail ?? "",
        slackWebhookUrl: data.slackWebhookUrl ?? "",
        checkIntervalMinutes: String(data.checkIntervalMinutes),
        retentionDays: data.retentionDays != null ? String(data.retentionDays) : "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { alertEmail: string | null; slackWebhookUrl: string | null; checkIntervalMinutes: number; retentionDays: number | null }) => {
      const res = await apiRequest("PUT", "/api/admin/registry-health-config", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings saved", description: "Registry alert settings have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registry-health-config"] });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/registry-health-cleanup");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cleanup complete", description: "Health record pruning ran successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registry-health-cleanup-stats"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cleanup failed", description: err.message, variant: "destructive" });
    },
  });

  function handleToggle() {
    setOpen(v => !v);
  }

  function handleSave() {
    if (!form) return;
    const interval = parseInt(form.checkIntervalMinutes, 10);
    if (isNaN(interval) || interval < 1 || interval > 1440) {
      toast({ title: "Invalid interval", description: "Interval must be between 1 and 1440 minutes.", variant: "destructive" });
      return;
    }
    const retentionRaw = form.retentionDays.trim();
    let retentionDays: number | null = null;
    if (retentionRaw !== "") {
      retentionDays = parseInt(retentionRaw, 10);
      if (isNaN(retentionDays) || retentionDays < 7 || retentionDays > 90) {
        toast({ title: "Invalid retention period", description: "History retention must be between 7 and 90 days.", variant: "destructive" });
        return;
      }
    }
    saveMutation.mutate({
      alertEmail: form.alertEmail.trim() || null,
      slackWebhookUrl: form.slackWebhookUrl.trim() || null,
      checkIntervalMinutes: interval,
      retentionDays,
    });
  }

  return (
    <Card data-testid="card-registry-health-config">
      <CardHeader
        className="flex flex-row items-center justify-between pb-3 cursor-pointer select-none"
        onClick={handleToggle}
        data-testid="button-toggle-registry-health-config"
      >
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Registry Alert Settings
        </CardTitle>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs text-muted-foreground">
              Checks every {data.currentIntervalMinutes} min
            </span>
          )}
          {cleanupStats?.lastRanAt && (
            <span className="text-xs text-muted-foreground hidden sm:inline" data-testid="text-cleanup-stats-summary">
              · Last cleanup: {cleanupStats.deletedCount ?? 0} row{cleanupStats.deletedCount !== 1 ? "s" : ""} deleted
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <div
            className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs"
            data-testid="card-cleanup-stats"
          >
            <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">Health Record Cleanup</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2"
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                  data-testid="button-run-cleanup-now"
                >
                  {cleanupMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Run cleanup now
                </Button>
              </div>
              {cleanupStats?.lastRanAt ? (
                <p className="text-muted-foreground" data-testid="text-cleanup-last-ran">
                  Last cleanup ran at{" "}
                  <span className="text-foreground font-medium">
                    {new Date(cleanupStats.lastRanAt).toLocaleString()}
                  </span>
                  {" — deleted "}
                  <span className="text-foreground font-medium" data-testid="text-cleanup-deleted-count">
                    {cleanupStats.deletedCount ?? 0} row{cleanupStats.deletedCount !== 1 ? "s" : ""}
                  </span>
                  {cleanupStats.retentionDays != null && (
                    <span className="text-muted-foreground">
                      {" "}older than {cleanupStats.retentionDays} days
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground" data-testid="text-cleanup-never-ran">
                  No cleanup has run yet since the server started. The pruning job runs automatically once daily.
                </p>
              )}
            </div>
          </div>
          {isLoading || !data ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <>
              {form && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="registry-alert-email" className="text-xs">Alert Email</Label>
                      <Input
                        id="registry-alert-email"
                        type="email"
                        placeholder="ops@example.com"
                        value={form.alertEmail}
                        onChange={e => setForm(f => f ? { ...f, alertEmail: e.target.value } : f)}
                        className="h-8 text-sm"
                        data-testid="input-registry-alert-email"
                      />
                      <p className="text-[10px] text-muted-foreground">Overrides <code className="bg-muted px-1 rounded">REGISTRY_ALERT_EMAIL</code> env var</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="registry-check-interval" className="text-xs">Check Interval (minutes)</Label>
                      <Input
                        id="registry-check-interval"
                        type="number"
                        min={1}
                        max={1440}
                        value={form.checkIntervalMinutes}
                        onChange={e => setForm(f => f ? { ...f, checkIntervalMinutes: e.target.value } : f)}
                        className="h-8 text-sm"
                        data-testid="input-registry-check-interval"
                      />
                      <p className="text-[10px] text-muted-foreground">Currently running every {data.currentIntervalMinutes} min</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="registry-retention-days" className="text-xs">History retention (days)</Label>
                      <Input
                        id="registry-retention-days"
                        type="number"
                        min={7}
                        max={90}
                        placeholder={String(Math.min(Math.max(data.effectiveRetentionDays, 7), 90))}
                        value={form.retentionDays}
                        onChange={e => setForm(f => f ? { ...f, retentionDays: e.target.value } : f)}
                        className="h-8 text-sm"
                        data-testid="input-registry-retention-days"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Currently keeping {data.effectiveRetentionDays} days of history (7–90). Overrides <code className="bg-muted px-1 rounded">REGISTRY_HEALTH_RETENTION_DAYS</code>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="registry-slack-webhook" className="text-xs">Slack Webhook URL</Label>
                    <Input
                      id="registry-slack-webhook"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={form.slackWebhookUrl}
                      onChange={e => setForm(f => f ? { ...f, slackWebhookUrl: e.target.value } : f)}
                      className="h-8 text-sm"
                      data-testid="input-registry-slack-webhook"
                    />
                    <p className="text-[10px] text-muted-foreground">Overrides <code className="bg-muted px-1 rounded">REGISTRY_ALERT_SLACK_WEBHOOK</code> env var</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {data.updatedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        Last saved {new Date(data.updatedAt).toLocaleString()}
                      </span>
                    )}
                    <Button
                      size="sm"
                      className="h-7 text-xs ml-auto"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      data-testid="button-save-registry-health-config"
                    >
                      {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Settings
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface RegistryHealthEvent {
  id: string;
  provider: string;
  status: "ok" | "fail";
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

function RegistrySparkline({ events }: { events: RegistryHealthEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  const slots = sorted.slice(-7);
  const placeholders = Math.max(0, 7 - slots.length);

  return (
    <div
      className="flex items-center gap-[2px]"
      title={`Last ${slots.length} check${slots.length !== 1 ? "s" : ""} (oldest → newest)`}
      data-testid="sparkline-registry"
    >
      {Array.from({ length: placeholders }).map((_, i) => (
        <span
          key={`ph-${i}`}
          className="w-2 h-3 rounded-[2px] bg-muted-foreground/15"
        />
      ))}
      {slots.map((e, i) => (
        <span
          key={e.id ?? i}
          data-testid={`sparkline-slot-${e.status}`}
          title={`${new Date(e.checkedAt).toLocaleString()} — ${e.status === "ok" ? `OK${e.latencyMs != null ? ` (${e.latencyMs}ms)` : ""}` : `Fail${e.error ? `: ${e.error}` : ""}`}`}
          className={`w-2 h-3 rounded-[2px] ${e.status === "ok" ? "bg-emerald-500" : "bg-red-500"}`}
        />
      ))}
    </div>
  );
}

function RegistryStatusPanel() {
  const { data, isLoading, refetch } = useQuery<Record<string, { live: boolean; url?: string; sandbox?: boolean }>>({
    queryKey: ["/api/trace/registry-status"],
    staleTime: 60000,
  });
  const { data: healthData } = useQuery<RegistryHealthEntry[]>({
    queryKey: ["/api/trace/registry-health"],
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const { data: historyData } = useQuery<RegistryHealthEvent[]>({
    queryKey: ["/api/trace/registry-health/history?days=30"],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<Record<string, RegistryTestResult | "testing">>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const registries = Object.entries(REGISTRY_LABELS);
  const liveCount = data ? Object.values(data).filter(r => r.live && !r.sandbox).length : 0;
  const sandboxCount = data ? Object.values(data).filter(r => r.live && r.sandbox).length : 0;
  const totalCount = registries.filter(([k]) => k !== "manual").length;

  const healthByProvider = (healthData ?? []).reduce<Record<string, RegistryHealthEntry>>((acc, h) => {
    acc[h.provider] = h;
    return acc;
  }, {});

  const failingCount = Object.values(healthByProvider).filter(h => h.lastStatus === "fail" && h.consecutiveFailures >= 2).length;

  const historyByProvider = (historyData ?? []).reduce<Record<string, RegistryHealthEvent[]>>((acc, e) => {
    if (!acc[e.provider]) acc[e.provider] = [];
    acc[e.provider].push(e);
    return acc;
  }, {});

  function toggleHistory(provider: string) {
    setExpandedHistory(prev => ({ ...prev, [provider]: !prev[provider] }));
  }

  async function testRegistry(provider: string) {
    setTestResults(prev => ({ ...prev, [provider]: "testing" }));
    try {
      const res = await apiRequest("POST", `/api/trace/registry-status/${provider}/test`);
      const result: RegistryTestResult = await res.json();
      setTestResults(prev => ({ ...prev, [provider]: result }));
      if (result.reachable) {
        toast({
          title: `${REGISTRY_LABELS[provider as keyof typeof REGISTRY_LABELS]?.label ?? provider} reachable`,
          description: `${result.sandbox ? "Sandbox" : "Live"} · ${result.latencyMs}ms`,
        });
      } else {
        toast({
          title: `${REGISTRY_LABELS[provider as keyof typeof REGISTRY_LABELS]?.label ?? provider} unreachable`,
          description: result.error ?? "Connection failed",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [provider]: { provider, configured: false, sandbox: false, reachable: false, source: "not_configured", error: e.message } }));
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Card data-testid="card-registry-status">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Asset Registry Connections
          {failingCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] ml-1" data-testid="badge-registries-failing">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
              {failingCount} down
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {sandboxCount > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">{sandboxCount} sandbox</span>
          )}
          {liveCount > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{liveCount} live</span>
          )}
          <span className="text-xs text-muted-foreground">/ {totalCount}</span>
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
          <div className="grid grid-cols-1 gap-2">
            {registries.filter(([k]) => k !== "manual").map(([key, meta]) => {
              const status = data?.[key];
              const isLive = status?.live ?? false;
              const isSandbox = status?.sandbox ?? false;
              const testResult = testResults[key];
              const isTesting = testResult === "testing";
              const testData = testResult && testResult !== "testing" ? testResult : null;
              const health = healthByProvider[key];
              const isHealthFailing = health && health.lastStatus === "fail" && health.consecutiveFailures >= 2;
              return (
                <div
                  key={key}
                  data-testid={`registry-row-${key}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${isHealthFailing ? "border-red-500/30 bg-red-500/5" : ""}`}
                >
                  {(() => {
                    const now = Date.now();
                    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
                    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                    const allProviderHistory = historyByProvider[key] ?? [];
                    const providerHistory = allProviderHistory.filter(
                      e => new Date(e.checkedAt).getTime() >= sevenDaysAgo
                    );
                    const providerHistory30d = allProviderHistory.filter(
                      e => new Date(e.checkedAt).getTime() >= thirtyDaysAgo
                    );
                    const failEvents7d = providerHistory.filter(e => e.status === "fail").length;
                    const totalEvents7d = providerHistory.length;
                    const okEvents7d = providerHistory.filter(e => e.status === "ok").length;
                    const uptimePct = totalEvents7d > 0 ? (okEvents7d / totalEvents7d) * 100 : null;
                    const totalEvents30d = providerHistory30d.length;
                    const okEvents30d = providerHistory30d.filter(e => e.status === "ok").length;
                    const failEvents30d = providerHistory30d.filter(e => e.status === "fail").length;
                    const uptimePct30d = totalEvents30d > 0 ? (okEvents30d / totalEvents30d) * 100 : null;
                    const CRITICAL_FAIL_7D = 5;
                    const CRITICAL_STREAK = 5;
                    const MIN_STREAK_DISPLAY = 2;
                    const longestStreak30d = (() => {
                      let max = 0, cur = 0;
                      const sorted = [...providerHistory30d].sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
                      for (const e of sorted) {
                        if (e.status === "fail") { cur++; max = Math.max(max, cur); } else { cur = 0; }
                      }
                      return max;
                    })();
                    const failSeverity = failEvents7d === 0 && failEvents30d === 0
                      ? "ok"
                      : failEvents7d >= CRITICAL_FAIL_7D || longestStreak30d >= CRITICAL_STREAK
                      ? "critical"
                      : "minor";
                    const isExpanded = expandedHistory[key] ?? false;
                    return (
                      <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Radio className={`w-3 h-3 shrink-0 ${isHealthFailing ? "text-red-500" : isLive && !isSandbox ? "text-emerald-500" : isLive && isSandbox ? "text-amber-500" : "text-muted-foreground/40"}`} />
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-registry-label-${key}`}>{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{meta.country} · {meta.assetType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {providerHistory.length > 0 && (
                        <RegistrySparkline events={providerHistory} />
                      )}
                      <Badge
                        variant="outline"
                        data-testid={`badge-registry-uptime-${key}`}
                        className={
                          uptimePct === null
                            ? "bg-muted/50 text-muted-foreground border-border text-[10px]"
                            : uptimePct >= 95
                            ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"
                            : uptimePct >= 80
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                            : "bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"
                        }
                      >
                        {uptimePct === null ? "N/A 7d" : `${uptimePct.toFixed(1)}% 7d`}
                      </Badge>
                      <Badge
                        variant="outline"
                        data-testid={`badge-registry-uptime-30d-${key}`}
                        className={
                          uptimePct30d === null
                            ? "bg-muted/50 text-muted-foreground border-border text-[10px]"
                            : uptimePct30d >= 95
                            ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"
                            : uptimePct30d >= 80
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                            : "bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"
                        }
                      >
                        {uptimePct30d === null ? "N/A 30d" : `${uptimePct30d.toFixed(1)}% 30d`}
                      </Badge>
                      {isHealthFailing && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]" data-testid={`badge-registry-health-fail-${key}`}>
                          <XCircle className="w-2.5 h-2.5 mr-1" />
                          Down
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        data-testid={`badge-registry-status-${key}`}
                        className={
                          isLive && !isSandbox
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                            : isLive && isSandbox
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                            : "bg-muted/50 text-muted-foreground border-border text-[10px]"
                        }
                      >
                        {isLive && !isSandbox && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                        {isLive && isSandbox && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                        {!isLive && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                        {isLive && isSandbox ? "Sandbox" : isLive ? "Live" : "Stub"}
                      </Badge>
                      {isLive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => testRegistry(key)}
                          disabled={isTesting}
                          data-testid={`button-test-registry-${key}`}
                        >
                          {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Test"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {health && health.lastCheckedAt && (
                    <div
                      data-testid={`text-registry-health-${key}`}
                      className={`mt-1.5 text-[10px] rounded px-2 py-1 flex items-center gap-1 ${
                        health.lastStatus === "ok"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : health.lastStatus === "fail"
                          ? "bg-red-500/10 text-red-700 dark:text-red-400"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      {health.lastStatus === "ok"
                        ? `Last check OK · ${health.latencyMs}ms · ${new Date(health.lastCheckedAt).toLocaleTimeString()}`
                        : `Failed ${health.consecutiveFailures}× · ${health.error ?? "Unknown error"} · ${new Date(health.lastCheckedAt).toLocaleTimeString()}`}
                      {health.alertSent && (
                        <span className="ml-1 font-medium">(team alerted)</span>
                      )}
                    </div>
                  )}
                  {testData && (
                    <div
                      data-testid={`text-registry-test-result-${key}`}
                      className={`mt-1.5 text-[10px] rounded px-2 py-1 ${testData.reachable ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}
                    >
                      {testData.reachable
                        ? `Connected · ${testData.source} · ${testData.latencyMs}ms`
                        : `Failed · ${testData.error ?? "Unknown error"}${testData.statusCode ? ` (HTTP ${testData.statusCode})` : ""}`}
                    </div>
                  )}
                  {(totalEvents7d > 0 || totalEvents30d > 0) && (
                    <div className="mt-1.5">
                      <button
                        data-testid={`button-toggle-history-${key}`}
                        onClick={() => toggleHistory(key)}
                        className={`flex items-center gap-1 text-[10px] transition-colors ${
                          failSeverity === "critical"
                            ? "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            : failSeverity === "minor"
                            ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {failSeverity === "ok"
                          ? "0 failures in 7d / 0 in 30d — all OK"
                          : <>
                              <span className={`font-medium ${failSeverity === "critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                                {failSeverity === "critical" ? "●" : "◐"}
                              </span>
                              {`${failEvents7d} failure${failEvents7d !== 1 ? "s" : ""} in 7d / ${failEvents30d} in 30d`}
                              {longestStreak30d >= MIN_STREAK_DISPLAY && (
                                <span className="opacity-80">{`· streak ${longestStreak30d} checks`}</span>
                              )}
                            </>
                        }
                        <span className="ml-0.5">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div
                          data-testid={`list-registry-history-${key}`}
                          className="mt-1 space-y-0.5 max-h-36 overflow-y-auto border rounded bg-muted/30 p-1"
                        >
                          {providerHistory.slice(0, 50).map(event => (
                            <div
                              key={event.id}
                              data-testid={`item-registry-history-${event.id}`}
                              className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded ${event.status === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                            >
                              {event.status === "ok"
                                ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                : <XCircle className="w-2.5 h-2.5 shrink-0" />}
                              <span className="text-muted-foreground shrink-0">
                                {new Date(event.checkedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {event.status === "ok"
                                ? <span>OK{event.latencyMs != null ? ` · ${event.latencyMs}ms` : ""}</span>
                                : <span className="truncate">Fail{event.error ? ` · ${event.error}` : ""}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">
          <span className="font-medium text-amber-600 dark:text-amber-400">Sandbox</span> — connected to the built-in sandbox registry (realistic deterministic data, no real government API).{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Live</span> — connected to the government production API.{" "}
          Health checks run periodically; the ops team is alerted after two consecutive failures. Alert recipients and interval are configurable in <span className="font-medium">Registry Alert Settings</span> below (falling back to <code className="bg-muted px-1 rounded">REGISTRY_ALERT_EMAIL</code> / <code className="bg-muted px-1 rounded">REGISTRY_ALERT_SLACK_WEBHOOK</code> env vars).
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

      <RegistryHealthConfigPanel />

      <XdsBureauStatusPanel />

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
