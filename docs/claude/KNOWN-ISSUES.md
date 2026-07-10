# Known Issues — africa-credit-hub

Status legend: OPEN / FIXED(date) / FALSE-POSITIVE

## Security / correctness
| # | Issue | Where | Status |
|---|-------|-------|--------|
| 1 | `keyPrefix.startsWith(client_id)` not timing-safe | server/external-api.ts ~136 | OPEN (low risk, bank due-diligence flag) |
| 2 | No OpenAPI 3.0 spec — blocks Ecobank Apigee onboarding | — | OPEN |
| 3 | No NDPR (Nigeria) consent endpoint | — | OPEN (Ghana DPA consent logic exists to replicate) |
| 4 | Zod validation inconsistent across write endpoints (36 parse calls, many raw req.body) | server/routes.ts | OPEN (audit as part of total review) |
| 5 | routes.ts is a ~19k-line monolith | server/routes.ts | OPEN (split by domain — roadmap) |
| 6 | Hardcoded localhost in tearsheet scheduler | tearsheet-scheduler.ts | FIXED 2026-07-07 (env override) |
| 7 | Fake 127.0.0.1 IP in backup audit logs | backup-service.ts | FIXED 2026-07-07 ('system') |
| 8 | as-any DB result casts crash-prone | distribute-timestamps.ts | FIXED 2026-07-07 (typed helpers) |
| 9 | Silent catch on reviewer notifications | routes.ts ~1469 | FIXED 2026-07-07 (logged) |
| 10 | Unbounded search identifier inputs reaching audit trail | routes.ts structured-search | FIXED 2026-07-07 (200-char cap) |
| 11 | console.* in sms.ts | sms.ts | FIXED 2026-07-07 (structured logger) |
| 12 | Consumer monitoring IDOR claim (Ecobank report) | storage.ts | FALSE-POSITIVE — queries scope by consumerAccountId |
| 13 | Push subscription SSRF claim | routes.ts 18720 | FALSE-POSITIVE — isSafeWebhookUrl applied |
| 14 | Pagination NaN claim | routes.ts ~1577 | FALSE-POSITIVE — parseInt()||default is NaN-safe |

## Scoring core (July 2026 deep audit — full detail in REVIEW-2026-07.md Part B)
| ID | Severity | One-liner | Status |
|---|---|---|---|
| F1 | CRITICAL | Utilization factor dead code — no credit_limit column | FIXED 2026-07-07 (8f3c4b9 — effectiveLimit from originalAmount for revolving) |
| I1 | HIGH | All inquiries penalize score — no consent/soft/12-mo filter | PARTIAL 2026-07-07 (8f3c4b9 — soft+12mo filtered via countScorableInquiries; consent filter still pending data backfill) |
| I2 | HIGH | Soft-pull endpoint 500s — shifted args hidden by as-any | FIXED 2026-07-07 (8f3c4b9) |
| C1 | HIGH | Different scores per surface; decisions run ~100pts high | FIXED 2026-07-07 (8f3c4b9 — altData on all surfaces, shared inquiry count) |
| F2 | HIGH | Empty alt-data rows grant +64 boost | FIXED 2026-07-09 (two bonus paths in credit-score.ts both had the gap — thin-file path had the literal 0.8 default described, with-accounts path had no minimum-sample floor at all; MIN_ALT_TXNS_PER_SOURCE=5 added to both; +2 regression tests) |
| B1 | HIGH | Cross-lender tradeline tampering via batch upload | FIXED 2026-07-09 (resolveTrustedLenderInstitution — "lender" role sessions can no longer set arbitrary lenderInstitution text; forced to their own org name. "admin" role retains free-text for legitimate multi-institution regulatory uploads) |
| B2 | HIGH | Batch identity overwrite via global nationalId match | FIXED 2026-07-09 (findOrCreateBatchBorrower: primary nationalId match now scoped by country when known; name/address/phone/DOB no longer blindly overwritten — conflicting values reject the row as IDENTITY_CONFLICT for manual review instead of silently rewriting someone else's identity) |
| A1-A3 | HIGH | Affordability income inflation trio | FIXED 2026-07-10 (A1: classifyIncome/categoriseExpenses now share one periodMonths denominator computed over the full statement span, replacing separate credits-only/debits-only spans that overstated income by an N/(N-1) factor and mismatched the two sides of disposableIncome. A2: loan_disbursement/savings_withdrawal credits excluded from income candidates via category+keyword match. A3: bank_statement_pdf removed from the verified-income write-back trustedSources — a fabricated PDF can no longer permanently overwrite borrower.monthlyIncome; open_banking/hybrid remain trusted. +5 regression tests) |
| F3 | MEDIUM | creditLimit NaN zeroes utilization | FIXED 2026-07-07 (8f3c4b9 — safeAmount guard) |
| F4,A4,A5,B3,B4,C2,C4 | MEDIUM | See review Part B | OPEN |
| 15 | FIXED | Timing-safe client_id in OAuth token endpoint | FIXED 2026-07-07 (e305343) |

## Historic (fixed earlier, keep for context)
- 39 TS errors = 4 missing @types packages (2026-05)
- Playbook PDFs unreadable = Unicode box chars vs Helvetica (2026-05/07, stripMd sanitizers)
- /loto-pos + /loto/admin/devices unreachable (sidebar entries added)
- Playbook View button hardcoded to Ghana (per-market viewUrl)
