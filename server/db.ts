import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 30000,
});

pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm").catch(() => {});

export const db = drizzle(pool, { schema });
