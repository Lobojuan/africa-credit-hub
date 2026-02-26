# Credit Registry System - National Bank of Ethiopia

## Overview
A web-based Credit Registry System designed for the National Bank of Ethiopia to manage credit information, borrower records, and credit risk assessment across commercial banks and microfinance institutions.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Routing**: wouter for client-side, Express for API

## Data Model
- **users** - System users with roles (admin, regulator, lender, viewer) and status management
- **borrowers** - Individual and corporate borrower records with personal/business info
- **credit_accounts** - Loan and credit facility records linked to borrowers
- **credit_inquiries** - Search/inquiry records with consent tracking
- **audit_logs** - System activity logging for compliance

## Key Features
- Dashboard with key metrics (total borrowers, outstanding credit, delinquency rates)
- Borrower management (register, search, view individual/corporate profiles)
- Credit account management with loan details, collateral, arrears tracking
- Credit search with borrower lookup and credit report generation
- Credit scoring algorithm based on repayment history
- Portfolio reports by institution and loan type
- Audit trail for all system operations
- User management with role-based access and status control
- Dark/light theme support

## Pages
- `/` - Dashboard
- `/borrowers` - Borrower list + registration
- `/borrowers/:id` - Borrower detail with credit report
- `/credit-accounts` - Credit accounts table + creation
- `/search` - Credit search
- `/reports` - Portfolio analytics
- `/audit` - Audit trail
- `/users` - User management

## API Endpoints
All prefixed with `/api`:
- `GET/POST /borrowers`, `GET/PATCH /borrowers/:id`
- `GET/POST /credit-accounts`, `GET/PATCH /credit-accounts/:id`
- `GET/POST /credit-inquiries`
- `GET /borrowers/:id/credit-report`
- `GET/POST /users`, `PATCH /users/:id`
- `GET /audit-logs`
- `GET /dashboard/stats`
