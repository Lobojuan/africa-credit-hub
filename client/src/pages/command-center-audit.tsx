import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Filter, Clock, User, Shield, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  LOGIN: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  LOGOUT: "bg-muted-foreground/20 text-muted-foreground border-border",
  REVOKE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  VIEW: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  EXPORT: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getActionColor(action: string) {
  return ACTION_COLORS[action] || "bg-muted-foreground/20 text-muted-foreground border-border";
}

export function CommandCenterAuditTab() {
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const pageSize = 50;

  const { data, isLoading } = useQuery<{
    logs: any[];
    total: number;
    actionCounts: { action: string; count: number }[];
    entityCounts: { entity: string; count: number }[];
  }>({
    queryKey: ["/api/platform/audit-logs", page, filterAction, filterEntity],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) });
      if (filterAction !== "all") params.set("action", filterAction);
      if (filterEntity !== "all") params.set("entity", filterEntity);
      const res = await fetch(`/api/platform/audit-logs?${params}`, { credentials: "include" });
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-4" data-testid="panel-audit-logs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-white" data-testid="text-audit-total">{data?.total ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Total Events</p>
        </div>
        {(data?.actionCounts || []).slice(0, 3).map(a => (
          <div key={a.action} className="rounded-xl border border-border bg-white/5 p-3 text-center">
            <p className="text-2xl font-bold text-white">{a.count}</p>
            <p className="text-[10px] text-muted-foreground">{a.action} Events</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-muted border-border text-white" data-testid="select-audit-action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-muted-foreground text-xs">All Actions</SelectItem>
              {(data?.actionCounts || []).map(a => (
                <SelectItem key={a.action} value={a.action} className="text-muted-foreground text-xs">{a.action} ({a.count})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(0); }}>
          <SelectTrigger className="h-8 w-[140px] text-xs bg-muted border-border text-white" data-testid="select-audit-entity">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-muted-foreground text-xs">All Entities</SelectItem>
            {(data?.entityCounts || []).map(e => (
              <SelectItem key={e.entity} value={e.entity} className="text-muted-foreground text-xs">{e.entity} ({e.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data?.total || 0)} of {data?.total || 0}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-white/[0.03] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border px-3 py-2">
          <span className="w-[70px]">Action</span>
          <span>Details</span>
          <span className="w-[100px]">User</span>
          <span className="w-[90px]">IP</span>
          <span className="w-[130px] text-right">Timestamp</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading audit trail...</div>
        ) : (data?.logs || []).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No audit events found</div>
        ) : (
          (data?.logs || []).map((log: any) => (
            <div key={log.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center border-b border-border/20 px-3 py-2 hover:bg-white/10 transition-colors" data-testid={`audit-row-${log.id}`}>
              <span className="w-[70px]">
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getActionColor(log.action)}`}>{log.action}</Badge>
              </span>
              <span className="text-xs text-white truncate pr-2">
                <span className="text-muted-foreground mr-1">[{log.entity}]</span>
                {log.details || `${log.action} on ${log.entity}`}
              </span>
              <span className="w-[100px] text-[10px] text-muted-foreground truncate">{log.userName}</span>
              <span className="w-[90px] text-[10px] text-muted-foreground font-mono">{log.ipAddress || "—"}</span>
              <span className="w-[130px] text-[10px] text-muted-foreground text-right">
                {log.createdAt ? new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs border-border text-muted-foreground" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} data-testid="button-audit-prev">
            <ChevronLeft className="w-3 h-3" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs border-border text-muted-foreground" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} data-testid="button-audit-next">
            Next <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">By Action Type</p>
          <div className="space-y-1.5">
            {(data?.actionCounts || []).sort((a, b) => b.count - a.count).map(a => {
              const maxCount = Math.max(...(data?.actionCounts || []).map(x => x.count));
              return (
                <div key={a.action} className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 w-[60px] justify-center ${getActionColor(a.action)}`}>{a.action}</Badge>
                  <div className="flex-1 bg-muted-foreground/30 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-cyan-500/60 rounded-full transition-all" style={{ width: `${(a.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-[40px] text-right">{a.count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white/5 p-3">
          <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">By Entity Type</p>
          <div className="space-y-1.5">
            {(data?.entityCounts || []).sort((a, b) => b.count - a.count).slice(0, 10).map(e => {
              const maxCount = Math.max(...(data?.entityCounts || []).map(x => x.count));
              return (
                <div key={e.entity} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-[80px] truncate">{e.entity}</span>
                  <div className="flex-1 bg-muted-foreground/30 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full transition-all" style={{ width: `${(e.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-[40px] text-right">{e.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
