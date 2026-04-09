-- Business Portal Accounts Migration
-- Creates the business_accounts table for business portal authentication

CREATE TABLE IF NOT EXISTS "business_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tin" text NOT NULL UNIQUE,
  "company_name" text NOT NULL,
  "contact_name" text,
  "phone" text,
  "email" text,
  "password_hash" text,
  "auth_provider" text DEFAULT 'local',
  "verified" boolean DEFAULT false,
  "otp_code" text,
  "otp_expires_at" timestamp,
  "failed_attempts" integer DEFAULT 0,
  "locked_until" timestamp,
  "last_login" timestamp,
  "created_at" timestamp DEFAULT now()
);
