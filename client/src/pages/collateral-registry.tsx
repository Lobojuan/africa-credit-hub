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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Plus, Search, RefreshCw, MapPin, Package, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const COLLATERAL_TYPES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "equipment", label: "Equipment / Machinery" },
  { value: "inventory", label: "Inventory" },
  { value: "securities", label: "Securities / Shares" },
  { value: "land", label: "Land" },
  { value: "livestock", label: "Livestock" },
  { value: "crop", label: "Crops" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  released: "bg-gray-100 text-gray-600",
  defaulted: "bg-red-100 text-red-700",
  under_review: "bg-yellow-100 text-yellow-800",
};

function formatCurrency(amount: string | number | null, currency = "GHS") {
  if (!amount) return "—";
  return `${currency} ${Number(amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function RegisterCollateralDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    borrowerId: "",
    loanApplicationId: "",
    collateralType: "real_estate",
    description: "",
    estimatedValue: "",
    currency: "GHS",
    location: "",
    registrationDate: today(),
    expiryDate: "",
    documentReference: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/collateral", data),
    onSuccess: () => {
      toast({ title: "Collateral registered", description: "Asset successfully added to the registry." });
      setOpen(false);
      onSuccess();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.borrowerId || !form.description || !form.estimatedValue) {
      toast({ title: "Validation", description: "Borrower ID, description, and value are required.", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-register-collateral" className="gap-2">
          <Plus className="w-4 h-4" /> Register Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Collateral Asset</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label>Borrower ID</Label>
            <Input data-testid="input-col-borrower-id" placeholder="Borrower ID" value={form.borrowerId} onChange={e => setForm(f => ({ ...f, borrowerId: e.target.value }))} />
          </div>
          <div>
            <Label>Loan Application ID (optional)</Label>
            <Input placeholder="Link to loan..." value={form.loanApplicationId} onChange={e => setForm(f => ({ ...f, loanApplicationId: e.target.value }))} />
          </div>
          <div>
            <Label>Collateral Type</Label>
            <Select value={form.collateralType} onValueChange={v => setForm(f => ({ ...f, collateralType: v }))}>
              <SelectTrigger data-testid="select-col-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLLATERAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GHS">GHS</SelectItem>
                <SelectItem value="NGN">NGN</SelectItem>
                <SelectItem value="KES">KES</SelectItem>
                <SelectItem value="ZAR">ZAR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimated Value</Label>
            <Input data-testid="input-col-value" type="number" placeholder="0.00" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} />
          </div>
          <div>
            <Label>Location</Label>
            <Input data-testid="input-col-location" placeholder="Physical location / address" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <Label>Registration Date</Label>
            <Input type="date" value={form.registrationDate} onChange={e => setForm(f => ({ ...f, registrationDate: e.target.value }))} />
          </div>
          <div>
            <Label>Expiry Date (optional)</Label>
            <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <div>
            <Label>Document Reference</Label>
            <Input placeholder="Title deed, reg no., etc." value={form.documentReference} onChange={e => setForm(f => ({ ...f, documentReference: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea data-testid="input-col-description" placeholder="Detailed description of the asset..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="btn-submit-collateral" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Registering..." : "Register Asset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReleaseDialog({ item, onSuccess }: { item: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/collateral/${item.id}`, { status: "released" }),
    onSuccess: () => { toast({ title: "Asset released" }); setOpen(false); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`btn-release-${item.id}`}><CheckCircle className="w-4 h-4 text-green-600" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Release Collateral</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to mark this collateral as <strong>released</strong>? This means the lien has been discharged and the asset is free.</p>
        <p className="text-sm font-medium mt-2">{item.registrationNumber} — {item.description}</p>
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
            <CheckCircle className="w-4 h-4" /> {mutation.isPending ? "Releasing..." : "Confirm Release"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CollateralRegistryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: items = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/collateral"],
    queryFn: () => fetch("/api/collateral", { credentials: "include" }).then(r => r.json()),
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.status === "active").length,
    totalValue: items.filter(i => i.status === "active").reduce((s, i) => s + Number(i.estimatedValue || 0), 0),
    released: items.filter(i => i.status === "released").length,
  };

  const filtered = items.filter(i => {
    if (typeFilter !== "all" && i.collateralType !== typeFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.registrationNumber?.toLowerCase().includes(search.toLowerCase()) && !i.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collateral Registry</h1>
          <p className="text-muted-foreground">Pan-African pledged-asset registry — track, manage, and release collateral</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="btn-refresh-collateral"><RefreshCw className="w-4 h-4" /></Button>
          <RegisterCollateralDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/collateral"] })} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Total Assets</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{stats.active}</div><div className="text-sm text-muted-foreground">Active Liens</div></CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xl font-bold">GHS {stats.totalValue.toLocaleString("en-GH", { minimumFractionDigits: 0 })}</div>
          <div className="text-sm text-muted-foreground">Total Active Value</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-gray-500">{stats.released}</div><div className="text-sm text-muted-foreground">Released</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input data-testid="input-search-collateral" placeholder="Search by registration number or description..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {COLLATERAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading collateral registry...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Building className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No collateral assets registered. Add the first asset to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Estimated Value</TableHead>
                    <TableHead>Reg. Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: any) => (
                    <TableRow key={item.id} data-testid={`row-collateral-${item.id}`}>
                      <TableCell className="font-mono text-sm">{item.registrationNumber}</TableCell>
                      <TableCell className="text-sm capitalize">{item.collateralType?.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={item.description}>{item.description}</TableCell>
                      <TableCell className="text-sm">
                        {item.location ? (
                          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" />{item.location}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(item.estimatedValue, item.currency)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.registrationDate}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[item.status] || ""}`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "active" && (
                          <ReleaseDialog item={item} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/collateral"] })} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
