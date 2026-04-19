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

Each registry adapter in `server/asset-trace.ts` checks two environment variables at call time:

| Registry | URL variable | Key variable |
|---|---|---|
| Ghana DVLA (vehicles) | `GHANA_DVLA_API_URL` | `GHANA_DVLA_API_KEY` |
| South Africa NaTIS (vehicles) | `SA_NATIS_API_URL` | `SA_NATIS_API_KEY` |
| Ghana Lands Commission (property) | `GHANA_LANDS_API_URL` | `GHANA_LANDS_API_KEY` |
| Kenya NTSA (vehicles) | `KENYA_NTSA_API_URL` | `KENYA_NTSA_API_KEY` |
| Nigeria FRSC/MVAA (vehicles) | `NIGERIA_FRSC_API_URL` | `NIGERIA_FRSC_API_KEY` |
| Uganda URSB (vehicles) | `UGANDA_URSB_API_URL` | `UGANDA_URSB_API_KEY` |
| Ethiopia MVAA (vehicles) | `ETHIOPIA_MVAA_API_URL` | `ETHIOPIA_MVAA_API_KEY` |

**Logic:**
- If both variables are **absent** → adapter returns `status: "stub"` (deterministic, offline).
- If both variables point at **localhost / 127.0.0.1** → adapter calls the built-in sandbox and the System Status page shows **Sandbox** (amber).
- If both variables point at a **non-localhost URL** → adapter calls the live government API and the System Status page shows **Live** (green).

The API contract expected from every live registry endpoint is:

```
POST {REGISTRY_URL}/lookup
Headers: X-Api-Key: {REGISTRY_KEY}
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

## Step-by-Step: Activating Production Credentials

### Step 1 — Obtain credentials from the registry authority

Contact the registry authority and request:
- A **base API URL** (e.g. `https://api.dvla.gov.gh`)
- A **production API key** or bearer token

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
| Status page shows Stub (grey) | Both env vars are absent | Set both `*_API_URL` and `*_API_KEY` secrets |
| Status page shows Sandbox (amber) | URL contains localhost | Update URL secret to production URL, restart app |
| Test button shows "Failed" with HTTP 404 | Registry returns 404 for unknown plates (expected) — credentials are valid | The probe "TEST-PROBE" reference is intentionally synthetic. A 404 response is treated as reachable. If the System Status page still shows "Failed", the registry may use a non-standard error format — run a real plate lookup to confirm |
| Status page shows Live but lookups return `error` | Invalid API key or wrong URL path | Verify credentials with registry authority; check server logs |
| Timeout errors in server logs | Registry API slow or unreachable | Check network egress rules; consider increasing `timeoutMs` in `callLiveRegistry()` |
| `status: "not_found"` on known plates | Plate format mismatch | Confirm reference format with registry authority; normalize plate number |

---

## Security Considerations

- Never commit API keys to the codebase. All credentials must be stored as Replit Secrets.
- The `callLiveRegistry()` function sends the API key in the `X-Api-Key` header over HTTPS. Ensure the production API URL uses `https://`.
- If a registry uses OAuth bearer tokens instead of a static API key, the adapter in `server/asset-trace.ts` will need to be extended to handle token refresh. Contact the engineering team to implement this before going live.
- Rotate API keys periodically and whenever team members leave. Update the Replit Secret immediately and restart the application.

---

*End of Runbook*
