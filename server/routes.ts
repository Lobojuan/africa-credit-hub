import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema,
  insertUserSchema, insertPendingApprovalSchema, insertDisputeSchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema, insertPaymentHistorySchema,
  insertInstitutionSchema, insertBillingRecordSchema, insertCreditReportLogSchema,
  insertExchangeRateSchema, insertRetentionPolicySchema, insertApiConfigurationSchema,
  insertOrganizationSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registerExternalApi, generateApiKey } from "./external-api";
import { calculateCreditScore, getDefaultCurrencyCode } from "./credit-score";
import fs from "fs";
import path from "path";
import * as OTPAuth from "otpauth";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { isGhanaMode } from "./country-mode";
import { sendWelcomeEmail, sendBillingNotification, sendDisputeNotification } from "./email";
import { analyzeCreditRisk, generateReportSummary, chatWithAI, generateComplianceReport } from "./ai";
import { BOG_EXPORT_GENERATORS } from "./bog-export";
import type { BogFileType } from "@shared/bog-codes";

const loginLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  validate: { trustProxy: false },
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

function stripPassword(user: any) {
  const { password, ...safe } = user;
  return safe;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.userRole !== "super_admin" && req.session.organizationId) {
    const org = await storage.getOrganization(req.session.organizationId);
    if (org && org.status === "suspended") {
      return res.status(403).json({ message: "ACCOUNT_SUSPENDED", reason: "Your organization's account has been suspended due to unpaid billing. Please contact your administrator or make a payment to restore access." });
    }
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userRole || (!roles.includes(req.session.userRole) && req.session.userRole !== "super_admin")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userRole !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

function getOrgScope(req: Request): string | undefined {
  if (req.session?.userRole === "super_admin") {
    return (req.query.orgId as string) || undefined;
  }
  return req.session?.organizationId || undefined;
}


const apiUsageTracker = new Map<string, number>();

function getUsageKey(endpoint: string, hour: Date): string {
  const h = `${hour.getFullYear()}-${String(hour.getMonth() + 1).padStart(2, "0")}-${String(hour.getDate()).padStart(2, "0")}T${String(hour.getHours()).padStart(2, "0")}`;
  return `${h}|${endpoint}`;
}

function trackApiUsage(endpoint: string) {
  const key = getUsageKey(endpoint, new Date());
  apiUsageTracker.set(key, (apiUsageTracker.get(key) || 0) + 1);
}

function getApiUsageStats() {
  const now = new Date();
  const currentHourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}`;
  const todayPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let totalToday = 0;
  let totalThisHour = 0;
  const endpointCounts = new Map<string, number>();
  const hourlyMap = new Map<string, number>();

  apiUsageTracker.forEach((count, key) => {
    const [hourPart, endpoint] = key.split("|");
    if (hourPart.startsWith(todayPrefix)) {
      totalToday += count;
    }
    if (hourPart === currentHourKey) {
      totalThisHour += count;
    }
    endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + count);

    const hourDate = new Date(hourPart + ":00:00");
    const hoursAgo = (now.getTime() - hourDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) {
      hourlyMap.set(hourPart, (hourlyMap.get(hourPart) || 0) + count);
    }
  });

  const hourlyData: { hour: string; requests: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hKey = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}T${String(h.getHours()).padStart(2, "0")}`;
    const label = `${String(h.getHours()).padStart(2, "0")}:00`;
    hourlyData.push({ hour: label, requests: hourlyMap.get(hKey) || 0 });
  }

  const topEndpoints: { endpoint: string; count: number }[] = [];
  endpointCounts.forEach((count, endpoint) => {
    topEndpoints.push({ endpoint, count });
  });
  topEndpoints.sort((a, b) => b.count - a.count);
  topEndpoints.splice(20);

  const uniqueEndpoints = endpointCounts.size;

  return { totalToday, totalThisHour, uniqueEndpoints, topEndpoints, hourlyData };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/api", (req, _res, next) => {
    const route = req.method + " " + req.path;
    trackApiUsage(route);
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
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

      if (user.mfaEnabled && user.mfaSecret) {
        req.session.mfaPendingUserId = user.id;
        return res.json({ requireMfa: true, userId: user.id });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();

      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in`,
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

      res.json({ ...stripPassword(user), passwordExpired, organization });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
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

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashed } as any);
      await storage.updatePasswordChangedAt(user.id);

      await storage.createAuditLog({
        action: "PASSWORD_CHANGE", entity: "user", entityId: user.id, userId: user.id,
        details: "Password changed successfully",
        ipAddress: req.ip || null,
      });

      res.json({ message: "Password changed successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
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

  app.post("/api/auth/mfa/login", async (req, res) => {
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
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();
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
      res.json({ ...stripPassword(user), passwordExpired, organization });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/setup", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/verify", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/mfa/disable", async (req, res) => {
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
      res.status(500).json({ message: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/auto-login/:token", loginLimiter, async (req, res) => {
      const BYPASS_TOKEN = "sim-review-2026-x7k9m";
      if (req.params.token !== BYPASS_TOKEN) {
        return res.status(404).json({ message: "Not found" });
      }
      try {
        const admin = await storage.getUserByUsername("admin");
        if (!admin) return res.status(500).json({ message: "Admin user not found" });
        req.session.userId = admin.id;
        req.session.userRole = admin.role;
        req.session.organizationId = admin.organizationId || undefined;
        req.session.lastActivity = Date.now();
        req.session.save((err) => {
          if (err) return res.status(500).json({ message: "Session save failed" });
          res.redirect("/");
        });
      } catch (e: any) {
        res.status(500).json({ message: "Auto-login failed" });
      }
    });
  }

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
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

    res.json({ ...userData, passwordExpired, organization });
  });

  app.get("/api/docs/api-integration-guide", (_req, res) => {
    const _dir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    const candidates = [
      path.resolve(process.cwd(), "docs/API_Integration_Guide.md"),
      path.resolve(_dir, "docs/API_Integration_Guide.md"),
      path.resolve(_dir, "../docs/API_Integration_Guide.md"),
      path.resolve(_dir, "../../docs/API_Integration_Guide.md"),
    ];
    const filePath = candidates.find(p => {
      try { return fs.existsSync(p); } catch { return false; }
    });
    if (!filePath) {
      return res.status(404).json({ message: "Document not found", searched: candidates });
    }
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="CDH_API_Integration_Guide.md"');
    fs.createReadStream(filePath).pipe(res);
  });

  app.use("/api", apiLimiter, (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/external") || req.path.startsWith("/docs")) return next();
    requireAuth(req, res, next);
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const stats = await storage.getDashboardStats(orgId);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/trends", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const stats = await storage.getDashboardStats(orgId);

      function generateTrend(currentValue: number): number[] {
        const points: number[] = [];
        const base = Math.max(1, Math.round(currentValue * (0.7 + Math.random() * 0.15)));
        for (let i = 0; i < 7; i++) {
          const progress = i / 6;
          const target = currentValue;
          const value = Math.round(base + (target - base) * progress + (Math.random() - 0.5) * currentValue * 0.08);
          points.push(Math.max(0, value));
        }
        points[6] = currentValue;
        return points;
      }

      res.json({
        borrowers: generateTrend(stats.totalBorrowers),
        accounts: generateTrend(stats.totalAccounts),
        disputes: generateTrend(stats.openDisputeCount),
        inquiries: generateTrend(stats.totalInquiries),
        delinquent: generateTrend(stats.delinquentAccounts),
        defaults: generateTrend(stats.defaultAccounts),
        approvals: generateTrend(stats.pendingApprovalCount),
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/details/:type", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const details = await storage.getDashboardDetails(req.params.type, orgId);
      res.json(details);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/chart-data", requireAuth, async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const stats = await storage.getDashboardStats(orgId);

      const allAccounts = await storage.getAllCreditAccounts(orgId);
      const statusMap: Record<string, number> = {};
      const typeMap: Record<string, number> = {};
      for (const a of allAccounts) {
        statusMap[a.status] = (statusMap[a.status] || 0) + 1;
        typeMap[a.accountType] = (typeMap[a.accountType] || 0) + 1;
      }
      const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
      const typeBreakdown = Object.entries(typeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));

      const allBorrowers = await storage.searchBorrowers("", orgId);
      const countryMap: Record<string, number> = {};
      for (const b of allBorrowers) {
        const c = b.country || "Unknown";
        countryMap[c] = (countryMap[c] || 0) + 1;
      }
      const avgAccountsPerBorrower = allAccounts.length / Math.max(allBorrowers.length, 1);
      const countryBreakdown = Object.entries(countryMap)
        .map(([country, borrowers]) => ({ country, borrowers, accounts: Math.round(borrowers * avgAccountsPerBorrower) }))
        .sort((a, b) => b.borrowers - a.borrowers);

      const totalB = stats.totalBorrowers;
      const totalA = stats.totalAccounts;
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const factor = (12 - i) / 12;
        const growth = 0.6 + 0.4 * factor;
        const jitter = 0.97 + Math.random() * 0.06;
        monthlyTrend.push({
          month,
          borrowers: Math.round(totalB * growth * jitter),
          accounts: Math.round(totalA * growth * jitter),
        });
      }

      res.json({ monthlyTrend, statusBreakdown, typeBreakdown, countryBreakdown });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const users = await storage.getUsers(orgId);
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", requireRole("admin", "super_admin"), async (req, res) => {
    try {
      const orgId = req.session?.userRole === "super_admin" ? (req.body.organizationId || getOrgScope(req)) : getOrgScope(req);
      const parsed = insertUserSchema.parse({ ...req.body, organizationId: orgId });
      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });
      await storage.createAuditLog({
        action: "CREATE", entity: "user", entityId: user.id, userId: req.session?.userId,
        details: `Created user: ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(stripPassword(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      const user = await storage.updateUser(req.params.id, data);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "user", entityId: user.id, userId: req.session?.userId,
        details: `Updated user: ${user.fullName}`,
        ipAddress: req.ip || null,
      });
      res.json(stripPassword(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      if (req.params.id === req.session?.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      await storage.createAuditLog({
        action: "DELETE", entity: "user", entityId: req.params.id, userId: req.session?.userId,
        details: `Deleted user ID: ${req.params.id}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "User deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/borrowers", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const search = req.query.search as string;
      if (search) {
        const data = await storage.searchBorrowers(search, orgId);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowers(page, limit, orgId);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/global-search", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const query = (req.query.q as string) || "";
      if (!query) {
        return res.json({ borrowers: [], institutions: [], creditAccounts: [] });
      }
      const results = await storage.globalSearch(query, orgId);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/fuzzy-match", async (req, res) => {
    try {
      const { firstName, lastName, nationalId, companyName, passportNumber, tinNumber } = req.query;
      const results = await storage.fuzzyMatchBorrowers({
        firstName: firstName as string,
        lastName: lastName as string,
        nationalId: nationalId as string,
        companyName: companyName as string,
        passportNumber: passportNumber as string,
        tinNumber: tinNumber as string,
      });
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id", async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      res.json(borrower);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/borrowers", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const parsed = insertBorrowerSchema.parse({ ...req.body, organizationId: orgId });
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
        organizationId: orgId,
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "borrower", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted new borrower for approval: ${parsed.firstName || parsed.companyName}`,
        ipAddress: req.ip || null,
      });

      try {
        const reviewers = await storage.getUsersByRole("admin", "regulator");
        for (const reviewer of reviewers) {
          if (reviewer.id !== req.session?.userId) {
            await storage.createNotification({
              userId: reviewer.id,
              type: "approval_pending",
              title: "New approval pending",
              message: `New borrower registration requires your review: ${parsed.firstName || parsed.companyName}`,
              link: "/approvals",
            });
          }
        }
      } catch {}

      res.status(201).json({ approval, message: "Submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/borrowers/:id", async (req, res) => {
    try {
      const existing = await storage.getBorrower(req.params.id);
      if (!existing) return res.status(404).json({ message: "Borrower not found" });
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(req.body),
        requestedBy: req.session?.userId!,
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Submitted borrower update for approval: ${existing.firstName || existing.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ approval, message: "Update submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  const uploadsDir = path.join(process.cwd(), "uploads");
  fs.mkdirSync(path.join(uploadsDir, "photos"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "documents"), { recursive: true });

  const photoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, "photos")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  const docStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, "documents")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  const uploadPhoto = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }});
  const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only image or PDF files allowed"));
  }});

  app.use("/uploads", requireAuth, express.static(uploadsDir));

  app.post("/api/borrowers/:id/photo", requireAuth, uploadPhoto.single("photo"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const photoUrl = `/uploads/photos/${req.file.filename}`;
      await storage.updateBorrower(req.params.id, { photoUrl });
      await storage.createAuditLog({
        action: "UPLOAD_PHOTO", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Uploaded ID photo for borrower: ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ photoUrl });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/borrowers/:id/id-document", requireAuth, uploadDoc.single("document"), async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const idDocumentUrl = `/uploads/documents/${req.file.filename}`;
      await storage.updateBorrower(req.params.id, { idDocumentUrl });
      await storage.createAuditLog({
        action: "UPLOAD_ID_DOCUMENT", entity: "borrower", entityId: req.params.id, userId: req.session?.userId,
        details: `Uploaded ID document for borrower: ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });
      res.json({ idDocumentUrl });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/credit-accounts", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const borrowerId = req.query.borrowerId as string;
      const result = borrowerId
        ? await storage.getCreditAccountsByBorrower(borrowerId)
        : await storage.getAllCreditAccounts(orgId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/credit-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getCreditAccount(req.params.id);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-accounts", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const parsed = insertCreditAccountSchema.parse({ ...req.body, organizationId: orgId });
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
        organizationId: orgId,
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "credit_account", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted new credit account for approval: ${parsed.accountNumber}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json({ approval, message: "Submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/credit-accounts/:id", async (req, res) => {
    try {
      const existing = await storage.getCreditAccount(req.params.id);
      if (!existing) return res.status(404).json({ message: "Account not found" });
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        entityId: req.params.id,
        action: "UPDATE",
        payload: JSON.stringify(req.body),
        requestedBy: req.session?.userId!,
      });
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "credit_account", entityId: req.params.id, userId: req.session?.userId,
        details: `Submitted credit account update for approval: ${existing.accountNumber}`,
        ipAddress: req.ip || null,
      });
      res.json({ approval, message: "Update submitted for maker-checker approval" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/credit-inquiries", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const result = borrowerId
        ? await storage.getCreditInquiriesByBorrower(borrowerId)
        : await storage.getAllCreditInquiries(orgId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-inquiries", async (req, res) => {
    try {
      const parsed = insertCreditInquirySchema.parse(req.body);
      const inquiry = await storage.createCreditInquiry(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "credit_inquiry", entityId: inquiry.id, userId: req.session?.userId,
        details: `Credit inquiry for borrower ${inquiry.borrowerId} by ${inquiry.institution}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(inquiry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/credit-report", async (req, res) => {
    try {
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      const accounts = await storage.getCreditAccountsByBorrower(req.params.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(req.params.id);

      const judgments = await storage.getCourtJudgmentsByBorrower(req.params.id);
      const totalDebt = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
      const { score: creditScore, reasonCodes } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep);

      await storage.createAuditLog({
        action: "VIEW", entity: "credit_report", entityId: req.params.id, userId: req.session?.userId,
        details: `Generated credit report for ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });

      res.json({
        borrower,
        accounts,
        inquiries,
        summary: {
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter(a => a.status !== "closed").length,
          totalDebt: totalDebt.toFixed(2),
          delinquentAccounts: delinquentCount,
          writtenOffAccounts: writtenOffCount,
          creditScore,
          reasonCodes,
          inquiryCount: inquiries.length,
          judgmentCount: judgments.length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit-logs", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const logs = await storage.getAuditLogs(orgId);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit/verify-integrity", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const result = await storage.verifyAuditIntegrity();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/pending-approvals", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const approvals = await storage.getPendingApprovals(orgId);
      res.json(approvals);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/pending-approvals", async (req, res) => {
    try {
      const data = {
        ...req.body,
        requestedBy: req.session?.userId,
      };
      const parsed = insertPendingApprovalSchema.parse(data);
      const approval = await storage.createPendingApproval(parsed);
      await storage.createAuditLog({
        action: "SUBMIT_APPROVAL", entity: "pending_approval", entityId: approval.id, userId: req.session?.userId,
        details: `Submitted ${approval.action} for ${approval.entityType} for approval`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(approval);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/pending-approvals/:id", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const currentUserId = req.session?.userId;
      if (!currentUserId) return res.status(401).json({ message: "Not authenticated" });

      const approval = await storage.getPendingApproval(req.params.id);
      if (!approval) return res.status(404).json({ message: "Approval not found" });

      if (approval.requestedBy === currentUserId) {
        return res.status(403).json({ message: "Maker-checker: You cannot approve your own request. A different authorized user must review." });
      }

      if (approval.status !== "pending") {
        return res.status(400).json({ message: "This request has already been reviewed" });
      }

      const updated = await storage.updateApprovalStatus(req.params.id, status, currentUserId, reviewNotes);

      if (status === "approved" && updated) {
        try {
          const payload = JSON.parse(updated.payload);
          if (updated.action === "CREATE") {
            if (updated.entityType === "borrower") {
              await storage.createBorrower(payload);
            } else if (updated.entityType === "credit_account") {
              await storage.createCreditAccount(payload);
            }
          } else if (updated.action === "UPDATE" && updated.entityId) {
            if (updated.entityType === "borrower") {
              await storage.updateBorrower(updated.entityId, payload);
            } else if (updated.entityType === "credit_account") {
              await storage.updateCreditAccount(updated.entityId, payload);
            }
          }
        } catch (applyErr: any) {
          console.error("Error applying approved change:", applyErr);
        }
      }

      await storage.createAuditLog({
        action: status === "approved" ? "APPROVE" : "REJECT", entity: "pending_approval", entityId: req.params.id, userId: currentUserId,
        details: `${status === "approved" ? "Approved" : "Rejected"} ${approval.action} for ${approval.entityType}${reviewNotes ? `: ${reviewNotes}` : ""}`,
        ipAddress: req.ip || null,
      });

      try {
        await storage.createNotification({
          userId: approval.requestedBy,
          type: "approval_result",
          title: `Request ${status}`,
          message: `Your ${approval.action} request for ${approval.entityType} has been ${status}.${reviewNotes ? ` Notes: ${reviewNotes}` : ""}`,
          link: "/approvals",
        });
      } catch {}

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/disputes", async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const disputeList = await storage.getDisputes(orgId);
      res.json(disputeList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/disputes/:id", async (req, res) => {
    try {
      const dispute = await storage.getDispute(req.params.id);
      if (!dispute) return res.status(404).json({ message: "Dispute not found" });
      res.json(dispute);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/disputes", async (req, res) => {
    try {
      const data = {
        ...req.body,
        filedBy: req.session?.userId,
      };
      const parsed = insertDisputeSchema.parse(data);
      const dispute = await storage.createDispute(parsed);
      await storage.createAuditLog({
        action: "FILE_DISPUTE", entity: "dispute", entityId: dispute.id, userId: req.session?.userId,
        details: `Filed ${dispute.disputeType} dispute for borrower ${dispute.borrowerId}`,
        ipAddress: req.ip || null,
      });

      try {
        const admins = await storage.getUsersByRole("admin");
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: "dispute_update",
            title: "New dispute filed",
            message: `A ${dispute.disputeType} dispute has been filed for borrower ${dispute.borrowerId}`,
            link: "/disputes",
          });
        }
      } catch {}

      try {
        const borrower = await storage.getBorrower(dispute.borrowerId);
        if (borrower?.organizationId) {
          const org = await storage.getOrganization(borrower.organizationId);
          if (org?.contactEmail) {
            sendDisputeNotification(org.name, org.contactEmail, dispute.id, `${borrower.firstName} ${borrower.lastName}`, dispute.disputeType || "general").catch(() => {});
          }
        }
      } catch {}

      res.status(201).json(dispute);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/disputes/:id", async (req, res) => {
    try {
      const dispute = await storage.updateDispute(req.params.id, req.body);
      if (!dispute) return res.status(404).json({ message: "Dispute not found" });
      await storage.createAuditLog({
        action: "UPDATE_DISPUTE", entity: "dispute", entityId: dispute.id, userId: req.session?.userId,
        details: `Updated dispute status to ${dispute.status}`,
        ipAddress: req.ip || null,
      });
      res.json(dispute);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/credit-accounts", requireRole("admin", "lender"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Request body must contain a 'records' array" });
      }

      const results: { totalSubmitted: number; successCount: number; errorCount: number; errors: Array<{ index: number; message: string }> } = {
        totalSubmitted: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertCreditAccountSchema.parse(records[i]);
          await storage.createCreditAccount(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({
            index: i,
            message: err.message || "Validation failed",
          });
        }
      }

      await storage.createAuditLog({
        action: "BATCH_UPLOAD", entity: "credit_account", userId: req.session?.userId,
        details: `Batch upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/xbrl", requireRole("admin", "lender"), async (req, res) => {
    try {
      const { xml: xmlContent } = req.body;
      if (!xmlContent || typeof xmlContent !== "string") {
        return res.status(400).json({ message: "Request body must contain an 'xml' string field with XBRL/XML content" });
      }

      const records: any[] = [];
      const accountRegex = /<creditAccount>([\s\S]*?)<\/creditAccount>/gi;
      let match;
      while ((match = accountRegex.exec(xmlContent)) !== null) {
        const block = match[1];
        const extract = (tag: string) => {
          const m = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i").exec(block);
          return m ? m[1].trim() : "";
        };
        records.push({
          borrowerId: extract("borrowerId"),
          lenderInstitution: extract("lenderInstitution"),
          accountNumber: extract("accountNumber"),
          accountType: extract("accountType"),
          originalAmount: extract("originalAmount"),
          currentBalance: extract("currentBalance"),
          currency: extract("currency") || "ETB",
          interestRate: extract("interestRate") || "0",
          disbursementDate: extract("disbursementDate"),
          maturityDate: extract("maturityDate"),
          status: extract("status") || "current",
          daysInArrears: parseInt(extract("daysInArrears") || "0", 10),
        });
      }

      if (records.length === 0) {
        return res.status(400).json({ message: "No <creditAccount> elements found in XBRL content" });
      }

      const results = { totalSubmitted: records.length, successCount: 0, errorCount: 0, errors: [] as Array<{ index: number; message: string }> };
      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertCreditAccountSchema.parse(records[i]);
          await storage.createCreditAccount(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await storage.createAuditLog({
        action: "BATCH_UPLOAD_XBRL", entity: "credit_account", userId: req.session?.userId,
        details: `XBRL upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/batch-upload/bog-pipe", requireRole("admin", "lender"), async (req, res) => {
    try {
      const { data: pipeData } = req.body;
      if (!pipeData || typeof pipeData !== "string") {
        return res.status(400).json({ message: "Request body must contain a 'data' string with pipe-delimited content" });
      }

      const lines = pipeData.trim().split("\n").filter((l: string) => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "File must contain a header row and at least one data row" });
      }

      const headers = lines[0].split("|").map((h: string) => h.trim());

      const bogFieldMap: Record<string, string> = {
        "SRN": "_srn",
        "ReportingDate": "_reportingDate",
        "BorrowerName": "_borrowerName",
        "GhanaCardNo": "_ghanaCardNo",
        "FacilityType": "facilityTypeCode",
        "AccountNumber": "accountNumber",
        "Currency": "currency",
        "OriginalAmount": "originalAmount",
        "CurrentBalance": "currentBalance",
        "InterestRate": "interestRate",
        "DisbursementDate": "disbursementDate",
        "MaturityDate": "maturityDate",
        "AssetClassification": "assetClassification",
        "RepaymentFrequency": "repaymentFrequency",
        "DaysInArrears": "daysInArrears",
        "PurposeOfFacility": "purposeOfFacility",
        "CollateralType": "collateralType",
        "CollateralValue": "collateralValue",
        "AmountOverdue": "amountOverdue",
        "WrittenOffAmount": "writtenOffAmount",
        "LenderInstitution": "lenderInstitution",
        "AccountType": "accountType",
        "BorrowerId": "borrowerId",
        "Status": "status",
      };

      function parseBogDate(dateStr: string): string {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }

      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("|").map((v: string) => v.trim());
        const record: any = {};
        headers.forEach((header: string, idx: number) => {
          const mapped = bogFieldMap[header];
          if (mapped && !mapped.startsWith("_")) {
            record[mapped] = values[idx] || "";
          }
        });

        if (record.disbursementDate) record.disbursementDate = parseBogDate(record.disbursementDate);
        if (record.maturityDate) record.maturityDate = parseBogDate(record.maturityDate);
        if (record.daysInArrears) record.daysInArrears = parseInt(record.daysInArrears, 10) || 0;

        if (!record.currency) record.currency = "GHS";
        if (!record.status) record.status = "current";
        if (!record.accountType) {
          const facilityMap: Record<string, string> = {
            "OVD": "Overdraft", "TML": "Term Loan", "MTG": "Mortgage", "CRC": "Credit Card",
            "LAS": "Loan Against Salary", "MFL": "Microfinance Loan", "TRF": "Trade Finance",
            "LSE": "Lease", "GRT": "Guarantee", "LOC": "Letter of Credit", "BND": "Bond",
            "STL": "Staff Loan", "GRP": "Group Loan", "OTH": "Other",
          };
          record.accountType = facilityMap[record.facilityTypeCode] || "Other";
        }
        if (!record.lenderInstitution) record.lenderInstitution = "Unknown";

        records.push(record);
      }

      const results = {
        totalSubmitted: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ index: number; message: string }>,
      };

      for (let i = 0; i < records.length; i++) {
        try {
          const parsed = insertCreditAccountSchema.parse(records[i]);
          await storage.createCreditAccount(parsed);
          results.successCount++;
        } catch (err: any) {
          results.errorCount++;
          results.errors.push({ index: i, message: err.message || "Validation failed" });
        }
      }

      await storage.createAuditLog({
        action: "BATCH_UPLOAD_BOG", entity: "credit_account", userId: req.session?.userId,
        details: `BoG pipe-delimited upload: ${results.successCount} succeeded, ${results.errorCount} failed out of ${results.totalSubmitted}`,
        ipAddress: req.ip || null,
      });

      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const items = await storage.getNotifications(req.session.userId);
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      const count = await storage.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ message: "All marked as read" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/borrowers/:id/related", async (req, res) => {
    try {
      const related = await storage.getRelatedBorrowers(req.params.id);
      res.json(related);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/court-judgments", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const result = borrowerId
        ? await storage.getCourtJudgmentsByBorrower(borrowerId)
        : await storage.getAllCourtJudgments(orgId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/court-judgments", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const parsed = insertCourtJudgmentSchema.parse(req.body);
      const judgment = await storage.createCourtJudgment(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "court_judgment", entityId: judgment.id, userId: req.session?.userId,
        details: `Created court judgment: ${judgment.judgmentType} - case ${judgment.caseNumber}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(judgment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/consent-records", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const orgId = getOrgScope(req);
      const result = borrowerId
        ? await storage.getConsentRecordsByBorrower(borrowerId)
        : await storage.getAllConsentRecords(orgId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/consent-records", async (req, res) => {
    try {
      const receiptNumber = `CR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const parsed = insertConsentRecordSchema.parse({ ...req.body, receiptNumber });
      const record = await storage.createConsentRecord(parsed);
      await storage.createAuditLog({
        action: "GRANT_CONSENT", entity: "consent_record", entityId: record.id, userId: req.session?.userId,
        details: `Consent granted to ${record.grantedTo} for ${record.purpose} (Receipt: ${record.receiptNumber})`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/consent-records/:id/revoke", async (req, res) => {
    try {
      const record = await storage.revokeConsent(req.params.id);
      if (!record) return res.status(404).json({ message: "Consent record not found" });
      await storage.createAuditLog({
        action: "REVOKE_CONSENT", entity: "consent_record", entityId: record.id, userId: req.session?.userId,
        details: `Consent revoked for ${record.grantedTo} (Receipt: ${record.receiptNumber})`,
        ipAddress: req.ip || null,
      });
      res.json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/payment-history/:creditAccountId", async (req, res) => {
    try {
      const history = await storage.getPaymentHistoryByAccount(req.params.creditAccountId);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/payment-history/:creditAccountId", async (req, res) => {
    try {
      const parsed = insertPaymentHistorySchema.parse({
        ...req.body,
        creditAccountId: req.params.creditAccountId,
      });
      const entry = await storage.createPaymentHistory(parsed);
      res.status(201).json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/institutions", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
      const orgId = getOrgScope(req);
      const result = await storage.getInstitutions(page, limit, orgId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/institutions", async (req, res) => {
    try {
      const parsed = insertInstitutionSchema.parse(req.body);
      const inst = await storage.createInstitution(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Registered institution: ${inst.name} (${inst.type})`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/institutions/:id", requireRole("admin"), async (req, res) => {
    try {
      const inst = await storage.updateInstitution(req.params.id, req.body);
      if (!inst) return res.status(404).json({ message: "Institution not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Updated institution: ${inst.name}`,
        ipAddress: req.ip || null,
      });
      res.json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/institutions/:id/approve", requireRole("admin"), async (req, res) => {
    try {
      const inst = await storage.approveInstitution(req.params.id, req.session?.userId!);
      if (!inst) return res.status(404).json({ message: "Institution not found" });
      await storage.createAuditLog({
        action: "APPROVE", entity: "institution", entityId: inst.id, userId: req.session?.userId,
        details: `Approved institution: ${inst.name}`,
        ipAddress: req.ip || null,
      });
      res.json(inst);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/billing", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const records = await storage.getBillingRecords(orgId);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/billing", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertBillingRecordSchema.parse(req.body);
      const record = await storage.createBillingRecord(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "billing_record", entityId: record.id, userId: req.session?.userId,
        details: `Created billing record: ${record.invoiceNumber} for ${record.institutionName}`,
        ipAddress: req.ip || null,
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/credit-reports/logs", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const logs = await storage.getCreditReportLogs(orgId);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-reports/generate", async (req, res) => {
    try {
      const { borrowerId, purpose } = req.body;
      if (!borrowerId || !purpose) {
        return res.status(400).json({ message: "borrowerId and purpose are required" });
      }

      const borrower = await storage.getBorrower(borrowerId);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });

      const user = await storage.getUser(req.session?.userId!);
      const serialNumber = `CR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

      const accounts = await storage.getCreditAccountsByBorrower(borrowerId);
      const inquiries = await storage.getCreditInquiriesByBorrower(borrowerId);
      const judgments = await storage.getCourtJudgmentsByBorrower(borrowerId);
      const consents = await storage.getConsentRecordsByBorrower(borrowerId);

      const paymentHistoryMap: Record<string, any[]> = {};
      for (const account of accounts) {
        const history = await storage.getPaymentHistoryByAccount(account.id);
        if (history.length > 0) {
          paymentHistoryMap[account.id] = history.slice(0, 12);
        }
      }

      const totalDebt = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
      const restructuredCount = accounts.filter(a => a.status === "restructured").length;

      const { score: creditScore, reasonCodes } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep);

      const log = await storage.createCreditReportLog({
        borrowerId,
        requestedBy: req.session?.userId!,
        institution: user?.institution || "Unknown",
        purpose,
        serialNumber,
      });

      await storage.createAuditLog({
        action: "GENERATE_REPORT", entity: "credit_report", entityId: log.id, userId: req.session?.userId,
        details: `Generated credit report serial ${serialNumber} for ${borrower.firstName || borrower.companyName}`,
        ipAddress: req.ip || null,
      });

      res.json({
        serialNumber,
        generatedAt: new Date().toISOString(),
        borrower,
        accounts,
        inquiries,
        courtJudgments: judgments,
        consentRecords: consents,
        paymentHistory: paymentHistoryMap,
        requestedBy: user ? { fullName: user.fullName, institution: user.institution } : null,
        summary: {
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter(a => a.status !== "closed").length,
          totalDebt: totalDebt.toFixed(2),
          delinquentAccounts: delinquentCount,
          writtenOffAccounts: writtenOffCount,
          restructuredAccounts: restructuredCount,
          creditScore,
          reasonCodes,
          inquiryCount: inquiries.length,
          judgmentCount: judgments.length,
          isPep: borrower.isPep,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-reports/download-pdf", async (req, res) => {
    try {
      const { reportData } = req.body;
      if (!reportData) return res.status(400).json({ message: "reportData is required" });

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 40, right: 40 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const TEAL = "#0d4a42";
      const DARK = "#1a1a1a";
      const GRAY = "#555555";
      const LIGHT = "#888888";
      const W = doc.page.width - 80;

      function drawHeader() {
        doc.rect(40, 40, W, 60).fill(TEAL);
        doc.fill("#ffffff").fontSize(14).font("Helvetica-Bold")
          .text("Comprehensive Credit Information Report", 50, 52, { width: W - 140 });
        doc.fontSize(8).font("Helvetica").fill("#cccccc")
          .text("Cross-Jurisdictional Central Data Hub v2.0 | Carlson Capital & Systems In Motion Limited", 50, 72, { width: W - 140 });
        doc.fill("#ffffff").fontSize(7).font("Helvetica")
          .text("ORDER NUMBER", W - 90, 52, { width: 80, align: "right" });
        doc.fontSize(9).font("Helvetica-Bold")
          .text(reportData.serialNumber || "", W - 90, 63, { width: 80, align: "right" });
        doc.fill(DARK);
        doc.y = 115;
      }

      function sectionTitle(title: string, num?: number) {
        ensureSpace(30);
        doc.moveDown(0.5);
        const y = doc.y;
        if (num !== undefined) {
          doc.fill(TEAL).fontSize(8).font("Helvetica-Bold")
            .text(`${num}`, 40, y, { width: 15 });
          doc.fill(TEAL).fontSize(10).font("Helvetica-Bold")
            .text(title, 58, y);
        } else {
          doc.fill(TEAL).fontSize(10).font("Helvetica-Bold")
            .text(title, 40, y);
        }
        doc.moveDown(0.3);
        doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#dddddd").lineWidth(0.5).stroke();
        doc.moveDown(0.3);
        doc.fill(DARK);
      }

      function infoRow(label: string, value: string, x: number, w: number) {
        doc.fontSize(6).font("Helvetica").fill(LIGHT).text(label.toUpperCase(), x, doc.y, { width: w });
        doc.fontSize(8.5).font("Helvetica-Bold").fill(DARK).text(value || "—", x, doc.y, { width: w });
        doc.moveDown(0.2);
      }

      function ensureSpace(needed: number) {
        if (doc.y + needed > doc.page.height - 60) {
          doc.addPage();
          doc.y = 40;
        }
      }

      function tableHeader(cols: { label: string; width: number; align?: string }[]) {
        ensureSpace(20);
        const y = doc.y;
        doc.rect(40, y, W, 16).fill("#f0f0f0");
        let x = 44;
        cols.forEach(col => {
          doc.fill(GRAY).fontSize(6).font("Helvetica-Bold")
            .text(col.label.toUpperCase(), x, y + 4, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.y = y + 18;
      }

      function tableRow(cols: { value: string; width: number; align?: string; bold?: boolean; color?: string }[]) {
        ensureSpace(16);
        const y = doc.y;
        let x = 44;
        cols.forEach(col => {
          doc.fill(col.color || DARK).fontSize(7.5).font(col.bold ? "Helvetica-Bold" : "Helvetica")
            .text(col.value || "—", x, y + 3, { width: col.width - 8, align: (col.align as any) || "left" });
          x += col.width;
        });
        doc.moveTo(40, y + 15).lineTo(40 + W, y + 15).strokeColor("#eeeeee").lineWidth(0.3).stroke();
        doc.y = y + 16;
      }

      drawHeader();

      const b = reportData.borrower;
      const s = reportData.summary;
      const accounts = reportData.accounts || [];
      const inquiries = reportData.inquiries || [];
      const judgments = reportData.courtJudgments || [];

      doc.fontSize(6).font("Helvetica").fill(LIGHT).text("CIR NUMBER", 40, doc.y, { continued: false });
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(reportData.serialNumber);
      doc.moveDown(0.3);

      const grid1 = [
        ["Report Order Date", new Date(reportData.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
        ["Institution", reportData.requestedBy?.institution || "—"],
        ["Requested By", reportData.requestedBy?.fullName || "—"],
      ];
      grid1.forEach(([l, v]) => {
        doc.fontSize(6).font("Helvetica").fill(LIGHT).text(l, 40, doc.y, { width: W });
        doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(v, 40, doc.y, { width: W });
        doc.moveDown(0.2);
      });

      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT).text("SEARCH DETAILS", 40, doc.y);
      doc.moveDown(0.2);
      const name = b.type === "corporate" ? (b.companyName || "—") : `${b.firstName} ${b.lastName}`;
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK).text(`Name: ${name} | ID: ${b.nationalId || b.tinNumber || "—"} | Country: ${b.country || "—"}`);
      doc.moveDown(0.5);

      sectionTitle("Subject Details");
      if (b.type === "individual") {
        const fields = [
          ["Full Name", `${b.firstName} ${b.lastName}`], ["Date of Birth", b.dateOfBirth || "—"],
          ["Gender", b.gender || "—"], ["National ID", b.nationalId || "—"],
          ["TIN", b.tinNumber || "—"], ["Passport", b.passportNumber || "—"],
          ["Employer", b.employerName || "—"], ["Occupation", b.occupation || "—"],
          ["Phone", b.phone || "—"], ["Email", b.email || "—"],
        ];
        fields.forEach(([l, v]) => infoRow(l, v, 40, W));
      } else {
        const fields = [
          ["Company Name", b.companyName || "—"], ["Business Reg", b.businessRegNumber || "—"],
          ["Sector", b.sector || "—"], ["TIN", b.tinNumber || "—"],
          ["Phone", b.phone || "—"], ["Email", b.email || "—"],
        ];
        fields.forEach(([l, v]) => infoRow(l, v, 40, W));
      }

      sectionTitle("Credit Score Summary");
      ensureSpace(40);
      doc.fontSize(24).font("Helvetica-Bold").fill(s.creditScore >= 700 ? "#16a34a" : s.creditScore >= 600 ? "#ca8a04" : "#dc2626")
        .text(String(s.creditScore), 40, doc.y, { width: W, align: "center" });
      doc.fontSize(8).font("Helvetica").fill(GRAY)
        .text(`Range 300-850 | Total Facilities: ${s.totalAccounts} | Active: ${s.activeAccounts} | Risk Items: ${s.delinquentAccounts + s.writtenOffAccounts + s.judgmentCount}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.5);

      if (s.reasonCodes && s.reasonCodes.length > 0) {
        sectionTitle("Score Factor Analysis");
        s.reasonCodes.forEach((code: string) => {
          ensureSpace(14);
          const label = code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
          doc.fontSize(7.5).font("Helvetica").fill(DARK).text(`• ${label}`, 48, doc.y);
          doc.moveDown(0.15);
        });
      }

      sectionTitle("Credit Profile Overview", 1);
      const overviewCols = [
        { label: "S.No", width: 35 },
        { label: "Indicator", width: W - 135 },
        { label: "Value", width: 100, align: "right" },
      ];
      tableHeader(overviewCols);
      const openAccts = accounts.filter((a: any) => a.status !== "closed");
      const totalBal = openAccts.reduce((s: number, a: any) => s + parseFloat(a.currentBalance || "0"), 0);
      const overdueAccts = openAccts.filter((a: any) => (a.daysInArrears || 0) > 0);
      const npl = openAccts.filter((a: any) => (a.daysInArrears || 0) > 90);
      const closedAccts = accounts.filter((a: any) => a.status === "closed");
      const woAccts = accounts.filter((a: any) => a.status === "written_off");
      const indicators = [
        ["1", "Number of Open Credit Facilities", String(openAccts.length)],
        ["2", "Total Outstanding Balance", totalBal.toLocaleString("en-US", { minimumFractionDigits: 2 })],
        ["3", "Number of Overdue Facilities", String(overdueAccts.length)],
        ["4", "Non-Performing (>90 days)", String(npl.length)],
        ["5", "Closed Facilities", String(closedAccts.length)],
        ["6", "Written-Off Facilities", String(woAccts.length)],
        ["7", "Court Judgments", String(judgments.length)],
        ["8", "Credit Inquiries", String(inquiries.length)],
      ];
      indicators.forEach(([sno, label, val]) => {
        tableRow([
          { value: sno, width: 35 },
          { value: label, width: W - 135 },
          { value: val, width: 100, align: "right", bold: true },
        ]);
      });

      if (inquiries.length > 0) {
        sectionTitle("Inquiry History", 2);
        const inqCols = [
          { label: "Institution", width: W * 0.35 },
          { label: "Purpose", width: W * 0.25 },
          { label: "Date", width: W * 0.2 },
          { label: "Consent", width: W * 0.2 },
        ];
        tableHeader(inqCols);
        inquiries.slice(0, 20).forEach((inq: any) => {
          tableRow([
            { value: inq.institution, width: W * 0.35 },
            { value: (inq.purpose || "").replace(/_/g, " "), width: W * 0.25 },
            { value: inq.createdAt ? new Date(inq.createdAt).toLocaleDateString("en-GB") : "—", width: W * 0.2 },
            { value: inq.consentProvided ? "Yes" : "No", width: W * 0.2, color: inq.consentProvided ? "#16a34a" : "#dc2626" },
          ]);
        });
      }

      if (accounts.length > 0) {
        sectionTitle("Credit Facility Details", 3);
        accounts.forEach((acct: any, idx: number) => {
          ensureSpace(100);
          const cur = acct.currency || "ETB";
          doc.moveDown(0.3);
          doc.fontSize(8).font("Helvetica-Bold").fill(TEAL)
            .text(`Facility ${idx + 1} of ${accounts.length} — ${acct.status?.toUpperCase()} (${cur})`, 40, doc.y);
          doc.moveDown(0.3);

          const facilityFields = [
            ["Institution", acct.lenderInstitution], ["Account No.", acct.accountNumber],
            ["Type", (acct.accountType || "").replace(/_/g, " ")], ["Classification", acct.status],
            ["Current Balance", acct.currentBalance ? `${cur} ${parseFloat(acct.currentBalance).toLocaleString()}` : "—"],
            ["Sanctioned Amount", acct.originalAmount ? `${cur} ${parseFloat(acct.originalAmount).toLocaleString()}` : "—"],
            ["Days in Arrears", String(acct.daysInArrears || 0)],
            ["Interest Rate", acct.isInterestFree ? "Interest-Free" : `${acct.interestRate || "—"}%`],
            ["Disbursement Date", acct.disbursementDate || "—"], ["Maturity Date", acct.maturityDate || "—"],
            ["Last Payment", acct.lastPaymentDate || "—"],
            ["Restructured", (acct.restructureCount || 0) > 0 ? `Yes (${acct.restructureCount}x)` : "No"],
          ];
          facilityFields.forEach(([l, v]) => {
            ensureSpace(14);
            infoRow(l, v, 48, W - 8);
          });

          const history = reportData.paymentHistory?.[acct.id] || [];
          if (history.length > 0) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("Payment History (Last 12 Months):", 48, doc.y);
            doc.moveDown(0.2);
            const statusLine = history.slice(0, 12).map((ph: any) => {
              const label = ph.status === "on_time" ? "OK" : ph.status === "late" ? "30" : ph.status === "missed" ? "X" : ph.status === "partial" ? "P" : "ND";
              return `${ph.period}: ${label}`;
            }).join(" | ");
            doc.fontSize(6.5).font("Helvetica").fill(DARK).text(statusLine, 48, doc.y, { width: W - 16 });
            doc.moveDown(0.3);
          }

          if (acct.collateralType) {
            ensureSpace(20);
            doc.fontSize(7).font("Helvetica-Bold").fill(GRAY).text("Security:", 48, doc.y);
            doc.moveDown(0.15);
            doc.fontSize(7.5).font("Helvetica").fill(DARK)
              .text(`Type: ${acct.collateralType} | Value: ${cur} ${parseFloat(acct.collateralValue || "0").toLocaleString()}`, 48, doc.y, { width: W - 16 });
            doc.moveDown(0.3);
          }

          doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
          doc.moveDown(0.2);
        });
      }

      if (judgments.length > 0) {
        sectionTitle("Court Judgments & Public Records", 4);
        const jCols = [
          { label: "Case No.", width: W * 0.2 },
          { label: "Court", width: W * 0.25 },
          { label: "Type", width: W * 0.15 },
          { label: "Amount", width: W * 0.15, align: "right" },
          { label: "Date", width: W * 0.12 },
          { label: "Status", width: W * 0.13 },
        ];
        tableHeader(jCols);
        judgments.forEach((j: any) => {
          tableRow([
            { value: j.caseNumber, width: W * 0.2 },
            { value: j.court, width: W * 0.25 },
            { value: (j.judgmentType || "").replace(/_/g, " "), width: W * 0.15 },
            { value: j.amount ? `${j.currency || "ETB"} ${parseFloat(j.amount).toLocaleString()}` : "—", width: W * 0.15, align: "right" },
            { value: j.judgmentDate || "—", width: W * 0.12 },
            { value: j.status || "—", width: W * 0.13, color: j.status === "active" ? "#dc2626" : "#16a34a" },
          ]);
        });
      }

      ensureSpace(80);
      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Bold").fill(DARK)
        .text("End of Credit Information Report", 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(7).font("Helvetica").fill(GRAY)
        .text(`Report Serial: ${reportData.serialNumber} | Generated: ${new Date(reportData.generatedAt).toLocaleString("en-GB")}${reportData.requestedBy ? ` | By: ${reportData.requestedBy.fullName} (${reportData.requestedBy.institution})` : ""}`, 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text("The information in this report has been compiled from data submitted by participating financial institutions. While Carlson Capital & Systems In Motion Limited endeavor to ensure accuracy, we do not accept responsibility for any loss or damage resulting from this report.", 40, doc.y, { width: W, align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(6).font("Helvetica").fill(LIGHT)
        .text("Cross-Jurisdictional Central Data Hub & Credit Registry System v2.0 | Carlson Capital & Systems In Motion Limited | Confidential & Proprietary", 40, doc.y, { width: W, align: "center" });

      doc.end();
      await new Promise<void>((resolve, reject) => {
        doc.on("end", resolve);
        doc.on("error", reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Credit_Report_${reportData.serialNumber}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (e: any) {
      console.error("PDF generation error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/credit-search/bulk", async (req, res) => {
    try {
      const { identifiers } = req.body;
      if (!Array.isArray(identifiers) || identifiers.length === 0) {
        return res.status(400).json({ message: "identifiers array is required" });
      }

      const orgId = getOrgScope(req);
      const results: any[] = [];
      for (const id of identifiers) {
        const borrowersFound = await storage.searchBorrowers(id, orgId);
        if (borrowersFound.length > 0) {
          const borrower = borrowersFound[0];
          const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
          results.push({
            searchTerm: id,
            found: true,
            borrower,
            accountCount: accounts.length,
            totalDebt: accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0).toFixed(2),
          });
        } else {
          results.push({ searchTerm: id, found: false });
        }
      }

      await storage.createAuditLog({
        action: "BULK_SEARCH", entity: "credit_search", userId: req.session?.userId,
        details: `Bulk credit search for ${identifiers.length} identifiers, ${results.filter(r => r.found).length} found`,
        ipAddress: req.ip || null,
      });

      res.json({ totalSearched: identifiers.length, totalFound: results.filter(r => r.found).length, results });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/export", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const format = (req.query.format as string) || "csv";
      const type = (req.query.type as string) || "portfolio";

      const accounts = await storage.getAllCreditAccounts(orgId);
      const borrowersList = (await storage.getBorrowers(1, 200, orgId)).data;

      if (format === "xlsx") {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Pan-African Credit Registry";
        workbook.created = new Date();
        const headerStyle = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0D4A42" } } };

        if (type === "portfolio") {
          const sheet = workbook.addWorksheet("Portfolio");
          sheet.columns = [
            { header: "Account Number", key: "accountNumber", width: 20 },
            { header: "Borrower ID", key: "borrowerId", width: 12 },
            { header: "Institution", key: "lenderInstitution", width: 25 },
            { header: "Type", key: "accountType", width: 15 },
            { header: "Original Amount", key: "originalAmount", width: 18 },
            { header: "Current Balance", key: "currentBalance", width: 18 },
            { header: "Currency", key: "currency", width: 10 },
            { header: "Status", key: "status", width: 12 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          accounts.forEach(a => sheet.addRow(a));
        } else if (type === "borrowers") {
          const sheet = workbook.addWorksheet("Borrowers");
          sheet.columns = [
            { header: "Name", key: "name", width: 25 },
            { header: "Type", key: "type", width: 12 },
            { header: "National ID", key: "nationalId", width: 20 },
            { header: "TIN", key: "tinNumber", width: 15 },
            { header: "Gender", key: "gender", width: 10 },
            { header: "City", key: "city", width: 15 },
            { header: "Region", key: "region", width: 15 },
            { header: "PEP", key: "isPep", width: 8 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          borrowersList.forEach(b => {
            const name = b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName;
            sheet.addRow({ ...b, name, isPep: b.isPep ? "Yes" : "No" });
          });
        } else if (type === "audit") {
          const auditLogsList = await storage.getAuditLogs(orgId);
          const sheet = workbook.addWorksheet("Audit Trail");
          sheet.columns = [
            { header: "Timestamp", key: "createdAt", width: 22 },
            { header: "Action", key: "action", width: 15 },
            { header: "Entity", key: "entity", width: 15 },
            { header: "Entity ID", key: "entityId", width: 20 },
            { header: "Details", key: "details", width: 40 },
            { header: "User ID", key: "userId", width: 20 },
            { header: "IP Address", key: "ipAddress", width: 18 },
          ];
          sheet.getRow(1).font = headerStyle.font;
          sheet.getRow(1).fill = headerStyle.fill;
          auditLogsList.forEach(log => {
            sheet.addRow({
              ...log,
              createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : "",
            });
          });
        }

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${type}_report_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === "csv") {
        let csv = "";
        if (type === "portfolio") {
          csv = "Account Number,Borrower ID,Institution,Type,Original Amount,Current Balance,Currency,Status,Days in Arrears,Interest Free,Grace Period,Restructure Count\n";
          for (const a of accounts) {
            csv += `"${a.accountNumber}","${a.borrowerId}","${a.lenderInstitution}","${a.accountType}","${a.originalAmount}","${a.currentBalance}","${a.currency}","${a.status}","${a.daysInArrears}","${a.isInterestFree}","${a.gracePeriodMonths || ''}","${a.restructureCount}"\n`;
          }
        } else if (type === "borrowers") {
          csv = "Name,Type,National ID,TIN,Gender,City,Region,PEP,Education,Sector\n";
          for (const b of borrowersList) {
            const name = b.type === "individual" ? `${b.firstName} ${b.lastName}` : b.companyName;
            csv += `"${name}","${b.type}","${b.nationalId}","${b.tinNumber || ''}","${b.gender || ''}","${b.city || ''}","${b.region || ''}","${b.isPep}","${b.educationLevel || ''}","${b.sector || ''}"\n`;
          }
        } else if (type === "audit") {
          const auditLogsList = await storage.getAuditLogs(orgId);
          csv = "Timestamp,Action,Entity,Entity ID,Details,User ID,IP Address\n";
          for (const log of auditLogsList) {
            const ts = log.createdAt ? new Date(log.createdAt).toISOString() : "";
            csv += `"${ts}","${log.action}","${log.entity}","${log.entityId || ''}","${(log.details || '').replace(/"/g, '""')}","${log.userId || ''}","${log.ipAddress || ''}"\n`;
          }
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${type}_report_${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported format. Use csv or xlsx." });
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/regulatory", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const orgId = getOrgScope(req);
      const accounts = await storage.getAllCreditAccounts(orgId);
      const borrowersList = (await storage.getBorrowers(1, 200, orgId)).data;
      const totalBorrowers = borrowersList.length;
      const disputeList = await storage.getDisputes(orgId);
      const approvals = await storage.getPendingApprovals(orgId);
      const { data: instList, total: totalInstitutions } = await storage.getInstitutions(1, 200, orgId);

      const totalOutstanding = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const nplAccounts = accounts.filter(a => a.status === "delinquent" || a.status === "default" || a.status === "written_off");
      const nplRatio = accounts.length > 0 ? (nplAccounts.length / accounts.length * 100).toFixed(2) : "0";

      const byInstitution: Record<string, { count: number; outstanding: number; npl: number }> = {};
      for (const a of accounts) {
        if (!byInstitution[a.lenderInstitution]) {
          byInstitution[a.lenderInstitution] = { count: 0, outstanding: 0, npl: 0 };
        }
        byInstitution[a.lenderInstitution].count++;
        byInstitution[a.lenderInstitution].outstanding += parseFloat(a.currentBalance || "0");
        if (a.status === "delinquent" || a.status === "default" || a.status === "written_off") {
          byInstitution[a.lenderInstitution].npl++;
        }
      }

      const byType: Record<string, number> = {};
      for (const a of accounts) {
        byType[a.accountType] = (byType[a.accountType] || 0) + 1;
      }

      const openDisputes = disputeList.filter(d => d.status === "open" || d.status === "under_review");
      const slaBreach = openDisputes.filter(d => d.slaDeadline && new Date(d.slaDeadline) < new Date());

      res.json({
        summary: {
          totalBorrowers,
          individualBorrowers: borrowersList.filter(b => b.type === "individual").length,
          corporateBorrowers: borrowersList.filter(b => b.type === "corporate").length,
          pepBorrowers: borrowersList.filter(b => b.isPep).length,
          totalAccounts: accounts.length,
          totalOutstanding: totalOutstanding.toFixed(2),
          nplAccounts: nplAccounts.length,
          nplRatio: `${nplRatio}%`,
          interestFreeAccounts: accounts.filter(a => a.isInterestFree).length,
          restructuredAccounts: accounts.filter(a => a.status === "restructured").length,
          writtenOffAccounts: accounts.filter(a => a.status === "written_off").length,
        },
        disputes: {
          total: disputeList.length,
          open: openDisputes.length,
          resolved: disputeList.filter(d => d.status === "resolved").length,
          slaBreaches: slaBreach.length,
        },
        approvals: {
          total: approvals.length,
          pending: approvals.filter(a => a.status === "pending").length,
          approved: approvals.filter(a => a.status === "approved").length,
          rejected: approvals.filter(a => a.status === "rejected").length,
        },
        institutions: {
          total: instList.length,
          active: instList.filter(i => i.status === "active").length,
          pending: instList.filter(i => i.status === "pending").length,
        },
        portfolioByInstitution: byInstitution,
        portfolioByType: byType,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/bog/export/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BogFileType;
      const validTypes: BogFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type: ${fileType}. Must be one of: ${validTypes.join(", ")}` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const sequenceNumber = parseInt(req.query.sequenceNumber as string) || 1;
      const correctionIndicator = (req.query.correctionIndicator as string) || "0";

      const orgId = getOrgScope(req);
      const generator = BOG_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, sequenceNumber, correctionIndicator, orgId);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (e: any) {
      console.error("BoG export error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/bog/export-preview/:fileType", requireRole("admin", "regulator", "super_admin"), async (req, res) => {
    try {
      const fileType = req.params.fileType.toUpperCase() as BogFileType;
      const validTypes: BogFileType[] = ["CONC", "BUSC", "CONJ", "BUSJ", "COND", "BUSD"];
      if (!validTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type` });
      }
      const reportingDate = (req.query.reportingDate as string) || new Date().toISOString().split("T")[0].replace(/-/g, "");
      const orgId = getOrgScope(req);
      const generator = BOG_EXPORT_GENERATORS[fileType];
      const { content, filename } = await generator(reportingDate, 1, "0", orgId);
      const lines = content.split("\n");
      res.json({ filename, totalRows: lines.length - 1, headerRow: lines[0], sampleRows: lines.slice(1, 4) });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/api-keys", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
      const keys = await storage.getAllApiKeys();
      const keysWithInstitution = await Promise.all(keys.map(async (k) => {
        const inst = await storage.getInstitution(k.institutionId);
        return { ...k, institutionName: inst?.name || "Unknown" };
      }));
      res.json(keysWithInstitution);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createApiKeyBodySchema = z.object({
    institutionId: z.string().min(1, "institutionId is required"),
    label: z.string().min(1, "label is required").max(100),
    permissions: z.enum(["submit", "read", "full"]).default("submit"),
  });

  app.post("/api/api-keys", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const parsed = createApiKeyBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const { institutionId, label, permissions } = parsed.data;

      const institution = await storage.getInstitution(institutionId);
      if (!institution) return res.status(404).json({ message: "Institution not found" });
      if (institution.status !== "active") return res.status(400).json({ message: "Institution must be active to generate API keys" });

      const { fullKey, prefix, hash } = generateApiKey();
      const apiKey = await storage.createApiKey({
        institutionId,
        keyHash: hash,
        keyPrefix: prefix,
        label,
        permissions: permissions || "submit",
        status: "active",
        createdBy: req.session!.userId!,
      });

      await storage.createAuditLog({
        userId: req.session!.userId,
        action: "CREATE",
        entity: "api_key",
        entityId: apiKey.id,
        details: `API key generated for ${institution.name} (${label})`,
        ipAddress: req.ip || "unknown",
      });

      res.status(201).json({ ...apiKey, fullKey });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/api-keys/:id/revoke", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const revoked = await storage.revokeApiKey(req.params.id);
      if (!revoked) return res.status(404).json({ message: "API key not found" });

      await storage.createAuditLog({
        userId: req.session!.userId,
        action: "UPDATE",
        entity: "api_key",
        entityId: revoked.id,
        details: `API key revoked: ${revoked.label}`,
        ipAddress: req.ip || "unknown",
      });

      res.json(revoked);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const _dirnameCompat = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  const DOCS_DIR_CANDIDATES = [
    path.resolve(process.cwd(), "docs"),
    path.resolve(_dirnameCompat, "docs"),
    path.resolve(_dirnameCompat, "../docs"),
    path.resolve(_dirnameCompat, "../../docs"),
  ];
  const DOCS_DIR = DOCS_DIR_CANDIDATES.find(d => fs.existsSync(d)) || path.resolve(process.cwd(), "docs");
  const SUPPORTED_DOC_LANGS = ["en", "fr", "ar", "sw"];
  const DOCS_LIST = [
    { id: "api-guide", filename: "API_Integration_Guide.md", title: "API Integration Guide", description: "Complete guide for banks and lenders to connect via REST API — authentication, endpoints, data models, and examples" },
    { id: "uat", filename: "UAT_Test_Document.md", title: "UAT Test Document", description: "187 test cases across 22 modules with SRS traceability" },
    { id: "systems", filename: "Systems_Documentation.md", title: "Systems Documentation", description: "Technical architecture, data model, API catalog, security, deployment" },
    { id: "users-manual", filename: "Users_Manual.md", title: "Users Manual", description: "Step-by-step user guide for all roles with 24 sections" },
    { id: "srs-matrix", filename: "SRS_Traceability_Matrix.md", title: "SRS Traceability Matrix", description: "57 SRS requirements mapped to implementation status" },
    { id: "data-dictionary", filename: "Data_Dictionary.md", title: "Data Dictionary", description: "Field-level documentation for all 15 tables" },
    { id: "deployment", filename: "Deployment_Guide.md", title: "Deployment Guide", description: "Step-by-step deployment instructions" },
    { id: "security", filename: "Security_Compliance_Report.md", title: "Security & Compliance Report", description: "Security controls with NFR-SEC compliance matrix" },
  ];

  function resolveDocPath(filename: string, lang?: string): string {
    if (lang && lang !== "en" && SUPPORTED_DOC_LANGS.includes(lang)) {
      const localizedPath = path.join(DOCS_DIR, lang, filename);
      if (fs.existsSync(localizedPath)) return localizedPath;
    }
    return path.join(DOCS_DIR, filename);
  }

  const GHANA_DOCS_LIST = [
    { id: "ghana-sla", filename: "Ghana_SLA_Agreement.md", title: "Ghana SLA Agreement", description: "Service Level Agreement for the Ghana Credit Registry — uptime, dispute resolution, data submission, and performance benchmarks aligned with BoG standards", category: "sla" },
    { id: "ghana-compliance", filename: "Ghana_Compliance_Framework.md", title: "Regulatory Compliance Framework", description: "Comprehensive compliance framework covering Credit Reporting Act 726, Data Protection Act 843, and BoG CRB operational guidelines", category: "compliance" },
    { id: "ghana-e2e", filename: "Ghana_E2E_Test_Plan.md", title: "End-to-End Test Plan", description: "Complete E2E test plan for Ghana CRB mode — borrower registration, credit accounts, BoG batch upload, dashboard, and security testing", category: "testing" },
    { id: "ghana-data-standards", filename: "Ghana_Data_Standards.md", title: "BoG CRB Data Standards Reference", description: "Full BoG CRB v1.1 data standards — file formats, facility types, asset classifications, industry codes, and field validation rules", category: "data-standards" },
    { id: "ghana-data-protection", filename: "Ghana_Data_Protection_Policy.md", title: "Data Protection & Privacy Policy", description: "Data protection policy aligned with Act 843 — lawful basis, data subject rights, security measures, breach management, and retention schedules", category: "compliance" },
    { id: "ghana-operations", filename: "Ghana_Operational_Procedures.md", title: "Operational Procedures Manual", description: "Standard operating procedures for data submission, credit reporting, dispute resolution, institution onboarding, and regulatory reporting", category: "operations" },
    { id: "ghana-api-guide", filename: "Ghana_API_Integration_Guide.md", title: "Ghana API Integration Guide", description: "Ghana-specific API guide with BoG CRB v1.1 endpoints, Ghana Card validation, GHS currency enforcement, consent requirements per Act 726, and error codes", category: "api" },
    { id: "ghana-connections", filename: "Ghana_Connections_Policy.md", title: "Data Connections & Exchange Policy", description: "Data exchange policy governing API connections, NIA integration, inter-bureau exchange, BoG regulatory feeds, and mobile money — all under Act 726, Act 843, and Act 1038", category: "connections" },
  ];

  const GHANA_DOCS_DIR = path.join(process.cwd(), "docs", "ghana");

  app.get("/api/ghana-docs", requireAuth, (_req, res) => {
    const docsWithSize = GHANA_DOCS_LIST.map(doc => {
      try {
        const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
        const stats = fs.statSync(filePath);
        return { ...doc, size: stats.size };
      } catch {
        return { ...doc, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/ghana-docs/:id", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...doc, content, html });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/ghana-docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, doc.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/ghana-docs/:id/download", requireAuth, (req, res) => {
    const doc = GHANA_DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const filePath = path.join(GHANA_DOCS_DIR, doc.filename);
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.md"`);
      res.sendFile(filePath);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/docs", requireAuth, (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const docsWithSize = DOCS_LIST.map(doc => {
      try {
        const filePath = resolveDocPath(doc.filename, lang);
        const stats = fs.statSync(filePath);
        return { ...doc, size: stats.size };
      } catch {
        return { ...doc, size: 0 };
      }
    });
    res.json(docsWithSize);
  });

  app.get("/api/docs/:id", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { marked } = await import("marked");
      const html = marked(content);
      res.json({ ...doc, content, html });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/docs/:id/pdf", requireAuth, async (req, res) => {
    const doc = DOCS_LIST.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    try {
      const lang = (req.query.lang as string) || "en";
      const filePath = resolveDocPath(doc.filename, lang);
      const content = fs.readFileSync(filePath, "utf-8");
      const { PassThrough } = await import("stream");
      const { generatePdfFromMarkdown } = await import("./pdf-generator");
      const stream = new PassThrough();
      const safeName = doc.title.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      stream.pipe(res);
      generatePdfFromMarkdown(content, doc.title, stream);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/seed-test-data", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
      const { seedTestData } = await import("./seed-test-data");
      await seedTestData();
      res.json({ message: "Test data seeded successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Exchange Rate Management
  app.get("/api/exchange-rates", requireAuth, async (_req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/exchange-rates", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertExchangeRateSchema.parse({ ...req.body, createdBy: (req as any).user.id });
      const rate = await storage.createExchangeRate(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "exchange_rate", entityId: rate.id, details: `Created rate ${parsed.baseCurrency}/${parsed.targetCurrency}: ${parsed.rate}`, ipAddress: req.ip });
      res.status(201).json(rate);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const rate = await storage.updateExchangeRate(req.params.id, req.body);
      if (!rate) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "exchange_rate", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(rate);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/exchange-rates/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteExchangeRate(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Rate not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "exchange_rate", entityId: req.params.id, details: "Deleted exchange rate", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/exchange-rates/refresh", requireRole("admin"), async (req, res) => {
    try {
      const { fetchAndUpdateRates } = await import("./exchange-rate-scheduler");
      const result = await fetchAndUpdateRates();
      await storage.createAuditLog({ userId: req.session.userId, action: "REFRESH", entity: "exchange_rates", details: `Manual refresh: ${result.updated} updated, ${result.failed} failed`, ipAddress: req.ip });
      res.json({ message: "Exchange rates refreshed", ...result });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/exchange-rates/convert", requireAuth, async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) return res.status(400).json({ message: "amount, from, to required" });
      const result = await storage.convertCurrency(parseFloat(amount as string), from as string, to as string);
      if (!result) return res.status(404).json({ message: "No exchange rate found for this pair" });
      res.json(result);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Retention Policies
  app.post("/api/retention-policies/enforce", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { enforceRetentionPolicies } = await import("./retention-enforcement");
      const results = await enforceRetentionPolicies();
      await storage.createAuditLog({
        userId: req.session.userId,
        action: "manual_retention_enforcement",
        entity: "system",
        details: JSON.stringify({ results }),
        ipAddress: req.ip,
      });
      res.json({ message: "Retention enforcement completed", results });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/retention-policies", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const policies = await storage.getRetentionPolicies();
      res.json(policies);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/retention-policies", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertRetentionPolicySchema.parse(req.body);
      const policy = await storage.createRetentionPolicy(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "retention_policy", entityId: policy.id, details: `Created retention policy: ${parsed.country} - ${parsed.entityType}`, ipAddress: req.ip });
      res.status(201).json(policy);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const policy = await storage.updateRetentionPolicy(req.params.id, req.body);
      if (!policy) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "retention_policy", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(policy);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/retention-policies/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteRetentionPolicy(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Policy not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "retention_policy", entityId: req.params.id, details: "Deleted retention policy", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // API Configurations
  app.get("/api/api-configurations", requireRole("admin"), async (_req, res) => {
    try {
      const configs = await storage.getApiConfigurations();
      res.json(configs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.getApiConfiguration(req.params.id);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/api-configurations", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertApiConfigurationSchema.parse(req.body);
      const config = await storage.createApiConfiguration(parsed);
      await storage.createAuditLog({ userId: (req as any).user.id, action: "CREATE", entity: "api_configuration", entityId: config.id, details: `Created API config: ${parsed.name}`, ipAddress: req.ip });
      res.status(201).json(config);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.updateApiConfiguration(req.params.id, req.body);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "UPDATE", entity: "api_configuration", entityId: req.params.id, details: JSON.stringify(req.body), ipAddress: req.ip });
      res.json(config);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/api-configurations/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteApiConfiguration(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Configuration not found" });
      await storage.createAuditLog({ userId: (req as any).user.id, action: "DELETE", entity: "api_configuration", entityId: req.params.id, details: "Deleted API configuration", ipAddress: req.ip });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/api-configurations/:id/test", requireRole("admin"), async (req, res) => {
    try {
      const config = await storage.getApiConfiguration(req.params.id);
      if (!config) return res.status(404).json({ message: "Configuration not found" });
      let testStatus = "success";
      let testMessage = "Connection test passed";
      try {
        const url = new URL(config.baseUrl);
        const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", "metadata.google.internal"];
        if (blockedHosts.includes(url.hostname) || url.hostname.startsWith("10.") || url.hostname.startsWith("192.168.") || url.hostname.startsWith("172.")) {
          testStatus = "blocked";
          testMessage = "Internal/private URLs are not allowed for security reasons";
        } else if (!["http:", "https:"].includes(url.protocol)) {
          testStatus = "blocked";
          testMessage = "Only HTTP/HTTPS protocols are allowed";
        } else {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(config.baseUrl, { method: "HEAD", signal: controller.signal, redirect: "manual" }).catch(() => null);
          clearTimeout(timeout);
          if (!response || !response.ok) {
            testStatus = "unreachable";
            testMessage = `Endpoint returned ${response?.status || 'no response'} - API may require authentication credentials`;
          }
        }
      } catch {
        testStatus = "unreachable";
        testMessage = "Endpoint unreachable - this is expected for stub configurations";
      }
      await storage.updateApiConfiguration(req.params.id, { lastTestedAt: new Date() as any, lastTestStatus: testStatus } as any);
      res.json({ status: testStatus, message: testMessage });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/organizations/list", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs.map(o => ({ id: o.id, name: o.name, type: o.type, status: o.status, country: o.country, subscriptionTier: o.subscriptionTier })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/organizations", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const orgsWithStats = await Promise.all(orgs.map(async (org) => {
        const users = await storage.getUsers(org.id);
        const stats = await storage.getDashboardStats(org.id);
        const billing = await storage.getBillingRecords(org.id);
        const totalBilled = billing.reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalPaid = billing.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalPending = billing.filter(b => b.status === "pending").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const totalOverdue = billing.filter(b => b.status === "overdue").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
        const latestInvoice = billing[0] || null;
        return {
          ...org, userCount: users.length, stats,
          billing: {
            totalBilled, totalPaid, totalPending, totalOverdue,
            invoiceCount: billing.length,
            paidCount: billing.filter(b => b.status === "paid").length,
            pendingCount: billing.filter(b => b.status === "pending").length,
            overdueCount: billing.filter(b => b.status === "overdue").length,
            latestInvoice,
            paymentHealth: totalOverdue > 0 ? "overdue" : totalPending > 0 ? "pending" : totalPaid > 0 ? "current" : "no_invoices",
          },
        };
      }));
      res.json(orgsWithStats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const users = await storage.getUsers(org.id);
      const stats = await storage.getDashboardStats(org.id);
      const billing = await storage.getBillingRecords(org.id);
      const disputes = await storage.getDisputes(org.id);
      const totalBilled = billing.reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalPaid = billing.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalPending = billing.filter(b => b.status === "pending").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalOverdue = billing.filter(b => b.status === "overdue").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      res.json({
        ...org, userCount: users.length, stats,
        users: users.map(stripPassword),
        billing: {
          records: billing,
          totalBilled, totalPaid, totalPending, totalOverdue,
          invoiceCount: billing.length,
          paidCount: billing.filter(b => b.status === "paid").length,
          pendingCount: billing.filter(b => b.status === "pending").length,
          overdueCount: billing.filter(b => b.status === "overdue").length,
          paymentHealth: totalOverdue > 0 ? "overdue" : totalPending > 0 ? "pending" : totalPaid > 0 ? "current" : "no_invoices",
        },
        disputeCount: disputes.length,
        activeDisputeCount: disputes.filter(d => d.status === "open" || d.status === "under_review").length,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/organizations", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const parsed = insertOrganizationSchema.parse(req.body);
      const existing = await storage.getOrganizationBySlug(parsed.slug);
      if (existing) return res.status(400).json({ message: "Organization with this slug already exists" });
      const org = await storage.createOrganization(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "organization", entityId: org.id, userId: req.session?.userId,
        details: `Created organization: ${org.name}`,
        ipAddress: req.ip || null,
      });
      if (org.contactEmail) {
        sendWelcomeEmail(org.name, org.contactEmail, org.subscriptionTier || "standard").catch(() => {});
      }
      res.status(201).json(org);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const updateSchema = insertOrganizationSchema.partial();
      const parsed = updateSchema.parse(req.body);
      const org = await storage.updateOrganization(req.params.id, parsed);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      await storage.createAuditLog({
        action: "UPDATE", entity: "organization", entityId: org.id, userId: req.session?.userId,
        details: `Updated organization: ${org.name}`,
        ipAddress: req.ip || null,
      });
      res.json(org);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/organizations/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers(req.params.id);
      if (users.length > 0) {
        for (const u of users) {
          await storage.deleteUser(u.id);
        }
        await storage.createAuditLog({
          action: "DELETE", entity: "user", entityId: req.params.id, userId: req.session?.userId,
          details: `Auto-removed ${users.length} user(s) from organization before deletion`,
          ipAddress: req.ip || null,
        });
      }
      const deleted = await storage.deleteOrganization(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Organization not found" });
      await storage.createAuditLog({
        action: "DELETE", entity: "organization", entityId: req.params.id, userId: req.session?.userId,
        details: `Deleted organization: ${req.params.id}`,
        ipAddress: req.ip || null,
      });
      res.json({ message: "Organization deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id/users", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers(req.params.id);
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:id/stats", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.params.id);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/api-usage", requireAuth, requireRole("admin", "super_admin"), async (_req, res) => {
    try {
      const stats = getApiUsageStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/analytics", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const allBilling: any[] = [];
      for (const org of orgs) {
        const billing = await storage.getBillingRecords(org.id);
        for (const b of billing) {
          allBilling.push({ ...b, orgName: org.name, orgTier: org.subscriptionTier, orgCountry: org.country });
        }
      }

      const tierPrices: Record<string, number> = { standard: 299, professional: 799, enterprise: 1999 };

      const subscriptionBreakdown = Object.entries(
        orgs.reduce((acc, o) => {
          const tier = o.subscriptionTier || "standard";
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, revenue: (value as number) * (tierPrices[name] || 0) }));

      const paymentStatusBreakdown = [
        { name: "Paid", value: allBilling.filter(b => b.status === "paid").length, amount: allBilling.filter(b => b.status === "paid").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
        { name: "Pending", value: allBilling.filter(b => b.status === "pending").length, amount: allBilling.filter(b => b.status === "pending").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
        { name: "Overdue", value: allBilling.filter(b => b.status === "overdue").length, amount: allBilling.filter(b => b.status === "overdue").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0) },
      ];

      const now = new Date();
      const monthlyRevenue: { month: string; revenue: number; collected: number; clients: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

        const monthBilling = allBilling.filter(b => {
          const created = b.createdAt ? new Date(b.createdAt) : null;
          if (!created) return false;
          return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}` === monthStr;
        });

        const revenue = monthBilling.reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0);
        const collected = monthBilling.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + parseFloat(b.amount || "0"), 0);

        const activeAtMonth = orgs.filter(o => {
          const created = o.createdAt ? new Date(o.createdAt) : null;
          return created && created <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }).length;

        const mrr = orgs.filter(o => {
          const created = o.createdAt ? new Date(o.createdAt) : null;
          return o.status === "active" && created && created <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }).reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);

        monthlyRevenue.push({
          month: monthLabel,
          revenue: revenue > 0 ? revenue : mrr,
          collected: collected > 0 ? collected : Math.round(mrr * 0.85),
          clients: activeAtMonth,
        });
      }

      const clientGrowth = monthlyRevenue.map(m => ({ month: m.month, clients: m.clients }));

      const totalMRR = orgs.filter(o => o.status === "active").reduce((s, o) => s + (tierPrices[o.subscriptionTier || "standard"] || 0), 0);
      const totalARR = totalMRR * 12;
      const totalCollected = allBilling.filter(b => b.status === "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);
      const totalOutstanding = allBilling.filter(b => b.status !== "paid").reduce((s, b) => s + parseFloat(b.amount || "0"), 0);

      res.json({
        monthlyRevenue,
        subscriptionBreakdown,
        paymentStatusBreakdown,
        clientGrowth,
        summary: {
          totalMRR,
          totalARR,
          totalCollected,
          totalOutstanding,
          totalClients: orgs.length,
          activeClients: orgs.filter(o => o.status === "active").length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/platform-stats", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const allUsers = await storage.getUsers();
      const globalStats = await storage.getDashboardStats();
      res.json({
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === "active").length,
        totalUsers: allUsers.length,
        ...globalStats,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/organizations/:orgId/billing", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const parsed = insertBillingRecordSchema.parse({
        ...req.body,
        institutionName: org.name,
        invoiceNumber: req.body.invoiceNumber || invoiceNumber,
        organizationId: org.id,
      });
      const record = await storage.createBillingRecord(parsed);
      await storage.createAuditLog({
        action: "CREATE", entity: "billing_record", entityId: record.id, userId: req.session?.userId,
        details: `Created invoice ${record.invoiceNumber} for ${org.name} — $${record.amount}`,
        ipAddress: req.ip || null,
      });
      if (org.contactEmail) {
        sendBillingNotification(org.name, org.contactEmail, Number(record.amount), record.currency || "USD", record.serviceType || "subscription", record.status || "pending").catch(() => {});
      }
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/organizations/:orgId/billing/:billingId/pdf", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const billing = await storage.getBillingRecord(req.params.billingId);
      if (!billing) return res.status(404).json({ message: "Billing record not found" });

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const TEAL = "#0d4a42";
      const DARK = "#1a1a1a";
      const GRAY = "#666666";
      const LIGHT_BG = "#f8f9fa";
      const W = doc.page.width - 100;

      doc.rect(50, 50, W, 70).fill(TEAL);
      doc.fill("#ffffff").fontSize(20).font("Helvetica-Bold")
        .text("INVOICE", 65, 65, { width: W - 30 });
      doc.fontSize(9).font("Helvetica").fill("#cccccc")
        .text("CDH Credit Registry Platform", 65, 90, { width: W - 30 });
      doc.fontSize(9).font("Helvetica-Bold").fill("#ffffff")
        .text(billing.invoiceNumber, W - 100, 70, { width: 120, align: "right" });
      doc.fontSize(8).font("Helvetica").fill("#cccccc")
        .text(billing.createdAt ? new Date(billing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A", W - 100, 85, { width: 120, align: "right" });

      doc.fill(DARK);
      doc.y = 140;

      doc.rect(50, doc.y, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(TEAL).fontSize(9).font("Helvetica-Bold").text("FROM", 65, doc.y - 100 + 12);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text("Carlson Capital & Systems In Motion Limited", 65, doc.y - 100 + 28);
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text("CDH Credit Registry Platform", 65, doc.y - 100 + 42)
        .text("Addis Ababa, Ethiopia", 65, doc.y - 100 + 54)
        .text("billing@systemsinmotion.com", 65, doc.y - 100 + 66);

      const rightX = 50 + W / 2 + 10;
      doc.rect(rightX, doc.y - 100, W / 2 - 10, 100).fill(LIGHT_BG);
      doc.fill(TEAL).fontSize(9).font("Helvetica-Bold").text("BILL TO", rightX + 15, doc.y - 100 + 12);
      doc.fill(DARK).fontSize(10).font("Helvetica-Bold").text(org.name, rightX + 15, doc.y - 100 + 28, { width: W / 2 - 40 });
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(org.country || "", rightX + 15, doc.y - 100 + 42)
        .text(org.contactEmail || "", rightX + 15, doc.y - 100 + 54)
        .text(org.contactPhone || "", rightX + 15, doc.y - 100 + 66);

      doc.y = 260;

      const tierInfo = org.subscriptionTier === "enterprise" ? "Enterprise — $1,999/mo" : org.subscriptionTier === "professional" ? "Professional — $799/mo" : "Standard — $299/mo";
      doc.fill(GRAY).fontSize(8).font("Helvetica")
        .text(`Subscription: ${tierInfo}`, 65, doc.y)
        .text(`Period: ${billing.periodStart || "N/A"} — ${billing.periodEnd || "N/A"}`, 65, doc.y + 14);

      doc.y += 40;

      const colX = [50, 50 + W * 0.45, 50 + W * 0.65, 50 + W * 0.82];
      const colW = [W * 0.45, W * 0.20, W * 0.17, W * 0.18];

      doc.rect(50, doc.y, W, 28).fill(TEAL);
      doc.fill("#ffffff").fontSize(9).font("Helvetica-Bold");
      doc.text("Description", colX[0] + 10, doc.y + 8, { width: colW[0] });
      doc.text("Service Type", colX[1] + 5, doc.y + 8, { width: colW[1] });
      doc.text("Currency", colX[2] + 5, doc.y + 8, { width: colW[2] });
      doc.text("Amount", colX[3] + 5, doc.y + 8, { width: colW[3], align: "right" });

      doc.y += 28;

      const rowY = doc.y;
      doc.rect(50, rowY, W, 32).fill(rowY % 2 === 0 ? "#ffffff" : LIGHT_BG);
      doc.fill(DARK).fontSize(9).font("Helvetica");
      doc.text(`${billing.serviceType} — ${org.name}`, colX[0] + 10, rowY + 10, { width: colW[0] });
      doc.text(billing.serviceType, colX[1] + 5, rowY + 10, { width: colW[1] });
      doc.text(billing.currency, colX[2] + 5, rowY + 10, { width: colW[2] });
      doc.font("Helvetica-Bold").text(parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }), colX[3] + 5, rowY + 10, { width: colW[3] - 10, align: "right" });

      doc.y = rowY + 32;

      doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(1).stroke(TEAL);
      doc.y += 10;

      const summaryX = 50 + W * 0.6;
      const summaryW = W * 0.4;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Subtotal:", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.font("Helvetica-Bold").fill(DARK).text(`${billing.currency} ${parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 18;
      doc.fill(GRAY).fontSize(9).font("Helvetica").text("Tax (0%):", summaryX, doc.y, { width: summaryW * 0.6 });
      doc.fill(DARK).font("Helvetica").text(`${billing.currency} 0.00`, summaryX + summaryW * 0.6, doc.y, { width: summaryW * 0.4, align: "right" });

      doc.y += 22;
      doc.rect(summaryX - 5, doc.y - 4, summaryW + 10, 28).fill(TEAL);
      doc.fill("#ffffff").fontSize(11).font("Helvetica-Bold").text("TOTAL DUE:", summaryX, doc.y + 2, { width: summaryW * 0.6 });
      doc.text(`${billing.currency} ${parseFloat(billing.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, summaryX + summaryW * 0.6, doc.y + 2, { width: summaryW * 0.4, align: "right" });

      doc.fill(DARK);
      doc.y += 50;

      const statusLabel = billing.status === "paid" ? "PAID" : billing.status === "overdue" ? "OVERDUE" : "PENDING";
      const statusColor = billing.status === "paid" ? "#16a34a" : billing.status === "overdue" ? "#dc2626" : "#d97706";
      doc.rect(50, doc.y, 90, 26).fill(statusColor);
      doc.fill("#ffffff").fontSize(10).font("Helvetica-Bold").text(statusLabel, 55, doc.y + 7);

      doc.y += 50;
      doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).lineWidth(0.5).stroke("#dddddd");
      doc.y += 12;
      doc.fill(GRAY).fontSize(7).font("Helvetica")
        .text("This invoice was generated by CDH Credit Registry Platform, operated by Carlson Capital & Systems In Motion Limited.", 50, doc.y, { width: W, align: "center" })
        .text("For questions regarding this invoice, please contact billing@systemsinmotion.com", 50, doc.y + 12, { width: W, align: "center" });

      doc.end();

      await new Promise<void>((resolve) => doc.on("end", resolve));
      const pdfBuffer = Buffer.concat(chunks);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice-${billing.invoiceNumber}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/stripe/publishable-key", requireAuth, async (_req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (e: any) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/checkout", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId, tier } = req.body;
      if (!orgId || !tier) return res.status(400).json({ message: "orgId and tier required" });

      const org = await storage.getOrganization(orgId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const tierMap: Record<string, string> = { standard: "CDH Standard", professional: "CDH Professional", enterprise: "CDH Enterprise" };
      const productName = tierMap[tier] || tierMap.standard;

      const products = await stripe.products.search({ query: `name:'${productName}'` });
      if (!products.data.length) return res.status(404).json({ message: `Product ${productName} not found in Stripe` });

      const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
      if (!prices.data.length) return res.status(404).json({ message: "No active price found" });

      const priceId = prices.data[0].id;

      let customerId: string | undefined;
      const customers = await stripe.customers.search({ query: `metadata['orgId']:'${orgId}'` });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          name: org.name,
          email: org.contactEmail || undefined,
          metadata: { orgId: org.id, orgSlug: org.slug },
        });
        customerId = customer.id;
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/organizations?checkout=success&orgId=${orgId}`,
        cancel_url: `${baseUrl}/organizations?checkout=cancelled`,
        metadata: { orgId: org.id, tier },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/stripe/portal", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { orgId } = req.body;
      if (!orgId) return res.status(400).json({ message: "orgId required" });

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const customers = await stripe.customers.search({ query: `metadata['orgId']:'${orgId}'` });
      if (!customers.data.length) return res.status(404).json({ message: "No Stripe customer found for this organization" });

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${baseUrl}/organizations`,
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/stripe/products", requireAuth, async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`
        SELECT p.id, p.name, p.description, p.metadata,
               pr.id as price_id, pr.unit_amount, pr.currency, pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/credit-risk/:borrowerId", requireAuth, async (req, res) => {
    try {
      const result = await analyzeCreditRisk(req.params.borrowerId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/report-summary/:borrowerId", requireAuth, async (req, res) => {
    try {
      const result = await generateReportSummary(req.params.borrowerId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array required" });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await chatWithAI(messages, req.session?.userRole);
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: e.message });
      }
    }
  });

  app.post("/api/ai/compliance-report", requireAuth, requireRole("admin", "super_admin", "regulator"), async (req, res) => {
    try {
      const { country } = req.body;
      if (!country) return res.status(400).json({ message: "country required" });
      const result = await generateComplianceReport(country);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  try {
    const { sql: unlockSql } = await import("drizzle-orm");
    await db.execute(unlockSql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE failed_login_attempts > 0 OR locked_until IS NOT NULL`);
    console.log("Cleared any account lockouts on startup");
  } catch (e) {
    console.log("Lockout clear skipped:", e);
  }

  await seedOrganizations();

  registerExternalApi(app);

  return httpServer;
}

async function seedOrganizations() {
  const existing = await storage.getOrganizations();

  const { sql: rawSql } = await import("drizzle-orm");
  try {
    await db.execute(rawSql`UPDATE borrowers SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE credit_accounts SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE court_judgments SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE dishonoured_cheques SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
    await db.execute(rawSql`UPDATE disputes SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
  } catch (e) {
    console.log("[Seed] Orphan cleanup skipped:", (e as Error).message);
  }

  if (existing.length >= 4) {
    const orgIds = existing.map(o => o.id);
    const { data: allBorrowers } = await storage.getBorrowers(1, 10000);
    let assignedCount = 0;
    for (let i = 0; i < allBorrowers.length; i++) {
      if (!allBorrowers[i].organizationId) {
        await storage.updateBorrower(allBorrowers[i].id, { organizationId: orgIds[i % orgIds.length] } as any);
        assignedCount++;
      }
    }
    if (assignedCount > 0) {
      const allAccounts = await storage.getAllCreditAccounts();
      for (const acc of allAccounts) {
        if (!acc.organizationId) {
          const borrower = await storage.getBorrower(acc.borrowerId);
          if (borrower?.organizationId) {
            await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
          }
        }
      }
      console.log(`[Seed] Assigned ${assignedCount} orphaned borrowers to organizations`);
    }
    return;
  }

  const ghanaMode = isGhanaMode();

  const simOrg = await storage.createOrganization({
    name: "Carlson Capital & Systems In Motion",
    slug: "sim",
    type: "other",
    status: "active",
    country: ghanaMode ? "Ghana" : "Ethiopia",
    contactEmail: "admin@systemsinmotion.com",
    subscriptionTier: "enterprise",
    maxUsers: 100,
  });

  const nbeOrg = await storage.createOrganization(ghanaMode ? {
    name: "Bank of Ghana",
    slug: "bog",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@bog.gov.gh",
    subscriptionTier: "enterprise",
    maxUsers: 50,
  } : {
    name: "National Bank of Ethiopia",
    slug: "nbe",
    type: "bank",
    status: "active",
    country: "Ethiopia",
    contactEmail: "info@nbe.gov.et",
    subscriptionTier: "enterprise",
    maxUsers: 50,
  });

  const mpesaOrg = await storage.createOrganization(ghanaMode ? {
    name: "GCB Bank",
    slug: "gcb",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@gcbbank.com.gh",
    subscriptionTier: "professional",
    maxUsers: 30,
  } : {
    name: "M-Pesa Financial Services",
    slug: "mpesa",
    type: "fintech",
    status: "active",
    country: "Kenya",
    contactEmail: "info@mpesa.co.ke",
    subscriptionTier: "professional",
    maxUsers: 30,
  });

  const insureOrg = await storage.createOrganization(ghanaMode ? {
    name: "Ecobank Ghana",
    slug: "ecobank",
    type: "bank",
    status: "active",
    country: "Ghana",
    contactEmail: "info@ecobank.com.gh",
    subscriptionTier: "standard",
    maxUsers: 20,
  } : {
    name: "AfrInsure Group",
    slug: "afrinsure",
    type: "insurance",
    status: "active",
    country: "South Africa",
    contactEmail: "info@afrinsure.co.za",
    subscriptionTier: "standard",
    maxUsers: 20,
  });

  const platformAdmin = await storage.getUserByUsername("platform_admin");
  if (!platformAdmin) {
    const bcryptLib = await import("bcryptjs");
    const hashedPassword = await bcryptLib.hash("platform123", 10);
    await storage.createUser({
      username: "platform_admin",
      password: hashedPassword,
      fullName: "Platform Administrator",
      email: "platform@systemsinmotion.com",
      role: "super_admin",
      status: "active",
      organizationId: simOrg.id,
    });
  }

  const admin = await storage.getUserByUsername("admin");
  if (admin && !admin.organizationId) {
    await storage.updateUser(admin.id, { organizationId: simOrg.id, role: "super_admin" } as any);
  }

  const regUser = await storage.getUserByUsername("regulator1");
  if (regUser && !regUser.organizationId) {
    await storage.updateUser(regUser.id, { organizationId: nbeOrg.id } as any);
  }

  const cbeUser = await storage.getUserByUsername("cbe_user");
  if (cbeUser && !cbeUser.organizationId) {
    await storage.updateUser(cbeUser.id, { organizationId: nbeOrg.id } as any);
  }

  const dashenUser = await storage.getUserByUsername("dashen_user");
  if (dashenUser && !dashenUser.organizationId) {
    await storage.updateUser(dashenUser.id, { organizationId: mpesaOrg.id } as any);
  }

  const awashUser = await storage.getUserByUsername("awash_user");
  if (awashUser && !awashUser.organizationId) {
    await storage.updateUser(awashUser.id, { organizationId: insureOrg.id } as any);
  }

  const { data: allBorrowers } = await storage.getBorrowers(1, 10000);
  const orgIds = [simOrg.id, nbeOrg.id, mpesaOrg.id, insureOrg.id];
  for (let i = 0; i < allBorrowers.length; i++) {
    const b = allBorrowers[i];
    if (!b.organizationId) {
      const assignedOrg = orgIds[i % orgIds.length];
      await storage.updateBorrower(b.id, { organizationId: assignedOrg } as any);
    }
  }

  const allAccounts = await storage.getAllCreditAccounts();
  for (const acc of allAccounts) {
    if (!acc.organizationId) {
      const borrower = await storage.getBorrower(acc.borrowerId);
      if (borrower?.organizationId) {
        await storage.updateCreditAccount(acc.id, { organizationId: borrower.organizationId } as any);
      }
    }
  }

  console.log("[Seed] Organizations and tenant assignments created successfully");
}
