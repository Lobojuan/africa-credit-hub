/**
 * CBK (Central Bank of Kenya) Export Format Codes
 * Reference: CBK Credit Reference Bureau Regulations 2020 / Banking Act Cap 488
 *
 * Kenya-specific identifiers:
 *  - National ID   (8-digit citizen ID)
 *  - KRA PIN       (Tax identification — Kenya Revenue Authority)
 *  - Passport      (for non-citizens)
 *  - CRB Ref       (Credit Reference Bureau reference number)
 *  - Business Reg  (Certificate of Incorporation / Business Name Reg)
 */

export const CBK_FACILITY_TYPE_CONSUMER: Record<string, string> = {
  "101": "Agricultural Loan",
  "102": "Asset Finance / Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "106": "Credit Card",
  "107": "Education Loan",
  "108": "Hire Purchase",
  "109": "Home Loan / Mortgage",
  "110": "Leasing",
  "111": "Letter of Credit",
  "115": "Salary Advance",
  "118": "Mortgage",
  "119": "Unsecured Personal Loan",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "122": "Personal Loan",
  "124": "Property Loan",
  "126": "Term Loan",
  "127": "MSME Loan",
  "128": "Student / Higher Education Loan",
  "129": "Others",
};

export const CBK_FACILITY_TYPE_BUSINESS: Record<string, string> = {
  "101": "Agriculture / Agri-Business Facility",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "105": "Corporate Credit Card",
  "108": "Hire Purchase / Asset Finance",
  "109": "Commercial Mortgage",
  "110": "Equipment Leasing",
  "111": "Letter of Credit",
  "119": "Unsecured Business Loan",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "124": "Commercial Property Loan",
  "126": "Term Loan",
  "127": "MSME Loan",
  "129": "Others",
};

export const CBK_REPAYMENT_FREQUENCY: Record<string, string> = {
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

export const CBK_ASSET_CLASSIFICATION: Record<string, string> = {
  "NM": "Normal (1-30 days)",
  "WA": "Watch (31-90 days)",
  "SS": "Substandard (91-180 days)",
  "DT": "Doubtful (181-360 days)",
  "LO": "Loss (360+ days)",
};

export const CBK_ACCOUNT_STATUS: Record<string, string> = {
  "A": "Active / Performing",
  "C": "Closed",
  "D": "Disputed",
  "L": "Loss / Written-off",
  "R": "Restructured",
  "W": "Written-off",
};

export const CBK_SECTOR_CODE: Record<string, string> = {
  "AGR": "Agriculture, Forestry & Fishing",
  "MIN": "Mining & Quarrying",
  "MFG": "Manufacturing",
  "UTL": "Electricity, Gas & Water",
  "CON": "Construction",
  "TRD": "Trade",
  "TRP": "Transport & Communications",
  "FIN": "Finance & Insurance",
  "SRV": "Services",
  "TRS": "Tourism & Related Services",
  "EDU": "Education",
  "HLT": "Health",
};

export const CBK_FILE_IDENTIFIERS = {
  CONC: "Consumer Credit",
  BUSC: "Business Credit",
  CONJ: "Consumer Judgment",
  BUSJ: "Business Judgment",
  COND: "Consumer Dishonoured Cheque",
  BUSD: "Business Dishonoured Cheque",
} as const;

export type CbkFileType = keyof typeof CBK_FILE_IDENTIFIERS;

export function mapInternalStatusToCbk(status: string): string {
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

export function mapInternalAssetClassToCbk(classification: string | null | undefined): string {
  if (!classification) return "NM";
  const mapping: Record<string, string> = {
    "Pass": "NM",
    "OLEM": "WA",
    "Substandard": "SS",
    "Doubtful": "DT",
    "Loss": "LO",
  };
  return mapping[classification] || "NM";
}

export function mapDaysInArrearsToPaymentProfileCbk(days: number): string {
  if (days <= 30) return "0";
  if (days <= 60) return "1";
  if (days <= 90) return "2";
  if (days <= 120) return "3";
  if (days <= 180) return "4";
  return "5";
}

export function formatCbkDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "").substring(0, 8);
}

export function formatCbkAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return Math.round(num).toString();
}

export function generateCbkFilename(
  srn: string,
  reportingDate: string,
  fileCreatedDate: string,
  fileId: CbkFileType,
  sequenceNum: number
): string {
  return `${srn}-${reportingDate}-${fileCreatedDate}-1.1-${fileId}-${sequenceNum}-CBK.csv`;
}
