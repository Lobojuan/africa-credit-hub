CREATE TABLE IF NOT EXISTS npl_cases (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id varchar NOT NULL REFERENCES credit_accounts(id),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  collection_assignment_id varchar REFERENCES collection_assignments(id),
  stage text NOT NULL CHECK (stage IN ('watchlist', 'npl', 'workout', 'legal', 'resolved')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  baseline_exposure numeric(15,2) NOT NULL CHECK (baseline_exposure >= 0),
  current_exposure numeric(15,2) NOT NULL CHECK (current_exposure >= 0),
  currency text NOT NULL,
  owner_id varchar REFERENCES users(id),
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  created_by varchar NOT NULL REFERENCES users(id),
  opened_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS npl_cases_credit_account_idx ON npl_cases (credit_account_id);
CREATE INDEX IF NOT EXISTS npl_cases_scope_status_idx ON npl_cases (organization_id, country, status, stage);

CREATE TABLE IF NOT EXISTS npl_case_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id varchar NOT NULL REFERENCES npl_cases(id) ON DELETE RESTRICT,
  sequence integer NOT NULL CHECK (sequence >= 1),
  event_type text NOT NULL CHECK (event_type IN (
    'case_opened', 'npl_inflow_observed', 'cash_recovery_observed', 'legal_recovery_observed',
    'workflow_stage_changed', 'collection_activity_linked', 'note'
  )),
  event_date text NOT NULL,
  amount numeric(15,2),
  exposure_before numeric(15,2) NOT NULL CHECK (exposure_before >= 0),
  exposure_after numeric(15,2) NOT NULL CHECK (exposure_after >= 0),
  stage_before text NOT NULL,
  stage_after text NOT NULL,
  evidence_reference text,
  notes text NOT NULL,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS npl_case_events_case_sequence_idx ON npl_case_events (case_id, sequence);
CREATE INDEX IF NOT EXISTS npl_case_events_date_type_idx ON npl_case_events (event_date, event_type);

CREATE OR REPLACE FUNCTION prevent_npl_case_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'npl_case_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS npl_case_events_immutable ON npl_case_events;
CREATE TRIGGER npl_case_events_immutable
  BEFORE UPDATE OR DELETE ON npl_case_events
  FOR EACH ROW EXECUTE FUNCTION prevent_npl_case_event_mutation();
