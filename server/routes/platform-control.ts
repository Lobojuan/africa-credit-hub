import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { platformDeployments, insertPlatformDeploymentSchema } from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { createLogger } from "../logger";
import { rateLimitKeyGenerator } from "./middleware";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";

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
      } catch { /* tables may not exist */ }

      return res.json({
        totalDeployments,
        activeDeployments,
        trialDeployments,
        suspendedDeployments,
        totalMRRCents: totalMRR,
        countriesServed,
        totalBorrowers,
        totalInstitutions,
        ...localStats,
      });
    } catch (e: any) {
      logger.error("Failed to get summary", { error: e.message });
      return res.status(500).json({ message: "Failed to get summary" });
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
