# Credit Registry System - National Bank of Ethiopia

## Overview
A web-based Credit Registry System designed for the National Bank of Ethiopia to manage credit information, borrower records, and credit risk assessment across commercial banks and microfinance institutions. Adheres to pan-African deployment SRS covering fault-tolerant architecture, security compliance, and regulatory workflows.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API server with session-based auth
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Routing**: wouter for client-side, Express for API
- **Auth**: bcryptjs password hashing, express-session with connect-pg-simple store
- **Security**: 3-attempt lockout (15min), session-based auth, IP tracking in audit logs

## Data Model
- **users** - System users with roles (admin/regulator/lender/viewer), status, login lockout fields
- **borrowers** - Individual and corporate borrower records with national ID, TIN, personal/business info
- **credit_accounts** - Loan/credit facility records with multi-currency support (ETB/USD)
- **credit_inquiries** - Search/inquiry records with consent tracking
- **audit_logs** - Immutable activity logging with IP addresses and timestamps
- **pending_approvals** - Maker-checker workflow for data change approvals
- **disputes** - Dispute/grievance management for data corrections

## Key Features
- **Authentication**: Login with bcrypt, 3-attempt lockout, session management, logout
- **Dashboard**: 8 stat cards (borrowers, accounts, outstanding, delinquent, defaults, inquiries, pending approvals, open disputes)
- **Borrower management**: Register/search/view individual/corporate profiles with TIN
- **Credit accounts**: Loan details, collateral, arrears tracking, multi-currency (ETB/USD)
- **Credit scoring**: Algorithmic scoring 300-850 based on repayment history
- **Maker-checker workflow**: Four-eye principle for data changes (different user must approve)
- **Dispute management**: File/track/resolve data disputes with status workflow
- **Batch upload**: JSON/CSV bulk data ingestion with per-record validation and error reporting
- **Portfolio reports**: By institution and loan type with NPL ratios
- **Audit trail**: Full activity log with IP tracking, timestamps, action types
- **User management**: Role-based access, status control (active/suspended/deactivated)
- **Dark/light theme**: Full theme support

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
All prefixed with `/api` and require authentication (except /api/auth/*):
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
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

## Seed Credentials
- admin / admin123 (Admin - NBE)
- regulator1 / reg123 (Regulator - NBE)
- cbe_user / cbe123 (Lender - CBE)
- dashen_user / dashen123 (Lender - Dashen)
- awash_user / awash123 (Lender - Awash)
