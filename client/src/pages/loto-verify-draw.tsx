import { useEffect, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, ShieldAlert, RefreshCw, ArrowLeft, Hash, Lock, Trophy, AlertTriangle } from "lucide-react";

type Tier = {
  id: string; tier: string; label: string; prizeAmount: string;
  currency: string; slotCount: number; position: number;
};
type WinnerView = {
  id: string; tier: string; prizeAmount: string; currency: string;
  selectionRank: number; selectionHash: string;
  receiptId: string; receiptIdSuffix: string; consumerHint: string; payoutStatus: string;
};
type DrawView = {
  id: string; countryCode: string; drawNumber: number; status: string;
  periodStart: string; periodEnd: string; scheduledFor: string;
  commitmentHash: string; serverSeed: string | null; serverNonce: string | null;
  poolHash: string | null; eligibleTicketCount: number; totalPool: string;
  currency: string; openedAt: string | null; drawnAt: string | null;
};
type DrawResp = {
  draw: DrawView;
  tiers: Tier[];
  winners: WinnerView[];
  eligibleReceiptIds: string[];
};
type ServerVerifyReport = {
  drawId: string; status: "match" | "mismatch" | "pending_reveal";
  commitmentValid: boolean; commitmentRecomputed: string | null;
  poolHashValid: boolean; poolHashRecomputed: string | null;
  expectedWinners: { receiptId: string; selectionHash: string; selectionRank: number }[];
  publishedWinners: { receiptId: string; selectionHash: string; selectionRank: number }[];
  eligibleTicketCount: number;
};

// In-browser SHA-256 (hex) using Web Crypto.
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// In-browser HMAC-SHA256 (hex). Mirrors the server's selectionHash exactly.
async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface BrowserVerificationResult {
  commitmentValid: boolean;
  commitmentRecomputed: string;
  poolHashValid: boolean;
  poolHashRecomputed: string;
  hashesMatchByRank: Array<{ rank: number; expected: string; published: string; match: boolean }>;
  allHashesMatch: boolean;
  eligibleCount: number;
}

export default function LotoVerifyDrawPage() {
  const [, params] = useRoute<{ drawId: string }>("/loto/draws/verify/:drawId");
  const drawId = params?.drawId ?? "";
  // The default queryFn only fetches queryKey[0], so we must supply an
  // explicit queryFn that targets the per-draw sub-route. Keeping the
  // hierarchical key means invalidating ["/api/loto/draws"] still works.
  const drawQ = useQuery<DrawResp>({
    queryKey: ["/api/loto/draws", drawId],
    enabled: !!drawId,
    queryFn: async () => {
      const res = await fetch(`/api/loto/draws/${drawId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`failed_to_load_draw_${res.status}`);
      return await res.json();
    },
  });

  useEffect(() => {
    document.title = drawId
      ? `Loto draw #${drawQ.data?.draw.drawNumber ?? "…"} — verify`
      : "Loto draw verification";
  }, [drawId, drawQ.data?.draw.drawNumber]);

  const [browserCheck, setBrowserCheck] = useState<BrowserVerificationResult | null>(null);
  const [browserBusy, setBrowserBusy] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);

  const verifyMut = useMutation<ServerVerifyReport>({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/loto/draws/${drawId}/verify`);
      const json = await res.json();
      return json.report as ServerVerifyReport;
    },
  });

  async function runBrowserVerification() {
    if (!drawQ.data) return;
    setBrowserBusy(true);
    setBrowserError(null);
    try {
      const { draw, winners, eligibleReceiptIds } = drawQ.data;
      if (!draw.serverSeed || !draw.serverNonce) {
        throw new Error("Seed has not been revealed yet — cannot verify in-browser.");
      }
      if (!eligibleReceiptIds || eligibleReceiptIds.length === 0) {
        throw new Error("No eligible receipt IDs were published — cannot recompute the draw.");
      }

      // 1. Recompute commitment hash from the revealed seed/nonce, BOUND to
      //    the specific draw context (drawId + periodEnd + countryCode) — same
      //    formula the server uses (computeCommitmentHash). Binding prevents
      //    operators from re-using a single commitment across multiple draws.
      const periodEndIso = new Date(draw.periodEnd).toISOString();
      const commitmentRecomputed = await sha256Hex(
        `${draw.serverSeed}:${draw.serverNonce}:${draw.id}:${periodEndIso}:${draw.countryCode}`,
      );
      const commitmentValid = commitmentRecomputed === draw.commitmentHash;

      // 2. Recompute pool hash from the published eligible-ID list (sorted).
      const sortedIds = [...eligibleReceiptIds].sort();
      const poolHashRecomputed = await sha256Hex(sortedIds.join("\n"));
      const poolHashValid = !!draw.poolHash && poolHashRecomputed === draw.poolHash;

      // 3. Run the actual selection algorithm in the browser:
      //    selection_hash = HMAC-SHA256(seed:nonce, drawNumber:receiptId)
      //    Sort ascending by selection_hash; the top N receipts are winners.
      const seedKey = `${draw.serverSeed}:${draw.serverNonce}`;
      const ranked = await Promise.all(sortedIds.map(async (receiptId) => ({
        receiptId,
        selectionHash: await hmacSha256Hex(seedKey, `${draw.drawNumber}:${receiptId}`),
      })));
      ranked.sort((a, b) =>
        a.selectionHash < b.selectionHash ? -1 :
        a.selectionHash > b.selectionHash ? 1 : 0,
      );

      // 4. Compare against published winners by rank.
      const sortedWinners = [...winners].sort((a, b) => a.selectionRank - b.selectionRank);
      const hashesMatchByRank = sortedWinners.map((w, i) => {
        const expected = ranked[i];
        return {
          rank: w.selectionRank,
          expected: expected ? expected.selectionHash : "(missing)",
          published: w.selectionHash,
          match: !!expected
            && expected.selectionHash === w.selectionHash
            && expected.receiptId === w.receiptId,
        };
      });
      const allHashesMatch = commitmentValid
        && poolHashValid
        && sortedWinners.length > 0
        && hashesMatchByRank.every((r) => r.match);

      setBrowserCheck({
        commitmentValid,
        commitmentRecomputed,
        poolHashValid,
        poolHashRecomputed,
        hashesMatchByRank,
        allHashesMatch,
        eligibleCount: sortedIds.length,
      });
    } catch (err) {
      setBrowserError(err instanceof Error ? err.message : String(err));
    } finally {
      setBrowserBusy(false);
    }
  }

  if (!drawId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing draw id</AlertTitle>
          <AlertDescription>Provide a draw id in the URL: /loto/draws/verify/&lt;id&gt;</AlertDescription>
        </Alert>
      </div>
    );
  }

  const draw = drawQ.data?.draw;
  const tiers = drawQ.data?.tiers ?? [];
  const winners = drawQ.data?.winners ?? [];
  const isRevealed = draw && (draw.status === "closed" || draw.status === "verified");

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6" data-testid="page-loto-verify-draw">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/loto-fiscal">
            <Button variant="ghost" size="sm" data-testid="button-back-to-loto">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-1" data-testid="text-page-title">
            Loto Fiscal — Public Draw Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This page lets any citizen, journalist, or auditor independently
            verify that the published winners came from the deterministic
            selection algorithm seeded by the committed-then-revealed seed.
          </p>
        </div>
      </div>

      {drawQ.isLoading && (
        <Card><CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" />
        </CardContent></Card>
      )}
      {drawQ.isError && (
        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" />
          <AlertTitle>Draw not found</AlertTitle>
          <AlertDescription>
            We could not load draw <code className="text-xs">{drawId}</code>.
          </AlertDescription>
        </Alert>
      )}

      {draw && (
        <>
          <Card data-testid="card-draw-summary">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle data-testid="text-draw-id">Draw #{draw.drawNumber} — {draw.countryCode}</CardTitle>
                  <CardDescription>
                    {draw.eligibleTicketCount} eligible tickets · {draw.currency} {Number(draw.totalPool).toLocaleString()} total pool
                  </CardDescription>
                </div>
                <Badge variant={isRevealed ? "default" : "secondary"} data-testid="badge-draw-status">
                  {draw.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <CryptoRow icon={Lock} label="Commitment hash (published at scheduling)"
                value={draw.commitmentHash} testid="text-commitment-hash" />
              <CryptoRow icon={Hash} label="Server seed (revealed)"
                value={draw.serverSeed ?? "(hidden until reveal)"} testid="text-server-seed" />
              <CryptoRow icon={Hash} label="Server nonce (revealed)"
                value={draw.serverNonce ?? "(hidden until reveal)"} testid="text-server-nonce" />
              <CryptoRow icon={Hash} label="Eligible-pool hash"
                value={draw.poolHash ?? "(computed at draw time)"} testid="text-pool-hash" />
              <Separator />
              <p className="text-xs text-muted-foreground">
                <strong>Algorithm:</strong> selection_hash = HMAC-SHA256(server_seed
                ":" server_nonce, draw_number ":" receipt_id). Eligible
                receipts are sorted ascending by selection_hash; the top
                slots are allocated to tiers in published position order
                (highest tier first).
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-prize-tiers">
            <CardHeader><CardTitle>Prize tiers (frozen at scheduling)</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {tiers.length === 0 && <p className="text-muted-foreground">No tiers configured.</p>}
              <div className="grid sm:grid-cols-2 gap-2">
                {tiers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border rounded-md p-3" data-testid={`row-tier-${t.tier}`}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.tier} · {t.slotCount} slot{t.slotCount === 1 ? "" : "s"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{t.currency} {Number(t.prizeAmount).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-winners">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Published winners</CardTitle>
                <Badge variant="outline">{winners.length} winners</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              {winners.length === 0 && <p className="text-muted-foreground">No winners yet — the draw has not run.</p>}
              {winners.length > 0 && (
                <div className="space-y-1 font-mono text-xs">
                  {winners.map((w) => (
                    <div key={w.id} className="flex items-center gap-3 p-2 border rounded" data-testid={`row-winner-${w.selectionRank}`}>
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="w-10 text-muted-foreground">#{w.selectionRank}</span>
                      <Badge variant="outline" className="capitalize">{w.tier}</Badge>
                      <span className="flex-1 truncate" title={w.selectionHash}>{w.selectionHash}</span>
                      <span className="text-muted-foreground">{w.consumerHint}</span>
                      <span>{w.currency} {Number(w.prizeAmount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-verification">
            <CardHeader>
              <CardTitle>Verify this draw</CardTitle>
              <CardDescription>
                Re-run the deterministic algorithm — once locally in your browser,
                and once on the server — and confirm both agree with the published
                winner list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={runBrowserVerification} disabled={!isRevealed || browserBusy} data-testid="button-verify-browser">
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${browserBusy ? "animate-spin" : ""}`} />
                  Verify in browser
                </Button>
                <Button onClick={() => verifyMut.mutate()} disabled={!isRevealed || verifyMut.isPending} variant="outline" data-testid="button-verify-server">
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${verifyMut.isPending ? "animate-spin" : ""}`} />
                  Verify on server
                </Button>
              </div>
              {!isRevealed && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Seed not revealed yet</AlertTitle>
                  <AlertDescription>
                    The server seed and nonce are published only after the draw
                    closes. Until then only the commitment hash is visible.
                  </AlertDescription>
                </Alert>
              )}
              {browserError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Browser verification failed</AlertTitle>
                  <AlertDescription>{browserError}</AlertDescription>
                </Alert>
              )}
              {browserCheck && (
                <BrowserResultPanel result={browserCheck} commitmentHash={draw.commitmentHash} />
              )}
              {verifyMut.data && (
                <ServerResultPanel report={verifyMut.data} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CryptoRow({ icon: Icon, label, value, testid }: { icon: any; label: string; value: string; testid?: string }) {
  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-2 items-start">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <code className="font-mono text-xs break-all bg-muted/50 p-2 rounded" data-testid={testid}>{value}</code>
    </div>
  );
}

function BrowserResultPanel({ result, commitmentHash }: { result: BrowserVerificationResult; commitmentHash: string }) {
  const ok = result.allHashesMatch;
  const winnerMatchCount = result.hashesMatchByRank.filter((r) => r.match).length;
  return (
    <Alert variant={ok ? "default" : "destructive"} data-testid="alert-browser-result">
      {ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      <AlertTitle>{ok ? "Browser verification passed" : "Browser verification mismatch"}</AlertTitle>
      <AlertDescription className="text-xs space-y-1 mt-2">
        <div>
          <strong>Commitment:</strong>{" "}
          <code className="font-mono">{result.commitmentRecomputed.slice(0, 16)}…</code>
          {" "}{result.commitmentValid ? "matches" : "does NOT match"} published{" "}
          <code className="font-mono">{commitmentHash.slice(0, 16)}…</code>
        </div>
        <div>
          <strong>Pool hash:</strong>{" "}
          <code className="font-mono">{result.poolHashRecomputed.slice(0, 16)}…</code>{" "}
          {result.poolHashValid ? "matches published pool hash" : "does NOT match published pool hash"}
          {" "}({result.eligibleCount.toLocaleString()} eligible tickets re-hashed locally)
        </div>
        <div>
          <strong>Winner ranking:</strong>{" "}
          {winnerMatchCount}/{result.hashesMatchByRank.length} winners exactly reproduced from
          HMAC-SHA256(seed:nonce, drawNumber:receiptId) ranking.
        </div>
      </AlertDescription>
    </Alert>
  );
}

function ServerResultPanel({ report }: { report: ServerVerifyReport }) {
  const ok = report.status === "match";
  const pending = report.status === "pending_reveal";
  return (
    <Alert variant={ok ? "default" : "destructive"} data-testid="alert-server-result">
      {ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      <AlertTitle>
        {pending ? "Server: seed not revealed" : ok ? "Server verification passed" : "Server verification mismatch"}
      </AlertTitle>
      <AlertDescription className="text-xs space-y-1 mt-2">
        <div>Commitment valid: <strong>{String(report.commitmentValid)}</strong></div>
        <div>Pool hash valid: <strong>{String(report.poolHashValid)}</strong></div>
        <div>Eligible tickets: <strong>{report.eligibleTicketCount}</strong></div>
        <div>Expected winners: {report.expectedWinners.length} · Published winners: {report.publishedWinners.length}</div>
      </AlertDescription>
    </Alert>
  );
}
