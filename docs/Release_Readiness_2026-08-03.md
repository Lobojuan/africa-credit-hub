# UCH Release Readiness Evidence — 3 August 2026

**System:** Universal Credit Hub (UCH) v2.8
**Release candidate:** `9e51939` — `fix: normalize public SEO route slashes`
**Purpose:** Record the evidence available for the public site and controlled demo/pilot environment. This is not a bank-production certification, regulatory approval or substitute for bank UAT.

## 1. Evidence completed

| Control | Evidence | Result |
|---|---|---|
| Static analysis | `npm run check` | Pass |
| Unit regression | `npm run test:unit` | 346 passed; 1 explicitly skipped |
| Full browser regression | GitHub Actions `E2E Regression Suite — UCH Production Readiness` run `30803416703` | Pass |
| OAuth regression | GitHub Actions `OAuth Login Regression Tests` run `30803416946` | Pass |
| Guarded release | GitHub Actions `Deploy UCH production` run `30803416898` | Pass |
| Public crawl controls | Live `robots.txt`, `sitemap.xml`, page-specific title/description/canonical metadata | Pass |
| Public contact route | Browser check of `/contact-sales/` shows sales mailbox and named platform owners | Pass |
| SEO URL normalisation | `/contact-sales` and `/contact-sales/`; `/forensics` and `/forensics/` return the same canonical metadata | Pass |

## 2. Current scope that can be demonstrated

UCH can be demonstrated with synthetic data as a controlled African bank-risk operations platform and as a management diagnostic engagement. The evidence covers public pages, login/MFA behaviours, role and workspace restrictions, credit workflows, collateral, Loto, consumer surfaces, regulatory/reporting views and the selected cross-browser regression subset.

The public pages intentionally market both:

1. UCH software for controlled credit, NPL early-warning, collateral, consent, evidence and governed IFRS 9 policy workflows.
2. A file-first, read-only bank diagnostic and remediation-pilot offer.

## 3. Release-gate findings and treatment

| Finding | Treatment | Status |
|---|---|---|
| Public pages made an expected unauthenticated `/api/auth/me` request, which Lighthouse logged as a console error. | Trial banner is no longer mounted on public or login routes. | Fixed in the next release after this evidence record is created. |
| PWA prompt/chat controls lacked accessible names; PWA prompt had heading/contrast issues. | Added labels and corrected the prompt semantics/contrast. | Fixed in the next release after this evidence record is created. |
| Landing page lacked a `main` landmark. | Added a semantic `main` landmark. | Fixed in the next release after this evidence record is created. |
| Lighthouse audited `/login` as though it should be indexed. | The route is intentionally `noindex`; the audit must only gate public marketing URLs. | Audit configuration update required. |
| Initial JavaScript bundle remains large. | Performance optimisation is a tracked engineering improvement, not a false claim of completion. | Open P1. |

## 4. Conditions required before any bank production connection

The following cannot be proven from UCH source code or a synthetic test run. They remain mandatory for each bank and country activation:

- A bank-owned Google Workspace or Microsoft Entra configuration, named test identities and completed SSO/MFA acceptance record. SAML is not production-enabled.
- Signed data-processing, country/residency and permitted-use decisions; country rule validation and a bank-approved data contract.
- A dated backup-and-restore drill; firewall/TLS evidence; secret inventory and rotation ownership.
- Configured and test-proven transactional delivery (Zoho SMTP is not yet configured in the production environment).
- Independent penetration testing, incident exercise and bank risk-owner acceptance.
- A completed `UAT_V3_SIGNOFF_TEMPLATE.md` with tester, environment, date and explicit pass/fail results.

See `Country_Clearance_and_Safety_Matrix.md`, `Production_Security_Release_Gate.md`, `SSO_Acceptance_Test_Checklist.md` and `Bank_Pilot_Launch_Pack.md` for the required evidence.

## 5. Release decision

**Approved scope:** public marketing site, demonstration environment and controlled, bank-approved sandbox/pilot preparation.
**Not approved by this record:** live bank production processing, regulator submission, country clearance or a claim of universal regulatory compliance.

Any future change to authentication, authorization, data handling, reporting, country activation or public claims requires the same check/unit/E2E/release evidence plus an update to this record.
