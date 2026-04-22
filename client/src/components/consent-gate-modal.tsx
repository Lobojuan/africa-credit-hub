import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  MessageSquare, RefreshCw, Send, ChevronRight, ShieldCheck,
} from "lucide-react";

const PERMISSIBLE_PURPOSES = [
  { value: "new_credit", label: "Credit Application / Loan Origination" },
  { value: "review", label: "Account / Portfolio Review" },
  { value: "collection", label: "Debt Collection" },
  { value: "regulatory", label: "Regulatory / Supervisory Purpose" },
  { value: "portfolio_monitoring", label: "Portfolio Monitoring" },
  { value: "fraud_investigation", label: "Fraud Investigation" },
  { value: "employment", label: "Employment Screening" },
];

interface ConsentGateModalProps {
  open: boolean;
  onClose: () => void;
  borrowerId: string;
  borrowerName: string;
  onConsentGranted: (consentId: string, purpose: string) => void;
}

type ConsentPhase =
  | "select_purpose"
  | "sending"
  | "exemption_granted"
  | "pending_borrower"
  | "approved"
  | "denied"
  | "expired"
  | "error";

type ConsentResult = {
  consentId: string;
  status: string;
  exemption: boolean;
  exemptionBasis?: string;
  borrowerName: string;
  notifiedPhone?: string;
  notifiedEmail?: string;
  expiresAt?: string;
};

export function ConsentGateModal({ open, onClose, borrowerId, borrowerName, onConsentGranted }: ConsentGateModalProps) {
  const [phase, setPhase] = useState<ConsentPhase>("select_purpose");
  const [purpose, setPurpose] = useState("");
  const [result, setResult] = useState<ConsentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [resending, setResending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetModal() {
    setPhase("select_purpose");
    setPurpose("");
    setResult(null);
    setErrorMsg("");
    setPollCount(0);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  useEffect(() => {
    if (!open) resetModal();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open]);

  useEffect(() => {
    if (phase === "pending_borrower" && result?.consentId) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/consent-requests/${result.consentId}/status`);
          if (!r.ok) return;
          const data = await r.json();
          setPollCount(c => c + 1);
          if (data.status === "approved") {
            clearInterval(pollRef.current!);
            setPhase("approved");
          } else if (data.status === "denied") {
            clearInterval(pollRef.current!);
            setPhase("denied");
          } else if (data.status === "expired") {
            clearInterval(pollRef.current!);
            setPhase("expired");
          }
        } catch {}
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [phase, result?.consentId]);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/consent-requests", { borrowerId, purpose });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || "Failed to send consent request");
      }
      return res.json();
    },
    onMutate: () => setPhase("sending"),
    onSuccess: (data: any) => {
      const consentResult: ConsentResult = {
        consentId: data.consentId,
        status: data.status,
        exemption: data.exemption || false,
        exemptionBasis: data.exemptionBasis,
        borrowerName: data.borrowerName || borrowerName,
        notifiedPhone: data.notifiedPhone,
        notifiedEmail: data.notifiedEmail,
        expiresAt: data.expiresAt,
      };
      setResult(consentResult);
      if (data.status === "approved" && data.exemption) {
        setPhase("exemption_granted");
      } else if (data.status === "approved") {
        setPhase("approved");
      } else {
        setPhase("pending_borrower");
      }
    },
    onError: (e: any) => {
      setErrorMsg(e?.message || "Failed to send consent request");
      setPhase("error");
    },
  });

  async function handleResend() {
    setResending(true);
    try {
      const res = await apiRequest("POST", "/api/consent-requests", { borrowerId, purpose });
      if (res.ok) {
        const data = await res.json();
        setResult(prev => prev ? { ...prev, consentId: data.consentId, notifiedPhone: data.notifiedPhone, notifiedEmail: data.notifiedEmail } : prev);
        setPollCount(0);
        setPhase("pending_borrower");
      }
    } catch {}
    setResending(false);
  }

  const selectedPurposeLabel = PERMISSIBLE_PURPOSES.find(p => p.value === purpose)?.label || purpose;
  const minutesWaited = Math.floor(pollCount * 5 / 60);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" data-testid="consent-gate-modal">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <DialogTitle className="text-base">BOG Consent Verification</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Under BOG Credit Reporting Regulations, borrower consent is required before any credit report can be generated.
          </DialogDescription>
        </DialogHeader>

        {phase === "select_purpose" && (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
              <span className="text-slate-500">Borrower:</span>{" "}
              <span className="font-semibold text-slate-800" data-testid="text-borrower-name">{borrowerName}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Purpose of Credit Report</label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger data-testid="select-purpose">
                  <SelectValue placeholder="Select permissible purpose…" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIBLE_PURPOSES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> What happens next</p>
              <p>A consent request will be sent to the borrower via SMS and/or email. If an active loan agreement exists, the request is auto-approved under the loan exemption.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel">Cancel</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!purpose}
                onClick={() => requestMutation.mutate()}
                data-testid="button-send-consent-request"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Send Request
              </Button>
            </div>
          </div>
        )}

        {phase === "sending" && (
          <div className="flex flex-col items-center py-8 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm">Checking loan agreement &amp; sending consent request…</p>
          </div>
        )}

        {phase === "exemption_granted" && result && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Auto-Approved — Loan Agreement Exemption</p>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  An active loan relationship exists between your institution and this borrower. Consent is granted automatically under the BOG loan agreement exemption.
                </p>
                {result.exemptionBasis && (
                  <p className="text-xs text-green-600 mt-1.5 font-mono bg-green-100 rounded px-2 py-1">{result.exemptionBasis}</p>
                )}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Borrower</span><span className="font-medium">{result.borrowerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Purpose</span><span className="font-medium text-right max-w-[60%]">{selectedPurposeLabel}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Consent ID</span><span className="font-mono text-xs">{result.consentId.slice(0, 16)}…</span></div>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => { onConsentGranted(result.consentId, purpose); onClose(); }}
              data-testid="button-generate-report"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Generate Credit Report
            </Button>
          </div>
        )}

        {phase === "pending_borrower" && result && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Waiting for Borrower Response</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  A consent request has been sent to <strong>{result.borrowerName}</strong>. Polling for their response every 5 seconds.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Borrower</span><span className="font-medium">{result.borrowerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Purpose</span><span className="font-medium text-right max-w-[60%]">{selectedPurposeLabel}</span></div>
              {result.notifiedPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> SMS sent to</span>
                  <span className="font-mono">{result.notifiedPhone}</span>
                </div>
              )}
              {result.notifiedEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email sent to</span>
                  <span className="font-mono text-right max-w-[55%] truncate">{result.notifiedEmail}</span>
                </div>
              )}
              {!result.notifiedPhone && !result.notifiedEmail && (
                <div className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  No contact info available — borrower must use their link directly
                </div>
              )}
              {result.expiresAt && (
                <div className="flex justify-between"><span className="text-slate-500">Expires</span><span>{new Date(result.expiresAt).toLocaleString()}</span></div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Checking for response… ({pollCount} checks{minutesWaited > 0 ? `, ~${minutesWaited}m` : ""})</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 text-sm" data-testid="button-close-wait">
                Close &amp; Wait
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={handleResend}
                disabled={resending}
                data-testid="button-resend-consent"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Re-send
              </Button>
            </div>
          </div>
        )}

        {phase === "approved" && result && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Borrower Approved</p>
                <p className="text-xs text-green-700 mt-1">
                  <strong>{result.borrowerName}</strong> has approved the credit report request. You may now generate the report.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Consent ID</span><span className="font-mono">{result.consentId.slice(0, 16)}…</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Purpose</span><span className="text-right max-w-[60%]">{selectedPurposeLabel}</span></div>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => { onConsentGranted(result.consentId, purpose); onClose(); }}
              data-testid="button-generate-report"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Generate Credit Report
            </Button>
          </div>
        )}

        {phase === "denied" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Consent Denied by Borrower</p>
                <p className="text-xs text-red-700 mt-1">
                  <strong>{result?.borrowerName || borrowerName}</strong> has denied this credit report request. Under BOG regulations, you may not generate this report.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
              A denial has been logged in the audit trail. If you believe this is in error, contact the borrower directly.
            </div>
            <Button variant="outline" onClick={onClose} className="w-full" data-testid="button-close-denied">
              Close
            </Button>
          </div>
        )}

        {phase === "expired" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <Clock className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Consent Request Expired</p>
                <p className="text-xs text-orange-700 mt-1">
                  The borrower did not respond within 24 hours. A new request must be sent.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel-expired">Cancel</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => { setPhase("select_purpose"); setResult(null); setPollCount(0); }}
                data-testid="button-resend-new"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Send New Request
              </Button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Something went wrong</p>
                <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => { setPhase("select_purpose"); setErrorMsg(""); }}
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
