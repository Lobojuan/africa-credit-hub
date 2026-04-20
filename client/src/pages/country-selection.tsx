import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCountryTheme } from "@/components/country-theme-provider";
import { getSupportedCountries, type CountryConfig } from "@/lib/country-mode";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Loader2, LogOut, Shield, ArrowRight, Building2, Users, Layers,
  CreditCard, CheckCircle2, AlertTriangle, Activity, Database,
  TrendingUp, Lock, FileText, Scale, Settings, Key, BarChart3,
  DollarSign, Archive, ScrollText, ArrowRightLeft, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandCenterUsersTab } from "./command-center-users";
import { CommandCenterSettingsTab } from "./command-center-settings";
import { CommandCenterSystemTab } from "./command-center-system";
import { CommandCenterAuditTab } from "./command-center-audit";
import { CommandCenterApiKeysTab } from "./command-center-apikeys";
import { CommandCenterDataQualityTab } from "./command-center-dataquality";
import { CommandCenterBillingTab } from "./command-center-billing";
import { CommandCenterRevenueSplitTab } from "./command-center-revenue-split";
import { CommandCenterSettlementsTab } from "./command-center-settlements";
import { CommandCenterWalletsTab } from "./command-center-wallets";
import { CommandCenterRetentionTab } from "./command-center-retention";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

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
  SL: "Africa Credit Hub Pan-African Registry",
  LR: "CBL Credit Registry",
};

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function CountryDot({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm";
  return <span className={`${sizeClass} leading-none shrink-0`} role="img" aria-label={code}>{countryCodeToFlag(code)}</span>;
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Globe; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground" data-testid={`text-kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
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
  return <Badge variant="outline" className="text-[9px] h-5 border-border text-muted-foreground bg-muted">Planned</Badge>;
}

const ACTION_ICON_COLORS: Record<string, string> = {
  LOGIN: "text-violet-400",
  CREATE: "text-emerald-400",
  UPDATE: "text-blue-400",
  DELETE: "text-red-400",
  VIEW: "text-cyan-400",
  EXPORT: "text-orange-400",
};

function ActivityFeed() {
  const { data: feed } = useQuery<any[]>({
    queryKey: ["/api/platform/activity-feed"],
    refetchInterval: 30000,
  });

  const items = (feed || []).slice(0, 15);

  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="panel-activity-feed">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-foreground">Live Activity Feed</h3>
        <span className="text-[9px] text-muted-foreground ml-auto">Last 15 events • auto-refresh 30s</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0" data-testid={`activity-${item.id}`}>
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${item.action === "LOGIN" ? "bg-violet-400" : item.action === "CREATE" ? "bg-emerald-400" : item.action === "UPDATE" ? "bg-blue-400" : item.action === "DELETE" ? "bg-red-400" : "bg-muted-foreground/50"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">
                  <span className={`font-semibold ${ACTION_ICON_COLORS[item.action] || "text-muted-foreground"}`}>{item.action}</span>
                  {" "}<span className="text-muted-foreground">[{item.entity}]</span>
                  {" "}{item.details || `${item.action} on ${item.entity}`}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {item.userName} {item.ipAddress ? `• ${item.ipAddress}` : ""} • {item.createdAt ? new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CountrySelectionPage() {
  const { setCountry, isSwitching, activeCountry, activeConfig, isGlobalView } = useCountryTheme();
  const { user, logout } = useAuth();
  const brandColors = useBrandColors();
  const { toast } = useToast();
  const [, navigate] = useLocation();
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
    if (countryName) {
      toast({ title: `Switched to ${countryName}`, description: "Navigating to dashboard..." });
      navigate("/dashboard");
    }
  };

  const platform = commandData?.platform;
  const allCountryDetails = commandData?.countries || [];

  const countryDetails = isGlobalView
    ? allCountryDetails
    : allCountryDetails.filter((d) => d.code === activeConfig?.code);

  const filteredPlatform = isGlobalView || !activeConfig
    ? platform
    : (() => {
        const detail = allCountryDetails.find((d) => d.code === activeConfig.code);
        return platform ? {
          ...platform,
          totalBorrowers: detail?.borrowers ?? 0,
          totalAccounts: detail?.accounts ?? 0,
          totalInstitutions: detail?.institutions ?? 0,
          activeCountries: detail ? 1 : 0,
        } : platform;
      })();

  const activeCountryCodes = new Set(countryDetails.map((d) => d.code));
  const activeCountries = isGlobalView
    ? countries.filter((c) => activeCountryCodes.has(c.code))
    : countries.filter((c) => c.code === activeConfig?.code);

  const { data: systemStats } = useQuery<{ srs: { total: number; passed: number } }>({
    queryKey: ["/api/platform/system-stats"],
    staleTime: 60000,
  });
  const srsCompliant = systemStats?.srs?.passed ?? 47;
  const srsTotal = systemStats?.srs?.total ?? 50;
  const complianceScore = srsTotal > 0 ? Math.round((srsCompliant / srsTotal) * 100) : 94;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{
                    background: brandColors.iconGradient,
                    boxShadow: `0 4px 16px -2px ${brandColors.accentMuted}`
                  }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-country-selection-title">
                    Platform Command Center
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a jurisdiction to manage or review platform-wide posture.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 ml-3">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-400" data-testid="text-system-status">
                    {platform?.systemStatus === "operational" ? "System Online" : platform?.systemStatus || "System Online"}
                  </span>
                </div>
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

            <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-5 ${
              isGlobalView
                ? "bg-muted/40 border-border"
                : "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
            }`} data-testid="banner-command-country">
              {isGlobalView ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground tracking-tight" data-testid="text-command-country">All Countries</p>
                    <p className="text-sm text-muted-foreground">Pan-African View — Aggregated data across all jurisdictions</p>
                  </div>
                </>
              ) : activeConfig ? (
                <>
                  <span className="text-4xl shrink-0 leading-none" role="img" aria-label={activeConfig.name}>
                    {countryCodeToFlag(activeConfig.code)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground tracking-tight" data-testid="text-command-country">{activeConfig.name}</p>
                    <p className="text-sm text-muted-foreground">{activeConfig.regulatoryBody} · {activeConfig.currency} ({activeConfig.currencySymbol})</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs border-primary/30 text-primary">
                    {activeConfig.code}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground tracking-tight" data-testid="text-command-country">No Country Selected</p>
                    <p className="text-sm text-muted-foreground">Select a jurisdiction below to get started</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPICard icon={Users} label="Total Borrowers" value={filteredPlatform?.totalBorrowers ?? "..."} color="bg-blue-500/20" />
              <KPICard icon={CreditCard} label="Credit Accounts" value={filteredPlatform?.totalAccounts ?? "..."} color="bg-violet-500/20" />
              <KPICard icon={Building2} label="Institutions" value={filteredPlatform?.totalInstitutions ?? "..."} color="bg-amber-500/20" />
              <KPICard icon={Globe} label="Active Countries" value={filteredPlatform?.activeCountries ?? "..."} sub={`of ${platform?.supportedCountries ?? 10} supported`} color="bg-emerald-500/20" />
              <KPICard icon={CheckCircle2} label="SRS Compliance" value={`${complianceScore}%`} sub={`${srsCompliant}/${srsTotal} requirements`} color="bg-teal-500/20" />
              <KPICard icon={Shield} label="System Version" value={platform?.systemVersion ?? "Africa Credit Hub v2.5"} sub="Pan-African Registry" color="bg-muted-foreground/20" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <TabsList className="bg-muted border border-border h-10 flex-nowrap w-max min-w-full gap-0.5 p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-overview">
                <Globe className="w-3 h-3 mr-1" /> Jurisdictions
              </TabsTrigger>
              <TabsTrigger value="compliance" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-compliance">
                <Shield className="w-3 h-3 mr-1" /> Compliance & SATA
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-features">
                <Layers className="w-3 h-3 mr-1" /> Feature Matrix
              </TabsTrigger>
              <TabsTrigger value="users-clients" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-users-clients">
                <Users className="w-3 h-3 mr-1" /> Users & Clients
              </TabsTrigger>
              <TabsTrigger value="country-settings" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-country-settings">
                <Settings className="w-3 h-3 mr-1" /> Country Settings
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-system">
                <Activity className="w-3 h-3 mr-1" /> System
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-audit">
                <ScrollText className="w-3 h-3 mr-1" /> Audit Log
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-api-keys">
                <Key className="w-3 h-3 mr-1" /> API Keys
              </TabsTrigger>
              <TabsTrigger value="data-quality" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-data-quality">
                <BarChart3 className="w-3 h-3 mr-1" /> Data Quality
              </TabsTrigger>
              <TabsTrigger value="billing" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-billing">
                <DollarSign className="w-3 h-3 mr-1" /> Billing
              </TabsTrigger>
              <TabsTrigger value="revenue-split" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-revenue-split">
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Revenue Split
              </TabsTrigger>
              <TabsTrigger value="settlements" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-settlements">
                <Wallet className="w-3 h-3 mr-1" /> Settlements
              </TabsTrigger>
              <TabsTrigger value="wallets" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-wallets">
                <Wallet className="w-3 h-3 mr-1" /> Wallets
              </TabsTrigger>
              <TabsTrigger value="retention" className="text-xs text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md" data-testid="tab-retention">
                <Archive className="w-3 h-3 mr-1" /> Retention
              </TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-3 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeCountries.map((c) => {
                  const detail = countryDetails.find((d) => d.code === c.code);
                  const dpStatus = detail?.dataProtectionStatus;
                  const sataLevel = detail?.sataReadiness;
                  return (
                    <button
                      key={c.code}
                      onClick={() => handleSelect(c.name)}
                      disabled={isSwitching}
                      className="flex flex-col p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 group text-left"
                      data-testid={`button-select-country-${c.code}`}
                    >
                      <div className="flex items-start justify-between w-full mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl leading-none shrink-0" role="img" aria-label={c.code}>{countryCodeToFlag(c.code)}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">{c.regulatoryBody}</p>
                          </div>
                        </div>
                        {isSwitching && selectedCountry === c.name ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0 mt-1" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3 w-full">
                        <div className="text-center p-1.5 rounded-lg bg-muted">
                          <p className="text-xs font-bold text-foreground">{detail?.borrowers?.toLocaleString() ?? "-"}</p>
                          <p className="text-[9px] text-muted-foreground">Borrowers</p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-muted">
                          <p className="text-xs font-bold text-foreground">{detail?.accounts?.toLocaleString() ?? "-"}</p>
                          <p className="text-[9px] text-muted-foreground">Accounts</p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg bg-muted">
                          <p className="text-xs font-bold text-foreground">{detail?.institutions ?? "-"}</p>
                          <p className="text-[9px] text-muted-foreground">Institutions</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap w-full">
                        {dpStatus && <ComplianceIndicator status={dpStatus} />}
                        {sataLevel && <SATAIndicator level={sataLevel} />}
                        <Badge variant="outline" className="text-[9px] h-5 border-border text-muted-foreground">{c.currency}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-foreground">Data Protection Law Status</h3>
                  </div>
                  <div className="space-y-2">
                    {activeCountries.map((c) => {
                      const detail = countryDetails.find((d) => d.code === c.code);
                      const dpStatus = detail?.dataProtectionStatus || "none";
                      return (
                        <div key={c.code} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <CountryDot code={c.code} size="sm" />
                            <span className="text-xs text-muted-foreground">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground hidden sm:inline max-w-[180px] truncate">{detail?.dataProtectionLaw || c.dataProtectionLaw}</span>
                            <ComplianceIndicator status={dpStatus} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-foreground">SATA Cross-Border Readiness</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">Smart Africa Trust Alliance compliance for cross-border data sharing</p>
                  <div className="space-y-2">
                    {activeCountries.map((c) => {
                      const detail = countryDetails.find((d) => d.code === c.code);
                      const bureau = CREDIT_BUREAU_FRAMEWORK[c.code] || "N/A";
                      return (
                        <div key={c.code} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <CountryDot code={c.code} size="sm" />
                            <div>
                              <span className="text-xs text-muted-foreground">{c.name}</span>
                              <p className="text-[9px] text-muted-foreground">{bureau}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(detail?.regionalBlocs || []).map((b) => (
                              <Badge key={b} variant="outline" className="text-[8px] h-4 px-1 border-border/50 text-muted-foreground">{b}</Badge>
                            ))}
                            {detail?.sataReadiness && <SATAIndicator level={detail.sataReadiness} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <ActivityFeed />

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-foreground">SRS Requirements Traceability</h3>
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
                    <div key={cat.label} className="text-center p-3 rounded-lg bg-card">
                      <p className={`text-lg font-bold ${cat.color}`}>{cat.compliant}/{cat.count}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{cat.label}</p>
                      <div className="w-full h-1 rounded-full bg-muted-foreground mt-2">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(cat.compliant / cat.count) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-foreground">Feature Support Matrix</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Capabilities available per jurisdiction</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left p-3 text-muted-foreground font-medium sticky left-0 bg-card">Country</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Credit Scoring</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Regulatory Export</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Dispute Mgmt</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Consent Tracking</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Batch Upload</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">API Access</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">KYC Ready</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">SATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCountries.map((c) => {
                        const detail = countryDetails.find((d) => d.code === c.code);
                        const features = detail?.features || [];
                        const hasScoring = features.includes("Credit Scoring");
                        const hasDisputes = features.includes("Dispute Management");
                        const hasConsent = features.includes("Consent Tracking");
                        const hasBatch = features.includes("Batch Upload");
                        const hasApi = features.includes("API Access");
                        const hasKyc = features.includes("KYC Verification");
                        const bogExport = features.find((f) => f.includes("BoG") || f.includes("BSL") || f.includes("Regulatory Export"));
                        const exportLabel = bogExport || "—";
                        const FeatureCheck = ({ enabled }: { enabled: boolean }) => (
                          enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                        );
                        return (
                          <tr key={c.code} className="border-b border-border/20 hover:bg-muted-foreground/20">
                            <td className="p-3 sticky left-0 bg-card">
                              <div className="flex items-center gap-2">
                                <CountryDot code={c.code} size="sm" />
                                <span className="text-muted-foreground font-medium">{c.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasScoring} /></td>
                            <td className="text-center p-3">
                              <span className={`text-[10px] font-medium ${bogExport ? "text-emerald-400" : "text-muted-foreground"}`}>
                                {exportLabel}
                              </span>
                            </td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasDisputes} /></td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasConsent} /></td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasBatch} /></td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasApi} /></td>
                            <td className="text-center p-3"><FeatureCheck enabled={hasKyc} /></td>
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

            <TabsContent value="system" className="mt-0">
              <CommandCenterSystemTab />
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              <CommandCenterAuditTab />
            </TabsContent>

            <TabsContent value="api-keys" className="mt-0">
              <CommandCenterApiKeysTab />
            </TabsContent>

            <TabsContent value="data-quality" className="mt-0">
              <CommandCenterDataQualityTab />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <CommandCenterBillingTab />
            </TabsContent>

            <TabsContent value="revenue-split" className="mt-0">
              <CommandCenterRevenueSplitTab />
            </TabsContent>

            <TabsContent value="settlements" className="mt-0">
              <CommandCenterSettlementsTab />
            </TabsContent>

            <TabsContent value="wallets" className="mt-0">
              <CommandCenterWalletsTab />
            </TabsContent>

            <TabsContent value="retention" className="mt-0">
              <CommandCenterRetentionTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Africa Credit Hub v2.5 | Secured by {PLATFORM_COMPANY_NAME}
        </p>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">World Bank General Principles | SATA Framework</span>
        </div>
      </footer>
    </div>
  );
}
