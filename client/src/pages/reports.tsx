import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  FileText, Download, Users, CreditCard, TrendingUp, AlertTriangle,
  Search, Globe, DollarSign, ArrowRight, Shield, ChevronDown, Loader2,
  MapPin, Building2, FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { getDefaultFallbackCurrency } from "@/lib/country-mode";
import { apiRequest } from "@/lib/queryClient";
import type { Borrower, CreditAccount } from "@shared/schema";

function BorrowerSearchSelect({ onSelect }: { onSelect: (b: Borrower) => void }) {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleInputChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
    }, 300);
  }, []);

  const searchParams = new URLSearchParams();
  if (debouncedQuery) searchParams.set("search", debouncedQuery);
  if (countryFilter) searchParams.set("country", countryFilter);
  const searchUrl = (debouncedQuery || countryFilter) ? `/api/borrowers?${searchParams.toString()}` : null;

  const { data: results, isLoading } = useQuery<Borrower[] | { data: Borrower[] }>({
    queryKey: ["/api/borrowers", debouncedQuery, countryFilter],
    enabled: !!(debouncedQuery.length >= 2 || countryFilter),
  });

  const borrowers: Borrower[] = Array.isArray(results) ? results : (results as any)?.data || [];

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, national ID, TIN, or passport..."
            value={query}
            onChange={(e) => { handleInputChange(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
            data-testid="input-borrower-search"
          />
        </div>
        <div className="w-48">
          <Select value={countryFilter} onValueChange={(val) => { setCountryFilter(val === "all" ? "" : val); setIsOpen(true); }}>
            <SelectTrigger data-testid="select-country-filter">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {SUPPORTED_COUNTRIES.map(c => (
                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isOpen && (debouncedQuery.length >= 2 || countryFilter) && (
        <div className="border rounded-xl overflow-hidden bg-card shadow-lg max-h-[280px] overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /><p className="text-xs text-muted-foreground mt-2">Searching...</p></div>
          ) : borrowers.length > 0 ? (
            <div className="divide-y">
              {borrowers.slice(0, 20).map(b => (
                <button
                  key={b.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => { onSelect(b); setIsOpen(false); setQuery(b.type === "corporate" ? b.companyName || "" : `${b.firstName} ${b.lastName}`); }}
                  data-testid={`result-borrower-${b.id}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {b.type === "corporate" ? <Building2 className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {b.type === "corporate" ? "Corporate" : "Individual"} · {b.nationalId || b.tinNumber || b.passportNumber || "No ID"} · {b.country}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] shrink-0">{b.status}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Users className="w-6 h-6 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">No borrowers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [purpose, setPurpose] = useState("new_credit");
  const [reportCurrency, setReportCurrency] = useState("USD");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalBorrowers: number;
    totalAccounts: number;
    totalInquiries: number;
    totalOutstanding: string;
    delinquentAccounts: number;
    defaultAccounts: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: accounts, isLoading: accountsLoading } = useQuery<CreditAccount[]>({
    queryKey: ["/api/credit-accounts"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/credit-reports/generate", {
        borrowerId: selectedBorrower!.id,
        purpose,
        reportCurrency,
      });
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/credit-report/${selectedBorrower!.id}?serial=${data.serialNumber}`);
    },
  });

  const handleGenerate = () => {
    if (!selectedBorrower) return;
    generateMutation.mutate();
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!selectedBorrower) return;
    setIsDownloading(true);
    try {
      const genRes = await apiRequest("POST", "/api/credit-reports/generate", {
        borrowerId: selectedBorrower.id,
        purpose,
        reportCurrency,
      });
      const reportData = await genRes.json();
      const pdfRes = await apiRequest("POST", "/api/credit-reports/download-pdf", { reportData });
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Credit_Report_${reportData.serialNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const lenderBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number; delinquent: number; currencies: Record<string, number> }>>((acc, a) => {
    if (!acc[a.lenderInstitution]) acc[a.lenderInstitution] = { count: 0, total: 0, delinquent: 0, currencies: {} };
    acc[a.lenderInstitution].count++;
    const balance = parseFloat(a.currentBalance || "0");
    acc[a.lenderInstitution].total += balance;
    const cur = a.currency || getDefaultFallbackCurrency();
    acc[a.lenderInstitution].currencies[cur] = (acc[a.lenderInstitution].currencies[cur] || 0) + balance;
    if (a.status === "delinquent" || a.status === "default") acc[a.lenderInstitution].delinquent++;
    return acc;
  }, {}) : {};

  const typeBreakdown = accounts ? accounts.reduce<Record<string, { count: number; total: number; currencies: Record<string, number> }>>((acc, a) => {
    if (!acc[a.accountType]) acc[a.accountType] = { count: 0, total: 0, currencies: {} };
    acc[a.accountType].count++;
    const balance = parseFloat(a.currentBalance || "0");
    acc[a.accountType].total += balance;
    const cur = a.currency || getDefaultFallbackCurrency();
    acc[a.accountType].currencies[cur] = (acc[a.accountType].currencies[cur] || 0) + balance;
    return acc;
  }, {}) : {};

  const renderCurrencyBreakdown = (currencies: Record<string, number>) => {
    const entries = Object.entries(currencies).sort((a, b) => b[1] - a[1]);
    if (entries.length === 1) {
      return <p className="text-sm font-medium">{formatCurrency(entries[0][1], entries[0][0], { compact: true })}</p>;
    }
    return (
      <div className="text-right">
        {entries.map(([cur, val]) => (
          <p key={cur} className="text-sm font-medium">{formatCurrency(val, cur, { compact: true })}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-reports-title">{t('reports.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-portfolio-csv" onClick={() => window.open("/api/reports/export?format=csv&type=portfolio", "_blank")}>
            <Download className="w-4 h-4 mr-2" />{t('reports.exportPortfolio')} (CSV)
          </Button>
          <Button variant="outline" size="sm" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400" data-testid="button-export-portfolio-xlsx" onClick={() => window.open("/api/reports/export?format=xlsx&type=portfolio", "_blank")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />{t('reports.exportPortfolio')} (Excel)
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export-borrowers-csv" onClick={() => window.open("/api/reports/export?format=csv&type=borrowers", "_blank")}>
            <Download className="w-4 h-4 mr-2" />{t('reports.exportBorrowers')} (CSV)
          </Button>
          <Button variant="outline" size="sm" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400" data-testid="button-export-borrowers-xlsx" onClick={() => window.open("/api/reports/export?format=xlsx&type=borrowers", "_blank")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />{t('reports.exportBorrowers')} (Excel)
          </Button>
        </div>
      </div>

      <Card className="border-2 border-primary/20 overflow-hidden" data-testid="card-generate-report">
        <div className="p-5 sm:p-6" style={{ background: "linear-gradient(135deg, hsl(175 55% 28%) 0%, hsl(175 45% 22%) 100%)" }}>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate Credit Report</h2>
              <p className="text-sm text-white/60">Search for a borrower and generate a comprehensive D&B-style credit report</p>
            </div>
          </div>
        </div>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">1. Find Borrower</label>
            <BorrowerSearchSelect onSelect={(b) => setSelectedBorrower(b)} />
          </div>

          {selectedBorrower && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {selectedBorrower.type === "corporate"
                    ? <Building2 className="w-6 h-6 text-primary" />
                    : <Users className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate" data-testid="text-selected-borrower">
                    {selectedBorrower.type === "corporate" ? selectedBorrower.companyName : `${selectedBorrower.firstName} ${selectedBorrower.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBorrower.type === "corporate" ? "Corporate" : "Individual"} ·{" "}
                    {selectedBorrower.nationalId || selectedBorrower.tinNumber || "—"} ·{" "}
                    {selectedBorrower.country}
                  </p>
                </div>
                <Badge variant={selectedBorrower.status === "active" ? "default" : "secondary"} className="shrink-0">
                  {selectedBorrower.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">2. Purpose of Report</label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger data-testid="select-report-purpose">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_credit">New Credit Application</SelectItem>
                      <SelectItem value="review">Periodic Review</SelectItem>
                      <SelectItem value="collection">Collection</SelectItem>
                      <SelectItem value="regulatory">Regulatory Inquiry</SelectItem>
                      <SelectItem value="portfolio_monitoring">Portfolio Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">3. Report Currency</label>
                  <Select value={reportCurrency} onValueChange={setReportCurrency}>
                    <SelectTrigger data-testid="select-report-currency">
                      <DollarSign className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">4. Borrower Country</label>
                  <div className="h-10 px-3 border rounded-md flex items-center bg-muted/30">
                    <Globe className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-borrower-country">{selectedBorrower.country || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground max-w-lg">
                  <Shield className="w-4 h-4 inline-block mr-1 -mt-0.5 text-primary" />
                  This report will be logged in the audit trail. A unique serial number will be assigned.
                  Consent verification will be checked before generation.
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading || generateMutation.isPending}
                    data-testid="button-download-pdf"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    {isDownloading ? "Generating PDF..." : "Download PDF"}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="shadow-md"
                    style={{ background: "linear-gradient(135deg, hsl(175 55% 35%), hsl(175 45% 28%))" }}
                    data-testid="button-generate-report"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" />Generate & View Report</>
                    )}
                  </Button>
                </div>
              </div>

              {generateMutation.isError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                  Failed to generate report. Please check borrower data and try again.
                </div>
              )}
            </div>
          )}

          {!selectedBorrower && (
            <div className="text-center py-6">
              <Search className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Search for a borrower above to generate a credit report</p>
              <p className="text-xs text-muted-foreground/60 mt-1">You can search by name, national ID, TIN, passport number, or company name</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reports.registeredBorrowers')}</p>
                    <p className="text-xl font-bold">{stats.totalBorrowers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reports.totalExposure')}</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totalOutstanding, getDefaultFallbackCurrency(), { compact: true })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reports.nonPerforming')}</p>
                    <p className="text-xl font-bold">{stats.delinquentAccounts + stats.defaultAccounts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reports.nplRatio')}</p>
                    <p className="text-xl font-bold">
                      {stats.totalAccounts > 0
                        ? (((stats.delinquentAccounts + stats.defaultAccounts) / stats.totalAccounts) * 100).toFixed(1)
                        : "0"}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <Card data-testid="card-export-audit-trail">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Export Audit Trail</h3>
          <p className="text-xs text-muted-foreground">Download a full audit trail of all system activities</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" data-testid="button-export-audit-csv" onClick={() => window.open("/api/reports/export?format=csv&type=audit", "_blank")}>
              <Download className="w-4 h-4 mr-2" />Export Audit Trail (CSV)
            </Button>
            <Button variant="outline" size="sm" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400" data-testid="button-export-audit-xlsx" onClick={() => window.open("/api/reports/export?format=xlsx&type=audit", "_blank")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Export Audit Trail (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{t('reports.portfolioByInstitution')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.exposureByLender')}</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : Object.keys(lenderBreakdown).length > 0 ? (
              <div className="divide-y">
                {Object.entries(lenderBreakdown).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{data.count} {t('reports.accountsCount')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {renderCurrencyBreakdown(data.currencies)}
                        {data.delinquent > 0 && (
                          <p className="text-[10px] text-destructive">{data.delinquent} {t('reports.nonPerformingCount')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t('reports.noData')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{t('reports.portfolioByLoanType')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.exposureByProduct')}</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {accountsLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : Object.keys(typeBreakdown).length > 0 ? (
              <div className="divide-y">
                {Object.entries(typeBreakdown).sort((a, b) => b[1].total - a[1].total).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{type}</p>
                      <p className="text-xs text-muted-foreground">{data.count} {t('reports.accountsCount')}</p>
                    </div>
                    <div className="shrink-0">
                      {renderCurrencyBreakdown(data.currencies)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t('reports.noData')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
