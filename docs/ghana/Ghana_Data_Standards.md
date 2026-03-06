# Ghana Credit Registry — BoG CRB Data Standards Reference

**Systems In Motion Limited**
**Version 1.1 | Bank of Ghana CRB Data Format Specification**

---

## 1. Overview

This document provides the complete data standards reference for the Ghana Credit Registry, aligned with Bank of Ghana Credit Reporting Bureau (CRB) Data Standards Version 1.1. All data submissions to the registry must conform to these specifications.

---

## 2. File Format Specification

### 2.1 General Format Rules

| Parameter | Specification |
|-----------|--------------|
| Delimiter | Pipe character (|) |
| Encoding | UTF-8 |
| Line ending | CRLF or LF |
| Date format | YYYYMMDD |
| Decimal separator | Period (.) |
| Currency code | ISO 4217 (GHS default) |
| Null values | Empty string between delimiters |
| Header row | Required (first row) |

### 2.2 File Naming Convention

```
SRN-ReportingDate-CreationDate-Version-FileType-Sequence.csv
```

| Component | Format | Example |
|-----------|--------|---------|
| SRN | Institution registration number | GCB001 |
| ReportingDate | YYYYMMDD | 20260115 |
| CreationDate | YYYYMMDD | 20260120 |
| Version | Major.Minor | 1.1 |
| FileType | See table below | CONC |
| Sequence | Numeric | 1 |

**Example**: `GCB001-20260115-20260120-1.1-CONC-1.csv`

### 2.3 File Types

| Code | Description | Content |
|------|-------------|---------|
| BUSC | Business Credit | Credit facilities for corporate borrowers |
| CONC | Consumer Credit | Credit facilities for individual borrowers |
| BUSD | Business Dishonoured Cheques | Returned cheques for businesses |
| COND | Consumer Dishonoured Cheques | Returned cheques for individuals |
| BUSJ | Business Court Judgments | Court orders against businesses |
| CONJ | Consumer Court Judgments | Court orders against individuals |

---

## 3. Credit Facility Type Codes (Appendix I)

| Code | Description | Typical Term |
|------|-------------|--------------|
| OVD | Overdraft | Revolving |
| TML | Term Loan | 1-10 years |
| MTG | Mortgage | 10-25 years |
| CRC | Credit Card | Revolving |
| LAS | Loan Against Salary | 1-3 years |
| MFL | Microfinance Loan | 3-24 months |
| TRF | Trade Finance | 30-180 days |
| LSE | Lease | 1-5 years |
| GRT | Guarantee | Per underlying facility |
| LOC | Letter of Credit | 30-360 days |
| BND | Bond | 1-30 years |
| STL | Staff Loan | Per employer terms |
| GRP | Group Loan | 3-12 months |
| OTH | Other | Variable |

---

## 4. Asset Classification Codes (BoG BSD/2018/01)

| Code | Classification | Days Past Due | Minimum Provision |
|------|---------------|---------------|-------------------|
| CUR | Current | 0-30 days | 1% of outstanding |
| OLM | OLEM | 31-90 days | 10% of outstanding |
| SUB | Substandard | 91-180 days | 25% of outstanding |
| DBT | Doubtful | 181-360 days | 50% of outstanding |
| LSS | Loss | 360+ days | 100% (full write-off) |

### 4.1 Classification Rules
- Classification is based on the **number of days in arrears** as at the reporting date
- For facilities with restructured terms, classification should reflect the **worst status** in the preceding 12 months
- Written-off facilities remain reported for **5 years** after write-off date
- OLEM classification triggers enhanced monitoring requirements

---

## 5. Purpose of Facility Codes (Appendix II)

| Code | Purpose |
|------|---------|
| PER | Personal / Household |
| BUS | Business / Working Capital |
| AGR | Agriculture |
| EDU | Education |
| HSG | Housing / Construction |
| VEH | Vehicle Purchase |
| TRD | Trade / Commerce |
| MFG | Manufacturing |
| INF | Infrastructure |
| OTH | Other |

---

## 6. Repayment Frequency Codes (Appendix III)

| Code | Frequency | Typical Use |
|------|-----------|-------------|
| DLY | Daily | Microfinance daily collections |
| WKL | Weekly | Microfinance, group loans |
| BWK | Bi-Weekly | Salary-based loans |
| MTH | Monthly | Standard term loans, mortgages |
| QTR | Quarterly | Corporate facilities |
| SAN | Semi-Annually | Bond payments |
| ANN | Annually | Bullet payments |
| MAT | At Maturity | Short-term trade finance |
| IRR | Irregular | Flexible facilities |

---

## 7. Reason for Closure Codes (Appendix V)

| Code | Reason |
|------|--------|
| NOR | Normal Closure (fully repaid) |
| EAR | Early Settlement by Subject |
| WOF | Written Off |
| TRF | Transferred to Another Institution |
| REF | Refinanced |
| OTH | Other |

---

## 8. Collateral / Security Type Codes (Appendix VI)

| Code | Type | Valuation Requirement |
|------|------|----------------------|
| PRO | Property / Real Estate | Independent valuation required |
| VEH | Motor Vehicle | Market value assessment |
| EQP | Equipment / Machinery | Depreciated replacement cost |
| STK | Stocks / Shares | Market price at reporting date |
| FXD | Fixed Deposit | Face value |
| GOV | Government Securities | Market value |
| INV | Inventory | Net realizable value |
| REC | Receivables | Discounted value |
| GRT | Personal Guarantee | N/A |
| INS | Insurance Policy | Surrender value |
| OTH | Other | As applicable |
| UNS | Unsecured | N/A |

---

## 9. Business Type Codes (Appendix VII)

| Code | Type | Registration Body |
|------|------|-------------------|
| LLC | Limited Liability Company | Registrar General's Department |
| LBG | Company Limited by Guarantee | Registrar General's Department |
| PNR | Partnership | Registrar General's Department |
| SOP | Sole Proprietorship | Registrar General's Department |
| PLC | Public Limited Company | SEC / Registrar General |
| NGO | Non-Governmental Organization | Registrar General / DSW |
| GOV | Government Entity | Government of Ghana |
| SOE | State-Owned Enterprise | Government of Ghana |
| OTH | Other | As applicable |

---

## 10. Industry / Sector Codes (Appendix VIII)

| Code | Sector | ISIC Alignment |
|------|--------|----------------|
| AGR | Agriculture, Forestry and Fishing | Section A |
| MIN | Mining and Quarrying | Section B |
| MFG | Manufacturing | Section C |
| EGW | Electricity, Gas and Water | Section D/E |
| CON | Construction | Section F |
| WRT | Wholesale and Retail Trade | Section G |
| HRS | Hotels, Restaurants and Tourism | Section I |
| TRN | Transport and Storage | Section H |
| FIN | Financial Intermediation | Section K |
| RES | Real Estate and Business Services | Section L/M |
| EDU | Education | Section P |
| HLT | Health and Social Work | Section Q |
| COM | Community and Social Services | Section R/S |
| ICT | Information and Communication | Section J |
| OTH | Other | N/A |

---

## 11. Dishonoured Cheque Reason Codes (Appendix IX)

| Code | Reason | Common Occurrence |
|------|--------|-------------------|
| INF | Insufficient Funds | Most common (75%+) |
| ACC | Account Closed | 10% of returns |
| STL | Stale Cheque | Older than 6 months |
| STP | Stop Payment | Drawer instruction |
| SIG | Signature Differs | Verification failure |
| AMT | Amount in Words and Figures Differ | Format error |
| ALT | Alteration on Cheque | Unauthorized change |
| OTH | Other | Miscellaneous |

---

## 12. Facility Closure Reason Codes

| Code | Reason |
|------|--------|
| NOR | Normal Closure |
| EAR | Early Settlement by Subject |
| WOF | Written Off |
| TRF | Transferred to Another Institution |
| REF | Refinanced |
| OTH | Other |

---

## 13. Identity Document Codes

| Code | Document | Format | Issuing Authority |
|------|----------|--------|-------------------|
| GHANA_CARD | Ghana Card (National ID) | GHA-XXXXXXXXX | National Identification Authority |
| VOTERS_ID | Voter's ID Card | Various formats | Electoral Commission |
| SSNIT | SSNIT Number | Numeric | Social Security Authority |
| DRIVERS_LICENSE | Driver's License | Alphanumeric | DVLA |
| PASSPORT | Ghana Passport | G-XXXXXXX | Immigration Service |

---

## 14. Marital Status Codes

| Code | Status |
|------|--------|
| SNG | Single |
| MRD | Married |
| DIV | Divorced |
| WID | Widowed |
| SEP | Separated |

---

## 15. Employment Type Codes (Appendix X)

| Code | Employment Status |
|------|------------------|
| EMP | Employed |
| SLF | Self-Employed |
| UNE | Unemployed |
| RET | Retired |
| STD | Student |
| HMK | Homemaker |
| OTH | Other |

---

## 16. Proof of Address Codes (Appendix XI)

| Code | Document Type |
|------|--------------|
| WAT | Water Bill |
| ELE | Electricity Bill |
| BNK | Bank Statement |
| TEN | Tenancy Agreement |
| OTH | Other |

---

## 17. Data Validation Rules

### 17.1 Mandatory Field Checks
- Ghana Card Number: Required for all individual submissions (from 2024)
- Account Number: Must be unique per institution
- Currency: Must be GHS for Ghana domestic facilities
- Facility Type: Must match BoG Appendix I codes
- Asset Classification: Must match BoG classification codes

### 17.2 Cross-Field Validations
| Rule | Description |
|------|-------------|
| Days in arrears vs classification | Must be consistent with BoG thresholds |
| Maturity date vs disbursement date | Maturity must be after disbursement |
| Current balance vs original amount | Current balance should not exceed original (except for revolving) |
| Written-off amount | Only applicable when asset classification is LSS |
| Collateral value | Must be provided when collateral type is not UNS |

---

*Document Reference: GH-DATA-2026-v1.1*
*Classification: Technical — Data Standards*
