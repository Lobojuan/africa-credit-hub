# User Acceptance Testing (UAT) Test Document

## Cross-Jurisdictional Central Data Hub & Credit Registry System v1.2

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.2  
**Date:** March 2026  
**Classification:** Confidential

---

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Authentication Module](#2-authentication-module)
3. [Dashboard Module](#3-dashboard-module)
4. [Borrower Management Module](#4-borrower-management-module)
5. [Credit Accounts Module](#5-credit-accounts-module)
6. [Credit Search Module](#6-credit-search-module)
7. [Credit Reports Module](#7-credit-reports-module)
8. [Maker-Checker Workflow Module](#8-maker-checker-workflow-module)
9. [Dispute Management Module](#9-dispute-management-module)
10. [Court Judgments Module](#10-court-judgments-module)
11. [Consent Management Module](#11-consent-management-module)
12. [Institution Management Module](#12-institution-management-module)
13. [Billing Module](#13-billing-module)
14. [Helpdesk Module](#14-helpdesk-module)
15. [Batch Upload Module](#15-batch-upload-module)
16. [Audit Trail Module](#16-audit-trail-module)
17. [User Management Module](#17-user-management-module)
18. [API Keys Module](#18-api-keys-module)
19. [External API Module](#19-external-api-module)
20. [Reports & Export Module](#20-reports--export-module)
21. [Notifications Module](#21-notifications-module)
22. [Internationalization (i18n) Module](#22-internationalization-i18n-module)
23. [Theme Module](#23-theme-module)
24. [Sign-Off](#24-sign-off)
25. [Enterprise Enhancement: MFA Module (ENT-01)](#25-enterprise-enhancement-mfa-module-ent-01)
26. [Enterprise Enhancement: Fuzzy Entity Matching Module (ENT-02)](#26-enterprise-enhancement-fuzzy-entity-matching-module-ent-02)
27. [Enterprise Enhancement: Dispute Chatbot Module (ENT-03)](#27-enterprise-enhancement-dispute-chatbot-module-ent-03)
28. [Enterprise Enhancement: OAuth 2.1 Module (ENT-04)](#28-enterprise-enhancement-oauth-21-module-ent-04)
29. [Enterprise Enhancement: Low-Bandwidth Optimizations Module (ENT-05)](#29-enterprise-enhancement-low-bandwidth-optimizations-module-ent-05)
30. [Enterprise Enhancement: XBRL Upload Module (ENT-06)](#30-enterprise-enhancement-xbrl-upload-module-ent-06)
31. [Enterprise Enhancement: Tamper-Evident Audit Logs Module (ENT-07)](#31-enterprise-enhancement-tamper-evident-audit-logs-module-ent-07)
32. [Exchange Rate Management Module](#32-exchange-rate-management-module)
33. [API Administration Module](#33-api-administration-module)
34. [Data Retention Policies Module](#34-data-retention-policies-module)
35. [Global Search Module](#35-global-search-module)
36. [ID Photos & Document Upload Module](#36-id-photos--document-upload-module)
37. [Demo Environment Module](#37-demo-environment-module)
38. [Language Switcher on Login Module](#38-language-switcher-on-login-module)
39. [Dashboard Visual Analytics Module (ENT-14)](#39-dashboard-visual-analytics-module-ent-14)
40. [Interactive Demo Tour Module (ENT-15)](#40-interactive-demo-tour-module-ent-15)
41. [AI Features Module](#41-ai-features-module)
42. [Enhanced Features Module](#42-enhanced-features-module)

---

## 1. Test Environment Setup

### 1.1 System Information

| Item | Detail |
|------|--------|
| Application | Cross-Jurisdictional Central Data Hub & Credit Registry System v1.2 |
| Database | PostgreSQL with 21 tables |
| User Roles | Admin, Regulator, Lender, Viewer |
| Supported Currencies | 42+ African currencies plus USD, EUR, GBP |
| Enterprise Enhancements | MFA, Fuzzy Matching, Dispute Chatbot, OAuth 2.1, Low-Bandwidth, XBRL Upload, Tamper-Evident Audit, Exchange Rate Management, API Administration, Data Retention Policies, Global Search, ID Photos & Documents, Demo Environment, Dashboard Visual Analytics, Interactive Demo Tour, AI Credit Risk Analysis, AI Report Summary, AI Smart Chatbot, AI Compliance Reports, Excel Export, Real-time Notifications, API Usage Analytics, Dashboard Sparkline Trends, Audit Trail Enhancements, Multi-language PDF Reports |
| Jurisdictions | All 54 African countries |
| Languages | English, French, Portuguese |
| Seed Data | 102K+ borrowers, 172K+ credit accounts, 120K payment history records, 3,218 disputes, 2,147 court judgments |

### 1.2 Seed Credentials

| Username | Password | Role | Institution |
|----------|----------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Regulator | NBE |
| cbe_user | cbe123 | Lender | CBE |
| dashen_user | dashen123 | Lender | Dashen |
| awash_user | awash123 | Lender | Awash |

### 1.3 Role Access Matrix

| Feature | Admin | Regulator | Lender | Viewer |
|---------|-------|-----------|--------|--------|
| User Management | Yes | No | No | No |
| Institution Management | Yes | No | No | No |
| API Key Management | Yes | No | No | No |
| Billing | Yes | Yes | No | No |
| Audit Trail | Yes | Yes | No | No |
| Approve/Reject Changes | Yes | Yes | No | No |
| Court Judgments (create) | Yes | Yes | No | No |
| Batch Upload | Yes | No | Yes | No |
| Borrowers/Accounts | Yes | Yes | Yes | Yes |
| Disputes | Yes | Yes | Yes | Yes |
| Consent | Yes | Yes | Yes | Yes |
| Dashboard/Reports | Yes | Yes | Yes | Yes |
| Helpdesk | Yes | Yes | Yes | Yes |

### 1.4 Test Environment Prerequisites

- Application deployed and accessible via browser
- PostgreSQL database seeded with test data
- All seed user accounts active and not locked
- Network connectivity to the application URL
- Modern browser (Chrome, Firefox, Edge, or Safari)

---

## 2. Authentication Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AUTH-001 | Authentication | Successful login with valid credentials | Application is accessible, user account is active | 1. Navigate to login page. 2. Enter username: `admin`. 3. Enter password: `admin123`. 4. Click "Login" button. | User is authenticated and redirected to the Dashboard page. Session is established. | | NFR-SEC-01 |
| TC-AUTH-002 | Authentication | Login failure with invalid password | Application is accessible, admin account is active | 1. Navigate to login page. 2. Enter username: `admin`. 3. Enter password: `wrongpassword`. 4. Click "Login". | Error message displayed: "Invalid credentials. 2 attempt(s) remaining." Login fails. | | NFR-SEC-01 |
| TC-AUTH-003 | Authentication | Login failure with non-existent username | Application is accessible | 1. Navigate to login page. 2. Enter username: `nonexistent_user`. 3. Enter password: `any_pass`. 4. Click "Login". | Error message displayed: "Invalid credentials." Login fails. | | NFR-SEC-01 |
| TC-AUTH-004 | Authentication | Account lockout after 3 failed attempts | Admin account is active, no prior failed attempts | 1. Navigate to login page. 2. Enter username: `admin`, wrong password. Click "Login". 3. Repeat step 2 two more times (3 total failures). | After 3rd failure, message: "Account locked for 15 minutes after 3 failed attempts." Account is locked. | | NFR-SEC-03 |
| TC-AUTH-005 | Authentication | Login attempt on locked account | Admin account is locked (from TC-AUTH-004) | 1. Navigate to login page. 2. Enter username: `admin`, correct password: `admin123`. 3. Click "Login". | Error message displayed: "Account locked. Try again in X minute(s)." Login denied. | | NFR-SEC-03 |
| TC-AUTH-006 | Authentication | Login with suspended account | A user account status is set to "suspended" | 1. Navigate to login page. 2. Enter suspended user credentials. 3. Click "Login". | Error message: "Account is suspended." Login denied. | | NFR-SEC-02 |
| TC-AUTH-007 | Authentication | Login with deactivated account | A user account status is set to "deactivated" | 1. Navigate to login page. 2. Enter deactivated user credentials. 3. Click "Login". | Error message: "Account is deactivated." Login denied. | | NFR-SEC-02 |
| TC-AUTH-008 | Authentication | Password policy enforcement - too short | User is on password change dialog | 1. Log in. 2. Open password change dialog. 3. Enter current password. 4. Enter new password: `Abc1!` (too short). 5. Click "Change Password". | Error message: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character." | | NFR-SEC-04 |
| TC-AUTH-009 | Authentication | Password policy enforcement - missing uppercase | User is on password change dialog | 1. Enter current password. 2. Enter new password: `abcdefg1!` (no uppercase). 3. Click "Change Password". | Error message about password complexity requirements. | | NFR-SEC-04 |
| TC-AUTH-010 | Authentication | Password policy enforcement - missing special char | User is on password change dialog | 1. Enter current password. 2. Enter new password: `Abcdefg1` (no special character). 3. Click "Change Password". | Error message about password complexity requirements. | | NFR-SEC-04 |
| TC-AUTH-011 | Authentication | Successful password change | User is logged in | 1. Open password change dialog. 2. Enter current password correctly. 3. Enter new password meeting all requirements (e.g., `NewPass1!`). 4. Click "Change Password". | Success message. Password is updated. Audit log entry created for PASSWORD_CHANGE. | | NFR-SEC-04 |
| TC-AUTH-012 | Authentication | Session timeout after 15 minutes of inactivity | User is logged in | 1. Log in successfully. 2. Do not interact with the application for 15+ minutes. 3. Attempt any action (e.g., navigate to a page). | User is automatically logged out. Redirected to login page. | | NFR-SEC-09 |
| TC-AUTH-013 | Authentication | Successful logout | User is logged in | 1. Click the logout button/link. | User session is destroyed. Redirected to login page. Audit log entry for LOGOUT created. | | NFR-SEC-01 |
| TC-AUTH-014 | Authentication | Password expiry notification (90-day policy) | User has password older than 90 days (passwordChangedAt > 90 days ago) | 1. Log in with the affected user. | Login succeeds. passwordExpired flag returned as true. Password change prompt shown. | | NFR-SEC-04 |
| TC-AUTH-015 | Authentication | Must change password on first login | User account has mustChangePassword = true | 1. Log in with the affected user. | Login succeeds but passwordExpired flag is true. User is prompted to change password. | | NFR-SEC-04 |
| TC-AUTH-016 | Authentication | Missing credentials validation | Application is accessible | 1. Navigate to login page. 2. Leave username and password fields empty. 3. Click "Login". | Error message: "Username and password required." | | NFR-SEC-01 |

---

## 3. Dashboard Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DASH-001 | Dashboard | Display 8 stat cards on dashboard | User is logged in | 1. Navigate to Dashboard (`/`). 2. Observe the stat cards displayed. | 8 stat cards visible: Total Borrowers, Credit Accounts, Outstanding, Delinquent, Defaults, Inquiries, Pending Approvals, Open Disputes. Each shows a numeric value. | | FR-REG-01 |
| TC-DASH-002 | Dashboard | Stat card - Total Borrowers drill-down | User is logged in, on Dashboard | 1. Click the "Total Borrowers" stat card. | A detail drawer/sheet opens showing a list of borrowers. | | FR-REG-01 |
| TC-DASH-003 | Dashboard | Stat card - Credit Accounts drill-down | User is logged in, on Dashboard | 1. Click the "Credit Accounts" stat card. | A detail drawer/sheet opens showing credit account data. | | FR-REG-01 |
| TC-DASH-004 | Dashboard | Stat card - Outstanding drill-down | User is logged in, on Dashboard | 1. Click the "Outstanding" stat card. | A detail drawer/sheet opens showing outstanding balance data. | | FR-REG-01 |
| TC-DASH-005 | Dashboard | Stat card - Delinquent drill-down | User is logged in, on Dashboard | 1. Click the "Delinquent" stat card. | A detail drawer/sheet opens showing delinquent accounts. | | FR-REG-02 |
| TC-DASH-006 | Dashboard | Stat card - Defaults drill-down | User is logged in, on Dashboard | 1. Click the "Defaults" stat card. | A detail drawer/sheet opens showing defaulted accounts. | | FR-REG-02 |
| TC-DASH-007 | Dashboard | Stat card - Inquiries drill-down | User is logged in, on Dashboard | 1. Click the "Inquiries" stat card. | A detail drawer/sheet opens showing recent credit inquiries. | | FR-CR-01 |
| TC-DASH-008 | Dashboard | Stat card - Pending Approvals drill-down | User is logged in, on Dashboard | 1. Click the "Pending Approvals" stat card. | A detail drawer/sheet opens showing pending approval items. | | FR-COL-01 |
| TC-DASH-009 | Dashboard | Stat card - Open Disputes drill-down | User is logged in, on Dashboard | 1. Click the "Open Disputes" stat card. | A detail drawer/sheet opens showing open disputes. | | FR-CON-04 |
| TC-DASH-010 | Dashboard | Detail drawer list items navigate to detail pages | User is logged in, drill-down drawer is open | 1. Click on a borrower item in the Total Borrowers detail drawer. | Navigates to the borrower detail page (`/borrowers/:id`). | | FR-COL-01 |
| TC-DASH-011 | Dashboard | Recent activity section | User is logged in, on Dashboard | 1. Observe the recent activity section on the Dashboard. | Recent system activity is displayed with timestamps and descriptions. | | FR-REG-01 |

---

## 4. Borrower Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BOR-001 | Borrower Management | Register individual borrower | User is logged in with create permissions | 1. Navigate to Borrowers page (`/borrowers`). 2. Click "Add Borrower" or equivalent. 3. Select type: Individual. 4. Fill in: First Name, Last Name, National ID, Date of Birth, Gender, Phone, Email, Address, City, Region, TIN Number. 5. Submit. | Borrower registration submitted for maker-checker approval. Success message displayed. Audit log entry created. | | FR-COL-01 |
| TC-BOR-002 | Borrower Management | Register corporate borrower | User is logged in with create permissions | 1. Navigate to Borrowers page. 2. Click "Add Borrower". 3. Select type: Corporate. 4. Fill in: Company Name, Business Reg Number, National ID, Sector, Contact Email, Contact Phone, Address, TIN Number. 5. Submit. | Corporate borrower registration submitted for maker-checker approval. Success message displayed. | | FR-COL-01 |
| TC-BOR-003 | Borrower Management | Search borrowers by name | User is logged in, borrower data exists | 1. Navigate to Borrowers page. 2. Enter a borrower name in the search field. 3. Press Enter or click Search. | Matching borrowers displayed in the results table. | | FR-COL-02 |
| TC-BOR-004 | Borrower Management | Search borrowers by National ID | User is logged in, borrower data exists | 1. Navigate to Borrowers page. 2. Enter a National ID in the search field. 3. Search. | Matching borrower(s) displayed. | | FR-COL-02 |
| TC-BOR-005 | Borrower Management | PEP flagging on borrower | User is logged in with create permissions | 1. Navigate to Add Borrower form. 2. Fill required fields. 3. Toggle "Politically Exposed Person" (PEP) flag to ON. 4. Enter PEP details. 5. Submit. | Borrower is submitted with isPep = true and pepDetails populated. Visible PEP indicator on borrower record. | | FR-COL-03 |
| TC-BOR-006 | Borrower Management | View borrower detail page | User is logged in, borrower exists | 1. Navigate to Borrowers page. 2. Click on a borrower row to navigate to detail. | Borrower detail page (`/borrowers/:id`) loads with full borrower information: personal/company data, credit accounts, inquiries, court judgments, consent records. | | FR-COL-01 |
| TC-BOR-007 | Borrower Management | Related party linking | User is logged in with create permissions | 1. Navigate to Add Borrower form. 2. Fill required fields. 3. Set Related Borrower ID and Relationship Type (one of 7 types: Spouse, Guarantor, Director, Shareholder, Beneficial Owner, Subsidiary, Parent Company). 4. Submit. | Borrower created with relatedBorrowerId and relationshipType populated. Related parties visible on borrower detail. All 7 relationship types available in dropdown. | | FR-COL-04 |
| TC-BOR-008 | Borrower Management | Borrower update triggers maker-checker | User is logged in | 1. Navigate to borrower detail page. 2. Edit a field (e.g., phone number). 3. Submit update. | Update submitted for maker-checker approval (pending_approvals record created with action: UPDATE). User sees confirmation message. | | FR-COL-01 |
| TC-BOR-009 | Borrower Management | Duplicate National ID prevention | User is logged in | 1. Navigate to Add Borrower. 2. Enter a National ID that already exists in the system. 3. Submit. | Error message indicating duplicate National ID. Registration rejected. | | FR-COL-01 |
| TC-BOR-010 | Borrower Management | Pagination on borrower list | User is logged in, many borrowers exist | 1. Navigate to Borrowers page. 2. Observe pagination controls. 3. Navigate to page 2. | Page loads next set of borrowers. Pagination controls show correct page numbers. | | FR-COL-02 |
| TC-BOR-011 | Borrower Management | Education and employment fields | User is logged in | 1. Navigate to Add Borrower. 2. Fill Education Level, Education Institution, Employment History. 3. Submit. | Borrower submitted with education and employment data preserved. | | FR-COL-01 |
| TC-BOR-012 | Borrower Management | View related borrowers | User is logged in, borrower has related parties | 1. Navigate to borrower detail page for a borrower with relatedBorrowerId set. 2. Observe related party section. | Related borrowers are displayed with their relationship type. | | FR-COL-04 |

---

## 5. Credit Accounts Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CA-001 | Credit Accounts | Create a credit account | User is logged in, borrower exists | 1. Navigate to Credit Accounts page (`/credit-accounts`). 2. Click "Add Credit Account". 3. Fill: Borrower ID, Lender Institution, Account Number, Account Type, Original Amount, Current Balance, Currency, Interest Rate, Disbursement Date, Maturity Date. 4. Submit. | Credit account creation submitted for maker-checker approval. Success message. | | FR-CR-01 |
| TC-CA-002 | Credit Accounts | Multi-currency support (ETB) | User is logged in | 1. Create a credit account. 2. Select currency: ETB. 3. Submit. | Account created with currency = ETB. Amounts displayed in Ethiopian Birr format. | | FR-CR-02 |
| TC-CA-003 | Credit Accounts | Multi-currency support (GHS) | User is logged in | 1. Create a credit account. 2. Select currency: GHS. 3. Submit. | Account created with currency = GHS. Amounts displayed in Ghanaian Cedi format. | | FR-CR-02 |
| TC-CA-004 | Credit Accounts | Multi-currency support (UGX) | User is logged in | 1. Create a credit account. 2. Select currency: UGX. 3. Submit. | Account created with currency = UGX. Amounts displayed in Ugandan Shilling format. | | FR-CR-02 |
| TC-CA-005 | Credit Accounts | Multi-currency support (LRD) | User is logged in | 1. Create a credit account. 2. Select currency: LRD. 3. Submit. | Account created with currency = LRD. Amounts displayed in Liberian Dollar format. | | FR-CR-02 |
| TC-CA-006 | Credit Accounts | Interest-free loan flag | User is logged in | 1. Create a credit account. 2. Toggle "Interest Free" to true. 3. Submit. | Account created with isInterestFree = true. Interest rate field may be disabled/hidden. | | FR-SPEC-03 |
| TC-CA-007 | Credit Accounts | Grace period configuration | User is logged in | 1. Create a credit account. 2. Set Grace Period Months to 6. 3. Submit. | Account created with gracePeriodMonths = 6. | | FR-SPEC-04 |
| TC-CA-008 | Credit Accounts | Restructure count tracking | User is logged in | 1. Create a credit account. 2. Set Restructure Count to 2. 3. Submit. | Account created with restructureCount = 2. | | FR-SPEC-05 |
| TC-CA-009 | Credit Accounts | Account status values | User is logged in, accounts with various statuses exist | 1. Navigate to Credit Accounts page. 2. Observe accounts with different statuses. | Statuses correctly displayed: current, delinquent, default, closed, restructured, written_off. Each status visually distinguishable. | | FR-CR-01 |
| TC-CA-010 | Credit Accounts | View payment history (12-period grid) | User is logged in, credit account with payment history exists | 1. Navigate to borrower detail page. 2. View a credit account. 3. Expand payment history. | 12-period payment history grid displayed showing period, amount due, amount paid, status (on_time/late/missed/partial), and days late. | | FR-CR-08 |
| TC-CA-011 | Credit Accounts | Collateral information | User is logged in | 1. Create a credit account. 2. Set Collateral Type (e.g., "Property") and Collateral Value. 3. Submit. | Account created with collateral type and value stored. | | FR-CR-01 |
| TC-CA-012 | Credit Accounts | Written-off date tracking | User is logged in | 1. Create a credit account with status = written_off. 2. Set Written Off Date. 3. Submit. | Account created with writtenOffDate populated. | | FR-CR-01 |
| TC-CA-013 | Credit Accounts | Reinstated date tracking | User is logged in | 1. Create a credit account. 2. Set Reinstated Date. 3. Submit. | Account created with reinstatedDate populated. | | FR-CR-01 |
| TC-CA-014 | Credit Accounts | Credit account update triggers maker-checker | User is logged in, credit account exists | 1. Navigate to a credit account. 2. Edit a field. 3. Submit update. | Update submitted for maker-checker approval. | | FR-COL-01 |
| TC-CA-015 | Credit Accounts | Filter accounts by borrower | User is logged in, borrower has credit accounts | 1. Navigate to Credit Accounts with borrowerId filter. | Only credit accounts for the specified borrower are shown. | | FR-CR-01 |

---

## 6. Credit Search Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CS-001 | Credit Search | Single borrower credit search | User is logged in, borrower exists | 1. Navigate to Credit Search page (`/search`). 2. Enter a borrower identifier (National ID or name). 3. Select inquiry purpose (e.g., "new_credit"). 4. Check consent provided. 5. Click "Search". | Credit inquiry created. Search results displayed with borrower information and credit summary. Audit log entry created. | | FR-CR-01 |
| TC-CS-002 | Credit Search | Bulk credit search (multiple IDs) | User is logged in, multiple borrowers exist | 1. Navigate to Credit Search page. 2. Use bulk search feature. 3. Enter multiple borrower identifiers. 4. Submit. | Bulk credit search performed. Results returned for all matched borrowers. | | FR-CR-03 |
| TC-CS-003 | Credit Search | Credit search with no results | User is logged in | 1. Navigate to Credit Search page. 2. Enter a non-existent borrower identifier. 3. Search. | Appropriate "No results found" message displayed. | | FR-CR-01 |
| TC-CS-004 | Credit Search | Consent tracking on inquiry | User is logged in | 1. Perform a credit search. 2. Mark consent as provided. 3. Submit. | Credit inquiry record created with consentProvided = true. | | FR-CON-01 |
| TC-CS-005 | Credit Search | Navigate to credit report from search results | User is logged in, search completed with results | 1. Perform a credit search. 2. Click on a result to view credit report. | Navigates to credit report page (`/credit-report/:borrowerId`). | | FR-CR-06 |

---

## 7. Credit Reports Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RPT-001 | Credit Reports | Generate credit report | User is logged in, borrower with accounts exists | 1. Navigate to Credit Report page (`/credit-report/:borrowerId`). 2. Select purpose. 3. Generate report. | Credit report generated with: borrower info, credit accounts, credit score (300-850), reason codes, serial number (CR-{YEAR}-{ID}), inquiry history. | | FR-CR-06 |
| TC-RPT-002 | Credit Reports | Credit score calculation (300-850 range) | Borrower has mixed account statuses | 1. Generate a credit report for a borrower with delinquent and current accounts. | Credit score is within 300-850 range. Score reflects account health (delinquent accounts reduce score). | | FR-CR-06 |
| TC-RPT-003 | Credit Reports | Reason codes on credit report | Borrower has delinquent accounts | 1. Generate credit report for borrower with delinquent accounts. | Reason code "DELINQUENT_ACCOUNTS" appears in the report. | | FR-CR-06 |
| TC-RPT-004 | Credit Reports | Reason codes - written off accounts | Borrower has written-off accounts | 1. Generate credit report. | Reason code "WRITTEN_OFF_ACCOUNTS" appears. | | FR-CR-06 |
| TC-RPT-005 | Credit Reports | Reason codes - restructured accounts | Borrower has restructured accounts | 1. Generate credit report. | Reason code "RESTRUCTURED_ACCOUNTS" appears. | | FR-CR-06 |
| TC-RPT-006 | Credit Reports | Reason codes - high inquiry volume | Borrower has many recent inquiries | 1. Generate credit report. | Reason code "HIGH_INQUIRY_VOLUME" appears. | | FR-CR-06 |
| TC-RPT-007 | Credit Reports | Reason codes - court judgments present | Borrower has active court judgments | 1. Generate credit report. | Reason code "COURT_JUDGMENTS_PRESENT" appears. | | FR-CR-06 |
| TC-RPT-008 | Credit Reports | Reason codes - excellent payment record | Borrower has all current accounts | 1. Generate credit report for borrower with only "current" status accounts. | Reason code "EXCELLENT_PAYMENT_RECORD" or "STRONG_REPAYMENT_HISTORY" appears. High credit score. | | FR-CR-06 |
| TC-RPT-009 | Credit Reports | Serial number generation | User generates a credit report | 1. Generate a credit report. 2. Note the serial number. | Serial number follows format: CR-{YEAR}-{UNIQUE_ID}. Serial number is unique. Entry created in credit_report_logs table. | | FR-CR-06 |
| TC-RPT-010 | Credit Reports | Print credit report | Credit report is displayed | 1. Generate a credit report. 2. Click "Print" button. | Browser print dialog opens. Report is formatted for printing with header, borrower info, accounts, score, serial number, and footer disclaimer. | | FR-CR-06 |
| TC-RPT-011 | Credit Reports | Credit report includes payment history | Borrower has accounts with payment history | 1. Generate credit report. | Payment performance history section displayed in the report. | | FR-CR-08 |
| TC-RPT-012 | Credit Reports | Credit report includes court judgments | Borrower has court judgments | 1. Generate credit report. | Court judgments section displayed with case details. | | FR-COL-05 |
| TC-RPT-013 | Credit Reports | Credit report includes consent records | Borrower has consent records | 1. Generate credit report. | Consent records section displayed in the report. | | FR-CON-06 |
| TC-RPT-014 | Credit Reports | Credit report log tracking | User generates credit report | 1. Generate a credit report. 2. Navigate to credit report logs. | Entry exists in credit_report_logs with borrowerId, requestedBy, institution, purpose, serialNumber, and timestamp. | | FR-CR-06 |

---

## 8. Maker-Checker Workflow Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-MC-001 | Maker-Checker | Submit borrower for approval | User is logged in (Lender role) | 1. Navigate to Borrowers. 2. Submit a new borrower. | Pending approval record created with status = "pending", entityType = "borrower", action = "CREATE". Notifications sent to admin/regulator users. | | FR-COL-01 |
| TC-MC-002 | Maker-Checker | View pending approvals | User is logged in (Admin/Regulator) | 1. Navigate to Pending Approvals page (`/approvals`). | List of pending approval requests displayed with entity type, action, requester, and submission date. | | FR-COL-01 |
| TC-MC-003 | Maker-Checker | Approve a pending request | Admin/Regulator logged in, pending approval exists from different user | 1. Navigate to Pending Approvals. 2. Select a pending request. 3. Click "Approve". 4. Optionally add review notes. 5. Confirm. | Approval status changes to "approved". Underlying entity (borrower/credit account) is created/updated. Notification sent to requester. Audit log entry created. | | FR-COL-01 |
| TC-MC-004 | Maker-Checker | Reject a pending request | Admin/Regulator logged in, pending approval exists from different user | 1. Navigate to Pending Approvals. 2. Select a pending request. 3. Click "Reject". 4. Add rejection notes. 5. Confirm. | Approval status changes to "rejected". Underlying entity is NOT created/updated. Notification sent to requester with rejection reason. Audit log entry created. | | FR-COL-01 |
| TC-MC-005 | Maker-Checker | Self-approval prevention | Admin logged in, pending approval was submitted by the same admin | 1. Navigate to Pending Approvals. 2. Attempt to approve own request. | Error message: "Maker-checker: You cannot approve your own request. A different authorized user must review." Approval blocked. | | FR-COL-01 |
| TC-MC-006 | Maker-Checker | Already reviewed request handling | Admin logged in, approval already processed | 1. Navigate to Pending Approvals. 2. Attempt to approve/reject an already reviewed request. | Error message: "This request has already been reviewed." | | FR-COL-01 |
| TC-MC-007 | Maker-Checker | Insufficient role for approval | Lender user logged in | 1. Attempt to approve a pending request via API. | 403 Forbidden: "Insufficient permissions." | | FR-COL-01 |
| TC-MC-008 | Maker-Checker | Credit account submission triggers approval | User is logged in | 1. Submit a new credit account. | Pending approval created with entityType = "credit_account". | | FR-COL-01 |

---

## 9. Dispute Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DIS-001 | Disputes | File a financial dispute | User is logged in, borrower and credit account exist | 1. Navigate to Disputes page (`/disputes`). 2. Click "File Dispute". 3. Select borrower. 4. Select credit account. 5. Set dispute type (e.g., "incorrect_balance"). 6. Enter description. 7. Set correction type: "financial". 8. Submit. | Dispute created with status = "open". SLA deadline set to 2 working days from creation. Audit log entry. Notification sent to admin. | | FR-CON-04, DQ-04 |
| TC-DIS-002 | Disputes | File a non-financial dispute | User is logged in, borrower exists | 1. Navigate to Disputes. 2. File a dispute with correction type: "non_financial". 3. Submit. | Dispute created. SLA deadline set to 5 working days from creation. | | FR-CON-04, DQ-05 |
| TC-DIS-003 | Disputes | SLA tracking - financial (2-day) | Financial dispute exists | 1. View the dispute. 2. Check SLA deadline field. | SLA deadline is 2 working days from dispute creation date. Visual indicator if approaching/past deadline. | | DQ-04 |
| TC-DIS-004 | Disputes | SLA tracking - non-financial (5-day) | Non-financial dispute exists | 1. View the dispute. 2. Check SLA deadline field. | SLA deadline is 5 working days from dispute creation date. | | DQ-05 |
| TC-DIS-005 | Disputes | Resolve a dispute | Admin/Regulator logged in, open dispute exists | 1. Navigate to Disputes. 2. Select an open dispute. 3. Click "Resolve". 4. Enter resolution text. 5. Submit. | Dispute status changes to "resolved". Resolution text saved. resolvedAt timestamp recorded. Audit log entry. | | FR-CON-04 |
| TC-DIS-006 | Disputes | View dispute history | User is logged in | 1. Navigate to Disputes page. 2. View list of all disputes. | All disputes listed with: borrower, dispute type, status, correction type, SLA deadline, creation date. | | FR-CON-04 |
| TC-DIS-007 | Disputes | Dispute status progression | Dispute exists | 1. Verify dispute starts as "open". 2. Update to "under_review". 3. Resolve dispute. | Status transitions: open -> under_review -> resolved (or rejected). | | FR-CON-04 |
| TC-DIS-008 | Disputes | View individual dispute details | Dispute exists | 1. Click on a dispute row. | Dispute detail dialog opens showing all fields: borrower, account, type, description, status, correction type, SLA deadline, resolution, timestamps. | | FR-CON-04 |

---

## 10. Court Judgments Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CJ-001 | Court Judgments | Create a lien judgment | Admin/Regulator logged in, borrower exists | 1. Navigate to borrower detail or Court Judgments section. 2. Click "Add Court Judgment". 3. Fill: Borrower ID, Case Number, Court name, Judgment Type: "lien", Amount, Currency, Judgment Date, Description. 4. Submit. | Court judgment created with type = "lien", status = "active". Audit log entry created. | | FR-COL-05 |
| TC-CJ-002 | Court Judgments | Create a bankruptcy judgment | Admin/Regulator logged in | 1. Add court judgment with type: "bankruptcy". | Court judgment created with type = "bankruptcy". | | FR-COL-05 |
| TC-CJ-003 | Court Judgments | Create a lawsuit judgment | Admin/Regulator logged in | 1. Add court judgment with type: "lawsuit". | Court judgment created with type = "lawsuit". | | FR-COL-05 |
| TC-CJ-004 | Court Judgments | Create a civil judgment | Admin/Regulator logged in | 1. Add court judgment with type: "civil_judgment". | Court judgment created. | | FR-COL-05 |
| TC-CJ-005 | Court Judgments | Create a criminal conviction | Admin/Regulator logged in | 1. Add court judgment with type: "criminal_conviction". | Court judgment created. | | FR-COL-05 |
| TC-CJ-006 | Court Judgments | Judgment status tracking | Court judgment exists | 1. View judgment. 2. Verify status options. | Status can be: active, resolved, or appealed. | | FR-COL-05 |
| TC-CJ-007 | Court Judgments | View judgments by borrower | Borrower has court judgments | 1. Navigate to borrower detail page. 2. View court judgments section. | All court judgments for the borrower displayed with case number, court, type, amount, currency, date, status, description. | | FR-COL-05 |
| TC-CJ-008 | Court Judgments | Filter judgments by borrower ID | Court judgments exist | 1. Query court judgments API with ?borrowerId filter. | Only judgments for the specified borrower returned. | | FR-COL-05 |

---

## 11. Consent Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CON-001 | Consent Management | Grant consent | User is logged in, borrower exists | 1. Navigate to Consent Management page (`/consent`). 2. Click "Grant Consent". 3. Select borrower. 4. Enter "Granted To" institution. 5. Select purpose. 6. Select consent type. 7. Submit. | Consent record created with status = "active". Receipt number generated in format CR-{timestamp}-{random}. | | FR-CON-06 |
| TC-CON-002 | Consent Management | Receipt number generation | Consent record created | 1. Create a consent record. 2. Note the receipt number. | Receipt number is unique and follows format CR-{timestamp}-{random}. | | FR-CON-07 |
| TC-CON-003 | Consent Management | Revoke consent | Active consent record exists | 1. Navigate to Consent Management. 2. Find active consent. 3. Click "Revoke". | Consent status changes to "revoked". revokedAt timestamp set. Audit log entry created. | | FR-CON-06 |
| TC-CON-004 | Consent Management | View consent records | Consent records exist | 1. Navigate to Consent Management page. | All consent records displayed with: borrower, granted to, purpose, consent type, status, receipt number, granted date, revoked date. | | FR-CON-06 |
| TC-CON-005 | Consent Management | Filter consent by borrower | Borrower has consent records | 1. Query consent records with ?borrowerId filter. | Only consent records for the specified borrower returned. | | FR-CON-06 |
| TC-CON-006 | Consent Management | View consent on borrower detail | Borrower has consent records | 1. Navigate to borrower detail page. 2. View consent section. | Consent records for the borrower displayed. | | FR-CON-06 |
| TC-CON-007 | Consent Management | Prevent duplicate active consent | Active consent exists for same borrower + grantedTo + purpose | 1. Attempt to create duplicate consent. | System handles appropriately (either prevents or allows multiple). | | FR-CON-08 |
| TC-CON-008 | Consent Management | Navigate from consent to borrower | Consent record displayed in table | 1. Click on a consent record row. | Navigates to the associated borrower detail page. | | FR-CON-09 |

---

## 12. Institution Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-INST-001 | Institutions | Register a bank institution | Admin is logged in | 1. Navigate to Institutions page (`/institutions`). 2. Click "Add Institution". 3. Fill: Name, Type: "bank", Registration Number, Country, Contact Email, Contact Phone, Address. 4. Submit. | Institution created with status = "pending". | | FR-DP-01 |
| TC-INST-002 | Institutions | Register MFI institution | Admin is logged in | 1. Add institution with type: "mfi". | Institution created. | | FR-DP-01 |
| TC-INST-003 | Institutions | Register utility institution | Admin is logged in | 1. Add institution with type: "utility". | Institution created. | | FR-DP-01 |
| TC-INST-004 | Institutions | Register telecom institution | Admin is logged in | 1. Add institution with type: "telecom". | Institution created. | | FR-DP-01 |
| TC-INST-005 | Institutions | Register digital lender | Admin is logged in | 1. Add institution with type: "digital_lender". | Institution created. | | FR-DP-01 |
| TC-INST-006 | Institutions | Register SACCO | Admin is logged in | 1. Add institution with type: "sacco". | Institution created. | | FR-DP-01 |
| TC-INST-007 | Institutions | Approve institution | Admin is logged in, pending institution exists | 1. Navigate to Institutions. 2. Select a pending institution. 3. Click "Approve". | Institution status changes to "active". approvedBy and approvedAt fields populated. | | FR-DP-04 |
| TC-INST-008 | Institutions | Configure submission frequency | Admin is logged in, active institution exists | 1. Navigate to institution detail. 2. Set submission frequency (e.g., "monthly", "weekly"). 3. Save. | Submission frequency updated. | | FR-DP-01 |
| TC-INST-009 | Institutions | Multi-country support | Admin is logged in | 1. Create institutions with different countries: Ethiopia, Ghana, Uganda, Liberia. | Institutions created with correct country assignments. | | FR-DP-01 |
| TC-INST-010 | Institutions | Institution pagination | Many institutions exist | 1. Navigate to Institutions page. 2. Observe pagination. | Server-side pagination working. Page/limit controls functional. | | FR-DP-01 |
| TC-INST-011 | Institutions | Clickable institution rows | Institutions listed in table | 1. Click on an institution row. | Institution detail dialog opens showing all institution information. | | FR-DP-01 |

---

## 13. Billing Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BIL-001 | Billing | Create an invoice - data submission | Admin/Regulator logged in | 1. Navigate to Billing page (`/billing`). 2. Click "Create Invoice". 3. Fill: Institution Name, Service Type: "data_submission", Amount, Currency, Period Start, Period End. 4. Submit. | Billing record created with unique invoice number, status = "pending". | | FR-COMM-01 |
| TC-BIL-002 | Billing | Create an invoice - credit report | Admin/Regulator logged in | 1. Create invoice with service type: "credit_report". | Billing record created. | | FR-COMM-01 |
| TC-BIL-003 | Billing | Create an invoice - API access | Admin/Regulator logged in | 1. Create invoice with service type: "api_access". | Billing record created. | | FR-COMM-01 |
| TC-BIL-004 | Billing | Create an invoice - subscription | Admin/Regulator logged in | 1. Create invoice with service type: "subscription". | Billing record created. | | FR-COMM-01 |
| TC-BIL-005 | Billing | Track payment status | Billing records exist | 1. View billing records. 2. Observe status values. | Statuses shown: pending, paid, overdue. | | FR-COMM-05 |
| TC-BIL-006 | Billing | Multi-currency billing | Admin/Regulator logged in | 1. Create invoices in different currencies (ETB, GHS, UGX, USD). | Invoices created with correct currency. Amounts formatted per currency. | | FR-COMM-01 |
| TC-BIL-007 | Billing | Clickable billing rows | Billing records listed | 1. Click on a billing record row. | Billing detail dialog opens showing full invoice information. | | FR-COMM-01 |
| TC-BIL-008 | Billing | Access restriction for Lender/Viewer | Lender or Viewer user logged in | 1. Attempt to access Billing page. | Access denied or page not visible in sidebar navigation. | | FR-COMM-01 |

---

## 14. Helpdesk Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-HD-001 | Helpdesk | Search for a borrower | User is logged in | 1. Navigate to Helpdesk page (`/helpdesk`). 2. Enter borrower name or ID in search field. 3. Search. | Matching borrower(s) displayed with summary information. | | FR-CON-02 |
| TC-HD-002 | Helpdesk | View borrower info from helpdesk | Borrower found via search | 1. Search for a borrower. 2. View borrower details. | Borrower personal/company information displayed. Credit accounts, disputes, and consent records visible. | | FR-CON-02 |
| TC-HD-003 | Helpdesk | File dispute from helpdesk | Borrower found, user is logged in | 1. Search for borrower in Helpdesk. 2. Click "File Dispute". 3. Fill dispute details. 4. Submit. | Dispute created from helpdesk context. Linked to correct borrower. | | FR-CON-09 |
| TC-HD-004 | Helpdesk | Grant consent from helpdesk | Borrower found, user is logged in | 1. Search for borrower in Helpdesk. 2. Click "Grant Consent". 3. Fill consent details. 4. Submit. | Consent record created from helpdesk context. Receipt number generated. | | FR-CON-09 |
| TC-HD-005 | Helpdesk | View borrower disputes from helpdesk | Borrower has disputes | 1. Search for borrower. 2. View disputes section. | All disputes for the borrower displayed. | | FR-CON-02 |
| TC-HD-006 | Helpdesk | View borrower consent from helpdesk | Borrower has consent records | 1. Search for borrower. 2. View consent section. | All consent records for the borrower displayed. | | FR-CON-02 |

---

## 15. Batch Upload Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BU-001 | Batch Upload | Upload valid JSON file | Admin/Lender logged in, valid JSON file prepared | 1. Navigate to Batch Upload page (`/batch-upload`). 2. Select file format: JSON. 3. Select a valid JSON file with credit account records. 4. Click "Upload". | File processed successfully. Records validated and imported. Success count displayed. | | FR-COL-01 |
| TC-BU-002 | Batch Upload | Upload valid CSV file | Admin/Lender logged in, valid CSV file prepared | 1. Navigate to Batch Upload. 2. Select file format: CSV. 3. Select a valid CSV file. 4. Click "Upload". | File processed successfully. Records validated and imported. | | FR-COL-01 |
| TC-BU-003 | Batch Upload | Upload JSON with validation errors | Admin/Lender logged in, JSON file with invalid records | 1. Navigate to Batch Upload. 2. Upload JSON file with some invalid records (missing required fields, invalid data types). 3. Click "Upload". | Valid records processed. Invalid records reported with per-record error details. Error count displayed. | | FR-COL-01 |
| TC-BU-004 | Batch Upload | Upload CSV with validation errors | Admin/Lender logged in, CSV file with errors | 1. Upload CSV file with invalid records. | Valid records processed. Errors reported per-record. | | FR-COL-01 |
| TC-BU-005 | Batch Upload | Download error report | Upload completed with errors | 1. Complete an upload with some errors. 2. Click "Download Error Report" or equivalent. | Error report downloaded with details of failed records and their validation errors. | | FR-COL-01 |
| TC-BU-006 | Batch Upload | Empty file upload | Admin/Lender logged in | 1. Upload an empty file. | Appropriate error message: "Request body must contain a 'records' array" or similar. | | FR-COL-01 |
| TC-BU-007 | Batch Upload | Access restriction for Viewer/Regulator | Viewer or Regulator logged in | 1. Attempt to access Batch Upload. | Access denied or page not accessible. | | FR-COL-01 |

---

## 16. Audit Trail Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AT-001 | Audit Trail | View audit log entries | Admin/Regulator logged in, audit entries exist | 1. Navigate to Audit Trail page (`/audit`). | Audit log entries displayed with: timestamp, user, action, entity, entity ID, details, IP address. | | NFR-SEC-06 |
| TC-AT-002 | Audit Trail | Login events logged | User performs login | 1. Log in as any user. 2. Navigate to Audit Trail. 3. Search for LOGIN action. | Login event recorded with user ID, timestamp, and IP address. | | NFR-SEC-06 |
| TC-AT-003 | Audit Trail | Logout events logged | User performs logout | 1. Log out. 2. Log back in as Admin. 3. Check Audit Trail. | LOGOUT event recorded. | | NFR-SEC-06 |
| TC-AT-004 | Audit Trail | Failed login attempts logged | Failed login occurs | 1. Attempt login with wrong password. 2. Check Audit Trail. | LOGIN_FAILED event recorded with IP address. | | NFR-SEC-06 |
| TC-AT-005 | Audit Trail | Account lockout logged | Account gets locked | 1. Trigger account lockout (3 failed attempts). 2. Check Audit Trail. | ACCOUNT_LOCKED event recorded. | | NFR-SEC-06 |
| TC-AT-006 | Audit Trail | CRUD operations logged | Any create/update/delete action | 1. Perform a data operation (e.g., submit borrower). 2. Check Audit Trail. | SUBMIT_APPROVAL or CREATE event logged with entity details. | | NFR-SEC-06 |
| TC-AT-007 | Audit Trail | IP address tracking | Any action performed | 1. Perform various actions. 2. Check Audit Trail entries. | Each entry has an ipAddress field populated. | | NFR-SEC-07 |
| TC-AT-008 | Audit Trail | Password change logged | User changes password | 1. Change password. 2. Check Audit Trail. | PASSWORD_CHANGE event recorded. | | NFR-SEC-06 |
| TC-AT-009 | Audit Trail | Credit report generation logged | Credit report generated | 1. Generate a credit report. 2. Check Audit Trail. | VIEW or API_CREDIT_REPORT event logged with borrower details. | | NFR-SEC-06 |
| TC-AT-010 | Audit Trail | Access restriction for Lender/Viewer | Lender or Viewer logged in | 1. Attempt to access Audit Trail page. | Access denied or page not visible in navigation. | | NFR-SEC-06 |
| TC-AT-011 | Audit Trail | Clickable audit trail rows | Audit entries listed | 1. Click on an audit trail entry row. | Detail dialog opens showing full audit entry information. | | NFR-SEC-06 |

---

## 17. User Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-UM-001 | User Management | Create a new user | Admin logged in | 1. Navigate to User Management page (`/users`). 2. Click "Add User". 3. Fill: Username, Password (meeting complexity requirements), Full Name, Email, Role (admin/regulator/lender/viewer), Institution. 4. Submit. | User created successfully. Password stored as bcrypt hash. Audit log entry created. | | NFR-SEC-01 |
| TC-UM-002 | User Management | Assign Admin role | Admin logged in | 1. Create user with role: "admin". | User created with admin role. Has access to all admin features. | | NFR-SEC-02 |
| TC-UM-003 | User Management | Assign Regulator role | Admin logged in | 1. Create user with role: "regulator". | User created with regulator role. | | NFR-SEC-02 |
| TC-UM-004 | User Management | Assign Lender role | Admin logged in | 1. Create user with role: "lender". | User created with lender role. | | NFR-SEC-02 |
| TC-UM-005 | User Management | Assign Viewer role | Admin logged in | 1. Create user with role: "viewer". | User created with viewer role. Read-only access. | | NFR-SEC-02 |
| TC-UM-006 | User Management | Suspend a user | Admin logged in, active user exists | 1. Navigate to User Management. 2. Select user. 3. Change status to "suspended". | User status changed to suspended. User can no longer log in. Audit log entry. | | NFR-SEC-02 |
| TC-UM-007 | User Management | Deactivate a user | Admin logged in, active user exists | 1. Select user. 2. Change status to "deactivated". | User status changed to deactivated. User cannot log in. | | NFR-SEC-02 |
| TC-UM-008 | User Management | Reactivate a user | Admin logged in, suspended/deactivated user exists | 1. Select user. 2. Change status to "active". | User status changed to active. User can log in again. | | NFR-SEC-02 |
| TC-UM-009 | User Management | Update user details | Admin logged in | 1. Select user. 2. Edit Full Name and Email. 3. Save. | User details updated. Audit log entry. | | NFR-SEC-02 |
| TC-UM-010 | User Management | Access restriction for non-admin | Regulator/Lender/Viewer logged in | 1. Attempt to access User Management page. | Access denied or page not visible in sidebar. | | NFR-SEC-02 |
| TC-UM-011 | User Management | Reset user password | Admin logged in | 1. Select user. 2. Set new password. 3. Save. | Password updated (bcrypt hashed). User can log in with new password. | | NFR-SEC-04 |

---

## 18. API Keys Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AK-001 | API Keys | Generate API key for institution | Admin logged in, active institution exists | 1. Navigate to API Keys page (`/api-keys`). 2. Click "Generate API Key". 3. Select institution. 4. Enter label. 5. Select permissions: "submit". 6. Submit. | API key generated. Full key shown once (sim_{prefix}_{secret}). Key prefix and hash stored. Key prefix displayed for identification. | | NFR-SEC-08 |
| TC-AK-002 | API Keys | Generate API key with read permissions | Admin logged in | 1. Generate API key with permissions: "read". | Key generated with read-only permissions. | | NFR-SEC-08 |
| TC-AK-003 | API Keys | Generate API key with full permissions | Admin logged in | 1. Generate API key with permissions: "full". | Key generated with full (submit + read) permissions. | | NFR-SEC-08 |
| TC-AK-004 | API Keys | Revoke an API key | Admin logged in, active API key exists | 1. Navigate to API Keys. 2. Select active key. 3. Click "Revoke". | Key status changed to "revoked". revokedAt timestamp set. Key can no longer be used for API authentication. | | NFR-SEC-08 |
| TC-AK-005 | API Keys | View API key usage | Admin logged in, API key has been used | 1. Navigate to API Keys. 2. View key details. | Last used timestamp displayed. Key prefix shown for identification. | | NFR-SEC-08 |
| TC-AK-006 | API Keys | Access restriction for non-admin | Regulator/Lender/Viewer logged in | 1. Attempt to access API Keys page. | Access denied or page not visible. | | NFR-SEC-08 |
| TC-AK-007 | API Keys | API key SHA-256 hashing | API key generated | 1. Generate an API key. 2. Verify storage. | Full key is never stored. Only SHA-256 hash is stored in the database. Key prefix stored separately for display. | | NFR-SEC-08 |

---

## 19. External API Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-EA-001 | External API | Health check endpoint | API is accessible | 1. Send GET request to `/api/external/v1/health`. | Response: `{ "status": "ok", "version": "1.1", "service": "Systems In Motion Credit Registry API" }`. No authentication required. | | NFR-SEC-08 |
| TC-EA-002 | External API | Submit single borrower | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/borrowers` with X-API-Key header. 2. Body: valid borrower JSON. | 201 Created. Response includes borrower data in `{ success: true, data: {...} }` format. Audit log entry: API_SUBMIT. | | FR-COL-01 |
| TC-EA-003 | External API | Submit batch borrowers | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/borrowers` with array of borrower objects. | Response with batch results: submitted count, failed count, individual results and errors. Audit log: API_BATCH_SUBMIT. | | FR-COL-01 |
| TC-EA-004 | External API | Submit credit account | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/credit-accounts` with credit account JSON. | 201 Created. Credit account created. Lender institution defaults to API key's institution if not specified. | | FR-CR-01 |
| TC-EA-005 | External API | Submit batch credit accounts | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/credit-accounts` with array of credit accounts. | Batch processing results returned. | | FR-CR-01 |
| TC-EA-006 | External API | Submit payment history | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/payment-history` with payment history records. | Payment history entries created. Supports both single and batch submission. | | FR-CR-08 |
| TC-EA-007 | External API | Submit court judgment | Valid API key with "submit" permission | 1. Send POST to `/api/external/v1/court-judgments` with judgment data. | Court judgment created. Audit log entry. | | FR-COL-05 |
| TC-EA-008 | External API | Search borrowers by National ID | Valid API key with "read" permission | 1. Send GET to `/api/external/v1/borrowers/search?nationalId={id}`. | Matching borrowers returned in wrapped response format. | | FR-CR-01 |
| TC-EA-009 | External API | Search borrowers by name | Valid API key with "read" permission | 1. Send GET to `/api/external/v1/borrowers/search?name={name}`. | Matching borrowers returned. | | FR-CR-01 |
| TC-EA-010 | External API | Retrieve credit report | Valid API key with "read" permission | 1. Send GET to `/api/external/v1/borrowers/{id}/credit-report`. | Full credit report returned with: serial number, credit score, reason codes, accounts, inquiries, court judgments, consent records. Report log entry created. | | FR-CR-06 |
| TC-EA-011 | External API | Get credit accounts by borrower | Valid API key with "read" permission | 1. Send GET to `/api/external/v1/credit-accounts/{borrowerId}`. | Credit accounts for the borrower returned. | | FR-CR-01 |
| TC-EA-012 | External API | Missing API key header | No X-API-Key header | 1. Send any request to external API without X-API-Key header. | 401 Unauthorized: `{ "error": "Missing X-API-Key header" }`. | | NFR-SEC-08 |
| TC-EA-013 | External API | Invalid API key | Invalid API key value | 1. Send request with invalid X-API-Key value. | 401 Unauthorized: `{ "error": "Invalid API key" }`. | | NFR-SEC-08 |
| TC-EA-014 | External API | Revoked API key | Revoked API key | 1. Send request with a revoked API key. | 403 Forbidden: `{ "error": "API key has been revoked" }`. | | NFR-SEC-08 |
| TC-EA-015 | External API | Insufficient permissions | API key with "read" permission only | 1. Send POST to `/api/external/v1/borrowers` with read-only key. | 403 Forbidden: `{ "error": "Insufficient permissions..." }`. | | NFR-SEC-08 |
| TC-EA-016 | External API | Inactive institution API key | API key for suspended/pending institution | 1. Send request with key linked to non-active institution. | 403 Forbidden: `{ "error": "Institution is not active" }`. | | NFR-SEC-08 |
| TC-EA-017 | External API | Validation error on submission | Valid API key | 1. Send POST with invalid data (missing required fields). | 400 Bad Request with validation error details. | | FR-COL-01 |
| TC-EA-018 | External API | Last-used tracking on API key | Valid API key | 1. Make any authenticated API request. 2. Check API key record. | lastUsedAt timestamp updated on the API key. | | NFR-SEC-08 |

---

## 20. Reports & Export Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RE-001 | Reports | CSV export - portfolio data | User is logged in | 1. Navigate to Reports page (`/reports`). 2. Select export type: "portfolio". 3. Click "Export CSV". | CSV file downloaded containing portfolio data (accounts by institution, loan types, NPL ratios). | | INT-RPT-01 |
| TC-RE-002 | Reports | CSV export - borrower data | User is logged in | 1. Navigate to Reports. 2. Select export type: "borrowers". 3. Click "Export CSV". | CSV file downloaded containing borrower records. | | INT-RPT-04 |
| TC-RE-003 | Reports | Regulatory analytics view | User is logged in | 1. Navigate to Reports. 2. View regulatory analytics section. | Analytics displayed: NPL ratios, portfolio breakdowns by institution/loan type, SLA breach tracking. | | FR-REG-01 |
| TC-RE-004 | Reports | Portfolio breakdown by institution | Data exists for multiple institutions | 1. View regulatory analytics. | Portfolio data broken down by institution showing loan volumes, outstanding amounts, and NPL ratios. | | FR-REG-02 |
| TC-RE-005 | Reports | SLA breach tracking | Disputes with passed SLA deadlines exist | 1. View regulatory analytics. | SLA breaches identified and counted. | | FR-REG-03 |
| TC-RE-006 | Reports | Credit report logs view | Credit reports have been generated | 1. Navigate to credit report logs (via API or reports section). | Log entries showing: borrower, requestedBy, institution, purpose, serial number, timestamp. | | FR-CR-06 |

---

## 21. Notifications Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-NOT-001 | Notifications | Notification bell display | User is logged in | 1. Observe the notification bell icon in the header/sidebar. | Notification bell is visible. | | FR-CON-02 |
| TC-NOT-002 | Notifications | Unread count badge | User has unread notifications | 1. Observe the notification bell. | Unread count badge displayed on the bell icon with the number of unread notifications. | | FR-CON-02 |
| TC-NOT-003 | Notifications | View notifications list | User has notifications | 1. Click the notification bell. | Dropdown/panel opens showing list of notifications with title, message, timestamp, and read/unread status. | | FR-CON-02 |
| TC-NOT-004 | Notifications | Mark single notification as read | User has unread notifications | 1. Click notification bell. 2. Click on an unread notification. | Notification marked as read. Unread count decreases by 1. | | FR-CON-02 |
| TC-NOT-005 | Notifications | Mark all notifications as read | User has multiple unread notifications | 1. Click notification bell. 2. Click "Mark All Read". | All notifications marked as read. Unread count badge shows 0 or disappears. | | FR-CON-02 |
| TC-NOT-006 | Notifications | Auto-notify on approval request | User submits a borrower for approval | 1. Log in as Lender. 2. Submit a new borrower. 3. Log out. 4. Log in as Admin. 5. Check notifications. | Admin has a notification about the pending approval request. | | FR-CON-02 |
| TC-NOT-007 | Notifications | Auto-notify on approval result | Admin approves/rejects a request | 1. Admin approves a pending request. 2. Log out. 3. Log in as the requester. 4. Check notifications. | Requester has a notification about the approval/rejection result. | | FR-CON-02 |
| TC-NOT-008 | Notifications | Auto-notify on dispute filing | User files a dispute | 1. File a dispute. 2. Log in as Admin. 3. Check notifications. | Admin notified about the new dispute. | | FR-CON-02 |

---

## 22. Internationalization (i18n) Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-I18N-001 | i18n | Switch language to French | User is logged in | 1. Locate the language switcher in the header/sidebar. 2. Click to switch from English to French (FR). | All UI text changes to French translations. Sidebar labels, page titles, button text, and form labels all in French. | | FR-REG-01 |
| TC-I18N-002 | i18n | Switch language back to English | UI is in French | 1. Click language switcher. 2. Switch to English (EN). | All UI text reverts to English. | | FR-REG-01 |
| TC-I18N-003 | i18n | French sidebar navigation labels | Language set to French | 1. Observe sidebar navigation. | All sidebar items display French labels (e.g., "Tableau de Bord", "Emprunteurs", etc.). | | FR-REG-01 |
| TC-I18N-004 | i18n | French form labels | Language set to French | 1. Navigate to a form (e.g., Add Borrower). | Form field labels display in French. | | FR-REG-01 |
| TC-I18N-005 | i18n | French dashboard content | Language set to French | 1. Navigate to Dashboard. | Stat card titles and descriptions in French. | | FR-REG-01 |
| TC-I18N-006 | i18n | Language persistence | User switches to French | 1. Switch to French. 2. Navigate between pages. | French language persists across page navigation within the session. | | FR-REG-01 |
| TC-I18N-007 | i18n | Switch language to Portuguese | User is logged in | 1. Locate the language switcher in the header/sidebar. 2. Click to switch from English to Portuguese (PT). | All UI text changes to Portuguese translations. Sidebar labels, page titles, button text, and form labels all in Portuguese. | | FR-REG-01 |

---

## 23. Theme Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-THM-001 | Theme | Toggle to dark mode | User is logged in, light mode active | 1. Locate the theme toggle button. 2. Click to switch to dark mode. | Application switches to dark theme. Background colors darken. Text colors adjust for readability. All components (cards, tables, forms, sidebar) adapt. | | NFR-SEC-01 |
| TC-THM-002 | Theme | Toggle back to light mode | Dark mode active | 1. Click theme toggle. 2. Switch back to light mode. | Application reverts to light theme. All colors and styling return to light mode defaults. | | NFR-SEC-01 |
| TC-THM-003 | Theme | Dark mode sidebar | Dark mode active | 1. Observe the sidebar in dark mode. | Sidebar colors adapt properly. Text readable. Icons visible. Active item distinguishable. | | NFR-SEC-01 |
| TC-THM-004 | Theme | Dark mode forms and inputs | Dark mode active | 1. Navigate to a form. | Input fields, labels, borders, and backgrounds all adapt to dark mode. Text is readable. | | NFR-SEC-01 |
| TC-THM-005 | Theme | Dark mode tables | Dark mode active | 1. Navigate to a page with a data table. | Table headers, rows, borders, and text all adapt to dark mode. Alternating row colors (if any) adjusted. | | NFR-SEC-01 |
| TC-THM-006 | Theme | Dark mode stat cards | Dark mode active | 1. Navigate to Dashboard. | Stat cards adapt to dark mode with appropriate contrast. | | NFR-SEC-01 |
| TC-THM-007 | Theme | Theme persistence | User toggles theme | 1. Switch to dark mode. 2. Navigate between pages. | Theme selection persists across page navigation. | | NFR-SEC-01 |

---

## 24. Sign-Off

### 24.1 UAT Test Summary

| Metric | Count |
|--------|-------|
| Total Test Cases | 311 |
| Passed | |
| Failed | |
| Blocked | |
| Not Executed | |

### 24.2 UAT Sign-Off

| Role | Name | Signature | Date | Comments |
|------|------|-----------|------|----------|
| UAT Lead | | | | |
| Business Analyst | | | | |
| Project Manager | | | | |
| QA Lead | | | | |
| Client Representative | | | | |
| Systems In Motion Representative | | | | |

### 24.3 Defect Summary

| Defect ID | Test Case | Severity | Description | Status | Resolution |
|-----------|-----------|----------|-------------|--------|------------|
| | | | | | |
| | | | | | |
| | | | | | |

### 24.4 Test Environment Sign-Off

| Item | Status | Notes |
|------|--------|-------|
| Test Data Seeded | | |
| All User Accounts Active | | |
| Database Connectivity Verified | | |
| Application Accessible | | |
| Browser Compatibility Confirmed | | |

---

## 25. Enterprise Enhancement: MFA Module (ENT-01)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-001 | MFA | MFA setup - generate TOTP secret | User is logged in | 1. Navigate to user profile or MFA setup. 2. Click "Enable MFA" or equivalent. | TOTP secret generated. `otpauth://` URI returned for QR code display. Setup dialog shows URI/QR. | | ENT-01 |
| TC-ENT-002 | MFA | MFA verify - enable MFA with valid code | MFA setup completed (TC-ENT-001) | 1. Enter valid 6-digit TOTP code from authenticator app. 2. Click "Verify". | MFA enabled for user. `mfaEnabled` = true. Success message displayed. | | ENT-01 |
| TC-ENT-003 | MFA | MFA login - require code after password | User has MFA enabled | 1. Navigate to login page. 2. Enter username and password. 3. Click "Login". | Login returns `requireMfa: true`. TOTP code input field appears. | | ENT-01 |
| TC-ENT-004 | MFA | MFA login - complete with valid code | MFA code prompt displayed (TC-ENT-003) | 1. Enter valid 6-digit TOTP code. 2. Click "Verify". | Authentication completes. User redirected to Dashboard. Session established. | | ENT-01 |
| TC-ENT-005 | MFA | MFA disable | User has MFA enabled, is logged in | 1. Navigate to MFA settings. 2. Click "Disable MFA". | MFA disabled. `mfaEnabled` = false. `mfaSecret` cleared. | | ENT-01 |

---

## 26. Enterprise Enhancement: Fuzzy Entity Matching Module (ENT-02)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-006 | Fuzzy Matching | Duplicate warning on registration | User is logged in, existing borrower "Abebe Bekele" exists | 1. Navigate to Borrowers. 2. Click "Register Borrower". 3. Enter first name "Abebe" and last name "Bekele". | Warning banner appears showing potential duplicate borrowers with similarity scores. | | ENT-02 |
| TC-ENT-007 | Fuzzy Matching | Fuzzy match API endpoint | Borrowers exist in database | 1. Call `GET /api/borrowers/fuzzy-match?name=Abebe`. | Returns list of matching borrowers with trigram similarity scores ≥ 0.3. | | ENT-02 |

---

## 27. Enterprise Enhancement: Dispute Chatbot Module (ENT-03)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-008 | Chatbot | Start chatbot guided flow | User is logged in, on Helpdesk page | 1. Navigate to Helpdesk. 2. Locate and open the dispute chatbot. | Chatbot interface appears with initial prompt asking for dispute type. | | ENT-03 |
| TC-ENT-009 | Chatbot | Complete chatbot dispute filing | Chatbot open (TC-ENT-008) | 1. Select issue type. 2. Search for and select borrower. 3. Optionally select credit account. 4. Enter description. 5. Confirm submission. | Dispute auto-filed via API. Success message shown. Dispute appears in disputes list. | | ENT-03 |
| TC-ENT-010 | Chatbot | Cancel chatbot flow | Chatbot in progress | 1. Click cancel/close during any step. | Chatbot resets. "Cancelled" message shown. User can start new flow. | | ENT-03 |

---

## 28. Enterprise Enhancement: OAuth 2.1 Module (ENT-04)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-011 | OAuth 2.1 | Token exchange - valid credentials | Active API key exists | 1. Send `POST /api/external/oauth/token` with `{ grant_type: "client_credentials", client_id: "<prefix>", client_secret: "<full_key>" }`. | Returns `{ access_token: "<jwt>", token_type: "Bearer", expires_in: 3600 }`. | | ENT-04 |
| TC-ENT-012 | OAuth 2.1 | Bearer token authentication | Valid Bearer token obtained (TC-ENT-011) | 1. Send `GET /api/external/v1/borrowers/search?name=test` with `Authorization: Bearer <token>` header. | Request authenticated. Borrower search results returned. | | ENT-04 |
| TC-ENT-013 | OAuth 2.1 | API docs OAuth section | User is logged in | 1. Navigate to API Documentation page. | OAuth 2.1 section visible with token exchange example and Bearer token usage instructions. Element with `data-testid="text-oauth-example"` present. | | ENT-04 |

---

## 29. Enterprise Enhancement: Low-Bandwidth Optimizations Module (ENT-05)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-014 | Performance | Gzip compression active | Application is running | 1. Send any API request. 2. Check response headers. | `Content-Encoding: gzip` header present on responses. Response body is compressed. | | ENT-05 |
| TC-ENT-015 | Performance | Lazy-loaded routes render correctly | User is logged in | 1. Navigate to various pages (Borrowers, Credit Accounts, Disputes, etc.). | Pages load with brief spinner (Suspense fallback). Content renders correctly after load. No errors. | | ENT-05 |

---

## 30. Enterprise Enhancement: XBRL Upload Module (ENT-06)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-016 | XBRL Upload | XBRL tab visible on batch upload | Admin/Lender logged in | 1. Navigate to Batch Upload page. | Two tabs visible: "JSON/CSV" (`data-testid="tab-json"`) and "XBRL" (`data-testid="tab-xbrl"`). | | ENT-06 |
| TC-ENT-017 | XBRL Upload | XBRL sample format displayed | Admin/Lender on Batch Upload page | 1. Click the "XBRL" tab. | XBRL sample XML format displayed (`data-testid="text-xbrl-sample"`). Upload area for .xbrl/.xml files shown. | | ENT-06 |

---

## 31. Enterprise Enhancement: Tamper-Evident Audit Logs Module (ENT-07)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENT-018 | Audit Integrity | Integrity badge displayed | Admin/Regulator logged in, audit logs exist | 1. Navigate to Audit Trail page. | Integrity status badge visible (`data-testid="badge-integrity-status"`). Shows "Valid" or "Broken" status. | | ENT-07 |
| TC-ENT-019 | Audit Integrity | Verify integrity button | Admin/Regulator on Audit Trail page | 1. Click "Verify Integrity" button (`data-testid="button-verify-integrity"`). | Hash chain verification runs. Badge updates to show result. API call to `GET /api/audit/verify-integrity` returns `{ valid: true/false, totalEntries, checkedEntries }`. | | ENT-07 |
| TC-ENT-020 | Audit Integrity | Hash chain integrity valid | Audit logs have not been tampered with | 1. Click "Verify Integrity". | Badge shows green "Valid" status. `valid: true` in response. All entries pass hash chain verification. | | ENT-07 |

---

## 32. Exchange Rate Management Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-EXR-001 | Exchange Rates | View exchange rates | Admin user logged in | 1. Navigate to `/exchange-rates`. | Exchange rates table displays with seeded rate pairs. | | FR-CR-02 |
| TC-EXR-002 | Exchange Rates | Add exchange rate | Admin user logged in | 1. Click "Add Rate". 2. Fill USD/ETB rate 57.5. 3. Submit. | New rate appears in table, success toast shown. | | FR-CR-02 |
| TC-EXR-003 | Exchange Rates | Currency converter | Admin user logged in | 1. Enter amount 100. 2. Select USD to ETB. 3. Click Convert. | Converted amount displays correctly. | | FR-CR-02 |
| TC-EXR-004 | Exchange Rates | Edit exchange rate | Admin user logged in, rate exists | 1. Click edit on existing rate. 2. Change rate value. 3. Save. | Rate updated, success toast shown. | | FR-CR-02 |
| TC-EXR-005 | Exchange Rates | Delete exchange rate | Admin user logged in, rate exists | 1. Click delete on rate. 2. Confirm deletion. | Rate removed from table. | | FR-CR-02 |

---

## 33. API Administration Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-API-ADM-001 | API Admin | View API configurations | Admin user logged in | 1. Navigate to `/api-admin`. | API config cards display with seeded stubs. | | FR-API-01 |
| TC-API-ADM-002 | API Admin | Filter by category | Admin user logged in | 1. Click "Weather" category filter. | Only weather API configs shown. | | FR-API-01 |
| TC-API-ADM-003 | API Admin | Test connection | Admin user logged in | 1. Click "Test Connection" on a config. | Test result toast shown (reachable/unreachable). | | FR-API-01 |
| TC-API-ADM-004 | API Admin | Add API configuration | Admin user logged in | 1. Click "Add". 2. Fill name, URL, auth type. 3. Submit. | New config appears, success toast. | | FR-API-01 |

---

## 34. Data Retention Policies Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RET-001 | Retention Policies | View retention policies | Admin user logged in | 1. Navigate to `/retention-policies`. | Policies table displays with seeded policies. | | FR-RET-01 |
| TC-RET-002 | Retention Policies | Summary cards | Admin user logged in | 1. View summary cards on retention page. | Total policies, countries covered, avg retention shown. | | FR-RET-01 |
| TC-RET-003 | Retention Policies | Run enforcement | Admin user logged in | 1. Click "Run Enforcement" button. | Enforcement completes, success toast with record count. | | FR-RET-01 |
| TC-RET-004 | Retention Policies | Add retention policy | Admin user logged in | 1. Click "Add Policy". 2. Fill Ghana/borrower/10yr. 3. Submit. | New policy appears in table. | | FR-RET-01 |
| TC-RET-005 | Retention Policies | Edit retention policy | Admin user logged in, policy exists | 1. Click edit on policy. 2. Change years. 3. Save. | Policy updated, success toast. | | FR-RET-01 |

---

## 35. Global Search Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-GS-001 | Global Search | Cross-entity search | User is logged in | 1. Navigate to `/search`. 2. Enter a search term in the search box. 3. Submit search. | Results displayed across three categories: borrowers, institutions, and credit accounts. Matching records shown with relevant details. | | FR-COL-08 |
| TC-GS-002 | Global Search | Country filter | User is logged in | 1. Navigate to `/search`. 2. Enter a search term. 3. Select a country from the country filter dropdown. 4. Submit search. | Results filtered to only show records from the selected country. | | FR-COL-08 |

---

## 36. ID Photos & Document Upload Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-PHOTO-001 | ID Photos | Upload borrower photo | User is logged in, borrower exists | 1. Navigate to borrower detail page. 2. Click photo upload area/camera icon on the borrower avatar. 3. Select an image file (under 5MB). 4. Upload. | Photo uploaded successfully. Borrower avatar updates to show uploaded photo. Audit log entry created for UPLOAD_PHOTO. | | FR-COL-07 |
| TC-PHOTO-002 | ID Photos | Upload ID document | User is logged in, borrower exists | 1. Navigate to borrower detail page. 2. Locate ID Document section. 3. Click upload button. 4. Select an image or PDF file (under 10MB). 5. Upload. | ID document uploaded successfully. Document preview/link shown on borrower detail. Audit log entry created for UPLOAD_ID_DOCUMENT. | | FR-COL-07 |
| TC-PHOTO-003 | ID Photos | DiceBear avatar display | User is logged in, borrower exists without uploaded photo | 1. Navigate to borrower detail page for a borrower without an uploaded photo. | Auto-generated DiceBear avatar displayed as the borrower's profile photo. | | FR-COL-07 |

---

## 37. Demo Environment Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DEMO-001 | Demo Environment | Demo login from login page | Application is accessible | 1. Navigate to login page. 2. Click "Try Interactive Demo" button. 3. Select a role card (Admin, Regulator, or Bank Officer). | User is logged in with the selected demo role. Amber DEMO ENVIRONMENT banner visible at top of application. | | ENT-14 |
| TC-DEMO-002 | Demo Environment | Demo banner visibility | User logged in via demo | 1. Log in via demo environment. 2. Navigate between pages. | Amber DEMO ENVIRONMENT banner remains visible on all pages. Fictional data disclaimer shown. | | ENT-14 |

---

## 38. Language Switcher on Login Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-LANG-001 | Login Language | Language switcher visible on login | None | 1. Navigate to `/auth`. | Language dropdown visible in top-right corner. | | FR-REG-01 |
| TC-LANG-002 | Login Language | Switch to French on login | None | 1. Select FR from language switcher on login page. | Login labels change to French. | | FR-REG-01 |
| TC-LANG-003 | Login Language | Switch to Portuguese on login | None | 1. Select PT from language switcher on login page. | Login labels change to Portuguese. | | FR-REG-01 |
| TC-LANG-004 | Login Language | Language persists after login | None | 1. Select FR from language switcher. 2. Log in as admin. | Dashboard shows in French after login. | | FR-REG-01 |

---

## 39. Dashboard Visual Analytics Module (ENT-14)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-VIZ-001 | Visual Analytics | Portfolio growth area chart loads with 12 months of data | User is logged in, dashboard data exists | 1. Navigate to Dashboard (`/`). 2. Scroll to the Portfolio Growth chart section. 3. Observe the area chart. | Area chart renders with 12 months of data points showing borrower and account trends over time. X-axis shows months, Y-axis shows counts. Chart is rendered using Recharts library. | | ENT-14 |
| TC-VIZ-002 | Visual Analytics | Area chart tooltips on hover | User is logged in, portfolio growth chart visible | 1. Navigate to Dashboard. 2. Hover over a data point on the portfolio growth area chart. | Tooltip appears showing the month label, number of borrowers, and number of accounts for the hovered data point. | | ENT-14 |
| TC-VIZ-003 | Visual Analytics | Account status donut chart shows all status categories | User is logged in, credit accounts with various statuses exist | 1. Navigate to Dashboard. 2. Locate the Account Status donut chart. 3. Observe all displayed status segments. | Donut chart renders with segments for all account status categories (current, delinquent, default, closed, restructured, written_off). Each segment is color-coded and labeled. | | ENT-14 |
| TC-VIZ-004 | Visual Analytics | Loan type horizontal bar chart shows top account types | User is logged in, credit accounts with various types exist | 1. Navigate to Dashboard. 2. Locate the Loan Type breakdown chart. 3. Observe the horizontal bar chart. | Horizontal bar chart renders showing the top account types (e.g., personal_loan, mortgage, business_loan). Bars are proportional to the count of each type. | | ENT-14 |
| TC-VIZ-005 | Visual Analytics | Africa map renders all 54 countries | User is logged in | 1. Navigate to Dashboard. 2. Scroll to the Africa Map section. 3. Observe the SVG map. | SVG choropleth map renders showing all 54 African countries. Each country is a distinct, clickable/hoverable region. | | ENT-14 |
| TC-VIZ-006 | Visual Analytics | Map heat coloring reflects borrower activity levels | User is logged in, borrower data exists across multiple countries | 1. Navigate to Dashboard. 2. Observe the Africa map color coding. 3. Compare colors with the legend. | Countries with higher borrower activity display darker/more intense heat coloring. Countries with no activity display a neutral/light color. A legend is visible showing activity level color scale. | | ENT-14 |
| TC-VIZ-007 | Visual Analytics | Map hover tooltips show country details | User is logged in, Africa map visible | 1. Navigate to Dashboard. 2. Hover over a country on the Africa map. | Tooltip appears showing the country name, number of borrowers, and number of accounts for that country. | | ENT-14 |
| TC-VIZ-008 | Visual Analytics | Charts render correctly in dark mode | User is logged in, dark mode enabled | 1. Toggle theme to dark mode. 2. Navigate to Dashboard. 3. Observe all charts (area, donut, bar) and Africa map. | All charts adapt to dark mode with appropriate background colors, axis colors, label colors, and tooltip styling. Charts remain readable and visually consistent with the dark theme. | | ENT-14 |
| TC-VIZ-009 | Visual Analytics | Chart-data API endpoint requires authentication | No active session | 1. Open a new browser tab or use an API client. 2. Send GET request to `/api/dashboard/chart-data` without authentication. | Request returns 401 Unauthorized. Chart data is not exposed to unauthenticated users. | | ENT-14, NFR-SEC-01 |
| TC-VIZ-010 | Visual Analytics | Charts are responsive on mobile viewports | User is logged in | 1. Open browser developer tools. 2. Set viewport to mobile size (e.g., 375x667). 3. Navigate to Dashboard. 4. Scroll through all chart sections. | All charts resize responsively to fit the mobile viewport. Charts remain readable without horizontal scrolling. Legends and labels adjust appropriately. | | ENT-14 |

---

## 40. Interactive Demo Tour Module (ENT-15)

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-TOUR-001 | Demo Tour | Tour auto-launches after demo login | Application is accessible | 1. Navigate to login page. 2. Click "Try Interactive Demo" button. 3. Select a demo role (e.g., Admin). 4. Wait for Dashboard to load. | After demo login, the guided tour automatically launches. A spotlight overlay appears highlighting the first tour step. The sessionStorage flag triggers the auto-launch. | | ENT-15 |
| TC-TOUR-002 | Demo Tour | Tour has 11 steps with spotlight overlay | Tour is active (from TC-TOUR-001) | 1. Observe the tour overlay. 2. Click "Next" through all steps. 3. Count total steps. | Tour contains exactly 11 steps. Each step shows a spotlight overlay highlighting a specific UI element (sidebar navigation, stat cards, charts, Africa map, search, settings, etc.). Step counter shows progress (e.g., "Step 1 of 11"). | | ENT-15 |
| TC-TOUR-003 | Demo Tour | Next/Back/Skip/Close controls work | Tour is active | 1. Click "Next" to advance to step 2. 2. Click "Back" to return to step 1. 3. Click "Next" to advance again. 4. Click "Skip" to end the tour early. 5. Relaunch tour. 6. Click "Close" (X button) to dismiss. | Next advances to the following step. Back returns to the previous step. Skip ends the tour immediately and closes the overlay. Close (X) dismisses the tour overlay. All controls respond correctly. | | ENT-15 |
| TC-TOUR-004 | Demo Tour | "Take a Tour" button relaunches tour | User is logged in via demo, tour was previously completed or skipped | 1. Complete or skip the initial tour. 2. Locate the amber DEMO ENVIRONMENT banner at the top of the page. 3. Click the "Take a Tour" button within the banner. | Tour relaunches from step 1. Spotlight overlay appears again. Full 11-step tour is available. | | ENT-15 |
| TC-TOUR-005 | Demo Tour | Tour works in all 5 AU languages | User is logged in via demo | 1. Set language to French (FR). 2. Launch tour. Observe tour text is in French. 3. Repeat for Portuguese (PT), Arabic (AR), and Swahili (SW). | Tour step titles and descriptions are translated into the selected language. All 5 AU languages (EN, FR, PT, AR, SW) display correctly translated tour content. | | ENT-15 |
| TC-TOUR-006 | Demo Tour | Tour handles mobile sidebar correctly | User is logged in via demo, mobile viewport | 1. Set viewport to mobile size. 2. Launch the demo tour. 3. Observe tour behavior when highlighting sidebar elements. | On mobile viewports, the tour correctly handles the collapsible sidebar. If a tour step highlights a sidebar element, the sidebar opens automatically or the step adapts to the mobile layout. Tour remains usable on mobile. | | ENT-15 |

---

## 41. AI Features Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AI-01 | AI Features | AI Risk Analysis button appears on borrower detail page | User is logged in, borrower exists | 1. Navigate to Borrowers page. 2. Click on a borrower to open the detail page (`/borrowers/:id`). 3. Locate the AI Risk Analysis section. | A purple "AI Risk Analysis" button is visible on the borrower detail page. The button includes a Sparkles icon. | Pass | AI-001 |
| TC-AI-02 | AI Features | AI Risk Analysis generates risk assessment with score, factors, recommendations | User is logged in, on borrower detail page | 1. Navigate to borrower detail page. 2. Click the purple "AI Risk Analysis" button. 3. Wait for the analysis to complete. | AI risk assessment is generated and displayed in an expandable purple-gradient card. The assessment includes: risk level (low/medium/high/critical), risk score (0-100), summary text, risk factors with positive and negative impact indicators, actionable recommendations, and regulatory flags. Data is retrieved via POST `/api/ai/credit-risk/:borrowerId`. | Pass | AI-001 |
| TC-AI-03 | AI Features | AI Summary button on credit report page generates plain-language summary | User is logged in, borrower with credit accounts exists | 1. Navigate to Credit Report page (`/credit-report/:borrowerId`). 2. Locate and click the "AI Summary" button (Sparkles icon). 3. Wait for the summary to generate. | A plain-language AI summary of the borrower's credit history is generated and displayed in a collapsible card. The card shows the borrower name and a timestamp. Summary is retrieved via POST `/api/ai/report-summary/:borrowerId`. | Pass | AI-002 |
| TC-AI-04 | AI Features | AI Chatbot mode accessible via Sparkles icon with streaming responses | User is logged in, on Helpdesk page | 1. Navigate to Helpdesk page. 2. Open the dispute chatbot. 3. Click the Sparkles icon in the chatbot header to enter AI mode. 4. Type a question about credit data or regulations. 5. Send the message. | AI assistant mode is activated. The chatbot interface switches to AI mode with a visual indicator. User message is sent and AI responds with a streaming response (text appears progressively). Full conversation history is maintained. Messages are sent via POST `/api/ai/chat` with SSE streaming. | Pass | AI-003 |
| TC-AI-05 | AI Features | AI Compliance Report generation with country selector | User is logged in as admin/super_admin/regulator | 1. Navigate to Regulatory Compliance page. 2. Select a country from the dropdown. 3. Click "Generate Report". 4. Wait for the report to generate. | AI compliance report is generated and displayed in a formatted card. The report includes: compliance score, regulatory body, data protection law, risk areas, and recommendations. Data is retrieved via POST `/api/ai/compliance-report`. Only users with admin, super_admin, or regulator roles can access this feature. | Pass | AI-004 |

---

## 42. Enhanced Features Module

| TC-ID | Module | Test Case Name | Pre-conditions | Test Steps | Expected Result | Pass/Fail | SRS Reference |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-ENH-01 | Enhanced Features | Audit trail timeline view toggle works | User is logged in as admin/regulator, audit log entries exist | 1. Navigate to Audit Trail page. 2. Locate the view toggle control. 3. Click the timeline view toggle. | Audit trail switches to a vertical timeline feed view. Each entry is displayed with a colored dot indicator: green for CREATE actions, blue for UPDATE actions, and red for DELETE actions. Entries are displayed chronologically with timestamps and action details. | Pass | ENT-20 |
| TC-ENH-02 | Enhanced Features | Audit trail date range filters narrow results | User is logged in as admin/regulator, audit log entries exist across multiple dates | 1. Navigate to Audit Trail page. 2. Locate the date range filter inputs (From and To date fields). 3. Enter a From date. 4. Enter a To date. 5. Apply the filter. | Audit trail results are filtered to only show entries within the specified date range. Entries outside the date range are excluded from the display. The result count updates to reflect the filtered set. | Pass | ENT-20 |
| TC-ENH-03 | Enhanced Features | Audit trail CSV and Excel export downloads | User is logged in as admin/regulator, audit log entries exist | 1. Navigate to Audit Trail page. 2. Locate the export buttons (CSV and Excel). 3. Click the CSV export button. 4. Verify a CSV file is downloaded. 5. Click the Excel export button. 6. Verify an XLSX file is downloaded. | Both CSV and Excel export buttons are visible. Clicking CSV export downloads a .csv file containing audit trail data. Clicking Excel export downloads a .xlsx file containing formatted audit trail data with teal header styling. Both files contain the currently filtered/displayed audit data. | Pass | ENT-20, ENT-16 |
| TC-ENH-04 | Enhanced Features | API Usage Analytics tab shows stats and chart | User is logged in as admin, on API Administration page | 1. Navigate to API Administration page (`/api-admin`). 2. Locate and click the "API Usage Analytics" tab. 3. Observe the analytics dashboard. | API Usage Analytics tab displays: total requests today (numeric count), requests this hour (numeric count), unique endpoints (numeric count), an hourly bar chart showing request distribution over the last 24 hours, and a top endpoints table listing the most frequently accessed API endpoints. Data is retrieved via GET `/api/admin/api-usage`. | Pass | ENT-18 |
| TC-ENH-05 | Enhanced Features | Dashboard stat cards display sparkline trends | User is logged in, on Dashboard page | 1. Navigate to Dashboard (`/`). 2. Observe the 8 stat cards. 3. Look for mini-charts within each stat card. | Each stat card displays a sparkline mini-chart (7-day trend line) showing the trend of the metric over the past 7 days. The sparkline is rendered as a Recharts AreaChart within the stat card. Trend data is retrieved via GET `/api/dashboard/trends`. | Pass | ENT-19 |
| TC-ENH-06 | Enhanced Features | Notification bell shows/hides popover and marks read | User is logged in, notifications exist | 1. Locate the notification bell icon in the application header. 2. Observe if an unread count badge is displayed. 3. Click the notification bell. 4. Observe the popover dropdown with notifications. 5. Click on a notification to mark it as read. 6. Click "Mark all as read" if available. | Notification bell icon is visible in the header. Unread notification count is displayed as a badge on the bell icon. Clicking the bell opens a popover dropdown listing recent notifications. Each notification shows title, message, and timestamp. Clicking a notification marks it as read (PATCH `/api/notifications/:id/read`). "Mark all as read" button marks all notifications as read (POST `/api/notifications/mark-all-read`). Notifications are polled every 30 seconds for updates. | Pass | ENT-17 |
| TC-ENH-07 | Enhanced Features | Excel export buttons on reports page download XLSX files | User is logged in, on Reports page | 1. Navigate to Reports page. 2. Locate the Excel export buttons for portfolio, borrowers, and audit trail data. 3. Click each Excel export button. | Each Excel export button triggers a download of a formatted .xlsx file. The files are generated via GET `/api/reports/export?format=xlsx&type=portfolio\|borrowers\|audit`. XLSX files contain properly formatted data with teal header styling using the exceljs package. | Pass | ENT-16 |
| TC-ENH-08 | Enhanced Features | Language selector on credit report page | User is logged in, borrower with credit accounts exists | 1. Navigate to Credit Report page (`/credit-report/:borrowerId`). 2. Locate the language selector dropdown. 3. Select each available language option (English, French, Arabic, Swahili). 4. Generate/download a PDF report in each language. | Language selector dropdown is visible on the credit report page with options for English, French, Arabic, and Swahili. Selecting a language and downloading the PDF generates the credit report in the selected language. All report labels and headers are translated appropriately. | Pass | ENT-21 |

---

**Document End**

*This UAT Test Document covers all modules of the Cross-Jurisdictional Central Data Hub & Credit Registry System v1.2, including the 15 enterprise enhancements (ENT-01 through ENT-15), AI-powered features (AI-001 through AI-004), and additional enhanced features (ENT-16 through ENT-21). Each test case is designed to validate functional and non-functional requirements as defined in the Software Requirements Specification (SRS).*

*Prepared by: Systems In Motion Limited*  
*Classification: Confidential*
