# Africa Credit Hub v2.6 — Competitive Intelligence Update

## Overview
This project is a web-based Pan-African Credit Registry System (Africa Credit Hub v2.5) designed to centralize credit information, manage borrower records, and support credit risk assessment for financial institutions across Africa. It handles multiple African currencies plus USD/EUR/GBP, enforces jurisdiction-specific data retention, ensures regulatory compliance, and facilitates cross-border entity resolution. The system aims to bolster financial stability and responsible lending through robust security, adherence to regulatory workflows, fault tolerance, multi-tenant SaaS capabilities, AI-powered portfolio intelligence, blockchain audit anchoring, and a consumer self-service portal. The system is designed for scalability, supporting over 10 million records and offers transaction-based monetization with a two-tier revenue split and a comprehensive settlement and payout system.

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
-   **Internationalization**: Supports 8 languages — English (en), French (fr), Portuguese (pt), Arabic (ar, RTL), Swahili (sw), Spanish (es), Simplified Chinese (zh-CN), and Traditional Chinese (zh-TW). Translation files: `client/src/lib/i18n.ts` (EN/FR), `i18n-pt.ts`, `i18n-ar.ts`, `i18n-sw.ts`, `i18n-es.ts`, `i18n-zh-cn.ts`, `i18n-zh-tw.ts`. Training center quizzes also available in all 8 languages via `training-translations.ts`. Language switcher shows ES, ZH-S, ZH-T in addition to the original 5.
-   **Theming**: Dark/light theme with two visual style palettes (Pan-African teal/gold and Scandinavian blue/slate).
-   **Responsiveness**: Mobile-first design with adaptive layouts and role-filtered navigation.
-   **Interactive Elements**: Dashboards with drill-down capabilities, notifications, charts, an interactive SVG Africa map, and a circular SVG credit score gauge.

**Technical Implementations & Feature Specifications:**
-   **Backend**: Express.js API server.
-   **Database**: PostgreSQL hosted on Neon, managed with Drizzle ORM.
-   **Authentication**: Session-based with MFA (TOTP), strong password policies, biometric (WebAuthn) support, Google OAuth, Microsoft/Azure AD OAuth, and SAML 2.0 SSO.
-   **Core Capabilities**: Credit management, consumer/business segmentation, algorithmic credit scoring (300-850) with explainable AI, maker-checker workflow, dispute management, and regulatory compliance (consent, audit trails, 54 African jurisdictions).
-   **BOG Consent Layer (v2.6)**: Full borrower-initiated consent flow compliant with Ghana Data Protection Act. `POST /api/consent-requests` sends SMS+email to data subject with a one-time token link; active loan relationship auto-approves via loan exemption (BOG regulation). Borrower responds at public `/consent/respond?token=...` page (no auth required). Status polled every 5s in `ConsentGateModal`. `POST /api/credit-reports/generate` gated: requires `borrowerResponse=approved` OR `loanExemption=true`. Token expires in 24h. New `consent_records` columns: `consent_token`, `token_expires_at`, `borrower_response`, `loan_exemption`, `exemption_basis`, `notification_sent_at/phone/email`, `responded_at`, `requested_by`.
-   **Institutional Management**: Self-registration, approval, billing, and fee management for data providers.
-   **Reporting**: Regulatory analytics, CSV/PDF export, bulk data upload (XBRL/XML, IFF), structured search, and AI-Enhanced credit reports (ML score, dual-AI risk analysis, AI narrative with clear visual separation from verified bureau data).
-   **Security & Compliance**: Role-Based Access Control (RBAC), external REST API with OAuth 2.1, fuzzy entity matching, tamper-evident audit logs (blockchain-anchored), data sovereignty enforcement, and HMAC-SHA256 webhook signatures.
-   **Financials**: Multi-currency conversion with live rate fetching, multi-tenant SaaS, API rate limiting, transaction-based monetization, two-tier revenue split, settlement & payout system, and real-time wallet/prepaid billing.
-   **AI & Advanced Features**: Credit Registry Assistant chatbot (Multi-Model AI Ensemble), AI Portfolio Intelligence, AI Command Center (6 tools), Open Banking profile management, configurable Decision Rules Engine, ESG Scoring for corporate borrowers, and AI Report Insights (section-by-section educational explanations of each credit report — credit score, account summary, payment behavior, liability exposure, public records, overall guidance — toggled per borrower via "AI Insights" button).
-   **Onboarding**: Multi-step signup with fraud prevention for institutions (BRN validation, super_admin approval), and enhanced Consumer Portal registration.
-   **Cross-Border**: Smart Africa Telecommunications Alliance (SATA) data sharing, Pan-African Payment and Settlement System (PAPSS) tracking.
-   **Alternative Data**: Integration of mobile money, utility, and telco data for credit scoring; full Telco Lending Lifecycle management with idempotency support.
-   **Consumer Portal**: Authenticated self-service portal with dual-channel verification, rate-limited credit score lookups, interactive dispute filing dialog (type, description, account ref → 5-business-day SLA), credit report PDF download button, and Credit Monitoring Alerts panel (real-time alerts for inquiry, score change, new account, delinquency events with configurable email/SMS delivery preferences).
-   **Portfolio Trigger Alerts** (v2.6): Institutional watchlist — lenders subscribe to borrowers (`POST /api/portfolio-triggers`); events fired on score drop, new inquiry, delinquency, judgment, default, account changes. Unacknowledged event counter with acknowledge action. Full CRUD for subscriptions. Page at `/portfolio-triggers` in the Intelligence section of the sidebar.
-   **Soft Pull / Pre-Qualification** (v2.6): `POST /api/credit-inquiries/soft-pull` — runs score calculation, determines APPROVE/MANUAL_REVIEW/DECLINE recommendation, checks delinquencies + hard inquiry velocity, returns result without affecting borrower's score or creating a hard inquiry visible to other lenders. Stored as `isSoftPull=true` in `credit_inquiries`. Accessible via "Soft Pull" button in the Credit Inquiries section of each borrower detail page.
-   **24-Month Trended Data** (v2.6): `GET /api/credit-accounts/:id/trends` returns payment period data with on_time/late/missed breakdown; `GET /api/borrowers/:id/trend-summary` returns balance/score trend across all accounts. Displayed as an interactive bar chart (recharts) in the expanded credit account panel on the borrower detail page — toggleable with "Show Trend" button.
-   **DB Tables** (v2.6): `portfolio_trigger_subscriptions`, `portfolio_trigger_events`, `consumer_monitoring_prefs`, `consumer_monitoring_alerts`. `credit_inquiries` now has `is_soft_pull` (boolean) and `soft_pull_result` (jsonb) columns. Migration in `server/migrate-new-tables.ts`, now called at the very start of `server/index.ts` before seeding.
-   **Loan Origination**: Full loan lifecycle management (`/loan-origination`) — submit, review, approve/reject with maker-checker, disburse, and amortization schedule generator. Supports 7 loan types, 6 currencies, customizable terms.
-   **Collateral Registry**: Pan-African pledged-asset registry (`/collateral-registry`) — register, track, and release collateral with type, value, location, document reference, and status management.
-   **Institution Analytics**: Usage metrics dashboard (`/institution-analytics`) — daily event chart, breakdown by event type, and billing records view.
-   **White-Label Branding**: Per-institution customization (`/institution-branding`) — primary/secondary colors, logo URL, tagline, support contact, footer text, and custom domain with live portal preview.
-   **System Hardening**: Real-time fraud detection, enhanced API developer portal, security headers, PII encryption at rest (AES-256-GCM), data subject erasure, password history, login anomaly detection, configurable platform identity, real-time WebSocket notifications, PWA, system status/monitoring, maintenance mode, platform metrics dashboard, and registry alert settings (alert email, Slack webhook, check interval configurable from UI and stored in DB via `registry_health_config` table).
-   **Data Management**: Centralized Data Management page (`/data-management`) with Export Center (full portability export with optional AES-256 encryption + SHA-256 integrity hashing), Retention Policies CRUD (with configurable enforcement action: flag/archive/delete), Retention Policy Scanner (country-scoped for admin, global for super_admin), Erasure Requests (cascade erasure deleting all borrower-related data), and Export History audit trail. Rate-limited exports (5/hr admin, 1/day consumer). Consumer self-export via "Download My Data" button in consumer portal. Credit Score History table tracks score changes over time. Module: `server/export-service.ts`. Migration: `server/migrate-new-tables.ts`.
-   **Performance**: Database query parallelization, SQL-based aggregation, integrity verification caching, and request timeout middleware.
-   **Reliability**: Email/SMS with 3-attempt retry, exponential backoff, provider failover, and outbound rate limiting.

-   **Investor Landing — Competitive Intelligence Section** (`id="vs-global"`): Full research-backed competitive teardown section on `/investor`. Includes: 4-card industry snapshot (Experian $7.5B revenue, TransUnion 8/54 countries, Equifax 0/54 countries, Experian 1.3/5 SiteJabber), 14-row head-to-head feature comparison table (Africa Credit Hub vs Experian vs TransUnion vs Equifax), 4 "Why We Win" differentiator cards, 3 competitor deep-dive profiles (7 named weaknesses each), $191B global market opportunity callout block. Data sources: Experian FY2025 Annual Report, TransUnion 2024 Investor Day, Equifax 10-K 2024, GSMA 2025, World Bank Findex 2024, SiteJabber, CFPB.

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
-   **GitHub**: @octokit/rest via Replit GitHub connector (repo management for client deployments)

## Pan-African Collateral Registry (v2.6, Task #131)
PPSR-inspired (AU/NZ model) pledged-asset registry for all 54 African countries.
-   **Lender Portal**: `/collateral-registry` — 3-step financing statement wizard (Grantor → Collateral → Security Interest), PMSI (Purchase Money Security Interest) super-priority flag with 10-day timing warning, cross-institution lien search by asset identifier, priority rank badges, text certificate download.
-   **Registry Authority Portal**: `/registry-authority-portal` — Pending Queue (approve/reject), Active Liens Ledger, Regulatory Reports tab. Login redirect auto-triggers for `registry_authority` org type.
-   **PPSR fields**: `isPmsi`, `securityInterestType` (loan_security/retention_of_title/lease/consignment/blanket_lien), `collateralClass`, `financingDuration` (7yr/25yr/custom/perpetual), `debtorType`, `verificationCode`.
-   **54-country config**: `registry_country_config` table seeded at startup with all African countries, their authority names, legal regimes, and currencies.
-   **Double pledging allowed**: Cross-institution search shows all liens with priority rank visible to lenders.
-   **Same-country search only**: Lien search scoped to the lender's country.
-   **Admin provisioning**: CollateralRegistrySetupPanel in platform-master-control.tsx lists all 54 countries, allows super admin to create Registry Authority orgs.
-   **Schema note**: `collateral_items.borrower_id` is nullable (registry submissions don't need a credit bureau borrower UUID; grantor national ID stored in `document_reference`).

## Platform Master Control Center
Hidden route at `/platform-control-9x7k` (not in sidebar/nav). Protected by `MASTER_CONTROL_PASSWORD` env secret. Session cookie `pc_session` (no maxAge, in-memory). Features:
-   **Client Deployments**: Register/edit/delete deployment instances with full config (branding, fees, dates, GitHub repo, heartbeat URL)
-   **Revenue & Billing**: Platform-wide revenue analytics across all deployments
-   **Deployment Health Monitor**: Heartbeat polling of all registered client instances via public `/api/heartbeat` endpoint
-   **GitHub Repository Management**: Create private repos, link repos to deployments, view repo status/commits/branches
-   **Configuration Matrix**: Side-by-side comparison of all deployment configs
-   **Config Generator**: Generate `.env` configs for new client deployments
-   **Update Tracker**: Track deployment update history
-   **Auto-detect Current Instance**: One-click self-registration with live DB stats
