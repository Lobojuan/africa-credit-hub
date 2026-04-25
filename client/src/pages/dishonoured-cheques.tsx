import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Ban, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import type { DishonouredCheque } from "@shared/schema";

export default function DishonouredChequesPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [recentDays, setRecentDays] = useState(0);

  const { data: cheques, isLoading } = useQuery<DishonouredCheque[]>({
    queryKey: ["/api/dishonoured-cheques", recentDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (recentDays > 0) params.set("recentDays", String(recentDays));
      const res = await fetch(`/api/dishonoured-cheques${params.toString() ? `?${params}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dishonoured cheques");
      return res.json();
    },
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-cheques-title">
              {t("dishonouredCheques.title", "Dishonoured Cheques")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t("dishonouredCheques.subtitle", "Registry of bounced and returned cheques across all borrowers")}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Ban className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-cheques">{cheques?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{t("dishonouredCheques.totalRecords", "Total Records")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Ban className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-amount">
                {cheques ? formatCurrency(
                  cheques.reduce((sum, c) => sum + parseFloat(c.chequeAmount || "0"), 0).toString(),
                  cheques[0]?.currency || "GHS"
                ) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{t("dishonouredCheques.totalAmount", "Total Amount")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Ban className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-unique-borrowers">
                {cheques ? new Set(cheques.map(c => c.borrowerId)).size : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{t("dishonouredCheques.uniqueBorrowers", "Unique Borrowers")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : cheques && cheques.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dishonouredCheques.chequeNumber", "Cheque #")}</TableHead>
                    <TableHead>{t("dishonouredCheques.accountNumber", "Account #")}</TableHead>
                    <TableHead>{t("dishonouredCheques.dateIssued", "Date Issued")}</TableHead>
                    <TableHead>{t("dishonouredCheques.dateBounced", "Date Bounced")}</TableHead>
                    <TableHead className="text-right">{t("dishonouredCheques.amount", "Amount")}</TableHead>
                    <TableHead>{t("dishonouredCheques.reason", "Reason")}</TableHead>
                    <TableHead>{t("dishonouredCheques.dateAdded", "Date Added")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheques.map((cheque) => (
                    <TableRow
                      key={cheque.id}
                      data-testid={`row-cheque-${cheque.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/borrowers/${cheque.borrowerId}`)}
                    >
                      <TableCell className="font-medium text-sm">{cheque.chequeNumber}</TableCell>
                      <TableCell className="text-sm">{cheque.accountNumber}</TableCell>
                      <TableCell className="text-sm">{cheque.dateIssued || "—"}</TableCell>
                      <TableCell className="text-sm">{cheque.dateBounced || "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(cheque.chequeAmount, cheque.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-[10px]">
                          {cheque.reasonReturnedCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cheque.createdAt ? new Date(cheque.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Ban className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No Dishonoured Cheques</h3>
              <p className="text-sm text-muted-foreground max-w-xs" data-testid="text-no-cheques">
                {t("dishonouredCheques.noRecords", "No dishonoured cheque records have been registered yet.")}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate("/borrowers")}
                data-testid="button-empty-go-borrowers">
                View Borrowers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
