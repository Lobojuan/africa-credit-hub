import { db } from "./db";
import { sql } from "drizzle-orm";

async function execSql(query: ReturnType<typeof sql>): Promise<number> {
  const result = await db.execute(query);
  return (result as any).rowCount ?? 0;
}

async function rowCount(query: ReturnType<typeof sql>): Promise<number> {
  const result = await db.execute(query);
  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  return Number(rows[0]?.cnt ?? 0);
}

export async function cleanupNonGhanaData() {
  const hasNonGhanaBorrowers = await db.execute(sql`SELECT EXISTS(SELECT 1 FROM borrowers WHERE country != 'Ghana' LIMIT 1) as has_any`);
  const hasNonGhanaOrgs = await db.execute(sql`SELECT EXISTS(SELECT 1 FROM organizations WHERE country != 'Ghana' LIMIT 1) as has_any`);
  const nonGhanaBorrowers = ((hasNonGhanaBorrowers as any).rows?.[0]?.has_any === true || (hasNonGhanaBorrowers as any).rows?.[0]?.has_any === 't') ? 1 : 0;
  const nonGhanaOrgs = ((hasNonGhanaOrgs as any).rows?.[0]?.has_any === true || (hasNonGhanaOrgs as any).rows?.[0]?.has_any === 't') ? 1 : 0;

  if (nonGhanaBorrowers === 0 && nonGhanaOrgs === 0) {
    const nonGhanaCS = await rowCount(sql`SELECT COUNT(*) as cnt FROM country_settings WHERE country_code != 'GH' LIMIT 1`);
    if (nonGhanaCS > 0) {
      await execSql(sql`DELETE FROM country_settings WHERE country_code != 'GH'`);
      console.log(`[Ghana Cleanup] Removed ${nonGhanaCS} non-Ghana country settings`);
    }
    console.log("[Ghana Cleanup] Already clean — skipping");
    return;
  }

  console.log(`[Ghana Cleanup] Found non-Ghana data: ${nonGhanaBorrowers} borrowers, ${nonGhanaOrgs} orgs — purging...`);

  const ghOrgResult = await db.execute(sql`SELECT id FROM organizations WHERE country = 'Ghana' ORDER BY created_at ASC LIMIT 1`);
  const ghOrgRows = Array.isArray(ghOrgResult) ? ghOrgResult : (ghOrgResult as any).rows || [];
  const ghOrgId = ghOrgRows[0]?.id as string | undefined;

  if (ghOrgId) {
    const reassigned = await execSql(sql`UPDATE borrowers SET organization_id = ${ghOrgId} WHERE country = 'Ghana' AND organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
    if (reassigned > 0) console.log(`[Ghana Cleanup] Reassigned ${reassigned} Ghana borrowers from non-Ghana orgs`);

    await execSql(sql`UPDATE credit_accounts SET organization_id = ${ghOrgId} WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
    await execSql(sql`UPDATE users SET organization_id = ${ghOrgId} WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username = 'admin'`);
  }

  await execSql(sql`DELETE FROM guarantors WHERE credit_account_id IN (SELECT id FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana'))`);
  await execSql(sql`DELETE FROM payment_history WHERE credit_account_id IN (SELECT id FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana'))`);
  await execSql(sql`DELETE FROM borrower_alerts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM consent_records WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM credit_inquiries WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM disputes WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM court_judgments WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM dishonoured_cheques WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM credit_report_logs WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM credit_accounts WHERE borrower_id IN (SELECT id FROM borrowers WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM borrowers WHERE country != 'Ghana'`);

  const ngoUserIds = await db.execute(sql`SELECT id FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin'`);
  const nuRows = Array.isArray(ngoUserIds) ? ngoUserIds : (ngoUserIds as any).rows || [];
  const nuIds = nuRows.map((r: any) => r.id as string);

  if (nuIds.length > 0) {
    await execSql(sql`DELETE FROM credit_inquiries WHERE inquired_by IN (SELECT id FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin')`);
    await execSql(sql`DELETE FROM credit_report_logs WHERE requested_by IN (SELECT id FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin')`);
    await execSql(sql`DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin')`);
    await execSql(sql`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin')`);
    await execSql(sql`DELETE FROM users WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana') AND username != 'admin'`);
  }

  await execSql(sql`DELETE FROM credit_report_logs WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM api_keys WHERE institution_id IN (SELECT id FROM institutions WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana'))`);
  await execSql(sql`DELETE FROM institutions WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM usage_metering WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM audit_logs WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM billing_records WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM pending_approvals WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM guarantors WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM court_judgments WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM dishonoured_cheques WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM disputes WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM borrower_alerts WHERE organization_id IN (SELECT id FROM organizations WHERE country != 'Ghana')`);
  await execSql(sql`DELETE FROM organizations WHERE country != 'Ghana'`);

  await execSql(sql`DELETE FROM country_settings WHERE country_code != 'GH'`);

  try {
    await execSql(sql`DELETE FROM telco_decision_logs WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM momo_transactions WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM telco_loan_repayments WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM telco_consent_events WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM telco_loans WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM telco_credit_scores WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana')`);
    await execSql(sql`DELETE FROM telco_profiles WHERE country != 'Ghana'`);
  } catch (e) {
    console.log("[Ghana Cleanup] Telco cleanup partial:", (e as Error).message?.substring(0, 120));
  }

  const remaining = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers`);
  const remainingOrgs = await rowCount(sql`SELECT COUNT(*) as cnt FROM organizations`);
  console.log(`[Ghana Cleanup] Done. ${remaining} borrowers, ${remainingOrgs} orgs remain (Ghana only).`);
}
