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
    expect(isPublicSeoPath("/contact-sales")).toBe(true);
    expect(isPublicSeoPath("/login")).toBe(false);
    expect(isPublicSeoPath("/api/borrowers")).toBe(false);
  });

  it("lists every public route in the sitemap", () => {
    const sitemap = getPublicSitemapXml("https://universalcredithub.com/");
    expect(sitemap).toContain("https://universalcredithub.com/forensics");
    expect(sitemap).toContain("https://universalcredithub.com/contact-sales");
    expect(sitemap).not.toContain("/login</loc>");
  });

  it("renders route metadata in the initial HTML response", () => {
    const html = renderPublicSeoHtml(shell, "/forensics");
    expect(html).toContain("Bank Diagnostic &amp; Forensics for African Banks");
    expect(html).toContain('content="https://universalcredithub.com/forensics"');
    expect(html).toContain('rel="canonical" href="https://universalcredithub.com/forensics"');
  });

  it("keeps the original SPA route when Express consumes a wildcard mount", () => {
    expect(getOriginalRequestPath("/forensics?source=linkedin")).toBe("/forensics");
  });
});
