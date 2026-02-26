import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBorrowerSchema, insertCreditAccountSchema, insertCreditInquirySchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/dashboard/stats", async (_req, res) => {
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
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const user = await storage.createUser(parsed);
      res.status(201).json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
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
      const borrower = await storage.createBorrower(parsed);
      await storage.createAuditLog({
        action: "CREATE",
        entity: "borrower",
        entityId: borrower.id,
        details: `Created borrower: ${borrower.firstName || borrower.companyName}`,
      });
      res.status(201).json(borrower);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/borrowers/:id", async (req, res) => {
    try {
      const borrower = await storage.updateBorrower(req.params.id, req.body);
      if (!borrower) return res.status(404).json({ message: "Borrower not found" });
      await storage.createAuditLog({
        action: "UPDATE",
        entity: "borrower",
        entityId: borrower.id,
        details: `Updated borrower: ${borrower.firstName || borrower.companyName}`,
      });
      res.json(borrower);
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
      const account = await storage.createCreditAccount(parsed);
      await storage.createAuditLog({
        action: "CREATE",
        entity: "credit_account",
        entityId: account.id,
        details: `Created credit account: ${account.accountNumber} at ${account.lenderInstitution}`,
      });
      res.status(201).json(account);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/credit-accounts/:id", async (req, res) => {
    try {
      const account = await storage.updateCreditAccount(req.params.id, req.body);
      if (!account) return res.status(404).json({ message: "Account not found" });
      await storage.createAuditLog({
        action: "UPDATE",
        entity: "credit_account",
        entityId: account.id,
        details: `Updated credit account: ${account.accountNumber}`,
      });
      res.json(account);
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
        action: "CREATE",
        entity: "credit_inquiry",
        entityId: inquiry.id,
        details: `Credit inquiry for borrower ${inquiry.borrowerId} by ${inquiry.institution}`,
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

  return httpServer;
}
