# Credit Registry System v2.1 - Systems In Motion Limited

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
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili with RTL support.
-   **Theming**: Dark/light theme with a premium teal and gold palette, enhanced with modern aesthetics and animations.
-   **Responsiveness**: Mobile-first design with adaptive layouts.
-   **Interactive Elements**: Dashboards with drill-down, in-app notifications, Recharts-based charts, an interactive SVG Africa map, and a circular SVG credit score gauge.
-   **Guided Tours**: Interactive demo tour and application walkthroughs.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with robust security features including MFA, strong password policies, and session management.
-   **Data Model**: 22 core tables for comprehensive credit and operational data, including specific tables for compliance, usage metering, pricing, and alternative data.
-   **Connection Pool**: PostgreSQL pool optimized for performance with keepalive and timeouts.
-   **Batch Processing**: In-process asynchronous job queue for high-volume operations (e.g., account and borrower updates) with chunked transactions.
-   **API Rate Limiting**: Tiered rate limits implemented using `express-rate-limit`.
-   **Database Indexes**: 17 performance indexes on frequently queried columns.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management with multi-currency support.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with explainable AI for factor-by-factor transparency.
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, and bulk data upload (XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching for duplicate detection.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain for integrity.
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Cross-Border Entity Resolution**: Supports cross-jurisdictional identity matching.
    -   **Global Search**: Searches across borrowers, institutions, and credit accounts.
    -   **Multi-Tenant SaaS**: Supports multiple organizations with tenant scoping and a super_admin role. Includes a client management and onboarding wizard.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and AI-powered Smart Assistant mode with live database context, supporting Claude Opus and GPT-4o.
    -   **AI Portfolio Intelligence**: Dedicated analytics page for AI-powered portfolio reports, including risk ratings, default predictions, and strategic recommendations.
    -   **Documentation**: Multi-language documentation API.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing via `VITE_COUNTRY_MODE`, isolating organizations, borrowers, and accounts per country. Includes a dynamic country switching mechanism for Super Admins with distinct per-country themes and a Platform Command Center.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing, volume tier discounts, and editable pricing tiers.
    -   **Country-Specific Compliance Modes**: Dedicated implementations for Ghana (BoG CRB v1.1) and Sierra Leone (BSL CRB v1.0), including specific data, UI locks, export engines, and compliance codes.
    -   **SATA Cross-Border Framework**: Implements Smart Africa Telecommunications Alliance data sharing, including agreement management and cross-border borrower search.
    -   **PAPSS Settlement Tracker**: Tracks Pan-African Payment and Settlement System settlements with multi-currency support.
    -   **Enterprise Features**: Includes a Credit Score Methodology Page, Regulatory Dashboard, Borrower Alerts, Enhanced Audit Trail, Enhanced Batch Upload, and Enhanced API Docs.
    -   **Alternative Data Integration**: Integrates mobile money, utility, and telco data for thin-file borrowers, impacting credit scores.
    -   **Consumer Self-Service Portal**: Public-facing mobile-first portal (`/my-credit`) with identity verification (National ID + date of birth). POST `/api/consumer/lookup` requires both fields to match before returning data. Rate-limited (10 req/15min), minimum 6-char ID, response omits internal IDs and financial amounts for privacy.
    -   **Investor Landing Page**: Premium investor-facing page (`/investor`) with AI-generated images, animated counters, platform module deep-dive, competitive advantages, technology architecture, and Distribution & Scale sections. Features one-click demo launch via auto-login. Consumer portal link also available.
    -   **Demo Sandbox**: Isolated read-only demo environment (`/api/auth/auto-login/sim-review-2026-x7k9m`). Creates a separate "Demo Financial Services" organization with sample borrowers and credit accounts. All POST/PATCH/PUT/DELETE requests are blocked (except auth). Yellow "Demo Mode" banner shown. Demo data is fully isolated from production data. Module: `server/demo-sandbox.ts`.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with velocity checks, identity verification, and geographic anomaly detection.
    -   **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation, and code examples.
    -   **Dashboard Progressive Disclosure**: Collapsible dashboard sections with localStorage persistence.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.
    -   **Real-time WebSocket Notifications**: WebSocket server on `/ws` path, authenticated via session cookies. Broadcasts events for borrower submissions, approval workflows, login events, ML score computations, and blockchain anchoring. Client auto-reconnects with exponential backoff. NotificationBell shows live WS connection indicator and reduces polling when connected.
    -   **Progressive Web App (PWA)**: Service worker (`sw.js`) with network-first caching strategy. Manifest with app icons for installability. Apple-touch-icon and meta tags for iOS support. Install prompt component with localStorage dismissal persistence.
    -   **Biometric Authentication (WebAuthn)**: Full FIDO2/WebAuthn flow using `@simplewebauthn/server`. Users can register fingerprint/face credentials and login without passwords. Endpoints: register-options, register-verify, login-options, login-verify, credentials CRUD. Stored in `webauthn_credentials` table.
    -   **ML-Enhanced Credit Scoring**: Gradient boosting-inspired scoring model (`server/ml-credit-score.ts`) with 10 weighted features: payment velocity, account health ratio, credit utilization, account age diversity, debt service capacity, alternative data reliability, inquiries, judgments, cross-border exposure, PEP status. Outputs: mlScore (300-850), confidence interval, default probability, risk category, feature importance. Model version: GBM-v2.1.0.
    -   **Blockchain Audit Anchoring**: Merkle tree computation of audit log hashes anchored every 6 hours. Simulated Ethereum Sepolia transactions. Stored in `blockchain_anchors` table. Verification endpoint recomputes Merkle root and compares. Admin can trigger manual anchoring via POST `/api/blockchain/anchor`.
    -   **System Status & Health Monitoring**: Public `/api/health` (sanitized) and `/api/status` (sanitized) endpoints for uptime monitors. Authenticated `/api/admin/health-detail` and `/api/admin/status-detail` endpoints with full diagnostics (DB latency, memory, pool stats, hourly uptime history). Background health checks every 30 seconds with SLA percentage tracking. Admin System Status page (`/system-status`) with real-time service cards and 24-hour uptime chart.
    -   **Platform Metrics Dashboard**: Admin-only page (`/platform-metrics`) showing: MRR/ARR/ARPU revenue metrics, subscription tier breakdown with pie chart, API traffic trends (24h hourly + 7d daily), top endpoints, HTTP status distribution, response time percentiles, system resources. Investor KPIs section with MRR growth rate, LTV, CAC, LTV/CAC ratio, NRR, Rule of 40. 12-month revenue projection chart. Powered by `/api/admin/platform-metrics` endpoint.
    -   **Public Pricing Page**: Public-facing page (`/pricing`) showing Standard ($299), Professional ($799), Enterprise ($1,999) subscription tiers with feature comparison matrix. Monthly/annual billing toggle (20% annual discount). Usage-based pricing table. FAQ section. Linked from investor page navigation.
    -   **Security & Compliance Page**: Public-facing page (`/security`) showing 24 security controls across 4 domains (data protection, authentication, infrastructure, compliance), 8 compliance frameworks (GDPR, Ghana DPA, NDPR, POPIA, ISO 27001, SOC 2, PCI DSS, PAPSS). Linked from investor page navigation.
    -   **Webhook Delivery System**: HMAC-SHA256 signed webhook delivery with retry logic and automatic disable after failures. 10 event types (borrower.created, borrower.updated, credit_account.created, credit_report.generated, dispute.filed, dispute.resolved, score.computed, payment.recorded, alert.triggered, batch.completed). Admin UI at `/webhook-management` for CRUD operations, test delivery, and delivery history. Tables: `webhook_subscriptions`, `webhook_delivery_logs`. Webhooks wired to real domain events (borrower creation/update via approval flow, dispute filing, ML score computation).

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit, ws, @simplewebauthn/server
-   **Payments**: Stripe integration.
-   **Email**: SendGrid.
-   **PDF Generation**: pdfkit.
-   **AI / LLM Providers**: Anthropic (Claude Opus) and OpenAI (GPT-4o) via Replit AI Integrations.
-   **Excel Export**: `exceljs`.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).