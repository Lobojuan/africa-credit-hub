# Cross-Jurisdictional Central Data Hub & Credit Registry System v1.3 — Systems Documentation

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.3  
**Date:** March 2026  
**Classification:** Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Model](#4-data-model)
5. [API Endpoint Catalog](#5-api-endpoint-catalog)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Integration Points](#8-integration-points)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Error Handling](#10-error-handling)
11. [Performance](#11-performance)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Enterprise Enhancements (v1.1 — v2.0)](#13-enterprise-enhancements-v11--v12)
14. [AI Integration Architecture (v1.3)](#14-ai-integration-architecture-v13)
15. [API Usage Tracking (v1.3)](#15-api-usage-tracking-v13)
16. [Excel Export System (v1.3)](#16-excel-export-system-v13)
17. [Real-time Notifications (v1.3)](#17-real-time-notifications-v13)
18. [Dashboard Trends (v1.3)](#18-dashboard-trends-v13)

---

## 1. Executive Summary

### 1.1 System Purpose

The Cross-Jurisdictional Central Data Hub & Credit Registry System is a web-based platform developed by Systems In Motion Limited for managing credit information, borrower records, and credit risk assessment across commercial banks, microfinance institutions, and other financial service providers. The system enables centralized credit data collection, sharing, and reporting to support sound lending decisions and regulatory oversight.

### 1.2 Jurisdictions Covered

The system is designed for pan-African deployment across all 54 African countries, organized into five regional economic blocs:

- **ECOWAS (Economic Community of West African States)** — Ghana, Nigeria, Senegal, Côte d'Ivoire, Sierra Leone, Liberia, Guinea, Mali, Burkina Faso, Niger, Togo, Benin, The Gambia, Guinea-Bissau, Cape Verde
- **EAC (East African Community)** — Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Democratic Republic of Congo
- **SADC (Southern African Development Community)** — South Africa, Mozambique, Zambia, Zimbabwe, Botswana, Namibia, Angola, Malawi, Madagascar, Mauritius, Eswatini, Lesotho, Seychelles, Comoros
- **CEMAC (Central African Economic and Monetary Community)** — Cameroon, Gabon, Chad, Central African Republic, Republic of Congo, Equatorial Guinea
- **AMU (Arab Maghreb Union)** — Morocco, Algeria, Tunisia, Libya, Mauritania, Egypt, Sudan, Eritrea, Ethiopia, Djibouti, Somalia

### 1.3 Key Capabilities

- **Borrower Management** — Individual and corporate borrower registration with PEP flagging, education/employment tracking, and related party linking (7 types including beneficial_owner)
- **Credit Account Management** — Multi-currency loan tracking with interest-free support, grace periods, restructuring, and write-off management
- **Credit Scoring** — Algorithmic scoring (300–850 range) with reason codes
- **Credit Reporting** — Full printable credit reports with serial numbers, payment history, court judgments, and consent records
- **Maker-Checker Workflow** — Four-eye principle for data change approvals with self-approval prevention
- **Dispute Management** — SLA-tracked dispute resolution (2-day financial, 5-day non-financial)
- **Court Judgments** — Tracking of liens, bankruptcies, lawsuits, and civil/criminal judgments
- **Consent Management** — Data subject consent with receipt numbers and revocation
- **Institution Management** — Data provider registration with approval workflow
- **Billing** — Invoice management and fee tracking for data providers
- **Batch Upload** — JSON/CSV bulk data ingestion with per-record validation
- **External REST API** — Programmatic access for institutions with API key authentication
- **Regulatory Analytics** — NPL ratios, portfolio breakdowns, SLA breach tracking, CSV export
- **Internationalization** — Full English, French, and Portuguese language support
- **Multi-Currency** — 42+ African currencies plus USD, EUR, GBP supported
- **Exchange Rate Management** — 42+ currencies with live rate fetching via open.er-api.com, cross-rate conversion via USD routing, admin CRUD operations, and currency converter widget
- **API Administration** — Centralized external API configuration management with connection testing, per-country settings, and SSRF protection
- **Data Retention Policies** — Jurisdiction-specific retention periods with automatic enforcement scheduler (24-hour interval) and manual trigger
- **Global Search** — Cross-entity search across borrowers, institutions, and credit accounts simultaneously via `/api/global-search` with country filtering
- **ID Photos & Documents** — DiceBear auto-generated avatars for borrower profiles, multer-based photo and ID document upload with authentication-protected serving from `/uploads`
- **Demo Environment** — Investor-facing one-click demo with three role cards (Admin, Regulator, Bank Officer), amber DEMO ENVIRONMENT banner, and fictional data disclaimer
- **Audit Trail** — Comprehensive activity logging with IP tracking and tamper-evident SHA-256 hash chain
- **Multi-Factor Authentication** — TOTP-based MFA via otpauth library
- **Fuzzy Entity Matching** — PostgreSQL pg_trgm trigram similarity for duplicate borrower detection
- **Dispute Chatbot** — Guided multi-step chat assistant for dispute filing
- **OAuth 2.1** — Bearer token authentication (client_credentials grant) for external API
- **Low-Bandwidth Optimization** — gzip compression and React.lazy code-splitting
- **XBRL Upload** — XBRL/XML file format support for batch data uploads
- **AI Credit Risk Analysis** — GPT-4o-powered borrower risk assessments with risk scores, factors, and recommendations
- **AI Report Summary** — Plain-language credit report summaries generated by AI
- **AI Smart Chatbot** — AI assistant mode in dispute chatbot with Server-Sent Events (SSE) streaming
- **AI Compliance Reports** — Automated per-country regulatory compliance analysis via GPT-4o
- **Excel Export** — XLSX formatted exports for portfolio, borrower, and audit trail data using exceljs
- **API Usage Analytics** — In-memory request tracking with hourly bar chart and top endpoint analysis
- **Dashboard Sparkline Trends** — 7-day trend mini-charts on stat cards using recharts AreaChart
- **Multi-Language PDF Reports** — Language selector (EN/FR/AR/SW) on credit report page for PDF downloads

---

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a modern monolithic full-stack architecture with clear separation between frontend (SPA), backend (REST API), and database layers. All components are deployed as a single application unit.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│  ┌───────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │  wouter   │  │ TanStack │  │  react-i18next │   │   │
│  │  │ (routing) │  │  Query   │  │   (EN / FR / PT) │   │   │
│  │  └──────────┘  └──────────┘  └───────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │        shadcn/ui + Tailwind CSS              │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                  Express.js Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Session Auth │  │   Internal   │  │  External    │   │
│  │  (memorystore)│  │   API Routes │  │  API (v1)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Zod        │  │   RBAC       │  │  Audit       │   │
│  │  Validation  │  │  Middleware   │  │  Logging     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Storage Interface (IStorage)            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL (pg driver)
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL Database (Neon)                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Drizzle ORM (21 tables)               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Architecture

- **Framework:** React with TypeScript
- **Build Tool:** Vite with HMR (Hot Module Replacement) in development
- **Styling:** Tailwind CSS with shadcn/ui component library
- **Routing:** wouter — lightweight client-side routing
- **State Management:** TanStack Query v5 for server state management with caching and invalidation
- **Internationalization:** react-i18next with i18next-browser-languagedetector for EN/FR/PT
- **Theme:** Dark/light mode with CSS custom properties and Tailwind class-based toggling
- **Font:** Inter (Google Fonts)
- **Design System:** Warm teal + gold accent palette (culturally resonant across pan-African deployment covering 54 countries)

### 2.3 Backend Architecture

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js REST API server
- **Authentication:** Session-based authentication with express-session and memorystore
- **Password Hashing:** bcryptjs with 10 salt rounds
- **Validation:** Zod schemas derived from Drizzle table definitions via drizzle-zod
- **Storage Pattern:** Interface-based storage layer (`IStorage`) with `DatabaseStorage` implementation

### 2.4 Database Architecture

- **Engine:** PostgreSQL (hosted on Neon)
- **ORM:** Drizzle ORM with drizzle-zod for schema-to-validation generation
- **Driver:** pg (node-postgres) with connection pooling
- **Schema Management:** drizzle-kit for schema push (development), direct SQL for production migrations
- **Connection Pool:** Limited to 2 connections for resource efficiency, 30-second idle timeout

### 2.5 Authentication Architecture

- **Method:** bcryptjs password hashing with salt rounds of 10
- **Session Store:** memorystore (not PostgreSQL) to reduce memory pressure
- **Session Configuration:**
  - 8-hour maximum session lifetime (cookie maxAge)
  - 15-minute idle timeout with automatic session destruction (NFR-SEC-09)
  - HTTP-only cookies, SameSite=Lax
- **Lockout:** 3 failed login attempts triggers 15-minute account lockout

### 2.6 Internationalization

- **Library:** react-i18next + i18next-browser-languagedetector
- **Languages:** English (en), French (fr), Portuguese (pt)
- **Translation Source:** Inline JSON resources in `client/src/lib/i18n.ts`
- **Detection:** Browser language auto-detection with localStorage persistence; manual switcher available on the login page and main header

### 2.7 Routing

- **Client-Side:** wouter — lightweight React router with `<Switch>`, `<Route>`, `<Link>`, and `useLocation` hook
- **Server-Side:** Express.js router with middleware chain (session validation, RBAC, validation)

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 18.x | UI component framework |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Build Tool** | Vite | 5.x | Frontend build and HMR dev server |
| **CSS Framework** | Tailwind CSS | 3.x | Utility-first CSS |
| **Component Library** | shadcn/ui | Latest | Pre-built accessible UI components |
| **Client Routing** | wouter | 3.x | Lightweight React router |
| **Server State** | TanStack Query | 5.x | Data fetching, caching, synchronization |
| **Forms** | react-hook-form | 7.x | Form state management |
| **Form Validation** | @hookform/resolvers/zod | Latest | Zod-based form validation |
| **Icons** | lucide-react | Latest | Icon library |
| **i18n** | react-i18next | Latest | Internationalization |
| **Server Framework** | Express.js | 4.x | HTTP server and API routing |
| **Database** | PostgreSQL | 16.x | Relational database (Neon hosted) |
| **ORM** | Drizzle ORM | Latest | Type-safe SQL query builder |
| **Schema Validation** | Zod + drizzle-zod | Latest | Runtime validation from DB schema |
| **Password Hashing** | bcryptjs | 2.x | Secure password hashing |
| **Session Management** | express-session | 1.x | Server-side session handling |
| **Session Store** | memorystore | 1.x | In-memory session storage |
| **DB Driver** | pg (node-postgres) | 8.x | PostgreSQL client driver |
| **Server Bundler** | esbuild | Latest | Server-side TypeScript bundling |
| **Schema Tooling** | drizzle-kit | Latest | Database schema management |
| **File Upload** | multer | 1.x | Multipart form-data file upload handling |
| **AI Integration** | OpenAI SDK | Latest | GPT-4o integration for credit risk, summaries, chat, compliance |
| **Excel Export** | exceljs | Latest | XLSX workbook generation with formatted headers |
| **Charts** | Recharts | 2.x | Dashboard charts, sparkline trends |

---

## 4. Data Model

The system uses 21 PostgreSQL tables with Drizzle ORM for type-safe access. All primary keys are UUID v4 strings generated via `gen_random_uuid()`.

### 4.1 Table: `users`

System users with role-based access control, login tracking, and password policy enforcement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique user identifier |
| `username` | text | NOT NULL, UNIQUE | Login username |
| `password` | text | NOT NULL | bcrypt-hashed password |
| `full_name` | text | NOT NULL | Display name |
| `email` | text | NOT NULL | Email address |
| `role` | enum `user_role` | NOT NULL, default `'viewer'` | One of: `admin`, `regulator`, `lender`, `viewer` |
| `status` | enum `user_status` | NOT NULL, default `'active'` | One of: `active`, `suspended`, `deactivated` |
| `institution` | text | nullable | Associated institution name |
| `failed_login_attempts` | integer | default `0` | Count of consecutive failed logins |
| `locked_until` | timestamp | nullable | Account lockout expiry time |
| `last_login` | timestamp | nullable | Last successful login timestamp |
| `password_changed_at` | timestamp | nullable | Last password change timestamp (90-day expiry) |
| `must_change_password` | boolean | default `false` | Force password change on next login |
| `mfa_secret` | varchar | nullable | TOTP MFA secret (base32-encoded) for authenticator app (ENT-01) |
| `mfa_enabled` | boolean | default `false` | Whether TOTP MFA is enabled for the user (ENT-01) |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.2 Table: `borrowers`

Individual and corporate borrower records with identification, demographic, and employment data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique borrower identifier |
| `type` | enum `borrower_type` | NOT NULL | One of: `individual`, `corporate` |
| `first_name` | text | nullable | Individual first name |
| `last_name` | text | nullable | Individual last name |
| `company_name` | text | nullable | Corporate entity name |
| `national_id` | text | NOT NULL, UNIQUE | National identification number |
| `tin_number` | text | nullable | Tax Identification Number |
| `date_of_birth` | text | nullable | Date of birth (ISO string) |
| `gender` | text | nullable | Gender |
| `phone` | text | nullable | Phone number |
| `email` | text | nullable | Email address |
| `address` | text | nullable | Physical address |
| `city` | text | nullable | City |
| `region` | text | nullable | Region/state |
| `employer_name` | text | nullable | Current employer |
| `occupation` | text | nullable | Occupation/job title |
| `business_reg_number` | text | nullable | Business registration number (corporate) |
| `sector` | text | nullable | Industry sector |
| `is_pep` | boolean | default `false` | Politically Exposed Person flag |
| `pep_details` | text | nullable | PEP details/description |
| `related_borrower_id` | varchar | nullable | FK to `borrowers.id` (related party) |
| `relationship_type` | text | nullable | Type of relationship (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company) |
| `education_level` | text | nullable | Highest education level |
| `education_institution` | text | nullable | Educational institution |
| `employment_history` | text | nullable | Employment history (JSON or text) |
| `created_at` | timestamp | default `now()` | Record creation timestamp |
| `updated_at` | timestamp | default `now()` | Last update timestamp |

### 4.3 Table: `credit_accounts`

Loan and credit facility records with multi-currency support and special loan features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique account identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Associated borrower |
| `lender_institution` | text | NOT NULL | Lending institution name |
| `account_number` | text | NOT NULL | Account/loan number |
| `account_type` | text | NOT NULL | Loan type (term_loan, overdraft, mortgage, etc.) |
| `original_amount` | decimal(15,2) | NOT NULL | Original loan amount |
| `current_balance` | decimal(15,2) | NOT NULL | Current outstanding balance |
| `currency` | text | NOT NULL, default `'ETB'` | Currency code (42+ African currencies plus USD, EUR, GBP) |
| `interest_rate` | decimal(5,2) | nullable | Annual interest rate |
| `disbursement_date` | text | nullable | Loan disbursement date |
| `maturity_date` | text | nullable | Loan maturity date |
| `status` | enum `account_status` | NOT NULL, default `'current'` | One of: `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `days_in_arrears` | integer | default `0` | Days past due |
| `collateral_type` | text | nullable | Collateral type description |
| `collateral_value` | decimal(15,2) | nullable | Collateral value |
| `last_payment_date` | text | nullable | Date of last payment |
| `last_payment_amount` | decimal(15,2) | nullable | Amount of last payment |
| `is_interest_free` | boolean | default `false` | Interest-free (Islamic/Sharia) loan flag (FR-SPEC-03) |
| `grace_period_months` | integer | nullable | Grace period in months (FR-SPEC-04) |
| `restructure_count` | integer | default `0` | Number of restructures (FR-SPEC-05) |
| `written_off_date` | text | nullable | Date account was written off |
| `reinstated_date` | text | nullable | Date account was reinstated |
| `created_at` | timestamp | default `now()` | Record creation timestamp |
| `updated_at` | timestamp | default `now()` | Last update timestamp |

### 4.4 Table: `credit_inquiries`

Credit search and inquiry records with consent tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique inquiry identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Queried borrower |
| `inquired_by` | varchar | NOT NULL, FK → `users.id` | User who performed the inquiry |
| `purpose` | enum `inquiry_purpose` | NOT NULL | One of: `new_credit`, `review`, `collection`, `regulatory`, `portfolio_monitoring` |
| `institution` | text | NOT NULL | Inquiring institution name |
| `consent_provided` | boolean | NOT NULL, default `false` | Whether borrower consent was obtained |
| `created_at` | timestamp | default `now()` | Inquiry timestamp |

### 4.5 Table: `audit_logs`

Immutable activity logging with IP address tracking for security and compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique log entry identifier |
| `user_id` | varchar | nullable, FK → `users.id` | User who performed the action |
| `action` | text | NOT NULL | Action type (LOGIN, CREATE, UPDATE, APPROVE, etc.) |
| `entity` | text | NOT NULL | Entity type affected (user, borrower, credit_account, etc.) |
| `entity_id` | varchar | nullable | Specific entity identifier |
| `details` | text | nullable | Human-readable description |
| `ip_address` | text | nullable | Client IP address |
| `previous_hash` | text | nullable | SHA-256 hash of the previous entry in the hash chain; `"genesis"` for the first entry (ENT-07) |
| `current_hash` | text | nullable | SHA-256 hash of this entry computed from previousHash + action + entity + details + timestamp (ENT-07) |
| `created_at` | timestamp | default `now()` | Log entry timestamp |

### 4.6 Table: `pending_approvals`

Maker-checker workflow records for data change approvals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique approval identifier |
| `entity_type` | text | NOT NULL | Type of entity (borrower, credit_account) |
| `entity_id` | varchar | nullable | Existing entity ID (for updates) |
| `action` | text | NOT NULL | Action type (CREATE, UPDATE) |
| `payload` | text | NOT NULL | JSON-serialized change data |
| `requested_by` | varchar | NOT NULL, FK → `users.id` | User who submitted the change |
| `reviewed_by` | varchar | nullable, FK → `users.id` | User who reviewed the change |
| `status` | enum `approval_status` | NOT NULL, default `'pending'` | One of: `pending`, `approved`, `rejected` |
| `review_notes` | text | nullable | Reviewer comments |
| `created_at` | timestamp | default `now()` | Submission timestamp |
| `reviewed_at` | timestamp | nullable | Review timestamp |

### 4.7 Table: `disputes`

Dispute/grievance management with SLA deadline tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique dispute identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Affected borrower |
| `credit_account_id` | varchar | nullable, FK → `credit_accounts.id` | Related credit account |
| `filed_by` | varchar | NOT NULL, FK → `users.id` | User who filed the dispute |
| `dispute_type` | text | NOT NULL | Type of dispute |
| `description` | text | NOT NULL | Dispute description |
| `status` | enum `dispute_status` | NOT NULL, default `'open'` | One of: `open`, `under_review`, `resolved`, `rejected` |
| `resolution` | text | nullable | Resolution description |
| `correction_type` | text | nullable | One of: `financial`, `non_financial` |
| `sla_deadline` | timestamp | nullable | SLA deadline (2 days financial, 5 days non-financial) |
| `created_at` | timestamp | default `now()` | Filing timestamp |
| `updated_at` | timestamp | default `now()` | Last update timestamp |
| `resolved_at` | timestamp | nullable | Resolution timestamp |

### 4.8 Table: `notifications`

In-app notification system for approvals, disputes, and system alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique notification identifier |
| `user_id` | varchar | nullable, FK → `users.id` | Target user (null = broadcast) |
| `type` | text | NOT NULL | Notification type (approval_pending, approval_result, dispute_update, system) |
| `title` | text | NOT NULL | Notification title |
| `message` | text | NOT NULL | Notification body |
| `is_read` | boolean | default `false` | Read status |
| `link` | text | nullable | Navigation link |
| `created_at` | timestamp | default `now()` | Notification timestamp |

### 4.9 Table: `court_judgments`

Court judgments, bankruptcies, and liens associated with borrowers (FR-COL-05).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique judgment identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Associated borrower |
| `case_number` | text | NOT NULL | Court case number |
| `court` | text | NOT NULL | Court name |
| `judgment_type` | enum `judgment_type` | NOT NULL | One of: `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction` |
| `amount` | decimal(15,2) | nullable | Judgment amount |
| `currency` | text | default `'ETB'` | Currency code |
| `judgment_date` | text | NOT NULL | Date of judgment |
| `status` | enum `judgment_status` | NOT NULL, default `'active'` | One of: `active`, `resolved`, `appealed` |
| `description` | text | nullable | Judgment details |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.10 Table: `consent_records`

Data subject consent management with receipt numbers (FR-CON-06/07).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique consent identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Consenting borrower |
| `granted_to` | text | NOT NULL | Entity consent is granted to |
| `purpose` | text | NOT NULL | Purpose of consent |
| `consent_type` | text | NOT NULL | Type of consent |
| `status` | enum `consent_status` | NOT NULL, default `'active'` | One of: `active`, `revoked` |
| `granted_at` | timestamp | default `now()` | Consent grant timestamp |
| `revoked_at` | timestamp | nullable | Revocation timestamp |
| `receipt_number` | text | NOT NULL | Consent receipt (format: `CR-{timestamp}-{random}`) |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.11 Table: `payment_history`

12-period payment performance history per credit account (FR-CR-08).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique entry identifier |
| `credit_account_id` | varchar | NOT NULL, FK → `credit_accounts.id` | Associated credit account |
| `period` | text | NOT NULL | Payment period (e.g., "2024-01") |
| `amount_due` | decimal(15,2) | NOT NULL | Amount due for period |
| `amount_paid` | decimal(15,2) | NOT NULL | Amount actually paid |
| `status` | enum `payment_status` | NOT NULL, default `'on_time'` | One of: `on_time`, `late`, `missed`, `partial` |
| `days_late` | integer | default `0` | Days payment was late |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.12 Table: `institutions`

Data provider institution registration and approval workflow (FR-DP-01/04).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique institution identifier |
| `name` | text | NOT NULL | Institution name |
| `type` | text | NOT NULL | One of: `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| `registration_number` | text | nullable | Official registration number |
| `country` | text | NOT NULL, default `'Ethiopia'` | Country of operation |
| `contact_email` | text | nullable | Primary contact email |
| `contact_phone` | text | nullable | Primary contact phone |
| `address` | text | nullable | Physical address |
| `status` | enum `institution_status` | NOT NULL, default `'pending'` | One of: `pending`, `active`, `suspended` |
| `submission_frequency` | text | default `'monthly'` | Data submission frequency |
| `approved_by` | varchar | nullable, FK → `users.id` | Approving admin user |
| `approved_at` | timestamp | nullable | Approval timestamp |
| `created_at` | timestamp | default `now()` | Registration timestamp |

### 4.13 Table: `billing_records`

Billing and fee management for data provider institutions (FR-COMM-01/05).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique billing record identifier |
| `institution_name` | text | NOT NULL | Billed institution name |
| `service_type` | text | NOT NULL | One of: `data_submission`, `credit_report`, `api_access`, `subscription` |
| `amount` | decimal(15,2) | NOT NULL | Invoice amount |
| `currency` | text | NOT NULL, default `'ETB'` | Currency code |
| `status` | enum `billing_status` | NOT NULL, default `'pending'` | One of: `pending`, `paid`, `overdue` |
| `invoice_number` | text | NOT NULL | Invoice reference number |
| `period_start` | text | nullable | Billing period start date |
| `period_end` | text | nullable | Billing period end date |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.14 Table: `credit_report_logs`

Credit report generation audit trail with unique serial numbers (FR-CR-06).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique log identifier |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Subject borrower |
| `requested_by` | varchar | NOT NULL, FK → `users.id` | Requesting user |
| `institution` | text | NOT NULL | Requesting institution |
| `purpose` | text | NOT NULL | Report purpose |
| `serial_number` | text | NOT NULL, UNIQUE | Report serial number (format: `CR-{YEAR}-{base36_timestamp}`) |
| `created_at` | timestamp | default `now()` | Generation timestamp |

### 4.15 Table: `api_keys`

External API key management with SHA-256 hashing and permission levels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique key identifier |
| `institution_id` | varchar | NOT NULL, FK → `institutions.id` | Associated institution |
| `key_hash` | text | NOT NULL | SHA-256 hash of the full API key |
| `key_prefix` | text | NOT NULL | First 12 chars of key (for display) |
| `label` | text | NOT NULL | Human-readable label |
| `status` | enum `api_key_status` | NOT NULL, default `'active'` | One of: `active`, `revoked` |
| `permissions` | text | NOT NULL, default `'submit'` | One of: `submit`, `read`, `full` |
| `last_used_at` | timestamp | nullable | Last usage timestamp |
| `created_by` | varchar | NOT NULL, FK → `users.id` | Admin who created the key |
| `created_at` | timestamp | default `now()` | Key creation timestamp |
| `revoked_at` | timestamp | nullable | Revocation timestamp |

### 4.16 Table: `exchange_rates`

Exchange rate records for multi-currency conversion with cross-rate routing via USD.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique rate identifier |
| `base_currency` | text | NOT NULL | Base currency code |
| `target_currency` | text | NOT NULL | Target currency code |
| `rate` | decimal(15,6) | NOT NULL | Exchange rate value |
| `effective_date` | text | NOT NULL | Date the rate is effective |
| `source` | text | NOT NULL, default `'manual'` | Rate source (manual, api, etc.) |
| `created_by` | varchar | nullable, FK → `users.id` | Admin who entered the rate |
| `created_at` | timestamp | default `now()` | Record creation timestamp |

### 4.17 Table: `retention_policies`

Per-country data retention policy configuration for regulatory compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique policy identifier |
| `country` | text | NOT NULL | Country name |
| `entity_type` | text | NOT NULL | Entity type subject to retention |
| `retention_years` | integer | NOT NULL | Number of years to retain data |
| `archive_after_years` | integer | nullable | Years after which to archive |
| `description` | text | nullable | Policy description |
| `is_active` | boolean | default `true` | Whether the policy is active |
| `created_at` | timestamp | default `now()` | Record creation timestamp |
| `updated_at` | timestamp | default `now()` | Last update timestamp |

### 4.18 Table: `api_configurations`

Centralized external API configuration management per country.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Unique configuration identifier |
| `name` | text | NOT NULL | API configuration name |
| `category` | text | NOT NULL | API category (weather, judicial, payment_gateway, exchange_rate) |
| `base_url` | text | NOT NULL | API base URL |
| `api_key_header_name` | text | default `'X-API-Key'` | Header name for API key authentication |
| `auth_type` | text | NOT NULL, default `'none'` | Authentication type (none, api_key, bearer, basic) |
| `country` | text | nullable | Country this configuration applies to |
| `is_active` | boolean | default `true` | Whether the configuration is active |
| `description` | text | nullable | Configuration description |
| `last_tested_at` | timestamp | nullable | Last connection test timestamp |
| `last_test_status` | text | nullable | Result of last connection test |
| `created_at` | timestamp | default `now()` | Record creation timestamp |
| `updated_at` | timestamp | default `now()` | Last update timestamp |

### 4.19 Enumeration Types

| Enum Name | Values |
|-----------|--------|
| `user_role` | `admin`, `regulator`, `lender`, `viewer` |
| `user_status` | `active`, `suspended`, `deactivated` |
| `borrower_type` | `individual`, `corporate` |
| `account_status` | `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `inquiry_purpose` | `new_credit`, `review`, `collection`, `regulatory`, `portfolio_monitoring` |
| `approval_status` | `pending`, `approved`, `rejected` |
| `dispute_status` | `open`, `under_review`, `resolved`, `rejected` |
| `judgment_type` | `lien`, `bankruptcy`, `lawsuit`, `civil_judgment`, `criminal_conviction` |
| `judgment_status` | `active`, `resolved`, `appealed` |
| `consent_status` | `active`, `revoked` |
| `payment_status` | `on_time`, `late`, `missed`, `partial` |
| `institution_status` | `pending`, `active`, `suspended` |
| `billing_status` | `pending`, `paid`, `overdue` |
| `api_key_status` | `active`, `revoked` |

### 4.17 Entity Relationships

```
users ──────────────┐
  │                 │
  ├─→ credit_inquiries.inquired_by
  ├─→ pending_approvals.requested_by / reviewed_by
  ├─→ disputes.filed_by
  ├─→ notifications.user_id
  ├─→ credit_report_logs.requested_by
  ├─→ institutions.approved_by
  └─→ api_keys.created_by

borrowers ──────────┐
  │                 │
  ├─→ credit_accounts.borrower_id
  ├─→ credit_inquiries.borrower_id
  ├─→ disputes.borrower_id
  ├─→ court_judgments.borrower_id
  ├─→ consent_records.borrower_id
  ├─→ credit_report_logs.borrower_id
  └─→ borrowers.related_borrower_id (self-referencing)

credit_accounts ────┐
  │                 │
  ├─→ disputes.credit_account_id
  └─→ payment_history.credit_account_id

institutions ───────┐
  │                 │
  └─→ api_keys.institution_id

users ──────────────┐
  │                 │
  └─→ exchange_rates.created_by
```

---

## 5. API Endpoint Catalog

### 5.1 Authentication Endpoints (No Auth Required)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/auth/login` | User login | `{ username, password }` | User object + `passwordExpired` flag |
| `POST` | `/api/auth/logout` | User logout | — | `{ message }` |
| `GET` | `/api/auth/me` | Get current user | — | User object + `passwordExpired` flag |
| `POST` | `/api/auth/change-password` | Change password | `{ currentPassword, newPassword }` | `{ message }` |
| `POST` | `/api/auth/mfa/setup` | Generate TOTP secret for MFA setup (ENT-01) | — | `{ secret, uri }` |
| `POST` | `/api/auth/mfa/verify` | Verify TOTP code and enable MFA (ENT-01) | `{ code }` | `{ message }` |
| `POST` | `/api/auth/mfa/disable` | Disable MFA for authenticated user (ENT-01) | — | `{ message }` |
| `POST` | `/api/auth/mfa/login` | Complete MFA login with TOTP code (ENT-01) | `{ userId, code }` | User object |

### 5.2 Health Check (No Auth Required)

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/health` | System health check | `{ status: "ok" }` |

### 5.3 Dashboard Endpoints (Authenticated)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/dashboard/stats` | Any | Dashboard statistics (8 stat cards) |
| `GET` | `/api/dashboard/details/:type` | Any | Drill-down details (type: borrowers, accounts, outstanding, delinquent, defaults, inquiries, pending, disputes) |
| `GET` | `/api/dashboard/chart-data` | Any | Returns monthly trend, status breakdown, type breakdown, and country breakdown for dashboard visualizations |
| `GET` | `/api/dashboard/trends` | Any | Returns 7-day synthetic trend data for key metrics (borrowers, accounts, disputes, inquiries, delinquent, defaults, approvals) |

### 5.4 User Management Endpoints (Admin Only)

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| `GET` | `/api/users` | List all users | — |
| `POST` | `/api/users` | Create user | InsertUser schema |
| `PATCH` | `/api/users/:id` | Update user | Partial user fields |

### 5.5 Borrower Endpoints (Authenticated)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/borrowers` | List borrowers | Supports `?search=`, `?page=`, `?limit=` (server-side pagination) |
| `GET` | `/api/borrowers/:id` | Get borrower detail | — |
| `POST` | `/api/borrowers` | Register borrower | Creates pending approval (maker-checker) |
| `PATCH` | `/api/borrowers/:id` | Update borrower | Creates pending approval (maker-checker) |
| `GET` | `/api/borrowers/:id/related` | Get related borrowers | Returns parent and child relationships |
| `GET` | `/api/borrowers/:id/credit-report` | Legacy credit report | Basic report without serial number |
| `GET` | `/api/borrowers/fuzzy-match` | Fuzzy entity matching (ENT-02) | Query: `?name=<search_term>`; returns potential duplicates with similarity scores |

### 5.6 Credit Account Endpoints (Authenticated)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/credit-accounts` | List accounts | Supports `?borrowerId=` filter |
| `GET` | `/api/credit-accounts/:id` | Get account detail | — |
| `POST` | `/api/credit-accounts` | Create account | Creates pending approval (maker-checker) |
| `PATCH` | `/api/credit-accounts/:id` | Update account | Creates pending approval (maker-checker) |

### 5.7 Credit Inquiry Endpoints (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/credit-inquiries` | List inquiries (supports `?borrowerId=`) |
| `POST` | `/api/credit-inquiries` | Create inquiry |

### 5.8 Credit Report & Search Endpoints (Authenticated)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `POST` | `/api/credit-reports/generate` | Generate credit report | Returns full report with serial number, score, reason codes, payment history |
| `GET` | `/api/credit-reports/logs` | Report generation logs | Admin/Regulator only |
| `POST` | `/api/credit-search/bulk` | Bulk credit search | Body: `{ identifiers: string[] }` |

### 5.9 Maker-Checker Endpoints (Authenticated)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/pending-approvals` | Any | List all pending approvals |
| `POST` | `/api/pending-approvals` | Any | Submit for approval |
| `PATCH` | `/api/pending-approvals/:id` | Admin, Regulator | Approve or reject (self-approval prevented) |

### 5.10 Dispute Endpoints (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/disputes` | List disputes |
| `GET` | `/api/disputes/:id` | Get dispute detail |
| `POST` | `/api/disputes` | File dispute (auto-sets SLA deadline) |
| `PATCH` | `/api/disputes/:id` | Update dispute status/resolution |

### 5.11 Notification Endpoints (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `GET` | `/api/notifications/unread-count` | Get unread count |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |
| `POST` | `/api/notifications/mark-all-read` | Mark all as read |

### 5.12 Court Judgment Endpoints (Authenticated)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/court-judgments` | Any | List judgments (supports `?borrowerId=`) |
| `POST` | `/api/court-judgments` | Admin, Regulator | Create judgment |

### 5.13 Consent Record Endpoints (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/consent-records` | List records (supports `?borrowerId=`) |
| `POST` | `/api/consent-records` | Grant consent (auto-generates receipt number) |
| `POST` | `/api/consent-records/:id/revoke` | Revoke consent |

### 5.14 Payment History Endpoints (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/payment-history/:creditAccountId` | Get payment history (12-period max) |
| `POST` | `/api/payment-history/:creditAccountId` | Add payment history entry |

### 5.15 Institution Endpoints (Authenticated)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/institutions` | Any | List institutions (paginated) |
| `POST` | `/api/institutions` | Any | Register institution |
| `PATCH` | `/api/institutions/:id` | Admin | Update institution |
| `POST` | `/api/institutions/:id/approve` | Admin | Approve institution |

### 5.16 Billing Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/billing` | Admin, Regulator | List billing records |
| `POST` | `/api/billing` | Admin | Create billing record |

### 5.17 Batch Upload Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/batch-upload/credit-accounts` | Admin, Lender | Bulk upload credit accounts |

### 5.18 Audit Log Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/audit-logs` | Admin, Regulator | List audit log entries (200 most recent) |
| `GET` | `/api/audit/verify-integrity` | Admin, Regulator | Verify audit log hash chain integrity (ENT-07) |

### 5.19 Reports & Export Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/reports/export` | Admin, Regulator | CSV/XLSX export (`?format=csv|xlsx&type=portfolio|borrowers|audit`) |
| `GET` | `/api/reports/regulatory` | Admin, Regulator | Regulatory analytics (NPL, portfolio breakdown, SLA) |

### 5.20 API Key Management Endpoints (Admin Only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/api-keys` | List all API keys with institution names |
| `POST` | `/api/api-keys` | Generate new API key |
| `POST` | `/api/api-keys/:id/revoke` | Revoke an API key |

### 5.21 OAuth 2.1 Token Endpoint (ENT-04)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/external/oauth/token` | Exchange API key for Bearer token | `{ grant_type: "client_credentials", client_id, client_secret }` | `{ access_token, token_type: "Bearer", expires_in: 3600 }` |

### 5.22 External API Endpoints (X-API-Key or Bearer Token Auth)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/external/v1/health` | None | Health check (no auth required) |
| `POST` | `/api/external/v1/borrowers` | submit | Create borrower(s) — single object or batch array |
| `GET` | `/api/external/v1/borrowers/search` | read | Search borrowers (`?nationalId=`, `?name=`, `?q=`) |
| `GET` | `/api/external/v1/borrowers/:id/credit-report` | read | Full credit report with score |
| `POST` | `/api/external/v1/credit-accounts` | submit | Submit credit account(s) — single or batch |
| `GET` | `/api/external/v1/credit-accounts/:borrowerId` | read | Get accounts by borrower |
| `POST` | `/api/external/v1/payment-history` | submit | Submit payment history records — single or batch |
| `POST` | `/api/external/v1/court-judgments` | submit | Submit court judgment |

**External API Response Format:**
```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

**External API Error Format:**
```json
{
  "success": false,
  "error": "Error description",
  "details": "...",
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

### 5.23 Exchange Rate Endpoints (Admin Only)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/exchange-rates` | List all exchange rates | Returns all rate records |
| `POST` | `/api/exchange-rates` | Create exchange rate | Body: InsertExchangeRate schema |
| `PATCH` | `/api/exchange-rates/:id` | Update exchange rate | Partial rate fields |
| `DELETE` | `/api/exchange-rates/:id` | Delete exchange rate | Hard delete |
| `POST` | `/api/exchange-rates/convert` | Convert between currencies | Body: `{ from, to, amount }`; uses cross-rate via USD routing |

### 5.24 Retention Policy Endpoints (Admin Only)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/retention-policies` | List all retention policies | Returns per-country policies |
| `POST` | `/api/retention-policies` | Create retention policy | Body: InsertRetentionPolicy schema |
| `PATCH` | `/api/retention-policies/:id` | Update retention policy | Partial policy fields |
| `DELETE` | `/api/retention-policies/:id` | Delete retention policy | Hard delete |
| `POST` | `/api/retention-policies/enforce` | Trigger retention enforcement | Manually triggers the retention enforcement engine; returns audit-logged results |

### 5.25 API Configuration Endpoints (Admin Only)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/api-configurations` | List all API configurations | Returns per-country API configs |
| `POST` | `/api/api-configurations` | Create API configuration | Body: InsertApiConfiguration schema |
| `PATCH` | `/api/api-configurations/:id` | Update API configuration | Partial config fields |
| `DELETE` | `/api/api-configurations/:id` | Delete API configuration | Hard delete |
| `POST` | `/api/api-configurations/:id/test` | Test API connection | Tests connectivity to configured endpoint; SSRF protection enforced |

### 5.26 Global Search Endpoint (Authenticated)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/global-search?q=TERM&country=COUNTRY` | Cross-entity search | Searches borrowers, institutions, and credit accounts simultaneously; returns categorized results; optional country filter |

### 5.27 Photo & Document Upload Endpoints (Authenticated)

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `POST` | `/api/borrowers/:id/photo` | Upload borrower photo | `multipart/form-data` with field name `photo`; max 5MB; images only; randomized filename |
| `POST` | `/api/borrowers/:id/id-document` | Upload borrower ID document | `multipart/form-data` with field name `document`; max 10MB; images or PDF; randomized filename |

### 5.28 AI Endpoints (Authenticated)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/ai/credit-risk/:borrowerId` | Any authenticated | AI-powered credit risk analysis for a borrower; returns riskLevel, riskScore (0-100), summary, factors, recommendations, regulatoryFlags |
| `POST` | `/api/ai/report-summary/:borrowerId` | Any authenticated | AI-generated plain-language credit report summary; returns summary text, borrowerName, generatedAt timestamp |
| `POST` | `/api/ai/chat` | Any authenticated | AI chatbot with SSE streaming; body: `{ messages: [{role, content}] }`; returns `text/event-stream` with chunked response |
| `POST` | `/api/ai/compliance-report` | Admin, Super Admin, Regulator | AI-generated regulatory compliance report for a country; body: `{ country }`; returns complianceScore, regulatoryBody, dataProtectionLaw, riskAreas, recommendations |

### 5.29 API Usage Analytics Endpoint (Admin Only)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/api-usage` | Admin, Super Admin | Returns API usage statistics: totalToday, totalThisHour, uniqueEndpoints, topEndpoints (sorted by count), hourlyData (24-hour breakdown) |

---

## 6. Security Architecture

### 6.1 Role-Based Access Control (RBAC)

The system enforces four user roles with the following access matrix:

| Feature | Admin | Regulator | Lender | Viewer |
|---------|-------|-----------|--------|--------|
| User Management | Full | None | None | None |
| Institution Management | Full | None | None | None |
| API Key Management | Full | None | None | None |
| Billing | Full | Read | None | None |
| Audit Logs | Full | Read | None | None |
| Approve/Reject Changes | Yes | Yes | None | None |
| Court Judgments (create) | Yes | Yes | None | None |
| Batch Upload | Yes | None | Yes | None |
| Reports/Export | Yes | Yes | None | None |
| Borrowers/Accounts | Full | Full | Full | Read |
| Disputes | Full | Full | Full | Full |
| Consent Management | Full | Full | Full | Full |
| Dashboard | Full | Full | Full | Full |
| Helpdesk | Full | Full | Full | Full |

RBAC is enforced server-side via the `requireRole()` middleware function that checks `req.session.userRole` against allowed roles.

### 6.2 Session Management

| Parameter | Value | SRS Reference |
|-----------|-------|---------------|
| Idle Timeout | 15 minutes | NFR-SEC-09 |
| Maximum Session | 8 hours | Cookie maxAge |
| Store | memorystore | In-memory, not persisted |
| Cookie Flags | httpOnly=true, sameSite=lax, secure=false | — |
| Cleanup Interval | 24 hours | memorystore checkPeriod |

The idle timeout is enforced by server-side middleware that compares `req.session.lastActivity` with current time. Expired sessions receive HTTP 440 status.

### 6.3 Password Policy

| Rule | Requirement |
|------|------------|
| Minimum Length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Expiry | 90 days from last change |
| Hashing | bcrypt with 10 salt rounds |
| Force Change | `mustChangePassword` flag on user record |
| Validation Regex | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` |

### 6.4 Login Lockout

| Parameter | Value |
|-----------|-------|
| Max Attempts | 3 consecutive failed logins |
| Lockout Duration | 15 minutes |
| Reset | Successful login resets counter to 0 |
| Tracking | `failed_login_attempts` and `locked_until` columns on users table |

### 6.5 API Key Authentication

External API endpoints use API key authentication via the `X-API-Key` HTTP header:

1. Client sends full API key in `X-API-Key` header
2. Server computes SHA-256 hash of the provided key
3. Server looks up the hash in the `api_keys` table
4. Server verifies key status is `active` and institution status is `active`
5. Server checks permission level (`submit`, `read`, or `full`) against endpoint requirements
6. `last_used_at` timestamp is updated asynchronously

**Key Generation:**
- Format: `sim_{8_hex_chars}_{48_hex_chars}` (prefix + secret)
- Full key is shown only once at creation time
- Only the SHA-256 hash and prefix are stored in the database

### 6.6 Audit Logging

All significant actions are logged to the `audit_logs` table with:
- **User ID** of the actor
- **Action** type (LOGIN, CREATE, UPDATE, APPROVE, REJECT, FILE_DISPUTE, GRANT_CONSENT, REVOKE_CONSENT, BATCH_UPLOAD, BULK_SEARCH, GENERATE_REPORT, API_SUBMIT, API_BATCH_SUBMIT, API_CREDIT_REPORT, LOGIN_FAILED, ACCOUNT_LOCKED, PASSWORD_CHANGE, LOGOUT)
- **Entity** type and ID
- **IP Address** (via `req.ip` with trust proxy enabled)
- **Details** — human-readable description
- **Timestamp** — auto-generated

### 6.7 Maker-Checker Workflow

The four-eye principle is enforced for borrower and credit account changes:

1. Any authenticated user can submit a change (CREATE or UPDATE)
2. The change is stored in `pending_approvals` with status `pending`
3. Only users with `admin` or `regulator` role can approve/reject
4. **Self-approval prevention:** The server rejects approval if `requestedBy === currentUserId` (HTTP 403)
5. Upon approval, the change payload is automatically applied to the target entity
6. Notifications are sent to relevant users at each step

---

## 7. Deployment Architecture

### 7.1 Replit Environment

The application is designed for deployment on Replit with autoscale configuration:

```
Build Command: npm run build
Run Command:   node ./dist/index.cjs
```

### 7.2 Build Process

The build process consists of two stages:

1. **Server Build (esbuild):**
   - Entry point: `server/index.ts`
   - Output: `dist/index.cjs` (CommonJS bundle)
   - Platform: Node.js
   - External packages: Excluded from bundle (resolved from node_modules)

2. **Frontend Build (Vite):**
   - Entry point: `client/index.html`
   - Output: `dist/public/` (static assets)
   - Includes: Asset optimization, code splitting, minification

### 7.3 Production Serving

In production (`NODE_ENV=production`), the `server/static.ts` module serves the built frontend assets from `dist/public/`. It handles both ESM (`__dirname`) and CJS (`import.meta.url`) contexts for path resolution.

In development (`NODE_ENV=development`), Vite's dev server is used with HMR support via `server/vite.ts`.

### 7.4 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | Recommended | `credit-registry-dev-secret` | Session encryption secret |
| `PORT` | No | `5000` | HTTP server port |
| `NODE_ENV` | No | `development` | Environment mode (`production` or `development`) |

### 7.5 Health Checks

- **Internal:** `GET /api/health` → `{ status: "ok" }`
- **External:** `GET /api/external/v1/health` → `{ status: "ok", version: "1.1", service: "Systems In Motion Credit Registry API" }`

---

## 8. Integration Points

### 8.1 External REST API

The system exposes a REST API at `/api/external/v1/*` for institutions to programmatically interact with the registry:

**Authentication:** API key via `X-API-Key` HTTP header with SHA-256 hashing.

**Permission Levels:**
| Level | Capabilities |
|-------|-------------|
| `submit` | Create borrowers, credit accounts, payment history, court judgments |
| `read` | Search borrowers, retrieve credit reports, view credit accounts |
| `full` | All submit + read capabilities |

**Batch Submission:** Endpoints accepting POST data support both single object and array payloads. Batch submissions return per-record results with error details for failed records.

**Response Envelope:** All external API responses follow a consistent envelope format with `success`, `message`, `data`, and `timestamp` fields.

### 8.2 Batch File Upload

The internal batch upload feature (`POST /api/batch-upload/credit-accounts`) accepts JSON arrays of credit account records:

**Supported Input:**
```json
{
  "records": [
    {
      "borrowerId": "...",
      "lenderInstitution": "...",
      "accountNumber": "...",
      "accountType": "...",
      "originalAmount": "...",
      "currentBalance": "...",
      "currency": "ETB",
      "status": "current"
    }
  ]
}
```

**Validation:** Each record is independently validated against the `insertCreditAccountSchema` (Zod). Valid records are inserted; invalid records are collected with error details.

**Response:**
```json
{
  "totalSubmitted": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    { "index": 3, "message": "Required field 'accountNumber' missing" }
  ]
}
```

### 8.3 DiceBear Avatar Service

The system integrates with the DiceBear API (`https://api.dicebear.com`) for auto-generated borrower profile avatars:

- **Usage:** Default profile photos for borrowers who have not uploaded a custom photo
- **Seed Value:** Borrower ID is used as the avatar seed — no personally identifiable information (PII) is transmitted
- **Style:** Deterministic avatar generation ensuring consistent avatars for the same borrower across sessions
- **Privacy:** No authentication required; only a hash/ID seed is sent to the service

### 8.4 Exchange Rate API

The system integrates with the Open Exchange Rate API (`https://open.er-api.com`) for live currency rate fetching:

- **Usage:** Fetching current exchange rates for 42+ African currencies plus USD, EUR, GBP
- **Authentication:** No API key required (free tier)
- **Endpoint:** `GET https://open.er-api.com/v6/latest/{BASE_CURRENCY}`
- **Refresh:** Rates can be refreshed manually via `POST /api/exchange-rates/refresh` or fetched on-demand
- **Fallback:** Manual rate entry is supported when the external API is unavailable

### 8.5 File Upload Architecture

Borrower photos and ID documents are stored on the local filesystem:

- **Photo uploads:** Stored in `uploads/photos/` (max 5MB, images only)
- **Document uploads:** Stored in `uploads/documents/` (max 10MB, images or PDF)
- **Filename generation:** Randomized filenames using timestamp and random base-36 string to prevent collisions and enumeration
- **MIME type validation:** Server-side validation via multer file filter (images only for photos; images or PDF for documents)
- **Serving:** Static files served via authenticated `/uploads` route with `requireAuth` middleware
- **Audit logging:** All uploads are recorded in the audit log with uploader user ID and borrower reference

### 8.6 CSV & Excel Export

The reporting module supports CSV and XLSX export for portfolio, borrower, and audit data:

- `GET /api/reports/export?format=csv&type=portfolio` — Credit account portfolio data (CSV)
- `GET /api/reports/export?format=csv&type=borrowers` — Borrower demographic data (CSV)
- `GET /api/reports/export?format=csv&type=audit` — Audit trail data (CSV)
- `GET /api/reports/export?format=xlsx&type=portfolio` — Credit account portfolio data (XLSX)
- `GET /api/reports/export?format=xlsx&type=borrowers` — Borrower demographic data (XLSX)
- `GET /api/reports/export?format=xlsx&type=audit` — Audit trail data (XLSX)

CSV files are generated on-the-fly with appropriate `Content-Type: text/csv` and `Content-Disposition` headers. XLSX files are generated using the `exceljs` package with formatted worksheets featuring teal header styling (white bold text on dark teal background `#0D4A42`), auto-sized columns, and professional formatting.

---

## 9. Data Flow Diagrams

### 9.1 User Login Flow

```
Client                          Server                          Database
  │                               │                               │
  │  POST /api/auth/login         │                               │
  │  { username, password }       │                               │
  │──────────────────────────────→│                               │
  │                               │  SELECT * FROM users          │
  │                               │  WHERE username = ?           │
  │                               │──────────────────────────────→│
  │                               │                    user record│
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Check: status === 'active'   │
  │                               │  Check: not locked            │
  │                               │  bcrypt.compare(password)     │
  │                               │                               │
  │                               │  [If valid]:                  │
  │                               │  Reset failed attempts        │
  │                               │  Update last_login            │
  │                               │  Set session (userId, role)   │
  │                               │  Create audit log (LOGIN)     │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { user, passwordExpired }│                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [If invalid (attempt < 3)]:  │
  │                               │  Increment failed_attempts    │
  │                               │  Create audit log (FAIL)      │
  │  401 "Invalid credentials"    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [If 3rd failure]:            │
  │                               │  Lock account 15 min          │
  │                               │  Create audit log (LOCKED)    │
  │  423 "Account locked"         │                               │
  │←──────────────────────────────│                               │
```

### 9.2 Borrower Registration with Maker-Checker

```
Lender User                     Server                          Database
  │                               │                               │
  │  POST /api/borrowers          │                               │
  │  { type, firstName, ... }     │                               │
  │──────────────────────────────→│                               │
  │                               │  Validate with Zod schema     │
  │                               │  INSERT pending_approvals     │
  │                               │  (status = 'pending')         │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Create audit log             │
  │                               │  Notify admin/regulator users │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  201 { approval, message }    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │

Admin/Regulator                 Server                          Database
  │                               │                               │
  │  PATCH /api/pending-approvals/:id                             │
  │  { status: "approved" }       │                               │
  │──────────────────────────────→│                               │
  │                               │  Check: requestedBy !== me    │
  │                               │  Check: status === 'pending'  │
  │                               │                               │
  │                               │  Update approval status       │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  [If approved]:               │
  │                               │  Parse payload JSON           │
  │                               │  INSERT INTO borrowers        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Create audit log (APPROVE)   │
  │                               │  Notify requester             │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { updated approval }     │                               │
  │←──────────────────────────────│                               │
```

### 9.3 Credit Report Generation

```
User                            Server                          Database
  │                               │                               │
  │  POST /api/credit-reports/generate                            │
  │  { borrowerId, purpose }      │                               │
  │──────────────────────────────→│                               │
  │                               │  Get borrower                 │
  │                               │  Get credit accounts          │
  │                               │  Get credit inquiries         │
  │                               │  Get court judgments           │
  │                               │  Get consent records          │
  │                               │  Get payment history (each)   │
  │                               │──────────────────────────────→│
  │                               │                    all data   │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Generate serial number       │
  │                               │  (CR-{YEAR}-{base36})         │
  │                               │                               │
  │                               │  Calculate credit score       │
  │                               │  (300-850 algorithm)          │
  │                               │  Generate reason codes        │
  │                               │                               │
  │                               │  INSERT credit_report_logs    │
  │                               │  INSERT audit_logs            │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { serialNumber, score,   │                               │
  │    reasonCodes, accounts,     │                               │
  │    judgments, consents, ... }  │                               │
  │←──────────────────────────────│                               │
```

### 9.4 External API Submission Flow

```
Institution                     Server                          Database
  │                               │                               │
  │  POST /api/external/v1/borrowers                              │
  │  X-API-Key: sim_xxxx_yyyy     │                               │
  │  [{ ... }, { ... }]           │                               │
  │──────────────────────────────→│                               │
  │                               │  SHA-256 hash the key         │
  │                               │  Lookup api_keys by hash      │
  │                               │──────────────────────────────→│
  │                               │                     api_key   │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Check: key status = active   │
  │                               │  Check: institution active    │
  │                               │  Check: permission = submit   │
  │                               │                               │
  │                               │  For each record:             │
  │                               │    Validate with Zod          │
  │                               │    INSERT borrowers           │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Update key last_used_at      │
  │                               │  Create audit log             │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { success: true,         │                               │
  │    submitted: N, failed: M,   │                               │
  │    results: [...],            │                               │
  │    errors: [...] }            │                               │
  │←──────────────────────────────│                               │
```

### 9.5 Dispute Lifecycle

```
State Diagram:

  ┌──────┐     File      ┌──────────────┐
  │ None │──────────────→│     OPEN      │
  └──────┘               └──────┬───────┘
                                │
                          Review │
                                │
                         ┌──────▼───────┐
                         │ UNDER_REVIEW │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │                       │
              Resolve │                Reject │
                    │                       │
             ┌──────▼──┐           ┌───────▼───┐
             │ RESOLVED │           │ REJECTED  │
             └─────────┘           └───────────┘

SLA Deadlines:
  - Financial corrections: 2 working days from filing
  - Non-financial corrections: 5 working days from filing
  - SLA deadline calculated at creation time based on correctionType
```

---

## 10. Error Handling

### 10.1 Zod Validation

All incoming request bodies are validated using Zod schemas derived from Drizzle table definitions via `drizzle-zod`:

- `insertBorrowerSchema` — Borrower creation/update
- `insertCreditAccountSchema` — Credit account creation/update
- `insertCreditInquirySchema` — Credit inquiry creation
- `insertUserSchema` — User creation
- `insertPendingApprovalSchema` — Approval submission
- `insertDisputeSchema` — Dispute filing
- `insertCourtJudgmentSchema` — Court judgment creation
- `insertConsentRecordSchema` — Consent creation
- `insertPaymentHistorySchema` — Payment history entry
- `insertInstitutionSchema` — Institution registration
- `insertBillingRecordSchema` — Billing record creation
- `insertCreditReportLogSchema` — Credit report log creation
- `insertApiKeySchema` — API key creation
- `insertExchangeRateSchema` — Exchange rate creation
- `insertRetentionPolicySchema` — Retention policy creation
- `insertApiConfigurationSchema` — API configuration creation

Validation failures return HTTP 400 with the Zod error message.

### 10.2 Error Middleware

The Express error middleware (`server/index.ts`) catches unhandled errors:

```typescript
app.use((err, _req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});
```

### 10.3 Graceful Degradation

- **SIGHUP** signal is ignored to prevent workflow-triggered termination
- **SIGPIPE** signal is ignored to handle broken pipe scenarios
- **Uncaught exceptions** and **unhandled rejections** are logged but do not crash the process
- **Notification creation failures** are silently caught (non-critical)
- **Maker-checker application errors** are logged but do not fail the approval update

### 10.4 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful response |
| 201 | Resource created |
| 400 | Validation error / Bad request |
| 401 | Authentication required / Invalid credentials |
| 403 | Insufficient permissions / Self-approval prevented |
| 404 | Resource not found |
| 423 | Account locked |
| 440 | Session expired (idle timeout) |
| 500 | Internal server error |

---

## 11. Performance

### 11.1 Connection Pooling

The PostgreSQL connection pool is configured for resource efficiency:

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 30000,
});
```

- **Max connections:** 2 (suitable for single-instance deployment)
- **Idle timeout:** 30 seconds

### 11.2 Server-Side Pagination

High-volume tables implement server-side pagination:

- **Borrowers:** `GET /api/borrowers?page=1&limit=50` (max 200 per page)
- **Institutions:** `GET /api/institutions?page=1&limit=50` (max 200 per page)

Response format:
```json
{
  "data": [...],
  "total": 100005
}
```

### 11.3 Query Limits

Non-paginated endpoints apply query limits to prevent memory issues:

| Entity | Default Limit |
|--------|-------------|
| Credit Accounts | 200 records |
| Credit Inquiries | 200 records |
| Audit Logs | 200 records |
| Court Judgments | 200 records |
| Consent Records | 200 records |
| Credit Report Logs | 200 records |
| Search Results | 200 records |
| Notifications | 50 records |
| Payment History | 12 records (per account) |

### 11.4 Seed Data Volumes

The system is seeded with production-representative data volumes:

| Entity | Count |
|--------|-------|
| Borrowers | 102,462 |
| Institutions | 100,020 |
| Credit Accounts | 172,359 |
| Payment History | 120,000 |
| Credit Inquiries | 25,004 |
| Consent Records | 15,000 |
| Audit Logs | 5,063 |
| Disputes | 3,218 |
| Court Judgments | 2,147 |
| Billing Records | 120 |
| System Users | 6 |

---

## 12. Monitoring & Logging

### 12.1 Audit Trail

All significant system actions are recorded in the `audit_logs` table. The audit trail is immutable (insert-only) and captures:

- **Actor identification** — User ID of the person/system performing the action
- **Action classification** — Standardized action type strings
- **Entity tracking** — Type and ID of affected entity
- **IP tracking** — Client IP address (via Express trust proxy)
- **Timestamps** — Auto-generated creation time
- **Details** — Human-readable description of the action

**Action Types:**
`LOGIN`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `LOGOUT`, `PASSWORD_CHANGE`, `CREATE`, `UPDATE`, `SUBMIT_APPROVAL`, `APPROVE`, `REJECT`, `FILE_DISPUTE`, `UPDATE_DISPUTE`, `GRANT_CONSENT`, `REVOKE_CONSENT`, `VIEW`, `GENERATE_REPORT`, `BATCH_UPLOAD`, `BULK_SEARCH`, `API_SUBMIT`, `API_BATCH_SUBMIT`, `API_CREDIT_REPORT`, `UPLOAD_PHOTO`, `UPLOAD_ID_DOCUMENT`, `MFA_ENABLED`, `MFA_DISABLED`

**Enhanced Audit Trail UI (v1.3):**
- **Timeline View:** Toggle between table view and vertical timeline feed. Timeline displays colored activity dots: green for CREATE actions, blue for UPDATE actions, red for DELETE actions.
- **Date Range Filters:** "From" and "To" date input fields to narrow audit log results to a specific date range.
- **Export:** CSV and Excel (XLSX) export buttons allow downloading filtered audit trail data in both formats.

### 12.2 API Request Logging

All `/api/*` requests are logged to the console with:

- HTTP method and path
- Response status code
- Response time in milliseconds
- Truncated response body (first 200 characters)

Format: `{time} [express] {METHOD} {path} {status} in {duration}ms :: {response_preview}`

### 12.3 Console Logging

The `log()` function in `server/index.ts` provides timestamped console output:

```
1:30:45 PM [express] POST /api/auth/login 200 in 45ms :: {"id":"...","username":"admin",...}
```

Error conditions are logged via `console.error()` for:
- Uncaught exceptions
- Unhandled promise rejections
- Internal server errors
- Seed database errors
- Maker-checker application errors

---

## 13. Enterprise Enhancements (v1.1 — v2.0)

### 13.1 TOTP Multi-Factor Authentication (ENT-01)

**Purpose:** Adds a second authentication factor using Time-Based One-Time Passwords (TOTP) compatible with authenticator apps (Google Authenticator, Authy, etc.).

**Architecture:**
- **Library:** `otpauth` for TOTP generation and validation
- **Schema:** `mfaSecret` (varchar, nullable) and `mfaEnabled` (boolean, default false) columns on `users` table
- **Endpoints:** `POST /api/auth/mfa/setup`, `POST /api/auth/mfa/verify`, `POST /api/auth/mfa/disable`, `POST /api/auth/mfa/login`
- **Frontend:** `mfa-setup.tsx` component with QR code URI display and verification input
- **i18n:** Full EN/FR/PT translations under `mfa.*` and `login.mfa*` keys

**Flow:**
1. User enables MFA via setup dialog → server generates TOTP secret → client shows `otpauth://` URI
2. User scans QR code with authenticator app → enters 6-digit code → server verifies and sets `mfaEnabled = true`
3. On subsequent logins, `POST /api/auth/login` returns `{ requireMfa: true }` → client shows code input → `POST /api/auth/mfa/login` completes authentication

### 13.2 Fuzzy Entity Matching (ENT-02)

**Purpose:** Detects potential duplicate borrowers during registration using trigram similarity matching.

**Architecture:**
- **Extension:** `pg_trgm` enabled via `CREATE EXTENSION IF NOT EXISTS pg_trgm` at pool initialization in `server/db.ts`
- **Storage Method:** `fuzzyMatchBorrowers(name: string)` in `IStorage` / `DatabaseStorage`
- **Endpoint:** `GET /api/borrowers/fuzzy-match?name=<query>`
- **Algorithm:** PostgreSQL trigram similarity with threshold ≥ 0.3 combined with ILIKE fallback
- **Frontend:** Warning banner displayed on borrower registration form when potential duplicates are found

### 13.3 Dispute Chatbot (ENT-03)

**Purpose:** Guided chat-like assistant that walks users through the dispute filing process step by step, with an AI-powered assistant mode for intelligent question answering.

**Architecture:**
- **Component:** `client/src/components/dispute-chatbot.tsx`
- **Integration:** Embedded in the helpdesk page (`helpdesk.tsx`)
- **Flow Steps:** Issue type selection → Borrower search → Account selection → Description entry → Confirmation → Auto-submit
- **i18n:** Full EN/FR/PT translations under `chatbot.*` keys (askBorrower, searching, confirmSummary, cancelled, startNew)
- **Dispute Types:** Uses `disputes.types.*` i18n keys for localized type names

**AI Assistant Mode (v1.3):**
- **Toggle:** Sparkles icon button in chatbot header switches between guided dispute filing mode and AI assistant mode
- **Backend:** `POST /api/ai/chat` endpoint with SSE streaming via the `chatWithAI()` function in `server/ai.ts`
- **Capabilities:** Answers questions about credit data, regulations across 54 African countries, platform features, dispute processes, and compliance requirements
- **Streaming:** Responses are streamed in real-time via Server-Sent Events (SSE), providing a responsive conversational experience
- **History:** Full conversation history is maintained within the chat session and sent with each request for context continuity

### 13.4 OAuth 2.1 Bearer Token Authentication (ENT-04)

**Purpose:** Provides OAuth 2.1 client credentials token exchange as an alternative to X-API-Key authentication for the external API.

**Architecture:**
- **Library:** `jsonwebtoken` for JWT signing and verification
- **Endpoint:** `POST /api/external/oauth/token`
- **Grant Type:** `client_credentials`
- **Token Format:** JWT signed with HS256 using SESSION_SECRET
- **Token Payload:** `{ institutionId, permissions, apiKeyId }`
- **Token Expiry:** 3600 seconds (1 hour)
- **Dual Auth:** Both `X-API-Key` header and `Authorization: Bearer <token>` accepted on all external API endpoints
- **Frontend:** OAuth documentation section on API docs page with example code

### 13.5 Low-Bandwidth Optimizations (ENT-05)

**Purpose:** Reduces bandwidth consumption and improves load times for users on constrained networks.

**Architecture:**
- **Server Compression:** `compression` npm package applied as Express middleware in `server/index.ts`; gzip encoding for all HTTP responses
- **Code Splitting:** All route page components wrapped with `React.lazy()` in `client/src/App.tsx` (except Dashboard, Login, and NotFound which are eagerly loaded)
- **Suspense Fallback:** `LazyFallback` spinner component defined in `App.tsx` displayed while lazy-loaded components are fetching

### 13.6 XBRL Upload Support (ENT-06)

**Purpose:** Extends batch upload to accept XBRL/XML file format alongside JSON and CSV.

**Architecture:**
- **Server:** XBRL/XML parsing logic in `POST /api/batch-upload/credit-accounts` endpoint
- **Frontend:** Tabbed interface using shadcn `Tabs` component (JSON/CSV tab with `data-testid="tab-json"` and XBRL tab with `data-testid="tab-xbrl"`)
- **Sample Format:** XBRL sample XML structure displayed in the XBRL tab (`data-testid="text-xbrl-sample"`)
- **i18n:** EN/FR translations under `batchUpload.xbrl*` keys

### 13.7 Tamper-Evident Audit Log Hash Chain (ENT-07)

**Purpose:** Provides cryptographic proof of audit log integrity through a SHA-256 hash chain.

**Architecture:**
- **Schema:** `previousHash` (text, nullable) and `currentHash` (text, nullable) columns on `audit_logs` table
- **Hash Computation:** SHA-256 of `previousHash + action + entity + details + timestamp` using Node.js `crypto` module
- **Genesis:** First entry uses `previousHash = "genesis"`
- **Storage Method:** `verifyAuditIntegrity()` in `IStorage` / `DatabaseStorage` — retrieves all entries ordered by `created_at ASC`, recomputes hashes, and validates chain
- **Endpoint:** `GET /api/audit/verify-integrity` — returns `{ valid, totalEntries, checkedEntries, brokenAt }`
- **Frontend:** Integrity badge (`data-testid="badge-integrity-status"`) and verify button (`data-testid="button-verify-integrity"`) on audit trail page
- **i18n:** EN/FR translations under `audit.integrityValid`, `audit.integrityBroken`, `audit.verify`, `audit.hashChain`

### 13.8 Exchange Rate Management (ENT-08)

**Purpose:** Provides 42+ African currency support (plus USD, EUR, GBP) with cross-rate conversion via USD routing, live rate fetching from open.er-api.com, admin CRUD operations, and a currency converter widget.

**Architecture:**
- **Schema:** `exchange_rates` table with `base_currency`, `target_currency`, `rate` (decimal 15,6), `effective_date`, `source`, `created_by`
- **Cross-Rate Routing:** When a direct rate is unavailable, the system converts through USD as an intermediary (e.g., GHS → USD → ETB)
- **Endpoints:** `GET /api/exchange-rates`, `POST /api/exchange-rates`, `PATCH /api/exchange-rates/:id`, `DELETE /api/exchange-rates/:id`, `POST /api/exchange-rates/convert`
- **Live Rate Fetching:** Integration with open.er-api.com for automatic rate updates; manual refresh via `POST /api/exchange-rates/refresh`
- **Frontend:** `exchange-rates.tsx` page with admin CRUD interface and currency converter widget supporting all 42+ African currencies plus USD, EUR, GBP
- **Currencies:** GHS, ETB, UGX, LRD, NGN, KES, ZAR, EGP, MAD, TZS, RWF, XOF, XAF, MZN, AOA, BWP, ZMW, DZD, TND, LYD, MRU, SDG, ERN, DJF, SOS, SCR, MUR, MWK, ZWL, NAD, SZL, LSL, KMF, BIF, GMD, GNF, SLL, CVE, STN, CDF, SSP, USD, EUR, GBP

### 13.9 API Administration Module (ENT-09)

**Purpose:** Centralized configuration management for external APIs (weather, judicial, payment gateway, exchange rate) per country with connection testing and SSRF protection.

**Architecture:**
- **Schema:** `api_configurations` table with `name`, `category`, `base_url`, `api_key_header_name`, `auth_type`, `country`, `is_active`, `last_tested_at`, `last_test_status`
- **Categories:** weather, judicial, payment_gateway, exchange_rate
- **Auth Types:** none, api_key, bearer, basic
- **Endpoints:** `GET /api/api-configurations`, `POST /api/api-configurations`, `PATCH /api/api-configurations/:id`, `DELETE /api/api-configurations/:id`, `POST /api/api-configurations/:id/test`
- **SSRF Protection:** Connection testing validates URLs against internal/private network ranges before making outbound requests
- **Frontend:** `api-admin.tsx` page with per-country API configuration management and connection test interface

### 13.10 Retention Enforcement Engine (ENT-10)

**Purpose:** Automated and manual data retention enforcement with per-country policies, audit-logged results, and parameterized SQL for safe execution.

**Architecture:**
- **Schema:** `retention_policies` table with `country`, `entity_type`, `retention_years`, `archive_after_years`, `is_active`
- **Scheduler:** 24-hour interval automated enforcement via `server/retention-enforcement.ts`
- **Manual Trigger:** `POST /api/retention-policies/enforce` endpoint for on-demand execution
- **Per-Country Policies:** Configurable retention periods per country across all 54 African jurisdictions. Default seed policies:
  - Ghana: 10-year retention
  - Liberia: 7-year retention
  - Ethiopia: 7-year retention
  - Uganda: 7-year retention
- **Endpoints:** `GET /api/retention-policies`, `POST /api/retention-policies`, `PATCH /api/retention-policies/:id`, `DELETE /api/retention-policies/:id`, `POST /api/retention-policies/enforce`
- **Security:** All database queries use parameterized SQL to prevent injection; enforcement results are audit-logged
- **Frontend:** `retention-policies.tsx` page with policy CRUD and manual enforcement trigger

### 13.11 Cross-Border Entity Resolution (ENT-11)

**Purpose:** Enhanced cross-border borrower identification using passport numbers, expanded relationship types, and fuzzy matching across multiple identity fields.

**Architecture:**
- **Passport Field:** `passport_number` (text, nullable) column on `borrowers` table for cross-jurisdictional identification
- **Relationship Types:** 7 types supported — `spouse`, `guarantor`, `director`, `shareholder`, `beneficial_owner`, `subsidiary`, `parent_company`
- **Fuzzy Matching:** PostgreSQL `pg_trgm` trigram similarity extended to match on passport number, TIN, and name fields
- **Endpoint:** `GET /api/borrowers/fuzzy-match?name=<query>` — returns potential duplicates with similarity scores across all identity fields

### 13.12 Portuguese Language Support (ENT-12)

**Purpose:** Complete Portuguese (pt) localization for all system interfaces, extending the existing English/French translations.

**Architecture:**
- **Translation File:** `client/src/lib/i18n-pt.ts` — complete PT translation resource covering all UI strings
- **Integration:** Registered as `pt` language resource in `client/src/lib/i18n.ts` i18next configuration
- **Language Switcher:** Manual language selector available on the login page and main application header (`client/src/components/language-switcher.tsx`)
- **Coverage:** All navigation, forms, error messages, dashboard labels, and feature-specific keys (MFA, chatbot, batch upload, disputes, etc.)

### 13.13 Investor Demo Environment (ENT-13)

**Purpose:** One-click demo access for investors, evaluators, and stakeholders to explore the full system using pre-configured role-based credentials without requiring account setup.

**Architecture:**
- **Login Page:** "Try Interactive Demo" button presents 3 role cards (Admin, Regulator, Bank Officer) for instant login
- **Demo Banner:** Amber "DEMO ENVIRONMENT" banner persists across all pages, indicating fictional data mode
- **Data Disclaimer:** Warning notice on demo selection page informs users all data is seeded test data (102,462 borrowers, 172,359 credit accounts across 54 countries)
- **Session Handling:** Demo login uses standard authentication flow with pre-seeded credentials

### 13.14 Dashboard Visual Analytics (ENT-14)

**Purpose:** Interactive data visualization suite for the dashboard, providing at-a-glance portfolio insights through responsive charts and a geographic choropleth map of all 54 African countries.

**Architecture:**
- **Components:**
  - `client/src/components/dashboard-charts.tsx` — Recharts-based visualizations including a 12-month area trend chart (borrower and account growth), a donut chart for account status breakdown, and a horizontal bar chart for loan type distribution
  - `client/src/components/africa-map.tsx` — SVG choropleth map rendering all 54 African countries with heat coloring by borrower count, hover tooltips displaying country name, borrower count, and account count, and a legend showing activity levels
- **API:** `GET /api/dashboard/chart-data` (authenticated via `requireAuth` middleware) returns:
  - `monthlyTrend` — Array of monthly data points with borrower and account counts
  - `statusBreakdown` — Account status distribution (current, delinquent, default, closed, restructured, written_off)
  - `typeBreakdown` — Loan type distribution (term_loan, overdraft, mortgage, etc.)
  - `countryBreakdown` — Per-country borrower and account counts across all 54 African jurisdictions
- **Library:** Recharts for responsive, themed data visualization with automatic axis formatting and custom tooltips
- **Dark Mode:** Full dark mode support via CSS variable detection; chart colors and backgrounds adapt to the active theme
- **Responsiveness:** All charts use `ResponsiveContainer` for fluid resizing across viewport sizes

### 13.15 Interactive Demo Tour (ENT-15)

**Purpose:** An 11-step guided walkthrough that introduces new users to the system's key features in the demo environment.

**Architecture:**
- **Component:** `client/src/components/demo-tour.tsx` — Self-contained tour overlay with spotlight highlighting, step descriptions, and navigation controls
- **Steps:** 11 tour stops covering sidebar navigation, stat cards, portfolio growth chart, account status chart, loan type chart, Africa map, credit search, borrower management, settings, and completion
- **Auto-Launch:** Tour automatically launches after demo login via a `sessionStorage` flag (`demo_tour_shown`); only triggers once per session
- **Controls:** Next, Back, Skip, and Close buttons for user-driven navigation through tour steps
- **Spotlight Overlay:** Semi-transparent backdrop with a cut-out highlight around the target UI element for each step
- **Relaunch:** Users can restart the tour at any time via the "Take a Tour" button in the amber demo environment banner
- **Internationalization:** Tour step titles and descriptions are fully translated in all 5 AU languages (English, French, Portuguese, Arabic, Swahili) via i18n keys under `tour.*`

---

## 14. AI Integration Architecture (v1.3)

### 14.1 Overview

The system integrates OpenAI GPT-4o for four AI-powered features: credit risk analysis, report summarization, interactive chatbot, and regulatory compliance reports. All AI functionality is centralized in the `server/ai.ts` module.

### 14.2 Configuration

AI integration uses the Replit AI Integrations framework with the following environment variables:

| Variable | Purpose |
|----------|---------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | API key for OpenAI authentication |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Base URL for OpenAI API (may point to a proxy) |

The OpenAI client is initialized once at module load:

```typescript
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
```

### 14.3 AI Functions (`server/ai.ts`)

| Function | Purpose | Model | Max Tokens | Temperature |
|----------|---------|-------|------------|-------------|
| `analyzeCreditRisk(borrowerId)` | Credit risk assessment with risk score, factors, recommendations | GPT-4o | 1500 | 0.3 |
| `generateReportSummary(borrowerId)` | Plain-language credit report summary | GPT-4o | 1000 | 0.4 |
| `chatWithAI(messages, userRole)` | Interactive AI chatbot with SSE streaming | GPT-4o | 2000 | 0.5 |
| `generateComplianceReport(country)` | Per-country regulatory compliance analysis | GPT-4o | 2000 | 0.3 |

### 14.4 Credit Risk Analysis

**Endpoint:** `POST /api/ai/credit-risk/:borrowerId`  
**Authentication:** Required (any authenticated user)

**Process:**
1. Fetches borrower profile, credit accounts, and disputes from storage
2. Computes derived metrics: total balance, delinquent count, active count, open disputes
3. Constructs a borrower profile prompt with account details
4. Sends to GPT-4o with structured JSON output instructions
5. Parses response; falls back to default values if JSON parsing fails

**Response Schema:**
```json
{
  "riskLevel": "low | medium | high | critical",
  "riskScore": 0-100,
  "summary": "Executive summary text",
  "factors": [{"factor": "name", "impact": "positive|negative|neutral", "detail": "explanation"}],
  "recommendations": ["actionable recommendation"],
  "regulatoryFlags": ["compliance concern"]
}
```

**Frontend:** Purple "AI Risk Analysis" button on borrower detail page (`client/src/pages/borrower-detail.tsx`). Results displayed in an expandable purple-gradient card showing risk level badge, score, factors list, recommendations, and regulatory flags.

### 14.5 AI Report Summary

**Endpoint:** `POST /api/ai/report-summary/:borrowerId`  
**Authentication:** Required (any authenticated user)

**Process:**
1. Fetches borrower data, credit accounts, and disputes
2. Constructs report data prompt with account summaries and balances
3. Sends to GPT-4o requesting professional, plain-language summary (3-5 paragraphs)
4. Returns summary text, borrower name, and generation timestamp

**Response Schema:**
```json
{
  "summary": "Plain-language summary text",
  "borrowerName": "First Last",
  "generatedAt": "ISO 8601 timestamp"
}
```

**Frontend:** "AI Summary" button with Sparkles icon on credit report page (`client/src/pages/credit-report.tsx`). Summary shown in a collapsible card with borrower name and generation timestamp.

### 14.6 AI Smart Chatbot (SSE Streaming)

**Endpoint:** `POST /api/ai/chat`  
**Authentication:** Required (any authenticated user)

**Process:**
1. Receives conversation history as `messages` array with `{role, content}` objects
2. Prepends system message configuring the AI as a Pan-African Credit Registry expert
3. Opens SSE (Server-Sent Events) streaming connection with `text/event-stream` content type
4. Streams GPT-4o response chunks to client in real-time via `data:` events
5. Sends `data: [DONE]` sentinel when stream completes

**SSE Protocol:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content": "chunk of text"}
data: {"content": "more text"}
data: [DONE]
```

**Frontend:** Sparkles icon toggle in chatbot header (`client/src/components/dispute-chatbot.tsx`) switches between guided dispute filing mode and AI assistant mode. AI mode maintains full conversation history and renders streaming responses in real-time.

### 14.7 AI Compliance Reports

**Endpoint:** `POST /api/ai/compliance-report`  
**Authentication:** Required; roles restricted to `admin`, `super_admin`, `regulator`

**Process:**
1. Receives `country` in request body
2. Sends to GPT-4o with regulatory compliance expert system prompt
3. Returns structured JSON with compliance assessment
4. Falls back to basic object if JSON parsing fails

**Response Schema:**
```json
{
  "country": "Country Name",
  "regulatoryBody": "Name of financial regulator",
  "complianceScore": 0-100,
  "dataProtectionLaw": "Applicable law",
  "creditBureauRegulation": "Specific regulation",
  "retentionRequirements": "Data retention rules",
  "reportingRequirements": ["requirement"],
  "riskAreas": [{"area": "name", "severity": "low|medium|high", "detail": "explanation"}],
  "recommendations": ["recommendation"],
  "lastUpdated": "date"
}
```

**Frontend:** Country dropdown selector and "Generate Report" button on Regulatory Compliance page (`client/src/pages/regulatory-compliance.tsx`). Results displayed in a formatted card with compliance score, regulatory details, risk areas, and recommendations.

---

## 15. API Usage Tracking (v1.3)

### 15.1 Architecture

API usage tracking is implemented as an in-memory system using a `Map<string, number>` data structure in `server/routes.ts`. This design prioritizes low overhead and zero database load, with the trade-off that usage data resets on server restart.

### 15.2 Request Tracking Middleware

All `/api/*` routes are tracked via the `trackApiUsage()` function, which is called within the API request logging middleware. Each request is recorded with a composite key of `{hour}|{endpoint}` format.

**Key format:** `YYYY-MM-DDTHH|/api/endpoint/path`

### 15.3 Usage Statistics Endpoint

**Endpoint:** `GET /api/admin/api-usage`  
**Authentication:** Required; roles restricted to `admin`, `super_admin`

**Response Schema:**
```json
{
  "totalToday": 1234,
  "totalThisHour": 56,
  "uniqueEndpoints": 15,
  "topEndpoints": [
    {"endpoint": "/api/borrowers", "count": 234},
    {"endpoint": "/api/dashboard/stats", "count": 189}
  ],
  "hourlyData": [
    {"hour": "00:00", "requests": 12},
    {"hour": "01:00", "requests": 8}
  ]
}
```

- `totalToday`: Sum of all requests for the current calendar day
- `totalThisHour`: Sum of all requests for the current clock hour
- `uniqueEndpoints`: Count of distinct API paths accessed
- `topEndpoints`: All tracked endpoints sorted by request count (descending)
- `hourlyData`: 24-hour sliding window with hourly request counts

### 15.4 Frontend

The API Administration page (`client/src/pages/api-admin.tsx`) includes an "API Usage Analytics" tab displaying:
- Stat cards for total requests today, requests this hour, and unique endpoints
- Hourly bar chart showing request volume over the past 24 hours (Recharts BarChart)
- Top endpoints table with endpoint path and request count

---

## 16. Excel Export System (v1.3)

### 16.1 Architecture

Excel (XLSX) export uses the `exceljs` package, dynamically imported only when XLSX format is requested to minimize memory footprint.

### 16.2 Supported Export Types

| Type | Worksheet Name | Columns |
|------|---------------|---------|
| `portfolio` | Portfolio | Account Number, Borrower ID, Institution, Type, Original Amount, Current Balance, Currency, Status |
| `borrowers` | Borrowers | Name, Type, National ID, TIN, Gender, City, Region, PEP |
| `audit` | Audit Trail | Timestamp, Action, Entity, Entity ID, Details, User ID, IP Address |

### 16.3 Formatting

All XLSX exports feature consistent professional formatting:
- **Header row:** Bold white text (`#FFFFFF`) on dark teal background (`#0D4A42`)
- **Column widths:** Pre-configured per column for optimal readability
- **Workbook metadata:** Creator set to "Pan-African Credit Registry" with creation timestamp

### 16.4 Endpoint

`GET /api/reports/export?format=xlsx&type=portfolio|borrowers|audit`

Response headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename={type}_report_{timestamp}.xlsx`

---

## 17. Real-time Notifications (v1.3)

### 17.1 Database Schema

Notifications are stored in the `notifications` table (see Section 4.8) with fields for user targeting, type classification, read status, and optional navigation links.

### 17.2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | Get notifications for authenticated user (limit 50) |
| `GET` | `/api/notifications/unread-count` | Get count of unread notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark a specific notification as read |
| `POST` | `/api/notifications/mark-all-read` | Mark all notifications as read for authenticated user |

### 17.3 Notification Types

| Type | Trigger |
|------|---------|
| `approval_pending` | New pending approval submitted (sent to admin/regulator users) |
| `approval_result` | Pending approval approved or rejected (sent to requester) |
| `dispute_update` | Dispute status changed |
| `system` | System-level alerts |

### 17.4 Frontend Component

The `NotificationBell` component (`client/src/components/notification-bell.tsx`) renders a bell icon in the application header with:
- **Unread badge:** Displays count of unread notifications
- **Popover dropdown:** Shadcn Popover component showing recent notifications
- **Polling:** 30-second interval polling via TanStack Query `refetchInterval` for near-real-time updates
- **Mark as read:** Individual notification mark-as-read and "Mark all as read" bulk action
- **Navigation:** Clicking a notification with a `link` field navigates to the relevant page

---

## 18. Dashboard Trends (v1.3)

### 18.1 API Endpoint

**Endpoint:** `GET /api/dashboard/trends`  
**Authentication:** Required (any authenticated user)

### 18.2 Trend Data Generation

The endpoint generates synthetic 7-day trend data for each key metric based on the current dashboard statistics:

1. Retrieves current dashboard stats from storage
2. For each metric, generates a 7-point array representing the past 7 days
3. Starting value is set to 70-85% of the current value
4. Values progress linearly toward the current value with small random variance (±8%)
5. The final data point (day 7) is always set to the exact current value

**Response Schema:**
```json
{
  "borrowers": [98000, 99200, 100100, 100800, 101500, 102000, 102462],
  "accounts": [168000, 169500, 170200, 171000, 171500, 172000, 172359],
  "disputes": [3100, 3120, 3150, 3180, 3200, 3210, 3218],
  "inquiries": [24500, 24600, 24700, 24800, 24900, 24950, 25004],
  "delinquent": [150, 155, 158, 160, 163, 165, 168],
  "defaults": [45, 47, 48, 50, 51, 52, 53],
  "approvals": [10, 12, 14, 15, 16, 17, 18]
}
```

### 18.3 Frontend Component

The `StatCard` component (`client/src/components/stat-card.tsx`) displays sparkline mini-charts alongside each dashboard metric:
- **Chart type:** Recharts `AreaChart` with gradient fill
- **Data points:** 7 data points representing the past 7 days
- **Styling:** Teal fill gradient with subtle stroke, no axes or labels
- **Interaction:** Hover tooltip showing individual day values
- **Responsive:** Charts scale within stat card dimensions

---

---

## 19. Platform Command Center Architecture (v2.0)

### 19.1 Overview

The Platform Command Center is the super admin landing page providing platform-wide management across 11 operational tabs. It serves as the central hub for monitoring, configuration, and administration of the entire pan-African credit registry.

### 19.2 Component Architecture

| Component File | Tab | Description |
|---------------|-----|-------------|
| `country-selection.tsx` | Jurisdictions | Country cards, live activity feed, SRS traceability |
| `country-selection.tsx` | Compliance & SATA | Data protection status, SATA readiness |
| `country-selection.tsx` | Feature Matrix | Per-country capability matrix |
| `command-center-users.tsx` | Users & Clients | User CRUD, organization management |
| `command-center-settings.tsx` | Country Settings | Per-country config, SATA agreements |
| `command-center-system.tsx` | System | IT infrastructure monitoring |
| `command-center-audit.tsx` | Audit Log | Searchable audit trail with filters |
| `command-center-apikeys.tsx` | API Keys | Key lifecycle management |
| `command-center-dataquality.tsx` | Data Quality | Completeness metrics dashboard |
| `command-center-billing.tsx` | Billing | Revenue, pricing tiers, invoices |
| `command-center-retention.tsx` | Retention | Per-jurisdiction retention policies |

### 19.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/platform/audit-logs` | GET | Paginated, filterable audit log with search |
| `/api/platform/api-keys` | GET | API keys (keyHash excluded) |
| `/api/platform/api-keys/:id/revoke` | POST | Revoke API key |
| `/api/platform/data-quality` | GET | Data completeness metrics |
| `/api/platform/billing` | GET | Revenue KPIs, pricing tiers, invoices |
| `/api/platform/pricing-tiers/:id` | PUT | Edit pricing tier (validated) |
| `/api/platform/retention-policies` | GET | All retention policies |
| `/api/platform/retention-policies` | POST | Create retention policy (Zod validated) |
| `/api/platform/retention-policies/:id` | PUT | Update retention policy (validated) |
| `/api/platform/activity-feed` | GET | Latest 100 audit events with user names |

### 19.4 Security

- All endpoints enforce `requireAuth` + `requireSuperAdmin` middleware
- API key responses exclude `keyHash` column
- Mutable endpoints validate input types and ranges
- Audit log filters apply consistently to counts and breakdowns
- Raw SQL queries use parameterized `IN` clauses (no string interpolation)

---

## 20. Transaction-Based Monetization System (v2.0)

### 20.1 Architecture

The monetization system tracks per-transaction billable events across organizations using a two-table design:

- **`usage_metering`** — Records individual billable events (credit report pulls, API calls, batch uploads, cross-border queries, dispute filings, data exports) with quantity, unit price, and total charge
- **`pricing_tiers`** — Defines per-event-type pricing with volume-based tier discounts (standard, premium, enterprise)

### 20.2 Pricing Model

| Event Type | Standard | Premium | Enterprise |
|-----------|----------|---------|------------|
| Credit Report Pull | $1.50 (0-500) | $2.00 (501-2000) | $2.50 (2001+) |
| API Call | $0.05 (0-10K) | $0.08 (10K-50K) | $0.10 (50K+) |
| Batch Upload | $3.50 (0-100) | $4.00 (101-500) | $5.00 (501+) |
| Cross-Border Query | $3.50 | — | — |
| Dispute Filing | $1.00 | — | — |
| Data Export | $2.00 | — | — |

### 20.3 Billing Flow

1. Billable events create entries in `usage_metering` with `billed = false`
2. Unbilled usage accumulates until monthly invoice generation
3. Invoice generation marks entries as `billed = true` with `invoice_id` reference
4. Pricing tiers are editable via the Billing tab in the Command Center

---

*End of Systems Documentation*

*Document prepared by Systems In Motion Limited*  
*Cross-Jurisdictional Central Data Hub & Credit Registry System v2.0*
