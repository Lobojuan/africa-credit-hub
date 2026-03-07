import { db } from "./db";
import { sql } from "drizzle-orm";
import { isGhanaMode } from "./country-mode";

async function rowCount(query: ReturnType<typeof sql>) {
  const result = await db.execute(query);
  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  return Number(rows[0]?.cnt ?? 0);
}

export async function cleanupNonGhanaData() {
  if (!isGhanaMode()) return;

  const nonGhanaBorrowers = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers WHERE country != 'Ghana' OR country IS NULL`);
  const nonGhanaInstitutions = await rowCount(sql`SELECT COUNT(*) as cnt FROM institutions WHERE country != 'Ghana'`);
  const nonGhanaOrgs = await rowCount(sql`SELECT COUNT(*) as cnt FROM organizations WHERE country != 'Ghana'`);

  const totalNonGhana = nonGhanaBorrowers + nonGhanaInstitutions + nonGhanaOrgs;
  if (totalNonGhana === 0) return;

  console.log(`[Ghana Cleanup] Found non-Ghana data: ${nonGhanaBorrowers} borrowers, ${nonGhanaInstitutions} institutions, ${nonGhanaOrgs} orgs — purging...`);

  await db.execute(sql`DELETE FROM payment_history WHERE credit_account_id IN (SELECT id FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL))`);
  await db.execute(sql`DELETE FROM credit_inquiries WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM credit_report_logs WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM disputes WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM consent_records WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM court_judgments WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana' OR country IS NULL)`);
  await db.execute(sql`DELETE FROM borrowers WHERE country != 'Ghana' OR country IS NULL`);

  await db.execute(sql`DELETE FROM billing_records WHERE institution_name IN (SELECT name FROM institutions WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM institutions WHERE country != 'Ghana'`);

  await db.execute(sql`DELETE FROM organizations WHERE country != 'Ghana'`);

  await db.execute(sql`DELETE FROM retention_policies WHERE country != 'Ghana'`);
  await db.execute(sql`DELETE FROM exchange_rates WHERE base_currency NOT IN ('GHS', 'USD', 'EUR', 'GBP') OR target_currency NOT IN ('GHS', 'USD', 'EUR', 'GBP')`);

  await db.execute(sql`DELETE FROM pending_approvals WHERE data::text LIKE '%"country":"%' AND data::text NOT LIKE '%"country":"Ghana"%'`);

  const remainingBorrowers = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers`);
  const remainingInst = await rowCount(sql`SELECT COUNT(*) as cnt FROM institutions`);
  console.log(`[Ghana Cleanup] Done. ${remainingBorrowers} borrowers, ${remainingInst} institutions remain.`);
}
