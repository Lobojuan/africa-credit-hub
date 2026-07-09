# Known Issues — africa-credit-hub

Status legend: OPEN / FIXED(date) / FALSE-POSITIVE

## Security / correctness
| # | Issue | Where | Status |
|---|-------|-------|--------|
| 1 | `keyPrefix.startsWith(client_id)` not timing-safe | server/external-api.ts ~136 | FIXED 2026-07-07 (e305343 — same commit as #15 below; this row was a stale duplicate, verified no other client_id comparison site exists anywhere in the codebase) |
| 2 | No OpenAPI 3.0 spec — blocks Ecobank Apigee onboarding | — | OPEN |
| 3 | No NDPR (Nigeria) consent endpoint | — | OPEN (Ghana DPA consent logic exists to replicate) |
| 4 | Zod validation inconsistent across write endpoints (36 parse calls, many raw req.body) | server/routes.ts | PARTIAL — 10 P1 money/PII endpoints fixed 2026-07-09; broader endpoint-by-endpoint audit still open |
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
| I1 | HIGH | All inquiries penalize score — no consent/soft/12-mo filter | PARTIAL 2026-07-09 — soft+12mo filtering fixed 2026-07-07 (8f3c4b9). The write-path bug is now fixed too: POST /api/credit-inquiries used to accept `consentProvided` as arbitrary client input (self-declarable by the requesting lender, zero verification); it's now derived server-side from an actual approved/non-expired/institution-bound ConsentRecord (hasVerifiedConsent in routes.ts), matching the credit-report consent gate. Scoring filter itself still NOT enabled — every historical inquiry has consentProvided=false (the pre-fix default), so flipping the filter on today would silently exclude ~all existing inquiries from every score at once. That's a data-migration + scorecard-versioning decision, not a code fix. |
| I2 | HIGH | Soft-pull endpoint 500s — shifted args hidden by as-any | FIXED 2026-07-07 (8f3c4b9) |
| C1 | HIGH | Different scores per surface; decisions run ~100pts high | FIXED 2026-07-07 (8f3c4b9 — altData on all surfaces, shared inquiry count) |
| F2 | HIGH | Empty alt-data rows grant +64 boost | FIXED 2026-07-09 — the literal "assumed 80% on-time" bug no longer reproduced against main (verified via git blame before touching anything); fixed the real adjacent gap instead: added a 3-transaction minimum-evidence threshold and clamped onTimePayments to [0, totalTransactions] so inconsistent source data can't produce an unbounded ratio/bonus |
| B1 | HIGH | Cross-lender tradeline tampering via batch upload | FIXED 2026-07-09 — lenderInstitution now derived from the uploader's own org, not trusted request-body text |
| B2 | HIGH | Batch identity overwrite via global nationalId match | FIXED 2026-07-09 — matching now scoped by country; identity fields (name/phone/DOB) only fill in when blank, conflicts surfaced for review instead of silently applied |
| A1-A3 | HIGH | Affordability income inflation trio | FIXED 2026-07-09 — A1: income/expenses now share one periodDays/30 denominator instead of independently-derived, disagreeing transaction-gap spans. A2: loan-disbursement/savings-withdrawal credits excluded from income classification. A3: bank_statement_pdf removed from the auto-write-back trust set (PDF income still feeds the assessment's own DTI, just never silently overwrites borrower.monthlyIncome) |
| F3 | MEDIUM | creditLimit NaN zeroes utilization | FIXED 2026-07-07 (8f3c4b9 — safeAmount guard) |
| F4 | MEDIUM | ≤50% invalid account rows silently dropped (raised score) vs >50% → hard floor of 300; incoherent asymmetry | FIXED 2026-07-09 — invalid-status accounts now count against the payment-history ratio's denominator instead of being excluded, so bad data quality degrades the score smoothly/monotonically instead of as a cliff-edge special case (verified 0%→100% invalid no longer jumps) |
| A4 | MEDIUM | Multi-currency transactions summed without conversion | FIXED 2026-07-09 — added normaliseTxnCurrency(), converts every transaction into the assessment currency via stored FX rates (direct pair or one USD hop) before any income/expense math runs; unconvertible transactions are excluded rather than summed as same-currency |
| A5 | MEDIUM | LLM JSON extraction greedy-regex `/{[\s\S]*}/` — trailing brace in model output discards whole statement silently; no bounds on hallucinated amounts | FIXED 2026-07-09 — replaced with a proper brace-depth scan (extractJsonObject) that also skips braces inside string values; added a 1B upper bound on individual transaction amounts |
| B3 | MEDIUM | Batch updates bypass the maker-checker approval that single-account PATCH enforces | FIXED 2026-07-09 — batch *updates* to existing accounts (not new-tradeline inserts) now create one pendingApproval covering the whole update batch instead of writing directly; verified live end-to-end including the maker/checker self-approval guard |
| B4 | MEDIUM | `isValidMappingId` regex unanchored — legit IDs starting "NA"/"LB" rejected as synthetic | FIXED 2026-07-09 — anchored both ends, bounded the digit run to what the codebase's own placeholder generator actually produces; verified real IDs like "LB19850315F0021" and "NA202501234567" no longer rejected while actual placeholders like "BATCH-001" still are |
| C2 | MEDIUM | Account dedup only on the lender report path (by lowercased accountNumber) — other surfaces double-count duplicates | FIXED 2026-07-09 — moved dedup into storage.getCreditAccountsByBorrower itself so all ~25 callers (scoring, affordability, dashboards, external API) get the same deduped set |
| C4 | MEDIUM | XDS Ghana sandbox fallback (deterministic FAKE bureau data) reachable in production | FIXED 2026-07-09 — disabled when NODE_ENV=production and credentials are missing |
| 15 | FIXED | Timing-safe client_id in OAuth token endpoint | FIXED 2026-07-07 (e305343) |

### Remaining LOW severity (not yet addressed)
F5 (PEP flag has zero score effect — confirm as documented policy), F6 (closed-in-arrears counts as clean history), A6 (two incompatible DTI definitions), A7 (narration misclassification edge cases), B5 (garbage arrears CSV → "performing"), B6 (orphan thin-file borrowers on partial batch failure), I3 (appealed judgments cost nothing), C3 (client score simulator can't match server for alt-data borrowers). See REVIEW-2026-07.md Part B.

## Historic (fixed earlier, keep for context)
- 39 TS errors = 4 missing @types packages (2026-05)
- Playbook PDFs unreadable = Unicode box chars vs Helvetica (2026-05/07, stripMd sanitizers)
- /loto-pos + /loto/admin/devices unreachable (sidebar entries added)
- Playbook View button hardcoded to Ghana (per-market viewUrl)
