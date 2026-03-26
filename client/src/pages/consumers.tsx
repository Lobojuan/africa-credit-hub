import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Search, User, ChevronRight, ChevronLeft, Flag, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Borrower } from "@shared/schema";
import { getBorrowerAvatarUrl } from "@/lib/avatar";
import { ConsumerKPIBanner } from "@/components/platform-kpi-banner";

const PAGE_SIZE = 50;

export default function ConsumersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();

  const { data: paginatedResult, isLoading } = useQuery<{ data: Borrower[]; total: number } | Borrower[]>({
    queryKey: search
      ? [`/api/consumers?search=${encodeURIComponent(search)}`]
      : [`/api/consumers?page=${page}&limit=${PAGE_SIZE}`],
  });

  const consumers = Array.isArray(paginatedResult) ? paginatedResult : paginatedResult?.data;
  const totalConsumers = Array.isArray(paginatedResult) ? paginatedResult.length : paginatedResult?.total ?? 0;
  const totalPages = Math.ceil(totalConsumers / PAGE_SIZE);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto animate-page-enter">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="page-header-bar" />
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-consumers-title">Consumers (B2C)</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-4">Individual borrowers — personal loans, mortgages, and retail credit</p>
        </div>
      </div>

      <ConsumerKPIBanner />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-search-consumers"
          placeholder="Search by name, ID, employer..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : consumers && consumers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consumers.map((consumer) => (
            <Card
              key={consumer.id}
              className="cursor-pointer hover-elevate"
              onClick={() => navigate(`/consumers/${consumer.id}`)}
              data-testid={`card-consumer-${consumer.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={(consumer as any).photoUrl || getBorrowerAvatarUrl(consumer.id, `${consumer.firstName} ${consumer.lastName}`, "individual")}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                      data-testid={`img-avatar-${consumer.id}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" data-testid={`text-name-${consumer.id}`}>
                        {consumer.firstName} {consumer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-id-${consumer.id}`}>{consumer.nationalId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {consumer.employerName && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      <span className="truncate" data-testid={`text-employer-${consumer.id}`}>{consumer.employerName}</span>
                    </div>
                  )}
                  {consumer.occupation && (
                    <div className="text-muted-foreground truncate" data-testid={`text-occupation-${consumer.id}`}>{consumer.occupation}</div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {consumer.isPep && <Badge variant="destructive" className="text-[10px]"><Flag className="w-3 h-3 mr-1" />PEP</Badge>}
                  {consumer.country && <Badge variant="outline" className="text-[10px]" data-testid={`badge-country-${consumer.id}`}>{consumer.country}</Badge>}
                  {consumer.city && <Badge variant="outline" className="text-[10px]">{consumer.city}{consumer.region ? `, ${consumer.region}` : ""}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold" data-testid="text-no-consumers">No consumers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "No consumers match your search criteria." : "Individual borrowers will appear here."}
            </p>
          </CardContent>
        </Card>
      )}

      {!search && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2" data-testid="pagination-controls">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalConsumers)} of {totalConsumers.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("common.previous")}
            </Button>
            <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
              {t("common.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
