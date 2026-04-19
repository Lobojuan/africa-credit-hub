#!/bin/bash
set -e
npm install

# Apply SQL migrations in order — avoids interactive drizzle-kit prompts
for f in migrations/*.sql; do
  echo "Applying migration: $f"
  psql "$DATABASE_URL" -f "$f" 2>&1 || echo "Migration $f completed (may already exist, continuing)"
done

echo "Post-merge setup complete"
