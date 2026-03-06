import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Redirect } from "wouter";
import {
  FileText, Download, Eye, Shield, TestTube, Database, ScrollText,
  Building2, Scale, Filter, X
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isGhanaMode } from "@/lib/country-mode";

type GhanaDoc = {
  id: string;
  filename: string;
  title: string;
  description: string;
  size: number;
  category: string;
};

type GhanaDocDetail = GhanaDoc & {
  content: string;
  html: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  sla: { label: "SLA", icon: ScrollText, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  compliance: { label: "Compliance", icon: Shield, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  testing: { label: "Testing", icon: TestTube, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  "data-standards": { label: "Data Standards", icon: Database, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  operations: { label: "Operations", icon: Building2, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GhanaDocsPage() {
  const { t } = useTranslation();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const ghanaMode = isGhanaMode();

  const { data: docs, isLoading } = useQuery<GhanaDoc[]>({
    queryKey: ["/api/ghana-docs"],
    enabled: ghanaMode,
  });

  if (!ghanaMode) {
    return <Redirect to="/" />;
  }

  const filteredDocs = docs?.filter(d => !activeFilter || d.category === activeFilter) || [];

  const categories = docs
    ? [...new Set(docs.map(d => d.category))]
    : [];

  const viewDocument = async (doc: GhanaDoc) => {
    setLoading(true);
    setDocTitle(doc.title);
    setViewingDoc(doc.id);
    try {
      const res = await apiRequest("GET", `/api/ghana-docs/${doc.id}`);
      const detail: GhanaDocDetail = await res.json();
      setDocHtml(detail.html);
    } catch {
      setDocHtml("<p>Failed to load document.</p>");
    }
    setLoading(false);
  };

  const downloadPdf = (docId: string) => {
    window.open(`/api/ghana-docs/${docId}/pdf`, "_blank");
  };

  const downloadMarkdown = (docId: string) => {
    window.open(`/api/ghana-docs/${docId}/download`, "_blank");
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-ghana-docs-title">
            Ghana Compliance Documents
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          Bank of Ghana CRB v1.1 regulatory documents, SLA agreements, data standards, and compliance frameworks
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeFilter === null ? "default" : "outline"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setActiveFilter(null)}
          data-testid="filter-all"
        >
          All Documents
        </Button>
        {categories.map(cat => {
          const config = CATEGORY_CONFIG[cat];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <Button
              key={cat}
              variant={activeFilter === cat ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              data-testid={`filter-${cat}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Button>
          );
        })}
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          <span>Credit Reporting Act, 2007 (Act 726) | Data Protection Act, 2012 (Act 843)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const catConfig = CATEGORY_CONFIG[doc.category];
            const CatIcon = catConfig?.icon || FileText;
            return (
              <Card
                key={doc.id}
                className="border border-border/60 hover:border-primary/30 transition-all group"
                data-testid={`card-ghana-doc-${doc.id}`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${catConfig?.color || "bg-gray-100 text-gray-700"}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-tight" data-testid={`text-doc-title-${doc.id}`}>
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize">
                          {catConfig?.label || doc.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {doc.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => viewDocument(doc)}
                      data-testid={`button-view-${doc.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => downloadPdf(doc.id)}
                      data-testid={`button-pdf-${doc.id}`}
                    >
                      <Download className="w-3 h-3 mr-1" /> PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => downloadMarkdown(doc.id)}
                      data-testid={`button-md-${doc.id}`}
                    >
                      <FileText className="w-3 h-3 mr-1" /> .md
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) setViewingDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold" data-testid="text-doc-viewer-title">{docTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              {viewingDoc && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => downloadPdf(viewingDoc)}
                    data-testid="button-viewer-download-pdf"
                  >
                    <Download className="w-3 h-3 mr-1" /> Download PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => downloadMarkdown(viewingDoc)}
                    data-testid="button-viewer-download-md"
                  >
                    <FileText className="w-3 h-3 mr-1" /> .md
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingDoc(null)} data-testid="button-close-viewer">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-foreground prose-p:text-muted-foreground
                  prose-table:text-sm prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2
                  prose-td:px-3 prose-td:py-2 prose-td:border-border
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border"
                dangerouslySetInnerHTML={{ __html: docHtml }}
                data-testid="doc-viewer-content"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
