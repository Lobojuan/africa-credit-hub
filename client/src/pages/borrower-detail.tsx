import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Building2, Mail, Phone, MapPin, Briefcase, CreditCard, AlertTriangle, TrendingUp, FileText, Flag, GraduationCap, Users, Link2, ClipboardList, Camera, Upload, IdCard, Brain, Loader2, ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { getBorrowerAvatarUrl } from "@/lib/avatar";
import type { Borrower, CreditAccount, CreditInquiry, CourtJudgment, ConsentRecord } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gavel, FileCheck } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getStatusColor(status: string) {
  switch (status) {
    case "current": return "default";
    case "delinquent": return "destructive";
    case "default": return "destructive";
    case "closed": return "secondary";
    default: return "default";
  }
}

function getCreditScoreColor(score: number) {
  if (score >= 750) return "text-green-600 dark:text-green-400";
  if (score >= 650) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function BorrowerDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/borrowers/:id");
  const [, navigate] = useLocation();
  const borrowerId = params?.id;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [aiRisk, setAiRisk] = useState<any>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  const aiRiskMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ai/credit-risk/${borrowerId}`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("AI analysis failed");
      return res.json();
    },
    onSuccess: (data) => {
      setAiRisk(data);
      setAiExpanded(true);
      toast({ title: "AI Risk Analysis Complete" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/borrowers/${borrowerId}/photo`, {
        method: "POST", body: formData, credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/borrowers', borrowerId, 'credit-report'] });
      toast({ title: t("borrowerDetail.photoUploaded") });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch(`/api/borrowers/${borrowerId}/id-document`, {
        method: "POST", body: formData, credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/borrowers', borrowerId, 'credit-report'] });
      toast({ title: t("borrowerDetail.documentUploaded") });
    },
  });

  function getCreditScoreLabel(score: number) {
    if (score >= 750) return t("borrowerDetail.excellent");
    if (score >= 700) return t("borrowerDetail.good");
    if (score >= 650) return t("borrowerDetail.fair");
    if (score >= 600) return t("borrowerDetail.poor");
    return t("borrowerDetail.veryPoor");
  }

  const { data: report, isLoading } = useQuery<{
    borrower: Borrower;
    accounts: CreditAccount[];
    inquiries: CreditInquiry[];
    summary: {
      totalAccounts: number;
      activeAccounts: number;
      totalDebt: string;
      delinquentAccounts: number;
      creditScore: number;
      inquiryCount: number;
    };
  }>({
    queryKey: ['/api/borrowers', borrowerId, 'credit-report'],
    queryFn: async () => {
      const res = await fetch(`/api/borrowers/${borrowerId}/credit-report`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!borrowerId,
  });

  const { data: relatedBorrowers } = useQuery<Borrower[]>({
    queryKey: ['/api/borrowers', borrowerId, 'related'],
    queryFn: async () => {
      const res = await fetch(`/api/borrowers/${borrowerId}/related`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!borrowerId,
  });

  const { data: courtJudgments } = useQuery<CourtJudgment[]>({
    queryKey: ['/api/court-judgments', borrowerId],
    queryFn: async () => {
      const res = await fetch(`/api/court-judgments?borrowerId=${borrowerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!borrowerId,
  });

  const { data: consentRecords } = useQuery<ConsentRecord[]>({
    queryKey: ['/api/consent-records', borrowerId],
    queryFn: async () => {
      const res = await fetch(`/api/consent-records?borrowerId=${borrowerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!borrowerId,
  });

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/borrowers")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />{t("borrowerDetail.back")}
        </Button>
        <Card className="mt-4"><CardContent className="p-12 text-center"><p>{t("borrowerDetail.notFound")}</p></CardContent></Card>
      </div>
    );
  }

  const { borrower, accounts, inquiries, summary } = report;
  const isIndividual = borrower.type === "individual";
  const displayName = isIndividual ? `${borrower.firstName} ${borrower.lastName}` : (borrower.companyName || "");
  const avatarUrl = (borrower as any).photoUrl || getBorrowerAvatarUrl(borrower.id, displayName, borrower.type as "individual" | "corporate");

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto">
      <input type="file" ref={photoInputRef} className="hidden" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhotoMutation.mutate(f); }}
        data-testid="input-upload-photo"
      />
      <input type="file" ref={docInputRef} className="hidden" accept="image/*,application/pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocMutation.mutate(f); }}
        data-testid="input-upload-document"
      />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/borrowers")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="relative group">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm"
            data-testid="img-borrower-photo"
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            data-testid="button-change-photo"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-borrower-name">
            {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">{borrower.nationalId}</p>
        </div>
        <Badge variant="secondary" className="ml-2 capitalize">{borrower.type}</Badge>
        {borrower.isPep && (
          <Badge variant="destructive" className="ml-1" data-testid="badge-pep">
            <Flag className="w-3 h-3 mr-1" />
            {t("borrowerDetail.pepFlag")}
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => docInputRef.current?.click()}
            disabled={uploadDocMutation.isPending}
            data-testid="button-upload-id-document"
          >
            <IdCard className="w-4 h-4 mr-2" />
            {uploadDocMutation.isPending ? t("borrowerDetail.uploading") : t("borrowerDetail.uploadIdDoc")}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/credit-report/${borrowerId}`)}
            data-testid="button-generate-full-report"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Full Credit Report
          </Button>
          <Button
            size="sm"
            onClick={() => aiRiskMutation.mutate()}
            disabled={aiRiskMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            data-testid="button-ai-risk-analysis"
          >
            {aiRiskMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            AI Risk Analysis
          </Button>
        </div>
      </div>

      {aiRisk && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setAiExpanded(!aiExpanded)} data-testid="toggle-ai-risk-panel">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  aiRisk.riskLevel === "low" ? "bg-green-100 dark:bg-green-900/30" :
                  aiRisk.riskLevel === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                  aiRisk.riskLevel === "high" ? "bg-orange-100 dark:bg-orange-900/30" :
                  "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {aiRisk.riskLevel === "low" ? <ShieldCheck className="w-5 h-5 text-green-600" /> :
                   aiRisk.riskLevel === "medium" ? <ShieldAlert className="w-5 h-5 text-yellow-600" /> :
                   <ShieldX className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-sm">AI Risk Assessment</span>
                    <Badge variant={
                      aiRisk.riskLevel === "low" ? "default" :
                      aiRisk.riskLevel === "medium" ? "secondary" : "destructive"
                    } className="text-[10px]">
                      {aiRisk.riskLevel?.toUpperCase()} RISK — Score: {aiRisk.riskScore}/100
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{aiRisk.summary}</p>
                </div>
              </div>
              {aiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {aiExpanded && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Separator />
                {aiRisk.factors?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Risk Factors</h4>
                    <div className="space-y-2">
                      {aiRisk.factors.map((f: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            f.impact === "positive" ? "bg-green-500" :
                            f.impact === "negative" ? "bg-red-500" : "bg-gray-400"
                          }`} />
                          <div>
                            <span className="font-medium">{f.factor}:</span>{" "}
                            <span className="text-muted-foreground">{f.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiRisk.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Recommendations</h4>
                    <ul className="space-y-1">
                      {aiRisk.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 mt-1 text-purple-500 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiRisk.regulatoryFlags?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Regulatory Flags</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiRisk.regulatoryFlags.map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[11px] border-orange-300 text-orange-700 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />{f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${getCreditScoreColor(summary.creditScore)}`} data-testid="text-credit-score">
              {summary.creditScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("borrowerDetail.creditScore")}</p>
            <Badge variant="outline" className="mt-1 text-[10px]">{getCreditScoreLabel(summary.creditScore)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{summary.totalAccounts}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("borrowerDetail.totalAccounts")}</p>
            <p className="text-[11px] text-muted-foreground">{summary.activeAccounts} {t("borrowerDetail.active")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formatCurrency(summary.totalDebt)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("borrowerDetail.totalOutstanding")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{summary.delinquentAccounts}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("borrowerDetail.delinquent")}</p>
            <p className="text-[11px] text-muted-foreground">{summary.inquiryCount} {t("borrowerDetail.inquiriesCount")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {isIndividual ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {t("borrowerDetail.personalInfo")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t("borrowerDetail.country")} value={borrower.country || "—"} />
            <InfoRow label={t("borrowerDetail.tinNumber")} value={borrower.tinNumber || "—"} />
            <InfoRow label={t("borrowerDetail.passportNumber")} value={borrower.passportNumber || "—"} />
            {isIndividual && (
              <>
                <InfoRow label={t("borrowerDetail.dateOfBirth")} value={borrower.dateOfBirth || "—"} />
                <InfoRow label={t("borrowerDetail.gender")} value={borrower.gender || "—"} />
                <InfoRow label={t("borrowerDetail.employer")} value={borrower.employerName || "—"} />
                <InfoRow label={t("borrowerDetail.occupation")} value={borrower.occupation || "—"} />
              </>
            )}
            {!isIndividual && (
              <InfoRow label={t("borrowerDetail.businessReg")} value={borrower.businessRegNumber || "—"} />
            )}
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{borrower.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{borrower.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{[borrower.address, borrower.city, borrower.region, borrower.country].filter(Boolean).join(", ") || "—"}</span>
            </div>
            {borrower.sector && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{borrower.sector}</span>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" />
                {t("borrowerDetail.idDocument")}
              </p>
              {(borrower as any).idDocumentUrl ? (
                <div className="relative group rounded-lg overflow-hidden border">
                  <img
                    src={(borrower as any).idDocumentUrl}
                    alt="ID Document"
                    className="w-full h-auto max-h-48 object-contain bg-muted"
                    data-testid="img-id-document"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => docInputRef.current?.click()} data-testid="button-replace-document">
                      <Upload className="w-3.5 h-3.5 mr-1" />{t("borrowerDetail.replace")}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  data-testid="button-upload-first-document"
                >
                  <IdCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t("borrowerDetail.uploadIdDocPrompt")}</p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t("borrowerDetail.creditAccounts")}
              </h3>
              <Badge variant="secondary" className="text-[10px]">{accounts.length} {t("borrowerDetail.accounts")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accounts.length > 0 ? (
              <div className="divide-y">
                {accounts.map((account) => {
                  const currency = (account as any).currency || "ETB";
                  return (
                    <div key={account.id} className="px-5 py-4 space-y-2" data-testid={`row-credit-${account.id}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{account.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">{account.lenderInstitution} &middot; {account.accountType}</p>
                        </div>
                        <Badge variant={getStatusColor(account.status)} className="text-[10px] capitalize shrink-0">{account.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div><span className="text-muted-foreground">{t("borrowerDetail.original")}</span> <span className="font-medium">{formatCurrency(account.originalAmount, currency)}</span></div>
                        <div><span className="text-muted-foreground">{t("borrowerDetail.balance")}</span> <span className="font-medium">{formatCurrency(account.currentBalance, currency)}</span></div>
                        <div><span className="text-muted-foreground">{t("borrowerDetail.rate")}</span> <span className="font-medium">{account.interestRate || "—"}%</span></div>
                        <div><span className="text-muted-foreground">{t("borrowerDetail.arrears")}</span> <span className={`font-medium ${(account.daysInArrears || 0) > 0 ? "text-destructive" : ""}`}>{account.daysInArrears || 0} {t("borrowerDetail.days")}</span></div>
                      </div>
                      {account.collateralType && (
                        <p className="text-xs text-muted-foreground">{t("borrowerDetail.collateral")} {account.collateralType} — {formatCurrency(account.collateralValue || "0", currency)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("borrowerDetail.noAccounts")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("borrowerDetail.creditInquiries")}
            </h3>
            <Badge variant="secondary" className="text-[10px]">{inquiries.length} {t("borrowerDetail.inquiriesCount")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {inquiries.length > 0 ? (
            <div className="divide-y">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{inquiry.institution}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inquiry.purpose.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inquiry.consentProvided ? "default" : "destructive"} className="text-[10px]">
                      {inquiry.consentProvided ? t("borrowerDetail.consentGiven") : t("borrowerDetail.noConsent")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString("en-GB") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("borrowerDetail.noInquiries")}</div>
          )}
        </CardContent>
      </Card>

      {borrower.isPep && (
        <Card data-testid="section-pep">
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              {t("borrowerDetail.pepFlag")}
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{borrower.pepDetails || t("borrowerDetail.pepNoDetails")}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(borrower.educationLevel || borrower.educationInstitution) && (
          <Card data-testid="section-education">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t("borrowerDetail.education")}
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {borrower.educationLevel && (
                <InfoRow label={t("borrowerDetail.educationLevel")} value={t(`borrowers.educationLevels.${borrower.educationLevel}`, borrower.educationLevel)} />
              )}
              {borrower.educationInstitution && (
                <InfoRow label={t("borrowerDetail.educationInstitution")} value={borrower.educationInstitution} />
              )}
            </CardContent>
          </Card>
        )}

        {borrower.employmentHistory && (
          <Card data-testid="section-employment-history">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {t("borrowerDetail.employmentHistory")}
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{borrower.employmentHistory}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {courtJudgments && courtJudgments.length > 0 && (
        <Card data-testid="section-court-judgments">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="w-4 h-4 text-destructive" />
                {t("borrowerDetail.courtJudgments")}
              </h3>
              <Badge variant="destructive" className="text-[10px]">{courtJudgments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("borrowerDetail.caseNumber")}</TableHead>
                  <TableHead>{t("borrowerDetail.court")}</TableHead>
                  <TableHead>{t("borrowerDetail.judgmentType")}</TableHead>
                  <TableHead>{t("borrowerDetail.amount")}</TableHead>
                  <TableHead>{t("borrowerDetail.judgmentDate")}</TableHead>
                  <TableHead>{t("approvals.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courtJudgments.map((j) => (
                  <TableRow key={j.id} data-testid={`row-judgment-${j.id}`}>
                    <TableCell className="text-sm font-medium">{j.caseNumber}</TableCell>
                    <TableCell className="text-sm">{j.court}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{j.judgmentType.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="text-sm">{j.amount ? formatCurrency(j.amount) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{j.judgmentDate || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={j.status === "active" ? "destructive" : j.status === "resolved" ? "default" : "secondary"} className="text-[10px] capitalize">
                        {j.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {consentRecords && consentRecords.length > 0 && (
        <Card data-testid="section-consent-records">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                {t("borrowerDetail.consentRecords")}
              </h3>
              <Badge variant="secondary" className="text-[10px]">{consentRecords.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("borrowerDetail.grantedTo")}</TableHead>
                  <TableHead>{t("borrowerDetail.purpose")}</TableHead>
                  <TableHead>{t("borrowerDetail.consentType")}</TableHead>
                  <TableHead>{t("approvals.status")}</TableHead>
                  <TableHead>{t("borrowerDetail.receiptNumber")}</TableHead>
                  <TableHead>{t("borrowerDetail.grantedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consentRecords.map((c) => (
                  <TableRow key={c.id} data-testid={`row-consent-${c.id}`}>
                    <TableCell className="text-sm font-medium">{c.grantedTo}</TableCell>
                    <TableCell className="text-sm">{c.purpose}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.consentType}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-[10px] capitalize">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{c.receiptNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {relatedBorrowers && relatedBorrowers.length > 0 && (
        <Card data-testid="section-related-parties">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                {t("borrowerDetail.relatedParties")}
              </h3>
              <Badge variant="secondary" className="text-[10px]">{relatedBorrowers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="divide-y">
              {relatedBorrowers.map((related) => (
                <div
                  key={related.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 cursor-pointer hover-elevate"
                  onClick={() => navigate(`/borrowers/${related.id}`)}
                  data-testid={`row-related-${related.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent shrink-0">
                      {related.type === "corporate" ? (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {related.type === "corporate" ? related.companyName : `${related.firstName} ${related.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{related.nationalId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {related.id === borrower.relatedBorrowerId && borrower.relationshipType ? (
                      <Badge variant="outline" className="text-[10px] capitalize">{borrower.relationshipType.replace(/_/g, " ")}</Badge>
                    ) : related.relationshipType ? (
                      <Badge variant="outline" className="text-[10px] capitalize">{related.relationshipType.replace(/_/g, " ")}</Badge>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
