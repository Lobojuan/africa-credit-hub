import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, Globe, Building2, Plus, Trash2, Edit, Copy,
  Activity, DollarSign, Users, Server, LogOut, ChevronDown,
  ChevronRight, Eye, EyeOff, RefreshCw, Download,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const GHS = "\u20B5";

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/platform-control/check", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) onAuthenticated();
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platform-control/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onAuthenticated();
      } else {
        setError("Invalid master password");
      }
    } catch {
      setError("Connection failed");
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
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
          <Input
            type="password"
            placeholder="Master password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            data-testid="input-master-password"
          />
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
  id: string;
  clientName: string;
  country: string;
  region?: string;
  deploymentUrl?: string;
  status: string;
  licenseTier: string;
  monthlyFeeCents?: number;
  currency: string;
  contactName?: string;
  contactEmail?: string;
  totalBorrowers?: number;
  totalInstitutions?: number;
  lastSyncAt?: string;
  notes?: string;
  createdAt: string;
};

type Summary = {
  totalDeployments: number;
  activeDeployments: number;
  trialDeployments: number;
  suspendedDeployments: number;
  totalMRRCents: number;
  countriesServed: string[];
  totalBorrowers: number;
  totalInstitutions: number;
  localBorrowers?: number;
  localOrganizations?: number;
  localUsers?: number;
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    suspended: "bg-red-500/10 text-red-500 border-red-500/30",
    decommissioned: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
  };
  return <Badge variant="outline" className={variants[status] || ""}>{status}</Badge>;
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DeploymentForm({ deployment, onClose }: { deployment?: Deployment; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    clientName: deployment?.clientName || "",
    country: deployment?.country || "",
    region: deployment?.region || "",
    deploymentUrl: deployment?.deploymentUrl || "",
    status: deployment?.status || "active",
    licenseTier: deployment?.licenseTier || "commercial",
    monthlyFeeCents: deployment?.monthlyFeeCents?.toString() || "",
    currency: deployment?.currency || "GHS",
    contactName: deployment?.contactName || "",
    contactEmail: deployment?.contactEmail || "",
    totalBorrowers: deployment?.totalBorrowers?.toString() || "0",
    totalInstitutions: deployment?.totalInstitutions?.toString() || "0",
    notes: deployment?.notes || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (deployment) {
        return apiRequest("PATCH", `/api/platform-control/deployments/${deployment.id}`, data);
      }
      return apiRequest("POST", "/api/platform-control/deployments", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] });
      qc.invalidateQueries({ queryKey: ["/api/platform-control/summary"] });
      toast({ title: deployment ? "Deployment updated" : "Deployment created" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      monthlyFeeCents: form.monthlyFeeCents ? parseInt(form.monthlyFeeCents) : null,
      totalBorrowers: parseInt(form.totalBorrowers) || 0,
      totalInstitutions: parseInt(form.totalInstitutions) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Client Name *</label>
          <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required data-testid="input-client-name" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Country *</label>
          <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required data-testid="input-country" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Region</label>
          <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} data-testid="input-region" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Deployment URL</label>
          <Input value={form.deploymentUrl} onChange={e => setForm(f => ({ ...f, deploymentUrl: e.target.value }))} data-testid="input-deployment-url" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Status</label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">License Tier</label>
          <Select value={form.licenseTier} onValueChange={v => setForm(f => ({ ...f, licenseTier: v }))}>
            <SelectTrigger data-testid="select-license-tier"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="growth">Growth (MFI)</SelectItem>
              <SelectItem value="commercial">Commercial (Bank)</SelectItem>
              <SelectItem value="sovereign">Sovereign (Central Bank)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Monthly Fee (cents)</label>
          <Input type="number" value={form.monthlyFeeCents} onChange={e => setForm(f => ({ ...f, monthlyFeeCents: e.target.value }))} data-testid="input-monthly-fee" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Currency</label>
          <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} data-testid="input-currency" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Contact Name</label>
          <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} data-testid="input-contact-name" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Contact Email</label>
          <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} data-testid="input-contact-email" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Total Borrowers</label>
          <Input type="number" value={form.totalBorrowers} onChange={e => setForm(f => ({ ...f, totalBorrowers: e.target.value }))} data-testid="input-total-borrowers" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Total Institutions</label>
          <Input type="number" value={form.totalInstitutions} onChange={e => setForm(f => ({ ...f, totalInstitutions: e.target.value }))} data-testid="input-total-institutions" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Notes</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          data-testid="input-notes"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
        <Button type="submit" disabled={mutation.isPending} data-testid="button-save-deployment">
          {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
          {deployment ? "Update" : "Create"} Deployment
        </Button>
      </div>
    </form>
  );
}

function ConfigGenerator() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientName: "", country: "", currency: "GHS", regulatoryBody: "", brandTitle: "" });
  const [config, setConfig] = useState<any>(null);
  const { toast } = useToast();

  const generate = async () => {
    try {
      const res = await fetch("/api/platform-control/generate-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setConfig(data);
    } catch {
      toast({ title: "Failed to generate config", variant: "destructive" });
    }
  };

  const copyConfig = () => {
    if (!config) return;
    const envText = Object.entries(config.config).map(([k, v]) => `${k}=${v}`).join("\n");
    navigator.clipboard.writeText(envText);
    toast({ title: "Config copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-semibold" data-testid="button-toggle-config-gen">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Server className="w-4 h-4 text-violet-500" />
          Deployment Config Generator
        </button>
      </div>
      {open && (
        <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Client Name *</label>
              <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} data-testid="input-gen-client-name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Country *</label>
              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} data-testid="input-gen-country" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Currency</label>
              <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} data-testid="input-gen-currency" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Regulatory Body</label>
              <Input value={form.regulatoryBody} onChange={e => setForm(f => ({ ...f, regulatoryBody: e.target.value }))} data-testid="input-gen-regulatory" />
            </div>
          </div>
          <Button onClick={generate} disabled={!form.clientName || !form.country} size="sm" data-testid="button-generate-config">
            <Download className="w-4 h-4 mr-2" /> Generate Config
          </Button>

          {config && (
            <div className="space-y-3">
              <div className="rounded-lg bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-x-auto">
                {Object.entries(config.config).map(([k, v]) => (
                  <div key={k}><span className="text-emerald-400">{k}</span>=<span className="text-amber-300">{String(v)}</span></div>
                ))}
              </div>
              <Button onClick={copyConfig} variant="outline" size="sm" data-testid="button-copy-config">
                <Copy className="w-4 h-4 mr-2" /> Copy as .env
              </Button>
              {config.instructions && (
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs font-semibold">Setup Instructions:</p>
                  {config.instructions.map((inst: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">{inst}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ControlDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editDeploy, setEditDeploy] = useState<Deployment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ["/api/platform-control/summary"],
    queryFn: async () => {
      const res = await fetch("/api/platform-control/summary", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: deployments, isLoading: deploymentsLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/platform-control/deployments"],
    queryFn: async () => {
      const res = await fetch("/api/platform-control/deployments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/platform-control/deployments/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/platform-control/deployments"] });
      qc.invalidateQueries({ queryKey: ["/api/platform-control/summary"] });
      toast({ title: "Deployment deleted" });
    },
  });

  const handleLogout = async () => {
    await fetch("/api/platform-control/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const formatCurrency = (cents: number | undefined, currency: string = "GHS") => {
    if (!cents) return `${GHS}0`;
    const symbol = currency === "GHS" ? GHS : currency === "USD" ? "$" : currency;
    return `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Deployments" value={summary.totalDeployments} icon={Server} sub={`${summary.activeDeployments} active, ${summary.trialDeployments} trial`} />
            <StatCard label="Monthly Revenue" value={formatCurrency(summary.totalMRRCents)} icon={DollarSign} sub="All active deployments" />
            <StatCard label="Countries" value={summary.countriesServed.length} icon={Globe} sub={summary.countriesServed.join(", ") || "None yet"} />
            <StatCard label="Total Records" value={(summary.totalBorrowers || 0).toLocaleString()} icon={Users} sub={`${summary.totalInstitutions} institutions`} />
          </div>
        )}

        {summary?.localBorrowers !== undefined && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-6">
            <p className="text-xs font-semibold text-blue-500 mb-2">This Instance (Local)</p>
            <div className="flex gap-6 text-sm">
              <span><strong>{summary.localBorrowers?.toLocaleString()}</strong> borrowers</span>
              <span><strong>{summary.localOrganizations?.toLocaleString()}</strong> organizations</span>
              <span><strong>{summary.localUsers?.toLocaleString()}</strong> users</span>
            </div>
          </div>
        )}

        <ConfigGenerator />

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" data-testid="text-deployments-heading">Client Deployments</h2>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-deployment"><Plus className="w-4 h-4 mr-1" /> Add Deployment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New Deployment</DialogTitle></DialogHeader>
                <DeploymentForm onClose={() => setShowCreate(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {deploymentsLoading && <p className="text-sm text-muted-foreground">Loading deployments...</p>}

          {deployments && deployments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <Server className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No deployments registered yet</p>
              <p className="text-xs mt-1">Add your first client deployment to start tracking</p>
            </div>
          )}

          {deployments && deployments.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm" data-testid="table-deployments">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Country</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Tier</th>
                    <th className="text-right p-3 font-medium">Monthly Fee</th>
                    <th className="text-right p-3 font-medium">Records</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map(d => (
                    <tr key={d.id} className="border-b border-border hover:bg-muted/30" data-testid={`row-deployment-${d.id}`}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{d.clientName}</p>
                          {d.deploymentUrl && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.deploymentUrl}</p>}
                        </div>
                      </td>
                      <td className="p-3">{d.country}</td>
                      <td className="p-3 text-center"><StatusBadge status={d.status} /></td>
                      <td className="p-3 text-center"><Badge variant="outline">{d.licenseTier}</Badge></td>
                      <td className="p-3 text-right">{formatCurrency(d.monthlyFeeCents, d.currency)}</td>
                      <td className="p-3 text-right">{(d.totalBorrowers || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Dialog open={editDeploy?.id === d.id} onOpenChange={open => !open && setEditDeploy(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditDeploy(d)} data-testid={`button-edit-${d.id}`}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                              <DialogHeader><DialogTitle>Edit Deployment</DialogTitle></DialogHeader>
                              <DeploymentForm deployment={editDeploy || undefined} onClose={() => setEditDeploy(null)} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm(`Delete "${d.clientName}"?`)) deleteMutation.mutate(d.id); }}
                            data-testid={`button-delete-${d.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
      </div>
    </div>
  );
}

export default function PlatformMasterControlPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <ControlDashboard />;
}
