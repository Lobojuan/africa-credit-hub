#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/db-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ach_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting database backup..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: $BACKUP_FILE ($SIZE)"

find "$BACKUP_DIR" -name "ach_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
REMAINING=$(ls -1 "$BACKUP_DIR"/ach_backup_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date -Iseconds)] Cleanup done. $REMAINING backups retained (${RETENTION_DAYS}-day retention)."

echo ""
echo "=== RESTORE INSTRUCTIONS ==="
echo "To restore this backup:"
echo "  gunzip -c $BACKUP_FILE | psql \$DATABASE_URL"
echo ""
echo "To restore to a specific point:"
echo "  gunzip -c $BACKUP_FILE | psql <target_database_url>"
echo ""
echo "IMPORTANT: Always test restore on a staging database first."
