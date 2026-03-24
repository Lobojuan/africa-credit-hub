import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { isGhanaMode, BOG_FACILITY_TYPES, BOG_PURPOSE_CODES, BOG_ASSET_CLASSIFICATIONS, BOG_REPAYMENT_FREQUENCIES, BOG_COLLATERAL_TYPES, STANDARD_CREDIT_TYPES, CREDIT_CATEGORIES, inferCreditCategory } from "@/lib/country-mode";
import { CurrencyReference } from "@/components/currency-reference";
import type { CreditAccount, Borrower } from "@shared/schema";

function getStatusVariant(status: string) {
  switch (status) {
    case "current": return "default" as const;
    case "delinquent": return "destructive" as const;
    case "default": return "destructive" as const;
    case "closed": return "secondary" as const;
    default: return "outline" as const;
  }
}

export default function CreditAccountsPage() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const { data: borrowersResult } = useQuery<{ data: Borrower[]; total: number }>({
    queryKey: ["/api/borrowers?page=1&limit=200"],
  });
  const borrowers = borrowersResult?.data;

  const ghanaMode = isGhanaMode();

  const [formData, setFormData] = useState({
    borrowerId: "", lenderInstitution: "", accountNumber: "", accountType: "",
    creditCategory: "" as string,
    originalAmount: "", currentBalance: "", currency: ghanaMode ? "GHS" : "ETB",
    interestRate: "", disbursementDate: "", maturityDate: "",
    status: "current" as string, collateralType: "", collateralValue: "",
    isInterestFree: false, gracePeriodMonths: "", restructureCount: "0",
    facilityTypeCode: "", purposeOfFacility: "", repaymentFrequency: "",
    assetClassification: "", amountOverdue: "", writtenOffAmount: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        gracePeriodMonths: data.gracePeriodMonths ? parseInt(data.gracePeriodMonths) : null,
        restructureCount: data.restructureCount ? parseInt(data.restructureCount) : 0,
      };
      const res = await apiRequest("POST", "/api/credit-accounts", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      setDialogOpen(false);
      toast({ title: data.message || "Submitted for approval", description: "A different authorized user must approve this change." });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const isFr = i18n.language === "fr";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-accounts-title">{t("creditAccounts.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("creditAccounts.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-account">
              <Plus className="w-4 h-4 mr-2" />
              {t("creditAccounts.addAccount")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("creditAccounts.addCreditAccount")}</DialogTitle>
              <DialogDescription className="sr-only">Dialog form content</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-add-account">
              <div>
                <Label>{t("creditAccounts.borrower")}</Label>
                <Select value={formData.borrowerId} onValueChange={(v) => setFormData({ ...formData, borrowerId: v })}>
                  <SelectTrigger data-testid="select-borrower"><SelectValue placeholder={t("creditAccounts.selectBorrower")} /></SelectTrigger>
                  <SelectContent>
                    {borrowers?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`} — {b.nationalId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("creditAccounts.lenderInstitution")}</Label><Input data-testid="input-lender" value={formData.lenderInstitution} onChange={(e) => setFormData({ ...formData, lenderInstitution: e.target.value })} required /></div>
                <div><Label>{t("creditAccounts.accountNumber")}</Label><Input data-testid="input-account-number" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required /></div>
              </div>
              <div>
                <Label>{t("creditAccounts.accountType")}</Label>
                <Select value={formData.accountType} onValueChange={(v) => {
                  const cat = inferCreditCategory(v);
                  setFormData({ ...formData, accountType: v, creditCategory: cat });
                }}>
                  <SelectTrigger data-testid="select-account-type"><SelectValue placeholder={t("creditAccounts.select")} /></SelectTrigger>
                  <SelectContent>
                    {STANDARD_CREDIT_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Credit Category</Label>
                  <Select value={formData.creditCategory} onValueChange={(v) => setFormData({ ...formData, creditCategory: v })}>
                    <SelectTrigger data-testid="select-credit-category"><SelectValue placeholder="Auto-detected" /></SelectTrigger>
                    <SelectContent>
                      {CREDIT_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("creditAccounts.status")}</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">{t("creditAccounts.current")}</SelectItem>
                      <SelectItem value="delinquent">{t("creditAccounts.delinquent")}</SelectItem>
                      <SelectItem value="default">{t("creditAccounts.default")}</SelectItem>
                      <SelectItem value="closed">{t("creditAccounts.closed")}</SelectItem>
                      <SelectItem value="restructured">{t("creditAccounts.restructured")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {ghanaMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>BoG Facility Type</Label>
                    <Select value={formData.facilityTypeCode} onValueChange={(v) => setFormData({ ...formData, facilityTypeCode: v })}>
                      <SelectTrigger data-testid="select-facility-type"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BOG_FACILITY_TYPES.map(f => (
                          <SelectItem key={f.code} value={f.code}>{f.code} — {f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Purpose of Facility</Label>
                    <Select value={formData.purposeOfFacility} onValueChange={(v) => setFormData({ ...formData, purposeOfFacility: v })}>
                      <SelectTrigger data-testid="select-purpose"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BOG_PURPOSE_CODES.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("creditAccounts.originalAmount")} ({formData.currency})</Label>
                  <Input data-testid="input-original-amount" type="number" step="0.01" value={formData.originalAmount} onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })} required />
                  {ghanaMode && formData.originalAmount && <CurrencyReference amount={formData.originalAmount} className="mt-0.5 block" />}
                </div>
                <div>
                  <Label>{t("creditAccounts.currentBalance")} ({formData.currency})</Label>
                  <Input data-testid="input-current-balance" type="number" step="0.01" value={formData.currentBalance} onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })} required />
                  {ghanaMode && formData.currentBalance && <CurrencyReference amount={formData.currentBalance} className="mt-0.5 block" />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("creditAccounts.interestRate")}</Label><Input data-testid="input-interest-rate" type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} /></div>
                <div>
                  <Label>{t("creditAccounts.currency")}</Label>
                  {ghanaMode ? (
                    <Input data-testid="select-currency" value="GHS — Ghana Cedi (₵)" disabled className="bg-muted" />
                  ) : (
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} ({isFr ? c.nameFr : c.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {ghanaMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Repayment Frequency</Label>
                    <Select value={formData.repaymentFrequency} onValueChange={(v) => setFormData({ ...formData, repaymentFrequency: v })}>
                      <SelectTrigger data-testid="select-repayment-freq"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BOG_REPAYMENT_FREQUENCIES.map(r => (
                          <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Asset Classification (BoG)</Label>
                    <Select value={formData.assetClassification} onValueChange={(v) => setFormData({ ...formData, assetClassification: v })}>
                      <SelectTrigger data-testid="select-asset-class"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BOG_ASSET_CLASSIFICATIONS.map(a => (
                          <SelectItem key={a.code} value={a.code}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("creditAccounts.disbursementDate")}</Label><Input type="date" value={formData.disbursementDate} onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })} /></div>
                <div><Label>{t("creditAccounts.maturityDate")}</Label><Input type="date" value={formData.maturityDate} onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("creditAccounts.collateralType")}</Label>
                  {ghanaMode ? (
                    <Select value={formData.collateralType} onValueChange={(v) => setFormData({ ...formData, collateralType: v })}>
                      <SelectTrigger data-testid="select-collateral-type"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BOG_COLLATERAL_TYPES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={formData.collateralType} onChange={(e) => setFormData({ ...formData, collateralType: e.target.value })} />
                  )}
                </div>
                <div>
                  <Label>{t("creditAccounts.collateralValue")} ({formData.currency})</Label>
                  <Input type="number" step="0.01" value={formData.collateralValue} onChange={(e) => setFormData({ ...formData, collateralValue: e.target.value })} />
                  {ghanaMode && formData.collateralValue && <CurrencyReference amount={formData.collateralValue} className="mt-0.5 block" />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="isInterestFree" checked={formData.isInterestFree} onChange={(e) => setFormData({ ...formData, isInterestFree: e.target.checked })} data-testid="checkbox-interest-free" className="h-4 w-4" />
                  <Label htmlFor="isInterestFree" className="text-sm">{t("creditAccounts.interestFree")}</Label>
                </div>
                <div><Label>{t("creditAccounts.gracePeriod")}</Label><Input data-testid="input-grace-period" type="number" min="0" value={formData.gracePeriodMonths} onChange={(e) => setFormData({ ...formData, gracePeriodMonths: e.target.value })} placeholder={t("creditAccounts.months")} /></div>
                <div><Label>{t("creditAccounts.restructureCount")}</Label><Input data-testid="input-restructure-count" type="number" min="0" value={formData.restructureCount} onChange={(e) => setFormData({ ...formData, restructureCount: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-account">
                {createMutation.isPending ? t("creditAccounts.creating") : t("creditAccounts.createAccount")}
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
          ) : accounts && accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("creditAccounts.account")}</TableHead>
                    <TableHead>{t("creditAccounts.institution")}</TableHead>
                    <TableHead>{t("creditAccounts.type")}</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">{t("creditAccounts.original")}</TableHead>
                    <TableHead className="text-right">{t("creditAccounts.balance")}</TableHead>
                    <TableHead className="text-right">{t("creditAccounts.rate")}</TableHead>
                    <TableHead>{t("creditAccounts.status")}</TableHead>
                    <TableHead className="text-right">{t("creditAccounts.arrearsCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} data-testid={`row-account-${account.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/borrowers/${account.borrowerId}`)}>
                      <TableCell className="font-medium text-sm">{account.accountNumber}</TableCell>
                      <TableCell className="text-sm">{account.lenderInstitution}</TableCell>
                      <TableCell className="text-sm">{account.accountType}</TableCell>
                      <TableCell className="text-sm">
                        {account.creditCategory ? (
                          <Badge variant="outline" className="text-[10px] capitalize" data-testid={`badge-category-${account.id}`}>{account.creditCategory}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(account.originalAmount, account.currency)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(account.currentBalance, account.currency)}</TableCell>
                      <TableCell className="text-right text-sm">{account.interestRate || "—"}%</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(account.status)} className="text-[10px] capitalize">{account.status}</Badge>
                      </TableCell>
                      <TableCell className={`text-right text-sm ${(account.daysInArrears || 0) > 0 ? "text-destructive font-medium" : ""}`}>
                        {account.daysInArrears || 0}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">{t("creditAccounts.noAccounts")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("creditAccounts.noAccountsSub")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
