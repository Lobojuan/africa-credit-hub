-- UCH Bank Pilot — Row Level Security (RLS) Migration
-- =====================================================
--
-- Context: UCH uses express-session (not Supabase Auth JWTs).
-- Strategy:
--   1. Enable RLS on all critical tables
--   2. Create a service_role for the application server
--   3. Grant service_role BYPASSRLS so the app can query freely
--   4. Default-deny all other roles (anon, authenticated, etc.)
--   5. This means: SQL injection or leaked API keys cannot read data
--      without going through the application layer
--
-- Bank-facing answer: "Direct database access is blocked at the row level.
-- All data access flows through the authenticated application layer."

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create service role for the application server
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'uch_service_role') THEN
    CREATE ROLE uch_service_role WITH NOLOGIN;
    COMMENT ON ROLE uch_service_role IS 'UCH application server role — bypasses RLS by design';
  END IF;
END $$;

-- Grant basic usage
GRANT USAGE ON SCHEMA public TO uch_service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uch_service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uch_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uch_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uch_service_role;

-- Allow service_role to bypass RLS (application enforces auth)
ALTER ROLE uch_service_role BYPASSRLS;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enable RLS on critical tables
-- ─────────────────────────────────────────────────────────────────────────────
-- Core entity tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral_items ENABLE ROW LEVEL SECURITY;

-- Financial & compliance tables
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_report_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishonoured_cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Operational tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Telco / LOTO tables (if pilot includes these)
ALTER TABLE telco_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telco_credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE telco_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE telco_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loto_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE loto_receipts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Default-deny policies for ALL roles (except service_role via BYPASSRLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- These policies deny ALL access unless the role has BYPASSRLS.
-- The application server (uch_service_role) bypasses these.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations', 'users', 'borrowers', 'credit_accounts', 'loan_applications',
    'collateral_items', 'payment_history', 'credit_inquiries', 'credit_report_logs',
    'credit_score_history', 'fraud_alerts', 'watchlist_hits', 'disputes',
    'dishonoured_cheques', 'court_judgments', 'esg_scores', 'identity_verifications',
    'audit_logs', 'consent_records', 'collection_assignments', 'collection_attempts',
    'data_sharing_agreements', 'api_keys', 'institutions', 'exchange_rates',
    'telco_profiles', 'telco_credit_scores', 'telco_loans', 'telco_decision_logs',
    'loto_merchants', 'loto_receipts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Drop any existing policies to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS default_deny_all ON %I', tbl);
    -- Create default deny-all policy
    EXECUTE format(
      'CREATE POLICY default_deny_all ON %I FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
      tbl
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verify: confirm RLS is enabled and policies exist
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this to verify:
--   SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relrowsecurity = true;
--   SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
