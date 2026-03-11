import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Search,
  FileText,
  Shield,
  Settings,
  CheckSquare,
  AlertCircle,
  Upload,
  Building2,
  FileCheck,
  Receipt,
  Headset,
  Globe,
  Key,
  HelpCircle,
  BookOpen,
  DollarSign,
  Plug,
  Archive,
  Scale,
  ChevronDown,
  History,
  Play,
  FileSpreadsheet,
  Info,
  Brain,
  BarChart3,
  Bell,
  Eye,
  Handshake,
  FileSearch,
  ArrowRightLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import type { LucideIcon } from "lucide-react";
import { isGhanaMode, isSierraLeoneMode, isSingleCountryMode, getBrandTitle, getCountryConfig } from "@/lib/country-mode";
import { useCountryTheme } from "@/components/country-theme-provider";

type NavItem = {
  titleKey: string;
  url: string;
  icon: LucideIcon;
  testId: string;
  roles?: string[];
};

const coreItems: NavItem[] = [
  { titleKey: "sidebar.dashboard", url: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
  { titleKey: "sidebar.borrowers", url: "/borrowers", icon: Users, testId: "nav-borrowers" },
  { titleKey: "sidebar.creditAccounts", url: "/credit-accounts", icon: CreditCard, testId: "nav-credit-accounts" },
  { titleKey: "sidebar.creditSearch", url: "/search", icon: Search, testId: "nav-credit-search" },
];

const operationsItems: NavItem[] = [
  { titleKey: "sidebar.creditReports", url: "/reports", icon: FileText, testId: "nav-credit-reports" },
  { titleKey: "sidebar.batchUpload", url: "/batch-upload", icon: Upload, testId: "nav-batch-upload", roles: ["admin", "lender", "super_admin"] },
  { titleKey: "sidebar.disputes", url: "/disputes", icon: AlertCircle, testId: "nav-disputes" },
  { titleKey: "sidebar.pendingApprovals", url: "/approvals", icon: CheckSquare, testId: "nav-pending-approvals", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.consentManagement", url: "/consent", icon: FileCheck, testId: "nav-consent" },
  { titleKey: "sidebar.helpdesk", url: "/helpdesk", icon: Headset, testId: "nav-helpdesk" },
];

const baseOversightItems: NavItem[] = [
  { titleKey: "sidebar.portfolioIntelligence", url: "/portfolio-intelligence", icon: Brain, testId: "nav-portfolio-intelligence", roles: ["admin", "super_admin", "regulator"] },
  { titleKey: "sidebar.regulatoryDashboard", url: "/regulatory-dashboard", icon: BarChart3, testId: "nav-regulatory-dashboard", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.auditTrail", url: "/audit", icon: Shield, testId: "nav-audit-trail", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.borrowerAlerts", url: "/borrower-alerts", icon: Bell, testId: "nav-borrower-alerts", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.regulatoryCompliance", url: "/regulatory-compliance", icon: Scale, testId: "nav-regulatory-compliance", roles: ["admin", "regulator", "super_admin"] },
];

function getOversightItems(activeCountryName?: string): NavItem[] {
  const items = [...baseOversightItems];
  const country = activeCountryName?.toLowerCase().replace(/[\s_-]/g, "") || "";
  if (country === "sierraleone" || isSierraLeoneMode()) {
    items.push({ titleKey: "sidebar.bslExport", url: "/bsl-export", icon: FileSpreadsheet, testId: "nav-bsl-export", roles: ["admin", "regulator", "super_admin"] });
  } else {
    items.push({ titleKey: "sidebar.bogExport", url: "/bog-export", icon: FileSpreadsheet, testId: "nav-bog-export", roles: ["admin", "regulator", "super_admin"] });
  }
  return items;
}

const crossBorderItems: NavItem[] = [
  { titleKey: "sidebar.crossBorderAgreements", url: "/cross-border-agreements", icon: Handshake, testId: "nav-cross-border-agreements", roles: ["admin", "super_admin", "regulator"] },
  { titleKey: "sidebar.crossBorderSearch", url: "/cross-border-search", icon: FileSearch, testId: "nav-cross-border-search", roles: ["admin", "super_admin", "regulator", "lender"] },
  { titleKey: "sidebar.papssSettlements", url: "/papss-settlements", icon: ArrowRightLeft, testId: "nav-papss-settlements", roles: ["admin", "super_admin", "regulator"] },
];

const adminItems: NavItem[] = [
  { titleKey: "sidebar.organizations", url: "/organizations", icon: Building2, testId: "nav-organizations", roles: ["super_admin"] },
  { titleKey: "sidebar.userManagement", url: "/users", icon: Settings, testId: "nav-user-management", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.institutions", url: "/institutions", icon: Building2, testId: "nav-institutions", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.billing", url: "/billing", icon: Receipt, testId: "nav-billing", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.retentionPolicies", url: "/retention-policies", icon: Archive, testId: "nav-retention-policies", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.exchangeRates", url: "/exchange-rates", icon: DollarSign, testId: "nav-exchange-rates", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.apiAdmin", url: "/api-admin", icon: Plug, testId: "nav-api-admin", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.apiKeys", url: "/api-keys", icon: Key, testId: "nav-api-keys", roles: ["admin", "super_admin"] },
];

const resourceItems: NavItem[] = [
  { titleKey: "sidebar.creditScoreMethodology", url: "/credit-score-methodology", icon: Brain, testId: "nav-credit-score-methodology" },
  { titleKey: "sidebar.appGuide", url: "/guide", icon: Play, testId: "nav-app-guide" },
  { titleKey: "sidebar.help", url: "/help", icon: HelpCircle, testId: "nav-help" },
  ...(isGhanaMode() ? [
    { titleKey: "sidebar.ghanaDocs", url: "/ghana-docs", icon: BookOpen, testId: "nav-ghana-docs" } as NavItem,
    { titleKey: "sidebar.documentation", url: "/documentation", icon: FileText, testId: "nav-documentation" } as NavItem,
  ] : [
    { titleKey: "sidebar.documentation", url: "/documentation", icon: BookOpen, testId: "nav-documentation" } as NavItem,
  ]),
  { titleKey: "sidebar.versionHistory", url: "/version-history", icon: History, testId: "nav-version-history" },
  { titleKey: "sidebar.about", url: "/about", icon: Info, testId: "nav-about" },
];

function filterByRole(items: NavItem[], role: string | undefined): NavItem[] {
  if (!role) return items.filter(item => !item.roles);
  return items.filter(item => !item.roles || item.roles.includes(role));
}

function CollapsibleSection({
  label,
  items,
  location,
  defaultOpen,
  t,
  icon: Icon,
}: {
  label: string;
  items: NavItem[];
  location: string;
  defaultOpen: boolean;
  t: (key: string) => string;
  icon?: LucideIcon;
}) {
  const hasActive = items.some(item => location === item.url);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 cursor-pointer hover:text-sidebar-foreground/60 transition-colors flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              {!open && hasActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
              )}
              <span className="text-[9px] font-medium text-sidebar-foreground/30">{items.length}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const isRtl = i18n.language === "ar";
  const countryTheme = useCountryTheme();

  const dynamicCountryConfig = countryTheme?.activeConfig;
  const dynamicBrandTitle = dynamicCountryConfig?.brandTitle || (isGhanaMode() ? getBrandTitle() : t('sidebar.brandTitle'));
  const dynamicTheme = countryTheme?.activeTheme;

  const visibleCore = filterByRole(coreItems, role);
  const visibleOperations = filterByRole(operationsItems, role);
  const oversightItems = getOversightItems(dynamicCountryConfig?.name);
  const visibleOversight = filterByRole(oversightItems, role);
  const visibleCrossBorder = filterByRole(crossBorderItems, role);
  const visibleAdmin = filterByRole(adminItems, role);
  const visibleResources = filterByRole(resourceItems, role);
  const isSuperAdmin = role === "super_admin";
  const orgName = (user as any)?.organization?.name;

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="p-4 pb-5">
        <Link href="/">
          <div className="flex items-center gap-3.5 cursor-pointer group">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `linear-gradient(135deg, ${dynamicTheme?.logoGradientFrom || "hsl(42 85% 55%)"} 0%, ${dynamicTheme?.logoGradientTo || "hsl(32 78% 46%)"} 100%)`,
                boxShadow: `0 4px 16px -2px ${dynamicTheme?.logoGlow || "hsl(42 85% 53% / 0.4)"}, 0 0 0 1px ${dynamicTheme?.logoGlow || "hsl(42 85% 53% / 0.15)"}`
              }}
            >
              <Globe className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-sidebar-foreground">{dynamicBrandTitle}</span>
              <span className="text-[10px] font-medium text-sidebar-foreground/40">{t('sidebar.brandSubtitle')}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleCore.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-1">
          <div className="h-px bg-sidebar-foreground/10" />
        </div>

        <CollapsibleSection
          label={t('sidebar.operations', 'Operations')}
          items={visibleOperations}
          location={location}
          defaultOpen={true}
          t={t}
        />

        {visibleOversight.length > 0 && (
          <CollapsibleSection
            label={t('sidebar.oversight', 'Oversight')}
            items={visibleOversight}
            location={location}
            defaultOpen={false}
            t={t}
            icon={Eye}
          />
        )}

        {visibleCrossBorder.length > 0 && (
          <CollapsibleSection
            label={t('sidebar.crossBorder', 'Cross-Border')}
            items={visibleCrossBorder}
            location={location}
            defaultOpen={false}
            t={t}
            icon={Globe}
          />
        )}

        {visibleAdmin.length > 0 && (
          <CollapsibleSection
            label={t('sidebar.administration', 'Administration')}
            items={visibleAdmin}
            location={location}
            defaultOpen={false}
            t={t}
            icon={Settings}
          />
        )}

        <div className="mx-3 my-1">
          <div className="h-px bg-sidebar-foreground/10" />
        </div>

        <CollapsibleSection
          label={t('sidebar.resources', 'Resources')}
          items={visibleResources}
          location={location}
          defaultOpen={false}
          t={t}
        />
      </SidebarContent>
      <SidebarFooter className="p-3 pt-0 space-y-1.5">
        {orgName && !isSuperAdmin && (
          <div className="rounded-xl p-2.5 border border-sidebar-foreground/8" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/50" />
              <span className="text-[11px] font-semibold text-sidebar-foreground/80 truncate" data-testid="text-org-name">{orgName}</span>
            </div>
          </div>
        )}
        {isSuperAdmin && (
          <div className="rounded-xl p-2.5 border border-amber-500/25" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))" }}>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-400" data-testid="text-super-admin-badge">Platform Admin</span>
            </div>
          </div>
        )}
        {(() => {
          const cc = dynamicCountryConfig || getCountryConfig();
          const isGlobal = countryTheme?.isGlobalView;
          if (isGlobal && isSuperAdmin) {
            return (
              <div className="rounded-xl p-2.5 border border-sidebar-foreground/8" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold text-blue-400" data-testid="text-country-mode">Global View</span>
                </div>
              </div>
            );
          }
          if (cc) {
            return (
              <div className="rounded-xl p-2.5 border border-sidebar-foreground/8" style={{ background: `linear-gradient(135deg, ${cc.theme?.logoGlow || "rgba(59,130,246,0.08)"}, rgba(59,130,246,0.03))` }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-blue-400" data-testid="text-country-mode">{cc.name} Mode</span>
                    <span className="text-[9px] text-sidebar-foreground/40 truncate">{cc.regulatoryBody} | {cc.currency}</span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        <div className="rounded-xl p-2.5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 8px hsl(152 60% 50% / 0.4)" }} />
            <span className="text-[10px] font-semibold text-sidebar-foreground/70">System Online</span>
          </div>
          <div className="text-[9px] text-sidebar-foreground/40 mt-0.5 font-medium">
            {t('sidebar.version')}
          </div>
        </div>
        <div className="px-1 pt-0.5">
          <p className="text-[10px] text-sidebar-foreground/45 leading-relaxed" data-testid="text-provider-credit">
            <span className="text-sidebar-foreground/65 font-semibold">Carlson Capital & Systems In Motion Limited</span>
          </p>
          <p className="text-[9px] text-sidebar-foreground/35 font-medium" data-testid="text-copyright">
            2026 All rights reserved.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
