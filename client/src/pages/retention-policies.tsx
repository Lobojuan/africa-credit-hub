import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import type { RetentionPolicy } from "@shared/schema";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  borrower: "Borrower Records",
  credit_account: "Credit Accounts",
  audit_log: "Audit Logs",
  dispute: "Dispute Records",
  consent_record: "Consent Records",
  court_judgment: "Court Judgments",
  payment_history: "Payment History",
};

const ENTITY_TYPES = Object.keys(ENTITY_TYPE_LABELS);
const COUNTRIES = ["Ghana", "Ethiopia", "Uganda", "Liberia", "All"];

const DEFAULT_FORM = {
  country: "",
  entityType: "",
  retentionYears: "",
  archiveAfterYears: "",
  description: "",
};

export default function RetentionPoliciesPage() {
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
      toast({ title: "Policy created", description: "Retention policy has been created successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      toast({ title: "Policy updated", description: "Retention policy has been updated successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/retention-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retention-policies"] });
      setDeleteConfirm(null);
      toast({ title: "Policy deleted", description: "Retention policy has been deleted." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <Archive className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-retention-title">
              Data Retention Policies
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            Configure jurisdiction-specific data retention periods as required by REQ-RET-01 and SLA-RET-01
          </p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-policy">
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
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
                <span className="text-sm font-medium text-muted-foreground">Total Policies</span>
                <Shield className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-total-policies">{totalPolicies}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-countries-covered">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Countries Covered</span>
                <Archive className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-countries-covered">{countriesCovered}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-retention">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Average Retention</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-avg-retention">{avgRetention} years</p>
              </CardContent>
            </Card>
            <Card data-testid="card-audit-retention">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Audit Log Retention</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-audit-retention">{auditLogRetention} years</p>
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
                    <TableHead>Country</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Retention Years</TableHead>
                    <TableHead>Archive After Years</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
                      <TableCell className="font-medium">{policy.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <Archive className="w-3 h-3 mr-1" />
                          {ENTITY_TYPE_LABELS[policy.entityType] || policy.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.retentionYears}</TableCell>
                      <TableCell>{policy.archiveAfterYears ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={policy.isActive ? "default" : "secondary"} className="text-xs">
                          {policy.isActive ? "Active" : "Inactive"}
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
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm(policy)}
                            data-testid={`button-delete-policy-${policy.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
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
            <h3 className="font-semibold">No retention policies</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a retention policy to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit Retention Policy" : "Add Retention Policy"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-retention-policy">
            <div>
              <Label>Country</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger data-testid="select-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entity Type</Label>
              <Select value={formData.entityType} onValueChange={(v) => setFormData({ ...formData, entityType: v })}>
                <SelectTrigger data-testid="select-entity-type"><SelectValue placeholder="Select entity type" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>{ENTITY_TYPE_LABELS[et]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Retention Years</Label>
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
                <Label>Archive After Years</Label>
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
              <Label>Description</Label>
              <Input
                data-testid="input-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-policy">
              {isPending ? "Saving..." : editingPolicy ? "Update Policy" : "Create Policy"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-delete-confirm-message">
            Are you sure you want to delete the retention policy for {deleteConfirm?.country} - {ENTITY_TYPE_LABELS[deleteConfirm?.entityType ?? ""] || deleteConfirm?.entityType}?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
