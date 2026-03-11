export const BSL_CREDIT_FACILITY_TYPE_CONSUMER: Record<string, string> = {
  "101": "Agriculture Facility",
  "102": "Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "106": "Credit Card",
  "107": "Education Loan",
  "108": "Hire Purchase",
  "109": "Housing Loan",
  "110": "Leasing",
  "111": "Letter of Credit",
  "112": "Loan against Bank Deposit",
  "113": "Loan against Employee Benefits",
  "114": "Loan against Insurance Policy",
  "115": "Loan against Salary/Payroll Loan",
  "116": "Loan against Shares and Securities",
  "117": "Loan to Professional",
  "118": "Mortgage",
  "119": "Non-secured Loans",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "122": "Personal Loan",
  "123": "Pledge Loan",
  "124": "Property Loan",
  "125": "Government Loans",
  "126": "Term Loans",
  "127": "Travel Finance",
  "128": "Student Loan",
  "129": "Microfinance Loan",
  "130": "Mobile Money Loan",
  "199": "Others",
};

export const BSL_CREDIT_FACILITY_TYPE_BUSINESS: Record<string, string> = {
  "101": "Agriculture Facility",
  "102": "Auto Loan",
  "103": "Bank Guarantee",
  "104": "Bills Discounted",
  "105": "Corporate Credit Card",
  "108": "Hire Purchase",
  "109": "Housing Loan",
  "110": "Leasing",
  "111": "Letter of Credit",
  "112": "Loan against Bank Deposit",
  "116": "Loan against Shares and Securities",
  "118": "Mortgage",
  "119": "Non-secured Loans",
  "120": "Other Secured Loans",
  "121": "Overdraft",
  "124": "Property Loan",
  "126": "Term Loans",
  "129": "Microfinance Loan",
  "199": "Others",
};

export const BSL_REPAYMENT_FREQUENCY: Record<string, string> = {
  "10": "Weekly",
  "11": "Bi Monthly",
  "12": "Monthly",
  "13": "Quarterly",
  "14": "Tri Annually",
  "15": "Semi Annually",
  "16": "Annual",
  "17": "Variable",
  "18": "Bullet (One payment)",
  "19": "Demand (Revolving)",
  "20": "Unspecified",
  "21": "Balloon",
};

export const BSL_ASSET_CLASSIFICATION: Record<string, string> = {
  "A": "Current (1-30 days)",
  "B": "OLEM (31-90 days)",
  "C": "Substandard (91-180 days)",
  "D": "Doubtful (181-360 days)",
  "E": "Loss (Over 360 days)",
};

export const BSL_ACCOUNT_STATUS: Record<string, string> = {
  "A": "Open/Active",
  "B": "Approved, but not disbursed",
  "C": "Closed",
  "D": "Disputed",
  "E": "Terms Extended",
  "G": "Charge-off",
  "L": "Handed Over/Legal",
  "N": "Loan against Policy",
  "P": "Paid Up",
  "R": "Restructured/Rescheduled",
  "T": "Early Settlement",
  "W": "Written Off",
  "Z": "Deceased",
};

export const BSL_EMPLOYMENT_TYPE: Record<string, string> = {
  "101": "Salaried Individual",
  "102": "Unemployed",
  "103": "Student",
  "104": "Self Employed",
  "105": "Home Maker",
  "106": "Pensioner",
  "107": "Artisanal Miner",
};

export const BSL_OWNER_TENANT: Record<string, string> = {
  "O": "Owner",
  "T": "Tenant",
  "F": "Family Owned",
};

export const BSL_MARITAL_STATUS: Record<string, string> = {
  "S": "Single",
  "W": "Widowed",
  "D": "Divorced",
  "M": "Married",
  "P": "Separated",
};

export const BSL_PURPOSE_OF_FACILITY: Record<string, string> = {
  "A": "Crisis Loan",
  "B": "Home Loans",
  "C": "Other Asset acquisition financing",
  "D": "Project Finance",
  "E": "Capital finance",
  "F": "Equipment and Machinery Finance",
  "G": "Working capital finance",
  "H": "Subscription finance",
  "J": "Finance for Trading in securities",
  "K": "Consolidation Loan",
  "L": "Other",
  "P": "Personal finance",
  "S": "Study Loan",
  "M": "Microenterprise finance",
};

export const BSL_CLOSURE_REASON: Record<string, string> = {
  "A": "By Credit Grantor without prejudice to the Subject",
  "B": "Balance Transfer",
  "C": "Death",
  "D": "End of Credit Facility Tenure",
  "E": "Merger of Credit Facility",
  "F": "Early Settlement by Subject",
  "G": "By Court Order",
  "H": "Lost Cards/Compromised Cards",
  "J": "Bankruptcy",
  "K": "Restructured/Rescheduled",
};

export const BSL_REASON_WRITTEN_OFF: Record<string, string> = {
  "A": "Part Settlement",
  "B": "Death",
  "C": "Unable to locate",
  "D": "Government Concession",
  "E": "Bankruptcy",
  "F": "Other",
};

export const BSL_REASON_RESTRUCTURE: Record<string, string> = {
  "T": "Request for top ups",
  "E": "Irregular repayments",
  "L": "Loss of job",
  "D": "Business down turn",
  "F": "Force majeure",
  "C": "Other",
};

export const BSL_SECURITY_TYPE: Record<string, string> = {
  "A": "Land",
  "B": "Shares",
  "C": "Government Bonds/Securities",
  "D": "Building",
  "E": "Cash/Fixed Deposit",
  "F": "Bank Guarantee",
  "G": "Salary Assignment",
  "H": "Terminal Benefits Assignment",
  "J": "Bullions (Minerals)",
  "K": "General Plant & Machinery",
  "L": "Vehicles",
  "M": "Corporate Guarantee",
  "N": "Individual Guarantee",
  "P": "Government Guarantee",
  "Q": "Mining License",
  "R": "Others",
};

export const BSL_BUSINESS_TYPE: Record<string, string> = {
  "A": "Sole Proprietorship",
  "B": "Limited Partnership",
  "C": "Company Limited By Shares",
  "D": "Company Limited By Guarantee",
  "E": "Unlimited Company",
  "F": "Cooperative",
  "G": "Foreign/External Company",
  "H": "Consultancy Firms/Professional Bodies",
  "J": "Social Organization",
  "K": "International Organizations",
  "L": "NGO",
};

export const BSL_SECTOR_INDUSTRY: Record<string, string> = {
  "10": "Agriculture, Forestry & Fishing",
  "20": "Mining & Quarrying",
  "30": "Manufacturing",
  "40": "Construction",
  "50": "Electricity, Gas & Water",
  "60": "Commerce & Finance",
  "70": "Transport, Storage and Communication",
  "80": "Services",
};

export const BSL_SUB_SECTOR: Record<string, string> = {
  "101": "Rice Farming",
  "102": "Cocoa Production",
  "103": "Coffee Production",
  "104": "Other Agriculture",
  "105": "Forestry",
  "106": "Logging & Timber",
  "107": "Fishing",
  "201": "Diamond Mining",
  "202": "Iron Ore",
  "203": "Rutile Mining",
  "204": "Bauxite Mining",
  "205": "Gold Mining",
  "206": "Artisanal Mining",
  "207": "Other Mining Activity",
  "301": "Food, Drink & Tobacco",
  "302": "Textiles, Clothing & Footwear",
  "303": "Sawmilling & Wood Processing",
  "304": "Paper & Paper products",
  "305": "Chemicals",
  "306": "Metal Processing",
  "309": "Other Manufacturing",
  "401": "Construction & Works",
  "402": "Building Construction",
  "501": "Electric light & Power",
  "502": "Water Supply",
  "601": "Import Trade",
  "602": "Export Trade",
  "603": "Domestic Trade",
  "604": "Financial Services",
  "701": "Road transport",
  "702": "Water transport",
  "703": "Air transport",
  "704": "Storage and warehousing",
  "705": "Communications",
  "801": "Business Services",
  "802": "Tourism & Hospitality",
  "803": "Personal Services",
  "804": "Government Services",
  "805": "Salary Credit",
};

export const BSL_PAYMENT_HISTORY_PROFILE: Record<string, string> = {
  "0": "Current (1-30 days)",
  "1": "31-60 days past due",
  "2": "61-90 days past due",
  "3": "91-120 days past due",
  "4": "121-180 days past due",
  "5": "180+ days past due",
};

export const BSL_CASE_TYPE: Record<string, string> = {
  "A": "Civil",
  "B": "Criminal",
  "C": "Commercial",
  "D": "Family",
  "E": "Labour",
};

export const BSL_CASE_REASON: Record<string, string> = {
  "F": "Fraud",
  "R": "Debt Recovery",
  "O": "Other",
};

export const BSL_CHEQUE_RETURN_REASON: Record<string, string> = {
  "11": "Insufficient Funds",
  "12": "Fraud",
  "13": "Account Closed",
  "14": "Stale Cheque",
};

export const BSL_SPECIAL_COMMENTS: Record<string, string> = {
  "101": "Paid by Co maker",
  "102": "Loan assumed by another party",
  "103": "Account closed at credit grantor's request",
  "104": "Accounts transferred to another lender",
  "105": "Adjustment pending",
  "106": "Paying under a partial payment agreement",
  "107": "Purchased by another lender",
  "108": "Payroll deduction",
  "109": "Credit Line suspended",
  "110": "Account closed due to refinance",
  "111": "Account closed due to Transfer",
  "112": "Account paid in full for less than the full balance",
  "113": "First payment never received",
  "114": "Account paid from collateral",
  "115": "Principal deferred/Interest payment only",
};

export const BSL_LEGAL_FLAG: Record<string, string> = {
  "101": "No",
  "102": "Yes",
};

export const BSL_NATURE_OF_GUARANTOR: Record<string, string> = {
  "101": "Individual",
  "102": "Commercial Entity",
  "103": "No Guarantor",
};

export const BSL_NATURE_OF_CHARGE: Record<string, string> = {
  "A": "Fixed",
  "B": "Float",
};

export const BSL_OTHER_ID_TYPE: Record<string, string> = {
  "NCRA": "NCRA National ID",
  "NIN": "National Identification Number",
  "STAFF": "Staff ID",
  "STUD": "Student ID",
  "NASSIT": "NASSIT Number",
};

export const BSL_PROOF_OF_ADDRESS: Record<string, string> = {
  "WAT": "Water Bill (GVWC)",
  "ELE": "Electricity Bill (EDSA)",
  "BNK": "Bank Statement",
  "TEN": "Tenancy Agreement",
};

export const BSL_COLLATERAL_INDICATOR: Record<string, string> = {
  "101": "Yes",
  "102": "No",
};

export const BSL_FILE_IDENTIFIERS = {
  CONC: "Consumer Credit",
  BUSC: "Business Credit",
  CONJ: "Consumer Judgment",
  BUSJ: "Business Judgment",
  COND: "Consumer Dishonoured Cheque",
  BUSD: "Business Dishonoured Cheque",
} as const;

export type BslFileType = keyof typeof BSL_FILE_IDENTIFIERS;

export function mapInternalStatusToBsl(status: string): string {
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

export function mapInternalAssetClassToBsl(classification: string | null | undefined): string {
  if (!classification) return "A";
  const mapping: Record<string, string> = {
    "Pass": "A",
    "OLEM": "B",
    "Substandard": "C",
    "Doubtful": "D",
    "Loss": "E",
  };
  return mapping[classification] || "A";
}

export function mapDaysInArrearsToPaymentProfileBsl(days: number): string {
  if (days <= 30) return "0";
  if (days <= 60) return "1";
  if (days <= 90) return "2";
  if (days <= 120) return "3";
  if (days <= 180) return "4";
  return "5";
}

export function formatBslDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "").substring(0, 8);
}

export function formatBslAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return Math.round(num).toString();
}

export function generateBslFilename(
  srn: string,
  reportingDate: string,
  fileCreatedDate: string,
  fileId: BslFileType,
  sequenceNum: number
): string {
  return `${srn}-${reportingDate}-${fileCreatedDate}-1.0-${fileId}-${sequenceNum}.csv`;
}
