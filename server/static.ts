import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
  const distPath = process.env.NODE_ENV === "production" && typeof __dirname !== "undefined"
    ? path.resolve(currentDir, "public")
    : path.resolve(currentDir, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  const indexPath = path.resolve(distPath, "index.html");
  const rawHtml = fs.readFileSync(indexPath, "utf-8");

  app.use("/{*path}", (_req, res) => {
    const nonce = res.locals.cspNonce || "";
    const html = rawHtml.replace(/<script/g, `<script nonce="${nonce}"`);
    res.set("Content-Type", "text/html").send(html);
  });
}
