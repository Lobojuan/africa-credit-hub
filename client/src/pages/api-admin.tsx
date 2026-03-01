import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Plug, TestTube2, CheckCircle, XCircle, Globe, Cloud, Gavel, CreditCard, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import type { ApiConfiguration } from "@shared/schema";

const categories = ["all", "weather", "judicial", "payment_gateway", "exchange_rate", "custom"] as const;
const authTypes = ["api_key", "oauth2", "bearer", "basic", "none"] as const;
const countries = SUPPORTED_COUNTRIES.map(c => c.name);

function getCategoryColor(category: string) {
  switch (category) {
    case "weather": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "judicial": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "payment_gateway": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "exchange_rate": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "weather": return <Cloud className="w-4 h-4" />;
    case "judicial": return <Gavel className="w-4 h-4" />;
    case "payment_gateway": return <CreditCard className="w-4 h-4" />;
    case "exchange_rate": return <Globe className="w-4 h-4" />;
    default: return <Settings2 className="w-4 h-4" />;
  }
}

const defaultFormData = {
  name: "",
  category: "weather",
  baseUrl: "",
  authType: "none",
  apiKeyHeaderName: "X-API-Key",
  country: "",
  description: "",
  isActive: true,
};

export default function ApiAdminPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: configs, isLoading } = useQuery<ApiConfiguration[]>({
    queryKey: ["/api/api-configurations"],
  });

  const filteredConfigs = configs?.filter(
    (c) => selectedCategory === "all" || c.category === selectedCategory
  ) ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/api-configurations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-configurations"] });
      setDialogOpen(false);
      setFormData(defaultFormData);
      toast({ title: t("apiAdmin.created") });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/api-configurations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-configurations"] });
      setDialogOpen(false);
      setEditingId(null);
      setFormData(defaultFormData);
      toast({ title: t("apiAdmin.updated") });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/api-configurations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-configurations"] });
      setDeleteConfirmId(null);
      toast({ title: t("apiAdmin.deleted") });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/api-configurations/${id}/test`);
      return res.json();
    },
    onSuccess: (data: { status: string; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-configurations"] });
      if (data.status === "success") {
        toast({ title: t("apiAdmin.testSuccess"), description: data.message || t("apiAdmin.testSuccess") });
      } else {
        toast({ title: t("apiAdmin.testFailed"), description: data.message || t("apiAdmin.testFailed"), variant: "destructive" });
      }
    },
    onError: (e: Error) => {
      toast({ title: t("apiAdmin.testFailed"), description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (config: ApiConfiguration) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      category: config.category,
      baseUrl: config.baseUrl,
      authType: config.authType,
      apiKeyHeaderName: config.apiKeyHeaderName || "X-API-Key",
      country: config.country || "",
      description: config.description || "",
      isActive: config.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <Plug className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-api-admin-title">
              {t("apiAdmin.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t("apiAdmin.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-api">
          <Plus className="w-4 h-4 mr-2" />
          {t("apiAdmin.addConfig")}
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="toggle-elevate"
            data-testid={`filter-${cat}`}
          >
            {t(`apiAdmin.categories.${cat}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config) => (
            <Card key={config.id} data-testid={`card-api-${config.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {getCategoryIcon(config.category)}
                  <h3 className="font-semibold text-sm truncate">{config.name}</h3>
                </div>
                <Badge
                  variant="secondary"
                  className={getCategoryColor(config.category)}
                  data-testid={`badge-category-${config.id}`}
                >
                  {t(`apiAdmin.categories.${config.category}`)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  <p className="text-xs font-mono text-muted-foreground truncate" title={config.baseUrl}>
                    {config.baseUrl}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`apiAdmin.authTypes.${config.authType}`)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {config.country || t("apiAdmin.global")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5" data-testid={`badge-status-${config.id}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${config.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs">{config.isActive ? t("apiAdmin.active") : t("apiAdmin.inactive")}</span>
                  </div>
                  {config.lastTestStatus && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {config.lastTestStatus === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span>
                        {config.lastTestStatus === "success" ? t("apiAdmin.testSuccess") : t("apiAdmin.testFailed")}
                        {config.lastTestedAt && ` - ${new Date(config.lastTestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(config.id)}
                    disabled={testMutation.isPending}
                    data-testid={`button-test-${config.id}`}
                  >
                    <TestTube2 className="w-3.5 h-3.5 mr-1" />
                    {testMutation.isPending ? t("apiAdmin.testing") : t("apiAdmin.testConnection")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(config)}
                    data-testid={`button-edit-api-${config.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(config.id)}
                    data-testid={`button-delete-api-${config.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {t("common.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{t("apiAdmin.noConfigs")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("apiAdmin.noConfigsSub")}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setFormData(defaultFormData); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t("apiAdmin.editConfig") : t("apiAdmin.addConfig")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-api-config">
            <div>
              <Label>{t("apiAdmin.name")}</Label>
              <Input
                data-testid="input-api-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("apiAdmin.name")}
                required
              />
            </div>
            <div>
              <Label>{t("apiAdmin.category")}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="select-api-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weather">{t("apiAdmin.categories.weather")}</SelectItem>
                  <SelectItem value="judicial">{t("apiAdmin.categories.judicial")}</SelectItem>
                  <SelectItem value="payment_gateway">{t("apiAdmin.categories.payment_gateway")}</SelectItem>
                  <SelectItem value="exchange_rate">{t("apiAdmin.categories.exchange_rate")}</SelectItem>
                  <SelectItem value="custom">{t("apiAdmin.categories.custom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("apiAdmin.baseUrl")}</Label>
              <Input
                data-testid="input-api-base-url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                required
              />
            </div>
            <div>
              <Label>{t("apiAdmin.authType")}</Label>
              <Select value={formData.authType} onValueChange={(v) => setFormData({ ...formData, authType: v })}>
                <SelectTrigger data-testid="select-api-auth-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">{t("apiAdmin.authTypes.api_key")}</SelectItem>
                  <SelectItem value="oauth2">{t("apiAdmin.authTypes.oauth2")}</SelectItem>
                  <SelectItem value="bearer">{t("apiAdmin.authTypes.bearer")}</SelectItem>
                  <SelectItem value="basic">{t("apiAdmin.authTypes.basic")}</SelectItem>
                  <SelectItem value="none">{t("apiAdmin.authTypes.none")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("apiAdmin.apiKeyHeader")}</Label>
              <Input
                data-testid="input-api-key-header"
                value={formData.apiKeyHeaderName}
                onChange={(e) => setFormData({ ...formData, apiKeyHeaderName: e.target.value })}
                placeholder="X-API-Key"
              />
            </div>
            <div>
              <Label>{t("apiAdmin.country")}</Label>
              <Select value={formData.country || "global"} onValueChange={(v) => setFormData({ ...formData, country: v === "global" ? "" : v })}>
                <SelectTrigger data-testid="select-api-country"><SelectValue placeholder={t("apiAdmin.global")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">{t("apiAdmin.global")}</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("apiAdmin.description")}</Label>
              <Textarea
                data-testid="input-api-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("apiAdmin.description")}
                className="resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("apiAdmin.active")}</Label>
              <Switch
                data-testid="switch-api-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-api"
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? t("common.save") + "..."
                : editingId ? t("apiAdmin.editConfig") : t("apiAdmin.addConfig")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("apiAdmin.deleteConfirm")}
          </p>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
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
