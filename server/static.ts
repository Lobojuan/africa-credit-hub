import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
  const distPath = process.env.NODE_ENV === "production" && typeof __dirname !== "undefined"
    ? path.resolve(currentDir, "public")
    : path.resolve(currentDir, "..", "dist", "public");

  console.log(`[Static] Serving from: ${distPath}, exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  console.log(`[Static] index.html exists: ${fs.existsSync(indexPath)}`);

  app.use(express.static(distPath));

  app.use((req: Request, res: Response, _next: NextFunction) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.sendFile(indexPath);
  });
}
