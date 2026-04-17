import { sql } from "drizzle-orm";
import { db } from "./db";

export async function migrateNewTables() {
  await db.execute(sql`ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS passport_number text`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS exchange_rates (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency text NOT NULL,
    target_currency text NOT NULL,
    rate decimal(15,6) NOT NULL,
    effective_date text NOT NULL,
    source text NOT NULL DEFAULT 'manual',
    created_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now()
  )`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS retention_policies (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    country text NOT NULL,
    entity_type text NOT NULL,
    retention_years integer NOT NULL,
    archive_after_years integer,
    action text DEFAULT 'flag',
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`);

  await db.execute(sql`ALTER TABLE retention_policies ADD COLUMN IF NOT EXISTS action text DEFAULT 'flag'`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS archived_records (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id varchar NOT NULL,
    country text NOT NULL,
    policy_id varchar,
    original_data jsonb NOT NULL,
    archived_at timestamp DEFAULT now(),
    UNIQUE(entity_type, entity_id)
  )`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS retention_flags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id varchar NOT NULL,
    policy_id varchar REFERENCES retention_policies(id),
    action text NOT NULL DEFAULT 'flag',
    country text NOT NULL,
    flagged_at timestamp DEFAULT now(),
    resolved_at timestamp,
    UNIQUE(entity_type, entity_id, policy_id)
  )`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS credit_score_history (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    score integer NOT NULL,
    score_model text NOT NULL,
    factors text,
    provider text,
    created_at timestamp DEFAULT now()
  )`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS api_configurations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    base_url text NOT NULL,
    api_key_header_name text DEFAULT 'X-API-Key',
    auth_type text NOT NULL DEFAULT 'none',
    country text,
    is_active boolean DEFAULT true,
    description text,
    last_tested_at timestamp,
    last_test_status text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`);

  const rateCount = await db.execute(sql`SELECT count(*) FROM exchange_rates`);
  if (parseInt((rateCount.rows[0] as any).count) === 0) {
    const rates = [
      ['GHS', 'USD', '0.076923', '2026-03-01'],
      ['ETB', 'USD', '0.017241', '2026-03-01'],
      ['UGX', 'USD', '0.000265', '2026-03-01'],
      ['LRD', 'USD', '0.005208', '2026-03-01'],
      ['EUR', 'USD', '1.080000', '2026-03-01'],
      ['GBP', 'USD', '1.270000', '2026-03-01'],
      ['USD', 'GHS', '13.000000', '2026-03-01'],
      ['USD', 'ETB', '58.000000', '2026-03-01'],
      ['USD', 'UGX', '3774.000000', '2026-03-01'],
      ['USD', 'LRD', '192.000000', '2026-03-01'],
      ['USD', 'EUR', '0.925926', '2026-03-01'],
      ['USD', 'GBP', '0.787402', '2026-03-01'],
    ];
    for (const [b, t, r, d] of rates) {
      await db.execute(sql`INSERT INTO exchange_rates (base_currency, target_currency, rate, effective_date, source) VALUES (${b}, ${t}, ${r}, ${d}, 'manual')`);
    }
    console.log('Seeded', rates.length, 'exchange rates');
  }

  const polCount = await db.execute(sql`SELECT count(*) FROM retention_policies`);
  if (parseInt((polCount.rows[0] as any).count) === 0) {
    const policies = [
      ['Ghana', 'borrower', 10, 8, 'Ghana Credit Reporting Act: 10-year retention'],
      ['Ghana', 'credit_account', 10, 8, 'Ghana Credit Reporting Act: 10-year retention'],
      ['Ethiopia', 'borrower', 7, 5, 'NBE directive: 7-year retention'],
      ['Ethiopia', 'credit_account', 7, 5, 'NBE directive: 7-year retention'],
      ['Uganda', 'borrower', 7, 5, 'BoU CRB Regulations: 7-year retention'],
      ['Uganda', 'credit_account', 7, 5, 'BoU CRB Regulations: 7-year retention'],
      ['Liberia', 'borrower', 7, 5, 'CBL regulation: 7-year retention'],
      ['Liberia', 'credit_account', 7, 5, 'CBL regulation: 7-year retention'],
      ['All', 'audit_log', 10, 10, 'SLA-RET-01: 10-year forensic audit trail'],
      ['All', 'dispute', 7, 5, '7-year retention for disputes'],
      ['All', 'consent_record', 7, 5, '7-year retention for consent records'],
      ['All', 'court_judgment', 10, 8, 'Court judgments: 10-year retention'],
    ];
    for (const [c, e, r, a, d] of policies) {
      await db.execute(sql`INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description) VALUES (${c}, ${e}, ${r}, ${a}, ${d})`);
    }
    console.log('Seeded', policies.length, 'retention policies');
  }

  const apiCount = await db.execute(sql`SELECT count(*) FROM api_configurations`);
  if (parseInt((apiCount.rows[0] as any).count) === 0) {
    const apis: [string, string, string, string, string | null, string][] = [
      ['Ghana Meteorological Agency', 'weather', 'https://meteo.gov.gh/api/v1', 'api_key', 'Ghana', 'Weather and rainfall data for agricultural risk'],
      ['Ethiopia National Meteorological Agency', 'weather', 'https://ethiomet.gov.et/api/v1', 'api_key', 'Ethiopia', 'Climate data for agricultural credit risk'],
      ['Uganda National Meteorological Authority', 'weather', 'https://unma.go.ug/api/v1', 'api_key', 'Uganda', 'Weather forecasts for agricultural sector'],
      ['Liberia Meteorological Service', 'weather', 'https://lms.gov.lr/api/v1', 'api_key', 'Liberia', 'Weather data for agricultural assessment'],
      ['Ghana Judicial Service', 'judicial', 'https://judicial.gov.gh/api/v1', 'oauth2', 'Ghana', 'Court judgments and legal proceedings'],
      ['Ethiopia Federal Courts', 'judicial', 'https://courts.gov.et/api/v1', 'oauth2', 'Ethiopia', 'Court judgment records'],
      ['Uganda Judiciary', 'judicial', 'https://judiciary.go.ug/api/v1', 'oauth2', 'Uganda', 'Court records and judgment retrieval'],
      ['Liberia Judiciary', 'judicial', 'https://judiciary.gov.lr/api/v1', 'oauth2', 'Liberia', 'Judicial records and civil judgments'],
      ['Open Exchange Rates', 'exchange_rate', 'https://openexchangerates.org/api', 'api_key', null, 'Real-time exchange rate data'],
      ['Flutterwave', 'payment_gateway', 'https://api.flutterwave.com/v3', 'bearer', null, 'Payment processing across Africa'],
      ['Paystack', 'payment_gateway', 'https://api.paystack.co', 'bearer', null, 'Payment processing for West Africa'],
    ];
    for (const [n, c, u, a, co, d] of apis) {
      await db.execute(sql`INSERT INTO api_configurations (name, category, base_url, auth_type, country, description) VALUES (${n}, ${c}, ${u}, ${a}, ${co}, ${d})`);
    }
    console.log('Seeded', apis.length, 'API configurations');
  }

  // Identity & Fraud module (Task #27) — idempotent DDL so production
  // environments without manual db:push still get the new tables/enums.
  // Names match shared/schema.ts exactly (verification_method, verification_result,
  // watchlist_source, fraud_severity, fraud_review_status).
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('id_lookup','biometric_match','liveness_check','document_ocr','phone_match');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE verification_result AS ENUM ('passed','failed','manual_review','stub','error');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE watchlist_source AS ENUM ('sanctions_un','sanctions_ofac','sanctions_eu','pep','adverse_media','internal_block');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE fraud_severity AS ENUM ('low','medium','high','critical');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE fraud_review_status AS ENUM ('open','investigating','resolved','false_positive','escalated');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS identity_verifications (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    provider text NOT NULL,
    method verification_method NOT NULL,
    result verification_result NOT NULL,
    confidence_score decimal(5,2),
    evidence_hash text,
    evidence_url text,
    raw_response text,
    error_message text,
    verified_by varchar REFERENCES users(id),
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_identity_verifications_borrower ON identity_verifications(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_identity_verifications_result ON identity_verifications(result)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS watchlist_hits (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    source watchlist_source NOT NULL,
    provider text NOT NULL,
    match_score decimal(5,2) NOT NULL,
    matched_name text,
    match_details text,
    status fraud_review_status NOT NULL DEFAULT 'open',
    reviewed_by varchar REFERENCES users(id),
    review_notes text,
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now(),
    resolved_at timestamp
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_watchlist_hits_borrower ON watchlist_hits(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_watchlist_hits_status ON watchlist_hits(status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_watchlist_hits_org ON watchlist_hits(organization_id)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS fraud_alerts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    rule_code text NOT NULL,
    rule_description text NOT NULL,
    severity fraud_severity NOT NULL,
    evidence text,
    related_borrower_ids text[] DEFAULT ARRAY[]::TEXT[],
    status fraud_review_status NOT NULL DEFAULT 'open',
    assigned_to varchar REFERENCES users(id),
    reviewed_by varchar REFERENCES users(id),
    review_notes text,
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now(),
    resolved_at timestamp
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_fraud_alerts_borrower ON fraud_alerts(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_fraud_alerts_org ON fraud_alerts(organization_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_fraud_alerts_assigned ON fraud_alerts(assigned_to)`);

  console.log('[NewTables] Migration complete');
}
