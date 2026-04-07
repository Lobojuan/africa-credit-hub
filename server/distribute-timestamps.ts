import { db } from "./db";
import { sql } from "drizzle-orm";

export async function distributeCreatedAtTimestamps() {
  const check = await db.execute(sql`
    SELECT EXISTS(
      SELECT 1 FROM credit_accounts 
      WHERE created_at >= NOW() - INTERVAL '23 hours'
      LIMIT 1
    ) as has_recent
  `);
  
  const hasRecent = (check as any).rows?.[0]?.has_recent ?? (check as any)[0]?.has_recent;
  if (hasRecent === true || hasRecent === 't' || hasRecent === 'true') {
    return;
  }

  console.log("[Timestamps] Distributing created_at across date filter ranges...");

  const tables = [
    "borrowers",
    "credit_accounts",
    "court_judgments",
    "dishonoured_cheques",
    "credit_inquiries",
    "audit_logs",
  ];

  for (const table of tables) {
    try {
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM ${table}`));
      const total = parseInt((countResult as any).rows?.[0]?.c ?? (countResult as any)[0]?.c ?? "0");
      if (total === 0) continue;

      await db.execute(sql.raw(`
        WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn,
                 COUNT(*) OVER () as total
          FROM ${table}
        )
        UPDATE ${table} SET created_at = CASE
          WHEN numbered.rn <= numbered.total * 0.08 
            THEN NOW() - (random() * INTERVAL '20 hours')
          WHEN numbered.rn <= numbered.total * 0.20 
            THEN NOW() - (INTERVAL '1 day' + random() * INTERVAL '5 days')
          WHEN numbered.rn <= numbered.total * 0.50 
            THEN NOW() - (INTERVAL '7 days' + random() * INTERVAL '23 days')
          WHEN numbered.rn <= numbered.total * 0.80 
            THEN NOW() - (INTERVAL '30 days' + random() * INTERVAL '60 days')
          ELSE 
            NOW() - (INTERVAL '90 days' + random() * INTERVAL '180 days')
        END
        FROM numbered
        WHERE ${table}.id = numbered.id
      `));

      console.log(`[Timestamps] Distributed ${total} records in ${table}`);
    } catch (e: any) {
      console.log(`[Timestamps] Skipped ${table}: ${e.message?.substring(0, 80)}`);
    }
  }

  console.log("[Timestamps] Distribution complete");
}
