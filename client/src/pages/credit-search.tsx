import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, User, Building2, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Borrower } from "@shared/schema";

export default function CreditSearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const { data: results, isLoading } = useQuery<Borrower[]>({
    queryKey: [`/api/borrowers?search=${encodeURIComponent(searchTerm)}`],
    enabled: searchTerm.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="text-center space-y-2 pt-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-search-title">Credit Search</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Search the credit registry by name, national ID, phone number, or email to generate credit reports
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto" data-testid="form-credit-search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-credit-search"
            placeholder="Enter name, ID number, phone, or email..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" data-testid="button-search">Search</Button>
      </form>

      {searchTerm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching..." : `${results?.length || 0} results for "${searchTerm}"`}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((borrower) => (
                <Card
                  key={borrower.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => navigate(`/borrowers/${borrower.id}`)}
                  data-testid={`result-borrower-${borrower.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center justify-center w-11 h-11 rounded-md bg-accent shrink-0">
                          {borrower.type === "corporate" ? (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {borrower.type === "corporate" ? borrower.companyName : `${borrower.firstName} ${borrower.lastName}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{borrower.nationalId}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] capitalize">{borrower.type}</Badge>
                            {borrower.city && <Badge variant="outline" className="text-[10px]">{borrower.city}</Badge>}
                            {borrower.sector && <Badge variant="outline" className="text-[10px]">{borrower.sector}</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" data-testid={`button-view-report-${borrower.id}`}>
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          View Report
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-semibold">No results found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try different search terms or register a new borrower</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!searchTerm && (
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Enter a search query above to find borrowers and generate credit reports. All searches require borrower consent and are logged for audit purposes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
