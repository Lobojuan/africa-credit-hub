import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const disputeTypeKeys = [
  "data_error",
  "identity_theft",
  "unauthorized_inquiry",
  "duplicate_record",
  "other",
] as const;

export default function DisputesPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogId, setResolveDialogId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolveStatus, setResolveStatus] = useState("resolved");
  const { toast } = useToast();

  const { data: disputeList, isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
  });

  const { data: borrowersResult } = useQuery<{ data: Borrower[]; total: number }>({
    queryKey: ["/api/borrowers?page=1&limit=200"],
  });
  const borrowers = borrowersResult?.data;

  const { data: accounts } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const [formData, setFormData] = useState({
    borrowerId: "",
    creditAccountId: "",
    disputeType: "data_error",
    description: "",
    correctionType: "non_financial",
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
      setFormData({ borrowerId: "", creditAccountId: "", disputeType: "data_error", description: "", correctionType: "non_financial" });
      toast({ title: t('disputes.filedSuccess') });
    },
    onError: (e: Error) => {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
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
      toast({ title: t('disputes.updated') });
    },
    onError: (e: Error) => {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    },
  });

  const getBorrowerName = (id: string) => {
    const b = borrowers?.find(b => b.id === id);
    if (!b) return id.slice(0, 8);
    return b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-disputes-title">{t('disputes.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('disputes.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-file-dispute">
              <Plus className="w-4 h-4 mr-2" />
              {t('disputes.fileDispute')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('disputes.fileADispute')}</DialogTitle>
              <DialogDescription className="sr-only">Dialog form content</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4" data-testid="form-file-dispute">
              <div>
                <Label>{t('disputes.borrower')}</Label>
                <Select value={formData.borrowerId} onValueChange={(v) => setFormData({ ...formData, borrowerId: v })}>
                  <SelectTrigger data-testid="select-dispute-borrower"><SelectValue placeholder={t('disputes.selectBorrower')} /></SelectTrigger>
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
                <Label>{t('disputes.creditAccount')}</Label>
                <Select value={formData.creditAccountId} onValueChange={(v) => setFormData({ ...formData, creditAccountId: v })}>
                  <SelectTrigger data-testid="select-dispute-account"><SelectValue placeholder={t('disputes.selectAccount')} /></SelectTrigger>
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
                <Label>{t('disputes.disputeType')}</Label>
                <Select value={formData.disputeType} onValueChange={(v) => setFormData({ ...formData, disputeType: v })}>
                  <SelectTrigger data-testid="select-dispute-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {disputeTypeKeys.map((key) => (
                      <SelectItem key={key} value={key}>{t(`disputes.types.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('disputes.description')}</Label>
                <Textarea
                  data-testid="input-dispute-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('disputes.descriptionPlaceholder')}
                  required
                  rows={4}
                />
              </div>
              <div>
                <Label>{t('disputes.correctionType')}</Label>
                <Select value={formData.correctionType} onValueChange={(v) => setFormData({ ...formData, correctionType: v })}>
                  <SelectTrigger data-testid="select-correction-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">{t('disputes.financial')}</SelectItem>
                    <SelectItem value="non_financial">{t('disputes.nonFinancial')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !formData.borrowerId} data-testid="button-submit-dispute">
                {createMutation.isPending ? t('disputes.filing') : t('disputes.fileDispute')}
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
                    <TableHead>{t('disputes.borrower')}</TableHead>
                    <TableHead>{t('disputes.disputeType')}</TableHead>
                    <TableHead>{t('disputes.description')}</TableHead>
                    <TableHead>{t('approvals.status')}</TableHead>
                    <TableHead>{t('disputes.correctionType')}</TableHead>
                    <TableHead>{t('disputes.slaDeadline')}</TableHead>
                    <TableHead>{t('disputes.filed')}</TableHead>
                    <TableHead>{t('approvals.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputeList.map((dispute) => (
                    <TableRow key={dispute.id} data-testid={`row-dispute-${dispute.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => { setResolveDialogId(dispute.id); setResolution(dispute.resolution || ""); setResolveStatus(dispute.status); }}>
                      <TableCell className="text-sm font-medium">{getBorrowerName(dispute.borrowerId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {t(`disputes.types.${dispute.disputeType}` as any, { defaultValue: dispute.disputeType.replace(/_/g, " ") })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{dispute.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(dispute.status)} className="text-[10px] capitalize">
                          {dispute.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(dispute as any).correctionType ? (
                          <Badge variant="outline" className="text-[10px] capitalize">{(dispute as any).correctionType.replace(/_/g, " ")}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {(dispute as any).slaDeadline ? (
                          <span className={new Date((dispute as any).slaDeadline) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {new Date((dispute as any).slaDeadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            {new Date((dispute as any).slaDeadline) < new Date() && (dispute.status === "open" || dispute.status === "under_review") && (
                              <Badge variant="destructive" className="ml-1 text-[9px]">{t('disputes.breached')}</Badge>
                            )}
                          </span>
                        ) : "—"}
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
                            onClick={(e) => { e.stopPropagation(); setResolveDialogId(dispute.id); setResolution(""); setResolveStatus("resolved"); }}
                            data-testid={`button-resolve-${dispute.id}`}
                          >
                            {t('disputes.resolve')}
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
              <h3 className="font-semibold">{t('disputes.noDisputes')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('disputes.noDisputesSub')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resolveDialogId} onOpenChange={() => setResolveDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('disputes.resolveDispute')}</DialogTitle>
            <DialogDescription className="sr-only">Dialog form content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('approvals.status')}</Label>
              <Select value={resolveStatus} onValueChange={setResolveStatus}>
                <SelectTrigger data-testid="select-resolve-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">{t('disputes.underReview')}</SelectItem>
                  <SelectItem value="resolved">{t('disputes.resolved')}</SelectItem>
                  <SelectItem value="rejected">{t('disputes.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('disputes.resolutionNotes')}</Label>
              <Textarea
                data-testid="input-resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t('disputes.resolutionPlaceholder')}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => resolveDialogId && resolveMutation.mutate({ id: resolveDialogId, status: resolveStatus, resolution })}
              disabled={resolveMutation.isPending}
              data-testid="button-submit-resolution"
            >
              {resolveMutation.isPending ? t('disputes.updating') : t('disputes.updateDispute')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
