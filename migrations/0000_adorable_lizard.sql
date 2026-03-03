CREATE TYPE "public"."account_status" AS ENUM('current', 'delinquent', 'default', 'closed', 'restructured', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('pending', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."borrower_type" AS ENUM('individual', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."inquiry_purpose" AS ENUM('new_credit', 'review', 'collection', 'regulatory', 'portfolio_monitoring');--> statement-breakpoint
CREATE TYPE "public"."institution_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."judgment_status" AS ENUM('active', 'resolved', 'appealed');--> statement-breakpoint
CREATE TYPE "public"."judgment_type" AS ENUM('lien', 'bankruptcy', 'lawsuit', 'civil_judgment', 'criminal_conviction');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'suspended', 'pending', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('bank', 'microfinance', 'insurance', 'telecom', 'fintech', 'utility', 'government', 'regulator', 'real_estate', 'investment', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('on_time', 'late', 'missed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'regulator', 'lender', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "api_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"base_url" text NOT NULL,
	"api_key_header_name" text DEFAULT 'X-API-Key',
	"auth_type" text DEFAULT 'none' NOT NULL,
	"country" text,
	"is_active" boolean DEFAULT true,
	"description" text,
	"last_tested_at" timestamp,
	"last_test_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"label" text NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"permissions" text DEFAULT 'submit' NOT NULL,
	"last_used_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" varchar,
	"details" text,
	"ip_address" text,
	"previous_hash" text,
	"current_hash" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_name" text NOT NULL,
	"service_type" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'ETB' NOT NULL,
	"status" "billing_status" DEFAULT 'pending' NOT NULL,
	"invoice_number" text NOT NULL,
	"period_start" text,
	"period_end" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "borrowers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "borrower_type" NOT NULL,
	"first_name" text,
	"last_name" text,
	"company_name" text,
	"national_id" text NOT NULL,
	"tin_number" text,
	"date_of_birth" text,
	"gender" text,
	"phone" text,
	"email" text,
	"address" text,
	"country" text,
	"city" text,
	"region" text,
	"employer_name" text,
	"occupation" text,
	"business_reg_number" text,
	"sector" text,
	"passport_number" text,
	"photo_url" text,
	"id_document_url" text,
	"is_pep" boolean DEFAULT false,
	"pep_details" text,
	"related_borrower_id" varchar,
	"relationship_type" text,
	"education_level" text,
	"education_institution" text,
	"employment_history" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "borrowers_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"granted_to" text NOT NULL,
	"purpose" text NOT NULL,
	"consent_type" text NOT NULL,
	"status" "consent_status" DEFAULT 'active' NOT NULL,
	"granted_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"receipt_number" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "court_judgments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"case_number" text NOT NULL,
	"court" text NOT NULL,
	"judgment_type" "judgment_type" NOT NULL,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'ETB',
	"judgment_date" text NOT NULL,
	"status" "judgment_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"lender_institution" text NOT NULL,
	"account_number" text NOT NULL,
	"account_type" text NOT NULL,
	"original_amount" numeric(15, 2) NOT NULL,
	"current_balance" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'ETB' NOT NULL,
	"interest_rate" numeric(5, 2),
	"disbursement_date" text,
	"maturity_date" text,
	"status" "account_status" DEFAULT 'current' NOT NULL,
	"days_in_arrears" integer DEFAULT 0,
	"collateral_type" text,
	"collateral_value" numeric(15, 2),
	"last_payment_date" text,
	"last_payment_amount" numeric(15, 2),
	"is_interest_free" boolean DEFAULT false,
	"grace_period_months" integer,
	"restructure_count" integer DEFAULT 0,
	"written_off_date" text,
	"reinstated_date" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"inquired_by" varchar NOT NULL,
	"purpose" "inquiry_purpose" NOT NULL,
	"institution" text NOT NULL,
	"consent_provided" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_report_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"requested_by" varchar NOT NULL,
	"institution" text NOT NULL,
	"purpose" text NOT NULL,
	"serial_number" text NOT NULL,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "credit_report_logs_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"credit_account_id" varchar,
	"filed_by" varchar NOT NULL,
	"dispute_type" text NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" text,
	"correction_type" text,
	"sla_deadline" timestamp,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" text NOT NULL,
	"target_currency" text NOT NULL,
	"rate" numeric(15, 6) NOT NULL,
	"effective_date" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"registration_number" text,
	"country" text DEFAULT 'Ethiopia' NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"status" "institution_status" DEFAULT 'pending' NOT NULL,
	"submission_frequency" text DEFAULT 'monthly',
	"approved_by" varchar,
	"approved_at" timestamp,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "organization_type" DEFAULT 'other' NOT NULL,
	"status" "organization_status" DEFAULT 'pending' NOT NULL,
	"country" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"logo_url" text,
	"website" text,
	"subscription_tier" text DEFAULT 'standard' NOT NULL,
	"max_users" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_account_id" varchar NOT NULL,
	"period" text NOT NULL,
	"amount_due" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'on_time' NOT NULL,
	"days_late" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"action" text NOT NULL,
	"payload" text NOT NULL,
	"requested_by" varchar NOT NULL,
	"reviewed_by" varchar,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" text NOT NULL,
	"entity_type" text NOT NULL,
	"retention_years" integer NOT NULL,
	"archive_after_years" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"institution" text,
	"organization_id" varchar,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"last_login" timestamp,
	"password_changed_at" timestamp,
	"must_change_password" boolean DEFAULT false,
	"mfa_secret" text,
	"mfa_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD CONSTRAINT "court_judgments_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD CONSTRAINT "court_judgments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_inquiries" ADD CONSTRAINT "credit_inquiries_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_inquiries" ADD CONSTRAINT "credit_inquiries_inquired_by_users_id_fk" FOREIGN KEY ("inquired_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_report_logs" ADD CONSTRAINT "credit_report_logs_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_report_logs" ADD CONSTRAINT "credit_report_logs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_report_logs" ADD CONSTRAINT "credit_report_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_credit_account_id_credit_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_filed_by_users_id_fk" FOREIGN KEY ("filed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_credit_account_id_credit_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;