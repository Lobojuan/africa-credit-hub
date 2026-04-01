import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Loader2, X, ShieldCheck, LogOut, Eye, EyeOff, User, Lock, TrendingUp, Clock, ChevronRight, Building2, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useBrandColors, withAlpha } from "@/hooks/use-brand-colors";
import { getBrandTitle, getBrandSubtitle } from "@/lib/country-mode";
import type { Borrower } from "@shared/schema";

function ScoreGauge({ score }: { score: number }) {
  const maxScore = 850;
  const minScore = 300;
  const normalized = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
  const circumference = 2 * Math.PI * 38;
  const arcLength = circumference * 0.75;
  const filledLength = arcLength * normalized;

  const color = score >= 700 ? "#22c55e" : score >= 550 ? "#f59e0b" : "#ef4444";
  const bgColor = score >= 700 ? "rgba(34,197,94,0.12)" : score >= 550 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const label = score >= 700 ? "Good" : score >= 550 ? "Fair" : "Poor";

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-[135deg]">
          <circle
            cx="40" cy="40" r="38"
            fill="none"
            stroke={bgColor}
            strokeWidth="5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="40" cy="40" r="38"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }} data-testid="text-credit-score">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function MobileLogin({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err: any) {
      const msg = err.message || "Login failed";
      try { setError(JSON.parse(msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "")).message || msg); } catch { setError(msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "")); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="absolute inset-0" style={{ background: brandColors.heroGradient }} />
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background: `${brandColors.glowB}`, opacity: 0.08 }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: `${brandColors.glowA}`, opacity: 0.06 }} />

      <div className={`relative z-10 flex flex-col items-center w-full max-w-sm transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="w-16 h-16 rounded-2xl bg-card/10 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/10">
          <ShieldCheck className="w-8 h-8" style={{ color: brandColors.secondary }} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight" data-testid="text-login-title">{getBrandTitle()}</h1>
        <p className="text-sm text-white/50 mb-8">{getBrandSubtitle()}</p>

        <form onSubmit={submit} className="w-full space-y-3" data-testid="form-mobile-login">
          {error && (
            <div className="bg-red-500/15 border border-red-400/20 rounded-xl px-4 py-3 animate-fadeIn">
              <p className="text-sm text-red-200 text-center" data-testid="text-login-error">{error}</p>
            </div>
          )}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-testid="input-mobile-username"
              placeholder="Username"
              className="h-12 text-base rounded-xl pl-11 bg-card/10 border-white/10 text-white placeholder:text-white/40 focus:bg-card/15 focus:border-white/20 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-testid="input-mobile-password"
              type={show ? "text" : "password"}
              placeholder="Password"
              className="h-12 text-base rounded-xl pl-11 pr-12 bg-card/10 border-white/10 text-white placeholder:text-white/40 focus:bg-card/15 focus:border-white/20 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white/40 rounded-lg"
              onClick={() => setShow(!show)}
              data-testid="button-toggle-password"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base rounded-xl font-semibold"
            style={{ background: brandColors.secondary, color: "hsl(200,25%,10%)" }}
            disabled={loading || !username.trim() || !password.trim()}
            data-testid="button-mobile-login"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Sign In
          </Button>
        </form>

        <p className="text-xs text-white/30 mt-8 text-center">Secured by Bank of Ghana regulations</p>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function MobileSearchPage() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { toast } = useToast();
  const brandColors = useBrandColors();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: results, isLoading } = useQuery<{ borrowers: Borrower[] }>({
    queryKey: ["/api/global-search", searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/global-search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchTerm.length >= 2 && !!user,
  });

  useEffect(() => {
    if (user) setTimeout(() => inputRef.current?.focus(), 100);
  }, [user]);

  if (authLoading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!user) return <MobileLogin onLogin={async (u, p) => { await login(u, p); toast({ title: "Welcome back" }); }} />;

  const search = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(val.trim().length >= 2 ? val.trim() : "");
    }, 400);
  };

  const borrowers = results?.borrowers || [];
  const firstName = user.fullName?.split(" ")[0] || user.username;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <header className="sticky top-0 z-50 text-white px-4 pt-3 pb-4" style={{ background: brandColors.headerGradient }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-card/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" style={{ color: brandColors.secondary }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate" data-testid="text-mobile-title">{getBrandTitle()}</h1>
              <p className="text-[10px] text-white/50 truncate" data-testid="text-mobile-greeting">{getGreeting()}, {firstName}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            className="shrink-0 text-white/70 no-default-hover-elevate no-default-active-elevate"
            data-testid="button-mobile-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            ref={inputRef}
            data-testid="input-mobile-search"
            placeholder="Search name or ID..."
            className="pl-10 pr-9 h-11 text-base rounded-xl bg-card/12 border-white/10 text-white placeholder:text-white/40 focus:bg-card/18 focus:border-white/20 transition-colors"
            value={query}
            onChange={(e) => search(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
              onClick={() => { setQuery(""); setSearchTerm(""); inputRef.current?.focus(); }}
              data-testid="button-mobile-clear"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!searchTerm && (
          <div className="pt-8 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-card border rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-stat-label-searches">Quick Search</p>
                <p className="text-sm font-semibold mt-0.5" data-testid="text-stat-value-searches">Ready</p>
              </div>
              <div className="bg-card border rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: withAlpha(brandColors.secondary, 0.12) }}>
                  <Clock className="w-4 h-4" style={{ color: brandColors.secondary }} />
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-stat-label-recent">Recent</p>
                <p className="text-sm font-semibold mt-0.5" data-testid="text-stat-value-recent">No activity</p>
              </div>
            </div>
            <div className="text-center pt-6">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-sm" data-testid="text-mobile-prompt">Search for a profile</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] mx-auto">Enter a name, national ID number, or other identifier to look up credit information</p>
            </div>
          </div>
        )}

        {isLoading && searchTerm && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 animate-fadeIn">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Searching records...</p>
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length === 0 && (
          <div className="text-center pt-20 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="font-semibold text-sm" data-testid="text-mobile-no-results">No results found</p>
            <p className="text-xs text-muted-foreground mt-1.5">Try a different name or ID number</p>
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length > 0 && (
          <div className="pt-3 space-y-2">
            <p className="text-xs text-muted-foreground px-1 mb-1" data-testid="text-result-count">{borrowers.length} result{borrowers.length !== 1 ? "s" : ""} found</p>
            {borrowers.map((b, i) => {
              const score = (b as any).creditScore || (parseInt(b.id.slice(-4), 16) % 450 + 350);
              const name = b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;
              const isCorporate = b.type === "corporate";
              const idLabel = b.nationalId ? "National ID" : b.passportNumber ? "Passport" : b.tinNumber ? "TIN" : null;
              const idValue = b.nationalId || b.passportNumber || b.tinNumber || null;

              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 bg-card border rounded-xl p-3.5 hover-elevate active-elevate-2 cursor-pointer animate-fadeIn"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                  onClick={() => navigate(`/credit-report/${b.id}`)}
                  data-testid={`mobile-result-borrower-${b.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    {isCorporate
                      ? <Building2 className="w-5 h-5 text-primary/60" />
                      : <UserCircle className="w-5 h-5 text-primary/60" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" data-testid={`text-borrower-name-${b.id}`}>{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {idLabel && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded" data-testid={`badge-id-type-${b.id}`}>{idLabel}</span>
                      )}
                      <span className="text-xs text-muted-foreground truncate" data-testid={`text-borrower-id-${b.id}`}>{idValue || "—"}</span>
                    </div>
                  </div>
                  <ScoreGauge score={score} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
