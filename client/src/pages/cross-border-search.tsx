import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Globe, User, Building2, MapPin, Shield, ArrowRight,
  Loader2, AlertCircle, FileSearch,
} from "lucide-react";
import type { DataSharingAgreement } from "@shared/schema";

const SUPPORTED_COUNTRIES = [
  "Ghana", "Sierra Leone", "Nigeria", "Kenya", "Rwanda",
  "Tanzania", "Uganda", "Ethiopia", "South Africa", "Liberia",
];

interface SearchResult {
  id: string;
  type: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  national_id: string | null;
  country: string;
  city: string | null;
  region: string | null;
}

export default function CrossBorderSearchPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ agreementId: string; sourceCountry: string; targetCountry: string } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: agreements = [] } = useQuery<DataSharingAgreement[]>({
    queryKey: ["/api/sata/my-agreements"],
  });

  const activeAgreements = agreements.filter(a => a.status === "active");
  const connectedCountries = new Set<string>();
  activeAgreements.forEach(a => {
    connectedCountries.add(a.sourceCountry);
    connectedCountries.add(a.targetCountry);
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/sata/cross-border-search?q=${encodeURIComponent(query)}&targetCountry=${encodeURIComponent(targetCountry)}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      setResults(data.results || []);
      setSearchMeta({ agreementId: data.agreementId, sourceCountry: data.sourceCountry, targetCountry: data.targetCountry });
      setHasSearched(true);
      if ((data.results || []).length === 0) {
        toast({ title: "No results", description: `No matching borrowers found in ${targetCountry}` });
      }
    },
    onError: (e: any) => {
      toast({ title: "Search Failed", description: e.message, variant: "destructive" });
      setHasSearched(true);
      setResults([]);
    },
  });

  const handleSearch = () => {
    if (!query.trim() || !targetCountry) {
      toast({ title: "Missing fields", description: "Enter a search term and select a target country", variant: "destructive" });
      return;
    }
    searchMutation.mutate();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1200px] mx-auto animate-page-enter">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" data-testid="text-cross-border-search-title">
          <FileSearch className="w-6 h-6 text-primary" />
          Cross-Border Borrower Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Search borrower records across jurisdictions with active SATA data sharing agreements</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Authorized Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Label>Target Country</Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
                <SelectTrigger data-testid="select-target-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-1.5">
                        {c}
                        {connectedCountries.has(c) && <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Active Agreement</Badge>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Search Term</Label>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Name, national ID, passport number, or company name..."
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  data-testid="input-search-query"
                />
                <Button onClick={handleSearch} disabled={searchMutation.isPending} data-testid="button-search">
                  {searchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {activeAgreements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground pt-0.5">Active agreements:</span>
              {activeAgreements.map(a => (
                <Badge key={a.id} variant="outline" className="text-[10px]">
                  {a.sourceCountry} <ArrowRight className="w-2.5 h-2.5 mx-0.5 inline" /> {a.targetCountry}
                </Badge>
              ))}
            </div>
          )}

          {activeAgreements.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No active data sharing agreements found. Cross-border searches require an active bilateral SATA agreement. Go to Cross-Border Agreements to create one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {searchMeta && hasSearched && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          Search authorized under agreement {searchMeta.agreementId.slice(0, 8)}... | {searchMeta.sourceCountry} <ArrowRight className="w-3 h-3 inline" /> {searchMeta.targetCountry}
        </div>
      )}

      {hasSearched && results.length === 0 && !searchMutation.isPending && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold" data-testid="text-no-results">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try different search terms or check that you have an active agreement with the target country.</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium" data-testid="text-result-count">{results.length} result{results.length !== 1 ? "s" : ""} found in {targetCountry}</p>
          {results.map(r => (
            <Card key={r.id} data-testid={`search-result-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 shrink-0">
                      {r.type === "individual" ? <User className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {r.type === "individual" ? `${r.first_name} ${r.last_name}` : r.company_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          <Globe className="w-2.5 h-2.5 mr-0.5" /> {r.country}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge>
                        {r.city && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {r.city}{r.region ? `, ${r.region}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {r.national_id && <p className="text-xs text-muted-foreground font-mono">{r.national_id}</p>}
                    <Badge variant="outline" className="text-[9px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 dark:text-amber-400 mt-1">Read-Only</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
