#!/usr/bin/env bash
# UCH production release runner. Execute as the restricted `deploy` account.
# Database and schema changes are intentionally blocked here: release them
# separately after a verified backup and an approved migration plan.
set -Eeuo pipefail

readonly APP_DIR="/opt/uch"
readonly SERVICE="uch.service"
readonly HEALTH_URL="http://127.0.0.1:5000/api/health"
readonly PUBLIC_BASE_URL="${UCH_PUBLIC_BASE_URL:-${CANONICAL_URL:-https://universalcredithub.com}}"
readonly PUBLIC_HEALTH_URL="${PUBLIC_BASE_URL%/}/api/health"
readonly TARGET_COMMIT="${1:?Usage: deploy-production.sh <approved-commit-sha>}"

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
git merge-base --is-ancestor "$TARGET_COMMIT" origin/main

if git diff --name-only "$previous_commit" "$TARGET_COMMIT" | grep -Eq '^(migrations/|shared/schema\.ts$)'; then
  echo "Schema or migration change detected. Stop: take a database backup and run the approved migration procedure separately." >&2
  exit 20
fi

git reset --hard "$TARGET_COMMIT"
# Runtime data is deliberately outside Git but lives below the release root.
# Never let a source cleanup remove uploaded evidence or database backups.
git clean -ffd -e uploads/ -e backups/
npm ci --no-audit --no-fund --silent
npm run build --silent

sudo /bin/systemctl restart "$SERVICE"
sleep 5
assert_healthy "$HEALTH_URL"
# This verifies the complete customer-facing route: DNS/TLS, Caddy, the UCH
# process and PostgreSQL. A private loopback check alone cannot prove that a
# bank can reach the application after a release.
assert_healthy "$PUBLIC_HEALTH_URL"
sudo /bin/systemctl is-active --quiet "$SERVICE"
trap - ERR
echo "UCH release complete: ${TARGET_COMMIT}"
