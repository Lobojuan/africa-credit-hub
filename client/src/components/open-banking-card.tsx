import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Banknote, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DATA_SOURCES = [
  // West Africa — Mobile Money
  "MTN Mobile Money", "Airtel Money", "Vodafone Cash", "Tigo Cash",
  // East Africa — Mobile Money
  "M-Pesa (Kenya/Tanzania)", "Airtel Money (EA)", "T-Kash (Telkom Kenya)",
  // Francophone / West Africa
  "Orange Money", "Wave (Senegal/CI)", "Moov Money", "Free Money",
  // Pan-African Fintechs
  "Flutterwave", "Chipper Cash", "Nala", "Cellulant",
  // East Africa — Banks & Payments
  "Pesalink (Kenya)", "Equity Bank", "Co-operative Bank", "KCB Bank",
  // West Africa — Banks
  "GCB Bank", "Ecobank", "Stanbic Bank", "Fidelity Bank Ghana",
  "Access Bank", "First Bank Nigeria", "GTBank", "Zenith Bank", "UBA",
  // Southern Africa
  "Standard Bank", "ABSA", "Capitec", "FNB South Africa",
  // Other
  "Other",
];

function getScoreBadge(score: number) {
  if (score >= 71) return { label: "Strong", variant: "default" as const, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
  if (score >= 41) return { label: "Moderate", variant: "outline" as const, className: "bg-amber-500/10 text-amber-600 border-amber-200" };
  return { label: "High Risk", variant: "destructive" as const, className: "bg-red-500/10 text-red-600 border-red-200" };
}

export function OpenBankingCard({ borrowerId }: { borrowerId: string; borrowerType?: "individual" | "corporate" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dataSource: "", avgMonthlyInflow: "", avgMonthlyOutflow: "",
    monthsOfData: "6", regularIncomeStreams: "1", gamblingTransactions: "0",
    nsfEvents: "0", salaryCreditsDetected: false, rentPaymentsDetected: false,
    utilityPaymentsDetected: false, consentReference: "",
  });

  const { data: profiles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/open-banking", borrowerId],
    queryFn: async () => { const res = await fetch(`/api/open-banking/${borrowerId}`); return res.json(); },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/open-banking", {
        borrowerId,
        dataSource: form.dataSource,
        avgMonthlyInflow: form.avgMonthlyInflow,
        avgMonthlyOutflow: form.avgMonthlyOutflow,
        monthsOfData: parseInt(form.monthsOfData) || 6,
        regularIncomeStreams: parseInt(form.regularIncomeStreams) || 0,
        gamblingTransactions: parseInt(form.gamblingTransactions) || 0,
        nsfEvents: parseInt(form.nsfEvents) || 0,
        salaryCreditsDetected: form.salaryCreditsDetected,
        rentPaymentsDetected: form.rentPaymentsDetected,
        utilityPaymentsDetected: form.utilityPaymentsDetected,
        consentReference: form.consentReference || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Open banking data added" });
      queryClient.invalidateQueries({ queryKey: ["/api/open-banking", borrowerId] });
      setOpen(false);
      setForm({ dataSource: "", avgMonthlyInflow: "", avgMonthlyOutflow: "", monthsOfData: "6", regularIncomeStreams: "1", gamblingTransactions: "0", nsfEvents: "0", salaryCreditsDetected: false, rentPaymentsDetected: false, utilityPaymentsDetected: false, consentReference: "" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const latest = profiles[0];

  return (
    <Card data-testid="card-open-banking">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            <div>
              <span className="font-semibold text-sm">Open Banking & Mobile Money</span>
              <p className="text-xs text-muted-foreground">Alternative financial data</p>
            </div>
          </div>
          {latest && (() => {
            const badge = getScoreBadge(latest.openBankingScore || 0);
            return <Badge variant={badge.variant} className={badge.className}>{badge.label} ({latest.openBankingScore})</Badge>;
          })()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open banking data on record</p>
        ) : (
          <>
            {latest && (
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Source</span><p className="font-medium">{latest.dataSource}</p></div>
                <div><span className="text-muted-foreground">Avg Inflow</span><p className="font-medium">GHS {Number(latest.avgMonthlyInflow || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Avg Outflow</span><p className="font-medium">GHS {Number(latest.avgMonthlyOutflow || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Months</span><p className="font-medium">{latest.monthsOfData || 0}</p></div>
              </div>
            )}
            {profiles.length > 1 && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Score</TableHead>
                  <TableHead className="text-xs">Inflow</TableHead>
                  <TableHead className="text-xs">Outflow</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {profiles.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-xs">{p.dataSource}</TableCell>
                      <TableCell className="text-xs">{p.openBankingScore}</TableCell>
                      <TableCell className="text-xs">GHS {Number(p.avgMonthlyInflow || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">GHS {Number(p.avgMonthlyOutflow || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full" data-testid="button-add-open-banking">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Open Banking Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Open Banking Data</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Data Source</label>
                <Select value={form.dataSource} onValueChange={v => setForm(f => ({ ...f, dataSource: v }))}>
                  <SelectTrigger data-testid="select-ob-source"><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>{DATA_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Avg Monthly Inflow</label>
                  <Input type="number" value={form.avgMonthlyInflow} onChange={e => setForm(f => ({ ...f, avgMonthlyInflow: e.target.value }))} data-testid="input-ob-inflow" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Avg Monthly Outflow</label>
                  <Input type="number" value={form.avgMonthlyOutflow} onChange={e => setForm(f => ({ ...f, avgMonthlyOutflow: e.target.value }))} data-testid="input-ob-outflow" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Months</label>
                  <Input type="number" min="1" max="24" value={form.monthsOfData} onChange={e => setForm(f => ({ ...f, monthsOfData: e.target.value }))} data-testid="input-ob-months" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Income Streams</label>
                  <Input type="number" value={form.regularIncomeStreams} onChange={e => setForm(f => ({ ...f, regularIncomeStreams: e.target.value }))} data-testid="input-ob-streams" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Gambling Txns</label>
                  <Input type="number" value={form.gamblingTransactions} onChange={e => setForm(f => ({ ...f, gamblingTransactions: e.target.value }))} data-testid="input-ob-gambling" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">NSF Events</label>
                <Input type="number" value={form.nsfEvents} onChange={e => setForm(f => ({ ...f, nsfEvents: e.target.value }))} data-testid="input-ob-nsf" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.salaryCreditsDetected} onCheckedChange={v => setForm(f => ({ ...f, salaryCreditsDetected: v === true }))} id="ob-salary" />
                  <label htmlFor="ob-salary" className="text-sm">Salary credits detected</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.rentPaymentsDetected} onCheckedChange={v => setForm(f => ({ ...f, rentPaymentsDetected: v === true }))} id="ob-rent" />
                  <label htmlFor="ob-rent" className="text-sm">Rent payments detected</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.utilityPaymentsDetected} onCheckedChange={v => setForm(f => ({ ...f, utilityPaymentsDetected: v === true }))} id="ob-utility" />
                  <label htmlFor="ob-utility" className="text-sm">Utility payments detected</label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Consent Reference (optional)</label>
                <Input value={form.consentReference} onChange={e => setForm(f => ({ ...f, consentReference: e.target.value }))} data-testid="input-ob-consent" />
              </div>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !form.dataSource || !form.avgMonthlyInflow}
                className="w-full"
                data-testid="button-submit-open-banking"
              >
                {mutation.isPending ? "Saving..." : "Save Open Banking Data"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
