import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { CheckCircle2, FileWarning, Plus, Send, ShieldCheck, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ConsentRecord } from "@shared/schema";

export default function ConsentManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [filterBorrowerId, setFilterBorrowerId] = useState("");

  const queryKey = filterBorrowerId
    ? [`/api/consent-records?borrowerId=${encodeURIComponent(filterBorrowerId)}`]
    : ["/api/consent-records"];

  const { data: records, isLoading } = useQuery<ConsentRecord[]>({ queryKey });

  const [formData, setFormData] = useState({
    borrowerId: "",
    grantedTo: "",
    purpose: "",
    consentType: "collection" as string,
  });
  const [requestData, setRequestData] = useState({ borrowerId: "", purpose: "credit report for a credit decision" });
  const [requestResult, setRequestResult] = useState<{
    status: string;
    exemption: boolean;
    borrowerName: string;
    expiresAt?: string;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/consent-records", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-records"] });
      setDialogOpen(false);
      setFormData({ borrowerId: "", grantedTo: "", purpose: "", consentType: "collection" });
      toast({ title: t("consent.granted") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/consent-records/${id}/revoke`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-records"] });
      toast({ title: t("consent.revoked") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: typeof requestData) => {
      const res = await apiRequest("POST", "/api/consent-requests", data);
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-records"] });
      setRequestResult(result);
      toast({
        title: result.exemption ? "Loan agreement evidence recorded" : "Customer consent request created",
        description: result.exemption
          ? "This request is supported by an active loan agreement."
          : "The request remains pending until the customer responds.",
      });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestResult(null);
    requestMutation.mutate(requestData);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-consent-title">
              {t("consent.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("consent.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Dialog open={requestDialogOpen} onOpenChange={(open) => {
          setRequestDialogOpen(open);
          if (!open) setRequestResult(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-customer-consent">
              <Send className="w-4 h-4 mr-2" />
              Request customer consent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request customer consent</DialogTitle>
            </DialogHeader>
            {requestResult ? (
              <div className="space-y-4" data-testid="consent-request-result">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {requestResult.exemption ? "Loan agreement evidence recorded" : "Request awaiting customer decision"}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {requestResult.exemption
                      ? `${requestResult.borrowerName} has an active qualifying loan relationship. The evidence is recorded and audited.`
                      : `${requestResult.borrowerName} must approve before this credit-report request can be used.`}
                  </p>
                  {!requestResult.exemption && requestResult.expiresAt && (
                    <p className="mt-2 text-xs text-muted-foreground">Expires {new Date(requestResult.expiresAt).toLocaleString()}.</p>
                  )}
                </div>
                <Button className="w-full" onClick={() => setRequestDialogOpen(false)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4" data-testid="form-request-customer-consent">
                <p className="text-sm text-muted-foreground">Use this for credit-report access or another sensitive data action. UCH records a time-limited request and never treats it as approved until the customer responds.</p>
                <div>
                  <Label>Borrower ID</Label>
                  <Input data-testid="input-request-consent-borrower-id" value={requestData.borrowerId} onChange={(e) => setRequestData({ ...requestData, borrowerId: e.target.value })} required />
                </div>
                <div>
                  <Label>Permissible purpose</Label>
                  <Select value={requestData.purpose} onValueChange={(purpose) => setRequestData({ ...requestData, purpose })}>
                    <SelectTrigger data-testid="select-request-consent-purpose"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit report for a credit decision">Credit report for a credit decision</SelectItem>
                      <SelectItem value="loan restructuring assessment">Loan restructuring assessment</SelectItem>
                      <SelectItem value="collections and recovery assessment">Collections and recovery assessment</SelectItem>
                      <SelectItem value="open banking data connection">Open banking data connection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={requestMutation.isPending} data-testid="button-submit-consent-request">
                  {requestMutation.isPending ? "Creating request…" : "Create controlled request"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-grant-consent">
              <Plus className="w-4 h-4 mr-2" />
              Record verified consent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record verified consent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-grant-consent">
              <div>
                <Label>{t("consent.borrowerId")}</Label>
                <Input
                  data-testid="input-consent-borrower-id"
                  value={formData.borrowerId}
                  onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("consent.grantedTo")}</Label>
                <Input
                  data-testid="input-consent-granted-to"
                  value={formData.grantedTo}
                  onChange={(e) => setFormData({ ...formData, grantedTo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("consent.purpose")}</Label>
                <Input
                  data-testid="input-consent-purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("consent.consentType")}</Label>
                <Select
                  value={formData.consentType}
                  onValueChange={(v) => setFormData({ ...formData, consentType: v })}
                >
                  <SelectTrigger data-testid="select-consent-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">{t("consent.types.collection")}</SelectItem>
                    <SelectItem value="sharing">{t("consent.types.sharing")}</SelectItem>
                    <SelectItem value="inquiry">{t("consent.types.inquiry")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-submit-consent"
              >
                {createMutation.isPending ? t("consent.granting") : t("consent.grant")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]" data-testid="consent-evidence-gate">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Consent &amp; Evidence Gate</p>
              <h2 className="mt-1 text-lg font-bold">Keep sensitive data access controlled and provable</h2>
              <p className="mt-1 text-sm text-muted-foreground">1. Request consent or record verified evidence. 2. Wait for the customer decision or a valid loan-agreement basis. 3. Send missing or suspicious evidence to a human reviewer.</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="outline" onClick={() => navigate("/forgery-review")} data-testid="button-open-forgery-review"><FileWarning className="mr-2 h-4 w-4" />Review exceptions</Button>
              <Button variant="outline" onClick={() => navigate("/regulatory-evidence-packs")} data-testid="button-open-evidence-packs">Open evidence packs</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-filter-borrower-id"
          placeholder={t("consent.filterByBorrower")}
          className="pl-9"
          value={filterBorrowerId}
          onChange={(e) => setFilterBorrowerId(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records && records.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("consent.borrowerId")}</TableHead>
                  <TableHead>{t("consent.grantedTo")}</TableHead>
                  <TableHead>{t("consent.purpose")}</TableHead>
                  <TableHead>{t("consent.consentType")}</TableHead>
                  <TableHead>{t("consent.status")}</TableHead>
                  <TableHead>{t("consent.receiptNumber")}</TableHead>
                  <TableHead>{t("consent.grantedAt")}</TableHead>
                  <TableHead>{t("consent.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} data-testid={`row-consent-${record.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/borrowers/${record.borrowerId}`)}>
                    <TableCell data-testid={`text-borrower-id-${record.id}`}>
                      {record.borrowerId}
                    </TableCell>
                    <TableCell data-testid={`text-granted-to-${record.id}`}>
                      {record.grantedTo}
                    </TableCell>
                    <TableCell data-testid={`text-purpose-${record.id}`}>
                      {record.purpose}
                    </TableCell>
                    <TableCell data-testid={`text-consent-type-${record.id}`}>
                      {record.consentType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.status === "active" ? "default" : "destructive"}
                        className={record.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                        data-testid={`badge-status-${record.id}`}
                      >
                        {record.status === "active" ? t("consent.statusActive") : t("consent.statusRevoked")}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-receipt-${record.id}`}>
                      {record.receiptNumber}
                    </TableCell>
                    <TableCell data-testid={`text-granted-at-${record.id}`}>
                      {record.grantedAt
                        ? new Date(record.grantedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {record.status === "active" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={revokeMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); revokeMutation.mutate(record.id); }}
                          data-testid={`button-revoke-${record.id}`}
                        >
                          {t("consent.revoke")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold">{t("consent.noRecords")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("consent.noRecordsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
