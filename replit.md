# Credit Registry System v2.1 - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System (v2.0) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across 54 African countries. It handles 42+ African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending in Africa through robust security, adherence to regulatory workflows, and fault tolerance. The system also includes features for multi-tenant SaaS, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal.

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
-   **Theming**: Dark/light theme with a premium teal and gold palette.
-   **Responsiveness**: Mobile-first design with adaptive layouts.
-   **Interactive Elements**: Dashboards with drill-down, notifications, Recharts, an interactive SVG Africa map, and a circular SVG credit score gauge.
-   **Guided Tours**: Interactive demo tour and application walkthroughs.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM, utilizing connection pooling and performance indexes.
-   **Authentication**: Session-based with MFA, strong password policies, and biometric (WebAuthn) support.
-   **Data Model**: 22 core tables for comprehensive credit, compliance, usage metering, pricing, and alternative data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management with multi-currency support.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with explainable AI, utilizing a gradient boosting-inspired model (GBM-v2.1.0) with 10 weighted features.
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions. Includes country-specific compliance modes (e.g., Ghana BoG CRB, Sierra Leone BSL CRB).
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, and bulk data upload (XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching for duplicate detection and cross-border entity resolution.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain for integrity, anchored to a blockchain (simulated Ethereum Sepolia).
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Multi-Tenant SaaS**: Supports multiple organizations with tenant scoping and super_admin role, including client management and onboarding wizard.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and AI-powered Smart Assistant mode with live database context.
    -   **AI Portfolio Intelligence**: Analytics page for AI-powered portfolio reports, including risk ratings and default predictions.
    -   **AI Command Center** (`/ai-command-center`): Unified hub for 6 AI tools — Credit Narratives, Anomaly Detection, Regulatory Reports, Natural Language Queries, Cross-Border Risk Intelligence, and Loan Approval Recommendations. Powered by Claude and GPT-4o.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing via `VITE_COUNTRY_MODE`, with dynamic country switching for Super Admins.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing, volume tier discounts, and editable pricing tiers.
    -   **SATA Cross-Border Framework**: Implements Smart Africa Telecommunications Alliance data sharing.
    -   **PAPSS Settlement Tracker**: Tracks Pan-African Payment and Settlement System settlements.
    -   **Alternative Data Integration**: Integrates mobile money, utility, and telco data for thin-file borrowers.
    -   **Consumer Self-Service Portal**: Public-facing mobile-first portal (`/my-credit`) with identity verification and rate-limited lookups.
    -   **Client Landing Page**: Default landing page (`/solutions`) for unauthenticated users, showcasing platform features and offering trial registration.
    -   **Trial Management**: Self-service registration (`/start-trial`) with sample data seeding and an upgrade path.
    -   **AI Demo Page** (`/ai-demo`): Public interactive showcase of all 6 AI features using sample African credit data. No login required. Accessible via "Try AI Features Free" button on landing page.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with velocity checks, identity verification, and geographic anomaly detection.
    -   **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation, and code examples.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.
    -   **Real-time WebSocket Notifications**: Authenticated WebSocket server for event broadcasting (e.g., borrower submissions, ML score computations).
    -   **Progressive Web App (PWA)**: Installable with service worker and offline capabilities.
    -   **System Status & Health Monitoring**: Public and authenticated endpoints for health, status, and detailed diagnostics. Admin page with real-time service cards.
    -   **Platform Metrics Dashboard**: Admin-only page displaying MRR/ARR, subscription breakdown, API traffic, response times, and investor KPIs.
    -   **Webhook Delivery System**: HMAC-SHA256 signed webhooks with retry logic and administrative UI for management.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit, ws, @simplewebauthn/server
-   **Payments**: Stripe.
-   **Email**: SendGrid.
-   **PDF Generation**: pdfkit.
-   **AI / LLM Providers**: Anthropic (Claude Opus), OpenAI (GPT-4o).
-   **Excel Export**: `exceljs`.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).
-   **Testing**: Vitest for unit tests (`npx vitest run`).

## Production Hardening

### Security Headers
- Helmet CSP configured in `server/index.ts` with directives for scripts, styles, images, fonts, frames, and API connections.
- Cache-control middleware for static assets (1-year immutable for hashed, no-cache for HTML).

### Structured Logging
- `server/logger.ts` provides JSON structured logging with levels (debug/info/warn/error/fatal), source tagging, and child loggers.
- Log level controlled via `LOG_LEVEL` environment variable (default: info).

### Database
- Connection pool optimized in `server/db.ts` with production-aware settings (30 max connections in prod, 20 in dev).
- Pool health check runs every 60 seconds, warns on latency > 500ms.
- Connection timeout: 10s, statement timeout: 30s, keepAlive enabled.

### Email
- Provider abstraction in `server/email.ts`: supports SendGrid (preferred) and Gmail SMTP (fallback).
- Set `SENDGRID_API_KEY` for production email delivery. Falls back to SMTP if SendGrid fails.

### API Versioning
- Both `/api/` and `/api/v1/` prefixes work for all routes (v1 alias in `server/index.ts`).

### Data Export
- Full organization data export at `GET /api/admin/export/:orgId` (admin-only, audit logged).
- POPIA/NDPA/GDPR Article 20 compliant data portability.

### Scripts
- `scripts/backup-db.sh` — Database backup with pg_dump, gzip compression, 7-day retention.
- `scripts/validate.sh` — Pre-deploy validation (TypeScript checks, env vars, DB connectivity, security audit).
- `scripts/load-test.sh` — Load testing with autocannon (health, landing, chatbot, consumer endpoints).

### Health Monitoring
- `/health` — Public health endpoint with DB status, pool stats, memory, uptime.
- `/api/admin/health-detail` — Detailed health with SLA percentage (admin-only).

### Unit Tests
- Credit score tests in `server/__tests__/credit-score.test.ts` (15 test cases).
- Logger tests in `server/__tests__/logger.test.ts` (5 test cases).
- Run with: `npx vitest run`

## Custom Domain & SSL Setup (africacredithub.com)

### Replit Deployment
1. Go to the Deployments tab in Replit.
2. Click "Deploy" to publish to production.
3. In deployment settings, add custom domain: `africacredithub.com`
4. Replit automatically provisions SSL/TLS via Let's Encrypt.

### DNS Configuration
Point your domain's DNS records:
- **A record**: `@` → Replit's IP (shown in deployment settings)
- **CNAME record**: `www` → your-repl.replit.app

### SSL Certificate
- Replit handles SSL certificate provisioning and renewal automatically.
- Supports TLS 1.2 and 1.3.
- HSTS headers are set via Helmet configuration.
- Certificate renewal is automatic — no manual intervention needed.