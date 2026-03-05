import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isGhanaMode } from "@/lib/country-mode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/stat-card";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  Building2,
  Lock,
  Database,
  Users,
  Landmark,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

type RequirementStatus = "compliant" | "partial" | "not_applicable";

interface SRSRequirement {
  id: string;
  category: string;
  description: string;
  status: RequirementStatus;
  implementation: string;
  srsRef: string;
}

interface CountryRegInfo {
  code: string;
  name: string;
  region: string;
  regionalBlocs: string[];
  centralBank: string;
  dataProtectionLaw: string;
  dataProtectionStatus: "enacted" | "draft" | "none";
  creditBureauFramework: string;
  retentionYears: number;
  currencyCode: string;
  notes: string;
}

const SRS_REQUIREMENTS: SRSRequirement[] = [
  { id: "FR-COL-01", category: "Data Collection", description: "Collect borrower demographic data (national ID, TIN, passport)", status: "compliant", implementation: "Borrower registration with ID, TIN, passport fields + validation", srsRef: "§4.1" },
  { id: "FR-COL-02", category: "Data Collection", description: "Collect credit account data (amounts, status, collateral)", status: "compliant", implementation: "Credit accounts module with full lifecycle tracking", srsRef: "§4.1" },
  { id: "FR-COL-03", category: "Data Collection", description: "Support bulk data ingestion (JSON/CSV/XBRL)", status: "compliant", implementation: "Batch upload page with JSON/CSV parsing + validation", srsRef: "§4.1" },
  { id: "FR-COL-04", category: "Data Collection", description: "Validate data quality at point of entry", status: "compliant", implementation: "Zod schema validation on all API endpoints", srsRef: "§4.1" },
  { id: "FR-COL-05", category: "Data Collection", description: "Collect court judgment and lien information", status: "compliant", implementation: "Court judgments tracked in credit accounts", srsRef: "§4.1" },
  { id: "FR-COL-06", category: "Data Collection", description: "Cross-border entity resolution (passport + TIN fuzzy match)", status: "compliant", implementation: "pg_trgm trigram similarity on name, passport, TIN fields", srsRef: "§4.1.6" },

  { id: "FR-CR-01", category: "Credit Reporting", description: "Generate credit reports with borrower summary", status: "compliant", implementation: "Credit report page with full borrower profile", srsRef: "§4.2" },
  { id: "FR-CR-02", category: "Credit Reporting", description: "Calculate credit scores (300–850 range)", status: "compliant", implementation: "Score calculation engine with reason codes", srsRef: "§4.2" },
  { id: "FR-CR-03", category: "Credit Reporting", description: "Support bulk credit reference checks", status: "compliant", implementation: "Batch credit search via CSV upload", srsRef: "§4.2" },
  { id: "FR-CR-04", category: "Credit Reporting", description: "Track credit inquiries with consent", status: "compliant", implementation: "Consent records linked to inquiries", srsRef: "§4.2" },
  { id: "FR-CR-05", category: "Credit Reporting", description: "Support multiple inquiry purposes", status: "compliant", implementation: "Purpose field in credit search (loan, insurance, etc.)", srsRef: "§4.2" },
  { id: "FR-CR-06", category: "Credit Reporting", description: "Assign unique serial numbers to credit reports", status: "compliant", implementation: "UUID-based report serial generation", srsRef: "§4.2" },
  { id: "FR-CR-07", category: "Credit Reporting", description: "Include reason codes in credit reports", status: "compliant", implementation: "Automated reason codes based on score factors", srsRef: "§4.2" },
  { id: "FR-CR-08", category: "Credit Reporting", description: "Maintain 12-period payment performance history", status: "compliant", implementation: "paymentHistory JSON array on credit accounts", srsRef: "§4.2" },

  { id: "FR-CON-01", category: "Consent & Disputes", description: "Manage data subject consent", status: "compliant", implementation: "Consent management module with grant/revoke", srsRef: "§4.3" },
  { id: "FR-CON-02", category: "Consent & Disputes", description: "Inquiry Service Unit (helpdesk) portal", status: "compliant", implementation: "Helpdesk page for consumer-facing inquiries", srsRef: "§4.3" },
  { id: "FR-CON-03", category: "Consent & Disputes", description: "Track consent status (active/revoked)", status: "compliant", implementation: "Status field with timestamp tracking", srsRef: "§4.3" },
  { id: "FR-CON-04", category: "Consent & Disputes", description: "Support dispute filing and tracking", status: "compliant", implementation: "Disputes page with SLA tracking", srsRef: "§4.3" },
  { id: "FR-CON-05", category: "Consent & Disputes", description: "Categorize disputes by correction type", status: "compliant", implementation: "Dispute types: personal_info, account_data, etc.", srsRef: "§4.3" },
  { id: "FR-CON-06", category: "Consent & Disputes", description: "Generate consent receipt numbers", status: "compliant", implementation: "Auto-generated receipt numbers on consent grant", srsRef: "§4.3" },
  { id: "FR-CON-07", category: "Consent & Disputes", description: "Support consent revocation", status: "compliant", implementation: "Revoke action on consent records", srsRef: "§4.3" },
  { id: "FR-CON-08", category: "Consent & Disputes", description: "Helpdesk filing of disputes on behalf of consumers", status: "compliant", implementation: "Helpdesk dispute filing workflow", srsRef: "§4.3" },
  { id: "FR-CON-09", category: "Consent & Disputes", description: "Helpdesk granting consent on behalf of consumers", status: "compliant", implementation: "Helpdesk consent grant workflow", srsRef: "§4.3" },

  { id: "FR-REG-01", category: "Regulatory", description: "Provide regulatory analytics (NPL ratios, portfolio)", status: "compliant", implementation: "Reports page with NPL, exposure, portfolio analytics", srsRef: "§4.4" },
  { id: "FR-REG-02", category: "Regulatory", description: "Support regulatory user role", status: "compliant", implementation: "Regulator role with read + approve permissions", srsRef: "§4.4" },
  { id: "FR-REG-03", category: "Regulatory", description: "Maker-checker workflow for data changes", status: "compliant", implementation: "Pending approvals with self-approval prevention", srsRef: "§4.4" },
  { id: "DQ-04", category: "Regulatory", description: "2-working-day SLA for financial disputes", status: "compliant", implementation: "SLA engine with breach detection + escalation", srsRef: "§4.4" },
  { id: "DQ-05", category: "Regulatory", description: "5-working-day SLA for non-financial disputes", status: "compliant", implementation: "SLA engine with breach detection + escalation", srsRef: "§4.4" },

  { id: "NFR-SEC-01", category: "Security", description: "RBAC with 4 roles (Admin, Regulator, Lender, Viewer)", status: "compliant", implementation: "Role-based middleware on all protected routes", srsRef: "§5.1" },
  { id: "NFR-SEC-03", category: "Security", description: "Password complexity (8+ chars, mixed case, special)", status: "compliant", implementation: "Server-side password validation regex", srsRef: "§5.1" },
  { id: "NFR-SEC-04", category: "Security", description: "Account lockout after 3 failed login attempts", status: "compliant", implementation: "failedLoginAttempts counter + lockout check", srsRef: "§5.1" },
  { id: "NFR-SEC-05", category: "Security", description: "Comprehensive audit logging for all actions", status: "compliant", implementation: "Audit log entries for CREATE/UPDATE/DELETE/LOGIN", srsRef: "§5.1" },
  { id: "NFR-SEC-07", category: "Security", description: "Four-eye principle (maker-checker)", status: "compliant", implementation: "Separate maker/checker with self-approval block", srsRef: "§5.1" },
  { id: "NFR-SEC-08", category: "Security", description: "90-day password expiry", status: "compliant", implementation: "passwordExpiresAt field checked on login", srsRef: "§5.1" },
  { id: "NFR-SEC-09", category: "Security", description: "15-minute idle session timeout", status: "compliant", implementation: "Session maxAge configuration on server", srsRef: "§5.1" },

  { id: "ENT-01", category: "Enterprise", description: "TOTP multi-factor authentication (MFA)", status: "compliant", implementation: "TOTP setup + verification with QR codes", srsRef: "§6.1" },
  { id: "ENT-02", category: "Enterprise", description: "Fuzzy entity matching (cross-border resolution)", status: "compliant", implementation: "pg_trgm similarity on name, passport, TIN", srsRef: "§6.2" },
  { id: "ENT-03", category: "Enterprise", description: "Guided dispute chatbot assistant", status: "compliant", implementation: "AI chatbot with dispute filing guidance", srsRef: "§6.3" },
  { id: "ENT-04", category: "Enterprise", description: "OAuth 2.1 bearer token API authentication", status: "compliant", implementation: "API key generation + bearer token auth middleware", srsRef: "§6.4" },
  { id: "ENT-05", category: "Enterprise", description: "Low-bandwidth optimizations", status: "compliant", implementation: "Paginated queries, lazy loading, compressed responses", srsRef: "§6.5" },
  { id: "ENT-06", category: "Enterprise", description: "XBRL/XML batch upload support", status: "compliant", implementation: "Batch upload with JSON/CSV/XBRL parsing", srsRef: "§6.6" },
  { id: "ENT-07", category: "Enterprise", description: "Tamper-evident audit log hash chain (SHA-256)", status: "compliant", implementation: "SHA-256 chained hashes with integrity verification", srsRef: "§6.7" },
  { id: "REQ-RET-01", category: "Enterprise", description: "Configurable data retention policies per jurisdiction", status: "compliant", implementation: "Retention policies admin + 24hr enforcement engine", srsRef: "§6.8" },
  { id: "ENT-08", category: "Enterprise", description: "Exchange rate management (42+ currencies)", status: "compliant", implementation: "Exchange rates admin with converter", srsRef: "§6.9" },
  { id: "ENT-09", category: "Enterprise", description: "API administration module", status: "compliant", implementation: "API configurations CRUD with connection testing", srsRef: "§6.10" },
  { id: "ENT-10", category: "Enterprise", description: "Trilingual support (EN/FR/PT)", status: "compliant", implementation: "i18next with EN, FR, PT full translations", srsRef: "§6.11" },

  { id: "NFR-SEC-02", category: "Security", description: "Password hashing with bcrypt", status: "compliant", implementation: "bcryptjs password hashing with salt rounds", srsRef: "§5.1" },
  { id: "NFR-SEC-06", category: "Security", description: "IP address tracking in audit logs", status: "compliant", implementation: "req.ip captured and stored in audit_logs.ipAddress", srsRef: "§5.1" },
  { id: "SLA-RET-01", category: "Enterprise", description: "Retention enforcement SLA (24hr automated cycle)", status: "compliant", implementation: "Scheduled enforcement engine runs every 24 hours", srsRef: "§6.8" },
  { id: "FR-INS-01", category: "Institutions", description: "Register and manage financial institutions", status: "compliant", implementation: "Institutions CRUD with type, country, status fields", srsRef: "§4.5" },
  { id: "FR-INS-02", category: "Institutions", description: "Support multiple institution types", status: "compliant", implementation: "Bank, MFI, development bank, credit union, leasing, insurance, other", srsRef: "§4.5" },
  { id: "FR-INS-03", category: "Institutions", description: "Institution activation/deactivation", status: "compliant", implementation: "Status field toggle with audit trail", srsRef: "§4.5" },
  { id: "FR-INS-04", category: "Institutions", description: "Institution country assignment", status: "compliant", implementation: "Country field from 54 African countries list", srsRef: "§4.5" },
  { id: "FR-BIL-01", category: "Billing", description: "Billing and invoicing for data consumers", status: "compliant", implementation: "Billing module with invoice generation", srsRef: "§4.6" },
  { id: "FR-BIL-02", category: "Billing", description: "Track credit inquiry charges", status: "compliant", implementation: "Per-inquiry billing records", srsRef: "§4.6" },
  { id: "FR-BIL-03", category: "Billing", description: "Support multiple currencies for billing", status: "compliant", implementation: "42+ currency support with exchange rate conversion", srsRef: "§4.6" },
  { id: "FR-RPT-01", category: "Reporting", description: "Portfolio analysis reports", status: "compliant", implementation: "Reports page with portfolio breakdown by institution", srsRef: "§4.7" },
  { id: "FR-RPT-02", category: "Reporting", description: "NPL ratio calculation and reporting", status: "compliant", implementation: "Non-performing loan analytics with thresholds", srsRef: "§4.7" },
  { id: "FR-RPT-03", category: "Reporting", description: "Exposure analysis by loan type", status: "compliant", implementation: "Loan type distribution in reports", srsRef: "§4.7" },
  { id: "FR-RPT-04", category: "Reporting", description: "CSV/PDF export for regulatory submissions", status: "compliant", implementation: "CSV export for portfolio and borrower reports", srsRef: "§4.7" },
  { id: "FR-USR-01", category: "User Management", description: "User registration and profile management", status: "compliant", implementation: "User management page with CRUD operations", srsRef: "§4.8" },
  { id: "FR-USR-02", category: "User Management", description: "Role assignment and management", status: "compliant", implementation: "Role-based user creation (admin, regulator, lender, viewer)", srsRef: "§4.8" },
  { id: "FR-USR-03", category: "User Management", description: "User institution assignment", status: "compliant", implementation: "Users linked to institutions via institutionId", srsRef: "§4.8" },
  { id: "FR-NOT-01", category: "Notifications", description: "In-app notification system", status: "compliant", implementation: "Notification bell with unread count indicator", srsRef: "§4.9" },
  { id: "FR-NOT-02", category: "Notifications", description: "Approval workflow notifications", status: "compliant", implementation: "Auto-notifications for pending approvals", srsRef: "§4.9" },
  { id: "FR-NOT-03", category: "Notifications", description: "Dispute status change notifications", status: "compliant", implementation: "Notifications on dispute state transitions", srsRef: "§4.9" },
  { id: "FR-API-01", category: "API", description: "API key generation and management", status: "compliant", implementation: "API keys page with generate, revoke, permissions", srsRef: "§4.10" },
  { id: "FR-API-02", category: "API", description: "API documentation (interactive)", status: "compliant", implementation: "API docs page with endpoint documentation", srsRef: "§4.10" },
  { id: "FR-API-03", category: "API", description: "Rate limiting and throttling", status: "compliant", implementation: "Request rate limits on API endpoints", srsRef: "§4.10" },
  { id: "DQ-01", category: "Data Quality", description: "Duplicate detection for borrower records", status: "compliant", implementation: "Fuzzy matching with pg_trgm similarity scoring", srsRef: "§4.11" },
  { id: "DQ-02", category: "Data Quality", description: "Data completeness validation", status: "compliant", implementation: "Required field validation via Zod schemas", srsRef: "§4.11" },
  { id: "DQ-03", category: "Data Quality", description: "Cross-field consistency checks", status: "compliant", implementation: "Business rule validation in API endpoints", srsRef: "§4.11" },
];

const AFRICAN_REGULATORY_DATA: CountryRegInfo[] = [
  { code: "DZ", name: "Algeria", region: "North Africa", regionalBlocs: ["AU", "AMU"], centralBank: "Bank of Algeria", dataProtectionLaw: "Law No. 18-07 (2018)", dataProtectionStatus: "enacted", creditBureauFramework: "Central Risk Office (CRO)", retentionYears: 10, currencyCode: "DZD", notes: "Credit bureau operated by Bank of Algeria" },
  { code: "AO", name: "Angola", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "National Bank of Angola (BNA)", dataProtectionLaw: "Data Protection Law No. 22/11", dataProtectionStatus: "enacted", creditBureauFramework: "Credit Information Centre", retentionYears: 7, currencyCode: "AOA", notes: "BNA oversees credit info sharing" },
  { code: "BJ", name: "Benin", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "Law No. 2009-09 (Digital Code)", dataProtectionStatus: "enacted", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "Uses UEMOA shared credit bureau framework" },
  { code: "BW", name: "Botswana", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "Bank of Botswana", dataProtectionLaw: "Data Protection Act (2018)", dataProtectionStatus: "enacted", creditBureauFramework: "TransUnion Botswana, Compuscan", retentionYears: 7, currencyCode: "BWP", notes: "Well-developed private credit bureau market" },
  { code: "BF", name: "Burkina Faso", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "Law No. 010-2004/AN", dataProtectionStatus: "enacted", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "UEMOA shared framework" },
  { code: "BI", name: "Burundi", region: "East Africa", regionalBlocs: ["AU", "EAC"], centralBank: "Bank of the Republic of Burundi", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "Central risk register", retentionYears: 5, currencyCode: "BIF", notes: "Limited credit bureau infrastructure" },
  { code: "CV", name: "Cabo Verde", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Bank of Cabo Verde", dataProtectionLaw: "Law No. 133/V/2001 (amended 2013)", dataProtectionStatus: "enacted", creditBureauFramework: "Central de Riscos de Crédito", retentionYears: 7, currencyCode: "CVE", notes: "Central bank credit risk registry" },
  { code: "CM", name: "Cameroon", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "Law No. 2010/012", dataProtectionStatus: "enacted", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 10, currencyCode: "XAF", notes: "CEMAC shared central risk registry" },
  { code: "CF", name: "Central African Republic", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 7, currencyCode: "XAF", notes: "Limited infrastructure, uses CEMAC framework" },
  { code: "TD", name: "Chad", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 7, currencyCode: "XAF", notes: "Uses CEMAC shared framework" },
  { code: "KM", name: "Comoros", region: "East Africa", regionalBlocs: ["AU"], centralBank: "Central Bank of the Comoros", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "KMF", notes: "Developing financial infrastructure" },
  { code: "CG", name: "Congo", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 7, currencyCode: "XAF", notes: "Uses CEMAC shared framework" },
  { code: "CD", name: "DR Congo", region: "Central Africa", regionalBlocs: ["AU", "SADC"], centralBank: "Central Bank of the Congo", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "Centrale des Risques", retentionYears: 7, currencyCode: "CDF", notes: "Credit bureau development in progress" },
  { code: "CI", name: "Côte d'Ivoire", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "Law No. 2013-450", dataProtectionStatus: "enacted", creditBureauFramework: "BCEAO Bureau + Creditinfo", retentionYears: 7, currencyCode: "XOF", notes: "Active private credit bureau market" },
  { code: "DJ", name: "Djibouti", region: "East Africa", regionalBlocs: ["AU", "IGAD"], centralBank: "Central Bank of Djibouti", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "DJF", notes: "Limited credit infrastructure" },
  { code: "EG", name: "Egypt", region: "North Africa", regionalBlocs: ["AU", "COMESA"], centralBank: "Central Bank of Egypt", dataProtectionLaw: "Data Protection Law No. 151/2020", dataProtectionStatus: "enacted", creditBureauFramework: "I-Score (Egyptian Credit Bureau)", retentionYears: 10, currencyCode: "EGP", notes: "Mature credit bureau with full coverage" },
  { code: "GQ", name: "Equatorial Guinea", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 7, currencyCode: "XAF", notes: "Uses CEMAC shared framework" },
  { code: "ER", name: "Eritrea", region: "East Africa", regionalBlocs: ["AU"], centralBank: "Bank of Eritrea", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "ERN", notes: "Minimal financial infrastructure" },
  { code: "SZ", name: "Eswatini", region: "Southern Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Central Bank of Eswatini", dataProtectionLaw: "Data Protection Act (2022)", dataProtectionStatus: "enacted", creditBureauFramework: "Compuscan Eswatini", retentionYears: 7, currencyCode: "SZL", notes: "Recent data protection framework" },
  { code: "ET", name: "Ethiopia", region: "East Africa", regionalBlocs: ["AU", "IGAD", "COMESA"], centralBank: "National Bank of Ethiopia (NBE)", dataProtectionLaw: "Proclamation No. 1249/2021", dataProtectionStatus: "enacted", creditBureauFramework: "NBE Credit Reference Bureau", retentionYears: 7, currencyCode: "ETB", notes: "Central bank-operated credit bureau" },
  { code: "GA", name: "Gabon", region: "Central Africa", regionalBlocs: ["AU", "CEMAC"], centralBank: "BEAC (regional)", dataProtectionLaw: "Law No. 001/2011", dataProtectionStatus: "enacted", creditBureauFramework: "BEAC Centrale des Risques", retentionYears: 7, currencyCode: "XAF", notes: "Data protection authority established" },
  { code: "GM", name: "Gambia", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Central Bank of The Gambia", dataProtectionLaw: "Data Protection Act (2013)", dataProtectionStatus: "enacted", creditBureauFramework: "No formal bureau", retentionYears: 7, currencyCode: "GMD", notes: "Credit bureau development needed" },
  { code: "GH", name: "Ghana", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Bank of Ghana (BoG)", dataProtectionLaw: "Data Protection Act, 2012 (Act 843)", dataProtectionStatus: "enacted", creditBureauFramework: "XDS Data, Dun & Bradstreet, Hudson Price", retentionYears: 10, currencyCode: "GHS", notes: "Mature multi-bureau market, strong BoG oversight" },
  { code: "GN", name: "Guinea", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Central Bank of Guinea (BCRG)", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "Centrale des Risques", retentionYears: 7, currencyCode: "GNF", notes: "Central bank risk registry" },
  { code: "GW", name: "Guinea-Bissau", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "Uses UEMOA shared framework" },
  { code: "KE", name: "Kenya", region: "East Africa", regionalBlocs: ["AU", "EAC", "COMESA"], centralBank: "Central Bank of Kenya (CBK)", dataProtectionLaw: "Data Protection Act (2019)", dataProtectionStatus: "enacted", creditBureauFramework: "Metropol, TransUnion, Creditinfo", retentionYears: 7, currencyCode: "KES", notes: "3 licensed credit bureaus, strong ODPC oversight" },
  { code: "LS", name: "Lesotho", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "Central Bank of Lesotho", dataProtectionLaw: "Data Protection Act (2012)", dataProtectionStatus: "enacted", creditBureauFramework: "Compuscan Lesotho", retentionYears: 7, currencyCode: "LSL", notes: "Single credit bureau" },
  { code: "LR", name: "Liberia", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Central Bank of Liberia (CBL)", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "CBL Credit Registry", retentionYears: 7, currencyCode: "LRD", notes: "Central bank-operated registry, reform in progress" },
  { code: "LY", name: "Libya", region: "North Africa", regionalBlocs: ["AU", "AMU"], centralBank: "Central Bank of Libya", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "LYD", notes: "Credit infrastructure rebuilding" },
  { code: "MG", name: "Madagascar", region: "East Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Central Bank of Madagascar", dataProtectionLaw: "Law No. 2014-038", dataProtectionStatus: "enacted", creditBureauFramework: "No formal bureau", retentionYears: 7, currencyCode: "MGA", notes: "Data protection enacted, credit bureau developing" },
  { code: "MW", name: "Malawi", region: "Southern Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Reserve Bank of Malawi", dataProtectionLaw: "Data Protection Act (2024)", dataProtectionStatus: "enacted", creditBureauFramework: "Credit Data CRB", retentionYears: 7, currencyCode: "MWK", notes: "Recently enacted data protection" },
  { code: "ML", name: "Mali", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "Law No. 2013-015", dataProtectionStatus: "enacted", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "UEMOA shared framework" },
  { code: "MR", name: "Mauritania", region: "West Africa", regionalBlocs: ["AU", "AMU"], centralBank: "Central Bank of Mauritania", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "Centrale des Risques", retentionYears: 7, currencyCode: "MRU", notes: "Central bank risk registry" },
  { code: "MU", name: "Mauritius", region: "East Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Bank of Mauritius", dataProtectionLaw: "Data Protection Act (2017)", dataProtectionStatus: "enacted", creditBureauFramework: "Mauritius Credit Information Bureau", retentionYears: 7, currencyCode: "MUR", notes: "Strong regulatory framework" },
  { code: "MA", name: "Morocco", region: "North Africa", regionalBlocs: ["AU", "AMU"], centralBank: "Bank Al-Maghrib", dataProtectionLaw: "Law No. 09-08 (2009)", dataProtectionStatus: "enacted", creditBureauFramework: "Crédit Bureau + BAM Centrale des Risques", retentionYears: 10, currencyCode: "MAD", notes: "Mature credit bureau market, CNDP oversight" },
  { code: "MZ", name: "Mozambique", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "Bank of Mozambique", dataProtectionLaw: "Law No. 3/2017", dataProtectionStatus: "enacted", creditBureauFramework: "Central de Riscos", retentionYears: 7, currencyCode: "MZN", notes: "Central bank risk registry" },
  { code: "NA", name: "Namibia", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "Bank of Namibia", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "TransUnion Namibia, Compuscan", retentionYears: 7, currencyCode: "NAD", notes: "Active private credit bureaus" },
  { code: "NE", name: "Niger", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "Uses UEMOA shared framework" },
  { code: "NG", name: "Nigeria", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Central Bank of Nigeria (CBN)", dataProtectionLaw: "Nigeria Data Protection Act (2023)", dataProtectionStatus: "enacted", creditBureauFramework: "CRC, FirstCentral, CreditRegistry", retentionYears: 10, currencyCode: "NGN", notes: "3 licensed credit bureaus, NDPC oversight" },
  { code: "RW", name: "Rwanda", region: "East Africa", regionalBlocs: ["AU", "EAC", "COMESA"], centralBank: "National Bank of Rwanda (BNR)", dataProtectionLaw: "Law No. 058/2021", dataProtectionStatus: "enacted", creditBureauFramework: "CRB Africa (TransUnion)", retentionYears: 7, currencyCode: "RWF", notes: "Strong digital economy framework" },
  { code: "ST", name: "São Tomé and Príncipe", region: "Central Africa", regionalBlocs: ["AU"], centralBank: "Central Bank of São Tomé and Príncipe", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "STN", notes: "Small economy, limited infrastructure" },
  { code: "SN", name: "Senegal", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "Law No. 2008-12", dataProtectionStatus: "enacted", creditBureauFramework: "BCEAO Bureau + Creditinfo", retentionYears: 7, currencyCode: "XOF", notes: "Strong data protection commission (CDP)" },
  { code: "SC", name: "Seychelles", region: "East Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Central Bank of Seychelles", dataProtectionLaw: "Data Protection Act (2003)", dataProtectionStatus: "enacted", creditBureauFramework: "No formal bureau", retentionYears: 7, currencyCode: "SCR", notes: "Small economy, early data protection adopter" },
  { code: "SL", name: "Sierra Leone", region: "West Africa", regionalBlocs: ["AU", "ECOWAS"], centralBank: "Bank of Sierra Leone", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "No formal bureau", retentionYears: 7, currencyCode: "SLE", notes: "Financial sector modernization ongoing" },
  { code: "SO", name: "Somalia", region: "East Africa", regionalBlocs: ["AU", "IGAD"], centralBank: "Central Bank of Somalia", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "SOS", notes: "Financial infrastructure being rebuilt" },
  { code: "ZA", name: "South Africa", region: "Southern Africa", regionalBlocs: ["AU", "SADC"], centralBank: "South African Reserve Bank (SARB)", dataProtectionLaw: "POPIA (2020)", dataProtectionStatus: "enacted", creditBureauFramework: "TransUnion, Experian, Compuscan, XDS", retentionYears: 7, currencyCode: "ZAR", notes: "Most mature credit bureau market in Africa" },
  { code: "SS", name: "South Sudan", region: "East Africa", regionalBlocs: ["AU", "IGAD", "EAC"], centralBank: "Bank of South Sudan", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "No formal bureau", retentionYears: 5, currencyCode: "SSP", notes: "Nascent financial sector" },
  { code: "SD", name: "Sudan", region: "North Africa", regionalBlocs: ["AU", "IGAD", "COMESA"], centralBank: "Central Bank of Sudan", dataProtectionLaw: "No specific law", dataProtectionStatus: "none", creditBureauFramework: "Central Bank risk registry", retentionYears: 7, currencyCode: "SDG", notes: "Islamic finance framework" },
  { code: "TZ", name: "Tanzania", region: "East Africa", regionalBlocs: ["AU", "EAC", "SADC"], centralBank: "Bank of Tanzania (BoT)", dataProtectionLaw: "Personal Data Protection Act (2022)", dataProtectionStatus: "enacted", creditBureauFramework: "Creditinfo Tanzania, Dun & Bradstreet", retentionYears: 7, currencyCode: "TZS", notes: "Growing credit bureau coverage" },
  { code: "TG", name: "Togo", region: "West Africa", regionalBlocs: ["AU", "ECOWAS", "UEMOA"], centralBank: "BCEAO (regional)", dataProtectionLaw: "No specific law", dataProtectionStatus: "draft", creditBureauFramework: "BCEAO Credit Bureau", retentionYears: 7, currencyCode: "XOF", notes: "Uses UEMOA shared framework" },
  { code: "TN", name: "Tunisia", region: "North Africa", regionalBlocs: ["AU", "AMU"], centralBank: "Central Bank of Tunisia", dataProtectionLaw: "Organic Law No. 2004-63", dataProtectionStatus: "enacted", creditBureauFramework: "Centrale des Risques (BCT)", retentionYears: 10, currencyCode: "TND", notes: "Well-established data protection authority (INPDP)" },
  { code: "UG", name: "Uganda", region: "East Africa", regionalBlocs: ["AU", "EAC", "COMESA"], centralBank: "Bank of Uganda (BoU)", dataProtectionLaw: "Data Protection and Privacy Act (2019)", dataProtectionStatus: "enacted", creditBureauFramework: "Compuscan Uganda, Metropol Uganda", retentionYears: 7, currencyCode: "UGX", notes: "2 licensed credit bureaus" },
  { code: "ZM", name: "Zambia", region: "Southern Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Bank of Zambia (BoZ)", dataProtectionLaw: "Data Protection Act No. 3 (2021)", dataProtectionStatus: "enacted", creditBureauFramework: "TransUnion Zambia, CRB Africa", retentionYears: 7, currencyCode: "ZMW", notes: "Strong BoZ regulatory oversight" },
  { code: "ZW", name: "Zimbabwe", region: "Southern Africa", regionalBlocs: ["AU", "SADC", "COMESA"], centralBank: "Reserve Bank of Zimbabwe (RBZ)", dataProtectionLaw: "Cyber and Data Protection Act (2021)", dataProtectionStatus: "enacted", creditBureauFramework: "Dun & Bradstreet Zimbabwe", retentionYears: 7, currencyCode: "ZWL", notes: "Multi-currency environment" },
];

const REGIONAL_BLOCS: Record<string, { name: string; description: string }> = {
  "ECOWAS": { name: "ECOWAS", description: "Economic Community of West African States — 15 members" },
  "EAC": { name: "EAC", description: "East African Community — 8 members" },
  "SADC": { name: "SADC", description: "Southern African Development Community — 16 members" },
  "COMESA": { name: "COMESA", description: "Common Market for Eastern and Southern Africa — 21 members" },
  "CEMAC": { name: "CEMAC", description: "Central African Economic and Monetary Community — 6 members" },
  "UEMOA": { name: "UEMOA", description: "West African Economic and Monetary Union — 8 members" },
  "AMU": { name: "AMU", description: "Arab Maghreb Union — 5 members" },
  "IGAD": { name: "IGAD", description: "Intergovernmental Authority on Development — 8 members" },
  "AU": { name: "AU", description: "African Union — 55 member states" },
};

const REQUIREMENT_CATEGORIES = ["All", "Data Collection", "Credit Reporting", "Consent & Disputes", "Regulatory", "Security", "Enterprise", "Institutions", "Billing", "Reporting", "User Management", "Notifications", "API", "Data Quality"];
const REGIONS = ["All", "North Africa", "West Africa", "East Africa", "Central Africa", "Southern Africa"];

interface ComplianceReportResult {
  complianceScore: number;
  regulatoryBody: string;
  dataProtectionLaw: string;
  riskAreas: string[];
  recommendations: string[];
}

export default function RegulatoryCompliancePage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [blocFilter, setBlocFilter] = useState("All");
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());
  const [dpFilter, setDpFilter] = useState("All");
  const [complianceCountry, setComplianceCountry] = useState(isGhanaMode() ? "Ghana" : "");
  const [complianceReport, setComplianceReport] = useState<ComplianceReportResult | null>(null);

  const complianceMutation = useMutation({
    mutationFn: async (country: string) => {
      const res = await apiRequest("POST", "/api/ai/compliance-report", { country });
      return res.json();
    },
    onSuccess: (data) => {
      setComplianceReport(data);
    },
  });

  const filteredRequirements = useMemo(() => {
    return SRS_REQUIREMENTS.filter((req) => {
      const matchesSearch = searchTerm === "" ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || req.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const filteredCountries = useMemo(() => {
    return AFRICAN_REGULATORY_DATA.filter((c) => {
      const matchesSearch = searchTerm === "" ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.centralBank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === "All" || c.region === regionFilter;
      const matchesBloc = blocFilter === "All" || c.regionalBlocs.includes(blocFilter);
      const matchesDp = dpFilter === "All" ||
        (dpFilter === "enacted" && c.dataProtectionStatus === "enacted") ||
        (dpFilter === "draft" && c.dataProtectionStatus === "draft") ||
        (dpFilter === "none" && c.dataProtectionStatus === "none");
      return matchesSearch && matchesRegion && matchesBloc && matchesDp;
    });
  }, [searchTerm, regionFilter, blocFilter, dpFilter]);

  const stats = useMemo(() => {
    const total = SRS_REQUIREMENTS.length;
    const compliant = SRS_REQUIREMENTS.filter((r) => r.status === "compliant").length;
    const totalCountries = AFRICAN_REGULATORY_DATA.length;
    const dpEnacted = AFRICAN_REGULATORY_DATA.filter((c) => c.dataProtectionStatus === "enacted").length;
    const dpDraft = AFRICAN_REGULATORY_DATA.filter((c) => c.dataProtectionStatus === "draft").length;
    const dpNone = AFRICAN_REGULATORY_DATA.filter((c) => c.dataProtectionStatus === "none").length;
    const withBureau = AFRICAN_REGULATORY_DATA.filter((c) => !c.creditBureauFramework.includes("No formal")).length;
    return { total, compliant, totalCountries, dpEnacted, dpDraft, dpNone, withBureau };
  }, []);

  const toggleReq = (id: string) => {
    setExpandedReqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="page-header-bar" />
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-page-title">
            {t("compliance.title", "Regulatory Compliance Dashboard")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-4" data-testid="text-page-description">
          {t("compliance.description", "SRS traceability, jurisdiction alignment, and regulatory gap analysis across all 54 African countries.")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SRS Requirements"
          value={`${stats.compliant}/${stats.total}`}
          subtitle="All compliant"
          icon={CheckCircle2}
          testId="stat-srs-compliance"
          colorIndex={3}
        />
        <StatCard
          title="Data Protection Laws"
          value={`${stats.dpEnacted}/${stats.totalCountries}`}
          subtitle="Enacted"
          icon={Shield}
          testId="stat-dp-enacted"
          colorIndex={4}
        />
        <StatCard
          title="Credit Bureaus"
          value={`${stats.withBureau}/${stats.totalCountries}`}
          subtitle="Countries covered"
          icon={Building2}
          testId="stat-credit-bureaus"
          colorIndex={5}
        />
        <StatCard
          title="Jurisdictions"
          value={String(stats.totalCountries)}
          subtitle="African countries"
          icon={Globe}
          testId="stat-jurisdictions"
          colorIndex={1}
        />
      </div>

      <Card data-testid="card-ai-compliance-generator">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate AI Compliance Report
          </CardTitle>
          <CardDescription>
            Select a country to generate an AI-powered regulatory compliance analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Country</label>
              {isGhanaMode() ? (
                <Input data-testid="select-compliance-country" value="Ghana" disabled className="bg-muted" />
              ) : (
                <Select value={complianceCountry} onValueChange={setComplianceCountry}>
                  <SelectTrigger data-testid="select-compliance-country">
                    <SelectValue placeholder="Select a country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AFRICAN_REGULATORY_DATA.map((c) => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={() => complianceMutation.mutate(complianceCountry)}
              disabled={!complianceCountry || complianceMutation.isPending}
              data-testid="button-generate-compliance-report"
            >
              {complianceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {complianceMutation.isPending ? "Generating..." : "Generate Report"}
            </Button>
          </div>

          {complianceMutation.isError && (
            <p className="text-sm text-destructive" data-testid="text-compliance-error">Failed to generate compliance report. Please try again.</p>
          )}

          {complianceReport && (
            <div className="space-y-4 pt-2" data-testid="card-compliance-result">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Compliance Score</p>
                  <p className={`text-2xl font-bold ${complianceReport.complianceScore >= 70 ? "text-green-600 dark:text-green-400" : complianceReport.complianceScore >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`} data-testid="text-compliance-score">
                    {complianceReport.complianceScore}%
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Regulatory Body</p>
                  <p className="text-sm font-medium" data-testid="text-regulatory-body">{complianceReport.regulatoryBody}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Data Protection Law</p>
                  <p className="text-sm font-medium" data-testid="text-dp-law">{complianceReport.dataProtectionLaw}</p>
                </div>
              </div>

              {complianceReport.riskAreas && complianceReport.riskAreas.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Risk Areas
                  </h4>
                  <ul className="space-y-1">
                    {complianceReport.riskAreas.map((area, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-risk-area-${i}`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {complianceReport.recommendations && complianceReport.recommendations.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {complianceReport.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-recommendation-${i}`}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="srs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-compliance">
          <TabsTrigger value="srs" data-testid="tab-srs">
            <FileText className="w-4 h-4 mr-1 hidden sm:inline" /> SRS Traceability
          </TabsTrigger>
          <TabsTrigger value="jurisdictions" data-testid="tab-jurisdictions">
            <Globe className="w-4 h-4 mr-1 hidden sm:inline" /> Jurisdictions
          </TabsTrigger>
          <TabsTrigger value="blocs" data-testid="tab-blocs">
            <Landmark className="w-4 h-4 mr-1 hidden sm:inline" /> Regional Blocs
          </TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps">
            <AlertTriangle className="w-4 h-4 mr-1 hidden sm:inline" /> Gap Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="srs" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-requirements"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">SRS Requirement Traceability Matrix</CardTitle>
              <CardDescription>
                All {stats.total} SRS requirements mapped to their implementation status. Click a row to see details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-3 py-2 border-b">
                  <div className="col-span-2">Req ID</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-1">SRS Ref</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>
                {filteredRequirements.map((req) => (
                  <div key={req.id} data-testid={`row-req-${req.id}`}>
                    <button
                      className="w-full grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 text-sm px-3 py-2 rounded hover:bg-muted/50 transition-colors text-left items-center"
                      onClick={() => toggleReq(req.id)}
                      data-testid={`button-toggle-${req.id}`}
                    >
                      <div className="col-span-2 font-mono font-semibold text-primary flex items-center gap-1">
                        {expandedReqs.has(req.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {req.id}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs">{req.category}</Badge>
                      </div>
                      <div className="col-span-5 text-muted-foreground">{req.description}</div>
                      <div className="col-span-1 text-xs text-muted-foreground">{req.srsRef}</div>
                      <div className="col-span-2 flex justify-center">
                        <Badge className={req.status === "compliant" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-yellow-100 text-yellow-800"}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {req.status === "compliant" ? "Compliant" : "Partial"}
                        </Badge>
                      </div>
                    </button>
                    {expandedReqs.has(req.id) && (
                      <div className="ml-6 md:ml-10 px-4 py-3 mb-2 bg-muted/30 rounded-lg border text-sm" data-testid={`detail-${req.id}`}>
                        <div className="font-medium mb-1">Implementation Details:</div>
                        <div className="text-muted-foreground">{req.implementation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {filteredRequirements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No matching requirements found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jurisdictions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search countries or central banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-countries"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={blocFilter} onValueChange={setBlocFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-bloc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Blocs</SelectItem>
                {Object.keys(REGIONAL_BLOCS).filter(b => b !== "AU").map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dpFilter} onValueChange={setDpFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-dp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All DP Status</SelectItem>
                <SelectItem value="enacted">DP Enacted</SelectItem>
                <SelectItem value="draft">DP Draft</SelectItem>
                <SelectItem value="none">No DP Law</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            {filteredCountries.map((country) => (
              <Card key={country.code} data-testid={`card-country-${country.code}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-lg">{country.name}</span>
                        <Badge variant="outline" className="text-xs">{country.code}</Badge>
                        <Badge variant="secondary" className="text-xs">{country.region}</Badge>
                        <Badge variant="outline" className="text-xs">{country.currencyCode}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <Landmark className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div><span className="text-muted-foreground">Central Bank:</span> {country.centralBank}</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Data Protection:</span>{" "}
                            {country.dataProtectionLaw}
                            {country.dataProtectionStatus === "enacted" && (
                              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Enacted</Badge>
                            )}
                            {country.dataProtectionStatus === "draft" && (
                              <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">Draft</Badge>
                            )}
                            {country.dataProtectionStatus === "none" && (
                              <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">None</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div><span className="text-muted-foreground">Credit Bureau:</span> {country.creditBureauFramework}</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Database className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div><span className="text-muted-foreground">Retention:</span> {country.retentionYears} years</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Blocs:</span>{" "}
                            {country.regionalBlocs.filter(b => b !== "AU").map((b) => (
                              <Badge key={b} variant="outline" className="text-xs mr-1">{b}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="text-muted-foreground text-xs">{country.notes}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCountries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No matching countries found.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="blocs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(REGIONAL_BLOCS).filter(([k]) => k !== "AU").map(([key, bloc]) => {
              const members = AFRICAN_REGULATORY_DATA.filter((c) => c.regionalBlocs.includes(key));
              const dpEnacted = members.filter((c) => c.dataProtectionStatus === "enacted").length;
              const withBureau = members.filter((c) => !c.creditBureauFramework.includes("No formal")).length;

              return (
                <Card key={key} data-testid={`card-bloc-${key}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-primary" />
                      {bloc.name}
                    </CardTitle>
                    <CardDescription>{bloc.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="text-xl font-bold text-primary">{members.length}</div>
                        <div className="text-xs text-muted-foreground">Members</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{dpEnacted}</div>
                        <div className="text-xs text-muted-foreground">DP Laws</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">{withBureau}</div>
                        <div className="text-xs text-muted-foreground">Credit Bureaus</div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Data Protection Coverage</div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${members.length > 0 ? (dpEnacted / members.length) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{dpEnacted}/{members.length} members with enacted data protection legislation</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {members.map((m) => (
                        <Badge
                          key={m.code}
                          variant={m.dataProtectionStatus === "enacted" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {m.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Regulatory Gap Analysis
              </CardTitle>
              <CardDescription>
                Identifies areas where country-specific regulatory requirements may need additional configuration or attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-500" />
                  Countries Without Data Protection Laws ({stats.dpNone})
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These countries have no enacted data protection legislation. The system applies standard international best practices (7-year retention, consent-based processing) until local laws are enacted.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AFRICAN_REGULATORY_DATA.filter((c) => c.dataProtectionStatus === "none").map((c) => (
                    <Badge key={c.code} variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" data-testid={`badge-no-dp-${c.code}`}>
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-yellow-500" />
                  Countries with Draft Data Protection Laws ({stats.dpDraft})
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These countries are developing data protection legislation. The system should be updated once laws are enacted.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AFRICAN_REGULATORY_DATA.filter((c) => c.dataProtectionStatus === "draft").map((c) => (
                    <Badge key={c.code} variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300" data-testid={`badge-draft-dp-${c.code}`}>
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  Countries Without Formal Credit Bureaus ({stats.totalCountries - stats.withBureau})
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These countries lack formal credit bureau infrastructure. The CDH system serves as the primary credit information repository.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AFRICAN_REGULATORY_DATA.filter((c) => c.creditBureauFramework.includes("No formal")).map((c) => (
                    <Badge key={c.code} variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300" data-testid={`badge-no-bureau-${c.code}`}>
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  Retention Policy Recommendations
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4">Retention Period</th>
                        <th className="py-2 pr-4">Countries</th>
                        <th className="py-2">Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">10 years</td>
                        <td className="py-2 pr-4">
                          {AFRICAN_REGULATORY_DATA.filter((c) => c.retentionYears === 10).map((c) => c.name).join(", ")}
                        </td>
                        <td className="py-2 text-muted-foreground">Local data protection / central bank regulations</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-medium">7 years</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {AFRICAN_REGULATORY_DATA.filter((c) => c.retentionYears === 7).length} countries (standard financial retention)
                        </td>
                        <td className="py-2 text-muted-foreground">International financial data retention best practices</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">5 years</td>
                        <td className="py-2 pr-4">
                          {AFRICAN_REGULATORY_DATA.filter((c) => c.retentionYears === 5).map((c) => c.name).join(", ")}
                        </td>
                        <td className="py-2 text-muted-foreground">Minimal infrastructure — conservative default</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  System Compliance Summary
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950">
                    <div className="font-medium text-green-800 dark:text-green-200 mb-1">Fully Addressed</div>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>All {stats.total} SRS requirements implemented</li>
                      <li>RBAC, maker-checker, MFA, audit trails</li>
                      <li>Consent management with revocation</li>
                      <li>Dispute SLA management (2-day / 5-day)</li>
                      <li>Cross-border entity resolution (passport + TIN)</li>
                      <li>Per-jurisdiction retention policies with enforcement</li>
                      <li>Tamper-evident SHA-256 hash chain audit log</li>
                      <li>EN/FR/PT trilingual support</li>
                      <li>42+ African currency support + exchange rates</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950">
                    <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Recommendations</div>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>Configure retention policies for each active jurisdiction</li>
                      <li>Set up API integrations for each country's central bank</li>
                      <li>Monitor {stats.dpDraft} countries with draft DP laws</li>
                      <li>Consider Arabic (AR) for North African jurisdictions</li>
                      <li>Add Swahili (SW) for East African Community coverage</li>
                      <li>Configure exchange rate API feeds per currency zone</li>
                      <li>Set up judicial system integrations per country</li>
                      <li>Review CEMAC/UEMOA shared credit bureau data formats</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
