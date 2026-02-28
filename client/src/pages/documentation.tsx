import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Download, Eye, ArrowLeft, Printer, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    uat: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    systems: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "users-manual": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    "srs-matrix": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    "data-dictionary": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    deployment: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    security: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  };
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors[id] || "bg-gray-100 text-gray-700"}`}>
      <FileText className="w-6 h-6" />
    </div>
  );
}

export default function DocumentationPage() {
  const { t } = useTranslation();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: docs, isLoading } = useQuery<DocMeta[]>({
    queryKey: ["/api/docs"],
  });

  const viewDocument = async (doc: DocMeta) => {
    setLoading(true);
    setDocTitle(doc.title);
    setViewingDoc(doc.id);
    try {
      const res = await apiRequest("GET", `/api/docs/${doc.id}`);
      const detail: DocDetail = await res.json();
      setDocHtml(detail.html);
    } catch {
      setDocHtml("<p>Failed to load document.</p>");
    }
    setLoading(false);
  };

  const printDocument = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${docTitle} — Systems In Motion Limited™</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
  }
  h1 { font-size: 22pt; font-weight: 700; margin: 0 0 8px 0; color: #0d4a42; }
  h2 { font-size: 16pt; font-weight: 700; margin: 28px 0 12px 0; color: #0d4a42; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; }
  h3 { font-size: 13pt; font-weight: 600; margin: 20px 0 8px 0; color: #333; }
  h4 { font-size: 11pt; font-weight: 600; margin: 16px 0 6px 0; color: #555; }
  p { margin: 0 0 10px 0; }
  ul, ol { margin: 0 0 10px 0; padding-left: 24px; }
  li { margin-bottom: 3px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  code { font-family: 'Courier New', monospace; background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 10px 0; font-size: 9pt; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #0d4a42; margin: 10px 0; padding: 8px 16px; background: #f9f9f9; }
  strong { font-weight: 600; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
  .header-bar { width: 60px; height: 4px; background: linear-gradient(90deg, #0d4a42, #d4a843); border-radius: 2px; margin-bottom: 16px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #0d4a42; font-size: 9pt; color: #888; text-align: center; }
  @media print {
    body { padding: 20px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header-bar"></div>
  ${docHtml}
  <div class="footer">
    <p>Systems In Motion Limited™ — Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1</p>
    <p>© 2026 Systems In Motion Limited. All rights reserved.</p>
    <p>Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-docs-title">{t("docs.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4">{t("docs.subtitle")}</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
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
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <DocIcon id={doc.id} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="text-[10px]">{formatSize(doc.size)}</Badge>
                      <Badge variant="outline" className="text-[10px]">Markdown</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={(e) => { e.stopPropagation(); viewDocument(doc); }}
                      data-testid={`button-view-${doc.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("docs.view")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) { setViewingDoc(null); setDocHtml(""); } }}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingDoc(null); setDocHtml(""); }} data-testid="button-close-viewer">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold text-sm" data-testid="text-viewing-title">{docTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={printDocument}
                disabled={loading || !docHtml}
                data-testid="button-download-pdf"
              >
                <Download className="w-3.5 h-3.5" />
                {t("docs.downloadPdf")}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingDoc(null); setDocHtml(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
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
                  prose-th:bg-muted prose-th:px-3 prose-th:py-2
                  prose-td:px-3 prose-td:py-1.5
                  prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:text-xs"
                dangerouslySetInnerHTML={{ __html: docHtml }}
                data-testid="doc-content"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
