export interface ServerCountryConfig {
  name: string;
  code: string;
  currency: string;
  regulatoryBody: string;
  dataProtectionLaw: string;
  brandTitle: string;
}

const GHANA_CONFIG: ServerCountryConfig = {
  name: "Ghana",
  code: "GH",
  currency: "GHS",
  regulatoryBody: "Bank of Ghana",
  dataProtectionLaw: "Data Protection Act, 2012 (Act 843)",
  brandTitle: "Ghana Credit Registry",
};

export function getCountryMode(): string | null {
  const mode = process.env.VITE_COUNTRY_MODE;
  if (mode && mode.toLowerCase() === "ghana") return "ghana";
  return null;
}

export function isGhanaMode(): boolean {
  return getCountryMode() === "ghana";
}

export function isSingleCountryMode(): boolean {
  return getCountryMode() !== null;
}

export function getServerCountryConfig(): ServerCountryConfig | null {
  if (isGhanaMode()) return GHANA_CONFIG;
  return null;
}
