const PRODUCTION_DOMAIN = "https://universalcredithub.com";

export function getBaseUrl(): string {
  return process.env.CANONICAL_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
}

export function getCanonicalDomain(): string {
  return process.env.CANONICAL_URL || PRODUCTION_DOMAIN;
}

export function getOAuthCallbackBase(): string {
  if (process.env.CANONICAL_URL) return process.env.CANONICAL_URL.replace(/\/+$/, "");
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  return PRODUCTION_DOMAIN;
}

export function warnIfCanonicalUrlMissing(): void {
  if (!process.env.CANONICAL_URL) {
    console.warn(
      `[base-url] CANONICAL_URL is not set. OAuth callbacks and outbound links will fall back ` +
      `to ${PRODUCTION_DOMAIN}. Set CANONICAL_URL=https://universalcredithub.com in production secrets.`
    );
  } else if (!process.env.CANONICAL_URL.includes("universalcredithub.com")) {
    console.warn(
      `[base-url] CANONICAL_URL (${process.env.CANONICAL_URL}) does not match the expected ` +
      `production domain (universalcredithub.com). Verify the secret is up to date.`
    );
  }
}

export function logOAuthCallbackUrls(): void {
  const base = getOAuthCallbackBase();
  const configured = !!process.env.CANONICAL_URL;
  console.info(
    `[oauth-callbacks] Active callback URLs (CANONICAL_URL ${configured ? "set" : "using fallback: " + base}):\n` +
    `  Google OAuth  → ${base}/api/consumer/auth/google/callback\n` +
    `  Microsoft SSO → ${base}/api/auth/microsoft/callback\n` +
    `  SAML ACS URL  → ${base}/api/auth/saml/callback\n` +
    `  Register these exact URLs at: Google Cloud Console, Microsoft Entra, and your SAML IdP.`
  );
}
