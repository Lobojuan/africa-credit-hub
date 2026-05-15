/**
 * OAuth smoke tests — exercises the REAL production handlers from
 * server/routes/oauth.ts via the OAuthDeps injection interface.
 *
 * No DB is required: every DB call is handled by lightweight mock deps.
 * External HTTP calls (Google token, Google userinfo, Microsoft token,
 * Microsoft Graph) are intercepted with vi.stubGlobal("fetch", …).
 *
 * Coverage:
 *   Google OAuth — initiate redirect
 *   Google OAuth — provider error propagated
 *   Google OAuth — missing code/state → error redirect
 *   Google OAuth — state mismatch → error redirect
 *   Google OAuth — token exchange failure
 *   Google OAuth — no email in userinfo → error redirect
 *   Google OAuth — new consumer auto-registration + session
 *   Google OAuth — existing consumer found by googleId
 *   Google OAuth — existing consumer found by email (link flow)
 *   Google OAuth — admin/institutional user login
 *   Google OAuth — suspended admin is skipped, falls through to consumer
 *   Apple stub    — 503 with descriptive message
 *   Microsoft SSO — no credentials → 503
 *   Microsoft SSO — initiate redirect
 *   Microsoft SSO — missing code/state → error redirect
 *   Microsoft SSO — state mismatch → error redirect
 *   Microsoft SSO — token exchange failure
 *   Microsoft SSO — no email in graph response
 *   Microsoft SSO — admin login
 *   Microsoft SSO — consumer login
 *   Microsoft SSO — unknown account redirect
 *   GET /api/auth/oauth-status — 401 when unauthenticated
 *   GET /api/auth/oauth-status — 403 when not super_admin
 *   GET /api/auth/oauth-status — full response shape for super_admin
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, { type Request, type Response } from "express";
import session from "express-session";
import request from "supertest";
import crypto from "crypto";
import {
  registerOAuthRoutes,
  type OAuthDeps,
} from "../routes/oauth";

// ─── Test app factory ─────────────────────────────────────────────────────────

function buildApp(deps?: Partial<OAuthDeps>, env?: Record<string, string>) {
  // Patch env vars before routes are registered
  const prevEnv: Record<string, string | undefined> = {};
  if (env) {
    for (const [k, v] of Object.entries(env)) {
      prevEnv[k] = process.env[k];
      process.env[k] = v;
    }
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  // Convenience helpers for tests to read/write session state
  app.post("/test/set-session", (req: Request, res: Response) => {
    Object.assign(req.session, req.body);
    req.session.save(() => res.json({ ok: true }));
  });
  app.get("/test/get-session", (req: Request, res: Response) =>
    res.json(req.session)
  );

  return { app, prevEnv };
}

async function makeApp(deps?: Partial<OAuthDeps>, env?: Record<string, string>) {
  const { app, prevEnv } = buildApp(deps, env);
  const fullDeps: OAuthDeps = {
    findUserByEmail: vi.fn(async () => null),
    findConsumerByGoogleId: vi.fn(async () => null),
    findConsumerByEmail: vi.fn(async () => null),
    createGoogleConsumer: vi.fn(async (d) => ({
      id: crypto.randomUUID(),
      nationalId: d.nationalId,
    })),
    linkGoogleIdToConsumer: vi.fn(async () => {}),
    touchConsumerLastLogin: vi.fn(async () => {}),
    getOrganization: vi.fn(async () => null),
    findMsUserByEmail: vi.fn(async () => null),
    findMsConsumerByEmail: vi.fn(async () => null),
    ...deps,
  };
  await registerOAuthRoutes(app, fullDeps);
  return { app, deps: fullDeps, prevEnv };
}

// Restore env vars after each test that patches them
async function restoreEnv(prevEnv: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(prevEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

// ─── Mock fetch factory ───────────────────────────────────────────────────────

function mockFetch(responses: {
  googleToken?: Record<string, unknown>;
  googleUserinfo?: Record<string, unknown>;
  msToken?: Record<string, unknown>;
  msGraph?: Record<string, unknown>;
}) {
  return vi.fn(async (url: string) => {
    if (url === "https://oauth2.googleapis.com/token") {
      return { ok: true, json: async () => responses.googleToken ?? {} };
    }
    if (url === "https://www.googleapis.com/oauth2/v2/userinfo") {
      return { ok: true, json: async () => responses.googleUserinfo ?? {} };
    }
    if (typeof url === "string" && url.includes("microsoftonline.com") && url.includes("/token")) {
      return { ok: true, json: async () => responses.msToken ?? {} };
    }
    if (url === "https://graph.microsoft.com/v1.0/me") {
      return { ok: true, json: async () => responses.msGraph ?? {} };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

// Helper: get session cookie from response, then read session via /test/get-session
async function getSession(app: express.Express, cookie: string) {
  const r = await request(app).get("/test/get-session").set("Cookie", cookie);
  return r.body as Record<string, unknown>;
}

// Helper: set session fields and get back the session cookie
async function setSession(
  app: express.Express,
  fields: Record<string, unknown>
): Promise<string> {
  const r = await request(app).post("/test/set-session").send(fields);
  const cookie = (r.headers["set-cookie"] as string[] | string | undefined) ?? [];
  return Array.isArray(cookie) ? cookie[0] : cookie;
}

// ─── Google OAuth — initiate ──────────────────────────────────────────────────

describe("Google OAuth — initiate", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redirects to Google when credentials are configured", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const res = await request(app).get("/api/consumer/auth/google");
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com/);
      expect(res.headers.location).toContain("client_id=gid");
      expect(res.headers.location).toContain("response_type=code");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("returns 503 when GOOGLE_CLIENT_ID is absent", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    });
    try {
      const res = await request(app).get("/api/consumer/auth/google");
      expect(res.status).toBe(503);
      expect(res.text).toContain("Google Sign-In");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Google OAuth — callback error paths ─────────────────────────────────────

describe("Google OAuth — callback error paths", () => {
  afterEach(() => vi.restoreAllMocks());

  it("propagates provider error param", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const res = await request(app).get(
        "/api/consumer/auth/google/callback?error=access_denied"
      );
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=access_denied");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with missing_params when code is absent", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const res = await request(app).get(
        "/api/consumer/auth/google/callback?state=abc"
      );
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=missing_params");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with invalid_state on state mismatch", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const cookie = await setSession(app, { googleOAuthState: "correct-state", googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get("/api/consumer/auth/google/callback?code=xyz&state=wrong-state")
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=invalid_state");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with token_failed when token exchange fails", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      vi.stubGlobal("fetch", mockFetch({ googleToken: { error: "invalid_grant" } }));
      const state = "test-state-token-fail";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=bad-code&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=token_failed");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with no_email when userinfo has no email", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: { id: "gid-123", name: "No Email" },
        })
      );
      const state = "state-no-email";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=c&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=no_email");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Google OAuth — happy paths ───────────────────────────────────────────────

describe("Google OAuth — happy paths", () => {
  const GOOGLE_ENV = { GOOGLE_CLIENT_ID: "gid", GOOGLE_CLIENT_SECRET: "gsec" };

  afterEach(() => vi.restoreAllMocks());

  it("auto-registers a brand-new consumer and sets consumerId in session", async () => {
    const newConsumerId = crypto.randomUUID();
    const { app, deps, prevEnv } = await makeApp(
      {
        findUserByEmail: vi.fn(async () => null),
        findConsumerByGoogleId: vi.fn(async () => null),
        findConsumerByEmail: vi.fn(async () => null),
        createGoogleConsumer: vi.fn(async (d) => ({
          id: newConsumerId,
          nationalId: d.nationalId,
        })),
        touchConsumerLastLogin: vi.fn(async () => {}),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: {
            id: "google-sub-new",
            email: "newconsumer@example.com",
            name: "New Consumer",
            picture: "https://example.com/pic.jpg",
          },
        })
      );
      const state = "state-new-consumer";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=code123&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/my-credit");
      expect(deps.createGoogleConsumer).toHaveBeenCalledOnce();
      const callArg = (deps.createGoogleConsumer as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg.email).toBe("newconsumer@example.com");

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.consumerId).toBe(newConsumerId);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("logs in existing consumer found by googleId", async () => {
    const consumerId = crypto.randomUUID();
    const { app, deps, prevEnv } = await makeApp(
      {
        findConsumerByGoogleId: vi.fn(async () => ({
          id: consumerId,
          nationalId: "NID-001",
          email: "existing@example.com",
          googleId: "google-sub-existing",
          authProvider: "google",
          fullName: "Existing Consumer",
        })),
        touchConsumerLastLogin: vi.fn(async () => {}),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: {
            id: "google-sub-existing",
            email: "existing@example.com",
            name: "Existing Consumer",
          },
        })
      );
      const state = "state-existing-consumer";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=code456&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/my-credit");
      expect(deps.touchConsumerLastLogin).toHaveBeenCalledWith(consumerId);

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.consumerId).toBe(consumerId);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("links googleId to consumer found by email (first Google sign-in)", async () => {
    const consumerId = crypto.randomUUID();
    const { app, deps, prevEnv } = await makeApp(
      {
        findConsumerByGoogleId: vi.fn(async () => null),
        findConsumerByEmail: vi.fn(async () => ({
          id: consumerId,
          nationalId: "NID-002",
          email: "link@example.com",
          googleId: null,
          authProvider: "local",
          fullName: "Link Consumer",
        })),
        linkGoogleIdToConsumer: vi.fn(async () => {}),
        touchConsumerLastLogin: vi.fn(async () => {}),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: {
            id: "google-sub-link",
            email: "link@example.com",
            name: "Link Consumer",
          },
        })
      );
      const state = "state-link";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=link-code&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(deps.linkGoogleIdToConsumer).toHaveBeenCalledWith(
        consumerId,
        "google-sub-link",
        null,
        "Link Consumer"
      );

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.consumerId).toBe(consumerId);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("logs in admin/institutional user and redirects to /dashboard", async () => {
    const adminId = crypto.randomUUID();
    const { app, deps, prevEnv } = await makeApp(
      {
        findUserByEmail: vi.fn(async () => ({
          id: adminId,
          role: "admin",
          organizationId: null,
          status: "active",
          email: "admin@bank.com",
        })),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: { id: "gsub-admin", email: "admin@bank.com", name: "Admin" },
        })
      );
      const state = "state-admin";
      const cookie = await setSession(app, { googleOAuthState: state, googleOAuthReturnTo: "/my-credit" });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=admin-code&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/dashboard");

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.userId).toBe(adminId);
      expect(deps.findConsumerByGoogleId).not.toHaveBeenCalled();
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("platform_owner admin redirects to /command-center", async () => {
    const ownerId = crypto.randomUUID();
    const { app, prevEnv } = await makeApp(
      {
        findUserByEmail: vi.fn(async () => ({
          id: ownerId,
          role: "platform_owner",
          organizationId: null,
          status: "active",
          email: "owner@uch.com",
        })),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: { id: "gsub-owner", email: "owner@uch.com" },
        })
      );
      const state = "state-owner";
      const cookie = await setSession(app, { googleOAuthState: state });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=oc&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/command-center");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("suspended admin is skipped and falls through to consumer path", async () => {
    const consumerId = crypto.randomUUID();
    const { app, deps, prevEnv } = await makeApp(
      {
        findUserByEmail: vi.fn(async () => ({
          id: crypto.randomUUID(),
          role: "admin",
          organizationId: null,
          status: "suspended",
          email: "suspended@bank.com",
        })),
        findConsumerByGoogleId: vi.fn(async () => null),
        findConsumerByEmail: vi.fn(async () => null),
        createGoogleConsumer: vi.fn(async (d) => ({
          id: consumerId,
          nationalId: d.nationalId,
        })),
        touchConsumerLastLogin: vi.fn(async () => {}),
      },
      GOOGLE_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          googleToken: { access_token: "tok" },
          googleUserinfo: { id: "gsub-sus", email: "suspended@bank.com" },
        })
      );
      const state = "state-sus";
      const cookie = await setSession(app, { googleOAuthState: state });
      const res = await request(app)
        .get(`/api/consumer/auth/google/callback?code=sc&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      // Should not have gone to /dashboard (admin path)
      expect(res.headers.location).not.toBe("/dashboard");
      // Falls through to consumer path
      expect(deps.findConsumerByGoogleId).toHaveBeenCalled();
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Apple stub ───────────────────────────────────────────────────────────────

describe("Apple stub", () => {
  it("returns 503 with descriptive message", async () => {
    const { app } = await makeApp();
    const res = await request(app).get("/api/consumer/auth/apple");
    expect(res.status).toBe(503);
    expect(res.text).toContain("Apple Sign-In");
  });
});

// ─── Microsoft SSO — no credentials ──────────────────────────────────────────

describe("Microsoft SSO — no credentials", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns 503 when MICROSOFT_CLIENT_ID is absent", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      MICROSOFT_CLIENT_ID: "",
      MICROSOFT_CLIENT_SECRET: "",
    });
    try {
      const res = await request(app).get("/api/auth/microsoft");
      expect(res.status).toBe(503);
      expect(res.text).toContain("Microsoft Sign-In");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Microsoft SSO — initiate ─────────────────────────────────────────────────

describe("Microsoft SSO — initiate", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redirects to Microsoft when credentials are configured", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      MICROSOFT_CLIENT_ID: "msid",
      MICROSOFT_CLIENT_SECRET: "mssec",
      MICROSOFT_TENANT_ID: "common",
    });
    try {
      const res = await request(app).get("/api/auth/microsoft");
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/login\.microsoftonline\.com/);
      expect(res.headers.location).toContain("client_id=msid");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Microsoft SSO — callback error paths ────────────────────────────────────

describe("Microsoft SSO — callback error paths", () => {
  const MS_ENV = {
    MICROSOFT_CLIENT_ID: "msid",
    MICROSOFT_CLIENT_SECRET: "mssec",
    MICROSOFT_TENANT_ID: "common",
  };
  afterEach(() => vi.restoreAllMocks());

  it("redirects with missing_params when code is absent", async () => {
    const { app, prevEnv } = await makeApp(undefined, MS_ENV);
    try {
      const res = await request(app).get(
        "/api/auth/microsoft/callback?state=abc"
      );
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=missing_params");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with invalid_state on state mismatch", async () => {
    const { app, prevEnv } = await makeApp(undefined, MS_ENV);
    try {
      const cookie = await setSession(app, { microsoftOAuthState: "correct", microsoftOAuthReturnTo: "/dashboard" });
      const res = await request(app)
        .get("/api/auth/microsoft/callback?code=c&state=wrong")
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=invalid_state");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with token_failed when token exchange fails", async () => {
    const { app, prevEnv } = await makeApp(undefined, MS_ENV);
    try {
      vi.stubGlobal("fetch", mockFetch({ msToken: { error: "invalid_grant" } }));
      const state = "state-ms-tok-fail";
      const cookie = await setSession(app, { microsoftOAuthState: state, microsoftOAuthReturnTo: "/dashboard" });
      const res = await request(app)
        .get(`/api/auth/microsoft/callback?code=bad&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=token_failed");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with no_email when graph response has no email", async () => {
    const { app, prevEnv } = await makeApp(undefined, MS_ENV);
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({ msToken: { access_token: "mstok" }, msGraph: { displayName: "No Email User" } })
      );
      const state = "state-ms-no-email";
      const cookie = await setSession(app, { microsoftOAuthState: state });
      const res = await request(app)
        .get(`/api/auth/microsoft/callback?code=c&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=no_email");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── Microsoft SSO — happy paths ─────────────────────────────────────────────

describe("Microsoft SSO — happy paths", () => {
  const MS_ENV = {
    MICROSOFT_CLIENT_ID: "msid",
    MICROSOFT_CLIENT_SECRET: "mssec",
    MICROSOFT_TENANT_ID: "common",
  };
  afterEach(() => vi.restoreAllMocks());

  it("logs in admin user and sets userId in session", async () => {
    const adminId = crypto.randomUUID();
    const { app, prevEnv } = await makeApp(
      {
        findMsUserByEmail: vi.fn(async () => ({
          id: adminId,
          role: "admin",
          organizationId: null,
          status: "active",
        })),
      },
      MS_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          msToken: { access_token: "mstok" },
          msGraph: { mail: "admin@bank.com", displayName: "Bank Admin" },
        })
      );
      const state = "state-ms-admin";
      const cookie = await setSession(app, { microsoftOAuthState: state, microsoftOAuthReturnTo: "/dashboard" });
      const res = await request(app)
        .get(`/api/auth/microsoft/callback?code=msc&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/dashboard");

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.userId).toBe(adminId);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("logs in consumer via Microsoft and sets consumerId in session", async () => {
    const consumerId = crypto.randomUUID();
    const { app, prevEnv } = await makeApp(
      {
        findMsUserByEmail: vi.fn(async () => null),
        findMsConsumerByEmail: vi.fn(async () => ({
          id: consumerId,
          nationalId: "NID-MS-001",
        })),
      },
      MS_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          msToken: { access_token: "mstok" },
          msGraph: { userPrincipalName: "consumer@org.com" },
        })
      );
      const state = "state-ms-consumer";
      const cookie = await setSession(app, { microsoftOAuthState: state });
      const res = await request(app)
        .get(`/api/auth/microsoft/callback?code=msc2&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/my-credit");

      const newCookie = (res.headers["set-cookie"] as string[] | string | undefined) ?? [];
      const sessionData = await getSession(app, Array.isArray(newCookie) ? newCookie[0] : newCookie);
      expect(sessionData.consumerId).toBe(consumerId);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("redirects with no_account when user is completely unknown", async () => {
    const { app, prevEnv } = await makeApp(
      {
        findMsUserByEmail: vi.fn(async () => null),
        findMsConsumerByEmail: vi.fn(async () => null),
      },
      MS_ENV
    );
    try {
      vi.stubGlobal(
        "fetch",
        mockFetch({
          msToken: { access_token: "mstok" },
          msGraph: { mail: "unknown@domain.com" },
        })
      );
      const state = "state-ms-unknown";
      const cookie = await setSession(app, { microsoftOAuthState: state });
      const res = await request(app)
        .get(`/api/auth/microsoft/callback?code=msc3&state=${state}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("error=no_account");
      expect(res.headers.location).toContain("provider=microsoft");
      expect(res.headers.location).toContain(encodeURIComponent("unknown@domain.com"));
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});

// ─── GET /api/auth/oauth-status ───────────────────────────────────────────────

describe("GET /api/auth/oauth-status", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns 401 when not authenticated", async () => {
    const { app } = await makeApp();
    const res = await request(app).get("/api/auth/oauth-status");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated but not super_admin or platform_owner", async () => {
    const { app } = await makeApp();
    const cookie = await setSession(app, {
      userId: crypto.randomUUID(),
      userRole: "admin",
      lastActivity: Date.now(),
    });
    const res = await request(app)
      .get("/api/auth/oauth-status")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("returns full shape for super_admin", async () => {
    const { app, prevEnv } = await makeApp(
      undefined,
      {
        GOOGLE_CLIENT_ID: "gid-configured",
        GOOGLE_CLIENT_SECRET: "gsec",
        MICROSOFT_CLIENT_ID: "",
        MICROSOFT_CLIENT_SECRET: "",
        CANONICAL_URL: "https://universalcredithub.com",
      }
    );
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);

      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty("canonicalUrl");
      expect(body).toHaveProperty("providers");
      expect(body).toHaveProperty("smokeTestChecklist");

      const providers = body.providers as Record<string, unknown>;
      expect(providers).toHaveProperty("google");
      expect(providers).toHaveProperty("microsoft");
      expect(providers).toHaveProperty("saml");

      const google = providers.google as Record<string, unknown>;
      expect(google.callbackUrl).toContain("/api/consumer/auth/google/callback");
      expect(google.credentialsPresent).toBe(true);

      const microsoft = providers.microsoft as Record<string, unknown>;
      expect(microsoft.callbackUrl).toContain("/api/auth/microsoft/callback");
      expect(microsoft.credentialsPresent).toBe(false);

      const canonicalUrl = body.canonicalUrl as Record<string, unknown>;
      expect(canonicalUrl.value).toBe("https://universalcredithub.com");
      expect(canonicalUrl.configured).toBe(true);

      const checklist = body.smokeTestChecklist as Array<Record<string, unknown>>;
      expect(checklist.length).toBeGreaterThanOrEqual(4);
      expect(checklist[0]).toHaveProperty("step");
      expect(checklist[0]).toHaveProperty("description");
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("returns warning in canonicalUrl when CANONICAL_URL is not set", async () => {
    const { app, prevEnv } = await makeApp(
      undefined,
      { CANONICAL_URL: "" }
    );
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      const body = res.body as Record<string, unknown>;
      const canonicalUrl = body.canonicalUrl as Record<string, unknown>;
      expect(canonicalUrl.configured).toBe(false);
      expect(canonicalUrl.warning).toBeTruthy();
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("returns 200 for platform_owner role as well", async () => {
    const { app } = await makeApp();
    const cookie = await setSession(app, {
      userId: crypto.randomUUID(),
      userRole: "platform_owner",
      lastActivity: Date.now(),
    });
    const res = await request(app)
      .get("/api/auth/oauth-status")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
  });
});

// ─── Production URL generation ────────────────────────────────────────────────
//
// These tests pin the exact callback URLs that must be registered at provider
// consoles for universalcredithub.com to work in production.  They exercise
// the full path: CANONICAL_URL env var → getOAuthCallbackBase() → route
// handler uses the correct redirect_uri in the authorization redirect.
//
// An admin can call GET /api/auth/oauth-status (super_admin gate) to retrieve
// these URLs at runtime; the tests below validate the URL generator is wired
// correctly so the checklist values are trustworthy.

describe("Production URL generation — universalcredithub.com", () => {
  const PROD_BASE = "https://universalcredithub.com";

  const GOOGLE_PROD_CALLBACK = `${PROD_BASE}/api/consumer/auth/google/callback`;
  const MICROSOFT_PROD_CALLBACK = `${PROD_BASE}/api/auth/microsoft/callback`;
  const SAML_PROD_CALLBACK = `${PROD_BASE}/api/auth/saml/callback`;

  afterEach(() => vi.restoreAllMocks());

  it("oauth-status reports exact Google callback URL for universalcredithub.com", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      const google = (res.body.providers as Record<string, Record<string, unknown>>).google;
      expect(google.callbackUrl).toBe(GOOGLE_PROD_CALLBACK);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("oauth-status reports exact Microsoft callback URL for universalcredithub.com", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
      MICROSOFT_CLIENT_ID: "msid",
      MICROSOFT_CLIENT_SECRET: "mssec",
    });
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      const microsoft = (res.body.providers as Record<string, Record<string, unknown>>).microsoft;
      expect(microsoft.callbackUrl).toBe(MICROSOFT_PROD_CALLBACK);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("oauth-status reports exact SAML ACS URL for universalcredithub.com", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
    });
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      const saml = (res.body.providers as Record<string, Record<string, unknown>>).saml;
      expect(saml.callbackUrl).toBe(SAML_PROD_CALLBACK);
      expect(saml.metadataUrl).toBe(`${PROD_BASE}/api/auth/saml/metadata`);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("Google initiate handler includes client_id, redirect_uri, and state in the authorization redirect", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
      GOOGLE_CLIENT_ID: "gid-prod",
      GOOGLE_CLIENT_SECRET: "gsec",
    });
    try {
      const res = await request(app).get("/api/consumer/auth/google");
      expect(res.status).toBe(302);
      const location = res.headers.location as string;
      expect(location).toMatch(/^https:\/\/accounts\.google\.com/);

      // client_id must match the configured credential
      expect(location).toContain("client_id=gid-prod");

      // redirect_uri must point to the production callback URL —
      // this exact URL must be registered in Google Cloud Console →
      // APIs & Services → Credentials → OAuth 2.0 Client IDs.
      expect(location).toContain(
        `redirect_uri=${encodeURIComponent(GOOGLE_PROD_CALLBACK)}`
      );

      // state must be present (CSRF protection — random hex token set in session)
      const parsed = new URL(location);
      const state = parsed.searchParams.get("state");
      expect(state).toBeTruthy();
      expect(state).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("Microsoft initiate handler includes client_id, redirect_uri, and state in the authorization redirect", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
      MICROSOFT_CLIENT_ID: "msid-prod",
      MICROSOFT_CLIENT_SECRET: "mssec",
      MICROSOFT_TENANT_ID: "common",
    });
    try {
      const res = await request(app).get("/api/auth/microsoft");
      expect(res.status).toBe(302);
      const location = res.headers.location as string;
      expect(location).toMatch(/login\.microsoftonline\.com/);

      // client_id must match the configured credential
      expect(location).toContain("client_id=msid-prod");

      // redirect_uri must match what is registered at Microsoft Entra →
      // App registrations → Authentication → Redirect URIs.
      expect(location).toContain(
        `redirect_uri=${encodeURIComponent(MICROSOFT_PROD_CALLBACK)}`
      );

      // state must be present (CSRF protection — random hex token set in session)
      const parsed = new URL(location);
      const state = parsed.searchParams.get("state");
      expect(state).toBeTruthy();
      expect(state).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      await restoreEnv(prevEnv);
    }
  });

  it("oauth-status checklist includes registration instructions for all three providers", async () => {
    const { app, prevEnv } = await makeApp(undefined, {
      CANONICAL_URL: PROD_BASE,
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      MICROSOFT_CLIENT_ID: "msid",
      MICROSOFT_CLIENT_SECRET: "mssec",
    });
    try {
      const cookie = await setSession(app, {
        userId: crypto.randomUUID(),
        userRole: "super_admin",
        lastActivity: Date.now(),
      });
      const res = await request(app)
        .get("/api/auth/oauth-status")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      const checklist = res.body.smokeTestChecklist as Array<Record<string, unknown>>;

      // Step 1 — CANONICAL_URL must be set
      const step1 = checklist.find((s) => s.step === 1) as Record<string, unknown>;
      expect(step1.done).toBe(true);

      // Steps referencing Google and Microsoft must carry the exact prod URLs
      const allDescriptions = checklist.map((s) => s.description as string).join("\n");
      expect(allDescriptions).toContain(GOOGLE_PROD_CALLBACK);
      expect(allDescriptions).toContain(MICROSOFT_PROD_CALLBACK);
      expect(allDescriptions).toContain(SAML_PROD_CALLBACK);

      // Provider registration hints must mention the correct admin consoles
      const google = (res.body.providers as Record<string, Record<string, unknown>>).google;
      expect(google.registerAt as string).toContain("console.cloud.google.com");

      const microsoft = (res.body.providers as Record<string, Record<string, unknown>>).microsoft;
      expect(microsoft.registerAt as string).toContain("portal.azure.com");
    } finally {
      await restoreEnv(prevEnv);
    }
  });
});
