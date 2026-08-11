ALTER TABLE npl_case_events
  DROP CONSTRAINT IF EXISTS npl_case_events_event_type_check;

ALTER TABLE npl_case_events
  ADD CONSTRAINT npl_case_events_event_type_check CHECK (event_type IN (
    'case_opened', 'npl_inflow_observed', 'cash_recovery_observed', 'legal_recovery_observed',
    'workflow_stage_changed', 'collection_activity_linked', 'decision_submitted',
    'decision_approved', 'decision_rejected', 'decision_execution_recorded', 'note'
  ));

CREATE TABLE IF NOT EXISTS npl_decision_proposals (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id varchar NOT NULL REFERENCES npl_cases(id) ON DELETE RESTRICT,
  decision_type text NOT NULL CHECK (decision_type IN ('restructure', 'cure_reage', 'write_off')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'execution_recorded')),
  proposed_amount numeric(15,2) CHECK (proposed_amount > 0),
  effective_date text NOT NULL,
  rationale text NOT NULL,
  policy_reference text NOT NULL,
  evidence_reference text NOT NULL,
  requested_by varchar NOT NULL REFERENCES users(id),
  reviewed_by varchar REFERENCES users(id),
  review_notes text,
  reviewed_at timestamp,
  execution_evidence_reference text,
  execution_notes text,
  executed_by varchar REFERENCES users(id),
  executed_at timestamp,
  organization_id varchar REFERENCES organizations(id),
  country text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CHECK (decision_type <> 'write_off' OR proposed_amount IS NOT NULL),
  CHECK (decision_type <> 'cure_reage' OR proposed_amount IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS npl_decision_proposals_one_pending_idx
  ON npl_decision_proposals (case_id, decision_type) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS npl_decision_proposals_scope_status_idx
  ON npl_decision_proposals (organization_id, country, status, created_at DESC);
