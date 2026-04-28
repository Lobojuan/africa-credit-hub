CREATE TYPE "public"."cross_product_consent_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."cross_product_purpose" AS ENUM('merchant_credit_profile', 'consumer_spending_credit', 'bureau_reputation_badge', 'collateral_credit_view', 'credit_collateral_view');--> statement-breakpoint
CREATE TYPE "public"."cross_product_source" AS ENUM('loto', 'credit', 'collateral');--> statement-breakpoint
CREATE TYPE "public"."cross_product_target" AS ENUM('loto', 'credit', 'collateral');--> statement-breakpoint
ALTER TYPE "public"."alternative_data_source" ADD VALUE 'fiscal_receipts';--> statement-breakpoint
ALTER TYPE "public"."organization_type" ADD VALUE 'registry_authority';--> statement-breakpoint
CREATE TABLE "collateral_amendment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collateral_item_id" varchar NOT NULL,
	"requested_by" varchar NOT NULL,
	"lender_organization_id" varchar NOT NULL,
	"proposed_changes" text NOT NULL,
	"amendment_reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"review_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collateral_amendments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collateral_item_id" varchar NOT NULL,
	"amended_by" varchar,
	"amended_by_name" text,
	"changed_fields" text NOT NULL,
	"amended_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collateral_rejection_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collateral_item_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"rejected_by" varchar,
	"rejected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collateral_share_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collateral_item_id" varchar NOT NULL,
	"channel" text NOT NULL,
	"masked_recipient" text NOT NULL,
	"sent_by" varchar,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_monitoring_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumer_account_id" varchar NOT NULL,
	"borrower_id" varchar,
	"alert_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"sent_via_sms" boolean DEFAULT false NOT NULL,
	"sent_via_email" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumer_monitoring_prefs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumer_account_id" varchar NOT NULL,
	"borrower_id" varchar,
	"alert_score_change" boolean DEFAULT true NOT NULL,
	"alert_new_inquiry" boolean DEFAULT true NOT NULL,
	"alert_new_account" boolean DEFAULT true NOT NULL,
	"alert_dispute_update" boolean DEFAULT true NOT NULL,
	"alert_late_payment" boolean DEFAULT true NOT NULL,
	"alert_new_judgment" boolean DEFAULT true NOT NULL,
	"alert_channel" text DEFAULT 'both' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consumer_monitoring_prefs_consumer_account_id_unique" UNIQUE("consumer_account_id")
);
--> statement-breakpoint
CREATE TABLE "consumer_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"consumer_account_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "consumer_push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "consumer_score_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"national_id" text NOT NULL,
	"borrower_id" varchar,
	"score" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cross_product_consents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"borrower_id" varchar,
	"merchant_id" varchar,
	"source_product" "cross_product_source" NOT NULL,
	"target_product" "cross_product_target" NOT NULL,
	"purpose" "cross_product_purpose" NOT NULL,
	"status" "cross_product_consent_status" DEFAULT 'active' NOT NULL,
	"scope_note" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"granted_by_ip" text,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loto_merchants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar,
	"user_id" varchar,
	"shop_name" text NOT NULL,
	"owner_name" text,
	"vat_registration_number" text,
	"country_code" text DEFAULT 'CI' NOT NULL,
	"currency" text DEFAULT 'XOF' NOT NULL,
	"city" text,
	"category" text,
	"registered_at" timestamp DEFAULT now(),
	"credit_opt_in_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loto_receipts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" varchar NOT NULL,
	"consumer_user_id" varchar,
	"fiscal_code" text NOT NULL,
	"ticket_number" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"vat_amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'XOF' NOT NULL,
	"category" text,
	"item_count" integer DEFAULT 1,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "loto_receipts_fiscal_code_unique" UNIQUE("fiscal_code")
);
--> statement-breakpoint
CREATE TABLE "portfolio_trigger_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"borrower_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"notified_via" text[] DEFAULT '{}',
	"webhook_status" text,
	"acknowledged_at" timestamp,
	"fired_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_trigger_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"borrower_id" varchar NOT NULL,
	"trigger_types" text[] DEFAULT '{"new_inquiry","new_account","status_change","score_drop","new_judgment","late_payment"}' NOT NULL,
	"webhook_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"label" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registry_country_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"authority_name" text NOT NULL,
	"legal_regime" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"registry_authority_org_id" varchar,
	"required_fields_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registry_country_config_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
ALTER TABLE "collateral_items" ALTER COLUMN "borrower_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "registry_authority_id" varchar;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "asset_local_identifier" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "pan_african_asset_id" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "legal_regime" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "approval_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "approved_by" varchar;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "approval_date" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "certificate_number" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "lien_priority" integer;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "enforcement_status" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "discharge_date" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "borrower_name" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "grantor_national_id" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "is_pmsi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "security_interest_type" text DEFAULT 'loan_security' NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "collateral_class" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "financing_duration" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "debtor_type" text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "verification_code" text;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD COLUMN "resubmitted_from_id" varchar;--> statement-breakpoint
ALTER TABLE "consumer_accounts" ADD COLUMN "credit_frozen" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "consumer_accounts" ADD COLUMN "push_endpoint" text;--> statement-breakpoint
ALTER TABLE "consumer_accounts" ADD COLUMN "push_keys" jsonb;--> statement-breakpoint
ALTER TABLE "country_settings" ADD COLUMN "enabled_products" text[] DEFAULT ARRAY['credit','collateral','loto']::TEXT[];--> statement-breakpoint
ALTER TABLE "credit_inquiries" ADD COLUMN "is_soft_pull" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_inquiries" ADD COLUMN "soft_pull_result" jsonb;--> statement-breakpoint
ALTER TABLE "collateral_amendment_requests" ADD CONSTRAINT "collateral_amendment_requests_collateral_item_id_collateral_items_id_fk" FOREIGN KEY ("collateral_item_id") REFERENCES "public"."collateral_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_amendment_requests" ADD CONSTRAINT "collateral_amendment_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_amendment_requests" ADD CONSTRAINT "collateral_amendment_requests_lender_organization_id_organizations_id_fk" FOREIGN KEY ("lender_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_amendment_requests" ADD CONSTRAINT "collateral_amendment_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_amendments" ADD CONSTRAINT "collateral_amendments_collateral_item_id_collateral_items_id_fk" FOREIGN KEY ("collateral_item_id") REFERENCES "public"."collateral_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_amendments" ADD CONSTRAINT "collateral_amendments_amended_by_users_id_fk" FOREIGN KEY ("amended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_rejection_history" ADD CONSTRAINT "collateral_rejection_history_collateral_item_id_collateral_items_id_fk" FOREIGN KEY ("collateral_item_id") REFERENCES "public"."collateral_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_rejection_history" ADD CONSTRAINT "collateral_rejection_history_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_share_log" ADD CONSTRAINT "collateral_share_log_collateral_item_id_collateral_items_id_fk" FOREIGN KEY ("collateral_item_id") REFERENCES "public"."collateral_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_share_log" ADD CONSTRAINT "collateral_share_log_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_monitoring_alerts" ADD CONSTRAINT "consumer_monitoring_alerts_consumer_account_id_consumer_accounts_id_fk" FOREIGN KEY ("consumer_account_id") REFERENCES "public"."consumer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_monitoring_alerts" ADD CONSTRAINT "consumer_monitoring_alerts_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_monitoring_prefs" ADD CONSTRAINT "consumer_monitoring_prefs_consumer_account_id_consumer_accounts_id_fk" FOREIGN KEY ("consumer_account_id") REFERENCES "public"."consumer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_monitoring_prefs" ADD CONSTRAINT "consumer_monitoring_prefs_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_push_subscriptions" ADD CONSTRAINT "consumer_push_subscriptions_consumer_account_id_consumer_accounts_id_fk" FOREIGN KEY ("consumer_account_id") REFERENCES "public"."consumer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_score_history" ADD CONSTRAINT "consumer_score_history_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_merchant_id_loto_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."loto_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_merchants" ADD CONSTRAINT "loto_merchants_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_merchants" ADD CONSTRAINT "loto_merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_receipts" ADD CONSTRAINT "loto_receipts_merchant_id_loto_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."loto_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_receipts" ADD CONSTRAINT "loto_receipts_consumer_user_id_users_id_fk" FOREIGN KEY ("consumer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_events" ADD CONSTRAINT "portfolio_trigger_events_subscription_id_portfolio_trigger_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."portfolio_trigger_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_events" ADD CONSTRAINT "portfolio_trigger_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_events" ADD CONSTRAINT "portfolio_trigger_events_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_subscriptions" ADD CONSTRAINT "portfolio_trigger_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_subscriptions" ADD CONSTRAINT "portfolio_trigger_subscriptions_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trigger_subscriptions" ADD CONSTRAINT "portfolio_trigger_subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_country_config" ADD CONSTRAINT "registry_country_config_registry_authority_org_id_organizations_id_fk" FOREIGN KEY ("registry_authority_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD CONSTRAINT "collateral_items_registry_authority_id_organizations_id_fk" FOREIGN KEY ("registry_authority_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD CONSTRAINT "collateral_items_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collateral_items" ADD CONSTRAINT "collateral_items_resubmitted_from_id_collateral_items_id_fk" FOREIGN KEY ("resubmitted_from_id") REFERENCES "public"."collateral_items"("id") ON DELETE no action ON UPDATE no action;