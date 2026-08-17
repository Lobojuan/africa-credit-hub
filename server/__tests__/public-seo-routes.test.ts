import { describe, expect, it } from "vitest";
import { getPublicSitemapXml, isPublicSeoPath } from "../seo-public-routes";
import { getOriginalRequestPath, renderPublicSeoHtml } from "../static";

const shell = `<!doctype html><html><head>
<title>Universal Credit Hub</title>
<meta name="description" content="default" />
<meta property="og:title" content="default" />
<meta property="og:description" content="default" />
<meta property="og:url" content="https://universalcredithub.com" />
<meta name="twitter:title" content="default" />
<meta name="twitter:description" content="default" />
<link rel="canonical" href="https://universalcredithub.com" />
</head><body><div id="root"></div></body></html>`;

describe("public SEO route manifest", () => {
  it("indexes only intentional public routes", () => {
    expect(isPublicSeoPath("/forensics")).toBe(true);
    expect(isPublicSeoPath("/forensics/")).toBe(true);
    expect(isPublicSeoPath("/fr")).toBe(true);
    expect(isPublicSeoPath("/contact-sales")).toBe(true);
    expect(isPublicSeoPath("/collateral")).toBe(true);
    expect(isPublicSeoPath("/loto")).toBe(true);
    expect(isPublicSeoPath("/terms")).toBe(true);
    expect(isPublicSeoPath("/privacy")).toBe(true);
    expect(isPublicSeoPath("/credit")).toBe(false);
    expect(isPublicSeoPath("/login")).toBe(false);
    expect(isPublicSeoPath("/api/borrowers")).toBe(false);
  });

  it("lists every public route in the sitemap", () => {
    const sitemap = getPublicSitemapXml("https://universalcredithub.com/");
    expect(sitemap).toContain("https://universalcredithub.com/forensics");
    expect(sitemap).toContain("https://universalcredithub.com/contact-sales");
    expect(sitemap).toContain("https://universalcredithub.com/fr");
    expect(sitemap).toContain("https://universalcredithub.com/collateral");
    expect(sitemap).toContain("https://universalcredithub.com/loto");
    expect(sitemap).toContain("https://universalcredithub.com/terms");
    expect(sitemap).toContain("https://universalcredithub.com/privacy");
    expect(sitemap).not.toContain("/login</loc>");
  });

  it("renders route metadata in the initial HTML response", () => {
    const html = renderPublicSeoHtml(shell, "/forensics");
    expect(html).toContain("Bank Diagnostic &amp; Forensics for African Banks");
    expect(html).toContain('content="https://universalcredithub.com/forensics"');
    expect(html).toContain('rel="canonical" href="https://universalcredithub.com/forensics"');
  });

  it.each([
    ["/collateral", "Collateral Registry for African Lenders"],
    ["/loto", "Loto Fiscal &amp; Verified Receipt Credit Data"],
    ["/terms", "Terms of Service — Universal Credit Hub"],
    ["/privacy", "Privacy Policy — Universal Credit Hub"],
  ])("renders unique metadata for %s", (path, expectedTitle) => {
    const html = renderPublicSeoHtml(shell, path);
    expect(html).toContain(expectedTitle);
    expect(html).toContain(`rel="canonical" href="https://universalcredithub.com${path}"`);
  });

  it("renders a French home page with reciprocal language metadata", () => {
    const html = renderPublicSeoHtml(shell, "/fr");
    expect(html).toContain('<html lang="fr"');
    expect(html).toContain("Opérations de risque bancaire maîtrisées");
    expect(html).toContain('rel="canonical" href="https://universalcredithub.com/fr"');
    expect(html).toContain('hreflang="fr" href="https://universalcredithub.com/fr"');
  });

  it("keeps the original SPA route when Express consumes a wildcard mount", () => {
    expect(getOriginalRequestPath("/forensics?source=linkedin")).toBe("/forensics");
    expect(getOriginalRequestPath("/contact-sales/")).toBe("/contact-sales");
  });
});
