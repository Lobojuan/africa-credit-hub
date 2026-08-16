CREATE TABLE IF NOT EXISTS credit_account_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  days_in_arrears integer NOT NULL DEFAULT 0,
  current_balance decimal(15,2) NOT NULL DEFAULT '0',
  account_status text NOT NULL,
  asset_classification text,
  ifrs9_stage text NOT NULL,
  ifrs9_reasons jsonb NOT NULL DEFAULT '[]',
  npl_stage text NOT NULL,
  npl_reasons jsonb NOT NULL DEFAULT '[]',
  provision_amount decimal(15,2) NOT NULL DEFAULT '0',
  provision_rate decimal(5,4) NOT NULL DEFAULT '0',
  collection_triggered boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),
  classified_at timestamp DEFAULT now() NOT NULL
);

-- Existing pilot databases may already have the table from an earlier draft.
ALTER TABLE credit_account_classifications
  ADD COLUMN IF NOT EXISTS collection_assignment_id varchar REFERENCES collection_assignments(id);

CREATE TABLE IF NOT EXISTS npl_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  from_ifrs9_stage text NOT NULL,
  to_ifrs9_stage text NOT NULL,
  from_npl_stage text NOT NULL,
  to_npl_stage text NOT NULL,
  balance_at_migration decimal(15,2) NOT NULL DEFAULT '0',
  provision_before decimal(15,2) NOT NULL DEFAULT '0',
  provision_after decimal(15,2) NOT NULL DEFAULT '0',
  days_in_arrears_before integer NOT NULL DEFAULT 0,
  days_in_arrears_after integer NOT NULL DEFAULT 0,
  triggered_collection boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),
  migrated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS npl_portfolio_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  summary_date text NOT NULL,
  gross_loan_exposure decimal(15,2) NOT NULL DEFAULT '0',
  npl_exposure decimal(15,2) NOT NULL DEFAULT '0',
  watchlist_exposure decimal(15,2) NOT NULL DEFAULT '0',
  substandard_exposure decimal(15,2) NOT NULL DEFAULT '0',
  doubtful_exposure decimal(15,2) NOT NULL DEFAULT '0',
  loss_exposure decimal(15,2) NOT NULL DEFAULT '0',
  total_facilities integer NOT NULL DEFAULT 0,
  npl_facilities integer NOT NULL DEFAULT 0,
  watchlist_facilities integer NOT NULL DEFAULT 0,
  npl_ratio decimal(5,4) NOT NULL DEFAULT '0',
  watchlist_ratio decimal(5,4) NOT NULL DEFAULT '0',
  coverage_ratio decimal(5,4) NOT NULL DEFAULT '0',
  provision_ratio decimal(5,4) NOT NULL DEFAULT '0',
  stage_1_exposure decimal(15,2) NOT NULL DEFAULT '0',
  stage_2_exposure decimal(15,2) NOT NULL DEFAULT '0',
  stage_3_exposure decimal(15,2) NOT NULL DEFAULT '0',
  stage_1_provision decimal(15,2) NOT NULL DEFAULT '0',
  stage_2_provision decimal(15,2) NOT NULL DEFAULT '0',
  stage_3_provision decimal(15,2) NOT NULL DEFAULT '0',
  inflows_stage_1_to_2 integer NOT NULL DEFAULT 0,
  inflows_stage_2_to_3 integer NOT NULL DEFAULT 0,
  cures_stage_3_to_2 integer NOT NULL DEFAULT 0,
  cures_stage_2_to_1 integer NOT NULL DEFAULT 0,
  write_offs integer NOT NULL DEFAULT 0,
  npl_assigned_to_collection integer NOT NULL DEFAULT 0,
  npl_not_assigned integer NOT NULL DEFAULT 0,
  generated_at timestamp DEFAULT now() NOT NULL
);
