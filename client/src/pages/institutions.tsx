import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Building2, CheckCircle, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Calendar, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import { isGhanaMode, getDefaultCountry } from "@/lib/country-mode";
import type { Institution } from "@shared/schema";

const institutionTypes = ["bank", "mfi", "utility", "telecom", "digital_lender", "sacco"] as const;
const submissionFrequencies = ["daily", "weekly", "monthly"] as const;

function StatusBadge({ status }: { status: string }) {
  const variant = status === "active" ? "default" : status === "suspended" ? "destructive" : "secondary";
  const className =
    status === "active"
      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 dark:bg-green-900 dark:text-green-200"
      : status === "suspended"
        ? ""
        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";

  return (
    <Badge variant={variant} className={className} data-testid={`badge-status-${status}`}>
      {status}
    </Badge>
  );
}

const PAGE_SIZE = 50;

export default function InstitutionsPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  const { data: paginatedResult, isLoading } = useQuery<{ data: Institution[]; total: number }>({
    queryKey: [`/api/institutions?page=${page}&limit=${PAGE_SIZE}`],
  });
  const institutions = paginatedResult?.data;
  const totalInstitutions = paginatedResult?.total ?? 0;
  const totalPages = Math.ceil(totalInstitutions / PAGE_SIZE);

  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    registrationNumber: "",
    country: getDefaultCountry() || "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    submissionFrequency: "monthly",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "bank",
      registrationNumber: "",
      country: getDefaultCountry() || "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      submissionFrequency: "monthly",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/institutions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith?.("/api/institutions") });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("institutions.registered"), description: t("institutions.registeredDesc") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/institutions/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith?.("/api/institutions") });
      toast({ title: t("institutions.approved"), description: t("institutions.approvedDesc") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-institutions-title">
              {t("institutions.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("institutions.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-register-institution">
              <Plus className="w-4 h-4 mr-2" />
              {t("institutions.register")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("institutions.registerNew")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-register-institution">
              <div>
                <Label>{t("institutions.name")}</Label>
                <Input
                  data-testid="input-institution-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("institutions.type")}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-institution-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`institutions.types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("institutions.registrationNumber")}</Label>
                <Input
                  data-testid="input-registration-number"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("institutions.country")}</Label>
                {isGhanaMode() ? (
                  <Input data-testid="select-country" value="Ghana" disabled className="bg-muted" />
                ) : (
                  <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                    <SelectTrigger data-testid="select-country"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {isFr ? c.nameFr : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("institutions.contactEmail")}</Label>
                  <Input
                    data-testid="input-contact-email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("institutions.contactPhone")}</Label>
                  <Input
                    data-testid="input-contact-phone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("institutions.address")}</Label>
                <Input
                  data-testid="input-institution-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("institutions.submissionFrequency")}</Label>
                <Select
                  value={formData.submissionFrequency}
                  onValueChange={(v) => setFormData({ ...formData, submissionFrequency: v })}
                >
                  <SelectTrigger data-testid="select-submission-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {submissionFrequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {t(`institutions.frequencies.${freq}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-submit-institution"
              >
                {createMutation.isPending ? t("institutions.registering") : t("institutions.register")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : institutions && institutions.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("institutions.name")}</TableHead>
                  <TableHead>{t("institutions.type")}</TableHead>
                  <TableHead>{t("institutions.country")}</TableHead>
                  <TableHead>{t("institutions.status")}</TableHead>
                  <TableHead>{t("institutions.submissionFrequency")}</TableHead>
                  <TableHead>{t("institutions.registrationNumber")}</TableHead>
                  {isAdmin && <TableHead>{t("institutions.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((inst) => (
                  <TableRow key={inst.id} data-testid={`row-institution-${inst.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInstitution(inst)}>
                    <TableCell className="font-medium" data-testid={`text-institution-name-${inst.id}`}>
                      {inst.name}
                    </TableCell>
                    <TableCell data-testid={`text-institution-type-${inst.id}`}>
                      <Badge variant="outline" className="capitalize">
                        {t(`institutions.types.${inst.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-institution-country-${inst.id}`}>
                      {inst.country}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inst.status} />
                    </TableCell>
                    <TableCell className="capitalize" data-testid={`text-institution-frequency-${inst.id}`}>
                      {inst.submissionFrequency ? t(`institutions.frequencies.${inst.submissionFrequency}`) : "-"}
                    </TableCell>
                    <TableCell data-testid={`text-institution-regnumber-${inst.id}`}>
                      {inst.registrationNumber || "-"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {inst.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); approveMutation.mutate(inst.id); }}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${inst.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("institutions.approve")}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{t("institutions.noInstitutions")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("institutions.getStarted")}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedInstitution} onOpenChange={() => setSelectedInstitution(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedInstitution?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedInstitution && (
            <div className="space-y-5 mt-6">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedInstitution.status} />
                <Badge variant="outline" className="capitalize">{t(`institutions.types.${selectedInstitution.type}`)}</Badge>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.registrationNumber")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-reg-number">{selectedInstitution.registrationNumber || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.country")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-country">{selectedInstitution.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.address")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-address">{selectedInstitution.address || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.contactEmail")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-email">{selectedInstitution.contactEmail || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.contactPhone")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-phone">{selectedInstitution.contactPhone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.submissionFrequency")}</p>
                    <p className="text-sm font-medium capitalize" data-testid="text-detail-frequency">{selectedInstitution.submissionFrequency ? t(`institutions.frequencies.${selectedInstitution.submissionFrequency}`) : "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("institutions.registeredOn")}</p>
                    <p className="text-sm font-medium" data-testid="text-detail-created">{selectedInstitution.createdAt ? new Date(selectedInstitution.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p>
                  </div>
                </div>
                {selectedInstitution.approvedAt && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("institutions.approvedOn")}</p>
                      <p className="text-sm font-medium" data-testid="text-detail-approved">{new Date(selectedInstitution.approvedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                )}
              </div>
              {isAdmin && selectedInstitution.status === "pending" && (
                <>
                  <Separator />
                  <Button
                    className="w-full"
                    onClick={() => { approveMutation.mutate(selectedInstitution.id); setSelectedInstitution(null); }}
                    disabled={approveMutation.isPending}
                    data-testid="button-detail-approve"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("institutions.approve")}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2" data-testid="pagination-institutions">
          <p className="text-sm text-muted-foreground">
            {t("common.showing")} {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalInstitutions)} {t("common.of")} {totalInstitutions.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-inst-prev">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("common.previous")}
            </Button>
            <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-inst-next">
              {t("common.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
