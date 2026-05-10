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
  Wallet, Building2, Plus, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownLeft,
  Loader2, AlertTriangle, CheckCircle2, Smartphone, Landmark, RefreshCw,
  TrendingUp, TrendingDown, Clock, Banknote, PiggyBank,
} from "lucide-react";

function fmt(cents: number, symbol: string) {
  return symbol + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  topup: { label: "Top-up", color: "text-emerald-400" },
  transaction_fee: { label: "Transaction Fee", color: "text-red-400" },
  platform_fee: { label: "Platform Fee", color: "text-emerald-400" },
  license_fee: { label: "License Fee", color: "text-amber-400" },
  withdrawal: { label: "Withdrawal", color: "text-red-400" },
  refund: { label: "Refund", color: "text-blue-400" },
  adjustment: { label: "Adjustment", color: "text-muted-foreground" },
};

interface WalletData {
  id: string;
  organizationId: string | null;
  walletType: string;
  balanceCents: number;
  currency: string;
  isActive: boolean;
  lowBalanceThresholdCents: number;
  autoTopupEnabled: boolean;
  autoTopupAmountCents: number;
  lastTopupAt: string | null;
  orgName: string | null;
  createdAt: string;
}

export function CommandCenterWalletsTab() {
  const cs = getCurrencySymbol(detectLocalCurrency());
  const { toast } = useToast();
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [showTopup, setShowTopup] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState("mobile_money");
  const [topupRef, setTopupRef] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: walletsData, isLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/platform/wallets"],
    refetchOnMount: "always",
  });

  const { data: txData } = useQuery<any[]>({
    queryKey: ["/api/platform/wallets", expandedWallet, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/platform/wallets/${expandedWallet}/transactions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!expandedWallet,
  });

  const createWalletMutation = useMutation({
    mutationFn: async (payload: { organizationId?: string; walletType: string }) => {
      await apiRequest("POST", "/api/platform/wallets/create", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/wallets"] });
      toast({ title: "Wallet created" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const topupMutation = useMutation({
    mutationFn: async (payload: { walletId: string; amountCents: number; method: string; providerRef?: string }) => {
      await apiRequest("POST", "/api/platform/wallets/topup", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/wallets"] });
      toast({ title: "Wallet topped up successfully" });
      setShowTopup(null);
      setTopupAmount("");
      setTopupRef("");
    },
    onError: (e: any) => toast({ title: "Top-up failed", description: e.message, variant: "destructive" }),
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: { walletId: string; amountCents: number }) => {
      const res = await apiRequest("POST", "/api/platform/wallets/withdraw", payload);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/platform/wallets"] });
        toast({ title: "Withdrawal processed" });
        setShowWithdraw(null);
        setWithdrawAmount("");
      }
    },
    onError: (e: any) => toast({ title: "Withdrawal failed", description: e.message, variant: "destructive" }),
  });

  const allWallets = walletsData || [];
  const platformWallet = allWallets.find(w => w.walletType === "platform");
  const bureauWallets = allWallets.filter(w => w.walletType === "bureau");
  const totalPlatformBalance = platformWallet?.balanceCents || 0;
  const totalBureauBalance = bureauWallets.reduce((s, w) => s + w.balanceCents, 0);
  const lowBalanceWallets = bureauWallets.filter(w => w.balanceCents < w.lowBalanceThresholdCents);

  return (
    <div className="space-y-4" data-testid="panel-wallets">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <PiggyBank className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-400" data-testid="text-platform-balance">{fmt(totalPlatformBalance, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Your Platform Wallet</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <Building2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-400" data-testid="text-total-bureau-balance">{fmt(totalBureauBalance, cs)}</p>
          <p className="text-[10px] text-muted-foreground">Total Bureau Balances</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <Wallet className="w-4 h-4 text-foreground mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{allWallets.length}</p>
          <p className="text-[10px] text-muted-foreground">Active Wallets</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${lowBalanceWallets.length > 0 ? "border-red-500/20 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
          <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${lowBalanceWallets.length > 0 ? "text-red-400" : "text-emerald-400"}`} />
          <p className={`text-lg font-bold ${lowBalanceWallets.length > 0 ? "text-red-400" : "text-emerald-400"}`} data-testid="text-low-balance-count">{lowBalanceWallets.length}</p>
          <p className="text-[10px] text-muted-foreground">Low Balance Alerts</p>
        </div>
      </div>

      {!platformWallet && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <PiggyBank className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium mb-2">No platform wallet yet</p>
          <p className="text-xs text-muted-foreground mb-3">Create your platform wallet to start receiving your share of transaction fees automatically.</p>
          <Button
            size="sm"
            onClick={() => createWalletMutation.mutate({ walletType: "platform" })}
            disabled={createWalletMutation.isPending}
            data-testid="button-create-platform-wallet"
          >
            {createWalletMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
            Create Platform Wallet
          </Button>
        </div>
      )}

      {platformWallet && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold">Your Platform Wallet</h3>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Platform</Badge>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowWithdraw(showWithdraw === platformWallet.id ? null : platformWallet.id)} data-testid="button-platform-withdraw">
                <ArrowUpRight className="w-3 h-3 mr-1" /> Withdraw
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpandedWallet(expandedWallet === platformWallet.id ? null : platformWallet.id)} data-testid="button-platform-history">
                {expandedWallet === platformWallet.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400" data-testid="text-platform-wallet-balance">{fmt(platformWallet.balanceCents, cs)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            This balance grows automatically as bureaus process transactions. Your platform fee is deducted from every billable event in real time.
          </p>

          {showWithdraw === platformWallet.id && (
            <div className="mt-3 rounded-lg bg-muted/50 border border-border p-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-1">Amount ({cs})</label>
                  <Input type="number" min="0" step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="h-8 text-sm" data-testid="input-platform-withdraw-amount" />
                </div>
                <Button
                  size="sm" className="h-8 text-xs"
                  onClick={() => {
                    const cents = Math.round(parseFloat(withdrawAmount) * 100);
                    if (cents > 0) withdrawMutation.mutate({ walletId: platformWallet.id, amountCents: cents });
                  }}
                  disabled={withdrawMutation.isPending || !withdrawAmount}
                  data-testid="button-confirm-platform-withdraw"
                >
                  {withdrawMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Withdraw to Bank/MoMo"}
                </Button>
              </div>
            </div>
          )}

          {expandedWallet === platformWallet.id && (
            <div className="mt-3 space-y-1">
              <p className="text-[10px] text-muted-foreground font-semibold mb-1">Recent Transactions</p>
              {txData && txData.length > 0 ? txData.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="rounded bg-muted/30 p-2 flex items-center gap-2 text-xs">
                  {tx.amountCents >= 0 ? <ArrowDownLeft className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <ArrowUpRight className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  <span className="flex-1 truncate text-muted-foreground">{tx.description}</span>
                  <span className={`font-mono font-semibold ${tx.amountCents >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.amountCents >= 0 ? "+" : ""}{fmt(Math.abs(tx.amountCents), cs)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                </div>
              )) : (
                <p className="text-[10px] text-muted-foreground text-center py-2">No transactions yet</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Bureau Wallets</h3>
            <span className="text-[10px] text-muted-foreground">({bureauWallets.length} wallets)</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : bureauWallets.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-6">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Bureau wallets are created automatically when organizations process their first transaction. You can also create them manually.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bureauWallets.map(wallet => {
              const isLow = wallet.balanceCents < wallet.lowBalanceThresholdCents;
              return (
                <div key={wallet.id} className={`rounded-lg border bg-background p-3 ${isLow ? "border-red-500/30" : "border-border"}`} data-testid={`wallet-${wallet.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-medium truncate" data-testid={`text-wallet-org-${wallet.id}`}>{wallet.orgName || "Unknown Org"}</span>
                        {isLow && <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/30">Low Balance</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isLow ? "text-red-400" : "text-foreground"}`}>{fmt(wallet.balanceCents, cs)}</p>
                      <p className="text-[9px] text-muted-foreground">Min: {fmt(wallet.lowBalanceThresholdCents, cs)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowTopup(showTopup === wallet.id ? null : wallet.id)} data-testid={`button-topup-${wallet.id}`}>
                        <ArrowDownLeft className="w-3 h-3 mr-0.5" /> Top Up
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}>
                        {expandedWallet === wallet.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {showTopup === wallet.id && (
                    <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                      <p className="text-[10px] font-semibold mb-2">Top Up Bureau Wallet</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="text-[9px] text-muted-foreground block mb-0.5">Amount ({cs})</label>
                          <Input type="number" min="0" step="0.01" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="h-7 text-xs" data-testid={`input-topup-amount-${wallet.id}`} />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground block mb-0.5">Method</label>
                          <Select value={topupMethod} onValueChange={setTopupMethod}>
                            <SelectTrigger className="h-7 text-xs" data-testid={`select-topup-method-${wallet.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground block mb-0.5">Reference</label>
                          <Input value={topupRef} onChange={e => setTopupRef(e.target.value)} placeholder="Payment ref" className="h-7 text-xs" data-testid={`input-topup-ref-${wallet.id}`} />
                        </div>
                      </div>
                      <Button
                        size="sm" className="h-7 text-xs"
                        onClick={() => {
                          const cents = Math.round(parseFloat(topupAmount) * 100);
                          if (cents > 0) topupMutation.mutate({ walletId: wallet.id, amountCents: cents, method: topupMethod, providerRef: topupRef || undefined });
                        }}
                        disabled={topupMutation.isPending || !topupAmount}
                        data-testid={`button-confirm-topup-${wallet.id}`}
                      >
                        {topupMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        Confirm Top-Up
                      </Button>
                    </div>
                  )}

                  {expandedWallet === wallet.id && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground font-semibold mb-1">Transaction History</p>
                      {txData && txData.length > 0 ? txData.slice(0, 20).map((tx: any) => (
                        <div key={tx.id} className="rounded bg-muted/30 p-2 flex items-center gap-2 text-xs">
                          {tx.amountCents >= 0 ? <ArrowDownLeft className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <ArrowUpRight className="w-3 h-3 text-red-400 flex-shrink-0" />}
                          <span className="flex-1 truncate text-muted-foreground">{tx.description}</span>
                          <Badge variant="outline" className={`text-[8px] ${TX_TYPE_LABELS[tx.txType]?.color || ""}`}>{TX_TYPE_LABELS[tx.txType]?.label || tx.txType}</Badge>
                          <span className={`font-mono font-semibold ${tx.amountCents >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {tx.amountCents >= 0 ? "+" : ""}{fmt(Math.abs(tx.amountCents), cs)}
                          </span>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        </div>
                      )) : (
                        <p className="text-[10px] text-muted-foreground text-center py-2">No transactions yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-muted-foreground" />
          How Real-Time Wallet Billing Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">1. Bureau Loads Wallet</p>
            <p>Bureau sends money via MTN MoMo, Vodafone Cash, bank transfer, or Stripe. The amount is credited to their wallet instantly. This is prepaid — no credit risk for you.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">2. Instant Deduction</p>
            <p>Every time a bank pulls a credit report or uses the API, the fee is deducted from the bureau's wallet automatically. Your platform cut goes straight to your wallet.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">3. Low Balance Alerts</p>
            <p>When a bureau's wallet drops below the threshold, they see a warning. If empty, they can't process transactions until they top up — ensuring you always get paid.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">4. You Withdraw Anytime</p>
            <p>Your platform wallet accumulates fees from all bureaus. Withdraw to your bank account or MoMo wallet whenever you want — daily, weekly, or on demand.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterWalletsTab;
