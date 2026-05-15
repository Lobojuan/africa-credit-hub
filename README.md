<p align="center">
  <h1 align="center">Universal Credit Hub (UCH v2.8)</h1>
  <p align="center"><strong>Pan-African Credit Registry Infrastructure</strong></p>
  <p align="center">
    Enterprise-grade, multi-tenant SaaS credit data hub serving all 54 African countries,<br/>
    42+ currencies, and 8 languages (EN, FR, PT, AR, SW, ES, zh-CN, zh-TW).
  </p>
</p>

---

## What's New in v2.8

| Area | Change |
|---|---|
| **i18n Complete** | All 120 pages use useTranslation across 8 languages |
| **Loto Notifications** | SMS/USSD/push notification system (Task #286): 6 templates × 5 languages, USSD state machine, retry worker with exponential backoff, consumer Notifications tab, admin delivery dashboard |
| **Command Center** | 11 routed sub-pages: System, Settings, Users, Billing, API Keys, Audit, Data Quality, Retention, Revenue Split, Settlements, Wallets |
| **Loto POS & Devices** | /loto-pos and /loto/admin/devices pages live |
| **Security** | PII_ENCRYPTION_KEY + PII_ENCRYPTION_SALT validated at startup. MASTER_CONTROL_PASSWORD required in production |
| **Migrations** | Sequential journal 0000–0018, no duplicate prefixes |

## Overview

Universal Credit Hub is a centralised credit registry platform purpose-built for the African financial ecosystem. It enables banks, microfinance institutions, fintechs, regulators, and development finance institutions to share, query, and analyse credit data across jurisdictions while maintaining strict data sovereignty, regulatory compliance, and consumer privacy.

The platform is developed by **Universal Credit Hub** in partnership with **Systems In Motion Limited (Bsystems)**.

### Key Differentiators

| Capability | Description |
|---|---|
| **54-Country Coverage** | Full country registry with jurisdiction-specific data retention, local currencies, and national ID formats |
| **Data Sovereignty** | Backend middleware enforces organisation- and country-scoped isolation on every database query |
| **AI Portfolio Intelligence** | GPT-4o / Claude Opus powered risk analysis, concentration alerts, and natural-language querying |
| **Cross-Border Entity Resolution** | Bilateral data-sharing agreements with institutional-level access control |
| **Maker-Checker Compliance** | Four-eye principle on all data modifications with cryptographic audit trails |
| **Consumer Self-Service** | Borrower portal for credit report access, dispute filing, and consent management |
| **Blockchain Audit Anchoring** | Periodic Merkle-root anchoring of SHA-256 hash-chained audit logs |

---

## Core Features

### Credit Registry Operations
- Borrower registration (individual and corporate) with national ID, TIN, and passport validation
- Credit account lifecycle management across 8 loan types
- Credit inquiry tracking with consent management and purpose classification
- Credit score methodology engine with configurable scoring models
- Batch data ingestion via XBRL, CSV, and JSON upload with validation

### Regulatory & Compliance
- Cryptographic audit trails with SHA-256 hash chaining and blockchain anchoring
- Pending approval workflows enforcing the Maker-Checker (four-eye) principle
- Role-based access control (Super Admin, Admin, Regulator, Lender, Viewer)
- Country-level data retention policies with automated purge scheduling
- Bank of Ghana (BoG) regulatory reporting codes and asset classification mapping
- Court judgments and dishonoured cheques registry

### AI & Analytics
- AI Command Center with GPT-4o and Claude Opus integration
- Portfolio intelligence with concentration risk alerts (single-borrower 15%, single-lender 25%, sector 35%)
- Regulatory dashboard with sector NPL analysis
- Real-time dashboard with growth trends, status distribution, and loan-type breakdown
- Platform metrics with MRR/ARR projections, API usage analytics, and subscription tracking

### Security
- TOTP-based multi-factor authentication (RFC 6238)
- WebAuthn/FIDO2 biometric authentication
- Role-based idle session timeouts (15 min for admins, 30 min for standard users)
- Progressive account lockout after failed login attempts
- HMAC-SHA256 signed webhook delivery with dual-header verification
- Helmet security headers, CORS policy, and rate limiting (6 tiers)
- Google OAuth 2.0 integration

### Consumer Portal
- Self-service credit report access with PDF generation
- Online dispute filing and resolution tracking
- Consent record management
- Google OAuth consumer registration

### Integration & API
- RESTful API with OpenAPI-style documentation
- API key management with CRUD operations and usage tracking
- Webhook configuration with event subscriptions and retry logic
- Stripe billing integration with tiered subscription plans
- SMS notifications (Twilio) and email alerts (SMTP)

### Internationalisation
- 8 languages: English, French, Portuguese, Arabic, Swahili, Spanish, Simplified Chinese, Traditional Chinese
- Full RTL (right-to-left) support for Arabic
- Currency formatting for 42+ African and international currencies
- LanguageSwitcher available on all public-facing pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn/ui) |
| **Routing** | Wouter (client-side) |
| **State & Data** | TanStack Query v5, React Hook Form, Zod |
| **Charts** | Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Authentication** | express-session, bcryptjs, OTPAuth (TOTP), @simplewebauthn/server |
| **AI** | OpenAI GPT-4o, Anthropic Claude Opus |
| **Payments** | Stripe |
| **Communications** | Twilio (SMS), Gmail SMTP (Email) |
| **PDF** | PDFKit |
| **Real-time** | WebSocket (ws) |
| **Excel** | ExcelJS, SheetJS (xlsx) |

---

## Project Structure

```
africa-credit-hub/
├── client/
│   └── src/
│       ├── components/      # Reusable UI components (sidebar, charts, forms)
│       ├── pages/           # Route-level page components
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utilities, query client, i18n config
│       └── locales/         # Translation files (en, fr, pt, ar, sw)
├── server/
│   ├── index.ts             # Express server entry point
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database access layer (IStorage interface)
│   ├── seed.ts              # Core database seeding
│   ├── seed-pan-african.ts  # 54-country demo data generation
│   ├── webhook-delivery.ts  # HMAC-signed webhook dispatch
│   └── country-mode.ts      # Country registry and mode configuration
├── shared/
│   └── schema.ts            # Drizzle ORM schema (22+ tables, Zod validators)
├── docs/                    # Technical and compliance documentation
└── drizzle.config.ts        # Database migration configuration
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Neon serverless)

### Environment Variables

Create a `.env` file or configure the following secrets:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection URI |
| `SESSION_SECRET` | Yes | 64-character random string for cookie encryption |
| `OPENAI_API_KEY` | No | OpenAI API key for AI Portfolio Intelligence |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude integration |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio sender phone number |
| `SMTP_USER` | No | Gmail address for SMTP email |
| `SMTP_PASS` | No | Gmail app password |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing |
| `VITE_COUNTRY_MODE` | No | Set to `ghana` for single-country mode; leave blank for pan-African |
| `PRODUCTION_MODE` | No | Set to `true` to skip demo data seeding |

### Installation

```bash
# Install dependencies
npm install

# Push database schema (development only — applies changes directly)
npm run db:push

# Generate and apply migrations (required for production CI/CD)
npm run db:migrate

# Seed demo data (optional — creates admin user and sample data for 54 countries)
npx tsx server/seed.ts

# Start development server
npm run dev
```

The application starts on port **5000** with the Express backend serving both the API and the Vite-bundled frontend.

### Default Admin Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin0987` |
| Role | `super_admin` |

---

## API Rate Limiting

| Tier | Limit | Scope |
|---|---|---|
| Login | 10 requests / minute | Authentication endpoints |
| General API | 200 requests / minute | All authenticated endpoints |
| Write Operations | 60 requests / minute | POST, PATCH, DELETE |
| Batch Operations | 10 requests / minute | Bulk upload endpoints |
| AI Queries | 10 requests / 15 minutes | AI command center |
| Credit Reports | 20 requests / 15 minutes | Report generation |

---

## Deployment

The platform is designed for deployment on Replit with built-in PostgreSQL, TLS, and health checks. For production:

1. Set `PRODUCTION_MODE=true` to disable demo data seeding
2. Set `NODE_ENV=production` for optimised builds
3. Configure all required environment variables
4. The application supports custom domain binding (e.g., `universalcredithub.com`)

---

## Documentation

| Document | Path | Audience |
|---|---|---|
| Architecture & Compliance | `docs/architecture-and-compliance.md` | Central Bank auditors, DPOs |
| API Integration Guide | `docs/API_Integration_Guide.md` | Third-party developers |
| Security & Compliance Report | `docs/Security_Compliance_Report.md` | Security auditors |
| Systems Documentation | `docs/Systems_Documentation.md` | Technical teams |
| User Manual | `docs/Users_Manual.md` | End users |
| Data Dictionary | `docs/Data_Dictionary.md` | Database administrators |
| Deployment Guide | `docs/Deployment_Guide.md` | DevOps engineers |

---

## Changelog

### v2.8 — May 2026
- **Loto Notifications, USSD & SMS Fallback**: Pluggable `MessagingAdapter` (SimulatedAdapter default; Africa's Talking / Twilio stubs active in `PRODUCTION_MODE=true`). Winner SMS, T-24h draw reminders, prize-claim instructions, and merchant inactivity alerts. USSD state machine at `POST /api/loto/ussd/session` compatible with Africa's Talking gateways. Exponential-backoff retry worker (1m/2m/4m/8m/16m). Consumer notification preferences tab on `/loto-fiscal`. Admin delivery dashboard at `/loto/admin/messaging` with per-template and per-country breakdowns and manual retry.
- **DGI Government Admin Dashboard**: `/admin/loto-fiscal` for `dgi_officer` / `tax_authority_admin` / `super_admin` with KPI strip, Côte d'Ivoire regional heatmap, merchant compliance scorecard, fraud queue triage, VAT uplift, webhook outbox CRUD, and audit log view.
- **i18n Expansion**: Platform now ships 8 languages (added Spanish, Simplified Chinese, Traditional Chinese alongside EN/FR/AR/PT/SW). All 13 new translation sections wired; `LanguageSwitcher` present on every public page.
- **Self-Service Cross-Product Consent Toggle**: Borrowers grant/revoke `collateral_credit_view` consent from `/data-sharing` without admin intervention.
- **Score History & Simulator**: Consumer portal adds Recharts AreaChart score history, What-If score simulator, personalised improvement tips, dispute status tracker, inquiry feed, credit freeze toggle, PWA push opt-in, and lender pre-qualification offers.
- **Borrower Record Merge**: Deduplication tool re-pointing all child records and consolidating profile data.

### v2.7 and earlier
See `docs/Systems_Documentation.md` for prior release history.

---

## License

Proprietary. Copyright 2024-2026 Universal Credit Hub. All rights reserved.
