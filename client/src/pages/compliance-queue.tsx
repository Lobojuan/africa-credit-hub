import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShieldAlert, ShieldX, AlertTriangle, ChevronRight, Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type QueueResponse = {
  watchlistHits: any[];
  fraudAlerts: any[];
  borrowers: Record<string, { id: string; displayName: string; type: string; country: string }>;
  totals: { hits: number; alerts: number };
};

function severityColor(s: string) {
  return s === "critical" ? "destructive" : s === "high" ? "destructive" : s === "medium" ? "default" : "secondary";
}

export default function ComplianceQueuePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [resolveTarget, setResolveTarget] = useState<{ kind: "hit" | "alert"; id: string; title: string } | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>("resolved");
  const [resolveNotes, setResolveNotes] = useState<string>("");

  const { data, isLoading } = useQuery<QueueResponse>({ queryKey: ["/api/compliance/queue"] });

  const { data: meData } = useQuery<{ id: string }>({ queryKey: ["/api/auth/me"] });

  const assignMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!meData?.id) throw new Error("Not authenticated");
      const res = await apiRequest("POST", `/api/compliance/fraud-alerts/${id}/assign`, { assigneeUserId: meData.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/queue"] });
      toast({ title: "Alert assigned to you" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ kind, id, status, notes }: { kind: "hit" | "alert"; id: string; status: string; notes: string }) => {
      const url = kind === "hit" ? `/api/compliance/watchlist-hits/${id}/resolve` : `/api/compliance/fraud-alerts/${id}/resolve`;
      const res = await apiRequest("POST", url, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/queue"] });
      setResolveTarget(null);
      setResolveNotes("");
      toast({ title: "Resolved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredHits = (data?.watchlistHits || []).filter((h: any) => {
    if (!search) return true;
    const b = data?.borrowers[h.borrowerId];
    return (b?.displayName || "").toLowerCase().includes(search.toLowerCase()) || h.matchedName?.toLowerCase().includes(search.toLowerCase());
  });
  const filteredAlerts = (data?.fraudAlerts || []).filter((a: any) => {
    if (!search) return true;
    const b = data?.borrowers[a.borrowerId];
    return (b?.displayName || "").toLowerCase().includes(search.toLowerCase()) || a.ruleCode?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-compliance-title">Compliance Review Queue</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Watchlist hits and fraud alerts requiring review</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="text-sm" data-testid="badge-total-hits">{data?.totals.hits || 0} watchlist</Badge>
          <Badge variant="default" className="text-sm" data-testid="badge-total-alerts">{data?.totals.alerts || 0} fraud alerts</Badge>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by borrower or rule..." className="pl-9" data-testid="input-search-queue" />
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" data-testid="tab-fraud-alerts">Fraud Alerts ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="hits" data-testid="tab-watchlist-hits">Watchlist Hits ({filteredHits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : filteredAlerts.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />No open fraud alerts.</CardContent></Card>
          ) : (
            filteredAlerts.map((a: any) => {
              const b = data?.borrowers[a.borrowerId];
              return (
                <Card key={a.id} className="hover:bg-muted/30 transition" data-testid={`card-fraud-alert-${a.id}`}>
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={severityColor(a.severity) as any} className="text-[10px]">{a.severity?.toUpperCase()}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{a.ruleCode}</span>
                      </div>
                      <p className="text-sm font-medium">{a.ruleDescription}</p>
                      {b && (
                        <button onClick={() => navigate(`/borrowers/${b.id}`)} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1" data-testid={`link-borrower-${b.id}`}>
                          {b.displayName} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      {a.evidence && <p className="mt-1 text-[11px] text-muted-foreground font-mono break-all">{a.evidence.slice(0, 200)}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{a.createdAt && new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setResolveTarget({ kind: "alert", id: a.id, title: a.ruleDescription }); setResolveStatus("resolved"); }} data-testid={`button-resolve-alert-${a.id}`}>
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => assignMutation.mutate({ id: a.id })}
                        disabled={assignMutation.isPending}
                        data-testid={`button-assign-alert-${a.id}`}
                      >
                        {a.assignedTo ? "Reassign to me" : "Assign to me"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="hits" className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : filteredHits.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />No open watchlist hits.</CardContent></Card>
          ) : (
            filteredHits.map((h: any) => {
              const b = data?.borrowers[h.borrowerId];
              return (
                <Card key={h.id} className="hover:bg-muted/30 transition" data-testid={`card-watchlist-hit-${h.id}`}>
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={h.source.startsWith("sanctions") ? "destructive" : "default"} className="text-[10px]">{h.source?.toUpperCase().replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">match: {h.matchScore}%</span>
                      </div>
                      <p className="text-sm font-medium">Matched: {h.matchedName}</p>
                      {b && (
                        <button onClick={() => navigate(`/borrowers/${b.id}`)} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1" data-testid={`link-borrower-${b.id}`}>
                          {b.displayName} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">via {h.provider} · {h.createdAt && new Date(h.createdAt).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setResolveTarget({ kind: "hit", id: h.id, title: h.matchedName }); setResolveStatus("resolved"); }} data-testid={`button-resolve-hit-${h.id}`}>
                      Review
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve {resolveTarget?.kind === "hit" ? "Watchlist Hit" : "Fraud Alert"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">{resolveTarget?.title}</p>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={resolveStatus} onValueChange={setResolveStatus}>
                <SelectTrigger data-testid="select-resolve-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved (confirmed legitimate concern actioned)</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                  <SelectItem value="investigating">Under Investigation</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Notes</label>
              <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} rows={3} placeholder="Review notes (visible in audit trail)..." data-testid="input-resolve-notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)} data-testid="button-cancel-resolve">Cancel</Button>
              <Button
                onClick={() => resolveTarget && resolveMutation.mutate({ kind: resolveTarget.kind, id: resolveTarget.id, status: resolveStatus, notes: resolveNotes })}
                disabled={resolveMutation.isPending}
                data-testid="button-confirm-resolve"
              >
                {resolveMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
