/**
 * Registry Sandbox — self-hosted mock government API endpoints.
 *
 * This module acts as a realistic sandbox for African vehicle and property
 * registries when live government API credentials are not yet available.
 * The sandbox responds on POST /api/registry-sandbox/:provider/lookup with
 * the same JSON contract expected by callLiveRegistry() in asset-trace.ts:
 *
 *   { found: boolean, description?: string, estimatedValue?: number,
 *     currency?: string, data?: Record<string,any> }
 *
 * Environment variables consumed here (all set to point at localhost):
 *   GHANA_DVLA_API_URL  / GHANA_DVLA_API_KEY
 *   SA_NATIS_API_URL    / SA_NATIS_API_KEY
 *   GHANA_LANDS_API_URL / GHANA_LANDS_API_KEY
 *   KENYA_NTSA_API_URL  / KENYA_NTSA_API_KEY
 *   NIGERIA_FRSC_API_URL / NIGERIA_FRSC_API_KEY
 *   UGANDA_URSB_API_URL / UGANDA_URSB_API_KEY
 *   ETHIOPIA_MVAA_API_URL / ETHIOPIA_MVAA_API_KEY
 *
 * The sandbox key for each provider is stored in
 *   REGISTRY_SANDBOX_KEY_<PROVIDER_UPPER> (e.g. REGISTRY_SANDBOX_KEY_GHANA_DVLA)
 *
 * The sandbox generates deterministic, realistic-looking results from the
 * reference number so the same plate/title always returns the same record.
 * ~90 % of references resolve as "found"; the remaining ~10 % are "not found"
 * (determined by a hash so results are consistent across calls).
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

function hashNum(seed: string, max: number): number {
  const h = crypto.createHash("sha256").update(seed).digest();
  return h.readUInt32BE(0) % max;
}

function hashByte(seed: string, index = 0): number {
  const h = crypto.createHash("sha256").update(seed).digest();
  return h[index];
}

function pickFrom<T>(arr: T[], seed: string): T {
  return arr[hashNum(seed, arr.length)];
}

function deterministicFound(ref: string): boolean {
  return hashByte(ref + "found") % 10 !== 0;
}

// ---------------------------------------------------------------------------
// Sandbox API key validation
// ---------------------------------------------------------------------------

export function sandboxApiKey(provider: string): string | undefined {
  const envKey = `REGISTRY_SANDBOX_KEY_${provider.toUpperCase().replace(/-/g, "_")}`;
  return process.env[envKey];
}

export function validateSandboxKey(provider: string, suppliedKey: string): boolean {
  const expected = sandboxApiKey(provider);
  if (!expected) return false;
  return suppliedKey === expected;
}

// ---------------------------------------------------------------------------
// Per-registry sandbox response builders
// ---------------------------------------------------------------------------

export interface SandboxResponse {
  found: boolean;
  description?: string;
  estimatedValue?: number;
  currency?: string;
  data?: Record<string, any>;
}

function vehicleRecord(
  ref: string,
  makes: string[],
  colors: string[],
  currency: string,
  valueBase: number,
  valueRange: number,
  country: string,
  registryName: string,
): SandboxResponse {
  if (!deterministicFound(ref)) {
    return { found: false, data: { registry: registryName, queriedRef: ref, source: "sandbox" } };
  }
  const make  = pickFrom(makes, ref + "make");
  const year  = 2007 + hashNum(ref + "year", 17);
  const color = pickFrom(colors, ref + "color");
  const value = valueBase + hashNum(ref + "val", valueRange);
  const ownerNames = ["Kwame Mensah", "Ama Owusu", "Yaw Boateng", "Abena Asante",
                      "James Osei", "Akosua Darko", "Kofi Appiah", "Adwoa Amponsah",
                      "Ibrahim Musa", "Fatima Bello", "Chukwuemeka Obi", "Ngozi Adeyemi",
                      "David Kamau", "Grace Wanjiku", "Samuel Odhiambo"];
  const owner = pickFrom(ownerNames, ref + "owner");
  const engineTypes = ["Petrol", "Diesel", "Hybrid"];
  const engine = pickFrom(engineTypes, ref + "eng");
  return {
    found: true,
    description: `${make} ${year} (${color})`,
    estimatedValue: value,
    currency,
    data: {
      registry: registryName,
      source: "sandbox",
      country,
      plateNumber: ref,
      make,
      model: make.split(" ").slice(1).join(" ") || make,
      year,
      color,
      engineType: engine,
      registeredOwner: owner,
      registrationStatus: "Active",
      lastRenewal: `${2020 + hashNum(ref + "renew", 5)}-${String(hashNum(ref + "month", 12) + 1).padStart(2, "0")}-01`,
      chassisNumber: `CH${ref.replace(/\W/g, "").toUpperCase()}${hashNum(ref + "ch", 9999).toString().padStart(4, "0")}`,
      estimatedValue: value,
      currency,
      dataQuality: "sandbox",
    },
  };
}

function propertyRecord(
  ref: string,
  types: string[],
  regions: string[],
  currency: string,
  valueBase: number,
  valueRange: number,
  country: string,
  registryName: string,
): SandboxResponse {
  if (!deterministicFound(ref)) {
    return { found: false, data: { registry: registryName, queriedRef: ref, source: "sandbox" } };
  }
  const propType = pickFrom(types, ref + "type");
  const region   = pickFrom(regions, ref + "region");
  const value    = valueBase + hashNum(ref + "pval", valueRange);
  const sizeSqM  = 200 + hashNum(ref + "size", 1800);
  const ownerNames = ["Kwame Mensah", "Ama Owusu", "Yaw Boateng", "Abena Asante",
                      "James Osei", "Akosua Darko", "Kofi Appiah", "Adwoa Amponsah"];
  const owner = pickFrom(ownerNames, ref + "powner");
  return {
    found: true,
    description: `${propType} in ${region}`,
    estimatedValue: value,
    currency,
    data: {
      registry: registryName,
      source: "sandbox",
      country,
      titleNumber: ref,
      propertyType: propType,
      region,
      sizeSqM,
      registeredOwner: owner,
      encumbrances: hashNum(ref + "enc", 5) === 0 ? "Mortgage registered" : "None",
      lastTransfer: `${2015 + hashNum(ref + "tr", 10)}-${String(hashNum(ref + "trm", 12) + 1).padStart(2, "0")}-01`,
      estimatedValue: value,
      currency,
      dataQuality: "sandbox",
    },
  };
}

// ---------------------------------------------------------------------------
// Per-provider sandbox handlers
// ---------------------------------------------------------------------------

type SandboxHandler = (ref: string) => SandboxResponse;

const SANDBOX_HANDLERS: Record<string, SandboxHandler> = {
  ghana_dvla: (ref) => vehicleRecord(ref,
    ["Toyota Vitz", "Honda Civic", "Nissan Sentra", "Hyundai Accent", "Toyota Hilux",
     "Ford Ranger", "Kia Rio", "Mitsubishi Galant", "Toyota Corolla", "Suzuki Swift"],
    ["White", "Silver", "Black", "Red", "Blue", "Grey"],
    "GHS", 25000, 250000, "Ghana", "Ghana DVLA (Sandbox)",
  ),
  sa_natis: (ref) => vehicleRecord(ref,
    ["Toyota Corolla", "VW Polo", "Ford Fiesta", "BMW 3 Series", "Toyota Fortuner",
     "Hyundai i20", "Renault Kwid", "Suzuki Swift", "Nissan Almera", "Ford Ranger"],
    ["White", "Silver", "Black", "Blue", "Red", "Gun-Metal"],
    "ZAR", 80000, 600000, "South Africa", "SA eNaTIS (Sandbox)",
  ),
  ghana_lands: (ref) => propertyRecord(ref,
    ["Residential Plot", "Commercial Property", "Apartment Unit", "Agricultural Land", "Industrial Site"],
    ["Greater Accra", "Ashanti", "Western", "Eastern", "Northern", "Brong-Ahafo"],
    "GHS", 150000, 850000, "Ghana", "Ghana Lands Commission (Sandbox)",
  ),
  kenya_ntsa: (ref) => vehicleRecord(ref,
    ["Toyota Probox", "Nissan Note", "Subaru Forester", "Toyota Land Cruiser",
     "Isuzu D-Max", "Toyota Fielder", "Mitsubishi Canter", "Nissan Hardbody"],
    ["White", "Silver", "Grey", "Black", "Blue"],
    "KES", 500000, 5000000, "Kenya", "Kenya NTSA (Sandbox)",
  ),
  nigeria_frsc: (ref) => vehicleRecord(ref,
    ["Toyota Camry", "Honda Accord", "Lexus RX", "Toyota Highlander",
     "Kia Sportage", "Toyota Corolla", "Ford Explorer", "Mercedes C-Class"],
    ["Black", "White", "Silver", "Grey", "Maroon"],
    "NGN", 3000000, 30000000, "Nigeria", "Nigeria FRSC/MVAA (Sandbox)",
  ),
  uganda_ursb_motor: (ref) => vehicleRecord(ref,
    ["Toyota Noah", "Toyota Hiace", "Nissan Patrol", "Toyota Corolla",
     "Toyota Land Cruiser", "Isuzu Elf", "Toyota Prado"],
    ["White", "Silver", "Black", "Blue", "Red"],
    "UGX", 20000000, 200000000, "Uganda", "Uganda URSB (Sandbox)",
  ),
  ethiopia_motor: (ref) => vehicleRecord(ref,
    ["Toyota Land Cruiser", "Hyundai H-100", "Isuzu Forward", "Mitsubishi Fuso",
     "Toyota Hilux", "Bajaj RE", "Renault Logan"],
    ["White", "Blue", "Silver", "Black", "Red"],
    "ETB", 1500000, 10000000, "Ethiopia", "Ethiopia MVAA (Sandbox)",
  ),
};

export function handleSandboxLookup(provider: string, reference: string): SandboxResponse | null {
  const handler = SANDBOX_HANDLERS[provider];
  if (!handler) return null;
  const ref = reference.toUpperCase().replace(/\s+/g, "");
  return handler(ref);
}
