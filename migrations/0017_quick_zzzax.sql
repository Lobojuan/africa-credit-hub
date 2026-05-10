-- Add unique constraint to credit_accounts to prevent duplicate facility entries
-- for the same borrower + account number + lender institution combination.
-- Uses IF NOT EXISTS so re-running the migration is safe.
CREATE UNIQUE INDEX IF NOT EXISTS "credit_accounts_borrower_account_lender_idx"
  ON "credit_accounts" USING btree ("borrower_id", "account_number", "lender_institution");
