import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, CheckCircle2, XCircle, Clock, Search, Building2, FileText,
  BarChart3, TrendingUp, AlertTriangle, Download, RefreshCw, Gavel,
  Award,
} from "lucide-react";
import { format } from "date-fns";

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real Estate", vehicle: "Vehicle", equipment: "Equipment",
  inventory: "Inventory", securities: "Securities", land: "Land",
  livestock: "Livestock", crop: "Crops", other: "Other",
};

interface ActiveLienItem {
  id: string;
  registrationNumber?: string;
  panAfricanAssetId?: string;
  assetLocalIdentifier?: string;
  collateralType: string;
  borrowerName?: string;
  borrowerId?: string;
  lenderOrganizationId?: string;
  lenderInstitution?: string;
  lenderInstitutionName?: string;
  estimatedValue?: string;
  currency?: string;
  approvalDate?: string;
  certificateNumber?: string;
  lienPriority?: number;
  status?: string;
  enforcementStatus?: string;
  description?: string;
  countryCode?: string;
}

interface PendingItem {
  id: string;
  registrationNumber?: string;
  panAfricanAssetId?: string;
  assetLocalIdentifier?: string;
  collateralType: string;
  borrowerName?: string;
  borrowerId?: string;
  lenderOrganizationId?: string;
  lenderInstitution?: string;
  lenderInstitutionName?: string;
  estimatedValue?: string;
  currency?: string;
  countryCode?: string;
  description?: string;
  legalRegime?: string;
  requiredFieldsJson?: string;
  createdAt?: string;
}

const REGIME_COLORS: Record<string, string> = {
  "OHADA": "bg-purple-100 text-purple-700",
  "Civil Law": "bg-blue-100 text-blue-700",
  "Common Law": "bg-green-100 text-green-700",
  "Customary Law": "bg-orange-100 text-orange-700",
};

function formatVal(v: number) {
  return v.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCurrency(amount: string | number | null, currency = "GHS") {
  if (!amount) return "—";
  return `${currency} ${Number(amount).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

function PriorityBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span className="text-muted-foreground text-xs">—</span>;
  const color = rank === 1 ? "bg-amber-100 text-amber-800" : rank === 2 ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-600";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>#{rank}</span>;
}

function ApproveDialog({ item, countryCode }: { item: PendingItem; countryCode: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/collateral/${item.id}/approve`, {}),
    onSuccess: () => {
      toast({ title: "Lien approved", description: `Certificate issued for ${item.registrationNumber}.` });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/collateral/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral/active-liens", countryCode] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200" data-testid={`btn-approve-${item.id}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Approve Lien Registration</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">You are about to approve this registration and issue a Certificate of Collateral Registration. Priority rank will be automatically assigned.</p>
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <div><span className="font-medium">Reg #:</span> {item.registrationNumber}</div>
          <div><span className="font-medium">Asset:</span> {ASSET_TYPE_LABELS[item.collateralType] || item.collateralType}</div>
          <div><span className="font-medium">Description:</span> {item.description}</div>
          <div><span className="font-medium">Value:</span> {formatCurrency(item.estimatedValue, item.currency)}</div>
          {item.panAfricanAssetId && <div><span className="font-medium">Pan-African ID:</span> {item.panAfricanAssetId}</div>}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-4 h-4" /> {mutation.isPending ? "Approving..." : "Approve & Issue Certificate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ item }: { item: PendingItem }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/collateral/${item.id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Registration rejected" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/collateral/pending"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-red-600 border-red-200" data-testid={`btn-reject-${item.id}`}>
          <XCircle className="w-3.5 h-3.5" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject Registration</DialogTitle></DialogHeader>
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div><span className="font-medium">Reg #:</span> {item.registrationNumber}</div>
          <div><span className="font-medium">Asset:</span> {item.description}</div>
        </div>
        <div>
          <Label>Rejection Reason <span className="text-red-500">*</span></Label>
          <Textarea
            data-testid="input-rejection-reason"
            placeholder="State the reason for rejection..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={!reason.trim() || mutation.isPending}>
            {mutation.isPending ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EnforceDischargeButtons({ item, countryCode }: { item: ActiveLienItem; countryCode: string }) {
  const { toast } = useToast();
  const enforceMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/collateral/${item.id}/enforce`, {}),
    onSuccess: () => {
      toast({ title: "Lien flagged as in enforcement" });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral/active-liens", countryCode] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const dischargeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/collateral/${item.id}/discharge`, {}),
    onSuccess: () => {
      toast({ title: "Lien discharged", description: "Asset is now free." });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral/active-liens", countryCode] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  return (
    <div className="flex gap-1">
      {item.status === "active" && !item.enforcementStatus && (
        <Button variant="ghost" size="sm" onClick={() => enforceMutation.mutate()} disabled={enforceMutation.isPending}
          title="Flag as In Enforcement" data-testid={`btn-enforce-${item.id}`}>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </Button>
      )}
      {item.status === "active" && (
        <Button variant="ghost" size="sm" onClick={() => dischargeMutation.mutate()} disabled={dischargeMutation.isPending}
          title="Discharge lien" data-testid={`btn-discharge-${item.id}`}>
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </Button>
      )}
    </div>
  );
}

function PendingQueue({ orgId, countryCode }: { orgId: string; countryCode: string }) {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useQuery<PendingItem[]>({
    queryKey: ["/api/collateral/pending"],
    queryFn: () => fetch("/api/collateral/pending", { credentials: "include" }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
  });
  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.registrationNumber?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.assetLocalIdentifier?.toLowerCase().includes(q) ||
      i.lenderInstitutionName?.toLowerCase().includes(q) ||
      i.lenderInstitution?.toLowerCase().includes(q)
    );
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search-pending" placeholder="Search pending registrations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge className="bg-amber-100 text-amber-800">{items.length} pending</Badge>
      </div>
      {isLoading ? (
        <div className="text-center text-muted-foreground p-8">Loading pending registrations...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 space-y-2">
          <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{search ? "No matching registrations." : "No pending registrations. All clear!"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg #</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Pan-African ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Legal Regime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} data-testid={`row-pending-${item.id}`}>
                  <TableCell className="font-mono text-xs">{item.registrationNumber}</TableCell>
                  <TableCell className="text-sm">{ASSET_TYPE_LABELS[item.collateralType] || item.collateralType}</TableCell>
                  <TableCell className="text-sm" data-testid={`text-lender-${item.id}`}>
                    {item.lenderInstitutionName || item.lenderInstitution || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.panAfricanAssetId || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{item.description}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(item.estimatedValue, item.currency)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    {item.legalRegime ? (
                      <Badge className={`text-xs ${REGIME_COLORS[item.legalRegime] || "bg-gray-100 text-gray-600"}`}>{item.legalRegime}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ApproveDialog item={item} countryCode={countryCode} />
                      <RejectDialog item={item} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ActiveLiensLedger({ countryCode }: { countryCode: string }) {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useQuery<ActiveLienItem[]>({
    queryKey: ["/api/collateral/active-liens", countryCode],
    queryFn: () => fetch(`/api/collateral/active-liens?countryCode=${encodeURIComponent(countryCode)}`, { credentials: "include" }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
  });
  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.registrationNumber?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.panAfricanAssetId?.toLowerCase().includes(q) ||
      i.assetLocalIdentifier?.toLowerCase().includes(q) ||
      i.borrowerName?.toLowerCase().includes(q) ||
      i.lenderInstitutionName?.toLowerCase().includes(q) ||
      i.lenderInstitution?.toLowerCase().includes(q)
    );
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search-active-liens" placeholder="Search by asset ID, borrower, or institution..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge className="bg-green-100 text-green-800">{items.length} active liens</Badge>
      </div>
      {isLoading ? (
        <div className="text-center text-muted-foreground p-8">Loading active liens...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 space-y-2">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{search ? "No matching liens." : "No active liens registered yet."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Cert #</TableHead>
                <TableHead>Pan-African ID</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} data-testid={`row-lien-${item.id}`}>
                  <TableCell><PriorityBadge rank={item.lienPriority} /></TableCell>
                  <TableCell className="font-mono text-xs">{item.certificateNumber || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.panAfricanAssetId || item.assetLocalIdentifier || "—"}</TableCell>
                  <TableCell className="text-sm">{ASSET_TYPE_LABELS[item.collateralType] || item.collateralType}</TableCell>
                  <TableCell className="text-sm">{item.borrowerName || item.borrowerId}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(item.estimatedValue, item.currency)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.approvalDate || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${item.enforcementStatus === "in_enforcement" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {item.enforcementStatus === "in_enforcement" ? "In Enforcement" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EnforceDischargeButtons item={item} countryCode={countryCode} />
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`btn-cert-download-${item.id}`}
                        title="Download Certificate"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = `/api/collateral/${item.id}/certificate`;
                          a.download = `cert-${item.registrationNumber || item.id}.pdf`;
                          a.click();
                        }}
                        className="gap-1 text-xs"
                      >
                        <Download className="w-3 h-3" />
                        Cert
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface ReportRow { orgId?: string; orgName?: string; type?: string; sector?: string; count: number; value?: number }
interface RegulatoryReport {
  totalActive: number;
  totalValue: number;
  byInstitution: ReportRow[];
  byAssetType: ReportRow[];
  bySector: ReportRow[];
}

function RegulatoryReports({ countryCode }: { countryCode: string }) {
  const { data: report, isLoading } = useQuery<RegulatoryReport>({
    queryKey: ["/api/collateral/regulatory-report", countryCode],
    queryFn: () => fetch(`/api/collateral/regulatory-report?countryCode=${encodeURIComponent(countryCode)}`, { credentials: "include" }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
  });

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Institution", "Lien Count", "Total Value"],
      ...report.byInstitution.map((r) => [r.orgName, r.count, r.value]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collateral-report-${countryCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="text-center text-muted-foreground p-8">Loading report...</div>;
  if (!report) return <div className="text-center p-8 text-muted-foreground">No data available.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary" data-testid="text-total-active-liens">{formatVal(report.totalActive)}</div>
            <div className="text-sm text-muted-foreground">Active Liens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatVal(report.totalValue)}</div>
            <div className="text-sm text-muted-foreground">Total Collateral Value</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> By Institution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.byInstitution.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : report.byInstitution.map((r) => (
                <div key={r.orgId} className="flex justify-between text-sm">
                  <span className="truncate text-muted-foreground" title={r.orgName}>{r.orgName}</span>
                  <span className="font-medium ml-2">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> By Asset Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.byAssetType.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : report.byAssetType.map((r) => (
                <div key={r.type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{ASSET_TYPE_LABELS[r.type] || r.type}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> By Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.bySector.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : report.bySector.map((r: { sector: string; count: number; value: number }) => (
                <div key={r.sector} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.sector}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCsv} className="gap-2" data-testid="btn-export-report-csv">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>
    </div>
  );
}

export default function RegistryAuthorityPortal() {
  const { user } = useAuth();
  const org = user?.organization;

  // Dynamically resolve country code from registry_country_config using org's country name
  interface CountryConfig { countryCode: string; countryName: string; legalRegime: string; authorityName: string }
  const { data: countryConfigs = [] } = useQuery<CountryConfig[]>({
    queryKey: ["/api/registry-country-config"],
  });
  const countryCode: string = (() => {
    if (!org?.country) return "GH";
    const rawCountry = org.country.trim();
    // If it's already a 2-char ISO code, use it directly
    if (rawCountry.length === 2) return rawCountry.toUpperCase();
    // Look up by countryName in the fetched config (covers all 54 countries)
    const cfg = countryConfigs.find(
      (c) => c.countryName?.toLowerCase() === rawCountry.toLowerCase()
    );
    return cfg?.countryCode || rawCountry.toUpperCase().slice(0, 2) || "GH";
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{org?.name || "Registry Authority"}</h1>
              <p className="text-xs text-muted-foreground">Pan-African Collateral Registry — Government Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary">
              {org?.country || ""}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/collateral/pending"] });
              queryClient.invalidateQueries({ queryKey: ["/api/collateral/active-liens", countryCode] });
              queryClient.invalidateQueries({ queryKey: ["/api/collateral/regulatory-report", countryCode] });
            }} data-testid="btn-refresh-portal">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="pending">
          <TabsList className="mb-6" data-testid="tabs-registry-portal">
            <TabsTrigger value="pending" data-testid="tab-pending-queue">
              <Clock className="w-4 h-4 mr-2" /> Pending Queue
            </TabsTrigger>
            <TabsTrigger value="ledger" data-testid="tab-active-ledger">
              <FileText className="w-4 h-4 mr-2" /> Active Liens Ledger
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-regulatory-reports">
              <BarChart3 className="w-4 h-4 mr-2" /> Regulatory Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> Pending Lien Registrations
                </CardTitle>
                <p className="text-sm text-muted-foreground">Review and approve or reject lien registration submissions from licensed financial institutions.</p>
              </CardHeader>
              <CardContent>
                <PendingQueue orgId={org?.id || ""} countryCode={countryCode} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-primary" /> Active Liens Ledger
                </CardTitle>
                <p className="text-sm text-muted-foreground">All approved and certified liens in your country's registry. Discharge liens when loans are repaid or flag for enforcement.</p>
              </CardHeader>
              <CardContent>
                <ActiveLiensLedger countryCode={countryCode} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Regulatory Summary Reports
                </CardTitle>
                <p className="text-sm text-muted-foreground">Aggregate collateral exposure across your financial system — by institution, asset type, and economic sector.</p>
              </CardHeader>
              <CardContent>
                <RegulatoryReports countryCode={countryCode} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
