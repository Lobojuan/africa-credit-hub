/**
 * The small, intentional set of UCH pages that may appear in public search.
 * Keep this list separate from authenticated product routes and APIs. It is
 * shared by robots, the XML sitemap, response headers, and crawler handling
 * so those controls cannot drift apart.
 */
export const PUBLIC_SEO_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/forensics", priority: "0.9", changefreq: "monthly" },
  { path: "/demo", priority: "0.8", changefreq: "monthly" },
  { path: "/for-lenders", priority: "0.8", changefreq: "monthly" },
  { path: "/for-regulators", priority: "0.8", changefreq: "monthly" },
  { path: "/financial-inclusion", priority: "0.7", changefreq: "monthly" },
  { path: "/security", priority: "0.7", changefreq: "monthly" },
  { path: "/market-validation", priority: "0.6", changefreq: "monthly" },
  { path: "/press", priority: "0.6", changefreq: "monthly" },
  { path: "/about", priority: "0.5", changefreq: "yearly" },
  { path: "/contact-sales", priority: "0.5", changefreq: "monthly" },
] as const;

const PUBLIC_SEO_PATHS = new Set<string>(PUBLIC_SEO_ROUTES.map((route) => route.path));

export function isPublicSeoPath(path: string): boolean {
  return PUBLIC_SEO_PATHS.has(path);
}

export function getPublicSitemapXml(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const urls = PUBLIC_SEO_ROUTES.map(
    (route) => `  <url><loc>${base}${route.path}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}
