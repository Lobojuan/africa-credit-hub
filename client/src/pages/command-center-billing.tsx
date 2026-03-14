import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, TrendingUp, FileText, CreditCard, Building2, Tag, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EVENT_LABELS: Record<string, string> = {
  credit_report_pull: "Credit Report Pull",
  api_call: "API Call",
  batch_upload: "Batch Upload",
  cross_border_query: "Cross-Border Query",
  dispute_filing: "Dispute Filing",
  data_export: "Data Export",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CommandCenterBillingTab() {
  const { toast } = useToast();
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const { data, isLoading } = useQuery<{
    invoices: any[];
    pricingTiers: any[];
    usageEvents: any[];
    summary: { totalRevenue: number; paidRevenue: number; pendingRevenue: number; overdueRevenue: number; invoiceCount: number };
    usageByCategory: { eventType: string; totalEvents: number; totalCents: number; unbilledCents: number }[];
    revenueByOrg: { orgId: string; name: string; total: number; invoiceCount: number }[];
  }>({
    queryKey: ["/api/platform/billing"],
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, unitPriceCents }: { id: string; unitPriceCents: number }) => {
      await apiRequest("PUT", `/api/platform/pricing-tiers/${id}`, { unitPriceCents });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/billing"] });
      toast({ title: "Pricing tier updated" });
      setEditingTier(null);
    },
  });

  const s = data?.summary;

  return (
    <div className="space-y-4" data-testid="panel-billing">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-white" data-testid="text-total-revenue">${(s?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">${(s?.paidRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Collected</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">${(s?.pendingRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">${(s?.overdueRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-xl border border-border bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-white">{s?.invoiceCount || 0}</p>
          <p className="text-[10px] text-muted-foreground">Invoices</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground text-sm py-8">Loading billing data...</div>
      ) : (
        <>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Pricing Tiers — Transaction-Based Monetization</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">Click price to edit</span>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_120px_80px_80px_80px] gap-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border/30">
                <span>Tier Name</span>
                <span>Event Type</span>
                <span className="text-right">Min Vol</span>
                <span className="text-right">Max Vol</span>
                <span className="text-right">Unit Price</span>
              </div>
              {(data?.pricingTiers || []).map(tier => (
                <div key={tier.id} className="grid grid-cols-[1fr_120px_80px_80px_80px] gap-2 items-center px-2 py-1.5 rounded hover:bg-white/5 transition-colors" data-testid={`pricing-tier-${tier.id}`}>
                  <span className="text-xs text-white">{tier.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 justify-center">
                    {EVENT_LABELS[tier.eventType] || tier.eventType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground text-right font-mono">{tier.minVolume.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground text-right font-mono">{tier.maxVolume ? tier.maxVolume.toLocaleString() : "∞"}</span>
                  {editingTier === tier.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Input
                        className="h-6 w-16 text-[10px] bg-slate-900 border-slate-700/50 text-card-foreground px-1"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const cents = Math.round(parseFloat(editPrice) * 100);
                            if (!isNaN(cents) && cents > 0) updateTierMutation.mutate({ id: tier.id, unitPriceCents: cents });
                          }
                          if (e.key === "Escape") setEditingTier(null);
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      className="text-[10px] text-emerald-400 text-right font-mono hover:underline cursor-pointer"
                      onClick={() => { setEditingTier(tier.id); setEditPrice((tier.unitPriceCents / 100).toFixed(2)); }}
                      data-testid={`button-edit-price-${tier.id}`}
                    >
                      {formatUSD(tier.unitPriceCents)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Usage by Category</h3>
              </div>
              {(data?.usageByCategory || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No usage events recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {data!.usageByCategory.map(u => (
                    <div key={u.eventType} className="p-2 rounded-lg border border-border/30 bg-white/[0.03]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{EVENT_LABELS[u.eventType] || u.eventType}</span>
                        <span className="text-xs font-mono text-emerald-400">{formatUSD(u.totalCents)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{u.totalEvents.toLocaleString()} events</span>
                        {u.unbilledCents > 0 && (
                          <span className="text-[10px] text-amber-400">{formatUSD(u.unbilledCents)} unbilled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Revenue by Organization</h3>
              </div>
              {(data?.revenueByOrg || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No billing records yet</p>
              ) : (
                <div className="space-y-1.5">
                  {data!.revenueByOrg.sort((a, b) => b.total - a.total).map(o => {
                    const maxTotal = Math.max(...data!.revenueByOrg.map(x => x.total));
                    return (
                      <div key={o.orgId || o.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-[120px] truncate">{o.name}</span>
                        <div className="flex-1 bg-muted-foreground/30 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-violet-500/60 rounded-full transition-all" style={{ width: `${(o.total / maxTotal) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono w-[60px] text-right">${o.total.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground w-[30px] text-right">{o.invoiceCount}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
            </div>
            {(data?.invoices || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[auto_1fr_80px_80px_80px_100px] gap-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border/30">
                  <span className="w-[100px]">Invoice #</span>
                  <span>Institution</span>
                  <span>Service</span>
                  <span className="text-right">Amount</span>
                  <span>Status</span>
                  <span className="text-right">Date</span>
                </div>
                {data!.invoices.slice(0, 20).map(inv => (
                  <div key={inv.id} className="grid grid-cols-[auto_1fr_80px_80px_80px_100px] gap-2 items-center px-2 py-1.5 border-b border-border/20 last:border-0 hover:bg-white/10 transition-colors" data-testid={`invoice-row-${inv.id}`}>
                    <span className="w-[100px] text-[10px] text-cyan-400 font-mono truncate">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-white truncate">{inv.institutionName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{inv.serviceType}</span>
                    <span className="text-[10px] text-emerald-400 font-mono text-right">${parseFloat(inv.amount).toLocaleString()}</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                      {inv.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground text-right">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-cyan-400">Monetization Model</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Revenue is generated per-transaction: each credit report pull, API call, batch upload, cross-border query, dispute filing, and data export
                  is metered and billed at the tier rate based on the organization's monthly volume. Volume discounts automatically apply as organizations
                  exceed tier thresholds. Unbilled usage is accumulated and invoiced at the end of each billing period.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
