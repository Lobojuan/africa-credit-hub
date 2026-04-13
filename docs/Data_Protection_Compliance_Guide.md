# Data Protection Compliance Guide

## Cross-Jurisdictional Central Data Hub & Credit Registry System v2.5

**Prepared for:** Africa Credit Hub  
**Document Version:** 2.5  
**Date:** April 2026  
**Classification:** Confidential

---

## 1. Executive Summary

This guide details the data protection controls, policies, and compliance mechanisms implemented within the Pan-African Credit Registry System (CDH v2.5). The platform processes personal and financial data of individuals and businesses across 54 African jurisdictions and is designed to comply with the full spectrum of continental data protection legislation.

The system's data protection architecture is built on four pillars:

1. **Lawful processing** — Every data operation is grounded in a documented legal basis
2. **Data sovereignty** — No data crosses jurisdictional boundaries without explicit bilateral agreement
3. **Data subject rights** — Individuals can access, correct, and control their credit data
4. **Accountability** — Every action is recorded in a tamper-evident, SHA-256 hash-chained audit trail

---

## 2. Regulatory Landscape

### 2.1 Key Legislation by Country

| Country | Legislation | Data Protection Authority | Key Requirements |
|---------|-------------|--------------------------|------------------|
| Ghana | Data Protection Act, 2012 (Act 843) | Data Protection Commission | Registration, consent, cross-border restrictions |
| South Africa | POPIA (Act 4 of 2013) | Information Regulator | Purpose limitation, data minimisation, PAIA access |
| Nigeria | NDPA 2023 | Nigeria Data Protection Commission | Consent, data localisation, DPO appointment |
| Kenya | Data Protection Act, 2019 | Office of Data Protection Commissioner | Consent, cross-border transfer safeguards |
| Rwanda | Law No. 058/2021 | National Cyber Security Authority | Prior authorisation for sensitive processing |
| Tanzania | Personal Data Protection Act, 2022 | Personal Data Protection Commission | Data localisation, consent requirements |
| Egypt | Law No. 151 of 2020 | Data Protection Centre | Cross-border transfer restrictions |
| Senegal | Law 2008-12 | Commission de Protection des Données Personnelles | Prior declaration, consent, purpose limitation |
| Mauritius | Data Protection Act, 2017 | Data Protection Office | Registration, cross-border adequacy assessments |
| Uganda | Data Protection and Privacy Act, 2019 | National Information Technology Authority | Consent, data localisation, DPO requirement |

### 2.2 Supranational Frameworks

| Framework | Scope | CDH Alignment |
|-----------|-------|---------------|
| African Union Convention on Cyber Security and Personal Data Protection (Malabo Convention) | Continental | Full alignment — consent, purpose limitation, cross-border controls, breach notification |
| ECOWAS Supplementary Act on Data Protection | West Africa | Compliant — registration, consent, transfer safeguards |
| EAC Data Protection Framework | East Africa | Compliant — data localisation, DPO, impact assessments |
| SADC Model Law on Data Protection | Southern Africa | Aligned — processing principles, data subject rights |

---

## 3. Legal Basis for Processing

### 3.1 Processing Grounds

The platform supports the following legal bases for credit data processing:

| Legal Basis | Application | CDH Implementation |
|-------------|-------------|-------------------|
| Consent | Primary basis for credit reporting | `consent_records` table with granular tracking per institution and purpose |
| Legal obligation | Regulatory reporting to central banks | Automated BoG/BSL export generation; retention policy enforcement |
| Legitimate interest | Fraud prevention, credit risk assessment | AI anomaly detection, fuzzy matching, cross-reference checks |
| Public interest | Financial system stability | Aggregated portfolio analytics (anonymised) |
| Contractual necessity | Loan application processing | Credit report generation pursuant to loan agreement |

### 3.2 Consent Management Architecture

The consent framework is implemented through the `consent_records` table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR (UUID) | Unique consent record identifier |
| `borrower_id` | VARCHAR | Reference to the data subject |
| `institution_id` | VARCHAR | Institution granted access |
| `purpose` | TEXT | Documented purpose of data access |
| `granted_at` | TIMESTAMP | Date and time consent was granted |
| `expires_at` | TIMESTAMP | Consent expiry date |
| `revoked_at` | TIMESTAMP | Date of revocation (if applicable) |
| `status` | ENUM | `active`, `expired`, `revoked` |
| `organization_id` | VARCHAR | Organisation scope for data sovereignty |

### 3.3 Consent Verification Flow

Before any credit data is accessed:

1. System queries `consent_records` for an active record matching the borrower, institution, and purpose
2. Consent `status` must be `active`
3. `expires_at` must be in the future (or null for indefinite consent)
4. `revoked_at` must be null
5. If no valid consent exists, access is denied with HTTP 403
6. All consent checks are logged in the audit trail

---

## 4. Data Subject Rights

### 4.1 Rights Implementation Matrix

| Right | Legislation Reference | CDH Feature | Access Channel |
|-------|----------------------|-------------|----------------|
| Right of Access | GDPR Art. 15 / Act 843 §18 / POPIA §23 | Consumer portal — view own credit report | `/consumer/dashboard` |
| Right to Rectification | GDPR Art. 16 / Act 843 §19 / POPIA §24 | Dispute filing and resolution | `/consumer/disputes` |
| Right to Erasure | GDPR Art. 17 / POPIA §24(1)(d) | Retention policy enforcement with purge engine | Automated + manual request |
| Right to Restriction | GDPR Art. 18 / Act 843 §20 | Account freeze / consent revocation | Consumer portal |
| Right to Data Portability | GDPR Art. 20 / POPIA §25 | PDF credit report download | Consumer portal |
| Right to Object | GDPR Art. 21 / Act 843 §21 | Consent revocation per institution | Consumer portal |
| Right to Human Review | Act 843 §22 / POPIA §71 | Manual review of AI-generated scores | Dispute escalation |

### 4.2 Consumer Self-Service Portal

The consumer portal provides data subjects with direct access to their rights:

| Feature | Description |
|---------|-------------|
| Account Registration | Self-service signup with email/phone verification |
| Identity Verification | National ID and OTP-based verification |
| Credit Report Access | View complete credit report on-screen |
| PDF Download | Download credit report as formatted PDF |
| Dispute Filing | Submit disputes with category, description, and evidence |
| Dispute Tracking | Monitor dispute status through resolution |
| Consent Dashboard | View and manage active consent records |
| Personal Statement | Add a consumer statement to the credit file |

### 4.3 Data Subject Request (DSR) Handling

| Request Type | SLA | Process |
|-------------|-----|---------|
| Access Request | 5 business days | Consumer portal (self-service) or written request to DPO |
| Rectification | 15 business days | Via dispute mechanism — Maker-Checker approval required |
| Erasure | 30 business days | Subject to regulatory retention requirements; DPO review |
| Consent Revocation | Immediate | Self-service via consumer portal |
| Data Portability | 5 business days | PDF report download (self-service) |

---

## 5. Data Sovereignty & Cross-Border Transfers

### 5.1 Sovereignty Architecture

The platform enforces data sovereignty at the middleware layer through three isolation functions:

| Function | Purpose |
|----------|---------|
| `getOrgScope(req)` | Restricts data access to the user's organisation |
| `getCountryFilter(req)` | Restricts data to the user's jurisdictional boundary |
| `enforceDataSovereignty(req)` | Injects sovereign country constraint into every data query |

Non-super-admin users are hard-locked to their assigned jurisdiction and organisation. There is no mechanism to bypass sovereignty controls from the frontend or API layer.

### 5.2 Cross-Border Transfer Safeguards

Cross-border data sharing is governed by the `data_sharing_agreements` table and enforced by the `requireCrossBorderAccess()` middleware:

| Safeguard | Implementation |
|-----------|---------------|
| Bilateral agreement required | `data_sharing_agreements` table with source/target country and institution lists |
| Agreement must be active | Status checked on every cross-border request |
| Institutional authorisation | Requesting institution must be explicitly listed in the agreement |
| Audit logging | Every cross-border access creates a `CROSS_BORDER_ACCESS` audit entry |
| Time-bound access | Agreements have effective and expiry dates |

### 5.3 Cross-Border Transfer Flow

1. User requests data from a jurisdiction outside their own
2. `requireCrossBorderAccess()` middleware intercepts the request
3. System queries `data_sharing_agreements` for an active agreement covering both countries
4. System verifies the user's institution is listed as a permitted participant
5. If no valid agreement exists, HTTP 403 is returned
6. If valid, the access is permitted and a `CROSS_BORDER_ACCESS` audit entry is created
7. The PAPSS (Pan-African Payment and Settlement System) integration provides settlement tracking for cross-border financial transactions

### 5.4 Transfer Impact Assessment

Before establishing a new cross-border agreement, the following must be documented:

| Assessment Area | Requirement |
|-----------------|-------------|
| Legal basis | Identify the legal ground for transfer in both jurisdictions |
| Adequacy | Assess whether the receiving country provides adequate protection |
| Data types | Specify exactly which data categories will be shared |
| Safeguards | Document technical and organisational measures in place |
| Data subject notification | Confirm data subjects are informed of cross-border sharing |

---

## 6. Data Security Controls

### 6.1 Encryption

| Data State | Mechanism | Standard |
|------------|-----------|----------|
| At rest (passwords) | bcrypt with 10 salt rounds | OWASP guidelines |
| At rest (API keys) | SHA-256 one-way hash | NIST SP 800-132 |
| In transit (client ↔ server) | TLS 1.2+ (platform-enforced HTTPS) | PCI DSS |
| In transit (server ↔ database) | PostgreSQL SSL/TLS | ISO 27001 |
| Webhook payloads | HMAC-SHA256 signature | RFC 2104 |

### 6.2 Access Controls

| Control | Implementation |
|---------|---------------|
| Authentication | Username/password + TOTP MFA + WebAuthn/FIDO2 + Google OAuth |
| Role-Based Access | Four roles (admin, regulator, lender, viewer) plus super_admin |
| Session management | Server-side sessions with role-based idle timeouts (15–30 min) |
| Account lockout | Progressive lockout after 5 failed attempts (30-minute lock) |
| API authentication | SHA-256 hashed API keys + OAuth 2.1 Bearer tokens |

### 6.3 Audit Trail

All data access and modifications are recorded in a tamper-evident audit log:

| Feature | Implementation |
|---------|---------------|
| Hash chaining | SHA-256 hash chain — each entry linked to predecessor |
| Integrity verification | `GET /api/audit/verify-integrity` validates complete chain |
| Blockchain anchoring | Merkle root anchored every 6 hours for external proof |
| Non-repudiation | User ID and IP address recorded on every action |
| Immutability | Append-only — no UPDATE or DELETE operations on audit logs |

---

## 7. Data Retention

### 7.1 Retention Policy Engine

The platform enforces jurisdiction-specific data retention through automated policies:

| Component | Description |
|-----------|-------------|
| Policy table | `retention_policies` with country, entity type, and retention period |
| Enforcement engine | Automated daily task scans for expired records |
| Purge actions | Records exceeding retention period are archived or purged |
| Audit evidence | `DATA_PURGED` audit entries created for every purge operation |
| Regulatory overrides | Retention periods configurable per country and data category |

### 7.2 Retention Schedule

| Data Category | Default Period | Regulatory Basis |
|---------------|---------------|------------------|
| Credit account data | 7 years | BoG CRB guidelines / common SADC standard |
| Payment history | 7 years | Aligned to credit account retention |
| Credit inquiries | 2 years | Industry best practice |
| Dispute records | 7 years | Regulatory requirement for audit trail |
| Court judgments | 10 years | Legal record retention |
| Audit logs | 10 years | Compliance evidence requirement |
| Consumer accounts | Account lifetime + 2 years | Data subject relationship basis |
| Session data | 24 hours | Technical necessity only |

---

## 8. Breach Notification

### 8.1 Breach Response Procedures

| Phase | Action | Timeline |
|-------|--------|----------|
| Detection | Anomaly detection via AI engine, manual reporting, or system monitoring | Immediate |
| Containment | Isolate affected systems, revoke compromised credentials, preserve evidence | Within 1 hour |
| Assessment | Determine scope, affected data subjects, severity classification | Within 4 hours |
| Authority Notification | Notify relevant Data Protection Authority (DPA) | Within 72 hours |
| Data Subject Notification | Notify affected individuals if high risk to rights/freedoms | Within 7 days |
| Remediation | Implement corrective measures, update security controls | Within 30 days |
| Post-Incident Review | Root cause analysis, lessons learned, policy updates | Within 60 days |

### 8.2 Notification Requirements by Jurisdiction

| Country | Authority Notification | Data Subject Notification | Penalty for Non-Compliance |
|---------|----------------------|--------------------------|---------------------------|
| Ghana | Data Protection Commission — 72 hours | Without undue delay | Up to GHS 36,000 or 5 years imprisonment |
| South Africa | Information Regulator — as soon as reasonably possible | As soon as reasonably possible | Up to ZAR 10 million |
| Nigeria | NDPC — 72 hours | Without undue delay | Up to 2% of annual turnover |
| Kenya | DPC — 72 hours | Without undue delay | Up to KES 5 million or 2 years imprisonment |

---

## 9. Data Protection Officer (DPO) Role

### 9.1 DPO Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Compliance monitoring | Ensure ongoing compliance with applicable data protection laws |
| Impact assessments | Conduct Data Protection Impact Assessments (DPIAs) for new processing activities |
| Training | Coordinate data protection training for all system users |
| DSR oversight | Oversee timely handling of data subject requests |
| Breach coordination | Lead breach response and notification processes |
| Regulatory liaison | Serve as primary contact for Data Protection Authorities |
| Policy maintenance | Review and update data protection policies annually |

### 9.2 DPO Contact

| Field | Details |
|-------|---------|
| Organisation | Africa Credit Hub |
| Email | dpo@systemsinmotion.com |
| Reporting Line | Reports directly to the Board of Directors |
| Independence | DPO operates independently of the data processing function |

---

## 10. Privacy by Design

### 10.1 Design Principles Implemented

| Principle | Implementation |
|-----------|---------------|
| Data minimisation | Only fields required for credit reporting are collected |
| Purpose limitation | Consent records specify and enforce the purpose of data access |
| Storage limitation | Automated retention engine enforces jurisdiction-specific limits |
| Integrity & confidentiality | Encryption at rest and in transit; tamper-evident audit chain |
| Accountability | Complete audit trail with hash chain and blockchain anchoring |
| Transparency | Consumer portal provides full visibility into credit data |
| Default privacy | New accounts require explicit consent before data is shared |

### 10.2 Technical Measures

| Measure | Implementation |
|---------|---------------|
| Input validation | Zod schema validation on all API inputs (SQL injection prevention) |
| Output sanitisation | DOMPurify applied to user-supplied content before rendering |
| Header security | Helmet.js with CSP, HSTS, X-Content-Type-Options, X-Frame-Options |
| Rate limiting | Six-tier rate limiting (login, API, write, batch, AI, credit report) |
| SSRF protection | URL validation blocks internal/private network addresses |
| Sensitive data masking | Passwords stripped from API responses; API keys shown once only |

---

## 11. Third-Party Data Sharing

### 11.1 Institutional Data Sharing

Data is shared with participating financial institutions under the following controls:

| Control | Description |
|---------|-------------|
| Organisation binding | Every data record is bound to an organisation via `organization_id` |
| Consent requirement | Active consent record must exist for the accessing institution |
| Jurisdictional lock | Institutions can only access data within their authorised country |
| Audit logging | Every data access event is logged with user, institution, and timestamp |
| API key permissions | External API access is restricted by permission level (submit/read/full) |

### 11.2 Regulatory Data Sharing

| Recipient | Data Shared | Basis | Frequency |
|-----------|-------------|-------|-----------|
| Bank of Ghana (BoG) | IFF files (6 types) | Credit Reporting Act 726 | Monthly |
| Bank of Sierra Leone (BSL) | BSL regulatory files | BSL CRB regulations | Monthly |
| Data Protection Authorities | Breach notifications, compliance reports | National DPA laws | As required |
| Central Banks (other) | Aggregated credit statistics | Regulatory mandate | Quarterly |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | CDH-DPC-2026-001 |
| Version | 2.5 |
| Classification | Confidential |
| Authors | Africa Credit Hub Team |
| Organisation | Africa Credit Hub |
| Last Updated | April 2026 |
