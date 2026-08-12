CREATE TABLE IF NOT EXISTS bank_mapping_profiles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  country text NOT NULL,
  name text NOT NULL,
  bank_name text NOT NULL,
  source_system text NOT NULL,
  version text NOT NULL,
  field_mappings jsonb NOT NULL,
  validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'retired')),
  created_by varchar NOT NULL REFERENCES users(id),
  reviewed_by varchar REFERENCES users(id),
  review_notes text,
  reviewed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_mapping_profiles_org_country_name_version_idx
  ON bank_mapping_profiles (organization_id, country, name, version);
CREATE INDEX IF NOT EXISTS bank_mapping_profiles_scope_status_idx
  ON bank_mapping_profiles (organization_id, country, status);

CREATE TABLE IF NOT EXISTS loan_tape_imports (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_profile_id varchar NOT NULL REFERENCES bank_mapping_profiles(id),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  country text NOT NULL,
  reporting_date text NOT NULL,
  original_filename text NOT NULL,
  source_sha256 text NOT NULL,
  status text NOT NULL DEFAULT 'validating' CHECK (status IN ('validating', 'blocked', 'ready', 'failed')),
  total_records integer NOT NULL DEFAULT 0 CHECK (total_records >= 0),
  clean_records integer NOT NULL DEFAULT 0 CHECK (clean_records >= 0),
  exception_count integer NOT NULL DEFAULT 0 CHECK (exception_count >= 0),
  critical_exception_count integer NOT NULL DEFAULT 0 CHECK (critical_exception_count >= 0),
  submitted_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

CREATE INDEX IF NOT EXISTS loan_tape_imports_scope_created_idx
  ON loan_tape_imports (organization_id, country, created_at DESC);
CREATE INDEX IF NOT EXISTS loan_tape_imports_source_hash_idx
  ON loan_tape_imports (organization_id, source_sha256);

CREATE TABLE IF NOT EXISTS loan_tape_reconciliation_exceptions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id varchar NOT NULL REFERENCES loan_tape_imports(id) ON DELETE CASCADE,
  source_row_number integer NOT NULL CHECK (source_row_number >= 2),
  account_reference text,
  row_fingerprint text NOT NULL,
  exception_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'high', 'critical')),
  field_name text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'waived')),
  resolution_note text,
  resolved_by varchar REFERENCES users(id),
  resolved_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loan_tape_exceptions_import_status_idx
  ON loan_tape_reconciliation_exceptions (import_id, status, severity);
CREATE INDEX IF NOT EXISTS loan_tape_exceptions_fingerprint_idx
  ON loan_tape_reconciliation_exceptions (row_fingerprint);
