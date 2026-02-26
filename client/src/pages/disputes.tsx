import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Dispute, Borrower, CreditAccount } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "open": return "outline" as const;
    case "under_review": return "secondary" as const;
    case "resolved": return "default" as const;
    case "rejected": return "destructive" as const;
    default: return "outline" as const;
  }
}

const disputeTypes = [
  { value: "data_error", label: "Data Error" },
  { value: "identity_theft", label: "Identity Theft" },
  { value: "unauthorized_inquiry", label: "Unauthorized Inquiry" },
  { value: "duplicate_record", label: "Duplicate Record" },
  { value: "other", label: "Other" },
];

export default function DisputesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogId, setResolveDialogId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolveStatus, setResolveStatus] = useState("resolved");
  const { toast } = useToast();

  const { data: disputeList, isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
  });

  const { data: borrowers } = useQuery<Borrower[]>({
    queryKey: ["/api/borrowers"],
  });

  const { data: accounts } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const [formData, setFormData] = useState({
    borrowerId: "",
    creditAccountId: "",
    disputeType: "data_error",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = { ...data };
      if (!payload.creditAccountId) delete payload.creditAccountId;
      const res = await apiRequest("POST", "/api/disputes", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setFormData({ borrowerId: "", creditAccountId: "", disputeType: "data_error", description: "" });
      toast({ title: "Dispute filed successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution: string }) => {
      const res = await apiRequest("PATCH", `/api/disputes/${id}`, { status, resolution });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setResolveDialogId(null);
      setResolution("");
      toast({ title: "Dispute updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const getBorrowerName = (id: string) => {
    const b = borrowers?.find(b => b.id === id);
    if (!b) return id.slice(0, 8);
    return b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-disputes-title">Disputes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage data disputes and grievances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-file-dispute">
              <Plus className="w-4 h-4 mr-2" />
              File Dispute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File a Dispute</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-file-dispute">
              <div>
                <Label>Borrower</Label>
                <Select value={formData.borrowerId} onValueChange={(v) => setFormData({ ...formData, borrowerId: v })}>
                  <SelectTrigger data-testid="select-dispute-borrower"><SelectValue placeholder="Select borrower" /></SelectTrigger>
                  <SelectContent>
                    {borrowers?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`} ({b.nationalId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credit Account (optional)</Label>
                <Select value={formData.creditAccountId} onValueChange={(v) => setFormData({ ...formData, creditAccountId: v })}>
                  <SelectTrigger data-testid="select-dispute-account"><SelectValue placeholder="Select account (optional)" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.filter(a => !formData.borrowerId || a.borrowerId === formData.borrowerId).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountNumber} — {a.lenderInstitution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dispute Type</Label>
                <Select value={formData.disputeType} onValueChange={(v) => setFormData({ ...formData, disputeType: v })}>
                  <SelectTrigger data-testid="select-dispute-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {disputeTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="input-dispute-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !formData.borrowerId} data-testid="button-submit-dispute">
                {createMutation.isPending ? "Filing..." : "File Dispute"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : disputeList && disputeList.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputeList.map((dispute) => (
                    <TableRow key={dispute.id} data-testid={`row-dispute-${dispute.id}`}>
                      <TableCell className="text-sm font-medium">{getBorrowerName(dispute.borrowerId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {dispute.disputeType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{dispute.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(dispute.status)} className="text-[10px] capitalize">
                          {dispute.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        {(dispute.status === "open" || dispute.status === "under_review") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setResolveDialogId(dispute.id); setResolution(""); setResolveStatus("resolved"); }}
                            data-testid={`button-resolve-${dispute.id}`}
                          >
                            Resolve
                          </Button>
                        )}
                        {dispute.resolution && (
                          <span className="text-xs text-muted-foreground ml-2">{dispute.resolution}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">No disputes filed</h3>
              <p className="text-sm text-muted-foreground mt-1">File a dispute to track data issues</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resolveDialogId} onOpenChange={() => setResolveDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={resolveStatus} onValueChange={setResolveStatus}>
                <SelectTrigger data-testid="select-resolve-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                data-testid="input-resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter resolution details..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => resolveDialogId && resolveMutation.mutate({ id: resolveDialogId, status: resolveStatus, resolution })}
              disabled={resolveMutation.isPending}
              data-testid="button-submit-resolution"
            >
              {resolveMutation.isPending ? "Updating..." : "Update Dispute"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
