-- Durable, single-use MFA recovery codes. Only SHA-256 hashes are stored.
CREATE TABLE IF NOT EXISTS "mfa_backup_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code_hash" text NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "mfa_backup_codes_user_code_unique" UNIQUE("user_id", "code_hash")
);
