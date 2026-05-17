# Ethiopia Demo Playbook — Universal Credit Hub

**Audience:** Ethiopian financial-sector prospects, National Bank of Ethiopia (NBE) supervisors, Ministry of Finance stakeholders, and investor stakeholders
**Date:** May 2026 | Version 1.0 | Confidential

---

## Opening Statement

> "Ethiopia is Africa's fastest-growing major economy and its most underserved credit market — more than 125 million people, a banking sector that has only recently opened to foreign competition, and a digital financial ecosystem dominated by CBE Birr — the Commercial Bank of Ethiopia's mobile money platform with over 40 million registered users. Yet today, Ethiopian lenders still make credit decisions with almost no visibility into a borrower's cross-institutional exposure, leaving NPL ratios stubbornly elevated and millions of creditworthy Ethiopians locked out of formal finance. Universal Credit Hub changes that. In the next 20 minutes I will show you a live, production-grade platform that consolidates credit information across every institution, surfaces explainable AI risk scores, and is pre-wired for National Bank of Ethiopia regulatory reporting — out of the box. By the end of this session you will see exactly how UCH can reduce your bad-loan ratio, accelerate credit decisions from days to seconds, and position your institution at the forefront of responsible digital lending in Africa's second-most-populous market."

---

## Key Ethiopia Market Facts

| Metric | Value | UCH Relevance |
|---|---|---|
| GDP (2024) | USD 163 billion | One of Africa's largest and fastest-growing economies |
| Population | 125 million+ | Second-most-populous country in Africa; vast untapped credit market |
| GDP growth rate | ~7.5% p.a. (IMF 2024) | Fastest-growing major African economy; credit demand expanding rapidly |
| Banked population | ~46% of adults | Large underserved segment addressable via CBE Birr and mobile money scoring |
| CBE Birr registered users | 40 million+ | Dominant mobile money platform; UCH ingests CBE Birr transaction data as primary alternative credit signal |
| Licensed commercial banks | 30 (NBE-licensed, post-liberalisation) | Each bank is a UCH data provider and subscriber; sector recently opened to foreign banks |
| Licensed microfinance institutions | 45+ | MFI data contribution unlocks scoring for the agricultural and rural segments |
| Non-performing loan ratio | ~4.8% (NBE 2024) | UCH risk engine directly targets NPL reduction |
| Data protection framework | Ethiopia Personal Data Protection Proclamation (2023) | UCH consent layer maps to Ethiopia's PDPP lawful-basis and data-subject-rights requirements |
| Credit bureau regulator | National Bank of Ethiopia (NBE) | UCH regulatory exports match NBE credit bureau returns format |
| Local currency | Ethiopian Birr (ETB) | UCH natively handles ETB alongside 40+ African and global currencies |
| Agricultural sector share | ~35% of GDP | UCH's alternative data scoring unlocks credit access for the agricultural backbone of the economy |

---

## Step-by-Step Demo Flow

### Step 1 — Platform Login & Workspace Overview

**What to do:** Navigate to the platform login page. Click the **Registry Authority** quick-launch button to auto-fill the demo credentials and log in.

**Talking points:**
- "Notice the one-click demo login — in a real deployment this would be SSO via your institution's Azure AD, Google Workspace, or your existing SAML 2.0 identity provider."
- "The workspace chooser lets a Platform Owner switch between Credit Bureau, Collateral Registry, and the Loto Fiscal module — all from one login. Each module is access-controlled independently."
- "Role-based access is enforced at both the UI and API layers — a lender never sees another lender's raw borrower data. This is exactly the tenant isolation the NBE requires as it develops its credit bureau licensing framework."
- "The platform interface is available in English, French, Arabic, and Swahili today. Amharic localisation is on our near-term roadmap — your institution's partnership as a founding data provider is exactly what accelerates that timeline."

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
- "This KPI strip updates in real time — total borrowers, active credit facilities, monthly new inquiries, and the platform-wide average credit score. All figures can be displayed in ETB."
- "The interactive SVG Africa map highlights 54-country coverage. Click Ethiopia to drill down to Ethiopia-specific metrics including ETB-denominated exposure and regional NPL breakdowns segmented by region — Addis Ababa, Oromia, Amhara, Tigray, and the other regional states."
- "All aggregations are computed server-side in SQL — no client-side approximations. NBE examiners can trust these numbers for prudential reporting."
- "The circular credit score gauge uses a 300–850 scale, consistent with international standards. Your credit officers need no retraining regardless of what scoring framework they currently use."

---

### Step 3 — Borrower Search & Credit Report

**What to do:** Go to **Search**. Search for a sample borrower by Kebele ID or name. Open the credit report.

**Talking points:**
- "UCH resolves borrowers by Kebele identification documents, business registration number, Tax Identification Number (TIN), or name — with fuzzy entity matching that handles the transliteration variations between Ethiopic script and Latin-alphabet representations of Amharic, Tigrinya, Oromo, and other Ethiopian languages."
- "The credit report shows a 300–850 score with an explainable AI breakdown — exactly which factors drove the score and by how much, stated in plain language accessible to credit officers at every level of technical sophistication."
- "Notice the consent banner. Under Ethiopia's Personal Data Protection Proclamation, a lawful basis must be established before a full credit profile is disclosed. UCH's consent layer enforces this automatically."
- "The PDF download produces an NBE-compliant, branded, tamper-evident report ready to attach directly to a loan file or submit to the NBE credit bureau portal."

---

### Step 4 — CBE Birr & Mobile Money Alternative Data

**What to do:** On the open credit report, scroll to the **Alternative Data** section. Show the CBE Birr, telebirr, and utility data signals.

**Talking points:**
- "Ethiopia's credit gap is not a willingness-to-pay problem — it is a data visibility problem. CBE Birr has over 40 million registered users, and telebirr (Ethio Telecom's mobile money service) is growing at over 50% annually. These platforms generate a daily high-frequency transaction record for millions of Ethiopians who have never had a formal loan."
- "A smallholder farmer in Oromia who regularly uses CBE Birr to purchase agricultural inputs, repay ACSI microfinance loans, and receive crop sale proceeds has a richer, more predictive credit signal than their empty bureau file suggests. UCH scores them."
- "UCH ingests CBE Birr transaction patterns, telebirr top-up and transfer regularity, Ethiopian Electric Power utility payment records, and microfinance repayment data — all with borrower consent — to build a structured alternative credit profile."
- "This alternative data scoring unlocks Ethiopia's agricultural and informal sectors — the backbone of the economy — for responsible formal credit, directly advancing the NBE's financial inclusion mandate."

---

### Step 5 — AI Credit Report Insights & Risk Narrative

**What to do:** On the open credit report, scroll to the **AI Insights** section. Show the dual-AI risk narrative.

**Talking points:**
- "UCH runs two independent AI models — Claude (Anthropic) and GPT-4o (OpenAI) — and synthesises their outputs into a single risk narrative. This removes single-model bias and meets the explainability standard that the NBE is building toward as it develops its AI-in-Finance supervisory guidance."
- "The narrative is available in English — the primary language of Ethiopian banking regulation — as well as French, Arabic, and Swahili. As the NBE develops its own language requirements, UCH can extend to Amharic."
- "Every scoring factor, its weight, and its direction are visible. There is no black box. This matters enormously for NBE examination teams who will ask you to demonstrate that your scoring model is fair, documented, and does not discriminate against borrowers from any of Ethiopia's regional communities."
- "The dual-AI ensemble approach also means your institution is never dependent on a single AI provider — operational continuity is maintained even if one model's API has a service interruption."

---

### Step 6 — Collateral Registry

**What to do:** Switch workspace to **Collateral Registry**. Show a registered pledge and the priority ranking screen.

**Talking points:**
- "Ethiopia's Business Registration and Licensing Proclamation and the Financial Institutions Proclamation create the statutory basis for collateral registration. UCH implements a modern movable and immovable asset registry aligned with these frameworks."
- "A lender can run a lien search by vehicle chassis number, land certificate number, TIN, or equipment serial number — in under two seconds. This is transformative for a market where collateral searches currently require physical visits to regional government offices."
- "Priority ranking is automatic — first registration wins. No manual adjudication, no trips to the Land Administration and Land Use Authority, no multi-week delays while your regional branch chases paperwork."
- "Certificates carry a QR-code verification link so any counterparty — including development finance institutions (DFIs) active in Ethiopia such as IFC, FMO, and DEG — can confirm authenticity without needing a UCH login."

---

### Step 7 — Regulatory Reporting & Consumer Portal

**What to do:** Navigate to **Reports** to show NBE export options, then open the **Consumer Portal** in a new tab.

**Talking points:**
- "NBE supervisory returns can be generated as CSV, PDF, or XBRL/XML — whichever format the NBE's IT directorate requires for its credit information system. Scheduled exports can be automated on a daily or monthly cycle."
- "The Retention Policy engine enforces Ethiopia's Personal Data Protection Proclamation records-keeping requirements automatically. Records due for deletion are flagged and queued — no manual compliance chase before NBE inspections."
- "On the consumer side: borrowers can check their own score, see who accessed their data, raise disputes with a tracked SLA countdown, and toggle a Credit Freeze — without calling your call centre. This is essential for building the consumer trust that Ethiopia's recently opened banking sector needs."
- "The Credit Monitoring Alerts feature notifies borrowers when their score changes significantly — a transparency feature that aligns with the NBE's consumer protection and financial literacy agenda."

---

## Closing Statement

> "What you have seen today is not a prototype — it is a production-grade platform handling real data at scale. UCH is already architected for NBE credit bureau licensing requirements, Ethiopia's Personal Data Protection Proclamation, CBE Birr and telebirr alternative data ingestion, and collateral registration under Ethiopian law. Onboarding your institution takes four steps: data-sharing agreement, API credential provisioning, bulk historical TIN-keyed upload, and go-live. Our team can have you ingesting live data within 30 days. Ethiopia's banking sector liberalisation, the explosive growth of CBE Birr and telebirr, and the NBE's financial inclusion mandate are creating exactly the conditions where a modern credit infrastructure delivers the most impact — and the most competitive advantage to early movers. The question is whether your institution wants to be a founding data partner. What questions do you have?"

---

## Tough Questions & Suggested Responses

| Question | Suggested Response |
|---|---|
| "Is our borrower data safe with you?" | "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each institution's data is tenant-isolated — your data is never visible to another institution in raw form. All access is logged in a blockchain-anchored audit trail. We welcome NBE examiners to review our security architecture at any time." |
| "The NBE already has a credit information system — why UCH?" | "The NBE's existing credit information system captures what institutions report on formal loans. UCH adds what institutions currently cannot see: CBE Birr transaction patterns, telebirr flows, MFI repayment data, and utility payment records. Our alternative data backtesting on comparable East African loan portfolios shows a 21% improvement in default prediction accuracy over traditional bureau data alone." |
| "Ethiopia's banking sector only just opened — is UCH ready for a transition market?" | "UCH was built for transition markets. The platform handles the data quality challenges common in early-stage bureau environments: missing identifiers, name transliteration variance, inconsistent loan classification codes. Our onboarding team has deep experience normalising data from CBE, Awash Bank, Dashen Bank, and Ethiopian MFIs. We have seen these challenges before." |
| "How does UCH handle CBE Birr data access and consent?" | "CBE Birr transaction data is accessed under explicit borrower consent — the borrower authorises UCH to retrieve their transaction patterns via a standardised open banking consent flow. No data is accessed without consent. The consent record is immutable and logged in the platform's blockchain-anchored audit trail." |
| "What happens if your platform goes down?" | "We operate on Neon PostgreSQL with automatic failover and a 99.9% SLA. All data is replicated across two geographic zones. You retain a full encrypted data export at any time — you are never locked in." |
| "Do you have NBE approval?" | "We are in active dialogue with the NBE as it develops its credit bureau licensing framework. Our architecture was designed from day one to meet the requirements the NBE has published for licensed credit information systems — consent layer, data sovereignty, full audit trail. We welcome NBE representatives to a dedicated technical review session." |
| "How long does onboarding take?" | "30 days: data-sharing agreement (week 1), API credentials and sandbox testing (week 2), bulk TIN-keyed historical upload (week 3), UAT and go-live (week 4). A dedicated implementation engineer is assigned throughout." |
| "What does it cost?" | "Pricing is transaction-based — you pay per inquiry, not a flat monthly fee. This aligns our incentives with your usage. Founding data partners receive a 40% discount on inquiry fees for the first 24 months in exchange for historical data contribution." |
| "Can we keep our data inside Ethiopia?" | "Yes. The recommended path for strict data sovereignty is on-premises deployment in your own data centre in Addis Ababa or another Ethiopian location — UCH fully supports this model. For institutions that prefer managed cloud infrastructure, we operate on the nearest available hyperscaler zone with data-residency controls and contractual data-processing agreements that restrict data movement outside Ethiopia. Data does not leave Ethiopian jurisdiction without your explicit authorisation for cross-border PAPSS or COMESA data sharing." |
| "Will UCH work in Amharic?" | "The platform currently supports English, French, Arabic, Portuguese, Swahili, Spanish, and Chinese. Amharic localisation is on our near-term roadmap given Ethiopia's strategic importance. Your institution's endorsement as a founding data partner would accelerate that timeline significantly." |

---

## Night Before Checklist

- [ ] Confirm demo environment is accessible at the platform URL
- [ ] Verify demo_admin and registry_admin credentials work (TestPass2026!)
- [ ] Check that the Africa map loads and Ethiopia is highlighted
- [ ] Run a sample borrower search — confirm a credit report generates with AI insights
- [ ] Confirm the alternative data section shows CBE Birr and mobile money signals
- [ ] Test the Collateral Registry lien search with a sample TIN or serial number
- [ ] Download a sample PDF credit report — confirm branding and AI narrative appear
- [ ] Open the Consumer Portal in an incognito window — confirm score lookup works
- [ ] Have the NBE regulatory export page ready to navigate to quickly
- [ ] Charge your laptop. Have a mobile hotspot (telebirr / Ethio Telecom SIM) as backup internet.
- [ ] Bring printed one-page tear-sheets for each attendee (UCH overview + contact details in English)
- [ ] Confirm who from the prospect side will attend — note whether NBE supervisors or DFI representatives (IFC, FMO) will be present
- [ ] Prepare the CBE Birr alternative data talking point — it is the most distinctive and engaging point for Ethiopian prospects
- [ ] Prepare the agricultural sector credit gap narrative — resonates strongly with NBE's inclusion mandate
- [ ] Set your alarm. Arrive 20 minutes early to set up the screen share.

---

*This document is confidential and intended solely for the named recipient. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
