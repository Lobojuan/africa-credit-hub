import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Clock, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export function TrialBanner() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
  });

  const [dismissed, setDismissed] = useState(false);
  const [, navigate] = useLocation();

  const isTrial = user?.organization?.subscriptionTier === "trial";
  const role = user?.role;
  if (!isTrial || dismissed) return null;
  if (role === "admin" || role === "super_admin") return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center py-1.5 px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex items-center gap-2 bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-b-lg shadow-lg"
        style={{ pointerEvents: "auto" }}
        data-testid="trial-banner"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Free Trial — Explore the full platform. Upgrade anytime to continue.</span>
        <button
          onClick={() => navigate("/upgrade")}
          className="ml-1 flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-2 py-0.5 transition-colors"
          data-testid="button-trial-upgrade"
        >
          Upgrade <ArrowRight className="w-3 h-3" />
        </button>
        <button onClick={() => setDismissed(true)} className="ml-1 p-0.5 rounded hover:bg-white/20">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
