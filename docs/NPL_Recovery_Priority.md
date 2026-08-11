# NPL Recovery Priority Ranking Engine

> **Scope**: Operational tooling for collection teams.  
> This score is **not** a credit decision and does **not** feed into a borrower's credit file or external credit bureau report.

---

## Overview

The NPL Recovery Priority Ranking Engine assigns a transparent **0–100 priority score** and a **priority band** to each non-performing loan (NPL) case. Collection teams use the score to route work: highest-priority cases receive immediate attention, legal-track cases are escalated automatically.

---

## Scoring Factors

| Factor | Weight | Description |
|--------|-------:|-------------|
| Arrears recency | 25 pts | Days since the last payment was received |
| Collateral coverage | 30 pts | Effective collateral value ÷ outstanding principal; reduced by staleness haircut |
| Restructure history | 20 pts | Number of prior restructuring agreements |
| BoG asset classification | 15 pts | Bank of Ghana prudential classification (OLEM → LOSS) |
| Legal routing | 10 pts | Whether a legal/external-collections referral is active |
| **Total** | **100 pts** | |

---

## Arrears Recency (25 pts)

| Days since last payment | Points |
|-------------------------|-------:|
| < 30 | 0 |
| 30 – 89 | 8 |
| 90 – 179 | 16 |
| 180 – 364 | 21 |
| ≥ 365 | 25 |

---

## Collateral Coverage (30 pts)

A **staleness haircut** is applied to the appraised collateral value before computing the coverage ratio:

| Valuation age | Multiplier |
|---------------|----------:|
| ≤ 180 days | 1.00× |
| 181 – 365 days | 0.90× |
| 366 – 730 days | 0.75× |
| ≥ 731 days | 0.50× |

**Coverage ratio** = (appraised value × multiplier) ÷ outstanding principal

| Coverage ratio | Points |
|----------------|-------:|
| ≥ 1.50 | 0 |
| 1.00 – 1.49 | 8 |
| 0.75 – 0.99 | 16 |
| 0.50 – 0.74 | 22 |
| < 0.50 | 30 |

---

## Restructure History (20 pts)

| Prior restructures | Points |
|--------------------|-------:|
| 0 | 0 |
| 1 | 7 |
| 2 | 14 |
| ≥ 3 | 20 |

---

## BoG Asset Classification (15 pts)

| Classification | Points |
|----------------|-------:|
| OLEM | 3 |
| Substandard | 6 |
| Doubtful | 10 |
| Loss | 15 |

---

## Priority Bands

| Band | Score range | Notes |
|------|-------------|-------|
| **high** | ≥ 70 | Immediate recovery action required |
| **medium** | 40 – 69 | Scheduled follow-up within SLA |
| **low** | < 40 | Monitoring queue |
| **legal-track** | any | `hasLegalFlag = true` overrides band regardless of score |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/npl-cases/:id/priority` | Recalculate & store priority score |
| `GET` | `/api/npl-priority-queue` | Priority-sorted queue (paginated) |
| `GET` | `/api/npl-cases/:id/priority/history` | Audit trail for one case |

All endpoints require role `credit_officer` or above and respect organisation / country data-sovereignty scopes.

---

## Audit Trail

Every recalculation appends an immutable row to `npl_case_priority_events` containing:
- `score` — numeric score at that point in time
- `band` — band at that point in time
- `factor_breakdown` (jsonb) — individual factor scores and collateral staleness multiplier
- `calculated_by` — user who triggered the recalculation
- `calculated_at` — timestamp

The source case row (`npl_cases`) is locked with `FOR UPDATE` during recalculation to prevent concurrent score drift.

---

## Regulatory Note

This feature supports Bank of Ghana (BoG) prudential classification alignment under the Credit Reporting Act, 2007 (Act 726). The score reflects operational urgency only; it is distinct from the regulatory credit rating and from any score reported to the Ghana Credit Data Centre (GCDC).

*Requirement reference: FR-REG-16*
