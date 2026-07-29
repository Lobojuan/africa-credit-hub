# Session Log — Universal Credit Hub (historical, append-only)

> Central memory: https://github.com/Lobojuan/AI-Brain-and-Memory — read that first.

## 2026-05 → 2026-07 (consolidated history)
- Full code review + fixes: sidebar POS/Device links, playbook View buttons, South Africa card, Ghana playbook rewrite (ASCII-art quick reference), playbook-index e2e suite
- 39 TS errors root-caused to 4 missing @types packages (pdfkit, nodemailer, web-push, pdf-parse) — fixed
- Auto-fix loop live: `.claude/settings.json` Stop hook + `ts-check.py`
- PDF unreadability root-caused: Unicode box chars vs Helvetica — stripMd() sanitizers added to all 6 playbook PDF routes + storage FK fix (remote commit `1cb789b`)
- Ecobank readiness audit: OAuth2 M2M exists (`/api/external/oauth/token`), push-SSRF + monitoring IDOR already fixed. Real gaps: OpenAPI 3.0 spec, NDPR consent endpoint, timing-safe client_id prefix check (external-api.ts ~136)
- Cross-border explainer written for client Q&A (SATA agreements + consent + native IDs)

## 2026-07-07 — code-review cleanup pass
- Fixed: hardcoded localhost (tearsheet-scheduler), fake 127.0.0.1 audit IP + NaN guard (backup-service), typed helpers replacing as-any casts (distribute-timestamps), 24 session casts removed + 8 guarded non-null assertions (routes), silent notification catch now logged, watchlist audit as-any removed, 200-char cap on structured-search params, sms.ts → structured logger
- Commit `aec8bac` on `claude/production-check-WFJxR`; patch + apply script also delivered to user for managed cloud platform main
- False positive noted: pagination parseInt||1 already NaN-safe
- Environment lesson: container reset wiped node_modules mid-session → phantom tsc 6.x errors; `npm install` fixed

## 2026-07-07 (later) — total review complete + memory system live
- Memory: brain repo Lobojuan/AI-Brain-and-Memory bootstrapped (local commits; push pending GitHub App)
- Environment shift recorded: managed cloud platform RETIRED, Claude Code only, GitHub App = push path (enabled today, takes effect next session)
- Platform sweep: 112 unvalidated write endpoints (10 money/PII P1s), 67 raw error leaks, 10 orphan admin routes, 4 tracked ZIPs, 47 untranslated pages → REVIEW-2026-07.md Part A
- Scoring deep audit: utilization factor DEAD CODE (no credit_limit column), inquiry penalties unfiltered (no consent/soft/12-mo), soft-pull endpoint always 500s, score differs per surface (decisions ~100pts high), batch tampering vectors, affordability income inflation → REVIEW-2026-07.md Part B
- Fixed + committed: timing-safe OAuth client_id (e305343)
- ROADMAP.md written: NOW (Scorecard v1.1 correctness bundle) / NEXT (bureau parity: reason codes, model governance, trended data, dispute SLA, OpenAPI, NDPR) / LATER (monolith split, i18n)

## 2026-07-07 (later still) — Scorecard v1.1: fixed F1, C1, I2 (+ F3, partial I1)
- F1/F3: utilization factor now live — effectiveLimit() derives limit from originalAmount for revolving types (credit_card/overdraft/revolving/credit_line), NaN-guarded via safeAmount(); term loans excluded (correct). No DB migration needed. +2 regression tests (20/20 pass).
- C1: score parity across all surfaces — external-api.ts and dashboard.ts now include altData; decision engine (routes.ts:15790) loads real inquiries+altData instead of 0/[]. New storage.getAlternativeDataByBorrower(). Dashboard score-cache fingerprint now includes altData.
- I1 (partial): all 9 calculateCreditScore sites use shared countScorableInquiries() = hard pulls, trailing 12mo. Consent filtering deferred (needs consent_provided backfill — documented in helper).
- I2: soft-pull endpoint repaired — was `(calculateCreditScore as any)(borrower, accounts, ...)`, threw on every call; now correct signature with judgments+altData.
- Commit 8f3c4b9. TypeScript clean, 20/20 scoring tests pass.
- REMAINING scoring: F2 (alt-data empty boost), B1/B2 (batch tampering), A1-A3 (affordability income), F4/A4/A5/B3/B4/C2/C4 (medium). See REVIEW-2026-07.md Part B.

## 2026-07-07 (i18n) — corrected finding + first public page internationalized
- CORRECTED the audit's i18n claim: locale dictionaries are NOT ~50% missing. Measured leaf strings: en~2904, fr 100% (typeof en enforced), pt 98%, ar 96%, sw 98%, es 99%, zh-CN 104%, zh-TW 117%. Dictionaries essentially COMPLETE. Earlier number counted nested keys.
- REAL gap = 47/128 pages never call useTranslation → hardcoded English bypasses the complete dictionary. This is per-page extraction, not dictionary translation.
- Policy agreed: en/fr/pt/es reliable in-session; ar/sw/zh fall back to English (tracked, no unverified content ships).
- DONE: consent-respond.tsx (legal, public) fully internationalized — new `consentRespond` namespace in en/fr/pt/es, ~35 strings, 0 hardcoded left, tsc clean (fr enforced). Commit a39abf5.
- Tracker + proven per-page recipe: docs/claude/I18N-TRACKER.md. Remaining high-value public pages queued: country-selection, consumer-portal, collections, loan-origination, collateral-registry, telco-lending, papps-settlements.

## PENDING (next session picks up here)
1. PUSH EVERYTHING (branch claude/production-check-WFJxR + brain repo) — GitHub App enabled 2026-07-07, fresh session should have credentials
2. Continue Scorecard v1.1: F2 (alt-data empty boost), B1/B2 (batch tampering), A1-A3 (affordability). F1/F3/C1/I2 DONE (8f3c4b9); I1 partial (consent backfill pending)
3. Ecobank remaining: OpenAPI spec, NDPR consent endpoint
4. i18n: finish 7 remaining high-value public pages per docs/claude/I18N-TRACKER.md recipe (consent-respond DONE)
5. CVM: repo creation + Phase 1 verification → Phase 2 AI engine
5. User's PAT is in this session's history — recommend ROTATING it (it cannot be used from these sessions anyway)
