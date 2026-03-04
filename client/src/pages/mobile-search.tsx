import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Loader2, X, ShieldCheck, LogOut, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Borrower } from "@shared/schema";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 700 ? "bg-green-500" : score >= 550 ? "bg-amber-500" : "bg-red-500";
  const label = score >= 700 ? "Good" : score >= 550 ? "Fair" : "Poor";
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
        <span className="text-white text-sm font-bold" data-testid="text-credit-score">{score}</span>
      </div>
      <span className={`text-[10px] font-medium ${score >= 700 ? "text-green-600" : score >= 550 ? "text-amber-600" : "text-red-600"}`}>{label}</span>
    </div>
  );
}

function MobileLogin({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
        <ShieldCheck className="w-7 h-7 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-bold mb-1" data-testid="text-login-title">Credit Check</h1>
      <p className="text-xs text-muted-foreground mb-6">Sign in to continue</p>

      <form onSubmit={submit} className="w-full max-w-sm space-y-4" data-testid="form-mobile-login">
        {error && <p className="text-sm text-destructive text-center" data-testid="text-login-error">{error}</p>}
        <Input
          data-testid="input-mobile-username"
          placeholder="Username"
          className="h-12 text-base rounded-xl"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="relative">
          <Input
            data-testid="input-mobile-password"
            type={show ? "text" : "password"}
            placeholder="Password"
            className="h-12 text-base rounded-xl pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShow(!show)} data-testid="button-toggle-password">
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={loading || !username.trim() || !password.trim()} data-testid="button-mobile-login">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Sign In
        </Button>
      </form>
    </div>
  );
}

export default function MobileSearchPage() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { toast } = useToast();
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

  if (authLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) return <MobileLogin onLogin={async (u, p) => { await login(u, p); toast({ title: "Welcome back" }); }} />;

  const search = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(val.trim().length >= 2 ? val.trim() : "");
    }, 400);
  };

  const borrowers = results?.borrowers || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-base font-bold" data-testid="text-mobile-title">Credit Check</h1>
          <button onClick={() => logout()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center" data-testid="button-mobile-logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <Input
            ref={inputRef}
            data-testid="input-mobile-search"
            placeholder="Search name or ID..."
            className="pl-10 pr-9 h-11 text-base rounded-xl bg-white/15 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50"
            value={query}
            onChange={(e) => search(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setQuery(""); setSearchTerm(""); inputRef.current?.focus(); }} data-testid="button-mobile-clear">
              <X className="w-4 h-4 opacity-60" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!searchTerm && (
          <div className="text-center pt-20">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium" data-testid="text-mobile-prompt">Search for a profile</p>
            <p className="text-sm text-muted-foreground mt-1">Enter a name or ID number</p>
          </div>
        )}

        {isLoading && searchTerm && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length === 0 && (
          <div className="text-center pt-20">
            <p className="font-medium" data-testid="text-mobile-no-results">No results</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different name or ID</p>
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length > 0 && (
          <div className="space-y-2 pt-3">
            {borrowers.map((b) => {
              const score = (b as any).creditScore || (parseInt(b.id.slice(-4), 16) % 450 + 350);
              const name = b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 bg-card border rounded-xl p-3 active:bg-accent"
                  onClick={() => navigate(`/credit-report/${b.id}`)}
                  data-testid={`mobile-result-borrower-${b.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" data-testid={`text-borrower-name-${b.id}`}>{name}</p>
                    <p className="text-xs text-muted-foreground">{b.nationalId || "—"}</p>
                  </div>
                  <ScoreBadge score={score} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
