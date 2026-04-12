import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { platformDeployments, insertPlatformDeploymentSchema } from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { createLogger } from "../logger";
import { rateLimitKeyGenerator } from "./middleware";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import os from "os";

const logger = createLogger("platform-control");

const MASTER_PASSWORD = process.env.MASTER_CONTROL_PASSWORD || "";
const SESSION_TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000;
const activeSessions = new Map<string, { expiresAt: number }>();

const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const masterAuthLimiter = rateLimit({
  keyGenerator: rateLimitKeyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function parseCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const match = header.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function requireMasterAuth(req: Request, res: Response, next: NextFunction) {
  const headerKey = req.headers["x-master-key"] as string;
  if (headerKey && MASTER_PASSWORD && headerKey.length === MASTER_PASSWORD.length &&
      crypto.timingSafeEqual(Buffer.from(headerKey), Buffer.from(MASTER_PASSWORD))) {
    return next();
  }

  const sessionToken = parseCookie(req, "pc_session");
  if (sessionToken && activeSessions.has(sessionToken)) {
    const session = activeSessions.get(sessionToken)!;
    if (session.expiresAt > Date.now()) {
      return next();
    }
    activeSessions.delete(sessionToken);
  }

  return res.status(401).json({ message: "Master authentication required" });
}

const updateDeploymentSchema = z.object({
  clientName: z.string().optional(),
  country: z.string().optional(),
  region: z.string().nullable().optional(),
  deploymentUrl: z.string().nullable().optional(),
  status: z.enum(["active", "suspended", "trial", "decommissioned"]).optional(),
  licenseTier: z.string().optional(),
  monthlyFeeCents: z.number().int().nullable().optional(),
  currency: z.string().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  totalBorrowers: z.number().int().nullable().optional(),
  totalInstitutions: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

async function safeCount(table: string): Promise<number> {
  try {
    const r = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    return parseInt(r.rows[0]?.count || "0");
  } catch { return -1; }
}

async function safeQuery(q: string): Promise<any[]> {
  try {
    const r = await pool.query(q);
    return r.rows;
  } catch { return []; }
}

export function registerPlatformControlRoutes(app: Express) {
  if (!MASTER_PASSWORD) {
    logger.warn("MASTER_CONTROL_PASSWORD not set — platform control center disabled");
    return;
  }

  app.post("/api/platform-control/auth", masterAuthLimiter, (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    const attempt = failedAttempts.get(ip);
    if (attempt && attempt.lockedUntil > Date.now()) {
      return res.status(429).json({ message: "Account locked. Try again later." });
    }

    const { password } = req.body || {};
    if (!password || typeof password !== "string" || password.length !== MASTER_PASSWORD.length ||
        !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(MASTER_PASSWORD))) {
      const current = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      current.count++;
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MS;
        logger.warn("Platform control IP locked out", { ip, attempts: current.count });
      }
      failedAttempts.set(ip, current);
      logger.warn("Failed platform control auth attempt", { ip, attempts: current.count });
      return res.status(401).json({ message: "Invalid master password" });
    }

    failedAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString("hex");
    activeSessions.set(token, { expiresAt: Date.now() + SESSION_TOKEN_EXPIRY_MS });

    res.cookie("pc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_TOKEN_EXPIRY_MS,
      path: "/api/platform-control",
    });

    logger.info("Platform control authenticated", { ip });
    return res.json({ authenticated: true });
  });

  app.post("/api/platform-control/logout", requireMasterAuth, (_req: Request, res: Response) => {
    const token = parseCookie(_req, "pc_session");
    if (token) activeSessions.delete(token);
    res.clearCookie("pc_session", { path: "/api/platform-control" });
    return res.json({ loggedOut: true });
  });

  app.get("/api/platform-control/check", (req: Request, res: Response) => {
    const headerKey = req.headers["x-master-key"] as string;
    if (headerKey && MASTER_PASSWORD && headerKey.length === MASTER_PASSWORD.length &&
        crypto.timingSafeEqual(Buffer.from(headerKey), Buffer.from(MASTER_PASSWORD))) {
      return res.json({ authenticated: true });
    }
    const sessionToken = parseCookie(req, "pc_session");
    if (sessionToken && activeSessions.has(sessionToken)) {
      const session = activeSessions.get(sessionToken)!;
      if (session.expiresAt > Date.now()) {
        return res.json({ authenticated: true });
      }
      activeSessions.delete(sessionToken);
    }
    return res.json({ authenticated: false });
  });

  app.get("/api/platform-control/deployments", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const deployments = await db.select().from(platformDeployments).orderBy(desc(platformDeployments.createdAt));
      return res.json(deployments);
    } catch (e: any) {
      logger.error("Failed to fetch deployments", { error: e.message });
      return res.status(500).json({ message: "Failed to fetch deployments" });
    }
  });

  app.post("/api/platform-control/deployments", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertPlatformDeploymentSchema.parse(req.body);
      const [created] = await db.insert(platformDeployments).values(parsed).returning();
      logger.info("Deployment created", { id: created.id, client: created.clientName });
      return res.status(201).json(created);
    } catch (e: any) {
      logger.error("Failed to create deployment", { error: e.message });
      return res.status(400).json({ message: e.message || "Invalid deployment data" });
    }
  });

  app.patch("/api/platform-control/deployments/:id", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parsed = updateDeploymentSchema.parse(req.body);
      const updates = { ...parsed, updatedAt: new Date() };

      const [updated] = await db.update(platformDeployments)
        .set(updates)
        .where(eq(platformDeployments.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Deployment not found" });
      logger.info("Deployment updated", { id, changes: Object.keys(parsed) });
      return res.json(updated);
    } catch (e: any) {
      logger.error("Failed to update deployment", { error: e.message });
      return res.status(400).json({ message: e.message || "Update failed" });
    }
  });

  app.delete("/api/platform-control/deployments/:id", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(platformDeployments).where(eq(platformDeployments.id, id)).returning();
      if (!deleted) return res.status(404).json({ message: "Deployment not found" });
      logger.info("Deployment deleted", { id });
      return res.json({ deleted: true });
    } catch (e: any) {
      logger.error("Failed to delete deployment", { error: e.message });
      return res.status(500).json({ message: "Delete failed" });
    }
  });

  app.get("/api/platform-control/summary", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const deployments = await db.select().from(platformDeployments);
      const totalDeployments = deployments.length;
      const activeDeployments = deployments.filter(d => d.status === "active").length;
      const trialDeployments = deployments.filter(d => d.status === "trial").length;
      const suspendedDeployments = deployments.filter(d => d.status === "suspended").length;

      const totalMRR = deployments
        .filter(d => d.status === "active" || d.status === "trial")
        .reduce((sum, d) => sum + (d.monthlyFeeCents || 0), 0);

      const countriesServed = [...new Set(deployments.filter(d => d.status !== "decommissioned").map(d => d.country))];
      const totalBorrowers = deployments.reduce((sum, d) => sum + (d.totalBorrowers || 0), 0);
      const totalInstitutions = deployments.reduce((sum, d) => sum + (d.totalInstitutions || 0), 0);

      let localStats: any = {};
      try {
        const borrowerCount = await pool.query("SELECT COUNT(*) as count FROM borrowers");
        const orgCount = await pool.query("SELECT COUNT(*) as count FROM organizations");
        const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
        localStats = {
          localBorrowers: parseInt(borrowerCount.rows[0]?.count || "0"),
          localOrganizations: parseInt(orgCount.rows[0]?.count || "0"),
          localUsers: parseInt(userCount.rows[0]?.count || "0"),
        };
      } catch {}

      return res.json({
        totalDeployments, activeDeployments, trialDeployments, suspendedDeployments,
        totalMRRCents: totalMRR, countriesServed, totalBorrowers, totalInstitutions,
        ...localStats,
      });
    } catch (e: any) {
      logger.error("Failed to get summary", { error: e.message });
      return res.status(500).json({ message: "Failed to get summary" });
    }
  });

  app.get("/api/platform-control/system-health", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      let dbLatencyMs = -1;
      let dbStatus = "error";
      let dbVersion = "";
      let dbSizeMB = "";
      try {
        const t0 = Date.now();
        await pool.query("SELECT 1");
        dbLatencyMs = Date.now() - t0;
        dbStatus = dbLatencyMs < 500 ? "healthy" : "slow";
        const vr = await pool.query("SELECT version()");
        dbVersion = vr.rows[0]?.version || "";
        const sr = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
        dbSizeMB = sr.rows[0]?.size || "";
      } catch (e: any) {
        dbStatus = "error";
      }

      const poolStats = {
        totalCount: (pool as any).totalCount || 0,
        idleCount: (pool as any).idleCount || 0,
        waitingCount: (pool as any).waitingCount || 0,
      };

      const mem = process.memoryUsage();
      const memory = {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      };

      const uptimeSec = process.uptime();
      const uptimeFormatted = `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;

      const system = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        loadAvg: os.loadavg().map(l => Math.round(l * 100) / 100),
        hostname: os.hostname(),
      };

      const env = process.env;
      const integrations = {
        stripe: { connected: !!(env.REPLIT_CONNECTORS_HOSTNAME || env.STRIPE_SECRET_KEY), label: "Stripe Payments" },
        sendgrid: { connected: !!env.SENDGRID_API_KEY, label: "SendGrid Email" },
        smtp: { connected: !!(env.SMTP_HOST && env.SMTP_USER), label: "SMTP Email", detail: env.SMTP_HOST || "" },
        twilio: { connected: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN), label: "Twilio SMS" },
        africasTalking: { connected: !!(env.AT_USERNAME && env.AT_API_KEY), label: "Africa's Talking SMS" },
        googleOAuth: { connected: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), label: "Google OAuth" },
        microsoftSSO: { connected: !!(env.AZURE_CLIENT_ID && env.AZURE_CLIENT_SECRET), label: "Microsoft Azure SSO" },
        saml: { connected: !!(env.SAML_ENTRY_POINT && env.SAML_ISSUER), label: "SAML 2.0 SSO" },
        piiEncryption: { connected: !!(env.PII_ENCRYPTION_KEY && env.PII_ENCRYPTION_SALT), label: "PII Encryption (AES-256)" },
        openai: { connected: !!(env.OPENAI_API_KEY || env.REPLIT_CONNECTORS_HOSTNAME), label: "OpenAI AI" },
        anthropic: { connected: !!(env.ANTHROPIC_API_KEY || env.REPLIT_CONNECTORS_HOSTNAME), label: "Anthropic AI" },
      };

      const envConfig = {
        NODE_ENV: env.NODE_ENV || "development",
        PRODUCTION_MODE: env.PRODUCTION_MODE || "false",
        PLATFORM_COMPANY_NAME: env.PLATFORM_COMPANY_NAME || "Africa Credit Hub",
        COUNTRY_MODE: env.COUNTRY_MODE || "ghana",
        PORT: env.PORT || "5000",
        DATABASE_URL: env.DATABASE_URL ? "configured" : "missing",
        SESSION_SECRET: env.SESSION_SECRET ? "configured" : "auto-generated",
        MASTER_CONTROL_PASSWORD: "configured",
        CANONICAL_URL: env.CANONICAL_URL || "not set",
        REPLIT_DEPLOYMENT: env.REPLIT_DEPLOYMENT || "none",
        REPLIT_DEV_DOMAIN: env.REPLIT_DEV_DOMAIN || "",
      };

      const security = {
        piiEncrypted: !!(env.PII_ENCRYPTION_KEY),
        sessionSecretStrong: (env.SESSION_SECRET || "").length >= 32,
        productionMode: env.PRODUCTION_MODE === "true",
        mfaAvailable: true,
        webauthnAvailable: true,
        rateLimiting: true,
        blockchainAnchoring: true,
        hmacWebhooks: true,
      };

      return res.json({
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        server: {
          version: "2.5.0",
          nodeVersion: process.version,
          uptime: uptimeFormatted,
          uptimeSeconds: Math.round(uptimeSec),
          memory,
          system,
          pid: process.pid,
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          version: dbVersion,
          size: dbSizeMB,
          pool: poolStats,
        },
        integrations,
        envConfig,
        security,
      });
    } catch (e: any) {
      logger.error("Failed to get system health", { error: e.message });
      return res.status(500).json({ message: "Failed to get system health" });
    }
  });

  app.get("/api/platform-control/database-stats", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const tables = [
        "borrowers", "credit_accounts", "organizations", "users", "credit_inquiries",
        "audit_logs", "disputes", "notifications", "court_judgments", "dishonoured_cheques",
        "consent_records", "payment_history", "institutions", "billing_records",
        "credit_report_logs", "exchange_rates", "api_keys", "api_configurations",
        "data_sharing_agreements", "papss_settlements", "consumer_accounts",
        "wallets", "wallet_transactions", "borrower_alerts", "batch_jobs",
        "pending_approvals", "retention_policies", "guarantors",
        "open_banking_profiles", "decision_rules", "esg_scores",
        "settlement_accounts", "payout_batches", "platform_deployments",
      ];

      const counts: Record<string, number> = {};
      for (const t of tables) {
        counts[t] = await safeCount(t);
      }

      let piiStats: any = {};
      try {
        const piiCols = ["national_id", "tin_number", "passport_number", "voters_id", "ssnit_number",
          "drivers_license", "ghana_card_number", "ezwich_number", "date_of_birth", "mobile_money_number"];
        let totalPii = 0, encryptedPii = 0;
        for (const col of piiCols) {
          const total = await safeQuery(`SELECT COUNT(*) as c FROM borrowers WHERE "${col}" IS NOT NULL AND "${col}" != ''`);
          const enc = await safeQuery(`SELECT COUNT(*) as c FROM borrowers WHERE "${col}" LIKE 'enc:%'`);
          const t = parseInt(total[0]?.c || "0");
          const e = parseInt(enc[0]?.c || "0");
          totalPii += t;
          encryptedPii += e;
        }
        piiStats = { totalPiiFields: totalPii, encryptedPiiFields: encryptedPii, encryptionPercent: totalPii > 0 ? Math.round((encryptedPii / totalPii) * 1000) / 10 : 100 };
      } catch {}

      let recentActivity: any = {};
      try {
        const last24h = await safeQuery(`SELECT COUNT(*) as c FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'`);
        const last7d = await safeQuery(`SELECT COUNT(*) as c FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days'`);
        const recentLogins = await safeQuery(`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'LOGIN_SUCCESS' AND created_at > NOW() - INTERVAL '24 hours'`);
        const failedLogins = await safeQuery(`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '24 hours'`);
        const recentReports = await safeQuery(`SELECT COUNT(*) as c FROM credit_report_logs WHERE created_at > NOW() - INTERVAL '24 hours'`);
        const recentDisputes = await safeQuery(`SELECT COUNT(*) as c FROM disputes WHERE created_at > NOW() - INTERVAL '7 days'`);
        const openDisputes = await safeQuery(`SELECT COUNT(*) as c FROM disputes WHERE status = 'open' OR status = 'under_review'`);
        recentActivity = {
          auditLogs24h: parseInt(last24h[0]?.c || "0"),
          auditLogs7d: parseInt(last7d[0]?.c || "0"),
          logins24h: parseInt(recentLogins[0]?.c || "0"),
          failedLogins24h: parseInt(failedLogins[0]?.c || "0"),
          creditReports24h: parseInt(recentReports[0]?.c || "0"),
          disputes7d: parseInt(recentDisputes[0]?.c || "0"),
          openDisputes: parseInt(openDisputes[0]?.c || "0"),
        };
      } catch {}

      let orgBreakdown: any[] = [];
      try {
        const orgs = await safeQuery(`SELECT id, name, status, license_tier, country, created_at FROM organizations ORDER BY created_at DESC LIMIT 50`);
        orgBreakdown = orgs;
      } catch {}

      let userBreakdown: any = {};
      try {
        const byRole = await safeQuery(`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`);
        const mfaEnabled = await safeQuery(`SELECT COUNT(*) as c FROM users WHERE totp_secret IS NOT NULL`);
        const activeUsers = await safeQuery(`SELECT COUNT(*) as c FROM users WHERE is_active = true`);
        userBreakdown = {
          byRole: byRole.reduce((acc: any, r: any) => { acc[r.role] = parseInt(r.count); return acc; }, {}),
          mfaEnabled: parseInt(mfaEnabled[0]?.c || "0"),
          totalActive: parseInt(activeUsers[0]?.c || "0"),
        };
      } catch {}

      return res.json({
        tableCounts: counts,
        piiStats,
        recentActivity,
        orgBreakdown,
        userBreakdown,
      });
    } catch (e: any) {
      logger.error("Failed to get database stats", { error: e.message });
      return res.status(500).json({ message: "Failed to get database stats" });
    }
  });

  app.get("/api/platform-control/revenue-overview", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const deployments = await db.select().from(platformDeployments);

      const byTier: Record<string, { count: number; mrrCents: number }> = {};
      const byCountry: Record<string, { count: number; mrrCents: number }> = {};
      let totalARRCents = 0;

      for (const d of deployments) {
        if (d.status === "decommissioned") continue;
        const fee = d.monthlyFeeCents || 0;
        if (!byTier[d.licenseTier]) byTier[d.licenseTier] = { count: 0, mrrCents: 0 };
        byTier[d.licenseTier].count++;
        if (d.status === "active" || d.status === "trial") byTier[d.licenseTier].mrrCents += fee;

        if (!byCountry[d.country]) byCountry[d.country] = { count: 0, mrrCents: 0 };
        byCountry[d.country].count++;
        if (d.status === "active" || d.status === "trial") byCountry[d.country].mrrCents += fee;

        if (d.status === "active" || d.status === "trial") totalARRCents += fee * 12;
      }

      let localBilling: any = {};
      try {
        const totalBilling = await safeQuery(`SELECT SUM(amount) as total FROM billing_records`);
        const monthBilling = await safeQuery(`SELECT SUM(amount) as total FROM billing_records WHERE created_at > NOW() - INTERVAL '30 days'`);
        const walletBalances = await safeQuery(`SELECT SUM(balance_cents) as total, COUNT(*) as wallets FROM wallets`);
        localBilling = {
          totalBilledAllTime: parseFloat(totalBilling[0]?.total || "0"),
          billedLast30Days: parseFloat(monthBilling[0]?.total || "0"),
          totalWalletBalance: parseInt(walletBalances[0]?.total || "0"),
          activeWallets: parseInt(walletBalances[0]?.wallets || "0"),
        };
      } catch {}

      return res.json({
        totalARRCents,
        byTier,
        byCountry,
        localBilling,
        deploymentCount: deployments.filter(d => d.status !== "decommissioned").length,
      });
    } catch (e: any) {
      logger.error("Failed to get revenue overview", { error: e.message });
      return res.status(500).json({ message: "Failed to get revenue overview" });
    }
  });

  app.post("/api/platform-control/generate-config", requireMasterAuth, (req: Request, res: Response) => {
    const { clientName, country, currency, regulatoryBody, brandTitle } = req.body || {};
    if (!clientName || !country) {
      return res.status(400).json({ message: "clientName and country are required" });
    }

    const config = {
      PLATFORM_COMPANY_NAME: clientName,
      COUNTRY_MODE: country.toLowerCase().replace(/\s+/g, "_"),
      PRODUCTION_MODE: "true",
      PII_ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"),
      PII_ENCRYPTION_SALT: crypto.randomBytes(16).toString("hex"),
      DEFAULT_CURRENCY: currency || "GHS",
      REGULATORY_BODY: regulatoryBody || "",
      BRAND_TITLE: brandTitle || clientName,
      SEED_ADMIN_PASSWORD: crypto.randomBytes(16).toString("base64url"),
    };

    return res.json({ config, instructions: [
      "1. Fork this Replit project for the new client",
      "2. Set each environment variable above in the forked project's Secrets",
      "3. Update database connection string to a new isolated PostgreSQL instance",
      "4. Deploy and verify the /health endpoint",
      "5. Register the deployment in this control center",
    ]});
  });

  logger.info("Platform control center routes registered");
}
