import { useQuery } from "@tanstack/react-query";
import { isGhanaMode } from "@/lib/country-mode";
import type { ExchangeRate } from "@shared/schema";

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.065,
  EUR: 0.060,
};

export function useGhsReferenceRates() {
  const { data: rates } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/exchange-rates"],
    enabled: isGhanaMode(),
  });

  const rateMap: Record<string, number> = { ...FALLBACK_RATES };

  if (rates) {
    for (const r of rates) {
      if (r.baseCurrency === "GHS" && (r.targetCurrency === "USD" || r.targetCurrency === "EUR")) {
        rateMap[r.targetCurrency] = parseFloat(r.rate);
      }
      if (r.targetCurrency === "GHS" && (r.baseCurrency === "USD" || r.baseCurrency === "EUR")) {
        const inv = parseFloat(r.rate);
        if (inv > 0) rateMap[r.baseCurrency] = 1 / inv;
      }
    }
  }

  return rateMap;
}

interface CurrencyReferenceProps {
  amount: number | string;
  className?: string;
}

export function CurrencyReference({ amount, className = "" }: CurrencyReferenceProps) {
  const rates = useGhsReferenceRates();

  if (!isGhanaMode()) return null;

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return null;

  const usd = num * (rates.USD || FALLBACK_RATES.USD);
  const eur = num * (rates.EUR || FALLBACK_RATES.EUR);

  const fmtUsd = usd >= 1_000_000 ? `$${(usd / 1_000_000).toFixed(1)}M` :
    usd >= 1_000 ? `$${(usd / 1_000).toFixed(0)}K` :
    `$${usd.toFixed(0)}`;

  const fmtEur = eur >= 1_000_000 ? `€${(eur / 1_000_000).toFixed(1)}M` :
    eur >= 1_000 ? `€${(eur / 1_000).toFixed(0)}K` :
    `€${eur.toFixed(0)}`;

  return (
    <span className={`text-[10px] text-muted-foreground/70 ${className}`} data-testid="text-currency-reference">
      ≈ {fmtUsd} / {fmtEur}
    </span>
  );
}

export function ReferenceRateBadge() {
  const rates = useGhsReferenceRates();

  if (!isGhanaMode()) return null;

  const usdRate = rates.USD || FALLBACK_RATES.USD;
  const eurRate = rates.EUR || FALLBACK_RATES.EUR;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/60 border border-border/40 text-[10px] text-muted-foreground"
      data-testid="badge-reference-rates"
    >
      <span className="font-medium">₵1</span>
      <span>=</span>
      <span>${(usdRate).toFixed(4)}</span>
      <span className="text-border/80">|</span>
      <span>€{(eurRate).toFixed(4)}</span>
    </div>
  );
}
