/**
 * Asset trace adapters for African vehicle and property registries.
 *
 * NOTE: Live integrations with Ghana DVLA, SA NaTIS, Ghana Lands Commission,
 * and similar registries require government data-sharing agreements that are
 * not yet in place. These adapters return deterministic stub responses marked
 * status='stub' so the workflow can be used end-to-end (UI, audit, PDF) and
 * swapped to live calls per registry as MoUs are signed.
 */

import crypto from "crypto";
import { db } from "./db";
import { assetTraceRecords, type AssetTraceRecord } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export type AssetProvider =
  | "ghana_dvla"
  | "sa_natis"
  | "ghana_lands"
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

function deterministicNumber(seed: string, max: number): number {
  const h = crypto.createHash("sha256").update(seed).digest();
  return h.readUInt32BE(0) % max;
}

function stubGhanaDvla(req: AssetTraceRequest): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { error: "VRN required" } };
  }
  const ref = req.reference.toUpperCase().replace(/\s+/g, "");
  const value = 25000 + deterministicNumber(ref, 250000);
  const makes = ["Toyota Vitz", "Honda Civic", "Nissan Sentra", "Hyundai Accent", "Toyota Hilux"];
  const make = makes[deterministicNumber(ref + "m", makes.length)];
  return {
    status: "stub",
    assetType: "vehicle",
    description: `${make} (VRN ${ref})`,
    estimatedValue: value,
    currency: "GHS",
    rawResponse: { provider: "ghana_dvla", vrn: ref, make, year: 2010 + deterministicNumber(ref + "y", 14), note: "STUB — replace with live DVLA API once MoU signed" },
  };
}

function stubSaNatis(req: AssetTraceRequest): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { error: "VRN required" } };
  }
  const ref = req.reference.toUpperCase();
  const value = 80000 + deterministicNumber(ref, 600000);
  return {
    status: "stub",
    assetType: "vehicle",
    description: `Sedan (NaTIS ${ref})`,
    estimatedValue: value,
    currency: "ZAR",
    rawResponse: { provider: "sa_natis", reg: ref, note: "STUB — pending eNaTIS data-sharing agreement" },
  };
}

function stubGhanaLands(req: AssetTraceRequest): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "property", description: null, estimatedValue: null, currency: null, rawResponse: { error: "Title number required" } };
  }
  const ref = req.reference.toUpperCase();
  const value = 150000 + deterministicNumber(ref, 850000);
  return {
    status: "stub",
    assetType: "property",
    description: `Residential plot (Title ${ref})`,
    estimatedValue: value,
    currency: "GHS",
    rawResponse: { provider: "ghana_lands", titleNumber: ref, note: "STUB — pending Lands Commission API access" },
  };
}

function stubGenericVehicle(req: AssetTraceRequest, currency: string): AssetTraceResult {
  if (!req.reference) {
    return { status: "not_found", assetType: "vehicle", description: null, estimatedValue: null, currency: null, rawResponse: { error: "Reference required" } };
  }
  const ref = req.reference.toUpperCase();
  return {
    status: "stub",
    assetType: "vehicle",
    description: `Vehicle (${ref})`,
    estimatedValue: 20000 + deterministicNumber(ref, 200000),
    currency,
    rawResponse: { provider: req.provider, reference: ref, note: "STUB — adapter pending live integration" },
  };
}

export async function executeAssetTrace(req: AssetTraceRequest): Promise<AssetTraceRecord> {
  let result: AssetTraceResult;
  try {
    switch (req.provider) {
      case "ghana_dvla": result = stubGhanaDvla(req); break;
      case "sa_natis": result = stubSaNatis(req); break;
      case "ghana_lands": result = stubGhanaLands(req); break;
      case "uganda_ursb_motor": result = stubGenericVehicle(req, "UGX"); break;
      case "ethiopia_motor": result = stubGenericVehicle(req, "ETB"); break;
      case "liberia_motor": result = stubGenericVehicle(req, "LRD"); break;
      default:
        result = {
          status: "stub",
          assetType: "vehicle",
          description: req.reference ? `Manual entry: ${req.reference}` : null,
          estimatedValue: null,
          currency: null,
          rawResponse: { provider: req.provider, note: "Manual asset entry" },
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
