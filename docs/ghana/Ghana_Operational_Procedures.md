# Ghana Credit Registry — Operational Procedures Manual

**Carlson Capital & Systems In Motion Limited**
**Version 2.1 | Standard Operating Procedures for Ghana CRB Operations | CDH v2.1**

---

## 1. Purpose

This manual defines the standard operating procedures (SOPs) for the day-to-day operations of the Ghana Credit Registry. It covers data submission workflows, quality assurance processes, dispute handling, and regulatory reporting obligations.

---

## 2. Data Submission Procedures

### 2.1 Monthly Submission Workflow

| Step | Action | Responsible | Deadline |
|------|--------|-------------|----------|
| 1 | Institution prepares data extract | Data Provider IT | 10th of month |
| 2 | Format data per BoG CRB v1.1 | Data Provider | 12th of month |
| 3 | Upload via BoG pipe-delimited format | Data Provider | 15th of month |
| 4 | System validates format and fields | Automated | Within 30 minutes |
| 5 | System sends acceptance/rejection notice | Automated | Within 1 hour |
| 6 | Institution corrects and resubmits if rejected | Data Provider | Within 5 days |
| 7 | Monthly data quality report generated | System | 20th of month |
| 8 | Quality review and sign-off | Registry Operations | 25th of month |

### 2.2 Data Validation Checks

| Check | Type | Action on Failure |
|-------|------|-------------------|
| File format (pipe-delimited) | Automated | Reject entire file |
| Mandatory fields present | Automated | Reject record |
| Ghana Card format validation | Automated | Flag for review |
| Date format (YYYYMMDD) | Automated | Reject record |
| Currency code = GHS | Automated | Auto-correct if missing |
| Facility type code valid | Automated | Reject record |
| Asset classification valid | Automated | Reject record |
| Amount format (2 decimals) | Automated | Auto-format |
| Duplicate account check | Automated | Flag for review |
| Cross-institution duplicate | Automated | Flag for investigation |

### 2.3 Supported Upload Methods

| Method | Format | Endpoint |
|--------|--------|----------|
| BoG Pipe-Delimited | CSV with pipe delimiter | POST /api/batch-upload/bog-pipe |
| JSON Array | JSON records array | POST /api/batch-upload/credit-accounts |
| XBRL/XML | XML with creditAccount elements | POST /api/batch-upload/xbrl |
| Manual Entry | Web form | /credit-accounts (New Account) |

---

## 3. Credit Report Generation

### 3.1 Standard Credit Report Contents

| Section | Data Elements |
|---------|--------------|
| Subject Information | Name, Ghana Card, DOB, address, contact |
| Credit Summary | Total accounts, active accounts, total debt, credit score |
| Credit Score | Algorithmic score (300-850) with factor breakdown |
| Active Facilities | All open credit accounts with balances |
| Closed Facilities | Historical accounts (within retention period) |
| Payment History | Monthly payment performance records |
| Dishonoured Cheques | Returned cheque records (3-year window) |
| Court Judgments | Active and resolved judgments |
| Credit Inquiries | List of institutions that accessed the report |
| Dispute History | Any disputes filed and their resolution |

### 3.2 Report Access Authorization

| Requester | Authorization Required | Report Type |
|-----------|----------------------|-------------|
| Licensed institution | Borrower consent (documented) | Full report |
| Data subject | Self-identification | Full report |
| Bank of Ghana | Regulatory authority | Full report |
| Court | Court order | Full report |
| Employer | Written consent + limited scope | Employment check only |

---

## 4. Dispute Resolution Procedures

### 4.1 Dispute Categories and SLAs

| Category | SLA | Escalation |
|----------|-----|------------|
| Incorrect account balance | 2 business days | Data provider must respond |
| Wrong personal information | 2 business days | Registry corrects directly |
| Unauthorized account | 5 business days | Fraud investigation may apply |
| Missing positive data | 3 business days | Data provider must supplement |
| Identity theft / fraud | 10 business days | Police report may be required |
| Classification dispute | 5 business days | BoG guidelines applied |

### 4.2 Dispute Workflow

| Step | Action | Responsibility | SLA |
|------|--------|---------------|-----|
| 1 | Dispute received | System | Instant acknowledgment |
| 2 | Dispute validated and categorized | Operations | Within 4 hours |
| 3 | Data provider notified | System | Within 24 hours |
| 4 | Data provider investigates | Data Provider | Per category SLA |
| 5 | Resolution determination | Operations | Before SLA deadline |
| 6 | Data subject notified | System | Within 24 hours of resolution |
| 7 | Data corrected if applicable | System | Immediate after approval |
| 8 | BoG notified if SLA breached | System | Automatic |

---

## 5. Institution Onboarding

### 5.1 Onboarding Checklist

| Step | Requirement | Verification |
|------|------------|-------------|
| 1 | BoG license verification | License number confirmed |
| 2 | Organization registration | Company details, contacts |
| 3 | Technical readiness assessment | File format capability |
| 4 | User account provisioning | Admin + operator accounts |
| 5 | Test data submission | Sandbox environment |
| 6 | Data quality baseline | First production submission |
| 7 | Training completion | All users certified |
| 8 | Go-live approval | Operations Manager sign-off |

### 5.2 Subscription Plans

| Plan | Monthly Fee | Features |
|------|------------|----------|
| Standard | GHS 2,500 | Up to 10,000 records, 100 reports/month |
| Professional | GHS 6,500 | Up to 100,000 records, 500 reports/month |
| Enterprise | GHS 16,000 | Unlimited records, unlimited reports, API access |

---

## 6. Regulatory Reporting

### 6.1 Scheduled Reports to Bank of Ghana

| Report | Content | Frequency | Format |
|--------|---------|-----------|--------|
| Activity Summary | Total submissions, queries, disputes | Monthly | PDF + Excel |
| Data Quality Report | Accuracy metrics, rejection rates | Monthly | PDF |
| Compliance Status | SLA performance, breach summary | Quarterly | PDF |
| Annual Report | Full operational review | Annually | PDF |
| Incident Reports | Security or data breaches | Per occurrence | PDF |

---

## 7. Business Continuity

### 7.1 Disaster Recovery

| Component | RPO | RTO | Backup Location |
|-----------|-----|-----|-----------------|
| Database | 1 hour | 4 hours | Secondary data center |
| Application | N/A | 2 hours | Container registry |
| File storage | 4 hours | 4 hours | Object storage |
| Configuration | Real-time | 1 hour | Version control |

### 7.2 Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 - Critical | System down, no workaround | Immediate | CEO + BoG |
| P2 - High | Major feature impaired | 1 hour | Operations Director |
| P3 - Medium | Minor feature impaired | 4 hours | Operations Manager |
| P4 - Low | Cosmetic / enhancement | Next business day | Support Team |

---

## 8. Enterprise Oversight Features (v2.1)

### 8.1 Regulatory Dashboard

The Regulatory Dashboard (`/regulatory-dashboard`) provides Bank of Ghana supervisory staff with real-time portfolio oversight:

| Metric | Source | Calculation |
|--------|--------|-------------|
| NPL Ratio | credit_accounts table | (delinquent + default + written_off) / total accounts |
| Sector NPL Heatmap | credit_accounts grouped by account_type | Per-sector NPL ratio and exposure |
| Institution Compliance | credit_accounts grouped by lender_institution | Per-institution NPL, account counts, exposure |
| Data Quality Score | borrowers table | % with national_id, phone/mobile_money, email |
| Status Breakdown | credit_accounts table | Count by status (current, delinquent, default, closed, restructured, written_off) |

Access: admin, regulator, super_admin roles only. All metrics use DB-level aggregate queries for accuracy at scale.

### 8.2 Borrower Alert System

Automatic notifications generated when credit files are accessed:

| Event | Alert Type | Generated When |
|-------|-----------|----------------|
| Credit Report Pull | report_accessed | Credit report generated via /api/credit-reports/generate |
| Credit Inquiry | credit_inquiry | External API credit inquiry |
| Dispute Update | dispute_update | Dispute status changes |
| Score Change | score_change | Credit score recalculation |

Alerts are org-scoped: users can only view alerts for borrowers within their organization (super_admin exempt).

### 8.3 Credit Score Methodology Transparency

Public-facing page at `/credit-score-methodology` compliant with Credit Reporting Act 726 transparency requirements:

| Factor | Weight | Description |
|--------|--------|-------------|
| Payment History | 35% | On-time payment track record |
| Credit Utilization | 30% | Outstanding balance vs credit limits |
| Length of Credit History | 15% | Duration of credit relationships |
| New Credit Inquiries | 10% | Recent applications for new credit |
| Account Mix | 10% | Diversity of credit products |

Score bands: Excellent (750-850), Good (700-749), Fair (650-699), Poor (550-649), Very Poor (300-549).

### 8.4 Enhanced Audit Trail

Forensic audit capabilities for BoG compliance reporting:

- Hash chain integrity verification with visual pass/fail indicator
- CSV export of filtered audit logs for regulatory submission
- Advanced filtering by date range, action type, entity type, user
- Dedicated access log panel showing who accessed which borrower's data
- Statistics summary with daily action counts and active user tracking

### 8.5 Enhanced Batch Upload

Extended data submission formats beyond BoG pipe-delimited:

| Format | Tab | Features |
|--------|-----|----------|
| JSON | JSON | Paste or file upload, schema validation |
| XBRL | XBRL | Financial reporting standard format |
| BoG Pipe-Delimited | BoG | CRB v1.1 compliant, 6 file types |
| CSV | CSV | File picker, drag-and-drop, row-level validation preview |

All formats include: validation preview before submission, template downloads, and upload history tracking.

### 8.6 Interactive API Documentation

Developer portal at `/api-docs` with:

- Interactive API explorer with try-it-out testing
- Authentication flow diagram (API key to OAuth 2.1 token to API call)
- Code examples in Python, JavaScript, and cURL
- Rate limit documentation and error code reference
- Webhook setup guide for real-time data push notifications

---

*Document Reference: GH-OPS-2026-v2.1*
*Classification: Internal — Operations Manual*
