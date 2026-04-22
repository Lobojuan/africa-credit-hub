import { useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2, Smartphone, ExternalLink } from "lucide-react";

interface MfaSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mfaEnabled: boolean;
}

export function MfaSetupDialog({ open, onOpenChange, mfaEnabled }: MfaSetupProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/mfa/setup");
      const data = await res.json();
      setSecret(data.secret);
      setUri(data.uri);
      setStep("verify");
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/mfa/verify", { code });
      toast({ title: t("mfa.enabledSuccess") });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setStep("idle");
      setCode("");
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/mfa/disable");
      toast({ title: t("mfa.disabledSuccess") });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep("idle"); setCode(""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t("mfa.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">Dialog form content</DialogDescription>
        </DialogHeader>

        {mfaEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300 dark:text-green-400">{t("mfa.enabled")}</p>
                <p className="text-xs text-muted-foreground">{t("mfa.enabledDesc")}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDisable}
              disabled={loading}
              data-testid="button-disable-mfa"
            >
              <ShieldOff className="w-4 h-4 mr-2" />
              {loading ? t("common.processing") : t("mfa.disable")}
            </Button>
          </div>
        ) : step === "idle" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              MFA adds a second layer of protection. After entering your password, you'll also need a one-time 6-digit code from your phone.
            </p>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">Step 1 — Install a free authenticator app</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: "Google Authenticator", platforms: "iOS & Android", url: "https://support.google.com/accounts/answer/1066447" },
                  { name: "Microsoft Authenticator", platforms: "iOS & Android", url: "https://www.microsoft.com/en-us/security/mobile-authenticator-app" },
                  { name: "Authy", platforms: "iOS, Android & Desktop", url: "https://authy.com/download/" },
                  { name: "1Password / Bitwarden", platforms: "Built-in authenticator", url: "" },
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                    <div>
                      <p className="text-xs font-medium">{app.name}</p>
                      <p className="text-[10px] text-muted-foreground">{app.platforms}</p>
                    </div>
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline shrink-0">
                        Download <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-3">
              <p className="font-semibold text-foreground">Step 2 — Click the button below</p>
              <p>We'll generate a QR code. Open your authenticator app, tap <span className="font-medium">Add account</span> → <span className="font-medium">Scan QR code</span>, and point your camera at it.</p>
            </div>

            <Button className="w-full" onClick={handleSetup} disabled={loading} data-testid="button-setup-mfa">
              <Shield className="w-4 h-4 mr-2" />
              {loading ? t("common.processing") : "Generate QR Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan the QR code below with Google Authenticator, Authy, or any authenticator app.
            </p>

            {uri && (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-xl border border-border shadow-sm" data-testid="mfa-qr-code">
                  <QRCode value={uri} size={180} />
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Can't scan? Enter the secret key manually instead.
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs font-medium">Manual entry — secret key</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs font-mono bg-muted p-2.5 rounded-md break-all select-all" data-testid="text-mfa-secret">
                  {secret}
                </code>
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={copySecret} data-testid="button-copy-secret">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label>Enter the 6-digit code from your app to confirm</Label>
              <Input
                data-testid="input-mfa-verify-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em] font-mono h-12 mt-1"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              data-testid="button-verify-mfa"
            >
              {loading ? t("common.processing") : t("mfa.verify")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
