# Africa Credit Hub — Compressed

## Overview
This project is a web-based Pan-African Credit Registry System (Africa Credit Hub) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal. The system is designed for scalability, supporting over 10 million records and offers transaction-based monetization with a two-tier revenue split and a comprehensive settlement and payout system. It includes competitive intelligence features to highlight its market position.

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
-   **Internationalization**: Supports 8 languages (English, French, Portuguese, Arabic, Swahili, Spanish, Simplified Chinese, Traditional Chinese).
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate).
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down capabilities, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA, strong password policies, biometric (WebAuthn), Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO.
-   **Core Capabilities**: Credit management, consumer/business segmentation, algorithmic credit scoring (300-850) with explainable AI, maker-checker workflow, dispute management, and regulatory compliance across 54 African jurisdictions.
-   **BOG Consent Layer**: Implements a borrower-initiated consent flow compliant with Ghana Data Protection Act for accessing credit reports.
-   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
-   **Reporting**: Regulatory analytics, CSV/PDF export, bulk data upload, structured search, and AI-Enhanced credit reports.
-   **Security & Compliance**: Role-Based Access Control (RBAC), external REST API with OAuth 2.1, fuzzy entity matching, blockchain-anchored audit logs, data sovereignty enforcement, and HMAC-SHA256 webhook signatures.
-   **Financials**: Multi-currency conversion, multi-tenant SaaS, API rate limiting, transaction-based monetization, two-tier revenue split, settlement & payout, and real-time wallet/prepaid billing.
-   **AI & Advanced Features**: Credit Registry Assistant chatbot, AI Portfolio Intelligence, AI Command Center, Open Banking profile management, configurable Decision Rules Engine, ESG Scoring, and AI Report Insights.
-   **Onboarding**: Multi-step signup with fraud prevention for institutions and enhanced Consumer Portal registration.
-   **Cross-Border**: Supports Smart Africa Telecommunications Alliance (SATA) data sharing and Pan-African Payment and Settlement System (PAPSS) tracking.
-   **Alternative Data**: Integration of mobile money, utility, and telco data for credit scoring and full Telco Lending Lifecycle management.
-   **Consumer Portal**: Authenticated self-service portal with dual-channel verification, rate-limited credit score lookups, interactive dispute filing, credit report PDF download, and Credit Monitoring Alerts.
-   **Portfolio Trigger Alerts**: Institutional watchlist for lenders to subscribe to borrower events like score drops, new inquiries, and delinquencies.
-   **Soft Pull / Pre-Qualification**: Allows lenders to run score calculations and get recommendations without affecting the borrower's score or creating hard inquiries.
-   **24-Month Trended Data**: Provides historical payment period and balance/score trend data displayed as interactive charts.
-   **Borrower Record Merge**: A deduplication tool for merging duplicate borrower records, re-pointing all associated child records, and consolidating profile information.
-   **Loan Origination**: Full loan lifecycle management including submission, review, approval/rejection with maker-checker, disbursement, and amortization schedules.
-   **Collateral Registry**: A Pan-African pledged-asset registry, inspired by PPSR models, for managing and tracking collateral across 54 African countries with a lender and registry authority portal.
-   **Institution Analytics**: Usage metrics dashboard for daily event charts, event type breakdowns, and billing records.
-   **White-Label Branding**: Per-institution customization of branding elements like colors, logo, tagline, and custom domain.
-   **System Hardening**: Real-time fraud detection, enhanced API developer portal, security headers, PII encryption at rest, data subject erasure, and platform monitoring.
-   **Data Management**: Centralized page with Export Center, configurable Retention Policies, Retention Policy Scanner, Erasure Requests, and Export History audit trail.
-   **Performance**: Database query parallelization, SQL-based aggregation, integrity verification caching, and request timeout middleware.
-   **Reliability**: Email/SMS with retry mechanisms, exponential backoff, and provider failover.
-   **Platform Master Control Center**: A hidden administration route for managing client deployments, revenue, billing, deployment health, GitHub repository management, configuration, and update tracking.
-   **Competitive Intelligence Section**: An "Investor Landing" page section detailing competitive analysis, market opportunity, and differentiators against global credit bureaus.

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
-   **GitHub**: @octokit/rest via Replit GitHub connector