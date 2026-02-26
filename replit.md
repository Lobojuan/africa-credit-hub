# Credit Registry System - National Bank of Ethiopia

## Overview
A web-based Credit Registry System designed for the National Bank of Ethiopia to manage credit information, borrower records, and credit risk assessment across commercial banks and microfinance institutions. Adheres to pan-African deployment SRS covering fault-tolerant architecture, security compliance, and regulatory workflows.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API server with session-based auth
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Routing**: wouter for client-side, Express for API
- **Auth**: bcryptjs password hashing, express-session with memorystore
- **i18n**: react-i18next + i18next-browser-languagedetector, EN/FR translations in `client/src/lib/i18n.ts`
- **Currency**: `client/src/lib/currency.ts` with `formatCurrency()` and `SUPPORTED_CURRENCIES`
- **Security**: 3-attempt lockout (15min), session-based auth, IP tracking in audit logs
- **Build**: esbuild bundles server to dist/index.cjs, Vite builds frontend to dist/public/

## Data Model
- **users** - System users with roles (admin/regulator/lender/viewer), status, login lockout, passwordChangedAt, mustChangePassword
- **borrowers** - Individual and corporate borrower records with national ID, TIN, PEP flag, education, employment history, related party links
- **credit_accounts** - Loan/credit facility records with multi-currency support (17 currencies)
- **credit_inquiries** - Search/inquiry records with consent tracking
- **audit_logs** - Immutable activity logging with IP addresses and timestamps
- **pending_approvals** - Maker-checker workflow for data change approvals
- **disputes** - Dispute/grievance management for data corrections
- **notifications** - In-app notification system for approvals, disputes, system alerts

## Key Features
- **Authentication**: Login with bcrypt, 3-attempt lockout, session management, logout, password policy (8+ chars, uppercase, lowercase, digit, special), 90-day password expiry
- **Session security**: 30-minute idle timeout with automatic logout, 8-hour max session
- **Notification system**: In-app bell with unread count badge, auto-notify on approval requests, approval results, dispute filings
- **Dashboard**: 8 stat cards (borrowers, accounts, outstanding, delinquent, defaults, inquiries, pending approvals, open disputes)
- **Borrower management**: Register/search/view individual/corporate profiles with TIN, PEP flagging, education/employment tracking, related party linking
- **Credit accounts**: Loan details, collateral, arrears tracking, multi-currency (17 African/global currencies: ETB, KES, NGN, ZAR, GHS, TZS, UGX, RWF, XOF, XAF, EGP, MAD, BWP, MZN, USD, EUR, GBP)
- **Credit scoring**: Algorithmic scoring 300-850 based on repayment history
- **Maker-checker workflow**: Four-eye principle for data changes (different user must approve)
- **Dispute management**: File/track/resolve data disputes with status workflow
- **Batch upload**: JSON/CSV bulk data ingestion with per-record validation and error reporting
- **Portfolio reports**: By institution and loan type with NPL ratios
- **Audit trail**: Full activity log with IP tracking, timestamps, action types
- **User management**: Role-based access, status control (active/suspended/deactivated)
- **RBAC enforcement**: Server-side role checks on sensitive routes (admin-only user management, admin/regulator audit logs and approval review, admin/lender batch upload)
- **Internationalization (i18n)**: Full French/English language switching with react-i18next, browser language detection, localStorage persistence
- **Multi-currency**: Pan-African currency support with Intl.NumberFormat formatting (17 currencies with locale-appropriate display)
- **Dark/light theme**: Full theme support
- **Health check**: GET /api/health returns { status: "ok" }

## Pages
- `/` (login required) - Dashboard
- `/borrowers` - Borrower list + registration
- `/borrowers/:id` - Borrower detail with credit report
- `/credit-accounts` - Credit accounts table + creation
- `/search` - Credit search
- `/batch-upload` - Batch data upload (JSON/CSV)
- `/reports` - Portfolio analytics
- `/approvals` - Pending approvals (maker-checker)
- `/disputes` - Dispute management
- `/audit` - Audit trail with IP tracking
- `/users` - User management

## API Endpoints
All prefixed with `/api` and require authentication (except /api/auth/* and /api/health):
- `GET /health` - Health check
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`
- `GET/POST /borrowers`, `GET/PATCH /borrowers/:id`
- `GET/POST /credit-accounts`, `GET/PATCH /credit-accounts/:id`
- `GET/POST /credit-inquiries`
- `GET /borrowers/:id/credit-report`
- `GET/POST /users`, `PATCH /users/:id`
- `GET/POST /pending-approvals`, `PATCH /pending-approvals/:id`
- `GET/POST /disputes`, `GET/PATCH /disputes/:id`
- `POST /batch-upload/credit-accounts`
- `GET /audit-logs`
- `GET /dashboard/stats`
- `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`
- `GET /borrowers/:id/related` - Related party borrowers

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
| User Management | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject Changes | ✅ | ✅ | ❌ | ❌ |
| Batch Upload | ✅ | ❌ | ✅ | ❌ |
| Borrowers/Accounts | ✅ | ✅ | ✅ | ✅ |
| Disputes | ✅ | ✅ | ✅ | ✅ |
| Dashboard/Reports | ✅ | ✅ | ✅ | ✅ |

## Important Notes
- SIGHUP signal is ignored in server process to prevent workflow-triggered termination
- Session store uses memorystore (not PostgreSQL) to reduce memory pressure
- Database pool limited to 2 connections for resource efficiency
- Response logging truncated to 200 chars to reduce I/O
- static.ts handles both ESM (__dirname) and CJS (import.meta.url) contexts
- Maker-checker enforcement: server rejects self-approval (requestedBy !== reviewedBy)
