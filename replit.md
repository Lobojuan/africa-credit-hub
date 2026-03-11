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
-   **Authentication**: Session-based with bcryptjs, including 3-attempt lockout, session timeouts, IP tracking, strong password policies, 90-day expiry, and TOTP MFA.
-   **Data Model**: 19 core tables for comprehensive credit and operational data, including `dishonoured_cheques` for compliance.
-   **Core Capabilities**:
    -   **Credit Management**: Borrower and credit account management, multi-currency support, collateral, and arrears tracking.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes, reports, and transparency section.
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
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and an AI-powered Smart Assistant mode (OpenAI GPT-4o streaming) with live database context.
    -   **AI Portfolio Intelligence**: Dedicated analytics page generating comprehensive AI-powered portfolio reports including executive summaries, risk ratings, default predictions, early warnings, and strategic recommendations. Access restricted to admin/super_admin/regulator roles.
    -   **Documentation**: Multi-language documentation API.
    -   **Multi-Country Data Isolation**: Country-level data sandboxing via `VITE_COUNTRY_MODE`. Each country's organizations, borrowers, and accounts are isolated — only the active country's data is visible. Server-side `getCountryFilter()` enforces isolation on all org queries. 10 African countries supported in the registry (Ghana, Liberia, Sierra Leone, Nigeria, Kenya, Rwanda, Tanzania, Uganda, Ethiopia, South Africa). API endpoints: `GET /api/platform/country-mode` (all users), `GET /api/platform/country-stats` (super_admin only). Country badge in sidebar footer, country label in org switcher.
    -   **Dynamic Country Switching (Super Admin)**: Double login system — super admins see a full-screen Country Selection Page after login where they choose a country or "Global View" before entering the dashboard. Regular users log in directly to their country's dashboard with no country selection visible. After initial selection, super admins can switch countries via a `CountrySelector` in the header. `POST /api/platform/set-country` sets `viewingCountry` in session; `getCountryFilter(req)` reads session for super_admin. `CountryThemeProvider` dynamically applies per-country CSS custom properties (sidebar colors, primary/accent, logo gradient) when switching. Each of the 10 countries has a distinct color theme. The sidebar brand title, logo, and country badge all update dynamically. Data is fully isolated per country — no cross-country data sharing.
    -   **Ghana Mode**: A comprehensive country-specific mode (`VITE_COUNTRY_MODE=ghana`) that reconfigures the entire system for Ghana's credit registry, including specific seed data, UI locks, and compliance with Bank of Ghana CRB v1.1 standards.
    -   **BoG CRB v1.1 Compliance**: Full Bank of Ghana Credit Reference Bureau v1.1 export compliance, including specific code catalogs, credit report sections, schema fields, and a dedicated export engine for pipe-delimited CSV files across 6 BoG file types.
    -   **Enterprise Features**:
        -   **Credit Score Methodology Page**: Transparent scoring model documentation with an interactive simulator and factor weights.
        -   **Regulatory Dashboard**: Central bank oversight with NPL ratios, sector NPL heatmap, and data quality metrics.
        -   **Borrower Alerts**: Credit file access notification system.
        -   **Enhanced Audit Trail**: Hash chain verification UI, CSV export, and advanced filters.
        -   **Enhanced Batch Upload**: CSV, JSON, XBRL, BoG file upload with client-side validation and history.
        -   **Enhanced API Docs**: Interactive API explorer, rate limit documentation, and code examples.
    -   **Security Hardening**: Helmet security headers, rate limiting, DOMPurify sanitization, and secure handling of secrets.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit
-   **Payments**: Stripe integration for subscriptions.
-   **Email**: SendGrid email service for notifications.
-   **PDF Generation**: pdfkit for server-side PDF invoice and credit report generation.
-   **AI / OpenAI**: Integrated via Replit AI Integrations for credit risk analysis, report summaries, chatbot, and compliance reports.
-   **Excel Export**: `exceljs` package for XLSX report exports.
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars).