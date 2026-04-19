import crypto from "crypto";
import { sql, eq, and, desc, inArray, type SQL } from "drizzle-orm";
import { db } from "./db";
import {
  contactEvents, linkClusters, borrowers,
  type ContactEvent, type LinkCluster,
} from "@shared/schema";
import { decryptBorrowerArray } from "./encryption";

const COMMON_VALUE_BLACKLIST = new Set([
  "", "n/a", "na", "none", "unknown", "tbd", "tba", "0",
  "government", "government of ghana", "government of liberia",
  "government of uganda", "government of ethiopia",
  "ministry of finance", "ministry of health", "ministry of education",
  "self employed", "self-employed", "selfemployed", "freelance",
  "ghanapost", "ghana post", "post office", "po box",
  "trader", "farmer", "student", "retired", "unemployed",
]);

const MAX_CLUSTER_BORROWERS = 100;

export type ContactType =
  | "phone" | "email" | "address" | "postal_address"
  | "employer" | "employer_address" | "bank_account"
  | "mobile_money" | "other_id";

export function normalizeValue(type: ContactType, raw: any): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw).trim().toLowerCase();
  if (!s) return "";
  switch (type) {
    case "phone":
    case "mobile_money":
    case "other_id":
      s = s.replace(/[^0-9+]/g, "");
      if (s.startsWith("00")) s = "+" + s.slice(2);
      break;
    case "email":
      s = s.replace(/\s+/g, "");
      break;
    case "address":
    case "postal_address":
    case "employer_address":
      s = s.replace(/[\s,.\-_/\\]+/g, " ").trim();
      break;
    case "employer":
      s = s.replace(/[\s,.\-_/\\&]+/g, " ").trim();
      break;
    case "bank_account":
      s = s.replace(/[^0-9a-z]/g, "");
      break;
  }
  return s;
}

export function isCommonValue(type: ContactType, normalized: string): boolean {
  if (!normalized || normalized.length < 3) return true;
  if (COMMON_VALUE_BLACKLIST.has(normalized)) return true;
  // Strip prefixes like "the " or "a " for employers
  if (type === "employer") {
    const stripped = normalized.replace(/^(the |a )/, "");
    if (COMMON_VALUE_BLACKLIST.has(stripped)) return true;
  }
  return false;
}

function hashValue(type: ContactType, normalized: string): string {
  return crypto.createHash("sha256").update(`${type}|${normalized}`).digest("hex").slice(0, 32);
}

function maskDisplay(type: ContactType, value: string): string {
  if (type === "email" && value.includes("@")) {
    const [local, domain] = value.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (type === "phone" || type === "mobile_money" || type === "bank_account") {
    if (value.length <= 4) return "***";
    return `***${value.slice(-4)}`;
  }
  if (value.length > 40) return value.slice(0, 40) + "…";
  return value;
}

const BORROWER_CONTACT_FIELDS: Array<{ field: string; type: ContactType }> = [
  { field: "phone", type: "phone" },
  { field: "homeTelephone", type: "phone" },
  { field: "workTelephone", type: "phone" },
  { field: "officeTelephone2", type: "phone" },
  { field: "mobileTelephone2", type: "phone" },
  { field: "mobileMoneyNumber", type: "mobile_money" },
  { field: "email", type: "email" },
  { field: "address", type: "address" },
  { field: "postalAddress1", type: "postal_address" },
  { field: "postalAddress2", type: "postal_address" },
  { field: "previousAddress1", type: "address" },
  { field: "previousAddress2", type: "address" },
  { field: "previousAddress3", type: "address" },
  { field: "previousAddress4", type: "address" },
  { field: "employerName", type: "employer" },
  { field: "employerAddress", type: "employer_address" },
  { field: "ezwichNumber", type: "bank_account" },
];

/**
 * Extract contact data points from a borrower record (decrypted) and upsert
 * them into contact_events with first/last seen tracking.
 */
export async function captureBorrowerContactEvents(
  borrowerId: string,
  decryptedData: Record<string, unknown>,
  source: string,
  context: { organizationId?: string | null; country?: string | null; sourceRef?: string | null },
): Promise<number> {
  let writes = 0;
  for (const { field, type } of BORROWER_CONTACT_FIELDS) {
    const raw = decryptedData[field];
    if (!raw) continue;
    const normalized = normalizeValue(type, raw);
    if (!normalized || normalized.length < 3) continue;
    try {
      const existing = await db.select().from(contactEvents).where(and(
        eq(contactEvents.borrowerId, borrowerId),
        eq(contactEvents.contactType, type),
        eq(contactEvents.valueNormalized, normalized),
      )).limit(1);
      if (existing.length > 0) {
        // Backfill represents pre-existing data, not a new submission event —
        // do NOT touch lastSeen/occurrences (would corrupt recency signals).
        if (source !== "backfill") {
          await db.update(contactEvents).set({
            lastSeen: new Date(),
            occurrences: (existing[0].occurrences || 1) + 1,
            source,
          }).where(eq(contactEvents.id, existing[0].id));
        }
      } else {
        await db.insert(contactEvents).values({
          borrowerId,
          contactType: type,
          value: String(raw),
          valueNormalized: normalized,
          source,
          sourceRef: context.sourceRef || undefined,
          organizationId: context.organizationId || undefined,
          country: context.country || undefined,
        });
      }
      writes++;
    } catch (e) {
      const err = e as Error;
      console.error(`[trace-engine] capture failed for ${type}/${field}:`, err.message);
    }
  }
  return writes;
}

/**
 * One-time backfill: walk all existing borrowers and capture their current
 * contact data points (including legacy previous_address_*, employer, phones)
 * into contact_events with source='backfill'. Idempotent — re-runs are safe
 * because captureBorrowerContactEvents upserts on (borrower_id, type, value).
 *
 * Coverage scope (intentional):
 *  - INCLUDED: every contact-bearing field currently stored on the borrowers
 *    table (mobile/secondary phones, email, current+previous addresses,
 *    employer + employer address, mobile-money/bank account refs, e-zwich).
 *  - NOT INCLUDED: superseded values discarded by past UPDATE statements
 *    before the trace module existed. Those values are not retained anywhere
 *    in the system (no per-field history table, audit_logs only records the
 *    fact-of-update, not previous PII), so they are unrecoverable. Going
 *    forward, captureBorrowerContactEvents on every borrower create/update
 *    persists the full lifecycle.
 *  - NOT NEEDED: credit_accounts and guarantors carry no borrower-attached
 *    contact PII (account/financial fields and separate guarantor identities
 *    respectively), so walking them would not add coverage.
 */
export async function backfillContactEvents(opts: { country?: string; batchSize?: number } = {}): Promise<{ borrowers: number; writes: number }> {
  const batchSize = opts.batchSize ?? 1000;
  const filters = opts.country ? [eq(borrowers.country, opts.country)] : [];
  const where = filters.length > 0 ? and(...filters) : undefined;
  let offset = 0;
  let totalBorrowers = 0;
  let totalWrites = 0;
  // Resumable, paginated walk of ALL borrowers (including legacy batch-uploaded
  // records). No hard cap — yields control between batches via setImmediate so
  // a multi-million-row backfill doesn't starve the event loop.
  for (;;) {
    const rows = where
      ? await db.select().from(borrowers).where(where).limit(batchSize).offset(offset)
      : await db.select().from(borrowers).limit(batchSize).offset(offset);
    if (rows.length === 0) break;
    const decryptedRows = decryptBorrowerArray(rows) as Array<Record<string, unknown>>;
    for (const b of decryptedRows) {
      const id = String(b.id);
      const w = await captureBorrowerContactEvents(id, b, "backfill", {
        organizationId: (b.organizationId as string | null) ?? null,
        country: (b.country as string | null) ?? null,
        sourceRef: `borrower:${id}`,
      });
      totalWrites += w;
    }
    totalBorrowers += decryptedRows.length;
    offset += rows.length;
    if (rows.length < batchSize) break;
    await new Promise((r) => setImmediate(r));
  }
  return { borrowers: totalBorrowers, writes: totalWrites };
}

export async function getBorrowerContactEvents(borrowerId: string): Promise<ContactEvent[]> {
  return db.select().from(contactEvents)
    .where(eq(contactEvents.borrowerId, borrowerId))
    .orderBy(desc(contactEvents.lastSeen));
}

export interface BorrowerLink {
  borrowerId: string;
  linkType: string;
  linkValueDisplay: string;
  sharedWithCount: number;
  confidence: number;
  clusterId: string;
}

export async function getLinkedBorrowers(borrowerId: string, country?: string): Promise<BorrowerLink[]> {
  const filters: SQL[] = [sql`${borrowerId} = ANY(${linkClusters.memberBorrowerIds})`];
  if (country) filters.push(eq(linkClusters.country, country));
  const where = filters.length > 1 ? and(...filters) : filters[0];
  const clusters = await db.select().from(linkClusters).where(where).orderBy(desc(linkClusters.memberCount)).limit(100);
  const links: BorrowerLink[] = [];
  for (const c of clusters) {
    for (const otherId of (c.memberBorrowerIds || [])) {
      if (otherId === borrowerId) continue;
      links.push({
        borrowerId: otherId,
        linkType: c.linkType,
        linkValueDisplay: c.linkValueDisplay,
        sharedWithCount: c.memberCount,
        confidence: parseFloat(String(c.confidence)) || 0.5,
        clusterId: c.id,
      });
    }
  }
  return links;
}

/**
 * Recompute link clusters by aggregating contact_events. Skips common values
 * and clusters with only one borrower or more than MAX_CLUSTER_BORROWERS.
 */
export async function recomputeLinkClusters(country?: string): Promise<{ created: number; updated: number; skipped: number }> {
  const where = country ? eq(contactEvents.country, country) : undefined;

  const events = await db.select().from(contactEvents).where(where);

  // Group by (type, normalized, country)
  const groups = new Map<string, { type: ContactType; normalized: string; country: string | null; borrowerIds: Set<string> }>();
  for (const ev of events) {
    if (isCommonValue(ev.contactType as ContactType, ev.valueNormalized)) continue;
    const key = `${ev.contactType}|${ev.valueNormalized}|${ev.country || ""}`;
    if (!groups.has(key)) {
      groups.set(key, { type: ev.contactType as ContactType, normalized: ev.valueNormalized, country: ev.country, borrowerIds: new Set() });
    }
    groups.get(key)!.borrowerIds.add(ev.borrowerId);
  }

  let created = 0, updated = 0, skipped = 0;
  for (const g of Array.from(groups.values())) {
    if (g.borrowerIds.size < 2) { skipped++; continue; }
    if (g.borrowerIds.size > MAX_CLUSTER_BORROWERS) { skipped++; continue; }
    const hash = hashValue(g.type, g.normalized);
    const display = maskDisplay(g.type, g.normalized);
    const memberIds: string[] = Array.from(g.borrowerIds);
    const confidence = g.borrowerIds.size <= 3 ? 0.85 : g.borrowerIds.size <= 8 ? 0.65 : 0.40;

    const existing = await db.select().from(linkClusters).where(and(
      eq(linkClusters.linkType, g.type),
      eq(linkClusters.linkValueHash, hash),
      g.country ? eq(linkClusters.country, g.country) : sql`country IS NULL`,
    )).limit(1);

    if (existing.length > 0) {
      await db.update(linkClusters).set({
        memberBorrowerIds: memberIds,
        memberCount: memberIds.length,
        confidence: confidence.toFixed(2),
        linkValueDisplay: display,
        lastRecomputedAt: new Date(),
      }).where(eq(linkClusters.id, existing[0].id));
      updated++;
    } else {
      await db.insert(linkClusters).values({
        linkType: g.type,
        linkValueHash: hash,
        linkValueDisplay: display,
        memberBorrowerIds: memberIds,
        memberCount: memberIds.length,
        confidence: confidence.toFixed(2),
        country: g.country,
      });
      created++;
    }
  }

  // Clean up stale single-member clusters
  const staleResult = await db.delete(linkClusters).where(sql`${linkClusters.memberCount} < 2`);
  return { created, updated, skipped };
}

export async function findConnections(query: { type?: ContactType; value: string; country?: string }): Promise<{
  matches: Array<{ borrowerId: string; matchType: string; matchValueDisplay: string }>;
  clusters: LinkCluster[];
}> {
  const types: ContactType[] = query.type ? [query.type] : ["phone", "email", "address", "employer", "mobile_money", "bank_account"];
  const matches: Array<{ borrowerId: string; matchType: string; matchValueDisplay: string }> = [];
  const matchedClusters: LinkCluster[] = [];

  for (const t of types) {
    const normalized = normalizeValue(t, query.value);
    if (!normalized || normalized.length < 3) continue;

    const evFilters: SQL[] = [
      eq(contactEvents.contactType, t),
      eq(contactEvents.valueNormalized, normalized),
    ];
    if (query.country) evFilters.push(eq(contactEvents.country, query.country));
    const events = await db.select().from(contactEvents).where(and(...evFilters)).limit(50);
    for (const ev of events) {
      matches.push({ borrowerId: ev.borrowerId, matchType: t, matchValueDisplay: maskDisplay(t, normalized) });
    }

    const hash = hashValue(t, normalized);
    const cFilters: SQL[] = [eq(linkClusters.linkValueHash, hash)];
    if (query.country) cFilters.push(eq(linkClusters.country, query.country));
    const clusters = await db.select().from(linkClusters).where(and(...cFilters));
    matchedClusters.push(...clusters);
  }

  return { matches, clusters: matchedClusters };
}

export async function decryptedBorrowersByIds(ids: string[]): Promise<Array<Record<string, unknown>>> {
  if (!ids.length) return [];
  const rows = await db.select().from(borrowers).where(inArray(borrowers.id, ids));
  return decryptBorrowerArray(rows) as Array<Record<string, unknown>>;
}
