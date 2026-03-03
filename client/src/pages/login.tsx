import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, ArrowRight, Globe, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(175 55% 22%) 0%, hsl(175 45% 16%) 40%, hsl(200 30% 12%) 100%)"
      }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg, hsl(43 80% 55%) 0%, hsl(33 75% 50%) 100%)"
            }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 font-semibold text-lg tracking-tight">CDH Registry</span>
          </div>

          <div className="max-w-lg">
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Cross-Jurisdictional<br />
              <span style={{ color: "hsl(43 80% 65%)" }}>Credit Data Hub</span>
            </h2>
            <p className="text-white/60 mt-4 text-base leading-relaxed">
              {t('login.heroDescription')}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { label: t('login.jurisdictions'), val: t('login.fourCountries') },
                { label: t('login.currencies'), val: t('login.eighteenSupported') },
                { label: t('login.compliance'), val: "SRS v1.2" },
                { label: t('login.languages'), val: "EN / FR / PT / AR / SW" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{item.label}</p>
                  <p className="text-white font-semibold mt-1">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs space-y-1">
            <p className="text-white/50">
              Systems In Motion Limited™ &middot; Cross-Jurisdictional CDH v1.2
            </p>
            <p className="text-white/30 text-[10px]">
              © 2026 Systems In Motion Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-background relative">
        <div className="absolute top-4" style={{ right: "1rem" }} data-testid="login-language-switcher">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[420px] space-y-6 sm:space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CDH Registry</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-login-title">
              {mfaRequired ? t('mfa.verification') : t('login.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mfaRequired ? t('mfa.enterCodePrompt') : t('login.subtitle')}
            </p>
          </div>

          <Card className="border-0 shadow-lg">
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
                    <Input
                      id="mfa-code"
                      data-testid="input-mfa-code"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-lg tracking-[0.5em] font-mono h-12"
                      maxLength={6}
                      autoFocus
                      required
                    />
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
                    <Input
                      id="username"
                      data-testid="input-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('login.enterUsername')}
                      required
                      autoFocus
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">{t('login.password')}</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.enterPassword')}
                      required
                      className="h-11"
                    />
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

          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-[11px]">
              {t('login.lockoutWarning')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
