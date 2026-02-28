# Security Compliance Report

## Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.0  
**Date:** January 2025  
**Classification:** Confidential

---

## 1. Executive Summary

This document provides a comprehensive assessment of the security controls implemented in the Credit Registry System against the requirements defined in the Software Requirements Specification (SRS) v1.1. The system handles sensitive financial and personal data across four jurisdictions (Ghana, Ethiopia, Uganda, Liberia) and must comply with data protection and financial regulatory requirements.

All nine non-functional security requirements (NFR-SEC-01 through NFR-SEC-09) have been implemented. This report details each security control, its implementation, and compliance status.

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

### 2.3 Account Lockout

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
| Idle Timeout | 15 minutes | NFR-SEC-09 compliance |
| Store Cleanup | Every 24 hours | `checkPeriod: 86400000` |

### 4.2 Idle Timeout Implementation (NFR-SEC-09)

```typescript
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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
- Session destroyed when idle time exceeds 15 minutes
- HTTP 440 status returned (Login Timeout)
- Frontend detects 440 and redirects to login page

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

Authentication middleware:
```typescript
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/external")) return next();
  requireAuth(req, res, next);
});
```

### 5.2 External API Authentication

External API endpoints use API key authentication:

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
- SQL injection prevention via parameterized queries (Drizzle ORM)

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

### 7.3 Audit Log Immutability

- Audit logs are append-only (INSERT operations only)
- No UPDATE or DELETE endpoints exist for audit logs
- Logs are ordered by `created_at DESC` for display
- Latest 200 entries returned via API (with pagination potential)

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

## 9. Compliance Matrix (NFR-SEC)

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

---

## 10. Signal Handling and Resilience

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

## 11. Known Limitations and Recommendations

### 11.1 Current Limitations

| Area | Limitation | Risk Level | Recommendation |
|------|-----------|------------|----------------|
| Session Store | MemoryStore (not persistent) | Medium | Use Redis or PostgreSQL session store for production clusters |
| Cookie Secure | Set to `false` by default | High | Set `cookie.secure = true` when HTTPS is configured |
| Rate Limiting | Not implemented on API endpoints | Medium | Add rate limiting middleware (e.g., express-rate-limit) |
| CORS | Not explicitly configured | Low | Configure CORS headers if frontend is served from different origin |
| CSP | No Content Security Policy headers | Low | Add CSP headers via middleware or reverse proxy |
| MFA | Not implemented | Medium | Consider adding TOTP-based multi-factor authentication |
| Password History | Not tracked | Low | Track previous password hashes to prevent reuse |
| Session Clustering | MemoryStore is single-node only | High | Use Redis for multi-node deployments |

### 11.2 Production Hardening Recommendations

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

---

## 12. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Officer | | | |
| Technical Lead | | | |
| Compliance Officer | | | |
| Client Representative | | | |
