# IFRS 9 Provisioning Workbench

## Purpose and boundary

UCH's IFRS 9 workbench produces an explainable **draft** expected-credit-loss (ECL) calculation. It does not post accounting entries, alter interest recognition, approve a provision, supersede a bank's IFRS 9 methodology, or submit to a regulator. The bank's approved policy, finance function, model-risk function and general ledger remain authoritative.

IFRS 9 describes ECL as a probability-weighted estimate of cash shortfalls and requires discounting to the reporting date using the effective interest rate (or an appropriate approximation). It distinguishes 12-month ECL from lifetime ECL and requires forward-looking information. [IFRS 9](https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2021/issued/part-a/ifrs-9-financial-instruments.pdf?bypass=on)

## What the first implementation covers

- Stage 1 / Stage 2 / Stage 3 classification under a **versioned policy object**.
- A transparent DPD, status, restructuring and cure-period decision path.
- EAD from drawn balance plus undrawn commitment × approved credit-conversion factor.
- PD, LGD, EAD and effective-interest-rate discounting.
- Probability-weighted base/downside (or bank-defined) scenarios.
- A Stage 3 output that flags net-carrying-amount interest treatment for accounting review.
- Deterministic tests for Stage transitions, cure controls, EAD and scenario-weight validation.

The initial Ghana policy is illustrative and deliberately labelled `draft-not-for-posting`. It must be replaced by an approved bank policy with effective date, owner, model version and independent reviewer before it can be used for a bank pilot.

## Required before pilot activation

1. Bank policy: SICR, default, restructuring, cure/re-age, write-off and interest-in-suspense rules; no threshold is activated merely because it appears in UCH.
2. Approved model inputs: segment/product PD curves, downturn/forward-looking LGD, EAD/CCF assumptions, effective interest rate, scenarios and weights.
3. Data lineage: source system, reporting date, account/commitment balance, collateral/recovery data, and a reconciliation to the general ledger.
4. Governance: policy version, maker-checker approval, model validation, back-testing, overrides and challenge records.
5. Accounting approval: finance must reconcile draft ECL to its ledger and approve any journal outside UCH.

## Ghana context

Bank of Ghana has stated that ECL/IFRS 9 models are subject to review and validation, and its credit-concentration guidance refers to PD, LGD and EAD quality, independent validation and back-testing. UCH therefore treats these outputs as governed decision support, not autonomous provisioning. [BoG Financial Stability Review](https://www.bog.gov.gh/wp-content/uploads/2024/10/Financial-Stability-Review-2023-1.pdf), [BoG credit concentration guideline](https://www.bog.gov.gh/wp-content/uploads/2025/09/Guidelines-on-Measurement-and-Management-of-Credit-Concentration-Risk.pdf).
