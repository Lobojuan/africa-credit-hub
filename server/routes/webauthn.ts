import { Router } from "express";
import { loginLimiter, requireAuth, safeErrorMessage } from "./middleware";
import { storage } from "../storage";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { webauthnCredentials } from "@shared/schema";
import { broadcastEvent } from "../websocket";
import type { AuthenticatorTransport } from "@simplewebauthn/types";

const router = Router();

// Rate-limit WebAuthn routes to prevent brute-force credential attacks
router.post("/api/auth/webauthn/register-options", loginLimiter, async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingCreds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id));

    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const rpName = "Africa Credit Hub";
    const rpID = req.hostname || "localhost";

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      attestationType: "none",
      excludeCredentials: existingCreds.map(c => ({
        id: c.credentialId,
        type: "public-key" as const,
        transports: (c.transports || []) as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    req.session.webauthnChallenge = options.challenge;
    res.json(options);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/webauthn/register-verify", loginLimiter, async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const challenge = req.session.webauthnChallenge;
    if (!challenge) return res.status(400).json({ message: "No registration challenge found" });

    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const rpID = req.hostname || "localhost";
    const origin = `${req.protocol}://${req.get("host")}`;

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: "Registration verification failed" });
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    await db.insert(webauthnCredentials).values({
      userId: req.session.userId,
      credentialId: Buffer.from(credential.id).toString("base64url"),
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      transports: req.body.response?.transports || [],
    });

    delete req.session.webauthnChallenge;

    await storage.createAuditLog({
      action: "WEBAUTHN_REGISTER",
      entity: "user",
      entityId: req.session.userId,
      userId: req.session.userId,
      details: `Registered biometric credential (${credentialDeviceType})`,
      ipAddress: req.ip || null,
    });

    res.json({ verified: true, deviceType: credentialDeviceType });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/webauthn/login-options", loginLimiter, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username required" });

    const user = await storage.getUserByUsername(username);
    const creds = user ? await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id)) : [];
    // Return generic error to prevent username enumeration via distinct 404 vs 400 responses
    if (!user || creds.length === 0) {
      return res.status(400).json({ message: "Biometric login not available" });
    }

    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    const rpID = req.hostname || "localhost";

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map(c => ({
        id: c.credentialId,
        type: "public-key" as const,
        transports: (c.transports || []) as AuthenticatorTransport[],
      })),
      userVerification: "preferred",
    });

    req.session.webauthnChallenge = options.challenge;
    req.session.webauthnUserId = user.id;
    res.json(options);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.post("/api/auth/webauthn/login-verify", loginLimiter, async (req, res) => {
  try {
    const challenge = req.session?.webauthnChallenge;
    const userId = req.session?.webauthnUserId;
    if (!challenge || !userId) return res.status(400).json({ message: "No authentication challenge found" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const creds = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));

    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const rpID = req.hostname || "localhost";
    const origin = `${req.protocol}://${req.get("host")}`;

    const credId = typeof req.body.id === "string" ? req.body.id : Buffer.from(req.body.rawId).toString("base64url");
    const matchingCred = creds.find(c => c.credentialId === credId);
    if (!matchingCred) return res.status(400).json({ message: "Credential not found" });

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: matchingCred.credentialId,
        publicKey: Buffer.from(matchingCred.publicKey, "base64url"),
        counter: matchingCred.counter,
        transports: (matchingCred.transports || []) as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ message: "Biometric verification failed" });
    }

    await db.update(webauthnCredentials)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(webauthnCredentials.id, matchingCred.id));

    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.organizationId = user.organizationId || undefined;
      req.session.lastActivity = Date.now();

      await storage.createAuditLog({
        action: "LOGIN_BIOMETRIC",
        entity: "user",
        entityId: user.id,
        userId: user.id,
        details: `Biometric login successful for user ${user.username}`,
        ipAddress: req.ip || null,
      });

      broadcastEvent({
        type: "login_event",
        title: "Biometric Login",
        message: `${user.username} logged in via biometric authentication`,
        severity: "info",
        timestamp: new Date().toISOString(),
      }, { roles: ["super_admin", "admin"] });

      const { password: _, ...safeUser } = user;
      req.session.save(() => res.json({ user: safeUser }));
    });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.get("/api/auth/webauthn/credentials", async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const creds = await db.select({
      id: webauthnCredentials.id,
      deviceType: webauthnCredentials.deviceType,
      createdAt: webauthnCredentials.createdAt,
    }).from(webauthnCredentials).where(eq(webauthnCredentials.userId, req.session.userId));
    res.json(creds);
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

router.delete("/api/auth/webauthn/credentials/:id", requireAuth, async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    await db.delete(webauthnCredentials).where(
      and(eq(webauthnCredentials.id, req.params.id), eq(webauthnCredentials.userId, req.session.userId))
    );
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ message: safeErrorMessage(e) });
  }
});

export default router;
