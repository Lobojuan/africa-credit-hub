export const STANDARD_CREDIT_TYPES = [
  { value: "Personal Loan", label: "Personal Loan", category: "personal" },
  { value: "Mortgage/Housing Loan", label: "Mortgage / Housing Loan", category: "personal" },
  { value: "Vehicle Loan", label: "Vehicle Loan", category: "personal" },
  { value: "Credit Card", label: "Credit Card", category: "personal" },
  { value: "Overdraft", label: "Overdraft", category: "personal" },
  { value: "Student Loan", label: "Student Loan", category: "personal" },
  { value: "Salary Advance", label: "Salary Advance / Loan Against Salary", category: "personal" },
  { value: "Staff Loan", label: "Staff Loan", category: "personal" },
  { value: "Microfinance Loan", label: "Microfinance Loan", category: "personal" },
  { value: "Group Loan", label: "Group Loan", category: "personal" },
  { value: "Business Loan", label: "Business Loan", category: "business" },
  { value: "Corporate Loan", label: "Corporate Loan", category: "business" },
  { value: "Trade Finance", label: "Trade Finance", category: "business" },
  { value: "Agricultural Loan", label: "Agricultural Loan", category: "business" },
  { value: "Lease Finance", label: "Lease Finance", category: "business" },
  { value: "Letter of Credit", label: "Letter of Credit", category: "business" },
  { value: "Bond/Guarantee", label: "Bond / Guarantee", category: "business" },
  { value: "Telco Credit", label: "Telco Credit", category: "personal" },
  { value: "Utility Credit", label: "Utility Credit", category: "personal" },
  { value: "Other", label: "Other", category: "personal" },
] as const;

export type StandardCreditType = (typeof STANDARD_CREDIT_TYPES)[number]["value"];

export const CREDIT_CATEGORIES = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
] as const;

export const BUSINESS_CREDIT_TYPES = STANDARD_CREDIT_TYPES
  .filter(t => t.category === "business")
  .map(t => t.value);

export const CREDIT_TYPE_SYNONYMS: Record<string, string> = {
  "personal_loan": "Personal Loan",
  "business_loan": "Business Loan",
  "mortgage": "Mortgage/Housing Loan",
  "housing loan": "Mortgage/Housing Loan",
  "housing_loan": "Mortgage/Housing Loan",
  "overdraft": "Overdraft",
  "microfinance": "Microfinance Loan",
  "microfinance_loan": "Microfinance Loan",
  "trade_finance": "Trade Finance",
  "vehicle_loan": "Vehicle Loan",
  "agricultural_loan": "Agricultural Loan",
  "credit_card": "Credit Card",
  "corporate_loan": "Corporate Loan",
  "term loan": "Personal Loan",
  "loan against salary": "Salary Advance",
  "staff loan": "Staff Loan",
  "group loan": "Group Loan",
  "lease": "Lease Finance",
  "guarantee": "Bond/Guarantee",
  "letter of credit": "Letter of Credit",
  "bond": "Bond/Guarantee",
  "telco credit": "Telco Credit",
  "utility credit": "Utility Credit",
};

export function normalizeAccountType(raw: string): string {
  if (!raw) return "Other";
  const lower = raw.toLowerCase().trim();
  if (CREDIT_TYPE_SYNONYMS[lower]) return CREDIT_TYPE_SYNONYMS[lower];
  const exact = STANDARD_CREDIT_TYPES.find(t => t.value.toLowerCase() === lower);
  if (exact) return exact.value;
  return raw;
}

export function inferCreditCategory(accountType: string): "personal" | "business" {
  const entry = STANDARD_CREDIT_TYPES.find(t => t.value === accountType);
  return (entry?.category as "personal" | "business") || "personal";
}
