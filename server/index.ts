import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import compression from "compression";
import helmet from "helmet";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool, startPoolHealthCheck } from "./db";
import { createLogger } from "./logger";

const port = parseInt(process.env.PORT || "5000", 10);

function crashLog(msg: string) {
  try {
    const mem = process.memoryUsage();
    const entry = JSON.stringify({
      level: "fatal",
      ts: new Date().toISOString(),
      msg,
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    });
    process.stderr.write(entry + "\n");
  } catch {}
}
crashLog("SERVER_START");

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var must be set");
}

const isProductionBoot = process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true";

function validateProductionConfig() {
  const errors: string[] = [];

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters for production security");
  }

  if (isProductionBoot) {
    if (!process.env.DATABASE_URL) {
      errors.push("DATABASE_URL is required in production");
    }
    if (!process.env.PII_ENCRYPTION_KEY) {
      errors.push("PII_ENCRYPTION_KEY is required in production");
    }
    if (!process.env.PII_ENCRYPTION_SALT) {
      errors.push("PII_ENCRYPTION_SALT is required in production");
    }
    if (process.env.PII_ENCRYPTION_SALT === "cdh-pii-salt-v1") {
      errors.push("PII_ENCRYPTION_SALT must be changed from the default value in production");
    }
    if (!process.env.EXTERNAL_API_JWT_SECRET) {
      errors.push("EXTERNAL_API_JWT_SECRET is required in production for API security");
    }
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn("[Production] WARNING: SEED_ADMIN_PASSWORD not set — seed will generate a random password if needed");
    }
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 64) {
      errors.push("SESSION_SECRET should be at least 64 characters in production");
    }
    if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
      console.warn("[Production] WARNING: No email provider configured — transactional emails will not be delivered");
    }
    if (!process.env.TWILIO_ACCOUNT_SID && !process.env.AT_USERNAME) {
      console.warn("[Production] WARNING: No SMS provider configured — OTP and notifications via SMS will not be delivered");
    }
    if (!process.env.MASTER_CONTROL_PASSWORD) {
      errors.push('MASTER_CONTROL_PASSWORD is required in production for platform control access');
    }
  }

  if (errors.length > 0) {
    console.error("\n╔══════════════════════════════════════════════════╗");
    console.error("║  FATAL: Production configuration errors          ║");
    console.error("╠══════════════════════════════════════════════════╣");
    errors.forEach(e => console.error(`║  ✗ ${e}`));
    console.error("╚══════════════════════════════════════════════════╝\n");
    throw new Error(`Production startup blocked: ${errors.length} configuration error(s). See above.`);
  }
}

validateProductionConfig();

const app = express();
app.set("trust proxy", 1);
app.set("etag", false);

app.get("/health", async (_req, res) => {
  const start = Date.now();
  const mem = process.memoryUsage();
  let dbOk = false;
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    dbLatency = Date.now() - dbStart;
    dbOk = true;
  } catch {}
  const status = dbOk ? "healthy" : "degraded";
  const uptime = process.uptime();
  res.status(dbOk ? 200 : 503).json({
    status,
    version: "2.8.0",
    uptime: Math.floor(uptime),
    uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: dbOk ? "ok" : "error", latencyMs: dbLatency, pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount } },
      memory: { rss: Math.round(mem.rss / 1024 / 1024), heapUsed: Math.round(mem.heapUsed / 1024 / 1024), heapTotal: Math.round(mem.heapTotal / 1024 / 1024), unit: "MB" },
    },
    responseMs: Date.now() - start,
  });
});

app.use((_req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isProductionBoot
        ? ["'self'", (_req: any, res: any) => `'nonce-${res.locals.cspNonce}'`]
        : ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'", "https://*.replit.dev", "https://*.replit.app", "https://*.repl.co"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: false,
  noSniff: true,
  xssFilter: true,
}));
app.use(compression());
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (!req.path.startsWith("/api")) {
    res.setHeader("X-Robots-Tag", "index, follow");
  }

  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
    userDivision: string;
    organizationId: string;
    userCountry: string;
    lastActivity: number;
    mfaPendingUserId: string;
    viewingCountry: string;
    webauthnChallenge: string;
    webauthnUserId: string;
    csrfToken: string;
    institution?: string;
    /** Non-production only: e2e test bypass role set via /api/test/set-session */
    _testRole?: string;
  }
}

import { generateCSRFToken } from "./encryption";

import { WebhookHandlers } from "./webhookHandlers";
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing signature' });
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        return res.status(500).json({ error: 'Webhook body not Buffer' });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const PgStore = pgSession(session);
app.use(
  session({
    store: new PgStore({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 300,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    proxy: isProductionBoot,
    cookie: {
      secure: isProductionBoot,
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.get("/api/auth/csrf-token", (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.json({ token: req.session.csrfToken });
});

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path === "/api/stripe/webhook") return next();
  if (req.path.startsWith("/api/external/")) return next();
  if (req.path === "/api/auth/login") return next();
  if (req.path === "/api/auth/csrf-token") return next();
  if (req.path === "/api/trial/register") return next();
  if (req.path === "/api/consumer/login") return next();
  if (req.path === "/api/consumer/register") return next();
  // USSD gateway callbacks (Africa's Talking, Twilio, etc.) cannot include a
  // CSRF token; they are authenticated separately via LOTO_USSD_TOKEN header
  // when configured. The endpoint is also whitelisted from the /api session
  // auth wrapper. See server/services/loto-ussd-state-machine.ts.
  if (req.path === "/api/loto/ussd/session") return next();

  const csrfToken = req.headers["x-csrf-token"] as string;
  if (req.session?.userId) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }
    if (!csrfToken) {
      return res.status(403).json({ message: "Invalid or missing CSRF token" });
    }
    try {
      if (!crypto.timingSafeEqual(Buffer.from(csrfToken), Buffer.from(req.session.csrfToken))) {
        return res.status(403).json({ message: "Invalid or missing CSRF token" });
      }
    } catch {
      return res.status(403).json({ message: "Invalid or missing CSRF token" });
    }
  }
  next();
});

export const maintenanceState = {
  enabled: false,
  message: "We are working hard to improve your experience. The platform will be back shortly.",
};

app.get("/api/health", (_req, res) => {
  if (maintenanceState.enabled) {
    return res.status(503).json({ status: "maintenance", version: "2.8.0", message: maintenanceState.message });
  }
  res.json({ status: "ok", version: "2.8.0", uptime: Math.round(process.uptime()) });
});

app.get("/api/maintenance/status", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  res.json({ enabled: maintenanceState.enabled, message: maintenanceState.message });
});

app.use((req, res, next) => {
  if (!maintenanceState.enabled) return next();

  if (req.path === "/api/health") return next();
  if (req.path.startsWith("/api/auth/")) return next();
  if (req.path.startsWith("/api/maintenance")) return next();
  if (req.path === "/maintenance.html") return next();
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) return next();

  if (req.session?.userRole === "super_admin") return next();

  if (req.path.startsWith("/api/")) {
    return res.status(503).json({ status: "maintenance", message: maintenanceState.message });
  }

  return res.redirect("/maintenance.html");
});

const IDLE_TIMEOUTS: Record<string, number> = {
  super_admin: 30 * 60 * 1000,
  admin: 30 * 60 * 1000,
  regulator: 30 * 60 * 1000,
  lender: 30 * 60 * 1000,
  viewer: 30 * 60 * 1000,
  default: 30 * 60 * 1000,
};

function getIdleTimeout(role?: string): number {
  return IDLE_TIMEOUTS[role || "default"] || IDLE_TIMEOUTS.default;
}

app.get("/api/auth/session-info", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const role = req.session.userRole || "default";
  const timeoutMs = getIdleTimeout(role);
  const lastActivity = req.session.lastActivity || Date.now();
  const remaining = Math.max(0, timeoutMs - (Date.now() - lastActivity));
  res.json({ timeoutMs, remaining, role, warningMs: 2 * 60 * 1000 });
});

app.post("/api/auth/keep-alive", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  req.session.lastActivity = Date.now();
  const role = req.session.userRole || "default";
  const timeoutMs = getIdleTimeout(role);
  res.json({ extended: true, timeoutMs, expiresAt: Date.now() + timeoutMs });
});

app.use((req, res, next) => {
  if (req.session?.userId && req.session.lastActivity) {
    const idle = Date.now() - req.session.lastActivity;
    const timeout = getIdleTimeout(req.session.userRole);
    if (idle > timeout) {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      req.session.destroy(() => {});
      pool.query(
        `INSERT INTO audit_logs (id, user_id, action, entity, details, ip_address, created_at)
         VALUES (gen_random_uuid(), $1, 'SESSION_TIMEOUT', 'session', $2, $3, NOW())`,
        [userId, `Session expired after ${Math.round(idle / 60000)}min inactivity (role: ${userRole})`, req.ip]
      ).catch(() => {});
      return res.status(440).json({ message: "Session expired due to inactivity" });
    }
  }
  if (req.session?.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
});


const httpLogger = createLogger("http");
const startupLogger = createLogger("startup");

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (isProductionBoot) {
        if (res.statusCode >= 400) {
          if (capturedJsonResponse) {
            const str = JSON.stringify(capturedJsonResponse);
            logLine += ` :: ${str.length > 200 ? str.slice(0, 200) + "..." : str}`;
          }
          log(logLine);
        }
      } else {
        if (capturedJsonResponse) {
          const str = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${str.length > 200 ? str.slice(0, 200) + "..." : str}`;
        }
        log(logLine);
      }
    }
    capturedJsonResponse = undefined;
  });

  next();
});

function gracefulShutdown(signal: string) {
  crashLog(`SHUTDOWN signal=${signal}`);
  console.log(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.log("Forcing shutdown after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGHUP", () => { crashLog("SIGHUP received"); });
process.on("SIGPIPE", () => { /* ignore broken pipe */ });
process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.code === "EIO" || err.code === "EPIPE" || err.code === "ERR_STREAM_DESTROYED") {
    return;
  }
  crashLog(`UNCAUGHT_EXCEPTION ${err.message} ${err.stack?.slice(0, 300)}`);
  try { console.error("Uncaught exception:", err); } catch {}
  if (err.code === "EADDRINUSE") {
    process.exit(1);
  }
});
process.on("unhandledRejection", (err) => {
  crashLog(`UNHANDLED_REJECTION ${err}`);
  try { console.error("Unhandled rejection:", err); } catch {}
});
process.on("beforeExit", (code) => { crashLog(`BEFORE_EXIT code=${code}`); });
process.on("exit", (code) => { crashLog(`EXIT code=${code}`); });

process.stdout?.on?.("error", () => {});
process.stderr?.on?.("error", () => {});

const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);
process.stdout.write = function (...args: any[]) {
  try { return (origStdoutWrite as any)(...args); } catch { return false; }
} as any;
process.stderr.write = function (...args: any[]) {
  try { return (origStderrWrite as any)(...args); } catch { return false; }
} as any;

(async () => {
  try {
    const { migrateNewTables } = await import("./migrate-new-tables");
    await migrateNewTables();
  } catch (e) {
    console.error("[NewTables] Early migration error (non-fatal):", e);
  }

  if (process.env.RUN_SEED === "true") {
    try {
      const { cleanupNonGhanaData } = await import("./ghana-cleanup");
      await cleanupNonGhanaData();
    } catch (e) {
      console.error("[Ghana Cleanup] Error (non-fatal):", e);
    }

    const { seedDatabase } = await import("./seed");
    try {
      await seedDatabase();
    } catch (e) {
      console.error("Seed error (may be expected on first run):", e);
    }

    const isProduction = process.env.PRODUCTION_MODE === "true";
    if (!isProduction) {
      try {
        const { seedTestData } = await import("./seed-test-data");
        await seedTestData();
      } catch (e) {
        console.error("Test data seed error:", e);
      }
    } else {
      console.log("[Production] Skipping demo/test data seeding");
    }

    try {
      const { seedDemoData } = await import("./seed-demo-data");
      await seedDemoData();
    } catch (e) {
      console.error("Demo data seed error (non-fatal):", e);
    }

    try {
      const { seedTelcoLending } = await import("./seed-telco-lending");
      await seedTelcoLending();
    } catch (e) {
      console.error("Telco lending seed error (non-fatal):", e);
    }

    try {
      const { distributeCreatedAtTimestamps } = await import("./distribute-timestamps");
      await distributeCreatedAtTimestamps();
    } catch (e) {
      console.error("Timestamp distribution error (non-fatal):", e);
    }
  } else {
    console.log("[Startup] Skipping seed — set RUN_SEED=true to seed");
  }

  try {
    const { ensureDemoUsers } = await import("./seed");
    await ensureDemoUsers();
  } catch (e) {
    console.error("[Startup] ensureDemoUsers error (non-fatal):", e);
  }

  try {
    const { runPortableMigrations } = await import('./stripeClient');
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      startupLogger.info('Initializing Stripe schema...');
      await runPortableMigrations({ databaseUrl, schema: 'stripe' });
      startupLogger.info('Stripe schema ready');

      const { getStripeSync } = await import('./stripeClient');
      const stripeSync = await getStripeSync();

      const { getBaseUrl } = await import('./base-url');
      const webhookBaseUrl = getBaseUrl();
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`
      );
      console.log('Stripe webhook configured:', webhookResult?.webhook?.url || 'setup complete');

      stripeSync.syncBackfill()
        .then(() => startupLogger.info('Stripe data synced'))
        .catch((err: any) => startupLogger.error('Stripe sync error', err));

      const { seedStripeProducts } = await import('./stripe-seed');
      seedStripeProducts().catch((e: any) => console.error('Stripe seed error:', e));
    }
  } catch (e: any) {
    console.error('Stripe initialization error (non-fatal):', e.message);
  }

  try {
    const { createPerformanceIndexes } = await import("./migrate-indexes");
    await createPerformanceIndexes();
  } catch (e) {
    console.error("Index migration error (non-fatal):", e);
  }

  try {
    const { migrateCrifFeatures } = await import("./migrate-crif-features");
    await migrateCrifFeatures();
  } catch (e) {
    console.error("CRIF features migration error (non-fatal):", e);
  }



  try {
    const { ensureIdempotencyTable } = await import("./routes/middleware");
    await ensureIdempotencyTable();
  } catch (e) {
    console.error("[Idempotency] Table creation error (non-fatal):", e);
  }

  try {
    const constraints = [
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_org_platform_fee_pct') THEN ALTER TABLE organizations ADD CONSTRAINT chk_org_platform_fee_pct CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_org_license_fee') THEN ALTER TABLE organizations ADD CONSTRAINT chk_org_license_fee CHECK (monthly_license_fee_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usage_unit_price') THEN ALTER TABLE usage_metering ADD CONSTRAINT chk_usage_unit_price CHECK (unit_price_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usage_total') THEN ALTER TABLE usage_metering ADD CONSTRAINT chk_usage_total CHECK (total_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usage_platform_fee') THEN ALTER TABLE usage_metering ADD CONSTRAINT chk_usage_platform_fee CHECK (platform_fee_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usage_bureau_rev') THEN ALTER TABLE usage_metering ADD CONSTRAINT chk_usage_bureau_rev CHECK (bureau_revenue_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_balance') THEN ALTER TABLE wallets ADD CONSTRAINT chk_wallet_balance CHECK (balance_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_threshold') THEN ALTER TABLE wallets ADD CONSTRAINT chk_wallet_threshold CHECK (low_balance_threshold_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payout_amount') THEN ALTER TABLE payout_items ADD CONSTRAINT chk_payout_amount CHECK (amount_cents >= 0); END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlement_min_payout') THEN ALTER TABLE settlement_schedules ADD CONSTRAINT chk_settlement_min_payout CHECK (minimum_payout_cents >= 0); END IF; END $$`,
    ];
    for (const sql of constraints) {
      await pool.query(sql);
    }
    console.log("[Schema] Financial integrity constraints verified");
  } catch (e: any) {
    if (isProductionBoot) {
      throw new Error(`[Schema] FATAL: Financial constraint migration failed in production: ${e.message}`);
    }
    console.error("[Schema] Constraint migration error (non-fatal):", e.message);
  }

  const { initWebSocket } = await import("./websocket");
  initWebSocket(httpServer);

  app.use("/api/v1", (req, res, next) => {
    req.url = "/api" + req.url;
    next();
  });

  const { validateEncryptionConfig } = await import("./encryption");
  const { validateExternalApiConfig } = await import("./external-api");
  validateEncryptionConfig();
  validateExternalApiConfig();

  // Build-time/boot-time guard: scan the source tree and refuse to start if any
  // file outside the gateway+storage allowlist directly imports the cross-product
  // tables. This makes bypassing the consent-first gateway a deploy-blocker.
  const { runCrossProductIsolationCheck } = await import("./cross-product-isolation-check");
  runCrossProductIsolationCheck({ failOnViolation: true });

  await registerRoutes(httpServer, app);

  const { sanitizeErrorForResponse } = await import("./security-hardening");
  const isProductionEnv = process.env.NODE_ENV === "production" || process.env.PRODUCTION_MODE === "true";

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    const { status, message } = sanitizeErrorForResponse(err, isProductionEnv);
    if (!isProductionEnv) {
      console.error("Internal Server Error:", err);
    }

    return res.status(status).json({ message });
  });

  app.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(
      "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /master-control/\n\nSitemap: https://universalcredithub.com/sitemap.xml\n"
    );
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://universalcredithub.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://universalcredithub.com/login</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://universalcredithub.com/register</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://universalcredithub.com/consumer-portal</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`
    );
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);

    startPoolHealthCheck(60000);

    const { startRetentionScheduler } = await import("./retention-enforcement");
    startRetentionScheduler(24);

    const { startExchangeRateScheduler } = await import("./exchange-rate-scheduler");
    startExchangeRateScheduler();

    const { startLotoDrawScheduler } = await import("./services/loto-draw-scheduler");
    startLotoDrawScheduler();

    const { startAnchorScheduler } = await import("./blockchain-anchor");
    startAnchorScheduler(6);

    // Tracing & Skip-Tracing (Task #29) — periodic link-cluster recompute + one-time backfill
    try {
      const { recomputeLinkClusters, backfillContactEvents } = await import("./trace-engine");
      // One-time backfill guarded by an audit-log checkpoint marker.
      // Re-running across restarts would not corrupt rows (capture skips
      // lastSeen/occurrences updates when source='backfill'), but skipping
      // entirely is faster and idempotent at the workload level.
      const { db: _db } = await import("./db");
      const { auditLogs: _audit } = await import("@shared/schema");
      const { eq: _eq, and: _and } = await import("drizzle-orm");
      const existingMarker = await _db.select().from(_audit).where(_and(
        _eq(_audit.action, "TRACE_BACKFILL_COMPLETE"),
        _eq(_audit.entity, "trace"),
      )).limit(1);
      if (existingMarker.length === 0) {
        const bf = await backfillContactEvents({ batchSize: 1000 });
        console.log(`[Trace] One-time backfill complete: ${bf.borrowers} borrowers, ${bf.writes} contact events captured`);
        try {
          await _db.insert(_audit).values({
            action: "TRACE_BACKFILL_COMPLETE",
            entity: "trace",
            entityId: "system",
            details: `borrowers=${bf.borrowers} writes=${bf.writes} scope=current_borrowers_table_only`,
          });
        } catch (mErr) {
          const err = mErr as Error;
          console.warn("[Trace] Could not record backfill marker:", err.message);
        }
      } else {
        console.log("[Trace] Backfill already completed — skipping (use admin endpoint to re-run)");
      }
      // Initial cluster recompute (deferred to next tick so server can start serving)
      setTimeout(() => {
        recomputeLinkClusters().then(r =>
          console.log(`[Trace] Initial cluster recompute: created=${r.created} updated=${r.updated} skipped=${r.skipped}`)
        ).catch(e => console.error("[Trace] Initial cluster recompute failed:", e.message));
      }, 30_000);
      // Then every 6 hours
      setInterval(() => {
        recomputeLinkClusters().then(r =>
          console.log(`[Trace] Cluster recompute: created=${r.created} updated=${r.updated} skipped=${r.skipped}`)
        ).catch(e => console.error("[Trace] Cluster recompute failed:", e.message));
      }, 6 * 60 * 60 * 1000);
      console.log("[Trace] Scheduler started — link clusters recomputed every 6 hours");
    } catch (e: any) {
      console.error("[Trace] Failed to start trace scheduler:", e.message);
    }

    const { startIntegrityScheduler, encryptAllUnencryptedPII } = await import("./security-hardening");
    try {
      const encResult = await encryptAllUnencryptedPII();
      if (encResult.totalEncrypted > 0) {
        console.log(`[PII-Encrypt] Encrypted ${encResult.totalEncrypted} previously unencrypted PII fields`);
      }
      if (encResult.errors.length > 0) {
        console.warn(`[PII-Encrypt] Errors:`, encResult.errors);
      }
    } catch (err) {
      console.error("[PII-Encrypt] Migration failed:", err);
    }
    startIntegrityScheduler(24);

    const { startLotoFraudScheduler } = await import("./loto-fraud-scheduler");
    startLotoFraudScheduler();

    const { startBackupScheduler } = await import("./backup-service");
    startBackupScheduler();

    const { startRegistryHealthChecker } = await import("./registry-health-checker");
    await startRegistryHealthChecker();

    const { isEmailConfigured } = await import("./email");
    const { isSmsConfigured } = await import("./sms");
    const isProduction = process.env.PRODUCTION_MODE === "true";
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║     Pan-African Credit Registry — Status         ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  Mode:          ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}${isProduction ? "              " : "             "}║`);
    console.log(`║  Platform:       ${process.env.PLATFORM_COMPANY_NAME || "Universal Credit Hub"} — UCH v2.8         ║`);
    console.log(`║  Email:         ${isEmailConfigured() ? "✓ Configured" : "✗ Not configured"}${isEmailConfigured() ? "              " : "          "}║`);
    console.log(`║  SMS:           ${isSmsConfigured() ? "✓ Configured" : "✗ Not configured"}${isSmsConfigured() ? "              " : "          "}║`);
    console.log(`║  Database:      ${process.env.DATABASE_URL ? "✓ Connected" : "✗ Not connected"}${process.env.DATABASE_URL ? "               " : "           "}║`);
    console.log(`║  Google OAuth:  ${process.env.GOOGLE_CLIENT_ID ? "✓ Configured" : "✗ Not configured"}${process.env.GOOGLE_CLIENT_ID ? "              " : "          "}║`);
    console.log(`║  Microsoft SSO: ${process.env.MICROSOFT_CLIENT_ID ? "✓ Configured" : "✗ Not configured"}${process.env.MICROSOFT_CLIENT_ID ? "              " : "          "}║`);
    console.log(`║  SAML SSO:      ${process.env.SAML_IDP_ENTRY_POINT ? "✓ Configured" : "✗ Not configured"}${process.env.SAML_IDP_ENTRY_POINT ? "              " : "          "}║`);
    console.log(`║  MFA/TOTP:      ✓ Available                    ║`);
    console.log(`║  Demo Data:     ${isProduction ? "Skipped" : "Seeded"}${isProduction ? "                   " : "                    "}║`);
    console.log("╚══════════════════════════════════════════════════╝\n");
  });
})();
