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
import {
  Database, Download, Shield, FileText, Clock, Lock, Trash2,
  CheckCircle, AlertTriangle, Search, RefreshCw, Eye,
} from "lucide-react";

function ExportCenterTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportType, setExportType] = useState("portfolio");
  const [encrypt, setEncrypt] = useState(false);

  const orgsQuery = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    enabled: user?.role === "super_admin",
  });

  const handlePortabilityExport = async (orgId: string) => {
    try {
      const url = `/api/admin/export/${orgId}${encrypt ? "?encrypt=true" : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }

      const sha256 = res.headers.get("X-Export-SHA256");
      const isEncrypted = res.headers.get("X-Export-Encrypted") === "true";
      const oneTimeKey = res.headers.get("X-Export-Key");
      const iv = res.headers.get("X-Export-IV");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `export_${Date.now()}.json`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      let desc = `SHA-256: ${sha256?.substring(0, 16)}...`;
      if (isEncrypted && oneTimeKey) {
        desc += `\nDecryption Key: ${oneTimeKey}\nIV: ${iv}\n\nSave this key — it cannot be recovered.`;
      }
      toast({ title: isEncrypted ? "Encrypted export downloaded" : "Export downloaded", description: desc });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReportsExport = async () => {
    try {
      const res = await fetch(`/api/reports/export?format=${exportFormat}&type=${exportType}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message || "Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `${exportType}_report.${exportFormat}`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      toast({ title: "Report exported", description: `${exportType} report downloaded as ${exportFormat.toUpperCase()}` });
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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={encrypt}
                onChange={(e) => setEncrypt(e.target.checked)}
                data-testid="checkbox-encrypt"
                className="rounded"
              />
              <Lock className="h-4 w-4" />
              AES-256 Encrypt export
            </label>
          </div>

          {encrypt && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                The export will be encrypted with a one-time key. Save the decryption key shown after download — it cannot be recovered.
              </AlertDescription>
            </Alert>
          )}

          {user?.role === "super_admin" && orgsQuery.data ? (
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
            >
              <Download className="h-4 w-4 mr-2" />
              Export My Organization Data
            </Button>
          ) : null}
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

function ExportHistoryTab() {
  const historyQuery = useQuery<any[]>({ queryKey: ["/api/data-management/export-history"] });

  if (historyQuery.isLoading) return <div className="text-center py-8 text-muted-foreground">Loading export history...</div>;

  const logs = historyQuery.data || [];

  const getActionBadge = (action: string) => {
    switch (action) {
      case "FULL_DATA_EXPORT": return <Badge className="bg-emerald-600">Full Export</Badge>;
      case "CONSUMER_DATA_EXPORT": return <Badge className="bg-blue-600">Consumer Export</Badge>;
      case "data_export": return <Badge className="bg-purple-600">Report Export</Badge>;
      case "DATA_ERASURE_REQUEST": return <Badge variant="destructive">Erasure Request</Badge>;
      case "DATA_ERASURE_COMPLETED": return <Badge className="bg-red-700">Erasure Completed</Badge>;
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export" data-testid="tab-export">Export Center</TabsTrigger>
          <TabsTrigger value="retention" data-testid="tab-retention">Retention Scanner</TabsTrigger>
          <TabsTrigger value="erasure" data-testid="tab-erasure">Erasure Requests</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <ExportCenterTab />
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
