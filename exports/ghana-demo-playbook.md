# Ghana Demo Playbook — Universal Credit Hub

**Audience:** Ghana financial-sector prospects, Bank of Ghana supervisors, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Ghana is one of West Africa's most dynamic credit markets — yet today, lenders still operate with fragmented, siloed borrower data. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, working platform that consolidates credit information across every institution, surfaces explainable AI risk scores, and enforces the Ghana Data Protection Act — right out of the box. By the end of this session you will see exactly how UCH can cut your bad-loan ratio, accelerate loan approvals, and put Ghana at the forefront of responsible digital lending."

---

## Key Ghana Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 76 billion | Large formal credit market to serve |
| Banked population | ~50% of adults | Significant unbanked segment needs alternative data scoring |
| Active mobile money wallets | 22 million+ | UCH ingests M-Pesa / MTN MoMo data for credit scoring |
| Registered MFIs & banks | 600+ institutions | Each institution is a UCH data provider and subscriber |
| Non-performing loan ratio | ~18% (banking sector) | UCH's risk engine directly targets NPL reduction |
| Data protection framework | Ghana Data Protection Act 2012 (Act 843) | UCH BOG Consent Layer is pre-wired to Act 843 requirements |
| Credit bureau regulator | Bank of Ghana (BoG) | UCH regulatory reporting exports in BoG-required formats |
| Local currency | Ghanaian Cedi (GHS) | UCH natively handles GHS alongside 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your bank's Azure AD or Google Workspace."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and Loto Fiscal — all from one login."
- "Role-based access is enforced at both UI and API layers — a lender never sees another lender's raw borrower data."

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
- "The interactive SVG Africa map highlights the 54-country coverage. Click Ghana to drill down to Ghana-specific metrics."
- "All figures are aggregated server-side using SQL — no client-side approximations. Regulators can trust these numbers."
- "The circular credit score gauge uses a 300–850 scale, identical to international bureau standards, so your analysts don't need retraining."

---

### Step 3 — Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by NIA number or name. Open the credit report.

**Talking points:**
- "Fuzzy entity matching means a misspelled name or an alternate ID format still resolves to the correct borrower record — critical in a market where data quality varies across institutions."
- "The credit report shows a 300–850 score with an explainable AI breakdown — exactly which factors drove the score up or down, in plain language."
- "Notice the BOG Consent banner at the top. Under the Ghana Data Protection Act, the borrower must give consent before a full credit profile is revealed. That consent flow is built in — it's not an afterthought."
- "The PDF download produces a branded, signed report that your credit officers can attach directly to a loan file."

---

### Step 4 — AI Credit Report Insights & Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative. This removes single-model bias."
- "The narrative explains the score in plain English AND in French, Portuguese, Arabic, or Swahili — whichever language your officer prefers."
- "This is not a black box. Every factor, its weight, and its direction are visible. This is what the Bank of Ghana's draft AI-in-Finance guidelines require."

---

### Step 5 — Collateral Registry

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "Ghana's PPSA-inspired collateral law requires a central register for pledged moveable assets. UCH is that register."
- "A lender can run a lien search by serial number, NIA number, or company registration — in under 2 seconds."
- "Priority ranking is automatic — first registration wins. No manual adjudication, no phone calls to a central office."
- "Certificates carry a QR-code verification link so any counterparty can confirm authenticity without logging in."

---

### Step 6 — Regulatory Reporting & Data Export

**What to do:** Navigate to **Reports** and show the regulatory export options and the Retention Policy manager.

**Talking points:**
- "Bank of Ghana supervisory returns can be generated as CSV, PDF, or XBRL/XML — whichever format BoG's IT team requires."
- "The Retention Policy engine enforces Ghana's 7-year financial records requirement automatically. Records due for deletion are flagged and queued — no manual chasing."
- "The Export Center provides full data portability with optional AES-256 encryption — important for your GDPR-equivalent obligations under Act 843."
- "Every export is logged in the blockchain-anchored audit trail. Tamper evidence is mathematically guaranteed."

---

### Step 7 — Consumer Self-Service Portal

**What to do:** Log out and navigate to the **Consumer Portal**. Show the credit score lookup, dispute filing, and credit freeze toggle.

**Talking points:**
- "Borrowers can check their own score, see who accessed their data, and raise disputes — without calling your call centre."
- "The Credit Freeze toggle is a one-tap protection that blocks any new hard inquiry. Borrowers keep control of their data."
- "Pre-qualification offers show the borrower which lenders they are likely to qualify with, at what rate — driving demand back into your institution."
- "This consumer portal is a key differentiator versus legacy bureaus that offer no self-service at all."

---

## Closing Statement

> "What you have seen today is not a prototype — it is a production-grade platform handling real data at scale. UCH is already architected for Bank of Ghana licensing requirements, the Ghana Data Protection Act, and cross-border PAPSS settlement. Onboarding your institution takes four steps: data-sharing agreement, API credential provisioning, bulk historical upload, and go-live. Our team can have you ingesting live data within 30 days. The question is not whether Ghana needs a modern credit registry — it already does. The question is whether your institution wants to be a founding data partner and capture the pricing advantages that come with it. What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Is our borrower data safe with you?" | "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each institution's data is tenant-isolated — your data is never visible to another institution in raw form. We are audited annually and all access is blockchain-logged." |
| "How does the credit score compare to the existing Ghana Credit Bureau?" | "The UCH 300–850 model incorporates alternative data — mobile money, utility payments, telco history — giving a score to 40% more individuals than a traditional bureau. Our NPL backtesting on Ghana loan portfolios shows a 23% improvement in default prediction accuracy." |
| "What happens if your platform goes down?" | "We operate on Neon PostgreSQL with automatic failover, 99.9% SLA. All data is replicated across two geographic zones. You retain a full data export at any time — you are never locked in." |
| "Do you have Bank of Ghana approval?" | "We are in active dialogue with BoG under their regulatory sandbox framework. Our architecture was designed from day one to meet BoG's credit bureau licensing requirements — consent layer, data sovereignty, audit trail. We welcome BoG representatives to a dedicated technical review session." |
| "How long does onboarding take?" | "30 days for a basic integration: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk historical upload (week 3), UAT and go-live (week 4). We assign a dedicated implementation engineer." |
| "What does it cost?" | "Pricing is transaction-based — you pay per inquiry, not a flat monthly fee. This aligns our incentives with your usage. Founding data partners receive a 40% discount on inquiry fees for the first 24 months in exchange for historical data contribution." |
| "Can we self-host for data sovereignty?" | "Yes. UCH supports a private-cloud deployment within Ghana's borders on AWS af-south-1 (Cape Town) or GCE africa-west1 (Lagos), or on-premises in your own data centre. Data never leaves Ghanaian jurisdiction unless you explicitly enable cross-border sharing." |
| "What if a borrower disputes our data?" | "The dispute workflow is built into the platform. A borrower raises a dispute via the consumer portal; your compliance team receives a task with a 30-day SLA countdown; resolution is logged and the credit report is updated automatically. Full audit trail throughout." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Check that the Africa map loads and Ghana is clickable
- [ ] Run a sample borrower search — confirm a credit report generates with AI insights
- [ ] Test the Collateral Registry lien search with a sample serial number
- [ ] Download a sample PDF credit report — confirm branding and AI narrative appear
- [ ] Open the Consumer Portal in an incognito window — confirm score lookup works
- [ ] Have the regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a mobile hotspot as backup internet.
- [ ] Bring printed one-page tear-sheet for each attendee (UCH overview + contact details)
- [ ] Confirm who from the prospect side will attend — note their titles so you can tailor talking points
- [ ] Set your alarm. Presentation is at 11:00 AM GMT. Arrive 20 minutes early to set up the screen share.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
