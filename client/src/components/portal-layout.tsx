import { useState, type ReactNode } from "react";
import { Globe, LogOut, Menu, X, User, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { isGhanaMode } from "@/lib/country-mode";

type PortalType = "consumer" | "business";

interface PortalLayoutProps {
  type: PortalType;
  children: ReactNode;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function PortalLayout({ type, children, isAuthenticated, userName, onLogout }: PortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isConsumer = type === "consumer";
  const portalLabel = isConsumer ? "My Credit" : "Business Portal";
  const portalIcon = isConsumer ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20" data-testid={`portal-layout-${type}`}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group" data-testid="portal-logo">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight leading-tight">
                {isGhanaMode() ? "Ghana Credit Registry" : "CDH Registry"}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">{portalLabel}</span>
            </div>
          </a>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground" data-testid="portal-type-badge">
              {portalIcon}
              <span>{portalLabel}</span>
            </div>
            {isAuthenticated && userName && (
              <span className="text-xs text-muted-foreground" data-testid="portal-user-name">{userName}</span>
            )}
            <ThemeToggle />
            {isAuthenticated && onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="h-8 gap-1.5 text-xs" data-testid="button-portal-logout">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            )}
            {!isAuthenticated && (
              <a href="/login" data-testid="link-staff-login">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  Staff Login
                </Button>
              </a>
            )}
          </div>

          <button
            className="sm:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-portal-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-background px-4 py-3 space-y-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground">
              {portalIcon}
              <span>{portalLabel}</span>
            </div>
            {isAuthenticated && userName && (
              <p className="text-xs text-muted-foreground px-2">{userName}</p>
            )}
            <div className="flex items-center gap-2 px-2">
              <ThemeToggle />
            </div>
            {isAuthenticated && onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start h-8 gap-1.5 text-xs">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            )}
            {!isAuthenticated && (
              <a href="/login" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start h-8 gap-1.5 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  Staff Login
                </Button>
              </a>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-4 px-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          &copy; 2026 {isGhanaMode() ? "Ghana Credit Registry" : "CDH Registry"} &middot; All rights reserved
        </p>
      </footer>
    </div>
  );
}
