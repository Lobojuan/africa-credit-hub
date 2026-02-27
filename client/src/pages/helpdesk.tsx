import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, Plus, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Headset } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Borrower, Dispute, ConsentRecord } from "@shared/schema";

const disputeTypeOptions = [
  "incorrect_balance",
  "wrong_status",
  "identity_error",
  "unauthorized_inquiry",
  "other",
] as const;

const correctionTypeOptions = ["financial", "non_financial"] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case "open": return "outline" as const;
    case "under_review": return "secondary" as const;
    case "resolved": return "default" as const;
    case "rejected": return "destructive" as const;
    default: return "outline" as const;
  }
}

export default function HelpdeskPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  const [disputeForm, setDisputeForm] = useState({
    creditAccountId: "",
    disputeType: "incorrect_balance",
    description: "",
    correctionType: "financial",
  });

  const [consentForm, setConsentForm] = useState({
    grantedTo: "",
    purpose: "",
    consentType: "inquiry",
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<Borrower[]>({
    queryKey: [search.length >= 2 ? `/api/borrowers?search=${encodeURIComponent(search)}` : "/api/borrowers"],
    enabled: search.length >= 2 || search.length === 0,
  });

  const { data: allDisputes, isLoading: disputesLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
  });

  const borrowerDisputes = selectedBorrower
    ? allDisputes?.filter((d) => d.borrowerId === selectedBorrower.id)
    : [];

  const { data: consentRecords, isLoading: consentsLoading } = useQuery<ConsentRecord[]>({
    queryKey: ["/api/consent-records", selectedBorrower?.id],
    queryFn: async () => {
      if (!selectedBorrower) return [];
      const res = await fetch(`/api/consent-records?borrowerId=${selectedBorrower.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch consent records");
      return res.json();
    },
    enabled: !!selectedBorrower,
  });

  const openDisputes = allDisputes?.filter((d) => d.status === "open") || [];
  const slaBreaches = allDisputes?.filter((d) => d.slaDeadline && new Date(d.slaDeadline) < new Date() && d.status !== "resolved") || [];
  const resolvedToday = allDisputes?.filter((d) => {
    if (d.status !== "resolved" || !d.resolvedAt) return false;
    const today = new Date();
    const resolved = new Date(d.resolvedAt);
    return resolved.toDateString() === today.toDateString();
  }) || [];

  const createDisputeMutation = useMutation({
    mutationFn: async (data: { borrowerId: string; creditAccountId?: string; disputeType: string; description: string; correctionType: string }) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.creditAccountId) delete payload.creditAccountId;
      const res = await apiRequest("POST", "/api/disputes", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      setDisputeDialogOpen(false);
      setDisputeForm({ creditAccountId: "", disputeType: "incorrect_balance", description: "", correctionType: "financial" });
      toast({ title: t("helpdesk.disputeFiled") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const grantConsentMutation = useMutation({
    mutationFn: async (data: { borrowerId: string; grantedTo: string; purpose: string; consentType: string }) => {
      const receiptNumber = `CR-${Date.now()}`;
      const res = await apiRequest("POST", "/api/consent-records", { ...data, receiptNumber, status: "active" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-records"] });
      setConsentDialogOpen(false);
      setConsentForm({ grantedTo: "", purpose: "", consentType: "inquiry" });
      toast({ title: t("helpdesk.consentGranted") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const getBorrowerName = (b: Borrower) =>
    b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;

  const handleFileDispute = () => {
    if (!selectedBorrower) return;
    createDisputeMutation.mutate({
      borrowerId: selectedBorrower.id,
      creditAccountId: disputeForm.creditAccountId || undefined,
      disputeType: disputeForm.disputeType,
      description: disputeForm.description,
      correctionType: disputeForm.correctionType,
    });
  };

  const handleGrantConsent = () => {
    if (!selectedBorrower) return;
    grantConsentMutation.mutate({
      borrowerId: selectedBorrower.id,
      grantedTo: consentForm.grantedTo,
      purpose: consentForm.purpose,
      consentType: consentForm.consentType,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-helpdesk-title">
          {t("helpdesk.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("helpdesk.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm text-muted-foreground">{t("helpdesk.openInquiries")}</p>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-open-inquiries">{openDisputes.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm text-muted-foreground">{t("helpdesk.slaBreaches")}</p>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-sla-breaches">{slaBreaches.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <p className="text-sm text-muted-foreground">{t("helpdesk.resolvedToday")}</p>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-resolved-today">{resolvedToday.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-helpdesk-search"
          placeholder={t("helpdesk.searchPlaceholder")}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.length >= 2 && (
        <div>
          {searchLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((borrower) => (
                <Card
                  key={borrower.id}
                  className={`cursor-pointer hover-elevate ${selectedBorrower?.id === borrower.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedBorrower(borrower)}
                  data-testid={`card-search-result-${borrower.id}`}
                >
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold" data-testid={`text-borrower-name-${borrower.id}`}>
                      {getBorrowerName(borrower)}
                    </p>
                    <p className="text-xs text-muted-foreground">{borrower.nationalId}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {borrower.phone && <Badge variant="outline" className="text-[10px]">{borrower.phone}</Badge>}
                      {borrower.email && <Badge variant="outline" className="text-[10px]">{borrower.email}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Headset className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{t("helpdesk.noResults")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedBorrower && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <h2 className="text-lg font-semibold" data-testid="text-selected-borrower-name">
                  {getBorrowerName(selectedBorrower)}
                </h2>
                <p className="text-sm text-muted-foreground">{t("helpdesk.borrowerInfo")}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setDisputeDialogOpen(true)}
                  data-testid="button-file-dispute"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("helpdesk.fileDispute")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConsentDialogOpen(true)}
                  data-testid="button-grant-consent"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {t("helpdesk.grantConsent")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("helpdesk.nationalId")}</p>
                  <p className="text-sm font-medium" data-testid="text-borrower-id">{selectedBorrower.nationalId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("helpdesk.phone")}</p>
                  <p className="text-sm font-medium" data-testid="text-borrower-phone">{selectedBorrower.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("helpdesk.email")}</p>
                  <p className="text-sm font-medium" data-testid="text-borrower-email">{selectedBorrower.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("helpdesk.type")}</p>
                  <Badge variant="secondary" className="text-[10px] capitalize">{selectedBorrower.type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <h3 className="text-base font-semibold">{t("helpdesk.disputes")}</h3>
            </CardHeader>
            <CardContent className="p-0">
              {disputesLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : borrowerDisputes && borrowerDisputes.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("helpdesk.disputeType")}</TableHead>
                        <TableHead>{t("helpdesk.description")}</TableHead>
                        <TableHead>{t("helpdesk.status")}</TableHead>
                        <TableHead>{t("helpdesk.slaDeadline")}</TableHead>
                        <TableHead>{t("helpdesk.filed")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowerDisputes.map((dispute) => (
                        <TableRow key={dispute.id} data-testid={`row-dispute-${dispute.id}`}>
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
                            {dispute.slaDeadline
                              ? new Date(dispute.slaDeadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dispute.createdAt
                              ? new Date(dispute.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("helpdesk.noDisputes")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <h3 className="text-base font-semibold">{t("helpdesk.consentRecords")}</h3>
            </CardHeader>
            <CardContent className="p-0">
              {consentsLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : consentRecords && consentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("helpdesk.grantedTo")}</TableHead>
                        <TableHead>{t("helpdesk.purpose")}</TableHead>
                        <TableHead>{t("helpdesk.consentType")}</TableHead>
                        <TableHead>{t("helpdesk.status")}</TableHead>
                        <TableHead>{t("helpdesk.receipt")}</TableHead>
                        <TableHead>{t("helpdesk.grantedAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consentRecords.map((record) => (
                        <TableRow key={record.id} data-testid={`row-consent-${record.id}`}>
                          <TableCell className="text-sm">{record.grantedTo}</TableCell>
                          <TableCell className="text-sm">{record.purpose}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {record.consentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={record.status === "active" ? "default" : "destructive"}
                              className="text-[10px] capitalize"
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{record.receiptNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {record.grantedAt
                              ? new Date(record.grantedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("helpdesk.noConsents")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("helpdesk.fileADispute")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleFileDispute(); }}
            className="space-y-4"
            data-testid="form-file-dispute"
          >
            <div>
              <Label>{t("helpdesk.borrower")}</Label>
              <Input
                value={selectedBorrower ? getBorrowerName(selectedBorrower) || "" : ""}
                disabled
                data-testid="input-dispute-borrower"
              />
            </div>
            <div>
              <Label>{t("helpdesk.creditAccountId")}</Label>
              <Input
                data-testid="input-dispute-account"
                value={disputeForm.creditAccountId}
                onChange={(e) => setDisputeForm({ ...disputeForm, creditAccountId: e.target.value })}
                placeholder={t("helpdesk.creditAccountPlaceholder")}
              />
            </div>
            <div>
              <Label>{t("helpdesk.disputeType")}</Label>
              <Select value={disputeForm.disputeType} onValueChange={(v) => setDisputeForm({ ...disputeForm, disputeType: v })}>
                <SelectTrigger data-testid="select-dispute-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {disputeTypeOptions.map((key) => (
                    <SelectItem key={key} value={key}>{t(`helpdesk.disputeTypes.${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("helpdesk.correctionType")}</Label>
              <Select value={disputeForm.correctionType} onValueChange={(v) => setDisputeForm({ ...disputeForm, correctionType: v })}>
                <SelectTrigger data-testid="select-correction-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {correctionTypeOptions.map((key) => (
                    <SelectItem key={key} value={key}>{t(`helpdesk.correctionTypes.${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("helpdesk.description")}</Label>
              <Textarea
                data-testid="input-dispute-description"
                value={disputeForm.description}
                onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                placeholder={t("helpdesk.descriptionPlaceholder")}
                required
                rows={4}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createDisputeMutation.isPending || !disputeForm.description}
              data-testid="button-submit-dispute"
            >
              {createDisputeMutation.isPending ? t("helpdesk.filing") : t("helpdesk.fileDispute")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("helpdesk.grantConsent")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleGrantConsent(); }}
            className="space-y-4"
            data-testid="form-grant-consent"
          >
            <div>
              <Label>{t("helpdesk.borrower")}</Label>
              <Input
                value={selectedBorrower ? getBorrowerName(selectedBorrower) || "" : ""}
                disabled
                data-testid="input-consent-borrower"
              />
            </div>
            <div>
              <Label>{t("helpdesk.grantedTo")}</Label>
              <Input
                data-testid="input-consent-granted-to"
                value={consentForm.grantedTo}
                onChange={(e) => setConsentForm({ ...consentForm, grantedTo: e.target.value })}
                placeholder={t("helpdesk.grantedToPlaceholder")}
                required
              />
            </div>
            <div>
              <Label>{t("helpdesk.purpose")}</Label>
              <Input
                data-testid="input-consent-purpose"
                value={consentForm.purpose}
                onChange={(e) => setConsentForm({ ...consentForm, purpose: e.target.value })}
                placeholder={t("helpdesk.purposePlaceholder")}
                required
              />
            </div>
            <div>
              <Label>{t("helpdesk.consentType")}</Label>
              <Select value={consentForm.consentType} onValueChange={(v) => setConsentForm({ ...consentForm, consentType: v })}>
                <SelectTrigger data-testid="select-consent-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">{t("helpdesk.consentTypes.inquiry")}</SelectItem>
                  <SelectItem value="data_sharing">{t("helpdesk.consentTypes.dataSharing")}</SelectItem>
                  <SelectItem value="credit_check">{t("helpdesk.consentTypes.creditCheck")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={grantConsentMutation.isPending || !consentForm.grantedTo || !consentForm.purpose}
              data-testid="button-submit-consent"
            >
              {grantConsentMutation.isPending ? t("helpdesk.granting") : t("helpdesk.grantConsent")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
