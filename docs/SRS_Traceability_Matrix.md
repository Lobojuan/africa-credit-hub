# SRS Traceability Matrix

## Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.1  
**Date:** March 2026

---

## 1. Purpose

This document maps every Software Requirements Specification (SRS) requirement to its implementation status within the Credit Registry System. It provides traceability from requirements through implementation to UAT test cases.

---

## 2. Traceability Legend

| Status | Description |
|--------|-------------|
| Implemented | Fully implemented and functional |
| Partial | Partially implemented with noted limitations |
| Not Implemented | Not yet implemented |

---

## 3. Data Collection Requirements (FR-COL)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-COL-01 | System shall collect borrower demographic data (name, DOB, gender, national ID, passport, TIN, address, phone, email) | Implemented | Borrower Management (`borrowers` table, `borrowers.tsx`) | All demographic fields captured in borrower registration form; individual and corporate types supported | TC-BOR-001 through TC-BOR-005 |
| FR-COL-02 | System shall collect credit account data (account type, amounts, dates, status, collateral, arrears) | Implemented | Credit Accounts (`credit_accounts` table, `credit-accounts.tsx`) | Full credit account creation with all required fields including multi-currency, interest-free, grace period, restructure tracking | TC-CA-001 through TC-CA-005 |
| FR-COL-03 | System shall support bulk data ingestion (JSON/CSV) | Implemented | Batch Upload (`batch-upload.tsx`, `/api/batch-upload/credit-accounts`) | JSON and CSV file upload with per-record validation and error reporting | TC-BATCH-001 through TC-BATCH-004 |
| FR-COL-04 | System shall validate data quality at point of entry | Implemented | Server Routes (`routes.ts`), Zod Schemas (`schema.ts`) | Zod schema validation on all insert operations; field-level constraints enforced | TC-DQ-001, TC-DQ-002 |
| FR-COL-05 | System shall collect court judgment and lien information | Implemented | Court Judgments (`court_judgments` table, `borrower-detail.tsx`) | Court judgments with case number, court, type (lien/bankruptcy/lawsuit/civil/criminal), amount, date, status | TC-CJ-001 through TC-CJ-003 |
| FR-COL-06 | Cross-Border Entity Resolution | Passport number, TIN, fuzzy name matching for cross-jurisdictional identity | shared/schema.ts, server/storage.ts | 7 relationship types incl. beneficial_owner | TC-BOR-013 |

---

## 4. Credit Reporting Requirements (FR-CR)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-CR-01 | System shall generate credit reports with borrower summary | Implemented | Credit Report (`credit-report.tsx`, `/api/borrowers/:id/credit-report`) | Full credit report with personal info, account summary, score analysis, payment history | TC-CR-001, TC-CR-002 |
| FR-CR-02 | System shall calculate credit scores (300-850 range) | Implemented | Credit Report Generation (`routes.ts`, `external-api.ts`) | Algorithmic scoring based on payment history, delinquencies, defaults, written-offs, inquiries | TC-CR-003 |
| FR-CR-03 | System shall support bulk credit reference checks | Implemented | Credit Search (`credit-search.tsx`, `/api/credit-search/bulk`) | Multi-identifier batch search with results aggregation | TC-CS-003 |
| FR-CR-04 | System shall track credit inquiries with consent | Implemented | Credit Inquiries (`credit_inquiries` table) | Inquiry logging with purpose, institution, consent flag | TC-CS-001, TC-CS-002 |
| FR-CR-05 | System shall support multiple inquiry purposes | Implemented | Credit Inquiries (`inquiryPurposeEnum`) | Supports: new_credit, review, collection, regulatory, portfolio_monitoring | TC-CS-001 |
| FR-CR-06 | System shall assign unique serial numbers to credit reports | Implemented | Credit Report Logs (`credit_report_logs` table, `/api/credit-reports/generate`) | Format: CR-{YEAR}-{timestamp_base36}; unique serial per report | TC-CR-004 |
| FR-CR-07 | System shall include reason codes in credit reports | Implemented | Credit Report (`credit-report.tsx`, scoring logic) | 10 reason codes: DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, RESTRUCTURED_ACCOUNTS, HIGH_INQUIRY_VOLUME, HIGH_DEBT_LEVEL, COURT_JUDGMENTS_PRESENT, POLITICALLY_EXPOSED_PERSON, STRONG_REPAYMENT_HISTORY, EXCELLENT_PAYMENT_RECORD, THIN_FILE_LIMITED_HISTORY | TC-CR-005 |
| FR-CR-08 | System shall maintain 12-period payment performance history | Implemented | Payment History (`payment_history` table, borrower detail) | 12-period payment grid with status tracking (on_time, late, missed, partial) | TC-CR-006 |

---

## 5. Consent & Dispute Requirements (FR-CON)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-CON-01 | System shall manage data subject consent | Implemented | Consent Management (`consent_records` table, `consent-management.tsx`) | Grant/revoke consent with type, purpose, granted-to fields | TC-CON-001 |
| FR-CON-02 | System shall provide Inquiry Service Unit (helpdesk) portal | Implemented | Helpdesk (`helpdesk.tsx`) | Consumer-facing portal for dispute filing, consent management, borrower lookup | TC-HD-001 through TC-HD-004 |
| FR-CON-03 | System shall track consent status (active/revoked) | Implemented | Consent Records (`consentStatusEnum`) | Active/revoked status with revocation timestamp | TC-CON-002 |
| FR-CON-04 | System shall support dispute filing and tracking | Implemented | Disputes (`disputes` table, `disputes.tsx`) | Full dispute lifecycle: open, under_review, resolved, rejected | TC-DIS-001, TC-DIS-002 |
| FR-CON-05 | System shall categorize disputes by correction type | Implemented | Disputes (`correctionType` field) | Financial and non-financial correction types with different SLA timelines | TC-DIS-003 |
| FR-CON-06 | System shall generate consent receipt numbers | Implemented | Consent Records (`receiptNumber` field) | Format: CR-{timestamp}-{random}; unique receipt per consent grant | TC-CON-003 |
| FR-CON-07 | System shall support consent revocation | Implemented | Consent Management (`/api/consent-records/:id/revoke`) | Revocation with timestamp recording | TC-CON-004 |
| FR-CON-08 | System shall allow helpdesk to file disputes on behalf of consumers | Implemented | Helpdesk (`helpdesk.tsx`) | Dispute filing from helpdesk interface with borrower context | TC-HD-003 |
| FR-CON-09 | System shall allow helpdesk to grant consent on behalf of consumers | Implemented | Helpdesk (`helpdesk.tsx`) | Consent granting from helpdesk interface with borrower context | TC-HD-004 |

---

## 6. Regulatory Requirements (FR-REG)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-REG-01 | System shall provide regulatory analytics (NPL ratios, portfolio breakdowns) | Implemented | Reports (`reports.tsx`, `/api/reports/regulatory`) | NPL ratios, portfolio breakdowns by institution and loan type, SLA breach tracking | TC-RPT-001, TC-RPT-002 |
| FR-REG-02 | System shall support regulatory user role with appropriate access | Implemented | RBAC (`userRoleEnum`, route middleware) | Regulator role with access to audit logs, billing, approvals, analytics | TC-AUTH-005 |
| FR-REG-03 | System shall enforce maker-checker workflow for data changes | Implemented | Pending Approvals (`pending_approvals` table, `pending-approvals.tsx`) | Four-eye principle: different user must approve; self-approval prevention enforced server-side | TC-MC-001 through TC-MC-004 |

---

## 7. Special Loan Requirements (FR-SPEC)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-SPEC-01 | System shall support interest-free loan products | Implemented | Credit Accounts (`isInterestFree` field) | Boolean flag on credit accounts; interest rate hidden when interest-free | TC-CA-003 |
| FR-SPEC-02 | System shall support grace period tracking | Implemented | Credit Accounts (`gracePeriodMonths` field) | Integer field for grace period in months | TC-CA-003 |
| FR-SPEC-03 | System shall track loan restructuring count | Implemented | Credit Accounts (`restructureCount` field) | Integer counter for number of restructures | TC-CA-004 |
| FR-SPEC-04 | System shall track written-off date | Implemented | Credit Accounts (`writtenOffDate` field) | Date field populated when account status is written_off | TC-CA-004 |
| FR-SPEC-05 | System shall track reinstatement date | Implemented | Credit Accounts (`reinstatedDate` field) | Date field for accounts reinstated after write-off | TC-CA-004 |

---

## 8. Commercial Requirements (FR-COMM)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-COMM-01 | System shall support billing and fee management | Implemented | Billing (`billing_records` table, `billing.tsx`) | Invoice creation with service type, amount, currency, period | TC-BIL-001, TC-BIL-002 |
| FR-COMM-02 | System shall track invoice payment status | Implemented | Billing Records (`billingStatusEnum`) | Status tracking: pending, paid, overdue | TC-BIL-003 |
| FR-COMM-03 | System shall support multiple service types | Implemented | Billing Records (`serviceType` field) | Service types: data_submission, credit_report, api_access, subscription | TC-BIL-001 |
| FR-COMM-04 | System shall support multi-currency billing | Implemented | Billing Records (`currency` field) | 18 supported currencies across 4 jurisdictions | TC-BIL-001 |
| FR-COMM-05 | System shall generate unique invoice numbers | Implemented | Billing (`invoiceNumber` field) | Unique invoice numbers per billing record | TC-BIL-002 |

---

## 9. Data Provider Requirements (FR-DP)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-DP-01 | System shall support institution registration with approval workflow | Implemented | Institutions (`institutions` table, `institutions.tsx`) | Self-registration with admin approval; types: bank, mfi, utility, telecom, digital_lender, sacco | TC-INST-001, TC-INST-002 |
| FR-DP-02 | System shall configure institution submission frequency | Implemented | Institutions (`submissionFrequency` field) | Configurable: monthly (default) | TC-INST-003 |
| FR-DP-03 | System shall track institution status | Implemented | Institutions (`institutionStatusEnum`) | Status: pending, active, suspended | TC-INST-002 |
| FR-DP-04 | System shall require admin approval for institution activation | Implemented | Institutions (`/api/institutions/:id/approve`) | Admin-only approval endpoint with approver and timestamp tracking | TC-INST-002 |

---

## 10. Integration & Reporting Requirements (INT-RPT)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| INT-RPT-01 | System shall support CSV data export | Implemented | Reports (`/api/reports/export?format=csv`) | Portfolio and borrower data CSV export | TC-RPT-003 |
| INT-RPT-02 | System shall provide external REST API for data submission | Implemented | External API (`external-api.ts`) | Full REST API with X-API-Key authentication; borrowers, credit accounts, payment history, court judgments | TC-API-001 through TC-API-005 |
| INT-RPT-03 | System shall support batch API submission | Implemented | External API (`external-api.ts`) | Array-based batch submission for borrowers, credit accounts, payment history | TC-API-004 |
| INT-RPT-04 | System shall provide regulatory analytics reporting | Implemented | Reports (`/api/reports/regulatory`, `reports.tsx`) | NPL ratios, portfolio analytics, SLA breach tracking | TC-RPT-002 |

---

## 11. Data Quality Requirements (DQ)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| DQ-01 | System shall validate data at point of entry | Implemented | Zod Schemas (`schema.ts`), Routes (`routes.ts`) | Schema-based validation on all API endpoints using drizzle-zod | TC-DQ-001 |
| DQ-02 | System shall enforce unique identifiers (national ID, TIN) | Implemented | Database Constraints (`borrowers.nationalId` unique) | Unique constraint on nationalId; database-level enforcement | TC-DQ-002 |
| DQ-03 | System shall provide data quality error reporting | Implemented | Batch Upload (`batch-upload.tsx`) | Per-record validation errors with field-level detail | TC-BATCH-003 |
| DQ-04 | System shall enforce 2 working day SLA for financial disputes | Implemented | Disputes (`createDispute` in `storage.ts`) | Automatic SLA deadline calculation: 2 days for financial correction type | TC-DIS-003 |
| DQ-05 | System shall enforce 5 working day SLA for non-financial disputes | Implemented | Disputes (`createDispute` in `storage.ts`) | Automatic SLA deadline calculation: 5 days for non-financial correction type | TC-DIS-003 |

---

## 12. Non-Functional Security Requirements (NFR-SEC)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| NFR-SEC-01 | System shall implement role-based access control (4 roles) | Implemented | RBAC (`userRoleEnum`, `requireRole` middleware) | 4 roles: admin, regulator, lender, viewer; server-side enforcement on all protected routes | TC-AUTH-005, TC-AUTH-006 |
| NFR-SEC-02 | System shall hash passwords using bcrypt | Implemented | Authentication (`bcryptjs` in `routes.ts`) | bcrypt with salt rounds of 10; password hashing on creation and change | TC-AUTH-001 |
| NFR-SEC-03 | System shall enforce password complexity (8+ chars, uppercase, lowercase, digit, special) | Implemented | Password Change (`/api/auth/change-password`) | Regex validation: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` | TC-AUTH-007 |
| NFR-SEC-04 | System shall lock accounts after 3 failed login attempts | Implemented | Login (`/api/auth/login`) | 3-attempt threshold; 15-minute lockout period; counter reset on successful login | TC-AUTH-002, TC-AUTH-003 |
| NFR-SEC-05 | System shall maintain comprehensive audit logs | Implemented | Audit Logging (`audit_logs` table, `audit-trail.tsx`) | All CRUD operations logged with userId, action, entity, details, IP address, timestamp | TC-AUDIT-001, TC-AUDIT-002 |
| NFR-SEC-06 | System shall track IP addresses in audit logs | Implemented | Audit Logging (`ipAddress` field) | IP captured from `req.ip` on all audited operations | TC-AUDIT-003 |
| NFR-SEC-07 | System shall enforce maker-checker (four-eye principle) | Implemented | Pending Approvals (`routes.ts` self-approval check) | Server-side enforcement: `requestedBy !== reviewedBy`; 403 error on self-approval attempt | TC-MC-004 |
| NFR-SEC-08 | System shall enforce 90-day password expiry | Implemented | Login/Auth (`passwordChangedAt`, `mustChangePassword`) | Password age check on login; forced change dialog when expired | TC-AUTH-008 |
| NFR-SEC-09 | System shall enforce 15-minute idle session timeout | Implemented | Session Middleware (`server/index.ts`) | `IDLE_TIMEOUT_MS = 15 * 60 * 1000`; automatic session destruction; 440 status code returned | TC-AUTH-004 |
| NFR-SEC-10 | SSRF Protection | URL validation and hostname blocking in API test endpoint | server/routes.ts | Blocks private IPs, metadata endpoints | TC-SEC-010 |

---

## 13. Enterprise Enhancement Requirements (ENT)

| SRS Ref | Requirement Description | Status | Module/Component | Implementation Notes | UAT Test Case |
|---------|------------------------|--------|------------------|---------------------|----------------|
| ENT-01 | System shall support TOTP-based Multi-Factor Authentication (MFA) | Implemented | MFA (`mfaSecret`, `mfaEnabled` on `users`; `mfa-setup.tsx`; `/api/auth/mfa/*`) | TOTP via `otpauth` library; setup returns QR URI; verify/disable/login endpoints; login returns `requireMfa` flag when enabled; i18n EN, FR, and PT | TC-ENT-001 through TC-ENT-005 |
| ENT-02 | System shall perform fuzzy entity matching to detect potential duplicate borrowers | Implemented | Fuzzy Matching (`pg_trgm` extension; `fuzzyMatchBorrowers` in `storage.ts`; `/api/borrowers/fuzzy-match`) | PostgreSQL trigram similarity via `pg_trgm`; threshold ≥ 0.3; duplicate warning shown on borrower registration form | TC-ENT-006, TC-ENT-007 |
| ENT-03 | System shall provide a guided chatbot assistant for dispute filing | Implemented | Dispute Chatbot (`dispute-chatbot.tsx`; `helpdesk.tsx`) | Multi-step guided flow: issue type → borrower search → account selection → description → auto-submit; i18n EN, FR, and PT | TC-ENT-008 through TC-ENT-010 |
| ENT-04 | System shall support OAuth 2.1 Bearer token authentication for the external API | Implemented | OAuth 2.1 (`/api/external/oauth/token`; `external-api.ts`; `api-docs.tsx`) | Client credentials grant; JWT Bearer tokens alongside X-API-Key; `jsonwebtoken` library; documented in API docs page | TC-ENT-011 through TC-ENT-013 |
| ENT-05 | System shall implement low-bandwidth optimizations (compression, code-splitting) | Implemented | Performance (`compression` middleware in `server/index.ts`; `React.lazy` in `App.tsx`) | gzip compression for all HTTP responses; lazy-loaded route components with `Suspense` fallback spinner | TC-ENT-014, TC-ENT-015 |
| ENT-06 | System shall support XBRL/XML file format for batch data uploads | Implemented | XBRL Upload (`batch-upload.tsx` XBRL tab; `/api/batch-upload/credit-accounts`) | XBRL/XML parsing in batch upload endpoint; tabbed UI (JSON/CSV and XBRL); sample format provided | TC-ENT-016, TC-ENT-017 |
| ENT-07 | System shall implement tamper-evident audit logs with SHA-256 hash chain | Implemented | Audit Integrity (`previousHash`, `currentHash` on `audit_logs`; `verifyAuditIntegrity` in `storage.ts`; `/api/audit/verify-integrity`; `audit-trail.tsx`) | Each log entry hashed with SHA-256 linking to previous entry; integrity verification endpoint; visual badge on audit trail page | TC-ENT-018 through TC-ENT-020 |
| ENT-08 | Data Retention Enforcement (REQ-RET-01) | Automated archiving/expunging based on jurisdiction-specific policies | server/retention-enforcement.ts, client/src/pages/retention-policies.tsx | 24hr scheduler + manual trigger | TC-RET-001 |
| ENT-09 | Exchange Rate Management Module | Admin CRUD for currency cross-rate pairs with USD routing | client/src/pages/exchange-rates.tsx, server/routes.ts | 18 currencies, converter widget | TC-EXR-001 |
| ENT-10 | API Administration Module | Centralized config for external service endpoints | client/src/pages/api-admin.tsx, server/routes.ts | Weather, judicial, payment gateway | TC-API-ADM-001 |

---

## 14. Summary

| Category | Total Requirements | Implemented | Partial | Not Implemented |
|----------|-------------------|-------------|---------|-----------------|
| FR-COL (Data Collection) | 6 | 6 | 0 | 0 |
| FR-CR (Credit Reporting) | 8 | 8 | 0 | 0 |
| FR-CON (Consent & Disputes) | 9 | 9 | 0 | 0 |
| FR-REG (Regulatory) | 3 | 3 | 0 | 0 |
| FR-SPEC (Special Loans) | 5 | 5 | 0 | 0 |
| FR-COMM (Commercial) | 5 | 5 | 0 | 0 |
| FR-DP (Data Providers) | 4 | 4 | 0 | 0 |
| INT-RPT (Integration & Reporting) | 4 | 4 | 0 | 0 |
| DQ (Data Quality) | 5 | 5 | 0 | 0 |
| NFR-SEC (Security) | 10 | 10 | 0 | 0 |
| ENT (Enterprise Enhancements) | 10 | 10 | 0 | 0 |
| **Total** | **71** | **71** | **0** | **0** |

---

## 14. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| QA Lead | | | |
| Client Representative | | | |
