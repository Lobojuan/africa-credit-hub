-- Loto Fiscal — temporary scan-frequency boost for DGI officers (Task #317).
-- Adds boost_interval_minutes and boost_until to loto_country_draw_config so
-- DGI officers (not just super admins) can temporarily override the fraud scan
-- interval to 15 minutes for 2 hours. The scheduler reads these fields and
-- reverts automatically once boost_until passes. Both columns are nullable;
-- NULL means no active boost.
ALTER TABLE "loto_country_draw_config"
  ADD COLUMN IF NOT EXISTS "boost_interval_minutes" integer,
  ADD COLUMN IF NOT EXISTS "boost_until" timestamp;
