import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[Pool] Unexpected client error:", err.message);
});

pool.on("connect", () => {
  console.log(`[Pool] New client connected (total: ${pool.totalCount}, idle: ${pool.idleCount}, waiting: ${pool.waitingCount})`);
});

pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm").catch(() => {});

export const db = drizzle(pool, { schema });
