import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Gavel, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import type { CourtJudgment } from "@shared/schema";

function getStatusVariant(status: string) {
  switch (status) {
    case "active": return "destructive" as const;
    case "satisfied": return "default" as const;
    case "vacated": return "secondary" as const;
    case "appealed": return "outline" as const;
    default: return "outline" as const;
  }
}

export default function CourtJudgmentsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [recentDays, setRecentDays] = useState(0);

  const { data: judgments, isLoading } = useQuery<CourtJudgment[]>({
    queryKey: ["/api/court-judgments", recentDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (recentDays > 0) params.set("recentDays", String(recentDays));
      const res = await fetch(`/api/court-judgments${params.toString() ? `?${params}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch court judgments");
      return res.json();
    },
  });

  const activeCount = judgments?.filter(j => j.status === "active").length ?? 0;
  const totalAmount = judgments?.reduce((sum, j) => sum + parseFloat(j.amount || "0"), 0) ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-judgments-title">
              {t("courtJudgments.title", "Court Judgments")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">
            {t("courtJudgments.subtitle", "Registry of court judgments and legal actions across all borrowers")}
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
              <Gavel className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-judgments">{judgments?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{t("courtJudgments.totalRecords", "Total Judgments")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-active-judgments">{activeCount}</p>
              <p className="text-xs text-muted-foreground">{t("courtJudgments.activeJudgments", "Active Judgments")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-amount">
                {judgments ? formatCurrency(totalAmount.toString(), judgments[0]?.currency || judgments[0]?.judgmentCurrency || "GHS") : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{t("courtJudgments.totalAmount", "Total Amount")}</p>
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
          ) : judgments && judgments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("courtJudgments.caseNumber", "Case #")}</TableHead>
                    <TableHead>{t("courtJudgments.court", "Court")}</TableHead>
                    <TableHead>{t("courtJudgments.type", "Type")}</TableHead>
                    <TableHead>{t("courtJudgments.judgmentDate", "Judgment Date")}</TableHead>
                    <TableHead className="text-right">{t("courtJudgments.amount", "Amount")}</TableHead>
                    <TableHead>{t("courtJudgments.status", "Status")}</TableHead>
                    <TableHead>{t("courtJudgments.dateAdded", "Date Added")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judgments.map((judgment) => (
                    <TableRow
                      key={judgment.id}
                      data-testid={`row-judgment-${judgment.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/borrowers/${judgment.borrowerId}`)}
                    >
                      <TableCell className="font-medium text-sm">{judgment.caseNumber}</TableCell>
                      <TableCell className="text-sm">{judgment.court}</TableCell>
                      <TableCell className="text-sm capitalize">{judgment.judgmentType?.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell className="text-sm">{judgment.judgmentDate || "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency((judgment.amount || 0), judgment.currency || judgment.judgmentCurrency || "GHS")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(judgment.status)} className="text-[10px] capitalize">
                          {judgment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {judgment.createdAt ? new Date(judgment.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Gavel className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No Court Judgments</h3>
              <p className="text-sm text-muted-foreground max-w-xs" data-testid="text-no-judgments">
                {t("courtJudgments.noRecords", "No court judgment records have been registered yet.")}
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
