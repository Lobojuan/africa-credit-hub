# Ghana NPL Early-Warning Pilot Data Contract

This is the minimum file-first data contract for a controlled Universal Credit Hub NPL pilot. It is designed for a bank-approved extract; it is not a replacement for the bank's core banking system or its regulatory records.

## Pilot scope

Start with one agreed portfolio, one legal entity, and one reporting date. The bank retains control of all lending, collections, customer contact, consent, and regulatory filing decisions.

## Required loan-tape fields

Use the CSV template in **Batch Upload**. Each facility needs these fields:

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

## Quality gate

Before the risk team uses the watchlist, the bank data owner must resolve missing account number, current balance, account status, days in arrears, and next payment date. The NPL desk displays the aggregate completeness score and does not imply that incomplete data is fit for a credit decision.

## 90-day proof measures

1. Number and exposure of facilities flagged by arrears/status signals.
2. Percentage of at-risk facilities assigned to a named collections workflow.
3. Time from warning to first recorded collections action.
4. Number of consent/evidence exceptions identified before a sensitive action.
5. Monthly NPL report evidence pack independently reviewed and filing reference recorded by bank staff.

## Security and evidence

Transmit data through the bank-approved channel only. Use a Ghana-hosted or bank-hosted deployment for real customer data. UCH records workflow and evidence references; it does not submit a regulatory filing, move money, or make a credit decision by itself.
