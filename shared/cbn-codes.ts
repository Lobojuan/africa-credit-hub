/**
 * CBN (Central Bank of Nigeria) Export Format Codes
 * Reference: CBN Credit Reporting Act 2017 / Credit Reporting Regulation 2017
 *
 * Nigeria-specific identifiers:
 *  - BVN  (Bank Verification Number) — 11-digit biometric ID
 *  - NIN  (National Identification Number) — 11-digit NIMC ID
 *  - RC   (Registration Certificate — CAMA number for corporates)
 *  - TIN  (Tax Identification Number — FIRS)
 */

export const CBN_FACILITY_TYPE_CONSUMER: Record<string, string> = {
  "101": "Agriculture Loan",
  "102": "Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "106": "Credit Card",
  "107": "Education Loan",
  "108": "Hire Purchase",
  "109": "Housing Loan / Mortgage",
  "110": "Leasing",
  "111": "Letter of Credit",
  "115": "Salary Advance / Payroll Loan",
  "118": "Mortgage",
  "119": "Unsecured Personal Loan",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "122": "Personal Loan",
  "124": "Property Loan",
  "126": "Term Loan",
  "127": "SME Loan",
  "128": "Student Loan",
  "129": "Others",
};

export const CBN_FACILITY_TYPE_BUSINESS: Record<string, string> = {
  "101": "Agriculture Facility",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "105": "Corporate Credit Card",
  "108": "Hire Purchase",
  "109": "Commercial Mortgage",
  "110": "Equipment Leasing",
  "111": "Letter of Credit",
  "119": "Unsecured Business Loan",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "124": "Commercial Property Loan",
  "126": "Term Loan",
  "127": "SME Loan",
  "129": "Others",
};

export const CBN_REPAYMENT_FREQUENCY: Record<string, string> = {
  "10": "Weekly",
  "11": "Bi-Monthly",
  "12": "Monthly",
  "13": "Quarterly",
  "14": "Tri-Annually",
  "15": "Semi-Annually",
  "16": "Annual",
  "17": "Variable",
  "18": "Bullet",
  "19": "Revolving",
  "20": "Unspecified",
};

export const CBN_ASSET_CLASSIFICATION: Record<string, string> = {
  "PC": "Pass (1-90 days)",
  "WA": "Watch (91-180 days)",
  "SS": "Substandard (181-270 days)",
  "DT": "Doubtful (271-360 days)",
  "LO": "Lost (360+ days)",
};

export const CBN_ACCOUNT_STATUS: Record<string, string> = {
  "A": "Active / Performing",
  "C": "Closed",
  "D": "Disputed",
  "L": "Lost / Written-off",
  "R": "Restructured",
  "W": "Written-off",
};

export const CBN_SECTOR_CODE: Record<string, string> = {
  "AGR": "Agriculture",
  "MIN": "Mining & Quarrying",
  "MFG": "Manufacturing",
  "UTL": "Utilities",
  "CON": "Construction",
  "TRD": "Trade / Commerce",
  "TRP": "Transport & Communications",
  "FIN": "Finance & Insurance",
  "SRV": "Services",
  "GOV": "Government / Public Sector",
  "OIL": "Oil & Gas",
  "TLM": "Telecommunications",
};

export const CBN_FILE_IDENTIFIERS = {
  CONC: "Consumer Credit",
  BUSC: "Business Credit",
  CONJ: "Consumer Judgment",
  BUSJ: "Business Judgment",
  COND: "Consumer Dishonoured Cheque",
  BUSD: "Business Dishonoured Cheque",
} as const;

export type CbnFileType = keyof typeof CBN_FILE_IDENTIFIERS;

export function mapInternalStatusToCbn(status: string): string {
  const mapping: Record<string, string> = {
    "current": "A",
    "delinquent": "A",
    "default": "L",
    "closed": "C",
    "restructured": "R",
    "written_off": "W",
  };
  return mapping[status] || "A";
}

export function mapInternalAssetClassToCbn(classification: string | null | undefined): string {
  if (!classification) return "PC";
  const mapping: Record<string, string> = {
    "Pass": "PC",
    "Watch": "WA",
    "OLEM": "WA",
    "Substandard": "SS",
    "Doubtful": "DT",
    "Loss": "LO",
  };
  return mapping[classification] || "PC";
}

export function mapDaysInArrearsToPaymentProfileCbn(days: number): string {
  if (days <= 30) return "0";
  if (days <= 60) return "1";
  if (days <= 90) return "2";
  if (days <= 120) return "3";
  if (days <= 180) return "4";
  return "5";
}

export function formatCbnDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "").substring(0, 8);
}

export function formatCbnAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return Math.round(num).toString();
}

export function generateCbnFilename(
  srn: string,
  reportingDate: string,
  fileCreatedDate: string,
  fileId: CbnFileType,
  sequenceNum: number
): string {
  return `${srn}-${reportingDate}-${fileCreatedDate}-1.1-${fileId}-${sequenceNum}-CBN.csv`;
}
