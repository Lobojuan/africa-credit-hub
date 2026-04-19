-- Affordability & Income Verification Module (Task #28)
-- Creates enums and tables for income sources, expense categorisations, and affordability assessments.

DO $$ BEGIN
  CREATE TYPE income_source_type AS ENUM (
    'salary', 'business_income', 'government_benefit', 'remittance', 'rental',
    'investment', 'pension', 'freelance', 'momo_inflow', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'rent', 'utilities', 'food', 'transport', 'debt_servicing', 'education',
    'healthcare', 'telecom', 'discretionary', 'transfers_out', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE affordability_data_source AS ENUM (
    'open_banking', 'bank_statement_pdf', 'momo_only', 'self_declared', 'hybrid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS income_sources (
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
);

CREATE TABLE IF NOT EXISTS expense_categorisations (
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
);

CREATE TABLE IF NOT EXISTS affordability_assessments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  country text,
  currency text NOT NULL DEFAULT 'GHS',
  data_source affordability_data_source NOT NULL,
  period_days integer NOT NULL DEFAULT 90,
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
);

CREATE INDEX IF NOT EXISTS idx_income_sources_borrower ON income_sources(borrower_id);
CREATE INDEX IF NOT EXISTS idx_expense_cat_borrower ON expense_categorisations(borrower_id);
CREATE INDEX IF NOT EXISTS idx_afford_borrower ON affordability_assessments(borrower_id);
CREATE INDEX IF NOT EXISTS idx_afford_org ON affordability_assessments(organization_id);
