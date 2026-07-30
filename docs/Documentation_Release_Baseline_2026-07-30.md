# UCH Documentation Release Baseline — 30 July 2026

**Classification:** Internal release-control record  
**Owner:** Universal Credit Hub product, security and regulatory owners  
**Review trigger:** Any production release, material bank integration, country rollout, regulation change, or external distribution

## Release rule

No document is current merely because it exists in this repository. A document may be shared externally only when it is listed as **Current bank-facing authority** in `Documentation_Authority_Register.md`, its capability claims are verified against the release, and any regulatory statement has the required bank, legal and compliance review.

All other documents are one of:

| Class | Meaning | External use |
|---|---|---|
| Current bank-facing authority | Verified scope and claims for the current release | Permitted within the stated boundary |
| Current technical reference | Engineering reference that may change with code | Do not use as a regulatory or sales commitment |
| Controlled legacy / translation | Historical, translated or superseded material awaiting review | Do not distribute as current |
| Marketing / export | Illustrative material, playbooks or proposals | Use only after current-product review |
| Generated history | Release evidence, not a feature specification | Internal traceability only |

## Current regulatory source register — Ghana and IFRS 9

| Topic | Primary source | UCH documentation rule |
|---|---|---|
| Banking supervision, capital and resilience | [Bank of Ghana Financial Stability Review 2025](https://www.bog.gov.gh/wp-content/uploads/2026/05/Financial-Stability-Review-2025.pdf) | Describe UCH as decision support and evidence tooling; never as a regulator substitute. |
| ICAAP | [Bank of Ghana ICAAP Guideline 2026](https://www.bog.gov.gh/wp-content/uploads/2026/02/Guideline-on-ICAAP-12-2-26-clean.pdf) | A bank must configure and approve its own capital, stress and governance assumptions. |
| Credit concentration | [Bank of Ghana concentration-risk guideline explanatory notes](https://www.bog.gov.gh/wp-content/uploads/2025/09/Guidelines-on-Measurement-and-Management-of-Credit-Concentration-Risk-Explanatory-Notes.pdf) | Thresholds and escalation policy are bank/country configuration, not universal UCH defaults. |
| NPL management | [Bank of Ghana regulatory measures to reduce NPLs](https://www.bog.gov.gh/notice/regulatory-measures-to-reduce-non-performing-loans-in-banks-sdis-and-nbfis/) | UCH can prioritise, evidence and route work; the bank owns classification, workout and reporting decisions. |
| IFRS 9 impairment | [IFRS 9 Financial Instruments](https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2021/issued/part-a/ifrs-9-financial-instruments.pdf?bypass=on) and [IASB impairment review](https://www.ifrs.org/projects/completed-projects/2024/post-implementation-review-of-ifrs-9-impairment/) | All ECL, PD, LGD, EAD, staging, cure, write-off and disclosure claims require bank-approved policy, finance/model-risk validation and independent review. |

## Repository classification

1. **Authoritative external set:** documents named in `Documentation_Authority_Register.md`; these cover meeting readiness, integration sandbox, pilot launch, management diagnostic, public demo, Ghana NPL pilot data, IFRS 9 boundary, SSO acceptance, production security, code security findings and product research.
2. **Technical reference set:** `README.md`, `Systems_Documentation.md`, `Data_Dictionary.md`, `SRS_Traceability_Matrix.md`, test documents and API material. They must be reconciled to code before external reliance.
3. **Controlled legacy / translation set:** country-language copies (`docs/ar`, `docs/fr`, `docs/sw`), older manuals, policy/procedure guides, deployment documents and historical review material. These remain restricted until their owner completes the review rule below.
4. **Marketing/export set:** `marketing/` and `exports/` content; these require a current-product and claims review before distribution.

## Review rule for every controlled document

1. Assign an owner, classification, version and review date.
2. Verify routes, APIs, configuration, security controls and screenshots against the current release.
3. Replace legacy names and unsupported product, AI, security, regulatory or production-ready claims.
4. Link claims to a primary regulatory source where relevant; record the jurisdiction and effective date.
5. Obtain security/privacy/legal/bank review where the document describes live personal data, regulated activity, production controls or a bank-specific workflow.
6. Update the authority register only after those checks pass.

## Current release boundary

The public `/demo` is a browser-only synthetic experience. It does not connect to a bank, store visitor data, approve credit, post provisions, move funds, reverse transactions, submit a filing, perform an audit or provide a certification. The current release is ready for controlled demonstrations and scoped bank diagnostics—not for an unqualified claim of universal production readiness.
