# Mfumo wa Kituo Kikuu cha Data cha Mamlaka Mbalimbali na Rejista ya Mikopo v1.2 — Nyaraka za Mfumo

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 1.2  
**Tarehe:** Machi 2026  
**Uainishaji:** Siri

---

## Yaliyomo

1. [Muhtasari wa Utendaji](#1-muhtasari-wa-utendaji)
2. [Usanifu wa Mfumo](#2-usanifu-wa-mfumo)
3. [Teknolojia Zinazotumika](#3-teknolojia-zinazotumika)
4. [Muundo wa Data](#4-muundo-wa-data)
5. [Orodha ya API Endpoints](#5-orodha-ya-api-endpoints)
6. [Usanifu wa Usalama](#6-usanifu-wa-usalama)
7. [Usanifu wa Uwekaji](#7-usanifu-wa-uwekaji)
8. [Sehemu za Muunganisho](#8-sehemu-za-muunganisho)
9. [Michoro ya Mtiririko wa Data](#9-michoro-ya-mtiririko-wa-data)
10. [Ushughulikiaji wa Makosa](#10-ushughulikiaji-wa-makosa)
11. [Utendaji](#11-utendaji)
12. [Ufuatiliaji na Urekodi](#12-ufuatiliaji-na-urekodi)

---

## 1. Muhtasari wa Utendaji

### 1.1 Madhumuni ya Mfumo

Mfumo wa Kituo Kikuu cha Data cha Mamlaka Mbalimbali na Rejista ya Mikopo ni jukwaa la mtandao lililotengenezwa na Systems In Motion Limited kwa ajili ya kusimamia taarifa za mikopo, rekodi za wakopaji, na tathmini ya hatari za mikopo katika benki za biashara, taasisi za fedha ndogo ndogo, na watoa huduma wengine wa fedha. Mfumo huu unawezesha ukusanyaji, ushirikiano, na utoaji taarifa za mikopo kwa njia ya kati ili kusaidia maamuzi bora ya ukopeshaji na usimamizi wa udhibiti.

### 1.2 Mamlaka Zinazoshughulikiwa

Mfumo huu umebuniwa kwa uwekaji katika nchi zote za Afrika, ukishughulikia nchi 54 za Afrika, zilizopangwa katika kambi tano za kiuchumi za kikanda:

- **ECOWAS (Jumuiya ya Kiuchumi ya Nchi za Afrika Magharibi)** — Ghana, Nigeria, Senegal, Côte d'Ivoire, Sierra Leone, Liberia, Guinea, Mali, Burkina Faso, Niger, Togo, Benin, The Gambia, Guinea-Bissau, Cape Verde
- **EAC (Jumuiya ya Afrika Mashariki)** — Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Jamhuri ya Kidemokrasia ya Kongo
- **SADC (Jumuiya ya Maendeleo ya Kusini mwa Afrika)** — Afrika Kusini, Msumbiji, Zambia, Zimbabwe, Botswana, Namibia, Angola, Malawi, Madagaska, Mauritius, Eswatini, Lesotho, Shelisheli, Komoro
- **CEMAC (Jumuiya ya Kiuchumi na Fedha ya Afrika ya Kati)** — Kameruni, Gabon, Chad, Jamhuri ya Afrika ya Kati, Jamhuri ya Kongo, Guinea ya Ikweta
- **AMU (Umoja wa Maghreb ya Kiarabu)** — Moroko, Algeria, Tunisia, Libya, Mauritania, Misri, Sudan, Eritrea, Ethiopia, Djibouti, Somalia

### 1.3 Uwezo Muhimu

- **Usimamizi wa Wakopaji** — Usajili wa wakopaji binafsi na wa kampuni wenye ugunduzi wa PEP, ufuatiliaji wa elimu/ajira, na uhusiano wa wahusika (aina 7 ikiwa ni pamoja na beneficial_owner)
- **Usimamizi wa Akaunti za Mikopo** — Ufuatiliaji wa mikopo ya sarafu nyingi ukijumuisha mikopo isiyo na riba, vipindi vya neema, urekebishaji, na usimamizi wa madeni yaliyoondolewa
- **Ukadiriaji wa Mikopo** — Ukadiriaji wa algoriti (kiwango cha 300–850) na misimbo ya sababu
- **Utoaji Taarifa za Mikopo** — Ripoti kamili za mikopo zinazoweza kuchapishwa zenye nambari za serial, historia ya malipo, hukumu za mahakama, na rekodi za idhini
- **Mtiririko wa Maker-Checker** — Kanuni ya macho manne kwa idhini ya mabadiliko ya data na kuzuia kujikubalia mwenyewe
- **Usimamizi wa Migogoro** — Utatuzi wa migogoro unaofuatiliwa na SLA (siku 2 za kifedha, siku 5 zisizo za kifedha)
- **Hukumu za Mahakama** — Ufuatiliaji wa dhamana, ufilisi, kesi, na hukumu za kiraia/jinai
- **Usimamizi wa Idhini** — Idhini ya wahusika wa data zenye nambari za risiti na ubatilishaji
- **Usimamizi wa Taasisi** — Usajili wa watoa data wenye mtiririko wa idhini
- **Malipo** — Usimamizi wa ankara na ufuatiliaji wa ada kwa watoa data
- **Upakiaji wa Makundi** — Uingizaji wa data kwa wingi kwa JSON/CSV wenye uthibitishaji kwa kila rekodi
- **API ya Nje ya REST** — Ufikio wa programu kwa taasisi kwa kutumia uthibitishaji wa ufunguo wa API
- **Uchambuzi wa Udhibiti** — Uwiano wa NPL, mgawanyo wa kwingineko, ufuatiliaji wa ukiukaji wa SLA, usafirishaji wa CSV
- **Utafsiri** — Msaada kamili wa lugha za Kiingereza, Kifaransa, na Kireno
- **Sarafu Nyingi** — Sarafu 42+ za Afrika pamoja na USD, EUR, GBP zinazosaidiwa
- **Usimamizi wa Viwango vya Ubadilishaji** — Sarafu 42+ zenye upatikanaji wa viwango vya moja kwa moja kupitia open.er-api.com, ubadilishaji wa viwango vya msalaba kupitia njia ya USD, operesheni za CRUD za msimamizi, na kifaa cha kubadilisha sarafu
- **Usimamizi wa API** — Usimamizi wa usanidi wa API ya nje kwa njia kuu na upimaji wa muunganisho, mipangilio ya kila nchi, na ulinzi wa SSRF
- **Sera za Uhifadhi wa Data** — Vipindi vya uhifadhi mahususi kwa mamlaka zenye ratiba ya utekelezaji otomatiki (muda wa saa 24) na uanzishaji wa mkono
- **Utafutaji wa Jumla** — Utafutaji wa taasisi mbalimbali katika wakopaji, taasisi, na akaunti za mikopo kwa wakati mmoja kupitia `/api/global-search` na uchujaji wa nchi
- **Picha za Kitambulisho na Hati** — Picha za DiceBear zinazozalishwa kiotomatiki kwa wasifu wa wakopaji, upakiaji wa picha na hati za kitambulisho kwa multer zenye uhudumu unaolindwa na uthibitishaji kutoka `/uploads`
- **Mazingira ya Maonyesho** — Maonyesho ya mwekezaji ya kubonyeza mara moja yenye kadi tatu za wajibu (Msimamizi, Mdhibiti, Afisa wa Benki), bango la DEMO ENVIRONMENT la rangi ya kaharabu, na taarifa ya kanusho la data ya kubuni
- **Rekodi ya Ukaguzi** — Urekodi kamili wa shughuli na ufuatiliaji wa IP na mnyororo wa hash ya SHA-256 isiyoweza kubadilishwa
- **Uthibitishaji wa Hatua Nyingi** — MFA inayotegemea TOTP kupitia maktaba ya otpauth
- **Ulinganishaji wa Taasisi kwa Ukaribu** — Mfanano wa trigram wa PostgreSQL pg_trgm kwa ugunduzi wa wakopaji wanaojirudia
- **Chatbot ya Migogoro** — Msaidizi wa mazungumzo wa hatua nyingi kwa uwasilishaji wa migogoro
- **OAuth 2.1** — Uthibitishaji wa Bearer token (ruhusa ya client_credentials) kwa API ya nje
- **Uboreshaji wa Bandwidth Ndogo** — Ukandamizaji wa gzip na mgawanyo wa msimbo wa React.lazy
- **Upakiaji wa XBRL** — Msaada wa muundo wa faili ya XBRL/XML kwa upakiaji wa data kwa makundi

---

## 2. Usanifu wa Mfumo

### 2.1 Usanifu wa Kiwango cha Juu

Mfumo unafuata usanifu wa kisasa wa monolithic wa full-stack wenye mgawanyo wazi kati ya tabaka za frontend (SPA), backend (REST API), na hifadhidata. Vipengele vyote vinawekwa kama kitengo kimoja cha programu.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│  ┌───────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │  wouter   │  │ TanStack │  │  react-i18next │   │   │
│  │  │ (routing) │  │  Query   │  │   (EN / FR / PT) │   │   │
│  │  └──────────┘  └──────────┘  └───────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │        shadcn/ui + Tailwind CSS              │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                  Express.js Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Session Auth │  │   Internal   │  │  External    │   │
│  │  (memorystore)│  │   API Routes │  │  API (v1)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Zod        │  │   RBAC       │  │  Audit       │   │
│  │  Validation  │  │  Middleware   │  │  Logging     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Storage Interface (IStorage)            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL (pg driver)
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL Database (Neon)                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Drizzle ORM (21 tables)               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Usanifu wa Frontend

- **Mfumo:** React na TypeScript
- **Zana ya Kujenga:** Vite na HMR (Hot Module Replacement) katika maendeleo
- **Mitindo:** Tailwind CSS na maktaba ya vipengele vya shadcn/ui
- **Urambazaji:** wouter — urambazaji nyepesi wa upande wa mteja
- **Usimamizi wa Hali:** TanStack Query v5 kwa usimamizi wa hali ya seva na caching na kubatilisha
- **Utafsiri:** react-i18next na i18next-browser-languagedetector kwa EN/FR/PT
- **Mandhari:** Hali ya giza/nuru na mali maalum za CSS na ubadilishaji wa darasa la Tailwind
- **Fonti:** Inter (Google Fonts)
- **Mfumo wa Muundo:** Rangi ya teal ya joto + lafudhi ya dhahabu (inayolingana kitamaduni katika uwekaji wa nchi 54 za Afrika)

### 2.3 Usanifu wa Backend

- **Mazingira ya Uendeshaji:** Node.js na TypeScript
- **Mfumo:** Express.js REST API server
- **Uthibitishaji:** Uthibitishaji unaotegemea kikao na express-session na memorystore
- **Uhashishaji wa Nenosiri:** bcryptjs na mizunguko 10 ya chumvi
- **Uthibitishaji:** Mipango ya Zod inayotokana na ufafanuzi wa jedwali la Drizzle kupitia drizzle-zod
- **Muundo wa Uhifadhi:** Tabaka la uhifadhi linalotegemea interface (`IStorage`) na utekelezaji wa `DatabaseStorage`

### 2.4 Usanifu wa Hifadhidata

- **Injini:** PostgreSQL (inahifadhiwa kwenye Neon)
- **ORM:** Drizzle ORM na drizzle-zod kwa uzalishaji wa mpango-hadi-uthibitishaji
- **Dereva:** pg (node-postgres) na pooling ya muunganisho
- **Usimamizi wa Schema:** drizzle-kit kwa kusukuma schema (maendeleo), SQL ya moja kwa moja kwa uhamisho wa uzalishaji
- **Pool ya Muunganisho:** Imepunguzwa hadi muunganisho 2 kwa ufanisi wa rasilimali, muda wa kutokuwa na kazi wa sekunde 30

### 2.5 Usanifu wa Uthibitishaji

- **Njia:** Uhashishaji wa nenosiri wa bcryptjs na mizunguko 10 ya chumvi
- **Hifadhi ya Kikao:** memorystore (si PostgreSQL) kupunguza shinikizo la kumbukumbu
- **Usanidi wa Kikao:**
  - Muda wa juu wa kikao wa saa 8 (maxAge ya kuki)
  - Muda wa kutokuwa na kazi wa dakika 15 na uharibifu otomatiki wa kikao (NFR-SEC-09)
  - Kuki za HTTP-only, SameSite=Lax
- **Kufungwa:** Majaribio 3 ya kuingia yaliyoshindwa husababisha kufungwa kwa akaunti kwa dakika 15

### 2.6 Utafsiri

- **Maktaba:** react-i18next + i18next-browser-languagedetector
- **Lugha:** Kiingereza (en), Kifaransa (fr), Kireno (pt)
- **Chanzo cha Tafsiri:** Rasilimali za JSON za ndani katika `client/src/lib/i18n.ts`
- **Ugunduzi:** Ugunduzi otomatiki wa lugha ya kivinjari na uhifadhi wa localStorage; kibadilishaji cha mkono kinapatikana kwenye ukurasa wa kuingia na kichwa cha kuu

### 2.7 Urambazaji

- **Upande wa Mteja:** wouter — router nyepesi ya React na `<Switch>`, `<Route>`, `<Link>`, na hook ya `useLocation`
- **Upande wa Seva:** Express.js router na mnyororo wa middleware (uthibitishaji wa kikao, RBAC, uthibitishaji)

---

## 3. Teknolojia Zinazotumika

| Tabaka | Teknolojia | Toleo | Madhumuni |
|--------|-----------|---------|---------|
| **Mfumo wa Frontend** | React | 18.x | Mfumo wa vipengele vya UI |
| **Lugha** | TypeScript | 5.x | JavaScript yenye usalama wa aina |
| **Zana ya Kujenga** | Vite | 5.x | Kujenga frontend na seva ya maendeleo ya HMR |
| **Mfumo wa CSS** | Tailwind CSS | 3.x | CSS ya matumizi ya kwanza |
| **Maktaba ya Vipengele** | shadcn/ui | Hivi karibuni | Vipengele vya UI vilivyojengwa tayari |
| **Urambazaji wa Mteja** | wouter | 3.x | Router nyepesi ya React |
| **Hali ya Seva** | TanStack Query | 5.x | Upataji wa data, caching, usawazishaji |
| **Fomu** | react-hook-form | 7.x | Usimamizi wa hali ya fomu |
| **Uthibitishaji wa Fomu** | @hookform/resolvers/zod | Hivi karibuni | Uthibitishaji wa fomu unaotegemea Zod |
| **Ikoni** | lucide-react | Hivi karibuni | Maktaba ya ikoni |
| **Utafsiri** | react-i18next | Hivi karibuni | Utafsiri wa kimataifa |
| **Mfumo wa Seva** | Express.js | 4.x | Seva ya HTTP na urambazaji wa API |
| **Hifadhidata** | PostgreSQL | 16.x | Hifadhidata ya uhusiano (inahifadhiwa kwenye Neon) |
| **ORM** | Drizzle ORM | Hivi karibuni | Kijenzi cha maswali ya SQL chenye usalama wa aina |
| **Uthibitishaji wa Schema** | Zod + drizzle-zod | Hivi karibuni | Uthibitishaji wa wakati wa uendeshaji kutoka kwenye schema ya DB |
| **Uhashishaji wa Nenosiri** | bcryptjs | 2.x | Uhashishaji salama wa nenosiri |
| **Usimamizi wa Kikao** | express-session | 1.x | Ushughulikiaji wa kikao upande wa seva |
| **Hifadhi ya Kikao** | memorystore | 1.x | Uhifadhi wa kikao kwenye kumbukumbu |
| **Dereva wa DB** | pg (node-postgres) | 8.x | Dereva wa mteja wa PostgreSQL |
| **Bundler ya Seva** | esbuild | Hivi karibuni | Bundling ya TypeScript upande wa seva |
| **Zana ya Schema** | drizzle-kit | Hivi karibuni | Usimamizi wa schema ya hifadhidata |
| **Upakiaji wa Faili** | multer | 1.x | Ushughulikiaji wa upakiaji wa faili za multipart form-data |

---

## 4. Muundo wa Data

Mfumo unatumia jedwali 21 za PostgreSQL na Drizzle ORM kwa ufikio wenye usalama wa aina. Funguo zote za msingi ni mifuatano ya UUID v4 inayozalishwa kupitia `gen_random_uuid()`.

### 4.1 Jedwali: `users`

Watumiaji wa mfumo wenye udhibiti wa ufikio unaotegemea wajibu, ufuatiliaji wa kuingia, na utekelezaji wa sera ya nenosiri.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha mtumiaji |
| `username` | text | NOT NULL, UNIQUE | Jina la kuingia la mtumiaji |
| `password` | text | NOT NULL | Nenosiri lililopitishwa kwenye bcrypt |
| `full_name` | text | NOT NULL | Jina la kuonyesha |
| `email` | text | NOT NULL | Anwani ya barua pepe |
| `role` | enum `user_role` | NOT NULL, default `'viewer'` | Mojawapo ya: `admin`, `regulator`, `lender`, `viewer` |
| `status` | enum `user_status` | NOT NULL, default `'active'` | Mojawapo ya: `active`, `suspended`, `deactivated` |
| `institution` | text | inaweza kuwa tupu | Jina la taasisi inayohusiana |
| `failed_login_attempts` | integer | default `0` | Idadi ya majaribio ya kuingia yaliyoshindwa mfululizo |
| `locked_until` | timestamp | inaweza kuwa tupu | Muda wa kumalizika kwa kufungwa kwa akaunti |
| `last_login` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa kuingia kwa mafanikio kwa mara ya mwisho |
| `password_changed_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa mabadiliko ya mwisho ya nenosiri (kumalizika kwa siku 90) |
| `must_change_password` | boolean | default `false` | Lazimisha mabadiliko ya nenosiri wakati wa kuingia ijayo |
| `mfa_secret` | varchar | inaweza kuwa tupu | Siri ya TOTP MFA (iliyosanidiwa kwa base32) kwa programu ya uthibitishaji (ENT-01) |
| `mfa_enabled` | boolean | default `false` | Iwapo TOTP MFA imewezeshwa kwa mtumiaji (ENT-01) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.2 Jedwali: `borrowers`

Rekodi za wakopaji binafsi na wa kampuni zenye data ya kitambulisho, demografia, na ajira.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha mkopaji |
| `type` | enum `borrower_type` | NOT NULL | Mojawapo ya: `individual`, `corporate` |
| `first_name` | text | inaweza kuwa tupu | Jina la kwanza la mtu binafsi |
| `last_name` | text | inaweza kuwa tupu | Jina la mwisho la mtu binafsi |
| `company_name` | text | inaweza kuwa tupu | Jina la taasisi ya kampuni |
| `national_id` | text | NOT NULL, UNIQUE | Nambari ya kitambulisho cha taifa |
| `tin_number` | text | inaweza kuwa tupu | Nambari ya Utambulisho wa Kodi |
| `date_of_birth` | text | inaweza kuwa tupu | Tarehe ya kuzaliwa (mfuatano wa ISO) |
| `gender` | text | inaweza kuwa tupu | Jinsia |
| `phone` | text | inaweza kuwa tupu | Nambari ya simu |
| `email` | text | inaweza kuwa tupu | Anwani ya barua pepe |
| `address` | text | inaweza kuwa tupu | Anwani ya makazi |
| `city` | text | inaweza kuwa tupu | Jiji |
| `region` | text | inaweza kuwa tupu | Mkoa/jimbo |
| `employer_name` | text | inaweza kuwa tupu | Mwajiri wa sasa |
| `occupation` | text | inaweza kuwa tupu | Kazi/cheo cha kazi |
| `business_reg_number` | text | inaweza kuwa tupu | Nambari ya usajili wa biashara (kampuni) |
| `sector` | text | inaweza kuwa tupu | Sekta ya viwanda |
| `is_pep` | boolean | default `false` | Bendera ya Mtu Aliyeonyeshwa Kisiasa |
| `pep_details` | text | inaweza kuwa tupu | Maelezo/ufafanuzi wa PEP |
| `related_borrower_id` | varchar | inaweza kuwa tupu | FK kwa `borrowers.id` (mhusika anayehusiana) |
| `relationship_type` | text | inaweza kuwa tupu | Aina ya uhusiano (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company) |
| `education_level` | text | inaweza kuwa tupu | Kiwango cha juu cha elimu |
| `education_institution` | text | inaweza kuwa tupu | Taasisi ya elimu |
| `employment_history` | text | inaweza kuwa tupu | Historia ya ajira (JSON au maandishi) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |

### 4.3 Jedwali: `credit_accounts`

Rekodi za mikopo na huduma za mikopo zenye msaada wa sarafu nyingi na vipengele maalum vya mikopo.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha akaunti |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji anayehusiana |
| `lender_institution` | text | NOT NULL | Jina la taasisi ya ukopeshaji |
| `account_number` | text | NOT NULL | Nambari ya akaunti/mkopo |
| `account_type` | text | NOT NULL | Aina ya mkopo (term_loan, overdraft, mortgage, n.k.) |
| `original_amount` | decimal(15,2) | NOT NULL | Kiasi cha awali cha mkopo |
| `current_balance` | decimal(15,2) | NOT NULL | Salio la sasa linalobaki |
| `currency` | text | NOT NULL, default `'ETB'` | Msimbo wa sarafu (sarafu 42+ za Afrika pamoja na USD, EUR, GBP) |
| `interest_rate` | decimal(5,2) | inaweza kuwa tupu | Kiwango cha riba cha mwaka |
| `disbursement_date` | text | inaweza kuwa tupu | Tarehe ya utoaji wa mkopo |
| `maturity_date` | text | inaweza kuwa tupu | Tarehe ya ukomavu wa mkopo |
| `status` | enum `account_status` | NOT NULL, default `'current'` | Mojawapo ya: `current`, `delinquent`, `default`, `closed`, `restructured`, `written_off` |
| `days_in_arrears` | integer | default `0` | Siku zilizopita tarehe ya malipo |
| `collateral_type` | text | inaweza kuwa tupu | Ufafanuzi wa aina ya dhamana |
| `collateral_value` | decimal(15,2) | inaweza kuwa tupu | Thamani ya dhamana |
| `last_payment_date` | text | inaweza kuwa tupu | Tarehe ya malipo ya mwisho |
| `last_payment_amount` | decimal(15,2) | inaweza kuwa tupu | Kiasi cha malipo ya mwisho |
| `is_interest_free` | boolean | default `false` | Bendera ya mkopo usiokuwa na riba (Kiislamu/Sharia) (FR-SPEC-03) |
| `grace_period_months` | integer | inaweza kuwa tupu | Kipindi cha neema kwa miezi (FR-SPEC-04) |
| `restructure_count` | integer | default `0` | Idadi ya urekebishaji (FR-SPEC-05) |
| `written_off_date` | text | inaweza kuwa tupu | Tarehe akaunti ilipoondolewa |
| `reinstated_date` | text | inaweza kuwa tupu | Tarehe akaunti iliporejeshwa |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |

### 4.4 Jedwali: `credit_inquiries`

Rekodi za utafutaji na uchunguzi wa mikopo zenye ufuatiliaji wa idhini.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha uchunguzi |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji aliyechunguzwa |
| `inquired_by` | varchar | NOT NULL, FK → `users.id` | Mtumiaji aliyefanya uchunguzi |
| `purpose` | enum `inquiry_purpose` | NOT NULL | Mojawapo ya: `new_credit`, `review`, `collection`, `regulatory`, `portfolio_monitoring` |
| `institution` | text | NOT NULL | Jina la taasisi inayochunguza |
| `consent_provided` | boolean | NOT NULL, default `false` | Iwapo idhini ya mkopaji ilipatikana |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa uchunguzi |

### 4.5 Jedwali: `audit_logs`

Urekodi wa shughuli usiobadilika na ufuatiliaji wa anwani ya IP kwa usalama na utiifu.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha ingizo la logi |
| `user_id` | varchar | inaweza kuwa tupu, FK → `users.id` | Mtumiaji aliyefanya kitendo |
| `action` | text | NOT NULL | Aina ya kitendo (LOGIN, CREATE, UPDATE, APPROVE, n.k.) |
| `entity` | text | NOT NULL | Aina ya taasisi iliyoathiriwa (user, borrower, credit_account, n.k.) |
| `entity_id` | varchar | inaweza kuwa tupu | Kitambulisho mahususi cha taasisi |
| `details` | text | inaweza kuwa tupu | Maelezo yanayoweza kusomwa na binadamu |
| `ip_address` | text | inaweza kuwa tupu | Anwani ya IP ya mteja |
| `previous_hash` | text | inaweza kuwa tupu | Hash ya SHA-256 ya ingizo la awali katika mnyororo wa hash; `"genesis"` kwa ingizo la kwanza (ENT-07) |
| `current_hash` | text | inaweza kuwa tupu | Hash ya SHA-256 ya ingizo hili iliyohesabiwa kutoka previousHash + action + entity + details + timestamp (ENT-07) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa ingizo la logi |

### 4.6 Jedwali: `pending_approvals`

Rekodi za mtiririko wa maker-checker kwa idhini ya mabadiliko ya data.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha idhini |
| `entity_type` | text | NOT NULL | Aina ya taasisi (borrower, credit_account) |
| `entity_id` | varchar | inaweza kuwa tupu | Kitambulisho cha taasisi iliyopo (kwa masasisho) |
| `action` | text | NOT NULL | Aina ya kitendo (CREATE, UPDATE) |
| `payload` | text | NOT NULL | Data ya mabadiliko iliyosanidiwa kwa JSON |
| `requested_by` | varchar | NOT NULL, FK → `users.id` | Mtumiaji aliyewasilisha mabadiliko |
| `reviewed_by` | varchar | inaweza kuwa tupu, FK → `users.id` | Mtumiaji aliyekagua mabadiliko |
| `status` | enum `approval_status` | NOT NULL, default `'pending'` | Mojawapo ya: `pending`, `approved`, `rejected` |
| `review_notes` | text | inaweza kuwa tupu | Maoni ya mkaguzi |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa uwasilishaji |
| `reviewed_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa ukaguzi |

### 4.7 Jedwali: `disputes`

Usimamizi wa migogoro/malalamiko na ufuatiliaji wa tarehe ya mwisho ya SLA.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha mgogoro |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji aliyeathiriwa |
| `credit_account_id` | varchar | inaweza kuwa tupu, FK → `credit_accounts.id` | Akaunti ya mikopo inayohusiana |
| `filed_by` | varchar | NOT NULL, FK → `users.id` | Mtumiaji aliyewasilisha mgogoro |
| `dispute_type` | text | NOT NULL | Aina ya mgogoro |
| `description` | text | NOT NULL | Maelezo ya mgogoro |
| `status` | enum `dispute_status` | NOT NULL, default `'open'` | Mojawapo ya: `open`, `under_review`, `resolved`, `rejected` |
| `resolution` | text | inaweza kuwa tupu | Maelezo ya utatuzi |
| `correction_type` | text | inaweza kuwa tupu | Mojawapo ya: `financial`, `non_financial` |
| `sla_deadline` | timestamp | inaweza kuwa tupu | Tarehe ya mwisho ya SLA (siku 2 za kifedha, siku 5 zisizo za kifedha) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa uwasilishaji |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |
| `resolved_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa utatuzi |

### 4.8 Jedwali: `notifications`

Mfumo wa arifa ndani ya programu kwa idhini, migogoro, na tahadhari za mfumo.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha arifa |
| `user_id` | varchar | inaweza kuwa tupu, FK → `users.id` | Mtumiaji lengwa (tupu = utangazaji) |
| `type` | text | NOT NULL | Aina ya arifa (approval_pending, approval_result, dispute_update, system) |
| `title` | text | NOT NULL | Kichwa cha arifa |
| `message` | text | NOT NULL | Ujumbe wa arifa |
| `is_read` | boolean | default `false` | Hali ya kusomwa |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa arifa |

### 4.9 Jedwali: `court_judgments`

Hukumu za mahakama na rekodi za kisheria zinazohusiana na wakopaji.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha hukumu |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji anayehusiana |
| `judgment_type` | text | NOT NULL | Aina ya hukumu (lien, bankruptcy, lawsuit, civil_judgment, criminal_judgment) |
| `case_number` | text | NOT NULL | Nambari ya kesi ya mahakama |
| `court_name` | text | NOT NULL | Jina la mahakama |
| `judgment_date` | text | NOT NULL | Tarehe ya hukumu |
| `amount` | decimal(15,2) | inaweza kuwa tupu | Kiasi cha hukumu |
| `status` | text | NOT NULL | Hali ya hukumu (active, satisfied, vacated, appealed) |
| `description` | text | inaweza kuwa tupu | Maelezo ya hukumu |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.10 Jedwali: `consent_records`

Rekodi za idhini ya wahusika wa data kwa ufuatiliaji wa utiifu.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha idhini |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji aliyetoa idhini |
| `consent_type` | text | NOT NULL | Aina ya idhini (data_sharing, credit_check, marketing) |
| `granted_to` | text | NOT NULL | Taasisi iliyopewa idhini |
| `receipt_number` | text | NOT NULL | Nambari ya risiti ya idhini |
| `status` | text | NOT NULL, default `'active'` | Hali ya idhini (active, revoked) |
| `granted_at` | timestamp | default `now()` | Mhuri wa muda wa utoaji idhini |
| `revoked_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa ubatilishaji |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.11 Jedwali: `payment_history`

Rekodi za malipo ya kila mwezi kwa akaunti za mikopo.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha malipo |
| `credit_account_id` | varchar | NOT NULL, FK → `credit_accounts.id` | Akaunti ya mikopo inayohusiana |
| `payment_date` | text | NOT NULL | Tarehe ya malipo |
| `amount_due` | decimal(15,2) | NOT NULL | Kiasi kinachostahili kulipwa |
| `amount_paid` | decimal(15,2) | NOT NULL | Kiasi kilicholipwa |
| `days_late` | integer | default `0` | Siku za kuchelewa |
| `status` | text | NOT NULL | Hali ya malipo (on_time, late, missed, partial) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.12 Jedwali: `institutions`

Rekodi za taasisi za watoa data (benki, taasisi za fedha ndogo ndogo, n.k.).

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha taasisi |
| `name` | text | NOT NULL | Jina la taasisi |
| `type` | text | NOT NULL | Aina ya taasisi (commercial_bank, microfinance, cooperative, n.k.) |
| `country` | text | NOT NULL | Nchi ya operesheni |
| `license_number` | text | inaweza kuwa tupu | Nambari ya leseni ya udhibiti |
| `contact_person` | text | inaweza kuwa tupu | Jina la mtu wa kuwasiliana |
| `contact_email` | text | inaweza kuwa tupu | Barua pepe ya mawasiliano |
| `contact_phone` | text | inaweza kuwa tupu | Nambari ya simu ya mawasiliano |
| `status` | text | NOT NULL, default `'pending'` | Hali ya taasisi (pending, approved, suspended) |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.13 Jedwali: `billing_records`

Rekodi za ankara na ada kwa watoa data.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha ankara |
| `institution_id` | varchar | NOT NULL, FK → `institutions.id` | Taasisi inayotozwa |
| `period` | text | NOT NULL | Kipindi cha malipo (mwezi/mwaka) |
| `amount` | decimal(15,2) | NOT NULL | Kiasi cha ankara |
| `currency` | text | NOT NULL, default `'USD'` | Sarafu ya ankara |
| `status` | text | NOT NULL, default `'pending'` | Hali ya malipo (pending, paid, overdue) |
| `description` | text | inaweza kuwa tupu | Maelezo ya ankara |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.14 Jedwali: `credit_report_logs`

Logi za kizazi cha ripoti za mikopo kwa ukaguzi na ufuatiliaji.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha logi |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | Mkopaji aliyetengenezewa ripoti |
| `generated_by` | varchar | NOT NULL, FK → `users.id` | Mtumiaji aliyetengeneza ripoti |
| `serial_number` | text | NOT NULL | Nambari ya serial ya ripoti (CR-{MWAKA}-{base36}) |
| `purpose` | text | NOT NULL | Madhumuni ya ripoti |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kizazi |

### 4.15 Jedwali: `api_keys`

Funguo za API kwa uthibitishaji wa API ya nje.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee cha ufunguo wa API |
| `institution_id` | varchar | NOT NULL, FK → `institutions.id` | Taasisi inayomiliki ufunguo |
| `key_hash` | text | NOT NULL | Hash ya SHA-256 ya ufunguo wa API |
| `key_prefix` | text | NOT NULL | Sehemu ya mwanzo ya ufunguo kwa utambulisho (sim_xxxx) |
| `permission` | text | NOT NULL | Kiwango cha ruhusa (submit, read, full) |
| `status` | text | NOT NULL, default `'active'` | Hali ya ufunguo (active, revoked) |
| `last_used_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa matumizi ya mwisho |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa |

### 4.16 Jedwali: `exchange_rates`

Viwango vya ubadilishaji wa sarafu kwa usaidizi wa sarafu nyingi.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee |
| `base_currency` | text | NOT NULL | Msimbo wa sarafu ya msingi |
| `target_currency` | text | NOT NULL | Msimbo wa sarafu lengwa |
| `rate` | decimal(20,10) | NOT NULL | Kiwango cha ubadilishaji |
| `source` | text | NOT NULL | Chanzo cha kiwango (manual, api) |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa kwa rekodi |

### 4.17 Jedwali: `retention_policies`

Sera za uhifadhi wa data mahususi kwa mamlaka.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee |
| `country` | text | NOT NULL | Msimbo wa nchi |
| `entity_type` | text | NOT NULL | Aina ya taasisi (borrower, credit_account, dispute, n.k.) |
| `retention_years` | integer | NOT NULL | Kipindi cha uhifadhi kwa miaka |
| `legal_basis` | text | inaweza kuwa tupu | Msingi wa kisheria wa sera |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |

### 4.18 Jedwali: `api_configurations`

Usanidi wa API ya nje kwa usimamizi wa kati.

| Safu | Aina | Vikwazo | Maelezo |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default `gen_random_uuid()` | Kitambulisho cha kipekee |
| `name` | text | NOT NULL | Jina la usanidi wa API |
| `base_url` | text | NOT NULL | URL ya msingi ya API |
| `auth_type` | text | NOT NULL | Aina ya uthibitishaji (none, api_key, bearer, basic) |
| `auth_credentials` | text | inaweza kuwa tupu | Stakabadhi za uthibitishaji (zilizofichwa) |
| `country` | text | inaweza kuwa tupu | Msimbo wa nchi (kwa mipangilio mahususi ya nchi) |
| `is_active` | boolean | default `true` | Iwapo usanidi umewezeshwa |
| `last_tested_at` | timestamp | inaweza kuwa tupu | Mhuri wa muda wa upimaji wa mwisho |
| `created_at` | timestamp | default `now()` | Mhuri wa muda wa kuundwa |
| `updated_at` | timestamp | default `now()` | Mhuri wa muda wa kusasishwa kwa mara ya mwisho |

---

## 5. Orodha ya API Endpoints

### 5.1 Uthibitishaji

| Njia | Njia ya URL | Maelezo | Mwili wa Ombi | Jibu |
|--------|------|-------------|-------------|----------|
| POST | `/api/auth/login` | Ingia kwenye mfumo | `{ username, password }` | Kitu cha mtumiaji + bendera ya kumalizika kwa nenosiri |
| POST | `/api/auth/logout` | Ondoka kwenye mfumo | Hakuna | Ujumbe wa mafanikio |
| GET | `/api/auth/me` | Pata mtumiaji wa sasa | Hakuna | Kitu cha mtumiaji au 401 |
| POST | `/api/auth/change-password` | Badilisha nenosiri | `{ currentPassword, newPassword }` | Ujumbe wa mafanikio |
| POST | `/api/auth/mfa/setup` | Sanidi TOTP MFA | Hakuna | `{ secret, uri }` |
| POST | `/api/auth/mfa/verify` | Thibitisha na wezesha MFA | `{ token }` | Ujumbe wa mafanikio |
| POST | `/api/auth/mfa/disable` | Zima MFA | `{ token }` | Ujumbe wa mafanikio |
| POST | `/api/auth/mfa/login` | Kamisha kuingia na MFA | `{ token }` | Kitu cha mtumiaji |

### 5.2 Wakopaji

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/borrowers?page=1&limit=50` | Orodhesha wakopaji (wenye kupiga ukurasa) |
| GET | `/api/borrowers/:id` | Pata mkopaji mmoja |
| POST | `/api/borrowers` | Unda mkopaji (huenda kwenye idhini) |
| PUT | `/api/borrowers/:id` | Sasisha mkopaji (huenda kwenye idhini) |
| GET | `/api/borrowers/search?q=term` | Tafuta wakopaji |
| GET | `/api/borrowers/:id/related` | Pata wakopaji wanaohusiana |
| GET | `/api/borrowers/:id/photo` | Pata picha ya mkopaji |
| POST | `/api/borrowers/:id/photo` | Pakia picha ya mkopaji |
| POST | `/api/borrowers/:id/id-document` | Pakia hati ya kitambulisho |

### 5.3 Akaunti za Mikopo

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/credit-accounts` | Orodhesha akaunti za mikopo |
| GET | `/api/credit-accounts/:id` | Pata akaunti moja |
| POST | `/api/credit-accounts` | Unda akaunti ya mikopo |
| PUT | `/api/credit-accounts/:id` | Sasisha akaunti ya mikopo |
| GET | `/api/credit-accounts/:id/payment-history` | Pata historia ya malipo |
| POST | `/api/credit-accounts/:id/payment-history` | Ongeza ingizo la malipo |

### 5.4 Uchunguzi wa Mikopo

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/credit-inquiries` | Orodhesha uchunguzi |
| POST | `/api/credit-inquiries` | Unda uchunguzi |

### 5.5 Ripoti za Mikopo

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| POST | `/api/credit-reports/generate` | Tengeneza ripoti ya mikopo |
| GET | `/api/credit-report-logs` | Orodhesha logi za ripoti |

### 5.6 Idhini Zinazosubiri

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/pending-approvals` | Orodhesha idhini zinazosubiri |
| PATCH | `/api/pending-approvals/:id` | Kubali/kataa idhini |

### 5.7 Migogoro

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/disputes` | Orodhesha migogoro |
| POST | `/api/disputes` | Wasilisha mgogoro |
| PATCH | `/api/disputes/:id` | Sasisha hali ya mgogoro |

### 5.8 Hukumu za Mahakama

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/court-judgments` | Orodhesha hukumu |
| POST | `/api/court-judgments` | Unda hukumu |

### 5.9 Rekodi za Idhini

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/consent-records` | Orodhesha idhini |
| POST | `/api/consent-records` | Unda idhini |
| PATCH | `/api/consent-records/:id/revoke` | Batilisha idhini |

### 5.10 Arifa

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/notifications` | Pata arifa za mtumiaji |
| PATCH | `/api/notifications/:id/read` | Tia alama ya kusomwa |

### 5.11 Watumiaji (Msimamizi)

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/users` | Orodhesha watumiaji wote |
| POST | `/api/users` | Unda mtumiaji |
| PATCH | `/api/users/:id` | Sasisha mtumiaji |

### 5.12 Taasisi

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/institutions?page=1&limit=50` | Orodhesha taasisi (wenye kupiga ukurasa) |
| POST | `/api/institutions` | Sajili taasisi |
| PATCH | `/api/institutions/:id` | Sasisha taasisi |

### 5.13 Ankara

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/billing` | Orodhesha rekodi za ankara |
| POST | `/api/billing` | Unda rekodi ya ankara |

### 5.14 Logi za Ukaguzi

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/audit-logs` | Orodhesha logi za ukaguzi |

### 5.15 Ripoti na Uchambuzi

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/reports/dashboard` | Pata takwimu za dashibodi |
| GET | `/api/reports/analytics` | Pata uchambuzi wa udhibiti |
| GET | `/api/reports/export?format=csv&type=portfolio` | Hamisha data ya kwingineko |
| GET | `/api/reports/export?format=csv&type=borrowers` | Hamisha data ya wakopaji |

### 5.16 Upakiaji wa Makundi

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| POST | `/api/batch-upload/credit-accounts` | Pakia akaunti za mikopo kwa wingi |

### 5.17 Funguo za API

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/api-keys` | Orodhesha funguo za API |
| POST | `/api/api-keys` | Tengeneza ufunguo wa API |
| PATCH | `/api/api-keys/:id/revoke` | Batilisha ufunguo wa API |

### 5.18 Viwango vya Ubadilishaji

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/exchange-rates` | Orodhesha viwango vya ubadilishaji |
| POST | `/api/exchange-rates` | Unda/sasisha kiwango |
| POST | `/api/exchange-rates/refresh` | Sasisha viwango kutoka API ya nje |
| POST | `/api/exchange-rates/convert` | Badilisha kiasi kati ya sarafu |

### 5.19 Sera za Uhifadhi

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/retention-policies` | Orodhesha sera za uhifadhi |
| POST | `/api/retention-policies` | Unda sera ya uhifadhi |
| PATCH | `/api/retention-policies/:id` | Sasisha sera ya uhifadhi |
| POST | `/api/retention-policies/enforce` | Anzisha utekelezaji wa sera kwa mkono |

### 5.20 Usanidi wa API

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/api-configurations` | Orodhesha usanidi wa API |
| POST | `/api/api-configurations` | Unda usanidi |
| PATCH | `/api/api-configurations/:id` | Sasisha usanidi |
| POST | `/api/api-configurations/:id/test` | Jaribu muunganisho wa API |

### 5.21 Utafutaji wa Jumla

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/global-search?q=term&country=XX` | Tafuta katika taasisi zote |

### 5.22 Nyaraka

| Njia | Njia ya URL | Maelezo |
|--------|------|-------------|
| GET | `/api/docs` | Orodhesha nyaraka zinazopatikana |
| GET | `/api/docs/:id` | Pata yaliyomo ya hati |
| GET | `/api/docs/:id/pdf` | Pakua hati kama PDF |

---

## 6. Usanifu wa Usalama

### 6.1 Uthibitishaji na Uidhinishaji

- **Uthibitishaji wa Nenosiri:** bcryptjs na mizunguko 10 ya chumvi
- **Usimamizi wa Kikao:** Kuki za HTTP-only, SameSite=Lax, muda wa juu wa saa 8
- **Muda wa Kutokuwa na Kazi:** Dakika 15 na uharibifu otomatiki wa kikao na msimbo wa hali 440
- **Kufungwa kwa Akaunti:** Majaribio 3 ya kuingia yaliyoshindwa → kufungwa kwa dakika 15
- **RBAC:** Wajibu 4 (admin, regulator, lender, viewer) na ruhusa tofauti
- **Sera ya Nenosiri:** Kumalizika kwa siku 90 na onyo

### 6.2 Udhibiti wa Ufikio Unaotegemea Wajibu (RBAC)

| Wajibu | Ruhusa |
|--------|-------------|
| `admin` | Ufikio kamili kwa moduli zote, usimamizi wa watumiaji, usimamizi wa taasisi |
| `regulator` | Taarifa za usomaji peke, uchambuzi wa udhibiti, idhini/kukataa |
| `lender` | Usimamizi wa wakopaji, akaunti za mikopo, uchunguzi wa mikopo, uwasilishaji wa migogoro |
| `viewer` | Ufikio wa kusoma peke, hakuna mabadiliko ya data |

### 6.3 Hatua za Usalama wa API

- **Uthibitishaji wa API ya Nje:** Ufunguo wa API kupitia kichwa cha `X-API-Key` na uhashishaji wa SHA-256
- **Ulinzi wa SSRF:** Uthibitishaji wa URL kwa usanidi wa API ili kuzuia maombi ya upande wa seva yaliyoghushiwa
- **Uthibitishaji wa Ingizo:** Mipango ya Zod kwa mwili wote wa ombi
- **Kiwango cha Kizuizi:** Vikwazo vya kiwango cha API vimewekwa kwenye middleware

### 6.4 Ulinzi wa Data

- **Nenosiri:** Hayahifadhiwe kamwe kwa maandishi wazi; huhashishwa na bcryptjs
- **Funguo za API:** Huhifadhiwa kama hash za SHA-256; ufunguo wa asili unaonyeshwa mara moja tu
- **Siri za MFA:** Zimesanidiwa kwa base32 na huhifadhiwa kwenye jedwali la watumiaji
- **Uhakiki wa Ukaguzi:** Mnyororo wa hash ya SHA-256 unazuia kubadilisha logi za ukaguzi

---

## 7. Usanifu wa Uwekaji

### 7.1 Mazingira

Mfumo umewekwa kama programu moja ya monolithic kwenye Replit:

- **Mazingira ya Maendeleo:** Vite HMR kwa frontend, Express na nodemon kwa backend
- **Mazingira ya Uzalishaji:** Vite build kwa frontend, esbuild kwa bundling ya backend
- **Hifadhidata:** PostgreSQL inayohifadhiwa kwenye Neon na inafikiwa kupitia kigezo cha mazingira cha `DATABASE_URL`

### 7.2 Amri za Kujenga

```bash
# Maendeleo
npm run dev        # Inazindua seva za frontend na backend zenye HMR

# Uzalishaji
npm run build      # Inajenga frontend (Vite) na backend (esbuild)
npm start          # Inaendesha seva ya uzalishaji iliyojengwa
```

### 7.3 Vigezo vya Mazingira

| Kigezo | Maelezo |
|----------|-------------|
| `DATABASE_URL` | Mfuatano wa muunganisho wa PostgreSQL |
| `SESSION_SECRET` | Siri ya express-session (inazalishwa kiotomatiki ikiwa haijawekwa) |

---

## 8. Sehemu za Muunganisho

### 8.1 API ya Nje (v1)

Mfumo unaonyesha API ya REST kwenye `/api/external/v1/*` kwa taasisi kuingiliana na rejista kwa njia ya programu:

**Uthibitishaji:** Ufunguo wa API kupitia kichwa cha HTTP cha `X-API-Key` na uhashishaji wa SHA-256.

**Viwango vya Ruhusa:**
| Kiwango | Uwezo |
|-------|-------------|
| `submit` | Unda wakopaji, akaunti za mikopo, historia ya malipo, hukumu za mahakama |
| `read` | Tafuta wakopaji, pata ripoti za mikopo, angalia akaunti za mikopo |
| `full` | Uwezo wote wa submit + read |

**Uwasilishaji kwa Makundi:** Endpoints zinazokubali data ya POST zinasaidia kitu kimoja na safu za data. Uwasilishaji wa makundi hurudisha matokeo ya kila rekodi na maelezo ya makosa kwa rekodi zilizoshindwa.

**Bahasha ya Jibu:** Majibu yote ya API ya nje yanafuata muundo thabiti wa bahasha wenye sehemu za `success`, `message`, `data`, na `timestamp`.

### 8.2 Upakiaji wa Faili kwa Makundi

Kipengele cha upakiaji wa makundi cha ndani (`POST /api/batch-upload/credit-accounts`) kinakubali safu za JSON za rekodi za akaunti za mikopo:

**Ingizo Linalosaidiwa:**
```json
{
  "records": [
    {
      "borrowerId": "...",
      "lenderInstitution": "...",
      "accountNumber": "...",
      "accountType": "...",
      "originalAmount": "...",
      "currentBalance": "...",
      "currency": "ETB",
      "status": "current"
    }
  ]
}
```

**Uthibitishaji:** Kila rekodi inathibitishwa kwa kujitegemea dhidi ya `insertCreditAccountSchema` (Zod). Rekodi halali zinaingizwa; rekodi zisizo halali zinakusanywa na maelezo ya makosa.

**Jibu:**
```json
{
  "totalSubmitted": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    { "index": 3, "message": "Required field 'accountNumber' missing" }
  ]
}
```

### 8.3 Huduma ya Avatar ya DiceBear

Mfumo unaunganishwa na API ya DiceBear (`https://api.dicebear.com`) kwa picha za wasifu wa wakopaji zinazozalishwa kiotomatiki:

- **Matumizi:** Picha za wasifu za chaguo-msingi kwa wakopaji ambao hawajapakia picha maalum
- **Thamani ya Mbegu:** Kitambulisho cha mkopaji kinatumika kama mbegu ya avatar — hakuna taarifa za kitambulisho binafsi (PII) zinazotumwa
- **Mtindo:** Uzalishaji wa avatar unaotabirika unaohakikisha avatar thabiti kwa mkopaji huyo huyo katika vikao vyote
- **Faragha:** Hakuna uthibitishaji unaohitajika; ni hash/kitambulisho cha mbegu peke yake kinachotumwa kwa huduma

### 8.4 API ya Viwango vya Ubadilishaji

Mfumo unaunganishwa na API ya Open Exchange Rate (`https://open.er-api.com`) kwa upataji wa viwango vya sarafu vya moja kwa moja:

- **Matumizi:** Kupata viwango vya sasa vya ubadilishaji kwa sarafu 42+ za Afrika pamoja na USD, EUR, GBP
- **Uthibitishaji:** Hakuna ufunguo wa API unaohitajika (kiwango cha bure)
- **Endpoint:** `GET https://open.er-api.com/v6/latest/{BASE_CURRENCY}`
- **Usasishaji:** Viwango vinaweza kusasishwa kwa mkono kupitia `POST /api/exchange-rates/refresh` au kupatikana inapohitajika
- **Mbadala:** Uingizaji wa kiwango kwa mkono unasaidiwa wakati API ya nje haipatikani

### 8.5 Usanifu wa Upakiaji wa Faili

Picha za wakopaji na hati za kitambulisho zinahifadhiwa kwenye mfumo wa faili wa ndani:

- **Upakiaji wa picha:** Huhifadhiwa katika `uploads/photos/` (upeo wa MB 5, picha tu)
- **Upakiaji wa hati:** Huhifadhiwa katika `uploads/documents/` (upeo wa MB 10, picha au PDF)
- **Uzalishaji wa jina la faili:** Majina ya faili yaliyochanganywa kwa kutumia mhuri wa muda na mfuatano wa nasibu wa base-36 ili kuzuia migongano na uhesabu
- **Uthibitishaji wa aina ya MIME:** Uthibitishaji upande wa seva kupitia kichungi cha faili cha multer (picha tu kwa picha; picha au PDF kwa hati)
- **Uhudumu:** Faili tuli zinahudumiwa kupitia njia ya `/uploads` iliyothibitishwa na middleware ya `requireAuth`
- **Urekodi wa ukaguzi:** Upakiaji wote unarekodwa katika logi ya ukaguzi na kitambulisho cha mtumiaji aliyepakia na rejeo la mkopaji

### 8.6 Usafirishaji wa CSV

Moduli ya taarifa inasaidia usafirishaji wa CSV kwa data ya kwingineko na wakopaji:

- `GET /api/reports/export?format=csv&type=portfolio` — Data ya kwingineko ya akaunti za mikopo
- `GET /api/reports/export?format=csv&type=borrowers` — Data ya demografia ya wakopaji

Faili zinazalishwa papo hapo na vichwa vya `Content-Type: text/csv` na `Content-Disposition` vinavyofaa.

---

## 9. Michoro ya Mtiririko wa Data

### 9.1 Mtiririko wa Kuingia kwa Mtumiaji

```
Client                          Server                          Database
  │                               │                               │
  │  POST /api/auth/login         │                               │
  │  { username, password }       │                               │
  │──────────────────────────────→│                               │
  │                               │  SELECT * FROM users          │
  │                               │  WHERE username = ?           │
  │                               │──────────────────────────────→│
  │                               │                    user record│
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Kagua: status === 'active'   │
  │                               │  Kagua: haijafungwa           │
  │                               │  bcrypt.compare(password)     │
  │                               │                               │
  │                               │  [Ikiwa halali]:              │
  │                               │  Weka upya majaribio yaliyoshindwa│
  │                               │  Sasisha last_login           │
  │                               │  Weka kikao (userId, role)    │
  │                               │  Unda logi ya ukaguzi (LOGIN) │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { user, passwordExpired }│                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [Ikiwa si halali (jaribio < 3)]:│
  │                               │  Ongeza failed_attempts       │
  │                               │  Unda logi ya ukaguzi (FAIL)  │
  │  401 "Invalid credentials"    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [Ikiwa kushindwa kwa 3]:     │
  │                               │  Funga akaunti dakika 15      │
  │                               │  Unda logi ya ukaguzi (LOCKED)│
  │  423 "Account locked"         │                               │
  │←──────────────────────────────│                               │
```

### 9.2 Usajili wa Mkopaji na Maker-Checker

```
Lender User                     Server                          Database
  │                               │                               │
  │  POST /api/borrowers          │                               │
  │  { type, firstName, ... }     │                               │
  │──────────────────────────────→│                               │
  │                               │  Thibitisha na mpango wa Zod  │
  │                               │  INSERT pending_approvals     │
  │                               │  (status = 'pending')         │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Unda logi ya ukaguzi         │
  │                               │  Arifu watumiaji wa admin/regulator│
  │                               │──────────────────────────────→│
  │                               │                               │
  │  201 { approval, message }    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │

Admin/Regulator                 Server                          Database
  │                               │                               │
  │  PATCH /api/pending-approvals/:id                             │
  │  { status: "approved" }       │                               │
  │──────────────────────────────→│                               │
  │                               │  Kagua: requestedBy !== mimi  │
  │                               │  Kagua: status === 'pending'  │
  │                               │                               │
  │                               │  Sasisha hali ya idhini       │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  [Ikiwa imekubaliwa]:         │
  │                               │  Changanua JSON ya payload    │
  │                               │  INSERT INTO borrowers        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Unda logi ya ukaguzi (APPROVE)│
  │                               │  Arifu mwasilishaji           │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { updated approval }     │                               │
  │←──────────────────────────────│                               │
```

### 9.3 Uzalishaji wa Ripoti ya Mikopo

```
User                            Server                          Database
  │                               │                               │
  │  POST /api/credit-reports/generate                            │
  │  { borrowerId, purpose }      │                               │
  │──────────────────────────────→│                               │
  │                               │  Pata mkopaji                 │
  │                               │  Pata akaunti za mikopo       │
  │                               │  Pata uchunguzi wa mikopo     │
  │                               │  Pata hukumu za mahakama      │
  │                               │  Pata rekodi za idhini        │
  │                               │  Pata historia ya malipo (kila moja)│
  │                               │──────────────────────────────→│
  │                               │                    data yote  │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Zalisha nambari ya serial    │
  │                               │  (CR-{MWAKA}-{base36})        │
  │                               │                               │
  │                               │  Hesabu alama ya mikopo       │
  │                               │  (algoriti ya 300-850)        │
  │                               │  Zalisha misimbo ya sababu    │
  │                               │                               │
  │                               │  INSERT credit_report_logs    │
  │                               │  INSERT audit_logs            │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { serialNumber, score,   │                               │
  │    reasonCodes, accounts,     │                               │
  │    judgments, consents, ... }  │                               │
  │←──────────────────────────────│                               │
```

### 9.4 Mtiririko wa Uwasilishaji wa API ya Nje

```
Institution                     Server                          Database
  │                               │                               │
  │  POST /api/external/v1/borrowers                              │
  │  X-API-Key: sim_xxxx_yyyy     │                               │
  │  [{ ... }, { ... }]           │                               │
  │──────────────────────────────→│                               │
  │                               │  SHA-256 hashisha ufunguo     │
  │                               │  Tafuta api_keys kwa hash     │
  │                               │──────────────────────────────→│
  │                               │                     api_key   │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Kagua: hali ya ufunguo = active│
  │                               │  Kagua: taasisi imewezeshwa   │
  │                               │  Kagua: ruhusa = submit       │
  │                               │                               │
  │                               │  Kwa kila rekodi:             │
  │                               │    Thibitisha na Zod           │
  │                               │    INSERT borrowers            │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Sasisha ufunguo last_used_at │
  │                               │  Unda logi ya ukaguzi         │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { success: true,         │                               │
  │    submitted: N, failed: M,   │                               │
  │    results: [...],            │                               │
  │    errors: [...] }            │                               │
  │←──────────────────────────────│                               │
```

### 9.5 Mzunguko wa Maisha ya Mgogoro

```
Mchoro wa Hali:

  ┌──────┐     Wasilisha   ┌──────────────┐
  │ Hakuna│──────────────→│     OPEN      │
  └──────┘               └──────┬───────┘
                                │
                          Kagua │
                                │
                         ┌──────▼───────┐
                         │ UNDER_REVIEW │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │                       │
              Tatua │                Kataa │
                    │                       │
             ┌──────▼──┐           ┌───────▼───┐
             │ RESOLVED │           │ REJECTED  │
             └─────────┘           └───────────┘

Tarehe za Mwisho za SLA:
  - Marekebisho ya kifedha: siku 2 za kazi kutoka uwasilishaji
  - Marekebisho yasiyo ya kifedha: siku 5 za kazi kutoka uwasilishaji
  - Tarehe ya mwisho ya SLA inahesabiwa wakati wa kuunda kulingana na correctionType
```

---

## 10. Ushughulikiaji wa Makosa

### 10.1 Uthibitishaji wa Zod

Mwili wote wa ombi unaoingizwa unathibitishwa kwa kutumia mipango ya Zod inayotokana na ufafanuzi wa jedwali la Drizzle kupitia `drizzle-zod`:

- `insertBorrowerSchema` — Kuunda/kusasisha mkopaji
- `insertCreditAccountSchema` — Kuunda/kusasisha akaunti ya mikopo
- `insertCreditInquirySchema` — Kuunda uchunguzi wa mikopo
- `insertUserSchema` — Kuunda mtumiaji
- `insertPendingApprovalSchema` — Uwasilishaji wa idhini
- `insertDisputeSchema` — Uwasilishaji wa mgogoro
- `insertCourtJudgmentSchema` — Kuunda hukumu ya mahakama
- `insertConsentRecordSchema` — Kuunda idhini
- `insertPaymentHistorySchema` — Kuingiza historia ya malipo
- `insertInstitutionSchema` — Usajili wa taasisi
- `insertBillingRecordSchema` — Kuunda rekodi ya ankara
- `insertCreditReportLogSchema` — Kuunda logi ya ripoti ya mikopo
- `insertApiKeySchema` — Kuunda ufunguo wa API
- `insertExchangeRateSchema` — Kuunda kiwango cha ubadilishaji
- `insertRetentionPolicySchema` — Kuunda sera ya uhifadhi
- `insertApiConfigurationSchema` — Kuunda usanidi wa API

Kushindwa kwa uthibitishaji hurudisha HTTP 400 na ujumbe wa kosa wa Zod.

### 10.2 Middleware ya Makosa

Middleware ya makosa ya Express (`server/index.ts`) inakamata makosa yasiyoshughulikiwa:

```typescript
app.use((err, _req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});
```

### 10.3 Upungufu wa Taratibu

- Ishara ya **SIGHUP** inapuuzwa ili kuzuia kusimamishwa kunakosababishwa na mtiririko wa kazi
- Ishara ya **SIGPIPE** inapuuzwa ili kushughulikia hali za bomba lililovunjika
- **Makosa yasiyokamatwa** na **kukataliwa kusikoshughulikiwa** yanarekodwa lakini hayasababishi kushindwa kwa mchakato
- **Kushindwa kwa kuunda arifa** kunashughulikiwa kimya (sio muhimu)
- **Makosa ya kutumia maker-checker** yanarekodwa lakini hayasababishi kushindwa kwa sasisha la idhini

### 10.4 Misimbo ya Hali ya HTTP

| Msimbo | Matumizi |
|------|-------|
| 200 | Jibu la mafanikio |
| 201 | Rasilimali imeundwa |
| 400 | Kosa la uthibitishaji / Ombi baya |
| 401 | Uthibitishaji unahitajika / Stakabadhi zisizo sahihi |
| 403 | Ruhusa haitoshi / Kujikubalia mwenyewe kumezuiwa |
| 404 | Rasilimali haijapatikana |
| 423 | Akaunti imefungwa |
| 440 | Kikao kimemalizika (muda wa kutokuwa na kazi) |
| 500 | Kosa la ndani la seva |

---

## 11. Utendaji

### 11.1 Pooling ya Muunganisho

Pool ya muunganisho wa PostgreSQL imesanidiwa kwa ufanisi wa rasilimali:

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 30000,
});
```

- **Muunganisho wa juu:** 2 (inafaa kwa uwekaji wa instance moja)
- **Muda wa kutokuwa na kazi:** Sekunde 30

### 11.2 Kupiga Ukurasa Upande wa Seva

Jedwali zenye kiasi kikubwa zinatekeleza kupiga ukurasa upande wa seva:

- **Wakopaji:** `GET /api/borrowers?page=1&limit=50` (upeo wa 200 kwa ukurasa)
- **Taasisi:** `GET /api/institutions?page=1&limit=50` (upeo wa 200 kwa ukurasa)

Muundo wa jibu:
```json
{
  "data": [...],
  "total": 100005
}
```

### 11.3 Vikwazo vya Maswali

Endpoints zisizo na kupiga ukurasa zinatumia vikwazo vya maswali ili kuzuia matatizo ya kumbukumbu:

| Taasisi | Kikwazo cha Chaguo-msingi |
|--------|-------------|
| Akaunti za Mikopo | Rekodi 200 |
| Uchunguzi wa Mikopo | Rekodi 200 |
| Logi za Ukaguzi | Rekodi 200 |
| Hukumu za Mahakama | Rekodi 200 |
| Rekodi za Idhini | Rekodi 200 |
| Logi za Ripoti za Mikopo | Rekodi 200 |
| Matokeo ya Utafutaji | Rekodi 200 |
| Arifa | Rekodi 50 |
| Historia ya Malipo | Rekodi 12 (kwa akaunti) |

### 11.4 Kiasi cha Data ya Mbegu

Mfumo umejazwa na kiasi cha data kinachowakilisha uzalishaji:

| Taasisi | Idadi |
|--------|-------|
| Wakopaji | 102,462 |
| Taasisi | 100,020 |
| Akaunti za Mikopo | 172,359 |
| Historia ya Malipo | 120,000 |
| Uchunguzi wa Mikopo | 25,004 |
| Rekodi za Idhini | 15,000 |
| Logi za Ukaguzi | 5,063 |
| Migogoro | 3,218 |
| Hukumu za Mahakama | 2,147 |
| Rekodi za Ankara | 120 |
| Watumiaji wa Mfumo | 6 |

---

## 12. Ufuatiliaji na Urekodi

### 12.1 Rekodi ya Ukaguzi

Vitendo vyote muhimu vya mfumo vinaandikwa katika jedwali la `audit_logs`. Rekodi ya ukaguzi haibadiliki (kuingiza peke yake) na inakamata:

- **Utambulisho wa mtendaji** — Kitambulisho cha mtumiaji wa mtu/mfumo unaofanya kitendo
- **Uainishaji wa kitendo** — Aina za kitendo zilizosanifishwa
- **Ufuatiliaji wa taasisi** — Aina na kitambulisho cha taasisi iliyoathiriwa
- **Ufuatiliaji wa IP** — Anwani ya IP ya mteja (kupitia Express trust proxy)
- **Mihuri ya muda** — Muda wa kuundwa unaozalishwa kiotomatiki
- **Maelezo** — Maelezo ya kitendo yanayoweza kusomwa na binadamu

**Aina za Vitendo:**
`LOGIN`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `LOGOUT`, `PASSWORD_CHANGE`, `CREATE`, `UPDATE`, `SUBMIT_APPROVAL`, `APPROVE`, `REJECT`, `FILE_DISPUTE`, `UPDATE_DISPUTE`, `GRANT_CONSENT`, `REVOKE_CONSENT`, `VIEW`, `GENERATE_REPORT`, `BATCH_UPLOAD`, `BULK_SEARCH`, `API_SUBMIT`, `API_BATCH_SUBMIT`, `API_CREDIT_REPORT`, `UPLOAD_PHOTO`, `UPLOAD_ID_DOCUMENT`, `MFA_ENABLED`, `MFA_DISABLED`

### 12.2 Urekodi wa Maombi ya API

Maombi yote ya `/api/*` yanaandikwa kwenye konsoli na:

- Njia ya HTTP na njia ya URL
- Msimbo wa hali ya jibu
- Muda wa jibu kwa milisekunde
- Muhtasari wa mwili wa jibu (herufi 200 za kwanza)

Muundo: `{time} [express] {METHOD} {path} {status} in {duration}ms :: {response_preview}`

### 12.3 Urekodi wa Konsoli

Kazi ya `log()` katika `server/index.ts` inatoa matokeo ya konsoli yenye mihuri ya muda:

```
1:30:45 PM [express] POST /api/auth/login 200 in 45ms :: {"id":"...","username":"admin",...}
```

Hali za makosa zinarekodwa kupitia `console.error()` kwa:
- Makosa yasiyokamatwa
- Kukataliwa kwa ahadi kusikoshughulikiwa
- Makosa ya ndani ya seva
- Makosa ya hifadhidata ya mbegu
- Makosa ya kutumia maker-checker

---

## 13. Maboresho ya Biashara (v1.1 — v1.2)

### 13.1 Uthibitishaji wa Hatua Nyingi wa TOTP (ENT-01)

**Madhumuni:** Huongeza kipengele cha pili cha uthibitishaji kwa kutumia Nenosiri za Mara Moja Zinazotegemea Muda (TOTP) zinazoendana na programu za uthibitishaji (Google Authenticator, Authy, n.k.).

**Usanifu:**
- **Maktaba:** `otpauth` kwa uzalishaji na uthibitishaji wa TOTP
- **Schema:** Safu za `mfaSecret` (varchar, inaweza kuwa tupu) na `mfaEnabled` (boolean, chaguo-msingi false) kwenye jedwali la `users`
- **Endpoints:** `POST /api/auth/mfa/setup`, `POST /api/auth/mfa/verify`, `POST /api/auth/mfa/disable`, `POST /api/auth/mfa/login`
- **Frontend:** Kipengele cha `mfa-setup.tsx` na onyesho la URI ya msimbo wa QR na ingizo la uthibitishaji
- **Utafsiri:** Tafsiri kamili za EN/FR/PT chini ya funguo za `mfa.*` na `login.mfa*`

**Mtiririko:**
1. Mtumiaji anawezesha MFA kupitia mazungumzo ya usanidi → seva inazalisha siri ya TOTP → mteja anaonyesha URI ya `otpauth://`
2. Mtumiaji anaskan msimbo wa QR na programu ya uthibitishaji → anaingiza msimbo wa tarakimu 6 → seva inathibitisha na kuweka `mfaEnabled = true`
3. Kwa kuingia zinazofuata, `POST /api/auth/login` inarudisha `{ requireMfa: true }` → mteja anaonyesha ingizo la msimbo → `POST /api/auth/mfa/login` inakamilisha uthibitishaji

### 13.2 Ulinganishaji wa Taasisi kwa Ukaribu (ENT-02)

**Madhumuni:** Hugundua wakopaji wanaoweza kujirudia wakati wa usajili kwa kutumia ulinganishaji wa mfanano wa trigram.

**Usanifu:**
- **Kiendelezi:** `pg_trgm` kimewezeshwa kupitia `CREATE EXTENSION IF NOT EXISTS pg_trgm` wakati wa uanzishaji wa pool katika `server/db.ts`
- **Kizingiti:** Mfanano wa ≥0.3 (chaguo-msingi la PostgreSQL) kwa mechi zinazowezekana
- **Sehemu Zilizodhaminiwa:** `first_name`, `last_name`, `company_name`, `national_id`
- **Endpoint:** Imeunganishwa katika mtiririko wa utafutaji wa mkopaji na utafutaji wa jumla

### 13.3 Chatbot ya Migogoro (ENT-03)

**Madhumuni:** Msaidizi wa mazungumzo ya hatua nyingi unaoongoza watumiaji kupitia mchakato wa uwasilishaji wa mgogoro.

**Usanifu:**
- **Kipengele:** `dispute-chatbot.tsx` — mazungumzo ya hatua nyingi yenye hali
- **Hatua:** Utambulisho wa mkopaji → Uchaguzi wa akaunti → Aina ya mgogoro → Maelezo → Uthibitishaji → Uwasilishaji
- **Muunganisho:** Inawasilisha kwa `POST /api/disputes` baada ya uthibitishaji wa mtumiaji

### 13.4 Mnyororo wa Hash ya Logi ya Ukaguzi (ENT-07)

**Madhumuni:** Inaunda mnyororo wa hash ya SHA-256 isiyoweza kubadilishwa katika logi za ukaguzi ili kuzuia kubadilisha na kuhakikisha uadilifu wa data.

**Usanifu:**
- **Algoriti:** SHA-256 kupitia moduli ya `crypto` ya Node.js
- **Pembejeo ya Hash:** `previousHash + action + entity + details + timestamp`
- **Genesis:** Ingizo la kwanza la ukaguzi lina `previous_hash = "genesis"`
- **Uthibitishaji:** Kila ingizo jipya linahesabu hash yake kutoka kwa hash ya ingizo la awali, likiunda mnyororo ambao haubadilishwi

### 13.5 Mtiririko wa OAuth 2.1 (ENT-08)

**Madhumuni:** Utekelezaji wa uthibitishaji wa Bearer token kwa ufikio wa API ya nje unaotii viwango.

**Usanifu:**
- **Ruhusa:** Aina ya `client_credentials`
- **Endpoint ya Token:** `POST /api/external/v1/oauth/token`
- **Muundo wa Token:** JWT na kumalizika kunakoweza kusanidiwa
- **Matumizi:** Njia mbadala ya uthibitishaji wa ufunguo wa API kwa muunganisho wa taasisi

### 13.6 Uboreshaji wa Bandwidth Ndogo (ENT-09)

**Madhumuni:** Kuboresha utendaji kwa mazingira ya bandwidth ndogo, muhimu kwa uwekaji katika nchi za Afrika.

**Utekelezaji:**
- **Ukandamizaji wa gzip:** Middleware ya ukandamizaji kwenye Express.js
- **Mgawanyo wa msimbo:** `React.lazy()` na `Suspense` kwa upakiaji wa kurasa zinazosubiri

### 13.7 Usimamizi wa Viwango vya Ubadilishaji (ENT-10)

**Madhumuni:** Mfumo kamili wa usimamizi wa viwango vya ubadilishaji wa sarafu kwa sarafu 42+ za Afrika.

**Usanifu:**
- **Chanzo cha Data:** API ya open.er-api.com (kiwango cha bure, hakuna ufunguo unaohitajika)
- **Njia ya Msalaba:** Wakati kiwango cha moja kwa moja hakipatikani, mfumo unabadilisha kupitia USD kama mpatanishi (mfano, GHS → USD → ETB)
- **Operesheni za CRUD:** Wasimamizi wanaweza kuunda, kusasisha, na kufuta viwango kwa mkono
- **Kifaa cha Kubadilisha:** Kifaa cha kubadilisha sarafu upande wa mteja kilichojengwa ndani ya ukurasa wa viwango vya ubadilishaji
- **Ratiba:** Msasishaji wa ratiba ya viwango vya ubadilishaji wenye muda wa saa 24

### 13.8 Usimamizi wa API (ENT-11)

**Madhumuni:** Usimamizi wa kati wa usanidi wa API ya nje na upimaji wa muunganisho.

**Usanifu:**
- **Jedwali:** `api_configurations` kwa kuhifadhi URL za API, aina za uthibitishaji, na stakabadhi
- **Upimaji wa Muunganisho:** Endpoint ya `POST /api/api-configurations/:id/test` kwa upimaji wa moja kwa moja
- **Ulinzi wa SSRF:** Uthibitishaji wa URL ili kuzuia maombi ya seva za ndani
- **Mipangilio ya Nchi:** Usanidi wa kila nchi kwa uhusiano wa API mahususi wa mamlaka

### 13.9 Sera za Uhifadhi wa Data (ENT-12)

**Madhumuni:** Sera za uhifadhi wa data mahususi kwa mamlaka na utekelezaji otomatiki.

**Usanifu:**
- **Jedwali:** `retention_policies` kwa kuhifadhi sheria za uhifadhi za kila nchi
- **Ratiba:** Utekelezaji otomatiki kwa muda wa saa 24 kupitia `setInterval`
- **Uanzishaji wa Mkono:** `POST /api/retention-policies/enforce` kwa utekelezaji kwa mkono
- **Kitendo:** Rekodi zilizopita tarehe ya uhifadhi zimeondolewa (kufutwa laini au ngumu kulingana na sera)
