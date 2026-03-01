import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

const VALID_TABLES: Record<string, string> = {
  borrower: "borrowers",
  credit_account: "credit_accounts",
  audit_log: "audit_logs",
  dispute: "disputes",
  consent_record: "consent_records",
  court_judgment: "court_judgments",
  payment_history: "payment_history",
};

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo", "DR Congo", "Côte d'Ivoire", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia",
  "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
  "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Zambia", "Zimbabwe", "All",
];
const VALID_COUNTRIES = new Set(AFRICAN_COUNTRIES);

type Resolver = "country" | "borrower_id" | "credit_account_id" | "global";

const ENTITY_RESOLVER: Record<string, Resolver> = {
  borrower: "country",
  credit_account: "borrower_id",
  audit_log: "global",
  dispute: "borrower_id",
  consent_record: "borrower_id",
  court_judgment: "borrower_id",
  payment_history: "credit_account_id",
};

export interface RetentionResult {
  policyId: string;
  country: string;
  entityType: string;
  archiveEligible: number;
  expungedCount: number;
  errors: string[];
}

function buildWhereClause(resolver: Resolver, country: string, tableName: string): ReturnType<typeof sql> {
  if (resolver === "country") {
    return sql`${sql.identifier(tableName)}.country = ${country}`;
  } else if (resolver === "borrower_id") {
    return sql`${sql.identifier(tableName)}.borrower_id IN (SELECT id FROM borrowers WHERE country = ${country})`;
  } else if (resolver === "credit_account_id") {
    return sql`${sql.identifier(tableName)}.credit_account_id IN (SELECT ca.id FROM credit_accounts ca JOIN borrowers b ON ca.borrower_id = b.id WHERE b.country = ${country})`;
  }
  return sql`TRUE`;
}

async function countEligible(tableName: string, resolver: Resolver, country: string, fromYears: number, toYears: number): Promise<number> {
  const whereClause = buildWhereClause(resolver, country, tableName);
  const result = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM ${sql.identifier(tableName)}
    WHERE ${whereClause}
      AND created_at < NOW() - make_interval(years => ${fromYears})
      AND created_at >= NOW() - make_interval(years => ${toYears})
  `);
  return parseInt((result as any).rows?.[0]?.cnt || "0", 10);
}

async function expungeExpired(tableName: string, resolver: Resolver, country: string, years: number): Promise<number> {
  const whereClause = buildWhereClause(resolver, country, tableName);
  const result = await db.execute(sql`
    DELETE FROM ${sql.identifier(tableName)}
    WHERE ${whereClause}
      AND created_at < NOW() - make_interval(years => ${years})
  `);
  return (result as any).rowCount || 0;
}

export async function enforceRetentionPolicies(): Promise<RetentionResult[]> {
  const policies = await storage.getRetentionPolicies();
  const activePolicies = policies.filter((p) => p.isActive);
  const results: RetentionResult[] = [];

  for (const policy of activePolicies) {
    const result: RetentionResult = {
      policyId: policy.id,
      country: policy.country,
      entityType: policy.entityType,
      archiveEligible: 0,
      expungedCount: 0,
      errors: [],
    };

    try {
      const tableName = VALID_TABLES[policy.entityType];
      if (!tableName) {
        result.errors.push(`Unknown entity type: ${policy.entityType}`);
        results.push(result);
        continue;
      }

      if (!VALID_COUNTRIES.has(policy.country)) {
        result.errors.push(`Invalid country: ${policy.country}`);
        results.push(result);
        continue;
      }

      const resolver = ENTITY_RESOLVER[policy.entityType];
      const archiveYears = policy.archiveAfterYears ?? policy.retentionYears;
      const expungeYears = policy.retentionYears;

      result.archiveEligible = await countEligible(tableName, resolver, policy.country, archiveYears, expungeYears);
      result.expungedCount = await expungeExpired(tableName, resolver, policy.country, expungeYears);
    } catch (err: any) {
      result.errors.push(err.message || String(err));
    }

    results.push(result);
  }

  return results;
}

let retentionTimer: NodeJS.Timeout | null = null;

export function startRetentionScheduler(intervalHours = 24) {
  console.log(`[Retention] Scheduler started — runs every ${intervalHours} hours`);

  retentionTimer = setInterval(async () => {
    console.log("[Retention] Running scheduled retention enforcement...");
    try {
      const results = await enforceRetentionPolicies();
      const summary = results.map(
        (r) => `${r.country}/${r.entityType}: eligible=${r.archiveEligible}, expunged=${r.expungedCount}${r.errors.length ? ` errors=${r.errors.join("; ")}` : ""}`
      );
      console.log("[Retention] Completed:", summary.join(" | "));

      await storage.createAuditLog({
        action: "retention_enforcement",
        entity: "system",
        details: JSON.stringify({
          results: results.map(({ policyId, country, entityType, archiveEligible, expungedCount, errors }) => ({
            policyId, country, entityType, archiveEligible, expungedCount, errors,
          })),
        }),
      });
    } catch (err) {
      console.error("[Retention] Enforcement error:", err);
    }
  }, intervalHours * 60 * 60 * 1000);
}

export function stopRetentionScheduler() {
  if (retentionTimer) {
    clearInterval(retentionTimer);
    retentionTimer = null;
  }
}
