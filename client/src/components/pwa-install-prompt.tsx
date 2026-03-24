import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pwa-install-dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] rounded-xl border border-border bg-card shadow-2xl p-4"
      data-testid="pwa-install-prompt"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(175 55% 28%), hsl(175 55% 22%))" }}>
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">Install CDH Registry</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Install the app for faster access and offline capability.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs" onClick={handleInstall} data-testid="button-pwa-install">
              Install
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleDismiss} data-testid="button-pwa-dismiss">
              Not now
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
