# Credit Registry System - Systems In Motion Limited — CDH v2.5

## Overview
This project is a web-based Pan-African Credit Registry System (CDH v2.5) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal.

## Version History
| Version | Date | Description |
|---------|------|-------------|
| v1.0 | Jan 2026 | Foundation platform — TOTP MFA, OAuth 2.1, AI chatbot, entity resolution, exchange rates, XBRL uploads, i18n (5 languages), mobile-responsive |
| v1.2 | Feb 2026 | Enterprise features — maker-checker workflows, dispute management, regulatory compliance dashboard, IFF upload engine |
| v2.0 | Mar 2026 | Ghana Launch — Bank of Ghana CRB v1.1 compliance, Ghana-specific mode, pipe-delimited BoG export, code catalogs, 17 institutions |
| v2.1 | Mar 2026 | Intelligence Suite — AI portfolio intelligence, blockchain audit anchoring, ML credit scoring (GBM), consumer portal, cross-border entity resolution, Stripe billing |
| v2.5 | Apr 2026 | Current Release — Global Scandinavian visual style (centralized `useBrandColors` hook), score methodology transparency with good/bad odds tables, maintenance mode system, security hardening, comprehensive version management, live system clock on landing page, BOG-compliant structured search parameters (consumer: 13 fields with Ghana Card mandatory; business: 6 fields with Registration Number mandatory), improved PDF credit report layout (two-column grids, styled section headers, alternating table rows, proper page breaks), **Ghana-only deployment** (non-Ghana seeders disabled, Platform Command Center filtered to active countries only), **10M+ record scalability** (SQL aggregations for KPIs/analytics, chunked batch inserts, startup safety guards, 24 database indexes) |

## Legal & Copyright
- **Legal Page** (`/legal`): In-platform page displaying copyright notice, scope of protection, ownership, jurisdictional coverage (10 African nations), license categories, restrictions, trade secrets, database rights, enforcement remedies, dispute resolution, and contact info.
- **Copyright PDF** (`GET /api/copyright/download-pdf`): Server-generated 41-page PDF document using pdfkit (`server/copyright-pdf.ts`) with professional formatting — cover page, table of contents, 15 legal sections, signature pages, teal/gold color scheme, double-line page borders. Covers Ghana Copyright Act 2005, 9 other African copyright laws, ARIPO, OAPI, Berne Convention, WIPO, TRIPS.

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
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate). Brand colors are centralized via `useBrandColors()` hook (`client/src/hooks/use-brand-colors.ts`) which provides theme-aware color values across all pages. The `withAlpha()` utility handles translucent variants safely. The `.scandinavian` CSS class on `document.documentElement` toggles CSS variable overrides for tokenized colors, while the hook handles inline style colors.
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down, notifications, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.
-   **App Footer**: Persistent footer displaying company branding, leadership, location, pan-African coverage, and copyright.
-   **Guided Tours**: Interactive demo tour and application walkthroughs.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA (TOTP), strong password policies, biometric (WebAuthn) support, role-based idle session timeouts, Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO for enterprise identity providers.
-   **Data Model**: Supports credit, compliance, usage metering, pricing, and alternative data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management with multi-currency support and 20 standardized credit types. Standalone list pages for Credit Accounts, Dishonoured Cheques (`/dishonoured-cheques`), and Court Judgments (`/court-judgments`) with "Recently Added" date filters (All Time / 24h / 7d / 30d / 90d) and KPI summary cards.
    -   **Consumer/Business Segmentation**: Separate API endpoints, navigation, and RBAC rules.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with explainable AI, utilizing a gradient boosting-inspired model, integrating NDIA and Amount in Arrears.
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, bulk data upload (XBRL/XML, IFF), and PDF credit reports with human-readable reason codes.
    -   **IFF Upload UI**: Drag-and-drop IFF file upload with auto-detect or manual type selection.
    -   **Structured Search**: BOG Compliant search for consumers and businesses with server-side validation and audit logging.
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching for duplicate detection and cross-border entity resolution.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain anchored to a blockchain (simulated Ethereum Sepolia).
    -   **Data Sovereignty Enforcement**: Ensures users only access/modify data within their authorized country.
    -   **HMAC-SHA256 Webhook Signatures**: For payload verification of outbound webhooks.
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Multi-Tenant SaaS**: Supports multiple organizations with tenant scoping and a super_admin role.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **API Rate Limiting**: Tiered rate limiting for various endpoints.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and AI-powered Smart Assistant mode.
    -   **AI Portfolio Intelligence**: Analytics page for AI-powered portfolio reports, including risk ratings and default predictions.
    -   **Multi-Model AI Ensemble**: Unified AI router with task-type-based routing and automatic failover, using OpenAI GPT-4o and Anthropic Claude.
    -   **Dual-AI Ensemble**: Two-step pipeline for structured risk assessment (e.g., Telco Credit Scoring) with cross-provider fallback.
    -   **Brain & Voice Chatbot**: Dual-AI architecture using GPT-4o as "The Brain" and Claude as "The Voice" for empathetic streaming responses.
    -   **Concentration Risk Alerts**: Automated endpoint and dashboard widget monitoring exposure thresholds.
    -   **AI Command Center**: Unified hub for 6 AI tools: Credit Narratives, Anomaly Detection, Regulatory Reports, Natural Language Queries, Cross-Border Risk Intelligence, and Loan Approval Recommendations.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing with dynamic country switching. Country switcher uses explicit session save + global `?country=` query parameter injection via `appendGlobalParams` in `queryClient.ts`, with per-country query key differentiation in dashboard queries and inactive cache removal on switch to prevent cache pollution. **Hardened with `requireCountryScope` guard** (`server/storage.ts`) that throws if country scope is missing on country-scoped methods. All data retrieval methods filter by country or are explicitly marked `GLOBAL`. Tables `pendingApprovals`, `disputes`, `notifications` now have direct `country` columns. Routes enforce country scope for non-super-admin users via `enforceCountryScopeForNonSuperAdmin`. Super admin cross-country access is audit-logged via `logCrossCountryAccess`.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing and volume tier discounts.
    -   **SATA Cross-Border Framework**: Implements Smart Africa Telecommunications Alliance data sharing.
    -   **PAPSS Settlement Tracker**: Tracks Pan-African Payment and Settlement System settlements.
    -   **Alternative Data Integration**: Integrates mobile money, utility, and telco data.
    -   **Telco Credit Scoring**: AI-driven mobile money (MoMo) analytics for credit-scoring unbanked/underbanked populations.
    -   **Telco Lending Lifecycle**: Full loan lifecycle management including operations dashboard, loan portfolio dashboard, loan management, and consent management.
    -   **Idempotency Support**: Critical telco endpoints support `Idempotency-Key` header with 24-hour TTL cache.
    -   **Telco API Documentation**: Enterprise telco integration endpoints documented in the API Developer Portal.
    -   **Telco Integration Pricing**: Dedicated pricing table for telco-specific services.
    -   **Business Credit Report Template**: Dedicated page with 10 D&B-style sections.
    -   **Credit Score Methodology Page**: Explains score bands, factors, reason codes, and includes an interactive Score Simulator.
    -   **Score Guide**: Public-facing credit score education page.
    -   **Investor Landing Page**: Marketing/investor-facing landing page.
    -   **Consumer Self-Service Portal**: Authenticated portal for consumers with registration, login, dual-channel verification, and rate-limited credit score lookups.
    -   **Smart Trial Flow**: Streamlined trial registration for Google-authenticated users.
    -   **Client Landing Page**: Default landing page for unauthenticated users.
    -   **Trial Management**: Self-service registration with sample data seeding and upgrade path.
    -   **AI Demo Page**: Public interactive showcase of AI features.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with efficient duplicate national ID detection via direct DB count query.
    -   **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation.
    -   **Security Hardening**: Helmet security headers, DOMPurify sanitization, CSRF token protection, AES-256-GCM PII encryption at rest, data subject erasure request API, production error sanitization, password history enforcement, login anomaly detection, live security health check API, and PII encryption integrity monitoring.
    -   **Compliance Documents**: Information Security Policy, Disaster Recovery & Business Continuity Plan, Change Management Policy, and Penetration Test Readiness Report.
    -   **Real-time WebSocket Notifications**: Authenticated WebSocket server for event broadcasting.
    -   **Progressive Web App (PWA)**: Installable with service worker and offline capabilities.
    -   **System Status & Health Monitoring**: Public and authenticated endpoints for health and diagnostics.
    -   **Maintenance Mode**: Toggle-able maintenance page (`/maintenance.html`) that shows a branded "We're Updating" page to visitors when enabled. Super admins can toggle it from Command Center > System tab. Auto-refreshes every 15 seconds via `/api/health` polling. Super admins bypass maintenance mode and can still access the full site. API endpoints: `GET /api/maintenance/status`, `POST /api/maintenance/toggle` (super_admin only).
    -   **Platform Metrics Dashboard**: Admin-only page displaying MRR/ARR, subscription breakdown, and KPIs.
    -   **Platform-Wide KPI/ROI Banners**: Reusable KPI banner component with contextual metrics across major sections.
    -   **Webhook Delivery System**: HMAC-SHA256 signed webhooks with retry logic and `nextRetryAt` scheduling.
    -   **Batch Job Persistence**: `batchJobs` DB table for durable batch processing with status tracking.
    -   **Startup Configuration Validation**: `validateEncryptionConfig()` and `validateExternalApiConfig()` run at boot — warn in dev, halt in production if misconfigured.

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