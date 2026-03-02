import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface CountryData {
  name: string;
  code: string;
  borrowers: number;
  accounts: number;
  path: string;
  labelX?: number;
  labelY?: number;
}

interface AfricaMapProps {
  countryBreakdown?: { country: string; borrowers: number; accounts: number }[];
}

const AFRICA_COUNTRIES: CountryData[] = [
  { name: "Morocco", code: "MA", borrowers: 0, accounts: 0, path: "M230,95 L260,80 L295,85 L305,100 L295,130 L260,140 L240,135 L225,115 Z" },
  { name: "Algeria", code: "DZ", borrowers: 0, accounts: 0, path: "M260,140 L295,130 L305,100 L340,95 L380,110 L395,140 L385,190 L350,210 L310,200 L275,195 L260,175 Z" },
  { name: "Tunisia", code: "TN", borrowers: 0, accounts: 0, path: "M305,100 L315,85 L330,82 L340,95 L330,110 L315,108 Z" },
  { name: "Libya", code: "LY", borrowers: 0, accounts: 0, path: "M340,95 L380,90 L430,100 L455,130 L450,175 L430,210 L395,230 L385,190 L395,140 L380,110 Z" },
  { name: "Egypt", code: "EG", borrowers: 0, accounts: 0, path: "M430,100 L460,90 L480,100 L490,130 L480,170 L465,190 L450,175 L455,130 Z" },
  { name: "Western Sahara", code: "EH", borrowers: 0, accounts: 0, path: "M210,135 L240,135 L260,140 L260,175 L240,180 L215,170 Z" },
  { name: "Mauritania", code: "MR", borrowers: 0, accounts: 0, path: "M195,175 L240,180 L260,175 L275,195 L265,230 L245,250 L215,255 L190,235 L185,200 Z" },
  { name: "Mali", code: "ML", borrowers: 0, accounts: 0, path: "M245,250 L265,230 L275,195 L310,200 L320,215 L310,245 L295,265 L265,270 L250,265 Z" },
  { name: "Niger", code: "NE", borrowers: 0, accounts: 0, path: "M310,200 L350,210 L385,190 L395,230 L400,255 L385,270 L355,275 L330,270 L310,245 L320,215 Z" },
  { name: "Chad", code: "TD", borrowers: 0, accounts: 0, path: "M395,230 L430,210 L450,235 L445,275 L430,300 L405,305 L385,290 L385,270 L400,255 Z" },
  { name: "Sudan", code: "SD", borrowers: 0, accounts: 0, path: "M450,235 L480,220 L510,240 L520,275 L505,310 L480,320 L455,310 L440,295 L430,300 L445,275 Z" },
  { name: "South Sudan", code: "SS", borrowers: 0, accounts: 0, path: "M440,295 L455,310 L480,320 L475,345 L455,355 L435,345 L420,330 L415,315 L425,305 Z" },
  { name: "Eritrea", code: "ER", borrowers: 0, accounts: 0, path: "M510,240 L530,230 L545,250 L530,270 L520,275 Z" },
  { name: "Djibouti", code: "DJ", borrowers: 0, accounts: 0, path: "M545,280 L555,275 L558,290 L548,295 Z" },
  { name: "Somalia", code: "SO", borrowers: 0, accounts: 0, path: "M545,290 L570,275 L590,310 L575,370 L545,400 L530,380 L525,350 L535,320 Z" },
  { name: "Ethiopia", code: "ET", borrowers: 0, accounts: 0, path: "M480,320 L505,310 L520,275 L530,270 L545,280 L545,290 L535,320 L525,350 L500,365 L475,355 L475,345 Z" },
  { name: "Senegal", code: "SN", borrowers: 0, accounts: 0, path: "M175,260 L195,255 L215,255 L220,270 L205,275 L185,275 Z" },
  { name: "Gambia", code: "GM", borrowers: 0, accounts: 0, path: "M178,272 L205,272 L205,278 L178,278 Z" },
  { name: "Guinea-Bissau", code: "GW", borrowers: 0, accounts: 0, path: "M175,280 L195,278 L200,290 L185,295 Z" },
  { name: "Guinea", code: "GN", borrowers: 0, accounts: 0, path: "M185,295 L200,290 L220,280 L240,285 L245,300 L230,310 L210,305 L195,300 Z" },
  { name: "Sierra Leone", code: "SL", borrowers: 0, accounts: 0, path: "M195,300 L210,305 L215,320 L200,325 L190,315 Z" },
  { name: "Liberia", code: "LR", borrowers: 0, accounts: 0, path: "M200,325 L215,320 L230,330 L225,345 L210,340 Z" },
  { name: "Ivory Coast", code: "CI", borrowers: 0, accounts: 0, path: "M230,310 L245,300 L265,300 L275,310 L270,340 L255,350 L240,345 L230,330 Z" },
  { name: "Burkina Faso", code: "BF", borrowers: 0, accounts: 0, path: "M250,265 L265,270 L295,265 L300,280 L285,295 L265,300 L245,300 L240,285 L245,270 Z" },
  { name: "Ghana", code: "GH", borrowers: 0, accounts: 0, path: "M275,310 L285,295 L300,300 L305,330 L295,345 L280,345 Z" },
  { name: "Togo", code: "TG", borrowers: 0, accounts: 0, path: "M305,330 L300,300 L310,295 L315,325 L310,340 Z" },
  { name: "Benin", code: "BJ", borrowers: 0, accounts: 0, path: "M310,295 L315,280 L330,275 L330,300 L325,330 L315,340 L315,325 Z" },
  { name: "Nigeria", code: "NG", borrowers: 0, accounts: 0, path: "M330,270 L355,275 L385,270 L385,290 L375,320 L355,340 L335,345 L325,330 L330,300 Z" },
  { name: "Cameroon", code: "CM", borrowers: 0, accounts: 0, path: "M355,340 L375,320 L385,290 L405,305 L415,315 L410,340 L395,355 L380,350 L365,350 Z" },
  { name: "Equatorial Guinea", code: "GQ", borrowers: 0, accounts: 0, path: "M355,365 L370,360 L375,370 L360,375 Z" },
  { name: "Sao Tome and Principe", code: "ST", borrowers: 0, accounts: 0, path: "M340,375 L348,372 L350,380 L342,382 Z" },
  { name: "Gabon", code: "GA", borrowers: 0, accounts: 0, path: "M360,375 L375,370 L395,370 L400,395 L385,410 L365,405 L355,390 Z" },
  { name: "Republic of the Congo", code: "CG", borrowers: 0, accounts: 0, path: "M395,355 L410,340 L420,355 L425,380 L415,405 L400,420 L385,410 L400,395 L395,370 Z" },
  { name: "Democratic Republic of the Congo", code: "CD", borrowers: 0, accounts: 0, path: "M420,330 L435,345 L455,355 L475,355 L500,365 L505,390 L495,420 L480,445 L455,455 L430,450 L415,440 L400,420 L415,405 L425,380 L420,355 Z" },
  { name: "Central African Republic", code: "CF", borrowers: 0, accounts: 0, path: "M405,305 L425,305 L440,295 L455,310 L475,320 L475,345 L455,355 L435,345 L420,330 L415,315 Z" },
  { name: "Uganda", code: "UG", borrowers: 0, accounts: 0, path: "M475,355 L500,365 L510,380 L505,395 L490,400 L478,390 L475,370 Z" },
  { name: "Kenya", code: "KE", borrowers: 0, accounts: 0, path: "M500,365 L525,350 L530,380 L535,405 L520,420 L505,415 L505,395 L510,380 Z" },
  { name: "Rwanda", code: "RW", borrowers: 0, accounts: 0, path: "M478,400 L490,400 L492,412 L480,412 Z" },
  { name: "Burundi", code: "BI", borrowers: 0, accounts: 0, path: "M480,412 L492,412 L493,425 L481,425 Z" },
  { name: "Tanzania", code: "TZ", borrowers: 0, accounts: 0, path: "M490,400 L505,395 L505,415 L520,420 L535,405 L540,430 L530,460 L505,475 L490,460 L485,435 L493,425 L492,412 Z" },
  { name: "Angola", code: "AO", borrowers: 0, accounts: 0, path: "M355,420 L385,410 L400,420 L415,440 L430,450 L430,480 L415,510 L385,520 L360,500 L350,470 L345,440 Z" },
  { name: "Zambia", code: "ZM", borrowers: 0, accounts: 0, path: "M430,450 L455,455 L480,445 L495,460 L500,490 L485,510 L460,515 L440,510 L425,500 L415,510 L430,480 Z" },
  { name: "Malawi", code: "MW", borrowers: 0, accounts: 0, path: "M500,450 L510,445 L515,470 L510,495 L500,490 L495,460 Z" },
  { name: "Mozambique", code: "MZ", borrowers: 0, accounts: 0, path: "M510,445 L530,460 L535,490 L530,520 L520,550 L505,570 L490,555 L485,530 L490,510 L500,490 L510,495 L515,470 Z" },
  { name: "Zimbabwe", code: "ZW", borrowers: 0, accounts: 0, path: "M460,515 L485,510 L500,520 L495,540 L480,550 L460,545 L450,530 Z" },
  { name: "Botswana", code: "BW", borrowers: 0, accounts: 0, path: "M420,520 L440,510 L460,515 L460,545 L450,565 L435,570 L420,555 L415,535 Z" },
  { name: "Namibia", code: "NA", borrowers: 0, accounts: 0, path: "M360,500 L385,520 L415,510 L420,520 L415,555 L400,580 L375,590 L355,570 L345,540 Z" },
  { name: "South Africa", code: "ZA", borrowers: 0, accounts: 0, path: "M375,590 L400,580 L420,570 L435,570 L450,565 L465,555 L480,560 L490,575 L485,600 L465,620 L440,635 L415,630 L395,620 L380,605 Z" },
  { name: "Lesotho", code: "LS", borrowers: 0, accounts: 0, path: "M445,600 L458,595 L462,608 L450,612 Z" },
  { name: "Eswatini", code: "SZ", borrowers: 0, accounts: 0, path: "M478,575 L488,572 L490,583 L480,585 Z" },
  { name: "Madagascar", code: "MG", borrowers: 0, accounts: 0, path: "M555,480 L570,470 L580,490 L585,530 L575,565 L560,575 L550,550 L545,510 Z" },
  { name: "Comoros", code: "KM", borrowers: 0, accounts: 0, path: "M540,458 L548,455 L550,462 L543,464 Z" },
  { name: "Mauritius", code: "MU", borrowers: 0, accounts: 0, path: "M600,530 L608,527 L610,535 L603,537 Z" },
  { name: "Seychelles", code: "SC", borrowers: 0, accounts: 0, path: "M585,405 L592,402 L594,410 L587,412 Z" },
  { name: "Cape Verde", code: "CV", borrowers: 0, accounts: 0, path: "M130,250 L140,247 L142,255 L133,257 Z" },
];

function getHeatColor(intensity: number, isDark: boolean): string {
  if (intensity === 0) {
    return isDark ? "hsl(200 15% 18%)" : "hsl(40 10% 90%)";
  }
  const tealH = 175;
  const tealS = isDark ? 45 : 55;
  const minL = isDark ? 20 : 25;
  const maxL = isDark ? 45 : 75;
  const l = maxL - (maxL - minL) * intensity;
  return `hsl(${tealH} ${tealS}% ${l}%)`;
}

function getTextColor(intensity: number, isDark: boolean): string {
  if (intensity > 0.5) return isDark ? "hsl(40 15% 95%)" : "hsl(40 20% 98%)";
  return isDark ? "hsl(40 15% 85%)" : "hsl(200 25% 15%)";
}

export function AfricaMap({ countryBreakdown = [] }: AfricaMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const isDark = useMemo(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  }, []);

  const countryDataMap = useMemo(() => {
    const map = new Map<string, { borrowers: number; accounts: number }>();
    for (const item of countryBreakdown) {
      map.set(item.country, { borrowers: item.borrowers, accounts: item.accounts });
    }
    return map;
  }, [countryBreakdown]);

  const maxBorrowers = useMemo(() => {
    if (countryBreakdown.length === 0) return 1;
    return Math.max(...countryBreakdown.map(c => c.borrowers), 1);
  }, [countryBreakdown]);

  const countriesWithData = useMemo(() => {
    return AFRICA_COUNTRIES.map(country => {
      const data = countryDataMap.get(country.code) || countryDataMap.get(country.name) || { borrowers: 0, accounts: 0 };
      return { ...country, borrowers: data.borrowers, accounts: data.accounts };
    });
  }, [countryDataMap]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const hoveredData = useMemo(() => {
    if (!hoveredCountry) return null;
    return countriesWithData.find(c => c.code === hoveredCountry);
  }, [hoveredCountry, countriesWithData]);

  const legendLevels = [
    { label: "No data", intensity: 0 },
    { label: "Low", intensity: 0.2 },
    { label: "Medium", intensity: 0.5 },
    { label: "High", intensity: 0.8 },
    { label: "Very High", intensity: 1 },
  ];

  return (
    <Card data-testid="card-africa-map">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Geographic Coverage</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {legendLevels.map((level) => (
            <div key={level.label} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm border border-border/30"
                style={{ backgroundColor: getHeatColor(level.intensity, isDark) }}
              />
              <span className="text-[10px] text-muted-foreground">{level.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative pb-4">
        <div
          className="relative w-full"
          onMouseMove={handleMouseMove}
          data-testid="map-africa-container"
        >
          <svg
            viewBox="100 60 530 600"
            className="w-full h-auto"
            style={{ maxHeight: "500px" }}
          >
            <defs>
              <filter id="country-shadow" x="-2%" y="-2%" width="104%" height="104%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
              </filter>
            </defs>
            {countriesWithData.map((country) => {
              const intensity = country.borrowers > 0
                ? Math.min(country.borrowers / maxBorrowers, 1)
                : 0;
              const isHovered = hoveredCountry === country.code;
              return (
                <path
                  key={country.code}
                  d={country.path}
                  fill={getHeatColor(intensity, isDark)}
                  stroke={isHovered
                    ? (isDark ? "hsl(43 75% 55%)" : "hsl(43 80% 50%)")
                    : (isDark ? "hsl(200 15% 25%)" : "hsl(40 10% 80%)")}
                  strokeWidth={isHovered ? 2 : 0.5}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? "url(#country-shadow)" : undefined,
                    transform: isHovered ? "scale(1.01)" : undefined,
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredCountry(country.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  data-testid={`map-country-${country.code}`}
                />
              );
            })}
          </svg>

          {hoveredData && (
            <div
              className="absolute pointer-events-none z-50 bg-popover text-popover-foreground border border-border rounded-md px-3 py-2 text-xs"
              style={{
                left: Math.min(tooltipPos.x + 12, 280),
                top: tooltipPos.y - 10,
                boxShadow: "var(--shadow-md)",
              }}
              data-testid="tooltip-country"
            >
              <p className="font-semibold text-sm mb-1">{hoveredData.name}</p>
              <div className="space-y-0.5 text-muted-foreground">
                <p>Borrowers: <span className="font-medium text-foreground">{hoveredData.borrowers.toLocaleString()}</span></p>
                <p>Accounts: <span className="font-medium text-foreground">{hoveredData.accounts.toLocaleString()}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>
            {countryBreakdown.length > 0
              ? `Active in ${countryBreakdown.filter(c => c.borrowers > 0).length} countries`
              : "No geographic data available"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
