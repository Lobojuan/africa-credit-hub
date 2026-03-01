export interface CountryInfo {
  code: string;
  name: string;
  nameFr: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "DZ", name: "Algeria", nameFr: "Algérie" },
  { code: "AO", name: "Angola", nameFr: "Angola" },
  { code: "BJ", name: "Benin", nameFr: "Bénin" },
  { code: "BW", name: "Botswana", nameFr: "Botswana" },
  { code: "BF", name: "Burkina Faso", nameFr: "Burkina Faso" },
  { code: "BI", name: "Burundi", nameFr: "Burundi" },
  { code: "CV", name: "Cabo Verde", nameFr: "Cap-Vert" },
  { code: "CM", name: "Cameroon", nameFr: "Cameroun" },
  { code: "CF", name: "Central African Republic", nameFr: "République centrafricaine" },
  { code: "TD", name: "Chad", nameFr: "Tchad" },
  { code: "KM", name: "Comoros", nameFr: "Comores" },
  { code: "CG", name: "Congo", nameFr: "Congo" },
  { code: "CD", name: "DR Congo", nameFr: "RD Congo" },
  { code: "CI", name: "Côte d'Ivoire", nameFr: "Côte d'Ivoire" },
  { code: "DJ", name: "Djibouti", nameFr: "Djibouti" },
  { code: "EG", name: "Egypt", nameFr: "Égypte" },
  { code: "GQ", name: "Equatorial Guinea", nameFr: "Guinée équatoriale" },
  { code: "ER", name: "Eritrea", nameFr: "Érythrée" },
  { code: "SZ", name: "Eswatini", nameFr: "Eswatini" },
  { code: "ET", name: "Ethiopia", nameFr: "Éthiopie" },
  { code: "GA", name: "Gabon", nameFr: "Gabon" },
  { code: "GM", name: "Gambia", nameFr: "Gambie" },
  { code: "GH", name: "Ghana", nameFr: "Ghana" },
  { code: "GN", name: "Guinea", nameFr: "Guinée" },
  { code: "GW", name: "Guinea-Bissau", nameFr: "Guinée-Bissau" },
  { code: "KE", name: "Kenya", nameFr: "Kenya" },
  { code: "LS", name: "Lesotho", nameFr: "Lesotho" },
  { code: "LR", name: "Liberia", nameFr: "Libéria" },
  { code: "LY", name: "Libya", nameFr: "Libye" },
  { code: "MG", name: "Madagascar", nameFr: "Madagascar" },
  { code: "MW", name: "Malawi", nameFr: "Malawi" },
  { code: "ML", name: "Mali", nameFr: "Mali" },
  { code: "MR", name: "Mauritania", nameFr: "Mauritanie" },
  { code: "MU", name: "Mauritius", nameFr: "Maurice" },
  { code: "MA", name: "Morocco", nameFr: "Maroc" },
  { code: "MZ", name: "Mozambique", nameFr: "Mozambique" },
  { code: "NA", name: "Namibia", nameFr: "Namibie" },
  { code: "NE", name: "Niger", nameFr: "Niger" },
  { code: "NG", name: "Nigeria", nameFr: "Nigéria" },
  { code: "RW", name: "Rwanda", nameFr: "Rwanda" },
  { code: "ST", name: "São Tomé and Príncipe", nameFr: "São Tomé-et-Príncipe" },
  { code: "SN", name: "Senegal", nameFr: "Sénégal" },
  { code: "SC", name: "Seychelles", nameFr: "Seychelles" },
  { code: "SL", name: "Sierra Leone", nameFr: "Sierra Leone" },
  { code: "SO", name: "Somalia", nameFr: "Somalie" },
  { code: "ZA", name: "South Africa", nameFr: "Afrique du Sud" },
  { code: "SS", name: "South Sudan", nameFr: "Soudan du Sud" },
  { code: "SD", name: "Sudan", nameFr: "Soudan" },
  { code: "TZ", name: "Tanzania", nameFr: "Tanzanie" },
  { code: "TG", name: "Togo", nameFr: "Togo" },
  { code: "TN", name: "Tunisia", nameFr: "Tunisie" },
  { code: "UG", name: "Uganda", nameFr: "Ouganda" },
  { code: "ZM", name: "Zambia", nameFr: "Zambie" },
  { code: "ZW", name: "Zimbabwe", nameFr: "Zimbabwe" },
];

export interface CurrencyInfo {
  code: string;
  name: string;
  nameFr: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "DZD", name: "Algerian Dinar", nameFr: "Dinar algérien", symbol: "د.ج" },
  { code: "AOA", name: "Angolan Kwanza", nameFr: "Kwanza angolais", symbol: "Kz" },
  { code: "BWP", name: "Botswana Pula", nameFr: "Pula du Botswana", symbol: "P" },
  { code: "BIF", name: "Burundian Franc", nameFr: "Franc burundais", symbol: "FBu" },
  { code: "CVE", name: "Cape Verdean Escudo", nameFr: "Escudo cap-verdien", symbol: "Esc" },
  { code: "XAF", name: "Central African CFA Franc", nameFr: "Franc CFA (BEAC)", symbol: "FCFA" },
  { code: "KMF", name: "Comorian Franc", nameFr: "Franc comorien", symbol: "CF" },
  { code: "CDF", name: "Congolese Franc", nameFr: "Franc congolais", symbol: "FC" },
  { code: "DJF", name: "Djiboutian Franc", nameFr: "Franc djiboutien", symbol: "Fdj" },
  { code: "EGP", name: "Egyptian Pound", nameFr: "Livre égyptienne", symbol: "E£" },
  { code: "ERN", name: "Eritrean Nakfa", nameFr: "Nakfa érythréen", symbol: "Nfk" },
  { code: "ETB", name: "Ethiopian Birr", nameFr: "Birr éthiopien", symbol: "Br" },
  { code: "GMD", name: "Gambian Dalasi", nameFr: "Dalasi gambien", symbol: "D" },
  { code: "GHS", name: "Ghanaian Cedi", nameFr: "Cédi ghanéen", symbol: "₵" },
  { code: "GNF", name: "Guinean Franc", nameFr: "Franc guinéen", symbol: "FG" },
  { code: "KES", name: "Kenyan Shilling", nameFr: "Shilling kényan", symbol: "KSh" },
  { code: "LSL", name: "Lesotho Loti", nameFr: "Loti du Lesotho", symbol: "L" },
  { code: "LRD", name: "Liberian Dollar", nameFr: "Dollar libérien", symbol: "L$" },
  { code: "LYD", name: "Libyan Dinar", nameFr: "Dinar libyen", symbol: "ل.د" },
  { code: "MGA", name: "Malagasy Ariary", nameFr: "Ariary malgache", symbol: "Ar" },
  { code: "MWK", name: "Malawian Kwacha", nameFr: "Kwacha malawien", symbol: "MK" },
  { code: "MRU", name: "Mauritanian Ouguiya", nameFr: "Ouguiya mauritanien", symbol: "UM" },
  { code: "MUR", name: "Mauritian Rupee", nameFr: "Roupie mauricienne", symbol: "₨" },
  { code: "MAD", name: "Moroccan Dirham", nameFr: "Dirham marocain", symbol: "MAD" },
  { code: "MZN", name: "Mozambican Metical", nameFr: "Metical mozambicain", symbol: "MT" },
  { code: "NAD", name: "Namibian Dollar", nameFr: "Dollar namibien", symbol: "N$" },
  { code: "NGN", name: "Nigerian Naira", nameFr: "Naira nigérian", symbol: "₦" },
  { code: "RWF", name: "Rwandan Franc", nameFr: "Franc rwandais", symbol: "FRw" },
  { code: "STN", name: "São Tomé Dobra", nameFr: "Dobra santoméen", symbol: "Db" },
  { code: "SCR", name: "Seychellois Rupee", nameFr: "Roupie seychelloise", symbol: "₨" },
  { code: "SLL", name: "Sierra Leonean Leone", nameFr: "Leone sierra-léonais", symbol: "Le" },
  { code: "SOS", name: "Somali Shilling", nameFr: "Shilling somalien", symbol: "Sh" },
  { code: "ZAR", name: "South African Rand", nameFr: "Rand sud-africain", symbol: "R" },
  { code: "SSP", name: "South Sudanese Pound", nameFr: "Livre sud-soudanaise", symbol: "£" },
  { code: "SDG", name: "Sudanese Pound", nameFr: "Livre soudanaise", symbol: "ج.س" },
  { code: "SZL", name: "Swazi Lilangeni", nameFr: "Lilangeni du Swaziland", symbol: "E" },
  { code: "TZS", name: "Tanzanian Shilling", nameFr: "Shilling tanzanien", symbol: "TSh" },
  { code: "TND", name: "Tunisian Dinar", nameFr: "Dinar tunisien", symbol: "د.ت" },
  { code: "UGX", name: "Ugandan Shilling", nameFr: "Shilling ougandais", symbol: "USh" },
  { code: "XOF", name: "West African CFA Franc", nameFr: "Franc CFA (BCEAO)", symbol: "CFA" },
  { code: "ZMW", name: "Zambian Kwacha", nameFr: "Kwacha zambien", symbol: "ZK" },
  { code: "ZWL", name: "Zimbabwean Dollar", nameFr: "Dollar zimbabwéen", symbol: "Z$" },
  { code: "USD", name: "US Dollar", nameFr: "Dollar américain", symbol: "$" },
  { code: "EUR", name: "Euro", nameFr: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", nameFr: "Livre sterling", symbol: "£" },
];

const currencyLocaleMap: Record<string, string> = {
  DZD: "ar-DZ", AOA: "pt-AO", BWP: "en-BW", BIF: "fr-BI", CVE: "pt-CV",
  XAF: "fr-CM", KMF: "fr-KM", CDF: "fr-CD", DJF: "fr-DJ", EGP: "ar-EG",
  ERN: "en-ER", ETB: "en-ET", GMD: "en-GM", GHS: "en-GH", GNF: "fr-GN",
  KES: "en-KE", LSL: "en-LS", LRD: "en-LR", LYD: "ar-LY", MGA: "fr-MG",
  MWK: "en-MW", MRU: "ar-MR", MUR: "en-MU", MAD: "fr-MA", MZN: "pt-MZ",
  NAD: "en-NA", NGN: "en-NG", RWF: "rw-RW", STN: "pt-ST", SCR: "en-SC",
  SLL: "en-SL", SOS: "so-SO", ZAR: "en-ZA", SSP: "en-SS", SDG: "ar-SD",
  SZL: "en-SZ", TZS: "en-TZ", TND: "ar-TN", UGX: "en-UG", XOF: "fr-SN",
  ZMW: "en-ZM", ZWL: "en-ZW", USD: "en-US", EUR: "fr-FR", GBP: "en-GB",
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
