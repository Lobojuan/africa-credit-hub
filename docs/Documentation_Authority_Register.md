# Documentation Authority Register

## Purpose

This register prevents a bank, regulator or delivery team from treating an older product document as an approved statement of current UCH capability.

## Current bank-facing authority (validated for this release)

| Document | Use | Status |
|---|---|---|
| `Bank_Meeting_Readiness_2026-07-29.md` | Meeting scope and truthful readiness statement | Current |
| `Bank_Integration_Sandbox.md` and `openapi/uch-bank-pilot.openapi.yaml` | Controlled integration sandbox | Current |
| `Bank_Pilot_Launch_Pack.md` | Bank pilot/UAT, contacts and rollback | Current |
| `Bank_Risk_Diagnostic.md` | Controlled management-diagnostic delivery and safeguards | Current |
| `Public_Demo_Board.md` | Public synthetic demo scope, claims boundary and conversion path | Current |
| `Ghana_NPL_Pilot_Data_Contract.md` | Ghana NPL pilot extract | Current |
| `IFRS9_Provisioning_Workbench.md` | Draft ECL boundary and governance | Current |
| `SSO_Acceptance_Test_Checklist.md` | Bank identity-provider acceptance | Current |
| `Production_Security_Release_Gate.md` | Production decision evidence | Current |
| `Security_Audit_2026-07-29.md` | Current code-level security findings | Current |

## Controlled legacy set

The documentation scan on 2026-07-29 found **31** files using legacy CDH/Pan-African Credit Registry wording. They may contain useful background, but are **not approved as current bank-facing product statements** until their owner reviews the identity, version, architecture, regulatory claims, screenshots and operational instructions.

This includes `API_Integration_Guide.md`, `Deployment_Guide.md`, `Penetration_Test_Readiness.md`, the language variants and the legacy Ghana policy/procedure documents. The scan found **zero Replit references** in Markdown, TypeScript/TSX and JSON files.

## Review rule

Before sharing a legacy document externally, the document owner must:

1. replace legacy product/company wording with the approved UCH identity where factually correct;
2. confirm every feature, security and regulatory claim against the current code and signed bank policy;
3. add a document version, owner, review date and classification;
4. have risk/privacy/security review any claim that implies production readiness or regulatory compliance;
5. update this register from `Controlled legacy` to `Current`.

Until that review is complete, use only the current bank-facing authority set above.
