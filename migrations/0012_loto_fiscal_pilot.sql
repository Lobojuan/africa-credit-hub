CREATE TYPE "public"."loto_draw_status" AS ENUM('scheduled', 'open', 'drawing', 'closed', 'verified');--> statement-breakpoint
CREATE TYPE "public"."loto_payout_status" AS ENUM('pending', 'succeeded', 'failed', 'skipped');--> statement-breakpoint
ALTER TYPE "public"."cross_product_consent_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
CREATE TABLE "loto_country_draw_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"cadence" text NOT NULL,
	"draw_time_utc" text NOT NULL,
	"default_tiers" jsonb NOT NULL,
	"payout_provider" text DEFAULT 'simulated' NOT NULL,
	"currency" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "loto_country_draw_config_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "loto_draw_prize_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" varchar NOT NULL,
	"tier" text NOT NULL,
	"label" text NOT NULL,
	"prize_amount" numeric(18, 2) NOT NULL,
	"currency" text NOT NULL,
	"slot_count" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loto_draw_winners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" varchar NOT NULL,
	"receipt_id" varchar NOT NULL,
	"consumer_user_id" varchar,
	"tier" text NOT NULL,
	"prize_amount" numeric(18, 2) NOT NULL,
	"currency" text NOT NULL,
	"selection_rank" integer NOT NULL,
	"selection_hash" text NOT NULL,
	"payout_status" "loto_payout_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loto_draws" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"draw_number" integer NOT NULL,
	"status" "loto_draw_status" DEFAULT 'scheduled' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"commitment_hash" text NOT NULL,
	"server_seed" text,
	"server_nonce" text,
	"pool_hash" text,
	"eligible_ticket_count" integer DEFAULT 0 NOT NULL,
	"total_pool" numeric(18, 2) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"opened_at" timestamp DEFAULT now(),
	"drawn_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loto_payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"winner_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"status" "loto_payout_status" DEFAULT 'pending' NOT NULL,
	"provider_ref" text,
	"last_error" text,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "loto_merchants" ALTER COLUMN "country_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "loto_merchants" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "loto_receipts" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "loto_draw_prize_tiers" ADD CONSTRAINT "loto_draw_prize_tiers_draw_id_loto_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."loto_draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_draw_winners" ADD CONSTRAINT "loto_draw_winners_draw_id_loto_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."loto_draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_draw_winners" ADD CONSTRAINT "loto_draw_winners_receipt_id_loto_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."loto_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_draw_winners" ADD CONSTRAINT "loto_draw_winners_consumer_user_id_users_id_fk" FOREIGN KEY ("consumer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loto_payouts" ADD CONSTRAINT "loto_payouts_winner_id_loto_draw_winners_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."loto_draw_winners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loto_draws_country_draw_number_uq" ON "loto_draws" USING btree ("country_code","draw_number");