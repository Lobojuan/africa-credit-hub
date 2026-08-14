# NPL Classification Engine — Technical Documentation

**Version:** 2.8  
**Module:** `server/npl-classification-engine.ts`  
**Last Updated:** 2026-08-14

---

## 1. Overview

The NPL Classification Engine automatically classifies every credit account into:

- **IFRS 9 stages** (Stage 1, Stage 2, Stage 3) for accounting compliance
- **NPL regulatory stages** (Performing, Watchlist, Substandard, Doubtful, Loss) for regulator reporting

It runs automatically every 24 hours via scheduler, or on-demand via `POST /api/npl/classify-now`.

---

## 2. IFRS 9 Stage Logic

| Stage | Trigger | Accounting Treatment |
|-------|---------|---------------------|
| **Stage 1** | No significant increase in credit risk (SICR) | 12-month Expected Credit Loss (ECL) |
| **Stage 2** | SICR detected (30+ DPD or delinquent status) | Lifetime ECL |
| **Stage 3** | Credit impaired (90+ DPD, default, or written-off) | Lifetime ECL + interest on net carrying amount |

### SICR Detection
```typescript
const hasSicr = dpd >= 30 || status === 'delinquent';
```

### Credit Impairment
```typescript
const isCreditImpaired = status === 'default' 
                      || status === 'written_off' 
                      || dpd >= 90;
```

---

## 3. NPL Regulatory Stage Mapping (Ghana / BoG)

| DPD Range | Account Status | NPL Stage | Provision Rate |
|-----------|---------------|-----------|----------------|
| 0–29 | current | **Performing** | 1% |
| 30–59 | delinquent | **Watchlist** | 5% |
| 60–89 | delinquent | **Substandard** | 20% |
| 90–179 | default | **Doubtful** | 50% |
| 180+ | default / written_off | **Loss** | 100% |

### Status Overrides
The following account statuses always map to the specified stage regardless of DPD:
- `written_off` → **Loss**
- `default` → **Loss**

### Asset Classification Override
If the bank has manually set `bog_asset_classification` or `asset_classification` on an account, it overrides the computed stage:

| Asset Classification | NPL Stage |
|---------------------|-----------|
| performing | Performing |
| watchlist | Watchlist |
| substandard / sub-standard / npl / non-performing | Substandard |
| doubtful | Doubtful |
| loss | Loss |

---

## 4. Provision Calculation

```typescript
provisionAmount = currentBalance * provisionRate[nplStage]
```

### Example: GHS 100,000 Account

| Scenario | DPD | Status | NPL Stage | IFRS 9 | Provision |
|----------|-----|--------|-----------|--------|-----------|
| Performing | 0 | current | Performing | Stage 1 | GHS 1,000 |
| Watchlist | 35 | delinquent | Watchlist | Stage 2 | GHS 5,000 |
| Substandard | 65 | delinquent | Substandard | Stage 2 | GHS 20,000 |
| Doubtful | 95 | default | Doubtful | Stage 3 | GHS 50,000 |
| Loss | 185 | default | Loss | Stage 3 | GHS 100,000 |
| Written-off | 200 | written_off | Loss | Stage 3 | GHS 100,000 |

---

## 5. Migration Detection

A **migration** is recorded whenever an account's IFRS 9 stage or NPL stage changes between classification runs.

### Migration Types

| From | To | Type |
|------|-----|------|
| Stage 1 | Stage 2 | Deterioration (SICR) |
| Stage 2 | Stage 3 | Deterioration (Credit impaired) |
| Stage 3 | Stage 2 | Cure (Recovery) |
| Stage 2 | Stage 1 | Cure (Recovery) |
| Performing | Watchlist/Substandard/Doubtful/Loss | New NPL |

### Collection Auto-Trigger
When a migration from **Performing → non-Performing** is detected, the engine can auto-create a collection assignment if:
1. `autoTriggerCollection` is enabled (default: true)
2. The account has a positive balance
3. No existing open collection assignment exists

---

## 6. Configuration / Policy

Policies are defined per-country. Ghana uses:

```typescript
const GHANA_NPL_POLICY = {
  country: "Ghana",
  watchlistThresholdDays: 30,
  substandardThresholdDays: 60,
  doubtfulThresholdDays: 90,
  lossThresholdDays: 180,
  sicrThresholdDays: 30,        // IFRS 9 SICR trigger
  defaultThresholdDays: 90,     // IFRS 9 credit impairment
  provisionRates: {
    performing: 0.01,   // 1%
    watchlist: 0.05,    // 5%
    substandard: 0.20,  // 20%
    doubtful: 0.50,     // 50%
    loss: 1.00,         // 100%
  },
};
```

### Adding a New Country
1. Define a new `NplClassificationPolicy` object
2. Add it to the `npl_classification_policies` database table
3. Pass the country code to `runNplClassification({ country: "Nigeria" })`

---

## 7. API Endpoints

### `POST /api/npl/classify-now`
Manually triggers the classification engine. Requires admin/super_admin/lender role.

**Response:**
```json
{
  "totalAccounts": 6,
  "classificationsInserted": 6,
  "migrationsInserted": 5,
  "collectionsTriggered": 0,
  "stageBreakdown": {
    "performing": 1,
    "watchlist": 1,
    "substandard": 1,
    "doubtful": 0,
    "loss": 3
  },
  "durationMs": 45
}
```

### `GET /api/npl-early-warning`
Returns the live warning queue — accounts classified as watchlist or worse.

### `GET /api/npl-portfolio-summary`
Returns aggregated portfolio metrics (NPL ratio, coverage ratio, etc.).

### `GET /api/npl-portfolio-summary/history`
Returns historical portfolio summaries for trend analysis.

---

## 8. Database Schema

### `credit_account_classifications`
Stores the classification result for each account, per run.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| credit_account_id | varchar | FK to credit_accounts |
| borrower_id | varchar | FK to borrowers |
| ifrs9_stage | enum | stage_1 / stage_2 / stage_3 |
| npl_stage | enum | performing / watchlist / substandard / doubtful / loss |
| provision_amount | numeric | Calculated provision |
| provision_rate | numeric | Rate applied (0.01–1.00) |
| collection_triggered | boolean | Whether collection was auto-assigned |
| classified_at | timestamp | When this classification was recorded |

### `npl_migrations`
Tracks stage transitions between classification runs.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| credit_account_id | varchar | FK to credit_accounts |
| from_ifrs9_stage | enum | Previous IFRS 9 stage |
| to_ifrs9_stage | enum | New IFRS 9 stage |
| from_npl_stage | enum | Previous NPL stage |
| to_npl_stage | enum | New NPL stage |
| balance_at_migration | numeric | Balance when migration occurred |
| triggered_collection | boolean | Whether collection was auto-assigned |
| migrated_at | timestamp | When migration was recorded |

### `npl_portfolio_summaries`
Daily aggregated snapshot for dashboard and regulatory reporting.

| Column | Type | Description |
|--------|------|-------------|
| summary_date | date | Date of summary |
| gross_loan_exposure | numeric | Total outstanding balance |
| npl_exposure | numeric | Balance of substandard+doubtful+loss |
| npl_ratio | numeric | NPL exposure / gross exposure |
| coverage_ratio | numeric | Total provisions / NPL exposure |
| stage_1_exposure | numeric | Stage 1 balance |
| stage_2_exposure | numeric | Stage 2 balance |
| stage_3_exposure | numeric | Stage 3 balance |

---

## 9. Scheduler

The engine runs automatically via `startNplClassificationScheduler(intervalHours)`:

- **Default interval:** 24 hours
- **Startup behavior:** Runs immediately on server boot
- **Cleanup:** Returns a handle with `stop()` for graceful shutdown

```typescript
// In server/index.ts
const { startNplClassificationScheduler } = await import("./npl-classification-engine");
startNplClassificationScheduler();
```

---

## 10. Testing

### Unit Tests (Recommended)
Test the `classifyAccount()` function directly:

```typescript
import { classifyAccount, GHANA_NPL_POLICY } from "./npl-classification-engine";

const result = classifyAccount({
  id: "acc-1",
  borrower_id: "bor-1",
  days_in_arrears: 65,
  current_balance: 80000,
  status: "delinquent",
  // ...
}, GHANA_NPL_POLICY);

expect(result.nplStage).toBe("substandard");
expect(result.ifrs9Stage).toBe("stage_2");
expect(result.provisionAmount).toBe(16000);
```

### Manual Trigger
Use the "Run classification now" button in the NPL Early Warning UI, or call:
```bash
curl -X POST https://your-domain.com/api/npl/classify-now \
  -H "X-CSRF-Token: <token>"
```

---

## 11. Regulatory Compliance Notes

### Ghana (BoG)
- Follows BoG NPL Prudential Guidelines
- Asset classification aligns with 5-tier Ghanaian framework
- Provisions meet minimum regulatory rates

### Cross-Country Support
The engine is designed to support multiple regulatory frameworks. Each country can define:
- Custom DPD thresholds
- Custom provision rates
- Status-to-stage mappings

---

*For questions or to request a new country policy, contact the platform engineering team.*
