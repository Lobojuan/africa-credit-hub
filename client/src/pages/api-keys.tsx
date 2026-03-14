import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Key, Plus, Copy, Eye, EyeOff, ShieldOff, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Institution } from "@shared/schema";

type ApiKeyWithInstitution = {
  id: string;
  institutionId: string;
  keyHash: string;
  keyPrefix: string;
  label: string;
  status: string;
  permissions: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  institutionName: string;
};

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: keys, isLoading } = useQuery<ApiKeyWithInstitution[]>({
    queryKey: ["/api/api-keys"],
  });

  const { data: instResult } = useQuery<{ data: Institution[]; total: number }>({
    queryKey: ["/api/institutions?page=1&limit=200"],
  });
  const activeInstitutions = instResult?.data?.filter(i => i.status === "active") || [];

  const [formData, setFormData] = useState({
    institutionId: "",
    label: "",
    permissions: "submit",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/api-keys", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setGeneratedKey(data.fullKey);
      setShowKey(true);
      setFormData({ institutionId: "", label: "", permissions: "submit" });
      toast({ title: t("apiKeys.keyGenerated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/api-keys/${id}/revoke`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: t("apiKeys.keyRevoked") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("apiKeys.copied") });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-api-keys-title">{t("apiKeys.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("apiKeys.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/api-docs")} data-testid="button-api-docs">
            <ExternalLink className="w-4 h-4 mr-2" />
            {t("apiKeys.viewDocs")}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setGeneratedKey(null); setShowKey(false); } }}>
            <DialogTrigger asChild>
              <Button data-testid="button-generate-key">
                <Plus className="w-4 h-4 mr-2" />
                {t("apiKeys.generateKey")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("apiKeys.generateNewKey")}</DialogTitle>
                <DialogDescription className="sr-only">{t("apiKeys.generateNewKey")}</DialogDescription>
              </DialogHeader>
              {generatedKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">{t("apiKeys.keyGeneratedWarning")}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-card dark:bg-black p-2 rounded font-mono break-all" data-testid="text-generated-key">
                        {showKey ? generatedKey : "••••••••••••••••••••••••••••"}
                      </code>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(generatedKey)} data-testid="button-copy-key">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => { setDialogOpen(false); setGeneratedKey(null); setShowKey(false); }}>{t("apiKeys.done")}</Button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-generate-key">
                  <div>
                    <Label>{t("apiKeys.institution")}</Label>
                    <Select value={formData.institutionId} onValueChange={(v) => setFormData({ ...formData, institutionId: v })}>
                      <SelectTrigger data-testid="select-institution"><SelectValue placeholder={t("apiKeys.selectInstitution")} /></SelectTrigger>
                      <SelectContent>
                        {activeInstitutions.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeInstitutions.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{t("apiKeys.noActiveInstitutions")}</p>
                    )}
                  </div>
                  <div>
                    <Label>{t("apiKeys.label")}</Label>
                    <Input
                      data-testid="input-key-label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder={t("apiKeys.labelPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t("apiKeys.permissions")}</Label>
                    <Select value={formData.permissions} onValueChange={(v) => setFormData({ ...formData, permissions: v })}>
                      <SelectTrigger data-testid="select-permissions"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submit">{t("apiKeys.permSubmit")}</SelectItem>
                        <SelectItem value="read">{t("apiKeys.permRead")}</SelectItem>
                        <SelectItem value="full">{t("apiKeys.permFull")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !formData.institutionId || !formData.label} data-testid="button-submit-key">
                    {createMutation.isPending ? t("apiKeys.generating") : t("apiKeys.generateKey")}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : keys && keys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("apiKeys.keyPrefix")}</TableHead>
                    <TableHead>{t("apiKeys.label")}</TableHead>
                    <TableHead>{t("apiKeys.institution")}</TableHead>
                    <TableHead>{t("apiKeys.permissions")}</TableHead>
                    <TableHead>{t("apiKeys.status")}</TableHead>
                    <TableHead>{t("apiKeys.lastUsed")}</TableHead>
                    <TableHead>{t("apiKeys.created")}</TableHead>
                    <TableHead>{t("apiKeys.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id} data-testid={`row-api-key-${key.id}`}>
                      <TableCell className="font-mono text-xs" data-testid={`text-prefix-${key.id}`}>{key.keyPrefix}...</TableCell>
                      <TableCell className="text-sm font-medium">{key.label}</TableCell>
                      <TableCell className="text-sm">{key.institutionName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{key.permissions}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={key.status === "active" ? "default" : "destructive"}
                          className={key.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : t("apiKeys.never")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.createdAt ? new Date(key.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        {key.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => revokeMutation.mutate(key.id)}
                            disabled={revokeMutation.isPending}
                            data-testid={`button-revoke-${key.id}`}
                          >
                            <ShieldOff className="w-3 h-3 mr-1" />
                            {t("apiKeys.revoke")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">{t("apiKeys.noKeys")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("apiKeys.noKeysSub")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
