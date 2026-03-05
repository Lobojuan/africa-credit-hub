export interface CountryConfig {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  regulatoryBody: string;
  dataProtectionLaw: string;
  brandTitle: string;
  brandSubtitle: string;
  regions: string[];
}

const GHANA_CONFIG: CountryConfig = {
  name: "Ghana",
  code: "GH",
  currency: "GHS",
  currencySymbol: "₵",
  regulatoryBody: "Bank of Ghana",
  dataProtectionLaw: "Data Protection Act, 2012 (Act 843)",
  brandTitle: "Ghana Credit Registry",
  brandSubtitle: "Systems In Motion Limited™",
  regions: [
    "Greater Accra",
    "Ashanti",
    "Western",
    "Central",
    "Eastern",
    "Northern",
    "Volta",
    "Upper East",
    "Upper West",
    "Bono",
    "Bono East",
    "Ahafo",
    "Western North",
    "Oti",
    "Savannah",
    "North East",
  ],
};

export function getCountryMode(): string | null {
  const mode = import.meta.env.VITE_COUNTRY_MODE;
  if (mode && typeof mode === "string" && mode.toLowerCase() === "ghana") {
    return "ghana";
  }
  return null;
}

export function isGhanaMode(): boolean {
  return getCountryMode() === "ghana";
}

export function isSingleCountryMode(): boolean {
  return getCountryMode() !== null;
}

export function getCountryConfig(): CountryConfig | null {
  if (isGhanaMode()) return GHANA_CONFIG;
  return null;
}

export function getDefaultCountry(): string | null {
  const config = getCountryConfig();
  return config ? config.name : null;
}

export function getDefaultCurrency(): string | null {
  const config = getCountryConfig();
  return config ? config.currency : null;
}

export function getBrandTitle(): string {
  const config = getCountryConfig();
  return config ? config.brandTitle : "Credit Registry";
}

export function getBrandSubtitle(): string {
  const config = getCountryConfig();
  return config ? config.brandSubtitle : "Systems In Motion Limited™";
}
