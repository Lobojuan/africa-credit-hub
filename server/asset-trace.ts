/**
 * Asset trace adapters for African vehicle and property registries.
 *
 * Live integrations activate automatically when the relevant environment
 * variables are set. Without credentials the adapter falls back to a
 * deterministic stub (status='stub') so the full workflow (UI, audit, PDF)
 * remains usable.
 *
 * Credential environment variables per registry:
 *
 *   Ghana DVLA:          GHANA_DVLA_API_URL  + GHANA_DVLA_API_KEY
 *   South Africa NaTIS:  SA_NATIS_API_URL    + SA_NATIS_API_KEY
 *   Ghana Lands Comm.:   GHANA_LANDS_API_URL + GHANA_LANDS_API_KEY
 *   Kenya NTSA:          KENYA_NTSA_API_URL  + KENYA_NTSA_API_KEY
 *   Nigeria FRSC/MVAA:   NIGERIA_FRSC_API_URL + NIGERIA_FRSC_API_KEY
 *   Uganda URSB:         UGANDA_URSB_API_URL  + UGANDA_URSB_API_KEY
 *   Ethiopia MVAA:       ETHIOPIA_MVAA_API_URL + ETHIOPIA_MVAA_API_KEY
 *
 * Each registry endpoint must accept:
 *   POST {url}/lookup  with JSON { reference: string, apiKey: string }
 * and return:
 *   { found: boolean, description?: string, estimatedValue?: number,
 *     currency?: string, data?: Record<string,any> }
 */

import crypto from "crypto";
import { db } from "./db";
import { assetTraceRecords, type AssetTraceRecord } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export type AssetProvider =
  | "ghana_dvla"
  | "sa_natis"
  | "ghana_lands"
  | "kenya_ntsa"
  | "nigeria_frsc"
  | "uganda_ursb_motor"
  | "ethiopia_motor"
  | "liberia_motor"
  | "manual";

export interface AssetTraceRequest {
  borrowerId: string;
  provider: AssetProvider;
  reference?: string;
  requestedBy?: string;
  organizationId?: string | null;
  country?: string | null;
}

export interface AssetTraceResult {
  status: "found" | "not_found" | "error" | "stub";
  assetType: "vehicle" | "property" | "watercraft" | "aircraft";
  description: string | null;
  estimatedValue: number | null;
  currency: string | null;
  rawResponse: Record<string, any>;
}

/** Returns { url, key } if both env vars are set for the given registry, else null. */
function registryCredentials(urlVar: string, keyVar: string): { url: string; key: string } | null {
  const url = process.env[urlVar];
  const key = process.env[keyVar];
  if (url && key) return { url, key };
  return null;
}

/** Return a status object for each registry showing live vs stub. */
export function registryStatus(): Record<AssetProvider, { live: boolean; url?: string }> {
  const check = (urlVar: string, keyVar: string) => {
    const creds = registryCredentials(urlVar, keyVar);
    return creds ? { live: true, url: creds.url } : { live: false };
  };
  return {
    ghana_dvla:       check("GHANA_DVLA_API_URL",    "GHANA_DVLA_API_KEY"),
    sa_natis:         check("SA_NATIS_API_URL",       "SA_NATIS_API_KEY"),
    ghana_lands:      check("GHANA_LANDS_API_URL",    "GHANA_LANDS_API_KEY"),
    kenya_ntsa:       check("KENYA_NTSA_API_URL",     "KENYA_NTSA_API_KEY"),
    nigeria_frsc:     check("NIGERIA_FRSC_API_URL",   "NIGERIA_FRSC_API_KEY"),
    uganda_ursb_motor:check("UGANDA_URSB_API_URL",    "UGANDA_URSB_API_KEY"),
    ethiopia_motor:   check("ETHIOPIA_MVAA_API_URL",  "ETHIOPIA_MVAA_API_KEY"),
    liberia_motor:    { live: false },
    manual:           { live: false },
  };
}

// ---------------------------------------------------------------------------
// Live HTTP adapter
// ---------------------------------------------------------------------------

interface LiveRegistryResponse {
  found: boolean;
  description?: string;
  estimatedValue?: number;
  currency?: string;
  data?: Record<string, any>;
}

async function callLiveRegistry(
  url: string,
  key: string,
  reference: string,
  provider: AssetProvider,
  timeoutMs = 8000,
): Promise<LiveRegistryResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": key,
        "User-Agent": "AfricaCreditHub/2.5",
      },
      body: JSON.stringify({ reference, provider }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Registry returned ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as LiveRegistryResponse;
    return json;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Stub helpers (deterministic, for use when credentials are absent)
// ---------------------------------------------------------------------------

function deterministicNumber(seed: string, max: number): number {
  const h = crypto.createHash("sha256").update(seed).digest();
  return h.readUInt32BE(0) % max;
}

function stubVehicle(
  req: AssetTraceRequest,
  currency: string,
  makes: string[],
  valueBase: number,
  valueRange: number,
  providerNote: string,
): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { error: "Reference required" } };
  }
  const ref = req.reference.toUpperCase().replace(/\s+/g, "");
  const make = makes[deterministicNumber(ref + "m", makes.length)];
  const year = 2008 + deterministicNumber(ref + "y", 16);
  const value = valueBase + deterministicNumber(ref, valueRange);
  return {
    status: "stub",
    assetType: "vehicle",
    description: `${make} ${year} (Ref: ${ref})`,
    estimatedValue: value,
    currency,
    rawResponse: { provider: req.provider, reference: ref, make, year, note: providerNote },
  };
}

function stubProperty(
  req: AssetTraceRequest,
  currency: string,
  valueBase: number,
  valueRange: number,
  providerNote: string,
): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "property", description: null, estimatedValue: null, currency: null, rawResponse: { error: "Title/Reference required" } };
  }
  const ref = req.reference.toUpperCase().replace(/\s+/g, "");
  const types = ["Residential plot", "Commercial property", "Apartment unit", "Agricultural land"];
  const type = types[deterministicNumber(ref, types.length)];
  const value = valueBase + deterministicNumber(ref + "v", valueRange);
  return {
    status: "stub",
    assetType: "property",
    description: `${type} (Title: ${ref})`,
    estimatedValue: value,
    currency,
    rawResponse: { provider: req.provider, reference: ref, type, note: providerNote },
  };
}

// ---------------------------------------------------------------------------
// Per-registry adapter: live-first, stub fallback
// ---------------------------------------------------------------------------

type AdapterFn = (req: AssetTraceRequest) => Promise<AssetTraceResult>;

async function adapterGhanaDvla(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("GHANA_DVLA_API_URL", "GHANA_DVLA_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "GHS",
        rawResponse: { provider: "ghana_dvla", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Ghana DVLA live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "ghana_dvla", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "GHS",
    ["Toyota Vitz", "Honda Civic", "Nissan Sentra", "Hyundai Accent", "Toyota Hilux", "Ford Ranger", "Kia Rio"],
    25000, 250000,
    "STUB — set GHANA_DVLA_API_URL + GHANA_DVLA_API_KEY to enable live DVLA lookups",
  );
}

async function adapterSaNatis(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("SA_NATIS_API_URL", "SA_NATIS_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "ZAR",
        rawResponse: { provider: "sa_natis", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] SA NaTIS live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "sa_natis", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "ZAR",
    ["Toyota Corolla", "VW Polo", "Ford Fiesta", "BMW 3 Series", "Toyota Fortuner", "Hyundai i20"],
    80000, 600000,
    "STUB — set SA_NATIS_API_URL + SA_NATIS_API_KEY to enable live eNaTIS lookups",
  );
}

async function adapterGhanaLands(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("GHANA_LANDS_API_URL", "GHANA_LANDS_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "property",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "GHS",
        rawResponse: { provider: "ghana_lands", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Ghana Lands live call failed:", err.message);
      return { status: "error", assetType: "property", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "ghana_lands", source: "live", error: err.message } };
    }
  }
  return stubProperty(req, "GHS", 150000, 850000,
    "STUB — set GHANA_LANDS_API_URL + GHANA_LANDS_API_KEY to enable live Lands Commission lookups",
  );
}

async function adapterKenyaNtsa(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("KENYA_NTSA_API_URL", "KENYA_NTSA_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "KES",
        rawResponse: { provider: "kenya_ntsa", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Kenya NTSA live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "kenya_ntsa", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "KES",
    ["Toyota Probox", "Nissan Note", "Subaru Forester", "Toyota Land Cruiser", "Isuzu D-Max"],
    500000, 5000000,
    "STUB — set KENYA_NTSA_API_URL + KENYA_NTSA_API_KEY to enable live NTSA lookups",
  );
}

async function adapterNigeriaFrsc(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("NIGERIA_FRSC_API_URL", "NIGERIA_FRSC_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "NGN",
        rawResponse: { provider: "nigeria_frsc", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Nigeria FRSC live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "nigeria_frsc", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "NGN",
    ["Toyota Camry", "Honda Accord", "Lexus RX", "Toyota Highlander", "Kia Sportage"],
    3000000, 30000000,
    "STUB — set NIGERIA_FRSC_API_URL + NIGERIA_FRSC_API_KEY to enable live FRSC/MVAA lookups",
  );
}

async function adapterUgandaUrsb(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("UGANDA_URSB_API_URL", "UGANDA_URSB_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "UGX",
        rawResponse: { provider: "uganda_ursb_motor", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Uganda URSB live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "uganda_ursb_motor", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "UGX",
    ["Toyota Noah", "Toyota Hiace", "Nissan Patrol", "Toyota Corolla"],
    20000000, 200000000,
    "STUB — set UGANDA_URSB_API_URL + UGANDA_URSB_API_KEY to enable live URSB lookups",
  );
}

async function adapterEthiopiaMvaa(req: AssetTraceRequest): Promise<AssetTraceResult> {
  const creds = registryCredentials("ETHIOPIA_MVAA_API_URL", "ETHIOPIA_MVAA_API_KEY");
  if (creds && req.reference) {
    try {
      const live = await callLiveRegistry(creds.url, creds.key, req.reference, req.provider);
      return {
        status: live.found ? "found" : "not_found",
        assetType: "vehicle",
        description: live.description ?? null,
        estimatedValue: live.estimatedValue ?? null,
        currency: live.currency ?? "ETB",
        rawResponse: { provider: "ethiopia_motor", source: "live", ...live.data },
      };
    } catch (err: any) {
      console.error("[AssetTrace] Ethiopia MVAA live call failed:", err.message);
      return { status: "error", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { provider: "ethiopia_motor", source: "live", error: err.message } };
    }
  }
  return stubVehicle(req, "ETB",
    ["Toyota Land Cruiser", "Hyundai H-100", "Isuzu Forward", "Mitsubishi Fuso"],
    1500000, 10000000,
    "STUB — set ETHIOPIA_MVAA_API_URL + ETHIOPIA_MVAA_API_KEY to enable live MVAA lookups",
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const ADAPTERS: Partial<Record<AssetProvider, AdapterFn>> = {
  ghana_dvla:        adapterGhanaDvla,
  sa_natis:          adapterSaNatis,
  ghana_lands:       adapterGhanaLands,
  kenya_ntsa:        adapterKenyaNtsa,
  nigeria_frsc:      adapterNigeriaFrsc,
  uganda_ursb_motor: adapterUgandaUrsb,
  ethiopia_motor:    adapterEthiopiaMvaa,
  liberia_motor:     async (req) => stubVehicle(req, "LRD",
    ["Toyota Corolla", "Honda Accord", "Nissan Sentra"], 50000, 250000,
    "STUB — no live integration available for Liberia motor registry",
  ),
};

export async function executeAssetTrace(req: AssetTraceRequest): Promise<AssetTraceRecord> {
  let result: AssetTraceResult;
  try {
    const adapter = ADAPTERS[req.provider];
    if (adapter) {
      result = await adapter(req);
    } else {
      result = {
        status: "stub",
        assetType: "vehicle",
        description: req.reference ? `Manual entry: ${req.reference}` : null,
        estimatedValue: null,
        currency: null,
        rawResponse: { provider: req.provider, note: "Manual asset entry — no registry adapter" },
      };
    }
  } catch (e: any) {
    result = {
      status: "error",
      assetType: "vehicle",
      description: null,
      estimatedValue: null,
      currency: null,
      rawResponse: { error: e.message },
    };
  }

  const [created] = await db.insert(assetTraceRecords).values({
    borrowerId: req.borrowerId,
    assetType: result.assetType,
    provider: req.provider,
    reference: req.reference,
    description: result.description,
    estimatedValue: result.estimatedValue !== null ? String(result.estimatedValue) : undefined,
    currency: result.currency,
    status: result.status,
    rawResponse: result.rawResponse,
    requestedBy: req.requestedBy,
    organizationId: req.organizationId || undefined,
    country: req.country || undefined,
  }).returning();
  return created;
}

export async function getAssetTracesByBorrower(borrowerId: string): Promise<AssetTraceRecord[]> {
  return db.select().from(assetTraceRecords)
    .where(eq(assetTraceRecords.borrowerId, borrowerId))
    .orderBy(desc(assetTraceRecords.createdAt));
}
