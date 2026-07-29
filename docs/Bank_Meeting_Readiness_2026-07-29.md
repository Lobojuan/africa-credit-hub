# Universal Credit Hub — Bank Meeting Readiness

**Date:** 29 July 2026
**Scope:** current UCH codebase, current validation workflows, and the Ghana banking problem/pilot work.

## Position for a bank meeting

UCH is ready to demonstrate a controlled credit-risk and bank-operations platform. It must not be represented as a live core-banking replacement, regulator filing service, or autonomous lending/provisioning engine. A bank remains the decision-maker and system of record.

## Delivered since the bank-issue remediation work

| Area | Delivered control or repair |
|---|---|
| NPL early warning | Arrears, status and restructure signals, collections hand-off, pilot data-quality controls, and Ghana macro-risk observations. Macro observations are submitted into the existing maker-checker approval flow and become usable only after independent approval and audit logging. |
| Privacy-preserving search | National-ID borrower search now evaluates decrypted candidate values only after the caller's authorised scope has been applied; encryption at rest was not weakened. |
| Fraud and failed payments | Auditable transaction screening and a transaction-resolution case workflow are available; UCH does not move, block, or reverse funds. |
| Prudential evidence | Maker-checker records, audit trails, evidence-pack/reporting surfaces, and regulatory-reference workflows are available. They are not a claim of regulator submission or acceptance. |
| Browser assurance | Authenticated fixtures are deterministic; WebKit/Safari test diagnostics retain trace, video, and screenshot evidence; the local HTTP/CSP regression was repaired without weakening production HTTPS policy. |

## Authentication and SSO: verified truth

| Sign-in method | Code status | What remains before a bank can call it live |
|---|---|---|
| Named user + password | Implemented with session controls, role and organisation scope, password policy/expiry, lockout and audit events. | Tenant configuration, named-user provisioning and bank UAT. |
| MFA / TOTP | Implemented and required by production policy for privileged staff. | Enrolment and recovery test with real bank users. |
| WebAuthn / passkey | Enrolment and verification flow implemented. | Device/browser and recovery-path UAT against the production domain. |
| Google Workspace | Institutional flow implemented; it accepts only an active, pre-provisioned UCH staff identity. | Google client ID/secret, approved redirect URI, consent configuration, named test users and bank acceptance test. |
| Microsoft Entra ID | Institutional flow implemented; it accepts only an active, pre-provisioned UCH staff identity. | Entra application, tenant/client secret, redirect URI, admin consent, named test users and bank acceptance test. |
| SAML enterprise SSO | **Not live.** The legacy parser is blocked in production because it is not a vetted signed-assertion implementation. | A vetted SAML implementation, bank IdP metadata/certificate and a completed acceptance test. |

No provider should be described as live until its bank-owned configuration and acceptance test are complete. The provider-status endpoint deliberately exposes only whether Google or Microsoft credentials are configured, never IDs, tenant values, or secrets.

## Evidence and remaining go-live gates

1. Create the bank tenant: named users, least-privilege roles, country and organisation scope, and MFA policy.
2. Configure one approved identity provider, register the canonical HTTPS callback URI, and test two users for each role plus lockout/recovery.
3. Agree the legal data-sharing/retention terms and map a read-only loan-tape/core-banking export.
4. Run 30–60 days in parallel with bank-approved NPL thresholds, collection SLAs and escalation ownership.
5. Complete independent penetration testing, database restore drill, monitoring/alerting and incident-contact rehearsal.
6. Obtain bank and regulator/pilot governance sign-off; do not treat generated reports as accepted filings without that approval.

## Validation record

Before the Ghana macro-risk addition, the full E2E regression suite, OAuth smoke workflow and production deployment workflow completed successfully. The Ghana macro-risk commit has successful OAuth and deployment workflows; its E2E workflow remains the final current-run gate at the time this document was prepared.

The accompanying handout is [UCH Bank Meeting Readiness PDF](../output/pdf/UCH_Bank_Meeting_Readiness_2026-07-29.pdf).
