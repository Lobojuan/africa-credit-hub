import React, { useState } from "react";
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
  UserCheck,
  Activity,
  Gauge,
  Webhook,
  Sparkles,
  Monitor,
  User,
  Smartphone,
  Banknote,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import type { LucideIcon } from "lucide-react";
import { isGhanaMode, isSierraLeoneMode, isSingleCountryMode, getBrandTitle, getCountryConfig } from "@/lib/country-mode";
import { useCountryTheme } from "@/components/country-theme-provider";
import { useTheme } from "@/components/theme-provider";

type NavItem = {
  label: string;
  url: string;
  icon: LucideIcon;
  testId: string;
  roles?: string[];
};

const globalViewItems: NavItem[] = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { label: "Portfolio Intelligence", url: "/portfolio-intelligence", icon: Brain, testId: "nav-portfolio-intelligence", roles: ["admin", "super_admin", "regulator"] },
  { label: "AI Command Center", url: "/ai-command-center", icon: Sparkles, testId: "nav-ai-command-center", roles: ["admin", "super_admin", "regulator"] },
  { label: "Platform Metrics", url: "/platform-metrics", icon: Gauge, testId: "nav-platform-metrics", roles: ["admin", "super_admin"] },
];

const telcoItems: NavItem[] = [
  { label: "Telco Scoring", url: "/telco-scoring", icon: Smartphone, testId: "nav-telco-scoring", roles: ["admin", "lender", "regulator", "super_admin"] },
  { label: "Telco Lending", url: "/telco-lending", icon: Banknote, testId: "nav-telco-lending", roles: ["admin", "lender", "regulator", "super_admin"] },
];

const borrowersLendersItems: NavItem[] = [
  { label: "Consumers", url: "/consumers", icon: User, testId: "nav-consumers" },
  { label: "Businesses", url: "/businesses", icon: Building2, testId: "nav-businesses" },
  { label: "Borrowers (All)", url: "/borrowers", icon: Users, testId: "nav-borrowers", roles: ["super_admin"] },
  { label: "Credit Accounts", url: "/credit-accounts", icon: CreditCard, testId: "nav-credit-accounts" },
  { label: "Credit Search", url: "/search", icon: Search, testId: "nav-credit-search" },
  { label: "Credit Reports", url: "/reports", icon: FileText, testId: "nav-credit-reports" },
  { label: "Score Methodology", url: "/credit-score-methodology", icon: Brain, testId: "nav-credit-score-methodology", roles: ["admin", "lender", "super_admin"] },
  { label: "My Credit", url: "/my-credit", icon: UserCheck, testId: "nav-consumer-portal" },
  { label: "Institutions", url: "/institutions", icon: Building2, testId: "nav-institutions", roles: ["admin", "super_admin"] },
];

const operationsItems: NavItem[] = [
  { label: "Batch Upload", url: "/batch-upload", icon: Upload, testId: "nav-batch-upload", roles: ["admin", "lender", "super_admin"] },
  { label: "Disputes", url: "/disputes", icon: AlertCircle, testId: "nav-disputes", roles: ["admin", "lender", "regulator", "super_admin"] },
  { label: "Approvals", url: "/approvals", icon: CheckSquare, testId: "nav-pending-approvals", roles: ["admin", "regulator", "super_admin"] },
  { label: "Consent", url: "/consent", icon: FileCheck, testId: "nav-consent", roles: ["admin", "lender", "regulator", "super_admin"] },
  { label: "Helpdesk", url: "/helpdesk", icon: Headset, testId: "nav-helpdesk" },
  { label: "Borrower Alerts", url: "/borrower-alerts", icon: Bell, testId: "nav-borrower-alerts", roles: ["admin", "regulator", "super_admin"] },
];

const baseOversightItems: NavItem[] = [
  { label: "Regulatory Dashboard", url: "/regulatory-dashboard", icon: BarChart3, testId: "nav-regulatory-dashboard", roles: ["admin", "regulator", "super_admin"] },
  { label: "Audit Trail", url: "/audit", icon: Shield, testId: "nav-audit-trail", roles: ["admin", "regulator", "super_admin"] },
  { label: "Regulatory Compliance", url: "/regulatory-compliance", icon: Scale, testId: "nav-regulatory-compliance", roles: ["admin", "regulator", "super_admin"] },
];

function getOversightItems(activeCountryName?: string): NavItem[] {
  const items = [...baseOversightItems];
  const country = activeCountryName?.toLowerCase().replace(/[\s_-]/g, "") || "";
  if (country === "sierraleone" || isSierraLeoneMode()) {
    items.push({ label: "BSL Export", url: "/bsl-export", icon: FileSpreadsheet, testId: "nav-bsl-export", roles: ["admin", "regulator", "super_admin"] });
  } else {
    items.push({ label: "BOG Export", url: "/bog-export", icon: FileSpreadsheet, testId: "nav-bog-export", roles: ["admin", "regulator", "super_admin"] });
  }
  return items;
}

const crossBorderItems: NavItem[] = [
  { label: "Agreements", url: "/cross-border-agreements", icon: Handshake, testId: "nav-cross-border-agreements", roles: ["admin", "super_admin", "regulator"] },
  { label: "Cross-Border Search", url: "/cross-border-search", icon: FileSearch, testId: "nav-cross-border-search", roles: ["admin", "super_admin", "regulator", "lender"] },
  { label: "PAPSS Settlements", url: "/papss-settlements", icon: ArrowRightLeft, testId: "nav-papss-settlements", roles: ["admin", "super_admin", "regulator"] },
];

const adminItems: NavItem[] = [
  { label: "Command Center", url: "/command-center", icon: Monitor, testId: "nav-command-center", roles: ["super_admin"] },
  { label: "Organizations", url: "/organizations", icon: Building2, testId: "nav-organizations", roles: ["super_admin"] },
  { label: "User Management", url: "/users", icon: Settings, testId: "nav-user-management", roles: ["admin", "super_admin"] },
  { label: "Billing", url: "/billing", icon: Receipt, testId: "nav-billing", roles: ["admin", "regulator", "super_admin"] },
  { label: "Retention Policies", url: "/retention-policies", icon: Archive, testId: "nav-retention-policies", roles: ["admin", "regulator", "super_admin"] },
  { label: "Exchange Rates", url: "/exchange-rates", icon: DollarSign, testId: "nav-exchange-rates", roles: ["admin", "super_admin"] },
  { label: "API Admin", url: "/api-admin", icon: Plug, testId: "nav-api-admin", roles: ["admin", "super_admin"] },
  { label: "API Keys", url: "/api-keys", icon: Key, testId: "nav-api-keys", roles: ["admin", "super_admin"] },
  { label: "System Status", url: "/system-status", icon: Activity, testId: "nav-system-status", roles: ["admin", "super_admin"] },
  { label: "Webhooks", url: "/webhook-management", icon: Webhook, testId: "nav-webhook-management", roles: ["admin", "super_admin"] },
];

function getDocumentItems(): NavItem[] {
  const items: NavItem[] = [];
  if (isGhanaMode()) {
    items.push({ label: "Ghana Docs", url: "/ghana-docs", icon: BookOpen, testId: "nav-ghana-docs" });
  }
  items.push(
    { label: "Documentation", url: "/documentation", icon: FileText, testId: "nav-documentation" },
    { label: "App Guide", url: "/guide", icon: Play, testId: "nav-app-guide" },
    { label: "Help", url: "/help", icon: HelpCircle, testId: "nav-help" },
    { label: "Version History", url: "/version-history", icon: History, testId: "nav-version-history" },
    { label: "Legal & Copyright", url: "/legal", icon: Scale, testId: "nav-legal" },
    { label: "About", url: "/about", icon: Info, testId: "nav-about" },
  );
  return items;
}

function filterByRole(items: NavItem[], role: string | undefined): NavItem[] {
  if (!role) return items.filter(item => !item.roles);
  return items.filter(item => !item.roles || item.roles.includes(role));
}

function CollapsibleSection({
  label,
  items,
  location,
  icon: Icon,
}: {
  label: string;
  items: NavItem[];
  location: string;
  icon?: LucideIcon;
}) {
  const hasActive = items.some(item => location === item.url || (item.url === "/command-center" && location.startsWith("/command-center")));
  const [open, setOpen] = useState(hasActive);
  const [userToggled, setUserToggled] = useState(false);

  React.useEffect(() => {
    if (hasActive) {
      setOpen(true);
      setUserToggled(false);
    } else if (!userToggled) {
      setOpen(false);
    }
  }, [hasActive, location]);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={(v) => { setOpen(v); setUserToggled(true); }}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="w-full group">
          <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 cursor-pointer transition-all duration-200 flex items-center justify-between rounded-lg mx-1.5 my-0.5 ${
            hasActive && open
              ? "text-primary-foreground bg-primary/90 shadow-sm"
              : hasActive && !open
              ? "text-primary bg-primary/15 border border-primary/25"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-foreground/5"
          }`}>
            <span className="flex items-center gap-2">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              {!open && hasActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "" : "-rotate-90"}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
          <div className="ml-3 mr-1.5 my-1 border-l-2 border-primary/20 pl-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = location === item.url || (item.url === "/command-center" && location.startsWith("/command-center"));
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild data-active={isActive} className={isActive ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"}>
                        <Link href={item.url} data-testid={item.testId}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const isRtl = i18n.language === "ar";
  const countryTheme = useCountryTheme();
  const { visualStyle } = useTheme();
  const isScandinavian = visualStyle === "scandinavian";

  const dynamicCountryConfig = countryTheme?.activeConfig;
  const dynamicBrandTitle = dynamicCountryConfig?.brandTitle || (isGhanaMode() ? getBrandTitle() : t('sidebar.brandTitle'));
  const dynamicTheme = countryTheme?.activeTheme;

  const visibleGlobal = filterByRole(globalViewItems, role);
  const visibleTelco = filterByRole(telcoItems, role);
  const visibleBorrowersLenders = filterByRole(borrowersLendersItems, role);
  const visibleOperations = filterByRole(operationsItems, role);
  const oversightItems = getOversightItems(dynamicCountryConfig?.name);
  const visibleOversight = filterByRole(oversightItems, role);
  const { data: crossBorderAccess } = useQuery<{ hasAccess: boolean; reason: string }>({
    queryKey: ["/api/sata/access-check"],
    enabled: !!user,
  });
  const hasCrossBorderAccess = crossBorderAccess?.hasAccess ?? false;
  const visibleCrossBorder = hasCrossBorderAccess ? filterByRole(crossBorderItems, role) : [];
  const visibleAdmin = filterByRole(adminItems, role);
  const visibleDocs = filterByRole(getDocumentItems(), role);
  const isSuperAdmin = role === "super_admin";
  const orgName = (user as any)?.organization?.name;

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="p-4 pb-5">
        <Link href="/">
          <div className="flex items-center gap-3.5 cursor-pointer group">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isScandinavian ? "bg-primary" : ""}`}
              style={isScandinavian ? undefined : {
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
        <CollapsibleSection
          label="Global View"
          items={visibleGlobal}
          location={location}
          icon={LayoutDashboard}
        />

        <CollapsibleSection
          label="Telco"
          items={visibleTelco}
          location={location}
          icon={Smartphone}
        />

        <CollapsibleSection
          label="Borrowers & Lenders"
          items={visibleBorrowersLenders}
          location={location}
          icon={Users}
        />

        <CollapsibleSection
          label="Operations"
          items={visibleOperations}
          location={location}
          icon={CreditCard}
        />

        {visibleOversight.length > 0 && (
          <CollapsibleSection
            label="Oversight & Compliance"
            items={visibleOversight}
            location={location}
            icon={Eye}
          />
        )}

        {visibleCrossBorder.length > 0 && (
          <CollapsibleSection
            label="Cross-Border"
            items={visibleCrossBorder}
            location={location}
            icon={Globe}
          />
        )}

        {visibleAdmin.length > 0 && (
          <CollapsibleSection
            label="Administration"
            items={visibleAdmin}
            location={location}
            icon={Settings}
          />
        )}

        <div className="mx-3 my-1">
          <div className="h-px bg-sidebar-foreground/10" />
        </div>

        <CollapsibleSection
          label="Documents"
          items={visibleDocs}
          location={location}
          icon={BookOpen}
        />
      </SidebarContent>
      <SidebarFooter className="p-3 pt-0 space-y-1.5">
        {orgName && !isSuperAdmin && (
          <div className="rounded-xl p-2.5 border border-sidebar-foreground/8" style={isScandinavian ? undefined : { background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/50" />
              <span className="text-[11px] font-semibold text-sidebar-foreground/80 truncate" data-testid="text-org-name">{orgName}</span>
            </div>
          </div>
        )}
        {isSuperAdmin && (
          <div className={`rounded-xl p-2.5 border ${isScandinavian ? "border-primary/20 bg-primary/5" : "border-amber-500/25"}`} style={isScandinavian ? undefined : { background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))" }}>
            <div className="flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${isScandinavian ? "text-primary" : "text-amber-500"}`} />
              <span className={`text-[11px] font-bold ${isScandinavian ? "text-primary" : "text-amber-400"}`} data-testid="text-super-admin-badge">Platform Admin</span>
            </div>
          </div>
        )}
        {(() => {
          const cc = dynamicCountryConfig || getCountryConfig();
          const isGlobal = countryTheme?.isGlobalView;
          if (isGlobal && isSuperAdmin) {
            return (
              <div className={`rounded-xl p-2.5 border ${isScandinavian ? "border-sidebar-border" : "border-sidebar-foreground/8"}`} style={isScandinavian ? undefined : { background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))" }}>
                <div className="flex items-center gap-2">
                  <Globe className={`w-3.5 h-3.5 ${isScandinavian ? "text-primary" : "text-blue-400"}`} />
                  <span className={`text-[11px] font-bold ${isScandinavian ? "text-primary" : "text-blue-400"}`} data-testid="text-country-mode">Global View</span>
                </div>
              </div>
            );
          }
          if (cc) {
            return (
              <div className={`rounded-xl p-2.5 border ${isScandinavian ? "border-sidebar-border" : "border-sidebar-foreground/8"}`} style={isScandinavian ? undefined : { background: `linear-gradient(135deg, ${cc.theme?.logoGlow || "rgba(59,130,246,0.08)"}, rgba(59,130,246,0.03))` }}>
                <div className="flex items-center gap-2">
                  <Globe className={`w-3.5 h-3.5 ${isScandinavian ? "text-primary" : "text-blue-400"}`} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[11px] font-bold ${isScandinavian ? "text-primary" : "text-blue-400"}`} data-testid="text-country-mode">{cc.name} Mode</span>
                    <span className="text-[9px] text-sidebar-foreground/40 truncate">{cc.regulatoryBody} | {cc.currency}</span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        <div className="rounded-xl p-2.5" style={isScandinavian ? undefined : { background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={isScandinavian ? undefined : { boxShadow: "0 0 8px hsl(152 60% 50% / 0.4)" }} />
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
