# Africa Credit Hub v2.5

## Overview
This project is a web-based Pan-African Credit Registry System (Africa Credit Hub v2.5) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal. The system is designed for scalability, supporting over 10 million records and offers transaction-based monetization with a two-tier revenue split and a comprehensive settlement and payout system.

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
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate).
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down capabilities, notifications, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA (TOTP), strong password policies, biometric (WebAuthn) support, Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO.
-   **Core Capabilities**: Credit management, consumer/business segmentation, algorithmic credit scoring (300-850) with explainable AI, maker-checker workflow, dispute management, and regulatory compliance (consent, audit trails, 54 African jurisdictions).
-   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
-   **Reporting**: Regulatory analytics, CSV/PDF export, bulk data upload (XBRL/XML, IFF), structured search, and AI-Enhanced credit reports (ML score, dual-AI risk analysis, AI narrative with clear visual separation from verified bureau data).
-   **Security & Compliance**: Role-Based Access Control (RBAC), external REST API with OAuth 2.1, fuzzy entity matching, tamper-evident audit logs (blockchain-anchored), data sovereignty enforcement, and HMAC-SHA256 webhook signatures.
-   **Financials**: Multi-currency conversion with live rate fetching, multi-tenant SaaS, API rate limiting, transaction-based monetization, two-tier revenue split, settlement & payout system, and real-time wallet/prepaid billing.
-   **AI & Advanced Features**: Credit Registry Assistant chatbot (Multi-Model AI Ensemble), AI Portfolio Intelligence, AI Command Center (6 tools), Open Banking profile management, configurable Decision Rules Engine, and ESG Scoring for corporate borrowers.
-   **Onboarding**: Multi-step signup with fraud prevention for institutions (BRN validation, super_admin approval), and enhanced Consumer Portal registration.
-   **Cross-Border**: Smart Africa Telecommunications Alliance (SATA) data sharing, Pan-African Payment and Settlement System (PAPSS) tracking.
-   **Alternative Data**: Integration of mobile money, utility, and telco data for credit scoring; full Telco Lending Lifecycle management with idempotency support.
-   **Consumer Portal**: Authenticated self-service portal with dual-channel verification and rate-limited credit score lookups.
-   **System Hardening**: Real-time fraud detection, enhanced API developer portal, security headers, PII encryption at rest (AES-256-GCM), data subject erasure, password history, login anomaly detection, configurable platform identity, real-time WebSocket notifications, PWA, system status/monitoring, maintenance mode, platform metrics dashboard, and registry alert settings (alert email, Slack webhook, check interval configurable from UI and stored in DB via `registry_health_config` table).
-   **Data Management**: Centralized Data Management page (`/data-management`) with Export Center (full portability export with optional AES-256 encryption + SHA-256 integrity hashing), Retention Policies CRUD (with configurable enforcement action: flag/archive/delete), Retention Policy Scanner (country-scoped for admin, global for super_admin), Erasure Requests (cascade erasure deleting all borrower-related data), and Export History audit trail. Rate-limited exports (5/hr admin, 1/day consumer). Consumer self-export via "Download My Data" button in consumer portal. Credit Score History table tracks score changes over time. Module: `server/export-service.ts`. Migration: `server/migrate-new-tables.ts`.
-   **Performance**: Database query parallelization, SQL-based aggregation, integrity verification caching, and request timeout middleware.
-   **Reliability**: Email/SMS with 3-attempt retry, exponential backoff, provider failover, and outbound rate limiting.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit, ws, @simplewebauthn/server
-   **Payments**: Stripe
-   **Email**: SendGrid, Gmail SMTP
-   **SMS**: Twilio, Africa's Talking
-   **AI / LLM Providers**: Anthropic (Claude Opus), OpenAI (GPT-4o)
-   **Excel Export/Import**: `exceljs`, `xlsx` (SheetJS)
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars)
-   **GitHub**: @octokit/rest via Replit GitHub connector (repo management for client deployments)

## Platform Master Control Center
Hidden route at `/platform-control-9x7k` (not in sidebar/nav). Protected by `MASTER_CONTROL_PASSWORD` env secret. Session cookie `pc_session` (no maxAge, in-memory). Features:
-   **Client Deployments**: Register/edit/delete deployment instances with full config (branding, fees, dates, GitHub repo, heartbeat URL)
-   **Revenue & Billing**: Platform-wide revenue analytics across all deployments
-   **Deployment Health Monitor**: Heartbeat polling of all registered client instances via public `/api/heartbeat` endpoint
-   **GitHub Repository Management**: Create private repos, link repos to deployments, view repo status/commits/branches
-   **Configuration Matrix**: Side-by-side comparison of all deployment configs
-   **Config Generator**: Generate `.env` configs for new client deployments
-   **Update Tracker**: Track deployment update history
-   **Auto-detect Current Instance**: One-click self-registration with live DB stats
