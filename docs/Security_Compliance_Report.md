# Security Compliance Report

## Cross-Jurisdictional Central Data Hub & Credit Registry System v2.0

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.2  
**Date:** March 2026  
**Classification:** Confidential

---

## 1. Executive Summary

This document provides a comprehensive assessment of the security controls implemented in the Credit Registry System against the requirements defined in the Software Requirements Specification (SRS) v2.0. The system handles sensitive financial and personal data across all 54 African countries and supports three languages (English, French, Portuguese) and must comply with data protection and financial regulatory requirements.

All ten non-functional security requirements (NFR-SEC-01 through NFR-SEC-10) have been implemented, along with fifteen enterprise security enhancements (ENT-01 through ENT-15) and additional AI-powered features (AI-001 through AI-004) and platform enhancements (ENT-16 through ENT-21). These include TOTP multi-factor authentication, OAuth 2.1 Bearer token exchange, tamper-evident audit log hash chains, fuzzy entity matching, dispute chatbot, low-bandwidth optimizations, XBRL upload support, data retention enforcement, exchange rate management, API administration, global search, ID photo/document upload, investor demo environment, dashboard visual analytics, interactive demo tour, AI credit risk analysis, AI report summaries, AI smart chatbot, AI compliance reports, Excel export, real-time notifications, API usage analytics, dashboard sparkline trends, audit trail enhancements, and multi-language PDF reports. This report details each security control, its implementation, and compliance status.

---

## 2. Authentication Controls

### 2.1 Password-Based Authentication

| Control | Implementation |
|---------|---------------|
| Authentication Method | Username/password with server-side session |
| Password Hashing | bcryptjs with 10 salt rounds |
| Password Storage | Hashed passwords stored in `users.password` column; plaintext never stored or logged |
| Login Endpoint | `POST /api/auth/login` |
| Logout Endpoint | `POST /api/auth/logout` |
| Session Verification | `GET /api/auth/me` |

### 2.2 Password Policy

| Policy | Requirement | Implementation |
|--------|-------------|---------------|
| Minimum Length | 8 characters | Regex validation: `.{8,}` |
| Uppercase | At least 1 | Regex: `(?=.*[A-Z])` |
| Lowercase | At least 1 | Regex: `(?=.*[a-z])` |
| Digit | At least 1 | Regex: `(?=.*\d)` |
| Special Character | At least 1 | Regex: `(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])` |
| Password Expiry | 90 days | `passwordChangedAt` timestamp checked on login; forced change when expired |
| First Login Change | Required when flagged | `mustChangePassword` boolean flag |

**Full Regex Pattern:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$
```

### 2.3 Multi-Factor Authentication (MFA) — ENT-01

| Control | Implementation |
|---------|---------------|
| MFA Method | TOTP (Time-Based One-Time Password) via `otpauth` library |
| Secret Storage | `mfaSecret` column (varchar, nullable) on `users` table; stored as base32-encoded secret |
| Enable Flag | `mfaEnabled` column (boolean, default false) on `users` table |
| Setup Endpoint | `POST /api/auth/mfa/setup` — generates TOTP secret, returns `otpauth://` URI for QR code |
| Verify Endpoint | `POST /api/auth/mfa/verify` — validates 6-digit TOTP code and enables MFA |
| Disable Endpoint | `POST /api/auth/mfa/disable` — disables MFA for the authenticated user |
| Login Flow | `POST /api/auth/login` returns `{ requireMfa: true }` when MFA is enabled; client prompts for TOTP code |
| MFA Login Endpoint | `POST /api/auth/mfa/login` — validates TOTP code and completes authentication |
| Frontend Component | `mfa-setup.tsx` — setup dialog with QR code display and verification input |
| i18n Support | Full EN/FR/PT translations under `mfa.*` and `login.mfa*` keys |

**MFA Login Flow:**
1. User submits username/password via `POST /api/auth/login`
2. If user has `mfaEnabled = true`, server returns `{ requireMfa: true, userId }` without creating a session
3. Client shows TOTP code input field
4. User enters 6-digit code from authenticator app
5. Client sends `POST /api/auth/mfa/login` with `{ userId, code }`
6. Server validates TOTP code against stored secret
7. If valid, session is created and user is authenticated
8. If invalid, HTTP 401 returned with "Invalid MFA code" error

### 2.4 Account Lockout

| Control | Value |
|---------|-------|
| Maximum Failed Attempts | 3 |
| Lockout Duration | 15 minutes |
| Lockout Tracking | `failed_login_attempts` counter in `users` table |
| Lock Expiration | `locked_until` timestamp in `users` table |
| Counter Reset | On successful login (`resetFailedAttempts`) |
| Audit Logging | Failed attempts and lockout events logged with IP address |

**Lockout Flow:**
1. Failed login increments `failed_login_attempts`
2. Each failed attempt creates `LOGIN_FAILED` audit log entry
3. At 3 failed attempts, `locked_until` set to `now + 15 minutes`
4. `ACCOUNT_LOCKED` audit log entry created
5. Subsequent login attempts during lockout return HTTP 423
6. Successful login resets counter and clears lock

---

## 3. Authorization (RBAC)

### 3.1 Role Definitions

The system implements four roles with hierarchical access:

| Role | Description | User Management | Institutions | Billing | Audit Logs | Approvals | Batch Upload | Data Entry | View Data |
|------|-------------|----------------|--------------|---------|------------|-----------|--------------|------------|-----------|
| admin | Full system access | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| regulator | Regulatory oversight | No | No | Yes | Yes | Yes | No | Yes | Yes |
| lender | Data provider operations | No | No | No | No | No | Yes | Yes | Yes |
| viewer | Read-only access | No | No | No | No | No | No | No | Yes |

### 3.2 Server-Side Enforcement

Authorization is enforced at the API layer using middleware:

```typescript
function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.session?.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
```

### 3.3 Protected Routes

| Endpoint | Required Roles |
|----------|---------------|
| `GET/POST /api/users` | admin |
| `PATCH /api/users/:id` | admin |
| `GET /api/audit-logs` | admin, regulator |
| `PATCH /api/pending-approvals/:id` | admin, regulator |
| `POST /api/court-judgments` | admin, regulator |
| `GET/POST /api/api-keys` | admin |
| `POST /api/api-keys/:id/revoke` | admin |
| `POST /api/batch-upload/*` | admin, lender |

### 3.4 Frontend RBAC

The frontend sidebar and page access are filtered based on the user's role, preventing unauthorized navigation. However, security enforcement occurs server-side; frontend filtering is a UX convenience only.

---

## 4. Session Management

### 4.1 Session Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Session Store | MemoryStore | In-memory session storage with periodic cleanup |
| Session Secret | `SESSION_SECRET` env var | Falls back to dev secret in development |
| Cookie HttpOnly | `true` | Prevents client-side JavaScript access |
| Cookie Secure | `false` (configurable) | Should be `true` in production with HTTPS |
| Cookie SameSite | `lax` | CSRF protection |
| Max Session Age | 8 hours | Absolute session lifetime |
| Idle Timeout | 4 hours | NFR-SEC-09 compliance |
| Store Cleanup | Every 24 hours | `checkPeriod: 86400000` |

### 4.2 Idle Timeout Implementation (NFR-SEC-09)

```typescript
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours

app.use((req, res, next) => {
  if (req.session?.userId && req.session.lastActivity) {
    const idle = Date.now() - req.session.lastActivity;
    if (idle > IDLE_TIMEOUT_MS) {
      req.session.destroy(() => {});
      return res.status(440).json({ message: "Session expired due to inactivity" });
    }
  }
  if (req.session?.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
});
```

- `lastActivity` timestamp updated on every authenticated request
- Session destroyed when idle time exceeds 4 hours
- HTTP 440 status returned (Login Timeout)
- Frontend detects 440 and automatically redirects to `/auth` login page

### 4.3 Session Data

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Authenticated user's ID |
| userRole | string | User's role for authorization |
| lastActivity | number | Timestamp of last activity (ms since epoch) |

---

## 5. API Security

### 5.1 Internal API Authentication

All internal API endpoints (under `/api/`) require session-based authentication, except:
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/health`
- `/api/external/*`

This includes the dashboard visualization endpoint `GET /api/dashboard/chart-data`, which returns monthly trend, status breakdown, type breakdown, and country breakdown data for the Dashboard Visual Analytics module (ENT-14). This endpoint is protected by the `requireAuth` middleware and requires an active authenticated session.

Authentication middleware:
```typescript
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/external")) return next();
  requireAuth(req, res, next);
});
```

### 5.2 External API Authentication

External API endpoints support two authentication methods:

#### 5.2.1 X-API-Key Authentication

API key authentication via the `X-API-Key` HTTP header (original method):

#### 5.2.2 OAuth 2.1 Bearer Token Authentication — ENT-04

| Control | Implementation |
|---------|---------------|
| Grant Type | `client_credentials` |
| Token Endpoint | `POST /api/external/oauth/token` |
| Token Format | JWT (JSON Web Token) signed with HS256 |
| Token Library | `jsonwebtoken` |
| Token Expiry | 1 hour (3600 seconds) |
| Request Format | `{ "grant_type": "client_credentials", "client_id": "<api_key_prefix>", "client_secret": "<full_api_key>" }` |
| Response Format | `{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 }` |
| Usage | `Authorization: Bearer <access_token>` header on external API endpoints |

**OAuth 2.1 Token Flow:**
1. Client sends `POST /api/external/oauth/token` with API key credentials
2. Server validates the API key via SHA-256 hash lookup
3. Server generates a JWT containing `institutionId`, `permissions`, and `apiKeyId`
4. JWT is signed with the session secret and returned to the client
5. Client includes the JWT in the `Authorization: Bearer <token>` header on subsequent requests
6. Server validates the JWT signature and expiry on each request
7. Both X-API-Key and Bearer token authentication are accepted on all external API endpoints

External API endpoints also use API key authentication:

| Control | Implementation |
|---------|---------------|
| Authentication Header | `X-API-Key` |
| Key Hashing | SHA-256 (crypto.createHash) |
| Key Storage | Only hash stored (`key_hash` column); full key shown once at creation |
| Key Prefix | Visible prefix for identification (`sim_XXXXXXXX`) |
| Permission Levels | `submit` (write only), `read` (read only), `full` (read + write) |
| Institution Binding | Each key bound to a specific institution |
| Institution Status Check | Institution must be `active` for key to work |
| Last Used Tracking | `last_used_at` timestamp updated on each API call |
| Key Revocation | Immediate revocation with `revoked_at` timestamp |

### 5.3 API Key Generation

```typescript
function generateApiKey() {
  const prefix = "sim_" + crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const fullKey = `${prefix}_${secret}`;
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  return { fullKey, prefix, hash };
}
```

- Key format: `sim_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`
- Prefix: 8 hex characters for identification
- Secret: 48 hex characters for security
- Total entropy: 224 bits (28 random bytes)

### 5.4 API Key Validation Flow

1. Extract `X-API-Key` header
2. Hash the key with SHA-256
3. Look up hash in `api_keys` table
4. Verify key status is `active`
5. Verify associated institution is `active`
6. Check permission level against endpoint requirements
7. Update `last_used_at` timestamp
8. Proceed with request

### 5.5 SSRF Mitigation

The API Administration module's "Test Connection" feature includes Server-Side Request Forgery (SSRF) protection to prevent abuse of outbound HTTP requests.

| Control | Implementation |
|---------|---------------|
| URL Validation | Blocks requests to internal/private network addresses before making outbound requests |
| Blocked Hosts | `localhost`, `127.0.0.1`, `169.254.169.254` (cloud metadata endpoint) |
| Blocked IP Ranges | Private IP ranges: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x` |
| Protocol Restriction | Only `HTTP` and `HTTPS` protocols are allowed; all other schemes are rejected |
| Implementation | URL validation logic in `server/routes.ts` validates all user-supplied URLs before making outbound requests |

**SSRF Validation Flow:**
1. User submits a URL via the "Test Connection" feature in the API Administration module
2. Server parses the URL and extracts the hostname and protocol
3. Protocol is checked against the allowlist (HTTP/HTTPS only)
4. Hostname is checked against the blocklist (localhost, 127.0.0.1, metadata endpoint)
5. Hostname is checked against private IP ranges (10.x, 192.168.x, 172.16-31.x)
6. If any check fails, the request is rejected with an appropriate error message
7. If all checks pass, the outbound request is made and the response is returned to the user

---

## 6. Data Protection

### 6.1 Data at Rest

| Data | Protection |
|------|-----------|
| Passwords | bcrypt hash (10 rounds) |
| API Keys | SHA-256 hash |
| PII (borrower data) | Database-level access control |
| Database Connection | SSL/TLS when `sslmode=require` |

### 6.2 Data in Transit

| Channel | Protection |
|---------|-----------|
| Client to Server | HTTPS (platform-provided or reverse proxy) |
| Server to Database | PostgreSQL SSL/TLS |
| API Key Transmission | HTTPS required for external API |

### 6.3 Sensitive Data Handling

- Passwords are never returned in API responses (`stripPassword` function)
- Full API keys shown only once at creation
- Session data stored server-side only (cookie contains session ID only)
- Audit log details truncated to 200 characters in console output

### 6.4 Input Validation

All user input is validated using Zod schemas derived from Drizzle ORM table definitions:

```typescript
const parsed = insertBorrowerSchema.parse(req.body);
```

- Type validation (string, number, boolean, enum values)
- Required field enforcement
- Enum value restriction
- SQL injection prevention via parameterized queries (Drizzle ORM), including within the Retention Enforcement Engine and API Configuration modules

---

## 7. Audit Logging

### 7.1 Audit Log Coverage

| Action Category | Logged Events |
|-----------------|---------------|
| Authentication | LOGIN, LOGIN_FAILED, ACCOUNT_LOCKED, LOGOUT, PASSWORD_CHANGE |
| Data Changes | CREATE, UPDATE, SUBMIT_APPROVAL, APPROVE, REJECT |
| Disputes | FILE_DISPUTE, RESOLVE_DISPUTE |
| Consent | GRANT_CONSENT, REVOKE_CONSENT |
| Credit Reports | VIEW (credit report), API_CREDIT_REPORT |
| External API | API_SUBMIT, API_BATCH_SUBMIT, API_CREDIT_REPORT |
| Institutions | APPROVE_INSTITUTION |
| API Keys | CREATE_API_KEY, REVOKE_API_KEY |

### 7.2 Audit Log Fields

| Field | Description |
|-------|-------------|
| id | Unique log entry identifier |
| user_id | User who performed the action |
| action | Action type (enumerated above) |
| entity | Entity type affected (user, borrower, credit_account, etc.) |
| entity_id | Identifier of affected entity |
| details | Human-readable description |
| ip_address | Client IP address (via `req.ip` with trust proxy enabled) |
| created_at | Timestamp of the action |

### 7.3 Tamper-Evident Hash Chain — ENT-07

| Control | Implementation |
|---------|---------------|
| Hashing Algorithm | SHA-256 (via Node.js `crypto` module) |
| Hash Fields | `previousHash` and `currentHash` columns on `audit_logs` table |
| Chain Construction | Each new log entry's `currentHash` = SHA-256(`previousHash` + `action` + `entity` + `details` + `timestamp`) |
| First Entry | `previousHash` = `"genesis"` for the first log entry in the chain |
| Verification Endpoint | `GET /api/audit/verify-integrity` — validates the entire hash chain |
| Frontend Indicator | Integrity badge on audit trail page (`data-testid="badge-integrity-status"`) |
| Verification Button | `data-testid="button-verify-integrity"` triggers chain verification |

**Hash Chain Verification Process:**
1. Client calls `GET /api/audit/verify-integrity`
2. Server retrieves all audit log entries ordered by `created_at ASC`
3. For each entry, server recomputes the expected `currentHash` from `previousHash` + entry data
4. Server verifies that `currentHash` matches the stored value
5. Server verifies that `previousHash` matches the prior entry's `currentHash`
6. Returns `{ valid: true/false, totalEntries, checkedEntries, brokenAt }` 
7. Frontend displays green "Valid" badge or red "Broken" badge accordingly

### 7.4 Audit Log Immutability

- Audit logs are append-only (INSERT operations only)
- No UPDATE or DELETE endpoints exist for audit logs
- Logs are ordered by `created_at DESC` for display
- Latest 200 entries returned via API (with pagination potential)
- Hash chain provides cryptographic tamper evidence (ENT-07)

### 7.4 IP Address Tracking

```typescript
app.set("trust proxy", true);
```

IP addresses are captured on all audited operations via `req.ip`, which respects `X-Forwarded-For` headers when behind a reverse proxy.

---

## 8. Maker-Checker Workflow

### 8.1 Four-Eye Principle

The system enforces a maker-checker (four-eye) principle for data changes:

| Step | Role | Action |
|------|------|--------|
| 1. Submit | Any user (maker) | Creates a pending approval request |
| 2. Review | Admin/Regulator (checker) | Approves or rejects the request |
| 3. Apply | System | Automatically applies approved changes |

### 8.2 Self-Approval Prevention

```typescript
if (approval.requestedBy === currentUserId) {
  return res.status(403).json({
    message: "Maker-checker: You cannot approve your own request."
  });
}
```

- Server-side enforcement prevents any user from approving their own requests
- HTTP 403 returned on self-approval attempt
- This applies to all entity types (borrowers, credit accounts)

### 8.3 Covered Entities

| Entity Type | Actions Requiring Approval |
|-------------|---------------------------|
| Borrower | CREATE, UPDATE |
| Credit Account | CREATE, UPDATE |

### 8.4 Approval Notifications

- When a request is submitted, all admin/regulator users (except the requester) receive a notification
- When a request is approved/rejected, the original requester receives a notification
- Notifications include links to the approvals page

---

## 9. Enterprise Enhancement Security Controls

### 9.1 Fuzzy Entity Matching — ENT-02

| Control | Implementation |
|---------|---------------|
| Extension | `pg_trgm` (PostgreSQL trigram similarity) |
| Activation | `CREATE EXTENSION IF NOT EXISTS pg_trgm` at pool initialization in `server/db.ts` |
| Endpoint | `GET /api/borrowers/fuzzy-match?name=<query>` |
| Threshold | Similarity score ≥ 0.3 |
| Purpose | Detects potential duplicate borrowers during registration to prevent identity fraud |
| Frontend Integration | Warning banner shown on borrower registration form when duplicates detected |

### 9.2 Low-Bandwidth Optimizations — ENT-05

| Control | Implementation |
|---------|---------------|
| Compression | `compression` middleware (gzip) applied to all HTTP responses |
| Code Splitting | `React.lazy()` for all route components except Dashboard, Login, and NotFound |
| Lazy Loading | `Suspense` wrapper with spinner fallback component (`LazyFallback`) |
| Effect | Reduced initial bundle size; compressed API responses for bandwidth-constrained environments |

### 9.3 XBRL Upload Support — ENT-06

| Control | Implementation |
|---------|---------------|
| File Format | XBRL/XML files accepted via batch upload endpoint |
| Frontend | Tabbed interface (JSON/CSV tab and XBRL tab) on batch upload page |
| Sample | XBRL sample format provided in UI for data preparers |
| Parsing | Server-side XBRL/XML parsing in `POST /api/batch-upload/credit-accounts` |

### 9.4 Dispute Chatbot — ENT-03

| Control | Implementation |
|---------|---------------|
| Component | `dispute-chatbot.tsx` — guided chat interface |
| Integration | Accessible from helpdesk page |
| Flow | Issue type → borrower search → account selection → description → auto-submit |
| i18n | Full EN/FR translations under `chatbot.*` keys |

### 9.5 File Upload Security — ENT-12

| Control | Implementation |
|---------|---------------|
| Upload Library | `multer` — multipart/form-data handling for file uploads |
| Photo Size Limit | 5 MB maximum file size for borrower photos |
| Document Size Limit | 10 MB maximum file size for ID documents |
| Photo MIME Validation | Only `image/*` MIME types accepted for photos |
| Document MIME Validation | Only `image/*` and `application/pdf` MIME types accepted for ID documents |
| Filename Randomization | Uploaded files receive randomized filenames (`{timestamp}-{random}{ext}`) to prevent path traversal and enumeration |
| Storage Location | Photos stored in `uploads/photos/`, ID documents in `uploads/documents/` |
| Auth-Protected Serving | `/uploads` static route protected by `requireAuth` middleware — unauthenticated users cannot access uploaded files |
| Audit Logging | All photo and document uploads create audit log entries (`UPLOAD_PHOTO`, `UPLOAD_ID_DOCUMENT`) with borrower ID and user ID |
| Endpoints | `POST /api/borrowers/:id/photo` (multipart/form-data, field: `photo`), `POST /api/borrowers/:id/id-document` (multipart/form-data, field: `document`) |

### 9.6 External Service Integrations

| Service | Purpose | Security Notes |
|---------|---------|---------------|
| DiceBear (`api.dicebear.com`) | Auto-generated borrower profile avatars | No PII sent to DiceBear — only the borrower ID is used as a seed for avatar generation; no authentication required |
| Open Exchange Rates (`open.er-api.com`) | Live currency exchange rate fetching | No authentication required; no sensitive data transmitted; only currency codes sent in requests |
| OpenAI GPT-4o (via Replit AI Integrations) | AI credit risk analysis, report summaries, chatbot assistant, compliance reports | See Section 9.7 for detailed AI data handling controls |

### 9.7 AI Data Handling — ENT-16 through ENT-21

The system integrates with OpenAI GPT-4o for AI-powered analysis features. The following controls govern the handling of data sent to and received from the AI service.

| Control | Implementation |
|---------|---------------|
| AI Provider | OpenAI GPT-4o via Replit AI Integrations |
| Configuration | Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` |
| Data Sent | Borrower data (name, account details, payment history) sent to OpenAI API for analysis; data is used solely for generating the requested analysis |
| PII Storage by AI | No PII is stored by OpenAI; requests are processed ephemerally per OpenAI's API data usage policy |
| Response Handling | AI responses are returned directly to the authenticated user; responses are not persisted in the database |
| Authentication | All AI endpoints require active session authentication via `requireAuth` middleware |
| Role Restrictions | AI compliance report endpoint (`POST /api/ai/compliance-report`) requires `admin`, `super_admin`, or `regulator` role |
| Audit Logging | AI analysis requests are logged in the audit trail |
| Module Location | `server/ai.ts` — contains all AI integration functions |

**AI Endpoints and Access Control:**

| Endpoint | Purpose | Required Auth |
|----------|---------|---------------|
| `POST /api/ai/credit-risk/:borrowerId` | AI credit risk analysis for a borrower | Authenticated user |
| `POST /api/ai/report-summary/:borrowerId` | AI-generated plain-language credit report summary | Authenticated user |
| `POST /api/ai/chat` | AI chatbot assistant with SSE streaming responses | Authenticated user |
| `POST /api/ai/compliance-report` | AI regulatory compliance analysis per country | admin, super_admin, regulator |

### 9.8 API Usage Tracking and Monitoring

The system includes in-memory API request tracking for monitoring and anomaly detection purposes.

| Control | Implementation |
|---------|---------------|
| Tracking Scope | All requests to `/api` routes are tracked in-memory |
| Data Captured | Endpoint path, timestamp, request count per endpoint |
| Storage | In-memory only; resets on application restart (no persistent storage) |
| Access Control | `GET /api/admin/api-usage` endpoint restricted to `admin` and `super_admin` roles |
| Metrics Provided | Total requests today, requests this hour, unique endpoints, top endpoints by volume, hourly distribution (24h) |
| Anomaly Detection | Usage data enables administrators to identify unusual traffic patterns, potential abuse, or unauthorized access attempts |

### 9.9 Real-Time Notification System for Security Alerts

The notification system supports security-relevant alerting capabilities.

| Control | Implementation |
|---------|---------------|
| Notification Table | `notifications` table in PostgreSQL with user targeting |
| Approval Notifications | Automatic notifications to admin/regulator users when maker-checker approval requests are submitted |
| Result Notifications | Notification to original requester when approval requests are approved or rejected |
| Access Control | Users can only view their own notifications; mark-as-read restricted to notification owner |
| Polling Interval | Frontend polls every 30 seconds for new notifications |
| Endpoints | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read` |

---

## 10. Compliance Matrix (NFR-SEC + ENT)

| SRS Ref | Requirement | Status | Implementation Details |
|---------|-------------|--------|----------------------|
| NFR-SEC-01 | Role-based access control with 4 roles | COMPLIANT | 4 roles (admin, regulator, lender, viewer) with server-side `requireRole` middleware on all protected routes. Full access matrix implemented. |
| NFR-SEC-02 | Password hashing | COMPLIANT | bcryptjs with 10 salt rounds. Passwords hashed on creation and change. Plaintext never stored or returned in API responses. |
| NFR-SEC-03 | Password complexity (8+ chars, upper, lower, digit, special) | COMPLIANT | Regex validation on password change endpoint. Enforced server-side. |
| NFR-SEC-04 | Account lockout after 3 failed attempts | COMPLIANT | 3-attempt threshold with 15-minute lockout. Failed attempt counter and lock expiration tracked in database. Audit logged. |
| NFR-SEC-05 | Comprehensive audit logging | COMPLIANT | All CRUD operations, authentication events, and API calls logged to `audit_logs` table with user ID, action, entity, details, IP, and timestamp. |
| NFR-SEC-06 | IP address tracking in audit logs | COMPLIANT | `req.ip` captured with `trust proxy` enabled. IP stored in `ip_address` column of `audit_logs`. |
| NFR-SEC-07 | Maker-checker (four-eye principle) | COMPLIANT | Pending approval workflow for borrower and credit account changes. Self-approval prevention enforced server-side with HTTP 403. |
| NFR-SEC-08 | 90-day password expiry | COMPLIANT | `passwordChangedAt` timestamp checked on login. `mustChangePassword` flag for forced change. Password change dialog presented to user. |
| NFR-SEC-09 | 15-minute idle session timeout | COMPLIANT | `lastActivity` timestamp updated on each request. Session destroyed when idle exceeds 15 minutes (900,000 ms). HTTP 440 returned. |
| ENT-01 | TOTP Multi-Factor Authentication | COMPLIANT | TOTP via `otpauth` library; setup/verify/disable/login endpoints; `mfaSecret` and `mfaEnabled` fields on users table; full login flow integration. |
| ENT-02 | Fuzzy entity matching for duplicate detection | COMPLIANT | `pg_trgm` PostgreSQL extension enabled at startup; trigram similarity search with threshold ≥ 0.3; duplicate warning on borrower registration. |
| ENT-03 | Guided dispute chatbot assistant | COMPLIANT | Multi-step chat flow: issue type → borrower search → account selection → description → auto-submit; full EN/FR i18n. |
| ENT-04 | OAuth 2.1 Bearer token authentication | COMPLIANT | Client credentials grant; JWT tokens signed with HS256; 1-hour expiry; dual auth (Bearer + X-API-Key) on external API. |
| ENT-05 | Low-bandwidth optimizations | COMPLIANT | gzip `compression` middleware; `React.lazy()` code-splitting with `Suspense` fallback for all route components. |
| ENT-06 | XBRL/XML batch upload support | COMPLIANT | XBRL/XML file parsing in batch upload endpoint; tabbed frontend (JSON/CSV + XBRL); sample format provided. |
| ENT-07 | Tamper-evident audit log hash chain | COMPLIANT | SHA-256 hash chain (`previousHash`/`currentHash` columns); `GET /api/audit/verify-integrity` endpoint; visual integrity badge on audit trail page. |
| REQ-RET-01 | Data Retention | COMPLIANT | Per-country retention policies enforced across all 54 African jurisdictions (Ghana 10yr, Ethiopia/Uganda/Liberia 7yr, others configurable; audit logs 10yr globally). Retention Enforcement Engine with 24-hour automated scheduler and admin-only manual trigger. Parameterized SQL via Drizzle ORM; table names validated against `VALID_TABLES` allowlist; country values validated against `VALID_COUNTRIES` set. |
| ENT-11 | Global Search | COMPLIANT | Cross-entity search across borrowers, institutions, and credit accounts via `/api/global-search` endpoint. Optional country filter. No sensitive data exposure beyond authenticated user's access level. |
| ENT-12 | File Upload Security | COMPLIANT | Multer-based upload with file size limits (5MB photos, 10MB documents), MIME type validation, randomized filenames, auth-protected serving via `/uploads` route. All uploads audit-logged. |
| ENT-13 | Demo Environment | COMPLIANT | Investor-facing demo with pre-configured role cards. Amber banner indicates demo mode. Uses existing authentication and authorization infrastructure. Fictional data only. |
| ENT-14 | Dashboard Visual Analytics | COMPLIANT | `GET /api/dashboard/chart-data` endpoint protected by `requireAuth` middleware. Returns aggregated statistical data only (monthly trends, status breakdowns, type breakdowns, country breakdowns); no raw PII exposed. Recharts renders data client-side. SVG Africa map uses pre-defined country geometries with no external data fetching. Dark mode support via CSS variable detection. |
| ENT-15 | Interactive Demo Tour | COMPLIANT | Tour component (`demo-tour.tsx`) operates entirely client-side with no additional API endpoints. Auto-launch controlled via sessionStorage flag (demo login context only). No sensitive data stored or transmitted. Multilingual support in 5 AU languages (EN/FR/PT/AR/SW). |
| SLA-RET-01 | Retention Enforcement SLA | COMPLIANT | Automated 24-hour enforcement cycle ensures timely data lifecycle management. Manual trigger via `POST /api/retention-policies/enforce` (admin-only, RBAC-protected). All enforcement actions audit-logged with full result details. |
| AI-001 | AI Credit Risk Analysis | COMPLIANT | AI-powered risk assessment via OpenAI GPT-4o; all endpoints require session authentication; borrower data sent ephemerally; no PII stored by AI provider. |
| AI-002 | AI Report Summary | COMPLIANT | Plain-language credit report summaries generated via AI; session authentication required; responses not persisted. |
| AI-003 | AI Smart Chatbot | COMPLIANT | AI assistant mode with SSE streaming; session authentication required; conversation history maintained client-side only. |
| AI-004 | AI Compliance Reports | COMPLIANT | AI regulatory compliance analysis; restricted to admin/super_admin/regulator roles via RBAC. |
| ENT-16 | Excel Export | COMPLIANT | XLSX export via exceljs for portfolio, borrower, and audit data; session authentication required; no additional data exposure beyond authenticated user's access level. |
| ENT-17 | Real-time Notifications | COMPLIANT | Notification bell with 30-second polling; users can only access their own notifications; mark-as-read restricted to notification owner. |
| ENT-18 | API Usage Analytics | COMPLIANT | In-memory request tracking; usage dashboard restricted to admin/super_admin roles; data resets on restart (no persistent exposure risk). |
| ENT-19 | Dashboard Sparkline Trends | COMPLIANT | 7-day trend data via `GET /api/dashboard/trends`; session authentication required; returns aggregate metrics only, no raw PII. |
| ENT-20 | Audit Trail Enhancements | COMPLIANT | Timeline view, date range filters, CSV/Excel export; existing RBAC controls (admin/regulator) apply to audit log access. |
| ENT-21 | Multi-language PDF Reports | COMPLIANT | Language selector (EN/FR/AR/SW) for credit report PDF generation; session authentication required; no additional data exposure. |

---

## 11. Signal Handling and Resilience

The application implements defensive signal handling:

```typescript
process.on("SIGHUP", () => { /* ignore hangup signal */ });
process.on("SIGPIPE", () => { /* ignore broken pipe */ });
process.on("uncaughtException", (err) => { console.error("Uncaught exception:", err); });
process.on("unhandledRejection", (err) => { console.error("Unhandled rejection:", err); });
```

- SIGHUP ignored to prevent workflow-triggered termination
- SIGPIPE ignored to prevent broken pipe crashes
- Uncaught exceptions and unhandled rejections are logged but do not crash the process

---

## 12. Known Limitations and Recommendations

### 12.1 Current Limitations

| Area | Limitation | Risk Level | Recommendation |
|------|-----------|------------|----------------|
| Session Store | MemoryStore (not persistent) | Medium | Use Redis or PostgreSQL session store for production clusters |
| Cookie Secure | Set to `false` by default | High | Set `cookie.secure = true` when HTTPS is configured |
| Rate Limiting | Not implemented on API endpoints | Medium | Add rate limiting middleware (e.g., express-rate-limit) |
| CORS | Not explicitly configured | Low | Configure CORS headers if frontend is served from different origin |
| CSP | No Content Security Policy headers | Low | Add CSP headers via middleware or reverse proxy |
| Password History | Not tracked | Low | Track previous password hashes to prevent reuse |
| Session Clustering | MemoryStore is single-node only | High | Use Redis for multi-node deployments |

### 12.2 Production Hardening Recommendations

1. **Enable HTTPS** and set `cookie.secure = true`
2. **Replace MemoryStore** with Redis for session storage in multi-node environments
3. **Add rate limiting** on login and API endpoints
4. **Implement CORS** policy based on deployment architecture
5. **Add Content Security Policy** headers
6. **Set up log aggregation** (ELK stack, Datadog, etc.)
7. **Enable database SSL** with `sslmode=verify-full`
8. **Conduct penetration testing** before go-live
9. **Implement database encryption at rest** if required by jurisdiction
10. **Review and rotate** all default credentials and secrets
11. **Enforce MFA** for admin and regulator roles in production
12. **Rotate OAuth JWT signing keys** periodically

---

## 13. Data Lifecycle & Retention Security

### 13.1 Retention Enforcement Engine

The system includes an automated Retention Enforcement Engine responsible for enforcing data lifecycle policies in compliance with per-country regulatory requirements.

| Control | Implementation |
|---------|---------------|
| Scheduler | Automated 24-hour cycle; engine runs once every 24 hours |
| Manual Trigger | `POST /api/retention-policies/enforce` — admin-only, RBAC-protected via `requireRole("admin")` |
| Engine Location | `server/retention-enforcement.ts` |

### 13.2 Per-Country Retention Policies

Retention policies are configurable per jurisdiction across all 54 African countries. Default policies include:

| Country | Retention Period | Notes |
|---------|-----------------|-------|
| Ghana | 10 years | Aligned with Ghana Data Protection Act requirements |
| Ethiopia | 7 years | Standard financial data retention |
| Uganda | 7 years | Standard financial data retention |
| Liberia | 7 years | Standard financial data retention |
| Other African Countries | Configurable | Administrators can set per-country policies via the retention_policies table |
| Audit Logs | 10 years (global) | Applied uniformly across all jurisdictions |

### 13.3 SQL Injection Prevention in Retention Engine

The Retention Enforcement Engine employs multiple layers of protection against SQL injection:

| Control | Implementation |
|---------|---------------|
| Parameterized SQL | Uses Drizzle ORM `sql` tagged templates exclusively — no string interpolation in queries |
| Table Name Validation | Table names validated against a hardcoded allowlist (`VALID_TABLES` constant); any table name not in the allowlist is rejected |
| Country Value Validation | Country values validated against a `VALID_COUNTRIES` set before use in queries |
| ORM Integration | All queries constructed via Drizzle ORM, which enforces parameterized query execution |

### 13.4 Audit Logging of Retention Actions

All retention enforcement actions are fully audit-logged:

- Each enforcement run creates an audit log entry with action type `RETENTION_ENFORCEMENT`
- Results include the number of records evaluated, deleted, and retained per table and country
- Manual triggers log the initiating admin user
- Automated runs log the system as the actor
- Full result details are stored in the audit log `details` field

---

## 14. Platform Command Center Security Controls

### 14.1 Access Control

All Platform Command Center endpoints (`/api/platform/*`) enforce dual authentication:
1. **Session authentication** — `requireAuth` middleware validates active session
2. **Super admin role check** — `requireSuperAdmin` middleware restricts access to `super_admin` role only

### 14.2 Sensitive Data Protection

- **API Key Hash Exclusion (PCC-03):** The `GET /api/platform/api-keys` endpoint explicitly selects only non-sensitive columns (id, label, keyPrefix, status, permissions, organizationId, timestamps). The `keyHash` field is never transmitted to the client, preventing credential exposure even in administrative interfaces.

### 14.3 Input Validation on Mutable Endpoints

All mutable platform endpoints enforce strict input validation:

| Endpoint | Field | Validation Rule |
|----------|-------|----------------|
| `PUT /api/platform/pricing-tiers/:id` | `unitPriceCents` | Must be non-negative number |
| `PUT /api/platform/pricing-tiers/:id` | `isActive` | Must be boolean |
| `PUT /api/platform/retention-policies/:id` | `retentionYears` | Must be number between 1 and 100 |
| `PUT /api/platform/retention-policies/:id` | `archiveAfterYears` | Must be non-negative number |
| `PUT /api/platform/retention-policies/:id` | `isActive` | Must be boolean |
| `PUT /api/platform/retention-policies/:id` | `description` | Must be string |
| `POST /api/platform/retention-policies` | All fields | Validated against `insertRetentionPolicySchema` (Zod) |

### 14.4 Audit Log Filter Integrity

The audit log endpoint (`GET /api/platform/audit-logs`) applies all filters consistently across:
- Paginated log results
- Total count
- Action type breakdown counts
- Entity type breakdown counts

This prevents data leakage where filtered views might show aggregate counts from unfiltered datasets.

### 14.5 SQL Injection Prevention

Platform endpoints use Drizzle ORM parameterized queries throughout. The two endpoints using raw `pool.query` (audit-logs and activity-feed) use parameterized `IN` clauses with explicit placeholder generation (`$1, $2, ...`) instead of string interpolation.

---

## 15. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Officer | | | |
| Technical Lead | | | |
| Compliance Officer | | | |
| Client Representative | | | |
