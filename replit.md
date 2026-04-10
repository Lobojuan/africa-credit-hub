# Credit Registry System - CDH v2.5

## Overview
This project is a web-based Pan-African Credit Registry System (CDH v2.5) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal. The system is designed for scalability, supporting over 10 million records.

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
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili with RTL support.
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate), managed via a centralized `useBrandColors()` hook and CSS classes for tokenized colors.
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down capabilities, notifications, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA (TOTP), strong password policies, biometric (WebAuthn) support, Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO.
-   **Data Model**: Supports credit, compliance, usage metering, pricing, and alternative data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management with multi-currency support and standardized credit types. Includes dedicated pages for dishonored cheques and court judgments.
    -   **Consumer/Business Segmentation**: Separate API endpoints, navigation, and RBAC rules for consumer and business entities.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with explainable AI, utilizing a gradient boosting-inspired model and integrating NDIA and Amount in Arrears.
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, bulk data upload (XBRL/XML, IFF), and PDF credit reports with human-readable reason codes.
    -   **Structured Search**: BOG Compliant search for consumers and businesses with server-side validation and audit logging.
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching for duplicate detection and cross-border entity resolution.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain anchored to a blockchain (simulated Ethereum Sepolia).
    -   **Data Sovereignty Enforcement**: Ensures users only access/modify data within their authorized country, enforced by `requireCountryScope` and `enforceCountryScopeForNonSuperAdmin` guards.
    -   **HMAC-SHA256 Webhook Signatures**: For payload verification of outbound webhooks.
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Multi-Tenant SaaS**: Supports multiple organizations with tenant scoping and a super_admin role.
    -   **API Rate Limiting**: Tiered rate limiting for various endpoints.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and AI-powered Smart Assistant mode, utilizing a Multi-Model AI Ensemble (GPT-4o and Claude) for intelligent responses.
    -   **AI Portfolio Intelligence**: Analytics page for AI-powered portfolio reports, including risk ratings and default predictions.
    -   **AI Command Center**: Unified hub for 6 AI tools including Credit Narratives, Anomaly Detection, and Regulatory Reports.
    -   **Open Banking**: Open Banking profile management for individual and corporate borrowers, displayed on consumer and business detail pages.
    -   **Decision Rules Engine**: Configurable decision rules for credit evaluation with rule creation, editing, deletion, and borrower evaluation. Accessible via sidebar for admin/super_admin/lender roles.
    -   **ESG Scoring**: Environmental, Social, and Governance scoring for corporate borrowers, displayed on business detail pages.
    -   **Multi-Step Signup with Fraud Prevention**: Institution type picker (Step 1) with 6 categories, then registration form (Step 2) requiring institution name, business registration number (from Ghana Registrar General's Department), and admin details. New registrations are set to "pending" status and require super_admin approval before access is granted. Registration numbers are validated for uniqueness. Pending/deactivated org users see dedicated status screens on login.
    -   **Consumer Portal Registration**: Enhanced with Full Name, Country selection, and consent checkbox fields.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing and volume tier discounts.
    -   **Two-Tier Revenue Split**: Platform owner takes a configurable percentage (default 20%) of every billable event that bureaus charge their clients. Each organization has `platformFeePercent` and `monthlyLicenseFeeCents` fields. Usage metering automatically calculates `platformFeeCents` and `bureauRevenueCents` on every event. A dedicated "Revenue Split" tab in the Command Center shows per-bureau breakdowns, monthly trends, and editable license terms.
    -   **Settlement & Payout System**: Full payout lifecycle for moving money to bank accounts (all major Ghana banks) or Mobile Money wallets (MTN MoMo, Vodafone Cash, AirtelTigo Money). Settlement accounts (DB: `settlement_accounts`), configurable payout schedules (`settlement_schedules` — daily/weekly/biweekly/monthly), payout batch generation from unbilled events (`payout_batches` + `payout_items`), maker-checker approval flow (generate → approve → mark complete). "Settlements" tab in Command Center shows unbilled/settled totals, account management, schedule config, and batch history with per-recipient line items.
    -   **Wallet/Prepaid Billing System**: Two-tier real-time wallet billing. Bureaus pre-fund wallets via MTN MoMo, Vodafone Cash, bank transfer, or Stripe. Every billable event auto-deducts the total fee from the bureau wallet and credits the platform fee share to the platform wallet — all within a single DB transaction with row-level locking (`SELECT ... FOR UPDATE`). DB tables: `wallets` (one per org + one platform wallet) and `wallet_transactions` (full ledger). Platform wallet uniqueness enforced via partial unique index. Low-balance threshold alerts. Wallet management tab in Command Center with top-up, withdrawal, transaction history, and balance overview. API endpoints: `GET /api/platform/wallets`, `POST /api/platform/wallets/create`, `POST /api/platform/wallets/topup`, `POST /api/platform/wallets/withdraw`, `PATCH /api/platform/wallets/:id/settings`, `GET /api/platform/wallets/:id/transactions`.
    -   **Cross-Border Frameworks**: Implements Smart Africa Telecommunications Alliance (SATA) data sharing and tracks Pan-African Payment and Settlement System (PAPSS) settlements.
    -   **Alternative Data Integration**: Integrates mobile money, utility, and telco data for AI-driven credit scoring for unbanked populations.
    -   **Telco Lending Lifecycle**: Full loan lifecycle management including operations dashboard and consent management.
    -   **Idempotency Support**: Critical telco endpoints support `Idempotency-Key` header with 24-hour TTL cache.
    -   **Reporting & Explainability**: Dedicated pages for Business Credit Report Template, Credit Score Methodology (with interactive simulator), and a public Score Guide.
    -   **Consumer Self-Service Portal**: Authenticated portal for consumers with registration, login, dual-channel verification, and rate-limited credit score lookups.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with efficient duplicate national ID detection.
    -   **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation.
    -   **Security Hardening**: Helmet security headers, DOMPurify sanitization, CSRF token protection, AES-256-GCM PII encryption at rest, data subject erasure request API, password history enforcement, and login anomaly detection.
    -   **Configurable Platform Identity**: Company name, support email, and contact phone are driven by env vars (`PLATFORM_COMPANY_NAME`, `PLATFORM_SUPPORT_EMAIL`, `PLATFORM_CONTACT_PHONE`, `PLATFORM_ADMIN_NAME`, `PLATFORM_CTO_NAME`, `PLATFORM_CTO_EMAIL`) with safe defaults — no hardcoded personal contact info in source code.
    -   **Real-time WebSocket Notifications**: Authenticated WebSocket server for event broadcasting.
    -   **Progressive Web App (PWA)**: Installable with service worker and offline capabilities.
    -   **System Status & Health Monitoring**: Public and authenticated endpoints for health and diagnostics.
    -   **Maintenance Mode**: Toggle-able maintenance page with super admin bypass.
    -   **Platform Metrics Dashboard**: Admin-only page displaying MRR/ARR, subscription breakdown, and KPIs.
    -   **Webhook Delivery System**: HMAC-SHA256 signed webhooks with retry logic.
    -   **Batch Job Persistence**: `batchJobs` DB table for durable batch processing with status tracking.
    -   **Performance Optimizations**: Database queries parallelized with `Promise.all` across dashboard, KPI, chart, regulatory report, and audit endpoints. Audit stats use SQL-based aggregation instead of JS iteration. Integrity verification has 60-second cache. Request timeout middleware (15s API / 30s exports) prevents runaway requests. Audit logs excluded from timestamp redistribution to prevent hash chain corruption.

## Route Architecture
The API routes are modularized into feature-scoped files under `server/routes/`:
-   **`middleware.ts`**: Shared rate limiters (login, API, write, batch, AI, creditReport), auth middleware (requireAuth, requireRole, requireSuperAdmin, enforceDataSovereignty, idempotencyMiddleware), country-scoping helpers (getOrgScope, getCountryFilter, logCrossCountryAccess, enforceCountryScopeForNonSuperAdmin, requireWriteCountry, resolveUserCountry, validateBorrowerCountry), and safeErrorMessage.
-   **`auth.ts`**: Login, logout, MFA (setup/verify/disable/login), change-password, /auth/me.
-   **`users.ts`**: User CRUD (GET/POST/PATCH/DELETE /api/users).
-   **`dashboard.ts`**: Dashboard stats, trends, chart-data, platform KPIs, score-band performance, concentration alerts.
-   **`telco.ts`**: All 29 telco routes (profiles, transactions, scoring, decision engine, loans, repayments, consent, analytics, operations dashboard).
-   **`server/routes.ts`** (orchestrator): Registers all sub-routers, plus remaining routes (borrowers, credit accounts, billing, AI, consumer portal, admin, compliance, etc.).

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit, ws, @simplewebauthn/server
-   **Payments**: Stripe
-   **Email**: SendGrid, Gmail SMTP
-   **SMS**: Twilio, Africa's Talking
-   **PDF Generation**: pdfkit
-   **AI / LLM Providers**: Anthropic (Claude Opus), OpenAI (GPT-4o)
-   **Excel Export/Import**: `exceljs`, `xlsx` (SheetJS)
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars)