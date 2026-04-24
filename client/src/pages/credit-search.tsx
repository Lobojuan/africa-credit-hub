import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Search, User, Building2, FileText, ChevronRight, Globe, Landmark, CreditCard, Calendar, IdCard, Smartphone, Phone, Merge, CheckSquare, Square, AlertTriangle, CheckCircle2, Loader2, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import { isGhanaMode } from "@/lib/country-mode";
import type { Borrower, Institution, CreditAccount, TelcoProfile } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GlobalSearchResults {
  borrowers: Borrower[];
  institutions: Institution[];
  creditAccounts: CreditAccount[];
  telcoProfiles: TelcoProfile[];
}

const TELCO_PROVIDERS = [
  { value: "mtn", label: "MTN" },
  { value: "vodafone", label: "Vodafone" },
  { value: "airtel", label: "Airtel" },
  { value: "safaricom", label: "Safaricom" },
  { value: "orange", label: "Orange" },
  { value: "glo", label: "Glo" },
  { value: "tigo", label: "Tigo" },
  { value: "africell", label: "Africell" },
  { value: "econet", label: "Econet" },
  { value: "other", label: "Other" },
];

const TELCO_ACCOUNT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "dormant", label: "Dormant" },
];

const SEARCH_REASONS = [
  { value: "credit_application", label: "Credit Application" },
  { value: "account_review", label: "Account Review" },
  { value: "collection", label: "Collection" },
  { value: "guarantor_check", label: "Guarantor Check" },
  { value: "employment_check", label: "Employment Check" },
  { value: "regulatory_requirement", label: "Regulatory Requirement" },
  { value: "consent_based", label: "Consent-Based Inquiry" },
];

const BUSINESS_PURPOSES = [
  { value: "credit_facility", label: "Credit Facility Assessment" },
  { value: "vendor_onboarding", label: "Vendor / Supplier Onboarding" },
  { value: "regulatory_compliance", label: "Regulatory Compliance" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "partnership_evaluation", label: "Partnership Evaluation" },
  { value: "insurance_underwriting", label: "Insurance Underwriting" },
];

export default function CreditSearchPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTab, setSearchTab] = useState<"consumer" | "business" | "telco" | "general">("consumer");

  const [mergeMode, setMergeMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergePreview, setMergePreview] = useState<{ borrowers: Borrower[]; accountCounts: Record<string, number> } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const mergeMutation = useMutation({
    mutationFn: async ({ pId, dupIds }: { pId: string; dupIds: string[] }) => {
      const res = await apiRequest("POST", "/api/borrowers/merge", { primaryId: pId, duplicateIds: dupIds });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Merge failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      setMergeDialogOpen(false);
      setMergeMode(false);
      setSelectedIds([]);
      setPrimaryId(null);
      setMergePreview(null);
      toast({ title: "Records merged", description: data.message });
      navigate(`/borrowers/${data.primaryId}`);
    },
    onError: (e: any) => {
      toast({ title: "Merge failed", description: e.message, variant: "destructive" });
    },
  });

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!next.includes(primaryId || "")) setPrimaryId(next[0] || null);
      return next;
    });
  }

  async function openMergeDialog() {
    if (selectedIds.length < 2) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/borrowers/merge/preview?ids=${selectedIds.join(",")}`, { credentials: "include" });
      const data = await res.json();
      setMergePreview(data);
      if (!primaryId || !selectedIds.includes(primaryId)) setPrimaryId(selectedIds[0]);
      setMergeDialogOpen(true);
    } catch {
      toast({ title: "Preview failed", description: "Could not load merge preview", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  }

  function confirmMerge() {
    if (!primaryId) return;
    const dupIds = selectedIds.filter(id => id !== primaryId);
    mergeMutation.mutate({ pId: primaryId, dupIds });
  }

  const [consumerForm, setConsumerForm] = useState({
    ghanaCardNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    mobileNumber: "",
    gender: "",
    email: "",
    otherIdType: "",
    otherIdNumber: "",
    reasonForRequest: "",
    amountRequested: "",
    reportType: "",
  });
  const [consumerSubmitted, setConsumerSubmitted] = useState(false);
  const [activeConsumerParams, setActiveConsumerParams] = useState<typeof consumerForm | null>(null);

  const [businessForm, setBusinessForm] = useState({
    companyName: "",
    registrationNumber: "",
    registrationDate: "",
    tinNumber: "",
    purpose: "",
    amountRequested: "",
  });
  const [businessSubmitted, setBusinessSubmitted] = useState(false);
  const [activeBusinessParams, setActiveBusinessParams] = useState<typeof businessForm | null>(null);

  const [telcoForm, setTelcoForm] = useState({
    msisdn: "",
    provider: "",
    accountStatus: "",
  });
  const [telcoSubmitted, setTelcoSubmitted] = useState(false);
  const [activeTelcoParams, setActiveTelcoParams] = useState<typeof telcoForm | null>(null);

  const [generalQuery, setGeneralQuery] = useState("");
  const [generalSearchTerm, setGeneralSearchTerm] = useState("");
  const [country, setCountry] = useState("");
  const [activeCountry, setActiveCountry] = useState("");

  const buildConsumerUrl = () => {
    if (!activeConsumerParams) return "";
    const params = new URLSearchParams();
    params.set("searchType", "consumer");
    if (activeConsumerParams.ghanaCardNumber) params.set("ghanaCardNumber", activeConsumerParams.ghanaCardNumber);
    if (activeConsumerParams.firstName) params.set("firstName", activeConsumerParams.firstName);
    if (activeConsumerParams.middleName) params.set("middleName", activeConsumerParams.middleName);
    if (activeConsumerParams.lastName) params.set("lastName", activeConsumerParams.lastName);
    if (activeConsumerParams.dateOfBirth) params.set("dateOfBirth", activeConsumerParams.dateOfBirth);
    if (activeConsumerParams.mobileNumber) params.set("mobileNumber", activeConsumerParams.mobileNumber);
    if (activeConsumerParams.gender) params.set("gender", activeConsumerParams.gender);
    if (activeConsumerParams.email) params.set("email", activeConsumerParams.email);
    if (activeConsumerParams.otherIdType) params.set("otherIdType", activeConsumerParams.otherIdType);
    if (activeConsumerParams.otherIdNumber) params.set("otherIdNumber", activeConsumerParams.otherIdNumber);
    if (activeConsumerParams.reasonForRequest) params.set("reasonForRequest", activeConsumerParams.reasonForRequest);
    if (activeConsumerParams.amountRequested) params.set("amountRequested", activeConsumerParams.amountRequested);
    if (activeConsumerParams.reportType) params.set("reportType", activeConsumerParams.reportType);
    return `/api/structured-search?${params.toString()}`;
  };

  const buildBusinessUrl = () => {
    if (!activeBusinessParams) return "";
    const params = new URLSearchParams();
    params.set("searchType", "business");
    if (activeBusinessParams.companyName) params.set("companyName", activeBusinessParams.companyName);
    if (activeBusinessParams.registrationNumber) params.set("registrationNumber", activeBusinessParams.registrationNumber);
    if (activeBusinessParams.registrationDate) params.set("registrationDate", activeBusinessParams.registrationDate);
    if (activeBusinessParams.tinNumber) params.set("tinNumber", activeBusinessParams.tinNumber);
    if (activeBusinessParams.purpose) params.set("purpose", activeBusinessParams.purpose);
    if (activeBusinessParams.amountRequested) params.set("amountRequested", activeBusinessParams.amountRequested);
    return `/api/structured-search?${params.toString()}`;
  };

  const { data: consumerResults, isLoading: consumerLoading } = useQuery<Borrower[]>({
    queryKey: ["/api/structured-search", "consumer", activeConsumerParams],
    queryFn: async () => {
      const res = await fetch(buildConsumerUrl());
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: consumerSubmitted && !!activeConsumerParams,
  });

  const { data: businessResults, isLoading: businessLoading } = useQuery<Borrower[]>({
    queryKey: ["/api/structured-search", "business", activeBusinessParams],
    queryFn: async () => {
      const res = await fetch(buildBusinessUrl());
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: businessSubmitted && !!activeBusinessParams,
  });

  const buildTelcoUrl = () => {
    if (!activeTelcoParams) return "";
    const params = new URLSearchParams();
    params.set("searchType", "telco");
    if (activeTelcoParams.msisdn) params.set("msisdn", activeTelcoParams.msisdn);
    if (activeTelcoParams.provider) params.set("provider", activeTelcoParams.provider);
    if (activeTelcoParams.accountStatus) params.set("accountStatus", activeTelcoParams.accountStatus);
    return `/api/structured-search?${params.toString()}`;
  };

  const { data: telcoResults, isLoading: telcoLoading } = useQuery<TelcoProfile[]>({
    queryKey: ["/api/structured-search", "telco", activeTelcoParams],
    queryFn: async () => {
      const res = await fetch(buildTelcoUrl());
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: telcoSubmitted && !!activeTelcoParams,
  });

  const buildGeneralSearchUrl = () => {
    const params = new URLSearchParams();
    if (generalSearchTerm) params.set("q", generalSearchTerm);
    if (activeCountry) params.set("country", activeCountry);
    return `/api/global-search?${params.toString()}`;
  };

  const hasActiveGeneralSearch = generalSearchTerm.length > 0 || activeCountry.length > 0;

  const { data: generalResults, isLoading: generalLoading } = useQuery<GlobalSearchResults>({
    queryKey: ["/api/global-search", generalSearchTerm, activeCountry],
    queryFn: async () => {
      const res = await fetch(buildGeneralSearchUrl());
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: hasActiveGeneralSearch,
  });

  const handleConsumerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerForm.ghanaCardNumber) return;
    if (!consumerForm.firstName || !consumerForm.lastName) return;
    if (!consumerForm.dateOfBirth) return;
    if (!consumerForm.mobileNumber) return;
    if (!consumerForm.gender) return;
    if (!consumerForm.reasonForRequest) return;
    if (!consumerForm.reportType) return;
    setActiveConsumerParams({ ...consumerForm });
    setConsumerSubmitted(true);
  };

  const handleBusinessSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.companyName) return;
    if (!businessForm.registrationNumber) return;
    if (!businessForm.registrationDate) return;
    if (!businessForm.purpose) return;
    if (!businessForm.amountRequested) return;
    setActiveBusinessParams({ ...businessForm });
    setBusinessSubmitted(true);
  };

  const handleTelcoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTelcoParams({ ...telcoForm });
    setTelcoSubmitted(true);
  };

  const handleGeneralSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralSearchTerm(generalQuery);
    setActiveCountry(country === "all" ? "" : country);
  };

  const generalTotalResults = (generalResults?.borrowers?.length || 0) + (generalResults?.institutions?.length || 0) + (generalResults?.creditAccounts?.length || 0) + (generalResults?.telcoProfiles?.length || 0);

  const consumerFormValid = consumerForm.ghanaCardNumber && consumerForm.firstName && consumerForm.lastName && consumerForm.dateOfBirth && consumerForm.mobileNumber && consumerForm.gender && consumerForm.reasonForRequest && consumerForm.reportType;
  const businessFormValid = businessForm.companyName && businessForm.registrationNumber && businessForm.registrationDate && businessForm.purpose && businessForm.amountRequested;
  const telcoFormValid = true;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1000px] mx-auto animate-page-enter">
      <div className="text-center space-y-2 pt-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-search-title">{t('search.title')}</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('search.subtitle')}
        </p>
      </div>

      <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as any)} className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-search-type">
          <TabsTrigger value="consumer" data-testid="tab-consumer-search">
            <User className="w-4 h-4 mr-1.5" />
            Consumer
          </TabsTrigger>
          <TabsTrigger value="business" data-testid="tab-business-search">
            <Building2 className="w-4 h-4 mr-1.5" />
            Business
          </TabsTrigger>
          <TabsTrigger value="telco" data-testid="tab-telco-search">
            <Smartphone className="w-4 h-4 mr-1.5" />
            Telco
          </TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general-search">
            <Search className="w-4 h-4 mr-1.5" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumer" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleConsumerSearch} className="space-y-4" data-testid="form-consumer-search">
                <div className="flex items-center gap-2 mb-3">
                  <IdCard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Consumer Credit Search</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">BOG Compliant</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="ghanaCard" className="text-xs font-medium">
                      Ghana Card Number <span className="text-red-500">*</span> <span className="text-muted-foreground">(Primary Identifier)</span>
                    </Label>
                    <Input
                      id="ghanaCard"
                      data-testid="input-ghana-card"
                      placeholder="GHA-XXXXXXXXX-X"
                      value={consumerForm.ghanaCardNumber}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, ghanaCardNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      data-testid="input-consumer-firstname"
                      placeholder="First name"
                      value={consumerForm.firstName}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="middleName" className="text-xs font-medium">Middle Name</Label>
                    <Input
                      id="middleName"
                      data-testid="input-consumer-middlename"
                      placeholder="Middle name (optional)"
                      value={consumerForm.middleName}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, middleName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      data-testid="input-consumer-lastname"
                      placeholder="Last name"
                      value={consumerForm.lastName}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-medium">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      data-testid="input-consumer-dob"
                      value={consumerForm.dateOfBirth}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mobileNumber" className="text-xs font-medium">
                      Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mobileNumber"
                      data-testid="input-consumer-mobile"
                      placeholder="+233 XXX XXX XXXX"
                      value={consumerForm.mobileNumber}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select value={consumerForm.gender} onValueChange={(v) => setConsumerForm(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger data-testid="select-consumer-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-consumer-email"
                      placeholder="email@example.com (optional)"
                      value={consumerForm.email}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Other ID Type</Label>
                    <Select value={consumerForm.otherIdType} onValueChange={(v) => setConsumerForm(prev => ({ ...prev, otherIdType: v }))}>
                      <SelectTrigger data-testid="select-consumer-other-id-type">
                        <SelectValue placeholder="Select ID type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="voters_id">Voter's ID</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="ssnit">SSNIT Number</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="otherIdNumber" className="text-xs font-medium">Other ID Number</Label>
                    <Input
                      id="otherIdNumber"
                      data-testid="input-consumer-other-id-number"
                      placeholder="ID number (optional)"
                      value={consumerForm.otherIdNumber}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, otherIdNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Reason for Request <span className="text-red-500">*</span>
                    </Label>
                    <Select value={consumerForm.reasonForRequest} onValueChange={(v) => setConsumerForm(prev => ({ ...prev, reasonForRequest: v }))}>
                      <SelectTrigger data-testid="select-consumer-reason">
                        <SelectValue placeholder="Select reason for inquiry" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEARCH_REASONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amountRequested" className="text-xs font-medium">Amount Requested</Label>
                    <Input
                      id="amountRequested"
                      data-testid="input-consumer-amount"
                      placeholder="e.g. 50000 (optional)"
                      type="number"
                      value={consumerForm.amountRequested}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, amountRequested: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Report Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={consumerForm.reportType} onValueChange={(v) => setConsumerForm(prev => ({ ...prev, reportType: v }))}>
                      <SelectTrigger data-testid="select-consumer-report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_report">Full Credit Report</SelectItem>
                        <SelectItem value="score_only">Score Only</SelectItem>
                        <SelectItem value="summary">Summary Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!consumerFormValid} data-testid="button-consumer-search">
                    <Search className="w-4 h-4 mr-1.5" />
                    Search Consumer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {consumerSubmitted && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground" data-testid="text-consumer-result-count">
                  {consumerLoading ? "Searching..." : `${consumerResults?.length || 0} consumer(s) found`}
                </p>
                {!consumerLoading && consumerResults && consumerResults.length > 1 && (
                  <Button
                    variant={mergeMode ? "default" : "outline"}
                    size="sm"
                    className="gap-2 text-xs"
                    data-testid="btn-toggle-merge-mode"
                    onClick={() => { setMergeMode(v => !v); setSelectedIds([]); setPrimaryId(null); }}
                  >
                    <Merge className="w-3.5 h-3.5" />
                    {mergeMode ? "Cancel Merge" : "Select to Merge"}
                  </Button>
                )}
              </div>

              {mergeMode && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-medium">Merge mode active</p>
                    <p>Select 2 or more duplicate records, then click "Merge Records". All credit data (accounts, inquiries, payments) will be consolidated into the primary record and duplicates will be removed.</p>
                  </div>
                  {selectedIds.length >= 2 && (
                    <Button
                      size="sm"
                      className="shrink-0 h-7 text-xs gap-1.5"
                      data-testid="btn-open-merge-dialog"
                      onClick={openMergeDialog}
                      disabled={previewLoading}
                    >
                      {previewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Merge className="w-3 h-3" />}
                      Merge {selectedIds.length} Records
                    </Button>
                  )}
                </div>
              )}

              {consumerLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (consumerResults && consumerResults.length > 0) ? (
                <div className="space-y-3">
                  {consumerResults.map((borrower) => (
                    <BorrowerResultCard
                      key={borrower.id}
                      borrower={borrower}
                      navigate={navigate}
                      t={t}
                      mergeMode={mergeMode}
                      isSelected={selectedIds.includes(borrower.id)}
                      isPrimary={primaryId === borrower.id}
                      onToggle={() => toggleSelect(borrower.id)}
                      onSetPrimary={() => setPrimaryId(borrower.id)}
                    />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="business" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleBusinessSearch} className="space-y-4" data-testid="form-business-search">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Business Credit Search</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">BOG Compliant</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="companyName" className="text-xs font-medium">
                      Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      data-testid="input-business-name"
                      placeholder="Registered company name"
                      value={businessForm.companyName}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="regNumber" className="text-xs font-medium">
                      Registration Number <span className="text-red-500">*</span> <span className="text-muted-foreground">(Primary ID)</span>
                    </Label>
                    <Input
                      id="regNumber"
                      data-testid="input-business-regnumber"
                      placeholder="Company registration number"
                      value={businessForm.registrationNumber}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="regDate" className="text-xs font-medium">
                      Registration Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="regDate"
                      type="date"
                      data-testid="input-business-regdate"
                      value={businessForm.registrationDate}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, registrationDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tin" className="text-xs font-medium">TIN Number</Label>
                    <Input
                      id="tin"
                      data-testid="input-business-tin"
                      placeholder="Tax Identification Number (optional)"
                      value={businessForm.tinNumber}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, tinNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Purpose of Inquiry <span className="text-red-500">*</span>
                    </Label>
                    <Select value={businessForm.purpose} onValueChange={(v) => setBusinessForm(prev => ({ ...prev, purpose: v }))}>
                      <SelectTrigger data-testid="select-business-purpose">
                        <SelectValue placeholder="Select purpose of inquiry" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_PURPOSES.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="bizAmountRequested" className="text-xs font-medium">
                      Amount Requested <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bizAmountRequested"
                      data-testid="input-business-amount"
                      placeholder="e.g. 500000"
                      type="number"
                      value={businessForm.amountRequested}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, amountRequested: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!businessFormValid} data-testid="button-business-search">
                    <Search className="w-4 h-4 mr-1.5" />
                    Search Business
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {businessSubmitted && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground" data-testid="text-business-result-count">
                  {businessLoading ? "Searching..." : `${businessResults?.length || 0} business(es) found`}
                </p>
                {!businessLoading && businessResults && businessResults.length > 1 && (
                  <Button
                    variant={mergeMode ? "default" : "outline"}
                    size="sm"
                    className="gap-2 text-xs"
                    data-testid="btn-toggle-merge-mode-business"
                    onClick={() => { setMergeMode(v => !v); setSelectedIds([]); setPrimaryId(null); }}
                  >
                    <Merge className="w-3.5 h-3.5" />
                    {mergeMode ? "Cancel Merge" : "Select to Merge"}
                  </Button>
                )}
              </div>
              {mergeMode && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-medium">Merge mode active — select duplicate records below</p>
                  </div>
                  {selectedIds.length >= 2 && (
                    <Button size="sm" className="shrink-0 h-7 text-xs gap-1.5" data-testid="btn-open-merge-dialog-business" onClick={openMergeDialog} disabled={previewLoading}>
                      {previewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Merge className="w-3 h-3" />}
                      Merge {selectedIds.length} Records
                    </Button>
                  )}
                </div>
              )}
              {businessLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (businessResults && businessResults.length > 0) ? (
                <div className="space-y-3">
                  {businessResults.map((borrower) => (
                    <BorrowerResultCard
                      key={borrower.id}
                      borrower={borrower}
                      navigate={navigate}
                      t={t}
                      mergeMode={mergeMode}
                      isSelected={selectedIds.includes(borrower.id)}
                      isPrimary={primaryId === borrower.id}
                      onToggle={() => toggleSelect(borrower.id)}
                      onSetPrimary={() => setPrimaryId(borrower.id)}
                    />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="telco" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleTelcoSearch} className="space-y-4" data-testid="form-telco-search">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Telco Subscriber Search</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">MoMo / Airtime</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="msisdn" className="text-xs font-medium">
                      MSISDN (Phone Number) <span className="text-muted-foreground">(Primary Identifier)</span>
                    </Label>
                    <Input
                      id="msisdn"
                      data-testid="input-telco-msisdn"
                      placeholder="+233XXXXXXXXX"
                      value={telcoForm.msisdn}
                      onChange={(e) => setTelcoForm(prev => ({ ...prev, msisdn: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Provider</Label>
                    <Select value={telcoForm.provider} onValueChange={(v) => setTelcoForm(prev => ({ ...prev, provider: v }))}>
                      <SelectTrigger data-testid="select-telco-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {TELCO_PROVIDERS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Account Status</Label>
                    <Select value={telcoForm.accountStatus} onValueChange={(v) => setTelcoForm(prev => ({ ...prev, accountStatus: v }))}>
                      <SelectTrigger data-testid="select-telco-status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        {TELCO_ACCOUNT_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!telcoFormValid} data-testid="button-telco-search">
                    <Search className="w-4 h-4 mr-1.5" />
                    Search Telco
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {telcoSubmitted && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground" data-testid="text-telco-result-count">
                {telcoLoading ? "Searching..." : `${telcoResults?.length || 0} telco profile(s) found`}
              </p>
              {telcoLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (telcoResults && telcoResults.length > 0) ? (
                <div className="space-y-3">
                  {telcoResults.map((profile) => (
                    <TelcoResultCard key={profile.id} profile={profile} navigate={navigate} />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="general" className="space-y-4 mt-4">
          <form onSubmit={handleGeneralSearch} className="space-y-3" data-testid="form-credit-search">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-credit-search"
                  placeholder={t('search.placeholder')}
                  className="pl-9"
                  value={generalQuery}
                  onChange={(e) => setGeneralQuery(e.target.value)}
                />
              </div>
              <Button type="submit" data-testid="button-search">{t('search.searchBtn')}</Button>
            </div>
            {isGhanaMode() ? (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input value="Ghana" disabled className="bg-muted" data-testid="select-search-country" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full" data-testid="select-search-country">
                    <SelectValue placeholder={t('search.allCountries')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('search.allCountries')}</SelectItem>
                    {SUPPORTED_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {country && country !== "all" && (
                  <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => { setCountry(""); setActiveCountry(""); }} data-testid="button-clear-country">
                    {t('common.clear')}
                  </Button>
                )}
              </div>
            )}
          </form>

          {hasActiveGeneralSearch && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground" data-testid="text-result-count">
                {generalLoading ? t('search.searching') : `${generalTotalResults} ${generalSearchTerm ? t('search.resultsFor', { term: generalSearchTerm }) : t('search.resultsForCountry', { country: activeCountry })}`}
              </p>

              {generalLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : generalTotalResults > 0 ? (
                <div className="space-y-6">
                  {generalResults!.borrowers.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-borrowers">
                          {t('search.borrowersSection')} ({generalResults!.borrowers.length})
                        </h2>
                      </div>
                      {generalResults!.borrowers.map((borrower) => (
                        <BorrowerResultCard
                          key={borrower.id}
                          borrower={borrower}
                          navigate={navigate}
                          t={t}
                          mergeMode={mergeMode}
                          isSelected={selectedIds.includes(borrower.id)}
                          isPrimary={primaryId === borrower.id}
                          onToggle={() => toggleSelect(borrower.id)}
                          onSetPrimary={() => setPrimaryId(borrower.id)}
                        />
                      ))}
                    </div>
                  )}

                  {generalResults!.institutions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-institutions">
                          {t('search.institutionsSection')} ({generalResults!.institutions.length})
                        </h2>
                      </div>
                      {generalResults!.institutions.map((inst) => (
                        <Card
                          key={inst.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => navigate(`/institutions`)}
                          data-testid={`result-institution-${inst.id}`}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex items-center justify-center w-11 h-11 rounded-md bg-blue-50 dark:bg-blue-950 shrink-0">
                                  <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{inst.name}</p>
                                  {inst.registrationNumber && <p className="text-xs text-muted-foreground">Reg: {inst.registrationNumber}</p>}
                                  {inst.contactEmail && <p className="text-xs text-muted-foreground">{inst.contactEmail}</p>}
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px] capitalize">{inst.type}</Badge>
                                    <Badge variant="outline" className="text-[10px]">{inst.country}</Badge>
                                    <Badge
                                      variant={inst.status === "active" ? "default" : "secondary"}
                                      className={`text-[10px] ${inst.status === "active" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : inst.status === "suspended" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : ""}`}
                                    >
                                      {inst.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {generalResults!.creditAccounts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-credit-accounts">
                          {t('search.creditAccountsSection')} ({generalResults!.creditAccounts.length})
                        </h2>
                      </div>
                      {generalResults!.creditAccounts.map((acc) => (
                        <Card
                          key={acc.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => navigate(`/borrowers/${acc.borrowerId}`)}
                          data-testid={`result-account-${acc.id}`}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex items-center justify-center w-11 h-11 rounded-md bg-amber-50 dark:bg-amber-950 shrink-0">
                                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{acc.lenderInstitution}</p>
                                  <p className="text-xs text-muted-foreground">{t('search.accountNumber')}: {acc.accountNumber}</p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px] capitalize">{acc.accountType}</Badge>
                                    <Badge variant="outline" className="text-[10px]">{acc.currency} {parseFloat(acc.currentBalance || "0").toLocaleString()}</Badge>
                                    <Badge
                                      variant={acc.status === "current" ? "default" : "secondary"}
                                      className={`text-[10px] ${acc.status === "current" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : acc.status === "delinquent" || acc.status === "default" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : ""}`}
                                    >
                                      {acc.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-view-borrower-${acc.id}`}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/borrowers/${acc.borrowerId}`); }}
                                >
                                  {t('search.viewDetails')}
                                </Button>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {generalResults!.telcoProfiles && generalResults!.telcoProfiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-telco-profiles">
                          Telco Profiles ({generalResults!.telcoProfiles.length})
                        </h2>
                      </div>
                      {generalResults!.telcoProfiles.map((profile) => (
                        <TelcoResultCard key={profile.id} profile={profile} navigate={navigate} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {searchTab !== "general" && !consumerSubmitted && !businessSubmitted && !telcoSubmitted && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('search.consentNote')}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={mergeDialogOpen} onOpenChange={(open) => { if (!open && !mergeMutation.isPending) setMergeDialogOpen(false); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-merge-preview">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="w-4 h-4 text-primary" />
              Merge Duplicate Records
            </DialogTitle>
            <DialogDescription>
              Choose which record becomes the primary. All credit data from the others will be merged into it and the duplicates will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          {mergePreview && (
            <div className="space-y-3 py-2 max-h-[360px] overflow-y-auto">
              {mergePreview.borrowers.map((b) => {
                const isP = primaryId === b.id;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isP ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}
                    onClick={() => { if (!mergeMutation.isPending) setPrimaryId(b.id); }}
                    data-testid={`merge-preview-row-${b.id}`}
                  >
                    <img
                      src={(b as any).photoUrl || getBorrowerAvatarUrl(b.id, b.type === "corporate" ? (b.companyName || "") : `${b.firstName} ${b.lastName}`, b.type as any)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.nationalId || b.passportNumber || (b as any).ghanaCardNumber}</p>
                      <p className="text-xs text-muted-foreground">{mergePreview.accountCounts[b.id] ?? 0} credit account(s)</p>
                    </div>
                    <div className="shrink-0">
                      {isP ? (
                        <Badge variant="default" className="text-[10px] flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" />Primary
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Duplicate</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-1">Click a record to set it as the primary</p>
            </div>
          )}

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              This action is irreversible. {selectedIds.length - 1} record(s) will be permanently removed after their data is consolidated.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setMergeDialogOpen(false)}
              disabled={mergeMutation.isPending}
              data-testid="btn-cancel-merge"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMerge}
              disabled={mergeMutation.isPending || !primaryId}
              data-testid="btn-confirm-merge"
              className="gap-2"
            >
              {mergeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {mergeMutation.isPending ? "Merging..." : `Merge ${selectedIds.length} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BorrowerResultCard({
  borrower, navigate, t,
  mergeMode = false, isSelected = false, isPrimary = false,
  onToggle, onSetPrimary,
}: {
  borrower: Borrower;
  navigate: (path: string) => void;
  t: any;
  mergeMode?: boolean;
  isSelected?: boolean;
  isPrimary?: boolean;
  onToggle?: () => void;
  onSetPrimary?: () => void;
}) {
  return (
    <Card
      className={`hover-elevate transition-all ${mergeMode ? "cursor-default" : "cursor-pointer"} ${isSelected ? "ring-2 ring-primary border-primary" : ""} ${isPrimary ? "bg-primary/5" : ""}`}
      onClick={() => { if (mergeMode) { onToggle?.(); } else { navigate(`/borrowers/${borrower.id}`); } }}
      data-testid={`result-borrower-${borrower.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            {mergeMode && (
              <button
                className="shrink-0 text-primary"
                onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                data-testid={`checkbox-merge-${borrower.id}`}
              >
                {isSelected
                  ? <CheckSquare className="w-5 h-5 text-primary" />
                  : <Square className="w-5 h-5 text-muted-foreground" />}
              </button>
            )}
            <img
              src={(borrower as any).photoUrl || getBorrowerAvatarUrl(borrower.id, borrower.type === "corporate" ? (borrower.companyName || "") : `${borrower.firstName} ${borrower.lastName}`, borrower.type as "individual" | "corporate")}
              alt=""
              className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
              data-testid={`img-search-avatar-${borrower.id}`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">
                  {borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`}
                </p>
                {isPrimary && (
                  <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-primary/80 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />Primary
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{borrower.nationalId}</p>
              {(borrower as any).ghanaCardNumber && <p className="text-xs text-muted-foreground">Ghana Card: {(borrower as any).ghanaCardNumber}</p>}
              {borrower.passportNumber && <p className="text-xs text-muted-foreground">Passport: {borrower.passportNumber}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] capitalize">{borrower.type}</Badge>
                {borrower.country && <Badge variant="outline" className="text-[10px]">{borrower.country}</Badge>}
                {borrower.city && <Badge variant="outline" className="text-[10px]">{borrower.city}{borrower.region ? `, ${borrower.region}` : ""}</Badge>}
                {borrower.sector && <Badge variant="outline" className="text-[10px]">{borrower.sector}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mergeMode && isSelected && !isPrimary && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-2 text-primary"
                data-testid={`btn-set-primary-${borrower.id}`}
                onClick={(e) => { e.stopPropagation(); onSetPrimary?.(); }}
              >
                Set Primary
              </Button>
            )}
            {!mergeMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`button-view-report-${borrower.id}`}
                  onClick={(e) => { e.stopPropagation(); navigate(`/credit-report/${borrower.id}`); }}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {t('search.viewReport')}
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TelcoResultCard({ profile, navigate }: { profile: TelcoProfile; navigate: (path: string) => void }) {
  return (
    <Card
      className="cursor-pointer hover-elevate"
      onClick={() => navigate(`/telco-scoring`)}
      data-testid={`result-telco-${profile.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-11 h-11 rounded-md bg-emerald-50 dark:bg-emerald-950 shrink-0">
              <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile.msisdn}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.provider} &middot; {profile.country}</p>
              {profile.deviceType && <p className="text-xs text-muted-foreground">Device: {profile.deviceType}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] capitalize">{profile.provider}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{profile.kycLevel} KYC</Badge>
                <Badge
                  variant={profile.accountStatus === "active" ? "default" : "secondary"}
                  className={`text-[10px] capitalize ${profile.accountStatus === "active" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : profile.accountStatus === "suspended" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : ""}`}
                >
                  {profile.accountStatus}
                </Badge>
                {profile.consentGranted && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Consent</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              data-testid={`button-view-telco-${profile.id}`}
              onClick={(e) => { e.stopPropagation(); navigate(`/telco-scoring`); }}
            >
              View Score
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NoResults() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h3 className="font-semibold" data-testid="text-no-results">No results found</h3>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
      </CardContent>
    </Card>
  );
}
