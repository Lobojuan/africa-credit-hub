import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { detectLocalCurrency, getCurrencySymbol } from "@/lib/currency";
import {
  Building2, DollarSign, Percent, TrendingUp, ArrowRightLeft,
  Settings2, ChevronDown, ChevronUp, BarChart3, Wallet, PiggyBank,
  Check, X, Pencil,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

interface SplitData {
  totalCents: number;
  platformFeeCents: number;
  bureauRevenueCents: number;
  eventCount: number;
}

interface BureauEntry {
  id: string;
  name: string;
  type: string;
  platformFeePercent: number;
  monthlyLicenseFeeCents: number;
  licenseCurrency: string;
  subscriptionTier: string;
  status: string;
  allTime: SplitData;
  currentMonth: SplitData;
}

interface RevenueSplitResponse {
  bureaus: BureauEntry[];
  totals: {
    allTimeTotalCents: number;
    allTimePlatformCents: number;
    allTimeBureauCents: number;
    monthTotalCents: number;
    monthPlatformCents: number;
    monthBureauCents: number;
    totalLicenseFeeCents: number;
  };
  monthlyTrend: {
    month: string;
    totalCents: number;
    platformFeeCents: number;
    bureauRevenueCents: number;
    eventCount: number;
  }[];
}

function fmt(cents: number, symbol: string) {
  return symbol + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SplitBar({ platform, bureau, total }: { platform: number; bureau: number; total: number }) {
  if (total === 0) return <div className="h-3 w-full rounded-full bg-muted" />;
  const pPct = Math.round((platform / total) * 100);
  const bPct = 100 - pPct;
  return (
    <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex" data-testid="split-bar">
      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pPct}%` }} title={`Your share: ${pPct}%`} />
      <div className="bg-blue-500 h-full transition-all" style={{ width: `${bPct}%` }} title={`Bureau share: ${bPct}%`} />
    </div>
  );
}

export function CommandCenterRevenueSplitTab() {
  const cs = getCurrencySymbol(detectLocalCurrency());
  const { toast } = useToast();
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editFeePercent, setEditFeePercent] = useState("");
  const [editLicenseFee, setEditLicenseFee] = useState("");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RevenueSplitResponse>({
    queryKey: ["/api/platform/revenue-split"],
    refetchOnMount: "always",
  });

  const updateLicenseMutation = useMutation({
    mutationFn: async ({ id, platformFeePercent, monthlyLicenseFeeCents }: { id: string; platformFeePercent: number; monthlyLicenseFeeCents: number }) => {
      await apiRequest("PATCH", `/api/platform/organizations/${id}/license`, { platformFeePercent, monthlyLicenseFeeCents });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/revenue-split"] });
      toast({ title: "License terms updated" });
      setEditingOrg(null);
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const t = data?.totals;
  const bureaus = data?.bureaus || [];
  const trend = data?.monthlyTrend || [];

  const chartData = trend.map(m => ({
    month: m.month,
    "Your Revenue": m.platformFeeCents / 100,
    "Bureau Revenue": m.bureauRevenueCents / 100,
  }));

  return (
    <div className="space-y-4" data-testid="panel-revenue-split">
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Revenue Split Model</h3>
          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ml-2">Two-Tier Billing</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Every transaction on the platform is split automatically. You (the platform owner) take a percentage of every credit report, API call, and data export that bureaus bill their clients. Bureaus keep the rest plus charge whatever retail prices they want.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <PiggyBank className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-400" data-testid="text-platform-revenue-month">{fmt(t?.monthPlatformCents || 0, cs)}</p>
            <p className="text-[10px] text-muted-foreground">Your Revenue (This Month)</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
            <Building2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-400" data-testid="text-bureau-revenue-month">{fmt(t?.monthBureauCents || 0, cs)}</p>
            <p className="text-[10px] text-muted-foreground">Bureau Revenue (This Month)</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-400" data-testid="text-platform-revenue-all">{fmt(t?.allTimePlatformCents || 0, cs)}</p>
            <p className="text-[10px] text-muted-foreground">Your Revenue (All Time)</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <Wallet className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-400" data-testid="text-license-fees">{fmt(t?.totalLicenseFeeCents || 0, cs)}</p>
            <p className="text-[10px] text-muted-foreground">Monthly License Fees</p>
          </div>
        </div>

        {(t?.monthTotalCents || 0) > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Your Cut</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Bureau Cut</span>
            </div>
            <SplitBar platform={t?.monthPlatformCents || 0} bureau={t?.monthBureauCents || 0} total={t?.monthTotalCents || 0} />
          </div>
        )}
      </div>

      {chartData.length > 1 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Monthly Revenue Split Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${cs}${v}`} />
              <Tooltip formatter={(v: number) => [`${cs}${v.toFixed(2)}`, ""]} labelStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Your Revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Bureau Revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Bureau License Terms</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Click edit to adjust split % or license fee</span>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading revenue data...</div>
        ) : bureaus.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No organizations registered yet</div>
        ) : (
          <div className="space-y-2">
            {bureaus.map(bureau => (
              <div key={bureau.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate" data-testid={`text-bureau-name-${bureau.id}`}>{bureau.name}</span>
                      <Badge variant="outline" className="text-[9px]">{bureau.type}</Badge>
                      <Badge variant="outline" className={`text-[9px] ${bureau.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground"}`}>
                        {bureau.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center">
                      <span className="text-emerald-400 font-semibold" data-testid={`text-fee-percent-${bureau.id}`}>{bureau.platformFeePercent}%</span>
                      <p className="text-[9px] text-muted-foreground">Your Cut</p>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-400 font-semibold" data-testid={`text-license-fee-${bureau.id}`}>
                        {bureau.monthlyLicenseFeeCents > 0 ? fmt(bureau.monthlyLicenseFeeCents, cs) : "N/A"}
                      </span>
                      <p className="text-[9px] text-muted-foreground">License/mo</p>
                    </div>
                    <div className="text-center">
                      <span className="text-foreground font-semibold">{bureau.currentMonth.eventCount}</span>
                      <p className="text-[9px] text-muted-foreground">Events/mo</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {editingOrg === bureau.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            const parsedPercent = parseInt(editFeePercent);
                            const parsedLicense = parseFloat(editLicenseFee);
                            updateLicenseMutation.mutate({
                              id: bureau.id,
                              platformFeePercent: isNaN(parsedPercent) ? bureau.platformFeePercent : parsedPercent,
                              monthlyLicenseFeeCents: isNaN(parsedLicense) ? bureau.monthlyLicenseFeeCents : Math.round(parsedLicense * 100),
                            });
                          }}
                          disabled={updateLicenseMutation.isPending}
                          data-testid={`button-save-license-${bureau.id}`}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingOrg(null)} data-testid={`button-cancel-license-${bureau.id}`}>
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingOrg(bureau.id);
                          setEditFeePercent(String(bureau.platformFeePercent));
                          setEditLicenseFee(String(bureau.monthlyLicenseFeeCents / 100));
                        }}
                        data-testid={`button-edit-license-${bureau.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => setExpandedOrg(expandedOrg === bureau.id ? null : bureau.id)}
                      data-testid={`button-expand-${bureau.id}`}
                    >
                      {expandedOrg === bureau.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {editingOrg === bureau.id && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Platform Fee %</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editFeePercent}
                          onChange={e => setEditFeePercent(e.target.value)}
                          className="h-8 text-sm"
                          data-testid={`input-fee-percent-${bureau.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-1">Monthly License Fee ({cs})</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editLicenseFee}
                          onChange={e => setEditLicenseFee(e.target.value)}
                          className="h-8 text-sm"
                          data-testid={`input-license-fee-${bureau.id}`}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2">
                      Platform fee is taken from every billable event. License fee is a fixed monthly charge on top of the percentage.
                    </p>
                  </div>
                )}

                {expandedOrg === bureau.id && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                      <p className="text-[10px] text-emerald-400 font-semibold mb-2">This Month</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Billed</span>
                          <span className="font-medium">{fmt(bureau.currentMonth.totalCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Share</span>
                          <span className="font-medium text-emerald-400">{fmt(bureau.currentMonth.platformFeeCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bureau Keeps</span>
                          <span className="font-medium text-blue-400">{fmt(bureau.currentMonth.bureauRevenueCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Events</span>
                          <span className="font-medium">{bureau.currentMonth.eventCount}</span>
                        </div>
                      </div>
                      <SplitBar platform={bureau.currentMonth.platformFeeCents} bureau={bureau.currentMonth.bureauRevenueCents} total={bureau.currentMonth.totalCents} />
                    </div>
                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                      <p className="text-[10px] text-blue-400 font-semibold mb-2">All Time</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Billed</span>
                          <span className="font-medium">{fmt(bureau.allTime.totalCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Share</span>
                          <span className="font-medium text-emerald-400">{fmt(bureau.allTime.platformFeeCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bureau Keeps</span>
                          <span className="font-medium text-blue-400">{fmt(bureau.allTime.bureauRevenueCents, cs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Events</span>
                          <span className="font-medium">{bureau.allTime.eventCount}</span>
                        </div>
                      </div>
                      <SplitBar platform={bureau.allTime.platformFeeCents} bureau={bureau.allTime.bureauRevenueCents} total={bureau.allTime.totalCents} />
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
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          How the Two-Tier Billing Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">1. Bureau's Client Pays</p>
            <p>A bank or MFI pulls a credit report, uploads batch data, or calls the API. The platform records the billable event and calculates the total charge based on your pricing tiers.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">2. Automatic Split</p>
            <p>The platform instantly splits the revenue: your configured percentage goes to your platform account, and the rest stays with the bureau. Both see their respective amounts in real time.</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="font-semibold text-foreground mb-1">3. Settlement</p>
            <p>At the end of each billing cycle, the bureau collects from their clients and pays you your platform fee percentage plus the monthly license fee. Both parties have full transparency.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterRevenueSplitTab;
