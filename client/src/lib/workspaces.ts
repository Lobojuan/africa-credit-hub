import { CreditCard, Package, Ticket, LayoutGrid, type LucideIcon } from "lucide-react";
import { PRODUCT_REGISTRY, type ProductId, getProductForPath } from "@/lib/products";

export type WorkspaceId = ProductId | "shared";

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Default landing route when the user enters this workspace. */
  landing: string;
  /** Brand colours (HSL space-separated, no `hsl()` wrapper) used by the data-workspace CSS overrides. */
  primary: string;
  primaryFg: string;
  ring: string;
  sidebarPrimary: string;
  /** Gradient stops for switcher tile / chip. */
  accentFrom: string;
  accentTo: string;
  /** Roles this workspace is open to (used by the switcher). undefined = any logged-in user. */
  allowedRoles?: string[];
  /** Path prefixes that imply "I am inside this workspace" — used to derive the active workspace from the URL. */
  routePrefixes: string[];
}

const ALL_LOGGED_IN_ROLES = [
  "super_admin", "admin", "regulator", "lender", "viewer",
  "consumer", "tax_auditor", "registry_authority", "loan_officer", "underwriter",
];

const SHARED_ROUTE_PREFIXES = [
  "/audit",
  "/data-sharing",
  "/pending-requests",
  "/pending-approvals",
  "/command-center",
  "/users",
  "/organizations",
  "/billing",
  "/api-keys",
  "/api-admin",
  "/system-status",
  "/training",
  "/notifications",
  "/profile",
  "/settings",
  "/backup-recovery",
  "/platform-metrics",
];

export const WORKSPACES: Record<WorkspaceId, WorkspaceDefinition> = {
  credit: {
    id: "credit",
    label: "Credit Bureau",
    shortLabel: "Credit",
    description: "Score, report, and monitor borrowers across the continent.",
    icon: CreditCard,
    landing: PRODUCT_REGISTRY.credit.primaryAuthRoute,
    primary: "215 75% 45%",
    primaryFg: "0 0% 100%",
    ring: "215 75% 45%",
    sidebarPrimary: "215 75% 55%",
    accentFrom: PRODUCT_REGISTRY.credit.accentFrom,
    accentTo: PRODUCT_REGISTRY.credit.accentTo,
    allowedRoles: ALL_LOGGED_IN_ROLES,
    routePrefixes: PRODUCT_REGISTRY.credit.insideRoutePrefixes,
  },
  collateral: {
    id: "collateral",
    label: "Collateral Registry",
    shortLabel: "Collateral",
    description: "Register pledged assets and search liens with PMSI priority.",
    icon: Package,
    landing: PRODUCT_REGISTRY.collateral.primaryAuthRoute,
    primary: "32 85% 45%",
    primaryFg: "0 0% 100%",
    ring: "32 85% 45%",
    sidebarPrimary: "38 90% 55%",
    accentFrom: PRODUCT_REGISTRY.collateral.accentFrom,
    accentTo: PRODUCT_REGISTRY.collateral.accentTo,
    allowedRoles: ALL_LOGGED_IN_ROLES,
    routePrefixes: PRODUCT_REGISTRY.collateral.insideRoutePrefixes,
  },
  loto: {
    id: "loto",
    label: "Loto Fiscal",
    shortLabel: "Loto",
    description: "VAT receipts that build credit and prove spending capacity.",
    icon: Ticket,
    landing: PRODUCT_REGISTRY.loto.primaryAuthRoute,
    primary: "142 60% 35%",
    primaryFg: "0 0% 100%",
    ring: "142 60% 35%",
    sidebarPrimary: "142 65% 45%",
    accentFrom: PRODUCT_REGISTRY.loto.accentFrom,
    accentTo: PRODUCT_REGISTRY.loto.accentTo,
    allowedRoles: PRODUCT_REGISTRY.loto.allowedRoles,
    routePrefixes: PRODUCT_REGISTRY.loto.insideRoutePrefixes,
  },
  shared: {
    id: "shared",
    label: "Shared Tools",
    shortLabel: "Shared",
    description: "Cross-workspace tools — audit trail, data sharing, admin.",
    icon: LayoutGrid,
    landing: "/data-sharing",
    primary: "220 14% 32%",
    primaryFg: "0 0% 100%",
    ring: "220 14% 32%",
    sidebarPrimary: "220 14% 50%",
    accentFrom: "hsl(220 14% 40%)",
    accentTo: "hsl(220 14% 25%)",
    allowedRoles: ALL_LOGGED_IN_ROLES,
    routePrefixes: SHARED_ROUTE_PREFIXES,
  },
};

export const WORKSPACE_ORDER: WorkspaceId[] = ["credit", "collateral", "loto", "shared"];

export function isSharedPath(path: string): boolean {
  return SHARED_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

/** Derive the active workspace from the current pathname (URL is the source of truth when present). */
export function workspaceForPath(path: string): WorkspaceId | null {
  if (isSharedPath(path)) return "shared";
  const product = getProductForPath(path);
  if (product) return product.id;
  return null;
}

export function workspacesForRole(role?: string, allowedProducts?: string[] | null): WorkspaceDefinition[] {
  return WORKSPACE_ORDER
    .map((id) => WORKSPACES[id])
    .filter((w) => !w.allowedRoles || !role || w.allowedRoles.includes(role))
    .filter((w) => {
      // If the user has no product restriction, show everything.
      if (!allowedProducts || allowedProducts.length === 0) return true;
      // Restricted users: only show the workspaces matching their allowed products.
      // "shared" tools are hidden too — keeps the UI focused on credit only.
      return allowedProducts.includes(w.id);
    });
}
