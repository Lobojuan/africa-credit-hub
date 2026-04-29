/**
 * Admin Loto Messaging Dashboard — Task #286.
 *
 * One page, two queries:
 *   - /api/loto/admin/messaging/stats   → aggregate per (country, template, channel)
 *   - /api/loto/admin/messaging/recent  → most recent rows (recipient masked)
 *
 * Visible to super_admin / dgi / loto_admin / tax_admin / admin (matches the
 * server-side requireRole gate). Phone numbers in the recent list are
 * already masked by the API.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MessageStat {
  countryCode: string;
  templateKey: string;
  channel: string;
  total: number;
  dispatched: number;
  failed: number;
  pending: number;
  optedOut: number;
  deliveryRate: number;
}

interface RecentMessage {
  id: string;
  countryCode: string;
  channel: string;
  templateKey: string;
  language: string;
  recipient: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  provider: string;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "dispatched" ? "default"
    : status === "failed" ? "destructive"
    : status === "opted_out" ? "secondary"
    : "outline";
  return <Badge variant={variant} data-testid={`badge-status-${status}`}>{status}</Badge>;
}

export default function LotoMessagingDashboardPage() {
  const statsQ = useQuery<{ stats: MessageStat[]; sinceDays: number }>({
    queryKey: ["/api/loto/admin/messaging/stats"],
  });
  const recentQ = useQuery<{ messages: RecentMessage[] }>({
    queryKey: ["/api/loto/admin/messaging/recent"],
  });

  const stats = statsQ.data?.stats ?? [];
  const recent = recentQ.data?.messages ?? [];

  const totalSent = stats.reduce((s, r) => s + r.dispatched, 0);
  const totalFailed = stats.reduce((s, r) => s + r.failed, 0);
  const totalAll = stats.reduce((s, r) => s + r.total, 0);
  const overallRate = totalAll > 0 ? (totalSent / totalAll) * 100 : 0;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6" data-testid="page-loto-messaging-dashboard">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-semibold">Loto Messaging</h1>
          <p className="text-sm text-muted-foreground">
            Outbound SMS, push and USSD activity for the Loto Fiscal product
            (last {statsQ.data?.sinceDays ?? 30} days).
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-kpi-dispatched">
          <CardHeader className="pb-2">
            <CardDescription>Dispatched</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {totalSent}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-kpi-failed">
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {totalFailed}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-kpi-rate">
          <CardHeader className="pb-2">
            <CardDescription>Delivery rate</CardDescription>
            <CardTitle className="text-2xl">{overallRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Per-template breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-template breakdown</CardTitle>
          <CardDescription>Country × template × channel rollup.</CardDescription>
        </CardHeader>
        <CardContent>
          {statsQ.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : stats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No messaging activity in the last {statsQ.data?.sinceDays ?? 30} days.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, i) => (
                  <TableRow key={i} data-testid={`row-stat-${s.countryCode}-${s.templateKey}-${s.channel}`}>
                    <TableCell className="font-mono text-xs">{s.countryCode}</TableCell>
                    <TableCell className="text-sm">{s.templateKey}</TableCell>
                    <TableCell className="text-sm">{s.channel}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600">{s.dispatched}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">{s.failed}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(s.deliveryRate * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent messages</CardTitle>
          <CardDescription>Latest 100 outbound rows. Recipient phone digits are masked.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentQ.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No messages yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((m) => (
                  <TableRow key={m.id} data-testid={`row-message-${m.id}`}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{m.countryCode}</TableCell>
                    <TableCell className="text-sm">{m.templateKey}</TableCell>
                    <TableCell className="text-sm">{m.channel}</TableCell>
                    <TableCell className="font-mono text-xs">{m.recipient}</TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{m.attempts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
