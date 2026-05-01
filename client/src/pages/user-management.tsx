import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, UserCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, X, CalendarDays, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "default" as const;
    case "suspended": return "destructive" as const;
    case "deactivated": return "secondary" as const;
    default: return "outline" as const;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case "admin": return "default" as const;
    case "regulator": return "secondary" as const;
    case "lender": return "outline" as const;
    default: return "outline" as const;
  }
}

function formatTimestamp(dateStr: string | null | undefined): { date: string; time: string; relative: string } {
  if (!dateStr) return { date: "—", time: "", relative: "" };
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor(diffMs / 60000);
  let relative = "";
  if (diffMins < 1) relative = "just now";
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays === 1) relative = "yesterday";
  else if (diffDays < 30) relative = `${diffDays}d ago`;
  else if (diffDays < 365) relative = `${Math.floor(diffDays / 30)}mo ago`;
  else relative = `${Math.floor(diffDays / 365)}y ago`;
  return { date, time, relative };
}

type SortDir = "desc" | "asc";

export default function UserManagementPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [formData, setFormData] = useState({
    username: "", password: "", fullName: "", email: "",
    role: "viewer" as string, status: "active" as string, institution: "",
  });

  const [editFormData, setEditFormData] = useState({
    fullName: "", email: "", role: "", status: "", institution: "", password: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setFormData({ username: "", password: "", fullName: "", email: "", role: "viewer", status: "active", institution: "" });
      toast({ title: t('users.createdSuccess') });
    },
    onError: (e: Error) => {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const payload: Record<string, string> = {};
      if (data.fullName) payload.fullName = data.fullName;
      if (data.email) payload.email = data.email;
      if (data.role) payload.role = data.role;
      if (data.status) payload.status = data.status;
      if (data.institution !== undefined) payload.institution = data.institution;
      if (data.password) payload.password = data.password;
      const res = await apiRequest("PATCH", `/api/users/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
      toast({ title: t('users.updatedSuccess') });
    },
    onError: (e: Error) => {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteConfirmUser(null);
      toast({ title: t('users.deletedSuccess') });
    },
    onError: (e: Error) => {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    },
  });

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      institution: user.institution || "",
      password: "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    editMutation.mutate({ id: editingUser.id, data: editFormData });
  };

  const hasActiveFilters = search || roleFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  const isSuperAdmin = currentUser?.role === "super_admin";

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    // Non-super_admin callers should never see platform administrator accounts —
    // the server already strips them from the response, but we guard here too
    // so the UI never renders sensitive rows if data arrives from any other path.
    let result = isSuperAdmin ? [...users] : users.filter(u => u.role !== "super_admin");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.institution || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (statusFilter !== "all") result = result.filter(u => u.status === statusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(u => u.createdAt && new Date(u.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(u => u.createdAt && new Date(u.createdAt) <= to);
    }

    result.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

    return result;
  }, [users, search, roleFilter, statusFilter, dateFrom, dateTo, sortDir]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-users-title">{t('users.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('users.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setTimeout(() => { setFormData({ username: "", password: "", fullName: "", email: "", role: "viewer", status: "active", institution: "" }); }, 200); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.addNewUser')}</DialogTitle>
              <DialogDescription className="sr-only">Dialog form content</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-add-user">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t('users.username')}</Label><Input data-testid="input-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required /></div>
                <div><Label>{t('users.password')}</Label><Input data-testid="input-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required /></div>
              </div>
              <div><Label>{t('users.fullName')}</Label><Input data-testid="input-fullname" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required /></div>
              <div><Label>{t('users.email')}</Label><Input data-testid="input-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div><Label>{t('users.institution')}</Label><Input data-testid="input-institution" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t('users.role')}</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                      <SelectItem value="regulator">{t('users.roles.regulator')}</SelectItem>
                      <SelectItem value="lender">{t('users.roles.lender')}</SelectItem>
                      <SelectItem value="viewer">{t('users.roles.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('users.status')}</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('users.statuses.active')}</SelectItem>
                      <SelectItem value="suspended">{t('users.statuses.suspended')}</SelectItem>
                      <SelectItem value="deactivated">{t('users.statuses.deactivated')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-user">
                {createMutation.isPending ? t('users.creating') : t('users.createUser')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
            <DialogDescription className="sr-only">Dialog form content</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4" data-testid="form-edit-user">
            <div><Label>{t('users.fullName')}</Label><Input data-testid="input-edit-fullname" value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} required /></div>
            <div><Label>{t('users.email')}</Label><Input data-testid="input-edit-email" type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} required /></div>
            <div><Label>{t('users.institution')}</Label><Input data-testid="input-edit-institution" value={editFormData.institution} onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t('users.role')}</Label>
                <Select value={editFormData.role} onValueChange={(v) => setEditFormData({ ...editFormData, role: v })}>
                  <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
                    <SelectItem value="regulator">{t('users.roles.regulator')}</SelectItem>
                    <SelectItem value="lender">{t('users.roles.lender')}</SelectItem>
                    <SelectItem value="viewer">{t('users.roles.viewer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('users.status')}</Label>
                <Select value={editFormData.status} onValueChange={(v) => setEditFormData({ ...editFormData, status: v })}>
                  <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('users.statuses.active')}</SelectItem>
                    <SelectItem value="suspended">{t('users.statuses.suspended')}</SelectItem>
                    <SelectItem value="deactivated">{t('users.statuses.deactivated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{t('users.newPassword')}</Label><Input data-testid="input-edit-password" type="password" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} placeholder={t('users.leaveBlankPassword')} /></div>
            <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? t('users.saving') : t('users.saveChanges')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Search className="w-3 h-3" />Search</Label>
              <div className="relative">
                <Input
                  placeholder="Name, email, username, institution…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-7 h-8 text-sm"
                  data-testid="input-search-users"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Role filter */}
            <div className="w-36">
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" />Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-filter-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="regulator">Regulator</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="w-36">
              <Label className="text-xs text-muted-foreground mb-1">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" />Created from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-filter-date-from"
              />
            </div>

            {/* Date to */}
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1">Created to</Label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-filter-date-to"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8 text-xs text-muted-foreground" data-testid="button-clear-filters">
                  <X className="w-3 h-3 mr-1" />Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      {!isLoading && users && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground" data-testid="text-user-count">
            {hasActiveFilters
              ? `Showing ${filteredUsers.length} of ${users.length} users`
              : `${users.length} user${users.length !== 1 ? "s" : ""} total`}
          </p>
          <p className="text-xs text-muted-foreground">
            {sortDir === "desc" ? "Newest first" : "Oldest first"}
          </p>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.user')}</TableHead>
                    <TableHead>{t('users.username')}</TableHead>
                    <TableHead>{t('users.institution')}</TableHead>
                    <TableHead>{t('users.role')}</TableHead>
                    <TableHead>{t('users.status')}</TableHead>
                    <TableHead>
                      <button
                        onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        data-testid="button-sort-created"
                      >
                        {t('users.created')}
                        {sortDir === "desc"
                          ? <ArrowDown className="w-3 h-3" />
                          : <ArrowUp className="w-3 h-3" />}
                      </button>
                    </TableHead>
                    <TableHead>{t('users.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const ts = formatTimestamp((user.createdAt as unknown) as string | undefined);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{user.username}</TableCell>
                        <TableCell className="text-sm">{user.institution || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)} className="text-[10px] capitalize">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(user.status)} className="text-[10px] capitalize">{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {ts.date !== "—" ? (
                            <div>
                              <p className="text-foreground font-medium tabular-nums">{ts.date} <span className="text-muted-foreground font-normal">{ts.time}</span></p>
                              <p className="text-muted-foreground">{ts.relative}</p>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Super_admin accounts are only editable by other super_admins */}
                            {(isSuperAdmin || user.role !== "super_admin") && (
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(user)} data-testid={`button-edit-user-${user.id}`}>
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                {t('common.edit')}
                              </Button>
                            )}
                            {user.id !== currentUser?.id && user.role !== "super_admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setDeleteConfirmUser(user)}
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                {t('common.delete')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              {hasActiveFilters ? (
                <>
                  <h3 className="font-semibold">No users match your filters</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting or clearing the filters above.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Clear filters</Button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold">{t('users.noUsers')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('users.noUsersSub')}</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => { if (!open) { setDeleteConfirmText(""); setDeleteConfirmUser(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.confirmDelete')}</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. Type{" "}
              <span className="font-semibold text-destructive">DELETE</span>{" "}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="font-mono"
            data-testid="input-delete-confirm"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setDeleteConfirmText(""); setDeleteConfirmUser(null); }} data-testid="button-cancel-delete">{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending || deleteConfirmText !== "DELETE"}
              onClick={() => { if (deleteConfirmText === "DELETE" && deleteConfirmUser) deleteMutation.mutate(deleteConfirmUser.id); }}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t('users.deleting') : "Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
