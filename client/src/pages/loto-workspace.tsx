import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Ticket, ScanLine, Activity, Award, Receipt, ShieldCheck, TrendingUp, Building2, ArrowRight, Bell, BadgeCheck, ShieldAlert, Sparkles, CheckCircle2, XCircle, FileSearch, Calculator, Flag, BarChart2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PRODUCT_REGISTRY } from "@/lib/products";
import { LotoLotteryExperience } from "@/components/loto-lottery-experience";
import { getTaxAuthorityProfile } from "@shared/tax-authority";

interface FiscalConfig {
  id: string;
  countryCode: string;
  fiscalIdLabel: string;
  fiscalIdRegex: string;
  adapterKey: string;
  authorityName: string;
  currencySymbol: string;
}

interface MerchantPayload {
  merchant: {
    id: string; shopName: string; ownerName: string | null; vatRegistrationNumber: string | null;
    city: string | null; countryCode: string; currency: string; creditOptInActive: boolean;
    borrowerId: string | null;
    fiscalId: string | null; fiscalIdType: string | null; fiscalIdVerified: boolean;
  } | null;
  receipts: { id: string; ticketNumber: string; amount: string; vatAmount: string; currency: string; issuedAt: string; category: string | null }[];
  features: {
    totalReceipts: number; totalTurnover: number; averageMonthlyTurnover: number;
    monthsWithActivity: number; trend: string; vatActivityScore: number; currency: string;
    monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
  } | null;
}

interface FiscalAccountKpis {
  receiptsThisMonth: number; receiptsThisYear: number;
  vatThisMonth: number; vatThisYear: number;
  currency: string; complianceScore: number;
  complianceBreakdown: Record<string, number>;
}
interface FiscalLedgerItem {
  id: string; fiscalCode: string; ticketNumber: string;
  amount: string; vatAmount: string; currency: string;
  issuedAt: string; category: string | null;
  isDemo: boolean;
  status: "valid" | "flagged" | "demo" | "expired"; flagId: string | null;
  flagRuleCode: string | null; flagStatus: string | null;
  rejectionReason: string | null;
}
interface FiscalAccountPayload {
  merchant: MerchantPayload["merchant"];
  fiscalConfig: { currencySymbol: string; fiscalIdLabel: string; authorityName: string } | null;
  kpis: FiscalAccountKpis;
  monthlyTrend: { month: string; receipts: number; vat: number; turnover: number }[];
  ledger: { items: FiscalLedgerItem[]; total: number; page: number; limit: number };
}

interface ConsumerPayload {
  receipts: { id: string; amount: string; currency: string; issuedAt: string; category: string | null }[];
  features: {
    totalReceipts: number; totalTurnover: number; monthsWithActivity: number;
    averageMonthlyTurnover: number; currency: string;
    monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
  };
}

// Slim shape of a cross-product consent row for client-side filtering.
// Mirrors the fields the consents endpoint returns; kept narrow so the Loto
// page does not depend on credit-bureau internals.
interface ConsentRow {
  id: string;
  status: "active" | "revoked" | "expired";
  purpose: string;
  sourceProduct: string;
  targetProduct: string;
  expiresAt: string | null;
}

export default function LotoWorkspacePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const loto = PRODUCT_REGISTRY.loto;

  useEffect(() => {
    document.title = `${t("products.loto.name", loto.englishName)} — ${t("loto.pageSubtitle")}`;
  }, [t, loto]);

  const merchantQ = useQuery<MerchantPayload>({ queryKey: ["/api/loto/merchants/me/receipts"] });
  const consumerQ = useQuery<ConsumerPayload>({ queryKey: ["/api/loto/consumers/me/spending"] });
  const consentsQ = useQuery<ConsentRow[]>({ queryKey: ["/api/cross-product/consents"] });

  const [activeTab, setActiveTab] = useState("lottery");
  const fiscalAccountQ = useQuery<FiscalAccountPayload>({
    queryKey: ["/api/loto/merchant/fiscal-account"],
    enabled: activeTab === "fiscal-account",
    retry: false,
  });

  const [flaggingReceiptId, setFlaggingReceiptId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const flagMutation = useMutation({
    mutationFn: async ({ receiptId, reason }: { receiptId: string; reason: string }) => {
      const r = await apiRequest("POST", `/api/loto/merchant/receipts/${receiptId}/flag`, { reason });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Flag failed");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/merchant/fiscal-account"] });
      setFlaggingReceiptId(null);
      setFlagReason("");
      toast({ title: t("loto.fiscalAccount.flagSuccess", "Receipt flagged for DGI review") });
    },
    onError: (e: unknown) => {
      toast({
        title: t("loto.fiscalAccount.flagError", "Could not flag receipt"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const merchant = merchantQ.data?.merchant ?? null;
  const merchantCountry = merchant?.countryCode ?? null;

  const fiscalConfigQ = useQuery<FiscalConfig>({
    queryKey: ["/api/loto/fiscal-config", merchantCountry],
    queryFn: async () => {
      if (!merchantCountry) throw new Error("no country");
      const r = await fetch(`/api/loto/fiscal-config?countryCode=${merchantCountry}`, { credentials: "include" });
      if (!r.ok) throw new Error("No fiscal config");
      return r.json();
    },
    enabled: !!merchantCountry,
    retry: false,
  });

  const [fiscalIdInput, setFiscalIdInput] = useState("");
  const [fiscalVerifyResult, setFiscalVerifyResult] = useState<{
    verified: boolean; message: string; authorityName?: string;
  } | null>(null);

  const fiscalIdMutation = useMutation({
    mutationFn: async (fiscalId: string) => {
      const r = await apiRequest("PUT", "/api/loto/merchants/me/fiscal-id", { fiscalId });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Verification failed");
      }
      return r.json() as Promise<{ merchant: MerchantPayload["merchant"]; verification: { verified: boolean; message: string; authorityName?: string } }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/merchants/me/receipts"] });
      setFiscalVerifyResult(data.verification);
      toast({
        title: data.verification.verified
          ? t("loto.fiscal.verifiedTitle", "Fiscal ID verified")
          : t("loto.fiscal.notVerifiedTitle", "Fiscal ID not verified"),
        description: data.verification.message,
        variant: data.verification.verified ? "default" : "destructive",
      });
    },
    onError: (e: unknown) => {
      setFiscalVerifyResult(null);
      toast({
        title: t("loto.fiscal.errorTitle", "Could not verify fiscal ID"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const merchantOptInMutation = useMutation({
    mutationFn: (enable: boolean) => apiRequest("POST", "/api/loto/merchants/me/credit-opt-in", { enable }),
    onSuccess: (_d, enable) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/merchants/me/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      toast({
        title: enable ? t("loto.optIn.toastEnabledTitle", "Credit profile sharing enabled") : t("loto.optIn.toastDisabledTitle", "Credit profile sharing stopped"),
        description: enable ? t("loto.optIn.toastEnabledBody", "Lenders can now use your verified VAT receipts to assess credit. You can stop this any time.") : t("loto.optIn.toastDisabledBody", "Lenders can no longer access your VAT receipt history."),
      });
    },
    onError: () => toast({ title: t("common.error"), description: t("loto.optIn.toastError", "Could not update sharing setting."), variant: "destructive" }),
  });

  const consumerOptInMutation = useMutation({
    mutationFn: (enable: boolean) => apiRequest("POST", "/api/loto/consumers/me/credit-opt-in", { enable }),
    onSuccess: (_d, enable) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      toast({
        title: enable ? t("loto.consumerOptIn.toastEnabledTitle", "Spending insights shared") : t("loto.consumerOptIn.toastDisabledTitle", "Spending insights revoked"),
      });
    },
  });

  const consumerOptedIn = (consentsQ.data ?? []).some((c) => c.status === "active" && c.purpose === "consumer_spending_credit");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto" data-testid="page-loto-workspace">
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${loto.accentFrom}, ${loto.accentTo})` }}
        >
          <Ticket className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-loto-title">
              {t("products.loto.name", loto.englishName)}
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
              {t("products.loto.badge", loto.englishBadge ?? "Pilot launching Q3 2026")}
            </Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground" data-testid="text-loto-subtitle">
            {t("loto.pageSubtitle")}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full md:w-auto bg-muted p-1 rounded-lg">
          <TabsTrigger value="lottery" data-testid="tab-lottery" className="flex-1 min-w-fit">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            {t("loto.tabs.lottery", "Lottery")}
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview" className="flex-1 min-w-fit">{t("loto.tabs.overview", "Overview")}</TabsTrigger>
          <TabsTrigger value="receipts" data-testid="tab-receipts" className="flex-1 min-w-fit">{t("loto.tabs.receipts", "Receipts")}</TabsTrigger>
          <TabsTrigger value="spending" data-testid="tab-spending" className="flex-1 min-w-fit">{t("loto.tabs.spending", "Spending")}</TabsTrigger>
          <TabsTrigger value="credit-profile" data-testid="tab-credit-profile" className="flex-1 min-w-fit">{t("loto.tabs.creditProfile", "Build Credit")}</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications" className="flex-1 min-w-fit">{t("lotoNotifications.tabTitle")}</TabsTrigger>
          {merchant && (
            <TabsTrigger value="fiscal-account" data-testid="tab-fiscal-account" className="flex-1 min-w-fit">
              <Calculator className="w-3.5 h-3.5 mr-1.5" />
              {t("loto.tabs.fiscalAccount", "Mon Compte Fiscal")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="lottery" className="mt-4">
          <LotoLotteryExperience
            receipts={(() => {
              // Lottery tickets = receipts the user has scanned as a consumer
              // PLUS receipts their own merchant issued (if any). Each receipt
              // is one ticket regardless of which side they're on. Dedupe by
              // id so a self-purchase isn't double-counted.
              const all = [
                ...(consumerQ.data?.receipts ?? []),
                ...(merchantQ.data?.receipts ?? []),
              ];
              const seen = new Set<string>();
              return all
                .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
                .map((r) => ({
                  id: r.id,
                  amount: r.amount,
                  vatAmount: (r as { vatAmount?: string }).vatAmount,
                  issuedAt: r.issuedAt,
                }));
            })()}
            totalTurnover={merchantQ.data?.features?.totalTurnover ?? consumerQ.data?.features?.totalTurnover ?? 0}
            monthsWithActivity={merchantQ.data?.features?.monthsWithActivity ?? consumerQ.data?.features?.monthsWithActivity ?? 0}
            currency={merchantQ.data?.features?.currency ?? consumerQ.data?.features?.currency ?? "XOF"}
            isMerchant={!!merchant}
            onScanComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/loto/consumers/me/spending"] });
              queryClient.invalidateQueries({ queryKey: ["/api/loto/merchants/me/receipts"] });
            }}
          />

          <div className="mt-6 max-w-xl">
            <LotoMessagingPreferences />
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card className="mb-4 border-dashed">
            <CardContent className="p-6 md:p-8 text-center">
              <Bell className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
              <h2 className="text-lg md:text-xl font-semibold mb-2" data-testid="text-loto-coming-soon-title">{t("loto.comingSoonTitle")}</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto" data-testid="text-loto-coming-soon-body">{t("loto.comingSoonBody")}</p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: ScanLine, titleKey: "loto.feature1Title", bodyKey: "loto.feature1Body" },
              { icon: Activity, titleKey: "loto.feature2Title", bodyKey: "loto.feature2Body" },
              { icon: Award, titleKey: "loto.feature3Title", bodyKey: "loto.feature3Body" },
            ].map((f, i) => {
              const FIcon = f.icon;
              return (
                <Card key={i} data-testid={`card-loto-feature-${i + 1}`}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3" style={{ background: `linear-gradient(135deg, ${loto.accentFrom}, ${loto.accentTo})` }}>
                      <FIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{t(f.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(f.bodyKey)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          {merchantQ.isLoading && <Skeleton className="h-64 w-full" />}
          {!merchantQ.isLoading && !merchant && (
            <Card data-testid="card-no-merchant">
              <CardContent className="p-6 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">{t("loto.noMerchant", "No merchant profile linked to your account yet.")}</p>
              </CardContent>
            </Card>
          )}
          {merchant && (
            <>
              {/* ── Fiscal ID verification card (Task #488) ── */}
              {(() => {
                const cfg = fiscalConfigQ.data;
                const label = cfg?.fiscalIdLabel ?? merchant.fiscalIdType ?? "Fiscal ID";
                const authority = cfg?.authorityName ?? "Tax Authority";
                const hasVerified = merchant.fiscalIdVerified && merchant.fiscalId;
                return (
                  <Card className="mb-4" data-testid="card-fiscal-id">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileSearch className="w-4 h-4 text-emerald-600" />
                        {t("loto.fiscal.cardTitle", "DGI Fiscal Registration")}
                        {hasVerified && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 text-xs ml-1" data-testid="badge-fiscal-verified">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t("loto.fiscal.verified", "Verified")}
                          </Badge>
                        )}
                        {!hasVerified && merchant.fiscalId && (
                          <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-xs ml-1" data-testid="badge-fiscal-pending">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t("loto.fiscal.notVerified", "Not verified")}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {cfg
                          ? t("loto.fiscal.cardSubtitle", `Enter your ${label} issued by ${authority} to unlock full fiscal receipt eligibility.`, { label, authority })
                          : t("loto.fiscal.cardSubtitleGeneric", "Register your fiscal tax ID with the relevant authority to enable full lottery participation.")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {hasVerified && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800" data-testid="display-fiscal-id-verified">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-mono text-sm font-medium text-emerald-800 dark:text-emerald-200">{merchant.fiscalId}</span>
                          <span className="text-xs text-emerald-600 ml-auto">{merchant.fiscalIdType}</span>
                        </div>
                      )}

                      {(!hasVerified || fiscalIdInput) && (
                        <div className="flex gap-2" data-testid="form-fiscal-id">
                          <input
                            data-testid="input-fiscal-id"
                            value={fiscalIdInput}
                            onChange={(e) => {
                              setFiscalIdInput(e.target.value.toUpperCase());
                              setFiscalVerifyResult(null);
                            }}
                            placeholder={cfg ? `${label} (e.g. 0731730R)` : "Fiscal ID"}
                            maxLength={32}
                            className="flex-1 px-3 py-2 border rounded-md bg-background text-sm font-mono uppercase"
                          />
                          <Button
                            data-testid="button-verify-fiscal-id"
                            onClick={() => {
                              if (fiscalIdInput.trim()) fiscalIdMutation.mutate(fiscalIdInput.trim());
                            }}
                            disabled={!fiscalIdInput.trim() || fiscalIdMutation.isPending}
                            size="sm"
                          >
                            {fiscalIdMutation.isPending
                              ? t("loto.fiscal.verifying", "Verifying…")
                              : t("loto.fiscal.verifyBtn", "Verify")}
                          </Button>
                        </div>
                      )}

                      {hasVerified && !fiscalIdInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          data-testid="button-change-fiscal-id"
                          onClick={() => setFiscalIdInput(merchant.fiscalId ?? "")}
                        >
                          {t("loto.fiscal.changeBtn", "Change fiscal ID")}
                        </Button>
                      )}

                      {fiscalVerifyResult && (
                        <div
                          className={`p-3 rounded-md text-sm ${fiscalVerifyResult.verified ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200" : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"}`}
                          data-testid="text-fiscal-verify-result"
                        >
                          {fiscalVerifyResult.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              <Card data-testid="card-merchant-receipts">
                <CardHeader>
                  <CardTitle data-testid="text-merchant-name">{merchant.shopName}</CardTitle>
                  <CardDescription>
                    {merchant.city && `${merchant.city} · `}{merchantQ.data?.receipts.length ?? 0} {t("loto.receipts.count", "receipts")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {(merchantQ.data?.receipts ?? []).slice(0, 50).map(r => (
                      <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0" data-testid={`row-receipt-${r.id}`}>
                        <div>
                          <div className="font-mono text-xs">{r.ticketNumber}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.issuedAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{parseFloat(r.amount).toLocaleString()} {r.currency}</div>
                          <div className="text-xs text-muted-foreground">VAT {parseFloat(r.vatAmount).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="spending" className="mt-4">
          <Card data-testid="card-consumer-opt-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("loto.consumerOptIn.title", "Share my spending insights with credit lenders")}</CardTitle>
                <CardDescription>{t("loto.consumerOptIn.subtitle", "Verified VAT receipts can support a stronger consumer credit profile.")}</CardDescription>
              </div>
              <Switch
                checked={consumerOptedIn}
                onCheckedChange={enable => consumerOptInMutation.mutate(enable)}
                data-testid="switch-consumer-opt-in"
              />
            </CardHeader>
          </Card>

          {consumerQ.isLoading && <Skeleton className="h-48 w-full mt-4" />}
          {consumerQ.data && (
            <Card className="mt-4" data-testid="card-spending-summary">
              <CardHeader>
                <CardTitle>{t("loto.spending.title", "My verified spending")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div data-testid="stat-consumer-receipts"><div className="text-2xl font-bold">{consumerQ.data.features.totalReceipts}</div><div className="text-xs text-muted-foreground">{t("loto.spending.receipts", "Receipts")}</div></div>
                  <div data-testid="stat-consumer-turnover"><div className="text-2xl font-bold">{consumerQ.data.features.totalTurnover.toLocaleString()}</div><div className="text-xs text-muted-foreground">{consumerQ.data.features.currency} {t("loto.spending.spent", "spent")}</div></div>
                  <div data-testid="stat-consumer-months"><div className="text-2xl font-bold">{consumerQ.data.features.monthsWithActivity}</div><div className="text-xs text-muted-foreground">{t("loto.spending.months", "Active months")}</div></div>
                  <div data-testid="stat-consumer-avg"><div className="text-2xl font-bold">{Math.round(consumerQ.data.features.averageMonthlyTurnover).toLocaleString()}</div><div className="text-xs text-muted-foreground">{t("loto.spending.avg", "Avg / month")}</div></div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credit-profile" className="mt-4">
          {!merchant && (
            <Alert data-testid="alert-no-merchant-profile">
              <Building2 className="w-4 h-4" />
              <AlertTitle>{t("loto.creditProfile.noMerchantTitle", "No merchant profile")}</AlertTitle>
              <AlertDescription>{t("loto.creditProfile.noMerchantBody", "This view is for merchants. Once you register a Loto-enabled shop, you can enable credit-profile sharing here.")}</AlertDescription>
            </Alert>
          )}
          {merchant && (
            <>
              <Card data-testid="card-merchant-opt-in">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      {t("loto.optIn.title", "Build my credit profile from VAT receipts")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {t("loto.optIn.subtitle", "Share your verified receipt history with the Credit Bureau so lenders can offer you a loan based on real turnover. Default 12 months. Revocable at any time.")}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={merchant.creditOptInActive}
                    onCheckedChange={enable => merchantOptInMutation.mutate(enable)}
                    disabled={merchantOptInMutation.isPending}
                    data-testid="switch-merchant-opt-in"
                  />
                </CardHeader>
              </Card>

              {merchantQ.data?.features && (
                <Card className="mt-4" data-testid="card-feature-preview">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />{t("loto.creditProfile.previewTitle", "How lenders will see you")}</CardTitle>
                    <CardDescription>{t("loto.creditProfile.previewSubtitle", "This is the bridge-verified preview shared with lenders when sharing is on.")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div data-testid="stat-vat-score"><div className="text-2xl font-bold text-emerald-600">{merchantQ.data.features.vatActivityScore}</div><div className="text-xs text-muted-foreground">{t("vatActivity.score", "VAT Activity Score")}</div></div>
                      <div data-testid="stat-receipts"><div className="text-2xl font-bold">{merchantQ.data.features.totalReceipts}</div><div className="text-xs text-muted-foreground">{t("loto.spending.receipts", "Receipts")}</div></div>
                      <div data-testid="stat-months"><div className="text-2xl font-bold">{merchantQ.data.features.monthsWithActivity}</div><div className="text-xs text-muted-foreground">{t("loto.spending.months", "Active months")}</div></div>
                      <div data-testid="stat-turnover"><div className="text-2xl font-bold">{Math.round(merchantQ.data.features.totalTurnover).toLocaleString()}</div><div className="text-xs text-muted-foreground">{merchantQ.data.features.currency} {t("merchantCredit.totalTurnover", "total turnover")}</div></div>
                    </div>
                    {merchant.creditOptInActive && (
                      <Link href={`/merchant-credit-profile/${merchant.id}`}>
                        <Button variant="outline" size="sm" data-testid="link-public-profile">
                          {t("loto.creditProfile.viewLenderView", "Open lender-facing view")}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}

              <BureauReputationBadge
                merchantId={merchant.id}
                merchantCountryCode={merchant.countryCode}
                optedIn={merchant.creditOptInActive}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <LotoMessagingPreferences />
        </TabsContent>

        {/* ────── Mon Compte Fiscal (Task #489) — only visible when user has a merchant profile ────── */}
        <TabsContent value="fiscal-account" className="mt-4">
          {fiscalAccountQ.isLoading && <Skeleton className="h-72 w-full" />}
          {fiscalAccountQ.isError && !fiscalAccountQ.isLoading && (
            <Alert variant="destructive" data-testid="alert-fiscal-account-error">
              <AlertTitle>{t("common.error", "Error")}</AlertTitle>
              <AlertDescription>{(fiscalAccountQ.error as Error)?.message}</AlertDescription>
            </Alert>
          )}
          {fiscalAccountQ.data && (() => {
            const fa = fiscalAccountQ.data;
            const kpis = fa.kpis;
            const score = kpis.complianceScore;
            const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
            const scoreBg = score >= 80 ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" : score >= 60 ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
            const fmtVat = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });

            return (
              <div className="space-y-4">
                {/* KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="fiscal-kpi-strip">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" data-testid="kpi-receipts-month">{kpis.receiptsThisMonth}</div>
                      <div className="text-xs text-muted-foreground">{t("loto.fiscalAccount.kpiReceiptsMonth", "Receipts this month")}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" data-testid="kpi-receipts-year">{kpis.receiptsThisYear}</div>
                      <div className="text-xs text-muted-foreground">{t("loto.fiscalAccount.kpiReceiptsYear", "Receipts this year")}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" data-testid="kpi-vat-month">{fmtVat(kpis.vatThisMonth)}</div>
                      <div className="text-xs text-muted-foreground">{t("loto.fiscalAccount.kpiVatMonth", "VAT this month")} ({kpis.currency})</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold" data-testid="kpi-vat-year">{fmtVat(kpis.vatThisYear)}</div>
                      <div className="text-xs text-muted-foreground">{t("loto.fiscalAccount.kpiVatYear", "VAT this year")} ({kpis.currency})</div>
                    </CardContent>
                  </Card>
                  <Card className={`border ${scoreBg}`}>
                    <CardContent className="p-4">
                      <div className={`text-2xl font-bold ${scoreColor}`} data-testid="kpi-compliance-score">{score}</div>
                      <div className="text-xs text-muted-foreground">{t("loto.fiscalAccount.kpiScoreLabel", "Compliance score")}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 6-month VAT trend chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart2 className="w-4 h-4 text-emerald-600" />
                      {t("loto.fiscalAccount.chartTitle", "6-month VAT trend")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fa.monthlyTrend.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t("loto.fiscalAccount.noData", "No receipts yet")}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={fa.monthlyTrend} data-testid="chart-vat-trend">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtVat(v as number)} />
                          <Tooltip formatter={(v) => [fmtVat(v as number), t("loto.fiscalAccount.chartVat", "VAT")]} />
                          <Bar dataKey="vat" fill="#10b981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Receipt Ledger */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="w-4 h-4" />
                      {t("loto.fiscalAccount.ledgerTitle", "Receipt ledger")}
                      <Badge variant="outline" className="ml-auto text-xs">{fa.ledger.total} total</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fa.ledger.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t("loto.fiscalAccount.noData", "No receipts yet")}</p>
                    ) : (
                      <div className="overflow-auto">
                        <table className="w-full text-sm" data-testid="table-fiscal-ledger">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="text-left py-2 pr-3">{fa.fiscalConfig?.fiscalIdLabel ?? t("loto.fiscalAccount.ledgerFiscalCode", "Fiscal code")}</th>
                              <th className="text-left py-2 pr-3">{t("loto.fiscalAccount.ledgerTicket", "Ticket #")}</th>
                              <th className="text-left py-2 pr-3">{t("loto.fiscalAccount.ledgerDate", "Date")}</th>
                              <th className="text-right py-2 pr-3">{t("loto.fiscalAccount.ledgerAmount", "Amount")}</th>
                              <th className="text-right py-2 pr-3">{t("loto.fiscalAccount.ledgerVat", "VAT")}</th>
                              <th className="text-center py-2 pr-3">{t("loto.fiscalAccount.ledgerStatus", "Status")}</th>
                              <th className="text-right py-2">{t("loto.fiscalAccount.ledgerFlag", "Flag")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fa.ledger.items.map((item) => (
                              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-fiscal-${item.id}`}>
                                <td className="py-2 pr-3 font-mono text-xs">{item.fiscalCode}</td>
                                <td className="py-2 pr-3 font-mono text-xs text-muted-foreground" data-testid={`ticket-${item.id}`}>{item.ticketNumber}</td>
                                <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(item.issuedAt).toLocaleDateString()}</td>
                                <td className="py-2 pr-3 text-right">{parseFloat(item.amount).toLocaleString()} {item.currency}</td>
                                <td className="py-2 pr-3 text-right text-muted-foreground">{parseFloat(item.vatAmount).toLocaleString()}</td>
                                <td className="py-2 pr-3 text-center">
                                  {item.status === "flagged" ? (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 text-xs" data-testid={`status-flagged-${item.id}`}>
                                      <Flag className="w-3 h-3 mr-1" />
                                      {t("loto.fiscalAccount.statusFlagged", "Flagged")}
                                    </Badge>
                                  ) : item.status === "expired" ? (
                                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 text-xs" data-testid={`status-expired-${item.id}`}>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      {t("loto.fiscalAccount.statusExpired", "Expired")}
                                    </Badge>
                                  ) : item.status === "demo" ? (
                                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 text-xs" data-testid={`status-demo-${item.id}`}>
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {t("loto.fiscalAccount.statusDemo", "Demo")}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 text-xs" data-testid={`status-valid-${item.id}`}>
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      {t("loto.fiscalAccount.statusValid", "Valid")}
                                    </Badge>
                                  )}
                                  {item.rejectionReason && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate" title={item.rejectionReason}>{item.rejectionReason}</p>
                                  )}
                                </td>
                                <td className="py-2 text-right">
                                  {item.status === "flagged" ? (
                                    <span className="text-xs text-muted-foreground">{t("loto.fiscalAccount.alreadyFlagged", "Already flagged")}</span>
                                  ) : item.status === "demo" ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : flaggingReceiptId === item.id ? (
                                    <div className="flex flex-col gap-1 items-end">
                                      <input
                                        data-testid={`input-flag-reason-${item.id}`}
                                        value={flagReason}
                                        onChange={(e) => setFlagReason(e.target.value)}
                                        placeholder={t("loto.fiscalAccount.flagReasonPlaceholder", "Describe the discrepancy (optional)")}
                                        className="w-48 px-2 py-1 border rounded text-xs bg-background"
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-6 text-xs px-2"
                                          disabled={flagMutation.isPending}
                                          data-testid={`button-flag-submit-${item.id}`}
                                          onClick={() => flagMutation.mutate({ receiptId: item.id, reason: flagReason })}
                                        >
                                          {t("loto.fiscalAccount.flagBtnConfirm", "Submit")}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-xs px-2"
                                          data-testid={`button-flag-cancel-${item.id}`}
                                          onClick={() => { setFlaggingReceiptId(null); setFlagReason(""); }}
                                        >
                                          {t("common.cancel", "Cancel")}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs px-2 text-orange-600 hover:text-orange-700"
                                      data-testid={`button-flag-${item.id}`}
                                      onClick={() => { setFlaggingReceiptId(item.id); setFlagReason(""); }}
                                    >
                                      <Flag className="w-3 h-3 mr-1" />
                                      {t("loto.fiscalAccount.flagBtnTitle", "Flag")}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consumer messaging preferences (Task #286)
// Lets the consumer pick a verified phone, choose a UI language used in
// outbound SMS templates, and opt out of marketing-style reminders. The
// "winner SMS bypasses opt-out" rule is surfaced explicitly so consumers
// understand they will still hear about a real cash prize.
// ---------------------------------------------------------------------------
function LotoMessagingPreferences() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);

  const prefsQ = useQuery<{
    optOutReminders: boolean; language: string; verifiedPhone: string | null; verifiedAt: string | null;
  }>({ queryKey: ["/api/loto/messaging-prefs"] });

  const updateMut = useMutation({
    mutationFn: async (patch: { optOutReminders?: boolean; language?: string }) => {
      const r = await apiRequest("PUT", "/api/loto/messaging-prefs", patch);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/messaging-prefs"] });
      toast({ title: t("lotoNotifications.savedToast") });
    },
    onError: (e: unknown) => toast({
      title: t("lotoNotifications.errorToast"),
      description: e instanceof Error ? e.message : String(e),
      variant: "destructive",
    }),
  });

  const sendOtpMut = useMutation({
    mutationFn: async (phone: string) => {
      const r = await apiRequest("PUT", "/api/loto/messaging-prefs/verify-phone", { phone });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to send code");
      }
      return r.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({ title: t("loto.messagingPrefs.codeSentTitle", "Code sent"), description: t("loto.messagingPrefs.codeSentBody", "Check your phone for a 6-digit code. It expires in 10 minutes.") });
    },
    onError: (e: unknown) => toast({
      title: t("loto.messagingPrefs.sendCodeErrorTitle", "Could not send code"),
      description: e instanceof Error ? e.message : String(e),
      variant: "destructive",
    }),
  });

  const confirmOtpMut = useMutation({
    mutationFn: async (code: string) => {
      const r = await apiRequest("POST", "/api/loto/messaging-prefs/confirm-otp", { code });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Verification failed");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/messaging-prefs"] });
      setCodeSent(false);
      setIsChangingPhone(false);
      setPhoneInput("");
      setCodeInput("");
      toast({ title: t("loto.messagingPrefs.verifiedTitle", "Phone verified"), description: t("loto.messagingPrefs.verifiedBody", "Your phone number has been confirmed.") });
    },
    onError: (e: unknown) => toast({
      title: t("loto.messagingPrefs.confirmErrorTitle", "Incorrect code"),
      description: e instanceof Error ? e.message : String(e),
      variant: "destructive",
    }),
  });

  if (prefsQ.isLoading) {
    return <Skeleton className="h-48 w-full" data-testid="skeleton-prefs" />;
  }
  if (prefsQ.isError || !prefsQ.data) {
    return (
      <Card data-testid="card-messaging-prefs-unavailable">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("loto.messagingPrefs.consumerOnly", "Messaging preferences are only available to consumer accounts enrolled in the Loto Fiscal pilot.")}
        </CardContent>
      </Card>
    );
  }
  const prefs = prefsQ.data;

  return (
    <Card data-testid="card-messaging-prefs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          {t("lotoNotifications.prefTitle")}
        </CardTitle>
        <CardDescription>
          {t("lotoNotifications.prefSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="prefs-phone">
            {t("lotoNotifications.phoneLabel")}
          </label>

          {prefs.verifiedAt && prefs.verifiedPhone && !isChangingPhone ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="flex-1 text-sm" data-testid="text-prefs-verified-phone">{prefs.verifiedPhone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-change-phone"
                  onClick={() => {
                    setPhoneInput(prefs.verifiedPhone ?? "");
                    setCodeSent(false);
                    setCodeInput("");
                    setIsChangingPhone(true);
                  }}
                >
                  {t("loto.messagingPrefs.changePhone", "Change")}
                </Button>
              </div>
              <p className="text-xs text-emerald-700 flex items-center gap-1" data-testid="text-prefs-verified-at">
                <BadgeCheck className="w-3.5 h-3.5" />
                {t("loto.messagingPrefs.verifiedAt", "Verified")} — {new Date(prefs.verifiedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  id="prefs-phone"
                  data-testid="input-prefs-phone"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value); setCodeSent(false); }}
                  placeholder="+225 07 00 00 00 00"
                  className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                  disabled={sendOtpMut.isPending}
                />
                <Button
                  data-testid="button-send-otp"
                  onClick={() => sendOtpMut.mutate(phoneInput.trim())}
                  disabled={!phoneInput.trim() || sendOtpMut.isPending}
                  size="sm"
                >
                  {sendOtpMut.isPending
                    ? t("loto.messagingPrefs.sending", "Sending…")
                    : t("loto.messagingPrefs.sendCode", "Send code")}
                </Button>
              </div>
              {isChangingPhone && prefs.verifiedPhone && !codeSent && (
                <button
                  data-testid="button-cancel-change-phone"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => { setIsChangingPhone(false); setPhoneInput(""); setCodeSent(false); }}
                >
                  {t("loto.messagingPrefs.cancelChange", "Cancel")}
                </button>
              )}

              {codeSent && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs text-muted-foreground" htmlFor="prefs-otp">
                    {t("loto.messagingPrefs.enterCode", "Enter the 6-digit code sent to your phone")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="prefs-otp"
                      data-testid="input-prefs-otp"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      inputMode="numeric"
                      className="flex-1 px-3 py-2 border rounded-md bg-background text-sm tracking-widest"
                      disabled={confirmOtpMut.isPending}
                    />
                    <Button
                      data-testid="button-confirm-otp"
                      onClick={() => confirmOtpMut.mutate(codeInput)}
                      disabled={codeInput.length !== 6 || confirmOtpMut.isPending}
                      size="sm"
                    >
                      {confirmOtpMut.isPending
                        ? t("loto.messagingPrefs.verifying", "Verifying…")
                        : t("loto.messagingPrefs.verify", "Verify")}
                    </Button>
                  </div>
                  <button
                    data-testid="button-resend-otp"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => sendOtpMut.mutate(phoneInput.trim())}
                    disabled={sendOtpMut.isPending}
                  >
                    {t("loto.messagingPrefs.resendCode", "Resend code")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="prefs-lang">
            {t("lotoNotifications.languageLabel")}
          </label>
          <select
            id="prefs-lang"
            data-testid="select-prefs-language"
            defaultValue={prefs.language}
            onChange={(e) => updateMut.mutate({ language: e.target.value })}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
            <option value="ar">العربية</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        <div className="flex items-center justify-between border rounded-md p-3">
          <div className="flex-1 pr-3">
            <p className="text-sm font-medium">{t("lotoNotifications.optOutLabel")}</p>
            <p className="text-xs text-muted-foreground">{t("lotoNotifications.optOutNote")}</p>
          </div>
          <Switch
            checked={prefs.optOutReminders}
            onCheckedChange={(v) => updateMut.mutate({ optOutReminders: v })}
            disabled={updateMut.isPending}
            data-testid="switch-prefs-opt-out"
          />
        </div>

        <Alert>
          <ShieldAlert className="w-4 h-4" />
          <AlertTitle>{t("lotoNotifications.demoModeTitle")}</AlertTitle>
          <AlertDescription>{t("lotoNotifications.demoModeBody")}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Loto-side projection of the bridge response. We deliberately omit any
// credit-bureau-domain fields the server may include (`score`, `bureauScore`,
// `hasBureauProfile`) so the merchant's Loto product UI cannot bleed
// credit-side data through. The Loto badge surfaces only Loto-derived
// reputation signals: tier label, receipt counts, active months, and trend.
// Credit-side scoring detail lives in the lender-facing Merchant Credit
// Profile page inside the Credit Hub.
interface LotoBadgeProjection {
  badge: {
    tier: string;
    totalReceipts: number;
    monthsWithActivity: number;
    trend: string;
    issuedAt: string;
  };
  consent: { id: string };
}

function BureauReputationBadge({ merchantId, merchantCountryCode, optedIn }: { merchantId: string; merchantCountryCode: string; optedIn: boolean }) {
  const { t } = useTranslation();
  // Resolve the merchant's local tax authority + product framing (e.g.
  // "DGI Loto Fiscal" in Côte d'Ivoire, "FIRS Verified Receipts" in
  // Lagos) from the shared registry so the badge speaks the merchant's
  // local language regardless of where in Africa they're trading.
  const profile = getTaxAuthorityProfile(merchantCountryCode);
  const badgeTitle = `${profile.taxAuthority} Bureau Reputation Badge`;
  const badgeSubtitle = t(
    "merchantCredit.badgeSubtitle",
    `Verified by the ${profile.productLabel} → Credit Bureau bridge. Lenders see this badge on your merchant credit profile.`,
    { authority: profile.taxAuthority, product: profile.productLabel },
  );
  const lockedBody = t(
    "merchantCredit.badgeLockedBody",
    `Turn on credit-profile sharing to issue your verified ${profile.taxAuthority} / ${profile.productLabel} reputation badge through the bridge.`,
    { authority: profile.taxAuthority, product: profile.productLabel },
  );

  const { data, isLoading, error } = useQuery<LotoBadgeProjection>({
    queryKey: ["/api/cross-product/bureau-badge", merchantId],
    queryFn: () => fetch(`/api/cross-product/bureau-badge/${merchantId}`, { credentials: "include" }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "Failed");
      const raw = await r.json();
      // Strip any credit-bureau-domain fields the server may include so the
      // Loto UI literally cannot render them. Keep only Loto-derived signals.
      return {
        badge: {
          tier: raw?.badge?.tier ?? "unranked",
          totalReceipts: raw?.badge?.totalReceipts ?? 0,
          monthsWithActivity: raw?.badge?.monthsWithActivity ?? 0,
          trend: raw?.badge?.trend ?? "new",
          issuedAt: raw?.badge?.issuedAt ?? new Date().toISOString(),
        },
        consent: raw?.consent ?? { id: "" },
      };
    }),
    enabled: optedIn,
    retry: false,
  });

  if (!optedIn) {
    return (
      <Card className="mt-4 border-dashed" data-testid="card-bureau-badge-locked">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="w-5 h-5 text-muted-foreground" />
            {badgeTitle}
          </CardTitle>
          <CardDescription>
            {lockedBody}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tierColor = (tier?: string) => {
    switch (tier) {
      case "platinum": return "bg-slate-100 text-slate-900 border-slate-400 dark:bg-slate-800 dark:text-slate-100";
      case "gold": return "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-900/40 dark:text-amber-100";
      case "silver": return "bg-zinc-100 text-zinc-900 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-100";
      case "bronze": return "bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-900/40 dark:text-orange-100";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="mt-4" data-testid="card-bureau-badge">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeCheck className="w-5 h-5 text-emerald-600" />
          {badgeTitle}
        </CardTitle>
        <CardDescription>
          {badgeSubtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}
        {error && (
          <Alert variant="destructive" data-testid="alert-bureau-badge-error">
            <AlertTitle>{t("common.error", "Error")}</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}
        {data && (
          <div className="flex items-center gap-4 flex-wrap" data-testid="content-bureau-badge">
            <div className={`px-4 py-3 rounded-lg border-2 ${tierColor(data.badge.tier)}`} data-testid="badge-tier">
              <div className="text-xs uppercase tracking-wide opacity-75">Tier</div>
              <div className="text-2xl font-bold capitalize">{data.badge.tier}</div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">{t("merchantCredit.badgeReceipts", "Receipts")}</div><div className="text-lg font-semibold" data-testid="badge-receipts">{data.badge.totalReceipts}</div></div>
              <div><div className="text-xs text-muted-foreground">{t("merchantCredit.badgeActiveMonths", "Active months")}</div><div className="text-lg font-semibold" data-testid="badge-months">{data.badge.monthsWithActivity}</div></div>
              <div><div className="text-xs text-muted-foreground">{t("merchantCredit.badgeTrend", "Trend")}</div><div className="text-lg font-semibold capitalize" data-testid="badge-trend">{data.badge.trend.replace("_", " ")}</div></div>
              <div className="col-span-2 md:col-span-3"><div className="text-xs text-muted-foreground">{t("merchantCredit.badgeIssued", "Issued")}</div><div className="text-sm font-mono" data-testid="badge-issued">{new Date(data.badge.issuedAt).toLocaleString()}</div></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

