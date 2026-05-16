/**
 * Production CORS lockdown middleware for Universal Credit Hub.
 *
 * In production (NODE_ENV=production or PRODUCTION_MODE=true) only requests
 * from the configured CANONICAL_URL origin are allowed. All others receive 403.
 *
 * Server-to-server callers (Stripe webhooks, USSD aggregators, AT callbacks)
 * never send an Origin header so they bypass this middleware untouched.
 *
 * In development the middleware is permissive so the Vite dev-server proxy works.
 *
 * Exported as a factory so it can be unit-tested with any canonical URL.
 */
import type { Request, Response, NextFunction } from "express";

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOWED_HEADERS = "Content-Type,X-CSRF-Token,Authorization,Idempotency-Key";

export function createCorsMiddleware(
  canonicalUrl: string | undefined,
  isProd: boolean,
) {
  const canonicalOrigin = (() => {
    if (!canonicalUrl) return null;
    try { return new URL(canonicalUrl).origin; } catch { return null; }
  })();

  return function corsMiddleware(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    if (!origin) return next();

    if (isProd) {
      const allowed = canonicalOrigin !== null && origin === canonicalOrigin;
      if (!allowed) {
        return res.status(403).json({ message: "Cross-origin request not allowed" });
      }
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  };
}
