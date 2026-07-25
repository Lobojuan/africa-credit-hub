# UCH v3 User Acceptance Test and Sign-off Record

**System:** Universal Credit Hub (UCH)  
**Version under test:** ____________________  
**Environment:** ☐ Local ☐ Staging ☐ Production-like  
**Test window:** ____________________  
**Test lead:** ____________________  
**Business owner:** ____________________

## 1. Purpose and evidence rules

This record is the sign-off companion to `SRS_V3_REVIEW.md`. It is not an automated-test report and no blank result may be interpreted as a pass.

| Result | Meaning |
|---|---|
| Pass | Business tester executed the case and observed the stated outcome. |
| Fail | Case executed and outcome diverged; defect reference required. |
| Blocked | Case cannot be executed; blocker and owner required. |
| Not Executed | Case has not been performed. |
| Not Applicable | Requirement does not apply to the signed-off scope; rationale required. |

Automated evidence is recorded alongside UAT but never substitutes for business acceptance.

## 2. Release gate

| Gate | Evidence | Owner | Result | Date / notes |
|---|---|---|---|---|
| TypeScript validation | `npm run check` | Engineering | ☐ Pass ☐ Fail ☐ Not Executed | |
| Unit suite | `npm run test:unit` | Engineering | ☐ Pass ☐ Fail ☐ Not Executed | |
| E2E smoke suite | CI: public, OAuth and Loto projects | Engineering | ☐ Pass ☐ Fail ☐ Not Executed | |
| Full cross-browser suite | CI: authenticated Chromium and Firefox projects | Engineering | ☐ Pass ☐ Fail ☐ Not Executed | |
| Data migration review | Schema and migration plan approved | Data owner | ☐ Pass ☐ Fail ☐ Not Executed | |
| Security/privacy review | RBAC, consent, audit and country-scope controls reviewed | Security/DPO | ☐ Pass ☐ Fail ☐ Not Executed | |
| Business UAT | Applicable cases below executed | Business owner | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |

## 3. Core registry and reporting

| UAT ID | Scenario | Expected business outcome | Automated evidence | Result | Tester / date / defect |
|---|---|---|---|---|---|
| UAT-REG-001 | Register an individual borrower | Identity, country and required fields are stored; duplicate warning is understandable | Credit and borrower API/E2E coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-REG-002 | Submit a credit account | Account appears under the correct borrower and provider organisation | Batch and credit E2E coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-REG-003 | Generate a borrower credit report | Report has correct identity, accounts, score and reason/factor information | Credit report API/unit coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-REG-004 | Run a regulatory report/export | Country-scoped output is complete, downloadable and auditable | Regulatory and BoG E2E coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-REG-005 | Upload a batch with invalid rows | Valid rows and actionable row-level errors are clearly separated | Batch-upload E2E coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |

## 4. Consumer rights and consent

| UAT ID | Scenario | Expected business outcome | Automated evidence | Result | Tester / date / defect |
|---|---|---|---|---|---|
| UAT-CON-001 | Grant consent for a permitted inquiry | Receipt, purpose, recipient and status are visible and auditable | Consent API/unit coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-CON-002 | Revoke consent | New inquiry is prevented or handled according to policy; revocation is recorded | Consent API/unit coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-CON-003 | File a consumer dispute | Dispute is categorised, assigned an SLA and visible to the responsible party | Helpdesk/dispute coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-CON-004 | Resolve a dispute | Resolution and evidence are communicated and retained | Dispute lifecycle evidence | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |

## 5. Bank operations

| UAT ID | Scenario | Expected business outcome | Automated evidence | Result | Tester / date / defect |
|---|---|---|---|---|---|
| UAT-BNK-001 | Use a credit score in a lending decision | Score, inputs and reason codes are consistent across report, API and decision surface | Score consistency gate (P0) | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-BNK-002 | Review an NPL/portfolio alert | User can identify affected segment, owner and next action | Portfolio-alert pilot (P1) | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-BNK-003 | Review fraud/consent evidence | Alert contains source, evidence, decision and audit trail | Fraud/consent pilot (P1) | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-BNK-004 | Assign a collections case | Assignment, SLA and resolution path are visible to the right role | Collections workflow evidence | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |

## 6. Governance, security and operations

| UAT ID | Scenario | Expected business outcome | Automated evidence | Result | Tester / date / defect |
|---|---|---|---|---|---|
| UAT-GOV-001 | Attempt a role-restricted action | Access is denied without exposing protected data | Auth/RBAC E2E coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-GOV-002 | Submit a maker-checker item | Different authorised person can approve/reject; self-approval is blocked | Approval API/unit coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-GOV-003 | Inspect audit history | Actor, event, time and integrity state are available | Audit integrity coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |
| UAT-GOV-004 | Verify country scope | User sees only permitted country/organisation data | Regulatory and country-mode coverage | ☐ Pass ☐ Fail ☐ Blocked ☐ Not Executed | |

## 7. Acceptance decision

| Decision | Authorised by | Signature / approval reference | Date | Conditions or linked defects |
|---|---|---|---|---|
| ☐ Accepted | | | | |
| ☐ Accepted with conditions | | | | |
| ☐ Not accepted | | | | |

## 8. Open defects and conditions

| Reference | Severity | Owner | Target date | Acceptance impact | Status |
|---|---|---|---|---|---|
| | | | | | |
