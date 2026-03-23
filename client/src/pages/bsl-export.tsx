import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Eye, Loader2, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BSL_FILE_IDENTIFIERS } from "@shared/bsl-codes";

type BslFileType = keyof typeof BSL_FILE_IDENTIFIERS;

const FILE_TYPE_DETAILS: Record<BslFileType, { label: string; description: string; color: string }> = {
  CONC: { label: "CONC - Consumer Credit", description: "Individual borrower credit facility data", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 dark:bg-blue-900 dark:text-blue-200" },
  BUSC: { label: "BUSC - Business Credit", description: "Corporate borrower credit facility data", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  CONJ: { label: "CONJ - Consumer Judgment", description: "Individual borrower court judgment records", color: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 dark:bg-amber-900 dark:text-amber-200" },
  BUSJ: { label: "BUSJ - Business Judgment", description: "Corporate borrower court judgment records", color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  COND: { label: "COND - Consumer Dishonoured Cheque", description: "Individual borrower bounced cheque records", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 dark:bg-red-900 dark:text-red-200" },
  BUSD: { label: "BUSD - Business Dishonoured Cheque", description: "Corporate borrower bounced cheque records", color: "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
};

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export default function BslExportPage() {
  const { toast } = useToast();
  const [fileType, setFileType] = useState<BslFileType>("CONC");
  const [reportingDate, setReportingDate] = useState(getTodayDate());
  const [sequenceNumber, setSequenceNumber] = useState("1");
  const [correctionIndicator, setCorrectionIndicator] = useState("0");
  const [downloading, setDownloading] = useState(false);
  const [previewType, setPreviewType] = useState<BslFileType | null>(null);

  const filenamePreview = `SRN-${reportingDate}-${getTodayDate()}-1.0-${fileType}-${sequenceNumber}.csv`;

  const { data: preview, isLoading: previewLoading } = useQuery<{
    filename: string;
    totalRows: number;
    headerRow: string;
    sampleRows: string[];
  }>({
    queryKey: ["/api/bsl/export-preview", previewType, reportingDate],
    queryFn: async () => {
      const res = await fetch(`/api/bsl/export-preview/${previewType}?reportingDate=${reportingDate}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!previewType,
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        reportingDate,
        sequenceNumber,
        correctionIndicator,
      });
      const res = await fetch(`/api/bsl/export/${fileType}?${params}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }
      const disposition = res.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${fileType}-export.csv`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        URL.revokeObjectURL(url);
      }
      toast({ title: "Export complete", description: `Downloaded ${filename}` });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6 p-6" data-testid="bsl-export-page">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">BSL CRB v1.0 Export</h1>
          <p className="text-muted-foreground">Generate Bank of Sierra Leone Credit Reference Bureau compliant pipe-delimited CSV files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">File Configuration</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={fileType} onValueChange={(v) => setFileType(v as BslFileType)}>
                  <SelectTrigger data-testid="select-file-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FILE_TYPE_DETAILS) as BslFileType[]).map((ft) => (
                      <SelectItem key={ft} value={ft} data-testid={`option-file-type-${ft}`}>
                        {FILE_TYPE_DETAILS[ft].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">{FILE_TYPE_DETAILS[fileType].description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reporting Date (YYYYMMDD)</Label>
                  <Input
                    value={reportingDate}
                    onChange={(e) => setReportingDate(e.target.value)}
                    placeholder="20260311"
                    maxLength={8}
                    data-testid="input-reporting-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sequence Number</Label>
                  <Input
                    type="number"
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(e.target.value)}
                    min={1}
                    data-testid="input-sequence-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correction Indicator</Label>
                  <Select value={correctionIndicator} onValueChange={setCorrectionIndicator}>
                    <SelectTrigger data-testid="select-correction-indicator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Normal Submission</SelectItem>
                      <SelectItem value="1">1 - Correction</SelectItem>
                      <SelectItem value="2">2 - Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">File Name Preview</p>
                <code className="text-sm font-mono" data-testid="text-filename-preview">{filenamePreview}</code>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDownload} disabled={downloading} data-testid="button-download">
                  {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {downloading ? "Generating..." : "Download CSV"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewType(previewType === fileType ? null : fileType)}
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewType === fileType ? "Hide Preview" : "Preview Data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {previewType && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Data Preview - {FILE_TYPE_DETAILS[previewType].label}</h3>
              </CardHeader>
              <CardContent>
                {previewLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading preview...</span>
                  </div>
                ) : preview ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" data-testid="text-row-count">{preview.totalRows} records</Badge>
                      <span className="text-sm text-muted-foreground">{preview.filename}</span>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <div className="min-w-max font-mono text-xs p-3 bg-muted/30">
                        <div className="font-semibold text-primary mb-2 whitespace-nowrap" data-testid="text-header-row">
                          {preview.headerRow}
                        </div>
                        {preview.sampleRows.map((row, i) => (
                          <div key={i} className="whitespace-nowrap text-muted-foreground border-t py-1" data-testid={`text-sample-row-${i}`}>
                            {row}
                          </div>
                        ))}
                        {preview.totalRows > 3 && (
                          <div className="text-muted-foreground/60 border-t py-1 italic">
                            ... and {preview.totalRows - 3} more records
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available for preview</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">File Types</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(FILE_TYPE_DETAILS) as [BslFileType, typeof FILE_TYPE_DETAILS[BslFileType]][]).map(([ft, detail]) => (
                <button
                  key={ft}
                  onClick={() => setFileType(ft)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${fileType === ft ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  data-testid={`button-select-${ft}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={detail.color} variant="secondary">{ft}</Badge>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{detail.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Specification</h3>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Format:</strong> Pipe-delimited (|) CSV</p>
              <p><strong>Version:</strong> BSL CRB v1.0</p>
              <p><strong>Regulator:</strong> Bank of Sierra Leone</p>
              <p><strong>Dates:</strong> YYYYMMDD</p>
              <p><strong>Amounts:</strong> Whole numbers (SLE)</p>
              <p><strong>Encoding:</strong> UTF-8</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
