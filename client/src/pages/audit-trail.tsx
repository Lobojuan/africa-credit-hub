import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Shield, Search, ShieldCheck, ShieldAlert, RefreshCw, Hash } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function AuditTrailPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: integrity, isLoading: integrityLoading, refetch: refetchIntegrity } = useQuery<{ valid: boolean; totalChecked: number; brokenAt?: string }>({
    queryKey: ["/api/audit/verify-integrity"],
  });

  const filteredLogs = logs?.filter((log) => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity.toLowerCase().includes(search) ||
      (log.details && log.details.toLowerCase().includes(search))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-audit-title">{t('audit.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-filter-audit"
          placeholder={t('audit.filterPlaceholder')}
          className="pl-9"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('audit.timestamp')}</TableHead>
                    <TableHead>{t('audit.action')}</TableHead>
                    <TableHead>{t('audit.entity')}</TableHead>
                    <TableHead>{t('audit.details')}</TableHead>
                    <TableHead>{t('audit.ipAddress')}</TableHead>
                    <TableHead>{t('audit.userId')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-${log.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)} className="text-[10px]">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{log.entity}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{log.details || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.userId ? log.userId.substring(0, 8) + "..." : "—"}
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
                    }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.details')}</p>
                  <p className="text-sm font-medium break-words" data-testid="text-detail-details">{selectedLog.details || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.entityId')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-entity-id">{selectedLog.entityId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.ipAddress')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-ip">{selectedLog.ipAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('audit.userId')}</p>
                  <p className="text-sm font-mono" data-testid="text-detail-user-id">{selectedLog.userId || "—"}</p>
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
