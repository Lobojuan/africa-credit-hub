import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, CreditCard, TrendingUp, MapPin, Building2, ShieldCheck, AlertTriangle } from "lucide-react";
import { isGhanaMode, getCountryConfig, GHANA_MARKET_STATS } from "@/lib/country-mode";
import { useBrandColors } from "@/hooks/use-brand-colors";

interface AfricaMapProps {
  countryBreakdown?: { country: string; borrowers: number; accounts: number }[];
}

interface RegionDef {
  name: string;
  countries: string[];
}

const REGIONS: RegionDef[] = [
  {
    name: "East Africa",
    countries: [
      "Ethiopia", "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi",
      "South Sudan", "Eritrea", "Djibouti", "Somalia", "Comoros",
      "Madagascar", "Mauritius", "Seychelles",
    ],
  },
  {
    name: "West Africa",
    countries: [
      "Nigeria", "Ghana", "Senegal", "Ivory Coast", "Mali", "Burkina Faso",
      "Niger", "Guinea", "Sierra Leone", "Liberia", "Togo", "Benin",
      "Gambia", "Guinea-Bissau", "Cape Verde", "Mauritania",
    ],
  },
  {
    name: "North Africa",
    countries: [
      "Egypt", "Algeria", "Morocco", "Tunisia", "Libya", "Sudan",
      "Western Sahara",
    ],
  },
  {
    name: "Central Africa",
    countries: [
      "Democratic Republic of the Congo", "Cameroon", "Chad",
      "Central African Republic", "Republic of the Congo", "Gabon",
      "Equatorial Guinea", "Sao Tome and Principe",
    ],
  },
  {
    name: "Southern Africa",
    countries: [
      "South Africa", "Angola", "Mozambique", "Zambia", "Zimbabwe",
      "Botswana", "Namibia", "Malawi", "Eswatini", "Lesotho",
    ],
  },
];

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function GhanaMarketOverview({ countryBreakdown }: { countryBreakdown: AfricaMapProps["countryBreakdown"] }) {
  const brandColors = useBrandColors();
  const ghanaConfig = getCountryConfig()!;
  const ms = GHANA_MARKET_STATS;

  const totalBorrowers = useMemo(() => {
    return countryBreakdown?.reduce((sum, c) => sum + c.borrowers, 0) || 0;
  }, [countryBreakdown]);

  const totalAccounts = useMemo(() => {
    return countryBreakdown?.reduce((sum, c) => sum + c.accounts, 0) || 0;
  }, [countryBreakdown]);

  const regionData = useMemo(() => {
    const weights = [18, 15, 8, 7, 9, 6, 5, 4, 3, 4, 3, 2, 3, 2, 2, 2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return ghanaConfig.regions.map((region, idx) => {
      const weight = weights[idx] || 3;
      const borrowerCount = totalBorrowers > 0
        ? Math.round((totalBorrowers * weight) / totalWeight)
        : 0;
      return {
        name: region,
        borrowers: borrowerCount,
        isCapital: idx === 0,
      };
    });
  }, [ghanaConfig.regions, totalBorrowers]);

  const maxRegBorrowers = Math.max(...regionData.map(r => r.borrowers), 1);

  return (
    <Card data-testid="card-ghana-market-overview" className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColors.accent} 0%, ${brandColors.secondary} 100%)` }}>
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Ghana Credit Market</h3>
              <p className="text-[10px] text-muted-foreground">Bank of Ghana CRB Standards {ms.crbVersion}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] font-medium">
              {ghanaConfig.regions.length} Regions
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center">
            <Users className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold leading-tight">{formatNum(ms.activeBorrowers)}</p>
            <p className="text-[9px] text-muted-foreground">National Borrowers</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center">
            <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold leading-tight">{ms.licensedInstitutions}</p>
            <p className="text-[9px] text-muted-foreground">Institutions</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center">
            <AlertTriangle className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold leading-tight text-amber-600 dark:text-amber-400">{ms.nationalDefaultRate}%</p>
            <p className="text-[9px] text-muted-foreground">Default Rate</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center">
            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold leading-tight">{formatNum(ms.bureauScoredAdults)}</p>
            <p className="text-[9px] text-muted-foreground">Adults Scored</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regional Coverage</p>
            <p className="text-[10px] text-muted-foreground">
              {formatNum(totalBorrowers)} registered | {formatNum(totalAccounts)} accounts
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {regionData.map((region) => (
              <div
                key={region.name}
                className="rounded-md border border-border/40 bg-card p-2 hover:border-primary/30 transition-colors"
                data-testid={`ghana-region-${region.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold truncate">{region.name}</span>
                  {region.isCapital && (
                    <Badge variant="default" className="text-[7px] px-1 py-0 h-3 shrink-0">Capital</Badge>
                  )}
                </div>
                <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (region.borrowers / maxRegBorrowers) * 100)}%`,
                      background: `linear-gradient(90deg, ${brandColors.accentLight}, ${brandColors.accent})`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                  <Users className="w-2 h-2" />
                  <span className="font-medium text-foreground">{formatNum(region.borrowers)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[9px] text-muted-foreground">
            {ms.creditReportingAct}
          </p>
          <p className="text-[9px] text-muted-foreground">|</p>
          <p className="text-[9px] text-muted-foreground">
            Bureaus: {ms.licensedBureaus.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AfricaMap({ countryBreakdown = [] }: AfricaMapProps) {
  const brandColors = useBrandColors();
  const countryMap = useMemo(() => {
    const m = new Map<string, { borrowers: number; accounts: number }>();
    for (const c of countryBreakdown) {
      m.set(c.country, { borrowers: c.borrowers, accounts: c.accounts });
    }
    return m;
  }, [countryBreakdown]);

  const regionStats = useMemo(() => {
    return REGIONS.map((region) => {
      let totalBorrowers = 0;
      let totalAccounts = 0;
      let activeCountries = 0;
      const countryDetails: { name: string; borrowers: number; accounts: number }[] = [];

      for (const name of region.countries) {
        const data = countryMap.get(name) || { borrowers: 0, accounts: 0 };
        totalBorrowers += data.borrowers;
        totalAccounts += data.accounts;
        if (data.borrowers > 0) activeCountries++;
        countryDetails.push({ name, ...data });
      }
      countryDetails.sort((a, b) => b.borrowers - a.borrowers);

      return {
        ...region,
        totalBorrowers,
        totalAccounts,
        activeCountries,
        totalCountries: region.countries.length,
        countryDetails,
      };
    });
  }, [countryMap]);

  const grandTotal = useMemo(() => {
    return regionStats.reduce(
      (acc, r) => ({
        borrowers: acc.borrowers + r.totalBorrowers,
        accounts: acc.accounts + r.totalAccounts,
        active: acc.active + r.activeCountries,
      }),
      { borrowers: 0, accounts: 0, active: 0 }
    );
  }, [regionStats]);

  const maxBorrowers = useMemo(
    () => Math.max(...regionStats.map((r) => r.totalBorrowers), 1),
    [regionStats]
  );

  if (isGhanaMode()) {
    return <GhanaMarketOverview countryBreakdown={countryBreakdown} />;
  }

  return (
    <Card data-testid="card-africa-map">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Geographic Coverage</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{grandTotal.active}</span> / 54 countries active
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-semibold text-foreground">{formatNum(grandTotal.borrowers)}</span> borrowers
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span className="font-semibold text-foreground">{formatNum(grandTotal.accounts)}</span> accounts
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4" data-testid="map-africa-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {regionStats.map((region) => {
            const pct = region.totalBorrowers / maxBorrowers;
            return (
              <div
                key={region.name}
                className="group relative rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                data-testid={`region-${region.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold truncate">{region.name}</span>
                  <Badge
                    variant={region.activeCountries > 0 ? "default" : "secondary"}
                    className="text-[9px] px-1.5 py-0 h-4 shrink-0"
                  >
                    {region.activeCountries}/{region.totalCountries}
                  </Badge>
                </div>

                <div className="w-full h-1.5 rounded-full bg-muted mb-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(pct * 100, region.activeCountries > 0 ? 8 : 0)}%`,
                      background: pct > 0.6
                        ? `linear-gradient(90deg, ${brandColors.accentLight}, ${brandColors.accent})`
                        : pct > 0.3
                        ? `linear-gradient(90deg, ${brandColors.secondaryLight}, ${brandColors.accentLight})`
                        : pct > 0
                        ? brandColors.secondaryLight
                        : "transparent",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-2.5 h-2.5" />
                    <span className="font-medium text-foreground">{formatNum(region.totalBorrowers)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="w-2.5 h-2.5" />
                    <span className="font-medium text-foreground">{formatNum(region.totalAccounts)}</span>
                  </div>
                </div>

                {region.countryDetails.some((c) => c.borrowers > 0) && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                    {region.countryDetails
                      .filter((c) => c.borrowers > 0)
                      .slice(0, 4)
                      .map((c) => (
                        <div
                          key={c.name}
                          className="flex items-center justify-between text-[10px]"
                          data-testid={`country-row-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <span className="text-muted-foreground truncate mr-1">{c.name}</span>
                          <span className="font-medium tabular-nums shrink-0 flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5 text-primary/60" />
                            {formatNum(c.borrowers)}
                          </span>
                        </div>
                      ))}
                    {region.countryDetails.filter((c) => c.borrowers > 0).length > 4 && (
                      <p className="text-[9px] text-muted-foreground text-center pt-0.5">
                        +{region.countryDetails.filter((c) => c.borrowers > 0).length - 4} more
                      </p>
                    )}
                  </div>
                )}

                {region.activeCountries === 0 && (
                  <p className="mt-2 text-[9px] text-muted-foreground/60 text-center italic">
                    No active records
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
