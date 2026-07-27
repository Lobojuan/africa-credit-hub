DO $$ BEGIN
  CREATE TYPE prudential_snapshot_status AS ENUM ('submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS prudential_snapshots (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  country text NOT NULL,
  reporting_date text NOT NULL,
  regulatory_capital numeric(18,2) NOT NULL CHECK (regulatory_capital >= 0),
  risk_weighted_assets numeric(18,2) NOT NULL CHECK (risk_weighted_assets > 0),
  liquid_assets numeric(18,2) NOT NULL CHECK (liquid_assets >= 0),
  net_cash_outflows_30d numeric(18,2) NOT NULL CHECK (net_cash_outflows_30d > 0),
  total_deposits numeric(18,2) NOT NULL CHECK (total_deposits > 0),
  top_20_deposits numeric(18,2) NOT NULL CHECK (top_20_deposits >= 0 AND top_20_deposits <= total_deposits),
  impaired_exposure numeric(18,2) NOT NULL CHECK (impaired_exposure >= 0),
  total_credit_exposure numeric(18,2) NOT NULL CHECK (total_credit_exposure > 0),
  capital_minimum_pct numeric(6,2),
  liquidity_minimum_pct numeric(6,2),
  source_reference text,
  notes text,
  status prudential_snapshot_status NOT NULL DEFAULT 'submitted',
  submitted_by varchar NOT NULL REFERENCES users(id),
  reviewed_by varchar REFERENCES users(id),
  review_notes text,
  reviewed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT prudential_snapshots_capital_minimum_check CHECK (capital_minimum_pct IS NULL OR (capital_minimum_pct >= 0 AND capital_minimum_pct <= 100)),
  CONSTRAINT prudential_snapshots_liquidity_minimum_check CHECK (liquidity_minimum_pct IS NULL OR (liquidity_minimum_pct >= 0 AND liquidity_minimum_pct <= 100))
);

CREATE UNIQUE INDEX IF NOT EXISTS prudential_snapshots_org_country_date_idx
  ON prudential_snapshots (organization_id, country, reporting_date);
CREATE INDEX IF NOT EXISTS prudential_snapshots_radar_idx
  ON prudential_snapshots (organization_id, country, status, reporting_date DESC);
