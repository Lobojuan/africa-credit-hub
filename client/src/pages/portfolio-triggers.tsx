import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  BellRing,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Info,
  Eye,
  TrendingDown,
  TrendingUp,
  Activity,
  Search,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  score_drop: { label: "Score Drop", color: "destructive", icon: TrendingDown },
  new_inquiry: { label: "New Inquiry", color: "secondary", icon: Eye },
  delinquency: { label: "Delinquency", color: "destructive", icon: AlertTriangle },
  new_judgment: { label: "New Judgment", color: "destructive", icon: AlertTriangle },
  payment_default: { label: "Payment Default", color: "destructive", icon: TrendingDown },
  credit_limit_change: { label: "Credit Limit Change", color: "secondary", icon: Activity },
  account_opened: { label: "Account Opened", color: "default", icon: TrendingUp },
  account_closed: { label: "Account Closed", color: "secondary", icon: Activity },
};

function TriggerEventBadge({ eventType }: { eventType: string }) {
  const meta = EVENT_TYPE_LABELS[eventType] || { label: eventType, color: "secondary", icon: Info };
  return (
    <Badge variant={meta.color as any} className="flex items-center gap-1 w-fit">
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export default function PortfolioTriggersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [borrowerResults, setBorrowerResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState({
    onScoreDrop: true,
    onNewInquiry: true,
    onDelinquency: true,
    onJudgment: true,
    onDefault: true,
    onAccountChange: false,
    scoreDelta: 20,
    emailAlerts: true,
    inAppAlerts: true,
  });

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/portfolio-triggers"],
  });

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<any[]>({
    queryKey: ["/api/portfolio-trigger-events"],
  });

  const unackCount = events.filter((e: any) => !e.acknowledged).length;

  const deleteSub = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/portfolio-triggers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio-triggers"] });
      toast({ title: "Unsubscribed", description: "Borrower removed from watchlist." });
    },
  });

  const acknowledgeEvent = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/portfolio-trigger-events/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio-trigger-events"] });
    },
  });

  const addSub = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/portfolio-triggers", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio-triggers"] });
      setAddOpen(false);
      setSelectedBorrower(null);
      setBorrowerSearch("");
      setBorrowerResults([]);
      toast({ title: "Watching borrower", description: "You will be alerted when trigger events occur." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Could not add subscription.", variant: "destructive" });
    },
  });

  async function searchBorrowers(q: string) {
    if (!q || q.length < 2) { setBorrowerResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/borrowers?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setBorrowerResults(Array.isArray(data) ? data : data.borrowers || []);
    } finally { setSearchLoading(false); }
  }

  function handleSubmitSub() {
    if (!selectedBorrower) {
      toast({ title: "Select a borrower first", variant: "destructive" });
      return;
    }
    addSub.mutate({
      borrowerId: selectedBorrower.id,
      alertConfig,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-7 w-7 text-primary" />
            Portfolio Trigger Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time alerts when borrowers in your portfolio experience credit events — score drops, new inquiries, delinquencies, judgments.
          </p>
        </div>
        <Button data-testid="btn-add-trigger" onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Watch Borrower
        </Button>
      </div>

      {unackCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-800 dark:text-orange-300">
              {unackCount} unacknowledged trigger event{unackCount > 1 ? "s" : ""} require your attention.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => {}} className="text-orange-700 border-orange-300">
            View All
          </Button>
        </div>
      )}

      <Tabs defaultValue="events">
        <TabsList data-testid="triggers-tabs">
          <TabsTrigger value="events" data-testid="tab-trigger-events">
            Trigger Events
            {unackCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unackCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="watchlist" data-testid="tab-watchlist">
            Watchlist ({subscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">Recent Trigger Events</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchEvents()} data-testid="btn-refresh-events">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BellRing className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">No trigger events yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Add borrowers to your watchlist to start receiving alerts.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Triggered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev: any) => (
                      <TableRow
                        key={ev.id}
                        data-testid={`row-trigger-event-${ev.id}`}
                        className={ev.acknowledged ? "opacity-60" : ""}
                      >
                        <TableCell className="font-medium">
                          {ev.borrower
                            ? `${ev.borrower.firstName || ""} ${ev.borrower.lastName || ev.borrower.companyName || ""}`.trim()
                            : ev.borrowerId}
                        </TableCell>
                        <TableCell>
                          <TriggerEventBadge eventType={ev.eventType} />
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                          {ev.eventSummary || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ev.triggeredAt
                            ? formatDistanceToNow(new Date(ev.triggeredAt), { addSuffix: true })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {ev.acknowledged ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-orange-600">
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!ev.acknowledged && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`btn-ack-event-${ev.id}`}
                              onClick={() => acknowledgeEvent.mutate(ev.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {ev.borrower && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`btn-view-borrower-${ev.id}`}
                              onClick={() => setLocation(`/borrowers/${ev.borrowerId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="mt-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Monitored Borrowers</CardTitle>
              <CardDescription>
                Your organisation will receive alerts when any of these borrowers experience trigger events.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {subsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">Watchlist is empty</p>
                  <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                    Add borrowers to start monitoring their credit events.
                  </p>
                  <Button variant="outline" onClick={() => setAddOpen(true)} data-testid="btn-add-first-trigger">
                    <Plus className="h-4 w-4 mr-2" />
                    Watch Your First Borrower
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Watching Since</TableHead>
                      <TableHead>Score Δ Threshold</TableHead>
                      <TableHead>Alert Channels</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub: any) => {
                      const cfg = sub.alertConfig || {};
                      return (
                        <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                          <TableCell className="font-medium">
                            <button
                              className="hover:underline text-left"
                              onClick={() => setLocation(`/borrowers/${sub.borrowerId}`)}
                              data-testid={`link-sub-borrower-${sub.id}`}
                            >
                              {sub.borrower
                                ? `${sub.borrower.firstName || ""} ${sub.borrower.lastName || sub.borrower.companyName || ""}`.trim()
                                : sub.borrowerId}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground font-mono">
                            {sub.borrower?.nationalId || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.createdAt ? format(new Date(sub.createdAt), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {cfg.scoreDelta ? `≥ ${cfg.scoreDelta} pts` : "Any drop"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {cfg.emailAlerts && <Badge variant="outline" className="text-xs">Email</Badge>}
                              {cfg.inAppAlerts && <Badge variant="outline" className="text-xs">In-App</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              data-testid={`btn-remove-sub-${sub.id}`}
                              onClick={() => deleteSub.mutate(sub.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-add-trigger">
          <DialogHeader>
            <DialogTitle>Watch a Borrower</DialogTitle>
            <DialogDescription>
              Search for a borrower and configure which credit events should trigger alerts for your portfolio team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="borrower-search-input">Search Borrower</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="borrower-search-input"
                  data-testid="input-borrower-search"
                  placeholder="Name, ID number, company..."
                  className="pl-9"
                  value={borrowerSearch}
                  onChange={(e) => {
                    setBorrowerSearch(e.target.value);
                    searchBorrowers(e.target.value);
                  }}
                />
              </div>
              {searchLoading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching...
                </div>
              )}
              {borrowerResults.length > 0 && !selectedBorrower && (
                <div className="border rounded-md mt-1 divide-y max-h-48 overflow-y-auto">
                  {borrowerResults.map((b: any) => (
                    <button
                      key={b.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      data-testid={`option-borrower-${b.id}`}
                      onClick={() => {
                        setSelectedBorrower(b);
                        setBorrowerSearch(`${b.firstName || ""} ${b.lastName || b.companyName || ""}`.trim());
                        setBorrowerResults([]);
                      }}
                    >
                      <div className="font-medium">
                        {b.firstName || ""} {b.lastName || b.companyName || ""}
                      </div>
                      <div className="text-muted-foreground font-mono text-xs">{b.nationalId}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedBorrower && (
                <div className="mt-2 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md p-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {selectedBorrower.firstName} {selectedBorrower.lastName || selectedBorrower.companyName} — {selectedBorrower.nationalId}
                  </span>
                  <button
                    className="ml-auto text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => { setSelectedBorrower(null); setBorrowerSearch(""); }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Alert Triggers</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "onScoreDrop", label: "Score Drop" },
                  { key: "onNewInquiry", label: "New Inquiry" },
                  { key: "onDelinquency", label: "Delinquency" },
                  { key: "onJudgment", label: "New Judgment" },
                  { key: "onDefault", label: "Payment Default" },
                  { key: "onAccountChange", label: "Account Changes" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between border rounded p-2">
                    <span className="text-sm">{label}</span>
                    <Switch
                      data-testid={`switch-${key}`}
                      checked={(alertConfig as any)[key]}
                      onCheckedChange={(v) => setAlertConfig(prev => ({ ...prev, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="score-delta-input">Score Drop Threshold (pts)</Label>
                <Input
                  id="score-delta-input"
                  data-testid="input-score-delta"
                  type="number"
                  min={5}
                  max={200}
                  value={alertConfig.scoreDelta}
                  onChange={(e) => setAlertConfig(prev => ({ ...prev, scoreDelta: parseInt(e.target.value) || 20 }))}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2 pt-1">
                <Label>Delivery Channels</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    data-testid="switch-email-alerts"
                    checked={alertConfig.emailAlerts}
                    onCheckedChange={(v) => setAlertConfig(prev => ({ ...prev, emailAlerts: v }))}
                  />
                  <span className="text-sm">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    data-testid="switch-inapp-alerts"
                    checked={alertConfig.inAppAlerts}
                    onCheckedChange={(v) => setAlertConfig(prev => ({ ...prev, inAppAlerts: v }))}
                  />
                  <span className="text-sm">In-App</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              data-testid="btn-confirm-add-trigger"
              onClick={handleSubmitSub}
              disabled={!selectedBorrower || addSub.isPending}
            >
              {addSub.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start Watching
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
