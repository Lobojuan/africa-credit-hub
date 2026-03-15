import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { readFileSync, readdirSync, readlinkSync, writeFileSync, appendFileSync } from "fs";
import { pool } from "./db";

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

function killPortHolder(targetPort: number) {
  try {
    const hexPort = targetPort.toString(16).toUpperCase().padStart(4, "0");
    const tcpData = readFileSync("/proc/net/tcp", "utf-8");
    for (const line of tcpData.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const portHex = parts[1]?.split(":")[1];
      if (portHex?.toUpperCase() !== hexPort) continue;
      const inode = parts[9];
      if (!inode || inode === "0") continue;
      for (const pid of readdirSync("/proc").filter((f: string) => /^\d+$/.test(f))) {
        try {
          for (const fd of readdirSync(`/proc/${pid}/fd`)) {
            try {
              if (readlinkSync(`/proc/${pid}/fd/${fd}`) === `socket:[${inode}]`) {
                const pidNum = parseInt(pid);
                if (pidNum !== process.pid) {
                  process.kill(pidNum, 9);
                  console.log(`Killed stale process ${pidNum} on port ${targetPort}`);
                }
                return;
              }
            } catch {}
          }
        } catch {}
      }
      return;
    }
  } catch {}
}

killPortHolder(port);

const app = express();
app.set("etag", false);

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
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
    organizationId: string;
    userCountry: string;
    lastActivity: number;
    mfaPendingUserId: string;
    viewingCountry: string;
  }
}

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

const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
app.use((req, res, next) => {
  if (req.session?.userId && req.session.lastActivity) {
    const idle = Date.now() - req.session.lastActivity;
    if (idle > IDLE_TIMEOUT_MS) {
      req.session.destroy(() => {});
      return res.status(440).json({ message: "Session expired due to inactivity" });
    }
  }
  if (req.session?.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
});

app.set("trust proxy", true);

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

app.get("/api/platform/pricing-tiers-standalone", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userCheck = await pool.query("SELECT role FROM users WHERE id = $1", [req.session.userId]);
    if (!userCheck.rows.length || userCheck.rows[0].role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const tierResult = await pool.query(
      "SELECT id, name, event_type, min_volume, max_volume, unit_price_cents, currency, country, is_active, created_at FROM pricing_tiers WHERE is_active = true ORDER BY country, event_type, min_volume"
    );
    console.log("[BillingStandalone] Tiers fetched:", tierResult.rows.length);
    const tiers = tierResult.rows.map((t: any) => ({
      id: t.id,
      name: t.name,
      eventType: t.event_type,
      minVolume: Number(t.min_volume) || 0,
      maxVolume: t.max_volume != null ? Number(t.max_volume) : null,
      unitPriceCents: Number(t.unit_price_cents) || 0,
      currency: String(t.currency || "USD"),
      country: String(t.country || "Global"),
      isActive: t.is_active,
      createdAt: t.created_at,
    }));
    res.json({ pricingTiers: tiers, count: tiers.length, _ts: Date.now() });
  } catch (e: any) {
    console.error("[BillingStandalone] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
});

app.put("/api/platform/pricing-tiers-standalone/:id", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userCheck = await pool.query("SELECT role FROM users WHERE id = $1", [req.session.userId]);
    if (!userCheck.rows.length || userCheck.rows[0].role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { unitPriceCents, isActive } = req.body;
    if (unitPriceCents !== undefined && (typeof unitPriceCents !== "number" || unitPriceCents < 0)) {
      return res.status(400).json({ message: "unitPriceCents must be a non-negative number" });
    }
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;
    if (unitPriceCents !== undefined) {
      setClauses.push(`unit_price_cents = $${paramIdx++}`);
      values.push(unitPriceCents);
    }
    if (isActive !== undefined) {
      setClauses.push(`is_active = $${paramIdx++}`);
      values.push(isActive);
    }
    if (setClauses.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE pricing_tiers SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Tier not found" });
    }
    const t = result.rows[0];
    res.json({
      id: t.id,
      name: t.name,
      eventType: t.event_type,
      minVolume: Number(t.min_volume) || 0,
      maxVolume: t.max_volume != null ? Number(t.max_volume) : null,
      unitPriceCents: Number(t.unit_price_cents) || 0,
      currency: String(t.currency || "USD"),
      country: String(t.country || "Global"),
      isActive: t.is_active,
      createdAt: t.created_at,
    });
  } catch (e: any) {
    console.error("[BillingStandalone] Update error:", e.message);
    res.status(500).json({ message: e.message });
  }
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
  try {
    const { cleanupNonGhanaData } = await import("./ghana-cleanup");
    await cleanupNonGhanaData();
  } catch (e) {
    console.error("Ghana cleanup error (non-fatal):", e);
  }

  const { seedDatabase } = await import("./seed");
  try {
    await seedDatabase();
  } catch (e) {
    console.error("Seed error (may be expected on first run):", e);
  }

  try {
    const { seedTestData } = await import("./seed-test-data");
    await seedTestData();
  } catch (e) {
    console.error("Test data seed error:", e);
  }

  try {
    const { seedSierraLeoneData } = await import("./seed-sierra-leone");
    await seedSierraLeoneData();
  } catch (e) {
    console.error("Sierra Leone seed error (non-fatal):", e);
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

      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
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

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
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

    const { startRetentionScheduler } = await import("./retention-enforcement");
    startRetentionScheduler(24);

    const { startExchangeRateScheduler } = await import("./exchange-rate-scheduler");
    startExchangeRateScheduler();
  });
})();
