/**
 * Asset trace adapters for African vehicle and property registries.
 *
 * Live integrations activate automatically when the relevant environment
 * variables are set. Without credentials the adapter falls back to a
 * deterministic stub (status='stub') so the full workflow (UI, audit, PDF)
 * remains usable.
 *
 * Credential environment variables per registry (static API key mode):
 *
 *   Ghana DVLA:          GHANA_DVLA_API_URL  + GHANA_DVLA_API_KEY
 *   South Africa NaTIS:  SA_NATIS_API_URL    + SA_NATIS_API_KEY
 *   Ghana Lands Comm.:   GHANA_LANDS_API_URL + GHANA_LANDS_API_KEY
 *   Kenya NTSA:          KENYA_NTSA_API_URL  + KENYA_NTSA_API_KEY
 *   Nigeria FRSC/MVAA:   NIGERIA_FRSC_API_URL + NIGERIA_FRSC_API_KEY
 *   Uganda URSB:         UGANDA_URSB_API_URL  + UGANDA_URSB_API_KEY
 *   Ethiopia MVAA:       ETHIOPIA_MVAA_API_URL + ETHIOPIA_MVAA_API_KEY
 *
 * OAuth 2.0 client credentials mode (alternative to static API key):
 * Set the following three variables for a registry to enable OAuth.
 * When OAuth vars are present they take priority over the API key variable.
 *
 *   Ghana DVLA:          GHANA_DVLA_TOKEN_URL  + GHANA_DVLA_CLIENT_ID  + GHANA_DVLA_CLIENT_SECRET
 *   South Africa NaTIS:  SA_NATIS_TOKEN_URL    + SA_NATIS_CLIENT_ID    + SA_NATIS_CLIENT_SECRET
 *   Ghana Lands Comm.:   GHANA_LANDS_TOKEN_URL + GHANA_LANDS_CLIENT_ID + GHANA_LANDS_CLIENT_SECRET
 *   Kenya NTSA:          KENYA_NTSA_TOKEN_URL  + KENYA_NTSA_CLIENT_ID  + KENYA_NTSA_CLIENT_SECRET
 *   Nigeria FRSC/MVAA:   NIGERIA_FRSC_TOKEN_URL + NIGERIA_FRSC_CLIENT_ID + NIGERIA_FRSC_CLIENT_SECRET
 *   Uganda URSB:         UGANDA_URSB_TOKEN_URL  + UGANDA_URSB_CLIENT_ID  + UGANDA_URSB_CLIENT_SECRET
 *   Ethiopia MVAA:       ETHIOPIA_MVAA_TOKEN_URL + ETHIOPIA_MVAA_CLIENT_ID + ETHIOPIA_MVAA_CLIENT_SECRET
 *
 * Each registry endpoint must accept:
 *   POST {url}/lookup  with JSON { reference: string, provider: string }
 * and return:
 *   { found: boolean, description?: string, estimatedValue?: number,
 *     currency?: string, data?: Record<string,any> }
 */

import crypto from "crypto";
import { db } from "./db";
import { assetTraceRecords, registryCredentials as registryCredentialsTable, type AssetTraceRecord } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { decryptPII } from "./encryption";

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

/** In-memory override cache: provider -> { url, key } loaded from DB */
const _credOverrides = new Map<string, { url: string; key: string }>();

// ---------------------------------------------------------------------------
// OAuth 2.0 client credentials support
// ---------------------------------------------------------------------------

interface OAuthConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/** In-memory OAuth token cache: provider -> cached bearer token */
const _oauthTokenCache = new Map<string, CachedToken>();

/** OAuth env var names per provider. Set all three to enable OAuth for a registry. */
const OAUTH_ENV_MAP: Partial<Record<AssetProvider, {
  tokenUrlVar: string;
  clientIdVar: string;
  clientSecretVar: string;
}>> = {
  ghana_dvla:        { tokenUrlVar: "GHANA_DVLA_TOKEN_URL",    clientIdVar: "GHANA_DVLA_CLIENT_ID",    clientSecretVar: "GHANA_DVLA_CLIENT_SECRET" },
  sa_natis:          { tokenUrlVar: "SA_NATIS_TOKEN_URL",       clientIdVar: "SA_NATIS_CLIENT_ID",       clientSecretVar: "SA_NATIS_CLIENT_SECRET" },
  ghana_lands:       { tokenUrlVar: "GHANA_LANDS_TOKEN_URL",    clientIdVar: "GHANA_LANDS_CLIENT_ID",    clientSecretVar: "GHANA_LANDS_CLIENT_SECRET" },
  kenya_ntsa:        { tokenUrlVar: "KENYA_NTSA_TOKEN_URL",     clientIdVar: "KENYA_NTSA_CLIENT_ID",     clientSecretVar: "KENYA_NTSA_CLIENT_SECRET" },
  nigeria_frsc:      { tokenUrlVar: "NIGERIA_FRSC_TOKEN_URL",   clientIdVar: "NIGERIA_FRSC_CLIENT_ID",   clientSecretVar: "NIGERIA_FRSC_CLIENT_SECRET" },
  uganda_ursb_motor: { tokenUrlVar: "UGANDA_URSB_TOKEN_URL",    clientIdVar: "UGANDA_URSB_CLIENT_ID",    clientSecretVar: "UGANDA_URSB_CLIENT_SECRET" },
  ethiopia_motor:    { tokenUrlVar: "ETHIOPIA_MVAA_TOKEN_URL",  clientIdVar: "ETHIOPIA_MVAA_CLIENT_ID",  clientSecretVar: "ETHIOPIA_MVAA_CLIENT_SECRET" },
};

/** Returns OAuth config for a provider if all three OAuth env vars are set, otherwise null. */
function oauthConfigForProvider(provider: string): OAuthConfig | null {
  const map = OAUTH_ENV_MAP[provider as AssetProvider];
  if (!map) return null;
  const tokenUrl = process.env[map.tokenUrlVar];
  const clientId = process.env[map.clientIdVar];
  const clientSecret = process.env[map.clientSecretVar];
  if (tokenUrl && clientId && clientSecret) return { tokenUrl, clientId, clientSecret };
  return null;
}

/**
 * Fetch (or return cached) an OAuth 2.0 bearer token for a registry using
 * the client credentials grant. Tokens are refreshed 60 seconds before expiry.
 */
async function getOAuthToken(provider: string, config: OAuthConfig): Promise<string> {
  const cached = _oauthTokenCache.get(provider);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OAuth token request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error(`OAuth token response for ${provider} did not include access_token`);
  }
  const expiresIn = data.expires_in ?? 3600;
  _oauthTokenCache.set(provider, {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  console.log(`[AssetTrace] OAuth token refreshed for ${provider}, expires in ${expiresIn}s`);
  return data.access_token;
}

/**
 * Resolve how to authenticate against a registry. Prefers OAuth if configured,
 * falls back to static API key. Returns null when the registry is not configured.
 * Throws if the URL is present but no auth method is available.
 */
async function resolveRegistryAuth(
  provider: string,
  urlVar: string,
  keyVar: string,
): Promise<{ url: string; bearerToken?: string; apiKey?: string } | null> {
  const override = _credOverrides.get(provider);
  const url = override?.url ?? process.env[urlVar];
  if (!url) return null;

  const oauth = oauthConfigForProvider(provider);
  if (oauth) {
    const bearerToken = await getOAuthToken(provider, oauth);
    return { url, bearerToken };
  }

  const apiKey = override?.key ?? process.env[keyVar];
  if (!apiKey) return null;
  return { url, apiKey };
}

/** Returns true when a registry has either OAuth or static-key credentials set. */
function isRegistryConfigured(provider: string, urlVar: string, keyVar: string): boolean {
  const override = _credOverrides.get(provider);
  const url = override?.url ?? process.env[urlVar];
  if (!url) return false;
  if (oauthConfigForProvider(provider)) return true;
  const apiKey = override?.key ?? process.env[keyVar];
  return !!apiKey;
}

/** Load all DB-stored credentials into the in-memory cache. Call on startup and after each save. */
export async function loadRegistryCredentialsFromDb(): Promise<void> {
  try {
    const rows = await db.select().from(registryCredentialsTable);
    _credOverrides.clear();
    for (const row of rows) {
      const decryptedKey = decryptPII(row.apiKeyEncrypted);
      _credOverrides.set(row.provider, { url: row.apiUrl, key: decryptedKey });
    }
  } catch (err: any) {
    console.error("[AssetTrace] Failed to load registry credentials from DB:", err.message);
  }
}

/** Set or clear an in-memory credential override for a provider. */
export function setRegistryCredentialOverride(provider: string, url: string, key: string): void {
  _credOverrides.set(provider, { url, key });
}

export function clearRegistryCredentialOverride(provider: string): void {
  _credOverrides.delete(provider);
}

/** Returns { url, key } checking DB overrides first, then env vars. */
function registryCredentials(provider: string, urlVar: string, keyVar: string): { url: string; key: string } | null {
  const override = _credOverrides.get(provider);
  if (override) return override;
  const url = process.env[urlVar];
  const key = process.env[keyVar];
  if (url && key) return { url, key };
  return null;
}

/** Providers that support live credential testing. */
export const TESTABLE_PROVIDERS: readonly AssetProvider[] = [
  "ghana_dvla", "sa_natis", "ghana_lands", "kenya_ntsa",
  "nigeria_frsc", "uganda_ursb_motor", "ethiopia_motor",
];

/** Map from provider ID to its URL/key env var names. */
const REGISTRY_ENV_MAP: Partial<Record<AssetProvider, { urlVar: string; keyVar: string }>> = {
  ghana_dvla:        { urlVar: "GHANA_DVLA_API_URL",    keyVar: "GHANA_DVLA_API_KEY" },
  sa_natis:          { urlVar: "SA_NATIS_API_URL",       keyVar: "SA_NATIS_API_KEY" },
  ghana_lands:       { urlVar: "GHANA_LANDS_API_URL",    keyVar: "GHANA_LANDS_API_KEY" },
  kenya_ntsa:        { urlVar: "KENYA_NTSA_API_URL",     keyVar: "KENYA_NTSA_API_KEY" },
  nigeria_frsc:      { urlVar: "NIGERIA_FRSC_API_URL",   keyVar: "NIGERIA_FRSC_API_KEY" },
  uganda_ursb_motor: { urlVar: "UGANDA_URSB_API_URL",    keyVar: "UGANDA_URSB_API_KEY" },
  ethiopia_motor:    { urlVar: "ETHIOPIA_MVAA_API_URL",  keyVar: "ETHIOPIA_MVAA_API_KEY" },
};

export interface RegistryTestResult {
  provider: string;
  configured: boolean;
  sandbox: boolean;
  reachable: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
  source: "live" | "sandbox" | "not_configured";
}

/**
 * Test connectivity to a configured registry by issuing a probe lookup.
 * Uses a synthetic reference ("TEST-PROBE") — the registry is expected to
 * return found:false for unknown references; any HTTP 2xx response proves
 * credentials are accepted and the endpoint is reachable.
 */
export async function testRegistryCredentials(provider: AssetProvider): Promise<RegistryTestResult> {
  const envMap = REGISTRY_ENV_MAP[provider];
  if (!envMap) {
    return { provider, configured: false, sandbox: false, reachable: false, source: "not_configured", error: "No credential variables defined for this provider" };
  }
  if (!isRegistryConfigured(provider, envMap.urlVar, envMap.keyVar)) {
    const oauthMap = OAUTH_ENV_MAP[provider];
    const hint = oauthMap
      ? `${envMap.urlVar} + (${envMap.keyVar} or ${oauthMap.tokenUrlVar}/${oauthMap.clientIdVar}/${oauthMap.clientSecretVar}) are not set`
      : `${envMap.urlVar} and ${envMap.keyVar} are not set`;
    return { provider, configured: false, sandbox: false, reachable: false, source: "not_configured", error: hint };
  }
  let auth: { url: string; bearerToken?: string; apiKey?: string } | null;
  try {
    auth = await resolveRegistryAuth(provider, envMap.urlVar, envMap.keyVar);
  } catch (err: any) {
    return {
      provider,
      configured: true,
      sandbox: false,
      reachable: false,
      source: "not_configured",
      error: `Auth resolution failed: ${err.message ?? "Unknown error"}`,
    };
  }
  if (!auth) {
    return { provider, configured: false, sandbox: false, reachable: false, source: "not_configured", error: "Unable to resolve registry credentials" };
  }
  const isSandbox = auth.url.includes("localhost") || auth.url.includes("127.0.0.1") || auth.url.includes("registry-sandbox");
  const start = Date.now();
  try {
    await callLiveRegistry(auth.url, auth.apiKey ?? "", "TEST-PROBE", provider, 10000, auth.bearerToken);
    const latencyMs = Date.now() - start;
    return {
      provider,
      configured: true,
      sandbox: isSandbox,
      reachable: true,
      latencyMs,
      source: isSandbox ? "sandbox" : "live",
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const statusMatch = err.message?.match(/Registry returned (\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
    // HTTP 404 / 422 mean the endpoint is reachable and credentials were accepted —
    // the probe reference ("TEST-PROBE") was simply not found in the registry.
    // Only auth failures (401/403), server errors (5xx), and network timeouts
    // indicate a genuine credential or connectivity problem.
    const reachableByStatus = statusCode === 404 || statusCode === 422;
    return {
      provider,
      configured: true,
      sandbox: isSandbox,
      reachable: reachableByStatus,
      latencyMs,
      statusCode,
      error: reachableByStatus ? undefined : (err.message ?? "Unknown error"),
      source: isSandbox ? "sandbox" : "live",
    };
  }
}

/** Return a status object for each registry showing live vs stub. */
export function registryStatus(): Record<AssetProvider, { live: boolean; url?: string; sandbox?: boolean; source?: string; authMode?: "oauth" | "api_key" }> {
  const check = (provider: string, urlVar: string, keyVar: string) => {
    if (!isRegistryConfigured(provider, urlVar, keyVar)) return { live: false };
    const override = _credOverrides.get(provider);
    const url = override?.url ?? process.env[urlVar] ?? "";
    const isSandbox = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("registry-sandbox");
    const dbSource = _credOverrides.has(provider) ? "database" : "env";
    const authMode: "oauth" | "api_key" = oauthConfigForProvider(provider) ? "oauth" : "api_key";
    return { live: true, url, sandbox: isSandbox, source: dbSource, authMode };
  };
  return {
    ghana_dvla:       check("ghana_dvla",        "GHANA_DVLA_API_URL",    "GHANA_DVLA_API_KEY"),
    sa_natis:         check("sa_natis",           "SA_NATIS_API_URL",       "SA_NATIS_API_KEY"),
    ghana_lands:      check("ghana_lands",        "GHANA_LANDS_API_URL",    "GHANA_LANDS_API_KEY"),
    kenya_ntsa:       check("kenya_ntsa",         "KENYA_NTSA_API_URL",     "KENYA_NTSA_API_KEY"),
    nigeria_frsc:     check("nigeria_frsc",       "NIGERIA_FRSC_API_URL",   "NIGERIA_FRSC_API_KEY"),
    uganda_ursb_motor:check("uganda_ursb_motor",  "UGANDA_URSB_API_URL",    "UGANDA_URSB_API_KEY"),
    ethiopia_motor:   check("ethiopia_motor",     "ETHIOPIA_MVAA_API_URL",  "ETHIOPIA_MVAA_API_KEY"),
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

/**
 * Issue a single lookup request to a live registry.
 * Pass `bearerToken` for OAuth-authenticated registries; leave undefined to
 * use the legacy `X-Api-Key: key` header for static-key registries.
 */
async function callLiveRegistry(
  url: string,
  key: string,
  reference: string,
  provider: AssetProvider,
  timeoutMs = 8000,
  bearerToken?: string,
): Promise<LiveRegistryResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const authHeader: Record<string, string> = bearerToken
    ? { "Authorization": `Bearer ${bearerToken}` }
    : { "X-Api-Key": key };
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AfricaCreditHub/2.5",
        ...authHeader,
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

/** Shared live-call helper used by every adapter. Resolves auth (OAuth or static key) automatically. */
async function callAdapter(
  provider: AssetProvider,
  urlVar: string,
  keyVar: string,
  reference: string,
  timeoutMs = 8000,
): Promise<LiveRegistryResponse> {
  const auth = await resolveRegistryAuth(provider, urlVar, keyVar);
  if (!auth) throw new Error("Registry not configured");
  return callLiveRegistry(auth.url, auth.apiKey ?? "", reference, provider, timeoutMs, auth.bearerToken);
}

async function adapterGhanaDvla(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("ghana_dvla", "GHANA_DVLA_API_URL", "GHANA_DVLA_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("ghana_dvla", "GHANA_DVLA_API_URL", "GHANA_DVLA_API_KEY", req.reference);
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
    "STUB — set GHANA_DVLA_API_URL + GHANA_DVLA_API_KEY (or OAuth vars) to enable live DVLA lookups",
  );
}

async function adapterSaNatis(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("sa_natis", "SA_NATIS_API_URL", "SA_NATIS_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("sa_natis", "SA_NATIS_API_URL", "SA_NATIS_API_KEY", req.reference);
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
    "STUB — set SA_NATIS_API_URL + SA_NATIS_API_KEY (or OAuth vars) to enable live eNaTIS lookups",
  );
}

async function adapterGhanaLands(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("ghana_lands", "GHANA_LANDS_API_URL", "GHANA_LANDS_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("ghana_lands", "GHANA_LANDS_API_URL", "GHANA_LANDS_API_KEY", req.reference);
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
    "STUB — set GHANA_LANDS_API_URL + GHANA_LANDS_API_KEY (or OAuth vars) to enable live Lands Commission lookups",
  );
}

async function adapterKenyaNtsa(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("kenya_ntsa", "KENYA_NTSA_API_URL", "KENYA_NTSA_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("kenya_ntsa", "KENYA_NTSA_API_URL", "KENYA_NTSA_API_KEY", req.reference);
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
    "STUB — set KENYA_NTSA_API_URL + KENYA_NTSA_API_KEY (or OAuth vars) to enable live NTSA lookups",
  );
}

async function adapterNigeriaFrsc(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("nigeria_frsc", "NIGERIA_FRSC_API_URL", "NIGERIA_FRSC_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("nigeria_frsc", "NIGERIA_FRSC_API_URL", "NIGERIA_FRSC_API_KEY", req.reference);
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
    "STUB — set NIGERIA_FRSC_API_URL + NIGERIA_FRSC_API_KEY (or OAuth vars) to enable live FRSC/MVAA lookups",
  );
}

async function adapterUgandaUrsb(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("uganda_ursb_motor", "UGANDA_URSB_API_URL", "UGANDA_URSB_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("uganda_ursb_motor", "UGANDA_URSB_API_URL", "UGANDA_URSB_API_KEY", req.reference);
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
    "STUB — set UGANDA_URSB_API_URL + UGANDA_URSB_API_KEY (or OAuth vars) to enable live URSB lookups",
  );
}

async function adapterEthiopiaMvaa(req: AssetTraceRequest): Promise<AssetTraceResult> {
  if (isRegistryConfigured("ethiopia_motor", "ETHIOPIA_MVAA_API_URL", "ETHIOPIA_MVAA_API_KEY") && req.reference) {
    try {
      const live = await callAdapter("ethiopia_motor", "ETHIOPIA_MVAA_API_URL", "ETHIOPIA_MVAA_API_KEY", req.reference);
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
    "STUB — set ETHIOPIA_MVAA_API_URL + ETHIOPIA_MVAA_API_KEY (or OAuth vars) to enable live MVAA lookups",
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
