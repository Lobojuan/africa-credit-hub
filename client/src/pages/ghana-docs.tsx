import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Redirect } from "wouter";
import DOMPurify from "isomorphic-dompurify";
import {
  FileText, Download, Eye, Shield, TestTube, Database, ScrollText,
  Building2, Scale, X, Code2, Network, Search, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bgLight: string }> = {
  sla: { label: "SLA", icon: ScrollText, color: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
  compliance: { label: "Compliance", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
  testing: { label: "Testing", icon: TestTube, color: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
  "data-standards": { label: "Data Standards", icon: Database, color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
  "data-protection": { label: "Data Protection", icon: Shield, color: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
  operations: { label: "Operations", icon: Building2, color: "text-cyan-600 dark:text-cyan-400", bgLight: "bg-cyan-50 dark:bg-cyan-950/30" },
  api: { label: "API", icon: Code2, color: "text-orange-600 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
  connections: { label: "Connections", icon: Network, color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GhanaDocsPage() {
  const { t, i18n } = useTranslation();
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const ghanaMode = isGhanaMode();
  const currentLang = i18n.language?.startsWith("fr") ? "fr" : i18n.language?.startsWith("ar") ? "ar" : i18n.language?.startsWith("sw") ? "sw" : i18n.language?.startsWith("pt") ? "pt" : "en";

  const { data: docs, isLoading } = useQuery<GhanaDoc[]>({
    queryKey: ["/api/ghana-docs", currentLang],
    queryFn: async () => {
      const res = await fetch(`/api/ghana-docs?lang=${currentLang}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch docs");
      return res.json();
    },
    enabled: ghanaMode,
  });

  if (!ghanaMode) {
    return <Redirect to="/" />;
  }

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    let result = docs;
    if (activeFilter) {
      result = result.filter(d => d.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (CATEGORY_CONFIG[d.category]?.label || d.category).toLowerCase().includes(q)
      );
    }
    return result;
  }, [docs, activeFilter, searchQuery]);

  const categories = docs
    ? [...new Set(docs.map(d => d.category))]
    : [];

  const viewDocument = async (doc: GhanaDoc) => {
    setLoading(true);
    setDocTitle(doc.title);
    setViewingDoc(doc.id);
    try {
      const res = await apiRequest("GET", `/api/ghana-docs/${doc.id}?lang=${currentLang}`);
      const detail: GhanaDocDetail = await res.json();
      setDocHtml(detail.html);
    } catch {
      setDocHtml("<p>Failed to load document.</p>");
    }
    setLoading(false);
  };

  const downloadPdf = (docId: string) => {
    window.open(`/api/ghana-docs/${docId}/pdf?lang=${currentLang}`, "_blank");
  };

  const downloadMarkdown = (docId: string) => {
    window.open(`/api/ghana-docs/${docId}/download`, "_blank");
  };

  const clearFilters = () => {
    setActiveFilter(null);
    setSearchQuery("");
  };

  const hasActiveFilters = activeFilter !== null || searchQuery.trim() !== "";

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-5 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight" data-testid="text-ghana-docs-title">
            Ghana Compliance
          </h1>
        </div>
        <p className="text-[11px] sm:text-sm text-muted-foreground ml-4">
          BoG CRB v1.1 regulatory documents and compliance frameworks
        </p>
      </div>

      <div className="relative" data-testid="search-container">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search documents..."
          aria-label="Search compliance documents"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10 sm:h-9 text-sm bg-muted/40 border-border/60 rounded-lg"
          data-testid="input-search-docs"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
        <Button
          variant={activeFilter === null ? "default" : "outline"}
          size="sm"
          className="text-[11px] h-7 shrink-0 rounded-full px-3"
          onClick={() => setActiveFilter(null)}
          data-testid="filter-all"
        >
          All ({docs?.length || 0})
        </Button>
        {categories.map(cat => {
          const config = CATEGORY_CONFIG[cat];
          if (!config) return null;
          const Icon = config.icon;
          const count = docs?.filter(d => d.category === cat).length || 0;
          return (
            <Button
              key={cat}
              variant={activeFilter === cat ? "default" : "outline"}
              size="sm"
              className="text-[11px] h-7 shrink-0 rounded-full px-3"
              onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              data-testid={`filter-${cat}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground" data-testid="text-results-count">
            {filteredDocs.length} {filteredDocs.length === 1 ? "document" : "documents"} found
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] h-6 px-2 text-muted-foreground"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            Clear filters
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12" data-testid="empty-state">
          <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No documents found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term or filter</p>
          <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={clearFilters} data-testid="button-empty-clear">
            Show all documents
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDocs.map((doc) => {
              const catConfig = CATEGORY_CONFIG[doc.category];
              const CatIcon = catConfig?.icon || FileText;
              return (
                <Card
                  key={doc.id}
                  className="border border-border/60 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => viewDocument(doc)}
                  data-testid={`card-ghana-doc-${doc.id}`}
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${catConfig?.bgLight || "bg-muted/50 dark:bg-foreground"}`}>
                        <CatIcon className={`w-4.5 h-4.5 ${catConfig?.color || "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
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
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {doc.description}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 flex-1"
                        onClick={(e) => { e.stopPropagation(); viewDocument(doc); }}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 flex-1"
                        onClick={(e) => { e.stopPropagation(); downloadPdf(doc.id); }}
                        data-testid={`button-pdf-${doc.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); downloadMarkdown(doc.id); }}
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

          <div className="sm:hidden space-y-2">
            {filteredDocs.map((doc) => {
              const catConfig = CATEGORY_CONFIG[doc.category];
              const CatIcon = catConfig?.icon || FileText;
              return (
                <div
                  key={doc.id}
                  role="button"
                  tabIndex={0}
                  className="w-full text-left rounded-xl border border-border/50 bg-card p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => viewDocument(doc)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); viewDocument(doc); } }}
                  data-testid={`row-ghana-doc-${doc.id}`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${catConfig?.bgLight || "bg-muted/50 dark:bg-foreground"}`}>
                    <CatIcon className={`w-4 h-4 ${catConfig?.color || "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold leading-tight truncate" data-testid={`text-doc-title-${doc.id}`}>
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium ${catConfig?.color || "text-muted-foreground"}`}>
                        {catConfig?.label || doc.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
        <Scale className="w-3 h-3 shrink-0" />
        <span>Credit Reporting Act, 2007 (Act 726) | Data Protection Act, 2012 (Act 843)</span>
      </div>

      <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) setViewingDoc(null); }}>
        <DialogContent className="w-[95vw] sm:w-auto max-w-4xl h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="bg-background border-b px-3 sm:px-6 py-3 shrink-0">
            <DialogTitle className="sr-only">{docTitle}</DialogTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <h2 className="text-xs sm:text-sm font-semibold truncate" data-testid="text-doc-viewer-title">{docTitle}</h2>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {viewingDoc && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] sm:text-xs h-7 px-2 sm:px-3"
                      onClick={() => downloadPdf(viewingDoc)}
                      data-testid="button-viewer-download-pdf"
                    >
                      <Download className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Download PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] sm:text-xs h-7 px-2 sm:px-3 hidden sm:flex"
                      onClick={() => downloadMarkdown(viewingDoc)}
                      data-testid="button-viewer-download-md"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      .md
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" aria-label="Close document viewer" className="h-7 w-7" onClick={() => setViewingDoc(null)} data-testid="button-close-viewer">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-3 sm:px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-foreground prose-p:text-muted-foreground
                  prose-table:text-xs sm:prose-table:text-sm prose-th:bg-muted/50 prose-th:px-2 sm:prose-th:px-3 prose-th:py-2
                  prose-td:px-2 sm:prose-td:px-3 prose-td:py-1.5 prose-td:border-border
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[10px] sm:prose-code:text-xs
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-[10px] sm:prose-pre:text-xs prose-pre:overflow-x-auto
                  [&_table]:block [&_table]:overflow-x-auto [&_table]:w-full [&_table]:whitespace-nowrap sm:[&_table]:whitespace-normal"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docHtml) }}
                data-testid="doc-viewer-content"
              />
            )}
          </div>
          {viewingDoc && (
            <div className="sm:hidden border-t bg-background px-3 py-2 shrink-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 flex-1"
                onClick={() => downloadPdf(viewingDoc)}
                data-testid="button-mobile-download-pdf"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => downloadMarkdown(viewingDoc)}
                data-testid="button-mobile-download-md"
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> .md
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
