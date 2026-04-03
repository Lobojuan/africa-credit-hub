# Kamusi ya Data

## Mfumo wa Kituo Kikuu cha Data cha Mamlaka Mbalimbali & Sajili ya Mikopo v2.5

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 2.5  
**Tarehe:** Aprili 2026

---

## 1. Muhtasari

Hati hii inatoa nyaraka za kiwango cha sehemu kwa jedwali zote 21 za hifadhidata katika Mfumo wa Sajili ya Mikopo. Mfumo huu unasaidia nchi zote 54 za Afrika zenye sarafu 42+ za Kiafrika pamoja na USD, EUR, na GBP. Hifadhidata inatumia PostgreSQL na Drizzle ORM kwa usimamizi wa schema.

**Maboresho ya Biashara — Muhtasari wa Athari za Schema:**

| Uboreshaji | Mabadiliko ya Schema |
|-------------|---------------|
| ENT-01 (MFA) | Safu wima `mfa_secret` na `mfa_enabled` zimeongezwa kwenye jedwali la `users` |
| ENT-02 (Fuzzy Matching) | Hakuna jedwali/safu wima mpya; inatumia kiendelezi cha PostgreSQL `pg_trgm` kwenye safu wima zilizopo za `borrowers.first_name`/`borrowers.last_name` |
| ENT-03 (Dispute Chatbot) | Hakuna jedwali/safu wima mpya; inatumia jedwali lililo la `disputes` kwa malalamiko yanayowasilishwa kiotomatiki |
| ENT-04 (OAuth 2.1) | Hakuna jedwali/safu wima mpya; tokeni za JWT hazihifadhiwi na zinasainiwa kwenye kumbukumbu kwa kutumia `api_keys` zilizopo kwa uthibitisho |
| ENT-05 (Low-Bandwidth) | Hakuna mabadiliko ya schema; ukandamizaji na ugawanyaji wa msimbo ni maboresho ya tabaka la programu |
| ENT-06 (XBRL Upload) | Hakuna jedwali/safu wima mpya; rekodi za XBRL/XML zinachambuliwa na kuingizwa kwenye jedwali lililo la `credit_accounts` kupitia upakiaji wa kundi |
| ENT-07 (Hash Chain) | Safu wima `previous_hash` na `current_hash` zimeongezwa kwenye jedwali la `audit_logs` |
| ENT-08 (Exchange Rates) | Jedwali jipya la `exchange_rates` kwa usimamizi wa viwango vya sarafu nyingi kwa sarafu 42+ za Kiafrika |
| ENT-09 (API Admin) | Jedwali jipya la `api_configurations` kwa usimamizi wa kati wa ujumuishaji wa API za nje |
| ENT-10 (Retention) | Jedwali jipya la `retention_policies` kwa usanidi wa kipindi cha uhifadhi wa data kulingana na mamlaka |
| ENT-11 (Global Search) | Hakuna mabadiliko ya schema; utafutaji wa vyombo mbalimbali unatumia jedwali zilizopo kupitia endpoint ya `/api/global-search` |
| ENT-12 (ID Photos) | Safu wima `photo_url` na `id_document_url` zimeongezwa kwenye jedwali la `borrowers` kwa picha za wasifu na skani za hati za kitambulisho |
| ENT-13 (Demo Environment) | Hakuna mabadiliko ya schema; hali ya onyesho kwa wawekezaji na kadi za kuingia kulingana na jukumu kwa kutumia schema iliyopo |

---

## 2. Aina za Orodha

### 2.1 user_role
| Thamani | Maelezo |
|-------|-------------|
| admin | Ufikiaji kamili wa mfumo, usimamizi wa watumiaji, usimamizi wa taasisi, usimamizi wa funguo za API |
| regulator | Ufikiaji wa kumbukumbu za ukaguzi, bili, idhini, uchambuzi |
| lender | Uingizaji wa data, usimamizi wa wakopaji, upakiaji wa kundi |
| viewer | Ufikiaji wa kusoma pekee kwa wakopaji, akaunti, ripoti |

### 2.2 user_status
| Thamani | Maelezo |
|-------|-------------|
| active | Mtumiaji anaweza kuingia na kupata mfumo |
| suspended | Mtumiaji amezuiwa kwa muda kutoka kupata ufikiaji |
| deactivated | Mtumiaji amezuiwa kabisa kutoka kupata ufikiaji |

### 2.3 borrower_type
| Thamani | Maelezo |
|-------|-------------|
| individual | Mkopaji mtu binafsi |
| corporate | Mkopaji taasisi ya biashara |

### 2.4 account_status
| Thamani | Maelezo |
|-------|-------------|
| current | Akaunti iko katika hali nzuri na malipo yanafanywa kwa wakati |
| delinquent | Akaunti yenye malipo yaliyochelewa |
| default | Akaunti katika hali ya kushindwa kulipa (ucheleweshaji mkubwa) |
| closed | Akaunti imelipwa kikamilifu na kufungwa |
| restructured | Akaunti ambayo imepangwa upya |
| written_off | Akaunti imefutwa kama isiyoweza kukusanywa |

### 2.5 inquiry_purpose
| Thamani | Maelezo |
|-------|-------------|
| new_credit | Uchunguzi kwa maombi mapya ya mkopo |
| review | Mapitio ya mara kwa mara ya akaunti |
| collection | Uchunguzi unaohusiana na ukusanyaji |
| regulatory | Uchunguzi wa udhibiti |
| portfolio_monitoring | Ufuatiliaji wa hatari za kwingineko |

### 2.6 approval_status
| Thamani | Maelezo |
|-------|-------------|
| pending | Inasubiri mapitio |
| approved | Imeidhinishwa na mkaguzi |
| rejected | Imekataliwa na mkaguzi |

### 2.7 dispute_status
| Thamani | Maelezo |
|-------|-------------|
| open | Malalamiko mapya yaliyowasilishwa |
| under_review | Malalamiko yanachunguzwa |
| resolved | Malalamiko yametatuliwa |
| rejected | Malalamiko yamekataliwa |

### 2.8 judgment_type
| Thamani | Maelezo |
|-------|-------------|
| lien | Dai la kisheria juu ya mali |
| bankruptcy | Ufilisi |
| lawsuit | Kesi inayoendelea |
| civil_judgment | Hukumu ya mahakama ya kiraia |
| criminal_conviction | Hukumu ya jinai |

### 2.9 judgment_status
| Thamani | Maelezo |
|-------|-------------|
| active | Hukumu inayotumika kwa sasa |
| resolved | Hukumu imetatuliwa au kutimizwa |
| appealed | Hukumu iko chini ya rufaa |

### 2.10 consent_status
| Thamani | Maelezo |
|-------|-------------|
| active | Idhini inayotumika kwa sasa |
| revoked | Idhini imebatilishwa |

### 2.11 payment_status
| Thamani | Maelezo |
|-------|-------------|
| on_time | Malipo yamefanywa kwa ratiba |
| late | Malipo yamefanywa baada ya tarehe ya mwisho |
| missed | Malipo hayajafanywa |
| partial | Malipo ya sehemu yamefanywa |

### 2.12 institution_status
| Thamani | Maelezo |
|-------|-------------|
| pending | Inasubiri idhini ya msimamizi |
| active | Imeidhinishwa na inatumika |
| suspended | Imesimamishwa kwa muda |

### 2.13 billing_status
| Thamani | Maelezo |
|-------|-------------|
| pending | Ankara inasubiri malipo |
| paid | Ankara imelipwa |
| overdue | Ankara imepita tarehe ya mwisho |

### 2.14 api_key_status
| Thamani | Maelezo |
|-------|-------------|
| active | Funguo ya API inatumika na inaweza kutumika |
| revoked | Funguo ya API imebatilishwa |

---

## 3. Ufafanuzi wa Jedwali

### 3.1 users

**Maelezo:** Watumiaji wa mfumo wenye uthibitisho, majukumu, na ufuatiliaji wa kuingia.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha mtumiaji | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| username | text | NOT NULL, UNIQUE | Jina la kuingia | `admin` |
| password | text | NOT NULL | Nenosiri lililosimbwa kwa bcrypt | `$2a$10$...` |
| full_name | text | NOT NULL | Jina kamili la mtumiaji | `System Administrator` |
| email | text | NOT NULL | Anwani ya barua pepe ya mtumiaji | `admin@sim.com` |
| role | user_role | NOT NULL, DEFAULT 'viewer' | Jukumu la mtumiaji kwa RBAC | `admin` |
| status | user_status | NOT NULL, DEFAULT 'active' | Hali ya akaunti | `active` |
| institution | text | NULLABLE | Jina la taasisi inayohusiana | `National Bank of Ethiopia` |
| failed_login_attempts | integer | DEFAULT 0 | Kihesabu cha majaribio ya kuingia yaliyoshindwa | `2` |
| locked_until | timestamp | NULLABLE | Muda wa kumalizika kwa kufungwa kwa akaunti | `2026-02-28T10:30:00Z` |
| last_login | timestamp | NULLABLE | Mhuri wa mwisho wa kuingia kwa mafanikio | `2026-02-28T09:00:00Z` |
| password_changed_at | timestamp | NULLABLE | Mhuri wa mwisho wa kubadilisha nenosiri | `2026-02-28T00:00:00Z` |
| must_change_password | boolean | DEFAULT false | Lazimisha kubadilisha nenosiri kwenye kuingia ijayo | `false` |
| mfa_secret | varchar | NULLABLE | Siri ya TOTP MFA (iliyosimbwa kwa base32); inajazwa wakati MFA inawekwa (ENT-01) | `JBSWY3DPEHPK3PXP` |
| mfa_enabled | boolean | DEFAULT false | Iwapo TOTP MFA imewashwa kwa mtumiaji (ENT-01) | `false` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T00:00:00Z` |

---

### 3.2 borrowers

**Maelezo:** Rekodi za wakopaji binafsi na mashirika yenye taarifa za kidemografia, ajira, na PEP.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha mkopaji | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| type | borrower_type | NOT NULL | Kategoria ya mkopaji | `individual` |
| first_name | text | NULLABLE | Jina la kwanza (wakopaji binafsi) | `Abebe` |
| last_name | text | NULLABLE | Jina la ukoo (wakopaji binafsi) | `Bekele` |
| company_name | text | NULLABLE | Jina la kampuni (wakopaji wa mashirika) | `Ethio Telecom` |
| national_id | text | NOT NULL, UNIQUE | Nambari ya kitambulisho cha kitaifa | `ETH-1234567890` |
| tin_number | text | NULLABLE | Nambari ya Kitambulisho cha Kodi | `TIN-9876543210` |
| date_of_birth | text | NULLABLE | Tarehe ya kuzaliwa (YYYY-MM-DD) | `1985-03-15` |
| gender | text | NULLABLE | Jinsia | `male` |
| phone | text | NULLABLE | Nambari ya simu | `+251911234567` |
| email | text | NULLABLE | Anwani ya barua pepe | `abebe@example.com` |
| address | text | NULLABLE | Anwani ya mtaa | `Bole Road, Addis Ababa` |
| country | text | NULLABLE | Nchi ya mamlaka | `Ethiopia` |
| city | text | NULLABLE | Jiji | `Addis Ababa` |
| region | text | NULLABLE | Mkoa/Jimbo | `Addis Ababa` |
| employer_name | text | NULLABLE | Mwajiri wa sasa | `Ethiopian Airlines` |
| occupation | text | NULLABLE | Kazi/Cheo cha kazi | `Engineer` |
| business_reg_number | text | NULLABLE | Nambari ya usajili wa biashara (mashirika) | `BR-2024-001` |
| sector | text | NULLABLE | Sekta ya biashara (mashirika) | `Technology` |
| passport_number | text | NULLABLE | Nambari ya pasipoti kwa utatuzi wa vyombo vya kuvuka mpaka | `EP1234567` |
| photo_url | text | NULLABLE | URL/njia ya picha ya wasifu wa mkopaji (iliyotengenezwa kiotomatiki kupitia DiceBear au kupakiwa kupitia multer) (ENT-12) | `/uploads/photos/abc123.jpg` |
| id_document_url | text | NULLABLE | URL/njia ya skani ya hati ya kitambulisho iliyopakiwa (pasipoti, kitambulisho cha kitaifa) (ENT-12) | `/uploads/documents/def456.pdf` |
| is_pep | boolean | DEFAULT false | Alama ya Mtu Mwenye Nafasi ya Kisiasa | `false` |
| pep_details | text | NULLABLE | Maelezo/ufafanuzi wa PEP | `Former government minister` |
| related_borrower_id | varchar | NULLABLE | Kitambulisho cha mkopaji mwenye uhusiano/uunganishaji | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| relationship_type | text | NULLABLE | Uhusiano na mkopaji mwenye uhusiano (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company) | `spouse` |
| education_level | text | NULLABLE | Kiwango cha juu cha elimu | `bachelors` |
| education_institution | text | NULLABLE | Jina la taasisi ya elimu | `Addis Ababa University` |
| employment_history | text | NULLABLE | Maelezo ya historia ya ajira | `5 years at Ethiopian Airlines` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Mhuri wa sasisho la mwisho | `2026-02-28T10:00:00Z` |

---

### 3.3 credit_accounts

**Maelezo:** Rekodi za mikopo na vituo vya mkopo zenye msaada wa sarafu nyingi, vipengele maalum vya mkopo, na ufuatiliaji wa upangaji upya.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha akaunti | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji anayehusiana | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| lender_institution | text | NOT NULL | Jina la taasisi ya mkopo | `Commercial Bank of Ethiopia` |
| account_number | text | NOT NULL | Nambari ya akaunti/mkopo | `ACC-2024-001234` |
| account_type | text | NOT NULL | Aina ya kituo cha mkopo | `term_loan` |
| original_amount | decimal(15,2) | NOT NULL | Kiasi cha awali kilichotolewa | `500000.00` |
| current_balance | decimal(15,2) | NOT NULL | Salio la sasa linalobaki | `350000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Msimbo wa sarafu | `ETB` |
| interest_rate | decimal(5,2) | NULLABLE | Kiwango cha riba cha kila mwaka kwa asilimia | `12.50` |
| disbursement_date | text | NULLABLE | Tarehe ya utoaji wa mkopo | `2024-01-15` |
| maturity_date | text | NULLABLE | Tarehe ya ukomavu wa mkopo | `2029-01-15` |
| status | account_status | NOT NULL, DEFAULT 'current' | Hali ya akaunti | `current` |
| days_in_arrears | integer | DEFAULT 0 | Idadi ya siku za malimbikizo | `0` |
| collateral_type | text | NULLABLE | Aina ya dhamana iliyowekwa | `real_estate` |
| collateral_value | decimal(15,2) | NULLABLE | Thamani ya dhamana | `750000.00` |
| last_payment_date | text | NULLABLE | Tarehe ya malipo ya mwisho | `2026-02-28` |
| last_payment_amount | decimal(15,2) | NULLABLE | Kiasi cha malipo ya mwisho | `15000.00` |
| is_interest_free | boolean | DEFAULT false | Alama ya mkopo usio na riba | `false` |
| grace_period_months | integer | NULLABLE | Kipindi cha neema kwa miezi | `6` |
| restructure_count | integer | DEFAULT 0 | Idadi ya upangaji upya | `0` |
| written_off_date | text | NULLABLE | Tarehe akaunti ilifutwa | `null` |
| reinstated_date | text | NULLABLE | Tarehe akaunti ilirejeshwa | `null` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Mhuri wa sasisho la mwisho | `2026-02-28T10:00:00Z` |

---

### 3.4 credit_inquiries

**Maelezo:** Rekodi za ukaguzi wa rejea ya mkopo uliofanywa kwa wakopaji.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha uchunguzi | `e5f6a7b8-c9d0-1234-ef01-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji anayechunguzwa | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| inquired_by | varchar | NOT NULL, FK -> users.id | Mtumiaji aliyefanya uchunguzi | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| purpose | inquiry_purpose | NOT NULL | Kusudi la uchunguzi wa mkopo | `new_credit` |
| institution | text | NOT NULL | Taasisi inayofanya uchunguzi | `Commercial Bank of Ethiopia` |
| consent_provided | boolean | NOT NULL, DEFAULT false | Iwapo idhini ya mkopaji ilipatikana | `true` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa uchunguzi | `2026-02-28T09:30:00Z` |

---

### 3.5 audit_logs

**Maelezo:** Kumbukumbu isiyobadilika ya shughuli za mfumo wote zenye ufuatiliaji wa anwani ya IP.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha ingizo la kumbukumbu | `f6a7b8c9-d0e1-2345-f012-678901234567` |
| user_id | varchar | NULLABLE, FK -> users.id | Mtumiaji aliyefanya hatua | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| action | text | NOT NULL | Aina ya hatua iliyofanywa | `LOGIN`, `CREATE`, `UPDATE`, `APPROVE` |
| entity | text | NOT NULL | Aina ya chombo kilichoathiriwa | `user`, `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | Kitambulisho cha chombo kilichoathiriwa | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| details | text | NULLABLE | Maelezo ya hatua yanayosomeka na binadamu | `Created user: John Doe` |
| ip_address | text | NULLABLE | Anwani ya IP ya mteja | `192.168.1.100` |
| previous_hash | text | NULLABLE | Hash ya SHA-256 ya ingizo la kumbukumbu ya ukaguzi iliyotangulia katika mnyororo wa hash (ENT-07); `"genesis"` kwa ingizo la kwanza | `genesis` au `a1b2c3d4...` |
| current_hash | text | NULLABLE | Hash ya SHA-256 ya ingizo hili la kumbukumbu ya ukaguzi iliyohesabiwa kutoka `previousHash` + `action` + `entity` + `details` + `timestamp` (ENT-07) | `e3b0c44298fc1c14...` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa ingizo la kumbukumbu | `2026-02-28T09:30:00Z` |

---

### 3.6 pending_approvals

**Maelezo:** Foleni ya mtiririko wa kazi wa maker-checker kwa idhini za mabadiliko ya data.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha ombi la idhini | `a7b8c9d0-e1f2-3456-0123-789012345678` |
| entity_type | text | NOT NULL | Aina ya chombo kinachobadilishwa | `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | Kitambulisho cha chombo kilichopo (kwa masasisho) | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| action | text | NOT NULL | Aina ya mabadiliko yaliyoombwa | `CREATE`, `UPDATE` |
| payload | text | NOT NULL | Data ya mabadiliko iliyosanifishwa kwa JSON | `{"firstName":"Abebe","lastName":"Bekele",...}` |
| requested_by | varchar | NOT NULL, FK -> users.id | Mtumiaji aliyewasilisha ombi | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| reviewed_by | varchar | NULLABLE, FK -> users.id | Mtumiaji aliyekagua ombi | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| status | approval_status | NOT NULL, DEFAULT 'pending' | Hali ya sasa ya idhini | `pending` |
| review_notes | text | NULLABLE | Maoni/maelezo ya mkaguzi | `Approved - verified documentation` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuwasilishwa kwa ombi | `2026-02-28T09:30:00Z` |
| reviewed_at | timestamp | NULLABLE | Mhuri wa ukaguzi | `2026-02-28T10:00:00Z` |

---

### 3.7 disputes

**Maelezo:** Rekodi za malalamiko na masuluhisho zenye ufuatiliaji wa SLA na uainishaji wa aina ya marekebisho.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha malalamiko | `b8c9d0e1-f2a3-4567-1234-890123456789` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji anayewasilisha malalamiko | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| credit_account_id | varchar | NULLABLE, FK -> credit_accounts.id | Akaunti ya mkopo inayohusiana | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| filed_by | varchar | NOT NULL, FK -> users.id | Mtumiaji aliyewasilisha malalamiko | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| dispute_type | text | NOT NULL | Kategoria ya malalamiko | `incorrect_balance`, `wrong_status`, `identity_error` |
| description | text | NOT NULL | Maelezo ya kina ya malalamiko | `Balance shows 500,000 ETB but should be 350,000 ETB` |
| status | dispute_status | NOT NULL, DEFAULT 'open' | Hali ya sasa ya malalamiko | `open` |
| resolution | text | NULLABLE | Maelezo ya utatuzi | `Balance corrected to 350,000 ETB` |
| correction_type | text | NULLABLE | Marekebisho ya kifedha au yasiyo ya kifedha | `financial` |
| sla_deadline | timestamp | NULLABLE | Muda wa mwisho wa SLA (siku 2 za kifedha, siku 5 zisizo za kifedha) | `2026-03-02T09:30:00Z` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuwasilishwa kwa malalamiko | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Mhuri wa sasisho la mwisho | `2026-02-28T10:00:00Z` |
| resolved_at | timestamp | NULLABLE | Mhuri wa utatuzi | `2026-02-28T14:00:00Z` |

---

### 3.8 notifications

**Maelezo:** Mfumo wa arifa ndani ya programu kwa maombi ya idhini, matokeo, na tahadhari za mfumo.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha arifa | `c9d0e1f2-a3b4-5678-2345-901234567890` |
| user_id | varchar | NULLABLE, FK -> users.id | Mtumiaji lengwa (null = tangazo) | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| type | text | NOT NULL | Kategoria ya arifa | `approval_pending`, `approval_result`, `dispute_filed` |
| title | text | NOT NULL | Kichwa cha arifa | `New approval pending` |
| message | text | NOT NULL | Mwili wa arifa | `New borrower registration requires your review` |
| is_read | boolean | DEFAULT false | Alama ya hali ya kusomwa | `false` |
| link | text | NULLABLE | Kiungo cha urambazaji | `/approvals` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa arifa | `2026-02-28T09:30:00Z` |

---

### 3.9 court_judgments

**Maelezo:** Hukumu za mahakama, ufilisi, na madai yanayohusiana na wakopaji (FR-COL-05).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha hukumu | `d0e1f2a3-b4c5-6789-3456-012345678901` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji anayehusiana | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| case_number | text | NOT NULL | Nambari ya kesi ya mahakama | `CASE-2024-5678` |
| court | text | NOT NULL | Jina la mahakama | `Federal High Court, Addis Ababa` |
| judgment_type | judgment_type | NOT NULL | Aina ya hukumu | `civil_judgment` |
| amount | decimal(15,2) | NULLABLE | Kiasi cha hukumu | `1000000.00` |
| currency | text | DEFAULT 'ETB' | Sarafu ya kiasi cha hukumu | `ETB` |
| judgment_date | text | NOT NULL | Tarehe hukumu ilitolewa | `2024-06-15` |
| status | judgment_status | NOT NULL, DEFAULT 'active' | Hali ya sasa ya hukumu | `active` |
| description | text | NULLABLE | Maelezo ya hukumu | `Civil judgment for unpaid commercial loan` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T09:30:00Z` |

---

### 3.10 consent_records

**Maelezo:** Usimamizi wa idhini ya mhusika wa data wenye nambari za risiti (FR-CON-06/07).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha rekodi ya idhini | `e1f2a3b4-c5d6-7890-4567-123456789012` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji anayetoa idhini | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| granted_to | text | NOT NULL | Chombo kinachopokea idhini | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Kusudi la idhini | `credit_check`, `data_sharing` |
| consent_type | text | NOT NULL | Aina ya idhini | `one_time`, `recurring` |
| status | consent_status | NOT NULL, DEFAULT 'active' | Hali ya sasa ya idhini | `active` |
| granted_at | timestamp | DEFAULT NOW() | Mhuri wa kutoa idhini | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Mhuri wa kubatilisha idhini | `null` |
| receipt_number | text | NOT NULL | Nambari ya kipekee ya risiti ya idhini | `CR-1705312200000-abc123` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T09:30:00Z` |

---

### 3.11 payment_history

**Maelezo:** Historia ya utendaji wa malipo ya vipindi 12 kwa kila akaunti ya mkopo (FR-CR-08).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha rekodi ya malipo | `f2a3b4c5-d6e7-8901-5678-234567890123` |
| credit_account_id | varchar | NOT NULL, FK -> credit_accounts.id | Akaunti ya mkopo inayohusiana | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| period | text | NOT NULL | Kipindi cha malipo (muundo wa YYYY-MM) | `2026-02` |
| amount_due | decimal(15,2) | NOT NULL | Kiasi kinachostahili kwa kipindi | `15000.00` |
| amount_paid | decimal(15,2) | NOT NULL | Kiasi kilicholipwa kwa kweli | `15000.00` |
| status | payment_status | NOT NULL, DEFAULT 'on_time' | Hali ya malipo kwa kipindi | `on_time` |
| days_late | integer | DEFAULT 0 | Idadi ya siku malipo yalichelewa | `0` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa rekodi | `2026-02-28T09:30:00Z` |

---

### 3.12 institutions

**Maelezo:** Usajili wa taasisi za watoa data na mtiririko wa kazi wa idhini (FR-DP-01/04).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha taasisi | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| name | text | NOT NULL | Jina la taasisi | `Commercial Bank of Ethiopia` |
| type | text | NOT NULL | Aina ya taasisi | `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| registration_number | text | NULLABLE | Nambari rasmi ya usajili | `REG-2024-001` |
| country | text | NOT NULL, DEFAULT 'Ethiopia' | Nchi ya uendeshaji | `Ethiopia` |
| contact_email | text | NULLABLE | Anwani ya barua pepe ya mawasiliano | `info@cbe.com.et` |
| contact_phone | text | NULLABLE | Nambari ya simu ya mawasiliano | `+251111234567` |
| address | text | NULLABLE | Anwani ya kimwili | `Churchill Avenue, Addis Ababa` |
| status | institution_status | NOT NULL, DEFAULT 'pending' | Hali ya usajili | `active` |
| submission_frequency | text | DEFAULT 'monthly' | Mzunguko wa kuwasilisha data | `monthly` |
| approved_by | varchar | NULLABLE, FK -> users.id | Msimamizi aliyeidhinisha | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| approved_at | timestamp | NULLABLE | Mhuri wa idhini | `2026-02-28T10:00:00Z` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa usajili | `2026-02-28T00:00:00Z` |

---

### 3.13 billing_records

**Maelezo:** Usimamizi wa bili na ada kwa taasisi (FR-COMM-01/05).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha rekodi ya bili | `b4c5d6e7-f8a9-0123-7890-456789012345` |
| institution_name | text | NOT NULL | Jina la taasisi inayotozwa | `Commercial Bank of Ethiopia` |
| service_type | text | NOT NULL | Aina ya huduma inayotozwa | `data_submission`, `credit_report`, `api_access`, `subscription` |
| amount | decimal(15,2) | NOT NULL | Kiasi cha ankara | `50000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | Sarafu ya ankara | `ETB` |
| status | billing_status | NOT NULL, DEFAULT 'pending' | Hali ya malipo | `pending` |
| invoice_number | text | NOT NULL | Nambari ya kipekee ya ankara | `INV-2025-001234` |
| period_start | text | NULLABLE | Tarehe ya kuanza ya kipindi cha bili | `2026-02-28` |
| period_end | text | NULLABLE | Tarehe ya kumalizika ya kipindi cha bili | `2026-02-28` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa kwa ankara | `2026-02-28T09:30:00Z` |

---

### 3.14 credit_report_logs

**Maelezo:** Kumbukumbu za utengenezaji wa ripoti za mkopo zenye nambari za serial za kipekee (FR-CR-06).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha kumbukumbu | `c5d6e7f8-a9b0-1234-8901-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | Mkopaji ambaye ripoti ilitengenezwa | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| requested_by | varchar | NOT NULL, FK -> users.id | Mtumiaji aliyeomba ripoti | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| institution | text | NOT NULL | Taasisi inayoomba | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | Kusudi la utengenezaji wa ripoti | `new_credit` |
| serial_number | text | NOT NULL, UNIQUE | Nambari ya serial ya kipekee ya ripoti | `CR-2025-M1A2B3C4` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa utengenezaji wa ripoti | `2026-02-28T09:30:00Z` |

---

### 3.15 api_keys

**Maelezo:** Usimamizi wa funguo za API za nje zenye usimbaji wa SHA-256, viwango vya ruhusa, na uhusiano wa taasisi.

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee cha rekodi ya funguo ya API | `d6e7f8a9-b0c1-2345-9012-678901234567` |
| institution_id | varchar | NOT NULL, FK -> institutions.id | Taasisi inayohusiana | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| key_hash | text | NOT NULL | Hash ya SHA-256 ya funguo kamili ya API | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| key_prefix | text | NOT NULL | Kiambishi tambuzi cha funguo kinachoonekana | `sim_a1b2c3d4` |
| label | text | NOT NULL | Lebo inayosomeka na binadamu | `Production API Key` |
| status | api_key_status | NOT NULL, DEFAULT 'active' | Hali ya funguo | `active` |
| permissions | text | NOT NULL, DEFAULT 'submit' | Kiwango cha ruhusa | `submit`, `read`, `full` |
| last_used_at | timestamp | NULLABLE | Mhuri wa mwisho wa wito wa API | `2026-02-28T14:30:00Z` |
| created_by | varchar | NOT NULL, FK -> users.id | Msimamizi aliyeunda funguo | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuunda funguo | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | Mhuri wa kubatilisha funguo | `null` |

---

### 3.16 exchange_rates

**Maelezo:** Rekodi za viwango vya ubadilishaji kwa msaada wa sarafu nyingi katika mamlaka zote 54 za Afrika, zinazosaidia sarafu 42+ za Kiafrika pamoja na USD, EUR, GBP. Viwango vinaweza kuingizwa kwa mikono au kupatikana moja kwa moja kutoka open.er-api.com na ubadilishaji wa viwango vya msalaba kupitia njia ya USD (ENT-08).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee | `e7f8a9b0-c1d2-3456-0123-789012345678` |
| base_currency | text | NOT NULL | Msimbo wa sarafu ya msingi (k.m., USD) | `USD` |
| target_currency | text | NOT NULL | Msimbo wa sarafu lengwa (k.m., ETB) | `ETB` |
| rate | decimal(15,6) | NOT NULL | Thamani ya kiwango cha ubadilishaji | `56.123456` |
| effective_date | text | NOT NULL | Tarehe kiwango kinatumika | `2026-03-01` |
| source | text | NOT NULL, DEFAULT 'manual' | Chanzo cha kiwango (manual, api, open.er-api.com) | `manual` |
| created_by | varchar | NULLABLE, FK -> users.id | Mtumiaji aliyeunda kiwango | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa | `2026-02-28T09:30:00Z` |

---

### 3.17 retention_policies

**Maelezo:** Usanidi wa sera ya uhifadhi wa data kwa kila mamlaka na aina ya chombo, na uratibu wa utekelezaji wa kiotomatiki. Inasaidia nchi zote 54 za Afrika na vipindi vya uhifadhi kulingana na mamlaka (ENT-10).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee | `f8a9b0c1-d2e3-4567-1234-890123456789` |
| country | text | NOT NULL | Mamlaka (mojawapo ya nchi 54 za Afrika) | `Ethiopia` |
| entity_type | text | NOT NULL | Aina: borrower, credit_account, audit_log, dispute, consent_record, court_judgment, payment_history | `borrower` |
| retention_years | integer | NOT NULL | Miaka kabla ya kuondoa rekodi | `7` |
| archive_after_years | integer | NULLABLE | Miaka kabla ya kuhifadhi rekodi | `5` |
| description | text | NULLABLE | Maelezo ya sera | `Retain borrower records for 7 years per NBE regulation` |
| is_active | boolean | DEFAULT true | Iwapo sera inatumika | `true` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Mhuri wa sasisho la mwisho | `2026-02-28T10:00:00Z` |

---

### 3.18 api_configurations

**Maelezo:** Usanidi wa kati wa ujumuishaji wa API za nje kwa huduma za hali ya hewa, kisheria, malipo, viwango vya ubadilishaji, na huduma maalum. Inatoa majaribio ya muunganisho na ufuatiliaji wa hali kwa ujumuishaji wote uliosanidiwa (ENT-09).

| Field Name | Data Type | Constraints | Maelezo | Example Value |
|------------|-----------|-------------|-------------|---------------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | Kitambulisho cha kipekee | `a9b0c1d2-e3f4-5678-2345-901234567890` |
| name | text | NOT NULL | Jina la usanidi | `Ethiopia Weather API` |
| category | text | NOT NULL | Kategoria: weather, judicial, payment_gateway, exchange_rate, custom | `weather` |
| base_url | text | NOT NULL | URL ya msingi ya API | `https://api.weather.example.com/v1` |
| api_key_header_name | text | DEFAULT 'X-API-Key' | Jina la kichwa kwa funguo ya API | `X-API-Key` |
| auth_type | text | NOT NULL | Uthibitisho: api_key, oauth2, bearer, basic, none | `api_key` |
| country | text | NULLABLE | Nchi lengwa au "All" | `Ethiopia` |
| is_active | boolean | DEFAULT true | Iwapo usanidi unatumika | `true` |
| description | text | NULLABLE | Maelezo ya usanidi | `Weather data for agricultural loan risk assessment` |
| last_tested_at | timestamp | NULLABLE | Wakati wa mwisho wa jaribio la muunganisho | `2026-02-28T14:00:00Z` |
| last_test_status | text | NULLABLE | Matokeo ya jaribio la mwisho (reachable, unreachable) | `reachable` |
| created_at | timestamp | DEFAULT NOW() | Mhuri wa kuundwa | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | Mhuri wa sasisho la mwisho | `2026-02-28T10:00:00Z` |

---

## 4. Mchoro wa Uhusiano (Kwa Maandishi)

```
users
  |
  +--< credit_inquiries (inquired_by -> users.id)
  +--< pending_approvals (requested_by -> users.id)
  +--< pending_approvals (reviewed_by -> users.id)
  +--< disputes (filed_by -> users.id)
  +--< notifications (user_id -> users.id)
  +--< audit_logs (user_id -> users.id)
  +--< credit_report_logs (requested_by -> users.id)
  +--< api_keys (created_by -> users.id)
  +--< institutions (approved_by -> users.id)
  +--< exchange_rates (created_by -> users.id)

borrowers
  |
  +--< credit_accounts (borrower_id -> borrowers.id)
  +--< credit_inquiries (borrower_id -> borrowers.id)
  +--< disputes (borrower_id -> borrowers.id)
  +--< court_judgments (borrower_id -> borrowers.id)
  +--< consent_records (borrower_id -> borrowers.id)
  +--< credit_report_logs (borrower_id -> borrowers.id)
  +--  borrowers (related_borrower_id -> borrowers.id) [kujirejelea]

credit_accounts
  |
  +--< payment_history (credit_account_id -> credit_accounts.id)
  +--< disputes (credit_account_id -> credit_accounts.id)

institutions
  |
  +--< api_keys (institution_id -> institutions.id)
```

**Ufunguo:**
- `+--<` = Uhusiano wa Moja-kwa-Wengi (mzazi hadi mtoto)
- `+--` = Rejea ya hiari (kujirejelea au FK inayoweza kuwa tupu)

---

## 5. Sarafu Zinazosaidiwa

Mfumo unasaidia sarafu 42+ za Kiafrika pamoja na sarafu 3 za kimataifa za akiba, zikifunika nchi zote 54 za Afrika.

### 5.1 Sarafu za Kimataifa za Akiba

| Code | Jina la Sarafu | Mamlaka |
|------|--------------|---------------|
| USD | US Dollar | Zote |
| EUR | Euro | Zote |
| GBP | British Pound | Zote |

### 5.2 Sarafu za Afrika Magharibi (ECOWAS)

| Code | Jina la Sarafu | Nchi/Mkoa |
|------|--------------|----------------|
| NGN | Nigerian Naira | Nigeria |
| GHS | Ghanaian Cedi | Ghana |
| XOF | West African CFA Franc | Benin, Burkina Faso, Ivory Coast, Guinea-Bissau, Mali, Niger, Senegal, Togo |
| LRD | Liberian Dollar | Liberia |
| SLL | Sierra Leonean Leone | Sierra Leone |
| GMD | Gambian Dalasi | Gambia |
| GNF | Guinean Franc | Guinea |
| CVE | Cape Verdean Escudo | Cape Verde |

### 5.3 Sarafu za Afrika Mashariki (EAC)

| Code | Jina la Sarafu | Nchi/Mkoa |
|------|--------------|----------------|
| KES | Kenyan Shilling | Kenya |
| UGX | Ugandan Shilling | Uganda |
| TZS | Tanzanian Shilling | Tanzania |
| RWF | Rwandan Franc | Rwanda |
| BIF | Burundian Franc | Burundi |
| ETB | Ethiopian Birr | Ethiopia |
| SSP | South Sudanese Pound | South Sudan |
| SDG | Sudanese Pound | Sudan |
| SOS | Somali Shilling | Somalia |
| DJF | Djiboutian Franc | Djibouti |
| ERN | Eritrean Nakfa | Eritrea |

### 5.4 Sarafu za Afrika Kusini (SADC)

| Code | Jina la Sarafu | Nchi/Mkoa |
|------|--------------|----------------|
| ZAR | South African Rand | South Africa, Lesotho, Eswatini, Namibia |
| BWP | Botswana Pula | Botswana |
| MWK | Malawian Kwacha | Malawi |
| ZMW | Zambian Kwacha | Zambia |
| MZN | Mozambican Metical | Mozambique |
| AOA | Angolan Kwanza | Angola |
| MGA | Malagasy Ariary | Madagascar |
| MUR | Mauritian Rupee | Mauritius |
| SCR | Seychellois Rupee | Seychelles |
| KMF | Comorian Franc | Comoros |
| ZWL | Zimbabwean Dollar | Zimbabwe |
| LSL | Lesotho Loti | Lesotho |
| NAD | Namibian Dollar | Namibia |
| SZL | Eswatini Lilangeni | Eswatini |

### 5.5 Sarafu za Afrika ya Kati (CEMAC)

| Code | Jina la Sarafu | Nchi/Mkoa |
|------|--------------|----------------|
| XAF | Central African CFA Franc | Cameroon, Central African Republic, Chad, Republic of the Congo, Equatorial Guinea, Gabon |
| CDF | Congolese Franc | Democratic Republic of the Congo |
| STN | Sao Tome and Principe Dobra | Sao Tome and Principe |

### 5.6 Sarafu za Afrika Kaskazini (AMU)

| Code | Jina la Sarafu | Nchi/Mkoa |
|------|--------------|----------------|
| EGP | Egyptian Pound | Egypt |
| MAD | Moroccan Dirham | Morocco |
| TND | Tunisian Dinar | Tunisia |
| DZD | Algerian Dinar | Algeria |
| LYD | Libyan Dinar | Libya |
| MRU | Mauritanian Ouguiya | Mauritania |

---

## 6. Muhtasari wa Faharasa

| Jedwali | Safu Wima Zilizofanya Faharasa | Aina ya Faharasa |
|-------|----------------|------------|
| users | id (PK), username (UNIQUE) | B-tree |
| borrowers | id (PK), national_id (UNIQUE) | B-tree |
| credit_accounts | id (PK), borrower_id (FK) | B-tree |
| credit_inquiries | id (PK), borrower_id (FK), inquired_by (FK) | B-tree |
| audit_logs | id (PK), user_id (FK) | B-tree |
| pending_approvals | id (PK), requested_by (FK), reviewed_by (FK) | B-tree |
| disputes | id (PK), borrower_id (FK), credit_account_id (FK), filed_by (FK) | B-tree |
| notifications | id (PK), user_id (FK) | B-tree |
| court_judgments | id (PK), borrower_id (FK) | B-tree |
| consent_records | id (PK), borrower_id (FK) | B-tree |
| payment_history | id (PK), credit_account_id (FK) | B-tree |
| institutions | id (PK), approved_by (FK) | B-tree |
| billing_records | id (PK) | B-tree |
| credit_report_logs | id (PK), borrower_id (FK), requested_by (FK), serial_number (UNIQUE) | B-tree |
| api_keys | id (PK), institution_id (FK), created_by (FK) | B-tree |
| exchange_rates | id (PK), created_by (FK) | B-tree |
| retention_policies | id (PK) | B-tree |
| api_configurations | id (PK) | B-tree |
