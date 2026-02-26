import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckSquare, Check, X, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PendingApproval } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending": return "outline" as const;
    case "approved": return "default" as const;
    case "rejected": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default function PendingApprovalsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: approvals, isLoading } = useQuery<PendingApproval[]>({
    queryKey: ["/api/pending-approvals"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/pending-approvals/${id}`, { status, reviewNotes: notes });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
      setSelectedApproval(null);
      setReviewNotes("");
      toast({ title: `Request ${vars.status}` });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleReview = (status: string) => {
    if (!selectedApproval) return;
    reviewMutation.mutate({ id: selectedApproval.id, status, notes: reviewNotes });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-approvals-title">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Maker-checker workflow — review and approve submitted changes</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : approvals && approvals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id} data-testid={`row-approval-${approval.id}`}>
                      <TableCell className="text-sm font-medium capitalize">{approval.entityType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{approval.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(approval.status)} className="text-[10px] capitalize">{approval.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {approval.createdAt ? new Date(approval.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => { setSelectedApproval(approval); setReviewNotes(""); }}
                          data-testid={`button-review-${approval.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">No pending approvals</h3>
              <p className="text-sm text-muted-foreground mt-1">All changes have been reviewed</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Change Request</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Entity:</span>
                  <p className="font-medium capitalize">{selectedApproval.entityType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Action:</span>
                  <p className="font-medium capitalize">{selectedApproval.action}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Payload:</span>
                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48" data-testid="text-approval-payload">
                  {JSON.stringify(JSON.parse(selectedApproval.payload || "{}"), null, 2)}
                </pre>
              </div>
              {selectedApproval.status === "pending" && selectedApproval.requestedBy !== user?.id && (
                <>
                  <div>
                    <Textarea
                      placeholder="Review notes (optional)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      data-testid="input-review-notes"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => handleReview("approved")}
                      disabled={reviewMutation.isPending}
                      data-testid="button-approve"
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReview("rejected")}
                      disabled={reviewMutation.isPending}
                      data-testid="button-reject"
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </>
              )}
              {selectedApproval.requestedBy === user?.id && selectedApproval.status === "pending" && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>You submitted this request. A different user must review it.</span>
                </div>
              )}
              {selectedApproval.status !== "pending" && (
                <div className="text-sm">
                  <Badge variant={getStatusBadge(selectedApproval.status)} className="capitalize">{selectedApproval.status}</Badge>
                  {selectedApproval.reviewNotes && (
                    <p className="mt-2 text-muted-foreground">Notes: {selectedApproval.reviewNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
