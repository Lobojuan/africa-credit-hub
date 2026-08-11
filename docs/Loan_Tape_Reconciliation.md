# Loan-tape Reconciliation Control Plane

## Purpose

This workspace is a pre-import control for bank NPL pilots. It closes the gap between a bank-owned source extract and UCH's existing operational `credit_accounts` ledger without creating a duplicate loan book.

## Controlled sequence

1. A bank user maps the source CSV headers to required UCH canonical fields.
2. A different authorised user approves or rejects that immutable mapping version.
3. An approved profile validates a dated CSV extract of no more than 50,000 rows and 4.5 MB.
4. UCH stores the SHA-256 source fingerprint, row fingerprints, masked account references, run totals and persistent exceptions.
5. Critical or high exceptions block the run. Source correction is evidenced by a new run; an exception resolution or governed waiver never rewrites the original result.
6. A ready result permits the bank to continue to the existing, separate batch-upload workflow. It does not silently update operational credit records.

## Minimum canonical mapping

- `accountNumber`
- `currentBalance`
- `currency`
- `status`
- `daysInArrears`
- `reportingDate`
- `lenderInstitution`

Optional mappings include overdue amount, next payment date, restructure count, asset classification, imported IFRS 9 stage, collateral value/valuation date, insurance expiry, branch, sector, accountable owners, interest in suspense, provision amount, PD, LGD and EAD.

## Safety boundary

- Raw CSV rows are processed in memory and are not stored in reconciliation tables.
- Account references in exception records expose only the last four characters.
- Mapping approval enforces maker-checker separation.
- Organisation and country scope is enforced on profiles, runs and exceptions.
- Imported IFRS stage is checked for consistency; UCH does not assign a stage here.
- Collateral valuation age is checked only when the bank has approved a maximum-age rule.
- A ready reconciliation is evidence of data-gate passage, not approval of a credit decision, cure, restructure, write-off, provision, journal or regulatory filing.

## Deployment note

This capability adds three PostgreSQL tables through `migrations/0029_loan_tape_reconciliation.sql`. Production deployment must follow the repository's schema-change procedure: verified backup, reviewed additive migration, application deployment, health check and rollback readiness. The deploy guard intentionally blocks automatic production rollout until that step is approved and completed.
