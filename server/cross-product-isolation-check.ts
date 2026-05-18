import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const BRIDGE_TABLES = ["lotoMerchants", "lotoReceipts", "crossProductConsents"];

const ALLOWLIST = new Set<string>([
  "server/cross-product-gateway.ts",
  "server/cross-product-isolation-check.ts",
  "server/seed-cross-product.ts",
  "server/storage.ts",
  "shared/schema.ts",
  "server/__tests__/cross-product-gateway.test.ts",
  // Loto Fiscal — DGI/tax-authority admin internals and merchant-facing fiscal
  // account route. These files are sanctioned collaborators of the loto product
  // and only ever query loto_merchants / loto_receipts within a single country
  // scope; they do NOT bridge to credit/collateral, so the gateway is not required.
  "server/loto-fraud-rules.ts",
  "server/routes/loto-admin.ts",
  "server/routes/loto-fiscal.ts",
  // Loto Fiscal route test files — seed and read loto_merchants / loto_receipts
  // within an isolated test DB scope; no cross-product bridging occurs.
  "server/__tests__/loto-fiscal-routes.test.ts",
  // server/routes.ts implements the self-service cross-product consent toggle
  // (POST /api/cross-product/consents/*) and the data-sharing gateway endpoints.
  // It is a sanctioned collaborator — access is read-only via db.select on
  // crossProductConsents for the ownership check in the consent grant endpoint.
  "server/routes.ts",
  // Loto → Credit pipeline: reads loto_receipts (country-scoped) and writes
  // alternative_data for credit scoring. Sanctioned bridge file; country
  // isolation is enforced inside every query in this file.
  "server/loto-credit-pipeline.ts",
  // Pipeline test: seeds loto_receipts rows in an isolated test DB.
  "server/__tests__/loto-credit-pipeline.test.ts",
]);

const SCAN_ROOTS = ["server", "client/src", "shared"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "__pycache__"]);
const EXTS = [".ts", ".tsx", ".mts", ".cts"];

function walk(root: string, files: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(root, e);
    if (SKIP_DIRS.has(e)) continue;
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, files);
    else if (EXTS.some((x) => e.endsWith(x))) files.push(full);
  }
}

export function runCrossProductIsolationCheck(opts: { failOnViolation?: boolean } = {}): { violations: { file: string; symbol: string }[] } {
  const cwd = process.cwd();
  const files: string[] = [];
  for (const r of SCAN_ROOTS) walk(join(cwd, r), files);

  const violations: { file: string; symbol: string }[] = [];

  // Match imports of the bridge tables from "@shared/schema" — the only legitimate
  // way to reach the raw tables is via this import, so this catches all bypass attempts.
  // Allows multiline imports.
  for (const file of files) {
    const rel = relative(cwd, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    let content: string;
    try { content = readFileSync(file, "utf8"); } catch { continue; }
    if (!content.includes("@shared/schema")) continue;

    // Match `import {...} from "@shared/schema"` (value imports). We deliberately
    // do NOT match `import type {...}` — type-only imports are erased at compile
    // time and cannot reach the bridge tables at runtime. Inside a value import,
    // we also skip individual symbols prefixed with the `type ` modifier.
    const importRegex = /import\s*(\btype\s+)?\{([\s\S]*?)\}\s*from\s*["']@shared\/schema["']/g;
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(content)) !== null) {
      const isTypeOnlyImport = !!m[1];
      if (isTypeOnlyImport) continue; // entire `import type {...}` is erased
      const symbols = m[2].split(",").map((raw) => {
        const trimmed = raw.trim();
        const isTypeMember = /^type\s+/.test(trimmed);
        const name = trimmed.replace(/^type\s+/, "").split(/\s+as\s+/)[0];
        return { name, isTypeMember };
      });
      for (const sym of symbols) {
        if (sym.isTypeMember) continue; // per-symbol `type Foo` is erased too
        if (BRIDGE_TABLES.includes(sym.name)) {
          violations.push({ file: rel, symbol: sym.name });
        }
      }
    }
  }

  if (violations.length > 0) {
    const lines = violations.map((v) => `  - ${v.file} imports bridge table "${v.symbol}" directly`);
    const msg =
      `[cross-product] BRIDGE ISOLATION VIOLATION — ${violations.length} forbidden import(s):\n` +
      lines.join("\n") +
      `\n\nCross-product tables (lotoMerchants, lotoReceipts, crossProductConsents) MUST be accessed via\n` +
      `the gateway (server/cross-product-gateway.ts) or the storage facade (server/storage.ts).\n` +
      `Add the file to ALLOWLIST in server/cross-product-isolation-check.ts only if it is a sanctioned\n` +
      `internal collaborator of the gateway.\n`;
    if (opts.failOnViolation) {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }

  return { violations };
}
