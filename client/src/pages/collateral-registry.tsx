import { useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import QRCode from "react-qr-code";
import {
  Building, Plus, Search, RefreshCw, MapPin, FileText,
  Award, Clock, CheckCircle2, XCircle, AlertTriangle,
  Download, Shield, Zap, Star, TrendingUp, Package, Link2,
  Eye, CheckCircle, Building2, User, Tag, Calendar, ExternalLink, Copy, Check,
  Share2, Mail, MessageSquare,
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
  assetLocalIdentifier?: string;
  panAfricanAssetId?: string;
  estimatedValue?: string;
  currency?: string;
  financingDuration?: string;
  expiryDate?: string;
  approvalStatus?: string;
  certificateNumber?: string;
  rejectionReason?: string;
  lienPriority?: number;
  isPmsi?: boolean;
  status?: string;
  securityInterestType?: string;
  description?: string;
  verificationCode?: string;
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

function ShareVerificationLinkDialog({ item }: { item: CollateralRegistryItem }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [recipient, setRecipient] = useState("");

  const shareMutation = useMutation({
    mutationFn: ({ channel, recipient }: { channel: "email" | "sms"; recipient: string }) =>
      apiRequest("POST", `/api/collateral/${item.id}/share`, { channel, recipient }),
    onSuccess: () => {
      toast({
        title: "Verification link sent",
        description: channel === "email"
          ? `Email sent to ${recipient}`
          : `SMS sent to ${recipient}`,
      });
      setOpen(false);
      setRecipient("");
    },
    onError: (e: Error) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (!recipient.trim()) {
      toast({ title: "Recipient required", description: "Please enter an email address or phone number.", variant: "destructive" });
      return;
    }
    shareMutation.mutate({ channel, recipient: recipient.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setRecipient(""); }}>
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
        </div>
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
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading certificate data…
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
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} data-testid="btn-close-preview">
                Close
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
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Register Collateral Dialog ───────────────────────────────────────────────

function RegisterCollateralDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const org = user?.organization;

  const [form, setForm] = useState({
    borrowerId: "",
    borrowerName: "",
    debtorType: "individual",
    loanApplicationId: "",
    collateralType: "real_estate",
    collateralClass: "other",
    description: "",
    estimatedValue: "",
    currency: org?.country === "Nigeria" ? "NGN" : org?.country === "Kenya" ? "KES" : "GHS",
    location: "",
    registrationDate: today(),
    expiryDate: "",
    documentReference: "",
    notes: "",
    assetLocalIdentifier: "",
    legalRegime: "",
    countryCode: "GH",
    isPmsi: false,
    securityInterestType: "loan_security",
    financingDuration: "custom",
  });

  const [step, setStep] = useState(1);

  type CollateralSubmission = typeof form & { verificationCode: string; grantorIdentifier?: string; loanApplicationId?: string };
  const mutation = useMutation({
    mutationFn: (data: Partial<CollateralSubmission>) => apiRequest("POST", "/api/collateral", data),
    onSuccess: () => {
      toast({ title: "Financing Statement Submitted", description: "Your registration is pending Registry Authority approval." });
      setOpen(false);
      setStep(1);
      onSuccess();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.borrowerId || !form.description || !form.estimatedValue) {
      toast({ title: "Validation", description: "Borrower ID, description, and value are required.", variant: "destructive" });
      return;
    }
    const verificationCode = genVerificationCode();
    const { borrowerId: grantorIdRef, loanApplicationId, ...payload } = form;
    // borrowerId from the form is the grantor's government/national ID — send as grantorIdentifier.
    // documentReference stays as the user typed it (title deed #, reg cert, etc.)
    mutation.mutate({
      ...payload,
      verificationCode,
      grantorIdentifier: grantorIdRef || undefined,
      loanApplicationId: loanApplicationId || undefined,
    });
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        <Button data-testid="btn-register-collateral" className="gap-2">
          <Plus className="w-4 h-4" /> New Financing Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Register Financing Statement
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Step {step} of 3 — {step === 1 ? "Grantor & Borrower" : step === 2 ? "Collateral Details" : "Security Interest & Duration"}</p>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1 mb-2">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

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
                {mutation.isPending ? "Submitting…" : "Submit Financing Statement"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lien Search Panel ────────────────────────────────────────────────────────

function LienSearchPanel() {
  const [assetId, setAssetId] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: results = [], isLoading, refetch } = useQuery<SearchResultItem[]>({
    queryKey: ["/api/collateral/search", assetId],
    queryFn: () => fetch(`/api/collateral/search?assetIdentifier=${encodeURIComponent(assetId)}`, { credentials: "include" }).then(r => r.json()),
    enabled: false,
  });

  const handleSearch = () => {
    if (!assetId.trim()) return;
    setSearched(true);
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
                      <TableRow key={r.id} data-testid={`row-lien-result-${r.id}`}>
                        <TableCell><PriorityBadge rank={r.lienPriority} /></TableCell>
                        <TableCell className="font-mono text-xs">{r.certificateNumber || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{r.lenderInstitutionName || r.lenderOrganizationId}</TableCell>
                        <TableCell className="text-sm capitalize">{r.collateralType?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(r.estimatedValue, r.currency)}</TableCell>
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
    </div>
  );
}

// ─── Verification Preview Popover ────────────────────────────────────────────

function VerifyInfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
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

// ─── My Registrations Tab ─────────────────────────────────────────────────────

function MyRegistrations() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
                    <TableRow key={item.id} data-testid={`row-collateral-${item.id}`}>
                      <TableCell><PriorityBadge rank={item.lienPriority} /></TableCell>
                      <TableCell className="font-mono text-xs">{item.registrationNumber}</TableCell>
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
                      <TableCell className="text-right text-sm">{formatCurrency(item.estimatedValue, item.currency)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.financingDuration === "perpetual" ? "No expiry" :
                          item.expiryDate || (item.financingDuration === "7_years" ? "7 yr" : item.financingDuration?.replace("_", " ") || "—")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <Badge className={`text-xs ${APPROVAL_COLORS[item.approvalStatus] || "bg-gray-100 text-gray-600"}`}>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.approvalStatus === "approved" && (
                            <>
                              <CertificatePreviewDialog item={item} />
                              {item.verificationCode && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyVerificationLink(item)}
                                    title="Copy verification link"
                                    data-testid={`btn-copy-verify-link-${item.id}`}
                                  >
                                    <Link2 className="w-4 h-4 text-primary" />
                                  </Button>
                                  <VerificationPreviewPopover item={item} />
                                  <ShareVerificationLinkDialog item={item} />
                                </>
                              )}
                            </>
                          )}
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
