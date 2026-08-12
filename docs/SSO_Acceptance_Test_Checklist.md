# Institutional SSO Acceptance Test Checklist

Use this checklist once for each bank tenant and identity provider. It is deliberately separate from code tests: a passing automated OAuth smoke test does not prove a bank's live tenant configuration.

## Preconditions

- [ ] Public HTTPS canonical URL is set and the exact callback URI is registered with the provider.
- [ ] Client secrets are stored only in the server secret manager/environment.
- [ ] Two active staff users are provisioned for each intended UCH role; one inactive/unprovisioned identity is available for negative testing.
- [ ] Organisation and country scope, least-privilege role, MFA policy, privacy notice and support contacts are approved by the bank.

## Google Workspace / Microsoft Entra test evidence

- [ ] Sign in as each active user and confirm the correct role-specific landing destination and organisation/country scope.
- [ ] Confirm a valid provider identity with no active UCH user is rejected without creating an account.
- [ ] Confirm a suspended/inactive UCH user is rejected.
- [ ] Confirm logout terminates the application session and a fresh login is required.
- [ ] Confirm password lockout, TOTP enrolment/recovery and passkey enrolment/recovery follow the bank's policy.
- [ ] Record timestamp, user test identifier, browser/device, result and reviewer for every test; never record passwords, recovery codes or client secrets.

## SAML

- [ ] **Not applicable until UCH ships a vetted SAML implementation that validates signed assertions.** The legacy SAML route is intentionally blocked in production.

## Sign-off

| Role | Name | Date | Evidence reference |
|---|---|---|---|
| Bank identity administrator |  |  |  |
| Bank security owner |  |  |  |
| UCH implementation owner |  |  |  |
| Pilot business owner |  |  |  |
