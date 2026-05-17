import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save, ArrowLeft, Eye, EyeOff, Clock, RotateCcw, AlertCircle, CheckCircle2, History, X
} from "lucide-react";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DOMPurify from "isomorphic-dompurify";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TEAL = "#0d9488";
const GOLD = "#f59e0b";

type PlaybookContent = {
  content: string;
  html: string;
  updatedAt: string;
  playbookId: string;
};

type PlaybookVersion = {
  id: number;
  playbookId: string;
  content: string;
  savedBy: string | null;
  savedAt: string;
  label: string | null;
};

type VersionsResponse = {
  versions: PlaybookVersion[];
};

export default function GhanaPlaybookEditorPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const role = user?.role;
  if (role !== "super_admin" && role !== "platform_owner") {
    return <Redirect to="/dashboard" />;
  }

  const [preview, setPreview] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<PlaybookVersion | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  const { data, isLoading, isError } = useQuery<PlaybookContent>({
    queryKey: ["/api/sales/ghana-playbook/content"],
    staleTime: 0,
  });

  const { data: versionsData } = useQuery<VersionsResponse>({
    queryKey: ["/api/sales/ghana-playbook/versions"],
    enabled: historyOpen,
  });

  const currentContent = draftContent ?? data?.content ?? "";

  const saveMutation = useMutation({
    mutationFn: ({ content, label }: { content: string; label?: string }) =>
      apiRequest("PUT", "/api/sales/ghana-playbook/content", { content, label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/ghana-playbook/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/ghana-playbook/versions"] });
      setDraftContent(null);
      setVersionLabel("");
      toast({ title: "Playbook saved", description: "Your changes have been saved and are now live." });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message ?? "Could not save. Please try again.", variant: "destructive" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: number) =>
      apiRequest("POST", `/api/sales/ghana-playbook/versions/${versionId}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/ghana-playbook/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/ghana-playbook/versions"] });
      setDraftContent(null);
      setHistoryOpen(false);
      setRestoreTarget(null);
      toast({ title: "Version restored", description: "The selected version is now live." });
    },
    onError: (e: any) => {
      toast({ title: "Restore failed", description: e?.message ?? "Could not restore. Please try again.", variant: "destructive" });
    },
  });

  const isDirty = draftContent !== null && draftContent !== data?.content;

  const handleTogglePreview = useCallback(async () => {
    if (!preview) {
      setGeneratingPreview(true);
      try {
        const { marked } = await import("marked");
        const html = await marked(currentContent);
        setPreviewHtml(html as string);
      } finally {
        setGeneratingPreview(false);
      }
    }
    setPreview(p => !p);
  }, [preview, currentContent]);

  const handleSave = () => {
    if (!isDirty) return;
    saveMutation.mutate({ content: currentContent, label: versionLabel.trim() || undefined });
  };

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0f766e 100%)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white translate-x-48 -translate-y-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-32 translate-y-32" />
        </div>
        <div className="relative px-6 py-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/sales/ghana-playbook")}
                  className="text-white hover:bg-white/20 hover:text-white"
                  data-testid="button-back-to-playbook"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-xs font-semibold bg-white/20 text-white border-white/30 hover:bg-white/20">
                      Editor
                    </Badge>
                    {isDirty && (
                      <Badge className="text-xs font-semibold bg-amber-400/80 text-amber-900 border-0">
                        Unsaved changes
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl font-extrabold text-white">Ghana Demo Playbook — Edit</h1>
                  {updatedAt && (
                    <p className="text-teal-200 text-xs mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Last saved: {updatedAt}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="text-white hover:bg-white/20 hover:text-white"
                  data-testid="button-open-version-history"
                >
                  <History className="w-4 h-4 mr-1.5" />
                  Version History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTogglePreview}
                  disabled={generatingPreview}
                  className="text-white hover:bg-white/20 hover:text-white"
                  data-testid="button-toggle-preview"
                >
                  {preview ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                  {generatingPreview ? "Loading…" : preview ? "Edit" : "Preview"}
                </Button>
                {isDirty && (
                  <Input
                    data-testid="input-version-label"
                    value={versionLabel}
                    onChange={e => setVersionLabel(e.target.value)}
                    placeholder="Version label (optional)"
                    className="h-9 w-52 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus-visible:ring-white/50 text-sm"
                    maxLength={120}
                  />
                )}
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || saveMutation.isPending}
                  className="bg-white text-teal-700 hover:bg-teal-50 font-semibold shadow-lg disabled:opacity-50"
                  data-testid="button-save-playbook"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-pulse" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full" style={{ background: GOLD }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-10 py-6">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Could not load playbook content. Please refresh and try again.
            </p>
          </div>
        )}

        {saveMutation.isSuccess && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Playbook saved successfully. Changes are now live on the playbook page.
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {preview ? "Preview — rendered from Markdown" : "Markdown editor — use ## headings, **bold**, | tables |, > blockquotes"}
              </span>
              <span>{currentContent.length.toLocaleString()} characters</span>
            </div>

            {preview ? (
              <div
                data-testid="editor-preview"
                className="min-h-[600px] rounded-lg border bg-card p-6 overflow-auto
                  prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold
                  prose-h1:text-2xl prose-h1:text-teal-700 dark:prose-h1:text-teal-400
                  prose-h2:text-xl prose-h2:text-teal-700 dark:prose-h2:text-teal-400 prose-h2:border-b prose-h2:border-teal-200 dark:prose-h2:border-teal-800 prose-h2:pb-1
                  prose-h3:text-base prose-h3:text-teal-800 dark:prose-h3:text-teal-300
                  prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-950/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-table:text-sm prose-table:border-collapse
                  prose-th:bg-teal-50 dark:prose-th:bg-teal-950/30 prose-th:text-teal-700 dark:prose-th:text-teal-400 prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-teal-200 dark:prose-th:border-teal-800
                  prose-td:p-2 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700
                  prose-li:my-0.5
                  prose-code:text-teal-700 dark:prose-code:text-teal-400 prose-code:bg-teal-50 dark:prose-code:bg-teal-950/30 prose-code:px-1 prose-code:rounded
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
              />
            ) : (
              <textarea
                data-testid="editor-textarea"
                className="w-full min-h-[600px] rounded-lg border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y leading-relaxed"
                value={currentContent}
                onChange={e => setDraftContent(e.target.value)}
                spellCheck={false}
                placeholder="Enter playbook content in Markdown..."
              />
            )}
          </div>
        )}
      </div>

      {/* Version History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Version History
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mb-4">
            Each save creates a snapshot. Restoring a version saves the old content as a new snapshot first.
          </p>
          {!versionsData && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {versionsData?.versions.length === 0 && (
            <p className="text-sm text-muted-foreground">No version history yet.</p>
          )}
          {versionsData?.versions.map((v, idx) => (
            <div
              key={v.id}
              data-testid={`version-row-${v.id}`}
              className="border rounded-lg p-3 mb-2 bg-card hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {v.label ?? (idx === 0 ? "Current saved version" : `Version ${versionsData.versions.length - idx}`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(v.savedAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.content.length.toLocaleString()} characters
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRestoreTarget(v)}
                  disabled={restoreMutation.isPending}
                  data-testid={`button-restore-version-${v.id}`}
                  className="shrink-0 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </SheetContent>
      </Sheet>

      {/* Restore confirmation dialog */}
      <Dialog open={!!restoreTarget} onOpenChange={(open: boolean) => !open && setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this version?</DialogTitle>
            <DialogDescription>
              The current content will be saved as a new version snapshot before restoring.
              This action cannot be undone directly — you can always restore back from history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>Cancel</Button>
            <Button
              data-testid="button-confirm-restore"
              onClick={() => restoreTarget && restoreMutation.mutate(restoreTarget.id)}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? "Restoring…" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
