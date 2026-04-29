/**
 * Loto Messaging Preferences — Task #286.
 *
 * Tiny consumer-facing form: opt-out reminders, preferred language, phone
 * verification. Mounted inside the consumer Loto workspace. Winner SMS
 * always fires (legal/audit obligation) regardless of `optOutReminders`.
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MessagingPrefs {
  userId: string;
  optOutReminders: boolean;
  language: "en" | "fr";
  verifiedPhone: string | null;
  verifiedAt: string | null;
}

export function LotoMessagingPreferences({ countryCode }: { countryCode: string }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ prefs: MessagingPrefs }>({
    queryKey: ["/api/loto/consumer/messaging-prefs"],
  });
  const [optOut, setOptOut] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (data?.prefs) {
      setOptOut(data.prefs.optOutReminders);
      setLanguage(data.prefs.language);
      setPhone(data.prefs.verifiedPhone ?? "");
    }
  }, [data?.prefs]);

  const save = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/loto/consumer/messaging-prefs", {
        optOutReminders: optOut,
        language,
        phone: phone.trim() || null,
        countryCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loto/consumer/messaging-prefs"] });
      toast({ title: "Preferences saved", description: "Your messaging settings are up to date." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not save preferences";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid="card-loto-messaging-prefs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Notification preferences
        </CardTitle>
        <CardDescription className="text-xs">
          Winner alerts always reach you. Reminders and tips can be turned off here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="opt-out-reminders" className="text-sm font-medium">
                  Pause draw reminders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Stops the 24-hour-before-close SMS. Winner SMS always sends.
                </p>
              </div>
              <Switch
                id="opt-out-reminders"
                checked={optOut}
                onCheckedChange={setOptOut}
                data-testid="switch-opt-out-reminders"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lang" className="text-sm font-medium">
                Preferred language
              </Label>
              <Select value={language} onValueChange={(v: string) => setLanguage(v as "en" | "fr")}>
                <SelectTrigger id="lang" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+225 07 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
              <p className="text-xs text-muted-foreground">
                {data?.prefs.verifiedAt
                  ? "Verified — winnings will be sent as SMS to this number."
                  : "Enter the phone you carry — it must be reachable to receive prize alerts."}
              </p>
            </div>

            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="w-full"
              data-testid="button-save-messaging-prefs"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save preferences"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
