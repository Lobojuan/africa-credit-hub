-- Migration: NPL Recovery Priority Ranking Engine
-- Adds recovery_priority columns to npl_cases and creates the audit event table

ALTER TABLE npl_cases
  ADD COLUMN IF NOT EXISTS recovery_priority_score integer
    CHECK (recovery_priority_score >= 0 AND recovery_priority_score <= 100),
  ADD COLUMN IF NOT EXISTS recovery_priority_band text
    CHECK (recovery_priority_band IN ('high', 'medium', 'low', 'legal-track')),
  ADD COLUMN IF NOT EXISTS recovery_priority_calculated_at timestamp;

CREATE TABLE IF NOT EXISTS npl_case_priority_events (
  id                varchar   PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           varchar   NOT NULL REFERENCES npl_cases(id) ON DELETE RESTRICT,
  score             integer   NOT NULL CHECK (score >= 0 AND score <= 100),
  band              text      NOT NULL CHECK (band IN ('high', 'medium', 'low', 'legal-track')),
  factor_breakdown  jsonb     NOT NULL,
  calculated_by     varchar   NOT NULL REFERENCES users(id),
  calculated_at     timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_npl_case_priority_events_case_id
  ON npl_case_priority_events (case_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_npl_cases_priority_band
  ON npl_cases (recovery_priority_band)
  WHERE recovery_priority_band IS NOT NULL;
