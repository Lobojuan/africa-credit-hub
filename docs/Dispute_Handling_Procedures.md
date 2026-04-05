# Dispute Handling Procedures

**Version 2.5** | Pan-African Credit Registry — Central Data Hub (CDH)

**Carlson Capital & Systems In Motion Limited™**

---

## 1. Introduction

This document establishes the standard operating procedures for handling credit data disputes within the Pan-African Central Data Hub (CDH). It covers dispute intake, investigation, resolution, escalation, and reporting across all participating jurisdictions.

### 1.1 Purpose

The dispute resolution process ensures that:

- Borrowers can challenge inaccurate, incomplete, or outdated credit information
- Financial institutions respond to disputes within defined timeframes
- Regulatory compliance is maintained across all 54 African jurisdictions
- All dispute actions are captured in a tamper-evident audit trail
- Consumer rights under national data protection laws are upheld

### 1.2 Scope

These procedures apply to:

- All disputes filed through the CDH web portal, consumer self-service portal, or helpdesk
- Disputes involving data submitted by any participating institution
- Cross-border disputes where the borrower and lender are in different jurisdictions
- Disputes filed by individuals, corporate entities, or their authorized representatives

### 1.3 Governing Standards

| Standard | Reference |
|----------|-----------|
| SRS v2.0 | Section 4.6 — Dispute Management Module |
| CRB v1.1 | Bank of Ghana CRB Operational Guidelines |
| AU Convention | Malabo Convention on Cyber Security and Personal Data Protection |
| National Laws | Applicable data protection and credit reporting legislation per jurisdiction |

---

## 2. Dispute Categories

### 2.1 Dispute Types

| Category | Description | SLA (Business Days) |
|----------|-------------|---------------------|
| Incorrect Balance | Current balance or original amount is wrong | 2 |
| Wrong Personal Information | Name, ID number, address, or contact details are incorrect | 2 |
| Unauthorized Account | Borrower does not recognize the credit account | 5 |
| Missing Positive Data | On-time payments or closed accounts not reflected | 3 |
| Identity Theft | Someone used the borrower's identity to obtain credit | 10 |
| Classification Dispute | Disagreement with account status (e.g., current vs. delinquent) | 5 |
| Duplicate Record | Same account or borrower appears more than once | 3 |
| Outdated Information | Data that should have been archived or removed | 3 |
| Court Judgment Error | Incorrect or unrelated court judgment on record | 5 |
| Consent Violation | Data shared without proper consent authorization | 5 |

### 2.2 Dispute Priority Levels

| Priority | Criteria | Response Time |
|----------|----------|---------------|
| **Critical** | Identity theft, fraud, unauthorized accounts | Within 1 business day |
| **High** | Incorrect data actively affecting credit decisions | Within 2 business days |
| **Medium** | Data corrections not currently impacting decisions | Within 3 business days |
| **Low** | Minor discrepancies, informational updates | Within 5 business days |

---

## 3. Dispute Lifecycle

### 3.1 Status Flow

```
open → under_review → resolved / rejected
                   ↘ escalated → resolved / rejected
```

| Status | Description |
|--------|-------------|
| `open` | Dispute has been filed and is awaiting review |
| `under_review` | Investigation is in progress |
| `escalated` | Dispute has been escalated to a supervisor or regulator |
| `resolved` | Dispute has been investigated and a correction has been applied |
| `rejected` | Dispute has been investigated and found to be unfounded |

### 3.2 Lifecycle Stages

**Stage 1 — Intake (Day 0)**
- Dispute is filed via web portal, consumer portal, helpdesk, or API
- System assigns a unique dispute ID and records the filing timestamp
- Automated notification sent to the disputing party confirming receipt
- Dispute is routed to the appropriate institution's queue

**Stage 2 — Initial Review (Day 1–2)**
- Assigned officer reviews the dispute details and supporting evidence
- Officer contacts the lender institution if additional information is needed
- Status changes from `open` to `under_review`

**Stage 3 — Investigation (Day 2–SLA)**
- Lender institution verifies the disputed data against source records
- Investigation findings are documented in the dispute record
- If data is found to be incorrect, the correction is prepared

**Stage 4 — Resolution (By SLA deadline)**
- Correction is applied to the borrower's credit record (if dispute is valid)
- Dispute status changes to `resolved` or `rejected`
- Resolution notification sent to the disputing party
- Updated credit report reflects the correction

---

## 4. Filing a Dispute

### 4.1 Via the Web Portal (Institutional Users)

1. Navigate to **Dispute Management** from the sidebar.
2. Click the **File Dispute** button.
3. Select the **borrower** associated with the dispute (search by name or national ID).
4. Select the **dispute type** from the dropdown.
5. Enter a detailed **description** of the issue.
6. Attach any **supporting documents** (optional).
7. Click **Submit Dispute**.
8. The system assigns a unique dispute ID and sends confirmation.

### 4.2 Via the Consumer Self-Service Portal

1. The consumer logs in to the Consumer Portal at `/my-credit`.
2. After verifying their identity (OTP via email or SMS), they view their credit report.
3. Click the **Dispute** button next to any data element they wish to challenge.
4. Select the dispute type and provide a description.
5. Submit the dispute.
6. The consumer receives a confirmation with the dispute tracking number.

### 4.3 Via the Helpdesk

1. Navigate to **Helpdesk** from the sidebar.
2. The helpdesk agent records the borrower's complaint.
3. The agent can file a dispute on behalf of the borrower using the dispute chatbot or manual form.
4. The system captures the agent's ID and the borrower's details for audit purposes.

### 4.4 Via the API

External systems can file disputes programmatically:

```
POST /api/disputes
{
  "borrowerId": "a1b2c3d4-...",
  "type": "incorrect_balance",
  "description": "Current balance shows GHS 45,000 but was paid down to GHS 12,000 on 2026-02-28",
  "creditAccountId": "b2c3d4e5-..." 
}
```

---

## 5. Investigation Procedures

### 5.1 Investigator Responsibilities

The assigned investigator must:

1. **Acknowledge** the dispute within 1 business day of assignment
2. **Review** the disputed data against available records
3. **Contact** the reporting institution for verification if needed
4. **Document** all findings in the dispute record
5. **Apply corrections** or document the reason for rejection
6. **Close** the dispute within the SLA timeframe

### 5.2 Evidence Collection

Investigators should gather:

- Original loan agreement or account documentation
- Payment receipts or bank statements provided by the borrower
- Institution's source system records
- Previous audit trail entries for the disputed record
- Consent records for the disputed account
- Any correspondence between the borrower and institution

### 5.3 Contacting the Reporting Institution

When the institution's records need verification:

1. The system automatically notifies the institution via email and in-app notification
2. The institution has **3 business days** to respond with verification
3. If no response is received, the dispute is escalated
4. All institution communications are logged in the dispute record

### 5.4 Updating Dispute Status

To update a dispute:

1. Navigate to the dispute detail page.
2. Click the **Update Status** button.
3. Select the new status (`under_review`, `resolved`, `rejected`, `escalated`).
4. Enter a **resolution note** explaining the action taken.
5. If resolving, specify whether a correction was applied to the credit record.
6. Click **Save**.

---

## 6. Escalation Procedures

### 6.1 When to Escalate

A dispute should be escalated when:

- The SLA deadline is approaching and resolution is not possible
- The reporting institution is unresponsive after 3 business days
- The dispute involves potential fraud or identity theft
- The dispute crosses jurisdictional boundaries (cross-border)
- The borrower is dissatisfied with the initial resolution

### 6.2 Escalation Path

```
Level 1: Dispute Officer (initial handler)
    ↓
Level 2: Supervisor / Compliance Officer
    ↓
Level 3: Regulatory Authority (BoG, CBK, NBE, etc.)
    ↓
Level 4: Cross-border arbitration (via PAPSS / AU mechanism)
```

### 6.3 Escalation Process

1. Change the dispute status to `escalated`.
2. Assign the dispute to the next-level reviewer.
3. Add an escalation note explaining why escalation is necessary.
4. The escalated reviewer receives an in-app notification and email.
5. The borrower is notified that their dispute has been escalated.

### 6.4 Regulatory Escalation

For disputes escalated to the regulatory level:

- The CDH generates a regulatory dispute report summarizing the case
- The report includes all evidence, communications, and timeline
- The regulator can access the dispute through the Regulatory Dashboard
- The regulator's decision is final and binding on the reporting institution

---

## 7. Cross-Border Disputes

### 7.1 Applicability

Cross-border disputes arise when:

- A borrower in one country disputes data reported by an institution in another country
- A credit account involves cross-border lending (e.g., via PAPSS settlement)
- A borrower has records in multiple jurisdictions

### 7.2 Jurisdiction

- The dispute is governed by the **data protection law of the borrower's country of residence**
- The reporting institution must comply with the regulatory requirements of **both** the borrower's and institution's jurisdictions
- If jurisdictional requirements conflict, the more protective standard applies

### 7.3 Cross-Border Process

1. The dispute is filed in the borrower's home jurisdiction
2. The CDH routes the dispute to the institution in the foreign jurisdiction
3. An active **Data Sharing Agreement** between the two countries must exist
4. SLA timelines are extended by **3 additional business days** for cross-border communication
5. Resolution must be applied in all jurisdictions where the data appears

---

## 8. Resolution Actions

### 8.1 Correction Types

| Action | Description |
|--------|-------------|
| **Update** | Correct the disputed field (balance, status, personal info) |
| **Delete** | Remove the disputed record entirely (unauthorized accounts, duplicates) |
| **Add** | Add missing data (positive payment history, closed account status) |
| **Annotate** | Add a consumer statement to the credit file without changing data |
| **No Change** | Reject the dispute with documented justification |

### 8.2 Consumer Statement

If a dispute is rejected but the borrower wishes to add context to their credit file:

- The borrower can request a **Consumer Statement** (up to 200 words)
- The statement is attached to the borrower's credit report
- The statement appears on all subsequent credit report pulls
- The statement can be updated or removed by the borrower at any time

### 8.3 Correction Audit Trail

All corrections resulting from disputes are logged with:

- The original value before correction
- The new value after correction
- The dispute ID that triggered the correction
- The user who applied the correction
- Timestamp of the correction
- Blockchain anchor hash (if blockchain verification is enabled)

---

## 9. Notifications

### 9.1 Automated Notifications

The CDH sends automated notifications at each stage of the dispute lifecycle:

| Event | Recipient | Channel |
|-------|-----------|---------|
| Dispute filed | Borrower, Institution | Email, In-app |
| Status changed to under_review | Borrower | Email, In-app |
| Institution verification requested | Institution | Email, In-app |
| SLA deadline approaching (1 day) | Assigned officer | Email, In-app |
| Dispute resolved | Borrower, Institution | Email, In-app |
| Dispute rejected | Borrower | Email, In-app |
| Dispute escalated | Next-level reviewer, Borrower | Email, In-app |

### 9.2 SMS Notifications

Where SMS is configured and the borrower has a valid phone number:

- Dispute filing confirmation
- Resolution notification
- Escalation notification

---

## 10. Dispute Reporting & Analytics

### 10.1 Operational Reports

The CDH provides the following dispute reports:

| Report | Description | Access |
|--------|-------------|--------|
| Dispute Volume | Total disputes filed by period, category, and institution | Admin, Regulator |
| SLA Compliance | Percentage of disputes resolved within SLA per category | Admin, Regulator |
| Resolution Rate | Percentage resolved vs. rejected vs. escalated | Admin, Regulator |
| Institution Ranking | Institutions ranked by dispute volume and resolution speed | Regulator |
| Aging Report | Open disputes by age (0–5 days, 5–10 days, 10+ days) | Admin, Regulator |

### 10.2 Dashboard Metrics

The Dispute Management dashboard displays:

- **Open Disputes** — Total disputes currently open or under review
- **Resolved This Month** — Disputes resolved in the current calendar month
- **Average Resolution Time** — Mean time from filing to resolution (in business days)
- **SLA Breach Rate** — Percentage of disputes that exceeded their SLA deadline

### 10.3 Regulatory Reporting

Regulators can access:

- Country-wide dispute statistics via the Regulatory Dashboard
- Institution-level dispute compliance reports
- Cross-border dispute tracking through the Cross-Border module
- Exportable reports in Excel format

---

## 11. Service Level Agreement Summary

### 11.1 Resolution SLAs by Dispute Type

| Dispute Type | SLA (Business Days) | Escalation Trigger |
|-------------|---------------------|-------------------|
| Incorrect Balance | 2 | Day 3 without resolution |
| Wrong Personal Info | 2 | Day 3 without resolution |
| Unauthorized Account | 5 | Day 6 without resolution |
| Missing Positive Data | 3 | Day 4 without resolution |
| Identity Theft | 10 | Day 8 without resolution |
| Classification Dispute | 5 | Day 6 without resolution |
| Duplicate Record | 3 | Day 4 without resolution |
| Outdated Information | 3 | Day 4 without resolution |
| Court Judgment Error | 5 | Day 6 without resolution |
| Consent Violation | 5 | Day 6 without resolution |

### 11.2 SLA Compliance Targets

| Metric | Target |
|--------|--------|
| Overall SLA compliance rate | 95% |
| Critical disputes resolved within SLA | 100% |
| Average resolution time (all types) | 3 business days |
| Borrower satisfaction rate | 85% |
| First-contact resolution rate | 60% |

### 11.3 SLA Breach Consequences

Repeated SLA breaches may result in:

1. Compliance notice issued to the institution
2. Mandatory improvement plan submission
3. Regulatory review of the institution's data practices
4. Potential restrictions on data submission privileges

---

## 12. AI-Assisted Dispute Handling

### 12.1 Dispute Chatbot

The CDH includes an AI-powered dispute chatbot accessible from the Helpdesk:

- **Rule-Based Mode** — Guided workflow with predefined questions to help borrowers identify their dispute type and gather required information
- **AI Assistant Mode** — Natural language conversation powered by GPT-4o for complex questions about credit data, dispute processes, and regulations

### 12.2 AI Capabilities

The AI assistant can:

- Help borrowers understand their credit report
- Explain dispute categories and expected timelines
- Guide users through the dispute filing process
- Answer questions about data protection rights
- Provide information about credit score methodology

### 12.3 AI Limitations

The AI assistant does **not**:

- Make dispute resolution decisions
- Modify credit data
- Access or display sensitive personal information
- Replace human investigation of disputes

---

## 13. Data Retention for Disputes

### 13.1 Retention Periods

| Record Type | Retention Period |
|-------------|-----------------|
| Dispute records | 7 years from resolution date |
| Investigation notes | 7 years from resolution date |
| Supporting documents | 5 years from resolution date |
| Audit trail entries | Permanent (immutable) |
| Correspondence logs | 7 years from resolution date |

### 13.2 Archival

After the retention period:

- Dispute records are archived according to the country's retention policy
- Archived disputes can be retrieved for regulatory or legal purposes
- Personally identifiable information is anonymized upon archival where permitted by law

---

## 14. Roles & Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **Borrower / Consumer** | File disputes, provide supporting evidence, review resolutions |
| **Lender / Bank Officer** | Respond to verification requests, provide source records, apply corrections |
| **Dispute Officer** | Investigate disputes, contact institutions, apply resolutions |
| **Compliance Officer** | Monitor SLA compliance, handle escalations, review dispute trends |
| **Regulator** | Oversee dispute resolution, enforce SLAs, handle regulatory escalations |
| **Super Admin** | System-wide dispute monitoring, cross-border dispute coordination |
| **Helpdesk Agent** | File disputes on behalf of borrowers, provide status updates |

---

## 15. Contact & Support

| Resource | Contact |
|----------|---------|
| Helpdesk (in-app) | Navigate to Helpdesk from the sidebar |
| Consumer Portal | `/my-credit` — self-service dispute filing |
| Technical support | helpdesk@africacredithub.com |
| Uffe Jon Carlson (Carlson Capital) | uffe.carlson@gmail.com · +233 552 395 548 |
| Thomas Baafi (Systems In Motion) | Thomas.baafi@prischell.com · +233 24 433 9985 |

---

*© 2026 Carlson Capital & Systems In Motion Limited. All rights reserved.*
