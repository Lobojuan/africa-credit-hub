# Bank Pilot Launch Pack

## 30 / 60 / 90 day plan

| Window | Deliverable | Acceptance evidence | Owner |
|---|---|---|---|
| Days 0–30 | Scope, data map, synthetic sandbox and access roles | Signed scope; mapping exceptions log; access review | Bank sponsor + UCH delivery lead |
| Days 31–60 | Controlled portfolio load, NPL workflow and IFRS 9 policy governance | Reconciliation; NPL assignments; maker-checker approval; UAT results | Credit risk + finance + data owner |
| Days 61–90 | Operating evidence, security sign-off and production decision | Evidence pack; incident exercise; change/rollback decision | Bank risk, security, DPO and sponsor |

## Bank UAT minimum

| ID | Test | Pass condition |
|---|---|---|
| PILOT-01 | SSO/local staff login | Only pre-provisioned active staff enter the correct scoped workspace. |
| PILOT-02 | Country and organisation isolation | Cross-scope request is denied and does not disclose data. |
| PILOT-03 | Loan-tape reconciliation | Count, balance and exception totals agree with the agreed source extract. |
| PILOT-04 | NPL workflow | A flagged facility is assigned, acted on and auditable; UCH does not take the collections decision itself. |
| PILOT-05 | IFRS 9 governance | Maker cannot self-approve; draft ECL remains blocked until a separate checker approves the bank policy. |
| PILOT-06 | Consent/evidence exception | Sensitive action is traceable to consent/evidence and exception handling. |
| PILOT-07 | Evidence-pack trace | Reviewer traces an agreed report metric to source data, policy version and approval. |
| PILOT-08 | Incident and rollback exercise | Team follows contacts, stops the integration, preserves evidence and returns to bank source-system operation. |

## Security questionnaire evidence

- Architecture/data-flow diagram and country/hosting location.
- SSO/MFA, RBAC, maker-checker and user-provisioning evidence.
- Encryption, secret handling, vulnerability-management and dependency-review evidence.
- Penetration-test scope/result and remediation plan (independent test required before broad production use).
- Backup/restore test result, RPO/RTO and incident-notification commitments.
- Data processing agreement, retention schedule and data-subject/consumer-rights process.

## Incident contacts and rollback

The bank and UCH must complete this before any live pilot:

| Role | Named contact | Escalation channel | Decision authority |
|---|---|---|---|
| Bank business sponsor | To be completed | To be completed | Stop pilot / accept business risk |
| Bank CISO/DPO | To be completed | To be completed | Security/privacy containment |
| Bank data owner | To be completed | To be completed | Source-data correction/reconciliation |
| UCH incident lead | To be completed | To be completed | Platform containment and evidence preservation |

Rollback means disabling the connector/service identity, preserving immutable logs, notifying the bank, reconciling the last accepted data boundary and returning to the bank’s source-system process. It never means deleting audit evidence or silently overwriting source data.
