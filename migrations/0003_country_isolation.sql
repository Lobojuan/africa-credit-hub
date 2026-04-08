-- Country Data Isolation Migration - Stage 1: Add columns and backfill
-- Adds country column to tables that previously lacked it.
-- Backfills country from linked organizations.

-- Step 1: Add country column to pending_approvals (nullable initially)
ALTER TABLE "pending_approvals" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint

-- Step 2: Add country column to disputes (nullable initially)
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint

-- Step 3: Add country column to notifications (nullable initially)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint

-- Step 4: Add organization_id to notifications for country filtering
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "organization_id" varchar;--> statement-breakpoint

-- Step 5: Ensure telco_decision_logs has country column
ALTER TABLE "telco_decision_logs" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint

-- Step 6: Backfill pending_approvals country from organization
UPDATE "pending_approvals" SET "country" = (
  SELECT o."country" FROM "organizations" o WHERE o."id" = "pending_approvals"."organization_id"
) WHERE "country" IS NULL AND "organization_id" IS NOT NULL;--> statement-breakpoint

-- Step 6b: Default remaining pending_approvals
UPDATE "pending_approvals" SET "country" = 'Ghana' WHERE "country" IS NULL;--> statement-breakpoint

-- Step 7: Backfill disputes country from filing user's organization
UPDATE "disputes" SET "country" = (
  SELECT o."country" FROM "organizations" o
  JOIN "users" u ON u."organization_id" = o."id"
  WHERE u."id" = "disputes"."filed_by"
) WHERE "country" IS NULL AND "filed_by" IS NOT NULL;--> statement-breakpoint

-- Step 7b: Backfill disputes country from organization_id directly
UPDATE "disputes" SET "country" = (
  SELECT o."country" FROM "organizations" o WHERE o."id" = "disputes"."organization_id"
) WHERE "country" IS NULL AND "organization_id" IS NOT NULL;--> statement-breakpoint

-- Step 7c: Default remaining disputes
UPDATE "disputes" SET "country" = 'Ghana' WHERE "country" IS NULL;--> statement-breakpoint

-- Step 8: Backfill notifications country from user's organization
UPDATE "notifications" SET "country" = (
  SELECT o."country" FROM "organizations" o
  JOIN "users" u ON u."organization_id" = o."id"
  WHERE u."id" = "notifications"."user_id"
) WHERE "country" IS NULL AND "user_id" IS NOT NULL;--> statement-breakpoint

-- Step 8b: Backfill notifications country from organization_id directly (broadcast/system notifications)
UPDATE "notifications" SET "country" = (
  SELECT o."country" FROM "organizations" o WHERE o."id" = "notifications"."organization_id"
) WHERE "country" IS NULL AND "organization_id" IS NOT NULL;--> statement-breakpoint

-- Step 8c: Backfill any remaining notifications with NULL country using system default
UPDATE "notifications" SET "country" = 'Ghana' WHERE "country" IS NULL;--> statement-breakpoint

-- Step 9: Backfill telco_decision_logs country from organization
UPDATE "telco_decision_logs" SET "country" = (
  SELECT o."country" FROM "organizations" o WHERE o."id" = "telco_decision_logs"."organization_id"
) WHERE "country" IS NULL AND "organization_id" IS NOT NULL;--> statement-breakpoint

-- Step 9b: Default remaining telco_decision_logs
UPDATE "telco_decision_logs" SET "country" = 'Ghana' WHERE "country" IS NULL;
