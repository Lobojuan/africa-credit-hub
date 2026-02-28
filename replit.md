# Credit Registry System - Systems In Motion Limited
# Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1

## Overview
A web-based Credit Registry System developed by Systems In Motion Limited to manage credit information, borrower records, and credit risk assessment across commercial banks and microfinance institutions. Adheres to pan-African deployment SRS (v1.1) covering Ghana, Ethiopia, Liberia, and Uganda regulatory requirements with fault-tolerant architecture, security compliance, and regulatory workflows.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API server with session-based auth
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Routing**: wouter for client-side, Express for API
- **Auth**: bcryptjs password hashing, express-session with memorystore
- **i18n**: react-i18next + i18next-browser-languagedetector, EN/FR translations in `client/src/lib/i18n.ts`
- **Currency**: `client/src/lib/currency.ts` with `formatCurrency()` and `SUPPORTED_CURRENCIES`
- **Security**: 3-attempt lockout (15min), 15-min session timeout (NFR-SEC-09), IP tracking in audit logs
- **Build**: esbuild bundles server to dist/index.cjs, Vite builds frontend to dist/public/

## Data Model (15 tables)
- **users** - System users with roles (admin/regulator/lender/viewer), status, login lockout, passwordChangedAt, mustChangePassword
- **borrowers** - Individual and corporate borrower records with national ID, TIN, PEP flag, education, employment history, related party links
- **credit_accounts** - Loan/credit records with multi-currency, isInterestFree, gracePeriodMonths, restructureCount, writtenOffDate, reinstatedDate
- **credit_inquiries** - Search/inquiry records with consent tracking
- **audit_logs** - Immutable activity logging with IP addresses and timestamps
- **pending_approvals** - Maker-checker workflow for data change approvals
- **disputes** - Dispute/grievance management with SLA deadline, correctionType (financial/non_financial)
- **notifications** - In-app notification system for approvals, disputes, system alerts
- **court_judgments** - Court judgments, bankruptcies, liens (FR-COL-05)
- **consent_records** - Data subject consent management with receipt numbers (FR-CON-06/07)
- **payment_history** - 12-period payment performance history per account (FR-CR-08)
- **institutions** - Data provider institution registration with approval workflow (FR-DP-01/04)
- **billing_records** - Billing/fee management for institutions (FR-COMM-01/05)
- **credit_report_logs** - Credit report generation logs with serial numbers (FR-CR-06)
- **api_keys** - External API key management with SHA-256 hashing, permissions (submit/read/full), institution binding, revocation tracking

## Key Features
- **Authentication**: Login with bcrypt, 3-attempt lockout, session management, logout, password policy (8+ chars, uppercase, lowercase, digit, special), 90-day password expiry
- **Session security**: 15-minute idle timeout (NFR-SEC-09) with automatic logout, 8-hour max session
- **Notification system**: In-app bell with unread count badge, auto-notify on approval requests, results, dispute filings
- **Dashboard**: 8 clickable stat cards with detail drill-down drawers (borrowers, accounts, outstanding, delinquent, defaults, inquiries, pending approvals, open disputes); clickable list items navigate to detail pages
- **Borrower management**: Register/search/view individual/corporate profiles with TIN, PEP flagging, education/employment tracking, related party linking
- **Credit accounts**: Loan details, collateral, arrears tracking, multi-currency (17 currencies), interest-free loan support, grace periods, restructure tracking
- **Credit scoring**: Algorithmic scoring 300-850 with reason codes (DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, etc.)
- **Credit reports**: Full printable credit reports with serial numbers (CR-{YEAR}-{ID}), credit score analysis, reason codes, payment performance history, court judgments, consent records, personal/company info, and footer disclaimer. Accessible from credit search and borrower detail pages.
- **Maker-checker workflow**: Four-eye principle for data changes (different user must approve)
- **Dispute management**: File/track/resolve disputes with SLA timers (2-day financial, 5-day non-financial), correction type tracking (DQ-04/05)
- **Court judgments**: Track liens, bankruptcies, lawsuits, civil/criminal judgments per borrower (FR-COL-05)
- **Consent management**: Grant/revoke data subject consent with receipt numbers (FR-CON-06/07)
- **Institution management**: Self-registration with admin approval workflow (FR-DP-01/04)
- **Billing**: Invoice management, fee schedules for data providers (FR-COMM-01/05)
- **Helpdesk**: Inquiry Service Unit portal for consumer dispute/consent management (FR-CON-02/09)
- **Bulk credit search**: Multi-identifier batch search (FR-CR-03)
- **CSV export**: Portfolio and borrower data export (INT-RPT-01/04)
- **Regulatory analytics**: NPL ratios, portfolio breakdowns, SLA breach tracking (FR-REG-01/02/03)
- **Batch upload**: JSON/CSV bulk data ingestion with per-record validation
- **Portfolio reports**: By institution and loan type with NPL ratios
- **Clickable table rows**: All data tables across every page feature clickable rows — credit accounts navigate to borrower detail, institutions/billing/audit trail open inline detail dialogs, disputes open resolve dialog, consent records navigate to borrower detail, pending approvals open review dialog. Action buttons (approve, revoke, resolve) use stopPropagation to avoid conflicts.
- **Audit trail**: Full activity log with IP tracking, timestamps, action types
- **User management**: Role-based access, status control (active/suspended/deactivated)
- **RBAC enforcement**: Server-side role checks on sensitive routes
- **Internationalization (i18n)**: Full French/English language switching
- **Multi-currency**: Pan-African currency support (17 currencies)
- **Dark/light theme**: Full theme support with pan-African color palette
- **Visual design**: Inter font, warm teal + gold accent palette (culturally resonant for Ghana/Uganda/Ethiopia), gradient page header bars, split-panel login hero, gradient stat card icons, dark teal sidebar with gold branding, system status indicator, custom scrollbars, fade/slide animations
- **External API**: REST API for institutions to programmatically submit borrowers, credit accounts, payment history, court judgments; search borrowers; generate credit reports — authenticated via X-API-Key header with SHA-256 hashed keys, batch submission support, full audit trail logging
- **API key management**: Generate/revoke API keys per institution with permission levels (submit/read/full), key prefix display, last-used tracking
- **API documentation**: In-app reference guide for external API endpoints, authentication, batch submission, response format, error codes
- **Health check**: GET /api/health returns { status: "ok" }

## Pages
- `/` - Dashboard
- `/borrowers` - Borrower list + registration
- `/borrowers/:id` - Borrower detail with credit report, court judgments, consent records
- `/credit-accounts` - Credit accounts table + creation (with interest-free, grace period, restructure fields)
- `/search` - Credit search
- `/batch-upload` - Batch data upload (JSON/CSV)
- `/reports` - Portfolio analytics with CSV export
- `/approvals` - Pending approvals (maker-checker)
- `/disputes` - Dispute management with SLA deadlines and correction types
- `/audit` - Audit trail with IP tracking
- `/users` - User management
- `/institutions` - Institution management with approval workflow
- `/consent` - Consent management with receipt numbers
- `/billing` - Billing and invoice management
- `/helpdesk` - Inquiry Service Unit portal
- `/credit-report/:borrowerId` - Full credit report generation with serial number, print support
- `/api-keys` - API key management (generate, revoke, view usage)
- `/api-docs` - External API documentation reference

## API Endpoints
All prefixed with `/api` and require authentication (except /api/auth/*, /api/health, and /api/external/*):
- `GET /health` - Health check
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`
- `GET/POST /borrowers`, `GET/PATCH /borrowers/:id`
- `GET/POST /credit-accounts`, `GET/PATCH /credit-accounts/:id`
- `GET/POST /credit-inquiries`
- `GET /borrowers/:id/credit-report`
- `GET /borrowers/:id/related` - Related party borrowers
- `GET/POST /users`, `PATCH /users/:id`
- `GET/POST /pending-approvals`, `PATCH /pending-approvals/:id`
- `GET/POST /disputes`, `GET/PATCH /disputes/:id`
- `POST /batch-upload/credit-accounts`
- `GET /audit-logs`
- `GET /dashboard/stats`
- `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`
- `GET/POST /court-judgments` - Court judgments (with ?borrowerId filter)
- `GET/POST /consent-records` - Consent management (with ?borrowerId filter)
- `POST /consent-records/:id/revoke` - Revoke consent
- `GET/POST /payment-history/:creditAccountId` - Payment history
- `GET/POST /institutions`, `PATCH /institutions/:id`
- `POST /institutions/:id/approve` - Institution approval
- `GET/POST /billing` - Billing records
- `GET /credit-reports/logs` - Report generation logs
- `POST /credit-reports/generate` - Generate credit report with serial number + reason codes
- `POST /credit-search/bulk` - Bulk credit reference checks
- `GET /reports/export?format=csv&type=portfolio|borrowers` - CSV export
- `GET /reports/regulatory` - Regulatory analytics
- `GET/POST /api-keys` - API key management (admin only)
- `POST /api-keys/:id/revoke` - Revoke an API key

### External API (authenticated via X-API-Key header)
- `GET /external/v1/health` - Health check (no auth required)
- `POST /external/v1/borrowers` - Create borrower(s) — single or batch array
- `GET /external/v1/borrowers/search?nationalId=&name=&q=` - Search borrowers
- `GET /external/v1/borrowers/:id/credit-report` - Full credit report with score
- `POST /external/v1/credit-accounts` - Submit credit account(s) — single or batch
- `GET /external/v1/credit-accounts/:borrowerId` - Get accounts by borrower
- `POST /external/v1/payment-history` - Submit payment history records
- `POST /external/v1/court-judgments` - Submit court judgment

## Running
- **Dev**: `npm run dev` (tsx + Vite HMR, NODE_ENV=development)
- **Build**: `npm run build` (esbuild + Vite)
- **Prod**: `NODE_ENV=production node dist/index.cjs`
- **Deploy**: Configured for autoscale with `node ./dist/index.cjs`

## Seed Credentials
- admin / admin123 (Admin - NBE)
- regulator1 / reg123 (Regulator - NBE)
- cbe_user / cbe123 (Lender - CBE)
- dashen_user / dashen123 (Lender - Dashen)
- awash_user / awash123 (Lender - Awash)

## RBAC Access Matrix
| Route | Admin | Regulator | Lender | Viewer |
|-------|-------|-----------|--------|--------|
| User Management | Yes | No | No | No |
| Institutions | Yes | No | No | No |
| Billing | Yes | Yes | No | No |
| Audit Logs | Yes | Yes | No | No |
| Approve/Reject Changes | Yes | Yes | No | No |
| Court Judgments (create) | Yes | Yes | No | No |
| Batch Upload | Yes | No | Yes | No |
| Borrowers/Accounts | Yes | Yes | Yes | Yes |
| Disputes | Yes | Yes | Yes | Yes |
| Consent | Yes | Yes | Yes | Yes |
| Dashboard/Reports | Yes | Yes | Yes | Yes |
| Helpdesk | Yes | Yes | Yes | Yes |
| API Keys | Yes | No | No | No |

## SRS Compliance Notes
- Session timeout: 15 min (NFR-SEC-09)
- SLA deadlines: 2 working days financial, 5 working days non-financial (DQ-04/05)
- Credit report serial format: CR-{YEAR}-{timestamp_base36}
- Consent receipt format: CR-{timestamp}-{random}
- Reason codes: DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, RESTRUCTURED_ACCOUNTS, HIGH_INQUIRY_VOLUME, HIGH_DEBT_LEVEL, COURT_JUDGMENTS_PRESENT, POLITICALLY_EXPOSED_PERSON, STRONG_REPAYMENT_HISTORY, EXCELLENT_PAYMENT_RECORD, THIN_FILE_LIMITED_HISTORY

## Database Seed Data
- 100,005 borrowers (Ethiopian, Ghanaian, Ugandan names aligned to correct countries/cities)
- 100,020 institutions (banks, MFIs, SACCOs, telecoms, utilities, digital lenders across 3 countries)
- 166,673 credit accounts
- 120,000 payment history records
- 25,004 credit inquiries
- 15,000 consent records
- 5,063 audit logs
- 3,000 disputes
- 2,000 court judgments
- 120 billing records
- 6 system users
- Server-side pagination on borrowers and institutions endpoints (page/limit query params, returns {data, total})

## Important Notes
- SIGHUP signal is ignored in server process to prevent workflow-triggered termination
- Session store uses memorystore (not PostgreSQL) to reduce memory pressure
- Database pool limited to 2 connections for resource efficiency
- Response logging truncated to 200 chars to reduce I/O
- static.ts handles both ESM (__dirname) and CJS (import.meta.url) contexts
- Maker-checker enforcement: server rejects self-approval (requestedBy !== reviewedBy)
- New tables created via direct SQL (db:push has interactive prompt issues with session table rename)
