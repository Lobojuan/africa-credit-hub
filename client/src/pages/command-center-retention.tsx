import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Archive, Shield, Globe, Clock, Plus, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ENTITY_TYPES = ["borrower", "credit_account", "audit_log", "credit_inquiry", "dispute", "payment_history", "consent_record", "court_judgment", "credit_report_log"];

const COUNTRIES = [
  "Ghana", "Nigeria", "Kenya", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Rwanda",
  "Egypt", "Morocco", "Senegal", "Ivory Coast", "Cameroon", "DR Congo", "Mozambique",
];

export function CommandCenterRetentionTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ country: "", entityType: "", retentionYears: "7", archiveAfterYears: "5", description: "" });

  const { data: policies, isLoading } = useQuery<any[]>({
    queryKey: ["/api/platform/retention-policies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/platform/retention-policies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/retention-policies"] });
      toast({ title: "Retention policy created" });
      setShowCreate(false);
      setForm({ country: "", entityType: "", retentionYears: "7", archiveAfterYears: "5", description: "" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/platform/retention-policies/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/retention-policies"] });
    },
  });

  const grouped = (policies || []).reduce((acc: Record<string, any[]>, p: any) => {
    (acc[p.country] = acc[p.country] || []).push(p);
    return acc;
  }, {});

  const activeCount = (policies || []).filter((p: any) => p.isActive).length;
  const countries = [...new Set((policies || []).map((p: any) => p.country))];

  return (
    <div className="space-y-4" data-testid="panel-retention">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-white" data-testid="text-total-policies">{(policies || []).length}</p>
          <p className="text-[10px] text-slate-400">Total Policies</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
          <p className="text-[10px] text-slate-400">Active</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{countries.length}</p>
          <p className="text-[10px] text-slate-400">Countries Covered</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-center">
          <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" onClick={() => setShowCreate(true)} data-testid="button-create-policy">
            <Plus className="w-3 h-3 mr-1" /> New Policy
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-500 text-sm py-8">Loading retention policies...</div>
      ) : (policies || []).length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
          <Archive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No retention policies configured yet</p>
          <p className="text-[10px] text-slate-500 mt-1">Create policies to define how long data is retained per country and entity type</p>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([country, pols]) => (
          <div key={country} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">{country}</h3>
              <span className="text-[10px] text-slate-500">{pols.length} policies</span>
            </div>
            <div className="space-y-1.5">
              {pols.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-700/30 bg-slate-800/30 hover:bg-slate-700/20 transition-colors" data-testid={`retention-row-${p.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white capitalize">{p.entityType.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${p.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Retain: {p.retentionYears}y</span>
                      {p.archiveAfterYears && <span>Archive after: {p.archiveAfterYears}y</span>}
                      {p.description && <span className="truncate max-w-[200px]">{p.description}</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs ${p.isActive ? "border-red-500/30 text-red-400 hover:bg-red-500/20" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"}`}
                    onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                    data-testid={`button-toggle-${p.id}`}
                  >
                    {p.isActive ? <><X className="w-3 h-3 mr-1" /> Disable</> : <><Check className="w-3 h-3 mr-1" /> Enable</>}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-400">Compliance Note</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Retention policies define the maximum period data is kept before archival or deletion.
              Each African jurisdiction has different requirements — Ghana DPA requires 7 years for financial records,
              Kenya DPA mandates data minimization, Nigeria NDPR requires purpose-limited retention.
              Ensure policies align with local data protection legislation.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-cyan-400" /> New Retention Policy
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              country: form.country,
              entityType: form.entityType,
              retentionYears: parseInt(form.retentionYears),
              archiveAfterYears: form.archiveAfterYears ? parseInt(form.archiveAfterYears) : null,
              description: form.description || null,
            });
          }} className="space-y-3">
            <div>
              <Label className="text-xs text-slate-400">Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" data-testid="select-retention-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-slate-300 text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Entity Type</Label>
              <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" data-testid="select-retention-entity">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {ENTITY_TYPES.map(t => <SelectItem key={t} value={t} className="text-slate-300 text-xs capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Retention (years)</Label>
                <Input type="number" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.retentionYears} onChange={(e) => setForm({ ...form, retentionYears: e.target.value })} min="1" data-testid="input-retention-years" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Archive after (years)</Label>
                <Input type="number" className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.archiveAfterYears} onChange={(e) => setForm({ ...form, archiveAfterYears: e.target.value })} min="1" data-testid="input-archive-years" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Description (optional)</Label>
              <Input className="bg-slate-800/50 border-slate-700/50 text-white mt-1 h-9 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g., Per Ghana DPA section 34" data-testid="input-retention-desc" />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!form.country || !form.entityType || createMutation.isPending} data-testid="button-submit-policy">
              Create Policy
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
