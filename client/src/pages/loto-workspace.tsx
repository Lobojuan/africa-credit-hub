import { useEffect } from "react";
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
import { Ticket, ScanLine, Activity, Award, Receipt, ShieldCheck, TrendingUp, Building2, ArrowRight, Bell, BadgeCheck, ShieldAlert } from "lucide-react";
import { PRODUCT_REGISTRY } from "@/lib/products";

interface MerchantPayload {
  merchant: { id: string; shopName: string; ownerName: string | null; vatRegistrationNumber: string | null; city: string | null; currency: string; creditOptInActive: boolean; borrowerId: string | null } | null;
  receipts: { id: string; ticketNumber: string; amount: string; vatAmount: string; currency: string; issuedAt: string; category: string | null }[];
  features: {
    totalReceipts: number; totalTurnover: number; averageMonthlyTurnover: number;
    monthsWithActivity: number; trend: string; vatActivityScore: number; currency: string;
    monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
  } | null;
}

interface ConsumerPayload {
  receipts: { id: string; amount: string; currency: string; issuedAt: string; category: string | null }[];
  features: {
    totalReceipts: number; totalTurnover: number; monthsWithActivity: number;
    averageMonthlyTurnover: number; currency: string;
    monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
  };
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
  const consentsQ = useQuery<any[]>({ queryKey: ["/api/cross-product/consents"] });

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

  const merchant = merchantQ.data?.merchant ?? null;
  const consumerOptedIn = (consentsQ.data ?? []).some((c: any) => c.status === "active" && c.purpose === "consumer_spending_credit");

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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">{t("loto.tabs.overview", "Overview")}</TabsTrigger>
          <TabsTrigger value="receipts" data-testid="tab-receipts">{t("loto.tabs.receipts", "Receipts")}</TabsTrigger>
          <TabsTrigger value="spending" data-testid="tab-spending">{t("loto.tabs.spending", "Spending")}</TabsTrigger>
          <TabsTrigger value="credit-profile" data-testid="tab-credit-profile">{t("loto.tabs.creditProfile", "Build Credit")}</TabsTrigger>
        </TabsList>

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

              <DgiBureauReputationBadge merchantId={merchant.id} optedIn={merchant.creditOptInActive} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BureauBadgeResponse {
  badge: {
    tier: string;
    score: number;
    totalReceipts: number;
    monthsWithActivity: number;
    trend: string;
    issuedAt: string;
  };
  consent: { id: string };
}

function DgiBureauReputationBadge({ merchantId, optedIn }: { merchantId: string; optedIn: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<BureauBadgeResponse>({
    queryKey: ["/api/cross-product/bureau-badge", merchantId],
    queryFn: () => fetch(`/api/cross-product/bureau-badge/${merchantId}`, { credentials: "include" }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "Failed");
      return r.json();
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
            {t("merchantCredit.badgeLockedTitle", "DGI Bureau Reputation Badge")}
          </CardTitle>
          <CardDescription>
            {t("merchantCredit.badgeLockedBody", "Turn on credit-profile sharing to issue your verified DGI / Loto Fiscal reputation badge through the bridge.")}
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
          {t("merchantCredit.badgeTitle", "DGI Bureau Reputation Badge")}
        </CardTitle>
        <CardDescription>
          {t("merchantCredit.badgeSubtitle", "Verified by the Loto Fiscal → Credit Bureau bridge. Lenders see this badge on your merchant credit profile.")}
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
              <div><div className="text-xs text-muted-foreground">Bureau score</div><div className="text-lg font-semibold" data-testid="badge-score">{data.badge.score}</div></div>
              <div><div className="text-xs text-muted-foreground">Receipts</div><div className="text-lg font-semibold" data-testid="badge-receipts">{data.badge.totalReceipts}</div></div>
              <div><div className="text-xs text-muted-foreground">Active months</div><div className="text-lg font-semibold" data-testid="badge-months">{data.badge.monthsWithActivity}</div></div>
              <div><div className="text-xs text-muted-foreground">Trend</div><div className="text-lg font-semibold capitalize" data-testid="badge-trend">{data.badge.trend.replace("_", " ")}</div></div>
              <div className="col-span-2"><div className="text-xs text-muted-foreground">Issued</div><div className="text-sm font-mono" data-testid="badge-issued">{new Date(data.badge.issuedAt).toLocaleString()}</div></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

