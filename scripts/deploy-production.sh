#!/usr/bin/env bash
# UCH production release runner. Execute as the restricted `deploy` account.
# Database and schema changes require an exact-commit approval marker created
# only after a verified backup and the reviewed migrations have been applied.
set -Eeuo pipefail

readonly APP_DIR="/opt/uch"
readonly SERVICE="uch.service"
readonly HEALTH_URL="http://127.0.0.1:5000/api/health"
readonly PUBLIC_BASE_URL="${UCH_PUBLIC_BASE_URL:-${CANONICAL_URL:-https://universalcredithub.com}}"
readonly PUBLIC_HEALTH_URL="${PUBLIC_BASE_URL%/}/api/health"
readonly TARGET_COMMIT="${1:?Usage: deploy-production.sh <approved-commit-sha>}"
readonly SCHEMA_APPROVAL_DIR="${UCH_SCHEMA_APPROVAL_DIR:-/home/deploy/.uch-schema-approvals}"

cd "$APP_DIR"
previous_commit="$(git rev-parse HEAD)"

rollback() {
  local exit_code=$?
  trap - ERR
  echo "Release failed; restoring ${previous_commit}." >&2
  git reset --hard "$previous_commit"
  npm ci --no-audit --no-fund --silent
  npm run build --silent
  sudo /bin/systemctl restart "$SERVICE" || true
  exit "$exit_code"
}
trap rollback ERR

assert_healthy() {
  local url="$1"
  curl --fail --silent --show-error --max-time 15 "$url" | node -e '
    let body = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { body += chunk; });
    process.stdin.on("end", () => {
      try {
        const health = JSON.parse(body);
        if (health.status !== "healthy" || health.checks?.database?.status !== "ok") {
          throw new Error("health endpoint did not confirm database readiness");
        }
      } catch (error) {
        console.error(`Health check failed for ${process.argv[1]}: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  ' "$url"
}

git fetch --prune origin main
git cat-file -e "${TARGET_COMMIT}^{commit}"
resolved_target_commit="$(git rev-parse "${TARGET_COMMIT}^{commit}")"
git merge-base --is-ancestor "$resolved_target_commit" origin/main

if git diff --name-only "$previous_commit" "$resolved_target_commit" | grep -Eq '^(db/migrations/|migrations/|shared/schema\.ts$)'; then
  approval_file="${SCHEMA_APPROVAL_DIR}/${resolved_target_commit}"
  if [[ ! -f "$approval_file" ]]; then
    echo "Schema or migration change detected. Stop: take and verify a database backup, apply the reviewed migrations, then create ${approval_file}." >&2
    exit 20
  fi
  approved_sha="$(tr -d '[:space:]' < "$approval_file")"
  if [[ "$approved_sha" != "$resolved_target_commit" ]]; then
    echo "Schema approval marker does not match the requested release commit." >&2
    exit 21
  fi
  echo "Verified schema approval marker for ${resolved_target_commit}."
fi

git reset --hard "$resolved_target_commit"
# Runtime data is deliberately outside Git but lives below the release root.
# Never let a source cleanup remove uploaded evidence or database backups.
git clean -ffd -e uploads/ -e backups/
npm ci --no-audit --no-fund --silent
npm run build --silent
# The build embeds the release SHA in the generated runtime artifacts. Restore
# the tracked source copies afterwards so production remains a clean Git clone;
# the already-built dist output keeps the exact deployed release metadata.
git restore --worktree -- client/src/generated/version-history.ts docs/Version_History.md

sudo /bin/systemctl restart "$SERVICE"
sleep 5
assert_healthy "$HEALTH_URL"
# This verifies the complete customer-facing route: DNS/TLS, Caddy, the UCH
# process and PostgreSQL. A private loopback check alone cannot prove that a
# bank can reach the application after a release.
assert_healthy "$PUBLIC_HEALTH_URL"
sudo /bin/systemctl is-active --quiet "$SERVICE"
trap - ERR
echo "UCH release complete: ${resolved_target_commit}"
