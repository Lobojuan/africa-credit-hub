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

  const supportedCountries = ['Ghana', 'Sierra Leone'];
  const supportedFilter = supportedCountries.map(c => `'${c}'`).join(', ');

  const unsupportedBorrowers = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL`);
  const unsupportedInstitutions = await rowCount(sql`SELECT COUNT(*) as cnt FROM institutions WHERE country NOT IN ('Ghana', 'Sierra Leone')`);
  const totalUnsupported = unsupportedBorrowers + unsupportedInstitutions;
  if (totalUnsupported === 0) {
    await db.execute(sql`UPDATE organizations SET country = 'Ghana' WHERE country IS NULL`);
    return;
  }

  console.log(`[Ghana Cleanup] Found unsupported-country data: ${unsupportedBorrowers} borrowers, ${unsupportedInstitutions} institutions — purging...`);

  await db.execute(sql`DELETE FROM payment_history WHERE credit_account_id IN (SELECT id FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL))`);
  await db.execute(sql`DELETE FROM credit_inquiries WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM credit_report_logs WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM disputes WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM consent_records WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM court_judgments WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM dishonoured_cheques WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL)`);
  await db.execute(sql`DELETE FROM borrowers WHERE country NOT IN ('Ghana', 'Sierra Leone') OR country IS NULL`);

  await db.execute(sql`DELETE FROM billing_records WHERE institution_name IN (SELECT name FROM institutions WHERE country NOT IN ('Ghana', 'Sierra Leone'))`);
  await db.execute(sql`DELETE FROM institutions WHERE country NOT IN ('Ghana', 'Sierra Leone')`);

  await db.execute(sql`UPDATE organizations SET country = 'Ghana' WHERE country IS NULL`);

  const remainingBorrowers = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers`);
  const remainingInst = await rowCount(sql`SELECT COUNT(*) as cnt FROM institutions`);
  console.log(`[Ghana Cleanup] Done. ${remainingBorrowers} borrowers, ${remainingInst} institutions remain.`);
}
