/**
 * Loto Fiscal — scheduled fraud scan.
 *
 * Runs `runFraudScan` once per hour for every active loto country.
 * For each newly-inserted high/critical flag the `merchant.flagged`
 * webhook is fired so subscribers receive near-real-time alerts.
 *
 * Audit trail: one LOTO_FRAUD_SCAN_AUTO entry per country per run,
 * including entries for failed scans so observability is complete.
 * Manual "Run Scan" button in loto-admin.ts continues to work unchanged.
 */

import { db } from "./db";
import { lotoCountryDrawConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import { runFraudScan, type DetectedFlag } from "./loto-fraud-rules";
import { deliverWebhook } from "./webhook-delivery";
import { storage } from "./storage";

const HIGH_SEVERITY = new Set<DetectedFlag["severity"]>(["high", "critical"]);
const LABEL = "[loto-fraud-scheduler]";

/**
 * In-process guard: tracks countries whose scan is currently in-flight.
 * Prevents a slow scan from overlapping with the next scheduled tick.
 * For multi-instance deployments a DB advisory lock should replace this.
 */
const inFlight = new Set<string>();

/**
 * Resolve merchant IDs affected by a flag.
 * Most flags carry a single `merchantId`; the DUPLICATE_FISCAL_CODE rule
 * sets `merchantId: null` when multiple merchants share the same fiscal code
 * and instead lists them in `evidence.merchantIds`.
 */
function affectedMerchantIds(flag: DetectedFlag): string[] {
  if (flag.merchantId) return [flag.merchantId];
  const ids = (flag.evidence as Record<string, unknown>)["merchantIds"];
  if (Array.isArray(ids)) return (ids as unknown[]).filter((id): id is string => typeof id === "string");
  return [];
}

async function scanCountry(countryCode: string): Promise<void> {
  if (inFlight.has(countryCode)) {
    console.warn(`${LABEL} Scan for ${countryCode} still in-flight — skipping this tick`);
    return;
  }
  inFlight.add(countryCode);

  let result: Awaited<ReturnType<typeof runFraudScan>> | undefined;

  try {
    result = await runFraudScan({ countryCode });
  } catch (scanErr) {
    const errMsg = (scanErr as Error).message;
    console.error(`${LABEL} Scan failed for country ${countryCode}:`, errMsg);

    try {
      await storage.createAuditLog({
        action: "LOTO_FRAUD_SCAN_AUTO",
        entity: "loto_fraud_flags",
        entityId: countryCode,
        details: `Auto-scan ${countryCode} FAILED: ${errMsg}`,
      });
    } catch (auditErr) {
      console.error(`${LABEL} Audit log write failed for ${countryCode}:`, (auditErr as Error).message);
    }

    inFlight.delete(countryCode);
    return;
  }

  const summary = `Auto-scan ${countryCode}: ${result.detectionsFound} detections, ${result.flagsUpserted} upserted (${result.newFlags.length} new)`;
  console.log(`${LABEL} ${summary}`);

  try {
    await storage.createAuditLog({
      action: "LOTO_FRAUD_SCAN_AUTO",
      entity: "loto_fraud_flags",
      entityId: countryCode,
      details: summary,
    });
  } catch (auditErr) {
    console.error(`${LABEL} Audit log write failed for ${countryCode}:`, (auditErr as Error).message);
  }

  const highSeverityNew = result.newFlags.filter((f) => HIGH_SEVERITY.has(f.severity));
  for (const flag of highSeverityNew) {
    const merchantIds = affectedMerchantIds(flag);
    for (const merchantId of merchantIds) {
      try {
        const merchant = await storage.getLotoMerchantById(merchantId);
        deliverWebhook("merchant.flagged", {
          merchantId,
          shopName: merchant?.shopName,
          countryCode: flag.countryCode,
          ruleCode: flag.ruleCode,
          severity: flag.severity,
          summary: flag.summary,
          triggeredBy: "scheduled_scan",
        }).catch((e: Error) =>
          console.error(`${LABEL} webhook delivery failed for merchant ${merchantId}:`, e.message),
        );
      } catch (webhookErr) {
        console.error(`${LABEL} Failed to prepare webhook for merchant ${merchantId}:`, (webhookErr as Error).message);
      }
    }
  }

  inFlight.delete(countryCode);
}

async function runScheduledScan(): Promise<void> {
  let countries: string[];
  try {
    const rows = await db
      .select({ countryCode: lotoCountryDrawConfig.countryCode })
      .from(lotoCountryDrawConfig)
      .where(eq(lotoCountryDrawConfig.active, true));
    countries = rows.map((r) => r.countryCode);
  } catch (err) {
    console.error(`${LABEL} Failed to fetch active countries:`, (err as Error).message);
    return;
  }

  if (countries.length === 0) {
    console.log(`${LABEL} No active loto countries — skipping scan`);
    return;
  }

  console.log(`${LABEL} Starting scheduled scan for countries: ${countries.join(", ")}`);

  await Promise.allSettled(countries.map((cc) => scanCountry(cc)));
}

/**
 * Start the recurring fraud scan. Fires an initial scan 30 seconds after
 * boot (so the DB is fully warmed up), then every `intervalHours` hours.
 */
export function startLotoFraudScheduler(intervalHours = 1): void {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  setTimeout(() => {
    runScheduledScan().catch((e) =>
      console.error(`${LABEL} Initial scan error:`, (e as Error).message),
    );
  }, 30_000);

  setInterval(() => {
    runScheduledScan().catch((e) =>
      console.error(`${LABEL} Scheduled scan error:`, (e as Error).message),
    );
  }, intervalMs);

  console.log(`${LABEL} Scheduler started — fraud scan runs every ${intervalHours}h (initial run in 30s)`);
}
