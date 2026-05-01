import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Database, Download, Shield, FileText, Clock, Lock, Trash2,
  CheckCircle, AlertTriangle, Search, RefreshCw, Eye, Plus, Pencil,
} from "lucide-react";

function ExportCenterTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportType, setExportType] = useState("portfolio");
  const orgsQuery = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    enabled: user?.role === "super_admin" || user?.role === "platform_owner",
  });

  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<{ percent: number; status: string } | null>(null);

  const handlePortabilityExport = async (orgId: string) => {
    try {
      const csrfRes = await fetch("/api/auth/csrf-token", { credentials: "include" });
      const { token: csrfToken } = await csrfRes.json();

      const initRes = await fetch(`/api/admin/export/${orgId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      });
      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.message || "Export failed");
      }
      const { jobId } = await initRes.json();
      setExportJobId(jobId);
      setExportProgress({ percent: 0, status: "queued" });

      toast({ title: "Export started", description: "Processing in the background. Progress will update automatically." });

      const pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch(`/api/export/progress/${jobId}`, { credentials: "include" });
          if (!progressRes.ok) { clearInterval(pollInterval); return; }
          const progress = await progressRes.json();
          setExportProgress({ percent: progress.percent, status: progress.status });

          if (progress.status === "completed") {
            clearInterval(pollInterval);
            const dlRes = await fetch(`/api/export/download/${jobId}`, { credentials: "include" });
            if (!dlRes.ok) throw new Error("Download failed");

            const sha256 = dlRes.headers.get("X-Export-SHA256");
            const oneTimeKey = dlRes.headers.get("X-Export-Key");
            const iv = dlRes.headers.get("X-Export-IV");

            const blob = await dlRes.blob();
            const disposition = dlRes.headers.get("Content-Disposition") || "";
            const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
            const filename = filenameMatch?.[1] || `export_${Date.now()}.enc`;

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);

            const companionB64 = dlRes.headers.get("X-Export-SHA256-Companion");
            if (companionB64) {
              const companionText = atob(companionB64);
              const sha256Blob = new Blob([companionText], { type: "text/plain" });
              const sha256Link = document.createElement("a");
              sha256Link.href = URL.createObjectURL(sha256Blob);
              sha256Link.download = filename.replace(/\.enc$/, ".sha256");
              sha256Link.click();
              URL.revokeObjectURL(sha256Link.href);
            }

            let desc = `SHA-256: ${sha256?.substring(0, 16)}...`;
            if (oneTimeKey) {
              desc += `\nDecryption Key: ${oneTimeKey}\nIV: ${iv}\n\nSave this key — it cannot be recovered.`;
            }
            toast({ title: "Encrypted export downloaded", description: desc });
            setExportJobId(null);
            setExportProgress(null);
          } else if (progress.status === "failed") {
            clearInterval(pollInterval);
            toast({ title: "Export failed", description: "Background export job failed.", variant: "destructive" });
            setExportJobId(null);
            setExportProgress(null);
          }
        } catch {
          clearInterval(pollInterval);
        }
      }, 2000);
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
      setExportJobId(null);
      setExportProgress(null);
    }
  };

  const handleReportsExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?format=${exportFormat}&type=${exportType}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message || "Export failed");

      const sha256 = res.headers.get("X-Export-SHA256");
      const oneTimeKey = res.headers.get("X-Export-Key");
      const iv = res.headers.get("X-Export-IV");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `${exportType}_report.enc`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      let desc = `Encrypted ${exportType} report downloaded.`;
      if (sha256) desc += `\nSHA-256: ${sha256.substring(0, 16)}...`;
      if (oneTimeKey) desc += `\nDecryption Key: ${oneTimeKey}\nIV: ${iv}\n\nSave this key — it cannot be recovered.`;
      toast({ title: "Encrypted export downloaded", description: desc });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-full-portability">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-500" />
            Full Data Portability Export
          </CardTitle>
          <CardDescription>
            Export complete borrower data including credit accounts, payment history, guarantors,
            inquiries, disputes, court judgments, and dishonoured cheques. Compliant with POPIA, NDPA, Ghana DPA, and GDPR Article 20.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All exports are AES-256 encrypted with a one-time key. Save the decryption key shown after download — it cannot be recovered.
            </AlertDescription>
          </Alert>

          {(user?.role === "super_admin" || user?.role === "platform_owner") && orgsQuery.data ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select an organization to export:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(orgsQuery.data as any[]).slice(0, 20).map((org: any) => (
                  <Button
                    key={org.id}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePortabilityExport(org.id)}
                    data-testid={`button-export-org-${org.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {org.name} ({org.country || "Global"})
                  </Button>
                ))}
              </div>
            </div>
          ) : user?.organizationId ? (
            <Button
              onClick={() => handlePortabilityExport(user.organizationId!)}
              data-testid="button-export-my-org"
              disabled={!!exportJobId}
            >
              <Download className="h-4 w-4 mr-2" />
              Export My Organization Data
            </Button>
          ) : null}
          {exportProgress && (
            <div className="mt-4 space-y-2" data-testid="export-progress">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{exportProgress.status}</span>
                <span>{exportProgress.percent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${exportProgress.percent}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-report-export">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Report Export
          </CardTitle>
          <CardDescription>Export portfolio, borrower, or audit trail reports in CSV or Excel format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-[180px]" data-testid="select-export-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="borrowers">Borrowers</SelectItem>
                <SelectItem value="audit">Audit Trail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[120px]" data-testid="select-export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleReportsExport} data-testid="button-export-report">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErasureRequestsTab() {
  const { toast } = useToast();
  const erasureQuery = useQuery<any[]>({ queryKey: ["/api/data-management/erasure-requests"] });

  const cascadeMutation = useMutation({
    mutationFn: async (borrowerId: string) => {
      const res = await apiRequest("POST", `/api/data-management/cascade-erasure/${borrowerId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Erasure completed", description: `Deleted: ${data.deletedAccounts} accounts, ${data.deletedPayments} payments, ${data.deletedGuarantors} guarantors, ${data.deletedInquiries} inquiries, ${data.deletedDisputes} disputes` });
      queryClient.invalidateQueries({ queryKey: ["/api/data-management/erasure-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-management/export-history"] });
    },
    onError: (e: Error) => toast({ title: "Erasure failed", description: e.message, variant: "destructive" }),
  });

  if (erasureQuery.isLoading) return <div className="text-center py-8 text-muted-foreground">Loading erasure requests...</div>;

  const requests = erasureQuery.data || [];

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cascade erasure permanently deletes ALL data related to a borrower: credit accounts, payment history,
          guarantors, inquiries, disputes, court judgments, dishonoured cheques, consent records, alerts, and consumer portal accounts.
          This action cannot be undone.
        </AlertDescription>
      </Alert>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            No pending erasure requests
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req: any) => {
              let payload: any = {};
              try { payload = typeof req.payload === "string" ? JSON.parse(req.payload) : req.payload; } catch {}
              return (
                <TableRow key={req.id} data-testid={`row-erasure-${req.id}`}>
                  <TableCell className="font-medium">{payload.borrowerName || payload.borrowerId || "Unknown"}</TableCell>
                  <TableCell>{payload.reason || "Data subject request"}</TableCell>
                  <TableCell><Badge variant={req.status === "pending" ? "secondary" : "default"}>{req.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    {req.status === "approved" && payload.borrowerId && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cascadeMutation.mutate(payload.borrowerId)}
                        disabled={cascadeMutation.isPending}
                        data-testid={`button-cascade-${req.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Execute Cascade Erasure
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RetentionScanTab() {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<any>(null);

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/data-management/retention-scan");
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      toast({ title: "Retention scan complete", description: `${data.policiesEvaluated} policies evaluated, ${data.recordsFlagged} records flagged` });
    },
    onError: (e: Error) => toast({ title: "Scan failed", description: e.message, variant: "destructive" }),
  });

  const policiesQuery = useQuery<any[]>({ queryKey: ["/api/retention-policies"] });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            Retention Policy Scanner
          </CardTitle>
          <CardDescription>
            Scan all active retention policies and identify records that have exceeded their retention period.
            Records are flagged for review — no data is deleted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            data-testid="button-run-scan"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scanMutation.isPending ? "animate-spin" : ""}`} />
            {scanMutation.isPending ? "Scanning..." : "Run Retention Scan"}
          </Button>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scan Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-policies-evaluated">{scanResult.policiesEvaluated}</div>
                <div className="text-xs text-muted-foreground">Policies Evaluated</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-amber-500" data-testid="text-records-flagged">{scanResult.recordsFlagged}</div>
                <div className="text-xs text-muted-foreground">Records Flagged</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-500" data-testid="text-records-archived">{scanResult.recordsArchived}</div>
                <div className="text-xs text-muted-foreground">Records Archived</div>
              </div>
            </div>

            {scanResult.details?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Retention (years)</TableHead>
                    <TableHead>Records Affected</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanResult.details.map((d: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{d.country}</TableCell>
                      <TableCell>{d.entityType}</TableCell>
                      <TableCell>{d.retentionYears}</TableCell>
                      <TableCell>
                        <Badge variant={d.recordsAffected > 0 ? "destructive" : "secondary"}>
                          {d.recordsAffected}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{d.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active Retention Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {policiesQuery.isLoading ? (
            <div className="text-muted-foreground text-sm">Loading policies...</div>
          ) : (policiesQuery.data || []).length === 0 ? (
            <div className="text-muted-foreground text-sm">No retention policies configured. Go to Retention Policies page to add them.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead>Archive After</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(policiesQuery.data || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.country}</TableCell>
                    <TableCell>{p.entityType}</TableCell>
                    <TableCell>{p.retentionYears} years</TableCell>
                    <TableCell>{p.archiveAfterYears ? `${p.archiveAfterYears} years` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const ENTITY_TYPES = [
  { value: "borrower", label: "Borrower" },
  { value: "credit_account", label: "Credit Account" },
  { value: "audit_log", label: "Audit Log" },
  { value: "dispute", label: "Dispute" },
  { value: "consent_record", label: "Consent Record" },
  { value: "court_judgment", label: "Court Judgment" },
  { value: "payment_history", label: "Payment History" },
];

const AFRICAN_COUNTRIES = [
  "All", "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo", "DR Congo", "Côte d'Ivoire", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia",
  "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
  "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

const POLICY_ACTIONS = [
  { value: "flag", label: "Flag for Review" },
  { value: "archive", label: "Archive" },
  { value: "delete", label: "Delete / Expunge" },
];

interface PolicyForm {
  country: string;
  entityType: string;
  retentionYears: number;
  archiveAfterYears: number | null;
  action: string;
  description: string;
  isActive: boolean;
}

const defaultPolicyForm: PolicyForm = {
  country: "Ghana",
  entityType: "borrower",
  retentionYears: 7,
  archiveAfterYears: null,
  action: "flag",
  description: "",
  isActive: true,
};

function RetentionPoliciesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(defaultPolicyForm);

  const policiesQuery = useQuery<any[]>({ queryKey: ["/api/retention-policies"] });

  const createMutation = useMutation({
    mutationFn: async (data: PolicyForm) => {
      const res = await apiRequest("POST", "/api/retention-policies", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Policy created" });
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDialogOpen(false);
      setForm(defaultPolicyForm);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PolicyForm> }) => {
      const res = await apiRequest("PATCH", `/api/retention-policies/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Policy updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultPolicyForm);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/retention-policies/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Policy deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultPolicyForm);
    setDialogOpen(true);
  };

  const openEdit = (policy: any) => {
    setEditingId(policy.id);
    setForm({
      country: policy.country,
      entityType: policy.entityType,
      retentionYears: policy.retentionYears,
      archiveAfterYears: policy.archiveAfterYears ?? null,
      action: policy.action || "flag",
      description: policy.description || "",
      isActive: policy.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const policies = policiesQuery.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Retention Policies</h3>
          <p className="text-sm text-muted-foreground">
            Configure data retention periods per country and entity type. The daily enforcement scheduler
            automatically archives and expunges records based on these policies.
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-policy">
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {policiesQuery.isLoading ? (
        <div className="text-muted-foreground text-sm py-8 text-center">Loading policies...</div>
      ) : policies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2" />
            No retention policies configured yet. Click "Add Policy" to create one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead>Archive After</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-policy-${p.id}`}>
                    <TableCell className="font-medium">{p.country}</TableCell>
                    <TableCell>{ENTITY_TYPES.find(e => e.value === p.entityType)?.label || p.entityType}</TableCell>
                    <TableCell>{p.retentionYears} years</TableCell>
                    <TableCell>{p.archiveAfterYears ? `${p.archiveAfterYears} years` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.action === "delete" ? "destructive" : p.action === "archive" ? "default" : "secondary"}>
                        {POLICY_ACTIONS.find(a => a.value === p.action)?.label || p.action || "Flag"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{p.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-policy-${p.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => { if (confirm("Delete this retention policy?")) deleteMutation.mutate(p.id); }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-policy-${p.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Retention Policy" : "Create Retention Policy"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the retention period and configuration for this policy." : "Define a new data retention policy for a specific country and entity type."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="policy-country">Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger data-testid="select-policy-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-entity">Entity Type</Label>
              <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })}>
                <SelectTrigger data-testid="select-policy-entity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enforcement Action</Label>
              <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                <SelectTrigger data-testid="select-policy-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policy-retention">Retention (years)</Label>
                <Input
                  id="policy-retention"
                  type="number"
                  min={1}
                  max={50}
                  value={form.retentionYears}
                  onChange={(e) => setForm({ ...form, retentionYears: parseInt(e.target.value) || 1 })}
                  data-testid="input-retention-years"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-archive">Archive After (years)</Label>
                <Input
                  id="policy-archive"
                  type="number"
                  min={1}
                  max={50}
                  value={form.archiveAfterYears ?? ""}
                  onChange={(e) => setForm({ ...form, archiveAfterYears: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Optional"
                  data-testid="input-archive-years"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-description">Description</Label>
              <Input
                id="policy-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Ghana NCA Act 2008 Section 34 compliance"
                data-testid="input-policy-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                data-testid="switch-policy-active"
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-policy">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-policy"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExportHistoryTab() {
  const historyQuery = useQuery<any[]>({ queryKey: ["/api/data-management/export-history"] });

  if (historyQuery.isLoading) return <div className="text-center py-8 text-muted-foreground">Loading export history...</div>;

  const logs = historyQuery.data || [];

  const getActionBadge = (action: string) => {
    switch (action) {
      case "FULL_DATA_EXPORT": return <Badge className="bg-emerald-600">Full Export</Badge>;
      case "CONSUMER_DATA_EXPORT": return <Badge className="bg-blue-600">Consumer Export</Badge>;
      case "data_export": return <Badge className="bg-purple-600">Report Export</Badge>;
      case "REPORT_EXPORT": return <Badge className="bg-purple-600">Report Export</Badge>;
      case "REGULATORY_EXPORT": return <Badge className="bg-indigo-600">Regulatory Export</Badge>;
      case "DATA_ERASURE_REQUEST": return <Badge variant="destructive">Erasure Request</Badge>;
      case "DATA_ERASURE_COMPLETED": return <Badge className="bg-red-700">Erasure Completed</Badge>;
      case "CASCADE_ENTITY_DELETED": return <Badge className="bg-red-500">Entity Deleted</Badge>;
      case "RETENTION_SCAN": return <Badge className="bg-amber-600">Retention Scan</Badge>;
      default: return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2" />
            No export or data management activity yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} data-testid={`row-history-${log.id}`}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm">{log.entity} {log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ""}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ipAddress || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DataManagementPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-data-management">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Data Management</h1>
          <p className="text-muted-foreground text-sm">
            Export, retention, erasure, and data portability — POPIA, NDPA, Ghana DPA & GDPR Article 20 compliant
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          AES-256 Export Encryption
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Lock className="h-3 w-3 mr-1" />
          SHA-256 Integrity Hashing
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Rate Limited (5/hr)
        </Badge>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="export" data-testid="tab-export">Export Center</TabsTrigger>
          <TabsTrigger value="policies" data-testid="tab-policies">Retention Policies</TabsTrigger>
          <TabsTrigger value="retention" data-testid="tab-retention">Retention Scanner</TabsTrigger>
          <TabsTrigger value="erasure" data-testid="tab-erasure">Erasure Requests</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <ExportCenterTab />
        </TabsContent>

        <TabsContent value="policies">
          <RetentionPoliciesTab />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionScanTab />
        </TabsContent>

        <TabsContent value="erasure">
          <ErasureRequestsTab />
        </TabsContent>

        <TabsContent value="history">
          <ExportHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
