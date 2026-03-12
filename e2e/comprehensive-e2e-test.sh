#!/bin/bash
BASE_URL="http://localhost:5000"
COOKIE_JAR="/tmp/e2e_cookies.txt"
RESULTS_FILE="/tmp/e2e_test_results.txt"
PASS=0
FAIL=0
TOTAL=0

rm -f "$RESULTS_FILE" "$COOKIE_JAR"

log_result() {
  local test_name="$1"
  local status="$2"
  local details="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$status" = "PASS" ]; then
    PASS=$((PASS + 1))
    echo "✅ PASS: $test_name" | tee -a "$RESULTS_FILE"
  else
    FAIL=$((FAIL + 1))
    echo "❌ FAIL: $test_name — $details" | tee -a "$RESULTS_FILE"
  fi
}

api_get_code() {
  curl -s -b "$COOKIE_JAR" -o /tmp/e2e_body.txt -w "%{http_code}" "$BASE_URL$1" 2>/dev/null
}

api_get_body() {
  cat /tmp/e2e_body.txt 2>/dev/null
}

api_post_code() {
  curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST -H "Content-Type: application/json" -d "$2" -o /tmp/e2e_body.txt -w "%{http_code}" "$BASE_URL$1" 2>/dev/null
}

check_code() {
  local test_name="$1"
  local actual="$2"
  local expected="${3:-200}"
  if [ "$actual" = "$expected" ]; then
    log_result "$test_name" "PASS"
  else
    log_result "$test_name" "FAIL" "Expected HTTP $expected, got $actual"
  fi
}

check_body_contains() {
  local test_name="$1"
  local search="$2"
  if grep -q "$search" /tmp/e2e_body.txt 2>/dev/null; then
    log_result "$test_name" "PASS"
  else
    log_result "$test_name" "FAIL" "Response body missing '$search'"
  fi
}

echo "========================================" | tee "$RESULTS_FILE"
echo "  CREDIT DATA HUB — E2E TEST SUITE" | tee -a "$RESULTS_FILE"
echo "  $(date)" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

echo "--- 1. AUTHENTICATION FLOW ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/auth/me")
check_code "Unauthenticated /api/auth/me returns 401" "$code" "401"

code=$(api_post_code "/api/auth/login" '{"username":"admin","password":"wrongpassword"}')
check_code "Login with wrong password returns 401" "$code" "401"

code=$(api_post_code "/api/auth/login" '{}')
check_code "Login with empty body returns 400" "$code" "400"

code=$(api_post_code "/api/auth/login" '{"username":"admin","password":"admin0987"}')
check_code "Login with valid credentials returns 200" "$code" "200"
check_body_contains "Login response contains fullName" "fullName"
check_body_contains "Login response contains super_admin role" "super_admin"
check_body_contains "Login response shows Uffe J Carlson" "Uffe J Carlson"

code=$(api_get_code "/api/auth/me")
check_code "Authenticated /api/auth/me returns 200" "$code" "200"
check_body_contains "/api/auth/me returns user data" "username"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 2. DASHBOARD & STATS ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/dashboard/stats")
check_code "Dashboard stats endpoint returns 200" "$code" "200"
check_body_contains "Dashboard stats contains totalBorrowers" "totalBorrowers"

code=$(api_get_code "/api/dashboard/activity")
check_code "Dashboard activity endpoint returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 3. BORROWER MANAGEMENT ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/borrowers")
check_code "Borrowers list endpoint returns 200" "$code" "200"

borrower_id=$(cat /tmp/e2e_body.txt | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const b=Array.isArray(j)?j:j.borrowers||j.data||[];console.log(b[0]?.id||'')}catch{console.log('')}})" 2>/dev/null)

if [ -n "$borrower_id" ]; then
  log_result "Borrowers list returns data with IDs" "PASS"

  code=$(api_get_code "/api/borrowers/$borrower_id")
  check_code "Borrower detail endpoint returns 200" "$code" "200"
  check_body_contains "Borrower detail contains firstName" "firstName"
else
  log_result "Borrowers list returns data with IDs" "FAIL" "No borrower ID found"
fi

code=$(api_get_code "/api/borrowers?search=test")
check_code "Borrower search endpoint returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 4. CREDIT ACCOUNTS ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/credit-accounts")
check_code "Credit accounts list returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 5. SEARCH FUNCTIONALITY ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/credit-search?query=loan")
check_code "Credit search endpoint returns 200" "$code" "200"

code=$(api_get_code "/api/cross-border/search?query=test")
check_code "Cross-border search endpoint returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 6. SUPER ADMIN PAGES ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/admin/platform-stats")
check_code "Platform stats (command center) returns 200" "$code" "200"

code=$(api_get_code "/api/users")
check_code "User management list returns 200" "$code" "200"

code=$(api_get_code "/api/country-settings")
check_code "Country settings returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 7. COMPLIANCE & OPERATIONS ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/disputes")
check_code "Disputes list returns 200" "$code" "200"

code=$(api_get_code "/api/approvals")
check_code "Pending approvals returns 200" "$code" "200"

code=$(api_get_code "/api/audit-logs")
check_code "Audit trail returns 200" "$code" "200"

code=$(api_get_code "/api/consent")
check_code "Consent management returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 8. REPORTS & REGULATORY ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/reports")
check_code "Reports endpoint returns 200" "$code" "200"

code=$(api_get_code "/api/regulatory/dashboard")
check_code "Regulatory dashboard returns 200" "$code" "200"

code=$(api_get_code "/api/regulatory/compliance")
check_code "Regulatory compliance returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 9. SUPPORTING ENDPOINTS ---" | tee -a "$RESULTS_FILE"

code=$(api_get_code "/api/exchange-rates")
check_code "Exchange rates returns 200" "$code" "200"

code=$(api_get_code "/api/organizations")
check_code "Organizations returns 200" "$code" "200"

code=$(api_get_code "/api/api-keys")
check_code "API keys returns 200" "$code" "200"

code=$(api_get_code "/api/version-history")
check_code "Version history returns 200" "$code" "200"

code=$(api_get_code "/api/institutions")
check_code "Institutions returns 200" "$code" "200"

code=$(api_get_code "/api/retention-policies")
check_code "Retention policies returns 200" "$code" "200"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 10. FRONTEND PAGE LOADS ---" | tee -a "$RESULTS_FILE"

pages=(
  "/" "/borrowers" "/credit-accounts" "/search" "/reports" "/audit"
  "/users" "/approvals" "/disputes" "/institutions" "/consent"
  "/billing" "/helpdesk" "/api-keys" "/api-docs" "/help"
  "/documentation" "/exchange-rates" "/api-admin" "/retention-policies"
  "/regulatory-compliance" "/version-history" "/guide" "/organizations"
  "/about" "/portfolio-intelligence" "/credit-score-methodology"
  "/regulatory-dashboard" "/borrower-alerts" "/cross-border-agreements"
  "/cross-border-search" "/papss-settlements" "/bog-export" "/bsl-export"
  "/ghana-docs"
)

for page in "${pages[@]}"; do
  code=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  check_code "Page load: $page returns 200" "$code" "200"
done

echo "" | tee -a "$RESULTS_FILE"
echo "--- 11. ERROR HANDLING ---" | tee -a "$RESULTS_FILE"

code=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE_URL/nonexistent-page-xyz")
check_code "Unknown route returns 200 (SPA handles 404)" "$code" "200"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/borrowers")
check_code "Unauthenticated API request returns 401" "$code" "401"

echo "" | tee -a "$RESULTS_FILE"
echo "--- 12. LOGOUT FLOW ---" | tee -a "$RESULTS_FILE"

code=$(api_post_code "/api/auth/logout" '{}')
check_code "Logout endpoint returns 200" "$code" "200"

code=$(api_get_code "/api/auth/me")
check_code "After logout, /api/auth/me returns 401" "$code" "401"

echo "" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "  TEST SUMMARY" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "  Total:  $TOTAL" | tee -a "$RESULTS_FILE"
echo "  Passed: $PASS" | tee -a "$RESULTS_FILE"
echo "  Failed: $FAIL" | tee -a "$RESULTS_FILE"
if [ "$FAIL" -eq 0 ]; then
  echo "  Status: ALL TESTS PASSED ✅" | tee -a "$RESULTS_FILE"
else
  echo "  Status: SOME TESTS FAILED ❌" | tee -a "$RESULTS_FILE"
fi
echo "========================================" | tee -a "$RESULTS_FILE"
