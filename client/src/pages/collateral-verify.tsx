import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Shield, Calendar, Building2, User, FileText, Tag } from "lucide-react";

interface VerifyResult {
  valid: boolean;
  registrationNumber?: string;
  certificateNumber?: string;
  borrowerName?: string;
  lenderName?: string;
  collateralType?: string;
  collateralClass?: string;
  approvalDate?: string;
  lienPriority?: number | null;
  expiryDate?: string | null;
  countryCode?: string;
  verificationCode?: string;
}

export default function CollateralVerifyPage() {
  const [, params] = useRoute("/verify/:code");
  const code = params?.code ?? "";

  const { data, isLoading, isError } = useQuery<VerifyResult>({
    queryKey: ["/api/public/collateral/verify", code],
    queryFn: async () => {
      const res = await fetch(`/api/public/collateral/verify/${encodeURIComponent(code)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Verification failed");
      }
      return res.json();
    },
    enabled: !!code,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pan-African Collateral Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lien Verification</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Official PPSR certificate verification portal</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="verify-loading">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-500">Verifying certificate…</p>
            </div>
          )}

          {(isError || (data && !data.valid)) && (
            <div className="flex flex-col items-center py-12 px-6 gap-4" data-testid="verify-invalid">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Certificate Not Found</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  The verification code <span className="font-mono font-semibold">{code}</span> does not match any approved financing statement in this registry.
                </p>
              </div>
              <div className="w-full rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
                If you received this certificate from a lender, please contact the issuing institution to verify its authenticity.
              </div>
            </div>
          )}

          {data?.valid && (
            <div data-testid="verify-valid">
              <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-green-800 dark:text-green-300">Verified — Active Lien</h2>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">This financing statement is valid and registered in the Pan-African Collateral Registry.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoField
                    icon={<FileText className="w-4 h-4" />}
                    label="Registration No."
                    value={data.registrationNumber}
                    testId="verify-reg-number"
                  />
                  <InfoField
                    icon={<Shield className="w-4 h-4" />}
                    label="Certificate No."
                    value={data.certificateNumber}
                    testId="verify-cert-number"
                  />
                  <InfoField
                    icon={<Building2 className="w-4 h-4" />}
                    label="Secured Party"
                    value={data.lenderName}
                    testId="verify-lender"
                  />
                  <InfoField
                    icon={<User className="w-4 h-4" />}
                    label="Grantor"
                    value={data.borrowerName}
                    testId="verify-borrower"
                  />
                  <InfoField
                    icon={<Tag className="w-4 h-4" />}
                    label="Collateral Type"
                    value={data.collateralType ? data.collateralType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : undefined}
                    testId="verify-collateral-type"
                  />
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Approval Date"
                    value={data.approvalDate}
                    testId="verify-approval-date"
                  />
                  {data.lienPriority != null && (
                    <InfoField
                      icon={<Shield className="w-4 h-4" />}
                      label="Lien Priority Rank"
                      value={`#${data.lienPriority}`}
                      testId="verify-lien-priority"
                    />
                  )}
                  {data.expiryDate && (
                    <InfoField
                      icon={<Calendar className="w-4 h-4" />}
                      label="Expiry Date"
                      value={data.expiryDate}
                      testId="verify-expiry-date"
                    />
                  )}
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 flex items-center gap-3">
                  <div className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">CODE</div>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest" data-testid="verify-code">{data.verificationCode}</div>
                </div>
              </div>

              <div className="px-6 pb-5 text-xs text-slate-400 dark:text-slate-500 text-center">
                Verified against the Pan-African Collateral Registry · {new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value?: string | null; testId?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-200" data-testid={testId}>
        {value || "—"}
      </div>
    </div>
  );
}
