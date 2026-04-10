import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { getActiveCountryName } from "../country-mode";

export const rateLimitKeyGenerator = (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown";

export const loginLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  skip: (req) => req.path === "/health" || req.path === "/api/health",
  windowMs: 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many write requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many registration attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const batchLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many batch operations. Please wait before submitting more." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "AI request limit reached. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const creditReportLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Credit report request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
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
  if (req.session.userRole !== "super_admin" && req.session.organizationId) {
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

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userRole || (!roles.includes(req.session.userRole) && req.session.userRole !== "super_admin")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userRole !== "super_admin") {
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
  if (req.session.userRole === "super_admin") return next();
  const userCountry = req.session.userCountry;
  if (!userCountry) return next();
  (req as any)._sovereignCountry = userCountry;
  next();
}

const idempotencyCache = new Map<string, { response: any; status: number; timestamp: number }>();
const idempotencyInFlight = new Set<string>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_MAX_SIZE = 10_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyCache) {
    if (now - val.timestamp > IDEMPOTENCY_TTL_MS) idempotencyCache.delete(key);
  }
  if (idempotencyCache.size > IDEMPOTENCY_MAX_SIZE) {
    const overflow = idempotencyCache.size - IDEMPOTENCY_MAX_SIZE;
    const keys = idempotencyCache.keys();
    for (let i = 0; i < overflow; i++) idempotencyCache.delete(keys.next().value!);
  }
}, 5 * 60 * 1000);

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["idempotency-key"] as string;
  if (!key) return next();

  const cacheKey = `${req.method}:${req.path}:${key}`;
  const cached = idempotencyCache.get(cacheKey);
  if (cached) {
    res.setHeader("X-Idempotent-Replayed", "true");
    return res.status(cached.status).json(cached.response);
  }

  if (idempotencyInFlight.has(cacheKey)) {
    return res.status(409).json({ message: "A request with this idempotency key is already being processed" });
  }

  idempotencyInFlight.add(cacheKey);
  const origJson = res.json.bind(res);
  res.json = function (body: any) {
    idempotencyCache.set(cacheKey, { response: body, status: res.statusCode, timestamp: Date.now() });
    idempotencyInFlight.delete(cacheKey);
    return origJson(body);
  };
  res.on("close", () => idempotencyInFlight.delete(cacheKey));
  next();
}

export function getOrgScope(req: Request): string | undefined {
  if (req.session?.userRole === "super_admin") {
    return (req.query.orgId as string) || undefined;
  }
  return req.session?.organizationId || undefined;
}

export function getCountryFilter(req?: Request): string | undefined {
  const explicitCountry = req?.query?.country as string | undefined;
  const hasExplicit = explicitCountry && explicitCountry !== "all" && explicitCountry !== "";

  if (req?.session?.userRole === "super_admin") {
    if (hasExplicit) return explicitCountry;
    if (!req.session.viewingCountry) return undefined;
    if (req.session.viewingCountry === "global") return undefined;
    return req.session.viewingCountry;
  }
  if (req?.session?.userCountry) {
    return req.session.userCountry;
  }
  const country = getActiveCountryName();
  return country || undefined;
}

export async function logCrossCountryAccess(req: Request, targetCountry: string | undefined, endpoint: string): Promise<void> {
  if (req.session?.userRole !== "super_admin" || !targetCountry) return;
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
  if (req.session?.userRole !== "super_admin") {
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
  return borrower.country === country;
}

import crypto from "crypto";
import { createLogger } from "../logger";
const middlewareLogger = createLogger("middleware");

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
