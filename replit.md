# Credit Registry System v2.0 - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System (v2.0) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across 54 African countries. It handles 42+ African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending in Africa through robust security, adherence to regulatory workflows, and fault tolerance.

## User Preferences
I prefer clear and concise communication.
I value iterative development with frequent, small updates.
Please ask for confirmation before implementing major architectural changes or significant feature additions.
I prefer detailed explanations for complex logic or design decisions.
Do not make changes to the `docs/` folder.

## System Architecture
The system employs a modern full-stack architecture built for scalability and compliance.

**UI/UX Decisions:**
-   **Frontend**: React with TypeScript and Vite, styled using Tailwind CSS and shadcn/ui.
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili with `react-i18next`, including full RTL support.
-   **Theming**: Dark/light theme with a premium teal and gold palette, enhanced with modern aesthetics like mesh gradient backgrounds, glassmorphism, glow effects, and animated elements.
-   **Responsiveness**: Mobile-first design with adaptive layouts.
-   **Interactive Elements**: Dashboards with drill-down, in-app notifications, Recharts-based charts, an interactive SVG Africa map, and a circular SVG credit score gauge.
-   **Guided Tours**: Interactive demo tour and application walkthroughs.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with bcryptjs, sessions stored in PostgreSQL (connect-pg-simple, table: `user_sessions`), including 3-attempt lockout, session timeouts, IP tracking, strong password policies, 90-day expiry, and TOTP MFA.
-   **Data Model**: 22 core tables for comprehensive credit and operational data, including `dishonoured_cheques` for compliance, `usage_metering` for transaction billing, `pricing_tiers` for monetization, and `alternative_data` for mobile money/utility/telco data integration.
-   **Connection Pool**: PostgreSQL pool sized at 20 max / 2 min connections with keepalive, statement timeout (30s), and connection timeout (5s). Pool stats available via `/api/health`.
-   **Batch Processing**: In-process async job queue (`server/batch-queue.ts`) for high-volume operations. Endpoints: `POST /api/batch/accounts` (up to 1,000 records), `POST /api/batch/borrowers` (up to 1,000 updates), `GET /api/batch/jobs/:jobId` (status polling), `GET /api/batch/queue-stats`. Chunked transactions (250 rows per chunk).
-   **API Rate Limiting**: express-rate-limit with tiered limits — auth: 15/15min, global reads: 200/min, writes: 60/min, batch operations: 10/min. Memory-stored (single-process Replit).
-   **Database Indexes**: 17 performance indexes on high-query columns (borrowers, credit_accounts, audit_logs, data_sharing_agreements, disputes, consent_records, notifications). Created via `server/migrate-indexes.ts` on startup.
-   **Core Capabilities**:
    -   **Credit Management**: Borrower and credit account management, multi-currency support, collateral, and arrears tracking.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes, reports, transparency section, and detailed factor-by-factor explainability (ScoreFactor[] breakdown with weights, impact values, and descriptions).
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, court judgment tracking, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, and bulk data upload (XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching (`pg_trgm`) for duplicate detection.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain.
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Cross-Border Entity Resolution**: Passport number field for cross-jurisdictional identity matching.
    -   **Global Search**: Searches across borrowers, institutions, and credit accounts.
    -   **Multi-Tenant SaaS**: `organizations` table, tenant scoping via `organizationId`, and `super_admin` role. Includes client management and a 4-step onboarding wizard.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and an AI-powered Smart Assistant mode with live database context. Defaults to Claude Opus (Anthropic), with OpenAI (GPT-4o) available via optional `provider` parameter.
    -   **AI Portfolio Intelligence**: Dedicated analytics page generating comprehensive AI-powered portfolio reports including executive summaries, risk ratings, default predictions, early warnings, and strategic recommendations. Access restricted to admin/super_admin/regulator roles.
    -   **Documentation**: Multi-language documentation API.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing via `VITE_COUNTRY_MODE`. Each country's organizations, borrowers, and accounts are isolated — only the active country's data is visible. Server-side `getCountryFilter()` enforces isolation on all org queries. 10 African countries supported in the registry (Ghana, Liberia, Sierra Leone, Nigeria, Kenya, Rwanda, Tanzania, Uganda, Ethiopia, South Africa). API endpoints: `GET /api/platform/country-mode` (all users), `GET /api/platform/country-stats` (super_admin only). Country badge in sidebar footer, country label in org switcher.
    -   **Dynamic Country Switching (Super Admin)**: Double login system — super admins see a full-screen Platform Command Center after login where they review platform-wide KPIs (total borrowers, accounts, institutions, active countries, SRS compliance score), then choose a country or "Global View" before entering the dashboard. Regular users log in directly to their country's dashboard with no country selection visible. After initial selection, super admins can switch countries via a `CountrySelector` in the header. `POST /api/platform/set-country` sets `viewingCountry` in session; `getCountryFilter(req)` reads session for super_admin. `CountryThemeProvider` dynamically applies per-country CSS custom properties (sidebar colors, primary/accent, logo gradient) when switching. Each of the 10 countries has a distinct color theme. The sidebar brand title, logo, and country badge all update dynamically. Data is fully isolated per country — no cross-country data sharing.
    -   **Platform Command Center**: Super admin landing page (`client/src/pages/country-selection.tsx`) with 11 tabs: (1) Jurisdictions — 10 country cards with live stats, compliance badges, SATA indicators, and a Live Activity Feed (auto-refresh 30s); (2) Compliance & SATA — data protection law status, SATA cross-border readiness, SRS requirements traceability by category; (3) Feature Matrix — table of capabilities per country; (4) Users & Clients — full user CRUD and organization management with sub-tabs; (5) Country Settings — per-country feature configuration and SATA agreement management; (6) System — IT infrastructure monitoring; (7) Audit Log — searchable audit trail with action/entity filters, pagination, and breakdown charts (`command-center-audit.tsx`); (8) API Keys — key management with create/revoke and external integrations view (`command-center-apikeys.tsx`); (9) Data Quality — completeness metrics per field/country with progress bars and recommendations (`command-center-dataquality.tsx`); (10) Billing — revenue KPIs, editable pricing tiers (11 default tiers), invoice list, and monetization model explanation (`command-center-billing.tsx`); (11) Retention — per-country data retention policy CRUD with years/status/legal basis (`command-center-retention.tsx`). API endpoints: `GET /api/platform/audit-logs`, `GET /api/platform/api-keys`, `POST /api/platform/api-keys/:id/revoke`, `GET /api/platform/data-quality`, `GET /api/platform/billing`, `PUT /api/platform/pricing-tiers/:id`, `GET/POST/PUT /api/platform/retention-policies`, `GET /api/platform/activity-feed`.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing and volume tier discounts. Schema tables: `usage_metering` (tracks billable events per org), `pricing_tiers` (country-specific tiers with local currencies — 121 tiers across 11 regions: Global/USD, Ghana/GHS, Sierra Leone/SLL, Kenya/KES, Nigeria/NGN, South Africa/ZAR, Tanzania/TZS, Uganda/UGX, Rwanda/RWF, Ethiopia/ETB, Egypt/EGP). Exchange-rate-adjusted pricing with affordability factor. Billing tab has country filter chips and grouped tier display. Pricing tiers editable per country via Billing tab.
    -   **Ghana Mode**: A comprehensive country-specific mode (`VITE_COUNTRY_MODE=ghana`) that reconfigures the entire system for Ghana's credit registry, including specific seed data, UI locks, and compliance with Bank of Ghana CRB v1.1 standards.
    -   **BoG CRB v1.1 Compliance**: Full Bank of Ghana Credit Reference Bureau v1.1 export compliance, including specific code catalogs, credit report sections, schema fields, and a dedicated export engine for pipe-delimited CSV files across 6 BoG file types.
    -   **Sierra Leone / BSL CRB v1.0 Compliance**: Full Bank of Sierra Leone implementation — BSL compliance codes (`shared/bsl-codes.ts`), BSL export engine (`server/bsl-export.ts`) for 6 file types (CONC, BUSC, CONJ, BUSJ, COND, BUSD), seed data with 70 borrowers and 120 accounts (`server/seed-sierra-leone.ts`), BSL Export UI page (`client/src/pages/bsl-export.tsx`), and country-gated sidebar integration. Uses NCRA ID and NIN identity types, NASSIT numbers, SLE currency. 4 BSL-registered institutions seeded. API endpoints: `GET /api/bsl/export/:fileType`, `GET /api/bsl/export-preview/:fileType`.
    -   **SATA Cross-Border Framework**: Complete Smart Africa Telecommunications Alliance data sharing implementation — `data_sharing_agreements` and `papss_settlements` tables, bilateral agreement lifecycle management (draft/active/suspended/expired), cross-border borrower search with active agreement validation, SATA compliance stats dashboard tab on Regulatory Compliance page. API endpoints: CRUD on `/api/sata/agreements`, `/api/sata/cross-border-search`, `/api/sata/stats`. UI: Cross-Border Agreements page, Cross-Border Search page, SATA tab on Regulatory Compliance.
    -   **PAPSS Settlement Tracker**: Pan-African Payment and Settlement System tracking — ISO 20022 compliant settlement records with exchange rate snapshots, multi-currency support, settlement lifecycle (pending/completed/failed/reversed). API: CRUD on `/api/papss/settlements`. UI: PAPSS Settlement Tracker page with filters by status/country.
    -   **Enterprise Features**:
        -   **Credit Score Methodology Page**: Transparent scoring model documentation with an interactive simulator and factor weights.
        -   **Regulatory Dashboard**: Central bank oversight with NPL ratios, sector NPL heatmap, and data quality metrics.
        -   **Borrower Alerts**: Credit file access notification system.
        -   **Enhanced Audit Trail**: Hash chain verification UI, CSV export, and advanced filters.
        -   **Enhanced Batch Upload**: CSV, JSON, XBRL, BoG file upload with client-side validation and history.
        -   **Enhanced API Docs**: Interactive API explorer, rate limit documentation, and code examples.
    -   **Alternative Data Integration**: Mobile money, utility payments, and telco data integration for thin-file borrowers. Schema: `alternative_data` table with source types, payment history, and on-time ratios. Up to +90 bonus points to credit score (30 pts per source, max 3 sources, weighted by on-time ratio). API: `GET/POST /api/borrowers/:id/alternative-data`. UI: `AlternativeDataCard` component in borrower detail page.
    -   **Consumer Self-Service Portal**: Public-facing `/my-credit` page for borrowers to look up credit score using National ID. Shows read-only credit summary with masked ID, score gauge with factor breakdown, and dispute initiation. No authentication required.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with velocity checks (rapid applications, identity changes), identity verification flags, and geographic anomaly detection. `server/fraud-detection.ts` module. Fraud risk indicator component on borrower profiles.
    -   **Enhanced API Developer Portal**: Interactive sandbox section, webhook event documentation (including `fraud.alert_triggered`, `score.changed`, `alternative_data.submitted`), code examples, and fraud/consumer endpoint docs.
    -   **Dashboard Progressive Disclosure**: Collapsible dashboard sections (Analytics, Geographic Coverage, Recent Activity) with localStorage persistence and accessibility (aria-expanded, aria-controls). `CollapsibleDashboardSection` component.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit
-   **Payments**: Stripe integration for subscriptions.
-   **Email**: SendGrid email service for notifications.
-   **PDF Generation**: pdfkit for server-side PDF invoice and credit report generation.
-   **AI / Anthropic + OpenAI**: Both providers integrated via Replit AI Integrations. All text/chat AI features (credit risk analysis, report summaries, chatbot, portfolio intelligence, compliance reports, conversations chat) default to Claude Opus (Anthropic) but support an optional `provider` parameter (`"claude"` or `"openai"`) to switch to OpenAI if needed. Audio (voice chat, TTS, STT) and image generation remain OpenAI-only.
-   **Excel Export**: `exceljs` package for XLSX report exports.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).