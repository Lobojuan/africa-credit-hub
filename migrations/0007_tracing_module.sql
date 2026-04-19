-- Tracing & Skip-Tracing Module (Task #29)
-- Creates enums and tables for contact events, link clusters, asset tracing, and collections.

DO $$ BEGIN
  CREATE TYPE contact_event_type AS ENUM (
    'phone', 'email', 'address', 'postal_address', 'employer', 'employer_address',
    'bank_account', 'mobile_money', 'other_id'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_trace_type AS ENUM ('vehicle', 'property', 'watercraft', 'aircraft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_trace_status AS ENUM ('found', 'not_found', 'error', 'stub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_status AS ENUM ('open', 'in_progress', 'promised', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_channel AS ENUM ('phone', 'sms', 'email', 'visit', 'letter', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_outcome AS ENUM (
    'contacted', 'no_answer', 'wrong_number', 'promise_to_pay', 'refused',
    'left_message', 'callback_requested', 'paid', 'note'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS contact_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  contact_type contact_event_type NOT NULL,
  value text NOT NULL,
  value_normalized text NOT NULL,
  source text NOT NULL DEFAULT 'borrower_update',
  source_ref text,
  first_seen timestamp DEFAULT now() NOT NULL,
  last_seen timestamp DEFAULT now() NOT NULL,
  occurrences integer NOT NULL DEFAULT 1,
  organization_id varchar REFERENCES organizations(id),
  country text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS link_clusters (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type text NOT NULL,
  link_value_hash text NOT NULL,
  link_value_display text NOT NULL,
  member_borrower_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  member_count integer NOT NULL DEFAULT 0,
  confidence decimal(4,2) NOT NULL DEFAULT 0.50,
  country text,
  last_recomputed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_trace_records (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  asset_type asset_trace_type NOT NULL,
  provider text NOT NULL,
  reference text,
  description text,
  estimated_value decimal(15,2),
  currency text,
  status asset_trace_status NOT NULL DEFAULT 'stub',
  raw_response jsonb,
  requested_by varchar REFERENCES users(id),
  organization_id varchar REFERENCES organizations(id),
  country text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_assignments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id),
  credit_account_id varchar REFERENCES credit_accounts(id),
  assigned_to varchar REFERENCES users(id),
  status collection_status NOT NULL DEFAULT 'open',
  priority collection_priority NOT NULL DEFAULT 'medium',
  amount_outstanding decimal(15,2),
  currency text,
  due_date text,
  notes text,
  organization_id varchar REFERENCES organizations(id),
  country text,
  created_by varchar REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_attempts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id varchar NOT NULL REFERENCES collection_assignments(id),
  channel collection_channel NOT NULL,
  outcome collection_outcome NOT NULL,
  contact_value text,
  notes text,
  promised_amount decimal(15,2),
  promised_date text,
  attempted_by varchar REFERENCES users(id),
  attempted_at timestamp DEFAULT now() NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_events_borrower ON contact_events(borrower_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_type ON contact_events(contact_type);
CREATE INDEX IF NOT EXISTS idx_link_clusters_hash ON link_clusters(link_value_hash);
CREATE INDEX IF NOT EXISTS idx_asset_trace_borrower ON asset_trace_records(borrower_id);
CREATE INDEX IF NOT EXISTS idx_collection_assignments_borrower ON collection_assignments(borrower_id);
CREATE INDEX IF NOT EXISTS idx_collection_assignments_org ON collection_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_collection_attempts_assignment ON collection_attempts(assignment_id);
