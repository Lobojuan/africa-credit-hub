/**
 * API tests for /api/loto/admin/*
 *
 * Covers:
 *   - 401 when unauthenticated
 *   - 403 when authenticated as a non-DGI role
 *   - Country isolation (CI officer cannot read data scoped to GH)
 *   - CSV export Content-Type header
 *
 * A minimal Express app is assembled here with in-memory sessions so the real
 * server never needs to start. All database calls go to the real test DB, which
 * is fine because the test country code "XX_TEST_COUNTRY" will simply return
 * empty result-sets.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import lotoAdminRouter from "../routes/loto-admin";

// ─── Test app factory ─────────────────────────────────────────────────────────

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: "test-secret-only",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });

  app.use("/api/loto/admin", lotoAdminRouter);

  return app;
}

const app = buildTestApp();
const agent = () => request.agent(app);

// ─── Session helpers ──────────────────────────────────────────────────────────

async function loginAs(ag: ReturnType<typeof agent>, sessionData: Record<string, unknown>) {
  await ag.post("/test/login").send(sessionData).expect(200);
}

const DGI_OFFICER_CI = {
  userId: "test-dgi-ci",
  userRole: "dgi_officer",
  userCountry: "Côte d'Ivoire",
};

const TAX_ADMIN_GH = {
  userId: "test-tax-gh",
  userRole: "tax_authority_admin",
  userCountry: "Ghana",
};

const REGULAR_USER = {
  userId: "test-regular",
  userRole: "credit_officer",
  userCountry: "Côte d'Ivoire",
};

// A safe country code that will never have real data — keeps tests hermetic.
const SAFE_COUNTRY = "XX_TEST_COUNTRY_9999";

// ─── 401 — unauthenticated ────────────────────────────────────────────────────

describe("401 — unauthenticated access", () => {
  const endpoints = [
    ["GET", "/api/loto/admin/kpi"],
    ["GET", "/api/loto/admin/heatmap"],
    ["GET", "/api/loto/admin/compliance-scorecard"],
    ["GET", "/api/loto/admin/fraud-flags"],
    ["GET", "/api/loto/admin/vat-uplift"],
    ["GET", "/api/loto/admin/export.csv"],
  ] as const;

  for (const [method, path] of endpoints) {
    it(`${method} ${path} returns 401 when no session exists`, async () => {
      const res = await request(app)[method.toLowerCase() as "get"](path);
      expect(res.status).toBe(401);
    });
  }
});

// ─── 403 — wrong role ────────────────────────────────────────────────────────

describe("403 — authenticated but wrong role", () => {
  it("GET /kpi returns 403 for a non-DGI role", async () => {
    const ag = agent();
    await loginAs(ag, REGULAR_USER);
    const res = await ag.get(`/api/loto/admin/kpi?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(403);
  });

  it("GET /fraud-flags returns 403 for a non-DGI role", async () => {
    const ag = agent();
    await loginAs(ag, REGULAR_USER);
    const res = await ag.get(`/api/loto/admin/fraud-flags?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(403);
  });

  it("GET /compliance-scorecard returns 403 for a non-DGI role", async () => {
    const ag = agent();
    await loginAs(ag, REGULAR_USER);
    const res = await ag.get(`/api/loto/admin/compliance-scorecard?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(403);
  });

  it("GET /export.csv returns 403 for a non-DGI role", async () => {
    const ag = agent();
    await loginAs(ag, REGULAR_USER);
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(403);
  });
});

// ─── 200 — DGI officer can access their own country ──────────────────────────

describe("200 — DGI officer can access safe/empty country data", () => {
  it("GET /kpi returns 200 with expected fields", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/kpi?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("countryCode", SAFE_COUNTRY);
    expect(res.body).toHaveProperty("vatCollected30d");
    expect(res.body).toHaveProperty("openFraudFlags");
  });

  it("GET /fraud-flags returns 200 with countryCode and flags array", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/fraud-flags?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("countryCode", SAFE_COUNTRY);
    expect(Array.isArray(res.body.flags)).toBe(true);
  });

  it("GET /compliance-scorecard returns 200 with merchants array", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/compliance-scorecard?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("countryCode", SAFE_COUNTRY);
    expect(Array.isArray(res.body.merchants)).toBe(true);
  });

  it("GET /heatmap returns 200 with districts array", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/heatmap?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.districts)).toBe(true);
  });
});

// ─── Country isolation ────────────────────────────────────────────────────────
//
// Non-super-admins are always scoped to their session country.  getCountryFilter
// ignores the ?country= query param for non-super-admins and returns the
// session country instead.  This means a CI officer requesting ?country=Ghana
// silently gets CI data — they can never read another country's data.

describe("Country isolation — DGI officer cannot read data from another country", () => {
  it("CI officer requesting Ghana data receives their own country (not Ghana) in the response", async () => {
    const ag = agent();
    await loginAs(ag, DGI_OFFICER_CI);
    const res = await ag.get("/api/loto/admin/kpi?country=Ghana");
    // Should succeed but return CI data, not Ghana data
    expect(res.status).toBe(200);
    expect(res.body.countryCode).not.toBe("Ghana");
    expect(res.body.countryCode).toBe(DGI_OFFICER_CI.userCountry);
  });

  it("Ghana officer requesting CI data receives their own country (not CI) in the response", async () => {
    const ag = agent();
    await loginAs(ag, TAX_ADMIN_GH);
    const res = await ag.get("/api/loto/admin/kpi?country=C%C3%B4te%20d%27Ivoire");
    expect(res.status).toBe(200);
    expect(res.body.countryCode).not.toBe("Côte d'Ivoire");
    expect(res.body.countryCode).toBe(TAX_ADMIN_GH.userCountry);
  });

  it("CI officer's ?country=Ghana param is ignored — fraud-flags returns CI data only", async () => {
    const ag = agent();
    await loginAs(ag, DGI_OFFICER_CI);
    const res = await ag.get("/api/loto/admin/fraud-flags?country=Ghana");
    expect(res.status).toBe(200);
    // The response is scoped to the officer's own country, never Ghana
    expect(res.body.countryCode).toBe(DGI_OFFICER_CI.userCountry);
  });

  it("CI officer can read data for their own country without error", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/fraud-flags?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(200);
  });
});

// ─── CSV export ───────────────────────────────────────────────────────────────

describe("CSV export — Content-Type and headers", () => {
  it("GET /export.csv returns text/csv content-type for default (kpi) view", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}&view=kpi`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
  });

  it("GET /export.csv returns text/csv for compliance view", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}&view=compliance`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
  });

  it("GET /export.csv returns text/csv for fraud view", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}&view=fraud`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
  });

  it("GET /export.csv without auth returns 401 (not CSV)", async () => {
    const res = await request(app).get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}`);
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).not.toMatch(/text\/csv/);
  });

  it("GET /export.csv compliance response starts with expected CSV header row", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}&view=compliance`);
    expect(res.status).toBe(200);
    const firstLine = res.text.split("\n")[0];
    expect(firstLine).toContain("merchant_id");
    expect(firstLine).toContain("score");
  });

  it("GET /export.csv fraud response starts with expected CSV header row", async () => {
    const ag = agent();
    await loginAs(ag, { ...DGI_OFFICER_CI, userCountry: SAFE_COUNTRY });
    const res = await ag.get(`/api/loto/admin/export.csv?country=${SAFE_COUNTRY}&view=fraud`);
    expect(res.status).toBe(200);
    const firstLine = res.text.split("\n")[0];
    expect(firstLine).toContain("rule_code");
    expect(firstLine).toContain("severity");
  });
});
