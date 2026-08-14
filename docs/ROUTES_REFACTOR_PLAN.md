# Routes.ts Refactoring Plan

**Status:** Planned (not yet executed)  
**File:** `server/routes.ts` (22,369 lines, 475 routes)  
**Goal:** Split into domain-specific router files for bank auditability

---

## Why This Matters for the Bank

A 22,000-line monolithic routes file is impossible for a bank's security team to audit. Regulators (BoG, CBK, CBN) expect:
- **Modular code** — each domain in its own file
- **Reviewable diffs** — small PRs, not 500-line changes
- **Clear ownership** — each module owned by a specific team member

---

## Current State

```
server/routes.ts ................................ 22,369 lines
├── Imports ..................................... ~120 lines
├── Helpers (requireAuth, requireRole, etc.) .... ~350 lines  
├── Test routes ................................. ~50 lines
├── Health/status routes ........................ ~100 lines
├── Admin routes ................................ ~1,200 lines (38 routes)
├── Platform control routes .................... ~1,000 lines (32 routes)
├── Consumer routes ............................. ~1,000 lines (32 routes)
├── Borrower routes ............................. ~1,500 lines (25 routes)
├── Credit account routes ....................... ~800 lines (17 routes)
├── Credit inquiry routes ....................... ~600 lines (14 routes)
├── Compliance/fraud routes ..................... ~700 lines (18 routes)
├── Regulatory routes ........................... ~500 lines (10 routes)
├── Collateral routes ........................... ~900 lines (22 routes)
├── Cross-product routes ........................ ~800 lines (20 routes)
├── Loto routes ................................. ~700 lines (17 routes)
├── Batch upload routes ......................... ~500 lines (14 routes)
├── AI routes ................................... ~400 lines (12 routes)
├── Trace routes ................................ ~350 lines (11 routes)
├── Collections routes .......................... ~300 lines (10 routes)
├── SATA routes ................................. ~250 lines (9 routes)
├── Export routes ............................... ~200 lines (8 routes)
├── ... (many more) ............................. ~8,000 lines
```

---

## Target Architecture

```
server/routes.ts ................................ ~500 lines (coordinator only)
server/routes/
├── index.ts .................................... Re-exports registerRoutes
├── middleware.ts ............................... Already extracted ✅
├── auth.ts ..................................... Already extracted ✅
├── users.ts .................................... Already extracted ✅
├── dashboard.ts ................................ Already extracted ✅
├── telco.ts .................................... Already extracted ✅
├── wallet.ts ................................... Already extracted ✅
├── webauthn.ts ................................. Already extracted ✅
├── loto-admin.ts ............................... Already extracted ✅
├── loto-merchant-credit.ts ..................... Already extracted ✅
├── loto-fiscal.ts .............................. Already extracted ✅
├── regulatory-controls-router.ts ............... Already extracted ✅
├── platform-control.ts ......................... Already extracted ✅
├── oauth.ts .................................... Already extracted ✅
├── saml.ts ..................................... Already extracted ✅
├── npl-portfolio.ts ............................ Already extracted ✅
├── npl-reduction-plan.ts ....................... Already extracted ✅
├── npl-case-ledger.ts .......................... Already extracted ✅
├── npl-decision-governance.ts .................. Already extracted ✅
├── loan-tape-reconciliation.ts ................. Already extracted ✅
├── test-routes.ts .............................. NEW — E2E test endpoints
├── health-routes.ts ............................ NEW — health, status, heartbeat
├── admin-routes.ts ............................. NEW — admin, platform metrics
├── borrower-routes.ts .......................... NEW — borrowers, guarantors, related
├── credit-account-routes.ts .................... NEW — credit accounts
├── credit-inquiry-routes.ts .................... NEW — credit inquiries, reports
├── compliance-routes.ts ........................ NEW — fraud, compliance, forgery
├── regulatory-routes.ts ........................ NEW — prudential, evidence packs
├── consumer-routes.ts .......................... NEW — consumer portal
├── collateral-routes.ts ........................ NEW — collateral registry
├── cross-product-routes.ts ..................... NEW — consents, gateway
├── loto-routes.ts .............................. NEW — lottery, draws
├── batch-routes.ts ............................. NEW — batch upload, queue
├── ai-routes.ts ................................ NEW — AI endpoints
├── trace-routes.ts ............................. NEW — skip tracing
├── collection-routes.ts ........................ NEW — collections
├── sata-routes.ts .............................. NEW — cross-border
├── export-routes.ts ............................ NEW — BOG, CBK, CBN exports
├── sales-routes.ts ............................. NEW — contact sales, trial
└── search-routes.ts ............................ NEW — global search, fuzzy match
```

---

## Step-by-Step Execution Plan

### Phase 1: Low-Risk Extractions (Week 1)

1. **Extract `test-routes.ts`**
   - Lines ~550-700 in routes.ts
   - Self-contained, only used in E2E
   - Risk: LOW

2. **Extract `health-routes.ts`**
   - Lines ~785-900 in routes.ts
   - Simple health, status, heartbeat endpoints
   - Risk: LOW

3. **Extract `sales-routes.ts`**
   - Lines ~3095-3150 in routes.ts
   - Contact sales, trial registration
   - Risk: LOW

### Phase 2: Core Domain Extractions (Week 2)

4. **Extract `borrower-routes.ts`**
   - 25 routes scattered across the file
   - **Challenge:** Routes are NOT contiguous — interleaved with credit-accounts, inquiries, etc.
   - **Approach:** Extract each borrower block individually, then consolidate
   - Risk: MEDIUM

5. **Extract `credit-account-routes.ts`**
   - 17 routes
   - Similar scattering issue
   - Risk: MEDIUM

6. **Extract `consumer-routes.ts`**
   - 32 routes
   - Mostly contiguous (lines ~3117-~4000)
   - Risk: MEDIUM

### Phase 3: Regulatory & Compliance (Week 3)

7. **Extract `compliance-routes.ts`**
   - Fraud, compliance queue, forgery review
   - Risk: MEDIUM

8. **Extract `regulatory-routes.ts`**
   - Prudential snapshots, evidence packs
   - Risk: MEDIUM

9. **Extract `export-routes.ts`**
   - BOG, CBK, CBN, BSL exports
   - Risk: LOW-MEDIUM

### Phase 4: Cleanup (Week 4)

10. **Consolidate remaining routes**
    - AI, batch, collateral, collections, cross-product, loto, sata, trace, webhooks
    - Risk: MEDIUM

11. **Delete old inline routes from routes.ts**
    - After all extractions verified
    - Risk: HIGH (do this last)

12. **Update imports in routes.ts**
    - Clean up unused imports
    - Risk: LOW

---

## Critical Dependencies to Manage

When extracting routes, each new file will need access to:

```typescript
// Common imports needed by almost every route file
import { Express, Request, Response } from "express";
import { db, pool } from "../db";
import { createLogger } from "../logger";
import {
  requireAuth, requireRole, requireSuperAdmin,
  enforceDataSovereignty, safeErrorMessage,
} from "./middleware";
import { storage } from "../storage";
```

**Solution:** Create a `server/routes/common.ts` that re-exports all common dependencies:

```typescript
// server/routes/common.ts
export { db, pool } from "../db";
export { createLogger } from "../logger";
export {
  requireAuth, requireRole, requireSuperAdmin,
  enforceDataSovereignty, safeErrorMessage,
} from "./middleware";
export { storage } from "../storage";
```

---

## Testing Strategy

After EACH extraction:
1. Run `npm run build` — must pass
2. Run `npm run test` — must pass
3. Run E2E tests for affected domains
4. Manual smoke test of extracted endpoints

---

## Estimated Effort

| Phase | Routes | Estimated Time | Risk |
|-------|--------|---------------|------|
| Phase 1 | 3 files | 4 hours | LOW |
| Phase 2 | 3 files | 12 hours | MEDIUM |
| Phase 3 | 3 files | 8 hours | MEDIUM |
| Phase 4 | 5 files | 8 hours | MEDIUM-HIGH |
| **Total** | **14 files** | **~32 hours** | **Manageable with testing** |

---

## Recommendation

**Do NOT execute this refactoring right before the bank pilot.** The risk of introducing regressions is too high.

**Recommended timeline:**
- **Before pilot:** Complete Phase 1 only (test-routes, health-routes, sales-routes) — 4 hours, low risk
- **During pilot:** Freeze code, monitor for issues
- **After pilot:** Execute Phases 2-4 over 3-4 weeks

---

## Proof of Concept

See `server/routes/test-routes.ts` for a working example of an extracted route file.

```typescript
// server/routes/test-routes.ts
import { Express } from "express";

export function registerTestRoutes(app: Express) {
  // E2E test endpoints
  app.post("/api/test/set-session", ...);
  app.get("/api/test/get-session", ...);
}
```

And in `server/routes.ts`:
```typescript
import { registerTestRoutes } from "./routes/test-routes";
// ...
registerTestRoutes(app);
```

---

*Document created: 2026-08-14*
