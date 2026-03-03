import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Users, BarChart3, Globe, Edit, Trash2, Loader2 } from "lucide-react";

const ORG_TYPES = ["bank", "microfinance", "insurance", "telecom", "fintech", "utility", "government", "regulator", "real_estate", "investment", "other"];
const ORG_STATUSES = ["active", "suspended", "pending", "deactivated"];
const SUBSCRIPTION_TIERS = ["standard", "professional", "enterprise"];

function CreateOrgDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", slug: "", type: "bank", status: "active", country: "",
    contactEmail: "", contactPhone: "", address: "", website: "",
    subscriptionTier: "standard", maxUsers: 10,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/organizations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organization created successfully" });
      onOpenChange(false);
      setForm({ name: "", slug: "", type: "bank", status: "active", country: "", contactEmail: "", contactPhone: "", address: "", website: "", subscriptionTier: "standard", maxUsers: 10 });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input data-testid="input-org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Organization name" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input data-testid="input-org-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="url-slug" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-org-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-org-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <Input data-testid="input-org-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" />
            </div>
            <div>
              <Label>Subscription Tier</Label>
              <Select value={form.subscriptionTier} onValueChange={(v) => setForm({ ...form, subscriptionTier: v })}>
                <SelectTrigger data-testid="select-org-tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Email</Label>
              <Input data-testid="input-org-email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="admin@org.com" />
            </div>
            <div>
              <Label>Max Users</Label>
              <Input data-testid="input-org-max-users" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })} />
            </div>
          </div>
          <div>
            <Label>Website</Label>
            <Input data-testid="input-org-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
          </div>
          <Button data-testid="button-create-org" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.slug}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditOrgDialog({ org, open, onOpenChange }: { org: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: org.name, type: org.type, status: org.status, country: org.country || "",
    contactEmail: org.contactEmail || "", contactPhone: org.contactPhone || "",
    website: org.website || "", subscriptionTier: org.subscriptionTier, maxUsers: org.maxUsers || 10,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${org.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organization updated" });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {org.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input data-testid="input-edit-org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label>Subscription Tier</Label>
              <Select value={form.subscriptionTier} onValueChange={(v) => setForm({ ...form, subscriptionTier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Email</Label>
              <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label>Max Users</Label>
              <Input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })} />
            </div>
          </div>
          <Button data-testid="button-update-org" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Organization
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "suspended": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "pending": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "deactivated": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default: return "";
  }
}

function tierColor(tier: string) {
  switch (tier) {
    case "enterprise": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "professional": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export default function OrganizationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<any>(null);
  const { toast } = useToast();

  const { data: organizations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: platformStats } = useQuery<any>({
    queryKey: ["/api/admin/platform-stats"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organization deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Administration</h1>
          <p className="text-sm text-muted-foreground">Manage organizations and tenant configurations</p>
        </div>
        <Button data-testid="button-new-org" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Organization
        </Button>
      </div>

      {platformStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-orgs">{platformStats.totalOrganizations}</p>
                  <p className="text-xs text-muted-foreground">Organizations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-active-orgs">{platformStats.activeOrganizations}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-users">{platformStats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-borrowers">{platformStats.totalBorrowers}</p>
                  <p className="text-xs text-muted-foreground">Total Borrowers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {organizations.map((org: any) => (
          <Card key={org.id} data-testid={`card-org-${org.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg" data-testid={`text-org-name-${org.id}`}>{org.name}</h3>
                      <Badge variant="outline" className={statusColor(org.status)}>{org.status}</Badge>
                      <Badge variant="outline" className={tierColor(org.subscriptionTier)}>{org.subscriptionTier}</Badge>
                      <Badge variant="outline">{org.type?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      {org.country && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{org.country}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.userCount} users</span>
                      {org.contactEmail && <span>{org.contactEmail}</span>}
                      <span>Slug: {org.slug}</span>
                    </div>
                    {org.stats && (
                      <div className="flex gap-4 mt-2 text-xs flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-muted">{org.stats.totalBorrowers} borrowers</span>
                        <span className="px-2 py-0.5 rounded bg-muted">{org.stats.totalAccounts} accounts</span>
                        <span className="px-2 py-0.5 rounded bg-muted">{org.stats.totalInquiries} inquiries</span>
                        {org.stats.delinquentAccounts > 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{org.stats.delinquentAccounts} delinquent</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-org-${org.id}`} onClick={() => setEditOrg(org)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid={`button-delete-org-${org.id}`}
                    onClick={() => { if (confirm(`Delete ${org.name}?`)) deleteMutation.mutate(org.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {organizations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No organizations yet. Create one to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editOrg && <EditOrgDialog org={editOrg} open={!!editOrg} onOpenChange={(v) => { if (!v) setEditOrg(null); }} />}
    </div>
  );
}
