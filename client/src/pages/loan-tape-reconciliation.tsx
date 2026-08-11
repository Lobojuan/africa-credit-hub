import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileCheck2, ShieldCheck, Upload } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MappingProfile = {
  id: string; name: string; bankName: string; sourceSystem: string; version: string; country: string;
  fieldMappings: Record<string, string>; validationRules: Record<string, unknown>; status: "pending" | "approved" | "rejected" | "retired";
  createdBy: string; reviewedBy?: string; reviewNotes?: string; createdAt: string;
};

type ImportRun = {
  id: string; bankName: string; mappingProfileName: string; mappingProfileVersion: string; reportingDate: string;
  originalFilename: string; sourceSha256: string; status: "ready" | "blocked"; totalRecords: number;
  cleanRecords: number; exceptionCount: number; criticalExceptionCount: number; createdAt: string;
};

type ReconciliationException = {
  id: string; sourceRowNumber: number; accountReference: string | null; exceptionType: string; severity: string;
  fieldName: string | null; message: string; status: "open" | "resolved" | "waived"; resolutionNote?: string;
};

const requiredMappingFields = [
  ["accountNumber", "Account reference"], ["currentBalance", "Current balance"], ["currency", "Currency"],
  ["status", "Account status"], ["daysInArrears", "Days in arrears"], ["reportingDate", "Reporting date"],
  ["lenderInstitution", "Lender institution"],
] as const;

const optionalMappingFields = [
  ["amountOverdue", "Amount overdue"], ["nextPaymentDate", "Next payment date"], ["restructureCount", "Restructure count"],
  ["assetClassification", "Asset classification"], ["ifrs9Stage", "Imported IFRS 9 stage"], ["collateralValue", "Collateral value"],
  ["collateralValuationDate", "Collateral valuation date"], ["insuranceExpiry", "Insurance expiry"], ["branchCode", "Branch code"],
  ["sectorCode", "Sector code"], ["relationshipManager", "Relationship manager"], ["creditOfficer", "Credit officer"],
  ["interestInSuspense", "Interest in suspense"], ["provisionAmount", "Provision amount"], ["pd", "Imported PD"], ["lgd", "Imported LGD"], ["ead", "Imported EAD"],
] as const;

const initialMapping: Record<string, string> = Object.fromEntries(requiredMappingFields.map(([field]) => [field, field]));

function statusBadge(status: string) {
  if (status === "approved" || status === "ready" || status === "resolved") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (status === "blocked" || status === "rejected") return "bg-red-500/10 text-red-700 border-red-500/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

export default function LoanTapeReconciliationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canReview = ["admin", "super_admin", "platform_owner", "regulator"].includes(user?.role || "");
  const [profileForm, setProfileForm] = useState({ name: "Core banking monthly extract", bankName: "", sourceSystem: "", version: "1.0", collateralValuationMaxAgeDays: "", fieldMappings: initialMapping });
  const [validationForm, setValidationForm] = useState({ mappingProfileId: "", reportingDate: new Date().toISOString().slice(0, 10), originalFilename: "", csvData: "" });
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<MappingProfile[]>({ queryKey: ["/api/loan-tape-reconciliation/profiles"] });
  const { data: imports = [], isLoading: importsLoading } = useQuery<ImportRun[]>({ queryKey: ["/api/loan-tape-reconciliation/imports"] });
  const { data: exceptions = [] } = useQuery<ReconciliationException[]>({
    queryKey: [`/api/loan-tape-reconciliation/imports/${selectedImportId}/exceptions`],
    enabled: Boolean(selectedImportId),
  });
  const approvedProfiles = profiles.filter((profile) => profile.status === "approved");

  const createProfile = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/loan-tape-reconciliation/profiles", {
        name: profileForm.name, bankName: profileForm.bankName, sourceSystem: profileForm.sourceSystem,
        version: profileForm.version, fieldMappings: Object.fromEntries(Object.entries(profileForm.fieldMappings).filter(([, source]) => source.trim())),
        validationRules: profileForm.collateralValuationMaxAgeDays ? { collateralValuationMaxAgeDays: Number(profileForm.collateralValuationMaxAgeDays) } : {},
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-tape-reconciliation/profiles"] });
      toast({ title: "Mapping submitted", description: "A different authorised reviewer must approve it before any loan tape can be validated." });
    },
    onError: (error: Error) => toast({ title: "Mapping not created", description: error.message, variant: "destructive" }),
  });

  const reviewProfile = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
      const response = await apiRequest("PATCH", `/api/loan-tape-reconciliation/profiles/${id}/review`, {
        decision, reviewNotes: decision === "approved" ? "Reviewed against the controlled bank source specification and approved for reconciliation." : "Rejected pending correction of the source-to-canonical field mapping.",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-tape-reconciliation/profiles"] });
      toast({ title: "Review recorded", description: "The mapping governance trail has been updated." });
    },
    onError: (error: Error) => toast({ title: "Review not recorded", description: error.message, variant: "destructive" }),
  });

  const validateTape = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/loan-tape-reconciliation/validate", validationForm);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-tape-reconciliation/imports"] });
      setSelectedImportId(result.id);
      toast({ title: result.status === "ready" ? "Loan tape is ready" : "Loan tape is blocked", description: `${result.exceptionCount} persistent reconciliation exceptions recorded. Raw source rows were not retained.`, variant: result.status === "blocked" ? "destructive" : "default" });
    },
    onError: (error: Error) => toast({ title: "Validation failed", description: error.message, variant: "destructive" }),
  });

  const resolveException = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "waived" }) => {
      const response = await apiRequest("PATCH", `/api/loan-tape-reconciliation/exceptions/${id}`, { status, resolutionNote: resolutionNotes[id] || "Source-system record corrected and independently verified against bank evidence." });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/loan-tape-reconciliation/imports/${selectedImportId}/exceptions`] });
      toast({ title: "Exception updated", description: "The resolution and reviewer identity are preserved in the audit trail." });
    },
    onError: (error: Error) => toast({ title: "Exception not updated", description: error.message, variant: "destructive" }),
  });

  const loadFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 4_500_000) return toast({ title: "File is too large", description: "Use a controlled extract smaller than 4.5 MB for this validation run.", variant: "destructive" });
    setValidationForm((value) => ({ ...value, originalFilename: file.name, csvData: "" }));
    const csvData = await file.text();
    setValidationForm((value) => ({ ...value, originalFilename: file.name, csvData }));
  };

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8" data-testid="loan-tape-reconciliation-page">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Controlled bank data intake</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Loan-tape Reconciliation</h1><p className="mt-2 max-w-3xl text-muted-foreground">Approve each bank’s source mapping, fingerprint the extract, persist every exception, and block unsafe data before it reaches operational credit records.</p></div>
      <Link href="/npl-early-warning"><Button variant="outline" className="gap-2"><ArrowLeft className="size-4" />NPL desk</Button></Link>
    </header>

    <Card className="border-primary/20 bg-primary/5"><CardContent className="grid gap-4 p-5 md:grid-cols-3">
      <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Maker-checker mappings</p><p className="text-sm text-muted-foreground">The person who creates a mapping cannot approve it.</p></div></div>
      <div className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Evidence, not a second ledger</p><p className="text-sm text-muted-foreground">UCH stores file and row fingerprints, summaries, and exceptions—not raw loan rows.</p></div></div>
      <div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Hard intake gate</p><p className="text-sm text-muted-foreground">Critical and high exceptions block the run until the bank corrects or governs them.</p></div></div>
    </CardContent></Card>

    <section className="grid gap-6 xl:grid-cols-2">
      <Card data-testid="mapping-profile-form"><CardHeader><CardTitle>1. Define the bank mapping</CardTitle><CardDescription>Map the bank’s exact CSV headers to UCH canonical fields. Submission creates a pending version.</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="mapping-bank">Bank name</Label><Input id="mapping-bank" value={profileForm.bankName} onChange={(event) => setProfileForm({ ...profileForm, bankName: event.target.value })} placeholder="OmniBSIC Bank Ghana" /></div><div><Label htmlFor="mapping-source">Source system</Label><Input id="mapping-source" value={profileForm.sourceSystem} onChange={(event) => setProfileForm({ ...profileForm, sourceSystem: event.target.value })} placeholder="Core banking warehouse" /></div><div><Label htmlFor="mapping-name">Profile name</Label><Input id="mapping-name" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></div><div><Label htmlFor="mapping-version">Version</Label><Input id="mapping-version" value={profileForm.version} onChange={(event) => setProfileForm({ ...profileForm, version: event.target.value })} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2">{requiredMappingFields.map(([field, label]) => <div key={field}><Label htmlFor={`mapping-${field}`}>{label} column</Label><Input id={`mapping-${field}`} value={profileForm.fieldMappings[field]} onChange={(event) => setProfileForm({ ...profileForm, fieldMappings: { ...profileForm.fieldMappings, [field]: event.target.value } })} /></div>)}</div>
        <details className="rounded-lg border p-3"><summary className="cursor-pointer font-medium">Optional NPL, IFRS 9 and collateral mappings</summary><p className="mt-2 text-sm text-muted-foreground">Enter only headers present in the bank extract. These values are checked for consistency; this workspace does not assign IFRS stages or provisions.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{optionalMappingFields.map(([field, label]) => <div key={field}><Label htmlFor={`mapping-${field}`}>{label} column</Label><Input id={`mapping-${field}`} value={profileForm.fieldMappings[field] || ""} onChange={(event) => setProfileForm({ ...profileForm, fieldMappings: { ...profileForm.fieldMappings, [field]: event.target.value } })} placeholder="Optional source header" /></div>)}</div></details>
        <div><Label htmlFor="valuation-age">Bank-approved collateral valuation age (days, optional)</Label><Input id="valuation-age" type="number" min="1" max="3650" value={profileForm.collateralValuationMaxAgeDays} onChange={(event) => setProfileForm({ ...profileForm, collateralValuationMaxAgeDays: event.target.value })} placeholder="No universal default is imposed" /></div>
        <Button onClick={() => createProfile.mutate()} disabled={createProfile.isPending || !profileForm.bankName || !profileForm.sourceSystem} data-testid="submit-mapping-profile">Submit mapping for review</Button>
      </CardContent></Card>

      <Card data-testid="loan-tape-validation-form"><CardHeader><CardTitle>2. Validate the controlled extract</CardTitle><CardDescription>Only independently approved mapping versions are available. Validation never writes to credit accounts.</CardDescription></CardHeader><CardContent className="space-y-4">
        <div><Label>Approved mapping</Label><Select value={validationForm.mappingProfileId} onValueChange={(mappingProfileId) => setValidationForm({ ...validationForm, mappingProfileId })}><SelectTrigger data-testid="approved-mapping-select"><SelectValue placeholder={approvedProfiles.length ? "Select approved mapping" : "No approved mapping yet"} /></SelectTrigger><SelectContent>{approvedProfiles.map((profile) => <SelectItem key={profile.id} value={profile.id}>{profile.bankName} · {profile.name} v{profile.version}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="reporting-date">Controlled reporting date</Label><Input id="reporting-date" type="date" value={validationForm.reportingDate} onChange={(event) => setValidationForm({ ...validationForm, reportingDate: event.target.value })} /></div>
        <div><Label htmlFor="loan-tape-file">Bank CSV extract</Label><Input id="loan-tape-file" type="file" accept=".csv,text/csv" onChange={(event) => loadFile(event.target.files?.[0])} data-testid="loan-tape-file" /><p className="mt-1 text-xs text-muted-foreground">Maximum 50,000 rows and 4.5 MB. UCH retains SHA-256 fingerprints, not the raw CSV.</p></div>
        {validationForm.originalFilename && <div className="rounded-lg border p-3 text-sm"><span className="font-medium">Loaded:</span> {validationForm.originalFilename} · {validationForm.csvData.split(/\r?\n/).filter(Boolean).length - 1} estimated data rows</div>}
        <Button onClick={() => validateTape.mutate()} disabled={validateTape.isPending || !validationForm.mappingProfileId || !validationForm.csvData} className="gap-2" data-testid="validate-loan-tape"><Upload className="size-4" />Validate and record evidence</Button>
      </CardContent></Card>
    </section>

    <Card data-testid="mapping-profile-register"><CardHeader><CardTitle>Mapping governance register</CardTitle><CardDescription>{profilesLoading ? "Loading…" : `${profiles.length} controlled mapping version${profiles.length === 1 ? "" : "s"}`}</CardDescription></CardHeader><CardContent className="space-y-3">{profiles.length === 0 ? <p className="text-sm text-muted-foreground">No mapping profiles exist in this bank and country scope.</p> : profiles.map((profile) => <div key={profile.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{profile.bankName} · {profile.name}</p><Badge variant="outline" className={statusBadge(profile.status)}>{profile.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{profile.sourceSystem} · v{profile.version} · {profile.country}</p>{profile.reviewNotes && <p className="mt-1 text-xs text-muted-foreground">Review: {profile.reviewNotes}</p>}</div>{profile.status === "pending" && canReview && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => reviewProfile.mutate({ id: profile.id, decision: "rejected" })}>Reject</Button><Button size="sm" onClick={() => reviewProfile.mutate({ id: profile.id, decision: "approved" })} data-testid={`approve-mapping-${profile.id}`}>Approve</Button></div>}</div>)}</CardContent></Card>

    <Card data-testid="reconciliation-run-register"><CardHeader><CardTitle>Reconciliation evidence register</CardTitle><CardDescription>{importsLoading ? "Loading…" : "Every run is immutable evidence tied to one approved mapping version."}</CardDescription></CardHeader><CardContent className="space-y-3">{imports.length === 0 ? <p className="text-sm text-muted-foreground">No loan-tape validation runs are recorded yet.</p> : imports.map((run) => <button type="button" key={run.id} onClick={() => setSelectedImportId(run.id)} className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 ${selectedImportId === run.id ? "border-primary bg-primary/5" : ""}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{run.bankName} · {run.originalFilename}</p><p className="mt-1 text-sm text-muted-foreground">{run.reportingDate} · {run.mappingProfileName} v{run.mappingProfileVersion} · {run.totalRecords} rows</p></div><Badge variant="outline" className={statusBadge(run.status)}>{run.status}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><span>{run.cleanRecords} clean rows</span><span>{run.exceptionCount} exceptions</span><span>{run.criticalExceptionCount} critical</span></div><p className="mt-2 truncate font-mono text-xs text-muted-foreground">SHA-256 {run.sourceSha256}</p></button>)}</CardContent></Card>

    {selectedImportId && <Card data-testid="reconciliation-exceptions"><CardHeader><CardTitle>Persistent exceptions</CardTitle><CardDescription>Resolve after correcting and independently checking source evidence. Waivers require administrator authority and remain visible.</CardDescription></CardHeader><CardContent className="space-y-3">{exceptions.length === 0 ? <div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />No exceptions were recorded for this run.</div> : exceptions.map((item) => <div key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><Badge variant="outline" className={item.severity === "critical" ? "border-red-500/30 text-red-700" : "border-orange-500/30 text-orange-700"}>{item.severity}</Badge><span className="font-medium">Row {item.sourceRowNumber} · {item.accountReference || "missing account reference"}</span><Badge variant="outline" className={statusBadge(item.status)}>{item.status}</Badge></div><p className="mt-2 text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{item.exceptionType}{item.fieldName ? ` · ${item.fieldName}` : ""}</p></div></div>{item.status === "open" && <div className="mt-3 space-y-2"><Textarea value={resolutionNotes[item.id] || ""} onChange={(event) => setResolutionNotes({ ...resolutionNotes, [item.id]: event.target.value })} placeholder="Record the source correction and evidence checked (minimum 10 characters)" /><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => resolveException.mutate({ id: item.id, status: "resolved" })}>Mark corrected</Button>{["admin", "super_admin", "platform_owner"].includes(user?.role || "") && <Button size="sm" variant="destructive" onClick={() => resolveException.mutate({ id: item.id, status: "waived" })}>Governed waiver</Button>}</div></div>}</div>)}</CardContent></Card>}

    <Card className="border-dashed"><CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">Operational import remains a separate controlled action</p><p className="text-sm text-muted-foreground">A ready reconciliation proves the extract passed this gate; it does not silently alter the UCH loan ledger.</p></div><Link href="/batch-upload"><Button variant="outline">Continue to approved batch upload</Button></Link></CardContent></Card>
  </main>;
}
