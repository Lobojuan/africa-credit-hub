#!/bin/bash
set -euo pipefail

echo "============================================"
echo "  Universal Credit Hub — Pre-Deploy Validation"
echo "============================================"
echo ""

ERRORS=0
WARNINGS=0

step() { echo "[$1] $2"; }
pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  ⚠ $1"; WARNINGS=$((WARNINGS + 1)); }

step "1/6" "TypeScript type checking..."
if npx tsc --noEmit 2>/dev/null; then
  pass "No type errors"
else
  fail "TypeScript errors found — run 'npx tsc --noEmit' for details"
fi

step "2/6" "Checking required environment variables..."
REQUIRED_VARS="DATABASE_URL SESSION_SECRET"
for var in $REQUIRED_VARS; do
  if [ -z "${!var:-}" ]; then
    fail "Missing required env var: $var"
  else
    pass "$var is set"
  fi
done

OPTIONAL_VARS="SMTP_HOST SMTP_USER SMTP_PASS SENDGRID_API_KEY"
for var in $OPTIONAL_VARS; do
  if [ -z "${!var:-}" ]; then
    warn "Optional env var not set: $var"
  else
    pass "$var is set"
  fi
done

step "3/6" "Database connectivity..."
if node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});p.query('SELECT 1').then(()=>{console.log('ok');p.end()}).catch(e=>{console.error(e.message);process.exit(1)})" 2>/dev/null; then
  pass "Database connected"
else
  fail "Cannot connect to database"
fi

step "4/6" "Build check..."
if [ -d "dist" ]; then
  pass "Build artifacts exist (dist/)"
else
  warn "No dist/ directory — run build before deploying"
fi

step "5/6" "Critical files check..."
CRITICAL_FILES="server/index.ts server/routes.ts server/db.ts shared/schema.ts client/src/App.tsx"
for f in $CRITICAL_FILES; do
  if [ -f "$f" ]; then
    pass "$f exists"
  else
    fail "Missing critical file: $f"
  fi
done

step "6/6" "Security checks..."
if grep -r "admin123" server/ client/src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -1 | grep -q .; then
  warn "Hardcoded test credentials found in source"
else
  pass "No hardcoded test credentials"
fi

if grep -r "console\.log.*password\|console\.log.*secret\|console\.log.*token" server/ --include="*.ts" -l 2>/dev/null | head -1 | grep -q .; then
  warn "Potential secret logging found"
else
  pass "No obvious secret logging"
fi

echo ""
echo "============================================"
echo "  Results: $ERRORS errors, $WARNINGS warnings"
echo "============================================"

if [ $ERRORS -gt 0 ]; then
  echo "  BLOCKED — Fix errors before deploying."
  exit 1
else
  if [ $WARNINGS -gt 0 ]; then
    echo "  READY (with warnings) — Review warnings above."
  else
    echo "  ALL CLEAR — Ready to deploy."
  fi
  exit 0
fi
