import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, CreditCard } from "lucide-react";
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
import type { CreditAccount, Borrower } from "@shared/schema";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-ET", { style: "decimal", minimumFractionDigits: 2 }).format(num);
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const { data: borrowers } = useQuery<Borrower[]>({
    queryKey: ["/api/borrowers"],
  });

  const [formData, setFormData] = useState({
    borrowerId: "", lenderInstitution: "", accountNumber: "", accountType: "",
    originalAmount: "", currentBalance: "", currency: "ETB",
    interestRate: "", disbursementDate: "", maturityDate: "",
    status: "current" as string, collateralType: "", collateralValue: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/credit-accounts", data);
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
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-accounts-title">Credit Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage loan records across financial institutions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-account">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Credit Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-add-account">
              <div>
                <Label>Borrower</Label>
                <Select value={formData.borrowerId} onValueChange={(v) => setFormData({ ...formData, borrowerId: v })}>
                  <SelectTrigger data-testid="select-borrower"><SelectValue placeholder="Select borrower" /></SelectTrigger>
                  <SelectContent>
                    {borrowers?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`} — {b.nationalId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Lender Institution</Label><Input data-testid="input-lender" value={formData.lenderInstitution} onChange={(e) => setFormData({ ...formData, lenderInstitution: e.target.value })} required /></div>
                <div><Label>Account Number</Label><Input data-testid="input-account-number" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(v) => setFormData({ ...formData, accountType: v })}>
                    <SelectTrigger data-testid="select-account-type"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                      <SelectItem value="Mortgage">Mortgage</SelectItem>
                      <SelectItem value="Vehicle Loan">Vehicle Loan</SelectItem>
                      <SelectItem value="Business Loan">Business Loan</SelectItem>
                      <SelectItem value="Corporate Loan">Corporate Loan</SelectItem>
                      <SelectItem value="Overdraft">Overdraft</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Microfinance">Microfinance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="delinquent">Delinquent</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="restructured">Restructured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Original Amount (ETB)</Label><Input data-testid="input-original-amount" type="number" step="0.01" value={formData.originalAmount} onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })} required /></div>
                <div><Label>Current Balance (ETB)</Label><Input data-testid="input-current-balance" type="number" step="0.01" value={formData.currentBalance} onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Interest Rate (%)</Label><Input data-testid="input-interest-rate" type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} /></div>
                <div>
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Disbursement Date</Label><Input type="date" value={formData.disbursementDate} onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })} /></div>
                <div><Label>Maturity Date</Label><Input type="date" value={formData.maturityDate} onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Collateral Type</Label><Input value={formData.collateralType} onChange={(e) => setFormData({ ...formData, collateralType: e.target.value })} /></div>
                <div><Label>Collateral Value (ETB)</Label><Input type="number" step="0.01" value={formData.collateralValue} onChange={(e) => setFormData({ ...formData, collateralValue: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-account">
                {createMutation.isPending ? "Creating..." : "Create Account"}
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
                    <TableHead>Account</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Original</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Arrears</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                      <TableCell className="font-medium text-sm">{account.accountNumber}</TableCell>
                      <TableCell className="text-sm">{account.lenderInstitution}</TableCell>
                      <TableCell className="text-sm">{account.accountType}</TableCell>
                      <TableCell className="text-right text-sm">{account.currency} {formatCurrency(account.originalAmount)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{account.currency} {formatCurrency(account.currentBalance)}</TableCell>
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
              <h3 className="font-semibold">No credit accounts</h3>
              <p className="text-sm text-muted-foreground mt-1">Add a credit account to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
