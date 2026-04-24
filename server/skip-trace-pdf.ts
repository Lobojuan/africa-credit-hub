// @ts-ignore: pdfkit has no type declarations
import PDFDocumentImport from "pdfkit";
import type { Borrower, ContactEvent, AssetTraceRecord, CourtJudgment } from "@shared/schema";

// Minimal typed surface of pdfkit used by this module. pdfkit ships only a
// CommonJS export with no first-party types; we declare the methods we touch
// rather than `any`-typing the entire document.
interface PDFTextOptions {
  width?: number;
  align?: "left" | "center" | "right" | "justify";
  ellipsis?: boolean;
  continued?: boolean;
  lineGap?: number;
}
interface PDFPageRange { start: number; count: number; }
interface PDFPage {
  width: number;
  height: number;
  margins: { left: number; right: number; top: number; bottom: number };
}
interface PDFDoc {
  page: PDFPage;
  y: number;
  rect(x: number, y: number, w: number, h: number): PDFDoc;
  fill(color?: string): PDFDoc;
  save(): PDFDoc;
  restore(): PDFDoc;
  font(name: string): PDFDoc;
  fontSize(size: number): PDFDoc;
  fillColor(color: string): PDFDoc;
  text(text: string, x?: number | PDFTextOptions, y?: number | PDFTextOptions, opts?: PDFTextOptions): PDFDoc;
  moveDown(lines?: number): PDFDoc;
  addPage(): PDFDoc;
  end(): void;
  bufferedPageRange(): PDFPageRange;
  switchToPage(index: number): PDFDoc;
  pipe<T>(dest: T): T;
  on(event: "data", cb: (chunk: Buffer) => void): PDFDoc;
  on(event: "end", cb: () => void): PDFDoc;
  on(event: "error", cb: (err: Error) => void): PDFDoc;
}
type PDFDocumentCtor = new (opts?: { size?: string; margin?: number; bufferPages?: boolean }) => PDFDoc;
const PDFDocument = PDFDocumentImport as unknown as PDFDocumentCtor;
import type { BorrowerLink } from "./trace-engine";

function isSandboxRawResponse(raw: unknown): boolean {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "source" in raw &&
    (raw as Record<string, unknown>).source === "sandbox"
  );
}

const NORDIC_BLUE = "#1a3a5c";
const NORDIC_ACCENT = "#5b8db0";
const DARK = "#2a2a3a";
const GRAY = "#4a4a5a";
const LIGHT_GRAY = "#7a7a8a";
const RULE_COLOR = "#d4d4d8";

function ensureSpace(doc: PDFDoc, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function header(doc: PDFDoc, title: string) {
  const ml = doc.page.margins.left;
  const cw = doc.page.width - ml - doc.page.margins.right;
  doc.save().rect(ml, doc.y, cw, 3).fill(NORDIC_BLUE).restore();
  doc.y += 8;
  doc.font("Helvetica-Bold").fontSize(16).fillColor(NORDIC_BLUE).text(title, ml);
  doc.y += 4;
  doc.save().rect(ml, doc.y, cw, 0.5).fill(RULE_COLOR).restore();
  doc.y += 10;
}

function sectionTitle(doc: PDFDoc, title: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  const ml = doc.page.margins.left;
  doc.save().rect(ml, doc.y, 4, 16).fill(NORDIC_ACCENT).restore();
  doc.font("Helvetica-Bold").fontSize(11).fillColor(NORDIC_BLUE).text(title, ml + 10, doc.y + 1);
  doc.moveDown(0.3);
  const cw = doc.page.width - ml - doc.page.margins.right;
  doc.save().rect(ml, doc.y, cw, 0.5).fill(RULE_COLOR).restore();
  doc.moveDown(0.4);
}

function row(doc: PDFDoc, label: string, value: string) {
  ensureSpace(doc, 16);
  const ml = doc.page.margins.left;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(label, ml, doc.y, { continued: true, width: 130 });
  doc.font("Helvetica").fillColor(GRAY).text(`  ${value || "—"}`);
  doc.moveDown(0.15);
}

function tableRow(doc: PDFDoc, cells: string[], widths: number[], isHeader = false) {
  ensureSpace(doc, 18);
  const ml = doc.page.margins.left;
  let x = ml;
  const startY = doc.y;
  doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(isHeader ? NORDIC_BLUE : GRAY);
  cells.forEach((c, i) => {
    doc.text(c || "—", x + 2, startY + 2, { width: widths[i] - 4, ellipsis: true });
    x += widths[i];
  });
  doc.y = startY + 14;
  doc.save().rect(ml, doc.y, widths.reduce((a, b) => a + b, 0), 0.3).fill(RULE_COLOR).restore();
  doc.y += 1;
}

function footer(doc: PDFDoc, page: number, total: number) {
  const pw = doc.page.width;
  const ml = doc.page.margins.left;
  const mr = doc.page.margins.right;
  const cw = pw - ml - mr;
  const fy = doc.page.height - doc.page.margins.bottom + 10;
  doc.save().rect(ml, fy, cw, 0.5).fill(RULE_COLOR).restore();
  doc.font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY)
    .text("CONFIDENTIAL — SKIP-TRACE REPORT", ml, fy + 5, { width: cw / 3, align: "left" })
    .text("Africa Credit Hub v2.6 — Tracing Module", ml + cw / 3, fy + 5, { width: cw / 3, align: "center" })
    .text(`Page ${page} of ${total}`, ml + (cw * 2 / 3), fy + 5, { width: cw / 3, align: "right" });
}

export interface SkipTraceData {
  borrower: Borrower;
  contactEvents: ContactEvent[];
  linkedBorrowers: Array<BorrowerLink & { name?: string; nationalId?: string }>;
  assetTraces: AssetTraceRecord[];
  courtJudgments?: CourtJudgment[];
  requestedBy: string;
  requestReason: string;
  organizationName: string;
}

export function generateSkipTracePdf(data: SkipTraceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      // @ts-ignore: info not in PDFKit types
      info: {
        Title: `Skip-Trace Report — ${data.borrower.firstName || data.borrower.companyName || data.borrower.id}`,
        Author: data.organizationName,
        Subject: "Skip-Trace Report",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const reportHasSandboxData = data.assetTraces.some(
      (a) => isSandboxRawResponse(a.rawResponse)
    );

    header(doc, reportHasSandboxData ? "Skip-Trace Report  [CONTAINS SANDBOX DATA]" : "Skip-Trace Report");

    if (reportHasSandboxData) {
      const ml = doc.page.margins.left;
      const cw = doc.page.width - ml - doc.page.margins.right;
      ensureSpace(doc, 22);
      doc.save().rect(ml, doc.y, cw, 18).fill("#fef3c7").restore();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#92400e")
        .text("WARNING: This report includes asset trace records sourced from the registry sandbox environment. Sandbox records contain synthetic test data and are NOT authoritative. Do not use sandbox records as evidence of real-world asset ownership.", ml + 6, doc.y + 4, { width: cw - 12, lineGap: 1 });
      doc.y += 24;
    }

    sectionTitle(doc, "1. Subject Summary");
    const b = data.borrower;
    const fullName = b.companyName || `${b.title || ""} ${b.firstName || ""} ${b.middleNames || ""} ${b.lastName || ""}`.replace(/\s+/g, " ").trim();
    row(doc, "Subject", fullName || "—");
    row(doc, "Borrower ID", b.id);
    row(doc, "National ID", b.nationalId);
    row(doc, "Type", b.type);
    row(doc, "Country", b.country || "—");
    row(doc, "Date Generated", new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC");
    row(doc, "Requested By", data.requestedBy);
    row(doc, "Request Reason", data.requestReason);
    row(doc, "Organization", data.organizationName);
    if (reportHasSandboxData) {
      row(doc, "Data Quality", "⚠ CONTAINS SANDBOX ASSET DATA — not all records are from live registries");
    }

    sectionTitle(doc, "2. Current Contact Information");
    row(doc, "Phone (mobile)", b.phone || "—");
    row(doc, "Phone (home)", b.homeTelephone || "—");
    row(doc, "Phone (work)", b.workTelephone || "—");
    row(doc, "Mobile Money", b.mobileMoneyNumber || "—");
    row(doc, "Email", b.email || "—");
    row(doc, "Residential Address", b.address || "—");
    row(doc, "Postal Address", [b.postalAddress1, b.postalAddress2, b.postalAddress3, b.postalAddress4].filter(Boolean).join(", ") || "—");
    row(doc, "City / Region", `${b.city || "—"} / ${b.region || "—"}`);
    row(doc, "Employer", b.employerName || "—");
    row(doc, "Employer Address", b.employerAddress || "—");

    sectionTitle(doc, "3. Contact History (First Seen → Last Seen)");
    const widths = [80, 200, 90, 90, 35];
    tableRow(doc, ["Type", "Value", "First Seen", "Last Seen", "Hits"], widths, true);
    if (data.contactEvents.length === 0) {
      tableRow(doc, ["—", "No history captured yet", "—", "—", "0"], widths);
    } else {
      for (const ev of data.contactEvents.slice(0, 60)) {
        tableRow(doc, [
          ev.contactType,
          ev.value.length > 40 ? ev.value.slice(0, 40) + "…" : ev.value,
          ev.firstSeen ? new Date(ev.firstSeen).toISOString().slice(0, 10) : "—",
          ev.lastSeen ? new Date(ev.lastSeen).toISOString().slice(0, 10) : "—",
          String(ev.occurrences || 1),
        ], widths);
      }
    }

    sectionTitle(doc, "4. Linked Borrowers (Cross-Borrower Connections)");
    const lwidths = [100, 80, 180, 70, 60];
    tableRow(doc, ["Borrower ID", "Link Type", "Shared Value", "Confidence", "Cluster Size"], lwidths, true);
    if (data.linkedBorrowers.length === 0) {
      tableRow(doc, ["—", "—", "No linked borrowers detected", "—", "0"], lwidths);
    } else {
      for (const l of data.linkedBorrowers.slice(0, 40)) {
        tableRow(doc, [
          (l.name || l.borrowerId).slice(0, 22),
          l.linkType,
          l.linkValueDisplay,
          `${(l.confidence * 100).toFixed(0)}%`,
          String(l.sharedWithCount),
        ], lwidths);
      }
    }

    sectionTitle(doc, "5. Litigation & Court Judgments");
    const jwidths = [70, 100, 80, 80, 90, 60, 50];
    tableRow(doc, ["Case No.", "Court", "Filing Date", "Judgment Date", "Type", "Amount", "Status"], jwidths, true);
    if (!data.courtJudgments || data.courtJudgments.length === 0) {
      tableRow(doc, ["—", "—", "—", "—", "No litigation history on record", "—", "—"], jwidths);
    } else {
      for (const j of data.courtJudgments.slice(0, 30)) {
        tableRow(doc, [
          j.caseNumber || "—",
          j.court || "—",
          j.caseFilingDate ? new Date(j.caseFilingDate).toISOString().slice(0, 10) : "—",
          j.judgmentDate ? new Date(j.judgmentDate).toISOString().slice(0, 10) : "—",
          j.judgmentType || j.bogCaseType || "—",
          j.amount ? `${j.judgmentCurrency || j.currency || ""} ${parseFloat(String(j.amount)).toLocaleString()}` : "—",
          j.status || "—",
        ], jwidths);
      }
    }

    sectionTitle(doc, "6. Asset Trace Results");

    if (reportHasSandboxData) {
      ensureSpace(doc, 18);
      const ml = doc.page.margins.left;
      const cw = doc.page.width - ml - doc.page.margins.right;
      doc.save()
        .rect(ml, doc.y, cw, 16)
        .fill("#fef3c7")
        .restore();
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#92400e")
        .text("⚠  SANDBOX DATA — One or more records below were returned by the registry sandbox. These values are synthetic test data, not live registry records.", ml + 6, doc.y + 4, { width: cw - 12, lineGap: 1 });
      doc.y += 22;
    }

    // A4 content width with 50pt margins = 595 - 100 = 495pt
    const awidths = reportHasSandboxData
      ? [60, 75, 70, 90, 60, 50, 90]   // sum = 495 (sandbox: 7 cols)
      : [70, 90, 80, 130, 70, 50];      // sum = 490 (no sandbox: 6 cols)
    const aHeaders = ["Type", "Provider", "Reference", "Description", "Est. Value", "Status"];
    if (reportHasSandboxData) aHeaders.push("Source");
    tableRow(doc, aHeaders, awidths, true);
    if (data.assetTraces.length === 0) {
      tableRow(doc, ["—", "—", "—", "No asset traces on record", "—", "—", ...(reportHasSandboxData ? ["—"] : [])], awidths);
    } else {
      for (const a of data.assetTraces.slice(0, 30)) {
        const isSandbox = isSandboxRawResponse(a.rawResponse);
        const cells = [
          a.assetType,
          a.provider,
          a.reference || "—",
          a.description || "—",
          a.estimatedValue ? `${a.currency || ""} ${parseFloat(String(a.estimatedValue)).toLocaleString()}` : "—",
          a.status,
        ];
        if (reportHasSandboxData) cells.push(isSandbox ? "SANDBOX" : "live");
        tableRow(doc, cells, awidths);
      }
    }

    if (reportHasSandboxData) {
      ensureSpace(doc, 14);
      const ml = doc.page.margins.left;
      doc.font("Helvetica").fontSize(7.5).fillColor("#92400e")
        .text("* Rows marked SANDBOX contain synthetic data generated by the registry test environment and must not be relied upon as evidence of asset ownership.", ml, doc.y + 4, { lineGap: 1 });
      doc.y += 16;
    }

    sectionTitle(doc, "7. Compliance Notice");
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text(
      "This skip-trace report was generated under a permissible-purpose access request and " +
      "is logged in the platform audit trail. All asset trace adapters that return status='stub' " +
      "indicate that the underlying registry integration is pending a data-sharing agreement; the " +
      "values shown for those rows are deterministic placeholders for workflow continuity, not " +
      "live registry data. The recipient must use this report only for the stated purpose and " +
      "must not retain copies beyond the period required for that purpose. Cross-borrower links " +
      "are derived from contact data points (phone, email, address, employer, account) shared " +
      "between borrower files within your jurisdiction.",
      { align: "justify", lineGap: 2 }
    );

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      footer(doc, i + 1, range.count);
    }
    doc.end();
  });
}
