import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
const ACTIVITY_THROTTLE_MS = 60_000;
const WARNING_DURATION_MS = 2 * 60 * 1000;
const CHECK_INTERVAL_MS = 10_000;

export function SessionTimeoutDialog() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [extending, setExtending] = useState(false);

  const lastUserActivity = useRef(Date.now());
  const timeoutMs = useRef(30 * 60 * 1000);
  const warningShownAt = useRef<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const resetActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastUserActivity.current > ACTIVITY_THROTTLE_MS) {
      lastUserActivity.current = now;
    }
  }, []);

  const fetchSessionInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session-info", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        timeoutMs.current = data.timeoutMs;
      }
    } catch {}
  }, []);

  const extendSession = useCallback(async () => {
    setExtending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/keep-alive");
      if (res.ok) {
        lastUserActivity.current = Date.now();
        warningShownAt.current = null;
        setShowWarning(false);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = undefined;
        }
      }
    } catch {}
    setExtending(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = undefined;
    }
    try {
      await logout();
    } catch {
      window.location.replace("/login");
    }
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    fetchSessionInfo();

    ACTIVITY_EVENTS.forEach((evt) => document.addEventListener(evt, resetActivity, { passive: true }));

    checkIntervalRef.current = setInterval(() => {
      const idle = Date.now() - lastUserActivity.current;
      const threshold = timeoutMs.current - WARNING_DURATION_MS;

      if (idle >= threshold && !warningShownAt.current) {
        warningShownAt.current = Date.now();
        const remaining = Math.max(0, timeoutMs.current - idle);
        setSecondsLeft(Math.ceil(remaining / 1000));
        setShowWarning(true);

        countdownRef.current = setInterval(() => {
          const now = Date.now();
          const elapsed = now - lastUserActivity.current;
          const left = Math.max(0, Math.ceil((timeoutMs.current - elapsed) / 1000));
          setSecondsLeft(left);

          if (left <= 0) {
            setShowWarning(false);
            handleLogout();
          }
        }, 1000);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => document.removeEventListener(evt, resetActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, resetActivity, fetchSessionInfo, handleLogout]);

  if (!user || !showWarning) return null;

  const progress = Math.max(0, (secondsLeft / 120) * 100);
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. For security, you will be automatically logged out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
            <span className="text-3xl font-mono font-bold tabular-nums" data-testid="text-timeout-countdown">
              {minutes}:{secs.toString().padStart(2, "0")}
            </span>
          </div>

          <Progress
            value={progress}
            className="h-2"
            data-testid="progress-timeout"
          />

          <p className="text-xs text-center text-muted-foreground">
            {secondsLeft <= 30
              ? "You will be logged out very soon. Click below to stay."
              : "Click 'Stay Logged In' to continue your session."}
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-timeout-logout"
          >
            Log Out Now
          </Button>
          <Button
            onClick={extendSession}
            disabled={extending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="button-stay-logged-in"
          >
            {extending ? "Extending..." : "Stay Logged In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
