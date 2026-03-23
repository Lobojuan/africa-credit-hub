import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Webhook, Plus, RefreshCw, Trash2, Send, CheckCircle2,
  XCircle, Clock, Eye, Activity, Shield, Check,
} from "lucide-react";

const EVENTS = [
  "borrower.created", "borrower.updated", "credit_account.created",
  "credit_report.generated", "dispute.filed", "dispute.resolved",
  "score.computed", "payment.recorded", "alert.triggered", "batch.completed",
];

export default function WebhookManagementPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });

  const { data: webhooks = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/webhooks"],
  });

  const { data: deliveryHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/webhooks", historyId, "deliveries"],
    enabled: !!historyId,
    queryFn: () => apiRequest("GET", `/api/webhooks/${historyId}/deliveries`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/webhooks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setCreateOpen(false);
      setForm({ name: "", url: "", events: [] });
      toast({ title: "Webhook created", description: "Endpoint registered successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Deleted", description: "Webhook endpoint removed" });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/webhooks/${id}/test`),
    onSuccess: () => toast({ title: "Test sent", description: "Test webhook delivered" }),
    onError: () => toast({ title: "Test failed", description: "Could not deliver test webhook", variant: "destructive" }),
  });

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="webhooks-loading">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="webhook-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Webhook Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure event-driven integrations with HMAC-signed delivery</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-webhooks">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-webhook">
                <Plus className="w-4 h-4 mr-2" />
                Add Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook Endpoint</DialogTitle>
                <DialogDescription className="sr-only">Dialog form content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g. Production Notifications"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    data-testid="input-webhook-name"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Endpoint URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-server.com/webhooks"
                    value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    data-testid="input-webhook-url"
                  />
                </div>
                <div>
                  <Label>Events to subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {EVENTS.map(event => (
                      <button
                        key={event}
                        type="button"
                        className={`flex items-center gap-2 p-1.5 rounded text-left transition-colors ${
                          form.events.includes(event)
                            ? "bg-primary/10 border border-primary/30"
                            : "border border-transparent hover:bg-muted"
                        }`}
                        onClick={() => toggleEvent(event)}
                        data-testid={`checkbox-event-${event}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          form.events.includes(event) ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {form.events.includes(event) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-mono">{event}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.url || !form.name || createMutation.isPending}
                  data-testid="button-submit-webhook"
                >
                  {createMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Endpoint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Endpoints</p>
                <p className="text-2xl font-bold mt-1">{webhooks.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold mt-1">{webhooks.filter((w: any) => w.status === "active").length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Signed Delivery</p>
                <p className="text-2xl font-bold mt-1">HMAC-SHA256</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-webhook-endpoints">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Registered Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No webhook endpoints configured</p>
              <p className="text-xs mt-1">Add an endpoint to receive real-time event notifications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh: any) => (
                  <TableRow key={wh.id} data-testid={`row-webhook-${wh.id}`}>
                    <TableCell className="font-medium text-sm">{wh.name || "Unnamed"}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] block">{wh.url}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(wh.events || []).slice(0, 3).map((e: string) => (
                          <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                        ))}
                        {(wh.events || []).length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">+{wh.events.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wh.status === "active" ? "default" : "destructive"} className="text-xs">
                        {wh.status === "active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {wh.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {wh.lastDeliveryAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(wh.lastDeliveryAt).toLocaleString()}
                        </div>
                      ) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => testMutation.mutate(wh.id)}
                          disabled={testMutation.isPending}
                          data-testid={`button-test-webhook-${wh.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setHistoryId(historyId === wh.id ? null : wh.id)}
                          data-testid={`button-history-webhook-${wh.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => deleteMutation.mutate(wh.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-webhook-${wh.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {historyId && (
        <Card data-testid="card-delivery-history">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Delivery History — Endpoint #{historyId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No delivery attempts recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryHistory.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{d.event}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.responseStatus >= 200 && d.responseStatus < 300 ? "default" : "destructive"} className="text-xs">
                          {d.responseStatus || "Timeout"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {d.responseBody || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{d.attemptNumber ? `Attempt ${d.attemptNumber}` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(d.deliveredAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
