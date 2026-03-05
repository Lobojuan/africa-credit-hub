import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Archive, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import { isGhanaMode, getDefaultCountry } from "@/lib/country-mode";
import type { RetentionPolicy } from "@shared/schema";

const ENTITY_TYPES = ["borrower", "credit_account", "audit_log", "dispute", "consent_record", "court_judgment", "payment_history"];
const COUNTRIES = isGhanaMode() ? ["Ghana"] : ["All", ...SUPPORTED_COUNTRIES.map(c => c.name)];

const DEFAULT_FORM = {
  country: getDefaultCountry() || "",
  entityType: "",
  retentionYears: "",
  archiveAfterYears: "",
  description: "",
};

export default function RetentionPoliciesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RetentionPolicy | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const { data: policies, isLoading } = useQuery<RetentionPolicy[]>({
    queryKey: ["/api/retention-policies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/retention-policies", {
        country: data.country,
        entityType: data.entityType,
        retentionYears: parseInt(data.retentionYears),
        archiveAfterYears: data.archiveAfterYears ? parseInt(data.archiveAfterYears) : null,
        description: data.description || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDialogOpen(false);
      setFormData(DEFAULT_FORM);
      toast({ title: t("retentionPolicies.created"), description: t("retentionPolicies.created") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/retention-policies/${id}`, {
        country: data.country,
        entityType: data.entityType,
        retentionYears: parseInt(data.retentionYears),
        archiveAfterYears: data.archiveAfterYears ? parseInt(data.archiveAfterYears) : null,
        description: data.description || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDialogOpen(false);
      setEditingPolicy(null);
      setFormData(DEFAULT_FORM);
      toast({ title: t("retentionPolicies.updated"), description: t("retentionPolicies.updated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/retention-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDeleteConfirm(null);
      toast({ title: t("retentionPolicies.deleted"), description: t("retentionPolicies.deleted") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const enforceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/retention-policies/enforce");
      return res.json();
    },
    onSuccess: (data: any) => {
      const total = data.results?.reduce((sum: number, r: any) => sum + (r.archiveEligible || 0) + (r.expungedCount || 0), 0) || 0;
      toast({ title: t("retentionPolicies.enforcementComplete"), description: `${total} ${t("retentionPolicies.recordsProcessed")}` });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const openAddDialog = () => {
    setEditingPolicy(null);
    setFormData(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (policy: RetentionPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      country: policy.country,
      entityType: policy.entityType,
      retentionYears: String(policy.retentionYears),
      archiveAfterYears: policy.archiveAfterYears ? String(policy.archiveAfterYears) : "",
      description: policy.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const totalPolicies = policies?.length ?? 0;
  const countriesCovered = new Set(policies?.map((p) => p.country) ?? []).size;
  const avgRetention = totalPolicies > 0
    ? (policies!.reduce((sum, p) => sum + p.retentionYears, 0) / totalPolicies).toFixed(1)
    : "0";
  const auditLogRetention = policies?.find((p) => p.entityType === "audit_log")?.retentionYears ?? 0;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getEntityTypeLabel = (entityType: string) => {
    return t(`retentionPolicies.entityTypes.${entityType}`, entityType);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <Archive className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-retention-title">
              {t("retentionPolicies.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t("retentionPolicies.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => enforceMutation.mutate()} disabled={enforceMutation.isPending} data-testid="button-enforce-retention">
            <Shield className="w-4 h-4 mr-2" />
            {enforceMutation.isPending ? t("retentionPolicies.enforcing") : t("retentionPolicies.runEnforcement")}
          </Button>
          <Button onClick={openAddDialog} data-testid="button-add-policy">
            <Plus className="w-4 h-4 mr-2" />
            {t("retentionPolicies.addPolicy")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-policies">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("retentionPolicies.totalPolicies")}</span>
                <Shield className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-total-policies">{totalPolicies}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-countries-covered">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("retentionPolicies.countriesCovered")}</span>
                <Archive className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-countries-covered">{countriesCovered}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-retention">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("retentionPolicies.avgRetention")}</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-avg-retention">{avgRetention} {t("retentionPolicies.years")}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-audit-retention">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("retentionPolicies.auditRetention")}</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-audit-retention">{auditLogRetention} {t("retentionPolicies.years")}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : policies && policies.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-testid="table-retention-policies">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("retentionPolicies.country")}</TableHead>
                    <TableHead>{t("retentionPolicies.entityType")}</TableHead>
                    <TableHead>{t("retentionPolicies.retentionYears")}</TableHead>
                    <TableHead>{t("retentionPolicies.archiveAfterYears")}</TableHead>
                    <TableHead>{t("retentionPolicies.status")}</TableHead>
                    <TableHead>{t("retentionPolicies.description")}</TableHead>
                    <TableHead>{t("common.edit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                      <TableCell className="font-medium">{policy.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <Archive className="w-3 h-3 mr-1" />
                          {getEntityTypeLabel(policy.entityType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.retentionYears}</TableCell>
                      <TableCell>{policy.archiveAfterYears ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={policy.isActive ? "default" : "secondary"} className="text-xs">
                          {policy.isActive ? t("retentionPolicies.active") : t("retentionPolicies.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {policy.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(policy)}
                            data-testid={`button-edit-policy-${policy.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm(policy)}
                            data-testid={`button-delete-policy-${policy.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{t("retentionPolicies.noPolicies")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("retentionPolicies.noPoliciesSub")}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? t("retentionPolicies.editPolicy") : t("retentionPolicies.addPolicy")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-retention-policy">
            <div>
              <Label>{t("retentionPolicies.country")}</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger data-testid="select-country"><SelectValue placeholder={t("retentionPolicies.country")} /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("retentionPolicies.entityType")}</Label>
              <Select value={formData.entityType} onValueChange={(v) => setFormData({ ...formData, entityType: v })}>
                <SelectTrigger data-testid="select-entity-type"><SelectValue placeholder={t("retentionPolicies.entityType")} /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>{getEntityTypeLabel(et)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("retentionPolicies.retentionYears")}</Label>
                <Input
                  data-testid="input-retention-years"
                  type="number"
                  min={1}
                  value={formData.retentionYears}
                  onChange={(e) => setFormData({ ...formData, retentionYears: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("retentionPolicies.archiveAfterYears")}</Label>
                <Input
                  data-testid="input-archive-years"
                  type="number"
                  min={1}
                  value={formData.archiveAfterYears}
                  onChange={(e) => setFormData({ ...formData, archiveAfterYears: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>{t("retentionPolicies.description")}</Label>
              <Input
                data-testid="input-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-policy">
              {isPending ? t("common.save") + "..." : editingPolicy ? t("retentionPolicies.editPolicy") : t("retentionPolicies.addPolicy")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("retentionPolicies.deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-delete-confirm-message">
            {t("retentionPolicies.deleteConfirm")} {deleteConfirm?.country} - {getEntityTypeLabel(deleteConfirm?.entityType ?? "")}?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("common.delete") + "..." : t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
