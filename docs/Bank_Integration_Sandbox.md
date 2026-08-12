# Bank Integration Sandbox

## Purpose

The UCH bank sandbox is a controlled, synthetic-data integration phase. It exists to prove data mapping, identity/access boundaries, NPL workflow traceability and exception handling before a bank transmits personal data or connects a core-banking system.

The machine-readable contract is [`../openapi/uch-bank-pilot.openapi.yaml`](../openapi/uch-bank-pilot.openapi.yaml). It deliberately covers the pilot control plane, not an unrestricted production API.

## Boundary

| Safe in sandbox | Explicitly not enabled by sandbox |
|---|---|
| Synthetic loan-tape load and reconciliation | Live core-banking credentials |
| Scoped NPL early-warning review | Money movement, payment reversal or credit decision |
| Collections ownership workflow | Regulator filing or authority connectivity |
| Board NPL reduction-plan submission and independent review | Automatic cure, restructure, write-off or recovery decision |
| Maker-checker IFRS 9 policy submission | General-ledger posting or provision journal |
| Contract/API error testing | Real customer data without approved data processing and hosting controls |

## Bank onboarding sequence

1. Name a business owner, technical owner, risk owner and information-security owner.
2. Agree country, legal entity, portfolio and reporting-date scope.
3. Exchange the synthetic mapping template in [`templates/uch-bank-pilot-data-mapping.csv`](templates/uch-bank-pilot-data-mapping.csv).
4. Create a versioned **Loan-tape Reconciliation** mapping for the bank's source headers and have a different authorised user approve it.
5. Validate a synthetic extract and prove that critical/high exceptions block the evidence run, full account references are not exposed, and the raw CSV is not retained in reconciliation tables.
6. Provision a least-privilege sandbox user or SSO identity. Do not exchange shared credentials, API keys or production secrets in email, chat or source control.
7. Run the UAT cases in [`Bank_Pilot_Launch_Pack.md`](Bank_Pilot_Launch_Pack.md) and record all exceptions.
8. Obtain written security, privacy, risk and business acceptance before any production connection request.

## Connector requirements

- HTTPS/TLS only; server certificate validation must remain enabled.
- Separate sandbox and production service identities, secrets and audit trails.
- Least privilege, organisation and country scope on every request.
- Idempotency key and reconciliation reference for data-submission workflows.
- Allowlisted callback URLs only; never follow redirects to an unknown host.
- The bank owns the source-system truth, customer contact, credit action, collections escalation and regulatory submission.

## Contract verification

Before approving a connector, the integration owner must prove:

1. unauthenticated requests are rejected where authentication is required;
2. a user cannot retrieve another organisation or country’s data;
3. invalid fields produce actionable errors without PII leakage;
4. NPL assignments, policy submissions and approvals create audit evidence;
5. a consolidated NPL plan is blocked until portfolio values use one approved reporting currency;
6. a draft ECL request is rejected until a different checker approves the bank’s policy;
7. no test path can post a journal, move funds or send a regulatory filing.
8. a mapping maker cannot approve their own version, and an unapproved mapping cannot validate a loan tape;
9. the stored evidence contains SHA-256 fingerprints, masked account references and exception metadata but no raw source rows.

This document does not state that a specific bank connector is live. A connection becomes production-ready only after the bank’s signed contract, security review, UAT and change approval.
