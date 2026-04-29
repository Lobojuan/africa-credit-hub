-- Loto Fiscal — TIN/NIF capture on consumer messaging prefs (Task #286 follow-up).
-- Adds an optional fiscal_code column populated by the USSD "Register TIN"
-- flow so back-office can attribute receipts that were issued against the
-- same TIN before the consumer first registered.
ALTER TABLE "loto_consumer_messaging_prefs"
  ADD COLUMN IF NOT EXISTS "fiscal_code" text;
