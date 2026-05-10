/**
 * Loto Fiscal — scheduled fraud scan.
 *
 * Polls every POLL_INTERVAL_MS (15 min by default) and scans each active
 * country if `now − lastScannedAt >= fraudScanIntervalMinutes * 60 000`.
 * The interval is read from `loto_country_draw_config.fraud_scan_interval_minutes`
 * on every poll tick so admin changes take effect without a server restart.
 *
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

/** Base polling resolution — scheduler checks every 15 minutes which
 *  countries are due for a scan based on their per-country interval. */
const POLL_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Number of consecutive failures before an operator alert webhook is fired.
 * The counter resets to 0 on the next successful scan for that country.
 */
const FAILURE_ALERT_THRESHOLD = 3;

/**
 * In-process guard: tracks countries whose scan is currently in-flight.
 * Prevents a slow scan from overlapping with the next scheduled tick.
 * For multi-instance deployments a DB advisory lock should replace this.
 */
const inFlight = new Set<string>();

/**
 * Tracks when each country was last scanned (epoch ms).
 * Reset on restart; countries will scan once within the first poll tick.
 */
const lastScannedAt = new Map<string, number>();

/**
 * Counts consecutive scan failures per country.
 * Reset to 0 on every successful scan.
 */
const consecutiveFailures = new Map<string, number>();

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
    const failedAt = new Date().toISOString();
    console.error(`${LABEL} Scan failed for country ${countryCode}:`, errMsg);

    const failures = (consecutiveFailures.get(countryCode) ?? 0) + 1;
    consecutiveFailures.set(countryCode, failures);

    try {
      await storage.createAuditLog({
        action: "LOTO_FRAUD_SCAN_AUTO",
        entity: "loto_fraud_flags",
        entityId: countryCode,
        details: `Auto-scan ${countryCode} FAILED (consecutive #${failures}): ${errMsg}`,
      });
    } catch (auditErr) {
      console.error(`${LABEL} Audit log write failed for ${countryCode}:`, (auditErr as Error).message);
    }

    // Fire once at the threshold, then once per additional threshold multiple
    // (e.g. at 3, 6, 9 … consecutive failures) to avoid operator alert fatigue.
    if (failures >= FAILURE_ALERT_THRESHOLD && failures % FAILURE_ALERT_THRESHOLD === 0) {
      console.error(
        `${LABEL} ALERT: ${failures} consecutive scan failures for ${countryCode} — firing scan.failed webhook`,
      );
      deliverWebhook("scan.failed", {
        countryCode,
        consecutiveFailures: failures,
        errorMessage: errMsg,
        failedAt,
        alertThreshold: FAILURE_ALERT_THRESHOLD,
      }).catch((e: Error) =>
        console.error(`${LABEL} scan.failed webhook delivery error for ${countryCode}:`, e.message),
      );
    }

    inFlight.delete(countryCode);
    return;
  }

  consecutiveFailures.set(countryCode, 0);
  lastScannedAt.set(countryCode, Date.now());

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
  let rows: { countryCode: string; fraudScanIntervalMinutes: number }[];
  try {
    rows = await db
      .select({
        countryCode: lotoCountryDrawConfig.countryCode,
        fraudScanIntervalMinutes: lotoCountryDrawConfig.fraudScanIntervalMinutes,
      })
      .from(lotoCountryDrawConfig)
      .where(eq(lotoCountryDrawConfig.active, true));
  } catch (err) {
    console.error(`${LABEL} Failed to fetch active countries:`, (err as Error).message);
    return;
  }

  if (rows.length === 0) {
    console.log(`${LABEL} No active loto countries — skipping scan`);
    return;
  }

  const now = Date.now();
  const due = rows.filter(({ countryCode, fraudScanIntervalMinutes }) => {
    const intervalMs = fraudScanIntervalMinutes * 60 * 1000;
    const last = lastScannedAt.get(countryCode) ?? 0;
    return now - last >= intervalMs;
  });

  if (due.length === 0) {
    return;
  }

  console.log(`${LABEL} Starting scheduled scan for countries: ${due.map((r) => r.countryCode).join(", ")}`);

  await Promise.allSettled(due.map(({ countryCode }) => scanCountry(countryCode)));
}

/**
 * Start the recurring fraud scan.
 * Fires an initial scan 30 seconds after boot (so the DB is fully warmed up),
 * then polls every POLL_INTERVAL_MS, scanning countries whose configured
 * interval has elapsed since their last scan.
 */
export function startLotoFraudScheduler(): void {
  setTimeout(() => {
    runScheduledScan().catch((e) =>
      console.error(`${LABEL} Initial scan error:`, (e as Error).message),
    );
  }, 30_000);

  setInterval(() => {
    runScheduledScan().catch((e) =>
      console.error(`${LABEL} Scheduled scan error:`, (e as Error).message),
    );
  }, POLL_INTERVAL_MS);

  console.log(`${LABEL} Scheduler started — polling every ${POLL_INTERVAL_MS / 60000}min, per-country intervals from DB (initial run in 30s)`);
}
