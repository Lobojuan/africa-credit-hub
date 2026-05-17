import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { createLogger } from "../logger";
import { getOAuthCallbackBase } from "../base-url";
import { isPlatformPrivileged, requireAuth, requireSuperAdmin } from "./middleware";

const logger = createLogger("oauth");

// ─── Return-path sanitiser ────────────────────────────────────────────────────

const ALLOWED_RETURN_PATHS = [
  "/my-credit", "/start-trial", "/dashboard",
  "/solutions", "/pricing", "/ai-demo",
];

export function sanitizeReturnPath(raw: string | undefined): string {
  if (!raw) return "/my-credit";
  const cleaned = raw.split("?")[0].split("#")[0];
  if (ALLOWED_RETURN_PATHS.includes(cleaned)) return cleaned;
  if (cleaned.startsWith("/") && !cleaned.startsWith("//") && !cleaned.includes("://")) {
    return cleaned;
  }
  return "/my-credit";
}

// ─── Redirect-URI helpers (respect CANONICAL_URL in production) ───────────────

export function getGoogleRedirectUri(req: Request): string {
  const base = getOAuthCallbackBase();
  if (process.env.CANONICAL_URL || !req.get("host"))
    return `${base}/api/consumer/auth/google/callback`;
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${protocol}://${req.get("host")}/api/consumer/auth/google/callback`;
}

export function getMicrosoftRedirectUri(req: Request): string {
  const base = getOAuthCallbackBase();
  if (process.env.CANONICAL_URL || !req.get("host"))
    return `${base}/api/auth/microsoft/callback`;
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${protocol}://${req.get("host")}/api/auth/microsoft/callback`;
}

// ─── Dependency interface ─────────────────────────────────────────────────────
// Keeps the router unit-testable: tests supply lightweight mock deps instead of
// wiring up the full Drizzle/pg stack.

export interface OAuthDeps {
  /**
   * Look up a platform user by exact email.  Returns null when not found.
   */
  findUserByEmail(email: string): Promise<{
    id: string;
    role: string;
    organizationId: string | null;
    status: string;
    email: string;
  } | null>;

  /**
   * Look up a consumer account by Google sub-ID.  Returns null when not found.
   */
  findConsumerByGoogleId(googleId: string): Promise<{
    id: string;
    nationalId: string;
    email: string;
    googleId: string | null;
    authProvider: string;
    fullName: string | null;
  } | null>;

  /**
   * Look up a consumer account by email.  Returns null when not found.
   */
  findConsumerByEmail(email: string): Promise<{
    id: string;
    nationalId: string;
    email: string;
    googleId: string | null;
    authProvider: string;
    fullName: string | null;
  } | null>;

  /**
   * Create a new consumer account via Google OAuth (first-time sign-in).
   * Returns the new account's id and nationalId.
   */
  createGoogleConsumer(data: {
    nationalId: string;
    email: string;
    fullName: string | null;
    googleId: string;
    profilePicture: string | null;
  }): Promise<{ id: string; nationalId: string }>;

  /**
   * Link a Google sub-ID to an existing consumer account found by email.
   */
  linkGoogleIdToConsumer(consumerId: string, googleId: string, profilePicture: string | null, fullName: string | null): Promise<void>;

  /** Update last-login timestamp for a consumer. */
  touchConsumerLastLogin(consumerId: string): Promise<void>;

  /** Look up an organisation (for country/workspace scoping after login). */
  getOrganization(orgId: string): Promise<{ country?: string } | null>;

  /**
   * Look up a platform user (admin) by email for Microsoft SSO.
   * Same shape as findUserByEmail — provided as a separate slot so tests
   * can mock it independently.
   */
  findMsUserByEmail(email: string): Promise<{
    id: string;
    role: string;
    organizationId: string | null;
    status: string;
  } | null>;

  /**
   * Look up a consumer by email for Microsoft SSO.
   */
  findMsConsumerByEmail(email: string): Promise<{
    id: string;
    nationalId: string;
  } | null>;
}

// ─── Production dependency factory ───────────────────────────────────────────
// Constructed once inside registerOAuthRoutes so the real DB import only
// happens when the module is used in production (not in unit tests that
// supply their own deps).

async function buildProductionDeps(): Promise<OAuthDeps> {
  const { db } = await import("../db");
  const { storage } = await import("../storage");
  const { users, consumerAccounts } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");

  return {
    async findUserByEmail(email: string) {
      const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return u ?? null;
    },
    async findConsumerByGoogleId(googleId: string) {
      const [a] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.googleId, googleId)).limit(1);
      return (a ?? null) as any;
    },
    async findConsumerByEmail(email: string) {
      const [a] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.email, email)).limit(1);
      return (a ?? null) as any;
    },
    async createGoogleConsumer(data: { nationalId: string; email: string; fullName: string | null; googleId: string; profilePicture: string | null }) {
      const [newAccount] = await db.insert(consumerAccounts).values({
        nationalId: data.nationalId,
        email: data.email,
        fullName: data.fullName,
        googleId: data.googleId,
        profilePicture: data.profilePicture,
        authProvider: "google",
        verified: true,
        verificationMethod: "google",
      }).returning();
      return { id: newAccount.id, nationalId: newAccount.nationalId };
    },
    async linkGoogleIdToConsumer(consumerId: string, googleId: string, profilePicture: string | null, fullName: string | null) {
      await db.update(consumerAccounts).set({
        googleId,
        profilePicture: profilePicture ?? null,
        fullName: fullName ?? undefined,
        authProvider: "google",
        verified: true,
      }).where(eq(consumerAccounts.id, consumerId));
    },
    async touchConsumerLastLogin(consumerId: string) {
      await db.update(consumerAccounts).set({ lastLogin: new Date() }).where(eq(consumerAccounts.id, consumerId));
    },
    async getOrganization(orgId: string) {
      return storage.getOrganization(orgId) as any;
    },
    async findMsUserByEmail(email: string) {
      const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return u ?? null;
    },
    async findMsConsumerByEmail(email: string) {
      const [a] = await db.select().from(consumerAccounts).where(eq(consumerAccounts.email, email)).limit(1);
      return (a ?? null) as any;
    },
  };
}

// ─── Router registration ──────────────────────────────────────────────────────

export async function registerOAuthRoutes(app: Express, injectedDeps?: OAuthDeps): Promise<void> {
  const deps: OAuthDeps = injectedDeps ?? (await buildProductionDeps());

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "";
  const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "";
  const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";

  // ─── Google OAuth — consumer portal ─────────────────────────────────────────

  app.get("/api/consumer/auth/google", (req: Request, res: Response) => {
    const returnTo = sanitizeReturnPath(req.query.from as string);
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Sign-In</title></head>` +
        `<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;">` +
        `<div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);">` +
        `<h2 style="color:#1a1a2e;">Google Sign-In Coming Soon</h2>` +
        `<p style="color:#555;font-size:14px;">Google Sign-In is being configured. Please use email/password registration for now.</p>` +
        `<a href="${returnTo}" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Go Back</a>` +
        `</div></body></html>`
      );
    }
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as unknown as Record<string, unknown>).googleOAuthState = state;
    (req.session as unknown as Record<string, unknown>).googleOAuthReturnTo = returnTo;
    const redirectUri = getGoogleRedirectUri(req);
    logger.info(`[Google] Initiating OAuth: redirect_uri=${redirectUri}, returnTo=${returnTo}`);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    req.session.save((err) => {
      if (err) logger.error("[Google] Session save error before redirect:", { detail: err });
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });
  });

  app.get("/api/consumer/auth/google/callback", async (req: Request, res: Response) => {
    const returnTo = (req.session as unknown as Record<string, unknown>).googleOAuthReturnTo as string || "/my-credit";
    try {
      const { code, state, error: oauthError } = req.query;
      logger.info(`[Google] Callback: code=${code ? "yes" : "no"}, state=${state ? "yes" : "no"}, error=${oauthError || "none"}`);

      if (oauthError) {
        logger.error(`[Google] OAuth error from Google: ${oauthError}`);
        return res.redirect(`/login?error=${oauthError}`);
      }
      if (!code || !state) return res.redirect(`${returnTo}?error=missing_params`);

      if (state !== (req.session as unknown as Record<string, unknown>).googleOAuthState) {
        logger.error(`[Google] State mismatch`);
        return res.redirect(`${returnTo}?error=invalid_state`);
      }
      delete (req.session as unknown as Record<string, unknown>).googleOAuthState;

      // ── E2E test-mode bypass: skip real provider calls ───────────────────────
      // Active only when all three conditions hold:
      //   1. ENABLE_E2E_TEST_AUTH=true  (set by playwright.config.ts webServer env)
      //   2. NODE_ENV is not "production"
      //   3. PRODUCTION_MODE is not "true"
      // This triple-guard ensures the bypass is inert in any production context
      // even if ENABLE_E2E_TEST_AUTH is accidentally set.
      if (
        process.env.ENABLE_E2E_TEST_AUTH === "true" &&
        process.env.NODE_ENV !== "production" &&
        process.env.PRODUCTION_MODE !== "true" &&
        code === "e2e-google-code"
      ) {
        return req.session.regenerate((regenerateErr) => {
          if (regenerateErr) return res.redirect(`${returnTo}?error=session_error`);
          (req.session as unknown as Record<string, unknown>).consumerId = "e2e-google-consumer-test";
          (req.session as unknown as Record<string, unknown>).consumerNationalId = "GOOGLE-E2E-TEST-001";
          req.session.lastActivity = Date.now();
          req.session.save((saveErr) => {
            if (saveErr) return res.redirect(`${returnTo}?error=session_error`);
            logger.info("[E2E][Google] Mock consumer session created → " + returnTo);
            res.redirect(returnTo);
          });
        });
      }
      // ────────────────────────────────────────────────────────────────────────

      const redirectUri = getGoogleRedirectUri(req);
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });
      const tokenData = await tokenResp.json() as Record<string, unknown>;
      if (!tokenData.access_token) {
        logger.error("[Consumer][Google] Token exchange failed:", { detail: tokenData });
        return res.redirect(`${returnTo}?error=token_failed`);
      }

      const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userResp.json() as Record<string, unknown>;
      if (!googleUser.email) return res.redirect(`${returnTo}?error=no_email`);

      // Admin / institutional user path
      const adminUser = await deps.findUserByEmail(googleUser.email as string);
      if (adminUser && adminUser.status !== "suspended") {
        const organization = adminUser.organizationId
          ? await deps.getOrganization(adminUser.organizationId)
          : null;
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (isPlatformPrivileged(adminUser.role)) {
            delete (req.session as unknown as Record<string, unknown>).viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = isPlatformPrivileged(adminUser.role) ? "/command-center" : "/dashboard";
          logger.info(`[Admin][Google] Login user ${adminUser.id.slice(0, 8)}... role=${adminUser.role} → ${dest}`);
          req.session.save((saveErr) => {
            if (saveErr) return res.redirect("/login?error=session_error");
            res.redirect(dest);
          });
        });
      }

      // Consumer path
      let account = await deps.findConsumerByGoogleId(googleUser.id as string);
      if (!account) {
        const existing = await deps.findConsumerByEmail(googleUser.email as string);
        if (existing) {
          await deps.linkGoogleIdToConsumer(
            existing.id,
            googleUser.id as string,
            (googleUser.picture as string) ?? null,
            (googleUser.name as string) ?? null
          );
          account = { ...existing, googleId: googleUser.id as string, authProvider: "google" };
        } else {
          const nationalId = `GOOGLE-${(googleUser.id as string).slice(0, 12)}`;
          const created = await deps.createGoogleConsumer({
            nationalId,
            email: googleUser.email as string,
            fullName: (googleUser.name as string) ?? null,
            googleId: googleUser.id as string,
            profilePicture: (googleUser.picture as string) ?? null,
          });
          account = { id: created.id, nationalId: created.nationalId, email: googleUser.email as string, googleId: googleUser.id as string, authProvider: "google", fullName: null };
        }
      }

      await deps.touchConsumerLastLogin(account.id);

      req.session.regenerate((err) => {
        if (err) return res.redirect("/my-credit?error=session_error");
        (req.session as unknown as Record<string, unknown>).consumerId = account!.id;
        (req.session as unknown as Record<string, unknown>).consumerNationalId = account!.nationalId;
        req.session.lastActivity = Date.now();
        logger.info(`[Consumer][Google] Login consumer ${account!.id.slice(0, 8)}...`);
        req.session.save((saveErr) => {
          if (saveErr) return res.redirect("/my-credit?error=session_error");
          res.redirect(returnTo);
        });
      });
    } catch (e: unknown) {
      logger.error("[Consumer][Google] OAuth error:", { detail: (e as Error).message });
      res.redirect(`${returnTo}?error=oauth_failed`);
    }
  });

  app.get("/api/consumer/auth/apple", (_req: Request, res: Response) => {
    res.status(503).send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Apple Sign-In</title></head>` +
      `<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;">` +
      `<div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);">` +
      `<h2 style="color:#1a1a2e;">Apple Sign-In Coming Soon</h2>` +
      `<p style="color:#555;font-size:14px;">Apple Sign-In requires an Apple Developer account and is being set up. Please use Google or email/password registration for now.</p>` +
      `<a href="/my-credit" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Back to Login</a>` +
      `</div></body></html>`
    );
  });

  // ─── Microsoft SSO ───────────────────────────────────────────────────────────

  app.get("/api/auth/microsoft", (req: Request, res: Response) => {
    const returnTo = sanitizeReturnPath(req.query.from as string);
    if (!MICROSOFT_CLIENT_ID) {
      return res.status(503).send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Microsoft Sign-In</title></head>` +
        `<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;">` +
        `<div style="max-width:400px;background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);">` +
        `<h2 style="color:#1a1a2e;">Microsoft Sign-In</h2>` +
        `<p style="color:#555;font-size:14px;">Microsoft Sign-In requires Azure AD configuration. Please contact your administrator.</p>` +
        `<a href="${returnTo}" style="display:inline-block;margin-top:16px;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Go Back</a>` +
        `</div></body></html>`
      );
    }
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as unknown as Record<string, unknown>).microsoftOAuthState = state;
    (req.session as unknown as Record<string, unknown>).microsoftOAuthReturnTo = returnTo;
    const redirectUri = getMicrosoftRedirectUri(req);
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile User.Read",
      state,
      response_mode: "query",
      prompt: "select_account",
    });
    res.redirect(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
  });

  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    const returnTo = (req.session as unknown as Record<string, unknown>).microsoftOAuthReturnTo as string || "/dashboard";
    try {
      const { code, state } = req.query;
      if (!code || !state) return res.redirect(`${returnTo}?error=missing_params`);

      if (state !== (req.session as unknown as Record<string, unknown>).microsoftOAuthState) {
        return res.redirect(`${returnTo}?error=invalid_state`);
      }
      delete (req.session as unknown as Record<string, unknown>).microsoftOAuthState;

      // ── E2E test-mode bypass: skip real provider calls ───────────────────────
      // Active only when all three conditions hold:
      //   1. ENABLE_E2E_TEST_AUTH=true  (set by playwright.config.ts webServer env)
      //   2. NODE_ENV is not "production"
      //   3. PRODUCTION_MODE is not "true"
      if (
        process.env.ENABLE_E2E_TEST_AUTH === "true" &&
        process.env.NODE_ENV !== "production" &&
        process.env.PRODUCTION_MODE !== "true" &&
        code === "e2e-ms-code"
      ) {
        return req.session.regenerate((regenerateErr) => {
          if (regenerateErr) return res.redirect("/login?error=session_error");
          req.session.userId = "e2e-ms-admin-test-user";
          req.session.userRole = "admin";
          req.session.lastActivity = Date.now();
          req.session.save((saveErr) => {
            if (saveErr) return res.redirect("/login?error=session_error");
            logger.info("[E2E][Microsoft] Mock admin session created → /dashboard");
            res.redirect("/dashboard");
          });
        });
      }
      // ────────────────────────────────────────────────────────────────────────

      const redirectUri = getMicrosoftRedirectUri(req);
      const tokenResp = await fetch(
        `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: code as string,
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
            scope: "openid email profile User.Read",
          }).toString(),
        }
      );
      const tokenData = await tokenResp.json() as Record<string, unknown>;
      if (!tokenData.access_token) {
        logger.error("[Microsoft] Token exchange failed:", { detail: tokenData });
        return res.redirect(`${returnTo}?error=token_failed`);
      }

      const userResp = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const msUser = await userResp.json() as Record<string, unknown>;
      const email = (msUser.mail || msUser.userPrincipalName) as string | undefined;
      if (!email) return res.redirect(`${returnTo}?error=no_email`);

      // Admin path
      const adminUser = await deps.findMsUserByEmail(email);
      if (adminUser && adminUser.status !== "suspended") {
        const organization = adminUser.organizationId
          ? await deps.getOrganization(adminUser.organizationId)
          : null;
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          req.session.userId = adminUser.id;
          req.session.userRole = adminUser.role;
          req.session.organizationId = adminUser.organizationId || undefined;
          req.session.lastActivity = Date.now();
          if (isPlatformPrivileged(adminUser.role)) {
            delete (req.session as unknown as Record<string, unknown>).viewingCountry;
          } else if (organization?.country) {
            req.session.userCountry = organization.country;
          }
          const dest = isPlatformPrivileged(adminUser.role) ? "/command-center" : "/dashboard";
          logger.info(`[Admin][Microsoft] Login user ${adminUser.id.slice(0, 8)}... role=${adminUser.role} → ${dest}`);
          req.session.save((saveErr) => {
            if (saveErr) return res.redirect("/login?error=session_error");
            res.redirect(dest);
          });
        });
      }

      // Consumer path
      const consumer = await deps.findMsConsumerByEmail(email);
      if (consumer) {
        return req.session.regenerate((err) => {
          if (err) return res.redirect("/login?error=session_error");
          (req.session as unknown as Record<string, unknown>).consumerId = consumer.id;
          (req.session as unknown as Record<string, unknown>).consumerNationalId = consumer.nationalId;
          req.session.lastActivity = Date.now();
          logger.info(`[Consumer][Microsoft] Login consumer ${consumer.id.slice(0, 8)}...`);
          req.session.save(() => res.redirect("/my-credit"));
        });
      }

      res.redirect(`/login?error=no_account&provider=microsoft&email=${encodeURIComponent(email)}`);
    } catch (e: unknown) {
      logger.error("[Microsoft] Callback error:", { detail: (e as Error).message });
      res.redirect("/login?error=auth_failed");
    }
  });

  // ─── OAuth status / smoke-test checklist (super-admin) ───────────────────────

  app.get("/api/auth/oauth-status", requireAuth, requireSuperAdmin, (_req: Request, res: Response) => {
    const base = getOAuthCallbackBase();
    const canonicalConfigured = !!process.env.CANONICAL_URL;

    res.json({
      canonicalUrl: {
        value: base,
        source: canonicalConfigured
          ? "CANONICAL_URL env var"
          : process.env.REPLIT_DOMAINS
            ? "REPLIT_DOMAINS env var (fallback)"
            : "hardcoded production default (fallback)",
        configured: canonicalConfigured,
        warning: !canonicalConfigured
          ? "Set CANONICAL_URL=https://universalcredithub.com in production secrets for stable OAuth callbacks."
          : null,
      },
      providers: {
        google: {
          label: "Google OAuth",
          credentialsPresent: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
          callbackUrl: `${base}/api/consumer/auth/google/callback`,
          registerAt: "https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs",
          ready: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
        },
        microsoft: {
          label: "Microsoft Azure / Entra ID SSO",
          credentialsPresent: !!(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET),
          callbackUrl: `${base}/api/auth/microsoft/callback`,
          registerAt: "https://portal.azure.com → Azure Active Directory → App registrations → Authentication → Redirect URIs",
          ready: !!(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET),
        },
        saml: {
          label: "SAML 2.0 SSO",
          credentialsPresent: !!(process.env.SAML_IDP_ENTRY_POINT && process.env.SAML_ISSUER),
          callbackUrl: `${base}/api/auth/saml/callback`,
          metadataUrl: `${base}/api/auth/saml/metadata`,
          registerAt: "Your SAML IdP admin console → Service Provider ACS URL",
          ready: !!(process.env.SAML_IDP_ENTRY_POINT && process.env.SAML_ISSUER),
        },
      },
      smokeTestChecklist: [
        { step: 1, description: "Confirm CANONICAL_URL is set to https://universalcredithub.com in production secrets", done: canonicalConfigured },
        { step: 2, description: `Register ${base}/api/consumer/auth/google/callback as an authorized redirect URI in Google Cloud Console`, requiredFor: "Google OAuth" },
        { step: 3, description: `Register ${base}/api/auth/microsoft/callback as a redirect URI in Microsoft Entra app registration`, requiredFor: "Microsoft SSO" },
        { step: 4, description: `Set ACS URL to ${base}/api/auth/saml/callback in your SAML IdP (or import SP metadata from ${base}/api/auth/saml/metadata)`, requiredFor: "SAML 2.0" },
        { step: 5, description: "On https://universalcredithub.com/login, click 'Sign in with Google' and complete the flow — verify redirect back and session creation", requiredFor: "Google OAuth" },
        { step: 6, description: "On https://universalcredithub.com/login, click 'Sign in with Microsoft' and complete the flow — verify redirect back and session creation", requiredFor: "Microsoft SSO" },
        { step: 7, description: "Navigate to https://universalcredithub.com/api/auth/saml/login and complete the IdP-initiated flow — verify redirect back and session creation", requiredFor: "SAML 2.0" },
      ],
    });
  });
}
