# Africa Credit Hub — Compressed

## Overview
This project is a web-based Pan-African Credit Registry System (Africa Credit Hub) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP and major global currencies, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal. The system is designed for scalability, supporting over 10 million records and offers transaction-based monetization with a two-tier revenue split and a comprehensive settlement and payout system. It includes an investor-focused competitive intelligence section highlighting its market position and advantages.

## User Preferences
I prefer clear and concise communication.
I value iterative development with frequent, small updates.
Please ask for confirmation before implementing major architectural changes or significant feature additions.
I prefer detailed explanations for complex logic or design decisions.
Do not make changes to the `docs/` folder.

## Platform Access & Credentials

### Product Access Control
Users have a per-user `allowedProducts` field (`text[]` in the `users` table). When set, only those product workspaces (credit/collateral/loto) appear in the sidebar and product switcher for that user. `null` = unrestricted (all platforms visible).

### Login Accounts
| Username | Password | Access | Purpose |
|---|---|---|---|
| `admin` | `SEED_ADMIN_PASSWORD` env var | Credit Bureau only | Shared client / demo login |
| `owner_admin` | `OWNER_ADMIN_PASSWORD` env var | All 3 platforms | Private owner super-admin |
| `platform_admin` | `SEED_ADMIN_PASSWORD` env var | All 3 platforms | Platform CTO account |
| `johndoe` | `SecuredCreditor2026!` | Credit + Collateral | Demo secured creditor |
| `registry_admin` | `TestPass2026!` | Credit | Demo registry authority |
| `demo_admin` | `TestPass2026!` | All 3 platforms | **Platform Owner** (top-of-hierarchy role) |

> The `admin` restriction to credit-only is applied idempotently on every startup via `ensureDemoUsers()` in `server/seed.ts`. `owner_admin` is created if `OWNER_ADMIN_PASSWORD` is set and the account doesn't exist yet.

## Role Hierarchy

```
platform_owner  → full access across CDH, Telco, Loto; sees all users including super_admin
super_admin     → full access; sees all users except platform_owner; can be deleted by platform_owner
admin           → org-scoped; can create/edit non-privileged users
regulator / lender / viewer / dgi_officer / tax_authority_admin  → domain-scoped leaf roles
```

Key access rules enforced at both API and UI layers:
- `platform_owner` accounts **can never be deleted** (not even by other platform_owners)
- Only `platform_owner` can create/edit/delete `super_admin` accounts
- Only `platform_owner` can assign the `platform_owner` role
- `super_admin` users cannot see or modify `platform_owner` accounts
- `isPlatformPrivileged(role)` helper (exported from `server/routes/middleware.ts`) returns true for both `platform_owner` and `super_admin`

## System Architecture
The system employs a modern full-stack architecture built for scalability and compliance, featuring a React/TypeScript frontend with Tailwind CSS and shadcn/ui, and an Express.js API server with a PostgreSQL database managed by Drizzle ORM.

**UI/UX Decisions:**
-   **Frontend**: React with TypeScript and Vite, styled using Tailwind CSS and shadcn/ui.
-   **Internationalization**: Supports 8 languages (English, French, Portuguese, Arabic, Swahili, Spanish, Simplified Chinese, Traditional Chinese).
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate).
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down capabilities, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA (TOTP), strong password policies, biometric (WebAuthn), Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO.
-   **Core Capabilities**: Credit management, consumer/business segmentation, algorithmic credit scoring (300-850) with explainable AI, maker-checker workflow, dispute management, and regulatory compliance across 54 African jurisdictions.
-   **BOG Consent Layer**: Implements a borrower-initiated consent flow compliant with Ghana Data Protection Act, gating access to credit reports unless approved by the borrower or via loan exemption.
-   **Institutional Management**: Features for self-registration, approval, billing, and fee management for data providers.
-   **Reporting**: Regulatory analytics, CSV/PDF export, bulk data upload (XBRL/XML, IFF), structured search, and AI-Enhanced credit reports with dual-AI risk analysis and AI narrative.
-   **Security & Compliance**: Role-Based Access Control (RBAC), external REST API with OAuth 2.1, fuzzy entity matching, blockchain-anchored audit logs, data sovereignty enforcement, and HMAC-SHA256 webhook signatures.
-   **Financials**: Multi-currency conversion, multi-tenant SaaS, API rate limiting, transaction-based monetization, two-tier revenue split, settlement & payout system, and real-time wallet/prepaid billing.
-   **AI & Advanced Features**: Credit Registry Assistant chatbot (Multi-Model AI Ensemble), AI Portfolio Intelligence, AI Command Center, Open Banking profile management, configurable Decision Rules Engine, ESG Scoring, and AI Report Insights for educational explanations.
-   **Onboarding**: Multi-step signup with fraud prevention for institutions and enhanced Consumer Portal registration.
-   **Cross-Border**: Supports Smart Africa Telecommunications Alliance (SATA) data sharing and Pan-African Payment and Settlement System (PAPSS) tracking.
-   **Alternative Data**: Integration of mobile money, utility, and telco data for credit scoring; full Telco Lending Lifecycle management.
-   **Consumer Portal**: Authenticated self-service portal with dual-channel verification, rate-limited credit score lookups, interactive dispute filing, credit report PDF download, and Credit Monitoring Alerts. v2.6 adds: Score History chart (recharts AreaChart), Score Simulator/What-If tool, Personalised Improvement Tips, Dispute Status Tracker, Who Accessed My Data (Inquiry Feed), Credit Freeze Toggle (persisted in DB), PWA Push Notification opt-in, and Lender Pre-qualification Offers based on credit score.
-   **Portfolio Trigger Alerts**: Institutional watchlist for lenders to subscribe to borrower events like score drops, new inquiries, and delinquencies.
-   **Soft Pull / Pre-Qualification**: Allows lenders to run score calculations and determine loan recommendations without affecting the borrower's score or creating visible hard inquiries.
-   **24-Month Trended Data**: Provides historical payment period data and balance/score trends displayed as interactive charts.
-   **One-Click Demo Login + Guided Tour**: Login page exposes 3 quick-launch demo buttons (Secured Creditor, Registry Authority, Super Admin) that auto-fill and submit credentials. After login, a `react-joyride` v3 floating-tooltip tour walks the user across the relevant pages step-by-step (e.g. /dashboard → /collateral-registry → /search for the lender role). Tour state lives in `sessionStorage["demo_tour_state"]` and is cleared on logout. Implementation: `client/src/components/demo-tour.tsx` (mounted in `AuthenticatedApp` in `App.tsx`).
-   **Borrower Record Merge**: A deduplication tool for merging duplicate borrower records, re-pointing all associated child records/foreign key relationships, and consolidating profile information.
-   **Loan Origination**: Full loan lifecycle management including submission, review, approval/rejection with maker-checker, disbursement, and amortization schedule generation for various loan types and currencies.
-   **Collateral Registry**: A PPSR-inspired Pan-African pledged-asset registry for registering, tracking, and releasing collateral across 54 African countries, supporting PMSI, cross-institution lien searches, priority ranking, and a lender/registry authority portal. Includes a live certificate preview dialog before PDF download and direct email/SMS sharing of verification links.
-   **Institution Analytics**: Usage metrics dashboard providing daily event charts, event type breakdowns, and billing records.
-   **White-Label Branding**: Per-institution customization of branding elements like colors, logo, tagline, support contact, footer text, and custom domains.
-   **System Hardening**: Real-time fraud detection, enhanced API developer portal, security headers, PII encryption at rest, data subject erasure, password history, login anomaly detection, configurable platform identity, real-time WebSocket notifications, PWA, system status/monitoring, platform metrics dashboard, and platform monitoring.
-   **Data Management**: Centralized page with Export Center (full portability, optional encryption), configurable Retention Policies (CRUD with enforcement), Retention Policy Scanner, Erasure Requests, and Export History audit trail.
-   **Performance**: Database query parallelization, SQL-based aggregation, integrity verification caching, and request timeout middleware.
-   **Reliability**: Email/SMS with retry mechanisms, exponential backoff, provider failover, and outbound rate limiting.
-   **Platform Master Control Center**: A hidden administrative route for managing client deployments, revenue, billing, deployment health, GitHub repository management, configuration, and update tracking.
-   **Competitive Intelligence Section**: An "Investor Landing" page section detailing competitive analysis, market opportunity, and differentiators against global credit bureaus.
-   **Loto Notifications, USSD & SMS Fallback**: Outbound messaging pipeline for the Loto Fiscal pilot. A pluggable `MessagingAdapter` (Simulated default + Africa's Talking / Twilio stubs that only execute when `PRODUCTION_MODE=true`) sends winner notifications, T-24h draw reminders, prize-claim instructions, and merchant inactivity alerts. Templates are i18n-keyed across 5 African languages (en/fr/pt/ar/sw) with a 160-character SMS cap and English fallback for over-length localised strings. A pure-reducer USSD state machine drives a `/api/loto/ussd/session` endpoint compatible with Africa's Talking gateways (auth-bypassed and CSRF-exempt; optional `LOTO_USSD_TOKEN` header). Every outbound message is persisted in `loto_outbound_messages` with status/attempts/last-error for audit, and a queue worker retries failed sends with 1m/2m/4m/8m/16m exponential backoff. Consumers manage their phone, language, and reminder opt-out from the new "Notifications" tab on `/loto-fiscal`; admins/regulators audit delivery at `/loto/admin/messaging` with breakdowns by purpose and country and a manual retry action. Winner SMS bypasses the consumer opt-out and is audit-logged separately (`purpose='winner_notification'` vs `'prize_claim'`) from existing payout dispatch entries.
-   **DGI Government Admin Dashboard (Loto Fiscal)**: Gated route `/admin/loto-fiscal` for roles `dgi_officer`, `tax_authority_admin`, `super_admin` with strict country isolation. Backend at `server/routes/loto-admin.ts` (mounted on `/api/loto/admin`) provides KPI strip (receipts/VAT collected/tickets/payouts/fraud queue), Côte d'Ivoire 14-district regional heatmap, deterministic merchant compliance scorecard (`server/loto-fraud-rules.ts` — five-rule fraud engine + scoring 0-100), fraud detection queue with triage actions (dismiss/escalate/resolve, escalate fires `merchant.flagged` webhook), VAT uplift attribution, CSV/PDF exports for kpi/compliance/fraud/heatmap views, webhook outbox subscription CRUD (events: `merchant.flagged`, `receipt.verified`, `draw.closed`), and Loto-scoped audit log view. Frontend page `client/src/pages/loto-admin-dashboard.tsx` renders 5 tabs (overview/compliance/fraud/webhooks/audit) with EN/FR strings.

-   **Self-Service Cross-Product Consent Toggle**: Borrowers can grant or revoke the `collateral_credit_view` consent directly from the `/data-sharing` page via a Switch toggle card. The toggle calls `POST /api/cross-product/consents/collateral-credit-view/grant` (creates consent with both userId and borrowerId for proper gateway + ownership resolution, writes audit log) and the existing revoke endpoint. Ownership is proved by email matching (user.email = borrower.email). The card is disabled with an informative message when no borrower profile is linked.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, react-i18next, Recharts
-   **Backend Libraries**: Express.js, bcryptjs, express-session, Drizzle ORM, compression, jsonwebtoken, otpauth, pdfkit, ws, @simplewebauthn/server
-   **Payments**: Stripe
-   **Email**: SendGrid, Gmail SMTP
-   **SMS**: Twilio, Africa's Talking (Loto Fiscal messaging uses an adapter pattern; default is a simulated adapter that writes to `loto_outbound_messages`. AT/Twilio adapters are stubbed and selected per country payout provider. PII-masking, exponential-backoff retry, identity-safe winner fallback, and a USSD aggregator endpoint at `POST /api/loto/ussd/session` are included.)
-   **AI / LLM Providers**: Anthropic (Claude Opus), OpenAI (GPT-4o)
-   **Excel Export/Import**: `exceljs`, `xlsx` (SheetJS)
-   **Third-Party APIs**: open.er-api.com (exchange rates), DiceBear (avatars)
-   **GitHub**: @octokit/rest via Replit GitHub connector