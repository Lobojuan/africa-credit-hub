ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false;
