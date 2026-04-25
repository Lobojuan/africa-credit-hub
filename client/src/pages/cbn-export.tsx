import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Eye, Loader2, FileSpreadsheet, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const CBN_FILE_TYPES = {
  CONC: { label: "CONC — Consumer Credit", description: "Individual borrower credit facility data (CBN Credit Reporting Reg. 2017)", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" },
  BUSC: { label: "BUSC — Business Credit", description: "Corporate borrower credit facility data", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200" },
  CONJ: { label: "CONJ — Consumer Judgment", description: "Individual borrower court judgment records", color: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" },
  BUSJ: { label: "BUSJ — Business Judgment", description: "Corporate borrower court judgment records", color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200" },
  COND: { label: "COND — Consumer Bounced Cheque", description: "Individual borrower returned cheque records", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" },
  BUSD: { label: "BUSD — Business Bounced Cheque", description: "Corporate borrower returned cheque records", color: "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200" },
} as const;

type CbnFileType = keyof typeof CBN_FILE_TYPES;

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export default function CbnExportPage() {
  const { toast } = useToast();
  const [fileType, setFileType] = useState<CbnFileType>("CONC");
  const [reportingDate, setReportingDate] = useState(getTodayDate());
  const [sequenceNumber, setSequenceNumber] = useState("1");
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);

  const { data: stats } = useQuery<{ borrowerCount: number; accountCount: number }>({
    queryKey: ["/api/export/stats"],
  });

  const filenamePreview = `CBN-${reportingDate}-${getTodayDate()}-1.0-${fileType}-${sequenceNumber}.csv`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ fileType, reportingDate, sequenceNumber, country: "NG" });
      const res = await fetch(`/api/export/regulatory?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenamePreview;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded", description: filenamePreview });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const params = new URLSearchParams({ fileType, reportingDate, sequenceNumber, country: "NG", preview: "true" });
      const res = await fetch(`/api/export/regulatory?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const text = await res.text();
      setPreviewData(text.split("\n").slice(0, 20).join("\n"));
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  }

  const currentType = CBN_FILE_TYPES[fileType];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          Central Bank of Nigeria (CBN) Regulatory Export
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate credit data submissions compliant with the CBN Credit Reporting Regulation, 2017 and NDPC Act 2023.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.borrowerCount ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Borrowers</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.accountCount ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Credit Accounts</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">CBN Credit Reg. 2017</p>
            <p className="text-xs text-muted-foreground mt-1">Regulatory Framework</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Export Configuration</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-2 block">File Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(CBN_FILE_TYPES) as CbnFileType[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => setFileType(ft)}
                  data-testid={`button-cbn-filetype-${ft}`}
                  className={`p-3 rounded-lg border text-left transition-all ${fileType === ft ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                >
                  <Badge className={`text-xs ${CBN_FILE_TYPES[ft].color}`}>{ft}</Badge>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{CBN_FILE_TYPES[ft].description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{currentType.label}</p>
              <p className="text-muted-foreground">{currentType.description}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cbn-reporting-date" className="text-sm font-medium mb-1 block">Reporting Date (YYYYMMDD)</Label>
              <Input
                id="cbn-reporting-date"
                value={reportingDate}
                onChange={e => setReportingDate(e.target.value)}
                maxLength={8}
                data-testid="input-cbn-reporting-date"
              />
            </div>
            <div>
              <Label htmlFor="cbn-seq" className="text-sm font-medium mb-1 block">Sequence Number</Label>
              <Select value={sequenceNumber} onValueChange={setSequenceNumber}>
                <SelectTrigger id="cbn-seq" data-testid="select-cbn-seq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted rounded-md p-2 font-mono text-xs text-muted-foreground">
            Output filename: <span className="text-foreground">{filenamePreview}</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePreview} variant="outline" disabled={previewing} data-testid="button-cbn-preview" className="flex-1">
              {previewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview (first 20 rows)
            </Button>
            <Button onClick={handleDownload} disabled={downloading} data-testid="button-cbn-download" className="flex-1">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">Preview — first 20 rows of {filenamePreview}</h3>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre leading-relaxed">
              {previewData}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4 text-sm">
          <p className="font-medium text-green-800 dark:text-green-300">Regulatory Compliance Note</p>
          <p className="text-green-700 dark:text-green-400 mt-1">
            Under CBN Credit Reporting Regulation 2017, all financial institutions must submit credit data monthly.
            Submissions are delivered to licensed Credit Bureaus (CRC, FirstCentral, CreditRegistry).
            Late or inaccurate submissions may attract penalties under Section 19 of the Regulation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
