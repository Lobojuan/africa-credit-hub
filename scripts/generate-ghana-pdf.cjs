/**
 * @deprecated Use generate-playbook-pdf.cjs instead.
 * This script is superseded by the generalised generator:
 *   node scripts/generate-playbook-pdf.cjs ghana
 * Kept for backward compatibility only.
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const TEAL = "#0d9488";
const GOLD = "#f59e0b";
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const TABLE_HEADER_BG = "#e6f7f6";
const TABLE_BORDER = "#99d6d2";
const PAGE_MARGINS = { top: 50, bottom: 60, left: 50, right: 50 };

function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGINS.bottom) {
    doc.addPage();
  }
}

function getPageWidth(doc) {
  return doc.page.width - PAGE_MARGINS.left - PAGE_MARGINS.right;
}

function renderRichLine(doc, text, opts = {}) {
  const { fontSize = 9, color = DARK, x, width } = opts;
  const segments = [];
  const regex = /(\*\*(.+?)\*\*|__(.+?)__|`(.+?)`|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ t: stripInlineMarkdown(text.slice(lastIndex, match.index)), bold: false, italic: false, code: false });
    }
    if (match[2] || match[3]) {
      segments.push({ t: match[2] || match[3], bold: true, italic: false, code: false });
    } else if (match[4]) {
      segments.push({ t: match[4], bold: false, italic: false, code: true });
    } else if (match[5] || match[6]) {
      segments.push({ t: match[5] || match[6], bold: false, italic: true, code: false });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ t: stripInlineMarkdown(text.slice(lastIndex)), bold: false, italic: false, code: false });
  }
  if (segments.length === 0) {
    segments.push({ t: stripInlineMarkdown(text), bold: false, italic: false, code: false });
  }

  const drawX = x !== undefined ? x : PAGE_MARGINS.left;
  const drawW = width !== undefined ? width : getPageWidth(doc);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const continued = i < segments.length - 1;
    let font = "Helvetica";
    if (seg.bold) font = "Helvetica-Bold";
    else if (seg.italic) font = "Helvetica-Oblique";
    else if (seg.code) font = "Courier";
    doc.font(font).fontSize(seg.code ? fontSize - 1 : fontSize).fillColor(color)
      .text(seg.t, drawX, undefined, { continued, width: drawW });
  }
}

function addPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const pw = doc.page.width;
    const ph = doc.page.height;

    doc.save()
      .font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY)
      .text(`Page ${i + 1} of ${total}`, PAGE_MARGINS.left, ph - 40, { width: pw - PAGE_MARGINS.left - PAGE_MARGINS.right, align: "center" })
      .restore();

    doc.save()
      .font("Helvetica").fontSize(6.5).fillColor(LIGHT_GRAY).fillOpacity(0.6)
      .text("© 2026 Universal Credit Hub Ltd. Confidential. Registered in Ghana.", PAGE_MARGINS.left, ph - 28, { width: pw - PAGE_MARGINS.left - PAGE_MARGINS.right, align: "center" })
      .restore();
  }
}

function renderMarkdown(doc, markdownContent) {
  const pageWidth = getPageWidth(doc);
  const lines = markdownContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (hMatch) {
      const depth = hMatch[1].length;
      const text = stripInlineMarkdown(hMatch[2]);
      const sizes = { 1: 20, 2: 14, 3: 12, 4: 11 };
      const fs = sizes[depth] || 11;
      ensureSpace(doc, fs + 24);

      if (depth === 1) {
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(TEAL).text(text);
        doc.moveDown(0.2);
        doc.moveTo(PAGE_MARGINS.left, doc.y).lineTo(PAGE_MARGINS.left + pageWidth, doc.y)
          .strokeColor(TEAL).lineWidth(1.5).stroke();
        doc.moveDown(0.4);
      } else if (depth === 2) {
        doc.moveDown(0.8);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(TEAL).text(text);
        doc.moveDown(0.1);
        doc.moveTo(PAGE_MARGINS.left, doc.y).lineTo(PAGE_MARGINS.left + pageWidth, doc.y)
          .strokeColor("#b2dfdb").lineWidth(0.75).stroke();
        doc.moveDown(0.3);
      } else if (depth === 3) {
        doc.moveDown(0.6);
        const labelW = doc.font("Helvetica-Bold").fontSize(fs).widthOfString(text) + 12;
        const labelX = PAGE_MARGINS.left;
        const labelY = doc.y;
        doc.rect(labelX, labelY, labelW, fs + 8).fill(TEAL);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor("#ffffff")
          .text(text, labelX + 6, labelY + 4, { width: pageWidth });
        doc.y = labelY + fs + 12;
        doc.moveDown(0.2);
      } else {
        doc.moveDown(0.4);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(DARK).text(text);
        doc.moveDown(0.15);
      }
      i++;
      continue;
    }

    // Tables
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1] && lines[i + 1].match(/^\|[\s:|-]+\|/)) {
      const headers = line.split("|").filter(c => c.trim() !== "").map(c => stripInlineMarkdown(c.trim()));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").filter(c => c.trim() !== "").map(c => stripInlineMarkdown(c.trim()));
        rows.push(cells);
        i++;
      }

      if (headers.length > 0) {
        const colCount = headers.length;
        const cellPad = 5;
        const colW = pageWidth / colCount;

        const calcRowH = (cells, fSize, fontName) => {
          let maxH = 18;
          for (const cell of cells) {
            const h = doc.font(fontName).fontSize(fSize).heightOfString(cell || "", { width: colW - cellPad * 2 }) + 10;
            if (h > maxH) maxH = h;
          }
          return Math.min(maxH, 80);
        };

        const hdrH = calcRowH(headers, 8, "Helvetica-Bold");
        ensureSpace(doc, hdrH + 20);

        let y = doc.y;
        const x = PAGE_MARGINS.left;

        // Header row
        doc.rect(x, y, pageWidth, hdrH).fill(TABLE_HEADER_BG);
        for (let c = 0; c < colCount; c++) {
          doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
            .text(headers[c] || "", x + c * colW + cellPad, y + 5, { width: colW - cellPad * 2 });
        }
        doc.rect(x, y, pageWidth, hdrH).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
        y += hdrH;

        // Data rows
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const rH = calcRowH(row, 7.5, "Helvetica");
          if (y + rH > doc.page.height - PAGE_MARGINS.bottom) {
            doc.addPage();
            y = PAGE_MARGINS.top;
            doc.rect(x, y, pageWidth, hdrH).fill(TABLE_HEADER_BG);
            for (let c = 0; c < colCount; c++) {
              doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
                .text(headers[c] || "", x + c * colW + cellPad, y + 5, { width: colW - cellPad * 2 });
            }
            doc.rect(x, y, pageWidth, hdrH).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
            y += hdrH;
          }
          const rowBg = r % 2 === 0 ? "#ffffff" : "#f0faf9";
          doc.rect(x, y, pageWidth, rH).fill(rowBg);
          for (let c = 0; c < colCount; c++) {
            doc.font("Helvetica").fontSize(7.5).fillColor(DARK)
              .text(row[c] || "", x + c * colW + cellPad, y + 5, { width: colW - cellPad * 2 });
          }
          doc.rect(x, y, pageWidth, rH).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
          y += rH;
        }
        doc.y = y + 8;
      }
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      ensureSpace(doc, 30);
      const text = stripInlineMarkdown(line.replace(/^>\s*/, ""));
      const qX = PAGE_MARGINS.left + 3;
      const savedY = doc.y;
      doc.rect(PAGE_MARGINS.left, savedY, pageWidth, 1).fill(GOLD).opacity(1);
      doc.opacity(1);
      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(GRAY)
        .text(text, qX + 14, savedY + 6, { width: pageWidth - 18 });
      const endY = doc.y + 6;
      doc.moveTo(qX, savedY).lineTo(qX, endY).strokeColor(GOLD).lineWidth(3).stroke();
      doc.y = endY + 4;
      doc.moveDown(0.3);
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
      doc.moveDown(0.3);
      doc.moveTo(PAGE_MARGINS.left, doc.y).lineTo(PAGE_MARGINS.left + pageWidth, doc.y)
        .strokeColor("#d1d5db").lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      i++;
      continue;
    }

    // Checkbox list items  [ ] and [x]
    if (line.match(/^- \[[ x]\] /)) {
      ensureSpace(doc, 15);
      const checked = line.match(/^- \[x\] /i);
      const text = line.replace(/^- \[[ x]\] /i, "");
      const bx = PAGE_MARGINS.left + 12;
      const by = doc.y + 1;
      doc.rect(bx, by, 8, 8).strokeColor(TEAL).lineWidth(0.75).stroke();
      if (checked) {
        doc.moveTo(bx + 1, by + 4).lineTo(bx + 3, by + 6).lineTo(bx + 7, by + 1)
          .strokeColor(TEAL).lineWidth(1.2).stroke();
      }
      doc.font("Helvetica").fontSize(9).fillColor(DARK)
        .text(stripInlineMarkdown(text), PAGE_MARGINS.left + 26, doc.y, { width: pageWidth - 26 });
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      ensureSpace(doc, 14);
      const text = line.replace(/^[-*] /, "");
      doc.font("Helvetica").fontSize(9).fillColor(TEAL)
        .text("•", PAGE_MARGINS.left + 10, undefined, { continued: true, width: 12 });
      renderRichLine(doc, text, { fontSize: 9, color: DARK, x: PAGE_MARGINS.left + 24, width: pageWidth - 24 });
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      ensureSpace(doc, 14);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(TEAL)
        .text(olMatch[1] + ".", PAGE_MARGINS.left + 10, undefined, { continued: true, width: 16 });
      renderRichLine(doc, olMatch[2], { fontSize: 9, color: DARK, x: PAGE_MARGINS.left + 28, width: pageWidth - 28 });
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      doc.moveDown(0.25);
      i++;
      continue;
    }

    // Regular paragraph
    ensureSpace(doc, 14);
    renderRichLine(doc, line, { fontSize: 9, color: DARK });
    i++;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const mdPath = path.join(__dirname, "../exports/ghana-demo-playbook.md");
const outPath = path.join(__dirname, "../exports/ghana-demo-playbook.pdf");

const markdownContent = fs.readFileSync(mdPath, "utf8");

const doc = new PDFDocument({
  size: "A4",
  margins: PAGE_MARGINS,
  bufferPages: true,
  info: {
    Title: "Ghana Demo Playbook — Universal Credit Hub",
    Author: "Universal Credit Hub Ltd",
    Subject: "Ghana market demonstration playbook and talking points",
    Keywords: "Ghana, credit bureau, UCH, demo, playbook, Bank of Ghana",
    Creator: "Universal Credit Hub v2.8",
    Producer: "UCH PDF Generator",
  },
});

const out = fs.createWriteStream(outPath);
doc.pipe(out);

// ── Cover header ─────────────────────────────────────────────────────────────
const pageWidth = doc.page.width - PAGE_MARGINS.left - PAGE_MARGINS.right;

// Teal banner
doc.rect(PAGE_MARGINS.left - 50, 0, doc.page.width, 120).fill(TEAL);

// Title text
doc.font("Helvetica-Bold").fontSize(26).fillColor("#ffffff")
  .text("Ghana Demo Playbook", PAGE_MARGINS.left, 30, { width: pageWidth });
doc.font("Helvetica").fontSize(13).fillColor("#ccf5f2")
  .text("Universal Credit Hub — Pan-African Credit Registry", PAGE_MARGINS.left, 62, { width: pageWidth });
doc.font("Helvetica").fontSize(10).fillColor("#99e0db")
  .text("Confidential  ·  May 2026  ·  Presentation Day: 11:00 AM GMT", PAGE_MARGINS.left, 84, { width: pageWidth });

// Gold accent strip
doc.rect(PAGE_MARGINS.left - 50, 120, doc.page.width, 4).fill(GOLD);

doc.y = 140;
doc.moveDown(0.5);

// Render markdown body
renderMarkdown(doc, markdownContent);

// Footer on all pages
doc.moveDown(2);
ensureSpace(doc, 50);
doc.moveTo(PAGE_MARGINS.left, doc.y).lineTo(PAGE_MARGINS.left + pageWidth, doc.y)
  .strokeColor(TEAL).lineWidth(1).stroke();
doc.moveDown(0.4);
doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
  .text("Universal Credit Hub — Cross-Jurisdictional Central Data Hub & Credit Registry System v2.8", { align: "center" });
doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
  .text("© 2026 Universal Credit Hub Ltd / Uffe Jon Carlson / Carlson Capital. All rights reserved. Registered in Ghana.", { align: "center" });

addPageNumbers(doc);
doc.end();

out.on("finish", () => {
  const size = fs.statSync(outPath).size;
  console.log(`PDF generated successfully: ${outPath} (${(size / 1024).toFixed(1)} KB)`);
});

out.on("error", (err) => {
  console.error("Error writing PDF:", err);
  process.exit(1);
});
