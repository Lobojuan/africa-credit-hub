import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import QRCode from "react-qr-code";
import {
  Building, Plus, Search, RefreshCw, MapPin, FileText,
  Award, Clock, CheckCircle2, XCircle, AlertTriangle,
  Download, Shield, Zap, Star, TrendingUp, Package, Link2,
  Eye, CheckCircle, Building2, User, Tag, Calendar, ExternalLink, Copy, Check,
  Share2, Mail, MessageSquare, Printer, History, Send, Pencil, Car, Landmark,
  ArrowLeftRight, Flame,
} from "lucide-react";
import { format } from "date-fns";

interface SearchResultItem {
  id: string;
  lienPriority?: number;
  certificateNumber?: string;
  lenderInstitutionName?: string;
  lenderOrganizationId?: string;
  collateralType?: string;
  estimatedValue?: string;
  currency?: string;
  isPmsi?: boolean;
  registrationDate?: string;
  expiryDate?: string;
}

interface CollateralRegistryItem {
  id: string;
  registrationNumber?: string;
  borrowerName?: string;
  borrowerId?: string;
  lenderOrganizationId?: string;
  lenderInstitutionName?: string;
  collateralType?: string;
  collateralClass?: string;
  assetLocalIdentifier?: string;
  panAfricanAssetId?: string;
  estimatedValue?: string;
  currency?: string;
  financingDuration?: string;
  expiryDate?: string;
  approvalStatus?: string;
  certificateNumber?: string;
  rejectionReason?: string;
  lienPriority?: number | null;
  isPmsi?: boolean;
  status?: string;
  securityInterestType?: string;
  description?: string;
  verificationCode?: string;
  location?: string;
  documentReference?: string;
  notes?: string;
  legalRegime?: string;
  countryCode?: string;
  debtorType?: string;
  shareCount?: number;
  resubmittedFromId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLLATERAL_TYPES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "vehicle", label: "Motor Vehicle" },
  { value: "equipment", label: "Equipment / Machinery" },
  { value: "inventory", label: "Inventory" },
  { value: "securities", label: "Securities / Shares" },
  { value: "land", label: "Land" },
  { value: "livestock", label: "Livestock" },
  { value: "crop", label: "Crops / Agricultural Produce" },
  { value: "intellectual_property", label: "Intellectual Property" },
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "aircraft", label: "Aircraft" },
  { value: "watercraft", label: "Watercraft" },
  { value: "all_property", label: "All Present & After-Acquired Property (Blanket)" },
  { value: "investment_instruments", label: "Investment Instruments" },
  { value: "other", label: "Other" },
];

const COLLATERAL_CLASS = [
  { value: "motor_vehicle", label: "Motor Vehicle (VIN/Chassis)" },
  { value: "aircraft", label: "Aircraft (Manufacturer Serial)" },
  { value: "watercraft", label: "Watercraft" },
  { value: "serial_goods", label: "Goods with Serial Number" },
  { value: "accounts", label: "Accounts / Receivables" },
  { value: "ip", label: "Intellectual Property" },
  { value: "investment", label: "Investment Instruments" },
  { value: "intangible", label: "Intangible Property" },
  { value: "all_property", label: "All Present & After-Acquired (AAPAP)" },
  { value: "other", label: "General Goods" },
];

const SECURITY_INTEREST_TYPES = [
  { value: "loan_security", label: "Loan Security Interest" },
  { value: "retention_of_title", label: "Retention of Title" },
  { value: "lease", label: "Lease / Hire" },
  { value: "consignment", label: "Consignment" },
  { value: "blanket_lien", label: "Blanket Lien (All Assets)" },
];

const FINANCING_DURATIONS = [
  { value: "7_years", label: "7 Years" },
  { value: "25_years", label: "25 Years" },
  { value: "custom", label: "Custom End Date" },
  { value: "perpetual", label: "No End Date (Perpetual)" },
];

const CURRENCIES = ["GHS", "NGN", "KES", "ZAR", "USD", "EUR", "XOF", "XAF", "ETB", "EGP", "MAD", "TZS", "UGX", "ZMW"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  released: "bg-gray-100 text-gray-600",
  defaulted: "bg-red-100 text-red-700",
  under_review: "bg-yellow-100 text-yellow-800",
};

const APPROVAL_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const AFRICAN_COUNTRIES: Record<string, string> = {
  DZ: "Algeria", AO: "Angola", BJ: "Benin", BW: "Botswana", BF: "Burkina Faso",
  BI: "Burundi", CM: "Cameroon", CV: "Cape Verde", CF: "Central African Republic",
  TD: "Chad", KM: "Comoros", CG: "Congo", CD: "DR Congo", CI: "Côte d'Ivoire",
  DJ: "Djibouti", EG: "Egypt", GQ: "Equatorial Guinea", ER: "Eritrea",
  ET: "Ethiopia", GA: "Gabon", GM: "Gambia", GH: "Ghana", GN: "Guinea",
  GW: "Guinea-Bissau", KE: "Kenya", LS: "Lesotho", LR: "Liberia", LY: "Libya",
  MG: "Madagascar", MW: "Malawi", ML: "Mali", MR: "Mauritania", MU: "Mauritius",
  MA: "Morocco", MZ: "Mozambique", NA: "Namibia", NE: "Niger", NG: "Nigeria",
  RW: "Rwanda", ST: "São Tomé & Príncipe", SN: "Senegal", SL: "Sierra Leone",
  SO: "Somalia", ZA: "South Africa", SS: "South Sudan", SD: "Sudan",
  SZ: "Eswatini", TZ: "Tanzania", TG: "Togo", TN: "Tunisia", UG: "Uganda",
  ZM: "Zambia", ZW: "Zimbabwe",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: string | number | null, currency = "GHS") {
  if (!amount) return "—";
  return `${currency} ${Number(amount).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function genVerificationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function PriorityBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span className="text-muted-foreground text-xs">—</span>;
  const color = rank === 1
    ? "bg-amber-100 text-amber-800"
    : rank === 2
    ? "bg-slate-100 text-slate-700"
    : "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${color}`}>
      {rank === 1 && <Star className="w-3 h-3" />}#{rank}
    </span>
  );
}

function PmsiTag() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800" title="Purchase Money Security Interest — Super Priority">
      <Zap className="w-3 h-3" /> PMSI
    </span>
  );
}

// ─── Share Verification Link Dialog ──────────────────────────────────────────

interface ShareLogEntry {
  id: string;
  collateralItemId: string;
  channel: string;
  maskedRecipient: string;
  sentBy: string | null;
  senderName: string | null;
  sentAt: string;
}

function ShareVerificationLinkDialog({ item }: { item: CollateralRegistryItem }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [recipient, setRecipient] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [senderFilter, setSenderFilter] = useState<string>("__all__");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const shareLogQuery = useQuery<ShareLogEntry[]>({
    queryKey: ["/api/collateral", item.id, "share-log"],
    queryFn: () => apiRequest("GET", `/api/collateral/${item.id}/share-log`).then(r => r.json()),
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: ({ channel, recipient, message }: { channel: "email" | "sms"; recipient: string; message?: string }) =>
      apiRequest("POST", `/api/collateral/${item.id}/share`, { channel, recipient, message }),
    onSuccess: () => {
      toast({
        title: "Verification link sent",
        description: channel === "email"
          ? `Email sent to ${recipient}`
          : `SMS sent to ${recipient}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collateral", item.id, "share-log"] });
      setRecipient("");
      setPersonalMessage("");
    },
    onError: (e: Error) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (!recipient.trim()) {
      toast({ title: "Recipient required", description: "Please enter an email address or phone number.", variant: "destructive" });
      return;
    }
    shareMutation.mutate({ channel, recipient: recipient.trim(), message: personalMessage.trim() || undefined });
  };

  const shareLog = shareLogQuery.data ?? [];

  const uniqueSenders = Array.from(
    new Map(
      shareLog
        .filter(e => e.senderName || e.sentBy)
        .map(e => [e.sentBy ?? e.senderName, e.senderName ?? "Unknown user"] as [string, string])
    ).entries()
  );

  useEffect(() => {
    if (senderFilter !== "__all__" && !uniqueSenders.some(([key]) => key === senderFilter)) {
      setSenderFilter("__all__");
    }
  }, [uniqueSenders, senderFilter]);

  const filteredLog = shareLog.filter(e => {
    if (senderFilter !== "__all__" && (e.sentBy ?? e.senderName) !== senderFilter) return false;
    const sentAt = new Date(e.sentAt);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (sentAt < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (sentAt > to) return false;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setRecipient(""); setPersonalMessage(""); setSenderFilter("__all__"); setDateFrom(""); setDateTo(""); } }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Share verification link"
          data-testid={`btn-share-verify-link-${item.id}`}
        >
          <Share2 className="w-4 h-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" /> Share Verification Link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            Share the public verification link for <strong>{item.borrowerName || "this borrower"}</strong>&apos;s
            {" "}{item.collateralType?.replace(/_/g, " ")} registration so third parties can confirm it is officially registered.
          </div>

          <div>
            <Label className="mb-2 block">Send via</Label>
            <div className="flex gap-2">
              <Button
                variant={channel === "email" ? "default" : "outline"}
                size="sm"
                className="gap-2 flex-1"
                onClick={() => { setChannel("email"); setRecipient(""); }}
                data-testid="btn-channel-email"
              >
                <Mail className="w-4 h-4" /> Email
              </Button>
              <Button
                variant={channel === "sms" ? "default" : "outline"}
                size="sm"
                className="gap-2 flex-1"
                onClick={() => { setChannel("sms"); setRecipient(""); }}
                data-testid="btn-channel-sms"
              >
                <MessageSquare className="w-4 h-4" /> SMS
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="share-recipient">
              {channel === "email" ? "Recipient email address" : "Recipient phone number"}
            </Label>
            <Input
              id="share-recipient"
              data-testid="input-share-recipient"
              placeholder={channel === "email" ? "name@example.com" : "+233 24 000 0000"}
              type={channel === "email" ? "email" : "tel"}
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="share-personal-message">Personal message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <textarea
              id="share-personal-message"
              data-testid="input-share-personal-message"
              placeholder="e.g. Please review the collateral details before our meeting."
              value={personalMessage}
              onChange={e => setPersonalMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={shareMutation.isPending}
              data-testid="btn-send-share"
              className="gap-2"
            >
              {channel === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              {shareMutation.isPending ? "Sending…" : `Send via ${channel === "email" ? "Email" : "SMS"}`}
            </Button>
          </div>

          {shareLog.length > 0 && (
            <div className="border-t pt-3 space-y-2" data-testid="share-history">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="w-4 h-4" />
                  Share history ({filteredLog.length}{filteredLog.length !== shareLog.length ? ` of ${shareLog.length}` : ""} entr{filteredLog.length !== 1 ? "ies" : "y"})
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {uniqueSenders.length > 1 && (
                    <select
                      value={senderFilter}
                      onChange={e => setSenderFilter(e.target.value)}
                      data-testid="select-sender-filter"
                      className="text-xs rounded border border-input bg-background px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="__all__">All senders</option>
                      {uniqueSenders.map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  )}
                  <a
                    href={`/api/collateral/${item.id}/share-log/export`}
                    download
                    data-testid="btn-export-share-history-csv"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">Date range:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                  aria-label="Filter from date"
                  className="text-xs rounded border border-input bg-background px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                  aria-label="Filter to date"
                  min={dateFrom || undefined}
                  className="text-xs rounded border border-input bg-background px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    data-testid="btn-clear-date-filter"
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2" data-testid="share-history-empty">
                    No entries match this filter.
                  </p>
                ) : filteredLog.map(entry => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-0.5 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5"
                    data-testid={`share-log-entry-${entry.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {entry.channel === "email"
                          ? <Mail className="w-3 h-3 shrink-0" />
                          : <MessageSquare className="w-3 h-3 shrink-0" />}
                        <span className="font-mono">{entry.maskedRecipient}</span>
                      </div>
                      <span className="text-muted-foreground/70 shrink-0 ml-2">
                        {format(new Date(entry.sentAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                    {(entry.senderName || entry.sentBy) && (
                      <span className="text-muted-foreground/60 pl-[18px]" data-testid={`share-log-sender-${entry.id}`}>
                        Sent by {entry.senderName ?? "Unknown user"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareLogQuery.isLoading && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading history…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Borrower Credit Snapshot (Cross-Product Bridge) ─────────────────────────

interface CreditSnapshotInquiry {
  id: string;
  institution: string;
  purpose: string;
  inquiredAt: string | null;
  inquiringOrgId: string | null;
}

interface CreditSnapshotResponse {
  summary: {
    score: number | null;
    activeAccounts: number;
    totalDebt: string;
    recentInquiries: number;
    recentInquiryWindowDays: number;
  };
  recentInquiries: CreditSnapshotInquiry[];
  viewerOrganizationId: string | null;
  consent: { id: string; expiresAt: string };
}

const INQUIRY_PURPOSE_LABELS: Record<string, string> = {
  new_credit: "New credit",
  review: "Account review",
  collection: "Collection",
  regulatory: "Regulatory",
  portfolio_monitoring: "Portfolio monitoring",
};

const INQUIRY_PURPOSE_TONE: Record<string, string> = {
  new_credit: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  review: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  collection: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300",
  regulatory: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  portfolio_monitoring: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

const COMPETING_INQUIRY_WINDOW_DAYS = 30;

function formatInquiryPurpose(purpose: string): string {
  return INQUIRY_PURPOSE_LABELS[purpose] ?? purpose.replace(/_/g, " ");
}

function inquiryAgeDays(inquiredAt: string | null): number | null {
  if (!inquiredAt) return null;
  const t = new Date(inquiredAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

function isCompetingInquiry(
  inq: CreditSnapshotInquiry,
  viewerOrgId: string | null,
): boolean {
  if (inq.purpose !== "new_credit") return false;
  if (!inq.inquiringOrgId) return false;
  // If we can't tell which org the viewer belongs to, treat any external
  // new_credit pull as competing — that matches the "stand out at a glance"
  // intent: better to over-highlight than to hide a real competing pull.
  if (!viewerOrgId) return true;
  return inq.inquiringOrgId !== viewerOrgId;
}

function isStaleInquiry(inq: CreditSnapshotInquiry): boolean {
  const age = inquiryAgeDays(inq.inquiredAt);
  if (age === null) return true;
  return age > COMPETING_INQUIRY_WINDOW_DAYS;
}

function inquiryPurposeBadgeClass(purpose: string): string {
  return INQUIRY_PURPOSE_TONE[purpose] ?? "border-border bg-muted text-muted-foreground";
}

/**
 * Shared row used by both the in-sheet snapshot panel and the popup dialog so
 * the highlight treatment for competing-lender inquiries stays consistent.
 *
 * Highlights at a glance:
 *  - purpose=new_credit from a different org than the viewer => "Competing"
 *    badge + amber/red row tint + flame icon.
 *  - inquiries older than 30 days => muted, faded out, marked "older".
 *  - every row carries a colored purpose pill so the panel is scannable
 *    without reading each line.
 */
function InquiryRow({
  inq,
  viewerOrgId,
  variant,
}: {
  inq: CreditSnapshotInquiry;
  viewerOrgId: string | null;
  variant: "dialog" | "panel";
}) {
  const competing = isCompetingInquiry(inq, viewerOrgId);
  const stale = isStaleInquiry(inq);
  const testIdPrefix = variant === "dialog" ? "" : "panel-";
  const textSize = variant === "dialog" ? "text-xs" : "text-[11px]";

  const rowTone = competing
    ? "border-l-2 border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30"
    : "";
  // De-emphasize anything older than the 30-day competing-window so the
  // freshest pulls stand out — even competing rows fade once they're stale,
  // because the actionable signal is "another lender just pulled credit".
  const fade = stale ? "opacity-60" : "";

  return (
    <li
      key={inq.id}
      className={`flex items-start justify-between gap-2 p-2 ${textSize} ${rowTone} ${fade}`.trim()}
      data-testid={`${testIdPrefix}row-snapshot-inquiry-${inq.id}`}
      data-competing={competing ? "true" : "false"}
      data-stale={stale ? "true" : "false"}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`font-medium ${variant === "panel" ? "leading-tight" : ""} truncate`}
            data-testid={`${testIdPrefix}text-snapshot-inquiry-institution-${inq.id}`}
          >
            {inq.institution}
          </span>
          {competing && (
            <Badge
              variant="outline"
              className="shrink-0 h-4 px-1 text-[9px] uppercase tracking-wide font-semibold border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-200"
              data-testid={`${testIdPrefix}badge-snapshot-inquiry-competing-${inq.id}`}
              title="Another lender pulled this borrower's credit for a new facility"
            >
              <Flame className="w-2.5 h-2.5 mr-0.5" />
              Competing
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-sm border px-1 py-px text-[9px] font-medium uppercase tracking-wide ${inquiryPurposeBadgeClass(inq.purpose)}`}
            data-testid={`${testIdPrefix}text-snapshot-inquiry-purpose-${inq.id}`}
          >
            {formatInquiryPurpose(inq.purpose)}
          </span>
          {stale && (
            <span
              className="text-[9px] uppercase tracking-wide text-muted-foreground"
              data-testid={`${testIdPrefix}text-snapshot-inquiry-stale-${inq.id}`}
            >
              · older
            </span>
          )}
        </div>
      </div>
      <div
        className={`text-muted-foreground shrink-0 ${variant === "panel" ? "leading-tight" : ""}`}
        data-testid={`${testIdPrefix}text-snapshot-inquiry-date-${inq.id}`}
      >
        {inq.inquiredAt ? format(new Date(inq.inquiredAt), "dd MMM yyyy") : "—"}
      </div>
    </li>
  );
}

class CreditSnapshotError extends Error {
  code: "no_consent" | "consent_expired" | "consent_revoked" | "wrong_purpose" | "subject_not_found" | "forbidden" | "unknown";
  status: number;
  constructor(code: CreditSnapshotError["code"], status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function useBorrowerCreditSnapshot(borrowerId: string | undefined, enabled: boolean) {
  return useQuery<CreditSnapshotResponse, CreditSnapshotError>({
    queryKey: ["/api/cross-product/credit-snapshot", borrowerId],
    queryFn: async () => {
      const r = await fetch(`/api/cross-product/credit-snapshot/${borrowerId}`, { credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({} as { error?: string; code?: string; message?: string }));
        const known = ["no_consent", "consent_expired", "consent_revoked", "wrong_purpose", "subject_not_found"] as const;
        const rawCode = typeof body.error === "string" ? body.error : typeof body.code === "string" ? body.code : "";
        let code: CreditSnapshotError["code"];
        if ((known as readonly string[]).includes(rawCode)) {
          code = rawCode as CreditSnapshotError["code"];
        } else if (r.status === 403) {
          code = "forbidden";
        } else {
          code = "unknown";
        }
        throw new CreditSnapshotError(code, r.status, body.message || "Failed to load snapshot");
      }
      return r.json();
    },
    enabled: enabled && !!borrowerId,
    retry: false,
  });
}

function isConsentMissingError(error: CreditSnapshotError | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "no_consent" ||
    error.code === "consent_expired" ||
    error.code === "consent_revoked" ||
    error.code === "wrong_purpose" ||
    error.code === "subject_not_found"
  );
}

function BorrowerCreditSnapshotDialog({ borrowerId, itemId }: { borrowerId: string; itemId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useBorrowerCreditSnapshot(borrowerId, open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Borrower credit snapshot via consent gateway"
          data-testid={`btn-credit-snapshot-${itemId}`}
          className="h-7 px-2"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" data-testid={`dialog-credit-snapshot-${itemId}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> Borrower Credit Snapshot
          </DialogTitle>
        </DialogHeader>
        {isLoading && <Skeleton className="h-32 w-full" />}
        {error && isConsentMissingError(error) && (
          <div className="text-sm text-muted-foreground space-y-2" data-testid="text-snapshot-no-consent">
            <div className="font-medium text-amber-700 dark:text-amber-400">No active cross-product consent</div>
            <div>The borrower has not granted the Collateral Registry permission to view their Credit Bureau profile. Request consent to surface this snapshot here.</div>
          </div>
        )}
        {error && !isConsentMissingError(error) && (
          <div className="text-sm text-muted-foreground space-y-2" data-testid="text-snapshot-error">
            <div className="font-medium text-destructive">Couldn't load the credit snapshot</div>
            <div>
              {error.code === "forbidden"
                ? "Your role doesn't have access to the cross-product gateway."
                : "The cross-product gateway returned an unexpected error. Please try again later."}
            </div>
          </div>
        )}
        {data && (
          <div className="space-y-3 text-sm" data-testid="content-credit-snapshot">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Score</div><div className="text-lg font-semibold" data-testid="text-snapshot-score">{data.summary.score ?? "—"}</div></div>
              <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Active accts</div><div className="text-lg font-semibold" data-testid="text-snapshot-accounts">{data.summary.activeAccounts}</div></div>
              <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Total debt</div><div className="text-lg font-semibold" data-testid="text-snapshot-debt">{data.summary.totalDebt}</div></div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Inquiries · {data.summary.recentInquiryWindowDays}d</div>
                <div className="text-lg font-semibold" data-testid="text-snapshot-inquiries">{data.summary.recentInquiries}</div>
              </div>
            </div>
            <div className="space-y-1.5" data-testid="section-snapshot-recent-inquiries">
              <div className="text-xs font-medium text-muted-foreground">
                Recent inquiries · last {data.summary.recentInquiryWindowDays}d
              </div>
              {data.recentInquiries.length === 0 ? (
                <div
                  className="rounded-md border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground"
                  data-testid="text-snapshot-inquiries-empty"
                >
                  No credit inquiries from any institution in this window.
                </div>
              ) : (
                <ul className="rounded-md border divide-y">
                  {data.recentInquiries.map(inq => (
                    <InquiryRow
                      key={inq.id}
                      inq={inq}
                      viewerOrgId={data.viewerOrganizationId}
                      variant="dialog"
                    />
                  ))}
                </ul>
              )}
            </div>
            <div className="text-xs text-muted-foreground border-t pt-2">
              Served via cross-product gateway · consent <code className="font-mono">{data.consent.id.slice(0, 8)}…</code> · access logged.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BorrowerCreditSnapshotPanel({
  borrowerId,
  enabled,
}: {
  borrowerId: string | undefined;
  enabled: boolean;
}) {
  const { data, isLoading, error } = useBorrowerCreditSnapshot(borrowerId, enabled);

  return (
    <div data-testid="panel-borrower-credit-snapshot">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
        Borrower Credit Snapshot
        <Badge variant="outline" className="text-[10px] font-normal ml-auto">
          <Shield className="w-3 h-3 mr-1" /> Bridge
        </Badge>
      </p>

      {!borrowerId && (
        <div
          className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground"
          data-testid="snapshot-panel-no-borrower"
        >
          This registration is not linked to a registered borrower in the Credit Bureau, so no credit snapshot is available.
        </div>
      )}

      {borrowerId && isLoading && (
        <div className="space-y-2" data-testid="snapshot-panel-loading">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      )}

      {borrowerId && !isLoading && error && isConsentMissingError(error) && (
        <div
          className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1"
          data-testid="snapshot-panel-no-consent"
        >
          <div className="font-medium">No active cross-product consent</div>
          <div className="text-amber-700/90 dark:text-amber-400/90">
            The borrower has not granted the Collateral Registry permission to view their Credit Bureau profile. Once consent is captured, the headline score and recent inquiries will appear here.
          </div>
        </div>
      )}

      {borrowerId && !isLoading && error && !isConsentMissingError(error) && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive space-y-1"
          data-testid="snapshot-panel-error"
        >
          <div className="font-medium">
            {error.code === "forbidden"
              ? "You don't have permission to view this snapshot"
              : "Couldn't load the credit snapshot"}
          </div>
          <div className="text-destructive/80">
            {error.code === "forbidden"
              ? "Only lenders, regulators, and admins can request a borrower credit snapshot through the cross-product gateway."
              : "Something went wrong while contacting the cross-product gateway. Please try again, and if it keeps failing, ask an administrator to check the gateway logs."}
          </div>
        </div>
      )}

      {borrowerId && !isLoading && !error && data && (
        <div className="space-y-2" data-testid="snapshot-panel-content">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</div>
              <div className="text-lg font-semibold leading-tight" data-testid="panel-snapshot-score">
                {data.summary.score ?? "—"}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Active accts</div>
              <div className="text-lg font-semibold leading-tight" data-testid="panel-snapshot-accounts">
                {data.summary.activeAccounts}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total debt</div>
              <div className="text-lg font-semibold leading-tight" data-testid="panel-snapshot-debt">
                {data.summary.totalDebt}
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Inquiries · {data.summary.recentInquiryWindowDays}d
              </div>
              <div className="text-lg font-semibold leading-tight" data-testid="panel-snapshot-inquiries">
                {data.summary.recentInquiries}
              </div>
            </div>
          </div>
          <div className="space-y-1" data-testid="panel-snapshot-recent-inquiries">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Recent inquiries · last {data.summary.recentInquiryWindowDays}d
            </div>
            {data.recentInquiries.length === 0 ? (
              <div
                className="rounded-md border border-dashed bg-muted/30 p-2 text-[11px] text-muted-foreground"
                data-testid="panel-snapshot-inquiries-empty"
              >
                No credit inquiries from any institution in this window.
              </div>
            ) : (
              <ul className="rounded-md border divide-y">
                {data.recentInquiries.map(inq => (
                  <InquiryRow
                    key={inq.id}
                    inq={inq}
                    viewerOrgId={data.viewerOrganizationId}
                    variant="panel"
                  />
                ))}
              </ul>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug" data-testid="snapshot-panel-footer">
            Served via the cross-product gateway · consent{" "}
            <code className="font-mono">{data.consent.id.slice(0, 8)}…</code>{" "}
            · access logged as <code className="font-mono">cross_product_access</code>.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Lien Status Timeline Dialog ─────────────────────────────────────────────

interface CollateralDetail extends CollateralRegistryItem {
  createdAt?: string;
  approvalDate?: string;
  approvedByName?: string | null;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  timestamp?: string | null;
  actor?: string | null;
  note?: string | null;
  status: "done" | "active" | "pending";
}

function formatTimestamp(ts?: string | null) {
  if (!ts) return null;
  try {
    return format(new Date(ts), "d MMM yyyy, HH:mm");
  } catch {
    return ts;
  }
}

function LienStatusTimelineDialog({ item }: { item: CollateralDetail }) {
  const [open, setOpen] = useState(false);
  const { data: detail, isLoading } = useQuery<CollateralDetail>({
    queryKey: ["/api/collateral", item.id],
    queryFn: () => fetch(`/api/collateral/${item.id}`, { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const d = detail ?? item;
  const approvalStatus = d.approvalStatus ?? "pending";
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const isSettled = isApproved || isRejected;

  const steps: TimelineStep[] = [
    {
      key: "submitted",
      label: "Submitted",
      icon: <Send className="w-4 h-4" />,
      timestamp: formatTimestamp(d.createdAt),
      actor: null,
      note: "Financing statement filed with the Registry.",
      status: "done",
    },
    {
      key: "under_review",
      label: "Under Review",
      icon: <Eye className="w-4 h-4" />,
      timestamp: null,
      actor: null,
      note: isSettled ? null : "Awaiting Registry Authority review.",
      status: isSettled ? "done" : "active",
    },
    {
      key: "decision",
      label: isRejected ? "Rejected" : "Approved",
      icon: isRejected
        ? <XCircle className="w-4 h-4" />
        : <CheckCircle2 className="w-4 h-4" />,
      timestamp: formatTimestamp(d.approvalDate),
      actor: d.approvedByName ?? null,
      note: isRejected ? (d.rejectionReason ?? null) : (d.certificateNumber ? `Certificate: ${d.certificateNumber}` : null),
      status: isSettled ? "done" : "pending",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="View status history"
          data-testid={`btn-lien-history-${item.id}`}
          className="h-7 px-2"
        >
          <History className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Status History
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{d.registrationNumber}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : (
          <div className="relative py-2">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" aria-hidden="true" />
            <ol className="space-y-6" data-testid="lien-timeline">
              {steps.map((step, idx) => {
                const isDone = step.status === "done";
                const isActive = step.status === "active";
                const isPending = step.status === "pending";
                const isDecision = step.key === "decision";
                const dotColor = isDone
                  ? (isDecision && isRejected ? "bg-red-500 border-red-500" : "bg-primary border-primary")
                  : isActive
                  ? "bg-amber-400 border-amber-400"
                  : "bg-muted border-border";
                const labelColor = isDone
                  ? (isDecision && isRejected ? "text-red-600 dark:text-red-400" : "text-foreground")
                  : isActive
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground";

                return (
                  <li key={step.key} className="flex gap-4 relative" data-testid={`timeline-step-${step.key}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-background ${dotColor}`}>
                      <span className={isDone ? (isDecision && isRejected ? "text-red-500" : "text-primary") : isActive ? "text-amber-500" : "text-muted-foreground"}>
                        {step.icon}
                      </span>
                    </div>
                    <div className="flex-1 pt-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${labelColor}`}>{step.label}</span>
                        {isActive && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Current
                          </span>
                        )}
                        {isPending && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </div>
                      {step.timestamp && (
                        <p className="text-xs text-muted-foreground mt-0.5" data-testid={`timeline-timestamp-${step.key}`}>
                          <Clock className="w-3 h-3 inline mr-1" />{step.timestamp}
                        </p>
                      )}
                      {step.actor && (
                        <p className="text-xs text-muted-foreground" data-testid={`timeline-actor-${step.key}`}>
                          By {step.actor}
                        </p>
                      )}
                      {step.note && (
                        <p className={`text-xs mt-1 ${isDecision && isRejected ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`} data-testid={`timeline-note-${step.key}`}>
                          {isDecision && isRejected && <XCircle className="w-3 h-3 inline mr-1" />}
                          {step.note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Certificate Download & Preview ──────────────────────────────────────────

function downloadCertificate(item: { id: string; registrationNumber?: string }) {
  const a = document.createElement("a");
  a.href = `/api/collateral/${item.id}/certificate`;
  a.download = `cert-${item.registrationNumber}.pdf`;
  a.click();
}

interface CertificatePreviewData {
  registrationNumber?: string;
  certificateNumber?: string;
  authorityName?: string;
  legalRegime?: string;
  countryCode?: string;
  approvalDate?: string;
  lienPriority?: number;
  lenderInstitutionName?: string;
  borrowerName?: string;
  grantorNationalId?: string;
  debtorType?: string;
  panAfricanAssetId?: string;
  assetLocalIdentifier?: string;
  collateralType?: string;
  collateralClass?: string;
  estimatedValue?: string;
  currency?: string;
  description?: string;
  securityInterestType?: string;
  isPmsi?: boolean;
  financingDuration?: string;
  registrationDate?: string;
  expiryDate?: string;
  verificationCode?: string;
  verifyUrl?: string;
}

function CertificatePreviewDialog({ item }: { item: { id: string; registrationNumber?: string } }) {
  const [open, setOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<"A4" | "Letter">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const handlePrint = () => {
    const styleId = "print-page-settings";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `@page { size: ${paperSize} ${orientation}; margin: 12mm 10mm; }`;
    const cleanup = () => {
      style?.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const { data: preview, isLoading } = useQuery<CertificatePreviewData>({
    queryKey: ["/api/collateral", item.id, "certificate-preview"],
    queryFn: async () => {
      const res = await fetch(`/api/collateral/${item.id}/certificate-preview`);
      if (!res.ok) throw new Error("Failed to load preview");
      return res.json();
    },
    enabled: open,
  });

  const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
    if (value === undefined || value === null || value === "") return null;
    const display = typeof value === "boolean" ? (value ? "YES" : "NO") : String(value);
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
        <span className="text-sm font-medium break-all">{display}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Preview Certificate"
          data-testid={`btn-preview-cert-${item.id}`}
          onClick={() => setOpen(true)}
        >
          <Eye className="w-4 h-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-certificate-preview">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificate Preview
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4" data-testid="certificate-preview-skeleton">
            {/* Header skeleton */}
            <div className="border rounded-lg p-4 bg-muted/30 flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-44" />
            </div>

            <Separator />

            {/* Registration Details skeleton */}
            <div>
              <Skeleton className="h-3 w-36 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Parties skeleton */}
            <div>
              <Skeleton className="h-3 w-16 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Collateral Details skeleton */}
            <div>
              <Skeleton className="h-3 w-32 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Legal & Financial skeleton */}
            <div>
              <Skeleton className="h-3 w-32 mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Verification skeleton */}
            <div>
              <Skeleton className="h-3 w-24 mb-3" />
              <div className="flex gap-6 items-start">
                <Skeleton className="h-24 w-24 shrink-0 rounded" />
                <div className="space-y-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-28" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-4" data-testid="certificate-preview-content">
            {/* Header */}
            <div className="text-center space-y-0.5 border rounded-lg p-4 bg-muted/30">
              <div className="font-bold text-base uppercase tracking-wide">Pan-African Collateral Registry</div>
              <div className="font-semibold text-sm uppercase">{preview.authorityName}</div>
              <div className="text-xs text-muted-foreground">Financing Statement Certificate</div>
            </div>

            <Separator />

            {/* Registration Details */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Registration Details</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration Number" value={preview.registrationNumber} />
                <Field label="Certificate Number" value={preview.certificateNumber} />
                <Field label="Issuing Authority" value={preview.authorityName} />
                <Field label="Legal Regime" value={preview.legalRegime} />
                <Field label="Country" value={preview.countryCode} />
                <Field label="Approval Date" value={preview.approvalDate} />
                <Field label="Registration Date" value={preview.registrationDate} />
                <Field label="Lien Priority Rank" value={preview.lienPriority != null ? `#${preview.lienPriority}` : undefined} />
              </div>
            </div>

            <Separator />

            {/* Parties */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Parties</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Secured Party / Lender" value={preview.lenderInstitutionName} />
                <Field label="Borrower / Grantor" value={preview.borrowerName} />
                <Field label="Grantor National ID" value={preview.grantorNationalId} />
                <Field label="Debtor Type" value={preview.debtorType} />
              </div>
            </div>

            <Separator />

            {/* Collateral */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Collateral Details</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PACA-ID" value={preview.panAfricanAssetId} />
                <Field label="Asset Local Identifier" value={preview.assetLocalIdentifier} />
                <Field label="Collateral Type" value={preview.collateralType?.replace(/_/g, " ")} />
                <Field label="Collateral Class" value={preview.collateralClass?.replace(/_/g, " ")} />
                <Field label="Estimated Value" value={preview.estimatedValue && preview.currency ? `${preview.estimatedValue} ${preview.currency}` : preview.estimatedValue} />
                <Field label="Description" value={preview.description} />
              </div>
            </div>

            <Separator />

            {/* Legal */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Legal & Financial</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Security Interest Type" value={preview.securityInterestType?.replace(/_/g, " ")} />
                <Field label="PMSI (Purchase Money Super Priority)" value={preview.isPmsi} />
                <Field label="Financing Duration" value={preview.financingDuration} />
                <Field label="Expiry Date" value={preview.expiryDate || "Perpetual / As specified"} />
              </div>
            </div>

            <Separator />

            {/* Verification */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Verification</div>
              <div className="flex gap-6 items-start">
                {preview.verifyUrl && (
                  <div className="shrink-0 border rounded p-2 bg-white">
                    <QRCode value={preview.verifyUrl} size={96} data-testid="certificate-qr-code" />
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <Field label="Verification Code" value={preview.verificationCode} />
                  {preview.verifyUrl && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Verify URL</span>
                      <a
                        href={preview.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                        data-testid="certificate-verify-url"
                      >
                        {preview.verifyUrl}
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Scan the QR code or visit the link above to verify this lien registration.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="print:hidden pt-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Print settings</span>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="print-paper-size" className="text-xs text-muted-foreground whitespace-nowrap">Paper size</Label>
                  <Select value={paperSize} onValueChange={(v) => setPaperSize(v as "A4" | "Letter")}>
                    <SelectTrigger id="print-paper-size" className="h-7 text-xs w-24" data-testid="select-paper-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="print-orientation" className="text-xs text-muted-foreground whitespace-nowrap">Orientation</Label>
                  <Select value={orientation} onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}>
                    <SelectTrigger id="print-orientation" className="h-7 text-xs w-28" data-testid="select-orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} data-testid="btn-close-preview">
                Close
              </Button>
              <Button variant="outline" onClick={handlePrint} data-testid="btn-print-certificate">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => { downloadCertificate(item); }}
                data-testid="btn-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Register Collateral Dialog ───────────────────────────────────────────────

type CollateralFormData = {
  borrowerId: string;
  borrowerName: string;
  debtorType: string;
  loanApplicationId: string;
  collateralType: string;
  collateralClass: string;
  description: string;
  estimatedValue: string;
  currency: string;
  location: string;
  registrationDate: string;
  expiryDate: string;
  documentReference: string;
  notes: string;
  assetLocalIdentifier: string;
  legalRegime: string;
  countryCode: string;
  isPmsi: boolean;
  securityInterestType: string;
  financingDuration: string;
  dvlaVerificationRef: string;
  landsCommissionRef: string;
};

type RegisterCollateralDialogProps = {
  onSuccess: () => void;
  prefillData?: Partial<CollateralFormData>;
  rejectionReason?: string;
  resubmittedFromId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  editItemId?: string;
};

function RegisterCollateralDialog({
  onSuccess,
  prefillData,
  rejectionReason,
  resubmittedFromId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton,
  editItemId,
}: RegisterCollateralDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const org = user?.organization;

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const defaultCurrency = org?.country === "Nigeria" ? "NGN" : org?.country === "Kenya" ? "KES" : "GHS";

  const buildInitialForm = (): CollateralFormData => ({
    borrowerId: prefillData?.borrowerId ?? "",
    borrowerName: prefillData?.borrowerName ?? "",
    debtorType: prefillData?.debtorType ?? "individual",
    loanApplicationId: prefillData?.loanApplicationId ?? "",
    collateralType: prefillData?.collateralType ?? "real_estate",
    collateralClass: prefillData?.collateralClass ?? "other",
    description: prefillData?.description ?? "",
    estimatedValue: prefillData?.estimatedValue ?? "",
    currency: prefillData?.currency ?? defaultCurrency,
    location: prefillData?.location ?? "",
    registrationDate: today(),
    expiryDate: prefillData?.expiryDate ?? "",
    documentReference: prefillData?.documentReference ?? "",
    notes: prefillData?.notes ?? "",
    assetLocalIdentifier: prefillData?.assetLocalIdentifier ?? "",
    legalRegime: prefillData?.legalRegime ?? "",
    countryCode: prefillData?.countryCode ?? "GH",
    isPmsi: prefillData?.isPmsi ?? false,
    securityInterestType: prefillData?.securityInterestType ?? "loan_security",
    financingDuration: prefillData?.financingDuration ?? "custom",
    dvlaVerificationRef: "",
    landsCommissionRef: "",
  });

  const [form, setForm] = useState<CollateralFormData>(buildInitialForm);

  const [step, setStep] = useState(1);

  const isEditMode = !!editItemId;

  type CollateralSubmission = typeof form & { verificationCode: string; grantorIdentifier?: string; loanApplicationId?: string };
  const mutation = useMutation({
    mutationFn: (data: Partial<CollateralSubmission>) =>
      isEditMode
        ? apiRequest("PATCH", `/api/collateral/${editItemId}`, data)
        : apiRequest("POST", "/api/collateral", data),
    onSuccess: () => {
      toast({
        title: isEditMode ? "Amendment Saved" : "Financing Statement Submitted",
        description: isEditMode
          ? "The financing statement has been updated successfully."
          : "Your registration is pending Registry Authority approval.",
      });
      setOpen(false);
      setStep(1);
      onSuccess();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    const missingFields = isEditMode
      ? !form.description || !form.estimatedValue
      : !form.borrowerId || !form.description || !form.estimatedValue;
    if (missingFields) {
      const msg = isEditMode
        ? "Description and estimated value are required."
        : "Borrower ID, description, and value are required.";
      toast({ title: "Validation", description: msg, variant: "destructive" });
      return;
    }
    const { borrowerId: grantorIdRef, loanApplicationId, countryCode, ...payloadWithoutCountry } = form;
    if (isEditMode) {
      mutation.mutate({ ...payloadWithoutCountry, grantorIdentifier: grantorIdRef || undefined });
    } else {
      const verificationCode = genVerificationCode();
      mutation.mutate({
        ...payloadWithoutCountry,
        countryCode,
        verificationCode,
        grantorIdentifier: grantorIdRef || undefined,
        loanApplicationId: loanApplicationId || undefined,
      });
    }
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setStep(1); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          {triggerButton ?? (
            <Button data-testid="btn-register-collateral" className="gap-2">
              <Plus className="w-4 h-4" /> New Financing Statement
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {isEditMode ? "Amend Financing Statement" : prefillData ? "Fix & Resubmit Financing Statement" : "Register Financing Statement"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Step {step} of 3 — {step === 1 ? "Grantor & Borrower" : step === 2 ? "Collateral Details" : "Security Interest & Duration"}</p>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1 mb-2">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {prefillData && !isEditMode && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-1" data-testid="resubmit-notice">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Resubmission — review and correct the information below</p>
              {rejectionReason && (
                <p><span className="font-medium">Rejection reason:</span> {rejectionReason}</p>
              )}
              <p className="text-amber-700 dark:text-amber-300">This form is pre-filled with your previous submission. Fix the flagged issues and submit again as a new statement.</p>
            </div>
          </div>
        )}
        {isEditMode && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-1" data-testid="amend-notice">
            <Pencil className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-semibold">Amendment — update the details below</p>
              <p className="text-blue-700 dark:text-blue-300">The form is pre-filled with the current record. Make your changes and save the amendment.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Borrower / Grantor ID <span className="text-red-500">*</span></Label>
              <Input data-testid="input-col-borrower-id" placeholder="National ID, BVN, NIN…" value={form.borrowerId} onChange={e => set("borrowerId", e.target.value)} />
            </div>
            <div>
              <Label>Borrower Full Name</Label>
              <Input data-testid="input-col-borrower-name" placeholder="Full legal name" value={form.borrowerName} onChange={e => set("borrowerName", e.target.value)} />
            </div>
            <div>
              <Label>Debtor Type</Label>
              <Select value={form.debtorType} onValueChange={v => set("debtorType", v)}>
                <SelectTrigger data-testid="select-debtor-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual / Person</SelectItem>
                  <SelectItem value="corporate">Organisation / Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loan Application ID (optional)</Label>
              <Input placeholder="Link to loan application…" value={form.loanApplicationId} onChange={e => set("loanApplicationId", e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={form.countryCode} onValueChange={v => set("countryCode", v)}>
                <SelectTrigger data-testid="select-country"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AFRICAN_COUNTRIES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name} ({code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Legal Regime</Label>
              <Select value={form.legalRegime} onValueChange={v => set("legalRegime", v)}>
                <SelectTrigger><SelectValue placeholder="Select regime…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OHADA">OHADA</SelectItem>
                  <SelectItem value="Common Law">Common Law</SelectItem>
                  <SelectItem value="Civil Law">Civil Law</SelectItem>
                  <SelectItem value="Customary Law">Customary Law</SelectItem>
                  <SelectItem value="Sharia Law">Sharia Law</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Collateral Type <span className="text-red-500">*</span></Label>
              <Select value={form.collateralType} onValueChange={v => set("collateralType", v)}>
                <SelectTrigger data-testid="select-col-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLLATERAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collateral Class</Label>
              <Select value={form.collateralClass} onValueChange={v => set("collateralClass", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLLATERAL_CLASS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asset Local Identifier</Label>
              <Input data-testid="input-asset-identifier" placeholder="VIN, chassis, serial no., title deed ref…" value={form.assetLocalIdentifier} onChange={e => set("assetLocalIdentifier", e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Used for cross-institution lien search</p>
            </div>
            <div>
              <Label>Estimated Value <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Select value={form.currency} onValueChange={v => set("currency", v)}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input data-testid="input-col-value" type="number" placeholder="0.00" value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Location / Address</Label>
              <Input data-testid="input-col-location" placeholder="Physical location of asset" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div>
              <Label>Document Reference</Label>
              <Input placeholder="Title deed #, reg cert, etc." value={form.documentReference} onChange={e => set("documentReference", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea data-testid="input-col-description" placeholder="Detailed description of the collateral asset…" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes or conditions…" value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>

            {/* DVLA Verification — shown for vehicle collateral */}
            {(form.collateralType === "vehicle" || form.collateralClass === "motor_vehicle") && (
              <div className="col-span-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">DVLA Verification</p>
                    <p className="text-xs text-muted-foreground">Driver and Vehicle Licensing Authority — Ghana</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">DVLA Registration / Reference Number</Label>
                  <Input
                    data-testid="input-dvla-ref"
                    placeholder="e.g. GR-1234-22 or DVLA-REF-XXXXXXXX"
                    value={form.dvlaVerificationRef}
                    onChange={e => set("dvlaVerificationRef", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the vehicle registration number or DVLA title reference to enable cross-verification. The DVLA database confirms ownership and confirms no existing encumbrance on the vehicle.
                  </p>
                </div>
              </div>
            )}

            {/* Lands Commission Verification — shown for land/real estate collateral */}
            {(form.collateralType === "land" || form.collateralType === "real_estate") && (
              <div className="col-span-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                    <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Lands Commission Verification</p>
                    <p className="text-xs text-muted-foreground">Lands Commission of Ghana — Title &amp; Deed Registry</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Title Deed / Plot Reference Number</Label>
                  <Input
                    data-testid="input-lands-commission-ref"
                    placeholder="e.g. LC/ACCRA/2021/00123 or Plot No. 45, Block B"
                    value={form.landsCommissionRef}
                    onChange={e => set("landsCommissionRef", e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The Lands Commission reference confirms the title deed is registered, the grantor is the registered owner, and the land is free from prior encumbrances or cautions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 py-2">
            <div>
              <Label>Security Interest Type</Label>
              <Select value={form.securityInterestType} onValueChange={v => set("securityInterestType", v)}>
                <SelectTrigger data-testid="select-si-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECURITY_INTEREST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {form.securityInterestType === "retention_of_title" && "Seller retains title until full payment — protects goods if buyer defaults"}
                {form.securityInterestType === "blanket_lien" && "Covers ALL current and future assets of the borrower"}
                {form.securityInterestType === "lease" && "Certain leases can be registered to protect the lessor's interest"}
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border bg-violet-50 dark:bg-violet-950/20">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-600" /> Purchase Money Security Interest (PMSI)
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PMSI grants <strong>super priority</strong> over other creditors — even those who registered first — when you financed the purchase of the specific asset being pledged. Applies to seller-financed purchases and equipment financiers.
                </p>
              </div>
              <Switch
                data-testid="switch-pmsi"
                checked={form.isPmsi}
                onCheckedChange={v => set("isPmsi", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Registration Duration</Label>
                <Select value={form.financingDuration} onValueChange={v => set("financingDuration", v)}>
                  <SelectTrigger data-testid="select-duration"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FINANCING_DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.financingDuration === "perpetual" && "No expiry — applies to long-term or corporate blanket liens"}
                  {form.financingDuration === "7_years" && "Recommended for consumer property and short-term loans"}
                  {form.financingDuration === "25_years" && "For long-term commercial financing arrangements"}
                </p>
              </div>
              <div>
                <Label>Registration Date</Label>
                <Input type="date" value={form.registrationDate} onChange={e => set("registrationDate", e.target.value)} />
              </div>
              {form.financingDuration === "custom" && (
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} />
                </div>
              )}
            </div>

            {form.isPmsi && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs text-amber-800 dark:text-amber-200">
                <strong>PMSI Timing Requirement:</strong> To obtain super priority over other creditors, your PMSI registration must be submitted within 10 days of the grantor taking possession of the collateral.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {step < 3 ? (
              <Button data-testid="btn-next-step" onClick={() => setStep(s => s + 1)}>Continue →</Button>
            ) : (
              <Button data-testid="btn-submit-collateral" onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
                <Shield className="w-4 h-4" />
                {mutation.isPending
                  ? (isEditMode ? "Saving…" : "Submitting…")
                  : (isEditMode ? "Save Amendment" : "Submit Financing Statement")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lien Search Panel ────────────────────────────────────────────────────────

function LienDetailSheet({ lien, open, onClose }: { lien: SearchResultItem | null; open: boolean; onClose: () => void }) {
  if (!lien) return null;

  const Field = ({ icon, label, value }: { icon?: ReactNode; label: string; value?: string | number | boolean | null }) => {
    const display = value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
      ? (value ? "Yes" : "No")
      : String(value);
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-sm font-medium">{display}</div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" data-testid="sheet-lien-detail">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Lien Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Priority & PMSI */}
          <div className="flex items-center gap-3 flex-wrap">
            <PriorityBadge rank={lien.lienPriority ?? null} />
            {lien.isPmsi && <PmsiTag />}
            {!lien.isPmsi && (
              <span className="text-xs text-muted-foreground">No PMSI</span>
            )}
          </div>

          <Separator />

          {/* Registration */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Registration</div>
            <div className="grid grid-cols-1 gap-3">
              <Field
                icon={<Award className="w-3 h-3" />}
                label="Certificate Number"
                value={lien.certificateNumber}
              />
              <Field
                icon={<Calendar className="w-3 h-3" />}
                label="Registration Date"
                value={lien.registrationDate}
              />
              <Field
                icon={<Clock className="w-3 h-3" />}
                label="Expiry Date"
                value={lien.expiryDate || "No expiry"}
              />
            </div>
          </div>

          <Separator />

          {/* Lien Holder */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Lien Holder</div>
            <div className="grid grid-cols-1 gap-3">
              <Field
                icon={<Building2 className="w-3 h-3" />}
                label="Institution"
                value={lien.lenderInstitutionName || lien.lenderOrganizationId}
              />
            </div>
          </div>

          <Separator />

          {/* Collateral */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Collateral</div>
            <div className="grid grid-cols-1 gap-3">
              <Field
                icon={<Package className="w-3 h-3" />}
                label="Collateral Type"
                value={lien.collateralType?.replace(/_/g, " ")}
              />
              <Field
                icon={<TrendingUp className="w-3 h-3" />}
                label="Estimated Value"
                value={formatCurrency(lien.estimatedValue ?? null, lien.currency ?? undefined)}
              />
              <Field
                icon={<Zap className="w-3 h-3" />}
                label="PMSI (Purchase Money Super Priority)"
                value={lien.isPmsi}
              />
            </div>
          </div>

          <Separator />

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              This information is sourced from the public collateral registry. Grantor identifiers and other sensitive details are not disclosed in cross-institution search results.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LienSearchPanel() {
  const [assetId, setAssetId] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedLien, setSelectedLien] = useState<SearchResultItem | null>(null);

  const { data: results = [], isLoading, refetch } = useQuery<SearchResultItem[]>({
    queryKey: ["/api/collateral/search", assetId],
    queryFn: () => fetch(`/api/collateral/search?assetIdentifier=${encodeURIComponent(assetId)}`, { credentials: "include" }).then(r => r.json()),
    enabled: false,
  });

  const handleSearch = () => {
    if (!assetId.trim()) return;
    setSearched(true);
    setSelectedLien(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
        <h3 className="font-semibold flex items-center gap-2 mb-1"><Search className="w-4 h-4 text-blue-600" /> Cross-Institution Lien Search</h3>
        <p className="text-xs text-muted-foreground">Search for all registered liens against a specific asset across all licensed lenders in your country. Results include priority rankings — helping you assess pledging risk before lending. Search is scoped to your country only.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label>Asset Identifier</Label>
          <Input
            data-testid="input-lien-search-asset"
            placeholder="VIN, chassis number, title deed #, serial no…"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSearch} disabled={isLoading || !assetId.trim()} data-testid="btn-lien-search" className="gap-2">
            <Search className="w-4 h-4" /> {isLoading ? "Searching…" : "Search Register"}
          </Button>
        </div>
      </div>

      {searched && !isLoading && (
        <div>
          {results.length === 0 ? (
            <div className="p-8 text-center rounded-lg border">
              <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2" />
              <p className="font-medium text-green-700">No Liens Found</p>
              <p className="text-sm text-muted-foreground">This asset has no registered security interests in your country. It appears to be free from encumbrance.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-medium text-amber-700">{results.length} registered lien{results.length !== 1 ? "s" : ""} found on this asset</p>
                <span className="text-xs text-muted-foreground ml-auto">Click a row to view details</span>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Cert #</TableHead>
                      <TableHead>Lien Holder</TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>PMSI</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow
                        key={r.id}
                        data-testid={`row-lien-result-${r.id}`}
                        className="cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => setSelectedLien(r)}
                      >
                        <TableCell><PriorityBadge rank={r.lienPriority ?? null} /></TableCell>
                        <TableCell className="font-mono text-xs">{r.certificateNumber || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{r.lenderInstitutionName || r.lenderOrganizationId}</TableCell>
                        <TableCell className="text-sm capitalize">{r.collateralType?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(r.estimatedValue ?? null, r.currency ?? undefined)}</TableCell>
                        <TableCell>{r.isPmsi ? <PmsiTag /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.registrationDate}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.expiryDate || "No expiry"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      <LienDetailSheet
        lien={selectedLien}
        open={selectedLien !== null}
        onClose={() => setSelectedLien(null)}
      />
    </div>
  );
}

// ─── Verification Preview Popover ────────────────────────────────────────────

function VerifyInfoField({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Certificate Detail Sheet ─────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

function VerificationPreviewPopover({ item }: { item: CollateralRegistryItem }) {
  const [copied, setCopied] = useState(false);
  const collateralLabel = item.collateralType
    ? item.collateralType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify/${item.verificationCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Preview borrower verification page"
          data-testid={`btn-preview-verify-${item.id}`}
        >
          <Eye className="w-4 h-4 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        align="end"
        data-testid={`popover-verify-preview-${item.id}`}
      >
        <div className="bg-white dark:bg-slate-800">
          <div className="text-center px-4 pt-4 pb-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 rounded-full px-3 py-1 border border-slate-200 dark:border-slate-600 mb-2">
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Pan-African Collateral Registry</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Lien Verification</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Preview — what borrowers will see</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border-y border-green-100 dark:border-green-800 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-green-800 dark:text-green-300">Verified — Active Lien</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">This financing statement is valid and registered.</div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <VerifyInfoField
                icon={<FileText className="w-3 h-3" />}
                label="Registration No."
                value={item.registrationNumber}
              />
              <VerifyInfoField
                icon={<Shield className="w-3 h-3" />}
                label="Certificate No."
                value={item.certificateNumber}
              />
              <VerifyInfoField
                icon={<Building2 className="w-3 h-3" />}
                label="Secured Party"
                value={item.lenderInstitutionName}
              />
              <VerifyInfoField
                icon={<User className="w-3 h-3" />}
                label="Grantor"
                value={item.borrowerName}
              />
              <VerifyInfoField
                icon={<Tag className="w-3 h-3" />}
                label="Collateral Type"
                value={collateralLabel}
              />
              {item.lienPriority != null && (
                <VerifyInfoField
                  icon={<Shield className="w-3 h-3" />}
                  label="Lien Priority Rank"
                  value={`#${item.lienPriority}`}
                />
              )}
              {item.expiryDate && (
                <VerifyInfoField
                  icon={<Calendar className="w-3 h-3" />}
                  label="Expiry Date"
                  value={item.expiryDate}
                />
              )}
            </div>

            {item.verificationCode && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-3 py-2 flex items-center gap-3">
                <div className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">CODE</div>
                <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest truncate">{item.verificationCode}</div>
              </div>
            )}
          </div>

          {item.verificationCode && (
            <div className="px-4 pb-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <a
                  href={`${window.location.origin}/verify/${item.verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-open-verify-${item.id}`}
                  className="flex items-center justify-between gap-2 flex-1 min-w-0 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                >
                  <span className="font-mono text-xs text-blue-700 dark:text-blue-300 truncate">
                    {window.location.origin}/verify/{item.verificationCode}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid={`button-copy-verify-link-${item.id}`}
                  title="Copy verification link"
                  className="shrink-0 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                    : <Copy className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  }
                </button>
              </div>
            </div>
          )}

          <div className="px-4 pb-4 text-xs text-slate-400 dark:text-slate-500 text-center border-t border-slate-100 dark:border-slate-700 pt-2">
            Verified against the Pan-African Collateral Registry · {new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RejectionHistoryEntry {
  id: string;
  collateralItemId: string;
  reason: string;
  rejectedBy: string | null;
  rejectedAt: string;
}

interface AmendmentRequest {
  id: string;
  collateralItemId: string;
  requestedBy: string;
  lenderOrganizationId: string;
  proposedChanges: string;
  amendmentReason: string;
  status: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

function AmendmentRequestDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: {
  item: CollateralRegistryItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<Partial<CollateralFormData>>({
    borrowerName: item.borrowerName ?? "",
    description: item.description ?? "",
    estimatedValue: item.estimatedValue ?? "",
    currency: item.currency ?? "GHS",
    location: item.location ?? "",
    documentReference: item.documentReference ?? "",
    notes: item.notes ?? "",
    expiryDate: item.expiryDate ?? "",
    collateralType: item.collateralType ?? "",
    assetLocalIdentifier: item.assetLocalIdentifier ?? "",
  });

  const set = (k: keyof CollateralFormData, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/collateral/${item.id}/amendment`, {
        amendmentReason: reason.trim(),
        proposedChanges: form,
      }),
    onSuccess: () => {
      toast({
        title: "Amendment Request Submitted",
        description: "Your amendment request has been submitted for Registry Authority review.",
      });
      onOpenChange(false);
      setReason("");
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: "Submission failed",
        description: err?.message || "Could not submit the amendment request.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for the amendment.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Submit Amendment Request
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-2" data-testid="amendment-request-notice">
          <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-semibold">This registration is approved — changes require RA review</p>
            <p className="text-blue-700 dark:text-blue-300">Your proposed changes will be reviewed by the Registry Authority before being applied. The record will remain unchanged until approved.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Reason for Amendment <span className="text-red-500">*</span></Label>
            <Textarea
              data-testid="input-amendment-reason"
              placeholder="Explain why this amendment is needed…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Proposed Changes</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Borrower Name</Label>
                <Input data-testid="input-amend-borrower-name" value={form.borrowerName ?? ""} onChange={e => set("borrowerName", e.target.value)} />
              </div>
              <div>
                <Label>Collateral Type</Label>
                <Select value={form.collateralType ?? ""} onValueChange={v => set("collateralType", v)}>
                  <SelectTrigger data-testid="select-amend-col-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLLATERAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Asset Identifier</Label>
                <Input data-testid="input-amend-asset-id" value={form.assetLocalIdentifier ?? ""} onChange={e => set("assetLocalIdentifier", e.target.value)} />
              </div>
              <div>
                <Label>Estimated Value</Label>
                <div className="flex gap-2">
                  <Select value={form.currency ?? "GHS"} onValueChange={v => set("currency", v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input data-testid="input-amend-value" type="number" placeholder="0.00" value={form.estimatedValue ?? ""} onChange={e => set("estimatedValue", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input data-testid="input-amend-location" value={form.location ?? ""} onChange={e => set("location", e.target.value)} />
              </div>
              <div>
                <Label>Document Reference</Label>
                <Input data-testid="input-amend-doc-ref" value={form.documentReference ?? ""} onChange={e => set("documentReference", e.target.value)} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" data-testid="input-amend-expiry" value={form.expiryDate ?? ""} onChange={e => set("expiryDate", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea data-testid="input-amend-description" value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea data-testid="input-amend-notes" value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={2} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="btn-submit-amendment-request"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {mutation.isPending ? "Submitting…" : "Submit for RA Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PendingAmendmentsSheet({
  item,
  open,
  onOpenChange,
}: {
  item: CollateralRegistryItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: requests = [], isLoading } = useQuery<AmendmentRequest[]>({
    queryKey: ["/api/collateral", item.id, "amendment-requests"],
    queryFn: async () => {
      const res = await fetch(`/api/collateral/${item.id}/amendment-requests`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Amendment Requests — {item.registrationNumber}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No amendment requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              let parsed: Record<string, unknown> = {};
              try { parsed = JSON.parse(r.proposedChanges); } catch {}
              return (
                <div key={r.id} className="border rounded-lg p-3 space-y-2" data-testid={`amendment-request-row-${r.id}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "dd MMM yyyy")}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Reason</p>
                    <p className="text-sm">{r.amendmentReason}</p>
                  </div>
                  {Object.keys(parsed).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Proposed Changes</p>
                      <div className="text-xs space-y-0.5">
                        {Object.entries(parsed).filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-muted-foreground w-28 shrink-0">{k}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.reviewNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">RA Notes</p>
                      <p className="text-sm text-muted-foreground">{r.reviewNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AmendmentHistoryEntry {
  id: string;
  collateralItemId: string;
  amendedBy: string | null;
  amendedByName: string | null;
  changedFields: string; // JSON string: { field: { from, to } }
  amendedAt: string;
}

function CertificateDetailSheet({
  item,
  open,
  onClose,
}: {
  item: CollateralRegistryItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: rejectionHistory = [] } = useQuery<RejectionHistoryEntry[]>({
    queryKey: ["/api/collateral", item?.id, "rejection-history"],
    queryFn: async () => {
      const res = await fetch(`/api/collateral/${item!.id}/rejection-history`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!item?.id,
  });
  const { data: itemAmendments = [] } = useQuery<AmendmentRequest[]>({
    queryKey: ["/api/collateral", item?.id, "amendment-requests"],
    queryFn: async () => {
      const res = await fetch(`/api/collateral/${item!.id}/amendment-requests`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!item?.id && item?.approvalStatus === "approved",
  });
  const { data: amendmentHistory = [] } = useQuery<AmendmentHistoryEntry[]>({
    queryKey: ["/api/collateral", item?.id, "amendment-history"],
    queryFn: async () => {
      const res = await fetch(`/api/collateral/${item!.id}/amendment-history`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!item?.id,
  });
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendRequestOpen, setAmendRequestOpen] = useState(false);
  const [amendHistoryOpen, setAmendHistoryOpen] = useState(false);

  if (!item) return null;

  const collateralLabel = COLLATERAL_TYPES.find(t => t.value === item.collateralType)?.label ?? item.collateralType;
  const siLabel = SECURITY_INTEREST_TYPES.find(t => t.value === item.securityInterestType)?.label ?? item.securityInterestType;

  const canEditDraft = item.approvalStatus === "pending";
  const canAmendApproved = item.approvalStatus === "approved";
  const pendingAmendmentCount = itemAmendments.filter(r => r.status === "pending").length;

  const prefillForAmend: Partial<CollateralFormData> = {
    borrowerId: item.borrowerId,
    borrowerName: item.borrowerName,
    debtorType: item.debtorType,
    collateralType: item.collateralType,
    collateralClass: item.collateralClass,
    description: item.description,
    estimatedValue: item.estimatedValue,
    currency: item.currency,
    assetLocalIdentifier: item.assetLocalIdentifier,
    location: item.location,
    documentReference: item.documentReference,
    notes: item.notes,
    legalRegime: item.legalRegime,
    countryCode: item.countryCode,
    isPmsi: item.isPmsi,
    securityInterestType: item.securityInterestType,
    financingDuration: item.financingDuration,
    expiryDate: item.expiryDate,
  };

  const expiryDisplay =
    item.financingDuration === "perpetual"
      ? "No expiry (Perpetual)"
      : item.expiryDate
      ? format(new Date(item.expiryDate), "dd MMM yyyy")
      : item.financingDuration?.replace(/_/g, " ") || "—";

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
        data-testid="sheet-certificate-detail"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Financing Statement Details
          </SheetTitle>
        </SheetHeader>

        {/* Certificate & Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Certificate Number</p>
              <p className="font-mono text-sm font-semibold truncate" data-testid="detail-cert-number">
                {item.certificateNumber || "Not yet issued"}
              </p>
            </div>
            <div className="flex-shrink-0">
              <PriorityBadge rank={item.lienPriority ?? null} />
            </div>
          </div>

          {/* Approval / Status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`text-xs ${APPROVAL_COLORS[item.approvalStatus!] || "bg-gray-100 text-gray-600"}`} data-testid="detail-approval-status">
              {item.approvalStatus === "approved" ? <CheckCircle2 className="w-3 h-3 mr-1 inline" /> :
               item.approvalStatus === "rejected" ? <XCircle className="w-3 h-3 mr-1 inline" /> :
               <Clock className="w-3 h-3 mr-1 inline" />}
              {item.approvalStatus}
            </Badge>
            {item.status && (
              <Badge className={`text-xs ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`} data-testid="detail-status">
                {item.status.replace(/_/g, " ")}
              </Badge>
            )}
            {item.isPmsi && <PmsiTag />}
          </div>

          <Separator />

          {/* Grantor / Borrower */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Grantor (Borrower)</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Name" value={item.borrowerName} />
              <DetailRow label="Grantor ID" value={item.borrowerId} />
            </div>
          </div>

          <Separator />

          {/* Borrower Credit Snapshot (Cross-Product Bridge) */}
          <BorrowerCreditSnapshotPanel borrowerId={item.borrowerId} enabled={open} />

          <Separator />

          {/* Collateral */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Collateral</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Type" value={collateralLabel?.replace(/_/g, " ")} />
              <DetailRow label="Security Interest" value={siLabel} />
              <DetailRow
                label="Estimated Value"
                value={formatCurrency(item.estimatedValue ?? null, item.currency ?? undefined)}
              />
              <DetailRow label="Asset Identifier" value={item.assetLocalIdentifier} />
              {item.panAfricanAssetId && (
                <div className="col-span-2">
                  <DetailRow
                    label="Pan-African Asset ID"
                    value={
                      <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                        {item.panAfricanAssetId}
                      </span>
                    }
                  />
                </div>
              )}
              {item.description && (
                <div className="col-span-2">
                  <DetailRow label="Description" value={item.description} />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Registration */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Registration</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Reg Number" value={<span className="font-mono text-xs">{item.registrationNumber}</span>} />
              <DetailRow label="Expiry" value={expiryDisplay} />
              {item.verificationCode && (
                <div className="col-span-2">
                  <DetailRow
                    label="Verification Code"
                    value={<span className="font-mono text-xs">{item.verificationCode}</span>}
                  />
                </div>
              )}
            </div>
          </div>

          {item.approvalStatus === "rejected" && rejectionHistory.length === 0 && item.rejectionReason && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 text-sm text-red-700 dark:text-red-400">
                <p className="text-xs font-semibold mb-1">Rejection Reason</p>
                {item.rejectionReason}
              </div>
            </>
          )}

          {rejectionHistory.length > 0 && (
            <>
              <Separator />
              <div data-testid="rejection-history-section">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Rejection History
                </p>
                <div className="relative space-y-0" data-testid="rejection-history-list">
                  {rejectionHistory.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3" data-testid={`rejection-history-entry-${entry.id}`}>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <XCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                        </div>
                        {index < rejectionHistory.length - 1 && (
                          <div className="w-px flex-1 bg-red-200 dark:bg-red-800/50 mt-1 mb-1 min-h-[1rem]" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-xs text-muted-foreground mb-1" data-testid={`rejection-history-date-${entry.id}`}>
                          {format(new Date(entry.rejectedAt), "dd MMM yyyy, HH:mm")}
                        </p>
                        <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-300 leading-snug" data-testid={`rejection-history-reason-${entry.id}`}>
                            {entry.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {amendmentHistory.length > 0 && (
            <>
              <Separator />
              <div data-testid="amendment-history-section">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Amendment History
                </p>
                <div className="relative space-y-0" data-testid="amendment-history-list">
                  {amendmentHistory.map((entry, index) => {
                    let fields: Record<string, { from: unknown; to: unknown }> = {};
                    try { fields = JSON.parse(entry.changedFields); } catch { /* skip */ }
                    const fieldNames = Object.keys(fields);
                    return (
                      <div key={entry.id} className="flex gap-3" data-testid={`amendment-history-entry-${entry.id}`}>
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Pencil className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          </div>
                          {index < amendmentHistory.length - 1 && (
                            <div className="w-px flex-1 bg-blue-200 dark:bg-blue-800/50 mt-1 mb-1 min-h-[1rem]" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-xs text-muted-foreground mb-1" data-testid={`amendment-history-date-${entry.id}`}>
                            {format(new Date(entry.amendedAt), "dd MMM yyyy, HH:mm")}
                            {entry.amendedByName && (
                              <span className="ml-1 text-muted-foreground/70">— {entry.amendedByName}</span>
                            )}
                          </p>
                          <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" data-testid={`amendment-history-fields-${entry.id}`}>
                            {fieldNames.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No field details recorded</p>
                            ) : (
                              <ul className="space-y-1">
                                {fieldNames.map(field => (
                                  <li key={field} className="text-xs text-blue-700 dark:text-blue-300">
                                    <span className="font-medium capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</span>
                                    {": "}
                                    <span className="line-through text-muted-foreground">{String(fields[field].from ?? "—")}</span>
                                    <span className="mx-1">→</span>
                                    <span className="font-medium">{String(fields[field].to ?? "—")}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex flex-col gap-2">
            {canEditDraft && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setAmendOpen(true)}
                data-testid="detail-btn-amend"
              >
                <Pencil className="w-4 h-4" />
                Edit Draft Statement
              </Button>
            )}
            {canAmendApproved && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setAmendRequestOpen(true)}
                data-testid="detail-btn-amend-request"
              >
                <Pencil className="w-4 h-4" />
                Request Amendment
              </Button>
            )}
            {canAmendApproved && (
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setAmendHistoryOpen(true)}
                data-testid="detail-btn-view-amendments"
              >
                <History className="w-4 h-4" />
                View Amendment Requests
                {pendingAmendmentCount > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full" data-testid="badge-pending-amendments">
                    {pendingAmendmentCount} pending
                  </span>
                )}
              </Button>
            )}
            {item.approvalStatus === "approved" && item.certificateNumber && (
              <Button
                className="w-full gap-2"
                onClick={() => downloadCertificate(item)}
                data-testid="detail-btn-download-cert"
              >
                <Download className="w-4 h-4" />
                Download Certificate PDF
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      <RegisterCollateralDialog
        open={amendOpen}
        onOpenChange={setAmendOpen}
        editItemId={item.id}
        prefillData={prefillForAmend}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
          setAmendOpen(false);
        }}
      />

      <AmendmentRequestDialog
        item={item}
        open={amendRequestOpen}
        onOpenChange={setAmendRequestOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
        }}
      />

      <PendingAmendmentsSheet
        item={item}
        open={amendHistoryOpen}
        onOpenChange={setAmendHistoryOpen}
      />
    </Sheet>
  );
}

// ─── My Registrations Tab ─────────────────────────────────────────────────────

function MyRegistrations() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resubmitItem, setResubmitItem] = useState<CollateralRegistryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<CollateralRegistryItem | null>(null);
  const { toast } = useToast();

  const copyVerificationLink = (item: CollateralRegistryItem) => {
    const code = item.verificationCode;
    if (!code) return;
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied", description: "Verification link copied to clipboard." });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Could not copy link. Please try again.", variant: "destructive" });
    });
  };

  const { data: items = [], isLoading, refetch } = useQuery<CollateralRegistryItem[]>({
    queryKey: ["/api/collateral"],
    queryFn: () => fetch("/api/collateral", { credentials: "include" }).then(r => r.json()),
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.status === "active" && i.approvalStatus === "approved").length,
    pending: items.filter(i => i.approvalStatus === "pending").length,
    totalValue: items.filter(i => i.approvalStatus === "approved").reduce((s, i) => s + Number(i.estimatedValue || 0), 0),
    pmsiCount: items.filter(i => i.isPmsi).length,
  };

  const itemById = Object.fromEntries(items.map(i => [i.id, i]));

  // IDs of rejected items that already have an active (non-rejected) resubmission pending
  const alreadyResubmittedIds = new Set(
    items
      .filter(i => i.resubmittedFromId && i.approvalStatus !== "rejected")
      .map(i => i.resubmittedFromId as string)
  );

  const filtered = items.filter(i => {
    if (typeFilter !== "all" && i.collateralType !== typeFilter) return false;
    if (statusFilter !== "all" && i.approvalStatus !== statusFilter) return false;
    if (search && !i.registrationNumber?.toLowerCase().includes(search.toLowerCase()) &&
      !i.description?.toLowerCase().includes(search.toLowerCase()) &&
      !i.borrowerName?.toLowerCase().includes(search.toLowerCase()) &&
      !i.assetLocalIdentifier?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <CertificateDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Statements</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Active Liens</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending Approval</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-xl font-bold">{stats.totalValue.toLocaleString("en", { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-muted-foreground">Total Active Value</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-2xl font-bold text-violet-600">{stats.pmsiCount}</div>
          <div className="text-xs text-muted-foreground">PMSI Registrations</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input data-testid="input-search-collateral" placeholder="Search by reg #, borrower, asset ID…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {COLLATERAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="btn-refresh-collateral">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading financing statements…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Building className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No collateral assets registered yet. Submit your first financing statement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reg #</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status / Certificate</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      data-testid={`row-collateral-${item.id}`}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell><PriorityBadge rank={item.lienPriority ?? null} /></TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{item.registrationNumber}</div>
                        {item.resubmittedFromId && (
                          <div
                            className="text-xs text-amber-700 dark:text-amber-400 font-sans font-normal mt-0.5"
                            data-testid={`resubmission-label-${item.id}`}
                          >
                            Resubmission of #{itemById[item.resubmittedFromId]?.registrationNumber ?? item.resubmittedFromId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{item.borrowerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{item.borrowerId}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="capitalize">{item.collateralType?.replace(/_/g, " ")}</div>
                        {item.collateralClass && <div className="text-xs text-muted-foreground">{item.collateralClass.replace(/_/g, " ")}</div>}
                      </TableCell>
                      <TableCell>
                        {item.assetLocalIdentifier && <div className="font-mono text-xs">{item.assetLocalIdentifier}</div>}
                        {item.panAfricanAssetId && <div className="font-mono text-xs text-blue-600 dark:text-blue-400" data-testid={`paca-id-${item.id}`}>{item.panAfricanAssetId}</div>}
                        {!item.assetLocalIdentifier && !item.panAfricanAssetId && <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(item.estimatedValue ?? null, item.currency ?? undefined)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.financingDuration === "perpetual" ? "No expiry" :
                          item.expiryDate || (item.financingDuration === "7_years" ? "7 yr" : item.financingDuration?.replace("_", " ") || "—")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <Badge className={`text-xs ${APPROVAL_COLORS[item.approvalStatus!] || "bg-gray-100 text-gray-600"}`}>
                            {item.approvalStatus === "approved" ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> :
                              item.approvalStatus === "rejected" ? <XCircle className="w-3 h-3 inline mr-1" /> :
                              <Clock className="w-3 h-3 inline mr-1" />}
                            {item.approvalStatus}
                          </Badge>
                          {item.approvalStatus === "approved" && item.certificateNumber && (
                            <div
                              className="flex items-center gap-1 text-xs font-semibold font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded px-1.5 py-0.5 w-fit"
                              data-testid={`cert-number-${item.id}`}
                            >
                              <Award className="w-3 h-3 flex-shrink-0" />
                              {item.certificateNumber}
                            </div>
                          )}
                          {item.approvalStatus === "rejected" && item.rejectionReason && (
                            <div
                              className="flex items-start gap-1 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-1.5 py-0.5 max-w-[160px]"
                              title={item.rejectionReason}
                              data-testid={`rejection-reason-${item.id}`}
                            >
                              <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="break-words">{item.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {item.isPmsi && <PmsiTag />}
                          {item.securityInterestType && item.securityInterestType !== "loan_security" && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              {item.securityInterestType.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {(item.shareCount ?? 0) > 0 ? (
                            <Badge
                              className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                              data-testid={`share-count-badge-${item.id}`}
                            >
                              Shared {item.shareCount}×
                            </Badge>
                          ) : (
                            <span
                              className="text-xs text-muted-foreground"
                              data-testid={`share-count-none-${item.id}`}
                            >
                              Not shared
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 items-center flex-wrap">
                          <LienStatusTimelineDialog item={item} />
                          {item.borrowerId && (
                            <BorrowerCreditSnapshotDialog borrowerId={item.borrowerId} itemId={item.id} />
                          )}
                          {item.approvalStatus === "approved" && (
                            <>
                              <div onClick={e => e.stopPropagation()}>
                                <CertificatePreviewDialog item={item} />
                              </div>
                              {item.verificationCode && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); copyVerificationLink(item); }}
                                    title="Copy verification link"
                                    data-testid={`btn-copy-verify-link-${item.id}`}
                                  >
                                    <Link2 className="w-4 h-4 text-primary" />
                                  </Button>
                                  <div onClick={e => e.stopPropagation()}>
                                    <VerificationPreviewPopover item={item} />
                                  </div>
                                  <div onClick={e => e.stopPropagation()}>
                                    <ShareVerificationLinkDialog item={item} />
                                  </div>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); downloadCertificate(item); }}
                                title="Download PDF Certificate"
                                data-testid={`btn-download-cert-${item.id}`}
                                className="gap-1.5 text-xs h-7 px-2 text-primary border-primary/30 hover:bg-primary/5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Certificate
                              </Button>
                            </>
                          )}
                          {item.approvalStatus === "rejected" && (() => {
                            const isChain = !!item.resubmittedFromId;
                            const hasPending = alreadyResubmittedIds.has(item.id);
                            const isBlocked = isChain || hasPending;
                            const tooltipMsg = isChain
                              ? "This item is already a resubmission and cannot be resubmitted again"
                              : "A resubmission is already in progress for this item";
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); if (!isBlocked) setResubmitItem(item); }}
                                        disabled={isBlocked}
                                        data-testid={`btn-fix-resubmit-${item.id}`}
                                        className="gap-1.5 text-xs h-7 px-2 text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Fix &amp; Resubmit
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {isBlocked && (
                                    <TooltipContent side="top">
                                      <p>{tooltipMsg}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {resubmitItem && (
        <RegisterCollateralDialog
          onSuccess={() => {
            setResubmitItem(null);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["/api/collateral"] });
          }}
          resubmittedFromId={resubmitItem.id}
          prefillData={{
            borrowerId: resubmitItem.borrowerId,
            borrowerName: resubmitItem.borrowerName,
            debtorType: resubmitItem.debtorType,
            collateralType: resubmitItem.collateralType,
            collateralClass: resubmitItem.collateralClass,
            description: resubmitItem.description,
            estimatedValue: resubmitItem.estimatedValue,
            currency: resubmitItem.currency,
            assetLocalIdentifier: resubmitItem.assetLocalIdentifier,
            location: resubmitItem.location,
            documentReference: resubmitItem.documentReference,
            notes: resubmitItem.notes,
            legalRegime: resubmitItem.legalRegime,
            countryCode: resubmitItem.countryCode,
            isPmsi: resubmitItem.isPmsi,
            securityInterestType: resubmitItem.securityInterestType,
            financingDuration: resubmitItem.financingDuration,
            expiryDate: resubmitItem.expiryDate,
          }}
          rejectionReason={resubmitItem.rejectionReason}
          open={true}
          onOpenChange={(v) => { if (!v) setResubmitItem(null); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollateralRegistryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Collateral Registry
          </h1>
          <p className="text-muted-foreground text-sm">Pan-African pledged-asset registry — register financing statements, search cross-institution liens, track priority</p>
        </div>
        <RegisterCollateralDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/collateral"] })} />
      </div>

      <Tabs defaultValue="my-statements">
        <TabsList data-testid="tabs-collateral">
          <TabsTrigger value="my-statements" data-testid="tab-my-statements">
            <FileText className="w-4 h-4 mr-2" /> My Financing Statements
          </TabsTrigger>
          <TabsTrigger value="lien-search" data-testid="tab-lien-search">
            <Search className="w-4 h-4 mr-2" /> Cross-Institution Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-statements" className="mt-4">
          <MyRegistrations />
        </TabsContent>

        <TabsContent value="lien-search" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Lien Register Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LienSearchPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
