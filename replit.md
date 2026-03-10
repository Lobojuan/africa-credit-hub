# Credit Registry System v2.0 - Systems In Motion Limited

## Overview
This project is a web-based Pan-African Credit Registry System (v2.0) aimed at centralizing credit information, managing borrower records, and supporting credit risk assessment for financial institutions across 54 African countries. It handles 42+ African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system is designed for robust security, adherence to regulatory workflows, and fault tolerance to bolster financial stability and responsible lending in Africa.

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
-   **Aesthetics**: Premium teal and gold palette reflecting a Pan-African cultural aesthetic. Enhanced with mesh gradient backgrounds, glassmorphism (glass-card, backdrop-blur), card-shine sweep animations, premium-glow hover effects with colored blur halos, gradient-border hover reveals, section-banner gradient headers with animated floating icons, page-enter/stagger transitions, and reduced-motion accessibility support. Stat cards feature colored icon glows, elevated sparklines, and smooth scale transitions. Chart tooltips use frosted glass styling.
-   **Responsiveness**: Mobile-first design, adaptive layouts, and mobile-specific components.
-   **Interactive Elements**: Dashboards with drill-down capabilities, in-app notifications, Recharts-based charts, an interactive SVG Africa map, and circular SVG credit score gauge (`CreditScoreGauge` component).
-   **Guided Tours**: Interactive demo tour and application walkthroughs with role-specific notes.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with bcryptjs, including 3-attempt lockout, session timeouts, IP tracking, strong password policies, 90-day expiry, and TOTP MFA.
-   **Data Model**: 19 core tables for comprehensive credit and operational data (includes `dishonoured_cheques` table for BoG CRB v1.1 compliance).
-   **Core Capabilities**:
    -   **Credit Management**: Borrower and credit account management, multi-currency support, collateral, and arrears tracking.
    -   **Credit Scoring**: Algorithmic scoring (300-850) with reason codes, reports, and Score Methodology & Validation transparency section showing variable weights and model validation metrics (Gini, KS, Rank Ordering, Stress Testing, PD).
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
    -   **Multi-Tenant SaaS**: `organizations` table, tenant scoping via `organizationId`, and `super_admin` role for platform administration. Includes client management and a 4-step onboarding wizard. The org switcher in the header uses `OrgSwitcherProvider` context + `setGlobalOrgId()` which causes `appendOrgId()` in `queryClient.ts` to add `?orgId=xxx` to all API fetches. When switching orgs, auth queries (`/api/auth/*`) must be excluded from query reset to prevent logout.
    -   **Low-Bandwidth Optimizations**: Gzip compression and React.lazy code-splitting.
    -   **Chatbot**: Credit Registry Assistant with dispute filing, FAQ, keyword search, and an AI-powered Smart Assistant mode (OpenAI GPT-4o streaming). AI defaults to active on open. System prompt includes live database context (all borrowers with contact details, accounts, institutions, organizations, stats, exchange rates, retention policies). Message roles sanitized to user/assistant only, content capped at 4000 chars, max 20 messages per request.
    -   **AI Portfolio Intelligence** (`/portfolio-intelligence`): Dedicated analytics page that generates comprehensive AI-powered portfolio reports. Includes: executive summary with risk rating, health score gauge (0-100), default predictions with borrower contact details, early warnings with severity levels, collection priority list with clickable phone/email links, sector analysis by loan type, lender analysis with quality ratings, 3-6 month trend forecasts, and strategic recommendations. Powered by `generatePortfolioIntelligence()` in `server/ai.ts`. Access restricted to admin/super_admin/regulator roles.
    -   **Documentation**: Multi-language documentation API for key documents.
    -   **Ghana Mode** (`VITE_COUNTRY_MODE=ghana`): A comprehensive country-specific mode that reconfigures the entire system for Ghana's credit registry. In Ghana mode, the database is seeded exclusively with Ghana data (85 borrowers: 72 individuals / 13 corporates = ~85/15% ratio, 181 credit accounts, 17 institutions, 4 orgs, 8 retention policies, 5 API configurations) — no runtime country filtering is needed. Seed data uses realistic Ghana distributions: Accra/Greater Accra metro ~33% of borrowers, Kumasi ~13%; Agriculture/Cocoa sectors ~21%; 97% GHS currency; interest rates avg 27.3% (range 14-37%); 60% current / 12.5% delinquent / 21.7% closed / 6.5% restructured / 2.7% written-off accounts; 75% on-time payment history. Loan amounts realistic per type: Personal GHS 5K-150K, Mortgage GHS 278K-1.46M, Microfinance GHS 2K-25K, SME/Business GHS 50K-800K. Seed scripts (`seed.ts`, `seed-test-data.ts`, `seedOrganizations()` in `routes.ts`) check `isGhanaMode()` and only create Ghana entities. Storage methods and API routes have no country filtering parameters. Frontend locks country selectors to "Ghana" on credit search, reports, and institution pages. Includes 8 Ghana compliance documents and Bank of Ghana CRB v1.1 standards.
    -   **BoG CRB v1.1 Compliance**: Full Bank of Ghana Credit Reference Bureau v1.1 export compliance:
        -   **Code Catalogs** (`shared/bog-codes.ts`): All BoG appendix codes — facility types (101-129), repayment frequencies (10-21), asset classification (A-E), account status (A-Z), employment types (101-106), security types (A-Q), sector/sub-sector codes, payment history profiles, case types, cheque return reasons, special comments, legal flags, and nature of guarantor. Includes mapping functions: `mapInternalStatusToBog()`, `mapInternalAssetClassToBog()`, `mapDaysInArrearsToPaymentProfile()`, `formatBogDate()`, `formatBogAmount()`, `generateBogFilename()`.
        -   **Credit Report Sections** (`client/src/pages/credit-report.tsx`): Full BoG-compliant credit report with sections: Score Methodology & Validation, Address History, Employment History, Credit Profile Overview (1), Classification by Institution (2), Total Liability Summary (3), Credit Exposure by Product (4), Credit Facility Details (5) with BoG account status codes and NDIA payment history legend, Dishonoured Cheques, Guaranteed Loans, Court Judgments (6), Consent Records (7), Credit Search Inquiry History (8). Payment history uses full NDIA arrears bands (OK, 30, 60, 90, 120, 180, 210, 240, 270, 270+, ND, P, X) with color-coded badges. Account status uses BoG single-letter codes (A, L, G, C, R, W, etc.).
        -   **Schema Fields**: ~35 BoG fields on `borrowers` (nationality, title, ownerOrTenant, employmentTypeCode, monthlyIncome, numberOfDependants, ezwichNumber, sectorIndustryCode, businessTypeCode, turnoverAmount, etc.), ~30 fields on `credit_accounts` (bogAccountStatus, bogAssetClassification, currentBalanceIndicator, facilityTerm, paymentHistoryProfile, legalFlag, 7 overdue bucket columns, creditCollateralIndicator, jointOrSoleAccount, etc.), 6 fields on `court_judgments` (courtLocation, courtType, bogCaseType, caseReason, judgmentCurrency), and a new `dishonoured_cheques` table.
        -   **Export Engine** (`server/bog-export.ts`): Generates pipe-delimited CSV for all 6 BoG file types — CONC (Consumer Credit), BUSC (Business Credit), CONJ (Consumer Judgment), BUSJ (Business Judgment), COND (Consumer Dishonoured Cheque), BUSD (Business Dishonoured Cheque). File naming: `{SRN}-{ReportingDate}-{FileCreatedDate}-1.1-{FileId}-{SeqNum}.csv`. Amounts as whole numbers, dates as YYYYMMDD. Supports correction indicators (0/1/2).
        -   **API Routes**: `GET /api/bog/export/:fileType` (download) and `GET /api/bog/export-preview/:fileType` (preview) — requires admin/regulator/super_admin role.
        -   **UI**: BoG CRB Export page at `/bog-export` with file type selector, reporting date, sequence number, correction indicator, filename preview, download button, and data preview panel.
        -   **Documentation**: `docs/ghana/BoG_CRB_v1.1_Compliance_Mapping.md` with field-by-field mappings, all code catalogs, validation rules, and export workflow docs.
    -   **Enterprise Features**:
        -   **Credit Score Methodology Page** (`/credit-score-methodology`): Transparent scoring model documentation with interactive score simulator, factor weights (Payment History 35%, Credit Utilization 30%, Credit Length 15%, New Inquiries 10%, Account Mix 10%), score band chart (300-850), and reason code glossary.
        -   **Regulatory Dashboard** (`/regulatory-dashboard`): Central bank oversight dashboard with portfolio-wide NPL ratios (DB-level aggregates, not capped queries), sector NPL heatmap, institution compliance panel, data quality metrics (national ID/phone/email coverage), and status breakdown. Access: admin/super_admin/regulator. Endpoint: `GET /api/regulatory/dashboard`.
        -   **Borrower Alerts** (`/borrower-alerts`): Credit file access notification system. Auto-generates alerts when credit reports are pulled. DB table `borrower_alerts` with alert types (credit_inquiry, report_accessed, dispute_update, score_change). Org-scoped access control on per-borrower alert queries. Endpoints: `GET /api/borrower-alerts`, `GET /api/borrower-alerts/:borrowerId`.
        -   **Enhanced Audit Trail** (`/audit`): Hash chain verification UI, CSV export, advanced filters (date range, action type, entity type, user), access log panel, and statistics summary cards.
        -   **Enhanced Batch Upload** (`/batch-upload`): CSV file upload tab alongside JSON/XBRL/BoG, drag-and-drop file picker, client-side validation preview with row-by-row status, upload history, and downloadable CSV/JSON templates.
        -   **Enhanced API Docs** (`/api-docs`): Interactive API explorer (try-it-out), rate limit documentation, authentication flow diagram, code examples (Python/JavaScript/cURL), webhook documentation, and SDKs section.
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

## Server Stability

The dev server uses `bash dev-server.sh` as the workflow command instead of direct `npm run dev`. Key stability measures:

-   **dev-server.sh**: Wrapper script that traps HUP and PIPE signals and runs `node --require ./server/stdout-guard.cjs --import tsx/esm server/index.ts`. The bash process stays alive as PID 1 so the workflow system doesn't escalate to SIGKILL when the stdout pipe breaks.
-   **stdout-guard.cjs**: A Node.js `--require` preload that patches `process.stdout._write` and `process.stderr._write` to silently swallow EIO/EPIPE errors. Without this, the Replit workflow system's stdout pipe breaks periodically, causing cascading EIO errors that crash the Node.js process.
-   **vite.ts**: The Vite dev server's custom error logger no longer calls `process.exit(1)` on errors (previously killed the entire server on any Vite compilation error).
-   **server/index.ts**: EIO/EPIPE/ERR_STREAM_DESTROYED errors are filtered in the uncaught exception handler; stdout/stderr error events are silently handled; console.error calls are wrapped in try/catch. Crash diagnostics written to `/tmp/server-crash.log`.
-   **Error Boundary**: `client/src/components/error-boundary.tsx` wraps the Router in App.tsx for graceful React error display.
-   **Credit Report Preload**: Heavy modules (`credit-report.tsx`, `reports.tsx`) are preloaded 2 seconds after user login via `useEffect` in `AuthenticatedApp` to prevent Vite on-demand compilation memory spikes.
-   **Known Platform Limitation**: The Replit workflow system's stdout pipe breaks after ~30-120 seconds. With the bash wrapper, both processes survive but the workflow may show "not started". The server continues responding on port 5000 — restart the workflow to restore the UI indicator.