import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile, readdir } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  const spaRoutes = [
    "solutions",
    "investor",
    "demo",
    "pricing",
    "security",
    "market-validation",
    "start-trial",
    "my-credit",
    "mobile",
    "login",
    "borrowers",
    "credit-accounts",
    "search",
    "reports",
    "audit",
    "users",
    "approvals",
    "disputes",
    "batch-upload",
    "institutions",
    "consent",
    "billing",
    "helpdesk",
    "credit-report",
    "api-keys",
    "api-docs",
    "help",
    "documentation",
    "exchange-rates",
    "api-admin",
    "retention-policies",
    "regulatory-compliance",
    "bog-export",
    "bsl-export",
    "version-history",
    "guide",
    "organizations",
    "ghana-docs",
    "about",
    "portfolio-intelligence",
    "credit-score-methodology",
    "regulatory-dashboard",
    "borrower-alerts",
    "cross-border-agreements",
    "cross-border-search",
    "papss-settlements",
    "system-status",
    "platform-metrics",
    "webhook-management",
    "settings",
    "dashboard",
  ];
  console.log("creating SPA fallback routes...");
  for (const route of spaRoutes) {
    await mkdir(`dist/public/${route}`, { recursive: true });
    await copyFile("dist/public/index.html", `dist/public/${route}/index.html`);
  }

  await copyFile("dist/public/index.html", "dist/public/404.html");

  console.log("copying docs folder...");
  await mkdir("dist/docs", { recursive: true });
  const docFiles = await readdir("docs");
  for (const file of docFiles) {
    if (file.endsWith(".md")) {
      await copyFile(`docs/${file}`, `dist/docs/${file}`);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
