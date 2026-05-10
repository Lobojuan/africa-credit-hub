-- Migration: Add per-user product access restriction
-- Adds allowed_products column to users table.
-- NULL = unrestricted (sees all products).
-- Non-null array = user is limited to only those product IDs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_products text[];

-- Restrict the shared 'admin' demo account to credit bureau only
-- so clients testing credit scoring cannot see Loto Fiscal or Collateral Registry.
UPDATE users SET allowed_products = ARRAY['credit'] WHERE username = 'admin' AND allowed_products IS NULL;
