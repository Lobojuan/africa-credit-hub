import type { NextFunction, Request, Response } from "express";

const DEFAULT_SLOW_MS = 1_000;

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

function readSlowThreshold(): number {
  const value = Number.parseInt(process.env.PERF_MONITOR_SLOW_MS ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SLOW_MS;
}

function shouldMonitorPath(path: string): boolean {
  if (envFlag("PERF_MONITOR_INCLUDE_STATIC", false)) return true;
  return path.startsWith("/api") || path === "/health";
}

export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!envFlag("PERF_MONITOR_ENABLED", true) || envFlag("PERF_MONITOR_PAUSED", false) || !shouldMonitorPath(req.path)) {
    return next();
  }

  const start = process.hrtime.bigint();
  const slowThresholdMs = readSlowThreshold();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (durationMs < slowThresholdMs) return;

    console.warn(JSON.stringify({
      level: "warn",
      source: "perf-monitor",
      message: "Slow request",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      contentLength: res.getHeader("content-length") ?? null,
      ts: new Date().toISOString(),
    }));
  });

  next();
}
