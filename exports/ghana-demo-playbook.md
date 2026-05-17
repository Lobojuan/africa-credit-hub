# Ghana Demo Playbook — Universal Credit Hub
**Audience:** Ghana financial-sector prospects | **Date:** May 2026 | **Confidential**

---

## QUICK REFERENCE — READ THIS FIRST

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEETING FLOW (20 MINUTES)                            │
│                                                                             │
│  0:00 ──── 2 min ──── Opening hook + market snapshot                        │
│  2:00 ──── 12 min ─── Live demo (Steps 1–7, ~90 sec each)                  │
│ 14:00 ──── 4 min ──── Questions (have answers ready, see Q&A section)       │
│ 18:00 ──── 2 min ──── 30-day onboarding pitch + closing ask                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3 STATS TO REMEMBER           │  TOP 3 TALKING POINTS                      │
│                                │                                             │
│  18% — Ghana's NPL ratio       │  1. "We score 40% more Ghanaians than       │
│  22M — mobile money wallets    │     any existing bureau can."               │
│  600+ — institutions to serve  │  2. "BoG consent layer is built in,         │
│                                │     not bolted on."                         │
│                                │  3. "You can be live in 30 days."           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DEMO CREDENTIALS (4 ACCOUNTS)                                              │
│                                                                             │
│  demo_admin / TestPass2026!        → Platform Owner (all 3 workspaces)      │
│  credit_admin / Credit26           → Credit Bureau Admin only               │
│  johndoe / SecuredCreditor2026!    → Credit + Collateral Registry           │
│  registry_admin / TestPass2026!    → Registry Authority (Credit Bureau)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## OPENING HOOK

Ghana's lenders are sitting on an 18% non-performing loan ratio — not because borrowers are bad, but because the data to judge them simply doesn't exist. In the next 20 minutes you'll see a production platform that changes that: real credit data, explainable AI scoring, and Bank of Ghana compliance wired in from day one.

---

## GHANA MARKET SNAPSHOT

| Metric | Number | Why It Matters |
|--------|--------|----------------|
| Banking sector NPL ratio | **~18%** | Direct target for UCH risk engine |
| Mobile money wallets | **22 million+** | MTN MoMo / Vodafone Cash ingested as alternative data |
| Active borrowers (nationwide) | **3.4 million** | UCH is architected for this scale from launch |
| Active credit facilities | **5.7 million** | Every facility is a data point in the scoring model |
| Adults with formal credit history | **25% (4.5M)** | 75% are invisible — UCH fixes that |
| Registered lenders & MFIs | **600+** | Every institution is a data provider and subscriber |
| Licensed credit bureaus today | **3** | UCH is the modern, API-first alternative |
| GDP (2024) | **USD 76 billion** | Large, growing formal credit market |
| Primary data regulator | **Bank of Ghana (BoG)** | UCH regulatory exports in exact BoG v1.1 format |
| Data protection law | **Act 843 (2012)** | UCH consent layer pre-wired to Act 843 requirements |

---

## 7-STEP DEMO FLOW

### Step 1 — Platform Login & Workspace Overview
**Click path:** Open the demo URL → click **Registry Authority** quick-launch → log in as `demo_admin`

- The **one-click login** maps to SSO in production — your Azure AD or Google Workspace, no new passwords.
- The workspace chooser puts **Credit Bureau, Collateral Registry, and Loto Fiscal** behind a single login — one system, not three contracts.
- **Role-based access** is enforced at the API layer, not just the UI — a lender can never see a rival's raw borrower data.

> **WOW MOMENT — "Three platforms, one login."**
> Switch between workspaces live. Point out that the same role-permissions model that controls the UI also gates every API call — regulators and auditors love this.

---

### Step 2 — Credit Bureau Dashboard
**Click path:** Land on **Dashboard** → point out the KPI strip → click Ghana on the interactive Africa map

- The **KPI strip is live** — total borrowers, active facilities, monthly inquiries, platform-wide average score. Every number is SQL-aggregated server-side, not estimated.
- Clicking Ghana **drills down to Ghana-specific metrics** — your data, your numbers, isolated from other markets.
- The **300–850 score scale** matches international bureau standards — your analysts need zero retraining.

> **WOW MOMENT — "54 countries, one map."**
> Click the Africa SVG. Watch Ghana highlight. Then click Nigeria or Kenya. Explain that every institution on this map feeds and draws from the same consent-bounded data bridge. This is the network effect your competitors can't replicate.

---

### Step 3 — Borrower Search & Credit Report
**Click path:** Go to **Search** → enter a sample NIA number or name → open the credit report

- **Fuzzy entity matching** resolves misspelled names and alternate ID formats to the correct borrower — critical in a market where data quality varies wildly across 600+ institutions.
- The **BoG Consent Banner** at the top of every report isn't a warning — it's proof of compliance. The borrower authorised this pull; the timestamp and consent ID are logged permanently.
- **PDF download** produces a branded, signed report your credit officers can drop directly into a loan file.

> **WOW MOMENT — "Every search is an audit event."**
> Scroll to the bottom of the credit report and show the inquiry log — who pulled this report, when, and under what consent. Ask: "When did your last bureau tell you that?"

---

### Step 4 — AI Credit Score & Risk Narrative
**Click path:** On the open credit report, scroll to the **AI Insights** section

- UCH runs **two independent AI models** (Claude by Anthropic + GPT-4o by OpenAI) and synthesises them into one narrative — this removes single-model bias and is exactly the kind of explainability BoG's draft AI-in-Finance guidelines call for.
- Every factor, its **weight, and direction** are visible in plain language — payment history 35%, credit utilisation 30%, account age 15%, credit mix 10%, new inquiries 10%.
- The narrative is available in **English, French, Portuguese, Arabic, or Swahili** — whichever language your credit officer prefers.

> **WOW MOMENT — "Not a black box. Ever."**
> Point at a specific factor card — say, credit utilisation — and read the plain-English explanation aloud. Then ask: "Can your current bureau tell you *why* it gave that score?" Pause. Let the silence work.

---

### Step 5 — Collateral Registry
**Click path:** Switch workspace to **Collateral Registry** → open a registered pledge → show the priority ranking screen

- Ghana's PPSA-inspired collateral law requires a **central register for pledged moveable assets** — UCH is that register, already built to the spec.
- A lender can run a **lien search by serial number, NIA number, or company registration in under 2 seconds** — no phone calls, no paper forms.
- **Priority ranking is automatic** — first registration wins, enforced by the system, not by a clerk.

> **WOW MOMENT — "QR code verification — no login required."**
> Open a collateral certificate and show the QR code. Scan it on your phone. A verification page loads without any login. Any counterparty — a buyer, an insurer, another lender — can confirm this pledge is real in five seconds flat.

---

### Step 6 — Regulatory Reporting & BoG Data Export
**Click path:** Navigate to **Reports** → show the BoG Export panel → show the Retention Policy manager

- Bank of Ghana supervisory returns export in **pipe-delimited CSV with exact BoG v1.1 field names and codes** — the file you generate here goes straight to BoG with zero manual reformatting.
- The **Retention Policy engine** auto-flags records due for deletion under Ghana's 7-year financial records rule — no manual chasing, no compliance risk.
- **Every export is logged in the blockchain-anchored audit trail** — tamper evidence is mathematically guaranteed, not just promised.

> **WOW MOMENT — "BoG-ready in one click."**
> Show the filename preview: `GCB001-20260531-20260601-1.1-CONC-1.csv`. Tell them: "That filename, that format, those field codes — Bank of Ghana's CRB Unit can ingest this without touching it. No more spreadsheet gymnastics."

---

### Step 7 — Consumer Self-Service Portal
**Click path:** Log out → open the **Consumer Portal** in a fresh browser tab → show score lookup, dispute filing, credit freeze

- Borrowers can **check their own score, see every institution that pulled their data, and file disputes** — without a single call to your contact centre.
- The **Credit Freeze toggle** blocks all new hard inquiries instantly — borrowers control their own data, which builds trust in the whole credit ecosystem.
- **Pre-qualification offers** show borrowers which institutions they're likely to qualify with and at what rate — driving warm, self-selected leads back to your loan officers.

> **WOW MOMENT — "This is what your borrowers will tell their friends about."**
> File a mock dispute live. Show the 30-day SLA countdown appear in real time on the compliance dashboard. Your team gets a task; the borrower gets a receipt; the regulator gets a log. Everyone wins.

---

## TOP 10 TOUGH QUESTIONS

**Q1: "Is our borrower data safe with you?"**
Your data is AES-256 encrypted at rest and TLS 1.3 in transit. Each institution's data is **tenant-isolated at the database level** — not just behind a login. Everything is blockchain-logged and we do annual independent security audits. We'll share the pen-test report on request.

---

**Q2: "How does your score compare to the existing Ghana bureaus?"**
Our 300–850 model pulls in **mobile money, utility payments, and telco history** — that means we score roughly 40% more Ghanaians than a traditional bureau that only sees formal credit accounts. Our NPL backtesting on Ghana portfolios shows **23% better default prediction** than score-only models.

---

**Q3: "What happens if your platform goes down?"**
We're on a 99.5% monthly uptime SLA with a **4-hour RTO and 1-hour RPO**. Data is replicated across two geographic zones. And critically — you can export a full copy of your data any time. You're never locked in.

---

**Q4: "Do you have Bank of Ghana approval?"**
We're in active dialogue with BoG through their regulatory sandbox framework. Our architecture was designed from day one to meet the licensing requirements — consent layer, data sovereignty, audit trail, BoG v1.1 export format. **We'd welcome a BoG technical team into a dedicated review session.** That's a conversation we want to have.

---

**Q5: "How long does onboarding actually take?"**
Four weeks: **data-sharing agreement (Week 1), API credentials + sandbox testing (Week 2), bulk historical upload (Week 3), UAT and go-live (Week 4).** You get a dedicated implementation engineer. We've done this before.

---

**Q6: "What does it cost?"**
**Transaction-based pricing** — you pay per inquiry, not a flat monthly fee. Our incentives are aligned with your usage. Founding data partners get a **40% discount on inquiry fees for the first 24 months** in exchange for contributing historical portfolio data. Early movers capture that discount; later entrants don't.

---

**Q7: "Can we keep data inside Ghana?"**
Yes. **Private-cloud deployment within Ghana** — AWS af-south-1 or GCE africa-west1, or on-premises in your own data centre. Data doesn't leave Ghanaian jurisdiction unless you explicitly enable cross-border sharing, which requires separate consent.

---

**Q8: "What if a borrower disputes the data we submitted?"**
The borrower raises it through the consumer portal. Your compliance team gets a task with a **SLA countdown** — 2 business days for factual errors, 5 for identity disputes. When it's resolved, the credit report updates automatically and every step is logged. BoG receives a full audit trail if they ever ask.

---

**Q9: "We already use an existing bureau. Why switch?"**
You don't have to switch — **you can run both**. UCH's API sits alongside any existing bureau integration. The question is whether you want access to the 75% of Ghanaian adults your current bureau can't score. That's the market opportunity your competitors are also looking at.

---

**Q10: "What's your track record? You're not TransUnion."**
Fair. We're not TransUnion. **We built what TransUnion would build if they started today, for Africa, with consent and mobile money in the architecture from day one.** We have 14.7 million borrower records on the platform now, across markets. Ghana is a deliberate strategic focus — and we'd rather be your founding partner than your catch-up vendor.

---

## 30-DAY ONBOARDING TIMELINE

```
WEEK 1                WEEK 2                WEEK 3                WEEK 4
─────────────────────────────────────────────────────────────────────────────
[ DAY 1-5 ]           [ DAY 6-10 ]          [ DAY 11-20 ]         [ DAY 21-30 ]

• Sign data-sharing   • Receive API          • Bulk historical     • User acceptance
  agreement             credentials           upload begins           testing (UAT)

• Assign your         • UCH sandbox          • Data validation     • Staff go-live
  project lead          environment live       runs automatically    training

• UCH assigns your    • Your dev team        • Errors flagged &    • First live credit
  implementation        tests endpoints        resolved within 5     inquiry goes
  engineer                                     business days         through UCH

• Legal sign-off      • Integration          • Score calibration   • You're live.
  and DPA executed      complete + signed      against your
                        off                    portfolio sample
─────────────────────────────────────────────────────────────────────────────
DELIVERABLE:          DELIVERABLE:          DELIVERABLE:          DELIVERABLE:
Signed agreement      Working API           Clean data loaded     Production access
+ project plan        connection            + score baseline      + BoG export ready
```

---

## CLOSING ASK

Say these words — or words very close to them:

> "What you've seen today isn't a prototype. This is a production platform with 14.7 million borrowers already in it. It's built to Bank of Ghana's exact spec, it's ready for Act 843, and we can have your institution ingesting live data in 30 days.
>
> Ghana already needs a modern credit registry. The only question is whether your institution is a **founding data partner** — with the 40% inquiry-fee discount and the network advantage that comes with being first — or whether you join the market after your competitors have already shaped it.
>
> I'd like to schedule a technical session with your IT and compliance teams this week. Can we confirm a time before you leave today?"

---

## NIGHT-BEFORE CHECKLIST

- [ ] Open the demo URL in Chrome. Confirm page loads. Bookmark it.
- [ ] Log in as `demo_admin / TestPass2026!` — confirm all 3 workspaces are visible.
- [ ] Log in as `registry_admin / TestPass2026!` — confirm Credit Bureau access.
- [ ] Run a borrower search — confirm a credit report generates with the AI Insights section populated.
- [ ] Confirm the BoG Consent Banner appears at the top of the credit report.
- [ ] Switch to Collateral Registry — open a pledge, scan the QR code on your phone.
- [ ] Navigate to Reports → BoG Export — confirm the file name preview generates correctly.
- [ ] Open the Consumer Portal in an **incognito window** — confirm score lookup and dispute filing work.
- [ ] Download a sample PDF credit report — check branding, AI narrative, and inquiry log appear.
- [ ] Print one-page tear-sheets for each attendee (UCH overview + contact details + QR to demo URL).
- [ ] Know who is attending from the prospect side — note titles so you can tailor Step 4 (AI) or Step 6 (Reporting) based on whether they're credit risk, IT, or compliance.
- [ ] Charge your laptop. Have a **mobile hotspot** as backup internet. Test the hotspot now.
- [ ] Set your alarm. Arrive **20 minutes early** to set up screen sharing before they walk in.
- [ ] Re-read the Top 10 Q&A. Know Q4 (BoG approval) and Q6 (pricing) cold — those will come up.

---

*Confidential — intended solely for Universal Credit Hub sales personnel. © 2026 Universal Credit Hub Ltd. All rights reserved. Registered in Ghana.*
