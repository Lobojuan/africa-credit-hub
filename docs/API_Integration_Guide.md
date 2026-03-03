# Systems In Motion Limited
# Pan-African Credit Registry — External API Integration Guide
## Cross-Jurisdictional Credit Data Hub (CDH) v1.2

---

**Document Version:** 1.2  
**Last Updated:** March 2026  
**Classification:** CONFIDENTIAL — For Authorized Institutions Only  
**Contact:** Systems In Motion Limited — api-support@systemsinmotion.com

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Authentication](#3-authentication)
4. [Base URL & Headers](#4-base-url--headers)
5. [API Endpoints](#5-api-endpoints)
   - 5.1 [Health Check](#51-health-check)
   - 5.2 [Submit Borrowers](#52-submit-borrowers)
   - 5.3 [Submit Credit Accounts](#53-submit-credit-accounts)
   - 5.4 [Submit Payment History](#54-submit-payment-history)
   - 5.5 [Submit Court Judgments](#55-submit-court-judgments)
   - 5.6 [Search Borrowers](#56-search-borrowers)
   - 5.7 [Pull Credit Report](#57-pull-credit-report)
   - 5.8 [Retrieve Credit Accounts](#58-retrieve-credit-accounts)
6. [Data Models & Field Reference](#6-data-models--field-reference)
7. [Supported Currencies](#7-supported-currencies)
8. [Batch Submissions](#8-batch-submissions)
9. [Error Handling](#9-error-handling)
10. [Rate Limits & Best Practices](#10-rate-limits--best-practices)
11. [Security Requirements](#11-security-requirements)
12. [Testing & Sandbox](#12-testing--sandbox)
13. [Frequently Asked Questions](#13-frequently-asked-questions)
14. [Support & Onboarding Contact](#14-support--onboarding-contact)
15. [Internal API Endpoints (Session-Authenticated)](#15-internal-api-endpoints-session-authenticated)
   - 15.1 [AI-Powered Analysis Endpoints](#151-ai-powered-analysis-endpoints)
   - 15.2 [Excel Export Endpoint](#152-excel-export-endpoint)
   - 15.3 [Notification Endpoints](#153-notification-endpoints)
   - 15.4 [API Usage Analytics](#154-api-usage-analytics)
   - 15.5 [Dashboard Trends](#155-dashboard-trends)

---

## 1. Overview

The Pan-African Credit Registry API allows authorized financial institutions — banks, microfinance institutions, savings & credit cooperatives, development finance institutions, and regulated lenders — to:

- **Submit** borrower records, credit accounts, payment history, and court judgments
- **Query** borrower data and pull comprehensive credit reports with credit scores
- **Search** borrowers by national ID, TIN number, or name across all 54 African jurisdictions

The API follows REST conventions, uses JSON for all request/response bodies, and supports both API key authentication and OAuth 2.0 client credentials flow.

### Who Should Use This Guide

- **IT Teams** at banks and lending institutions integrating their core banking systems
- **Software Vendors** building middleware or credit bureau connectors
- **Compliance Officers** reviewing data exchange requirements
- **System Administrators** managing API credentials and monitoring usage

---

## 2. Getting Started

### Step 1: Institution Registration

Your institution must be registered in the CDH system before you can receive API access. Contact Systems In Motion Limited or your national regulatory body to initiate the onboarding process.

**Information required:**
- Institution name and registration number
- Country of operation
- Type of institution (commercial bank, microfinance, SACCO, DFI, etc.)
- Primary contact (name, email, phone)
- Technical contact (name, email)

### Step 2: API Credentials

Once your institution is registered and approved, a CDH administrator will provision API credentials for you. You will receive:

| Credential | Description | Example |
|---|---|---|
| **API Key** | Your full API key for direct authentication | `sim_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4` |
| **Client ID** | Key prefix for OAuth flow | `sim_a1b2c3d4` |
| **Client Secret** | Full API key (used as secret in OAuth flow) | Same as API Key |
| **Permission Level** | Your access scope | `full`, `read`, or `submit` |

**Permission levels:**

| Level | Can Submit Data | Can Read/Query Data |
|---|---|---|
| `full` | Yes | Yes |
| `read` | No | Yes |
| `submit` | Yes | No |

### Step 3: Test Your Connection

Verify your setup with the health check endpoint (no authentication required):

```bash
curl https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.1",
  "service": "Systems In Motion Credit Registry API"
}
```

---

## 3. Authentication

The API supports two authentication methods. Choose whichever best fits your system architecture.

### Option A: Direct API Key (Simplest)

Include your API key in the `X-API-Key` header with every request:

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers/search?nationalId=ETH-ID-12345" \
  -H "X-API-Key: sim_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4"
```

### Option B: OAuth 2.0 Client Credentials (Recommended for Production)

**Step 1:** Exchange your credentials for a short-lived access token:

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "sim_a1b2c3d4",
    "client_secret": "sim_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4"
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

**Step 2:** Use the token in the `Authorization` header for subsequent requests:

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers/search?nationalId=ETH-ID-12345" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Token notes:**
- Tokens expire after **1 hour** (3600 seconds)
- Request a new token before the current one expires
- Your integration should handle token refresh automatically

---

## 4. Base URL & Headers

### Base URL

```
https://cross-jurisdictional-cdh-v12.replit.app/api/external
```

All versioned endpoints are under `/v1/`:

```
https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/
```

### Required Headers

| Header | Value | Required |
|---|---|---|
| `Content-Type` | `application/json` | Yes (for POST requests) |
| `X-API-Key` | Your API key | Yes (if using API key auth) |
| `Authorization` | `Bearer <token>` | Yes (if using OAuth) |

---

## 5. API Endpoints

### 5.1 Health Check

Check if the API is operational. No authentication required.

```
GET /api/external/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.1",
  "service": "Systems In Motion Credit Registry API"
}
```

---

### 5.2 Submit Borrowers

Register a new borrower (individual or corporate) in the credit registry.

```
POST /api/external/v1/borrowers
```

**Permission required:** `submit` or `full`

#### Individual Borrower Example

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "type": "individual",
    "firstName": "Amina",
    "lastName": "Hassan",
    "nationalId": "KEN-ID-789456",
    "tinNumber": "TIN-KEN-789456",
    "dateOfBirth": "1985-03-15",
    "gender": "female",
    "phone": "+254712345678",
    "email": "amina.hassan@example.com",
    "address": "123 Kenyatta Avenue",
    "country": "Kenya",
    "city": "Nairobi",
    "region": "Nairobi County",
    "employerName": "Safaricom PLC",
    "occupation": "Software Engineer"
  }'
```

#### Corporate Borrower Example

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "type": "corporate",
    "companyName": "Nairobi Trading Ltd",
    "nationalId": "KEN-BIZ-456789",
    "tinNumber": "TIN-KEN-C-456789",
    "businessRegNumber": "BRN-KEN-2024-001",
    "sector": "Retail Trade",
    "phone": "+254720123456",
    "email": "info@nairobitrading.co.ke",
    "address": "Industrial Area, Plot 42",
    "country": "Kenya",
    "city": "Nairobi"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Borrower created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "type": "individual",
    "firstName": "Amina",
    "lastName": "Hassan",
    "nationalId": "KEN-ID-789456",
    "country": "Kenya",
    "createdAt": "2026-03-03T10:30:00.000Z"
  },
  "timestamp": "2026-03-03T10:30:00.123Z"
}
```

---

### 5.3 Submit Credit Accounts

Report a loan or credit facility for an existing borrower.

```
POST /api/external/v1/credit-accounts
```

**Permission required:** `submit` or `full`

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/credit-accounts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "borrowerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "accountNumber": "LN-2026-001234",
    "accountType": "Personal Loan",
    "originalAmount": "500000.00",
    "currentBalance": "425000.00",
    "currency": "KES",
    "interestRate": "14.50",
    "disbursementDate": "2026-01-15",
    "maturityDate": "2029-01-15",
    "status": "current",
    "daysInArrears": 0,
    "collateralType": "Motor Vehicle",
    "collateralValue": "750000.00",
    "lastPaymentDate": "2026-02-28",
    "lastPaymentAmount": "18500.00"
  }'
```

**Account type examples:** `Personal Loan`, `Mortgage`, `Auto Loan`, `Business Loan`, `Overdraft`, `Credit Card`, `Microfinance Loan`, `Trade Finance`, `Agricultural Loan`, `Student Loan`

**Account status values:**

| Status | Description |
|---|---|
| `current` | Loan is performing normally |
| `delinquent` | Payments are overdue |
| `default` | Borrower has defaulted |
| `closed` | Loan is fully repaid or settled |
| `restructured` | Loan terms have been modified |
| `written_off` | Loan has been written off as a loss |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Credit account created successfully",
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "borrowerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "accountNumber": "LN-2026-001234",
    "accountType": "Personal Loan",
    "status": "current",
    "createdAt": "2026-03-03T10:35:00.000Z"
  },
  "timestamp": "2026-03-03T10:35:00.456Z"
}
```

**Note:** If you omit `lenderInstitution`, the system will automatically use your registered institution name.

---

### 5.4 Submit Payment History

Report monthly payment performance for a credit account.

```
POST /api/external/v1/payment-history
```

**Permission required:** `submit` or `full`

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/payment-history" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "creditAccountId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "period": "2026-02",
    "amountDue": "18500.00",
    "amountPaid": "18500.00",
    "status": "on_time",
    "daysLate": 0
  }'
```

**Payment status values:**

| Status | Description |
|---|---|
| `on_time` | Full payment received by due date |
| `late` | Payment received after due date |
| `missed` | No payment received for the period |
| `partial` | Less than the full amount was paid |

---

### 5.5 Submit Court Judgments

Report court judgments, liens, or legal actions against a borrower.

```
POST /api/external/v1/court-judgments
```

**Permission required:** `submit` or `full`

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/court-judgments" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "borrowerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "caseNumber": "KEN-2026-CV-00789",
    "court": "High Court of Kenya, Nairobi",
    "judgmentType": "civil_judgment",
    "amount": "1250000.00",
    "currency": "KES",
    "judgmentDate": "2026-02-20",
    "status": "active",
    "description": "Default on commercial loan repayment"
  }'
```

**Judgment type values:** `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction`

**Judgment status values:** `active`, `resolved`, `appealed`

---

### 5.6 Search Borrowers

Find borrowers by national ID, TIN number, or name.

```
GET /api/external/v1/borrowers/search?nationalId=KEN-ID-789456
GET /api/external/v1/borrowers/search?name=Amina+Hassan
GET /api/external/v1/borrowers/search?q=Nairobi+Trading
```

**Permission required:** `read` or `full`

**Query parameters (at least one required):**

| Parameter | Description |
|---|---|
| `nationalId` | Exact national ID or business registration number |
| `name` | Borrower name (partial match supported) |
| `q` | General search query (searches across names and IDs) |

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers/search?nationalId=KEN-ID-789456" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "individual",
      "firstName": "Amina",
      "lastName": "Hassan",
      "nationalId": "KEN-ID-789456",
      "country": "Kenya",
      "city": "Nairobi"
    }
  ],
  "timestamp": "2026-03-03T10:40:00.789Z"
}
```

---

### 5.7 Pull Credit Report

Generate a comprehensive credit report for a borrower, including credit score, all accounts, payment history, inquiries, court judgments, and consent records.

```
GET /api/external/v1/borrowers/:borrowerId/credit-report
```

**Permission required:** `read` or `full`

**Optional query parameter:**

| Parameter | Description | Default |
|---|---|---|
| `purpose` | Reason for pulling the report | `api_inquiry` |

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers/a1b2c3d4-e5f6-7890-abcd-ef1234567890/credit-report?purpose=new_credit" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "message": "Credit report generated",
  "data": {
    "serialNumber": "CR-2026-M1A2B3C4",
    "generatedAt": "2026-03-03T10:45:00.000Z",
    "borrower": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "individual",
      "firstName": "Amina",
      "lastName": "Hassan",
      "nationalId": "KEN-ID-789456",
      "country": "Kenya"
    },
    "creditScore": {
      "score": 720,
      "reasonCodes": ["GOOD_STANDING"]
    },
    "accounts": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "accountType": "Personal Loan",
        "originalAmount": "500000.00",
        "currentBalance": "425000.00",
        "currency": "KES",
        "status": "current",
        "daysInArrears": 0
      }
    ],
    "inquiries": [],
    "courtJudgments": [],
    "consentRecords": []
  },
  "timestamp": "2026-03-03T10:45:00.234Z"
}
```

**Credit Score Range: 300–850**

| Range | Rating |
|---|---|
| 750–850 | Excellent |
| 700–749 | Good |
| 650–699 | Fair |
| 550–649 | Poor |
| 300–549 | Very Poor |

**Score impact factors:**

| Factor | Score Impact |
|---|---|
| Delinquent accounts | -30 per account |
| Defaulted accounts | -50 per account |
| Written-off accounts | -60 per account |
| Active court judgments | -40 |
| No credit history | -50 |

**Note:** Each credit report pull is logged as an inquiry in the registry and assigned a unique serial number for audit purposes.

---

### 5.8 Retrieve Credit Accounts

Get all credit accounts for a specific borrower.

```
GET /api/external/v1/credit-accounts/:borrowerId
```

**Permission required:** `read` or `full`

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/credit-accounts/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 6. Data Models & Field Reference

### Borrower Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | **Yes** | `individual` or `corporate` |
| `firstName` | string | No* | First name (*required for individuals) |
| `lastName` | string | No* | Last name (*required for individuals) |
| `companyName` | string | No* | Company name (*required for corporates) |
| `nationalId` | string | **Yes** | Unique national ID or business registration number |
| `tinNumber` | string | No | Tax Identification Number |
| `dateOfBirth` | string | No | Date of birth (format: `YYYY-MM-DD`) |
| `gender` | string | No | `male`, `female`, or `other` |
| `phone` | string | No | Phone number with country code |
| `email` | string | No | Email address |
| `address` | string | No | Physical address |
| `country` | string | No | Country name (e.g., `Kenya`, `Nigeria`, `Ethiopia`) |
| `city` | string | No | City |
| `region` | string | No | Region, state, or province |
| `employerName` | string | No | Current employer |
| `occupation` | string | No | Job title or occupation |
| `businessRegNumber` | string | No | Business registration number (for corporates) |
| `sector` | string | No | Industry sector |
| `passportNumber` | string | No | Passport number |
| `isPep` | boolean | No | Politically Exposed Person flag |
| `pepDetails` | string | No | PEP details if applicable |

### Credit Account Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `borrowerId` | string (UUID) | **Yes** | The borrower's ID from the registry |
| `accountNumber` | string | **Yes** | Your institution's account/loan number |
| `accountType` | string | **Yes** | Type of credit facility |
| `originalAmount` | string (decimal) | **Yes** | Original disbursed amount |
| `currentBalance` | string (decimal) | **Yes** | Current outstanding balance |
| `currency` | string | **Yes** | ISO 4217 currency code (see Section 7) |
| `lenderInstitution` | string | No | Auto-filled with your institution name if omitted |
| `interestRate` | string (decimal) | No | Annual interest rate (%) |
| `disbursementDate` | string | No | Date of disbursement (`YYYY-MM-DD`) |
| `maturityDate` | string | No | Loan maturity date (`YYYY-MM-DD`) |
| `status` | string | **Yes** | `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `daysInArrears` | integer | No | Number of days past due |
| `collateralType` | string | No | Type of collateral pledged |
| `collateralValue` | string (decimal) | No | Estimated collateral value |
| `lastPaymentDate` | string | No | Date of last payment (`YYYY-MM-DD`) |
| `lastPaymentAmount` | string (decimal) | No | Amount of last payment |
| `isInterestFree` | boolean | No | Islamic/Sharia-compliant interest-free flag |
| `gracePeriodMonths` | integer | No | Grace period in months |
| `restructureCount` | integer | No | Number of times restructured |

### Payment History Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `creditAccountId` | string (UUID) | **Yes** | The credit account ID from the registry |
| `period` | string | **Yes** | Payment period (`YYYY-MM`) |
| `amountDue` | string (decimal) | **Yes** | Amount due for the period |
| `amountPaid` | string (decimal) | **Yes** | Amount actually paid |
| `status` | string | **Yes** | `on_time`, `late`, `missed`, `partial` |
| `daysLate` | integer | No | Number of days late (0 if on time) |

### Court Judgment Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `borrowerId` | string (UUID) | **Yes** | The borrower's ID from the registry |
| `caseNumber` | string | **Yes** | Court case reference number |
| `court` | string | **Yes** | Name of the court |
| `judgmentType` | string | **Yes** | `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction` |
| `amount` | string (decimal) | No | Judgment amount |
| `currency` | string | No | Currency code (defaults to `ETB`) |
| `judgmentDate` | string | **Yes** | Date of judgment (`YYYY-MM-DD`) |
| `status` | string | **Yes** | `active`, `resolved`, `appealed` |
| `description` | string | No | Description of the judgment |

---

## 7. Supported Currencies

The CDH supports 42+ African currencies. Use the standard ISO 4217 currency code in the `currency` field:

| Code | Currency | Country |
|---|---|---|
| `DZD` | Algerian Dinar | Algeria |
| `AOA` | Angolan Kwanza | Angola |
| `XOF` | West African CFA Franc | Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo |
| `BWP` | Botswana Pula | Botswana |
| `BIF` | Burundian Franc | Burundi |
| `CVE` | Cape Verdean Escudo | Cape Verde |
| `XAF` | Central African CFA Franc | Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon |
| `KMF` | Comorian Franc | Comoros |
| `CDF` | Congolese Franc | DR Congo |
| `DJF` | Djiboutian Franc | Djibouti |
| `EGP` | Egyptian Pound | Egypt |
| `ERN` | Eritrean Nakfa | Eritrea |
| `SZL` | Eswatini Lilangeni | Eswatini |
| `ETB` | Ethiopian Birr | Ethiopia |
| `GMD` | Gambian Dalasi | Gambia |
| `GHS` | Ghanaian Cedi | Ghana |
| `GNF` | Guinean Franc | Guinea |
| `KES` | Kenyan Shilling | Kenya |
| `LSL` | Lesotho Loti | Lesotho |
| `LRD` | Liberian Dollar | Liberia |
| `LYD` | Libyan Dinar | Libya |
| `MGA` | Malagasy Ariary | Madagascar |
| `MWK` | Malawian Kwacha | Malawi |
| `MRU` | Mauritanian Ouguiya | Mauritania |
| `MUR` | Mauritian Rupee | Mauritius |
| `MAD` | Moroccan Dirham | Morocco |
| `MZN` | Mozambican Metical | Mozambique |
| `NAD` | Namibian Dollar | Namibia |
| `NGN` | Nigerian Naira | Nigeria |
| `RWF` | Rwandan Franc | Rwanda |
| `STN` | São Tomé and Príncipe Dobra | São Tomé and Príncipe |
| `SCR` | Seychellois Rupee | Seychelles |
| `SLE` | Sierra Leonean Leone | Sierra Leone |
| `SOS` | Somali Shilling | Somalia |
| `ZAR` | South African Rand | South Africa |
| `SSP` | South Sudanese Pound | South Sudan |
| `SDG` | Sudanese Pound | Sudan |
| `TZS` | Tanzanian Shilling | Tanzania |
| `TND` | Tunisian Dinar | Tunisia |
| `UGX` | Ugandan Shilling | Uganda |
| `ZMW` | Zambian Kwacha | Zambia |
| `ZWL` | Zimbabwean Dollar | Zimbabwe |
| `USD` | US Dollar | Cross-border transactions |
| `EUR` | Euro | Cross-border transactions |
| `GBP` | British Pound | Cross-border transactions |

---

## 8. Batch Submissions

The borrowers, credit accounts, and payment history endpoints support batch submissions. Instead of sending a single object, send a JSON array of objects.

### Example: Batch Borrower Submission

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '[
    {
      "type": "individual",
      "firstName": "Amina",
      "lastName": "Hassan",
      "nationalId": "KEN-ID-789456",
      "country": "Kenya"
    },
    {
      "type": "individual",
      "firstName": "Kofi",
      "lastName": "Mensah",
      "nationalId": "GHA-ID-654321",
      "country": "Ghana"
    },
    {
      "type": "corporate",
      "companyName": "Lagos Exports Ltd",
      "nationalId": "NGA-BIZ-112233",
      "country": "Nigeria"
    }
  ]'
```

**Batch Response:**
```json
{
  "success": true,
  "message": "Batch borrower submission complete",
  "data": {
    "submitted": 3,
    "failed": 0,
    "results": [
      { "index": 0, "id": "uuid-1", "nationalId": "KEN-ID-789456" },
      { "index": 1, "id": "uuid-2", "nationalId": "GHA-ID-654321" },
      { "index": 2, "id": "uuid-3", "nationalId": "NGA-BIZ-112233" }
    ],
    "errors": []
  },
  "timestamp": "2026-03-03T11:00:00.000Z"
}
```

**Batch behavior:**
- Each record in the batch is processed independently
- If one record fails validation, the others are still processed
- The response includes both `results` (successful) and `errors` (failed) arrays
- The `index` field in each result/error maps back to the original array position

---

## 9. Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional details if available",
  "timestamp": "2026-03-03T11:05:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning | Common Cause |
|---|---|---|
| `200` | Success | Request processed successfully |
| `201` | Created | Record created successfully |
| `400` | Bad Request | Invalid JSON, missing required fields, or validation error |
| `401` | Unauthorized | Missing, invalid, or expired API key/token |
| `403` | Forbidden | API key revoked, institution suspended, or insufficient permissions |
| `404` | Not Found | Borrower or resource not found |
| `500` | Server Error | Internal server error — contact support |

### Common Error Scenarios

**Invalid API key:**
```json
{ "error": "Invalid API key" }
```

**Revoked API key:**
```json
{ "error": "API key has been revoked" }
```

**Insufficient permissions:**
```json
{ "error": "Insufficient permissions. Required: submit. Current: read" }
```

**Validation error (missing required field):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "Required at \"nationalId\""
}
```

**Duplicate national ID:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "duplicate key value violates unique constraint \"borrowers_national_id_unique\""
}
```

---

## 10. Rate Limits & Best Practices

### Rate Limits

- Standard API keys: **100 requests per minute**
- Batch endpoints count as **1 request** regardless of batch size
- If rate-limited, you will receive HTTP `429 Too Many Requests`

### Best Practices

1. **Use batch endpoints** for bulk data submission — send up to 100 records per batch request instead of individual calls
2. **Cache borrower IDs** — after creating a borrower, store the returned `id` locally to avoid repeated searches
3. **Handle errors gracefully** — implement retry logic with exponential backoff for `500` errors
4. **Refresh tokens proactively** — if using OAuth, request a new token before the current one expires
5. **Submit payment history monthly** — report payment performance for all active accounts at the end of each month
6. **Use unique national IDs** — the `nationalId` field is globally unique across the registry; use your country's standard ID format
7. **Include currency codes** — always specify the `currency` field; don't rely on defaults for cross-border accuracy

### Recommended National ID Formats

For consistency across the pan-African registry, we recommend the following format: `{COUNTRY_CODE}-ID-{NUMBER}` for individuals and `{COUNTRY_CODE}-BIZ-{NUMBER}` for corporates.

---

## 11. Security Requirements

- All API communication must use **HTTPS** (TLS 1.2+)
- API keys are **hashed** at rest using SHA-256 — we never store your raw key
- Every API call is logged in a **tamper-evident audit trail** with cryptographic hash chaining
- IP whitelisting can be configured for your institution upon request
- API keys can be **rotated** or **revoked** immediately by the CDH administrator
- OAuth tokens are signed using **JWT** with 1-hour expiration
- The system enforces **role-based access control** — your API key permissions match your institution's approved access level

### Your Responsibilities

- Store your API key securely (e.g., environment variables, secrets manager) — never hard-code it
- Do not share API keys across environments (use separate keys for testing and production)
- Report any suspected key compromise immediately
- Ensure your systems meet local data protection requirements (e.g., GDPR, POPIA, Kenya Data Protection Act)

---

## 12. Testing & Sandbox

### Verify Your Connection

Start with the health check to confirm connectivity:

```bash
curl https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/health
```

### Test Your API Key

Try a borrower search to verify authentication:

```bash
curl -X GET \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers/search?q=test" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Submit a Test Borrower

Create a test borrower record to verify write access:

```bash
curl -X POST \
  "https://cross-jurisdictional-cdh-v12.replit.app/api/external/v1/borrowers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "type": "individual",
    "firstName": "Test",
    "lastName": "User",
    "nationalId": "TEST-ID-'$(date +%s)'",
    "country": "Kenya"
  }'
```

---

## 13. Frequently Asked Questions

**Q: How do I get API credentials?**  
A: Contact Systems In Motion Limited or your national regulatory authority. Your institution must be registered and approved before API access is provisioned.

**Q: Can I use both API key and OAuth authentication?**  
A: Yes. Both methods work on all endpoints. Use API key auth for simplicity, or OAuth for enhanced security with short-lived tokens.

**Q: What happens if I submit a borrower with a nationalId that already exists?**  
A: You will receive a `400` error with a duplicate key message. Use the search endpoint first to check if the borrower already exists, then submit credit accounts against the existing borrower ID.

**Q: How do I update an existing borrower record?**  
A: Currently, the external API supports record creation and querying. To update existing records, contact the CDH administrator or submit a correction through the dispute resolution process.

**Q: How many records can I send in a batch?**  
A: We recommend batches of up to 100 records. Larger batches may time out depending on network conditions.

**Q: Is there a sandbox environment for testing?**  
A: Contact us to discuss sandbox provisioning for your integration development and testing.

**Q: How is the credit score calculated?**  
A: The score is based on the borrower's account performance, payment history, delinquencies, defaults, write-offs, and court judgments. Scores range from 300 (very poor) to 850 (excellent). See Section 5.7 for the detailed scoring model.

**Q: Which countries are covered?**  
A: The CDH covers all 54 African Union member states. Cross-border entity resolution allows tracking borrowers across jurisdictions.

**Q: How often should we submit data?**  
A: Submit new accounts as they are originated, and report payment history monthly. Update account statuses whenever they change (e.g., from `current` to `delinquent`).

**Q: Is the API available 24/7?**  
A: Yes, the API is designed for continuous availability. Planned maintenance windows will be communicated in advance.

---

## 15. Internal API Endpoints (Session-Authenticated)

The following endpoints are available for authenticated users of the CDH web application. These endpoints use session-based authentication (not API key authentication) and are intended for internal platform use.

### 15.1 AI-Powered Analysis Endpoints

These endpoints integrate with OpenAI GPT-4o to provide AI-powered analysis capabilities.

#### AI Credit Risk Analysis

```
POST /api/ai/credit-risk/:borrowerId
```

**Authentication:** Session-based (authenticated user required)

Analyzes a borrower's credit data using AI and returns a risk assessment including risk level (low/medium/high/critical), risk score (0-100), summary, risk factors with positive/negative impact, recommendations, and regulatory flags.

**Response:**
```json
{
  "riskLevel": "medium",
  "riskScore": 45,
  "summary": "The borrower shows moderate credit risk...",
  "riskFactors": [
    { "factor": "Payment history", "impact": "positive", "description": "Consistent on-time payments" },
    { "factor": "High utilization", "impact": "negative", "description": "Current balance exceeds 80% of original amount" }
  ],
  "recommendations": ["Monitor account quarterly", "Consider collateral review"],
  "regulatoryFlags": []
}
```

#### AI Report Summary

```
POST /api/ai/report-summary/:borrowerId
```

**Authentication:** Session-based (authenticated user required)

Generates a plain-language summary of the borrower's credit history.

**Response:**
```json
{
  "summary": "This borrower has a generally positive credit profile...",
  "borrowerName": "Amina Hassan",
  "generatedAt": "2026-03-03T10:45:00.000Z"
}
```

#### AI Chat Assistant

```
POST /api/ai/chat
```

**Authentication:** Session-based (authenticated user required)

Sends a message to the AI assistant and receives a streaming response (Server-Sent Events). The AI assistant answers questions about credit data, regulations, and platform features.

**Request Body:**
```json
{
  "message": "What are the key factors affecting a borrower's credit score?",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream with text chunks.

#### AI Compliance Report

```
POST /api/ai/compliance-report
```

**Authentication:** Session-based (admin, super_admin, or regulator role required)

Generates an AI-powered regulatory compliance analysis for a specified country.

**Request Body:**
```json
{
  "country": "Kenya"
}
```

**Response:**
```json
{
  "complianceScore": 85,
  "regulatoryBody": "Central Bank of Kenya",
  "dataProtectionLaw": "Kenya Data Protection Act, 2019",
  "riskAreas": ["Cross-border data transfers", "Consent management"],
  "recommendations": ["Implement enhanced consent tracking", "Review data sharing agreements"]
}
```

---

### 15.2 Excel Export Endpoint

```
GET /api/reports/export?format=xlsx&type=portfolio|borrowers|audit
```

**Authentication:** Session-based (authenticated user required)

Downloads report data in Excel (XLSX) format with formatted headers and styling.

**Query Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `format` | `xlsx`, `csv` | Export format |
| `type` | `portfolio`, `borrowers`, `audit` | Type of report to export |

**Response:** Binary XLSX file download with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

### 15.3 Notification Endpoints

#### Get Notifications

```
GET /api/notifications
```

**Authentication:** Session-based (authenticated user required)

Returns all notifications for the authenticated user, ordered by creation date (newest first).

#### Mark Notification as Read

```
PATCH /api/notifications/:id/read
```

**Authentication:** Session-based (authenticated user required)

Marks a single notification as read.

#### Mark All Notifications as Read

```
POST /api/notifications/mark-all-read
```

**Authentication:** Session-based (authenticated user required)

Marks all unread notifications for the authenticated user as read.

---

### 15.4 API Usage Analytics

```
GET /api/admin/api-usage
```

**Authentication:** Session-based (admin or super_admin role required)

Returns API usage statistics tracked in-memory.

**Response:**
```json
{
  "totalToday": 1250,
  "totalThisHour": 87,
  "uniqueEndpoints": 24,
  "topEndpoints": [
    { "endpoint": "/api/borrowers", "count": 350 },
    { "endpoint": "/api/credit-accounts", "count": 210 }
  ],
  "hourlyData": [
    { "hour": 0, "count": 12 },
    { "hour": 1, "count": 8 }
  ]
}
```

---

### 15.5 Dashboard Trends

```
GET /api/dashboard/trends
```

**Authentication:** Session-based (authenticated user required)

Returns 7-day synthetic trend data for key dashboard metrics, used by the StatCard sparkline mini-charts.

**Response:**
```json
{
  "borrowerTrends": [{ "date": "2026-02-25", "value": 102400 }, ...],
  "accountTrends": [{ "date": "2026-02-25", "value": 172300 }, ...],
  "institutionTrends": [{ "date": "2026-02-25", "value": 100010 }, ...],
  "disputeTrends": [{ "date": "2026-02-25", "value": 3200 }, ...]
}
```

---

## 16. Support & Onboarding Contact

| Contact | Details |
|---|---|
| **API Support Email** | api-support@systemsinmotion.com |
| **Onboarding Team** | onboarding@systemsinmotion.com |
| **Technical Documentation** | This document |
| **General Inquiries** | info@systemsinmotion.com |

For urgent production issues, include your institution name, API key prefix (e.g., `sim_a1b2c3d4`), and a description of the error including the full HTTP response.

---

*© 2026 Systems In Motion Limited. All rights reserved. This document is confidential and intended only for authorized institutions integrating with the Pan-African Credit Registry.*
