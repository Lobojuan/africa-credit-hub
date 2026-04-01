import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  LayoutDashboard, Search, Users, FileText, MoreHorizontal,
  Upload, AlertCircle, Shield, Brain, BarChart3, Building2,
  Settings, Receipt, Activity, Bell, Scale, Key, Plug,
  Globe, Handshake, Archive, Webhook, CreditCard, Headset,
  CheckSquare, FileCheck, DollarSign, Monitor, Eye, Sparkles,
  Gauge, User, Smartphone, Banknote, X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  url: string;
  icon: LucideIcon;
  testId: string;
  roles?: string[];
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const moreSections: NavSection[] = [
  {
    label: "Global View",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard, testId: "mob-dashboard" },
      { label: "Portfolio Intelligence", url: "/portfolio-intelligence", icon: Brain, testId: "mob-portfolio", roles: ["admin", "super_admin", "regulator"] },
      { label: "AI Command Center", url: "/ai-command-center", icon: Sparkles, testId: "mob-ai-cmd", roles: ["admin", "super_admin", "regulator"] },
      { label: "Platform Metrics", url: "/platform-metrics", icon: Gauge, testId: "mob-metrics", roles: ["admin", "super_admin"] },
    ],
  },
  {
    label: "Borrowers & Lenders",
    icon: Users,
    items: [
      { label: "Consumers", url: "/consumers", icon: User, testId: "mob-consumers" },
      { label: "Businesses", url: "/businesses", icon: Building2, testId: "mob-businesses" },
      { label: "Credit Accounts", url: "/credit-accounts", icon: CreditCard, testId: "mob-credit-accounts" },
      { label: "Credit Search", url: "/search", icon: Search, testId: "mob-search" },
      { label: "Credit Reports", url: "/reports", icon: FileText, testId: "mob-reports" },
      { label: "Score Methodology", url: "/credit-score-methodology", icon: Brain, testId: "mob-score-method", roles: ["admin", "lender", "super_admin"] },
      { label: "My Credit", url: "/my-credit", icon: User, testId: "mob-my-credit" },
      { label: "Institutions", url: "/institutions", icon: Building2, testId: "mob-institutions", roles: ["admin", "super_admin"] },
    ],
  },
  {
    label: "Telco",
    icon: Smartphone,
    items: [
      { label: "Telco Scoring", url: "/telco-scoring", icon: Smartphone, testId: "mob-telco-scoring", roles: ["admin", "lender", "regulator", "super_admin"] },
      { label: "Telco Lending", url: "/telco-lending", icon: Banknote, testId: "mob-telco-lending", roles: ["admin", "lender", "regulator", "super_admin"] },
    ],
  },
  {
    label: "Operations",
    icon: Settings,
    items: [
      { label: "Batch Upload", url: "/batch-upload", icon: Upload, testId: "mob-upload", roles: ["admin", "lender", "super_admin"] },
      { label: "Disputes", url: "/disputes", icon: AlertCircle, testId: "mob-disputes", roles: ["admin", "lender", "regulator", "super_admin"] },
      { label: "Approvals", url: "/approvals", icon: CheckSquare, testId: "mob-approvals", roles: ["admin", "regulator", "super_admin"] },
      { label: "Consent", url: "/consent", icon: FileCheck, testId: "mob-consent", roles: ["admin", "lender", "regulator", "super_admin"] },
      { label: "Helpdesk", url: "/helpdesk", icon: Headset, testId: "mob-helpdesk" },
      { label: "Borrower Alerts", url: "/borrower-alerts", icon: Bell, testId: "mob-alerts", roles: ["admin", "regulator", "super_admin"] },
    ],
  },
  {
    label: "Oversight",
    icon: Eye,
    items: [
      { label: "Regulatory Dashboard", url: "/regulatory-dashboard", icon: BarChart3, testId: "mob-reg-dash", roles: ["admin", "regulator", "super_admin"] },
      { label: "Audit Trail", url: "/audit", icon: Shield, testId: "mob-audit", roles: ["admin", "regulator", "super_admin"] },
      { label: "Compliance", url: "/regulatory-compliance", icon: Scale, testId: "mob-compliance", roles: ["admin", "regulator", "super_admin"] },
    ],
  },
  {
    label: "Cross-Border",
    icon: Globe,
    items: [
      { label: "Agreements", url: "/cross-border-agreements", icon: Handshake, testId: "mob-agreements", roles: ["admin", "super_admin", "regulator"] },
      { label: "Cross-Border Search", url: "/cross-border-search", icon: Globe, testId: "mob-xb-search", roles: ["admin", "super_admin", "regulator", "lender"] },
    ],
  },
  {
    label: "Administration",
    icon: Monitor,
    items: [
      { label: "Command Center", url: "/command-center", icon: Monitor, testId: "mob-cmd-center", roles: ["super_admin"] },
      { label: "Organizations", url: "/organizations", icon: Building2, testId: "mob-orgs", roles: ["super_admin"] },
      { label: "User Management", url: "/users", icon: Settings, testId: "mob-users", roles: ["admin", "super_admin"] },
      { label: "Billing", url: "/billing", icon: Receipt, testId: "mob-billing", roles: ["admin", "regulator", "super_admin"] },
      { label: "Exchange Rates", url: "/exchange-rates", icon: DollarSign, testId: "mob-rates", roles: ["admin", "super_admin"] },
      { label: "API Keys", url: "/api-keys", icon: Key, testId: "mob-api-keys", roles: ["admin", "super_admin"] },
      { label: "System Status", url: "/system-status", icon: Activity, testId: "mob-status", roles: ["admin", "super_admin"] },
      { label: "Retention Policies", url: "/retention-policies", icon: Archive, testId: "mob-retention", roles: ["admin", "regulator", "super_admin"] },
      { label: "API Admin", url: "/api-admin", icon: Plug, testId: "mob-api-admin", roles: ["admin", "super_admin"] },
      { label: "Webhooks", url: "/webhook-management", icon: Webhook, testId: "mob-webhooks", roles: ["admin", "super_admin"] },
    ],
  },
];

function hasRole(role: string | undefined, allowed?: string[]): boolean {
  if (!allowed) return true;
  return !!role && allowed.includes(role);
}

const primaryTabs: { label: string; url: string; icon: LucideIcon; testId: string }[] = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard, testId: "btmnav-dashboard" },
  { label: "Search", url: "/search", icon: Search, testId: "btmnav-search" },
  { label: "Consumers", url: "/consumers", icon: Users, testId: "btmnav-consumers" },
  { label: "Reports", url: "/reports", icon: FileText, testId: "btmnav-reports" },
];

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const [moreOpen, setMoreOpen] = useState(false);

  const filteredSections = moreSections
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => hasRole(role, item.roles)),
    }))
    .filter((s) => s.items.length > 0);

  const isMoreActive = !primaryTabs.some((t) => location === t.url) && location !== "/dashboard";

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-lg safe-area-bottom"
        data-testid="mobile-bottom-nav"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {primaryTabs.map((tab) => {
            const isActive = location === tab.url;
            return (
              <button
                key={tab.url}
                onClick={() => navigate(tab.url)}
                data-testid={tab.testId}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>{tab.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            data-testid="btmnav-more"
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              isMoreActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${isMoreActive ? "stroke-[2.5]" : ""}`} />
            <span className={`text-[10px] font-medium ${isMoreActive ? "font-semibold" : ""}`}>More</span>
            {isMoreActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0 pb-0">
          <SheetHeader className="px-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">Navigation</SheetTitle>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
                data-testid="btmnav-close-more"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 px-2 py-3" style={{ maxHeight: "calc(85vh - 80px)" }}>
            {filteredSections.map((section) => (
              <div key={section.label} className="mb-4">
                <div className="flex items-center gap-2 px-3 mb-1.5">
                  <section.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{section.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 px-1">
                  {section.items.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <button
                        key={item.url}
                        onClick={() => {
                          navigate(item.url);
                          setMoreOpen(false);
                        }}
                        data-testid={item.testId}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                        <span className={`text-[10px] leading-tight text-center ${isActive ? "font-semibold" : "font-medium"}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
