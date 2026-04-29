-- Task #286: Loto notifications, USSD & SMS fallback.
-- Adds outbound message log, consumer messaging prefs, USSD session state.
-- Idempotent: every CREATE uses IF NOT EXISTS so re-running is safe even
-- after the DDL was applied via psql for an earlier deploy.

DO $$ BEGIN
  CREATE TYPE "public"."loto_message_channel" AS ENUM('sms', 'push', 'ussd');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."loto_message_status" AS ENUM('pending', 'dispatched', 'failed', 'opted_out', 'skipped');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."loto_message_template" AS ENUM('winner_sms', 'draw_reminder_sms', 'merchant_inactive_sms', 'ussd_session');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."loto_message_language" AS ENUM('en', 'fr');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "loto_outbound_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "country_code" text NOT NULL,
  "channel" "loto_message_channel" NOT NULL,
  "template_key" "loto_message_template" NOT NULL,
  "language" "loto_message_language" DEFAULT 'en' NOT NULL,
  "recipient" text NOT NULL,
  "recipient_user_id" varchar REFERENCES "users"("id"),
  "draw_id" varchar REFERENCES "loto_draws"("id"),
  "winner_id" varchar REFERENCES "loto_draw_winners"("id"),
  "merchant_id" varchar REFERENCES "loto_merchants"("id"),
  "payload" jsonb NOT NULL,
  "status" "loto_message_status" DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "last_attempt_at" timestamp,
  "dispatched_at" timestamp,
  "provider_ref" text,
  "provider" text DEFAULT 'simulated' NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "loto_outbound_messages_country_created_idx" ON "loto_outbound_messages" ("country_code", "created_at");
CREATE INDEX IF NOT EXISTS "loto_outbound_messages_status_attempts_idx" ON "loto_outbound_messages" ("status", "attempts");
CREATE INDEX IF NOT EXISTS "loto_outbound_messages_draw_template_user_idx" ON "loto_outbound_messages" ("draw_id", "template_key", "recipient_user_id");
CREATE INDEX IF NOT EXISTS "loto_outbound_messages_merchant_template_idx" ON "loto_outbound_messages" ("merchant_id", "template_key", "created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "loto_consumer_messaging_prefs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "opt_out_reminders" boolean DEFAULT false NOT NULL,
  "language" "loto_message_language" DEFAULT 'en' NOT NULL,
  "verified_phone" text,
  "verified_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "loto_ussd_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" text NOT NULL UNIQUE,
  "msisdn" text NOT NULL,
  "country_code" text NOT NULL,
  "language" "loto_message_language" DEFAULT 'en' NOT NULL,
  "state" text DEFAULT 'root' NOT NULL,
  "context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ended_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "loto_ussd_sessions_msisdn_idx" ON "loto_ussd_sessions" ("msisdn", "created_at");
