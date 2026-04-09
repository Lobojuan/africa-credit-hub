-- Business Portal Accounts Migration
-- Creates the business_accounts table for business portal authentication

CREATE TABLE IF NOT EXISTS "business_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tin" varchar NOT NULL UNIQUE,
  "company_name" varchar NOT NULL,
  "contact_name" varchar,
  "phone" varchar NOT NULL,
  "email" varchar,
  "password_hash" varchar NOT NULL,
  "verified" boolean DEFAULT false,
  "otp_code" varchar,
  "otp_expires_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
