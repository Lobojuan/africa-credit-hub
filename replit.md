# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System aimed at centralizing credit information, managing borrower records, and supporting credit risk assessment for financial institutions across 54 African countries. It handles 42+ African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system is designed for robust security, adherence to regulatory workflows, and fault tolerance to bolster financial stability and responsible lending in Africa.

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
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili with `react-i18next`, including full RTL support for Arabic.
-   **Theming**: Dark/light theme.
-   **Aesthetics**: Warm teal and gold palette reflecting a Pan-African cultural aesthetic.
-   **Responsiveness**: Mobile-first design, adaptive layouts, and mobile-specific components.
-   **Interactive Elements**: Dashboards with drill-down capabilities, in-app notifications, Recharts-based charts, and an interactive SVG Africa map.
-   **Guided Tours**: Interactive demo tour and application walkthroughs with role-specific notes.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with bcryptjs, including 3-attempt lockout, session timeouts, IP tracking, strong password policies, 90-day expiry, and TOTP MFA.
-   **Data Model**: 18 core tables for comprehensive credit and operational data.
-   **Core Capabilities**:
    -   **Credit Management**: Borrower and credit account management, multi-currency support, collateral, and arrears tracking.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes and reports.
    -   **Workflow**: Maker-checker workflow, dispute management with SLA tracking.
    -   **Regulatory Compliance**: Consent management, court judgment tracking, audit trails, and a Regulatory Compliance Dashboard with jurisdiction-specific data retention and enforcement for 54 African jurisdictions.
    -   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
    -   **Reporting**: Regulatory analytics, CSV export, and bulk data upload (including XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Role-filtered navigation and API access control.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys and OAuth 2.1.
    -   **Entity Matching**: Fuzzy entity matching (`pg_trgm`) for duplicate detection.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain.
    -   **Exchange Rate Management**: Multi-currency conversion for 44 currencies with automatic live rate fetching.
    -   **Cross-Border Entity Resolution**: Passport number field for cross-jurisdictional identity matching.
    -   **Global Search**: Searches across borrowers, institutions, and credit accounts.
    -   **Multi-Tenant SaaS**: `organizations` table, tenant scoping via `organizationId`, and `super_admin` role for platform administration. Includes client management and a 4-step onboarding wizard.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and an AI-powered Smart Assistant mode (OpenAI GPT-4o streaming).
    -   **Documentation**: Multi-language documentation API for key documents.
    -   **Ghana Mode** (`VITE_COUNTRY_MODE=ghana`): A comprehensive country-specific mode that reconfigures the entire system for Ghana's credit registry. Backend filtering via `getGhanaCountry()` helper ensures all API endpoints (borrowers, credit accounts, disputes, court judgments, consent records, credit inquiries, credit reports, dashboard stats/details, institutions, global search, regulatory compliance, retention policies, admin analytics) return only Ghana-related data. Frontend locks country selectors to "Ghana" on credit search, reports, and institution pages. Currencies restricted to GHS/USD/EUR. Includes 8 Ghana compliance documents and Bank of Ghana CRB v1.1 standards.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit
-   **Payments**: Stripe integration for subscriptions (Standard, Professional, Enterprise).
-   **Email**: SendGrid email service for notifications (currently in stub mode, requires API key for activation).
-   **PDF Generation**: pdfkit for server-side PDF invoice and credit report generation.
-   **AI / OpenAI**: Integrated via Replit AI Integrations for credit risk analysis, report summaries, chatbot, and compliance reports.
-   **Excel Export**: `exceljs` package for XLSX report exports.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).