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
  TrendingUp, ArrowRightLeft, GitBranch, Link2, Unlink, ExternalLink,
  HeartPulse, Signal, SignalZero, Radio, TestTube, Save, X, Pencil,
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
  githubRepo?: string; heartbeatUrl?: string;
  lastHeartbeat?: Record<string, unknown>; lastHeartbeatAt?: string;
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
    githubRepo: deployment?.githubRepo || "", heartbeatUrl: deployment?.heartbeatUrl || "",
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
          { key: "githubRepo", label: "GitHub Repo (owner/name)" },
          { key: "heartbeatUrl", label: "Heartbeat URL" },
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
    { key: "githubRepo", label: "GitHub Repo" },
    { key: "heartbeatUrl", label: "Heartbeat URL" },
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

type HeartbeatResult = { id: string; clientName: string; status: string; latencyMs: number };
type HeartbeatDetail = { status: string; latencyMs: number; data: Record<string, unknown>; checkedAt: string };
type GitHubRepo = { fullName: string; name: string; private: boolean; description: string | null; htmlUrl: string; defaultBranch: string; updatedAt: string; language: string | null; forksCount: number };
type GitHubRepoStatus = { name: string; description: string; defaultBranch: string; private: boolean; htmlUrl: string; updatedAt: string; pushedAt: string; size: number; branches: string[]; recentCommits: Array<{ sha: string; message: string; date: string; author: string }> };

function HeartbeatPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: deployments } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); return r.json(); },
  });

  const checkAllMutation = useMutation({
    mutationFn: async () => {
      const r = await pcFetch("/api/platform-control/heartbeat-check-all", { method: "POST" });
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || "Check failed"); }
      return r.json() as Promise<{ checked: number; results: HeartbeatResult[] }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] });
      toast({ title: `Checked ${data.checked} deployment(s)` });
    },
    onError: (e: Error) => toast({ title: "Heartbeat check failed", description: e.message, variant: "destructive" }),
  });

  const checkOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await pcFetch(`/api/platform-control/heartbeat-check/${id}`, { method: "POST" });
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || "Check failed"); }
      return r.json() as Promise<HeartbeatDetail>;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] }); },
    onError: (e: Error) => toast({ title: "Heartbeat check failed", description: e.message, variant: "destructive" }),
  });

  const active = deployments?.filter(d => d.status !== "decommissioned") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{active.length} deployment(s) to monitor</span>
        <Button size="sm" onClick={() => checkAllMutation.mutate()} disabled={checkAllMutation.isPending || active.length === 0} data-testid="button-check-all-heartbeat">
          {checkAllMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <HeartPulse className="w-4 h-4 mr-1" />}
          Check All
        </Button>
      </div>

      {checkAllMutation.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {checkAllMutation.data.results.map(r => (
            <div key={r.id} className={`rounded-lg border p-3 ${r.status === "healthy" ? "border-emerald-500/30 bg-emerald-500/5" : r.status === "unreachable" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`} data-testid={`heartbeat-result-${r.id}`}>
              <div className="flex items-center gap-2">
                {r.status === "healthy" ? <Signal className="w-4 h-4 text-emerald-500" /> : r.status === "unreachable" ? <SignalZero className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className="text-sm font-medium">{r.clientName}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className={r.status === "healthy" ? "text-emerald-500" : r.status === "unreachable" ? "text-red-500" : "text-amber-500"}>{r.status}</span>
                {r.latencyMs >= 0 && <span>{r.latencyMs}ms</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Individual Deployments</p>
          {active.map(d => {
            const hb = d.lastHeartbeat as HeartbeatDetail | null;
            const hbData = hb?.data as Record<string, unknown> | undefined;
            return (
              <div key={d.id} className="rounded-lg border border-border p-3 flex items-center justify-between" data-testid={`heartbeat-row-${d.id}`}>
                <div className="flex items-center gap-3">
                  {hb?.status === "healthy" ? <Signal className="w-4 h-4 text-emerald-500" /> : hb?.status === "unreachable" ? <SignalZero className="w-4 h-4 text-red-500" /> : <Heart className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{d.clientName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.heartbeatUrl || d.deploymentUrl || "No URL"}{" "}
                      {hb && <span>&middot; Last: {new Date(hb.checkedAt).toLocaleString()} &middot; {hb.latencyMs}ms</span>}
                      {!!(hbData?.version) && <span> &middot; v{String(hbData.version)}</span>}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => checkOneMutation.mutate(d.id)} disabled={checkOneMutation.isPending} data-testid={`button-check-${d.id}`}>
                  <HeartPulse className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {active.length === 0 && (
        <div className="text-center text-sm text-muted-foreground p-6">
          Register deployments first to monitor their health.
        </div>
      )}
    </div>
  );
}

function GitHubPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [linkDeploymentId, setLinkDeploymentId] = useState("");
  const [viewRepoDetail, setViewRepoDetail] = useState<string | null>(null);

  const { data: repos, isLoading: reposLoading, error: reposError } = useQuery<{ repos: GitHubRepo[] }>({
    queryKey: ["/api/platform-control/github/repos"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/github/repos"); if (!r.ok) throw new Error("Failed to load repos"); return r.json(); },
  });

  const { data: deployments } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/deployments"); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });

  const { data: repoDetail, error: repoDetailError } = useQuery<GitHubRepoStatus>({
    queryKey: ["/api/platform-control/github/repo-status", viewRepoDetail],
    queryFn: async () => { const r = await pcFetch(`/api/platform-control/github/repo-status/${viewRepoDetail}`); if (!r.ok) throw new Error("Failed to load repo details"); return r.json(); },
    enabled: !!viewRepoDetail,
  });

  const createRepoMutation = useMutation({
    mutationFn: async () => {
      const r = await pcFetch("/api/platform-control/github/create-repo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRepoName, description: newRepoDesc, isPrivate: true, deploymentId: linkDeploymentId && linkDeploymentId !== "none" ? linkDeploymentId : undefined }),
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.message || "Failed"); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control/github/repos"] }); qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] }); toast({ title: "Repository created" }); setShowCreate(false); setNewRepoName(""); setNewRepoDesc(""); setLinkDeploymentId(""); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const linkRepoMutation = useMutation({
    mutationFn: async ({ deploymentId, repoFullName }: { deploymentId: string; repoFullName: string }) => {
      const r = await pcFetch("/api/platform-control/github/link-repo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentId, repoFullName }),
      });
      if (!r.ok) throw new Error("Link failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] }); toast({ title: "Repo linked" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  if (reposError) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
        <p className="text-sm font-medium">GitHub Not Connected</p>
        <p className="text-xs text-muted-foreground mt-1">Connect your GitHub account through Replit integrations to manage client repositories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{repos?.repos?.length || 0} repositories</span>
        <Button size="sm" onClick={() => setShowCreate(true)} data-testid="button-create-repo">
          <Plus className="w-4 h-4 mr-1" /> New Client Repo
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-lg border-2 border-dashed border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Create New Client Repository</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Repo Name *</label>
              <Input value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="credit-hub-nigeria" data-testid="input-repo-name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Input value={newRepoDesc} onChange={e => setNewRepoDesc(e.target.value)} placeholder="Credit registry for..." data-testid="input-repo-desc" />
            </div>
          </div>
          {deployments && deployments.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Link to Deployment (optional)</label>
              <Select value={linkDeploymentId} onValueChange={setLinkDeploymentId}>
                <SelectTrigger data-testid="select-link-deployment"><SelectValue placeholder="Select deployment..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {deployments.map(d => <SelectItem key={d.id} value={d.id}>{d.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createRepoMutation.mutate()} disabled={!newRepoName || createRepoMutation.isPending} data-testid="button-submit-repo">
              {createRepoMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <GitBranch className="w-4 h-4 mr-1" />}
              Create Private Repo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {deployments && deployments.filter(d => !d.githubRepo).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unlinked Deployments</p>
          {deployments.filter(d => !d.githubRepo).map(d => (
            <div key={d.id} className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between" data-testid={`unlinked-${d.id}`}>
              <div className="flex items-center gap-2">
                <Unlink className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm">{d.clientName}</span>
                <span className="text-xs text-muted-foreground">No GitHub repo linked</span>
              </div>
              {repos?.repos && repos.repos.length > 0 && (
                <Select onValueChange={v => linkRepoMutation.mutate({ deploymentId: d.id, repoFullName: v })}>
                  <SelectTrigger className="w-[200px] h-8 text-xs" data-testid={`select-repo-${d.id}`}><SelectValue placeholder="Link a repo..." /></SelectTrigger>
                  <SelectContent>
                    {repos.repos.map(r => <SelectItem key={r.fullName} value={r.fullName}>{r.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {deployments && deployments.filter(d => d.githubRepo).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Repositories</p>
          {deployments.filter(d => d.githubRepo).map(d => (
            <div key={d.id} className="rounded-lg border border-border p-3" data-testid={`linked-${d.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-sm font-medium">{d.clientName}</span>
                  <span className="text-xs text-muted-foreground">&rarr;</span>
                  <span className="text-xs font-mono text-blue-500">{d.githubRepo}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => setViewRepoDetail(d.githubRepo || null)} data-testid={`button-view-repo-${d.id}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => window.open(`https://github.com/${d.githubRepo}`, "_blank")} data-testid={`button-open-repo-${d.id}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewRepoDetail && repoDetailError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex items-center justify-between">
          <span className="text-sm text-red-500">Failed to load repo details for {viewRepoDetail}</span>
          <Button variant="ghost" size="sm" onClick={() => setViewRepoDetail(null)}>Close</Button>
        </div>
      )}

      {viewRepoDetail && repoDetail && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4 text-blue-500" /> {repoDetail.name}</p>
            <Button variant="ghost" size="sm" onClick={() => setViewRepoDetail(null)}>Close</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{repoDetail.defaultBranch}</span></div>
            <div><span className="text-muted-foreground">Visibility:</span> <span className="font-medium">{repoDetail.private ? "Private" : "Public"}</span></div>
            <div><span className="text-muted-foreground">Size:</span> <span className="font-medium">{repoDetail.size} KB</span></div>
            <div><span className="text-muted-foreground">Last Push:</span> <span className="font-medium">{new Date(repoDetail.pushedAt).toLocaleDateString()}</span></div>
          </div>
          {repoDetail.branches.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repoDetail.branches.map(b => <Badge key={b} variant="outline" className="text-[10px]"><GitBranch className="w-2.5 h-2.5 mr-0.5" />{b}</Badge>)}
            </div>
          )}
          {repoDetail.recentCommits.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Recent Commits</p>
              {repoDetail.recentCommits.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <code className="text-blue-500 shrink-0">{c.sha}</code>
                  <span className="truncate">{c.message}</span>
                  <span className="text-muted-foreground shrink-0 ml-auto">{c.author} &middot; {new Date(c.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reposLoading && <p className="text-sm text-muted-foreground p-4">Loading repositories...</p>}
    </div>
  );
}

interface RegistryRow {
  provider: string;
  label: string;
  live: boolean;
  sandbox: boolean;
  source: string;
  hasDbCredentials: boolean;
  apiUrl: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

function RegistryCredentialsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [form, setForm] = useState({ apiUrl: "", apiKey: "" });
  const [testRef, setTestRef] = useState("TEST-001");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  type TestResult = { ok: boolean; error?: string; statusCode?: number; latencyMs?: number; response?: unknown } | null;
  const [testResult, setTestResult] = useState<Record<string, TestResult>>({});

  const { data, isLoading, refetch } = useQuery<{ registries: RegistryRow[] }>({
    queryKey: ["/api/platform-control/registry-credentials"],
    queryFn: async () => { const r = await pcFetch("/api/platform-control/registry-credentials"); return r.json(); },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ provider, apiUrl, apiKey }: { provider: string; apiUrl: string; apiKey: string }) => {
      const r = await pcFetch(`/api/platform-control/registry-credentials/${provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl, apiKey }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Failed to save"); }
      return r.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: "Credentials saved", description: `${vars.provider} updated successfully` });
      qc.invalidateQueries({ queryKey: ["/api/platform-control/registry-credentials"] });
      setEditingProvider(null);
      setForm({ apiUrl: "", apiKey: "" });
    },
    onError: (e: Error) => toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const r = await pcFetch(`/api/platform-control/registry-credentials/${provider}`, { method: "DELETE" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Failed"); }
      return r.json();
    },
    onSuccess: (_, provider) => {
      toast({ title: "Credentials cleared", description: `${provider} will fall back to env vars` });
      qc.invalidateQueries({ queryKey: ["/api/platform-control/registry-credentials"] });
    },
    onError: (e: Error) => toast({ title: "Failed to clear", description: e.message, variant: "destructive" }),
  });

  const handleTest = async (provider: string) => {
    setTestingProvider(provider);
    setTestResult(prev => ({ ...prev, [provider]: null }));
    try {
      const r = await pcFetch(`/api/platform-control/registry-credentials/${provider}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl: form.apiUrl, apiKey: form.apiKey, testReference: testRef }),
      });
      const result = await r.json();
      setTestResult(prev => ({ ...prev, [provider]: result }));
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, [provider]: { ok: false, error: e.message } }));
    } finally {
      setTestingProvider(null);
    }
  };

  const startEdit = (row: RegistryRow) => {
    setEditingProvider(row.provider);
    setForm({ apiUrl: row.apiUrl ?? "", apiKey: "" });
    setTestResult({});
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading registry credentials...</div>;

  const registries = data?.registries ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{registries.filter(r => r.live).length} of {registries.length} registries live</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-registry-creds">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        {registries.map(row => {
          const isEditing = editingProvider === row.provider;
          const tResult = testResult[row.provider];

          return (
            <div key={row.provider} className={`rounded-lg border ${isEditing ? "border-blue-500/40 bg-blue-500/5" : "border-border"} p-3`} data-testid={`registry-row-${row.provider}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Radio className={`w-4 h-4 shrink-0 ${row.live ? "text-emerald-500" : "text-zinc-400"}`} />
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-registry-label-${row.provider}`}>{row.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {row.live ? (
                        <>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                            {row.sandbox ? "Sandbox" : "Live"}
                          </Badge>
                          {row.source === "database" && (
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500 bg-blue-500/10">
                              <Database className="w-2.5 h-2.5 mr-0.5" /> DB
                            </Badge>
                          )}
                          {row.source === "env" && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/10">
                              <Key className="w-2.5 h-2.5 mr-0.5" /> Env Var
                            </Badge>
                          )}
                          {row.apiUrl && (
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{row.apiUrl}</span>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-zinc-500/30 text-zinc-400">Stub / No credentials</Badge>
                      )}
                      {row.updatedAt && (
                        <span className="text-[10px] text-muted-foreground">Updated {new Date(row.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {row.hasDbCredentials && !isEditing && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => deleteMutation.mutate(row.provider)} disabled={deleteMutation.isPending} data-testid={`button-clear-creds-${row.provider}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isEditing ? (
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditingProvider(null); setForm({ apiUrl: "", apiKey: "" }); }} data-testid={`button-cancel-edit-${row.provider}`}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => startEdit(row)} data-testid={`button-edit-creds-${row.provider}`}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">API URL *</label>
                      <Input
                        value={form.apiUrl}
                        onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))}
                        placeholder="https://api.registry.example.com"
                        data-testid={`input-api-url-${row.provider}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">API Key *</label>
                      <Input
                        type="password"
                        value={form.apiKey}
                        onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                        placeholder={row.hasDbCredentials ? "Leave blank to keep existing" : "Enter API key"}
                        data-testid={`input-api-key-${row.provider}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <label className="text-xs font-medium shrink-0">Test reference:</label>
                      <Input
                        value={testRef}
                        onChange={e => setTestRef(e.target.value)}
                        placeholder="TEST-001"
                        className="h-7 text-xs w-32"
                        data-testid={`input-test-ref-${row.provider}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleTest(row.provider)}
                      disabled={testingProvider === row.provider || !form.apiUrl || (!form.apiKey && !row.hasDbCredentials)}
                      data-testid={`button-test-${row.provider}`}
                    >
                      {testingProvider === row.provider ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <TestTube className="w-3 h-3 mr-1" />}
                      {!form.apiKey && row.hasDbCredentials ? "Test with Stored Key" : "Test Connection"}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => saveMutation.mutate({ provider: row.provider, apiUrl: form.apiUrl, apiKey: form.apiKey })}
                      disabled={saveMutation.isPending || !form.apiUrl || (!form.apiKey && !row.hasDbCredentials)}
                      data-testid={`button-save-${row.provider}`}
                    >
                      {saveMutation.isPending ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                      {!form.apiKey && row.hasDbCredentials ? "Update URL Only" : "Save Credentials"}
                    </Button>
                  </div>

                  {tResult && (
                    <div className={`rounded-lg p-3 text-xs ${tResult.ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300"}`} data-testid={`test-result-${row.provider}`}>
                      <div className="flex items-center gap-2 font-medium mb-1">
                        {tResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {tResult.ok ? "Connection successful" : "Connection failed"}
                        {tResult.latencyMs != null && <span className="text-muted-foreground font-normal ml-1">{tResult.latencyMs}ms</span>}
                        {tResult.statusCode != null && <span className="text-muted-foreground font-normal">HTTP {tResult.statusCode}</span>}
                      </div>
                      {tResult.error && <p className="text-xs opacity-80">{tResult.error}</p>}
                      {!!(tResult.response) && <pre className="mt-1 text-[10px] overflow-x-auto bg-black/5 rounded p-1">{JSON.stringify(tResult.response, null, 2).slice(0, 400)}</pre>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
        Credentials saved here are encrypted and stored in the database, taking priority over environment variables.
        Use &ldquo;Test Connection&rdquo; to verify before saving. Clearing removes DB credentials and reverts to env vars.
      </div>
    </div>
  );
}

function CollateralRegistrySetupPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [provisionForm, setProvisionForm] = useState({ countryCode: "", organizationName: "", contactEmail: "" });
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; temporaryPassword: string; orgName: string; countryName: string } | null>(null);

  const { data: countries = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/registry-country-config"],
    queryFn: () => fetch("/api/registry-country-config", { credentials: "include" }).then(r => r.json()),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    });
  };

  const provisionMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/registry-authority/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.message); return j; }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/registry-country-config"] });
      setCreatedCredentials({
        username: data.credentials.username,
        temporaryPassword: data.credentials.temporaryPassword,
        orgName: data.organization.name,
        countryName: data.config.countryName,
      });
      setProvisionForm({ countryCode: "", organizationName: "", contactEmail: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const live = countries.filter((c: any) => c.isLive || c.registryAuthorityOrgId);
  const pending = countries.filter((c: any) => !c.isLive && !c.registryAuthorityOrgId);

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{live.length}</div>
          <div className="text-xs text-muted-foreground">Countries Live</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
          <div className="text-xs text-muted-foreground">Pending Provisioning</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold">{countries.length}</div>
          <div className="text-xs text-muted-foreground">Total Countries</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Provision a government Registry Authority for any African country. This creates a dedicated organization that can approve/reject lien registrations for that country.</p>
        <Dialog open={provisionOpen} onOpenChange={open => { setProvisionOpen(open); if (!open) setCreatedCredentials(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shrink-0" data-testid="btn-provision-registry">
              <Plus className="w-3.5 h-3.5" /> Provision Authority
            </Button>
          </DialogTrigger>
          <DialogContent>
            {createdCredentials ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registry Authority Provisioned
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs space-y-1">
                    <div><span className="font-medium">Organization:</span> {createdCredentials.orgName}</div>
                    <div><span className="font-medium">Country:</span> {createdCredentials.countryName}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">The authority has been linked to the country registry and marked as live. Share the credentials below with the authority administrator.</p>
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
                    <div>
                      <div className="text-xs font-medium mb-1 text-muted-foreground">Username</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-background border px-3 py-1.5 text-xs font-mono select-all" data-testid="text-provision-username">{createdCredentials.username}</code>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" data-testid="btn-copy-username" onClick={() => copyToClipboard(createdCredentials.username, "Username")}>Copy</Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1 text-muted-foreground">Temporary Password</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-background border px-3 py-1.5 text-xs font-mono select-all" data-testid="text-provision-password">{createdCredentials.temporaryPassword}</code>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" data-testid="btn-copy-password" onClick={() => copyToClipboard(createdCredentials.temporaryPassword, "Temporary password")}>Copy</Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">The administrator will be required to change this password on first login. These credentials will not be shown again.</p>
                </div>
                <div className="flex justify-end">
                  <Button data-testid="btn-close-credentials" onClick={() => { setProvisionOpen(false); setCreatedCredentials(null); }} className="bg-emerald-600 hover:bg-emerald-700">Done</Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" /> Provision Registry Authority
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="text-xs font-medium">Country</label>
                    <Select value={provisionForm.countryCode} onValueChange={v => setProvisionForm(f => ({ ...f, countryCode: v }))}>
                      <SelectTrigger data-testid="select-provision-country"><SelectValue placeholder="Select country…" /></SelectTrigger>
                      <SelectContent>
                        {pending.map((c: any) => (
                          <SelectItem key={c.countryCode} value={c.countryCode}>{c.countryName} ({c.countryCode}) — {c.legalRegime}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Authority Organization Name</label>
                    <Input
                      data-testid="input-provision-org-name"
                      placeholder="e.g. Ghana Collateral Registry Authority"
                      value={provisionForm.organizationName}
                      onChange={e => setProvisionForm(f => ({ ...f, organizationName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Contact Email (optional)</label>
                    <Input
                      data-testid="input-provision-email"
                      type="email"
                      placeholder="registry@authority.gov"
                      value={provisionForm.contactEmail}
                      onChange={e => setProvisionForm(f => ({ ...f, contactEmail: e.target.value }))}
                    />
                  </div>
                  {provisionForm.countryCode && (
                    <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                      {(() => {
                        const c = countries.find((x: any) => x.countryCode === provisionForm.countryCode);
                        return c ? (
                          <>
                            <div><span className="font-medium">Country:</span> {c.countryName}</div>
                            <div><span className="font-medium">Default Authority:</span> {c.authorityName}</div>
                            <div><span className="font-medium">Legal Regime:</span> {c.legalRegime}</div>
                            <div><span className="font-medium">Currency:</span> {c.currency}</div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setProvisionOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => provisionMutation.mutate(provisionForm)}
                    disabled={!provisionForm.countryCode || !provisionForm.organizationName || provisionMutation.isPending}
                    data-testid="btn-confirm-provision"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {provisionMutation.isPending ? "Provisioning…" : "Create Registry Authority"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading country config…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">Code</th>
                <th className="text-left p-2 font-medium">Country</th>
                <th className="text-left p-2 font-medium">Legal Regime</th>
                <th className="text-left p-2 font-medium">Currency</th>
                <th className="text-left p-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c: any) => (
                <tr key={c.countryCode} className="border-t hover:bg-muted/30" data-testid={`row-country-${c.countryCode}`}>
                  <td className="p-2 font-mono font-bold text-primary">{c.countryCode}</td>
                  <td className="p-2">{c.countryName}</td>
                  <td className="p-2 text-muted-foreground">{c.legalRegime}</td>
                  <td className="p-2 font-mono">{c.currency}</td>
                  <td className="p-2">
                    {c.registryAuthorityOrgId ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Provisioned
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not provisioned</span>
                    )}
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

// ---------------------------------------------------------------------------
// Demo Reset Panel — Credit Scoring data purge (super_admin only)
// ---------------------------------------------------------------------------
interface CreditResetPreview {
  counts: Record<string, number>;
  unlinkedPreview: Record<string, number>;
  scope: string;
}
interface ResetCountryOption { country: string; count: number }

function DemoResetPanel() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [resetDone, setResetDone] = useState<{ deleted: Record<string, number>; unlinked: Record<string, number>; scope: string } | null>(null);

  // Load available country choices (only shown when there are borrowers with a country value)
  const countriesQuery = useQuery<{ countries: ResetCountryOption[] }>({
    queryKey: ["/api/admin/demo/reset-credit-scoring/countries"],
    queryFn: async () => {
      const r = await fetch("/api/admin/demo/reset-credit-scoring/countries", { credentials: "include" });
      if (!r.ok) return { countries: [] };
      return r.json();
    },
    staleTime: 30_000,
  });

  const previewQuery = useQuery<CreditResetPreview>({
    queryKey: ["/api/admin/demo/reset-credit-scoring/preview", selectedCountry],
    queryFn: async () => {
      const url = selectedCountry
        ? `/api/admin/demo/reset-credit-scoring/preview?country=${encodeURIComponent(selectedCountry)}`
        : "/api/admin/demo/reset-credit-scoring/preview";
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: "Failed to load preview" }));
        throw new Error((err as { message?: string }).message ?? "Preview failed");
      }
      return r.json();
    },
    enabled: dialogOpen,
    staleTime: 0,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { confirm: "RESET" };
      if (selectedCountry) body.country = selectedCountry;
      const r = await fetch("/api/admin/demo/reset-credit-scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: "Unknown error" }));
        throw new Error((err as { message?: string }).message ?? "Reset failed");
      }
      return r.json() as Promise<{ deleted: Record<string, number>; unlinked: Record<string, number>; scope: string }>;
    },
    onSuccess: (data) => {
      const total = Object.values(data.deleted).reduce((a, b) => a + b, 0);
      setResetDone(data);
      setDialogOpen(false);
      setConfirmText("");
      const scopeLabel = data.scope === "global" ? "all countries" : data.scope;
      toast({ title: "Credit scoring data purged", description: `${total.toLocaleString()} rows deleted (${scopeLabel}). Loto, collateral, orgs, and billing untouched.` });
    },
    onError: (e: Error) => {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    },
  });

  const totalRows = previewQuery.data
    ? Object.values(previewQuery.data.counts).reduce((a, b) => a + b, 0)
    : null;

  const scopeLabel = selectedCountry || "All countries";
  const countries = countriesQuery.data?.countries ?? [];

  return (
    <div className="space-y-4">
      {/* Danger zone warning */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-red-700 dark:text-red-400">Danger zone — irreversible action (super_admin session required)</p>
          <p className="text-red-600 dark:text-red-400 mt-0.5">
            Resets credit scoring demo data for the selected scope: borrowers, credit accounts, loan applications, telco profiles, open banking, collection records, and every dependent table.
            Loto Fiscal, collateral registry, organisations, users, wallets, and billing data are <strong>completely untouched</strong>.
            You must be logged in as <strong>super_admin</strong> in the main application for this action to succeed.
          </p>
        </div>
      </div>

      {/* What is preserved */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-2">
          <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Preserved (untouched)</p>
          <ul className="text-emerald-600 dark:text-emerald-500 space-y-0.5 list-disc list-inside">
            <li>Organizations &amp; users</li>
            <li>Wallets &amp; billing records</li>
            <li>Loto Fiscal (draws, tickets, EFDs)</li>
            <li>Collateral registry items</li>
            <li>Audit logs</li>
          </ul>
        </div>
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-2">
          <p className="font-medium text-red-700 dark:text-red-400 mb-1">Wiped by reset</p>
          <ul className="text-red-600 dark:text-red-500 space-y-0.5 list-disc list-inside">
            <li>Borrower profiles (scoped)</li>
            <li>Credit accounts &amp; scores</li>
            <li>Loan applications</li>
            <li>Telco &amp; open banking data</li>
            <li>Collections &amp; disputes</li>
          </ul>
        </div>
      </div>

      {/* Last reset result (success banner) */}
      {resetDone && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs space-y-2">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Last reset ({resetDone.scope === "global" ? "all countries" : resetDone.scope}) — {Object.values(resetDone.deleted).reduce((a, b) => a + b, 0).toLocaleString()} rows purged
          </p>
          <div className="max-h-36 overflow-y-auto space-y-0.5 text-emerald-600 dark:text-emerald-500">
            {Object.entries(resetDone.deleted).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v.toLocaleString()}</span></div>
            ))}
          </div>
          {Object.values(resetDone.unlinked).some(v => v > 0) && (
            <div className="pt-1 border-t border-emerald-200 dark:border-emerald-700 space-y-0.5 text-amber-600 dark:text-amber-400">
              <p className="font-medium">FK links cleared (rows preserved):</p>
              {Object.entries(resetDone.unlinked).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v.toLocaleString()}</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { setDialogOpen(true); setConfirmText(""); setResetDone(null); }}
          data-testid="button-credit-scoring-reset-open"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Reset Credit Scoring Data
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setConfirmText(""); setSelectedCountry(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {selectedCountry ? `Reset ${selectedCountry} Credit Data` : "Reset All Credit Scoring Data"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Destructive warning banner inside dialog */}
            <div className="flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-2 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Destructive — this cannot be undone
            </div>

            {/* Country scope selector */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Scope</p>
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                data-testid="select-reset-country"
              >
                <option value="">All countries (global wipe)</option>
                {countries.map(c => (
                  <option key={c.country} value={c.country}>
                    {c.country} ({c.count.toLocaleString()} borrowers)
                  </option>
                ))}
              </select>
              {selectedCountry && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Only data linked to <strong>{selectedCountry}</strong> borrowers will be deleted. All other countries remain untouched.
                </p>
              )}
            </div>

            {/* Row-count preview */}
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium mb-2 text-muted-foreground">
                Modules that will be wiped{selectedCountry ? ` (${selectedCountry})` : ""}:
              </p>
              {previewQuery.isLoading && (
                <p className="text-muted-foreground text-xs animate-pulse">Loading counts…</p>
              )}
              {previewQuery.error && (
                <p className="text-red-600 text-xs">{(previewQuery.error as Error).message}</p>
              )}
              {previewQuery.data && (
                <>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
                    {Object.entries(previewQuery.data.counts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([label, count]) => (
                        <div key={label} className="flex justify-between">
                          <span className={count === 0 ? "text-muted-foreground/50" : "text-muted-foreground"}>{label}</span>
                          <span className={`font-mono font-medium ${count > 0 ? "text-red-600" : "text-muted-foreground/40"}`}>
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-2 pt-2 border-t flex justify-between font-semibold text-xs">
                    <span>Total rows to delete</span>
                    <span className={`font-mono ${totalRows ? "text-red-600" : "text-muted-foreground"}`}>
                      {(totalRows ?? 0).toLocaleString()}
                    </span>
                  </div>
                  {Object.values(previewQuery.data.unlinkedPreview).some(v => v > 0) && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      <p className="font-medium">FK links to be NULLed (rows kept, links cleared):</p>
                      {Object.entries(previewQuery.data.unlinkedPreview).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span>{k}</span>
                          <span className="font-mono">{v.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Typed confirmation */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-mono font-bold text-foreground">RESET</span> to confirm this irreversible action:
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type RESET here"
                className="font-mono"
                data-testid="input-credit-scoring-reset-confirm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDialogOpen(false); setConfirmText(""); setSelectedCountry(""); }}
                data-testid="button-credit-scoring-reset-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmText !== "RESET" || resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
                data-testid="button-credit-scoring-reset-execute"
              >
                {resetMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Resetting…</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Purge {scopeLabel} Credit Data</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

          <Panel title="Deployment Health Monitor" icon={HeartPulse} color="text-rose-500" defaultOpen={false}>
            <HeartbeatPanel />
          </Panel>

          <Panel title="GitHub Repository Management" icon={GitBranch} color="text-slate-500" defaultOpen={false}>
            <GitHubPanel />
          </Panel>

          <Panel title="Configuration Matrix" icon={Layers} color="text-cyan-500" defaultOpen={false}>
            <ConfigurationMatrix />
          </Panel>

          <Panel title="Update Tracker" icon={Clock} color="text-orange-500" defaultOpen={false}>
            <UpdateTracker />
          </Panel>

          <Panel title="Registry API Credentials" icon={Radio} color="text-teal-500" defaultOpen={false}>
            <RegistryCredentialsPanel />
          </Panel>

          <Panel title="Pan-African Collateral Registry Setup" icon={Shield} color="text-emerald-600" defaultOpen={false}>
            <CollateralRegistrySetupPanel />
          </Panel>

          <Panel title="Demo Tools" icon={TestTube} color="text-red-500" defaultOpen={false}>
            <DemoResetPanel />
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
