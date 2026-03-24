# Architecture & Compliance Technical Reference

**Africa Credit Hub — CDH v2.1**
**Classification: Confidential — For Regulatory Auditors and Data Protection Officers**

**Prepared by:** Carlson Capital & Systems In Motion Limited
**Version:** 2.1 | **Date:** March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Sovereignty & Multi-Tenancy](#2-data-sovereignty--multi-tenancy)
3. [Cryptographic Audit Trails](#3-cryptographic-audit-trails)
4. [Maker-Checker (Four-Eye) Principle](#4-maker-checker-four-eye-principle)
5. [Security & Authentication](#5-security--authentication)
6. [Data Retention & Purge Policies](#6-data-retention--purge-policies)
7. [Cross-Border Data Sharing](#7-cross-border-data-sharing)
8. [Regulatory Alignment Matrix](#8-regulatory-alignment-matrix)

---

## 1. Executive Summary

Africa Credit Hub (CDH v2.1) is a multi-tenant, SaaS credit registry platform engineered to serve all 54 African countries. This document details the architectural decisions and technical controls implemented to satisfy the requirements of Central Bank supervisors, National Data Protection Authorities, and financial sector regulators across the continent.

The platform is designed with the following compliance objectives:

- **Data sovereignty** — No institution or user may access borrower data outside their authorised jurisdiction and organisation
- **Tamper-proof audit trails** — Every data mutation is recorded in an append-only, SHA-256 hash-chained audit log with optional blockchain anchoring
- **Segregation of duties** — All material data modifications require independent approval via the Maker-Checker workflow
- **Defence in depth** — Multi-layered authentication including TOTP MFA, WebAuthn biometrics, progressive lockout, and role-based session management

---

## 2. Data Sovereignty & Multi-Tenancy

### 2.1 Architecture

The platform implements data sovereignty at the middleware layer, ensuring enforcement cannot be bypassed by application logic.

Every authenticated API request passes through a pipeline of three isolation functions before reaching the route handler:

```
Request → getOrgScope() → getCountryFilter() → enforceDataSovereignty() → Route Handler
```

**`getOrgScope(req)`**
Extracts the caller's `organizationId` from the session. For `super_admin` users, an optional `orgId` query parameter allows scoped viewing. For all other roles, the scope is locked to the user's assigned organisation.

**`getCountryFilter(req)`**
Determines the country-level data boundary. For `super_admin` users operating in global mode, no country filter is applied. For all other users, the filter is derived from:
1. The session's `viewingCountry` property (if set)
2. The user's `userCountry` property
3. The server's configured country mode (fallback)

**`enforceDataSovereignty(req, res, next)`**
Middleware applied to all borrower and credit data endpoints (GET, POST, PATCH). It verifies authentication, checks role-based bypass eligibility, and injects the sovereign country constraint into the request context. Non-super-admin users are hard-locked to their jurisdiction.

**`validateBorrowerCountry(borrowerId, req)`**
Write-path validation that confirms the target borrower belongs to the caller's authorised country before any modification is persisted. This prevents cross-jurisdiction data corruption even if a valid `borrowerId` is supplied.

### 2.2 Database-Level Isolation

Every core table includes an `organization_id` foreign key referencing the `organizations` table:

| Table | Isolation Column |
|---|---|
| `borrowers` | `organization_id` |
| `credit_accounts` | `organization_id` |
| `credit_inquiries` | `organization_id` |
| `audit_logs` | `organization_id` |
| `pending_approvals` | `organization_id` |
| `disputes` | `organization_id` |
| `consent_records` | `organization_id` |
| `court_judgments` | `organization_id` |
| `dishonoured_cheques` | `organization_id` |

The `organizations` table itself carries a `country` field, establishing the jurisdictional binding:

```sql
CREATE TABLE organizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type organization_type NOT NULL DEFAULT 'other',
  status organization_status NOT NULL DEFAULT 'pending',
  country TEXT,
  ...
);
```

### 2.3 Compliance Mapping

| Regulation | Requirement | CDH Implementation |
|---|---|---|
| **POPIA (South Africa)** | Processing limitation and purpose specification | `getCountryFilter()` restricts data access to South African records; `creditInquiries.purpose` field enforces purpose classification |
| **NDPA (Nigeria)** | Data localisation and consent management | Organisation-scoped queries; `consent_records` table with granular consent tracking |
| **Data Protection Act (Kenya)** | Cross-border transfer restrictions | `dataSharingAgreements` table with bilateral agreement verification via `requireCrossBorderAccess()` middleware |
| **Data Protection Act (Ghana)** | Accountability principle | SHA-256 hash-chained audit logs with user attribution on every action |

---

## 3. Cryptographic Audit Trails

### 3.1 Schema

All auditable events are recorded in the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id VARCHAR,
  details TEXT,
  ip_address TEXT,
  previous_hash TEXT,
  current_hash TEXT,
  organization_id VARCHAR REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 SHA-256 Hash Chaining

Each audit log entry is cryptographically linked to its predecessor, forming a tamper-evident chain. The hash payload follows this structure:

```
currentHash = SHA-256(previousHash | timestamp | action | userId | entityId | entity | details)
```

Where `|` denotes string concatenation with the pipe character as delimiter.

**Properties:**
- **Append-only** — The hash chain is forward-linking; modifying any historical entry invalidates all subsequent hashes
- **Deterministic** — Given the same inputs and previous hash, the output is always identical
- **Non-repudiable** — The `userId` and `ipAddress` fields bind every action to an authenticated identity

### 3.3 Blockchain Anchoring

A scheduled task runs every 6 hours to anchor the audit trail:

1. Collects all un-anchored audit log entries
2. Computes a Merkle root from the set of `currentHash` values
3. Records the Merkle root with a timestamp for independent verification

This provides an external, time-stamped proof that the audit log existed in a specific state at a specific time.

### 3.4 Auditable Events

The following actions are logged with full hash chaining:

| Action | Entity | Trigger |
|---|---|---|
| `LOGIN` | `session` | Successful user authentication |
| `LOGIN_FAILED` | `session` | Failed authentication attempt |
| `SESSION_TIMEOUT` | `session` | Idle session expiry |
| `ACCOUNT_LOCKED` | `user` | Progressive lockout triggered |
| `CREATE` | `borrower` | New borrower registration |
| `UPDATE` | `borrower` | Borrower record modification |
| `CREATE` | `credit_account` | New credit account added |
| `VIEW` | `credit_report` | Credit report accessed |
| `SEARCH` | `borrower` | Borrower search executed |
| `APPROVAL_REQUESTED` | `pending_approval` | Maker submits change for review |
| `APPROVAL_GRANTED` | `pending_approval` | Checker approves change |
| `APPROVAL_REJECTED` | `pending_approval` | Checker rejects change |
| `CROSS_BORDER_ACCESS` | `cross_border` | Cross-jurisdiction data access |
| `REPORT_GENERATED` | `credit_report` | PDF report generated |
| `WEBHOOK_DELIVERED` | `webhook` | Outbound webhook dispatched |

---

## 4. Maker-Checker (Four-Eye) Principle

### 4.1 Architecture

The Maker-Checker workflow ensures that no single user can unilaterally create, modify, or delete sensitive data. The implementation uses the `pending_approvals` table:

```sql
CREATE TABLE pending_approvals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id VARCHAR,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  requested_by VARCHAR NOT NULL REFERENCES users(id),
  reviewed_by VARCHAR REFERENCES users(id),
  status approval_status NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  organization_id VARCHAR REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
```

### 4.2 Workflow

```
Maker (User A) → Submits modification → pending_approvals (status: "pending")
                                              ↓
Checker (User B) → Reviews and approves/rejects → pending_approvals (status: "approved"/"rejected")
                                              ↓
                              If approved → Data mutation applied
                              If rejected → No change; review notes recorded
```

### 4.3 Self-Approval Prevention

The backend explicitly blocks self-approvals at the API layer. When a reviewer attempts to approve a pending change, the system verifies:

```typescript
if (approval.requestedBy === req.session.userId) {
  return res.status(403).json({ message: "Maker cannot be the Checker." });
}
```

This check is enforced server-side and cannot be circumvented by the frontend. The error message "Maker cannot be the Checker." is standardised across the platform.

### 4.4 Cross-Organisation Blocking

The system additionally prevents users from reviewing approvals that belong to a different organisation:

```typescript
if (approval.organizationId !== req.session.organizationId) {
  return res.status(403).json({ message: "Cannot review approvals from another organisation" });
}
```

---

## 5. Security & Authentication

### 5.1 Authentication Stack

The platform implements a defence-in-depth authentication architecture:

| Layer | Mechanism | Standard |
|---|---|---|
| **Primary** | Username + bcrypt-hashed password | OWASP password guidelines |
| **Second Factor** | TOTP (Time-based One-Time Password) | RFC 6238 |
| **Biometric** | WebAuthn/FIDO2 passkeys | W3C Web Authentication |
| **Social** | Google OAuth 2.0 | OpenID Connect |

### 5.2 TOTP Multi-Factor Authentication

MFA is implemented using the OTPAuth library compliant with RFC 6238:

- **Algorithm:** SHA-1 (TOTP standard)
- **Period:** 30 seconds
- **Digits:** 6
- **Secret storage:** Base32-encoded in the `users.mfa_secret` column
- **Enrollment flow:** QR code generation → User scans with authenticator app → Verification code submitted → `mfa_enabled` flag set

Once enabled, the login flow requires both the password and a valid TOTP code before a session is issued.

### 5.3 Role-Based Idle Session Timeouts

Sessions are managed server-side using `express-session` with PostgreSQL-backed storage. Each request updates a `lastActivity` timestamp, and a middleware layer enforces idle timeouts:

| Role | Idle Timeout |
|---|---|
| `super_admin` | 15 minutes |
| `admin` | 15 minutes |
| `regulator` | 20 minutes |
| `lender` | 30 minutes |
| `viewer` | 30 minutes |

When the idle threshold is exceeded:
1. The session is destroyed server-side
2. An `audit_logs` entry is created with action `SESSION_TIMEOUT`
3. The client receives HTTP 440 (Login Timeout) with message "Session expired due to inactivity"
4. The frontend redirects to the login page

The cookie `maxAge` is set to 8 hours as an absolute session lifetime cap, regardless of activity.

### 5.4 Progressive Account Lockout

Failed login attempts are tracked per user. The lockout policy follows a progressive escalation:

| Failed Attempts | Action |
|---|---|
| 1-4 | Warning logged; attempt counter incremented |
| 5+ | Account locked for 30 minutes; `ACCOUNT_LOCKED` audit event created |

The lockout state is stored in `users.locked_until` and checked before password verification on each login attempt. Successful authentication resets the counter.

### 5.5 HMAC-SHA256 Webhook Signatures

Outbound webhook deliveries are signed using HMAC-SHA256 to allow receiving systems to verify payload authenticity:

```
signature = HMAC-SHA256(webhook_secret, JSON.stringify(payload))
```

Two signature headers are sent for maximum compatibility:
- `X-CDH-Signature: sha256={signature}`
- `X-Webhook-Signature: sha256={signature}`

### 5.6 API Rate Limiting

Six rate-limiting tiers protect against abuse:

| Tier | Limit | Scope |
|---|---|---|
| `loginLimiter` | 10 / minute | `/api/auth/login` |
| `apiLimiter` | 200 / minute | All authenticated routes |
| `writeLimiter` | 60 / minute | POST, PATCH, DELETE operations |
| `batchLimiter` | 10 / minute | Bulk upload endpoints |
| `aiLimiter` | 10 / 15 minutes | AI command centre |
| `creditReportLimiter` | 20 / 15 minutes | Report generation |

### 5.7 Transport & Header Security

- **TLS:** Enforced via deployment platform (Replit / reverse proxy)
- **Helmet.js:** Configures `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Strict-Transport-Security`
- **CORS:** Restricted to configured origins
- **Input sanitisation:** DOMPurify applied to user-supplied content

---

## 6. Data Retention & Purge Policies

The platform supports jurisdiction-specific data retention through the `retention_policies` table:

```sql
CREATE TABLE retention_policies (
  id VARCHAR PRIMARY KEY,
  country TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  ...
);
```

A scheduled task runs every 24 hours to:
1. Query all active retention policies
2. Identify records exceeding their jurisdiction's retention period
3. Execute purge operations with full audit logging

This ensures compliance with varying national requirements (e.g., Ghana's 7-year retention, South Africa's 5-year POPIA limit).

---

## 7. Cross-Border Data Sharing

Cross-border data access is governed by bilateral agreements recorded in the `data_sharing_agreements` table. The `requireCrossBorderAccess()` middleware:

1. Identifies the requesting user's organisation and country
2. Queries active agreements where the organisation's country is either source or target
3. Verifies the specific institution is listed in the agreement's allowed participants
4. If no valid agreement exists, returns HTTP 403 with a descriptive error
5. Logs the access event with action `CROSS_BORDER_ACCESS` for audit purposes

This model supports both country-to-country and institution-to-institution agreement granularity.

---

## 8. Regulatory Alignment Matrix

| Control | POPIA | NDPA | Kenya DPA | Ghana DPA | Basel III | AU Convention |
|---|---|---|---|---|---|---|
| Data sovereignty isolation | Yes | Yes | Yes | Yes | — | Yes |
| Consent management | Yes | Yes | Yes | Yes | — | Yes |
| SHA-256 audit chain | Yes | Yes | Yes | Yes | Yes | Yes |
| Maker-Checker workflow | — | — | — | Yes | Yes | — |
| MFA authentication | Yes | Yes | Yes | Yes | Yes | — |
| Idle session timeout | Yes | Yes | Yes | Yes | — | — |
| Data retention policies | Yes | Yes | Yes | Yes | — | Yes |
| Cross-border controls | Yes | Yes | Yes | — | — | Yes |
| Breach notification support | Yes | Yes | Yes | Yes | — | Yes |

---

**Document Control**

| Field | Value |
|---|---|
| Document ID | CDH-ARC-2026-001 |
| Version | 2.1 |
| Classification | Confidential |
| Authors | Uffe Jon Carlson, Thomas Baafi |
| Organisation | Carlson Capital & Systems In Motion Limited |
| Last Updated | March 2026 |
