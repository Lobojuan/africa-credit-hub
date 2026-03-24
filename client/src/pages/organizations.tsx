import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, getCurrencyForCountry, getCurrencySymbol, getModeCurrencies } from "@/lib/currency";
import { isGhanaMode, getDefaultCountry } from "@/lib/country-mode";
import {
  Building2, Plus, Users, BarChart3, Globe, Edit, Trash2, Loader2,
  CreditCard, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle,
  ChevronRight, ArrowLeft, Mail, Phone, ExternalLink, Shield, TrendingUp,
  Receipt, Eye, Sparkles, Zap, Crown, Search, MapPin, Wallet, Activity,
  FileText, UserCircle, ChevronDown, ChevronUp, PieChart as PieChartIcon, Download,
  Ban, PlayCircle, Pause
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const ORG_TYPES = [
  { value: "bank", label: "Bank", icon: Building2, color: "text-blue-500" },
  { value: "microfinance", label: "Microfinance", icon: Wallet, color: "text-green-500" },
  { value: "insurance", label: "Insurance", icon: Shield, color: "text-purple-500" },
  { value: "telecom", label: "Telecom", icon: Zap, color: "text-orange-500" },
  { value: "fintech", label: "Fintech", icon: Sparkles, color: "text-cyan-500" },
  { value: "utility", label: "Utility", icon: Activity, color: "text-yellow-500" },
  { value: "government", label: "Government", icon: Building2, color: "text-red-500" },
  { value: "regulator", label: "Regulator", icon: Shield, color: "text-indigo-500" },
  { value: "real_estate", label: "Real Estate", icon: MapPin, color: "text-emerald-500" },
  { value: "investment", label: "Investment", icon: TrendingUp, color: "text-amber-500" },
  { value: "other", label: "Other", icon: Globe, color: "text-muted-foreground" },
];

const SUBSCRIPTION_TIERS = [
  { value: "standard", label: "Standard", price: "$299/mo", color: "bg-muted text-foreground dark:bg-foreground dark:text-muted-foreground", icon: null },
  { value: "professional", label: "Professional", price: "$799/mo", color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 dark:bg-blue-900/40 dark:text-blue-300", icon: Zap },
  { value: "enterprise", label: "Enterprise", price: "$1,999/mo", color: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 dark:bg-purple-900/40 dark:text-purple-300", icon: Crown },
];

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dur = 800;
    const start = performance.now();
    const from = display;
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function PaymentHealthBadge({ health }: { health: string }) {
  const configs: Record<string, { label: string; icon: any; cls: string }> = {
    current: { label: "Paid Up", icon: CheckCircle2, cls: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
    pending: { label: "Payment Due", icon: Clock, cls: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    overdue: { label: "Overdue", icon: AlertTriangle, cls: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
    no_invoices: { label: "New Client", icon: Sparkles, cls: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  };
  const cfg = configs[health] || configs.no_invoices;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${cfg.cls}`} data-testid="badge-payment-health">
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500", suspended: "bg-yellow-500", pending: "bg-blue-500", deactivated: "bg-red-500",
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "active" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status] || "bg-muted-foreground"}`} />
    </span>
  );
}

function OrgTypeIcon({ type }: { type: string }) {
  const cfg = ORG_TYPES.find(t => t.value === type) || ORG_TYPES[ORG_TYPES.length - 1];
  const Icon = cfg.icon;
  return <Icon className={`w-5 h-5 ${cfg.color}`} />;
}

function CountryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = SUPPORTED_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );
  if (isGhanaMode()) {
    return (
      <div className="space-y-2">
        <Input value="Ghana" disabled className="bg-muted" data-testid="input-country-search" />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search 54 African countries..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-country-search"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto rounded-lg border p-2">
        {filtered.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => onChange(c.name)}
            data-testid={`button-country-${c.code}`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 text-left
              ${value === c.name
                ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                : "hover:bg-muted/80 active:scale-95"
              }`}
          >
            <span className="text-base leading-none">{getFlagEmoji(c.code)}</span>
            <span className="truncate">{c.name}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-3 text-center text-xs text-muted-foreground py-3">No countries found</p>}
      </div>
    </div>
  );
}

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const modeCurrencies = getModeCurrencies();
  const filtered = modeCurrencies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search currencies..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-currency-search" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-lg border p-2">
        {filtered.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => onChange(c.code)}
            data-testid={`button-currency-${c.code}`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 text-left
              ${value === c.code
                ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                : "hover:bg-muted/80 active:scale-95"
              }`}
          >
            <span className="font-mono font-bold text-sm w-6">{c.symbol}</span>
            <span className="truncate">{c.code} — {c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getFlagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65));
}

function getCountryCode(name: string) {
  return SUPPORTED_COUNTRIES.find(c => c.name === name)?.code || "";
}

function CreateOrgDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", slug: "", type: "bank", status: "active", country: "",
    contactEmail: "", contactPhone: "", address: "", website: "",
    subscriptionTier: "standard", maxUsers: 10, currency: "USD",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { currency, ...orgData } = data;
      const res = await apiRequest("POST", "/api/admin/organizations", orgData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-stats"] });
      toast({ title: "Client onboarded successfully" });
      onOpenChange(false);
      setStep(1);
      setForm({ name: "", slug: "", type: "bank", status: "active", country: "", contactEmail: "", contactPhone: "", address: "", website: "", subscriptionTier: "standard", maxUsers: 10, currency: "USD" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canNext = () => {
    if (step === 1) return form.name.length > 0 && form.slug.length > 0;
    if (step === 2) return form.country.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setStep(1); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            Onboard New Client
          </DialogTitle>
        </DialogHeader>

        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
          {["Basics", "Location", "Plan", "Contact"].map((l, i) => (
            <span key={l} className={`transition-colors ${step > i ? "text-primary font-medium" : step === i + 1 ? "text-foreground font-medium" : ""}`}>{l}</span>
          ))}
        </div>

        <div className="min-h-[260px]">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label className="text-xs font-medium">Organization Name</Label>
                <Input data-testid="input-org-name" value={form.name} onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  setForm({ ...form, name, slug });
                }} placeholder="e.g. National Bank of Kenya" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">URL Slug</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">cdh.sim.co/</span>
                  <Input data-testid="input-org-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Organization Type</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                  {ORG_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        data-testid={`button-type-${t.value}`}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs transition-all duration-200 border
                          ${form.type === t.value
                            ? "border-primary bg-primary/5 shadow-sm scale-[1.03]"
                            : "border-transparent hover:bg-muted/60 active:scale-95"
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${t.color}`} />
                        <span className="truncate w-full text-center">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label className="text-xs font-medium mb-2 block">Country</Label>
                <CountryPicker value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Preferred Currency</Label>
                <CurrencyPicker value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="text-xs font-medium">Subscription Plan</Label>
              <div className="grid gap-3">
                {SUBSCRIPTION_TIERS.map(t => {
                  const TierIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, subscriptionTier: t.value, maxUsers: t.value === "enterprise" ? 100 : t.value === "professional" ? 50 : 10 })}
                      data-testid={`button-tier-${t.value}`}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left
                        ${form.subscriptionTier === t.value
                          ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                          : "border-muted hover:border-muted-foreground/20 hover:shadow-sm"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.color}`}>
                        {TierIcon ? <TierIcon className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{t.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.value === "standard" && "Up to 10 users, basic reports"}
                          {t.value === "professional" && "Up to 50 users, advanced analytics"}
                          {t.value === "enterprise" && "Unlimited users, full API access"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{t.price}</div>
                        <div className="text-[10px] text-muted-foreground">billed monthly</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Contact Email</Label>
                  <Input data-testid="input-org-email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="admin@org.com" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Contact Phone</Label>
                  <Input data-testid="input-org-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+254..." className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Website</Label>
                <Input data-testid="input-org-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City" className="mt-1" />
              </div>

              <Separator />
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <h4 className="font-medium text-sm">Summary</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Name</span><span className="font-medium">{form.name}</span>
                  <span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{form.type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">Country</span><span className="font-medium">{form.country} {form.country && getFlagEmoji(getCountryCode(form.country))}</span>
                  <span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{form.subscriptionTier}</span>
                  <span className="text-muted-foreground">Currency</span><span className="font-medium">{form.currency}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between mt-4">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)} data-testid="button-back">
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          <div className="flex gap-2">
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()} data-testid="button-next">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button data-testid="button-create-org" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.slug}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Onboard Client
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StripeActions({ orgId, tier }: { orgId: number; tier: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (selectedTier: string) => {
    setLoading(selectedTier);
    try {
      const res = await apiRequest("POST", "/api/stripe/checkout", {
        organizationId: orgId,
        tier: selectedTier,
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {
        organizationId: orgId,
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Portal Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Stripe Subscription</p>
      <div className="grid gap-2">
        {SUBSCRIPTION_TIERS.map((t) => (
          <Button
            key={t.value}
            variant={tier === t.value ? "default" : "outline"}
            size="sm"
            className="w-full justify-between text-xs"
            disabled={loading !== null}
            onClick={() => handleCheckout(t.value)}
            data-testid={`btn-stripe-${t.value}`}
          >
            <span className="flex items-center gap-2">
              {t.icon && <t.icon className="w-3 h-3" />}
              {t.label}
              {tier === t.value && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Current</Badge>}
            </span>
            <span>{t.price}</span>
            {loading === t.value && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={handlePortal}
        disabled={loading !== null}
        data-testid="btn-stripe-portal"
      >
        <ExternalLink className="w-3 h-3 mr-2" />
        Manage in Stripe Portal
        {loading === "portal" && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
      </Button>
    </div>
  );
}

function BillingTab({ org }: { org: any }) {
  const { toast } = useToast();
  const orgDefaultCurrency = getCurrencyForCountry(org.country || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    serviceType: "subscription",
    amount: "",
    currency: orgDefaultCurrency,
    status: "pending",
    periodStart: "",
    periodEnd: "",
  });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: typeof invoiceForm) => {
      const res = await apiRequest("POST", `/api/admin/organizations/${org.id}/billing`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", org.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Invoice created successfully" });
      setCreateOpen(false);
      setInvoiceForm({ serviceType: "subscription", amount: "", currency: orgDefaultCurrency, status: "pending", periodStart: "", periodEnd: "" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleDownloadPdf = async (billingId: string, invoiceNumber: string) => {
    try {
      setDownloadingId(billingId);
      const response = await fetch(`/api/admin/organizations/${org.id}/billing/${billingId}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Invoice PDF downloaded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" /> Invoices
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-generate-invoice">
          <Plus className="w-4 h-4 mr-1" /> Generate Invoice
        </Button>
      </div>
      <Card>
        <CardContent className="p-5">
          {org.billing?.records?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Invoice</th>
                    <th className="text-left py-2 font-medium">Service</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Currency</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Period</th>
                    <th className="text-right py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {org.billing.records.map((rec: any, i: number) => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-invoice-${i}`}>
                      <td className="py-2.5 font-mono text-xs">{rec.invoiceNumber}</td>
                      <td className="py-2.5">{rec.serviceType}</td>
                      <td className="py-2.5 text-right font-medium">{parseFloat(rec.amount).toLocaleString()}</td>
                      <td className="py-2.5">{rec.currency}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${rec.status === "paid" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900/30 dark:text-green-400" :
                            rec.status === "overdue" ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                          {rec.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> : rec.status === "overdue" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{rec.periodStart} — {rec.periodEnd}</td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDownloadPdf(rec.id, rec.invoiceNumber); }}
                          disabled={downloadingId === rec.id}
                          data-testid={`button-download-pdf-${i}`}
                        >
                          {downloadingId === rec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No billing records yet</p>
              <p className="text-xs text-muted-foreground mt-1">Generate an invoice to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              Generate Invoice for {org.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="text-xs font-medium">Service Type</Label>
              <Select value={invoiceForm.serviceType} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, serviceType: v })}>
                <SelectTrigger className="mt-1" data-testid="select-service-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="api_access">API Access</SelectItem>
                  <SelectItem value="credit_report">Credit Report</SelectItem>
                  <SelectItem value="data_submission">Data Submission</SelectItem>
                  <SelectItem value="setup_fee">Setup Fee</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="mt-1"
                  data-testid="input-invoice-amount"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Currency</Label>
                <Select value={invoiceForm.currency} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, currency: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-invoice-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ETB">ETB</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="GHS">GHS</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select value={invoiceForm.status} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, status: v })}>
                <SelectTrigger className="mt-1" data-testid="select-invoice-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Period Start</Label>
                <Input
                  type="date"
                  value={invoiceForm.periodStart}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
                  className="mt-1"
                  data-testid="input-period-start"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Period End</Label>
                <Input
                  type="date"
                  value={invoiceForm.periodEnd}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
                  className="mt-1"
                  data-testid="input-period-end"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createInvoiceMutation.mutate(invoiceForm)}
              disabled={createInvoiceMutation.isPending || !invoiceForm.amount}
              data-testid="button-submit-invoice"
            >
              {createInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrgDetailPanel({ orgId, onBack }: { orgId: string; onBack: () => void }) {
  const { data: org, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/organizations", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${orgId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const toggleStatusMutation = useMutation({
    mutationFn: async (action: "suspend" | "reactivate") => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${orgId}`, {
        status: action === "suspend" ? "suspended" : "active",
      });
      return res.json();
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: action === "suspend" ? "Client Suspended" : "Client Reactivated",
        description: action === "suspend"
          ? "All users under this client are now blocked until payment is received."
          : "Client access has been restored. Users can log in again.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading client details...</span>
        </div>
      </div>
    );
  }
  if (!org) return null;

  const cc = getCountryCode(org.country || "");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-6 duration-400">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="default" onClick={onBack} data-testid="button-back-to-list" className="gap-2 shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="w-4 h-4" />
          Back to All Clients
        </Button>
      </div>

      <div className="rounded-2xl border bg-gradient-to-br from-background to-muted/30 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg">
                <OrgTypeIcon type={org.type} />
              </div>
              <div>
                <h2 className="text-xl font-bold" data-testid="text-detail-org-name">{org.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={org.status} />
                    <span className="text-sm capitalize">{org.status}</span>
                  </div>
                  {cc && <span className="text-lg">{getFlagEmoji(cc)}</span>}
                  {org.country && <span className="text-sm text-muted-foreground">{org.country}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {org.billing?.paymentHealth && <PaymentHealthBadge health={org.billing.paymentHealth} />}
              {org.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-950 hover:text-amber-800 dark:text-amber-200 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  data-testid="button-suspend-detail"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => {
                    if (confirm(`Suspend ${org.name}? All their users will be blocked until you reactivate.`))
                      toggleStatusMutation.mutate("suspend");
                  }}
                >
                  {toggleStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                  Suspend Client
                </Button>
              ) : org.status === "suspended" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:bg-green-950 hover:text-green-800 dark:text-green-200 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  data-testid="button-reactivate-detail"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => toggleStatusMutation.mutate("reactivate")}
                >
                  {toggleStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Reactivate Client
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-testid="button-edit-detail">
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Contact", value: org.contactEmail || "—", icon: Mail },
              { label: "Phone", value: org.contactPhone || "—", icon: Phone },
              { label: "Website", value: org.website ? (() => { try { return new URL(org.website.startsWith("http") ? org.website : `https://${org.website}`).hostname; } catch { return org.website; } })() : "—", icon: ExternalLink },
              { label: "Slug", value: org.slug, icon: Globe },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-background/60 border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {org.status === "suspended" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 dark:bg-amber-900/20 p-4" data-testid="banner-suspended">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200 dark:text-amber-300 text-sm">Account Suspended</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 dark:text-amber-400">This client's users are currently blocked from accessing the platform. Click "Reactivate Client" above once payment has been received.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:bg-green-950 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
            data-testid="button-reactivate-banner"
            disabled={toggleStatusMutation.isPending}
            onClick={() => toggleStatusMutation.mutate("reactivate")}
          >
            {toggleStatusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            Reactivate
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(() => {
          const orgCurrency = getCurrencySymbol(getCurrencyForCountry(org.country || ""));
          return [
            { label: "Total Billed", value: org.billing?.totalBilled || 0, prefix: orgCurrency + " ", icon: Receipt, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Total Paid", value: org.billing?.totalPaid || 0, prefix: orgCurrency + " ", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Pending", value: org.billing?.totalPending || 0, prefix: orgCurrency + " ", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Overdue", value: org.billing?.totalOverdue || 0, prefix: orgCurrency + " ", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          ];
        })().map(item => (
          <Card key={item.label} className="overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold"><AnimatedNumber value={Math.round(item.value)} prefix={item.prefix} /></p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing ({org.billing?.invoiceCount || 0})</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users ({org.userCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Portfolio Statistics</h3>
                <div className="space-y-3">
                  {[
                    { label: "Borrowers", value: org.stats?.totalBorrowers || 0, icon: Users },
                    { label: "Credit Accounts", value: org.stats?.totalAccounts || 0, icon: CreditCard },
                    { label: "Active Inquiries", value: org.stats?.totalInquiries || 0, icon: Search },
                    { label: "Delinquent", value: org.stats?.delinquentAccounts || 0, icon: AlertTriangle },
                    { label: "Defaults", value: org.stats?.defaultedAccounts || 0, icon: XCircle },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5" />{item.label}
                      </span>
                      <span className="font-semibold text-sm"><AnimatedNumber value={item.value} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Subscription & Compliance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge className={SUBSCRIPTION_TIERS.find(t => t.value === org.subscriptionTier)?.color || ""}>
                      {org.subscriptionTier?.charAt(0).toUpperCase() + org.subscriptionTier?.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Max Users</span>
                    <span className="font-medium text-sm">{org.maxUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Users Used</span>
                    <span className="font-medium text-sm">{org.userCount} / {org.maxUsers}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        (org.userCount / (org.maxUsers || 1)) > 0.8 ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, (org.userCount / (org.maxUsers || 1)) * 100)}%` }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Disputes</span>
                    <span className="font-medium text-sm">{org.activeDisputeCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium text-sm">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                  <Separator />
                  <StripeActions orgId={org.id} tier={org.subscriptionTier} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <BillingTab org={org} />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-5">
              {org.users?.length > 0 ? (
                <div className="space-y-2">
                  {org.users.map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors" data-testid={`row-user-${u.id}`}>
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.username} — {u.email || "No email"}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={u.status} />
                        <span className="text-xs capitalize">{u.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No users assigned to this organization</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editOpen && <EditOrgDialog org={org} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#06b6d4"];
const TIER_COLORS: Record<string, string> = { Standard: "#94a3b8", Professional: "#3b82f6", Enterprise: "#a855f7" };
const PAYMENT_COLORS: Record<string, string> = { Paid: "#10b981", Pending: "#f59e0b", Overdue: "#ef4444" };

function RevenueAnalytics() {
  const [expanded, setExpanded] = useState(false);
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    enabled: expanded,
  });

  return (
    <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20" data-testid="section-analytics">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover-elevate rounded-xl"
        data-testid="button-toggle-analytics"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Revenue Analytics</h3>
            <p className="text-xs text-muted-foreground">Monthly revenue, subscriptions & payment health</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Separator />
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading analytics...</span>
              </div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Monthly Recurring", value: analytics.summary?.totalMRR || 0, prefix: "$", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Annual Recurring", value: analytics.summary?.totalARR || 0, prefix: "$", icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Total Collected", value: analytics.summary?.totalCollected || 0, prefix: "$", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                  { label: "Outstanding", value: analytics.summary?.totalOutstanding || 0, prefix: "$", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map(item => (
                  <Card key={item.label}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold"><AnimatedNumber value={Math.round(item.value)} prefix={item.prefix} /></p>
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" data-testid="text-chart-revenue-title">
                      <BarChart3 className="w-4 h-4 text-primary" /> Monthly Revenue
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyRevenue || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                          />
                          <Bar dataKey="revenue" name="Billed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" data-testid="text-chart-subscription-title">
                      <PieChartIcon className="w-4 h-4 text-primary" /> Subscription Tiers
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.subscriptionBreakdown || []}
                            cx="50%"
                            cy="45%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {(analytics.subscriptionBreakdown || []).map((entry: any, idx: number) => (
                              <Cell key={entry.name} fill={TIER_COLORS[entry.name] || CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number, name: string) => [`${value} clients`, name]}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" data-testid="text-chart-payment-title">
                      <Receipt className="w-4 h-4 text-primary" /> Payment Status
                    </h4>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.paymentStatusBreakdown || []}
                            cx="50%"
                            cy="45%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {(analytics.paymentStatusBreakdown || []).map((entry: any) => (
                              <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || "#94a3b8"} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number, name: string, props: any) => [`${value} invoices ($${(props.payload.amount || 0).toLocaleString()})`, name]}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" data-testid="text-chart-growth-title">
                      <TrendingUp className="w-4 h-4 text-primary" /> Client Growth
                    </h4>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.clientGrowth || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          />
                          <Line type="monotone" dataKey="clients" name="Active Clients" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EditOrgDialog({ org, open, onOpenChange }: { org: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: org.name, type: org.type, status: org.status, country: org.country || "",
    contactEmail: org.contactEmail || "", contactPhone: org.contactPhone || "",
    website: org.website || "", subscriptionTier: org.subscriptionTier, maxUsers: org.maxUsers || 10,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${org.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organization updated" });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-primary" />
            Edit {org.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="text-xs font-medium">Name</Label>
            <Input data-testid="input-edit-org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["active", "suspended", "pending", "deactivated"].map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">Country</Label>
            <CountryPicker value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Subscription Tier</Label>
              <Select value={form.subscriptionTier} onValueChange={(v) => setForm({ ...form, subscriptionTier: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label} ({t.price})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Max Users</Label>
              <Input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Contact Email</Label>
              <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1" />
            </div>
          </div>
          <Button data-testid="button-update-org" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrganizationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const resetHandler = () => setSelectedOrgId(null);
    window.addEventListener("organizations:reset", resetHandler);
    window.addEventListener("popstate", resetHandler);
    return () => {
      window.removeEventListener("organizations:reset", resetHandler);
      window.removeEventListener("popstate", resetHandler);
    };
  }, []);

  const { data: organizations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: platformStats } = useQuery<any>({
    queryKey: ["/api/admin/platform-stats"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-stats"] });
      toast({ title: "Organization deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "suspend" | "reactivate" }) => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${id}`, {
        status: action === "suspend" ? "suspended" : "active",
      });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-stats"] });
      toast({
        title: vars.action === "suspend" ? "Client Suspended" : "Client Reactivated",
        description: vars.action === "suspend"
          ? "All users under this client are now blocked until payment is received."
          : "Client access has been restored.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = organizations.filter(org => {
    const matchSearch = !searchTerm || org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.country || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || org.status === filterStatus;
    const matchTier = filterTier === "all" || org.subscriptionTier === filterTier;
    return matchSearch && matchStatus && matchTier;
  });

  if (selectedOrgId) {
    return (
      <div className="p-4 md:p-6">
        <OrgDetailPanel orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading platform data...</span>
        </div>
      </div>
    );
  }

  const overdueCount = organizations.filter(o => o.billing?.paymentHealth === "overdue").length;
  const pendingPayCount = organizations.filter(o => o.billing?.paymentHealth === "pending").length;
  const totalRevenue = organizations.reduce((s, o) => s + (o.billing?.totalPaid || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Client Management</h1>
          <p className="text-sm text-muted-foreground">Manage SaaS clients, subscriptions, and billing across Africa</p>
        </div>
        <Button data-testid="button-new-org" onClick={() => setCreateOpen(true)} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-4 h-4" />
          Onboard Client
        </Button>
      </div>

      {platformStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Clients", value: platformStats.totalOrganizations, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: platformStats.activeOrganizations, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Revenue (USD)", value: totalRevenue, prefix: "$", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Users", value: platformStats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Pending Payments", value: pendingPayCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: overdueCount > 0 ? "text-red-500" : "text-muted-foreground", bg: overdueCount > 0 ? "bg-red-500/10" : "bg-muted" },
          ].map(item => (
            <Card key={item.label} className="group hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none"><AnimatedNumber value={item.value} prefix={item.prefix || ""} /></p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RevenueAnalytics />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, slug, or country..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-orgs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-36" data-testid="select-filter-tier"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map((org: any, index: number) => {
          const cc = getCountryCode(org.country || "");
          const tierCfg = SUBSCRIPTION_TIERS.find(t => t.value === org.subscriptionTier);
          return (
            <Card
              key={org.id}
              data-testid={`card-org-${org.id}`}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => setSelectedOrgId(org.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <OrgTypeIcon type={org.type} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" data-testid={`text-org-name-${org.id}`}>{org.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={org.status} />
                        <span className="text-xs capitalize text-muted-foreground">{org.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {cc && <span>{getFlagEmoji(cc)}</span>}
                      {org.country && <span>{org.country}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.userCount}</span>
                      <span className="capitalize">{org.type?.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Borrowers</p>
                      <p className="font-semibold text-sm">{org.stats?.totalBorrowers || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Accounts</p>
                      <p className="font-semibold text-sm">{org.stats?.totalAccounts || 0}</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-muted-foreground">Billed</p>
                      <p className="font-semibold text-sm">{getCurrencySymbol(getCurrencyForCountry(org.country || ""))} {(org.billing?.totalBilled || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {org.billing?.paymentHealth && (
                    <div className="hidden md:block">
                      <PaymentHealthBadge health={org.billing.paymentHealth} />
                    </div>
                  )}

                  <Badge variant="outline" className={`hidden lg:inline-flex ${tierCfg?.color || ""} text-xs`}>
                    {org.subscriptionTier}
                  </Badge>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {org.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-950 hover:text-amber-800 dark:text-amber-200 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-suspend-org-${org.id}`}
                        disabled={suspendMutation.isPending}
                        onClick={() => {
                          if (confirm(`Suspend ${org.name}? All their users will be blocked until you reactivate.`))
                            suspendMutation.mutate({ id: org.id, action: "suspend" });
                        }}
                      >
                        {suspendMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                        Suspend
                      </Button>
                    ) : org.status === "suspended" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:bg-green-950 hover:text-green-800 dark:text-green-200 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                        data-testid={`button-reactivate-org-${org.id}`}
                        disabled={suspendMutation.isPending}
                        onClick={() => suspendMutation.mutate({ id: org.id, action: "reactivate" })}
                      >
                        {suspendMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                        Reactivate
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-view-org-${org.id}`} onClick={() => setSelectedOrgId(org.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" data-testid={`button-delete-org-${org.id}`}
                      onClick={() => { if (confirm(`Delete ${org.name}? This cannot be undone.`)) deleteMutation.mutate(org.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="font-semibold mb-1">
                {searchTerm || filterStatus !== "all" || filterTier !== "all" ? "No matching clients" : "No clients yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" || filterTier !== "all"
                  ? "Try adjusting your search or filters"
                  : "Onboard your first client to get started"
                }
              </p>
              {!searchTerm && filterStatus === "all" && filterTier === "all" && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Onboard First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
