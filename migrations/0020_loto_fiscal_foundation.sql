-- Loto Fiscal Foundation — Task #488
-- Adds per-country fiscal ID config and NCC/fiscal ID fields on merchants.
-- Country-isolated by design: each row in loto_country_fiscal_config carries
-- its own adapter_key so Ivory Coast (CI/NCC/DGI) and future countries
-- (Ghana GH/TIN/GRA, Nigeria NG/RC/FIRS) each resolve independently.

ALTER TABLE "loto_merchants"
  ADD COLUMN IF NOT EXISTS "fiscal_id" varchar,
  ADD COLUMN IF NOT EXISTS "fiscal_id_type" varchar,
  ADD COLUMN IF NOT EXISTS "fiscal_id_verified" boolean NOT NULL DEFAULT false;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "loto_country_fiscal_config" (
  "id"              varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "country_code"    varchar(3) NOT NULL UNIQUE,
  "fiscal_id_label" text NOT NULL,
  "fiscal_id_regex" text NOT NULL,
  "adapter_key"     text NOT NULL DEFAULT 'simulated',
  "authority_name"  text NOT NULL,
  "currency_symbol" text NOT NULL DEFAULT 'XOF',
  "created_at"      timestamp DEFAULT now()
);

--> statement-breakpoint

-- Seed Ivory Coast (Côte d'Ivoire) — DGI / NCC
-- NCC format: 7 digits followed by one uppercase letter, e.g. 0731730R
INSERT INTO "loto_country_fiscal_config"
  ("country_code", "fiscal_id_label", "fiscal_id_regex", "adapter_key", "authority_name", "currency_symbol")
VALUES
  ('CI', 'NCC', '^[0-9]{7}[A-Z]$', 'ci_dgi', 'Direction Générale des Impôts (DGI)', 'XOF')
ON CONFLICT ("country_code") DO NOTHING;

-- Ghana stub (not active yet — adapter_key=simulated)
INSERT INTO "loto_country_fiscal_config"
  ("country_code", "fiscal_id_label", "fiscal_id_regex", "adapter_key", "authority_name", "currency_symbol")
VALUES
  ('GH', 'TIN', '^[CGPcgp][0-9]{10}$', 'simulated', 'Ghana Revenue Authority (GRA)', 'GHS')
ON CONFLICT ("country_code") DO NOTHING;

-- Nigeria stub (not active yet — adapter_key=simulated)
INSERT INTO "loto_country_fiscal_config"
  ("country_code", "fiscal_id_label", "fiscal_id_regex", "adapter_key", "authority_name", "currency_symbol")
VALUES
  ('NG', 'RC', '^RC[0-9]{6,7}$', 'simulated', 'Federal Inland Revenue Service (FIRS)', 'NGN')
ON CONFLICT ("country_code") DO NOTHING;
