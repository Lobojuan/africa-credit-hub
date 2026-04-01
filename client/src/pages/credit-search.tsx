import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Search, User, Building2, FileText, ChevronRight, Globe, Landmark, CreditCard, Calendar, IdCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { SUPPORTED_COUNTRIES } from "@/lib/currency";
import { isGhanaMode } from "@/lib/country-mode";
import type { Borrower, Institution, CreditAccount } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";

interface GlobalSearchResults {
  borrowers: Borrower[];
  institutions: Institution[];
  creditAccounts: CreditAccount[];
}

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
  const [searchTab, setSearchTab] = useState<"consumer" | "business" | "general">("consumer");

  const [consumerForm, setConsumerForm] = useState({
    ghanaCardNumber: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    reasonForRequest: "",
  });
  const [consumerSubmitted, setConsumerSubmitted] = useState(false);
  const [activeConsumerParams, setActiveConsumerParams] = useState<typeof consumerForm | null>(null);

  const [businessForm, setBusinessForm] = useState({
    registrationNumber: "",
    tinNumber: "",
    companyName: "",
    purpose: "",
  });
  const [businessSubmitted, setBusinessSubmitted] = useState(false);
  const [activeBusinessParams, setActiveBusinessParams] = useState<typeof businessForm | null>(null);

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
    if (activeConsumerParams.lastName) params.set("lastName", activeConsumerParams.lastName);
    if (activeConsumerParams.dateOfBirth) params.set("dateOfBirth", activeConsumerParams.dateOfBirth);
    if (activeConsumerParams.gender) params.set("gender", activeConsumerParams.gender);
    if (activeConsumerParams.reasonForRequest) params.set("reasonForRequest", activeConsumerParams.reasonForRequest);
    return `/api/structured-search?${params.toString()}`;
  };

  const buildBusinessUrl = () => {
    if (!activeBusinessParams) return "";
    const params = new URLSearchParams();
    params.set("searchType", "business");
    if (activeBusinessParams.registrationNumber) params.set("registrationNumber", activeBusinessParams.registrationNumber);
    if (activeBusinessParams.tinNumber) params.set("tinNumber", activeBusinessParams.tinNumber);
    if (activeBusinessParams.companyName) params.set("companyName", activeBusinessParams.companyName);
    if (activeBusinessParams.purpose) params.set("purpose", activeBusinessParams.purpose);
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
    if (!consumerForm.ghanaCardNumber && !consumerForm.firstName && !consumerForm.lastName) return;
    if (!consumerForm.reasonForRequest) return;
    setActiveConsumerParams({ ...consumerForm });
    setConsumerSubmitted(true);
  };

  const handleBusinessSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.registrationNumber && !businessForm.tinNumber && !businessForm.companyName) return;
    if (!businessForm.purpose) return;
    setActiveBusinessParams({ ...businessForm });
    setBusinessSubmitted(true);
  };

  const handleGeneralSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralSearchTerm(generalQuery);
    setActiveCountry(country === "all" ? "" : country);
  };

  const generalTotalResults = (generalResults?.borrowers?.length || 0) + (generalResults?.institutions?.length || 0) + (generalResults?.creditAccounts?.length || 0);

  const consumerFormValid = (consumerForm.ghanaCardNumber || consumerForm.firstName || consumerForm.lastName) && consumerForm.reasonForRequest;
  const businessFormValid = (businessForm.registrationNumber || businessForm.tinNumber || businessForm.companyName) && businessForm.purpose;

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
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-search-type">
          <TabsTrigger value="consumer" data-testid="tab-consumer-search">
            <User className="w-4 h-4 mr-1.5" />
            Consumer
          </TabsTrigger>
          <TabsTrigger value="business" data-testid="tab-business-search">
            <Building2 className="w-4 h-4 mr-1.5" />
            Business
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ghanaCard" className="text-xs font-medium">
                      Ghana Card Number <span className="text-muted-foreground">(Primary Identifier)</span>
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
                    <Label htmlFor="firstName" className="text-xs font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      data-testid="input-consumer-firstname"
                      placeholder="First name"
                      value={consumerForm.firstName}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      data-testid="input-consumer-lastname"
                      placeholder="Last name"
                      value={consumerForm.lastName}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-medium">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      data-testid="input-consumer-dob"
                      value={consumerForm.dateOfBirth}
                      onChange={(e) => setConsumerForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Gender</Label>
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
                  <div className="space-y-1.5 sm:col-span-2">
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
              <p className="text-sm text-muted-foreground" data-testid="text-consumer-result-count">
                {consumerLoading ? "Searching..." : `${consumerResults?.length || 0} consumer(s) found`}
              </p>
              {consumerLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (consumerResults && consumerResults.length > 0) ? (
                <div className="space-y-3">
                  {consumerResults.map((borrower) => (
                    <BorrowerResultCard key={borrower.id} borrower={borrower} navigate={navigate} t={t} />
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
                  <div className="space-y-1.5">
                    <Label htmlFor="regNumber" className="text-xs font-medium">
                      Registration Number
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
                    <Label htmlFor="tin" className="text-xs font-medium">TIN</Label>
                    <Input
                      id="tin"
                      data-testid="input-business-tin"
                      placeholder="Tax Identification Number"
                      value={businessForm.tinNumber}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, tinNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="companyName" className="text-xs font-medium">Company Name</Label>
                    <Input
                      id="companyName"
                      data-testid="input-business-name"
                      placeholder="Registered company name"
                      value={businessForm.companyName}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
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
              <p className="text-sm text-muted-foreground" data-testid="text-business-result-count">
                {businessLoading ? "Searching..." : `${businessResults?.length || 0} business(es) found`}
              </p>
              {businessLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (businessResults && businessResults.length > 0) ? (
                <div className="space-y-3">
                  {businessResults.map((borrower) => (
                    <BorrowerResultCard key={borrower.id} borrower={borrower} navigate={navigate} t={t} />
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
                        <BorrowerResultCard key={borrower.id} borrower={borrower} navigate={navigate} t={t} />
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
                </div>
              ) : (
                <NoResults />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {searchTab !== "general" && !consumerSubmitted && !businessSubmitted && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('search.consentNote')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BorrowerResultCard({ borrower, navigate, t }: { borrower: Borrower; navigate: (path: string) => void; t: any }) {
  return (
    <Card
      className="cursor-pointer hover-elevate"
      onClick={() => navigate(`/borrowers/${borrower.id}`)}
      data-testid={`result-borrower-${borrower.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={(borrower as any).photoUrl || getBorrowerAvatarUrl(borrower.id, borrower.type === "corporate" ? (borrower.companyName || "") : `${borrower.firstName} ${borrower.lastName}`, borrower.type as "individual" | "corporate")}
              alt=""
              className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
              data-testid={`img-search-avatar-${borrower.id}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`}
              </p>
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
