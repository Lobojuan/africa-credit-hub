/**
 * OAuth Login Smoke Tests — End-to-End
 *
 * These tests exercise the complete OAuth initiation and callback paths for
 * both Google and Microsoft SSO without hitting real external providers.
 *
 * Strategy
 * ─────────
 * 1. Initiation tests: call the initiation endpoint with maxRedirects:0 so we
 *    can inspect the 302 Location header directly.  This "intercepts the
 *    provider redirect" at the HTTP layer and lets us assert every OAuth param
 *    (client_id, response_type, scope, state) before the browser would ever
 *    navigate to accounts.google.com or login.microsoftonline.com.
 *
 * 2. Happy-path tests: the initiation call sets the CSRF state in the session.
 *    We extract the state from the Location header, then call the callback
 *    endpoint with the E2E mock code (server skips real token exchange when
 *    ENABLE_E2E_TEST_AUTH=true) and verify the 302 destination and absence of
 *    error params.
 *
 * 3. State-mismatch tests: pre-seed a known state via /api/test/set-session,
 *    then call the callback with a tampered state and confirm the server
 *    redirects with error=invalid_state.
 *
 * All requests use page.request (which shares cookies with the browser page),
 * so session cookies are automatically propagated across calls.
 *
 * Mock credentials used in CI (set in playwright.config.ts webServer env and
 * in .github/workflows/oauth-smoke.yml):
 *   GOOGLE_CLIENT_ID    = mock-google-ci-client-id
 *   MICROSOFT_CLIENT_ID = mock-ms-ci-client-id
 *
 * The server accepts code="e2e-google-code" / code="e2e-ms-code" only when
 * ENABLE_E2E_TEST_AUTH=true (see server/routes/oauth.ts).
 */

import { test, expect } from "@playwright/test";

const E2E_GOOGLE_CODE = "e2e-google-code";
const E2E_MS_CODE = "e2e-ms-code";

// ─── Google OAuth ─────────────────────────────────────────────────────────────

test.describe("Google OAuth — smoke tests", () => {
  test("initiates OAuth redirect to accounts.google.com with correct params", async ({ page }) => {
    // Call the initiation endpoint and stop at the 302 without following it.
    // This is the "intercept the provider redirect" step.
    const resp = await page.request.get(
      "/api/consumer/auth/google?from=/my-credit",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const location = resp.headers()["location"];
    expect(location, "Location header must be present").toBeTruthy();

    const redirectUrl = new URL(location);
    expect(redirectUrl.hostname).toBe("accounts.google.com");
    expect(redirectUrl.searchParams.get("response_type")).toBe("code");
    expect(redirectUrl.searchParams.get("scope")).toContain("openid");
    expect(redirectUrl.searchParams.get("scope")).toContain("email");
    expect(redirectUrl.searchParams.get("scope")).toContain("profile");

    const state = redirectUrl.searchParams.get("state");
    expect(state, "A CSRF state token must be included").toBeTruthy();
    expect(state!.length).toBeGreaterThan(8);

    const clientId = redirectUrl.searchParams.get("client_id");
    expect(clientId, "client_id must be present in the authorization URL").toBeTruthy();
  });

  test("happy path: callback with mock code creates a consumer session and redirects correctly", async ({ page }) => {
    // Step 1: initiate — gets the CSRF state stored in the session cookie.
    const initResp = await page.request.get(
      "/api/consumer/auth/google?from=/my-credit",
      { maxRedirects: 0 },
    );
    expect(initResp.status()).toBe(302);

    // Step 2: extract the state from the Google auth URL in the Location header.
    const googleAuthUrl = new URL(initResp.headers()["location"]);
    const oauthState = googleAuthUrl.searchParams.get("state");
    expect(oauthState, "OAuth state must be present in the authorization URL").not.toBeNull();

    // Step 3: call the callback with the E2E mock code + captured state.
    // The session cookie from Step 1 is included automatically (page.request
    // shares the browser cookie jar).
    // The server's E2E test-mode bypass (ENABLE_E2E_TEST_AUTH=true) creates a
    // consumer session directly, skipping the real token exchange.
    const callbackResp = await page.request.get(
      `/api/consumer/auth/google/callback?code=${E2E_GOOGLE_CODE}&state=${oauthState}`,
      { maxRedirects: 0 },
    );

    expect(callbackResp.status()).toBe(302);
    const location = callbackResp.headers()["location"];
    expect(location).toBe("/my-credit");
    expect(location).not.toContain("error=");

    // Step 4: verify a valid authenticated session was created.
    // The new session cookie set by the callback is automatically stored by
    // page.request; this call confirms the session carries a consumerId.
    const sessionResp = await page.request.get("/api/test/get-session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json() as Record<string, unknown>;
    expect(session.consumerId, "Session must contain a consumerId after Google OAuth").toBeTruthy();
    expect(session.consumerId).toBe("e2e-google-consumer-test");
  });

  test("state mismatch: callback redirects with invalid_state error", async ({ page }) => {
    // Pre-seed a known OAuth state in the session via the test helper.
    const seedResp = await page.request.post("/api/test/set-session", {
      data: {
        googleOAuthState: "correct-google-state-e2e",
        googleOAuthReturnTo: "/my-credit",
      },
    });
    expect(seedResp.ok()).toBeTruthy();

    // Call the callback with a deliberately WRONG state value.
    const resp = await page.request.get(
      "/api/consumer/auth/google/callback?code=any-code&state=tampered-wrong-state",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);
    const location = resp.headers()["location"];
    expect(location).toContain("error=invalid_state");
    expect(location).not.toBe("/my-credit");
  });
});

// ─── Microsoft SSO ────────────────────────────────────────────────────────────

test.describe("Microsoft SSO — smoke tests", () => {
  /**
   * Skip gracefully when the server is running without MICROSOFT_CLIENT_ID
   * (e.g. a local dev server without MS credentials).  In CI the oauth-smoke
   * workflow always sets MICROSOFT_CLIENT_ID=mock-ms-ci-client-id so the skip
   * never fires there.
   */
  async function requireMicrosoftConfigured(page: import("@playwright/test").Page) {
    const probe = await page.request.get("/api/auth/microsoft", { maxRedirects: 0 });
    if (probe.status() === 503) {
      test.skip(true, "MICROSOFT_CLIENT_ID not set — skipping MS SSO smoke tests");
    }
  }

  test("initiates OAuth redirect to login.microsoftonline.com with correct params", async ({ page }) => {
    await requireMicrosoftConfigured(page);

    const resp = await page.request.get(
      "/api/auth/microsoft?from=/dashboard",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const location = resp.headers()["location"];
    expect(location, "Location header must be present").toBeTruthy();

    const redirectUrl = new URL(location);
    expect(redirectUrl.hostname).toBe("login.microsoftonline.com");
    expect(redirectUrl.searchParams.get("response_type")).toBe("code");
    expect(redirectUrl.searchParams.get("scope")).toContain("openid");
    expect(redirectUrl.searchParams.get("scope")).toContain("email");

    const state = redirectUrl.searchParams.get("state");
    expect(state, "A CSRF state token must be included").toBeTruthy();
    expect(state!.length).toBeGreaterThan(8);

    const clientId = redirectUrl.searchParams.get("client_id");
    expect(clientId, "client_id must be present in the authorization URL").toBeTruthy();
  });

  test("happy path: callback with mock code creates an admin session and redirects to /dashboard", async ({ page }) => {
    await requireMicrosoftConfigured(page);

    // Step 1: initiate — store the CSRF state in the session.
    const initResp = await page.request.get(
      "/api/auth/microsoft?from=/dashboard",
      { maxRedirects: 0 },
    );
    expect(initResp.status()).toBe(302);

    // Step 2: extract state from the Microsoft auth URL.
    const msAuthUrl = new URL(initResp.headers()["location"]);
    const oauthState = msAuthUrl.searchParams.get("state");
    expect(oauthState, "OAuth state must be present in the authorization URL").not.toBeNull();

    // Step 3: complete the callback with the E2E mock code + captured state.
    const callbackResp = await page.request.get(
      `/api/auth/microsoft/callback?code=${E2E_MS_CODE}&state=${oauthState}`,
      { maxRedirects: 0 },
    );

    expect(callbackResp.status()).toBe(302);
    const location = callbackResp.headers()["location"];
    expect(location).toBe("/dashboard");
    expect(location).not.toContain("error=");

    // Step 4: verify a valid authenticated admin session was created.
    const sessionResp = await page.request.get("/api/test/get-session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json() as Record<string, unknown>;
    expect(session.userId, "Session must contain a userId after Microsoft SSO").toBeTruthy();
    expect(session.userId).toBe("e2e-ms-admin-test-user");
    expect(session.userRole).toBe("admin");
  });

  test("state mismatch: callback redirects with invalid_state error", async ({ page }) => {
    await requireMicrosoftConfigured(page);

    // Pre-seed a known OAuth state.
    const seedResp = await page.request.post("/api/test/set-session", {
      data: {
        microsoftOAuthState: "correct-ms-state-e2e",
        microsoftOAuthReturnTo: "/dashboard",
      },
    });
    expect(seedResp.ok()).toBeTruthy();

    // Call the callback with a WRONG state.
    const resp = await page.request.get(
      "/api/auth/microsoft/callback?code=any-code&state=tampered-ms-wrong-state",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);
    const location = resp.headers()["location"];
    expect(location).toContain("error=invalid_state");
    expect(location).not.toBe("/dashboard");
  });
});
