import { db } from "./db";
import { sql } from "drizzle-orm";
import { isGhanaMode } from "./country-mode";

export async function cleanupNonGhanaData() {
  if (!isGhanaMode()) return;

  const checkResult = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM borrowers WHERE country IS NOT NULL AND country != 'Ghana'
  `);
  const checkRows = Array.isArray(checkResult) ? checkResult : (checkResult as any).rows || [];
  const nonGhanaCount = Number(checkRows[0]?.cnt ?? 0);
  if (nonGhanaCount === 0) {
    return;
  }

  console.log(`[Ghana Cleanup] Found ${nonGhanaCount} non-Ghana borrowers — purging all non-Ghana data...`);

  await db.execute(sql`DELETE FROM payment_history WHERE credit_account_id IN (SELECT id FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana'))`);
  await db.execute(sql`DELETE FROM credit_inquiries WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM credit_report_logs WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM disputes WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM consent_records WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM court_judgments WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM borrowers WHERE country != 'Ghana'`);

  await db.execute(sql`DELETE FROM billing_records WHERE institution_id IN (SELECT id FROM institutions WHERE country != 'Ghana')`);
  await db.execute(sql`DELETE FROM institutions WHERE country != 'Ghana'`);

  await db.execute(sql`DELETE FROM organizations WHERE country != 'Ghana'`);

  await db.execute(sql`DELETE FROM retention_policies WHERE country != 'Ghana'`);
  await db.execute(sql`DELETE FROM exchange_rates WHERE base_currency NOT IN ('GHS', 'USD', 'EUR', 'GBP') OR target_currency NOT IN ('GHS', 'USD', 'EUR', 'GBP')`);

  await db.execute(sql`DELETE FROM audit_logs WHERE details::text LIKE '%non-Ghana%'`);

  const remainResult = await db.execute(sql`SELECT COUNT(*) as cnt FROM borrowers`);
  const remainRows = Array.isArray(remainResult) ? remainResult : (remainResult as any).rows || [];
  console.log(`[Ghana Cleanup] Done. ${remainRows[0]?.cnt ?? 0} Ghana borrowers remain.`);
}
