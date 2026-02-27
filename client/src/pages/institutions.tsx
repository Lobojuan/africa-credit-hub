import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Building2, CheckCircle } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import type { Institution } from "@shared/schema";

const institutionTypes = ["bank", "mfi", "utility", "telecom", "digital_lender", "sacco"] as const;
const submissionFrequencies = ["daily", "weekly", "monthly"] as const;

function StatusBadge({ status }: { status: string }) {
  const variant = status === "active" ? "default" : status === "suspended" ? "destructive" : "secondary";
  const className =
    status === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : status === "suspended"
        ? ""
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";

  return (
    <Badge variant={variant} className={className} data-testid={`badge-status-${status}`}>
      {status}
    </Badge>
  );
}

export default function InstitutionsPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: institutions, isLoading } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
  });

  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    registrationNumber: "",
    country: "Ethiopia",
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
      country: "Ethiopia",
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
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
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
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-institutions-title">
            {t("institutions.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("institutions.subtitle")}</p>
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
                <Input
                  data-testid="input-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <TableRow key={inst.id} data-testid={`row-institution-${inst.id}`}>
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
                            onClick={() => approveMutation.mutate(inst.id)}
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
    </div>
  );
}
