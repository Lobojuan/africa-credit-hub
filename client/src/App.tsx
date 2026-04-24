import "./lib/i18n";
import { lazy, Suspense, useEffect, useState, Component, type ReactNode, type ErrorInfo } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import { PLATFORM_SUPPORT_EMAIL } from "@/lib/platform-config";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, MessageCircle, Building2, LayoutGrid, User, Clock, XCircle, Shield, Fingerprint } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DisputeChatbot } from "@/components/dispute-chatbot";
import { OrgSwitcherProvider } from "@/hooks/use-org-switcher";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PublicChatbot } from "@/components/public-chatbot";
import { TrialBanner } from "@/components/trial-banner";
import { OrgSwitcher } from "@/components/org-switcher";
import { CountryThemeProvider, useCountryTheme } from "@/components/country-theme-provider";
import { CountrySelector } from "@/components/country-selector";
import { QuickAccessBar } from "@/components/quick-access-bar";
import { SessionTimeoutDialog } from "@/components/session-timeout-dialog";
import { AppFooter } from "@/components/app-footer";
import { MfaSetupDialog } from "@/components/mfa-setup";
import { useToast } from "@/hooks/use-toast";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
const Dashboard = lazy(() => import("@/pages/dashboard"));
const InvestorLandingPage = lazy(() => import("@/pages/investor-landing"));
const CountrySelectionPage = lazy(() => import("@/pages/country-selection"));
const MobileSearchPage = lazy(() => import("@/pages/mobile-search"));

const BorrowersPage = lazy(() => import("@/pages/borrowers"));
const BorrowerDetailPage = lazy(() => import("@/pages/borrower-detail"));
const ConsumersPage = lazy(() => import("@/pages/consumers"));
const ConsumerDetailPage = lazy(() => import("@/pages/consumer-detail"));
const BusinessesPage = lazy(() => import("@/pages/businesses"));
const BusinessDetailPage = lazy(() => import("@/pages/business-detail"));
const TelcoScoringPage = lazy(() => import("@/pages/telco-scoring"));
const TelcoLendingPage = lazy(() => import("@/pages/telco-lending"));
const CreditAccountsPage = lazy(() => import("@/pages/credit-accounts"));
const DishonouredChequesPage = lazy(() => import("@/pages/dishonoured-cheques"));
const CourtJudgmentsPage = lazy(() => import("@/pages/court-judgments"));
const CreditSearchPage = lazy(() => import("@/pages/credit-search"));
const reportsImport = () => import("@/pages/reports");
const ReportsPage = lazy(reportsImport);
const AuditTrailPage = lazy(() => import("@/pages/audit-trail"));
const FindConnectionsPage = lazy(() => import("@/pages/find-connections"));
const CollectionsPage = lazy(() => import("@/pages/collections"));
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
const BusinessCreditReportPage = lazy(() => import("@/pages/business-credit-report"));
const ApiKeysPage = lazy(() => import("@/pages/api-keys"));
const ApiDocsPage = lazy(() => import("@/pages/api-docs"));
const OnlineManualPage = lazy(() => import("@/pages/online-manual"));
const DocumentationPage = lazy(() => import("@/pages/documentation"));
const ExchangeRatesPage = lazy(() => import("@/pages/exchange-rates"));
const ApiAdminPage = lazy(() => import("@/pages/api-admin"));
const RetentionPoliciesPage = lazy(() => import("@/pages/retention-policies"));
const DataManagementPage = lazy(() => import("@/pages/data-management"));
const RegulatoryCompliancePage = lazy(() => import("@/pages/regulatory-compliance"));
const BogExportPage = lazy(() => import("@/pages/bog-export"));
const BslExportPage = lazy(() => import("@/pages/bsl-export"));
const VersionHistoryPage = lazy(() => import("@/pages/version-history"));
const AppGuidePage = lazy(() => import("@/pages/app-guide"));
const TrainingCenterPage = lazy(() => import("@/pages/training-center"));
const OrganizationsPage = lazy(() => import("@/pages/organizations"));
const GhanaDocsPage = lazy(() => import("@/pages/ghana-docs"));
const PartnerDocsPage = lazy(() => import("@/pages/partner-docs"));
const AboutPage = lazy(() => import("@/pages/about"));
const LegalCopyrightPage = lazy(() => import("@/pages/legal-copyright"));
const PortfolioIntelligencePage = lazy(() => import("@/pages/portfolio-intelligence"));
const PortfolioTriggersPage = lazy(() => import("@/pages/portfolio-triggers"));
const AICommandCenterPage = lazy(() => import("@/pages/ai-command-center"));
const CommandCenterPage = lazy(() => import("@/pages/country-selection"));
const AIDemoPage = lazy(() => import("@/pages/ai-demo"));
const BorrowerAlertsPage = lazy(() => import("@/pages/borrower-alerts"));
const RegulatoryDashboardPage = lazy(() => import("@/pages/regulatory-dashboard"));
const CreditScoreMethodologyPage = lazy(() => import("@/pages/credit-score-methodology"));
const ScoreGuidePage = lazy(() => import("@/pages/score-guide"));
const CrossBorderAgreementsPage = lazy(() => import("@/pages/cross-border-agreements"));
const CrossBorderSearchPage = lazy(() => import("@/pages/cross-border-search"));
const PapssSettlementsPage = lazy(() => import("@/pages/papss-settlements"));
const ConsumerPortalPage = lazy(() => import("@/pages/consumer-portal"));
const SystemStatusPage = lazy(() => import("@/pages/system-status"));
const BackupPage = lazy(() => import("@/pages/backup"));
const PlatformMetricsPage = lazy(() => import("@/pages/platform-metrics"));
const WebhookManagementPage = lazy(() => import("@/pages/webhook-management"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const ContactSalesPage = lazy(() => import("@/pages/contact-sales"));
const SecurityCompliancePage = lazy(() => import("@/pages/security-compliance"));
const TermsOfServicePage = lazy(() => import("@/pages/terms"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy"));
const MarketValidationPage = lazy(() => import("@/pages/market-validation"));
const StartTrialPage = lazy(() => import("@/pages/start-trial"));
const SignUpPage = lazy(() => import("@/pages/signup"));
const ConsentRespondPage = lazy(() => import("@/pages/consent-respond"));
const UpgradePage = lazy(() => import("@/pages/upgrade"));
const PresentationPage = lazy(() => import("@/pages/presentation"));
const PortalPage = lazy(() => import("@/pages/portal"));
const DecisionEnginePage = lazy(() => import("@/pages/decision-engine"));
const PlatformMasterControlPage = lazy(() => import("@/pages/platform-master-control"));
const ComplianceQueuePage = lazy(() => import("@/pages/compliance-queue"));
const LoanOriginationPage = lazy(() => import("@/pages/loan-origination"));
const CollateralRegistryPage = lazy(() => import("@/pages/collateral-registry"));
const RegistryAuthorityPortalPage = lazy(() => import("@/pages/registry-authority-portal"));
const CollateralVerifyPage = lazy(() => import("@/pages/collateral-verify"));
const InstitutionAnalyticsPage = lazy(() => import("@/pages/institution-analytics"));
const InstitutionBrandingPage = lazy(() => import("@/pages/institution-branding"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

class LazyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground text-sm">Failed to load this page.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-retry-load"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <LazyErrorBoundary>
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/borrowers" component={BorrowersPage} />
        <Route path="/borrowers/:id" component={BorrowerDetailPage} />
        <Route path="/consumers" component={ConsumersPage} />
        <Route path="/consumers/:id" component={ConsumerDetailPage} />
        <Route path="/businesses" component={BusinessesPage} />
        <Route path="/businesses/:id" component={BusinessDetailPage} />
        <Route path="/telco-scoring" component={TelcoScoringPage} />
        <Route path="/telco-lending" component={TelcoLendingPage} />
        <Route path="/credit-accounts" component={CreditAccountsPage} />
        <Route path="/dishonoured-cheques" component={DishonouredChequesPage} />
        <Route path="/court-judgments" component={CourtJudgmentsPage} />
        <Route path="/search" component={CreditSearchPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/audit" component={AuditTrailPage} />
        <Route path="/find-connections" component={FindConnectionsPage} />
        <Route path="/collections" component={CollectionsPage} />
        <Route path="/users" component={UserManagementPage} />
        <Route path="/approvals" component={PendingApprovalsPage} />
        <Route path="/disputes" component={DisputesPage} />
        <Route path="/batch-upload" component={BatchUploadPage} />
        <Route path="/institutions" component={InstitutionsPage} />
        <Route path="/consent" component={ConsentManagementPage} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/helpdesk" component={HelpdeskPage} />
        <Route path="/credit-report/:borrowerId" component={CreditReportPage} />
        <Route path="/business-credit-report/:borrowerId" component={BusinessCreditReportPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        <Route path="/api-docs" component={ApiDocsPage} />
        <Route path="/help" component={OnlineManualPage} />
        <Route path="/documentation" component={DocumentationPage} />
        <Route path="/exchange-rates" component={ExchangeRatesPage} />
        <Route path="/api-admin" component={ApiAdminPage} />
        <Route path="/retention-policies" component={RetentionPoliciesPage} />
        <Route path="/data-management" component={DataManagementPage} />
        <Route path="/regulatory-compliance" component={RegulatoryCompliancePage} />
        <Route path="/bog-export" component={BogExportPage} />
        <Route path="/bsl-export" component={BslExportPage} />
        <Route path="/version-history" component={VersionHistoryPage} />
        <Route path="/guide" component={AppGuidePage} />
        <Route path="/training" component={TrainingCenterPage} />
        <Route path="/loan-origination" component={LoanOriginationPage} />
        <Route path="/collateral-registry" component={CollateralRegistryPage} />
        <Route path="/registry-authority-portal" component={RegistryAuthorityPortalPage} />
        <Route path="/institution-analytics" component={InstitutionAnalyticsPage} />
        <Route path="/institution-branding" component={InstitutionBrandingPage} />
        <Route path="/organizations" component={OrganizationsPage} />
        <Route path="/ghana-docs" component={GhanaDocsPage} />
        <Route path="/partner-docs" component={PartnerDocsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/legal" component={LegalCopyrightPage} />
        <Route path="/portfolio-intelligence" component={PortfolioIntelligencePage} />
        <Route path="/portfolio-triggers" component={PortfolioTriggersPage} />
        <Route path="/ai-command-center" component={AICommandCenterPage} />
        <Route path="/command-center" component={CommandCenterPage} />
        <Route path="/command-center/:rest*" component={CommandCenterPage} />
        <Route path="/command-center-settings" component={CommandCenterPage} />
        <Route path="/credit-score-methodology" component={CreditScoreMethodologyPage} />
        <Route path="/regulatory-dashboard" component={RegulatoryDashboardPage} />
        <Route path="/borrower-alerts" component={BorrowerAlertsPage} />
        <Route path="/cross-border-agreements" component={CrossBorderAgreementsPage} />
        <Route path="/cross-border-search" component={CrossBorderSearchPage} />
        <Route path="/papss-settlements" component={PapssSettlementsPage} />
        <Route path="/system-status" component={SystemStatusPage} />
        <Route path="/backup" component={BackupPage} />
        <Route path="/platform-metrics" component={PlatformMetricsPage} />
        <Route path="/webhook-management" component={WebhookManagementPage} />
        <Route path="/presentation" component={PresentationPage} />
        <Route path="/portal" component={PortalPage} />
        <Route path="/decision-engine" component={DecisionEnginePage} />
        <Route path="/platform-control-9x7k" component={PlatformMasterControlPage} />
        <Route path="/compliance-queue" component={ComplianceQueuePage} />
        <Route path="/upgrade">
          {() => (
            <Suspense fallback={<LazyFallback />}>
              <UpgradePage />
            </Suspense>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </LazyErrorBoundary>
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
            If you believe this is an error, please contact support at <span className="font-medium">{PLATFORM_SUPPORT_EMAIL}</span>
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
  const { user, isLoading, logout, passwordExpired, accountSuspended, accountPendingReview } = useAuth();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [passkeyBanner, setPasskeyBanner] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);

  useEffect(() => {
    if (!user) return;
    const shouldPrompt = sessionStorage.getItem("passkey_prompt") === "1";
    const dismissed = sessionStorage.getItem("passkey_banner_dismissed") === "1";
    if (!shouldPrompt || dismissed) return;
    sessionStorage.removeItem("passkey_prompt");
    fetch("/api/auth/webauthn/credentials", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((creds: any[]) => {
        if (!creds || creds.length === 0) setPasskeyBanner(true);
      })
      .catch(() => {});
  }, [user]);

  const handleRegisterPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      await apiRequest("DELETE", "/api/auth/webauthn/credentials/all");
      const optRes = await apiRequest("POST", "/api/auth/webauthn/register-options");
      const options = await optRes.json();
      const { startRegistration } = await import("@simplewebauthn/browser");
      const credential = await startRegistration({ optionsJSON: options });
      const verRes = await apiRequest("POST", "/api/auth/webauthn/register-verify", credential);
      if (!verRes.ok) {
        const err = await verRes.json();
        throw new Error(err.message || "Registration failed");
      }
      const result = await verRes.json();
      setPasskeyBanner(false);
      setPasskeyRegistered(true);
      toast({ title: "Fingerprint saved!", description: `You can now sign in with your fingerprint — no password needed.` });
      setTimeout(() => setPasskeyRegistered(false), 6000);
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        toast({ title: "Cancelled", description: "Fingerprint setup was dismissed.", variant: "destructive" });
      } else {
        toast({ title: "Setup failed", description: e.message || "Please try again.", variant: "destructive" });
      }
    } finally {
      setPasskeyRegistering(false);
    }
  };
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const countryTheme = useCountryTheme();
  const [rawPath, navigate] = useLocation();
  const currentPath = rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

  useEffect(() => {
    if (rawPath.length > 1 && rawPath.endsWith("/")) {
      navigate(currentPath, { replace: true });
    }
  }, [rawPath, currentPath, navigate]);

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

  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  const doRedirect = (url: string) => {
    if (!redirecting) {
      setRedirecting(true);
      window.location.replace(url);
      setTimeout(() => {
        if (window.location.pathname !== url) {
          window.location.href = url;
        }
      }, 1500);
    }
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  };

  if (redirecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (currentPath === "/platform-control-9x7k") {
    return <Suspense fallback={<LazyFallback />}><PlatformMasterControlPage /></Suspense>;
  }

  const publicPaths = ["/", "/investor", "/solutions", "/ai-demo", "/pricing", "/security", "/security-compliance", "/terms", "/privacy", "/market-validation", "/start-trial", "/signup", "/score-guide", "/my-credit", "/api-docs", "/consumer/register", "/contact-sales", "/portal", "/partner-docs"];
  if (!user) {
    if (currentPath === "/login") {
      return <LoginPage />;
    }
    if (publicPaths.includes(currentPath) || currentPath.startsWith("/verify/")) {
      return doRedirect(currentPath);
    }
    return doRedirect("/login");
  }

  if (currentPath === "/login") {
    let dest = "/dashboard";
    if (user.role === "super_admin") dest = "/command-center";
    else if (user?.organization?.type === "registry_authority") dest = "/registry-authority-portal";
    else if (user.division === "corporate") dest = "/businesses";
    else if (user.division === "telco") dest = "/telco-scoring";
    else if (user.division === "retail") dest = "/consumers";
    return doRedirect(dest);
  }

  if (accountSuspended) {
    return <SuspendedScreen orgName={user?.organization?.name} onLogout={logout} />;
  }

  const orgStatus = user?.organization?.status;
  const isPendingOrg = accountPendingReview || orgStatus === "pending";
  const isDeactivatedOrg = orgStatus === "deactivated";

  if (isDeactivatedOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl border border-red-500/30 bg-red-500/5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-rejected-title">Registration Not Approved</h1>
          <p className="text-sm text-muted-foreground">
            Your institution registration was not approved by the registry administrator. If you believe this is an error, please contact support.
          </p>
          <Button variant="outline" onClick={logout} data-testid="button-rejected-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (isPendingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-pending-title">Registration Under Review</h1>
          <p className="text-sm text-muted-foreground">
            Your institution registration for <span className="font-medium text-foreground">{user?.organization?.name || "your organization"}</span> is currently being reviewed by the registry administrator.
          </p>
          <p className="text-xs text-muted-foreground">You will receive an email notification once your application has been approved.</p>
          <Button variant="outline" onClick={logout} data-testid="button-pending-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const viewingCountry = user?.viewingCountry;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {isMobile ? (
            <header className="flex items-center justify-between px-3 py-2 border-b shrink-0 ltr-header h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
                <span className="text-sm font-bold tracking-tight truncate max-w-[140px]" data-testid="text-mobile-brand">Africa Credit Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0" data-testid="button-mobile-user-menu">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium" data-testid="text-current-user">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "super_admin" && !currentPath.startsWith("/command-center") && (
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={async () => {
                          try {
                            await apiRequest("POST", "/api/platform/set-country", { country: "command_center" });
                            queryClient.setQueryData(["/api/auth/me"], (old: any) => old ? { ...old, viewingCountry: null } : old);
                            await queryClient.invalidateQueries({
                              predicate: (q) => {
                                const key = q.queryKey[0] as string;
                                return !!key && !key.startsWith("/api/auth/");
                              },
                              refetchType: "all",
                            });
                            window.location.href = "/command-center";
                          } catch { window.location.href = "/command-center"; }
                        }}
                        data-testid="button-command-center"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        Command Center
                      </DropdownMenuItem>
                    )}
                    {user.role === "super_admin" && (
                      <>
                        <DropdownMenuItem className="gap-2 p-0" onSelect={(e) => e.preventDefault()}>
                          <div className="w-full"><CountrySelector /></div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 p-0" onSelect={(e) => e.preventDefault()}>
                          <div className="w-full"><OrgSwitcher /></div>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-0" onSelect={(e) => e.preventDefault()}>
                      <div className="flex items-center gap-2 px-2 py-1.5 w-full">
                        <ThemeToggle />
                        <LanguageSwitcher />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => setMfaOpen(true)}
                      data-testid="button-mobile-mfa"
                    >
                      <Shield className="w-4 h-4" />
                      {user.mfaEnabled ? "Manage MFA" : "Enable MFA"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={handleRegisterPasskey}
                      disabled={passkeyRegistering}
                      data-testid="button-mobile-passkey"
                    >
                      <Fingerprint className="w-4 h-4" />
                      {passkeyRegistering ? "Setting up…" : "Set Up Fingerprint Login"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={async () => {
                        try { await logout(); } catch { window.location.href = "/"; }
                      }}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          ) : (
            <header className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b shrink-0 ltr-header">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
              {user.role === "super_admin" && !currentPath.startsWith("/command-center") && (
                <Button
                  variant="outline"
                  className="h-10 gap-2 text-base font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-4"
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
                          return !!key && !key.startsWith("/api/auth/");
                        },
                        refetchType: "all",
                      });
                      window.location.href = "/command-center";
                    } catch {
                      window.location.href = "/command-center";
                    }
                  }}
                  data-testid="button-command-center"
                >
                  <LayoutGrid className="w-5 h-5 shrink-0" />
                  Command Center
                </Button>
              )}
              {user.role === "super_admin" && <CountrySelector />}
              {user.role === "super_admin" && <OrgSwitcher />}
              {user?.organization?.name && user.role !== "super_admin" && (
                <span className="text-base text-muted-foreground inline-flex items-center gap-2" data-testid="text-org-context">
                  <Building2 className="w-5 h-5" />
                  {user.organization!.name}
                </span>
              )}
              <span className="text-base text-muted-foreground" data-testid="text-current-user">
                {user.fullName}
              </span>
              <NotificationBell />
              <ThemeToggle />
              <LanguageSwitcher />
              <Button
                variant="outline"
                className="h-10 gap-2 shrink-0"
                onClick={() => setMfaOpen(true)}
                data-testid="button-mfa-setup"
              >
                <Shield className="w-4 h-4" />
                {user.mfaEnabled ? "MFA On" : "Enable MFA"}
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2 shrink-0"
                onClick={handleRegisterPasskey}
                disabled={passkeyRegistering}
                data-testid="button-passkey-register"
              >
                <Fingerprint className="w-4 h-4" />
                {passkeyRegistering ? "Setting up…" : "Set Up Fingerprint"}
              </Button>
              <Button
                variant="destructive"
                className="h-10 gap-2 text-base font-semibold px-5 shrink-0"
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                    window.location.href = "/";
                  }
                }}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </header>
          )}
          <main className={`flex-1 overflow-auto flex flex-col ${isMobile ? "pb-16" : ""}`}>
            <div className="flex-1">
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </div>
            <AppFooter />
          </main>
          {passwordExpired && <PasswordChangeDialog open={true} forced={true} />}
          <MfaSetupDialog open={mfaOpen} onOpenChange={setMfaOpen} mfaEnabled={!!user.mfaEnabled} />
        </div>
      </div>
      {isMobile && <MobileBottomNav />}
      {!chatbotOpen && (
        <button
          onClick={() => setChatbotOpen(true)}
          data-testid="button-open-chatbot"
          title={t('chatbot.title')}
          className={`fixed right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 bg-primary text-primary-foreground ${isMobile ? "bottom-20" : "bottom-5"}`}
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      <DisputeChatbot open={chatbotOpen} onOpenChange={setChatbotOpen} />
      <SessionTimeoutDialog />

      {passkeyBanner && (
        <div
          className="fixed bottom-24 right-5 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)", borderColor: "hsl(262 40% 85%)" }}
          data-testid="passkey-setup-banner"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(262 60% 92%)" }}>
                  <Fingerprint className="w-5 h-5" style={{ color: "hsl(262 50% 45%)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Set up fingerprint login</p>
                  <p className="text-xs text-slate-500 mt-0.5">Skip the password next time</p>
                </div>
              </div>
              <button
                onClick={() => { setPasskeyBanner(false); sessionStorage.setItem("passkey_banner_dismissed", "1"); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                data-testid="button-dismiss-passkey-banner"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-11">
              Touch your fingerprint sensor once to register — then sign in instantly on future visits.
            </p>

            <div className="pl-11 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>When the browser shows a QR code, click <strong>"This device"</strong> instead</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>Then touch your fingerprint sensor</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setPasskeyBanner(false); sessionStorage.setItem("passkey_banner_dismissed", "1"); }}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-all bg-white"
                data-testid="button-not-now-passkey"
              >
                Not now
              </button>
              <button
                onClick={handleRegisterPasskey}
                disabled={passkeyRegistering}
                className="flex-1 h-9 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, hsl(262 55% 55%) 0%, hsl(215 55% 50%) 100%)" }}
                data-testid="button-setup-fingerprint"
              >
                {passkeyRegistering ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5" />
                    Set up fingerprint
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {passkeyRegistered && (
        <div
          className="fixed bottom-24 right-5 z-50 w-80 rounded-2xl shadow-xl border overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(142 70% 96%) 0%, hsl(142 60% 93%) 100%)", borderColor: "hsl(142 40% 80%)" }}
          data-testid="passkey-success-banner"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 60% 88%)" }}>
              <svg className="w-5 h-5" style={{ color: "hsl(142 50% 35%)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "hsl(142 40% 25%)" }}>Fingerprint saved!</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(142 30% 40%)" }}>Next time, just tap "Use Fingerprint" at login.</p>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function PublicChatbotWrapper() {
  const [location] = useLocation();
  const publicPaths = ["/", "/solutions", "/investor", "/ai-demo", "/pricing", "/security", "/security-compliance", "/terms", "/privacy", "/market-validation", "/start-trial", "/signup", "/my-credit", "/api-docs", "/consumer/register", "/contact-sales", "/portal", "/partner-docs"];
  if (!publicPaths.includes(location)) return null;
  return <PublicChatbot />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/" component={() => <Suspense fallback={<LazyFallback />}><InvestorLandingPage /></Suspense>} />
            <Route path="/investor" component={() => <Suspense fallback={<LazyFallback />}><InvestorLandingPage /></Suspense>} />
            <Route path="/solutions" component={() => <Suspense fallback={<LazyFallback />}><InvestorLandingPage /></Suspense>} />

            <Route path="/ai-demo" component={() => <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}><AIDemoPage /></Suspense>} />
            <Route path="/pricing" component={() => <Suspense fallback={<LazyFallback />}><PricingPage /></Suspense>} />
            <Route path="/contact-sales" component={() => <Suspense fallback={<LazyFallback />}><ContactSalesPage /></Suspense>} />
            <Route path="/security" component={() => <Suspense fallback={<LazyFallback />}><SecurityCompliancePage /></Suspense>} />
            <Route path="/security-compliance" component={() => <Suspense fallback={<LazyFallback />}><SecurityCompliancePage /></Suspense>} />
            <Route path="/terms" component={() => <Suspense fallback={<LazyFallback />}><TermsOfServicePage /></Suspense>} />
            <Route path="/privacy" component={() => <Suspense fallback={<LazyFallback />}><PrivacyPolicyPage /></Suspense>} />
            <Route path="/market-validation" component={() => <Suspense fallback={<LazyFallback />}><MarketValidationPage /></Suspense>} />
            <Route path="/start-trial" component={() => <Suspense fallback={<LazyFallback />}><StartTrialPage /></Suspense>} />
            <Route path="/signup" component={() => <Suspense fallback={<LazyFallback />}><SignUpPage /></Suspense>} />
            <Route path="/score-guide" component={() => <Suspense fallback={<LazyFallback />}><ScoreGuidePage /></Suspense>} />
            <Route path="/api-docs" component={() => <Suspense fallback={<LazyFallback />}><ApiDocsPage /></Suspense>} />
            <Route path="/partner-docs" component={() => <Suspense fallback={<LazyFallback />}><PartnerDocsPage /></Suspense>} />
            <Route path="/portal" component={() => <Suspense fallback={<LazyFallback />}><PortalPage /></Suspense>} />
            <Route path="/platform-control-9x7k" component={() => <Suspense fallback={<LazyFallback />}><PlatformMasterControlPage /></Suspense>} />
            <Route path="/verify/:code">
              <Suspense fallback={<LazyFallback />}>
                <CollateralVerifyPage />
              </Suspense>
            </Route>
            <Route path="/consent/respond">
              <Suspense fallback={<LazyFallback />}>
                <ConsentRespondPage />
              </Suspense>
            </Route>
            <Route path="/consumer/register">
              <Suspense fallback={<LazyFallback />}>
                <ConsumerPortalPage />
              </Suspense>
            </Route>
            <Route path="/login">
              <AuthProvider>
                <OrgSwitcherProvider>
                  <CountryThemeProvider>
                    <AuthenticatedApp />
                  </CountryThemeProvider>
                </OrgSwitcherProvider>
              </AuthProvider>
            </Route>
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
          <TrialBanner />
          <PWAInstallPrompt />
          <PublicChatbotWrapper />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
