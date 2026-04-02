import { useQuery } from "@tanstack/react-query";
import {
  Smartphone, Zap, Phone, Home, Shield, Store,
  TrendingUp, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandColors } from "@/hooks/use-brand-colors";

interface AlternativeDataRecord {
  id: number;
  source: string;
  provider: string;
  status: string;
  totalTransactions: number | null;
  onTimePayments: number | null;
  latePayments: number | null;
  averageMonthlyAmount: string | null;
  currency: string;
  dataStartDate: string | null;
  dataEndDate: string | null;
  rawScore: number | null;
}

const SOURCE_CONFIG: Record<string, { icon: typeof Smartphone; label: string; color: string }> = {
  mobile_money: { icon: Smartphone, label: "Mobile Money", color: "text-green-600 dark:text-green-400" },
  utility: { icon: Zap, label: "Utility Payments", color: "text-amber-600 dark:text-amber-400" },
  telco: { icon: Phone, label: "Telco Data", color: "text-blue-600 dark:text-blue-400" },
  rent: { icon: Home, label: "Rent Payments", color: "text-purple-600 dark:text-purple-400" },
  insurance: { icon: Shield, label: "Insurance", color: "text-teal-600 dark:text-teal-400" },
  merchant: { icon: Store, label: "Merchant Data", color: "text-orange-600 dark:text-orange-400" },
};

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="default" className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Active</Badge>;
  if (status === "expired") return <Badge variant="secondary" className="text-[10px]">Expired</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Revoked</Badge>;
}

export function AlternativeDataCard({ borrowerId }: { borrowerId: string }) {
  const brandColors = useBrandColors();
  const { data, isLoading } = useQuery<AlternativeDataRecord[]>({
    queryKey: ['/api/borrowers', borrowerId, 'alternative-data'],
    queryFn: async () => {
      const res = await fetch(`/api/borrowers/${borrowerId}/alternative-data`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="border border-border/30" data-testid="card-alternative-data-loading">
        <CardContent className="p-5">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const records = data || [];

  return (
    <Card className="border border-border/30" data-testid="card-alternative-data">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: brandColors.headerGradient }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold" data-testid="text-alt-data-title">Alternative Data Sources</h3>
              <p className="text-[11px] text-muted-foreground/70">Mobile money, utility payments, telco data</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{records.length} source{records.length !== 1 ? "s" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-6" data-testid="text-no-alt-data">
            <Smartphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alternative data sources linked</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Mobile money, utility, and telco data can boost credit scores</p>
          </div>
        ) : (
          records.map((record) => {
            const config = SOURCE_CONFIG[record.source] || SOURCE_CONFIG.merchant;
            const Icon = config.icon;
            const total = record.totalTransactions || 0;
            const onTime = record.onTimePayments || 0;
            const rate = total > 0 ? Math.round((onTime / total) * 100) : 0;

            return (
              <div
                key={record.id}
                className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2"
                data-testid={`card-alt-data-${record.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-semibold">{config.label}</span>
                    <span className="text-[11px] text-muted-foreground">via {record.provider}</span>
                  </div>
                  <StatusBadge status={record.status} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p>
                    <p className="text-sm font-semibold" data-testid={`text-alt-txns-${record.id}`}>{total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">On-Time Rate</p>
                    <p className={`text-sm font-semibold flex items-center gap-1 ${rate >= 90 ? "text-green-600 dark:text-green-400" : rate >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {rate >= 90 ? <CheckCircle className="w-3 h-3" /> : rate >= 70 ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {rate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Monthly</p>
                    <p className="text-sm font-semibold">
                      {record.averageMonthlyAmount ? `${record.currency || "USD"} ${parseFloat(record.averageMonthlyAmount).toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>

                {total > 0 && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rate}%`,
                        background: rate >= 90 ? "linear-gradient(90deg, hsl(142 71% 45%), hsl(142 60% 35%))" :
                          rate >= 70 ? "linear-gradient(90deg, hsl(42 85% 55%), hsl(32 78% 46%))" :
                          "linear-gradient(90deg, hsl(0 72% 51%), hsl(0 60% 41%))",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
