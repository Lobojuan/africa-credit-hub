import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Building2, Plus, Pencil, Trash2, Search, Loader2,
  UserCircle, Shield, Mail, ChevronRight, ChevronDown, Sparkles, MapPin,
  Phone, Globe, Calendar, Crown, MapPinned, ExternalLink,
} from "lucide-react";
import type { User, Organization } from "@shared/schema";
import { getSupportedCountries } from "@/lib/country-mode";

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    active: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    suspended: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    pending: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    deactivated: "border-red-500/30 text-red-400 bg-red-500/10",
  };
  return <Badge variant="outline" className={`text-[9px] h-5 capitalize ${cls[status] || "border-border text-muted-foreground"}`}>{status}</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  const cls: Record<string, string> = {
    super_admin: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    admin: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    regulator: "border-violet-500/30 text-violet-400 bg-violet-500/10",
    lender: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    viewer: "border-border text-muted-foreground bg-muted",
  };
  return <Badge variant="outline" className={`text-[9px] h-5 capitalize ${cls[role] || "border-border text-muted-foreground"}`}>{role.replace("_", " ")}</Badge>;
}

function OrgTypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    bank: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    microfinance: "border-green-500/30 text-green-400 bg-green-500/10",
    fintech: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    regulator: "border-violet-500/30 text-violet-400 bg-violet-500/10",
    insurance: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    telecom: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  };
  return <Badge variant="outline" className={`text-[9px] h-5 capitalize ${cls[type] || "border-border text-muted-foreground"}`}>{type.replace("_", " ")}</Badge>;
}

function UserCreateDialog({ open, onOpenChange, organizations }: { open: boolean; onOpenChange: (v: boolean) => void; organizations: Organization[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    username: "", password: "", fullName: "", email: "",
    role: "viewer", status: "active", institution: "", organizationId: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = { ...data, organizationId: data.organizationId && data.organizationId !== "none" ? data.organizationId : undefined };
      const res = await apiRequest("POST", "/api/users", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onOpenChange(false);
      setForm({ username: "", password: "", fullName: "", email: "", role: "viewer", status: "active", institution: "", organizationId: "" });
      toast({ title: "User created successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-400" />
            </div>
            Create User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3" data-testid="form-cc-add-user">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input data-testid="input-cc-username" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input data-testid="input-cc-password" type="password" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input data-testid="input-cc-fullname" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input data-testid="input-cc-email" type="email" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Organization</Label>
            <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
              <SelectTrigger data-testid="select-cc-org" className="bg-card border-border text-foreground mt-1 h-9 text-sm">
                <SelectValue placeholder="Select organization..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none" className="text-muted-foreground">No Organization</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} className="text-muted-foreground">{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="select-cc-role" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="super_admin" className="text-muted-foreground">Super Admin</SelectItem>
                  <SelectItem value="admin" className="text-muted-foreground">Admin</SelectItem>
                  <SelectItem value="regulator" className="text-muted-foreground">Regulator</SelectItem>
                  <SelectItem value="lender" className="text-muted-foreground">Lender</SelectItem>
                  <SelectItem value="viewer" className="text-muted-foreground">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-cc-status" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active" className="text-muted-foreground">Active</SelectItem>
                  <SelectItem value="suspended" className="text-muted-foreground">Suspended</SelectItem>
                  <SelectItem value="deactivated" className="text-muted-foreground">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Institution</Label>
            <Input data-testid="input-cc-institution" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-cc-submit-user">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {createMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserEditDialog({ user, open, onOpenChange, organizations }: { user: User | null; open: boolean; onOpenChange: (v: boolean) => void; organizations: Organization[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", role: "", status: "", institution: "", password: "", organizationId: "" });

  useEffect(() => {
    if (user && open) {
      setForm({
        fullName: user.fullName, email: user.email, role: user.role,
        status: user.status, institution: user.institution || "", password: "",
        organizationId: user.organizationId || "",
      });
    }
  }, [user, open]);

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const payload: Record<string, string | null> = {};
      if (data.fullName) payload.fullName = data.fullName;
      if (data.email) payload.email = data.email;
      if (data.role) payload.role = data.role;
      if (data.status) payload.status = data.status;
      if (data.institution !== undefined) payload.institution = data.institution;
      if (data.password) payload.password = data.password;
      payload.organizationId = data.organizationId && data.organizationId !== "none" ? data.organizationId : null;
      const res = await apiRequest("PATCH", `/api/users/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onOpenChange(false);
      toast({ title: "User updated successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm({ fullName: "", email: "", role: "", status: "", institution: "", password: "", organizationId: "" }); onOpenChange(v); }}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil className="w-4 h-4 text-blue-400" /> Edit User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (user) editMutation.mutate({ id: user.id, data: form }); }} className="space-y-3" data-testid="form-cc-edit-user">
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input data-testid="input-cc-edit-fullname" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input data-testid="input-cc-edit-email" type="email" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="select-cc-edit-role" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="super_admin" className="text-muted-foreground">Super Admin</SelectItem>
                  <SelectItem value="admin" className="text-muted-foreground">Admin</SelectItem>
                  <SelectItem value="regulator" className="text-muted-foreground">Regulator</SelectItem>
                  <SelectItem value="lender" className="text-muted-foreground">Lender</SelectItem>
                  <SelectItem value="viewer" className="text-muted-foreground">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-cc-edit-status" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active" className="text-muted-foreground">Active</SelectItem>
                  <SelectItem value="suspended" className="text-muted-foreground">Suspended</SelectItem>
                  <SelectItem value="deactivated" className="text-muted-foreground">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Organization</Label>
            <Select value={form.organizationId || "none"} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
              <SelectTrigger data-testid="select-cc-edit-org" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[200px]">
                <SelectItem value="none" className="text-muted-foreground">No Organization</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-muted-foreground">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">New Password (leave blank to keep)</Label>
            <Input data-testid="input-cc-edit-password" type="password" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
          </div>
          <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-cc-save-edit">
            {editMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrgCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const countries = getSupportedCountries();
  const [form, setForm] = useState({
    name: "", slug: "", type: "bank", status: "active", country: "",
    contactEmail: "", contactPhone: "", website: "", subscriptionTier: "standard", maxUsers: 10,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/organizations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations/list"] });
      onOpenChange(false);
      setForm({ name: "", slug: "", type: "bank", status: "active", country: "", contactEmail: "", contactPhone: "", website: "", subscriptionTier: "standard", maxUsers: 10 });
      toast({ title: "Organization created successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-400" />
            </div>
            Onboard Client
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3" data-testid="form-cc-add-org">
          <div>
            <Label className="text-xs text-muted-foreground">Organization Name</Label>
            <Input data-testid="input-cc-org-name" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                setForm({ ...form, name, slug });
              }} required />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">URL Slug</Label>
            <Input data-testid="input-cc-org-slug" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-cc-org-type" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {["bank", "microfinance", "insurance", "telecom", "fintech", "utility", "government", "regulator", "real_estate", "investment", "other"].map((t) => (
                    <SelectItem key={t} value={t} className="text-muted-foreground capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger data-testid="select-cc-org-country" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.name} className="text-muted-foreground">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Contact Email</Label>
              <Input data-testid="input-cc-org-email" type="email" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Phone</Label>
              <Input data-testid="input-cc-org-phone" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Subscription Tier</Label>
            <Select value={form.subscriptionTier} onValueChange={(v) => setForm({ ...form, subscriptionTier: v, maxUsers: v === "enterprise" ? 100 : v === "professional" ? 50 : 10 })}>
              <SelectTrigger data-testid="select-cc-org-tier" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="standard" className="text-muted-foreground">Standard ($299/mo)</SelectItem>
                <SelectItem value="professional" className="text-muted-foreground">Professional ($799/mo)</SelectItem>
                <SelectItem value="enterprise" className="text-muted-foreground">Enterprise ($1,999/mo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.name || !form.slug} data-testid="button-cc-submit-org">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {createMutation.isPending ? "Creating..." : "Onboard Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrgEditDialog({ org, open, onOpenChange }: { org: Organization | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const countries = getSupportedCountries();
  const [form, setForm] = useState({ name: "", contactEmail: "", contactPhone: "", type: "", status: "", country: "", subscriptionTier: "" });

  useEffect(() => {
    if (org && open) {
      setForm({
        name: org.name || "", contactEmail: org.contactEmail || "", contactPhone: org.contactPhone || "",
        type: org.type || "other", status: org.status || "pending", country: org.country || "",
        subscriptionTier: org.subscriptionTier || "standard",
      });
    }
  }, [org, open]);

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const payload: Record<string, string> = {};
      if (data.name) payload.name = data.name;
      if (data.contactEmail !== undefined) payload.contactEmail = data.contactEmail;
      if (data.contactPhone !== undefined) payload.contactPhone = data.contactPhone;
      if (data.type) payload.type = data.type;
      if (data.status) payload.status = data.status;
      if (data.country) payload.country = data.country;
      if (data.subscriptionTier) payload.subscriptionTier = data.subscriptionTier;
      const res = await apiRequest("PATCH", `/api/admin/organizations/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations/list"] });
      onOpenChange(false);
      toast({ title: "Organization updated successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm({ name: "", contactEmail: "", contactPhone: "", type: "", status: "", country: "", subscriptionTier: "" }); onOpenChange(v); }}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil className="w-4 h-4 text-blue-400" /> Edit Organization
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (org) editMutation.mutate({ id: org.id, data: form }); }} className="space-y-3" data-testid="form-cc-edit-org">
          <div>
            <Label className="text-xs text-muted-foreground">Organization Name</Label>
            <Input data-testid="input-cc-edit-org-name" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-cc-edit-org-type" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {["bank", "microfinance", "insurance", "telecom", "fintech", "utility", "government", "regulator", "real_estate", "investment", "other"].map((t) => (
                    <SelectItem key={t} value={t} className="text-muted-foreground capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-cc-edit-org-status" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="pending" className="text-muted-foreground">Pending</SelectItem>
                  <SelectItem value="active" className="text-muted-foreground">Active</SelectItem>
                  <SelectItem value="suspended" className="text-muted-foreground">Suspended</SelectItem>
                  <SelectItem value="deactivated" className="text-muted-foreground">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger data-testid="select-cc-edit-org-country" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.name} className="text-muted-foreground">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Contact Email</Label>
              <Input data-testid="input-cc-edit-org-email" type="email" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Phone</Label>
              <Input data-testid="input-cc-edit-org-phone" className="bg-card border-border text-foreground mt-1 h-9 text-sm" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Subscription Tier</Label>
            <Select value={form.subscriptionTier} onValueChange={(v) => setForm({ ...form, subscriptionTier: v })}>
              <SelectTrigger data-testid="select-cc-edit-org-tier" className="bg-card border-border text-foreground mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="standard" className="text-muted-foreground">Standard ($299/mo)</SelectItem>
                <SelectItem value="professional" className="text-muted-foreground">Professional ($799/mo)</SelectItem>
                <SelectItem value="enterprise" className="text-muted-foreground">Enterprise ($1,999/mo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-cc-submit-edit-org">
            {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editMutation.isPending ? "Updating..." : "Update Organization"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CommandCenterUsersTab() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [subTab, setSubTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [orgSearch, setOrgSearch] = useState("");
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const countries = getSupportedCountries();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: orgs = [], isLoading: orgsLoading } = useQuery<Organization[]>({ queryKey: ["/api/admin/organizations"] });
  const { data: orgList = [] } = useQuery<Organization[]>({ queryKey: ["/api/admin/organizations/list"] });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteUser(null);
      toast({ title: "User deleted" });
    },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/organizations/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations/list"] });
      setDeleteOrg(null);
      toast({ title: "Organization deleted" });
    },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const orgMap = new Map<string, string>();
  orgList.forEach((o) => orgMap.set(o.id, o.name));

  const filteredUsers = users.filter((u) => {
    if (userSearch && !u.fullName.toLowerCase().includes(userSearch.toLowerCase()) && !u.username.toLowerCase().includes(userSearch.toLowerCase()) && !u.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (countryFilter !== "all") {
      if (!u.organizationId) return false;
      const org = orgList.find((o) => o.id === u.organizationId);
      if (!org || org.country !== countryFilter) return false;
    }
    if (orgFilter !== "all") {
      if (orgFilter === "none") { if (u.organizationId) return false; }
      else if (u.organizationId !== orgFilter) return false;
    }
    return true;
  });

  const filteredOrgs = orgs.filter((o: Organization) => {
    if (orgSearch && !o.name.toLowerCase().includes(orgSearch.toLowerCase())) return false;
    return true;
  });

  const usersByRole = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const activeUsers = users.filter((u) => u.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-xl font-bold text-foreground" data-testid="text-total-users">{users.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Users</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-xl font-bold text-emerald-400" data-testid="text-active-users">{activeUsers}</p>
          <p className="text-[10px] text-muted-foreground">Active Users</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-xl font-bold text-foreground" data-testid="text-total-orgs">{orgs.length}</p>
          <p className="text-[10px] text-muted-foreground">Organizations</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{usersByRole.admin || 0}</p>
          <p className="text-[10px] text-muted-foreground">Administrators</p>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted border border-border h-8">
            <TabsTrigger value="users" className="text-[11px] data-[state=active]:bg-muted-foreground data-[state=active]:text-primary-foreground h-6 px-3" data-testid="subtab-users">
              <Users className="w-3 h-3 mr-1.5" /> Users ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-[11px] data-[state=active]:bg-muted-foreground data-[state=active]:text-primary-foreground h-6 px-3" data-testid="subtab-clients">
              <Building2 className="w-3 h-3 mr-1.5" /> Clients ({filteredOrgs.length})
            </TabsTrigger>
          </TabsList>
          <div>
            {subTab === "users" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => setCreateUserOpen(true)} data-testid="button-cc-add-user">
                <Plus className="w-3 h-3 mr-1" /> Add User
              </Button>
            )}
            {subTab === "clients" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => setCreateOrgOpen(true)} data-testid="button-cc-add-org">
                <Plus className="w-3 h-3 mr-1" /> Onboard Client
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="users" className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 bg-card border-border text-foreground h-8 text-xs"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                data-testid="input-cc-user-search"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[120px] bg-card border-border text-foreground h-8 text-xs" data-testid="filter-role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-muted-foreground text-xs">All Roles</SelectItem>
                <SelectItem value="super_admin" className="text-muted-foreground text-xs">Super Admin</SelectItem>
                <SelectItem value="admin" className="text-muted-foreground text-xs">Admin</SelectItem>
                <SelectItem value="regulator" className="text-muted-foreground text-xs">Regulator</SelectItem>
                <SelectItem value="lender" className="text-muted-foreground text-xs">Lender</SelectItem>
                <SelectItem value="viewer" className="text-muted-foreground text-xs">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] bg-card border-border text-foreground h-8 text-xs" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-muted-foreground text-xs">All Status</SelectItem>
                <SelectItem value="active" className="text-muted-foreground text-xs">Active</SelectItem>
                <SelectItem value="suspended" className="text-muted-foreground text-xs">Suspended</SelectItem>
                <SelectItem value="deactivated" className="text-muted-foreground text-xs">Deactivated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[130px] bg-card border-border text-foreground h-8 text-xs" data-testid="filter-country">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-muted-foreground text-xs">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.name} className="text-muted-foreground text-xs">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[150px] bg-card border-border text-foreground h-8 text-xs" data-testid="filter-org">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[200px]">
                <SelectItem value="all" className="text-muted-foreground text-xs">All Organizations</SelectItem>
                <SelectItem value="none" className="text-muted-foreground text-xs">No Organization</SelectItem>
                {orgList.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-muted-foreground text-xs">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border bg-muted overflow-hidden">
            {usersLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <UserCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Organization</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Role</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Last Login</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/20 hover:bg-accent" data-testid={`row-cc-user-${u.id}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-muted-foreground flex items-center justify-center">
                              <span className="text-[10px] font-medium text-muted-foreground">{u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{u.fullName}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.organizationId ? orgMap.get(u.organizationId) || "—" : "—"}</td>
                        <td className="p-3 text-center"><RoleBadge role={u.role} /></td>
                        <td className="p-3 text-center"><StatusBadge status={u.status} /></td>
                        <td className="p-3 text-muted-foreground text-[10px]">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-GB") : "Never"}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditUser(u); setEditUserOpen(true); }}
                              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`button-cc-edit-user-${u.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => setDeleteUser(u)}
                                className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                data-testid={`button-cc-delete-user-${u.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              className="pl-8 bg-card border-border text-foreground h-8 text-xs"
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              data-testid="input-cc-org-search"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted overflow-hidden">
            {orgsLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" /></div>
            ) : filteredOrgs.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No organizations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="w-8 p-3"></th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Organization</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Country</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Users</th>
                      <th className="text-center p-3 text-muted-foreground font-medium">Tier</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrgs.map((o) => {
                      const isExpanded = expandedOrgId === o.id;
                      const orgUsers = users.filter(u => u.organizationId === o.id);
                      return (
                        <React.Fragment key={o.id}>
                          <tr
                            className="border-b border-border/20 hover:bg-accent cursor-pointer"
                            data-testid={`row-cc-org-${o.id}`}
                            onClick={() => setExpandedOrgId(isExpanded ? null : o.id)}
                          >
                            <td className="p-3">
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-foreground">{o.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{o.contactEmail || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center"><OrgTypeBadge type={o.type} /></td>
                            <td className="p-3 text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                {o.country || "—"}
                              </div>
                            </td>
                            <td className="p-3 text-center"><StatusBadge status={o.status} /></td>
                            <td className="p-3 text-center text-muted-foreground">{(o as any).userCount ?? "—"}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`text-[9px] h-5 capitalize ${
                                o.subscriptionTier === "enterprise" ? "border-purple-500/30 text-purple-400 bg-purple-500/10" :
                                o.subscriptionTier === "professional" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                "border-border text-muted-foreground bg-muted"
                              }`}>{o.subscriptionTier}</Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditOrg(o); setEditOrgOpen(true); }}
                                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                  data-testid={`button-cc-edit-org-${o.id}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteOrg(o); }}
                                  className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                  data-testid={`button-cc-delete-org-${o.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/30" data-testid={`row-cc-org-detail-${o.id}`}>
                              <td colSpan={8} className="p-0">
                                <div className="px-6 py-4 space-y-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">{o.name}</span>
                                    <OrgTypeBadge type={o.type} />
                                    <StatusBadge status={o.status} />
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Mail className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                                      </div>
                                      <p className="text-xs font-medium truncate">{o.contactEmail || "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                                      </div>
                                      <p className="text-xs font-medium">{o.contactPhone || "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <MapPinned className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p>
                                      </div>
                                      <p className="text-xs font-medium truncate">{o.address || "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Globe className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Website</p>
                                      </div>
                                      {o.website ? (
                                        <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          {o.website.replace(/^https?:\/\//, "")} <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      ) : (
                                        <p className="text-xs font-medium">—</p>
                                      )}
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Crown className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subscription</p>
                                      </div>
                                      <Badge variant="outline" className={`text-[9px] capitalize ${
                                        o.subscriptionTier === "enterprise" ? "border-purple-500/30 text-purple-500 bg-purple-500/10" :
                                        o.subscriptionTier === "professional" ? "border-blue-500/30 text-blue-500 bg-blue-500/10" :
                                        "border-border text-muted-foreground bg-muted"
                                      }`}>{o.subscriptionTier}</Badge>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Users className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Users</p>
                                      </div>
                                      <p className="text-xs font-bold">{o.maxUsers ?? "Unlimited"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Country</p>
                                      </div>
                                      <p className="text-xs font-medium">{o.country || "—"}</p>
                                    </div>
                                    <div className="rounded-lg border p-2.5 bg-background">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Onboarded</p>
                                      </div>
                                      <p className="text-xs font-medium">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-GB") : "—"}</p>
                                    </div>
                                  </div>
                                  {orgUsers.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                                        <Users className="w-3 h-3" /> Assigned Users ({orgUsers.length})
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {orgUsers.map(u => (
                                          <div key={u.id} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                              <span className="text-[8px] font-bold text-primary">{u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-medium text-foreground leading-tight">{u.fullName}</p>
                                              <p className="text-[9px] text-muted-foreground">{u.role}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <UserCreateDialog open={createUserOpen} onOpenChange={setCreateUserOpen} organizations={orgList} />
      <UserEditDialog user={editUser} open={editUserOpen} onOpenChange={(v) => { setEditUserOpen(v); if (!v) setEditUser(null); }} organizations={orgList} />
      <OrgCreateDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <OrgEditDialog org={editOrg} open={editOrgOpen} onOpenChange={(v) => { setEditOrgOpen(v); if (!v) setEditOrg(null); }} />

      <Dialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-cc-delete-user-confirm">
            Are you sure you want to delete <span className="text-foreground font-medium">{deleteUser?.fullName}</span>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteUser(null)} className="text-muted-foreground" data-testid="button-cc-cancel-delete-user">Cancel</Button>
            <Button variant="destructive" disabled={deleteUserMutation.isPending} onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser.id)} data-testid="button-cc-confirm-delete-user">
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteOrg} onOpenChange={(v) => !v && setDeleteOrg(null)}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Organization</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-cc-delete-org-confirm">
            Are you sure you want to delete <span className="text-foreground font-medium">{deleteOrg?.name}</span>? All associated users will also be removed. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteOrg(null)} className="text-muted-foreground" data-testid="button-cc-cancel-delete-org">Cancel</Button>
            <Button variant="destructive" disabled={deleteOrgMutation.isPending} onClick={() => deleteOrg && deleteOrgMutation.mutate(deleteOrg.id)} data-testid="button-cc-confirm-delete-org">
              {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommandCenterUsersTab;
