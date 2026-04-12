import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  Shield, Lock, Globe, Building2, Plus, Trash2, Edit, Copy,
  Activity, DollarSign, Users, Server, LogOut, ChevronDown,
  ChevronRight, RefreshCw, Download, Database, Cpu, HardDrive,
  Wifi, WifiOff, CheckCircle2, XCircle, AlertTriangle, Clock,
  BarChart3, Eye, Layers, Zap, Key, Mail, MessageSquare,
  Smartphone, CreditCard, Fingerprint, ShieldCheck, Heart,
  TrendingUp, ArrowRightLeft,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const GHS = "\u20B5";

interface IntegrationItem {
  connected: boolean;
  label: string;
  detail?: string;
  icon?: LucideIcon;
}

interface SystemHealthData {
  timestamp: string;
  responseTimeMs: number;
  server: {
    version: string;
    nodeVersion: string;
    uptime: string;
    uptimeSeconds: number;
    memory: { rss: number; heapUsed: number; heapTotal: number; external: number };
    system: { platform: string; arch: string; cpus: number; totalMemoryMB: number; freeMemoryMB: number; loadAvg: number[]; hostname: string };
    pid: number;
  };
  database: {
    status: string;
    latencyMs: number;
    version: string;
    size: string;
    pool: { totalCount: number; idleCount: number; waitingCount: number };
  };
  integrations: Record<string, IntegrationItem>;
  envConfig: Record<string, string>;
  security: Record<string, boolean>;
}

interface DatabaseStats {
  tableCounts: Record<string, number>;
  piiStats: { totalPiiFields: number; encryptedPiiFields: number; encryptionPercent: number };
  recentActivity: {
    auditLogs24h: number; auditLogs7d: number; logins24h: number;
    failedLogins24h: number; creditReports24h: number; disputes7d: number; openDisputes: number;
  };
  orgBreakdown: Array<{ id: string; name: string; status: string; license_tier: string; country: string; created_at: string }>;
  userBreakdown: { byRole: Record<string, number>; mfaEnabled: number; totalActive: number };
}

interface TierInfo { count: number; mrrCents: number }
interface CountryInfo { count: number; mrrCents: number }
interface RevenueData {
  totalARRCents: number;
  byTier: Record<string, TierInfo>;
  byCountry: Record<string, CountryInfo>;
  localBilling: { totalBilledAllTime: number; billedLast30Days: number; totalWalletBalance: number; activeWallets: number };
  deploymentCount: number;
}

interface SummaryData {
  totalDeployments: number; activeDeployments: number; trialDeployments: number;
  suspendedDeployments: number; totalMRRCents: number; countriesServed: string[];
  totalBorrowers: number; totalInstitutions: number;
  localBorrowers: number; localOrganizations: number; localUsers: number;
}

interface UpdateLogEntry { timestamp: string; changes: string[]; note: string; previousStatus?: string }

function pcFetch(url: string, opts?: RequestInit) {
  return fetch(url, { credentials: "include", ...opts });
}

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    pcFetch("/api/platform-control/check")
      .then(r => r.json())
      .then(data => { if (data.authenticated) onAuthenticated(); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await pcFetch("/api/platform-control/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) onAuthenticated();
      else {
        const data = await res.json();
        setError(data.message || "Invalid master password");
      }
    } catch { setError("Connection failed"); }
    setLoading(false);
  };

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold" data-testid="text-master-gate-title">Platform Control</h1>
          <p className="text-sm text-muted-foreground">Authorized access only</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="password" placeholder="Master password" value={password} onChange={e => setPassword(e.target.value)} autoFocus data-testid="input-master-password" />
          {error && <p className="text-sm text-red-500" data-testid="text-auth-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !password} data-testid="button-master-login">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Authenticate
          </Button>
        </form>
      </div>
    </div>
  );
}

type Deployment = {
  id: string; clientName: string; country: string; region?: string; deploymentUrl?: string;
  status: string; licenseTier: string; monthlyFeeCents?: number; platformFeePercent?: number;
  currency: string; branding?: string; deploymentDate?: string;
  contactName?: string; contactEmail?: string;
  totalBorrowers?: number; totalInstitutions?: number;
  lastSyncAt?: string; configSnapshot?: Record<string, string>; updateLog?: UpdateLogEntry[];
  notes?: string; createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const v: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    suspended: "bg-red-500/10 text-red-500 border-red-500/30",
    decommissioned: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
    healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    slow: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    error: "bg-red-500/10 text-red-500 border-red-500/30",
  };
  return <Badge variant="outline" className={v[status] || ""}>{status}</Badge>;
}

function IntegrationDot({ connected }: { connected: boolean }) {
  return connected
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
    : <XCircle className="w-4 h-4 text-zinc-400 shrink-0" />;
}

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: LucideIcon; sub?: string | React.ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${color || "text-muted-foreground"}`} />
      </div>
      <p className="text-2xl font-bold" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Panel({ title, icon: Icon, children, defaultOpen = true, color = "text-primary" }: { title: string; icon: LucideIcon; children: React.ReactNode; defaultOpen?: boolean; color?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/50 transition-colors" data-testid={`panel-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <Icon className={`w-4 h-4 ${color} shrink-0`} />
        <span className="text-sm font-semibold flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border pt-3">{children}</div>}
    </div>
  );
}

function formatCurrency(cents: number | undefined | null, currency: string = "GHS") {
  if (!cents) return `${GHS}0`;
  const symbol = currency === "GHS" ? GHS : currency === "USD" ? "$" : currency;
  return `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function DeploymentForm({ deployment, onClose }: { deployment?: Deployment; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [updateNote, setUpdateNote] = useState("");
  type DeploymentFormState = Record<string, string>;
  const [form, setForm] = useState<DeploymentFormState>({
    clientName: deployment?.clientName || "", country: deployment?.country || "",
    region: deployment?.region || "", deploymentUrl: deployment?.deploymentUrl || "",
    status: deployment?.status || "active", licenseTier: deployment?.licenseTier || "commercial",
    monthlyFeeCents: deployment?.monthlyFeeCents?.toString() || "", platformFeePercent: (deployment?.platformFeePercent ?? 15).toString(),
    currency: deployment?.currency || "GHS", branding: deployment?.branding || "",
    deploymentDate: deployment?.deploymentDate ? deployment.deploymentDate.split("T")[0] : "",
    contactName: deployment?.contactName || "", contactEmail: deployment?.contactEmail || "",
    totalBorrowers: deployment?.totalBorrowers?.toString() || "0", totalInstitutions: deployment?.totalInstitutions?.toString() || "0",
    notes: deployment?.notes || "",
  });
  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => deployment ? apiRequest("PATCH", `/api/platform-control/deployments/${deployment.id}`, data) : apiRequest("POST", "/api/platform-control/deployments", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control"] }); toast({ title: deployment ? "Updated" : "Created" }); onClose(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form, monthlyFeeCents: form.monthlyFeeCents ? parseInt(form.monthlyFeeCents) : null, platformFeePercent: form.platformFeePercent ? parseInt(form.platformFeePercent) : 15, totalBorrowers: parseInt(form.totalBorrowers) || 0, totalInstitutions: parseInt(form.totalInstitutions) || 0, deploymentDate: form.deploymentDate || null };
    if (deployment && updateNote) payload.updateNote = updateNote;
    mutation.mutate(payload);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "clientName", label: "Client Name *", req: true },
          { key: "country", label: "Country *", req: true },
          { key: "region", label: "Region" },
          { key: "deploymentUrl", label: "Deployment URL" },
          { key: "branding", label: "Branding / White Label" },
        ].map(f => (
          <div key={f.key} className="space-y-1">
            <label className="text-xs font-medium">{f.label}</label>
            <Input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} required={f.req} data-testid={`input-${f.key}`} />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-xs font-medium">Status</label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["active", "trial", "suspended", "decommissioned"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">License Tier</label>
          <Select value={form.licenseTier} onValueChange={v => setForm(f => ({ ...f, licenseTier: v }))}>
            <SelectTrigger data-testid="select-license-tier"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[{ v: "growth", l: "Growth (MFI)" }, { v: "commercial", l: "Commercial (Bank)" }, { v: "sovereign", l: "Sovereign" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {[
          { key: "monthlyFeeCents", label: "Monthly Fee (pesewas)", type: "number" },
          { key: "platformFeePercent", label: "Platform Fee %", type: "number" },
          { key: "currency", label: "Currency" },
          { key: "deploymentDate", label: "Deployment Date", type: "date" },
          { key: "contactName", label: "Contact Name" },
          { key: "contactEmail", label: "Contact Email" },
          { key: "totalBorrowers", label: "Total Borrowers", type: "number" },
          { key: "totalInstitutions", label: "Total Institutions", type: "number" },
        ].map(f => (
          <div key={f.key} className="space-y-1">
            <label className="text-xs font-medium">{f.label}</label>
            <Input type={f.type || "text"} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} data-testid={`input-${f.key}`} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Notes</label>
        <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-notes" />
      </div>
      {deployment && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Update Note (tracked in changelog)</label>
          <Input placeholder="e.g. Upgraded tier, adjusted fee..." value={updateNote} onChange={e => setUpdateNote(e.target.value)} data-testid="input-update-note" />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending} data-testid="button-save-deployment">
          {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
          {deployment ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function ConfigGenerator() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ clientName: "", country: "", currency: "GHS", regulatoryBody: "", brandTitle: "" });
  const [config, setConfig] = useState<{ config: Record<string, string>; instructions: string[] } | null>(null);
  const { toast } = useToast();
  const generate = async () => {
    try {
      const res = await pcFetch("/api/platform-control/generate-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setConfig(await res.json());
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };
  const copyConfig = () => {
    if (!config) return;
    navigator.clipboard.writeText(Object.entries(config.config).map(([k, v]) => `${k}=${v}`).join("\n"));
    toast({ title: "Copied to clipboard" });
  };
  return (
    <Panel title="Deployment Config Generator" icon={Server} defaultOpen={false} color="text-violet-500">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "clientName", label: "Client Name *" }, { key: "country", label: "Country *" },
            { key: "currency", label: "Currency" }, { key: "regulatoryBody", label: "Regulatory Body" },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium">{f.label}</label>
              <Input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} data-testid={`input-gen-${f.key}`} />
            </div>
          ))}
        </div>
        <Button onClick={generate} disabled={!form.clientName || !form.country} size="sm" data-testid="button-generate-config">
          <Download className="w-4 h-4 mr-2" /> Generate
        </Button>
        {config && (
          <div className="space-y-3">
            <div className="rounded-lg bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-x-auto">
              {Object.entries(config.config).map(([k, v]) => (
                <div key={k}><span className="text-emerald-400">{k}</span>=<span className="text-amber-300">{String(v)}</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyConfig} variant="outline" size="sm" data-testid="button-copy-config"><Copy className="w-3 h-3 mr-1" /> Copy .env</Button>
            </div>
            {config.instructions && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold">Setup Instructions:</p>
                {config.instructions.map((inst: string, i: number) => <p key={i} className="text-xs text-muted-foreground">{inst}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function SystemHealthPanel() {
  const { data, isLoading, refetch } = useQuery<SystemHealthData>({
    queryKey: ["/api/platform-control/system-health"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/system-health"); return r.json(); },
    refetchInterval: 30000,
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground p-4">Loading system health...</div>;

  const srv = data.server;
  const dba = data.database;
  const sec = data.security;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className={`w-4 h-4 ${dba.status === "healthy" ? "text-emerald-500" : dba.status === "slow" ? "text-amber-500" : "text-red-500"}`} />
          <span className="text-sm font-medium">Overall: {dba.status === "healthy" ? "All Systems Operational" : dba.status === "slow" ? "Degraded Performance" : "Issues Detected"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-health"><RefreshCw className="w-3 h-3" /></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Uptime" value={srv.uptime} icon={Clock} sub={`PID ${srv.pid}`} color="text-emerald-500" />
        <StatCard label="DB Latency" value={`${dba.latencyMs}ms`} icon={Database} sub={(<StatusBadge status={dba.status} />) as React.ReactNode} color="text-blue-500" />
        <StatCard label="Memory (Heap)" value={`${srv.memory.heapUsed}MB`} icon={HardDrive} sub={`/ ${srv.memory.heapTotal}MB total`} color="text-amber-500" />
        <StatCard label="Response Time" value={`${data.responseTimeMs}ms`} icon={Zap} sub="API response" color="text-violet-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Server</p>
          <div className="rounded-lg border border-border divide-y divide-border text-xs">
            {[
              ["Version", `v${srv.version}`], ["Node.js", srv.nodeVersion],
              ["Platform", `${srv.system.platform} ${srv.system.arch}`],
              ["CPUs", srv.system.cpus], ["System RAM", `${srv.system.freeMemoryMB}MB free / ${srv.system.totalMemoryMB}MB`],
              ["Load Average", srv.system.loadAvg.join(", ")],
              ["Process RSS", `${srv.memory.rss}MB`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between px-3 py-1.5">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database</p>
          <div className="rounded-lg border border-border divide-y divide-border text-xs">
            {[
              ["Status", dba.status], ["Latency", `${dba.latencyMs}ms`],
              ["Size", dba.size], ["Pool Total", dba.pool.totalCount],
              ["Pool Idle", dba.pool.idleCount], ["Pool Waiting", dba.pool.waitingCount],
              ["Version", (dba.version || "").split(",")[0]],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between px-3 py-1.5">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Posture</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "PII Encryption", ok: sec.piiEncrypted, icon: Lock },
            { label: "Session Secret", ok: sec.sessionSecretStrong, icon: Key },
            { label: "Rate Limiting", ok: sec.rateLimiting, icon: Shield },
            { label: "MFA Available", ok: sec.mfaAvailable, icon: Fingerprint },
            { label: "WebAuthn", ok: sec.webauthnAvailable, icon: Fingerprint },
            { label: "Blockchain Anchoring", ok: sec.blockchainAnchoring, icon: Layers },
            { label: "HMAC Webhooks", ok: sec.hmacWebhooks, icon: ShieldCheck },
            { label: "Production Mode", ok: sec.productionMode, icon: Server },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <IntegrationDot connected={s.ok} />
              <span className="text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environment Config</p>
        <div className="rounded-lg border border-border divide-y divide-border text-xs">
          {Object.entries(data.envConfig).map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-1.5">
              <span className="text-muted-foreground font-mono">{k}</span>
              <span className="font-medium">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsPanel() {
  const { data } = useQuery<SystemHealthData>({
    queryKey: ["/api/platform-control/system-health"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/system-health"); return r.json(); },
    staleTime: 15000,
  });

  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const groups = [
    { title: "Payments", items: [{ ...data.integrations.stripe, icon: CreditCard }] },
    { title: "Email", items: [{ ...data.integrations.sendgrid, icon: Mail }, { ...data.integrations.smtp, icon: Mail }] },
    { title: "SMS", items: [{ ...data.integrations.twilio, icon: MessageSquare }, { ...data.integrations.africasTalking, icon: Smartphone }] },
    { title: "Authentication", items: [{ ...data.integrations.googleOAuth, icon: Key }, { ...data.integrations.microsoftSSO, icon: Building2 }, { ...data.integrations.saml, icon: Shield }] },
    { title: "AI / LLM", items: [{ ...data.integrations.openai, icon: Cpu }, { ...data.integrations.anthropic, icon: Cpu }] },
    { title: "Security", items: [{ ...data.integrations.piiEncryption, icon: Lock }] },
  ];

  const totalConnected = Object.values(data.integrations).filter((i) => i.connected).length;
  const totalIntegrations = Object.values(data.integrations).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{totalConnected}/{totalIntegrations} connected</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map(g => (
          <div key={g.title} className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{g.title}</p>
            {g.items.map((item) => {
              const ItemIcon = item.icon || Wifi;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <IntegrationDot connected={item.connected} />
                  <ItemIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs flex-1">{item.label}</span>
                  {item.detail && <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{item.detail}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabaseStatsPanel() {
  const { data, isLoading, refetch } = useQuery<DatabaseStats>({
    queryKey: ["/api/platform-control/database-stats"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/database-stats"); return r.json(); },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground p-4">Loading database stats...</div>;

  const counts = data.tableCounts || {};
  const pii = data.piiStats || {};
  const activity = data.recentActivity || {};
  const users = data.userBreakdown || {};

  const sortedTables = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const totalRows = Object.values(counts).reduce((s, v) => s + Math.max(0, v), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{sortedTables.length} tables</Badge>
          <Badge variant="outline">{totalRows.toLocaleString()} total rows</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-db"><RefreshCw className="w-3 h-3" /></Button>
      </div>

      {pii.totalPiiFields > 0 && (
        <div className={`rounded-lg p-3 border ${pii.encryptionPercent >= 100 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${pii.encryptionPercent >= 100 ? "text-emerald-500" : "text-red-500"}`} />
              <span className="text-sm font-semibold">PII Encryption</span>
            </div>
            <span className="text-sm font-bold">{pii.encryptionPercent}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{pii.encryptedPiiFields}/{pii.totalPiiFields} fields encrypted (AES-256-GCM)</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${pii.encryptionPercent >= 100 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(pii.encryptionPercent, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Audit Logs (24h)" value={activity.auditLogs24h || 0} icon={Eye} sub={`${activity.auditLogs7d || 0} in 7 days`} />
        <StatCard label="Logins (24h)" value={activity.logins24h || 0} icon={Users} sub={`${activity.failedLogins24h || 0} failed`} color={activity.failedLogins24h > 10 ? "text-red-500" : undefined} />
        <StatCard label="Credit Reports (24h)" value={activity.creditReports24h || 0} icon={BarChart3} />
        <StatCard label="Open Disputes" value={activity.openDisputes || 0} icon={AlertTriangle} sub={`${activity.disputes7d || 0} new this week`} />
      </div>

      {users.byRole && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(users.byRole).map(([role, count]: [string, number]) => (
              <Badge key={role} variant="outline" className="text-xs">{role}: {count}</Badge>
            ))}
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">MFA: {users.mfaEnabled || 0}</Badge>
            <Badge variant="outline">Active: {users.totalActive || 0}</Badge>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table Sizes</p>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr><th className="text-left p-2 font-medium">Table</th><th className="text-right p-2 font-medium">Rows</th></tr>
              </thead>
              <tbody>
                {sortedTables.map(([table, count]) => (
                  <tr key={table} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-mono">{table}</td>
                    <td className="p-2 text-right font-medium">{count >= 0 ? count.toLocaleString() : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {data.orgBreakdown && data.orgBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organizations</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-center p-2 font-medium">Status</th>
                    <th className="text-center p-2 font-medium">Tier</th>
                    <th className="text-left p-2 font-medium">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orgBreakdown.map((org) => (
                    <tr key={org.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-medium">{org.name}</td>
                      <td className="p-2 text-center"><StatusBadge status={org.status} /></td>
                      <td className="p-2 text-center">{org.license_tier || "-"}</td>
                      <td className="p-2">{org.country || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RevenuePanel() {
  const { data, isLoading } = useQuery<RevenueData>({
    queryKey: ["/api/platform-control/revenue-overview"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/revenue-overview"); return r.json(); },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground p-4">Loading revenue...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total MRR" value={formatCurrency(data.totalARRCents / 12)} icon={DollarSign} color="text-emerald-500" />
        <StatCard label="Total ARR" value={formatCurrency(data.totalARRCents)} icon={TrendingUp} color="text-blue-500" />
        <StatCard label="Active Clients" value={data.deploymentCount} icon={Building2} />
        <StatCard label="Local Wallets" value={data.localBilling?.activeWallets || 0} icon={CreditCard} sub={`Balance: ${formatCurrency(data.localBilling?.totalWalletBalance)}`} />
      </div>

      {Object.keys(data.byTier || {}).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue by Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(data.byTier).map(([tier, info]: [string, { mrrCents: number; count: number }]) => (
              <div key={tier} className="rounded-lg border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground capitalize">{tier}</p>
                <p className="text-lg font-bold">{formatCurrency(info.mrrCents)}<span className="text-xs text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">{info.count} client{info.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(data.byCountry || {}).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue by Country</p>
          <div className="rounded-lg border border-border divide-y divide-border text-xs">
            {Object.entries(data.byCountry).map(([country, info]: [string, { mrrCents: number; count: number }]) => (
              <div key={country} className="flex justify-between px-3 py-2">
                <span className="font-medium">{country}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{info.count} client{info.count !== 1 ? "s" : ""}</span>
                  <span className="font-bold">{formatCurrency(info.mrrCents)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.localBilling && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Local Instance Billing</p>
          <div className="rounded-lg border border-border divide-y divide-border text-xs">
            {[
              ["Total Billed (All Time)", `${GHS}${data.localBilling.totalBilledAllTime?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0"}`],
              ["Billed (Last 30 Days)", `${GHS}${data.localBilling.billedLast30Days?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0"}`],
              ["Wallet Balance (All)", formatCurrency(data.localBilling.totalWalletBalance)],
              ["Active Wallets", data.localBilling.activeWallets],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between px-3 py-1.5">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type CurrentInstance = {
  clientName: string; country: string; currency: string; region: string;
  deploymentUrl: string; branding: string; status: string; licenseTier: string;
  totalBorrowers: number; totalInstitutions: number; totalUsers: number;
  organizations: Array<{ name: string; licenseTier: string; status: string }>;
  alreadyRegistered: boolean; deploymentDate: string;
};

function DeploymentsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editDeploy, setEditDeploy] = useState<Deployment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: deployments, isLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); return r.json(); },
  });

  const { data: currentInstance } = useQuery<CurrentInstance>({
    queryKey: ["/api/platform-control/current-instance"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/current-instance"); return r.json(); },
  });

  const autoAddMutation = useMutation({
    mutationFn: async () => {
      if (!currentInstance) throw new Error("No instance data");
      const payload = {
        clientName: currentInstance.clientName,
        country: currentInstance.country,
        currency: currentInstance.currency,
        region: currentInstance.region,
        deploymentUrl: currentInstance.deploymentUrl,
        branding: currentInstance.branding,
        status: currentInstance.status,
        licenseTier: currentInstance.licenseTier,
        totalBorrowers: currentInstance.totalBorrowers,
        totalInstitutions: currentInstance.totalInstitutions,
        deploymentDate: currentInstance.deploymentDate,
      };
      const r = await pcFetch("/api/platform-control/deployments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error("Failed to register");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control"] }); toast({ title: "Current instance registered successfully" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const r = await pcFetch(`/api/platform-control/deployments/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error("Delete failed"); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control"] }); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-4">
      {currentInstance && !currentInstance.alreadyRegistered && (
        <div className="rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3" data-testid="auto-add-banner">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                Current Instance Detected: {currentInstance.clientName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentInstance.country} &middot; {currentInstance.totalBorrowers.toLocaleString()} borrowers &middot; {currentInstance.totalInstitutions.toLocaleString()} institutions &middot; {currentInstance.totalUsers} users
              </p>
              {currentInstance.organizations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentInstance.organizations.slice(0, 8).map((org, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{org.name}</Badge>
                  ))}
                  {currentInstance.organizations.length > 8 && <Badge variant="outline" className="text-[10px]">+{currentInstance.organizations.length - 8} more</Badge>}
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => autoAddMutation.mutate()} disabled={autoAddMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-auto-add">
              {autoAddMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Register This Instance
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{deployments?.length || 0} deployment(s)</span>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="button-add-deployment"><Plus className="w-4 h-4 mr-1" /> Add Manual</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Deployment</DialogTitle></DialogHeader>
            <DeploymentForm onClose={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {deployments && deployments.length === 0 && !currentInstance && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <Server className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No deployments registered</p>
        </div>
      )}

      {deployments && deployments.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs" data-testid="table-deployments">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Client", "Country", "Status", "Tier", "Monthly", "Records", ""].map(h => (
                  <th key={h} className="p-2 font-medium text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deployments.map(d => (
                <tr key={d.id} className="border-b border-border hover:bg-muted/30" data-testid={`row-deployment-${d.id}`}>
                  <td className="p-2">
                    <p className="font-medium">{d.clientName}</p>
                    {d.deploymentUrl && <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{d.deploymentUrl}</p>}
                  </td>
                  <td className="p-2">{d.country}</td>
                  <td className="p-2"><StatusBadge status={d.status} /></td>
                  <td className="p-2"><Badge variant="outline" className="text-[10px]">{d.licenseTier}</Badge></td>
                  <td className="p-2 font-medium">{formatCurrency(d.monthlyFeeCents, d.currency)}</td>
                  <td className="p-2">{(d.totalBorrowers || 0).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Dialog open={editDeploy?.id === d.id} onOpenChange={open => !open && setEditDeploy(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditDeploy(d)} data-testid={`button-edit-${d.id}`}><Edit className="w-3 h-3" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Edit</DialogTitle></DialogHeader>
                          <DeploymentForm deployment={editDeploy || undefined} onClose={() => setEditDeploy(null)} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm(`Delete "${d.clientName}"?`)) deleteMutation.mutate(d.id); }} data-testid={`button-delete-${d.id}`}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuickActionsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusId, setStatusId] = useState("");
  const [statusTo, setStatusTo] = useState("");
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await pcFetch(`/api/platform-control/deployments/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, updateNote: `Status changed to ${status} via Quick Actions` }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control"] }); toast({ title: "Status updated" }); setStatusId(""); setStatusTo(""); },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const { data: deployments } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); return r.json(); },
  });

  const [showConfigGen, setShowConfigGen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => { const r = await fetch("/health"); const d = await r.json(); toast({ title: "Health Check", description: `Status: ${d.status}, Uptime: ${Math.round(d.uptime)}s` }); }} data-testid="action-check-health">
          <Heart className="w-3.5 h-3.5" /> Check Health
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.reload()} data-testid="action-refresh-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh All Data
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowConfigGen(!showConfigGen)} data-testid="action-generate-config">
          <Download className="w-3.5 h-3.5" /> Generate Deployment Config
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("/api-docs", "_blank")} data-testid="action-api-docs">
          <Globe className="w-3.5 h-3.5" /> API Docs
        </Button>
      </div>

      {showConfigGen && <ConfigGeneratorInline />}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Client Status</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger className="w-[200px] h-8 text-xs" data-testid="select-quick-client"><SelectValue placeholder="Select client..." /></SelectTrigger>
            <SelectContent>
              {(deployments || []).map(d => <SelectItem key={d.id} value={d.id}>{d.clientName} ({d.status})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusTo} onValueChange={setStatusTo}>
            <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-quick-status"><SelectValue placeholder="New status..." /></SelectTrigger>
            <SelectContent>
              {["active", "trial", "suspended", "decommissioned"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8" disabled={!statusId || !statusTo || statusMutation.isPending} onClick={() => statusMutation.mutate({ id: statusId, status: statusTo })} data-testid="button-quick-status">
            {statusMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3 mr-1" />} Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfigGeneratorInline() {
  const { data: deployments } = useQuery<Deployment[]>({ queryKey: ["/api/platform-control", "deployments"], queryFn: () => pcFetch("/api/platform-control/deployments").then(r => r.json()) });
  const [form, setForm] = useState<Record<string, string>>({ clientName: "", country: "", currency: "GHS", regulatoryBody: "", brandTitle: "" });
  const [config, setConfig] = useState<{ config: Record<string, string>; instructions: string[] } | null>(null);
  const { toast } = useToast();
  const prefillFromClient = (d: Deployment) => {
    setForm({ clientName: d.clientName, country: d.country, currency: d.currency, regulatoryBody: "", brandTitle: d.branding || d.clientName });
    setConfig(null);
  };
  const generate = async () => {
    try {
      const res = await pcFetch("/api/platform-control/generate-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setConfig(await res.json());
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };
  const copyConfig = () => {
    if (!config) return;
    navigator.clipboard.writeText(Object.entries(config.config).map(([k, v]) => `${k}=${v}`).join("\n"));
    toast({ title: "Copied to clipboard" });
  };
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="text-xs font-semibold">Deployment Config Generator</p>
      {deployments && deployments.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prefill from existing client:</label>
          <div className="flex flex-wrap gap-1">
            {deployments.filter(d => d.status !== "decommissioned").map(d => (
              <Button key={d.id} variant="outline" size="sm" className="text-xs h-7" onClick={() => prefillFromClient(d)} data-testid={`button-prefill-${d.id}`}>
                {d.clientName}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "clientName", label: "Client Name *" }, { key: "country", label: "Country *" },
          { key: "currency", label: "Currency" }, { key: "regulatoryBody", label: "Regulatory Body" },
        ].map(f => (
          <div key={f.key} className="space-y-1">
            <label className="text-xs font-medium">{f.label}</label>
            <Input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} data-testid={`input-gen-${f.key}`} />
          </div>
        ))}
      </div>
      <Button onClick={generate} disabled={!form.clientName || !form.country} size="sm" data-testid="button-generate-config-submit">
        <Download className="w-4 h-4 mr-2" /> Generate
      </Button>
      {config && (
        <div className="space-y-3">
          <div className="rounded-lg bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-x-auto">
            {Object.entries(config.config).map(([k, v]) => (
              <div key={k}><span className="text-emerald-400">{k}</span>=<span className="text-amber-300">{String(v)}</span></div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyConfig} variant="outline" size="sm" data-testid="button-copy-config"><Copy className="w-3 h-3 mr-1" /> Copy .env</Button>
          </div>
          {config.instructions && (
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-semibold">Setup Instructions:</p>
              {config.instructions.map((inst: string, i: number) => <p key={i} className="text-xs text-muted-foreground">{inst}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfigurationMatrix() {
  const { data: deployments, isLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); return r.json(); },
  });

  if (isLoading || !deployments) return <div className="text-sm text-muted-foreground p-4">Loading...</div>;
  if (deployments.length === 0) return <div className="text-sm text-muted-foreground p-4">No deployments to compare.</div>;

  type FieldDef = { key: keyof Deployment; label: string; format?: (v: string | number | undefined | null, d: Deployment) => string };
  const configFields: FieldDef[] = [
    { key: "status", label: "Status" },
    { key: "licenseTier", label: "License Tier" },
    { key: "country", label: "Country" },
    { key: "region", label: "Region" },
    { key: "currency", label: "Currency" },
    { key: "monthlyFeeCents", label: "Monthly Fee", format: (v, d) => formatCurrency(v as number | undefined, d.currency) },
    { key: "platformFeePercent", label: "Platform Fee %", format: (v) => v != null ? `${v}%` : "—" },
    { key: "totalBorrowers", label: "Borrowers", format: (v) => ((v as number) || 0).toLocaleString() },
    { key: "totalInstitutions", label: "Institutions", format: (v) => ((v as number) || 0).toLocaleString() },
    { key: "deploymentUrl", label: "URL", format: (v) => (v as string) || "—" },
    { key: "branding", label: "Branding" },
    { key: "deploymentDate", label: "Deploy Date", format: (v) => v ? new Date(v as string).toLocaleDateString() : "—" },
    { key: "contactName", label: "Contact" },
    { key: "contactEmail", label: "Email" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" data-testid="table-config-matrix">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="p-2 text-left font-medium sticky left-0 bg-muted/80">Setting</th>
            {deployments.map(d => (
              <th key={d.id} className="p-2 text-center font-medium min-w-[140px]">
                <div>{d.clientName}</div>
                <StatusBadge status={d.status} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {configFields.map(f => (
            <tr key={f.key} className="border-b border-border hover:bg-muted/30">
              <td className="p-2 font-medium text-muted-foreground sticky left-0 bg-background">{f.label}</td>
              {deployments.map(d => (
                <td key={d.id} className="p-2 text-center">
                  {f.format ? f.format(d[f.key] as string | number | undefined, d) : (String(d[f.key] || "—"))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateTracker() {
  const { data: deployments, isLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); return r.json(); },
  });

  if (isLoading || !deployments) return <div className="text-sm text-muted-foreground p-4">Loading...</div>;

  type LogEntry = { timestamp: string; changes: string[]; note: string; previousStatus?: string };
  const allEntries: { clientName: string; entry: LogEntry }[] = [];
  for (const d of deployments) {
    const log: UpdateLogEntry[] = Array.isArray(d.updateLog) ? d.updateLog : [];
    for (const entry of log) {
      allEntries.push({ clientName: d.clientName, entry });
    }
  }
  allEntries.sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());

  if (allEntries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No update history yet</p>
        <p className="text-xs mt-1">Updates to deployments will be tracked here automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {allEntries.slice(0, 50).map((item, i) => (
        <div key={i} className="rounded-lg border border-border p-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Edit className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold">{item.clientName}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(item.entry.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Changed: {item.entry.changes.join(", ")}
              {item.entry.previousStatus && <span className="ml-1">(was: {item.entry.previousStatus})</span>}
            </p>
            {item.entry.note && <p className="text-xs mt-1 bg-muted/50 rounded px-2 py-1">{item.entry.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ControlDashboard() {
  const { data: summary } = useQuery<SummaryData>({
    queryKey: ["/api/platform-control/summary"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/summary"); return r.json(); },
  });

  const handleLogout = async () => {
    await pcFetch("/api/platform-control/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-control-title">Platform Master Control</h1>
              <p className="text-xs text-muted-foreground">Multi-deployment management console</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-control-logout">
            <LogOut className="w-4 h-4 mr-2" /> Exit
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Deployments" value={summary.totalDeployments} icon={Server} sub={`${summary.activeDeployments} active`} color="text-blue-500" />
            <StatCard label="Monthly Revenue" value={formatCurrency(summary.totalMRRCents)} icon={DollarSign} color="text-emerald-500" />
            <StatCard label="Countries" value={summary.countriesServed?.length || 0} icon={Globe} sub={summary.countriesServed?.join(", ") || "None"} color="text-violet-500" />
            <StatCard label="Total Records" value={(summary.totalBorrowers || 0).toLocaleString()} icon={Users} sub={`${summary.totalInstitutions || 0} institutions`} />
            <StatCard label="This Instance" value={summary.localBorrowers?.toLocaleString() || "0"} icon={Database} sub={`${summary.localOrganizations || 0} orgs, ${summary.localUsers || 0} users`} color="text-amber-500" />
          </div>
        )}

        <div className="mb-4">
          <Panel title="Quick Actions" icon={Zap} color="text-amber-500">
            <QuickActionsPanel />
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="System Health & Server" icon={Activity} color="text-emerald-500">
            <SystemHealthPanel />
          </Panel>

          <Panel title="Connected Integrations" icon={Wifi} color="text-blue-500">
            <IntegrationsPanel />
          </Panel>

          <Panel title="Database & Data Health" icon={Database} color="text-violet-500">
            <DatabaseStatsPanel />
          </Panel>

          <Panel title="Revenue & Billing" icon={DollarSign} color="text-emerald-500" defaultOpen={false}>
            <RevenuePanel />
          </Panel>

          <Panel title="Client Deployments" icon={Building2} color="text-blue-500" defaultOpen={false}>
            <DeploymentsPanel />
          </Panel>

          <Panel title="Configuration Matrix" icon={Layers} color="text-cyan-500" defaultOpen={false}>
            <ConfigurationMatrix />
          </Panel>

          <Panel title="Update Tracker" icon={Clock} color="text-orange-500" defaultOpen={false}>
            <UpdateTracker />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function PlatformMasterControlPage() {
  const [authenticated, setAuthenticated] = useState(false);
  if (!authenticated) return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  return <ControlDashboard />;
}
