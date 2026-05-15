# UCH v2.8 — User Access Level Blueprint

Last updated: March 2026

---

## 1. User Levels Overview

| # | Role | Who They Are | Data Scope | Auth System |
|---|------|-------------|------------|-------------|
| 1 | **Super Admin** | Platform owner / operator | All countries, all organizations | Main login |
| 2 | **Admin** | Institution administrator | Own organization + own country | Main login |
| 3 | **Regulator** | Central bank / government auditor | Own country (read-heavy) | Main login |
| 4 | **Lender** | Bank, MFI, or telco submitting data | Own organization + own country | Main login |
| 5 | **Viewer** | Read-only institution staff | Own organization + own country (read only) | Main login |
| 6 | **Consumer** | Individual borrower (self-service) | Own credit report only | Separate portal |

---

## 2. Data Isolation Rules

### Country-Level Isolation
- Non-super-admin users are locked to their organization's country
- They can only view borrowers, credit accounts, and telco data from their own country
- Enforced by `enforceDataSovereignty` middleware and `getCountryFilter()` on every query

### Organization-Level Isolation
- Data queries are scoped by `organizationId` via `getOrgScope()`
- Lenders see only borrowers submitted by their institution
- Admins see all data within their country

### Consumer Portal Isolation
- Completely separate authentication system (`consumer_accounts` table)
- Consumers log in via national ID + OTP or Google OAuth
- Can only view their own credit report — no access to any other borrower

---

## 3. Detailed Access Matrix

### A. SUPER ADMIN — Full Platform Control

**Sidebar Sections Visible:** All sections

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Dashboard & Analytics | Yes | — | All countries, all stats |
| Portfolio Intelligence | Yes | — | AI reports, all data |
| AI Command Center | Yes | Yes | All 6 AI tools |
| Platform Metrics | Yes | — | MRR, ARR, subscriptions |
| Telco Scoring | Yes | Yes | All countries |
| Telco Lending | Yes | Yes | Disburse, repay, manage |
| Consumers / Businesses | Yes | Yes | All countries |
| Borrowers (All) | Yes | Yes | Cross-country view |
| Credit Accounts | Yes | Yes | All accounts |
| Disputes | Yes | Yes | File and resolve |
| Approvals | Yes | Yes | Approve/reject |
| Consent Records | Yes | Yes | Grant and revoke |
| Batch Upload | Yes | Yes | All formats |
| Institutions | Yes | Yes | Create, approve |
| Command Center | Yes | Yes | Super admin only |
| Organizations | Yes | Yes | Manage all orgs |
| User Management | Yes | Yes | Create/edit/delete users |
| Billing | Yes | Yes | View and create |
| Exchange Rates | Yes | Yes | Manage rates |
| API Admin / Keys | Yes | Yes | Full API control |
| System Status | Yes | — | Health, uptime |
| Webhooks | Yes | Yes | Manage webhooks |
| Security Health Check | Yes | — | API endpoint |
| PII Integrity Check | Yes | — | API endpoint |
| Data Erasure | Yes | Yes | Submit erasure requests |
| Blockchain Anchoring | Yes | Yes | Manual anchor |
| Audit Trail | Yes | — | Full audit history |
| Regulatory Dashboard | Yes | — | Compliance view |
| Cross-Border / SATA | Yes | Yes | Agreements, search |
| PAPSS Settlements | Yes | Yes | Settlement tracking |
| Documentation | Yes | — | All docs |

---

### B. ADMIN — Institution Administrator

**Sidebar Sections Visible:** Global View (minus Platform Metrics), Telco, Borrowers & Lenders, Operations, Oversight, Cross-Border, Admin (minus Command Center, Organizations)

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Dashboard & Analytics | Yes | — | Own country only |
| Portfolio Intelligence | Yes | — | Own country |
| AI Command Center | Yes | Yes | All AI tools |
| Platform Metrics | No | No | Hidden |
| Telco Scoring | Yes | Yes | Score, import data |
| Telco Lending | Yes | Yes | Loans, disbursements |
| Consumers / Businesses | Yes | Yes | Own country |
| Borrowers (All) | No | No | Use Consumers/Businesses |
| Credit Accounts | Yes | Yes | Own country |
| Disputes | Yes | Yes | File and resolve |
| Approvals | Yes | Yes | Approve/reject |
| Consent Records | Yes | Yes | Grant and revoke |
| Batch Upload | Yes | Yes | All formats |
| Institutions | Yes | Yes | Manage, approve |
| Command Center | No | No | Super admin only |
| Organizations | No | No | Super admin only |
| User Management | Yes | Yes | Within own org |
| Billing | Yes | Yes | View and manage |
| Exchange Rates | Yes | Yes | Manage |
| API Admin / Keys | Yes | Yes | Manage API access |
| System Status | Yes | — | View health |
| Webhooks | Yes | Yes | Manage |
| Audit Trail | Yes | — | View |
| Regulatory Dashboard | Yes | — | View |
| Cross-Border / SATA | Yes | Yes | Agreements, search |
| PAPSS Settlements | Yes | Yes | View |
| Borrower Alerts | Yes | Yes | Configure alerts |
| Data Erasure | Yes | Yes | Submit requests |
| Security Health Check | Yes | — | View |

---

### C. REGULATOR — Government / Central Bank Auditor

**Sidebar Sections Visible:** Global View (minus Platform Metrics), Telco (read only), Borrowers & Lenders (read only), Operations (limited), Oversight, Cross-Border, Admin (Billing, Retention only)

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Dashboard & Analytics | Yes | — | Own country |
| Portfolio Intelligence | Yes | — | AI reports |
| AI Command Center | Yes | Yes | Regulatory reports |
| Platform Metrics | No | No | Hidden |
| Telco Scoring | Yes | No | View only |
| Telco Lending | Yes | No | View only |
| Consumers / Businesses | Yes | No | View only |
| Credit Accounts | Yes | No | View only |
| Disputes | Yes | Yes | Resolve disputes |
| Approvals | Yes | Yes | Approve/reject |
| Consent Records | Yes | Yes | Revoke consent |
| Batch Upload | No | No | Hidden |
| Institutions | No | No | Hidden |
| User Management | No | No | Hidden |
| Billing | Yes | — | View only |
| Audit Trail | Yes | — | Full access |
| Regulatory Dashboard | Yes | — | Primary workspace |
| Regulatory Compliance | Yes | — | Compliance view |
| Cross-Border / SATA | Yes | — | View agreements |
| PAPSS Settlements | Yes | — | View |
| Borrower Alerts | Yes | — | View alerts |
| Security Audit Summary | Yes | — | API endpoint |
| Security Health Check | Yes | — | API endpoint |
| BOG/BSL Export | Yes | — | Regulatory export |

---

### D. LENDER — Bank / MFI / Telco Data Submitter

**Sidebar Sections Visible:** Global View (Dashboard only), Telco, Borrowers & Lenders (minus Institutions), Operations (Batch Upload, Disputes, Consent), Cross-Border Search only

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Dashboard & Analytics | Yes | — | Own country/org |
| Portfolio Intelligence | No | No | Hidden |
| AI Command Center | No | No | Hidden |
| Platform Metrics | No | No | Hidden |
| Telco Scoring | Yes | Yes | Score, import, run engine |
| Telco Lending | Yes | — | View loans, repayments |
| Consumers / Businesses | Yes | Yes | Own country, submit data |
| Credit Accounts | Yes | Yes | Create, update |
| Credit Inquiries | Yes | Yes | Submit inquiries |
| Score Methodology | Yes | — | View methodology |
| Disputes | Yes | Yes | File disputes |
| Consent Records | Yes | Yes | Grant consent |
| Batch Upload | Yes | Yes | Submit data files |
| Cross-Border Search | Yes | — | Search only |
| Institutions | No | No | Hidden |
| User Management | No | No | Hidden |
| Billing | No | No | Hidden |
| Audit Trail | No | No | Hidden |
| API Admin | No | No | Hidden |

---

### E. VIEWER — Read-Only Staff

**Sidebar Sections Visible:** Global View (Dashboard only), Borrowers & Lenders (Consumers, Businesses, Credit Accounts, Search, Reports), Helpdesk, Documentation

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Dashboard | Yes | — | Own country/org |
| Consumers / Businesses | Yes | No | View only |
| Credit Accounts | Yes | No | View only |
| Credit Search | Yes | — | Search only |
| Credit Reports | Yes | — | View/generate |
| Helpdesk | Yes | — | Chat support |
| Documentation | Yes | — | View docs |
| Telco (all) | No | No | Hidden + API blocked |
| Disputes | No | No | Hidden + API blocked |
| Consent | No | No | Hidden + API blocked |
| Batch Upload | No | No | Hidden + API blocked |
| Approvals | No | No | Hidden + API blocked |
| All Admin pages | No | No | Hidden + API blocked |
| All Oversight pages | No | No | Hidden + API blocked |

---

### F. CONSUMER — Self-Service Portal (Separate System)

**Completely separate login at /my-credit. No sidebar. No access to main app.**

| Area | Read | Write | Notes |
|------|------|-------|-------|
| Own Credit Report | Yes | — | Rate-limited lookups |
| Own Credit Score | Yes | — | Score + factors |
| File Dispute | — | Yes | On own records only |
| Track Dispute | Yes | — | Own disputes only |
| Manage Consent | Yes | Yes | Own consent only |
| Any Other Borrower | No | No | Completely isolated |
| Any Admin Function | No | No | No access |
| Main App Dashboard | No | No | No access |

---

## 4. When You Create a New User

When creating a user at **User Management (/users)**, you set:

1. **Username** — Their login name
2. **Password** — Must meet: 8+ chars, uppercase, lowercase, digit, special char
3. **Full Name** — Display name
4. **Email** — For notifications
5. **Role** — Pick from: `super_admin`, `admin`, `regulator`, `lender`, `viewer`
6. **Division** — Optional: `retail`, `corporate`, `telco` (affects default landing page)
7. **Organization** — Which institution they belong to (determines country scope)
8. **Status** — `active`, `suspended`, `pending`

### What each field controls:

| Field | Controls |
|-------|----------|
| **Role** | Which pages they see, which API endpoints they can call, read vs write |
| **Division** | Where they land after login (`telco` → Telco Scoring, `corporate` → Businesses, `retail` → Consumers) |
| **Organization** | Which country's data they can see, organization-level data scoping |
| **Status** | `active` = can log in, `suspended` = blocked, `pending` = awaiting approval |

### Security enforced on every new user automatically:
- Password must be changed within 90 days (or on first login if `mustChangePassword` is set)
- Cannot reuse last 5 passwords
- Account locks after 3 failed login attempts (15-minute lockout)
- New IP addresses flagged in audit log
- All actions logged to immutable audit trail
- Session expires after 30 minutes of inactivity
- CSRF token required for all write operations

---

## 5. Enforcement Summary

| Layer | What It Enforces |
|-------|-----------------|
| **Frontend Sidebar** | Hides menu items by role — users don't even see pages they can't access |
| **Frontend Router** | Protected routes redirect unauthenticated users to login |
| **Global Auth Middleware** | ALL `/api` routes require valid session (except public endpoints) |
| **Role Middleware** | `requireRole()` blocks API calls from wrong roles with 403 |
| **Data Sovereignty** | `enforceDataSovereignty` locks queries to user's country |
| **Organization Scoping** | `getOrgScope()` limits data to user's organization |
| **Consumer Isolation** | Separate auth system, separate database table, no crossover |
| **Audit Trail** | Every action logged with user ID, IP, timestamp, hash chain |
