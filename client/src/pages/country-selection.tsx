import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCountryTheme } from "@/components/country-theme-provider";
import { getSupportedCountries, type CountryConfig } from "@/lib/country-mode";
import {
  Globe, Loader2, LogOut, Shield, ArrowRight, Building2, Users,
  CreditCard, CheckCircle2, AlertTriangle, Activity, Database,
  TrendingUp, Lock, FileText, Scale, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandCenterUsersTab } from "./command-center-users";
import { CommandCenterSettingsTab } from "./command-center-settings";

interface PlatformStats {
  totalBorrowers: number;
  totalAccounts: number;
  totalInstitutions: number;
  activeCountries: number;
  supportedCountries: number;
  systemVersion: string;
  systemStatus: string;
}

interface CountryDetail {
  name: string;
  code: string;
  currency: string;
  regulatoryBody: string;
  dataProtectionLaw: string;
  dataProtectionStatus: "enacted" | "draft" | "none";
  sataReadiness: "ready" | "partial" | "planned";
  regionalBlocs: string[];
  institutions: number;
  activeInstitutions: number;
  borrowers: number;
  accounts: number;
  hasData: boolean;
  features: string[];
}

interface CommandCenterData {
  platform: PlatformStats;
  countries: CountryDetail[];
}

const CREDIT_BUREAU_FRAMEWORK: Record<string, string> = {
  GH: "XDS Data, Dun & Bradstreet, Hudson Price",
  NG: "CRC, FirstCentral, CreditRegistry",
  KE: "Metropol, TransUnion, Creditinfo",
  RW: "CRB Africa (TransUnion)",
  TZ: "Creditinfo Tanzania",
  UG: "Compuscan, Metropol Uganda",
  ZA: "TransUnion, Experian, Compuscan, XDS",
  ET: "NBE Credit Reference Bureau",
  SL: "CDH Pan-African Registry",
  LR: "CBL Credit Registry",
};

function CountryDot({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  const colors: Record<string, string> = {
    GH: "bg-emerald-500", LR: "bg-red-500", SL: "bg-green-500", NG: "bg-green-600",
    KE: "bg-red-600", RW: "bg-blue-500", TZ: "bg-blue-600", UG: "bg-yellow-500",
    ET: "bg-green-700", ZA: "bg-blue-700",
  };
  const sizeClass = size === "lg" ? "w-4 h-4" : size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";
  return <div className={`${sizeClass} rounded-full ${colors[code] || "bg-gray-400"} shrink-0`} />;
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Globe; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white" data-testid={`text-kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ComplianceIndicator({ status }: { status: "enacted" | "draft" | "none" }) {
  if (status === "enacted") return <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Enacted</Badge>;
  if (status === "draft") return <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-400 bg-amber-500/10">Draft</Badge>;
  return <Badge variant="outline" className="text-[9px] h-5 border-red-500/30 text-red-400 bg-red-500/10">None</Badge>;
}

function SATAIndicator({ level }: { level: "ready" | "partial" | "planned" }) {
  if (level === "ready") return <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">SATA Ready</Badge>;
  if (level === "partial") return <Badge variant="outline" className="text-[9px] h-5 border-amber-500/30 text-amber-400 bg-amber-500/10">Partial</Badge>;
  return <Badge variant="outline" className="text-[9px] h-5 border-slate-500/30 text-slate-400 bg-slate-500/10">Planned</Badge>;
}

export default function CountrySelectionPage() {
  const { setCountry, isSwitching } = useCountryTheme();
  const { user, logout } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const countries = getSupportedCountries();

  const { data: commandData, isLoading: isLoadingStats } = useQuery<CommandCenterData>({
    queryKey: ["/api/platform/command-center"],
    staleTime: 30000,
  });

  const handleSelect = async (countryName: string | null) => {
    setSelectedCountry(countryName);
    await setCountry(countryName);
  };

  const platform = commandData?.platform;
  const countryDetails = commandData?.countries || [];

  const srsCompliant = 47;
  const srsTotal = 50;
  const complianceScore = Math.round((srsCompliant / srsTotal) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(42 85% 55%) 0%, hsl(32 78% 46%) 100%)",
              boxShadow: "0 4px 16px -2px hsl(42 85% 53% / 0.4)"
            }}
          >
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Platform Command Center</p>
            <p className="text-[10px] text-slate-400">Carlson Capital & Systems In Motion Limited</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400" data-testid="text-system-status">
              {platform?.systemStatus === "operational" ? "System Online" : platform?.systemStatus || "System Online"}
            </span>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-8 gap-1.5"
            onClick={() => logout()}
            data-testid="button-logout-country-selection"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Platform Administrator</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white" data-testid="text-country-selection-title">
                  Welcome back, {user?.fullName}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Review your platform posture, then select a jurisdiction to manage.
                </p>
              </div>
              <button
                onClick={() => handleSelect(null)}
                disabled={isSwitching}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 group shrink-0"
                data-testid="button-select-global-view"
              >
                {isSwitching && selectedCountry === null ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-sm font-semibold text-blue-300">Enter Global View</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPICard icon={Users} label="Total Borrowers" value={platform?.totalBorrowers ?? "..."} color="bg-blue-500/20" />
              <KPICard icon={CreditCard} label="Credit Accounts" value={platform?.totalAccounts ?? "..."} color="bg-violet-500/20" />
              <KPICard icon={Building2} label="Institutions" value={platform?.totalInstitutions ?? "..."} color="bg-amber-500/20" />
              <KPICard icon={Globe} label="Active Countries" value={platform?.activeCountries ?? "..."} sub={`of ${platform?.supportedCountries ?? 10} supported`} color="bg-emerald-500/20" />
              <KPICard icon={CheckCircle2} label="SRS Compliance" value={`${complianceScore}%`} sub={`${srsCompliant}/${srsTotal} requirements`} color="bg-teal-500/20" />
              <KPICard icon={Shield} label="System Version" value={platform?.systemVersion ?? "CDH v2.1"} sub="Pan-African Registry" color="bg-slate-500/20" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-800/50 border border-slate-700/50 h-9">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="tab-overview">
                Jurisdictions
              </TabsTrigger>
              <TabsTrigger value="compliance" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="tab-compliance">
                Compliance & SATA
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="tab-features">
                Feature Matrix
              </TabsTrigger>
              <TabsTrigger value="users-clients" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="tab-users-clients">
                <Users className="w-3 h-3 mr-1" /> Users & Clients
              </TabsTrigger>
              <TabsTrigger value="country-settings" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="tab-country-settings">
                <Settings className="w-3 h-3 mr-1" /> Country Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {countries.map((c) => {
                  const detail = countryDetails.find((d) => d.code === c.code);
                  const dpStatus = detail?.dataProtectionStatus;
                  const sataLevel = detail?.sataReadiness;
                  return (
                    <button
                      key={c.code}
                      onClick={() => handleSelect(c.name)}
                      disabled={isSwitching}
                      className="flex flex-col p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 group text-left"
                      data-testid={`button-select-country-${c.code}`}
                    >
                      <div className="flex items-start justify-between w-full mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${c.theme.logoGradientFrom}, ${c.theme.logoGradientTo})`,
                              boxShadow: `0 2px 8px ${c.theme.logoGlow}`
                            }}
                          >
                            <CountryDot code={c.code} size="lg" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.regulatoryBody}</p>
                          </div>
                        </div>
                        {isSwitching && selectedCountry === c.name ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0 mt-1" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3 w-full">
                        <div className="text-center p-1.5 rounded-lg bg-slate-900/50">
                          <p className="text-xs font-bold text-white">{detail?.borrowers?.toLocaleString() ?? "-"}</p>
                          <p className="text-[9px] text-slate-500">Borrowers</p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-slate-900/50">
                          <p className="text-xs font-bold text-white">{detail?.accounts?.toLocaleString() ?? "-"}</p>
                          <p className="text-[9px] text-slate-500">Accounts</p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-slate-900/50">
                          <p className="text-xs font-bold text-white">{detail?.institutions ?? "-"}</p>
                          <p className="text-[9px] text-slate-500">Institutions</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap w-full">
                        {dpStatus && <ComplianceIndicator status={dpStatus} />}
                        {sataLevel && <SATAIndicator level={sataLevel} />}
                        <Badge variant="outline" className="text-[9px] h-5 border-slate-600/50 text-slate-400">{c.currency}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Data Protection Law Status</h3>
                  </div>
                  <div className="space-y-2">
                    {countries.map((c) => {
                      const detail = countryDetails.find((d) => d.code === c.code);
                      const dpStatus = detail?.dataProtectionStatus || "none";
                      return (
                        <div key={c.code} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <CountryDot code={c.code} size="sm" />
                            <span className="text-xs text-slate-300">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 hidden sm:inline max-w-[180px] truncate">{detail?.dataProtectionLaw || c.dataProtectionLaw}</span>
                            <ComplianceIndicator status={dpStatus} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">SATA Cross-Border Readiness</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">Smart Africa Trust Alliance compliance for cross-border data sharing</p>
                  <div className="space-y-2">
                    {countries.map((c) => {
                      const detail = countryDetails.find((d) => d.code === c.code);
                      const bureau = CREDIT_BUREAU_FRAMEWORK[c.code] || "N/A";
                      return (
                        <div key={c.code} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <CountryDot code={c.code} size="sm" />
                            <div>
                              <span className="text-xs text-slate-300">{c.name}</span>
                              <p className="text-[9px] text-slate-500">{bureau}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(detail?.regionalBlocs || []).map((b) => (
                              <Badge key={b} variant="outline" className="text-[8px] h-4 px-1 border-slate-600/50 text-slate-500">{b}</Badge>
                            ))}
                            {detail?.sataReadiness && <SATAIndicator level={detail.sataReadiness} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">SRS Requirements Traceability</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { label: "Data Collection", count: 6, compliant: 6, color: "text-blue-400" },
                    { label: "Credit Reporting", count: 8, compliant: 8, color: "text-violet-400" },
                    { label: "Consent & Disputes", count: 9, compliant: 9, color: "text-emerald-400" },
                    { label: "Regulatory", count: 5, compliant: 5, color: "text-amber-400" },
                    { label: "Security", count: 10, compliant: 10, color: "text-red-400" },
                    { label: "Enterprise", count: 11, compliant: 11, color: "text-teal-400" },
                    { label: "Data Quality", count: 5, compliant: 5, color: "text-indigo-400" },
                  ].map((cat) => (
                    <div key={cat.label} className="text-center p-3 rounded-lg bg-slate-900/50">
                      <p className={`text-lg font-bold ${cat.color}`}>{cat.compliant}/{cat.count}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{cat.label}</p>
                      <div className="w-full h-1 rounded-full bg-slate-700 mt-2">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(cat.compliant / cat.count) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-white">Feature Support Matrix</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Capabilities available per jurisdiction</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/30">
                        <th className="text-left p-3 text-slate-400 font-medium sticky left-0 bg-slate-800/90">Country</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Credit Scoring</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Regulatory Export</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Dispute Mgmt</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Consent Tracking</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Batch Upload</th>
                        <th className="text-center p-3 text-slate-400 font-medium">API Access</th>
                        <th className="text-center p-3 text-slate-400 font-medium">KYC Ready</th>
                        <th className="text-center p-3 text-slate-400 font-medium">SATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((c) => {
                        const detail = countryDetails.find((d) => d.code === c.code);
                        const features = detail?.features || [];
                        const hasScoring = features.includes("Credit Scoring");
                        const hasDisputes = features.includes("Dispute Management");
                        const hasConsent = features.includes("Consent Tracking");
                        const bogExport = features.find((f) => f.includes("BoG") || f.includes("BSL"));
                        const exportLabel = bogExport || "Standard";
                        return (
                          <tr key={c.code} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                            <td className="p-3 sticky left-0 bg-slate-800/90">
                              <div className="flex items-center gap-2">
                                <CountryDot code={c.code} size="sm" />
                                <span className="text-slate-300 font-medium">{c.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-3">
                              {hasScoring ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                            </td>
                            <td className="text-center p-3">
                              <span className={`text-[10px] font-medium ${bogExport ? "text-emerald-400" : "text-slate-400"}`}>
                                {exportLabel}
                              </span>
                            </td>
                            <td className="text-center p-3">
                              {hasDisputes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                            </td>
                            <td className="text-center p-3">
                              {hasConsent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                            </td>
                            <td className="text-center p-3"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /></td>
                            <td className="text-center p-3"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /></td>
                            <td className="text-center p-3">
                              {detail?.dataProtectionStatus === "enacted" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                              )}
                            </td>
                            <td className="text-center p-3">
                              {detail?.sataReadiness && <SATAIndicator level={detail.sataReadiness} />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users-clients" className="mt-0">
              <CommandCenterUsersTab />
            </TabsContent>

            <TabsContent value="country-settings" className="mt-0">
              <CommandCenterSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-slate-800/50 flex items-center justify-between">
        <p className="text-[10px] text-slate-600">
          CDH v2.1 | Secured by Carlson Capital & Systems In Motion Limited
        </p>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] text-slate-600">World Bank General Principles | SATA Framework</span>
        </div>
      </footer>
    </div>
  );
}
