/**
 * SAML login unit tests — exercises the /api/auth/saml/login redirect flow.
 *
 * Tests import the real `registerSamlRoutes` and `getSamlAcsUrl` from
 * `server/routes/saml.ts` so that any change to the production handler is
 * immediately reflected here — no more hand-maintained replica code.
 *
 * See e2e/oauth-smoke.spec.ts for the end-to-end Playwright tests that hit the
 * real /api/auth/saml/login handler in a running server.
 */

import { describe, it, expect } from "vitest";
import express, { type Request, type Response } from "express";
import session from "express-session";
import request from "supertest";
import { registerSamlRoutes, type SamlDeps } from "../routes/saml";

// ─── No-op deps (login handler never calls DB methods) ───────────────────────

const stubDeps: SamlDeps = {
  async findUserByEmail() { return null; },
  async findConsumerByEmail() { return null; },
  async getOrganization() { return null; },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

async function buildSamlApp(env?: Record<string, string>) {
  const prevEnv: Record<string, string | undefined> = {};
  if (env) {
    for (const [k, v] of Object.entries(env)) {
      prevEnv[k] = process.env[k];
      process.env[k] = v;
    }
  }

  const app = express();
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  // Register the real SAML routes with stub deps (no DB wiring needed for login tests)
  await registerSamlRoutes(app, stubDeps);

  // Helper: expose session for assertions
  app.get("/test/get-session", (req: Request, res: Response) =>
    res.json(req.session)
  );

  return { app, prevEnv };
}

// ─── Helper: extract and decode the SAMLRequest from a redirect Location ──────

function decodeSamlRequest(location: string): string {
  const url = new URL(location);
  const encoded = url.searchParams.get("SAMLRequest");
  if (!encoded) throw new Error(`No SAMLRequest in location: ${location}`);
  return Buffer.from(encoded, "base64").toString("utf-8");
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const PROD_BASE = "https://universalcredithub.com";
const PROD_ACS = `${PROD_BASE}/api/auth/saml/callback`;
const FAKE_IDP = "https://idp.example.com/sso/saml";

describe("SAML login — no IdP configured", () => {
  it("returns 503 when SAML_IDP_ENTRY_POINT is not set", async () => {
    const { app, prevEnv } = await buildSamlApp({ SAML_IDP_ENTRY_POINT: "" });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(503);
      expect(res.text).toContain("Enterprise SSO");
    } finally {
      restoreEnv(prevEnv);
    }
  });
});

describe("SAML login — redirect structure", () => {
  it("redirects (302) to the configured IdP entry point", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/^https:\/\/idp\.example\.com/);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("includes a SAMLRequest query parameter in the redirect", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(302);
      const location = res.headers.location as string;
      const url = new URL(location);
      expect(url.searchParams.has("SAMLRequest")).toBe(true);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("SAMLRequest value is valid base64", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const location = res.headers.location as string;
      const url = new URL(location);
      const encoded = url.searchParams.get("SAMLRequest")!;
      // base64 should round-trip cleanly
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      expect(decoded.length).toBeGreaterThan(0);
      // Re-encode and confirm it matches (no corruption)
      expect(Buffer.from(decoded).toString("base64")).toBe(encoded);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("decoded SAMLRequest is an AuthnRequest XML document", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).toContain("AuthnRequest");
      expect(xml).toContain("urn:oasis:names:tc:SAML:2.0:protocol");
    } finally {
      restoreEnv(prevEnv);
    }
  });
});

describe("SAML login — production ACS URL (universalcredithub.com)", () => {
  it("SAMLRequest AssertionConsumerServiceURL matches production ACS URL when CANONICAL_URL is set", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(302);
      const xml = decodeSamlRequest(res.headers.location as string);
      // The ACS URL embedded in the SAMLRequest must point to the production
      // domain — this is the URL the IdP will POST the assertion back to.
      expect(xml).toContain(`AssertionConsumerServiceURL="${PROD_ACS}"`);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("SAMLRequest Destination matches the configured IdP entry point", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).toContain(`Destination="${FAKE_IDP}"`);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("ACS URL in SAMLRequest does not contain localhost when CANONICAL_URL is the production domain", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).not.toContain("localhost");
      expect(xml).not.toContain("127.0.0.1");
    } finally {
      restoreEnv(prevEnv);
    }
  });
});

describe("SAML login — session state", () => {
  it("stores samlRequestId in session after initiating login", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(302);

      const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
      const cookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? "");
      const sessionRes = await request(app)
        .get("/test/get-session")
        .set("Cookie", cookie);
      const sess = sessionRes.body as Record<string, unknown>;
      expect(sess.samlRequestId).toBeTruthy();
      // ID format: underscore followed by 32 hex chars
      expect(sess.samlRequestId as string).toMatch(/^_[0-9a-f]{32}$/);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("samlRequestId in session matches the ID attribute in the SAMLRequest XML", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
      const cookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? "");
      const sessionRes = await request(app)
        .get("/test/get-session")
        .set("Cookie", cookie);
      const sess = sessionRes.body as Record<string, unknown>;
      const samlRequestId = sess.samlRequestId as string;

      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).toContain(`ID="${samlRequestId}"`);
    } finally {
      restoreEnv(prevEnv);
    }
  });
});

describe("SAML login — issuer and IdP URL handling", () => {
  it("uses default issuer pan-african-credit-registry when SAML_ISSUER is not set", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
      SAML_ISSUER: "",
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).toContain(">pan-african-credit-registry<");
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("uses a custom SAML_ISSUER when provided", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
      SAML_ISSUER: "custom-issuer-id",
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const xml = decodeSamlRequest(res.headers.location as string);
      expect(xml).toContain(">custom-issuer-id<");
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("appends SAMLRequest with '&' separator when IdP URL already has query params", async () => {
    const idpWithQuery = "https://idp.example.com/sso?tenant=acme";
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: idpWithQuery,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      expect(res.status).toBe(302);
      const location = res.headers.location as string;
      // SAMLRequest must be appended with & not ? since URL already has query
      expect(location).toMatch(/\?tenant=acme&SAMLRequest=/);
    } finally {
      restoreEnv(prevEnv);
    }
  });

  it("appends SAMLRequest with '?' separator when IdP URL has no query params", async () => {
    const { app, prevEnv } = await buildSamlApp({
      SAML_IDP_ENTRY_POINT: FAKE_IDP,
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const res = await request(app).get("/api/auth/saml/login");
      const location = res.headers.location as string;
      expect(location).toMatch(/^https:\/\/idp\.example\.com\/sso\/saml\?SAMLRequest=/);
    } finally {
      restoreEnv(prevEnv);
    }
  });
});
