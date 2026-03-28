import { Globe, Mail, Phone, MapPin } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/30 dark:bg-muted/10 mt-auto" data-testid="app-footer">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-700">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground" data-testid="footer-brand">Carlson Capital & Systems In Motion Limited</h3>
                <p className="text-[11px] text-muted-foreground">Pan-African Credit Registry Platform</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering financial inclusion across Africa through centralized credit information, AI-driven risk assessment, and cross-border data sharing.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Leadership</h4>
            <div className="space-y-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground" data-testid="footer-ceo">Uffe Jon Carlson</p>
                <p className="text-xs text-muted-foreground">CEO, Carlson Capital</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground" data-testid="footer-cto">Thomas Baafi</p>
                <p className="text-xs text-muted-foreground">CTO, Systems In Motion Limited (Bsystems)</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-xs text-muted-foreground" data-testid="footer-location">Accra, Ghana</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-xs text-muted-foreground" data-testid="footer-regions">Serving 54 African Nations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground/60" data-testid="footer-copyright">
            &copy; 2024–2026 Carlson Capital & Systems In Motion Limited. All rights reserved.
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Cross-Jurisdictional Central Data Hub v2.0
          </p>
        </div>
      </div>
    </footer>
  );
}
