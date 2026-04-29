-- Loto Notifications, USSD & SMS Fallback (Task #286)

DO $$ BEGIN
  CREATE TYPE "public"."loto_messaging_channel" AS ENUM('sms', 'push', 'ussd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."loto_messaging_status" AS ENUM('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "loto_outbound_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar REFERENCES "users"("id"),
  "recipient_phone" text,
  "country_code" text NOT NULL,
  "language" text NOT NULL DEFAULT 'en',
  "channel" "loto_messaging_channel" NOT NULL,
  "template_key" text NOT NULL,
  "body" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "status" "loto_messaging_status" NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "purpose" text NOT NULL,
  "adapter" text NOT NULL DEFAULT 'simulated',
  "provider_ref" text,
  "last_error" text,
  "last_error_at" timestamp,
  "dispatched_at" timestamp,
  "scheduled_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "loto_outbound_status_idx" ON "loto_outbound_messages" ("status", "scheduled_at");
CREATE INDEX IF NOT EXISTS "loto_outbound_country_idx" ON "loto_outbound_messages" ("country_code", "purpose");
CREATE INDEX IF NOT EXISTS "loto_outbound_user_idx" ON "loto_outbound_messages" ("user_id");

CREATE TABLE IF NOT EXISTS "loto_consumer_messaging_prefs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "opt_out_reminders" boolean NOT NULL DEFAULT false,
  "language" text NOT NULL DEFAULT 'en',
  "verified_phone" text,
  "verified_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loto_ussd_sessions" (
  "session_id" text PRIMARY KEY NOT NULL,
  "phone_number" text NOT NULL,
  "country_code" text NOT NULL,
  "state" text NOT NULL DEFAULT 'menu:main',
  "context" jsonb DEFAULT '{}'::jsonb,
  "language" text NOT NULL DEFAULT 'en',
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "loto_ussd_phone_idx" ON "loto_ussd_sessions" ("phone_number");
