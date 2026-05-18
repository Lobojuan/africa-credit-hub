CREATE TABLE "playbook_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"username" text,
	"playbook_slug" text NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "playbook_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "playbook_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "playbook_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbook_id" varchar,
	"content" text NOT NULL,
	"saved_by" varchar,
	"saved_at" timestamp DEFAULT now(),
	"label" text
);
--> statement-breakpoint
ALTER TABLE "loto_country_draw_config" ADD COLUMN "boost_interval_minutes" integer;--> statement-breakpoint
ALTER TABLE "loto_country_draw_config" ADD COLUMN "boost_until" timestamp;--> statement-breakpoint
ALTER TABLE "playbook_pages" ADD CONSTRAINT "playbook_pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_versions" ADD CONSTRAINT "playbook_versions_playbook_id_playbook_pages_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbook_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_versions" ADD CONSTRAINT "playbook_versions_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;