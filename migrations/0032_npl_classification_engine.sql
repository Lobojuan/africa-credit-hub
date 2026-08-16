-- NPL Classification Engine & Migration Tracker
--
-- Additive, idempotent production migration. The column types mirror
-- shared/schema.ts and the indexes support the classification and portfolio
-- queries used by the application.

CREATE TABLE IF NOT EXISTS credit_account_classifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  days_in_arrears integer NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  account_status text NOT NULL,
  asset_classification text,
  ifrs9_stage text NOT NULL,
  ifrs9_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  npl_stage text NOT NULL,
  npl_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  provision_amount numeric(15,2) NOT NULL DEFAULT 0,
  provision_rate numeric(5,4) NOT NULL DEFAULT 0,
  collection_triggered boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),
  classified_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE credit_account_classifications
  ADD COLUMN IF NOT EXISTS collection_assignment_id varchar REFERENCES collection_assignments(id);

CREATE UNIQUE INDEX IF NOT EXISTS credit_account_classifications_account_day_idx
  ON credit_account_classifications (credit_account_id, (classified_at::date));
CREATE INDEX IF NOT EXISTS credit_account_classifications_account_idx
  ON credit_account_classifications (credit_account_id, classified_at DESC);
CREATE INDEX IF NOT EXISTS credit_account_classifications_scope_idx
  ON credit_account_classifications (organization_id, country, classified_at DESC);
CREATE INDEX IF NOT EXISTS credit_account_classifications_stage_idx
  ON credit_account_classifications (ifrs9_stage, npl_stage, classified_at DESC);

CREATE TABLE IF NOT EXISTS npl_migrations (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  from_ifrs9_stage text NOT NULL,
  to_ifrs9_stage text NOT NULL,
  from_npl_stage text NOT NULL,
  to_npl_stage text NOT NULL,
  balance_at_migration numeric(15,2) NOT NULL DEFAULT 0,
  provision_before numeric(15,2) NOT NULL DEFAULT 0,
  provision_after numeric(15,2) NOT NULL DEFAULT 0,
  days_in_arrears_before integer NOT NULL DEFAULT 0,
  days_in_arrears_after integer NOT NULL DEFAULT 0,
  triggered_collection boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),
  migrated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS npl_migrations_account_idx
  ON npl_migrations (credit_account_id, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_scope_idx
  ON npl_migrations (organization_id, country, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_from_to_idx
  ON npl_migrations (from_ifrs9_stage, to_ifrs9_stage, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_npl_from_to_idx
  ON npl_migrations (from_npl_stage, to_npl_stage, migrated_at DESC);

CREATE TABLE IF NOT EXISTS npl_portfolio_summaries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  summary_date text NOT NULL,
  gross_loan_exposure numeric(15,2) NOT NULL DEFAULT 0,
  npl_exposure numeric(15,2) NOT NULL DEFAULT 0,
  watchlist_exposure numeric(15,2) NOT NULL DEFAULT 0,
  substandard_exposure numeric(15,2) NOT NULL DEFAULT 0,
  doubtful_exposure numeric(15,2) NOT NULL DEFAULT 0,
  loss_exposure numeric(15,2) NOT NULL DEFAULT 0,
  total_facilities integer NOT NULL DEFAULT 0,
  npl_facilities integer NOT NULL DEFAULT 0,
  watchlist_facilities integer NOT NULL DEFAULT 0,
  npl_ratio numeric(5,4) NOT NULL DEFAULT 0,
  watchlist_ratio numeric(5,4) NOT NULL DEFAULT 0,
  coverage_ratio numeric(5,4) NOT NULL DEFAULT 0,
  provision_ratio numeric(5,4) NOT NULL DEFAULT 0,
  stage_1_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_2_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_3_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_1_provision numeric(15,2) NOT NULL DEFAULT 0,
  stage_2_provision numeric(15,2) NOT NULL DEFAULT 0,
  stage_3_provision numeric(15,2) NOT NULL DEFAULT 0,
  inflows_stage_1_to_2 integer NOT NULL DEFAULT 0,
  inflows_stage_2_to_3 integer NOT NULL DEFAULT 0,
  cures_stage_3_to_2 integer NOT NULL DEFAULT 0,
  cures_stage_2_to_1 integer NOT NULL DEFAULT 0,
  write_offs integer NOT NULL DEFAULT 0,
  npl_assigned_to_collection integer NOT NULL DEFAULT 0,
  npl_not_assigned integer NOT NULL DEFAULT 0,
  generated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS npl_portfolio_summaries_scope_day_idx
  ON npl_portfolio_summaries (organization_id, country, summary_date);
CREATE INDEX IF NOT EXISTS npl_portfolio_summaries_scope_date_idx
  ON npl_portfolio_summaries (organization_id, country, summary_date DESC);
