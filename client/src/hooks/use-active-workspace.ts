import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ACTIVE_PRODUCT_STORAGE_KEY,
  readActiveProduct,
  writeActiveProduct,
  type ProductId,
} from "@/lib/products";
import {
  WORKSPACES,
  workspaceForPath,
  type WorkspaceId,
  type WorkspaceDefinition,
} from "@/lib/workspaces";

const WORKSPACE_STORAGE_KEY = "ach_active_workspace";

function readStoredWorkspace(): WorkspaceId | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (stored === "credit" || stored === "collateral" || stored === "loto" || stored === "shared") {
    return stored;
  }
  return null;
}

function writeStoredWorkspace(id: WorkspaceId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
  // Keep the legacy product key in sync for the existing AppSidebar / ProductSwitcher consumers.
  if (id !== "shared") writeActiveProduct(id as ProductId);
  window.dispatchEvent(new CustomEvent<WorkspaceId>("ach:active-workspace-changed", { detail: id }));
}

function deriveInitial(path: string): WorkspaceId {
  const fromUrl = workspaceForPath(path);
  if (fromUrl) return fromUrl;
  const stored = readStoredWorkspace();
  if (stored) return stored;
  return readActiveProduct() as WorkspaceId;
}

export function useActiveWorkspace(): {
  workspace: WorkspaceDefinition;
  workspaceId: WorkspaceId;
  setWorkspace: (id: WorkspaceId) => void;
} {
  const [location] = useLocation();
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>(() => deriveInitial(location));

  // Re-derive whenever the URL changes — the URL is the source of truth.
  useEffect(() => {
    const fromUrl = workspaceForPath(location);
    if (fromUrl && fromUrl !== workspaceId) {
      setWorkspaceId(fromUrl);
      writeStoredWorkspace(fromUrl);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-tab + intra-app sync.
  useEffect(() => {
    const onWorkspaceChanged = (e: Event) => {
      const id = (e as CustomEvent<WorkspaceId>).detail;
      if (id) setWorkspaceId(id);
    };
    const onProductChanged = (e: Event) => {
      const id = (e as CustomEvent<ProductId>).detail;
      if (id) setWorkspaceId(id as WorkspaceId);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === WORKSPACE_STORAGE_KEY && e.newValue) {
        setWorkspaceId(e.newValue as WorkspaceId);
      } else if (e.key === ACTIVE_PRODUCT_STORAGE_KEY && e.newValue) {
        setWorkspaceId(e.newValue as WorkspaceId);
      }
    };
    window.addEventListener("ach:active-workspace-changed", onWorkspaceChanged);
    window.addEventListener("ach:active-product-changed", onProductChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("ach:active-workspace-changed", onWorkspaceChanged);
      window.removeEventListener("ach:active-product-changed", onProductChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    workspace: WORKSPACES[workspaceId],
    workspaceId,
    setWorkspace: (id: WorkspaceId) => {
      setWorkspaceId(id);
      writeStoredWorkspace(id);
    },
  };
}

export { WORKSPACE_STORAGE_KEY };
