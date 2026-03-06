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

export interface GhanaIdType {
  code: string;
  label: string;
  fieldName: string;
}

export interface BogCode {
  code: string;
  label: string;
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

export const GHANA_ID_TYPES: GhanaIdType[] = [
  { code: "GHANA_CARD", label: "Ghana Card (National ID)", fieldName: "ghanaCardNumber" },
  { code: "VOTERS_ID", label: "Voter's ID", fieldName: "votersId" },
  { code: "SSNIT", label: "SSNIT Number", fieldName: "ssnitNumber" },
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

export function getDefaultFallbackCurrency(): string {
  return isGhanaMode() ? "GHS" : "ETB";
}

export function formatBogFileName(
  srn: string,
  reportingDate: string,
  fileType: "BUSC" | "CONC" | "BUSD" | "COND" | "BUSJ" | "CONJ",
  sequenceNumber = 1
): string {
  const createdDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${srn}-${reportingDate}-${createdDate}-1.1-${fileType}-${sequenceNumber}.csv`;
}
