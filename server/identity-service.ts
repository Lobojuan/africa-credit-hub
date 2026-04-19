import crypto from "crypto";
import { storage } from "./storage";
import type { Borrower, InsertIdentityVerification, InsertWatchlistHit, InsertFraudAlert } from "@shared/schema";

function stripPiiFromRawResponse(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const PII_KEYS = ["full_name", "fullName", "first_name", "last_name", "date_of_birth", "dob",
    "id_number", "national_id", "phone_number", "address", "photo", "selfie", "face_image",
    "image", "portrait", "nationality"];
  const cleaned = { ...raw };
  for (const key of PII_KEYS) {
    if (key in cleaned) cleaned[key] = "[REDACTED]";
  }
  return cleaned;
}

const SMILE_API_KEY = process.env.SMILE_IDENTITY_API_KEY;
const SMILE_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID;
const COMPLY_ADVANTAGE_KEY = process.env.COMPLY_ADVANTAGE_API_KEY;

export const PROVIDERS_AVAILABLE = {
  smileIdentity: !!(SMILE_API_KEY && SMILE_PARTNER_ID),
  complyAdvantage: !!COMPLY_ADVANTAGE_KEY,
};

function hashEvidence(data: any): string {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

export interface VerificationOutcome {
  result: "passed" | "failed" | "manual_review" | "stub" | "error";
  confidenceScore: number;
  provider: string;
  evidenceHash: string;
  rawResponse: any;
  errorMessage?: string;
}

async function smileIdentityLookup(borrower: Borrower): Promise<VerificationOutcome> {
  if (!PROVIDERS_AVAILABLE.smileIdentity) {
    const stubScore = borrower.nationalId && borrower.nationalId.length >= 6 ? 92 : 55;
    const raw = { stub: true, idPresent: !!borrower.nationalId, country: borrower.country };
    return {
      result: "stub",
      confidenceScore: stubScore,
      provider: "smile_identity_stub",
      evidenceHash: hashEvidence(raw),
      rawResponse: raw,
    };
  }
  try {
    const country = (borrower.country || "GH").slice(0, 2).toUpperCase();
    const idType = borrower.ghanaCardNumber ? "GHANA_CARD" : borrower.passportNumber ? "PASSPORT" : "NATIONAL_ID";
    const idNumber = borrower.ghanaCardNumber || borrower.passportNumber || borrower.nationalId;
    const payload = {
      partner_id: SMILE_PARTNER_ID,
      country,
      id_type: idType,
      id_number: idNumber,
      first_name: borrower.firstName,
      last_name: borrower.lastName,
      dob: borrower.dateOfBirth,
    };
    const sigData = `${SMILE_PARTNER_ID}${Date.now()}`;
    const signature = crypto.createHmac("sha256", SMILE_API_KEY!).update(sigData).digest("hex");
    const res = await fetch("https://api.smileidentity.com/v1/id_verification", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${signature}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const raw = await res.json().catch(() => ({}));
    const passed = res.ok && (raw as any).ResultCode === "1012";
    return {
      result: passed ? "passed" : "failed",
      confidenceScore: passed ? 95 : 30,
      provider: "smile_identity",
      evidenceHash: hashEvidence(raw),
      rawResponse: raw,
    };
  } catch (e: any) {
    return { result: "error", confidenceScore: 0, provider: "smile_identity", evidenceHash: "", rawResponse: {}, errorMessage: e.message };
  }
}

async function biometricMatchStub(borrower: Borrower): Promise<VerificationOutcome> {
  const hasPhoto = !!(borrower as any).photoUrl;
  const hasIdDoc = !!(borrower as any).idDocumentUrl;
  const score = hasPhoto && hasIdDoc ? 88 : hasPhoto || hasIdDoc ? 55 : 0;
  const raw = { stub: true, hasPhoto, hasIdDoc };
  return {
    result: "stub",
    confidenceScore: score,
    provider: "smile_identity_biometric_stub",
    evidenceHash: hashEvidence(raw),
    rawResponse: raw,
  };
}

async function livenessCheckStub(borrower: Borrower): Promise<VerificationOutcome> {
  const hasPhoto = !!(borrower as any).photoUrl;
  const raw = { stub: true, hasPhoto };
  return {
    result: hasPhoto ? "stub" : "manual_review",
    confidenceScore: hasPhoto ? 80 : 0,
    provider: "smile_identity_liveness_stub",
    evidenceHash: hashEvidence(raw),
    rawResponse: raw,
  };
}

export async function verifyIdentity(borrower: Borrower, userId?: string, organizationId?: string): Promise<{
  idLookup: VerificationOutcome;
  biometric: VerificationOutcome;
  liveness: VerificationOutcome;
  records: { id: string; method: string }[];
}> {
  const idLookup = await smileIdentityLookup(borrower);
  const biometric = await biometricMatchStub(borrower);
  const liveness = await livenessCheckStub(borrower);

  const records: { id: string; method: string }[] = [];
  const methodOutcomes: [InsertIdentityVerification["method"], VerificationOutcome][] = [
    ["id_lookup", idLookup],
    ["biometric_match", biometric],
    ["liveness_check", liveness],
  ];
  for (const [method, outcome] of methodOutcomes) {
    const insert: InsertIdentityVerification = {
      borrowerId: borrower.id,
      provider: outcome.provider,
      method,
      result: outcome.result as InsertIdentityVerification["result"],
      confidenceScore: String(outcome.confidenceScore),
      evidenceHash: outcome.evidenceHash,
      rawResponse: JSON.stringify(stripPiiFromRawResponse(outcome.rawResponse)).slice(0, 8000),
      errorMessage: outcome.errorMessage || null,
      verifiedBy: userId || null,
      organizationId: organizationId || borrower.organizationId || null,
    };
    const v = await storage.createIdentityVerification(insert);
    records.push({ id: v.id, method });
    await storage.createAuditLog({
      action: "IDENTITY_VERIFICATION",
      entity: "borrower",
      entityId: borrower.id,
      userId: userId || null,
      details: JSON.stringify({ method, provider: outcome.provider, result: outcome.result, score: outcome.confidenceScore, hash: outcome.evidenceHash }),
      ipAddress: null,
    });
  }
  return { idLookup, biometric, liveness, records };
}

const SANCTIONS_KEYWORDS = ["taliban", "isis", "al-qaeda", "kim jong", "putin"];
const PEP_KEYWORDS = ["minister", "president", "governor", "senator", "ambassador"];

type WatchlistHitDraft = { source: string; matchScore: number; matchedName: string; matchDetails: string };

// In-memory TTL cache for watchlist screening results to avoid repeat external calls
const WATCHLIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const watchlistCache = new Map<string, { ts: number; hits: WatchlistHitDraft[] }>();

export async function screenWatchlist(borrower: Borrower, userId?: string, organizationId?: string, options?: { bypassCache?: boolean }): Promise<{
  hits: WatchlistHitDraft[];
  recordIds: string[];
  cached: boolean;
}> {
  const fullName = `${borrower.firstName || ""} ${borrower.lastName || borrower.companyName || ""}`.trim().toLowerCase();
  const cacheKey = `${fullName}|${borrower.country || ""}|${borrower.dateOfBirth || ""}`;
  let hits: WatchlistHitDraft[] = [];
  let cached = false;

  if (!options?.bypassCache) {
    const entry = watchlistCache.get(cacheKey);
    if (entry && Date.now() - entry.ts < WATCHLIST_CACHE_TTL_MS) {
      hits = entry.hits;
      cached = true;
    }
  }

  if (!cached && PROVIDERS_AVAILABLE.complyAdvantage) {
    try {
      const res = await fetch("https://api.complyadvantage.com/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Token ${COMPLY_ADVANTAGE_KEY}` },
        body: JSON.stringify({ search_term: fullName, fuzziness: 0.6, types: ["sanction", "pep", "adverse-media"] }),
        signal: AbortSignal.timeout(15000),
      });
      const data: any = await res.json().catch(() => ({}));
      const apiHits = (data.content?.data?.hits || []) as any[];
      for (const h of apiHits.slice(0, 10)) {
        const types: string[] = h.doc?.types || [];
        const source = types.includes("sanction") ? "sanctions_un" : types.includes("pep") ? "pep" : "adverse_media";
        hits.push({
          source,
          matchScore: Math.round((h.score || 0.5) * 100),
          matchedName: h.doc?.name || fullName,
          matchDetails: JSON.stringify({ types, fields: h.doc?.fields?.slice(0, 5) }),
        });
      }
    } catch (err: any) {
      console.error("[ComplyAdvantage] Screening request failed:", err?.message || err);
      // Record a degraded-state alert so callers do not silently treat as clean
      hits.push({
        source: "adverse_media",
        matchScore: 0,
        matchedName: fullName,
        matchDetails: JSON.stringify({ degraded: true, error: String(err?.message || err), provider: "comply_advantage" }),
      });
    }
  } else {
    if (SANCTIONS_KEYWORDS.some(k => fullName.includes(k))) {
      hits.push({ source: "sanctions_un", matchScore: 85, matchedName: fullName, matchDetails: JSON.stringify({ stub: true, matchedKeywords: SANCTIONS_KEYWORDS.filter(k => fullName.includes(k)) }) });
    }
    if (borrower.isPep || PEP_KEYWORDS.some(k => (borrower.occupation || "").toLowerCase().includes(k))) {
      hits.push({ source: "pep", matchScore: borrower.isPep ? 100 : 75, matchedName: fullName, matchDetails: JSON.stringify({ stub: true, occupation: borrower.occupation, declaredPep: borrower.isPep }) });
    }
  }

  // Cache only fresh, non-degraded results
  if (!cached) {
    const isDegraded = hits.some(h => h.matchDetails.includes('"degraded":true'));
    if (!isDegraded) {
      watchlistCache.set(cacheKey, { ts: Date.now(), hits });
    }
  }

  const recordIds: string[] = [];
  for (const h of hits) {
    const insertData: InsertWatchlistHit = {
      borrowerId: borrower.id,
      source: h.source as InsertWatchlistHit["source"],
      provider: PROVIDERS_AVAILABLE.complyAdvantage ? "comply_advantage" : "stub_screening",
      matchScore: String(h.matchScore),
      matchedName: h.matchedName,
      matchDetails: h.matchDetails,
      organizationId: organizationId || borrower.organizationId || null,
    };
    const w = await storage.createWatchlistHit(insertData);
    recordIds.push(w.id);
    await storage.createAuditLog({
      action: "WATCHLIST_SCREENING",
      entity: "borrower",
      entityId: borrower.id,
      userId: userId || null,
      details: JSON.stringify({ source: h.source, matchScore: h.matchScore, hitId: w.id, cached }),
      ipAddress: null,
    });
  }
  return { hits, recordIds, cached };
}

export async function runFraudRules(borrower: Borrower, userId?: string, organizationId?: string): Promise<{
  alerts: { ruleCode: string; ruleDescription: string; severity: "low" | "medium" | "high" | "critical"; evidence: string; relatedBorrowerIds?: string[] }[];
  recordIds: string[];
}> {
  const alerts: { ruleCode: string; ruleDescription: string; severity: "low" | "medium" | "high" | "critical"; evidence: string; relatedBorrowerIds?: string[] }[] = [];

  // Rule 1: same national ID across multiple borrower records (cross-org)
  if (borrower.nationalId) {
    try {
      const dupes = await storage.findBorrowersByNationalId?.(borrower.nationalId, borrower.id);
      if (dupes && dupes.length > 0) {
        const dupeIds = dupes.map((d: Borrower) => d.id).slice(0, 10);
        alerts.push({
          ruleCode: "DUPLICATE_ID_MULTI_ORG",
          ruleDescription: `National ID appears on ${dupes.length} other borrower record(s) across organizations`,
          severity: dupes.length >= 3 ? "high" : "medium",
          evidence: JSON.stringify({ duplicateCount: dupes.length, ids: dupeIds }),
          relatedBorrowerIds: dupeIds,
        });
      }
    } catch (err: any) {
      console.error("[FraudRules] DUPLICATE_ID_MULTI_ORG check failed:", err?.message || err);
    }
  }

  // Rule 2: velocity — many credit inquiries in last 24h
  try {
    const inquiries = await storage.getRecentInquiriesForBorrower?.(borrower.id, 1);
    if (inquiries && inquiries.length >= 5) {
      alerts.push({
        ruleCode: "VELOCITY_INQUIRIES_24H",
        ruleDescription: `${inquiries.length} credit inquiries in the last 24 hours`,
        severity: inquiries.length >= 10 ? "critical" : "high",
        evidence: JSON.stringify({ inquiryCount: inquiries.length, window: "24h" }),
      });
    }
  } catch (err: any) {
    console.error("[FraudRules] VELOCITY_INQUIRIES_24H check failed:", err?.message || err);
  }

  // Rule 3: phone-to-ID consistency check (very basic stub)
  if (borrower.phone && borrower.nationalId) {
    const phoneDigits = borrower.phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      alerts.push({
        ruleCode: "PHONE_FORMAT_SUSPICIOUS",
        ruleDescription: "Phone number is unusually short and may be invalid",
        severity: "low",
        evidence: JSON.stringify({ phone: borrower.phone, digits: phoneDigits.length }),
      });
    }
  }

  // Rule 4: age sanity (DOB)
  if (borrower.dateOfBirth) {
    const dob = new Date(borrower.dateOfBirth);
    const ageYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (!isNaN(ageYears) && (ageYears < 16 || ageYears > 110)) {
      alerts.push({
        ruleCode: "DOB_OUT_OF_RANGE",
        ruleDescription: `Date of birth implies implausible age (${Math.round(ageYears)} years)`,
        severity: "medium",
        evidence: JSON.stringify({ dob: borrower.dateOfBirth, ageYears: Math.round(ageYears) }),
      });
    }
  }

  // Rule 5: address-to-employer plausibility (different country)
  if (borrower.country && borrower.employerAddress && !borrower.employerAddress.toLowerCase().includes((borrower.country || "").toLowerCase())) {
    // soft signal only — not always wrong
  }

  const recordIds: string[] = [];
  for (const a of alerts) {
    const insert: InsertFraudAlert = {
      borrowerId: borrower.id,
      ruleCode: a.ruleCode,
      ruleDescription: a.ruleDescription,
      severity: a.severity,
      evidence: a.evidence,
      relatedBorrowerIds: a.relatedBorrowerIds || [],
      organizationId: organizationId || borrower.organizationId || null,
    };
    const f = await storage.createFraudAlert(insert);
    recordIds.push(f.id);
    await storage.createAuditLog({
      action: "FRAUD_RULE_TRIGGERED",
      entity: "borrower",
      entityId: borrower.id,
      userId: userId || null,
      details: JSON.stringify({ ruleCode: a.ruleCode, severity: a.severity, alertId: f.id }),
      ipAddress: null,
    });
  }
  return { alerts, recordIds };
}

export async function runFullIdentityCheck(borrower: Borrower, userId?: string, organizationId?: string) {
  const verification = await verifyIdentity(borrower, userId, organizationId);
  const watchlist = await screenWatchlist(borrower, userId, organizationId);
  const fraud = await runFraudRules(borrower, userId, organizationId);

  const overallPassed =
    verification.idLookup.result !== "failed" &&
    verification.biometric.result !== "failed" &&
    !watchlist.hits.some(h => h.source.startsWith("sanctions") && h.matchScore >= 80) &&
    !fraud.alerts.some(a => a.severity === "critical");

  return {
    overallPassed,
    verification,
    watchlist,
    fraud,
    providersUsed: PROVIDERS_AVAILABLE,
  };
}
