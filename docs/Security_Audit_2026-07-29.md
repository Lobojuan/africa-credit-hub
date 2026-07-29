# Security Audit — 29 July 2026

## Executive summary

UCH has a solid application-security baseline: server-side PostgreSQL sessions, production cookie flags, CSRF enforcement, production CORS allowlisting, Helmet/CSP, rate limits, MFA/WebAuthn and country/organisation-scoped authorisation are implemented. This audit does **not** certify a live deployment, a bank integration, or external infrastructure controls.

One critical guide-login issue was corrected and pushed in commit `af745b9`: the route no longer accepts a master secret in a URL and is unavailable in production.

## Findings

### SEC-001 — Critical — fixed: master-secret URL auto-login

- **Location:** `server/routes/auth.ts:688-729` (previously a GET route accepting `?token=`).
- **Impact:** A master secret in a URL could be retained in browser history, proxy/application logs or referrer data and could create a privileged session.
- **Fix:** Production now returns 404; local guide mode requires `ENABLE_GUIDE_AUTO_LOGIN=true`, a POST body, timing-safe secret comparison and a validated local redirect.

### SEC-002 — High — runtime dependency remediation required

- **Evidence:** `npm audit --omit=dev` reports nine high findings through `exceljs` → `archiver`/`glob`/`brace-expansion`.
- **Impact:** Archive generation/parsing dependencies may be exposed to denial-of-service conditions when processing untrusted workbook/archive content.
- **Fix:** Upgrade or replace the affected production dependency chain only after compatibility testing; do not use a blind `npm audit fix` on a banking platform.
- **Mitigation now:** Maintain strict upload-size and type controls, restrict batch-ingestion roles, and process large/untrusted imports outside the web request path.

### SEC-003 — Medium — registry credential test endpoint needs allowlisted egress

- **Location:** `server/routes/platform-control.ts:1305-1396`.
- **Evidence:** A master-authorised tester accepts a supplied `apiUrl`; it blocks textual private-address patterns but permits arbitrary public hosts and does not resolve DNS before connecting.
- **Impact:** A privileged user could cause an outbound connection carrying a registry API key to an unapproved endpoint; hostname rebinding is not fully addressed by string checks.
- **Fix:** Persist and allowlist verified provider hostnames, require HTTPS in production, resolve and reject private/link-local addresses before every connection, and disable redirects.

### SEC-004 — Medium — proxy topology must be verified on the server

- **Location:** `server/index.ts:107`.
- **Evidence:** `app.set("trust proxy", 1)` assumes exactly one trusted proxy hop.
- **Impact:** If the Hetzner/Caddy/Cloudflare path differs, forwarded IP/protocol data can be incorrect and affect rate limiting, audit IPs or secure-cookie behaviour.
- **Fix:** Verify the exact production proxy chain and configure an explicit trusted proxy subnet/function or documented hop count; test from the public domain.

### SEC-005 — Low — translation HTML needs an explicit trusted-content boundary

- **Location:** `client/src/pages/investor-landing.tsx:739-745`.
- **Evidence:** Two translation values use `dangerouslySetInnerHTML`; other document surfaces correctly use DOMPurify, for example `client/src/pages/ghana-docs.tsx:395`.
- **Impact:** It is safe only while translations remain repository-controlled. A future CMS/localisation import could create stored XSS.
- **Fix:** Replace with React markup where feasible, or sanitize with an intentionally minimal allowlist before rendering.

## Confirmed controls

- `server/index.ts:291-314`: PostgreSQL-backed server sessions; `MemoryStore` is E2E-only.
- `server/index.ts:141-180`: strict production CORS and Helmet CSP/security headers.
- `server/index.ts:307-312`: Secure, HttpOnly, Lax session cookie in production.
- `server/routes/auth.ts`: password, MFA/TOTP, WebAuthn and recovery controls.
- `server/routes/oauth.ts` and `server/routes/saml.ts`: SSO provider readiness boundaries; legacy SAML is blocked in production.

## Required external verification

1. Verify server firewall, operating-system patching, SSH restrictions, secret manager, database TLS/certificates and backup restore on the Hetzner host.
2. Run independent penetration testing before a bank pilot.
3. Configure SCA/Dependabot and remediate the dependency finding with regression tests.
