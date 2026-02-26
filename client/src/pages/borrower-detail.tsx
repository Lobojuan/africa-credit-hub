import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Building2, Mail, Phone, MapPin, Briefcase, CreditCard, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import type { Borrower, CreditAccount, CreditInquiry } from "@shared/schema";

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
    queryKey: [`/api/borrowers/${borrowerId}/credit-report`],
    enabled: !!borrowerId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
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

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/borrowers")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-borrower-name">
            {isIndividual ? `${borrower.firstName} ${borrower.lastName}` : borrower.companyName}
          </h1>
          <p className="text-sm text-muted-foreground">{borrower.nationalId}</p>
        </div>
        <Badge variant="secondary" className="ml-2 capitalize">{borrower.type}</Badge>
      </div>

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
              <span>{[borrower.address, borrower.city, borrower.region].filter(Boolean).join(", ") || "—"}</span>
            </div>
            {borrower.sector && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{borrower.sector}</span>
              </div>
            )}
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
