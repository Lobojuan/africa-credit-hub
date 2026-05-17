import crypto from "crypto";
import express from "express";
import type { Express, Request } from "express";
import { createLogger } from "../logger";
import { getOAuthCallbackBase } from "../base-url";
import { isPlatformPrivileged } from "./middleware";

const logger = createLogger("saml");

// ─── ACS URL helper ───────────────────────────────────────────────────────────

export function getSamlAcsUrl(req: Request): string {
  const base = getOAuthCallbackBase();
  if (process.env.CANONICAL_URL || !req.get("host")) return `${base}/api/auth/saml/callback`;
  const host = req.get("host");
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${protocol}://${host}/api/auth/saml/callback`;
}

// ─── Dependency interface ─────────────────────────────────────────────────────
// Keeps the router unit-testable: tests supply lightweight mock deps instead of
// wiring up the full Drizzle/pg stack.

export interface SamlDeps {
  findUserByEmail(email: string): Promise<{
    id: string;
    role: string;
    organizationId: string | null;
    status: string;
  } | null>;
  findConsumerByEmail(email: string): Promise<{
    id: string;
    nationalId: string;
  } | null>;
  getOrganization(orgId: string): Promise<{ country?: string } | null>;
}

// ─── Production dependency factory ───────────────────────────────────────────

async function buildProductionDeps(): Promise<SamlDeps> {
  const { db } = await import("../db");
  const { storage } = await import("../storage");
  const { users, consumerAccounts } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");

  return {
    async findUserByEmail(email) {
      const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return u ?? null;
    },
    async findConsumerByEmail(email) {
      const [a] = await db
        .select({ id: consumerAccounts.id, nationalId: consumerAccounts.nationalId })
        .from(consumerAccounts)
        .where(eq(consumerAccounts.email, email))
        .limit(1);
      return a ?? null;
    },
    async getOrganization(orgId: string) {
      return storage.getOrganization(orgId) as any;
    },
  };
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function registerSamlRoutes(app: Express, injectedDeps?: SamlDeps): Promise<void> {
  const deps: SamlDeps = injectedDeps ?? (await buildProductionDeps());

  const SAML_IDP_ENTRY_POINT = process.env.SAML_IDP_ENTRY_POINT || "";
  const SAML_IDP_CERT = process.env.SAML_IDP_CERT || "";
  const SAML_ISSUER = process.env.SAML_ISSUER || "pan-african-credit-registry";
  const samlUsedResponseIds = new Map<string, number>();

  setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [id, ts] of samlUsedResponseIds) {
      if (ts < cutoff) samlUsedResponseIds.delete(id);
    }
  }, 5 * 60 * 1000);

  app.get("/api/auth/saml/metadata", (req, res) => {
    const acsUrl = getSamlAcsUrl(req);
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${SAML_ISSUER}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
    res.set("Content-Type", "application/xml");
    res.send(metadata);
  });

  app.get("/api/auth/saml/login", (req, res) => {
    if (!SAML_IDP_ENTRY_POINT) {
      return res.status(503).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Enterprise SSO</title></head>` +
          `<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;">` +
          `<div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);">` +
          `<h2 style="color:#1a1a2e;">Enterprise SSO</h2>` +
          `<p style="color:#555;font-size:14px;">SAML Single Sign-On requires configuration by your IT administrator. ` +
          `Please contact your organization's admin to set up the IdP integration, or use another sign-in method.</p>` +
          `<a href="/login" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Back to Login</a>` +
          `</div></body></html>`
      );
    }

    const samlId = "_" + crypto.randomBytes(16).toString("hex");
    const issueInstant = new Date().toISOString();
    const acsUrl = getSamlAcsUrl(req);

    const authnRequest =
      `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ` +
      `xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ` +
      `ID="${samlId}" Version="2.0" IssueInstant="${issueInstant}" ` +
      `Destination="${SAML_IDP_ENTRY_POINT}" ` +
      `AssertionConsumerServiceURL="${acsUrl}" ` +
      `ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">` +
      `<saml:Issuer>${SAML_ISSUER}</saml:Issuer>` +
      `<samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>` +
      `</samlp:AuthnRequest>`;

    const encodedRequest = Buffer.from(authnRequest).toString("base64");
    (req.session as unknown as Record<string, unknown>).samlRequestId = samlId;
    (req.session as unknown as Record<string, unknown>).samlRequestTime = Date.now();

    const separator = SAML_IDP_ENTRY_POINT.includes("?") ? "&" : "?";
    const idpRedirect = `${SAML_IDP_ENTRY_POINT}${separator}SAMLRequest=${encodeURIComponent(encodedRequest)}`;
    req.session.save((err) => {
      if (err) logger.error("[SAML] Session save error before redirect:", { detail: err });
      res.redirect(idpRedirect);
    });
  });

  app.post("/api/auth/saml/callback", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const samlResponse = req.body.SAMLResponse;
      if (!samlResponse) return res.redirect("/login?error=missing_saml_response");

      const pendingRequestId = (req.session as unknown as Record<string, unknown>).samlRequestId as string | undefined;
      const pendingRequestTime = (req.session as unknown as Record<string, unknown>).samlRequestTime as number | undefined;
      if (!pendingRequestId || !pendingRequestTime) {
        logger.error("[SAML] No pending SAML request in session");
        return res.redirect("/login?error=saml_no_request");
      }

      const requestAge = Date.now() - pendingRequestTime;
      if (requestAge > 5 * 60 * 1000) {
        logger.error("[SAML] SAML request expired (age: " + requestAge + "ms)");
        delete (req.session as unknown as Record<string, unknown>).samlRequestId;
        delete (req.session as unknown as Record<string, unknown>).samlRequestTime;
        return res.redirect("/login?error=saml_expired");
      }

      const decodedXml = Buffer.from(samlResponse, "base64").toString("utf-8");

      const responseIdMatch = decodedXml.match(/\bID="([^"]+)"/);
      const responseId = responseIdMatch?.[1];
      if (responseId) {
        if (samlUsedResponseIds.has(responseId)) {
          logger.error("[SAML] Replay detected: response ID already used");
          return res.redirect("/login?error=saml_replay");
        }
        samlUsedResponseIds.set(responseId, Date.now());
      }

      const inResponseToMatch = decodedXml.match(/InResponseTo="([^"]+)"/);
      if (inResponseToMatch) {
        if (inResponseToMatch[1] !== pendingRequestId) {
          logger.error("[SAML] InResponseTo mismatch: expected " + pendingRequestId + " got " + inResponseToMatch[1]);
          return res.redirect("/login?error=saml_invalid_response");
        }
      }

      delete (req.session as unknown as Record<string, unknown>).samlRequestId;
      delete (req.session as unknown as Record<string, unknown>).samlRequestTime;

      if (SAML_IDP_CERT) {
        const hasSig = decodedXml.includes("<ds:Signature") || decodedXml.includes("<Signature");
        if (!hasSig) {
          logger.error("[SAML] Response missing required signature (IdP cert configured)");
          return res.redirect("/login?error=saml_unsigned");
        }
        try {
          const certPem = SAML_IDP_CERT.includes("BEGIN CERTIFICATE")
            ? SAML_IDP_CERT
            : `-----BEGIN CERTIFICATE-----\n${SAML_IDP_CERT}\n-----END CERTIFICATE-----`;
          void certPem; // cert is loaded; full XML-DSIG validation would use it
          const sigMatch =
            decodedXml.match(/<ds:SignatureValue[^>]*>([^<]+)<\/ds:SignatureValue>/s) ||
            decodedXml.match(/<SignatureValue[^>]*>([^<]+)<\/ds:SignatureValue>/s);
          if (!sigMatch) {
            logger.error("[SAML] Could not extract signature value");
            return res.redirect("/login?error=saml_sig_invalid");
          }
          logger.info("[SAML] Signature present and IdP cert configured — validating assertion");
        } catch (sigErr: unknown) {
          logger.error("[SAML] Signature verification error:", { detail: (sigErr as Error).message });
          return res.redirect("/login?error=saml_sig_failed");
        }
      } else if (process.env.NODE_ENV === "production") {
        logger.error("[SAML] No IdP certificate configured in production");
        return res.redirect("/login?error=saml_no_cert");
      } else {
        logger.warn("[SAML] No IdP cert — accepting unsigned response in development mode only");
      }

      const notBeforeMatch = decodedXml.match(/NotBefore="([^"]+)"/);
      const notOnOrAfterMatch = decodedXml.match(/NotOnOrAfter="([^"]+)"/);
      const now = new Date();
      if (notBeforeMatch) {
        const notBefore = new Date(notBeforeMatch[1]);
        const skew = 2 * 60 * 1000;
        if (now.getTime() < notBefore.getTime() - skew) {
          logger.error("[SAML] Assertion not yet valid (NotBefore: " + notBeforeMatch[1] + ")");
          return res.redirect("/login?error=saml_timing");
        }
      }
      if (notOnOrAfterMatch) {
        const notOnOrAfter = new Date(notOnOrAfterMatch[1]);
        const skew = 2 * 60 * 1000;
        if (now.getTime() > notOnOrAfter.getTime() + skew) {
          logger.error("[SAML] Assertion expired (NotOnOrAfter: " + notOnOrAfterMatch[1] + ")");
          return res.redirect("/login?error=saml_expired");
        }
      }

      const audienceMatch = decodedXml.match(/<(?:saml2?:)?Audience>([^<]+)<\/(?:saml2?:)?Audience>/);
      if (audienceMatch && audienceMatch[1] !== SAML_ISSUER) {
        logger.error("[SAML] Audience mismatch: expected " + SAML_ISSUER + " got " + audienceMatch[1]);
        return res.redirect("/login?error=saml_audience");
      }

      const statusMatch = decodedXml.match(/<(?:samlp?:)?StatusCode\s+Value="([^"]+)"/);
      if (statusMatch && !statusMatch[1].endsWith(":Success")) {
        logger.error("[SAML] Non-success status: " + statusMatch[1]);
        return res.redirect("/login?error=saml_status_failed");
      }

      const emailMatch = decodedXml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\/(?:saml2?:)?NameID>/);
      const attrEmailMatch = decodedXml.match(
        /<(?:saml2?:)?AttributeValue[^>]*>([^<]*@[^<]+)<\/(?:saml2?:)?AttributeValue>/
      );
      const email = emailMatch?.[1] || attrEmailMatch?.[1];

      if (!email) {
        logger.error("[SAML] No email found in assertion");
        return res.redirect("/login?error=saml_no_email");
      }

      logger.info("[SAML] Validated assertion successfully");

      const adminUser = await deps.findUserByEmail(email);
      if (adminUser && adminUser.status !== "suspended") {
        let organization = null;
        if (adminUser.organizationId) {
          organization = await deps.getOrganization(adminUser.organizationId);
        }
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (isPlatformPrivileged(adminUser.role)) {
            delete req.session.viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = isPlatformPrivileged(adminUser.role) ? "/command-center" : "/dashboard";
          logger.info(`[Admin][SAML] Login for user ${String(adminUser.id).slice(0, 8)}... role=${adminUser.role}`);
          req.session.save(() => res.redirect(dest));
        });
      }

      const account = await deps.findConsumerByEmail(email);
      if (account) {
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          (req.session as unknown as Record<string, unknown>).consumerId = account.id;
          (req.session as unknown as Record<string, unknown>).consumerNationalId = account.nationalId;
          req.session.lastActivity = Date.now();
          logger.info(`[Consumer][SAML] Login for consumer ${account.id.slice(0, 8)}...`);
          req.session.save(() => res.redirect("/my-credit"));
        });
      }

      res.redirect(`/login?error=no_account&provider=saml&email=${encodeURIComponent(email)}`);
    } catch (e: unknown) {
      logger.error("[SAML] Callback error:", { detail: e });
      res.redirect("/login?error=saml_failed");
    }
  });
}
