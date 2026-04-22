import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, ArrowRight, Globe, ArrowLeft, User, Lock, KeyRound, Building2, UserCircle, CreditCard, Eye, EyeOff, FileText, BarChart3, ScrollText, Search, MessageSquare, Star, Fingerprint } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isGhanaMode } from "@/lib/country-mode";
import { PLATFORM_COMPANY_NAME, PLATFORM_COPYRIGHT_YEAR } from "@/lib/platform-config";

type LoginMode = "chooser" | "institution" | "consumer";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("chooser");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mounted, setMounted] = useState(() => {
    if (sessionStorage.getItem("login_seen")) return true;
    return false;
  });

  const [consumerNationalId, setConsumerNationalId] = useState("");
  const [consumerPassword, setConsumerPassword] = useState("");
  const [showConsumerPassword, setShowConsumerPassword] = useState(false);
  const [consumerLoading, setConsumerLoading] = useState(false);
  const [consumerError, setConsumerError] = useState("");

  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handlePasskeyLogin = async () => {
    if (!username.trim()) {
      setError("Enter your username first, then click Sign in with Passkey.");
      return;
    }
    setPasskeyLoading(true);
    setError("");
    try {
      const optRes = await fetch("/api/auth/webauthn/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
        credentials: "include",
      });
      if (!optRes.ok) {
        const err = await optRes.json();
        setError(err.message || "No passkey found for this account. Register one after logging in.");
        return;
      }
      const options = await optRes.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const credential = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/auth/webauthn/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
        credentials: "include",
      });
      if (!verRes.ok) {
        const err = await verRes.json();
        setError(err.message || "Passkey verification failed.");
        return;
      }
      const data = await verRes.json();
      queryClient.setQueryData(["/api/auth/me"], data.user);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Passkey prompt was dismissed. Try again or use your password.");
      } else {
        setError(e.message || "Passkey login failed.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) return;
    const timer = setTimeout(() => {
      setMounted(true);
      sessionStorage.setItem("login_seen", "1");
    }, 50);
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username, password);
      if ((result as any)?.requireMfa) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      toast({ title: t('login.success') });
      if (window.location.pathname === "/login") {
        const r = result as any;
        let dest = "/dashboard";
        if (r?.role === "super_admin") dest = "/command-center";
        else if (r?.division === "corporate") dest = "/businesses";
        else if (r?.division === "telco") dest = "/telco-scoring";
        else if (r?.division === "retail") dest = "/consumers";
        window.location.replace(dest);
      }
    } catch (err: any) {
      const msg = err.message || t('common.error');
      const cleaned = msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "");
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.requireMfa) {
          setMfaRequired(true);
          setLoading(false);
          return;
        }
        setError(parsed.message || cleaned);
      } catch {
        setError(cleaned);
      }
    } finally {
      if (!mfaRequired) setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/mfa/login", { code: mfaCode });
      const userData = await res.json();
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({ title: t('login.success') });
      if (window.location.pathname === "/login") {
        let dest = "/dashboard";
        if (userData?.role === "super_admin") dest = "/command-center";
        else if (userData?.division === "corporate") dest = "/businesses";
        else if (userData?.division === "telco") dest = "/telco-scoring";
        else if (userData?.division === "retail") dest = "/consumers";
        window.location.replace(dest);
      }
    } catch (err: any) {
      const msg = err.message || t('common.error');
      const cleaned = msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "");
      try {
        const parsed = JSON.parse(cleaned);
        setError(parsed.message || cleaned);
      } catch {
        setError(cleaned);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsumerError("");
    setConsumerLoading(true);
    try {
      const res = await fetch("/api/consumer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId: consumerNationalId, password: consumerPassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || t('login.loginFailed'));
      toast({ title: t('login.welcomeBack') });
      window.location.replace("/my-credit");
    } catch (err: any) {
      setConsumerError(err.message || t('login.loginFailed'));
    } finally {
      setConsumerLoading(false);
    }
  };

  const registryName = isGhanaMode() ? "Ghana Credit Registry" : "Africa Credit Hub";

  const Pill = ({ children }: { children: string }) => (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: "hsl(215 30% 94%)",
        color: "hsl(215 25% 40%)",
        border: "1px solid hsl(215 25% 88%)",
      }}>
      {children}
    </span>
  );

  const ConsumerPill = ({ children }: { children: string }) => (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: "hsl(265 30% 95%)",
        color: "hsl(265 40% 45%)",
        border: "1px solid hsl(265 25% 88%)",
      }}>
      {children}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col" data-testid="page-login"
      style={{ background: "linear-gradient(180deg, hsl(210 40% 98%) 0%, hsl(215 30% 95%) 50%, hsl(220 25% 93%) 100%)" }}>

      <style>{`
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .login-card-hover {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .login-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>

      <header className="flex items-center justify-between px-6 sm:px-10 py-5" style={{
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease-out",
      }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(215 50% 48%), hsl(215 45% 38%))" }}>
            <Globe className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: "hsl(215 30% 22%)" }}>
            {registryName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "hsl(215 30% 45%)" }}
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </a>
          <div data-testid="login-language-switcher">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-10">
        {mode === "chooser" && (
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "hsl(215 30% 18%)" }}
                data-testid="text-login-title">
                {t('login.welcomeTo')} {registryName}
              </h1>
              <p className="mt-3 text-base" style={{ color: "hsl(215 15% 50%)" }}>
                {t('login.choosePortal')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[820px] w-full mx-auto">
              <button
                type="button"
                aria-label={t('login.institutionAriaLabel')}
                className="login-card-hover rounded-2xl p-7 cursor-pointer relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
                  border: "1px solid hsl(215 30% 90%)",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.03)",
                  backdropFilter: "blur(20px)",
                }}
                onClick={() => { setMode("institution"); setError(""); setConsumerError(""); }}
                data-testid="button-login-institution"
              >
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]"
                  style={{ background: "radial-gradient(circle at top right, hsl(215 60% 50%), transparent 70%)" }} />

                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: "linear-gradient(135deg, hsl(215 55% 50%) 0%, hsl(215 50% 42%) 100%)",
                    boxShadow: "0 4px 12px -2px hsla(215, 55%, 50%, 0.3)",
                  }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-2" style={{ color: "hsl(215 30% 18%)" }}>
                  {t('login.businessPortalTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "hsl(215 15% 48%)" }}>
                  {t('login.businessPortalDesc')}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Pill>{t('login.pillCreditBureau')}</Pill>
                  <Pill>{t('login.pillPortfolioIntel')}</Pill>
                  <Pill>{t('login.pillRegReports')}</Pill>
                </div>

                <button
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, hsl(215 55% 50%) 0%, hsl(215 50% 40%) 100%)",
                    boxShadow: "0 4px 16px -4px hsla(215, 55%, 45%, 0.35)",
                  }}
                  data-testid="button-sign-in-institution"
                >
                  {t('login.signInAsInstitution')}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="mt-4 text-center">
                  <a href="/signup" className="text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                    style={{ color: "hsl(215 45% 50%)" }}
                    data-testid="link-register-institution"
                    onClick={(e) => e.stopPropagation()}>
                    {t('login.registerInstitution')} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </button>

              <button
                type="button"
                aria-label={t('login.consumerAriaLabel')}
                className="login-card-hover rounded-2xl p-7 cursor-pointer relative overflow-hidden text-left"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
                  border: "1px solid hsl(260 25% 90%)",
                  boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.03)",
                  backdropFilter: "blur(20px)",
                }}
                onClick={() => { setMode("consumer"); setError(""); setConsumerError(""); }}
                data-testid="button-login-consumer"
              >
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]"
                  style={{ background: "radial-gradient(circle at top right, hsl(265 50% 55%), transparent 70%)" }} />

                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: "linear-gradient(135deg, hsl(265 50% 55%) 0%, hsl(265 45% 45%) 100%)",
                    boxShadow: "0 4px 12px -2px hsla(265, 50%, 50%, 0.3)",
                  }}>
                  <UserCircle className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-2" style={{ color: "hsl(215 30% 18%)" }}>
                  {t('login.personalPortalTitle')}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "hsl(215 15% 48%)" }}>
                  {t('login.personalPortalDesc')}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <ConsumerPill>{t('login.pillFreeReport')}</ConsumerPill>
                  <ConsumerPill>{t('login.pillDisputeMgmt')}</ConsumerPill>
                  <ConsumerPill>{t('login.pillScoreTracking')}</ConsumerPill>
                </div>

                <button
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, hsl(265 50% 55%) 0%, hsl(265 45% 42%) 100%)",
                    boxShadow: "0 4px 16px -4px hsla(265, 50%, 45%, 0.35)",
                  }}
                  data-testid="button-check-my-credit"
                >
                  {t('login.checkMyCredit')}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="mt-4 text-center">
                  <a href="/consumer/register" className="text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                    style={{ color: "hsl(265 40% 50%)" }}
                    data-testid="link-consumer-register"
                    onClick={(e) => e.stopPropagation()}>
                    {t('login.createFreeAccount')} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "consumer" && (
          <div className="w-full max-w-[440px]" style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          }}>
            <button
              onClick={() => { setMode("chooser"); setConsumerError(""); }}
              className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
              style={{ color: "hsl(215 15% 50%)" }}
              data-testid="button-back-to-chooser-consumer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('login.backToPortals')}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(265 50% 55%), hsl(265 45% 45%))",
                  boxShadow: "0 4px 12px -2px hsla(265, 50%, 50%, 0.25)",
                }}>
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "hsl(215 30% 18%)" }}
                  data-testid="text-consumer-login-title">{t('login.personalPortalTitle')}</h1>
                <p className="text-xs" style={{ color: "hsl(215 15% 50%)" }}>{t('login.accessPersonalProfile')}</p>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid hsl(215 30% 90%)",
              boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.06)",
              backdropFilter: "blur(20px)",
            }}>
              <form onSubmit={handleConsumerLogin} className="space-y-4" data-testid="form-consumer-login">
                {consumerError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
                    style={{ background: "hsl(0 80% 97%)", border: "1px solid hsl(0 60% 90%)", color: "hsl(0 70% 40%)" }}
                    data-testid="text-consumer-login-error">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{consumerError}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="consumer-national-id" className="text-sm font-medium" style={{ color: "hsl(215 25% 30%)" }}>
                    {t('login.nationalIdLabel')}
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(215 15% 65%)" }} />
                    <Input
                      id="consumer-national-id"
                      data-testid="input-consumer-national-id"
                      value={consumerNationalId}
                      onChange={(e) => setConsumerNationalId(e.target.value)}
                      placeholder={t('login.nationalIdPlaceholder')}
                      required
                      autoFocus
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumer-password" className="text-sm font-medium" style={{ color: "hsl(215 25% 30%)" }}>
                    {t('login.passwordLabel')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(215 15% 65%)" }} />
                    <Input
                      id="consumer-password"
                      data-testid="input-consumer-password"
                      type={showConsumerPassword ? "text" : "password"}
                      value={consumerPassword}
                      onChange={(e) => setConsumerPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                      className="h-11 pl-10 pr-10 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-200"
                    />
                    <button
                      type="button"
                      aria-label={showConsumerPassword ? t('login.hidePassword') : t('login.showPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "hsl(215 15% 60%)" }}
                      onClick={() => setShowConsumerPassword(!showConsumerPassword)}
                      data-testid="button-toggle-consumer-password"
                    >
                      {showConsumerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={consumerLoading || !consumerNationalId || !consumerPassword}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, hsl(265 50% 55%) 0%, hsl(265 45% 42%) 100%)",
                    boxShadow: "0 4px 16px -4px hsla(265, 50%, 45%, 0.35)",
                  }}
                  data-testid="button-consumer-login-submit"
                >
                  {consumerLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('login.signingIn')}
                    </span>
                  ) : (
                    <>
                      {t('login.checkMyCredit')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "hsl(215 25% 88%)" }} />
              <span className="text-xs whitespace-nowrap" style={{ color: "hsl(215 15% 60%)" }}>{t('login.orContinueWith')}</span>
              <div className="flex-1 h-px" style={{ background: "hsl(215 25% 88%)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid hsl(215 25% 88%)",
                  color: "hsl(215 25% 30%)",
                }}
                onClick={() => window.location.href = "/api/consumer/auth/google?from=/my-credit"}
                data-testid="button-google-login-consumer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                className="h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid hsl(215 25% 88%)",
                  color: "hsl(215 25% 30%)",
                }}
                onClick={() => window.location.href = "/api/consumer/auth/apple?from=/my-credit"}
                data-testid="button-apple-login-consumer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm mt-5">
              <a href="/consumer/register" className="font-medium flex items-center gap-1" style={{ color: "hsl(265 40% 50%)" }}
                data-testid="link-consumer-register-form">
                {t('login.createFreeAccount')} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {mode === "institution" && (
          <div className="w-full max-w-[440px]" style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          }}>
            <button
              onClick={() => { setMode("chooser"); setError(""); }}
              className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
              style={{ color: "hsl(215 15% 50%)" }}
              data-testid="button-back-to-chooser-institution"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('login.backToPortals')}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(215 55% 50%), hsl(215 50% 40%))",
                  boxShadow: "0 4px 12px -2px hsla(215, 55%, 50%, 0.25)",
                }}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "hsl(215 30% 18%)" }}
                  data-testid="text-institution-login-title">{t('login.businessPortalTitle')}</h1>
                <p className="text-xs" style={{ color: "hsl(215 15% 50%)" }}>{t('login.subtitle')}</p>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid hsl(215 30% 90%)",
              boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.06)",
              backdropFilter: "blur(20px)",
            }}>
              {mfaRequired ? (
                <form onSubmit={handleMfaSubmit} className="space-y-4" data-testid="form-mfa-login">
                  {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
                      style={{ background: "hsl(0 80% 97%)", border: "1px solid hsl(0 60% 90%)", color: "hsl(0 70% 40%)" }}
                      data-testid="text-mfa-error">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code" className="text-sm font-medium" style={{ color: "hsl(215 25% 30%)" }}>
                      {t('mfa.code')}
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(215 15% 65%)" }} />
                      <Input
                        id="mfa-code"
                        data-testid="input-mfa-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg tracking-[0.5em] font-mono h-12 pl-10 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || mfaCode.length !== 6}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, hsl(215 55% 50%) 0%, hsl(215 50% 40%) 100%)",
                      boxShadow: "0 4px 16px -4px hsla(215, 55%, 45%, 0.35)",
                    }}
                    data-testid="button-mfa-submit"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('mfa.verifying')}
                      </span>
                    ) : (
                      <>
                        {t('mfa.verifyAndLogin')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm py-2 flex items-center justify-center gap-2"
                    style={{ color: "hsl(215 15% 50%)" }}
                    onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('mfa.backToLogin')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleInstitutionSubmit} className="space-y-4" data-testid="form-login">
                  {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
                      style={{ background: "hsl(0 80% 97%)", border: "1px solid hsl(0 60% 90%)", color: "hsl(0 70% 40%)" }}
                      data-testid="text-login-error">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium" style={{ color: "hsl(215 25% 30%)" }}>
                      {t('login.username')}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(215 15% 65%)" }} />
                      <Input
                        id="username"
                        data-testid="input-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('login.enterUsername')}
                        required
                        autoFocus
                        className="h-11 pl-10 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium" style={{ color: "hsl(215 25% 30%)" }}>
                      {t('login.password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(215 15% 65%)" }} />
                      <Input
                        id="password"
                        data-testid="input-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.enterPassword')}
                        required
                        className="h-11 pl-10 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, hsl(215 55% 50%) 0%, hsl(215 50% 40%) 100%)",
                      boxShadow: "0 4px 16px -4px hsla(215, 55%, 45%, 0.35)",
                    }}
                    data-testid="button-login"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('login.signingIn')}
                      </span>
                    ) : (
                      <>
                        {t('login.signIn')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                data-testid="button-passkey-login"
                className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, hsl(262 60% 96%) 0%, hsl(215 60% 96%) 100%)",
                  border: "1px solid hsl(262 40% 85%)",
                  color: "hsl(262 50% 40%)",
                }}
              >
                {passkeyLoading ? (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                {passkeyLoading ? "Waiting for passkey…" : "Sign in with Passkey"}
              </button>
              <p className="text-center text-[10px] mt-1.5" style={{ color: "hsl(215 15% 60%)" }}>
                Enter your username above · then use Face ID, fingerprint, or security key
              </p>
            </div>

            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "hsl(215 25% 88%)" }} />
              <span className="text-xs whitespace-nowrap" style={{ color: "hsl(215 15% 60%)" }}>{t('login.orContinueWith')}</span>
              <div className="flex-1 h-px" style={{ background: "hsl(215 25% 88%)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Google",
                  testid: "button-google-login-institutional",
                  icon: (
                    <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ),
                },
                {
                  label: "Microsoft",
                  testid: "button-microsoft-login",
                  icon: (
                    <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                    </svg>
                  ),
                },
                {
                  label: "Apple",
                  testid: "button-apple-login-institutional",
                  icon: (
                    <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  ),
                },
                {
                  label: t('login.enterpriseSSO'),
                  testid: "button-sso-login",
                  icon: <Shield className="w-4 h-4 opacity-40" />,
                },
              ].map(({ label, testid, icon }) => (
                <div key={testid} className="relative" data-testid={testid}>
                  <div
                    className="h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed select-none"
                    style={{
                      background: "hsl(215 20% 97%)",
                      border: "1px solid hsl(215 20% 91%)",
                      color: "hsl(215 15% 65%)",
                    }}
                  >
                    {icon}
                    <span className="opacity-60">{label}</span>
                  </div>
                  <span
                    className="absolute -top-2 -right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: "hsl(215 20% 90%)",
                      color: "hsl(215 15% 50%)",
                    }}
                  >
                    Soon
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-center mt-4" style={{ color: "hsl(215 15% 55%)" }}>
              <Shield className="w-3.5 h-3.5" />
              <p className="text-[11px]">
                {t('login.lockoutWarning')}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm mt-3">
              <a href="/signup" className="font-medium flex items-center gap-1" style={{ color: "hsl(215 45% 50%)" }}
                data-testid="link-signup">
                {t('login.registerInstitution')} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center" style={{
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.6s ease-out",
        transitionDelay: "0.6s",
      }}>
        <p className="text-xs" style={{ color: "hsl(215 10% 58%)" }}>
          {PLATFORM_COMPANY_NAME}&trade; &middot; {isGhanaMode() ? "Ghana Credit Registry v2.6" : "Africa Credit Hub v2.6"}
        </p>
        <p className="text-[10px] mt-1" style={{ color: "hsl(215 10% 68%)" }}>
          &copy; {PLATFORM_COPYRIGHT_YEAR} {PLATFORM_COMPANY_NAME}. {t('login.allRightsReserved')}
        </p>
      </footer>
    </div>
  );
}