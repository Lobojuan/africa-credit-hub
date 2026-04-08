import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrendingUp, FileText, CreditCard, Building2, Tag, Globe, ChevronDown, Calendar, Hash, DollarSign, Clock, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { detectLocalCurrency, getCurrencySymbol } from "@/lib/currency";

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
  const cs = getCurrencySymbol(detectLocalCurrency());
  const { toast } = useToast();
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("Global");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

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

  const { data: tiersData } = useQuery<{
    pricingTiers: any[];
    count: number;
  }>({
    queryKey: ["/api/platform/pricing-tiers-standalone"],
    refetchOnMount: "always",
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, unitPriceCents }: { id: string; unitPriceCents: number }) => {
      await apiRequest("PUT", `/api/platform/pricing-tiers-standalone/${id}`, { unitPriceCents });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/pricing-tiers-standalone"] });
      toast({ title: "Pricing tier updated" });
      setEditingTier(null);
    },
  });

  const s = data?.summary;
  const rawTiers = tiersData?.pricingTiers || data?.pricingTiers;
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
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">{cs}{(s?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{cs}{(s?.paidRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Collected</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{cs}{(s?.pendingRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{cs}{(s?.overdueRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{s?.invoiceCount || 0}</p>
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
              <h3 className="text-sm font-semibold text-foreground">Pricing Tiers</h3>
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
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
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
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
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
                  <tr className="border-b border-border">
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
                      <tr key={tier.id} className="border-b border-border/50 hover:bg-muted transition-colors" data-testid={`pricing-tier-${tier.id}`}>
                        {selectedCountry === "all" && (
                          <td className="py-1.5 px-2">
                            <span className="text-[10px] text-amber-400 font-medium">{tierCountry}</span>
                          </td>
                        )}
                        <td className="py-1.5 px-2">
                          <span className="text-xs text-foreground">{tier.name}</span>
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
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-border text-muted-foreground">{tierCurrency}</Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {editingTier === tier.id ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Input
                                className="h-6 w-20 text-[10px] bg-muted border-border text-foreground px-1"
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
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">Usage by Category</h3>
              </div>
              {(data?.usageByCategory || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No usage events recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {data!.usageByCategory.map((u: any) => (
                    <div key={u.eventType} className="p-2 rounded-lg border border-border/30 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{EVENT_LABELS[u.eventType] || u.eventType}</span>
                        <span className="text-xs font-mono text-emerald-400">{cs}{(u.totalCents / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{u.totalEvents.toLocaleString()} events</span>
                        {u.unbilledCents > 0 && (
                          <span className="text-[10px] text-amber-400">{cs}{(u.unbilledCents / 100).toFixed(2)} unbilled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Revenue by Organization</h3>
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
                        <span className="text-[10px] text-emerald-400 font-mono w-[60px] text-right">{cs}{o.total.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground w-[30px] text-right">{o.invoiceCount}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Recent Invoices</h3>
            </div>
            {(data?.invoices || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-6 py-2 px-2"></th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Invoice #</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Institution</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Service</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Amount</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Status</th>
                      <th className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.invoices.slice(0, 20).map((inv: any) => {
                      const isExpanded = expandedInvoiceId === inv.id;
                      const cur = CURRENCY_SYMBOLS[inv.currency] || inv.currency || "$";
                      return (
                        <React.Fragment key={inv.id}>
                          <tr
                            className="border-b border-border/50 hover:bg-muted transition-colors cursor-pointer"
                            data-testid={`invoice-row-${inv.id}`}
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                          >
                            <td className="py-1.5 px-2">
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </td>
                            <td className="py-1.5 px-2"><span className="text-[10px] text-cyan-400 font-mono">{inv.invoiceNumber}</span></td>
                            <td className="py-1.5 px-2"><span className="text-[10px] text-foreground truncate block max-w-[180px]">{inv.institutionName}</span></td>
                            <td className="py-1.5 px-2"><span className="text-[10px] text-muted-foreground">{inv.serviceType}</span></td>
                            <td className="py-1.5 px-2 text-right"><span className="text-[10px] text-emerald-400 font-mono">{cs}{parseFloat(inv.amount).toLocaleString()}</span></td>
                            <td className="py-1.5 px-2">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="py-1.5 px-2 text-right"><span className="text-[10px] text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</span></td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/40" data-testid={`invoice-detail-${inv.id}`}>
                              <td colSpan={7} className="p-0">
                                <div className="px-6 py-4 space-y-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-cyan-400" />
                                    <span className="text-sm font-semibold text-foreground">{inv.invoiceNumber}</span>
                                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                                      {inv.status}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Landmark className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Institution</p>
                                      </div>
                                      <p className="text-xs font-medium truncate">{inv.institutionName}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Tag className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Service</p>
                                      </div>
                                      <p className="text-xs font-medium">{inv.serviceType}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
                                      </div>
                                      <p className="text-xs font-bold text-emerald-500">{cur}{parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Currency</p>
                                      </div>
                                      <p className="text-xs font-medium">{inv.currency || "USD"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Hash className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Invoice ID</p>
                                      </div>
                                      <p className="text-[10px] font-mono text-muted-foreground truncate">{inv.id}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Invoice Date</p>
                                      </div>
                                      <p className="text-xs font-medium">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Period Start</p>
                                      </div>
                                      <p className="text-xs font-medium">{inv.periodStart ? new Date(inv.periodStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Period End</p>
                                      </div>
                                      <p className="text-xs font-medium">{inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
