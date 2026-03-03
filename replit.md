# Credit Registry System - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System developed by Systems In Motion Limited. Its primary purpose is to manage credit information, borrower records, and facilitate credit risk assessment for commercial banks and microfinance institutions across all 54 African countries. The system supports 42+ African currencies plus USD/EUR/GBP, and provides jurisdiction-specific retention policies, regulatory compliance, and cross-border entity resolution. Key capabilities include robust security, regulatory workflow compliance, and a fault-tolerant architecture. The system aims to provide a centralized data hub for credit information, enhancing financial stability and responsible lending practices continent-wide.

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
-   **Internationalization**: Supports all 5 African Union working languages — English, French, Portuguese, Arabic, and Swahili — using `react-i18next` and `i18next-browser-languagedetector`. Translation files: `i18n-pt.ts` (Portuguese), `i18n-ar.ts` (Arabic), `i18n-sw.ts` (Swahili). Arabic has full RTL support via `[dir="rtl"]` CSS rules and dynamic `document.documentElement.dir` toggle. Language switcher (EN/FR/PT/AR/SW) available on login page and main app header.
-   **Data Model**: Comprises 18 core tables including `users`, `borrowers`, `credit_accounts`, `audit_logs`, `pending_approvals`, `disputes`, `institutions`, `api_keys`, `exchange_rates`, `retention_policies`, and `api_configurations`, designed to capture comprehensive credit and operational data.
-   **Key Features**:
    -   **Comprehensive Credit Management**: Includes borrower and credit account management with multi-currency support, collateral tracking, and arrears.
    -   **Credit Scoring & Reporting**: Algorithmic credit scoring (300-850) with detailed reason codes and printable credit reports with serial numbers.
    -   **Workflow & Approvals**: Implements a maker-checker workflow for data changes and a dispute management system with SLA tracking.
    -   **Regulatory Compliance**: Features consent management, court judgment tracking, robust audit trails with IP tracking, and a Regulatory Compliance Dashboard (`/regulatory-compliance`) with SRS traceability matrix (71 requirements), per-country regulatory data for all 54 African jurisdictions, regional bloc analysis, and gap analysis.
    -   **Institutional Management**: Supports self-registration and approval workflows for data providers, along with billing and fee management.
    -   **Reporting & Analytics**: Provides regulatory analytics (NPL ratios, portfolio breakdowns), CSV export capabilities, and bulk data upload functionality.
    -   **RBAC Sidebar**: Navigation items are filtered by user role with collapsible sections using Radix Collapsible. Core items (Dashboard, Borrowers, Credit Accounts, Search, Batch Upload) are always visible. Reports & Compliance, System, and Integrations are collapsible groups that auto-expand when containing the active route. Admin-only items hidden from lender/viewer roles; admin+regulator items hidden from lenders/viewers. Backend enforces RBAC via `requireRole` middleware on all sensitive API routes.
    -   **User Experience**: Features a dashboard with drill-down capabilities, in-app notifications, dark/light theme support, and a Pan-African cultural aesthetic using a warm teal and gold palette.
    -   **External API**: A REST API allows external institutions to programmatically interact with the system for data submission and credit report generation, secured via API keys with granular permissions.

## Enterprise Enhancements (v2.1)
-   **TOTP MFA**: Users can enable two-factor authentication via authenticator apps; login flow supports MFA challenge step
-   **Fuzzy Entity Matching**: pg_trgm trigram similarity on borrower registration warns about potential duplicates; matches on firstName, lastName, nationalId, companyName, passportNumber, and tinNumber
-   **Dispute Chatbot**: Full Credit Registry Assistant with 3 modes: dispute filing, FAQ browsing (15 categories, 50+ Q&A pairs), and keyword search — all in EN/FR
-   **OAuth 2.1 Token Exchange**: External API supports client_credentials grant for Bearer token auth alongside X-API-Key
-   **Low-Bandwidth Optimizations**: gzip compression middleware, React.lazy route code-splitting with Suspense
-   **XBRL Upload**: Batch upload page supports XBRL/XML format tab with sample and parsing endpoint
-   **Tamper-Evident Audit Logs**: SHA-256 hash chain on audit log entries with integrity verification badge
-   **Exchange Rate Management**: Multi-currency conversion with 44-currency support (42 African + EUR/GBP), cross-rate via USD routing, admin CRUD for rate pairs, automatic live rate fetching every 6 hours via open.er-api.com, manual "Refresh Rates" button for on-demand updates
-   **API Administration Module**: Centralized external API configuration management (weather, judicial, payment gateway, exchange rate) with connection testing
-   **Data Retention Policies**: Jurisdiction-specific retention periods (REQ-RET-01), admin/regulator CRUD for policy management, automatic enforcement scheduler (24hr cycle) + manual trigger via Run Enforcement button
-   **Retention Enforcement Engine**: Background scheduler auto-archives/expunges records based on per-country retention policies; supports borrower-linked, credit-account-linked, and global entity types; audit-logged enforcement results
-   **Cross-Border Entity Resolution**: Passport number field on borrowers for cross-jurisdictional identity matching; related party linking with 7 relationship types (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company)
-   **Portuguese i18n**: Full PT translation covering all UI strings, language switcher updated with PT option
-   **i18n Wired on Admin Pages**: Exchange Rates, API Admin, and Retention Policies pages fully use t() translation hooks for EN/FR/PT
-   **Global Search**: Credit Search page upgraded to a true global search (`/api/global-search?q=TERM&country=COUNTRY`) that searches across borrowers, institutions, and credit accounts simultaneously. Results displayed in categorized sections (Borrowers, Institutions, Credit Accounts) with badges, country filters, and direct navigation to detail pages
-   **ID Photos & Documents**: Every borrower has a unique auto-generated avatar photo via DiceBear (deterministic by borrower ID). Borrower detail page shows profile photo with camera overlay for upload, plus ID document section for uploading scanned passport/national ID cards. Upload endpoints at `POST /api/borrowers/:id/photo` and `POST /api/borrowers/:id/id-document` with multer file handling. Photos stored in `uploads/photos/` and `uploads/documents/`, served via `/uploads` static route. Schema fields: `photoUrl` and `idDocumentUrl` on borrowers table. Avatars displayed on borrower list cards, search results, and detail pages
-   **Dashboard Currency Localisation**: Auto-detects user's local currency from browser timezone (all 54 African countries + EU/US/UK mapped via `detectLocalCurrency()` in `client/src/lib/currency.ts`). Dashboard shows outstanding amounts in detected local currency with USD reference subtitle (`≈ USD X.XM`). Currency selector dropdown allows override (persisted in localStorage). Backend `getDashboardStats` returns `outstandingByCurrency` breakdown for accurate multi-currency conversion via exchange rates. All detail panels (accounts, outstanding, delinquent, defaults) display amounts in selected display currency.
-   **Version History Page**: In-app changelog at `/version-history` showing 3 releases (v1.0 Foundation, v1.1 Enterprise, v1.2 Current) with feature cards, icons, and timeline layout. Fully translated in all 5 AU languages. Accessible from sidebar under Resources.
-   **Dashboard Visual Analytics**: Interactive Recharts-based charts and SVG Africa map on the dashboard. Components: `dashboard-charts.tsx` (area trend chart showing 12-month portfolio growth, donut chart for account status breakdown, horizontal bar chart for loan type distribution) and `africa-map.tsx` (SVG choropleth of all 54 African countries with heat coloring by borrower count, hover tooltips with country stats, dark mode support). Backend endpoint `GET /api/dashboard/chart-data` (auth-protected) returns `monthlyTrend`, `statusBreakdown`, `typeBreakdown`, and `countryBreakdown` aggregated from real DB data.
-   **Interactive Demo Tour**: 11-step guided tour (`demo-tour.tsx`) auto-launches after demo login, spotlights key UI elements (sidebar, dashboard, search, charts, map, settings), supports Next/Back/Skip/Close controls, "Take a Tour" button in demo banner. Translations in all 5 AU languages.
-   **Investor Landing Page**: Public (no auth) page at `/investor` with hero section, animated stat counters (54 countries, 102K+ borrowers, 172K+ accounts, 42+ currencies), 9 feature cards, "Why CDH" selling points, tech stack grid, and CTA buttons linking to demo/login. Gradient text, subtle background patterns, sticky nav on scroll. SEO meta tags. Route added as public path in `App.tsx` before auth check.
-   **Floating Chatbot Button**: Chatbot trigger moved from header icon to a prominent floating action button (FAB) in bottom-right corner. Hides when chatbot panel is open, reappears on close. Uses primary color with shadow and hover scale animation.
-   **Application Walkthrough Guide**: Comprehensive in-app visual guide at `/guide` accessible from sidebar under Resources ("App Guide"). Features 14 sections covering all major features (Dashboard, Borrowers, Credit Accounts, Search, Batch Upload, Disputes, Approvals, Credit Reports, Consent, Audit Trail, Institutions, User Management, Exchange Rates, Regulatory Compliance). Each section has step-by-step instructions with visual mockups, role-specific notes for all 4 roles, and tips. Role filter lets users see only features relevant to their role. Includes Quick Reference permissions matrix and links to Help, Documentation, and Helpdesk. Sidebar i18n labels in all 5 AU languages.

## Multi-Tenant SaaS Architecture
-   **Organizations Table**: `organizations` table with enums for type (bank, microfinance, insurance, telecom, fintech, utility, government, regulator, real_estate, investment, other) and status (active, suspended, pending, deactivated). Fields: id, name, slug (unique), type, status, country, contactEmail, contactPhone, address, logoUrl, website, subscriptionTier (standard/professional/enterprise), maxUsers, createdAt, updatedAt.
-   **Tenant Scoping**: `organizationId` column added to all key tables (users, borrowers, creditAccounts, auditLogs, pendingApprovals, disputes, notifications, courtJudgments, consentRecords, institutions, billingRecords, creditReportLogs). All major queries accept optional `organizationId` for filtering.
-   **Super Admin Role**: `super_admin` role added to userRoleEnum. Super admins can view all organizations' data or filter by `?orgId=` query param. Regular users are automatically scoped to their organization.
-   **Platform Admin Routes**: `GET/POST /api/admin/organizations`, `PATCH/DELETE /api/admin/organizations/:id`, `GET /api/admin/platform-stats`, `GET /api/admin/organizations/:id/users` — all super_admin only.
-   **Organizations Management Page**: `/organizations` route with CRUD for organizations, platform stats dashboard (total orgs, active orgs, total users, total borrowers).
-   **Sidebar Updates**: "Platform" section with "Organizations" link for super_admin; org name in footer for regular users; "Platform Admin" badge for super_admin. Header shows org context for regular users and "Platform Admin" label for super_admin.
-   **Seed Data**: 4 demo organizations (Systems In Motion, National Bank of Ethiopia, M-Pesa Financial Services, AfrInsure Group) with `platform_admin/platform123` super_admin user. Existing seed users/borrowers assigned to demo orgs.
-   **Data Isolation**: `getOrgScope()` helper in routes returns `req.query.orgId` for super_admin or `req.session.organizationId` for others. All CRUD operations automatically scope by organization.

## External Dependencies
-   **Database**: PostgreSQL (specifically Neon for hosting)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth
-   **Internationalization**: `react-i18next`, `i18next`
-   **Deployment**: Configured for autoscale environments with Node.js.

## Mobile Responsiveness
-   **Viewport**: `viewport-fit=cover` for safe-area support on iPhone notch devices
-   **Page Padding**: All pages use `p-3 sm:p-6` for tighter mobile padding, relaxed on desktop
-   **Form Grids**: All 2-column form grids use `grid-cols-1 sm:grid-cols-2` to stack on mobile
-   **Data Tables**: All tables wrapped in `overflow-x-auto` for horizontal scrolling; reduced font on mobile
-   **Sidebar**: Uses `Sheet` (drawer overlay) on screens under 768px; 18rem mobile width
-   **Header**: Compact gaps on mobile; user name hidden below `md` breakpoint
-   **Chatbot**: Full-width on mobile (`left-3 right-3`), fixed 400px on desktop; safe-area-inset-bottom support
-   **Dialogs**: Capped at `calc(100vw - 1.5rem)` on mobile with `max-height: 90vh`
-   **Touch**: Min 36px touch targets on touch devices via `pointer: coarse` media query
-   **Pagination**: Stacks vertically on mobile (`flex-col sm:flex-row`)

## Documentation System
-   **Multi-Language Docs API**: `/api/docs`, `/api/docs/:id`, and `/api/docs/:id/pdf` all accept `?lang=` query parameter (en/fr/ar/sw). Backend uses `resolveDocPath()` helper that checks `docs/{lang}/filename.md` first, falls back to `docs/filename.md` (English default). Frontend documentation page passes current i18n language automatically.
-   **Translated Documentation**: All 7 docs (UAT_Test_Document, Systems_Documentation, Users_Manual, SRS_Traceability_Matrix, Data_Dictionary, Deployment_Guide, Security_Compliance_Report) are available in:
    - `docs/` — English (original)
    - `docs/fr/` — French
    - `docs/ar/` — Arabic (Modern Standard Arabic)
    - `docs/sw/` — Swahili (Kiswahili sanifu)
-   **Translation Conventions**: Section headings, descriptions, and prose are translated. Technical terms (table names, column names, API endpoints, test case IDs, code snippets, status values, role names) are kept in English.