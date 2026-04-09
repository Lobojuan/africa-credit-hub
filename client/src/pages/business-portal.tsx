import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Shield, AlertTriangle, CheckCircle2, TrendingUp, Loader2, Lock, LogOut, UserPlus, ArrowLeft, Eye, EyeOff, Search, Phone, Mail, FileText, Scale, ArrowRight, Download, MessageSquare, ClipboardCheck, CreditCard, BarChart3, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal-layout";
import { CreditScoreGauge } from "@/components/credit-score-gauge";

interface CreditFacility {
  accountType: string;
  lenderName: string;
  currentBalance: number;
  creditLimit: number;
  status: string;
  currency: string;
}

interface BusinessData {
  borrower: {
    companyName: string;
    type: string;
    nationalId: string;
  };
  creditScore: number;
  riskLevel?: string;
  delinquencyScore?: number;
  failureProbability?: number;
  totalFacilities?: number;
  totalOutstanding?: number;
  totalCreditLimit?: number;
  facilities?: CreditFacility[];
  tradePaymentSummary?: {
    onTime: number;
    late30: number;
    late60: number;
    late90Plus: number;
  };
}

function getScoreLabel(score: number): { label: string; color: string; description: string } {
  if (score >= 750) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400", description: "Your business credit standing is excellent. You are likely to qualify for the best commercial rates and terms." };
  if (score >= 670) return { label: "Good", color: "text-green-600 dark:text-green-400", description: "Your business credit standing is good. Most lenders will view your company favourably." };
  if (score >= 580) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", description: "Your business credit standing is fair. You may qualify for commercial credit but not always at the best rates." };
  if (score >= 450) return { label: "Poor", color: "text-orange-600 dark:text-orange-400", description: "Your business credit standing needs improvement. Consider clearing outstanding obligations." };
  return { label: "Very Poor", color: "text-red-600 dark:text-red-400", description: "Your business credit standing is very low. Focus on settling outstanding debts." };
}

type View = "login" | "register" | "verify" | "dashboard";
type DashboardTab = "overview" | "disputes" | "consent";

function BusinessDisputeTracker() {
  const { data: disputeList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/business/disputes"],
  });

  const statusColor = (s: string) =>
    s === "resolved" ? "bg-emerald-500/10 text-emerald-700" :
    s === "under_review" ? "bg-blue-500/10 text-blue-700" :
    s === "rejected" ? "bg-red-500/10 text-red-700" :
    "bg-amber-500/10 text-amber-700";

  const typeLabel = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold" data-testid="text-biz-dispute-tracker-title">Track Your Disputes</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !disputeList || disputeList.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center" data-testid="text-biz-no-disputes">
            No disputes filed yet. Use the form above to file a dispute.
          </p>
        ) : (
          <div className="space-y-2">
            {disputeList.map((d: any) => (
              <div key={d.id} className="p-3 rounded-xl border bg-background space-y-1" data-testid={`biz-dispute-item-${d.id}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{typeLabel(d.disputeType)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                    {d.status === "under_review" ? "Under Review" : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{d.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Filed: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "N/A"}</span>
                  {d.resolvedAt && <span>Resolved: {new Date(d.resolvedAt).toLocaleDateString()}</span>}
                </div>
                {d.resolution && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 mt-1">
                    Resolution: {d.resolution}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BusinessPortalPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View | "loading">("loading");
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("overview");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [consentAction, setConsentAction] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);
  const [data, setData] = useState<BusinessData | null>(null);
  const [noCreditFile, setNoCreditFile] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["/api/business/session"],
    queryFn: async () => {
      const res = await fetch("/api/business/session");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    if (sessionQuery.data?.authenticated) {
      setView("dashboard");
    } else if (view === "loading") {
      setView("login");
    }
  }, [sessionQuery.data, sessionQuery.isLoading]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tin, companyName, contactName, phone, email, password }),
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
      const res = await fetch("/api/business/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tin, password }),
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
      queryClient.invalidateQueries({ queryKey: ["/api/business/session"] });
      setView("dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tin, otp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/business/session"] });
      setView("dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/lookup", {
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
      await fetch("/api/business/logout", { method: "POST" });
    },
    onSuccess: () => {
      setData(null);
      setView("login");
      setTin("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/business/session"] });
    },
  });

  const scoreInfo = data ? getScoreLabel(data.creditScore) : null;
  const isPending = registerMutation.isPending || loginMutation.isPending || verifyMutation.isPending;

  return (
    <PortalLayout
      type="business"
      isAuthenticated={view === "dashboard"}
      userName={sessionQuery.data?.companyName}
      onLogout={() => logoutMutation.mutate()}
    >
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">
        <div className="text-center space-y-2 pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold" data-testid="badge-business-portal">
            <Building2 className="w-3 h-3" />
            Business Credit Self-Service
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" data-testid="text-business-portal-title">
            {view === "dashboard" ? "Business Credit Profile" : view === "register" ? "Register Business" : view === "verify" ? "Verify Your Business" : "Business Sign In"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {view === "dashboard"
              ? "Your verified business credit profile from the Ghana Credit Registry."
              : view === "register"
              ? "Register your business to access commercial credit information."
              : view === "verify"
              ? "Enter the 6-digit code sent to your phone."
              : "Sign in with your Tax Identification Number (TIN) to view your business credit profile."}
          </p>
        </div>

        {error && !noCreditFile && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="text-business-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm" data-testid="text-business-success">
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
              <div>
                <label className="text-sm font-medium mb-1.5 block">TIN or Business Registration Number</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="e.g. C0012345678 or BN-1234567"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-business-tin"
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
                    data-testid="input-business-password"
                    onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    data-testid="button-toggle-business-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending || tin.length < 6 || password.length < 8}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-business-login"
              >
                {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { setError(null); setView("register"); }}
                  className="text-sm text-primary hover:underline"
                  data-testid="link-to-business-register"
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Don't have an account? Register your business
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "register" && (
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">TIN or Business Registration Number</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="e.g. C0012345678 or BN-1234567"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-tin"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your registered business name"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-company"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Contact Person</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name of authorised contact"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-contact"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 30 123 4567"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-business-phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@company.com"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  data-testid="input-register-business-email"
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
                    data-testid="input-register-business-password"
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
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending || tin.length < 6 || companyName.length < 2 || phone.length < 8 || password.length < 8}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-business-register"
              >
                {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {registerMutation.isPending ? "Creating account..." : "Register Business"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { setError(null); setView("login"); }}
                  className="text-sm text-primary hover:underline"
                  data-testid="link-to-business-login"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Already registered? Sign in
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "verify" && (
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  A 6-digit verification code has been sent to your registered phone number.
                </p>
              </div>

              {fallbackOtp && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-1 font-medium">SMS delivery unavailable — use this code:</p>
                  <p className="text-2xl font-mono font-bold tracking-[0.3em] text-amber-800 dark:text-amber-300" data-testid="text-business-fallback-otp">{fallbackOtp}</p>
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
                  data-testid="input-business-otp"
                  maxLength={6}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verifyMutation.mutate()}
                />
              </div>
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending || otp.length !== 6}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-business-verify"
              >
                {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {verifyMutation.isPending ? "Verifying..." : "Verify & Continue"}
              </Button>
              <div className="text-center">
                <button
                  onClick={() => { setError(null); setSuccessMsg(null); setFallbackOtp(null); setView("login"); }}
                  className="text-sm text-muted-foreground hover:underline"
                  data-testid="link-business-back-to-login"
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
            {!data && !lookupMutation.isPending && (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" data-testid="text-business-welcome">
                      Welcome{sessionQuery.data?.companyName ? `, ${sessionQuery.data.companyName}` : ""}!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Signed in with TIN <strong>{sessionQuery.data?.tin?.replace(/(.{3}).+(.{3})/, "$1****$2")}</strong>
                    </p>
                  </div>

                  {noCreditFile ? (
                    <div className="space-y-3 pt-2">
                      <div className="bg-amber-500/10 border-amber-500/20 border rounded-xl p-4 text-left space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          No Business Credit File Found
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          We couldn't find a credit record matching your business TIN. This could mean your credit history hasn't been reported yet.
                        </p>
                      </div>
                      <button
                        onClick={() => { setNoCreditFile(false); setError(null); }}
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left w-full"
                        data-testid="button-business-try-again"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Try Again</p>
                          <p className="text-[11px] text-muted-foreground">Check your business credit profile again</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => lookupMutation.mutate()}
                        size="lg"
                        className="w-full rounded-xl"
                        data-testid="button-business-view-score"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Business Credit Profile
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Your data is protected under Ghana Data Protection Act, 2012.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {lookupMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your business credit information...</p>
              </div>
            )}

            {data && scoreInfo && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="business-results">
                <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border">
                  {([
                    { key: "overview" as DashboardTab, label: "Credit Profile", icon: BarChart3 },
                    { key: "disputes" as DashboardTab, label: "Disputes", icon: MessageSquare },
                    { key: "consent" as DashboardTab, label: "Consent", icon: ClipboardCheck },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDashboardTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        dashboardTab === tab.key
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`tab-business-${tab.key}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {dashboardTab === "overview" && (
                  <div className="space-y-4">
                    <Card className="shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/3 p-6 sm:p-8">
                        <div className="flex items-center justify-center gap-2 mb-5">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold" data-testid="text-business-name">{data.borrower.companyName}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <CreditScoreGauge score={data.creditScore} size={200} testId="business-score-gauge" />
                          <p className={`text-xl font-bold ${scoreInfo.color}`} data-testid="text-business-score-label">{scoreInfo.label}</p>
                          <p className="text-xs text-muted-foreground">Score range: 300 – 850</p>
                        </div>
                        <div className="mt-5 p-3 rounded-xl bg-muted/40 text-center">
                          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-business-score-description">{scoreInfo.description}</p>
                        </div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-3 gap-3">
                      <Card className="shadow-sm">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Risk Level</p>
                          <p className="text-sm font-bold mt-1" data-testid="text-risk-level">
                            {data.riskLevel || (data.creditScore >= 670 ? "Low" : data.creditScore >= 450 ? "Medium" : "High")}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Delinquency</p>
                          <p className="text-sm font-bold mt-1" data-testid="text-delinquency">
                            {data.delinquencyScore != null ? `${data.delinquencyScore}%` : "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Failure Prob.</p>
                          <p className="text-sm font-bold mt-1" data-testid="text-failure-prob">
                            {data.failureProbability != null ? `${data.failureProbability}%` : "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {data.tradePaymentSummary && (
                      <Card className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Trade Payment Summary</h3>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <p className="text-lg font-bold text-emerald-600" data-testid="text-ontime">{data.tradePaymentSummary.onTime}</p>
                              <p className="text-[10px] text-muted-foreground">On Time</p>
                            </div>
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                              <p className="text-lg font-bold text-yellow-600" data-testid="text-late30">{data.tradePaymentSummary.late30}</p>
                              <p className="text-[10px] text-muted-foreground">30 Days</p>
                            </div>
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <p className="text-lg font-bold text-orange-600" data-testid="text-late60">{data.tradePaymentSummary.late60}</p>
                              <p className="text-[10px] text-muted-foreground">60 Days</p>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10">
                              <p className="text-lg font-bold text-red-600" data-testid="text-late90">{data.tradePaymentSummary.late90Plus}</p>
                              <p className="text-[10px] text-muted-foreground">90+ Days</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {data.facilities && data.facilities.length > 0 && (
                      <Card className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">Credit Facilities ({data.facilities.length})</h3>
                          </div>
                          <div className="space-y-2">
                            {data.facilities.map((f, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border text-xs" data-testid={`facility-row-${i}`}>
                                <div>
                                  <p className="font-semibold">{f.accountType}</p>
                                  <p className="text-muted-foreground">{f.lenderName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{f.currency} {f.currentBalance.toLocaleString()}</p>
                                  <p className={`${f.status === "active" ? "text-emerald-600" : f.status === "closed" ? "text-muted-foreground" : "text-red-600"}`}>{f.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2"
                      onClick={() => {
                        window.open("/api/business/report/pdf", "_blank");
                      }}
                      data-testid="button-download-report"
                    >
                      <Download className="w-4 h-4" />
                      Download Credit Report (PDF)
                    </Button>

                    <Card className="shadow-sm bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Scale className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold">Business Rights</h3>
                        </div>
                        <div className="space-y-2.5 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Access your business credit report at any time.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Dispute any inaccurate information on your business credit file.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Lenders must obtain business consent before accessing your commercial data.</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {dashboardTab === "disputes" && (
                  <div className="space-y-4">
                    <Card className="shadow-sm">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold">File a Dispute</h3>
                        </div>
                        {disputeSubmitted ? (
                          <div className="text-center space-y-3 py-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Dispute Submitted</p>
                              <p className="text-xs text-muted-foreground mt-1">Your dispute has been filed and will be reviewed within 30 days as per regulatory requirements.</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setDisputeSubmitted(false); setDisputeReason(""); setDisputeDetails(""); }}
                              className="rounded-xl"
                              data-testid="button-file-another-dispute"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              File Another Dispute
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              If you believe any information on your business credit report is inaccurate, you have the right to dispute it.
                            </p>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Reason for Dispute</label>
                              <select
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                data-testid="select-dispute-reason"
                              >
                                <option value="">Select a reason...</option>
                                <option value="incorrect_balance">Incorrect Balance</option>
                                <option value="wrong_account">Account Not Belonging to Business</option>
                                <option value="duplicate_entry">Duplicate Entry</option>
                                <option value="incorrect_status">Incorrect Account Status</option>
                                <option value="identity_error">Company Identity Error</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Details</label>
                              <textarea
                                value={disputeDetails}
                                onChange={(e) => setDisputeDetails(e.target.value)}
                                placeholder="Describe the inaccuracy in detail..."
                                rows={4}
                                className="w-full px-3 py-2 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                data-testid="textarea-dispute-details"
                              />
                            </div>
                            <Button
                              onClick={async () => {
                                try {
                                  const resp = await fetch("/api/business/dispute", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ reason: disputeReason, details: disputeDetails }),
                                  });
                                  if (resp.ok) {
                                    setDisputeSubmitted(true);
                                    queryClient.invalidateQueries({ queryKey: ["/api/business/disputes"] });
                                  } else {
                                    const err = await resp.json();
                                    setError(err.message || "Failed to submit dispute");
                                  }
                                } catch {
                                  setError("Failed to submit dispute. Please try again.");
                                }
                              }}
                              disabled={!disputeReason || disputeDetails.length < 10}
                              size="lg"
                              className="w-full rounded-xl"
                              data-testid="button-submit-dispute"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Submit Dispute
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <BusinessDisputeTracker />

                    <Card className="shadow-sm bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold">Dispute Rights</h3>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                          <p>Under the Credit Reporting Act, you have the right to dispute any inaccurate data on your credit report. The credit bureau must investigate and respond within 30 days.</p>
                          <p>If the dispute is valid, the record will be corrected or removed from your credit file.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {dashboardTab === "consent" && (
                  <div className="space-y-4">
                    <Card className="shadow-sm">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <ClipboardCheck className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-bold">Data Consent Management</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          Manage who can access your business credit data. Lenders must have your explicit consent before pulling your business credit report.
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl border" data-testid="consent-credit-sharing">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold">Credit Report Sharing</p>
                                <p className="text-[10px] text-muted-foreground">Allow authorised lenders to access your credit report</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const newAction = consentAction === "revoke-sharing" ? null : "revoke-sharing";
                                try {
                                  await fetch("/api/business/consent", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ consentType: "credit_sharing", action: newAction ? "revoke" : "grant" }),
                                  });
                                  setConsentAction(newAction);
                                } catch {}
                              }}
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                consentAction === "revoke-sharing"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                              data-testid="button-toggle-sharing"
                            >
                              {consentAction === "revoke-sharing" ? "Revoked" : "Active"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl border" data-testid="consent-marketing">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold">Marketing Communications</p>
                                <p className="text-[10px] text-muted-foreground">Receive credit offers and financial product information</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const newAction = consentAction === "revoke-marketing" ? null : "revoke-marketing";
                                try {
                                  await fetch("/api/business/consent", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ consentType: "marketing", action: newAction ? "revoke" : "grant" }),
                                  });
                                  setConsentAction(newAction);
                                } catch {}
                              }}
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                consentAction === "revoke-marketing"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              data-testid="button-toggle-marketing"
                            >
                              {consentAction === "revoke-marketing" ? "Revoked" : "Opt Out"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl border" data-testid="consent-cross-border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold">Cross-Border Data Sharing</p>
                                <p className="text-[10px] text-muted-foreground">Allow data sharing with international credit bureaus</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const newAction = consentAction === "revoke-crossborder" ? null : "revoke-crossborder";
                                try {
                                  await fetch("/api/business/consent", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ consentType: "cross_border", action: newAction ? "revoke" : "grant" }),
                                  });
                                  setConsentAction(newAction);
                                } catch {}
                              }}
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                consentAction === "revoke-crossborder"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              data-testid="button-toggle-crossborder"
                            >
                              {consentAction === "revoke-crossborder" ? "Revoked" : "Opt Out"}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold">Data Protection</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Your data is protected under the Ghana Data Protection Act, 2012 (Act 843). You have the right to withdraw consent at any time. Changes may take up to 48 hours to take effect across all systems.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(view === "login" || view === "register") && (
          <div className="text-center py-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 1</p>
                  <p className="text-[11px] text-muted-foreground">Register with your TIN and company details</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 2</p>
                  <p className="text-[11px] text-muted-foreground">Verify via SMS code</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left p-3 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 3</p>
                  <p className="text-[11px] text-muted-foreground">View your business credit profile and score</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm pt-2">
              <a href="/my-credit" className="text-primary hover:underline flex items-center gap-1" data-testid="link-to-consumer-portal">
                Looking for personal credit?
              </a>
              <span className="text-muted-foreground">·</span>
              <a href="/login" className="text-primary hover:underline" data-testid="link-to-staff-login">
                Staff login
              </a>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
