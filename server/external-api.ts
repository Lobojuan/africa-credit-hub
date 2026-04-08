import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  insertBorrowerSchema, insertCreditAccountSchema, insertPaymentHistorySchema,
  insertCourtJudgmentSchema, insertConsentRecordSchema,
} from "@shared/schema";
import crypto from "crypto";
import { calculateCreditScore } from "./credit-score";
import { computeTelcoKPIs, generateTelcoCreditScore } from "./telco-scoring";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.EXTERNAL_API_JWT_SECRET || process.env.SESSION_SECRET! + "-jwt-ext";
const TOKEN_EXPIRY = "1h";

export function validateExternalApiConfig(): void {
  if (!process.env.EXTERNAL_API_JWT_SECRET) {
    console.warn("[SECURITY] EXTERNAL_API_JWT_SECRET not set — falling back to SESSION_SECRET-derived key. Set a dedicated secret for production.");
  }
}

// MIGRATION NOTE: Switching from SHA-256 to HMAC-SHA256 invalidates all
// existing API key hashes. Existing keys must be reissued after this change.
function hashApiKey(key: string): string {
  const secret = process.env.API_KEY_HMAC_SECRET || process.env.SESSION_SECRET!;
  return crypto.createHmac("sha256", secret).update(key).digest("hex");
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
    res.json({ status: "ok", version: "1.1", service: `${process.env.PLATFORM_COMPANY_NAME || "Africa Credit Hub"} Credit Registry API` });
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

  app.post("/api/external/v1/telco/profiles", requireApiKey, requirePermission("submit", "full"), async (req: Request, res: Response) => {
    try {
      const { msisdn, provider, country, kycLevel, simRegistrationDate, deviceType, deviceModel } = req.body;
      if (!msisdn || !provider || !country) {
        return res.status(400).json(wrapError("msisdn, provider, and country are required"));
      }
      const existing = await storage.getTelcoProfileByMsisdn(msisdn);
      if (existing) {
        return res.json(wrapResponse(existing, "Profile already exists"));
      }
      const profile = await storage.createTelcoProfile({
        msisdn, provider, country,
        kycLevel: kycLevel || "basic",
        simRegistrationDate: simRegistrationDate || new Date().toISOString().split("T")[0],
        deviceType: deviceType || "Smartphone",
        deviceModel,
      });
      await storage.createAuditLog({
        action: "API_TELCO_PROFILE_CREATED", entity: "telco_profile", entityId: profile.id,
        details: `Telco profile created via API for ${msisdn} (${provider}, ${country})`,
        ipAddress: req.ip || "api",
      });
      res.status(201).json(wrapResponse(profile, "Profile created"));
    } catch (e: any) {
      res.status(500).json(wrapError("Profile creation failed", e.message));
    }
  });

  app.get("/api/external/v1/telco/profiles/:msisdn", requireApiKey, requirePermission("read", "full"), async (req: Request, res: Response) => {
    try {
      const profile = await storage.getTelcoProfileByMsisdn(req.params.msisdn);
      if (!profile) return res.status(404).json(wrapError("Profile not found"));
      res.json(wrapResponse(profile, "Profile retrieved"));
    } catch (e: any) {
      res.status(500).json(wrapError("Lookup failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/transactions/import", requireApiKey, requirePermission("submit", "full"), async (req: Request, res: Response) => {
    try {
      const { profileId, msisdn, transactions } = req.body;
      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json(wrapError("transactions array is required"));
      }
      let profile;
      if (profileId) {
        profile = await storage.getTelcoProfile(profileId);
      } else if (msisdn) {
        profile = await storage.getTelcoProfileByMsisdn(msisdn);
      }
      if (!profile) return res.status(404).json(wrapError("Profile not found. Create profile first or provide valid profileId/msisdn."));

      const txRecords = transactions.map((tx: any) => ({
        profileId: profile.id,
        transactionType: tx.transactionType,
        amount: String(tx.amount),
        currency: tx.currency || "USD",
        counterpartyMsisdn: tx.counterpartyMsisdn,
        counterpartyName: tx.counterpartyName,
        description: tx.description,
        transactionDate: tx.transactionDate,
        balanceAfter: tx.balanceAfter ? String(tx.balanceAfter) : undefined,
        category: tx.category,
        status: tx.status || "completed",
        country: profile.country,
      }));
      let imported = 0;
      try {
        const created = await storage.createMomoTransactions(txRecords);
        imported = created.length;
      } catch { /* batch insert failed */ }
      await storage.createAuditLog({
        action: "API_MOMO_IMPORT", entity: "momo_transactions", entityId: profile.id,
        details: `${imported}/${transactions.length} MoMo transactions imported via API for ${profile.msisdn}`,
        ipAddress: req.ip || "api",
      });
      res.json(wrapResponse({ profileId: profile.id, imported, total: transactions.length }, `${imported} transactions imported`));
    } catch (e: any) {
      res.status(500).json(wrapError("Transaction import failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/score", requireApiKey, requirePermission("read", "full"), async (req: Request, res: Response) => {
    try {
      const { profileId, msisdn, periodDays } = req.body;
      let profile;
      if (profileId) {
        profile = await storage.getTelcoProfile(profileId);
      } else if (msisdn) {
        profile = await storage.getTelcoProfileByMsisdn(msisdn);
      }
      if (!profile) return res.status(404).json(wrapError("Profile not found. Provide profileId or msisdn."));

      const transactions = await storage.getMomoTransactions(profile.id);
      if (transactions.length === 0) {
        return res.status(400).json(wrapError("No MoMo transactions found. Import transactions before scoring."));
      }
      const period = parseInt(periodDays) || 90;
      const kpis = computeTelcoKPIs(profile, transactions, period);
      const aiResult = await generateTelcoCreditScore(profile, kpis);

      const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
      const normalizedTier = validTiers.includes(aiResult.riskTier as any) ? aiResult.riskTier : "medium";
      const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));

      const score = await storage.createTelcoCreditScore({
        profileId: profile.id,
        borrowerId: profile.borrowerId || undefined,
        riskTier: normalizedTier as any,
        riskScore: normalizedScore,
        creditLimit: aiResult.suggestedCreditLimitUsd?.toString(),
        currency: "USD",
        approvalRecommendation: aiResult.approvalRecommendation,
        reasonCode: aiResult.reasonCode,
        detailedRationale: aiResult.detailedRationale,
        evaluationPeriodDays: period,
        kpiSnapshot: JSON.stringify(kpis),
        aiProvider: aiResult.aiProvider,
        aiModel: aiResult.aiModel,
        country: profile.country,
      });

      await storage.createAuditLog({
        action: "API_TELCO_SCORE", entity: "telco_credit_score", entityId: score.id,
        details: `AI telco score via API for ${profile.msisdn}: ${normalizedTier} (${normalizedScore}/5), limit $${aiResult.suggestedCreditLimitUsd}`,
        ipAddress: req.ip || "api",
      });

      res.json(wrapResponse({
        scoreId: score.id,
        msisdn: profile.msisdn,
        provider: profile.provider,
        country: profile.country,
        riskScore: normalizedScore,
        riskTier: normalizedTier,
        approvalRecommendation: aiResult.approvalRecommendation,
        suggestedCreditLimit: aiResult.suggestedCreditLimitUsd,
        currency: "USD",
        reasonCode: aiResult.reasonCode,
        detailedRationale: aiResult.detailedRationale,
        keyFactors: aiResult.keyFactors,
        regulatoryNote: aiResult.regulatoryNote,
        aiProvider: aiResult.aiProvider,
        evaluationPeriodDays: period,
        transactionsAnalyzed: transactions.length,
        scoredAt: score.createdAt,
      }, "Credit score generated"));
    } catch (e: any) {
      console.error("[ExternalAPI] Telco score error:", e.message);
      res.status(500).json(wrapError("Credit scoring failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/score/batch", requireApiKey, requirePermission("full"), async (req: Request, res: Response) => {
    try {
      const { msisdns, periodDays } = req.body;
      if (!msisdns || !Array.isArray(msisdns) || msisdns.length === 0) {
        return res.status(400).json(wrapError("msisdns array is required"));
      }
      if (msisdns.length > 50) {
        return res.status(400).json(wrapError("Maximum 50 MSISDNs per batch"));
      }
      const period = parseInt(periodDays) || 90;
      const results: any[] = [];

      for (const msisdn of msisdns) {
        try {
          const profile = await storage.getTelcoProfileByMsisdn(msisdn);
          if (!profile) { results.push({ msisdn, status: "error", error: "Profile not found" }); continue; }
          const transactions = await storage.getMomoTransactions(profile.id);
          if (transactions.length === 0) { results.push({ msisdn, status: "error", error: "No transactions" }); continue; }
          const kpis = computeTelcoKPIs(profile, transactions, period);
          const aiResult = await generateTelcoCreditScore(profile, kpis);
          const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
          const normalizedTier = validTiers.includes(aiResult.riskTier as any) ? aiResult.riskTier : "medium";
          const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));
          await storage.createTelcoCreditScore({
            profileId: profile.id, riskTier: normalizedTier as any, riskScore: normalizedScore,
            creditLimit: aiResult.suggestedCreditLimitUsd?.toString(), currency: "USD",
            approvalRecommendation: aiResult.approvalRecommendation, reasonCode: aiResult.reasonCode,
            detailedRationale: aiResult.detailedRationale, evaluationPeriodDays: period,
            kpiSnapshot: JSON.stringify(kpis), aiProvider: aiResult.aiProvider, aiModel: aiResult.aiModel, country: profile.country,
          });
          results.push({ msisdn, status: "scored", riskScore: normalizedScore, riskTier: normalizedTier, approved: aiResult.approvalRecommendation, creditLimit: aiResult.suggestedCreditLimitUsd });
        } catch (e: any) {
          results.push({ msisdn, status: "error", error: e.message });
        }
      }
      res.json(wrapResponse({ total: msisdns.length, scored: results.filter(r => r.status === "scored").length, results }, "Batch scoring complete"));
    } catch (e: any) {
      res.status(500).json(wrapError("Batch scoring failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/decision", requireApiKey, requirePermission("read", "full"), async (req: Request, res: Response) => {
    try {
      const { profileId, msisdn, requestedAmount, currency } = req.body;
      let profile;
      if (profileId) {
        profile = await storage.getTelcoProfile(profileId);
      } else if (msisdn) {
        profile = await storage.getTelcoProfileByMsisdn(msisdn);
      }
      if (!profile) return res.status(404).json(wrapError("Profile not found"));

      const scores = await storage.getTelcoCreditScoresByProfile(profile.id);
      if (scores.length === 0) {
        return res.status(400).json(wrapError("No credit score on file. Run /telco/score first."));
      }
      const latestScore = scores[0];
      const creditLimit = Number(latestScore.creditLimit || 0);
      const amount = Number(requestedAmount || creditLimit);
      const approved = latestScore.approvalRecommendation && amount <= creditLimit;

      const decision = {
        profileId: profile.id,
        msisdn: profile.msisdn,
        decision: approved ? "APPROVED" : "DECLINED",
        requestedAmount: amount,
        approvedAmount: approved ? Math.min(amount, creditLimit) : 0,
        creditLimit,
        currency: currency || latestScore.currency || "USD",
        riskScore: latestScore.riskScore,
        riskTier: latestScore.riskTier,
        scoreId: latestScore.id,
        decisionDate: new Date().toISOString(),
        reasons: approved
          ? [`Credit limit $${creditLimit} sufficient for $${amount}`, `Risk tier: ${latestScore.riskTier}`]
          : [
              ...(amount > creditLimit ? [`Requested $${amount} exceeds credit limit $${creditLimit}`] : []),
              ...(!latestScore.approvalRecommendation ? [`Risk assessment: ${latestScore.riskTier} — declined by scoring model`] : []),
            ],
      };

      await storage.createAuditLog({
        action: "API_TELCO_DECISION", entity: "telco_decision", entityId: profile.id,
        details: `Decision via API for ${profile.msisdn}: ${decision.decision} ($${decision.approvedAmount}/${decision.requestedAmount})`,
        ipAddress: req.ip || "api",
      });

      res.json(wrapResponse(decision, `Loan decision: ${decision.decision}`));
    } catch (e: any) {
      res.status(500).json(wrapError("Decision failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/consent", requireApiKey, requirePermission("submit", "full"), async (req: Request, res: Response) => {
    try {
      const { profileId, msisdn, action, purpose, method } = req.body;
      if (!action || !["grant", "revoke"].includes(action)) {
        return res.status(400).json(wrapError("action must be 'grant' or 'revoke'"));
      }
      let profile;
      if (profileId) {
        profile = await storage.getTelcoProfile(profileId);
      } else if (msisdn) {
        profile = await storage.getTelcoProfileByMsisdn(msisdn);
      }
      if (!profile) return res.status(404).json(wrapError("Profile not found"));

      const event = await storage.createTelcoConsentEvent({
        profileId: profile.id,
        action,
        purpose: purpose || "credit_scoring",
        method: method || "app",
        ipAddress: req.ip || "api",
        country: profile.country,
      });

      await storage.createAuditLog({
        action: "API_TELCO_CONSENT", entity: "telco_consent", entityId: event.id,
        details: `Consent ${action} via API for ${profile.msisdn} (purpose: ${purpose || "credit_scoring"})`,
        ipAddress: req.ip || "api",
      });

      res.json(wrapResponse(event, `Consent ${action}ed`));
    } catch (e: any) {
      res.status(500).json(wrapError("Consent recording failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/loans", requireApiKey, requirePermission("submit", "full"), async (req: Request, res: Response) => {
    try {
      const { profileId, msisdn, loanAmount, currency, interestRate, tenorDays } = req.body;
      let profile;
      if (profileId) {
        profile = await storage.getTelcoProfile(profileId);
      } else if (msisdn) {
        profile = await storage.getTelcoProfileByMsisdn(msisdn);
      }
      if (!profile) return res.status(404).json(wrapError("Profile not found"));

      const amount = Number(loanAmount);
      if (!amount || amount <= 0) return res.status(400).json(wrapError("Valid loanAmount required"));
      const rate = Number(interestRate || 15);
      const tenor = Number(tenorDays || 30);
      const totalRepayable = Math.round(amount * (1 + rate / 100));
      const dueDate = new Date(Date.now() + tenor * 86400000);

      const loan = await storage.createTelcoLoan({
        profileId: profile.id,
        loanAmount: String(amount),
        currency: currency || "USD",
        interestRate: String(rate.toFixed(2)),
        totalRepayable: String(totalRepayable),
        amountRepaid: "0",
        outstandingBalance: String(totalRepayable),
        status: "pending_disbursement",
        disbursementStatus: "pending",
        disbursementChannel: "mobile_money",
        tenorDays: tenor,
        dueDate,
        country: profile.country,
      });

      await storage.createAuditLog({
        action: "API_TELCO_LOAN_CREATED", entity: "telco_loan", entityId: loan.id,
        details: `Loan created via API for ${profile.msisdn}: ${currency || "USD"} ${amount}, tenor ${tenor}d`,
        ipAddress: req.ip || "api",
      });

      res.status(201).json(wrapResponse(loan, "Loan created"));
    } catch (e: any) {
      res.status(500).json(wrapError("Loan creation failed", e.message));
    }
  });

  app.post("/api/external/v1/telco/score-and-decide", requireApiKey, requirePermission("full"), async (req: Request, res: Response) => {
    try {
      const { msisdn, requestedAmount, currency, periodDays } = req.body;
      if (!msisdn) return res.status(400).json(wrapError("msisdn is required"));

      const profile = await storage.getTelcoProfileByMsisdn(msisdn);
      if (!profile) return res.status(404).json(wrapError("Profile not found. Register via POST /telco/profiles first."));

      const transactions = await storage.getMomoTransactions(profile.id);
      if (transactions.length === 0) {
        return res.status(400).json(wrapError("No MoMo transactions. Import via POST /telco/transactions/import first."));
      }

      const period = parseInt(periodDays) || 90;
      const kpis = computeTelcoKPIs(profile, transactions, period);
      const aiResult = await generateTelcoCreditScore(profile, kpis);

      const validTiers = ["very_low", "low", "medium", "high", "very_high"] as const;
      const normalizedTier = validTiers.includes(aiResult.riskTier as any) ? aiResult.riskTier : "medium";
      const normalizedScore = Math.max(1, Math.min(5, Math.round(aiResult.riskScore)));

      const score = await storage.createTelcoCreditScore({
        profileId: profile.id, riskTier: normalizedTier as any, riskScore: normalizedScore,
        creditLimit: aiResult.suggestedCreditLimitUsd?.toString(), currency: "USD",
        approvalRecommendation: aiResult.approvalRecommendation, reasonCode: aiResult.reasonCode,
        detailedRationale: aiResult.detailedRationale, evaluationPeriodDays: period,
        kpiSnapshot: JSON.stringify(kpis), aiProvider: aiResult.aiProvider, aiModel: aiResult.aiModel, country: profile.country,
      });

      const creditLimit = aiResult.suggestedCreditLimitUsd || 0;
      const amount = Number(requestedAmount || creditLimit);
      const approved = aiResult.approvalRecommendation && amount <= creditLimit;

      await storage.createAuditLog({
        action: "API_TELCO_SCORE_DECIDE", entity: "telco_credit_score", entityId: score.id,
        details: `Score+Decide via API: ${profile.msisdn} → ${normalizedTier} (${normalizedScore}/5), ${approved ? "APPROVED" : "DECLINED"} $${amount}`,
        ipAddress: req.ip || "api",
      });

      res.json(wrapResponse({
        scoring: {
          scoreId: score.id, riskScore: normalizedScore, riskTier: normalizedTier,
          creditLimit, transactionsAnalyzed: transactions.length,
          keyFactors: aiResult.keyFactors,
        },
        decision: {
          decision: approved ? "APPROVED" : "DECLINED",
          requestedAmount: amount, approvedAmount: approved ? Math.min(amount, creditLimit) : 0,
          currency: currency || "USD",
        },
        profile: { msisdn: profile.msisdn, provider: profile.provider, country: profile.country, kycLevel: profile.kycLevel },
        processedAt: new Date().toISOString(),
      }, `Score & Decision: ${approved ? "APPROVED" : "DECLINED"}`));
    } catch (e: any) {
      console.error("[ExternalAPI] Score+Decide error:", e.message);
      res.status(500).json(wrapError("Score and decide failed", e.message));
    }
  });
}
