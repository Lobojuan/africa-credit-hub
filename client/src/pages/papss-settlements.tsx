import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ArrowRightLeft, DollarSign, CheckCircle2, XCircle, Clock,
  Loader2, Building2, Globe, TrendingUp, Ban, RefreshCw,
} from "lucide-react";
import type { PapssSettlement } from "@shared/schema";

const SUPPORTED_COUNTRIES = [
  "Ghana", "Sierra Leone", "Nigeria", "Kenya", "Rwanda",
  "Tanzania", "Uganda", "Ethiopia", "South Africa", "Liberia",
];

const CURRENCIES: Record<string, string> = {
  Ghana: "GHS", "Sierra Leone": "SLE", Nigeria: "NGN", Kenya: "KES",
  Rwanda: "RWF", Tanzania: "TZS", Uganda: "UGX", Ethiopia: "ETB",
  "South Africa": "ZAR", Liberia: "LRD",
};

function settlementStatusBadge(status: string) {
  const map: Record<string, { color: string; icon: any }> = {
    pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Clock },
    completed: { color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
    failed: { color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
    reversed: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Ban },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <Badge variant="secondary" className={`${s.color} text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function PapssSettlementsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedSettlement, setSelectedSettlement] = useState<PapssSettlement | null>(null);
  const [form, setForm] = useState({
    senderInstitution: "", senderCountry: "", receiverInstitution: "", receiverCountry: "",
    senderAmount: "", senderCurrency: "", receiverAmount: "", receiverCurrency: "",
    exchangeRate: "", exchangeRateSource: "PAPSS", iso20022Reference: "",
    messageType: "pacs.008", purpose: "",
  });

  const { data: settlements = [], isLoading } = useQuery<PapssSettlement[]>({
    queryKey: ["/api/papss/settlements"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/papss/settlements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papss/settlements"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Settlement created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/papss/settlements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papss/settlements"] });
      setSelectedSettlement(null);
      toast({ title: "Settlement updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => setForm({
    senderInstitution: "", senderCountry: "", receiverInstitution: "", receiverCountry: "",
    senderAmount: "", senderCurrency: "", receiverAmount: "", receiverCurrency: "",
    exchangeRate: "", exchangeRateSource: "PAPSS", iso20022Reference: "",
    messageType: "pacs.008", purpose: "",
  });

  const handleCreate = () => {
    if (!form.senderInstitution || !form.senderCountry || !form.receiverInstitution || !form.receiverCountry || !form.senderAmount || !form.receiverAmount || !form.exchangeRate || !form.iso20022Reference) {
      toast({ title: "Validation Error", description: "All required fields must be filled", variant: "destructive" });
      return;
    }
    const currency1 = form.senderCurrency || CURRENCIES[form.senderCountry] || "USD";
    const currency2 = form.receiverCurrency || CURRENCIES[form.receiverCountry] || "USD";
    createMutation.mutate({ ...form, senderCurrency: currency1, receiverCurrency: currency2 });
  };

  const filtered = settlements.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (countryFilter !== "all" && s.senderCountry !== countryFilter && s.receiverCountry !== countryFilter) return false;
    return true;
  });

  const completedTotal = settlements.filter(s => s.status === "completed").reduce((a, s) => a + parseFloat(s.senderAmount || "0"), 0);
  const pendingCount = settlements.filter(s => s.status === "pending").length;
  const completedCount = settlements.filter(s => s.status === "completed").length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" data-testid="text-papss-title">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
            PAPSS Settlement Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pan-African Payment and Settlement System -- track cross-border settlements with ISO 20022 compliance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-settlement"><Plus className="w-4 h-4 mr-1.5" /> New Settlement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create PAPSS Settlement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sender Country *</Label>
                  <Select value={form.senderCountry} onValueChange={v => setForm(f => ({ ...f, senderCountry: v, senderCurrency: CURRENCIES[v] || "" }))}>
                    <SelectTrigger data-testid="select-sender-country"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SUPPORTED_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sender Institution *</Label>
                  <Input value={form.senderInstitution} onChange={e => setForm(f => ({ ...f, senderInstitution: e.target.value }))} placeholder="e.g. Bank of Ghana" data-testid="input-sender-institution" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Receiver Country *</Label>
                  <Select value={form.receiverCountry} onValueChange={v => setForm(f => ({ ...f, receiverCountry: v, receiverCurrency: CURRENCIES[v] || "" }))}>
                    <SelectTrigger data-testid="select-receiver-country"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SUPPORTED_COUNTRIES.filter(c => c !== form.senderCountry).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Receiver Institution *</Label>
                  <Input value={form.receiverInstitution} onChange={e => setForm(f => ({ ...f, receiverInstitution: e.target.value }))} placeholder="e.g. Bank of Sierra Leone" data-testid="input-receiver-institution" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Sender Amount *</Label>
                  <Input type="number" step="0.01" value={form.senderAmount} onChange={e => setForm(f => ({ ...f, senderAmount: e.target.value }))} placeholder="0.00" data-testid="input-sender-amount" />
                </div>
                <div>
                  <Label>Receiver Amount *</Label>
                  <Input type="number" step="0.01" value={form.receiverAmount} onChange={e => setForm(f => ({ ...f, receiverAmount: e.target.value }))} placeholder="0.00" data-testid="input-receiver-amount" />
                </div>
                <div>
                  <Label>Exchange Rate *</Label>
                  <Input type="number" step="0.000001" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))} placeholder="1.000000" data-testid="input-exchange-rate" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sender Currency</Label>
                  <Input value={form.senderCurrency || CURRENCIES[form.senderCountry] || ""} onChange={e => setForm(f => ({ ...f, senderCurrency: e.target.value }))} data-testid="input-sender-currency" />
                </div>
                <div>
                  <Label>Receiver Currency</Label>
                  <Input value={form.receiverCurrency || CURRENCIES[form.receiverCountry] || ""} onChange={e => setForm(f => ({ ...f, receiverCurrency: e.target.value }))} data-testid="input-receiver-currency" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ISO 20022 Reference *</Label>
                  <Input value={form.iso20022Reference} onChange={e => setForm(f => ({ ...f, iso20022Reference: e.target.value }))} placeholder="PAPSS-2026-..." data-testid="input-iso-reference" />
                </div>
                <div>
                  <Label>Message Type</Label>
                  <Select value={form.messageType} onValueChange={v => setForm(f => ({ ...f, messageType: v }))}>
                    <SelectTrigger data-testid="select-message-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pacs.008">pacs.008 (Credit Transfer)</SelectItem>
                      <SelectItem value="pacs.009">pacs.009 (Financial Institution)</SelectItem>
                      <SelectItem value="pacs.002">pacs.002 (Status Report)</SelectItem>
                      <SelectItem value="camt.053">camt.053 (Account Statement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Credit data exchange settlement" data-testid="input-purpose" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full" data-testid="button-submit-settlement">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Create Settlement (Pending)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold" data-testid="stat-total-settlements">{settlements.length}</p><p className="text-xs text-muted-foreground">Total Settlements</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600" data-testid="stat-completed">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500" data-testid="stat-pending">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary" data-testid="stat-volume">{completedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Total Volume</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="reversed">Reversed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[160px]" data-testid="filter-country"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {SUPPORTED_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold" data-testid="text-no-settlements">No settlements found</h3>
            <p className="text-sm text-muted-foreground mt-1">{settlements.length === 0 ? "Create your first PAPSS settlement to begin tracking cross-border payments." : "No settlements match your current filters."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="cursor-pointer hover-elevate" onClick={() => setSelectedSettlement(s)} data-testid={`settlement-card-${s.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                      <ArrowRightLeft className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{s.senderInstitution}</span>
                        <span className="text-xs text-muted-foreground">({s.senderCountry})</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-semibold">{s.receiverInstitution}</span>
                        <span className="text-xs text-muted-foreground">({s.receiverCountry})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {settlementStatusBadge(s.status)}
                        <Badge variant="outline" className="text-[10px] font-mono">{s.messageType}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.iso20022Reference}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{s.senderCurrency} {parseFloat(s.senderAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">Rate: {parseFloat(s.exchangeRate || "0").toFixed(4)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.receiverCurrency} {parseFloat(s.receiverAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSettlement && (
        <Dialog open={!!selectedSettlement} onOpenChange={() => setSelectedSettlement(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Settlement Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Sender</p>
                  <p className="font-semibold">{selectedSettlement.senderInstitution}</p>
                  <p className="text-xs">{selectedSettlement.senderCountry}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receiver</p>
                  <p className="font-semibold">{selectedSettlement.receiverInstitution}</p>
                  <p className="text-xs">{selectedSettlement.receiverCountry}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Send Amount</p>
                  <p className="font-semibold">{selectedSettlement.senderCurrency} {parseFloat(selectedSettlement.senderAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exchange Rate</p>
                  <p className="font-semibold">{parseFloat(selectedSettlement.exchangeRate || "0").toFixed(6)}</p>
                  <p className="text-[10px] text-muted-foreground">Source: {selectedSettlement.exchangeRateSource}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receive Amount</p>
                  <p className="font-semibold">{selectedSettlement.receiverCurrency} {parseFloat(selectedSettlement.receiverAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {settlementStatusBadge(selectedSettlement.status)}
                <Badge variant="outline" className="font-mono text-xs">{selectedSettlement.iso20022Reference}</Badge>
              </div>
              {selectedSettlement.purpose && <p className="text-xs text-muted-foreground">{selectedSettlement.purpose}</p>}
              {selectedSettlement.failureReason && <p className="text-xs text-red-600 dark:text-red-400">Failure: {selectedSettlement.failureReason}</p>}
              <div className="flex gap-2 pt-3 flex-wrap">
                {selectedSettlement.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: selectedSettlement.id, status: "completed" })} disabled={updateMutation.isPending} data-testid="button-complete-settlement">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateMutation.mutate({ id: selectedSettlement.id, status: "failed", failureReason: "Manual failure mark" })} disabled={updateMutation.isPending} data-testid="button-fail-settlement">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Mark Failed
                    </Button>
                  </>
                )}
                {selectedSettlement.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: selectedSettlement.id, status: "reversed" })} disabled={updateMutation.isPending} data-testid="button-reverse-settlement">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reverse
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
