import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Upload, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BatchResult {
  totalSubmitted: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; message: string }>;
}

const sampleJson = `[
  {
    "borrowerId": "<BORROWER_ID>",
    "lenderInstitution": "Commercial Bank of Ethiopia",
    "accountNumber": "CBE-LN-2025-001",
    "accountType": "Personal Loan",
    "originalAmount": "500000.00",
    "currentBalance": "450000.00",
    "currency": "ETB",
    "interestRate": "12.50",
    "disbursementDate": "2025-01-15",
    "maturityDate": "2028-01-15",
    "status": "current",
    "daysInArrears": 0
  }
]`;

export default function BatchUploadPage() {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState("");
  const [result, setResult] = useState<BatchResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiRequest("POST", "/api/batch-upload/credit-accounts", { records });
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: t('batchUpload.complete'),
        description: t('batchUpload.completeDesc', { success: data.successCount, errors: data.errorCount }),
      });
    },
    onError: (e: Error) => {
      toast({ title: t('batchUpload.uploadFailed'), description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        toast({ title: t('common.error'), description: t('batchUpload.mustBeArray'), variant: "destructive" });
        return;
      }
      setResult(null);
      uploadMutation.mutate(parsed);
    } catch {
      toast({ title: t('common.error'), description: t('batchUpload.invalidJson'), variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".csv")) {
        try {
          const lines = text.trim().split("\n");
          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
          const records = lines.slice(1).map(line => {
            const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = values[i] || ""; });
            return obj;
          });
          setJsonInput(JSON.stringify(records, null, 2));
        } catch {
          toast({ title: t('common.error'), description: t('batchUpload.csvParseFailed'), variant: "destructive" });
        }
      } else {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  const downloadErrorReport = () => {
    if (!result) return;
    const report = {
      summary: {
        totalSubmitted: result.totalSubmitted,
        successCount: result.successCount,
        errorCount: result.errorCount,
      },
      errors: result.errors,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-upload-errors-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-batch-title">{t('batchUpload.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4">
          {t('batchUpload.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-sm">{t('batchUpload.uploadData')}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block">
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{t('batchUpload.uploadFile')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('batchUpload.uploadFileSub')}</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
              </label>
            </div>
            <div className="relative">
              <p className="text-xs text-muted-foreground mb-1">{t('batchUpload.pasteJson')}</p>
              <Textarea
                data-testid="input-batch-json"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={t('batchUpload.pastePlaceholder')}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={uploadMutation.isPending || !jsonInput.trim()}
              data-testid="button-submit-batch"
            >
              {uploadMutation.isPending ? t('batchUpload.processing') : t('batchUpload.submitBatch')}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-sm">{t('batchUpload.sampleFormat')}</h3>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64" data-testid="text-sample-format">
                {sampleJson}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setJsonInput(sampleJson)}
                data-testid="button-use-sample"
              >
                {t('batchUpload.useSample')}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{t('batchUpload.uploadResults')}</h3>
                  {result.errorCount > 0 && (
                    <Button variant="outline" size="sm" className="text-xs" onClick={downloadErrorReport} data-testid="button-download-errors">
                      <Download className="w-3 h-3 mr-1" /> {t('batchUpload.errorReport')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-lg font-bold" data-testid="text-total-submitted">{result.totalSubmitted}</p>
                    <p className="text-xs text-muted-foreground">{t('batchUpload.submitted')}</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-md">
                    <p className="text-lg font-bold text-green-600" data-testid="text-success-count">{result.successCount}</p>
                    <p className="text-xs text-muted-foreground">{t('batchUpload.succeeded')}</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-md">
                    <p className="text-lg font-bold text-red-600" data-testid="text-error-count">{result.errorCount}</p>
                    <p className="text-xs text-muted-foreground">{t('batchUpload.failed')}</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="overflow-auto max-h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t('batchUpload.row')}</TableHead>
                          <TableHead>{t('batchUpload.error')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-mono">{err.index + 1}</TableCell>
                            <TableCell className="text-xs text-destructive">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
