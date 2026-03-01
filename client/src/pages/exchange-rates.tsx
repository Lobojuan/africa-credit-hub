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
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { ExchangeRate } from "@shared/schema";

export default function ExchangeRatesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  const [formData, setFormData] = useState({
    baseCurrency: "USD",
    targetCurrency: "ETB",
    rate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState("USD");
  const [convertTo, setConvertTo] = useState("ETB");
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
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      toast({ title: "Success", description: "Exchange rate added successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      toast({ title: "Success", description: "Exchange rate updated successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      toast({ title: "Success", description: "Exchange rate deleted successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData({
      baseCurrency: "USD",
      targetCurrency: "ETB",
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
          <Label>Base Currency</Label>
          <Select value={formData.baseCurrency} onValueChange={(v) => setFormData({ ...formData, baseCurrency: v })}>
            <SelectTrigger data-testid="select-base-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target Currency</Label>
          <Select value={formData.targetCurrency} onValueChange={(v) => setFormData({ ...formData, targetCurrency: v })}>
            <SelectTrigger data-testid="select-target-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rate</Label>
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
          <Label>Effective Date</Label>
          <Input
            data-testid="input-effective-date"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
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
              Exchange Rate Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">Manage currency exchange rates and convert between currencies</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rate">
              <Plus className="w-4 h-4 mr-2" />
              Add Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Exchange Rate</DialogTitle>
            </DialogHeader>
            {renderRateForm(handleAddSubmit, createMutation.isPending, "Add Rate")}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Currency Converter</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Amount</Label>
              <Input
                data-testid="input-amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>From</Label>
              <Select value={convertFrom} onValueChange={setConvertFrom}>
                <SelectTrigger data-testid="select-from"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To</Label>
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger data-testid="select-to"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
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
              Convert
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
      ) : exchangeRates && exchangeRates.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-testid="table-exchange-rates">
                <TableHeader>
                  <TableRow>
                    <TableHead>Base Currency</TableHead>
                    <TableHead>Target Currency</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchangeRates.map((rate) => (
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
                        <Badge variant="secondary" className="text-xs">{rate.source}</Badge>
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
            <h3 className="font-semibold">No exchange rates found</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first exchange rate to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setSelectedRate(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exchange Rate</DialogTitle>
          </DialogHeader>
          {renderRateForm(handleEditSubmit, updateMutation.isPending, "Update Rate")}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelectedRate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the exchange rate{" "}
            <span className="font-semibold">{selectedRate?.baseCurrency} to {selectedRate?.targetCurrency}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedRate && deleteMutation.mutate(selectedRate.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
