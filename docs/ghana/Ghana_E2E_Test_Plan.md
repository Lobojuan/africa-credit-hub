# Ghana Credit Registry — End-to-End Test Plan

**Africa Credit Hub**
**Version 2.5 | BoG CRB Standards Compliance Testing | CDH v2.5**

---

## 1. Test Plan Overview

### 1.1 Purpose
This document defines the end-to-end test plan for the Ghana Credit Registry, ensuring full compliance with Bank of Ghana CRB v1.1 data standards, Credit Reporting Act 726, and Data Protection Act 843.

### 1.2 Scope
| Area | Modules Covered |
|------|----------------|
| Ghana-Specific Data Entry | Borrower registration, Ghana Card, Voter's ID, SSNIT, Driver's License, employment type, proof of address |
| Credit Account Management | GHS currency, BoG facility types, asset classification, closure reasons |
| Batch Upload | BoG pipe-delimited format, JSON, XBRL, CSV file upload with validation preview |
| Credit Reporting | GHS primary with USD/EUR reference, BoG-compliant reports |
| Dispute Management | SLA-tracked dispute resolution |
| Compliance Dashboard | Market benchmarks, credit score factors |
| Regulatory Oversight | Regulatory Dashboard (NPL ratios, sector heatmap, institution compliance, data quality metrics) |
| Borrower Alerts | Auto-generated alerts on credit report pull, org-scoped access control |
| Credit Score Methodology | Interactive score simulator, factor weights, score bands 300-850, reason code glossary |
| Enhanced Audit Trail | Hash chain verification UI, CSV export, advanced filters, access log panel |
| Interactive API Docs | API explorer with try-it-out, auth flow diagram, code examples |
| Security | Authentication, authorization, audit trail, multi-tenant isolation |

### 1.3 Test Environment
| Component | Details |
|-----------|---------|
| Mode | VITE_COUNTRY_MODE=ghana |
| Primary Currency | GHS (Ghana Cedi) |
| Reference Currencies | USD, EUR |
| Database | PostgreSQL |
| Browser | Chrome 120+, Firefox 120+, Safari 17+ |

---

## 2. Test Cases — Borrower Registration

### TC-GH-001: Individual Borrower with Ghana Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Borrowers page | Borrower list loads |
| 2 | Click "Add Borrower" | Form opens with Ghana-specific fields visible |
| 3 | Enter Ghana Card Number (GHA-123456789) | Field accepts format |
| 4 | Enter Voter's ID, SSNIT Number | Fields accept values |
| 5 | Select Region from dropdown | 16 Ghana regions available |
| 6 | Select Marital Status | BoG codes: SNG/MRD/DIV/WID/SEP available |
| 7 | Select Employment Type | BoG codes: EMP/SLF/UNE/RET/STD/HMK/OTH available |
| 8 | Select Proof of Address type | BoG codes: WAT/ELE/BNK/TEN/OTH available |
| 9 | Enter Mobile Money Number | Accepts Ghana mobile format (+233) |
| 10 | Submit form | Borrower created with all Ghana fields |
| 11 | View borrower detail | All Ghana IDs and demographic fields displayed correctly |

### TC-GH-002: Corporate Borrower Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Corporate" type | Corporate fields appear |
| 2 | Select Business Type | BoG codes: LLC, LBG, Partnership, etc. |
| 3 | Select Industry Sector | BoG industry codes: Agriculture, Mining, etc. |
| 4 | Enter TIN Number | Ghana TIN format accepted |
| 5 | Submit form | Corporate borrower created |

### TC-GH-003: Borrower Detail — Ghana Fields Display
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open borrower detail page | Personal info card loads |
| 2 | Verify Ghana Card displayed | Ghana Card number shown |
| 3 | Verify Voter's ID displayed | Voter's ID shown if provided |
| 4 | Verify SSNIT Number displayed | SSNIT number shown if provided |
| 5 | Verify Mobile Money displayed | Mobile Money number with label shown |
| 6 | Verify Marital Status displayed | Marital status shown if provided |
| 7 | Verify amounts in GHS | All monetary values in GHS |
| 8 | Verify USD/EUR reference | Reference rates shown next to GHS amounts |

---

## 3. Test Cases — Credit Account Management

### TC-GH-010: Create GHS Credit Account
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Credit Accounts | Account list loads |
| 2 | Click "New Account" | Form opens with GHS locked as currency |
| 3 | Verify currency is locked to GHS | Cannot change currency in Ghana mode |
| 4 | Select Facility Type | BoG codes available: OVD, TML, MTG, CRC, etc. |
| 5 | Select Purpose of Facility | BoG purpose codes: PER, BUS, AGR, etc. |
| 6 | Select Repayment Frequency | BoG frequency codes: DLY, WKL, MTH, etc. |
| 7 | Select Asset Classification | Current/OLEM/Substandard/Doubtful/Loss |
| 8 | Enter amounts | GHS amounts with USD/EUR reference shown |
| 9 | Submit account | Account created with BoG fields |

### TC-GH-011: Asset Classification Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create account with 0 days arrears | Default classification: Current |
| 2 | Update to 45 days arrears | Classification should be OLEM |
| 3 | Update to 120 days arrears | Classification should be Substandard |
| 4 | Update to 200 days arrears | Classification should be Doubtful |
| 5 | Update to 400 days arrears | Classification should be Loss |

### TC-GH-012: Facility Closure with BoG Reason Codes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open existing GHS credit account | Account detail loads |
| 2 | Initiate facility closure | Closure form displays reason code selection |
| 3 | Verify closure reason options | NOR/EAR/WOF/TRF/REF/OTH codes available |
| 4 | Select "Normal Closure" (NOR) | Reason accepted |
| 5 | Confirm closure | Account marked as closed with NOR reason |

### TC-GH-013: Collateral Type Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new account with collateral | Collateral type dropdown shows BoG codes |
| 2 | Select PRO (Property) | Collateral value field becomes mandatory |
| 3 | Select UNS (Unsecured) | Collateral value field not required |
| 4 | Verify all 12 collateral types | PRO/VEH/EQP/STK/FXD/GOV/INV/REC/GRT/INS/OTH/UNS available |

---

## 4. Test Cases — Batch Upload (BoG Format)

### TC-GH-020: BoG Pipe-Delimited Upload
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Batch Upload | Three tabs visible: JSON/CSV, XBRL, BoG Format |
| 2 | Click BoG Format tab | Pipe-delimited upload interface shown |
| 3 | Click "Use Sample" | Textarea populated with sample BoG data |
| 4 | Verify sample format | Pipe-delimited with SRN, ReportingDate, etc. |
| 5 | Submit sample data | Upload processes successfully |
| 6 | Verify results | Success/error counts displayed |
| 7 | Verify file naming guide | BUSC/CONC/BUSD/COND/BUSJ/CONJ explained |

### TC-GH-021: BoG Date Format Conversion
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload with dates in YYYYMMDD | Dates converted to YYYY-MM-DD |
| 2 | Verify disbursement date | Correctly parsed |
| 3 | Verify maturity date | Correctly parsed |

### TC-GH-022: BoG Field Mapping
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload with FacilityType=TML | Maps to facilityTypeCode: TML |
| 2 | Upload with AssetClassification=CUR | Maps to assetClassification: CUR |
| 3 | Upload with Currency=GHS | Currency set to GHS |
| 4 | Upload without explicit AccountType | Auto-derived from FacilityType code |

---

## 5. Test Cases — Dashboard (Ghana Mode)

### TC-GH-030: Ghana Market Overview
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard | Dashboard loads with Ghana-specific panels |
| 2 | Verify Credit Score Factors card | Shows 5 factors with progress bars |
| 3 | Verify Payment History weight | 35% displayed |
| 4 | Verify Credit Utilization weight | 30% displayed |
| 5 | Verify Ghana Market card | Shows 3.4M borrowers, 154 institutions, 23% default |
| 6 | Verify 16 regions displayed | All Ghana regions shown with coverage bars |
| 7 | Verify Reference Rate badge | USD/EUR rates shown near currency selector |

### TC-GH-031: GHS Currency Display
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check currency selector | GHS selected by default |
| 2 | Verify stat card amounts | Displayed in GHS (cedis symbol) |
| 3 | Verify USD reference | Approximate USD equivalent shown |
| 4 | Change currency to USD | All amounts convert correctly |

---

## 6. Test Cases — Compliance Features

### TC-GH-040: Consent Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create borrower consent record | Consent receipt generated |
| 2 | Verify consent receipt number | Unique ID assigned |
| 3 | Revoke consent | Consent status changes to revoked |
| 4 | Attempt credit inquiry without consent | Inquiry blocked or flagged |

### TC-GH-041: Dispute SLA Tracking
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create financial dispute | 2-business-day SLA assigned |
| 2 | Create non-financial dispute | 5-business-day SLA assigned |
| 3 | Let SLA expire | Breach flag automatically set |
| 4 | Resolve dispute within SLA | Resolution recorded, SLA met |

### TC-GH-042: Audit Trail Integrity
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Perform several actions | Audit entries created |
| 2 | Verify hash chain | SHA-256 hash chain intact |
| 3 | Export audit log | CSV/Excel export works |
| 4 | Verify 10-year retention | Retention policy configured |

---

## 7. Test Cases — Security

### TC-GH-050: Role-Based Access Control
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Full access to all modules |
| 2 | Login as lender | Limited to own institution's data |
| 3 | Login as auditor | Read-only access to compliance modules |
| 4 | Attempt cross-tenant access | Access denied |

### TC-GH-051: Session Security
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with valid credentials | Session created |
| 2 | Wait 15 minutes idle | Session expires |
| 3 | Attempt 3 failed logins | Account locked |
| 4 | Verify IP logging | IP address recorded in audit log |

---

## 8. Test Execution Summary

| Priority | Test Cases | Status |
|----------|-----------|--------|
| Critical | TC-GH-001 to TC-GH-003 | Borrower registration |
| Critical | TC-GH-010 to TC-GH-011 | Credit account management |
| High | TC-GH-020 to TC-GH-022 | BoG batch upload |
| High | TC-GH-030 to TC-GH-031 | Dashboard Ghana mode |
| Medium | TC-GH-040 to TC-GH-042 | Compliance features |
| Medium | TC-GH-050 to TC-GH-051 | Security testing |
| High | TC-GH-060 to TC-GH-067 | Enterprise features (v2.1) |

---

## 10. Test Cases — Enterprise Features (v2.1)

### TC-GH-060: Regulatory Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /regulatory-dashboard (admin/regulator role) | Page loads with summary statistics |
| 2 | Verify NPL ratio card | NPL ratio displayed as percentage with delinquent + default + written_off / total |
| 3 | Verify data quality metrics | National ID coverage, phone coverage, email coverage shown as percentages |
| 4 | Verify sector NPL heatmap | Account types listed with per-sector NPL ratios and exposure amounts |
| 5 | Verify institution compliance panel | Each reporting institution shows account count, NPL ratio, exposure |
| 6 | Verify status breakdown | Current, delinquent, default, closed, restructured, written_off counts |
| 7 | Verify org-scoped data | Switch org context and confirm metrics change to reflect scoped data |

### TC-GH-061: Borrower Alert System
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /borrower-alerts | Alert management page loads |
| 2 | Generate a credit report for a borrower | Report generates successfully |
| 3 | Return to /borrower-alerts | New alert appears for the report_accessed event |
| 4 | Verify alert details | Shows borrower name, accessing institution, purpose, timestamp |
| 5 | Test org-scoped access | GET /api/borrower-alerts/:borrowerId returns 403 for borrowers outside user's org |

### TC-GH-062: Credit Score Methodology
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /credit-score-methodology | Page loads with scoring model documentation |
| 2 | Verify factor weights | Payment History 35%, Credit Utilization 30%, Credit Length 15%, New Inquiries 10%, Account Mix 10% |
| 3 | Test interactive simulator | Adjust sliders and verify score recalculates in real-time |
| 4 | Verify score bands | Excellent (750-850), Good (700-749), Fair (650-699), Poor (550-649), Very Poor (300-549) |
| 5 | Verify reason code glossary | All reason codes listed with descriptions |

### TC-GH-063: Enhanced Audit Trail
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /audit | Audit trail page loads with statistics cards |
| 2 | Verify statistics summary | Actions Today, Active Users, and integrity status cards display |
| 3 | Click hash chain verification button | Verification runs and shows intact/broken result |
| 4 | Apply date range filter | Logs filter to selected date range |
| 5 | Apply action type filter | Logs filter to selected action type |
| 6 | Click CSV export button | CSV file downloads with filtered audit logs |
| 7 | Switch to Access Log tab | Shows filtered view of who accessed which borrower's data |

### TC-GH-064: Enhanced Batch Upload with CSV
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /batch-upload | Batch upload page loads |
| 2 | Click CSV tab | CSV upload interface appears |
| 3 | Select or drag-drop a CSV file | File is accepted and parsed |
| 4 | Verify validation preview | Preview table shows row-by-row status (valid/invalid with error messages) |
| 5 | Click template download | CSV template file downloads with sample data and header columns |
| 6 | Switch to History tab | Previous batch uploads shown with timestamps, record counts, success/error rates |

### TC-GH-065: Enhanced API Documentation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /api-docs | API docs page loads with tabbed navigation |
| 2 | Click Explorer tab | Interactive API explorer loads with endpoint list |
| 3 | Select an endpoint | Parameters form appears with try-it-out button |
| 4 | Click Auth tab | Authentication flow diagram and steps displayed |
| 5 | Click Code tab | Code examples shown in Python, JavaScript, cURL |
| 6 | Copy a code example | Code copies to clipboard |
| 7 | Click Webhooks tab | Webhook setup documentation displayed |

### TC-GH-066: Sidebar Navigation Redesign
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as super_admin | Full sidebar visible with all sections |
| 2 | Verify Core section | Dashboard, Borrowers, Credit Accounts, Credit Search always visible |
| 3 | Verify Operations section | Collapsible, open by default, contains Credit Reports, Batch Upload, Disputes, etc. |
| 4 | Verify Oversight section | Collapsible, closed by default, contains Portfolio Intelligence, Regulatory Dashboard, etc. |
| 5 | Verify Administration section | Collapsible, closed by default, contains Organizations, User Management, etc. |
| 6 | Verify Resources section | Collapsible, closed by default, contains Score Methodology, Help, Docs |
| 7 | Verify item count badges | Each section header shows item count |
| 8 | Verify active indicator | Collapsed section shows dot when active page is inside it |
| 9 | Login as lender role | Oversight and Administration sections hidden or reduced |

### TC-GH-067: Multi-Tenant Security (v2.1 Hardening)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As org-A user, GET /api/borrower-alerts/:borrowerFromOrgB | Returns 403 Access denied |
| 2 | As super_admin, GET /api/borrower-alerts/:borrowerFromOrgB | Returns alert data (super_admin bypasses org scope) |
| 3 | Verify regulatory dashboard uses DB aggregates | No 200-row cap on analytics queries |
| 4 | Verify sidebar version shows v2.1 | Footer displays "v2.1 — Credit Registry" |

---

*Document Reference: GH-E2E-2026-v2.1*
*Classification: Internal — Quality Assurance*
