# Registry Credential Cutover Runbook

**Document Version:** 1.0  
**Date:** April 2026  
**Classification:** Confidential — Internal Operations

---

## Overview

The Africa Credit Hub asset-trace system uses live government registry APIs when production credentials are available, and falls back to a deterministic sandbox when they are not. Credentials are configured entirely through environment secrets — no code changes are required to switch from sandbox to live.

This runbook documents the exact steps to activate production credentials for each supported African vehicle and property registry.

---

## How the Switch Works

Each registry adapter in `server/asset-trace.ts` checks environment variables at call time and supports **two authentication modes**.

### Static API Key Mode

| Registry | URL variable | Key variable |
|---|---|---|
| Ghana DVLA (vehicles) | `GHANA_DVLA_API_URL` | `GHANA_DVLA_API_KEY` |
| South Africa NaTIS (vehicles) | `SA_NATIS_API_URL` | `SA_NATIS_API_KEY` |
| Ghana Lands Commission (property) | `GHANA_LANDS_API_URL` | `GHANA_LANDS_API_KEY` |
| Kenya NTSA (vehicles) | `KENYA_NTSA_API_URL` | `KENYA_NTSA_API_KEY` |
| Nigeria FRSC/MVAA (vehicles) | `NIGERIA_FRSC_API_URL` | `NIGERIA_FRSC_API_KEY` |
| Uganda URSB (vehicles) | `UGANDA_URSB_API_URL` | `UGANDA_URSB_API_KEY` |
| Ethiopia MVAA (vehicles) | `ETHIOPIA_MVAA_API_URL` | `ETHIOPIA_MVAA_API_KEY` |

### OAuth 2.0 Client Credentials Mode

Some registries (e.g. Nigeria FRSC, South Africa NaTIS) issue short-lived bearer tokens via OAuth 2.0 instead of a static API key. Set the following three variables to enable OAuth for a registry — **OAuth takes priority over the API key variable** when all three are present.

| Registry | Token URL variable | Client ID variable | Client Secret variable |
|---|---|---|---|
| Ghana DVLA | `GHANA_DVLA_TOKEN_URL` | `GHANA_DVLA_CLIENT_ID` | `GHANA_DVLA_CLIENT_SECRET` |
| South Africa NaTIS | `SA_NATIS_TOKEN_URL` | `SA_NATIS_CLIENT_ID` | `SA_NATIS_CLIENT_SECRET` |
| Ghana Lands Commission | `GHANA_LANDS_TOKEN_URL` | `GHANA_LANDS_CLIENT_ID` | `GHANA_LANDS_CLIENT_SECRET` |
| Kenya NTSA | `KENYA_NTSA_TOKEN_URL` | `KENYA_NTSA_CLIENT_ID` | `KENYA_NTSA_CLIENT_SECRET` |
| Nigeria FRSC/MVAA | `NIGERIA_FRSC_TOKEN_URL` | `NIGERIA_FRSC_CLIENT_ID` | `NIGERIA_FRSC_CLIENT_SECRET` |
| Uganda URSB | `UGANDA_URSB_TOKEN_URL` | `UGANDA_URSB_CLIENT_ID` | `UGANDA_URSB_CLIENT_SECRET` |
| Ethiopia MVAA | `ETHIOPIA_MVAA_TOKEN_URL` | `ETHIOPIA_MVAA_CLIENT_ID` | `ETHIOPIA_MVAA_CLIENT_SECRET` |

The `*_API_URL` variable is still required to identify the registry API base URL — only authentication changes.

**Logic:**
- If the URL variable and all three OAuth variables are **set** → adapter fetches a bearer token using the OAuth 2.0 client credentials grant, caches it in memory, and sends `Authorization: Bearer <token>` on each request. Tokens are refreshed automatically 60 seconds before expiry.
- If the URL variable and the API key variable are **set** (and OAuth vars are absent) → adapter sends the key in the `X-Api-Key` header (static API key mode, unchanged behaviour).
- If both variables are **absent** → adapter returns `status: "stub"` (deterministic, offline).
- If both variables point at **localhost / 127.0.0.1** → adapter calls the built-in sandbox and the System Status page shows **Sandbox** (amber).
- If the URL points at a **non-localhost URL** → adapter calls the live government API and the System Status page shows **Live** (green).

The API contract expected from every live registry endpoint is:

```
POST {REGISTRY_URL}/lookup
Headers: Authorization: Bearer <token>   (OAuth mode)
         X-Api-Key: {REGISTRY_KEY}        (static key mode)
         Content-Type: application/json
Body:    { "reference": "<plate/title number>", "provider": "<provider_id>" }

Response:
{
  "found": true | false,
  "description": "Toyota Corolla 2019 (White)",   // optional
  "estimatedValue": 85000,                         // optional, in local currency
  "currency": "GHS",                              // optional
  "data": { ... }                                 // optional — raw registry record
}
```

---

## Step-by-Step: Activating Production Credentials (Static API Key)

### Step 1 — Obtain credentials from the registry authority

Contact the registry authority and request:
- A **base API URL** (e.g. `https://api.dvla.gov.gh`)
- A **production API key**

Keep both values secure. Do not share them in email or chat without encryption.

### Step 2 — Store credentials as Replit Secrets

In the Replit project:
1. Open the **Secrets** tab (lock icon in the sidebar).
2. Delete (or update) the existing secret for the URL variable (e.g. `GHANA_DVLA_API_URL`). Remove the `http://localhost:5000/…` value.
3. Set `GHANA_DVLA_API_URL` to the production base URL (e.g. `https://api.dvla.gov.gh`).
4. Set `GHANA_DVLA_API_KEY` to the production API key issued by the registry.

> **Important:** Secrets override development environment variables of the same name. Confirm the old localhost value is removed before setting the production value, otherwise the previous env var and the new secret may conflict depending on environment scope.

### Step 3 — Restart the application

After updating secrets, restart the application workflow (`Start application`). The adapter reads environment variables at call time, so a restart is required for the new values to take effect.

### Step 4 — Validate on the System Status page

Navigate to **System Status** (`/system-status`) as an admin or super-admin. The **Asset Registry Connections** panel should now show a **green "Live"** badge for the registry you updated.

If it still shows **Sandbox** or **Stub**, verify:
- The URL variable does not contain `localhost`, `127.0.0.1`, or `registry-sandbox`.
- Both variables (URL and KEY) are set.
- The application was restarted after the secrets were saved.

### Step 5 — Validate with a real plate / title lookup

1. Open a borrower record in the system.
2. Navigate to **Asset Trace** and run a lookup against the newly-live registry.
3. Confirm the response shows `status: "found"` and the vehicle / property details match real data.
4. Check `rawResponse.source` — it should be `"live"` (not `"sandbox"` or absent).

### Step 6 — Disable the sandbox route for this registry (optional)

Once a registry is fully live, the sandbox endpoint at  
`/api/registry-sandbox/{provider}/lookup` remains available but is unreachable when credentials point elsewhere. You do not need to remove the sandbox code; it serves the remaining stub registries.

If you wish to fully remove a sandbox route to reduce attack surface, edit `server/registry-sandbox.ts` and delete the corresponding handler.

---

## Step-by-Step: Activating Production Credentials (OAuth 2.0)

Use this section when the registry authority issues OAuth 2.0 client credentials instead of (or in addition to) a static API key.

### Step 1 — Obtain OAuth credentials from the registry authority

Contact the registry authority and request:
- A **base API URL** for the registry lookup endpoint (e.g. `https://api.frsc.gov.ng`)
- An **OAuth 2.0 token endpoint URL** (e.g. `https://auth.frsc.gov.ng/oauth/token`)
- A **client ID**
- A **client secret**

Confirm that the authority uses the **client credentials grant** (`grant_type=client_credentials`). This is the only OAuth flow supported by the system.

Keep all values secure. Do not share them in email or chat without encryption.

### Step 2 — Store OAuth credentials as Replit Secrets

In the Replit project:
1. Open the **Secrets** tab (lock icon in the sidebar).
2. Set the registry's `*_API_URL` secret to the production base API URL (e.g. `NIGERIA_FRSC_API_URL` = `https://api.frsc.gov.ng`).
3. Set the three OAuth secrets for that registry. Using Nigeria FRSC as an example:
   - `NIGERIA_FRSC_TOKEN_URL` = `https://auth.frsc.gov.ng/oauth/token`
   - `NIGERIA_FRSC_CLIENT_ID` = `<your client ID>`
   - `NIGERIA_FRSC_CLIENT_SECRET` = `<your client secret>`
4. The `*_API_KEY` secret is **not required** when OAuth vars are set — but leave it in place if it was already configured; it will simply be ignored.

> **Note:** When all three OAuth secrets are present, the system will use the OAuth flow and ignore the API key variable. This is true even if the API key variable is also set.

### Step 3 — Restart the application

After updating secrets, restart the application workflow (`Start application`). Environment variables are read at call time, so a restart ensures the new secrets are loaded.

### Step 4 — Validate on the System Status page

Navigate to **System Status** (`/system-status`) as an admin or super-admin. The **Asset Registry Connections** panel should now show a **green "Live"** badge for the registry.

If it still shows **Stub**, verify:
- `*_API_URL` is set.
- All three OAuth secrets (`*_TOKEN_URL`, `*_CLIENT_ID`, `*_CLIENT_SECRET`) are set.
- The application was restarted after saving secrets.

### Step 5 — Validate with a real plate / title lookup

1. Open a borrower record in the system.
2. Navigate to **Asset Trace** and run a lookup against the newly-live registry.
3. Confirm the response shows `status: "found"` and the vehicle details match real data.
4. Monitor the server logs for `[AssetTrace] OAuth token refreshed for <provider>` — this confirms the token exchange succeeded.

### OAuth Rollback

To revert to static API key mode: remove (or unset) the three OAuth secrets (`*_TOKEN_URL`, `*_CLIENT_ID`, `*_CLIENT_SECRET`) and ensure `*_API_KEY` is set. Restart the application.

To revert to sandbox: set `*_API_URL` to the sandbox URL (e.g. `http://localhost:5000/api/registry-sandbox/<provider>`), remove the OAuth secrets, and set `*_API_KEY` to the sandbox key. Restart the application.

---

## Registry-Specific Notes

### Ghana DVLA (Motor Vehicle Registry)
- **Provider ID:** `ghana_dvla`
- **Currency:** GHS
- **Expected reference format:** Ghana number plate (e.g. `GR-1234-21`)
- **Authority contact:** Ghana Driver and Vehicle Licensing Authority — https://dvla.gov.gh
- **Credential variables:** `GHANA_DVLA_API_URL`, `GHANA_DVLA_API_KEY`

### South Africa NaTIS (eNaTIS Vehicle Registry)
- **Provider ID:** `sa_natis`
- **Currency:** ZAR
- **Expected reference format:** South Africa registration number (e.g. `CA 123-456`)
- **Authority contact:** Department of Transport — https://www.enatis.com
- **Credential variables:** `SA_NATIS_API_URL`, `SA_NATIS_API_KEY`

### Ghana Lands Commission (Property Registry)
- **Provider ID:** `ghana_lands`
- **Currency:** GHS
- **Expected reference format:** Title deed reference number
- **Authority contact:** Ghana Lands Commission — https://lc.gov.gh
- **Credential variables:** `GHANA_LANDS_API_URL`, `GHANA_LANDS_API_KEY`

### Kenya NTSA (Transport and Safety Authority)
- **Provider ID:** `kenya_ntsa`
- **Currency:** KES
- **Expected reference format:** Kenya number plate (e.g. `KCA 001A`)
- **Authority contact:** National Transport and Safety Authority — https://ntsa.go.ke
- **Credential variables:** `KENYA_NTSA_API_URL`, `KENYA_NTSA_API_KEY`

### Nigeria FRSC / MVAA (Road Safety & Motor Vehicle Administration)
- **Provider ID:** `nigeria_frsc`
- **Currency:** NGN
- **Expected reference format:** Nigeria number plate (e.g. `ABC-123-DE`)
- **Authority contacts:** Federal Road Safety Corps — https://frsc.gov.ng; Motor Vehicle Administration Agency — https://mvaa.gov.ng
- **Credential variables:** `NIGERIA_FRSC_API_URL`, `NIGERIA_FRSC_API_KEY`

### Uganda URSB (Motor Vehicle Registry)
- **Provider ID:** `uganda_ursb_motor`
- **Currency:** UGX
- **Expected reference format:** Uganda number plate (e.g. `UAP 123B`)
- **Authority contact:** Uganda Registration Services Bureau — https://ursb.go.ug
- **Credential variables:** `UGANDA_URSB_API_URL`, `UGANDA_URSB_API_KEY`

### Ethiopia MVAA (Motor Vehicle Administration Agency)
- **Provider ID:** `ethiopia_motor`
- **Currency:** ETB
- **Expected reference format:** Ethiopian number plate
- **Authority contact:** Ethiopia Motor Vehicle Administration Agency
- **Credential variables:** `ETHIOPIA_MVAA_API_URL`, `ETHIOPIA_MVAA_API_KEY`

---

## Rollback Procedure

If a live registry integration causes errors (timeouts, authentication failures, malformed responses), the adapter logs errors to the server console with the prefix `[AssetTrace]` and returns `status: "error"` rather than crashing.

To roll back to sandbox:
1. Update the URL secret to the sandbox value: `http://localhost:5000/api/registry-sandbox/{provider}`
2. Update the KEY secret to the corresponding sandbox key (e.g. `sbx-ghana-dvla-2025`).
3. Restart the application.

The System Status page will revert to showing **Sandbox** (amber).

---

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| Status page shows Stub (grey) | Env vars are absent | Set `*_API_URL` and either `*_API_KEY` or all three OAuth secrets, then restart |
| Status page shows Sandbox (amber) | URL contains localhost | Update URL secret to production URL, restart app |
| Test button shows "Failed" with HTTP 404 | Registry returns 404 for unknown plates (expected) — credentials are valid | The probe "TEST-PROBE" reference is intentionally synthetic. A 404 response is treated as reachable. If the System Status page still shows "Failed", the registry may use a non-standard error format — run a real plate lookup to confirm |
| Status page shows Live but lookups return `error` | Invalid API key or wrong URL path | Verify credentials with registry authority; check server logs |
| Timeout errors in server logs | Registry API slow or unreachable | Check network egress rules; consider increasing `timeoutMs` in `callLiveRegistry()` |
| `status: "not_found"` on known plates | Plate format mismatch | Confirm reference format with registry authority; normalize plate number |
| Server log: `OAuth token request failed (401)` | Wrong client ID or client secret | Verify `*_CLIENT_ID` and `*_CLIENT_SECRET` secrets with the registry authority |
| Server log: `OAuth token request failed (400)` | Registry does not support client credentials grant, or wrong token URL | Confirm the token URL and grant type with the registry authority |
| Server log: `OAuth token request failed` on first lookup, then succeeds | Transient network issue during token fetch | The cache is empty on first request — retry the lookup; subsequent requests will use the cached token |

---

## Security Considerations

- Never commit API keys or OAuth secrets to the codebase. All credentials must be stored as Replit Secrets.
- In static API key mode, `callLiveRegistry()` sends the key in the `X-Api-Key` header. In OAuth mode, it sends a short-lived bearer token in the `Authorization: Bearer` header. Always use `https://` for both the registry API URL and the OAuth token URL.
- OAuth tokens are cached in memory (per server process) and refreshed automatically 60 seconds before expiry. A server restart clears the token cache; the first request after restart will perform a fresh token exchange.
- The OAuth client secret is stored as a Replit Secret and is never logged or exposed in responses.
- Rotate API keys and OAuth client secrets periodically and whenever team members with access leave. Update the Replit Secret immediately and restart the application.

---

*End of Runbook*
