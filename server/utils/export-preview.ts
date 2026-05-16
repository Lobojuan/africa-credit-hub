/**
 * Shared helper for building regulator export preview JSON responses.
 * Used by both /api/cbn|cbk/export-preview (legacy routes) and
 * /api/regulatory/export-preview/cbn|cbk (regulatory-controls-router)
 * so both surfaces always return the same structure — no drift.
 */

export function buildExportPreviewResponse(
  content: string,
  filename: string,
  regulator: "CBN" | "CBK",
  jurisdiction: "Nigeria" | "Kenya",
  fileType: string,
) {
  const lines = content.split("\n");
  const headerRow = lines[0] ?? "";
  const dataLines = lines.filter(l => l.trim() && l !== headerRow);
  return {
    regulator,
    jurisdiction,
    fileType,
    filename,
    headerRow,
    sampleRows: lines.slice(1, 4),
    totalRows: dataLines.length,
    totalDataRows: dataLines.length,
    pipeDelimited: headerRow.includes("|"),
  };
}
