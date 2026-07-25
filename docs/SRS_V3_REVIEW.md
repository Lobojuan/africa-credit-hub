# UCH v3 SRS Review and Delivery Baseline

**System:** Universal Credit Hub (UCH) / Cross-Jurisdictional Credit Registry

**Review date:** 25 July 2026  
**Evidence base:** `shared/schema.ts`, `server/`, `client/src/`, Playwright configuration and CI workflows.  
**Purpose:** Establish a truthful delivery baseline before treating the legacy SRS traceability matrix as a contractual implementation record.

## 1. Executive conclusion

UCH is materially more capable than the current SRS/UAT and README describe. It is a multi-product, pan-African registry and financial-infrastructure platform—not a small four-role, 21-table credit registry application.

The existing documents are useful historical test inventories, but must not be used as a current statement of scope or completion because they contain outdated system counts and several requirements whose columns have shifted. The current evidence supports the following baseline:

| Measured surface | Current evidence |
|---|---:|
| Database tables | 105 Drizzle `pgTable` definitions |
| Application pages | 128 React page modules |
| HTTP route registrations | 587 Express route registrations |
| Roles | 8: platform owner, super admin, admin, regulator, lender, viewer, DGI officer, tax-authority admin |
| E2E inventory | 403 Playwright tests in 16 files |
| Unit suite | 332 passing, 1 intentionally skipped (at review time) |

## 2. Implemented capability map

| Domain | Evidence-backed implementation status | Key scope |
|---|---|---|
| Registry core | Implemented | Borrowers, institutions, credit accounts, payment performance, inquiries, reports, searches, batch ingestion and external API. |
| Consumer rights | Implemented, needs lifecycle hardening | Consent records/requests, revocation, disputes, helpdesk and consumer portal. |
| Credit decisioning | Implemented, needs governance productisation | Scores, affordability/open-banking inputs, alternative/telco data, ML/default-risk and decision-rule surfaces. |
| Data-provider operations | Implemented | Maker-checker, batch validation, provider submissions, data quality surfaces, audit trail and retention controls. |
| Regulatory reporting | Implemented, needs prudential extension | BoG, CBN, CBK and BSL export/reporting flows, dashboards and country playbooks. |
| Collections and collateral | Implemented | Collections assignments/SLA workflows and collateral registry/lien lifecycle. |
| Financial crime and integrity | Implemented baseline | Fraud indicators, audit hash chain, RBAC, MFA, session controls and maker-checker controls. |
| Loto fiscal product | Implemented | DGI admin dashboard, compliance, fraud queue, messaging, webhooks, USSD and audit views. |
| AI operations | Implemented baseline | AI command centre, risk analysis, report summaries, chatbot and compliance-report surfaces. |
| Internationalisation and sovereignty | Implemented baseline | Multi-country operating model, country mode, data sovereignty and multilingual surfaces. |

## 3. Review findings requiring documentation correction

| Item | Legacy statement | Correct treatment in v3 |
|---|---|---|
| Data model | 21 or 22+ tables | State the measured 105-table schema and maintain a generated inventory. |
| Roles | Four roles | Document all eight roles and workspace-specific access rules. |
| Page scope | Historical module list | Trace requirements to the actual 128-page application surface by domain. |
| Traceability rows | Some rows use shifted requirement/description/status columns | Rebuild rows against a strict column schema and a verifiable implementation reference. |
| UAT results | Many result cells are blank | Keep UAT as a sign-off artefact; do not infer a pass from a blank cell. |
| Test evidence | Legacy manual cases only | Link automated unit, API and Playwright evidence separately from human UAT sign-off. |

## 4. Ghana-bank end-to-end gap assessment

The registry foundation already covers much of the operational stack. The remaining work is chiefly productisation, integrations, model governance and closed-loop operations.

| Priority | Gap | Current state | Acceptance outcome |
|---|---|---|---|
| P0 | Score consistency and correctness | Score/affordability/alternative-data features exist across several surfaces | One server-owned score-input assembly and calculation path feeds report, PDF, API, dashboard and decision rules. |
| P0 | Consent and collection lifecycle proof | Records and pages exist; lifecycle coverage is uneven | Consent grant/revoke, inquiry authorisation, dispute freeze, lender SLA and resolution are covered by API and E2E tests. |
| P0 | E2E reliability | Broad regression suite is being stabilised | CI has deterministic auth/session fixtures and clear smoke versus full-regression jobs. |
| P1 | NPL early-warning product | Portfolio analytics exist | Bank portfolio alerts, segmentation, watchlists and intervention workflow with measurable lead indicators. |
| P1 | Fraud and document/consent intelligence | Indicators and audit controls exist | Real-time transaction/integration contracts, document-forgery screening and consent-evidence checks. |
| P1 | RegTech evidence packs | Exports and dashboards exist | Reproducible regulator-ready evidence packs with retention, approval and submission status. |
| P1 | Prudential monitoring | Regulatory analytics exist | CAR, liquidity and concentration monitoring where permitted data is available. |
| P2 | Failed-transaction complaints | Helpdesk/disputes exist | Intake, classification, routing, customer communication and closure automation. |
| P2 | Local-language CX | Multilingual platform foundation exists | Channel-specific, local-language self-service and escalation workflows. |

## 5. Delivery sequence

1. **Stabilise the test harness and complete one green full browser baseline.** Keep production safeguards intact; test-only bypasses must require explicit E2E mode and non-production execution.
2. **Replace legacy traceability with a v3 SRS matrix.** Each requirement needs an owner domain, implementation reference, automated evidence, human-UAT status and gap classification.
3. **Close P0 score and consent/collections correctness gaps.** Publish a scorecard change log and add end-to-end acceptance tests.
4. **Package two Ghana-bank pilots.** First: NPL early warning/portfolio monitoring. Second: fraud, consent evidence and complaint/dispute workflow.
5. **Build P1 RegTech and prudential extensions only against confirmed data contracts and regulator requirements.**

## 6. Definition of done for the SRS/UAT refresh

- No system-size or role-count claim is manually maintained without an evidence source.
- Every SRS item has one of: Implemented, Partial, Planned or Retired—not an ambiguous blank status.
- Each Implemented item identifies implementation references and at least one automated or manual evidence source.
- UAT records a tester, date, environment and explicit result; blank results remain Not Executed.
- Gaps are prioritised against a bank-use-case outcome, not a generic feature list.
- README and translated SRS/UAT artefacts are reconciled in a separate localisation pass.

## 7. Current review status

This document is the current authoritative review baseline. The legacy `SRS_Traceability_Matrix.md` and `UAT_Test_Document.md` remain historical artefacts until their v3 replacements are completed and explicitly signed off.
