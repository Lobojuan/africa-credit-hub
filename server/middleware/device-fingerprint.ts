import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const SESSION_FP_KEY = "__fp__";

function computeFingerprint(req: Request, sessionId: string): string {
  const ua = req.headers["user-agent"] || "";
  const lang = req.headers["accept-language"] || "";
  const ip = (req.ip || "").split(".").slice(0, 3).join(".");
  return crypto
    .createHash("sha256")
    .update(`${ua}|${lang}|${ip}|${sessionId}`)
    .digest("hex");
}

export function deviceFingerprintMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return next();

  const sessionId = (req.session as any).id || req.sessionID || "";
  const fp = computeFingerprint(req, sessionId);
  const stored: string | undefined = (req.session as any)[SESSION_FP_KEY];

  if (!stored) {
    (req.session as any)[SESSION_FP_KEY] = fp;
  } else if (stored !== fp) {
    try {
      const { storage } = require("../storage");
      storage.createAuditLog({
        userId: req.session.userId,
        action: "SESSION_FINGERPRINT_CHANGE",
        entity: "session",
        entityId: sessionId.slice(0, 16),
        details: JSON.stringify({
          tag: "session_fingerprint_change",
          severity: "warning",
          prevFp: stored.slice(0, 8) + "…",
          newFp: fp.slice(0, 8) + "…",
          ua: (req.headers["user-agent"] || "").slice(0, 80),
          ip: req.ip,
          path: req.path,
        }),
        ipAddress: req.ip || null,
        organizationId: req.session.organizationId || null,
      }).catch(() => {});
    } catch {}
    (req.session as any)[SESSION_FP_KEY] = fp;
  }

  next();
}
