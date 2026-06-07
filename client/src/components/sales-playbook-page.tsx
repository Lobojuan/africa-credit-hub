import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Lock,
  ChevronDown,
  ShieldCheck,
  Target,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PlaybookEditorButton } from "@/components/playbook-editor";

type PlaybookContent = {
  content: string;
  html: string;
  updatedAt: string;
};

type PlaybookStats = {
  downloadsThisMonth: number;
  viewsThisMonth: number;
  byUser: { username: string; downloads: number; views: number }[];
};

type BriefingStat = {
  label: string;
  value: string;
  detail: string;
  icon?: "target" | "users" | "calendar";
};

type DemoCredential = {
  user: string;
  role: string;
};

type SalesPlaybookPageProps = {
  title: string;
  marketLabel: string;
  description: string;
  contentEndpoint: string;
  patchEndpoint: string;
  pdfEndpoint: string;
  downloadFileName: string;
  sourceHint: string;
  statsEndpoint?: string;
  viewEndpoint?: string;
  briefingStats: BriefingStat[];
  talkingPoints: string[];
  credentials?: DemoCredential[];
};

const DEFAULT_CREDENTIALS: DemoCredential[] = [
  { user: "demo_admin", role: "Platform Owner" },
  { user: "credit_admin", role: "Credit Bureau Admin" },
  { user: "johndoe", role: "Credit + Collateral Registry" },
  { user: "registry_admin", role: "Registry Authority" },
];

const meetingFlow = [
  { time: "0:00", durationKey: "durationTwoMin", labelKey: "flowOpening" },
  { time: "2:00", durationKey: "durationTwelveMin", labelKey: "flowDemo" },
  { time: "14:00", durationKey: "durationFourMin", labelKey: "flowQuestions" },
  { time: "18:00", durationKey: "durationTwoMin", labelKey: "flowClose" },
];

const iconMap = {
  target: Target,
  users: Users,
  calendar: CalendarDays,
};

function cleanPlaybookHtml(html: string) {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  body.querySelector("h1")?.remove();

  Array.from(body.querySelectorAll("p")).find((p) =>
    p.textContent?.includes("Audience:") && p.textContent?.includes("Confidential"),
  )?.remove();

  const quickReference = Array.from(body.querySelectorAll("h2")).find((h2) =>
    h2.textContent?.toLowerCase().includes("quick reference"),
  );

  if (quickReference) {
    let node = quickReference.nextElementSibling;
    while (node && node.tagName.toLowerCase() !== "h2") {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }
    quickReference.remove();
  }

  Array.from(body.querySelectorAll("hr")).slice(0, 2).forEach((hr) => hr.remove());

  return body.innerHTML;
}

export function SalesPlaybookPage({
  title,
  marketLabel,
  description,
  contentEndpoint,
  patchEndpoint,
  pdfEndpoint,
  downloadFileName,
  sourceHint,
  statsEndpoint,
  viewEndpoint,
  briefingStats,
  talkingPoints,
  credentials = DEFAULT_CREDENTIALS,
}: SalesPlaybookPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const role = user?.role;
  if (role !== "super_admin" && role !== "platform_owner") {
    return <Redirect to="/dashboard" />;
  }

  const { data, isLoading, isError } = useQuery<PlaybookContent>({
    queryKey: [contentEndpoint],
  });

  const { data: stats } = useQuery<PlaybookStats>({
    queryKey: [statsEndpoint ?? "sales-playbook-stats-disabled"],
    enabled: Boolean(statsEndpoint),
  });

  useEffect(() => {
    if (!viewEndpoint) return;
    fetch(viewEndpoint, { method: "POST", credentials: "include" }).catch(() => {});
  }, [viewEndpoint]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(pdfEndpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t("salesPlaybook.downloadedTitle"),
        description: t("salesPlaybook.downloadedDesc", { title }),
      });
    } catch {
      toast({
        title: t("salesPlaybook.downloadFailedTitle"),
        description: t("salesPlaybook.downloadFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  }

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const cleanedHtml = useMemo(() => data?.html ? cleanPlaybookHtml(data.html) : "", [data?.html]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-6">
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/20 shadow-sm" data-testid="stat-downloads-this-month">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="rounded-full p-2.5 bg-teal-100 dark:bg-teal-900/40">
                  <Download className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("salesPlaybook.downloadsThisMonth")}</p>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{stats.downloadsThisMonth}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm" data-testid="stat-views-this-month">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="rounded-full p-2.5 bg-amber-100 dark:bg-amber-900/40">
                  <Eye className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("salesPlaybook.viewsThisMonth")}</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.viewsThisMonth}</p>
                </div>
              </CardContent>
            </Card>
            {role === "platform_owner" && stats.byUser.length > 0 && (
              <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700" data-testid="stat-by-user-breakdown">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("salesPlaybook.byUser")}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {stats.byUser.slice(0, 6).map(row => (
                      <div key={row.username} className="flex items-center justify-between gap-2 text-xs rounded-md border bg-background px-3 py-2" data-testid={`stat-user-row-${row.username}`}>
                        <span className="flex items-center gap-1 text-foreground font-medium truncate">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          {row.username ?? "unknown"}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {t("salesPlaybook.userStats", { downloads: row.downloads, views: row.views })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-200">
                    {marketLabel}
                  </Badge>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                    {t("salesPlaybook.confidential")}
                  </Badge>
                  {updatedAt && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {t("salesPlaybook.updated", { date: updatedAt })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(role === "super_admin" || role === "platform_owner") && (
                    <PlaybookEditorButton
                      contentQueryKey={contentEndpoint}
                      patchEndpoint={patchEndpoint}
                      playbookTitle={title}
                      currentContent={data?.content}
                      buttonClassName="shrink-0 border-border bg-background text-foreground hover:bg-muted font-semibold"
                    />
                  )}
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="shrink-0 bg-teal-700 text-white hover:bg-teal-800"
                    data-testid="button-download-playbook-pdf"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? t("salesPlaybook.generating") : t("salesPlaybook.downloadPdf")}
                  </Button>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-normal text-foreground">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                {description}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {briefingStats.map((item) => {
                  const Icon = iconMap[item.icon ?? "target"];
                  return (
                    <div key={item.label} className="rounded-lg border bg-background p-4">
                      <Icon className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                      <div className="mt-3 text-2xl font-bold text-foreground">{item.value}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t xl:border-l xl:border-t-0 bg-slate-950 p-6 md:p-8 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-200">
                <ShieldCheck className="h-4 w-4" />
                {t("salesPlaybook.marketReadyPositioning")}
              </div>
              <div className="mt-5 space-y-3">
                {talkingPoints.map((point, index) => (
                  <div key={point} className="flex gap-3 rounded-lg bg-white/7 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-400 text-xs font-bold text-slate-950">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-100">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.85fr] gap-5">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("salesPlaybook.meetingFlow")}</h2>
                  <p className="text-sm text-muted-foreground">{t("salesPlaybook.meetingFlowDesc")}</p>
                </div>
                <Badge variant="secondary">{t("salesPlaybook.twentyMinutes")}</Badge>
              </div>
              <div className="space-y-2">
                {meetingFlow.map((item) => (
                  <div key={item.time} className="grid grid-cols-[4.5rem_5rem_1fr] items-center gap-3 rounded-md border bg-background p-3 text-sm">
                    <span className="font-mono font-semibold text-teal-700 dark:text-teal-300">{item.time}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
                      {t(`salesPlaybook.${item.durationKey}`)}
                    </span>
                    <span className="text-foreground">{t(`salesPlaybook.${item.labelKey}`)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-foreground">{t("salesPlaybook.demoCredentials")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("salesPlaybook.demoCredentialsDesc")}</p>
              <details className="group rounded-md border bg-background" data-testid="details-demo-credentials">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
                  <span>{t("salesPlaybook.showDemoCredentials")}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-2 border-t p-3">
                  {credentials.map((credential) => (
                    <div key={credential.user} className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
                      <code className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                        {credential.user}
                      </code>
                      <span className="text-right text-xs text-muted-foreground">{credential.role}</span>
                    </div>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("salesPlaybook.fullPlaybook")}</h2>
              <p className="text-sm text-muted-foreground">{sourceHint}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              {t("salesPlaybook.readyForRehearsal")}
            </div>
          </div>
          <div className="p-5 md:p-7">
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-40 w-full mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}

            {isError && (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t("salesPlaybook.loadErrorTitle")}</p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{t("salesPlaybook.loadErrorDesc")}</p>
                </div>
              </div>
            )}

            {data && (
              <div
                data-testid="playbook-content"
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-p:leading-7 prose-p:text-muted-foreground
                  prose-headings:font-bold
                  prose-h1:hidden
                  prose-h2:text-xl prose-h2:text-teal-700 dark:prose-h2:text-teal-400 prose-h2:border-b prose-h2:border-teal-200 dark:prose-h2:border-teal-800 prose-h2:pb-1
                  prose-h3:text-base prose-h3:text-teal-800 dark:prose-h3:text-teal-300
                  prose-h4:text-sm prose-h4:text-foreground
                  prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-950/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-table:text-sm prose-table:border-collapse
                  prose-th:bg-teal-50 dark:prose-th:bg-teal-950/30 prose-th:text-teal-700 dark:prose-th:text-teal-400 prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-teal-200 dark:prose-th:border-teal-800
                  prose-td:p-2 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700
                  prose-li:my-0.5
                  prose-code:text-teal-700 dark:prose-code:text-teal-400 prose-code:bg-teal-50 dark:prose-code:bg-teal-950/30 prose-code:px-1 prose-code:rounded
                  prose-pre:rounded-lg prose-pre:border prose-pre:border-teal-200 prose-pre:bg-teal-50 prose-pre:text-teal-900 prose-pre:shadow-none prose-pre:whitespace-pre-wrap dark:prose-pre:border-teal-800 dark:prose-pre:bg-slate-950 dark:prose-pre:text-teal-100
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanedHtml) }}
              />
            )}
          </div>
        </section>

        <div className="border-t mt-10 pt-6 pb-8 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>{t("salesPlaybook.confidentialNotice")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("salesPlaybook.copyright")}</p>
        </div>
      </div>
    </div>
  );
}
