ALTER TABLE registry_health_config
  ADD COLUMN IF NOT EXISTS retention_days integer;
