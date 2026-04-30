import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { WORKSPACES, WORKSPACE_ORDER, workspacesForRole, type WorkspaceId } from "@/lib/workspaces";

interface WorkspaceSwitcherProps {
  /** "compact" = pill (header). "full" = full-width tile (sidebar). */
  variant?: "compact" | "full";
}

export function WorkspaceSwitcher({ variant = "compact" }: WorkspaceSwitcherProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { workspace, workspaceId, setWorkspace } = useActiveWorkspace();
  const accessible = new Set(workspacesForRole(user?.role, (user as any)?.allowedProducts).map((w) => w.id));
  const Icon = workspace.icon;

  const choose = (id: WorkspaceId) => {
    const target = WORKSPACES[id];
    setWorkspace(id);
    setLocation(target.landing);
  };

  if (variant === "full") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-left transition hover:bg-sidebar-accent/70 focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
            data-testid="button-workspace-switcher-full"
            aria-label={`Active workspace: ${workspace.label}`}
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${workspace.accentFrom}, ${workspace.accentTo})` }}
              aria-hidden
            >
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">Workspace</div>
              <div className="text-sm font-bold text-sidebar-foreground truncate" data-testid="text-active-workspace">
                {workspace.label}
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/50 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Switch workspace
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {WORKSPACE_ORDER.filter((id) => accessible.has(id)).map((id) => {
            const w = WORKSPACES[id];
            const WIcon = w.icon;
            const isActive = id === workspaceId;
            return (
              <DropdownMenuItem
                key={id}
                onSelect={() => choose(id)}
                className="gap-3 py-2.5 cursor-pointer"
                data-testid={`menuitem-workspace-${id}`}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${w.accentFrom}, ${w.accentTo})` }}
                  aria-hidden
                >
                  <WIcon className="w-4 h-4" />
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate">{w.label}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{w.description}</span>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // compact (header pill)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 px-2.5"
          data-testid="button-workspace-switcher"
          title={t("platform.switchProduct", "Switch workspace")}
        >
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${workspace.accentFrom}, ${workspace.accentTo})` }}
            aria-hidden
          >
            <Icon className="w-3 h-3" />
          </span>
          <span className="hidden sm:inline text-sm font-semibold truncate max-w-[120px]" data-testid="text-active-workspace-compact">
            {workspace.shortLabel}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WORKSPACE_ORDER.filter((id) => accessible.has(id)).map((id) => {
          const w = WORKSPACES[id];
          const WIcon = w.icon;
          const isActive = id === workspaceId;
          return (
            <DropdownMenuItem
              key={id}
              onSelect={() => choose(id)}
              className="gap-3 py-2.5 cursor-pointer"
              data-testid={`menuitem-workspace-compact-${id}`}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${w.accentFrom}, ${w.accentTo})` }}
                aria-hidden
              >
                <WIcon className="w-4 h-4" />
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{w.label}</span>
                <span className="text-[11px] text-muted-foreground truncate">{w.description}</span>
              </div>
              {isActive && <Check className="w-4 h-4 text-emerald-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WorkspaceSwitcher;
