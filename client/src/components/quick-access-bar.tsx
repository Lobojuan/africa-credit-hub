import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, Users, Search, FileText, Upload, Shield, Monitor,
  Brain, Sparkles, BarChart3, Building2, Settings, Receipt, Activity,
  Gauge, ChevronDown, AlertCircle, Scale, Bell, Key, Plug, Globe,
  Handshake, Eye, Archive, Webhook, DollarSign, Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavEntry {
  label: string;
  url: string;
  icon: LucideIcon;
  testId: string;
  roles?: string[];
}

interface DropdownSection {
  label: string;
  icon: LucideIcon;
  roles?: string[];
  items: NavEntry[];
}

const quickLinks: NavEntry[] = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard, testId: "quick-dashboard" },
  { label: "Search", url: "/search", icon: Search, testId: "quick-search" },
  { label: "Borrowers", url: "/borrowers", icon: Users, testId: "quick-borrowers" },
  { label: "Reports", url: "/reports", icon: FileText, testId: "quick-reports" },
  { label: "Upload", url: "/batch-upload", icon: Upload, testId: "quick-upload", roles: ["admin", "lender", "super_admin"] },
];

const dropdownSections: DropdownSection[] = [
  {
    label: "Oversight",
    icon: Eye,
    roles: ["admin", "regulator", "super_admin"],
    items: [
      { label: "AI Command Center", url: "/ai-command-center", icon: Sparkles, testId: "quick-ai-cmd", roles: ["admin", "super_admin"] },
      { label: "Portfolio Intelligence", url: "/portfolio-intelligence", icon: Brain, testId: "quick-portfolio", roles: ["admin", "regulator", "super_admin"] },
      { label: "Regulatory Dashboard", url: "/regulatory-dashboard", icon: BarChart3, testId: "quick-reg-dash", roles: ["admin", "regulator", "super_admin"] },
      { label: "Audit Trail", url: "/audit", icon: Shield, testId: "quick-audit", roles: ["admin", "regulator", "super_admin"] },
      { label: "Borrower Alerts", url: "/borrower-alerts", icon: Bell, testId: "quick-alerts", roles: ["admin", "regulator", "super_admin"] },
      { label: "Compliance", url: "/regulatory-compliance", icon: Scale, testId: "quick-compliance", roles: ["admin", "regulator", "super_admin"] },
    ],
  },
  {
    label: "Operations",
    icon: Settings,
    items: [
      { label: "Disputes", url: "/disputes", icon: AlertCircle, testId: "quick-disputes" },
      { label: "Approvals", url: "/approvals", icon: Shield, testId: "quick-approvals", roles: ["admin", "regulator", "super_admin"] },
      { label: "Consent", url: "/consent", icon: FileText, testId: "quick-consent" },
      { label: "Credit Accounts", url: "/credit-accounts", icon: Receipt, testId: "quick-accounts" },
    ],
  },
  {
    label: "Admin",
    icon: Monitor,
    roles: ["admin", "super_admin"],
    items: [
      { label: "Command Center", url: "/command-center", icon: Monitor, testId: "quick-cmd-center", roles: ["super_admin"] },
      { label: "Organizations", url: "/organizations", icon: Building2, testId: "quick-orgs", roles: ["super_admin"] },
      { label: "Users", url: "/users", icon: Settings, testId: "quick-users", roles: ["admin", "super_admin"] },
      { label: "Institutions", url: "/institutions", icon: Building2, testId: "quick-institutions", roles: ["admin", "super_admin"] },
      { label: "Billing", url: "/billing", icon: Receipt, testId: "quick-billing", roles: ["admin", "regulator", "super_admin"] },
      { label: "Exchange Rates", url: "/exchange-rates", icon: DollarSign, testId: "quick-rates", roles: ["admin", "super_admin"] },
      { label: "API Keys", url: "/api-keys", icon: Key, testId: "quick-apikeys", roles: ["admin", "super_admin"] },
      { label: "System Status", url: "/system-status", icon: Activity, testId: "quick-status", roles: ["admin", "super_admin"] },
      { label: "Platform Metrics", url: "/platform-metrics", icon: Gauge, testId: "quick-metrics", roles: ["admin", "super_admin"] },
      { label: "Webhooks", url: "/webhook-management", icon: Webhook, testId: "quick-webhooks", roles: ["admin", "super_admin"] },
      { label: "Retention", url: "/retention-policies", icon: Archive, testId: "quick-retention", roles: ["admin", "regulator", "super_admin"] },
      { label: "API Admin", url: "/api-admin", icon: Plug, testId: "quick-apiadmin", roles: ["admin", "super_admin"] },
    ],
  },
  {
    label: "Cross-Border",
    icon: Globe,
    roles: ["admin", "regulator", "super_admin"],
    items: [
      { label: "Agreements", url: "/cross-border-agreements", icon: Handshake, testId: "quick-agreements", roles: ["admin", "regulator", "super_admin"] },
      { label: "Cross-Border Search", url: "/cross-border-search", icon: Globe, testId: "quick-xb-search", roles: ["admin", "regulator", "super_admin"] },
      { label: "PAPSS Settlements", url: "/papss-settlements", icon: Globe, testId: "quick-papss", roles: ["admin", "regulator", "super_admin"] },
    ],
  },
];

function hasRole(role: string | undefined, allowed?: string[]): boolean {
  if (!allowed) return true;
  return !!role && allowed.includes(role);
}

export function QuickAccessBar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const role = user?.role;

  const visibleQuickLinks = quickLinks.filter((l) => hasRole(role, l.roles));

  const visibleSections = dropdownSections
    .filter((s) => hasRole(role, s.roles))
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => hasRole(role, item.roles)),
    }))
    .filter((s) => s.items.length > 0);

  const allMobileItems = [
    ...visibleQuickLinks,
    ...visibleSections.flatMap((s) => s.items),
  ];

  return (
    <div className="flex items-center justify-center pointer-events-none" data-testid="quick-access-bar">
      <div className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-full bg-background/60 backdrop-blur-xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1 text-xs font-medium md:hidden"
              data-testid="quick-mobile-menu"
            >
              <Menu className="w-4 h-4" />
              <span>Navigate</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {visibleQuickLinks.map((link) => (
              <DropdownMenuItem
                key={link.url}
                className={`gap-2 cursor-pointer ${location === link.url ? "bg-accent" : ""}`}
                onClick={() => navigate(link.url)}
                data-testid={`mobile-${link.testId}`}
              >
                <link.icon className="w-4 h-4 text-muted-foreground" />
                <span>{link.label}</span>
              </DropdownMenuItem>
            ))}
            {visibleSections.map((section) => (
              <DropdownMenuSub key={section.label}>
                <DropdownMenuSubTrigger className="gap-2">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{section.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {section.items.map((item) => (
                    <DropdownMenuItem
                      key={item.url}
                      className={`gap-2 cursor-pointer ${location === item.url ? "bg-accent" : ""}`}
                      onClick={() => navigate(item.url)}
                      data-testid={`mobile-${item.testId}`}
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden lg:flex items-center gap-0.5">
          {visibleQuickLinks.map((link) => (
            <Tooltip key={link.url}>
              <TooltipTrigger asChild>
                <Button
                  variant={location === link.url ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 rounded-full px-3 gap-1.5 text-xs font-medium transition-all ${
                    location === link.url
                      ? "shadow-sm bg-primary text-primary-foreground scale-105"
                      : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => navigate(link.url)}
                  data-testid={link.testId}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{link.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="xl:hidden text-xs rounded-lg">
                {link.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="hidden md:flex w-px h-5 bg-border/60 mx-1" />

        <div className="hidden md:flex items-center gap-0.5">
          {visibleSections.map((section) => {
            const isActive = section.items.some((item) => location === item.url);
            return (
              <DropdownMenu key={section.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`h-8 rounded-full px-3 gap-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-muted text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`quick-menu-${section.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <section.icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{section.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl p-1.5 shadow-xl border-border/50 bg-background/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                    {section.label}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {section.items.map((item) => (
                      <DropdownMenuItem
                        key={item.url}
                        className={`gap-2 cursor-pointer ${location === item.url ? "bg-accent" : ""}`}
                        onClick={() => navigate(item.url)}
                        data-testid={item.testId}
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
