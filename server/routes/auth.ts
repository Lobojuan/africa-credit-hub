import { Router } from "express";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import { storage } from "../storage";
import { createLogger } from "../logger";
import { loginLimiter, stripPassword, safeErrorMessage } from "./middleware";
import { getActiveCountryName } from "../country-mode";

const authLogger = createLogger("auth");

const router = Router();

router.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
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
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await storage.lockUser(user.id, lockUntil);
        await storage.createAuditLog({
          action: "ACCOUNT_LOCKED", entity: "user", entityId: user.id,
          details: `Account locked after ${attempts} failed attempts`,
          ipAddress: req.ip || null,
        });
        return res.status(423).json({ message: "Account locked for 15 minutes after 3 failed attempts." });
      }

      return res.status(401).json({ message: `Invalid credentials. ${3 - attempts} attempt(s) remaining.` });
    }

    await storage.resetFailedAttempts(user.id);
    await storage.updateLastLogin(user.id);

    const { detectLoginAnomaly } = await import("../security-hardening");
    const loginIp = req.ip || req.socket.remoteAddress || "unknown";
    const anomalyResult = await detectLoginAnomaly(user.id, loginIp);

    if (user.mfaEnabled && user.mfaSecret) {
      req.session.mfaPendingUserId = user.id;
      return res.json({ requireMfa: true, userId: user.id });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userDivision = (user as any).division || undefined;
    req.session.organizationId = user.organizationId || undefined;
    req.session.lastActivity = Date.now();

    if (user.role === "super_admin") {
      delete req.session.viewingCountry;
    }

    let organization = null;
    if (user.organizationId) {
      organization = await storage.getOrganization(user.organizationId);
    }

    if (user.role !== "super_admin" && organization?.country) {
      req.session.userCountry = organization.country;
    }

    await storage.createAuditLog({
      action: "LOGIN", entity: "system", userId: user.id,
      details: `${user.fullName} logged in from IP ${loginIp}${anomalyResult.anomaly ? " [NEW IP - ANOMALY DETECTED]" : ""}`,
      ipAddress: loginIp,
      organizationId: user.organizationId || undefined,
    });

    let passwordExpired = false;
    if (user.mustChangePassword) {
      passwordExpired = true;
    } else if (user.passwordChangedAt) {
      const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      passwordExpired = daysSinceChange > 90;
    }

    let viewingCountry: string | null = null;
    if (user.role === "super_admin") {
      viewingCountry = null;
    } else {
      viewingCountry = organization?.country || getActiveCountryName() || null;
    }
    res.json({
      ...stripPassword(user),
      passwordExpired,
      organization,
      viewingCountry,
      ...(anomalyResult.anomaly ? { loginAnomaly: anomalyResult.reason } : {})
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
    const hashed = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(user.id, { password: hashed } as any);
    await storage.updatePasswordChangedAt(user.id);
    await pushPasswordHistory(user.id, oldHash);

    await storage.createAuditLog({
      action: "PASSWORD_CHANGE", entity: "user", entityId: user.id, userId: user.id,
      details: "Password changed successfully (history check passed)",
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
      issuer: "CDH Credit Registry",
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
    delete req.session.mfaPendingUserId;
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userDivision = (user as any).division || undefined;
    req.session.organizationId = user.organizationId || undefined;
    req.session.lastActivity = Date.now();
    if (user.role === "super_admin") {
      delete req.session.viewingCountry;
    }
    if (user.role !== "super_admin" && user.organizationId) {
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
    let passwordExpired = false;
    if (user.mustChangePassword) {
      passwordExpired = true;
    } else if (user.passwordChangedAt) {
      const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      passwordExpired = daysSinceChange > 90;
    }
    let organization = null;
    if (user.organizationId) {
      organization = await storage.getOrganization(user.organizationId);
    }
    let viewingCountry: string | null = null;
    if (user.role === "super_admin") {
      viewingCountry = null;
    } else {
      viewingCountry = organization?.country || getActiveCountryName() || null;
    }
    res.json({ ...stripPassword(user), passwordExpired, organization, viewingCountry });
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
      issuer: "CDH Credit Registry",
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
      issuer: "CDH Credit Registry",
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
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.updateUser(user.id, { mfaEnabled: false, mfaSecret: null } as any);
    await storage.createAuditLog({
      action: "MFA_DISABLED", entity: "user", entityId: user.id, userId: user.id,
      details: `MFA disabled for ${user.fullName}`,
      ipAddress: req.ip || null,
    });
    res.json({ message: "MFA disabled" });
  } catch (e: any) {
    authLogger.error("MFA disable error", e);
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/auth/review-access/:token", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

router.get("/api/auth/me", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user) return res.status(401).json({ message: "User not found" });

  if (req.session.userRole !== user.role) {
    req.session.userRole = user.role;
    if (user.role === "super_admin") {
      delete req.session.viewingCountry;
    }
  }

  const userData = stripPassword(user);

  const PASSWORD_EXPIRY_DAYS = 90;
  let passwordExpired = false;
  if (user.mustChangePassword) {
    passwordExpired = true;
  } else if (user.passwordChangedAt) {
    const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
    passwordExpired = daysSinceChange > PASSWORD_EXPIRY_DAYS;
  }

  let organization = null;
  if (user.organizationId) {
    organization = await storage.getOrganization(user.organizationId);
  }

  let viewingCountry: string | null = null;
  if (user.role === "super_admin") {
    viewingCountry = req.session.viewingCountry && req.session.viewingCountry !== "undefined" ? req.session.viewingCountry : null;
  } else {
    viewingCountry = req.session.userCountry || organization?.country || getActiveCountryName() || null;
  }
  res.json({ ...userData, passwordExpired, organization, viewingCountry });
});

export default router;
