/**
 * OAuth Login Smoke Tests — End-to-End
 *
 * These tests exercise the complete OAuth initiation and callback paths for
 * Google, Microsoft SSO, SAML, and Apple Sign-In without hitting real external
 * providers.
 *
 * The Playwright test server (port 5001) is always started fresh by
 * playwright.config.ts with a fixed set of env vars:
 *   CANONICAL_URL        = https://universalcredithub.com
 *   SAML_IDP_ENTRY_POINT = https://mock-idp.example.com/sso/saml
 *   GOOGLE_CLIENT_ID     = mock-google-ci-client-id
 *   MICROSOFT_CLIENT_ID  = mock-ms-ci-client-id
 *   ENABLE_E2E_TEST_AUTH = true
 *
 * Because the server is always configured in "production mode" (CANONICAL_URL
 * set), all assertions are unconditional: redirect_uri / ACS URL must always
 * match the exact universalcredithub.com production URLs.
 *
 * Strategy
 * ─────────
 * 1. Initiation tests: call the initiation endpoint with maxRedirects:0 so we
 *    can inspect the 302 Location header directly.  This "intercepts the
 *    provider redirect" at the HTTP layer and lets us assert every OAuth param
 *    (client_id, redirect_uri, response_type, scope, state) before the browser
 *    would ever navigate to accounts.google.com or login.microsoftonline.com.
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
 * Apple Sign-In is currently a 503 stub — no APPLE_CLIENT_ID is wired up yet.
 * When Apple credentials are configured, add APPLE_CLIENT_ID to the CI workflow
 * and the conditional happy-path / state-mismatch tests below will activate.
 *
 * The server accepts code="e2e-google-code" / code="e2e-ms-code" only when
 * ENABLE_E2E_TEST_AUTH=true (see server/routes/oauth.ts).
 */

import { test, expect } from "@playwright/test";

const E2E_GOOGLE_CODE = "e2e-google-code";
const E2E_MS_CODE = "e2e-ms-code";
const E2E_APPLE_CODE = "e2e-apple-code";

// Production callback URLs that must be registered at provider consoles.
// These are derived from CANONICAL_URL=https://universalcredithub.com (set in
// playwright.config.ts) and must never regress to localhost or a Replit domain.
const PROD_BASE = "https://universalcredithub.com";
const GOOGLE_PROD_CALLBACK = `${PROD_BASE}/api/consumer/auth/google/callback`;
const MICROSOFT_PROD_CALLBACK = `${PROD_BASE}/api/auth/microsoft/callback`;
const SAML_PROD_ACS = `${PROD_BASE}/api/auth/saml/callback`;

// Mock client IDs configured in playwright.config.ts webServer env.
const MOCK_GOOGLE_CLIENT_ID = "mock-google-ci-client-id";
const MOCK_MS_CLIENT_ID = "mock-ms-ci-client-id";
const MOCK_IDP_URL = "https://mock-idp.example.com/sso/saml";

// ─── Google OAuth ─────────────────────────────────────────────────────────────

test.describe("Google OAuth — smoke tests", () => {
  test("initiates OAuth redirect to accounts.google.com with correct params", async ({ page }) => {
    // Call the initiation endpoint and stop at the 302 without following it.
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

    // client_id must match the configured credential exactly
    expect(redirectUrl.searchParams.get("client_id")).toBe(MOCK_GOOGLE_CLIENT_ID);

    // state must be present: 32-char hex CSRF token stored in the session
    const state = redirectUrl.searchParams.get("state");
    expect(state, "A CSRF state token must be included").toBeTruthy();
    expect(state!.length).toBeGreaterThan(8);

    // redirect_uri must be the exact production callback URL.
    // CANONICAL_URL=https://universalcredithub.com is always set by
    // playwright.config.ts, so a regression to localhost or a Replit domain
    // will cause this assertion to fail immediately.
    expect(redirectUrl.searchParams.get("redirect_uri")).toBe(GOOGLE_PROD_CALLBACK);
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
  test("initiates OAuth redirect to login.microsoftonline.com with correct params", async ({ page }) => {
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

    // client_id must match the configured credential exactly
    expect(redirectUrl.searchParams.get("client_id")).toBe(MOCK_MS_CLIENT_ID);

    // state must be present: 32-char hex CSRF token stored in the session
    const state = redirectUrl.searchParams.get("state");
    expect(state, "A CSRF state token must be included").toBeTruthy();
    expect(state!.length).toBeGreaterThan(8);

    // redirect_uri must be the exact production callback URL.
    // CANONICAL_URL=https://universalcredithub.com is always set by
    // playwright.config.ts, so a regression to localhost will fail immediately.
    expect(redirectUrl.searchParams.get("redirect_uri")).toBe(MICROSOFT_PROD_CALLBACK);
  });

  test("happy path: callback with mock code creates an admin session and redirects to /dashboard", async ({ page }) => {
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

// ─── SAML SSO ─────────────────────────────────────────────────────────────────
//
// These tests hit the real /api/auth/saml/login handler in server/routes.ts.
// The playwright.config.ts webServer env always sets:
//   SAML_IDP_ENTRY_POINT = https://mock-idp.example.com/sso/saml
//   CANONICAL_URL        = https://universalcredithub.com
// so the handler always issues a redirect and the SAMLRequest always embeds
// the production ACS URL.  All assertions are unconditional.

test.describe("SAML SSO — smoke tests", () => {
  test("initiates redirect to IdP with a base64-encoded SAMLRequest param", async ({ page }) => {
    const resp = await page.request.get(
      "/api/auth/saml/login",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const location = resp.headers()["location"];
    expect(location, "Location header must be present").toBeTruthy();

    // Must redirect to the configured mock IdP entry point
    expect(location).toContain(MOCK_IDP_URL);

    // SAMLRequest query param must be present
    const url = new URL(location);
    const samlRequest = url.searchParams.get("SAMLRequest");
    expect(samlRequest, "SAMLRequest must be present in the redirect URL").toBeTruthy();

    // Value must be valid base64 that decodes to non-empty XML
    const decoded = Buffer.from(samlRequest!, "base64").toString("utf-8");
    expect(decoded.length).toBeGreaterThan(0);
    expect(decoded).toContain("AuthnRequest");
  });

  test("SAMLRequest AssertionConsumerServiceURL matches the production ACS URL", async ({ page }) => {
    const resp = await page.request.get(
      "/api/auth/saml/login",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const location = resp.headers()["location"];
    const samlRequest = new URL(location).searchParams.get("SAMLRequest")!;
    const xml = Buffer.from(samlRequest, "base64").toString("utf-8");

    // The ACS URL embedded in the SAMLRequest must be the exact production URL.
    // CANONICAL_URL=https://universalcredithub.com is always set by
    // playwright.config.ts, so a regression to localhost or a Replit domain
    // will cause this assertion to fail immediately.
    expect(xml).toContain(`AssertionConsumerServiceURL="${SAML_PROD_ACS}"`);

    // Confirm the production URL is clean — no localhost or internal addresses
    expect(xml).not.toContain("localhost");
    expect(xml).not.toContain("127.0.0.1");
  });

  test("SAMLRequest XML contains required SAML 2.0 AuthnRequest attributes", async ({ page }) => {
    const resp = await page.request.get(
      "/api/auth/saml/login",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const xml = Buffer.from(
      new URL(resp.headers()["location"]).searchParams.get("SAMLRequest")!,
      "base64",
    ).toString("utf-8");

    expect(xml).toContain("urn:oasis:names:tc:SAML:2.0:protocol");
    expect(xml).toContain('Version="2.0"');
    // ID attribute must be present (non-empty _<32hex> format)
    expect(xml).toMatch(/\bID="_[0-9a-f]{32}"/);
    // Issuer element must be present
    expect(xml).toContain("<saml:Issuer>");
  });

  test("samlRequestId stored in session matches ID attribute in SAMLRequest XML", async ({ page }) => {
    const resp = await page.request.get(
      "/api/auth/saml/login",
      { maxRedirects: 0 },
    );
    expect(resp.status()).toBe(302);

    // The session cookie from the initiation call is automatically held by
    // page.request; verify the server stored the request ID in the session.
    const sessionResp = await page.request.get("/api/test/get-session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json() as Record<string, unknown>;
    expect(session.samlRequestId, "samlRequestId must be in the session").toBeTruthy();
    expect(session.samlRequestId as string).toMatch(/^_[0-9a-f]{32}$/);

    // The ID stored in the session must match the ID attribute in the SAMLRequest
    // XML so the callback handler can validate InResponseTo.
    const xml = Buffer.from(
      new URL(resp.headers()["location"]).searchParams.get("SAMLRequest")!,
      "base64",
    ).toString("utf-8");
    expect(xml).toContain(`ID="${session.samlRequestId}"`);
  });
});

// ─── Apple Sign-In ────────────────────────────────────────────────────────────

test.describe("Apple Sign-In — smoke tests", () => {
  /**
   * Helper: returns true when the server has Apple credentials configured
   * (i.e. APPLE_CLIENT_ID is set and the initiation endpoint returns 302
   * rather than the 503 stub).  When credentials are absent every test in
   * this block still runs — it just asserts the stub behaviour instead of
   * the full OAuth flow.
   */
  async function appleIsConfigured(page: import("@playwright/test").Page): Promise<boolean> {
    const probe = await page.request.get("/api/consumer/auth/apple", { maxRedirects: 0 });
    return probe.status() === 302;
  }

  test("returns 503 with descriptive message when Apple credentials are absent", async ({ page }) => {
    const configured = await appleIsConfigured(page);
    if (configured) {
      test.skip(true, "APPLE_CLIENT_ID is set — stub 503 test not applicable in this environment");
    }

    const resp = await page.request.get("/api/consumer/auth/apple");
    expect(resp.status()).toBe(503);

    const body = await resp.text();
    expect(body).toContain("Apple Sign-In");
    expect(body).toContain("Apple Developer");
  });

  test("returns 302 to appleid.apple.com when Apple credentials are configured", async ({ page }) => {
    const configured = await appleIsConfigured(page);
    if (!configured) {
      test.skip(true, "APPLE_CLIENT_ID not set — skipping Apple configured-initiation check");
    }

    const resp = await page.request.get("/api/consumer/auth/apple", { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    const location = resp.headers()["location"];
    expect(location, "Location header must be present when Apple is configured").toBeTruthy();
    expect(new URL(location).hostname).toContain("apple.com");
  });

  test("initiation: redirects to appleid.apple.com with correct OAuth params when configured", async ({ page }) => {
    const configured = await appleIsConfigured(page);
    if (!configured) {
      test.skip(true, "APPLE_CLIENT_ID not set — skipping Apple Sign-In initiation test");
    }

    const resp = await page.request.get(
      "/api/consumer/auth/apple?from=/my-credit",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);

    const location = resp.headers()["location"];
    expect(location, "Location header must be present").toBeTruthy();

    const redirectUrl = new URL(location);
    expect(redirectUrl.hostname).toContain("apple.com");
    expect(redirectUrl.searchParams.get("response_type")).toContain("code");
    expect(redirectUrl.searchParams.get("scope")).toContain("email");

    const state = redirectUrl.searchParams.get("state");
    expect(state, "A CSRF state token must be included").toBeTruthy();
    expect(state!.length).toBeGreaterThan(8);

    const clientId = redirectUrl.searchParams.get("client_id");
    expect(clientId, "client_id must be present in the authorization URL").toBeTruthy();
  });

  test("happy path: callback with mock code creates a consumer session and redirects correctly", async ({ page }) => {
    const configured = await appleIsConfigured(page);
    if (!configured) {
      test.skip(true, "APPLE_CLIENT_ID not set — skipping Apple Sign-In happy-path test");
    }

    // Step 1: initiate — gets the CSRF state stored in the session cookie.
    const initResp = await page.request.get(
      "/api/consumer/auth/apple?from=/my-credit",
      { maxRedirects: 0 },
    );
    expect(initResp.status()).toBe(302);

    // Step 2: extract the state from the Apple auth URL in the Location header.
    const appleAuthUrl = new URL(initResp.headers()["location"]);
    const oauthState = appleAuthUrl.searchParams.get("state");
    expect(oauthState, "OAuth state must be present in the authorization URL").not.toBeNull();

    // Step 3: call the callback with the E2E mock code + captured state.
    const callbackResp = await page.request.get(
      `/api/consumer/auth/apple/callback?code=${E2E_APPLE_CODE}&state=${oauthState}`,
      { maxRedirects: 0 },
    );

    expect(callbackResp.status()).toBe(302);
    const location = callbackResp.headers()["location"];
    expect(location).toBe("/my-credit");
    expect(location).not.toContain("error=");

    // Step 4: verify a valid authenticated session was created.
    const sessionResp = await page.request.get("/api/test/get-session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json() as Record<string, unknown>;
    expect(session.consumerId, "Session must contain a consumerId after Apple Sign-In").toBeTruthy();
    expect(session.consumerId).toBe("e2e-apple-consumer-test");
  });

  test("state mismatch: callback redirects with invalid_state error when configured", async ({ page }) => {
    const configured = await appleIsConfigured(page);
    if (!configured) {
      test.skip(true, "APPLE_CLIENT_ID not set — skipping Apple Sign-In state-mismatch test");
    }

    // Pre-seed a known OAuth state in the session via the test helper.
    const seedResp = await page.request.post("/api/test/set-session", {
      data: {
        appleOAuthState: "correct-apple-state-e2e",
        appleOAuthReturnTo: "/my-credit",
      },
    });
    expect(seedResp.ok()).toBeTruthy();

    // Call the callback with a deliberately WRONG state value.
    const resp = await page.request.get(
      "/api/consumer/auth/apple/callback?code=any-code&state=tampered-apple-wrong-state",
      { maxRedirects: 0 },
    );

    expect(resp.status()).toBe(302);
    const location = resp.headers()["location"];
    expect(location).toContain("error=invalid_state");
    expect(location).not.toBe("/my-credit");
  });
});
