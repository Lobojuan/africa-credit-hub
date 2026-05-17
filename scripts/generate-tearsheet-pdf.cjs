/**
 * UCH Investor Tear-Sheet PDF Generator
 *
 * Produces a single-page A4 leave-behind for each market playbook.
 *
 * Usage:
 *   node scripts/generate-tearsheet-pdf.cjs            # all markets
 *   node scripts/generate-tearsheet-pdf.cjs ghana      # single market
 *
 * Supported market keys: ghana, nigeria, kenya, civ, southafrica
 *
 * Output: exports/<market>-tearsheet.pdf
 *
 * To add a new market: add an entry to MARKET_CONFIG below.
 */

const PDFDocument = require("pdfkit");
const QRCode     = require("qrcode");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

// ── Brand colours (shared with generate-playbook-pdf.cjs) ────────────────────
const TEAL        = "#0d9488";
const TEAL_DARK   = "#0a7470";
const TEAL_LIGHT  = "#e6f7f6";
const GOLD        = "#f59e0b";
const GOLD_LIGHT  = "#fef3c7";
const DARK        = "#1a1a1a";
const GRAY        = "#4b5563";
const LIGHT_GRAY  = "#9ca3af";
const WHITE       = "#ffffff";

const PAGE_W      = 595.28;   // A4 width  (pt)
const PAGE_H      = 841.89;   // A4 height (pt)
const MARGIN      = 40;
const INNER_W     = PAGE_W - MARGIN * 2;

// ── Flag drawing helper ───────────────────────────────────────────────────────
// Draws a mini flag badge using PDFKit rectangle/circle primitives.
// This is the correct approach for PDFKit: standard embedded fonts (Helvetica,
// Courier, Times) do not include emoji glyphs, so flag emoji characters would
// render as corrupted/missing glyphs in the output PDF across all viewers.
// Using geometric drawing primitives produces reliable, viewer-independent output.
// flagSpec: { type: "h"|"v", stripes: [...colors], extra?: "star"|"shield" }
function drawFlag(doc, x, y, w, h, flagSpec) {
  const { type, stripes, extra } = flagSpec;
  const count = stripes.length;

  if (type === "h") {
    const sh = h / count;
    stripes.forEach((color, i) => {
      doc.rect(x, y + i * sh, w, sh).fill(color);
    });
  } else {
    const sw = w / count;
    stripes.forEach((color, i) => {
      doc.rect(x + i * sw, y, sw, h).fill(color);
    });
  }

  // Optional overlays (black star for Ghana, Maasai shield hint for Kenya)
  if (extra === "star") {
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.18;
    doc.circle(cx, cy, r).fill("#000000");
  } else if (extra === "shield") {
    const cx = x + w / 2, cy = y + h / 2;
    const sw2 = Math.min(w, h) * 0.22, sh2 = Math.min(w, h) * 0.32;
    doc.rect(cx - sw2 / 2, cy - sh2 / 2, sw2, sh2 * 0.65).fill("#BB0000");
    doc.rect(cx - sw2 / 2, cy + sh2 * 0.15, sw2, sh2 * 0.2).fill("#FFFFFF");
  }

  // Thin border
  doc.rect(x, y, w, h).strokeColor("rgba(255,255,255,0.4)").lineWidth(0.5).stroke();
}

// ── Market configuration ──────────────────────────────────────────────────────
const MARKET_CONFIG = {
  ghana: {
    pdfFile:   "ghana-tearsheet.pdf",
    name:      "Ghana",
    flagSpec:  { type: "h", stripes: ["#CE1126", "#FCD116", "#006B3F"], extra: "star" },
    tagline:   "West Africa's Digital Credit Vanguard",
    regulator: "Bank of Ghana (BoG)",
    currency:  "GHS",
    demoUrl:   "https://universalcredithub.replit.app?utm_source=tearsheet&utm_campaign=ghana",
    liveStatsEnabled: true,
    stats: [
      { label: "GDP (2024)",          value: "USD 76 B"  },
      { label: "Banked Adults",       value: "~50%"      },
      { label: "Mobile Money Users",  value: "22 M+"     },
    ],
    valueBullets: [
      "Consolidates 600+ institutions into a single 360° borrower view, cutting NPL ratios from ~18%",
      "BOG Consent Layer pre-wired to Ghana Data Protection Act 2012 (Act 843) — zero compliance lift",
      "Ingests MTN MoMo & mobile money flows as alternative credit signals for the unbanked 50%",
    ],
    differentiators: [
      "BoG-format regulatory exports",
      "GHS-native multi-currency",
      "AI credit scoring 300–850",
      "GDPA-compliant consent layer",
    ],
    pdfTitle:   "Ghana Investor Tear-Sheet — Universal Credit Hub",
    pdfKeywords: "Ghana, UCH, credit bureau, Bank of Ghana, investor, tear-sheet",
  },

  nigeria: {
    pdfFile:   "nigeria-tearsheet.pdf",
    name:      "Nigeria",
    flagSpec:  { type: "v", stripes: ["#008751", "#FFFFFF", "#008751"] },
    tagline:   "Africa's Largest Economy — Largest Credit Opportunity",
    regulator: "Central Bank of Nigeria (CBN)",
    currency:  "NGN",
    demoUrl:   "https://universalcredithub.replit.app?utm_source=tearsheet&utm_campaign=nigeria",
    liveStatsEnabled: true,
    stats: [
      { label: "GDP (2024)",          value: "USD 363 B" },
      { label: "Commercial Banks",    value: "24 CBN"    },
      { label: "MFBs Licensed",       value: "900+"      },
    ],
    valueBullets: [
      "Aggregates 24 commercial banks + 900+ microfinance banks into one unified credit registry",
      "eNaira & mobile money transaction ingestion — turns CBDC data into explainable AI risk scores",
      "CBN regulatory return exports out-of-the-box; NDPA 2023 consent layer fully pre-configured",
    ],
    differentiators: [
      "CBN-format regulatory returns",
      "BVN + eNaira data ingestion",
      "NGN-native multi-currency",
      "NDPA 2023 compliant",
    ],
    pdfTitle:   "Nigeria Investor Tear-Sheet — Universal Credit Hub",
    pdfKeywords: "Nigeria, UCH, credit bureau, CBN, eNaira, investor, tear-sheet",
  },

  kenya: {
    pdfFile:   "kenya-tearsheet.pdf",
    name:      "Kenya",
    flagSpec:  { type: "h", stripes: ["#006600", "#BB0000", "#006600"], extra: "shield" },
    tagline:   "Sub-Saharan Africa's Most Sophisticated Credit Market",
    regulator: "Central Bank of Kenya (CBK)",
    currency:  "KES",
    demoUrl:   "https://universalcredithub.replit.app?utm_source=tearsheet&utm_campaign=kenya",
    liveStatsEnabled: true,
    stats: [
      { label: "GDP (2024)",          value: "USD 118 B" },
      { label: "Banked Adults",       value: "~83%"      },
      { label: "M-Pesa Active Users", value: "32 M+"     },
    ],
    valueBullets: [
      "Aggregates 38 banks + 175 SACCOs + 3 CRBs into one unified 360° borrower profile",
      "M-Pesa transaction data ingested as a primary alternative credit signal — extends reach to the next 5 M borrowers",
      "CBK supervisory return exports ready on day one; KDPA 2019 data-subject rights fully mapped",
    ],
    differentiators: [
      "M-Pesa alternative data scoring",
      "CBK CRB return formats",
      "KES-native multi-currency",
      "KDPA 2019 consent layer",
    ],
    pdfTitle:   "Kenya Investor Tear-Sheet — Universal Credit Hub",
    pdfKeywords: "Kenya, UCH, credit bureau, CBK, M-Pesa, SACCO, investor, tear-sheet",
  },

  civ: {
    pdfFile:   "civ-tearsheet.pdf",
    name:      "Cote d'Ivoire",
    flagSpec:  { type: "v", stripes: ["#F77F00", "#FFFFFF", "#009A44"] },
    tagline:   "UEMOA's Economic Engine — 120 M People, One Franc",
    regulator: "BCEAO / Centrale des Risques",
    currency:  "XOF",
    demoUrl:   "https://universalcredithub.replit.app?utm_source=tearsheet&utm_campaign=civ",
    liveStatsEnabled: true,
    stats: [
      { label: "GDP (2024)",          value: "USD 78 B"  },
      { label: "UEMOA Population",    value: "120 M"     },
      { label: "Mobile Money Users",  value: "20 M+"     },
    ],
    valueBullets: [
      "Aggregates 28 BCEAO-licensed banks + 100+ SFDs into UEMOA's first unified credit registry",
      "Loto Fiscal module digitalises DGI receipt verification, VAT collection, and prize payouts in one platform",
      "BCEAO Centrale des Risques export formats + XOF-native multi-currency — zero integration friction",
    ],
    differentiators: [
      "BCEAO Centrale des Risques exports",
      "Loto Fiscal DGI integration",
      "XOF / CFA Franc native",
      "UEMOA-wide rollout ready",
    ],
    pdfTitle:   "Côte d'Ivoire Investor Tear-Sheet — Universal Credit Hub",
    pdfKeywords: "Cote d'Ivoire, BCEAO, UEMOA, UCH, Loto Fiscal, investor, tear-sheet",
  },

  southafrica: {
    pdfFile:   "southafrica-tearsheet.pdf",
    name:      "South Africa",
    flagSpec:  { type: "h", stripes: ["#DE3831", "#FFB612", "#007A4D"], extra: "star" },
    tagline:   "Africa's Most Developed Financial Market",
    regulator: "SARB / National Credit Regulator (NCR)",
    currency:  "ZAR",
    demoUrl:   "https://universalcredithub.replit.app?utm_source=tearsheet&utm_campaign=southafrica",
    liveStatsEnabled: true,
    stats: [
      { label: "GDP (2024)",         value: "USD 373 B" },
      { label: "Banked Adults",      value: "~85%"      },
      { label: "Credit Active Pop.", value: "25 M+"     },
    ],
    valueBullets: [
      "Aggregates data across 4 major banks + 200+ credit providers into one unified NCR-compliant registry",
      "National Credit Act (NCA) consent layer and POPIA data-subject rights fully pre-configured out-of-the-box",
      "AI credit scoring (300–850) bridges the gap between formal bureau data and alternative mobile/utility signals",
    ],
    differentiators: [
      "NCR-compliant data submission",
      "POPIA consent layer built-in",
      "ZAR-native multi-currency",
      "SARB regulatory exports",
    ],
    pdfTitle:   "South Africa Investor Tear-Sheet — Universal Credit Hub",
    pdfKeywords: "South Africa, UCH, credit bureau, SARB, NCR, NCA, POPIA, investor, tear-sheet",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function drawRect(doc, x, y, w, h, { fill, stroke, lineWidth = 0.5, radius = 0 } = {}) {
  if (radius > 0) {
    doc.roundedRect(x, y, w, h, radius);
  } else {
    doc.rect(x, y, w, h);
  }
  doc.lineWidth(lineWidth);
  if (fill && stroke) {
    doc.fillAndStroke(fill, stroke);
  } else if (fill) {
    doc.fill(fill);
  } else if (stroke) {
    doc.stroke(stroke);
  }
}

// ── Tear-sheet layout ─────────────────────────────────────────────────────────

async function generateTearsheet(marketKey) {
  const cfg = MARKET_CONFIG[marketKey];
  if (!cfg) {
    console.error(`Unknown market: "${marketKey}". Available: ${Object.keys(MARKET_CONFIG).join(", ")}`);
    process.exit(1);
  }

  const outPath = path.join(__dirname, "../exports", cfg.pdfFile);

  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title:    cfg.pdfTitle,
      Author:   "Universal Credit Hub Ltd",
      Subject:  `${cfg.name} investor tear-sheet`,
      Keywords: cfg.pdfKeywords,
      Creator:  "Universal Credit Hub v2.8",
      Producer: "UCH Tear-Sheet Generator",
    },
  });

  const out = fs.createWriteStream(outPath);
  doc.pipe(out);

  let y = 0;

  // ── HEADER BAND ─────────────────────────────────────────────────────────────
  const HEADER_H = 130;
  drawRect(doc, 0, 0, PAGE_W, HEADER_H, { fill: TEAL });

  // Gold accent bar at very top
  drawRect(doc, 0, 0, PAGE_W, 5, { fill: GOLD });

  // UCH wordmark (top-left)
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD)
    .text("UNIVERSAL CREDIT HUB", MARGIN, 16, { characterSpacing: 1.5 });

  // "v2.8" tag
  doc.font("Helvetica").fontSize(7).fillColor("#99e0db")
    .text("v2.8  ·  Pan-African Credit Registry", MARGIN, 28);

  // Flag badge (drawn with PDFKit primitives — no emoji/font dependency)
  const FLAG_W = 52, FLAG_H = 34, FLAG_X = MARGIN, FLAG_Y = 44;
  drawFlag(doc, FLAG_X, FLAG_Y, FLAG_W, FLAG_H, cfg.flagSpec);

  // Market name (next to flag)
  doc.font("Helvetica-Bold").fontSize(32).fillColor(WHITE)
    .text(cfg.name, MARGIN + FLAG_W + 10, 48, { width: INNER_W * 0.62 });

  // Tagline
  doc.font("Helvetica").fontSize(11).fillColor("#ccf5f2")
    .text(cfg.tagline, MARGIN, 92, { width: INNER_W * 0.70 });

  // "INVESTOR TEAR-SHEET" badge (top-right)
  const badgeW = 130, badgeH = 24, badgeX = PAGE_W - MARGIN - badgeW, badgeY = 16;
  drawRect(doc, badgeX, badgeY, badgeW, badgeH, { fill: GOLD, radius: 4 });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK)
    .text("INVESTOR TEAR-SHEET", badgeX, badgeY + 7, { width: badgeW, align: "center", characterSpacing: 0.5 });

  // Regulator label (top-right lower)
  doc.font("Helvetica").fontSize(8).fillColor("#99e0db")
    .text(`Regulator: ${cfg.regulator}`, badgeX - 10, 50, { width: badgeW + 10, align: "right" });
  doc.font("Helvetica").fontSize(8).fillColor("#99e0db")
    .text(`Currency: ${cfg.currency}`, badgeX - 10, 64, { width: badgeW + 10, align: "right" });

  // Gold accent bar at bottom of header
  drawRect(doc, 0, HEADER_H - 4, PAGE_W, 4, { fill: GOLD });

  y = HEADER_H + 18;

  // ── HEADLINE STATS (3 cards in a row) ───────────────────────────────────────
  const STATS_H = 72;
  const statW   = (INNER_W - 16) / 3;
  const statY   = y;

  cfg.stats.forEach((stat, i) => {
    const sx = MARGIN + i * (statW + 8);
    drawRect(doc, sx, statY, statW, STATS_H, { fill: TEAL_LIGHT, stroke: "#99d6d2", lineWidth: 0.75, radius: 6 });
    // Stat value
    doc.font("Helvetica-Bold").fontSize(22).fillColor(TEAL)
      .text(stat.value, sx + 6, statY + 10, { width: statW - 12, align: "center" });
    // Stat label
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
      .text(stat.label, sx + 6, statY + 40, { width: statW - 12, align: "center" });
    // Teal bottom accent
    drawRect(doc, sx, statY + STATS_H - 4, statW, 4, { fill: TEAL, radius: 0 });
  });

  y = statY + STATS_H + 22;

  // ── SECTION DIVIDER: VALUE PROPOSITION ──────────────────────────────────────
  const SECTION_LABEL_H = 22;
  drawRect(doc, MARGIN, y, INNER_W, SECTION_LABEL_H, { fill: TEAL, radius: 4 });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
    .text("WHY UNIVERSAL CREDIT HUB", MARGIN, y + 6, { width: INNER_W, align: "center", characterSpacing: 1 });

  y += SECTION_LABEL_H + 12;

  // ── VALUE BULLETS ────────────────────────────────────────────────────────────
  const bulletPanelH = 118;
  drawRect(doc, MARGIN, y, INNER_W, bulletPanelH, { fill: "#f9fefe", stroke: "#99d6d2", lineWidth: 0.5, radius: 6 });

  let bulletY = y + 12;
  cfg.valueBullets.forEach((bullet, i) => {
    // Number circle
    const numR = 9;
    const numX = MARGIN + 18;
    const numCY = bulletY + 9;
    doc.circle(numX, numCY, numR).fill(TEAL);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
      .text(String(i + 1), numX - numR, numCY - 5, { width: numR * 2, align: "center" });

    // Bullet text
    doc.font("Helvetica").fontSize(9.5).fillColor(DARK)
      .text(bullet, MARGIN + 34, bulletY, { width: INNER_W - 44 });

    // Divider between bullets (not after last)
    bulletY += doc.heightOfString(bullet, { width: INNER_W - 44 }) + 10;
    if (i < cfg.valueBullets.length - 1) {
      doc.moveTo(MARGIN + 34, bulletY - 5)
        .lineTo(MARGIN + INNER_W - 10, bulletY - 5)
        .strokeColor("#d1faf7").lineWidth(0.4).stroke();
    }
  });

  y += bulletPanelH + 18;

  // ── TWO-COLUMN LOWER SECTION ─────────────────────────────────────────────────
  const COL_GAP   = 14;
  const COL_W_L   = INNER_W * 0.56;
  const COL_W_R   = INNER_W - COL_W_L - COL_GAP;
  const COL_X_L   = MARGIN;
  const COL_X_R   = MARGIN + COL_W_L + COL_GAP;
  const TWO_COL_Y = y;

  // ── LEFT: KEY DIFFERENTIATORS ────────────────────────────────────────────────
  drawRect(doc, COL_X_L, TWO_COL_Y, COL_W_L, 22, { fill: TEAL_DARK, radius: 4 });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
    .text("KEY DIFFERENTIATORS", COL_X_L, TWO_COL_Y + 7, { width: COL_W_L, align: "center", characterSpacing: 0.8 });

  let diffY = TWO_COL_Y + 30;
  const pillW = (COL_W_L - 10) / 2;
  cfg.differentiators.forEach((diff, i) => {
    const col  = i % 2;
    const row  = Math.floor(i / 2);
    const px   = COL_X_L + col * (pillW + 10);
    const py   = diffY + row * 32;
    drawRect(doc, px, py, pillW, 24, { fill: GOLD_LIGHT, stroke: GOLD, lineWidth: 0.75, radius: 5 });
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(TEAL_DARK)
      .text(diff, px + 4, py + 7, { width: pillW - 8, align: "center" });
  });

  const rows = Math.ceil(cfg.differentiators.length / 2);
  const diffPanelH = 30 + rows * 32 + 8;

  // ── RIGHT: QR CODE ───────────────────────────────────────────────────────────
  const QR_SIDE    = COL_W_R - 10;
  const QR_Y       = TWO_COL_Y;
  const QR_PANEL_H = diffPanelH;

  drawRect(doc, COL_X_R, QR_Y, COL_W_R, QR_PANEL_H, { fill: WHITE, stroke: "#99d6d2", lineWidth: 0.75, radius: 6 });

  // Header inside QR panel
  drawRect(doc, COL_X_R, QR_Y, COL_W_R, 22, { fill: TEAL_DARK, radius: 4 });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
    .text("SCAN TO DEMO", COL_X_R, QR_Y + 7, { width: COL_W_R, align: "center", characterSpacing: 0.8 });

  // Real scannable QR code (PNG buffer rendered via PDFKit doc.image)
  const qrSize   = Math.min(QR_SIDE - 20, QR_PANEL_H - 54);
  const qrBoxX   = COL_X_R + (COL_W_R - qrSize) / 2;
  const qrBoxY   = QR_Y + 28;

  const qrBuffer = await QRCode.toBuffer(cfg.demoUrl, {
    type:                 "png",
    errorCorrectionLevel: "H",
    margin:               1,
    width:                Math.round(qrSize * 3),
    color: { dark: TEAL_DARK, light: "#ffffff" },
  });

  doc.image(qrBuffer, qrBoxX, qrBoxY, { width: qrSize, height: qrSize });

  // URL below QR
  doc.font("Helvetica").fontSize(7).fillColor(TEAL)
    .text(cfg.demoUrl, COL_X_R, qrBoxY + qrSize + 6, { width: COL_W_R, align: "center" });

  y = TWO_COL_Y + diffPanelH + 18;

  // ── PLATFORM CAPABILITY STRIP ─────────────────────────────────────────────
  const capItems = [
    "AI Credit Score 300–850",
    "54-Country Coverage",
    "Maker-Checker Workflow",
    "Blockchain Audit Log",
    "Consumer Self-Service Portal",
    "Multi-Currency Native",
  ];
  const capW    = (INNER_W - (capItems.length - 1) * 6) / capItems.length;
  const CAP_Y   = y;
  const CAP_H   = 26;

  capItems.forEach((cap, i) => {
    const cx = MARGIN + i * (capW + 6);
    drawRect(doc, cx, CAP_Y, capW, CAP_H, { fill: TEAL, radius: 4 });
    doc.font("Helvetica").fontSize(6.5).fillColor(WHITE)
      .text(cap, cx + 2, CAP_Y + 8, { width: capW - 4, align: "center" });
  });

  y = CAP_Y + CAP_H + 14;

  // ── UCH VALUE STATEMENT ───────────────────────────────────────────────────
  const stmtH = 38;
  drawRect(doc, MARGIN, y, INNER_W, stmtH, { fill: GOLD_LIGHT, stroke: GOLD, lineWidth: 0.75, radius: 6 });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEAL_DARK)
    .text(
      `Universal Credit Hub consolidates every credit institution in ${cfg.name} into one AI-powered registry — ` +
      `reducing NPL ratios, accelerating credit decisions, and unlocking financial inclusion at national scale.`,
      MARGIN + 12, y + 8, { width: INNER_W - 24, align: "center" }
    );

  y += stmtH + 14;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER_W, y)
    .strokeColor(TEAL).lineWidth(0.75).stroke();
  y += 6;

  // Three-column footer
  const fcW = INNER_W / 3;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(TEAL)
    .text("Universal Credit Hub Ltd", MARGIN, y, { width: fcW });
  doc.font("Helvetica").fontSize(6.5).fillColor(LIGHT_GRAY)
    .text("Pan-African Credit Registry  ·  v2.8", MARGIN, y + 9, { width: fcW });

  doc.font("Helvetica").fontSize(7).fillColor(GRAY)
    .text("Confidential  ·  May 2026", MARGIN + fcW, y, { width: fcW, align: "center" });
  doc.font("Helvetica").fontSize(6.5).fillColor(LIGHT_GRAY)
    .text("For authorised recipients only", MARGIN + fcW, y + 9, { width: fcW, align: "center" });

  doc.font("Helvetica").fontSize(7).fillColor(TEAL)
    .text(cfg.demoUrl, MARGIN + fcW * 2, y, { width: fcW, align: "right" });
  doc.font("Helvetica").fontSize(6.5).fillColor(LIGHT_GRAY)
    .text("© 2026 Universal Credit Hub Ltd", MARGIN + fcW * 2, y + 9, { width: fcW, align: "right" });

  // Gold bottom bar
  drawRect(doc, 0, PAGE_H - 5, PAGE_W, 5, { fill: GOLD });

  doc.end();

  return new Promise((resolve, reject) => {
    out.on("finish", () => {
      const size = fs.statSync(outPath).size;
      console.log(`  [OK] ${outPath}  (${(size / 1024).toFixed(1)} KB)`);
      resolve();
    });

    out.on("error", (err) => {
      console.error(`  [ERR] ${marketKey}: ${err.message}`);
      reject(err);
    });
  });
}

// ── Live stats helpers ────────────────────────────────────────────────────────

/**
 * Calls GET /api/admin/tearsheet-stats/:market on the running UCH server.
 *
 * Env vars (all optional):
 *   UCH_API_BASE_URL        – base URL, e.g. http://localhost:5000  (default)
 *   TEARSHEET_SCRIPT_TOKEN  – value to send as X-Tearsheet-Token header
 *
 * Returns a stats object on success, null on any failure (network, auth, 4xx/5xx).
 */
function fetchLiveStats(marketKey) {
  return new Promise((resolve) => {
    const base = (process.env.UCH_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
    const url = `${base}/api/admin/tearsheet-stats/${encodeURIComponent(marketKey)}`;
    const token = process.env.TEARSHEET_SCRIPT_TOKEN || "";

    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: Object.assign(
        { Accept: "application/json" },
        token ? { "X-Tearsheet-Token": token } : {}
      ),
    };

    const req = transport.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/**
 * Formats live DB stats into the 3-box stats array used by generateTearsheet.
 * Returns null if live data is unavailable, so the static fallback is used.
 */
function buildLiveStatsBoxes(liveData) {
  if (!liveData) return null;

  const fmt = (n) => {
    if (typeof n !== "number" || n === 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
    return String(n);
  };

  return [
    {
      label: "Registered Borrowers",
      value: fmt(liveData.totalBorrowers),
    },
    {
      label: "Member Institutions",
      value: fmt(liveData.totalInstitutions),
    },
    {
      label: "Avg Credit Score",
      value: liveData.avgCreditScore ? String(liveData.avgCreditScore) : "N/A",
    },
  ];
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function run() {
  const arg = process.argv[2];
  const keys = !arg ? Object.keys(MARKET_CONFIG) : [arg.toLowerCase()];

  if (!arg) {
    console.log("UCH Tear-Sheet Generator — generating all markets...\n");
  }

  for (const key of keys) {
    if (!MARKET_CONFIG[key]) {
      console.error(`Unknown market: "${key}". Available: ${Object.keys(MARKET_CONFIG).join(", ")}`);
      process.exit(1);
    }

    const cfg = MARKET_CONFIG[key];
    if (cfg.liveStatsEnabled) {
      process.stdout.write(`  Fetching live stats for "${key}"...`);
      const liveData = await fetchLiveStats(key);
      const liveBoxes = buildLiveStatsBoxes(liveData);
      if (liveBoxes) {
        MARKET_CONFIG[key] = Object.assign({}, cfg, { stats: liveBoxes });
        console.log(` OK (borrowers=${liveData.totalBorrowers}, institutions=${liveData.totalInstitutions}, avgScore=${liveData.avgCreditScore ?? "N/A"})`);
      } else {
        console.log(" unavailable — using static fallback.");
      }
    }

    await generateTearsheet(key);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
