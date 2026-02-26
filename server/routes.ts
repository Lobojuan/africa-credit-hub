import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema, insertUserSchema, insertPendingApprovalSchema, insertDisputeSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

      req.session.userId = user.id;
      req.session.userRole = user.role;

      await storage.createAuditLog({
        action: "LOGIN", entity: "system", userId: user.id,
        details: `${user.fullName} logged in`,
        ipAddress: req.ip || null,
      });

      res.json(stripPassword(user));
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

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(stripPassword(user));
  });

  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) return next();
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

  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(stripPassword));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", async (req, res) => {
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

  app.patch("/api/users/:id", async (req, res) => {
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

  app.get("/api/borrowers", async (req, res) => {
    try {
      const search = req.query.search as string;
      const result = search ? await storage.searchBorrowers(search) : await storage.getBorrowers();
      res.json(result);
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

  app.get("/api/audit-logs", async (_req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
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

  app.patch("/api/pending-approvals/:id", async (req, res) => {
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

  app.post("/api/batch-upload/credit-accounts", async (req, res) => {
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

  return httpServer;
}
