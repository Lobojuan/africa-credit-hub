import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

const SESSION_FP_KEY = "__fp__";
const SESSION_FP_LAST_AUDIT_KEY = "__fp_last_audit__";
const FP_HEARTBEAT_MS = 60 * 1000;

declare module "express-session" {
  interface SessionData {
    __fp__?: string;
    __fp_last_audit__?: number;
  }
}

function computeFingerprint(req: Request, sessionId: string): string {
  const ua = req.headers["user-agent"] || "";
  const lang = req.headers["accept-language"] || "";
  const ip = (req.ip || "").split(".").slice(0, 3).join(".");
  return crypto
    .createHash("sha256")
    .update(`${ua}|${lang}|${ip}|${sessionId}`)
    .digest("hex");
}

function writeAuditLog(data: Parameters<typeof storage.createAuditLog>[0]): void {
  storage.createAuditLog(data).catch((err) => {
    console.warn("[device-fingerprint] audit log write failed:", (err as Error)?.message);
  });
}

export function deviceFingerprintMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) return next();

  const sessionId = req.sessionID || "";
  const fp = computeFingerprint(req, sessionId);
  const stored: string | undefined = req.session[SESSION_FP_KEY];

  res.locals["deviceFingerprint"] = fp;
  res.setHeader("X-Fp-Active", fp.slice(0, 8));

  if (!stored) {
    req.session[SESSION_FP_KEY] = fp;
    writeAuditLog({
      userId: req.session.userId,
      action: "SESSION_FINGERPRINT_CREATED",
      entity: "session",
      entityId: sessionId.slice(0, 16),
      details: JSON.stringify({
        tag: "session_fingerprint_created",
        fp: fp.slice(0, 8) + "\u2026",
        ua: (req.headers["user-agent"] || "").slice(0, 80),
        ip: req.ip,
      }),
      ipAddress: req.ip || null,
      organizationId: req.session.organizationId || null,
    });
  } else if (stored !== fp) {
    writeAuditLog({
      userId: req.session.userId,
      action: "SESSION_FINGERPRINT_CHANGE",
      entity: "session",
      entityId: sessionId.slice(0, 16),
      details: JSON.stringify({
        tag: "session_fingerprint_change",
        severity: "warning",
        prevFp: stored.slice(0, 8) + "\u2026",
        newFp: fp.slice(0, 8) + "\u2026",
        ua: (req.headers["user-agent"] || "").slice(0, 80),
        ip: req.ip,
        path: req.path,
      }),
      ipAddress: req.ip || null,
      organizationId: req.session.organizationId || null,
    });
    req.session[SESSION_FP_KEY] = fp;
  }

  res.on("finish", () => {
    if (!req.session?.userId) return;
    const lastAudit: number = req.session[SESSION_FP_LAST_AUDIT_KEY] || 0;
    const now = Date.now();
    const shouldHeartbeat = now - lastAudit >= FP_HEARTBEAT_MS;
    writeAuditLog({
      userId: req.session.userId,
      action: shouldHeartbeat ? "SESSION_FINGERPRINT_ACTIVE" : "SESSION_FINGERPRINT_REQUEST",
      entity: "session",
      entityId: sessionId.slice(0, 16),
      details: JSON.stringify({
        tag: shouldHeartbeat ? "session_fingerprint_active" : "session_fingerprint_request",
        fp: fp.slice(0, 8) + "\u2026",
        path: req.path,
        method: req.method,
        status: res.statusCode,
        ip: req.ip,
      }),
      ipAddress: req.ip || null,
      organizationId: req.session.organizationId || null,
    });
    if (shouldHeartbeat) {
      req.session[SESSION_FP_LAST_AUDIT_KEY] = now;
    }
  });

  next();
}
