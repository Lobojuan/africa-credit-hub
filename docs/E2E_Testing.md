# Safe local browser testing

Universal Credit Hub browser tests run against a dedicated, disposable PostgreSQL database. They never use the database configured for the normal local application.

## One-time local setup

Create an empty database named `universal_credit_hub_e2e` in the same PostgreSQL instance as your local UCH database. Then run a browser test normally:

```bash
npx playwright test --project=authenticated-chromium
```

The Playwright configuration applies the schema and seeds deterministic multi-country test records before it starts the application on port `5001`. Ghana-only demo cleanup is explicitly disabled in this disposable environment so cross-country regression coverage remains intact.

Alternatively set `E2E_DATABASE_URL` in your local environment. Its database name must include `e2e` or `test`; the test runner refuses any other name as a safety guard.

## What the guard protects

Browser tests create, update, and delete data. They also seed PII encrypted with an E2E-only key. Keeping this separate prevents them from mutating working bank/demo records or trying to decrypt data encrypted with a historical local key.

Do not use `E2E_REUSE_EXISTING_SERVER=true` except when deliberately testing a separately managed disposable environment.
