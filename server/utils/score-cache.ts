import type { CreditScoreResult } from "../credit-score";

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: CreditScoreResult }>();

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

function ttlMs(): number {
  const seconds = Number.parseInt(process.env.SCORE_CACHE_TTL_SECONDS ?? "", 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_TTL_MS;
}

function isEnabled(): boolean {
  return envFlag("SCORE_CACHE_ENABLED", true) && !envFlag("SCORE_CACHE_PAUSED", false);
}

export function buildScoreFingerprint(parts: Array<string | number | boolean | null | undefined>): string {
  return parts.map((part) => part ?? "").join("|");
}

export async function getOrComputeScore(
  borrowerId: string,
  fingerprint: string,
  computeFn: () => Promise<CreditScoreResult> | CreditScoreResult,
): Promise<CreditScoreResult> {
  if (!isEnabled()) return computeFn();

  const key = `score:${borrowerId}:${fingerprint}`;
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }

  const value = await computeFn();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs() });
  return value;
}

export function invalidateCreditScore(borrowerId?: string | null): void {
  if (!borrowerId) {
    cache.clear();
    return;
  }

  const prefix = `score:${borrowerId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function getScoreCacheStats() {
  return { entries: cache.size, enabled: isEnabled(), ttlSeconds: ttlMs() / 1000 };
}
