# UCH Public Demo Board

## Purpose

`/demo` is Universal Credit Hub's public, no-registration product demonstration. It lets a bank visitor select a business problem and see a fictional, controlled UCH scenario before requesting a management diagnostic.

Visitors may also select **Improve the whole bank**, which presents all five workstreams as one sequenced management-diagnostic and remediation programme. It does not claim that a single tool can autonomously remediate a bank.

## Public scenarios

1. NPL and IFRS 9 readiness
2. Consent and collateral evidence
3. Fraud, failed transactions and complaints
4. Reporting and prudential controls
5. Core Credit Hub credit intelligence

The board also includes a synthetic workspace simulator: Bank overview, NPL desk, Credit Hub, Collateral and consent, Operations, and Evidence packs. Visitors can switch views and trigger simulated review actions. These interactions never call a production API or execute a banking action.

The Executive Live Simulation deliberately animates fictional portfolio metrics, a risk trend and event feed to demonstrate the operating experience. It must always retain the visible `SIMULATION` label and synthetic-data disclaimer; it is not live telemetry or a performance promise.

## Safety and claims boundary

- All figures, institutions, cases and findings displayed on `/demo` are synthetic.
- The board never retrieves, stores or sends a visitor's input. The virtual management report is a browser-only preview.
- The board does not provide access to bank systems, customer data, production workflows, credit decisions, holds, reversals, accounting posts, regulator submissions, audits or certifications.
- Each scenario links to a UCH workspace only for authenticated, authorised users. Public visitors are redirected to sign-in.
- The virtual report is a sales illustration, not a bank deliverable. A real diagnostic requires written authority, data-processing terms, named bank owners and bank validation of material findings.

## Conversion path

1. Visitor selects an outcome and reviews a synthetic scenario.
2. Visitor opens a virtual management-report preview.
3. Visitor requests a paid Bank Risk Diagnostic.
4. UCH delivers a file-first, read-only management diagnostic.
5. Bank-validated findings can become a fixed-scope 90-day pilot with a baseline, target, owner and acceptance test.

## Marketing assets

The older `client/public/marketing/app-*.png` gallery contains legacy product branding and must not be used as evidence of the current UCH v2.8 product surface. The primary sales path now leads to `/demo`, whose UI is maintained from the current codebase. A separate, authenticated screenshot-capture run is required before replacing the remaining lower-page legacy gallery images.
