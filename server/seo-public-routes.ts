/**
 * The small, intentional set of UCH pages that may appear in public search.
 * Keep this list separate from authenticated product routes and APIs. It is
 * shared by robots, the XML sitemap, response headers, and crawler handling
 * so those controls cannot drift apart.
 */
export const PUBLIC_SEO_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly", title: "Universal Credit Hub — Controlled Bank Risk Operations", description: "Credit intelligence, NPL early warning, collateral evidence, consent controls and governed IFRS 9 policy workflows for controlled African bank pilots." },
  { path: "/fr", priority: "0.9", changefreq: "weekly", title: "Universal Credit Hub — Opérations de risque bancaire maîtrisées", description: "Intelligence de crédit, alerte précoce NPL, preuves de garanties, contrôles de consentement et flux IFRS 9 gouvernés pour des pilotes bancaires africains maîtrisés." },
  { path: "/forensics", priority: "0.9", changefreq: "monthly", title: "Bank Diagnostic & Forensics for African Banks | Universal Credit Hub", description: "A controlled bank diagnostic for NPL risk, IFRS 9 readiness, fraud operations, collateral evidence and data quality." },
  { path: "/demo", priority: "0.8", changefreq: "monthly", title: "Interactive Bank Risk Operations Demo | Universal Credit Hub", description: "Explore a fictional, hands-on bank operations demo for NPL early warning, credit intelligence, collateral, consent controls and evidence packs." },
  { path: "/for-lenders", priority: "0.8", changefreq: "monthly", title: "Credit Intelligence for African Lenders | Universal Credit Hub", description: "Explore controlled credit intelligence, collateral evidence and consent-led data workflows for African lenders." },
  { path: "/collateral", priority: "0.8", changefreq: "monthly", title: "Collateral Registry for African Lenders | Universal Credit Hub", description: "Register pledged assets, search liens and verify tamper-evident collateral certificates through controlled African secured-lending workflows." },
  { path: "/loto", priority: "0.7", changefreq: "monthly", title: "Loto Fiscal & Verified Receipt Credit Data | Universal Credit Hub", description: "Turn consent-controlled verified VAT receipts into merchant credit evidence and real-time fiscal visibility for African institutions." },
  { path: "/for-regulators", priority: "0.8", changefreq: "monthly", title: "Credit Data Supervision for African Regulators | Universal Credit Hub", description: "Explore consent-led credit data oversight, evidence and regulatory reporting workflows for African supervisory institutions." },
  { path: "/financial-inclusion", priority: "0.7", changefreq: "monthly", title: "Financial Inclusion & Verified Receipt Credit Data | Universal Credit Hub", description: "See how consent-controlled verified receipts can help African merchants build a credit profile while preserving privacy and audit evidence." },
  { path: "/security", priority: "0.7", changefreq: "monthly", title: "Security & Compliance | Universal Credit Hub", description: "Learn about UCH security controls for African bank pilots, including MFA, access controls, encryption and audit evidence." },
  { path: "/market-validation", priority: "0.6", changefreq: "monthly", title: "Universal Credit Hub Market Validation", description: "Explore the commercial case and controlled bank-pilot approach for Universal Credit Hub." },
  { path: "/press", priority: "0.6", changefreq: "monthly", title: "Universal Credit Hub Press Kit", description: "Brand, product and company information for Universal Credit Hub." },
  { path: "/about", priority: "0.5", changefreq: "yearly", title: "About Universal Credit Hub", description: "Learn about Universal Credit Hub and its controlled approach to African credit and bank-risk operations." },
  { path: "/contact-sales", priority: "0.5", changefreq: "monthly", title: "Contact Universal Credit Hub | Bank Software & Diagnostics", description: "Speak with Universal Credit Hub about bank risk operations software or a Ghana and Africa bank diagnostic engagement." },
  { path: "/terms", priority: "0.2", changefreq: "yearly", title: "Terms of Service — Universal Credit Hub", description: "Read the Universal Credit Hub terms governing use of the African credit and bank-risk operations platform." },
  { path: "/privacy", priority: "0.2", changefreq: "yearly", title: "Privacy Policy — Universal Credit Hub", description: "Read how Universal Credit Hub collects, protects and governs personal data across its African credit and bank-risk operations platform." },
] as const;

const PUBLIC_SEO_PATHS = new Set<string>(PUBLIC_SEO_ROUTES.map((route) => route.path));

export function isPublicSeoPath(path: string): boolean {
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return PUBLIC_SEO_PATHS.has(normalized);
}

export function getPublicSeoMetadata(path: string) {
  return PUBLIC_SEO_ROUTES.find((route) => route.path === path);
}

export function getPublicSitemapXml(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const urls = PUBLIC_SEO_ROUTES.map(
    (route) => `  <url><loc>${base}${route.path}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}
