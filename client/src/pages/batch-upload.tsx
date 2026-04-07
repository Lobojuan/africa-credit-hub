import { useState, useCallback, useRef, Fragment } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Upload, FileText, CheckCircle, AlertTriangle, Download, FileCode, Database, Clock, FileSpreadsheet, X, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, fetchCSRFToken } from "@/lib/queryClient";
import { isGhanaMode } from "@/lib/country-mode";

interface BatchResult {
  totalSubmitted: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; message: string }>;
}

interface ValidationRow {
  rowIndex: number;
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
}

interface UploadHistoryItem {
  id: string;
  format: string;
  totalSubmitted: number;
  successCount: number;
  errorCount: number;
  userId: string | null;
  createdAt: string;
  details: string;
}

const ghanaMode = isGhanaMode();

const requiredFields = ["borrowerId", "borrowerName", "dateOfBirth", "address", "nationalId", "phoneNumber", "reportingDate", "lenderInstitution", "accountNumber", "accountType", "originalAmount", "currentBalance", "currency", "disbursementDate", "maturityDate", "status"];

const sampleJson = ghanaMode ? `[
  {
    "borrowerId": "<BORROWER_ID>",
    "borrowerName": "Kwame Mensah",
    "dateOfBirth": "1985-03-15",
    "address": "12 Independence Ave, Accra",
    "nationalId": "GHA-123456789",
    "phoneNumber": "+233201234567",
    "reportingDate": "2025-01-31",
    "lenderInstitution": "GCB Bank Limited",
    "accountNumber": "GCB-LN-2025-001",
    "accountType": "Term Loan",
    "originalAmount": "150000.00",
    "currentBalance": "125000.00",
    "currency": "GHS",
    "interestRate": "28.50",
    "disbursementDate": "2025-01-15",
    "maturityDate": "2028-01-15",
    "status": "current",
    "daysInArrears": 0,
    "facilityTypeCode": "TML",
    "purposeOfFacility": "BUS",
    "repaymentFrequency": "MTH",
    "assetClassification": "CUR"
  }
]` : `[
  {
    "borrowerId": "<BORROWER_ID>",
    "borrowerName": "Abebe Bekele",
    "dateOfBirth": "1988-06-20",
    "address": "Bole Road, Addis Ababa",
    "nationalId": "ETH-123456789",
    "phoneNumber": "+251911234567",
    "reportingDate": "2025-01-31",
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

const sampleXbrl = ghanaMode ? `<?xml version="1.0" encoding="UTF-8"?>
<creditRegistry xmlns="urn:cdh:credit:1.1">
  <creditAccount>
    <borrowerId>BORROWER_ID</borrowerId>
    <borrowerName>Kwame Mensah</borrowerName>
    <dateOfBirth>1985-03-15</dateOfBirth>
    <address>12 Independence Ave, Accra</address>
    <nationalId>GHA-123456789</nationalId>
    <phoneNumber>+233201234567</phoneNumber>
    <reportingDate>2025-01-31</reportingDate>
    <lenderInstitution>GCB Bank Limited</lenderInstitution>
    <accountNumber>GCB-LN-2025-001</accountNumber>
    <accountType>Term Loan</accountType>
    <originalAmount>150000.00</originalAmount>
    <currentBalance>125000.00</currentBalance>
    <currency>GHS</currency>
    <interestRate>28.50</interestRate>
    <disbursementDate>2025-01-15</disbursementDate>
    <maturityDate>2028-01-15</maturityDate>
    <status>current</status>
    <daysInArrears>0</daysInArrears>
  </creditAccount>
</creditRegistry>` : `<?xml version="1.0" encoding="UTF-8"?>
<creditRegistry xmlns="urn:cdh:credit:1.1">
  <creditAccount>
    <borrowerId>BORROWER_ID</borrowerId>
    <borrowerName>Abebe Bekele</borrowerName>
    <dateOfBirth>1988-06-20</dateOfBirth>
    <address>Bole Road, Addis Ababa</address>
    <nationalId>ETH-123456789</nationalId>
    <phoneNumber>+251911234567</phoneNumber>
    <reportingDate>2025-01-31</reportingDate>
    <lenderInstitution>Commercial Bank of Ethiopia</lenderInstitution>
    <accountNumber>CBE-LN-2025-001</accountNumber>
    <accountType>Personal Loan</accountType>
    <originalAmount>500000.00</originalAmount>
    <currentBalance>450000.00</currentBalance>
    <currency>ETB</currency>
    <interestRate>12.50</interestRate>
    <disbursementDate>2025-01-15</disbursementDate>
    <maturityDate>2028-01-15</maturityDate>
    <status>current</status>
    <daysInArrears>0</daysInArrears>
  </creditAccount>
</creditRegistry>`;

const sampleBogPipe = `SRN|ReportingDate|BorrowerName|GhanaCardNo|DateOfBirth|Address|PhoneNumber|FacilityType|AccountNumber|Currency|OriginalAmount|CurrentBalance|InterestRate|DisbursementDate|MaturityDate|AssetClassification|RepaymentFrequency|DaysInArrears|PurposeOfFacility|CollateralType|CollateralValue
GCB001|20250115|Kwame Mensah|GHA-123456789|1985-03-15|12 Independence Ave Accra|+233201234567|TML|GCB-LN-2025-001|GHS|150000.00|125000.00|28.50|20250115|20280115|CUR|MTH|0|BUS|PRO|200000.00
GCB001|20250115|Abena Osei|GHA-987654321|1990-07-22|45 Ring Road Kumasi|+233209876543|OVD|GCB-OD-2025-002|GHS|50000.00|35000.00|32.00|20250201|20260201|OLM|QTR|15|PER|UNS|0.00`;

const sampleCsv = ghanaMode
  ? `borrowerId,borrowerName,dateOfBirth,address,nationalId,phoneNumber,reportingDate,lenderInstitution,accountNumber,accountType,originalAmount,currentBalance,currency,interestRate,disbursementDate,maturityDate,status,daysInArrears
BORROWER_ID_1,Kwame Mensah,1985-03-15,"12 Independence Ave, Accra",GHA-123456789,+233201234567,2025-01-31,GCB Bank Limited,GCB-LN-2025-001,Term Loan,150000.00,125000.00,GHS,28.50,2025-01-15,2028-01-15,current,0
BORROWER_ID_2,Abena Osei,1990-07-22,"45 Ring Road, Kumasi",GHA-987654321,+233209876543,2025-01-31,Ecobank Ghana,ECO-OD-2025-002,Overdraft,50000.00,35000.00,GHS,32.00,2025-02-01,2026-02-01,current,15`
  : `borrowerId,borrowerName,dateOfBirth,address,nationalId,phoneNumber,reportingDate,lenderInstitution,accountNumber,accountType,originalAmount,currentBalance,currency,interestRate,disbursementDate,maturityDate,status,daysInArrears
BORROWER_ID_1,Abebe Bekele,1988-06-20,"Bole Road, Addis Ababa",ETH-123456789,+251911234567,2025-01-31,Commercial Bank of Ethiopia,CBE-LN-2025-001,Personal Loan,500000.00,450000.00,ETB,12.50,2025-01-15,2028-01-15,current,0
BORROWER_ID_2,Tigist Hailu,1992-11-10,"Piassa, Addis Ababa",ETH-987654321,+251922345678,2025-01-31,Development Bank,DB-LN-2025-002,Business Loan,1000000.00,850000.00,ETB,15.00,2025-02-01,2030-02-01,current,0`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function validateRecord(record: Record<string, string>, index: number): ValidationRow {
  const errors: string[] = [];
  for (const field of requiredFields) {
    if (!record[field] || record[field].trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (record.originalAmount && isNaN(parseFloat(record.originalAmount))) {
    errors.push("originalAmount must be a number");
  }
  if (record.currentBalance && isNaN(parseFloat(record.currentBalance))) {
    errors.push("currentBalance must be a number");
  }
  if (record.disbursementDate && !/^\d{4}-\d{2}-\d{2}$/.test(record.disbursementDate)) {
    errors.push("disbursementDate must be YYYY-MM-DD format");
  }
  if (record.maturityDate && !/^\d{4}-\d{2}-\d{2}$/.test(record.maturityDate)) {
    errors.push("maturityDate must be YYYY-MM-DD format");
  }
  const validStatuses = ["current", "delinquent", "default", "closed", "written_off", "restructured"];
  if (record.status && !validStatuses.includes(record.status)) {
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  }
  return {
    rowIndex: index,
    data: record,
    valid: errors.length === 0,
    errors,
  };
}

function parseCSVToRecords(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

export default function BatchUploadPage() {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [xbrlInput, setXbrlInput] = useState("");
  const [bogInput, setBogInput] = useState("");
  const [uploadTab, setUploadTab] = useState("csv");
  const [result, setResult] = useState<BatchResult | null>(null);
  const [csvValidation, setCsvValidation] = useState<ValidationRow[] | null>(null);
  const [jsonValidation, setJsonValidation] = useState<ValidationRow[] | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [iffFile, setIffFile] = useState<File | null>(null);
  const [iffType, setIffType] = useState("");
  const [iffResult, setIffResult] = useState<any>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const csvFileRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const xbrlFileRef = useRef<HTMLInputElement>(null);
  const bogFileRef = useRef<HTMLInputElement>(null);
  const iffFileRef = useRef<HTMLInputElement>(null);

  const historyQuery = useQuery<UploadHistoryItem[]>({
    queryKey: ["/api/batch-upload/history"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiRequest("POST", "/api/batch-upload/credit-accounts", { records });
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setJsonValidation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-upload/history"] });
      toast({
        title: t('batchUpload.complete'),
        description: t('batchUpload.completeDesc', { success: data.successCount, errors: data.errorCount }),
      });
    },
    onError: (e: Error) => {
      toast({ title: t('batchUpload.uploadFailed'), description: e.message, variant: "destructive" });
    },
  });

  const csvUploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const res = await apiRequest("POST", "/api/batch-upload/csv", { csvData });
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setCsvValidation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-upload/history"] });
      toast({
        title: t('batchUpload.complete'),
        description: t('batchUpload.completeDesc', { success: data.successCount, errors: data.errorCount }),
      });
    },
    onError: (e: Error) => {
      toast({ title: t('batchUpload.uploadFailed'), description: e.message, variant: "destructive" });
    },
  });

  const xbrlUploadMutation = useMutation({
    mutationFn: async (xml: string) => {
      const res = await apiRequest("POST", "/api/batch-upload/xbrl", { xml });
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-upload/history"] });
      toast({
        title: t('batchUpload.complete'),
        description: t('batchUpload.completeDesc', { success: data.successCount, errors: data.errorCount }),
      });
    },
    onError: (e: Error) => {
      toast({ title: t('batchUpload.uploadFailed'), description: e.message, variant: "destructive" });
    },
  });

  const bogUploadMutation = useMutation({
    mutationFn: async (pipeData: string) => {
      const res = await apiRequest("POST", "/api/batch-upload/bog-pipe", { data: pipeData });
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-upload/history"] });
      toast({
        title: t('batchUpload.complete'),
        description: t('batchUpload.completeDesc', { success: data.successCount, errors: data.errorCount }),
      });
    },
    onError: (e: Error) => {
      toast({ title: t('batchUpload.uploadFailed'), description: e.message, variant: "destructive" });
    },
  });

  const iffUploadMutation = useMutation({
    mutationFn: async ({ file, iffType: type }: { file: File; iffType: string }) => {
      const csrfToken = await fetchCSRFToken();
      const formData = new FormData();
      formData.append("file", file);
      if (type) formData.append("iffType", type);
      const res = await fetch("/api/batch-upload/iff", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(errBody.message || "IFF upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIffResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/credit-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batch-upload/history"] });
      toast({
        title: "IFF Upload Complete",
        description: `${data.totalRecords} records processed: ${data.borrowersCreated || 0} created, ${data.borrowersUpdated || 0} updated, ${data.accountsCreated || 0} accounts created, ${data.accountsUpdated || 0} updated, ${data.errors?.length || 0} errors`,
      });
    },
    onError: (e: Error) => {
      toast({ title: "IFF Upload Failed", description: e.message, variant: "destructive" });
    },
  });

  const handleIffSubmit = () => {
    if (!iffFile) return;
    setIffResult(null);
    iffUploadMutation.mutate({ file: iffFile, iffType });
  };

  const handleIffFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setIffFile(file);
  };

  const handleCsvValidate = useCallback(() => {
    if (!csvInput.trim()) return;
    const records = parseCSVToRecords(csvInput);
    if (records.length === 0) {
      toast({ title: t('common.error'), description: "No data rows found in CSV", variant: "destructive" });
      return;
    }
    const validated = records.map((rec, i) => validateRecord(rec, i));
    setCsvValidation(validated);
  }, [csvInput, toast, t]);

  const handleCsvSubmit = () => {
    if (!csvInput.trim()) return;
    setResult(null);
    csvUploadMutation.mutate(csvInput);
  };

  const handleJsonValidate = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        toast({ title: t('common.error'), description: t('batchUpload.mustBeArray'), variant: "destructive" });
        return;
      }
      const validated = parsed.map((rec: any, i: number) => validateRecord(rec, i));
      setJsonValidation(validated);
    } catch {
      toast({ title: t('common.error'), description: t('batchUpload.invalidJson'), variant: "destructive" });
    }
  }, [jsonInput, toast, t]);

  const handleJsonSubmit = () => {
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

  const handleXbrlSubmit = () => {
    if (!xbrlInput.trim()) return;
    setResult(null);
    xbrlUploadMutation.mutate(xbrlInput);
  };

  const handleBogSubmit = () => {
    if (!bogInput.trim()) return;
    setResult(null);
    bogUploadMutation.mutate(bogInput);
  };

  const handleFileDrop = useCallback((e: React.DragEvent, tab: string) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUploadedFileName(prev => ({ ...prev, [tab]: file.name }));
      if (tab === "csv") setCsvInput(text);
      else if (tab === "json") setJsonInput(text);
      else if (tab === "xbrl") setXbrlInput(text);
      else if (tab === "bog") setBogInput(text);
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, tab: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setUploadedFileName(prev => ({ ...prev, [tab]: file.name }));
      if (tab === "csv") setCsvInput(text);
      else if (tab === "json") setJsonInput(text);
      else if (tab === "xbrl") setXbrlInput(text);
      else if (tab === "bog") setBogInput(text);
    };
    reader.readAsText(file);
  }, []);

  const downloadTemplate = (format: string) => {
    window.open(`/api/batch-upload/template/${format}`, "_blank");
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

  const clearFile = (tab: string) => {
    setUploadedFileName(prev => {
      const next = { ...prev };
      delete next[tab];
      return next;
    });
    if (tab === "csv") { setCsvInput(""); setCsvValidation(null); }
    else if (tab === "json") { setJsonInput(""); setJsonValidation(null); }
    else if (tab === "xbrl") setXbrlInput("");
    else if (tab === "bog") setBogInput("");
  };

  const renderDropZone = (tab: string, accept: string, icon: any, label: string, sublabel: string, fileRef: React.RefObject<HTMLInputElement>) => {
    const Icon = icon;
    const fileName = uploadedFileName[tab];
    return (
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${dragOver === tab ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(tab); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleFileDrop(e, tab)}
        onClick={() => fileRef.current?.click()}
        data-testid={`dropzone-${tab}`}
      >
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">{fileName}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); clearFile(tab); }}
              data-testid={`button-clear-file-${tab}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileSelect(e, tab)}
          data-testid={`input-file-${tab}`}
        />
      </div>
    );
  };

  const renderValidationPreview = (validation: ValidationRow[] | null, onClear: () => void) => {
    if (!validation) return null;
    const validCount = validation.filter(v => v.valid).length;
    const invalidCount = validation.filter(v => !v.valid).length;
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">{t('batchUpload.validationPreview')}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{validation.length} rows</Badge>
              <Badge variant="default" className="bg-green-600">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge variant="destructive">{invalidCount} invalid</Badge>}
              <Button size="icon" variant="ghost" onClick={onClear} data-testid="button-clear-validation">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('batchUpload.row')}</TableHead>
                  <TableHead className="w-20">{t('batchUpload.statusLabel')}</TableHead>
                  <TableHead>{t('batchUpload.accountNum')}</TableHead>
                  <TableHead>{t('batchUpload.institution')}</TableHead>
                  <TableHead>{t('batchUpload.issues')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validation.map((row) => (
                  <TableRow key={row.rowIndex}>
                    <TableCell className="text-sm font-mono">{row.rowIndex + 1}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{row.data.accountNumber || "-"}</TableCell>
                    <TableCell className="text-xs">{row.data.lenderInstitution || "-"}</TableCell>
                    <TableCell className="text-xs text-destructive">
                      {row.errors.length > 0 ? row.errors.join("; ") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResultCard = (testIdPrefix: string = "") => {
    if (!result) return null;
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{t('batchUpload.uploadResults')}</h3>
            {result.errorCount > 0 && (
              <Button variant="outline" size="sm" className="text-xs" onClick={downloadErrorReport} data-testid={`button-download-errors${testIdPrefix}`}>
                <Download className="w-3 h-3 mr-1" /> {t('batchUpload.errorReport')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-lg font-bold" data-testid={`text-total-submitted${testIdPrefix}`}>{result.totalSubmitted}</p>
              <p className="text-xs text-muted-foreground">{t('batchUpload.submitted')}</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-md">
              <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid={`text-success-count${testIdPrefix}`}>{result.successCount}</p>
              <p className="text-xs text-muted-foreground">{t('batchUpload.succeeded')}</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-md">
              <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid={`text-error-count${testIdPrefix}`}>{result.errorCount}</p>
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
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-batch-title">{t('batchUpload.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t('batchUpload.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")} data-testid="button-download-csv-template">
            <Download className="w-3.5 h-3.5 mr-1.5" /> CSV Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")} data-testid="button-download-json-template">
            <Download className="w-3.5 h-3.5 mr-1.5" /> JSON Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold mb-1" data-testid="text-required-fields-title">Required Borrower Fields (all formats)</p>
              <div className="flex flex-wrap gap-1.5">
                {["borrowerName", "dateOfBirth", "address", "nationalId", "phoneNumber", "reportingDate"].map(f => (
                  <Badge key={f} variant="outline" className="text-[10px]" data-testid={`badge-required-${f}`}>{f}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">These fields are required in addition to account fields (borrowerId, lenderInstitution, accountNumber, etc.) for accurate borrower matching and credit report generation.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={uploadTab} onValueChange={(v) => { setUploadTab(v); setResult(null); }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="csv" data-testid="tab-csv"><FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> CSV</TabsTrigger>
          <TabsTrigger value="json" data-testid="tab-json"><FileText className="w-3.5 h-3.5 mr-1.5" /> JSON</TabsTrigger>
          <TabsTrigger value="xbrl" data-testid="tab-xbrl"><FileCode className="w-3.5 h-3.5 mr-1.5" /> XBRL / XML</TabsTrigger>
          <TabsTrigger value="iff" data-testid="tab-iff"><Upload className="w-3.5 h-3.5 mr-1.5" /> IFF</TabsTrigger>
          {ghanaMode && (
            <TabsTrigger value="bog" data-testid="tab-bog"><Database className="w-3.5 h-3.5 mr-1.5" /> BoG Format</TabsTrigger>
          )}
          <TabsTrigger value="history" data-testid="tab-history"><Clock className="w-3.5 h-3.5 mr-1.5" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">{t('batchUpload.csvUpload')}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderDropZone("csv", ".csv", FileSpreadsheet, t('batchUpload.uploadCsvFile'), t('batchUpload.uploadCsvFileSub'), csvFileRef)}
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-1">{t('batchUpload.pasteCsv')}</p>
                  <Textarea
                    data-testid="input-batch-csv"
                    value={csvInput}
                    onChange={(e) => { setCsvInput(e.target.value); setCsvValidation(null); }}
                    placeholder={t('batchUpload.csvPlaceholder')}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCsvValidate}
                    disabled={!csvInput.trim()}
                    data-testid="button-validate-csv"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> {t('batchUpload.validatePreview')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCsvSubmit}
                    disabled={csvUploadMutation.isPending || !csvInput.trim()}
                    data-testid="button-submit-csv"
                  >
                    {csvUploadMutation.isPending ? t('batchUpload.processing') : t('batchUpload.submitCsv')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">{t('batchUpload.csvSampleFormat')}</h3>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48" data-testid="text-csv-sample">
                    {sampleCsv}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setCsvInput(sampleCsv)}
                    data-testid="button-use-csv-sample"
                  >
                    {t('batchUpload.useSample')}
                  </Button>
                </CardContent>
              </Card>

              {renderValidationPreview(csvValidation, () => setCsvValidation(null))}
              {renderResultCard("-csv")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="json">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">{t('batchUpload.uploadData')}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderDropZone("json", ".json,.csv", Upload, t('batchUpload.uploadFile'), t('batchUpload.uploadFileSub'), jsonFileRef)}
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-1">{t('batchUpload.pasteJson')}</p>
                  <Textarea
                    data-testid="input-batch-json"
                    value={jsonInput}
                    onChange={(e) => { setJsonInput(e.target.value); setJsonValidation(null); }}
                    placeholder={t('batchUpload.pastePlaceholder')}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleJsonValidate}
                    disabled={!jsonInput.trim()}
                    data-testid="button-validate-json"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> {t('batchUpload.validatePreview')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleJsonSubmit}
                    disabled={uploadMutation.isPending || !jsonInput.trim()}
                    data-testid="button-submit-batch"
                  >
                    {uploadMutation.isPending ? t('batchUpload.processing') : t('batchUpload.submitBatch')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">{t('batchUpload.sampleFormat')}</h3>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48" data-testid="text-sample-format">
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

              {renderValidationPreview(jsonValidation, () => setJsonValidation(null))}
              {renderResultCard("-json")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="xbrl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">{t('batchUpload.xbrlUpload')}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderDropZone("xbrl", ".xbrl,.xml", FileCode, t('batchUpload.uploadXbrlFile'), t('batchUpload.uploadXbrlFileSub'), xbrlFileRef)}
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-1">{t('batchUpload.pasteXbrl')}</p>
                  <Textarea
                    data-testid="input-batch-xbrl"
                    value={xbrlInput}
                    onChange={(e) => setXbrlInput(e.target.value)}
                    placeholder={t('batchUpload.xbrlPlaceholder')}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleXbrlSubmit}
                  disabled={xbrlUploadMutation.isPending || !xbrlInput.trim()}
                  data-testid="button-submit-xbrl"
                >
                  {xbrlUploadMutation.isPending ? t('batchUpload.processing') : t('batchUpload.submitXbrl')}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">{t('batchUpload.xbrlSampleFormat')}</h3>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48" data-testid="text-xbrl-sample">
                    {sampleXbrl}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setXbrlInput(sampleXbrl)}
                    data-testid="button-use-xbrl-sample"
                  >
                    {t('batchUpload.useSample')}
                  </Button>
                </CardContent>
              </Card>

              {renderResultCard("-xbrl")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iff">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">IFF File Upload</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">BOG Format</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Upload Industry File Format (IFF) spreadsheets (.xlsx, .xls, .csv). The system auto-detects the IFF type from column headers, or you can specify it manually.
                </p>

                <div
                  className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${dragOver === "iff" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver("iff"); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setIffFile(file);
                  }}
                  onClick={() => iffFileRef.current?.click()}
                  data-testid="dropzone-iff"
                >
                  {iffFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">{iffFile.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setIffFile(null); setIffResult(null); }}
                        data-testid="button-clear-iff-file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Upload IFF Spreadsheet</p>
                      <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, or .csv files accepted (max 50MB)</p>
                    </>
                  )}
                  <input
                    ref={iffFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleIffFileSelect}
                    data-testid="input-file-iff"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">IFF Type (optional — auto-detected from headers)</Label>
                  <Select value={iffType} onValueChange={setIffType}>
                    <SelectTrigger data-testid="select-iff-type">
                      <SelectValue placeholder="Auto-detect from file headers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="CONSUMER_CREDIT">Consumer Credit</SelectItem>
                      <SelectItem value="BUSINESS_CREDIT">Business Credit</SelectItem>
                      <SelectItem value="CONSUMER_DISHONOURED_CHEQUE">Consumer Dishonoured Cheques</SelectItem>
                      <SelectItem value="BUSINESS_DISHONOURED_CHEQUES">Business Dishonoured Cheques</SelectItem>
                      <SelectItem value="CONSUMER_JUDGEMENT">Consumer Court Judgments</SelectItem>
                      <SelectItem value="BUSINESS_JUDGEMENT">Business Court Judgments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleIffSubmit}
                  disabled={iffUploadMutation.isPending || !iffFile}
                  data-testid="button-submit-iff"
                >
                  {iffUploadMutation.isPending ? "Processing IFF..." : "Upload IFF File"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm">IFF Format Reference</h3>
                  <div className="text-[11px] text-muted-foreground space-y-2">
                    <p>The Industry File Format (IFF) is the standard spreadsheet format defined by the Bank of Ghana for credit data submission to licensed Credit Reference Bureaus.</p>
                    <div className="border-t border-border/40 pt-2">
                      <p className="font-semibold text-foreground mb-1">Supported IFF Types:</p>
                      <div className="space-y-1">
                        <p><strong>CONSUMER_CREDIT</strong> — Individual borrower credit facilities</p>
                        <p><strong>BUSINESS_CREDIT</strong> — Corporate/business credit facilities</p>
                        <p><strong>CONSUMER_DISHONOURED_CHEQUE</strong> — Individual bounced cheques</p>
                        <p><strong>BUSINESS_DISHONOURED_CHEQUES</strong> — Corporate bounced cheques</p>
                        <p><strong>CONSUMER_JUDGEMENT</strong> — Individual court judgments</p>
                        <p><strong>BUSINESS_JUDGEMENT</strong> — Corporate court judgments</p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-2">
                      <p className="font-semibold text-foreground mb-1">Key Fields (Consumer Credit IFF):</p>
                      <div className="flex flex-wrap gap-1">
                        {["SRN", "BorrowerName", "GhanaCardNo", "DateOfBirth", "FacilityType", "AccountNumber", "SanctionedAmount", "OutstandingBalance", "DaysInArrears", "Classification"].map(f => (
                          <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {iffResult && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      {(iffResult.errors?.length || 0) === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      )}
                      <h3 className="font-semibold text-sm">IFF Upload Results</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm" data-testid="iff-result-summary">
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Records</p>
                        <p className="font-bold">{iffResult.totalRecords}</p>
                      </div>
                      {(iffResult.borrowersCreated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Borrowers Created</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{iffResult.borrowersCreated}</p>
                        </div>
                      )}
                      {(iffResult.borrowersUpdated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Borrowers Updated</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{iffResult.borrowersUpdated}</p>
                        </div>
                      )}
                      {(iffResult.accountsCreated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Accounts Created</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{iffResult.accountsCreated}</p>
                        </div>
                      )}
                      {(iffResult.accountsUpdated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Accounts Updated</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{iffResult.accountsUpdated}</p>
                        </div>
                      )}
                      {(iffResult.chequesCreated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Cheques Created</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{iffResult.chequesCreated}</p>
                        </div>
                      )}
                      {(iffResult.chequesUpdated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Cheques Updated</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{iffResult.chequesUpdated}</p>
                        </div>
                      )}
                      {(iffResult.judgmentsCreated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Judgments Created</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{iffResult.judgmentsCreated}</p>
                        </div>
                      )}
                      {(iffResult.judgmentsUpdated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Judgments Updated</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{iffResult.judgmentsUpdated}</p>
                        </div>
                      )}
                      {(iffResult.guarantorsCreated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Guarantors Created</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{iffResult.guarantorsCreated}</p>
                        </div>
                      )}
                      {(iffResult.guarantorsUpdated > 0) && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Guarantors Updated</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{iffResult.guarantorsUpdated}</p>
                        </div>
                      )}
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Errors</p>
                        <p className="font-bold text-red-600 dark:text-red-400">{iffResult.errors?.length || 0}</p>
                      </div>
                    </div>
                    {iffResult.errors?.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {iffResult.errors.slice(0, 20).map((err: any, i: number) => (
                          <div key={i} className="border border-red-200 dark:border-red-800 rounded-md p-3 bg-red-50 dark:bg-red-950/30" data-testid={`error-detail-${i}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Row {err.row}</Badge>
                              {err.field && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{err.field}</Badge>}
                            </div>
                            <p className="text-xs text-red-700 dark:text-red-300 font-medium">{err.message}</p>
                            {err.rowData && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.entries(err.rowData).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {iffResult.errors.length > 20 && (
                          <p className="text-xs text-muted-foreground text-center py-1">...and {iffResult.errors.length - 20} more errors</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {ghanaMode && (
          <TabsContent value="bog">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">BoG Pipe-Delimited Upload</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Bank of Ghana CRB v1.1 format — pipe (|) delimited, YYYYMMDD dates</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderDropZone("bog", ".csv,.txt", Database, "Upload BoG Format File", "Pipe-delimited CSV (.csv, .txt)", bogFileRef)}
                  <div className="relative">
                    <p className="text-xs text-muted-foreground mb-1">Paste pipe-delimited data</p>
                    <Textarea
                      data-testid="input-batch-bog"
                      value={bogInput}
                      onChange={(e) => setBogInput(e.target.value)}
                      placeholder="SRN|ReportingDate|BorrowerName|GhanaCardNo|FacilityType|..."
                      rows={10}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleBogSubmit}
                    disabled={bogUploadMutation.isPending || !bogInput.trim()}
                    data-testid="button-submit-bog"
                  >
                    {bogUploadMutation.isPending ? t('batchUpload.processing') : "Submit BoG Format"}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-sm">BoG Format Reference</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48" data-testid="text-bog-sample">
                      {sampleBogPipe}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setBogInput(sampleBogPipe)}
                      data-testid="button-use-bog-sample"
                    >
                      {t('batchUpload.useSample')}
                    </Button>
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">File Naming Convention</p>
                      <code className="text-[10px] bg-muted px-2 py-1 rounded block">
                        SRN-YYYYMMDD-YYYYMMDD-1.1-FILEIDENT-Seq.csv
                      </code>
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <p><strong>BUSC</strong> — Business Credit</p>
                        <p><strong>CONC</strong> — Consumer Credit</p>
                        <p><strong>BUSD/COND</strong> — Dishonoured Cheques</p>
                        <p><strong>BUSJ/CONJ</strong> — Court Judgments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {renderResultCard("-bog")}
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{t('batchUpload.uploadHistory')}</h3>
              </div>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : !historyQuery.data || historyQuery.data.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('batchUpload.noHistory')}</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('batchUpload.dateTime')}</TableHead>
                        <TableHead>{t('batchUpload.format')}</TableHead>
                        <TableHead className="text-right">{t('batchUpload.totalRecords')}</TableHead>
                        <TableHead className="text-right">{t('batchUpload.succeeded')}</TableHead>
                        <TableHead className="text-right">{t('batchUpload.failed')}</TableHead>
                        <TableHead>{t('batchUpload.successRate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.map((item: any) => {
                        const rate = item.totalSubmitted > 0
                          ? Math.round((item.successCount / item.totalSubmitted) * 100)
                          : 0;
                        const isExpanded = selectedHistoryId === item.id;
                        return (
                          <Fragment key={item.id}>
                          <TableRow
                            data-testid={`row-history-${item.id}`}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setSelectedHistoryId(isExpanded ? null : item.id)}
                          >
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">
                                {item.format || "JSON"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono">{item.totalSubmitted}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-green-600 dark:text-green-400">{item.successCount}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-red-600 dark:text-red-400">{item.errorCount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={rate === 100 ? "default" : rate >= 80 ? "secondary" : "destructive"}
                                className={rate === 100 ? "bg-green-600 text-[10px]" : "text-[10px]"}
                              >
                                {rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${item.id}-detail`}>
                              <TableCell colSpan={6} className="p-0">
                                <div className="bg-accent/30 border-t border-b p-4 space-y-3" data-testid={`detail-panel-${item.id}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <h4 className="font-semibold text-sm">Upload Details</h4>
                                    {item.iffType && (
                                      <Badge variant="outline" className="text-[10px]">{item.iffType}</Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-background rounded-md p-2.5 border">
                                      <p className="text-[10px] text-muted-foreground uppercase">Total Records</p>
                                      <p className="text-lg font-bold">{item.totalSubmitted}</p>
                                    </div>
                                    <div className="bg-background rounded-md p-2.5 border">
                                      <p className="text-[10px] text-muted-foreground uppercase">Succeeded</p>
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{item.successCount}</p>
                                    </div>
                                    <div className="bg-background rounded-md p-2.5 border">
                                      <p className="text-[10px] text-muted-foreground uppercase">Errors</p>
                                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{item.errorCount}</p>
                                    </div>
                                    <div className="bg-background rounded-md p-2.5 border">
                                      <p className="text-[10px] text-muted-foreground uppercase">Success Rate</p>
                                      <p className={`text-lg font-bold ${rate === 100 ? "text-green-600 dark:text-green-400" : rate >= 80 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{rate}%</p>
                                    </div>
                                  </div>

                                  {(item.borrowersCreated > 0 || item.borrowersUpdated > 0 || item.accountsCreated > 0 || item.accountsUpdated > 0 || item.chequesCreated > 0 || item.chequesUpdated > 0 || item.judgmentsCreated > 0 || item.judgmentsUpdated > 0 || item.guarantorsCreated > 0 || item.guarantorsUpdated > 0) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {item.borrowersCreated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                          <span><strong>{item.borrowersCreated}</strong> borrowers created</span>
                                        </div>
                                      )}
                                      {item.borrowersUpdated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span><strong>{item.borrowersUpdated}</strong> borrowers updated</span>
                                        </div>
                                      )}
                                      {item.accountsCreated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                          <span><strong>{item.accountsCreated}</strong> accounts created</span>
                                        </div>
                                      )}
                                      {item.accountsUpdated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span><strong>{item.accountsUpdated}</strong> accounts updated</span>
                                        </div>
                                      )}
                                      {item.chequesCreated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                          <span><strong>{item.chequesCreated}</strong> cheques created</span>
                                        </div>
                                      )}
                                      {item.chequesUpdated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span><strong>{item.chequesUpdated}</strong> cheques updated</span>
                                        </div>
                                      )}
                                      {item.judgmentsCreated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                          <span><strong>{item.judgmentsCreated}</strong> judgments created</span>
                                        </div>
                                      )}
                                      {item.judgmentsUpdated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span><strong>{item.judgmentsUpdated}</strong> judgments updated</span>
                                        </div>
                                      )}
                                      {item.guarantorsCreated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                          <span><strong>{item.guarantorsCreated}</strong> guarantors created</span>
                                        </div>
                                      )}
                                      {item.guarantorsUpdated > 0 && (
                                        <div className="flex items-center gap-2 bg-background rounded-md p-2 border text-xs">
                                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                          <span><strong>{item.guarantorsUpdated}</strong> guarantors updated</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {item.details && (
                                    <div className="bg-background rounded-md p-2.5 border">
                                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Raw Log</p>
                                      <p className="text-xs text-muted-foreground font-mono break-all">{item.details}</p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
