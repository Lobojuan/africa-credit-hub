import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Activity, Receipt, Building2, AlertTriangle, ShieldCheck, Map, BarChart3,
  Webhook, FileSpreadsheet, FileText, RefreshCw, History, Trash2, Clock,
} from "lucide-react";

interface KPIData {
  countryCode: string;
  vatCollected30d: number;
  turnover30d: number;
  receipts30d: number;
  receipts24h: number;
  merchantsRegistered: number;
  devicesActive: number;
  prizePoolScheduled: number;
  openFraudFlags: number;
  generatedAt: string;
}

interface HeatmapDistrict { district: string; merchants: number; receipts: number; turnover: number; vat: number; }
interface HeatmapPayload { countryCode: string; windowDays: number; districts: HeatmapDistrict[]; }

interface ComplianceMerchant {
  merchantId: string; shopName: string; city: string | null; district: string;
  category: string | null; score: number; breakdown: Record<string, number>;
  receiptsLast30Days: number; turnoverLast30Days: number;
  momPct: number; openFlags: number; lastReceiptAt: string | null;
}
interface CompliancePayload { countryCode: string; merchants: ComplianceMerchant[]; }

interface FraudFlag {
  id: string; ruleCode: string; severity: string; status: string;
  merchantId: string | null; receiptId: string | null;
  summary: string; signature: string;
  detectedAt: string; triagedAt: string | null;
  triageNote: string | null; evidence: Record<string, unknown> | null;
}

interface VatUpliftPayload {
  countryCode: string;
  monthly: { month: string; receipts: number; vat: number; turnover: number }[];
  summary: { recent3MonthsVat: number; baseline3MonthsVat: number; upliftPct: number | null; attributable: number | null };
}

interface WebhookSub {
  id: string; url: string; events: string[]; status: string; description: string | null;
}
interface WebhookPayload { availableEvents: string[]; allWebhookEvents: string[]; subscriptions: WebhookSub[]; }

interface AuditEntry {
  id: string; action: string; entity: string; entityId: string | null; details: string | null;
  userId: string | null; createdAt: string;
}
interface AuditPayload { entries: AuditEntry[]; }

function fmtNum(n: number) { return new Intl.NumberFormat().format(Math.round(n)); }
function fmtCurr(n: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n); }

function severityColor(sev: string): string {
  return sev === "critical" ? "bg-red-600 text-white"
    : sev === "high" ? "bg-orange-500 text-white"
    : sev === "medium" ? "bg-amber-400 text-amber-950"
    : "bg-slate-300 text-slate-900";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Lightweight inline heatmap (grid of 14 CI districts + Autres) ──────
function DistrictHeatmap({ districts }: { districts: HeatmapDistrict[] }) {
  const max = Math.max(1, ...districts.map((d) => d.turnover));
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2" data-testid="heatmap-grid">
      {districts.map((d) => {
        const intensity = Math.min(1, d.turnover / max);
        const bg = `rgba(16, 185, 129, ${0.15 + intensity * 0.7})`;
        return (
          <div
            key={d.district}
            className="rounded-md border p-3 text-sm"
            style={{ background: bg }}
            data-testid={`heatmap-cell-${d.district.toLowerCase().replace(/[^a-z]/g, "-")}`}
          >
            <div className="font-medium truncate" title={d.district}>{d.district}</div>
            <div className="text-xs text-slate-700 dark:text-slate-200">
              {fmtNum(d.merchants)} merchants · {fmtNum(d.receipts)} receipts
            </div>
            <div className="text-xs font-semibold mt-1">VAT {fmtCurr(d.vat)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini bar chart for VAT uplift (no chart lib) ───────────────────────
function MonthlyBars({ rows }: { rows: VatUpliftPayload["monthly"] }) {
  const max = Math.max(1, ...rows.map((r) => r.vat));
  return (
    <div className="flex items-end gap-2 h-40 overflow-x-auto" data-testid="vat-bars">
      {rows.map((r) => (
        <div key={r.month} className="flex flex-col items-center gap-1 min-w-[44px]">
          <div className="text-[10px] text-slate-500">{fmtCurr(r.vat)}</div>
          <div
            className="w-8 rounded-t bg-emerald-500"
            style={{ height: `${(r.vat / max) * 120}px` }}
            title={`${r.month}: VAT ${fmtCurr(r.vat)}`}
          />
          <div className="text-[10px] text-slate-500 rotate-45 origin-top-left ml-2">{r.month}</div>
        </div>
      ))}
    </div>
  );
}

export default function LotoAdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "compliance" | "fraud" | "webhooks" | "audit">("overview");
  const isFr = i18n.language?.startsWith("fr");

  const tx = (en: string, fr: string) => (isFr ? fr : en);

  const kpiQ = useQuery<KPIData>({ queryKey: ["/api/loto/admin/kpi"] });
  const heatmapQ = useQuery<HeatmapPayload>({ queryKey: ["/api/loto/admin/heatmap"] });
  const complianceQ = useQuery<CompliancePayload>({ queryKey: ["/api/loto/admin/compliance-scorecard"], enabled: tab === "compliance" || tab === "overview" });
  const upliftQ = useQuery<VatUpliftPayload>({ queryKey: ["/api/loto/admin/vat-uplift"] });
  const fraudOpenQ = useQuery<{ flags: FraudFlag[] }>({ queryKey: ["/api/loto/admin/fraud-flags"], enabled: tab === "fraud" });
  const countryConfigQ = useQuery<{ config: { fraudScanIntervalMinutes: number; countryCode: string } | null; isSuperAdmin: boolean; noCountrySelected?: boolean }>({
    queryKey: ["/api/loto/admin/country-config/fraud-settings"],
    enabled: tab === "fraud",
  });
  const webhooksQ = useQuery<WebhookPayload>({ queryKey: ["/api/loto/admin/webhooks"], enabled: tab === "webhooks" });
  const auditQ = useQuery<AuditPayload>({ queryKey: ["/api/loto/admin/audit"], enabled: tab === "audit" });

  const scanMu = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/loto/admin/fraud-flags/scan", {}),
    onSuccess: async (resp) => {
      const data = await resp.json();
      toast({ title: tx("Scan complete", "Analyse terminée"), description: tx(`Detections: ${data.detectionsFound}`, `Détections : ${data.detectionsFound}`) });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/fraud-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/kpi"] });
    },
    onError: (e: any) => toast({ title: tx("Scan failed", "Échec de l'analyse"), description: e.message, variant: "destructive" }),
  });

  const triageMu = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: string; note?: string }) =>
      apiRequest("POST", `/api/loto/admin/fraud-flags/${id}/triage`, { action, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/fraud-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/kpi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/audit"] });
      toast({ title: tx("Flag updated", "Drapeau mis à jour") });
    },
    onError: (e: any) => toast({ title: tx("Update failed", "Échec de la mise à jour"), description: e.message, variant: "destructive" }),
  });

  // ─── Fraud scan interval form state ──────────────────────────────────
  const [intervalInput, setIntervalInput] = useState<string>("");

  const updateIntervalMu = useMutation({
    mutationFn: async (intervalMinutes: number) =>
      apiRequest("PATCH", "/api/loto/admin/country-config/fraud-settings", { intervalMinutes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/country-config/fraud-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/audit"] });
      toast({ title: tx("Interval updated", "Intervalle mis à jour"), description: tx("The fraud scan interval has been saved.", "L'intervalle d'analyse de fraude a été enregistré.") });
      setIntervalInput("");
    },
    onError: (e: any) => toast({ title: tx("Update failed", "Échec de la mise à jour"), description: e.message, variant: "destructive" }),
  });

  // ─── Webhook form state ───────────────────────────────────────────────
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>(["merchant.flagged"]);
  const [whSecret, setWhSecret] = useState("");
  const [whDesc, setWhDesc] = useState("");

  const addWebhookMu = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/loto/admin/webhooks", { url: whUrl, events: whEvents, secret: whSecret || undefined, description: whDesc || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/webhooks"] });
      setWhUrl(""); setWhSecret(""); setWhDesc("");
      toast({ title: tx("Webhook subscribed", "Webhook abonné") });
    },
    onError: (e: any) => toast({ title: tx("Subscription failed", "Échec de l'abonnement"), description: e.message, variant: "destructive" }),
  });

  const delWebhookMu = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/loto/admin/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/admin/webhooks"] });
      toast({ title: tx("Webhook removed", "Webhook supprimé") });
    },
    onError: (e: any) => toast({ title: tx("Removal failed", "Échec de la suppression"), description: e.message, variant: "destructive" }),
  });

  const kpi = kpiQ.data;
  const heatmap = heatmapQ.data;
  const uplift = upliftQ.data;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-loto-admin-dashboard">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            {tx("DGI Loto Fiscal Dashboard", "Tableau de bord DGI Loto Fiscal")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {tx(
              "Real-time tax-authority view of merchants, receipts, fraud signals, and VAT uplift.",
              "Vue temps réel pour l'autorité fiscale : commerçants, reçus, signaux de fraude et hausse de TVA.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-country">{kpi?.countryCode ?? "—"}</Badge>
          <Button
            size="sm" variant="outline"
            onClick={() => { kpiQ.refetch(); heatmapQ.refetch(); upliftQ.refetch(); fraudOpenQ.refetch(); }}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> {tx("Refresh", "Actualiser")}
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard icon={<Receipt className="h-4 w-4" />} label={tx("VAT (30d)", "TVA (30j)")} value={kpi ? fmtCurr(kpi.vatCollected30d) : "—"} testId="kpi-vat" />
        <KpiCard icon={<Activity className="h-4 w-4" />} label={tx("Turnover (30d)", "CA (30j)")} value={kpi ? fmtCurr(kpi.turnover30d) : "—"} testId="kpi-turnover" />
        <KpiCard icon={<Receipt className="h-4 w-4" />} label={tx("Receipts (24h)", "Reçus (24h)")} value={kpi ? fmtNum(kpi.receipts24h) : "—"} testId="kpi-receipts-24h" />
        <KpiCard icon={<Receipt className="h-4 w-4" />} label={tx("Receipts (30d)", "Reçus (30j)")} value={kpi ? fmtNum(kpi.receipts30d) : "—"} testId="kpi-receipts-30d" />
        <KpiCard icon={<Building2 className="h-4 w-4" />} label={tx("Merchants", "Commerçants")} value={kpi ? fmtNum(kpi.merchantsRegistered) : "—"} testId="kpi-merchants" />
        <KpiCard icon={<ShieldCheck className="h-4 w-4" />} label={tx("Active devices", "Appareils actifs")} value={kpi ? fmtNum(kpi.devicesActive) : "—"} testId="kpi-devices" />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-red-500" />} label={tx("Open flags", "Drapeaux ouverts")} value={kpi ? fmtNum(kpi.openFraudFlags) : "—"} testId="kpi-open-flags" emphasize={kpi ? kpi.openFraudFlags > 0 : false} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} data-testid="tabs-loto-admin">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview"><Map className="h-4 w-4 mr-1" /> {tx("Overview", "Aperçu")}</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance"><BarChart3 className="h-4 w-4 mr-1" /> {tx("Compliance", "Conformité")}</TabsTrigger>
          <TabsTrigger value="fraud" data-testid="tab-fraud"><AlertTriangle className="h-4 w-4 mr-1" /> {tx("Fraud queue", "File de fraude")}</TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks"><Webhook className="h-4 w-4 mr-1" /> {tx("Webhooks", "Webhooks")}</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit"><History className="h-4 w-4 mr-1" /> {tx("Audit", "Audit")}</TabsTrigger>
        </TabsList>

        {/* ────── Overview ────── */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" /> {tx("Regional heatmap (last 30 days)", "Carte thermique régionale (30 derniers jours)")}</CardTitle>
              <CardDescription>
                {tx("Côte d'Ivoire — 14 districts. Color intensity reflects turnover.", "Côte d'Ivoire — 14 districts. L'intensité reflète le chiffre d'affaires.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapQ.isLoading ? <Skeleton className="h-40 w-full" /> :
                heatmap ? <DistrictHeatmap districts={heatmap.districts} /> :
                  <Alert><AlertTitle>{tx("No data", "Aucune donnée")}</AlertTitle></Alert>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => downloadFile("/api/loto/admin/export.csv?view=heatmap", `loto-heatmap.csv`)} data-testid="button-export-heatmap-csv">
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> {tx("VAT uplift attribution", "Attribution de la hausse de TVA")}</CardTitle>
              <CardDescription>
                {tx("Comparing the most recent 3 months vs the previous 3.", "Comparaison des 3 derniers mois aux 3 mois précédents.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upliftQ.isLoading ? <Skeleton className="h-40 w-full" /> :
                uplift ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Stat label={tx("Recent VAT (3m)", "TVA récente (3m)")} value={fmtCurr(uplift.summary.recent3MonthsVat)} testId="vat-recent" />
                      <Stat label={tx("Baseline VAT (3m)", "TVA de référence (3m)")} value={fmtCurr(uplift.summary.baseline3MonthsVat)} testId="vat-baseline" />
                      <Stat label={tx("Uplift", "Hausse")} value={uplift.summary.upliftPct !== null ? `${uplift.summary.upliftPct.toFixed(1)}%` : "—"} testId="vat-uplift-pct" />
                      <Stat label={tx("Attributable", "Attribuable")} value={uplift.summary.attributable !== null ? fmtCurr(uplift.summary.attributable) : "—"} testId="vat-attrib" />
                    </div>
                    <MonthlyBars rows={uplift.monthly} />
                  </>
                ) : <Alert><AlertTitle>{tx("No data", "Aucune donnée")}</AlertTitle></Alert>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── Compliance ────── */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{tx("Merchant compliance scorecard", "Tableau de conformité des commerçants")}</CardTitle>
                <CardDescription>{tx("Sorted by lowest score first. Score = recency + frequency + growth + diversity − fraud penalty.", "Trié du score le plus bas. Score = récence + fréquence + croissance + diversité − pénalité de fraude.")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadFile("/api/loto/admin/export.csv?view=compliance", "loto-compliance.csv")} data-testid="button-export-compliance-csv">
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadFile("/api/loto/admin/export.pdf?view=compliance", "loto-compliance.pdf")} data-testid="button-export-compliance-pdf">
                  <FileText className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {complianceQ.isLoading ? <Skeleton className="h-64 w-full" /> :
                complianceQ.data ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tx("Shop", "Boutique")}</TableHead>
                        <TableHead>{tx("District", "District")}</TableHead>
                        <TableHead>{tx("Score", "Score")}</TableHead>
                        <TableHead>{tx("Receipts (30d)", "Reçus (30j)")}</TableHead>
                        <TableHead>{tx("Turnover (30d)", "CA (30j)")}</TableHead>
                        <TableHead>{tx("MoM Δ", "Δ M/M")}</TableHead>
                        <TableHead>{tx("Open flags", "Drapeaux")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceQ.data.merchants.slice(0, 50).map((m) => (
                        <TableRow key={m.merchantId} data-testid={`row-merchant-${m.merchantId}`}>
                          <TableCell className="font-medium">{m.shopName}</TableCell>
                          <TableCell>{m.district}</TableCell>
                          <TableCell><span className={`font-bold ${scoreColor(m.score)}`} data-testid={`score-${m.merchantId}`}>{m.score}</span></TableCell>
                          <TableCell>{fmtNum(m.receiptsLast30Days)}</TableCell>
                          <TableCell>{fmtCurr(m.turnoverLast30Days)}</TableCell>
                          <TableCell className={m.momPct < 0 ? "text-red-600" : "text-emerald-600"}>{m.momPct.toFixed(1)}%</TableCell>
                          <TableCell>{m.openFlags > 0 ? <Badge className="bg-red-500 text-white">{m.openFlags}</Badge> : <span className="text-slate-400">—</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <Alert><AlertTitle>{tx("No data", "Aucune donnée")}</AlertTitle></Alert>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── Fraud queue ────── */}
        <TabsContent value="fraud" className="space-y-4">
          {/* Auto-scan interval settings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> {tx("Auto-scan schedule", "Planification de l'analyse automatique")}</CardTitle>
                <CardDescription>
                  {tx(
                    "Controls how often the background fraud scanner runs for this country. Changes take effect within the next 15-minute polling cycle.",
                    "Contrôle la fréquence d'exécution du scanner de fraude en arrière-plan pour ce pays. Les modifications prennent effet lors du prochain cycle de 15 minutes.",
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {countryConfigQ.isLoading ? (
                <Skeleton className="h-10 w-64" />
              ) : countryConfigQ.data?.noCountrySelected ? (
                <p className="text-sm text-muted-foreground" data-testid="text-no-country-selected">
                  {tx("Select a country to view or change the auto-scan interval.", "Sélectionnez un pays pour afficher ou modifier l'intervalle d'analyse automatique.")}
                </p>
              ) : countryConfigQ.data?.config ? (
                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{tx("Current interval", "Intervalle actuel")}</p>
                    <p className="text-2xl font-semibold" data-testid="text-current-interval">
                      {countryConfigQ.data.config.fraudScanIntervalMinutes}
                      <span className="text-base font-normal text-muted-foreground ml-1">{tx("min", "min")}</span>
                    </p>
                  </div>
                  {countryConfigQ.data.isSuperAdmin && (
                    <div className="flex items-end gap-2">
                      <div>
                        <Label htmlFor="interval-input">{tx("New interval (multiples of 15 min, up to 10080)", "Nouvel intervalle (multiples de 15 min, jusqu'à 10080)")}</Label>
                        <Input
                          id="interval-input"
                          type="number"
                          min={15}
                          max={10080}
                          step={15}
                          className="w-32"
                          placeholder={String(countryConfigQ.data.config.fraudScanIntervalMinutes)}
                          value={intervalInput}
                          onChange={(e) => setIntervalInput(e.target.value)}
                          data-testid="input-fraud-interval"
                        />
                      </div>
                      <Button
                        disabled={updateIntervalMu.isPending || !intervalInput || isNaN(parseInt(intervalInput)) || parseInt(intervalInput) < 15 || parseInt(intervalInput) % 15 !== 0}
                        onClick={() => {
                          const m = parseInt(intervalInput);
                          if (!isNaN(m) && m >= 15 && m <= 10080 && m % 15 === 0) updateIntervalMu.mutate(m);
                        }}
                        data-testid="button-save-interval"
                      >
                        {tx("Save", "Enregistrer")}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-no-country-config">
                  {tx("No fraud scan configuration found for this country.", "Aucune configuration d'analyse de fraude trouvée pour ce pays.")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>{tx("Fraud detection queue", "File de détection de fraude")}</CardTitle>
                <CardDescription>{tx("Deterministic rules: duplicate codes, structuring, ghost merchants, abnormal hour, single-device burst.", "Règles déterministes : codes dupliqués, structuration, commerçants fantômes, heure anormale, salve mono-appareil.")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => scanMu.mutate()} disabled={scanMu.isPending} data-testid="button-run-scan">
                  <RefreshCw className={`h-4 w-4 mr-1 ${scanMu.isPending ? "animate-spin" : ""}`} /> {tx("Run scan", "Lancer l'analyse")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadFile("/api/loto/admin/export.csv?view=fraud", "loto-fraud.csv")} data-testid="button-export-fraud-csv">
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadFile("/api/loto/admin/export.pdf?view=fraud", "loto-fraud.pdf")} data-testid="button-export-fraud-pdf">
                  <FileText className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fraudOpenQ.isLoading ? <Skeleton className="h-64 w-full" /> :
                (fraudOpenQ.data?.flags ?? []).length === 0 ? (
                  <Alert><AlertTitle>{tx("No open flags", "Aucun drapeau ouvert")}</AlertTitle><AlertDescription>{tx("Run a scan to refresh detections.", "Lancez une analyse pour rafraîchir les détections.")}</AlertDescription></Alert>
                ) : (
                  <div className="space-y-3">
                    {(fraudOpenQ.data?.flags ?? []).map((f) => (
                      <FraudFlagRow key={f.id} flag={f} onTriage={(action, note) => triageMu.mutate({ id: f.id, action, note })} pending={triageMu.isPending} tx={tx} />
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── Webhooks ────── */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tx("Webhook outbox", "Outbox des webhooks")}</CardTitle>
              <CardDescription>{tx("Subscribe ministry endpoints to merchant.flagged, receipt.verified and draw.closed events.", "Abonnez les endpoints du ministère aux événements merchant.flagged, receipt.verified et draw.closed.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>{tx("Endpoint URL", "URL de l'endpoint")}</Label>
                  <Input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://dgi.gouv.ci/loto/hook" data-testid="input-webhook-url" />
                </div>
                <div>
                  <Label>{tx("Description (optional)", "Description (facultatif)")}</Label>
                  <Input value={whDesc} onChange={(e) => setWhDesc(e.target.value)} data-testid="input-webhook-desc" />
                </div>
                <div>
                  <Label>{tx("Shared secret (optional)", "Secret partagé (facultatif)")}</Label>
                  <Input value={whSecret} onChange={(e) => setWhSecret(e.target.value)} type="password" data-testid="input-webhook-secret" />
                </div>
                <div>
                  <Label>{tx("Events", "Événements")}</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    {(["merchant.flagged", "receipt.verified", "draw.closed"] as const).map((evt) => (
                      <label key={evt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={whEvents.includes(evt)}
                          onCheckedChange={(v) => setWhEvents((prev) => v ? Array.from(new Set([...prev, evt])) : prev.filter((e) => e !== evt))}
                          data-testid={`checkbox-event-${evt}`}
                        />
                        <code>{evt}</code>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => addWebhookMu.mutate()} disabled={!whUrl || whEvents.length === 0 || addWebhookMu.isPending} data-testid="button-add-webhook">
                {tx("Subscribe", "S'abonner")}
              </Button>

              <div className="border-t pt-3">
                <h3 className="text-sm font-medium mb-2">{tx("Active subscriptions", "Abonnements actifs")}</h3>
                {webhooksQ.isLoading ? <Skeleton className="h-24 w-full" /> :
                  (webhooksQ.data?.subscriptions ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500" data-testid="text-no-webhooks">{tx("No active subscriptions.", "Aucun abonnement actif.")}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>{tx("Events", "Événements")}</TableHead>
                          <TableHead>{tx("Status", "Statut")}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(webhooksQ.data?.subscriptions ?? []).map((s) => (
                          <TableRow key={s.id} data-testid={`row-webhook-${s.id}`}>
                            <TableCell className="font-mono text-xs break-all max-w-md">{s.url}</TableCell>
                            <TableCell>{(s.events ?? []).map((e) => <Badge key={e} variant="secondary" className="mr-1 mb-1">{e}</Badge>)}</TableCell>
                            <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => delWebhookMu.mutate(s.id)} data-testid={`button-delete-webhook-${s.id}`}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── Audit ────── */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tx("Loto-scoped audit log", "Journal d'audit Loto")}</CardTitle>
              <CardDescription>{tx("Every triage, scan, webhook change and device event is recorded.", "Chaque triage, analyse, modification de webhook et événement appareil est enregistré.")}</CardDescription>
            </CardHeader>
            <CardContent>
              {auditQ.isLoading ? <Skeleton className="h-64 w-full" /> :
                (auditQ.data?.entries ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500" data-testid="text-no-audit">{tx("No entries yet.", "Aucune entrée.")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tx("When", "Quand")}</TableHead>
                        <TableHead>{tx("Action", "Action")}</TableHead>
                        <TableHead>{tx("Entity", "Entité")}</TableHead>
                        <TableHead>{tx("Details", "Détails")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(auditQ.data?.entries ?? []).map((e) => (
                        <TableRow key={e.id} data-testid={`row-audit-${e.id}`}>
                          <TableCell className="text-xs">{new Date(e.createdAt).toLocaleString()}</TableCell>
                          <TableCell><code className="text-xs">{e.action}</code></TableCell>
                          <TableCell className="text-xs">{e.entity}{e.entityId ? `/${e.entityId.slice(0, 8)}` : ""}</TableCell>
                          <TableCell className="text-xs max-w-md break-words">{e.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon, label, value, testId, emphasize }: { icon: React.ReactNode; label: string; value: string; testId: string; emphasize?: boolean }) {
  return (
    <Card className={emphasize ? "border-red-400" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">{icon} {label}</div>
        <div className="text-xl font-bold mt-1" data-testid={testId}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold mt-1" data-testid={testId}>{value}</div>
    </div>
  );
}

function FraudFlagRow({ flag, onTriage, pending, tx }: { flag: FraudFlag; onTriage: (action: "dismiss" | "escalate" | "resolve", note?: string) => void; pending: boolean; tx: (en: string, fr: string) => string }) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="border rounded-md p-3 space-y-2" data-testid={`fraud-row-${flag.id}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={severityColor(flag.severity)} data-testid={`fraud-severity-${flag.id}`}>{flag.severity}</Badge>
          <code className="text-xs">{flag.ruleCode}</code>
          {flag.merchantId && <span className="text-xs text-slate-500">merchant {flag.merchantId.slice(0, 8)}</span>}
        </div>
        <div className="text-xs text-slate-500">{new Date(flag.detectedAt).toLocaleString()}</div>
      </div>
      <div className="text-sm">{flag.summary}</div>
      {flag.evidence && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">{tx("Evidence", "Preuves")}</summary>
          <pre className="mt-1 bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-x-auto">{JSON.stringify(flag.evidence, null, 2)}</pre>
        </details>
      )}
      {showNote && (
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx("Triage note", "Note de triage")} data-testid={`textarea-note-${flag.id}`} />
      )}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => setShowNote((v) => !v)} data-testid={`button-toggle-note-${flag.id}`}>
          {showNote ? tx("Hide note", "Cacher la note") : tx("Add note", "Ajouter une note")}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onTriage("dismiss", note || undefined)} data-testid={`button-dismiss-${flag.id}`}>
          {tx("Dismiss", "Écarter")}
        </Button>
        <Button size="sm" variant="default" disabled={pending} onClick={() => onTriage("escalate", note || undefined)} data-testid={`button-escalate-${flag.id}`}>
          {tx("Escalate", "Escalader")}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => onTriage("resolve", note || undefined)} data-testid={`button-resolve-${flag.id}`}>
          {tx("Resolve", "Résoudre")}
        </Button>
      </div>
    </div>
  );
}
