import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2 } from "lucide-react";

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
            <p className="text-sm text-muted-foreground">{t("mfa.description")}</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>{t("mfa.step1")}</p>
              <p>{t("mfa.step2")}</p>
              <p>{t("mfa.step3")}</p>
            </div>
            <Button className="w-full" onClick={handleSetup} disabled={loading} data-testid="button-setup-mfa">
              <Shield className="w-4 h-4 mr-2" />
              {loading ? t("common.processing") : t("mfa.setup")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">{t("mfa.secretKey")}</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs font-mono bg-muted p-2.5 rounded-md break-all select-all" data-testid="text-mfa-secret">
                  {secret}
                </code>
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={copySecret} data-testid="button-copy-secret">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{t("mfa.copyInstructions")}</p>
            </div>

            <div>
              <Label className="text-xs font-medium">{t("mfa.otpAuthUri")}</Label>
              <code className="block text-[10px] font-mono bg-muted p-2 rounded-md break-all mt-1 max-h-16 overflow-auto" data-testid="text-mfa-uri">
                {uri}
              </code>
            </div>

            <div>
              <Label>{t("mfa.enterCode")}</Label>
              <Input
                data-testid="input-mfa-verify-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em] font-mono h-12 mt-1"
                maxLength={6}
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
