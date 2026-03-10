export interface ServerCountryConfig {
  name: string;
  code: string;
  currency: string;
  regulatoryBody: string;
  dataProtectionLaw: string;
  brandTitle: string;
}

const COUNTRY_REGISTRY: Record<string, ServerCountryConfig> = {
  ghana: {
    name: "Ghana",
    code: "GH",
    currency: "GHS",
    regulatoryBody: "Bank of Ghana",
    dataProtectionLaw: "Data Protection Act, 2012 (Act 843)",
    brandTitle: "Ghana Credit Registry",
  },
  liberia: {
    name: "Liberia",
    code: "LR",
    currency: "LRD",
    regulatoryBody: "Central Bank of Liberia",
    dataProtectionLaw: "Data Protection Act of Liberia",
    brandTitle: "Liberia Credit Registry",
  },
  sierraleone: {
    name: "Sierra Leone",
    code: "SL",
    currency: "SLE",
    regulatoryBody: "Bank of Sierra Leone",
    dataProtectionLaw: "Data Protection Act of Sierra Leone",
    brandTitle: "Sierra Leone Credit Registry",
  },
  nigeria: {
    name: "Nigeria",
    code: "NG",
    currency: "NGN",
    regulatoryBody: "Central Bank of Nigeria",
    dataProtectionLaw: "Nigeria Data Protection Regulation (NDPR)",
    brandTitle: "Nigeria Credit Registry",
  },
  kenya: {
    name: "Kenya",
    code: "KE",
    currency: "KES",
    regulatoryBody: "Central Bank of Kenya",
    dataProtectionLaw: "Data Protection Act, 2019",
    brandTitle: "Kenya Credit Registry",
  },
  rwanda: {
    name: "Rwanda",
    code: "RW",
    currency: "RWF",
    regulatoryBody: "National Bank of Rwanda",
    dataProtectionLaw: "Law Relating to the Protection of Personal Data",
    brandTitle: "Rwanda Credit Registry",
  },
  tanzania: {
    name: "Tanzania",
    code: "TZ",
    currency: "TZS",
    regulatoryBody: "Bank of Tanzania",
    dataProtectionLaw: "Personal Data Protection Act, 2022",
    brandTitle: "Tanzania Credit Registry",
  },
  uganda: {
    name: "Uganda",
    code: "UG",
    currency: "UGX",
    regulatoryBody: "Bank of Uganda",
    dataProtectionLaw: "Data Protection and Privacy Act, 2019",
    brandTitle: "Uganda Credit Registry",
  },
  ethiopia: {
    name: "Ethiopia",
    code: "ET",
    currency: "ETB",
    regulatoryBody: "National Bank of Ethiopia",
    dataProtectionLaw: "Computer Crime Proclamation No. 958/2016",
    brandTitle: "Ethiopia Credit Registry",
  },
  southafrica: {
    name: "South Africa",
    code: "ZA",
    currency: "ZAR",
    regulatoryBody: "South African Reserve Bank",
    dataProtectionLaw: "Protection of Personal Information Act (POPIA)",
    brandTitle: "South Africa Credit Registry",
  },
};

export function getCountryMode(): string | null {
  const mode = process.env.VITE_COUNTRY_MODE;
  if (!mode) return null;
  const normalized = mode.toLowerCase().replace(/[\s_-]/g, "");
  if (COUNTRY_REGISTRY[normalized]) return normalized;
  return null;
}

export function isGhanaMode(): boolean {
  return getCountryMode() === "ghana";
}

export function isSingleCountryMode(): boolean {
  return getCountryMode() !== null;
}

export function getServerCountryConfig(): ServerCountryConfig | null {
  const mode = getCountryMode();
  if (mode) return COUNTRY_REGISTRY[mode];
  return null;
}

export function getActiveCountryName(): string | null {
  const config = getServerCountryConfig();
  return config ? config.name : null;
}

export function getSupportedCountries(): ServerCountryConfig[] {
  return Object.values(COUNTRY_REGISTRY);
}

export { COUNTRY_REGISTRY };
