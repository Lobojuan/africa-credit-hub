import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { readFileSync, readdirSync, readlinkSync, writeFileSync, appendFileSync } from "fs";
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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
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
    if (!csrfToken || csrfToken !== req.session.csrfToken) {
      return res.status(403).json({ message: "Invalid or missing CSRF token" });
    }
  }
  next();
});

let maintenanceMode = false;
let maintenanceMessage = "We are working hard to improve your experience. The platform will be back shortly.";

app.get("/api/health", (_req, res) => {
  if (maintenanceMode) {
    return res.status(503).json({ status: "maintenance", version: "2.5.0", message: maintenanceMessage });
  }
  res.json({ status: "ok", version: "2.5.0", uptime: Math.round(process.uptime()) });
});

app.get("/api/maintenance/status", (req, res) => {
  res.json({ enabled: maintenanceMode, message: maintenanceMessage });
});

app.post("/api/maintenance/toggle", (req, res) => {
  if (req.session?.userRole !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  maintenanceMode = !maintenanceMode;
  if (req.body?.message) {
    maintenanceMessage = req.body.message;
  }
  res.json({ enabled: maintenanceMode, message: maintenanceMessage });
});

app.use((req, res, next) => {
  if (!maintenanceMode) return next();

  if (req.path === "/api/health") return next();
  if (req.path.startsWith("/api/auth/")) return next();
  if (req.path.startsWith("/api/maintenance")) return next();
  if (req.path === "/maintenance.html") return next();
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) return next();

  if (req.session?.userRole === "super_admin") return next();

  if (req.path.startsWith("/api/")) {
    return res.status(503).json({ status: "maintenance", message: maintenanceMessage });
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

app.set("trust proxy", true);

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

const DEFAULT_PRICING_TIERS = [
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 250, currency: "USD", country: "Global" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 200, currency: "USD", country: "Global" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 150, currency: "USD", country: "Global" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 150, currency: "USD", country: "Global" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 120, currency: "USD", country: "Global" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 100, currency: "USD", country: "Global" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 50, currency: "USD", country: "Global" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 35, currency: "USD", country: "Global" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 25, currency: "USD", country: "Global" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 500, currency: "USD", country: "Global" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 100, currency: "USD", country: "Global" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 3294, currency: "GHS", country: "Ghana" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 2635, currency: "GHS", country: "Ghana" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 1976, currency: "GHS", country: "Ghana" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 1976, currency: "GHS", country: "Ghana" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 1581, currency: "GHS", country: "Ghana" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 1318, currency: "GHS", country: "Ghana" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 659, currency: "GHS", country: "Ghana" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 461, currency: "GHS", country: "Ghana" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 329, currency: "GHS", country: "Ghana" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 6588, currency: "GHS", country: "Ghana" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 5538, currency: "SLL", country: "Sierra Leone" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 4430, currency: "SLL", country: "Sierra Leone" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 3323, currency: "SLL", country: "Sierra Leone" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 3323, currency: "SLL", country: "Sierra Leone" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 2658, currency: "SLL", country: "Sierra Leone" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 2215, currency: "SLL", country: "Sierra Leone" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 1108, currency: "SLL", country: "Sierra Leone" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 775, currency: "SLL", country: "Sierra Leone" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 554, currency: "SLL", country: "Sierra Leone" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 11075, currency: "SLL", country: "Sierra Leone" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 32250, currency: "KES", country: "Kenya" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 25800, currency: "KES", country: "Kenya" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 19350, currency: "KES", country: "Kenya" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 19350, currency: "KES", country: "Kenya" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 15480, currency: "KES", country: "Kenya" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 12900, currency: "KES", country: "Kenya" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 6450, currency: "KES", country: "Kenya" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 4515, currency: "KES", country: "Kenya" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 3225, currency: "KES", country: "Kenya" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 64500, currency: "KES", country: "Kenya" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 37500, currency: "NGN", country: "Nigeria" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 30000, currency: "NGN", country: "Nigeria" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 22500, currency: "NGN", country: "Nigeria" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 22500, currency: "NGN", country: "Nigeria" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 18000, currency: "NGN", country: "Nigeria" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 15000, currency: "NGN", country: "Nigeria" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 7500, currency: "NGN", country: "Nigeria" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 5250, currency: "NGN", country: "Nigeria" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 3750, currency: "NGN", country: "Nigeria" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 75000, currency: "NGN", country: "Nigeria" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 4500, currency: "ZAR", country: "South Africa" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 3600, currency: "ZAR", country: "South Africa" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 2700, currency: "ZAR", country: "South Africa" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 2700, currency: "ZAR", country: "South Africa" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 2160, currency: "ZAR", country: "South Africa" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 1800, currency: "ZAR", country: "South Africa" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 900, currency: "ZAR", country: "South Africa" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 630, currency: "ZAR", country: "South Africa" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 450, currency: "ZAR", country: "South Africa" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 9000, currency: "ZAR", country: "South Africa" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 62500, currency: "TZS", country: "Tanzania" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 50000, currency: "TZS", country: "Tanzania" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 37500, currency: "TZS", country: "Tanzania" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 37500, currency: "TZS", country: "Tanzania" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 30000, currency: "TZS", country: "Tanzania" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 25000, currency: "TZS", country: "Tanzania" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 12500, currency: "TZS", country: "Tanzania" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 8750, currency: "TZS", country: "Tanzania" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 6250, currency: "TZS", country: "Tanzania" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 125000, currency: "TZS", country: "Tanzania" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 92500, currency: "UGX", country: "Uganda" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 74000, currency: "UGX", country: "Uganda" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 55500, currency: "UGX", country: "Uganda" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 55500, currency: "UGX", country: "Uganda" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 44400, currency: "UGX", country: "Uganda" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 37000, currency: "UGX", country: "Uganda" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 18500, currency: "UGX", country: "Uganda" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 12950, currency: "UGX", country: "Uganda" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 9250, currency: "UGX", country: "Uganda" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 185000, currency: "UGX", country: "Uganda" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 32500, currency: "RWF", country: "Rwanda" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 26000, currency: "RWF", country: "Rwanda" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 19500, currency: "RWF", country: "Rwanda" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 19500, currency: "RWF", country: "Rwanda" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 15600, currency: "RWF", country: "Rwanda" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 13000, currency: "RWF", country: "Rwanda" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 6500, currency: "RWF", country: "Rwanda" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 4550, currency: "RWF", country: "Rwanda" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 3250, currency: "RWF", country: "Rwanda" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 65000, currency: "RWF", country: "Rwanda" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 14250, currency: "ETB", country: "Ethiopia" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 11400, currency: "ETB", country: "Ethiopia" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 8550, currency: "ETB", country: "Ethiopia" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 8550, currency: "ETB", country: "Ethiopia" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 6840, currency: "ETB", country: "Ethiopia" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 5700, currency: "ETB", country: "Ethiopia" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 2850, currency: "ETB", country: "Ethiopia" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 1995, currency: "ETB", country: "Ethiopia" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 1425, currency: "ETB", country: "Ethiopia" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 28500, currency: "ETB", country: "Ethiopia" },
  { name: "Credit Report - Standard", eventType: "credit_report_pull", minVolume: 0, maxVolume: 100, unitPriceCents: 10625, currency: "EGP", country: "Egypt" },
  { name: "Credit Report - Volume", eventType: "credit_report_pull", minVolume: 101, maxVolume: 1000, unitPriceCents: 8500, currency: "EGP", country: "Egypt" },
  { name: "Credit Report - Enterprise", eventType: "credit_report_pull", minVolume: 1001, maxVolume: null, unitPriceCents: 6375, currency: "EGP", country: "Egypt" },
  { name: "Identity Verification - Standard", eventType: "identity_verification", minVolume: 0, maxVolume: 100, unitPriceCents: 6375, currency: "EGP", country: "Egypt" },
  { name: "Identity Verification - Volume", eventType: "identity_verification", minVolume: 101, maxVolume: 1000, unitPriceCents: 5100, currency: "EGP", country: "Egypt" },
  { name: "Identity Verification - Enterprise", eventType: "identity_verification", minVolume: 1001, maxVolume: null, unitPriceCents: 4250, currency: "EGP", country: "Egypt" },
  { name: "Data Submission - Standard", eventType: "data_submission", minVolume: 0, maxVolume: 500, unitPriceCents: 2125, currency: "EGP", country: "Egypt" },
  { name: "Data Submission - Volume", eventType: "data_submission", minVolume: 501, maxVolume: 5000, unitPriceCents: 1488, currency: "EGP", country: "Egypt" },
  { name: "Data Submission - Enterprise", eventType: "data_submission", minVolume: 5001, maxVolume: null, unitPriceCents: 1063, currency: "EGP", country: "Egypt" },
  { name: "Dispute Resolution - Standard", eventType: "dispute_resolution", minVolume: 0, maxVolume: null, unitPriceCents: 21250, currency: "EGP", country: "Egypt" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 1318, currency: "GHS", country: "Ghana" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 2215, currency: "SLL", country: "Sierra Leone" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 12900, currency: "KES", country: "Kenya" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 15000, currency: "NGN", country: "Nigeria" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 1800, currency: "ZAR", country: "South Africa" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 25000, currency: "TZS", country: "Tanzania" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 37000, currency: "UGX", country: "Uganda" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 13000, currency: "RWF", country: "Rwanda" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 5700, currency: "ETB", country: "Ethiopia" },
  { name: "API Access - Standard", eventType: "api_access", minVolume: 0, maxVolume: null, unitPriceCents: 4250, currency: "EGP", country: "Egypt" },

  { name: "Telco Credit Score - Standard", eventType: "telco_credit_score", minVolume: 0, maxVolume: 5000, unitPriceCents: 50, currency: "USD", country: "Global" },
  { name: "Telco Credit Score - Volume", eventType: "telco_credit_score", minVolume: 5001, maxVolume: 50000, unitPriceCents: 25, currency: "USD", country: "Global" },
  { name: "Telco Credit Score - Enterprise", eventType: "telco_credit_score", minVolume: 50001, maxVolume: null, unitPriceCents: 12, currency: "USD", country: "Global" },
  { name: "Telco Decision Engine - Standard", eventType: "telco_decision", minVolume: 0, maxVolume: 5000, unitPriceCents: 30, currency: "USD", country: "Global" },
  { name: "Telco Decision Engine - Volume", eventType: "telco_decision", minVolume: 5001, maxVolume: 50000, unitPriceCents: 15, currency: "USD", country: "Global" },
  { name: "Telco Decision Engine - Enterprise", eventType: "telco_decision", minVolume: 50001, maxVolume: null, unitPriceCents: 8, currency: "USD", country: "Global" },
  { name: "MoMo Data Import - Standard", eventType: "telco_data_import", minVolume: 0, maxVolume: 10000, unitPriceCents: 5, currency: "USD", country: "Global" },
  { name: "MoMo Data Import - Volume", eventType: "telco_data_import", minVolume: 10001, maxVolume: 100000, unitPriceCents: 3, currency: "USD", country: "Global" },
  { name: "MoMo Data Import - Enterprise", eventType: "telco_data_import", minVolume: 100001, maxVolume: null, unitPriceCents: 1, currency: "USD", country: "Global" },
  { name: "Consent Management - Standard", eventType: "telco_consent", minVolume: 0, maxVolume: 10000, unitPriceCents: 2, currency: "USD", country: "Global" },
  { name: "Consent Management - Volume", eventType: "telco_consent", minVolume: 10001, maxVolume: null, unitPriceCents: 1, currency: "USD", country: "Global" },
  { name: "Loan Disbursement - Standard", eventType: "telco_loan_disbursement", minVolume: 0, maxVolume: 5000, unitPriceCents: 25, currency: "USD", country: "Global" },
  { name: "Loan Disbursement - Volume", eventType: "telco_loan_disbursement", minVolume: 5001, maxVolume: 50000, unitPriceCents: 15, currency: "USD", country: "Global" },
  { name: "Loan Disbursement - Enterprise", eventType: "telco_loan_disbursement", minVolume: 50001, maxVolume: null, unitPriceCents: 8, currency: "USD", country: "Global" },
];

const IN_MEMORY_TIERS: any[] = DEFAULT_PRICING_TIERS.map((t, i) => ({
  id: `tier-${i.toString().padStart(3, "0")}`,
  name: t.name,
  eventType: t.eventType,
  minVolume: t.minVolume,
  maxVolume: t.maxVolume,
  unitPriceCents: t.unitPriceCents,
  currency: t.currency,
  country: t.country,
  isActive: true,
  createdAt: new Date().toISOString(),
}));

app.get("/api/platform/pricing-tiers-standalone", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const sorted = [...IN_MEMORY_TIERS]
      .filter(t => t.isActive)
      .sort((a, b) => a.country.localeCompare(b.country) || a.eventType.localeCompare(b.eventType) || a.minVolume - b.minVolume);
    console.log("[BillingInMemory] Serving", sorted.length, "tiers from memory");
    res.json({ pricingTiers: sorted, count: sorted.length, _ts: Date.now() });
  } catch (e: any) {
    console.error("[BillingInMemory] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
});

app.put("/api/platform/pricing-tiers-standalone/:id", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { unitPriceCents, isActive } = req.body;
    if (unitPriceCents !== undefined && (typeof unitPriceCents !== "number" || unitPriceCents < 0)) {
      return res.status(400).json({ message: "unitPriceCents must be a non-negative number" });
    }
    const tier = IN_MEMORY_TIERS.find(t => t.id === req.params.id);
    if (!tier) {
      return res.status(404).json({ message: "Tier not found" });
    }
    if (unitPriceCents !== undefined) tier.unitPriceCents = unitPriceCents;
    if (isActive !== undefined) tier.isActive = isActive;
    console.log("[BillingInMemory] Updated tier", tier.id, "->", tier.unitPriceCents, "cents");
    try {
      await pool.query(
        "INSERT INTO pricing_tiers (id, name, event_type, min_volume, max_volume, unit_price_cents, currency, country, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET unit_price_cents = $6, is_active = $9",
        [tier.id, tier.name, tier.eventType, tier.minVolume, tier.maxVolume, tier.unitPriceCents, tier.currency, tier.country, tier.isActive]
      );
    } catch (dbErr: any) {
      console.log("[BillingInMemory] DB sync failed (non-fatal):", dbErr.message);
    }
    res.json(tier);
  } catch (e: any) {
    console.error("[BillingInMemory] Update error:", e.message);
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
  // Ghana cleanup disabled — platform is now pan-African with data across all 54 countries

  const isProduction = process.env.PRODUCTION_MODE === "true";

  const { seedDatabase } = await import("./seed");
  try {
    await seedDatabase();
  } catch (e) {
    console.error("Seed error (may be expected on first run):", e);
  }

  if (!isProduction) {
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
      const { seedPanAfrican } = await import("./seed-pan-african");
      await seedPanAfrican();
    } catch (e) {
      console.error("Pan-African seed error (non-fatal):", e);
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
