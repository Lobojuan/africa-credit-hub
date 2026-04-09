import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function getRatingColor(rating: string) {
  if (["AAA", "AA", "A"].includes(rating)) return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
  if (rating === "BBB") return "bg-amber-500/10 text-amber-600 border-amber-200";
  if (["BB", "B"].includes(rating)) return "bg-orange-500/10 text-orange-600 border-orange-200";
  return "bg-red-500/10 text-red-600 border-red-200";
}

export function EsgScoreCard({ borrowerId }: { borrowerId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    hasEnvironmentalPolicy: false, wasteManagementScore: "0", energyEfficiencyScore: "0",
    carbonFootprintReported: false, employeeWelfareScore: "0", communityEngagementScore: "0",
    genderDiversityScore: "0", healthSafetyCompliance: false, boardIndependenceScore: "0",
    antiCorruptionPolicy: false, auditedFinancials: false, taxComplianceScore: "0", notes: "",
  });

  const { data: esgData, isLoading } = useQuery<any>({
    queryKey: ["/api/esg", borrowerId],
    queryFn: async () => { const res = await fetch(`/api/esg/${borrowerId}`); return res.json(); },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/esg", {
        borrowerId,
        hasEnvironmentalPolicy: form.hasEnvironmentalPolicy,
        wasteManagementScore: parseInt(form.wasteManagementScore) || 0,
        energyEfficiencyScore: parseInt(form.energyEfficiencyScore) || 0,
        carbonFootprintReported: form.carbonFootprintReported,
        employeeWelfareScore: parseInt(form.employeeWelfareScore) || 0,
        communityEngagementScore: parseInt(form.communityEngagementScore) || 0,
        genderDiversityScore: parseInt(form.genderDiversityScore) || 0,
        healthSafetyCompliance: form.healthSafetyCompliance,
        boardIndependenceScore: parseInt(form.boardIndependenceScore) || 0,
        antiCorruptionPolicy: form.antiCorruptionPolicy,
        auditedFinancials: form.auditedFinancials,
        taxComplianceScore: parseInt(form.taxComplianceScore) || 0,
        notes: form.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "ESG assessment saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/esg", borrowerId] });
      setOpen(false);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card data-testid="card-esg-score">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="font-semibold text-sm">ESG Score</span>
              <p className="text-xs text-muted-foreground">Environmental &middot; Social &middot; Governance</p>
            </div>
          </div>
          {esgData?.esgRating && (
            <Badge variant="outline" className={getRatingColor(esgData.esgRating)} data-testid="badge-esg-rating">
              {esgData.esgRating}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !esgData ? (
          <p className="text-sm text-muted-foreground">No ESG assessment on record</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span>Environmental</span><span className="font-medium">{esgData.environmentalScore}/100</span></div>
              <Progress value={esgData.environmentalScore} className="h-2" />
              <div className="flex justify-between text-xs"><span>Social</span><span className="font-medium">{esgData.socialScore}/100</span></div>
              <Progress value={esgData.socialScore} className="h-2" />
              <div className="flex justify-between text-xs"><span>Governance</span><span className="font-medium">{esgData.governanceScore}/100</span></div>
              <Progress value={esgData.governanceScore} className="h-2" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Total: {esgData.totalEsgScore}/100</span>
              {esgData.assessedAt && <span>Assessed: {new Date(esgData.assessedAt).toLocaleDateString()}</span>}
            </div>
          </>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full" data-testid="button-add-esg">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Conduct ESG Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>ESG Assessment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">Environmental</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.hasEnvironmentalPolicy} onCheckedChange={v => setForm(f => ({ ...f, hasEnvironmentalPolicy: v === true }))} id="esg-env-policy" />
                    <label htmlFor="esg-env-policy" className="text-sm">Has formal environmental policy</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.carbonFootprintReported} onCheckedChange={v => setForm(f => ({ ...f, carbonFootprintReported: v === true }))} id="esg-carbon" />
                    <label htmlFor="esg-carbon" className="text-sm">Carbon footprint measured & reported</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Waste Management (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.wasteManagementScore} onChange={e => setForm(f => ({ ...f, wasteManagementScore: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Energy Efficiency (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.energyEfficiencyScore} onChange={e => setForm(f => ({ ...f, energyEfficiencyScore: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">Social</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.healthSafetyCompliance} onCheckedChange={v => setForm(f => ({ ...f, healthSafetyCompliance: v === true }))} id="esg-safety" />
                    <label htmlFor="esg-safety" className="text-sm">Health & safety certified</label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Employee Welfare (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.employeeWelfareScore} onChange={e => setForm(f => ({ ...f, employeeWelfareScore: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Community (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.communityEngagementScore} onChange={e => setForm(f => ({ ...f, communityEngagementScore: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Gender Diversity (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.genderDiversityScore} onChange={e => setForm(f => ({ ...f, genderDiversityScore: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">Governance</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.antiCorruptionPolicy} onCheckedChange={v => setForm(f => ({ ...f, antiCorruptionPolicy: v === true }))} id="esg-corruption" />
                    <label htmlFor="esg-corruption" className="text-sm">Has anti-corruption policy</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.auditedFinancials} onCheckedChange={v => setForm(f => ({ ...f, auditedFinancials: v === true }))} id="esg-audit" />
                    <label htmlFor="esg-audit" className="text-sm">Financials independently audited</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Board Independence (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.boardIndependenceScore} onChange={e => setForm(f => ({ ...f, boardIndependenceScore: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Tax Compliance (0-10)</label>
                      <Input type="number" min="0" max="10" value={form.taxComplianceScore} onChange={e => setForm(f => ({ ...f, taxComplianceScore: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full"
                data-testid="button-submit-esg"
              >
                {mutation.isPending ? "Saving..." : "Save ESG Assessment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
