/**
 * Africa Credit Hub — Tax-authority registry.
 *
 * Single source of truth for, per African country:
 *   - the local tax authority that runs e-invoicing / VAT-receipt verification,
 *   - the local currency,
 *   - the product label we surface to merchants in that country
 *     ("Loto Fiscal" for Côte d'Ivoire and other Francophone markets that
 *     literally use the term, "Verified Receipts" everywhere else).
 *
 * Used by both the server (to enrich /api/loto and /api/cross-product
 * responses) and the client (to render the merchant-credit-badge with the
 * right authority name in the right currency).
 *
 * IMPORTANT: this is a presentation/configuration registry. It is NOT a
 * gating policy — Loto Fiscal as a product is offered in every African
 * country covered by the platform. The registry only decides what to call
 * it and which authority badge to display.
 */

export type ProductLabel = "Loto Fiscal" | "Verified Receipts";

export interface TaxAuthorityProfile {
  /** ISO-3166 alpha-2 country code, uppercase. */
  countryCode: string;
  /** ISO-4217 currency code. */
  currency: string;
  /** Common short name of the tax authority (e.g. "FIRS", "DGI", "KRA"). */
  taxAuthority: string;
  /** Full official name of the tax authority. */
  taxAuthorityFull: string;
  /**
   * What we call the product to merchants in this country. "Loto Fiscal"
   * for the Francophone markets that already use the term locally;
   * "Verified Receipts" everywhere else.
   */
  productLabel: ProductLabel;
  /**
   * Local name of the receipt-issuance / fiscalisation regime
   * (e.g. "eTIMS" for Kenya, "EBM" for Rwanda, "FIRS e-Invoice" for Nigeria).
   * Surfaced in tooltips so merchants recognise it.
   */
  receiptRegime: string;
}

/**
 * 54 African countries. Tax-authority + currency + product-label mapping.
 * "Loto Fiscal" is reserved for Côte d'Ivoire (where the brand originates)
 * and other Francophone markets that already use the term in tax policy.
 */
export const AFRICAN_TAX_AUTHORITIES: Record<string, TaxAuthorityProfile> = {
  // ── Francophone markets that keep the "Loto Fiscal" brand ─────────────
  CI: { countryCode: "CI", currency: "XOF", taxAuthority: "DGI",       taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loto Fiscal" },
  SN: { countryCode: "SN", currency: "XOF", taxAuthority: "DGID",      taxAuthorityFull: "Direction Générale des Impôts et des Domaines",       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  CM: { countryCode: "CM", currency: "XAF", taxAuthority: "DGI-CM",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  BJ: { countryCode: "BJ", currency: "XOF", taxAuthority: "DGI-BJ",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  TG: { countryCode: "TG", currency: "XOF", taxAuthority: "OTR",       taxAuthorityFull: "Office Togolais des Recettes",                        productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  BF: { countryCode: "BF", currency: "XOF", taxAuthority: "DGI-BF",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  ML: { countryCode: "ML", currency: "XOF", taxAuthority: "DGI-ML",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  NE: { countryCode: "NE", currency: "XOF", taxAuthority: "DGI-NE",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  GA: { countryCode: "GA", currency: "XAF", taxAuthority: "DGI-GA",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  CG: { countryCode: "CG", currency: "XAF", taxAuthority: "DGI-CG",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  CD: { countryCode: "CD", currency: "CDF", taxAuthority: "DGI-CD",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  TD: { countryCode: "TD", currency: "XAF", taxAuthority: "DGI-TD",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  GN: { countryCode: "GN", currency: "GNF", taxAuthority: "DNI",       taxAuthorityFull: "Direction Nationale des Impôts",                      productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  MG: { countryCode: "MG", currency: "MGA", taxAuthority: "DGI-MG",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  CF: { countryCode: "CF", currency: "XAF", taxAuthority: "DGID-CF",   taxAuthorityFull: "Direction Générale des Impôts et des Domaines",       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  KM: { countryCode: "KM", currency: "KMF", taxAuthority: "AGID",      taxAuthorityFull: "Administration Générale des Impôts et des Domaines",  productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  DJ: { countryCode: "DJ", currency: "DJF", taxAuthority: "DGI-DJ",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  GQ: { countryCode: "GQ", currency: "XAF", taxAuthority: "DGT-GQ",    taxAuthorityFull: "Dirección General del Tesoro",                        productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  BI: { countryCode: "BI", currency: "BIF", taxAuthority: "OBR",       taxAuthorityFull: "Office Burundais des Recettes",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },

  // ── Anglophone, Lusophone, Arabophone markets — "Verified Receipts" ──
  NG: { countryCode: "NG", currency: "NGN", taxAuthority: "FIRS",      taxAuthorityFull: "Federal Inland Revenue Service",                      productLabel: "Verified Receipts", receiptRegime: "FIRS e-Invoice" },
  KE: { countryCode: "KE", currency: "KES", taxAuthority: "KRA",       taxAuthorityFull: "Kenya Revenue Authority",                             productLabel: "Verified Receipts", receiptRegime: "eTIMS" },
  ZA: { countryCode: "ZA", currency: "ZAR", taxAuthority: "SARS",      taxAuthorityFull: "South African Revenue Service",                       productLabel: "Verified Receipts", receiptRegime: "SARS e-Invoicing" },
  GH: { countryCode: "GH", currency: "GHS", taxAuthority: "GRA",       taxAuthorityFull: "Ghana Revenue Authority",                             productLabel: "Verified Receipts", receiptRegime: "E-VAT" },
  RW: { countryCode: "RW", currency: "RWF", taxAuthority: "RRA",       taxAuthorityFull: "Rwanda Revenue Authority",                            productLabel: "Verified Receipts", receiptRegime: "EBM" },
  TZ: { countryCode: "TZ", currency: "TZS", taxAuthority: "TRA",       taxAuthorityFull: "Tanzania Revenue Authority",                          productLabel: "Verified Receipts", receiptRegime: "EFD" },
  UG: { countryCode: "UG", currency: "UGX", taxAuthority: "URA",       taxAuthorityFull: "Uganda Revenue Authority",                            productLabel: "Verified Receipts", receiptRegime: "EFRIS" },
  ET: { countryCode: "ET", currency: "ETB", taxAuthority: "MOR",       taxAuthorityFull: "Ministry of Revenue",                                 productLabel: "Verified Receipts", receiptRegime: "ERCA Receipts" },
  EG: { countryCode: "EG", currency: "EGP", taxAuthority: "ETA",       taxAuthorityFull: "Egyptian Tax Authority",                              productLabel: "Verified Receipts", receiptRegime: "E-Invoice" },
  MA: { countryCode: "MA", currency: "MAD", taxAuthority: "DGI-MA",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Verified Receipts", receiptRegime: "SIMPL-TVA" },
  DZ: { countryCode: "DZ", currency: "DZD", taxAuthority: "DGI-DZ",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Verified Receipts", receiptRegime: "SI Jibaya" },
  TN: { countryCode: "TN", currency: "TND", taxAuthority: "DGI-TN",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
  LY: { countryCode: "LY", currency: "LYD", taxAuthority: "GTA-LY",    taxAuthorityFull: "General Tax Authority",                               productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  SD: { countryCode: "SD", currency: "SDG", taxAuthority: "TCSA",      taxAuthorityFull: "Taxation Chamber",                                    productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  SS: { countryCode: "SS", currency: "SSP", taxAuthority: "NRA-SS",    taxAuthorityFull: "National Revenue Authority",                          productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  SO: { countryCode: "SO", currency: "SOS", taxAuthority: "MOF-SO",    taxAuthorityFull: "Ministry of Finance",                                 productLabel: "Verified Receipts", receiptRegime: "Sales Receipts" },
  ER: { countryCode: "ER", currency: "ERN", taxAuthority: "IRD-ER",    taxAuthorityFull: "Inland Revenue Department",                           productLabel: "Verified Receipts", receiptRegime: "Sales Receipts" },
  AO: { countryCode: "AO", currency: "AOA", taxAuthority: "AGT",       taxAuthorityFull: "Administração Geral Tributária",                      productLabel: "Verified Receipts", receiptRegime: "Recibos IVA" },
  MZ: { countryCode: "MZ", currency: "MZN", taxAuthority: "AT-MZ",     taxAuthorityFull: "Autoridade Tributária de Moçambique",                 productLabel: "Verified Receipts", receiptRegime: "Recibos IVA" },
  CV: { countryCode: "CV", currency: "CVE", taxAuthority: "DNRE",      taxAuthorityFull: "Direção Nacional de Receitas do Estado",              productLabel: "Verified Receipts", receiptRegime: "Recibos IVA" },
  GW: { countryCode: "GW", currency: "XOF", taxAuthority: "DGCI",      taxAuthorityFull: "Direção Geral das Contribuições e Impostos",          productLabel: "Verified Receipts", receiptRegime: "Recibos IVA" },
  ST: { countryCode: "ST", currency: "STN", taxAuthority: "DIA",       taxAuthorityFull: "Direção dos Impostos",                                productLabel: "Verified Receipts", receiptRegime: "Recibos IVA" },
  ZM: { countryCode: "ZM", currency: "ZMW", taxAuthority: "ZRA",       taxAuthorityFull: "Zambia Revenue Authority",                            productLabel: "Verified Receipts", receiptRegime: "Smart Invoice" },
  ZW: { countryCode: "ZW", currency: "ZWL", taxAuthority: "ZIMRA",     taxAuthorityFull: "Zimbabwe Revenue Authority",                          productLabel: "Verified Receipts", receiptRegime: "Fiscalisation" },
  BW: { countryCode: "BW", currency: "BWP", taxAuthority: "BURS",      taxAuthorityFull: "Botswana Unified Revenue Service",                    productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  NA: { countryCode: "NA", currency: "NAD", taxAuthority: "NamRA",     taxAuthorityFull: "Namibia Revenue Agency",                              productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  LS: { countryCode: "LS", currency: "LSL", taxAuthority: "RSL",       taxAuthorityFull: "Revenue Services Lesotho",                            productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  SZ: { countryCode: "SZ", currency: "SZL", taxAuthority: "ERS",       taxAuthorityFull: "Eswatini Revenue Service",                            productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  MW: { countryCode: "MW", currency: "MWK", taxAuthority: "MRA",       taxAuthorityFull: "Malawi Revenue Authority",                            productLabel: "Verified Receipts", receiptRegime: "EFD Receipts" },
  MU: { countryCode: "MU", currency: "MUR", taxAuthority: "MRA-MU",    taxAuthorityFull: "Mauritius Revenue Authority",                         productLabel: "Verified Receipts", receiptRegime: "E-Invoicing" },
  SC: { countryCode: "SC", currency: "SCR", taxAuthority: "SRC",       taxAuthorityFull: "Seychelles Revenue Commission",                       productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  SL: { countryCode: "SL", currency: "SLE", taxAuthority: "NRA",       taxAuthorityFull: "National Revenue Authority",                          productLabel: "Verified Receipts", receiptRegime: "ECR Receipts" },
  LR: { countryCode: "LR", currency: "LRD", taxAuthority: "LRA",       taxAuthorityFull: "Liberia Revenue Authority",                           productLabel: "Verified Receipts", receiptRegime: "EITS Receipts" },
  GM: { countryCode: "GM", currency: "GMD", taxAuthority: "GRA-GM",    taxAuthorityFull: "Gambia Revenue Authority",                            productLabel: "Verified Receipts", receiptRegime: "VAT Receipts" },
  MR: { countryCode: "MR", currency: "MRU", taxAuthority: "DGI-MR",    taxAuthorityFull: "Direction Générale des Impôts",                       productLabel: "Loto Fiscal",       receiptRegime: "Loterie Fiscale" },
};

/**
 * Authoritative default. Used only as a last resort when a merchant has
 * no country code at all — never as a silent override of an explicit one.
 * Côte d'Ivoire stays the canonical "home" of Loto Fiscal.
 */
export const DEFAULT_TAX_AUTHORITY: TaxAuthorityProfile = AFRICAN_TAX_AUTHORITIES.CI;

/** Total number of African countries the registry covers. */
export const AFRICAN_COUNTRIES_COVERED: number = Object.keys(AFRICAN_TAX_AUTHORITIES).length;

/**
 * Look up the tax-authority profile for a country code. Falls back to the
 * default profile when the code is unknown, so callers can always render a
 * meaningful label.
 */
export function getTaxAuthorityProfile(countryCode: string | null | undefined): TaxAuthorityProfile {
  if (!countryCode) return DEFAULT_TAX_AUTHORITY;
  const upper = countryCode.toUpperCase();
  return AFRICAN_TAX_AUTHORITIES[upper] ?? DEFAULT_TAX_AUTHORITY;
}
