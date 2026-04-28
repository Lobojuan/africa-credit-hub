import {
  CreditCard, Package, Ticket, type LucideIcon,
} from "lucide-react";
import { PLATFORM_COMPANY_NAME } from "@/lib/platform-config";

export type ProductId = "credit" | "collateral" | "loto";
export type ProductStatus = "live" | "pilot" | "scaffold";

export interface ProductDefinition {
  id: ProductId;
  /** Brand label key in i18n (under `products.<id>.name`) */
  nameKey: string;
  /** Hard-coded English brand label (fallback when i18n not loaded yet, e.g. SSR / index.html title) */
  englishName: string;
  /** Short tagline key */
  taglineKey: string;
  englishTagline: string;
  /** One-liner description key */
  descKey: string;
  englishDesc: string;
  routePrefix: string;       // e.g. "/credit"
  publicLanding: string;     // public marketing landing URL ("/credit")
  primaryAuthRoute: string;  // where the chooser sends the user after selection
  status: ProductStatus;
  badgeKey?: string;
  englishBadge?: string;
  icon: LucideIcon;
  /** Tailwind / inline-style accent (used by chooser cards, switcher dot) */
  accentFrom: string;
  accentTo: string;
  accentText: string;
  /** RBAC: roles allowed to enter this product workspace */
  allowedRoles: string[];
  /** Authenticated route prefixes considered "inside" this product */
  insideRoutePrefixes: string[];
}

const ALL_LOGGED_IN = [
  "super_admin", "admin", "regulator", "lender", "viewer",
  "consumer", "tax_auditor", "registry_authority",
];

export const PRODUCT_REGISTRY: Record<ProductId, ProductDefinition> = {
  credit: {
    id: "credit",
    nameKey: "products.credit.name",
    englishName: "Credit Bureau",
    taglineKey: "products.credit.tagline",
    englishTagline: "Comprehensive consumer & business credit intelligence",
    descKey: "products.credit.desc",
    englishDesc:
      "Score, monitor and report on every borrower across the continent. Pan-African credit reports, AI-driven portfolio intelligence, and full regulator exports.",
    routePrefix: "/credit",
    publicLanding: "/credit",
    primaryAuthRoute: "/dashboard",
    status: "live",
    icon: CreditCard,
    accentFrom: "hsl(215 75% 50%)",
    accentTo: "hsl(265 60% 50%)",
    accentText: "hsl(215 70% 38%)",
    allowedRoles: ALL_LOGGED_IN,
    insideRoutePrefixes: [
      "/dashboard", "/borrowers", "/consumers", "/businesses", "/credit-accounts",
      "/search", "/reports", "/credit-report", "/business-credit-report",
      "/disputes", "/approvals", "/find-connections", "/collections",
      "/portfolio-intelligence", "/portfolio-triggers", "/ai-command-center",
      "/telco-scoring", "/telco-lending", "/loan-origination",
      "/regulatory-dashboard", "/regulatory-compliance", "/audit",
      "/dishonoured-cheques", "/court-judgments",
      "/credit-score-methodology", "/score-guide", "/batch-upload",
      "/borrower-alerts", "/consent",
      "/cross-border-agreements", "/cross-border-search", "/papss-settlements",
      "/bog-export", "/bsl-export", "/cbk-export", "/cbn-export",
      "/institution-analytics", "/institution-branding",
    ],
  },
  collateral: {
    id: "collateral",
    nameKey: "products.collateral.name",
    englishName: "Collateral Registry",
    taglineKey: "products.collateral.tagline",
    englishTagline: "Pan-African pledged-asset registry with PMSI priority",
    descKey: "products.collateral.desc",
    englishDesc:
      "Register pledged assets, search liens by borrower, and issue tamper-evident certificates with QR verification — built on a PPSR-style notice filing model.",
    routePrefix: "/collateral",
    publicLanding: "/collateral",
    primaryAuthRoute: "/collateral-registry",
    status: "live",
    icon: Package,
    accentFrom: "hsl(38 90% 52%)",
    accentTo: "hsl(28 85% 45%)",
    accentText: "hsl(32 75% 38%)",
    allowedRoles: ALL_LOGGED_IN,
    insideRoutePrefixes: ["/collateral-registry", "/registry-authority-portal", "/verify"],
  },
  loto: {
    id: "loto",
    nameKey: "products.loto.name",
    englishName: "Loto Fiscal",
    taglineKey: "products.loto.tagline",
    englishTagline: "VAT receipt lottery — turn every receipt into a chance to win",
    descKey: "products.loto.desc",
    englishDesc:
      "A revenue-mobilisation pilot: citizens scan their VAT receipts, weekly draws reward compliant retailers, and the tax authority gains real-time receipt visibility.",
    routePrefix: "/loto",
    publicLanding: "/loto",
    primaryAuthRoute: "/loto-fiscal",
    status: "scaffold",
    badgeKey: "products.loto.badge",
    englishBadge: "Pilot launching Q3 2026",
    icon: Ticket,
    accentFrom: "hsl(142 65% 42%)",
    accentTo: "hsl(28 85% 50%)",
    accentText: "hsl(142 60% 30%)",
    allowedRoles: ["super_admin", "admin", "regulator", "tax_auditor"],
    insideRoutePrefixes: ["/loto", "/loto-fiscal"],
  },
};

export const PRODUCT_ORDER: ProductId[] = ["credit", "collateral", "loto"];

export const ACTIVE_PRODUCT_STORAGE_KEY = "ach_active_product";

/** Return the product definition whose insideRoutePrefixes contain the given path, or null. */
export function getProductForPath(path: string): ProductDefinition | null {
  for (const id of PRODUCT_ORDER) {
    const p = PRODUCT_REGISTRY[id];
    if (p.insideRoutePrefixes.some(prefix => path === prefix || path.startsWith(prefix + "/"))) {
      return p;
    }
    if (path === p.publicLanding || path.startsWith(p.routePrefix + "/")) {
      return p;
    }
  }
  return null;
}

/** Read the user's currently selected product (set by the chooser / switcher). */
export function readActiveProduct(): ProductId {
  if (typeof window === "undefined") return "credit";
  const stored = window.localStorage.getItem(ACTIVE_PRODUCT_STORAGE_KEY);
  if (stored && (stored === "credit" || stored === "collateral" || stored === "loto")) {
    return stored;
  }
  return "credit";
}

export function writeActiveProduct(id: ProductId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_PRODUCT_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("ach:active-product-changed", { detail: id }));
  }
}

/** What products is this user allowed to enter? */
export function getAccessibleProducts(role?: string): ProductDefinition[] {
  if (!role) return [PRODUCT_REGISTRY.credit];
  return PRODUCT_ORDER
    .map(id => PRODUCT_REGISTRY[id])
    .filter(p => p.allowedRoles.includes(role));
}

/** Centralised parent brand label (single source of truth — i18n key + constant). */
export function getPlatformBrandName(): string {
  return PLATFORM_COMPANY_NAME;
}
