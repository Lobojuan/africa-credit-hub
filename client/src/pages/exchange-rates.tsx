import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, ArrowRightLeft, DollarSign, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SUPPORTED_CURRENCIES, getModeCurrencies } from "@/lib/currency";
import { isGhanaMode } from "@/lib/country-mode";
import type { ExchangeRate } from "@shared/schema";

export default function ExchangeRatesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  const ghanaMode = isGhanaMode();
  const currencyList = getModeCurrencies();

  const [formData, setFormData] = useState({
    baseCurrency: "USD",
    targetCurrency: "GHS",
    rate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState("USD");
  const [convertTo, setConvertTo] = useState("GHS");
  const [convertResult, setConvertResult] = useState<string | null>(null);

  const { data: exchangeRates, isLoading } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/exchange-rates"],
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/exchange-rates/convert?amount=${convertAmount}&from=${convertFrom}&to=${convertTo}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setConvertResult(
        `${convertAmount} ${convertFrom} = ${parseFloat(data.convertedAmount).toFixed(2)} ${convertTo}`
      );
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/exchange-rates", {
        ...data,
        rate: data.rate,
        source: "manual",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: t("exchangeRates.created") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/exchange-rates/${id}`, {
        ...data,
        rate: data.rate,
        source: "manual",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      setEditDialogOpen(false);
      setSelectedRate(null);
      resetForm();
      toast({ title: t("exchangeRates.updated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/exchange-rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      setDeleteDialogOpen(false);
      setSelectedRate(null);
      toast({ title: t("exchangeRates.deleted") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/exchange-rates/refresh");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      toast({ title: t("exchangeRates.refreshed", "Rates Updated"), description: `${data.updated} ${t("exchangeRates.pairsUpdated", "currency pairs updated from live API")}` });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData({
      baseCurrency: "USD",
      targetCurrency: "GHS",
      rate: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
  }

  function openEdit(rate: ExchangeRate) {
    setSelectedRate(rate);
    setFormData({
      baseCurrency: rate.baseCurrency,
      targetCurrency: rate.targetCurrency,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate,
    });
    setEditDialogOpen(true);
  }

  function openDelete(rate: ExchangeRate) {
    setSelectedRate(rate);
    setDeleteDialogOpen(true);
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(formData);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRate) {
      updateMutation.mutate({ id: selectedRate.id, data: formData });
    }
  }

  function renderRateForm(onSubmit: (e: React.FormEvent) => void, isPending: boolean, submitLabel: string) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>{t("exchangeRates.baseCurrency")}</Label>
          <Select value={formData.baseCurrency} onValueChange={(v) => setFormData({ ...formData, baseCurrency: v })}>
            <SelectTrigger data-testid="select-base-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencyList.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("exchangeRates.targetCurrency")}</Label>
          <Select value={formData.targetCurrency} onValueChange={(v) => setFormData({ ...formData, targetCurrency: v })}>
            <SelectTrigger data-testid="select-target-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencyList.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("exchangeRates.rate")}</Label>
          <Input
            data-testid="input-rate"
            type="number"
            step="0.000001"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>{t("exchangeRates.effectiveDate")}</Label>
          <Input
            data-testid="input-effective-date"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.processing") : submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-page-title">
              {t("exchangeRates.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("exchangeRates.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            data-testid="button-refresh-rates"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? t("exchangeRates.refreshing", "Refreshing...") : t("exchangeRates.refreshRates", "Refresh Rates")}
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rate">
              <Plus className="w-4 h-4 mr-2" />
              {t("exchangeRates.addRate")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("exchangeRates.addRate")}</DialogTitle>
            </DialogHeader>
            {renderRateForm(handleAddSubmit, createMutation.isPending, t("exchangeRates.addRate"))}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("exchangeRates.converter")}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label>{t("exchangeRates.amount")}</Label>
              <Input
                data-testid="input-amount"
                type="number"
                step="0.01"
                placeholder={t("exchangeRates.amount")}
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("exchangeRates.baseCurrency")}</Label>
              <Select value={convertFrom} onValueChange={setConvertFrom}>
                <SelectTrigger data-testid="select-from"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyList.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("exchangeRates.targetCurrency")}</Label>
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger data-testid="select-to"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyList.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              data-testid="button-convert"
              onClick={() => convertMutation.mutate()}
              disabled={!convertAmount || convertMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${convertMutation.isPending ? "animate-spin" : ""}`} />
              {t("exchangeRates.convert")}
            </Button>
          </div>
          {convertResult && (
            <>
              <Separator className="my-3" />
              <p className="text-lg font-semibold" data-testid="text-result">{convertResult}</p>
            </>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (() => {
        const ghanaCodes = new Set(currencyList.map(c => c.code));
        const displayRates = ghanaMode && exchangeRates
          ? exchangeRates.filter(r => ghanaCodes.has(r.baseCurrency) && ghanaCodes.has(r.targetCurrency))
          : exchangeRates || [];
        return displayRates.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-testid="table-exchange-rates">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("exchangeRates.baseCurrency")}</TableHead>
                    <TableHead>{t("exchangeRates.targetCurrency")}</TableHead>
                    <TableHead>{t("exchangeRates.rate")}</TableHead>
                    <TableHead>{t("exchangeRates.effectiveDate")}</TableHead>
                    <TableHead>{t("exchangeRates.source")}</TableHead>
                    <TableHead>{t("exchangeRates.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRates.map((rate) => (
                    <TableRow key={rate.id} data-testid={`row-rate-${rate.id}`}>
                      <TableCell>
                        <Badge variant="outline">{rate.baseCurrency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rate.targetCurrency}</Badge>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-rate-${rate.id}`}>
                        {parseFloat(rate.rate).toFixed(6)}
                      </TableCell>
                      <TableCell data-testid={`text-date-${rate.id}`}>{rate.effectiveDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {rate.source === "manual" ? t("exchangeRates.manual") : t("exchangeRates.api")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-edit-rate-${rate.id}`}
                            onClick={() => openEdit(rate)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-rate-${rate.id}`}
                            onClick={() => openDelete(rate)}
                          >
                            <Trash2 className="w-4 h-4" />
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
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{t("exchangeRates.noRates")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("exchangeRates.noRatesSub")}</p>
          </CardContent>
        </Card>
      );
      })()}

      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setSelectedRate(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("exchangeRates.editRate")}</DialogTitle>
          </DialogHeader>
          {renderRateForm(handleEditSubmit, updateMutation.isPending, t("common.save"))}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelectedRate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("exchangeRates.deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("exchangeRates.deleteConfirm")}{" "}
            <span className="font-semibold">{selectedRate?.baseCurrency} → {selectedRate?.targetCurrency}</span>
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => selectedRate && deleteMutation.mutate(selectedRate.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("common.processing") : t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
