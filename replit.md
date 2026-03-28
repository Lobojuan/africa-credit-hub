# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal.

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
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down, notifications, Recharts, an interactive SVG Africa map, and a circular SVG credit score gauge.
-   **Guided Tours**: Interactive demo tour and application walkthroughs.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA, strong password policies, biometric (WebAuthn) support, and role-based idle session timeouts. Google OAuth integration is also supported.
-   **Data Model**: 22 core tables for credit, compliance, usage metering, pricing, and alternative data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management with multi-currency support, including 20 standardized credit types.
    -   **Consumer/Business Segmentation**: Borrowers are segmented with separate API endpoints, navigation, and RBAC rules.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with explainable AI, utilizing a gradient boosting-inspired model.
    -   **Workflow**: Maker-checker workflow and dispute management.
    -   **Regulatory Compliance**: Consent management, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, and bulk data upload (XBRL/XML, IFF).
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching for duplicate detection and cross-border entity resolution.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain for integrity, anchored to a blockchain (simulated Ethereum Sepolia).
    -   **Data Sovereignty Enforcement**: Ensures users only access/modify data within their authorized country, with cross-border access requiring SATA agreements.
    -   **HMAC-SHA256 Webhook Signatures**: For payload verification of outbound webhooks.
    -   **Exchange Rate Management**: Multi-currency conversion with automatic live rate fetching.
    -   **Multi-Tenant SaaS**: Supports multiple organizations with tenant scoping and a super_admin role.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **API Rate Limiting**: Tiered rate limiting for various endpoints.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and AI-powered Smart Assistant mode.
    -   **AI Portfolio Intelligence**: Analytics page for AI-powered portfolio reports, including risk ratings and default predictions.
    -   **Multi-Model AI Ensemble**: Unified AI router (`generateAIResponse` in `server/ai.ts`) with task-type-based routing and automatic failover, using OpenAI GPT-4o and Anthropic Claude.
    -   **Dual-AI Ensemble**: Two-step pipeline (`dualAIEnsemble`) for structured risk assessment (e.g., Telco Credit Scoring) where GPT-4o performs quantitative analysis and Claude provides compliance/regulatory rationale, with cross-provider fallback.
    -   **Brain & Voice Chatbot**: Dual-AI architecture in `chatWithAI` using GPT-4o as "The Brain" and Claude as "The Voice" for empathetic streaming responses.
    -   **Concentration Risk Alerts**: Automated endpoint (`GET /api/concentration-alerts`) and dashboard widget monitoring single-borrower, single-lender, and sector exposure thresholds.
    -   **AI Command Center**: Unified hub for 6 AI tools: Credit Narratives, Anomaly Detection, Regulatory Reports, Natural Language Queries, Cross-Border Risk Intelligence, and Loan Approval Recommendations.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing with dynamic country switching.
    -   **Transaction-Based Monetization**: Per-transaction billing with per-country pricing and volume tier discounts.
    -   **SATA Cross-Border Framework**: Implements Smart Africa Telecommunications Alliance data sharing.
    -   **PAPSS Settlement Tracker**: Tracks Pan-African Payment and Settlement System settlements.
    -   **Alternative Data Integration**: Integrates mobile money, utility, and telco data.
    -   **Telco Credit Scoring**: Dedicated AI-driven mobile money (MoMo) analytics section for credit-scoring unbanked/underbanked populations, including KPI computation, AI credit scores, and a configurable decision engine.
    -   **Business Credit Report Template**: Dedicated page at `/business-credit-report/:borrowerId` with 10 D&B-style sections for comprehensive business credit analysis.
    -   **Credit Score Methodology Page**: Dedicated `/credit-score-methodology` page with RBAC restriction, explaining score bands, factors, reason codes, and an interactive Score Simulator.
    -   **Score Guide**: Public-facing credit score education page at `/score-guide` with score band explanations and improvement tips.
    -   **Investor Landing Page**: Marketing/investor-facing landing page at `/investor-landing` with feature showcases, platform statistics, and calls-to-action.
    -   **Consumer Self-Service Portal**: Authenticated portal for consumers with registration, login, dual-channel verification, and rate-limited credit score lookups.
    -   **Smart Trial Flow**: Streamlined trial registration for Google-authenticated users.
    -   **Client Landing Page**: Default landing page for unauthenticated users showcasing features.
    -   **Trial Management**: Self-service registration with sample data seeding and upgrade path.
    -   **AI Demo Page**: Public interactive showcase of AI features using sample data.
    -   **Fraud Detection Layer**: Real-time fraud risk scoring.
    **Enhanced API Developer Portal**: Interactive sandbox, webhook event documentation.
    -   **Security Hardening**: Helmet security headers, DOMPurify sanitization.
    -   **Real-time WebSocket Notifications**: Authenticated WebSocket server for event broadcasting.
    -   **Progressive Web App (PWA)**: Installable with service worker and offline capabilities.
    -   **System Status & Health Monitoring**: Public and authenticated endpoints for health and diagnostics.
    -   **Platform Metrics Dashboard**: Admin-only page displaying MRR/ARR, subscription breakdown, and KPIs.
    -   **Platform-Wide KPI/ROI Banners**: Reusable KPI banner component with contextual metrics across major sections.
    -   **Webhook Delivery System**: HMAC-SHA256 signed webhooks with retry logic.

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