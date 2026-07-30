# UCH Bank Risk Diagnostic

## Purpose

The UCH Bank Risk Diagnostic is a fixed-scope management assessment that converts a bank-approved, read-only data extract into validated risk and control findings. It is decision support for bank management; it is not an external audit, regulatory certification, penetration test, legal opinion, or a substitute for the bank's internal controls.

## Delivery model

1. **Authorise** — name an executive sponsor and data owner; record purpose, approved scope, permitted fields, retention period and data-processing terms.
2. **Intake** — load only bank-approved file extracts into the agreed isolated environment. UCH must not receive unrestricted server access or credentials that permit production writes.
3. **Analyse** — run agreed data-quality, reconciliation, risk and control tests.
4. **Validate** — the bank's accountable owners validate evidence, assumptions, materiality and severity of each finding.
5. **Decide** — produce a management risk pack and turn accepted findings into a bank-owned remediation plan or a measurable 90-day UCH pilot.

## Standard assessment domains

| Domain | Typical evidence | UCH outcome |
| --- | --- | --- |
| NPL and IFRS 9 readiness | Loan tape, arrears, repayment, restructure, collection and ECL inputs | Data-quality exceptions, early-warning back-test plan and governed provisioning-readiness gap map |
| Consent, collateral and evidence | Consent records, approvals, collateral register and document exceptions | Traceable exception register and remediation controls |
| Fraud, failed transactions and complaints | Transaction/channel logs, settlement/reversal files and complaint cases | Reconciliation and ownership/control-gap map; no autonomous action |
| Reporting and prudential controls | Reporting calendar, extracts, concentration and evidence references | Control-gap register, accountable owners and evidence-pack plan |

## Minimum safeguards

- Written engagement authority, NDA and data-processing terms before data receipt.
- File-first, read-only extracts for the initial assessment.
- Least privilege, named users, encrypted storage and auditable access.
- Agreed retention period, return/deletion procedure and deletion certificate.
- No autonomous credit action, hold, reversal, customer contact, accounting post or regulatory submission.
- Material findings stay draft until a named bank owner validates them.

## Commercial conversion

The recommended offer is a paid, fixed-scope diagnostic. Credit 100% of the diagnostic fee toward a 90-day UCH pilot when the bank proceeds within 60 days. The pilot must define a baseline, target, accountable bank owner and acceptance test before it begins.

## UCH workflow

The user-facing workspace is `/bank-risk-diagnostic`. It links to the existing data intake, NPL early-warning, consent, transaction-resolution, evidence-pack and bank-pilot paths. The workspace itself does not persist an engagement record yet; this first slice establishes the safe engagement flow and navigation. Persisted engagement records, uploads, finding approval and report generation require a dedicated backend data model before a live client assessment.
