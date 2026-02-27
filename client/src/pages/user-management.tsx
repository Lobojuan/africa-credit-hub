import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Settings, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [formData, setFormData] = useState({
    username: "", password: "", fullName: "", email: "",
    role: "viewer" as string, status: "active" as string, institution: "",
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

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t('users.statusUpdated') });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
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
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('users.username')}</Label><Input data-testid="input-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required /></div>
                <div><Label>{t('users.password')}</Label><Input data-testid="input-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required /></div>
              </div>
              <div><Label>{t('users.fullName')}</Label><Input data-testid="input-fullname" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required /></div>
              <div><Label>{t('users.email')}</Label><Input data-testid="input-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div><Label>{t('users.institution')}</Label><Input data-testid="input-institution" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
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
                        <Select
                          value={user.status}
                          onValueChange={(v) => statusMutation.mutate({ id: user.id, status: v })}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t('users.statuses.active')}</SelectItem>
                            <SelectItem value="suspended">{t('users.statuses.suspended')}</SelectItem>
                            <SelectItem value="deactivated">{t('users.statuses.deactivated')}</SelectItem>
                          </SelectContent>
                        </Select>
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
    </div>
  );
}
