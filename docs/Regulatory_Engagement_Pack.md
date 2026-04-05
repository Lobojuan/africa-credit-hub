# Regulatory Engagement Pack

## Cross-Jurisdictional Central Data Hub & Credit Registry System v2.5

**Prepared for:** Central Bank Supervisors, National Data Protection Authorities & Financial Sector Regulators  
**Prepared by:** Carlson Capital & Systems In Motion Limited  
**Document Version:** 2.5  
**Date:** April 2026  
**Classification:** Confidential

---

## 1. Platform Overview

### 1.1 System Summary

The Pan-African Credit Registry System (CDH v2.5) is a multi-tenant, SaaS credit bureau platform designed to serve all 54 African countries. It provides financial institutions with comprehensive credit reporting, risk intelligence, and regulatory compliance capabilities.

| Attribute | Detail |
|-----------|--------|
| Platform Name | Africa Credit Hub — Cross-Jurisdictional Central Data Hub |
| Version | 2.5 |
| Architecture | Full-stack web application (React/TypeScript frontend, Express/Node.js backend, PostgreSQL database) |
| Deployment | Cloud-hosted SaaS with per-country data sovereignty |
| Languages | English, French, Portuguese, Arabic, Swahili |
| Coverage | 54 African countries with country-specific regulatory mappings |
| Operator | Carlson Capital & Systems In Motion Limited |

### 1.2 Core Capabilities

| Capability | Description |
|------------|-------------|
| Credit Data Management | Full-lifecycle borrower and credit account management with maker-checker approval |
| Credit Reporting | Multi-section credit reports with on-screen preview and PDF download |
| Credit Scoring | ML-enhanced multi-factor scoring model (300–850 scale) |
| Regulatory Exports | Automated generation of regulatory-compliant data files (BoG IFF, BSL formats) |
| AI Intelligence | Credit risk analysis, report summaries, anomaly detection, portfolio intelligence |
| Consumer Portal | Self-service access for data subjects to view reports, file disputes, manage consent |
| Cross-Border Sharing | Bilateral agreement-governed data sharing with PAPSS settlement integration |
| Telco Scoring | Alternative data scoring for unbanked populations using telco/mobile money data |
| Dispute Resolution | End-to-end dispute lifecycle management with SLA tracking |
| Batch Processing | High-volume data ingestion via JSON, CSV, and XBRL/XML formats |

---

## 2. Compliance Evidence Matrix

### 2.1 Security Requirements (SRS v2.0 — NFR-SEC)

| Requirement ID | Description | Status | Implementation Evidence |
|---------------|-------------|--------|------------------------|
| NFR-SEC-01 | Password complexity enforcement | Implemented | Regex validation: uppercase, lowercase, digit, special char, min 8 chars |
| NFR-SEC-02 | Account lockout after failed attempts | Implemented | Progressive lockout: 5 attempts → 30-minute lock; audit logged |
| NFR-SEC-03 | Role-based access control (RBAC) | Implemented | 4 roles + super_admin; server-side middleware enforcement |
| NFR-SEC-04 | Audit trail for all data changes | Implemented | SHA-256 hash-chained audit log with blockchain anchoring |
| NFR-SEC-05 | Data encryption in transit | Implemented | TLS 1.2+ via platform HTTPS; PostgreSQL SSL |
| NFR-SEC-06 | Data encryption at rest | Implemented | bcrypt passwords, SHA-256 API keys, database-level access control |
| NFR-SEC-07 | Input validation and sanitisation | Implemented | Zod schema validation, DOMPurify, parameterised queries |
| NFR-SEC-08 | API rate limiting | Implemented | 6-tier rate limiting (login, API, write, batch, AI, credit report) |
| NFR-SEC-09 | Session idle timeout | Implemented | Role-based timeouts (15–30 min); HTTP 440 on expiry |
| NFR-SEC-10 | Secure session management | Implemented | HttpOnly cookies, SameSite=lax, 8-hour absolute lifetime |

### 2.2 Enterprise Security Enhancements

| Enhancement ID | Feature | Status | Evidence |
|---------------|---------|--------|----------|
| ENT-01 | TOTP Multi-Factor Authentication | Implemented | RFC 6238 TOTP via OTPAuth library; QR code enrollment |
| ENT-02 | Fuzzy Entity Matching | Implemented | pg_trgm trigram similarity (threshold ≥ 0.3) for duplicate detection |
| ENT-03 | Dispute Chatbot | Implemented | AI-guided dispute filing with category selection and auto-submission |
| ENT-04 | OAuth 2.1 Bearer Token Authentication | Implemented | JWT-based client_credentials flow; 1-hour token expiry |
| ENT-05 | Low-Bandwidth Optimizations | Implemented | gzip compression, React.lazy() code splitting |
| ENT-06 | XBRL Upload Support | Implemented | Server-side XML/XBRL parsing for regulatory data submission |
| ENT-07 | Tamper-Evident Audit Hash Chain | Implemented | SHA-256 hash chain with genesis block; integrity verification endpoint |
| ENT-08 | Data Retention Enforcement | Implemented | Automated daily purge engine with jurisdiction-specific policies |
| ENT-09 | Exchange Rate Management | Implemented | Multi-currency support with configurable exchange rates |
| ENT-10 | API Administration | Implemented | CRUD management, connection testing with SSRF protection |
| ENT-11 | Global Search | Implemented | Cross-entity search (borrowers, accounts, institutions) |
| ENT-12 | ID Photo/Document Upload | Implemented | File upload with type/size validation |
| ENT-13 | Investor Demo Environment | Implemented | Isolated demo mode with sample data |
| ENT-14 | Dashboard Visual Analytics | Implemented | Chart.js integration — trends, breakdowns, country distribution |
| ENT-15 | Interactive Demo Tour | Implemented | Guided walkthrough for new users |
| ENT-16 | WebAuthn/FIDO2 Biometric Authentication | Implemented | Passkey registration and authentication |
| ENT-17 | Google OAuth 2.0 Social Login | Implemented | OpenID Connect integration |
| ENT-18 | Real-Time Notifications | Implemented | WebSocket push notifications for approvals, disputes, system events |
| ENT-19 | Excel Export | Implemented | Spreadsheet export for reports and data tables |
| ENT-20 | Multi-Language PDF Reports | Implemented | PDF generation with EN/FR/PT/AR/SW support |
| ENT-21 | Usage Metering & Billing | Implemented | Event-based usage tracking with tiered pricing |

### 2.3 AI-Powered Features

| Feature ID | Capability | Status | Provider Support |
|-----------|------------|--------|-----------------|
| AI-001 | Credit Risk Analysis | Implemented | OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet |
| AI-002 | Report Summary Generation | Implemented | OpenAI / Anthropic |
| AI-003 | Smart Chatbot | Implemented | OpenAI / Anthropic |
| AI-004 | Compliance Report Generation | Implemented | OpenAI / Anthropic |
| AI-005 | Portfolio Intelligence | Implemented | OpenAI / Anthropic |
| AI-006 | Anomaly Detection | Implemented | OpenAI / Anthropic |
| AI-007 | Regulatory Report Generation | Implemented | OpenAI / Anthropic |
| AI-008 | Loan Recommendation | Implemented | OpenAI / Anthropic |
| AI-009 | Cross-Border Risk Assessment | Implemented | OpenAI / Anthropic |

---

## 3. Security Controls Attestation

### 3.1 Authentication Stack

| Layer | Mechanism | Standard | Status |
|-------|-----------|----------|--------|
| Primary | Username + bcrypt-hashed password | OWASP | Active |
| Second Factor | TOTP (RFC 6238) | NIST SP 800-63B | Active |
| Biometric | WebAuthn/FIDO2 passkeys | W3C Web Authentication | Active |
| Social | Google OAuth 2.0 | OpenID Connect | Active |
| External API | SHA-256 API keys + OAuth 2.1 JWT | RFC 6749 / RFC 7519 | Active |

### 3.2 Cryptographic Controls

| Control | Algorithm | Key Length / Rounds | Purpose |
|---------|-----------|-------------------|---------|
| Password hashing | bcrypt | 10 rounds | User credential storage |
| API key hashing | SHA-256 | 256-bit digest | API key verification |
| Audit hash chain | SHA-256 | 256-bit digest | Tamper-evident logging |
| Blockchain anchor | SHA-256 Merkle tree | 256-bit root | External proof of audit state |
| Webhook signing | HMAC-SHA256 | 256-bit | Payload authenticity |
| OAuth tokens | HS256 JWT | Session secret | API bearer authentication |

### 3.3 Network Security

| Control | Implementation |
|---------|---------------|
| Transport encryption | TLS 1.2+ enforced via deployment platform |
| HTTP security headers | Helmet.js: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| CORS | Restricted to configured origins |
| SSRF protection | URL validation blocks private IP ranges and cloud metadata endpoints |
| Rate limiting | 6 tiers: login (10/min), API (200/min), write (60/min), batch (10/min), AI (10/15min), reports (20/15min) |
| Trust proxy | Enabled for accurate IP tracking behind reverse proxy |

### 3.4 Data Protection Controls

| Control | Implementation |
|---------|---------------|
| Data sovereignty | Three-layer middleware isolation (org scope, country filter, sovereignty enforcement) |
| Consent management | Granular per-institution consent with expiry and revocation |
| Data retention | Automated jurisdiction-specific retention enforcement with daily purge |
| Maker-Checker | Four-eye principle for all material data changes; self-approval prevention |
| Input validation | Zod schemas with type, enum, and format validation; parameterised queries |
| Output sanitisation | DOMPurify for user-supplied content; password stripping from API responses |

---

## 4. Data Sovereignty Controls

### 4.1 Isolation Architecture

Every API request passes through a three-stage isolation pipeline:

```
Request → getOrgScope() → getCountryFilter() → enforceDataSovereignty() → Route Handler
```

| Stage | Function | Enforcement |
|-------|----------|-------------|
| Organisation | `getOrgScope()` | Restricts data to caller's organisation |
| Country | `getCountryFilter()` | Restricts data to caller's jurisdiction |
| Sovereignty | `enforceDataSovereignty()` | Injects country constraint into all data queries |
| Write validation | `validateBorrowerCountry()` | Confirms target borrower belongs to caller's country |

### 4.2 Database Isolation

Every core data table includes an `organization_id` foreign key:

| Table | Sovereignty Fields |
|-------|--------------------|
| `borrowers` | `organization_id`, `country` |
| `credit_accounts` | `organization_id` |
| `credit_inquiries` | `organization_id` |
| `audit_logs` | `organization_id` |
| `pending_approvals` | `organization_id` |
| `disputes` | `organization_id` |
| `consent_records` | `organization_id` |
| `court_judgments` | `organization_id` |
| `dishonoured_cheques` | `organization_id` |

### 4.3 Cross-Border Governance

Cross-border data access requires:

1. An active bilateral `data_sharing_agreement` covering both countries
2. The requesting institution explicitly listed as a permitted participant
3. `requireCrossBorderAccess()` middleware verification on every request
4. `CROSS_BORDER_ACCESS` audit log entry with full attribution

---

## 5. Regulatory Alignment

### 5.1 Ghana — Bank of Ghana (BoG) CRB

| Requirement | CDH Implementation | Evidence |
|-------------|-------------------|----------|
| Credit Reporting Act 726 | Full compliance — borrower registration, credit accounts, inquiries, disputes | BoG IFF file generation (6 types) |
| Data Protection Act 843 | Consent management, data subject rights, breach notification procedures | `consent_records` table, consumer portal, dispute mechanism |
| BoG CRB Operational Guidelines | Facility type codes, asset classifications, reporting formats | `bog-codes.ts` with complete BoG code mappings |
| Ghana Card Integration | National ID validation and storage | `nationalId` field with GHA format validation |
| GHS Currency Enforcement | Default currency for Ghana-mode operations | `getDefaultCurrencyCode()` returns "GHS" |

### 5.2 South Africa — POPIA

| POPIA Principle | CDH Implementation |
|-----------------|-------------------|
| Accountability | SHA-256 hash-chained audit trail; DPO appointment |
| Processing limitation | Purpose-specific consent; country-scoped data access |
| Purpose specification | Consent records document processing purpose |
| Information quality | Dispute mechanism for data correction; Maker-Checker for accuracy |
| Openness | Consumer portal provides transparency into credit data |
| Security safeguards | Multi-layer authentication, encryption, RBAC |
| Data subject participation | Consumer portal with access, rectification, and objection rights |

### 5.3 Nigeria — NDPA 2023

| NDPA Requirement | CDH Implementation |
|------------------|-------------------|
| Consent-based processing | `consent_records` with granular institution/purpose tracking |
| Data localisation | Organisation-scoped queries; country filter enforcement |
| DPO appointment | Dedicated DPO role with regulatory liaison responsibility |
| Breach notification | 72-hour notification procedure to NDPC |
| Data subject rights | Consumer portal with full rights implementation |

### 5.4 Continental — AU Malabo Convention

| Convention Article | CDH Implementation |
|-------------------|-------------------|
| Art. 13 — Consent | Granular consent management per institution and purpose |
| Art. 14 — Purpose limitation | Consent records enforce purpose specification |
| Art. 16 — Data security | Multi-layer encryption, RBAC, tamper-evident audit |
| Art. 17 — Cross-border transfers | Bilateral agreements with institutional authorisation |
| Art. 24 — Breach notification | Defined notification procedures with authority and data subject timelines |

---

## 6. Go-Live Readiness Checklist

### 6.1 Technical Readiness

| Item | Status | Evidence |
|------|--------|----------|
| Application deployed and accessible | Ready | Cloud deployment with SSL/TLS |
| Database provisioned with schema | Ready | PostgreSQL with Drizzle ORM schema sync |
| Authentication configured (password + MFA) | Ready | bcrypt + TOTP + WebAuthn |
| RBAC roles defined and enforced | Ready | 4 roles + super_admin with server-side middleware |
| Audit logging active with hash chain | Ready | SHA-256 chain from genesis; integrity verification endpoint |
| Rate limiting configured | Ready | 6-tier rate limiting active |
| Session management with idle timeout | Ready | Role-based timeouts (15–30 min) |
| API key management operational | Ready | SHA-256 hashed keys with permission levels |
| Webhook delivery system active | Ready | HMAC-SHA256 signed payloads with retry logic |
| Batch upload processing operational | Ready | JSON/CSV/XBRL with queue-based processing |

### 6.2 Compliance Readiness

| Item | Status | Evidence |
|------|--------|----------|
| Data sovereignty controls active | Ready | Three-layer middleware isolation |
| Consent management operational | Ready | `consent_records` table with verification flow |
| Dispute resolution workflow configured | Ready | End-to-end lifecycle with SLA tracking |
| Data retention policies defined | Ready | `retention_policies` table with daily enforcement |
| Maker-Checker workflow active | Ready | Four-eye principle with self-approval prevention |
| Consumer portal accessible | Ready | Self-service registration, reports, disputes |
| Breach notification procedures documented | Ready | 72-hour authority notification; 7-day data subject notification |
| DPO appointed and documented | Ready | Contact details and responsibilities defined |

### 6.3 Operational Readiness

| Item | Status | Evidence |
|------|--------|----------|
| Admin user accounts created | Ready | Super admin and institution admin accounts provisioned |
| Institutional onboarding procedures documented | Ready | Credit Reporting Procedures Manual |
| User training materials available | Ready | Users Manual (24 sections), interactive demo tour |
| API documentation published | Ready | API Integration Guide with examples |
| SLA agreement template available | Ready | Ghana SLA Agreement template |
| Disaster recovery plan documented | Ready | DR/BC plan with RTO/RPO targets |
| Change management process defined | Ready | Formal change control with categorisation and approval |
| Security policy documented | Ready | Information Security Policy covering all domains |

### 6.4 Testing Evidence

| Test Category | Status | Evidence |
|---------------|--------|----------|
| Unit / Integration tests | Complete | Zod schema validation, API endpoint testing |
| UAT test cases | Complete | 187 test cases across 22 modules (UAT Test Document) |
| End-to-end testing | Complete | Ghana E2E Test Plan with full coverage |
| Security testing | Complete | Penetration Test Readiness Report |
| Performance baseline | Complete | API usage analytics with response time percentiles |
| SRS traceability | Complete | 57 SRS requirements mapped to implementation |

---

## 7. System Architecture Summary

### 7.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite | Single-page application with responsive design |
| UI Components | Shadcn/UI + Tailwind CSS | Consistent design system |
| State Management | TanStack Query v5 | Server state caching and synchronisation |
| Backend | Express.js (Node.js) | REST API server |
| Database | PostgreSQL 16 | Relational data storage |
| ORM | Drizzle ORM | Type-safe database access |
| Authentication | express-session + bcryptjs + OTPAuth | Multi-factor authentication |
| PDF Generation | PDFKit | Credit report and document PDF output |
| AI Integration | OpenAI + Anthropic SDKs | AI-powered analysis features |
| Real-Time | WebSocket (ws) | Push notifications |
| Email | Nodemailer | Transactional email delivery |
| SMS | Twilio / Africa's Talking | OTP and notification SMS |

### 7.2 Deployment Architecture

| Component | Configuration |
|-----------|---------------|
| Application server | Node.js Express on port 5000 |
| Database | PostgreSQL with SSL/TLS |
| Static assets | Vite-built React SPA served via Express |
| HTTPS | Platform-provided TLS termination |
| Session storage | In-memory with periodic cleanup |
| File storage | Server filesystem for uploads and exports |

---

## 8. Contact Information

| Role | Name | Organisation |
|------|------|-------------|
| Platform Operator | Uffe Jon Carlson | Carlson Capital |
| Technical Lead | Thomas Baafi | Systems In Motion Limited |
| Data Protection Officer | DPO Office | Carlson Capital & Systems In Motion Limited |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | CDH-REP-2026-001 |
| Version | 2.5 |
| Classification | Confidential |
| Authors | Uffe Jon Carlson, Thomas Baafi |
| Organisation | Carlson Capital & Systems In Motion Limited |
| Last Updated | April 2026 |
