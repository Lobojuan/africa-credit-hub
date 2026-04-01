import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, ArrowRight, Globe, ArrowLeft, User, Lock, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isGhanaMode, getCountryConfig } from "@/lib/country-mode";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
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
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { visualStyle } = useTheme();
  const isScandinavian = visualStyle === "scandinavian";

  const colors = isScandinavian ? {
    panelBg: "linear-gradient(135deg, hsl(210 35% 22%) 0%, hsl(215 30% 16%) 40%, hsl(220 25% 12%) 100%)",
    accent: "hsl(210 45% 55%)",
    accentLight: "hsl(210 45% 70%)",
    accentGlow: "rgba(66, 135, 245, 0.3)",
    accentGlowFaint: "rgba(66, 135, 245, 0.15)",
    orb1: "hsl(210 50% 55%)",
    orb2: "hsl(200 40% 50%)",
    orb3: "hsl(220 40% 60%)",
  } : {
    panelBg: "linear-gradient(135deg, hsl(175 55% 22%) 0%, hsl(175 45% 16%) 40%, hsl(200 30% 12%) 100%)",
    accent: "hsl(43 80% 55%)",
    accentLight: "hsl(43 80% 65%)",
    accentGlow: "rgba(218, 165, 32, 0.3)",
    accentGlowFaint: "rgba(218, 165, 32, 0.15)",
    orb1: "hsl(43 80% 55%)",
    orb2: "hsl(175 55% 45%)",
    orb3: "hsl(43 60% 60%)",
  };

  useEffect(() => {
    if (mounted) return;
    const timer = setTimeout(() => {
      setMounted(true);
      sessionStorage.setItem("login_seen", "1");
    }, 50);
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen flex" data-testid="page-login">
      <style>{`
        @keyframes loginFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -25px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes loginFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(0.97); }
          66% { transform: translate(15px, -30px) scale(1.03); }
        }
        @keyframes loginFloat3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -15px) rotate(3deg); }
        }
        @keyframes loginPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${colors.accentGlow}; }
          50% { box-shadow: 0 0 20px 6px ${colors.accentGlowFaint}; }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .login-animate-in {
          animation: loginSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-fade-in {
          animation: loginFadeIn 0.6s ease-out forwards;
        }
      `}</style>

      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{
        background: colors.panelBg,
      }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div
          className="absolute rounded-full opacity-[0.07]"
          style={{
            width: "400px",
            height: "400px",
            top: "-80px",
            right: "-60px",
            background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`,
            animation: "loginFloat1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.05]"
          style={{
            width: "300px",
            height: "300px",
            bottom: "10%",
            left: "-40px",
            background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`,
            animation: "loginFloat2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.04]"
          style={{
            width: "200px",
            height: "200px",
            top: "40%",
            right: "20%",
            background: `radial-gradient(circle, ${colors.orb3} 0%, transparent 70%)`,
            animation: "loginFloat3 18s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: isScandinavian
                ? "linear-gradient(135deg, hsl(210 45% 52%) 0%, hsl(215 40% 45%) 100%)"
                : "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 75% 50%) 100%)",
              animation: "loginPulse 3s ease-in-out infinite",
            }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 font-semibold text-lg tracking-tight">{isGhanaMode() ? "Ghana Credit Registry" : "CDH Registry"}</span>
          </div>

          <div className="max-w-lg" style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: "0.2s",
          }}>
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              {isGhanaMode() ? (
                <>Ghana<br /><span style={{ color: colors.accentLight }}>Credit Registry</span></>
              ) : (
                <>Unified Pan-African<br /><span style={{ color: colors.accentLight }}>Credit Infrastructure</span></>
              )}
            </h2>
            <p className="text-white/60 mt-4 text-base leading-relaxed">
              {isGhanaMode() 
                ? "Ghana's unified credit registry system. Empowering financial inclusion and responsible lending across the nation."
                : "Securely access Consumer, Corporate, and AI-driven Telco credit profiles across 54 African jurisdictions."}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {(isGhanaMode() ? [
                { label: "Jurisdiction", val: "Ghana" },
                { label: "Currency", val: "GHS (\u20B5)" },
                { label: "Compliance", val: "SRS v2.0" },
                { label: "Regulator", val: "Bank of Ghana" },
              ] : [
                { label: t('login.jurisdictions'), val: t('login.fourCountries') },
                { label: t('login.currencies'), val: t('login.eighteenSupported') },
                { label: t('login.compliance'), val: "SRS v2.0" },
                { label: t('login.languages'), val: "EN / FR / PT / AR / SW" },
              ]).map((item, i) => (
                <div key={item.label} className="rounded-xl p-4" style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out, background 0.3s ease",
                  transitionDelay: `${0.4 + i * 0.1}s`,
                }}>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{item.label}</p>
                  <p className="text-white font-semibold mt-1">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs space-y-1" style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out",
            transitionDelay: "0.9s",
          }}>
            <p className="text-white/50">
              Carlson Capital & Systems In Motion Limited\u2122 &middot; {isGhanaMode() ? "Ghana Credit Registry v2.0" : "Cross-Jurisdictional CDH v2.0"}
            </p>
            <p className="text-white/30 text-[10px]">
              &copy; 2026 Carlson Capital & Systems In Motion Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-background relative">
        <div className="absolute top-4" style={{ right: "1rem" }} data-testid="login-language-switcher">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[420px] space-y-6 sm:space-y-8" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          transitionDelay: "0.15s",
        }}>
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary" style={{
              animation: "loginPulse 3s ease-in-out infinite",
            }}>
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">{isGhanaMode() ? "Ghana Credit Registry" : "CDH Registry"}</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-login-title">
              {mfaRequired ? t('mfa.verification') : t('login.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mfaRequired ? t('mfa.enterCodePrompt') : t('login.subtitle')}
            </p>
          </div>

          <Card className="border-0 shadow-lg" style={{
            transition: "box-shadow 0.3s ease",
          }}>
            <CardContent className="p-6">
              {mfaRequired ? (
                <form onSubmit={handleMfaSubmit} className="space-y-5" data-testid="form-mfa-login">
                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm" data-testid="text-mfa-error">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code" className="text-sm font-medium">{t('mfa.code')}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="mfa-code"
                        data-testid="input-mfa-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg tracking-[0.5em] font-mono h-12 pl-10"
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading || mfaCode.length !== 6} data-testid="button-mfa-submit">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {t('mfa.verifying')}
                      </span>
                    ) : (
                      <>
                        {t('mfa.verifyAndLogin')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('mfa.backToLogin')}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-login">
                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm" data-testid="text-login-error">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">{t('login.username')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="username"
                        data-testid="input-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('login.enterUsername')}
                        required
                        autoFocus
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">{t('login.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        data-testid="input-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.enterPassword')}
                        required
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading} data-testid="button-login">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {t('login.signingIn')}
                      </span>
                    ) : (
                      <>
                        {t('login.signIn')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="relative flex items-center gap-3 my-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">or continue with</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2 font-medium"
              onClick={() => window.location.href = "/api/consumer/auth/google?from=/dashboard"}
              data-testid="button-google-login-institutional"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2 font-medium"
              onClick={() => window.location.href = "/api/consumer/auth/apple?from=/dashboard"}
              data-testid="button-apple-login-institutional"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-[11px]">
              {t('login.lockoutWarning')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/solutions" className="text-primary hover:underline flex items-center gap-1" data-testid="link-back-home">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </a>
            <span className="text-muted-foreground">·</span>
            <a href="/signup" className="text-primary hover:underline" data-testid="link-signup">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
