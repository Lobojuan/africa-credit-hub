import { db } from "./db";
import { sql } from "drizzle-orm";

/** Normalize a db.execute() result to a plain row array across driver shapes. */
function resultRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const rows = (result as { rows?: unknown })?.rows;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

/** Postgres booleans may arrive as true, "t", or "true" depending on driver. */
function pgBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

export async function distributeCreatedAtTimestamps() {
  const check = await db.execute(sql`
    SELECT EXISTS(
      SELECT 1 FROM credit_accounts
      WHERE created_at >= NOW() - INTERVAL '2 days'
        AND created_at <= NOW() - INTERVAL '1 day'
      LIMIT 1
    ) as has_distributed
  `);

  if (pgBool(resultRows(check)[0]?.has_distributed)) {
    return;
  }

  const totalCheck = await db.execute(sql`SELECT COUNT(*) as c FROM credit_accounts`);
  const totalRecords = parseInt(String(resultRows(totalCheck)[0]?.c ?? "0"));
  if (isNaN(totalRecords)) return;
  if (totalRecords > 10000) {
    console.log(`[Timestamps] Skipping distribution — ${totalRecords} records too large for startup redistribution`);
    return;
  }

  console.log("[Timestamps] Distributing created_at across date filter ranges...");

  const tables = [
    "borrowers",
    "credit_accounts",
    "court_judgments",
    "dishonoured_cheques",
    "credit_inquiries",
  ];

  for (const table of tables) {
    try {
      const t = sql.identifier(table);
      const countResult = await db.execute(sql`SELECT COUNT(*) as c FROM ${t}`);
      const total = parseInt(String(resultRows(countResult)[0]?.c ?? "0"));
      if (isNaN(total) || total === 0) continue;

      await db.execute(sql`
        WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn,
                 COUNT(*) OVER () as total
          FROM ${t}
        )
        UPDATE ${t} SET created_at = CASE
          WHEN numbered.rn <= numbered.total * 0.15 
            THEN NOW() - (INTERVAL '2 days' + random() * INTERVAL '5 days')
          WHEN numbered.rn <= numbered.total * 0.45 
            THEN NOW() - (INTERVAL '7 days' + random() * INTERVAL '23 days')
          WHEN numbered.rn <= numbered.total * 0.75 
            THEN NOW() - (INTERVAL '30 days' + random() * INTERVAL '60 days')
          ELSE 
            NOW() - (INTERVAL '90 days' + random() * INTERVAL '180 days')
        END
        FROM numbered
        WHERE ${t}.id = numbered.id
      `);

      const hasUpdatedAt = await db.execute(sql`
        SELECT 1 FROM information_schema.columns WHERE table_name=${table} AND column_name='updated_at' LIMIT 1
      `);
      const updRows = resultRows(hasUpdatedAt);
      if (updRows.length > 0) {
        await db.execute(sql`UPDATE ${t} SET updated_at = created_at`);
      }

      console.log(`[Timestamps] Distributed ${total} records in ${table}`);
    } catch (e: any) {
      console.log(`[Timestamps] Skipped ${table}: ${e.message?.substring(0, 80)}`);
    }
  }

  console.log("[Timestamps] Distribution complete");
}
