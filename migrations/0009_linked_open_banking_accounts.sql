-- Linked Open-Banking Accounts (Task #28 — Affordability Module)
-- Persists the result of provider link-sessions (Mono widget / Stitch OAuth / Okra widget)
-- so computeAffordability can resolve accountId automatically without re-linking.

CREATE TABLE IF NOT EXISTS linked_open_banking_accounts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id varchar NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  provider text NOT NULL,               -- "mono" | "stitch" | "okra"
  account_id text NOT NULL,             -- Provider-assigned account/customer ID
  account_holder_name text,
  bank_name text,
  currency text,
  status text NOT NULL DEFAULT 'active', -- "active" | "revoked"
  linked_at timestamp DEFAULT now() NOT NULL,
  revoked_at timestamp,
  meta jsonb                            -- Raw provider response (no secrets stored)
);

CREATE INDEX IF NOT EXISTS idx_linked_ob_accounts_borrower
  ON linked_open_banking_accounts(borrower_id);

CREATE INDEX IF NOT EXISTS idx_linked_ob_accounts_status
  ON linked_open_banking_accounts(borrower_id, status);
