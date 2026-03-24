CREATE TYPE "public"."agreement_status" AS ENUM('draft', 'active', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('pending', 'sent', 'failed', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('credit_inquiry', 'report_accessed', 'dispute_update', 'score_change', 'data_updated');--> statement-breakpoint
CREATE TYPE "public"."alternative_data_source" AS ENUM('mobile_money', 'utility', 'telco', 'rent', 'insurance', 'merchant');--> statement-breakpoint
CREATE TYPE "public"."alternative_data_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'completed', 'failed', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."usage_metering_event" AS ENUM('credit_report_pull', 'api_call', 'batch_upload', 'cross_border_query', 'dispute_filing', 'data_export');--> statement-breakpoint
CREATE TABLE "alternative_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alternative_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"borrower_id" text NOT NULL,
	"source" "alternative_data_source" NOT NULL,
	"provider" text NOT NULL,
	"status" "alternative_data_status" DEFAULT 'active' NOT NULL,
	"total_transactions" integer DEFAULT 0,
	"on_time_payments" integer DEFAULT 0,
	"late_payments" integer DEFAULT 0,
	"average_monthly_amount" numeric(15, 2),
	"currency" text DEFAULT 'GHS' NOT NULL,
	"data_start_date" timestamp,
	"data_end_date" timestamp,
	"consent_date" timestamp,
	"raw_score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blockchain_anchors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merkle_root" text NOT NULL,
	"audit_log_count" integer NOT NULL,
	"first_log_id" varchar,
	"last_log_id" varchar,
	"simulated_tx_hash" text NOT NULL,
	"simulated_block_number" integer,
	"simulated_chain" text DEFAULT 'ethereum-sepolia' NOT NULL,
	"status" text DEFAULT 'anchored' NOT NULL,
	"anchored_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "borrower_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"alert_type" "alert_type" NOT NULL,
	"message" text NOT NULL,
	"recipient_phone" text,
	"recipient_email" text,
	"accessed_by" text,
	"institution" text,
	"purpose" text,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consumer_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"national_id" text NOT NULL,
	"phone" text,
	"email" text,
	"password_hash" text,
	"date_of_birth" text,
	"full_name" text,
	"google_id" text,
	"apple_id" text,
	"auth_provider" text DEFAULT 'local',
	"profile_picture" text,
	"verified" boolean DEFAULT false,
	"otp_code" text,
	"otp_expires_at" timestamp,
	"email_token" text,
	"email_token_expires_at" timestamp,
	"verification_method" text DEFAULT 'sms',
	"failed_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "consumer_accounts_national_id_unique" UNIQUE("national_id"),
	CONSTRAINT "consumer_accounts_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "consumer_accounts_apple_id_unique" UNIQUE("apple_id")
);
--> statement-breakpoint
CREATE TABLE "country_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"regulatory_body" text,
	"data_protection_law" text,
	"data_protection_status" text DEFAULT 'none' NOT NULL,
	"sata_readiness" text DEFAULT 'planned' NOT NULL,
	"enabled_features" text[] DEFAULT ARRAY[]::TEXT[],
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "country_settings_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "data_sharing_agreements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_country" text NOT NULL,
	"target_country" text NOT NULL,
	"allowed_data_types" text[] NOT NULL,
	"status" "agreement_status" DEFAULT 'draft' NOT NULL,
	"effective_date" text,
	"expiry_date" text,
	"legal_basis" text,
	"description" text,
	"regional_bloc" text,
	"created_by" varchar,
	"approved_by" varchar,
	"suspended_reason" text,
	"source_institutions" text[] DEFAULT ARRAY[]::TEXT[],
	"target_institutions" text[] DEFAULT ARRAY[]::TEXT[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guarantors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_account_id" varchar NOT NULL,
	"guarantor_number" integer DEFAULT 1 NOT NULL,
	"nature_of_guarantor" text,
	"company_name" text,
	"business_reg_number" text,
	"surname" text,
	"first_name" text,
	"middle_names" text,
	"national_id" text,
	"voters_id" text,
	"drivers_license" text,
	"passport_number" text,
	"ssnit_number" text,
	"gender" text,
	"date_of_birth" text,
	"address_1" text,
	"address_2" text,
	"address_3" text,
	"home_telephone" text,
	"work_telephone" text,
	"mobile" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "papss_settlements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_institution" text NOT NULL,
	"sender_country" text NOT NULL,
	"receiver_institution" text NOT NULL,
	"receiver_country" text NOT NULL,
	"sender_amount" numeric(15, 2) NOT NULL,
	"sender_currency" text NOT NULL,
	"receiver_amount" numeric(15, 2) NOT NULL,
	"receiver_currency" text NOT NULL,
	"exchange_rate" numeric(15, 6) NOT NULL,
	"exchange_rate_source" text DEFAULT 'PAPSS',
	"iso20022_reference" text NOT NULL,
	"message_type" text DEFAULT 'pacs.008',
	"status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"purpose" text,
	"agreement_id" varchar,
	"initiated_by" varchar,
	"completed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"event_type" "usage_metering_event" NOT NULL,
	"min_volume" integer DEFAULT 0 NOT NULL,
	"max_volume" integer,
	"unit_price_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"country" text DEFAULT 'Global' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_metering" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar,
	"event_type" "usage_metering_event" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"country" text,
	"metadata" text,
	"billed" boolean DEFAULT false,
	"billing_record_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text,
	"transports" text[] DEFAULT ARRAY[]::TEXT[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"event" text NOT NULL,
	"payload" text,
	"response_status" integer,
	"response_body" text,
	"success" boolean DEFAULT false,
	"attempt_number" integer DEFAULT 1,
	"delivered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text[] DEFAULT ARRAY[]::TEXT[],
	"status" text DEFAULT 'active' NOT NULL,
	"description" text,
	"failure_count" integer DEFAULT 0,
	"last_delivery_at" timestamp,
	"last_delivery_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "trading_name" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_business_name" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_reg_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "office_telephone_2" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "office_fax_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "mobile_telephone_2" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "employer_payroll_num" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "paypoint" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "employer_postal_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "other_id_type" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "other_id_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "branch_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "customer_id" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "facility_status_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "closed_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "reporting_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "correction_indicator" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "borrower_alerts" ADD CONSTRAINT "borrower_alerts_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrower_alerts" ADD CONSTRAINT "borrower_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sharing_agreements" ADD CONSTRAINT "data_sharing_agreements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sharing_agreements" ADD CONSTRAINT "data_sharing_agreements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_credit_account_id_credit_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papss_settlements" ADD CONSTRAINT "papss_settlements_agreement_id_data_sharing_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."data_sharing_agreements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papss_settlements" ADD CONSTRAINT "papss_settlements_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metering" ADD CONSTRAINT "usage_metering_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metering" ADD CONSTRAINT "usage_metering_billing_record_id_billing_records_id_fk" FOREIGN KEY ("billing_record_id") REFERENCES "public"."billing_records"("id") ON DELETE no action ON UPDATE no action;