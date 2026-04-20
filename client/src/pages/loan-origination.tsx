import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, CheckCircle, XCircle, Send, Calendar, DollarSign, Clock, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";

type LoanStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "disbursed" | "withdrawn";

const STATUS_COLORS: Record<LoanStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-purple-100 text-purple-700",
  withdrawn: "bg-slate-100 text-slate-700",
};

function formatCurrency(amount: string | number | null, currency = "GHS") {
  if (!amount) return "—";
  return `${currency} ${Number(amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function NewApplicationDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    borrowerId: "",
    loanType: "personal",
    purpose: "",
    requestedAmount: "",
    currency: "GHS",
    termMonths: "12",
    repaymentFrequency: "monthly",
    collateralType: "",
    collateralDescription: "",
    collateralValue: "",
    notes: "",
  });

  const { data: borrowers = [] } = useQuery<any[]>({ queryKey: ["/api/borrowers-list"] });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/loan-applications", data),
    onSuccess: () => {
      toast({ title: "Application submitted", description: "Loan application created successfully." });
      setOpen(false);
      onSuccess();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.borrowerId || !form.purpose || !form.requestedAmount) {
      toast({ title: "Validation", description: "Borrower, purpose, and requested amount are required.", variant: "destructive" });
      return;
    }
    mutation.mutate({ ...form, termMonths: parseInt(form.termMonths), requestedAmount: form.requestedAmount });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-new-loan-application" className="gap-2">
          <Plus className="w-4 h-4" /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Borrower ID</Label>
            <Input data-testid="input-borrower-id" placeholder="Enter borrower ID" value={form.borrowerId} onChange={e => setForm(f => ({ ...f, borrowerId: e.target.value }))} />
          </div>
          <div>
            <Label>Loan Type</Label>
            <Select value={form.loanType} onValueChange={v => setForm(f => ({ ...f, loanType: v }))}>
              <SelectTrigger data-testid="select-loan-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="mortgage">Mortgage</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="agri">Agricultural</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="microfinance">Microfinance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GHS">GHS — Ghanaian Cedi</SelectItem>
                <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Requested Amount</Label>
            <Input data-testid="input-requested-amount" type="number" placeholder="0.00" value={form.requestedAmount} onChange={e => setForm(f => ({ ...f, requestedAmount: e.target.value }))} />
          </div>
          <div>
            <Label>Term (months)</Label>
            <Input data-testid="input-term-months" type="number" min="1" max="360" value={form.termMonths} onChange={e => setForm(f => ({ ...f, termMonths: e.target.value }))} />
          </div>
          <div>
            <Label>Repayment Frequency</Label>
            <Select value={form.repaymentFrequency} onValueChange={v => setForm(f => ({ ...f, repaymentFrequency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Collateral Type (optional)</Label>
            <Select value={form.collateralType} onValueChange={v => setForm(f => ({ ...f, collateralType: v }))}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="securities">Securities</SelectItem>
                <SelectItem value="guarantor">Guarantor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.collateralType && (
            <div>
              <Label>Collateral Value</Label>
              <Input type="number" placeholder="0.00" value={form.collateralValue} onChange={e => setForm(f => ({ ...f, collateralValue: e.target.value }))} />
            </div>
          )}
          <div className="col-span-2">
            <Label>Purpose</Label>
            <Textarea data-testid="input-purpose" placeholder="Describe the purpose of this loan..." value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          </div>
          {form.collateralType && (
            <div className="col-span-2">
              <Label>Collateral Description</Label>
              <Textarea placeholder="Describe the collateral..." value={form.collateralDescription} onChange={e => setForm(f => ({ ...f, collateralDescription: e.target.value }))} />
            </div>
          )}
          <div className="col-span-2">
            <Label>Internal Notes</Label>
            <Textarea placeholder="Any internal notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="btn-submit-loan" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoanDetailDialog({ loan, onAction }: { loan: any; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [approvalForm, setApprovalForm] = useState({ approvedAmount: "", interestRate: "", notes: "" });
  const [rejectNotes, setRejectNotes] = useState("");

  const { data: schedule = [] } = useQuery<any[]>({
    queryKey: ["/api/loan-applications", loan.id, "schedule"],
    queryFn: () => fetch(`/api/loan-applications/${loan.id}/schedule`, { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/loan-applications/${loan.id}/approve`, data),
    onSuccess: () => { toast({ title: "Approved" }); setOpen(false); onAction(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/loan-applications/${loan.id}/reject`, { notes: rejectNotes }),
    onSuccess: () => { toast({ title: "Rejected" }); setOpen(false); onAction(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const disburseMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/loan-applications/${loan.id}/disburse`, {}),
    onSuccess: () => { toast({ title: "Disbursed!" }); setOpen(false); onAction(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const schedMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/loan-applications/${loan.id}/schedule`, {}),
    onSuccess: () => { toast({ title: "Schedule generated" }); queryClient.invalidateQueries({ queryKey: ["/api/loan-applications", loan.id, "schedule"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`btn-view-loan-${loan.id}`}>{loan.applicationNumber}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {loan.applicationNumber}
            <Badge className={`ml-2 ${STATUS_COLORS[loan.status as LoanStatus] || ""}`}>{loan.status.replace("_", " ")}</Badge>
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
            {["submitted", "under_review"].includes(loan.status) && <TabsTrigger value="approve">Review</TabsTrigger>}
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Borrower ID</span><p className="font-medium">{loan.borrowerId}</p></div>
              <div><span className="text-muted-foreground">Loan Type</span><p className="font-medium capitalize">{loan.loanType}</p></div>
              <div><span className="text-muted-foreground">Requested</span><p className="font-medium">{formatCurrency(loan.requestedAmount, loan.currency)}</p></div>
              <div><span className="text-muted-foreground">Approved</span><p className="font-medium">{loan.approvedAmount ? formatCurrency(loan.approvedAmount, loan.currency) : "—"}</p></div>
              <div><span className="text-muted-foreground">Term</span><p className="font-medium">{loan.termMonths} months</p></div>
              <div><span className="text-muted-foreground">Interest Rate</span><p className="font-medium">{loan.interestRate ? `${(Number(loan.interestRate) * 100).toFixed(2)}% p.a.` : "—"}</p></div>
              <div><span className="text-muted-foreground">Frequency</span><p className="font-medium capitalize">{loan.repaymentFrequency}</p></div>
              <div><span className="text-muted-foreground">Collateral</span><p className="font-medium">{loan.collateralType || "None"}</p></div>
              {loan.collateralValue && <div><span className="text-muted-foreground">Collateral Value</span><p className="font-medium">{formatCurrency(loan.collateralValue, loan.currency)}</p></div>}
              <div className="col-span-2"><span className="text-muted-foreground">Purpose</span><p className="font-medium">{loan.purpose}</p></div>
              {loan.checkerNotes && <div className="col-span-2"><span className="text-muted-foreground">Review Notes</span><p className="font-medium">{loan.checkerNotes}</p></div>}
              {loan.disbursedAt && <div><span className="text-muted-foreground">Disbursed At</span><p className="font-medium">{format(new Date(loan.disbursedAt), "dd MMM yyyy HH:mm")}</p></div>}
              {loan.disbursementReference && <div><span className="text-muted-foreground">Disburse Ref</span><p className="font-medium">{loan.disbursementReference}</p></div>}
            </div>
            {loan.status === "approved" && (
              <div className="pt-2">
                <Button data-testid="btn-disburse" onClick={() => disburseMutation.mutate()} disabled={disburseMutation.isPending} className="gap-2">
                  <Send className="w-4 h-4" /> {disburseMutation.isPending ? "Processing..." : "Mark as Disbursed"}
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="schedule" className="space-y-3">
            {schedule.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No schedule generated yet.</p>
                {["approved", "disbursed"].includes(loan.status) && (
                  <Button data-testid="btn-generate-schedule" onClick={() => schedMutation.mutate()} disabled={schedMutation.isPending}>
                    {schedMutation.isPending ? "Generating..." : "Generate Schedule"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row: any) => (
                      <TableRow key={row.id} data-testid={`row-schedule-${row.id}`}>
                        <TableCell>{row.installmentNumber}</TableCell>
                        <TableCell>{row.dueDate}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.principalAmount, loan.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interestAmount, loan.currency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount, loan.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "paid" ? "default" : "secondary"}>{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          {["submitted", "under_review"].includes(loan.status) && (
            <TabsContent value="approve" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Approved Amount</Label>
                  <Input type="number" placeholder={loan.requestedAmount} value={approvalForm.approvedAmount} onChange={e => setApprovalForm(f => ({ ...f, approvedAmount: e.target.value }))} />
                </div>
                <div>
                  <Label>Annual Interest Rate (decimal, e.g. 0.18 = 18%)</Label>
                  <Input type="number" step="0.001" placeholder="0.18" value={approvalForm.interestRate} onChange={e => setApprovalForm(f => ({ ...f, interestRate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Approval Notes</Label>
                  <Textarea value={approvalForm.notes} onChange={e => setApprovalForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button data-testid="btn-approve-loan" onClick={() => approveMutation.mutate(approvalForm)} disabled={approveMutation.isPending} className="gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button variant="destructive" data-testid="btn-reject-loan" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} className="gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
              <div>
                <Label>Rejection Reason (if rejecting)</Label>
                <Textarea placeholder="State the reason for rejection..." value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function LoanOriginationPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: loans = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/loan-applications", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/loan-applications?${params}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const stats = {
    total: loans.length,
    submitted: loans.filter(l => l.status === "submitted").length,
    approved: loans.filter(l => l.status === "approved").length,
    disbursed: loans.filter(l => l.status === "disbursed").length,
    totalDisbursed: loans.filter(l => l.status === "disbursed").reduce((s, l) => s + Number(l.approvedAmount || l.requestedAmount || 0), 0),
  };

  const filtered = loans.filter(l =>
    !search || l.applicationNumber.toLowerCase().includes(search.toLowerCase()) || l.borrowerId.toLowerCase().includes(search.toLowerCase()) || l.loanType.includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loan Origination</h1>
          <p className="text-muted-foreground">Full loan lifecycle — application, approval, disbursement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="btn-refresh-loans"><RefreshCw className="w-4 h-4" /></Button>
          <NewApplicationDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/loan-applications"] })} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.disbursed}</div>
            <div className="text-sm text-muted-foreground">Disbursed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input data-testid="input-search-loans" placeholder="Search by app number, borrower..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" data-testid="select-status-filter"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No loan applications found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application #</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((loan: any) => (
                    <TableRow key={loan.id} data-testid={`row-loan-${loan.id}`}>
                      <TableCell className="font-mono text-sm">
                        <LoanDetailDialog loan={loan} onAction={() => queryClient.invalidateQueries({ queryKey: ["/api/loan-applications"] })} />
                      </TableCell>
                      <TableCell className="text-sm">{loan.borrowerId.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize text-sm">{loan.loanType}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(loan.requestedAmount, loan.currency)}</TableCell>
                      <TableCell className="text-right text-sm">{loan.approvedAmount ? formatCurrency(loan.approvedAmount, loan.currency) : "—"}</TableCell>
                      <TableCell className="text-sm">{loan.termMonths}m</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[loan.status as LoanStatus] || ""}`}>{loan.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {loan.createdAt ? format(new Date(loan.createdAt), "dd MMM yy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
