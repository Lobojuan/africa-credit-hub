import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Cpu, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function DecisionEnginePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  const [evalResult, setEvalResult] = useState<any>(null);

  const [newRule, setNewRule] = useState({
    ruleName: "", description: "", outcome: "refer", priority: "1",
    minCreditScore: "", maxDaysInArrears: "", maxActiveAccounts: "",
    minMonthlyIncome: "", maxDebtToIncomeRatio: "",
    excludePep: true, excludeActiveJudgments: true, excludeDishonouredCheques: false,
  });

  const { data: rules = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/decision-rules"] });

  const { data: searchResults = [] } = useQuery<any[]>({
    queryKey: ["/api/borrowers", { search: searchTerm }],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const res = await fetch(`/api/borrowers?search=${encodeURIComponent(searchTerm)}&limit=5`);
      return res.json();
    },
    enabled: searchTerm.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/decision-rules", {
        ...newRule,
        priority: parseInt(newRule.priority) || 1,
        minCreditScore: newRule.minCreditScore ? parseInt(newRule.minCreditScore) : null,
        maxDaysInArrears: newRule.maxDaysInArrears ? parseInt(newRule.maxDaysInArrears) : null,
        maxActiveAccounts: newRule.maxActiveAccounts ? parseInt(newRule.maxActiveAccounts) : null,
        minMonthlyIncome: newRule.minMonthlyIncome || null,
        maxDebtToIncomeRatio: newRule.maxDebtToIncomeRatio || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rule created" });
      queryClient.invalidateQueries({ queryKey: ["/api/decision-rules"] });
      setDialogOpen(false);
      setNewRule({ ruleName: "", description: "", outcome: "refer", priority: "1", minCreditScore: "", maxDaysInArrears: "", maxActiveAccounts: "", minMonthlyIncome: "", maxDebtToIncomeRatio: "", excludePep: true, excludeActiveJudgments: true, excludeDishonouredCheques: false });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/decision-rules/${id}`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/decision-rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/decision-rules/${id}`); },
    onSuccess: () => {
      toast({ title: "Rule deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/decision-rules"] });
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (borrowerId: string) => {
      const res = await apiRequest("POST", "/api/decision-rules/evaluate", { borrowerId });
      return res.json();
    },
    onSuccess: (data) => setEvalResult(data),
    onError: (err: Error) => toast({ title: "Evaluation failed", description: err.message, variant: "destructive" }),
  });

  const outcomeBadge = (outcome: string) => {
    if (outcome === "approve") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200" data-testid="badge-outcome-approve">Approve</Badge>;
    if (outcome === "decline") return <Badge variant="destructive" data-testid="badge-outcome-decline">Decline</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200" data-testid="badge-outcome-refer">Refer</Badge>;
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6" data-testid="page-decision-engine">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-decision-title">
          <Cpu className="w-6 h-6" /> Decision Rules Engine
        </h1>
        <p className="text-sm text-muted-foreground">Configure automated credit decision thresholds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Rules</h2>
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-new-rule"><Plus className="w-4 h-4 mr-1" /> New Rule</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Decision Rule</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Rule Name *</label>
                      <Input value={newRule.ruleName} onChange={e => setNewRule(r => ({ ...r, ruleName: e.target.value }))} data-testid="input-rule-name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Outcome</label>
                        <Select value={newRule.outcome} onValueChange={v => setNewRule(r => ({ ...r, outcome: v }))}>
                          <SelectTrigger data-testid="select-rule-outcome"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approve">Approve</SelectItem>
                            <SelectItem value="refer">Refer</SelectItem>
                            <SelectItem value="decline">Decline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priority (1-10)</label>
                        <Input type="number" min="1" max="10" value={newRule.priority} onChange={e => setNewRule(r => ({ ...r, priority: e.target.value }))} data-testid="input-rule-priority" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Min Credit Score</label>
                        <Input type="number" value={newRule.minCreditScore} onChange={e => setNewRule(r => ({ ...r, minCreditScore: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Max Days in Arrears</label>
                        <Input type="number" value={newRule.maxDaysInArrears} onChange={e => setNewRule(r => ({ ...r, maxDaysInArrears: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Max Active Accts</label>
                        <Input type="number" value={newRule.maxActiveAccounts} onChange={e => setNewRule(r => ({ ...r, maxActiveAccounts: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Min Income</label>
                        <Input type="number" value={newRule.minMonthlyIncome} onChange={e => setNewRule(r => ({ ...r, minMonthlyIncome: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Max DTI Ratio</label>
                        <Input type="number" step="0.01" value={newRule.maxDebtToIncomeRatio} onChange={e => setNewRule(r => ({ ...r, maxDebtToIncomeRatio: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={newRule.excludePep} onCheckedChange={v => setNewRule(r => ({ ...r, excludePep: v === true }))} id="rule-pep" />
                        <label htmlFor="rule-pep" className="text-sm">Exclude PEP borrowers</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={newRule.excludeActiveJudgments} onCheckedChange={v => setNewRule(r => ({ ...r, excludeActiveJudgments: v === true }))} id="rule-judgments" />
                        <label htmlFor="rule-judgments" className="text-sm">Exclude active judgments</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={newRule.excludeDishonouredCheques} onCheckedChange={v => setNewRule(r => ({ ...r, excludeDishonouredCheques: v === true }))} id="rule-cheques" />
                        <label htmlFor="rule-cheques" className="text-sm">Exclude dishonoured cheques</label>
                      </div>
                    </div>
                    <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newRule.ruleName} className="w-full" data-testid="button-submit-rule">
                      {createMutation.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading rules...</div>
          ) : rules.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No rules configured yet. Create your first rule to get started.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{rule.ruleName}</span>
                          <Badge variant="outline" className="text-[10px]">P{rule.priority}</Badge>
                          {outcomeBadge(rule.outcome)}
                        </div>
                        {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                          data-testid={`switch-rule-${rule.id}`}
                        />
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { if (confirm("Delete this rule?")) deleteMutation.mutate(rule.id); }}
                          data-testid={`button-delete-rule-${rule.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Evaluate a Borrower</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setSelectedBorrower(null); setEvalResult(null); }}
                  data-testid="input-evaluate-search"
                />
                <Button variant="outline" size="icon" data-testid="button-evaluate-search"><Search className="w-4 h-4" /></Button>
              </div>

              {searchResults.length > 0 && !selectedBorrower && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {(Array.isArray(searchResults) ? searchResults : []).map((b: any) => (
                    <button
                      key={b.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => { setSelectedBorrower(b); setSearchTerm(""); }}
                      data-testid={`button-select-borrower-${b.id}`}
                    >
                      {b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName} — {b.nationalId || b.registrationNumber || ""}
                    </button>
                  ))}
                </div>
              )}

              {selectedBorrower && (
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-sm font-medium" data-testid="text-selected-borrower">
                    {selectedBorrower.type === "individual" ? `${selectedBorrower.firstName} ${selectedBorrower.lastName}` : selectedBorrower.companyName}
                  </p>
                  <Button
                    size="sm" className="mt-2 w-full"
                    onClick={() => evaluateMutation.mutate(selectedBorrower.id)}
                    disabled={evaluateMutation.isPending}
                    data-testid="button-run-decision"
                  >
                    {evaluateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Cpu className="w-4 h-4 mr-1" />}
                    Run Decision
                  </Button>
                </div>
              )}

              {evalResult && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl text-center ${
                    evalResult.outcome === "approve" ? "bg-emerald-500/10 border border-emerald-200" :
                    evalResult.outcome === "decline" ? "bg-red-500/10 border border-red-200" :
                    "bg-amber-500/10 border border-amber-200"
                  }`} data-testid="card-eval-result">
                    {evalResult.outcome === "approve" && <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />}
                    {evalResult.outcome === "refer" && <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />}
                    {evalResult.outcome === "decline" && <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />}
                    <p className="font-bold text-lg uppercase" data-testid="text-eval-outcome">
                      {evalResult.outcome === "approve" ? "APPROVED" : evalResult.outcome === "decline" ? "DECLINED" : "REFER FOR REVIEW"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{evalResult.borrowerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Matched Rule</span><p className="font-medium">{evalResult.matchedRule}</p></div>
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Credit Score</span><p className="font-medium">{evalResult.creditScore}</p></div>
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Max Arrears</span><p className="font-medium">{evalResult.maxDaysInArrears} days</p></div>
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Active Accounts</span><p className="font-medium">{evalResult.activeAccounts}</p></div>
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">DTI Ratio</span><p className="font-medium">{evalResult.debtToIncomeRatio}</p></div>
                    <div className="p-2 rounded bg-muted/30"><span className="text-muted-foreground">Monthly Income</span><p className="font-medium">GHS {Number(evalResult.monthlyIncome || 0).toLocaleString()}</p></div>
                    {evalResult.hasActiveJudgment && <div className="p-2 rounded bg-red-500/10 col-span-2"><span className="text-red-600 font-medium">Active Court Judgment</span></div>}
                    {evalResult.hasDishonouredCheque && <div className="p-2 rounded bg-red-500/10 col-span-2"><span className="text-red-600 font-medium">Dishonoured Cheque on File</span></div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
