import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Globe, Shield, FileText, CheckCircle2, AlertTriangle,
  XCircle, Clock, Handshake, ArrowRight, Loader2, Trash2, Pencil,
} from "lucide-react";
import type { DataSharingAgreement } from "@shared/schema";

const SUPPORTED_COUNTRIES = [
  "Ghana", "Sierra Leone", "Nigeria", "Kenya", "Rwanda",
  "Tanzania", "Uganda", "Ethiopia", "South Africa", "Liberia",
];

const ALLOWED_DATA_TYPES = [
  "borrower_demographics", "credit_accounts", "payment_history",
  "credit_scores", "court_judgments", "consent_records",
];

const REGIONAL_BLOCS = ["ECOWAS", "EAC", "SADC", "COMESA", "AU", "CEMAC", "UEMOA"];

function statusBadge(status: string) {
  const map: Record<string, { color: string; icon: any }> = {
    draft: { color: "bg-muted text-foreground dark:bg-foreground dark:text-muted-foreground", icon: Clock },
    active: { color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
    suspended: { color: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900 dark:text-amber-300", icon: AlertTriangle },
    expired: { color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  };
  const s = map[status] || map.draft;
  const Icon = s.icon;
  return (
    <Badge variant="secondary" className={`${s.color} text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function CrossBorderAgreementsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<DataSharingAgreement | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ legalBasis: "", description: "", effectiveDate: "", expiryDate: "", regionalBloc: "", sourceInstitutions: "", targetInstitutions: "" });
  const [form, setForm] = useState({
    sourceCountry: "", targetCountry: "", allowedDataTypes: [] as string[],
    effectiveDate: "", expiryDate: "", legalBasis: "", description: "", regionalBloc: "",
    sourceInstitutions: "", targetInstitutions: "",
  });

  const { data: agreements = [], isLoading } = useQuery<DataSharingAgreement[]>({
    queryKey: ["/api/sata/agreements"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sata/agreements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Agreement created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/sata/agreements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      setSelectedAgreement(null);
      toast({ title: "Agreement updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sata/agreements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      setSelectedAgreement(null);
      toast({ title: "Agreement deleted" });
    },
  });

  const resetForm = () => setForm({ sourceCountry: "", targetCountry: "", allowedDataTypes: [], effectiveDate: "", expiryDate: "", legalBasis: "", description: "", regionalBloc: "", sourceInstitutions: "", targetInstitutions: "" });

  const handleCreate = () => {
    if (!form.sourceCountry || !form.targetCountry || form.allowedDataTypes.length === 0) {
      toast({ title: "Validation Error", description: "Source country, target country, and at least one data type are required", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      sourceInstitutions: form.sourceInstitutions ? form.sourceInstitutions.split(",").map(s => s.trim()).filter(Boolean) : [],
      targetInstitutions: form.targetInstitutions ? form.targetInstitutions.split(",").map(s => s.trim()).filter(Boolean) : [],
    };
    createMutation.mutate(payload);
  };

  const toggleDataType = (dt: string) => {
    setForm(prev => ({
      ...prev,
      allowedDataTypes: prev.allowedDataTypes.includes(dt)
        ? prev.allowedDataTypes.filter(d => d !== dt)
        : [...prev.allowedDataTypes, dt],
    }));
  };

  const activeAgreements = agreements.filter(a => a.status === "active");
  const draftAgreements = agreements.filter(a => a.status === "draft");
  const otherAgreements = agreements.filter(a => a.status === "suspended" || a.status === "expired");

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" data-testid="text-agreements-title">
            <Handshake className="w-6 h-6 text-primary" />
            Cross-Border Data Sharing Agreements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">SATA framework -- manage bilateral data sharing agreements between jurisdictions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-agreement"><Plus className="w-4 h-4 mr-1.5" /> New Agreement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Data Sharing Agreement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Source Country *</Label>
                  <Select value={form.sourceCountry} onValueChange={v => setForm(f => ({ ...f, sourceCountry: v }))}>
                    <SelectTrigger data-testid="select-source-country"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SUPPORTED_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Country *</Label>
                  <Select value={form.targetCountry} onValueChange={v => setForm(f => ({ ...f, targetCountry: v }))}>
                    <SelectTrigger data-testid="select-target-country"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SUPPORTED_COUNTRIES.filter(c => c !== form.sourceCountry).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Allowed Data Types *</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ALLOWED_DATA_TYPES.map(dt => (
                    <Button key={dt} type="button" variant={form.allowedDataTypes.includes(dt) ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => toggleDataType(dt)} data-testid={`toggle-data-type-${dt}`}>
                      {dt.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Regional Bloc</Label>
                <Select value={form.regionalBloc} onValueChange={v => setForm(f => ({ ...f, regionalBloc: v }))}>
                  <SelectTrigger data-testid="select-regional-bloc"><SelectValue placeholder="Select bloc" /></SelectTrigger>
                  <SelectContent>{REGIONAL_BLOCS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} data-testid="input-effective-date" /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} data-testid="input-expiry-date" /></div>
              </div>
              <div><Label>Legal Basis</Label><Input value={form.legalBasis} onChange={e => setForm(f => ({ ...f, legalBasis: e.target.value }))} placeholder="e.g. ECOWAS Protocol on Free Movement" data-testid="input-legal-basis" /></div>
              <div><Label>Source Institutions</Label><Input value={form.sourceInstitutions} onChange={e => setForm(f => ({ ...f, sourceInstitutions: e.target.value }))} placeholder="Comma-separated (empty = all institutions)" data-testid="input-source-institutions" /></div>
              <div><Label>Target Institutions</Label><Input value={form.targetInstitutions} onChange={e => setForm(f => ({ ...f, targetInstitutions: e.target.value }))} placeholder="Comma-separated (empty = all institutions)" data-testid="input-target-institutions" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description of the agreement" data-testid="input-description" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full" data-testid="button-submit-agreement">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Create Agreement (Draft)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold" data-testid="stat-total">{agreements.length}</p><p className="text-xs text-muted-foreground">Total Agreements</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-active">{activeAgreements.length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-muted-foreground" data-testid="stat-draft">{draftAgreements.length}</p><p className="text-xs text-muted-foreground">Draft</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500" data-testid="stat-other">{otherAgreements.length}</p><p className="text-xs text-muted-foreground">Suspended/Expired</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : agreements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold" data-testid="text-no-agreements">No agreements yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first cross-border data sharing agreement to enable SATA compliance.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeAgreements.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftAgreements.length})</TabsTrigger>
            <TabsTrigger value="all">All ({agreements.length})</TabsTrigger>
          </TabsList>
          {["active", "draft", "all"].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {(tab === "active" ? activeAgreements : tab === "draft" ? draftAgreements : agreements).map(a => (
                <Card key={a.id} className="cursor-pointer hover-elevate" onClick={() => setSelectedAgreement(a)} data-testid={`agreement-card-${a.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{a.sourceCountry}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-semibold">{a.targetCountry}</span>
                            {statusBadge(a.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {a.allowedDataTypes.map(d => d.replace(/_/g, " ")).join(", ")}
                          </p>
                          {a.regionalBloc && <Badge variant="outline" className="text-[10px] mt-1">{a.regionalBloc}</Badge>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {a.effectiveDate && <p className="text-xs text-muted-foreground">{a.effectiveDate}</p>}
                        {a.expiryDate && <p className="text-[10px] text-muted-foreground">Expires: {a.expiryDate}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {selectedAgreement && (
        <Dialog open={!!selectedAgreement} onOpenChange={() => { setSelectedAgreement(null); setEditMode(false); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? "Edit Agreement" : "Agreement Details"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedAgreement.sourceCountry}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="font-semibold">{selectedAgreement.targetCountry}</span>
                {statusBadge(selectedAgreement.status)}
              </div>
              {editMode ? (
                <div className="space-y-3">
                  <div><Label>Legal Basis</Label><Input value={editForm.legalBasis} onChange={e => setEditForm(f => ({ ...f, legalBasis: e.target.value }))} data-testid="input-edit-legal-basis" /></div>
                  <div><Label>Description</Label><Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} data-testid="input-edit-description" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Effective Date</Label><Input type="date" value={editForm.effectiveDate} onChange={e => setEditForm(f => ({ ...f, effectiveDate: e.target.value }))} data-testid="input-edit-effective-date" /></div>
                    <div><Label>Expiry Date</Label><Input type="date" value={editForm.expiryDate} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} data-testid="input-edit-expiry-date" /></div>
                  </div>
                  <div>
                    <Label>Regional Bloc</Label>
                    <Select value={editForm.regionalBloc} onValueChange={v => setEditForm(f => ({ ...f, regionalBloc: v }))}>
                      <SelectTrigger data-testid="select-edit-regional-bloc"><SelectValue placeholder="Select bloc" /></SelectTrigger>
                      <SelectContent>{REGIONAL_BLOCS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Source Institutions</Label><Input value={editForm.sourceInstitutions} onChange={e => setEditForm(f => ({ ...f, sourceInstitutions: e.target.value }))} placeholder="Comma-separated (empty = all)" data-testid="input-edit-source-institutions" /></div>
                  <div><Label>Target Institutions</Label><Input value={editForm.targetInstitutions} onChange={e => setEditForm(f => ({ ...f, targetInstitutions: e.target.value }))} placeholder="Comma-separated (empty = all)" data-testid="input-edit-target-institutions" /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      updateMutation.mutate({
                        id: selectedAgreement.id,
                        legalBasis: editForm.legalBasis,
                        description: editForm.description,
                        effectiveDate: editForm.effectiveDate,
                        expiryDate: editForm.expiryDate,
                        regionalBloc: editForm.regionalBloc,
                        sourceInstitutions: editForm.sourceInstitutions ? editForm.sourceInstitutions.split(",").map(s => s.trim()).filter(Boolean) : [],
                        targetInstitutions: editForm.targetInstitutions ? editForm.targetInstitutions.split(",").map(s => s.trim()).filter(Boolean) : [],
                      });
                      setEditMode(false);
                    }} disabled={updateMutation.isPending} data-testid="button-save-edit">Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  {selectedAgreement.description && <p className="text-sm text-muted-foreground">{selectedAgreement.description}</p>}
                  {selectedAgreement.legalBasis && <p className="text-xs"><span className="font-medium">Legal Basis:</span> {selectedAgreement.legalBasis}</p>}
                  {(selectedAgreement as any).sourceInstitutions?.length > 0 && <p className="text-xs"><span className="font-medium">Source Institutions:</span> {(selectedAgreement as any).sourceInstitutions.join(", ")}</p>}
                  {(selectedAgreement as any).targetInstitutions?.length > 0 && <p className="text-xs"><span className="font-medium">Target Institutions:</span> {(selectedAgreement as any).targetInstitutions.join(", ")}</p>}
                  {!(selectedAgreement as any).sourceInstitutions?.length && !(selectedAgreement as any).targetInstitutions?.length && <p className="text-[10px] text-muted-foreground">All institutions in both countries are covered</p>}
                  {selectedAgreement.effectiveDate && <p className="text-xs"><span className="font-medium">Effective:</span> {selectedAgreement.effectiveDate} {selectedAgreement.expiryDate ? `- ${selectedAgreement.expiryDate}` : ""}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgreement.allowedDataTypes.map(dt => (
                      <Badge key={dt} variant="secondary" className="text-[10px] capitalize">{dt.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditMode(true);
                      setEditForm({
                        legalBasis: selectedAgreement.legalBasis || "",
                        description: selectedAgreement.description || "",
                        effectiveDate: selectedAgreement.effectiveDate || "",
                        expiryDate: selectedAgreement.expiryDate || "",
                        regionalBloc: selectedAgreement.regionalBloc || "",
                        sourceInstitutions: ((selectedAgreement as any).sourceInstitutions || []).join(", "),
                        targetInstitutions: ((selectedAgreement as any).targetInstitutions || []).join(", "),
                      });
                    }} data-testid="button-edit-agreement">
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    {selectedAgreement.status === "draft" && (
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: selectedAgreement.id, status: "active" })} disabled={updateMutation.isPending} data-testid="button-activate">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
                      </Button>
                    )}
                    {selectedAgreement.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: selectedAgreement.id, status: "suspended", suspendedReason: "Manual suspension" })} disabled={updateMutation.isPending} data-testid="button-suspend">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Suspend
                      </Button>
                    )}
                    {selectedAgreement.status === "suspended" && (
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: selectedAgreement.id, status: "active" })} disabled={updateMutation.isPending} data-testid="button-reactivate">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivate
                      </Button>
                    )}
                    {(selectedAgreement.status === "active" || selectedAgreement.status === "suspended") && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: selectedAgreement.id, status: "expired" })} disabled={updateMutation.isPending} data-testid="button-expire">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Expire
                      </Button>
                    )}
                    {selectedAgreement.status === "draft" && (
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(selectedAgreement.id)} disabled={deleteMutation.isPending} data-testid="button-delete-agreement">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
