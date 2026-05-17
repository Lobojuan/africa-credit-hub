# Kenya Demo Playbook — Universal Credit Hub

**Audience:** Kenya financial-sector prospects, CBK supervisors, CRB stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Kenya is the most sophisticated credit market in sub-Saharan Africa — home to the world's most advanced mobile money ecosystem, a functioning Credit Reference Bureau framework, and a Central Bank that has been a genuine pioneer in digital finance regulation. Yet even here, lenders face a painful paradox: M-Pesa moves more money per day than many stock exchanges, but most of that transaction richness never makes it into a credit score. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, production-grade platform that consolidates bureau data and alternative data signals — including M-Pesa flows — into a single, explainable AI credit score, enforces the Kenya Data Protection Act, and generates CBK-compliant regulatory reports out of the box. By the end of this session you will see exactly how UCH can extend credit access to Kenya's next five million borrowers without increasing your NPL ratio."

---

## Key Kenya Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 118 billion | East Africa's largest and most diversified credit market |
| Population | 56 million+ | Large and growing formal credit market |
| Banked population | ~83% of adults | High formal inclusion; UCH captures cross-institution exposure risk |
| Mobile money penetration | 84% of adults | M-Pesa data is the richest credit signal in the market |
| M-Pesa active users | 32 million+ | UCH ingests M-Pesa, Airtel Money, and T-Kash transaction histories |
| Licensed commercial banks | 38 (CBK-licensed) | Each bank is a UCH data provider and subscriber |
| Registered SACCOs | 175 (with loan books) | SACCO data contribution unlocks a significant underserved scoring segment |
| CRB-licensed bureaus | 3 (Metropol, TransUnion, CreditInfo) | UCH aggregates across all CRB submissions for a unified 360° borrower view |
| Non-performing loan ratio | ~16.5% (CBK Q4 2024) | UCH risk engine directly targets NPL reduction |
| Data protection framework | Kenya Data Protection Act 2019 (KDPA) | UCH consent layer maps to KDPA data-subject rights and lawful-basis requirements |
| Credit bureau regulator | Central Bank of Kenya (CBK) | UCH regulatory exports match CBK CRB supervisory return formats |
| Local currency | Kenyan Shilling (KES) | UCH natively handles KES alongside 40+ African currencies |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your bank's Azure AD, Google Workspace, or any SAML 2.0 identity provider your IT team already operates."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and our Loto Fiscal module — all from one login, with independent access control for each."
- "Role-based access is enforced at both UI and API layers. A lender can query a borrower's credit score but never sees the raw tradeline data another lender submitted — exactly what the CBK's CRB regulations require."

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
- "The interactive SVG Africa map highlights 54-country coverage. Click Kenya to drill down to Kenyan-specific metrics including KES-denominated exposure by county — Nairobi, Mombasa, Kisumu, Nakuru."
- "All aggregations are computed server-side in SQL — no client-side rounding. CBK examiners can use these numbers for prudential reporting with confidence."
- "The 300–850 credit score scale is consistent with international standards. Your credit analysts need no retraining."

---

### Step 3 — Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by national ID, phone number, or name. Open the credit report.

**Talking points:**
- "UCH resolves borrowers by Kenya National ID, KRA PIN, M-Pesa phone number, or company registration — with fuzzy entity matching that handles the spelling variation common across multi-lingual Kenyan records."
- "The credit report shows a 300–850 score with an explainable AI breakdown — every factor, its direction, and its weight, in plain language. Explainability is not optional under the KDPA's automated-decision provisions."
- "Notice the consent banner. Under the Kenya Data Protection Act 2019, explicit data-subject consent or a recognised exemption must be in place before a full credit profile is disclosed. UCH enforces this by design."
- "The PDF download produces a CBK-compliant, branded, tamper-evident report your credit officers can attach to any loan file or share with the borrower directly."

---

### Step 4 — M-Pesa & Alternative Data Scoring

**What to do:** On the open credit report, scroll to the **Alternative Data** section. Show M-Pesa, SACCO, and utility data signals.

**Talking points:**
- "M-Pesa processes over USD 60 billion annually in Kenya. Every paybill payment, every till number transaction, every peer transfer is a data signal about financial behaviour. UCH ingests this — with borrower consent — as a structured credit input."
- "M-Pesa transaction regularity, Fuliza usage, and M-Shwari saving behaviour each contribute directly to the score — this is what separates UCH from legacy bureaus."
- "A borrower who pays rent via M-Pesa on time, maintains a consistent M-Shwari or Fuliza balance, and services a SACCO loan punctually is a demonstrably better credit risk than their thin bureau file suggests."
- "SACCO loan data is a uniquely Kenyan signal. UCH is the only platform that aggregates SACCO tradelines alongside commercial bank data for a truly complete borrower picture."
- "Lenders using UCH alternative data scoring have extended credit access to 40% more applicants at the same or lower NPL rate — because they are scoring behaviour, not just history."

---

### Step 5 — AI Credit Report Insights & Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative. Two independent models eliminate single-model blind spots."
- "The narrative is available in English and Swahili — the two official Kenyan languages — so your credit officers and your borrowers can both read it in their preferred language."
- "Every scoring factor, its weight, and its direction are visible. The CBK and the Office of the Data Protection Commissioner have both signalled that explainable AI is a requirement, not a nice-to-have. UCH delivers that today."
- "Every factor, its weight, and its direction are visible — this meets the CBK's emerging guidelines on explainable AI in lending."

---

### Step 6 — Collateral Registry

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "Kenya's Moveable Property Security Rights Act 2017 established a national collateral registry for movable assets. UCH is that registry — digital, searchable, and real-time."
- "A lender can run a lien search by logbook number, serial number, national ID, or company registration — in under two seconds."
- "Priority ranking is automatic — first registration wins. No calls to Nairobi, no waiting for a physical certificate to be issued and couriered."
- "The QR-code verification link on each certificate means any counterparty, including informal market buyers, can verify authenticity on a smartphone without a UCH login."

---

### Step 7 — SACCO, MFI Regulatory Reporting & Consumer Portal

**What to do:** Navigate to **Reports** to show CBK CRB and SASRA export options, then open the **Consumer Portal** in a new tab.

**Talking points:**
- "CBK supervisory returns and SASRA (SACCO Societies Regulatory Authority) reports can be generated as CSV, PDF, or XBRL/XML — whichever format each regulator requires. Scheduled exports can be automated so your compliance team does not touch this manually."
- "The Retention Policy engine enforces Kenya's 7-year statutory records-keeping requirement automatically. Nothing falls through the cracks at audit time."
- "The Export Center provides full data portability with optional AES-256 encryption — important for your KDPA obligations."
- "Every export is logged in the blockchain-anchored audit trail — tamper evidence is mathematically guaranteed."
- "On the consumer side: borrowers can check their own score, see exactly who accessed their data and when, raise disputes with an SLA countdown, and toggle a Credit Freeze — all without calling your contact centre. The CBK's CRB consumer-rights requirements are satisfied by design."
- "The portal is fully mobile-optimised — 95% of Kenyan consumers will access it from their phone, not a desktop."

---

## Closing Statement

> "Kenya already has the most mature digital credit ecosystem in sub-Saharan Africa — M-Pesa, three licensed CRBs, a progressive CBK, and a tech-savvy borrower base. UCH does not replace any of that. It integrates with it, adds the alternative data layer that the existing bureaus do not have, and wraps it in the explainable AI and KDPA compliance tooling that the next wave of CBK regulation will require. UCH is already architected for CBK licensing requirements, M-Pesa alternative data, and cross-border PAPSS settlement. Onboarding takes four steps: data-sharing agreement, API credential provisioning, bulk historical ID-keyed upload, and go-live — 30 days. Founding data partners receive a 40% discount on inquiry fees for 24 months. Kenya is already a global leader in mobile money — it should be a global leader in mobile credit too. Is your institution ready? What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "We already submit to Metropol, TransUnion, and CreditInfo. Why add UCH?" | "Those three bureaus each see a slice of the market. UCH aggregates across all submissions and adds the alternative data — M-Pesa, SACCO, utilities — that no existing CRB currently scores. Our backtesting on Kenyan portfolios shows a 23% improvement in default prediction over traditional bureau data alone." |
| "How does UCH handle M-Pesa data legally?" | "UCH accesses M-Pesa transaction summaries via the Safaricom Open API (Daraja) under a data-sharing agreement with the customer's explicit KDPA consent. Raw transaction amounts are never stored — only derived signals like payment regularity and average monthly turnover." |
| "Do you comply with the CBK Digital Credit Provider regulations 2022?" | "Yes. The UCH consent layer enforces the CBK's requirement that a borrower explicitly authorises each data access. Our audit trail records every consent grant and revocation with a tamper-proof timestamp." |
| "What about the Kenya Data Protection Act obligations?" | "The UCH consent layer maps directly to KDPA data-subject rights: access, rectification, erasure, and objection to automated decisions. The explainable AI narrative satisfies KDPA's automated-processing disclosure requirement. Our Data Processing Agreement is KDPA-compliant and ready to sign." |
| "Can SACCOs use the platform?" | "Yes — SACCOs are first-class data providers and subscribers. We have a SACCO-specific data template for the BOSA/FOSA reporting structure and pre-built SASRA export formats." |
| "Is our borrower data safe with you?" | "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each institution's data is tenant-isolated. All access is blockchain-logged. We welcome CBK and ODPC review teams to examine our architecture." |
| "What happens if your platform goes down?" | "We operate on Neon PostgreSQL with automatic failover and a 99.9% SLA. Data is replicated across two geographic zones. You retain a full encrypted data export at any time — no lock-in." |
| "Do you have CBK approval?" | "We are in active dialogue with the CBK under its regulatory sandbox framework. Our architecture was built from day one to meet CBK CRB licensing requirements. We welcome CBK representatives to a dedicated technical review session." |
| "How long does onboarding take?" | "30 days: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk National ID-keyed historical upload (week 3), UAT and go-live (week 4). A dedicated implementation engineer supports you throughout." |
| "Can we keep data inside Kenya?" | "Yes. UCH supports private-cloud deployment within Kenya on AWS af-south-1 (Cape Town — nearest available AWS zone) or on-premises in your own data centre in Nairobi. Data does not leave Kenyan jurisdiction unless you explicitly enable cross-border PAPSS sharing." |
| "What does it cost?" | "Pricing is transaction-based — you pay per inquiry, not a flat monthly fee. Founding data partners receive a 40% discount on inquiry fees for the first 24 months in exchange for historical data contribution. We can model the ROI against your current CRB inquiry costs." |
| "What if a borrower disputes our data?" | "The dispute workflow is built in. A borrower raises a dispute via the consumer portal in English or Swahili; your compliance team receives a task with a 30-day SLA countdown; resolution is logged and the credit report updated automatically." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Check that the Africa map loads and Kenya is highlighted
- [ ] Run a sample mobile-money-linked borrower search — confirm a credit report generates with AI insights
- [ ] Confirm the alternative data section shows M-Pesa and SACCO signals
- [ ] Test the Collateral Registry lien search with a sample logbook or serial number
- [ ] Download a sample PDF credit report — confirm branding and AI narrative appear in English and Swahili
- [ ] Open the Consumer Portal in an incognito window on a mobile device — confirm mobile layout and Credit Freeze toggle work
- [ ] Have the CBK regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a Safaricom hotspot as backup internet.
- [ ] Bring printed one-page tear-sheet for each attendee (UCH overview + contact details in English and Swahili)
- [ ] Confirm who from the prospect side will attend — note if CBK or ODPC representatives will be present
- [ ] Prepare the M-Pesa alternative data talking point — it generates the strongest engagement in Kenyan rooms
- [ ] Set your alarm. Presentation is at 10:00 AM EAT. Arrive 20 minutes early to set up the screen share.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved.*
