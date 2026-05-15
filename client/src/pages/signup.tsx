import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Loader2, Eye, EyeOff, Landmark, Coins, Shield, Smartphone, Zap, Building2, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PLATFORM_COMPANY_NAME, PLATFORM_COPYRIGHT_YEAR } from "@/lib/platform-config";
import { useBrandColors } from "@/hooks/use-brand-colors";

const INSTITUTION_TYPES = [
  { type: "bank", icon: Landmark, label: "Commercial Bank", description: "Licensed deposit-taking institution", division: "retail" },
  { type: "microfinance", icon: Coins, label: "Microfinance Institution", description: "Serving underbanked communities", division: "retail" },
  { type: "insurance", icon: Shield, label: "Insurance Company", description: "Risk assessment and underwriting", division: "retail" },
  { type: "telecom", icon: Smartphone, label: "Telecom / MNO", description: "Mobile network operator or MVNO", division: "telco" },
  { type: "fintech", icon: Zap, label: "Fintech / Startup", description: "Digital financial services provider", division: "retail" },
  { type: "other", icon: Building2, label: "Other Institution", description: "Investment firm, utility, government", division: "corporate" },
] as const;

export default function SignUpPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const brandColors = useBrandColors();

  const [step, setStep] = useState<1 | 2>(1);
  const [institutionType, setInstitutionType] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [googlePrefilled, setGooglePrefilled] = useState(false);

  const consumerSession = useQuery({
    queryKey: ["/api/consumer/session"],
    queryFn: async () => {
      const res = await fetch("/api/consumer/session");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (consumerSession.data?.authenticated && !googlePrefilled) {
      if (consumerSession.data.fullName) setFullName(consumerSession.data.fullName);
      if (consumerSession.data.email) setEmail(consumerSession.data.email);
      setGooglePrefilled(true);
    }
  }, [consumerSession.data]);

  function validate() {
    const e: Record<string, string> = {};
    if (!organizationName.trim()) e.organizationName = "Institution name is required";
    if (!registrationNumber.trim()) e.registrationNumber = "Business registration number is required";
    else if (registrationNumber.trim().length < 4) e.registrationNumber = "Enter a valid registration number";
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!googlePrefilled) {
      if (!password) e.password = "Password is required";
      else if (password.length < 8) e.password = "At least 8 characters";
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
        e.password = "Must include uppercase, lowercase, and a number";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setError("");
    setLoading(true);
    try {
      const username = email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "") + "-" + Date.now().toString(36).slice(-4);
      const res = await apiRequest("POST", "/api/trial/register", {
        organization: {
          name: organizationName.trim(),
          type: institutionType || "other",
          country: "Ghana",
          contactEmail: email.trim(),
          registrationNumber: registrationNumber.trim(),
        },
        user: {
          fullName: fullName.trim(),
          email: email.trim(),
          username,
          division: selectedDivision || null,
          ...(googlePrefilled ? {} : { password }),
        },
      });
      await res.json();
      if (selectedDivision) sessionStorage.setItem("userDivision", selectedDivision);
      toast({ title: "Registration submitted!", description: "Your application is under review." });
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err: any) {
      const msg = err.message || "Registration failed";
      const cleaned = msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "");
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.field) setFieldErrors({ [parsed.field]: parsed.message });
        else setError(parsed.message || cleaned);
      } catch {
        setError(cleaned);
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    const selectedInfo = INSTITUTION_TYPES.find(i => i.type === institutionType);
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4" data-testid="page-signup-step1" style={{
        background: "linear-gradient(160deg, #0a0e1a 0%, #0d1524 30%, #0f1a2e 60%, #0a1220 100%)",
      }}>
        <div className="absolute top-4 right-4 z-10"><LanguageSwitcher /></div>
        <div className="w-full max-w-[600px]" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight" data-testid="text-signup-step1-title">
              {t("signupPage.title")}
            </h1>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              {t("signupPage.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INSTITUTION_TYPES.map(({ type, icon: Icon, label, description, division }) => (
              <button
                key={type}
                onClick={() => { setInstitutionType(type); setSelectedDivision(division); setStep(2); }}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                data-testid={`button-institution-${type}`}
              >
                <Icon className="w-7 h-7 mb-3" style={{ color: "rgba(168,130,255,0.8)" }} />
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{description}</p>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            <a href="/login" className="text-sm hover:underline flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }} data-testid="link-back-portal">
              <ArrowLeft className="w-3.5 h-3.5" /> {t("signupPage.backToLogin")}
            </a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <a href="/" className="text-sm hover:underline flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }} data-testid="link-back-home">
              <ArrowLeft className="w-3.5 h-3.5" /> {t("signupPage.backToHome")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selectedTypeInfo = INSTITUTION_TYPES.find(i => i.type === institutionType);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" data-testid="page-signup" style={{
      background: "linear-gradient(160deg, #0a0e1a 0%, #0d1524 30%, #0f1a2e 60%, #0a1220 100%)",
    }}>
      <div className="absolute top-4 right-4 z-10"><LanguageSwitcher /></div>
      <style>{`
        @keyframes signupFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signup-social-btn {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; height: 48px; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
        }
        .signup-social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .signup-social-btn:active { transform: translateY(0); }
        .signup-input {
          width: 100%; height: 48px; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
          color: #fff; font-size: 14px; padding: 0 20px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .signup-input::placeholder { color: rgba(255,255,255,0.35); }
        .signup-input:focus {
          border-color: rgba(168,130,255,0.5);
          box-shadow: 0 0 0 3px rgba(168,130,255,0.12);
        }
        .signup-input-error { border-color: rgba(239,68,68,0.6); }
        .signup-submit-btn {
          width: 100%; height: 48px; border-radius: 24px;
          font-weight: 600; font-size: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
          color: #fff; border: none; cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 20px rgba(139,92,246,0.3);
        }
        .signup-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(139,92,246,0.4);
        }
        .signup-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .signup-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div className="w-full max-w-[420px]" style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/pwa-icon-192.png" alt="UCH" className="w-8 h-8 object-cover" />
            </div>
            <span className="text-white/90 font-semibold text-lg tracking-tight">Universal Credit Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight" data-testid="text-signup-title">
            {t("signupPage.step2Title")}
          </h1>
        </div>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            className="signup-social-btn"
            onClick={() => window.location.href = "/api/consumer/auth/google?from=/signup"}
            data-testid="button-signup-google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <button
            type="button"
            className="signup-social-btn"
            onClick={() => window.location.href = "/api/consumer/auth/apple?from=/signup"}
            data-testid="button-signup-apple"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Sign up with Apple
          </button>

          <button
            type="button"
            className="signup-social-btn"
            onClick={() => window.location.href = "/api/auth/microsoft?from=/signup"}
            data-testid="button-signup-microsoft"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
              <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
            </svg>
            Sign up with Microsoft
          </button>
        </div>

        <div className="relative flex items-center gap-3 mb-6">
          <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {selectedTypeInfo && (
            <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{
              background: "rgba(168,130,255,0.08)",
              border: "1px solid rgba(168,130,255,0.2)",
            }}>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-sm text-white/80">{selectedTypeInfo.label}</span>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs hover:underline" style={{ color: "#a78bfa" }} data-testid="link-change-type">Change</button>
            </div>
          )}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }} data-testid="text-signup-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t("signupPage.institutionName")}</label>
            <input
              className={`signup-input ${fieldErrors.organizationName ? "signup-input-error" : ""}`}
              placeholder="e.g. ABC Microfinance Ltd"
              value={organizationName}
              onChange={(e) => { setOrganizationName(e.target.value); setFieldErrors(p => ({ ...p, organizationName: "" })); }}
              data-testid="input-signup-org-name"
            />
            {fieldErrors.organizationName && <p className="text-xs mt-1 ml-4" style={{ color: "#f87171" }}>{fieldErrors.organizationName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t("signupPage.registrationNumber")}</label>
            <input
              className={`signup-input ${fieldErrors.registrationNumber ? "signup-input-error" : ""}`}
              placeholder="e.g. CS123456789"
              value={registrationNumber}
              onChange={(e) => { setRegistrationNumber(e.target.value); setFieldErrors(p => ({ ...p, registrationNumber: "" })); }}
              data-testid="input-signup-reg-number"
            />
            {fieldErrors.registrationNumber && <p className="text-xs mt-1 ml-4" style={{ color: "#f87171" }}>{fieldErrors.registrationNumber}</p>}
            <p className="text-[10px] mt-1 ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>From Ghana Registrar General's Department</p>
          </div>

          <div className="pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t("signupPage.adminDetails")}</label>
          </div>

          <div>
            <input
              className={`signup-input ${fieldErrors.fullName ? "signup-input-error" : ""}`}
              placeholder={t("signupPage.fullName")}
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({ ...p, fullName: "" })); }}
              data-testid="input-signup-name"
            />
            {fieldErrors.fullName && <p className="text-xs mt-1 ml-4" style={{ color: "#f87171" }}>{fieldErrors.fullName}</p>}
          </div>

          <div>
            <input
              className={`signup-input ${fieldErrors.email ? "signup-input-error" : ""}`}
              placeholder={t("signupPage.email")}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
              data-testid="input-signup-email"
            />
            {fieldErrors.email && <p className="text-xs mt-1 ml-4" style={{ color: "#f87171" }}>{fieldErrors.email}</p>}
          </div>

          {!googlePrefilled && (
            <div className="relative">
              <input
                className={`signup-input ${fieldErrors.password ? "signup-input-error" : ""}`}
                placeholder={t("signupPage.password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                style={{ paddingRight: "48px" }}
                data-testid="input-signup-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: "rgba(255,255,255,0.4)" }}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {fieldErrors.password && <p className="text-xs mt-1 ml-4" style={{ color: "#f87171" }}>{fieldErrors.password}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="signup-submit-btn"
            data-testid="button-signup-submit"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("signupPage.submitting")}</>
            ) : (
              t("signupPage.submitButton")
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t("signupPage.alreadyHaveAccount")}{" "}
            <a
              href="/login"
              className="font-medium hover:underline"
              style={{ color: "#a78bfa" }}
              data-testid="link-signin"
            >
              {t("signupPage.signInLink")}
            </a>
          </p>
        </div>

        <div className="text-center mt-3">
          <a
            href="/"
            className="text-sm hover:underline flex items-center justify-center gap-1"
            style={{ color: "rgba(255,255,255,0.35)" }}
            data-testid="link-back-home-step2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("signupPage.backToHome")}
          </a>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {t("signupPage.termsNote").split("Terms of Service")[0]}
            <a href="/terms" className="hover:underline" style={{ color: "#a78bfa" }}>Terms of Service</a>
            {t("signupPage.termsNote").split("Terms of Service")[1]?.split("Privacy Policy")[0]}
            <a href="/privacy" className="hover:underline" style={{ color: "#a78bfa" }}>Privacy Policy</a>
          </p>
        </div>

        <div className="text-center mt-6">
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            &copy; {PLATFORM_COPYRIGHT_YEAR} {PLATFORM_COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
