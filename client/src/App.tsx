import "./lib/i18n";
import { lazy, Suspense, useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, MessageCircle, Building2, LayoutGrid } from "lucide-react";
import { DisputeChatbot } from "@/components/dispute-chatbot";
import { OrgSwitcherProvider } from "@/hooks/use-org-switcher";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OrgSwitcher } from "@/components/org-switcher";
import { CountryThemeProvider, useCountryTheme } from "@/components/country-theme-provider";
import { CountrySelector } from "@/components/country-selector";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import InvestorLandingPage from "@/pages/investor-landing";
import CountrySelectionPage from "@/pages/country-selection";
const MobileSearchPage = lazy(() => import("@/pages/mobile-search"));

const BorrowersPage = lazy(() => import("@/pages/borrowers"));
const BorrowerDetailPage = lazy(() => import("@/pages/borrower-detail"));
const CreditAccountsPage = lazy(() => import("@/pages/credit-accounts"));
const CreditSearchPage = lazy(() => import("@/pages/credit-search"));
const reportsImport = () => import("@/pages/reports");
const ReportsPage = lazy(reportsImport);
const AuditTrailPage = lazy(() => import("@/pages/audit-trail"));
const UserManagementPage = lazy(() => import("@/pages/user-management"));
const PendingApprovalsPage = lazy(() => import("@/pages/pending-approvals"));
const DisputesPage = lazy(() => import("@/pages/disputes"));
const BatchUploadPage = lazy(() => import("@/pages/batch-upload"));
const InstitutionsPage = lazy(() => import("@/pages/institutions"));
const ConsentManagementPage = lazy(() => import("@/pages/consent-management"));
const BillingPage = lazy(() => import("@/pages/billing"));
const HelpdeskPage = lazy(() => import("@/pages/helpdesk"));
const creditReportImport = () => import("@/pages/credit-report");
const CreditReportPage = lazy(creditReportImport);
const ApiKeysPage = lazy(() => import("@/pages/api-keys"));
const ApiDocsPage = lazy(() => import("@/pages/api-docs"));
const OnlineManualPage = lazy(() => import("@/pages/online-manual"));
const DocumentationPage = lazy(() => import("@/pages/documentation"));
const ExchangeRatesPage = lazy(() => import("@/pages/exchange-rates"));
const ApiAdminPage = lazy(() => import("@/pages/api-admin"));
const RetentionPoliciesPage = lazy(() => import("@/pages/retention-policies"));
const RegulatoryCompliancePage = lazy(() => import("@/pages/regulatory-compliance"));
const BogExportPage = lazy(() => import("@/pages/bog-export"));
const BslExportPage = lazy(() => import("@/pages/bsl-export"));
const VersionHistoryPage = lazy(() => import("@/pages/version-history"));
const AppGuidePage = lazy(() => import("@/pages/app-guide"));
const OrganizationsPage = lazy(() => import("@/pages/organizations"));
const GhanaDocsPage = lazy(() => import("@/pages/ghana-docs"));
const AboutPage = lazy(() => import("@/pages/about"));
const PortfolioIntelligencePage = lazy(() => import("@/pages/portfolio-intelligence"));
const BorrowerAlertsPage = lazy(() => import("@/pages/borrower-alerts"));
const RegulatoryDashboardPage = lazy(() => import("@/pages/regulatory-dashboard"));
const CreditScoreMethodologyPage = lazy(() => import("@/pages/credit-score-methodology"));
const CrossBorderAgreementsPage = lazy(() => import("@/pages/cross-border-agreements"));
const CrossBorderSearchPage = lazy(() => import("@/pages/cross-border-search"));
const PapssSettlementsPage = lazy(() => import("@/pages/papss-settlements"));
const ConsumerPortalPage = lazy(() => import("@/pages/consumer-portal"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/borrowers" component={BorrowersPage} />
        <Route path="/borrowers/:id" component={BorrowerDetailPage} />
        <Route path="/credit-accounts" component={CreditAccountsPage} />
        <Route path="/search" component={CreditSearchPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/audit" component={AuditTrailPage} />
        <Route path="/users" component={UserManagementPage} />
        <Route path="/approvals" component={PendingApprovalsPage} />
        <Route path="/disputes" component={DisputesPage} />
        <Route path="/batch-upload" component={BatchUploadPage} />
        <Route path="/institutions" component={InstitutionsPage} />
        <Route path="/consent" component={ConsentManagementPage} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/helpdesk" component={HelpdeskPage} />
        <Route path="/credit-report/:borrowerId" component={CreditReportPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        <Route path="/api-docs" component={ApiDocsPage} />
        <Route path="/help" component={OnlineManualPage} />
        <Route path="/documentation" component={DocumentationPage} />
        <Route path="/exchange-rates" component={ExchangeRatesPage} />
        <Route path="/api-admin" component={ApiAdminPage} />
        <Route path="/retention-policies" component={RetentionPoliciesPage} />
        <Route path="/regulatory-compliance" component={RegulatoryCompliancePage} />
        <Route path="/bog-export" component={BogExportPage} />
        <Route path="/bsl-export" component={BslExportPage} />
        <Route path="/version-history" component={VersionHistoryPage} />
        <Route path="/guide" component={AppGuidePage} />
        <Route path="/organizations" component={OrganizationsPage} />
        <Route path="/ghana-docs" component={GhanaDocsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/portfolio-intelligence" component={PortfolioIntelligencePage} />
        <Route path="/credit-score-methodology" component={CreditScoreMethodologyPage} />
        <Route path="/regulatory-dashboard" component={RegulatoryDashboardPage} />
        <Route path="/borrower-alerts" component={BorrowerAlertsPage} />
        <Route path="/cross-border-agreements" component={CrossBorderAgreementsPage} />
        <Route path="/cross-border-search" component={CrossBorderSearchPage} />
        <Route path="/papss-settlements" component={PapssSettlementsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function SuspendedScreen({ orgName, onLogout }: { orgName?: string; onLogout: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
          <Building2 className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-suspended-title">Account Suspended</h1>
          {orgName && <p className="text-sm text-muted-foreground">{orgName}</p>}
        </div>
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-2">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            Your organization's access has been suspended due to an outstanding balance.
          </p>
          <p className="text-xs text-red-600 dark:text-red-300">
            Please contact your platform administrator or make a payment to restore access to the Credit Registry System.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support at <span className="font-medium">support@systemsinmotion.co</span>
          </p>
          <Button variant="outline" onClick={onLogout} data-testid="button-suspended-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, logout, passwordExpired, accountSuspended } = useAuth();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const countryTheme = useCountryTheme();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        reportsImport();
        creditReportImport();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (accountSuspended) {
    return <SuspendedScreen orgName={(user as any)?.organization?.name} onLogout={logout} />;
  }

  const viewingCountry = (user as any)?.viewingCountry;
  const needsCountrySelection = user.role === "super_admin" && !viewingCountry;
  if (needsCountrySelection) {
    return <CountrySelectionPage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-1 sm:gap-2 p-2 border-b shrink-0 overflow-hidden ltr-header">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
            <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-auto ltr-header">
              {(user as any)?.organization?.name && user.role !== "super_admin" && (
                <span className="text-xs text-muted-foreground hidden lg:inline-flex items-center gap-1" data-testid="text-org-context">
                  <Building2 className="w-3 h-3" />
                  {(user as any).organization.name}
                </span>
              )}
              {user.role === "super_admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={async () => {
                      try {
                        await apiRequest("POST", "/api/platform/set-country", { country: "command_center" });
                        queryClient.setQueryData(["/api/auth/me"], (old: any) => {
                          if (!old) return old;
                          return { ...old, viewingCountry: null };
                        });
                        await queryClient.invalidateQueries({
                          predicate: (q) => {
                            const key = q.queryKey[0] as string;
                            return key && !key.startsWith("/api/auth/");
                          },
                          refetchType: "all",
                        });
                      } catch {
                        window.location.href = "/";
                      }
                    }}
                    data-testid="button-command-center"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span>Command Center</span>
                  </Button>
                  <CountrySelector />
                  <OrgSwitcher />
                </>
              )}
              <span className="text-xs text-muted-foreground hidden md:inline" data-testid="text-current-user">
                {user.fullName} ({user.role})
              </span>
              <LanguageSwitcher />
              <NotificationBell />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await logout();
                  } catch {
                    window.location.href = "/";
                  }
                }}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </main>
          {passwordExpired && <PasswordChangeDialog open={true} forced={true} />}
        </div>
      </div>
      {!chatbotOpen && (
        <button
          onClick={() => setChatbotOpen(true)}
          data-testid="button-open-chatbot"
          title={t('chatbot.title')}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 bg-primary text-primary-foreground"
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      <DisputeChatbot open={chatbotOpen} onOpenChange={setChatbotOpen} />
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/investor" component={InvestorLandingPage} />
            <Route path="/my-credit">
              <Suspense fallback={<LazyFallback />}>
                <ConsumerPortalPage />
              </Suspense>
            </Route>
            <Route path="/mobile">
              <AuthProvider>
                <OrgSwitcherProvider>
                  <Suspense fallback={<LazyFallback />}>
                    <MobileSearchPage />
                  </Suspense>
                </OrgSwitcherProvider>
              </AuthProvider>
            </Route>
            <Route>
              <AuthProvider>
                <OrgSwitcherProvider>
                  <CountryThemeProvider>
                    <AuthenticatedApp />
                  </CountryThemeProvider>
                </OrgSwitcherProvider>
              </AuthProvider>
            </Route>
          </Switch>
          <Toaster />
          <PWAInstallPrompt />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
