import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrendingUp, FileText, CreditCard, Building2, Tag, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EVENT_LABELS: Record<string, string> = {
  credit_report_pull: "Credit Report",
  api_call: "API Call",
  batch_upload: "Batch Upload",
  cross_border_query: "Cross-Border",
  dispute_filing: "Dispute",
  data_export: "Data Export",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GHS: "GH₵",
  SLL: "Le",
  KES: "KSh",
  NGN: "₦",
  ZAR: "R",
  TZS: "TSh",
  UGX: "USh",
  RWF: "RF",
  ETB: "Br",
  EGP: "E£",
};

function formatPrice(cents: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
  const val = (cents / 100).toFixed(2);
  return symbol + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CommandCenterBillingTab() {
  const { toast } = useToast();
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("Global");

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
  const rawTiers = data?.pricingTiers;
  const allTiers = Array.isArray(rawTiers) ? rawTiers : [];

  const countries = allTiers.length > 0
    ? [...new Set(allTiers.map((t: any) => String(t.country || "Global")))].sort((a, b) => {
        if (a === "Global") return -1;
        if (b === "Global") return 1;
        return a.localeCompare(b);
      })
    : [];

  const displayTiers = selectedCountry === "all"
    ? allTiers
    : allTiers.filter((t: any) => String(t.country || "Global") === selectedCountry);

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
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Tag className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Pricing Tiers</h3>
              <span className="text-[10px] text-amber-400 ml-1">({displayTiers.length} tiers)</span>
              <span className="text-[10px] text-muted-foreground ml-auto">Click any green price to edit</span>
            </div>

            <div className="flex items-center gap-1.5 mb-4 flex-wrap" data-testid="country-filter-bar">
              <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground mr-1">Country:</span>
              <button
                onClick={() => setSelectedCountry("all")}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  selectedCountry === "all"
                    ? "bg-amber-500/30 text-amber-300 border-amber-500/40 font-semibold"
                    : "border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                }`}
                data-testid="filter-country-all"
              >
                All
              </button>
              {countries.map((c: string) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedCountry === c
                      ? "bg-amber-500/30 text-amber-300 border-amber-500/40 font-semibold"
                      : "border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid={`filter-country-${c.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" data-testid="pricing-tiers-table">
                <thead>
                  <tr className="border-b border-white/10">
                    {selectedCountry === "all" && <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Country</th>}
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Tier Name</th>
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Event Type</th>
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Min Vol</th>
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Max Vol</th>
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-center">Currency</th>
                    <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTiers.map((tier: any) => {
                    const minVol = Number(tier.minVolume) || 0;
                    const maxVol = tier.maxVolume != null ? Number(tier.maxVolume) : null;
                    const priceCents = Number(tier.unitPriceCents) || 0;
                    const tierCurrency = String(tier.currency || "USD");
                    const tierCountry = String(tier.country || "Global");
                    return (
                      <tr key={tier.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`pricing-tier-${tier.id}`}>
                        {selectedCountry === "all" && (
                          <td className="py-1.5 px-2">
                            <span className="text-[10px] text-amber-400 font-medium">{tierCountry}</span>
                          </td>
                        )}
                        <td className="py-1.5 px-2">
                          <span className="text-xs text-white">{tier.name}</span>
                        </td>
                        <td className="py-1.5 px-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                            {EVENT_LABELS[tier.eventType] || tier.eventType}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <span className="text-[10px] text-muted-foreground font-mono">{minVol.toLocaleString()}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <span className="text-[10px] text-muted-foreground font-mono">{maxVol != null ? maxVol.toLocaleString() : "∞"}</span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-white/10 text-muted-foreground">{tierCurrency}</Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {editingTier === tier.id ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Input
                                className="h-6 w-20 text-[10px] bg-slate-900 border-slate-700/50 text-white px-1"
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
                                data-testid={`input-edit-price-${tier.id}`}
                              />
                            </div>
                          ) : (
                            <button
                              className="text-xs text-emerald-400 font-mono font-semibold hover:underline hover:text-emerald-300 cursor-pointer transition-colors"
                              onClick={() => { setEditingTier(tier.id); setEditPrice((priceCents / 100).toFixed(2)); }}
                              data-testid={`button-edit-price-${tier.id}`}
                            >
                              {formatPrice(priceCents, tierCurrency)}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayTiers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No pricing tiers found</p>
              )}
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
                  {data!.usageByCategory.map((u: any) => (
                    <div key={u.eventType} className="p-2 rounded-lg border border-border/30 bg-white/[0.03]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{EVENT_LABELS[u.eventType] || u.eventType}</span>
                        <span className="text-xs font-mono text-emerald-400">${(u.totalCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{u.totalEvents.toLocaleString()} events</span>
                        {u.unbilledCents > 0 && (
                          <span className="text-[10px] text-amber-400">${(u.unbilledCents / 100).toFixed(2)} unbilled</span>
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
                  {data!.revenueByOrg.sort((a: any, b: any) => b.total - a.total).map((o: any) => {
                    const maxTotal = Math.max(...data!.revenueByOrg.map((x: any) => x.total));
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
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Invoice #</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Institution</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Service</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Amount</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Status</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.invoices.slice(0, 20).map((inv: any) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`invoice-row-${inv.id}`}>
                        <td className="py-1.5 px-2"><span className="text-[10px] text-cyan-400 font-mono">{inv.invoiceNumber}</span></td>
                        <td className="py-1.5 px-2"><span className="text-[10px] text-white truncate block max-w-[180px]">{inv.institutionName}</span></td>
                        <td className="py-1.5 px-2"><span className="text-[10px] text-muted-foreground">{inv.serviceType}</span></td>
                        <td className="py-1.5 px-2 text-right"><span className="text-[10px] text-emerald-400 font-mono">${parseFloat(inv.amount).toLocaleString()}</span></td>
                        <td className="py-1.5 px-2">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right"><span className="text-[10px] text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cyan-400">Per-Country Monetization</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Each country has its own pricing in local currency reflecting regional market conditions.
                  Click any green price above to edit it. Use the country filter to switch between jurisdictions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
