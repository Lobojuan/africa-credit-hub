# Credit Registry System — Users Manual v2.5

**Cross-Jurisdictional Central Data Hub & Credit Registry System**

**Prepared for:** Systems In Motion Limited

**Version:** 2.5

**Date:** April 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Borrower Management](#4-borrower-management)
5. [Credit Accounts](#5-credit-accounts)
6. [Credit Search & Reports](#6-credit-search--reports)
7. [Maker-Checker Workflow](#7-maker-checker-workflow)
8. [Dispute Management](#8-dispute-management)
9. [Court Judgments](#9-court-judgments)
10. [Consent Management](#10-consent-management)
11. [Institution Management](#11-institution-management)
12. [Billing](#12-billing)
13. [Helpdesk](#13-helpdesk)
14. [Batch Upload](#14-batch-upload)
15. [Audit Trail](#15-audit-trail)
16. [User Management](#16-user-management)
17. [API Keys](#17-api-keys)
18. [Reports & Export](#18-reports--export)
19. [Notifications](#19-notifications)
20. [FAQ / "How Do I...?"](#20-faq--how-do-i)
21. [Multi-Factor Authentication (MFA)](#21-multi-factor-authentication-mfa)
22. [Dispute Chatbot](#22-dispute-chatbot)
23. [XBRL Upload](#23-xbrl-upload)
24. [Audit Log Integrity Verification](#24-audit-log-integrity-verification)
25. [Exchange Rate Management](#25-exchange-rate-management)
26. [API Administration](#26-api-administration)
27. [Data Retention Policies](#27-data-retention-policies)
28. [Global Search](#28-global-search)
29. [ID Photos & Document Upload](#29-id-photos--document-upload)
30. [Demo Environment](#30-demo-environment)
31. [AI-Powered Features](#31-ai-powered-features)
32. [Appendix A: Seed Credentials](#appendix-a-seed-credentials)
33. [Appendix B: Role Access Matrix](#appendix-b-role-access-matrix)
34. [Appendix C: Supported Currencies](#appendix-c-supported-currencies)
35. [Appendix D: Glossary of Terms](#appendix-d-glossary-of-terms)

---

## 1. Introduction

### 1.1 System Purpose

The Credit Registry System is a web-based application developed by Systems In Motion Limited for managing credit information, borrower records, and credit risk assessment across commercial banks, microfinance institutions, and other financial service providers. It serves as a Cross-Jurisdictional Central Data Hub (CDH) that enables regulatory oversight, credit risk management, and consumer protection.

### 1.2 Supported Jurisdictions

The system supports deployment across all **54 African countries**, grouped by region:

**West Africa (ECOWAS):**
Benin, Burkina Faso, Cabo Verde, Côte d'Ivoire, Gambia, Ghana, Guinea, Guinea-Bissau, Liberia, Mali, Niger, Nigeria, Senegal, Sierra Leone, Togo

**East Africa (EAC):**
Burundi, DR Congo, Ethiopia, Kenya, Rwanda, South Sudan, Tanzania, Uganda

**Southern Africa (SADC):**
Angola, Botswana, Eswatini, Lesotho, Madagascar, Malawi, Mauritius, Mozambique, Namibia, Seychelles, South Africa, Zambia, Zimbabwe

**Central Africa (CEMAC):**
Cameroon, Central African Republic, Chad, Congo, Equatorial Guinea, Gabon, São Tomé and Príncipe

**North Africa (AMU):**
Algeria, Djibouti, Egypt, Eritrea, Libya, Mauritania, Morocco, Somalia, Sudan, Tunisia, Comoros

### 1.3 Supported Languages

The system supports five languages:

- **English (EN)** — Default language
- **French (FR)** — Full French translation available
- **Portuguese (PT)** — Full Portuguese translation available
- **Arabic (AR)** — Full Arabic translation available
- **Swahili (SW)** — Full Swahili translation available

Users can switch between languages at any time using the language switcher available on the login page and in the application header.

---

## 2. Getting Started

### 2.1 Accessing the System

Open a modern web browser (Chrome, Firefox, Safari, or Edge) and navigate to the system URL provided by your administrator. The login page will be displayed.

### 2.2 Logging In

1. On the login page, select your **preferred language** (EN/FR/PT) using the language switcher if desired.
2. Enter your **Username** in the username field.
3. Enter your **Password** in the password field.
4. Click the **Sign In** button.
5. Upon successful authentication, you will be redirected to the Dashboard.

**Important Notes:**
- Accounts are locked for **15 minutes** after **3 consecutive failed login attempts**.
- If your account is locked, wait for the lockout period to expire before trying again.
- If your account is suspended or deactivated, contact your system administrator.

### 2.3 First-Time Password Change

If your administrator has flagged your account for a mandatory password change (or if your password is older than 90 days), you will be prompted to change your password upon login.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&* etc.)

To change your password:
1. A password change dialog will appear automatically if required.
2. Enter your **Current Password**.
3. Enter your **New Password** meeting the requirements above.
4. Click **Change Password**.

You can also change your password at any time by clicking the password change option in the sidebar.

### 2.4 Language Switching (EN/FR/PT)

To switch the interface language:
1. Locate the language switcher button in the top header bar or on the login page (shows "EN", "FR", or "PT").
2. Click the button to cycle between English, French, and Portuguese.
3. The entire interface will update immediately to the selected language.

### 2.5 Theme Toggle (Light/Dark)

The system supports both light and dark themes:
1. Click the theme toggle icon (sun/moon) in the top header bar.
2. The interface will switch between light and dark mode.
3. Your preference is saved in your browser's local storage.

### 2.6 Understanding the Sidebar Navigation

The sidebar provides access to all system modules, organized into three sections:

**Main:**
- Dashboard
- Borrowers
- Credit Accounts
- Credit Search
- Batch Upload

**Reports & Compliance:**
- Pending Approvals
- Disputes
- Audit Trail
- Consent Management
- Billing
- Helpdesk

**Administration:**
- User Management (Admin only)
- Institutions (Admin only)
- API Keys (Admin only)
- Exchange Rates (Admin only)
- API Administration (Admin only)
- Retention Policies (Admin/Regulator)

The sidebar can be collapsed by clicking the sidebar toggle button in the header. In collapsed mode, only icons are visible. On mobile devices, the sidebar opens as a slide-out panel.

### 2.7 Multi-Factor Authentication (MFA)

The system supports optional TOTP-based Multi-Factor Authentication for enhanced security. When MFA is enabled:
1. After entering your username and password, you will be prompted for a 6-digit code.
2. Open your authenticator app (Google Authenticator, Authy, etc.) to get the code.
3. Enter the code and click **Verify** to complete login.

See Section 21 for detailed MFA setup instructions.

### 2.8 Session Timeout (4-Hour Auto-Logout)

For security compliance (NFR-SEC-09), the system automatically logs you out after **4 hours of inactivity**. When a session times out:
- You will be automatically redirected to the login page (HTTP 440 status triggers frontend redirect).
- Any unsaved work will be lost.
- A maximum session duration of **8 hours** applies regardless of activity.

---

## 3. Dashboard

The Dashboard provides an at-a-glance overview of the Credit Registry System's key metrics and recent activity.

### 3.1 Understanding the 8 Stat Cards

The Dashboard displays 8 interactive stat cards, each featuring a **sparkline mini-chart** showing 7-day trend data:

| Card | Description |
|------|-------------|
| **Total Borrowers** | Total number of registered borrower records (individual and corporate) |
| **Credit Accounts** | Total number of credit/loan accounts in the system |
| **Outstanding** | Total outstanding balance across all active accounts |
| **Delinquent** | Number of accounts with past-due payments |
| **Defaults** | Number of non-performing / defaulted accounts |
| **Inquiries** | Total number of credit inquiries/searches performed |
| **Pending Approvals** | Number of pending maker-checker approval requests |
| **Open Disputes** | Number of currently open dispute cases |

Each stat card includes a small area chart (sparkline) at the bottom that visualizes the metric's trend over the past 7 days. This allows you to quickly identify upward or downward trends in key metrics at a glance without navigating away from the dashboard.

### 3.2 Clicking Cards for Drill-Down Detail Sheets

Each stat card is clickable. Clicking a card opens a detail sheet that shows the underlying records for that metric:

1. Click any stat card (e.g., "Delinquent").
2. A slide-out panel will appear showing a list of the relevant records.
3. Click individual items in the list to navigate to the detailed record page.
4. Close the detail sheet by clicking the close button or clicking outside the panel.

### 3.3 Recent Activity Section

Below the stat cards, the Dashboard displays recent system activity including:
- Recently created borrower records
- New credit accounts
- Recent approval actions
- Dispute filings and resolutions

### 3.4 Portfolio Growth Chart

Below the recent activity section, the Dashboard displays a **Portfolio Growth Chart** — a 12-month area chart that visualizes borrower and credit account trends over time.

1. The chart displays two layered area series:
   - **Borrowers** — Monthly count of registered borrowers
   - **Accounts** — Monthly count of credit accounts
2. The X-axis shows the most recent 12 months (e.g., "Apr 2025", "May 2025", etc.).
3. Hover over any point on the chart to see a tooltip displaying the exact month, borrower count, and account count.
4. The chart is built with Recharts and is fully responsive — it adjusts to the available screen width.
5. Colors and styling automatically adapt to the current theme (light or dark mode).

### 3.5 Account Status & Loan Type Charts

Two additional charts appear alongside the portfolio growth chart:

**Account Status Donut Chart:**
- A donut (ring) chart showing the breakdown of credit accounts by status (Current, Delinquent, Default, Closed, Restructured, Written Off).
- Each segment is color-coded and labeled with the status name and count.
- Hover over a segment to see the exact count for that status.

**Loan Type Horizontal Bar Chart:**
- A horizontal bar chart showing the distribution of credit accounts by loan type (Personal Loan, Mortgage, Vehicle Loan, Business Loan, Corporate Loan, Overdraft, Credit Card, Microfinance).
- Bars are sorted by count, making it easy to identify the most common loan types.
- Hover over a bar to see the exact count for that loan type.

### 3.6 Africa Map

The Dashboard includes an **interactive SVG Africa Map** that provides a geographic overview of credit registry coverage across the continent.

1. The map displays all **54 African countries** as individual SVG regions.
2. Countries are shaded with **heat coloring** based on borrower activity levels:
   - Darker shading indicates higher borrower/account activity.
   - Lighter shading indicates lower activity.
   - Countries with no data appear in a neutral tone.
3. A **legend** is displayed alongside the map explaining the activity level color scale.
4. **Hover over any country** to see a tooltip showing:
   - Country name
   - Number of registered borrowers
   - Number of credit accounts
5. The map is fully responsive and adapts to the current theme (light or dark mode).

---

## 4. Borrower Management

The Borrower Management module allows you to register, search, and manage borrower profiles.

### 4.1 Searching Borrowers (Name/ID)

1. Navigate to **Borrowers** from the sidebar.
2. Use the search bar at the top of the page.
3. Type a borrower's name, national ID, or other identifying information.
4. Results will filter automatically as you type.
5. Click on a borrower card to view their full details.

### 4.2 Registering an Individual Borrower

1. Click the **Register Borrower** button (top-right).
2. Select borrower type: **Individual**.
3. Fill in the required fields:
   - **First Name** (required)
   - **Last Name** (required)
   - **National ID** (required, must be unique)
   - **Date of Birth**
   - **Gender** (Male/Female)
   - **Phone**
   - **Email**
   - **Address**, **City**, **Region**
   - **Employer Name**, **Occupation**
   - **Sector**
4. Optionally check the **PEP Flag** checkbox if the borrower is a Politically Exposed Person.
   - If PEP is checked, provide **PEP Details** describing the nature of the political exposure.
5. Select **Education Level** (None, Primary, Secondary, Diploma, Bachelors, Masters, Doctorate).
6. Enter **Education Institution** name.
7. Enter **Employment History** in the text area.
8. Click **Register Borrower** to submit.
9. The registration will be submitted for **maker-checker approval** (see Section 7).

### 4.3 Registering a Corporate Borrower

1. Click the **Register Borrower** button.
2. Select borrower type: **Corporate**.
3. Fill in the required fields:
   - **Company Name** (required)
   - **National ID** (required, must be unique)
   - **Business Registration Number**
   - **Phone**, **Email**
   - **Address**, **City**, **Region**
   - **Sector**
4. Optionally set the PEP flag and provide details.
5. Click **Register Borrower** to submit for approval.

### 4.4 PEP Flagging

A Politically Exposed Person (PEP) flag indicates that a borrower holds a prominent public position or is closely associated with someone who does. To flag a borrower as PEP:

1. During registration or when editing a borrower, check the **PEP Flag** checkbox.
2. Enter details in the **PEP Details** field explaining the nature of the political exposure.
3. PEP-flagged borrowers display a red PEP badge on their profile card.

### 4.5 Viewing Borrower Details

1. Click on any borrower card in the borrower list.
2. The borrower detail page displays:
   - **Profile photo** — An auto-generated avatar (via DiceBear) is displayed by default; a custom photo can be uploaded by hovering over the avatar and clicking the camera icon
   - Personal/company information
   - All linked credit accounts
   - Credit report access
   - Court judgments
   - Consent records
   - Related parties
   - **ID Document section** — Shows the uploaded ID scan (passport or national ID) or an upload prompt if none has been uploaded yet. Click the "Upload ID" button in the header or the upload area in the personal info card to attach a document.

### 4.6 Related Party Linking

Borrowers can be linked to related parties with the following relationship types: spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, and parent_company:

1. On the borrower detail page, view the **Related Parties** section.
2. Related borrowers are displayed with their relationship type.
3. Click on a related party to navigate to their borrower profile.

### 4.7 Understanding Maker-Checker (Changes Need Approval)

All borrower creation and modification requests go through a maker-checker workflow:

- When you submit a new borrower or edit an existing one, a **pending approval** is created.
- A different authorized user (Admin or Regulator) must review and approve the change.
- You will receive a notification when your request is approved or rejected.
- See Section 7 for full details on the maker-checker workflow.

### 4.8 Pagination

The borrower list is paginated to handle large datasets (102,000+ records across 54 countries):
- Use the **Previous** and **Next** buttons to navigate between pages.
- The current page number and total count are displayed at the bottom.
- Default page size is 50 records per page.

---

## 5. Credit Accounts

The Credit Accounts module manages loan and credit facilities associated with borrowers.

### 5.1 Adding Credit Accounts

1. Navigate to **Credit Accounts** from the sidebar.
2. Click the **Add Account** button.
3. Fill in the required fields:
   - **Borrower** — Select from the dropdown list
   - **Lender Institution** — Name of the lending institution
   - **Account Number** — Unique account identifier
   - **Account Type** — Select from: Personal Loan, Mortgage, Vehicle Loan, Business Loan, Corporate Loan, Overdraft, Credit Card, Microfinance
   - **Original Amount** — Original loan/facility amount
   - **Current Balance** — Current outstanding balance
   - **Currency** — Select from 45+ supported currencies (42 African plus USD, EUR, GBP)
   - **Interest Rate** — Annual interest rate percentage
   - **Status** — Current, Delinquent, Default, Closed, Restructured
   - **Disbursement Date** — When the loan was disbursed
   - **Maturity Date** — When the loan matures
   - **Collateral Type** — Type of collateral (e.g., Property, Vehicle, Cash)
   - **Collateral Value** — Value of the collateral
4. Additional fields:
   - **Interest-Free** — Check if this is a Sharia-compliant or interest-free facility
   - **Grace Period (Months)** — Number of months of grace period
   - **Restructure Count** — Number of times the account has been restructured
5. Click **Create Account** to submit for maker-checker approval.

### 5.2 Understanding Account Statuses

| Status | Description |
|--------|-------------|
| **Current** | Account is performing normally; all payments are up to date |
| **Delinquent** | Account has past-due payments but has not yet defaulted |
| **Default** | Account has been classified as non-performing |
| **Closed** | Account has been fully repaid or closed |
| **Restructured** | Loan terms have been modified/restructured |
| **Written Off** | Account has been written off as a loss |

### 5.3 Multi-Currency Support

The system supports 42+ African currencies plus USD, EUR, and GBP (45+ total) across all African and international markets. When creating or viewing credit accounts:
- Select the appropriate currency from the dropdown.
- Amounts are displayed with proper formatting for the selected currency.
- See Appendix C for the complete list of supported currencies.

### 5.4 Viewing Payment History (12-Period Grid)

Each credit account has an associated payment history showing a 12-period performance grid:

1. Navigate to a borrower's detail page.
2. Click on a credit account to view its details.
3. The payment history grid shows:
   - **Period** — Month/Year
   - **Amount Due** — Scheduled payment amount
   - **Amount Paid** — Actual payment received
   - **Status** — On Time, Late, Missed, or Partial
   - **Days Late** — Number of days payment was late (if applicable)

---

## 6. Credit Search & Reports

### 6.1 Single Borrower Search

1. Navigate to **Credit Search** from the sidebar.
2. Enter a borrower's **National ID** or **Name** in the search field.
3. Select the **Purpose** for the inquiry:
   - New Credit
   - Review
   - Collection
   - Regulatory
   - Portfolio Monitoring
4. Confirm that **Consent** has been provided.
5. Click **Search** to perform the credit reference check.
6. Results display the borrower's credit summary including active accounts, credit score, and inquiry history.

### 6.2 Bulk Credit Search (Multiple IDs)

1. Navigate to **Credit Search**.
2. Select the **Bulk Search** option.
3. Enter multiple national IDs (one per line or comma-separated).
4. Select the inquiry purpose.
5. Click **Submit** to perform batch credit reference checks.
6. Results are returned for each identifier, showing found/not-found status.

### 6.3 Generating Credit Reports

1. From a borrower's detail page or the credit search results, click **Generate Credit Report**.
2. Select the **Purpose** for the report.
3. The system generates a comprehensive credit report containing:
   - Borrower personal/company information
   - Credit score (300-850 range)
   - Reason codes explaining the score
   - All credit accounts with status and balances
   - Payment performance history
   - Credit inquiries
   - Court judgments
   - Consent records
   - Report serial number

### 6.4 Understanding Credit Scores (300-850)

The credit scoring algorithm assigns a score between 300 and 850:

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 750-850 | Excellent | Very low credit risk |
| 700-749 | Good | Low credit risk |
| 650-699 | Fair | Moderate credit risk |
| 550-649 | Poor | High credit risk |
| 300-549 | Very Poor | Very high credit risk |

Factors that affect the credit score include:
- On-time payment ratio
- Number of delinquent accounts
- Written-off accounts
- Number of recent inquiries
- Court judgments
- Debt levels

### 6.5 Reason Codes Explained

Credit reports include reason codes that explain the primary factors affecting a borrower's credit score:

| Reason Code | Description |
|-------------|-------------|
| DELINQUENT_ACCOUNTS | Borrower has one or more delinquent accounts |
| WRITTEN_OFF_ACCOUNTS | Borrower has accounts that have been written off |
| RESTRUCTURED_ACCOUNTS | Borrower has restructured loan facilities |
| HIGH_INQUIRY_VOLUME | High number of recent credit inquiries |
| HIGH_DEBT_LEVEL | Total debt level is elevated |
| COURT_JUDGMENTS_PRESENT | Active court judgments exist against the borrower |
| POLITICALLY_EXPOSED_PERSON | Borrower is flagged as a PEP |
| STRONG_REPAYMENT_HISTORY | Consistent on-time payment history (positive) |
| EXCELLENT_PAYMENT_RECORD | Outstanding payment track record (positive) |
| THIN_FILE_LIMITED_HISTORY | Limited credit history available |

### 6.6 Report Serial Numbers

Each generated credit report is assigned a unique serial number in the format:

```
CR-{YEAR}-{unique_identifier}
```

Example: `CR-2025-k8f3x2m1`

This serial number serves as a reference for the report and can be used for audit and tracking purposes.

### 6.7 Printing Reports

1. After generating a credit report, click the **Print** button.
2. The report opens in a print-friendly format.
3. Use your browser's print dialog to print or save as PDF.
4. The printed report includes all sections, the serial number, generation timestamp, and a footer disclaimer.

### 6.8 Multi-Language PDF Reports

The credit report page includes a **language selector** that allows you to download PDF reports in multiple languages:

1. On the credit report page, locate the language selector dropdown.
2. Choose from the available languages:
   - **English (EN)**
   - **French (FR)**
   - **Arabic (AR)**
   - **Swahili (SW)**
3. Click the **Download PDF** button.
4. The PDF report will be generated in the selected language, with all headings, labels, and content translated accordingly.

---

## 7. Maker-Checker Workflow

The maker-checker (four-eye principle) workflow ensures data integrity by requiring a second authorized user to approve changes.

### 7.1 How Changes Are Submitted

When you create or modify a borrower or credit account:

1. Your change is **not applied immediately**.
2. Instead, a **pending approval request** is created.
3. You will see a confirmation message: "Submitted for maker-checker approval."
4. Authorized reviewers (Admin and Regulator roles) receive a notification.

### 7.2 Reviewing Pending Approvals

1. Navigate to **Pending Approvals** from the sidebar.
2. The page displays all pending approval requests with:
   - Entity type (borrower or credit account)
   - Action (Create or Update)
   - Requester name
   - Submission date
   - Current status
3. Click on a pending request to review the details.

### 7.3 Approving/Rejecting with Notes

1. Open a pending approval request.
2. Review the submitted data carefully.
3. Choose one of the following actions:
   - **Approve** — The change will be applied to the database.
   - **Reject** — The change will be discarded.
4. Optionally enter **Review Notes** explaining your decision.
5. Click the appropriate button to submit your decision.
6. The requester will receive a notification about the decision.

### 7.4 Self-Approval Prevention Rule

The system enforces a strict rule: **you cannot approve your own requests**. This means:
- If you submitted a borrower registration, a different Admin or Regulator must approve it.
- Attempting to approve your own request will result in an error message.
- This ensures true four-eye principle compliance.

---

## 8. Dispute Management

The Dispute Management module handles borrower complaints and data correction requests.

### 8.1 Filing a Dispute

1. Navigate to **Disputes** from the sidebar.
2. Click the **File Dispute** button.
3. Fill in the required fields:
   - **Borrower** — Select the borrower from the dropdown
   - **Credit Account** — Optionally select the specific account in question
   - **Dispute Type** — Select from:
     - Data Error
     - Identity Theft
     - Unauthorized Inquiry
     - Duplicate Record
     - Other
   - **Description** — Provide a detailed description of the issue
   - **Correction Type** — Select:
     - Financial (2-day SLA)
     - Non-Financial (5-day SLA)
4. Click **File Dispute** to submit.

### 8.2 SLA Tracking (2-Day Financial, 5-Day Non-Financial)

The system automatically calculates and tracks SLA deadlines:

- **Financial corrections**: Must be resolved within **2 working days** (DQ-04)
- **Non-financial corrections**: Must be resolved within **5 working days** (DQ-05)

The SLA deadline is displayed in the disputes table. If the deadline has passed and the dispute is still open, a red "Breached" badge is shown.

### 8.3 Resolving Disputes

1. In the disputes table, click the **Resolve** button next to an open dispute (or click the row to open the resolve dialog).
2. Select the new status:
   - **Under Review** — Investigation in progress
   - **Resolved** — Issue has been corrected
   - **Rejected** — Dispute was found to be invalid
3. Enter **Resolution Notes** describing the outcome.
4. Click **Update Dispute** to save.

### 8.4 Viewing Dispute History

The disputes table shows all disputes with their current status, type, SLA deadline, and filing date. You can review the full history of disputes including resolutions and timestamps.

---

## 9. Court Judgments

The Court Judgments module tracks legal proceedings and court orders against borrowers (FR-COL-05).

### 9.1 Adding Court Judgments

1. Navigate to a borrower's detail page.
2. In the **Court Judgments** section, click **Add Judgment**.
3. Fill in the required fields:
   - **Case Number** — Court case reference number
   - **Court** — Name of the court
   - **Judgment Type** — Select from:
     - Lien
     - Bankruptcy
     - Lawsuit
     - Civil Judgment
     - Criminal Conviction
   - **Amount** — Monetary value of the judgment (if applicable)
   - **Currency** — Currency of the judgment amount
   - **Judgment Date** — Date the judgment was issued
   - **Status** — Active, Resolved, or Appealed
   - **Description** — Additional details about the judgment
4. Click **Submit** to create the judgment record.

### 9.2 Viewing Judgments by Borrower

Court judgments are displayed on the borrower's detail page and are included in credit reports. Each judgment shows:
- Case number and court name
- Judgment type and status
- Amount and currency
- Date of judgment

### 9.3 Judgment Types

| Type | Description |
|------|-------------|
| **Lien** | A legal claim against property as security for a debt |
| **Bankruptcy** | Formal declaration of inability to pay debts |
| **Lawsuit** | A pending or concluded civil legal action |
| **Civil Judgment** | A court order in a civil case (e.g., debt recovery) |
| **Criminal Conviction** | A criminal court finding relevant to financial matters |

---

## 10. Consent Management

The Consent Management module manages data subject consent for sharing credit information (FR-CON-06/07).

### 10.1 Granting Consent

1. Navigate to **Consent Management** from the sidebar.
2. Click the **Grant Consent** button.
3. Fill in the required fields:
   - **Borrower** — Select the borrower granting consent
   - **Granted To** — Name of the institution or party receiving consent
   - **Purpose** — Reason for data sharing (e.g., credit assessment, regulatory review)
   - **Consent Type** — Type of consent (e.g., inquiry, data sharing, full access)
4. Click **Grant Consent** to create the consent record.

### 10.2 Receipt Numbers

Each consent record is automatically assigned a unique receipt number in the format:

```
CR-{timestamp}-{random_identifier}
```

This receipt number serves as proof of consent and can be provided to the borrower or requesting institution.

### 10.3 Revoking Consent

1. In the consent records table, find the active consent record.
2. Click the **Revoke** button.
3. The consent status will be changed to "Revoked" and the revocation timestamp will be recorded.
4. Once revoked, the institution can no longer access the borrower's credit data under this consent.

### 10.4 Viewing Consent Records

The consent management page displays all consent records with:
- Borrower name and ID
- Institution the consent is granted to
- Purpose and consent type
- Status (Active or Revoked)
- Receipt number
- Grant date and revocation date (if applicable)

---

## 11. Institution Management (Admin Only)

The Institution Management module is available only to users with the **Admin** role.

### 11.1 Registering Institutions

1. Navigate to **Institutions** from the sidebar.
2. Click the **Register** button.
3. Fill in the required fields:
   - **Name** — Institution name
   - **Type** — Select from:
     - Bank
     - MFI (Microfinance Institution)
     - Utility
     - Telecom
     - Digital Lender
     - SACCO (Savings and Credit Cooperative)
   - **Registration Number** — Official registration/license number
   - **Country** — Country of operation
   - **Contact Email** — Primary email address
   - **Contact Phone** — Primary phone number
   - **Address** — Physical address
   - **Submission Frequency** — How often the institution submits data:
     - Daily
     - Weekly
     - Monthly
4. Click **Register** to submit the institution for approval.

### 11.2 Approving Institutions

Newly registered institutions have a "Pending" status and require admin approval:

1. In the institutions table, locate institutions with "Pending" status.
2. Click the **Approve** button.
3. The institution status will change to "Active."
4. Active institutions can then be assigned API keys for data submission.

### 11.3 Configuring Submission Frequency

The submission frequency determines how often an institution is expected to submit credit data. This can be set during registration and is displayed in the institution details.

### 11.4 Institution Types

| Type | Description |
|------|-------------|
| **Bank** | Commercial or retail bank |
| **MFI** | Microfinance institution |
| **Utility** | Utility service provider |
| **Telecom** | Telecommunications company |
| **Digital Lender** | Digital/mobile lending platform |
| **SACCO** | Savings and Credit Cooperative Organization |

### 11.5 Pagination

The institutions list supports pagination for large datasets:
- Use **Previous** and **Next** buttons to navigate pages.
- 50 records are displayed per page.

---

## 12. Billing (Admin/Regulator)

The Billing module manages invoices and fee tracking for data provider institutions. It is accessible to users with **Admin** or **Regulator** roles.

### 12.1 Creating Invoices

1. Navigate to **Billing** from the sidebar.
2. Click the **Create Invoice** button.
3. Fill in the required fields:
   - **Institution Name** — Name of the institution being billed
   - **Service Type** — Select from:
     - Data Submission
     - Credit Report
     - API Access
     - Subscription
   - **Amount** — Invoice amount
   - **Currency** — Currency (ETB, USD, KES, GHS, UGX)
   - **Invoice Number** — Unique invoice reference number
   - **Period Start** — Billing period start date
   - **Period End** — Billing period end date
4. Click **Create Invoice** to save.

### 12.2 Tracking Payment Status

The billing page displays three summary cards:
- **Total Revenue** — Sum of all invoice amounts
- **Pending Amount** — Sum of unpaid invoices
- **Overdue Amount** — Sum of overdue invoices

Invoice statuses:
| Status | Description |
|--------|-------------|
| **Pending** | Invoice has been issued but not yet paid |
| **Paid** | Invoice has been paid in full |
| **Overdue** | Invoice is past its due date and unpaid |

### 12.3 Service Types

| Service Type | Description |
|-------------|-------------|
| **Data Submission** | Fee for submitting credit data to the registry |
| **Credit Report** | Fee for generating credit reports |
| **API Access** | Fee for external API usage |
| **Subscription** | Periodic subscription fee |

### 12.4 Viewing Invoice Details

Click on any row in the billing table to open a detailed view showing:
- Invoice number and status
- Institution name
- Service type
- Amount and currency
- Billing period dates
- Creation date

---

## 13. Helpdesk

The Helpdesk (Inquiry Service Unit) portal provides a unified interface for consumer service operations.

### 13.1 Searching for Borrowers

1. Navigate to **Helpdesk** from the sidebar.
2. Review the summary cards showing:
   - Open Inquiries count
   - SLA Breaches count
   - Resolved Today count
3. Enter a borrower's name or national ID in the search field.
4. Results appear as clickable cards below the search field.
5. Click on a borrower card to select them and view their details.

### 13.2 Viewing Borrower Information, Disputes, and Consent

Once a borrower is selected, the helpdesk displays:
- **Borrower Information** — National ID, phone, email, type
- **Disputes** — All disputes associated with the borrower, including type, description, status, SLA deadline, and filing date
- **Consent Records** — All consent records for the borrower, showing granted-to institution, purpose, consent type, status, receipt number, and grant date

### 13.3 Filing Disputes from Helpdesk

1. With a borrower selected, click the **File Dispute** button.
2. The borrower name is pre-populated.
3. Fill in:
   - **Credit Account ID** (optional)
   - **Dispute Type** — Incorrect Balance, Wrong Status, Identity Error, Unauthorized Inquiry, Other
   - **Correction Type** — Financial or Non-Financial
   - **Description** — Detailed description of the issue
4. Click **File Dispute** to submit.

### 13.4 Granting Consent from Helpdesk

1. With a borrower selected, click the **Grant Consent** button.
2. Fill in:
   - **Granted To** — Institution or party name
   - **Purpose** — Reason for data sharing
   - **Consent Type** — Type of consent being granted
3. Click **Grant Consent** to create the record.
4. A receipt number is automatically generated and assigned.

---

## 14. Batch Upload

The Batch Upload module allows bulk data ingestion through JSON or CSV file uploads.

### 14.1 Preparing JSON Data

Create a JSON file containing an array of credit account records. Each record should include:

```json
[
  {
    "borrowerId": "borrower-uuid",
    "lenderInstitution": "Bank Name",
    "accountNumber": "ACC-001",
    "accountType": "Personal Loan",
    "originalAmount": "50000.00",
    "currentBalance": "35000.00",
    "currency": "ETB",
    "interestRate": "12.50",
    "status": "current"
  }
]
```

### 14.2 Preparing CSV Data

Create a CSV file with headers matching the required fields:

```csv
borrowerId,lenderInstitution,accountNumber,accountType,originalAmount,currentBalance,currency,interestRate,status
uuid-1,Bank A,ACC-001,Personal Loan,50000.00,35000.00,ETB,12.50,current
uuid-2,Bank B,ACC-002,Mortgage,200000.00,180000.00,ETB,9.00,current
```

### 14.3 Uploading Files

1. Navigate to **Batch Upload** from the sidebar.
2. Select the file type (JSON or CSV).
3. Click the **Upload** button or drag and drop your file into the upload area.
4. The system processes the file and validates each record.

### 14.4 Reviewing Validation Results

After upload, the system displays:
- **Total Records** — Number of records in the file
- **Successful** — Records that passed validation and were imported
- **Failed** — Records that had validation errors

### 14.5 Downloading Error Reports

If any records fail validation:
1. Review the error details showing which records failed and why.
2. Each error includes the record number, field name, and error description.
3. Correct the errors in your source file and re-upload.

---

## 15. Audit Trail (Admin/Regulator)

The Audit Trail provides an immutable log of all system activities. It is accessible to users with **Admin** or **Regulator** roles.

### 15.1 Viewing System Activity

1. Navigate to **Audit Trail** from the sidebar.
2. The audit log displays entries with:
   - **Timestamp** — When the action occurred
   - **User** — Who performed the action
   - **Action** — Type of action performed
   - **Entity** — What type of entity was affected
   - **Entity ID** — Identifier of the affected record
   - **Details** — Description of what happened
   - **IP Address** — IP address of the user

### 15.2 Understanding Action Types

| Action | Description |
|--------|-------------|
| LOGIN | User logged into the system |
| LOGOUT | User logged out |
| LOGIN_FAILED | Failed login attempt |
| ACCOUNT_LOCKED | Account was locked after failed attempts |
| CREATE | New record was created |
| UPDATE | Existing record was modified |
| VIEW | Record was viewed/accessed |
| SUBMIT_APPROVAL | Change was submitted for maker-checker approval |
| APPROVE | Pending approval was approved |
| REJECT | Pending approval was rejected |
| FILE_DISPUTE | New dispute was filed |
| RESOLVE_DISPUTE | Dispute was resolved |
| PASSWORD_CHANGE | User changed their password |

### 15.3 Filtering Entries

The audit trail can be filtered and searched by:
- Date range
- User
- Action type
- Entity type
- IP address

### 15.4 Timeline View

The audit trail offers an alternative **Timeline View** for visualizing activity in a vertical feed:

1. Click the **Timeline View** toggle at the top of the audit trail page.
2. Entries are displayed as a vertical timeline with colored indicator dots:
   - **Green dot** — CREATE actions (new records created)
   - **Blue dot** — UPDATE actions (existing records modified)
   - **Red dot** — DELETE actions (records removed)
3. Each timeline entry shows the timestamp, user, action, entity, and details in a card-style layout.
4. Toggle back to the standard table view at any time.

### 15.5 Date Range Filters

To narrow audit trail entries by date:

1. Locate the **From** and **To** date input fields at the top of the audit trail page.
2. Enter a start date in the **From** field.
3. Enter an end date in the **To** field.
4. The audit trail entries will automatically filter to show only entries within the selected date range.
5. Clear the date fields to remove the filter and show all entries.

### 15.6 Export (CSV and Excel)

The audit trail supports exporting entries in both CSV and Excel formats:

1. Click the **Export CSV** button to download audit trail data as a comma-separated values file.
2. Click the **Export Excel** button to download audit trail data as a formatted XLSX spreadsheet.
3. The exported file includes all currently filtered entries (respecting any active date range or other filters).

---

## 16. User Management (Admin Only)

The User Management module is available only to users with the **Admin** role.

### 16.1 Creating Users

1. Navigate to **User Management** from the sidebar.
2. Click the **Add User** button.
3. Fill in the required fields:
   - **Username** — Unique login username
   - **Password** — Initial password (must meet complexity requirements)
   - **Full Name** — User's full name
   - **Email** — User's email address
   - **Role** — Select from Admin, Regulator, Lender, or Viewer
   - **Institution** — Associated institution name (optional)
4. Click **Create User** to save.

### 16.2 Assigning Roles

Each user is assigned one of four roles:

| Role | Description |
|------|-------------|
| **Admin** | Full system access including user management, institutions, and API keys |
| **Regulator** | Access to most modules including approvals, audit trail, and billing |
| **Lender** | Access to borrowers, credit accounts, disputes, and batch upload |
| **Viewer** | Read-only access to borrowers, credit accounts, and reports |

### 16.3 Changing User Status

User accounts can have one of three statuses:

| Status | Description |
|--------|-------------|
| **Active** | User can log in and access the system normally |
| **Suspended** | User is temporarily blocked from logging in |
| **Deactivated** | User is permanently blocked from logging in |

To change a user's status:
1. In the user management table, click the **Edit** action on the target user.
2. Update the status field.
3. Click **Save** to apply the change.

### 16.4 Understanding Role Permissions

See **Appendix B: Role Access Matrix** for a complete breakdown of what each role can access.

---

## 17. API Keys (Admin Only)

The API Keys module allows administrators to manage external API access for institutions.

### 17.1 Generating API Keys for Institutions

1. Navigate to **API Keys** from the sidebar.
2. Click the **Generate Key** button.
3. Fill in the required fields:
   - **Institution** — Select an active institution from the dropdown
   - **Label** — A descriptive name for the key (e.g., "Production Key")
   - **Permissions** — Select the permission level:
     - **Submit** — Can submit borrowers, accounts, and payment data
     - **Read** — Can search borrowers and retrieve credit reports
     - **Full** — Both submit and read permissions
4. Click **Generate Key**.
5. The generated API key will be displayed **once only**. Copy it immediately.

### 17.2 Understanding Permission Levels

| Permission | Capabilities |
|-----------|-------------|
| **Submit** | POST borrowers, credit accounts, payment history, court judgments |
| **Read** | GET borrower search, credit reports, credit accounts |
| **Full** | All submit and read capabilities combined |

### 17.3 Revoking Keys

1. In the API keys table, find the key you want to revoke.
2. Click the **Revoke** button.
3. The key status will change to "Revoked" and it can no longer be used for API authentication.
4. Revocation is irreversible; a new key must be generated if access is needed again.

### 17.4 Viewing Usage

The API keys table shows:
- **Key Prefix** — First few characters of the key for identification
- **Label** — Descriptive name
- **Institution** — Associated institution
- **Permissions** — Permission level
- **Status** — Active or Revoked
- **Last Used** — Last time the key was used for API authentication
- **Created** — When the key was generated

---

## 18. Reports & Export

The Reports module provides analytical views and data export capabilities.

### 18.1 CSV and Excel Export (Portfolio/Borrowers/Audit)

1. Navigate to **Reports** from the sidebar (via Credit Reports).
2. Select the export type:
   - **Portfolio Export** — All credit accounts with balances and statuses
   - **Borrowers Export** — All borrower records
   - **Audit Trail Export** — Audit log entries
3. Choose your preferred format:
   - Click **Export CSV** to download data as a comma-separated values file.
   - Click **Export Excel** to download data as a formatted XLSX spreadsheet with styled headers and auto-sized columns.
4. The file will be downloaded to your computer.

### 18.2 Regulatory Analytics View

The regulatory analytics section provides:
- **NPL Ratios** — Non-Performing Loan ratios by institution and loan type
- **Portfolio Breakdowns** — Distribution of credit by type, status, and currency
- **SLA Breach Tracking** — Disputes that have exceeded their SLA deadlines
- **Data submission compliance** — Institutions meeting their submission frequency requirements

---

## 19. Notifications

The notification system keeps you informed about important events in the system.

### 19.1 Notification Bell

The notification bell icon is located in the top header bar. It provides quick access to your notifications via a **popover dropdown**.

1. Click the bell icon in the header to open the notification popover.
2. The popover displays your most recent notifications in a scrollable list.
3. The system automatically checks for new notifications every **30 seconds** (polling), so new notifications will appear without refreshing the page.
4. Click outside the popover or press Escape to close it.

### 19.2 Unread Count Badge

A red badge on the notification bell shows the number of unread notifications. The badge disappears when all notifications are read. The count updates automatically with each polling cycle (every 30 seconds).

### 19.3 Marking as Read

1. Click the notification bell to open the notifications popover.
2. Click on an individual notification to mark it as read.
3. Clicking a notification may also navigate you to the relevant page (e.g., Pending Approvals).
4. Read notifications appear with reduced visual emphasis compared to unread ones.

### 19.4 Mark All Read

Click the **Mark All as Read** button at the top of the notifications popover to mark all notifications as read at once.

### 19.5 Notification Types

| Type | Trigger |
|------|---------|
| **Approval Pending** | A new maker-checker request requires your review |
| **Approval Result** | Your submitted request has been approved or rejected |
| **Dispute Filed** | A new dispute has been filed |
| **System Alert** | Important system notifications |

---

## 20. FAQ / "How Do I...?"

### Q: How do I reset my password?
A: Click the password change option in the sidebar, enter your current password and new password, then click Change Password. If you've forgotten your password, contact your system administrator.

### Q: How do I register a new borrower?
A: Navigate to Borrowers, click "Register Borrower", fill in the form, and submit. Your request will go through maker-checker approval before the borrower is created.

### Q: Why can't I approve my own submission?
A: The system enforces a maker-checker (four-eye) principle. A different authorized user must approve your submissions to ensure data integrity.

### Q: What happens when my session times out?
A: After 15 minutes of inactivity, you are automatically logged out. Navigate to the login page and sign in again. Any unsaved changes will be lost.

### Q: How do I search for a borrower?
A: Use the search bar on the Borrowers page. You can search by name, national ID, or other identifying information.

### Q: What is a PEP flag?
A: PEP stands for Politically Exposed Person. This flag indicates that a borrower holds or has held a prominent public position.

### Q: How long do I have to resolve a dispute?
A: Financial corrections must be resolved within 2 working days. Non-financial corrections must be resolved within 5 working days.

### Q: How do I generate a credit report?
A: Navigate to a borrower's detail page and click "Generate Credit Report", or use the Credit Search page to search for a borrower and then generate the report.

### Q: Can I export data from the system?
A: Yes. Navigate to Reports and use the CSV Export feature to download portfolio or borrower data.

### Q: How do I switch languages?
A: Click the language toggle button (EN/FR/PT) in the top header bar or on the login page. The interface will switch immediately.

### Q: How do I switch between light and dark mode?
A: Click the theme toggle icon (sun/moon) in the header bar.

### Q: How do I grant consent for a borrower?
A: Navigate to Consent Management and click "Grant Consent", or use the Helpdesk module to grant consent for a selected borrower.

### Q: What are the API keys used for?
A: API keys enable external institutions to programmatically submit data and retrieve credit reports through the External API.

### Q: How do I upload data in bulk?
A: Use the Batch Upload page. Prepare your data in JSON, CSV, or XBRL format and upload the file. The system validates each record and reports any errors.

### Q: How do I enable MFA?
A: Go to your profile settings and click "Enable MFA." You will be shown a QR code or setup URI to scan with your authenticator app. Enter the 6-digit code to verify and activate MFA.

### Q: How do I verify audit log integrity?
A: Navigate to the Audit Trail page and click the "Verify Integrity" button. The system will validate the SHA-256 hash chain and display whether the logs are intact.

### Q: What is the dispute chatbot?
A: The dispute chatbot is a guided assistant available on the Helpdesk page. It walks you through filing a dispute step by step: selecting the issue type, finding the borrower, choosing the account, entering a description, and submitting.

### Q: Can I use OAuth tokens instead of API keys?
A: Yes. You can exchange your API key for a Bearer token using the OAuth 2.1 token endpoint. The token is valid for 1 hour and can be used in the `Authorization: Bearer` header.

### Q: Who can approve pending requests?
A: Users with the Admin or Regulator role can approve or reject pending requests, as long as they did not submit the request themselves.

### Q: How do I add a court judgment?
A: Navigate to a borrower's detail page, find the Court Judgments section, and click "Add Judgment." Only Admin and Regulator users can create court judgments.

### Q: What currencies does the system support?
A: The system supports 42+ African currencies plus USD, EUR, and GBP (45+ total). See Appendix C for the complete list.

### Q: How do I use the interactive demo tour?
A: The interactive guided tour launches automatically after you log in via the demo environment. It walks you through 11 key features of the system with a spotlight overlay and descriptive tooltips. Use the Next, Back, Skip, and Close buttons to navigate the tour. If you want to relaunch the tour after it has ended, click the "Take a Tour" button in the amber demo banner at the top of the page.

---

## 21. Multi-Factor Authentication (MFA)

> This section covers ENT-01. For other enterprise enhancements, see: Fuzzy Matching (§21.4), Dispute Chatbot (§22), XBRL Upload (§23), Audit Integrity (§24), OAuth 2.1 (§21.5), Low-Bandwidth (§21.6).

The system supports TOTP-based Multi-Factor Authentication (MFA) for enhanced login security.

### 21.1 Enabling MFA

1. Log in to the system normally.
2. Navigate to your profile or MFA settings (accessible from the sidebar or user menu).
3. Click **Enable MFA** or **Set Up MFA**.
4. The system generates a TOTP secret and displays an `otpauth://` URI.
5. Scan the QR code or manually enter the secret into your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.).
6. Enter the 6-digit code displayed by your authenticator app.
7. Click **Verify** to activate MFA.
8. A success message confirms MFA is now enabled.

### 21.2 Logging In with MFA

1. Enter your username and password on the login page.
2. Click **Sign In**.
3. If MFA is enabled, a second screen appears asking for your TOTP code.
4. Open your authenticator app and enter the current 6-digit code.
5. Click **Verify** to complete login.

### 21.3 Disabling MFA

1. Log in to the system.
2. Navigate to MFA settings.
3. Click **Disable MFA**.
4. MFA is immediately disabled. Future logins will only require username and password.

### 21.4 Fuzzy Entity Matching (ENT-02)

When registering a new borrower, the system automatically checks for potential duplicates using fuzzy name matching. If similar borrowers are found:

1. A **warning banner** appears on the registration form listing borrowers with similar names and their similarity scores.
2. Review the listed matches to determine if the borrower already exists in the system.
3. If the borrower is genuinely new, proceed with registration. If a duplicate, cancel and use the existing record.

This feature helps prevent duplicate records and potential identity fraud across jurisdictions.

### 21.5 OAuth 2.1 Bearer Tokens (ENT-04)

For institutions using the External API, OAuth 2.1 Bearer tokens provide an alternative to API key authentication:

1. Navigate to the **API Documentation** page from the sidebar.
2. Scroll to the **OAuth 2.1** section for token exchange instructions and example code.
3. Use `POST /api/external/oauth/token` with your API key credentials to obtain a Bearer token.
4. Include the token in the `Authorization: Bearer <token>` header on API requests.
5. Tokens expire after **1 hour** and must be refreshed by requesting a new token.

### 21.6 Low-Bandwidth Optimizations (ENT-05)

The system includes built-in optimizations for users on slower or constrained networks:

- **Compressed responses** — All server responses are gzip-compressed, reducing data transfer.
- **Lazy-loaded pages** — Navigation pages load on demand rather than all at once, resulting in a brief loading spinner when visiting a page for the first time.
- No user action is required; these optimizations are always active.

---

## 22. Dispute Chatbot

The Dispute Chatbot provides a guided, chat-style interface for filing disputes.

### 22.1 Accessing the Chatbot

1. Navigate to **Helpdesk** from the sidebar.
2. Look for the chatbot interface or button on the helpdesk page.

### 22.2 Using the Chatbot

The chatbot walks you through dispute filing in the following steps:

1. **Select Issue Type** — Choose the type of dispute (e.g., Data Error, Identity Theft, Unauthorized Inquiry, Duplicate Record, Other).
2. **Find Borrower** — Search for the affected borrower by name or national ID.
3. **Select Account** — Optionally select the specific credit account related to the dispute.
4. **Describe the Issue** — Enter a detailed description of the problem.
5. **Confirm and Submit** — Review the summary and confirm to auto-file the dispute.

### 22.3 Cancelling

You can cancel the chatbot flow at any time. The interface will reset and you can start a new guided flow.

### 22.4 AI Assistant Mode

The Dispute Chatbot includes an **AI Assistant mode** that provides intelligent answers to questions about credit data, regulations, and platform features:

1. In the chatbot header, click the **Sparkles icon** to switch to AI Assistant mode.
2. The chatbot interface changes to indicate AI mode is active.
3. Type any question related to credit data, regulatory requirements, or platform functionality.
4. The AI assistant responds using **streaming responses**, so you will see the answer appear progressively in real time.
5. Full conversation history is maintained within the session, allowing you to ask follow-up questions.
6. Click the Sparkles icon again to return to the standard guided dispute flow.

---

## 23. XBRL Upload

The Batch Upload module supports XBRL/XML file format in addition to JSON and CSV.

### 23.1 Accessing XBRL Upload

1. Navigate to **Batch Upload** from the sidebar.
2. Click the **XBRL** tab (next to the JSON/CSV tab).

### 23.2 Preparing XBRL Data

The XBRL tab displays a sample XML format showing the expected structure for credit account records. Use this sample as a template when preparing your XBRL file.

### 23.3 Uploading XBRL Files

1. On the XBRL tab, click the upload area or drag and drop your `.xbrl` or `.xml` file.
2. The system parses the XML and validates each record.
3. Results are displayed showing successful imports and any validation errors.

---

## 24. Audit Log Integrity Verification

The Audit Trail includes a tamper-evident hash chain that provides cryptographic proof that no log entries have been modified or deleted.

### 24.1 Checking Integrity

1. Navigate to **Audit Trail** from the sidebar (Admin/Regulator access required).
2. Look for the integrity badge at the top of the page, showing "Valid" (green) or "Broken" (red).
3. Click the **Verify Integrity** button to run a fresh verification.

### 24.2 Understanding Results

- **Valid** — All audit log entries pass hash chain verification. No tampering detected.
- **Broken** — The hash chain is broken at a specific entry, indicating potential tampering or data corruption.

### 24.3 How It Works

Each audit log entry contains a SHA-256 hash computed from:
- The previous entry's hash (creating a chain)
- The action, entity, details, and timestamp of the current entry

If any entry is modified, deleted, or inserted out of order, the hash chain breaks and the integrity check fails.

---

## 25. Exchange Rate Management

The Exchange Rate Management module allows administrators to configure and manage currency exchange rates used throughout the system.

### 25.1 Viewing Exchange Rates

1. Navigate to **Exchange Rates** from the Administration section in the sidebar (Admin access required).
2. The page displays a table of all configured exchange rates, including:
   - **Base Currency** — The source currency
   - **Target Currency** — The destination currency
   - **Rate** — The current exchange rate
   - **Effective Date** — When the rate became effective
3. Use the search or filter controls to locate specific currency pairs.

### 25.2 Adding a New Exchange Rate

1. Click the **Add Rate** button at the top of the Exchange Rates page.
2. Fill in the required fields:
   - **Base Currency** — Select the source currency from the dropdown
   - **Target Currency** — Select the destination currency from the dropdown
   - **Rate** — Enter the exchange rate value
3. Click **Save** to create the exchange rate record.

### 25.3 Editing an Exchange Rate

1. Locate the exchange rate you wish to update in the table.
2. Click the **Edit** button (pencil icon) on the corresponding row.
3. Modify the rate value as needed.
4. Click **Save** to apply the changes.

### 25.4 Deleting an Exchange Rate

1. Locate the exchange rate you wish to remove in the table.
2. Click the **Delete** button (trash icon) on the corresponding row.
3. Confirm the deletion when prompted.
4. The exchange rate record will be permanently removed.

### 25.5 Currency Converter Widget

The Exchange Rates page includes a built-in currency converter widget:

1. In the converter section, select the **From** currency.
2. Select the **To** currency.
3. Enter the **Amount** you wish to convert.
4. The converted amount is displayed automatically based on the configured exchange rates.
5. If no exchange rate exists for the selected currency pair, a message will indicate that the rate is unavailable.

---

## 26. API Administration

The API Administration module allows administrators to configure and manage external API connections used by the system for integrations with third-party services.

### 26.1 Accessing API Administration

1. Navigate to **API Administration** from the Administration section in the sidebar (Admin access required).
2. The page displays all configured API connections organized by category.

### 26.2 API Categories

External APIs are organized into the following categories:

- **Weather** — Weather data services for regional information
- **Judicial** — Court and legal records lookup services
- **Payment Gateway** — Payment processing integrations
- **Other** — Additional external service integrations

### 26.3 Adding a New API Connection

1. Click the **Add API** button.
2. Fill in the required fields:
   - **Name** — A descriptive name for the API connection
   - **Category** — Select the API category (Weather, Judicial, Payment Gateway, Other)
   - **Base URL** — The root URL of the external API
   - **API Key** — The authentication key for the external service (if required)
   - **Description** — A brief description of the API's purpose
3. Click **Save** to create the API connection.

### 26.4 Editing an API Connection

1. Locate the API connection in the list.
2. Click the **Edit** button to modify its configuration.
3. Update the fields as needed (name, URL, API key, category, description).
4. Click **Save** to apply changes.

### 26.5 Testing API Connections

1. Locate the API connection you wish to test.
2. Click the **Test Connection** button.
3. The system will attempt to reach the configured URL and verify connectivity.
4. A success or failure message will be displayed indicating whether the API is reachable.

### 26.6 Managing API Categories

API categories help organize connections by their functional purpose. When adding or editing an API connection, select the appropriate category to keep configurations organized and easily discoverable by other administrators.

### 26.7 API Usage Analytics

The API Administration page includes an **API Usage Analytics** tab that provides real-time visibility into API request activity:

1. Navigate to **API Administration** and click the **API Usage Analytics** tab.
2. The analytics dashboard displays:
   - **Total Requests Today** — The total number of API requests made since midnight.
   - **Requests This Hour** — The number of API requests made in the current hour.
   - **Unique Endpoints** — The number of distinct API endpoints called.
3. Below the summary stats, a **Hourly Bar Chart** visualizes request volume over the past 24 hours.
4. A **Top Endpoints** table lists the most frequently called API endpoints with their request counts.
5. Data is tracked in-memory and resets when the server restarts.

---

## 27. Data Retention Policies

The Data Retention Policies module allows administrators and regulators to define how long credit data is retained per country, in compliance with jurisdictional regulations.

### 27.1 Viewing Retention Policies

1. Navigate to **Retention Policies** from the Administration section in the sidebar (Admin or Regulator access required).
2. The page displays a table of all configured retention policies, including:
   - **Country** — The jurisdiction the policy applies to
   - **Archive Period (Months)** — How long data is kept in an archived state before further action
   - **Expunge Period (Months)** — How long after archiving before data is permanently deleted
   - **Status** — Whether the policy is active or inactive
   - **Created/Updated dates**

### 27.2 Understanding Archive vs. Expunge Periods

- **Archive Period**: After this number of months, credit records for the specified country are moved to an archived state. Archived records are no longer included in active credit searches but can still be retrieved for regulatory or audit purposes.
- **Expunge Period**: After this additional number of months following archival, data is permanently deleted (expunged) from the system. Once expunged, data cannot be recovered.

For example, if a country has an archive period of 60 months and an expunge period of 24 months, records will be archived after 5 years and permanently deleted 2 years after archival (7 years total).

### 27.3 Adding a Retention Policy

1. Click the **Add Policy** button at the top of the Retention Policies page.
2. Fill in the required fields:
   - **Country** — Enter the country name or code
   - **Archive Period (Months)** — Number of months before data is archived
   - **Expunge Period (Months)** — Number of months after archiving before data is expunged
3. Click **Save** to create the retention policy.

### 27.4 Editing a Retention Policy

1. Locate the retention policy in the table.
2. Click the **Edit** button on the corresponding row.
3. Modify the archive period, expunge period, or other settings as needed.
4. Click **Save** to apply the changes.

### 27.5 Running Retention Enforcement

The **Run Enforcement** button triggers the retention enforcement process:

1. Click the **Run Enforcement** button at the top of the Retention Policies page.
2. The system will evaluate all active retention policies against current data.
3. Records that have exceeded their archive period will be moved to archived status.
4. Records that have exceeded their expunge period will be permanently deleted.
5. A confirmation message will display the results of the enforcement run, including the number of records archived and expunged.

**Important:** Running enforcement is an irreversible action for expunged records. Ensure retention periods are correctly configured before running enforcement.

---

## 28. Global Search

The Global Search feature provides a unified search experience across all entity types in the system.

### 28.1 Accessing Global Search

1. Navigate to **Credit Search** from the sidebar, or click the search icon in the header.
2. The search page displays a central search bar with a country filter dropdown.

### 28.2 Performing a Search

1. Enter your search term in the search field (borrower name, national ID, institution name, or account number).
2. Optionally select a **Country** from the dropdown to narrow results to a specific jurisdiction.
3. Click **Search** to execute the query.
4. The system searches simultaneously across:
   - **Borrowers** — Matches on name, national ID, passport number, company name
   - **Institutions** — Matches on institution name, registration number, contact email
   - **Credit Accounts** — Matches on account number, lender institution

### 28.3 Understanding Search Results

Results are displayed in categorized sections:

- **Borrowers** — Each result shows the borrower's profile photo (auto-generated avatar or uploaded photo), name, national ID, type (individual/corporate), country, city, and sector. Click a result to navigate to the borrower's detail page. A "View Report" button provides quick access to the borrower's credit report.
- **Institutions** — Each result shows the institution name, registration number, contact email, type, country, and status. Click a result to navigate to the Institutions page.
- **Credit Accounts** — Each result shows the lender institution, account number, account type, currency and balance, and account status. Click a result to navigate to the associated borrower's detail page.

### 28.4 Country Filter

The country filter dropdown lists all 54 supported African countries. When a country is selected:
- Only results from that country are returned.
- A "Clear" button appears to remove the country filter.
- The filter works in combination with the text search term.

---

## 29. ID Photos & Document Upload

The system supports profile photos and identification document uploads for borrowers.

### 29.1 Auto-Generated Profile Photos

Every borrower in the system automatically receives a profile photo generated by DiceBear. These avatars are:
- Unique to each borrower (generated from the borrower's ID as a seed)
- Displayed on borrower cards in search results and lists
- Displayed prominently on the borrower detail page
- Different styles for individual borrowers (person avatars) and corporate borrowers (initials)

### 29.2 Uploading a Custom Photo

To replace the auto-generated avatar with a real photo:

1. Navigate to a borrower's detail page.
2. Hover over the borrower's profile photo in the page header.
3. A **camera icon overlay** appears over the photo.
4. Click the camera icon to open a file picker.
5. Select an image file (JPEG, PNG, or other standard image formats).
6. **File size limit:** Maximum **5 MB** per photo.
7. The photo is uploaded and immediately replaces the auto-generated avatar.
8. A success toast notification confirms the upload.

### 29.3 Uploading an ID Document

To upload a scanned copy of a borrower's passport or national ID:

1. Navigate to a borrower's detail page.
2. Click the **Upload ID** button in the top-right header area, **or** click the upload prompt in the Personal Info card's ID Document section.
3. Select a file:
   - **Supported formats:** Images (JPEG, PNG) and PDF documents
   - **File size limit:** Maximum **10 MB** per document
4. The document is uploaded and displayed in the ID Document section of the Personal Info card.
5. A success toast notification confirms the upload.

### 29.4 Viewing and Replacing an ID Document

Once an ID document has been uploaded:
- It is displayed as a preview image in the Personal Info card.
- Hover over the document preview to reveal a **Replace** button.
- Click **Replace** to upload a new document, which overwrites the previous one.

### 29.5 File Storage

Uploaded files are stored server-side:
- Photos are saved in the `uploads/photos/` directory.
- ID documents are saved in the `uploads/documents/` directory.
- Files are served via authenticated routes — only logged-in users can access uploaded files.
- Filenames are randomized for security.

---

## 30. Demo Environment

The Demo Environment provides an interactive demonstration mode for stakeholders, investors, and evaluators to explore the system without needing pre-configured credentials.

### 30.1 Accessing the Demo

1. On the login page, locate the **"Try Interactive Demo"** button below the login form.
2. Click the button to enter the demo selection screen.

### 30.2 Choosing a Demo Role

The demo screen presents **3 role cards**, each representing a different user perspective:

| Role | Username | Description |
|------|----------|-------------|
| **Admin** | admin | Full system access — manage users, settings, all modules |
| **Regulator** | regulator1 | Regulatory oversight — compliance dashboard, approvals, audit trails |
| **Bank Officer** | cbe_user | Institutional user — submit credit data, search borrowers, file disputes |

Click any role card to instantly log in as that user.

### 30.3 Demo Environment Indicators

When using the demo environment:
- A **disclaimer notice** with an amber/warning background is displayed on the demo selection page, informing users that this is a demonstration environment with fictional data.
- All data in the demo environment is seeded test data (102,462 borrowers, 172,359 credit accounts, 3,218 disputes, 2,147 court judgments across 54 African countries).

### 30.4 Returning to Standard Login

From the demo selection screen, click the **"Back to Login"** button to return to the standard username/password login form.

### 30.5 Interactive Guided Tour

After logging in via the demo environment, an **11-step interactive guided tour** automatically launches to walk you through the system's key features.

**Tour Behavior:**
1. Upon demo login, the tour starts automatically, highlighting key UI elements one at a time.
2. A **spotlight overlay** dims the rest of the screen and draws attention to the currently highlighted element.
3. Each step displays a descriptive tooltip explaining the purpose and functionality of the highlighted element.

**Tour Steps Cover:**
- Sidebar navigation and module organization
- Dashboard stat cards and their drill-down functionality
- Portfolio growth chart and data visualizations
- Africa map and geographic coverage
- Credit search functionality
- System settings and configuration options

**Tour Controls:**
- **Next** — Advance to the next step
- **Back** — Return to the previous step
- **Skip** — End the tour immediately
- **Close** — Dismiss the current tour overlay

**Relaunching the Tour:**
- After the tour has been completed or skipped, you can relaunch it at any time by clicking the **"Take a Tour"** button displayed in the amber demo banner at the top of the page.

**Language Support:**
- The tour content is available in all **5 AU languages** (English, French, Portuguese, Arabic, Swahili).
- The tour language follows the current interface language setting.

---

## 31. AI-Powered Features

The Credit Registry System integrates AI-powered capabilities using OpenAI GPT-4o to provide intelligent analysis, summaries, and assistance across the platform.

### 31.1 AI Credit Risk Analysis

The AI Credit Risk Analysis feature provides an AI-generated risk assessment for individual borrowers:

1. Navigate to a **Borrower Detail** page (click any borrower from the Borrowers list).
2. Locate the purple **"AI Risk Analysis"** button on the borrower detail page.
3. Click the button to initiate the AI analysis. The system sends the borrower's credit data to the AI model for evaluation.
4. After a brief processing period, the results are displayed in an expandable **purple-gradient card** containing:
   - **Risk Level** — Categorized as Low, Medium, High, or Critical.
   - **Risk Score** — A numerical score from 0 to 100 (higher scores indicate greater risk).
   - **Summary** — A plain-language overview of the borrower's credit risk profile.
   - **Risk Factors** — A list of factors with their positive or negative impact on the borrower's risk assessment.
   - **Recommendations** — Actionable suggestions based on the analysis.
   - **Regulatory Flags** — Any regulatory concerns or compliance issues identified.
5. The analysis card can be expanded or collapsed as needed.

### 31.2 AI Report Summary

The AI Report Summary generates a plain-language summary of a borrower's credit history:

1. Navigate to a **Credit Report** page for any borrower.
2. Click the **"AI Summary"** button (identified by a Sparkles icon).
3. The AI processes the borrower's credit report data and generates a human-readable summary.
4. The summary is displayed in a **collapsible card** showing:
   - The borrower's name
   - A timestamp indicating when the summary was generated
   - A clear, plain-language description of the borrower's credit history, key metrics, and notable patterns
5. Click the card header to expand or collapse the summary.

### 31.3 AI Compliance Reports

The AI Compliance Reports feature generates regulatory compliance analysis for specific countries:

1. Navigate to **Regulatory Compliance** from the sidebar.
2. Select a **country** from the dropdown menu.
3. Click the **"Generate Report"** button.
4. The AI analyzes the regulatory landscape for the selected country and returns a formatted report containing:
   - **Compliance Score** — An overall compliance rating for the jurisdiction.
   - **Regulatory Body** — The relevant regulatory authority for the country.
   - **Data Protection Law** — Applicable data protection legislation.
   - **Risk Areas** — Identified areas of regulatory risk.
   - **Recommendations** — Suggested actions to improve compliance posture.
5. Results are displayed in a formatted card on the page.
6. This feature is available to users with **Admin**, **Super Admin**, or **Regulator** roles only.

### 31.4 AI Chatbot (Smart Mode)

For details on the AI-powered chatbot assistant, see **Section 22.4 — AI Assistant Mode** under the Dispute Chatbot section.

---

## Appendix A: Seed Credentials

The following credentials are pre-configured in the system for testing and demonstration purposes:

| Username | Password | Role | Institution |
|----------|----------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Regulator | NBE |
| cbe_user | cbe123 | Lender | CBE (Commercial Bank of Ethiopia) |
| dashen_user | dashen123 | Lender | Dashen Bank |
| awash_user | awash123 | Lender | Awash Bank |

**Important:** These credentials should be changed immediately in a production environment. All passwords should meet the system's password complexity requirements.

---

## Appendix B: Role Access Matrix

> **Note:** MFA setup/disable is available to all authenticated users. Audit integrity verification requires Admin or Regulator role. The dispute chatbot and XBRL upload follow the same access rules as Helpdesk and Batch Upload respectively.

| Module / Feature | Admin | Regulator | Lender | Viewer |
|-----------------|-------|-----------|--------|--------|
| Dashboard | Full Access | Full Access | Full Access | Full Access |
| Borrower Management | Full Access | Full Access | Full Access | Read Only |
| Credit Accounts | Full Access | Full Access | Full Access | Read Only |
| Credit Search & Reports | Full Access | Full Access | Full Access | Read Only |
| Pending Approvals (Review) | Approve/Reject | Approve/Reject | View Only | View Only |
| Dispute Management | Full Access | Full Access | Full Access | Read Only |
| Court Judgments (Create) | Yes | Yes | No | No |
| Consent Management | Full Access | Full Access | Full Access | Read Only |
| Audit Trail | Full Access | Full Access | No Access | No Access |
| Billing | Full Access | Full Access | No Access | No Access |
| Helpdesk | Full Access | Full Access | Full Access | Full Access |
| Batch Upload | Full Access | No Access | Full Access | No Access |
| User Management | Full Access | No Access | No Access | No Access |
| Institution Management | Full Access | No Access | No Access | No Access |
| API Keys | Full Access | No Access | No Access | No Access |
| Exchange Rates | Full Access | No Access | No Access | No Access |
| API Administration | Full Access | No Access | No Access | No Access |
| Retention Policies | Full Access | Full Access | No Access | No Access |
| Global Search | Full Access | Full Access | Full Access | Read Only |
| Reports & Export | Full Access | Full Access | Full Access | Full Access |
| Notifications | Full Access | Full Access | Full Access | Full Access |

---

## Appendix C: Supported Currencies

The system supports **42+ African currencies** plus USD, EUR, and GBP (45+ total), organized by region:

### East Africa

| Code | Currency Name | Symbol |
|------|--------------|--------|
| BIF | Burundian Franc | FBu |
| CDF | Congolese Franc | FC |
| DJF | Djiboutian Franc | Fdj |
| ERN | Eritrean Nakfa | Nfk |
| ETB | Ethiopian Birr | Br |
| KES | Kenyan Shilling | KSh |
| KMF | Comorian Franc | CF |
| RWF | Rwandan Franc | FRw |
| SOS | Somali Shilling | Sh |
| SSP | South Sudanese Pound | £ |
| TZS | Tanzanian Shilling | TSh |
| UGX | Ugandan Shilling | USh |

### West Africa

| Code | Currency Name | Symbol |
|------|--------------|--------|
| CVE | Cape Verdean Escudo | Esc |
| GHS | Ghanaian Cedi | ₵ |
| GMD | Gambian Dalasi | D |
| GNF | Guinean Franc | FG |
| LRD | Liberian Dollar | L$ |
| NGN | Nigerian Naira | ₦ |
| SLL | Sierra Leonean Leone | Le |
| XOF | West African CFA Franc | CFA |

### Southern Africa

| Code | Currency Name | Symbol |
|------|--------------|--------|
| AOA | Angolan Kwanza | Kz |
| BWP | Botswana Pula | P |
| LSL | Lesotho Loti | L |
| MGA | Malagasy Ariary | Ar |
| MUR | Mauritian Rupee | ₨ |
| MWK | Malawian Kwacha | MK |
| MZN | Mozambican Metical | MT |
| NAD | Namibian Dollar | N$ |
| SCR | Seychellois Rupee | ₨ |
| SZL | Swazi Lilangeni | E |
| ZAR | South African Rand | R |
| ZMW | Zambian Kwacha | ZK |
| ZWL | Zimbabwean Dollar | Z$ |

### Central Africa

| Code | Currency Name | Symbol |
|------|--------------|--------|
| STN | São Tomé Dobra | Db |
| XAF | Central African CFA Franc | FCFA |

### North Africa

| Code | Currency Name | Symbol |
|------|--------------|--------|
| DZD | Algerian Dinar | د.ج |
| EGP | Egyptian Pound | E£ |
| LYD | Libyan Dinar | ل.د |
| MAD | Moroccan Dirham | MAD |
| MRU | Mauritanian Ouguiya | UM |
| SDG | Sudanese Pound | ج.س |
| TND | Tunisian Dinar | د.ت |

### International

| Code | Currency Name | Symbol |
|------|--------------|--------|
| USD | US Dollar | $ |
| EUR | Euro | € |
| GBP | British Pound | £ |

---

## Appendix D: Glossary of Terms

| Term | Definition |
|------|-----------|
| **Borrower** | An individual or corporate entity that has obtained credit from a financial institution |
| **CDH** | Central Data Hub — the centralized repository for credit data across jurisdictions |
| **Consent** | Authorization granted by a data subject (borrower) for their credit information to be accessed |
| **Credit Account** | A loan, credit facility, or financial obligation associated with a borrower |
| **Credit Bureau** | An organization that collects and provides credit information |
| **Credit Inquiry** | A search/request for a borrower's credit information |
| **Credit Report** | A comprehensive summary of a borrower's credit history and creditworthiness |
| **Credit Score** | A numerical value (300-850) representing a borrower's creditworthiness |
| **Delinquent** | An account with past-due payments |
| **Default** | An account classified as non-performing due to prolonged non-payment |
| **Dispute** | A formal complaint about the accuracy of credit information |
| **Four-Eye Principle** | A control mechanism requiring two independent parties to verify an action (maker-checker) |
| **Grace Period** | A period after loan disbursement during which no payments are required |
| **ISU** | Inquiry Service Unit — the helpdesk function for consumer inquiries |
| **Lien** | A legal claim against property used as security for a debt |
| **Maker-Checker** | A workflow requiring one user to create/modify data and another to approve it |
| **MFI** | Microfinance Institution |
| **NPL** | Non-Performing Loan — a loan where the borrower is in default or close to default |
| **PEP** | Politically Exposed Person — someone holding or having held a prominent public position |
| **RBAC** | Role-Based Access Control — security model restricting access based on user roles |
| **Receipt Number** | A unique identifier issued when consent is granted |
| **Restructured** | A loan whose terms have been modified to provide relief to the borrower |
| **SACCO** | Savings and Credit Cooperative Organization |
| **Serial Number** | A unique identifier assigned to each generated credit report |
| **SLA** | Service Level Agreement — the agreed timeframe for resolving disputes |
| **SRS** | Software Requirements Specification |
| **TIN** | Tax Identification Number |
| **UAT** | User Acceptance Testing |
| **Written Off** | An account that has been classified as uncollectible and removed from active portfolios |

---

---

## 34. Platform Command Center (Super Admin)

The Platform Command Center is the central hub for super administrators to manage the entire pan-African credit registry platform. It is the first screen displayed after super admin login and provides comprehensive oversight across all 11 management tabs.

### 34.1 Accessing the Command Center

After logging in with super admin credentials, the Platform Command Center is displayed automatically. To return to the Command Center from a country dashboard, click the **"Command Center"** button in the application header.

### 34.2 Jurisdictions Tab (Overview)

The default tab shows:
- **Country Cards** — One card per active country showing borrower count, account count, institution count, compliance badges, and SATA readiness indicators.
- **Live Activity Feed** — A real-time panel showing the 15 most recent platform events. Events are color-coded by action type (violet for LOGIN, green for CREATE, blue for UPDATE, red for DELETE). Auto-refreshes every 30 seconds.
- **SRS Requirements Traceability** — A summary of requirements compliance by category.

### 34.3 Audit Log Tab

Provides a searchable, filterable view of all platform audit events:
- **Search** — Free-text search across event details and action types.
- **Filter by Action** — Dropdown to filter by action type (LOGIN, CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.).
- **Filter by Entity** — Dropdown to filter by entity type (system, borrower, credit_account, etc.).
- **Pagination** — Navigate through results with configurable page size.
- **Breakdown Charts** — Visual charts showing event distribution by action type and entity type.

All filters apply consistently to the total count, charts, and paginated results.

### 34.4 API Keys Tab

View and manage API keys for external integrations:
- **KPI Cards** — Total API Keys, Active Keys, Revoked Keys, and API Integrations count.
- **Key Listing** — Shows key label, prefix, status, permissions, creation date, and last used date. For security, the actual key hash is never displayed.
- **Revoke** — Click the Revoke button next to any active key to disable it. This action is recorded in the audit log.
- **External API Integrations** — View configured external API services.

### 34.5 Data Quality Tab

Monitors data completeness across the entire platform:
- **Overall Completeness** — A percentage score showing how complete the data is across all fields.
- **Per-Field Completeness** — Progress bars for National ID, Email, Phone, Date of Birth, and Address fields showing what percentage of borrowers have each field populated.
- **Per-Country Breakdown** — Table showing borrower and account counts by country.
- **Recommendations** — Actionable suggestions for improving data quality based on current gaps.

### 34.6 Billing & Revenue Tab

Manages the transaction-based monetization system:
- **Revenue KPIs** — Total Revenue, Collected, Pending, and Overdue amounts.
- **Pricing Tiers** — View and edit 11 pricing tiers covering all billable event types:
  - Credit Reports: $1.50 (standard), $2.00 (premium), $2.50 (enterprise)
  - API Calls: $0.05 (standard), $0.08 (premium), $0.10 (enterprise)
  - Batch Uploads: $3.50 (standard), $4.00 (premium), $5.00 (enterprise)
  - Cross-Border Queries: $3.50
  - Dispute Filing: $1.00
  - Data Exports: $2.00
- **Recent Invoices** — List of generated invoices with status.
- **Monetization Model** — Explanation of the per-transaction billing model with volume tier discounts.

To edit a pricing tier, click the Edit icon, change the unit price, and save. Invalid values (negative prices) are rejected with a validation error.

### 34.7 Retention Tab

Manage data retention policies per jurisdiction:
- **KPI Cards** — Total Policies, Active Policies, Countries Covered.
- **Policy Listing** — Grouped by country, showing entity type, retention years, archive years, status, and legal basis.
- **New Policy** — Click "New Policy" to create a retention policy for a specific country and entity type.
- **Edit Policy** — Modify retention years (1-100), archive years, active status, and description.

---

*This document is confidential and intended for authorized users of the Credit Registry System only. For technical support, contact Systems In Motion Limited.*
