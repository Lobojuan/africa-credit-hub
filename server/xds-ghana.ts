/**
 * XDS Data Ghana — Credit Bureau Integration
 *
 * XDS Data is a licensed credit bureau operating in Ghana under the Bank of
 * Ghana Credit Reporting Act (Act 726).  This module provides a live-first,
 * sandbox-fallback adapter following the same pattern as the asset-trace
 * registry adapters.
 *
 * Credential environment variables:
 *   XDS_GHANA_API_URL   — base URL of the XDS Ghana API
 *   XDS_GHANA_API_KEY   — API key issued by XDS Ghana
 *
 * Expected API contract (POST {url}/enquiry):
 *   Request headers:  X-Api-Key: {key}, Content-Type: application/json
 *   Request body:     { ghanaCard?: string, ssnitNumber?: string,
 *                       tinNumber?: string, firstName?: string,
 *                       lastName?: string, dateOfBirth?: string,
 *                       permissiblePurpose: string, requestRef: string }
 *   Response:         XdsEnquiryResponse (see types below)
 *
 * Sandbox activates automatically when XDS_GHANA_API_URL is not set.
 * It returns deterministic but realistic Ghanaian bureau data so the full
 * workflow (report, PDF, audit) remains exercisable during development.
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Credential helpers
// ---------------------------------------------------------------------------

export function xdsCredentials(): { url: string; key: string } | null {
  const url = process.env.XDS_GHANA_API_URL;
  const key = process.env.XDS_GHANA_API_KEY;
  if (url && key) return { url, key };
  return null;
}

export function xdsStatus(): { live: boolean; sandbox: boolean; url?: string } {
  const creds = xdsCredentials();
  if (!creds) return { live: false, sandbox: false };
  const isSandbox =
    creds.url.includes("localhost") ||
    creds.url.includes("127.0.0.1") ||
    creds.url.includes("registry-sandbox") ||
    creds.url.includes("sandbox");
  return { live: true, sandbox: isSandbox, url: creds.url };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface XdsEnquiryRequest {
  ghanaCard?: string;
  ssnitNumber?: string;
  tinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  permissiblePurpose: string;
  requestRef: string;
}

export interface XdsFacility {
  lender: string;
  facilityType: string;
  currency: string;
  originalAmount: number;
  outstandingBalance: number;
  status: "current" | "performing" | "watchlist" | "substandard" | "doubtful" | "loss" | "closed";
  openDate: string;
  lastPaymentDate: string | null;
  daysInArrears: number;
  monthlyInstalment: number;
}

export interface XdsAdverseItem {
  type: "judgment" | "default" | "dishonoured_cheque" | "fraud_alert";
  description: string;
  amount: number | null;
  currency: string | null;
  date: string;
  court?: string;
  status: "outstanding" | "settled" | "appealed";
}

export interface XdsEnquiryResponse {
  found: boolean;
  source: "live" | "sandbox";
  xdsRef: string;
  enquiryDate: string;
  subject?: {
    fullName: string;
    ghanaCard?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    employer?: string;
    phone?: string;
  };
  creditScore?: number;
  scoreCategory?: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
  scoreBand?: string;
  facilities?: XdsFacility[];
  adverseItems?: XdsAdverseItem[];
  enquiryHistory?: { enquiryDate: string; institution: string; purpose: string }[];
  summary?: {
    totalFacilities: number;
    activeFacilities: number;
    closedFacilities: number;
    totalOutstanding: number;
    currency: string;
    adverseCount: number;
    enquiriesLast12Months: number;
    highestDaysInArrears: number;
  };
  permissiblePurpose: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Live API call
// ---------------------------------------------------------------------------

async function callXdsLive(
  url: string,
  key: string,
  req: XdsEnquiryRequest,
  timeoutMs = 10000,
): Promise<XdsEnquiryResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/enquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": key,
        "User-Agent": "AfricaCreditHub/2.5",
        "X-Request-Ref": req.requestRef,
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`XDS Ghana returned HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as XdsEnquiryResponse;
    return { ...json, source: "live" };
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Sandbox helpers (deterministic, realistic Ghanaian credit data)
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

function sandboxResponse(req: XdsEnquiryRequest): XdsEnquiryResponse {
  const id = (req.ghanaCard || req.ssnitNumber || req.tinNumber || `${req.firstName}${req.lastName}`).toUpperCase().replace(/\s+/g, "");
  if (!id) {
    return {
      found: false, source: "sandbox", xdsRef: `SBX-NOID-${Date.now()}`,
      enquiryDate: new Date().toISOString(), permissiblePurpose: req.permissiblePurpose,
    };
  }

  const found = hashByte(id + "found") % 10 !== 0;
  if (!found) {
    return {
      found: false, source: "sandbox", xdsRef: `SBX-NF-${id.slice(0, 8)}`,
      enquiryDate: new Date().toISOString(), permissiblePurpose: req.permissiblePurpose,
    };
  }

  const firstNames = ["Kwame", "Ama", "Yaw", "Abena", "James", "Akosua", "Kofi", "Adwoa", "Ibrahim", "Fatima", "Kwesi", "Efua", "Nana", "Akua", "Kojo"];
  const lastNames = ["Mensah", "Owusu", "Boateng", "Asante", "Osei", "Darko", "Appiah", "Amponsah", "Acheampong", "Amoah", "Adjei", "Agyemang", "Asare", "Bediako", "Ofori"];
  const employers = ["Ghana Revenue Authority", "Cocobod", "MTN Ghana", "Vodafone Ghana", "Ghana Commercial Bank", "Accra Metropolitan Assembly", "University of Ghana", "Jubilee Holdings", "Newmont Ghana", "Anglogold Ashanti", "Tullow Oil", "Ghana Ports & Harbours", "GOIL Plc", "Ecobank Ghana"];
  const lenders = ["Ghana Commercial Bank", "Stanbic Bank Ghana", "Absa Bank Ghana", "Ecobank Ghana", "Zenith Bank Ghana", "Fidelity Bank Ghana", "CalBank", "Agricultural Development Bank", "Republic Bank Ghana", "First Atlantic Bank", "Societe Generale Ghana", "UBA Ghana"];
  const facilityTypes = ["Personal Loan", "Auto Loan", "Mortgage", "Business Loan", "Credit Card", "Overdraft", "Revolving Credit", "Trade Finance"];

  const firstName = pickFrom(firstNames, id + "fn");
  const lastName = pickFrom(lastNames, id + "ln");
  const employer = pickFrom(employers, id + "emp");
  const gender = hashByte(id + "gen") % 2 === 0 ? "Male" : "Female";
  const dobYear = 1965 + hashNum(id + "dob", 35);
  const score = 320 + hashNum(id + "sc", 530);
  const scoreCategory =
    score >= 750 ? "Excellent" : score >= 670 ? "Good" : score >= 580 ? "Fair" : score >= 480 ? "Poor" : "Very Poor";
  const scoreBand = `${score >= 750 ? "A" : score >= 670 ? "B" : score >= 580 ? "C" : score >= 480 ? "D" : "E"}`;

  const numFacilities = 1 + hashNum(id + "nf", 5);
  const facilities: XdsFacility[] = Array.from({ length: numFacilities }, (_, i) => {
    const seed = id + "f" + i;
    const status = (() => {
      const n = hashByte(seed + "st") % 10;
      if (n < 5) return "current";
      if (n < 7) return "performing";
      if (n < 8) return "watchlist";
      if (n < 9) return "substandard";
      return "closed";
    })() as XdsFacility["status"];
    const origAmt = (10000 + hashNum(seed + "oa", 490000));
    const outstanding = status === "closed" ? 0 : Math.round(origAmt * (0.1 + hashNum(seed + "ob", 80) / 100));
    const openYear = 2016 + hashNum(seed + "oy", 8);
    const openMonth = 1 + hashNum(seed + "om", 12);
    const daysArrears = status === "current" ? 0 : status === "performing" ? 0 : status === "watchlist" ? 1 + hashNum(seed + "da", 30) : status === "substandard" ? 31 + hashNum(seed + "da", 60) : 0;
    return {
      lender: pickFrom(lenders, seed + "ln"),
      facilityType: pickFrom(facilityTypes, seed + "ft"),
      currency: "GHS",
      originalAmount: origAmt,
      outstandingBalance: outstanding,
      status,
      openDate: `${openYear}-${String(openMonth).padStart(2, "0")}-01`,
      lastPaymentDate: status === "closed" ? `${openYear + 2}-${String(openMonth).padStart(2, "0")}-01` : `2025-${String(1 + hashNum(seed + "lpm", 4)).padStart(2, "0")}-01`,
      daysInArrears: daysArrears,
      monthlyInstalment: Math.round(origAmt / (24 + hashNum(seed + "mi", 48))),
    };
  });

  const numAdverse = hashByte(id + "adv") % 4;
  const adverseTypes: XdsAdverseItem["type"][] = ["judgment", "default", "dishonoured_cheque", "fraud_alert"];
  const adverseItems: XdsAdverseItem[] = Array.from({ length: numAdverse }, (_, i) => {
    const seed = id + "a" + i;
    const type = pickFrom(adverseTypes, seed + "t");
    return {
      type,
      description: type === "judgment" ? `High Court judgment — ${pickFrom(lenders, seed + "j")}` :
        type === "default" ? `Default on ${pickFrom(facilityTypes, seed + "d")} — ${pickFrom(lenders, seed + "dl")}` :
        type === "dishonoured_cheque" ? `Dishonoured cheque — ${pickFrom(lenders, seed + "c")}` :
        "Fraud alert recorded",
      amount: type === "fraud_alert" ? null : 5000 + hashNum(seed + "amt", 95000),
      currency: type === "fraud_alert" ? null : "GHS",
      date: `${2020 + hashNum(seed + "ay", 5)}-${String(1 + hashNum(seed + "am", 12)).padStart(2, "0")}-01`,
      court: type === "judgment" ? pickFrom(["Accra High Court", "Kumasi High Court", "Tema High Court", "Cape Coast High Court"], seed + "c") : undefined,
      status: pickFrom(["outstanding", "settled", "appealed"], seed + "s") as XdsAdverseItem["status"],
    };
  });

  const enquiryHistory = Array.from({ length: hashNum(id + "eq", 8) }, (_, i) => ({
    enquiryDate: `${2024 - Math.floor(i / 3)}-${String(1 + (i * 3) % 12).padStart(2, "0")}-01`,
    institution: pickFrom(lenders, id + "eq" + i),
    purpose: pickFrom(["New Credit", "Account Review", "Guarantor Check", "Collection", "Periodic Review"], id + "eqp" + i),
  }));

  const totalOutstanding = facilities.filter(f => f.status !== "closed").reduce((s, f) => s + f.outstandingBalance, 0);

  return {
    found: true,
    source: "sandbox",
    xdsRef: `SBX-GH-${id.slice(0, 8)}-${hashNum(id + "ref", 99999).toString().padStart(5, "0")}`,
    enquiryDate: new Date().toISOString(),
    subject: {
      fullName: `${firstName} ${lastName}`,
      ghanaCard: req.ghanaCard,
      dateOfBirth: `${dobYear}-${String(1 + hashNum(id + "dobm", 12)).padStart(2, "0")}-${String(1 + hashNum(id + "dobd", 28)).padStart(2, "0")}`,
      gender,
      address: `${hashNum(id + "hn", 200) + 1} ${pickFrom(["Ring Road West", "Independence Avenue", "Spintex Road", "Accra-Tema Motorway", "Haatso Road", "Legon Bypass", "Liberation Road"], id + "addr")}, Accra`,
      employer,
      phone: `+233${5 + hashNum(id + "ph", 4)}${Array.from({ length: 8 }, (_, i) => hashNum(id + "ph" + i, 10)).join("")}`,
    },
    creditScore: score,
    scoreCategory,
    scoreBand,
    facilities,
    adverseItems,
    enquiryHistory,
    summary: {
      totalFacilities: facilities.length,
      activeFacilities: facilities.filter(f => f.status !== "closed").length,
      closedFacilities: facilities.filter(f => f.status === "closed").length,
      totalOutstanding,
      currency: "GHS",
      adverseCount: adverseItems.length,
      enquiriesLast12Months: enquiryHistory.filter(e => e.enquiryDate >= new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)).length,
      highestDaysInArrears: Math.max(0, ...facilities.map(f => f.daysInArrears)),
    },
    permissiblePurpose: req.permissiblePurpose,
  };
}

// ---------------------------------------------------------------------------
// Main export: live-first, sandbox fallback
// ---------------------------------------------------------------------------

export interface XdsQueryInput {
  ghanaCard?: string;
  ssnitNumber?: string;
  tinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  permissiblePurpose: string;
  requestRef: string;
}

export async function queryXdsGhana(input: XdsQueryInput): Promise<XdsEnquiryResponse> {
  const creds = xdsCredentials();
  if (creds) {
    try {
      return await callXdsLive(creds.url, creds.key, input);
    } catch (err: any) {
      console.error("[XDS Ghana] Live call failed:", err.message);
      return {
        found: false,
        source: "live",
        xdsRef: `ERR-${Date.now()}`,
        enquiryDate: new Date().toISOString(),
        permissiblePurpose: input.permissiblePurpose,
        error: err.message,
      };
    }
  }
  return sandboxResponse(input);
}
