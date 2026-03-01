# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Credit Registry System developed by Systems In Motion Limited. Its primary purpose is to manage credit information, borrower records, and facilitate credit risk assessment for commercial banks and microfinance institutions. The system is designed for pan-African deployment, specifically adhering to regulatory requirements in Ghana, Ethiopia, Liberia, and Uganda. Key capabilities include robust security, regulatory workflow compliance, and a fault-tolerant architecture. The system aims to provide a centralized data hub for credit information, enhancing financial stability and responsible lending practices across these regions.

## User Preferences
I prefer clear and concise communication.
I value iterative development with frequent, small updates.
Please ask for confirmation before implementing major architectural changes or significant feature additions.
I prefer detailed explanations for complex logic or design decisions.
Do not make changes to the `docs/` folder.

## System Architecture
The system employs a modern full-stack architecture:
-   **Frontend**: Built with React and TypeScript, utilizing Vite for tooling, Tailwind CSS for styling, and shadcn/ui for components.
-   **Backend**: An Express.js API server handles business logic and data operations, secured with session-based authentication.
-   **Database**: PostgreSQL, hosted on Neon, is used as the primary data store, managed with Drizzle ORM.
-   **Routing**: `wouter` is used for client-side navigation, while Express handles API routing.
-   **Authentication**: Features bcryptjs for password hashing and `express-session` with memorystore for session management. Security measures include a 3-attempt login lockout, 15-minute session timeout, and IP tracking in audit logs. Password policies enforce strong passwords and 90-day expiry.
-   **Internationalization**: Supports English and French using `react-i18next` and `i18next-browser-languagedetector`.
-   **Data Model**: Comprises 15 core tables including `users`, `borrowers`, `credit_accounts`, `audit_logs`, `pending_approvals`, `disputes`, `institutions`, and `api_keys`, designed to capture comprehensive credit and operational data.
-   **Key Features**:
    -   **Comprehensive Credit Management**: Includes borrower and credit account management with multi-currency support, collateral tracking, and arrears.
    -   **Credit Scoring & Reporting**: Algorithmic credit scoring (300-850) with detailed reason codes and printable credit reports with serial numbers.
    -   **Workflow & Approvals**: Implements a maker-checker workflow for data changes and a dispute management system with SLA tracking.
    -   **Regulatory Compliance**: Features consent management, court judgment tracking, and robust audit trails with IP tracking.
    -   **Institutional Management**: Supports self-registration and approval workflows for data providers, along with billing and fee management.
    -   **Reporting & Analytics**: Provides regulatory analytics (NPL ratios, portfolio breakdowns), CSV export capabilities, and bulk data upload functionality.
    -   **User Experience**: Features a dashboard with drill-down capabilities, in-app notifications, dark/light theme support, and a Pan-African cultural aesthetic using a warm teal and gold palette.
    -   **External API**: A REST API allows external institutions to programmatically interact with the system for data submission and credit report generation, secured via API keys with granular permissions.

## Enterprise Enhancements (v2.1)
-   **TOTP MFA**: Users can enable two-factor authentication via authenticator apps; login flow supports MFA challenge step
-   **Fuzzy Entity Matching**: pg_trgm trigram similarity on borrower registration warns about potential duplicates
-   **Dispute Chatbot**: Chat-guided assistant for filing disputes (multi-step: issue type → borrower search → account → description → submit)
-   **OAuth 2.1 Token Exchange**: External API supports client_credentials grant for Bearer token auth alongside X-API-Key
-   **Low-Bandwidth Optimizations**: gzip compression middleware, React.lazy route code-splitting with Suspense
-   **XBRL Upload**: Batch upload page supports XBRL/XML format tab with sample and parsing endpoint
-   **Tamper-Evident Audit Logs**: SHA-256 hash chain on audit log entries with integrity verification badge

## External Dependencies
-   **Database**: PostgreSQL (specifically Neon for hosting)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth
-   **Internationalization**: `react-i18next`, `i18next`
-   **Deployment**: Configured for autoscale environments with Node.js.