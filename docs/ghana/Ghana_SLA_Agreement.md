# Ghana Credit Registry — Service Level Agreement (SLA)

**Africa Credit Hub**
**Version 2.5 | Effective Date: January 2026 | CDH v2.8**
**Regulatory Framework: Credit Reporting Act, 2007 (Act 726)**

---

## 1. Purpose and Scope

This Service Level Agreement (SLA) defines the performance standards, responsibilities, and compliance obligations for the Ghana Credit Registry operated by Africa Credit Hub. This agreement aligns with Bank of Ghana (BoG) Credit Reporting Bureau (CRB) Standards v1.1 and the Credit Reporting Act, 2007 (Act 726).

### 1.1 Parties
- **Service Provider**: Africa Credit Hub (Registry Operator)
- **Service Recipients**: Licensed credit institutions, microfinance companies, and non-bank financial institutions in Ghana
- **Regulatory Authority**: Bank of Ghana (BoG)

### 1.2 Applicable Legislation
- Credit Reporting Act, 2007 (Act 726)
- Data Protection Act, 2012 (Act 843)
- Borrowers and Lenders Act, 2020 (Act 1052)
- Bank of Ghana CRB Operational Guidelines

---

## 2. Service Availability

| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | 99.5% monthly | Measured excluding scheduled maintenance |
| Planned Maintenance Window | Sundays 02:00-06:00 GMT | 48-hour advance notification |
| Maximum Unscheduled Downtime | 4 hours per incident | Auto-escalation after 2 hours |
| Disaster Recovery RTO | 4 hours | Recovery Time Objective |
| Disaster Recovery RPO | 1 hour | Recovery Point Objective |

---

## 3. Data Submission SLAs

### 3.1 Credit Data Submission
| Requirement | SLA | Reference |
|-------------|-----|-----------|
| Monthly data submission by institutions | By 15th of following month | BoG CRB v1.1 Section 3.2 |
| Data format compliance check | Within 30 minutes of submission | Automated validation |
| Rejection notification | Within 1 hour of submission | Email + in-app notification |
| Resubmission window | 5 business days from rejection | BoG CRB v1.1 Section 3.4 |
| File format | Pipe-delimited CSV (BoG v1.1) | SRN-based naming convention |

### 3.2 File Types and Submission Schedule
| File Type | Code | Frequency | Deadline |
|-----------|------|-----------|----------|
| Business Credit | BUSC | Monthly | 15th of month |
| Consumer Credit | CONC | Monthly | 15th of month |
| Business Dishonoured Cheques | BUSD | Within 5 days | Per occurrence |
| Consumer Dishonoured Cheques | COND | Within 5 days | Per occurrence |
| Business Court Judgments | BUSJ | Within 10 days | Per occurrence |
| Consumer Court Judgments | CONJ | Within 10 days | Per occurrence |

---

## 4. Credit Report Delivery SLAs

| Service | SLA | Notes |
|---------|-----|-------|
| Online credit report generation | Under 10 seconds | Standard credit report |
| Bulk credit report batch | Within 2 hours | Up to 500 reports |
| PDF credit report download | Under 30 seconds | Formatted BoG-compliant report |
| API credit report response | Under 5 seconds | REST API response |
| Credit score calculation | Under 3 seconds | Real-time scoring |

---

## 5. Dispute Resolution SLAs

### 5.1 Consumer Disputes (Per Act 726, Section 20)
| Category | Resolution SLA | Escalation |
|----------|---------------|------------|
| Factual errors (e.g., wrong amount) | 2 business days | Auto-escalate to BoG if breached |
| Identity disputes | 5 business days | Requires ID verification |
| Fraudulent account disputes | 10 business days | May require police report |
| Data completeness disputes | 3 business days | Institution must respond |
| Dispute acknowledgment | Within 24 hours | Automated receipt |

### 5.2 Institutional Disputes
| Category | Resolution SLA |
|----------|---------------|
| Data correction by institution | 2 business days after notification |
| Bulk data reconciliation | 5 business days |
| Inter-institutional disputes | 10 business days |

---

## 6. Data Quality Standards

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data accuracy rate | 98% minimum | Monthly audit sampling |
| Duplicate detection rate | 95% minimum | Ghana Card cross-referencing |
| Missing field rate | Less than 2% | Mandatory field completeness |
| Stale data rate | Less than 5% | Records older than 90 days without update |
| Ghana Card match rate | 99% for new submissions | Primary identifier validation |

---

## 7. Security and Compliance SLAs

| Requirement | SLA | Compliance Reference |
|-------------|-----|---------------------|
| Data encryption at rest | AES-256 | Data Protection Act 843, Section 28 |
| Data encryption in transit | TLS 1.2+ | BoG IT Security Guidelines |
| Access audit trail retention | 10 years minimum | Act 726, Section 18 |
| Security incident notification | Within 4 hours | Data Protection Act 843 |
| Annual penetration testing | Completed by Q1 each year | BoG requirement |
| Data breach notification to BoG | Within 72 hours | Data Protection Act 843, Section 30 |

---

## 8. Performance Benchmarks

### 8.1 Ghana Market Context
| Metric | Value | Source |
|--------|-------|--------|
| Active borrowers nationwide | 3.4 million | BoG Annual Report 2025 |
| Active credit facilities | 5.7 million | BoG Annual Report 2025 |
| National default rate | 23% | BoG Quarterly Statistics |
| Licensed credit institutions | 154 | BoG Register |
| Licensed credit bureaus | 3 (XDS Data Ghana, Dun & Bradstreet, Hudson Price) | BoG CRB Register |
| Adult population with credit history | 25% (4.5M scored) | Bureau aggregate data |
| Mobile money subscribers | 22 million | NCA Statistics |
| Female credit participation | 44% | Bureau aggregate data |

---

## 9. Escalation Matrix

| Level | Trigger | Contact | Response Time |
|-------|---------|---------|---------------|
| Level 1 | Standard support request | Help Desk | 4 hours |
| Level 2 | SLA breach warning | Operations Manager | 2 hours |
| Level 3 | SLA breach confirmed | Director of Operations | 1 hour |
| Level 4 | Regulatory escalation | CEO / BoG Liaison | Immediate |

---

## 10. Penalties and Remediation

| Breach Type | Penalty |
|-------------|---------|
| Uptime below 99.0% | 5% service credit |
| Dispute resolution SLA breach | BoG notification + corrective action plan |
| Data breach | Full incident report within 72 hours per Act 843 |
| Repeated submission failures | Institution remediation plan required |

---

## 11. Review and Amendment

This SLA is reviewed annually in consultation with the Bank of Ghana and participating institutions. Amendments require 30 days' written notice to all parties.

**Approved by**: Africa Credit Hub, Board of Directors
**Regulatory Alignment**: Bank of Ghana Credit Reporting Bureau Unit

---

*Document Reference: GH-SLA-2026-v1.1*
*Classification: Confidential — For authorized personnel only*
