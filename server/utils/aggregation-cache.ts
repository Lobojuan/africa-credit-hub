const DEFAULT_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

function ttlMs(): number {
  const seconds = Number.parseInt(process.env.AGG_CACHE_TTL_SECONDS ?? "", 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_TTL_MS;
}

function isEnabled(): boolean {
  return envFlag("AGG_CACHE_ENABLED", true) && !envFlag("AGG_CACHE_PAUSED", false);
}

function cacheKey(type: string, organizationId?: string, country?: string): string {
  return `agg:${type}:${organizationId ?? "global"}:${country ?? "global"}`;
}

export async function getOrComputeAggregation<T>(
  type: string,
  computeFn: () => Promise<T>,
  organizationId?: string,
  country?: string,
): Promise<T> {
  if (!isEnabled()) return computeFn();

  const key = cacheKey(type, organizationId, country);
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }

  const value = await computeFn();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs() });
  return value;
}

export function invalidateAggregations(organizationId?: string, country?: string): void {
  if (!organizationId && !country) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    const [, , cachedOrg, cachedCountry] = key.split(":");
    const matchesOrg = !organizationId || cachedOrg === organizationId;
    const matchesCountry = !country || cachedCountry === country;
    if (matchesOrg && matchesCountry) {
      cache.delete(key);
    }
  }
}

export function getAggregationCacheStats() {
  return { entries: cache.size, enabled: isEnabled(), ttlSeconds: ttlMs() / 1000 };
}
