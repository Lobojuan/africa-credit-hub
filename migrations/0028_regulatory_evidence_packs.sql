DO $$ BEGIN
  CREATE TYPE regulatory_evidence_pack_status AS ENUM ('ready_for_review', 'approved', 'rejected', 'submission_recorded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS regulatory_evidence_packs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  country text NOT NULL,
  title text NOT NULL,
  regulator text NOT NULL,
  directive_reference text,
  reporting_period_start text NOT NULL,
  reporting_period_end text NOT NULL,
  due_date text NOT NULL,
  evidence_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  status regulatory_evidence_pack_status NOT NULL DEFAULT 'ready_for_review',
  prepared_by varchar NOT NULL REFERENCES users(id),
  reviewed_by varchar REFERENCES users(id),
  review_notes text,
  reviewed_at timestamp,
  submission_reference text,
  submission_recorded_by varchar REFERENCES users(id),
  submission_recorded_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT regulatory_evidence_packs_period_check CHECK (reporting_period_start <= reporting_period_end)
);

CREATE UNIQUE INDEX IF NOT EXISTS regulatory_evidence_packs_org_title_period_idx
  ON regulatory_evidence_packs (organization_id, title, reporting_period_end);
CREATE INDEX IF NOT EXISTS regulatory_evidence_packs_calendar_idx
  ON regulatory_evidence_packs (organization_id, country, due_date, status);
