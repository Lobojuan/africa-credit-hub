import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Receipt, DollarSign, Clock, AlertTriangle, Building2, Calendar, Hash, FileText, Mail, MailWarning, CheckCircle, XCircle, Send, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SUPPORTED_CURRENCIES, getModeCurrencies } from "@/lib/currency";
import { isGhanaMode } from "@/lib/country-mode";
import type { BillingRecord } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    paid: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    overdue: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  };
  return (
    <Badge variant="outline" className={variants[status] || ""} data-testid={`status-badge-${status}`}>
      {t(`billing.status.${status}`, status)}
    </Badge>
  );
}

const SERVICE_TYPES = [
  "data_submission",
  "credit_report",
  "api_access",
  "subscription",
  "dispute_resolution",
  "annual_subscription",
  "portfolio_monitoring",
  "batch_upload",
  "kyc_verification",
  "regulatory_export",
  "cross_border_inquiry",
  "custom",
];

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [recentDays, setRecentDays] = useState(0);

  const canManage = user?.role === "admin" || user?.role === "regulator" || user?.role === "super_admin" || user?.role === "platform_owner";
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);

  const { data: billingRecords, isLoading } = useQuery<BillingRecord[]>({
    queryKey: ["/api/billing", recentDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (recentDays > 0) params.set("recentDays", String(recentDays));
      const res = await fetch(`/api/billing?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch billing records");
      return res.json();
    },
  });

  const ghanaMode = isGhanaMode();
  const currencyList = getModeCurrencies();

  const [formData, setFormData] = useState({
    institutionName: "",
    serviceType: "data_submission",
    amount: "",
    currency: "GHS",
    invoiceNumber: "",
    periodStart: "",
    periodEnd: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/billing", {
        ...data,
        amount: data.amount,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      setDialogOpen(false);
      setFormData({
        institutionName: "",
        serviceType: "data_submission",
        amount: "",
        currency: "GHS",
        invoiceNumber: "",
        periodStart: "",
        periodEnd: "",
      });
      toast({ title: t("billing.invoiceCreated"), description: t("billing.invoiceCreatedDesc") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/billing/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      setSelectedRecord(null);
      toast({ title: "Status Updated", description: `Invoice marked as ${variables.status}` });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await apiRequest("POST", `/api/billing/${id}/send-reminder`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Reminder Sent", description: data.message });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const bulkReminderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/send-all-reminders", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bulk Reminders", description: data.message });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredRecords = billingRecords?.filter(r => statusFilter === "all" || r.status === statusFilter) ?? [];
  const totalRevenue = billingRecords?.reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const pendingAmount = billingRecords?.filter(r => r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const overdueAmount = billingRecords?.filter(r => r.status === "overdue").reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const paidAmount = billingRecords?.filter(r => r.status === "paid").reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const pendingCount = billingRecords?.filter(r => r.status === "pending").length ?? 0;
  const overdueCount = billingRecords?.filter(r => r.status === "overdue").length ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-billing-title">{t("billing.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("billing.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Select value={String(recentDays)} onValueChange={(v) => setRecentDays(Number(v))}>
              <SelectTrigger className="w-[160px]" data-testid="select-recent-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("common.allTime", "All Time")}</SelectItem>
                <SelectItem value="1">{t("common.last24h", "Last 24 Hours")}</SelectItem>
                <SelectItem value="7">{t("common.last7d", "Last 7 Days")}</SelectItem>
                <SelectItem value="30">{t("common.last30d", "Last 30 Days")}</SelectItem>
                <SelectItem value="90">{t("common.last90d", "Last 90 Days")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canManage && (overdueCount > 0 || pendingCount > 0) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => bulkReminderMutation.mutate()}
              disabled={bulkReminderMutation.isPending}
              data-testid="button-send-all-reminders"
            >
              <MailWarning className="w-4 h-4" />
              {bulkReminderMutation.isPending ? "Sending..." : `Send All Reminders (${overdueCount + pendingCount})`}
            </Button>
          )}
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-invoice">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("billing.createInvoice")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("billing.createInvoice")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-create-invoice">
                  <div>
                    <Label>{t("billing.institutionName")}</Label>
                    <Input
                      data-testid="input-institution-name"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder="e.g. Republic Bank Ghana"
                      required
                    />
                  </div>
                  <div>
                    <Label>{t("billing.serviceType")}</Label>
                    <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                      <SelectTrigger data-testid="select-service-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {t(`billing.serviceTypes.${st}`, st.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{t("billing.amount")}</Label>
                      <Input
                        data-testid="input-amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label>{t("billing.currency")}</Label>
                      <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                        <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {currencyList.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code} ({isFr ? c.nameFr : c.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t("billing.invoiceNumber")}</Label>
                    <Input
                      data-testid="input-invoice-number"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="e.g. INV-GHA-50001"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{t("billing.periodStart")}</Label>
                      <Input
                        data-testid="input-period-start"
                        type="date"
                        value={formData.periodStart}
                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("billing.periodEnd")}</Label>
                      <Input
                        data-testid="input-period-end"
                        type="date"
                        value={formData.periodEnd}
                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-invoice">
                    {createMutation.isPending ? t("billing.creating") : t("billing.createInvoice")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </>
        ) : (
          <>
            <Card data-testid="card-total-revenue" className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("all")}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.totalRevenue")}</span>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-revenue">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-1">{billingRecords?.length ?? 0} invoices total</p>
              </CardContent>
            </Card>
            <Card data-testid="card-paid-amount" className={`cursor-pointer hover:border-green-500/50 transition-colors ${statusFilter === "paid" ? "border-green-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Collected</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-paid-amount">{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-1">{billingRecords?.filter(r => r.status === "paid").length ?? 0} paid</p>
              </CardContent>
            </Card>
            <Card data-testid="card-pending-amount" className={`cursor-pointer hover:border-yellow-500/50 transition-colors ${statusFilter === "pending" ? "border-yellow-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.pendingAmount")}</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-pending-amount">{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingCount} pending</p>
              </CardContent>
            </Card>
            <Card data-testid="card-overdue-amount" className={`cursor-pointer hover:border-red-500/50 transition-colors ${statusFilter === "overdue" ? "border-red-500" : ""}`} onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.overdueAmount")}</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-overdue-amount">{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-1">{overdueCount} overdue</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Showing: <span className="font-medium text-foreground capitalize">{statusFilter}</span> invoices</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStatusFilter("all")} data-testid="button-clear-filter">Clear</Button>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredRecords.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-testid="table-billing">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("billing.invoiceNumber")}</TableHead>
                    <TableHead>{t("billing.institutionName")}</TableHead>
                    <TableHead>{t("billing.serviceType")}</TableHead>
                    <TableHead className="text-right">{t("billing.amount")}</TableHead>
                    <TableHead>{t("billing.currency")}</TableHead>
                    <TableHead>{t("billing.statusLabel")}</TableHead>
                    <TableHead>{t("billing.periodStart")}</TableHead>
                    <TableHead>{t("billing.periodEnd")}</TableHead>
                    <TableHead>{t("billing.createdAt")}</TableHead>
                    {canManage && <TableHead className="text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-billing-${record.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRecord(record)}>
                      <TableCell className="font-medium" data-testid={`text-invoice-${record.id}`}>{record.invoiceNumber}</TableCell>
                      <TableCell>{record.institutionName}</TableCell>
                      <TableCell>{t(`billing.serviceTypes.${record.serviceType}`, record.serviceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}</TableCell>
                      <TableCell className="text-right font-mono">{parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{record.currency}</TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell>{record.periodStart || "—"}</TableCell>
                      <TableCell>{record.periodEnd || "—"}</TableCell>
                      <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}</TableCell>
                      {canManage && (
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-center">
                            {record.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                onClick={() => statusMutation.mutate({ id: record.id, status: "paid" })}
                                disabled={statusMutation.isPending}
                                data-testid={`button-mark-paid-${record.id}`}
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {record.status !== "overdue" && record.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => statusMutation.mutate({ id: record.id, status: "overdue" })}
                                disabled={statusMutation.isPending}
                                data-testid={`button-mark-overdue-${record.id}`}
                                title="Mark as Overdue"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {record.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                onClick={() => reminderMutation.mutate({ id: record.id })}
                                disabled={reminderMutation.isPending}
                                data-testid={`button-send-reminder-${record.id}`}
                                title="Send Reminder Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
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
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{statusFilter !== "all" ? `No ${statusFilter} invoices` : t("billing.noRecords")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{statusFilter !== "all" ? "Try a different filter or create a new invoice." : t("billing.noRecordsDesc")}</p>
            {statusFilter !== "all" && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setStatusFilter("all")} data-testid="button-show-all">Show All Invoices</Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {selectedRecord?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedRecord.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.institutionName")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-institution">{selectedRecord.institutionName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.serviceType")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-service">{t(`billing.serviceTypes.${selectedRecord.serviceType}`, selectedRecord.serviceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.amount")}</p>
                  <p className="text-sm font-bold" data-testid="text-detail-amount">{parseFloat(selectedRecord.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedRecord.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.createdAt")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-created">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.periodStart")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-start">{selectedRecord.periodStart || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.periodEnd")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-end">{selectedRecord.periodEnd || "—"}</p>
                </div>
              </div>
              {canManage && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.status !== "paid" && (
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700"
                        onClick={() => statusMutation.mutate({ id: selectedRecord.id, status: "paid" })}
                        disabled={statusMutation.isPending}
                        data-testid="button-detail-mark-paid"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                      </Button>
                    )}
                    {selectedRecord.status === "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => statusMutation.mutate({ id: selectedRecord.id, status: "pending" })}
                        disabled={statusMutation.isPending}
                        data-testid="button-detail-revert-pending"
                      >
                        <Clock className="w-3.5 h-3.5" /> Revert to Pending
                      </Button>
                    )}
                    {selectedRecord.status !== "overdue" && selectedRecord.status !== "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => statusMutation.mutate({ id: selectedRecord.id, status: "overdue" })}
                        disabled={statusMutation.isPending}
                        data-testid="button-detail-mark-overdue"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Mark as Overdue
                      </Button>
                    )}
                    {selectedRecord.status !== "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        onClick={() => reminderMutation.mutate({ id: selectedRecord.id })}
                        disabled={reminderMutation.isPending}
                        data-testid="button-detail-send-reminder"
                      >
                        <Send className="w-3.5 h-3.5" /> {reminderMutation.isPending ? "Sending..." : "Send Reminder"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
