import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, AlertTriangle, CheckCircle2, TrendingUp, User, Loader2, Scale, Phone, CalendarDays, Lock, LogOut, UserPlus, KeyRound, ArrowLeft, ArrowRight, Eye, EyeOff, Mail, MessageSquare, RefreshCw, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditScoreGauge } from "@/components/credit-score-gauge";

interface ConsumerData {
  borrower: {
    firstName: string;
    lastName: string;
    companyName: string;
    type: string;
    nationalId: string;
  };
  creditScore: number;
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

  const sessionQuery = useQuery({
    queryKey: ["/api/consumer/session"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/session");
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

              <div className="relative my-2">
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
                  {email && (
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {email
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
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verifyMutation.mutate()}
                />
              </div>
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending || otp.length !== 6}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-consumer-verify"
              >
                {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {verifyMutation.isPending ? "Verifying..." : "Verify & Continue"}
              </Button>
              <div className="text-center space-y-2">
                <button
                  onClick={() => { setError(null); setSuccessMsg(null); resendMutation.mutate(); }}
                  disabled={resendMutation.isPending}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                  data-testid="button-resend-otp"
                >
                  <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${resendMutation.isPending ? "animate-spin" : ""}`} />
                  {resendMutation.isPending ? "Sending..." : "Resend verification code"}
                </button>
                <br />
                <button
                  onClick={() => { setError(null); setSuccessMsg(null); setFallbackOtp(null); setView("login"); }}
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {sessionQuery.data?.authProvider === "google" && sessionQuery.data?.email ? (
                          <>Signed in as <strong>{sessionQuery.data.email}</strong></>
                        ) : (
                          <>You are signed in as <strong>{sessionQuery.data?.nationalId?.replace(/(.{3}).+(.{3})/, "$1****$2")}</strong></>
                        )}
                      </p>
                    </div>

                    {noCreditFile || sessionQuery.data?.nationalId?.startsWith("GOOGLE-") || sessionQuery.data?.nationalId?.startsWith("APPLE-") ? (
                      <div className="space-y-3 pt-2">
                        <div className={`${noCreditFile ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/5 border-primary/15"} border rounded-xl p-4 text-left space-y-2`}>
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            {noCreditFile ? (
                              <>
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                No Credit File Found
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                Account Created Successfully
                              </>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {noCreditFile
                              ? "We couldn't find a credit record matching your identity. This could mean your credit history hasn't been reported yet. Here's what you can do:"
                              : "Your account is set up. Here's what you can do next:"}
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <a
                            href="/solutions"
                            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            data-testid="link-explore-platform"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Explore the Platform</p>
                              <p className="text-[11px] text-muted-foreground">Learn how Africa Credit Hub serves lenders across 54 countries</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                          </a>

                          <a
                            href="/start-trial"
                            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            data-testid="link-start-trial-from-portal"
                          >
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <UserPlus className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Start a Free Trial</p>
                              <p className="text-[11px] text-muted-foreground">Register your organization for a 14-day free trial</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                          </a>

                          <a
                            href="/ai-demo"
                            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            data-testid="link-ai-demo-from-portal"
                          >
                            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                              <Search className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Try the AI Demo</p>
                              <p className="text-[11px] text-muted-foreground">See our AI-powered credit analysis in action</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                          </a>

                          {noCreditFile && (
                            <button
                              onClick={() => { setNoCreditFile(false); setError(null); }}
                              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                              data-testid="button-try-lookup-again"
                            >
                              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <RefreshCw className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Try Again</p>
                                <p className="text-[11px] text-muted-foreground">Check your credit score again</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-muted-foreground pt-1">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Your data is protected under POPIA, NDPA, and Ghana DPA.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => lookupMutation.mutate()}
                          size="lg"
                          className="w-full rounded-xl"
                          data-testid="button-consumer-view-score"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View My Credit Score
                        </Button>
                        <p className="text-[10px] text-muted-foreground">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Your data is protected under POPIA, NDPA, and Ghana DPA.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
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
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Lenders must get your consent before accessing your data.</span>
                      </div>
                    </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
