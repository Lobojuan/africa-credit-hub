# Data Submission Guide

**Version 2.5** | Pan-African Credit Registry — Central Data Hub (CDH)

**Africa Credit Hub™**

---

## 1. Introduction

This guide provides participating financial institutions with detailed instructions for submitting credit data to the Pan-African Central Data Hub (CDH). It covers manual entry, batch upload, external API submission, and Bank of Ghana (BoG) Institutional Fact File (IFF) formats.

### 1.1 Who Should Use This Guide

- **Bank Officers & Lenders** — Staff responsible for reporting credit data from their institution
- **IT/Integration Teams** — Developers building automated data feeds to the CDH
- **Compliance Officers** — Staff ensuring data submissions meet regulatory standards
- **Data Quality Teams** — Staff responsible for validating and cleaning credit data before submission

### 1.2 Submission Channels

| Channel | Best For | Access |
|---------|----------|--------|
| Web Portal (Manual Entry) | Individual records, corrections | All authenticated users |
| Web Portal (Batch Upload) | Monthly bulk submissions (CSV) | Admin, Lender roles |
| External REST API | Automated system-to-system feeds | API key holders |
| BoG IFF Upload | Ghana regulatory reporting (6 file types) | Ghana-mode institutions |

---

## 2. Data Entities & Submission Order

Credit data must be submitted in a specific order due to entity dependencies:

```
1. Borrowers (Consumers & Businesses)
       ↓
2. Credit Accounts (linked to borrowers)
       ↓
3. Payment History (linked to credit accounts)
       ↓
4. Court Judgments (linked to borrowers)
       ↓
5. Dishonoured Cheques (linked to borrowers)
       ↓
6. Guarantors (linked to credit accounts)
```

**Rule:** A borrower record must exist before you can submit credit accounts for that borrower. A credit account must exist before you can submit payment history for that account.

---

## 3. Borrower Submission

### 3.1 Individual Borrowers

Required fields for individual borrowers:

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Type | Yes | `individual` | `individual` |
| First Name | Yes | Text | `Amina` |
| Last Name | Yes | Text | `Hassan` |
| National ID | Yes | Country-specific | `GHA-ID-123456789` |
| Country | Yes | Full country name | `Ghana` |
| Date of Birth | Recommended | `YYYY-MM-DD` | `1985-06-15` |
| Gender | Recommended | `male`, `female`, `other` | `female` |
| Phone | Recommended | With country code | `+233551234567` |
| Email | Recommended | Valid email | `amina@example.com` |
| Address | Recommended | Physical address | `14 Oxford St, Osu, Accra` |
| TIN Number | Optional | Tax ID | `TIN-GH-001234` |
| Employer Name | Optional | Text | `Standard Chartered Bank` |
| Occupation | Optional | Text | `Senior Accountant` |
| Passport Number | Optional | Text | `GH-A1234567` |

### 3.2 Corporate Borrowers

Required fields for corporate borrowers:

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Type | Yes | `corporate` | `corporate` |
| Company Name | Yes | Text | `Lagos Exports Ltd` |
| National ID | Yes | Business reg number | `NGA-BIZ-112233` |
| Country | Yes | Full country name | `Nigeria` |
| Business Reg Number | Recommended | Official registration | `RC-123456` |
| Sector | Recommended | Industry sector | `Manufacturing` |
| Phone | Recommended | With country code | `+2341234567890` |
| Email | Recommended | Valid email | `info@lagosexports.ng` |
| Address | Recommended | Registered address | `21 Marina Rd, Lagos` |

### 3.3 National ID Formats

For consistency across the pan-African registry, use the following format conventions:

| Country | Individual Format | Corporate Format |
|---------|-------------------|------------------|
| Ghana | `GHA-ID-{number}` or Ghana Card number | `GHA-BIZ-{number}` |
| Kenya | `KEN-ID-{number}` | `KEN-BIZ-{number}` |
| Nigeria | `NGA-ID-{number}` or NIN | `NGA-BIZ-{RC number}` |
| Ethiopia | `ETH-ID-{number}` | `ETH-BIZ-{number}` |
| South Africa | RSA ID number (13 digits) | `ZAF-BIZ-{number}` |
| Other | `{ISO3}-ID-{number}` | `{ISO3}-BIZ-{number}` |

**Important:** The `nationalId` field is globally unique across the entire registry. Duplicate submissions will be rejected.

### 3.4 PEP (Politically Exposed Person) Flag

If the borrower is a Politically Exposed Person, set:
- `isPep`: `true`
- `pepDetails`: Description of the public position (e.g., "Member of Parliament, Northern Region")

---

## 4. Credit Account Submission

### 4.1 Required Fields

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Borrower ID | Yes | UUID (from registry) | `a1b2c3d4-e5f6-7890-...` |
| Account Number | Yes | Institution's account/loan number | `LN-2026-00145` |
| Account Type | Yes | Credit facility type | `Personal Loan` |
| Original Amount | Yes | Decimal string | `500000.00` |
| Current Balance | Yes | Decimal string | `425000.00` |
| Currency | Yes | ISO 4217 code | `GHS` |
| Status | Yes | See status values below | `current` |

### 4.2 Account Status Values

| Status | Description |
|--------|-------------|
| `current` | Account is performing, payments up to date |
| `delinquent` | Payments are past due (1–89 days) |
| `default` | Seriously delinquent (90+ days past due) |
| `closed` | Account has been fully paid off and closed |
| `restructured` | Loan terms have been modified |
| `written_off` | Account has been written off as a loss |

### 4.3 Optional But Recommended Fields

| Field | Format | Description |
|-------|--------|-------------|
| Interest Rate | Decimal string (%) | Annual interest rate |
| Disbursement Date | `YYYY-MM-DD` | Date the loan was disbursed |
| Maturity Date | `YYYY-MM-DD` | Expected final payment date |
| Days in Arrears | Integer | Number of days past due |
| Collateral Type | Text | Type of security pledged |
| Collateral Value | Decimal string | Estimated collateral value |
| Last Payment Date | `YYYY-MM-DD` | Most recent payment date |
| Last Payment Amount | Decimal string | Most recent payment amount |
| Grace Period Months | Integer | Grace period in months |
| Restructure Count | Integer | Number of restructurings |
| Is Interest Free | Boolean | Islamic/Sharia-compliant flag |

### 4.4 Account Types

Common account types accepted by the registry:

| Category | Account Types |
|----------|---------------|
| Consumer Credit | Personal Loan, Mortgage, Credit Card, Auto Loan, Student Loan, Overdraft, Microfinance Loan |
| Business Credit | Business Loan, Trade Finance, Working Capital, Equipment Lease, Commercial Mortgage, Letter of Credit |
| Agriculture | Agricultural Loan, Seasonal Credit Facility |
| Specialized | Staff Loan, Group Loan, Mobile Money Loan |

### 4.5 Currency Codes

Always specify the ISO 4217 currency code. The CDH supports 42+ African currencies plus USD, EUR, and GBP. Common codes:

| Code | Currency | Country |
|------|----------|---------|
| `GHS` | Ghanaian Cedi | Ghana |
| `KES` | Kenyan Shilling | Kenya |
| `NGN` | Nigerian Naira | Nigeria |
| `ETB` | Ethiopian Birr | Ethiopia |
| `ZAR` | South African Rand | South Africa |
| `XOF` | West African CFA Franc | WAEMU zone |
| `XAF` | Central African CFA Franc | CEMAC zone |
| `USD` | US Dollar | Cross-border |

See the API Integration Guide, Section 7 for the full currency list.

---

## 5. Payment History Submission

### 5.1 Required Fields

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Credit Account ID | Yes | UUID (from registry) | `b2c3d4e5-f6a7-...` |
| Period | Yes | `YYYY-MM` | `2026-03` |
| Amount Due | Yes | Decimal string | `15000.00` |
| Amount Paid | Yes | Decimal string | `15000.00` |
| Status | Yes | See below | `on_time` |
| Days Late | Optional | Integer | `0` |

### 5.2 Payment Status Values

| Status | Description |
|--------|-------------|
| `on_time` | Full payment received by the due date |
| `late` | Payment received after the due date |
| `missed` | No payment received for the period |
| `partial` | Partial payment received |

### 5.3 Submission Frequency

- Submit payment history **monthly** for all active credit accounts
- Report for the preceding calendar month (e.g., submit March data in early April)
- Each period should have exactly one record per credit account
- Late submissions are accepted but should be minimized to maintain data currency

---

## 6. Court Judgments

### 6.1 Required Fields

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Borrower ID | Yes | UUID | `a1b2c3d4-...` |
| Case Number | Yes | Court reference | `HC/COM/2026/0045` |
| Court | Yes | Court name | `High Court, Accra` |
| Judgment Type | Yes | See below | `civil_judgment` |
| Judgment Date | Yes | `YYYY-MM-DD` | `2026-01-15` |
| Status | Yes | `active`, `resolved`, `appealed` | `active` |
| Amount | Optional | Decimal string | `250000.00` |
| Currency | Optional | ISO 4217 | `GHS` |
| Description | Optional | Text | `Default on commercial loan` |

### 6.2 Judgment Types

| Type | Description |
|------|-------------|
| `lien` | Legal claim against property as debt security |
| `bankruptcy` | Formal bankruptcy or insolvency filing |
| `lawsuit` | Active legal proceedings |
| `civil_judgment` | Court order for monetary damages |
| `criminal_conviction` | Criminal conviction related to financial matters |

---

## 7. Dishonoured Cheques

Submit dishonoured (bounced) cheque records to flag borrowers with a history of returned instruments.

| Field | Required | Description |
|-------|----------|-------------|
| Borrower ID | Yes | UUID of the borrower |
| Cheque Number | Yes | The cheque serial number |
| Amount | Yes | Face value of the cheque |
| Currency | Yes | ISO 4217 currency code |
| Date Issued | Yes | Date on the cheque |
| Date Dishonoured | Yes | Date the cheque was returned |
| Reason Code | Yes (Ghana) | BoG return reason code |
| Drawee Bank | Optional | Bank the cheque was drawn on |

---

## 8. Manual Entry via Web Portal

### 8.1 Adding a Borrower

1. Navigate to **Consumers & Businesses** from the sidebar.
2. Click the **Add Borrower** button (see *Figure 1: Add Borrower form*).
3. Select the borrower type: **Individual** or **Corporate**.
4. Fill in the required and recommended fields.
5. Click **Submit**.
6. If the **Maker-Checker** (four-eye principle) is active, the record will be placed in **Pending Approvals** for a second user to approve before it becomes active.

### 8.2 Adding a Credit Account

1. Navigate to a borrower's detail page.
2. Click the **Add Account** button in the Credit Accounts section.
3. Fill in the account details (account number, type, amount, currency, status).
4. Click **Submit**.
5. The account will appear in the borrower's credit profile once approved (if maker-checker is active).

### 8.3 Recording Payment History

1. Navigate to a credit account's detail view.
2. Click **Add Payment** in the Payment History section.
3. Enter the period, amount due, amount paid, and status.
4. Click **Submit**.

---

## 9. Batch Upload via CSV

### 9.1 Accessing Batch Upload

1. Navigate to **Batch Upload** from the sidebar (Admin or Lender role required; see *Figure 2: Batch Upload screen*).
2. Select the **entity type** you wish to upload:
   - Borrowers
   - Credit Accounts
   - Payment History

### 9.2 CSV File Requirements

- File format: UTF-8 encoded CSV
- Maximum file size: 10 MB per upload
- Maximum records: 10,000 rows per file (excluding header row)
- First row must contain column headers matching the field names exactly
- Date fields must use `YYYY-MM-DD` format
- Decimal amounts should use a period (`.`) as the decimal separator
- Text fields containing commas must be enclosed in double quotes

### 9.3 Sample CSV — Borrowers

```csv
type,firstName,lastName,nationalId,country,dateOfBirth,gender,phone,email,address
individual,Amina,Hassan,GHA-ID-123456,Ghana,1985-06-15,female,+233551234567,amina@example.com,"14 Oxford St, Osu, Accra"
individual,Kofi,Mensah,GHA-ID-789012,Ghana,1990-03-22,male,+233241234567,kofi@example.com,"7 Ring Road, Kumasi"
corporate,,,NGA-BIZ-112233,Nigeria,,,,info@lagosexports.ng,"21 Marina Rd, Lagos"
```

**Note:** For corporate borrowers, leave `firstName` and `lastName` empty but include `companyName` as an additional column.

### 9.4 Sample CSV — Credit Accounts

```csv
borrowerId,accountNumber,accountType,originalAmount,currentBalance,currency,status,interestRate,disbursementDate,maturityDate,daysInArrears
a1b2c3d4-...,LN-2026-001,Personal Loan,50000.00,42000.00,GHS,current,24.5,2026-01-15,2029-01-15,0
b2c3d4e5-...,LN-2026-002,Business Loan,500000.00,480000.00,GHS,current,21.0,2026-02-01,2031-02-01,0
```

### 9.5 Sample CSV — Payment History

```csv
creditAccountId,period,amountDue,amountPaid,status,daysLate
c3d4e5f6-...,2026-01,4500.00,4500.00,on_time,0
c3d4e5f6-...,2026-02,4500.00,4500.00,on_time,0
c3d4e5f6-...,2026-03,4500.00,3000.00,partial,0
```

### 9.6 Batch Processing Behavior

- Each row is validated and processed independently
- If a row fails validation, the remaining rows continue processing
- After upload, a summary displays:
  - Total records submitted
  - Successfully processed count
  - Failed count with error details per row
- Failed records can be corrected and re-submitted in a new batch

### 9.7 Common Batch Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Duplicate nationalId` | Borrower already exists | Search for existing borrower and use their ID |
| `Invalid borrowerId` | UUID not found in registry | Ensure borrower was created first |
| `Invalid currency` | Unsupported currency code | Use ISO 4217 code from supported list |
| `Missing required field` | Column value is empty | Fill in all required fields |
| `Invalid date format` | Date not in YYYY-MM-DD | Correct date format |
| `Invalid status` | Status value not recognized | Use exact status values from this guide |

---

## 10. API Submission

### 10.1 Overview

The External REST API enables automated system-to-system data submission. Full API documentation is available in the **API Integration Guide**.

### 10.2 Authentication

Two authentication methods are supported:

1. **API Key** — Include `X-API-Key: YOUR_KEY` in request headers
2. **OAuth 2.0** — Use Bearer token from `/api/external/v1/auth/token`

### 10.3 Key Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Create Borrower(s) | POST | `/api/external/v1/borrowers` |
| Search Borrowers | GET | `/api/external/v1/borrowers/search?q={term}` |
| Create Credit Account(s) | POST | `/api/external/v1/credit-accounts` |
| Submit Payment History | POST | `/api/external/v1/payment-history` |
| Pull Credit Report | GET | `/api/external/v1/credit-report/:borrowerId` |
| Health Check | GET | `/api/external/v1/health` |

### 10.4 Batch API Submissions

Send a JSON array instead of a single object to submit multiple records in one request:

```json
[
  { "type": "individual", "firstName": "Amina", "lastName": "Hassan", "nationalId": "GHA-ID-123", "country": "Ghana" },
  { "type": "individual", "firstName": "Kofi", "lastName": "Mensah", "nationalId": "GHA-ID-456", "country": "Ghana" }
]
```

- Maximum batch size: 100 records per request
- Each record is validated independently
- Response includes `results` and `errors` arrays

### 10.5 Idempotency

For critical submissions, include an `Idempotency-Key` header to prevent duplicate processing:

```
POST /api/external/v1/borrowers
Idempotency-Key: unique-request-id-123
```

If a request with the same idempotency key is received within 24 hours, the original response is replayed without re-processing.

---

## 11. Bank of Ghana IFF Upload (Ghana Mode)

### 11.1 Overview

Ghana-mode institutions must submit data in the Bank of Ghana (BoG) Institutional Fact File (IFF) format. The CDH accepts 6 IFF file types (see *Figure 3: IFF Upload interface*).

### 11.2 IFF File Types

| BoG Code | System Code | File Type | Description |
|----------|-------------|-----------|-------------|
| `CONC` | `CONSUMER_CREDIT` | Consumer Credit | Individual borrower credit facility data |
| `COND` | `CONSUMER_DISHONOURED_CHEQUE` | Consumer Dishonoured Cheque | Individual bounced cheque records |
| `CONJ` | `CONSUMER_JUDGEMENT` | Consumer Judgment | Court judgments against individuals |
| `BUSC` | `BUSINESS_CREDIT` | Business Credit | Corporate borrower credit facility data |
| `BUSD` | `BUSINESS_DISHONOURED_CHEQUES` | Business Dishonoured Cheques | Corporate bounced cheque records |
| `BUSJ` | `BUSINESS_JUDGEMENT` | Business Judgment | Court judgments against businesses |

### 11.3 IFF File Format

- File format: CSV (comma-separated values)
- Encoding: UTF-8
- First row: Column headers matching BoG CRB v1.1 field names
- The system auto-detects the IFF type based on header columns

### 11.4 Uploading IFF Files

1. Navigate to **BoG Export** from the sidebar (Ghana-mode only).
2. Select the **Upload** tab.
3. Click **Choose File** and select your IFF CSV file.
4. The system auto-detects the IFF type and validates the file structure.
5. Review the validation summary:
   - Record count
   - Detected IFF type
   - Any validation warnings or errors
6. Click **Process** to import the data into the CDH.

### 11.5 IFF Validation Rules

The CDH validates IFF files against BoG CRB v1.1 standards:

- All required fields must be present and non-empty
- Date fields must be in the format specified by BoG standards
- Currency must be `GHS` for domestic accounts
- Asset classification codes must match BoG-defined values
- Facility type codes must be valid BoG facility types
- Industry codes must match BoG Standard Industrial Classification

### 11.6 BoG Export

The CDH can also **generate** IFF files for submission to the Bank of Ghana:

1. Navigate to **BoG Export** from the sidebar.
2. Select the desired file type from the dropdown.
3. Apply any date filters if needed.
4. Click **Generate** to create the IFF file.
5. Download the generated CSV file for submission to BoG.

---

## 12. Data Quality Standards

### 12.1 Completeness Requirements

All submissions are evaluated against data quality standards:

| Level | Requirement |
|-------|-------------|
| **Mandatory** | All required fields must be populated. Submissions missing required fields are rejected. |
| **Recommended** | Fields marked "Recommended" should be populated for 80%+ of records to maintain data quality scores. |
| **Optional** | Optional fields enhance the credit profile but are not required. |

### 12.2 Data Quality Scoring

The CDH tracks data completeness per institution. Key metrics include:

- **Borrower completeness** — Percentage of borrowers with all recommended fields populated
- **Account completeness** — Percentage of accounts with interest rate, disbursement date, and collateral information
- **Payment timeliness** — Percentage of payment history records submitted within 15 days of period end

Institutions with data quality scores below 70% may receive compliance notices from the regulator.

### 12.3 Data Accuracy Requirements

- **National IDs** must be verified against official identity systems where available
- **Amounts** must reflect actual outstanding balances, not original disbursement amounts
- **Account statuses** must be updated promptly when conditions change (e.g., from `current` to `delinquent`)
- **Payment history** must reflect actual payments received, not scheduled amounts

---

## 13. Submission Schedule

### 13.1 Recommended Reporting Calendar

| Data Type | Frequency | Deadline |
|-----------|-----------|----------|
| New borrower records | As originated | Within 5 business days of onboarding |
| New credit accounts | As originated | Within 5 business days of disbursement |
| Payment history | Monthly | By the 15th of the following month |
| Account status changes | As they occur | Within 2 business days |
| Court judgments | As received | Within 5 business days |
| Dishonoured cheques | As they occur | Within 3 business days |
| BoG IFF submission (Ghana) | Monthly | Per BoG reporting calendar |

### 13.2 Late Submission

- Submissions received after the deadline are accepted but flagged as late
- Repeated late submissions may trigger regulatory compliance reviews
- Institutions should contact the CDH administrator if unable to meet deadlines due to system issues

---

## 14. Maker-Checker (Four-Eye Principle)

### 14.1 How It Works

When the maker-checker workflow is enabled:

1. **Maker** — A user creates or modifies a record (borrower, credit account, etc.)
2. The record is placed in **Pending Approvals** with status `pending`
3. **Checker** — A different user with appropriate permissions reviews the submission
4. The checker can **Approve** (record becomes active) or **Reject** (record is discarded)
5. Both the maker and checker actions are logged in the audit trail

### 14.2 Rules

- The maker and checker must be different users
- Only users with Admin, Regulator, or designated approval roles can act as checkers
- Pending records are not visible in credit reports until approved
- Rejected records include a rejection reason for the maker's reference

---

## 15. Consent Requirements

### 15.1 When Consent Is Required

Before submitting a borrower's data or pulling their credit report, the institution must obtain and record consent:

- **Data submission consent** — Authorization to share the borrower's credit data with the registry
- **Credit inquiry consent** — Authorization to pull the borrower's credit report

### 15.2 Recording Consent

Consent records include:
- Borrower ID
- Consent type (`data_sharing`, `credit_inquiry`, `marketing`)
- Purpose description
- Consent date and expiry date
- Receipt number (auto-generated unique identifier)

### 15.3 Consent via API

```
POST /api/external/v1/consent
{
  "borrowerId": "a1b2c3d4-...",
  "consentType": "data_sharing",
  "purpose": "Monthly credit data reporting",
  "expiryDate": "2027-03-01"
}
```

---

## 16. Troubleshooting

### 16.1 Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Duplicate nationalId" | Borrower already registered | Search for existing record, use their UUID |
| "Invalid borrowerId" | UUID not found | Ensure borrower was created and approved first |
| "Validation failed" | Missing required fields | Check error details for specific field |
| "Insufficient permissions" | API key lacks write access | Contact administrator to upgrade permissions |
| File upload times out | File too large | Split into smaller files (< 10,000 rows) |
| IFF type not detected | Column headers don't match | Verify headers match BoG CRB v1.1 specification |
| Currency rejected | Invalid ISO 4217 code | Use codes from the supported currency list |

### 16.2 Getting Help

| Resource | Contact |
|----------|---------|
| Technical support | helpdesk@africacredithub.com |
| API documentation | API Integration Guide (available in Documentation section) |
| BoG data standards | Ghana Data Standards Reference (Ghana documentation) |
| Africa Credit Hub Support | support@africacredithub.com |


---

*© 2026 Africa Credit Hub. All rights reserved.*
