import { Router } from "express";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { mfaBackupCodes } from "@shared/schema";
import { storage } from "../storage";
import { createLogger } from "../logger";
import { loginLimiter, stripPassword, safeErrorMessage, isPlatformPrivileged } from "./middleware";
import { getActiveCountryName } from "../country-mode";

const authLogger = createLogger("auth");

// TOTP replay prevention: track used codes to block reuse within the same 30s window
const usedTotpTokens = new Map<string, number>(); // key: userId:code, value: expiry timestamp

function generateBackupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let raw = "";
  for (let i = 0; i < 8; i++) raw += chars[Math.floor(Math.random() * chars.length)];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`; // XXXX-XXXX format
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.replace(/-/g, "").toUpperCase()).digest("hex");
}
setInterval(() => {
  const now = Date.now();
  for (const [k, exp] of usedTotpTokens) {
    if (now > exp) usedTotpTokens.delete(k);
  }
}, 60_000);

const PASSWORD_EXPIRY_DAYS = 90;
const DUMMY_HASH = "$2b$12$invalidhashfortimingprotectiononly000000000000000000000";

function isPasswordExpired(user: any): boolean {
  if (user.mustChangePassword) return true;
  if (!user.passwordChangedAt) return false;
  const days = (Date.now() - new Date(user.passwordChangedAt).getTime()) / 86400000;
  return days > PASSWORD_EXPIRY_DAYS;
}

const router = Router();

router.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is " + user.status });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s).` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await storage.incrementFailedAttempts(user.id);
      const updatedUser = await storage.getUser(user.id);
      const attempts = (updatedUser?.failedLoginAttempts || 0);

      await storage.createAuditLog({
        action: "LOGIN_FAILED", entity: "user", entityId: user.id,
        details: `Failed login attempt ${attempts} for user ${user.username}`,
        ipAddress: req.ip || null,
      });

      if (attempts >= 3) {
        const lockMinutes = Math.min(15 * Math.pow(2, Math.floor((attempts - 3) / 3)), 1440);
        const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
        await storage.lockUser(user.id, lockUntil);
        await storage.createAuditLog({
          action: "ACCOUNT_LOCKED", entity: "user", entityId: user.id,
          details: `Account locked for ${lockMinutes} minutes after ${attempts} failed attempts`,
          ipAddress: req.ip || null,
        });
        return res.status(423).json({ message: `Account locked for ${lockMinutes} minute(s) after ${attempts} failed attempts.` });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    await storage.resetFailedAttempts(user.id);
    await storage.updateLastLogin(user.id);

    const { detectLoginAnomaly } = await import("../security-hardening");
    const loginIp = req.ip || req.socket.remoteAddress || "unknown";
    const anomalyResult = await detectLoginAnomaly(user.id, loginIp);

    if (user.mfaEnabled && user.mfaSecret) {
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error" });
        req.session.mfaPendingUserId = user.id;
        req.session.save(() => res.json({ requireMfa: true, userId: user.id }));
      });
      return;
    }

    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.allowedProducts = (user as any).allowedProducts ?? undefined;
      req.session.userDivision = (user as any).division || undefined;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();

      if (isPlatformPrivileged(user.role)) {
        delete req.session.viewingCountry;
      }

      let organization = null;
      if (user.organizationId) {
        organization = await storage.getOrganization(user.organizationId);
      }

      if (!isPlatformPrivileged(user.role) && organization?.country) {
        req.session.userCountry = organization.country;
      }

      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in from IP ${loginIp}${anomalyResult.anomaly ? " [NEW IP - ANOMALY DETECTED]" : ""}`,
        ipAddress: loginIp,
        organizationId: user.organizationId || undefined,
      });

      const passwordExpired = isPasswordExpired(user);

      let viewingCountry: string | null = null;
      if (isPlatformPrivileged(user.role)) {
        viewingCountry = null;
      } else {
        viewingCountry = organization?.country || getActiveCountryName() || null;
      }
      req.session.save(() => {
        res.json({
          ...stripPassword(user),
          passwordExpired,
          organization,
          viewingCountry,
          ...(anomalyResult.anomaly ? { loginAnomaly: anomalyResult.reason } : {})
        });
      });
    });
  } catch (e: any) {
    authLogger.error("Login error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/change-password", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRules.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
      });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const { checkPasswordHistory, pushPasswordHistory } = await import("../security-hardening");
    const historyCheck = await checkPasswordHistory(user.id, newPassword);
    if (historyCheck.reused) {
      return res.status(400).json({ message: historyCheck.message });
    }

    const oldHash = user.password;
    const hashed = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(user.id, { password: hashed } as any);
    await storage.updatePasswordChangedAt(user.id);
    await pushPasswordHistory(user.id, oldHash);

    try {
      const { pool } = await import("../db");
      const currentSid = (req as any).sessionID;
      if (currentSid) {
        await pool.query(
          `DELETE FROM user_sessions WHERE sess->>'userId' = $1 AND sid != $2`,
          [String(user.id), currentSid]
        );
      }
    } catch {}

    await storage.createAuditLog({
      action: "PASSWORD_CHANGE", entity: "user", entityId: user.id, userId: user.id,
      details: "Password changed successfully (history check passed, other sessions invalidated)",
      ipAddress: req.ip || null,
    });

    res.json({ message: "Password changed successfully" });
  } catch (e: any) {
    authLogger.error("Change password error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/logout", (req, res) => {
  const userId = req.session?.userId;
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    if (userId) {
      storage.createAuditLog({
        action: "LOGOUT", entity: "system", userId,
        details: "User logged out",
        ipAddress: req.ip || null,
      }).catch((auditError) => {
        // A completed logout must not be reversed or crash the request path if
        // the optional audit write is unavailable.
        authLogger.error("Logout audit logging failed", auditError);
      });
    }
    res.json({ message: "Logged out" });
  });
});

router.post("/api/auth/mfa/login", async (req, res) => {
  try {
    const { code } = req.body;
    const pendingUserId = req.session?.mfaPendingUserId;
    if (!pendingUserId) {
      return res.status(401).json({ message: "No MFA session pending" });
    }
    const user = await storage.getUser(pendingUserId);
    if (!user || !user.mfaSecret) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }
    const totp = new OTPAuth.TOTP({
      issuer: "Universal Credit Hub",
      label: user.username,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return res.status(401).json({ message: "Invalid MFA code" });
    }
    // Prevent TOTP replay: reject codes already used within the validity window
    const tokenKey = `${user.id}:${code}`;
    if (usedTotpTokens.has(tokenKey)) {
      return res.status(401).json({ message: "MFA code already used. Please wait for the next code." });
    }
    usedTotpTokens.set(tokenKey, Date.now() + 90_000); // 3 windows to be safe
    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.allowedProducts = (user as any).allowedProducts ?? undefined;
      req.session.userDivision = (user as any).division || undefined;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();
      if (isPlatformPrivileged(user.role)) {
        delete req.session.viewingCountry;
      }
      if (!isPlatformPrivileged(user.role) && user.organizationId) {
        const org = await storage.getOrganization(user.organizationId);
        if (org?.country) {
          req.session.userCountry = org.country;
        }
      }
      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in (MFA verified)`,
        ipAddress: req.ip || null,
        organizationId: user.organizationId || undefined,
      });
      const passwordExpired = isPasswordExpired(user);
      let organization = null;
      if (user.organizationId) {
        organization = await storage.getOrganization(user.organizationId);
      }
      let viewingCountry: string | null = null;
      if (isPlatformPrivileged(user.role)) {
        viewingCountry = null;
      } else {
        viewingCountry = organization?.country || getActiveCountryName() || null;
      }
      req.session.save(() => {
        res.json({ ...stripPassword(user), passwordExpired, organization, viewingCountry });
      });
    });
  } catch (e: any) {
    authLogger.error("MFA login error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/mfa/setup", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "Universal Credit Hub",
      label: user.username,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });
    await storage.updateUser(user.id, { mfaSecret: secret.base32 } as any);
    res.json({ secret: secret.base32, uri: totp.toString() });
  } catch (e: any) {
    authLogger.error("MFA setup error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/mfa/verify", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const { code } = req.body;
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.mfaSecret) return res.status(400).json({ message: "MFA not set up" });
    const totp = new OTPAuth.TOTP({
      issuer: "Universal Credit Hub",
      label: user.username,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return res.status(400).json({ message: "Invalid code. Please try again." });
    }
    // Prevent TOTP replay: reject codes already used within the validity window
    const tokenKey = `${user.id}:${code}`;
    if (usedTotpTokens.has(tokenKey)) {
      return res.status(401).json({ message: "MFA code already used. Please wait for the next code." });
    }
    usedTotpTokens.set(tokenKey, Date.now() + 90_000);
    await storage.updateUser(user.id, { mfaEnabled: true } as any);
    await storage.createAuditLog({
      action: "MFA_ENABLED", entity: "user", entityId: user.id, userId: user.id,
      details: `MFA enabled for ${user.fullName}`,
      ipAddress: req.ip || null,
    });
    res.json({ message: "MFA enabled successfully" });
  } catch (e: any) {
    authLogger.error("MFA verify error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/mfa/disable", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Current password is required to disable MFA" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    await storage.updateUser(user.id, { mfaEnabled: false, mfaSecret: null } as any);
    await db.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, user.id));
    await storage.createAuditLog({
      action: "MFA_DISABLED", entity: "user", entityId: user.id, userId: user.id,
      details: `MFA disabled for user ${user.id.toString().slice(0,8)}...`,
      ipAddress: req.ip || null,
    });
    res.json({ message: "MFA disabled" });
  } catch (e: any) {
    authLogger.error("MFA disable error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});


// ── MFA backup codes ──────────────────────────────────────────────────────────

router.post("/api/auth/mfa/backup-codes/generate", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.mfaEnabled) return res.status(400).json({ message: "MFA must be enabled before generating backup codes" });

    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = generateBackupCode();
      codes.push(code);
    }
    await db.transaction(async (tx) => {
      await tx.delete(mfaBackupCodes).where(eq(mfaBackupCodes.userId, user.id));
      await tx.insert(mfaBackupCodes).values(codes.map((code) => ({
        userId: user.id,
        codeHash: hashCode(code),
      })));
    });

    await storage.createAuditLog({
      action: "MFA_BACKUP_CODES_GENERATED", entity: "user", entityId: user.id,
      userId: user.id, details: "8 MFA backup codes generated",
      ipAddress: req.ip || null,
    });
    res.json({ codes });
  } catch (e: any) {
    authLogger.error("Backup code generate error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/mfa/backup-codes/verify", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Backup code required" });

    // Identity MUST come from server-controlled session state only — never from
    // request body (prevents account takeover via arbitrary userId injection).
    // During MFA login challenge, mfaPendingUserId is set; for authenticated users
    // managing codes, session.userId is set.
    const userId = req.session?.mfaPendingUserId ?? req.session?.userId;
    if (!userId) return res.status(401).json({ message: "No active authentication session" });

    const user = await storage.getUser(userId);
    if (!user || user.status !== "active" || !user.mfaEnabled) {
      return res.status(401).json({ message: "Invalid MFA recovery session" });
    }

    const existingCodes = await db.select({ id: mfaBackupCodes.id })
      .from(mfaBackupCodes)
      .where(eq(mfaBackupCodes.userId, userId));
    if (existingCodes.length === 0) {
      return res.status(400).json({ message: "No backup codes exist for this account" });
    }

    const incoming = hashCode(code);
    // Consume exactly one still-valid code. The conditional update makes a
    // concurrent replay fail rather than granting two authenticated sessions.
    const consumed = await db.update(mfaBackupCodes)
      .set({ usedAt: new Date() })
      .where(and(
        eq(mfaBackupCodes.userId, userId),
        eq(mfaBackupCodes.codeHash, incoming),
        isNull(mfaBackupCodes.usedAt),
      ))
      .returning({ id: mfaBackupCodes.id });
    if (consumed.length === 0) {
      return res.status(401).json({ message: "Invalid or already-used backup code" });
    }

    const remaining = await db.select({ id: mfaBackupCodes.id })
      .from(mfaBackupCodes)
      .where(and(eq(mfaBackupCodes.userId, userId), isNull(mfaBackupCodes.usedAt)));

    // Complete the same login ceremony as TOTP: rotate the session ID and
    // restore every authorization scope, not merely a userId.
    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.allowedProducts = (user as any).allowedProducts ?? undefined;
      req.session.userDivision = (user as any).division || undefined;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();
      req.session.mfaChallengeComplete = true;

      let organization = null;
      if (user.organizationId) organization = await storage.getOrganization(user.organizationId);
      if (isPlatformPrivileged(user.role)) {
        delete req.session.viewingCountry;
      } else if (organization?.country) {
        req.session.userCountry = organization.country;
      }

      await storage.updateLastLogin(user.id);
      await storage.createAuditLog({
        action: "MFA_BACKUP_CODE_USED", entity: "user", entityId: user.id,
        userId: user.id, details: "Account recovered using MFA backup code",
        ipAddress: req.ip || null,
        organizationId: user.organizationId || undefined,
      });

      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ message: "Session error" });
        res.json({ message: "Account recovered successfully", remainingCodes: remaining.length });
      });
    });
  } catch (e: any) {
    authLogger.error("Backup code verify error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/auth/mfa/backup-codes/status", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const codes = await db.select({ usedAt: mfaBackupCodes.usedAt })
      .from(mfaBackupCodes)
      .where(eq(mfaBackupCodes.userId, req.session.userId));
    const available = codes.filter(c => c.usedAt === null).length;
    const total = codes.length;
    res.json({ generated: total > 0, available, total });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/auth/me", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const isE2ETestAuth = process.env.ENABLE_E2E_TEST_AUTH === "true"
    && process.env.NODE_ENV !== "production"
    && process.env.PRODUCTION_MODE !== "true";
  if (isE2ETestAuth && req.session._testRole) {
    const testRole = req.session._testRole;
    const viewingCountry = req.session.userCountry || null;
    return res.json({
      id: req.session.userId,
      email: `test-${testRole}@e2e.test`,
      role: testRole,
      country: viewingCountry,
      viewingCountry,
      passwordExpired: false,
      organization: null,
    });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) return res.status(401).json({ message: "User not found" });

  if (req.session.userRole !== user.role) {
    req.session.userRole = user.role;
    if (isPlatformPrivileged(user.role)) {
      delete req.session.viewingCountry;
    }
  }

  const userData = stripPassword(user);

  const passwordExpired = isPasswordExpired(user);

  let organization = null;
  if (user.organizationId) {
    organization = await storage.getOrganization(user.organizationId);
  }

  let viewingCountry: string | null = null;
  if (isPlatformPrivileged(user.role)) {
    viewingCountry = req.session.viewingCountry && req.session.viewingCountry !== "undefined" ? req.session.viewingCountry : null;
  } else {
    viewingCountry = req.session.userCountry || organization?.country || getActiveCountryName() || null;
  }
  res.json({ ...userData, passwordExpired, organization, viewingCountry });
});

// ── Guide-mode auto-login ────────────────────────────────────────────────────
// GET /api/auto-login?token=<MASTER_CONTROL_PASSWORD>[&as=demo_admin][&redirect=/dashboard]
// Instantly creates a full session for AI user-guide generation or teaching demos.
// Protected by MASTER_CONTROL_PASSWORD — never usable without the secret.
router.get("/api/auto-login", async (req, res) => {
  const MASTER = process.env.MASTER_CONTROL_PASSWORD;
  if (!MASTER) {
    return res.status(503).send("Auto-login is not configured (MASTER_CONTROL_PASSWORD not set).");
  }

  const supplied = (req.query.token as string) ?? "";
  if (!supplied || supplied !== MASTER) {
    return res.status(401).send("Invalid token.");
  }

  const username = (req.query.as as string) || "demo_admin";
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return res.status(404).send(`User "${username}" not found.`);
  }

  const redirect = (req.query.redirect as string) || "/choose-workspace";

  req.session.regenerate((err) => {
    if (err) return res.status(500).send("Session error.");
    req.session.userId          = user.id;
    req.session.userRole        = user.role;
    req.session.allowedProducts = (user as any).allowedProducts ?? undefined;
    req.session.lastActivity    = Date.now();
    // platform_owner / super_admin see all countries — clear any country lock
    delete req.session.viewingCountry;
    req.session.save(() => res.redirect(redirect));
  });
});

export default router;
