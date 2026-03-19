#!/bin/bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
DURATION="${2:-30}"
CONCURRENCY="${3:-50}"

echo "============================================"
echo "  Africa Credit Hub — Load Test"
echo "  Target: $BASE_URL"
echo "  Duration: ${DURATION}s | Concurrency: $CONCURRENCY"
echo "============================================"
echo ""

command -v npx >/dev/null 2>&1 || { echo "npx not found"; exit 1; }

echo "[1/4] Health endpoint baseline..."
npx autocannon -d "$DURATION" -c "$CONCURRENCY" -p 10 \
  --renderStatusCodes \
  "$BASE_URL/health" 2>/dev/null || echo "Install autocannon: npm i -g autocannon"

echo ""
echo "[2/4] Landing page (static)..."
npx autocannon -d "$DURATION" -c "$CONCURRENCY" -p 10 \
  --renderStatusCodes \
  "$BASE_URL/" 2>/dev/null || true

echo ""
echo "[3/4] API — Public chatbot..."
npx autocannon -d "$DURATION" -c 10 -p 2 \
  --renderStatusCodes \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"message":"What is Africa Credit Hub?","history":[]}' \
  "$BASE_URL/api/public/chat" 2>/dev/null || true

echo ""
echo "[4/4] API — Consumer lookup..."
npx autocannon -d "$DURATION" -c "$CONCURRENCY" -p 10 \
  --renderStatusCodes \
  "$BASE_URL/api/consumer/lookup?nationalId=TEST-000" 2>/dev/null || true

echo ""
echo "============================================"
echo "  Load test complete."
echo ""
echo "  Key metrics to document:"
echo "  - Requests/sec (Avg, p95, p99)"
echo "  - Latency (Avg, p95, p99)"
echo "  - Error rate (%)"
echo "  - Max concurrent connections before degradation"
echo "============================================"
