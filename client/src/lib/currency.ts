export interface CountryInfo {
  code: string;
  name: string;
  nameFr: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "GH", name: "Ghana", nameFr: "Ghana" },
  { code: "ET", name: "Ethiopia", nameFr: "Éthiopie" },
  { code: "UG", name: "Uganda", nameFr: "Ouganda" },
  { code: "LR", name: "Liberia", nameFr: "Libéria" },
];

export interface CurrencyInfo {
  code: string;
  name: string;
  nameFr: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "ETB", name: "Ethiopian Birr", nameFr: "Birr éthiopien", symbol: "Br" },
  { code: "KES", name: "Kenyan Shilling", nameFr: "Shilling kényan", symbol: "KSh" },
  { code: "NGN", name: "Nigerian Naira", nameFr: "Naira nigérian", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", nameFr: "Rand sud-africain", symbol: "R" },
  { code: "GHS", name: "Ghanaian Cedi", nameFr: "Cédi ghanéen", symbol: "₵" },
  { code: "TZS", name: "Tanzanian Shilling", nameFr: "Shilling tanzanien", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", nameFr: "Shilling ougandais", symbol: "USh" },
  { code: "RWF", name: "Rwandan Franc", nameFr: "Franc rwandais", symbol: "FRw" },
  { code: "XOF", name: "West African CFA Franc", nameFr: "Franc CFA (BCEAO)", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc", nameFr: "Franc CFA (BEAC)", symbol: "FCFA" },
  { code: "EGP", name: "Egyptian Pound", nameFr: "Livre égyptienne", symbol: "E£" },
  { code: "MAD", name: "Moroccan Dirham", nameFr: "Dirham marocain", symbol: "MAD" },
  { code: "BWP", name: "Botswana Pula", nameFr: "Pula du Botswana", symbol: "P" },
  { code: "MZN", name: "Mozambican Metical", nameFr: "Metical mozambicain", symbol: "MT" },
  { code: "LRD", name: "Liberian Dollar", nameFr: "Dollar libérien", symbol: "L$" },
  { code: "USD", name: "US Dollar", nameFr: "Dollar américain", symbol: "$" },
  { code: "EUR", name: "Euro", nameFr: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", nameFr: "Livre sterling", symbol: "£" },
];

const currencyLocaleMap: Record<string, string> = {
  ETB: "en-ET", KES: "en-KE", NGN: "en-NG", ZAR: "en-ZA",
  GHS: "en-GH", TZS: "en-TZ", UGX: "en-UG", RWF: "rw-RW",
  XOF: "fr-SN", XAF: "fr-CM", EGP: "ar-EG", MAD: "fr-MA",
  BWP: "en-BW", MZN: "pt-MZ", LRD: "en-LR", USD: "en-US", EUR: "fr-FR", GBP: "en-GB",
};

export function formatCurrency(
  value: string | number,
  currencyCode = "ETB",
  options?: { compact?: boolean }
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${currencyCode} 0.00`;

  if (options?.compact) {
    if (num >= 1_000_000_000) return `${currencyCode} ${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${currencyCode} ${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${currencyCode} ${(num / 1_000).toFixed(0)}K`;
    return `${currencyCode} ${num.toFixed(0)}`;
  }

  const locale = currencyLocaleMap[currencyCode] || "en-US";
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return `${currencyCode} ${formatted}`;
  } catch {
    return `${currencyCode} ${num.toFixed(2)}`;
  }
}

export function formatCurrencyValue(
  value: string | number,
  currencyCode = "ETB"
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  const locale = currencyLocaleMap[currencyCode] || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toFixed(2);
  }
}
