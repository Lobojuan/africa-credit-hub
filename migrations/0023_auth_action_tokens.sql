CREATE TABLE IF NOT EXISTS "auth_action_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "purpose" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);
