# Ghana Credit Registry — Data Connections and Exchange Policy

**Carlson Capital & Systems In Motion Limited**
**Version 2.1 | Regulatory Data Exchange Framework | CDH v2.1**

---

**Regulatory Authority**: Bank of Ghana (BoG)
**Applicable Laws**: Credit Reporting Act, 2007 (Act 726) | Data Protection Act, 2012 (Act 843) | Electronic Transactions Act, 2008 (Act 772) | Cybersecurity Act, 2020 (Act 1038)
**Classification**: CONFIDENTIAL — For Authorized Personnel Only

---

## 1. Purpose and Scope

This policy governs all data connections, integrations, and data exchange mechanisms between the Ghana Credit Registry and external systems including:
- Licensed financial institutions (banks, MFIs, savings & loans)
- Bank of Ghana regulatory systems
- National Identification Authority (NIA) for Ghana Card verification
- Data Protection Commission (DPC) compliance systems
- Licensed credit bureaus (XDS, Dun & Bradstreet, Hudson Price)
- Payment systems (GhIPSS, mobile money operators)

---

## 2. Authorized Connection Types

### 2.1 Connection Classification

| Connection Type | Security Level | Authorization | Legal Basis |
|----------------|---------------|---------------|-------------|
| Institution API (REST) | High | BoG license + API key | Act 726, Section 7 |
| BoG Regulatory Feed | Critical | Bilateral agreement | Act 726, Section 5 |
| NIA Ghana Card Verification | High | NIA data sharing MOU | NIA Act (Act 707) |
| Inter-Bureau Data Exchange | High | BoG directive | Act 726, Section 4 |
| GhIPSS Payment Verification | Medium | GhIPSS membership | Payment Systems Act |
| Mobile Money Integration | Medium | MoMo operator agreement | E-Money Regulations |
| Batch File Transfer (SFTP) | High | BoG CRB v1.1 standard | Act 726, Section 7 |

### 2.2 Connection Authorization Process

| Step | Action | Authority | Timeline |
|------|--------|-----------|----------|
| 1 | Connection request submitted | Requesting institution | Day 1 |
| 2 | BoG license verification | Registry Operations | 2 days |
| 3 | Technical security assessment | IT Security | 3 days |
| 4 | Data Protection Impact Assessment (DPIA) | DPO | 5 days |
| 5 | Legal review of data exchange agreement | Legal Counsel | 5 days |
| 6 | Connection provisioning | IT Operations | 2 days |
| 7 | Sandbox testing and validation | Joint IT teams | 5 days |
| 8 | Production activation | Operations Director | 1 day |

---

## 3. Data Exchange Standards

### 3.1 Protocol Requirements (Act 772 + Act 1038)

| Requirement | Standard | Enforcement |
|-------------|----------|-------------|
| Transport protocol | HTTPS (TLS 1.2+) only | Connection rejected if TLS < 1.2 |
| API authentication | OAuth 2.0 or API key + HMAC | Per connection type |
| Data format (API) | JSON (UTF-8) | Validation enforced |
| Data format (batch) | Pipe-delimited CSV (BoG CRB v1.1) | Format check on upload |
| Date format | YYYYMMDD (batch) or YYYY-MM-DD (API) | Auto-conversion supported |
| Currency | ISO 4217 (GHS mandatory for domestic) | Validation enforced |
| Character encoding | UTF-8 | System-wide |
| Request signing | HMAC-SHA256 for batch | Recommended for API |

### 3.2 Data Integrity Controls

| Control | Implementation | Legal Reference |
|---------|---------------|-----------------|
| Transmission checksums | SHA-256 hash per file/batch | Act 843, Section 28 |
| Idempotency | Duplicate detection via unique transaction IDs | System requirement |
| Acknowledgment | Synchronous response for API, email for batch | BoG CRB v1.1 |
| Non-repudiation | Signed audit logs with timestamps | Act 772, Section 13 |
| Data validation | Real-time field validation per BoG schema | BoG CRB v1.1 |

---

## 4. Institutional Connection Requirements

### 4.1 Technical Prerequisites

| Requirement | Specification | Verification |
|-------------|--------------|-------------|
| Static IP address | Whitelisted for production | IP verification test |
| SSL/TLS certificate | Valid, CA-signed certificate | Certificate chain validation |
| DNS configuration | Resolvable hostname | DNS lookup test |
| Firewall rules | Outbound HTTPS (port 443) | Connectivity test |
| Timeout handling | 30-second request timeout | Automated test |
| Retry logic | Exponential backoff (max 3 retries) | Code review |
| Error handling | Graceful degradation | Integration test |

### 4.2 Institutional Obligations (Act 726, Section 7)

| Obligation | Requirement | Penalty for Non-Compliance |
|-----------|-------------|---------------------------|
| Monthly data submission | By 15th of following month | BoG administrative action |
| Data accuracy | 98% minimum accuracy rate | Corrective action plan |
| Correction of errors | Within 2 business days of notification | BoG notification |
| Consent documentation | Before any credit inquiry | API access suspension |
| Incident reporting | Within 4 hours of discovery | Regulatory escalation |
| Annual review | Compliance self-assessment | Required for license renewal |

---

## 5. Bank of Ghana Regulatory Connection

### 5.1 BoG Data Feeds

| Feed | Direction | Frequency | Content |
|------|-----------|-----------|---------|
| Monthly Activity Report | Registry to BoG | Monthly | Submissions, queries, disputes summary |
| Data Quality Metrics | Registry to BoG | Monthly | Accuracy rates, rejection rates |
| Compliance Dashboard | Registry to BoG | Real-time | SLA compliance, system health |
| Regulatory Directives | BoG to Registry | Ad hoc | Policy updates, new requirements |
| License Status Updates | BoG to Registry | Real-time | Institution licensing changes |
| Supervisory Data | Registry to BoG | Quarterly | NPL ratios, portfolio analysis |

### 5.2 BoG Reporting Requirements

| Report | Format | Submission | Reference |
|--------|--------|------------|-----------|
| Monthly Returns | PDF + Excel | By 20th of month | Act 726, Section 5 |
| Quarterly Compliance | PDF | End of quarter | BoG directive |
| Annual Audit Report | PDF | By March 31 | Act 726, Section 6 |
| Incident Reports | PDF + logs | Within 72 hours | Act 843, Section 30 |
| Ad Hoc Requests | As specified | As directed | Act 726, Section 5 |

---

## 6. National Identification Authority (NIA) Integration

### 6.1 Ghana Card Verification

| Parameter | Details |
|-----------|---------|
| Purpose | Verify borrower identity against NIA database |
| Protocol | REST API over HTTPS |
| Authentication | NIA-issued API credentials |
| Data exchanged | Ghana Card number, name, DOB, photo (optional) |
| Response time SLA | Under 5 seconds |
| Legal basis | NIA Act (Act 707) + Act 726, Section 8 |
| Data retention | Verification result only (no NIA data stored) |

### 6.2 KYC Integration Points

| Verification | Source | Method | Legal Basis |
|-------------|--------|--------|-------------|
| Ghana Card | NIA | API lookup | Act 707 |
| Voter's ID | Electoral Commission | Manual verification | Act 726 |
| SSNIT | Social Security Authority | API lookup | SSNIT Act |
| Driver's License | DVLA | Manual verification | DVLA regulations |
| TIN | Ghana Revenue Authority | API lookup | Revenue Act |
| Company registration | Registrar General | API lookup | Companies Act |

---

## 7. Inter-Bureau Data Exchange

### 7.1 Licensed Credit Bureaus in Ghana

| Bureau | License | Specialization |
|--------|---------|---------------|
| XDS Data Ghana | BoG CRB License | Consumer and commercial credit |
| Dun & Bradstreet Ghana | BoG CRB License | Commercial credit and business reports |
| Hudson Price Ghana | BoG CRB License | Consumer credit and scoring |

### 7.2 Inter-Bureau Exchange Rules (Act 726, Section 4)

| Rule | Requirement |
|------|-------------|
| Data sharing scope | Only data mandated by BoG for credit assessment |
| Consent | Data subject consent required for bureau-to-bureau sharing |
| Format | BoG CRB v1.1 pipe-delimited format |
| Frequency | Real-time for inquiries, monthly for bulk data |
| Dispute handling | Originating bureau responsible for resolution |
| Audit | All inter-bureau exchanges logged for BoG review |

---

## 8. Mobile Money and Payment Integration

### 8.1 GhIPSS Integration

| Feature | Details |
|---------|---------|
| Purpose | Payment verification, real-time balance confirmation |
| Protocol | GhIPSS e-zwich / GIP API |
| Legal basis | Payment Systems and Services Act, 2019 (Act 987) |
| Data scope | Transaction verification only (no payment data stored) |

### 8.2 Mobile Money Operator Integration

| Operator | Integration Type | Purpose |
|----------|-----------------|---------|
| MTN Mobile Money | API | Mobile money account verification |
| Vodafone Cash | API | Mobile money account verification |
| AirtelTigo Money | API | Mobile money account verification |

---

## 9. Data Protection and Privacy Controls

### 9.1 Connection-Level Privacy (Act 843)

| Control | Implementation | Reference |
|---------|---------------|-----------|
| Purpose limitation | Each connection restricted to stated purpose | Section 21 |
| Data minimization | Only required fields transmitted | Section 23 |
| Access logging | All connection activity logged | Section 28 |
| Consent verification | Automated consent check before data release | Section 17 |
| Encryption | AES-256 at rest, TLS 1.2+ in transit | Section 28 |
| Anonymization | PII masked in test/sandbox environments | Section 24 |
| Breach notification | Automated alerts to DPO and BoG | Section 30 |

### 9.2 Data Sharing Agreements

All data connections require a formal Data Sharing Agreement (DSA) that includes:

| Clause | Requirement | Legal Reference |
|--------|------------|-----------------|
| Purpose specification | Clear statement of data usage | Act 843, Section 21 |
| Data scope | Enumeration of fields exchanged | Act 843, Section 23 |
| Retention terms | Maximum retention period | Act 843, Section 25 |
| Security measures | Technical and organizational safeguards | Act 843, Section 28 |
| Breach notification | Timeline and procedures | Act 843, Section 30 |
| Termination | Data return/deletion procedures | Act 843, Section 37 |
| Governing law | Laws of the Republic of Ghana | Act 843, Section 44 |
| Dispute resolution | Ghana Arbitration Centre or Courts | Act 843, Section 44 |

---

## 10. Connection Monitoring and Compliance

### 10.1 Monitoring Requirements

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Connection uptime | 99.5% per month | Email to Operations Manager |
| Failed authentication attempts | 5 in 10 minutes | Account lockout + security alert |
| Data validation failure rate | Above 5% | Automated notification to institution |
| Response time | Above 10 seconds | Performance alert |
| Unusual data volume | 200%+ of daily average | Security review |
| After-hours access | Outside business hours | Activity log review |

### 10.2 Annual Connection Review

| Review Item | Assessor | Frequency |
|-------------|----------|-----------|
| BoG license validity | Registry Operations | Annual |
| Security posture assessment | IT Security | Annual |
| Data exchange agreement review | Legal | Annual |
| DPIA update | DPO | Annual or per significant change |
| Technical compatibility | IT Operations | Semi-annual |
| Compliance audit | Internal Audit | Quarterly |

---

## 11. Incident Response for Connection Issues

### 11.1 Severity Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| Critical | Data breach via connection | Immediate | BoG + DPC + CEO |
| High | Unauthorized access attempt | 1 hour | IT Security + Operations Director |
| Medium | Connection failure affecting submissions | 4 hours | IT Operations |
| Low | Performance degradation | Next business day | Support Team |

### 11.2 BoG Notification Requirements

Per Act 726 and Act 843, the following incidents must be reported to the Bank of Ghana:

| Incident | Notification Deadline | Format |
|----------|----------------------|--------|
| Data breach | Within 72 hours | Written report + logs |
| Unauthorized access | Within 24 hours | Preliminary report |
| System compromise | Immediately | Phone + written follow-up |
| Extended outage (4+ hours) | Within 24 hours | Incident report |
| Data integrity issue | Within 48 hours | Investigation report |

---

## 12. Termination and Decommissioning

### 12.1 Connection Termination Triggers

| Trigger | Action | Authority |
|---------|--------|-----------|
| BoG license revocation | Immediate disconnection | Automatic |
| Repeated compliance failures | Suspension pending review | Operations Director |
| Data breach by institution | Suspension pending investigation | DPO + IT Security |
| Institution request | Orderly disconnection | Operations Manager |
| Contract expiry | Renewal or disconnection | Legal + Operations |

### 12.2 Data Handling Upon Termination

Per Act 843, Section 37:
- All API credentials revoked immediately
- Pending data submissions processed or returned
- Institution notified of data retention obligations
- Audit records preserved for 10 years
- BoG notified of termination

---

*Document Reference: GH-CONN-2026-v1.1*
*Classification: Confidential — Authorized Personnel Only*
