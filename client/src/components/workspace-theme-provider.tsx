import { type ReactNode } from "react";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/**
 * Wraps the authenticated app's main content with a `data-workspace` attribute so
 * per-workspace CSS-variable overrides defined in `index.css` can scope the brand
 * accent colours (primary, ring, sidebar accent) without disturbing the country-level
 * theme injected by `CountryThemeProvider` on `:root`.
 */
export function WorkspaceThemeProvider({ children }: { children: ReactNode }) {
  const { workspaceId } = useActiveWorkspace();
  return (
    <div data-workspace={workspaceId} className="contents" data-testid={`workspace-scope-${workspaceId}`}>
      {children}
    </div>
  );
}

export default WorkspaceThemeProvider;
