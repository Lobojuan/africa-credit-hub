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
import { isGhanaMode, getBrandTitle } from "@/lib/country-mode";

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
  { titleKey: "sidebar.batchUpload", url: "/batch-upload", icon: Upload, testId: "nav-batch-upload", roles: ["admin", "lender", "super_admin"] },
];

const reportItems: NavItem[] = [
  { titleKey: "sidebar.creditReports", url: "/reports", icon: FileText, testId: "nav-credit-reports" },
  { titleKey: "sidebar.disputes", url: "/disputes", icon: AlertCircle, testId: "nav-disputes" },
  { titleKey: "sidebar.pendingApprovals", url: "/approvals", icon: CheckSquare, testId: "nav-pending-approvals", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.consentManagement", url: "/consent", icon: FileCheck, testId: "nav-consent" },
  { titleKey: "sidebar.helpdesk", url: "/helpdesk", icon: Headset, testId: "nav-helpdesk" },
  { titleKey: "sidebar.auditTrail", url: "/audit", icon: Shield, testId: "nav-audit-trail", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.regulatoryCompliance", url: "/regulatory-compliance", icon: Scale, testId: "nav-regulatory-compliance", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.bogExport", url: "/bog-export", icon: FileSpreadsheet, testId: "nav-bog-export", roles: ["admin", "regulator", "super_admin"] },
];

const platformItems: NavItem[] = [
  { titleKey: "sidebar.organizations", url: "/organizations", icon: Building2, testId: "nav-organizations", roles: ["super_admin"] },
];

const systemItems: NavItem[] = [
  { titleKey: "sidebar.userManagement", url: "/users", icon: Settings, testId: "nav-user-management", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.institutions", url: "/institutions", icon: Building2, testId: "nav-institutions", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.billing", url: "/billing", icon: Receipt, testId: "nav-billing", roles: ["admin", "regulator", "super_admin"] },
  { titleKey: "sidebar.retentionPolicies", url: "/retention-policies", icon: Archive, testId: "nav-retention-policies", roles: ["admin", "regulator", "super_admin"] },
];

const integrationItems: NavItem[] = [
  { titleKey: "sidebar.exchangeRates", url: "/exchange-rates", icon: DollarSign, testId: "nav-exchange-rates", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.apiAdmin", url: "/api-admin", icon: Plug, testId: "nav-api-admin", roles: ["admin", "super_admin"] },
  { titleKey: "sidebar.apiKeys", url: "/api-keys", icon: Key, testId: "nav-api-keys", roles: ["admin", "super_admin"] },
];

const resourceItems: NavItem[] = [
  { titleKey: "sidebar.appGuide", url: "/guide", icon: Play, testId: "nav-app-guide" },
  { titleKey: "sidebar.help", url: "/help", icon: HelpCircle, testId: "nav-help" },
  { titleKey: isGhanaMode() ? "sidebar.ghanaDocs" : "sidebar.documentation", url: isGhanaMode() ? "/ghana-docs" : "/documentation", icon: BookOpen, testId: "nav-documentation" },
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
}: {
  label: string;
  items: NavItem[];
  location: string;
  defaultOpen: boolean;
  t: (key: string) => string;
}) {
  const hasActive = items.some(item => location === item.url);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 cursor-pointer hover:text-sidebar-foreground/60 transition-colors flex items-center justify-between">
            <span>{label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
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

  const visiblePlatform = filterByRole(platformItems, role);
  const visibleCore = filterByRole(coreItems, role);
  const visibleReports = filterByRole(reportItems, role);
  const visibleSystem = filterByRole(systemItems, role);
  const visibleIntegrations = filterByRole(integrationItems, role);
  const visibleResources = filterByRole(resourceItems, role);
  const isSuperAdmin = role === "super_admin";
  const orgName = (user as any)?.organization?.name;

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="p-4 pb-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg shadow-md transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 75% 48%) 100%)"
              }}
            >
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">{isGhanaMode() ? getBrandTitle() : t('sidebar.brandTitle')}</span>
              <span className="text-[10px] font-medium text-sidebar-foreground/50">{t('sidebar.brandSubtitle')}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {visiblePlatform.length > 0 && (
          <>
            <SidebarGroup className="py-0">
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3">
                Platform
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visiblePlatform.map((item) => (
                    <SidebarMenuItem key={item.titleKey}>
                      <SidebarMenuButton asChild data-active={location === item.url}>
                        <Link href={item.url} data-testid={item.testId} onClick={() => {
                          if (location === item.url) window.dispatchEvent(new Event("organizations:reset"));
                        }}>
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
          </>
        )}
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
          label={t('sidebar.reportsCompliance')}
          items={visibleReports}
          location={location}
          defaultOpen={true}
          t={t}
        />

        {visibleSystem.length > 0 && (
          <CollapsibleSection
            label={t('sidebar.systemConfig', 'System')}
            items={visibleSystem}
            location={location}
            defaultOpen={false}
            t={t}
          />
        )}

        {visibleIntegrations.length > 0 && (
          <CollapsibleSection
            label={t('sidebar.integrations', 'Integrations')}
            items={visibleIntegrations}
            location={location}
            defaultOpen={false}
            t={t}
          />
        )}

        <div className="mx-3 my-1">
          <div className="h-px bg-sidebar-foreground/10" />
        </div>

        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleResources.map((item) => (
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
      </SidebarContent>
      <SidebarFooter className="p-3 pt-0">
        {orgName && !isSuperAdmin && (
          <div className="rounded-lg p-2.5 mb-1 border border-sidebar-foreground/10" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60" />
              <span className="text-[11px] font-semibold text-sidebar-foreground/80 truncate" data-testid="text-org-name">{orgName}</span>
            </div>
          </div>
        )}
        {isSuperAdmin && (
          <div className="rounded-lg p-2.5 mb-1 border border-amber-500/30" style={{ background: "rgba(245,158,11,0.08)" }}>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-500" data-testid="text-super-admin-badge">Platform Admin</span>
            </div>
          </div>
        )}
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-medium text-sidebar-foreground/70">System Online</span>
          </div>
          <div className="text-[9px] text-sidebar-foreground/50 mt-0.5">
            {t('sidebar.version')}
          </div>
        </div>
        <div className="px-1">
          <p className="text-[9px] text-sidebar-foreground/40 leading-relaxed" data-testid="text-provider-credit">
            <span className="text-sidebar-foreground/60 font-medium">Carlson Capital & Systems In Motion Limited™</span>
          </p>
          <p className="text-[8px] text-sidebar-foreground/30" data-testid="text-copyright">
            © 2026 All rights reserved.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
