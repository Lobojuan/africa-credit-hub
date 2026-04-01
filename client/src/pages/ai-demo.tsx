import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight, ArrowLeft, Brain, FileText, AlertTriangle, Globe2, Search,
  Shield, Zap, Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp,
  Building2, User, Briefcase, BadgeCheck, Clock, Sparkles, Mail, Phone,
  Database, Lock, ChevronRight, Edit3
} from "lucide-react";

function AIDemoPage() {
  const [, navigate] = useLocation();
  const brandColors = useBrandColors();
  const [activeTab, setActiveTab] = useState("credit-narrative");
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [results, setResults] = useState<Record<string, any>>({});
  const [borrowerScenario, setBorrowerScenario] = useState("strong");
  const [queryText, setQueryText] = useState("");
  const [country, setCountry] = useState("Ghana");
  const [loanAmount, setLoanAmount] = useState("50000");
  const [loanType, setLoanType] = useState("business_expansion");
  const [featuresTriedCount, setFeaturesTriedCount] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const [useOwnData, setUseOwnData] = useState(false);
  const [customBorrower, setCustomBorrower] = useState("");
  const [customPortfolio, setCustomPortfolio] = useState("");

  const AI_STEPS: Record<string, string[]> = {
    "credit-narrative": ["Parsing borrower profile...", "Analyzing credit history...", "Assessing risk factors...", "Generating narrative report..."],
    "anomaly-detection": ["Loading portfolio data...", "Scanning transaction patterns...", "Running anomaly models...", "Compiling alerts..."],
    "regulatory-report": ["Extracting compliance data...", "Mapping to regulatory framework...", "Generating report sections...", "Finalizing export..."],
    "natural-query": ["Interpreting your question...", "Querying credit data...", "Analyzing results...", "Composing answer..."],
    "cross-border-risk": ["Mapping cross-border exposures...", "Analyzing currency risks...", "Evaluating regulatory gaps...", "Scoring systemic risk..."],
    "loan-recommendation": ["Reviewing application data...", "Running credit models...", "Calculating risk scores...", "Generating recommendation..."],
  };

  useEffect(() => {
    if (!loading) {
      setLoadingProgress(0);
      setLoadingStep("");
      setLoadingStartTime(null);
      return;
    }
    setLoadingStartTime(Date.now());
    setLoadingProgress(0);
    const steps = AI_STEPS[loading] || ["Processing..."];
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const speed = prev < 30 ? (Math.random() * 2.5 + 1) :
                      prev < 60 ? (Math.random() * 1.5 + 0.5) :
                      prev < 80 ? (Math.random() * 0.8 + 0.2) :
                      (Math.random() * 0.3 + 0.05);
        const capped = Math.min(prev + speed, 95);
        const stepIndex = Math.min(Math.floor(capped / (95 / steps.length)), steps.length - 1);
        setLoadingStep(steps[stepIndex]);
        return capped;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const triedCount = Object.keys(results).filter(k => !results[k]?.error).length;
    setFeaturesTriedCount(triedCount);
    if (triedCount >= 1 && !stickyDismissed) {
      const timer = setTimeout(() => setShowStickyBar(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [results, stickyDismissed]);

  const contextualMessages: Record<string, { hook: string; benefit: string }> = {
    "credit-narrative": {
      hook: "Imagine this on every borrower in your portfolio",
      benefit: "With a trial account, AI narratives are generated from your real borrower data — ready for loan committees in seconds, not hours."
    },
    "anomaly-detection": {
      hook: "Your real portfolio could have hidden risks right now",
      benefit: "Connect your data and our AI continuously monitors for anomalies, sending real-time alerts before small issues become major losses."
    },
    "regulatory-report": {
      hook: "Stop spending weeks on regulatory submissions",
      benefit: "Upload your portfolio and generate compliant central bank reports for any of the 54 African jurisdictions we support — automatically."
    },
    "natural-query": {
      hook: "Ask questions about your own data, not sample data",
      benefit: "In a trial, this AI answers questions about your actual borrowers, accounts, and risk metrics — like having a data analyst available 24/7."
    },
    "cross-border-risk": {
      hook: "Are your borrowers hiding debt across borders?",
      benefit: "Our registry spans 54 countries. Connect to see exposures that single-country bureaus completely miss."
    },
    "loan-recommendation": {
      hook: "Every loan decision backed by AI intelligence",
      benefit: "Feed in real applications and get instant underwriting decisions with confidence scores, suggested terms, and full audit trails."
    },
  };

  function InlineConversionCTA({ feature }: { feature: string }) {
    const msg = contextualMessages[feature];
    if (!msg || !results[feature] || results[feature]?.error) return null;
    if (useOwnData && results[feature]?.isCustomData) return null;
    return (
      <div className="mt-6 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5" data-testid={`cta-inline-${feature}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              {useOwnData ? "Want the full platform experience?" : msg.hook}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{useOwnData ? "Start a free trial to run AI analysis across your entire portfolio with full dashboards, alerts, and regulatory reporting." : msg.benefit}</p>
          </div>
          {!useOwnData ? (
            <Button onClick={() => setUseOwnData(true)} className="gap-2 shrink-0 shadow-md" data-testid={`cta-inline-btn-${feature}`}>
              Try With Your Data <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate("/start-trial")} className="gap-2 shrink-0 shadow-md" data-testid={`cta-inline-btn-${feature}`}>
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  function OwnDataToggle() {
    return (
      <div className="mb-6 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-4" data-testid="own-data-toggle">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Use Your Own Data</p>
              <p className="text-xs text-muted-foreground">Paste your borrower or portfolio data and the AI will analyze it — no account needed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="own-data-switch" className="text-xs text-muted-foreground">{useOwnData ? "On" : "Off"}</Label>
            <Switch id="own-data-switch" checked={useOwnData} onCheckedChange={setUseOwnData} data-testid="switch-own-data" />
          </div>
        </div>
      </div>
    );
  }

  function BorrowerDataInput() {
    if (!useOwnData) return null;
    return (
      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4" data-testid="custom-borrower-input">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Edit3 className="w-4 h-4 text-primary" />
          Enter Your Borrower Data
        </div>
        <Textarea
          value={customBorrower}
          onChange={e => setCustomBorrower(e.target.value)}
          placeholder={"Paste or type borrower details, e.g.:\n\nName: John Doe\nCountry: Kenya\nEmployment: Business Owner - Retail Shop\nMonthly Income: KES 250,000\nCredit Accounts: 3\n  - Business Loan: KES 2,000,000 | Status: current\n  - Personal Loan: KES 500,000 | Status: delinquent | 30 days arrears\n  - Mobile Money: KES 50,000 | Status: current\nTotal Balance: KES 2,550,000"}
          className="min-h-[160px] text-sm font-mono bg-background"
          data-testid="textarea-custom-borrower"
        />
        <p className="text-[10px] text-muted-foreground">Include any details: name, income, loan amounts, payment history, delinquencies, collateral, etc.</p>
      </div>
    );
  }

  function PortfolioDataInput() {
    if (!useOwnData) return null;
    return (
      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4" data-testid="custom-portfolio-input">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Edit3 className="w-4 h-4 text-primary" />
          Enter Your Portfolio Data
        </div>
        <Textarea
          value={customPortfolio}
          onChange={e => setCustomPortfolio(e.target.value)}
          placeholder={"Paste or type portfolio summary, e.g.:\n\nTotal Borrowers: 320\nTotal Accounts: 580\nAccount Types:\n  - Personal Loans: 200 accounts, KES 45M, 15 delinquent\n  - Business Loans: 180 accounts, KES 120M, 22 delinquent\n  - Mortgages: 50 accounts, KES 890M, 3 delinquent\nBy Lender: Bank A: 300 accounts; Bank B: 280 accounts\nNPL Ratio: 8.2%\nDelinquent Borrowers: 35 (11%)"}
          className="min-h-[160px] text-sm font-mono bg-background"
          data-testid="textarea-custom-portfolio"
        />
        <p className="text-[10px] text-muted-foreground">Include any details: borrower counts, loan types, delinquencies, NPL ratios, lender breakdown, etc.</p>
      </div>
    );
  }

  function AIProgressBar({ feature }: { feature: string }) {
    if (loading !== feature) return null;
    const elapsed = loadingStartTime ? Math.floor((Date.now() - loadingStartTime) / 1000) : 0;
    const isLongWait = loadingProgress > 85;
    return (
      <div className="mt-3 space-y-2 animate-in fade-in-50 duration-300" data-testid={`progress-${feature}`}>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="font-medium">{isLongWait ? "Almost there — finalizing AI response..." : loadingStep}</span>
          </div>
          <span className="tabular-nums">{Math.round(loadingProgress)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${loadingProgress}%`,
              background: loadingProgress >= 100
                ? "linear-gradient(90deg, hsl(142 55% 40%), hsl(142 70% 50%))"
                : `linear-gradient(90deg, ${brandColors.accentLight}, ${brandColors.chartSecondary})`,
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center">
          {isLongWait
            ? "Complex AI analysis can take up to 60 seconds — hang tight, the result is worth it"
            : "AI is analyzing your data — this may take up to a minute for detailed reports"}
        </p>
      </div>
    );
  }

  async function runFeature(feature: string, body: Record<string, any> = {}) {
    setLoading(feature);
    try {
      const res = await fetch(`/api/ai-demo/${feature}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Request failed");
      }
      const data = await res.json();
      setLoadingProgress(100);
      setLoadingStep("Complete!");
      await new Promise(r => setTimeout(r, 400));
      setResults(prev => ({ ...prev, [feature]: data }));
      setTimeout(() => {
        const el = document.querySelector(`[data-testid="result-${feature}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: any) {
      setResults(prev => ({ ...prev, [feature]: { error: e.message } }));
    } finally {
      setLoading(null);
    }
  }

  const features = [
    { id: "credit-narrative", label: "Credit Narrative", icon: FileText, desc: "AI-generated loan committee reports" },
    { id: "anomaly-detection", label: "Smart Alerts", icon: AlertTriangle, desc: "Portfolio anomaly detection" },
    { id: "regulatory-report", label: "Regulatory Reports", icon: Shield, desc: "Central bank submissions" },
    { id: "natural-query", label: "Ask Your Data", icon: Search, desc: "Natural language queries" },
    { id: "cross-border-risk", label: "Cross-Border Risk", icon: Globe2, desc: "Multi-country risk analysis" },
    { id: "loan-recommendation", label: "Loan Decisions", icon: BadgeCheck, desc: "AI underwriting recommendations" },
  ];

  function renderSeverityBadge(severity: string) {
    const colors: Record<string, string> = {
      critical: "bg-red-500/10 text-red-600 border-red-200",
      high: "bg-orange-500/10 text-orange-600 border-orange-200",
      medium: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      low: "bg-green-500/10 text-green-600 border-green-200",
    };
    return <Badge variant="outline" className={colors[severity] || ""}>{severity}</Badge>;
  }

  function renderDecisionBadge(decision: string) {
    if (decision === "approve") return <Badge className="bg-green-600 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
    if (decision === "conditional_approve") return <Badge className="bg-yellow-600 text-white gap-1"><AlertCircle className="w-3 h-3" /> Conditional</Badge>;
    return <Badge className="bg-red-600 text-white gap-1"><XCircle className="w-3 h-3" /> Declined</Badge>;
  }

  function renderRiskLevel(level: string) {
    const colors: Record<string, string> = {
      low: "text-green-600", moderate: "text-yellow-600", elevated: "text-orange-600", high: "text-red-600", critical: "text-red-700"
    };
    return <span className={`font-bold text-lg ${colors[level] || "text-muted-foreground"}`}>{level?.toUpperCase()}</span>;
  }

  const scenarioLabels: Record<string, { name: string; icon: typeof User; desc: string }> = {
    strong: { name: "Kwame Asante", icon: User, desc: "Senior banker in Ghana, clean history" },
    risky: { name: "Fatima Diallo", icon: User, desc: "Market trader in Senegal, some delinquencies" },
    corporate: { name: "Sahel Agri-Processing Ltd", icon: Building2, desc: "Nigerian agribusiness, large portfolio" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="ai-demo-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")} data-testid="nav-home">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CDH Credit Registry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">AI Demo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/")} data-testid="link-back-home">
              <ArrowLeft className="w-3 h-3" /> Back
            </Button>
            <Button size="sm" className="text-xs" onClick={() => navigate("/start-trial")} data-testid="button-start-trial">
              Start Free Trial <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Zap className="w-3 h-3" /> Live AI — Powered by Claude & GPT-4o
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" data-testid="page-title">
            AI Credit Intelligence in Action
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Real AI calls you can try right now — no login required. Use our sample data or toggle
            "Use Your Own Data" to paste your borrower and portfolio information for instant AI analysis.
          </p>
        </div>

        <OwnDataToggle />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto gap-1 bg-muted/50 p-1">
            {features.map(f => (
              <TabsTrigger key={f.id} value={f.id} className="text-xs py-2 px-2 flex flex-col items-center gap-1 data-[state=active]:shadow-sm" data-testid={`tab-${f.id}`}>
                <f.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{f.label}</span>
                <span className="sm:hidden">{f.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="credit-narrative" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-primary" /> AI Credit Narrative Generator</CardTitle>
                <CardDescription>{useOwnData ? "Paste your borrower data below and our AI will generate a loan committee-ready credit narrative." : "Select a sample borrower profile to generate a loan committee-ready credit narrative."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BorrowerDataInput />
                {!useOwnData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(scenarioLabels).map(([key, val]) => (
                      <div
                        key={key}
                        onClick={() => setBorrowerScenario(key)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${borrowerScenario === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"}`}
                        data-testid={`scenario-${key}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <val.icon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{val.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{val.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => runFeature("credit-narrative", useOwnData && customBorrower.trim() ? { customData: customBorrower } : { borrowerScenario })}
                  disabled={loading === "credit-narrative" || (useOwnData && !customBorrower.trim())}
                  className="gap-2"
                  data-testid="run-credit-narrative"
                >
                  {loading === "credit-narrative" ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Brain className="w-4 h-4" /> {useOwnData ? "Analyze Your Borrower" : "Generate Narrative"}</>}
                </Button>
                <AIProgressBar feature="credit-narrative" />

                {results["credit-narrative"] && !results["credit-narrative"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-credit-narrative">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm px-3 py-1">Creditworthiness: {results["credit-narrative"].creditworthiness}</Badge>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <h4 className="font-semibold text-sm mb-2">Narrative</h4>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{results["credit-narrative"].narrative}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Strengths</h4>
                        {results["credit-narrative"].strengths?.map((s: string, i: number) => (
                          <p key={i} className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">{s}</p>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-orange-500" /> Risks</h4>
                        {results["credit-narrative"].risks?.map((r: string, i: number) => (
                          <p key={i} className="text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">{r}</p>
                        ))}
                      </div>
                    </div>
                    {results["credit-narrative"].recommendation && (
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                        <h4 className="font-semibold text-sm mb-1">Recommendation</h4>
                        <p className="text-sm">{results["credit-narrative"].recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
                {results["credit-narrative"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400" data-testid="error-credit-narrative">{results["credit-narrative"].error}</div>
                )}
                <InlineConversionCTA feature="credit-narrative" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomaly-detection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5 text-orange-500" /> Smart Alerts & Anomaly Detection</CardTitle>
                <CardDescription>{useOwnData ? "Paste your portfolio data below and our AI will scan for anomalies and emerging risks." : "AI scans an 847-borrower portfolio to identify unusual patterns, emerging risks, and actionable alerts."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PortfolioDataInput />
                <Button
                  onClick={() => runFeature("anomaly-detection", useOwnData && customPortfolio.trim() ? { customPortfolio } : {})}
                  disabled={loading === "anomaly-detection" || (useOwnData && !customPortfolio.trim())}
                  className="gap-2"
                  data-testid="run-anomaly-detection"
                >
                  {loading === "anomaly-detection" ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Portfolio...</> : <><AlertTriangle className="w-4 h-4" /> {useOwnData ? "Scan Your Portfolio" : "Scan for Anomalies"}</>}
                </Button>
                <AIProgressBar feature="anomaly-detection" />

                {results["anomaly-detection"] && !results["anomaly-detection"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-anomaly-detection">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{results["anomaly-detection"].riskScore}</div>
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{results["anomaly-detection"].alerts?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Alerts Found</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {results["anomaly-detection"].alerts?.map((alert: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{alert.title}</span>
                            {renderSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                          {alert.recommendedAction && (
                            <p className="text-xs text-primary font-medium">Action: {alert.recommendedAction}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {results["anomaly-detection"].trendAnalysis && (
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Trend Analysis</h4>
                        <p className="text-sm whitespace-pre-wrap">{results["anomaly-detection"].trendAnalysis}</p>
                      </div>
                    )}
                  </div>
                )}
                {results["anomaly-detection"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400">{results["anomaly-detection"].error}</div>
                )}
                <InlineConversionCTA feature="anomaly-detection" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regulatory-report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-blue-600" /> AI Regulatory Report Generator</CardTitle>
                <CardDescription>{useOwnData ? "Paste your portfolio data below and select a country to generate a regulatory submission." : "Generate a central bank regulatory submission for any African country."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PortfolioDataInput />
                <div className="flex items-center gap-3">
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="w-48" data-testid="select-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ghana">Ghana (Bank of Ghana)</SelectItem>
                      <SelectItem value="Nigeria">Nigeria (CBN)</SelectItem>
                      <SelectItem value="Kenya">Kenya (CBK)</SelectItem>
                      <SelectItem value="South Africa">South Africa (SARB)</SelectItem>
                      <SelectItem value="Senegal">Senegal (BCEAO)</SelectItem>
                      <SelectItem value="Rwanda">Rwanda (BNR)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => runFeature("regulatory-report", useOwnData && customPortfolio.trim() ? { country, customPortfolio } : { country })}
                    disabled={loading === "regulatory-report" || (useOwnData && !customPortfolio.trim())}
                    className="gap-2"
                    data-testid="run-regulatory-report"
                  >
                    {loading === "regulatory-report" ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Shield className="w-4 h-4" /> {useOwnData ? "Generate From Your Data" : "Generate Report"}</>}
                  </Button>
                </div>
                <AIProgressBar feature="regulatory-report" />

                {results["regulatory-report"] && !results["regulatory-report"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-regulatory-report">
                    <h3 className="font-bold text-base">{results["regulatory-report"].reportTitle}</h3>
                    {results["regulatory-report"].executiveSummary ? (
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2">Executive Summary</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{results["regulatory-report"].executiveSummary}</p>
                      </div>
                    ) : results["regulatory-report"].rawText && (
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2">AI Report</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{results["regulatory-report"].rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()}</p>
                      </div>
                    )}
                    {results["regulatory-report"].portfolioMetrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(results["regulatory-report"].portfolioMetrics).map(([key, val]) => (
                          <div key={key} className="p-3 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                            <div className="font-bold text-sm mt-1">{String(val)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {results["regulatory-report"].complianceStatus && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Compliance Status</h4>
                        {results["regulatory-report"].complianceStatus.map((cs: any, i: number) => (
                          <div key={i} className="flex items-center justify-between border rounded p-2">
                            <span className="text-sm">{cs.regulation}</span>
                            <Badge variant="outline" className={cs.status === "compliant" ? "text-green-600 border-green-200" : cs.status === "partial" ? "text-yellow-600 border-yellow-200" : "text-red-600 border-red-200"}>
                              {cs.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {results["regulatory-report"].riskAssessment && (
                      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <h4 className="font-semibold text-sm mb-2">Risk Assessment</h4>
                        <p className="text-sm whitespace-pre-wrap">{results["regulatory-report"].riskAssessment}</p>
                      </div>
                    )}
                  </div>
                )}
                {results["regulatory-report"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400">{results["regulatory-report"].error}</div>
                )}
                <InlineConversionCTA feature="regulatory-report" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="natural-query" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Search className="w-5 h-5 text-violet-600" /> Ask Your Data</CardTitle>
                <CardDescription>{useOwnData ? "Paste your portfolio data above, then ask questions about it in natural language." : "Query the sample credit portfolio using natural language — ask anything about borrowers, risk, or trends."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PortfolioDataInput />
                <div className="space-y-3">
                  <Textarea
                    value={queryText}
                    onChange={e => setQueryText(e.target.value)}
                    placeholder="e.g. What percentage of business loans are delinquent and which lender has the highest NPL ratio?"
                    className="min-h-[80px] text-sm"
                    data-testid="input-query"
                  />
                  {!useOwnData && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        "How many borrowers have delinquent accounts?",
                        "Which lender has the highest default rate?",
                        "What is the total microfinance exposure?",
                        "Compare mortgage vs business loan risk",
                      ].map((q, i) => (
                        <Button key={i} variant="outline" size="sm" className="text-xs" onClick={() => setQueryText(q)} data-testid={`quick-query-${i}`}>
                          {q}
                        </Button>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => runFeature("natural-query", { query: queryText || "How many borrowers have delinquent accounts and what is the total exposure?", ...(useOwnData && customPortfolio.trim() ? { customPortfolio } : {}) })}
                    disabled={loading === "natural-query" || (useOwnData && !customPortfolio.trim())}
                    className="gap-2"
                    data-testid="run-natural-query"
                  >
                    {loading === "natural-query" ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Search className="w-4 h-4" /> {useOwnData ? "Ask About Your Data" : "Ask AI"}</>}
                  </Button>
                </div>
                <AIProgressBar feature="natural-query" />

                {results["natural-query"] && !results["natural-query"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-natural-query">
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Search className="w-3 h-3" /> {results["natural-query"].query}</div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{results["natural-query"].answer}</p>
                    </div>
                    {results["natural-query"].dataPoints?.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {results["natural-query"].dataPoints.map((dp: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground">{dp.label}</div>
                            <div className="font-bold text-sm mt-1">{dp.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {results["natural-query"].relatedInsights?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Related Insights</h4>
                        {results["natural-query"].relatedInsights.map((insight: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1"><TrendingUp className="w-3 h-3 mt-0.5 shrink-0 text-primary" /> {insight}</p>
                        ))}
                      </div>
                    )}
                    {results["natural-query"].confidence != null && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BadgeCheck className="w-3 h-3" /> Confidence: {results["natural-query"].confidence}%
                      </div>
                    )}
                  </div>
                )}
                {results["natural-query"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400">{results["natural-query"].error}</div>
                )}
                <InlineConversionCTA feature="natural-query" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cross-border-risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Globe2 className="w-5 h-5 text-emerald-600" /> Cross-Border Risk Intelligence</CardTitle>
                <CardDescription>{useOwnData ? "Paste your multi-country exposure data and the AI will identify systemic risks and hidden exposures." : "Analyze multi-country exposures across 7 African nations — the kind of intelligence single-country bureaus miss entirely."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PortfolioDataInput />
                <Button
                  onClick={() => runFeature("cross-border-risk", useOwnData && customPortfolio.trim() ? { customPortfolio } : {})}
                  disabled={loading === "cross-border-risk" || (useOwnData && !customPortfolio.trim())}
                  className="gap-2"
                  data-testid="run-cross-border-risk"
                >
                  {loading === "cross-border-risk" ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Globe2 className="w-4 h-4" /> {useOwnData ? "Analyze Your Exposures" : "Analyze Cross-Border Risk"}</>}
                </Button>
                <AIProgressBar feature="cross-border-risk" />

                {results["cross-border-risk"] && !results["cross-border-risk"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-cross-border-risk">
                    {results["cross-border-risk"].systemicRisk && (
                      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Systemic Risk Level</div>
                          {renderRiskLevel(results["cross-border-risk"].systemicRisk.level)}
                        </div>
                        {results["cross-border-risk"].systemicRisk.score != null && (
                          <div className="text-center">
                            <div className="text-3xl font-bold">{results["cross-border-risk"].systemicRisk.score}</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        )}
                      </div>
                    )}
                    {results["cross-border-risk"].systemicRisk?.summary && (
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <p className="text-sm whitespace-pre-wrap">{results["cross-border-risk"].systemicRisk.summary}</p>
                      </div>
                    )}
                    {results["cross-border-risk"].hiddenExposures?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-orange-500" /> Hidden Exposures</h4>
                        {results["cross-border-risk"].hiddenExposures.map((exp: any, i: number) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{exp.entity}</span>
                              <span className="text-xs text-muted-foreground">{exp.totalExposure}</span>
                            </div>
                            <div className="flex gap-1 mb-1">
                              {exp.countries?.map((c: string, j: number) => (
                                <Badge key={j} variant="outline" className="text-[10px]">{c}</Badge>
                              ))}
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400">{exp.riskFlag}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {results["cross-border-risk"].concentrationRisks?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Concentration Risks</h4>
                        {results["cross-border-risk"].concentrationRisks.map((cr: any, i: number) => (
                          <div key={i} className="border rounded p-2">
                            <span className="font-medium text-xs">{cr.type}: </span>
                            <span className="text-xs text-muted-foreground">{cr.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {results["cross-border-risk"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400">{results["cross-border-risk"].error}</div>
                )}
                <InlineConversionCTA feature="cross-border-risk" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loan-recommendation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="w-5 h-5 text-green-600" /> AI Loan Decision Engine</CardTitle>
                <CardDescription>{useOwnData ? "Paste your borrower data below and set the loan details for an AI underwriting decision." : "Submit a loan application for AI underwriting — get approve/decline decisions with full reasoning and suggested terms."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BorrowerDataInput />
                {!useOwnData && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(scenarioLabels).map(([key, val]) => (
                      <div
                        key={key}
                        onClick={() => setBorrowerScenario(key)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${borrowerScenario === key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"}`}
                        data-testid={`loan-scenario-${key}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <val.icon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{val.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{val.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Loan Amount</label>
                    <Input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} data-testid="input-loan-amount" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Loan Type</label>
                    <Select value={loanType} onValueChange={setLoanType}>
                      <SelectTrigger data-testid="select-loan-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_expansion">Business Expansion</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="working_capital">Working Capital</SelectItem>
                        <SelectItem value="trade_finance">Trade Finance</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => runFeature("loan-recommendation", { 
                    ...(useOwnData && customBorrower.trim() ? { customData: customBorrower } : { borrowerScenario }), 
                    loanAmount: parseInt(loanAmount) || 50000, 
                    loanType 
                  })}
                  disabled={loading === "loan-recommendation" || (useOwnData && !customBorrower.trim())}
                  className="gap-2"
                  data-testid="run-loan-recommendation"
                >
                  {loading === "loan-recommendation" ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><BadgeCheck className="w-4 h-4" /> {useOwnData ? "Evaluate Your Application" : "Run AI Underwriting"}</>}
                </Button>
                <AIProgressBar feature="loan-recommendation" />

                {results["loan-recommendation"] && !results["loan-recommendation"].error && (
                  <div className="mt-4 space-y-4 animate-in fade-in-50 duration-500" data-testid="result-loan-recommendation">
                    <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                      {renderDecisionBadge(results["loan-recommendation"].decision)}
                      <div className="text-center">
                        <div className="text-2xl font-bold">{results["loan-recommendation"].confidence}%</div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                    {results["loan-recommendation"].reasoning && (
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2">Reasoning</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{results["loan-recommendation"].reasoning}</p>
                      </div>
                    )}
                    {results["loan-recommendation"].suggestedTerms && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(results["loan-recommendation"].suggestedTerms).map(([key, val]) => (
                          <div key={key} className="p-3 rounded-lg border text-center">
                            <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                            <div className="font-bold text-sm mt-1">{String(val)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {results["loan-recommendation"].conditions?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Conditions</h4>
                        {results["loan-recommendation"].conditions.map((c: string, i: number) => (
                          <p key={i} className="text-xs flex items-start gap-1"><Clock className="w-3 h-3 mt-0.5 shrink-0 text-yellow-600" /> {c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {results["loan-recommendation"]?.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 text-sm text-red-700 dark:text-red-400">{results["loan-recommendation"].error}</div>
                )}
                <InlineConversionCTA feature="loan-recommendation" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {featuresTriedCount > 0 && (
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              You've explored {featuresTriedCount} of 6 AI features
              {featuresTriedCount < 6 && <span>— try {6 - featuresTriedCount} more above</span>}
            </div>
          </div>
        )}

        <div className="mt-12 border-t pt-12 pb-4" data-testid="conversion-section">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                What you just saw is 1% of what the platform does
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                The AI features you tried work on sample data. With a trial account, they analyze
                your real portfolio — and you get access to the full credit registry platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                {
                  step: "1",
                  title: "Start Your Free Trial",
                  desc: "Register your organization in 2 minutes. No credit card required. Get full admin access to everything.",
                  icon: Zap,
                  time: "2 minutes"
                },
                {
                  step: "2",
                  title: "Connect Your Data",
                  desc: "Upload borrowers via CSV, API, or batch import. We'll seed sample data so you can explore immediately.",
                  icon: Database,
                  time: "5 minutes"
                },
                {
                  step: "3",
                  title: "See Real Results",
                  desc: "Run AI analysis on your actual portfolio. Generate regulatory reports. Monitor risks in real time.",
                  icon: TrendingUp,
                  time: "Instant"
                },
              ].map(item => (
                <Card key={item.step} className="border border-border/60 relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{item.step}</div>
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                    <Badge variant="outline" className="text-[10px]"><Clock className="w-2.5 h-2.5 mr-1" /> {item.time}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center" data-testid="final-cta">
              <h3 className="text-xl font-bold mb-2">14-Day Free Trial — Full Platform Access</h3>
              <p className="text-sm text-muted-foreground mb-1">No credit card. No commitment. Cancel anytime.</p>
              <p className="text-xs text-muted-foreground mb-6">
                Includes all 6 AI features, credit scoring, regulatory compliance for 54 countries, cross-border tracking, API access, and more.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button size="lg" onClick={() => navigate("/start-trial")} className="gap-2 shadow-lg px-8" data-testid="cta-final-trial">
                  <Zap className="w-4 h-4" /> Start Free Trial Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2" data-testid="cta-final-pricing">
                  Compare Plans <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Bank-grade encryption</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SOC 2 compliant</span>
                <span className="flex items-center gap-1"><Globe2 className="w-3 h-3" /> 54 African countries</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> POPIA, NDPA & 36+ African DPAs</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground mb-2">Prefer to talk to someone first?</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => window.location.href = "mailto:uffe.carlson@gmail.com"} data-testid="cta-email-sales">
                  <Mail className="w-3 h-3" /> uffe.carlson@gmail.com
                </Button>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => window.location.href = "tel:+233552395548"} data-testid="cta-phone-sales">
                  <Phone className="w-3 h-3" /> +233 552 395 548
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStickyBar && !stickyDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 duration-500" data-testid="sticky-cta-bar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Like what you see? Run this on your real data.</p>
                <p className="text-xs text-muted-foreground hidden sm:block">14-day free trial — no credit card required</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={() => navigate("/start-trial")} className="gap-2 shadow-md" data-testid="sticky-cta-trial">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStickyDismissed(true); setShowStickyBar(false); }} data-testid="sticky-cta-dismiss">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIDemoPage;
