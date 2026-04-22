import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield, ArrowRight, Building2, Globe, CheckCircle2,
  Eye, EyeOff, Loader2, ArrowLeft, Mail, Phone, MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBrandColors } from "@/hooks/use-brand-colors";
import { PLATFORM_COMPANY_NAME, PLATFORM_SUPPORT_EMAIL } from "@/lib/platform-config";

const INSTITUTION_TYPES = [
  { value: "bank", label: "Commercial Bank" },
  { value: "microfinance", label: "Microfinance Institution" },
  { value: "fintech", label: "Fintech / Digital Lender" },
  { value: "insurance", label: "Insurance Company" },
  { value: "telecom", label: "Telecom / Mobile Money" },
  { value: "regulator", label: "Central Bank / Regulator" },
  { value: "government", label: "Government Agency" },
  { value: "investment", label: "Investment / DFI" },
  { value: "utility", label: "Utility Provider" },
  { value: "real_estate", label: "Real Estate / Mortgage" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo (Brazzaville)", "Congo (DRC)", "Djibouti", "Egypt", "Equatorial Guinea",
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea",
  "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe",
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

const BENEFITS = [
  "Full platform access for 14 days",
  "Admin-level functionality",
  "All 16 modules included",
  "Sample data pre-loaded for testing",
  "No credit card required",
];

export default function StartTrialPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const brandColors = useBrandColors();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [country, setCountry] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (consumerSession.data?.authenticated && !googlePrefilled) {
      if (consumerSession.data.fullName) setFullName(consumerSession.data.fullName);
      if (consumerSession.data.email) {
        setEmail(consumerSession.data.email);
        setOrgEmail(consumerSession.data.email);
        const emailUser = consumerSession.data.email.split("@")[0];
        if (!username) setUsername(emailUser);
      }
      setGooglePrefilled(true);
      setErrors({});
    }
  }, [consumerSession.data]);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!orgName.trim()) e.orgName = "Organization name is required";
    if (!orgType) e.orgType = "Please select institution type";
    if (!country) e.country = "Please select country";
    if (!orgEmail.trim()) e.orgEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgEmail)) e.orgEmail = "Invalid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!username.trim()) e.username = "Username is required";
    else if (username.length < 3) e.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) e.username = "Username can only contain letters, numbers, dots, hyphens, underscores";
    if (!googlePrefilled) {
      if (!password) e.password = "Password is required";
      else if (password.length < 8) e.password = "Password must be at least 8 characters";
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) e.password = "Must include uppercase, lowercase, and a number";
      if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/trial/register", {
        organization: {
          name: orgName.trim(),
          type: orgType,
          country,
          contactEmail: orgEmail.trim(),
          contactPhone: orgPhone.trim() || undefined,
        },
        user: {
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim(),
          ...(googlePrefilled ? {} : { password }),
        },
      });

      const data = await res.json();

      toast({
        title: "Trial account created!",
        description: `Welcome, ${fullName.split(" ")[0]}. Logging you in...`,
      });

      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      const msg = err.message || "Registration failed";
      const cleaned = msg.replace(/^\d+:\s*/, "").replace(/^"?|"?$/g, "");
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.field) {
          setErrors({ [parsed.field]: parsed.message });
        } else {
          toast({ title: "Error", description: parsed.message || cleaned, variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: cleaned, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="start-trial-page">
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/solutions")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Africa Credit Hub</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Free Trial</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/solutions")} data-testid="link-back-solutions">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to Overview
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/login")} data-testid="link-login">
              Already have an account? Log in
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <Badge variant="outline" className="mb-4 text-xs">Free 14-Day Trial</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-trial-title">
              Start Your Free Trial
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Set up your organization and create your admin account. You'll have full access to the platform immediately.
            </p>

            <div className="mb-6">
              {consumerSession.data?.authenticated ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-4" data-testid="text-google-signed-in">
                  {consumerSession.data.profilePicture ? (
                    <img src={consumerSession.data.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Signed in as {consumerSession.data.fullName || consumerSession.data.email}</p>
                    <p className="text-[11px] text-muted-foreground">Your details have been pre-filled below</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => window.location.href = "/api/consumer/auth/google?from=/start-trial"}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                      data-testid="button-google-trial"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Sign up with Google
                    </button>
                    <button
                      onClick={() => window.location.href = "/api/auth/microsoft?from=/start-trial"}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                      data-testid="button-microsoft-trial"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                      Sign up with Microsoft
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                    <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or fill in the form below</span></div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                1
              </div>
              <div className={`h-0.5 w-12 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                2
              </div>
            </div>

            {step === 1 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Organization Details
                  </h2>
                  <p className="text-xs text-muted-foreground mb-6">Tell us about your institution</p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="orgName" className="text-sm">Organization Name *</Label>
                      <Input
                        id="orgName"
                        placeholder="e.g. First National Bank"
                        value={orgName}
                        onChange={(e) => { setOrgName(e.target.value); setErrors(prev => ({ ...prev, orgName: "" })); }}
                        className={errors.orgName ? "border-destructive" : ""}
                        data-testid="input-org-name"
                      />
                      {errors.orgName && <p className="text-xs text-destructive mt-1">{errors.orgName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="orgType" className="text-sm">Institution Type *</Label>
                      <Select value={orgType} onValueChange={(v) => { setOrgType(v); setErrors(prev => ({ ...prev, orgType: "" })); }}>
                        <SelectTrigger className={errors.orgType ? "border-destructive" : ""} data-testid="select-org-type">
                          <SelectValue placeholder="Select institution type" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSTITUTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.orgType && <p className="text-xs text-destructive mt-1">{errors.orgType}</p>}
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-sm">Country *</Label>
                      <Select value={country} onValueChange={(v) => { setCountry(v); setErrors(prev => ({ ...prev, country: "" })); }}>
                        <SelectTrigger className={errors.country ? "border-destructive" : ""} data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
                    </div>

                    <div>
                      <Label htmlFor="orgEmail" className="text-sm">Contact Email *</Label>
                      <Input
                        id="orgEmail"
                        type="email"
                        placeholder="info@yourbank.com"
                        value={orgEmail}
                        onChange={(e) => { setOrgEmail(e.target.value); setErrors(prev => ({ ...prev, orgEmail: "" })); }}
                        className={errors.orgEmail ? "border-destructive" : ""}
                        data-testid="input-org-email"
                      />
                      {errors.orgEmail && <p className="text-xs text-destructive mt-1">{errors.orgEmail}</p>}
                    </div>

                    <div>
                      <Label htmlFor="orgPhone" className="text-sm">Phone Number (optional)</Label>
                      <Input
                        id="orgPhone"
                        type="tel"
                        placeholder="+233 XX XXX XXXX"
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        data-testid="input-org-phone"
                      />
                    </div>

                    <Button className="w-full gap-2" onClick={handleNext} data-testid="button-next-step">
                      Continue to Account Setup
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Your Admin Account
                  </h2>
                  <p className="text-xs text-muted-foreground mb-6">Create your login credentials</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. Kwame Mensah"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: "" })); }}
                        className={errors.fullName ? "border-destructive" : ""}
                        data-testid="input-full-name"
                      />
                      {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="kwame@yourbank.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: "" })); }}
                        className={errors.email ? "border-destructive" : ""}
                        data-testid="input-email"
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="username" className="text-sm">Username *</Label>
                      <Input
                        id="username"
                        placeholder="e.g. kwame.mensah"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({ ...prev, username: "" })); }}
                        className={errors.username ? "border-destructive" : ""}
                        data-testid="input-username"
                      />
                      {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                    </div>

                    {!googlePrefilled && (
                      <>
                        <div>
                          <Label htmlFor="password" className="text-sm">Password *</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Min 8 chars, uppercase, lowercase, number"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
                              className={errors.password ? "border-destructive pr-10" : "pr-10"}
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword" className="text-sm">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                            className={errors.confirmPassword ? "border-destructive" : ""}
                            data-testid="input-confirm-password"
                          />
                          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                        </div>
                      </>
                    )}
                    {googlePrefilled && (
                      <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground" data-testid="text-google-auth-note">
                        <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-primary" />
                        You'll sign in with Google — no password needed.
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-back">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-[2] gap-2" data-testid="button-create-account">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account & Start Trial
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-4">What's Included in Your Trial</h3>
                <div className="space-y-3 mb-6">
                  {BENEFITS.map((b) => (
                    <div key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{b}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="text-xs font-semibold mb-3">Your trial includes:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "54", label: "Countries" },
                      { value: "42+", label: "Currencies" },
                      { value: "16", label: "Modules" },
                      { value: "5", label: "Languages" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-muted/50 p-2 text-center">
                        <div className="text-sm font-bold text-primary">{s.value}</div>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Globe className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Pan-African Coverage</p>
                      <p className="text-[10px] text-muted-foreground">Deploy across any African jurisdiction with per-country regulatory compliance built in.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Enterprise-Grade Security</p>
                      <p className="text-[10px] text-muted-foreground">MFA, RBAC, tamper-proof audit trails, and regulatory compliance from day one.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/50 bg-muted/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] text-muted-foreground/80">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Africa Credit Hub</p>
              <p>Pan-African Credit Registry — Africa Credit Hub v2.6</p>
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /><span>Accra, Ghana</span></div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">Contact</p>
              <a href={`mailto:${PLATFORM_SUPPORT_EMAIL}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="w-3 h-3" />{PLATFORM_SUPPORT_EMAIL}</a>
            </div>
            <div className="space-y-1.5">
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 py-3 px-4">
          <p className="max-w-7xl mx-auto text-center text-[10px] text-muted-foreground/60">&copy; {new Date().getFullYear()} {PLATFORM_COMPANY_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
