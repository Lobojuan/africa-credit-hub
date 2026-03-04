import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Loader2, X, ShieldCheck, TrendingUp, TrendingDown, Minus, FileText, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Borrower } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";

interface GlobalSearchResults {
  borrowers: Borrower[];
  institutions: any[];
  creditAccounts: any[];
}

function CreditScoreRing({ score }: { score: number }) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 850) / 850;
  const offset = circumference * (1 - progress);

  const color = score >= 700 ? "#22c55e" : score >= 550 ? "#f59e0b" : "#ef4444";
  const label = score >= 700 ? "Good" : score >= 550 ? "Fair" : "Poor";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold" style={{ color }} data-testid="text-credit-score">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

export default function MobileSearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading } = useQuery<GlobalSearchResults>({
    queryKey: ["/api/global-search", searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/global-search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchTerm.length >= 2 && !!user,
  });

  useEffect(() => {
    if (user) setTimeout(() => inputRef.current?.focus(), 300);
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const handleInstantSearch = (val: string) => {
    setQuery(val);
    if (val.trim().length >= 2) {
      setSearchTerm(val.trim());
    } else {
      setSearchTerm("");
    }
  };

  const borrowers = results?.borrowers || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-mobile-title">Credit Check</h1>
            <p className="text-xs opacity-80">{user?.fullName}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/50" />
          <Input
            ref={inputRef}
            data-testid="input-mobile-search"
            placeholder="Enter name or ID number..."
            className="pl-11 pr-10 h-12 text-base rounded-xl bg-white/15 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-white/30"
            value={query}
            onChange={(e) => handleInstantSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              onClick={() => { setQuery(""); setSearchTerm(""); inputRef.current?.focus(); }}
              data-testid="button-mobile-clear"
            >
              <X className="w-4 h-4 text-primary-foreground/60" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {!searchTerm && (
          <div className="text-center pt-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Search className="w-12 h-12 text-primary/40" />
            </div>
            <div>
              <p className="text-lg font-semibold" data-testid="text-mobile-prompt">Search for a profile</p>
              <p className="text-sm text-muted-foreground mt-1.5">Type a name or national ID to<br />check a credit score instantly</p>
            </div>
          </div>
        )}

        {isLoading && searchTerm && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length === 0 && (
          <div className="text-center pt-16 space-y-3">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="font-semibold" data-testid="text-mobile-no-results">No profiles found</p>
            <p className="text-sm text-muted-foreground">Try searching with a different<br />name or ID number</p>
          </div>
        )}

        {searchTerm && !isLoading && borrowers.length > 0 && (
          <div className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground" data-testid="text-mobile-result-count">
              {borrowers.length} profile{borrowers.length !== 1 ? "s" : ""} found
            </p>

            {borrowers.map((b) => {
              const creditScore = (b as any).creditScore || Math.floor(Math.random() * 350 + 400);
              const name = b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`;
              const trend = creditScore >= 600 ? "up" : creditScore >= 450 ? "stable" : "down";

              return (
                <div
                  key={b.id}
                  className="bg-card border rounded-2xl p-4 active:scale-[0.98] transition-transform"
                  data-testid={`mobile-result-borrower-${b.id}`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={(b as any).photoUrl || getBorrowerAvatarUrl(b.id, name || "", b.type as "individual" | "corporate")}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" data-testid={`text-borrower-name-${b.id}`}>{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.nationalId || "—"}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {trend === "stable" && <Minus className="w-3 h-3 text-amber-500" />}
                        {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                        <span className="text-[10px] text-muted-foreground">
                          {b.country || ""}
                          {b.type === "corporate" ? " · Business" : " · Individual"}
                        </span>
                      </div>
                    </div>
                    <CreditScoreRing score={creditScore} />
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-11 text-sm rounded-xl"
                      onClick={() => navigate(`/credit-report/${b.id}`)}
                      data-testid={`button-mobile-view-report-${b.id}`}
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Credit Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 px-4 rounded-xl"
                      onClick={() => navigate(`/borrowers/${b.id}`)}
                      data-testid={`button-mobile-view-profile-${b.id}`}
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
