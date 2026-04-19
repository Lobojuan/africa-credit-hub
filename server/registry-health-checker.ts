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

async function getDbConfig(): Promise<{ alertEmail?: string | null; slackWebhookUrl?: string | null; checkIntervalMinutes?: number }> {
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

async function sendSlackAlert(provider: string, error: string, isRecovery = false): Promise<void> {
  const cfg = await getDbConfig();
  const webhookUrl = cfg.slackWebhookUrl || process.env.REGISTRY_ALERT_SLACK_WEBHOOK;
  if (!webhookUrl) return;

  const color = isRecovery ? "#22c55e" : "#ef4444";
  const title = isRecovery
    ? `:white_check_mark: Registry Recovered: ${provider}`
    : `:rotating_light: Registry Down: ${provider}`;
  const text = isRecovery
    ? `The \`${provider}\` registry is back online and responding normally.`
    : `The \`${provider}\` live registry has failed ${FAILURE_THRESHOLD} consecutive health checks.\n*Error:* ${error}`;

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title,
            text,
            footer: "Africa Credit Hub · Registry Health Monitor",
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

async function sendEmailAlert(provider: string, error: string, isRecovery = false): Promise<void> {
  const to = await opsAlertEmail();
  if (!to) return;

  try {
    const { sendRegistryDownEmail } = await import("./email");
    await sendRegistryDownEmail(to, provider, error, isRecovery);
  } catch (err: any) {
    console.error("[RegistryHealth] Failed to send email alert:", err.message);
  }
}

async function sendAlerts(provider: string, error: string, isRecovery = false): Promise<void> {
  await Promise.allSettled([
    sendSlackAlert(provider, error, isRecovery),
    sendEmailAlert(provider, error, isRecovery),
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
        const shouldAlert = failures >= FAILURE_THRESHOLD && !existing.alertSent;

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
          await sendAlerts(provider, errMsg, false);
        }
      }
    } catch (err: any) {
      const failures = existing.consecutiveFailures + 1;
      const errMsg = err.message ?? "Unknown error";
      const shouldAlert = failures >= FAILURE_THRESHOLD && !existing.alertSent;

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
        await sendAlerts(provider, errMsg, false);
      }
    }
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _currentIntervalMs = DEFAULT_CHECK_INTERVAL_MS;

export async function startRegistryHealthChecker(intervalMs = DEFAULT_CHECK_INTERVAL_MS): Promise<void> {
  if (_timer) return;

  const cfg = await getDbConfig().catch(() => ({}));
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
}

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
