import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Shield, CreditCard, AlertTriangle, CheckCircle2, TrendingUp, User, FileText, Loader2, ArrowRight, Scale, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { ScoreFactors } from "@/components/score-factors";

interface ConsumerData {
  borrower: {
    id: string;
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
    totalDebt: string;
    inquiryCount: number;
    judgmentCount: number;
    openDisputes: number;
  };
  accountSummary: {
    accountType: string;
    lender: string;
    status: string;
    currency: string;
    currentBalance: string;
    originalAmount: string;
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

export default function ConsumerPortalPage() {
  const [nationalId, setNationalId] = useState("");
  const [data, setData] = useState<ConsumerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/consumer/lookup?nationalId=${encodeURIComponent(nationalId)}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Lookup failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setData(result);
      setError(null);
    },
    onError: (err: Error) => {
      setData(null);
      setError(err.message);
    },
  });

  const borrowerName = data?.borrower.type === "individual"
    ? `${data.borrower.firstName || ""} ${data.borrower.lastName || ""}`.trim()
    : data?.borrower.companyName || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Consumer Self-Service Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="text-consumer-portal-title">
            Check Your Credit Score
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter your National ID, Ghana Card, or Passport number to view your credit file summary and score.
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">National ID / Ghana Card / Passport Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="Enter your ID number"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-consumer-id"
                    onKeyDown={(e) => e.key === "Enter" && nationalId.length >= 3 && lookupMutation.mutate()}
                  />
                  <Button
                    onClick={() => lookupMutation.mutate()}
                    disabled={lookupMutation.isPending || nationalId.length < 3}
                    data-testid="button-consumer-lookup"
                  >
                    {lookupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1.5" />}
                    Look Up
                  </Button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" data-testid="text-consumer-error">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {lookupMutation.isPending && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {data && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="consumer-results">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    <CreditScoreGauge score={data.creditSummary.creditScore} size={200} testId="consumer-score-gauge" />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-3">
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-lg font-bold" data-testid="text-consumer-name">{borrowerName}</h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: {data.borrower.nationalId} · {data.borrower.country || "N/A"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Accounts</p>
                        <p className="text-xl font-bold mt-0.5" data-testid="text-consumer-accounts">{data.creditSummary.totalAccounts}</p>
                        <p className="text-[10px] text-muted-foreground">{data.creditSummary.activeAccounts} active</p>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Inquiries</p>
                        <p className="text-xl font-bold mt-0.5" data-testid="text-consumer-inquiries">{data.creditSummary.inquiryCount}</p>
                        <p className="text-[10px] text-muted-foreground">Last 12 months</p>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Risk Items</p>
                        <p className={`text-xl font-bold mt-0.5 ${data.creditSummary.delinquentAccounts + data.creditSummary.judgmentCount > 0 ? "text-destructive" : "text-green-600"}`} data-testid="text-consumer-risk">
                          {data.creditSummary.delinquentAccounts + data.creditSummary.judgmentCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Delinq. + Judgments</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.creditSummary.scoreFactors && data.creditSummary.scoreFactors.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">What's Affecting Your Score</h3>
                  </div>
                  <ScoreFactors factors={data.creditSummary.scoreFactors} />
                </CardContent>
              </Card>
            )}

            {data.accountSummary.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Your Credit Accounts</h3>
                  </div>
                  <div className="space-y-2">
                    {data.accountSummary.map((account, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors" data-testid={`consumer-account-${i}`}>
                        <div>
                          <p className="text-sm font-semibold">{account.lender}</p>
                          <p className="text-xs text-muted-foreground">{account.accountType} · {account.currency}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(account.status)} className="text-[10px]">
                            {account.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {parseFloat(account.currentBalance || "0").toLocaleString()} {account.currency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.creditSummary.openDisputes > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      You have {data.creditSummary.openDisputes} open dispute{data.creditSummary.openDisputes > 1 ? "s" : ""} on your credit file.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Your Rights</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>You have the right to access your credit report once per year at no cost.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>You may dispute any inaccurate information on your credit file.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Lenders must obtain your consent before accessing your credit data.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Contact your lender or the bureau to initiate a dispute.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
