import { Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useBrandColors } from "@/hooks/use-brand-colors";

export default function PortalPage() {
  const [, navigate] = useLocation();
  const brandColors = useBrandColors();

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-portal" style={{
      background: "linear-gradient(160deg, #0a0e1a 0%, #0d1524 30%, #0f1a2e 60%, #0a1220 100%)",
    }}>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <div
            className="rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[400px] cursor-pointer transition-transform hover:scale-[1.01]"
            style={{
              background: brandColors.headerGradientSubtle || "linear-gradient(135deg, #1a1f35 0%, #0d1a2d 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={() => navigate("/login")}
            data-testid="card-business-portal"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                background: "rgba(255,255,255,0.08)",
              }}>
                <Building2 className="w-8 h-8 text-white/80" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Credit Scoring Portal</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Access credit bureau data, run searches, manage portfolios and generate reports
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Credit Bureau Access", "Portfolio Intelligence", "Regulatory Reports"].map(pill => (
                  <span key={pill} className="text-[11px] px-3 py-1.5 rounded-full text-white/70" style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>{pill}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/login"); }}
                className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: brandColors.accent || "#8b5cf6" }}
                data-testid="button-portal-business-login"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-6">
        <p className="text-[11px] text-white/30">
          Universal Credit Hub &middot; Pan-African Credit Registry
        </p>
      </div>
    </div>
  );
}
