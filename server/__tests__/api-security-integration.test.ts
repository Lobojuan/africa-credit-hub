/**
 * API Security Integration Tests — Task #386 (augmentation)
 *
 * These tests exercise the actual HTTP layer using supertest against
 * minimal Express apps assembled from real middleware. Coverage:
 *
 *  A. CORS enforcement — mismatched origin → 403 for every HTTP verb in prod
 *  B. Route auth sweep — unauthenticated requests return 401 on guarded routes
 *  C. Consumer monitoring session key — routes reject userId-only sessions
 *  D. BOG consent gate — all four consent states (denied/pending/expired/approved)
 *  E. Webhook replay protection — verifyWebhookSignature timestamp-window + HMAC
 *  F. PII ciphertext vs plaintext — enc:-prefixed storage, plaintext on decryption
 */

import { describe, it, expect, beforeAll } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import request from "supertest";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// A. CORS enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replicate the production CORS middleware from server/index.ts in isolation
 * so we can unit-test it without starting the full app.
 */
function buildCorsMiddleware(canonicalUrl: string) {
  const canonicalOrigin = new URL(canonicalUrl).origin;

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!origin) return next();

    const allowed = origin === canonicalOrigin;
    if (!allowed) {
      return res.status(403).json({ message: "Cross-origin request not allowed" });
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-CSRF-Token,Authorization,Idempotency-Key");
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  };
}

function buildCorsTestApp(canonicalUrl: string) {
  const app = express();
  app.use(buildCorsMiddleware(canonicalUrl));
  app.get("/api/ping", (_req, res) => res.json({ ok: true }));
  app.post("/api/ping", (_req, res) => res.json({ ok: true }));
  app.delete("/api/ping", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("A. CORS enforcement (production lockdown)", () => {
  const CANONICAL = "https://app.universalcredithub.com";
  const app = buildCorsTestApp(CANONICAL);

  it("GET with matching origin is allowed", async () => {
    const res = await request(app)
      .get("/api/ping")
      .set("Origin", "https://app.universalcredithub.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://app.universalcredithub.com");
  });

  it("GET with mismatched origin returns 403", async () => {
    const res = await request(app)
      .get("/api/ping")
      .set("Origin", "https://evil.example.com");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cross-origin/i);
  });

  it("POST with mismatched origin returns 403 (not just OPTIONS)", async () => {
    const res = await request(app)
      .post("/api/ping")
      .set("Origin", "https://evil.example.com");
    expect(res.status).toBe(403);
  });

  it("DELETE with mismatched origin returns 403", async () => {
    const res = await request(app)
      .delete("/api/ping")
      .set("Origin", "https://phishing.com");
    expect(res.status).toBe(403);
  });

  it("OPTIONS preflight with mismatched origin returns 403", async () => {
    const res = await request(app)
      .options("/api/ping")
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.status).toBe(403);
  });

  it("OPTIONS preflight with matching origin returns 204", async () => {
    const res = await request(app)
      .options("/api/ping")
      .set("Origin", "https://app.universalcredithub.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("Request with no Origin header is allowed (same-origin or server-to-server)", async () => {
    const res = await request(app).get("/api/ping");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. Route auth sweep — key guarded endpoints return 401 without session
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal app that mounts just the auth middleware on test routes,
 * mirroring the guard pattern used by the real routes.
 */
function buildAuthSweepApp() {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  // Seed session helper
  app.post("/test/login", (req, res) => {
    Object.assign(req.session, req.body);
    res.json({ ok: true });
  });

  return app;
}

describe("B. Route auth sweep", () => {
  it("requireAuth blocks unauthenticated GET /api/notifications", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.get("/api/notifications", m.requireAuth, (_req, res) => res.json({ data: [] }));
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/authentication required/i);
  });

  it("requireAuth blocks unauthenticated GET /api/notifications/unread-count", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.get("/api/notifications/unread-count", m.requireAuth, (_req, res) => res.json({ count: 0 }));
    const res = await request(app).get("/api/notifications/unread-count");
    expect(res.status).toBe(401);
  });

  it("requireAuth blocks unauthenticated PATCH .../notifications/:id/read", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.patch("/api/notifications/:id/read", m.requireAuth, (_req, res) => res.json({ ok: true }));
    const res = await request(app).patch("/api/notifications/fake-id/read");
    expect(res.status).toBe(401);
  });

  it("requireAuth blocks unauthenticated POST .../notifications/mark-all-read", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.post("/api/notifications/mark-all-read", m.requireAuth, (_req, res) => res.json({ ok: true }));
    const res = await request(app).post("/api/notifications/mark-all-read");
    expect(res.status).toBe(401);
  });

  it("requireAuth + requireSuperAdmin blocks non-super-admin on maintenance toggle", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.post("/api/maintenance/toggle", m.requireAuth, m.requireSuperAdmin, (_req, res) => res.json({ ok: true }));
    const ag = request.agent(app);
    await ag.post("/test/login").send({ userId: "u-1", userRole: "lender" }).expect(200);
    const res = await ag.post("/api/maintenance/toggle");
    expect(res.status).toBe(403);
  });

  it("requireAuth + requireSuperAdmin allows platform_owner on maintenance toggle", async () => {
    const m = await import("../routes/middleware");
    const app = buildAuthSweepApp();
    app.post("/api/maintenance/toggle", m.requireAuth, m.requireSuperAdmin, (_req, res) => res.json({ ok: true }));
    const ag = request.agent(app);
    await ag.post("/test/login").send({ userId: "u-1", userRole: "platform_owner" }).expect(200);
    const res = await ag.post("/api/maintenance/toggle");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. Consumer monitoring — must use consumerId session key (not consumerAccountId)
// ─────────────────────────────────────────────────────────────────────────────

describe("C. Consumer monitoring routes session key", () => {
  it("requireConsumer passes for consumerId-only session (no userId)", async () => {
    const m = await import("../routes/middleware");
    let nextCalled = false;
    const req: any = { session: { consumerId: "ca-999" } };
    const res: any = {
      statusCode: 200,
      status(code: number) { this.statusCode = code; return this; },
      json() { return this; },
    };
    m.requireConsumer(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("requireConsumer blocks session with userId but no consumerId (institution session)", async () => {
    const m = await import("../routes/middleware");
    const req: any = { session: { userId: "u-institution", userRole: "lender" } };
    const res: any = {
      statusCode: 200,
      _body: null,
      status(code: number) { this.statusCode = code; return this; },
      json(body: any) { this._body = body; return this; },
    };
    m.requireConsumer(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it("consumer monitoring GET uses consumerId not consumerAccountId (route source check)", async () => {
    const fs = await import("fs");
    const routeSource = fs.readFileSync("server/routes.ts", "utf8");

    // All occurrences in consumer monitoring block must use .consumerId
    const monitoringBlock = routeSource.slice(
      routeSource.indexOf("CONSUMER CREDIT MONITORING"),
      routeSource.indexOf("Consumer Score History")
    );

    expect(monitoringBlock).not.toContain("consumerAccountId = (req.session as any).consumerAccountId");
    const sessionReads = monitoringBlock.match(/req\.session as any\)\.(consumer\w+)/g) || [];
    sessionReads.forEach(read => {
      // The only session reads allowed are .consumerId and .consumerNationalId
      expect(read).toMatch(/\.consumerId|\.consumerNationalId/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. BOG consent gate — inline unit tests for consent decision logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the consent decision logic that lives in the credit-report route.
 * We replicate it here as a pure function to make all four states testable
 * without needing a database.
 */
function evaluateConsent(
  record: {
    borrowerResponse: string | null;
    loanExemption: boolean;
    borrowerId: string;
  } | null,
  requestedBorrowerId: string,
  isSuperAdmin: boolean,
): { allowed: boolean; httpStatus: number; code: string } {
  if (isSuperAdmin) return { allowed: true, httpStatus: 200, code: "SUPER_ADMIN_BYPASS" };

  if (!record) return { allowed: false, httpStatus: 403, code: "CONSENT_INVALID" };

  const isApproved = record.loanExemption === true || record.borrowerResponse === "approved";
  if (isApproved) {
    if (record.borrowerId !== requestedBorrowerId) {
      return { allowed: false, httpStatus: 403, code: "CONSENT_MISMATCH" };
    }
    return { allowed: true, httpStatus: 200, code: "CONSENT_APPROVED" };
  }

  const response = record.borrowerResponse || "pending";
  if (response === "denied") return { allowed: false, httpStatus: 403, code: "CONSENT_DENIED" };
  if (response === "expired") return { allowed: false, httpStatus: 403, code: "CONSENT_EXPIRED" };
  return { allowed: false, httpStatus: 403, code: "CONSENT_PENDING" };
}

describe("D. BOG consent gate", () => {
  const BORROWER_ID = "b-001";

  it("super_admin bypasses consent gate entirely", () => {
    const result = evaluateConsent(null, BORROWER_ID, true);
    expect(result.allowed).toBe(true);
    expect(result.code).toBe("SUPER_ADMIN_BYPASS");
  });

  it("null consent record → 403 CONSENT_INVALID", () => {
    const result = evaluateConsent(null, BORROWER_ID, false);
    expect(result.allowed).toBe(false);
    expect(result.httpStatus).toBe(403);
    expect(result.code).toBe("CONSENT_INVALID");
  });

  it("borrowerResponse=denied → 403 CONSENT_DENIED", () => {
    const result = evaluateConsent(
      { borrowerResponse: "denied", loanExemption: false, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(false);
    expect(result.httpStatus).toBe(403);
    expect(result.code).toBe("CONSENT_DENIED");
  });

  it("borrowerResponse=pending → 403 CONSENT_PENDING", () => {
    const result = evaluateConsent(
      { borrowerResponse: "pending", loanExemption: false, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(false);
    expect(result.httpStatus).toBe(403);
    expect(result.code).toBe("CONSENT_PENDING");
  });

  it("borrowerResponse=null defaults to pending → 403 CONSENT_PENDING", () => {
    const result = evaluateConsent(
      { borrowerResponse: null, loanExemption: false, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("CONSENT_PENDING");
  });

  it("borrowerResponse=expired → 403 CONSENT_EXPIRED", () => {
    const result = evaluateConsent(
      { borrowerResponse: "expired", loanExemption: false, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(false);
    expect(result.httpStatus).toBe(403);
    expect(result.code).toBe("CONSENT_EXPIRED");
  });

  it("borrowerResponse=approved + matching borrowerId → 200 allowed", () => {
    const result = evaluateConsent(
      { borrowerResponse: "approved", loanExemption: false, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(true);
    expect(result.httpStatus).toBe(200);
    expect(result.code).toBe("CONSENT_APPROVED");
  });

  it("loanExemption=true + matching borrowerId → allowed even without borrower approval", () => {
    const result = evaluateConsent(
      { borrowerResponse: "pending", loanExemption: true, borrowerId: BORROWER_ID },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(true);
    expect(result.code).toBe("CONSENT_APPROVED");
  });

  it("borrowerResponse=approved but borrowerId mismatch → 403 CONSENT_MISMATCH", () => {
    const result = evaluateConsent(
      { borrowerResponse: "approved", loanExemption: false, borrowerId: "b-different" },
      BORROWER_ID,
      false
    );
    expect(result.allowed).toBe(false);
    expect(result.httpStatus).toBe(403);
    expect(result.code).toBe("CONSENT_MISMATCH");
  });

  it("consent gate logic matches routes.ts source implementation", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("server/routes.ts", "utf8");
    expect(source).toContain("loanExemption === true || verifiedConsentRecord.borrowerResponse === \"approved\"");
    expect(source).toContain('"CONSENT_DENIED"');
    expect(source).toContain('"CONSENT_EXPIRED"');
    expect(source).toContain('"CONSENT_PENDING"');
    expect(source).toContain('"CONSENT_MISMATCH"');
    expect(source).toContain('"CONSENT_INVALID"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E. Webhook replay protection — verifyWebhookSignature
// ─────────────────────────────────────────────────────────────────────────────

describe("E. Webhook replay protection (verifyWebhookSignature)", () => {
  const SECRET = "whsec_test_abc123";
  const PAYLOAD = JSON.stringify({ event: "borrower.created", data: { id: "b-1" } });

  function makeSignature(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  }

  it("verifyWebhookSignature is exported from webhook-delivery", async () => {
    const m = await import("../webhook-delivery");
    expect(typeof m.verifyWebhookSignature).toBe("function");
  });

  it("valid signature + fresh timestamp → { valid: true }", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    const ts = new Date().toISOString();
    const result = verifyWebhookSignature(PAYLOAD, sig, SECRET, ts);
    expect(result.valid).toBe(true);
  });

  it("valid signature + timestamp 6 minutes old → rejected (expired)", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    const oldTs = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const result = verifyWebhookSignature(PAYLOAD, sig, SECRET, oldTs);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/expired/i);
  });

  it("valid signature + timestamp 2 minutes in the future → rejected", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    const futureTs = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const result = verifyWebhookSignature(PAYLOAD, sig, SECRET, futureTs);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/future/i);
  });

  it("tampered payload + valid timestamp → rejected (signature mismatch)", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace("borrower.created", "borrower.deleted");
    const ts = new Date().toISOString();
    const result = verifyWebhookSignature(tampered, sig, SECRET, ts);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/mismatch/i);
  });

  it("wrong secret + valid timestamp → rejected", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, "wrong-secret");
    const ts = new Date().toISOString();
    const result = verifyWebhookSignature(PAYLOAD, sig, SECRET, ts);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/mismatch/i);
  });

  it("missing/invalid timestamp → rejected", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    const result = verifyWebhookSignature(PAYLOAD, sig, SECRET, "not-a-date");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/timestamp/i);
  });

  it("custom maxAgeMs is respected (10 second window)", async () => {
    const { verifyWebhookSignature } = await import("../webhook-delivery");
    const sig = makeSignature(PAYLOAD, SECRET);
    // 15 seconds old — within 30s window, outside 10s window
    const oldTs = new Date(Date.now() - 15_000).toISOString();
    const withinWindow = verifyWebhookSignature(PAYLOAD, sig, SECRET, oldTs, 30_000);
    const outsideWindow = verifyWebhookSignature(PAYLOAD, sig, SECRET, oldTs, 10_000);
    expect(withinWindow.valid).toBe(true);
    expect(outsideWindow.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F. PII ciphertext vs plaintext round-trip
// ─────────────────────────────────────────────────────────────────────────────

describe("F. PII encryption — ciphertext vs plaintext", () => {
  it("encrypted value stored in DB has enc: prefix (never raw plaintext)", async () => {
    const { encryptPII } = await import("../encryption");
    const plaintexts = ["GHA-000012345", "+233501234567", "john.doe@example.com", "1990-01-15"];
    for (const pt of plaintexts) {
      const ciphertext = encryptPII(pt);
      expect(ciphertext).toMatch(/^enc:/);
      expect(ciphertext).not.toContain(pt);
    }
  });

  it("decrypting an enc:-prefixed value returns original plaintext", async () => {
    const { encryptPII, decryptPII } = await import("../encryption");
    const cases = [
      "GHA-123456789",
      "NGA-NATIONAL-ID-99",
      "+2348012345678",
      "sensitive@email.org",
    ];
    for (const pt of cases) {
      expect(decryptPII(encryptPII(pt))).toBe(pt);
    }
  });

  it("decryptPII on a non-enc: value returns the value unchanged (safety fallback)", async () => {
    const { decryptPII } = await import("../encryption");
    const plain = "already-plaintext-value";
    expect(decryptPII(plain)).toBe(plain);
  });

  it("two encryptions of same value produce different ciphertexts (random IV)", async () => {
    const { encryptPII } = await import("../encryption");
    const results = new Set(Array.from({ length: 5 }, () => encryptPII("same-nid-value")));
    expect(results.size).toBe(5);
  });

  it("encrypted NID cannot be searched as plaintext (DB-level privacy)", async () => {
    const { encryptPII } = await import("../encryption");
    const nid = "PRIV-NID-SEARCH-TEST";
    const encrypted = encryptPII(nid);
    // Verify the ciphertext would not match a naive ILIKE search
    expect(encrypted.toLowerCase()).not.toContain(nid.toLowerCase());
  });
});
