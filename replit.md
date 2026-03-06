# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System by Systems In Motion Limited. Its core function is to centralize credit information, manage borrower records, and aid in credit risk assessment for financial institutions across all 54 African countries. The system supports 42+ African currencies plus USD/EUR/GBP, implements jurisdiction-specific retention policies, ensures regulatory compliance, and facilitates cross-border entity resolution. It emphasizes robust security, regulatory workflow adherence, and a fault-tolerant architecture to enhance financial stability and responsible lending throughout Africa.

## User Preferences
I prefer clear and concise communication.
I value iterative development with frequent, small updates.
Please ask for confirmation before implementing major architectural changes or significant feature additions.
I prefer detailed explanations for complex logic or design decisions.
Do not make changes to the `docs/` folder.

## System Architecture
The system utilizes a modern full-stack architecture designed for scalability and compliance.

**UI/UX Decisions:**
-   **Frontend Framework**: React with TypeScript and Vite.
-   **Styling**: Tailwind CSS and shadcn/ui components.
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili using `react-i18next`, with full RTL support for Arabic. Language switcher available on login and main app header.
-   **Theming**: Dark/light theme support.
-   **Cultural Aesthetic**: Warm teal and gold palette reflecting a Pan-African cultural aesthetic.
-   **Responsiveness**: Mobile-first design with `viewport-fit=cover`, responsive padding, collapsing form grids, `overflow-x-auto` for tables, and a Sheet component for the mobile sidebar.
-   **Interactive Elements**: Dashboard with drill-down capabilities, in-app notifications, interactive Recharts-based charts, and an SVG Africa map with heat coloring and tooltips.
-   **Guided Tours**: An 11-step interactive demo tour and a comprehensive in-app application walkthrough guide with role-specific notes.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Routing**: `wouter` for frontend, Express for API.
-   **Authentication**: Session-based authentication with bcryptjs for password hashing and `express-session`. Includes 3-attempt lockout, 15-minute session timeout, IP tracking, strong password policies, and 90-day expiry. TOTP MFA is supported.
-   **Data Model**: 18 core tables covering users, borrowers, credit accounts, audit logs, and more, capturing comprehensive credit and operational data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management, multi-currency support, collateral tracking, and arrears.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes and printable reports.
    -   **Workflow**: Maker-checker workflow for data, dispute management with SLA tracking.
    -   **Regulatory Compliance**: Consent management, court judgment tracking, audit trails, and a Regulatory Compliance Dashboard with SRS traceability and country-specific data for all 54 African jurisdictions. Includes jurisdiction-specific data retention policies with automated enforcement.
    -   **Institutional Management**: Self-registration and approval for data providers, billing, and fee management.
    -   **Reporting**: Regulatory analytics (NPL, portfolio breakdowns), CSV export, and bulk data upload (including XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Sidebar navigation filtered by user role, enforced by `requireRole` middleware on API routes.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys with granular permissions, and OAuth 2.1 token exchange.
    -   **Entity Matching**: Fuzzy entity matching (`pg_trgm`) to detect potential duplicate borrower registrations.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain on audit log entries.
    -   **Exchange Rate Management**: Multi-currency conversion across 44 currencies (42 African + EUR/GBP), automatic live rate fetching, and manual refresh.
    -   **Cross-Border Entity Resolution**: Passport number field for cross-jurisdictional identity matching and related party linking.
    -   **Global Search**: Searches across borrowers, institutions, and credit accounts with categorized results and country filters.
    -   **ID Photos & Documents**: Borrower profiles include auto-generated avatars and sections for uploading ID photos/documents.
    -   **Multi-Tenant SaaS Architecture**: `organizations` table, tenant scoping via `organizationId` on all key tables, and a `super_admin` role with platform administration routes. Client Management page (`/organizations`) with animated stat cards, searchable/filterable client list with payment health badges and country flags, clickable detail view with billing summaries and tabbed content (Overview, Billing, Users), and a 4-step onboarding wizard with visual country/currency pickers and subscription plan selection.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: A Credit Registry Assistant with dispute filing, FAQ, keyword search in EN/FR, and **AI-powered Smart Assistant mode** (OpenAI GPT-4o streaming), accessible via a floating action button.
    -   **Documentation**: Multi-language documentation API (`/api/docs`) supporting English, French, Arabic, and Swahili, with translated content for key documents.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit
-   **Payments**: Stripe integration (connected via Replit connector `conn_stripe_01KJSTY6E6PSMZRZK1JD9RP0SF`). Products: Standard ($299/mo), Professional ($799/mo), Enterprise ($1,999/mo). Checkout, portal, and webhook endpoints at `/api/stripe/*`. Webhook route MUST stay before `express.json()` in `server/index.ts`.
-   **Email**: SendGrid email service (`server/email.ts`) with templates for welcome, billing, and dispute notifications. Currently in **stub mode** — logs email events but does not send. To activate: set `SENDGRID_API_KEY` environment secret and install `@sendgrid/mail` package. The user dismissed the Replit SendGrid connector; use manual API key when ready.
-   **PDF**: Server-side PDF invoice generation via pdfkit at `GET /api/admin/organizations/:orgId/billing/:billingId/pdf`. Credit report PDF supports language parameter (`?lang=en|fr|ar|sw`).
-   **AI / OpenAI**: Connected via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`). `server/ai.ts` provides: `analyzeCreditRisk`, `generateReportSummary`, `chatWithAI` (SSE streaming), `generateComplianceReport`. Routes: `POST /api/ai/credit-risk/:borrowerId`, `/api/ai/report-summary/:borrowerId`, `/api/ai/chat`, `/api/ai/compliance-report`.
-   **Excel Export**: `exceljs` package. `GET /api/reports/export?format=xlsx&type=portfolio|borrowers|audit` returns formatted XLSX files.
-   **Third-Party APIs**: open.er-api.com (for exchange rates), DiceBear (for avatars).

## Recent Additions
-   **AI Risk Analysis**: Button on borrower detail page calls AI credit risk analysis, displays expandable results panel with risk score, factors, recommendations, regulatory flags.
-   **AI Report Summary**: Button on credit report page generates plain-language AI summary.
-   **AI Compliance Reports**: Country selector on regulatory compliance page generates AI compliance assessments.
-   **AI Chatbot Mode**: Sparkles button in chatbot header enters AI assistant mode with SSE streaming responses.
-   **Notification Bell**: Real-time notification dropdown in header with 30s polling, mark-as-read, mark-all-read.
-   **Dashboard Sparklines**: Mini trend charts (7-day) on dashboard stat cards using recharts.
-   **API Usage Dashboard**: In-memory request tracking middleware, `/api/admin/api-usage` endpoint, "API Usage Analytics" tab on api-admin page with bar charts and top endpoints table.
-   **Audit Trail Enhancements**: Timeline/table view toggle, date range filters, CSV/Excel export buttons.
-   **Excel Export Buttons**: Portfolio, borrowers, and audit trail exports in XLSX format on reports page.
-   **Super Admin Org Switcher**: Dropdown in header (super_admin only) to filter all platform data by selected client organization. Uses `OrgSwitcherProvider` context and `setGlobalOrgId` in queryClient to auto-append `?orgId=X` to all API requests.
-   **Mobile Search Page**: Dedicated mobile-first search at `/mobile` route — no sidebar, large touch targets, instant search, auto-focus input. Designed for quick client lookups from iPhone/Android.
-   **Country Mode Toggle (Ghana Mode)**: Set `VITE_COUNTRY_MODE=ghana` env var to transform the app into a Ghana-focused credit registry. Affects: login page branding ("Ghana Credit Registry"), sidebar title, Africa map → Ghana Credit Market overview (16 regions with weighted distribution, market stats: 3.4M borrowers, 154 institutions, 23% default rate), all country selectors locked to Ghana, currency defaults to GHS (₵) with USD/EUR reference rates displayed alongside monetary values, regulatory compliance pre-selects Ghana, email sender name changes, **language switcher restricted to English and French only** (PT/AR/SW hidden), **Documentation page redirects to Ghana Compliance docs** (`/documentation` → `/ghana-docs`), sidebar shows "Ghana Compliance" instead of "Documentation". Config modules: `client/src/lib/country-mode.ts` (frontend), `server/country-mode.ts` (backend). Remove the env var to restore Pan-African mode.
-   **Bank of Ghana CRB v1.1 Compliance**: Full BoG data standards in Ghana mode — borrower schema includes Ghana Card, Voter's ID, SSNIT Number, Driver's License, marital status, mobile money number, proof of address fields. Credit accounts include BoG facility type codes (OVD/TML/MTG/CRC/etc.), purpose codes, repayment frequency, asset classification (Current/OLEM/Substandard/Doubtful/Loss), amount overdue, written-off amount. Batch upload supports pipe-delimited BoG format (POST `/api/batch-upload/bog-pipe`) with YYYYMMDD date parsing and field mapping. Credit score factors card on dashboard (Payment History 35%, Utilization 30%, Account Age 15%, Credit Mix 10%, New Inquiries 10%). Reference data: `client/src/lib/country-mode.ts` exports `GHANA_ID_TYPES`, `BOG_FACILITY_TYPES`, `BOG_ASSET_CLASSIFICATIONS`, `BOG_COLLATERAL_TYPES`, `BOG_INDUSTRY_CODES`, `BOG_BUSINESS_TYPES`, `GHANA_MARKET_STATS`, `CREDIT_SCORE_FACTORS`, etc.
-   **Currency Reference Component**: `client/src/components/currency-reference.tsx` provides `CurrencyReference` (inline "≈ $X / €Y" display) and `ReferenceRateBadge` (compact rate badge) for showing USD/EUR equivalents alongside GHS amounts. Used on dashboard, borrower detail, and credit account forms.
-   **Ghana Compliance Documentation Hub**: Dedicated `/ghana-docs` page (Ghana mode only) with 8 BoG compliance documents in `docs/ghana/` — SLA Agreement, Compliance Framework, E2E Test Plan, Data Standards, Data Protection Policy, Operational Procedures, Ghana API Integration Guide (Act 726/843 compliant with Ghana Card, GHS, consent requirements), Data Connections & Exchange Policy (NIA, inter-bureau, GhIPSS, mobile money under Act 726/843/772/1038). API routes at `/api/ghana-docs` (list), `/api/ghana-docs/:id` (view with HTML), `/api/ghana-docs/:id/pdf` (PDF download via pdfkit), `/api/ghana-docs/:id/download` (markdown download). Frontend page with 7 category filters (SLA, Compliance, Testing, Data Standards, Operations, API, Connections), inline document viewer (Dialog), and PDF/markdown download buttons. Sidebar entry visible in Ghana mode only. Ghana compliance notice banners added to API Docs page and Documentation page when in Ghana mode, with links to Ghana compliance hub.
-   **ETB Fallback Cleanup**: Currency fallback in Ghana mode uses `getDefaultFallbackCurrency()` from country-mode.ts (returns "GHS" in Ghana mode, "ETB" otherwise) across credit-report, reports, and borrower-detail pages.
-   **Security Hardening**: Helmet security headers (X-Content-Type-Options, X-Frame-Options, etc.), express-rate-limit on login (15 req/15min) and API (100 req/min), DOMPurify sanitization for all `dangerouslySetInnerHTML` usage, auto-login endpoint gated to dev-only, hardcoded SESSION_SECRET fallback removed, JWT secret separated from session secret, production error messages sanitized.
-   **Ghana Mode Currency Restriction**: In Ghana mode, all currency selectors/dropdowns across the app (exchange rates, billing, reports, dashboard, organizations) are restricted to GHS, USD, and EUR only. The exchange rate scheduler only fetches GHS and EUR rates (2 pairs instead of 44). The `getModeCurrencies()` helper in `client/src/lib/currency.ts` centralizes this filtering. USD and EUR remain available because lenders/borrowers may use those currencies.