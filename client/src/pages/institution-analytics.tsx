import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, Activity, RefreshCw, Zap, CreditCard, FileText, Search, Database, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";

const EVENT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  credit_report: { label: "Credit Reports", icon: FileText, color: "text-blue-600" },
  credit_inquiry: { label: "Credit Inquiries", icon: Search, color: "text-purple-600" },
  api_call: { label: "API Calls", icon: Zap, color: "text-amber-600" },
  batch_upload: { label: "Batch Uploads", icon: Database, color: "text-green-600" },
  dispute_filed: { label: "Disputes Filed", icon: AlertCircle, color: "text-red-600" },
  kyc_check: { label: "KYC Checks", icon: CreditCard, color: "text-indigo-600" },
};

function SimpleBarChart({ data, max }: { data: { date: string; count: number }[]; max: number }) {
  if (!data.length) return <div className="text-sm text-muted-foreground py-4 text-center">No data for this period</div>;
  return (
    <div className="flex items-end gap-1 h-24">
      {data.slice(-14).map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div
            className="w-full bg-primary/80 rounded-sm transition-all hover:bg-primary"
            style={{ height: max > 0 ? `${Math.max(4, (d.count / max) * 80)}px` : "4px" }}
            title={`${d.date}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function InstitutionAnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState("30");

  const { data: stats = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/analytics/institution", days],
    queryFn: () => fetch(`/api/analytics/institution?days=${days}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: billingRecords = [] } = useQuery<any[]>({ queryKey: ["/api/billing/records"] });
  const { data: usageSummary = [] } = useQuery<any[]>({ queryKey: ["/api/billing/usage-summary"] });

  // Aggregate by event type
  const byEventType = stats.reduce((acc: Record<string, number>, row: any) => {
    acc[row.eventType] = (acc[row.eventType] || 0) + Number(row.count);
    return acc;
  }, {});

  // Aggregate by date (all events)
  const byDate = stats.reduce((acc: Record<string, number>, row: any) => {
    acc[row.date] = (acc[row.date] || 0) + Number(row.count);
    return acc;
  }, {});

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const totalEvents = Object.values(byEventType).reduce((s, v) => s + v, 0);

  const recentBilling = (Array.isArray(billingRecords) ? billingRecords : []).slice(0, 10);
  const totalBilled = recentBilling.reduce((s: number, r: any) => s + Number(r.amountCents || 0), 0);
  const unbilled = (Array.isArray(usageSummary) ? usageSummary : []).reduce((s: number, r: any) => s + Number(r.unbilledCents || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Institution Analytics</h1>
          <p className="text-muted-foreground">Usage, billing, and performance metrics for your institution</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32" data-testid="select-analytics-period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="btn-refresh-analytics"><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Events ({days}d)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">GHS {(totalBilled / 100).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-muted-foreground">Billed (Recent)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">GHS {(unbilled / 100).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-muted-foreground">Unbilled Usage</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(byEventType).length}</div>
            <div className="text-sm text-muted-foreground">Active Event Types</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" /> Daily Activity — Last {days} Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground">Loading chart data...</div>
          ) : (
            <>
              <SimpleBarChart data={chartData} max={maxCount} />
              <div className="flex gap-4 mt-3 flex-wrap">
                {chartData.slice(-14).map((d, i) => (
                  <span key={i} className="text-xs text-muted-foreground">{d.date.slice(5)}</span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Events by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Usage by Event Type</CardTitle>
            <CardDescription>Total API events in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(byEventType).length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No usage data recorded for this period. API calls and credit inquiries will appear here.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(byEventType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const meta = EVENT_LABELS[type] || { label: type, icon: Zap, color: "text-gray-600" };
                    const Icon = meta.icon;
                    const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
                    return (
                      <div key={type} data-testid={`stat-event-${type}`} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${meta.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{meta.label}</span>
                            <span className="text-muted-foreground">{count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing records table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Recent Billing</CardTitle>
            <CardDescription>Latest billing records for your organization</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentBilling.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No billing records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBilling.map((r: any, i: number) => (
                      <TableRow key={i} data-testid={`row-billing-${i}`}>
                        <TableCell className="text-sm">{r.billingPeriodStart ? format(new Date(r.billingPeriodStart), "MMM yyyy") : "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{r.subscriptionTier || "standard"}</TableCell>
                        <TableCell className="text-right text-sm font-medium">GHS {(Number(r.amountCents || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "paid" ? "default" : r.status === "overdue" ? "destructive" : "secondary"} className="text-xs">
                            {r.status || "pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
