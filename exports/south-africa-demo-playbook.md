# South Africa Demo Playbook — Universal Credit Hub

**Audience:** South Africa financial-sector prospects, NCR / SARB / FSCA supervisors, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "South Africa has the most sophisticated financial sector on the continent — and the highest standards for credit data governance. The NCR's positive-reporting mandate, POPIA's consent requirements, and FSCA's oversight of credit bureaus set the bar for the entire region. Universal Credit Hub meets that bar. In the next 20 minutes I will show you a live, working platform that consolidates credit information, surfaces explainable AI risk scores, and enforces POPIA consent obligations — right out of the box. This is not a catch-up story. For South African institutions, UCH is an upgrade."

---

## Key South Africa Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 380 billion | Most industrialised economy in sub-Saharan Africa |
| Population | 62 million | Largest formal credit market in Africa |
| Credit-active consumers | 28 million+ | All 28M require POPIA-compliant consent management |
| Registered credit providers | 3 000+ (NCR-registered) | Each is a UCH data provider and subscriber |
| NCR-registered credit bureaus | 9 (TransUnion, Experian, Equifax, XDS, etc.) | UCH consolidates and cross-validates across all nine |
| Non-performing loan ratio | ~12% (retail credit, 2024) | UCH's risk engine targets NCA Section 82 affordability obligations |
| Data protection framework | Protection of Personal Information Act 2013 (POPIA) | UCH consent layer is pre-wired to POPIA conditions of lawful processing |
| Credit regulator | National Credit Regulator (NCR) under National Credit Act 34 of 2005 | UCH regulatory exports in NCR-prescribed formats |
| Prudential regulator | South African Reserve Bank (SARB) / Prudential Authority | UCH audit trail supports PA on-site examination requirements |
| Local currency | South African Rand (ZAR) | UCH natively handles ZAR alongside 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your organisation's Azure AD or Google Workspace."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and Loto Fiscal — all from one login."
- "Role-based access is enforced at both UI and API layers — a lender never sees another lender's raw borrower data."
- "POPIA's accountability principle requires every data processor to record and justify each access. UCH does that automatically."

**Credential table:**

| Account | Password | Role | What it can access |
|---|---|---|---|
| demo_admin | TestPass2026! | Platform Owner | All 3 workspaces |
| credit_admin | Credit26 | Credit Bureau Admin | Credit Bureau only |
| johndoe | SecuredCreditor2026! | Secured Creditor | Credit + Collateral |
| registry_admin | TestPass2026! | Registry Authority | Credit Bureau |

---

### Step 2 — Credit Bureau Dashboard

**What to do:** After login, navigate to the main **Dashboard**. Point out the KPI strip and the interactive Africa map.

**Talking points:**
- "This KPI strip updates in real time — total borrowers, active credit facilities, monthly new inquiries, and the platform-wide average credit score."
- "The interactive SVG Africa map highlights 54-country coverage. Drill into South Africa to see provincial-level metrics — Gauteng, Western Cape, KwaZulu-Natal."
- "All figures are aggregated server-side using SQL — no client-side approximations. NCR audit committees can trust these numbers."
- "The 300–850 credit score scale is aligned to international bureau standards — your risk analysts and scorecards do not require recalibration."

---

### Step 3 — ID-Linked Borrower Search & Positive Reporting

**What to do:** Go to **Search**. Search for a sample borrower by RSA ID number or name. Open the credit report.

**Talking points:**
- "UCH resolves borrowers against RSA ID number, passport, and company registration simultaneously — one query, one complete profile."
- "The credit report includes positive-data fields mandated by the NCR's Positive Credit Reporting regulation: current balances, payment history, and credit limits — not just negative listings."
- "Notice the POPIA consent banner. South Africa's POPIA requires a lawful basis — typically consent or legitimate interest — for every credit data disclosure. UCH enforces this at the API layer."
- "The AI score breakdown is fully explainable in terms of NCA Section 80 categories: payment behaviour, credit utilisation, credit age, account mix, and new inquiries."

---

### Step 4 — AI Credit Report Insights & POPIA-Compliant Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative."
- "The narrative explains every scoring factor in plain English. POPIA's Section 23 right to motivation for adverse decisions is satisfied directly from this output."
- "Every factor, its weight, and its direction are visible — this meets the NCR's transparency requirements and the FSCA's emerging AI governance guidelines."
- "The consumer-facing version of this narrative is available in the self-service portal in English, Afrikaans, Zulu, and Xhosa."

---

### Step 5 — Collateral Registry (PPSA-Aligned)

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "South Africa's General Laws Amendment Act 2022 and the proposed Secured Transactions Bill modernise moveable-asset security. UCH is designed to serve as the digital registry."
- "A lender can run a lien search by CIPC registration number, ID number, or asset serial number — in under 2 seconds."
- "Priority ranking is automatic — first registration wins. No manual adjudication at the Deeds Office."
- "Certificates carry a QR-code verification link — useful for attorneys, conveyancers, and insolvency practitioners who need instant verification."

---

### Step 6 — NCR & SARB Regulatory Reporting

**What to do:** Navigate to **Reports** and show the regulatory export options and the Retention Policy manager.

**Talking points:**
- "NCR statutory returns (quarterly credit industry data, annual report) can be generated as CSV, PDF, or XBRL/XML."
- "SARB Prudential Authority returns and FSCA conduct reports can be exported directly from the same interface."
- "The Retention Policy engine enforces South Africa's 5-year NCA data retention requirement and POPIA's storage limitation principle."
- "Every export is logged in the blockchain-anchored audit trail — tamper evidence is mathematically guaranteed and admissible in NCR enforcement proceedings."
- "The Erasure Request module manages POPIA Section 24 right-to-correction and right-to-deletion requests end-to-end."

---

### Step 7 — Consumer Self-Service Portal (POPIA Rights Portal)

**What to do:** Log out and navigate to the **Consumer Portal**. Show the credit score lookup, dispute filing, and credit freeze toggle.

**Talking points:**
- "This portal fulfils POPIA's Section 23 right of access — borrowers can view their complete credit profile, see who accessed their data, and download a PDF of their report at any time."
- "The dispute filing workflow maps directly to the NCR's prescribed dispute resolution process — section references are included in the acknowledgement email."
- "The Credit Freeze toggle blocks any new hard inquiry — a powerful fraud-prevention tool that South African consumers increasingly expect."
- "The Inquiry Feed shows exactly which lenders accessed the borrower's data and when — full transparency, as required by POPIA's purpose limitation principle."

---

## Closing Statement

> "What you have seen today is not a prototype — it is a production-grade platform that meets the highest regulatory standard on the continent. UCH is already architected for NCA and NCR requirements, POPIA conditions of lawful processing, SARB Prudential Authority reporting, positive credit reporting obligations, and cross-border PAPSS settlement. For South African institutions, UCH is not an alternative to your existing bureau relationships — it is the consolidation layer above them. Onboarding takes four steps: data-sharing agreement, API credential provisioning, bulk historical upload, and go-live. Our team can have you live within 30 days. What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "How do you handle POPIA consent at scale?" | "Every data access event is tied to a consent record. Consent is granular — a borrower can consent to mortgage inquiries but block personal-loan inquiries. Every grant, use, and revocation is timestamped in our blockchain-anchored audit log and exportable for POPIA Information Officer reporting." |
| "The NCR already regulates 9 credit bureaus. Why add another?" | "UCH is not a tenth bureau — it is the consolidation layer above the existing nine. We ingest from all NCR-registered bureaus and present a unified, deduped profile. Your analysts stop toggling between TransUnion, Experian, and XDS dashboards and work from one screen." |
| "How do you handle Section 71 adverse information notifications?" | "The platform generates compliant Section 71 notifications automatically when adverse information is received. The consumer receives a notification via the self-service portal and SMS, with a link to the dispute workflow." |
| "Can we satisfy the NCR's positive reporting mandate?" | "Yes. UCH ingests both positive and negative data. The credit report displays current balances, credit limits, and 24 months of payment history — exactly the positive-data fields the NCR requires under the Positive Credit Reporting regulation." |
| "What about CIPC integration?" | "UCH resolves business borrowers against the CIPC company register in real time. Directors are matched to their personal credit profiles, giving a consolidated group-risk view." |
| "How long does onboarding take?" | "30 days: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk historical upload (week 3), UAT and go-live (week 4)." |
| "What does it cost?" | "Transaction-based pricing — you pay per inquiry. Founding data partners receive a 40% discount on inquiry fees for 24 months in exchange for historical data contribution." |
| "What if a consumer lodges a POPIA complaint?" | "Every data access is logged with the lawful basis, purpose, and consenting party. Our compliance team can produce a complete audit package within 24 hours of a complaint being lodged with the Information Regulator." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Check that the Africa map loads and South Africa is highlighted
- [ ] Run a sample RSA-ID-linked borrower search — confirm positive credit report generates with AI insights
- [ ] Test the Collateral Registry lien search with a sample CIPC number
- [ ] Download a sample PDF credit report — confirm branding and AI narrative appear
- [ ] Open the Consumer Portal in an incognito window — confirm POPIA rights features are visible
- [ ] Have the NCR regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a mobile hotspot as backup internet.
- [ ] Bring printed one-page tear-sheet for each attendee (UCH overview + contact details)
- [ ] Confirm who from the prospect side will attend — note whether NCR compliance, risk, or IT
- [ ] Set your alarm. Presentation is at 09:00 AM SAST. Arrive 20 minutes early.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved.*
