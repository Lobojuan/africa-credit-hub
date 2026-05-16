import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const SESSION_FP_KEY = "__fp__";
const SESSION_FP_LOGGED_KEY = "__fp_logged__";

function computeFingerprint(req: Request, sessionId: string): string {
  const ua = req.headers["user-agent"] || "";
  const lang = req.headers["accept-language"] || "";
  const ip = (req.ip || "").split(".").slice(0, 3).join(".");
  return crypto
    .createHash("sha256")
    .update(`${ua}|${lang}|${ip}|${sessionId}`)
    .digest("hex");
}

function auditLog(data: Record<string, unknown>) {
  try {
    const { storage } = require("../storage");
    storage.createAuditLog(data).catch(() => {});
  } catch {}
}

export function deviceFingerprintMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return next();

  const sessionId = (req.session as any).id || req.sessionID || "";
  const fp = computeFingerprint(req, sessionId);
  const stored: string | undefined = (req.session as any)[SESSION_FP_KEY];
  const alreadyLogged: boolean = !!(req.session as any)[SESSION_FP_LOGGED_KEY];

  (res.locals as any).deviceFingerprint = fp;

  if (!stored) {
    (req.session as any)[SESSION_FP_KEY] = fp;
    (req.session as any)[SESSION_FP_LOGGED_KEY] = true;
    auditLog({
      userId: req.session.userId,
      action: "SESSION_FINGERPRINT_CREATED",
      entity: "session",
      entityId: sessionId.slice(0, 16),
      details: JSON.stringify({
        tag: "session_fingerprint_created",
        fp: fp.slice(0, 8) + "…",
        ua: (req.headers["user-agent"] || "").slice(0, 80),
        ip: req.ip,
      }),
      ipAddress: req.ip || null,
      organizationId: req.session.organizationId || null,
    });
  } else if (stored !== fp) {
    auditLog({
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
    });
    (req.session as any)[SESSION_FP_KEY] = fp;
  } else if (!alreadyLogged) {
    (req.session as any)[SESSION_FP_LOGGED_KEY] = true;
    auditLog({
      userId: req.session.userId,
      action: "SESSION_FINGERPRINT_VERIFIED",
      entity: "session",
      entityId: sessionId.slice(0, 16),
      details: JSON.stringify({
        tag: "session_fingerprint_verified",
        fp: fp.slice(0, 8) + "…",
        ua: (req.headers["user-agent"] || "").slice(0, 80),
        ip: req.ip,
      }),
      ipAddress: req.ip || null,
      organizationId: req.session.organizationId || null,
    });
  }

  next();
}
