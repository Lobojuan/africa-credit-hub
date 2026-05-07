-- Loto Fiscal — configurable fraud scan interval per country (Task #303).
-- Adds fraud_scan_interval_minutes to loto_country_draw_config so DGI officers
-- can tune how often the background fraud scanner runs without a code change.
-- Default 60 minutes = 1 hour. Must be a multiple of 15 (scheduler poll resolution)
-- and between 15 and 10080 minutes (7 days). Enforced at API layer; CHECK constraint
-- here guards against out-of-band writes.
ALTER TABLE "loto_country_draw_config"
  ADD COLUMN IF NOT EXISTS "fraud_scan_interval_minutes" integer NOT NULL DEFAULT 60;

DO $$ BEGIN
  ALTER TABLE "loto_country_draw_config"
    ADD CONSTRAINT "loto_country_draw_config_fraud_interval_check"
    CHECK (
      "fraud_scan_interval_minutes" >= 15
      AND "fraud_scan_interval_minutes" <= 10080
      AND "fraud_scan_interval_minutes" % 15 = 0
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
