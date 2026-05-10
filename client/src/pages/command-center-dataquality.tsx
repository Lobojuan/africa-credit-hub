import { useQuery } from "@tanstack/react-query";
import { Database, AlertTriangle, CheckCircle, BarChart3, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function QualityBar({ label, total, missing, color }: { label: string; total: number; missing: number; color: string }) {
  const present = total - missing;
  const pct = total > 0 ? Math.round((present / total) * 100) : 100;
  const barColor = pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-[100px] truncate">{label}</span>
      <div className="flex-1 bg-muted-foreground/30 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono w-[40px] text-right ${pct >= 90 ? "text-emerald-400" : pct >= 70 ? "text-amber-400" : "text-red-400"}`}>{pct}%</span>
      <span className="text-[9px] text-muted-foreground w-[60px] text-right">{missing} missing</span>
    </div>
  );
}

export function CommandCenterDataQualityTab() {
  const { data, isLoading } = useQuery<{
    borrowers: { total: number; missingNationalId: number; missingEmail: number; missingPhone: number; missingDob: number; missingAddress: number };
    accounts: { total: number; missingBalance: number; missingInstitution: number };
    relatedEntities: { consents: number; disputes: number; payments: number; judgments: number; dishonouredCheques: number };
    overallCompleteness: number;
    byCountry: { country: string; count: number }[];
  }>({
    queryKey: ["/api/platform/data-quality"],
  });

  const oc = data?.overallCompleteness ?? 0;
  const ocColor = oc >= 90 ? "text-emerald-400" : oc >= 70 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-4" data-testid="panel-data-quality">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className={`text-3xl font-bold ${ocColor}`} data-testid="text-overall-completeness">{oc}%</p>
          <p className="text-[10px] text-muted-foreground">Overall Completeness</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{data?.borrowers.total ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Borrowers</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{data?.accounts.total ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Credit Accounts</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{data?.relatedEntities.payments ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Payment Records</p>
        </div>
        <div className="rounded-xl border border-border bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{data?.byCountry.length ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">Countries w/ Data</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground text-sm py-8">Analyzing data quality...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">Borrower Data Completeness</h3>
              </div>
              <div className="space-y-2">
                <QualityBar label="National ID" total={data!.borrowers.total} missing={data!.borrowers.missingNationalId} color="cyan" />
                <QualityBar label="Email" total={data!.borrowers.total} missing={data!.borrowers.missingEmail} color="cyan" />
                <QualityBar label="Phone" total={data!.borrowers.total} missing={data!.borrowers.missingPhone} color="cyan" />
                <QualityBar label="Date of Birth" total={data!.borrowers.total} missing={data!.borrowers.missingDob} color="cyan" />
                <QualityBar label="Address" total={data!.borrowers.total} missing={data!.borrowers.missingAddress} color="cyan" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Credit Account Data Completeness</h3>
              </div>
              <div className="space-y-2">
                <QualityBar label="Balance" total={data!.accounts.total} missing={data!.accounts.missingBalance} color="violet" />
                <QualityBar label="Institution" total={data!.accounts.total} missing={data!.accounts.missingInstitution} color="violet" />
              </div>

              <div className="mt-4 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Related Entity Coverage</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Consents", value: data!.relatedEntities.consents },
                    { label: "Disputes", value: data!.relatedEntities.disputes },
                    { label: "Payment History", value: data!.relatedEntities.payments },
                    { label: "Court Judgments", value: data!.relatedEntities.judgments },
                    { label: "Dishonoured Cheques", value: data!.relatedEntities.dishonouredCheques },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      <span className="text-[10px] font-mono text-foreground">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Data Distribution by Country</h3>
            </div>
            {(data?.byCountry || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No country-level data available</p>
            ) : (
              <div className="space-y-1.5">
                {data!.byCountry.sort((a, b) => b.count - a.count).map(c => {
                  const maxCount = Math.max(...data!.byCountry.map(x => x.count));
                  return (
                    <div key={c.country} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-[100px] truncate">{c.country}</span>
                      <div className="flex-1 bg-muted-foreground/30 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-500/60 rounded-full transition-all" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono w-[50px] text-right">{c.count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Data Quality Recommendations</p>
                <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                  {data!.borrowers.missingNationalId > 0 && <li>{data!.borrowers.missingNationalId} borrowers missing National ID — critical for KYC compliance</li>}
                  {data!.borrowers.missingEmail > 0 && <li>{data!.borrowers.missingEmail} borrowers missing email — impacts notification delivery</li>}
                  {data!.borrowers.missingPhone > 0 && <li>{data!.borrowers.missingPhone} borrowers missing phone — limits SMS alert coverage</li>}
                  {data!.accounts.missingBalance > 0 && <li>{data!.accounts.missingBalance} accounts with no balance data — affects credit scoring accuracy</li>}
                  {oc >= 90 && <li className="text-emerald-400">Excellent data quality — all key fields above 90% completeness</li>}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CommandCenterDataQualityTab;
