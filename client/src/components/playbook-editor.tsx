import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Pencil, Save, X, AlertCircle } from "lucide-react";

interface PlaybookEditorProps {
  contentQueryKey: string;
  patchEndpoint: string;
  playbookTitle: string;
  currentContent?: string;
}

export function PlaybookEditorButton({
  contentQueryKey,
  patchEndpoint,
  playbookTitle,
  currentContent,
}: PlaybookEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && currentContent !== undefined) {
      setDraft(currentContent);
    }
  }, [open, currentContent]);

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("PATCH", patchEndpoint, { content });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Save failed" }));
        throw new Error(err.message ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [contentQueryKey] });
      setOpen(false);
      toast({
        title: "Playbook saved",
        description: `${playbookTitle} has been updated successfully.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const hasChanges = draft !== (currentContent ?? "");

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="shrink-0 bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold"
        data-testid="button-edit-playbook"
        disabled={currentContent === undefined}
      >
        <Pencil className="w-4 h-4 mr-2" />
        Edit Playbook
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!mutation.isPending) setOpen(v); }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Pencil className="w-5 h-5 text-teal-600" />
              Edit {playbookTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Edit the markdown content below. Changes are saved to disk and reflected immediately on the live page.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 py-4 min-h-0">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-full min-h-[50vh] font-mono text-xs resize-none leading-relaxed"
              placeholder="# Playbook content (Markdown)..."
              data-testid="textarea-playbook-editor"
              disabled={mutation.isPending}
            />
          </div>

          {hasChanges && (
            <div className="mx-6 mb-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              You have unsaved changes.
            </div>
          )}

          <DialogFooter className="px-6 pb-6 pt-2 border-t shrink-0 flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
              data-testid="button-cancel-edit-playbook"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate(draft)}
              disabled={mutation.isPending || !hasChanges}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              data-testid="button-save-playbook"
            >
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
