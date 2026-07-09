-- Universal Credit Hub GTM Intelligence foundation
-- Adds CRM/GTM tables for verified sales outreach, campaign review,
-- suppression, call notes/activity, and AI prompt auditing.
-- This module references UCH core entities but does not copy regulated
-- borrower/credit PII into sales workflows.

DO $$ BEGIN
  CREATE TYPE "gtm_company_status" AS ENUM ('target', 'qualified', 'active_opportunity', 'customer', 'disqualified', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_contact_status" AS ENUM ('new', 'verified', 'engaged', 'replied', 'unsubscribed', 'bounced', 'do_not_contact');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_verification_status" AS ENUM ('unknown', 'pending', 'valid', 'invalid', 'risky', 'do_not_contact');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_campaign_status" AS ENUM ('draft', 'review', 'approved', 'active', 'paused', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_outreach_channel" AS ENUM ('email', 'phone', 'linkedin', 'meeting', 'note');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_outreach_status" AS ENUM ('draft', 'needs_review', 'approved', 'scheduled', 'sent', 'replied', 'bounced', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "gtm_activity_type" AS ENUM ('note', 'email', 'call', 'meeting', 'task', 'verification', 'ai_review', 'status_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_companies" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "website" text,
  "country" text,
  "region" text,
  "segment" text,
  "institution_type" text,
  "status" "gtm_company_status" DEFAULT 'target' NOT NULL,
  "fit_score" integer DEFAULT 0,
  "source" text,
  "source_url" text,
  "owner_user_id" varchar REFERENCES "public"."users"("id"),
  "linked_organization_id" varchar REFERENCES "public"."organizations"("id"),
  "notes" text,
  "tags" text[] DEFAULT '{}',
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "updated_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gtm_companies_name_country_uq" ON "gtm_companies" ("name", "country");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_contacts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" varchar REFERENCES "public"."gtm_companies"("id"),
  "full_name" text NOT NULL,
  "title" text,
  "department" text,
  "email" text,
  "phone" text,
  "linkedin_url" text,
  "country" text,
  "role_category" text,
  "status" "gtm_contact_status" DEFAULT 'new' NOT NULL,
  "email_verification_status" "gtm_verification_status" DEFAULT 'unknown' NOT NULL,
  "phone_verification_status" "gtm_verification_status" DEFAULT 'unknown' NOT NULL,
  "source" text,
  "source_url" text,
  "consent_notes" text,
  "last_contacted_at" timestamp,
  "owner_user_id" varchar REFERENCES "public"."users"("id"),
  "notes" text,
  "tags" text[] DEFAULT '{}',
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "updated_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_contacts_company_idx" ON "gtm_contacts" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_contacts_email_idx" ON "gtm_contacts" ("email");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_campaigns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "market" text,
  "product_focus" text,
  "status" "gtm_campaign_status" DEFAULT 'draft' NOT NULL,
  "owner_user_id" varchar REFERENCES "public"."users"("id"),
  "approved_by" varchar REFERENCES "public"."users"("id"),
  "approved_at" timestamp,
  "starts_at" timestamp,
  "ends_at" timestamp,
  "goals" jsonb DEFAULT '{}'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "updated_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_campaigns_status_idx" ON "gtm_campaigns" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_outreach_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" varchar REFERENCES "public"."gtm_campaigns"("id"),
  "company_id" varchar REFERENCES "public"."gtm_companies"("id"),
  "contact_id" varchar REFERENCES "public"."gtm_contacts"("id"),
  "channel" "gtm_outreach_channel" DEFAULT 'email' NOT NULL,
  "status" "gtm_outreach_status" DEFAULT 'draft' NOT NULL,
  "subject" text,
  "body" text,
  "ai_model" text,
  "prompt_summary" text,
  "human_approved_by" varchar REFERENCES "public"."users"("id"),
  "human_approved_at" timestamp,
  "scheduled_at" timestamp,
  "sent_at" timestamp,
  "provider_message_id" text,
  "failure_reason" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "updated_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_outreach_campaign_idx" ON "gtm_outreach_messages" ("campaign_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_outreach_contact_idx" ON "gtm_outreach_messages" ("contact_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_outreach_status_idx" ON "gtm_outreach_messages" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_suppression_list" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text,
  "phone" text,
  "reason" text NOT NULL,
  "source" text,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gtm_suppression_email_uq" ON "gtm_suppression_list" ("email") WHERE "email" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gtm_suppression_phone_uq" ON "gtm_suppression_list" ("phone") WHERE "phone" IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_activities" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" "gtm_activity_type" DEFAULT 'note' NOT NULL,
  "company_id" varchar REFERENCES "public"."gtm_companies"("id"),
  "contact_id" varchar REFERENCES "public"."gtm_contacts"("id"),
  "campaign_id" varchar REFERENCES "public"."gtm_campaigns"("id"),
  "outreach_message_id" varchar REFERENCES "public"."gtm_outreach_messages"("id"),
  "title" text NOT NULL,
  "body" text,
  "outcome" text,
  "due_at" timestamp,
  "completed_at" timestamp,
  "created_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_activities_company_idx" ON "gtm_activities" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gtm_activities_created_idx" ON "gtm_activities" ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gtm_ai_prompt_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purpose" text NOT NULL,
  "model" text,
  "local_model" boolean DEFAULT false NOT NULL,
  "input_summary" text,
  "output_summary" text,
  "company_id" varchar REFERENCES "public"."gtm_companies"("id"),
  "contact_id" varchar REFERENCES "public"."gtm_contacts"("id"),
  "campaign_id" varchar REFERENCES "public"."gtm_campaigns"("id"),
  "created_by" varchar REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now()
);
