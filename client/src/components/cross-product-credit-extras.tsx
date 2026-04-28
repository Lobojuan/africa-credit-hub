import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Shield, Link2 } from "lucide-react";
import { Link } from "wouter";

interface Props {
  borrowerId: string;
}

export function CrossProductCreditExtras({ borrowerId }: Props) {
  const { t } = useTranslation();

  const { data: vatProfile } = useQuery<any>({
    queryKey: ["/api/cross-product/borrower-merchant-credit-profile", borrowerId],
    enabled: !!borrowerId,
    retry: false,
  });

  const { data: collateral } = useQuery<any>({
    queryKey: ["/api/cross-product/collateral-snapshot", borrowerId],
    enabled: !!borrowerId,
    retry: false,
  });

  const hasVat = !!vatProfile?.features;
  const hasCollateral = !!collateral?.registrations?.length;

  if (!hasVat && !hasCollateral) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 print:hidden" data-testid="cross-product-credit-extras">
      {hasVat && (
        <Card className="border-primary/30" data-testid="card-vat-activity">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                {t("vatActivity.score")}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                {t("bridge.badge")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" data-testid="text-vat-score">
                {vatProfile.features.vatActivityScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 850</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {vatProfile.features.totalReceipts} {t("loto.receipts.count")} ·{" "}
              {vatProfile.features.monthsWithActivity} {t("merchantCredit.monthsActive")}
            </div>
            {vatProfile.merchant?.id && (
              <Link
                href={`/merchant-credit-profile/${vatProfile.merchant.id}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                data-testid="link-merchant-profile"
              >
                <Link2 className="w-3 h-3" />
                {t("merchantCredit.title")}
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {hasCollateral && (
        <Card className="border-primary/30" data-testid="card-collateral-on-file">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Collateral on file
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {t("bridge.badge")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold" data-testid="text-collateral-count">
              {collateral.registrations.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Active registrations across {new Set(collateral.registrations.map((r: any) => r.assetType)).size} asset types
            </div>
            <Link
              href="/collateral-registry"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              data-testid="link-collateral-registry"
            >
              <Link2 className="w-3 h-3" />
              View collateral registry
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
