# Ghana Credit Registry — API Integration Guide

**Carlson Capital & Systems In Motion Limited**
**Version 1.1 | Bank of Ghana CRB v1.1 Compliant API | CDH v2.0**

---

**Regulatory Authority**: Bank of Ghana (BoG)
**Applicable Laws**: Credit Reporting Act, 2007 (Act 726) | Data Protection Act, 2012 (Act 843) | Electronic Transactions Act, 2008 (Act 772)
**Classification**: CONFIDENTIAL — For BoG-Licensed Institutions Only

---

## 1. Legal Framework and API Usage

### 1.1 Regulatory Authorization

Per Section 7 of the Credit Reporting Act (Act 726), only institutions licensed by the Bank of Ghana may access or submit data to the Credit Registry via this API. Unauthorized access constitutes a criminal offense under Section 30 of Act 726, punishable by a fine not exceeding 500 penalty units or imprisonment not exceeding 2 years, or both.

### 1.2 Data Processing Legal Basis

All API data processing is conducted under the following legal bases per the Data Protection Act (Act 843):

| API Operation | Legal Basis | Act 843 Reference |
|--------------|-------------|-------------------|
| Submit borrower data | Legal obligation (BoG mandate) | Section 17(b) |
| Submit credit accounts | Legal obligation + consent | Section 17(b), 17(a) |
| Pull credit report | Consent of data subject | Section 17(a) |
| Search borrower | Legitimate interest + consent | Section 20 |
| Submit court judgments | Legal obligation | Section 17(b) |
| Submit dishonoured cheques | Legal obligation | Section 17(b) |
| Batch data submission | Legal obligation (BoG mandate) | Section 17(b) |

### 1.3 Consent Requirements

Per Act 726, Section 14, and Act 843, Section 17:
- **Credit report pulls** require documented borrower consent before the API call
- Consent must specify the **purpose**, **requesting institution**, and **scope**
- Consent receipts must be retained for **7 years** per BoG guidelines
- The API will reject credit report requests if no valid consent is on record

---

## 2. Getting Started

### 2.1 Eligibility

Only the following BoG-licensed institution types may request API access:

| Institution Type | BoG License | Required Documents |
|-----------------|-------------|-------------------|
| Universal Banks | Class 1 Banking License | BoG license + RGD certificate |
| Savings & Loans Companies | Class 2 License | BoG license + RGD certificate |
| Rural & Community Banks | BoG charter | BoG charter + RGD registration |
| Microfinance Companies | BoG microfinance license | License + TIN certificate |
| Finance Houses | BoG finance house license | License + articles of incorporation |
| Leasing Companies | BoG leasing license | License + RGD certificate |
| Mortgage Companies | BoG mortgage license | License + RGD certificate |

### 2.2 Onboarding Process

| Step | Action | Responsible | Timeline |
|------|--------|-------------|----------|
| 1 | Submit application with BoG license copy | Institution | Day 1 |
| 2 | BoG license verification | Registry Operations | 2 business days |
| 3 | Technical readiness assessment | IT Team | 3 business days |
| 4 | API credentials provisioned | Registry Admin | 1 business day |
| 5 | Sandbox testing | Institution IT | 5 business days |
| 6 | Production go-live approval | Operations Manager | 1 business day |

### 2.3 API Credentials

| Credential | Description | Example |
|-----------|-------------|---------|
| API Key | Full authentication key | `sim_gcb001_xxxxxxxxxxxxxxxxxxx` |
| Client ID | Key prefix for OAuth flow | `sim_gcb001` |
| Client Secret | Full API key (used as secret) | Same as API Key |
| SRN | Supervisory Reference Number | `GCB001` |

---

## 3. Authentication

### 3.1 API Key Authentication

```bash
curl -X GET \
  "https://[registry-url]/api/external/v1/borrowers/search?nationalId=GHA-123456789" \
  -H "X-API-Key: sim_gcb001_xxxxxxxxxxxxxxxxxxx"
```

### 3.2 OAuth 2.0 Client Credentials (Recommended)

Per the Electronic Transactions Act (Act 772), all API connections must use encrypted channels. OAuth 2.0 is recommended for production integrations.

```bash
curl -X POST \
  "https://[registry-url]/api/external/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "sim_gcb001",
    "client_secret": "sim_gcb001_xxxxxxxxxxxxxxxxxxx"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "full"
}
```

### 3.3 Security Requirements (Act 843, Section 28)

| Requirement | Specification | Legal Reference |
|-------------|--------------|-----------------|
| Transport encryption | TLS 1.2 or higher | Act 843, Section 28 |
| API key storage | Encrypted, never in source code | Act 843, Section 28 |
| Token refresh | Before expiry, max 1-hour validity | BoG IT Guidelines |
| IP whitelisting | Recommended for production | BoG IT Guidelines |
| Request signing | HMAC-SHA256 for batch submissions | BoG CRB v1.1 |

---

## 4. Ghana-Specific API Endpoints

### 4.1 Submit Individual Borrower

```bash
POST /api/external/v1/borrowers
Content-Type: application/json
X-API-Key: sim_gcb001_xxx...

{
  "type": "individual",
  "firstName": "Kwame",
  "lastName": "Asante",
  "dateOfBirth": "1985-03-15",
  "gender": "M",
  "nationalId": "GHA-123456789",
  "nationalIdType": "GHANA_CARD",
  "votersId": "VOT-987654321",
  "ssnit": "SSNIT-456789123",
  "driversLicense": "DL-GH-789012",
  "phone": "+233244123456",
  "email": "kwame.asante@email.com",
  "address": "12 Independence Avenue, Accra",
  "region": "Greater Accra",
  "maritalStatus": "MRD",
  "mobileMoneyNumber": "+233244123456",
  "employmentType": "EMP",
  "proofOfAddress": "ELE",
  "country": "GH"
}
```

**Ghana-Specific Mandatory Fields:**

| Field | Required | Validation | Legal Reference |
|-------|----------|------------|-----------------|
| nationalId | Yes | GHA-XXXXXXXXX format | Act 726, Section 8 |
| nationalIdType | Yes | Must be GHANA_CARD | NIA Act, 2006 (Act 707) |
| firstName | Yes | Non-empty string | Act 726, Section 8 |
| lastName | Yes | Non-empty string | Act 726, Section 8 |
| dateOfBirth | Yes | YYYY-MM-DD, age 18+ | Act 726, Section 8 |
| gender | Yes | M or F | BoG CRB v1.1 |
| phone | Yes | +233 format | BoG CRB v1.1 |
| country | Yes | Must be "GH" | System enforcement |

**Optional Ghana-Specific Fields:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| votersId | string | EC format | Electoral Commission voter's ID |
| ssnit | string | Numeric | Social Security (SSNIT) number |
| driversLicense | string | DVLA format | Driver's license number |
| mobileMoneyNumber | string | +233 format | Mobile money-linked number |
| maritalStatus | string | SNG/MRD/DIV/WID/SEP | BoG marital status codes |
| employmentType | string | EMP/SLF/UNE/RET/STD/HMK/OTH | BoG employment type codes |
| proofOfAddress | string | WAT/ELE/BNK/TEN/OTH | Address verification document type |
| region | string | 16 Ghana regions | Greater Accra, Ashanti, etc. |

### 4.2 Submit Credit Account (GHS)

```bash
POST /api/external/v1/credit-accounts
Content-Type: application/json
X-API-Key: sim_gcb001_xxx...

{
  "borrowerId": 12345,
  "accountNumber": "GCB-2026-001234",
  "accountType": "term_loan",
  "currency": "GHS",
  "originalAmount": "50000.00",
  "currentBalance": "42500.00",
  "interestRate": "28.5",
  "disbursementDate": "2025-01-15",
  "maturityDate": "2028-01-15",
  "facilityTypeCode": "TML",
  "purposeOfFacility": "BUS",
  "repaymentFrequency": "MTH",
  "assetClassification": "CUR",
  "daysInArrears": 0,
  "amountOverdue": "0.00",
  "collateralType": "PRO",
  "collateralValue": "120000.00",
  "closureReason": null
}
```

**BoG-Mandated Credit Account Fields:**

| Field | Required | Validation | BoG Reference |
|-------|----------|------------|---------------|
| currency | Yes | Must be "GHS" for domestic | BoG CRB v1.1 |
| facilityTypeCode | Yes | BoG Appendix I codes (14 types) | BoG CRB v1.1, Section 4 |
| assetClassification | Yes | CUR/OLM/SUB/DBT/LSS | BSD/2018/01 |
| daysInArrears | Yes | Integer >= 0 | BoG CRB v1.1, Section 5 |
| purposeOfFacility | Yes | BoG Appendix II codes (10 types) | BoG CRB v1.1, Section 4 |
| repaymentFrequency | Yes | BoG Appendix III codes (9 types) | BoG CRB v1.1, Section 4 |
| collateralType | Yes | BoG Appendix VI codes (12 types) | BoG CRB v1.1, Section 6 |
| closureReason | On closure | NOR/EAR/WOF/TRF/REF/OTH | BoG CRB v1.1, Section 7 |

### 4.3 Pull Credit Report (Requires Consent)

```bash
GET /api/external/v1/borrowers/{borrowerId}/credit-report
X-API-Key: sim_gcb001_xxx...
```

**Consent Verification:** The system will verify that a valid consent record exists for the requesting institution before returning the credit report. If no consent is found, the API returns:

```json
{
  "success": false,
  "error": "CONSENT_REQUIRED",
  "message": "Valid borrower consent required per Credit Reporting Act 726, Section 14",
  "code": 403
}
```

### 4.4 Submit Dishonoured Cheque

```bash
POST /api/external/v1/court-judgments
Content-Type: application/json
X-API-Key: sim_gcb001_xxx...

{
  "borrowerId": 12345,
  "type": "dishonoured_cheque",
  "chequeNumber": "CHQ-123456",
  "amount": "15000.00",
  "currency": "GHS",
  "reasonCode": "INF",
  "dateOfReturn": "2026-01-20",
  "drawerBank": "Ghana Commercial Bank"
}
```

**Dishonoured Cheque Reason Codes (BoG Appendix IX):**

| Code | Reason |
|------|--------|
| INF | Insufficient Funds |
| ACC | Account Closed |
| STL | Stale Cheque |
| STP | Stop Payment |
| SIG | Signature Differs |
| AMT | Amount in Words and Figures Differ |
| ALT | Alteration on Cheque |
| OTH | Other |

---

## 5. Batch Submission (BoG Pipe-Delimited Format)

### 5.1 BoG v1.1 Batch Upload

In addition to JSON API submissions, institutions can submit bulk data using the BoG pipe-delimited format:

```bash
POST /api/batch-upload/bog-pipe
Content-Type: application/json
Cookie: [session cookie]

{
  "data": "SRN|ReportingDate|BorrowerName|NationalID|AccountNumber|FacilityType|Currency|OriginalAmount|CurrentBalance|AssetClassification|DaysInArrears\nGCB001|20260115|Kwame Asante|GHA-123456789|GCB-001|TML|GHS|50000.00|42500.00|CUR|0\nGCB001|20260115|Ama Mensah|GHA-987654321|GCB-002|OVD|GHS|25000.00|18750.00|OLM|45"
}
```

### 5.2 File Naming Convention

```
SRN-ReportingDate-CreationDate-Version-FileType-Sequence.csv
```

Example: `GCB001-20260115-20260120-1.1-CONC-1.csv`

### 5.3 Submission Deadlines (Act 726, Section 7)

| Submission Type | Deadline | Penalty for Late Submission |
|----------------|----------|----------------------------|
| Monthly credit data | 15th of following month | BoG warning letter; repeated = license review |
| Dishonoured cheques | Within 5 business days | Administrative penalty |
| Court judgments | Within 10 business days | Administrative penalty |
| Corrections/updates | Within 2 business days of discovery | BoG notification |

---

## 6. Data Residency and Sovereignty

### 6.1 Data Localization (Act 843, Section 36-37)

| Requirement | Implementation |
|-------------|---------------|
| Primary data storage | Within Ghana national borders |
| Backup storage | Within Ghana or BoG-approved jurisdiction |
| Processing location | Within Ghana |
| Cross-border transfers | Only with DPC authorization + data subject consent |
| API endpoints | Served from Ghana-based infrastructure |

### 6.2 Cross-Border API Restrictions

Per Act 843, Section 37, API access from outside Ghana requires:
- Written authorization from the Data Protection Commission
- Explicit consent of affected data subjects
- Adequate data protection in the receiving jurisdiction
- BoG approval for regulatory data sharing

---

## 7. Error Handling and Compliance Codes

### 7.1 Ghana-Specific Error Codes

| Code | Message | Action Required |
|------|---------|----------------|
| GH-001 | Invalid Ghana Card format | Verify GHA-XXXXXXXXX format |
| GH-002 | Currency must be GHS for domestic facility | Change currency to GHS |
| GH-003 | Invalid BoG facility type code | Use BoG Appendix I codes |
| GH-004 | Asset classification mismatch with days in arrears | Align with BSD/2018/01 thresholds |
| GH-005 | Consent not found for credit inquiry | Obtain borrower consent first |
| GH-006 | Institution not licensed by BoG | Verify institution registration |
| GH-007 | Data submission deadline exceeded | Contact BoG CRB Unit |
| GH-008 | Cross-border transfer not authorized | Obtain DPC authorization |
| GH-009 | Mandatory field missing per BoG CRB v1.1 | Supply all required fields |
| GH-010 | Invalid YYYYMMDD date format | Use correct date format |

### 7.2 Standard HTTP Error Codes

| Code | Description | Ghana-Specific Notes |
|------|------------|---------------------|
| 400 | Bad Request | Field validation failure per BoG standards |
| 401 | Unauthorized | Invalid or expired API key |
| 403 | Forbidden | Insufficient permissions or missing consent |
| 404 | Not Found | Borrower/account not in registry |
| 409 | Conflict | Duplicate submission detected |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Contact support immediately |

---

## 8. Rate Limits

| Tier | Requests/Minute | Requests/Day | Concurrent Connections |
|------|-----------------|--------------|----------------------|
| Standard | 60 | 10,000 | 5 |
| Professional | 120 | 50,000 | 10 |
| Enterprise | 300 | Unlimited | 25 |

---

## 9. Audit and Compliance Logging

### 9.1 API Activity Logging (Act 726, Section 18)

All API calls are logged with the following information per legal requirements:

| Field | Description | Retention |
|-------|-------------|-----------|
| Timestamp | UTC timestamp of request | 10 years |
| Institution SRN | Requesting institution | 10 years |
| User/API key | Authenticated identity | 10 years |
| Endpoint | API path accessed | 10 years |
| Borrower ID | Affected data subject (if applicable) | 10 years |
| IP Address | Source IP of request | 10 years |
| Response code | HTTP status returned | 10 years |
| Data hash | SHA-256 hash of request/response | 10 years |

### 9.2 Regulatory Audit Access

The Bank of Ghana CRB Unit may request API activity logs at any time per Act 726, Section 5. Institutions must be prepared to explain any API access patterns upon regulatory request.

---

## 10. Legal Notices

### 10.1 Disclaimer
Use of this API constitutes agreement to comply with the Credit Reporting Act, 2007 (Act 726), the Data Protection Act, 2012 (Act 843), and all Bank of Ghana directives. Misuse of the API, including unauthorized data access, data harvesting, or failure to maintain consent records, may result in license revocation and criminal prosecution.

### 10.2 Liability
Carlson Capital & Systems In Motion Limited provides this API on an "as-is" basis and is not liable for data accuracy issues originating from submitting institutions. Each institution remains legally responsible for the accuracy of data submitted per Act 726, Section 7(3).

### 10.3 Governing Law
This API and all data processed through it are governed by the laws of the Republic of Ghana, with the Courts of Ghana having exclusive jurisdiction over any disputes.

---

*Document Reference: GH-API-2026-v1.1*
*Classification: Confidential — BoG-Licensed Institutions Only*
