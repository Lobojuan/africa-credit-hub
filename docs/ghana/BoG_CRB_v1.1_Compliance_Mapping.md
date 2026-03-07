# BoG CRB v1.1 Compliance Mapping

**Systems In Motion Limited**
**Version 1.1 | Bank of Ghana Credit Reporting Bureau Data Format Compliance**

---

## 1. Overview

This document provides the complete compliance mapping between the Ghana Credit Registry internal schema and the Bank of Ghana (BoG) CRB Data Format Specification v1.1. It covers all six file types, field-by-field mappings, code catalogs, file naming conventions, validation rules, and the export workflow.

---

## 2. File Naming Convention

All BoG CRB export files follow this naming pattern:

```
{SRN}-{ReportingDate}-{FileCreatedDate}-1.1-{FileId}-{SeqNum}.csv
```

| Component | Format | Description | Example |
|-----------|--------|-------------|---------|
| SRN | Text | Institution Subscriber Registration Number | GCB001 |
| ReportingDate | YYYYMMDD | The reporting period end date | 20260131 |
| FileCreatedDate | YYYYMMDD | Date the file was generated | 20260205 |
| Version | Major.Minor | Always `1.1` for this specification | 1.1 |
| FileId | 4-char code | One of CONC, BUSC, CONJ, BUSJ, COND, BUSD | CONC |
| SeqNum | Integer | Sequence number (starting at 1) | 1 |

**Example**: `GCB001-20260131-20260205-1.1-CONC-1.csv`

### File Types

| Code | Description | Borrower Type |
|------|-------------|---------------|
| CONC | Consumer Credit | Individual |
| BUSC | Business Credit | Corporate |
| CONJ | Consumer Court Judgments | Individual |
| BUSJ | Business Court Judgments | Corporate |
| COND | Consumer Dishonoured Cheques | Individual |
| BUSD | Business Dishonoured Cheques | Corporate |

### General Format Rules

- Delimiter: Pipe character (`|`)
- Encoding: UTF-8
- Date format: YYYYMMDD (no separators)
- Amounts: Rounded to whole numbers (no decimal places)
- Null values: Empty string between delimiters
- Header row: Required (first row contains column names)
- Correction indicator: 0 = Normal, 1 = Correction, 2 = Delete

---

## 3. Field-by-Field Mapping: Consumer Credit (CONC)

### 3.1 Borrower Identification Fields

| BoG Field | Schema Column (`borrowers`) | Type | Required | Notes |
|-----------|-----------------------------|------|----------|-------|
| Ghana Card Number | `ghanaCardNumber` | text | Yes | Primary national ID |
| Surname | `lastName` | text | Yes | |
| Forenames | `firstName` | text | Yes | |
| Middle Names | `middleNames` | text | No | |
| Previous Name | `previousName` | text | No | Maiden name or former name |
| Alias | `alias` | text | No | |
| Title | `title` | text | No | Mr/Mrs/Dr etc. |
| Date of Birth | `dateOfBirth` | text | Yes | Format: YYYYMMDD |
| Gender | `gender` | text | Yes | M/F |
| Marital Status | `maritalStatus` | text | No | Coded: S/W/D/M/P |
| Nationality | `nationality` | text | Yes | ISO alpha-3 (e.g., GHA) |
| National ID | `nationalId` | text | Yes | |
| Passport Number | `passportNumber` | text | No | |
| Voter's ID | `votersId` | text | No | |
| SSNIT Number | `ssnitNumber` | text | No | |
| Driver's License | `driversLicense` | text | No | |
| E-zwich Number | `ezwichNumber` | text | No | |
| TIN Number | `tinNumber` | text | No | |
| Number of Dependants | `numberOfDependants` | integer | No | |

### 3.2 Contact & Address Fields

| BoG Field | Schema Column (`borrowers`) | Type | Required | Notes |
|-----------|-----------------------------|------|----------|-------|
| Address Line 1 | `address` | text | Yes | Current residential address |
| Postal Address 1 | `postalAddress1` | text | No | |
| Postal Address 2 | `postalAddress2` | text | No | |
| Postal Address 3 | `postalAddress3` | text | No | |
| Postal Address 4 | `postalAddress4` | text | No | |
| Postal Code | `postalCode` | text | No | |
| Previous Address 1 | `previousAddress1` | text | No | |
| Previous Address 2 | `previousAddress2` | text | No | |
| Previous Address 3 | `previousAddress3` | text | No | |
| Previous Address 4 | `previousAddress4` | text | No | |
| Previous Addr Postal Code | `previousAddrPostalCode` | text | No | |
| Date Moved Current Res | `dateMovedCurrentRes` | text | No | YYYYMMDD |
| City | `city` | text | No | |
| Region | `region` | text | No | |
| Country | `country` | text | Yes | |
| Home Telephone | `homeTelephone` | text | No | |
| Work Telephone | `workTelephone` | text | No | |
| Mobile Phone | `phone` | text | No | |
| Email | `email` | text | No | |

### 3.3 Employment & Income Fields

| BoG Field | Schema Column (`borrowers`) | Type | Required | Notes |
|-----------|-----------------------------|------|----------|-------|
| Owner or Tenant | `ownerOrTenant` | text | No | Coded: O/T/F |
| Employment Type Code | `employmentTypeCode` | text | No | Coded: 101-106 |
| Employer Name | `employerName` | text | No | |
| Employer Address | `employerAddress` | text | No | |
| Occupation | `occupation` | text | No | |
| Date of Employment | `dateOfEmployment` | text | No | YYYYMMDD |
| Monthly Income | `monthlyIncome` | decimal(15,2) | No | Rounded to whole in export |
| Income Currency | `incomeCurrency` | text | No | ISO 4217 (default GHS) |

### 3.4 Credit Account Fields

| BoG Field | Schema Column (`credit_accounts`) | Type | Required | Notes |
|-----------|-----------------------------------|------|----------|-------|
| Account Number | `accountNumber` | text | Yes | |
| Facility Type Code | `facilityTypeCode` | text | Yes | Coded: 101-129 |
| Purpose of Facility | `purposeOfFacility` | text | No | Coded: A-L, P, S |
| Account Type | `accountType` | text | Yes | |
| Currency | `currency` | text | Yes | ISO 4217 |
| Original Amount | `originalAmount` | decimal(15,2) | Yes | |
| Current Balance | `currentBalance` | decimal(15,2) | Yes | |
| Current Balance Indicator | `currentBalanceIndicator` | text | No | D = Debit, C = Credit |
| Disbursement Amount | `disbursementAmount` | decimal(15,2) | No | |
| Disbursement Date | `disbursementDate` | text | No | YYYYMMDD |
| Maturity Date | `maturityDate` | text | No | YYYYMMDD |
| Interest Rate | `interestRate` | decimal(5,2) | No | |
| Repayment Frequency | `repaymentFrequency` | text | No | Coded: 10-21 |
| Scheduled Installment Amount | `scheduledInstallmentAmount` | decimal(15,2) | No | |
| Facility Term | `facilityTerm` | integer | No | In months |
| Account Status (BoG) | `bogAccountStatus` | text | Yes | Coded: A-Z single char |
| Asset Classification (BoG) | `bogAssetClassification` | text | Yes | Coded: A-E |
| Days in Arrears | `daysInArrears` | integer | No | |
| Arrears Start Date | `arrearsStartDate` | text | No | YYYYMMDD |
| Amount Overdue | `amountOverdue` | decimal(15,2) | No | |
| Amt Overdue 1-30 | `amtOverdue1to30` | decimal(15,2) | No | |
| Amt Overdue 31-60 | `amtOverdue31to60` | decimal(15,2) | No | |
| Amt Overdue 61-90 | `amtOverdue61to90` | decimal(15,2) | No | |
| Amt Overdue 91-120 | `amtOverdue91to120` | decimal(15,2) | No | |
| Amt Overdue 121-150 | `amtOverdue121to150` | decimal(15,2) | No | |
| Amt Overdue 151-180 | `amtOverdue151to180` | decimal(15,2) | No | |
| Amt Overdue 181+ | `amtOverdue181plus` | decimal(15,2) | No | |
| Payment History Profile | `paymentHistoryProfile` | text | No | Coded: 0-5 |
| Last Payment Date | `lastPaymentDate` | text | No | YYYYMMDD |
| Last Payment Amount | `lastPaymentAmount` | decimal(15,2) | No | |
| Next Payment Date | `nextPaymentDate` | text | No | YYYYMMDD |
| Written Off Amount | `writtenOffAmount` | decimal(15,2) | No | |
| Written Off Date | `writtenOffDate` | text | No | YYYYMMDD |
| Reason for Written Off | `reasonForWrittenOff` | text | No | Coded: A-F |
| Closure Reason | `closureReason` | text | No | Coded: A-K |
| Date Restructured | `dateRestructured` | text | No | YYYYMMDD |
| Reason for Restructure | `reasonForRestructure` | text | No | Coded: T/E/L/D/F/C |
| Restructure Count | `restructureCount` | integer | No | |
| Legal Flag | `legalFlag` | text | No | Coded: 101/102 |
| Special Comments Code | `specialCommentsCode` | text | No | Coded: 101-115 |
| Joint or Sole Account | `jointOrSoleAccount` | text | No | J/S |
| No. Participants in Account | `noParticipantsInAccount` | integer | No | |
| Def Payment Start Date | `defPaymentStartDate` | text | No | YYYYMMDD |

### 3.5 Collateral / Security Fields

| BoG Field | Schema Column (`credit_accounts`) | Type | Required | Notes |
|-----------|-----------------------------------|------|----------|-------|
| Credit Collateral Indicator | `creditCollateralIndicator` | text | No | 101 = Yes, 102 = No |
| Security Type | `securityType` | text | No | Coded: A-Q |
| Nature of Charge | `natureOfCharge` | text | No | A = Fixed, B = Float |
| Security Value | `securityValue` | decimal(15,2) | No | |
| Collateral Reg Ref Num | `collateralRegRefNum` | text | No | |
| Nature of Guarantor | `natureOfGuarantor` | text | No | Coded: 101-103 |

---

## 4. Field-by-Field Mapping: Business Credit (BUSC)

Business credit records share the same credit account fields as CONC (Section 3.4 and 3.5) but use corporate borrower identification fields instead of individual fields.

### 4.1 Corporate Borrower Fields

| BoG Field | Schema Column (`borrowers`) | Type | Required | Notes |
|-----------|-----------------------------|------|----------|-------|
| Company Name | `companyName` | text | Yes | |
| Business Reg Number | `businessRegNumber` | text | Yes | |
| TIN Number | `tinNumber` | text | Yes | |
| Business Type Code | `businessTypeCode` | text | Yes | Coded: A-L |
| Sector Industry Code | `sectorIndustryCode` | text | No | Coded: 10-80 |
| Sub-Sector Code | `subSectorCode` | text | No | Coded: 101-806 |
| Registration Date | `registrationDate` | text | No | YYYYMMDD |
| Commencement Date | `commencementDate` | text | No | YYYYMMDD |
| Turnover Amount | `turnoverAmount` | decimal(15,2) | No | |
| Turnover Currency | `turnoverCurrency` | text | No | ISO 4217 |
| Address | `address` | text | Yes | |
| City | `city` | text | No | |
| Region | `region` | text | No | |
| Country | `country` | text | Yes | |
| Phone | `phone` | text | No | |
| Email | `email` | text | No | |

---

## 5. Field-by-Field Mapping: Consumer Court Judgments (CONJ)

| BoG Field | Schema Column (`court_judgments`) | Type | Required | Notes |
|-----------|----------------------------------|------|----------|-------|
| Case Number | `caseNumber` | text | Yes | |
| Court | `court` | text | Yes | Court name |
| Court Location | `courtLocation` | text | No | |
| Court Type | `courtType` | text | No | |
| Judgment Type | `judgmentType` | enum | Yes | Internal enum |
| BoG Case Type | `bogCaseType` | text | No | Coded: A-E |
| Case Reason | `caseReason` | text | No | Coded: F/R/O |
| Case Filing Date | `caseFilingDate` | text | No | YYYYMMDD |
| Judgment Date | `judgmentDate` | text | Yes | YYYYMMDD |
| Amount | `amount` | decimal(15,2) | No | |
| Judgment Currency | `judgmentCurrency` | text | No | ISO 4217 |
| Currency | `currency` | text | No | Defaults to GHS |
| Status | `status` | enum | Yes | active/resolved/appealed |
| Description | `description` | text | No | |

Borrower fields for CONJ use the same individual identification fields as CONC (Section 3.1).

---

## 6. Field-by-Field Mapping: Business Court Judgments (BUSJ)

Same judgment fields as CONJ (Section 5) but linked to corporate borrowers using business identification fields (Section 4.1).

---

## 7. Field-by-Field Mapping: Consumer Dishonoured Cheques (COND)

| BoG Field | Schema Column (`dishonoured_cheques`) | Type | Required | Notes |
|-----------|---------------------------------------|------|----------|-------|
| Account Number | `accountNumber` | text | Yes | |
| Cheque Number | `chequeNumber` | text | Yes | |
| Date Account Opened | `dateAccountOpened` | text | No | YYYYMMDD |
| Date Issued | `dateIssued` | text | Yes | YYYYMMDD |
| Date Bounced | `dateBounced` | text | Yes | YYYYMMDD |
| Reason Returned Code | `reasonReturnedCode` | text | Yes | 11 = Insufficient Funds, 12 = Fraud |
| Currency | `currency` | text | Yes | ISO 4217 (default GHS) |
| Cheque Amount | `chequeAmount` | decimal(15,2) | Yes | |

Borrower fields for COND use the same individual identification fields as CONC (Section 3.1).

---

## 8. Field-by-Field Mapping: Business Dishonoured Cheques (BUSD)

Same dishonoured cheque fields as COND (Section 7) but linked to corporate borrowers using business identification fields (Section 4.1).

---

## 9. Code Catalog Reference

All BoG code catalogs are defined in `shared/bog-codes.ts` and exported as typed constants.

### 9.1 Credit Facility Type Codes (Appendix I)

**Consumer (101-129)**

| Code | Description |
|------|-------------|
| 101 | Agriculture Facility |
| 102 | Auto Loan |
| 103 | Bank Guarantee |
| 104 | Bills Discounted |
| 106 | Credit Card |
| 107 | Education Loan |
| 108 | Hire Purchase |
| 109 | Housing Loan |
| 110 | Leasing |
| 111 | Letter of Credit |
| 112 | Loan against Bank Deposit |
| 113 | Loan against Employee Provident Fund |
| 114 | Loan against Life Insurance |
| 115 | Loan against Salary/Payroll Loan |
| 116 | Loan against Shares and Securities |
| 117 | Loan to Professional |
| 118 | Mortgage |
| 119 | Non-secured Loans |
| 120 | Other Secured Loans |
| 121 | Overdraft |
| 122 | Personal Loan |
| 123 | Pledge Loan |
| 124 | Property Loan |
| 125 | Government Loans |
| 126 | Term Loans |
| 127 | Travel Finance |
| 128 | Student Loan |
| 129 | Others |

**Business** uses the same codes, excluding 106, 107, 113, 114, 115, 117, 122, 123, 125, 127, 128. Adds 105 (Corporate Credit Card).

### 9.2 Repayment Frequency Codes

| Code | Description |
|------|-------------|
| 10 | Weekly |
| 11 | Bi Monthly |
| 12 | Monthly |
| 13 | Quarterly |
| 14 | Tri Annually |
| 15 | Semi Annually |
| 16 | Annual |
| 17 | Variable |
| 18 | Bullet (One payment) |
| 19 | Demand (Revolving) |
| 20 | Unspecified |
| 21 | Balloon |

### 9.3 Asset Classification Codes

| Code | Classification | Days Past Due |
|------|---------------|---------------|
| A | Current | 1-30 days |
| B | OLEM | 31-90 days |
| C | Substandard | 91-180 days |
| D | Doubtful | 181-360 days |
| E | Loss | Over 360 days |

### 9.4 Credit Facility Status Codes

| Code | Description |
|------|-------------|
| A | Open/Active |
| B | Approved, but not disbursed |
| C | Closed |
| D | Disputed |
| E | Terms Extended |
| G | Charge-off |
| L | Handed Over/Legal |
| N | Loan against Policy |
| P | Paid Up |
| R | Restructured/Rescheduled |
| T | Early Settlement |
| W | Written Off |
| Z | Deceased |

### 9.5 Employment Type Codes

| Code | Description |
|------|-------------|
| 101 | Salaried Individual |
| 102 | Unemployed |
| 103 | Student |
| 104 | Self Employed |
| 105 | Home Maker |
| 106 | Pensioner |

### 9.6 Owner/Tenant Codes

| Code | Description |
|------|-------------|
| O | Owner |
| T | Tenant |
| F | Family Owned |

### 9.7 Marital Status Codes

| Code | Description |
|------|-------------|
| S | Single |
| W | Widowed |
| D | Divorced |
| M | Married |
| P | Separated |

### 9.8 Purpose of Facility Codes

| Code | Description |
|------|-------------|
| A | Crisis Loan |
| B | Home Loans |
| C | Other Asset acquisition financing |
| D | Project Finance |
| E | Capital finance |
| F | Equipment and Machinery Finance |
| G | Working capital finance |
| H | Subscription finance |
| J | Finance for Trading in securities |
| K | Consolidation Loan |
| L | Other |
| P | Personal finance |
| S | Study Loan |

### 9.9 Reason for Closure Codes

| Code | Description |
|------|-------------|
| A | By Credit Grantor without prejudice to the Subject |
| B | Balance Transfer |
| C | Death |
| D | End of Credit Facility Tenure |
| E | Merger of Credit Facility |
| F | Early Settlement by Subject |
| G | By Court Order |
| H | Lost Cards/Compromised Cards |
| J | Bankruptcy |
| K | Restructured/Rescheduled |

### 9.10 Reason for Written Off

| Code | Description |
|------|-------------|
| A | Part Settlement |
| B | Death |
| C | Unable to locate |
| D | Government Concession |
| E | Bankruptcy |
| F | Other |

### 9.11 Reason for Restructure

| Code | Description |
|------|-------------|
| T | Request for top ups |
| E | Irregular repayments |
| L | Loss of job |
| D | Business down turn |
| F | Force majeure |
| C | Other |

### 9.12 Type of Security

| Code | Description |
|------|-------------|
| A | Land |
| B | Shares |
| C | Government Bonds/Securities |
| D | Building |
| E | Cash/Fixed Deposit |
| F | Bank Guarantee |
| G | Salary Assignment |
| H | Terminal Benefits Assignment |
| J | Bullions |
| K | General Plant & Machinery |
| L | Vehicles |
| M | Corporate Guarantee |
| N | Individual Guarantee |
| P | Government Guarantee |
| Q | Others |

### 9.13 Business Type Codes

| Code | Description |
|------|-------------|
| A | Sole Proprietorship |
| B | Limited Partnership |
| C | Company Limited By Shares |
| D | Company Limited By Guarantee |
| E | Unlimited Company |
| F | Cooperative |
| G | Foreign/External Company |
| H | Consultancy Firms/Professional Bodies |
| J | Social Organization |
| K | International Organizations |
| L | NGO |

### 9.14 Sector Industry Codes

| Code | Description |
|------|-------------|
| 10 | Agriculture, Forestry & Fishing |
| 20 | Mining & Quarrying |
| 30 | Manufacturing |
| 40 | Construction |
| 50 | Electricity, Gas & Water |
| 60 | Commerce & Finance |
| 70 | Transport, Storage and Communication |
| 80 | Services |

### 9.15 Sub-Sector Codes

| Code Range | Parent Sector |
|------------|---------------|
| 101-107 | Agriculture, Forestry & Fishing (10) |
| 201-206 | Mining & Quarrying (20) |
| 301-309 | Manufacturing (30) |
| 401-402 | Construction (40) |
| 501-503 | Electricity, Gas & Water (50) |
| 601-609 | Commerce & Finance (60) |
| 701-706 | Transport, Storage and Communication (70) |
| 801-806 | Services (80) |

### 9.16 Payment History Profile

| Code | Description |
|------|-------------|
| 0 | Current (1-30 days) |
| 1 | 31-60 days past due |
| 2 | 61-90 days past due |
| 3 | 91-120 days past due |
| 4 | 121-180 days past due |
| 5 | 180+ days past due |

### 9.17 Case Type Codes (Judgments)

| Code | Description |
|------|-------------|
| A | Civil |
| B | Criminal |
| C | Commercial |
| D | Family |
| E | Labour |

### 9.18 Case Reason Codes

| Code | Description |
|------|-------------|
| F | Fraud |
| R | Debt Recovery |
| O | Other |

### 9.19 Cheque Return Reason Codes

| Code | Description |
|------|-------------|
| 11 | Insufficient Funds |
| 12 | Fraud |

### 9.20 Special Comments Codes

| Code | Description |
|------|-------------|
| 101 | Paid by Co maker |
| 102 | Loan assumed by another party |
| 103 | Account closed at credit grantor's request |
| 104 | Accounts transferred to another lender |
| 105 | Adjustment pending |
| 106 | Paying under a partial payment agreement |
| 107 | Purchased by another lender |
| 108 | Payroll deduction |
| 109 | Credit Line suspended |
| 110 | Account closed due to refinance |
| 111 | Account closed due to Transfer |
| 112 | Account paid in full for less than the full balance |
| 113 | First payment never received |
| 114 | Account paid from collateral |
| 115 | Principal deferred/Interest payment only |

### 9.21 Legal Flag

| Code | Description |
|------|-------------|
| 101 | No |
| 102 | Yes |

### 9.22 Nature of Guarantor

| Code | Description |
|------|-------------|
| 101 | Individual |
| 102 | Commercial Entity |
| 103 | No Guarantor |

### 9.23 Nature of Charge

| Code | Description |
|------|-------------|
| A | Fixed |
| B | Float |

### 9.24 Collateral Indicator

| Code | Description |
|------|-------------|
| 101 | Yes (collateral exists) |
| 102 | No (unsecured) |

---

## 10. Internal Status to BoG Code Mapping

The system maps internal status values to BoG-compliant codes automatically during export.

### 10.1 Account Status Mapping

| Internal Status (`credit_accounts.status`) | BoG Status Code (`bogAccountStatus`) |
|--------------------------------------------|--------------------------------------|
| current | A (Open/Active) |
| delinquent | A (Open/Active) |
| default | L (Handed Over/Legal) |
| closed | C (Closed) |
| restructured | R (Restructured/Rescheduled) |
| written_off | W (Written Off) |

Function: `mapInternalStatusToBog()` in `shared/bog-codes.ts`

### 10.2 Asset Classification Mapping

| Internal Classification | BoG Asset Classification Code |
|------------------------|-------------------------------|
| Pass | A (Current) |
| OLEM | B (OLEM) |
| Substandard | C (Substandard) |
| Doubtful | D (Doubtful) |
| Loss | E (Loss) |

Function: `mapInternalAssetClassToBog()` in `shared/bog-codes.ts`

### 10.3 Days in Arrears to Payment History Profile

| Days in Arrears | Payment History Profile Code |
|----------------|------------------------------|
| 0-30 | 0 (Current) |
| 31-60 | 1 |
| 61-90 | 2 |
| 91-120 | 3 |
| 121-180 | 4 |
| 181+ | 5 |

Function: `mapDaysInArrearsToPaymentProfile()` in `shared/bog-codes.ts`

---

## 11. Validation Rules Summary

### 11.1 Mandatory Field Validation

| File Type | Required Fields |
|-----------|----------------|
| CONC | Ghana Card Number, Surname, Forenames, Date of Birth, Gender, Nationality, Account Number, Facility Type Code, Currency, Original Amount, Current Balance, BoG Account Status, BoG Asset Classification |
| BUSC | Company Name, Business Reg Number, TIN Number, Business Type Code, Account Number, Facility Type Code, Currency, Original Amount, Current Balance, BoG Account Status, BoG Asset Classification |
| CONJ | Ghana Card Number, Surname, Case Number, Court, Judgment Date |
| BUSJ | Company Name, Business Reg Number, Case Number, Court, Judgment Date |
| COND | Ghana Card Number, Surname, Account Number, Cheque Number, Date Issued, Date Bounced, Reason Returned Code, Currency, Cheque Amount |
| BUSD | Company Name, Business Reg Number, Account Number, Cheque Number, Date Issued, Date Bounced, Reason Returned Code, Currency, Cheque Amount |

### 11.2 Cross-Field Validation Rules

| Rule | Description | Applicable Files |
|------|-------------|-----------------|
| Days vs Classification | Days in arrears must be consistent with BoG asset classification thresholds | CONC, BUSC |
| Maturity after Disbursement | Maturity date must be after disbursement date | CONC, BUSC |
| Balance vs Original | Current balance should not exceed original amount (except revolving facilities) | CONC, BUSC |
| Written-off Consistency | Written-off amount only when asset classification is E (Loss) | CONC, BUSC |
| Collateral Consistency | Security type/value required when collateral indicator is 101 (Yes) | CONC, BUSC |
| Overdue Buckets | Sum of overdue buckets should equal total amount overdue | CONC, BUSC |
| Bounce after Issue | Date bounced must be on or after date issued | COND, BUSD |
| Judgment after Filing | Judgment date must be on or after case filing date | CONJ, BUSJ |

### 11.3 Data Format Validation

| Field Type | Rule |
|-----------|------|
| Dates | Must be in YYYYMMDD format (8 digits, no separators) |
| Amounts | Rounded to whole numbers, no decimal point in export |
| Currency | ISO 4217 three-letter code (GHS for Ghana domestic) |
| Coded fields | Must match exact codes from the relevant appendix |
| Text fields | No pipe characters allowed within field values |

---

## 12. Export Workflow

### 12.1 Process Overview

1. **Select File Type**: Choose one of the six BoG file types (CONC, BUSC, CONJ, BUSJ, COND, BUSD)
2. **Set Reporting Date**: The end date of the reporting period (typically month-end)
3. **Set Sequence Number**: Starting at 1 for the first submission of a reporting period; increment for resubmissions
4. **Generate Export**: The system queries the database, maps internal data to BoG codes, and produces pipe-delimited CSV
5. **Download File**: File is returned with the correct BoG filename format and Content-Disposition header

### 12.2 API Endpoint

```
GET /api/bog/export/:fileType
```

**Parameters:**
- `:fileType` (path) - One of: CONC, BUSC, CONJ, BUSJ, COND, BUSD
- `reportingDate` (query) - Reporting period date in YYYYMMDD format
- `sequenceNumber` (query, optional) - Defaults to 1

**Authorization:** Requires `super_admin` or `regulator` role.

**Response:** Pipe-delimited CSV file download with proper filename.

### 12.3 Export Data Flow

```
Database Tables                    BoG Code Catalogs               Export Output
+------------------+              +--------------------+           +------------------+
| borrowers        |  -------->   | bog-codes.ts       |  ------>  | Pipe-delimited   |
| credit_accounts  |              | - Status mapping   |           | CSV file with    |
| court_judgments   |              | - Asset class map  |           | BoG headers and  |
| dishonoured_     |              | - Date formatting  |           | coded values     |
|   cheques        |              | - Amount rounding  |           +------------------+
+------------------+              +--------------------+
```

### 12.4 Correction Indicators

When resubmitting data, use the correction indicator field:

| Value | Meaning | Usage |
|-------|---------|-------|
| 0 | Normal submission | Standard data submission |
| 1 | Correction | Correcting previously submitted data |
| 2 | Delete | Removing previously submitted record |

### 12.5 UI Access

The BoG Export page is accessible from the application sidebar under the "BoG Export" navigation item. The page provides:

- File type selector (dropdown with all 6 file types)
- Reporting date picker
- Sequence number input
- File name preview showing the generated filename
- Download button to trigger the export

---

## 13. Database Tables Summary

| Table | Purpose | BoG File Types |
|-------|---------|---------------|
| `borrowers` | Individual and corporate borrower records | All (CONC, BUSC, CONJ, BUSJ, COND, BUSD) |
| `credit_accounts` | Credit facility records with BoG-compliant fields | CONC, BUSC |
| `court_judgments` | Court judgment records with BoG case type fields | CONJ, BUSJ |
| `dishonoured_cheques` | Bounced cheque records | COND, BUSD |

---

## 14. Utility Functions Reference

All utility functions are exported from `shared/bog-codes.ts`:

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `mapInternalStatusToBog(status)` | Maps internal account status to BoG single-char code | Internal status string | BoG status code (A-Z) |
| `mapInternalAssetClassToBog(classification)` | Maps internal asset classification to BoG code | Classification string or null | BoG code (A-E) |
| `mapDaysInArrearsToPaymentProfile(days)` | Maps days in arrears to payment history profile | Number of days | Profile code (0-5) |
| `formatBogDate(dateStr)` | Converts date string to YYYYMMDD format | Date string with separators | 8-digit date string |
| `formatBogAmount(amount)` | Rounds amount to whole number string | Number or string amount | Whole number string |
| `generateBogFilename(srn, reportingDate, fileCreatedDate, fileId, sequenceNum)` | Generates compliant filename | Components | Full filename string |

---

*Document Reference: GH-CRB-COMPLIANCE-MAP-2026-v1.1*
*Classification: Technical Reference - BoG CRB v1.1 Compliance*
