-- NPL Classification Engine & Migration Tracker
-- ==============================================
--
-- Tracks automated IFRS 9 stage classifications and NPL migrations
-- for every credit_account over time. This is the data foundation
-- for regulatory reporting, provision calculations, and collection
-- workflow triggers.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Automated classification snapshots
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_account_classifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,

  -- Input fields at time of classification
  days_in_arrears integer NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  account_status text NOT NULL,
  asset_classification text,

  -- IFRS 9 stage
  ifrs9_stage text NOT NULL CHECK (ifrs9_stage IN ('stage_1', 'stage_2', 'stage_3')),
  ifrs9_reasons text[] NOT NULL DEFAULT '{}',

  -- NPL stage (Bank of Ghana / regulatory view)
  npl_stage text NOT NULL CHECK (npl_stage IN ('performing', 'watchlist', 'substandard', 'doubtful', 'loss')),
  npl_reasons text[] NOT NULL DEFAULT '{}',

  -- Provision snapshot
  provision_amount numeric(15,2) NOT NULL DEFAULT 0,
  provision_rate numeric(5,4) NOT NULL DEFAULT 0, -- e.g. 0.0125 = 1.25%

  -- Collection trigger
  collection_triggered boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),

  -- Audit
  classified_at timestamp NOT NULL DEFAULT now(),
  classified_by text NOT NULL DEFAULT 'system', -- 'system' for automated, user_id for manual override

  -- Unique constraint: one automated classification per account per day
  UNIQUE (credit_account_id, classified_at::date)
);

CREATE INDEX IF NOT EXISTS credit_account_classifications_account_idx
  ON credit_account_classifications (credit_account_id, classified_at DESC);
CREATE INDEX IF NOT EXISTS credit_account_classifications_scope_idx
  ON credit_account_classifications (organization_id, country, classified_at DESC);
CREATE INDEX IF NOT EXISTS credit_account_classifications_stage_idx
  ON credit_account_classifications (ifrs9_stage, npl_stage, classified_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NPL Migration Matrix tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npl_migrations (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,

  -- From / To stages
  from_ifrs9_stage text NOT NULL CHECK (from_ifrs9_stage IN ('stage_1', 'stage_2', 'stage_3')),
  to_ifrs9_stage text NOT NULL CHECK (to_ifrs9_stage IN ('stage_1', 'stage_2', 'stage_3')),
  from_npl_stage text NOT NULL CHECK (from_npl_stage IN ('performing', 'watchlist', 'substandard', 'doubtful', 'loss')),
  to_npl_stage text NOT NULL CHECK (to_npl_stage IN ('performing', 'watchlist', 'substandard', 'doubtful', 'loss')),

  -- Financial impact
  balance_at_migration numeric(15,2) NOT NULL DEFAULT 0,
  provision_before numeric(15,2) NOT NULL DEFAULT 0,
  provision_after numeric(15,2) NOT NULL DEFAULT 0,

  -- Days in arrears context
  days_in_arrears_before integer NOT NULL DEFAULT 0,
  days_in_arrears_after integer NOT NULL DEFAULT 0,

  -- Trigger info
  triggered_collection boolean NOT NULL DEFAULT false,
  collection_assignment_id varchar REFERENCES collection_assignments(id),

  -- Timing
  migrated_at timestamp NOT NULL DEFAULT now(),
  days_in_previous_stage integer GENERATED ALWAYS AS (
    CASE
      WHEN from_ifrs9_stage = to_ifrs9_stage THEN 0
      ELSE EXTRACT(DAY FROM migrated_at - LAG(migrated_at) OVER (PARTITION BY credit_account_id ORDER BY migrated_at))
    END
  ) STORED,

  -- Audit
  detected_by text NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS npl_migrations_account_idx ON npl_migrations (credit_account_id, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_scope_idx ON npl_migrations (organization_id, country, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_from_to_idx ON npl_migrations (from_ifrs9_stage, to_ifrs9_stage, migrated_at DESC);
CREATE INDEX IF NOT EXISTS npl_migrations_npl_from_to_idx ON npl_migrations (from_npl_stage, to_npl_stage, migrated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. NPL Portfolio Summary (materialized view for performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npl_portfolio_summaries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  summary_date date NOT NULL,

  -- Exposure totals
  gross_loan_exposure numeric(15,2) NOT NULL DEFAULT 0,
  npl_exposure numeric(15,2) NOT NULL DEFAULT 0,
  watchlist_exposure numeric(15,2) NOT NULL DEFAULT 0,
  substandard_exposure numeric(15,2) NOT NULL DEFAULT 0,
  doubtful_exposure numeric(15,2) NOT NULL DEFAULT 0,
  loss_exposure numeric(15,2) NOT NULL DEFAULT 0,

  -- Facility counts
  total_facilities integer NOT NULL DEFAULT 0,
  npl_facilities integer NOT NULL DEFAULT 0,
  watchlist_facilities integer NOT NULL DEFAULT 0,

  -- Ratios
  npl_ratio numeric(5,4) NOT NULL DEFAULT 0,           -- NPL / Gross Loans
  watchlist_ratio numeric(5,4) NOT NULL DEFAULT 0,    -- Watchlist / Gross Loans
  coverage_ratio numeric(5,4) NOT NULL DEFAULT 0,     -- Provisions / NPL
  provision_ratio numeric(5,4) NOT NULL DEFAULT 0,    -- Total Provisions / Gross Loans

  -- IFRS 9 breakdown
  stage_1_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_2_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_3_exposure numeric(15,2) NOT NULL DEFAULT 0,
  stage_1_provision numeric(15,2) NOT NULL DEFAULT 0,
  stage_2_provision numeric(15,2) NOT NULL DEFAULT 0,
  stage_3_provision numeric(15,2) NOT NULL DEFAULT 0,

  -- Migration flows (last 30 days)
  inflows_stage_1_to_2 integer NOT NULL DEFAULT 0,
  inflows_stage_2_to_3 integer NOT NULL DEFAULT 0,
  cures_stage_3_to_2 integer NOT NULL DEFAULT 0,
  cures_stage_2_to_1 integer NOT NULL DEFAULT 0,
  write_offs integer NOT NULL DEFAULT 0,

  -- Collection status
  npl_assigned_to_collection integer NOT NULL DEFAULT 0,
  npl_not_assigned integer NOT NULL DEFAULT 0,

  generated_at timestamp NOT NULL DEFAULT now(),

  UNIQUE (organization_id, country, summary_date)
);

CREATE INDEX IF NOT EXISTS npl_portfolio_summaries_scope_date_idx
  ON npl_portfolio_summaries (organization_id, country, summary_date DESC);
