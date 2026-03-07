import PDFDocument from "pdfkit";
import type { PassThrough } from "stream";

const TEAL = "#0d4a42";
const GOLD = "#d4a843";
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const TABLE_HEADER_BG = "#f0f0f0";
const TABLE_BORDER = "#cccccc";

interface MdToken {
  type: string;
  text?: string;
  depth?: number;
  items?: MdToken[];
  ordered?: boolean;
  header?: string[];
  rows?: string[][];
  cells?: string[][];
  align?: (string | null)[];
  tokens?: MdToken[];
  lang?: string;
}

function stripInlineMarkdown(text: string): string {
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
    .replace(/&#39;/g, "'")
    .replace(/\{\{(.+?)\}\}/g, "$1");
}

function addRichText(doc: PDFKit.PDFDocument, text: string, options: { fontSize?: number; font?: string; color?: string; indent?: number } = {}) {
  const { fontSize = 10, font = "Helvetica", color = DARK, indent = 0 } = options;
  const segments: { text: string; bold: boolean; italic: boolean; code: boolean }[] = [];
  let remaining = text;

  const regex = /(\*\*(.+?)\*\*|__(.+?)__|`(.+?)`|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: stripInlineMarkdown(remaining.slice(lastIndex, match.index)), bold: false, italic: false, code: false });
    }
    if (match[2] || match[3]) {
      segments.push({ text: match[2] || match[3], bold: true, italic: false, code: false });
    } else if (match[4]) {
      segments.push({ text: match[4], bold: false, italic: false, code: true });
    } else if (match[5] || match[6]) {
      segments.push({ text: match[5] || match[6], bold: false, italic: true, code: false });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    segments.push({ text: stripInlineMarkdown(remaining.slice(lastIndex)), bold: false, italic: false, code: false });
  }

  if (segments.length === 0) {
    segments.push({ text: stripInlineMarkdown(text), bold: false, italic: false, code: false });
  }

  const x = doc.page.margins.left + indent;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - indent;

  for (const seg of segments) {
    let f = font;
    if (seg.bold) f = "Helvetica-Bold";
    else if (seg.italic) f = "Helvetica-Oblique";
    else if (seg.code) f = "Courier";

    doc.font(f).fontSize(seg.code ? fontSize - 1 : fontSize).fillColor(color)
      .text(seg.text, x, undefined, { continued: seg !== segments[segments.length - 1], width });
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

export function generatePdfFromMarkdown(markdownContent: string, title: string, stream: PassThrough): void {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: title,
      Author: "Carlson Capital & Systems In Motion Limited™",
      Creator: "Credit Registry System v1.1",
    },
  });

  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.save();
  const gradientSteps = 30;
  const barHeight = 5;
  const barWidth = 80;
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = Math.round(13 + (212 - 13) * ratio);
    const g = Math.round(74 + (168 - 74) * ratio);
    const b = Math.round(66 + (67 - 66) * ratio);
    const segWidth = barWidth / gradientSteps;
    doc.rect(doc.page.margins.left + i * segWidth, doc.y, segWidth, barHeight)
      .fill(`rgb(${r},${g},${b})`);
  }
  doc.restore();
  doc.y += barHeight + 12;

  doc.font("Helvetica-Bold").fontSize(20).fillColor(TEAL).text(title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY)
    .text("Carlson Capital & Systems In Motion Limited™ — Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY)
    .text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`);
  doc.moveDown(0.5);

  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(TABLE_BORDER)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(1);

  const lines = markdownContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("#")) {
      const match = line.match(/^(#{1,4})\s+(.*)/);
      if (match) {
        const depth = match[1].length;
        const text = stripInlineMarkdown(match[2]);
        const sizes: Record<number, number> = { 1: 18, 2: 14, 3: 12, 4: 11 };
        const fontSize = sizes[depth] || 11;

        ensureSpace(doc, fontSize + 20);

        if (depth <= 2) {
          doc.moveDown(0.8);
        } else {
          doc.moveDown(0.5);
        }

        doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(depth <= 2 ? TEAL : DARK).text(text);

        if (depth === 2) {
          doc.moveDown(0.15);
          doc.moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.margins.left + pageWidth, doc.y)
            .strokeColor("#e0e0e0")
            .lineWidth(0.75)
            .stroke();
          doc.moveDown(0.3);
        } else {
          doc.moveDown(0.2);
        }
        i++;
        continue;
      }
    }

    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s:|-]+\|$/)) {
      const headers = line.split("|").filter(c => c.trim() !== "").map(c => stripInlineMarkdown(c.trim()));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").filter(c => c.trim() !== "").map(c => stripInlineMarkdown(c.trim()));
        rows.push(cells);
        i++;
      }

      if (headers.length > 0) {
        const colCount = headers.length;
        const cellPadding = 4;
        const colWidth = pageWidth / colCount;
        const rowHeight = 18;

        ensureSpace(doc, rowHeight * Math.min(3, rows.length + 1) + 10);

        let y = doc.y;
        const x = doc.page.margins.left;

        doc.rect(x, y, pageWidth, rowHeight).fill(TABLE_HEADER_BG);
        for (let c = 0; c < colCount; c++) {
          doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK)
            .text(headers[c] || "", x + c * colWidth + cellPadding, y + 4, { width: colWidth - cellPadding * 2, height: rowHeight - 4 });
        }
        doc.rect(x, y, pageWidth, rowHeight).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
        y += rowHeight;

        for (const row of rows) {
          if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.page.margins.top;
            doc.rect(x, y, pageWidth, rowHeight).fill(TABLE_HEADER_BG);
            for (let c = 0; c < colCount; c++) {
              doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK)
                .text(headers[c] || "", x + c * colWidth + cellPadding, y + 4, { width: colWidth - cellPadding * 2, height: rowHeight - 4 });
            }
            doc.rect(x, y, pageWidth, rowHeight).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
            y += rowHeight;
          }

          for (let c = 0; c < colCount; c++) {
            doc.font("Helvetica").fontSize(7).fillColor(DARK)
              .text(row[c] || "", x + c * colWidth + cellPadding, y + 4, { width: colWidth - cellPadding * 2, height: rowHeight - 4 });
          }
          doc.rect(x, y, pageWidth, rowHeight).strokeColor(TABLE_BORDER).lineWidth(0.5).stroke();
          y += rowHeight;
        }

        doc.y = y + 6;
      }
      continue;
    }

    if (line.startsWith("```")) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      const codeText = codeLines.join("\n");
      if (codeText.trim()) {
        ensureSpace(doc, 30);
        const codeX = doc.page.margins.left + 5;
        const codeWidth = pageWidth - 10;

        doc.font("Courier").fontSize(7.5);
        const textHeight = doc.heightOfString(codeText, { width: codeWidth - 16 });

        doc.rect(codeX, doc.y, codeWidth, textHeight + 16)
          .fill("#f4f4f4");
        doc.fillColor(DARK).text(codeText, codeX + 8, doc.y - textHeight - 8, { width: codeWidth - 16 });
        doc.moveDown(0.5);
      }
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      ensureSpace(doc, 14);
      const text = line.replace(/^[-*]\s+/, "");
      doc.font("Helvetica").fontSize(9).fillColor(DARK)
        .text("•  ", doc.page.margins.left + 10, undefined, { continued: true });
      addRichText(doc, text, { fontSize: 9, indent: 20 });
      i++;
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      ensureSpace(doc, 14);
      const match = line.match(/^(\d+\.)\s+(.*)/);
      if (match) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK)
          .text(match[1] + " ", doc.page.margins.left + 10, undefined, { continued: true });
        addRichText(doc, match[2], { fontSize: 9, indent: 20 });
      }
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      ensureSpace(doc, 20);
      const text = stripInlineMarkdown(line.replace(/^>\s*/, ""));
      const qx = doc.page.margins.left + 3;
      const savedY = doc.y;
      doc.font("Helvetica-Oblique").fontSize(9).fillColor(GRAY)
        .text(text, qx + 12, undefined, { width: pageWidth - 20 });
      doc.moveTo(qx, savedY).lineTo(qx, doc.y).strokeColor(TEAL).lineWidth(2).stroke();
      doc.moveDown(0.3);
      i++;
      continue;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      doc.moveDown(0.3);
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageWidth, doc.y)
        .strokeColor("#e0e0e0")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.3);
      i++;
      continue;
    }

    if (line.trim() === "") {
      doc.moveDown(0.3);
      i++;
      continue;
    }

    ensureSpace(doc, 14);
    addRichText(doc, line, { fontSize: 9 });
    i++;
  }

  doc.moveDown(2);
  ensureSpace(doc, 50);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(TEAL)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
    .text("Carlson Capital & Systems In Motion Limited™ — Cross-Jurisdictional Central Data Hub & Credit Registry System v1.1", { align: "center" });
  doc.text("© 2026 Carlson Capital & Systems In Motion Limited. All rights reserved.", { align: "center" });

  const totalPages = doc.bufferedPageRange().count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    doc.font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY)
      .text(`Page ${p + 1} of ${totalPages}`, doc.page.margins.left, doc.page.height - 35,
        { width: pageWidth, align: "center" });
  }

  doc.end();
}
