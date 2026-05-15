import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { platformDeployments, insertPlatformDeploymentSchema, registryCredentials as registryCredentialsTable } from "@shared/schema";
import { encryptPII } from "../encryption";
import { registryStatus, setRegistryCredentialOverride, clearRegistryCredentialOverride, loadRegistryCredentialsFromDb } from "../asset-trace";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createLogger } from "../logger";
import { rateLimitKeyGenerator } from "./middleware";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import os from "os";
import { ReplitConnectors } from "@replit/connectors-sdk";

const logger = createLogger("platform-control");

const MASTER_PASSWORD = process.env.MASTER_CONTROL_PASSWORD ?? "";
if (!MASTER_PASSWORD) {
  if (process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true") {
    throw new Error("CRITICAL: MASTER_CONTROL_PASSWORD must be set in production — platform control panel is inaccessible without it.");
  }
  console.warn("[SECURITY] WARNING: MASTER_CONTROL_PASSWORD not set — platform control panel login will always fail. Set this secret before deploying.");
}
const SESSION_TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000;
const activeSessions = new Map<string, { expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
  for (const [ip, attempt] of failedAttempts) {
    if (attempt.lockedUntil <= now) {
      failedAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

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
  validate: { keyGeneratorIpFallback: false },
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
  platformFeePercent: z.number().int().min(0).max(100).nullable().optional(),
  currency: z.string().optional(),
  branding: z.string().nullable().optional(),
  deploymentDate: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  totalBorrowers: z.number().int().nullable().optional(),
  totalInstitutions: z.number().int().nullable().optional(),
  githubRepo: z.string().nullable().optional(),
  heartbeatUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

async function safeCount(table: string): Promise<number> {
  try {
    const r = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(table)}`);
    return parseInt((r.rows[0] as Record<string, string>)?.count || "0");
  } catch { return -1; }
}

async function safeQuery(q: SQL): Promise<Record<string, string>[]> {
  try {
    const r = await db.execute(q);
    return r.rows as Record<string, string>[];
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
    } catch (e: unknown) {
      logger.error("Failed to fetch deployments", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to fetch deployments" });
    }
  });

  app.post("/api/platform-control/deployments", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertPlatformDeploymentSchema.parse(req.body);
      const [created] = await db.insert(platformDeployments).values(parsed).returning();
      logger.info("Deployment created", { id: created.id, client: created.clientName });
      return res.status(201).json(created);
    } catch (e: unknown) {
      logger.error("Failed to create deployment", { error: (e as Error).message });
      return res.status(400).json({ message: (e as Error).message || "Invalid deployment data" });
    }
  });

  app.patch("/api/platform-control/deployments/:id", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const id = req.params["id"] as string;
      const { updateNote, ...body } = req.body || {};
      const parsed = updateDeploymentSchema.parse(body);
      const now = new Date();

      const [existing] = await db.select().from(platformDeployments).where(eq(platformDeployments.id, id));
      if (!existing) return res.status(404).json({ message: "Deployment not found" });

      const logEntry = {
        timestamp: now.toISOString(),
        changes: Object.keys(parsed),
        note: updateNote || "",
        previousStatus: existing.status,
      };
      const currentLog = Array.isArray(existing.updateLog) ? existing.updateLog : [];
      const newLog = [logEntry, ...currentLog].slice(0, 100);

      const updates = { ...parsed, updatedAt: now, updateLog: newLog as unknown };
      const [updated] = await db.update(platformDeployments)
        .set(updates as any)
        .where(eq(platformDeployments.id, id))
        .returning();

      logger.info("Deployment updated", { id, changes: Object.keys(parsed), note: updateNote });
      return res.json(updated);
    } catch (e: unknown) {
      logger.error("Failed to update deployment", { error: (e as Error).message });
      return res.status(400).json({ message: (e as Error).message || "Update failed" });
    }
  });

  app.delete("/api/platform-control/deployments/:id", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const id = req.params["id"] as string;
      const [deleted] = await db.delete(platformDeployments).where(eq(platformDeployments.id, id)).returning();
      if (!deleted) return res.status(404).json({ message: "Deployment not found" });
      logger.info("Deployment deleted", { id });
      return res.json({ deleted: true });
    } catch (e: unknown) {
      logger.error("Failed to delete deployment", { error: (e as Error).message });
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

      let localStats: Record<string, number> = {};
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
    } catch (e: unknown) {
      logger.error("Failed to get summary", { error: (e as Error).message });
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
      } catch {
        dbStatus = "error";
      }

      const poolRef = pool as unknown as { totalCount: number; idleCount: number; waitingCount: number };
      const poolStats = {
        totalCount: poolRef.totalCount || 0,
        idleCount: poolRef.idleCount || 0,
        waitingCount: poolRef.waitingCount || 0,
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
        stripe: { connected: !!env.STRIPE_SECRET_KEY, label: "Stripe Payments" },
        sendgrid: { connected: !!env.SENDGRID_API_KEY, label: "SendGrid Email" },
        smtp: { connected: !!(env.SMTP_HOST && env.SMTP_USER), label: "SMTP Email", detail: env.SMTP_HOST || "" },
        twilio: { connected: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN), label: "Twilio SMS" },
        africasTalking: { connected: !!(env.AT_USERNAME && env.AT_API_KEY), label: "Africa's Talking SMS" },
        googleOAuth: { connected: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), label: "Google OAuth" },
        microsoftSSO: { connected: !!(env.AZURE_CLIENT_ID && env.AZURE_CLIENT_SECRET), label: "Microsoft Azure SSO" },
        saml: { connected: !!(env.SAML_ENTRY_POINT && env.SAML_ISSUER), label: "SAML 2.0 SSO" },
        piiEncryption: { connected: !!(env.PII_ENCRYPTION_KEY && env.PII_ENCRYPTION_SALT), label: "PII Encryption (AES-256)" },
        openai: { connected: !!(env.OPENAI_API_KEY || env.AI_INTEGRATIONS_OPENAI_API_KEY), label: "OpenAI AI" },
        anthropic: { connected: !!(env.ANTHROPIC_API_KEY || env.AI_INTEGRATIONS_ANTHROPIC_API_KEY), label: "Anthropic AI" },
      };

      const envConfig = {
        NODE_ENV: env.NODE_ENV || "development",
        PRODUCTION_MODE: env.PRODUCTION_MODE || "false",
        PLATFORM_COMPANY_NAME: env.PLATFORM_COMPANY_NAME || "Universal Credit Hub",
        COUNTRY_MODE: env.COUNTRY_MODE || "ghana",
        PORT: env.PORT || "5000",
        DATABASE_URL: env.DATABASE_URL ? "configured" : "missing",
        SESSION_SECRET: env.SESSION_SECRET ? "configured" : "auto-generated",
        MASTER_CONTROL_PASSWORD: "configured",
        CANONICAL_URL: env.CANONICAL_URL || "not set",
        DEPLOYMENT_ENV: env.NODE_ENV || "development",
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
          version: "2.8.0",
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
    } catch (e: unknown) {
      logger.error("Failed to get system health", { error: (e as Error).message });
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

      let piiStats: Record<string, number> = {};
      try {
        const piiCols = ["national_id", "tin_number", "passport_number", "voters_id", "ssnit_number",
          "drivers_license", "ghana_card_number", "ezwich_number", "date_of_birth", "mobile_money_number"];
        let totalPii = 0, encryptedPii = 0;
        for (const col of piiCols) {
          const total = await safeQuery(sql`SELECT COUNT(*) as c FROM borrowers WHERE ${sql.identifier(col)} IS NOT NULL AND ${sql.identifier(col)} != ''`);
          const enc = await safeQuery(sql`SELECT COUNT(*) as c FROM borrowers WHERE ${sql.identifier(col)} LIKE 'enc:%'`);
          const t = parseInt(total[0]?.c || "0");
          const e = parseInt(enc[0]?.c || "0");
          totalPii += t;
          encryptedPii += e;
        }
        piiStats = { totalPiiFields: totalPii, encryptedPiiFields: encryptedPii, encryptionPercent: totalPii > 0 ? Math.round((encryptedPii / totalPii) * 1000) / 10 : 100 };
      } catch {}

      let recentActivity: Record<string, number> = {};
      try {
        const last24h = await safeQuery(sql`SELECT COUNT(*) as c FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'`);
        const last7d = await safeQuery(sql`SELECT COUNT(*) as c FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days'`);
        const recentLogins = await safeQuery(sql`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'LOGIN_SUCCESS' AND created_at > NOW() - INTERVAL '24 hours'`);
        const failedLogins = await safeQuery(sql`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '24 hours'`);
        const recentReports = await safeQuery(sql`SELECT COUNT(*) as c FROM credit_report_logs WHERE created_at > NOW() - INTERVAL '24 hours'`);
        const recentDisputes = await safeQuery(sql`SELECT COUNT(*) as c FROM disputes WHERE created_at > NOW() - INTERVAL '7 days'`);
        const openDisputes = await safeQuery(sql`SELECT COUNT(*) as c FROM disputes WHERE status = 'open' OR status = 'under_review'`);
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

      let orgBreakdown: Array<Record<string, string | null>> = [];
      try {
        const orgs = await safeQuery(sql`SELECT id, name, status, license_tier, country, created_at FROM organizations ORDER BY created_at DESC LIMIT 50`);
        orgBreakdown = orgs;
      } catch {}

      let userBreakdown: { byRole: Record<string, number>; mfaEnabled: number; totalActive: number } = { byRole: {}, mfaEnabled: 0, totalActive: 0 };
      try {
        const byRole = await safeQuery(sql`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`);
        const mfaEnabled = await safeQuery(sql`SELECT COUNT(*) as c FROM users WHERE totp_secret IS NOT NULL`);
        const activeUsers = await safeQuery(sql`SELECT COUNT(*) as c FROM users WHERE is_active = true`);
        userBreakdown = {
          byRole: byRole.reduce((acc: Record<string, number>, r: Record<string, string>) => { acc[r.role] = parseInt(r.count); return acc; }, {}),
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
    } catch (e: unknown) {
      logger.error("Failed to get database stats", { error: (e as Error).message });
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

      let localBilling: Record<string, number> = {};
      try {
        const totalBilling = await safeQuery(sql`SELECT SUM(amount) as total FROM billing_records`);
        const monthBilling = await safeQuery(sql`SELECT SUM(amount) as total FROM billing_records WHERE created_at > NOW() - INTERVAL '30 days'`);
        const walletBalances = await safeQuery(sql`SELECT SUM(balance_cents) as total, COUNT(*) as wallets FROM wallets`);
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
    } catch (e: unknown) {
      logger.error("Failed to get revenue overview", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to get revenue overview" });
    }
  });

  app.get("/api/platform-control/current-instance", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const platformName = process.env.PLATFORM_COMPANY_NAME || "Universal Credit Hub";
      const country = process.env.COUNTRY_MODE || "Ghana";
      const currency = process.env.DEFAULT_CURRENCY || "GHS";
      const deploymentUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPL_SLUG
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : "";

      let borrowerCount = 0, orgCount = 0, userCount = 0;
      try {
        const bc = await pool.query("SELECT COUNT(*) as count FROM borrowers");
        borrowerCount = parseInt(bc.rows[0]?.count || "0");
        const oc = await pool.query("SELECT COUNT(*) as count FROM organizations");
        orgCount = parseInt(oc.rows[0]?.count || "0");
        const uc = await pool.query("SELECT COUNT(*) as count FROM users");
        userCount = parseInt(uc.rows[0]?.count || "0");
      } catch {}

      let orgList: Array<{ name: string; licenseTier: string; status: string }> = [];
      try {
        const orgs = await pool.query("SELECT name, license_tier, status FROM organizations ORDER BY created_at DESC LIMIT 50");
        orgList = orgs.rows.map((r: Record<string, string>) => ({ name: r.name, licenseTier: r.license_tier, status: r.status }));
      } catch {}

      const existing = await db.select().from(platformDeployments);
      const alreadyRegistered = existing.some(d =>
        d.clientName.toLowerCase() === platformName.toLowerCase() && d.country.toLowerCase() === country.toLowerCase()
      );

      return res.json({
        clientName: platformName,
        country,
        currency,
        region: "West Africa",
        deploymentUrl,
        branding: platformName,
        status: "active",
        licenseTier: "commercial",
        totalBorrowers: borrowerCount,
        totalInstitutions: orgCount,
        totalUsers: userCount,
        organizations: orgList,
        alreadyRegistered,
        deploymentDate: new Date().toISOString().split("T")[0],
      });
    } catch (e: unknown) {
      logger.error("Failed to get current instance", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to read current instance data" });
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

  // --- Heartbeat: ping a client deployment's /api/heartbeat endpoint ---
  app.post("/api/platform-control/heartbeat-check/:id", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const id = req.params["id"] as string;
      const [deployment] = await db.select().from(platformDeployments).where(eq(platformDeployments.id, id));
      if (!deployment) return res.status(404).json({ message: "Deployment not found" });

      const heartbeatUrl = deployment.heartbeatUrl || (deployment.deploymentUrl ? `${deployment.deploymentUrl}/api/heartbeat` : null);
      if (!heartbeatUrl) return res.status(400).json({ message: "No heartbeat URL configured for this deployment" });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const startMs = Date.now();
        const hbRes = await fetch(heartbeatUrl, { signal: controller.signal });
        clearTimeout(timeout);
        const latencyMs = Date.now() - startMs;
        const data = hbRes.ok ? await hbRes.json() : { error: `HTTP ${hbRes.status}` };

        const heartbeat = { status: hbRes.ok ? "healthy" : "unhealthy", latencyMs, data, checkedAt: new Date().toISOString() };
        await db.update(platformDeployments)
          .set({ lastHeartbeat: heartbeat, lastHeartbeatAt: new Date(), updatedAt: new Date() })
          .where(eq(platformDeployments.id, id));

        return res.json(heartbeat);
      } catch (fetchErr: unknown) {
        clearTimeout(timeout);
        const heartbeat = { status: "unreachable", latencyMs: -1, data: { error: (fetchErr as Error).message }, checkedAt: new Date().toISOString() };
        await db.update(platformDeployments)
          .set({ lastHeartbeat: heartbeat, lastHeartbeatAt: new Date(), updatedAt: new Date() })
          .where(eq(platformDeployments.id, id));
        return res.json(heartbeat);
      }
    } catch (e: unknown) {
      logger.error("Heartbeat check failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Heartbeat check failed" });
    }
  });

  app.post("/api/platform-control/heartbeat-check-all", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const deployments = await db.select().from(platformDeployments);
      const active = deployments.filter(d => d.status !== "decommissioned");
      const results: Array<{ id: string; clientName: string; status: string; latencyMs: number }> = [];

      for (const d of active) {
        const heartbeatUrl = d.heartbeatUrl || (d.deploymentUrl ? `${d.deploymentUrl}/api/heartbeat` : null);
        if (!heartbeatUrl) {
          results.push({ id: d.id, clientName: d.clientName, status: "no_url", latencyMs: -1 });
          continue;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const startMs = Date.now();
          const hbRes = await fetch(heartbeatUrl, { signal: controller.signal });
          clearTimeout(timeout);
          const latencyMs = Date.now() - startMs;
          const data = hbRes.ok ? await hbRes.json() : { error: `HTTP ${hbRes.status}` };
          const heartbeat = { status: hbRes.ok ? "healthy" : "unhealthy", latencyMs, data, checkedAt: new Date().toISOString() };
          await db.update(platformDeployments)
            .set({ lastHeartbeat: heartbeat, lastHeartbeatAt: new Date(), updatedAt: new Date() })
            .where(eq(platformDeployments.id, d.id));
          results.push({ id: d.id, clientName: d.clientName, status: heartbeat.status, latencyMs });
        } catch {
          clearTimeout(timeout);
          const heartbeat = { status: "unreachable", latencyMs: -1, data: {}, checkedAt: new Date().toISOString() };
          await db.update(platformDeployments)
            .set({ lastHeartbeat: heartbeat, lastHeartbeatAt: new Date(), updatedAt: new Date() })
            .where(eq(platformDeployments.id, d.id));
          results.push({ id: d.id, clientName: d.clientName, status: "unreachable", latencyMs: -1 });
        }
      }
      return res.json({ checked: results.length, results });
    } catch (e: unknown) {
      logger.error("Heartbeat check all failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Heartbeat check all failed" });
    }
  });

  // --- GitHub Integration: manage client repos ---
  const connectors = new ReplitConnectors();

  app.get("/api/platform-control/github/repos", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const ghRes = await connectors.proxy("github", "/user/repos?sort=updated&per_page=100&type=owner", { method: "GET" });
      const repos = await ghRes.json();
      if (!Array.isArray(repos)) return res.json({ repos: [], error: "Unexpected response" });
      const mapped = repos.map((r: Record<string, unknown>) => ({
        fullName: r.full_name, name: r.name, private: r.private,
        description: r.description, htmlUrl: r.html_url,
        defaultBranch: r.default_branch, updatedAt: r.updated_at,
        language: r.language, forksCount: r.forks_count,
      }));
      return res.json({ repos: mapped });
    } catch (e: unknown) {
      logger.error("GitHub repos fetch failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to fetch GitHub repos. Ensure GitHub is connected." });
    }
  });

  app.post("/api/platform-control/github/create-repo", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const { name, description, isPrivate, deploymentId } = req.body;
      if (!name) return res.status(400).json({ message: "Repository name required" });

      const ghRes = await connectors.proxy("github", "/user/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || `Credit registry deployment: ${name}`,
          private: isPrivate !== false,
          auto_init: true,
        }),
      });
      const repo = await ghRes.json();
      if (repo.errors || repo.message === "Repository creation failed.") {
        return res.status(400).json({ message: repo.message || "Failed to create repo", errors: repo.errors });
      }

      if (deploymentId) {
        await db.update(platformDeployments)
          .set({ githubRepo: repo.full_name as string, updatedAt: new Date() })
          .where(eq(platformDeployments.id, deploymentId));
      }

      logger.info("GitHub repo created", { name: repo.full_name });
      return res.json({ repo: { fullName: repo.full_name, htmlUrl: repo.html_url, private: repo.private } });
    } catch (e: unknown) {
      logger.error("GitHub repo creation failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to create repo" });
    }
  });

  app.post("/api/platform-control/github/link-repo", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const { deploymentId, repoFullName } = req.body;
      if (!deploymentId || !repoFullName) return res.status(400).json({ message: "deploymentId and repoFullName required" });

      const ghRes = await connectors.proxy("github", `/repos/${repoFullName}`, { method: "GET" });
      const repo = await ghRes.json();
      if (repo.message === "Not Found") return res.status(404).json({ message: "Repository not found" });

      await db.update(platformDeployments)
        .set({ githubRepo: repoFullName, updatedAt: new Date() })
        .where(eq(platformDeployments.id, deploymentId));

      logger.info("GitHub repo linked", { deploymentId, repo: repoFullName });
      return res.json({ linked: true, repo: { fullName: repo.full_name, htmlUrl: repo.html_url } });
    } catch (e: unknown) {
      logger.error("GitHub repo link failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to link repo" });
    }
  });

  app.get("/api/platform-control/github/repo-status/:owner/:repo", requireMasterAuth, async (req: Request, res: Response) => {
    try {
      const { owner, repo } = req.params;
      const [repoRes, commitsRes, branchesRes] = await Promise.all([
        connectors.proxy("github", `/repos/${owner}/${repo}`, { method: "GET" }),
        connectors.proxy("github", `/repos/${owner}/${repo}/commits?per_page=5`, { method: "GET" }),
        connectors.proxy("github", `/repos/${owner}/${repo}/branches`, { method: "GET" }),
      ]);
      const repoData = await repoRes.json();
      const commits = await commitsRes.json();
      const branches = await branchesRes.json();

      return res.json({
        name: repoData.full_name,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
        private: repoData.private,
        htmlUrl: repoData.html_url,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        size: repoData.size,
        branches: Array.isArray(branches) ? branches.map((b: Record<string, unknown>) => b.name) : [],
        recentCommits: Array.isArray(commits) ? commits.map((c: Record<string, unknown>) => {
          const commit = c.commit as Record<string, unknown> | undefined;
          const author = commit?.author as Record<string, unknown> | undefined;
          return { sha: (c.sha as string)?.substring(0, 7), message: commit?.message, date: author?.date, author: author?.name };
        }) : [],
      });
    } catch (e: unknown) {
      logger.error("GitHub repo status failed", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to get repo status" });
    }
  });

  // ── Registry Credential Management ────────────────────────────────────────

  const REGISTRY_PROVIDERS = [
    { provider: "ghana_dvla",        label: "Ghana DVLA",          urlVar: "GHANA_DVLA_API_URL",    keyVar: "GHANA_DVLA_API_KEY" },
    { provider: "sa_natis",          label: "South Africa NaTIS",  urlVar: "SA_NATIS_API_URL",       keyVar: "SA_NATIS_API_KEY" },
    { provider: "ghana_lands",       label: "Ghana Lands Comm.",   urlVar: "GHANA_LANDS_API_URL",    keyVar: "GHANA_LANDS_API_KEY" },
    { provider: "kenya_ntsa",        label: "Kenya NTSA",          urlVar: "KENYA_NTSA_API_URL",     keyVar: "KENYA_NTSA_API_KEY" },
    { provider: "nigeria_frsc",      label: "Nigeria FRSC/MVAA",   urlVar: "NIGERIA_FRSC_API_URL",   keyVar: "NIGERIA_FRSC_API_KEY" },
    { provider: "uganda_ursb_motor", label: "Uganda URSB Motor",   urlVar: "UGANDA_URSB_API_URL",    keyVar: "UGANDA_URSB_API_KEY" },
    { provider: "ethiopia_motor",    label: "Ethiopia MVAA",       urlVar: "ETHIOPIA_MVAA_API_URL",  keyVar: "ETHIOPIA_MVAA_API_KEY" },
  ];

  const updateRegistryCredSchema = z.object({
    apiUrl: z.string().url("Must be a valid URL"),
    apiKey: z.string().optional(),
  });

  app.get("/api/platform-control/registry-credentials", requireMasterAuth, async (_req: Request, res: Response) => {
    try {
      const statuses = registryStatus();
      const stored = await db.select().from(registryCredentialsTable);
      const storedByProvider = new Map(stored.map(r => [r.provider, r]));

      const rows = REGISTRY_PROVIDERS.map(p => {
        const st = statuses[p.provider as keyof typeof statuses] || { live: false };
        const dbRow = storedByProvider.get(p.provider);
        return {
          provider: p.provider,
          label: p.label,
          live: st.live,
          sandbox: st.sandbox ?? false,
          source: (st as { source?: string }).source ?? (st.live ? "env" : "none"),
          hasDbCredentials: !!dbRow,
          apiUrl: dbRow?.apiUrl ?? null,
          updatedAt: dbRow?.updatedAt ?? null,
          updatedBy: dbRow?.updatedBy ?? null,
        };
      });
      return res.json({ registries: rows });
    } catch (e: unknown) {
      logger.error("Failed to list registry credentials", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to load registry credentials" });
    }
  });

  app.patch("/api/platform-control/registry-credentials/:provider", requireMasterAuth, async (req: Request, res: Response) => {
    const provider = req.params["provider"] as string;
    if (!REGISTRY_PROVIDERS.find(p => p.provider === provider)) {
      return res.status(400).json({ message: "Unknown registry provider" });
    }
    const parsed = updateRegistryCredSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Validation error" });
    }
    const { apiUrl, apiKey } = parsed.data;
    try {
      let encryptedKey: string;
      let plainKey: string;

      if (apiKey) {
        encryptedKey = encryptPII(apiKey);
        plainKey = apiKey;
      } else {
        // Keep the existing encrypted key from DB
        const existing = await db.select().from(registryCredentialsTable)
          .where(eq(registryCredentialsTable.provider, provider));
        if (!existing.length) {
          return res.status(400).json({ message: "API key is required when no existing credentials are stored" });
        }
        encryptedKey = existing[0].apiKeyEncrypted;
        const { decryptPII } = await import("../encryption");
        plainKey = decryptPII(encryptedKey);
      }

      await db.insert(registryCredentialsTable).values({
        provider,
        apiUrl,
        apiKeyEncrypted: encryptedKey,
        updatedBy: "platform-admin",
      }).onConflictDoUpdate({
        target: registryCredentialsTable.provider,
        set: { apiUrl, apiKeyEncrypted: encryptedKey, updatedAt: new Date(), updatedBy: "platform-admin" },
      });

      setRegistryCredentialOverride(provider, apiUrl, plainKey);

      logger.info("Registry credentials updated", { provider, apiUrl: apiUrl.replace(/\/\/.*@/, "//***@") });
      return res.json({ ok: true, provider, apiUrl });
    } catch (e: unknown) {
      logger.error("Failed to save registry credentials", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to save credentials" });
    }
  });

  app.delete("/api/platform-control/registry-credentials/:provider", requireMasterAuth, async (req: Request, res: Response) => {
    const provider = req.params["provider"] as string;
    if (!REGISTRY_PROVIDERS.find(p => p.provider === provider)) {
      return res.status(400).json({ message: "Unknown registry provider" });
    }
    try {
      await db.delete(registryCredentialsTable).where(eq(registryCredentialsTable.provider, provider));
      clearRegistryCredentialOverride(provider);
      return res.json({ ok: true });
    } catch (e: unknown) {
      logger.error("Failed to delete registry credentials", { error: (e as Error).message });
      return res.status(500).json({ message: "Failed to delete credentials" });
    }
  });

  app.post("/api/platform-control/registry-credentials/:provider/test", requireMasterAuth, async (req: Request, res: Response) => {
    const provider = req.params["provider"] as string;
    const entry = REGISTRY_PROVIDERS.find(p => p.provider === provider);
    if (!entry) {
      return res.status(400).json({ message: "Unknown registry provider" });
    }

    const testRef = (req.body?.testReference as string) || "TEST-001";
    const apiUrl = req.body?.apiUrl as string | undefined;
    let apiKey = req.body?.apiKey as string | undefined;

    if (!apiUrl) {
      return res.status(400).json({ message: "apiUrl is required for test" });
    }

    // If no apiKey supplied, fall back to the stored key for this provider
    if (!apiKey) {
      const existing = await db.select().from(registryCredentialsTable)
        .where(eq(registryCredentialsTable.provider, provider));
      if (existing.length) {
        const { decryptPII: decrypt } = await import("../encryption");
        apiKey = decrypt(existing[0].apiKeyEncrypted);
      }
    }

    if (!apiKey) {
      return res.status(400).json({ message: "apiKey is required — either provide it in the request or save credentials first" });
    }

    // SSRF guard: only allow https/http, block private/loopback addresses
    try {
      const parsed = new URL(apiUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return res.status(400).json({ ok: false, error: "Only http/https URLs are allowed" });
      }
      const hostname = parsed.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/,
        /^127\./,
        /^10\./,
        /^192\.168\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^0\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/,
      ];
      const isPrivate = privatePatterns.some(p => p.test(hostname));
      if (isPrivate && process.env.NODE_ENV === "production") {
        return res.status(400).json({ ok: false, error: "Connections to private/internal hosts are not allowed" });
      }
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid URL" });
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let responseStatus = 0;
      let responseBody = "";
      let latencyMs = 0;
      const t0 = Date.now();
      try {
        const resp = await fetch(`${apiUrl.replace(/\/$/, "")}/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": apiKey, "User-Agent": "AfricaCreditHub/2.5" },
          body: JSON.stringify({ reference: testRef, provider }),
          signal: controller.signal,
        });
        latencyMs = Date.now() - t0;
        clearTimeout(timer);
        responseStatus = resp.status;
        responseBody = await resp.text().catch(() => "");
      } catch (fetchErr: any) {
        clearTimeout(timer);
        latencyMs = Date.now() - t0;
        if (fetchErr.name === "AbortError") {
          return res.json({ ok: false, error: "Connection timed out after 8s", latencyMs });
        }
        return res.json({ ok: false, error: fetchErr.message, latencyMs });
      }

      if (responseStatus >= 200 && responseStatus < 300) {
        let parsed: unknown = null;
        try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }
        return res.json({ ok: true, statusCode: responseStatus, latencyMs, response: parsed });
      } else {
        return res.json({ ok: false, statusCode: responseStatus, latencyMs, error: `Registry returned HTTP ${responseStatus}`, response: responseBody.slice(0, 300) });
      }
    } catch (e: unknown) {
      return res.status(500).json({ ok: false, message: (e as Error).message });
    }
  });

  // Spec-compatible aliases: /api/admin/registry-credentials/* mirrors the platform-control routes
  app.get("/api/admin/registry-credentials", requireMasterAuth, (_req, res) => res.redirect(307, "/api/platform-control/registry-credentials"));
  app.patch("/api/admin/registry-credentials/:provider", requireMasterAuth, (req, res) => res.redirect(307, `/api/platform-control/registry-credentials/${req.params.provider as string}`));
  app.delete("/api/admin/registry-credentials/:provider", requireMasterAuth, (req, res) => res.redirect(307, `/api/platform-control/registry-credentials/${req.params.provider as string}`));
  app.post("/api/admin/registry-credentials/:provider/test", requireMasterAuth, (req, res) => res.redirect(307, `/api/platform-control/registry-credentials/${req.params.provider as string}/test`));

  // Load DB-stored registry credentials into in-memory cache at startup
  loadRegistryCredentialsFromDb().catch((err: Error) => {
    logger.warn("Could not pre-load registry credentials from DB at startup", { error: err.message });
  });

  logger.info("Platform control center routes registered");
}
