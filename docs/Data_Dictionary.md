# Data Dictionary

## Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.0  
**Date:** January 2025

---

## 1. Overview

This document provides field-level documentation for all 15 database tables in the Credit Registry System. The database uses PostgreSQL with Drizzle ORM for schema management.

---

## 2. Enumerated Types

### 2.1 user_role
| Value | Description |
|-------|-------------|
| admin | Full system access, user management, institution management, API key management |
| regulator | Access to audit logs, billing, approvals, analytics |
| lender | Data entry, borrower management, batch upload |
| viewer | Read-only access to borrowers, accounts, reports |

### 2.2 user_status
| Value | Description |
|-------|-------------|
| active | User can log in and access the system |
| suspended | User temporarily barred from access |
| deactivated | User permanently barred from access |

### 2.3 borrower_type
| Value | Description |
|-------|-------------|
| individual | Natural person borrower |
| corporate | Business entity borrower |

### 2.4 account_status
| Value | Description |
|-------|-------------|
| current | Account in good standing with payments up to date |
| delinquent | Account with overdue payments |
| default | Account in default (severe delinquency) |
| closed | Account fully paid and closed |
| restructured | Account that has been restructured |
| written_off | Account written off as uncollectable |

### 2.5 inquiry_purpose
| Value | Description |
|-------|-------------|
| new_credit | Inquiry for new credit application |
| review | Periodic account review |
| collection | Collections-related inquiry |
| regulatory | Regulatory examination |
| portfolio_monitoring | Portfolio risk monitoring |

### 2.6 approval_status
| Value | Description |
|-------|-------------|
| pending | Awaiting review |
| approved | Approved by reviewer |
| rejected | Rejected by reviewer |

### 2.7 dispute_status
| Value | Description |
|-------|-------------|
| open | Newly filed dispute |
| under_review | Dispute being investigated |
| resolved | Dispute resolved |
| rejected | Dispute rejected |

### 2.8 judgment_type
| Value | Description |
|-------|-------------|
| lien | Legal claim on property |
| bankruptcy | Bankruptcy filing |
| lawsuit | Active lawsuit |
| civil_judgment | Civil court judgment |
| criminal_conviction | Criminal conviction |

### 2.9 judgment_status
| Value | Description |
|-------|-------------|
| active | Judgment currently active |
| resolved | Judgment resolved or satisfied |
| appealed | Judgment under appeal |

### 2.10 consent_status
| Value | Description |
|-------|-------------|
| active | Consent currently active |
| revoked | Consent has been revoked |

### 2.11 payment_status
| Value | Description |
|-------|-------------|
| on_time | Payment made on schedule |
| late | Payment made after due date |
| missed | Payment not made |
| partial | Partial payment made |

### 2.12 institution_status
| Value | Description |
|-------|-------------|
| pending | Awaiting admin approval |
| active | Approved and active |
| suspended | Temporarily suspended |

### 2.13 billing_status
| Value | Description |
|-------|-------------|
| pending | Invoice awaiting payment |
| paid | Invoice paid |
| overdue | Invoice past due date |

### 2.14 api_key_status
| Value | Description |
|-------|-------------|
| active | API key is active and usable |
| revoked | API key has been revoked |

---

## 3. Table Definitions

### 3.1 users

**Description:** System users with authentication credentials, roles, and login tracking.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| username | text | NOT NULL, UNIQUE | Login username | `admin` |
| password | text | NOT NULL | bcrypt-hashed password | `$2a$10$...` |
| full_name | text | NOT NULL | User's full name | `System Administrator` |
| email | text | NOT NULL | User email address | `admin@sim.com` |
| role | user_role | NOT NULL, DEFAULT 'viewer' | User role for RBAC | `admin` |
| status | user_status | NOT NULL, DEFAULT 'active' | Account status | `active` |
| institution | text | NULLABLE | Associated institution name | `National Bank of Ethiopia` |
| failed_login_attempts | integer | DEFAULT 0 | Counter for failed login attempts | `2` |
| locked_until | timestamp | NULLABLE | Account lock expiration time | `2025-01-15T10:30:00Z` |
| last_login | timestamp | NULLABLE | Last successful login timestamp | `2025-01-15T09:00:00Z` |
| password_changed_at | timestamp | NULLABLE | Last password change timestamp | `2025-01-01T00:00:00Z` |
| must_change_password | boolean | DEFAULT false | Force password change on next login | `false` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-01T00:00:00Z` |

---

### 3.2 borrowers

**Description:** Individual and corporate borrower records with demographic, employment, and PEP information.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique borrower identifier | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| type | borrower_type | NOT NULL | Borrower category | `individual` |
| first_name | text | NULLABLE | First name (individual borrowers) | `Abebe` |
| last_name | text | NULLABLE | Last name (individual borrowers) | `Bekele` |
| company_name | text | NULLABLE | Company name (corporate borrowers) | `Ethio Telecom` |
| national_id | text | NOT NULL, UNIQUE | National identification number | `ETH-1234567890` |
| tin_number | text | NULLABLE | Tax Identification Number | `TIN-9876543210` |
| date_of_birth | text | NULLABLE | Date of birth (YYYY-MM-DD) | `1985-03-15` |
| gender | text | NULLABLE | Gender | `male` |
| phone | text | NULLABLE | Phone number | `+251911234567` |
| email | text | NULLABLE | Email address | `abebe@example.com` |
| address | text | NULLABLE | Street address | `Bole Road, Addis Ababa` |
| city | text | NULLABLE | City | `Addis Ababa` |
| region | text | NULLABLE | Region/state | `Addis Ababa` |
| employer_name | text | NULLABLE | Current employer | `Ethiopian Airlines` |
| occupation | text | NULLABLE | Occupation/job title | `Engineer` |
| business_reg_number | text | NULLABLE | Business registration number (corporate) | `BR-2024-001` |
| sector | text | NULLABLE | Business sector (corporate) | `Technology` |
| is_pep | boolean | DEFAULT false | Politically Exposed Person flag | `false` |
| pep_details | text | NULLABLE | PEP details/description | `Former government minister` |
| related_borrower_id | varchar | NULLABLE | Related/linked borrower ID | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| relationship_type | text | NULLABLE | Relationship to related borrower | `spouse` |
| education_level | text | NULLABLE | Highest education level | `bachelors` |
| education_institution | text | NULLABLE | Education institution name | `Addis Ababa University` |
| employment_history | text | NULLABLE | Employment history details | `5 years at Ethiopian Airlines` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-01T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Last update timestamp | `2025-01-15T10:00:00Z` |

---

### 3.3 credit_accounts

**Description:** Loan and credit facility records with multi-currency support, special loan features, and restructuring tracking.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique account identifier | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Associated borrower | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| lender_institution | text | NOT NULL | Lending institution name | `Commercial Bank of Ethiopia` |
| account_number | text | NOT NULL | Account/loan number | `ACC-2024-001234` |
| account_type | text | NOT NULL | Type of credit facility | `term_loan` |
| original_amount | decimal(15,2) | NOT NULL | Original disbursed amount | `500000.00` |
| current_balance | decimal(15,2) | NOT NULL | Current outstanding balance | `350000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Currency code | `ETB` |
| interest_rate | decimal(5,2) | NULLABLE | Annual interest rate percentage | `12.50` |
| disbursement_date | text | NULLABLE | Loan disbursement date | `2024-01-15` |
| maturity_date | text | NULLABLE | Loan maturity date | `2029-01-15` |
| status | account_status | NOT NULL, DEFAULT 'current' | Account status | `current` |
| days_in_arrears | integer | DEFAULT 0 | Number of days in arrears | `0` |
| collateral_type | text | NULLABLE | Type of collateral pledged | `real_estate` |
| collateral_value | decimal(15,2) | NULLABLE | Collateral value | `750000.00` |
| last_payment_date | text | NULLABLE | Date of last payment | `2025-01-01` |
| last_payment_amount | decimal(15,2) | NULLABLE | Amount of last payment | `15000.00` |
| is_interest_free | boolean | DEFAULT false | Interest-free loan flag | `false` |
| grace_period_months | integer | NULLABLE | Grace period in months | `6` |
| restructure_count | integer | DEFAULT 0 | Number of restructures | `0` |
| written_off_date | text | NULLABLE | Date account was written off | `null` |
| reinstated_date | text | NULLABLE | Date account was reinstated | `null` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-01T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Last update timestamp | `2025-01-15T10:00:00Z` |

---

### 3.4 credit_inquiries

**Description:** Records of credit reference checks performed on borrowers.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique inquiry identifier | `e5f6a7b8-c9d0-1234-ef01-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Borrower being inquired | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| inquired_by | varchar | NOT NULL, FK -> users.id | User who performed inquiry | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| purpose | inquiry_purpose | NOT NULL | Purpose of credit inquiry | `new_credit` |
| institution | text | NOT NULL | Institution making inquiry | `Commercial Bank of Ethiopia` |
| consent_provided | boolean | NOT NULL, DEFAULT false | Whether borrower consent was obtained | `true` |
| created_at | timestamp | DEFAULT NOW() | Inquiry timestamp | `2025-01-15T09:30:00Z` |

---

### 3.5 audit_logs

**Description:** Immutable activity log for all system operations with IP tracking.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique log entry identifier | `f6a7b8c9-d0e1-2345-f012-678901234567` |
| user_id | varchar | NULLABLE, FK -> users.id | User who performed the action | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| action | text | NOT NULL | Action type performed | `LOGIN`, `CREATE`, `UPDATE`, `APPROVE` |
| entity | text | NOT NULL | Entity type affected | `user`, `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | ID of affected entity | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| details | text | NULLABLE | Human-readable action details | `Created user: John Doe` |
| ip_address | text | NULLABLE | Client IP address | `192.168.1.100` |
| created_at | timestamp | DEFAULT NOW() | Log entry timestamp | `2025-01-15T09:30:00Z` |

---

### 3.6 pending_approvals

**Description:** Maker-checker workflow queue for data change approvals.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique approval request identifier | `a7b8c9d0-e1f2-3456-0123-789012345678` |
| entity_type | text | NOT NULL | Type of entity being changed | `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | ID of existing entity (for updates) | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| action | text | NOT NULL | Type of change requested | `CREATE`, `UPDATE` |
| payload | text | NOT NULL | JSON serialized change data | `{"firstName":"Abebe","lastName":"Bekele",...}` |
| requested_by | varchar | NOT NULL, FK -> users.id | User who submitted the request | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| reviewed_by | varchar | NULLABLE, FK -> users.id | User who reviewed the request | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| status | approval_status | NOT NULL, DEFAULT 'pending' | Current approval status | `pending` |
| review_notes | text | NULLABLE | Reviewer's notes/comments | `Approved - verified documentation` |
| created_at | timestamp | DEFAULT NOW() | Request submission timestamp | `2025-01-15T09:30:00Z` |
| reviewed_at | timestamp | NULLABLE | Review timestamp | `2025-01-15T10:00:00Z` |

---

### 3.7 disputes

**Description:** Dispute and grievance records with SLA tracking and correction type categorization.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique dispute identifier | `b8c9d0e1-f2a3-4567-1234-890123456789` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Borrower filing dispute | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| credit_account_id | varchar | NULLABLE, FK -> credit_accounts.id | Related credit account | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| filed_by | varchar | NOT NULL, FK -> users.id | User who filed the dispute | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| dispute_type | text | NOT NULL | Category of dispute | `incorrect_balance`, `wrong_status`, `identity_error` |
| description | text | NOT NULL | Detailed dispute description | `Balance shows 500,000 ETB but should be 350,000 ETB` |
| status | dispute_status | NOT NULL, DEFAULT 'open' | Current dispute status | `open` |
| resolution | text | NULLABLE | Resolution description | `Balance corrected to 350,000 ETB` |
| correction_type | text | NULLABLE | Financial or non-financial correction | `financial` |
| sla_deadline | timestamp | NULLABLE | SLA deadline (2 days financial, 5 days non-financial) | `2025-01-17T09:30:00Z` |
| created_at | timestamp | DEFAULT NOW() | Dispute filing timestamp | `2025-01-15T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Last update timestamp | `2025-01-15T10:00:00Z` |
| resolved_at | timestamp | NULLABLE | Resolution timestamp | `2025-01-16T14:00:00Z` |

---

### 3.8 notifications

**Description:** In-app notification system for approval requests, results, and system alerts.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique notification identifier | `c9d0e1f2-a3b4-5678-2345-901234567890` |
| user_id | varchar | NULLABLE, FK -> users.id | Target user (null = broadcast) | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| type | text | NOT NULL | Notification category | `approval_pending`, `approval_result`, `dispute_filed` |
| title | text | NOT NULL | Notification title | `New approval pending` |
| message | text | NOT NULL | Notification body | `New borrower registration requires your review` |
| is_read | boolean | DEFAULT false | Read status flag | `false` |
| link | text | NULLABLE | Navigation link | `/approvals` |
| created_at | timestamp | DEFAULT NOW() | Notification timestamp | `2025-01-15T09:30:00Z` |

---

### 3.9 court_judgments

**Description:** Court judgments, bankruptcies, and liens associated with borrowers (FR-COL-05).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique judgment identifier | `d0e1f2a3-b4c5-6789-3456-012345678901` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Associated borrower | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| case_number | text | NOT NULL | Court case reference number | `CASE-2024-5678` |
| court | text | NOT NULL | Court name | `Federal High Court, Addis Ababa` |
| judgment_type | judgment_type | NOT NULL | Type of judgment | `civil_judgment` |
| amount | decimal(15,2) | NULLABLE | Judgment amount | `1000000.00` |
| currency | text | DEFAULT 'ETB' | Currency of judgment amount | `ETB` |
| judgment_date | text | NOT NULL | Date judgment was issued | `2024-06-15` |
| status | judgment_status | NOT NULL, DEFAULT 'active' | Current judgment status | `active` |
| description | text | NULLABLE | Judgment details | `Civil judgment for unpaid commercial loan` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-15T09:30:00Z` |

---

### 3.10 consent_records

**Description:** Data subject consent management with receipt numbers (FR-CON-06/07).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique consent record identifier | `e1f2a3b4-c5d6-7890-4567-123456789012` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Borrower granting consent | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| granted_to | text | NOT NULL | Entity receiving consent | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Purpose of consent | `credit_check`, `data_sharing` |
| consent_type | text | NOT NULL | Type of consent | `one_time`, `recurring` |
| status | consent_status | NOT NULL, DEFAULT 'active' | Current consent status | `active` |
| granted_at | timestamp | DEFAULT NOW() | Consent grant timestamp | `2025-01-15T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Consent revocation timestamp | `null` |
| receipt_number | text | NOT NULL | Unique consent receipt number | `CR-1705312200000-abc123` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-15T09:30:00Z` |

---

### 3.11 payment_history

**Description:** 12-period payment performance history per credit account (FR-CR-08).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique payment record identifier | `f2a3b4c5-d6e7-8901-5678-234567890123` |
| credit_account_id | varchar | NOT NULL, FK -> credit_accounts.id | Associated credit account | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| period | text | NOT NULL | Payment period (YYYY-MM format) | `2025-01` |
| amount_due | decimal(15,2) | NOT NULL | Amount due for the period | `15000.00` |
| amount_paid | decimal(15,2) | NOT NULL | Amount actually paid | `15000.00` |
| status | payment_status | NOT NULL, DEFAULT 'on_time' | Payment status for the period | `on_time` |
| days_late | integer | DEFAULT 0 | Number of days payment was late | `0` |
| created_at | timestamp | DEFAULT NOW() | Record creation timestamp | `2025-01-15T09:30:00Z` |

---

### 3.12 institutions

**Description:** Data provider institution registration with approval workflow (FR-DP-01/04).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique institution identifier | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| name | text | NOT NULL | Institution name | `Commercial Bank of Ethiopia` |
| type | text | NOT NULL | Institution type | `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| registration_number | text | NULLABLE | Official registration number | `REG-2024-001` |
| country | text | NOT NULL, DEFAULT 'Ethiopia' | Country of operation | `Ethiopia` |
| contact_email | text | NULLABLE | Contact email address | `info@cbe.com.et` |
| contact_phone | text | NULLABLE | Contact phone number | `+251111234567` |
| address | text | NULLABLE | Physical address | `Churchill Avenue, Addis Ababa` |
| status | institution_status | NOT NULL, DEFAULT 'pending' | Registration status | `active` |
| submission_frequency | text | DEFAULT 'monthly' | Data submission frequency | `monthly` |
| approved_by | varchar | NULLABLE, FK -> users.id | Admin who approved | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| approved_at | timestamp | NULLABLE | Approval timestamp | `2025-01-15T10:00:00Z` |
| created_at | timestamp | DEFAULT NOW() | Registration timestamp | `2025-01-01T00:00:00Z` |

---

### 3.13 billing_records

**Description:** Billing and fee management for institutions (FR-COMM-01/05).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique billing record identifier | `b4c5d6e7-f8a9-0123-7890-456789012345` |
| institution_name | text | NOT NULL | Billed institution name | `Commercial Bank of Ethiopia` |
| service_type | text | NOT NULL | Type of service billed | `data_submission`, `credit_report`, `api_access`, `subscription` |
| amount | decimal(15,2) | NOT NULL | Invoice amount | `50000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Invoice currency | `ETB` |
| status | billing_status | NOT NULL, DEFAULT 'pending' | Payment status | `pending` |
| invoice_number | text | NOT NULL | Unique invoice number | `INV-2025-001234` |
| period_start | text | NULLABLE | Billing period start date | `2025-01-01` |
| period_end | text | NULLABLE | Billing period end date | `2025-01-31` |
| created_at | timestamp | DEFAULT NOW() | Invoice creation timestamp | `2025-01-15T09:30:00Z` |

---

### 3.14 credit_report_logs

**Description:** Credit report generation logs with unique serial numbers (FR-CR-06).

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique log identifier | `c5d6e7f8-a9b0-1234-8901-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Borrower for whom report was generated | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| requested_by | varchar | NOT NULL, FK -> users.id | User who requested the report | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| institution | text | NOT NULL | Requesting institution | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Purpose of report generation | `new_credit` |
| serial_number | text | NOT NULL, UNIQUE | Unique report serial number | `CR-2025-M1A2B3C4` |
| created_at | timestamp | DEFAULT NOW() | Report generation timestamp | `2025-01-15T09:30:00Z` |

---

### 3.15 api_keys

**Description:** External API key management with SHA-256 hashing, permission levels, and institution binding.

| Field Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique API key record identifier | `d6e7f8a9-b0c1-2345-9012-678901234567` |
| institution_id | varchar | NOT NULL, FK -> institutions.id | Associated institution | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| key_hash | text | NOT NULL | SHA-256 hash of the full API key | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| key_prefix | text | NOT NULL | Visible key prefix for identification | `sim_a1b2c3d4` |
| label | text | NOT NULL | Human-readable key label | `Production API Key` |
| status | api_key_status | NOT NULL, DEFAULT 'active' | Key status | `active` |
| permissions | text | NOT NULL, DEFAULT 'submit' | Permission level | `submit`, `read`, `full` |
| last_used_at | timestamp | NULLABLE | Last API call timestamp | `2025-01-15T14:30:00Z` |
| created_by | varchar | NOT NULL, FK -> users.id | Admin who created the key | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | Key creation timestamp | `2025-01-15T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Key revocation timestamp | `null` |

---

## 4. Relationship Diagram (Text-Based)

```
users
  |
  +--< credit_inquiries (inquired_by -> users.id)
  +--< pending_approvals (requested_by -> users.id)
  +--< pending_approvals (reviewed_by -> users.id)
  +--< disputes (filed_by -> users.id)
  +--< notifications (user_id -> users.id)
  +--< audit_logs (user_id -> users.id)
  +--< credit_report_logs (requested_by -> users.id)
  +--< api_keys (created_by -> users.id)
  +--< institutions (approved_by -> users.id)

borrowers
  |
  +--< credit_accounts (borrower_id -> borrowers.id)
  +--< credit_inquiries (borrower_id -> borrowers.id)
  +--< disputes (borrower_id -> borrowers.id)
  +--< court_judgments (borrower_id -> borrowers.id)
  +--< consent_records (borrower_id -> borrowers.id)
  +--< credit_report_logs (borrower_id -> borrowers.id)
  +--  borrowers (related_borrower_id -> borrowers.id) [self-referential]

credit_accounts
  |
  +--< payment_history (credit_account_id -> credit_accounts.id)
  +--< disputes (credit_account_id -> credit_accounts.id)

institutions
  |
  +--< api_keys (institution_id -> institutions.id)
```

**Legend:**
- `+--<` = One-to-Many relationship (parent to child)
- `+--` = Optional reference (self-referential or nullable FK)

---

## 5. Supported Currencies

| Code | Currency Name | Jurisdictions |
|------|--------------|---------------|
| ETB | Ethiopian Birr | Ethiopia |
| GHS | Ghanaian Cedi | Ghana |
| UGX | Ugandan Shilling | Uganda |
| LRD | Liberian Dollar | Liberia |
| USD | US Dollar | All |
| EUR | Euro | All |
| GBP | British Pound | All |
| KES | Kenyan Shilling | Regional |
| NGN | Nigerian Naira | Regional |
| ZAR | South African Rand | Regional |
| TZS | Tanzanian Shilling | Regional |
| RWF | Rwandan Franc | Regional |
| XOF | West African CFA Franc | Regional |
| XAF | Central African CFA Franc | Regional |
| EGP | Egyptian Pound | Regional |
| MAD | Moroccan Dirham | Regional |
| BWP | Botswana Pula | Regional |

---

## 6. Index Summary

| Table | Indexed Columns | Index Type |
|-------|----------------|------------|
| users | id (PK), username (UNIQUE) | B-tree |
| borrowers | id (PK), national_id (UNIQUE) | B-tree |
| credit_accounts | id (PK), borrower_id (FK) | B-tree |
| credit_inquiries | id (PK), borrower_id (FK), inquired_by (FK) | B-tree |
| audit_logs | id (PK), user_id (FK) | B-tree |
| pending_approvals | id (PK), requested_by (FK), reviewed_by (FK) | B-tree |
| disputes | id (PK), borrower_id (FK), credit_account_id (FK), filed_by (FK) | B-tree |
| notifications | id (PK), user_id (FK) | B-tree |
| court_judgments | id (PK), borrower_id (FK) | B-tree |
| consent_records | id (PK), borrower_id (FK) | B-tree |
| payment_history | id (PK), credit_account_id (FK) | B-tree |
| institutions | id (PK), approved_by (FK) | B-tree |
| billing_records | id (PK) | B-tree |
| credit_report_logs | id (PK), borrower_id (FK), requested_by (FK), serial_number (UNIQUE) | B-tree |
| api_keys | id (PK), institution_id (FK), created_by (FK) | B-tree |
