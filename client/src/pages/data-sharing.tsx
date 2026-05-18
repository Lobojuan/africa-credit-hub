import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRightLeft, Clock, XCircle, CheckCircle2, Activity, Eye, Lock, Receipt } from "lucide-react";

interface CrossProductConsent {
  id: string;
  sourceProduct: string;
  targetProduct: string;
  purpose: string;
  status: "active" | "revoked" | "expired";
  scopeNote: string | null;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

interface CollateralCreditViewStatus {
  consent: CrossProductConsent | null;
  borrowerId: string | null;
}

interface FiscalReceiptsCreditStatus {
  consent: CrossProductConsent | null;
  borrowerId: string | null;
  receiptCount: number;
  receiptDateStart: string | null;
  receiptDateEnd: string | null;
}

const PRODUCT_LABEL: Record<string, { tKey: string; fallback: string }> = {
  loto: { tKey: "dataSharing.product.loto", fallback: "Loto Fiscal" },
  credit: { tKey: "dataSharing.product.credit", fallback: "Credit Bureau" },
  collateral: { tKey: "dataSharing.product.collateral", fallback: "Collateral Registry" },
};

const PURPOSE_LABEL: Record<string, { tKey: string; fallback: string }> = {
  merchant_credit_profile: { tKey: "dataSharing.purpose.merchant_credit_profile", fallback: "Build merchant credit profile" },
  consumer_spending_credit: { tKey: "dataSharing.purpose.consumer_spending_credit", fallback: "Use spending insights for credit scoring" },
  bureau_reputation_badge: { tKey: "dataSharing.purpose.bureau_reputation_badge", fallback: "Display bureau reputation badge" },
  collateral_credit_view: { tKey: "dataSharing.purpose.collateral_credit_view", fallback: "Show collateral on credit reports" },
  credit_collateral_view: { tKey: "dataSharing.purpose.credit_collateral_view", fallback: "Show credit summary on collateral pages" },
  fiscal_receipts_credit: { tKey: "dataSharing.purpose.fiscal_receipts_credit", fallback: "Use lottery receipt history for credit scoring" },
};

export default function DataSharingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "active" | "revoked">("all");

  const { data: consents, isLoading } = useQuery<CrossProductConsent[]>({
    queryKey: ["/api/cross-product/consents"],
  });

  const { data: ccvStatus, isLoading: ccvLoading } = useQuery<CollateralCreditViewStatus>({
    queryKey: ["/api/cross-product/consents/collateral-credit-view/me"],
  });

  const { data: frcStatus, isLoading: frcLoading } = useQuery<FiscalReceiptsCreditStatus>({
    queryKey: ["/api/cross-product/consents/fiscal-receipts-credit/me"],
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/cross-product/consents/${id}/revoke`, { reason: "user_revoked" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/collateral-credit-view/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/fiscal-receipts-credit/me"] });
      toast({
        title: t("dataSharing.toast.revokedTitle", "Permission revoked"),
        description: t("dataSharing.toast.revokedBody", "Data sharing for that purpose has stopped immediately."),
      });
    },
    onError: () => toast({
      title: t("common.error", "Error"),
      description: t("dataSharing.toast.revokeFailed", "Could not revoke that permission. Please try again."),
      variant: "destructive",
    }),
  });

  const grantCcvMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cross-product/consents/collateral-credit-view/grant", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/collateral-credit-view/me"] });
      toast({
        title: t("dataSharing.toast.grantedTitle", "Permission granted"),
        description: t("dataSharing.toast.ccvGrantedBody", "Secured creditors can now view your recent credit inquiries."),
      });
    },
    onError: (err: any) => {
      const msg = String(err?.message ?? "");
      const desc = msg.includes("no_linked_borrower")
        ? t("dataSharing.toast.noLinkedBorrower", "No borrower profile is linked to your account. Contact support.")
        : t("dataSharing.toast.grantFailed", "Could not grant that permission. Please try again.");
      toast({ title: t("common.error", "Error"), description: desc, variant: "destructive" });
    },
  });

  const grantFrcMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cross-product/consents/fiscal-receipts-credit/grant", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/fiscal-receipts-credit/me"] });
      toast({
        title: t("dataSharing.toast.grantedTitle", "Permission granted"),
        description: t("dataSharing.toast.frcGrantedBody", "Your lottery receipt history will now contribute to your credit score."),
      });
    },
    onError: (err: any) => {
      const msg = String(err?.message ?? "");
      const desc = msg.includes("no_linked_borrower")
        ? t("dataSharing.toast.noLinkedBorrower", "No borrower profile is linked to your account. Contact support.")
        : msg.includes("borrower_country_unresolvable")
        ? t("dataSharing.toast.countryUnresolvable", "Your country of registration could not be determined. Contact support.")
        : t("dataSharing.toast.grantFailed", "Could not grant that permission. Please try again.");
      toast({ title: t("common.error", "Error"), description: desc, variant: "destructive" });
    },
  });

  const revokeFrcMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cross-product/consents/fiscal-receipts-credit/revoke", { reason: "user_revoked" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/fiscal-receipts-credit/me"] });
      toast({
        title: t("dataSharing.toast.revokedTitle", "Permission revoked"),
        description: t("dataSharing.toast.frcRevokedBody", "Lottery receipt data has been removed from your credit profile."),
      });
    },
    onError: () => toast({
      title: t("common.error", "Error"),
      description: t("dataSharing.toast.revokeFailed", "Could not revoke that permission. Please try again."),
      variant: "destructive",
    }),
  });

  const ccvConsent = ccvStatus?.consent ?? null;
  const ccvExpired = ccvConsent?.status === "active" &&
    !!ccvConsent.expiresAt && new Date(ccvConsent.expiresAt) <= new Date();
  const ccvActive = ccvConsent?.status === "active" && !ccvExpired;
  const ccvConsentId = ccvStatus?.consent?.id;

  const frcConsent = frcStatus?.consent ?? null;
  const frcExpired = frcConsent?.status === "active" &&
    !!frcConsent.expiresAt && new Date(frcConsent.expiresAt) <= new Date();
  const frcActive = frcConsent?.status === "active" && !frcExpired;
  const frcConsentId = frcStatus?.consent?.id;

  function handleCcvToggle(checked: boolean) {
    if (checked) {
      grantCcvMutation.mutate();
    } else if (ccvConsentId) {
      revokeMutation.mutate(ccvConsentId);
    }
  }

  function handleFrcToggle(checked: boolean) {
    if (checked) {
      grantFrcMutation.mutate();
    } else {
      revokeFrcMutation.mutate();
    }
  }

  const filtered = (consents ?? []).filter(c => filter === "all" ? true : c.status === filter);
  const activeCount = (consents ?? []).filter(c => c.status === "active").length;
  const revokedCount = (consents ?? []).filter(c => c.status === "revoked").length;

  const isCcvPending = grantCcvMutation.isPending || revokeMutation.isPending;
  const isFrcPending = grantFrcMutation.isPending || revokeFrcMutation.isPending;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto" data-testid="page-data-sharing">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-emerald-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-data-sharing-title">
            {t("dataSharing.title", "My Data Sharing")}
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          {t("dataSharing.subtitle", "Every cross-product data flow on Universal Credit Hub requires your consent. Review what is shared, with whom, for what purpose — and stop it instantly.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="card-active-consents">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold" data-testid="text-active-count">{activeCount}</div>
              <div className="text-xs text-muted-foreground">{t("dataSharing.activeCount", "Active permissions")}</div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-revoked-consents">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-2xl font-bold" data-testid="text-revoked-count">{revokedCount}</div>
              <div className="text-xs text-muted-foreground">{t("dataSharing.revokedCount", "Revoked permissions")}</div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-default-duration">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-muted-foreground">{t("dataSharing.defaultDuration", "Default consent (months)")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collateral credit-view self-service toggle */}
      <Card className="mb-4 border-blue-200 dark:border-blue-900" data-testid="card-collateral-credit-view">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {t("dataSharing.ccv.title", "Secured creditor inquiry access")}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {t("dataSharing.ccv.description", "Allow secured creditors to view your recent credit inquiries alongside any collateral they hold. Revoke at any time.")}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              {ccvLoading ? (
                <Skeleton className="h-6 w-11 rounded-full" data-testid="skeleton-ccv-toggle" />
              ) : (
                <Switch
                  checked={ccvActive}
                  onCheckedChange={handleCcvToggle}
                  disabled={isCcvPending || !ccvStatus?.borrowerId}
                  data-testid="toggle-collateral-credit-view"
                  aria-label={t("dataSharing.ccv.toggleLabel", "Toggle secured creditor inquiry access")}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs font-medium" data-testid="badge-ccv-source">
                {t(PRODUCT_LABEL.credit.tKey, PRODUCT_LABEL.credit.fallback)}
              </Badge>
              <ArrowRightLeft className="w-3 h-3" />
              <Badge variant="outline" className="text-xs font-medium" data-testid="badge-ccv-target">
                {t(PRODUCT_LABEL.collateral.tKey, PRODUCT_LABEL.collateral.fallback)}
              </Badge>
            </div>
            {ccvActive && ccvStatus?.consent && (
              <span data-testid="text-ccv-granted-at">
                {t("dataSharing.granted", "Granted")}: {new Date(ccvStatus.consent.grantedAt).toLocaleDateString()}
                {" · "}
                {t("dataSharing.expires", "Expires")}: {new Date(ccvStatus.consent.expiresAt).toLocaleDateString()}
              </span>
            )}
            {ccvStatus?.consent?.status === "revoked" && ccvStatus.consent.revokedAt && (
              <span className="text-muted-foreground" data-testid="text-ccv-revoked-at">
                {t("dataSharing.revoked", "Revoked")}: {new Date(ccvStatus.consent.revokedAt).toLocaleDateString()}
              </span>
            )}
            {!ccvStatus?.borrowerId && !ccvLoading && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" data-testid="text-ccv-no-borrower">
                <Lock className="w-3 h-3" />
                {t("dataSharing.ccv.noBorrower", "No borrower profile linked to your account")}
              </span>
            )}
            <Badge
              variant={ccvActive ? "default" : "secondary"}
              className={ccvActive ? "bg-emerald-600" : ""}
              data-testid="badge-ccv-status"
            >
              {ccvLoading ? "…" : ccvActive
                ? t("dataSharing.status.active", "active")
                : ccvExpired
                  ? t("dataSharing.status.expired", "expired")
                  : t("dataSharing.status.revoked", "revoked")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fiscal receipts → credit score self-service toggle */}
      <Card className="mb-6 border-orange-200 dark:border-orange-900" data-testid="card-fiscal-receipts-credit">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {t("dataSharing.frc.title", "Share lottery receipt history with credit bureau")}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {t("dataSharing.frc.description", "Allow the credit bureau to use your verified Loto Fiscal VAT receipts as alternative data for credit scoring. Especially helpful if you have a thin credit file.")}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              {frcLoading ? (
                <Skeleton className="h-6 w-11 rounded-full" data-testid="skeleton-frc-toggle" />
              ) : (
                <Switch
                  checked={frcActive}
                  onCheckedChange={handleFrcToggle}
                  disabled={isFrcPending || !frcStatus?.borrowerId || (!frcActive && (frcStatus?.receiptCount ?? 0) === 0)}
                  data-testid="toggle-fiscal-receipts-credit"
                  aria-label={t("dataSharing.frc.toggleLabel", "Toggle lottery receipt history sharing")}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs font-medium" data-testid="badge-frc-source">
                {t(PRODUCT_LABEL.loto.tKey, PRODUCT_LABEL.loto.fallback)}
              </Badge>
              <ArrowRightLeft className="w-3 h-3" />
              <Badge variant="outline" className="text-xs font-medium" data-testid="badge-frc-target">
                {t(PRODUCT_LABEL.credit.tKey, PRODUCT_LABEL.credit.fallback)}
              </Badge>
            </div>
            {frcStatus?.receiptCount !== undefined && frcStatus.receiptCount > 0 && (
              <span className="text-muted-foreground" data-testid="text-frc-receipt-count">
                {frcStatus.receiptDateStart && frcStatus.receiptDateEnd
                  ? t("dataSharing.frc.receiptCountWithDates", "Based on {{count}} receipts ({{start}} – {{end}})", {
                      count: frcStatus.receiptCount,
                      start: new Date(frcStatus.receiptDateStart).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                      end: new Date(frcStatus.receiptDateEnd).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                    })
                  : t("dataSharing.frc.receiptCount", "Based on {{count}} verified receipts", { count: frcStatus.receiptCount })}
              </span>
            )}
            {frcActive && frcStatus?.consent && (
              <span data-testid="text-frc-granted-at">
                {t("dataSharing.granted", "Granted")}: {new Date(frcStatus.consent.grantedAt).toLocaleDateString()}
                {" · "}
                {t("dataSharing.expires", "Expires")}: {new Date(frcStatus.consent.expiresAt).toLocaleDateString()}
              </span>
            )}
            {frcStatus?.consent?.status === "revoked" && frcStatus.consent.revokedAt && (
              <span className="text-muted-foreground" data-testid="text-frc-revoked-at">
                {t("dataSharing.revoked", "Revoked")}: {new Date(frcStatus.consent.revokedAt).toLocaleDateString()}
              </span>
            )}
            {!frcStatus?.borrowerId && !frcLoading && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" data-testid="text-frc-no-borrower">
                <Lock className="w-3 h-3" />
                {t("dataSharing.frc.noBorrower", "No borrower profile linked to your account")}
              </span>
            )}
            {frcStatus?.borrowerId && !frcLoading && (frcStatus?.receiptCount ?? 0) === 0 && (
              <span className="flex items-center gap-1 text-slate-500" data-testid="text-frc-no-receipts">
                <Receipt className="w-3 h-3" />
                {t("dataSharing.frc.noReceipts", "No lottery receipt history found")}
              </span>
            )}
            <Badge
              variant={frcActive ? "default" : "secondary"}
              className={frcActive ? "bg-emerald-600" : ""}
              data-testid="badge-frc-status"
            >
              {frcLoading ? "…" : frcActive
                ? t("dataSharing.status.active", "active")
                : frcExpired
                  ? t("dataSharing.status.expired", "expired")
                  : t("dataSharing.status.revoked", "revoked")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-4">
        {(["all", "active", "revoked"] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f}`}
          >
            {t(`dataSharing.filter.${f}`, f)}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card data-testid="card-empty-state">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t("dataSharing.empty", "You haven't shared any data across products yet.")}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(consent => {
          const isActive = consent.status === "active";
          const sourceLabel = t(PRODUCT_LABEL[consent.sourceProduct]?.tKey ?? consent.sourceProduct, PRODUCT_LABEL[consent.sourceProduct]?.fallback ?? consent.sourceProduct);
          const targetLabel = t(PRODUCT_LABEL[consent.targetProduct]?.tKey ?? consent.targetProduct, PRODUCT_LABEL[consent.targetProduct]?.fallback ?? consent.targetProduct);
          const purposeLabel = t(PURPOSE_LABEL[consent.purpose]?.tKey ?? consent.purpose, PURPOSE_LABEL[consent.purpose]?.fallback ?? consent.purpose);
          return (
            <Card key={consent.id} data-testid={`card-consent-${consent.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium" data-testid={`badge-source-${consent.id}`}>{sourceLabel}</Badge>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-medium" data-testid={`badge-target-${consent.id}`}>{targetLabel}</Badge>
                  </div>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-emerald-600" : ""}
                    data-testid={`badge-status-${consent.id}`}
                  >
                    {t(`dataSharing.status.${consent.status}`, consent.status)}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2" data-testid={`text-purpose-${consent.id}`}>{purposeLabel}</CardTitle>
                {consent.scopeNote && (
                  <CardDescription data-testid={`text-scope-${consent.id}`}>{consent.scopeNote}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="text-muted-foreground space-x-4">
                    <span data-testid={`text-granted-${consent.id}`}>
                      {t("dataSharing.granted", "Granted")}: {new Date(consent.grantedAt).toLocaleDateString()}
                    </span>
                    <span data-testid={`text-expires-${consent.id}`}>
                      {t("dataSharing.expires", "Expires")}: {new Date(consent.expiresAt).toLocaleDateString()}
                    </span>
                    {consent.revokedAt && (
                      <span data-testid={`text-revoked-at-${consent.id}`}>
                        {t("dataSharing.revoked", "Revoked")}: {new Date(consent.revokedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => revokeMutation.mutate(consent.id)}
                      disabled={revokeMutation.isPending}
                      data-testid={`button-revoke-${consent.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t("dataSharing.revokeButton", "Revoke now")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid="card-bridge-promise">
        <CardContent className="p-5 flex gap-3 items-start">
          <Activity className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">{t("dataSharing.promiseTitle", "The Bridge Promise")}</p>
            <p className="text-muted-foreground">
              {t("dataSharing.promiseBody", "Every cross-product access goes through one gateway. Every access is logged. Default consent lasts 12 months and you can revoke at any time. No silent fallbacks.")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
