import { Building2, User } from "lucide-react";
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
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[400px] cursor-pointer transition-transform hover:scale-[1.02]"
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
              <h2 className="text-2xl font-bold text-white mb-3">Business & Lender Portal</h2>
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
                style={{ background: brandColors.primary || "#8b5cf6" }}
                data-testid="button-portal-business-login"
              >
                Sign In as Institution
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/signup"); }}
                className="w-full text-center text-sm text-white/50 hover:text-white/70 transition-colors"
                data-testid="link-portal-business-register"
              >
                Register your institution &rarr;
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[400px] cursor-pointer transition-transform hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={() => navigate("/my-credit")}
            data-testid="card-consumer-portal"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                background: "rgba(139,92,246,0.1)",
              }}>
                <User className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Personal Credit Portal</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Check your own credit score, view your full report, and raise disputes — free of charge
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Free Credit Report", "Dispute Management", "Score Tracking"].map(pill => (
                  <span key={pill} className="text-[11px] px-3 py-1.5 rounded-full text-white/70" style={{
                    background: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.15)",
                  }}>{pill}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/my-credit"); }}
                className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" }}
                data-testid="button-portal-consumer-login"
              >
                Check My Credit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/consumer/register"); }}
                className="w-full text-center text-sm text-white/50 hover:text-white/70 transition-colors"
                data-testid="link-portal-consumer-register"
              >
                Create free account &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-6">
        <p className="text-[11px] text-white/30">
          Africa Credit Hub &middot; Pan-African Credit Registry &mdash;{" "}
          <a href="/solutions" className="hover:text-white/50 underline" data-testid="link-back-solutions">Back to Solutions</a>
        </p>
      </div>
    </div>
  );
}
