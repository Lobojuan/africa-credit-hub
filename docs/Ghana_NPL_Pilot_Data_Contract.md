# Ghana NPL Early-Warning Pilot Data Contract

This is the minimum file-first data contract for a controlled Universal Credit Hub NPL pilot. It is designed for a bank-approved extract; it is not a replacement for the bank's core banking system or its regulatory records.

## Pilot scope

Start with one agreed portfolio, one legal entity, and one reporting date. The bank retains control of all lending, collections, customer contact, consent, and regulatory filing decisions.

## Required loan-tape fields

The bank must first create a versioned mapping in **Loan-tape Reconciliation**. A different authorised user approves that mapping before it can be used. The source CSV may retain the bank's own column names; the approved profile maps them to these minimum UCH canonical fields:

`accountNumber`, `currentBalance`, `currency`, `status`, `daysInArrears`, `reportingDate`, `lenderInstitution`.

The controlled pre-import gate fingerprints the source file, validates up to 50,000 rows, masks account references in exceptions, and persists exception evidence. It does not retain the raw CSV or write to `credit_accounts`. Any critical or high exception blocks that run. A corrected file must be validated as a new evidence run before the separate approved batch-upload process.

The downstream **Batch Upload** contract remains broader because it creates or updates operational borrower and facility records. Each facility needs these fields:

`borrowerId`, `borrowerName`, `dateOfBirth`, `address`, `nationalId`, `phoneNumber`, `reportingDate`, `lenderInstitution`, `accountNumber`, `accountType`, `originalAmount`, `currentBalance`, `currency`, `disbursementDate`, `maturityDate`, `status`, `daysInArrears`.

For the NPL pilot, also include whenever available:

- `amountOverdue`
- `nextPaymentDate`
- `restructureCount`
- `interestRate`
- `repaymentFrequency`
- `assetClassification`
- `purposeOfFacility`
- `collateralType` and `collateralValue`

Before a bank-wide reduction plan is calculated, the bank must additionally provide or reconcile:

- the approved reporting currency and dated FX conversion evidence for every foreign-currency exposure;
- the bank's gross-loan and gross-NPL definitions, classification mapping and regulatory-return control total;
- branch, sector, product and accountable relationship/workout owner;
- restructure date/reason, cure/re-age history and any prior impairment evidence;
- suspended interest, specific/general provision, approved write-off and recovery fields from the authoritative systems;
- collateral perfection, valuation date, insurance, priority, expected recovery and legal-enforcement status; and
- source-system, general-ledger and regulatory-return reconciliation references.

UCH blocks a consolidated reduction-plan submission when several currencies are present without an approved reporting-currency reconciliation. Adding different currency amounts together would create a false NPL ratio.

## Quality gate

Before the risk team uses the watchlist, the bank data owner must use an independently approved mapping and resolve the persistent pre-import exceptions for account reference, balance, currency, status, arrears, reporting date and lender. Classification, imported IFRS stage, collateral valuation and insurance checks are applied when those source fields are mapped. A collateral-age rule is used only when the bank has approved it. The NPL desk displays the downstream aggregate completeness score and does not imply that incomplete data is fit for a credit decision.

## 90-day proof measures

1. Number and exposure of facilities flagged by arrears/status signals.
2. Percentage of at-risk facilities assigned to a named collections workflow.
3. Time from warning to first recorded collections action.
4. Number of consent/evidence exceptions identified before a sensitive action.
5. Monthly NPL report evidence pack independently reviewed and filing reference recorded by bank staff.
6. Gross NPL numerator and gross-loan denominator reconciled to the bank's signed control totals.
7. Board plan approved through maker-checker with at least two dated, non-increasing ratio targets.
8. NPL exposure reduction required, active collections coverage and watchlist inflow reported in the approved reporting currency.
9. Facility cases opened from reconciled credit-account balances with immutable source/evidence references.
10. Monthly opening exposure, observed inflows, cash recoveries, legal recoveries and closing exposure reconciled separately for every currency.

## Board-plan control

The **NPL Early Warning Desk** displays the current scoped ratio and the exposure reduction required to reach the approved target. A plan cannot be submitted until a non-empty loan tape is loaded and the portfolio is safe to aggregate. The submission records an executive owner, Board evidence reference, strategy and dated milestones, then routes it to a different authorised reviewer.

Approval of this workflow is approval of the management plan evidence only. It does not approve individual restructures, cures, write-offs, provisions, journals or a Bank of Ghana filing.

## Security and evidence

Transmit data through the bank-approved channel only. Use a Ghana-hosted or bank-hosted deployment for real customer data. Mapping versions, reviewer identity, SHA-256 file and row fingerprints, masked account references, exception status and resolution notes form the pre-import evidence trail. UCH records workflow and evidence references; it does not submit a regulatory filing, move money, make a credit decision, assign an IFRS stage or post a journal by itself.
