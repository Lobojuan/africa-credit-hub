import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, User, CreditCard, ChevronRight, ArrowLeft, FileText, Landmark, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Borrower, Institution, CreditAccount } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";

interface GlobalSearchResults {
  borrowers: Borrower[];
  institutions: Institution[];
  creditAccounts: CreditAccount[];
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSearchTerm(query.trim());
    }
  };

  const handleInstantSearch = (val: string) => {
    setQuery(val);
    if (val.trim().length >= 2) {
      setSearchTerm(val.trim());
    }
  };

  const totalResults = (results?.borrowers?.length || 0) + (results?.institutions?.length || 0) + (results?.creditAccounts?.length || 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => navigate("/")}
          data-testid="button-mobile-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" data-testid="text-mobile-title">Credit Search</p>
          <p className="text-[10px] text-muted-foreground truncate">{user?.fullName}</p>
        </div>
        {user?.role === "super_admin" && <OrgSwitcher />}
        <ThemeToggle />
      </header>

      <div className="px-4 py-4">
        <form onSubmit={handleSearch} className="relative" data-testid="form-mobile-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            data-testid="input-mobile-search"
            placeholder="Search by name, ID, passport, company..."
            className="pl-11 pr-10 h-12 text-base rounded-xl"
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
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {!searchTerm && (
          <div className="text-center pt-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-primary/50" />
            </div>
            <div>
              <p className="text-base font-medium" data-testid="text-mobile-prompt">Search for a client</p>
              <p className="text-sm text-muted-foreground mt-1">Enter a name, national ID, passport,<br />or company name to get started</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {["National ID", "Name", "Passport", "Company"].map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-3 py-1">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {isLoading && searchTerm && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {searchTerm && !isLoading && totalResults === 0 && (
          <div className="text-center pt-12 space-y-3">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="font-medium" data-testid="text-mobile-no-results">No results found</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        )}

        {searchTerm && !isLoading && results && totalResults > 0 && (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground" data-testid="text-mobile-result-count">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchTerm}"
            </p>

            {results.borrowers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-mobile-borrowers">
                    Borrowers ({results.borrowers.length})
                  </span>
                </div>
                {results.borrowers.map((b) => (
                  <div
                    key={b.id}
                    className="bg-card border rounded-xl p-4 active:bg-accent transition-colors"
                    onClick={() => navigate(`/borrowers/${b.id}`)}
                    data-testid={`mobile-result-borrower-${b.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={(b as any).photoUrl || getBorrowerAvatarUrl(b.id, b.type === "corporate" ? (b.companyName || "") : `${b.firstName} ${b.lastName}`, b.type as "individual" | "corporate")}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {b.type === "corporate" ? b.companyName : `${b.firstName} ${b.lastName}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.nationalId}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">{b.type}</Badge>
                          {b.country && <Badge variant="outline" className="text-[10px]">{b.country}</Badge>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/borrowers/${b.id}`); }}
                        data-testid={`button-mobile-view-profile-${b.id}`}
                      >
                        <User className="w-3.5 h-3.5 mr-1.5" />
                        Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/credit-report/${b.id}`); }}
                        data-testid={`button-mobile-view-report-${b.id}`}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Credit Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.institutions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-mobile-institutions">
                    Institutions ({results.institutions.length})
                  </span>
                </div>
                {results.institutions.map((inst) => (
                  <div
                    key={inst.id}
                    className="bg-card border rounded-xl p-4 active:bg-accent transition-colors flex items-center gap-3"
                    onClick={() => navigate("/institutions")}
                    data-testid={`mobile-result-inst-${inst.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                      <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{inst.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] capitalize">{inst.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{inst.country}</Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {results.creditAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-testid="section-mobile-accounts">
                    Credit Accounts ({results.creditAccounts.length})
                  </span>
                </div>
                {results.creditAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-card border rounded-xl p-4 active:bg-accent transition-colors flex items-center gap-3"
                    onClick={() => navigate(`/borrowers/${acc.borrowerId}`)}
                    data-testid={`mobile-result-account-${acc.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{acc.lenderInstitution}</p>
                      <p className="text-[10px] text-muted-foreground">Acct: {acc.accountNumber}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] capitalize">{acc.accountType}</Badge>
                        <Badge variant="outline" className="text-[10px]">{acc.currency} {parseFloat(acc.currentBalance || "0").toLocaleString()}</Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
