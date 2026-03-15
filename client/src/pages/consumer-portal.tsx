import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Shield, CreditCard, AlertTriangle, CheckCircle2, TrendingUp, User, Loader2, Scale, Phone, ChevronDown, ChevronUp, CalendarDays, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { ScoreFactors } from "@/components/score-factors";

interface ConsumerData {
  borrower: {
    firstName: string;
    lastName: string;
    companyName: string;
    type: string;
    nationalId: string;
    country: string;
  };
  creditSummary: {
    creditScore: number;
    reasonCodes: string[];
    scoreFactors: any[];
    totalAccounts: number;
    activeAccounts: number;
    delinquentAccounts: number;
    inquiryCount: number;
    judgmentCount: number;
    openDisputes: number;
  };
  accountSummary: {
    accountType: string;
    lender: string;
    status: string;
  }[];
}

function getStatusBadgeVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "current": return "default";
    case "delinquent": case "default": return "destructive";
    case "closed": return "secondary";
    default: return "outline";
  }
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 750) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 670) return { label: "Good", color: "text-green-600 dark:text-green-400" };
  if (score >= 580) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400" };
  if (score >= 450) return { label: "Poor", color: "text-orange-600 dark:text-orange-400" };
  return { label: "Very Poor", color: "text-red-600 dark:text-red-400" };
}

export default function ConsumerPortalPage() {
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [data, setData] = useState<ConsumerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);

  const canSubmit = nationalId.length >= 6 && dateOfBirth.length > 0;

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, dateOfBirth }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Lookup failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setData(result);
      setError(null);
      setShowAccounts(false);
    },
    onError: (err: Error) => {
      setData(null);
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (canSubmit) lookupMutation.mutate();
  };

  const borrowerName = data?.borrower.type === "individual"
    ? `${data.borrower.firstName || ""} ${data.borrower.lastName || ""}`.trim()
    : data?.borrower.companyName || "";

  const scoreInfo = data ? getScoreLabel(data.creditSummary.creditScore) : null;
  const riskItems = data ? data.creditSummary.delinquentAccounts + data.creditSummary.judgmentCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">

        <div className="text-center space-y-2 pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold" data-testid="badge-consumer-portal">
            <Shield className="w-3 h-3" />
            Credit Self-Service
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" data-testid="text-consumer-portal-title">
            Check Your Credit Score
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Verify your identity to securely access your credit file.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">National ID / Ghana Card / Passport</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g. GHA-123456789"
                className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                data-testid="input-consumer-id"
                inputMode="text"
                autoCapitalize="characters"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                data-testid="input-consumer-dob"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={lookupMutation.isPending || !canSubmit}
              size="lg"
              className="w-full rounded-xl"
              data-testid="button-consumer-lookup"
            >
              {lookupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {lookupMutation.isPending ? "Verifying..." : "Verify & View Credit File"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              <Lock className="w-3 h-3 inline mr-1" />
              Your identity is verified before any data is shown. Only you can access your credit file.
            </p>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="text-consumer-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {lookupMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your identity...</p>
          </div>
        )}

        {data && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="consumer-results">

            <Card className="shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/3 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold" data-testid="text-consumer-name">{borrowerName}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">ID: {data.borrower.nationalId}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <CreditScoreGauge score={data.creditSummary.creditScore} size={180} testId="consumer-score-gauge" />
                  {scoreInfo && (
                    <p className={`text-lg font-bold ${scoreInfo.color}`} data-testid="text-score-label">{scoreInfo.label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Score range: 300 – 850</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-2.5">
              <Card className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-consumer-accounts">{data.creditSummary.totalAccounts}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Accounts</p>
                  <p className="text-[9px] text-muted-foreground">{data.creditSummary.activeAccounts} active</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xl sm:text-2xl font-bold" data-testid="text-consumer-inquiries">{data.creditSummary.inquiryCount}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Inquiries</p>
                  <p className="text-[9px] text-muted-foreground">Last 12 mo</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className={`text-xl sm:text-2xl font-bold ${riskItems > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`} data-testid="text-consumer-risk">
                    {riskItems}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Risk Items</p>
                  <p className="text-[9px] text-muted-foreground">Delinq + Judg</p>
                </CardContent>
              </Card>
            </div>

            {data.creditSummary.scoreFactors && data.creditSummary.scoreFactors.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">What Affects Your Score</h3>
                  </div>
                  <ScoreFactors factors={data.creditSummary.scoreFactors} compact />
                </CardContent>
              </Card>
            )}

            {data.accountSummary.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowAccounts(!showAccounts)}
                    data-testid="button-toggle-accounts"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Your Credit Accounts</h3>
                      <Badge variant="secondary" className="text-[10px]">{data.accountSummary.length}</Badge>
                    </div>
                    {showAccounts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {showAccounts && (
                    <div className="mt-3 space-y-2">
                      {data.accountSummary.map((account, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-card" data-testid={`consumer-account-${i}`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{account.lender}</p>
                            <p className="text-[11px] text-muted-foreground">{account.accountType}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <Badge variant={getStatusBadgeVariant(account.status)} className="text-[10px]">
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {data.creditSummary.openDisputes > 0 && (
              <Card className="shadow-sm border-yellow-200 dark:border-yellow-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">
                      {data.creditSummary.openDisputes} open dispute{data.creditSummary.openDisputes > 1 ? "s" : ""} on file
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm bg-muted/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Your Rights</h3>
                </div>
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Access your credit report once per year at no cost.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Dispute any inaccurate information on your credit file.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Lenders must get your consent before accessing your data.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pb-4">
              <p className="text-[10px] text-muted-foreground">
                <Phone className="w-3 h-3 inline mr-1" />
                Need help? Contact your lender or the credit bureau to file a dispute.
              </p>
            </div>
          </div>
        )}

        {!data && !lookupMutation.isPending && (
          <div className="text-center py-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 1</p>
                  <p className="text-[11px] text-muted-foreground">Enter your National ID or Ghana Card number</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 2</p>
                  <p className="text-[11px] text-muted-foreground">Enter your date of birth to verify your identity</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 3</p>
                  <p className="text-[11px] text-muted-foreground">View your credit score and account summary securely</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
