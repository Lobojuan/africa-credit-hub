#!/usr/bin/env bash
# Checks the real customer-facing UCH route. Exit non-zero on any condition
# that means the application or PostgreSQL database is not ready.
set -Eeuo pipefail

readonly PUBLIC_BASE_URL="${1:-${UCH_PUBLIC_BASE_URL:-https://universalcredithub.com}}"
readonly HEALTH_URL="${PUBLIC_BASE_URL%/}/api/health"

echo "Checking UCH health at ${HEALTH_URL}"
curl --fail --silent --show-error --max-time 20 "$HEALTH_URL" | node -e '
  let body = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { body += chunk; });
  process.stdin.on("end", () => {
    try {
      const health = JSON.parse(body);
      if (health.status !== "healthy" || health.checks?.database?.status !== "ok") {
        throw new Error("application or database readiness was not confirmed");
      }
      console.log(`UCH healthy; database latency: ${health.checks.database.latencyMs ?? "unknown"}ms`);
    } catch (error) {
      console.error(`UCH health check failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
'
