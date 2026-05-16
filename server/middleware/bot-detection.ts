import type { Request, Response, NextFunction } from "express";

const KNOWN_SCRAPERS = [
  "python-requests", "python-urllib", "scrapy", "wget", "curl/",
  "httpie", "go-http-client", "java/", "libwww-perl", "lwp-trivial",
  "mj12bot", "ahrefsbot", "semrushbot", "dotbot", "petalbot",
  "yandexbot", "baiduspider", "ia_archiver", "archive.org",
];

const recentBursts = new Map<string, { count: number; windowStart: number; path: string }>();

setInterval(() => {
  const now = Date.now();
  recentBursts.forEach((v, k) => {
    if (now - v.windowStart > 10_000) recentBursts.delete(k);
  });
}, 30_000);

export function botDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" || req.path.startsWith("/.well-known") || req.path === "/robots.txt") {
    return next();
  }

  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const accept = req.headers["accept"] || "";
  const acceptLang = req.headers["accept-language"] || "";

  const isScraper = KNOWN_SCRAPERS.some(s => ua.includes(s));

  const missingBrowserHeaders =
    !accept &&
    !acceptLang &&
    !req.headers["accept-encoding"] &&
    ua.length > 0;

  const ip = req.ip || "";
  const now = Date.now();
  const burstKey = `${ip}|${req.path}`;
  const burst = recentBursts.get(burstKey);
  if (burst) {
    if (now - burst.windowStart < 5_000) {
      burst.count++;
    } else {
      burst.count = 1;
      burst.windowStart = now;
    }
  } else {
    recentBursts.set(burstKey, { count: 1, windowStart: now, path: req.path });
  }

  const burstCount = recentBursts.get(burstKey)?.count || 1;
  const isRapidBurst = burstCount > 15;

  if (isScraper || missingBrowserHeaders || isRapidBurst) {
    try {
      const { storage } = require("../storage");
      storage.createAuditLog({
        userId: req.session?.userId || null,
        action: "BOT_DETECTION_FLAG",
        entity: "request",
        entityId: null,
        details: JSON.stringify({
          reason: isScraper ? "known_scraper_ua" : missingBrowserHeaders ? "missing_browser_headers" : "rapid_burst",
          ua: (req.headers["user-agent"] || "").slice(0, 120),
          path: req.path,
          ip,
          burstCount,
        }),
        ipAddress: ip || null,
        organizationId: req.session?.organizationId || null,
      }).catch(() => {});
    } catch {}

    res.setHeader("Retry-After", "60");
    return res.status(429).json({
      message: "Too many requests. Automated access to this platform is prohibited.",
      retryAfter: 60,
    });
  }

  next();
}
