import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Link2, AlertTriangle, Loader2, ArrowRight, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Match {
  borrowerId: string;
  matchType: string;
  matchValueDisplay: string;
  borrowerName: string;
  nationalId?: string;
  country?: string;
}

interface Cluster {
  id: string;
  linkType: string;
  linkValueDisplay: string;
  memberBorrowerIds: string[];
  memberCount: number;
  confidence: string;
}

export default function FindConnectionsPage() {
  const { toast } = useToast();
  const [type, setType] = useState<string>("any");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [results, setResults] = useState<{ matches: Match[]; clusters: Cluster[] } | null>(null);

  const search = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trace/find-connections", {
        type: type === "any" ? undefined : type, value, reason,
      });
      return res.json() as Promise<{ matches: Match[]; clusters: Cluster[] }>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({ title: "Search complete", description: `${data.matches.length} match${data.matches.length === 1 ? "" : "es"}, ${data.clusters.length} cluster${data.clusters.length === 1 ? "" : "s"}.` });
    },
    onError: (e: any) => toast({ title: "Search failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            Find Connections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search the registry for any borrower files that share a phone, email, address, employer, mobile-money number, or bank account.
          </p>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <strong>Permissible-purpose required.</strong> Each search is logged in the audit trail with your user ID and the reason you provide. Searches without a valid permissible purpose are a regulatory breach.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4" /> Search Criteria</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Data Point Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-trace-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (search all)</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                  <SelectItem value="address">Residential Address</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money Number</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Value to Search</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. +233241234567, jdoe@mail.com, 25 High Street, ABC Ltd"
                data-testid="input-trace-value"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Permissible-Purpose Reason <span className="text-destructive">*</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Skip-trace for delinquent loan ACC-12345 — collections workflow"
              rows={2}
              data-testid="input-trace-reason"
            />
          </div>
          <Button
            onClick={() => search.mutate()}
            disabled={search.isPending || value.length < 3 || reason.length < 5}
            data-testid="button-trace-search"
          >
            {search.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Matched Borrowers</h3>
                <Badge variant="secondary">{results.matches.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {results.matches.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No borrowers found with that data point.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Match Type</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.matches.map((m, i) => (
                      <TableRow key={`${m.borrowerId}-${i}`} data-testid={`row-match-${m.borrowerId}`}>
                        <TableCell className="font-medium">{m.borrowerName}</TableCell>
                        <TableCell className="text-xs">{m.nationalId || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{m.matchType}</Badge></TableCell>
                        <TableCell className="text-xs">{m.country || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/borrowers/${m.borrowerId}`}>
                            <Button size="sm" variant="ghost" data-testid={`button-view-${m.borrowerId}`}>
                              View <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {results.clusters.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold">Pre-computed Link Clusters</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.clusters.map(c => (
                  <div key={c.id} className="flex items-center justify-between border rounded-md p-3" data-testid={`row-cluster-${c.id}`}>
                    <div>
                      <div className="font-medium text-sm">{c.linkValueDisplay}</div>
                      <div className="text-xs text-muted-foreground">{c.linkType} · {c.memberCount} borrowers · {Math.round(parseFloat(c.confidence) * 100)}% confidence</div>
                    </div>
                    <Badge variant="secondary">{c.memberCount}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
