-- Country Data Isolation Migration - Stage 2: Enforce NOT NULL constraints
-- Run ONLY after verifying zero NULL country values remain.
-- Check before running:
--   SELECT COUNT(*) FROM pending_approvals WHERE country IS NULL;
--   SELECT COUNT(*) FROM disputes WHERE country IS NULL;
--   SELECT COUNT(*) FROM notifications WHERE country IS NULL;
--   SELECT COUNT(*) FROM telco_decision_logs WHERE country IS NULL;

ALTER TABLE "pending_approvals" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "telco_decision_logs" ALTER COLUMN "country" SET NOT NULL;
