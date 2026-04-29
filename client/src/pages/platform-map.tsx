import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Landmark,
  Database,
  Receipt,
  Network,
  ShieldCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Lock,
  FileSearch,
  Users,
  Eye,
  type LucideIcon,
} from "lucide-react";

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
  topDenialReasons: { reason: string; count: number }[];
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

interface SystemDef {
  id: "credit" | "collateral" | "loto";
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  iconFg: string;
  holds: string[];
  contributes: string[];
  href: string;
  cta: string;
  testId: string;
}

const SYSTEMS: SystemDef[] = [
  {
    id: "credit",
    title: "Credit Bureau",
    tagline: "Borrower history, scores, payment behaviour",
    icon: Database,
    accent: "border-blue-300 dark:border-blue-700",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconFg: "text-blue-600 dark:text-blue-300",
    holds: [
      "Borrowers, accounts, inquiries",
      "Payment history & disputes",
      "Credit scores & reports",
    ],
    contributes: [
      "Lender-to-lender credit snapshots",
      "DGI reputation badge for merchants",
    ],
    href: "/search",
    cta: "Open credit search",
    testId: "card-system-credit",
  },
  {
    id: "collateral",
    title: "Collateral Registry",
    tagline: "Pledged assets, liens, search certificates",
    icon: Landmark,
    accent: "border-amber-300 dark:border-amber-700",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconFg: "text-amber-600 dark:text-amber-300",
    holds: [
      "Movable & immovable collateral",
      "Lien priorities & registrations",
      "Search certificates",
    ],
    contributes: [
      "Collateral-on-file panel in credit reports",
      "Borrower credit snapshot in collateral views",
    ],
    href: "/collateral-registry",
    cta: "Open registry",
    testId: "card-system-collateral",
  },
  {
    id: "loto",
    title: "Loto Fiscal",
    tagline: "VAT receipts, merchant turnover, consumer spend",
    icon: Receipt,
    accent: "border-emerald-300 dark:border-emerald-700",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconFg: "text-emerald-600 dark:text-emerald-300",
    holds: [
      "Registered merchants",
      "Verified VAT receipts",
      "Consumer spending profiles",
    ],
    contributes: [
      "Receipt-derived merchant credit profile",
      "VAT activity score & financial-inclusion KPIs",
    ],
    href: "/loto-fiscal",
    cta: "Open Loto Fiscal",
    testId: "card-system-loto",
  },
];

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

export default function PlatformMapPage() {
  const { data: impact, isLoading: impactLoading } = useQuery<ImpactPayload>({
    queryKey: ["/api/public/financial-inclusion-impact"],
    refetchInterval: 30_000,
  });

  const { data: bridge, isLoading: bridgeLoading } = useQuery<BridgeAccessPayload>({
    queryKey: ["/api/public/financial-inclusion-recent-bridge-accesses"],
    refetchInterval: 30_000,
  });

  const totalAccesses = impact?.bridgeAccessesLogged ?? 0;
  const allowed = impact?.bridgeAccessesAllowed ?? 0;
  const denied = impact?.bridgeAccessesDenied ?? 0;
  const allowRate = totalAccesses > 0
    ? Math.round((allowed / totalAccesses) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" data-testid="page-platform-map">
      {/* Header */}
      <div className="space-y-3">
        <Badge variant="outline" className="gap-1.5" data-testid="badge-platform">
          <Network className="h-3.5 w-3.5" />
          Platform Map
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-page-title">
          Three systems. One consent gateway.
        </h1>
        <p className="text-muted-foreground max-w-3xl text-base">
          Africa Credit Hub now spans the Credit Bureau, the Collateral Registry, and Loto Fiscal — wired together
          through a single consent-controlled bridge that audits every cross-system data access.
        </p>
      </div>

      {/* System cards */}
      <div className="grid gap-4 md:grid-cols-3" data-testid="grid-systems">
        {SYSTEMS.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.id}
              className={`hover-elevate active-elevate-2 border-2 ${s.accent}`}
              data-testid={s.testId}
            >
              <CardHeader className="space-y-3">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${s.iconBg}`}>
                  <Icon className={`h-6 w-6 ${s.iconFg}`} />
                </div>
                <div>
                  <CardTitle className="text-xl" data-testid={`title-${s.id}`}>{s.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{s.tagline}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Holds
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {s.holds.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Shares with the others
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {s.contributes.map((c) => (
                      <li key={c} className="flex gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-1 text-muted-foreground flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={s.href}>
                  <Button variant="outline" className="w-full" data-testid={`button-open-${s.id}`}>
                    {s.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gateway hub */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-gateway">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl" data-testid="title-gateway">
                Cross-Product Gateway
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Every cross-system data access flows through one place. It checks consent, writes an audit row,
                and only then returns data — there is no bypass path.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live KPI strip */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiTile
              label="Active consents"
              value={impact?.activeCrossProductConsents}
              icon={Lock}
              loading={impactLoading}
              testId="kpi-consents"
            />
            <KpiTile
              label="Bridge accesses"
              value={totalAccesses}
              icon={Activity}
              loading={impactLoading}
              testId="kpi-accesses"
            />
            <KpiTile
              label="Allowed"
              value={allowed}
              suffix={totalAccesses > 0 ? ` (${allowRate}%)` : ""}
              icon={CheckCircle2}
              loading={impactLoading}
              tone="success"
              testId="kpi-allowed"
            />
            <KpiTile
              label="Denied"
              value={denied}
              icon={XCircle}
              loading={impactLoading}
              tone="warn"
              testId="kpi-denied"
            />
          </div>

          {/* Guarantees */}
          <div className="grid gap-3 md:grid-cols-3">
            <GuaranteeChip
              icon={Lock}
              title="Time-bounded consent"
              body={`Consents default to ${impact?.defaultConsentMonths ?? 12} months and can be revoked instantly.`}
            />
            <GuaranteeChip
              icon={FileSearch}
              title="Every access audited"
              body="Source, target, purpose, consent ID and outcome are written before data is returned."
            />
            <GuaranteeChip
              icon={Users}
              title="Subject-visible"
              body="Borrowers, merchants and regulators can review every cross-product access at any time."
            />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/data-sharing">
              <Button variant="default" data-testid="button-manage-consents">
                <Lock className="mr-2 h-4 w-4" />
                Manage my consents
              </Button>
            </Link>
            <Link href="/audit">
              <Button variant="outline" data-testid="button-view-audit">
                <Eye className="mr-2 h-4 w-4" />
                View audit trail
              </Button>
            </Link>
            <Link href="/financial-inclusion">
              <Button variant="outline" data-testid="button-view-impact">
                <Activity className="mr-2 h-4 w-4" />
                Public impact page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent bridge events */}
      <Card data-testid="card-recent-events">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent cross-system accesses</CardTitle>
            {bridge?.lastActivityAt && (
              <Badge variant="outline" className="text-xs" data-testid="badge-last-activity">
                Last activity {formatRelativeTime(bridge.lastActivityAt)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bridgeLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : bridge?.events && bridge.events.length > 0 ? (
            <div className="divide-y">
              {bridge.events.slice(0, 8).map((e, i) => {
                const ok = e.outcome === "ok" || e.outcome === "allowed";
                return (
                  <div
                    key={`${e.timestamp}-${i}`}
                    className="flex items-center justify-between py-2.5 text-sm"
                    data-testid={`row-event-${i}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {humanizeProduct(e.sourceProduct)} → {humanizeProduct(e.targetProduct)}
                      </span>
                      <span className="text-foreground/90 truncate capitalize">
                        {humanizePurpose(e.purpose)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {formatRelativeTime(e.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-events">
              No cross-system accesses recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiTile({
  label,
  value,
  suffix,
  icon: Icon,
  loading,
  tone,
  testId,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  icon: LucideIcon;
  loading: boolean;
  tone?: "success" | "warn";
  testId: string;
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-4" data-testid={testId}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 mt-2" />
      ) : (
        <p className={`mt-1.5 text-2xl font-semibold ${toneClass}`}>
          {(value ?? 0).toLocaleString()}
          {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
        </p>
      )}
    </div>
  );
}

function GuaranteeChip({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border bg-card/50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
