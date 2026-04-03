# Ghana Credit Registry — Regulatory Compliance Framework

**Carlson Capital & Systems In Motion Limited**
**Version 2.5 | Bank of Ghana CRB Standards Compliance | CDH v2.5**

---

## 1. Regulatory Landscape

### 1.1 Primary Legislation
| Law | Reference | Key Provisions |
|-----|-----------|----------------|
| Credit Reporting Act | Act 726 (2007) | Establishes legal framework for credit bureaus, data subject rights, and reporting obligations |
| Data Protection Act | Act 843 (2012) | Governs personal data processing, consent requirements, and cross-border data transfers |
| Borrowers and Lenders Act | Act 1052 (2020) | Regulates lending practices and borrower protections |
| National Communications Authority Act | Act 524 (1996) | Governs electronic communications infrastructure |
| Electronic Transactions Act | Act 772 (2008) | Legal validity of electronic records and signatures |

### 1.2 Regulatory Bodies
| Body | Role |
|------|------|
| Bank of Ghana (BoG) | Primary regulator; licenses and supervises credit bureaus |
| Data Protection Commission (DPC) | Enforces Data Protection Act 843; registers data controllers |
| National Communications Authority (NCA) | Telecommunications and data network oversight |

---

## 2. Credit Reporting Act Compliance (Act 726)

### 2.1 Data Subject Rights (Section 14-22)

| Right | Implementation | Status |
|-------|---------------|--------|
| Right to access own credit report | Self-service portal + institution request | Implemented |
| Right to dispute inaccurate data | Dispute management module with SLA tracking | Implemented |
| Right to be informed of adverse action | Automated notification system | Implemented |
| Right to restrict processing | Consent management with revocation | Implemented |
| Annual free credit report | One free report per calendar year | Implemented |
| Right to know who accessed report | Inquiry log with full audit trail | Implemented |

### 2.2 Data Provider Obligations (Section 7-13)

| Obligation | Compliance Measure | Verification |
|------------|-------------------|-------------|
| Monthly data submission | Automated reminders + deadline tracking | System-enforced |
| Data accuracy | Validation rules per BoG field specifications | Automated |
| Notification of corrections | Real-time update propagation | Automated |
| Secure data transmission | TLS 1.2+ encrypted channels | Enforced |
| Consent documentation | Consent receipt system with unique IDs | Implemented |

---

## 3. Data Protection Act Compliance (Act 843)

### 3.1 Data Processing Principles

| Principle | Implementation |
|-----------|---------------|
| Lawfulness and fairness | Consent-based processing with clear purpose disclosure |
| Purpose limitation | Data used only for credit assessment and regulatory reporting |
| Data minimization | Only BoG-mandated fields collected |
| Accuracy | Real-time validation + dispute resolution |
| Storage limitation | 7-year retention per BoG guidelines; automated purge |
| Integrity and confidentiality | AES-256 encryption, role-based access, audit logging |
| Accountability | Data Protection Officer appointed; annual compliance reports |

### 3.2 Data Subject Consent Management

| Consent Type | Duration | Revocation |
|-------------|----------|------------|
| Credit inquiry consent | Single use or 12-month standing | Immediate effect |
| Data sharing consent | Per institution, renewable annually | 30-day processing |
| Cross-border transfer consent | Specific purpose, specific jurisdiction | Immediate effect |
| Marketing consent | Opt-in only | Immediate effect |

---

## 4. BoG CRB Data Standards v1.1

### 4.1 Data Format Compliance

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| File format | Pipe-delimited CSV | Supported via BoG batch upload |
| Date format | YYYYMMDD | Automatic conversion |
| Character encoding | UTF-8 | System-wide |
| File naming | SRN-ReportDate-CreateDate-1.1-FILEIDENT-Seq.csv | Auto-generated |
| Decimal precision | 2 decimal places | Enforced |
| Currency | GHS (primary), USD/EUR (reference) | System default |

### 4.2 Mandatory Data Fields — Consumer Credit (CONC)

| Field | Description | Validation |
|-------|-------------|------------|
| Ghana Card Number | Primary identifier | Format: GHA-XXXXXXXXX |
| Full Name | Surname, first name, other names | Required |
| Date of Birth | YYYYMMDD format | Age 18+ validation |
| Gender | M/F | Required |
| Marital Status | SNG/MRD/DIV/WID/SEP | BoG marital status codes |
| Employment Type | EMP/SLF/UNE/RET/STD/HMK/OTH | BoG employment codes |
| Mobile Money Number | +233 format | Ghana mobile format |
| Proof of Address | WAT/ELE/BNK/TEN/OTH | Address verification type |
| Account Number | Unique facility identifier | Required |
| Facility Type Code | BoG Appendix I codes (OVD/TML/MTG/CRC/LAS/MFL/TRF/LSE/GRT/LOC/BND/STL/GRP/OTH) | Validated against code list |
| Purpose of Facility | BoG Appendix II codes (PER/BUS/AGR/EDU/HSG/VEH/TRD/MFG/INF/OTH) | Validated against code list |
| Currency | ISO 4217 code | GHS required |
| Original Amount | Facility amount at disbursement | Decimal(18,2) |
| Current Balance | Outstanding balance | Decimal(18,2) |
| Amount Overdue | Overdue amount | Decimal(18,2) |
| Written-Off Amount | Amount written off (if applicable) | Decimal(18,2) |
| Asset Classification | Current/OLEM/Substandard/Doubtful/Loss | BoG codes |
| Days in Arrears | Number of days past due | Integer >= 0 |
| Repayment Frequency | Daily/Weekly/Monthly/etc. | BoG frequency codes |
| Collateral Type | BoG Appendix VI codes (PRO/VEH/EQP/STK/FXD/GOV/INV/REC/GRT/INS/UNS/OTH) | Validated against code list |
| Collateral Value | Value of security | Decimal(18,2), required if not UNS |

### 4.3 Credit Score Factors (Ghana Model)

| Factor | Weight | Description |
|--------|--------|-------------|
| Payment History | 35% | On-time repayment track record |
| Credit Utilization | 30% | Outstanding debt vs available credit |
| Account Age | 15% | Length of credit history |
| Credit Mix | 10% | Diversity of credit facility types |
| New Inquiries | 10% | Recent credit applications |

### 4.4 Asset Classification Rules (BoG BSD/2018/01)

| Classification | Code | Days Past Due | Provision Rate |
|---------------|------|---------------|----------------|
| Current | CUR | 0-30 days | 1% |
| OLEM | OLM | 31-90 days | 10% |
| Substandard | SUB | 91-180 days | 25% |
| Doubtful | DBT | 181-360 days | 50% |
| Loss | LSS | 360+ days | 100% |

---

## 5. Identity Verification Standards

### 5.1 Accepted Identity Documents

| Document | Code | Priority | Validation |
|----------|------|----------|------------|
| Ghana Card (National ID) | GHANA_CARD | Primary | NIA database cross-reference |
| Voter's ID | VOTERS_ID | Secondary | EC register verification |
| SSNIT Number | SSNIT | Secondary | SSNIT database validation |
| Driver's License | DRIVERS_LICENSE | Secondary | DVLA cross-reference |
| Passport | PASSPORT | Tertiary | Immigration service verification |

### 5.2 KYC Compliance
| Requirement | Standard |
|-------------|----------|
| Ghana Card mandatory | Required for all new submissions from 2024 |
| Biometric verification | Supported via NIA integration |
| Address verification | Utility bill or tenancy agreement |
| Corporate KYC | RGD certificate + TIN + beneficial ownership |

---

## 6. Audit and Reporting

### 6.1 Regulatory Reporting Schedule

| Report | Frequency | Recipient | Deadline |
|--------|-----------|-----------|----------|
| Monthly activity summary | Monthly | BoG CRB Unit | 20th of month |
| Quarterly compliance report | Quarterly | BoG + DPC | End of quarter |
| Annual audit report | Annually | BoG Board | March 31 |
| Incident reports | Per occurrence | BoG + DPC | Within 72 hours |
| Data quality metrics | Monthly | BoG CRB Unit | 15th of month |

### 6.2 Audit Trail Requirements

| Requirement | Implementation |
|-------------|---------------|
| All data access logged | SHA-256 hash chain audit trail |
| Retention period | 10 years (per SLA-RET-01) |
| Tamper evidence | Hash chain verification API |
| User attribution | Session-based with IP tracking |
| Export capability | CSV/Excel audit export |

---

## 7. Compliance Monitoring

### 7.1 Key Compliance Indicators (KCIs)

| KCI | Target | Measurement |
|-----|--------|-------------|
| Timely data submission rate | 95% of institutions | Monthly |
| Data accuracy score | 98% minimum | Quarterly audit |
| Dispute resolution within SLA | 90% | Monthly |
| Security incident response | 100% within SLA | Per incident |
| Consent management compliance | 100% | Continuous |
| Annual training completion | 100% of users | Annual |

---

*Document Reference: GH-COMP-2026-v1.1*
*Classification: Regulatory — Bank of Ghana Compliance*
