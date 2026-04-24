import { sql } from "drizzle-orm";
import { db } from "./db";

export async function migrateNewTables() {
  // Ensure registry_authority enum value exists — idempotent (DO NOTHING if already present)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE organization_type ADD VALUE IF NOT EXISTS 'registry_authority';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

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

  // Tracing & Skip-Tracing module (Task #29)
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE contact_event_type AS ENUM ('phone','email','address','postal_address','employer','employer_address','bank_account','mobile_money','other_id');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE asset_trace_type AS ENUM ('vehicle','property','watercraft','aircraft');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE asset_trace_status AS ENUM ('found','not_found','error','stub');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE collection_status AS ENUM ('open','in_progress','promised','resolved','closed');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE collection_priority AS ENUM ('low','medium','high','urgent');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE collection_channel AS ENUM ('phone','sms','email','visit','letter','note');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await db.execute(sql`DO $$ BEGIN
    CREATE TYPE collection_outcome AS ENUM ('contacted','no_answer','wrong_number','promise_to_pay','refused','left_message','callback_requested','paid','note');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS contact_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    contact_type contact_event_type NOT NULL,
    value text NOT NULL,
    value_normalized text NOT NULL,
    source text NOT NULL DEFAULT 'borrower_update',
    first_seen timestamp NOT NULL DEFAULT now(),
    last_seen timestamp NOT NULL DEFAULT now(),
    occurrences integer NOT NULL DEFAULT 1,
    organization_id varchar REFERENCES organizations(id),
    country text,
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`ALTER TABLE contact_events ADD COLUMN IF NOT EXISTS source_ref text`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_events_borrower ON contact_events(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_events_norm ON contact_events(contact_type, value_normalized)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_events_country ON contact_events(country)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS link_clusters (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    link_type text NOT NULL,
    link_value_hash text NOT NULL,
    link_value_display text NOT NULL,
    member_borrower_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
    member_count integer NOT NULL DEFAULT 0,
    confidence decimal(4,2) NOT NULL DEFAULT 0.50,
    country text,
    last_recomputed_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now(),
    UNIQUE(link_type, link_value_hash, country)
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_link_clusters_country ON link_clusters(country)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_link_clusters_type ON link_clusters(link_type)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS asset_trace_records (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    asset_type asset_trace_type NOT NULL,
    provider text NOT NULL,
    reference text,
    description text,
    estimated_value decimal(15,2),
    currency text,
    status asset_trace_status NOT NULL DEFAULT 'stub',
    raw_response jsonb,
    requested_by varchar REFERENCES users(id),
    organization_id varchar REFERENCES organizations(id),
    country text,
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asset_trace_borrower ON asset_trace_records(borrower_id)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS collection_assignments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    credit_account_id varchar REFERENCES credit_accounts(id),
    assigned_to varchar REFERENCES users(id),
    status collection_status NOT NULL DEFAULT 'open',
    priority collection_priority NOT NULL DEFAULT 'medium',
    amount_outstanding decimal(15,2),
    currency text,
    due_date text,
    notes text,
    organization_id varchar REFERENCES organizations(id),
    country text,
    created_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_collections_borrower ON collection_assignments(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_collections_assigned ON collection_assignments(assigned_to)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_collections_status ON collection_assignments(status)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS collection_attempts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id varchar NOT NULL REFERENCES collection_assignments(id),
    channel collection_channel NOT NULL,
    outcome collection_outcome NOT NULL,
    contact_value text,
    notes text,
    promised_amount decimal(15,2),
    promised_date text,
    attempted_by varchar REFERENCES users(id),
    attempted_at timestamp NOT NULL DEFAULT now(),
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON collection_attempts(assignment_id)`);

  // Affordability & Income Verification (Task #28)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE income_source_type AS ENUM (
        'salary','business_income','government_benefit','remittance','rental',
        'investment','pension','freelance','momo_inflow','other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE expense_category AS ENUM (
        'rent','utilities','food','transport','debt_servicing','education',
        'healthcare','telecom','discretionary','transfers_out','other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE affordability_data_source AS ENUM (
        'open_banking','bank_statement_pdf','momo_only','self_declared','hybrid'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS income_sources (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    source_type income_source_type NOT NULL,
    description text,
    amount_monthly numeric(15,2) NOT NULL,
    currency text NOT NULL DEFAULT 'GHS',
    frequency text NOT NULL DEFAULT 'monthly',
    confidence numeric(5,2) NOT NULL DEFAULT 0,
    evidence_type text,
    evidence_ref text,
    detected_from text,
    verified_at timestamp,
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS expense_categorisations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    category expense_category NOT NULL,
    amount_monthly numeric(15,2) NOT NULL,
    currency text NOT NULL DEFAULT 'GHS',
    period_days integer NOT NULL DEFAULT 90,
    source text NOT NULL,
    detail text,
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS affordability_assessments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    country text,
    currency text NOT NULL DEFAULT 'GHS',
    data_source affordability_data_source NOT NULL,
    period_days integer NOT NULL DEFAULT 90,
    version integer NOT NULL DEFAULT 1,
    gross_income_monthly numeric(15,2) NOT NULL DEFAULT 0,
    total_expenses_monthly numeric(15,2) NOT NULL DEFAULT 0,
    existing_debt_service_monthly numeric(15,2) NOT NULL DEFAULT 0,
    disposable_income_monthly numeric(15,2) NOT NULL DEFAULT 0,
    debt_to_income_ratio numeric(6,4) NOT NULL DEFAULT 0,
    max_recommended_new_credit numeric(15,2) NOT NULL DEFAULT 0,
    max_recommended_monthly_repayment numeric(15,2) NOT NULL DEFAULT 0,
    affordability_rating text NOT NULL DEFAULT 'unknown',
    confidence_label text NOT NULL DEFAULT 'low',
    regulatory_rule text,
    inputs_snapshot jsonb,
    outputs_snapshot jsonb,
    computed_by varchar REFERENCES users(id),
    expires_at timestamp,
    organization_id varchar REFERENCES organizations(id),
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_income_sources_borrower ON income_sources(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_expense_cat_borrower ON expense_categorisations(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_afford_borrower ON affordability_assessments(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_afford_org ON affordability_assessments(organization_id)`);
  // Idempotent backfill: add version column to existing tables created before schema update
  await db.execute(sql`ALTER TABLE affordability_assessments ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1`);

  // Linked open-banking accounts — persisted account linkage per borrower
  // Created as part of Task #28 Affordability Module (open-banking link lifecycle)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS linked_open_banking_accounts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    provider text NOT NULL,
    account_id text NOT NULL,
    account_holder_name text,
    bank_name text,
    currency text,
    status text NOT NULL DEFAULT 'active',
    linked_at timestamp DEFAULT now() NOT NULL,
    revoked_at timestamp,
    meta jsonb
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_linked_ob_accounts_borrower ON linked_open_banking_accounts(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_linked_ob_accounts_status ON linked_open_banking_accounts(borrower_id, status)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS collection_sla_settings (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id varchar REFERENCES organizations(id),
    country text NOT NULL,
    segment text,
    urgent_threshold_days integer NOT NULL DEFAULT 3,
    high_threshold_days integer NOT NULL DEFAULT 5,
    medium_threshold_days integer NOT NULL DEFAULT 7,
    low_threshold_days integer NOT NULL DEFAULT 14,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`);

  await db.execute(sql`ALTER TABLE collection_sla_settings ADD COLUMN IF NOT EXISTS segment text`);

  await db.execute(sql`DROP INDEX IF EXISTS idx_collection_sla_org_country`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_sla_org_country_seg
    ON collection_sla_settings(COALESCE(organization_id,''), country, COALESCE(segment,''))`);

  await db.execute(sql`ALTER TABLE collection_assignments ADD COLUMN IF NOT EXISTS segment text`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS xds_bureau_queries (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id varchar NOT NULL,
    requested_by varchar REFERENCES users(id),
    organization_id varchar,
    purpose varchar(100) NOT NULL,
    request_ref varchar(100) NOT NULL,
    ghana_card varchar(50),
    ssnit_number varchar(50),
    tin_number varchar(50),
    xds_ref varchar(100),
    found boolean,
    credit_score integer,
    score_category varchar(20),
    source varchar(20) DEFAULT 'sandbox',
    response_data jsonb,
    error_message text,
    created_at timestamp DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_xds_queries_borrower ON xds_bureau_queries(borrower_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_xds_queries_requested_by ON xds_bureau_queries(requested_by)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS registry_credentials (
    provider text PRIMARY KEY,
    api_url text NOT NULL,
    api_key_encrypted text NOT NULL,
    updated_at timestamp DEFAULT now(),
    updated_by text
  )`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS registry_health_config (
    id text PRIMARY KEY DEFAULT 'default',
    alert_email text,
    slack_webhook_url text,
    check_interval_minutes integer NOT NULL DEFAULT 15,
    retention_days integer,
    updated_at timestamp DEFAULT now(),
    updated_by varchar REFERENCES users(id)
  )`);
  await db.execute(sql`ALTER TABLE registry_health_config ADD COLUMN IF NOT EXISTS retention_days integer`);

  // Registry health event history — persisted probe results (Task #82)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS registry_health_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    status text NOT NULL,
    latency_ms integer,
    error text,
    checked_at timestamp DEFAULT now() NOT NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_registry_health_events_provider_time
    ON registry_health_events(provider, checked_at DESC)`);

  await db.execute(sql`ALTER TABLE registry_health_config ADD COLUMN IF NOT EXISTS cleanup_time_utc text`);
  // Configurable critical-failure thresholds on registry health config (Task #103)
  await db.execute(sql`ALTER TABLE registry_health_config ADD COLUMN IF NOT EXISTS critical_fail_7d integer NOT NULL DEFAULT 5`);
  await db.execute(sql`ALTER TABLE registry_health_config ADD COLUMN IF NOT EXISTS critical_streak_30d integer NOT NULL DEFAULT 5`);

  // Per-registry severity threshold overrides (Task #117)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS registry_threshold_overrides (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL UNIQUE,
    critical_fail_7d integer,
    critical_streak_30d integer,
    updated_at timestamp DEFAULT now(),
    updated_by varchar REFERENCES users(id)
  )`);

  // Loan Origination workflow
  await db.execute(sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_application_status') THEN
      CREATE TYPE loan_application_status AS ENUM ('draft','submitted','under_review','approved','rejected','disbursed','withdrawn');
    END IF;
  END $$`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS loan_applications (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number varchar NOT NULL UNIQUE,
    borrower_id varchar NOT NULL REFERENCES borrowers(id),
    organization_id varchar NOT NULL REFERENCES organizations(id),
    loan_type text NOT NULL,
    purpose text NOT NULL,
    requested_amount decimal(15,2) NOT NULL,
    approved_amount decimal(15,2),
    currency text NOT NULL DEFAULT 'GHS',
    term_months integer NOT NULL,
    interest_rate decimal(6,4),
    repayment_frequency text NOT NULL DEFAULT 'monthly',
    collateral_type text,
    collateral_description text,
    collateral_value decimal(15,2),
    status loan_application_status NOT NULL DEFAULT 'draft',
    credit_score_at_application integer,
    notes text,
    maker_user_id varchar REFERENCES users(id),
    checker_user_id varchar REFERENCES users(id),
    checker_action text,
    checker_notes text,
    checked_at timestamp,
    disbursed_at timestamp,
    disbursement_reference varchar,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS loan_repayment_schedules (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_application_id varchar NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    installment_number integer NOT NULL,
    due_date text NOT NULL,
    principal_amount decimal(15,2) NOT NULL,
    interest_amount decimal(15,2) NOT NULL,
    total_amount decimal(15,2) NOT NULL,
    paid_amount decimal(15,2) NOT NULL DEFAULT 0,
    paid_at timestamp,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT now()
  )`);

  // Collateral Registry
  await db.execute(sql`CREATE TABLE IF NOT EXISTS collateral_items (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number varchar NOT NULL UNIQUE,
    borrower_id varchar REFERENCES borrowers(id),
    loan_application_id varchar REFERENCES loan_applications(id),
    collateral_type text NOT NULL,
    description text NOT NULL,
    estimated_value decimal(15,2) NOT NULL,
    currency text NOT NULL DEFAULT 'GHS',
    location text,
    registration_date text NOT NULL,
    expiry_date text,
    status text NOT NULL DEFAULT 'active',
    lender_organization_id varchar NOT NULL REFERENCES organizations(id),
    document_reference text,
    notes text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);
  // Make borrower_id nullable if it was created as NOT NULL (idempotent)
  await db.execute(sql`ALTER TABLE collateral_items ALTER COLUMN borrower_id DROP NOT NULL`).catch(() => {});
  // Pan-African Collateral Registry columns
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS registry_authority_id varchar REFERENCES organizations(id)`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS asset_local_identifier text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS pan_african_asset_id text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS legal_regime text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'`).catch(() => {});
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS approved_by varchar REFERENCES users(id)`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS approval_date text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS rejection_reason text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS certificate_number text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS lien_priority integer`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS enforcement_status text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS discharge_date text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS borrower_name text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS country_code text`);
  // PPSR-inspired columns
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS is_pmsi boolean NOT NULL DEFAULT false`).catch(() => {});
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS security_interest_type text NOT NULL DEFAULT 'loan_security'`).catch(() => {});
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS collateral_class text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS financing_duration text NOT NULL DEFAULT 'custom'`).catch(() => {});
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS debtor_type text NOT NULL DEFAULT 'individual'`).catch(() => {});
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS verification_code text`);
  // grantorNationalId: stores the borrower/grantor's government-issued national ID for audit/search
  // Placed here — after CREATE TABLE collateral_items — to be safe in fresh environments
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS grantor_national_id text`);
  await db.execute(sql`ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS resubmitted_from_id varchar REFERENCES collateral_items(id)`);

  // Registry Country Config — 54 African countries
  await db.execute(sql`CREATE TABLE IF NOT EXISTS registry_country_config (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text NOT NULL UNIQUE,
    country_name text NOT NULL,
    authority_name text NOT NULL,
    legal_regime text NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    is_live boolean NOT NULL DEFAULT false,
    registry_authority_org_id varchar REFERENCES organizations(id),
    required_fields_json text,
    created_at timestamp NOT NULL DEFAULT now()
  )`);
  // Add required_fields_json if table already existed without it
  await db.execute(sql`ALTER TABLE registry_country_config ADD COLUMN IF NOT EXISTS required_fields_json text`);

  // Institution Branding
  await db.execute(sql`CREATE TABLE IF NOT EXISTS institution_branding (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id varchar NOT NULL UNIQUE REFERENCES organizations(id),
    primary_color text DEFAULT '#6366f1',
    secondary_color text DEFAULT '#8b5cf6',
    logo_url text,
    tagline text,
    support_email text,
    support_phone text,
    footer_text text,
    custom_domain text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);

  // Soft Pull — add columns to credit_inquiries
  await db.execute(sql`ALTER TABLE credit_inquiries ADD COLUMN IF NOT EXISTS is_soft_pull boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE credit_inquiries ADD COLUMN IF NOT EXISTS soft_pull_result jsonb`);

  // Portfolio Trigger Subscriptions
  await db.execute(sql`CREATE TABLE IF NOT EXISTS portfolio_trigger_subscriptions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    borrower_id varchar NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    trigger_types text[] NOT NULL DEFAULT ARRAY['new_inquiry','new_account','status_change','score_drop','new_judgment','late_payment'],
    webhook_url text,
    status text NOT NULL DEFAULT 'active',
    label text,
    created_by varchar REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(organization_id, borrower_id)
  )`);

  // Portfolio Trigger Events
  await db.execute(sql`CREATE TABLE IF NOT EXISTS portfolio_trigger_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id varchar NOT NULL REFERENCES portfolio_trigger_subscriptions(id) ON DELETE CASCADE,
    organization_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    borrower_id varchar NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb,
    notified_via text[] DEFAULT ARRAY[]::text[],
    webhook_status text,
    acknowledged_at timestamp,
    fired_at timestamp NOT NULL DEFAULT now()
  )`);

  // Consumer Monitoring Preferences
  await db.execute(sql`CREATE TABLE IF NOT EXISTS consumer_monitoring_prefs (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_account_id varchar NOT NULL UNIQUE REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    borrower_id varchar REFERENCES borrowers(id) ON DELETE CASCADE,
    alert_score_change boolean NOT NULL DEFAULT true,
    alert_new_inquiry boolean NOT NULL DEFAULT true,
    alert_new_account boolean NOT NULL DEFAULT true,
    alert_dispute_update boolean NOT NULL DEFAULT true,
    alert_late_payment boolean NOT NULL DEFAULT true,
    alert_new_judgment boolean NOT NULL DEFAULT true,
    alert_channel text NOT NULL DEFAULT 'both',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);

  // Consumer Monitoring Alerts
  await db.execute(sql`CREATE TABLE IF NOT EXISTS consumer_monitoring_alerts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_account_id varchar NOT NULL REFERENCES consumer_accounts(id) ON DELETE CASCADE,
    borrower_id varchar REFERENCES borrowers(id) ON DELETE CASCADE,
    alert_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    details jsonb,
    sent_via_sms boolean NOT NULL DEFAULT false,
    sent_via_email boolean NOT NULL DEFAULT false,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamp,
    sent_at timestamp NOT NULL DEFAULT now()
  )`);

  // Collateral Share Log — audit trail for verification link sharing
  await db.execute(sql`CREATE TABLE IF NOT EXISTS collateral_share_log (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    collateral_item_id varchar NOT NULL REFERENCES collateral_items(id) ON DELETE CASCADE,
    channel text NOT NULL,
    masked_recipient text NOT NULL,
    sent_by varchar REFERENCES users(id),
    sent_at timestamp NOT NULL DEFAULT now()
  )`);

  // Collateral Rejection History — immutable log of every rejection event
  await db.execute(sql`CREATE TABLE IF NOT EXISTS collateral_rejection_history (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    collateral_item_id varchar NOT NULL REFERENCES collateral_items(id) ON DELETE CASCADE,
    reason text NOT NULL,
    rejected_by varchar REFERENCES users(id),
    rejected_at timestamp NOT NULL DEFAULT now()
  )`);

  // Backfill: create one history entry for each rejected collateral item that has a
  // rejection_reason but no entry yet in collateral_rejection_history.
  // Uses updated_at as the best available timestamp for when the rejection occurred.
  await db.execute(sql`
    INSERT INTO collateral_rejection_history (id, collateral_item_id, reason, rejected_at)
    SELECT
      gen_random_uuid(),
      ci.id,
      ci.rejection_reason,
      COALESCE(ci.updated_at, NOW())
    FROM collateral_items ci
    WHERE ci.approval_status = 'rejected'
      AND ci.rejection_reason IS NOT NULL
      AND ci.rejection_reason <> ''
      AND NOT EXISTS (
        SELECT 1 FROM collateral_rejection_history crh WHERE crh.collateral_item_id = ci.id
      )
  `);

  // Collateral Amendment Requests — formal amendment workflow for approved liens
  await db.execute(sql`CREATE TABLE IF NOT EXISTS collateral_amendment_requests (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    collateral_item_id varchar NOT NULL REFERENCES collateral_items(id) ON DELETE CASCADE,
    requested_by varchar NOT NULL REFERENCES users(id),
    lender_organization_id varchar NOT NULL REFERENCES organizations(id),
    proposed_changes text NOT NULL,
    amendment_reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    reviewed_by varchar REFERENCES users(id),
    review_notes text,
    reviewed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE collateral_amendment_requests
        ADD CONSTRAINT chk_amendment_status
        CHECK (status IN ('pending', 'approved', 'rejected'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  console.log('[NewTables] Migration complete');
}
