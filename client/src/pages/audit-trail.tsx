import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Shield, Search, ShieldCheck, ShieldAlert, RefreshCw, Hash, List, Clock, Download, FileSpreadsheet, Calendar, Activity, Users, Eye, BarChart3, Filter, Wrench, Info, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditLog } from "@shared/schema";

interface AuditStats {
  totalLogs: number;
  actionsToday: number;
  uniqueUsersToday: number;
  totalUniqueUsers: number;
  topActions: { action: string; count: number }[];
  topEntities: { entity: string; count: number }[];
  uniqueActions: string[];
  uniqueEntities: string[];
}

function getActionColor(action: string) {
  switch (action) {
    case "CREATE": return "default" as const;
    case "UPDATE": return "secondary" as const;
    case "DELETE": return "destructive" as const;
    case "LOGIN": return "outline" as const;
    case "LOGOUT": return "outline" as const;
    case "SEARCH": return "outline" as const;
    case "VIEW": return "outline" as const;
    case "APPROVE": return "default" as const;
    case "REJECT": return "destructive" as const;
    case "ACCOUNT_LOCKED": return "destructive" as const;
    case "BATCH_UPLOAD": return "secondary" as const;
    case "FILE_DISPUTE": return "secondary" as const;
    case "SUBMIT_APPROVAL": return "secondary" as const;
    default: return "secondary" as const;
  }
}

function getTimelineDotColor(action: string) {
  switch (action) {
    case "CREATE":
    case "APPROVE":
      return "bg-green-500";
    case "UPDATE":
    case "BATCH_UPLOAD":
    case "SUBMIT_APPROVAL":
    case "FILE_DISPUTE":
      return "bg-blue-500";
    case "DELETE":
    case "REJECT":
    case "ACCOUNT_LOCKED":
      return "bg-red-500";
    case "LOGIN":
    case "LOGOUT":
      return "bg-amber-500";
    default:
      return "bg-muted-foreground";
  }
}

export default function AuditTrailPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("logs");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: integrity, isLoading: integrityLoading, refetch: refetchIntegrity, isFetching: integrityFetching } = useQuery<{ valid: boolean; totalChecked: number; brokenAt?: string; brokenAtIndex?: number; reason?: string }>({
    queryKey: ["/api/audit/verify-integrity"],
  });

  const { toast } = useToast();
  const [repairing, setRepairing] = useState(false);
  const handleRepairChain = async () => {
    setRepairing(true);
    try {
      const res = await apiRequest("POST", "/api/audit/repair-chain");
      const result = await res.json();
      toast({ title: "Chain repaired", description: `${result.repairedCount} of ${result.totalLogs} entries re-hashed successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/api/audit/verify-integrity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    } catch (e: any) {
      toast({ title: "Repair failed", description: e.message, variant: "destructive" });
    } finally {
      setRepairing(false);
    }
  };

  const { data: stats, isLoading: statsLoading } = useQuery<AuditStats>({
    queryKey: ["/api/audit/stats"],
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      if (filter) {
        const search = filter.toLowerCase();
        const matchesSearch =
          log.action.toLowerCase().includes(search) ||
          log.entity.toLowerCase().includes(search) ||
          (log.details && log.details.toLowerCase().includes(search)) ||
          (log.userId && log.userId.toLowerCase().includes(search)) ||
          (log.entityId && log.entityId.toLowerCase().includes(search)) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      if (actionFilter === "TRACE_*") {
        if (!log.action || !log.action.startsWith("TRACE_")) return false;
      } else if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (entityFilter !== "all" && log.entity !== entityFilter) return false;

      if (dateFrom && log.createdAt) {
        const logDate = new Date(log.createdAt);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }

      if (dateTo && log.createdAt) {
        const logDate = new Date(log.createdAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [logs, filter, dateFrom, dateTo, actionFilter, entityFilter]);

  const accessLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log =>
      log.action === "VIEW" || log.action === "SEARCH" || log.action === "CREDIT_REPORT"
    );
  }, [logs]);

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const res = await fetch(`/api/reports/export?format=${format}&type=audit`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const oneTimeKey = res.headers.get("X-Export-Key");
      const iv = res.headers.get("X-Export-IV");
      const sha256 = res.headers.get("X-Export-SHA256");
      const sha256Companion = res.headers.get("X-Export-SHA256-Companion");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `audit_trail.enc`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      if (sha256Companion) {
        const companionBlob = new Blob([atob(sha256Companion)], { type: "text/plain" });
        const ca = document.createElement("a");
        ca.href = URL.createObjectURL(companionBlob);
        ca.download = filename.replace(/\.enc$/, "") + ".sha256";
        ca.click();
        URL.revokeObjectURL(ca.href);
      }
      if (oneTimeKey) {
        alert(`Encrypted export downloaded.\n\nDecryption Key: ${oneTimeKey}\nIV: ${iv}\nSHA-256: ${sha256}\n\nSave this key — it cannot be recovered.`);
      }
    } catch (e: any) {
      alert(e.message || "Export failed");
    }
  };

  const clearFilters = () => {
    setFilter("");
    setDateFrom("");
    setDateTo("");
    setActionFilter("all");
    setEntityFilter("all");
  };

  const hasActiveFilters = filter || dateFrom || dateTo || actionFilter !== "all" || entityFilter !== "all";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-audit-title">{t('audit.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {integrityLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : integrity ? (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium ${
                integrity.valid
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300 dark:text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300 dark:text-red-400"
              }`}
              data-testid="badge-integrity-status"
            >
              {integrity.valid ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              <span>
                {integrity.valid
                  ? t("audit.integrityValid", { count: integrity.totalChecked })
                  : t("audit.integrityBroken")}
              </span>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchIntegrity()}
            disabled={integrityFetching}
            data-testid="button-verify-integrity"
          >
            {integrityFetching ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            {integrityFetching ? "Verifying..." : t("audit.verify")}
          </Button>
          {integrity && !integrity.valid && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepairChain}
              disabled={repairing}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
              data-testid="button-repair-chain"
            >
              {repairing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5 mr-1.5" />}
              {repairing ? "Repairing..." : "Repair Chain"}
            </Button>
          )}
        </div>
      </div>

      {integrity && !integrity.valid && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-900/20" data-testid="banner-integrity-explanation">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Why is the chain integrity warning showing?</p>
            <p className="text-sm text-amber-700 dark:text-amber-400/80">
              {integrity.reason || "The audit log hash chain has a break. This usually happens during system updates, data migrations, or when log entries are enriched with additional metadata after they were first recorded."}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400/80">
              This does <span className="font-semibold">not</span> mean your data was tampered with. It means the cryptographic chain needs to be re-sealed. Click <span className="font-semibold">"Repair Chain"</span> above to rebuild the hashes — all original log data (timestamps, actions, users) is preserved.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Actions Today</p>
                <p className="text-xl font-bold" data-testid="text-stat-actions-today">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.actionsToday ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Active Users Today</p>
                <p className="text-xl font-bold" data-testid="text-stat-users-today">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.uniqueUsersToday ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Top Action</p>
                <p className="text-sm font-bold truncate" data-testid="text-stat-top-action">
                  {statsLoading ? <Skeleton className="h-6 w-20" /> : stats?.topActions?.[0]?.action ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.topActions?.[0] ? `${stats.topActions[0].count} occurrences` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${integrity?.valid ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {integrity?.valid ? (
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Chain Integrity</p>
                <p className="text-sm font-bold" data-testid="text-stat-integrity">
                  {integrityLoading ? <Skeleton className="h-6 w-16" /> : integrity?.valid ? "Verified" : "Broken"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {integrity ? `${integrity.totalChecked} records checked` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="logs" data-testid="tab-audit-logs">
              <List className="w-3.5 h-3.5 mr-1.5" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="access" data-testid="tab-access-logs">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Access Log
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              data-testid="button-export-csv"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("xlsx")}
              data-testid="button-export-xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Excel
            </Button>
          </div>
        </div>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 flex-wrap">
            <div className="relative max-w-sm w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-filter-audit"
                placeholder={t('audit.filterPlaceholder')}
                className="pl-9"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap" data-testid="quick-filter-chips">
              <span className="text-xs text-muted-foreground mr-1">Quick filter:</span>
              <Button
                variant={actionFilter === "cross_product_access" ? "default" : "outline"}
                size="sm"
                className="h-7 rounded-full text-xs"
                data-testid="chip-cross-product-accesses"
                onClick={() =>
                  setActionFilter(actionFilter === "cross_product_access" ? "all" : "cross_product_access")
                }
              >
                <Activity className="w-3 h-3 mr-1.5" />
                Cross-Product Accesses
              </Button>
              <Button
                variant={actionFilter === "TRACE_*" ? "default" : "outline"}
                size="sm"
                className="h-7 rounded-full text-xs"
                data-testid="chip-trace-activity"
                onClick={() =>
                  setActionFilter(actionFilter === "TRACE_*" ? "all" : "TRACE_*")
                }
              >
                <Eye className="w-3 h-3 mr-1.5" />
                Trace activity
              </Button>
            </div>

            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Action</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-action-filter">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="TRACE_*">Trace activity (all TRACE_*)</SelectItem>
                    <SelectItem value="cross_product_access">Cross-Product Accesses (Bridge)</SelectItem>
                    {(stats?.uniqueActions || []).map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Entity</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-entity-filter">
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {(stats?.uniqueEntities || []).map(entity => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  From
                </Label>
                <Input
                  type="date"
                  data-testid="input-date-from"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  To
                </Label>
                <Input
                  type="date"
                  data-testid="input-date-to"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <List className="w-3.5 h-3.5 mr-1.5" />
                Table
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                data-testid="button-view-timeline"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Timeline
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="text-xs text-muted-foreground" data-testid="text-filter-count">
              Showing {filteredLogs.length} of {logs?.length ?? 0} records
            </div>
          )}

          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : filteredLogs && filteredLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[130px]">{t('audit.timestamp')}</TableHead>
                          <TableHead className="w-[90px]">{t('audit.action')}</TableHead>
                          <TableHead className="w-[80px]">{t('audit.entity')}</TableHead>
                          <TableHead>{t('audit.details')}</TableHead>
                          <TableHead className="w-[100px]">{t('audit.ipAddress')}</TableHead>
                          <TableHead className="w-[90px]">{t('audit.userId')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <TableRow key={log.id} data-testid={`row-audit-${log.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString("en-GB", {
                                day: "2-digit", month: "short", year: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              }) : "\u2014"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionColor(log.action)} className="text-[10px]">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{log.entity}</TableCell>
                            <TableCell className="text-xs truncate">{log.details || "\u2014"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || "\u2014"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono truncate">
                              {log.userId ? log.userId.substring(0, 8) : "\u2014"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                    <h3 className="font-semibold">{t('audit.noEntries')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? t('audit.noFilterResults') : t('audit.activityNote')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredLogs && filteredLogs.length > 0 ? (
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      data-testid={`timeline-audit-${log.id}`}
                      className="relative flex items-start gap-4 pb-6 cursor-pointer group"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className={`absolute left-[-17px] top-1.5 w-3 h-3 rounded-full border-2 border-background ${getTimelineDotColor(log.action)} shrink-0 z-10`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={getActionColor(log.action)} className="text-[10px]">{log.action}</Badge>
                          <span className="text-xs text-muted-foreground capitalize">{log.entity}</span>
                          {log.ipAddress && (
                            <span className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</span>
                          )}
                        </div>
                        <p className="text-sm break-words">{log.details || "\u2014"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString("en-GB", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          }) : "\u2014"}
                          {log.userId && (
                            <span className="ml-2 font-mono">{log.userId.substring(0, 8)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="font-semibold">{t('audit.noEntries')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters ? t('audit.noFilterResults') : t('audit.activityNote')}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Data Access Log</h3>
              </div>
              <Badge variant="secondary" className="text-xs">{accessLogs.length} records</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : accessLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[130px]">Timestamp</TableHead>
                        <TableHead className="w-[90px]">Action</TableHead>
                        <TableHead className="w-[80px]">Entity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[100px]">IP Address</TableHead>
                        <TableHead className="w-[90px]">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-access-${log.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString("en-GB", {
                              day: "2-digit", month: "short", year: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            }) : "\u2014"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionColor(log.action)} className="text-[10px]">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{log.entity}</TableCell>
                          <TableCell className="text-xs truncate">{log.details || "\u2014"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || "\u2014"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono truncate">
                            {log.userId ? log.userId.substring(0, 8) : "\u2014"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="font-semibold">No Access Records</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No VIEW or SEARCH actions have been recorded yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('audit.logDetail')}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getActionColor(selectedLog.action)} className="text-xs">{selectedLog.action}</Badge>
                <span className="text-xs text-muted-foreground capitalize">{selectedLog.entity}</span>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.timestamp')}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-timestamp">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    }) : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.details')}</p>
                  <p className="text-sm font-medium break-words" data-testid="text-detail-details">{selectedLog.details || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.entityId')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-entity-id">{selectedLog.entityId || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.ipAddress')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-ip">{selectedLog.ipAddress || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.userId')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-user-id">{selectedLog.userId || "\u2014"}</p>
                </div>
                {selectedLog.currentHash && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />{t('audit.hashChain')}</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all mt-0.5" data-testid="text-detail-hash">
                      {selectedLog.currentHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
