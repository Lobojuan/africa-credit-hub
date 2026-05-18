import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Receipt, TrendingUp, TrendingDown, Activity, ShieldCheck, AlertTriangle,
  Building2, CheckCircle2, XCircle, BarChart3, Zap,
} from "lucide-react";
import { getTaxAuthorityProfile } from "@shared/tax-authority";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

interface CreditBreakdownResponse {
  merchant: { id: string; shopName: string; countryCode: string; currency: string; creditOptInActive: boolean; borrowerId: string | null };
  complianceScore: number;
  complianceBreakdown: Record<string, number>;
  vatTrend: { month: string; vat: number }[];
  fraudRuleResults: { ruleCode: string; pass: boolean; flag: { id: string; severity: string; summary: string } | null }[];
  openFraudFlags: { id: string; ruleCode: string; severity: string; summary: string }[];
  altDataRecord: { source: string; totalTransactions: number; onTimePayments: number; latePayments: number; rawScore: number | null } | null;
  creditScoreContribution: { altDataBonus: number; source: string; onTimeRatio: number };
  receiptCount: number;
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

const FRAUD_RULE_LABELS: Record<string, string> = {
  DUPLICATE_FISCAL_CODE: "Duplicate Fiscal Code",
  STRUCTURED_SUBTHRESHOLD: "Structured Sub-threshold",
  GHOST_MERCHANT: "Ghost Merchant",
  ABNORMAL_HOUR: "Abnormal Trading Hours",
  SINGLE_DEVICE_BURST: "Single-Device Burst",
};

function ComplianceGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const bgColor = score >= 80 ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
    : score >= 60 ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl border ${bgColor}`} data-testid="compliance-gauge">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-slate-700" />
        <circle
          cx="55" cy="55" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="55" y="52" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" dominantBaseline="middle">{score}</text>
        <text x="55" y="70" textAnchor="middle" fill="#94a3b8" fontSize="10">/100</text>
      </svg>
      <div className="mt-2 font-semibold text-sm" style={{ color }} data-testid="text-compliance-label">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">Compliance Score</div>
    </div>
  );
}

export default function MerchantCreditProfilePage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ merchantId: string }>("/merchant-credit-profile/:merchantId");
  const merchantId = params?.merchantId;

  useEffect(() => {
    document.title = t("merchantCredit.docTitle", "Merchant Credit Profile — Universal Credit Hub");
  }, [t]);

  const { data, isLoading, error } = useQuery<MerchantCreditProfileResponse>({
    queryKey: [`/api/cross-product/merchant-credit-profile/${merchantId}`],
    enabled: !!merchantId,
    retry: false,
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery<CreditBreakdownResponse>({
    queryKey: [`/api/loto/merchants/${merchantId}/credit-breakdown`],
    enabled: !!merchantId,
    retry: false,
  });

  const errMessage = error instanceof Error ? error.message : "";
  const isConsentError = errMessage.includes("403") || errMessage.includes("no_consent");

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

          {/* ── Compliance Score + Breakdown ── */}
          {(breakdown || breakdownLoading) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-1">
                {breakdownLoading && <Skeleton className="h-48 w-full rounded-xl" />}
                {breakdown && <ComplianceGauge score={breakdown.complianceScore} />}
              </div>
              {breakdown && (
                <Card className="md:col-span-2" data-testid="card-compliance-breakdown">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      {t("merchantCredit.complianceBreakdown", "Compliance Score Breakdown")}
                    </CardTitle>
                    <CardDescription>
                      {t("merchantCredit.complianceBreakdownSubtitle", "Deterministic 0–100 score based on recency, frequency, growth, category diversity, and fraud flags.")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2" data-testid="compliance-factors">
                      {Object.entries(breakdown.complianceBreakdown).map(([factor, pts]) => {
                        const isNegative = factor === "penalty" || pts < 0;
                        const display = isNegative ? pts : `+${pts}`;
                        const color = isNegative && pts < 0 ? "text-red-600" : "text-emerald-600";
                        const label = factor === "recency" ? "Recency (30 pts max)"
                          : factor === "frequency" ? "Frequency (25 pts max)"
                          : factor === "growth" ? "Growth (20 pts max)"
                          : factor === "diversity" ? "Category Diversity (15 pts max)"
                          : "Fraud Flag Penalty (−10 max)";
                        return (
                          <div key={factor} className="flex items-center justify-between text-sm" data-testid={`factor-${factor}`}>
                            <span className="text-muted-foreground">{label}</span>
                            <span className={`font-semibold font-mono ${color}`}>{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── VAT Trend (6 months) ── */}
          {breakdown && breakdown.vatTrend.length > 0 && (
            <Card className="mb-6" data-testid="card-vat-trend">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  {t("merchantCredit.vatTrendTitle", "VAT Revenue Trend — Last 6 Months")} ({breakdown.merchant.currency})
                </CardTitle>
                <CardDescription>
                  {t("merchantCredit.vatTrendSubtitle", "Monthly VAT amounts from verified fiscal receipts used in credit scoring.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={breakdown.vatTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "VAT"]} />
                    <Line
                      type="monotone"
                      dataKey="vat"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Fraud Rule Results ── */}
          {breakdown && (
            <Card className="mb-6" data-testid="card-fraud-rules">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {t("merchantCredit.fraudRulesTitle", "Fraud Detection Rules")}
                </CardTitle>
                <CardDescription>
                  {t("merchantCredit.fraudRulesSubtitle", "Five deterministic rules evaluated against this merchant's receipt history. Open flags reduce the compliance score.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="fraud-rules-grid">
                  {breakdown.fraudRuleResults.map(rule => (
                    <div
                      key={rule.ruleCode}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${rule.pass ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800" : "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"}`}
                      data-testid={`fraud-rule-${rule.ruleCode}`}
                    >
                      {rule.pass
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${rule.pass ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                          {FRAUD_RULE_LABELS[rule.ruleCode] ?? rule.ruleCode}
                        </div>
                        {!rule.pass && rule.flag && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{rule.flag.summary}</div>
                        )}
                        {rule.pass && (
                          <div className="text-xs text-muted-foreground mt-0.5">No flags detected</div>
                        )}
                      </div>
                      {!rule.pass && rule.flag && (
                        <Badge variant="outline" className="ml-auto text-xs shrink-0 border-red-300 text-red-600 capitalize">
                          {rule.flag.severity}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Credit Score Impact ── */}
          {breakdown && (
            <Card className="mb-6" data-testid="card-credit-score-impact">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  {t("merchantCredit.creditImpactTitle", "Credit Score Impact")}
                </CardTitle>
                <CardDescription>
                  {t("merchantCredit.creditImpactSubtitle", "How this merchant's Loto Fiscal compliance data currently contributes to their linked business credit score.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!breakdown.merchant.borrowerId ? (
                  <Alert data-testid="alert-no-borrower">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>No linked business borrower</AlertTitle>
                    <AlertDescription>
                      This merchant does not yet have a linked business credit profile in the bureau. Credit score impact will appear once a business borrower record is linked by the registry.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                      <div>
                        <div className="text-sm font-medium">Alternative Data Source</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{breakdown.creditScoreContribution.source}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600" data-testid="text-alt-data-bonus">+{breakdown.creditScoreContribution.altDataBonus}</div>
                        <div className="text-xs text-muted-foreground">credit score pts</div>
                      </div>
                    </div>
                    {breakdown.altDataRecord && (
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-3 rounded-lg border bg-white dark:bg-slate-900">
                          <div className="text-lg font-bold" data-testid="stat-total-tx">{breakdown.altDataRecord.totalTransactions}</div>
                          <div className="text-xs text-muted-foreground">Total receipts</div>
                        </div>
                        <div className="text-center p-3 rounded-lg border bg-white dark:bg-slate-900">
                          <div className="text-lg font-bold text-emerald-600" data-testid="stat-on-time">{breakdown.altDataRecord.onTimePayments}</div>
                          <div className="text-xs text-muted-foreground">Compliant</div>
                        </div>
                        <div className="text-center p-3 rounded-lg border bg-white dark:bg-slate-900">
                          <div className="text-lg font-bold text-red-500" data-testid="stat-late">{breakdown.altDataRecord.latePayments}</div>
                          <div className="text-xs text-muted-foreground">Flagged</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{breakdown.creditScoreContribution.onTimeRatio}% on-time compliance rate feeds into the "Alternative Data" factor in the credit score calculation.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
