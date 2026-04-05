import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DOMPurify from "isomorphic-dompurify";
import { FileText, Download, Eye, ArrowLeft, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

type DocMeta = {
  id: string;
  filename: string;
  title: string;
  description: string;
  size: number;
};

type DocDetail = DocMeta & {
  content: string;
  html: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ id }: { id: string }) {
  const colors: Record<string, string> = {
    "api-guide": "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 dark:bg-teal-900 dark:text-teal-300",
    uat: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 dark:bg-blue-900 dark:text-blue-300",
    systems: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 dark:bg-purple-900 dark:text-purple-300",
    "users-manual": "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900 dark:text-green-300",
    "srs-matrix": "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900 dark:text-amber-300",
    "data-dictionary": "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 dark:bg-cyan-900 dark:text-cyan-300",
    deployment: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900 dark:text-red-300",
    security: "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    "security-policy": "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    "dr-plan": "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    "change-mgmt": "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    "pentest-readiness": "bg-red-100 dark:bg-red-900 text-red-700 dark:bg-red-900 dark:text-red-300",
    "credit-procedures": "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    "data-protection": "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300",
    "regulatory-pack": "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300",
    "data-submission": "bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300",
    "dispute-procedures": "bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300",
  };
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors[id] || "bg-muted text-foreground"}`}>
      <FileText className="w-6 h-6" />
    </div>
  );
}

export default function DocumentationPage() {
  const { t, i18n } = useTranslation();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const currentLang = i18n.language?.startsWith("fr") ? "fr" : i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("sw") ? "sw" : i18n.language?.startsWith("pt") ? "pt" : "en";

  const { data: docs, isLoading } = useQuery<DocMeta[]>({
    queryKey: ["/api/docs", currentLang],
    queryFn: async () => {
      const res = await fetch(`/api/docs?lang=${currentLang}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch docs");
      return res.json();
    },
  });

  const viewDocument = async (doc: DocMeta) => {
    setLoading(true);
    setDocTitle(doc.title);
    setViewingDoc(doc.id);
    try {
      const res = await apiRequest("GET", `/api/docs/${doc.id}?lang=${currentLang}`);
      const detail: DocDetail = await res.json();
      setDocHtml(detail.html);
    } catch {
      setDocHtml("<p>Failed to load document.</p>");
    }
    setLoading(false);
  };

  const downloadPdf = (docId: string) => {
    window.open(`/api/docs/${docId}/pdf?lang=${currentLang}`, "_blank");
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-docs-title">{t("docs.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4">{t("docs.subtitle")}</p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          <strong>{t("docs.pdfTip")}</strong> {t("docs.pdfTipDesc")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs?.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              data-testid={`card-doc-${doc.id}`}
              onClick={() => viewDocument(doc)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <DocIcon id={doc.id} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{formatSize(doc.size)}</Badge>
                      <Badge variant="outline" className="text-[10px]">Markdown</Badge>
                      <div className="flex items-center gap-1.5 sm:hidden">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] gap-1 px-2"
                          onClick={(e) => { e.stopPropagation(); viewDocument(doc); }}
                          data-testid={`button-view-${doc.id}`}
                        >
                          <Eye className="w-3 h-3" />
                          {t("docs.view")}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-[10px] gap-1 px-2"
                          onClick={(e) => { e.stopPropagation(); downloadPdf(doc.id); }}
                          data-testid={`button-download-mobile-${doc.id}`}
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={(e) => { e.stopPropagation(); viewDocument(doc); }}
                      data-testid={`button-view-desktop-${doc.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("docs.view")}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={(e) => { e.stopPropagation(); downloadPdf(doc.id); }}
                      data-testid={`button-download-${doc.id}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) { setViewingDoc(null); setDocHtml(""); } }}>
        <DialogContent className="w-[95vw] sm:w-auto max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between px-3 sm:p-4 py-3 border-b shrink-0 gap-2">
            <DialogTitle className="sr-only">{docTitle}</DialogTitle>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setViewingDoc(null); setDocHtml(""); }} data-testid="button-close-viewer">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold text-xs sm:text-sm truncate" data-testid="text-viewing-title">{docTitle}</h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3"
                onClick={() => viewingDoc && downloadPdf(viewingDoc)}
                disabled={loading}
                data-testid="button-download-pdf"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("docs.downloadPdf")}</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingDoc(null); setDocHtml(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-3 sm:px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold
                  prose-h1:text-xl prose-h1:mb-4 prose-h1:text-primary
                  prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-primary prose-h2:border-b prose-h2:pb-2
                  prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                  prose-table:text-xs
                  prose-th:bg-muted prose-th:px-2 sm:prose-th:px-3 prose-th:py-2
                  prose-td:px-2 sm:prose-td:px-3 prose-td:py-1.5
                  prose-code:text-[10px] sm:prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:text-[10px] sm:prose-pre:text-xs prose-pre:overflow-x-auto
                  [&_table]:block [&_table]:overflow-x-auto [&_table]:w-full [&_table]:whitespace-nowrap sm:[&_table]:whitespace-normal"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docHtml) }}
                data-testid="doc-content"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
