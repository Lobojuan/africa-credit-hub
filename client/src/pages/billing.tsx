import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Receipt, DollarSign, Clock, AlertTriangle, Building2, Calendar, Hash, FileText } from "lucide-react";
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
import type { BillingRecord } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <Badge variant="outline" className={variants[status] || ""} data-testid={`status-badge-${status}`}>
      {t(`billing.status.${status}`, status)}
    </Badge>
  );
}

export default function BillingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "regulator";
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);

  const { data: billingRecords, isLoading } = useQuery<BillingRecord[]>({
    queryKey: ["/api/billing"],
  });

  const [formData, setFormData] = useState({
    institutionName: "",
    serviceType: "data_submission",
    amount: "",
    currency: "ETB",
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
        currency: "ETB",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalRevenue = billingRecords?.reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const pendingAmount = billingRecords?.filter(r => r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;
  const overdueAmount = billingRecords?.filter(r => r.status === "overdue").reduce((sum, r) => sum + parseFloat(r.amount), 0) ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-billing-title">{t("billing.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("billing.subtitle")}</p>
        </div>
        {isAdmin && (
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
                    required
                  />
                </div>
                <div>
                  <Label>{t("billing.serviceType")}</Label>
                  <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                    <SelectTrigger data-testid="select-service-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_submission">{t("billing.serviceTypes.data_submission")}</SelectItem>
                      <SelectItem value="credit_report">{t("billing.serviceTypes.credit_report")}</SelectItem>
                      <SelectItem value="api_access">{t("billing.serviceTypes.api_access")}</SelectItem>
                      <SelectItem value="subscription">{t("billing.serviceTypes.subscription")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("billing.amount")}</Label>
                    <Input
                      data-testid="input-amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t("billing.currency")}</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETB">ETB</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="GHS">GHS</SelectItem>
                        <SelectItem value="UGX">UGX</SelectItem>
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
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </>
        ) : (
          <>
            <Card data-testid="card-total-revenue">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.totalRevenue")}</span>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-total-revenue">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-pending-amount">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.pendingAmount")}</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-pending-amount">{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-overdue-amount">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("billing.overdueAmount")}</span>
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-overdue-amount">{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
      ) : billingRecords && billingRecords.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-testid="table-billing">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("billing.invoiceNumber")}</TableHead>
                    <TableHead>{t("billing.institutionName")}</TableHead>
                    <TableHead>{t("billing.serviceType")}</TableHead>
                    <TableHead>{t("billing.amount")}</TableHead>
                    <TableHead>{t("billing.currency")}</TableHead>
                    <TableHead>{t("billing.statusLabel")}</TableHead>
                    <TableHead>{t("billing.periodStart")}</TableHead>
                    <TableHead>{t("billing.periodEnd")}</TableHead>
                    <TableHead>{t("billing.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-billing-${record.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRecord(record)}>
                      <TableCell className="font-medium" data-testid={`text-invoice-${record.id}`}>{record.invoiceNumber}</TableCell>
                      <TableCell>{record.institutionName}</TableCell>
                      <TableCell>{t(`billing.serviceTypes.${record.serviceType}`, record.serviceType)}</TableCell>
                      <TableCell>{parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{record.currency}</TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell>{record.periodStart || "—"}</TableCell>
                      <TableCell>{record.periodEnd || "—"}</TableCell>
                      <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}</TableCell>
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
            <h3 className="font-semibold">{t("billing.noRecords")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("billing.noRecordsDesc")}</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.institutionName")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-institution">{selectedRecord.institutionName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("billing.serviceType")}</p>
                  <p className="text-sm font-medium" data-testid="text-detail-service">{t(`billing.serviceTypes.${selectedRecord.serviceType}`, selectedRecord.serviceType)}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
