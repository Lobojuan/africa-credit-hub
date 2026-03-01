import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema,
  insertUserSchema, insertPendingApprovalSchema, insertDisputeSchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema, insertPaymentHistorySchema,
  insertInstitutionSchema, insertBillingRecordSchema, insertCreditReportLogSchema,
  insertExchangeRateSchema, insertRetentionPolicySchema, insertApiConfigurationSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registerExternalApi, generateApiKey } from "./external-api";
import fs from "fs";
import path from "path";
import * as OTPAuth from "otpauth";

function stripPassword(user: any) {
  const { password, ...safe } = user;
  return safe;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/login", async (req, res) => {
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
      req.session.lastActivity = Date.now();

      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in`,
        ipAddress: req.ip || null,
      });

      let passwordExpired = false;
      if (user.mustChangePassword) {
        passwordExpired = true;
      } else if (user.passwordChangedAt) {
        const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        passwordExpired = daysSinceChange > 90;
      }

      res.json({ ...stripPassword(user), passwordExpired });
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
      req.session.lastActivity = Date.now();
      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in (MFA verified)`,
        ipAddress: req.ip || null,
      });
      let passwordExpired = false;
      if (user.mustChangePassword) {
        passwordExpired = true;
      } else if (user.passwordChangedAt) {
        const daysSinceChange = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        passwordExpired = daysSinceChange > 90;
      }
      res.json({ ...stripPassword(user), passwordExpired });
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

    res.json({ ...userData, passwordExpired });
  });

  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/external")) return next();
    requireAuth(req, res, next);
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/details/:type", async (req, res) => {
    try {
      const details = await storage.getDashboardDetails(req.params.type);
      res.json(details);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
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
      const search = req.query.search as string;
      const country = req.query.country as string;
      if (search || country) {
        const data = await storage.searchBorrowers(search || "", country || undefined);
        res.json(data);
      } else {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
        const result = await storage.getBorrowers(page, limit);
        res.json(result);
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/global-search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const country = (req.query.country as string) || undefined;
      if (!query && !country) {
        return res.json({ borrowers: [], institutions: [], creditAccounts: [] });
      }
      const results = await storage.globalSearch(query, country);
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
      const parsed = insertBorrowerSchema.parse(req.body);
      const approval = await storage.createPendingApproval({
        entityType: "borrower",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
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

  app.get("/api/credit-accounts", async (req, res) => {
    try {
      const borrowerId = req.query.borrowerId as string;
      const result = borrowerId
        ? await storage.getCreditAccountsByBorrower(borrowerId)
        : await storage.getAllCreditAccounts();
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
      const parsed = insertCreditAccountSchema.parse(req.body);
      const approval = await storage.createPendingApproval({
        entityType: "credit_account",
        action: "CREATE",
        payload: JSON.stringify(parsed),
        requestedBy: req.session?.userId!,
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
      const result = borrowerId
        ? await storage.getCreditInquiriesByBorrower(borrowerId)
        : await storage.getAllCreditInquiries();
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

      const totalDebt = accounts.reduce((sum, a) => sum + parseFloat(a.currentBalance || "0"), 0);
      const delinquentCount = accounts.filter(a => a.status === "delinquent" || a.status === "default").length;
      const onTimeCount = accounts.filter(a => a.status === "current").length;

      let creditScore = 600;
      if (accounts.length > 0) {
        const onTimeRatio = onTimeCount / accounts.length;
        creditScore = Math.round(300 + (onTimeRatio * 500) - (delinquentCount * 50) - (inquiries.length * 5));
        creditScore = Math.max(300, Math.min(850, creditScore));
      }

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
          creditScore,
          inquiryCount: inquiries.length,
        },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/audit-logs", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const logs = await storage.getAuditLogs();
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

  app.get("/api/pending-approvals", async (_req, res) => {
    try {
      const approvals = await storage.getPendingApprovals();
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

  app.get("/api/disputes", async (_req, res) => {
    try {
      const disputeList = await storage.getDisputes();
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
      const result = borrowerId
        ? await storage.getCourtJudgmentsByBorrower(borrowerId)
        : await storage.getAllCourtJudgments();
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
      const result = borrowerId
        ? await storage.getConsentRecordsByBorrower(borrowerId)
        : await storage.getAllConsentRecords();
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
      const result = await storage.getInstitutions(page, limit);
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

  app.get("/api/billing", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const records = await storage.getBillingRecords();
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

  app.get("/api/credit-reports/logs", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const logs = await storage.getCreditReportLogs();
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
      const onTimeCount = accounts.filter(a => a.status === "current").length;
      const writtenOffCount = accounts.filter(a => a.status === "written_off").length;
      const restructuredCount = accounts.filter(a => a.status === "restructured").length;

      let creditScore = 600;
      const reasonCodes: string[] = [];
      if (accounts.length > 0) {
        const onTimeRatio = onTimeCount / accounts.length;
        creditScore = Math.round(300 + (onTimeRatio * 500) - (delinquentCount * 50) - (inquiries.length * 5) - (writtenOffCount * 75) - (judgments.length * 40));
        creditScore = Math.max(300, Math.min(850, creditScore));

        if (delinquentCount > 0) reasonCodes.push("DELINQUENT_ACCOUNTS");
        if (writtenOffCount > 0) reasonCodes.push("WRITTEN_OFF_ACCOUNTS");
        if (restructuredCount > 0) reasonCodes.push("RESTRUCTURED_ACCOUNTS");
        if (inquiries.length > 5) reasonCodes.push("HIGH_INQUIRY_VOLUME");
        if (totalDebt > 1000000) reasonCodes.push("HIGH_DEBT_LEVEL");
        if (judgments.length > 0) reasonCodes.push("COURT_JUDGMENTS_PRESENT");
        if (borrower.isPep) reasonCodes.push("POLITICALLY_EXPOSED_PERSON");
        if (onTimeRatio > 0.8) reasonCodes.push("STRONG_REPAYMENT_HISTORY");
        if (accounts.length >= 3 && onTimeRatio === 1) reasonCodes.push("EXCELLENT_PAYMENT_RECORD");
      } else {
        reasonCodes.push("THIN_FILE_LIMITED_HISTORY");
      }

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

  app.post("/api/credit-search/bulk", async (req, res) => {
    try {
      const { identifiers } = req.body;
      if (!Array.isArray(identifiers) || identifiers.length === 0) {
        return res.status(400).json({ message: "identifiers array is required" });
      }

      const results: any[] = [];
      for (const id of identifiers) {
        const borrowersFound = await storage.searchBorrowers(id);
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

  app.get("/api/reports/export", requireRole("admin", "regulator"), async (req, res) => {
    try {
      const format = (req.query.format as string) || "csv";
      const type = (req.query.type as string) || "portfolio";

      const accounts = await storage.getAllCreditAccounts();
      const { data: borrowersList } = await storage.getBorrowers(1, 200);

      if (format === "csv") {
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
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${type}_report_${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported format. Use csv." });
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/reports/regulatory", requireRole("admin", "regulator"), async (_req, res) => {
    try {
      const accounts = await storage.getAllCreditAccounts();
      const { data: borrowersList, total: totalBorrowers } = await storage.getBorrowers(1, 200);
      const disputeList = await storage.getDisputes();
      const approvals = await storage.getPendingApprovals();
      const { data: instList, total: totalInstitutions } = await storage.getInstitutions(1, 200);

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

  const DOCS_DIR = path.resolve(process.cwd(), "docs");
  const DOCS_LIST = [
    { id: "uat", filename: "UAT_Test_Document.md", title: "UAT Test Document", description: "187 test cases across 22 modules with SRS traceability" },
    { id: "systems", filename: "Systems_Documentation.md", title: "Systems Documentation", description: "Technical architecture, data model, API catalog, security, deployment" },
    { id: "users-manual", filename: "Users_Manual.md", title: "Users Manual", description: "Step-by-step user guide for all roles with 24 sections" },
    { id: "srs-matrix", filename: "SRS_Traceability_Matrix.md", title: "SRS Traceability Matrix", description: "57 SRS requirements mapped to implementation status" },
    { id: "data-dictionary", filename: "Data_Dictionary.md", title: "Data Dictionary", description: "Field-level documentation for all 15 tables" },
    { id: "deployment", filename: "Deployment_Guide.md", title: "Deployment Guide", description: "Step-by-step deployment instructions" },
    { id: "security", filename: "Security_Compliance_Report.md", title: "Security & Compliance Report", description: "Security controls with NFR-SEC compliance matrix" },
  ];

  app.get("/api/docs", requireAuth, (_req, res) => {
    const docsWithSize = DOCS_LIST.map(doc => {
      try {
        const stats = fs.statSync(path.join(DOCS_DIR, doc.filename));
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
      const filePath = path.join(DOCS_DIR, doc.filename);
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
      const filePath = path.join(DOCS_DIR, doc.filename);
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

  registerExternalApi(app);

  return httpServer;
}
