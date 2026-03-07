import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export default function UserManagementPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

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

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-users-title">{t('users.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('users.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.addNewUser')}</DialogTitle>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4" data-testid="form-edit-user">
            <div>
              <Label>{t('users.fullName')}</Label>
              <Input data-testid="input-edit-fullname" value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} required />
            </div>
            <div>
              <Label>{t('users.email')}</Label>
              <Input data-testid="input-edit-email" type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} required />
            </div>
            <div>
              <Label>{t('users.institution')}</Label>
              <Input data-testid="input-edit-institution" value={editFormData.institution} onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })} />
            </div>
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
            <div>
              <Label>{t('users.newPassword')}</Label>
              <Input data-testid="input-edit-password" type="password" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} placeholder={t('users.leaveBlankPassword')} />
            </div>
            <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? t('users.saving') : t('users.saveChanges')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.user')}</TableHead>
                    <TableHead>{t('users.username')}</TableHead>
                    <TableHead>{t('users.institution')}</TableHead>
                    <TableHead>{t('users.role')}</TableHead>
                    <TableHead>{t('users.status')}</TableHead>
                    <TableHead>{t('users.created')}</TableHead>
                    <TableHead>{t('users.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
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
                      <TableCell className="text-xs text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            {t('common.edit')}
                          </Button>
                          {user.id !== currentUser?.id && (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">{t('users.noUsers')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('users.noUsersSub')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-delete-confirm-message">
            {t('users.confirmDeleteMessage', { name: deleteConfirmUser?.fullName })}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmUser(null)} data-testid="button-cancel-delete">
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmUser && deleteMutation.mutate(deleteConfirmUser.id)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t('users.deleting') : t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
