# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System by Systems In Motion Limited. Its core function is to centralize credit information, manage borrower records, and aid in credit risk assessment for financial institutions across all 54 African countries. The system supports 42+ African currencies plus USD/EUR/GBP, implements jurisdiction-specific retention policies, ensures regulatory compliance, and facilitates cross-border entity resolution. It emphasizes robust security, regulatory workflow adherence, and a fault-tolerant architecture to enhance financial stability and responsible lending throughout Africa.

## User Preferences
I prefer clear and concise communication.
I value iterative development with frequent, small updates.
Please ask for confirmation before implementing major architectural changes or significant feature additions.
I prefer detailed explanations for complex logic or design decisions.
Do not make changes to the `docs/` folder.

## System Architecture
The system utilizes a modern full-stack architecture designed for scalability and compliance.

**UI/UX Decisions:**
-   **Frontend Framework**: React with TypeScript and Vite.
-   **Styling**: Tailwind CSS and shadcn/ui components.
-   **Internationalization**: Supports English, French, Portuguese, Arabic, and Swahili using `react-i18next`, with full RTL support for Arabic. Language switcher available on login and main app header.
-   **Theming**: Dark/light theme support.
-   **Cultural Aesthetic**: Warm teal and gold palette reflecting a Pan-African cultural aesthetic.
-   **Responsiveness**: Mobile-first design with `viewport-fit=cover`, responsive padding, collapsing form grids, `overflow-x-auto` for tables, and a Sheet component for the mobile sidebar.
-   **Interactive Elements**: Dashboard with drill-down capabilities, in-app notifications, interactive Recharts-based charts, and an SVG Africa map with heat coloring and tooltips.
-   **Guided Tours**: An 11-step interactive demo tour and a comprehensive in-app application walkthrough guide with role-specific notes.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Routing**: `wouter` for frontend, Express for API.
-   **Authentication**: Session-based authentication with bcryptjs for password hashing and `express-session`. Includes 3-attempt lockout, 15-minute session timeout, IP tracking, strong password policies, and 90-day expiry. TOTP MFA is supported.
-   **Data Model**: 18 core tables covering users, borrowers, credit accounts, audit logs, and more, capturing comprehensive credit and operational data.
-   **Core Capabilities**:
    -   **Credit Management**: Comprehensive borrower and credit account management, multi-currency support, collateral tracking, and arrears.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes and printable reports.
    -   **Workflow**: Maker-checker workflow for data, dispute management with SLA tracking.
    -   **Regulatory Compliance**: Consent management, court judgment tracking, audit trails, and a Regulatory Compliance Dashboard with SRS traceability and country-specific data for all 54 African jurisdictions. Includes jurisdiction-specific data retention policies with automated enforcement.
    -   **Institutional Management**: Self-registration and approval for data providers, billing, and fee management.
    -   **Reporting**: Regulatory analytics (NPL, portfolio breakdowns), CSV export, and bulk data upload (including XBRL/XML).
    -   **Role-Based Access Control (RBAC)**: Sidebar navigation filtered by user role, enforced by `requireRole` middleware on API routes.
    -   **External API**: REST API for data submission and credit report generation, secured via API keys with granular permissions, and OAuth 2.1 token exchange.
    -   **Entity Matching**: Fuzzy entity matching (`pg_trgm`) to detect potential duplicate borrower registrations.
    -   **Tamper-Evident Audit Logs**: SHA-256 hash chain on audit log entries.
    -   **Exchange Rate Management**: Multi-currency conversion across 44 currencies (42 African + EUR/GBP), automatic live rate fetching, and manual refresh.
    -   **Cross-Border Entity Resolution**: Passport number field for cross-jurisdictional identity matching and related party linking.
    -   **Global Search**: Searches across borrowers, institutions, and credit accounts with categorized results and country filters.
    -   **ID Photos & Documents**: Borrower profiles include auto-generated avatars and sections for uploading ID photos/documents.
    -   **Multi-Tenant SaaS Architecture**: `organizations` table, tenant scoping via `organizationId` on all key tables, and a `super_admin` role with platform administration routes. Client Management page (`/organizations`) with animated stat cards, searchable/filterable client list with payment health badges and country flags, clickable detail view with billing summaries and tabbed content (Overview, Billing, Users), and a 4-step onboarding wizard with visual country/currency pickers and subscription plan selection.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: A Credit Registry Assistant with dispute filing, FAQ, and keyword search in EN/FR, accessible via a floating action button.
    -   **Documentation**: Multi-language documentation API (`/api/docs`) supporting English, French, Arabic, and Swahili, with translated content for key documents.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next
-   **Backend**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth
-   **Third-Party APIs**: open.er-api.com (for exchange rates), DiceBear (for avatars).