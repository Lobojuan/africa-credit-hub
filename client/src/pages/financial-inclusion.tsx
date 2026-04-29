import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Receipt, TrendingUp, Banknote, ArrowRight, Lock, Globe, FileCheck, Activity, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

interface ImpactPayload {
  merchantsRegistered: number;
  merchantsOptedIn: number;
  verifiedReceipts: number;
  verifiedTurnover: number;
  currency: string;
  activeCrossProductConsents: number;
  bridgeAccessesLogged: number;
  bridgeAccessesAllowed: number;
  bridgeAccessesDenied: number;
  defaultConsentMonths: number;
  generatedAt: string;
}

interface BridgeAccessEvent {
  purpose: string | null;
  sourceProduct: string | null;
  targetProduct: string | null;
  outcome: string | null;
  timestamp: string | null;
}

interface BridgeAccessPayload {
  events: BridgeAccessEvent[];
  generatedAt: string;
  windowDays?: number;
  lastActivityAt?: string | null;
}

const TICKER_REFRESH_MS = 30_000;

function formatRelativeTime(ts: string | null): string {
  if (!ts) return "—";
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function humanizePurpose(p: string | null): string {
  if (!p) return "—";
  return p.replace(/_/g, " ");
}

function humanizeProduct(p: string | null): string {
  if (!p) return "?";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default function FinancialInclusionPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("financialInclusion.docTitle", "Financial Inclusion Impact — Africa Credit Hub");
    const meta = document.querySelector('meta[name="description"]') ?? (() => {
      const m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); return m;
    })();
    meta.setAttribute("content", t("financialInclusion.metaDescription", "How verified VAT receipts unlock credit access for African merchants — privacy-first, consent-bounded, fully audited."));
  }, [t]);

  const { data, isLoading } = useQuery<ImpactPayload>({
    queryKey: ["/api/public/financial-inclusion-impact"],
    refetchInterval: TICKER_REFRESH_MS,
  });

  const { data: bridgeData, isLoading: bridgeLoading } = useQuery<BridgeAccessPayload>({
    queryKey: ["/api/public/financial-inclusion-recent-bridge-accesses"],
    refetchInterval: TICKER_REFRESH_MS,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-background dark:to-background" data-testid="page-financial-inclusion">
      {/* Hero */}
      <section className="px-4 md:px-8 py-12 md:py-20 max-w-6xl mx-auto text-center">
        <Badge className="mb-4 bg-emerald-600" data-testid="badge-hero">{t("financialInclusion.heroBadge", "Financial Inclusion Impact")}</Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" data-testid="text-hero-title">
          {t("financialInclusion.heroTitle", "Every receipt is a step toward credit.")}
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6" data-testid="text-hero-subtitle">
          {t("financialInclusion.heroSubtitle", "Africa Credit Hub turns verified VAT receipts from Loto Fiscal into a credit profile that unlocks loans for previously invisible merchants — entirely on the merchant's terms.")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/loto-fiscal">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-cta-loto">
              {t("financialInclusion.ctaLoto", "Open Loto Fiscal")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/data-sharing">
            <Button size="lg" variant="outline" data-testid="button-cta-sharing">
              {t("financialInclusion.ctaSharing", "How my data is shared")}
            </Button>
          </Link>
        </div>
      </section>

      {/* KPI tiles */}
      <section className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiTile
            icon={Receipt}
            value={isLoading ? null : (data?.verifiedReceipts ?? 0).toLocaleString()}
            label={t("financialInclusion.kpiReceipts", "Verified VAT receipts")}
            testid="kpi-receipts"
          />
          <KpiTile
            icon={TrendingUp}
            value={isLoading ? null : `${(data?.verifiedTurnover ?? 0).toLocaleString()} ${data?.currency ?? ""}`}
            label={t("financialInclusion.kpiTurnover", "Verified merchant turnover")}
            testid="kpi-turnover"
          />
          <KpiTile
            icon={ShieldCheck}
            value={isLoading ? null : `${data?.merchantsOptedIn ?? 0} / ${data?.merchantsRegistered ?? 0}`}
            label={t("financialInclusion.kpiOptIn", "Merchants opted into credit profile")}
            testid="kpi-opt-in"
          />
        </div>
      </section>

      {/* Live bridge ticker */}
      <section className="px-4 md:px-8 py-8 max-w-6xl mx-auto">
        <Card data-testid="card-bridge-ticker">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold" data-testid="text-ticker-title">
                  {t("financialInclusion.tickerTitle", "Recent consent-bridge activity")}
                </h3>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-ticker-caption">
                {t("financialInclusion.tickerCaption", "Last 10 events from the past 7 days · refreshes every 30s · PII redacted")}
              </div>
            </div>

            {bridgeLoading ? (
              <div className="space-y-2" data-testid="ticker-loading">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !bridgeData || bridgeData.events.length === 0 ? (
              <div className="py-6 text-center space-y-1" data-testid="text-ticker-empty">
                <div className="text-sm font-medium" data-testid="text-ticker-empty-title">
                  {t("financialInclusion.tickerEmptyTitle", "Quiet right now")}
                </div>
                {bridgeData?.lastActivityAt ? (
                  <div className="text-xs text-muted-foreground" data-testid="text-ticker-last-activity">
                    {t("financialInclusion.tickerLastActivity", "Last activity: {{when}}", {
                      when: formatRelativeTime(bridgeData.lastActivityAt),
                    })}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground max-w-md mx-auto" data-testid="text-ticker-empty-body">
                  {t("financialInclusion.tickerEmptyBody", "No consent-bridge accesses in the last 7 days. New events appear here as soon as a consented cross-product call is made.")}
                </div>
              </div>
            ) : (
              <ul className="divide-y" data-testid="list-ticker">
                {bridgeData.events.map((ev, idx) => {
                  const isOk = ev.outcome === "ok";
                  return (
                    <li
                      key={`${ev.timestamp ?? "no-ts"}-${idx}`}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm"
                      data-testid={`row-ticker-${idx}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isOk ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                        )}
                        <Badge variant="outline" className="font-mono text-xs shrink-0" data-testid={`badge-ticker-flow-${idx}`}>
                          {humanizeProduct(ev.sourceProduct)} → {humanizeProduct(ev.targetProduct)}
                        </Badge>
                        <span className="text-muted-foreground truncate" data-testid={`text-ticker-purpose-${idx}`}>
                          {humanizePurpose(ev.purpose)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-ticker-time-${idx}`}>
                        {formatRelativeTime(ev.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Story flow */}
      <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" data-testid="text-story-title">
          {t("financialInclusion.storyTitle", "From receipt to loan in four steps")}
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("financialInclusion.storySubtitle", "Same data flow, four products, one consent record. The merchant is in control at every step.")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StoryStep n={1} icon={Receipt} title={t("financialInclusion.step1Title", "Issue & scan a fiscal receipt")} body={t("financialInclusion.step1Body", "The merchant rings a sale on a Loto-registered POS. Every receipt is verified by the tax authority.")} testid="story-1" />
          <StoryStep n={2} icon={FileCheck} title={t("financialInclusion.step2Title", "Receipts become a credit record")} body={t("financialInclusion.step2Body", "Months of verified receipts compose a turnover trend, frequency, and a VAT Activity Score (300–850).")} testid="story-2" />
          <StoryStep n={3} icon={ShieldCheck} title={t("financialInclusion.step3Title", "Merchant opts in")} body={t("financialInclusion.step3Body", "One toggle in the Loto workspace shares the receipt-derived profile with credit lenders. Default 12 months. Revocable any time.")} testid="story-3" />
          <StoryStep n={4} icon={Banknote} title={t("financialInclusion.step4Title", "Lender funds the loan")} body={t("financialInclusion.step4Body", "Lenders see the bridge-verified profile alongside the borrower's credit report and decide with confidence.")} testid="story-4" />
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-4 md:px-8 py-12 bg-emerald-50 dark:bg-emerald-950/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" data-testid="text-trust-title">
            {t("financialInclusion.trustTitle", "Our consent guarantees")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustCard icon={Lock} title={t("financialInclusion.trust1Title", "Consent-first")} body={t("financialInclusion.trust1Body", "No cross-product data flows without an active permission. Default 12 months, revocable instantly.")} testid="trust-1" />
            <TrustCard icon={ShieldCheck} title={t("financialInclusion.trust2Title", "Single gateway")} body={t("financialInclusion.trust2Body", "Every cross-product access goes through one auditable bridge. No silent fallbacks. Ever.")} testid="trust-2" />
            <TrustCard icon={Globe} title={t("financialInclusion.trust3Title", "Available in 7 languages")} body={t("financialInclusion.trust3Body", "EN · FR · PT · AR · SW · ES · ZH so every African merchant can read the small print.")} testid="trust-3" />
          </div>
          {data && (() => {
            const total = data.bridgeAccessesLogged;
            const allowed = data.bridgeAccessesAllowed;
            const denied = data.bridgeAccessesDenied;
            const classified = allowed + denied;
            const allowedPct = classified > 0 ? Math.round((allowed / classified) * 100) : null;
            const deniedPct = allowedPct === null ? null : 100 - allowedPct;
            return (
              <div className="text-center mt-8 space-y-2">
                <div className="text-xs text-muted-foreground" data-testid="text-audit-line">
                  {allowedPct === null
                    ? t("financialInclusion.auditLine", "{{count}} cross-product accesses logged. Default consent {{months}} months.", {
                        count: total,
                        months: data.defaultConsentMonths,
                      })
                    : t(
                        "financialInclusion.auditLineWithBreakdown",
                        "{{count}} cross-product accesses · {{allowedPct}}% allowed · {{deniedPct}}% denied (consent missing or revoked). Default consent {{months}} months.",
                        {
                          count: total,
                          allowedPct,
                          deniedPct,
                          months: data.defaultConsentMonths,
                        },
                      )}
                </div>
                {classified > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 text-xs" data-testid="outcome-breakdown">
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-400" data-testid="badge-outcome-allowed">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      {t("financialInclusion.outcomeAllowed", "{{count}} allowed", { count: allowed })}
                    </Badge>
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400" data-testid="badge-outcome-denied">
                      <XCircle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      {t("financialInclusion.outcomeDenied", "{{count}} denied (consent missing or revoked)", { count: denied })}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      <footer className="px-4 md:px-8 py-8 text-center text-xs text-muted-foreground" data-testid="text-footer">
        {t("financialInclusion.footer", "© Africa Credit Hub. Universal credit infrastructure for emerging markets.")}
      </footer>
    </div>
  );
}

function KpiTile({ icon: Icon, value, label, testid }: { icon: LucideIcon; value: string | null; label: string; testid: string }) {
  return (
    <Card data-testid={testid}>
      <CardContent className="p-6 text-center">
        <Icon className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
        {value === null ? <Skeleton className="h-8 w-32 mx-auto mb-1" /> : (
          <div className="text-2xl md:text-3xl font-bold mb-1" data-testid={`${testid}-value`}>{value}</div>
        )}
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function StoryStep({ n, icon: Icon, title, body, testid }: { n: number; icon: LucideIcon; title: string; body: string; testid: string }) {
  return (
    <Card data-testid={testid}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">{n}</div>
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function TrustCard({ icon: Icon, title, body, testid }: { icon: LucideIcon; title: string; body: string; testid: string }) {
  return (
    <Card data-testid={testid}>
      <CardContent className="p-5">
        <Icon className="w-6 h-6 mb-3 text-emerald-600" />
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
