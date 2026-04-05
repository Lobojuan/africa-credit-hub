# Credit Reporting Procedures Manual

## Cross-Jurisdictional Central Data Hub & Credit Registry System v2.5

**Prepared for:** Carlson Capital & Systems In Motion Limited  
**Document Version:** 2.5  
**Date:** April 2026  
**Classification:** Confidential

---

## 1. Purpose & Scope

This manual defines the operational procedures for credit data management within the Pan-African Credit Registry System (CDH v2.5). It covers the complete data lifecycle — from institutional onboarding and data submission through report generation, scoring, dispute resolution, and regulatory reporting.

**Applicable jurisdictions:** All 54 African countries supported by the platform.

**Intended audience:** Data officers, compliance teams, credit analysts, IT integration staff, and operations managers at participating financial institutions.

---

## 2. Institutional Onboarding

### 2.1 Registration Workflow

| Step | Actor | Action | SLA |
|------|-------|--------|-----|
| 1 | Institution | Submits registration via `/contact-sales` or direct referral | — |
| 2 | CDH Admin | Creates organisation record with country binding and status `pending` | 1 business day |
| 3 | CDH Admin | Assigns institution type (bank, MFI, telco, SACCO, insurer, other) | Same day |
| 4 | Regulator / Admin | Reviews and approves organisation — status changes to `active` | 3 business days |
| 5 | CDH Admin | Creates user accounts with appropriate roles (admin, lender, viewer) | Same day as approval |
| 6 | Institution | Receives welcome email with login credentials and onboarding guide | Automated |
| 7 | Institution | Completes first login, sets permanent password, configures MFA | Within 5 days |

### 2.2 API Key Provisioning

Institutions requiring programmatic access receive API keys through the following process:

1. Admin navigates to **Settings > API Keys** and creates a new key
2. System generates a cryptographically secure key (`sim_XXXXXXXX_...`) with SHA-256 hash storage
3. Full key is displayed **once only** — institution must record it securely
4. Permission level is assigned: `submit` (write only), `read` (read only), or `full` (read + write)
5. Key is bound to the institution's organisation record

### 2.3 Data Sharing Agreements

For cross-border data access, institutions must have an active bilateral data sharing agreement:

| Field | Description |
|-------|-------------|
| Source Country | Country originating the data |
| Target Country | Country requesting access |
| Source Institutions | Specific institutions covered (or all) |
| Target Institutions | Specific institutions granted access (or all) |
| Data Types | Categories of data shared (credit accounts, inquiries, etc.) |
| Effective Date | Agreement start date |
| Expiry Date | Agreement end date |
| Status | `active`, `expired`, or `suspended` |

---

## 3. Data Submission Workflows

### 3.1 Submission Channels

The system supports three data submission methods:

| Channel | Endpoint / Interface | Format | Use Case |
|---------|---------------------|--------|----------|
| Web UI (Manual) | Borrowers & Credit Accounts pages | Form-based | Individual record entry |
| REST API | `POST /api/external/borrowers`, `POST /api/external/credit-accounts` | JSON | Real-time integration |
| Batch Upload | `POST /api/batch-upload/borrowers`, `POST /api/batch-upload/credit-accounts` | JSON, CSV, XBRL/XML | Bulk periodic submission |

### 3.2 Bank of Ghana IFF File Types

For Ghana-mode operations, the system supports all six BoG Interim File Format (IFF) types:

| IFF Type | Description | Key Fields |
|----------|-------------|------------|
| IFF-001 | Individual Borrower Registration | Name, Ghana Card, DOB, gender, employment type, owner/tenant status |
| IFF-002 | Corporate Borrower Registration | Company name, registration number, TIN, industry sector |
| IFF-003 | Credit Facility Submission | Account number, facility type, amount, currency, classification |
| IFF-004 | Payment History Update | Payment date, amount due, amount paid, days past due |
| IFF-005 | Guarantor Information | Guarantor details, nature of guarantee, relationship to borrower |
| IFF-006 | Dishonoured Cheque Report | Cheque number, amount, return reason (BoG codes), bank details |

### 3.3 Batch Upload Process

1. **Preparation:** Institution prepares data file in supported format (JSON/CSV/XBRL)
2. **Validation:** System performs schema validation using Zod schemas derived from Drizzle ORM definitions
3. **Duplicate Detection:** Fuzzy matching (pg_trgm, threshold ≥ 0.3) identifies potential duplicate borrowers
4. **Maker-Checker Queue:** Records enter the pending approvals queue for independent review
5. **Approval:** A different user (checker) reviews and approves/rejects each record
6. **Persistence:** Approved records are committed to the database with full audit trail
7. **Notification:** Submitter receives notification of approval/rejection status

### 3.4 Data Validation Rules

All submitted data is validated against the following rules:

| Validation | Rule | Error Response |
|------------|------|----------------|
| Required fields | All non-nullable schema fields must be present | HTTP 400 with field-level errors |
| Enum values | Must match defined enum values (account type, status, etc.) | HTTP 400 with allowed values |
| Country binding | Borrower country must match institution's jurisdiction | HTTP 403 data sovereignty violation |
| Organisation scope | Records must belong to the submitting organisation | HTTP 403 insufficient permissions |
| Date formats | ISO 8601 date strings | HTTP 400 invalid date format |
| Currency codes | ISO 4217 three-letter codes | HTTP 400 invalid currency |
| National ID format | Country-specific format validation (e.g., Ghana Card: GHA-XXXXXXXXX-X) | HTTP 400 invalid ID format |

---

## 4. Credit Report Generation

### 4.1 Report Request Flow

| Step | Description |
|------|-------------|
| 1 | User searches for borrower by name, national ID, or system ID |
| 2 | System verifies consent record exists for the requesting institution |
| 3 | User selects borrower and clicks "Generate Report" |
| 4 | System aggregates data from all tables (credit accounts, inquiries, judgments, cheques, guarantors, alternative data) |
| 5 | Credit score is calculated using the ML-enhanced scoring model |
| 6 | Report is rendered on-screen with 9+ sections |
| 7 | User may download as PDF with full formatting |
| 8 | `VIEW` audit log entry is created with hash chain |

### 4.2 Report Sections

The credit report contains the following sections:

| Section | Content |
|---------|---------|
| 1. Credit Profile Overview | 11 key indicators including score, active accounts, total exposure, overdue ratio, utilisation |
| 2. Personal Information | Borrower demographics, national ID, employment, address |
| 3. Liability Summary | Aggregated exposure by currency with performing/non-performing split |
| 4. Credit Accounts | Detailed account listing with payment history grid (Month/Status/Amount Due) |
| 5. Inquiries | All credit inquiries with purpose, date, and institution |
| 6. Court Judgments | Legal judgments with case details and amounts |
| 7. Dishonoured Cheques | Returned cheques with BoG reason codes |
| 8. Guarantor Information | Active guarantees with nature codes |
| 9. Collections | Accounts in collection status with R-Rating classification |
| 10. Consumer Statement | Borrower's own statement (if filed) |
| 11. Utilisation by Currency | Per-currency credit utilisation breakdown |

### 4.3 Credit Scoring Methodology

The system calculates credit scores using a weighted multi-factor model:

| Factor | Weight | Components |
|--------|--------|------------|
| Payment History | 35% | On-time payment ratio, days past due trends, delinquency history |
| Credit Utilisation | 30% | Current balance vs. approved limit, per-currency analysis |
| Credit History Length | 15% | Age of oldest account, average account age |
| Credit Mix | 10% | Diversity of facility types (term loans, revolving, overdraft, mortgage) |
| New Credit | 10% | Recent inquiries (last 6 months), new accounts opened |

**Score ranges:**

| Range | Classification | Colour |
|-------|---------------|--------|
| 750–850 | Excellent | Green |
| 700–749 | Good | Light Green |
| 650–699 | Fair | Yellow |
| 550–649 | Poor | Orange |
| 300–549 | Very Poor | Red |

### 4.4 ML-Enhanced Scoring

The platform supplements the traditional model with machine-learning credit scoring that incorporates:

- Alternative data signals (telco usage patterns, utility payments, mobile money activity)
- Fraud risk probability from the anomaly detection engine
- Cross-border credit history where data sharing agreements permit
- Behavioural trend analysis (improving/deteriorating trajectory)

---

## 5. Dispute Resolution Procedures

### 5.1 Dispute Filing

| Channel | Method |
|---------|--------|
| Web Portal | Consumer self-service portal at `/consumer/disputes` |
| Helpdesk | Institution staff via the Helpdesk page |
| AI Chatbot | Guided dispute filing via the dispute chatbot (ENT-03) |
| API | `POST /api/external/disputes` for programmatic filing |

### 5.2 Dispute Lifecycle

| Status | Description | SLA |
|--------|-------------|-----|
| `open` | Dispute filed and acknowledged | Immediate |
| `under_review` | Assigned to data-furnishing institution for investigation | Within 2 business days |
| `resolved` | Investigation complete, outcome recorded | Within 15 business days |
| `rejected` | Dispute found to be without merit | Within 15 business days |
| `escalated` | Escalated to regulator for adjudication | Within 20 business days |

### 5.3 Resolution Process

1. **Filing:** Consumer or institution submits dispute with category, description, and supporting evidence
2. **Acknowledgement:** System generates dispute ID and sends confirmation notification
3. **Assignment:** Dispute is routed to the data-furnishing institution for investigation
4. **Investigation:** Institution reviews source records, verifies accuracy, and documents findings
5. **Resolution:** Investigator records outcome — data corrected, dispute upheld, or dispute rejected
6. **Notification:** Consumer and all parties receive resolution notification
7. **Audit Trail:** Complete dispute lifecycle is logged in the tamper-evident audit chain

### 5.4 Data Correction

When a dispute results in data correction:

1. Correction enters the Maker-Checker workflow (four-eye principle)
2. A different user must approve the correction before it takes effect
3. Both the original and corrected values are preserved in the audit trail
4. Affected credit reports are automatically recalculated
5. Consumer is notified of the correction

---

## 6. Regulatory Reporting

### 6.1 BoG CRB Regulatory Returns

For Ghana-mode operations, the system generates the following regulatory returns:

| Return | Frequency | Format | Description |
|--------|-----------|--------|-------------|
| Credit Data Submission | Monthly | IFF (6 file types) | Complete credit data submission to BoG |
| Portfolio Quality Report | Quarterly | PDF/Excel | NPL ratios, classification distribution, provisioning levels |
| Dispute Statistics | Quarterly | PDF/Excel | Volume, resolution rates, average turnaround times |
| System Availability Report | Monthly | PDF | Uptime metrics, incident summary, SLA compliance |

### 6.2 BoG Export Generation

The system provides automated BoG export file generation:

1. Navigate to **Settings > BoG Data Export**
2. Select the reporting period and file type(s)
3. System generates IFF-compliant files with BoG code mappings
4. Files are validated against BoG field specifications before download
5. Export event is logged in the audit trail

### 6.3 BSL Regulatory Returns (Sierra Leone)

For Sierra Leone operations, equivalent BSL export generators produce regulatory-compliant data files.

### 6.4 Multi-Country Regulatory Alignment

The platform maintains country-specific regulatory mappings through the `country_settings` table, ensuring each jurisdiction's unique requirements (field mappings, code systems, reporting frequencies) are enforced at the data layer.

---

## 7. Data Retention & Purge

### 7.1 Retention Policy Framework

Data retention is enforced per-jurisdiction through the `retention_policies` table:

| Field | Description |
|-------|-------------|
| Country | Applicable jurisdiction |
| Entity Type | Data category (borrower, credit_account, inquiry, etc.) |
| Retention Days | Maximum retention period in days |
| Action on Expiry | `archive` or `purge` |

### 7.2 Standard Retention Periods

| Country | Negative Data | Positive Data | Inquiries | Disputes |
|---------|--------------|---------------|-----------|----------|
| Ghana | 7 years | 7 years | 2 years | 7 years |
| South Africa | 5 years (POPIA) | 5 years | 1 year | 5 years |
| Nigeria | 6 years | 6 years | 2 years | 6 years |
| Kenya | 7 years | 5 years | 2 years | 7 years |

### 7.3 Automated Purge Engine

The retention enforcement engine runs every 24 hours:

1. Queries all active retention policies
2. Identifies records exceeding their jurisdiction's retention period
3. Executes purge operations with full audit logging
4. Creates `DATA_PURGED` audit log entries for compliance evidence

---

## 8. Consent Management

### 8.1 Consent Model

All credit data access requires documented consent:

| Field | Description |
|-------|-------------|
| Borrower ID | The data subject |
| Institution | The institution granted access |
| Purpose | Reason for data access (credit assessment, monitoring, regulatory) |
| Granted At | Timestamp of consent grant |
| Expires At | Consent expiry date |
| Revoked At | Timestamp of revocation (if applicable) |
| Status | `active`, `expired`, or `revoked` |

### 8.2 Consent Verification

Before generating a credit report, the system verifies:

1. An active consent record exists for the requesting institution
2. The consent has not expired
3. The consent has not been revoked
4. The purpose matches the consent scope

### 8.3 Consumer Rights

Data subjects may exercise the following rights through the consumer portal:

| Right | Implementation |
|-------|---------------|
| Right of Access | View own credit report via consumer portal |
| Right to Rectification | File dispute to correct inaccurate data |
| Right to Erasure | Request data deletion (subject to regulatory retention requirements) |
| Consent Management | Grant or revoke consent per institution |
| Statement Filing | Add a personal statement to the credit file |

---

## 9. Webhook & Real-Time Notifications

### 9.1 Webhook Events

Institutions can subscribe to real-time event notifications:

| Event | Trigger |
|-------|---------|
| `borrower.created` | New borrower registered |
| `credit_account.created` | New credit account added |
| `credit_account.updated` | Credit account modified |
| `dispute.filed` | New dispute raised |
| `dispute.resolved` | Dispute resolution recorded |
| `approval.requested` | New approval request in queue |
| `approval.completed` | Approval granted or rejected |

### 9.2 Webhook Security

- Payloads are signed using HMAC-SHA256 with the institution's webhook secret
- Two signature headers are sent: `X-CDH-Signature` and `X-Webhook-Signature`
- Delivery attempts are logged in `webhook_delivery_logs` with success/failure status
- Failed deliveries are retried with exponential backoff

---

## 10. AI-Powered Features

### 10.1 AI Credit Risk Analysis

The AI Command Centre provides:

| Feature | Description |
|---------|-------------|
| Credit Risk Analysis | Natural-language assessment of borrower creditworthiness |
| Report Summary | AI-generated executive summary of credit report |
| Portfolio Intelligence | Institution-wide portfolio risk assessment |
| Anomaly Detection | Automated identification of unusual patterns in credit data |
| Regulatory Reporting | AI-assisted regulatory compliance report generation |
| Loan Recommendation | Data-driven lending decision support |

### 10.2 AI Providers

The platform supports multiple AI providers:

| Provider | Models | Use Case |
|----------|--------|----------|
| OpenAI | GPT-4o, GPT-4o-mini | General analysis, report generation |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku | Compliance analysis, detailed reasoning |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | CDH-CRP-2026-001 |
| Version | 2.5 |
| Classification | Confidential |
| Authors | Uffe Jon Carlson, Thomas Baafi |
| Organisation | Carlson Capital & Systems In Motion Limited |
| Last Updated | April 2026 |
