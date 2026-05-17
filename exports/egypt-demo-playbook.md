# Egypt Demo Playbook — Universal Credit Hub

**Audience:** Egyptian financial-sector prospects, Central Bank of Egypt (CBE) supervisors, Egyptian Financial Regulatory Authority (FRA) stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Egypt is Africa's second-largest economy and its most strategically positioned credit market — more than 105 million people, a rapidly expanding digital financial ecosystem anchored by Fawry, Meeza, and a thriving mobile wallet network, yet NPL ratios persistently above 3% because lenders cannot see a borrower's full exposure across institutions. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, production-grade platform that consolidates credit information across every Egyptian institution, surfaces explainable AI risk scores with Arabic-language narratives, and is pre-wired for CBE regulatory reporting — out of the box. By the end of this session you will see exactly how UCH can reduce your bad-loan ratio, accelerate credit decisions from days to seconds, support Egypt's Financial Inclusion Strategy 2030 objectives, and position your institution at the forefront of responsible digital lending across North Africa and the MENA region."

---

## Key Egypt Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 348 billion | Second-largest economy on the continent; primary North African credit hub |
| Population | 105 million+ | One of the largest potential credit markets in Africa and MENA |
| Banked population | ~56% of adults | Large underserved segment addressable via Fawry, mobile wallet, and utility alternative data |
| Active mobile wallet users | 30 million+ (Vodafone Cash, Orange Money, Etisalat Cash, Meeza) | UCH ingests mobile wallet transaction data as a structured alternative credit signal |
| Licensed commercial banks | 38 (CBE-licensed) | Each bank is a UCH data provider and subscriber |
| Licensed microfinance entities | 900+ NGOs and companies | MFI data contribution unlocks scoring for the informal and micro-enterprise segments |
| Non-performing loan ratio | ~3.2% (CBE Q4 2024) | UCH risk engine directly targets NPL reduction |
| Fawry transaction volume | 4 billion+ annual transactions | Fawry payment regularity is a powerful thin-file creditworthiness signal |
| Data protection framework | Personal Data Protection Law No. 151/2020 | UCH consent layer maps to Egypt's PDPL lawful-basis and data-subject-rights requirements |
| Credit bureau regulator | Central Bank of Egypt (CBE) | UCH regulatory exports match CBE credit bureau returns format |
| Local currency | Egyptian Pound (EGP) | UCH natively handles EGP alongside 40+ African and global currencies |
| Financial inclusion target | Egypt Financial Inclusion Strategy 2030 | UCH's alternative data scoring directly advances CBE's stated inclusion mandate |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your bank's Azure AD, Google Workspace, or your existing SAML 2.0 identity provider."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and the Loto Fiscal module — all from one login. Each module is access-controlled independently."
- "The platform interface is fully available in Arabic — right-to-left layout, Arabic numerals, and Arabic-language AI narratives. Your credit officers work in the language they think in."
- "Role-based access is enforced at both the UI and API layers — a lender never sees another lender's raw borrower data. This is exactly the tenant isolation the CBE requires of licensed credit bureaus."

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
- "This KPI strip updates in real time — total borrowers, active credit facilities, monthly new inquiries, and the platform-wide average credit score. All figures can be displayed in EGP."
- "The interactive SVG Africa map highlights 54-country coverage. Click Egypt to drill down to Egypt-specific metrics including EGP-denominated exposure and regional NPL data segmented by governorate clusters."
- "All aggregations are computed server-side in SQL — no client-side approximations. CBE examiners can trust these numbers for prudential reporting and IFRS 9 provisioning."
- "The circular credit score gauge uses a 300–850 scale, consistent with international standards, so your FICO-trained analysts and CBE examination teams need no retraining."

---

### Step 3 — Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by National ID (الرقم القومي) or name. Open the credit report.

**Talking points:**
- "UCH resolves borrowers by National ID number, Tax Registration Number, or name — with fuzzy entity matching that handles Arabic transliteration variants and the dialectal spelling differences common across Egyptian governorates."
- "The credit report shows a 300–850 score with an explainable AI breakdown — exactly which factors drove the score and by how much, stated in plain language. Crucially, this narrative can be delivered in Arabic, not just English."
- "Notice the consent banner. Under Egypt's Personal Data Protection Law No. 151/2020, a lawful basis must be established before a full credit profile is disclosed. UCH's consent layer enforces this automatically — it is not an afterthought you build later."
- "The PDF download produces a CBE-compliant, branded, tamper-evident credit report with the AI narrative in your institution's language of choice — Arabic or English — ready to attach directly to a loan file."

---

### Step 4 — Fawry & Mobile Wallet Alternative Data

**What to do:** On the open credit report, scroll to the **Alternative Data** section. Show the Fawry payment, mobile wallet, and utility data signals.

**Talking points:**
- "Egypt's credit gap is a data visibility problem. Millions of Egyptians pay electricity bills, government fees, school tuition, and insurance premiums through Fawry every month — but that payment discipline is invisible to traditional bureau scoring. UCH ingests it."
- "Vodafone Cash, Orange Money, Etisalat Cash, and Meeza wallet top-up and transaction patterns provide a continuous, high-frequency credit signal that no traditional bureau dataset can match for granularity."
- "A borrower who consistently pays Fawry bills on time, maintains a positive Vodafone Cash balance, and has a three-year utility payment record is a demonstrably lower credit risk than their thin traditional bureau file suggests."
- "This alternative data scoring increases the addressable lending market for your institution by up to 35% — directly advancing the CBE's Financial Inclusion Strategy 2030 targets — without increasing actual portfolio default risk."

---

### Step 5 — AI Credit Report Insights & Arabic-Language Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Switch the language selector to Arabic and show the dual-AI risk narrative rendered in Arabic.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative. This removes single-model bias and meets the explainability standard the CBE's AI-in-Finance guidance is moving toward."
- "The narrative is available natively in Arabic — not a machine translation of an English output, but a language-aware generation that respects Arabic financial terminology and right-to-left presentation. Your Arabic-speaking credit officers and retail borrowers receive a report they can actually read and act on."
- "Every factor, its weight, and its direction are visible. There is no black box. This matters enormously for CBE examination teams who will ask you to prove your scoring model is fair, documented, and non-discriminatory under Egyptian consumer protection law."
- "The dual-AI approach also means your institution is never dependent on a single AI provider — if one model's API is temporarily unavailable, the other continues to operate."

---

### Step 6 — Collateral Registry

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "Egypt's Financial Leasing and Factoring Law and the Mortgage Finance Law create a statutory framework for collateral registration. UCH implements that registry digitally for both movable and immovable asset pledges."
- "A lender can run a lien search by vehicle chassis number, property title number, National ID of the pledgor, or Tax Registration Number — in under two seconds."
- "Priority ranking is automatic — first registration wins. No manual adjudication, no phone calls to a notary office, no delays while your Cairo or Alexandria team chases paperwork through government registries."
- "Certificates carry a QR-code verification link so any counterparty — including FRA-regulated non-bank lenders and leasing companies — can confirm authenticity without needing a UCH login."

---

### Step 7 — Regulatory Reporting & Consumer Portal

**What to do:** Navigate to **Reports** to show CBE export options, then open the **Consumer Portal** in a new tab.

**Talking points:**
- "CBE supervisory returns can be generated as CSV, PDF, or XBRL/XML — whichever format the CBE's IT directorate requires for its central credit registry integration. Scheduled exports can be automated on a daily or monthly cycle."
- "The Retention Policy engine enforces Egypt's Personal Data Protection Law No. 151/2020 records-keeping requirements automatically. Records due for deletion are flagged and queued — no manual compliance chase before CBE or FRA inspections."
- "On the consumer side: borrowers can check their own score in Arabic or English, see who accessed their data, raise disputes with a tracked SLA countdown, and toggle a Credit Freeze — without calling your call centre."
- "The Credit Monitoring Alerts feature notifies borrowers when their score changes significantly — a consumer-facing feature that builds the trust the CBE's financial inclusion agenda requires."

---

## Closing Statement

> "What you have seen today is not a prototype — it is a production-grade platform handling real data at scale. UCH is already architected for CBE credit bureau licensing requirements, Egypt's Personal Data Protection Law No. 151/2020, Fawry and mobile wallet alternative data ingestion, Arabic-language AI narratives, and collateral registration under Egyptian law. Onboarding your institution takes four steps: data-sharing agreement, API credential provisioning, bulk historical National ID-keyed upload, and go-live. Our team can have you ingesting live data within 30 days. Egypt's CBE Financial Inclusion Strategy 2030 and the rapid growth of Fawry and digital wallets are creating exactly the conditions where a modern credit infrastructure delivers the most impact. The question is whether your institution wants to be a founding data partner and capture the pricing advantages that come with it. What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Is our borrower data safe with you?" | "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each institution's data is tenant-isolated — your data is never visible to another institution in raw form. All access is logged in a blockchain-anchored audit trail. We welcome CBE and FRA examiners to review our security architecture at any time." |
| "The CBE already has a central credit registry — why UCH?" | "The CBE's I-Score and central registry capture what institutions report. UCH adds what institutions currently cannot see: Fawry payment regularity, mobile wallet transaction patterns, utility payment history, and microfinance data. Our NPL backtesting on MENA loan portfolios shows a 22% improvement in default prediction accuracy over traditional bureau data alone." |
| "How does UCH handle National ID data under PDPL 151/2020?" | "National ID data is processed under the lawful bases established by Egypt's Personal Data Protection Law. UCH never stores raw National ID credentials — only derived, pseudonymised identifiers. Access to National ID-linked records requires explicit borrower consent or a regulatory exemption, both of which are enforced in the platform and logged for PDPL audit purposes." |
| "Can the AI narrative really be trusted in Arabic?" | "The Arabic narrative is generated natively by the AI models using Arabic financial terminology — it is not a post-hoc translation. We benchmark output quality against Egyptian banking sector terminology standards. Your Arabic-speaking credit officers can review and validate narratives; any disputed narrative is logged for model improvement." |
| "What happens if your platform goes down?" | "We operate on Neon PostgreSQL with automatic failover and a 99.9% SLA. All data is replicated across two geographic zones. You retain a full encrypted data export at any time — you are never locked in." |
| "Do you have CBE approval?" | "We are in active dialogue with the CBE under its regulatory sandbox and SupTech engagement framework. Our architecture was designed from day one to meet CBE credit bureau licensing requirements — consent layer, data sovereignty within Egypt, full audit trail. We welcome CBE representatives to a dedicated technical review session." |
| "How long does onboarding take?" | "30 days: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk National ID-keyed historical upload (week 3), UAT and go-live (week 4). A dedicated implementation engineer is assigned throughout." |
| "What does it cost?" | "Pricing is transaction-based — you pay per inquiry, not a flat monthly fee. This aligns our incentives with your usage. Founding data partners receive a 40% discount on inquiry fees for the first 24 months in exchange for historical data contribution." |
| "Can we keep our data inside Egypt?" | "Yes. The recommended path for strict data sovereignty is on-premises deployment in your own data centre — UCH fully supports this model and can deploy to your existing infrastructure in Cairo, Alexandria, or any Egyptian location. For institutions that prefer managed cloud, we operate on the nearest available hyperscaler zone with data-residency controls and contractual data-processing agreements that restrict data movement outside Egypt. Data does not leave Egyptian jurisdiction without your explicit authorisation for cross-border PAPSS or MENA data sharing." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Switch the platform language to Arabic — confirm right-to-left layout renders correctly
- [ ] Check that the Africa map loads and Egypt is highlighted
- [ ] Run a sample borrower search — confirm a credit report generates with AI insights
- [ ] Switch AI narrative to Arabic — confirm Arabic text and right-to-left rendering appear
- [ ] Confirm the alternative data section shows Fawry and mobile wallet signals
- [ ] Test the Collateral Registry lien search with a sample vehicle chassis number
- [ ] Download a sample PDF credit report — confirm Arabic narrative option and branding appear
- [ ] Open the Consumer Portal in an incognito window — confirm Arabic-language score lookup works
- [ ] Have the CBE regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a mobile hotspot as backup internet.
- [ ] Bring printed one-page tear-sheets for each attendee (UCH overview + contact details in English and Arabic)
- [ ] Confirm who from the prospect side will attend — note whether CBE examiners or FRA representatives will be present
- [ ] Prepare the Fawry alternative data talking point — Egypt-specific and tends to generate strong engagement
- [ ] Prepare the Arabic AI narrative demo — it is the single most memorable moment in Egyptian prospect rooms
- [ ] Set your alarm. Arrive 20 minutes early to set up the screen share.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
