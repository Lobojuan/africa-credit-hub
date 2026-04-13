import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Bell, Search, Filter, Clock, Mail, Phone, CheckCircle, XCircle, AlertTriangle, Building2, Eye, FileText, ShieldAlert, TrendingUp, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { BorrowerAlert } from "@shared/schema";

type EnrichedAlert = BorrowerAlert & { borrowerName?: string | null };

function getAlertTypeIcon(type: string) {
  switch (type) {
    case "credit_inquiry": return <Search className="w-4 h-4" />;
    case "report_accessed": return <Eye className="w-4 h-4" />;
    case "dispute_update": return <ShieldAlert className="w-4 h-4" />;
    case "score_change": return <TrendingUp className="w-4 h-4" />;
    case "data_updated": return <FileText className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function getAlertTypeBadge(type: string) {
  const labels: Record<string, string> = {
    credit_inquiry: "Credit Inquiry",
    report_accessed: "Report Accessed",
    dispute_update: "Dispute Update",
    score_change: "Score Change",
    data_updated: "Data Updated",
  };
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    credit_inquiry: "default",
    report_accessed: "secondary",
    dispute_update: "destructive",
    score_change: "outline",
    data_updated: "outline",
  };
  return <Badge variant={variants[type] || "default"} data-testid={`badge-alert-type-${type}`}>{labels[type] || type}</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "sent":
      return <Badge variant="default" className="bg-green-600" data-testid={`badge-status-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
    case "failed":
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    case "pending":
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "disabled":
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>Disabled</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  }
}

export default function BorrowerAlertsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recentDays, setRecentDays] = useState(0);

  const [, navigate] = useLocation();

  const { data: alerts, isLoading } = useQuery<EnrichedAlert[]>({
    queryKey: ["/api/borrower-alerts", recentDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (recentDays > 0) params.set("recentDays", String(recentDays));
      const res = await fetch(`/api/borrower-alerts?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch borrower alerts");
      return res.json();
    },
  });

  const filteredAlerts = (alerts || []).filter((alert) => {
    if (typeFilter !== "all" && alert.alertType !== typeFilter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (alert.message || "").toLowerCase().includes(q) ||
        (alert.institution || "").toLowerCase().includes(q) ||
        (alert.accessedBy || "").toLowerCase().includes(q) ||
        (alert.recipientEmail || "").toLowerCase().includes(q) ||
        (alert.recipientPhone || "").toLowerCase().includes(q) ||
        (alert.borrowerId || "").toLowerCase().includes(q) ||
        ((alert as EnrichedAlert).borrowerName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAlerts = alerts?.length || 0;
  const pendingCount = alerts?.filter(a => a.status === "pending").length || 0;
  const sentCount = alerts?.filter(a => a.status === "sent").length || 0;
  const failedCount = alerts?.filter(a => a.status === "failed").length || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-alerts-title">
            {t("borrowerAlerts.title", "Borrower Alerts")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-alerts-subtitle">
            {t("borrowerAlerts.subtitle", "Monitor credit file access notifications and alert history")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Select value={String(recentDays)} onValueChange={(v) => setRecentDays(Number(v))}>
            <SelectTrigger className="w-[160px]" data-testid="select-recent-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("common.allTime", "All Time")}</SelectItem>
              <SelectItem value="1">{t("common.last24h", "Last 24 Hours")}</SelectItem>
              <SelectItem value="7">{t("common.last7d", "Last 7 Days")}</SelectItem>
              <SelectItem value="30">{t("common.last30d", "Last 30 Days")}</SelectItem>
              <SelectItem value="90">{t("common.last90d", "Last 90 Days")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("borrowerAlerts.totalAlerts", "Total Alerts")}</p>
                <p className="text-2xl font-bold" data-testid="text-total-alerts">{totalAlerts}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("borrowerAlerts.pending", "Pending")}</p>
                <p className="text-2xl font-bold" data-testid="text-pending-alerts">{pendingCount}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("borrowerAlerts.sent", "Sent")}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-sent-alerts">{sentCount}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("borrowerAlerts.failed", "Failed")}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-failed-alerts">{failedCount}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t("borrowerAlerts.alertHistory", "Alert History")}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("borrowerAlerts.searchPlaceholder", "Search alerts...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                  data-testid="input-search-alerts"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-type-filter">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit_inquiry">Credit Inquiry</SelectItem>
                  <SelectItem value="report_accessed">Report Accessed</SelectItem>
                  <SelectItem value="dispute_update">Dispute Update</SelectItem>
                  <SelectItem value="score_change">Score Change</SelectItem>
                  <SelectItem value="data_updated">Data Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-alerts">
                {t("borrowerAlerts.noAlerts", "No alerts found")}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>{t("borrowerAlerts.type", "Type")}</TableHead>
                    <TableHead>{t("borrowerAlerts.borrower", "Borrower")}</TableHead>
                    <TableHead>{t("borrowerAlerts.institution", "Institution")}</TableHead>
                    <TableHead>{t("borrowerAlerts.accessedBy", "Accessed By")}</TableHead>
                    <TableHead>{t("borrowerAlerts.purpose", "Purpose")}</TableHead>
                    <TableHead>{t("borrowerAlerts.recipient", "Recipient")}</TableHead>
                    <TableHead>{t("borrowerAlerts.status", "Status")}</TableHead>
                    <TableHead>{t("borrowerAlerts.date", "Date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow
                      key={alert.id}
                      data-testid={`row-alert-${alert.id}`}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/consumers/${alert.borrowerId}`)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent">
                          {getAlertTypeIcon(alert.alertType)}
                        </div>
                      </TableCell>
                      <TableCell>{getAlertTypeBadge(alert.alertType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-primary hover:underline" data-testid={`link-borrower-${alert.borrowerId}`}>
                            {alert.borrowerName || alert.borrowerId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{alert.institution || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{alert.accessedBy || "—"}</TableCell>
                      <TableCell className="text-sm capitalize">{alert.purpose?.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {alert.recipientEmail && (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {alert.recipientEmail}
                            </span>
                          )}
                          {alert.recipientPhone && (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {alert.recipientPhone}
                            </span>
                          )}
                          {!alert.recipientEmail && !alert.recipientPhone && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t("borrowerAlerts.consumerProtection", "Consumer Protection Notice")}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="text-consumer-notice">
            {t("borrowerAlerts.consumerNotice", "Under consumer protection regulations, borrowers have the right to be notified when their credit file is accessed. This page tracks all access notifications generated by the system. Institutions accessing credit data must have valid consent from the borrower and a legitimate purpose for the inquiry.")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
