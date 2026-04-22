import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Shield, FileCheck, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

const PERMISSIBLE_PURPOSES = [
  { value: "new_credit", label: "Credit Application / Loan Origination", description: "Assessing a new credit or loan application from this data subject" },
  { value: "review", label: "Account / Portfolio Review", description: "Reviewing an existing credit facility or monitoring portfolio health" },
  { value: "collection", label: "Debt Collection", description: "Recovering amounts due under an existing credit agreement" },
  { value: "regulatory", label: "Regulatory / Supervisory Purpose", description: "Supervisory assessment by a licensed regulator or government body" },
  { value: "portfolio_monitoring", label: "Portfolio Monitoring", description: "Ongoing monitoring of a portfolio of existing borrowers" },
  { value: "fraud_investigation", label: "Fraud Investigation", description: "Investigating suspected fraudulent activity linked to this data subject" },
  { value: "employment", label: "Employment Screening", description: "Pre-employment credit screening with written candidate consent" },
];

const CONSENT_METHODS = [
  { value: "signed_form", label: "Signed Consent Form", description: "Data subject signed a physical or digital consent form" },
  { value: "otp_verified", label: "OTP Verification", description: "Consent verified via one-time password sent to data subject's phone or email" },
  { value: "digital_portal", label: "Digital Consent Portal", description: "Data subject consented through an online portal or mobile app" },
  { value: "witnessed_verbal", label: "Witnessed Verbal Consent", description: "Verbal consent obtained and witnessed (recorded or documented)" },
];

interface ConsentGateModalProps {
  open: boolean;
  onClose: () => void;
  borrowerId: string;
  borrowerName: string;
  onConsentGranted: (consentId: string, purpose: string) => void;
}

export function ConsentGateModal({ open, onClose, borrowerId, borrowerName, onConsentGranted }: ConsentGateModalProps) {
  const [step, setStep] = useState(1);
  const [permissiblePurpose, setPermissiblePurpose] = useState("");
  const [consentMethod, setConsentMethod] = useState("");
  const [consentReference, setConsentReference] = useState("");
  const [dataSubjectConfirmed, setDataSubjectConfirmed] = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);

  const selectedPurpose = PERMISSIBLE_PURPOSES.find(p => p.value === permissiblePurpose);
  const selectedMethod = CONSENT_METHODS.find(m => m.value === consentMethod);

  const consentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/consent-records", {
        borrowerId,
        grantedTo: "Institution",
        purpose: permissiblePurpose,
        consentType: "credit_report",
        permissiblePurpose,
        consentMethod,
        consentReference: consentReference || undefined,
        dataSubjectConfirmed,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      onConsentGranted(data.id, permissiblePurpose);
      handleClose();
    },
  });

  const handleClose = () => {
    setStep(1);
    setPermissiblePurpose("");
    setConsentMethod("");
    setConsentReference("");
    setDataSubjectConfirmed(false);
    setLegalConfirmed(false);
    onClose();
  };

  const canProceedStep1 = !!permissiblePurpose;
  const canProceedStep2 = !!consentMethod && dataSubjectConfirmed && legalConfirmed;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="modal-consent-gate">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-base font-semibold">Consent Verification Required</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            BOG Credit Reporting Regulations require verified consent before any credit report is generated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 my-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                step > s ? "bg-green-600 text-white" :
                step === s ? "bg-blue-600 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-px w-8 ${step > s ? "bg-green-600" : "bg-border"}`} />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {step === 1 ? "Permissible Purpose" : step === 2 ? "Consent Confirmation" : "Review & Submit"}
          </span>
        </div>

        <div className="mt-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Requesting a credit report for <strong>{borrowerName}</strong>. This inquiry will be permanently recorded.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Permissible Purpose <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">Select the lawful reason for accessing this credit report</p>
              <Select value={permissiblePurpose} onValueChange={setPermissiblePurpose} data-testid="select-permissible-purpose">
                <SelectTrigger className="w-full" data-testid="trigger-permissible-purpose">
                  <SelectValue placeholder="Select purpose..." />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIBLE_PURPOSES.map(p => (
                    <SelectItem key={p.value} value={p.value} data-testid={`option-purpose-${p.value}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPurpose && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">{selectedPurpose.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose} data-testid="button-consent-cancel">Cancel</Button>
              <Button size="sm" onClick={() => setStep(2)} disabled={!canProceedStep1} data-testid="button-consent-next-1">
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Consent Method <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">How was consent obtained from the data subject?</p>
              <Select value={consentMethod} onValueChange={setConsentMethod} data-testid="select-consent-method">
                <SelectTrigger className="w-full" data-testid="trigger-consent-method">
                  <SelectValue placeholder="Select method..." />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value} data-testid={`option-method-${m.value}`}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMethod && (
                <p className="text-xs text-muted-foreground mt-1">{selectedMethod.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Consent Reference Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Form #, OTP session ID, Portal ref..."
                value={consentReference}
                onChange={e => setConsentReference(e.target.value)}
                data-testid="input-consent-reference"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="data-subject-confirmed"
                  checked={dataSubjectConfirmed}
                  onCheckedChange={v => setDataSubjectConfirmed(!!v)}
                  data-testid="checkbox-data-subject-confirmed"
                />
                <Label htmlFor="data-subject-confirmed" className="text-xs font-normal leading-relaxed cursor-pointer">
                  I confirm that <strong>{borrowerName}</strong> has been informed of this credit enquiry and has given their explicit consent for this specific purpose.
                </Label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="legal-confirmed"
                  checked={legalConfirmed}
                  onCheckedChange={v => setLegalConfirmed(!!v)}
                  data-testid="checkbox-legal-confirmed"
                />
                <Label htmlFor="legal-confirmed" className="text-xs font-normal leading-relaxed cursor-pointer">
                  I confirm that my institution is BOG-licensed for credit bureau access and that this request is made under a permissible purpose as defined by the Credit Reporting Act of Ghana.
                </Label>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} data-testid="button-consent-back-2">Back</Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={!canProceedStep2} data-testid="button-consent-next-2">
                Review <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border divide-y text-sm">
              <div className="flex justify-between items-start p-3">
                <span className="text-muted-foreground text-xs">Data Subject</span>
                <span className="font-medium text-xs text-right">{borrowerName}</span>
              </div>
              <div className="flex justify-between items-start p-3">
                <span className="text-muted-foreground text-xs">Permissible Purpose</span>
                <Badge variant="secondary" className="text-[10px]">{selectedPurpose?.label}</Badge>
              </div>
              <div className="flex justify-between items-start p-3">
                <span className="text-muted-foreground text-xs">Consent Method</span>
                <span className="font-medium text-xs text-right">{selectedMethod?.label}</span>
              </div>
              {consentReference && (
                <div className="flex justify-between items-start p-3">
                  <span className="text-muted-foreground text-xs">Reference</span>
                  <span className="font-medium text-xs text-right font-mono">{consentReference}</span>
                </div>
              )}
              <div className="flex justify-between items-start p-3">
                <span className="text-muted-foreground text-xs">Consent Expiry</span>
                <span className="font-medium text-xs text-right">90 days from now</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex gap-2">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                This consent record will be permanently saved in the audit trail and linked to the generated credit report.
              </p>
            </div>

            {consentMutation.isError && (
              <p className="text-xs text-destructive" data-testid="error-consent-submit">
                Failed to record consent. Please try again.
              </p>
            )}

            <div className="flex justify-between gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} disabled={consentMutation.isPending} data-testid="button-consent-back-3">Back</Button>
              <Button
                size="sm"
                onClick={() => consentMutation.mutate()}
                disabled={consentMutation.isPending}
                data-testid="button-consent-confirm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                {consentMutation.isPending ? "Recording Consent..." : "Confirm & Generate Report"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
