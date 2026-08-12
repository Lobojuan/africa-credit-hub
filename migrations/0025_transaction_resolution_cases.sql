DO $$ BEGIN
  CREATE TYPE transaction_resolution_case_type AS ENUM ('failed_transfer', 'double_debit', 'cash_dispense', 'account_freeze');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_resolution_status AS ENUM ('new', 'verifying', 'ready_for_core_handoff', 'confirmed_resolved', 'needs_human', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS transaction_resolution_cases (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  transaction_reference text NOT NULL,
  case_type transaction_resolution_case_type NOT NULL,
  channel text NOT NULL DEFAULT 'unknown',
  amount numeric(18,2),
  currency text,
  customer_message text,
  status transaction_resolution_status NOT NULL DEFAULT 'new',
  resolution_notes text,
  sla_deadline timestamp NOT NULL,
  reviewed_by varchar REFERENCES users(id),
  resolved_at timestamp,
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS transaction_resolution_cases_org_reference_idx
  ON transaction_resolution_cases (organization_id, transaction_reference);
CREATE INDEX IF NOT EXISTS transaction_resolution_cases_queue_idx
  ON transaction_resolution_cases (organization_id, country, status, sla_deadline);
