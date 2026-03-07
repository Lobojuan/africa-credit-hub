import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertPaymentHistorySchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema,
} from "@shared/schema";
import crypto from "crypto";
import { calculateCreditScore } from "./credit-score";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET! + "-jwt-ext";
const TOKEN_EXPIRY = "1h";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const prefix = "sim_" + crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const fullKey = `${prefix}_${secret}`;
  const hash = hashApiKey(fullKey);
  return { fullKey, prefix, hash };
}

async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] as string;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const apiKey = await storage.getApiKeyByHash(decoded.keyHash);
      if (!apiKey || apiKey.status !== "active") {
        return res.status(401).json({ error: "Invalid or revoked token" });
      }
      const institution = await storage.getInstitution(apiKey.institutionId);
      if (!institution || institution.status !== "active") {
        return res.status(403).json({ error: "Institution is not active" });
      }
      storage.updateApiKeyLastUsed(apiKey.id).catch(() => {});
      (req as any).apiKey = apiKey;
      (req as any).institution = institution;
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired Bearer token" });
    }
  }

  const apiKeyHeader = req.headers["x-api-key"] as string;
  if (!apiKeyHeader) {
    return res.status(401).json({ error: "Missing X-API-Key or Authorization Bearer header" });
  }

  const hash = hashApiKey(apiKeyHeader);
  const apiKey = await storage.getApiKeyByHash(hash);

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (apiKey.status !== "active") {
    return res.status(403).json({ error: "API key has been revoked" });
  }

  const institution = await storage.getInstitution(apiKey.institutionId);
  if (!institution || institution.status !== "active") {
    return res.status(403).json({ error: "Institution is not active" });
  }

  storage.updateApiKeyLastUsed(apiKey.id).catch(() => {});

  (req as any).apiKey = apiKey;
  (req as any).institution = institution;
  next();
}

function requirePermission(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req as any).apiKey;
    if (!apiKey) return res.status(401).json({ error: "API key not loaded" });
    if (apiKey.permissions === "full" || allowed.includes(apiKey.permissions)) {
      return next();
    }
    return res.status(403).json({ error: `Insufficient permissions. Required: ${allowed.join(" or ")}. Current: ${apiKey.permissions}` });
  };
}

function wrapResponse(data: any, message: string) {
  return { success: true, message, data, timestamp: new Date().toISOString() };
}

function wrapError(error: string, details?: any) {
  return { success: false, error, details, timestamp: new Date().toISOString() };
}

export function registerExternalApi(app: Express) {

  app.post("/api/external/oauth/token", async (req: Request, res: Response) => {
    try {
      const { grant_type, client_id, client_secret } = req.body;
      if (grant_type !== "client_credentials") {
        return res.status(400).json({ error: "unsupported_grant_type", error_description: "Only client_credentials grant type is supported" });
      }
      if (!client_id || !client_secret) {
        return res.status(400).json({ error: "invalid_request", error_description: "client_id and client_secret are required" });
      }
      const hash = hashApiKey(client_secret);
      const apiKey = await storage.getApiKeyByHash(hash);
      if (!apiKey || !apiKey.keyPrefix.startsWith(client_id)) {
        return res.status(401).json({ error: "invalid_client", error_description: "Invalid client credentials" });
      }
      if (apiKey.status !== "active") {
        return res.status(403).json({ error: "invalid_client", error_description: "API key has been revoked" });
      }
      const institution = await storage.getInstitution(apiKey.institutionId);
      if (!institution || institution.status !== "active") {
        return res.status(403).json({ error: "invalid_client", error_description: "Institution is not active" });
      }
      const token = jwt.sign(
        { keyHash: hash, institutionId: apiKey.institutionId, permissions: apiKey.permissions },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      storage.updateApiKeyLastUsed(apiKey.id).catch(() => {});
      res.json({
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
        scope: apiKey.permissions,
      });
    } catch (e: any) {
      res.status(500).json({ error: "server_error", error_description: e.message });
    }
  });

  app.get("/api/external/v1/health", (_req, res) => {
    res.json({ status: "ok", version: "1.1", service: "Systems In Motion Credit Registry API" });
  });

  app.post("/api/external/v1/borrowers", requireApiKey, requirePermission("submit"), async (req: Request, res: Response) => {
    try {
      const institution = (req as any).institution;
      const body = req.body;

      if (Array.isArray(body)) {
        const results: any[] = [];
        const errors: any[] = [];
        for (let i = 0; i < body.length; i++) {
          try {
            const parsed = insertBorrowerSchema.parse(body[i]);
            const borrower = await storage.createBorrower(parsed);
            results.push({ index: i, id: borrower.id, nationalId: borrower.nationalId });
          } catch (e: any) {
            errors.push({ index: i, error: e.message });
          }
        }
        await storage.createAuditLog({
          action: "API_BATCH_SUBMIT", entity: "borrower",
          details: `${results.length} borrowers submitted via API by ${institution.name}`,
          ipAddress: req.ip || "api",
        });
        return res.json(wrapResponse({ submitted: results.length, failed: errors.length, results, errors }, "Batch borrower submission complete"));
      }

      const parsed = insertBorrowerSchema.parse(body);
      const borrower = await storage.createBorrower(parsed);
      await storage.createAuditLog({
        action: "API_SUBMIT", entity: "borrower", entityId: borrower.id,
        details: `Borrower submitted via API by ${institution.name}`,
        ipAddress: req.ip || "api",
      });
      res.status(201).json(wrapResponse(borrower, "Borrower created successfully"));
    } catch (e: any) {
      res.status(400).json(wrapError("Validation failed", e.message));
    }
  });

  app.post("/api/external/v1/credit-accounts", requireApiKey, requirePermission("submit"), async (req: Request, res: Response) => {
    try {
      const institution = (req as any).institution;
      const body = req.body;

      if (Array.isArray(body)) {
        const results: any[] = [];
        const errors: any[] = [];
        for (let i = 0; i < body.length; i++) {
          try {
            const data = { ...body[i], lenderInstitution: body[i].lenderInstitution || institution.name };
            const parsed = insertCreditAccountSchema.parse(data);
            const account = await storage.createCreditAccount(parsed);
            results.push({ index: i, id: account.id, accountNumber: account.accountNumber });
          } catch (e: any) {
            errors.push({ index: i, error: e.message });
          }
        }
        await storage.createAuditLog({
          action: "API_BATCH_SUBMIT", entity: "credit_account",
          details: `${results.length} credit accounts submitted via API by ${institution.name}`,
          ipAddress: req.ip || "api",
        });
        return res.json(wrapResponse({ submitted: results.length, failed: errors.length, results, errors }, "Batch credit account submission complete"));
      }

      const data = { ...body, lenderInstitution: body.lenderInstitution || institution.name };
      const parsed = insertCreditAccountSchema.parse(data);
      const account = await storage.createCreditAccount(parsed);
      await storage.createAuditLog({
        action: "API_SUBMIT", entity: "credit_account", entityId: account.id,
        details: `Credit account submitted via API by ${institution.name}`,
        ipAddress: req.ip || "api",
      });
      res.status(201).json(wrapResponse(account, "Credit account created successfully"));
    } catch (e: any) {
      res.status(400).json(wrapError("Validation failed", e.message));
    }
  });

  app.post("/api/external/v1/payment-history", requireApiKey, requirePermission("submit"), async (req: Request, res: Response) => {
    try {
      const institution = (req as any).institution;
      const body = req.body;

      if (Array.isArray(body)) {
        const results: any[] = [];
        const errors: any[] = [];
        for (let i = 0; i < body.length; i++) {
          try {
            const parsed = insertPaymentHistorySchema.parse(body[i]);
            const entry = await storage.createPaymentHistory(parsed);
            results.push({ index: i, id: entry.id });
          } catch (e: any) {
            errors.push({ index: i, error: e.message });
          }
        }
        await storage.createAuditLog({
          action: "API_BATCH_SUBMIT", entity: "payment_history",
          details: `${results.length} payment records submitted via API by ${institution.name}`,
          ipAddress: req.ip || "api",
        });
        return res.json(wrapResponse({ submitted: results.length, failed: errors.length, results, errors }, "Batch payment history submission complete"));
      }

      const parsed = insertPaymentHistorySchema.parse(body);
      const entry = await storage.createPaymentHistory(parsed);
      await storage.createAuditLog({
        action: "API_SUBMIT", entity: "payment_history", entityId: entry.id,
        details: `Payment history submitted via API by ${institution.name}`,
        ipAddress: req.ip || "api",
      });
      res.status(201).json(wrapResponse(entry, "Payment history entry created successfully"));
    } catch (e: any) {
      res.status(400).json(wrapError("Validation failed", e.message));
    }
  });

  app.post("/api/external/v1/court-judgments", requireApiKey, requirePermission("submit"), async (req: Request, res: Response) => {
    try {
      const institution = (req as any).institution;
      const parsed = insertCourtJudgmentSchema.parse(req.body);
      const judgment = await storage.createCourtJudgment(parsed);
      await storage.createAuditLog({
        action: "API_SUBMIT", entity: "court_judgment", entityId: judgment.id,
        details: `Court judgment submitted via API by ${institution.name}`,
        ipAddress: req.ip || "api",
      });
      res.status(201).json(wrapResponse(judgment, "Court judgment created successfully"));
    } catch (e: any) {
      res.status(400).json(wrapError("Validation failed", e.message));
    }
  });

  app.get("/api/external/v1/borrowers/search", requireApiKey, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const { nationalId, name, q } = req.query;
      if (nationalId) {
        const results = await storage.searchBorrowers(nationalId as string);
        return res.json(wrapResponse(results, "Search results"));
      }
      if (name || q) {
        const results = await storage.searchBorrowers((name || q) as string);
        return res.json(wrapResponse(results, "Search results"));
      }
      res.status(400).json(wrapError("Provide nationalId, name, or q query parameter"));
    } catch (e: any) {
      res.status(500).json(wrapError("Search failed", e.message));
    }
  });

  app.get("/api/external/v1/borrowers/:id/credit-report", requireApiKey, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const institution = (req as any).institution;
      const borrower = await storage.getBorrower(req.params.id);
      if (!borrower) return res.status(404).json(wrapError("Borrower not found"));

      const accounts = await storage.getCreditAccountsByBorrower(borrower.id);
      const inquiries = await storage.getCreditInquiriesByBorrower(borrower.id);
      const judgments = await storage.getCourtJudgmentsByBorrower(borrower.id);
      const consents = await storage.getConsentRecordsByBorrower(borrower.id);

      const serialNumber = `CR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      await storage.createCreditReportLog({
        borrowerId: borrower.id,
        requestedBy: (req as any).apiKey.createdBy,
        institution: institution.name,
        purpose: (req.query.purpose as string) || "api_inquiry",
        serialNumber,
      });

      const { score, reasonCodes } = calculateCreditScore(accounts, inquiries.length, judgments, borrower.isPep);

      await storage.createAuditLog({
        action: "API_CREDIT_REPORT", entity: "borrower", entityId: borrower.id,
        details: `Credit report requested via API by ${institution.name}, serial: ${serialNumber}`,
        ipAddress: req.ip || "api",
      });

      res.json(wrapResponse({
        serialNumber,
        generatedAt: new Date().toISOString(),
        borrower,
        creditScore: { score, reasonCodes },
        accounts,
        inquiries,
        courtJudgments: judgments,
        consentRecords: consents,
      }, "Credit report generated"));
    } catch (e: any) {
      res.status(500).json(wrapError("Report generation failed", e.message));
    }
  });

  app.get("/api/external/v1/credit-accounts/:borrowerId", requireApiKey, requirePermission("read"), async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getCreditAccountsByBorrower(req.params.borrowerId);
      res.json(wrapResponse(accounts, "Credit accounts retrieved"));
    } catch (e: any) {
      res.status(500).json(wrapError("Failed to retrieve accounts", e.message));
    }
  });
}
