import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Layers, LogOut, ShieldCheck, Share2, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";
import {
  WORKSPACES,
  WORKSPACE_ORDER,
  workspacesForRole,
  type WorkspaceDefinition,
  type WorkspaceId,
} from "@/lib/workspaces";
import { WORKSPACE_STORAGE_KEY } from "@/hooks/use-active-workspace";
import { writeActiveProduct, type ProductId } from "@/lib/products";

function readStoredWorkspace(): WorkspaceId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (v === "credit" || v === "collateral" || v === "loto" || v === "shared") return v;
  return null;
}

export default function ChooseWorkspacePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const brand = PLATFORM_COMPANY_NAME;

  const accessible = useMemo<WorkspaceDefinition[]>(
    () => workspacesForRole(user?.role, (user as any)?.allowedProducts),
    [user?.role, (user as any)?.allowedProducts],
  );
  const accessibleIds = useMemo(() => new Set(accessible.map((w) => w.id)), [accessible]);

  useEffect(() => {
    document.title = `Choose your workspace — ${brand}`;
  }, [brand]);

  // Auto-resume: if user already chose a workspace earlier, skip the chooser.
  useEffect(() => {
    if (!user) return;
    const stored = readStoredWorkspace();
    if (stored && accessibleIds.has(stored)) {
      const ws = WORKSPACES[stored];
      setLocation(ws.landing);
    }
  }, [user, accessibleIds, setLocation]);

  const choose = (ws: WorkspaceDefinition) => {
    if (!accessibleIds.has(ws.id)) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, ws.id);
      window.dispatchEvent(new CustomEvent<WorkspaceId>("ach:active-workspace-changed", { detail: ws.id }));
    }
    if (ws.id !== "shared") writeActiveProduct(ws.id as ProductId);
    setLocation(ws.landing);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-amber-500 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100" data-testid="text-brand">{brand}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Platform</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50" data-testid="text-welcome">
          Choose your workspace
          {user?.fullName ? <span className="text-slate-400">, {user.fullName.split(" ")[0]}</span> : null}
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300" data-testid="text-subtitle">
          Each workspace is sandboxed: its own data, sidebar, and accent colour. Cross-workspace data sharing requires explicit consent from the data owner.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKSPACE_ORDER.filter((id) => accessibleIds.has(id)).map((id) => {
            const ws = WORKSPACES[id];
            const Icon = ws.icon;
            return (
              <Card
                key={id}
                role="button"
                tabIndex={0}
                aria-label={`Open ${ws.label}`}
                className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover-elevate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => choose(ws)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(ws);
                  }
                }}
                data-testid={`card-workspace-${id}`}
              >
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${ws.accentFrom}, ${ws.accentTo})` }} />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${ws.accentFrom}, ${ws.accentTo})` }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1" data-testid={`text-workspace-name-${id}`}>
                    {ws.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1" data-testid={`text-workspace-desc-${id}`}>
                    {ws.description}
                  </p>
                  <div className="mt-5">
                    <Button
                      className="gap-2 text-white w-full justify-center"
                      style={{ background: `linear-gradient(135deg, ${ws.accentFrom}, ${ws.accentTo})` }}
                      onClick={(e) => { e.stopPropagation(); choose(ws); }}
                      data-testid={`button-open-${id}`}
                    >
                      Open {ws.shortLabel}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-center" data-testid="text-cross-workspace-label">
            Cross-workspace tools
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/audit">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-cross-audit">
                <ShieldCheck className="w-4 h-4" />
                Audit Trail
              </Button>
            </Link>
            <Link href="/data-sharing">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-cross-data-sharing">
                <Share2 className="w-4 h-4" />
                Data Sharing
              </Button>
            </Link>
            <Link href="/pending-approvals">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-cross-pending">
                <Inbox className="w-4 h-4" />
                Pending Requests
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400" data-testid="text-tip">
          You can switch workspaces anytime from the top of the sidebar.
        </p>
      </section>
    </div>
  );
}
