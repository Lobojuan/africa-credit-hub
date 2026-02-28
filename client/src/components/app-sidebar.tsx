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

const mainItems = [
  { titleKey: "sidebar.dashboard", url: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
  { titleKey: "sidebar.borrowers", url: "/borrowers", icon: Users, testId: "nav-borrowers" },
  { titleKey: "sidebar.creditAccounts", url: "/credit-accounts", icon: CreditCard, testId: "nav-credit-accounts" },
  { titleKey: "sidebar.creditSearch", url: "/search", icon: Search, testId: "nav-credit-search" },
  { titleKey: "sidebar.batchUpload", url: "/batch-upload", icon: Upload, testId: "nav-batch-upload" },
  { titleKey: "sidebar.help", url: "/help", icon: HelpCircle, testId: "nav-help" },
];

const reportItems = [
  { titleKey: "sidebar.creditReports", url: "/reports", icon: FileText, testId: "nav-credit-reports" },
  { titleKey: "sidebar.pendingApprovals", url: "/approvals", icon: CheckSquare, testId: "nav-pending-approvals" },
  { titleKey: "sidebar.disputes", url: "/disputes", icon: AlertCircle, testId: "nav-disputes" },
  { titleKey: "sidebar.consentManagement", url: "/consent", icon: FileCheck, testId: "nav-consent" },
  { titleKey: "sidebar.helpdesk", url: "/helpdesk", icon: Headset, testId: "nav-helpdesk" },
  { titleKey: "sidebar.auditTrail", url: "/audit", icon: Shield, testId: "nav-audit-trail" },
];

const adminItems = [
  { titleKey: "sidebar.userManagement", url: "/users", icon: Settings, testId: "nav-user-management" },
  { titleKey: "sidebar.institutions", url: "/institutions", icon: Building2, testId: "nav-institutions" },
  { titleKey: "sidebar.billing", url: "/billing", icon: Receipt, testId: "nav-billing" },
  { titleKey: "sidebar.apiKeys", url: "/api-keys", icon: Key, testId: "nav-api-keys" },
  { titleKey: "sidebar.documentation", url: "/documentation", icon: BookOpen, testId: "nav-documentation" },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-6">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 75% 48%) 100%)"
              }}
            >
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">{t('sidebar.brandTitle')}</span>
              <span className="text-[10px] font-medium text-sidebar-foreground/50">{t('sidebar.brandSubtitle')}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3">{t('sidebar.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3">{t('sidebar.reportsCompliance')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3">{t('sidebar.administration')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
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
      <SidebarFooter className="p-4 space-y-2">
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-medium text-sidebar-foreground/70">System Online</span>
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 mt-1">
            {t('sidebar.version')}
          </div>
        </div>
        <div className="px-1">
          <p className="text-[10px] text-sidebar-foreground/40 leading-relaxed" data-testid="text-provider-credit">
            Credit system provided by{" "}
            <span className="text-sidebar-foreground/60 font-medium">Systems In Motion Limited</span>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
