/**
 * Registry Health Checker
 *
 * Runs a periodic probe against every configured live (non-sandbox) registry.
 * After two consecutive failures the operations team is alerted via Slack
 * webhook and/or email.  Sandbox-only registries are skipped entirely.
 *
 * Alert recipients and check frequency are configurable from the admin UI
 * (stored in the registry_health_config DB table) and fall back to env vars
 * when no DB record exists.
 *
 * Each probe result (ok or fail) is persisted to the registry_health_events
 * table so the team can spot patterns over time.
 *
 * Configuration env vars (fallbacks):
 *   REGISTRY_ALERT_EMAIL       — recipient for alert emails (falls back to PLATFORM_OPS_EMAIL or SMTP_FROM)
 *   REGISTRY_ALERT_SLACK_WEBHOOK — incoming webhook URL for Slack alerts
 */

import { testRegistryCredentials, registryStatus, TESTABLE_PROVIDERS, type AssetProvider } from "./asset-trace";
import { storage } from "./storage";

const DEFAULT_CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const FAILURE_THRESHOLD = 2;
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_CLEANUP_TIME_UTC = "00:00";

export interface RegistryHealthEntry {
  provider: string;
  lastCheckedAt: Date | null;
  lastStatus: "ok" | "fail" | "unknown";
  consecutiveFailures: number;
  latencyMs?: number;
  error?: string;
  alertSent: boolean;
}

const healthState = new Map<string, RegistryHealthEntry>();

export function getRegistryHealthState(): RegistryHealthEntry[] {
  return Array.from(healthState.values());
}

async function getDbConfig(): Promise<{ alertEmail?: string | null; slackWebhookUrl?: string | null; checkIntervalMinutes?: number; cleanupTimeUtc?: string | null; alertConsecutiveFailures?: number }> {
  try {
    const { storage } = await import("./storage");
    const cfg = await storage.getRegistryHealthConfig();
    return cfg ?? {};
  } catch {
    return {};
  }
}

async function opsAlertEmail(): Promise<string | null> {
  const cfg = await getDbConfig();
  return (
    cfg.alertEmail ||
    process.env.REGISTRY_ALERT_EMAIL ||
    process.env.PLATFORM_OPS_EMAIL ||
    process.env.SMTP_FROM ||
    null
  );
}

export interface ThresholdContext {
  isCustom: boolean;
  consecutiveFailures: number;
  criticalFail7d?: number | null;
  criticalStreak30d?: number | null;
}

function formatThresholdForSlack(ctx: ThresholdContext): string {
  if (ctx.isCustom) {
    const parts: string[] = [];
    if (ctx.criticalFail7d != null) parts.push(`${ctx.criticalFail7d} failures/7d`);
    if (ctx.criticalStreak30d != null) parts.push(`streak: ${ctx.criticalStreak30d}/30d`);
    const detail = parts.length ? parts.join(", ") : "see admin";
    return `*Threshold:* Custom override — ${detail} (alert trigger: ${ctx.consecutiveFailures} consecutive failures)`;
  }
  return `*Threshold:* Global default — ${ctx.consecutiveFailures} consecutive failures`;
}

async function sendSlackAlert(provider: string, error: string, isRecovery = false, thresholdCtx?: ThresholdContext): Promise<void> {
  const cfg = await getDbConfig();
  const webhookUrl = cfg.slackWebhookUrl || process.env.REGISTRY_ALERT_SLACK_WEBHOOK;
  if (!webhookUrl) return;

  const color = isRecovery ? "#22c55e" : "#ef4444";
  const title = isRecovery
    ? `:white_check_mark: Registry Recovered: ${provider}`
    : `:rotating_light: Registry Down: ${provider}`;

  let text = isRecovery
    ? `The \`${provider}\` registry is back online and responding normally.`
    : `The \`${provider}\` live registry has failed consecutive health checks.\n*Error:* ${error}`;

  if (!isRecovery && thresholdCtx) {
    text += `\n${formatThresholdForSlack(thresholdCtx)}`;
  }

  try {
    const { isSafeWebhookUrl } = await import("./lib/url-safety");
    if (!isSafeWebhookUrl(webhookUrl)) {
      console.warn("[RegistryHealth] Slack webhook URL failed safety check — skipping alert");
      return;
    }
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title,
            text,
            footer: "Universal Credit Hub · Registry Health Monitor",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[RegistryHealth] Slack webhook returned HTTP ${resp.status}: ${body.slice(0, 200)}`);
    } else {
      console.log(`[RegistryHealth] Slack alert sent for ${provider} (recovery=${isRecovery})`);
    }
  } catch (err: any) {
    console.error("[RegistryHealth] Failed to send Slack alert:", err.message);
  }
}

async function sendEmailAlert(provider: string, error: string, isRecovery = false, thresholdCtx?: ThresholdContext): Promise<void> {
  const to = await opsAlertEmail();
  if (!to) return;

  try {
    const { sendRegistryDownEmail } = await import("./email");
    await sendRegistryDownEmail(to, provider, error, isRecovery, thresholdCtx);
  } catch (err: any) {
    console.error("[RegistryHealth] Failed to send email alert:", err.message);
  }
}

async function sendAlerts(provider: string, error: string, isRecovery = false, thresholdCtx?: ThresholdContext): Promise<void> {
  await Promise.allSettled([
    sendSlackAlert(provider, error, isRecovery, thresholdCtx),
    sendEmailAlert(provider, error, isRecovery, thresholdCtx),
  ]);
}

async function persistEvent(provider: string, status: "ok" | "fail", latencyMs?: number, error?: string): Promise<void> {
  try {
    await storage.insertRegistryHealthEvent({ provider, status, latencyMs: latencyMs ?? null, error: error ?? null });
  } catch (err: any) {
    console.error(`[RegistryHealth] Failed to persist health event for ${provider}:`, err.message);
  }
}

async function runHealthChecks(): Promise<void> {
  const statuses = registryStatus();
  const dbCfg = await getDbConfig().catch(() => ({}));
  const failureThreshold = (dbCfg as any).alertConsecutiveFailures ?? FAILURE_THRESHOLD;

  let overridesByProvider: Map<string, { criticalFail7d: number | null; criticalStreak30d: number | null }>;
  try {
    const overrides = await storage.getAllRegistryThresholdOverrides();
    overridesByProvider = new Map(overrides.map((o) => [o.provider, { criticalFail7d: o.criticalFail7d, criticalStreak30d: o.criticalStreak30d }]));
  } catch {
    overridesByProvider = new Map();
  }

  for (const provider of TESTABLE_PROVIDERS) {
    const meta = statuses[provider];
    if (!meta.live) continue;
    if (meta.sandbox) continue;

    const existing: RegistryHealthEntry = healthState.get(provider) ?? {
      provider,
      lastCheckedAt: null,
      lastStatus: "unknown",
      consecutiveFailures: 0,
      alertSent: false,
    };

    const override = overridesByProvider.get(provider);
    const thresholdCtx: ThresholdContext = override
      ? { isCustom: true, consecutiveFailures: failureThreshold, criticalFail7d: override.criticalFail7d, criticalStreak30d: override.criticalStreak30d }
      : { isCustom: false, consecutiveFailures: failureThreshold };

    try {
      const result = await testRegistryCredentials(provider as AssetProvider);
      const now = new Date();

      if (result.reachable) {
        const wasDown = existing.alertSent;

        healthState.set(provider, {
          provider,
          lastCheckedAt: now,
          lastStatus: "ok",
          consecutiveFailures: 0,
          latencyMs: result.latencyMs,
          error: undefined,
          alertSent: false,
        });

        await persistEvent(provider, "ok", result.latencyMs);

        if (wasDown) {
          console.log(`[RegistryHealth] ${provider} recovered — sending recovery alert`);
          await sendAlerts(provider, "", true);
        } else {
          console.log(`[RegistryHealth] ${provider} OK (${result.latencyMs}ms)`);
        }
      } else {
        const failures = existing.consecutiveFailures + 1;
        const errMsg = result.error ?? "Connection failed";
        const shouldAlert = failures >= failureThreshold && !existing.alertSent;

        healthState.set(provider, {
          provider,
          lastCheckedAt: now,
          lastStatus: "fail",
          consecutiveFailures: failures,
          latencyMs: result.latencyMs,
          error: errMsg,
          alertSent: existing.alertSent || shouldAlert,
        });

        await persistEvent(provider, "fail", result.latencyMs, errMsg);

        console.warn(`[RegistryHealth] ${provider} FAIL (attempt ${failures}): ${errMsg}`);

        if (shouldAlert) {
          console.warn(`[RegistryHealth] Alerting ops team for ${provider}`);
          await sendAlerts(provider, errMsg, false, thresholdCtx);
        }
      }
    } catch (err: any) {
      const failures = existing.consecutiveFailures + 1;
      const errMsg = err.message ?? "Unknown error";
      const shouldAlert = failures >= failureThreshold && !existing.alertSent;

      healthState.set(provider, {
        provider,
        lastCheckedAt: new Date(),
        lastStatus: "fail",
        consecutiveFailures: failures,
        error: errMsg,
        alertSent: existing.alertSent || shouldAlert,
      });

      await persistEvent(provider, "fail", undefined, errMsg);

      console.error(`[RegistryHealth] ${provider} probe threw: ${errMsg}`);

      if (shouldAlert) {
        await sendAlerts(provider, errMsg, false, thresholdCtx);
      }
    }
  }
}

function resolveRetentionDaysFromEnv(): number {
  const rawEnv = process.env.REGISTRY_HEALTH_RETENTION_DAYS;
  const envDays = parseInt(rawEnv ?? "", 10);
  if (rawEnv && (isNaN(envDays) || envDays <= 0)) {
    console.warn(`[RegistryHealth] REGISTRY_HEALTH_RETENTION_DAYS="${rawEnv}" is invalid — falling back to ${DEFAULT_RETENTION_DAYS} days`);
  }
  return (!rawEnv || isNaN(envDays) || envDays <= 0) ? DEFAULT_RETENTION_DAYS : envDays;
}

const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 90;

export async function pruneOldHealthEvents(): Promise<void> {
  let days: number;
  try {
    const cfg = await storage.getRegistryHealthConfig();
    if (cfg?.retentionDays && cfg.retentionDays > 0) {
      days = cfg.retentionDays;
    } else {
      days = resolveRetentionDaysFromEnv();
    }
  } catch {
    days = resolveRetentionDaysFromEnv();
  }
  days = Math.min(Math.max(days, MIN_RETENTION_DAYS), MAX_RETENTION_DAYS);
  const beforeDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Let the storage error propagate so callers (e.g. the on-demand POST route)
  // can surface a meaningful failure instead of silently succeeding.
  const deleted = await storage.deleteOldRegistryHealthEvents(beforeDate);
  _cleanupStats.lastRanAt = new Date();
  _cleanupStats.deletedCount = deleted;
  _cleanupStats.retentionDays = days;
  if (deleted > 0) {
    console.log(`[RegistryHealth] Pruned ${deleted} health event(s) older than ${days} days`);
  } else {
    console.log(`[RegistryHealth] Cleanup ran — no events older than ${days} days to prune`);
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
let _currentIntervalMs = DEFAULT_CHECK_INTERVAL_MS;
let _currentCleanupTimeUtc: string = DEFAULT_CLEANUP_TIME_UTC;

interface CleanupStats {
  lastRanAt: Date | null;
  deletedCount: number | null;
  retentionDays: number | null;
}

const _cleanupStats: CleanupStats = {
  lastRanAt: null,
  deletedCount: null,
  retentionDays: null,
};

export function getCleanupStats(): CleanupStats {
  return { ..._cleanupStats };
}

export function getCurrentCleanupTimeUtc(): string {
  return _currentCleanupTimeUtc;
}

function parseCleanupTimeUtc(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_CLEANUP_TIME_UTC;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  return match ? raw.trim() : DEFAULT_CLEANUP_TIME_UTC;
}

function msUntilNextUtcTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const nextFire = new Date();
  nextFire.setUTCHours(h, m, 0, 0);
  if (nextFire.getTime() <= now.getTime()) {
    nextFire.setUTCDate(nextFire.getUTCDate() + 1);
  }
  return nextFire.getTime() - now.getTime();
}

function scheduleCleanupAtTime(hhmm: string): void {
  if (_cleanupTimeout) {
    clearTimeout(_cleanupTimeout);
    _cleanupTimeout = null;
  }
  _currentCleanupTimeUtc = hhmm;
  const delayMs = msUntilNextUtcTime(hhmm);
  console.log(`[RegistryHealth] Cleanup scheduled at ${hhmm} UTC (in ${Math.round(delayMs / 60000)} min)`);

  function fireAndReschedule() {
    pruneOldHealthEvents().catch((e: any) => console.error("[RegistryHealth] Scheduled cleanup failed:", e.message));
    const nextDelay = msUntilNextUtcTime(_currentCleanupTimeUtc);
    _cleanupTimeout = setTimeout(fireAndReschedule, nextDelay);
  }

  _cleanupTimeout = setTimeout(fireAndReschedule, delayMs);
}

export function rescheduleCleanup(timeUtc: string | null): void {
  scheduleCleanupAtTime(parseCleanupTimeUtc(timeUtc));
}

export async function startRegistryHealthChecker(intervalMs = DEFAULT_CHECK_INTERVAL_MS): Promise<void> {
  if (_timer) return;

  const cfg = await getDbConfig().catch(() => ({} as { checkIntervalMinutes?: number; cleanupTimeUtc?: string | null }));
  const effectiveInterval = cfg.checkIntervalMinutes
    ? cfg.checkIntervalMinutes * 60 * 1000
    : intervalMs;

  _currentIntervalMs = effectiveInterval;
  console.log(`[RegistryHealth] Scheduler started — checks every ${effectiveInterval / 60000} min`);

  setTimeout(async () => {
    try {
      await runHealthChecks();
    } catch (e: any) {
      console.error("[RegistryHealth] Initial check error:", e.message);
    }
  }, 10_000);

  _timer = setInterval(async () => {
    try {
      await runHealthChecks();
    } catch (e: any) {
      console.error("[RegistryHealth] Periodic check error:", e.message);
    }
  }, effectiveInterval);

  if (!_cleanupTimeout) {
    const timeUtc = parseCleanupTimeUtc(cfg.cleanupTimeUtc);
    scheduleCleanupAtTime(timeUtc);
  }
}

/**
 * Restarts only the health-check interval timer with a new interval.
 * The daily cleanup timeout (_cleanupTimeout) is left untouched —
 * use rescheduleCleanup() to change the cleanup time independently.
 */
export function restartRegistryHealthChecker(newIntervalMs: number): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  _currentIntervalMs = newIntervalMs;

  console.log(`[RegistryHealth] Restarting scheduler — checks every ${newIntervalMs / 60000} min`);

  _timer = setInterval(async () => {
    try {
      await runHealthChecks();
    } catch (e: any) {
      console.error("[RegistryHealth] Periodic check error:", e.message);
    }
  }, newIntervalMs);
}

export function getCurrentIntervalMs(): number {
  return _currentIntervalMs;
}

export function getNextCleanupAt(): Date {
  const delayMs = msUntilNextUtcTime(_currentCleanupTimeUtc);
  return new Date(Date.now() + delayMs);
}
