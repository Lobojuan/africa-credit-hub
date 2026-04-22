import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ConsentInfo = {
  id: string;
  status: string;
  borrowerName: string;
  lenderName: string;
  purpose: string;
  permissiblePurpose: string;
  requestedAt: string;
  expiresAt: string;
  respondedAt?: string;
};

const PURPOSE_LABELS: Record<string, string> = {
  new_credit: "Credit Application / Loan Origination",
  review: "Account / Portfolio Review",
  collection: "Debt Collection",
  regulatory: "Regulatory / Supervisory Purpose",
  portfolio_monitoring: "Portfolio Monitoring",
  fraud_investigation: "Fraud Investigation",
  employment: "Employment Screening",
};

export default function ConsentRespondPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const prefillDecision = params.get("decision");

  const [info, setInfo] = useState<ConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ decision: string; borrowerName: string; lenderName: string } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No consent token provided. This link may be invalid.");
      setLoading(false);
      return;
    }
    fetch(`/api/consent/respond/${encodeURIComponent(token)}`)
      .then(async r => {
        if (r.status === 410) { setExpired(true); setLoading(false); return; }
        if (!r.ok) throw new Error((await r.json()).message || "Failed to load");
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setInfo(data);
        setLoading(false);
        if (prefillDecision === "approved" && data.status === "pending") {
          submitDecision("approved", data);
        } else if (prefillDecision === "denied" && data.status === "pending") {
          submitDecision("denied", data);
        }
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  async function submitDecision(decision: "approved" | "denied", infoOverride?: ConsentInfo) {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/consent/respond/${encodeURIComponent(token!)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (r.status === 409) {
        const d = await r.json();
        setResult({ decision: d.status, borrowerName: (infoOverride || info)!.borrowerName, lenderName: (infoOverride || info)!.lenderName });
      } else if (!r.ok) {
        throw new Error((await r.json()).message || "Failed to submit");
      } else {
        const d = await r.json();
        setResult(d);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading consent request...</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-xl text-slate-800">Request Expired</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-2">
            <p className="text-slate-600">This consent request has expired. Please ask the requesting institution to send a new request.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl text-slate-800">Invalid Request</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-2">
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    const approved = result.decision === "approved";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${approved ? "bg-green-100" : "bg-red-100"}`}>
              {approved
                ? <CheckCircle className="w-8 h-8 text-green-600" />
                : <XCircle className="w-8 h-8 text-red-500" />
              }
            </div>
            <CardTitle className="text-xl text-slate-800">
              {approved ? "Consent Approved" : "Consent Denied"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3 pt-2">
            <p className="text-slate-600">
              {approved
                ? `You have approved ${result.lenderName}'s request to access your credit report.`
                : `You have denied ${result.lenderName}'s request to access your credit report. Your data is protected.`
              }
            </p>
            <div className={`rounded-lg p-3 text-sm ${approved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {approved
                ? "A reference has been logged. You may revoke this consent at any time by contacting the Ghana Credit Registry."
                : "No credit report will be generated. You have the right to deny any credit report request."
              }
            </div>
            <p className="text-xs text-slate-400 pt-2">
              Protected under the Ghana Data Protection Act 2012 (Act 843)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  if (info.status !== "pending") {
    const isApproved = info.status === "approved";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isApproved ? "bg-green-100" : "bg-red-100"}`}>
              {isApproved
                ? <CheckCircle className="w-8 h-8 text-green-600" />
                : <XCircle className="w-8 h-8 text-red-500" />
              }
            </div>
            <CardTitle className="text-xl text-slate-800">
              Already {isApproved ? "Approved" : "Denied"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-2">
            <p className="text-slate-600">
              This consent request was already {info.status}
              {info.respondedAt ? ` on ${new Date(info.respondedAt).toLocaleString()}` : ""}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const purposeLabel = PURPOSE_LABELS[info.purpose] || PURPOSE_LABELS[info.permissiblePurpose] || info.purpose;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow text-sm text-slate-600 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Ghana Credit Registry — Secure Consent Portal</span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-800">Credit Report Access Request</CardTitle>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Action Required</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">You are being asked to approve or deny access to your credit report</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Your Name</span>
                <span className="text-slate-800 font-semibold" data-testid="text-borrower-name">{info.borrowerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Requesting Institution</span>
                <span className="text-slate-800 font-semibold" data-testid="text-lender-name">{info.lenderName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Purpose</span>
                <span className="text-slate-800 text-right max-w-[55%]">{purposeLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Requested At</span>
                <span className="text-slate-700">{new Date(info.requestedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Expires At</span>
                <span className="text-amber-600 font-medium">{new Date(info.expiresAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Your Rights Under Ghana Data Protection Act</p>
              <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside">
                <li>You may deny this request — no report will be generated without your approval</li>
                <li>Approving grants one-time access for the stated purpose only</li>
                <li>You may revoke consent at any time via the Ghana Credit Registry</li>
              </ul>
            </div>

            {submitting ? (
              <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting your response...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 h-12"
                  onClick={() => submitDecision("denied")}
                  data-testid="button-deny-consent"
                  disabled={submitting}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny Access
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white h-12"
                  onClick={() => submitDecision("approved")}
                  data-testid="button-approve-consent"
                  disabled={submitting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Access
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          This page is secured by Africa Credit Hub. Your response is logged and protected under Act 843.
        </p>
      </div>
    </div>
  );
}
