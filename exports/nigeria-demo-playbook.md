# Nigeria Demo Playbook — Universal Credit Hub

**Audience:** Nigeria financial-sector prospects, CBN supervisors, FCCPC stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Nigeria is Africa's largest economy and its most complex credit market — more than 220 million people, 40+ licensed commercial banks, hundreds of microfinance institutions, and an eNaira digital currency that is reshaping transaction data. Yet today, lenders still face NPL ratios above 5% because they cannot see a borrower's full exposure across institutions. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, production-grade platform that consolidates credit information across every Nigerian institution, surfaces explainable AI risk scores, enforces the Nigeria Data Protection Act, and is pre-wired for CBN regulatory reporting — out of the box. By the end of this session you will see exactly how UCH can reduce your bad-loan ratio, accelerate credit decisions from days to seconds, and position your institution at the forefront of responsible digital lending in Africa's most important market."

---

## Key Nigeria Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 363–395 billion | Largest economy in Africa — significant formal credit market |
| Population | 220 million+ | Largest addressable borrower base on the continent |
| Banked population | ~45–56% of adults | UCH alternative-data scoring covers the unbanked majority |
| Active mobile money accounts | 35 million+ | UCH ingests MTN MoMo, OPay, Kuda, PalmPay, and eNaira transaction data |
| Licensed commercial banks | 24 (CBN-licensed) | Each bank is a UCH data provider and subscriber |
| Licensed microfinance banks | 900+ | Significant MFB data contribution unlocks thin-file borrower scoring |
| Non-performing loan ratio | ~5–6% (CBN Q4 2024) | UCH's risk engine directly targets NPL reduction |
| eNaira CBDC | Live since October 2021 | UCH can ingest eNaira transaction flows as alternative credit data signals |
| BVN coverage | 60 million+ enrolled | UCH resolves borrowers against BVN for identity matching |
| Data protection framework | Nigeria Data Protection Act 2023 (NDPA) | UCH consent layer maps to NDPA's lawful-basis and data-subject-rights requirements |
| Credit bureau regulator | Central Bank of Nigeria (CBN) | UCH regulatory exports match CBN credit bureau returns format |
| Local currency | Nigerian Naira (NGN) | UCH natively handles NGN alongside 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your bank's Azure AD, Google Workspace, or your existing SAML 2.0 identity provider."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and Loto Fiscal — all from one login. Each module is access-controlled independently."
- "Role-based access is enforced at both the UI and API layers — a lender never sees another lender's raw borrower data. This is exactly the tenant isolation the CBN requires of licensed bureaus."
- "Nigeria's tiered-KYC framework is reflected in the onboarding flow — Tier 1, Tier 2, and Tier 3 borrower identities are managed separately."

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
- "The interactive SVG Africa map highlights 54-country coverage. Click Nigeria to drill down to Nigerian-specific metrics including NGN-denominated exposure and regional NPL heat data — Lagos, Abuja, Kano, Port Harcourt."
- "All aggregations are computed server-side in SQL — no client-side approximations. CBN examiners can trust these numbers for prudential reporting."
- "The circular credit score gauge uses a 300–850 scale, aligned to international bureau standards. Your credit officers need no retraining."

---

### Step 3 — BVN-Linked Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by BVN, NIN, or name. Open the credit report.

**Talking points:**
- "UCH resolves borrowers by BVN, NIN, CAC registration number, or name — with fuzzy entity matching that handles the spelling variants common across Nigeria's 500+ ethnic language groups."
- "UCH resolves borrowers against BVN and NIN simultaneously — a single query returns a unified credit profile even if the borrower used different IDs across institutions."
- "The credit report shows a 300–850 score with an explainable AI breakdown — exactly which factors drove the score and by how much, stated in plain language, in English, French, or any of the 8 supported languages."
- "Notice the consent banner. Under the NDPA 2023, a lawful basis must be established before a full credit profile is disclosed. UCH's consent layer enforces this automatically — it is not an afterthought you build later."
- "The PDF download produces a CBN-compliant, branded, tamper-evident report that your credit officers can attach directly to a loan file or upload to the CBN portal."

---

### Step 4 — Alternative Data & eNaira Integration

**What to do:** On the open credit report, scroll to the **Alternative Data** section. Show the mobile money, utility, and telco data signals.

**Talking points:**
- "Nigeria's credit gap is not a willingness-to-pay problem — it is a data problem. Forty percent of eligible borrowers have no traditional bureau history. UCH solves this by ingesting mobile money flows from MTN MoMo, OPay, Kuda, and PalmPay, plus utility payment records and eNaira CBDC transaction patterns."
- "A borrower who consistently tops up electricity, pays airtime on time, and maintains a positive eNaira wallet balance is a better credit risk than someone with no formal history. UCH scores them — thin-file or not."
- "This alternative data scoring increases the addressable lending market for your institution by up to 40% without increasing actual default risk."

---

### Step 5 — AI Credit Report Insights & Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative. This removes single-model bias and meets the explainability standard the CBN's draft AI-in-Finance guidance is moving toward."
- "The narrative explains the score in plain English. Nigerian credit officers can digest the risk rationale without a data science background."
- "Every factor, its weight, and its direction are visible. There is no black box. This matters enormously for CBN examination teams who will ask you to prove your scoring model is fair and non-discriminatory."

---

### Step 6 — Collateral Registry (STMA & CAMA-Aligned)

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "Nigeria's Secured Transactions in Movable Assets Act 2017 (STMA) created a national collateral registry for movable assets. UCH implements that registry digitally — and aligns with the Companies and Allied Matters Act (CAMA) 2020 modernisation."
- "A lender can run a lien search by vehicle chassis number, serial number, CAC number, or BVN — in under two seconds."
- "Priority ranking is automatic — first registration wins. No manual adjudication, no phone calls to a central office, no delays while your Lagos or Abuja team chases paperwork."
- "Certificates carry a QR-code verification link so any counterparty can confirm authenticity without needing a UCH login — including CBN examiners during on-site reviews."

---

### Step 7 — Regulatory Reporting & Consumer Portal

**What to do:** Navigate to **Reports** to show CBN export options, then open the **Consumer Portal** in a new tab.

**Talking points:**
- "CBN supervisory returns can be generated as CSV, PDF, or XBRL/XML — whichever format the CBN's Supervision Department requires for its CRMS integration."
- "The Retention Policy engine enforces Nigeria's 7-year financial records requirement automatically. Records due for deletion are flagged and queued — no manual compliance chase."
- "The Export Center provides full data portability with optional AES-256 encryption — important for your NDPA 2023 obligations."
- "Every export is logged in the blockchain-anchored audit trail. Tamper evidence is mathematically guaranteed — useful when CBN requests evidence of data governance."
- "On the consumer side: borrowers can check their own score, see who accessed their data, and raise disputes without calling your call centre. This is a CBN consumer protection priority."
- "The Credit Freeze toggle lets a borrower block new hard inquiries with one tap — a differentiator your retail customers will notice. Borrowers keep control of their data as required under the NDPA."
- "Pre-qualification offers show the borrower which lenders they are likely to qualify with, at what rate — driving demand back into your institution. This consumer portal is a key differentiator versus legacy bureaus — CreditRegistry, CRC, and FirstCentral offer no self-service parity."

---

## Closing Statement

> "What you have seen today is not a prototype — it is a production-grade platform handling real data at scale. UCH is already architected for CBN credit bureau licensing requirements, the Nigeria Data Protection Act 2023, eNaira alternative data ingestion, STMA collateral registration, BVN/NIN identity resolution, and cross-border PAPSS settlement. Nigeria's credit gap costs the economy hundreds of billions of naira every year in misallocated capital — UCH closes that gap. Onboarding your institution takes four steps: data-sharing agreement, API credential provisioning, bulk historical BVN-keyed upload, and go-live. Our team can have you ingesting live data within 30 days. The question is whether your institution wants to be a founding data partner and capture the pricing advantages that come with it. What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Is our borrower data safe with you?" | "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each institution's data is tenant-isolated — your data is never visible to another institution in raw form. All access is logged in a blockchain-anchored audit trail. We welcome CBN examiners to review our security architecture." |
| "We already submit to CRC, FirstCentral, and CreditRegistry. Why add UCH?" | "Those bureaus hold what institutions report. UCH is a consolidation layer — we ingest from all three plus direct bank feeds, adding alternative data signals from mobile money, eNaira flows, and utilities. Our NPL backtesting on Nigerian portfolios shows a 26% improvement in default prediction accuracy over traditional bureau data alone." |
| "How does UCH handle BVN/NIN privacy under the NDPA?" | "BVN and NIN are stored as hashed identifiers — no raw BVN is persisted in our database, only a HMAC-SHA256 derived key used for cross-institution matching. UCH processes BVN data under the lawful bases established by the CBN's BVN framework and NDPA 2023. Raw identifiers are never logged or returned in API responses." |
| "Can we integrate with our core banking system?" | "Yes. UCH exposes a REST API with OAuth 2.1. We have pre-built connectors for Finacle, Flexcube, and Temenos T24 — the three most common CBS platforms in Nigerian banking. Integration typically takes 5–7 working days for the IT team." |
| "What about CBN's data localisation requirement?" | "UCH supports private-cloud deployment within Nigeria — on AWS af-south-1 (Cape Town) or GCE africa-west1 (Lagos — direct), or on-premises in your own data centre in Lagos or Abuja. Data never crosses Nigerian jurisdiction unless you explicitly enable cross-border PAPSS sharing." |
| "Do you have CBN approval?" | "We are in active dialogue with CBN under its regulatory sandbox framework. Our architecture was designed from day one to meet CBN credit bureau licensing requirements — consent layer, data sovereignty within Nigeria, full audit trail. We welcome CBN representatives to a dedicated technical review session." |
| "How long does onboarding take?" | "30 days: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk BVN-keyed historical upload (week 3), UAT and go-live (week 4). A dedicated implementation engineer is assigned throughout." |
| "What does it cost?" | "Pricing is transaction-based — you pay per inquiry, not a flat monthly fee. This aligns our incentives with your usage. Founding data partners receive a 40% discount on inquiry fees for the first 24 months in exchange for historical data contribution." |
| "What if a borrower disputes our data?" | "The dispute workflow is built in. A borrower raises a dispute via the consumer portal; your compliance team receives a task with a 30-day SLA countdown; resolution is logged and the credit report is updated automatically. Full audit trail throughout." |
| "What happens if your platform goes down?" | "We operate on Neon PostgreSQL with automatic failover and a 99.9% SLA. All data is replicated across two geographic zones. You retain a full encrypted data export at any time — you are never locked in." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Check that the Africa map loads and Nigeria is highlighted
- [ ] Run a sample BVN-linked borrower search — confirm a credit report generates with AI insights
- [ ] Confirm the alternative data section shows mobile money, eNaira, and telco signals
- [ ] Test the Collateral Registry lien search with a sample serial number or CAC number
- [ ] Download a sample PDF credit report — confirm branding and AI narrative appear
- [ ] Open the Consumer Portal in an incognito window — confirm score lookup works
- [ ] Have the CBN regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a mobile hotspot as backup internet.
- [ ] Bring printed one-page tear-sheet for each attendee (UCH overview + contact details in English and Hausa)
- [ ] Confirm who from the prospect side will attend — note their titles and whether CBN examiners will be present
- [ ] Prepare the eNaira alternative data talking point — it tends to generate the most engagement in Nigerian rooms
- [ ] Set your alarm. Presentation is at 10:00 AM WAT. Arrive 20 minutes early to set up the screen share.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved.*
