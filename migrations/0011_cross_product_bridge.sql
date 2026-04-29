CREATE TYPE "public"."cross_product_consent_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."cross_product_purpose" AS ENUM('merchant_credit_profile', 'consumer_spending_credit', 'bureau_reputation_badge', 'collateral_credit_view', 'credit_collateral_view');--> statement-breakpoint
CREATE TYPE "public"."cross_product_source" AS ENUM('loto', 'credit', 'collateral');--> statement-breakpoint
CREATE TYPE "public"."cross_product_target" AS ENUM('loto', 'credit', 'collateral');--> statement-breakpoint
ALTER TYPE "public"."alternative_data_source" ADD VALUE 'fiscal_receipts';--> statement-breakpoint
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
);--> statement-breakpoint
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
);--> statement-breakpoint
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
);--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cross_product_consents" ADD CONSTRAINT "cross_product_consents_merchant_id_loto_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."loto_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_merchants" ADD CONSTRAINT "loto_merchants_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_merchants" ADD CONSTRAINT "loto_merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_receipts" ADD CONSTRAINT "loto_receipts_merchant_id_loto_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."loto_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_receipts" ADD CONSTRAINT "loto_receipts_consumer_user_id_users_id_fk" FOREIGN KEY ("consumer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
