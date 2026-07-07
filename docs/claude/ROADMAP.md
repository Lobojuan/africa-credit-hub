# UCH Roadmap — Missing Features vs Commercial Bureau Parity

Benchmark: what Experian / TransUnion Africa / CRB-class bureaus ship, plus BoG licensing expectations.
Informed by the July 2026 total review (`REVIEW-2026-07.md`). Order = recommended build sequence.

## NOW — Correctness before features (from the review; ~2 weeks)
These change published scores, so bundle them as **UCH Scorecard v1.1** with a changelog entry:
1. Fix broken soft-pull endpoint (I2) + inquiry filtering: consented, hard, ≤12-month only (I1)
2. Add `credit_limit` column to credit_accounts + sanitize (F1/F3) — activates the dead 15% utilization factor
3. Single `assembleScoreInputs(borrowerId)` used by report/PDF/API/dashboard/decision-rules (C1) — one borrower, one score, every surface
4. Alt-data minimum-evidence rule (F2)
5. Batch integrity: lenderInstitution derived from uploader's org (B1); scoped borrower matching, no identity overwrite (B2)
6. Affordability income fixes: periodDays/30 normalization (A1), exclude loan-disbursement/savings-withdrawal from income (A2), no PDF write-back to monthlyIncome (A3)
7. Gate XDS sandbox fallback behind NODE_ENV (C4)
8. Zod schemas on the 10 unvalidated money routes + safeErrorMessage sweep (platform P1/P2)

## NEXT — Bureau-parity features (missing entirely; ~6-8 weeks)
| Feature | What bureaus ship | UCH status | Effort |
|---|---|---|---|
| **Score reason codes (adverse action)** | 4-5 standardized codes per score, required for decline letters | Free-text factors exist; no code taxonomy, no per-factor point attribution | 1 wk |
| **Model governance pack** | Scorecard doc, version history, back-testing, PSI/drift monitoring — BoG will ask | Nothing; model isn't even versioned | 2 wk |
| **Score simulator (what-if)** | "Pay off X, score becomes Y" | Endpoint exists but unvalidated + client simulator diverges from server (C3) — unify on server engine | 3 days |
| **Trended/historical data** | 24-month payment grid per tradeline in reports | paymentHistory table exists; reports show current state only | 1 wk |
| **Automated dispute workflow** | Intake → freeze flag on tradeline → lender SLA countdown → auto-resolution letters | Disputes table + pages exist; no SLA engine, no tradeline flagging during dispute | 1.5 wk |
| **Monitoring & alerts GA** | Score-change, new-inquiry, new-tradeline alerts (exists) + weekly digest + lender-side portfolio alerts | Consumer side built; lender portfolio alerts missing | 1 wk |
| **Data quality scorecard per data provider** | Reject rates, freshness, completeness per lender; monthly report cards | command-center-dataquality page exists but unreachable (nav) and thin | 1 wk |
| **OpenAPI 3.0 spec published** | Standard for bank onboarding (Ecobank Apigee blocker) | Missing | 2 days |
| **NDPR consent endpoint** | Nigeria expansion prerequisite | Missing (Ghana DPA logic exists to replicate) | 2 days |
| **Bureau-to-bureau file format** | Metro2-style export/import for regulator-mandated portability | Batch formats exist; no standard export | 1 wk |

## LATER — Scale & polish
- Split routes.ts monolith by domain (19k lines is a review/audit liability — Ecobank flagged it)
- i18n the remaining 47 pages (regulator export pages first — French markets)
- Command-center navigation (10 orphan subroutes) or prune
- Repo hygiene: remove 4 tracked source ZIPs, 6 dead server files
- Per-country scorecard calibration (Ghana vs Nigeria default rates differ)
- ML scorecard v2 (champion/challenger against rules-based v1.1)

## Explicitly deprioritized
- PEP score weighting — keep as AML flag only (document the policy)
- Blockchain audit anchoring — marketing tier promise, revisit on demand
