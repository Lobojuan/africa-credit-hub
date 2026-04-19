import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Phone, Mail, MessageSquare, ClipboardList, Plus, Loader2, ArrowRight, AlertCircle, Settings, Clock, CheckCircle2, RefreshCw, ShieldAlert, Users, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Assignment {
  id: string;
  borrowerId: string;
  status: string;
  priority: string;
  amountOutstanding?: string;
  currency?: string;
  dueDate?: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

interface Attempt {
  id: string;
  channel: string;
  outcome: string;
  contactValue?: string;
  notes?: string;
  promisedAmount?: string;
  promisedDate?: string;
  attemptedAt: string;
}

interface SlaSettings {
  urgentThresholdDays: number;
  highThresholdDays: number;
  mediumThresholdDays: number;
  lowThresholdDays: number;
  enabled: boolean;
  country?: string;
  organizationId?: string | null;
}

interface BreachDetail {
  id: string;
  borrowerId: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  agentName: string | null;
  agentEmail: string | null;
  lastAttemptAt: string | null;
  daysSinceContact: number;
  amountOutstanding: string | null;
  currency: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  promised: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-gray-400",
};

export default function CollectionsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);

  const [newBorrowerId, setNewBorrowerId] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState("GHS");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [aChannel, setAChannel] = useState("phone");
  const [aOutcome, setAOutcome] = useState("contacted");
  const [aContact, setAContact] = useState("");
  const [aNotes, setANotes] = useState("");
  const [aPromisedAmount, setAPromisedAmount] = useState("");
  const [aPromisedDate, setAPromisedDate] = useState("");
  const [aSendNow, setASendNow] = useState(false);

  const [slaForm, setSlaForm] = useState<SlaSettings>({
    urgentThresholdDays: 3,
    highThresholdDays: 5,
    mediumThresholdDays: 7,
    lowThresholdDays: 14,
    enabled: true,
  });

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/collections/assignments", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/collections/assignments" : `/api/collections/assignments?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: attempts = [] } = useQuery<Attempt[]>({
    queryKey: ["/api/collections/assignments", selectedId, "attempts"],
    queryFn: async () => {
      if (!selectedId) return [];
      const res = await fetch(`/api/collections/assignments/${selectedId}/attempts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedId,
  });

  const { data: slaSettings } = useQuery<SlaSettings>({
    queryKey: ["/api/collections/sla-settings"],
    queryFn: async () => {
      const res = await fetch("/api/collections/sla-settings", { credentials: "include" });
      if (!res.ok) return { urgentThresholdDays: 3, highThresholdDays: 5, mediumThresholdDays: 7, lowThresholdDays: 14, enabled: true };
      return res.json();
    },
  });

  const [breachPriorityFilter, setBreachPriorityFilter] = useState<string>("all");

  const { data: breachData } = useQuery<{ breachIds: string[]; breaches: BreachDetail[] }>({
    queryKey: ["/api/collections/sla-breaches"],
    queryFn: async () => {
      const res = await fetch("/api/collections/sla-breaches", { credentials: "include" });
      if (!res.ok) return { breachIds: [], breaches: [] };
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });
  const breachSet = new Set(breachData?.breachIds ?? []);
  const allBreaches: BreachDetail[] = breachData?.breaches ?? [];
  const filteredBreaches = breachPriorityFilter === "all"
    ? allBreaches
    : allBreaches.filter(b => b.priority === breachPriorityFilter);

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/collections/assignments", {
        borrowerId: newBorrowerId,
        priority: newPriority,
        amountOutstanding: newAmount || undefined,
        currency: newCurrency,
        dueDate: newDueDate || undefined,
        notes: newNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Assignment created" });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/assignments"] });
      setCreateOpen(false);
      setNewBorrowerId(""); setNewAmount(""); setNewDueDate(""); setNewNotes("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const addAttempt = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("No assignment selected");
      const res = await apiRequest("POST", `/api/collections/assignments/${selectedId}/attempts`, {
        channel: aChannel,
        outcome: aOutcome,
        contactValue: aContact,
        notes: aNotes,
        promisedAmount: aPromisedAmount || undefined,
        promisedDate: aPromisedDate || undefined,
        sendNow: aSendNow,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Contact attempt logged" });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/assignments", selectedId, "attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/sla-breaches"] });
      setAttemptOpen(false);
      setAContact(""); setANotes(""); setAPromisedAmount(""); setAPromisedDate(""); setASendNow(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const saveSlaSettings = useMutation({
    mutationFn: async () => {
      const payload = { ...slaForm };
      if (!payload.country && slaSettings?.country) payload.country = slaSettings.country;
      const res = await apiRequest("PUT", "/api/collections/sla-settings", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "SLA settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/sla-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/sla-breaches"] });
      setSlaOpen(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const runSlaCheck = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/collections/sla-check", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "SLA check complete", description: `${data.breaches} breach(es) notified` });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/sla-breaches"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openSlaDialog = () => {
    if (slaSettings) setSlaForm({ ...slaSettings });
    setSlaOpen(true);
  };

  const breachCount = breachSet.size;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage delinquent-account follow-up: assignments, contact attempts, and promises-to-pay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {breachCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium" data-testid="sla-breach-banner">
                    <Clock className="w-3.5 h-3.5" />
                    {breachCount} SLA breach{breachCount > 1 ? "es" : ""}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cases that have not been contacted within the configured SLA threshold</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" size="sm" onClick={openSlaDialog} data-testid="button-sla-settings">
            <Settings className="w-4 h-4 mr-2" />SLA Settings
          </Button>
          <Button onClick={() => setCreateOpen(true)} data-testid="button-new-collection">
            <Plus className="w-4 h-4 mr-2" />New Assignment
          </Button>
        </div>
      </div>

      {allBreaches.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5" data-testid="sla-breach-dashboard">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  SLA Breach Dashboard — {allBreaches.length} overdue case{allBreaches.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Filter by priority:</span>
                <div className="flex gap-1" data-testid="breach-priority-filter">
                  {["all", "urgent", "high", "medium", "low"].map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant={breachPriorityFilter === p ? "default" : "outline"}
                      className="h-6 text-[10px] px-2 capitalize"
                      onClick={() => setBreachPriorityFilter(p)}
                      data-testid={`filter-breach-${p}`}
                    >
                      {p === "all" ? "All" : p}
                      {p !== "all" && (
                        <span className="ml-1 opacity-70">({allBreaches.filter(b => b.priority === p).length})</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Priority</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" />Agent</div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />Days Since Contact</div>
                  </TableHead>
                  <TableHead className="text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBreaches.map(b => (
                  <TableRow key={b.id} data-testid={`row-breach-${b.id}`} className="hover:bg-destructive/5">
                    <TableCell className="pl-4">
                      <Badge
                        variant={b.priority === "urgent" ? "destructive" : b.priority === "high" ? "default" : "outline"}
                        className="text-[10px] capitalize"
                        data-testid={`badge-priority-${b.id}`}
                      >
                        {b.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/borrowers/${b.borrowerId}`}>
                        <span className="text-xs font-mono text-primary hover:underline" data-testid={`link-borrower-${b.id}`}>
                          {b.borrowerId.slice(0, 12)}…
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {b.agentName ? (
                        <span className="text-xs" data-testid={`text-agent-${b.id}`}>{b.agentName}</span>
                      ) : b.agentEmail ? (
                        <span className="text-xs text-muted-foreground" data-testid={`text-agent-${b.id}`}>{b.agentEmail}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${b.daysSinceContact >= 7 ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}
                        data-testid={`text-days-${b.id}`}
                      >
                        {b.daysSinceContact === 0 ? "Today" : `${b.daysSinceContact}d`}
                      </span>
                      {b.lastAttemptAt && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (last: {new Date(b.lastAttemptAt).toLocaleDateString("en-GB")})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedId(b.id); setAttemptOpen(true); }}
                        data-testid={`button-breach-attempt-${b.id}`}
                      >
                        <Phone className="w-3 h-3 mr-1" />Log Attempt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBreaches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                      No breaches at this priority level.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="promised">Promised</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
              ) : assignments.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No collection assignments yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => {
                      const isBreach = breachSet.has(a.id);
                      return (
                        <TableRow key={a.id} data-testid={`row-assignment-${a.id}`} className={isBreach ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[a.status] || "bg-muted"}`} />
                              <span className="text-xs capitalize">{a.status.replace(/_/g, " ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={a.priority === "urgent" ? "destructive" : a.priority === "high" ? "default" : "outline"} className="text-[10px] capitalize">{a.priority}</Badge>
                              {isBreach && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Clock className="w-3.5 h-3.5 text-destructive" data-testid={`icon-sla-breach-${a.id}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>SLA breach: no contact within the configured threshold for {a.priority} priority</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/borrowers/${a.borrowerId}`}>
                              <span className="text-xs font-mono text-primary hover:underline">{a.borrowerId.slice(0, 12)}…</span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs">
                            {a.amountOutstanding ? `${a.currency || ""} ${parseFloat(a.amountOutstanding).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{a.dueDate || "—"}</TableCell>
                          <TableCell className="text-xs">{new Date(a.createdAt).toLocaleDateString("en-GB")}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedId(a.id); setAttemptOpen(true); }} data-testid={`button-attempt-${a.id}`}>
                              <Phone className="w-3 h-3 mr-1" /> Log Attempt
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

      {selectedId && attempts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Contact Attempts</h3>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Promise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map(at => (
                  <TableRow key={at.id} data-testid={`row-attempt-${at.id}`}>
                    <TableCell className="text-xs">{new Date(at.attemptedAt).toLocaleString("en-GB")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{at.channel}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{at.outcome.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="text-xs">{at.notes || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {at.promisedAmount ? `${parseFloat(at.promisedAmount).toLocaleString()} by ${at.promisedDate || "—"}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* SLA Settings Dialog */}
      <Dialog open={slaOpen} onOpenChange={setSlaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              SLA Contact Thresholds
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Agents will be alerted when a case has not had a contact attempt within the configured number of days.
          </p>
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Enable SLA Alerts</Label>
              <Switch
                checked={slaForm.enabled}
                onCheckedChange={v => setSlaForm(s => ({ ...s, enabled: v }))}
                data-testid="switch-sla-enabled"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-destructive font-medium">Urgent (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={slaForm.urgentThresholdDays}
                  onChange={e => setSlaForm(s => ({ ...s, urgentThresholdDays: Number(e.target.value) }))}
                  data-testid="input-sla-urgent"
                  disabled={!slaForm.enabled}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">High (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={slaForm.highThresholdDays}
                  onChange={e => setSlaForm(s => ({ ...s, highThresholdDays: Number(e.target.value) }))}
                  data-testid="input-sla-high"
                  disabled={!slaForm.enabled}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Medium (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={slaForm.mediumThresholdDays}
                  onChange={e => setSlaForm(s => ({ ...s, mediumThresholdDays: Number(e.target.value) }))}
                  data-testid="input-sla-medium"
                  disabled={!slaForm.enabled}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Low (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={slaForm.lowThresholdDays}
                  onChange={e => setSlaForm(s => ({ ...s, lowThresholdDays: Number(e.target.value) }))}
                  data-testid="input-sla-low"
                  disabled={!slaForm.enabled}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSlaCheck.mutate()}
              disabled={runSlaCheck.isPending}
              data-testid="button-run-sla-check"
            >
              {runSlaCheck.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Run Check Now
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSlaOpen(false)}>Cancel</Button>
              <Button onClick={() => saveSlaSettings.mutate()} disabled={saveSlaSettings.isPending} data-testid="button-save-sla">
                {saveSlaSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Collection Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Borrower ID</Label>
              <Input value={newBorrowerId} onChange={e => setNewBorrowerId(e.target.value)} placeholder="UUID" data-testid="input-borrower-id" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Input value={newCurrency} onChange={e => setNewCurrency(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount Outstanding</Label>
                <Input value={newAmount} onChange={e => setNewAmount(e.target.value)} type="number" />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input value={newDueDate} onChange={e => setNewDueDate(e.target.value)} type="date" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!newBorrowerId || create.isPending} data-testid="button-create-assignment">
              {create.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={attemptOpen} onOpenChange={setAttemptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Contact Attempt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={aChannel} onValueChange={setAChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visit">In-person Visit</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="note">Note Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Outcome</Label>
                <Select value={aOutcome} onValueChange={setAOutcome}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="wrong_number">Wrong Number</SelectItem>
                    <SelectItem value="left_message">Left Message</SelectItem>
                    <SelectItem value="callback_requested">Callback Requested</SelectItem>
                    <SelectItem value="promise_to_pay">Promise to Pay</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                    <SelectItem value="note">Note Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Contact Value (phone/email)</Label>
              <Input value={aContact} onChange={e => setAContact(e.target.value)} placeholder="+233..." />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={aNotes} onChange={e => setANotes(e.target.value)} rows={2} />
            </div>
            {aOutcome === "promise_to_pay" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Promised Amount</Label>
                  <Input value={aPromisedAmount} onChange={e => setAPromisedAmount(e.target.value)} type="number" />
                </div>
                <div>
                  <Label className="text-xs">Promised Date</Label>
                  <Input value={aPromisedDate} onChange={e => setAPromisedDate(e.target.value)} type="date" />
                </div>
              </div>
            )}
            {(aChannel === "sms" || aChannel === "email") && (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={aSendNow} onChange={e => setASendNow(e.target.checked)} />
                Send {aChannel === "sms" ? <MessageSquare className="w-3 h-3 inline" /> : <Mail className="w-3 h-3 inline" />} now to contact value
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttemptOpen(false)}>Cancel</Button>
            <Button onClick={() => addAttempt.mutate()} disabled={addAttempt.isPending} data-testid="button-save-attempt">
              {addAttempt.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Attempt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
