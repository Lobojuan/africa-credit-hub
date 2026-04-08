import { db } from "./db";
import { sql } from "drizzle-orm";

async function rowCount(query: ReturnType<typeof sql>) {
  const result = await db.execute(query);
  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  return Number(rows[0]?.cnt ?? 0);
}

export async function cleanupNonGhanaData() {
  const nonGhanaBorrowers = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers WHERE country != 'Ghana'`);
  const nonGhanaOrgs = await rowCount(sql`SELECT COUNT(*) as cnt FROM organizations WHERE country != 'Ghana'`);

  if (nonGhanaBorrowers === 0 && nonGhanaOrgs === 0) {
    return;
  }

  console.log(`[Ghana Cleanup] Found non-Ghana data: ${nonGhanaBorrowers} borrowers, ${nonGhanaOrgs} orgs — purging...`);

  await db.execute(sql`
    DO $$
    DECLARE
      ngb_ids text[];
      nga_ids text[];
      ngo_ids text[];
      ngu_ids text[];
      ngi_ids text[];
    BEGIN
      SELECT array_agg(id) INTO ngb_ids FROM borrowers WHERE country != 'Ghana';
      IF ngb_ids IS NULL THEN ngb_ids := '{}'; END IF;

      SELECT array_agg(id) INTO nga_ids FROM credit_accounts WHERE borrower_id = ANY(ngb_ids);
      IF nga_ids IS NULL THEN nga_ids := '{}'; END IF;

      SELECT array_agg(id) INTO ngo_ids FROM organizations WHERE country != 'Ghana';
      IF ngo_ids IS NULL THEN ngo_ids := '{}'; END IF;

      SELECT array_agg(id) INTO ngu_ids FROM users WHERE organization_id = ANY(ngo_ids) AND username != 'admin';
      IF ngu_ids IS NULL THEN ngu_ids := '{}'; END IF;

      SELECT array_agg(id) INTO ngi_ids FROM institutions WHERE organization_id = ANY(ngo_ids);
      IF ngi_ids IS NULL THEN ngi_ids := '{}'; END IF;

      DELETE FROM guarantors WHERE credit_account_id = ANY(nga_ids);
      DELETE FROM payment_history WHERE credit_account_id = ANY(nga_ids);

      DELETE FROM borrower_alerts WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM consent_records WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM credit_inquiries WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM disputes WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM court_judgments WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM dishonoured_cheques WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM credit_report_logs WHERE borrower_id = ANY(ngb_ids);
      DELETE FROM credit_accounts WHERE id = ANY(nga_ids);
      DELETE FROM borrowers WHERE id = ANY(ngb_ids);

      DELETE FROM credit_inquiries WHERE inquired_by = ANY(ngu_ids);
      DELETE FROM credit_report_logs WHERE requested_by = ANY(ngu_ids);
      DELETE FROM credit_report_logs WHERE organization_id = ANY(ngo_ids);

      DELETE FROM api_keys WHERE institution_id = ANY(ngi_ids);
      DELETE FROM institutions WHERE id = ANY(ngi_ids);
      DELETE FROM usage_metering WHERE organization_id = ANY(ngo_ids);
      DELETE FROM audit_logs WHERE user_id = ANY(ngu_ids);
      DELETE FROM audit_logs WHERE organization_id = ANY(ngo_ids);
      DELETE FROM notifications WHERE user_id = ANY(ngu_ids);
      DELETE FROM billing_records WHERE organization_id = ANY(ngo_ids);
      DELETE FROM pending_approvals WHERE organization_id = ANY(ngo_ids);
      DELETE FROM guarantors WHERE organization_id = ANY(ngo_ids);
      DELETE FROM court_judgments WHERE organization_id = ANY(ngo_ids);
      DELETE FROM dishonoured_cheques WHERE organization_id = ANY(ngo_ids);
      DELETE FROM disputes WHERE organization_id = ANY(ngo_ids);
      DELETE FROM borrower_alerts WHERE organization_id = ANY(ngo_ids);

      DELETE FROM users WHERE id = ANY(ngu_ids);
      DELETE FROM organizations WHERE id = ANY(ngo_ids);

      DELETE FROM country_settings WHERE country_code != 'GH';

      RAISE NOTICE '[Ghana Cleanup] Non-Ghana data removed';
    END $$;
  `);

  try {
    await db.execute(sql`
      DO $$
      BEGIN
        DELETE FROM telco_decision_logs WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM momo_transactions WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM telco_loan_repayments WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM telco_consent_events WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM telco_loans WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM telco_credit_scores WHERE profile_id IN (SELECT id FROM telco_profiles WHERE country != 'Ghana');
        DELETE FROM telco_profiles WHERE country != 'Ghana';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Telco cleanup partial: %', SQLERRM;
      END $$;
    `);
  } catch (e) {
    console.log("[Ghana Cleanup] Telco cleanup skipped (tables may not exist):", (e as Error).message?.substring(0, 100));
  }

  const remaining = await rowCount(sql`SELECT COUNT(*) as cnt FROM borrowers`);
  const remainingOrgs = await rowCount(sql`SELECT COUNT(*) as cnt FROM organizations`);
  console.log(`[Ghana Cleanup] Done. ${remaining} borrowers, ${remainingOrgs} orgs remain (Ghana only).`);
}
