import "./lib/i18n";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import BorrowersPage from "@/pages/borrowers";
import BorrowerDetailPage from "@/pages/borrower-detail";
import CreditAccountsPage from "@/pages/credit-accounts";
import CreditSearchPage from "@/pages/credit-search";
import ReportsPage from "@/pages/reports";
import AuditTrailPage from "@/pages/audit-trail";
import UserManagementPage from "@/pages/user-management";
import PendingApprovalsPage from "@/pages/pending-approvals";
import DisputesPage from "@/pages/disputes";
import BatchUploadPage from "@/pages/batch-upload";
import InstitutionsPage from "@/pages/institutions";
import ConsentManagementPage from "@/pages/consent-management";
import BillingPage from "@/pages/billing";
import HelpdeskPage from "@/pages/helpdesk";

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, logout, passwordExpired } = useAuth();

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

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline" data-testid="text-current-user">
                {user.fullName} ({user.role})
              </span>
              <LanguageSwitcher />
              <NotificationBell />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
          {passwordExpired && <PasswordChangeDialog open={true} forced={true} />}
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
