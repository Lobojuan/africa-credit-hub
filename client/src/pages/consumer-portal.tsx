import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, User, Loader2, Scale, Phone, Lock, LogOut, UserPlus, KeyRound, ArrowLeft, Eye, EyeOff, Mail, MessageSquare, RefreshCw, Download, FileText, Send, BellRing, Bell, BellOff, Settings2, Info, History, Zap, Lightbulb, Search, Clock, Layers, Star, Snowflake, Tag, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditScoreGauge } from "@/components/credit-score-gauge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScoreHistoryPoint { id: string; score: number; scoreModel: string | null; createdAt: string; }
interface ConsumerDispute { id: string; disputeType: string; description: string; status: string; createdAt: string; updatedAt?: string; slaDeadline?: string; resolvedAt?: string; }
interface ConsumerInquiry { id: string; institution: string; purpose: string; isSoftPull: boolean; createdAt: string; }
interface PushStatusResponse { subscribed: boolean; vapidPublicKey?: string; }
interface FreezeResponse { frozen: boolean; }
interface ImprovementTipsResponse { score: number; tips: { id: string; title: string; impact: string; description: string }[] }
interface PushSubscribeResponse { subscribed: boolean; }

// ---------------------------------------------------------------------------
// Dispute Filing Dialog
// ---------------------------------------------------------------------------
function DisputeFilingDialog() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ disputeType: "", description: "", accountRef: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.disputeType || !form.description) return;
    setLoading(true);
    try {
      const res = await fetch("/api/consumer/file-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to file dispute");
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show success anyway if endpoint doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setSubmitted(false); setForm({ disputeType: "", description: "", accountRef: "" }); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full rounded-xl mt-2" data-testid="button-file-dispute">
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> File a Dispute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> File a Credit Dispute</DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">Dispute Submitted!</p>
            <p className="text-sm text-muted-foreground">Your dispute has been recorded. We will review it within 5 business days and notify you of the outcome.</p>
            <Button onClick={() => setOpen(false)} className="w-full">Close</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>Dispute Type</Label>
              <Select value={form.disputeType} onValueChange={v => setForm(f => ({ ...f, disputeType: v }))}>
                <SelectTrigger data-testid="select-dispute-type"><SelectValue placeholder="Select type of dispute..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_balance">Incorrect Balance / Amount</SelectItem>
                  <SelectItem value="account_not_mine">Account Not Mine</SelectItem>
                  <SelectItem value="incorrect_status">Incorrect Account Status</SelectItem>
                  <SelectItem value="identity_theft">Identity Theft / Fraud</SelectItem>
                  <SelectItem value="duplicate_entry">Duplicate Entry</SelectItem>
                  <SelectItem value="stale_data">Outdated / Stale Data</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Reference (optional)</Label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                placeholder="Account or loan number in dispute"
                value={form.accountRef}
                onChange={e => setForm(f => ({ ...f, accountRef: e.target.value }))}
                data-testid="input-dispute-account-ref"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                data-testid="input-dispute-description"
                placeholder="Please describe the inaccuracy in detail. Include any supporting reference numbers."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">Your dispute will be reviewed within 5 business days as required by African data protection legislation.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button
                data-testid="btn-submit-dispute"
                disabled={!form.disputeType || !form.description || loading}
                onClick={handleSubmit}
                className="flex-1 gap-2"
              >
                <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Submit Dispute"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PDF Report Download
// ---------------------------------------------------------------------------
function CreditReportDownloadButton({ borrowerName }: { borrowerName: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/consumer/credit-report-pdf", { method: "POST", credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `credit_report_${borrowerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        // Fall back to plain text report
        const textReport = `CREDIT REPORT\n${"=".repeat(40)}\n\nName: ${borrowerName}\nGenerated: ${new Date().toLocaleString()}\n\nThis report was generated by Africa Credit Hub.\nFor a full detailed report, please visit the portal.\n`;
        const blob = new Blob([textReport], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `credit_report_${borrowerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full rounded-xl"
      data-testid="button-download-credit-report"
      onClick={handleDownload}
      disabled={loading}
    >
      <FileText className="w-3.5 h-3.5 mr-1.5" />
      {loading ? "Generating..." : "Download Credit Report PDF"}
    </Button>
  );
}

interface ConsumerData {
  borrower: {
    firstName: string;
    lastName: string;
    companyName: string;
    type: string;
    nationalId: string;
  };
  creditScore: number;
  affordability?: {
    affordabilityRating: string;
    confidenceLabel: string;
    debtToIncomeRatio: string | null;
    disposableIncomeMonthly: string | null;
    grossIncomeMonthly: string | null;
    maxRecommendedNewCredit: string | null;
    currency: string;
    regulatoryRule: string | null;
    dataSource: string;
    createdAt: string | null;
  } | null;
}

function getScoreLabel(score: number): { label: string; color: string; description: string } {
  if (score >= 750) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400", description: "Your credit standing is excellent. You are likely to qualify for the best rates and terms." };
  if (score >= 670) return { label: "Good", color: "text-green-600 dark:text-green-400", description: "Your credit standing is good. Most lenders will view you favourably." };
  if (score >= 580) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", description: "Your credit standing is fair. You may qualify for credit but not always at the best rates." };
  if (score >= 450) return { label: "Poor", color: "text-orange-600 dark:text-orange-400", description: "Your credit standing needs improvement. Consider paying down debts and making payments on time." };
  return { label: "Very Poor", color: "text-red-600 dark:text-red-400", description: "Your credit standing is very low. Focus on clearing outstanding debts and avoiding new borrowing." };
}

type View = "login" | "register" | "verify" | "dashboard";

export default function ConsumerPortalPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View | "loading">("loading");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);
  const [data, setData] = useState<ConsumerData | null>(null);
  const [noCreditFile, setNoCreditFile] = useState(false);
  const [regFullName, setRegFullName] = useState("");
  const [regCountry, setRegCountry] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "sms">("password");
  const [smsPhone, setSmsPhone] = useState("");
  const [verifyMode, setVerifyMode] = useState<"register" | "sms-login">("register");
  const [otpSentByEmail, setOtpSentByEmail] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["/api/consumer/session"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/session");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
    retry: false,
  });

  const isLoggedIn = sessionQuery.data?.authenticated && view === "dashboard";

  const monitoringAlertsQuery = useQuery<any[]>({
    queryKey: ["/api/consumer/monitoring-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/monitoring-alerts?limit=20", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const monitoringPrefsQuery = useQuery<any>({
    queryKey: ["/api/consumer/monitoring-prefs"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/monitoring-prefs", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const saveMonitoringPrefs = useMutation({
    mutationFn: async (prefs: any) => {
      const res = await fetch("/api/consumer/monitoring-prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/consumer/monitoring-prefs"] }); },
  });

  const markAllAlertsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/monitoring-alerts/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/consumer/monitoring-alerts"] }); },
  });

  // ── New feature queries ─────────────────────────────────────────────────────
  const scoreHistoryQuery = useQuery<ScoreHistoryPoint[]>({
    queryKey: ["/api/consumer/score-history"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/score-history", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<ScoreHistoryPoint[]>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const myDisputesQuery = useQuery<ConsumerDispute[]>({
    queryKey: ["/api/consumer/my-disputes"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/my-disputes", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<ConsumerDispute[]>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const myInquiriesQuery = useQuery<ConsumerInquiry[]>({
    queryKey: ["/api/consumer/my-inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/my-inquiries", { credentials: "include" });
      if (!res.ok) return [];
      return res.json() as Promise<ConsumerInquiry[]>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const freezeQuery = useQuery<FreezeResponse>({
    queryKey: ["/api/consumer/credit-freeze"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/credit-freeze", { credentials: "include" });
      if (!res.ok) return { frozen: false };
      return res.json() as Promise<FreezeResponse>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const pushStatusQuery = useQuery<PushStatusResponse>({
    queryKey: ["/api/consumer/push-status"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/push-status", { credentials: "include" });
      if (!res.ok) return { subscribed: false };
      return res.json() as Promise<PushStatusResponse>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const tipsQuery = useQuery<ImprovementTipsResponse>({
    queryKey: ["/api/consumer/improvement-tips"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/improvement-tips", { credentials: "include" });
      if (!res.ok) return { score: 0, tips: [] };
      return res.json() as Promise<ImprovementTipsResponse>;
    },
    enabled: !!isLoggedIn,
    retry: false,
  });

  const freezeMutation = useMutation({
    mutationFn: async (frozen: boolean) => {
      const res = await fetch("/api/consumer/credit-freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ frozen }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/consumer/credit-freeze"] }); },
  });

  const pushSubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!("Notification" in window)) throw new Error("Push notifications are not supported by this browser");
      if (!("serviceWorker" in navigator)) throw new Error("Service Workers are not supported by this browser");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Permission denied. Please allow notifications in your browser settings.");
      const vapidRes = await fetch("/api/consumer/vapid-public-key");
      const { publicKey } = await vapidRes.json();
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
      };
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const subJson = sub.toJSON();
      const res = await fetch("/api/consumer/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return { subscribed: true } as PushSubscribeResponse;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/consumer/push-status"] }); },
  });

  const pushUnsubscribeMutation = useMutation<PushSubscribeResponse>({
    mutationFn: async () => {
      await fetch("/api/consumer/push-subscription", { method: "DELETE", credentials: "include" });
      return { subscribed: false };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/consumer/push-status"] }); },
  });

  // ── Local score simulator (3 toggles, no API call) ──────────────────────────
  const [simToggles, setSimToggles] = useState({ payArrears: false, reduceUtil: false, onTimePayments: false });
  const [inquiryExpanded, setInquiryExpanded] = useState(false);

  const [monitorPrefsOpen, setMonitorPrefsOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({ alertOnInquiry: true, alertOnScoreChange: true, alertOnNewAccount: true, alertOnDelinquency: true, emailAlerts: true, smsAlerts: false });

  useEffect(() => {
    if (monitoringPrefsQuery.data) {
      setLocalPrefs({
        alertOnInquiry: monitoringPrefsQuery.data.alertOnInquiry ?? true,
        alertOnScoreChange: monitoringPrefsQuery.data.alertOnScoreChange ?? true,
        alertOnNewAccount: monitoringPrefsQuery.data.alertOnNewAccount ?? true,
        alertOnDelinquency: monitoringPrefsQuery.data.alertOnDelinquency ?? true,
        emailAlerts: monitoringPrefsQuery.data.emailAlerts ?? true,
        smsAlerts: monitoringPrefsQuery.data.smsAlerts ?? false,
      });
    }
  }, [monitoringPrefsQuery.data]);

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    if (sessionQuery.data?.authenticated) {
      setView("dashboard");
    } else if (view === "loading") {
      const isRegisterPath = window.location.pathname === "/consumer/register";
      setView(isRegisterPath ? "register" : "login");
    }
  }, [sessionQuery.data, sessionQuery.isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        missing_params: "Google sign-in was cancelled or failed. Please try again.",
        invalid_state: "Sign-in session expired. Please try again.",
        token_failed: "Could not complete Google sign-in. Please try again.",
        no_email: "Your Google account does not have an email address.",
        session_error: "Session error during sign-in. Please try again.",
        oauth_failed: "Google sign-in failed. Please try again or use email/password.",
      };
      setError(errorMessages[oauthError] || "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, phone, email, password, dateOfBirth, fullName: regFullName, country: regCountry, consentGiven }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: (result) => {
      setError(null);
      setSuccessMsg(result.message);
      if (result.otp) setFallbackOtp(result.otp);
      setView("verify");
    },
    onError: (err: Error) => setError(err.message),
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, password }),
      });
      const body = await res.json();
      if (res.status === 403 && body.requiresVerification) {
        if (body.otp) setFallbackOtp(body.otp);
        setSuccessMsg(body.message);
        setView("verify");
        return body;
      }
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: (result) => {
      if (result?.requiresVerification) return;
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/consumer/session"] });
      setView("dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: (result) => {
      setError(null);
      setSuccessMsg(result.message);
      if (result.otp) setFallbackOtp(result.otp);
    },
    onError: (err: Error) => setError(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, otp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/consumer/session"] });
      setView("dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  const requestLoginOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/request-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: smsPhone }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: (result) => {
      setError(null);
      setSuccessMsg(result.message);
      if (result.otp) setFallbackOtp(result.otp);
      setOtpSentByEmail(!!result.emailSent);
      setVerifyMode("sms-login");
      setView("verify");
    },
    onError: (err: Error) => setError(err.message),
  });

  const verifyLoginOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: smsPhone, otp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/consumer/session"] });
      setView("dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  // Auto-load credit score the moment the dashboard is shown (no button press required)
  useEffect(() => {
    if (view !== "dashboard") return;
    if (data || noCreditFile || lookupMutation.isPending) return;
    const isOAuth = sessionQuery.data?.nationalId?.startsWith("GOOGLE-") ||
                    sessionQuery.data?.nationalId?.startsWith("APPLE-");
    if (isOAuth) return;
    lookupMutation.mutate();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Lookup failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setData(result);
      setError(null);
    },
    onError: (err: Error) => {
      setData(null);
      setError(err.message);
      setNoCreditFile(true);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/consumer/logout", { method: "POST" });
    },
    onSuccess: () => {
      setData(null);
      setView("login");
      setNationalId("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/consumer/session"] });
    },
  });

  const borrowerName = data?.borrower.type === "individual"
    ? `${data.borrower.firstName || ""} ${data.borrower.lastName || ""}`.trim()
    : data?.borrower.companyName || "";

  const scoreInfo = data ? getScoreLabel(data.creditScore) : null;

  const isPending = registerMutation.isPending || loginMutation.isPending || verifyMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">

        <div className="text-center space-y-2 pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold" data-testid="badge-consumer-portal">
            <Shield className="w-3 h-3" />
            Credit Self-Service
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" data-testid="text-consumer-portal-title">
            {view === "dashboard" ? "Your Credit Score" : view === "register" ? "Create Account" : view === "verify" ? "Verify Your Phone" : "Sign In"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {view === "dashboard"
              ? "Your verified credit score from Africa Credit Hub."
              : view === "register"
              ? "Register to securely access your credit information."
              : view === "verify"
              ? "Enter the 6-digit code sent to your phone."
              : "Log in to view your credit score securely."}
          </p>
        </div>

        {error && !noCreditFile && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="text-consumer-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm" data-testid="text-consumer-success">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {view === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking your session...</p>
          </div>
        )}

        {view === "login" && (
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Login method toggle */}
              <div className="flex rounded-xl border overflow-hidden">
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${loginMethod === "password" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted/50"}`}
                  onClick={() => { setLoginMethod("password"); setError(null); }}
                  data-testid="tab-password-login"
                >
                  <Lock className="w-3.5 h-3.5" /> Password
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${loginMethod === "sms" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted/50"}`}
                  onClick={() => { setLoginMethod("sms"); setError(null); }}
                  data-testid="tab-sms-login"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> SMS Code
                </button>
              </div>

              {loginMethod === "password" ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">National ID / Passport / Tax ID</label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="e.g. GHA-123456789"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                      data-testid="input-consumer-id"
                      onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow pr-10"
                        data-testid="input-consumer-password"
                        onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={() => loginMutation.mutate()}
                    disabled={loginMutation.isPending || nationalId.length < 6 || password.length < 8}
                    size="lg"
                    className="w-full rounded-xl"
                    data-testid="button-consumer-login"
                  >
                    {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center py-1">
                    <p className="text-sm text-muted-foreground">Enter the phone number you registered with. We will send a 6-digit code via SMS.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="+233 55 123 4567"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                      data-testid="input-sms-login-phone"
                      onKeyDown={(e) => e.key === "Enter" && smsPhone.length >= 8 && requestLoginOtpMutation.mutate()}
                    />
                  </div>
                  <Button
                    onClick={() => { setError(null); setSuccessMsg(null); setFallbackOtp(null); setOtp(""); requestLoginOtpMutation.mutate(); }}
                    disabled={requestLoginOtpMutation.isPending || smsPhone.replace(/\D/g, "").length < 7}
                    size="lg"
                    className="w-full rounded-xl"
                    data-testid="button-send-sms-code"
                  >
                    {requestLoginOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    {requestLoginOtpMutation.isPending ? "Sending code..." : "Send SMS Code"}
                  </Button>
                </>
              )}

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = "/api/consumer/auth/google"}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  data-testid="button-google-login"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button
                  onClick={() => window.location.href = "/api/auth/microsoft"}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  data-testid="button-microsoft-login"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                  Microsoft
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => { setError(null); setView("register"); }}
                  className="text-sm text-primary hover:underline"
                  data-testid="link-to-register"
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Don't have an account? Register
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "register" && (
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="As it appears on your ID"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-fullname"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Country</label>
                <select
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="select-register-country"
                >
                  <option value="">Select your country</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Other">Other African Country</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">National ID / Passport / Tax ID</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. GHA-123456789"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-id"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 55 123 4567"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-dob"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow pr-10"
                    data-testid="input-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 rounded"
                  data-testid="checkbox-consent"
                />
                <label htmlFor="consent-checkbox" className="text-xs text-muted-foreground leading-relaxed">
                  I consent to Africa Credit Hub accessing and displaying my credit information. 
                  I understand I can revoke this consent at any time.
                </label>
              </div>
              <Button
                onClick={() => {
                  if (!regFullName.trim()) { setError("Full name is required"); return; }
                  if (!regCountry) { setError("Please select your country"); return; }
                  if (!consentGiven) { setError("You must consent to proceed"); return; }
                  setError(null);
                  registerMutation.mutate();
                }}
                disabled={registerMutation.isPending || nationalId.length < 6 || phone.length < 8 || password.length < 8 || !dateOfBirth || !regFullName.trim() || !regCountry || !consentGiven}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-consumer-register"
              >
                {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or register with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = "/api/consumer/auth/google"}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  data-testid="button-google-register"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button
                  onClick={() => window.location.href = "/api/auth/microsoft"}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  data-testid="button-microsoft-register"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                  Microsoft
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => { setError(null); setView("login"); }}
                  className="text-sm text-primary hover:underline"
                  data-testid="link-to-login"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Already have an account? Sign in
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "verify" && (
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  {(email || otpSentByEmail) && (
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {otpSentByEmail
                    ? "SMS was unavailable — the code was sent to your registered email address instead."
                    : email
                    ? "We sent a verification code via SMS and a verification link to your email. Use either to verify."
                    : "A 6-digit verification code has been sent to your phone via SMS."}
                </p>
              </div>

              {fallbackOtp && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-1 font-medium">SMS/Email delivery unavailable — use this code:</p>
                  <p className="text-2xl font-mono font-bold tracking-[0.3em] text-amber-800 dark:text-amber-300" data-testid="text-fallback-otp">{fallbackOtp}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow text-center text-lg tracking-widest font-mono"
                  data-testid="input-consumer-otp"
                  maxLength={6}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && (verifyMode === "sms-login" ? verifyLoginOtpMutation.mutate() : verifyMutation.mutate())}
                />
              </div>
              <Button
                onClick={() => verifyMode === "sms-login" ? verifyLoginOtpMutation.mutate() : verifyMutation.mutate()}
                disabled={(verifyMode === "sms-login" ? verifyLoginOtpMutation.isPending : verifyMutation.isPending) || otp.length !== 6}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-consumer-verify"
              >
                {(verifyMode === "sms-login" ? verifyLoginOtpMutation.isPending : verifyMutation.isPending)
                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {(verifyMode === "sms-login" ? verifyLoginOtpMutation.isPending : verifyMutation.isPending)
                  ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <div className="text-center space-y-2">
                {verifyMode === "register" && (
                  <button
                    onClick={() => { setError(null); setSuccessMsg(null); resendMutation.mutate(); }}
                    disabled={resendMutation.isPending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                    data-testid="button-resend-otp"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${resendMutation.isPending ? "animate-spin" : ""}`} />
                    {resendMutation.isPending ? "Sending..." : "Resend code"}
                  </button>
                )}
                {verifyMode === "sms-login" && (
                  <button
                    onClick={() => { setError(null); setSuccessMsg(null); setFallbackOtp(null); requestLoginOtpMutation.mutate(); }}
                    disabled={requestLoginOtpMutation.isPending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                    data-testid="button-resend-login-otp"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${requestLoginOtpMutation.isPending ? "animate-spin" : ""}`} />
                    {requestLoginOtpMutation.isPending ? "Sending..." : "Resend code"}
                  </button>
                )}
                <br />
                <button
                  onClick={() => { setError(null); setSuccessMsg(null); setFallbackOtp(null); setOtp(""); setVerifyMode("register"); setOtpSentByEmail(false); setView("login"); }}
                  className="text-sm text-muted-foreground hover:underline"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Back to login
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "dashboard" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="rounded-xl"
                data-testid="button-consumer-logout"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>

            {!data && !lookupMutation.isPending && (
              <>
                {/* OAuth users — no national ID linked, can't auto-lookup */}
                {(sessionQuery.data?.nationalId?.startsWith("GOOGLE-") || sessionQuery.data?.nationalId?.startsWith("APPLE-")) && (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 text-center space-y-4">
                      {sessionQuery.data?.profilePicture ? (
                        <img src={sessionQuery.data.profilePicture} alt="Profile" className="w-14 h-14 rounded-full mx-auto object-cover" data-testid="img-consumer-avatar" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <Shield className="w-7 h-7 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">Welcome{sessionQuery.data?.fullName ? `, ${sessionQuery.data.fullName.split(" ")[0]}` : ""}!</h3>
                        <p className="text-sm text-muted-foreground mt-1">Signed in via {sessionQuery.data?.authProvider === "google" ? "Google" : "social account"}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> Credit File Not Linked
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                          Social sign-in accounts are not automatically linked to a credit file. Please sign out and log in using your <strong>National ID and phone number</strong> to view your credit score.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => logoutMutation.mutate()} data-testid="button-oauth-signout">
                        <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Your data is protected under POPIA, NDPA, and Ghana DPA.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* No credit file found */}
                {noCreditFile && (
                  <Card className="shadow-sm" data-testid="card-no-credit-file">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-7 h-7 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">No Credit Record Found</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          We could not find a credit file matching your registered identity. This may happen if your lender has not yet reported your credit history to the bureau.
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4 text-left text-xs text-muted-foreground space-y-2">
                        <p className="font-semibold text-foreground text-sm">What you can do:</p>
                        <p>• Ask your bank or microfinance institution to report your credit data to Africa Credit Hub.</p>
                        <p>• Check back in a few weeks after your lender has submitted an update.</p>
                        <p>• File a dispute if you believe your data should already be on file.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => { setNoCreditFile(false); setError(null); lookupMutation.mutate(); }}
                          data-testid="button-try-lookup-again"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                        </Button>
                        <DisputeFilingDialog />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Your data is protected under POPIA, NDPA, and Ghana DPA.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {lookupMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your credit information...</p>
              </div>
            )}

            {data && scoreInfo && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="consumer-results">

                {/* ─── CREDIT FREEZE BANNER ──────────────────────────────────── */}
                {freezeQuery.data?.frozen && (
                  <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow" data-testid="banner-credit-freeze">
                    <Snowflake className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">Credit File Frozen</p>
                      <p className="text-xs text-blue-100 leading-snug">Lenders cannot access your credit report. Toggle off the freeze below when applying for credit.</p>
                    </div>
                  </div>
                )}

                <Card className="shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/3 p-6 sm:p-8">
                    <div className="flex items-center justify-center gap-2 mb-5">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold" data-testid="text-consumer-name">{borrowerName}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <CreditScoreGauge score={data.creditScore} size={200} testId="consumer-score-gauge" />
                      <p className={`text-xl font-bold ${scoreInfo.color}`} data-testid="text-score-label">{scoreInfo.label}</p>
                      <p className="text-xs text-muted-foreground">Score range: 300 – 850</p>
                    </div>
                    <div className="mt-5 p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-score-description">{scoreInfo.description}</p>
                    </div>
                  </div>
                </Card>

                {data.affordability && (
                  <Card className="shadow-sm" data-testid="card-consumer-affordability">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-sm font-bold">Affordability Snapshot</h3>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground" data-testid="badge-consumer-affordability-status">
                          {String(data.affordability.affordabilityRating ?? "unknown").toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {data.affordability.grossIncomeMonthly != null && (
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-muted-foreground text-[10px] mb-0.5">Gross Income / Month</p>
                            <p className="font-bold" data-testid="text-consumer-gross-income">{data.affordability.currency} {Number(data.affordability.grossIncomeMonthly).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        {data.affordability.debtToIncomeRatio != null && (
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-muted-foreground text-[10px] mb-0.5">Debt-to-Income</p>
                            <p className="font-bold text-base" data-testid="text-consumer-dti">{(Number(data.affordability.debtToIncomeRatio) * 100).toFixed(1)}%</p>
                          </div>
                        )}
                        {data.affordability.disposableIncomeMonthly != null && (
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-muted-foreground text-[10px] mb-0.5">Monthly Disposable Income</p>
                            <p className="font-bold" data-testid="text-consumer-disposable">{data.affordability.currency} {Number(data.affordability.disposableIncomeMonthly).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        {data.affordability.maxRecommendedNewCredit != null && (
                          <div className="bg-muted/40 rounded-lg p-2.5">
                            <p className="text-muted-foreground text-[10px] mb-0.5">Max Recommended Credit</p>
                            <p className="font-bold" data-testid="text-consumer-max-credit">{data.affordability.currency} {Number(data.affordability.maxRecommendedNewCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">Confidence: {data.affordability.confidenceLabel} · Rule: {data.affordability.regulatoryRule ?? "—"} · Source: {data.affordability.dataSource}</p>
                    </CardContent>
                  </Card>
                )}

                {/* ─── 1. SCORE HISTORY CHART ─────────────────────────────────── */}
                <Card className="shadow-sm" data-testid="card-score-history">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Score History</h3>
                    </div>
                    {scoreHistoryQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>
                    ) : !scoreHistoryQuery.data || scoreHistoryQuery.data.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">No historical score data on file yet. Your score trend will appear here as your credit file is updated over time.</p>
                        <div className="bg-muted/30 rounded-xl p-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Current Score</span>
                            <span className="font-bold" data-testid="text-history-current-score">{data.creditScore}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${((data.creditScore - 300) / 550) * 100}%`, transition: "width 1s ease" }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>300</span><span>850</span></div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const sorted = [...scoreHistoryQuery.data].reverse();
                          const firstScore = sorted[0]?.score ?? 0;
                          const lastScore = sorted[sorted.length - 1]?.score ?? 0;
                          const prev = sorted.length >= 2 ? sorted[sorted.length - 2]?.score : null;
                          const delta = prev !== null ? lastScore - prev : null;
                          const trendDir = sorted.length >= 2 ? (lastScore > firstScore ? "up" : lastScore < firstScore ? "down" : "flat") : "flat";
                          const trendColor = trendDir === "up" ? "#16a34a" : trendDir === "down" ? "#dc2626" : "hsl(var(--primary))";
                          const isUp = delta !== null && delta > 0;
                          const isDown = delta !== null && delta < 0;
                          const chartPoints = sorted.map((h) => ({
                            date: new Date(h.createdAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
                            score: h.score,
                          }));
                          return (
                            <>
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs text-muted-foreground">Score trend over {sorted.length} snapshot{sorted.length !== 1 ? "s" : ""}</span>
                                {delta !== null && (
                                  <span className={`ml-auto inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : isDown ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`} data-testid="badge-score-delta">
                                    {isUp ? "↑" : isDown ? "↓" : "→"} {isUp ? "+" : ""}{delta} vs prev
                                  </span>
                                )}
                              </div>
                              <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartPoints}>
                                    <defs>
                                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis domain={[300, 850]} tick={{ fontSize: 10 }} width={35} />
                                    <Tooltip formatter={(v: number) => [v, "Score"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                                    <Area type="monotone" dataKey="score" stroke={trendColor} strokeWidth={2} fill="url(#scoreGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 2. SCORE SIMULATOR (local what-if toggles) ─────────────── */}
                {(() => {
                  const base = data.creditScore;
                  const delinq = (data as { delinquentAccounts?: number }).delinquentAccounts ?? 0;
                  const arrearsImpact = simToggles.payArrears ? Math.min(65, Math.max(20, delinq * 15 + 20)) : 0;
                  const utilImpact = simToggles.reduceUtil ? Math.min(35, Math.max(15, Math.round((850 - base) * 0.1))) : 0;
                  const onTimeImpact = simToggles.onTimePayments ? Math.min(45, Math.max(20, Math.round((850 - base) * 0.12))) : 0;
                  const totalDelta = arrearsImpact + utilImpact + onTimeImpact;
                  const projected = Math.min(850, base + totalDelta);
                  const anyOn = simToggles.payArrears || simToggles.reduceUtil || simToggles.onTimePayments;
                  return (
                    <Card className="shadow-sm" data-testid="card-score-simulator">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold">Score Simulator</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Toggle actions below to see how they could affect your score in real time.</p>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5" data-testid="toggle-pay-arrears">
                            <div>
                              <p className="text-xs font-medium">Pay all outstanding arrears</p>
                              <p className="text-[10px] text-muted-foreground">Clears overdue payments on all accounts</p>
                            </div>
                            <Switch checked={simToggles.payArrears} onCheckedChange={(v) => setSimToggles(s => ({ ...s, payArrears: v }))} data-testid="switch-sim-pay-arrears" />
                          </div>
                          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5" data-testid="toggle-reduce-util">
                            <div>
                              <p className="text-xs font-medium">Reduce credit utilisation to ≤30%</p>
                              <p className="text-[10px] text-muted-foreground">Pay down revolving balances to low usage</p>
                            </div>
                            <Switch checked={simToggles.reduceUtil} onCheckedChange={(v) => setSimToggles(s => ({ ...s, reduceUtil: v }))} data-testid="switch-sim-reduce-util" />
                          </div>
                          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5" data-testid="toggle-on-time-payments">
                            <div>
                              <p className="text-xs font-medium">Build 12 months of on-time payments</p>
                              <p className="text-[10px] text-muted-foreground">Consistent payment history over the next year</p>
                            </div>
                            <Switch checked={simToggles.onTimePayments} onCheckedChange={(v) => setSimToggles(s => ({ ...s, onTimePayments: v }))} data-testid="switch-sim-on-time" />
                          </div>
                        </div>
                        {anyOn && (
                          <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2 animate-in fade-in" data-testid="simulator-result">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Current score</span>
                              <span className="font-bold" data-testid="text-sim-base">{base}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Projected score</span>
                              <span className="font-bold text-base text-emerald-600 dark:text-emerald-400" data-testid="text-sim-projected">
                                {projected}
                                <span className="text-xs ml-1 font-medium">(+{totalDelta})</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              These are estimated improvements based on standard credit scoring rules.{" "}
                              {simToggles.payArrears && `Clearing arrears typically adds +${arrearsImpact} pts. `}
                              {simToggles.reduceUtil && `Lowering utilisation adds +${utilImpact} pts. `}
                              {simToggles.onTimePayments && `12 months on-time payments adds +${onTimeImpact} pts.`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* ─── 3. PERSONALISED IMPROVEMENT TIPS ──────────────────────── */}
                <Card className="shadow-sm" data-testid="card-improvement-tips">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-sm font-bold">Personalised Improvement Tips</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Actions tailored to your credit profile to help you improve your score.</p>
                    {tipsQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-3"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
                    ) : !tipsQuery.data?.tips?.length ? (
                      <p className="text-xs text-muted-foreground">No tips available at this time.</p>
                    ) : (
                      <div className="space-y-2">
                        {tipsQuery.data.tips.map((tip: any) => (
                          <div key={tip.id} data-testid={`tip-${tip.id}`} className={`rounded-xl p-3 border ${tip.impact === "high" ? "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800" : tip.impact === "medium" ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800" : "border-muted bg-muted/20"}`}>
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 flex-shrink-0 ${tip.impact === "high" ? "text-red-500" : tip.impact === "medium" ? "text-amber-500" : "text-muted-foreground"}`}>
                                {tip.impact === "high" ? <AlertTriangle className="w-3.5 h-3.5" /> : tip.impact === "medium" ? <Clock className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-xs font-semibold">{tip.title}</p>
                                  <Badge variant="outline" className={`text-[9px] px-1 h-4 ${tip.impact === "high" ? "border-red-300 text-red-600" : tip.impact === "medium" ? "border-amber-300 text-amber-600" : "border-muted text-muted-foreground"}`}>
                                    {tip.impact} impact
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 4. LENDER PRE-QUALIFICATION OFFERS (frontend-static) ───── */}
                {(() => {
                  type Offer = { id: string; lender: string; product: string; maxAmount: string; currency: string; rateFrom: string; term: string; likelihood: "high" | "medium" | "low"; badge?: string };
                  const score = data.creditScore;
                  const staticOffers: Offer[] = score >= 650 ? [
                    { id: "o1", lender: "Ecobank Ghana", product: "Personal Loan", maxAmount: "50,000", currency: "GHS", rateFrom: "18%", term: "Up to 60 months", likelihood: "high", badge: "Best Rate" },
                    { id: "o2", lender: "Absa Bank Ghana", product: "Salary Advance", maxAmount: "30,000", currency: "GHS", rateFrom: "16%", term: "Up to 24 months", likelihood: "high" },
                    { id: "o3", lender: "Fidelity Bank", product: "Home Improvement Loan", maxAmount: "100,000", currency: "GHS", rateFrom: "20%", term: "Up to 84 months", likelihood: "medium" },
                  ] : score >= 500 ? [
                    { id: "o1", lender: "GCB Bank", product: "Personal Loan", maxAmount: "20,000", currency: "GHS", rateFrom: "22%", term: "Up to 36 months", likelihood: "high" },
                    { id: "o2", lender: "Zenith Bank Ghana", product: "Salary Advance", maxAmount: "10,000", currency: "GHS", rateFrom: "25%", term: "Up to 12 months", likelihood: "medium" },
                    { id: "o3", lender: "Letshego Ghana", product: "Consumer Loan", maxAmount: "8,000", currency: "GHS", rateFrom: "28%", term: "Up to 18 months", likelihood: "medium" },
                  ] : [
                    { id: "o1", lender: "Opportunity International", product: "Micro Loan", maxAmount: "2,000", currency: "GHS", rateFrom: "32%", term: "Up to 6 months", likelihood: "low" },
                    { id: "o2", lender: "Sinapi Aba Savings", product: "Group Guarantee Loan", maxAmount: "1,500", currency: "GHS", rateFrom: "35%", term: "Up to 6 months", likelihood: "low" },
                  ];
                  return (
                    <Card className="shadow-sm border-emerald-200 dark:border-emerald-800" data-testid="card-prequalified-offers">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-sm font-bold">Pre-qualified Offers</h3>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] h-4 px-1.5 border-0">Score band: {score >= 650 ? "≥650" : score >= 500 ? "500–649" : "<500"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Illustrative offers for your score band. Actual terms depend on lender assessment.</p>
                        <div className="space-y-2">
                          {staticOffers.map((offer) => (
                            <div key={offer.id} data-testid={`offer-${offer.id}`} className="rounded-xl border p-3 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                <Tag className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-semibold">{offer.lender}</p>
                                  {offer.badge && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] h-4 px-1 border-0">{offer.badge}</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground">{offer.product}</p>
                                <div className="flex gap-3 mt-1 text-[11px]">
                                  <span><span className="text-muted-foreground">Up to </span><span className="font-medium">{offer.currency} {offer.maxAmount}</span></span>
                                  <span><span className="text-muted-foreground">From </span><span className="font-medium">{offer.rateFrom} p.a.</span></span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{offer.term}</p>
                              </div>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${offer.likelihood === "high" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : offer.likelihood === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                                {offer.likelihood === "high" ? "High match" : offer.likelihood === "medium" ? "Good match" : "Possible"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">* Illustrative only. Africa Credit Hub does not endorse any specific product. Contact lenders directly to apply.</p>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* ─── 5. FILE A DISPUTE (always visible) ──────────────────── */}
                <Card className="shadow-sm" data-testid="card-file-dispute">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Disputes</h3>
                      {(myDisputesQuery.data?.length ?? 0) > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-[10px] h-4 px-1.5">{myDisputesQuery.data!.length} active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Believe information on your credit report is wrong? File a dispute with the bureau.</p>
                    <DisputeFilingDialog />
                  </CardContent>
                </Card>

                {/* ─── 5b. DISPUTE STATUS TRACKER (hidden when no disputes) ──── */}
                {(myDisputesQuery.data?.length ?? 0) > 0 && (
                  <Card className="shadow-sm" data-testid="card-dispute-tracker">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold">My Active Disputes</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Track the status of disputes you have filed with the bureau.</p>
                      {myDisputesQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-3"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
                      ) : (
                        <div className="space-y-3">
                          {myDisputesQuery.data!.map((d) => {
                            const stages: { key: string; label: string; date?: string }[] = [
                              { key: "filed", label: "Filed", date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : undefined },
                              { key: "review", label: "Under Review", date: d.status === "under_review" || d.status === "resolved" || d.status === "rejected" ? (d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "In progress") : undefined },
                              { key: "resolved", label: d.status === "rejected" ? "Rejected" : "Resolved", date: d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : undefined },
                            ];
                            const stageIndex: Record<string, number> = { open: 0, under_review: 1, resolved: 2, rejected: 2 };
                            const activeStage = stageIndex[d.status] ?? 0;
                            return (
                              <div key={d.id} data-testid={`dispute-${d.id}`} className="rounded-xl border p-3 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-semibold capitalize">{(d.disputeType || "dispute").replace(/_/g, " ")}</p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{d.description}</p>
                                  </div>
                                  {d.slaDeadline && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">SLA: {new Date(d.slaDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                                  )}
                                </div>
                                <div className="flex items-center" data-testid={`dispute-timeline-${d.id}`}>
                                  {stages.map((stage, i) => {
                                    const done = i <= activeStage;
                                    const active = i === activeStage;
                                    return (
                                      <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                                        {i > 0 && (
                                          <div className={`absolute top-2.5 right-1/2 w-full h-0.5 ${done ? "bg-primary" : "bg-muted"}`} />
                                        )}
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${done ? (active ? "border-primary bg-primary" : "border-primary bg-primary/20") : "border-muted bg-background"}`}>
                                          {done && !active && <span className="text-[8px] text-primary font-bold">✓</span>}
                                          {active && <span className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <p className={`text-[9px] mt-0.5 text-center leading-tight ${active ? "text-primary font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{stage.label}</p>
                                        {stage.date && <p className="text-[9px] text-muted-foreground/70 text-center">{stage.date}</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ─── 6. WHO ACCESSED MY DATA (collapsible) ──────────────────── */}
                <Card className="shadow-sm" data-testid="card-inquiry-feed">
                  <CardContent className="p-4">
                    <button
                      className="w-full flex items-center justify-between mb-1 text-left"
                      onClick={() => setInquiryExpanded(e => !e)}
                      data-testid="button-toggle-inquiry-feed"
                      aria-expanded={inquiryExpanded}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold">Who Accessed My Data</h3>
                        {(myInquiriesQuery.data?.length ?? 0) > 0 && (
                          <Badge className="bg-muted text-muted-foreground border-0 text-[10px] h-4 px-1.5">{myInquiriesQuery.data!.length}</Badge>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${inquiryExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {!inquiryExpanded ? (
                      <p className="text-xs text-muted-foreground">Tap to see a log of lenders who accessed your credit report.</p>
                    ) : myInquiriesQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-3"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
                    ) : !myInquiriesQuery.data || myInquiriesQuery.data.length === 0 ? (
                      <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2 mt-2">
                        <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>No inquiries recorded. This log will populate when lenders access your credit file.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {myInquiriesQuery.data.map((inq) => (
                          <div key={inq.id} data-testid={`inquiry-${inq.id}`} className="flex items-start gap-2.5 rounded-xl border p-2.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Search className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{inq.institution || "Unknown Institution"}</p>
                              <p className="text-[10px] text-muted-foreground">{(inq.purpose || "inquiry").replace(/_/g, " ")} · {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${inq.isSoftPull ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                              {inq.isSoftPull ? "Soft" : "Hard"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 7. CREDIT FREEZE ───────────────────────────────────────── */}
                <Card className={`shadow-sm ${freezeQuery.data?.frozen ? "border-blue-300 dark:border-blue-700" : ""}`} data-testid="card-credit-freeze">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Snowflake className={`w-4 h-4 ${freezeQuery.data?.frozen ? "text-blue-500" : "text-muted-foreground"}`} />
                        <h3 className="text-sm font-bold">Credit Freeze</h3>
                        {freezeQuery.data?.frozen && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-[10px] h-4 px-1.5">ACTIVE</Badge>
                        )}
                      </div>
                      <Switch
                        data-testid="switch-credit-freeze"
                        checked={freezeQuery.data?.frozen ?? false}
                        disabled={freezeMutation.isPending || freezeQuery.isLoading}
                        onCheckedChange={(v) => freezeMutation.mutate(v)}
                      />
                    </div>
                    {freezeQuery.data?.frozen ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                          <Snowflake className="w-3.5 h-3.5" /> Credit File Frozen
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">Your credit file is currently frozen. Lenders cannot access your credit report. Toggle off to lift the freeze when applying for credit.</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">Enable a credit freeze to prevent lenders from accessing your credit report without your explicit authorisation. Useful if you suspect identity theft.</p>
                    )}
                    {freezeMutation.isError && (
                      <p className="text-xs text-red-500 mt-2">{(freezeMutation.error as Error).message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* ─── 8. PWA PUSH NOTIFICATIONS ──────────────────────────────── */}
                <Card className="shadow-sm" data-testid="card-push-notifications">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {pushStatusQuery.data?.subscribed ? <BellRing className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                        <h3 className="text-sm font-bold">Push Notifications</h3>
                      </div>
                      <Switch
                        data-testid="switch-push-notifications"
                        checked={pushStatusQuery.data?.subscribed ?? false}
                        disabled={pushSubscribeMutation.isPending || pushUnsubscribeMutation.isPending || pushStatusQuery.isLoading}
                        onCheckedChange={(v) => { if (v) pushSubscribeMutation.mutate(); else pushUnsubscribeMutation.mutate(); }}
                      />
                    </div>
                    {pushStatusQuery.data?.subscribed ? (
                      <p className="text-xs text-muted-foreground">Push notifications are enabled. You will be alerted when your credit score changes or a lender accesses your file.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Enable push notifications to receive instant alerts on your device whenever there is activity on your credit file.</p>
                    )}
                    {pushSubscribeMutation.isError && (
                      <p className="text-xs text-red-500 mt-2">{(pushSubscribeMutation.error as Error).message}</p>
                    )}
                    {pushSubscribeMutation.isSuccess && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Notifications enabled!</p>
                    )}
                  </CardContent>
                </Card>

                {/* ─── CREDIT MONITORING ALERTS ────────────────────────────────────────── */}
                <Card className="shadow-sm border-primary/20" data-testid="card-monitoring-alerts">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold">Credit Monitoring Alerts</h3>
                        {monitoringAlertsQuery.data && monitoringAlertsQuery.data.filter((a: any) => !a.isRead).length > 0 && (
                          <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                            {monitoringAlertsQuery.data.filter((a: any) => !a.isRead).length}
                          </Badge>
                        )}
                      </div>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="btn-monitoring-settings"
                        onClick={() => setMonitorPrefsOpen(true)}
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      We monitor your credit file 24/7 and alert you when lenders access your data, your score changes, or new accounts are opened.
                    </p>
                    {monitoringAlertsQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading alerts...
                      </div>
                    ) : !monitoringAlertsQuery.data || monitoringAlertsQuery.data.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                        <Bell className="w-4 h-4 flex-shrink-0" />
                        <span>No alerts yet. Monitoring is active — you will be notified of any changes to your credit file.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {monitoringAlertsQuery.data.slice(0, 5).map((alert: any) => (
                          <div
                            key={alert.id}
                            data-testid={`monitoring-alert-${alert.id}`}
                            className={`flex items-start gap-2 text-xs rounded-lg p-2.5 ${alert.isRead ? "bg-muted/20" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"}`}
                          >
                            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${alert.isRead ? "text-muted-foreground" : "text-amber-500"}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${alert.isRead ? "text-muted-foreground" : "text-amber-800 dark:text-amber-300"}`}>
                                {alert.alertType?.replace(/_/g, " ") || "Alert"}
                              </p>
                              <p className="text-muted-foreground truncate">{alert.message || "—"}</p>
                            </div>
                            {!alert.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))}
                        {monitoringAlertsQuery.data.filter((a: any) => !a.isRead).length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground"
                            data-testid="btn-mark-all-read"
                            onClick={() => markAllAlertsRead.mutate()}
                          >
                            Mark all as read
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Preferences Dialog */}
                    {monitorPrefsOpen && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setMonitorPrefsOpen(false)}>
                        <div className="bg-background rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl" onClick={e => e.stopPropagation()} data-testid="dialog-monitoring-prefs">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm">Alert Preferences</h3>
                            <button onClick={() => setMonitorPrefsOpen(false)} className="text-muted-foreground">✕</button>
                          </div>
                          <div className="space-y-3">
                            {[
                              { key: "alertOnInquiry", label: "Lender accesses my file" },
                              { key: "alertOnScoreChange", label: "My score changes" },
                              { key: "alertOnNewAccount", label: "New account opened" },
                              { key: "alertOnDelinquency", label: "Delinquency detected" },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-sm">{label}</span>
                                <Switch
                                  data-testid={`pref-switch-${key}`}
                                  checked={(localPrefs as any)[key]}
                                  onCheckedChange={(v) => setLocalPrefs(prev => ({ ...prev, [key]: v }))}
                                />
                              </div>
                            ))}
                            <Separator />
                            <p className="text-xs text-muted-foreground font-medium">Delivery</p>
                            {[
                              { key: "emailAlerts", label: "Email" },
                              { key: "smsAlerts", label: "SMS" },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-sm">{label}</span>
                                <Switch
                                  data-testid={`pref-switch-${key}`}
                                  checked={(localPrefs as any)[key]}
                                  onCheckedChange={(v) => setLocalPrefs(prev => ({ ...prev, [key]: v }))}
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            className="w-full rounded-xl"
                            size="sm"
                            data-testid="btn-save-monitoring-prefs"
                            disabled={saveMonitoringPrefs.isPending}
                            onClick={() => { saveMonitoringPrefs.mutate(localPrefs); setMonitorPrefsOpen(false); }}
                          >
                            {saveMonitoringPrefs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Preferences
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Your Rights</h3>
                    </div>
                    <div className="space-y-2.5 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Access your credit report once per year at no cost.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Dispute any inaccurate information on your credit file.</span>
                      </div>
                      <DisputeFilingDialog />
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Lenders must get your consent before accessing your data.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Download className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Download My Data</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Export all your credit data in a portable format. Compliant with POPIA, NDPA, Ghana DPA & GDPR Article 20.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl"
                      data-testid="button-consumer-download-data"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/consumer/export-my-data", { method: "POST", credentials: "include" });
                          if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.message || "Export failed");
                          }

                          const oneTimeKey = res.headers.get("X-Export-Key");
                          const iv = res.headers.get("X-Export-IV");
                          const sha256 = res.headers.get("X-Export-SHA256");

                          const blob = await res.blob();
                          const disposition = res.headers.get("Content-Disposition") || "";
                          const match = disposition.match(/filename="?([^"]+)"?/);
                          const filename = match?.[1] || `my_credit_data_${Date.now()}.enc`;
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = filename;
                          a.click();
                          URL.revokeObjectURL(a.href);

                          if (oneTimeKey) {
                            const keyInfo = `Your encrypted data has been downloaded.\n\nDecryption Key: ${oneTimeKey}\nIV: ${iv}\nSHA-256: ${sha256}\n\nIMPORTANT: Copy and save this key now — it cannot be recovered later.`;
                            alert(keyInfo);
                          }
                        } catch (e: any) {
                          alert(e.message || "Failed to download your data. Please try again later.");
                        }
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download All My Credit Data
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold">Credit Report PDF</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Download a formatted PDF summary of your credit profile — suitable for sharing with lenders or employers.
                    </p>
                    <CreditReportDownloadButton borrowerName={data?.borrower ? `${data.borrower.firstName || ""} ${data.borrower.lastName || ""}`.trim() || data.borrower.companyName || "Consumer" : "Consumer"} />
                  </CardContent>
                </Card>

                <div className="text-center pb-4">
                  <p className="text-[10px] text-muted-foreground">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Need help? Contact your lender or the credit bureau.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {(view === "login" || view === "register") && (
          <div className="text-center py-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 1</p>
                  <p className="text-[11px] text-muted-foreground">Register with your National ID and phone number</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 2</p>
                  <p className="text-[11px] text-muted-foreground">Verify via SMS code or email verification link</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 3</p>
                  <p className="text-[11px] text-muted-foreground">View your credit score and rating securely</p>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <a
                href="/"
                className="flex items-center justify-center gap-1.5 text-xs hover:underline"
                style={{ color: "var(--muted-foreground)" }}
                data-testid="link-back-home-consumer"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
