import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const isProd = process.env.NODE_ENV === "production";
const isProductionBoot = isProd || process.env.PRODUCTION_MODE === "true";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 30 : 20,
  min: isProd ? 5 : 2,
  idleTimeoutMillis: isProd ? 60000 : 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: false,
  ssl: isProductionBoot ? { rejectUnauthorized: true } : false,
});

pool.on("error", (err) => {
  console.error(JSON.stringify({ level: "error", source: "db-pool", message: "Unexpected client error", error: err.message, ts: new Date().toISOString() }));
});

pool.on("connect", () => {
  console.log(JSON.stringify({ level: "info", source: "db-pool", message: "Client connected", total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, ts: new Date().toISOString() }));
});

let poolHealthInterval: ReturnType<typeof setInterval> | null = null;
export function startPoolHealthCheck(intervalMs = 60000) {
  if (poolHealthInterval) return;
  poolHealthInterval = setInterval(async () => {
    try {
      const start = Date.now();
      await pool.query("SELECT 1");
      const latency = Date.now() - start;
      if (latency > 500) {
        console.warn(JSON.stringify({ level: "warn", source: "db-pool", message: "Slow health check", latencyMs: latency, total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, ts: new Date().toISOString() }));
      }
    } catch (err: any) {
      console.error(JSON.stringify({ level: "error", source: "db-pool", message: "Health check failed", error: err.message, ts: new Date().toISOString() }));
    }
  }, intervalMs);
}

pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm").catch((err: any) => {
  console.warn("[DB] pg_trgm extension unavailable:", err.message);
});

export const db = drizzle(pool, { schema });
