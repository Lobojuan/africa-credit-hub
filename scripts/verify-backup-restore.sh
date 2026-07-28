#!/usr/bin/env bash
# Restore a UCH PostgreSQL dump into an isolated drill database and verify it
# is queryable. This script intentionally refuses production-looking targets.
set -Eeuo pipefail

readonly BACKUP_FILE="${1:?Usage: verify-backup-restore.sh <backup.sql.gz> <isolated-database-url>}"
readonly TARGET_DATABASE_URL="${2:?Usage: verify-backup-restore.sh <backup.sql.gz> <isolated-database-url>}"
readonly TARGET_DATABASE_NAME="$(node -e 'const url = new URL(process.argv[1]); process.stdout.write(url.pathname.replace(/^\//, ""));' "$TARGET_DATABASE_URL")"

if [[ ! -f "$BACKUP_FILE" || "$BACKUP_FILE" != *.sql.gz ]]; then
  echo "Backup must be an existing .sql.gz file." >&2
  exit 2
fi

if [[ ! "$TARGET_DATABASE_NAME" =~ (^|[_-])(restore|drill|staging|e2e|test)([_-]|$) ]]; then
  echo "Refusing target database '$TARGET_DATABASE_NAME': use an explicitly isolated restore/drill/staging/e2e/test database." >&2
  exit 3
fi

if [[ -n "${DATABASE_URL:-}" && "$TARGET_DATABASE_URL" == "$DATABASE_URL" ]]; then
  echo "Refusing to use DATABASE_URL as the restore target." >&2
  exit 4
fi

gzip --test -- "$BACKUP_FILE"
echo "Archive integrity check passed. Restoring into isolated database '$TARGET_DATABASE_NAME'..."
gunzip -c -- "$BACKUP_FILE" | psql "$TARGET_DATABASE_URL" --set ON_ERROR_STOP=1
psql "$TARGET_DATABASE_URL" --no-psqlrc --tuples-only --no-align --command 'SELECT 1' | grep -qx '1'
echo "Restore drill passed: PostgreSQL accepted queries on '$TARGET_DATABASE_NAME'."
