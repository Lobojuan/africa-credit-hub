import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Factory, CreditCard, AlertTriangle, TrendingUp, FileText, Flag, Camera, Brain, Loader2, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { getBorrowerAvatarUrl } from "@/lib/avatar";
import { getDefaultCurrency } from "@/lib/country-mode";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { FraudRiskIndicator, FraudRiskBadge } from "@/components/fraud-risk-indicator";
import { ScoreFactors } from "@/components/score-factors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gavel, FileCheck } from "lucide-react";
import { queryClient, apiRequest, apiFormRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Borrower, CreditAccount, CreditInquiry, CourtJudgment, ConsentRecord, BorrowerAlert } from "@shared/schema";

function getStatusColor(status: string) {
  switch (status) {
    case "current": return "default";
    case "delinquent": return "destructive";
    case "default": return "destructive";
    case "closed": return "secondary";
    default: return "default";
  }
}

export default function BusinessDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/businesses/:id");
  const [, navigate] = useLocation();
  const borrowerId = params?.id;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [aiRisk, setAiRisk] = useState<any>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  const aiRiskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/ai/credit-risk/${borrowerId}`);
      if (!res.ok) throw new Error("AI analysis failed");
      return res.json();
    },
    onSuccess: (data) => { setAiRisk(data); setAiExpanded(true); toast({ title: "AI Risk Analysis Complete" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await apiFormRequest("POST", `/api/borrowers/${borrowerId}/photo`, formData);
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/borrowers', borrowerId, 'credit-report'] });
      toast({ title: "Logo uploaded" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const { data: reportData, isLoading } = useQuery<{
    borrower: Borrower; accounts: CreditAccount[]; inquiries: CreditInquiry[];
    judgments: CourtJudgment[]; consents: ConsentRecord[]; alerts: BorrowerAlert[];
    creditScore: number; scoreFactors: any; alternativeData: any; fraudRisk: any;
  }>({
    queryKey: ['/api/borrowers', borrowerId, 'credit-report'],
    queryFn: async () => {
      const res = await fetch(`/api/borrowers/${borrowerId}/credit-report`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load business data");
      return res.json();
    },
    enabled: !!borrowerId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!reportData?.borrower) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold" data-testid="text-business-not-found">Business not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/businesses")} data-testid="button-back-businesses">Back to Businesses</Button>
      </div>
    );
  }

  const { borrower, accounts, inquiries, judgments, creditScore, scoreFactors, fraudRisk } = reportData;
  const currency = getDefaultCurrency();
  const totalExposure = accounts.filter(a => a.status !== "closed").reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  const commercialFacilities = accounts.filter(a => ["commercial_loan", "business_loan", "trade_finance", "overdraft", "line_of_credit", "working_capital"].includes(a.accountType || ""));
  const otherAccounts = accounts.filter(a => !commercialFacilities.includes(a));

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-[1200px] mx-auto animate-page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/businesses")} data-testid="button-back-businesses">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Businesses
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <img
                src={(borrower as any).photoUrl || getBorrowerAvatarUrl(borrower.id, borrower.companyName || "", "corporate")}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-2 border-border mx-auto"
                data-testid="img-business-avatar"
              />
              <button
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90"
                onClick={() => photoInputRef.current?.click()}
                data-testid="button-upload-logo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadPhotoMutation.mutate(e.target.files[0]); }} />
            </div>
            <h2 className="text-lg font-bold mt-3" data-testid="text-business-name">{borrower.companyName || "Unnamed Business"}</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-business-id">
              {borrower.tinNumber ? `TIN: ${borrower.tinNumber}` : borrower.businessRegNumber ? `Reg: ${borrower.businessRegNumber}` : borrower.nationalId}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {borrower.isPep && <Badge variant="destructive"><Flag className="w-3 h-3 mr-1" />PEP</Badge>}
              {borrower.country && <Badge variant="outline">{borrower.country}</Badge>}
              {borrower.sector && <Badge variant="outline">{borrower.sector}</Badge>}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm text-left">
              {borrower.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground shrink-0" /><span className="truncate" data-testid="text-email">{borrower.email}</span></div>}
              {borrower.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground shrink-0" /><span data-testid="text-phone">{borrower.phone}</span></div>}
              {(borrower.city || borrower.address) && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground shrink-0" /><span className="truncate">{borrower.address || `${borrower.city}, ${borrower.region || borrower.country}`}</span></div>}
              {borrower.sector && <div className="flex items-center gap-2"><Factory className="w-4 h-4 text-muted-foreground shrink-0" /><span data-testid="text-sector">{borrower.sector}</span></div>}
              {borrower.businessRegNumber && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground shrink-0" /><span data-testid="text-reg">Reg: {borrower.businessRegNumber}</span></div>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Credit Score</p>
                {creditScore ? (
                  <CreditScoreGauge score={creditScore} size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground" data-testid="text-no-score">N/A</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Exposure</p>
                <p className="text-xl font-bold" data-testid="text-total-exposure">{formatCurrency(totalExposure, currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Active Facilities</p>
                <p className="text-xl font-bold" data-testid="text-active-facilities">{accounts.filter(a => a.status !== "closed").length}</p>
              </CardContent>
            </Card>
          </div>

          {fraudRisk && <FraudRiskIndicator fraudRisk={fraudRisk} />}

          {scoreFactors && <ScoreFactors factors={scoreFactors} />}

          <Button
            variant="outline"
            size="sm"
            onClick={() => aiRiskMutation.mutate()}
            disabled={aiRiskMutation.isPending}
            data-testid="button-ai-analysis"
          >
            {aiRiskMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            AI Risk Analysis
          </Button>

          {aiRisk && aiExpanded && (
            <Card>
              <CardHeader className="pb-2 cursor-pointer flex flex-row items-center justify-between" onClick={() => setAiExpanded(!aiExpanded)}>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">AI Risk Assessment</span></div>
                <ChevronUp className="w-4 h-4" />
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap" data-testid="text-ai-analysis">{aiRisk.analysis || JSON.stringify(aiRisk, null, 2)}</CardContent>
            </Card>
          )}

          {commercialFacilities.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /><span className="font-semibold text-sm">Commercial Facilities</span></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Type</TableHead><TableHead>Account</TableHead><TableHead>Institution</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {commercialFacilities.map(a => (
                      <TableRow key={a.id} data-testid={`row-facility-${a.id}`}>
                        <TableCell className="text-xs capitalize">{(a.accountType || "").replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs">{a.accountNumber}</TableCell>
                        <TableCell className="text-xs">{a.institutionName || "-"}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(Number(a.currentBalance || 0), currency)}</TableCell>
                        <TableCell><Badge variant={getStatusColor(a.status || "") as any} className="text-[10px] capitalize">{a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {otherAccounts.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /><span className="font-semibold text-sm">Other Credit Accounts</span></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Type</TableHead><TableHead>Account</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherAccounts.map(a => (
                      <TableRow key={a.id} data-testid={`row-account-${a.id}`}>
                        <TableCell className="text-xs capitalize">{(a.accountType || "").replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs">{a.accountNumber}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(Number(a.currentBalance || 0), currency)}</TableCell>
                        <TableCell><Badge variant={getStatusColor(a.status || "") as any} className="text-[10px] capitalize">{a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {judgments && judgments.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center gap-2"><Gavel className="w-4 h-4" /><span className="font-semibold text-sm">Court Judgments</span></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Case</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {judgments.map(j => (
                      <TableRow key={j.id} data-testid={`row-judgment-${j.id}`}>
                        <TableCell className="text-xs">{j.caseNumber}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(Number(j.amount || 0), currency)}</TableCell>
                        <TableCell><Badge variant={j.status === "satisfied" ? "default" : "destructive"} className="text-[10px] capitalize">{j.status}</Badge></TableCell>
                        <TableCell className="text-xs">{j.judgmentDate ? new Date(j.judgmentDate).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {inquiries && inquiries.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center gap-2"><FileCheck className="w-4 h-4" /><span className="font-semibold text-sm">Credit Inquiries</span></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Institution</TableHead><TableHead>Purpose</TableHead><TableHead>Date</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.slice(0, 10).map(inq => (
                      <TableRow key={inq.id} data-testid={`row-inquiry-${inq.id}`}>
                        <TableCell className="text-xs">{inq.institutionName || "-"}</TableCell>
                        <TableCell className="text-xs capitalize">{(inq.purpose || "").replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs">{inq.inquiryDate ? new Date(inq.inquiryDate).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/business-credit-report/${borrowerId}`)} data-testid="button-full-report">
              <FileText className="w-4 h-4 mr-2" />
              Full Business Credit Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
