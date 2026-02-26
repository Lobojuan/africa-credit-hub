import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Eye, EyeOff } from "lucide-react";

interface PasswordChangeDialogProps {
  open: boolean;
  forced?: boolean;
}

export function PasswordChangeDialog({ open, forced }: PasswordChangeDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(open);

  const rules = [
    { key: "minLength", test: (p: string) => p.length >= 8, label: t("passwordChange.ruleMinLength") },
    { key: "uppercase", test: (p: string) => /[A-Z]/.test(p), label: t("passwordChange.ruleUppercase") },
    { key: "lowercase", test: (p: string) => /[a-z]/.test(p), label: t("passwordChange.ruleLowercase") },
    { key: "digit", test: (p: string) => /\d/.test(p), label: t("passwordChange.ruleDigit") },
    { key: "special", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), label: t("passwordChange.ruleSpecial") },
  ];

  const allRulesPassed = rules.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && allRulesPassed && passwordsMatch;
  const passedCount = rules.filter((r) => r.test(newPassword)).length;

  const strengthPercent = (passedCount / rules.length) * 100;
  const strengthColor =
    strengthPercent <= 20
      ? "bg-destructive"
      : strengthPercent <= 60
        ? "bg-yellow-500"
        : strengthPercent < 100
          ? "bg-blue-500"
          : "bg-green-500";

  const changeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      toast({ title: t("passwordChange.success") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={forced ? true : dialogOpen} onOpenChange={forced ? undefined : setDialogOpen}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={forced ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={forced ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle data-testid="text-password-change-title">{t("passwordChange.title")}</DialogTitle>
          <DialogDescription>
            {forced ? t("passwordChange.expiredMessage") : t("passwordChange.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("passwordChange.currentPassword")}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowCurrent(!showCurrent)}
                data-testid="button-toggle-current-password"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t("passwordChange.newPassword")}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowNew(!showNew)}
                data-testid="button-toggle-new-password"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-2">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strengthColor}`}
                    style={{ width: `${strengthPercent}%` }}
                    data-testid="indicator-password-strength"
                  />
                </div>
                <ul className="space-y-1">
                  {rules.map((rule) => {
                    const passed = rule.test(newPassword);
                    return (
                      <li key={rule.key} className="flex items-center gap-2 text-xs" data-testid={`rule-${rule.key}`}>
                        {passed ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className={passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("passwordChange.confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowConfirm(!showConfirm)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive" data-testid="text-password-mismatch">
                {t("passwordChange.mismatch")}
              </p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit || changeMutation.isPending}
            onClick={() => changeMutation.mutate()}
            data-testid="button-change-password"
          >
            {changeMutation.isPending ? t("passwordChange.changing") : t("passwordChange.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
