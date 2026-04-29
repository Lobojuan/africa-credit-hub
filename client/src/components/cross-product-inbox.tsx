import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Inbox, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { WORKSPACES, type WorkspaceId } from "@/lib/workspaces";

interface PendingConsentRow {
  id: string;
  sourceProduct: WorkspaceId;
  targetProduct: WorkspaceId;
  purpose: string;
  scopeNote: string | null;
  expiresAt: string;
  createdAt: string;
  userId: string | null;
  merchantId: string | null;
}

const PURPOSE_LABEL: Record<string, string> = {
  merchant_credit_profile: "Build a credit profile from your VAT receipts",
  consumer_spending_credit: "Use your spending history for credit scoring",
  bureau_reputation_badge: "Display a bureau reputation badge for your business",
  collateral_credit_view: "View your collateral filings alongside credit",
  credit_collateral_view: "View your credit summary alongside collateral",
};

export function CrossProductInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<PendingConsentRow[]>({
    queryKey: ["/api/cross-product/consents/incoming"],
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const pending = data ?? [];
  const count = pending.length;

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "deny" }) => {
      return await apiRequest("POST", `/api/cross-product/consents/${id}/${action}`);
    },
    onSuccess: (_resp, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents/incoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cross-product/consents"] });
      toast({
        title: vars.action === "approve" ? "Request approved" : "Request denied",
        description: vars.action === "approve"
          ? "The other workspace can now read this data."
          : "Access has been declined.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not update request", description: e?.message ?? "Please try again.", variant: "destructive" });
    },
  });

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              aria-label={`Cross-workspace approval inbox (${count} pending)`}
              data-testid="button-cross-product-inbox"
            >
              <Inbox className="h-5 w-5" />
              {count > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold flex items-center justify-center bg-rose-600 text-white border-0"
                  data-testid="badge-inbox-count"
                >
                  {count > 9 ? "9+" : count}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Cross-workspace approval inbox</TooltipContent>
      </Tooltip>

      <SheetContent className="w-[420px] sm:w-[480px]" side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Approval Inbox
          </SheetTitle>
          <SheetDescription>
            Pending requests from other workspaces to access data you own. Nothing is shared until you approve.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : count === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-inbox-empty">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pending requests.</p>
              <p className="text-xs mt-1">When another workspace asks to read your data, the request will appear here.</p>
            </div>
          ) : (
            pending.map((row) => {
              const source = WORKSPACES[row.sourceProduct];
              const target = WORKSPACES[row.targetProduct];
              const SourceIcon = source?.icon ?? Inbox;
              const expiresAt = new Date(row.expiresAt);
              const isPending = decide.isPending && decide.variables?.id === row.id;
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                  data-testid={`card-pending-request-${row.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${source?.accentFrom ?? "#888"}, ${source?.accentTo ?? "#444"})` }}
                      aria-hidden
                    >
                      <SourceIcon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        {source?.label ?? row.sourceProduct} → {target?.label ?? row.targetProduct}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {PURPOSE_LABEL[row.purpose] ?? row.purpose}
                      </div>
                    </div>
                  </div>

                  {row.scopeNote && (
                    <p className="text-xs text-foreground/80 italic border-l-2 border-border pl-3" data-testid={`text-scope-${row.id}`}>
                      "{row.scopeNote}"
                    </p>
                  )}

                  <div className="text-[11px] text-muted-foreground">
                    Requested {new Date(row.createdAt).toLocaleString()} · Expires {expiresAt.toLocaleDateString()}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => decide.mutate({ id: row.id, action: "approve" })}
                      disabled={isPending}
                      data-testid={`button-approve-${row.id}`}
                    >
                      {isPending && decide.variables?.action === "approve" ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => decide.mutate({ id: row.id, action: "deny" })}
                      disabled={isPending}
                      data-testid={`button-deny-${row.id}`}
                    >
                      {isPending && decide.variables?.action === "deny" ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      Deny
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CrossProductInbox;
