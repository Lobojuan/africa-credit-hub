import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Eye, X } from "lucide-react";
import { useState } from "react";

export function DemoBanner() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
  });

  const [dismissed, setDismissed] = useState(false);

  if (!user?.isDemo || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center py-1.5 px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex items-center gap-2 bg-amber-500 text-amber-950 text-xs font-medium px-4 py-1.5 rounded-b-lg shadow-lg"
        style={{ pointerEvents: "auto" }}
        data-testid="demo-banner"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Demo Mode — Isolated sandbox with sample data. All changes are blocked.</span>
        <button onClick={() => setDismissed(true)} className="ml-2 p-0.5 rounded hover:bg-amber-600/30">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
