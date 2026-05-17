import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Lock, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "isomorphic-dompurify";
import { PlaybookEditorButton } from "@/components/playbook-editor";

const TEAL = "#0d9488";
const GOLD = "#f59e0b";

type PlaybookContent = {
  content: string;
  html: string;
  updatedAt: string;
};

export default function CoteDivoirePlaybookPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const role = user?.role;
  if (role !== "super_admin" && role !== "platform_owner") {
    return <Redirect to="/dashboard" />;
  }

  const { data, isLoading, isError } = useQuery<PlaybookContent>({
    queryKey: ["/api/sales/cotedivoire-playbook/content"],
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/sales/cotedivoire-playbook/pdf", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "UCH-CoteDIvoire-Demo-Playbook.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: "Côte d'Ivoire Demo Playbook saved to your downloads folder." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  const updatedAt = data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0f766e 100%)` }}>
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
                    Confidential
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-1">Côte d'Ivoire Demo Playbook</h1>
                <p className="text-teal-100 text-sm font-medium">Universal Credit Hub — Pan-African Credit Registry</p>
                {updatedAt && (
                  <p className="text-teal-200 text-xs mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Source last modified: {updatedAt}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(role === "super_admin" || role === "platform_owner") && (
                  <PlaybookEditorButton
                    contentQueryKey="/api/sales/cotedivoire-playbook/content"
                    patchEndpoint="/api/sales/cotedivoire-playbook/content"
                    playbookTitle="Côte d'Ivoire Demo Playbook"
                    currentContent={data?.content}
                  />
                )}
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-white text-teal-700 hover:bg-teal-50 font-semibold shadow-lg"
                  data-testid="button-download-playbook-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Generating…" : "Download PDF"}
                </Button>
              </div>
            </div>
            <div className="mt-4 h-1 rounded-full" style={{ background: GOLD }} />
          </div>
        </div>
      </div>

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
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Check that the source file exists at exports/cotedivoire-demo-playbook.md and try refreshing.</p>
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

        <div className="border-t mt-10 pt-6 pb-8 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>This document is confidential and intended solely for the named recipient.</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Universal Credit Hub Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
