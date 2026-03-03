import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Shield, Search, ShieldCheck, ShieldAlert, RefreshCw, Hash, List, Clock, Download, FileSpreadsheet, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import type { AuditLog } from "@shared/schema";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: integrity, isLoading: integrityLoading, refetch: refetchIntegrity } = useQuery<{ valid: boolean; totalChecked: number; brokenAt?: string }>({
    queryKey: ["/api/audit/verify-integrity"],
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      if (filter) {
        const search = filter.toLowerCase();
        const matchesSearch =
          log.action.toLowerCase().includes(search) ||
          log.entity.toLowerCase().includes(search) ||
          (log.details && log.details.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

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
  }, [logs, filter, dateFrom, dateTo]);

  const handleExport = (format: "csv" | "xlsx") => {
    window.open(`/api/reports/export?format=${format}&type=audit`, "_blank");
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                integrity.valid
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
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
            data-testid="button-verify-integrity"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            {t("audit.verify")}
          </Button>
        </div>
      </div>

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

        <div className="flex items-end gap-2 flex-wrap">
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

          <Separator orientation="vertical" className="h-6 mx-1" />

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
                  {filter ? t('audit.noFilterResults') : t('audit.activityNote')}
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
                {filter || dateFrom || dateTo ? t('audit.noFilterResults') : t('audit.activityNote')}
              </p>
            </div>
          )}
        </div>
      )}

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
