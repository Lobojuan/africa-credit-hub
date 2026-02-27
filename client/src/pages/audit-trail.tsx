import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Shield, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
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
      <div>
        <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-audit-title">{t('audit.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('audit.subtitle')}</p>
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
                    <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
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
    </div>
  );
}
