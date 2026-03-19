import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, AlertTriangle, CheckCircle2, TrendingUp, User, Loader2, Scale, Phone, CalendarDays, Lock, LogOut, UserPlus, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  const [view, setView] = useState<View>("login");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsumerData | null>(null);

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
    if (sessionQuery.data?.authenticated) {
      setView("dashboard");
    }
  }, [sessionQuery.data]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/consumer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, phone, email, password, dateOfBirth }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      return body;
    },
    onSuccess: () => {
      setError(null);
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
        setView("verify");
        throw new Error(body.message);
      }
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

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="text-consumer-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending || nationalId.length < 6 || phone.length < 8 || password.length < 8 || !dateOfBirth}
                size="lg"
                className="w-full rounded-xl"
                data-testid="button-consumer-register"
              >
                {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  A 6-digit verification code has been sent to your registered phone number.
                </p>
              </div>
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
              <p className="text-[10px] text-muted-foreground text-center">
                Check the server console for the OTP code (SMS integration coming soon).
              </p>
              <div className="text-center">
                <button
                  onClick={() => { setError(null); setView("login"); }}
                  className="text-sm text-primary hover:underline"
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
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Welcome back</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You are signed in as <strong>{sessionQuery.data?.nationalId?.replace(/(.{3}).+(.{3})/, "$1****$2")}</strong>
                    </p>
                  </div>
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
                </CardContent>
              </Card>
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
                  <p className="text-[11px] text-muted-foreground">Verify your identity with an OTP code</p>
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
