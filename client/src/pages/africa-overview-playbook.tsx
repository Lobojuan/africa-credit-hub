import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Lock, Clock, AlertCircle, Eye, BarChart2, User, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "isomorphic-dompurify";

const TEAL = "#0d9488";
const GOLD = "#f59e0b";

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

const COUNTRIES = [
  { flag: "🇬🇭", name: "Ghana", regulator: "Bank of Ghana", currency: "GHS", law: "DPA 2012 (Act 843)" },
  { flag: "🇳🇬", name: "Nigeria", regulator: "CBN + NDPC", currency: "NGN", law: "NDPA 2023" },
  { flag: "🇰🇪", name: "Kenya", regulator: "CBK + OPC", currency: "KES", law: "DPA 2019" },
  { flag: "🇿🇦", name: "South Africa", regulator: "NCR + FSCA", currency: "ZAR", law: "POPIA 2020" },
  { flag: "🇨🇮", name: "Côte d'Ivoire", regulator: "BCEAO + DGI", currency: "XOF", law: "Loi 2013-450" },
];

export default function AfricaOverviewPlaybookPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const role = user?.role;
  if (role !== "super_admin" && role !== "platform_owner") {
    return <Redirect to="/dashboard" />;
  }

  const { data, isLoading, isError } = useQuery<PlaybookContent>({
    queryKey: ["/api/sales/africa-overview-playbook/content"],
  });

  const { data: stats } = useQuery<PlaybookStats>({
    queryKey: ["/api/sales/africa-overview-playbook/stats"],
  });

  useEffect(() => {
    fetch("/api/sales/africa-overview-playbook/view", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/sales/africa-overview-playbook/pdf", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "UCH-East-West-Africa-Regional-Overview.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: "East & West Africa Regional Overview saved to your downloads folder." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header banner */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0f4c81 0%, #1a6b5e 100%)` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white translate-x-48 -translate-y-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-32 translate-y-32" />
        </div>
        <div className="relative px-6 py-8 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="text-xs font-semibold bg-white/20 text-white border-white/30 hover:bg-white/20">
                    Sales Tools
                  </Badge>
                  <Badge className="text-xs font-semibold bg-white/20 text-white border-white/30 hover:bg-white/20">
                    Regional Overview
                  </Badge>
                  <Badge className="text-xs font-semibold bg-white/20 text-white border-white/30 hover:bg-white/20">
                    Confidential
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Globe className="w-7 h-7 text-white/80" />
                  <h1 className="text-3xl font-extrabold text-white">East &amp; West Africa Regional Overview</h1>
                </div>
                <p className="text-blue-100 text-sm font-medium ml-10">Universal Credit Hub — Pan-African Credit Registry · 5 Countries · 3,500+ Institutions</p>
                {updatedAt && (
                  <p className="text-blue-200 text-xs mt-1 ml-10 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Source last modified: {updatedAt}
                  </p>
                )}
              </div>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="shrink-0 bg-white text-blue-800 hover:bg-blue-50 font-semibold shadow-lg"
                data-testid="button-download-africa-overview-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Generating…" : "Download PDF"}
              </Button>
            </div>

            {/* Country flag strip */}
            <div className="mt-5 flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1"
                  data-testid={`country-badge-${c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="text-white text-xs font-semibold">{c.name}</span>
                  <span className="text-white/60 text-xs">{c.currency}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 h-1 rounded-full" style={{ background: GOLD }} />
          </div>
        </div>
      </div>

      {/* Engagement stats */}
      {stats && (
        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-6">
          <div className="flex flex-wrap gap-3">
            <Card className="flex-1 min-w-[160px] border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20" data-testid="stat-downloads-this-month">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="rounded-full p-1.5 bg-teal-100 dark:bg-teal-900/40">
                  <Download className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Downloads this month</p>
                  <p className="text-xl font-bold text-teal-700 dark:text-teal-400">{stats.downloadsThisMonth}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[160px] border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" data-testid="stat-views-this-month">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="rounded-full p-1.5 bg-amber-100 dark:bg-amber-900/40">
                  <Eye className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Views this month</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.viewsThisMonth}</p>
                </div>
              </CardContent>
            </Card>
            {role === "platform_owner" && stats.byUser.length > 0 && (
              <Card className="flex-1 min-w-[220px] border-slate-200 dark:border-slate-700" data-testid="stat-by-user-breakdown">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By user</p>
                  </div>
                  <div className="space-y-1">
                    {stats.byUser.slice(0, 5).map(row => (
                      <div key={row.username} className="flex items-center justify-between gap-2 text-xs" data-testid={`stat-user-row-${row.username}`}>
                        <span className="flex items-center gap-1 text-foreground font-medium truncate">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          {row.username ?? "unknown"}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {row.downloads}↓ &nbsp;{row.views}👁
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Quick comparison cards */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Country Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" data-testid="country-comparison-grid">
          {COUNTRIES.map((c) => (
            <Card
              key={c.name}
              className="border-teal-100 dark:border-teal-900/40 bg-gradient-to-b from-teal-50/60 to-background dark:from-teal-950/20"
              data-testid={`country-card-${c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
            >
              <CardContent className="py-4 px-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{c.flag}</span>
                  <span className="font-semibold text-sm text-foreground">{c.name}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Regulator: </span>
                    <span className="font-medium text-foreground">{c.regulator}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Currency: </span>
                    <span className="font-medium text-foreground">{c.currency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data law: </span>
                    <span className="font-medium text-foreground">{c.law}</span>
                  </div>
                </div>
                <Badge className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-100">
                  Live
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Markdown content */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
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
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Could not load playbook content</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Check that the source file exists at exports/africa-overview-playbook.md and try refreshing.</p>
            </div>
          </div>
        )}

        {data && (
          <div
            data-testid="playbook-content"
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-bold
              prose-h1:text-2xl prose-h1:text-teal-700 dark:prose-h1:text-teal-400
              prose-h2:text-xl prose-h2:text-teal-700 dark:prose-h2:text-teal-400 prose-h2:border-b prose-h2:border-teal-200 dark:prose-h2:border-teal-800 prose-h2:pb-1
              prose-h3:text-base prose-h3:text-teal-800 dark:prose-h3:text-teal-300
              prose-h4:text-sm prose-h4:text-foreground
              prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-950/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-table:text-sm prose-table:border-collapse
              prose-th:bg-teal-50 dark:prose-th:bg-teal-950/30 prose-th:text-teal-700 dark:prose-th:text-teal-400 prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-teal-200 dark:prose-th:border-teal-800
              prose-td:p-2 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700
              prose-li:my-0.5
              prose-code:text-teal-700 dark:prose-code:text-teal-400 prose-code:bg-teal-50 dark:prose-code:bg-teal-950/30 prose-code:px-1 prose-code:rounded
              prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html) }}
          />
        )}

        {/* Footer */}
        <div className="border-t mt-10 pt-6 pb-8 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>This document is confidential and intended solely for the named recipient.</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.</p>
        </div>
      </div>
    </div>
  );
}
