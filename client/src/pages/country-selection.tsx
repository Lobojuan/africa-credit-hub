import { useState } from "react";
import { useCountryTheme } from "@/components/country-theme-provider";
import { getSupportedCountries } from "@/lib/country-mode";
import { Globe, Loader2, LogOut, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

function CountryDot({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  const colors: Record<string, string> = {
    GH: "bg-emerald-500",
    LR: "bg-red-500",
    SL: "bg-green-500",
    NG: "bg-green-600",
    KE: "bg-red-600",
    RW: "bg-blue-500",
    TZ: "bg-blue-600",
    UG: "bg-yellow-500",
    ET: "bg-green-700",
    ZA: "bg-blue-700",
  };
  const sizeClass = size === "lg" ? "w-4 h-4" : size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";
  return <div className={`${sizeClass} rounded-full ${colors[code] || "bg-gray-400"} shrink-0`} />;
}

export default function CountrySelectionPage() {
  const { setCountry, isSwitching } = useCountryTheme();
  const { user, logout } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const countries = getSupportedCountries();

  const handleSelect = async (countryName: string | null) => {
    setSelectedCountry(countryName);
    await setCountry(countryName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(42 85% 55%) 0%, hsl(32 78% 46%) 100%)",
              boxShadow: "0 4px 16px -2px hsl(42 85% 53% / 0.4)"
            }}
          >
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Pan-African Credit Registry</p>
            <p className="text-[10px] text-slate-400">Carlson Capital & Systems In Motion Limited</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-8 gap-1.5"
            onClick={() => logout()}
            data-testid="button-logout-country-selection"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Platform Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-country-selection-title">
              Select Your Jurisdiction
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Welcome back, {user?.fullName}. Choose a country to manage, or view all jurisdictions at once.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSelect(null)}
              disabled={isSwitching}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/30 transition-all duration-200 group"
              data-testid="button-select-global-view"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-white">Global View</p>
                <p className="text-xs text-slate-400">View and manage all {countries.length} jurisdictions</p>
              </div>
              {isSwitching && selectedCountry === null ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950 px-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Or select a country
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c.name)}
                  disabled={isSwitching}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 group text-left"
                  data-testid={`button-select-country-${c.code}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${c.theme.logoGradientFrom}, ${c.theme.logoGradientTo})`,
                      boxShadow: `0 2px 8px ${c.theme.logoGlow}`
                    }}
                  >
                    <CountryDot code={c.code} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{c.regulatoryBody} | {c.currency}</p>
                  </div>
                  {isSwitching && selectedCountry === c.name ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="p-4 text-center">
        <p className="text-[10px] text-slate-600">
          CDH v2.1 | Secured by Carlson Capital & Systems In Motion Limited
        </p>
      </footer>
    </div>
  );
}
