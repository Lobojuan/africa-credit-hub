import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Plus, Search, Building2, User, Users, ChevronRight, ChevronLeft, Flag, AlertTriangle, Camera } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import { isGhanaMode, getDefaultCountry } from "@/lib/country-mode";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Borrower } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";

const PAGE_SIZE = 50;

export default function BorrowersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: paginatedResult, isLoading } = useQuery<{ data: Borrower[]; total: number } | Borrower[]>({
    queryKey: search
      ? [`/api/borrowers?search=${encodeURIComponent(search)}`]
      : [`/api/borrowers?page=${page}&limit=${PAGE_SIZE}`],
  });

  const borrowers = Array.isArray(paginatedResult) ? paginatedResult : paginatedResult?.data;
  const totalBorrowers = Array.isArray(paginatedResult) ? paginatedResult.length : paginatedResult?.total ?? 0;
  const totalPages = Math.ceil(totalBorrowers / PAGE_SIZE);

  const [formData, setFormData] = useState({
    type: "individual" as "individual" | "corporate",
    firstName: "", lastName: "", companyName: "", nationalId: "",
    tinNumber: "", passportNumber: "",
    dateOfBirth: "", gender: "", phone: "", email: "",
    address: "", country: getDefaultCountry() || "", city: "", region: "",
    employerName: "", occupation: "", businessRegNumber: "", sector: "",
    isPep: false, pepDetails: "",
    educationLevel: "", educationInstitution: "", employmentHistory: "",
    relatedBorrowerId: "", relationshipType: "",
  });

  const [fuzzyMatches, setFuzzyMatches] = useState<any[]>([]);
  const [fuzzyChecking, setFuzzyChecking] = useState(false);

  const checkFuzzyMatch = useCallback(async (data: typeof formData) => {
    const params = new URLSearchParams();
    if (data.type === "individual") {
      if (data.firstName) params.set("firstName", data.firstName);
      if (data.lastName) params.set("lastName", data.lastName);
    } else {
      if (data.companyName) params.set("companyName", data.companyName);
    }
    if (data.nationalId) params.set("nationalId", data.nationalId);
    if (data.passportNumber) params.set("passportNumber", data.passportNumber);
    if (data.tinNumber) params.set("tinNumber", data.tinNumber);
    if (params.toString().length === 0) { setFuzzyMatches([]); return; }
    setFuzzyChecking(true);
    try {
      const res = await fetch(`/api/borrowers/fuzzy-match?${params}`, { credentials: "include" });
      if (res.ok) {
        const matches = await res.json();
        setFuzzyMatches(matches);
      }
    } catch {} finally { setFuzzyChecking(false); }
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    const hasData = formData.nationalId.length >= 3 ||
      (formData.passportNumber || "").length >= 3 ||
      (formData.tinNumber || "").length >= 3 ||
      (formData.type === "individual" && (formData.firstName.length >= 2 || formData.lastName.length >= 2)) ||
      (formData.type === "corporate" && (formData.companyName || "").length >= 2);
    if (!hasData) { setFuzzyMatches([]); return; }
    const timer = setTimeout(() => checkFuzzyMatch(formData), 500);
    return () => clearTimeout(timer);
  }, [formData.firstName, formData.lastName, formData.nationalId, formData.companyName, formData.passportNumber, formData.tinNumber, formData.type, dialogOpen, checkFuzzyMatch]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/borrowers", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith?.("/api/borrowers") });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      setDialogOpen(false);
      setFormData({ type: "individual", firstName: "", lastName: "", companyName: "", nationalId: "", tinNumber: "", passportNumber: "", dateOfBirth: "", gender: "", phone: "", email: "", address: "", country: getDefaultCountry() || "", city: "", region: "", employerName: "", occupation: "", businessRegNumber: "", sector: "", isPep: false, pepDetails: "", educationLevel: "", educationInstitution: "", employmentHistory: "", relatedBorrowerId: "", relationshipType: "" });
      toast({ title: data.message || t("borrowers.registerBorrower"), description: t("borrowers.submittedForApproval") });
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-borrowers-title">{t("borrowers.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t("borrowers.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-borrower">
              <Plus className="w-4 h-4 mr-2" />
              {t("borrowers.registerBorrower")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("borrowers.registerNew")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-add-borrower">
              <div>
                <Label>{t("borrowers.type")}</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "individual" | "corporate" })}>
                  <SelectTrigger data-testid="select-borrower-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t("borrowers.individual")}</SelectItem>
                    <SelectItem value="corporate">{t("borrowers.corporate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === "individual" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>{t("borrowers.firstName")}</Label><Input data-testid="input-first-name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                    <div><Label>{t("borrowers.lastName")}</Label><Input data-testid="input-last-name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>{t("borrowers.dateOfBirth")}</Label><Input data-testid="input-dob" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                    <div>
                      <Label>{t("borrowers.gender")}</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger data-testid="select-gender"><SelectValue placeholder={t("creditAccounts.select")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">{t("borrowers.male")}</SelectItem>
                          <SelectItem value="Female">{t("borrowers.female")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>{t("borrowers.employer")}</Label><Input data-testid="input-employer" value={formData.employerName} onChange={(e) => setFormData({ ...formData, employerName: e.target.value })} /></div>
                    <div><Label>{t("borrowers.occupation")}</Label><Input data-testid="input-occupation" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><Label>{t("borrowers.companyName")}</Label><Input data-testid="input-company-name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required /></div>
                  <div><Label>{t("borrowers.businessRegNo")}</Label><Input data-testid="input-business-reg" value={formData.businessRegNumber} onChange={(e) => setFormData({ ...formData, businessRegNumber: e.target.value })} /></div>
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("borrowers.nationalId")}</Label><Input data-testid="input-national-id" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} required /></div>
                <div><Label>{t("borrowers.tinNumber")}</Label><Input data-testid="input-tin" value={formData.tinNumber} onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })} /></div>
                <div><Label>{t("borrowers.passportNumber")}</Label><Input data-testid="input-passport" value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })} placeholder={t("borrowers.passportNumber")} /></div>
              </div>
              {fuzzyMatches.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20" data-testid="alert-fuzzy-matches">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t("borrowers.potentialDuplicates", { count: fuzzyMatches.length })}</p>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-auto">
                    {fuzzyMatches.slice(0, 5).map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-background/60">
                        <span className="font-medium">{m.type === "corporate" ? m.companyName : `${m.firstName} ${m.lastName}`}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{m.nationalId}</span>
                          <Badge variant="outline" className="text-[9px]">{Math.round((m.similarity || 0) * 100)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("borrowers.phone")}</Label><Input data-testid="input-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>{t("borrowers.email")}</Label><Input data-testid="input-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              </div>
              <div><Label>{t("borrowers.address")}</Label><Input data-testid="input-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div>
                <Label>{t("borrowers.country")}</Label>
                {isGhanaMode() ? (
                  <Input data-testid="select-country" value="Ghana" disabled className="bg-muted" />
                ) : (
                  <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                    <SelectTrigger data-testid="select-country"><SelectValue placeholder={t("creditAccounts.select")} /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>{t("borrowers.city")}</Label><Input data-testid="input-city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                <div><Label>{t("borrowers.region")}</Label><Input data-testid="input-region" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} /></div>
              </div>
              <div><Label>{t("borrowers.sector")}</Label><Input data-testid="input-sector" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} /></div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPep"
                  checked={formData.isPep}
                  onChange={(e) => setFormData({ ...formData, isPep: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                  data-testid="checkbox-pep"
                />
                <Label htmlFor="isPep" className="cursor-pointer">{t("borrowers.pepFlag")}</Label>
              </div>
              {formData.isPep && (
                <div><Label>{t("borrowers.pepDetails")}</Label><Input data-testid="input-pep-details" value={formData.pepDetails} onChange={(e) => setFormData({ ...formData, pepDetails: e.target.value })} placeholder={t("borrowers.pepDetailsPlaceholder")} /></div>
              )}
              <div>
                <Label>{t("borrowers.educationLevel")}</Label>
                <Select value={formData.educationLevel} onValueChange={(v) => setFormData({ ...formData, educationLevel: v })}>
                  <SelectTrigger data-testid="select-education-level"><SelectValue placeholder={t("creditAccounts.select")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("borrowers.educationLevels.none")}</SelectItem>
                    <SelectItem value="primary">{t("borrowers.educationLevels.primary")}</SelectItem>
                    <SelectItem value="secondary">{t("borrowers.educationLevels.secondary")}</SelectItem>
                    <SelectItem value="diploma">{t("borrowers.educationLevels.diploma")}</SelectItem>
                    <SelectItem value="bachelors">{t("borrowers.educationLevels.bachelors")}</SelectItem>
                    <SelectItem value="masters">{t("borrowers.educationLevels.masters")}</SelectItem>
                    <SelectItem value="doctorate">{t("borrowers.educationLevels.doctorate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("borrowers.educationInstitution")}</Label><Input data-testid="input-education-institution" value={formData.educationInstitution} onChange={(e) => setFormData({ ...formData, educationInstitution: e.target.value })} /></div>
              <div><Label>{t("borrowers.employmentHistory")}</Label><Textarea data-testid="input-employment-history" value={formData.employmentHistory} onChange={(e) => setFormData({ ...formData, employmentHistory: e.target.value })} placeholder={t("borrowers.employmentHistoryPlaceholder")} className="resize-none" /></div>
              <Separator className="my-2" />
              <p className="text-sm font-medium">{t("borrowers.relatedPartyLinking")}</p>
              <div>
                <Label>{t("borrowers.relationshipType")}</Label>
                <Select value={formData.relationshipType} onValueChange={(v) => setFormData({ ...formData, relationshipType: v })}>
                  <SelectTrigger data-testid="select-relationship-type"><SelectValue placeholder={t("creditAccounts.select")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">{t("borrowers.relationshipTypes.spouse")}</SelectItem>
                    <SelectItem value="guarantor">{t("borrowers.relationshipTypes.guarantor")}</SelectItem>
                    <SelectItem value="director">{t("borrowers.relationshipTypes.director")}</SelectItem>
                    <SelectItem value="shareholder">{t("borrowers.relationshipTypes.shareholder")}</SelectItem>
                    <SelectItem value="beneficial_owner">{t("borrowers.relationshipTypes.beneficialOwner")}</SelectItem>
                    <SelectItem value="subsidiary">{t("borrowers.relationshipTypes.subsidiary")}</SelectItem>
                    <SelectItem value="parent_company">{t("borrowers.relationshipTypes.parentCompany")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.relationshipType && (
                <div><Label>{t("borrowers.relatedBorrowerId")}</Label><Input data-testid="input-related-borrower-id" value={formData.relatedBorrowerId} onChange={(e) => setFormData({ ...formData, relatedBorrowerId: e.target.value })} placeholder={t("borrowers.relatedBorrowerIdPlaceholder")} /></div>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-borrower">
                {createMutation.isPending ? t("borrowers.registering") : t("borrowers.registerBorrower")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-search-borrowers"
          placeholder={t("borrowers.searchPlaceholder")}
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : borrowers && borrowers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {borrowers.map((borrower) => (
            <Card
              key={borrower.id}
              className="cursor-pointer hover-elevate"
              onClick={() => navigate(`/borrowers/${borrower.id}`)}
              data-testid={`card-borrower-${borrower.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={(borrower as any).photoUrl || getBorrowerAvatarUrl(borrower.id, borrower.type === "corporate" ? (borrower.companyName || "") : `${borrower.firstName} ${borrower.lastName}`, borrower.type as "individual" | "corporate")}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                      data-testid={`img-avatar-${borrower.id}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{borrower.nationalId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">{borrower.type}</Badge>
                  {borrower.isPep && <Badge variant="destructive" className="text-[10px]"><Flag className="w-3 h-3 mr-1" />{t("borrowers.pep")}</Badge>}
                  {borrower.country && <Badge variant="outline" className="text-[10px]">{borrower.country}</Badge>}
                  {borrower.city && <Badge variant="outline" className="text-[10px]">{borrower.city}{borrower.region ? `, ${borrower.region}` : ""}</Badge>}
                  {borrower.sector && <Badge variant="outline" className="text-[10px]">{borrower.sector}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold">{t("borrowers.noBorrowers")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? t("borrowers.noSearchResults") : t("borrowers.getStarted")}
            </p>
          </CardContent>
        </Card>
      )}

      {!search && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2" data-testid="pagination-controls">
          <p className="text-sm text-muted-foreground">
            {t("common.showing")} {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalBorrowers)} {t("common.of")} {totalBorrowers.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("common.previous")}
            </Button>
            <span className="text-sm font-medium px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              data-testid="button-next-page"
            >
              {t("common.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
