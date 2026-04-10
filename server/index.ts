import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import compression from "compression";
import helmet from "helmet";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { writeFileSync, appendFileSync } from "fs";
import { pool, startPoolHealthCheck } from "./db";
import { createLogger } from "./logger";

const port = parseInt(process.env.PORT || "5000", 10);

function crashLog(msg: string) {
  try {
    const ts = new Date().toISOString();
    const mem = process.memoryUsage();
    const line = `[${ts}] ${msg} | rss=${Math.round(mem.rss / 1024 / 1024)}MB heap=${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB\n`;
    appendFileSync("/tmp/server-crash.log", line);
  } catch {}
}
crashLog("SERVER_START");

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}

const app = express();
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
    version: "2.5.0",
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
      scriptSrc: process.env.NODE_ENV === "production"
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
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
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
    return res.status(503).json({ status: "maintenance", version: "2.5.0", message: maintenanceState.message });
  }
  res.json({ status: "ok", version: "2.5.0", uptime: Math.round(process.uptime()) });
});

app.get("/api/maintenance/status", (req, res) => {
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

app.set("trust proxy", 1);

const httpLogger = createLogger("http");

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
      if (capturedJsonResponse) {
        const str = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${str.length > 200 ? str.slice(0, 200) + "..." : str}`;
      }

      log(logLine);
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
  try { return origStdoutWrite(...args); } catch { return false; }
} as any;
process.stderr.write = function (...args: any[]) {
  try { return origStderrWrite(...args); } catch { return false; }
} as any;

(async () => {
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
    const { runMigrations } = await import('stripe-replit-sync');
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      console.log('Initializing Stripe schema...');
      await runMigrations({ databaseUrl, schema: 'stripe' });
      console.log('Stripe schema ready');

      const { getStripeSync } = await import('./stripeClient');
      const stripeSync = await getStripeSync();

      const { getBaseUrl } = await import('./base-url');
      const webhookBaseUrl = getBaseUrl();
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`
      );
      console.log('Stripe webhook configured:', webhookResult?.webhook?.url || 'setup complete');

      stripeSync.syncBackfill()
        .then(() => console.log('Stripe data synced'))
        .catch((err: any) => console.error('Stripe sync error:', err));

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

    const { startAnchorScheduler } = await import("./blockchain-anchor");
    startAnchorScheduler(6);

    const { startIntegrityScheduler } = await import("./security-hardening");
    startIntegrityScheduler(24);

    const { startBackupScheduler } = await import("./backup-service");
    startBackupScheduler();

    const { isEmailConfigured } = await import("./email");
    const { isSmsConfigured } = await import("./sms");
    const isProduction = process.env.PRODUCTION_MODE === "true";
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║     Pan-African Credit Registry — Status         ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  Mode:          ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}${isProduction ? "              " : "             "}║`);
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
