# Production Security Release Gate

## What UCH can prove in the repository

- TypeScript, unit and browser regression suites are run in CI.
- Authentication, session, CSRF, RBAC, country/organisation scope and maker-checker controls have automated coverage.
- Auto-login is disabled in production by default.
- External registry credential validation requires HTTPS in production and rejects unsafe direct private/metadata URL patterns.
- The documented deployment design requires HTTPS, closed application/database ports and a non-default session secret.

The detailed internal findings and residual dependency risk are in [`Security_Audit_2026-07-29.md`](Security_Audit_2026-07-29.md).

## Non-negotiable external gates (cannot be self-certified from this laptop)

| Gate | Evidence required | Owner | Status before bank production |
|---|---|---|---|
| TLS/proxy/firewall | HTTPS scan; only 443 public; 5000/5432 closed; SSH key-only/restricted | Server administrator | Required |
| Backup restore | Dated restore drill proving application and PostgreSQL recovery | Server administrator + data owner | Required |
| Secrets | Production secret inventory, rotation owner, no demo/admin credentials | Security owner | Required |
| SSO/MFA | Bank-owned IdP acceptance for every role, deprovisioning and recovery test | Bank IAM owner | Required |
| Dependency risk | Decision/remediation for the Excel/archive dependency advisory | Engineering + security | Required |
| Independent pen test | Auth, IDOR/tenant isolation, business logic, API and infrastructure report | Independent assessor | Required |
| Incident exercise | Named contacts, containment, notification and rollback evidence | Bank + UCH | Required |

## Release decision

**A green CI run is necessary but not sufficient for bank production.** Release only when every applicable gate has a named owner, dated evidence and a documented exception accepted by the bank’s authorised risk owner. Until then, UCH is suitable for a controlled demo/sandbox/pilot scope only.
