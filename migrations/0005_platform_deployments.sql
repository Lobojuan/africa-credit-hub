-- Platform Deployments table for multi-deployment management
-- Creates the deployment_status enum and platform_deployments table

DO $$ BEGIN
  CREATE TYPE deployment_status AS ENUM ('active', 'trial', 'suspended', 'decommissioned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS platform_deployments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_name VARCHAR NOT NULL,
  country VARCHAR NOT NULL DEFAULT 'Ghana',
  region VARCHAR DEFAULT 'West Africa',
  deployment_url VARCHAR,
  status deployment_status NOT NULL DEFAULT 'active',
  license_tier VARCHAR NOT NULL DEFAULT 'commercial',
  monthly_fee_cents INTEGER DEFAULT 0,
  platform_fee_percent INTEGER DEFAULT 15,
  currency VARCHAR NOT NULL DEFAULT 'GHS',
  branding VARCHAR,
  deployment_date TIMESTAMP,
  contact_name VARCHAR,
  contact_email VARCHAR,
  total_borrowers INTEGER DEFAULT 0,
  total_institutions INTEGER DEFAULT 0,
  github_repo VARCHAR,
  heartbeat_url VARCHAR,
  last_heartbeat JSONB,
  last_heartbeat_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  config_snapshot JSONB,
  update_log JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
