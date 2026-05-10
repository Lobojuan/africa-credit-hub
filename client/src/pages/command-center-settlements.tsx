import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { detectLocalCurrency, getCurrencySymbol } from "@/lib/currency";
import {
  Wallet, Building2, Smartphone, Landmark, Plus, Clock, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, FileText, ArrowRight, RefreshCw,
  Settings2, Banknote, CalendarDays, Loader2, XCircle, Check,
} from "lucide-react";

function fmt(cents: number, symbol: string) {
  return symbol + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Every Day",
  weekly: "Every Week",
  biweekly: "Every 2 Weeks",
  monthly: "Every Month",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MOMO_PROVIDERS = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "vodafone", label: "Vodafone Cash" },
  { value: "airteltigo", label: "AirtelTigo Money" },
];

const GHANA_BANKS = [
  "GCB Bank", "Ecobank Ghana", "Stanbic Bank", "Absa Bank Ghana",
  "Fidelity Bank", "Zenith Bank Ghana", "Access Bank Ghana",
  "CalBank", "Republic Bank", "Societe Generale Ghana",
  "Standard Chartered Ghana", "UBA Ghana", "Bank of Africa Ghana",
  "Agricultural Development Bank", "National Investment Bank",
  "Prudential Bank", "First Atlantic Bank", "FBN Bank Ghana",
];

interface SettlementSummary {
  accounts: any[];
  schedules: any[];
  recentBatches: any[];
  unbilled: { totalCents: number; platformCents: number; bureauCents: number; eventsCount: number };
  settled: { totalPlatformPaid: number; totalBureauPaid: number; batchCount: number };
}

export function CommandCenterSettlementsTab() {
  const cs = getCurrencySymbol(detectLocalCurrency());
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    accountLabel: "",
    method: "mobile_money" as "bank_transfer" | "mobile_money",
    isPlatformAccount: true,
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    accountName: "",
    momoProvider: "mtn",
    momoNumber: "",
    momoName: "",
    currency: "GHS",
  });
  const [newSchedule, setNewSchedule] = useState({
    frequency: "weekly" as string,
    dayOfWeek: 5,
    dayOfMonth: 1,
    minimumPayoutCents: 1000,
    isPlatformSchedule: true,
  });

  const { data, isLoading } = useQuery<SettlementSummary>({
    queryKey: ["/api/platform/settlement-summary"],
    refetchOnMount: "always",
  });

  const { data: batchDetail } = useQuery<{ batch: any; items: any[] }>({
    queryKey: ["/api/platform/payout-batches", expandedBatch],
    enabled: !!expandedBatch,
  });

  const addAccountMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest("POST", "/api/platform/settlement-accounts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settlement-summary"] });
      toast({ title: "Settlement account added" });
      setShowAddAccount(false);
      setNewAccount({ accountLabel: "", method: "mobile_money", isPlatformAccount: true, bankName: "", bankBranch: "", accountNumber: "", accountName: "", momoProvider: "mtn", momoNumber: "", momoName: "", currency: "GHS" });
    },
    onError: (e: any) => toast({ title: "Failed to add account", description: e.message, variant: "destructive" }),
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest("POST", "/api/platform/settlement-schedules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settlement-summary"] });
      toast({ title: "Settlement schedule created" });
      setShowAddSchedule(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const generateBatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/platform/payout-batches/generate", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settlement-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/payout-batches"] });
      toast({ title: "Payout batch generated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const approveBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/platform/payout-batches/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settlement-summary"] });
      toast({ title: "Batch approved and usage marked as billed" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const completeBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/platform/payout-batches/${id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settlement-summary"] });
      toast({ title: "Batch marked as completed" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const accounts = data?.accounts || [];
  const schedules = data?.schedules || [];
  const batches = data?.recentBatches || [];
  const unbilled = data?.unbilled;
  const settled = data?.settled;

  return (
    <div className="space-y-4" data-testid="panel-settlements">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
          <Banknote className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-400" data-testid="text-unbilled-total">{fmt(unbilled?.totalCents || 0, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Unbilled Revenue</p>
          <p className="text-[9px] text-muted-foreground">{unbilled?.eventsCount || 0} events</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <Wallet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-400" data-testid="text-unbilled-platform">{fmt(unbilled?.platformCents || 0, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Your Unbilled Share</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-400" data-testid="text-settled-platform">{fmt(settled?.totalPlatformPaid || 0, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Total Settled (You)</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <Building2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-400" data-testid="text-settled-bureau">{fmt(settled?.totalBureauPaid || 0, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Total Settled (Bureaus)</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Settlement Accounts</h3>
            <span className="text-[10px] text-muted-foreground">({accounts.length} accounts)</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddAccount(!showAddAccount)} data-testid="button-add-account">
            <Plus className="w-3 h-3 mr-1" /> Add Account
          </Button>
        </div>

        {showAddAccount && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-3">
            <h4 className="text-xs font-semibold mb-3">New Settlement Account</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Label</label>
                <Input
                  value={newAccount.accountLabel}
                  onChange={e => setNewAccount(p => ({ ...p, accountLabel: e.target.value }))}
                  placeholder="e.g. Platform MTN MoMo"
                  className="h-8 text-sm"
                  data-testid="input-account-label"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Type</label>
                <Select value={newAccount.method} onValueChange={v => setNewAccount(p => ({ ...p, method: v as any }))}>
                  <SelectTrigger className="h-8 text-sm" data-testid="select-account-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="text-[10px] text-muted-foreground">Account Owner:</label>
              <Button
                size="sm"
                variant={newAccount.isPlatformAccount ? "default" : "outline"}
                className="h-6 text-[10px]"
                onClick={() => setNewAccount(p => ({ ...p, isPlatformAccount: true }))}
              >
                Platform (You)
              </Button>
              <Button
                size="sm"
                variant={!newAccount.isPlatformAccount ? "default" : "outline"}
                className="h-6 text-[10px]"
                onClick={() => setNewAccount(p => ({ ...p, isPlatformAccount: false }))}
              >
                Bureau
              </Button>
            </div>

            {newAccount.method === "mobile_money" ? (
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Provider</label>
                  <Select value={newAccount.momoProvider} onValueChange={v => setNewAccount(p => ({ ...p, momoProvider: v }))}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-momo-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOMO_PROVIDERS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">MoMo Number</label>
                  <Input
                    value={newAccount.momoNumber}
                    onChange={e => setNewAccount(p => ({ ...p, momoNumber: e.target.value }))}
                    placeholder="024XXXXXXX"
                    className="h-8 text-sm"
                    data-testid="input-momo-number"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Account Name</label>
                  <Input
                    value={newAccount.momoName}
                    onChange={e => setNewAccount(p => ({ ...p, momoName: e.target.value }))}
                    placeholder="Full name on account"
                    className="h-8 text-sm"
                    data-testid="input-momo-name"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Bank</label>
                  <Select value={newAccount.bankName} onValueChange={v => setNewAccount(p => ({ ...p, bankName: v }))}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-bank-name">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {GHANA_BANKS.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Branch</label>
                  <Input
                    value={newAccount.bankBranch}
                    onChange={e => setNewAccount(p => ({ ...p, bankBranch: e.target.value }))}
                    placeholder="Branch name"
                    className="h-8 text-sm"
                    data-testid="input-bank-branch"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Account Number</label>
                  <Input
                    value={newAccount.accountNumber}
                    onChange={e => setNewAccount(p => ({ ...p, accountNumber: e.target.value }))}
                    className="h-8 text-sm"
                    data-testid="input-account-number"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Account Name</label>
                  <Input
                    value={newAccount.accountName}
                    onChange={e => setNewAccount(p => ({ ...p, accountName: e.target.value }))}
                    placeholder="Name on account"
                    className="h-8 text-sm"
                    data-testid="input-account-name"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => addAccountMutation.mutate(newAccount)}
                disabled={addAccountMutation.isPending || !newAccount.accountLabel}
                data-testid="button-save-account"
              >
                {addAccountMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                Save Account
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddAccount(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-6">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No settlement accounts yet. Add your bank account or MoMo wallet to receive payouts.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="rounded-lg border border-border bg-background p-3 flex items-center gap-3" data-testid={`account-${acc.id}`}>
                {acc.method === "mobile_money" ? (
                  <Smartphone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <Landmark className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{acc.accountLabel}</span>
                    {acc.isPlatformAccount && <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Platform</Badge>}
                    {acc.isDefault && <Badge variant="outline" className="text-[9px]">Default</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {acc.method === "mobile_money"
                      ? `${acc.momoProvider?.toUpperCase()} - ${acc.momoNumber} (${acc.momoName})`
                      : `${acc.bankName} - ${acc.accountNumber} (${acc.accountName})`
                    }
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{acc.currency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Payout Schedule</h3>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddSchedule(!showAddSchedule)} data-testid="button-add-schedule">
            <Plus className="w-3 h-3 mr-1" /> Add Schedule
          </Button>
        </div>

        {showAddSchedule && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 mb-3">
            <h4 className="text-xs font-semibold mb-3">New Payout Schedule</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Frequency</label>
                <Select value={newSchedule.frequency} onValueChange={v => setNewSchedule(p => ({ ...p, frequency: v }))}>
                  <SelectTrigger className="h-8 text-sm" data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newSchedule.frequency === "weekly" || newSchedule.frequency === "biweekly") && (
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Day of Week</label>
                  <Select value={String(newSchedule.dayOfWeek)} onValueChange={v => setNewSchedule(p => ({ ...p, dayOfWeek: parseInt(v) }))}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-day-of-week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newSchedule.frequency === "monthly" && (
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Day of Month</label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={newSchedule.dayOfMonth}
                    onChange={e => setNewSchedule(p => ({ ...p, dayOfMonth: parseInt(e.target.value) || 1 }))}
                    className="h-8 text-sm"
                    data-testid="input-day-of-month"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Min Payout ({cs})</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={newSchedule.minimumPayoutCents / 100}
                  onChange={e => setNewSchedule(p => ({ ...p, minimumPayoutCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                  className="h-8 text-sm"
                  data-testid="input-min-payout"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => addScheduleMutation.mutate(newSchedule)}
                disabled={addScheduleMutation.isPending}
                data-testid="button-save-schedule"
              >
                {addScheduleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                Save Schedule
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddSchedule(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-4">
            <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p>No payout schedules configured. We recommend weekly payouts.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((s: any) => (
              <div key={s.id} className="rounded-lg border border-border bg-background p-3 flex items-center gap-3" data-testid={`schedule-${s.id}`}>
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{FREQUENCY_LABELS[s.frequency] || s.frequency}</span>
                  {s.frequency === "weekly" || s.frequency === "biweekly" ? (
                    <span className="text-[10px] text-muted-foreground ml-2">on {DAY_NAMES[s.dayOfWeek || 0]}</span>
                  ) : s.frequency === "monthly" ? (
                    <span className="text-[10px] text-muted-foreground ml-2">on day {s.dayOfMonth}</span>
                  ) : null}
                  {s.isPlatformSchedule && <Badge variant="outline" className="text-[9px] ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Platform</Badge>}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>Min: {fmt(s.minimumPayoutCents, cs)}</p>
                  {s.nextRunAt && <p className="text-[9px]">Next: {new Date(s.nextRunAt).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Payout Batches</h3>
            <span className="text-[10px] text-muted-foreground">({batches.length} recent)</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => generateBatchMutation.mutate()}
            disabled={generateBatchMutation.isPending || (unbilled?.eventsCount || 0) === 0}
            data-testid="button-generate-batch"
          >
            {generateBatchMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Generate Payout
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading settlement data...</div>
        ) : batches.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-6">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No payout batches yet. Click "Generate Payout" when you're ready to settle unbilled transactions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {batches.map((batch: any) => (
              <div key={batch.id} className="rounded-lg border border-border bg-background" data-testid={`batch-${batch.id}`}>
                <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{batch.batchReference}</span>
                      <Badge variant="outline" className={`text-[9px] ${STATUS_STYLES[batch.status] || ""}`}>{batch.status}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(batch.periodStart).toLocaleDateString()} - {new Date(batch.periodEnd).toLocaleDateString()} | {batch.eventsCount} events
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold">{fmt(batch.platformShareCents, cs)}</p>
                      <p className="text-[9px] text-muted-foreground">Your Share</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-semibold">{fmt(batch.bureauShareCents, cs)}</p>
                      <p className="text-[9px] text-muted-foreground">Bureau Share</p>
                    </div>
                    {expandedBatch === batch.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expandedBatch === batch.id && (
                  <div className="border-t border-border p-3">
                    <div className="flex gap-2 mb-3">
                      {batch.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => { e.stopPropagation(); approveBatchMutation.mutate(batch.id); }}
                          disabled={approveBatchMutation.isPending}
                          data-testid={`button-approve-${batch.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve & Mark Billed
                        </Button>
                      )}
                      {batch.status === "processing" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); completeBatchMutation.mutate(batch.id); }}
                          disabled={completeBatchMutation.isPending}
                          data-testid={`button-complete-${batch.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" /> Mark Payouts Complete
                        </Button>
                      )}
                    </div>

                    {batchDetail?.items && expandedBatch === batch.id ? (
                      <div className="space-y-1.5">
                        {batchDetail.items.map((item: any) => (
                          <div key={item.id} className="rounded bg-muted/50 p-2 flex items-center gap-2 text-xs">
                            {item.recipient === "platform" ? (
                              <Wallet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{item.recipient === "platform" ? "Platform (You)" : item.orgName || "Bureau"}</span>
                            <span className={`font-semibold ${item.recipient === "platform" ? "text-emerald-400" : "text-blue-400"}`}>
                              {fmt(item.totalPayoutCents, cs)}
                            </span>
                            {item.licenseFeeAmountCents > 0 && (
                              <span className="text-[9px] text-muted-foreground">(incl. {fmt(item.licenseFeeAmountCents, cs)} license)</span>
                            )}
                            <Badge variant="outline" className={`text-[8px] ${STATUS_STYLES[item.status] || ""}`}>{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-xs py-2">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      </div>
                    )}

                    <div className="mt-3 rounded-lg bg-muted/50 p-2 text-[10px] text-muted-foreground grid grid-cols-3 gap-2">
                      <div>Total: {fmt(batch.totalTransactionsCents, cs)}</div>
                      <div>License Fees: {fmt(batch.totalLicenseFeesCents, cs)}</div>
                      <div>Created: {new Date(batch.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          Settlement Flow — How Payouts Work
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">1. Accumulate</p>
            <p>Transactions accumulate throughout the billing period. Every credit report pull, API call, and data export is recorded with the split already calculated.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">2. Generate Batch</p>
            <p>When it's payout time (per your schedule), generate a payout batch. This tallies all unbilled events and creates line items for you and each bureau.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">3. Approve & Pay</p>
            <p>Review the batch, approve it (marks events as billed), then send the money via bank transfer or MoMo to the registered settlement accounts.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">4. Confirm</p>
            <p>Once payments clear, mark the batch as complete. Full audit trail is maintained for every payout — amount, recipient, timestamp, and reference.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterSettlementsTab;
