import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, CreditCard, TrendingUp } from "lucide-react";

interface AfricaMapProps {
  countryBreakdown?: { country: string; borrowers: number; accounts: number }[];
}

interface RegionDef {
  name: string;
  emoji: string;
  countries: string[];
}

const REGIONS: RegionDef[] = [
  {
    name: "East Africa",
    emoji: "🌍",
    countries: [
      "Ethiopia", "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi",
      "South Sudan", "Eritrea", "Djibouti", "Somalia", "Comoros",
      "Madagascar", "Mauritius", "Seychelles",
    ],
  },
  {
    name: "West Africa",
    emoji: "🌍",
    countries: [
      "Nigeria", "Ghana", "Senegal", "Ivory Coast", "Mali", "Burkina Faso",
      "Niger", "Guinea", "Sierra Leone", "Liberia", "Togo", "Benin",
      "Gambia", "Guinea-Bissau", "Cape Verde", "Mauritania",
    ],
  },
  {
    name: "North Africa",
    emoji: "🏛️",
    countries: [
      "Egypt", "Algeria", "Morocco", "Tunisia", "Libya", "Sudan",
      "Western Sahara",
    ],
  },
  {
    name: "Central Africa",
    emoji: "🌿",
    countries: [
      "Democratic Republic of the Congo", "Cameroon", "Chad",
      "Central African Republic", "Republic of the Congo", "Gabon",
      "Equatorial Guinea", "Sao Tome and Principe",
    ],
  },
  {
    name: "Southern Africa",
    emoji: "🌄",
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

export function AfricaMap({ countryBreakdown = [] }: AfricaMapProps) {
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
                        ? "linear-gradient(90deg, hsl(175 55% 35%), hsl(175 55% 28%))"
                        : pct > 0.3
                        ? "linear-gradient(90deg, hsl(175 45% 45%), hsl(175 50% 35%))"
                        : pct > 0
                        ? "hsl(175 40% 55%)"
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
