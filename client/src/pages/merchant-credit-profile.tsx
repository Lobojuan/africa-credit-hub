import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Receipt, TrendingUp, TrendingDown, Activity, ShieldCheck, AlertTriangle, Building2 } from "lucide-react";
import { getTaxAuthorityProfile } from "@shared/tax-authority";

interface MerchantCreditProfileResponse {
  merchant: { id: string; shopName: string; ownerName: string | null; vatRegistrationNumber: string | null; city: string | null; countryCode: string; category: string | null; currency: string };
  features: {
    totalReceipts: number; totalTurnover: number; averageMonthlyTurnover: number;
    monthsWithActivity: number; averageReceiptsPerMonth: number;
    largestMonthlyTurnover: number; smallestMonthlyTurnover: number;
    trend: "growing" | "stable" | "declining" | "new"; trendDelta: number;
    monthlyBreakdown: { month: string; receipts: number; turnover: number }[];
    reasonCodes: string[]; currency: string; vatActivityScore: number; lastReceiptAt: string | null;
  };
  consent: { id: string; expiresAt: string; grantedAt: string };
}

const REASON_LABEL: Record<string, { tKey: string; fallback: string; tone: "positive" | "negative" | "neutral" }> = {
  STRONG_RECEIPT_FREQUENCY:    { tKey: "merchantCredit.reason.STRONG_RECEIPT_FREQUENCY",    fallback: "Strong receipt frequency",     tone: "positive" },
  MODERATE_RECEIPT_FREQUENCY:  { tKey: "merchantCredit.reason.MODERATE_RECEIPT_FREQUENCY",  fallback: "Moderate receipt frequency",   tone: "neutral" },
  LOW_RECEIPT_FREQUENCY:       { tKey: "merchantCredit.reason.LOW_RECEIPT_FREQUENCY",       fallback: "Low receipt frequency",        tone: "negative" },
  GROWING_TURNOVER:            { tKey: "merchantCredit.reason.GROWING_TURNOVER",            fallback: "Growing turnover",             tone: "positive" },
  RECENT_DROP_IN_VOLUME:       { tKey: "merchantCredit.reason.RECENT_DROP_IN_VOLUME",       fallback: "Recent drop in volume",        tone: "negative" },
  CONSISTENT_RECEIPT_HISTORY:  { tKey: "merchantCredit.reason.CONSISTENT_RECEIPT_HISTORY",  fallback: "Consistent receipt history",   tone: "positive" },
  THIN_RECEIPT_FILE:           { tKey: "merchantCredit.reason.THIN_RECEIPT_FILE",           fallback: "Thin receipt file",            tone: "negative" },
  NO_RECEIPT_HISTORY:          { tKey: "merchantCredit.reason.NO_RECEIPT_HISTORY",          fallback: "No verified receipt history",  tone: "negative" },
  HIGH_TURNOVER_VOLUME:        { tKey: "merchantCredit.reason.HIGH_TURNOVER_VOLUME",        fallback: "High turnover volume",         tone: "positive" },
};

export default function MerchantCreditProfilePage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ merchantId: string }>("/merchant-credit-profile/:merchantId");
  const merchantId = params?.merchantId;

  useEffect(() => {
    document.title = t("merchantCredit.docTitle", "Merchant Credit Profile — Africa Credit Hub");
  }, [t]);

  const { data, isLoading, error } = useQuery<MerchantCreditProfileResponse>({
    queryKey: [`/api/cross-product/merchant-credit-profile/${merchantId}`],
    enabled: !!merchantId,
    retry: false,
  });

  const errMessage = error instanceof Error ? error.message : "";
  const isConsentError = errMessage.includes("403") || errMessage.includes("no_consent");

  // Resolve the merchant's local tax authority + product framing so the page
  // says "Verified VAT-receipt history from FIRS Verified Receipts" for a
  // Lagos merchant and "from DGI Loto Fiscal" for an Abidjan merchant. Falls
  // back to the default Côte d'Ivoire profile until the merchant payload
  // arrives so the subtitle never flickers blank.
  const profile = data?.merchant?.countryCode
    ? getTaxAuthorityProfile(data.merchant.countryCode)
    : getTaxAuthorityProfile("CI");
  const subtitleText = t(
    "merchantCredit.subtitle",
    `Verified VAT-receipt history from ${profile.taxAuthority} ${profile.productLabel}, served via the Cross-Product Bridge.`,
    { authority: profile.taxAuthority, product: profile.productLabel },
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto" data-testid="page-merchant-credit-profile">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-mcp-title">
            {t("merchantCredit.title", "Merchant Credit Profile")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground" data-testid="text-mcp-subtitle">
            {subtitleText}
          </p>
        </div>
      </div>

      {isLoading && <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>}

      {isConsentError && (
        <Alert variant="destructive" data-testid="alert-no-consent">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>{t("merchantCredit.noConsentTitle", "No active sharing permission")}</AlertTitle>
          <AlertDescription>
            {t("merchantCredit.noConsentBody", "This merchant has not opted in to share VAT-receipt history with credit lenders. The Bridge enforces consent — no fallbacks.")}
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <Card className="mb-6" data-testid="card-merchant-summary">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2" data-testid="text-merchant-name">
                    <Building2 className="w-5 h-5" />
                    {data.merchant.shopName}
                  </CardTitle>
                  <CardDescription data-testid="text-merchant-meta">
                    {data.merchant.ownerName && `${data.merchant.ownerName} · `}
                    {data.merchant.city && `${data.merchant.city} · `}
                    {data.merchant.vatRegistrationNumber && `VAT ${data.merchant.vatRegistrationNumber}`}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-600" data-testid="badge-bridge-provenance">
                  <ShieldCheck className="w-3 h-3 mr-1" /> {t("merchantCredit.bridgeBadge", "Bridge-verified")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label={t("vatActivity.score", "VAT Activity Score")} value={String(data.features.vatActivityScore)} testid="stat-vat-score" highlight />
                <Stat label={t("merchantCredit.totalReceipts", "Total receipts")} value={String(data.features.totalReceipts)} testid="stat-total-receipts" />
                <Stat label={t("merchantCredit.monthsActive", "Months active")} value={String(data.features.monthsWithActivity)} testid="stat-months-active" />
                <Stat label={t("merchantCredit.lastReceipt", "Last receipt")} value={data.features.lastReceiptAt ? new Date(data.features.lastReceiptAt).toLocaleDateString() : "—"} testid="stat-last-receipt" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2" data-testid="card-monthly-turnover">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {data.features.trend === "declining"
                    ? <TrendingDown className="w-4 h-4 text-red-500" />
                    : <TrendingUp className="w-4 h-4 text-emerald-600" />}
                  {t("merchantCredit.monthlyTurnover", "Monthly turnover")} ({data.features.currency})
                </CardTitle>
                <CardDescription>
                  {t(`merchantCredit.trend.${data.features.trend}`, data.features.trend)}
                  {data.features.trendDelta !== 0 && ` · ${data.features.trendDelta.toFixed(1)}%`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.features.monthlyBreakdown.length === 0 && (
                    <p className="text-sm text-muted-foreground" data-testid="text-no-monthly">{t("merchantCredit.noMonthly", "No monthly receipt data yet.")}</p>
                  )}
                  {data.features.monthlyBreakdown.map(m => {
                    const pct = data.features.largestMonthlyTurnover > 0
                      ? (m.turnover / data.features.largestMonthlyTurnover) * 100
                      : 0;
                    return (
                      <div key={m.month} data-testid={`row-month-${m.month}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-mono">{m.month}</span>
                          <span className="text-muted-foreground">{m.receipts} · {m.turnover.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <div className="h-full bg-emerald-500 rounded" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-reason-codes">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t("merchantCredit.reasonCodesTitle", "Score reason codes")}
                </CardTitle>
                <CardDescription>{t("merchantCredit.reasonCodesSubtitle", "Plain-language explainers for the VAT Activity Score above.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.features.reasonCodes.map(code => {
                    const meta = REASON_LABEL[code] ?? { tKey: code, fallback: code, tone: "neutral" as const };
                    const color = meta.tone === "positive" ? "text-emerald-600 border-emerald-300"
                      : meta.tone === "negative" ? "text-red-600 border-red-300"
                      : "text-slate-600 border-slate-300";
                    return (
                      <Badge key={code} variant="outline" className={color} data-testid={`badge-reason-${code}`}>
                        {t(meta.tKey, meta.fallback)}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert data-testid="alert-consent-info">
            <ShieldCheck className="w-4 h-4" />
            <AlertTitle>{t("merchantCredit.consentTitle", "Sharing permission")}</AlertTitle>
            <AlertDescription>
              {t("merchantCredit.consentBody", "Granted on {{granted}}, expires on {{expires}}. Consent ID: {{id}}.", {
                granted: new Date(data.consent.grantedAt).toLocaleDateString(),
                expires: new Date(data.consent.expiresAt).toLocaleDateString(),
                id: data.consent.id.slice(0, 8),
              })}
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, testid, highlight }: { label: string; value: string; testid: string; highlight?: boolean }) {
  return (
    <div data-testid={testid}>
      <div className={`text-2xl font-bold ${highlight ? "text-emerald-600" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
