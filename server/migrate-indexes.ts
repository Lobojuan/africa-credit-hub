import { pool } from "./db";

export async function createPerformanceIndexes() {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_borrowers_country_national_id ON borrowers (country, national_id)`,
    `CREATE INDEX IF NOT EXISTS idx_borrowers_last_first_name ON borrowers (last_name, first_name)`,
    `CREATE INDEX IF NOT EXISTS idx_borrowers_organization_id ON borrowers (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_credit_accounts_borrower_status ON credit_accounts (borrower_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_credit_accounts_account_number ON credit_accounts (account_number)`,
    `CREATE INDEX IF NOT EXISTS idx_credit_accounts_organization_id ON credit_accounts (organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_action ON audit_logs (created_at, action)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_data_sharing_agreements_status_countries ON data_sharing_agreements (status, source_country, target_country)`,
    `CREATE INDEX IF NOT EXISTS idx_papss_settlements_status ON papss_settlements (status)`,
    `CREATE INDEX IF NOT EXISTS idx_papss_settlements_countries ON papss_settlements (sender_country, receiver_country)`,
    `CREATE INDEX IF NOT EXISTS idx_credit_inquiries_borrower_id ON credit_inquiries (borrower_id)`,
    `CREATE INDEX IF NOT EXISTS idx_disputes_borrower_id ON disputes (borrower_id)`,
    `CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status)`,
    `CREATE INDEX IF NOT EXISTS idx_consent_records_borrower_status ON consent_records (borrower_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_payment_history_account_id ON payment_history (credit_account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read)`,
  ];

  let created = 0;
  for (const idx of indexes) {
    try {
      await pool.query(idx);
      created++;
    } catch (err: any) {
      console.warn(`[Index] Skipped: ${err.message}`);
    }
  }
  console.log(`[Index] Created/verified ${created}/${indexes.length} performance indexes`);
}
