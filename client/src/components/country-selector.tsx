import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCountryTheme } from "@/components/country-theme-provider";
import { getSupportedCountries } from "@/lib/country-mode";
import { Globe, ChevronDown, Check, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function CountryDot({ code }: { code: string }) {
  return <span className="text-sm leading-none shrink-0" role="img" aria-label={code}>{countryCodeToFlag(code)}</span>;
}

export function CountrySelector() {
  const { user } = useAuth();
  const { activeCountry, activeConfig, isGlobalView, setCountry, isSwitching } = useCountryTheme();
  const [open, setOpen] = useState(false);

  if (user?.role !== "super_admin") return null;

  const countries = getSupportedCountries();
  const displayLabel = isGlobalView ? "Global View" : (activeConfig?.name || activeCountry || "Select Country");

  const handleSelect = async (countryName: string | null) => {
    setOpen(false);
    await setCountry(countryName);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs max-w-[180px]"
          disabled={isSwitching}
          data-testid="button-country-selector"
        >
          {isSwitching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : isGlobalView ? (
            <Globe className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CountryDot code={activeConfig?.code || ""} />
          )}
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Country View</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Select a country to filter all data</p>
        </div>
        <Separator />
        <div className="max-h-[360px] overflow-y-auto">
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-colors ${isGlobalView ? "bg-accent/50" : ""}`}
            data-testid="menu-item-global-view"
          >
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Global View</span>
              <p className="text-[10px] text-muted-foreground">All countries</p>
            </div>
            {isGlobalView && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </button>
          <Separator />
          {countries.map((c) => {
            const isSelected = activeCountry === c.name;
            return (
              <button
                key={c.code}
                onClick={() => handleSelect(c.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-colors ${isSelected ? "bg-accent/50" : ""}`}
                data-testid={`menu-item-country-${c.code}`}
              >
                <CountryDot code={c.code} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.regulatoryBody} | {c.currency}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
