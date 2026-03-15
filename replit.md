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
    -   **Consumer Self-Service Portal**: Public-facing mobile-first portal (`/my-credit`) for borrowers to look up credit scores. Rendered outside auth guard; API rate-limited (10 req/15min), minimum 6-char ID, response omits internal IDs and financial amounts for privacy.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring with velocity checks, identity verification, and geographic anomaly detection.
    -   **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation, and code examples.
    -   **Dashboard Progressive Disclosure**: Collapsible dashboard sections with localStorage persistence.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit
-   **Payments**: Stripe integration.
-   **Email**: SendGrid.
-   **PDF Generation**: pdfkit.
-   **AI / LLM Providers**: Anthropic (Claude Opus) and OpenAI (GPT-4o) via Replit AI Integrations.
-   **Excel Export**: `exceljs`.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).