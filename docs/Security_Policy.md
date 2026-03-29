# CDH v2.1 — Information Security Policy

**Document Classification:** CONFIDENTIAL
**Version:** 2.1.0
**Effective Date:** 2026-01-01
**Review Date:** 2026-06-30
**Approved By:** Chief Information Security Officer (CISO)

---

## 1. Purpose

This Information Security Policy establishes the framework for protecting the confidentiality, integrity, and availability of all information assets managed by the Credit Data Hub (CDH) platform. It applies to all system users, administrators, third-party integrators, and data processors.

## 2. Scope

This policy covers:
- All data processed, stored, or transmitted by CDH v2.1
- All system users across 54 African jurisdictions
- All telco and financial institution integrations
- Development, staging, and production environments
- Third-party API consumers and data providers

## 3. Information Classification

| Level | Description | Examples | Controls |
|-------|-------------|----------|----------|
| **RESTRICTED** | Highly sensitive PII and financial data | National IDs, credit scores, loan balances, MoMo transaction data | AES-256 encryption at rest, TLS 1.3 in transit, RBAC, audit logging |
| **CONFIDENTIAL** | Business-sensitive data | API keys, user credentials, organizational data | Encryption at rest, access controls, audit logging |
| **INTERNAL** | Operational data | System logs, configuration, metadata | Access controls, monitoring |
| **PUBLIC** | Publicly accessible information | API documentation, pricing, compliance frameworks | Integrity controls |

## 4. Access Control

### 4.1 Authentication
- Multi-factor authentication (TOTP/FIDO2) required for admin and regulator roles
- Password complexity requirements: minimum 12 characters, mixed case, numbers, symbols
- Password expiration: 90 days for all roles
- Account lockout: 3 failed attempts triggers 15-minute lockout
- Session management: 30-minute idle timeout, 8-hour maximum session

### 4.2 Role-Based Access Control (RBAC)
| Role | Access Level | Scope |
|------|-------------|-------|
| Super Admin | Full system access, cross-country | Platform administration, all countries |
| Admin | Organization-level management | Own organization's data and users |
| Regulator | Read-only regulatory oversight | Assigned jurisdiction's data |
| Lender | Credit operations | Own institution's borrowers and accounts |
| Viewer | Read-only access | Limited data visibility |
| Auditor | Audit trail and compliance | Audit logs, compliance reports |

### 4.3 Principle of Least Privilege
All users are granted the minimum access necessary to perform their duties. Access is reviewed quarterly.

## 5. Data Protection

### 5.1 Encryption
- **At Rest:** AES-256-GCM encryption for all PII fields (national IDs, dates of birth, mobile money numbers) at application level
- **In Transit:** TLS 1.3 enforced for all connections. HSTS enabled with 1-year max-age
- **Key Management:** Encryption keys stored in environment variables, rotated quarterly

### 5.2 Data Retention
- Retention periods defined per jurisdiction and entity type
- Automated enforcement of retention policies with archival before deletion
- Data subject erasure requests processed within 30 days per GDPR/POPIA requirements

### 5.3 Data Subject Rights
- Right to Access: Data subjects can request their credit data via consumer portal
- Right to Rectification: Dispute mechanism for incorrect data
- Right to Erasure: Formal erasure request process with dual-approval workflow
- Right to Portability: Credit report export in standardized formats
- Consent Management: Explicit consent tracking with revocation capability

## 6. Application Security

### 6.1 Input Validation
- Server-side validation using Zod schemas on all API endpoints
- Parameterized queries via Drizzle ORM (SQL injection prevention)
- Content sanitization using DOMPurify (XSS prevention)

### 6.2 API Security
- API key authentication with SHA-256 hashed storage
- OAuth 2.1 bearer token support for telco integrations
- Per-endpoint rate limiting (login: 10/min, API general: 200/min, write operations: 60/min)
- CSRF token validation on all state-changing requests

### 6.3 Security Headers
- Content-Security-Policy with strict directives
- Strict-Transport-Security (HSTS) with preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

## 7. Audit and Monitoring

### 7.1 Audit Trail
- All significant actions logged with SHA-256 hash chaining
- Immutable audit logs with genesis block verification
- IP address tracking for all authenticated operations
- Audit log integrity verification available on demand

### 7.2 Monitored Events
- Login attempts (successful and failed)
- Account lockouts and unlocks
- Data creation, modification, and deletion
- Approval workflow actions (maker-checker)
- API key generation and revocation
- Session timeouts and forced logouts
- Data export and report generation
- Cross-border data transfers

## 8. Incident Response

### 8.1 Severity Levels
| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 - Critical | Data breach, system compromise | 15 minutes | CISO, CEO, Legal |
| P2 - High | Unauthorized access attempt, service degradation | 1 hour | CISO, CTO |
| P3 - Medium | Policy violation, suspicious activity | 4 hours | Security Team |
| P4 - Low | Minor policy deviation, informational | 24 hours | Team Lead |

### 8.2 Breach Notification
- Regulatory notification within 72 hours (per GDPR, POPIA, NDPA)
- Data subject notification without undue delay
- Documentation of breach scope, impact, and remediation

## 9. Third-Party Security

### 9.1 Telco Integration Security
- All telco APIs authenticated via OAuth 2.1 or API key
- Data minimization in API responses
- Consent verification before data sharing
- Rate limiting and usage metering for billing reconciliation

### 9.2 Vendor Risk Assessment
- All third-party integrations undergo security assessment
- Annual review of vendor security posture
- Data processing agreements required for all data processors

## 10. Compliance

This system is designed to comply with:
- South Africa POPIA (Protection of Personal Information Act)
- Nigeria NDPA 2023 (Nigeria Data Protection Act)
- Ghana Data Protection Act 2012 (Act 843)
- Kenya Data Protection Act 2019
- AU Malabo Convention on Cyber Security
- ECOWAS Data Protection Act
- GDPR (for EU-exposed operations)
- ISO 27001 (aligned)
- SOC 2 Type II (in progress)

## 11. Policy Review

This policy is reviewed semi-annually or upon:
- Major system changes or upgrades
- Security incidents
- Regulatory changes in covered jurisdictions
- Organizational changes

---

*This document is maintained as part of CDH v2.1 and is subject to version control.*
