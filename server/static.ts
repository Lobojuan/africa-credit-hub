import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { getPublicSeoMetadata } from "./seo-public-routes";

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function replaceMetaTag(html: string, attribute: "name" | "property", key: string, content: string): string {
  const tag = `<meta ${attribute}="${key}" content="${escapeHtmlAttribute(content)}" />`;
  const matcher = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, "i");
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

/**
 * SPA navigation still refines these tags in the browser. This server-side
 * layer makes the same metadata available to non-JavaScript crawlers and link
 * preview services, which normally inspect only the first HTML response.
 */
export function renderPublicSeoHtml(html: string, pathName: string, baseUrl = "https://universalcredithub.com"): string {
  const page = getPublicSeoMetadata(pathName);
  if (!page) return html;

  const canonical = `${baseUrl.replace(/\/+$/, "")}${page.path}`;
  const title = escapeHtmlAttribute(page.title);
  let rendered = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  rendered = replaceMetaTag(rendered, "name", "description", page.description);
  rendered = replaceMetaTag(rendered, "property", "og:title", page.title);
  rendered = replaceMetaTag(rendered, "property", "og:description", page.description);
  rendered = replaceMetaTag(rendered, "property", "og:url", canonical);
  rendered = replaceMetaTag(rendered, "name", "twitter:title", page.title);
  rendered = replaceMetaTag(rendered, "name", "twitter:description", page.description);
  rendered = rendered.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  return rendered;
}

export function getOriginalRequestPath(originalUrl: string): string {
  const pathName = new URL(originalUrl, "http://localhost").pathname;
  // Treat a trailing slash as the same public page. This keeps the canonical
  // metadata stable whether a visitor, an old bookmark, or a proxy requests
  // `/contact-sales` or `/contact-sales/`.
  return pathName.length > 1 ? pathName.replace(/\/+$/, "") : pathName;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // The build creates legacy per-route SPA fallback directories. Serving an
  // `index.html` from one of those directories bypasses the metadata renderer
  // below (and Express redirects the slashless URL), which makes a public
  // page such as `/contact-sales` look like the home page to link previews.
  // Static assets remain cacheable, while every application route now falls
  // through to the single, route-aware HTML response.
  app.use(express.static(distPath, { index: false, redirect: false }));

  const indexPath = path.resolve(distPath, "index.html");
  const rawHtml = fs.readFileSync(indexPath, "utf-8");

  app.use("/{*path}", (req, res) => {
    const nonce = res.locals.cspNonce || "";
    // Express consumes the wildcard mount path before exposing req.path here,
    // which would make every SPA route look like "/". originalUrl preserves
    // the public URL that a crawler or sharing service actually requested.
    const requestPath = getOriginalRequestPath(req.originalUrl);
    const html = renderPublicSeoHtml(rawHtml, requestPath).replace(/<script/g, `<script nonce="${nonce}"`);
    res.set("Content-Type", "text/html").send(html);
  });
}
