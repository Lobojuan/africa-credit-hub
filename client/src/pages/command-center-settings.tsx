import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Globe, Settings, Plus, Trash2, Loader2, Shield, Scale, FileText,
  CheckCircle2, AlertTriangle, ArrowRight, Link2, Calendar,
} from "lucide-react";
import { getSupportedCountries } from "@/lib/country-mode";

interface SATAAgreement {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  allowedDataTypes: string[];
  status: "draft" | "active" | "suspended" | "expired";
  effectiveDate: string | null;
  expiryDate: string | null;
  legalBasis: string | null;
  description: string | null;
  regionalBloc: string | null;
  suspendedReason: string | null;
  sourceInstitutions: string[];
  targetInstitutions: string[];
  createdAt: string;
}

function AgreementStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    draft: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    suspended: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    expired: "border-red-500/30 text-red-400 bg-red-500/10",
  };
  return <Badge variant="outline" className={`text-[9px] h-5 capitalize ${cls[status] || "border-slate-500/30 text-slate-400"}`}>{status}</Badge>;
}

const DATA_TYPES = [
  "Credit History", "Payment Records", "Default Data", "Identity Verification",
  "Court Judgments", "Consent Records", "Dispute Data", "Loan Applications",
];

const FEATURE_DEFINITIONS = [
  { key: "Credit Scoring", description: "Automated credit score calculation for borrowers", icon: Shield },
  { key: "Dispute Management", description: "Handle and track data disputes from borrowers", icon: Scale },
  { key: "Consent Tracking", description: "Record and manage borrower consent for data sharing", icon: FileText },
  { key: "Regulatory Export", description: "Generate regulator-specific file exports (BoG, BSL)", icon: FileText },
  { key: "Cross-Border Sharing", description: "SATA-based cross-border data sharing capabilities", icon: Globe },
  { key: "Batch Upload", description: "Bulk data upload via CSV/Excel files", icon: FileText },
  { key: "API Access", description: "External API integration for data submission and queries", icon: Link2 },
  { key: "KYC Verification", description: "Know-Your-Customer identity verification", icon: Shield },
];

function CreateAgreementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const countries = getSupportedCountries();
  const [form, setForm] = useState({
    sourceCountry: "", targetCountry: "", status: "draft" as string,
    effectiveDate: "", expiryDate: "", legalBasis: "", description: "",
    regionalBloc: "", allowedDataTypes: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/sata/agreements", {
        ...data,
        effectiveDate: data.effectiveDate || null,
        expiryDate: data.expiryDate || null,
        legalBasis: data.legalBasis || null,
        description: data.description || null,
        regionalBloc: data.regionalBloc || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      onOpenChange(false);
      setForm({ sourceCountry: "", targetCountry: "", status: "draft", effectiveDate: "", expiryDate: "", legalBasis: "", description: "", regionalBloc: "", allowedDataTypes: [] });
      toast({ title: "Agreement created successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const toggleDataType = (dt: string) => {
    setForm((f) => ({
      ...f,
      allowedDataTypes: f.allowedDataTypes.includes(dt) ? f.allowedDataTypes.filter((t) => t !== dt) : [...f.allowedDataTypes, dt],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700/50 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-400" />
            </div>
            New SATA Agreement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3" data-testid="form-cc-add-agreement">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">Source Country</Label>
              <Select value={form.sourceCountry} onValueChange={(v) => setForm({ ...form, sourceCountry: v })}>
                <SelectTrigger data-testid="select-cc-source-country" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {countries.map((c) => <SelectItem key={c.code} value={c.name} className="text-slate-300">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Target Country</Label>
              <Select value={form.targetCountry} onValueChange={(v) => setForm({ ...form, targetCountry: v })}>
                <SelectTrigger data-testid="select-cc-target-country" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {countries.map((c) => <SelectItem key={c.code} value={c.name} className="text-slate-300">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">Effective Date</Label>
              <Input data-testid="input-cc-effective-date" type="date" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Expiry Date</Label>
              <Input data-testid="input-cc-expiry-date" type="date" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Legal Basis</Label>
            <Input data-testid="input-cc-legal-basis" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.legalBasis} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} placeholder="e.g. AfCFTA Protocol, Bilateral MOU" />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Regional Bloc</Label>
            <Select value={form.regionalBloc} onValueChange={(v) => setForm({ ...form, regionalBloc: v })}>
              <SelectTrigger data-testid="select-cc-bloc" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="none" className="text-slate-300">None</SelectItem>
                <SelectItem value="ECOWAS" className="text-slate-300">ECOWAS</SelectItem>
                <SelectItem value="EAC" className="text-slate-300">EAC</SelectItem>
                <SelectItem value="SADC" className="text-slate-300">SADC</SelectItem>
                <SelectItem value="COMESA" className="text-slate-300">COMESA</SelectItem>
                <SelectItem value="AfCFTA" className="text-slate-300">AfCFTA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Description</Label>
            <Input data-testid="input-cc-description" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Allowed Data Types</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {DATA_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => toggleDataType(dt)}
                  className={`text-[10px] px-2 py-1.5 rounded-md border transition-colors text-left
                    ${form.allowedDataTypes.includes(dt) ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-slate-700/50 text-slate-400 hover:bg-slate-800"}`}
                  data-testid={`toggle-cc-dt-${dt.replace(/\s/g, '-').toLowerCase()}`}
                >
                  {form.allowedDataTypes.includes(dt) ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                  {dt}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.sourceCountry || !form.targetCountry || form.allowedDataTypes.length === 0} data-testid="button-cc-submit-agreement">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {createMutation.isPending ? "Creating..." : "Create Agreement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CountryDetail {
  name: string;
  code: string;
  currency: string;
  regulatoryBody: string;
  dataProtectionLaw: string;
  features: string[];
}

export function CommandCenterSettingsTab() {
  const { toast } = useToast();
  const countries = getSupportedCountries();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [createAgreementOpen, setCreateAgreementOpen] = useState(false);
  const [deleteAgreement, setDeleteAgreement] = useState<SATAAgreement | null>(null);

  const { data: agreements = [], isLoading: agreementsLoading } = useQuery<SATAAgreement[]>({
    queryKey: ["/api/sata/agreements"],
  });

  const { data: commandData } = useQuery<{ countries: CountryDetail[] }>({
    queryKey: ["/api/platform/command-center"],
    staleTime: 30000,
  });

  const deleteAgreementMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sata/agreements/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      setDeleteAgreement(null);
      toast({ title: "Agreement deleted" });
    },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/sata/agreements/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sata/agreements"] });
      toast({ title: "Agreement status updated" });
    },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const selectedConfig = selectedCountry ? countries.find((c) => c.name === selectedCountry) : null;
  const selectedDetail = selectedCountry ? (commandData?.countries || []).find((d) => d.name === selectedCountry) : null;
  const countryAgreements = selectedCountry
    ? agreements.filter((a) => a.sourceCountry === selectedCountry || a.targetCountry === selectedCountry)
    : agreements;

  const activeAgreements = agreements.filter((a) => a.status === "active").length;
  const draftAgreements = agreements.filter((a) => a.status === "draft").length;
  const suspendedAgreements = agreements.filter((a) => a.status === "suspended").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-xl font-bold text-white" data-testid="text-total-agreements">{agreements.length}</p>
          <p className="text-[10px] text-slate-500">Total Agreements</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-xl font-bold text-emerald-400" data-testid="text-active-agreements">{activeAgreements}</p>
          <p className="text-[10px] text-slate-500">Active</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{draftAgreements}</p>
          <p className="text-[10px] text-slate-500">Draft</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{suspendedAgreements}</p>
          <p className="text-[10px] text-slate-500">Suspended</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Country View</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">Select a country to view its configuration and agreements</p>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCountry(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${!selectedCountry ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-300 hover:bg-slate-700/50"}`}
                data-testid="button-cc-all-countries"
              >
                <Globe className="w-3.5 h-3.5" />
                All Countries
                <span className="ml-auto text-[10px] text-slate-500">{agreements.length}</span>
              </button>
              {countries.map((c) => {
                const count = agreements.filter((a) => a.sourceCountry === c.name || a.targetCountry === c.name).length;
                return (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${selectedCountry === c.name ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-300 hover:bg-slate-700/50"}`}
                    data-testid={`button-cc-settings-country-${c.code}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `hsl(${c.theme.primary})` }} />
                    {c.name}
                    {count > 0 && <span className="ml-auto text-[10px] text-slate-500">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedConfig && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">{selectedConfig.name} Configuration</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <p className="text-[10px] text-slate-500 mb-1">Currency</p>
                  <p className="text-sm font-semibold text-white" data-testid="text-cc-country-currency">{selectedConfig.currency}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <p className="text-[10px] text-slate-500 mb-1">Regulatory Body</p>
                  <p className="text-sm font-semibold text-white" data-testid="text-cc-country-regulator">{selectedConfig.regulatoryBody}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <p className="text-[10px] text-slate-500 mb-1">Data Protection Law</p>
                  <p className="text-sm font-semibold text-white" data-testid="text-cc-country-dp-law">{selectedConfig.dataProtectionLaw}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <p className="text-[10px] text-slate-500 mb-1">Country Code</p>
                  <p className="text-sm font-semibold text-white">{selectedConfig.code}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Feature Configuration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEATURE_DEFINITIONS.map((feat) => {
                    const enabled = selectedDetail?.features?.includes(feat.key) ?? false;
                    const Icon = feat.icon;
                    return (
                      <div key={feat.key} className={`flex items-start gap-2 p-2.5 rounded-lg border ${enabled ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-700/30 bg-slate-900/30"}`} data-testid={`feature-${feat.key.replace(/\s/g, '-').toLowerCase()}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${enabled ? "bg-emerald-500/20" : "bg-slate-700/50"}`}>
                          {enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${enabled ? "text-emerald-300" : "text-slate-400"}`}>{feat.key}</p>
                          <p className="text-[10px] text-slate-500">{feat.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  {selectedCountry ? `${selectedCountry} SATA Agreements` : "All SATA Agreements"}
                </h3>
                <Badge variant="outline" className="text-[9px] h-5 border-slate-600/50 text-slate-400">{countryAgreements.length}</Badge>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => setCreateAgreementOpen(true)} data-testid="button-cc-add-agreement">
                <Plus className="w-3 h-3 mr-1" /> New Agreement
              </Button>
            </div>

            {agreementsLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" /></div>
            ) : countryAgreements.length === 0 ? (
              <div className="p-8 text-center">
                <Link2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No agreements found</p>
                <p className="text-[10px] text-slate-600 mt-1">Create a new SATA data sharing agreement to enable cross-border operations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {countryAgreements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/30 hover:bg-slate-700/20 transition-colors" data-testid={`row-cc-agreement-${a.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">{a.sourceCountry}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-xs font-medium text-white">{a.targetCountry}</span>
                        <AgreementStatusBadge status={a.status} />
                        {a.regionalBloc && <Badge variant="outline" className="text-[8px] h-4 px-1 border-slate-600/50 text-slate-500">{a.regionalBloc}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        {a.legalBasis && <span>{a.legalBasis}</span>}
                        {a.effectiveDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {a.effectiveDate}
                          </span>
                        )}
                        <span>{a.allowedDataTypes.length} data types</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {a.status === "draft" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 px-2"
                          onClick={() => updateStatusMutation.mutate({ id: a.id, status: "active" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-cc-activate-${a.id}`}>
                          Activate
                        </Button>
                      )}
                      {a.status === "active" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-amber-400 hover:text-amber-300 px-2"
                          onClick={() => updateStatusMutation.mutate({ id: a.id, status: "suspended" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-cc-suspend-${a.id}`}>
                          Suspend
                        </Button>
                      )}
                      {a.status === "suspended" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 px-2"
                          onClick={() => updateStatusMutation.mutate({ id: a.id, status: "active" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-cc-reactivate-${a.id}`}>
                          Reactivate
                        </Button>
                      )}
                      <button
                        onClick={() => setDeleteAgreement(a)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        data-testid={`button-cc-delete-agreement-${a.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateAgreementDialog open={createAgreementOpen} onOpenChange={setCreateAgreementOpen} />

      <Dialog open={!!deleteAgreement} onOpenChange={(v) => !v && setDeleteAgreement(null)}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Agreement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400" data-testid="text-cc-delete-agreement-confirm">
            Are you sure you want to delete the agreement between <span className="text-white font-medium">{deleteAgreement?.sourceCountry}</span> and <span className="text-white font-medium">{deleteAgreement?.targetCountry}</span>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteAgreement(null)} className="text-slate-400" data-testid="button-cc-cancel-delete-agreement">Cancel</Button>
            <Button variant="destructive" disabled={deleteAgreementMutation.isPending} onClick={() => deleteAgreement && deleteAgreementMutation.mutate(deleteAgreement.id)} data-testid="button-cc-confirm-delete-agreement">
              {deleteAgreementMutation.isPending ? "Deleting..." : "Delete Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
