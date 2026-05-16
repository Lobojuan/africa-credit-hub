import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { storage, GLOBAL_SCOPE } from "../storage";
import { getActiveCountryName } from "../country-mode";
import { pool, db } from "../db";
import { sql, and, or, eq } from "drizzle-orm";
import { dataSharingAgreements } from "../../shared/schema";
import crypto from "crypto";
import { createLogger } from "../logger";
const middlewareLogger = createLogger("middleware");

export const rateLimitKeyGenerator = (req: Request) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
};

const validate = { keyGeneratorIpFallback: false } as const;

const isLocalhost = (req: Request): boolean => {
  if (process.env.NODE_ENV === "production") return false;
  const ip = req.ip ?? req.socket.remoteAddress ?? "";
  const normalizedIp = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  return normalizedIp === "127.0.0.1" || normalizedIp === "::1";
};

function logRateLimit429(action: string, req: Request) {
  try {
    const ip = rateLimitKeyGenerator(req);
    storage.createAuditLog({
      userId: req.session?.userId ?? null,
      action,
      entity: "rate_limit",
      entityId: null,
      details: JSON.stringify({ path: req.path, ip, ua: (req.headers["user-agent"] || "").slice(0, 120) }),
      ipAddress: ip,
      organizationId: (req.session as any)?.organizationId ?? null,
    }).catch(() => {});
  } catch {}
}

export const loginLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  skip: isLocalhost,
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts from this IP. Please try again in 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  handler(req, res) {
    logRateLimit429("RATE_LIMIT_LOGIN_429", req);
    res.setHeader("Retry-After", "60");
    res.status(429).json({ message: "Too many login attempts from this IP. Please try again in 1 minute." });
  },
});

export const apiLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  skip: (req) => req.path === "/health" || req.path === "/api/health" || isLocalhost(req),
  windowMs: 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  handler(req, res) {
    logRateLimit429("RATE_LIMIT_API_429", req);
    res.setHeader("Retry-After", "60");
    res.status(429).json({ message: "Too many requests. Please slow down." });
  },
});

export const publicApiLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  skip: isLocalhost,
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  handler(req, res) {
    logRateLimit429("RATE_LIMIT_PUBLIC_429", req);
    res.setHeader("Retry-After", "60");
    res.status(429).json({ message: "Too many requests. Please slow down." });
  },
});

export const sessionApiLimiter = rateLimit({
  keyGenerator: (req) => {
    const sid = req.sessionID;
    if (sid) return sid;
    return rateLimitKeyGenerator(req);
  },
  skip: isLocalhost,
  windowMs: 60 * 1000,
  max: 200,
  message: { message: "Too many requests for this session. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  handler(req, res) {
    logRateLimit429("RATE_LIMIT_SESSION_429", req);
    res.setHeader("Retry-After", "60");
    res.status(429).json({ message: "Too many requests for this session. Please slow down." });
  },
});

export function smartApiLimiter(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return sessionApiLimiter(req, res, next);
  }
  return publicApiLimiter(req, res, next);
}

export const writeLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  skip: isLocalhost,
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many write requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
});

export const registrationLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many registration attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
});

export const batchLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many batch operations. Please wait before submitting more." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
});

export const aiLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "AI request limit reached. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
});

export const creditReportLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Credit report request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate,
});

export function stripPassword(user: any) {
  const { password, ...safe } = user;
  return safe;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.consumerId && !req.session?.userId) {
    return res.status(403).json({ message: "Access denied: consumer accounts cannot access institution endpoints" });
  }
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!isPlatformPrivileged(req.session.userRole) && req.session.organizationId) {
    const org = await storage.getOrganization(req.session.organizationId);
    if (org && org.status === "suspended") {
      return res.status(403).json({ message: "ACCOUNT_SUSPENDED", reason: "Your organization's account has been suspended due to unpaid billing. Please contact your administrator or make a payment to restore access." });
    }
    if (org && org.status === "pending") {
      const allowedPaths = ["/api/auth/me", "/api/auth/logout", "/api/auth/mfa", "/api/organization/status"];
      const isAllowed = allowedPaths.some(p => req.path.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({ message: "ACCOUNT_PENDING_REVIEW", reason: "Your institution registration is under review. You will receive an email once approved by the registry administrator." });
      }
    }
    if (org && org.status === "deactivated") {
      const allowedPaths = ["/api/auth/me", "/api/auth/logout"];
      const isAllowed = allowedPaths.some(p => req.path.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({ message: "ACCOUNT_DEACTIVATED", reason: "Your institution registration was not approved. Please contact the registry administrator for more information." });
      }
    }
    if (!req.session.userCountry && org?.country) {
      req.session.userCountry = org.country;
    }
  }
  next();
}

/** True for any role that has platform-wide (cross-org, cross-system) authority. */
export function isPlatformPrivileged(role: string | undefined): boolean {
  return role === "platform_owner" || role === "super_admin";
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.userRole;
    if (!role || (!roles.includes(role) && !isPlatformPrivileged(role))) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isPlatformPrivileged(req.session?.userRole)) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

export function requireConsumer(req: Request, res: Response, next: NextFunction) {
  const consumerId = (req.session as any)?.consumerId;
  if (!consumerId) {
    return res.status(401).json({ message: "Consumer authentication required" });
  }
  if (req.session?.userId) {
    return res.status(403).json({ message: "Access denied: institution sessions cannot access consumer endpoints" });
  }
  next();
}

export function enforceDataSovereignty(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return res.status(401).json({ message: "Authentication required" });
  if (isPlatformPrivileged(req.session.userRole)) return next();
  const userCountry = req.session.userCountry;
  if (!userCountry) return next();
  (req as any)._sovereignCountry = userCountry;
  next();
}

export async function ensureIdempotencyTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        response JSONB,
        status_code INT,
        processing BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("[Idempotency] Table ready");
  } catch (e) {
    console.error("[Idempotency] Failed to create table:", e);
  }
}

setInterval(() => {
  db.execute(sql`DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours'`).catch(() => {});
}, 5 * 60 * 1000);

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["idempotency-key"] as string;
  if (!key) return next();

  const cacheKey = `${req.method}:${req.path}:${key}`;

  try {
    const existing = await pool.query(
      `SELECT response, status_code, processing FROM idempotency_keys WHERE key = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [cacheKey]
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].processing) {
        return res.status(409).json({ message: "A request with this idempotency key is already being processed" });
      }
      res.setHeader("X-Idempotent-Replayed", "true");
      return res.status(existing.rows[0].status_code).json(existing.rows[0].response);
    }

    const claimed = await pool.query(
      `INSERT INTO idempotency_keys (key, processing) VALUES ($1, TRUE) ON CONFLICT (key) DO NOTHING RETURNING key`,
      [cacheKey]
    );
    if (claimed.rows.length === 0) {
      return res.status(409).json({ message: "A request with this idempotency key is already being processed" });
    }
  } catch {
    return next();
  }

  const origJson = res.json.bind(res);
  res.json = function (body: any) {
    pool.query(
      `UPDATE idempotency_keys SET response = $2, status_code = $3, processing = FALSE WHERE key = $1`,
      [cacheKey, JSON.stringify(body), res.statusCode]
    ).catch(() => {});
    return origJson(body);
  };
  res.on("close", () => {
    pool.query(`DELETE FROM idempotency_keys WHERE key = $1 AND processing = TRUE`, [cacheKey]).catch(() => {});
  });
  next();
}

export function getOrgScope(req: Request): string | undefined {
  // platform_owner and super_admin can cross org boundaries freely.
  if (isPlatformPrivileged(req.session?.userRole)) {
    return (req.query.orgId as string) || undefined;
  }
  return req.session?.organizationId || undefined;
}

export function getCountryFilter(req?: Request): string | undefined {
  const explicitCountry = req?.query?.country as string | undefined;
  const hasExplicit = explicitCountry && explicitCountry !== "all" && explicitCountry !== "";

  if (isPlatformPrivileged(req?.session?.userRole)) {
    if (hasExplicit) return explicitCountry;
    if (req?.session?.viewingCountry && req.session.viewingCountry !== "global") return req.session.viewingCountry;
    // Global/unset privileged view: GLOBAL_SCOPE means no country filter.
    return GLOBAL_SCOPE;
  }
  if (req?.session?.userCountry) {
    return req.session.userCountry;
  }
  const country = getActiveCountryName();
  return country || undefined;
}

export async function logCrossCountryAccess(req: Request, targetCountry: string | undefined, endpoint: string): Promise<void> {
  if (!isPlatformPrivileged(req.session?.userRole) || !targetCountry) return;
  const homeCountry = req.session?.userCountry || req.session?.viewingCountry;
  if (homeCountry && homeCountry !== "global" && homeCountry !== targetCountry) {
    try {
      await storage.createAuditLog({
        userId: (req as any).user?.id || req.session?.userId || "system",
        action: "CROSS_COUNTRY_ACCESS",
        entity: "country_isolation",
        entityId: targetCountry,
        details: `Super admin accessed ${endpoint} for country "${targetCountry}" (home: "${homeCountry}")`,
        ipAddress: req.ip,
      });
    } catch (_e) {}
  }
}

export function enforceCountryScopeForNonSuperAdmin(req: Request, country: string | undefined, endpoint: string): void {
  if (!isPlatformPrivileged(req.session?.userRole)) {
    if (!country) {
      throw new Error(`Country scope required for ${endpoint}. Pass a country parameter to ensure data isolation.`);
    }
    const userCountry = req.session?.userCountry;
    if (userCountry && country !== userCountry) {
      throw new Error(`Access denied: user country "${userCountry}" does not match requested country "${country}" for ${endpoint}`);
    }
  }
}

export function requireWriteCountry(country: string | undefined, context: string): string {
  if (!country) throw new Error(`Country scope required for write operation: ${context}`);
  return country;
}

export async function resolveUserCountry(req: Request): Promise<string | undefined> {
  if (req.session?.userCountry) return req.session.userCountry;
  if (req.session?.organizationId) {
    const org = await storage.getOrganization(req.session.organizationId);
    if (org?.country) {
      req.session.userCountry = org.country;
      return org.country;
    }
  }
  return undefined;
}

export async function validateBorrowerCountry(borrowerId: string, req: Request): Promise<boolean> {
  const country = getCountryFilter(req);
  if (!country) return true;
  const borrower = await storage.getBorrower(borrowerId);
  if (!borrower) return true;
  if (borrower.country === country) return true;
  if (!borrower.country) return false;

  const agreements = await db.select().from(dataSharingAgreements).where(
    and(
      eq(dataSharingAgreements.status, "active"),
      or(
        and(eq(dataSharingAgreements.sourceCountry, country), eq(dataSharingAgreements.targetCountry, borrower.country)),
        and(eq(dataSharingAgreements.sourceCountry, borrower.country), eq(dataSharingAgreements.targetCountry, country))
      )
    )
  );
  if (agreements.length === 0) return false;

  // Institution-level check: if the agreement specifies named institutions, the
  // requesting org must appear in the appropriate list.
  let requestingOrgName: string | null = null;
  if ((req as any).session?.organizationId) {
    const org = await storage.getOrganization((req as any).session.organizationId);
    requestingOrgName = org?.name || null;
  }

  for (const agr of agreements) {
    const isSource = agr.sourceCountry === country;
    const relevantInstitutions: string[] = isSource
      ? (agr.targetInstitutions || [])
      : (agr.sourceInstitutions || []);

    const allowed =
      relevantInstitutions.length === 0 ||
      !requestingOrgName ||
      relevantInstitutions.some(inst => inst.toLowerCase() === requestingOrgName!.toLowerCase());

    if (allowed) return true;
  }
  return false;
}

export function safeErrorMessage(e: any, statusCode: number = 500): string {
  const msg = e?.message || "An error occurred";
  if (statusCode >= 500 && (process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true")) {
    const ref = crypto.randomBytes(4).toString("hex");
    middlewareLogger.error(`[Error ${ref}]`, { detail: e?.stack || msg });
    return `An internal error occurred. Reference: ${ref}`;
  }
  return msg
    .replace(/at\s+\S+\s+\(.*?\)/g, "")
    .replace(/\/[\w/.-]+\.(?:ts|js):\d+:\d+/g, "")
    .replace(/Error:\s*/g, "")
    .trim() || "An error occurred";
}
