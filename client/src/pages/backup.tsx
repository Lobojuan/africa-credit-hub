import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, CheckCircle2, XCircle, HardDrive, RefreshCw, Download, Upload, Trash2, Loader2, Clock, Database, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function BackupPage() {
  const { toast } = useToast();
  const [backupType, setBackupType] = useState<"full" | "schema" | "data">("full");
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ backups: BackupRecord[]; status: BackupStatus }>({
    queryKey: ["/api/backups"],
    staleTime: 15000,
    refetchInterval: 30000,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="backup-loading">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">Loading backup data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="backup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Backup & Recovery</h1>
          <p className="text-muted-foreground text-sm mt-1">Database backup management, automated scheduling, and point-in-time recovery</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-backups">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-backups">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Archive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-backups">{status?.totalBackups ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-total-size">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-size">{(status?.totalSizeMB ?? 0).toFixed(1)} MB</p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-last-backup">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold" data-testid="text-last-backup">
                  {status?.lastAutoBackup ? timeAgo(status.lastAutoBackup) : "None"}
                </p>
                <p className="text-xs text-muted-foreground">Last Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-scheduler-status">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status?.schedulerRunning ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                <Shield className={`w-5 h-5 ${status?.schedulerRunning ? "text-emerald-500" : "text-red-500"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold" data-testid="text-scheduler-status">
                    {status?.schedulerRunning ? "Active" : "Inactive"}
                  </p>
                  {status?.schedulerRunning && (
                    <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Running
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Auto-Backup Scheduler</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Create New Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as any)}
              className="text-sm bg-background border border-border rounded-md px-3 py-2"
              data-testid="select-backup-type"
            >
              <option value="full">Full (schema + data)</option>
              <option value="schema">Schema only</option>
              <option value="data">Data only</option>
            </select>
            <Button
              onClick={() => createMutation.mutate(backupType)}
              disabled={createMutation.isPending}
              className="gap-2"
              data-testid="button-create-backup"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
              {createMutation.isPending ? "Creating Backup..." : "Create Backup Now"}
            </Button>
          </div>
          {status?.nextAutoBackup && (
            <p className="text-xs text-muted-foreground mt-3">
              Next automated backup scheduled for: <span className="font-medium">{formatDate(status.nextAutoBackup)}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {confirmRestore && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-amber-600 mb-3">
              Are you sure you want to restore this backup? This will overwrite the current database with the backup data.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => restoreMutation.mutate(confirmRestore)}
                disabled={restoreMutation.isPending}
                data-testid="button-confirm-restore"
              >
                {restoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Yes, Restore Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmRestore(null)}
                data-testid="button-cancel-restore"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Backup History</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {backups.length} backup{backups.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {backups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No backups yet. Create your first backup above or wait for the automated daily backup.
              </div>
            ) : (
              backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  data-testid={`backup-row-${backup.id}`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="shrink-0">
                      {backup.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : backup.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{backup.filename}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {backup.type}
                        </Badge>
                        {backup.createdBy === "system" && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">auto</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {backup.sizeMB} MB · {backup.tables} tables · {formatDuration(backup.durationMs)} · {formatDate(backup.createdAt)}
                        {backup.notes ? ` · ${backup.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    {backup.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => window.open(`/api/backups/${backup.id}/download`, "_blank")}
                          data-testid={`button-download-${backup.id}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                          onClick={() => setConfirmRestore(backup.id)}
                          data-testid={`button-restore-${backup.id}`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Restore
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 text-red-600 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => deleteMutation.mutate(backup.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${backup.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Automated backups run daily. Up to 30 automated backups are retained. Restoring a backup will replace all current data.
      </p>
    </div>
  );
}
