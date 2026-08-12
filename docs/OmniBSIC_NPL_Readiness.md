# OmniBSIC NPL Remediation Readiness

**Assessment date:** 11 August 2026
**Purpose:** Define what UCH can prove in a controlled OmniBSIC pilot and what remains bank-dependent.

## Executive position

UCH is ready to demonstrate a controlled NPL diagnostic and remediation operating layer. It is not yet truthful to call an OmniBSIC production connection complete because no OmniBSIC loan tape, policy set, reporting-currency reconciliation, security approval or core-banking contract has been validated in UCH.

The platform can now calculate the scoped gross-NPL target gap, prevent unsafe multi-currency aggregation, place facilities into early-warning and collections workflows, govern a dated Board reduction plan, calculate draft ECL under an independently approved policy, review collateral and preserve regulatory evidence.

## Capability and acceptance boundary

| Workstream | UCH capability now | Required before OmniBSIC reliance |
|---|---|---|
| Portfolio baseline | Transparent gross-NPL numerator, gross-loan denominator, watchlist and 10% target gap | Reconcile to OmniBSIC's signed regulatory return and approved definitions |
| Currency | Detects and blocks a portfolio containing several unconverted currencies | Supply approved reporting currency, dated FX rates and conversion controls |
| Board plan | Executive owner, evidence reference, strategy, milestones and maker-checker approval | Board/Risk Committee approval and named independent checker |
| Early warning | DPD, account-status, restructuring and controlled macro-risk signals | Bank-approved thresholds, source lineage and back-testing |
| Collections, case ledger and decisions | Named assignments, SLA, contact evidence and promise-to-pay workflow plus a facility-linked immutable chronology, currency-separated exposure waterfall, and independent review of restructure/cure-re-age/write-off proposals | OmniBSIC operating model, customer-contact rules, approved decision policies, committee mandates, authoritative execution evidence and account/GL reconciliation |
| Collateral | Registry, lien lifecycle and evidence workflows | Legal perfection, valuation, insurance, priority and enforceability validation |
| IFRS 9 | Approved-policy gate and explainable draft PD/LGD/EAD calculation | OmniBSIC methodology, model validation, scenario data and GL reconciliation |
| Regulatory evidence | Review and submission-reference records | Bank authorisation; UCH does not file with Bank of Ghana |
| Security/integration | Organisation/country scoping, RBAC, MFA, audit and synthetic sandbox | Contract, DPIA, penetration test, UAT, hosting decision and least-privilege connector |

## Minimum pilot sequence

1. Execute NDA, data-processing terms and a written pilot authority.
2. Agree one legal entity, portfolio, reporting date and reporting currency.
3. Load synthetic data first, then an approved isolated extract.
4. Reconcile facility counts, gross loans, gross NPLs, provisions and currency conversion to signed bank control totals.
5. Approve the bank's NPL classification, cure/re-age, restructuring, write-off and IFRS 9 policies through maker-checker.
6. Assign every NPL and material watchlist exposure to an accountable workflow.
7. Submit and independently approve dated Board milestones in the NPL Reduction Plan workspace.
8. Run parallel reporting, UAT and security testing before any production decision.
9. Reconcile the NPL case waterfall to signed monthly opening exposure, fresh inflows, cash/legal recoveries and closing exposure in each reporting currency.
10. Route material restructure, cure/re-age and write-off proposals through the case decision workspace; independently approve, record bank execution evidence and reconcile authoritative account and accounting outputs.

## Questions the bank must answer

1. Which gross-loan and gross-NPL control totals were used for the disclosed 23.09% ratio?
2. What is the reporting currency, and how are foreign-currency loans translated at the reporting date?
3. How much of gross NPL is curable, viable for restructuring, in legal recovery, collateral-backed, fully provided or proposed for write-off?
4. What were monthly fresh-NPL inflows, cures, cash recoveries, restructures and write-offs during the last 24 months?
5. Which policy versions govern default, SICR, cure, re-age, interest in suspense and write-off?
6. Which core banking, collections, collateral, general-ledger and credit-bureau systems are authoritative?
7. Who is the executive owner, maker, independent checker and Board/Risk Committee approver?
8. What hosting, data-residency, identity, network and penetration-test controls will the bank require?

## No-go conditions

Do not present a live ratio or remediation forecast as authoritative when control totals do not reconcile, currencies are not translated under an approved method, policy versions are missing, or the bank has not approved the data and security boundary. Do not promise that UCH alone will reduce the ratio to 10%; customer cash flows, recoveries, legal outcomes and bank decisions remain outside the software's control.
