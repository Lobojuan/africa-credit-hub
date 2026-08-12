# UCH Country Clearance and Safety Matrix

**Status:** Release-control matrix, not legal advice, a licence, regulatory approval or a certification.  
**Rule:** A country configuration is not permission to process real bank/customer data or activate regulatory rules.

## What UCH can do consistently today

UCH provides a common technical framework: tenant/country scoping, role-based access, maker-checker patterns, audit logging, consent and collateral workflows, synthetic demo journeys, configurable country presentation, and controlled pilot documentation. These capabilities do **not** activate a country’s credit-bureau, banking, privacy, consumer-protection, cyber-security, reporting or data-residency obligations.

## Clearance status of implemented country configurations

| Country / market | Current UCH status | May be demonstrated | Missing before real bank data or live workflow |
|---|---|---|---|
| Ghana | **Controlled pilot readiness** — Ghana NPL data contract, macro-observation approval path and IFRS 9 draft governance workspace exist. | Synthetic demo and bank-approved, file-first diagnostic/pilot. | Bank contract and data basis; local hosting/residency decision; bank policy/model validation; SSO/roles; security/UAT/DR evidence; Bank of Ghana reporting acceptance. |
| Nigeria | **Draft rule profile** — CBN export and research exist. | Synthetic workflow and requirements workshop. | Current CBN/CRMS rule validation, NDPA/privacy review, bank data contract, local owner, pilot UAT and regulator-report acceptance. |
| Kenya | **Draft rule profile** — NPL research exists. | Synthetic workflow and requirements workshop. | Current CBK/CRB/privacy rule validation, interest-in-suspense/provisioning mapping, data contract, bank policy, UAT and reporting acceptance. |
| Côte d’Ivoire / Senegal (UMOA) | **Regional draft profile** — BCEAO classification research exists. | Synthetic workflow and requirements workshop. | Map the regional framework to the specific institution and country, local privacy review, source/regulatory classification mapping, pilot and evidence acceptance. |
| South Africa | **Research required before rule activation.** | Synthetic workflow only. | Applicable Prudential Authority standards, POPIA/data-residency review, bank IFRS 9 policy, model validation, security review and bank UAT. |
| Liberia, Sierra Leone, Rwanda, Tanzania, Uganda, Ethiopia, Cameroon, Morocco | **Country presentation/configuration exists; no approved regulatory pilot pack.** | Synthetic workflow and discovery workshop only. | Local regulatory and privacy profile, institution licence/eligibility review, data-residency decision, bank data contract, configured policy, security/UAT/DR evidence and local sign-off. |
| Any other African jurisdiction | **Framework only; not activated.** | Public synthetic demo only. | Complete the country profile and all clearance gates below before configuration or real data use. |

## Mandatory clearance gates — every country and every bank

1. **Regulatory scope:** local counsel/compliance confirms the bank type, permitted UCH role, credit-reporting/bureau rules, outsourcing and reporting obligations.
2. **Privacy and residency:** determine controller/processor roles, lawful basis, retention, cross-border transfer, hosting, breach handling and customer-rights workflow.
3. **Bank authority:** signed engagement, named executive/process/security/data owners, configured roles and maker-checker policy.
4. **Data and integration:** bank-approved minimum dataset, data-quality thresholds, source-to-field mapping, interface/security test, reconciliation and rollback.
5. **Risk/model policy:** bank-approved thresholds, IFRS 9 methodology, PD/LGD/EAD/staging/cure/re-age treatment, overrides, validation and independent review.
6. **Operational safety:** incident/complaint and human-handoff path, no autonomous credit/funds/provision/regulatory action, SLA and outage exercise.
7. **Security and resilience:** SSO/MFA, least privilege, audit review, encryption/key management, vulnerability/penetration test, backup restore and DR exercise.
8. **Acceptance evidence:** pilot baseline/target, UAT, management sign-off, examiner/evidence-pack trace and change-control record.

## Activation levels

| Level | Meaning |
|---|---|
| 0 — Public demo | Synthetic only; no visitor data retained; no bank or regulator action. |
| 1 — Diagnostic | Written authority; read-only, minimised bank-approved files; no production action. |
| 2 — Controlled pilot | Gates 1–8 completed for one use case, bank and country; monitored, reversible workflow. |
| 3 — Production expansion | Pilot acceptance, security/recovery evidence, change approval and country/bank extension approval. |

## Sources and related UCH documents

- Ghana/IFRS source register: [Documentation Release Baseline](Documentation_Release_Baseline_2026-07-30.md).
- NPL country research and detailed source links: [NPL Regulatory Profile Research](NPL_Regulatory_Profile_Research.md).
- Ghana data boundary: [Ghana NPL Pilot Data Contract](Ghana_NPL_Pilot_Data_Contract.md).
- Bank integration boundary: [Bank Integration Sandbox](Bank_Integration_Sandbox.md).
- Pilot/UAT and rollback: [Bank Pilot Launch Pack](Bank_Pilot_Launch_Pack.md).
