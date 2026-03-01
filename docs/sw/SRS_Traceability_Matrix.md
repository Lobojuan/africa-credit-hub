# Muundo wa Ufuatiliaji wa SRS

## Mfumo wa Kituo cha Kati cha Data na Rejista ya Mikopo ya Mipaka Mbalimbali v1.2

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 1.2  
**Tarehe:** Machi 2026

---

## 1. Madhumuni

Hati hii inaorodhesha kila sharti la Maelezo ya Mahitaji ya Programu (SRS) kulingana na hali yake ya utekelezaji ndani ya Mfumo wa Rejista ya Mikopo. Inatoa ufuatiliaji kutoka mahitaji kupitia utekelezaji hadi visa vya majaribio ya UAT.

---

## 2. Ufafanuzi wa Ufuatiliaji

| Hali | Maelezo |
|--------|-------------|
| Implemented | Imetekelezwa kikamilifu na inafanya kazi |
| Partial | Imetekelezwa kwa sehemu na mapungufu yaliyoonyeshwa |
| Not Implemented | Bado haijatekelezwa |

---

## 3. Mahitaji ya Ukusanyaji Data (FR-COL)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-COL-01 | Mfumo utakusanya data ya kidemografia ya mkopaji (jina, tarehe ya kuzaliwa, jinsia, kitambulisho cha kitaifa, pasipoti, TIN, anwani, simu, barua pepe) | Implemented | Borrower Management (`borrowers` table, `borrowers.tsx`) | Sehemu zote za kidemografia zinachukuliwa katika fomu ya usajili wa mkopaji; aina za mtu binafsi na kampuni zinasaidiwa | TC-BOR-001 hadi TC-BOR-005 |
| FR-COL-02 | Mfumo utakusanya data ya akaunti za mikopo (aina ya akaunti, kiasi, tarehe, hali, dhamana, madeni yaliyochelewa) | Implemented | Credit Accounts (`credit_accounts` table, `credit-accounts.tsx`) | Uundaji kamili wa akaunti ya mikopo na sehemu zote zinazohitajika ikiwa ni pamoja na sarafu nyingi, bila riba, kipindi cha ruhusa, ufuatiliaji wa urekebishaji | TC-CA-001 hadi TC-CA-005 |
| FR-COL-03 | Mfumo utasaidia uingizaji mkubwa wa data (JSON/CSV) | Implemented | Batch Upload (`batch-upload.tsx`, `/api/batch-upload/credit-accounts`) | Kupakia faili za JSON na CSV na uthibitishaji kwa kila rekodi na taarifa za makosa | TC-BATCH-001 hadi TC-BATCH-004 |
| FR-COL-04 | Mfumo utathibitisha ubora wa data wakati wa kuingiza | Implemented | Server Routes (`routes.ts`), Zod Schemas (`schema.ts`) | Uthibitishaji wa schema ya Zod kwenye operesheni zote za kuingiza; vikwazo vya ngazi ya sehemu vinatekelezwa | TC-DQ-001, TC-DQ-002 |
| FR-COL-05 | Mfumo utakusanya taarifa za hukumu za mahakama na haki za kisheria | Implemented | Court Judgments (`court_judgments` table, `borrower-detail.tsx`) | Hukumu za mahakama na nambari ya kesi, mahakama, aina (lien/bankruptcy/lawsuit/civil/criminal), kiasi, tarehe, hali | TC-CJ-001 hadi TC-CJ-003 |
| FR-COL-06 | Utambuzi wa Huluki za Kimataifa | Nambari ya pasipoti, TIN, ulinganishaji wa majina wasio kamili kwa utambulisho wa kimataifa | shared/schema.ts, server/storage.ts | Aina 7 za uhusiano ikiwa ni pamoja na beneficial_owner | TC-BOR-013 |
| FR-COL-07 | Mfumo utasaidia kupakia picha za kitambulisho na hati za mkopaji | Implemented | Borrower Management (`photoUrl`, `idDocumentUrl` fields, multer upload endpoints, auth-protected serving) | Kupakia picha (kikomo cha 5MB, picha pekee) na kupakia hati ya kitambulisho (kikomo cha 10MB, picha/PDF) na majina ya faili yaliyobadilishwa kinasibu; faili zinapatikana kupitia njia ya `/uploads` iliyolindwa kwa uthibitishaji | TC-PHOTO-001 hadi TC-PHOTO-003 |
| FR-COL-08 | Mfumo utatoa utafutaji wa kimataifa wa huluki mbalimbali kwenye wakopaji, taasisi, na akaunti za mikopo | Implemented | Global Search (`/api/global-search`, `credit-search.tsx`) | Inatafuta wakopaji, taasisi, na akaunti za mikopo kwa wakati mmoja na chujio la hiari la nchi | TC-GS-001, TC-GS-002 |

---

## 4. Mahitaji ya Utoaji Taarifa za Mikopo (FR-CR)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-CR-01 | Mfumo utatengeneza ripoti za mikopo na muhtasari wa mkopaji | Implemented | Credit Report (`credit-report.tsx`, `/api/borrowers/:id/credit-report`) | Ripoti kamili ya mikopo na taarifa za kibinafsi, muhtasari wa akaunti, uchambuzi wa alama, historia ya malipo | TC-CR-001, TC-CR-002 |
| FR-CR-02 | Mfumo utahesabu alama za mikopo (masafa ya 300-850) | Implemented | Credit Report Generation (`routes.ts`, `external-api.ts`) | Utoaji alama kwa algorithimu kulingana na historia ya malipo, ucheleweshaji, kushindwa kulipa, kuondolewa, hoji | TC-CR-003 |
| FR-CR-03 | Mfumo utasaidia ukaguzi mkubwa wa rejea za mikopo | Implemented | Credit Search (`credit-search.tsx`, `/api/credit-search/bulk`) | Utafutaji mkubwa wa vitambulisho vingi na mkusanyiko wa matokeo | TC-CS-003 |
| FR-CR-04 | Mfumo utafuatilia hoji za mikopo na idhini | Implemented | Credit Inquiries (`credit_inquiries` table) | Uwekaji kumbukumbu za hoji na madhumuni, taasisi, bendera ya idhini | TC-CS-001, TC-CS-002 |
| FR-CR-05 | Mfumo utasaidia madhumuni mengi ya hoji | Implemented | Credit Inquiries (`inquiryPurposeEnum`) | Inasaidia: new_credit, review, collection, regulatory, portfolio_monitoring | TC-CS-001 |
| FR-CR-06 | Mfumo utatenga nambari za kipekee za mfululizo kwa ripoti za mikopo | Implemented | Credit Report Logs (`credit_report_logs` table, `/api/credit-reports/generate`) | Muundo: CR-{YEAR}-{timestamp_base36}; mfululizo wa kipekee kwa kila ripoti | TC-CR-004 |
| FR-CR-07 | Mfumo utajumuisha misimbo ya sababu katika ripoti za mikopo | Implemented | Credit Report (`credit-report.tsx`, scoring logic) | Misimbo 10 ya sababu: DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, RESTRUCTURED_ACCOUNTS, HIGH_INQUIRY_VOLUME, HIGH_DEBT_LEVEL, COURT_JUDGMENTS_PRESENT, POLITICALLY_EXPOSED_PERSON, STRONG_REPAYMENT_HISTORY, EXCELLENT_PAYMENT_RECORD, THIN_FILE_LIMITED_HISTORY | TC-CR-005 |
| FR-CR-08 | Mfumo utahifadhi historia ya utendaji wa malipo ya vipindi 12 | Implemented | Payment History (`payment_history` table, borrower detail) | Gridi ya malipo ya vipindi 12 na ufuatiliaji wa hali (on_time, late, missed, partial) | TC-CR-006 |

---

## 5. Mahitaji ya Idhini na Migogoro (FR-CON)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-CON-01 | Mfumo utasimamia idhini ya mmiliki wa data | Implemented | Consent Management (`consent_records` table, `consent-management.tsx`) | Kutoa/kubatilisha idhini na aina, madhumuni, sehemu za aliyepewa | TC-CON-001 |
| FR-CON-02 | Mfumo utatoa kituo cha Huduma za Hoji (helpdesk) | Implemented | Helpdesk (`helpdesk.tsx`) | Kituo cha watumiaji kwa ajili ya kufungua migogoro, usimamizi wa idhini, kutafuta mkopaji | TC-HD-001 hadi TC-HD-004 |
| FR-CON-03 | Mfumo utafuatilia hali ya idhini (hai/imebatilishwa) | Implemented | Consent Records (`consentStatusEnum`) | Hali ya hai/imebatilishwa na muda wa kubatilishwa | TC-CON-002 |
| FR-CON-04 | Mfumo utasaidia kufungua na kufuatilia migogoro | Implemented | Disputes (`disputes` table, `disputes.tsx`) | Mzunguko kamili wa migogoro: open, under_review, resolved, rejected | TC-DIS-001, TC-DIS-002 |
| FR-CON-05 | Mfumo utaainisha migogoro kwa aina ya marekebisho | Implemented | Disputes (`correctionType` field) | Aina za marekebisho ya kifedha na yasiyo ya kifedha na ratiba tofauti za SLA | TC-DIS-003 |
| FR-CON-06 | Mfumo utatengeneza nambari za stakabadhi za idhini | Implemented | Consent Records (`receiptNumber` field) | Muundo: CR-{timestamp}-{random}; stakabadhi ya kipekee kwa kila idhini iliyotolewa | TC-CON-003 |
| FR-CON-07 | Mfumo utasaidia kubatilisha idhini | Implemented | Consent Management (`/api/consent-records/:id/revoke`) | Kubatilisha na kurekodi muda | TC-CON-004 |
| FR-CON-08 | Mfumo utaruhusu helpdesk kufungua migogoro kwa niaba ya watumiaji | Implemented | Helpdesk (`helpdesk.tsx`) | Kufungua migogoro kutoka kwa kiolesura cha helpdesk na muktadha wa mkopaji | TC-HD-003 |
| FR-CON-09 | Mfumo utaruhusu helpdesk kutoa idhini kwa niaba ya watumiaji | Implemented | Helpdesk (`helpdesk.tsx`) | Kutoa idhini kutoka kwa kiolesura cha helpdesk na muktadha wa mkopaji | TC-HD-004 |

---

## 6. Mahitaji ya Udhibiti (FR-REG)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-REG-01 | Mfumo utatoa uchambuzi wa udhibiti (uwiano wa NPL, mgawanyo wa kwingineko) | Implemented | Reports (`reports.tsx`, `/api/reports/regulatory`) | Uwiano wa NPL, mgawanyo wa kwingineko kwa taasisi na aina ya mkopo, ufuatiliaji wa ukiukaji wa SLA | TC-RPT-001, TC-RPT-002 |
| FR-REG-02 | Mfumo utasaidia jukumu la mtumiaji wa udhibiti na ufikiaji unaofaa | Implemented | RBAC (`userRoleEnum`, route middleware) | Jukumu la mdhibiti na ufikiaji wa kumbukumbu za ukaguzi, malipo, idhini, uchambuzi | TC-AUTH-005 |
| FR-REG-03 | Mfumo utatekeleza mtiririko wa maker-checker kwa mabadiliko ya data | Implemented | Pending Approvals (`pending_approvals` table, `pending-approvals.tsx`) | Kanuni ya macho-manne: mtumiaji tofauti lazima aidhinishe; kuzuia kujidhinisha kunatekelezwa upande wa seva | TC-MC-001 hadi TC-MC-004 |

---

## 7. Mahitaji ya Mikopo Maalum (FR-SPEC)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-SPEC-01 | Mfumo utasaidia bidhaa za mikopo isiyo na riba | Implemented | Credit Accounts (`isInterestFree` field) | Bendera ya boolean kwenye akaunti za mikopo; kiwango cha riba kinafichwa wakati hakuna riba | TC-CA-003 |
| FR-SPEC-02 | Mfumo utasaidia ufuatiliaji wa kipindi cha ruhusa | Implemented | Credit Accounts (`gracePeriodMonths` field) | Sehemu ya nambari kamili kwa kipindi cha ruhusa kwa miezi | TC-CA-003 |
| FR-SPEC-03 | Mfumo utafuatilia idadi ya urekebishaji wa mkopo | Implemented | Credit Accounts (`restructureCount` field) | Kihesabu nambari kamili kwa idadi ya urekebishaji | TC-CA-004 |
| FR-SPEC-04 | Mfumo utafuatilia tarehe ya kuondolewa | Implemented | Credit Accounts (`writtenOffDate` field) | Sehemu ya tarehe inajazwa wakati hali ya akaunti ni written_off | TC-CA-004 |
| FR-SPEC-05 | Mfumo utafuatilia tarehe ya kurejesha | Implemented | Credit Accounts (`reinstatedDate` field) | Sehemu ya tarehe kwa akaunti zilizorejeswa baada ya kuondolewa | TC-CA-004 |

---

## 8. Mahitaji ya Kibiashara (FR-COMM)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-COMM-01 | Mfumo utasaidia usimamizi wa ankara na ada | Implemented | Billing (`billing_records` table, `billing.tsx`) | Uundaji wa ankara na aina ya huduma, kiasi, sarafu, kipindi | TC-BIL-001, TC-BIL-002 |
| FR-COMM-02 | Mfumo utafuatilia hali ya malipo ya ankara | Implemented | Billing Records (`billingStatusEnum`) | Ufuatiliaji wa hali: pending, paid, overdue | TC-BIL-003 |
| FR-COMM-03 | Mfumo utasaidia aina nyingi za huduma | Implemented | Billing Records (`serviceType` field) | Aina za huduma: data_submission, credit_report, api_access, subscription | TC-BIL-001 |
| FR-COMM-04 | Mfumo utasaidia ankara za sarafu nyingi | Implemented | Billing Records (`currency` field) | Sarafu 42+ za Kiafrika pamoja na USD, EUR, GBP kwenye mamlaka 54 | TC-BIL-001 |
| FR-COMM-05 | Mfumo utatengeneza nambari za kipekee za ankara | Implemented | Billing (`invoiceNumber` field) | Nambari za kipekee za ankara kwa kila rekodi ya ankara | TC-BIL-002 |

---

## 9. Mahitaji ya Mtoa Data (FR-DP)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| FR-DP-01 | Mfumo utasaidia usajili wa taasisi na mtiririko wa idhini | Implemented | Institutions (`institutions` table, `institutions.tsx`) | Usajili binafsi na idhini ya msimamizi; aina: bank, mfi, utility, telecom, digital_lender, sacco | TC-INST-001, TC-INST-002 |
| FR-DP-02 | Mfumo utasanidi marudio ya uwasilishaji wa taasisi | Implemented | Institutions (`submissionFrequency` field) | Inaweza kusanidiwa: monthly (chaguomsingi) | TC-INST-003 |
| FR-DP-03 | Mfumo utafuatilia hali ya taasisi | Implemented | Institutions (`institutionStatusEnum`) | Hali: pending, active, suspended | TC-INST-002 |
| FR-DP-04 | Mfumo utahitaji idhini ya msimamizi kwa kuwezesha taasisi | Implemented | Institutions (`/api/institutions/:id/approve`) | Mwisho wa idhini ya msimamizi pekee na ufuatiliaji wa muidhinishaji na muda | TC-INST-002 |

---

## 10. Mahitaji ya Ushirikiano na Utoaji Taarifa (INT-RPT)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| INT-RPT-01 | Mfumo utasaidia uhamishaji wa data ya CSV | Implemented | Reports (`/api/reports/export?format=csv`) | Uhamishaji wa data ya kwingineko na mkopaji kwa CSV | TC-RPT-003 |
| INT-RPT-02 | Mfumo utatoa API ya nje ya REST kwa uwasilishaji wa data | Implemented | External API (`external-api.ts`) | API kamili ya REST na uthibitishaji wa X-API-Key; wakopaji, akaunti za mikopo, historia ya malipo, hukumu za mahakama | TC-API-001 hadi TC-API-005 |
| INT-RPT-03 | Mfumo utasaidia uwasilishaji mkubwa wa API | Implemented | External API (`external-api.ts`) | Uwasilishaji mkubwa unaotegemea orodha kwa wakopaji, akaunti za mikopo, historia ya malipo | TC-API-004 |
| INT-RPT-04 | Mfumo utatoa utoaji taarifa za uchambuzi wa udhibiti | Implemented | Reports (`/api/reports/regulatory`, `reports.tsx`) | Uwiano wa NPL, uchambuzi wa kwingineko, ufuatiliaji wa ukiukaji wa SLA | TC-RPT-002 |

---

## 11. Mahitaji ya Ubora wa Data (DQ)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| DQ-01 | Mfumo utathibitisha data wakati wa kuingiza | Implemented | Zod Schemas (`schema.ts`), Routes (`routes.ts`) | Uthibitishaji kulingana na schema kwenye miisho yote ya API kwa kutumia drizzle-zod | TC-DQ-001 |
| DQ-02 | Mfumo utatekeleza vitambulisho vya kipekee (kitambulisho cha kitaifa, TIN) | Implemented | Database Constraints (`borrowers.nationalId` unique) | Kikwazo cha kipekee kwenye nationalId; utekelezaji wa kiwango cha hifadhidata | TC-DQ-002 |
| DQ-03 | Mfumo utatoa utoaji taarifa za makosa ya ubora wa data | Implemented | Batch Upload (`batch-upload.tsx`) | Makosa ya uthibitishaji kwa kila rekodi na maelezo ya kiwango cha sehemu | TC-BATCH-003 |
| DQ-04 | Mfumo utatekeleza SLA ya siku 2 za kazi kwa migogoro ya kifedha | Implemented | Disputes (`createDispute` in `storage.ts`) | Uhesabuji wa moja kwa moja wa tarehe ya mwisho ya SLA: siku 2 kwa aina ya marekebisho ya kifedha | TC-DIS-003 |
| DQ-05 | Mfumo utatekeleza SLA ya siku 5 za kazi kwa migogoro isiyo ya kifedha | Implemented | Disputes (`createDispute` in `storage.ts`) | Uhesabuji wa moja kwa moja wa tarehe ya mwisho ya SLA: siku 5 kwa aina ya marekebisho yasiyo ya kifedha | TC-DIS-003 |

---

## 12. Mahitaji ya Usalama Yasiyo ya Kitendaji (NFR-SEC)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| NFR-SEC-01 | Mfumo utatekeleza udhibiti wa ufikiaji kulingana na majukumu (majukumu 4) | Implemented | RBAC (`userRoleEnum`, `requireRole` middleware) | Majukumu 4: admin, regulator, lender, viewer; utekelezaji wa upande wa seva kwenye njia zote zilizolindwa | TC-AUTH-005, TC-AUTH-006 |
| NFR-SEC-02 | Mfumo utafanya hash ya nywila kwa kutumia bcrypt | Implemented | Authentication (`bcryptjs` in `routes.ts`) | bcrypt na raundi 10 za chumvi; hashing ya nywila wakati wa kuunda na kubadilisha | TC-AUTH-001 |
| NFR-SEC-03 | Mfumo utatekeleza utata wa nywila (herufi 8+, herufi kubwa, herufi ndogo, nambari, herufi maalum) | Implemented | Password Change (`/api/auth/change-password`) | Uthibitishaji wa regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` | TC-AUTH-007 |
| NFR-SEC-04 | Mfumo utafunga akaunti baada ya majaribio 3 ya kuingia yaliyoshindwa | Implemented | Login (`/api/auth/login`) | Kiwango cha majaribio 3; kipindi cha kufungwa kwa dakika 15; kihesabu kinarejeshwa kwa kuingia kwa mafanikio | TC-AUTH-002, TC-AUTH-003 |
| NFR-SEC-05 | Mfumo utahifadhi kumbukumbu za ukaguzi za kina | Implemented | Audit Logging (`audit_logs` table, `audit-trail.tsx`) | Operesheni zote za CRUD zinarekodi na userId, action, entity, details, anwani ya IP, muda | TC-AUDIT-001, TC-AUDIT-002 |
| NFR-SEC-06 | Mfumo utafuatilia anwani za IP katika kumbukumbu za ukaguzi | Implemented | Audit Logging (`ipAddress` field) | IP inachukuliwa kutoka `req.ip` kwenye operesheni zote zinazokaguliwa | TC-AUDIT-003 |
| NFR-SEC-07 | Mfumo utatekeleza maker-checker (kanuni ya macho-manne) | Implemented | Pending Approvals (`routes.ts` self-approval check) | Utekelezaji wa upande wa seva: `requestedBy !== reviewedBy`; kosa la 403 kwa jaribio la kujidhinisha | TC-MC-004 |
| NFR-SEC-08 | Mfumo utatekeleza kumalizika kwa nywila kwa siku 90 | Implemented | Login/Auth (`passwordChangedAt`, `mustChangePassword`) | Ukaguzi wa umri wa nywila wakati wa kuingia; mazungumzo ya kubadilisha nywila kwa lazima yanapomalizika | TC-AUTH-008 |
| NFR-SEC-09 | Mfumo utatekeleza muda wa kikao kisichofanya kazi wa dakika 15 | Implemented | Session Middleware (`server/index.ts`) | `IDLE_TIMEOUT_MS = 15 * 60 * 1000`; uharibifu wa moja kwa moja wa kikao; msimbo wa hali 440 unarudishwa | TC-AUTH-004 |
| NFR-SEC-10 | Ulinzi wa SSRF | Uthibitishaji wa URL na kuzuia jina la mwenyeji katika mwisho wa majaribio ya API | server/routes.ts | Inazuia IP za kibinafsi, miisho ya metadata | TC-SEC-010 |

---

## 13. Mahitaji ya Uboreshaji wa Biashara (ENT)

| Rejea ya SRS | Maelezo ya Sharti | Hali | Moduli/Sehemu | Maelezo ya Utekelezaji | Kisa cha Jaribio la UAT |
|---------|------------------------|--------|------------------|---------------------|----------------|
| ENT-01 | Mfumo utasaidia Uthibitishaji wa Hatua Nyingi (MFA) kulingana na TOTP | Implemented | MFA (`mfaSecret`, `mfaEnabled` on `users`; `mfa-setup.tsx`; `/api/auth/mfa/*`) | TOTP kupitia maktaba ya `otpauth`; usanidi unarudisha URI ya QR; miisho ya verify/disable/login; kuingia kunarudisha bendera ya `requireMfa` inapowezeshwa; i18n EN, FR, na PT | TC-ENT-001 hadi TC-ENT-005 |
| ENT-02 | Mfumo utafanya ulinganishaji wa huluki zisizo kamili kwa kugundua nakala za wakopaji | Implemented | Fuzzy Matching (`pg_trgm` extension; `fuzzyMatchBorrowers` in `storage.ts`; `/api/borrowers/fuzzy-match`) | Ulinganishaji wa trigram ya PostgreSQL kupitia `pg_trgm`; kiwango ≥ 0.3; onyo la nakala linaonyeshwa kwenye fomu ya usajili wa mkopaji | TC-ENT-006, TC-ENT-007 |
| ENT-03 | Mfumo utatoa msaidizi wa chatbot wa mwongozo kwa kufungua migogoro | Implemented | Dispute Chatbot (`dispute-chatbot.tsx`; `helpdesk.tsx`) | Mtiririko wa mwongozo wa hatua nyingi: aina ya suala → utafutaji wa mkopaji → uchaguzi wa akaunti → maelezo → kuwasilisha kwa moja kwa moja; i18n EN, FR, na PT | TC-ENT-008 hadi TC-ENT-010 |
| ENT-04 | Mfumo utasaidia uthibitishaji wa tokeni ya OAuth 2.1 Bearer kwa API ya nje | Implemented | OAuth 2.1 (`/api/external/oauth/token`; `external-api.ts`; `api-docs.tsx`) | Ruhusa ya client credentials; tokeni za JWT Bearer pamoja na X-API-Key; maktaba ya `jsonwebtoken`; imeandikwa kwenye ukurasa wa nyaraka za API | TC-ENT-011 hadi TC-ENT-013 |
| ENT-05 | Mfumo utatekeleza uboreshaji wa bandwidth ndogo (ukandamizaji, ugawanyaji wa msimbo) | Implemented | Performance (`compression` middleware in `server/index.ts`; `React.lazy` in `App.tsx`) | Ukandamizaji wa gzip kwa majibu yote ya HTTP; sehemu za njia zinazopakiwa kwa uvivu na fallback ya spinner ya `Suspense` | TC-ENT-014, TC-ENT-015 |
| ENT-06 | Mfumo utasaidia muundo wa faili ya XBRL/XML kwa kupakia data kwa wingi | Implemented | XBRL Upload (`batch-upload.tsx` XBRL tab; `/api/batch-upload/credit-accounts`) | Uchambuzi wa XBRL/XML katika mwisho wa kupakia kwa wingi; kiolesura cha tabo (JSON/CSV na XBRL); muundo wa sampuli umetolewa | TC-ENT-016, TC-ENT-017 |
| ENT-07 | Mfumo utatekeleza kumbukumbu za ukaguzi zinazostahimili uharibifu na mnyororo wa hash ya SHA-256 | Implemented | Audit Integrity (`previousHash`, `currentHash` on `audit_logs`; `verifyAuditIntegrity` in `storage.ts`; `/api/audit/verify-integrity`; `audit-trail.tsx`) | Kila ingizo la kumbukumbu linafanywa hash na SHA-256 ikiunganisha na ingizo la awali; mwisho wa uthibitishaji wa uadilifu; beji ya kuona kwenye ukurasa wa ufuatiliaji wa ukaguzi | TC-ENT-018 hadi TC-ENT-020 |
| ENT-08 | Utekelezaji wa Uhifadhi wa Data (REQ-RET-01) | Uwekaji kumbukumbu/ufutaji wa moja kwa moja kulingana na sera za mamlaka maalum | server/retention-enforcement.ts, client/src/pages/retention-policies.tsx | Kipanga ratiba cha masaa 24 + kichochezi cha mwongozo | TC-RET-001 |
| ENT-09 | Moduli ya Usimamizi wa Viwango vya Ubadilishaji | CRUD ya msimamizi kwa jozi za viwango vya kubadilisha sarafu na usambazaji wa USD | client/src/pages/exchange-rates.tsx, server/routes.ts | Sarafu 18, wijeti ya kibadilishaji | TC-EXR-001 |
| ENT-10 | Moduli ya Usimamizi wa API | Usanidi wa kati kwa miisho ya huduma za nje | client/src/pages/api-admin.tsx, server/routes.ts | Hali ya hewa, mahakama, lango la malipo | TC-API-ADM-001 |
| ENT-11 | Utafutaji wa kimataifa wa huluki mbalimbali | Implemented | Global Search (`/api/global-search`, `credit-search.tsx`) | Inatafuta kwenye wakopaji, taasisi, na akaunti za mikopo na chujio la hiari la nchi; hakuna mabadiliko ya schema yanayohitajika | TC-GS-001, TC-GS-002 |
| ENT-12 | Kupakia picha za kitambulisho na hati za wakopaji | Implemented | ID Photos (`photoUrl`, `idDocumentUrl` fields on `borrowers`, multer upload endpoints) | Picha za DiceBear zinazozalishwa kwa moja kwa moja kama chaguomsingi; kupakia picha/hati kulingana na multer na upatikanaji uliolindwa kwa uthibitishaji | TC-PHOTO-001 hadi TC-PHOTO-003 |
| ENT-13 | Mazingira ya maonyesho ya wawekezaji | Implemented | Demo Environment (login page demo cards, DEMO banner) | Kuingia kwa maonyesho kwa kubofya mara moja na kadi 3 za majukumu (Admin, Regulator, Bank Officer); bango la njano la DEMO ENVIRONMENT; kanusho la data ya kubuni | TC-DEMO-001, TC-DEMO-002 |

---

## 14. Muhtasari

| Kategoria | Jumla ya Mahitaji | Yaliyotekelezwa | Sehemu | Hayajatekelezwa |
|----------|-------------------|-------------|---------|-----------------|
| FR-COL (Ukusanyaji Data) | 8 | 8 | 0 | 0 |
| FR-CR (Utoaji Taarifa za Mikopo) | 8 | 8 | 0 | 0 |
| FR-CON (Idhini na Migogoro) | 9 | 9 | 0 | 0 |
| FR-REG (Udhibiti) | 3 | 3 | 0 | 0 |
| FR-SPEC (Mikopo Maalum) | 5 | 5 | 0 | 0 |
| FR-COMM (Kibiashara) | 5 | 5 | 0 | 0 |
| FR-DP (Watoa Data) | 4 | 4 | 0 | 0 |
| INT-RPT (Ushirikiano na Utoaji Taarifa) | 4 | 4 | 0 | 0 |
| DQ (Ubora wa Data) | 5 | 5 | 0 | 0 |
| NFR-SEC (Usalama) | 10 | 10 | 0 | 0 |
| ENT (Uboreshaji wa Biashara) | 13 | 13 | 0 | 0 |
| **Jumla** | **77** | **77** | **0** | **0** |

---

## 14. Uidhinishaji

| Jukumu | Jina | Saini | Tarehe |
|------|------|-----------|------|
| Meneja wa Mradi | | | |
| Kiongozi wa Kiufundi | | | |
| Kiongozi wa QA | | | |
| Mwakilishi wa Mteja | | | |
