DO $$ BEGIN
  CREATE TYPE transaction_fraud_action AS ENUM ('allow', 'step_up_authentication', 'hold_for_review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS transaction_fraud_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  transaction_reference text NOT NULL,
  channel text NOT NULL,
  amount numeric(18,2) NOT NULL,
  currency text NOT NULL,
  new_beneficiary boolean NOT NULL DEFAULT false,
  device_changed boolean NOT NULL DEFAULT false,
  unusual_location boolean NOT NULL DEFAULT false,
  failed_attempts integer NOT NULL DEFAULT 0,
  risk_score integer NOT NULL,
  action transaction_fraud_action NOT NULL,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS transaction_fraud_events_org_reference_idx
  ON transaction_fraud_events (organization_id, transaction_reference);
CREATE INDEX IF NOT EXISTS transaction_fraud_events_monitor_idx
  ON transaction_fraud_events (organization_id, country, created_at DESC);
