import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, AlertTriangle, Shield, Globe, Search, FileText,
  TrendingUp, Target, Zap, CheckCircle2, XCircle, Clock,
  ChevronRight, Sparkles, Eye, Activity, RefreshCw,
  Building2, BarChart3, Send, ArrowRight, Loader2,
} from "lucide-react";

function SectionHeader({ icon: Icon, title, badge, description }: { icon: any; title: string; badge?: string; description: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold" data-testid={`section-${title.toLowerCase().replace(/\s/g, "-")}`}>{title}</h2>
            {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function NaturalLanguageSearch() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest("POST", "/api/ai/natural-query", { query: q });
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Query failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
      <CardContent className="p-5">
        <SectionHeader icon={Search} title="Ask Your Data" badge="Natural Language" description="Ask questions about your portfolio in plain English" />
        <div className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "How many borrowers have more than 2 delinquent accounts?"'
            className="flex-1"
            data-testid="input-nl-query"
            onKeyDown={(e) => e.key === "Enter" && query.trim() && mutation.mutate(query)}
          />
          <Button onClick={() => query.trim() && mutation.mutate(query)} disabled={mutation.isPending || !query.trim()} data-testid="button-nl-query">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            "Show me all delinquent borrowers",
            "What is the total outstanding exposure?",
            "Which lender has the highest NPL ratio?",
            "List corporate borrowers with defaults",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => { setQuery(suggestion); mutation.mutate(suggestion); }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              data-testid={`suggestion-${suggestion.slice(0, 20).replace(/\s/g, "-")}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {mutation.data && (
          <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3" data-testid="nl-query-result">
            <p className="text-sm leading-relaxed">{mutation.data.answer}</p>
            {mutation.data.dataPoints?.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {mutation.data.dataPoints.map((dp: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-center">
                    <div className="text-sm font-bold text-primary">{dp.value}</div>
                    <div className="text-[10px] text-muted-foreground">{dp.label}</div>
                  </div>
                ))}
              </div>
            )}
            {mutation.data.matchingEntities?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Matching entities:</p>
                {mutation.data.matchingEntities.slice(0, 10).map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <ChevronRight className="w-3 h-3 text-primary" />
                    <span className="font-medium">{e.name}</span>
                    <span className="text-muted-foreground">{e.detail}</span>
                  </div>
                ))}
              </div>
            )}
            {mutation.data.followUpQuestions?.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground mb-1.5">Follow-up questions:</p>
                <div className="flex flex-wrap gap-1">
                  {mutation.data.followUpQuestions.map((q: string, i: number) => (
                    <button key={i} onClick={() => { setQuery(q); mutation.mutate(q); }}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnomalyDetection() {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/anomaly-detection", {});
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Detection failed", description: e.message, variant: "destructive" }),
  });

  const severityColor = (s: string) => {
    if (s === "critical") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (s === "warning") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={AlertTriangle} title="Smart Alerts & Anomaly Detection" badge="Real-Time" description="AI scans your portfolio for unusual patterns and emerging risks" />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2 mb-4" data-testid="button-detect-anomalies">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {mutation.isPending ? "Scanning Portfolio..." : "Run Anomaly Scan"}
        </Button>
        {mutation.data && (
          <div className="space-y-4" data-testid="anomaly-results">
            <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/50 p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mutation.data.riskScore ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground">Risk Score</div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{mutation.data.summary}</p>
            </div>
            <div className="space-y-2">
              {mutation.data.alerts?.map((alert: any, i: number) => (
                <div key={i} className={`rounded-lg border p-3 ${severityColor(alert.severity)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{alert.severity?.toUpperCase()}</Badge>
                    <Badge variant="outline" className="text-[10px]">{alert.category}</Badge>
                    <span className="text-sm font-semibold">{alert.title}</span>
                  </div>
                  <p className="text-xs opacity-90 mb-1">{alert.description}</p>
                  {alert.recommendedAction && <p className="text-xs font-medium"><ArrowRight className="w-3 h-3 inline mr-1" />{alert.recommendedAction}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegulatoryReportGenerator() {
  const [country, setCountry] = useState("");
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async (c: string) => {
      const res = await apiRequest("POST", "/api/ai/regulatory-report", { country: c });
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Report failed", description: e.message, variant: "destructive" }),
  });

  const countries = ["Ghana", "Nigeria", "Kenya", "South Africa", "Tanzania", "Rwanda", "Uganda", "Sierra Leone", "Senegal", "Ethiopia"];

  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={FileText} title="AI Regulatory Reports" badge="Central Bank Ready" description="Auto-generate country-specific regulatory submissions" />
        <div className="flex gap-2 mb-4">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-48" data-testid="select-reg-country"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => country && mutation.mutate(country)} disabled={mutation.isPending || !country} className="gap-2" data-testid="button-gen-reg-report">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Report
          </Button>
        </div>
        {mutation.data && (
          <div className="space-y-4 rounded-lg border border-border/50 bg-card p-4" data-testid="reg-report-result">
            <div>
              <h3 className="font-bold text-base mb-1">{mutation.data.reportTitle}</h3>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{mutation.data.reportingPeriod}</span>
                <span>|</span>
                <span>{mutation.data.regulatoryBody}</span>
              </div>
            </div>
            {mutation.data.applicableLaws?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mutation.data.applicableLaws.map((law: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{law}</Badge>
                ))}
              </div>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-line">{mutation.data.executiveSummary}</div>
            {mutation.data.portfolioMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(mutation.data.portfolioMetrics).map(([key, val]: [string, any]) => (
                  <div key={key} className="rounded-lg border border-border/50 bg-muted/50 p-2 text-center">
                    <div className="text-sm font-bold text-primary">{String(val)}</div>
                    <div className="text-[10px] text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                  </div>
                ))}
              </div>
            )}
            {mutation.data.complianceStatus?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Compliance Status:</p>
                {mutation.data.complianceStatus.map((cs: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {cs.status === "compliant" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> :
                     cs.status === "non_compliant" ? <XCircle className="w-3.5 h-3.5 text-red-500" /> :
                     <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                    <span className="font-medium">{cs.requirement}</span>
                    <span className="text-muted-foreground">— {cs.detail}</span>
                  </div>
                ))}
              </div>
            )}
            {mutation.data.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Recommendations:</p>
                {mutation.data.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground mb-0.5">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" /><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CrossBorderRisk() {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/cross-border-risk", {});
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Analysis failed", description: e.message, variant: "destructive" }),
  });

  const riskColor = (level: string) => {
    if (level === "critical" || level === "high") return "text-red-500";
    if (level === "medium" || level === "elevated" || level === "moderate") return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={Globe} title="Cross-Border Risk Intelligence" badge="Pan-African" description="Identifies multi-institutional exposure that single-country bureaus miss" />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2 mb-4" data-testid="button-cross-border">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {mutation.isPending ? "Analyzing Exposures..." : "Analyze Cross-Border Risk"}
        </Button>
        {mutation.data && (
          <div className="space-y-4" data-testid="cross-border-results">
            {mutation.data.systemicRisk && (
              <div className="rounded-lg border border-border/50 bg-muted/50 p-3 flex items-center gap-3">
                <Shield className={`w-8 h-8 ${riskColor(mutation.data.systemicRisk.level)}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Systemic Risk:</span>
                    <Badge className={`${riskColor(mutation.data.systemicRisk.level)} text-xs`} variant="outline">
                      {mutation.data.systemicRisk.level?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{mutation.data.systemicRisk.summary}</p>
                </div>
              </div>
            )}
            {mutation.data.crossBorderExposures?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">Cross-Border Exposures:</p>
                <div className="space-y-2">
                  {mutation.data.crossBorderExposures.map((exp: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{exp.borrowerName}</span>
                        <Badge variant="outline" className={`text-[10px] ${riskColor(exp.riskLevel)}`}>{exp.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.concern}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {exp.institutions?.map((inst: string, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{inst}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mutation.data.hiddenExposures && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs font-semibold text-yellow-600 mb-1">Hidden Exposures:</p>
                <p className="text-xs text-muted-foreground">{mutation.data.hiddenExposures}</p>
              </div>
            )}
            {mutation.data.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Recommendations:</p>
                {mutation.data.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground mb-0.5">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" /><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreditNarrativeGenerator() {
  const [borrowerId, setBorrowerId] = useState("");
  const { toast } = useToast();
  const { data: borrowers } = useQuery<any>({ queryKey: ["/api/borrowers?limit=50"] });
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/ai/credit-narrative/${id}`, {});
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Narrative failed", description: e.message, variant: "destructive" }),
  });

  const borrowerList = borrowers?.data || [];

  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={FileText} title="AI Credit Narratives" badge="Loan Committee Ready" description="Generate written credit summaries for bank board presentations" />
        <div className="flex gap-2 mb-4">
          <Select value={borrowerId} onValueChange={setBorrowerId}>
            <SelectTrigger className="w-64" data-testid="select-narrative-borrower"><SelectValue placeholder="Select borrower" /></SelectTrigger>
            <SelectContent>
              {borrowerList.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.borrowerType === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => borrowerId && mutation.mutate(borrowerId)} disabled={mutation.isPending || !borrowerId} className="gap-2" data-testid="button-gen-narrative">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Narrative
          </Button>
        </div>
        {mutation.data && (
          <div className="space-y-4 rounded-lg border border-border/50 bg-card p-4" data-testid="narrative-result">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{mutation.data.borrowerName}</h3>
              <Badge className={
                mutation.data.creditworthiness === "Excellent" || mutation.data.creditworthiness === "Good" ? "bg-green-500/10 text-green-600" :
                mutation.data.creditworthiness === "Fair" ? "bg-yellow-500/10 text-yellow-600" :
                "bg-red-500/10 text-red-600"
              }>{mutation.data.creditworthiness}</Badge>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line">{mutation.data.narrative}</div>
            {(mutation.data.keyStrengths?.length > 0 || mutation.data.keyRisks?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mutation.data.keyStrengths?.length > 0 && (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-xs font-semibold text-green-600 mb-1.5">Strengths</p>
                    {mutation.data.keyStrengths.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {mutation.data.keyRisks?.length > 0 && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs font-semibold text-red-600 mb-1.5">Risks</p>
                    {mutation.data.keyRisks.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" /><span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoanRecommendation() {
  const [borrowerId, setBorrowerId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanType, setLoanType] = useState("");
  const { toast } = useToast();
  const { data: borrowers } = useQuery<any>({ queryKey: ["/api/borrowers?limit=50"] });
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/ai/loan-recommendation/${borrowerId}`, {
        loanAmount, loanType,
      });
      return res.json();
    },
    onError: (e: Error) => toast({ title: "Recommendation failed", description: e.message, variant: "destructive" }),
  });

  const borrowerList = borrowers?.data || [];
  const decisionColor = (d: string) => {
    if (d === "approve") return "bg-green-500/10 text-green-600 border-green-500/30";
    if (d === "approve_with_conditions") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };
  const decisionLabel = (d: string) => {
    if (d === "approve") return "APPROVE";
    if (d === "approve_with_conditions") return "APPROVE WITH CONDITIONS";
    return "DECLINE";
  };

  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={Target} title="Loan Approval Recommendations" badge="Decision Engine" description="AI-powered approve/decline recommendations based on full credit profile" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={borrowerId} onValueChange={setBorrowerId}>
            <SelectTrigger className="w-56" data-testid="select-loan-borrower"><SelectValue placeholder="Select borrower" /></SelectTrigger>
            <SelectContent>
              {borrowerList.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.borrowerType === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="Loan amount"
            type="number"
            className="w-36"
            data-testid="input-loan-amount"
          />
          <Select value={loanType} onValueChange={setLoanType}>
            <SelectTrigger className="w-44" data-testid="select-loan-type"><SelectValue placeholder="Loan type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal_loan">Personal Loan</SelectItem>
              <SelectItem value="business_loan">Business Loan</SelectItem>
              <SelectItem value="mortgage">Mortgage</SelectItem>
              <SelectItem value="agriculture_loan">Agriculture Loan</SelectItem>
              <SelectItem value="trade_finance">Trade Finance</SelectItem>
              <SelectItem value="microfinance">Microfinance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => borrowerId && loanAmount && loanType && mutation.mutate()}
            disabled={mutation.isPending || !borrowerId || !loanAmount || !loanType}
            className="gap-2"
            data-testid="button-loan-recommend"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            Get Recommendation
          </Button>
        </div>
        {mutation.data && (
          <div className="space-y-4" data-testid="loan-recommendation-result">
            <div className={`rounded-xl border-2 p-4 text-center ${decisionColor(mutation.data.decision)}`}>
              <div className="text-2xl font-bold mb-1">{decisionLabel(mutation.data.decision)}</div>
              <div className="text-sm opacity-80">Confidence: {mutation.data.confidence}% | Risk Score: {mutation.data.riskScore}/100</div>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line">{mutation.data.reasoning}</div>
            {mutation.data.suggestedTerms && (
              <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                <p className="text-xs font-semibold mb-2">Suggested Terms:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(mutation.data.suggestedTerms).filter(([, v]) => v !== null && v !== undefined).map(([k, v]: [string, any]) => (
                    <div key={k} className="text-xs">
                      <span className="text-muted-foreground">{k.replace(/([A-Z])/g, " $1").trim()}: </span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mutation.data.conditions?.length > 0 && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs font-semibold text-yellow-600 mb-1">Conditions:</p>
                {mutation.data.conditions.map((c: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" /><span>{c}</span>
                  </div>
                ))}
              </div>
            )}
            {mutation.data.keyFactors?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Key Decision Factors:</p>
                {mutation.data.keyFactors.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {f.impact === "positive" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    <span className="font-medium">{f.factor}</span>
                    <Badge variant="outline" className="text-[9px]">{f.weight}</Badge>
                    <span className="text-muted-foreground">{f.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AICommandCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-yellow-500/20">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title-ai">AI Command Center</h1>
              <p className="text-sm text-muted-foreground">6 AI-powered tools for credit intelligence, risk analysis, and decision support</p>
            </div>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-primary/20 to-yellow-500/20 text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Powered by GPT-4o & Claude
        </Badge>
      </div>

      <NaturalLanguageSearch />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnomalyDetection />
        <CrossBorderRisk />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditNarrativeGenerator />
        <LoanRecommendation />
      </div>

      <RegulatoryReportGenerator />
    </div>
  );
}
