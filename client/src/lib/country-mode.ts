export interface CountryTheme {
  primary: string;
  primaryForeground: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarBorder: string;
  sidebarPrimary: string;
  sidebarAccent: string;
  accent: string;
  ring: string;
  chart1: string;
  chart2: string;
  logoGradientFrom: string;
  logoGradientTo: string;
  logoGlow: string;
}

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
  theme: CountryTheme;
}

export interface GhanaIdType {
  code: string;
  label: string;
  fieldName: string;
}

export interface BogCode {
  code: string;
  label: string;
}

const COUNTRY_REGISTRY: Record<string, CountryConfig> = {
  ghana: {
    name: "Ghana",
    code: "GH",
    currency: "GHS",
    currencySymbol: "\u20B5",
    regulatoryBody: "Bank of Ghana",
    dataProtectionLaw: "Data Protection Act, 2012 (Act 843)",
    brandTitle: "Ghana Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Greater Accra", "Ashanti", "Western", "Central", "Eastern",
      "Northern", "Volta", "Upper East", "Upper West", "Bono",
      "Bono East", "Ahafo", "Western North", "Oti", "Savannah", "North East",
    ],
    theme: {
      primary: "172 62% 26%",
      primaryForeground: "45 25% 98%",
      sidebar: "172 40% 11%",
      sidebarForeground: "45 25% 96%",
      sidebarBorder: "172 35% 15%",
      sidebarPrimary: "42 85% 53%",
      sidebarAccent: "172 35% 17%",
      accent: "42 72% 50%",
      ring: "172 62% 26%",
      chart1: "172 62% 26%",
      chart2: "42 85% 53%",
      logoGradientFrom: "hsl(42 85% 55%)",
      logoGradientTo: "hsl(32 78% 46%)",
      logoGlow: "hsl(42 85% 53% / 0.4)",
    },
  },
  liberia: {
    name: "Liberia",
    code: "LR",
    currency: "LRD",
    currencySymbol: "L$",
    regulatoryBody: "Central Bank of Liberia",
    dataProtectionLaw: "Data Protection Act of Liberia",
    brandTitle: "Liberia Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Montserrado", "Nimba", "Bong", "Grand Bassa", "Lofa",
      "Margibi", "Maryland", "Grand Gedeh", "Sinoe", "Gbarpolu",
      "Grand Cape Mount", "Grand Kru", "River Cess", "River Gee", "Bomi",
    ],
    theme: {
      primary: "0 72% 38%",
      primaryForeground: "0 0% 98%",
      sidebar: "220 40% 12%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "220 35% 18%",
      sidebarPrimary: "0 72% 50%",
      sidebarAccent: "220 35% 18%",
      accent: "0 72% 50%",
      ring: "0 72% 38%",
      chart1: "0 72% 38%",
      chart2: "220 60% 50%",
      logoGradientFrom: "hsl(0 72% 50%)",
      logoGradientTo: "hsl(220 60% 40%)",
      logoGlow: "hsl(0 72% 50% / 0.4)",
    },
  },
  sierraleone: {
    name: "Sierra Leone",
    code: "SL",
    currency: "SLE",
    currencySymbol: "Le",
    regulatoryBody: "Bank of Sierra Leone",
    dataProtectionLaw: "Data Protection Act of Sierra Leone",
    brandTitle: "Sierra Leone Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Western Area Urban", "Western Area Rural", "Northern", "Southern", "Eastern", "North West",
    ],
    theme: {
      primary: "145 55% 32%",
      primaryForeground: "0 0% 98%",
      sidebar: "210 35% 12%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "210 30% 18%",
      sidebarPrimary: "145 55% 45%",
      sidebarAccent: "210 30% 18%",
      accent: "200 60% 48%",
      ring: "145 55% 32%",
      chart1: "145 55% 32%",
      chart2: "200 60% 48%",
      logoGradientFrom: "hsl(145 55% 45%)",
      logoGradientTo: "hsl(200 60% 40%)",
      logoGlow: "hsl(145 55% 45% / 0.4)",
    },
  },
  nigeria: {
    name: "Nigeria",
    code: "NG",
    currency: "NGN",
    currencySymbol: "\u20A6",
    regulatoryBody: "Central Bank of Nigeria",
    dataProtectionLaw: "Nigeria Data Protection Regulation (NDPR)",
    brandTitle: "Nigeria Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Lagos", "Abuja FCT", "Kano", "Rivers", "Oyo", "Kaduna",
      "Ogun", "Anambra", "Delta", "Enugu", "Edo", "Imo",
    ],
    theme: {
      primary: "145 65% 28%",
      primaryForeground: "0 0% 98%",
      sidebar: "145 45% 10%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "145 40% 16%",
      sidebarPrimary: "0 0% 96%",
      sidebarAccent: "145 40% 16%",
      accent: "145 65% 40%",
      ring: "145 65% 28%",
      chart1: "145 65% 28%",
      chart2: "0 0% 85%",
      logoGradientFrom: "hsl(145 65% 38%)",
      logoGradientTo: "hsl(145 50% 22%)",
      logoGlow: "hsl(145 65% 38% / 0.4)",
    },
  },
  kenya: {
    name: "Kenya",
    code: "KE",
    currency: "KES",
    currencySymbol: "KSh",
    regulatoryBody: "Central Bank of Kenya",
    dataProtectionLaw: "Data Protection Act, 2019",
    brandTitle: "Kenya Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
      "Nyeri", "Machakos", "Kiambu", "Uasin Gishu", "Kilifi",
    ],
    theme: {
      primary: "0 68% 35%",
      primaryForeground: "0 0% 98%",
      sidebar: "150 30% 10%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "150 25% 16%",
      sidebarPrimary: "0 68% 48%",
      sidebarAccent: "150 25% 16%",
      accent: "145 50% 38%",
      ring: "0 68% 35%",
      chart1: "0 68% 35%",
      chart2: "145 50% 38%",
      logoGradientFrom: "hsl(0 68% 48%)",
      logoGradientTo: "hsl(150 30% 20%)",
      logoGlow: "hsl(0 68% 48% / 0.4)",
    },
  },
  rwanda: {
    name: "Rwanda",
    code: "RW",
    currency: "RWF",
    currencySymbol: "FRw",
    regulatoryBody: "National Bank of Rwanda",
    dataProtectionLaw: "Law Relating to the Protection of Personal Data",
    brandTitle: "Rwanda Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: ["Kigali", "Eastern", "Northern", "Southern", "Western"],
    theme: {
      primary: "210 70% 38%",
      primaryForeground: "0 0% 98%",
      sidebar: "42 35% 12%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "42 30% 18%",
      sidebarPrimary: "45 80% 52%",
      sidebarAccent: "42 30% 18%",
      accent: "45 80% 52%",
      ring: "210 70% 38%",
      chart1: "210 70% 38%",
      chart2: "45 80% 52%",
      logoGradientFrom: "hsl(210 70% 48%)",
      logoGradientTo: "hsl(45 80% 45%)",
      logoGlow: "hsl(210 70% 48% / 0.4)",
    },
  },
  tanzania: {
    name: "Tanzania",
    code: "TZ",
    currency: "TZS",
    currencySymbol: "TSh",
    regulatoryBody: "Bank of Tanzania",
    dataProtectionLaw: "Personal Data Protection Act, 2022",
    brandTitle: "Tanzania Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar",
      "Mbeya", "Morogoro", "Tanga", "Kilimanjaro", "Iringa",
    ],
    theme: {
      primary: "210 65% 35%",
      primaryForeground: "0 0% 98%",
      sidebar: "145 35% 10%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "145 30% 16%",
      sidebarPrimary: "50 75% 50%",
      sidebarAccent: "145 30% 16%",
      accent: "50 75% 50%",
      ring: "210 65% 35%",
      chart1: "210 65% 35%",
      chart2: "50 75% 50%",
      logoGradientFrom: "hsl(210 65% 45%)",
      logoGradientTo: "hsl(145 35% 25%)",
      logoGlow: "hsl(210 65% 45% / 0.4)",
    },
  },
  uganda: {
    name: "Uganda",
    code: "UG",
    currency: "UGX",
    currencySymbol: "USh",
    regulatoryBody: "Bank of Uganda",
    dataProtectionLaw: "Data Protection and Privacy Act, 2019",
    brandTitle: "Uganda Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Kampala", "Wakiso", "Mukono", "Jinja", "Gulu",
      "Mbarara", "Lira", "Masaka", "Mbale", "Fort Portal",
    ],
    theme: {
      primary: "48 85% 42%",
      primaryForeground: "0 0% 8%",
      sidebar: "0 55% 14%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "0 50% 20%",
      sidebarPrimary: "48 85% 52%",
      sidebarAccent: "0 50% 20%",
      accent: "0 55% 42%",
      ring: "48 85% 42%",
      chart1: "48 85% 42%",
      chart2: "0 55% 42%",
      logoGradientFrom: "hsl(48 85% 52%)",
      logoGradientTo: "hsl(0 55% 35%)",
      logoGlow: "hsl(48 85% 52% / 0.4)",
    },
  },
  ethiopia: {
    name: "Ethiopia",
    code: "ET",
    currency: "ETB",
    currencySymbol: "Br",
    regulatoryBody: "National Bank of Ethiopia",
    dataProtectionLaw: "Computer Crime Proclamation No. 958/2016",
    brandTitle: "Ethiopia Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Addis Ababa", "Oromia", "Amhara", "SNNPR", "Tigray",
      "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari",
    ],
    theme: {
      primary: "145 60% 30%",
      primaryForeground: "0 0% 98%",
      sidebar: "42 30% 12%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "42 25% 18%",
      sidebarPrimary: "52 80% 50%",
      sidebarAccent: "42 25% 18%",
      accent: "52 80% 50%",
      ring: "145 60% 30%",
      chart1: "145 60% 30%",
      chart2: "52 80% 50%",
      logoGradientFrom: "hsl(145 60% 40%)",
      logoGradientTo: "hsl(52 80% 42%)",
      logoGlow: "hsl(145 60% 40% / 0.4)",
    },
  },
  southafrica: {
    name: "South Africa",
    code: "ZA",
    currency: "ZAR",
    currencySymbol: "R",
    regulatoryBody: "South African Reserve Bank",
    dataProtectionLaw: "Protection of Personal Information Act (POPIA)",
    brandTitle: "South Africa Credit Registry",
    brandSubtitle: "Carlson Capital & Systems In Motion Limited\u2122",
    regions: [
      "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
      "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
    ],
    theme: {
      primary: "215 65% 35%",
      primaryForeground: "0 0% 98%",
      sidebar: "145 35% 10%",
      sidebarForeground: "0 0% 95%",
      sidebarBorder: "145 30% 16%",
      sidebarPrimary: "42 80% 52%",
      sidebarAccent: "145 30% 16%",
      accent: "42 80% 52%",
      ring: "215 65% 35%",
      chart1: "215 65% 35%",
      chart2: "42 80% 52%",
      logoGradientFrom: "hsl(215 65% 45%)",
      logoGradientTo: "hsl(42 80% 42%)",
      logoGlow: "hsl(215 65% 45% / 0.4)",
    },
  },
};

export const GHANA_ID_TYPES: GhanaIdType[] = [
  { code: "GHANA_CARD", label: "Ghana Card (National ID)", fieldName: "ghanaCardNumber" },
  { code: "VOTERS_ID", label: "Voter's ID", fieldName: "votersId" },
  { code: "SSNIT", label: "SSNIT Number", fieldName: "ssnitNumber" },
  { code: "DRIVERS_LICENSE", label: "Driver's License", fieldName: "driversLicense" },
  { code: "PASSPORT", label: "Passport", fieldName: "passportNumber" },
];

export const SIERRA_LEONE_ID_TYPES: GhanaIdType[] = [
  { code: "NCRA_ID", label: "NCRA National ID", fieldName: "ghanaCardNumber" },
  { code: "NIN", label: "National Identification Number (NIN)", fieldName: "votersId" },
  { code: "NASSIT", label: "NASSIT Number", fieldName: "ssnitNumber" },
  { code: "DRIVERS_LICENSE", label: "Driver's License", fieldName: "driversLicense" },
  { code: "PASSPORT", label: "Passport", fieldName: "passportNumber" },
];

export const BOG_FACILITY_TYPES: BogCode[] = [
  { code: "OVD", label: "Overdraft" },
  { code: "TML", label: "Term Loan" },
  { code: "MTG", label: "Mortgage" },
  { code: "CRC", label: "Credit Card" },
  { code: "LAS", label: "Loan Against Salary" },
  { code: "MFL", label: "Microfinance Loan" },
  { code: "TRF", label: "Trade Finance" },
  { code: "LSE", label: "Lease" },
  { code: "GRT", label: "Guarantee" },
  { code: "LOC", label: "Letter of Credit" },
  { code: "BND", label: "Bond" },
  { code: "STL", label: "Staff Loan" },
  { code: "GRP", label: "Group Loan" },
  { code: "OTH", label: "Other" },
];

export const BOG_PURPOSE_CODES: BogCode[] = [
  { code: "PER", label: "Personal / Household" },
  { code: "BUS", label: "Business / Working Capital" },
  { code: "AGR", label: "Agriculture" },
  { code: "EDU", label: "Education" },
  { code: "HSG", label: "Housing / Construction" },
  { code: "VEH", label: "Vehicle Purchase" },
  { code: "TRD", label: "Trade / Commerce" },
  { code: "MFG", label: "Manufacturing" },
  { code: "INF", label: "Infrastructure" },
  { code: "OTH", label: "Other" },
];

export const BOG_ASSET_CLASSIFICATIONS: BogCode[] = [
  { code: "CUR", label: "Current" },
  { code: "OLM", label: "OLEM (Other Loans Especially Mentioned)" },
  { code: "SUB", label: "Substandard" },
  { code: "DBT", label: "Doubtful" },
  { code: "LSS", label: "Loss" },
];

export const BOG_REPAYMENT_FREQUENCIES: BogCode[] = [
  { code: "DLY", label: "Daily" },
  { code: "WKL", label: "Weekly" },
  { code: "BWK", label: "Bi-Weekly" },
  { code: "MTH", label: "Monthly" },
  { code: "QTR", label: "Quarterly" },
  { code: "SAN", label: "Semi-Annually" },
  { code: "ANN", label: "Annually" },
  { code: "MAT", label: "At Maturity" },
  { code: "IRR", label: "Irregular" },
];

export const BOG_COLLATERAL_TYPES: BogCode[] = [
  { code: "PRO", label: "Property / Real Estate" },
  { code: "VEH", label: "Motor Vehicle" },
  { code: "EQP", label: "Equipment / Machinery" },
  { code: "STK", label: "Stocks / Shares" },
  { code: "FXD", label: "Fixed Deposit" },
  { code: "GOV", label: "Government Securities" },
  { code: "INV", label: "Inventory" },
  { code: "REC", label: "Receivables" },
  { code: "GRT", label: "Personal Guarantee" },
  { code: "INS", label: "Insurance Policy" },
  { code: "OTH", label: "Other" },
  { code: "UNS", label: "Unsecured" },
];

export const BOG_CLOSURE_REASONS: BogCode[] = [
  { code: "NOR", label: "Normal Closure" },
  { code: "EAR", label: "Early Settlement by Subject" },
  { code: "WOF", label: "Written Off" },
  { code: "TRF", label: "Transferred to Another Institution" },
  { code: "REF", label: "Refinanced" },
  { code: "OTH", label: "Other" },
];

export const BOG_BUSINESS_TYPES: BogCode[] = [
  { code: "LLC", label: "Limited Liability Company" },
  { code: "LBG", label: "Company Limited by Guarantee" },
  { code: "PNR", label: "Partnership" },
  { code: "SOP", label: "Sole Proprietorship" },
  { code: "PLC", label: "Public Limited Company" },
  { code: "NGO", label: "Non-Governmental Organization" },
  { code: "GOV", label: "Government Entity" },
  { code: "SOE", label: "State-Owned Enterprise" },
  { code: "OTH", label: "Other" },
];

export const BOG_INDUSTRY_CODES: BogCode[] = [
  { code: "AGR", label: "Agriculture, Forestry & Fishing" },
  { code: "MIN", label: "Mining & Quarrying" },
  { code: "MFG", label: "Manufacturing" },
  { code: "EGW", label: "Electricity, Gas & Water" },
  { code: "CON", label: "Construction" },
  { code: "WRT", label: "Wholesale & Retail Trade" },
  { code: "HRS", label: "Hotels, Restaurants & Tourism" },
  { code: "TRN", label: "Transport & Storage" },
  { code: "FIN", label: "Financial Intermediation" },
  { code: "RES", label: "Real Estate & Business Services" },
  { code: "EDU", label: "Education" },
  { code: "HLT", label: "Health & Social Work" },
  { code: "COM", label: "Community & Social Services" },
  { code: "ICT", label: "Information & Communication" },
  { code: "OTH", label: "Other" },
];

export const BOG_CHEQUE_RETURN_REASONS: BogCode[] = [
  { code: "INF", label: "Insufficient Funds" },
  { code: "ACC", label: "Account Closed" },
  { code: "STL", label: "Stale Cheque" },
  { code: "STP", label: "Stop Payment" },
  { code: "SIG", label: "Signature Differs" },
  { code: "AMT", label: "Amount in Words and Figures Differ" },
  { code: "ALT", label: "Alteration on Cheque" },
  { code: "OTH", label: "Other" },
];

export const BOG_MARITAL_STATUSES: BogCode[] = [
  { code: "SNG", label: "Single" },
  { code: "MRD", label: "Married" },
  { code: "DIV", label: "Divorced" },
  { code: "WID", label: "Widowed" },
  { code: "SEP", label: "Separated" },
];

export const BOG_EMPLOYMENT_TYPES: BogCode[] = [
  { code: "EMP", label: "Employed" },
  { code: "SLF", label: "Self-Employed" },
  { code: "UNE", label: "Unemployed" },
  { code: "RET", label: "Retired" },
  { code: "STD", label: "Student" },
  { code: "HMK", label: "Homemaker" },
  { code: "OTH", label: "Other" },
];

export const BOG_PROOF_OF_ADDRESS: BogCode[] = [
  { code: "WAT", label: "Water Bill" },
  { code: "ELE", label: "Electricity Bill" },
  { code: "BNK", label: "Bank Statement" },
  { code: "TEN", label: "Tenancy Agreement" },
  { code: "OTH", label: "Other" },
];

export {
  STANDARD_CREDIT_TYPES,
  CREDIT_CATEGORIES,
  CREDIT_TYPE_SYNONYMS as COUNTRY_CREDIT_TYPE_SYNONYMS,
  BUSINESS_CREDIT_TYPES,
  normalizeAccountType,
  inferCreditCategory,
} from "@shared/credit-types";
export type { StandardCreditType } from "@shared/credit-types";

export const GHANA_MARKET_STATS = {
  activeBorrowers: 3_400_000,
  creditFacilities: 5_700_000,
  nationalDefaultRate: 23,
  licensedInstitutions: 154,
  mobileMoneyUsers: 22_000_000,
  bureauScoredAdults: 4_500_000,
  bureauCoveragePercent: 25,
  femaleCreditParticipation: 44,
  creditReportingAct: "Credit Reporting Act, 2007 (Act 726)",
  dataProtectionAct: "Data Protection Act, 2012 (Act 843)",
  crbVersion: "v1.1",
  licensedBureaus: ["XDS Data Ghana", "Dun & Bradstreet", "Hudson Price"],
};

export const CREDIT_SCORE_FACTORS = [
  { name: "Payment History", weight: 35, color: "hsl(175 55% 35%)" },
  { name: "Credit Utilization", weight: 30, color: "hsl(200 55% 40%)" },
  { name: "Account Age", weight: 15, color: "hsl(45 80% 50%)" },
  { name: "Credit Mix", weight: 10, color: "hsl(280 50% 50%)" },
  { name: "New Inquiries", weight: 10, color: "hsl(350 55% 50%)" },
];

export function getCountryMode(): string | null {
  const mode = import.meta.env.VITE_COUNTRY_MODE;
  if (mode && typeof mode === "string") {
    const normalized = mode.toLowerCase().replace(/[\s_-]/g, "");
    if (COUNTRY_REGISTRY[normalized]) return normalized;
  }
  return null;
}

export function isGhanaMode(): boolean {
  return getCountryMode() === "ghana";
}

export function isSierraLeoneMode(): boolean {
  return getCountryMode() === "sierraleone";
}

export function isSingleCountryMode(): boolean {
  return getCountryMode() !== null;
}

export function getCountryConfig(): CountryConfig | null {
  const mode = getCountryMode();
  if (mode) return COUNTRY_REGISTRY[mode];
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
  return config ? config.brandSubtitle : "Carlson Capital & Systems In Motion Limited\u2122";
}

export function getDefaultFallbackCurrency(): string {
  const config = getCountryConfig();
  return config ? config.currency : "ETB";
}

export function getSupportedCountries(): CountryConfig[] {
  return Object.values(COUNTRY_REGISTRY);
}

export function getCountryConfigByName(countryName: string): CountryConfig | null {
  const normalized = countryName.toLowerCase().replace(/[\s_-]/g, "");
  if (COUNTRY_REGISTRY[normalized]) return COUNTRY_REGISTRY[normalized];
  const entry = Object.values(COUNTRY_REGISTRY).find(c => c.name === countryName);
  return entry || null;
}

export const GLOBAL_VIEW_THEME: CountryTheme = {
  primary: "172 62% 26%",
  primaryForeground: "45 25% 98%",
  sidebar: "220 25% 10%",
  sidebarForeground: "45 25% 96%",
  sidebarBorder: "220 20% 15%",
  sidebarPrimary: "42 85% 53%",
  sidebarAccent: "220 20% 15%",
  accent: "42 72% 50%",
  ring: "172 62% 26%",
  chart1: "172 62% 26%",
  chart2: "42 85% 53%",
  logoGradientFrom: "hsl(42 85% 55%)",
  logoGradientTo: "hsl(32 78% 46%)",
  logoGlow: "hsl(42 85% 53% / 0.4)",
};

export function formatBogFileName(
  srn: string,
  reportingDate: string,
  fileType: "BUSC" | "CONC" | "BUSD" | "COND" | "BUSJ" | "CONJ",
  sequenceNumber = 1
): string {
  const createdDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${srn}-${reportingDate}-${createdDate}-1.1-${fileType}-${sequenceNumber}.csv`;
}

export { COUNTRY_REGISTRY };
