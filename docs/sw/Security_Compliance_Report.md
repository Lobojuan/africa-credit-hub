# Ripoti ya Utiifu wa Usalama

## Mfumo wa Kituo cha Kati cha Data na Rejista ya Mikopo ya Mipaka Mbalimbali v2.5

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 2.5  
**Tarehe:** Aprili 2026  
**Uainishaji:** Siri

---

## 1. Muhtasari wa Utendaji

Hati hii inatoa tathmini ya kina ya udhibiti wa usalama uliotekelezwa katika Mfumo wa Rejista ya Mikopo dhidi ya mahitaji yaliyofafanuliwa katika Maelezo ya Mahitaji ya Programu (SRS) v1.2. Mfumo unashughulikia data nyeti za kifedha na za kibinafsi katika nchi zote 54 za Afrika na unasaidia lugha tano (Kiingereza, Kifaransa, Kireno, Kiarabu, Kiswahili) na lazima uzingatie mahitaji ya ulinzi wa data na udhibiti wa kifedha.

Mahitaji yote kumi ya usalama yasiyo ya kitendaji (NFR-SEC-01 hadi NFR-SEC-10) yametekelezwa, pamoja na uboreshaji kumi na tano wa usalama wa biashara (ENT-01 hadi ENT-15) ikiwa ni pamoja na uthibitishaji wa hatua nyingi wa TOTP, ubadilishanaji wa tokeni ya OAuth 2.1 Bearer, mnyororo wa hash wa kumbukumbu za ukaguzi zinazostahimili uharibifu, ulinganishaji wa huluki zisizo kamili, chatbot ya migogoro, uboreshaji wa bandwidth ndogo, msaada wa kupakia XBRL, utekelezaji wa uhifadhi wa data, usimamizi wa viwango vya ubadilishaji, usimamizi wa API, utafutaji wa kimataifa, kupakia picha/hati za kitambulisho, mazingira ya maonyesho ya wawekezaji, uchambuzi wa kuona wa dashibodi, na ziara ya maonyesho ya maingiliano. Ripoti hii inaelezea kila udhibiti wa usalama, utekelezaji wake, na hali ya utiifu.

---

## 2. Udhibiti wa Uthibitishaji

### 2.1 Uthibitishaji kwa Nywila

| Udhibiti | Utekelezaji |
|---------|---------------|
| Njia ya Uthibitishaji | Jina la mtumiaji/nywila na kikao cha upande wa seva |
| Hashing ya Nywila | bcryptjs na raundi 10 za chumvi |
| Uhifadhi wa Nywila | Nywila zilizofanywa hash zinahifadhiwa katika safu ya `users.password`; maandishi wazi hayahifadhiwi wala kurekodiwa |
| Mwisho wa Kuingia | `POST /api/auth/login` |
| Mwisho wa Kutoka | `POST /api/auth/logout` |
| Uthibitishaji wa Kikao | `GET /api/auth/me` |

### 2.2 Sera ya Nywila

| Sera | Sharti | Utekelezaji |
|--------|-------------|---------------|
| Urefu wa Chini | Herufi 8 | Uthibitishaji wa regex: `.{8,}` |
| Herufi Kubwa | Angalau 1 | Regex: `(?=.*[A-Z])` |
| Herufi Ndogo | Angalau 1 | Regex: `(?=.*[a-z])` |
| Nambari | Angalau 1 | Regex: `(?=.*\d)` |
| Herufi Maalum | Angalau 1 | Regex: `(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])` |
| Kumalizika kwa Nywila | Siku 90 | Muda wa `passwordChangedAt` unakaguliwa wakati wa kuingia; kubadilisha kwa lazima inapomalizika |
| Kubadilisha kwa Kuingia Kwanza | Inahitajika inapowekwa bendera | Bendera ya boolean ya `mustChangePassword` |

**Muundo Kamili wa Regex:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$
```

### 2.3 Uthibitishaji wa Hatua Nyingi (MFA) — ENT-01

| Udhibiti | Utekelezaji |
|---------|---------------|
| Njia ya MFA | TOTP (Nywila ya Mara Moja Kulingana na Muda) kupitia maktaba ya `otpauth` |
| Uhifadhi wa Siri | Safu ya `mfaSecret` (varchar, inaweza kuwa tupu) kwenye jedwali la `users`; inahifadhiwa kama siri iliyohifadhiwa kwa base32 |
| Bendera ya Kuwezesha | Safu ya `mfaEnabled` (boolean, chaguomsingi false) kwenye jedwali la `users` |
| Mwisho wa Usanidi | `POST /api/auth/mfa/setup` — inatengeneza siri ya TOTP, inarudisha URI ya `otpauth://` kwa msimbo wa QR |
| Mwisho wa Uthibitishaji | `POST /api/auth/mfa/verify` — inathibitisha msimbo wa TOTP wa tarakimu 6 na kuwezesha MFA |
| Mwisho wa Kuzima | `POST /api/auth/mfa/disable` — inazima MFA kwa mtumiaji aliyethibitishwa |
| Mtiririko wa Kuingia | `POST /api/auth/login` inarudisha `{ requireMfa: true }` MFA inapowezeshwa; mteja anaombwa msimbo wa TOTP |
| Mwisho wa Kuingia kwa MFA | `POST /api/auth/mfa/login` — inathibitisha msimbo wa TOTP na kukamilisha uthibitishaji |
| Sehemu ya Frontend | `mfa-setup.tsx` — mazungumzo ya usanidi na kuonyesha msimbo wa QR na ingizo la uthibitishaji |
| Msaada wa i18n | Tafsiri kamili za EN/FR/PT chini ya funguo za `mfa.*` na `login.mfa*` |

**Mtiririko wa Kuingia kwa MFA:**
1. Mtumiaji anawasilisha jina la mtumiaji/nywila kupitia `POST /api/auth/login`
2. Ikiwa mtumiaji ana `mfaEnabled = true`, seva inarudisha `{ requireMfa: true, userId }` bila kuunda kikao
3. Mteja anaonyesha sehemu ya ingizo la msimbo wa TOTP
4. Mtumiaji anaingiza msimbo wa tarakimu 6 kutoka programu ya uthibitishaji
5. Mteja anatuma `POST /api/auth/mfa/login` na `{ userId, code }`
6. Seva inathibitisha msimbo wa TOTP dhidi ya siri iliyohifadhiwa
7. Ikiwa ni halali, kikao kinaundwa na mtumiaji anathibitishwa
8. Ikiwa si halali, HTTP 401 inarudishwa na kosa la "Invalid MFA code"

### 2.4 Kufungwa kwa Akaunti

| Udhibiti | Thamani |
|---------|-------|
| Majaribio ya Juu Yaliyoshindwa | 3 |
| Muda wa Kufungwa | Dakika 15 |
| Ufuatiliaji wa Kufungwa | Kihesabu cha `failed_login_attempts` katika jedwali la `users` |
| Kumalizika kwa Kufungwa | Muda wa `locked_until` katika jedwali la `users` |
| Kurejesha Kihesabu | Wakati wa kuingia kwa mafanikio (`resetFailedAttempts`) |
| Urekodi wa Ukaguzi | Majaribio yaliyoshindwa na matukio ya kufungwa yanarekodiwa na anwani ya IP |

**Mtiririko wa Kufungwa:**
1. Kuingia kushindwa kunaongeza `failed_login_attempts`
2. Kila jaribio lililoshindwa linaunda ingizo la kumbukumbu ya ukaguzi ya `LOGIN_FAILED`
3. Kwa majaribio 3 yaliyoshindwa, `locked_until` inawekwa kuwa `sasa + dakika 15`
4. Ingizo la kumbukumbu ya ukaguzi ya `ACCOUNT_LOCKED` linaundwa
5. Majaribio ya kuingia yanayofuata wakati wa kufungwa yanarudisha HTTP 423
6. Kuingia kwa mafanikio kunarejesha kihesabu na kufuta kufungwa

---

## 3. Uidhinishaji (RBAC)

### 3.1 Ufafanuzi wa Majukumu

Mfumo unatekeleza majukumu manne na ufikiaji wa kihierarkia:

| Jukumu | Maelezo | Usimamizi wa Watumiaji | Taasisi | Ankara | Kumbukumbu za Ukaguzi | Idhini | Kupakia kwa Wingi | Kuingiza Data | Kuona Data |
|------|-------------|----------------|--------------|---------|------------|-----------|--------------|------------|-----------|
| admin | Ufikiaji kamili wa mfumo | Ndiyo | Ndiyo | Ndiyo | Ndiyo | Ndiyo | Ndiyo | Ndiyo | Ndiyo |
| regulator | Usimamizi wa udhibiti | Hapana | Hapana | Ndiyo | Ndiyo | Ndiyo | Hapana | Ndiyo | Ndiyo |
| lender | Operesheni za mtoa data | Hapana | Hapana | Hapana | Hapana | Hapana | Ndiyo | Ndiyo | Ndiyo |
| viewer | Ufikiaji wa kusoma pekee | Hapana | Hapana | Hapana | Hapana | Hapana | Hapana | Hapana | Ndiyo |

### 3.2 Utekelezaji wa Upande wa Seva

Uidhinishaji unatekelezwa katika tabaka la API kwa kutumia middleware:

```typescript
function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.session?.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
```

### 3.3 Njia Zilizolindwa

| Mwisho | Majukumu Yanayohitajika |
|----------|---------------|
| `GET/POST /api/users` | admin |
| `PATCH /api/users/:id` | admin |
| `GET /api/audit-logs` | admin, regulator |
| `PATCH /api/pending-approvals/:id` | admin, regulator |
| `POST /api/court-judgments` | admin, regulator |
| `GET/POST /api/api-keys` | admin |
| `POST /api/api-keys/:id/revoke` | admin |
| `POST /api/batch-upload/*` | admin, lender |

### 3.4 RBAC ya Frontend

Upau wa pembeni wa frontend na ufikiaji wa ukurasa vinachujwa kulingana na jukumu la mtumiaji, kuzuia ufikiaji usioidhinishwa. Hata hivyo, utekelezaji wa usalama unatokea upande wa seva; kuchuja kwa frontend ni urahisi wa UX pekee.

---

## 4. Usimamizi wa Kikao

### 4.1 Usanidi wa Kikao

| Parameta | Thamani | Maelezo |
|-----------|-------|-------|
| Hifadhi ya Kikao | MemoryStore | Uhifadhi wa kikao katika kumbukumbu na usafishaji wa mara kwa mara |
| Siri ya Kikao | Kutofautiana kwa mazingira ya `SESSION_SECRET` | Inarudi kwa siri ya maendeleo katika maendeleo |
| Cookie HttpOnly | `true` | Inazuia ufikiaji wa JavaScript wa upande wa mteja |
| Cookie Secure | `false` (inaweza kusanidiwa) | Inapaswa kuwa `true` katika uzalishaji na HTTPS |
| Cookie SameSite | `lax` | Ulinzi wa CSRF |
| Umri wa Juu wa Kikao | Masaa 8 | Maisha kamili ya kikao |
| Muda wa Kutofanya Kazi | Dakika 15 | Utiifu wa NFR-SEC-09 |
| Usafishaji wa Hifadhi | Kila masaa 24 | `checkPeriod: 86400000` |

### 4.2 Utekelezaji wa Muda wa Kutofanya Kazi (NFR-SEC-09)

```typescript
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // dakika 15

app.use((req, res, next) => {
  if (req.session?.userId && req.session.lastActivity) {
    const idle = Date.now() - req.session.lastActivity;
    if (idle > IDLE_TIMEOUT_MS) {
      req.session.destroy(() => {});
      return res.status(440).json({ message: "Session expired due to inactivity" });
    }
  }
  if (req.session?.userId) {
    req.session.lastActivity = Date.now();
  }
  next();
});
```

- Muda wa `lastActivity` unasasishwa kwa kila ombi lililothibitishwa
- Kikao kinaharibiwa wakati muda wa kutofanya kazi unazidi dakika 15
- Msimbo wa hali ya HTTP 440 unarudishwa (Muda wa Kuingia Umekwisha)
- Frontend inagundua 440 na kuelekeza kwenye ukurasa wa kuingia

### 4.3 Data ya Kikao

| Sehemu | Aina | Maelezo |
|-------|------|-------------|
| userId | string | Kitambulisho cha mtumiaji aliyethibitishwa |
| userRole | string | Jukumu la mtumiaji kwa uidhinishaji |
| lastActivity | number | Muda wa shughuli ya mwisho (ms tangu epoch) |

---

## 5. Usalama wa API

### 5.1 Uthibitishaji wa API ya Ndani

Miisho yote ya API ya ndani (chini ya `/api/`) inahitaji uthibitishaji unaotegemea kikao, isipokuwa:
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/health`
- `/api/external/*`

Hii inajumuisha mwisho wa taswira ya dashibodi `GET /api/dashboard/chart-data`, ambao unarudisha mwenendo wa kila mwezi, mgawanyo wa hali, mgawanyo wa aina, na mgawanyo wa nchi kwa moduli ya Uchambuzi wa Kuona wa Dashibodi (ENT-14). Mwisho huu unalindwa na middleware ya `requireAuth` na unahitaji kipindi hai kilichothibitishwa.

Middleware ya uthibitishaji:
```typescript
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/external")) return next();
  requireAuth(req, res, next);
});
```

### 5.2 Uthibitishaji wa API ya Nje

Miisho ya API ya nje inasaidia njia mbili za uthibitishaji:

#### 5.2.1 Uthibitishaji wa X-API-Key

Uthibitishaji wa funguo ya API kupitia kichwa cha HTTP cha `X-API-Key` (njia ya asili):

#### 5.2.2 Uthibitishaji wa Tokeni ya OAuth 2.1 Bearer — ENT-04

| Udhibiti | Utekelezaji |
|---------|---------------|
| Aina ya Ruhusa | `client_credentials` |
| Mwisho wa Tokeni | `POST /api/external/oauth/token` |
| Muundo wa Tokeni | JWT (JSON Web Token) iliyosainiwa na HS256 |
| Maktaba ya Tokeni | `jsonwebtoken` |
| Kumalizika kwa Tokeni | Saa 1 (sekunde 3600) |
| Muundo wa Ombi | `{ "grant_type": "client_credentials", "client_id": "<api_key_prefix>", "client_secret": "<full_api_key>" }` |
| Muundo wa Jibu | `{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 }` |
| Matumizi | Kichwa cha `Authorization: Bearer <access_token>` kwenye miisho ya API ya nje |

**Mtiririko wa Tokeni ya OAuth 2.1:**
1. Mteja anatuma `POST /api/external/oauth/token` na akreditesho za funguo ya API
2. Seva inathibitisha funguo ya API kupitia utafutaji wa hash ya SHA-256
3. Seva inatengeneza JWT inayojumuisha `institutionId`, `permissions`, na `apiKeyId`
4. JWT inasainiwa na siri ya kikao na kurudishwa kwa mteja
5. Mteja anajumuisha JWT katika kichwa cha `Authorization: Bearer <token>` kwenye maombi yanayofuata
6. Seva inathibitisha saini ya JWT na kumalizika kwa kila ombi
7. Uthibitishaji wa X-API-Key na tokeni ya Bearer vinakubaliwa kwenye miisho yote ya API ya nje

Miisho ya API ya nje pia hutumia uthibitishaji wa funguo ya API:

| Udhibiti | Utekelezaji |
|---------|---------------|
| Kichwa cha Uthibitishaji | `X-API-Key` |
| Hashing ya Funguo | SHA-256 (crypto.createHash) |
| Uhifadhi wa Funguo | Hash pekee inayohifadhiwa (safu ya `key_hash`); funguo kamili inaonyeshwa mara moja tu wakati wa kuundwa |
| Kiambishi cha Funguo | Kiambishi kinachoonekana kwa utambuzi (`sim_XXXXXXXX`) |
| Viwango vya Ruhusa | `submit` (kuandika pekee), `read` (kusoma pekee), `full` (kusoma + kuandika) |
| Uhusiano na Taasisi | Kila funguo imefungwa kwa taasisi maalum |
| Ukaguzi wa Hali ya Taasisi | Taasisi lazima iwe `active` ili funguo ifanye kazi |
| Ufuatiliaji wa Matumizi ya Mwisho | Muda wa `last_used_at` unasasishwa kwa kila simu ya API |
| Kubatilisha Funguo | Kubatilisha papo hapo na muda wa `revoked_at` |

### 5.3 Uzalishaji wa Funguo ya API

```typescript
function generateApiKey() {
  const prefix = "sim_" + crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const fullKey = `${prefix}_${secret}`;
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  return { fullKey, prefix, hash };
}
```

- Muundo wa funguo: `sim_XXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`
- Kiambishi: herufi 8 za hex kwa utambuzi
- Siri: herufi 48 za hex kwa usalama
- Jumla ya entropy: biti 224 (baiti 28 za nasibu)

### 5.4 Mtiririko wa Uthibitishaji wa Funguo ya API

1. Toa kichwa cha `X-API-Key`
2. Fanya hash ya funguo na SHA-256
3. Tafuta hash katika jedwali la `api_keys`
4. Thibitisha hali ya funguo ni `active`
5. Thibitisha taasisi inayohusiana ni `active`
6. Kagua kiwango cha ruhusa dhidi ya mahitaji ya mwisho
7. Sasisha muda wa `last_used_at`
8. Endelea na ombi

### 5.5 Kupunguza SSRF

Kipengele cha "Test Connection" cha Moduli ya Usimamizi wa API kinajumuisha ulinzi wa Server-Side Request Forgery (SSRF) kuzuia matumizi mabaya ya maombi ya HTTP yanayotoka nje.

| Udhibiti | Utekelezaji |
|---------|---------------|
| Uthibitishaji wa URL | Inazuia maombi kwa anwani za mtandao wa ndani/wa kibinafsi kabla ya kutuma maombi ya nje |
| Wenyeji Waliozuiwa | `localhost`, `127.0.0.1`, `169.254.169.254` (mwisho wa metadata ya wingu) |
| Masafa ya IP Yaliyozuiwa | Masafa ya IP za kibinafsi: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x` |
| Kizuizi cha Itifaki | Itifaki za `HTTP` na `HTTPS` pekee zinaruhusiwa; miradi mingine yote inakataliwa |
| Utekelezaji | Mantiki ya uthibitishaji wa URL katika `server/routes.ts` inathibitisha URL zote zinazotolewa na mtumiaji kabla ya kutuma maombi ya nje |

**Mtiririko wa Uthibitishaji wa SSRF:**
1. Mtumiaji anawasilisha URL kupitia kipengele cha "Test Connection" katika Moduli ya Usimamizi wa API
2. Seva inachambua URL na kutoa jina la mwenyeji na itifaki
3. Itifaki inakaguliwa dhidi ya orodha ya kuruhusiwa (HTTP/HTTPS pekee)
4. Jina la mwenyeji linakaguliwa dhidi ya orodha ya kuzuia (localhost, 127.0.0.1, mwisho wa metadata)
5. Jina la mwenyeji linakaguliwa dhidi ya masafa ya IP za kibinafsi (10.x, 192.168.x, 172.16-31.x)
6. Ikiwa ukaguzi wowote unashindwa, ombi linakataliwa na ujumbe unaofaa wa kosa
7. Ikiwa ukaguzi wote unapita, ombi la nje linafanywa na jibu linarudishwa kwa mtumiaji

---

## 6. Ulinzi wa Data

### 6.1 Data Iliyohifadhiwa

| Data | Ulinzi |
|------|-----------|
| Nywila | hash ya bcrypt (raundi 10) |
| Funguo za API | hash ya SHA-256 |
| PII (data ya mkopaji) | Udhibiti wa ufikiaji wa kiwango cha hifadhidata |
| Muunganisho wa Hifadhidata | SSL/TLS wakati `sslmode=require` |

### 6.2 Data Inayosafirishwa

| Njia | Ulinzi |
|---------|-----------|
| Mteja hadi Seva | HTTPS (inayotolewa na jukwaa au proksi ya nyuma) |
| Seva hadi Hifadhidata | SSL/TLS ya PostgreSQL |
| Usafirishaji wa Funguo ya API | HTTPS inahitajika kwa API ya nje |

### 6.3 Ushughulikiaji wa Data Nyeti

- Nywila hazirudi kamwe katika majibu ya API (kazi ya `stripPassword`)
- Funguo kamili za API zinaonyeshwa mara moja tu wakati wa kuundwa
- Data ya kikao inahifadhiwa upande wa seva pekee (cookie ina kitambulisho cha kikao pekee)
- Maelezo ya kumbukumbu za ukaguzi yanafupishwa hadi herufi 200 katika pato la console

### 6.4 Uthibitishaji wa Ingizo

Ingizo lote la mtumiaji linathibitishwa kwa kutumia schemas za Zod zinazotokana na ufafanuzi wa jedwali za Drizzle ORM:

```typescript
const parsed = insertBorrowerSchema.parse(req.body);
```

- Uthibitishaji wa aina (string, number, boolean, thamani za enum)
- Utekelezaji wa sehemu zinazohitajika
- Kizuizi cha thamani za enum
- Kuzuia SQL injection kupitia hoji zilizowekwa parameta (Drizzle ORM), ikiwa ni pamoja na ndani ya Injini ya Utekelezaji wa Uhifadhi na moduli za Usanidi wa API

---

## 7. Urekodi wa Ukaguzi

### 7.1 Upeo wa Kumbukumbu za Ukaguzi

| Kategoria ya Kitendo | Matukio Yanayorekodiwa |
|-----------------|---------------|
| Uthibitishaji | LOGIN, LOGIN_FAILED, ACCOUNT_LOCKED, LOGOUT, PASSWORD_CHANGE |
| Mabadiliko ya Data | CREATE, UPDATE, SUBMIT_APPROVAL, APPROVE, REJECT |
| Migogoro | FILE_DISPUTE, RESOLVE_DISPUTE |
| Idhini | GRANT_CONSENT, REVOKE_CONSENT |
| Ripoti za Mikopo | VIEW (ripoti ya mikopo), API_CREDIT_REPORT |
| API ya Nje | API_SUBMIT, API_BATCH_SUBMIT, API_CREDIT_REPORT |
| Taasisi | APPROVE_INSTITUTION |
| Funguo za API | CREATE_API_KEY, REVOKE_API_KEY |

### 7.2 Sehemu za Kumbukumbu za Ukaguzi

| Sehemu | Maelezo |
|-------|-------------|
| id | Kitambulisho cha kipekee cha ingizo la kumbukumbu |
| user_id | Mtumiaji aliyefanya kitendo |
| action | Aina ya kitendo (iliyoorodheshwa hapo juu) |
| entity | Aina ya huluki iliyoathiriwa (user, borrower, credit_account, n.k.) |
| entity_id | Kitambulisho cha huluki iliyoathiriwa |
| details | Maelezo yanayosomeka na mwanadamu |
| ip_address | Anwani ya IP ya mteja (kupitia `req.ip` na trust proxy imewezeshwa) |
| created_at | Muda wa kitendo |

### 7.3 Mnyororo wa Hash Unaostahimili Uharibifu — ENT-07

| Udhibiti | Utekelezaji |
|---------|---------------|
| Algorithimu ya Hashing | SHA-256 (kupitia moduli ya `crypto` ya Node.js) |
| Sehemu za Hash | Safu za `previousHash` na `currentHash` kwenye jedwali la `audit_logs` |
| Ujenzi wa Mnyororo | `currentHash` ya kila ingizo jipya la kumbukumbu = SHA-256(`previousHash` + `action` + `entity` + `details` + `timestamp`) |
| Ingizo la Kwanza | `previousHash` = `"genesis"` kwa ingizo la kwanza la kumbukumbu katika mnyororo |
| Mwisho wa Uthibitishaji | `GET /api/audit/verify-integrity` — inathibitisha mnyororo mzima wa hash |
| Kiashiria cha Frontend | Beji ya uadilifu kwenye ukurasa wa ufuatiliaji wa ukaguzi (`data-testid="badge-integrity-status"`) |
| Kitufe cha Uthibitishaji | `data-testid="button-verify-integrity"` kinachochea uthibitishaji wa mnyororo |

**Mchakato wa Uthibitishaji wa Mnyororo wa Hash:**
1. Mteja anaita `GET /api/audit/verify-integrity`
2. Seva inapata maingizo yote ya kumbukumbu za ukaguzi yaliyopangwa kwa `created_at ASC`
3. Kwa kila ingizo, seva inahesabu upya `currentHash` inayotarajiwa kutoka `previousHash` + data ya ingizo
4. Seva inathibitisha kwamba `currentHash` inalingana na thamani iliyohifadhiwa
5. Seva inathibitisha kwamba `previousHash` inalingana na `currentHash` ya ingizo la awali
6. Inarudisha `{ valid: true/false, totalEntries, checkedEntries, brokenAt }`
7. Frontend inaonyesha beji ya kijani "Valid" au beji ya nyekundu "Broken" ipasavyo

### 7.4 Kutobadilika kwa Kumbukumbu za Ukaguzi

- Kumbukumbu za ukaguzi ni za kuongeza pekee (operesheni za INSERT pekee)
- Hakuna miisho ya UPDATE au DELETE kwa kumbukumbu za ukaguzi
- Kumbukumbu zinapangwa kwa `created_at DESC` kwa kuonyesha
- Maingizo 200 ya hivi karibuni yanarudishwa kupitia API (na uwezekano wa pagination)
- Mnyororo wa hash unatoa ushahidi wa kriptografia wa uharibifu (ENT-07)

### 7.4 Ufuatiliaji wa Anwani ya IP

```typescript
app.set("trust proxy", true);
```

Anwani za IP zinachukuliwa kwenye operesheni zote zinazokaguliwa kupitia `req.ip`, ambayo inaheshimu vichwa vya `X-Forwarded-For` inapokuwa nyuma ya proksi ya nyuma.

---

## 8. Mtiririko wa Maker-Checker

### 8.1 Kanuni ya Macho-Manne

Mfumo unatekeleza kanuni ya maker-checker (macho-manne) kwa mabadiliko ya data:

| Hatua | Jukumu | Kitendo |
|------|------|--------|
| 1. Kuwasilisha | Mtumiaji yeyote (maker) | Anaunda ombi la idhini linalosubiri |
| 2. Kukagua | Admin/Mdhibiti (checker) | Anaidhinisha au anakataa ombi |
| 3. Kutekeleza | Mfumo | Unatumia mabadiliko yaliyoidhinishwa kwa moja kwa moja |

### 8.2 Kuzuia Kujidhinisha

```typescript
if (approval.requestedBy === currentUserId) {
  return res.status(403).json({
    message: "Maker-checker: You cannot approve your own request."
  });
}
```

- Utekelezaji wa upande wa seva unazuia mtumiaji yeyote kuidhinisha maombi yake mwenyewe
- HTTP 403 inarudishwa kwa jaribio la kujidhinisha
- Hii inatumika kwa aina zote za huluki (wakopaji, akaunti za mikopo)

### 8.3 Huluki Zinazoshughulikiwa

| Aina ya Huluki | Vitendo Vinavyohitaji Idhini |
|-------------|---------------------------|
| Borrower | CREATE, UPDATE |
| Credit Account | CREATE, UPDATE |

### 8.4 Arifa za Idhini

- Ombi linapowasilishwa, watumiaji wote wa admin/mdhibiti (isipokuwa mwombaji) wanapata arifa
- Ombi linapoidhinishwa/kukataliwa, mwombaji wa asili anapata arifa
- Arifa zinajumuisha viungo vya ukurasa wa idhini

---

## 9. Udhibiti wa Usalama wa Uboreshaji wa Biashara

### 9.1 Ulinganishaji wa Huluki Zisizo Kamili — ENT-02

| Udhibiti | Utekelezaji |
|---------|---------------|
| Kiendelezi | `pg_trgm` (ulinganishaji wa trigram ya PostgreSQL) |
| Kuwezesha | `CREATE EXTENSION IF NOT EXISTS pg_trgm` wakati wa kuanzisha pool katika `server/db.ts` |
| Mwisho | `GET /api/borrowers/fuzzy-match?name=<query>` |
| Kiwango | Alama ya ulinganishaji ≥ 0.3 |
| Madhumuni | Kugundua nakala za wakopaji wakati wa usajili kuzuia udanganyifu wa utambulisho |
| Ushirikiano wa Frontend | Bango la onyo linaonyeshwa kwenye fomu ya usajili wa mkopaji wakati nakala zinagunduliwa |

### 9.2 Uboreshaji wa Bandwidth Ndogo — ENT-05

| Udhibiti | Utekelezaji |
|---------|---------------|
| Ukandamizaji | Middleware ya `compression` (gzip) inatumika kwa majibu yote ya HTTP |
| Ugawanyaji wa Msimbo | `React.lazy()` kwa sehemu zote za njia isipokuwa Dashboard, Login, na NotFound |
| Kupakia kwa Uvivu | Kufungwa kwa `Suspense` na sehemu ya fallback ya spinner (`LazyFallback`) |
| Athari | Ukubwa uliopunguzwa wa bundle ya awali; majibu ya API yaliyokandamizwa kwa mazingira yenye bandwidth ndogo |

### 9.3 Msaada wa Kupakia XBRL — ENT-06

| Udhibiti | Utekelezaji |
|---------|---------------|
| Muundo wa Faili | Faili za XBRL/XML zinakubaliwa kupitia mwisho wa kupakia kwa wingi |
| Frontend | Kiolesura cha tabo (tabo ya JSON/CSV na tabo ya XBRL) kwenye ukurasa wa kupakia kwa wingi |
| Sampuli | Muundo wa sampuli ya XBRL umetolewa katika UI kwa waandaaji wa data |
| Uchambuzi | Uchambuzi wa XBRL/XML wa upande wa seva katika `POST /api/batch-upload/credit-accounts` |

### 9.4 Chatbot ya Migogoro — ENT-03

| Udhibiti | Utekelezaji |
|---------|---------------|
| Sehemu | `dispute-chatbot.tsx` — kiolesura cha mazungumzo ya mwongozo |
| Ushirikiano | Inapatikana kutoka ukurasa wa helpdesk |
| Mtiririko | Aina ya suala → utafutaji wa mkopaji → uchaguzi wa akaunti → maelezo → kuwasilisha kwa moja kwa moja |
| i18n | Tafsiri kamili za EN/FR chini ya funguo za `chatbot.*` |

### 9.5 Usalama wa Kupakia Faili — ENT-12

| Udhibiti | Utekelezaji |
|---------|---------------|
| Maktaba ya Kupakia | `multer` — kushughulikia multipart/form-data kwa kupakia faili |
| Kikomo cha Ukubwa wa Picha | Ukubwa wa juu wa faili 5 MB kwa picha za wakopaji |
| Kikomo cha Ukubwa wa Hati | Ukubwa wa juu wa faili 10 MB kwa hati za kitambulisho |
| Uthibitishaji wa MIME ya Picha | Aina za MIME za `image/*` pekee zinakubaliwa kwa picha |
| Uthibitishaji wa MIME ya Hati | Aina za MIME za `image/*` na `application/pdf` pekee zinakubaliwa kwa hati za kitambulisho |
| Kubadilisha Majina ya Faili | Faili zilizopakiwa zinapokea majina ya faili yaliyobadilishwa kinasibu (`{timestamp}-{random}{ext}`) kuzuia kupita njia na kuhesabu |
| Eneo la Uhifadhi | Picha zinahifadhiwa katika `uploads/photos/`, hati za kitambulisho katika `uploads/documents/` |
| Upatikanaji Uliolindwa kwa Uthibitishaji | Njia ya `/uploads` ya static inalindwa na middleware ya `requireAuth` — watumiaji wasiothibitishwa hawawezi kufikia faili zilizopakiwa |
| Urekodi wa Ukaguzi | Kupakia picha na hati zote kunaunda maingizo ya kumbukumbu za ukaguzi (`UPLOAD_PHOTO`, `UPLOAD_ID_DOCUMENT`) na kitambulisho cha mkopaji na kitambulisho cha mtumiaji |
| Miisho | `POST /api/borrowers/:id/photo` (multipart/form-data, sehemu: `photo`), `POST /api/borrowers/:id/id-document` (multipart/form-data, sehemu: `document`) |

### 9.6 Ushirikiano na Huduma za Nje

| Huduma | Madhumuni | Maelezo ya Usalama |
|---------|---------|---------------|
| DiceBear (`api.dicebear.com`) | Picha za wasifu wa mkopaji zinazozalishwa kwa moja kwa moja | Hakuna PII inayotumwa kwa DiceBear — kitambulisho cha mkopaji pekee kinatumika kama mbegu ya kuzalisha picha; hakuna uthibitishaji unaohitajika |
| Open Exchange Rates (`open.er-api.com`) | Kupata viwango vya kubadilisha sarafu vya wakati halisi | Hakuna uthibitishaji unaohitajika; hakuna data nyeti inayosafirishwa; misimbo ya sarafu pekee inatumwa katika maombi |

---

## 10. Jedwali la Utiifu (NFR-SEC + ENT)

| Rejea ya SRS | Sharti | Hali | Maelezo ya Utekelezaji |
|---------|-------------|--------|----------------------|
| NFR-SEC-01 | Udhibiti wa ufikiaji kulingana na majukumu na majukumu 4 | INATII | Majukumu 4 (admin, regulator, lender, viewer) na middleware ya `requireRole` ya upande wa seva kwenye njia zote zilizolindwa. Jedwali kamili la ufikiaji limetekelezwa. |
| NFR-SEC-02 | Hashing ya nywila | INATII | bcryptjs na raundi 10 za chumvi. Nywila zinafanywa hash wakati wa kuunda na kubadilisha. Maandishi wazi hayahifadhiwi wala kurudishwa katika majibu ya API. |
| NFR-SEC-03 | Utata wa nywila (herufi 8+, kubwa, ndogo, nambari, maalum) | INATII | Uthibitishaji wa regex kwenye mwisho wa kubadilisha nywila. Inatekelezwa upande wa seva. |
| NFR-SEC-04 | Kufungwa kwa akaunti baada ya majaribio 3 yaliyoshindwa | INATII | Kiwango cha majaribio 3 na kufungwa kwa dakika 15. Kihesabu cha majaribio yaliyoshindwa na kumalizika kwa kufungwa vinafuatiliwa katika hifadhidata. Kunarekodiwa katika ukaguzi. |
| NFR-SEC-05 | Urekodi wa kina wa ukaguzi | INATII | Operesheni zote za CRUD, matukio ya uthibitishaji, na simu za API zinarekodiwa katika jedwali la `audit_logs` na kitambulisho cha mtumiaji, kitendo, huluki, maelezo, IP, na muda. |
| NFR-SEC-06 | Ufuatiliaji wa anwani ya IP katika kumbukumbu za ukaguzi | INATII | `req.ip` inachukuliwa na `trust proxy` imewezeshwa. IP inahifadhiwa katika safu ya `ip_address` ya `audit_logs`. |
| NFR-SEC-07 | Maker-checker (kanuni ya macho-manne) | INATII | Mtiririko wa idhini inayosubiri kwa mabadiliko ya mkopaji na akaunti ya mikopo. Kuzuia kujidhinisha kunatekelezwa upande wa seva na HTTP 403. |
| NFR-SEC-08 | Kumalizika kwa nywila kwa siku 90 | INATII | Muda wa `passwordChangedAt` unakaguliwa wakati wa kuingia. Bendera ya `mustChangePassword` kwa kubadilisha kwa lazima. Mazungumzo ya kubadilisha nywila yanaonyeshwa kwa mtumiaji. |
| NFR-SEC-09 | Muda wa kikao kisichofanya kazi wa dakika 15 | INATII | Muda wa `lastActivity` unasasishwa kwa kila ombi. Kikao kinaharibiwa wakati kutofanya kazi kunazidi dakika 15 (ms 900,000). HTTP 440 inarudishwa. |
| ENT-01 | Uthibitishaji wa Hatua Nyingi wa TOTP | INATII | TOTP kupitia maktaba ya `otpauth`; miisho ya setup/verify/disable/login; sehemu za `mfaSecret` na `mfaEnabled` kwenye jedwali la watumiaji; ushirikiano kamili wa mtiririko wa kuingia. |
| ENT-02 | Ulinganishaji wa huluki zisizo kamili kwa kugundua nakala | INATII | Kiendelezi cha `pg_trgm` cha PostgreSQL kinawezeshwa wakati wa kuanza; utafutaji wa ulinganishaji wa trigram na kiwango ≥ 0.3; onyo la nakala kwenye usajili wa mkopaji. |
| ENT-03 | Msaidizi wa chatbot wa mwongozo kwa migogoro | INATII | Mtiririko wa mazungumzo wa hatua nyingi: aina ya suala → utafutaji wa mkopaji → uchaguzi wa akaunti → maelezo → kuwasilisha kwa moja kwa moja; i18n kamili ya EN/FR. |
| ENT-04 | Uthibitishaji wa tokeni ya OAuth 2.1 Bearer | INATII | Ruhusa ya client credentials; tokeni za JWT zilizosainiwa na HS256; kumalizika kwa saa 1; uthibitishaji maradufu (Bearer + X-API-Key) kwenye API ya nje. |
| ENT-05 | Uboreshaji wa bandwidth ndogo | INATII | Middleware ya `compression` ya gzip; ugawanyaji wa msimbo wa `React.lazy()` na fallback ya `Suspense` kwa sehemu zote za njia. |
| ENT-06 | Msaada wa kupakia kwa wingi wa XBRL/XML | INATII | Uchambuzi wa faili za XBRL/XML katika mwisho wa kupakia kwa wingi; frontend ya tabo (JSON/CSV + XBRL); muundo wa sampuli umetolewa. |
| ENT-07 | Mnyororo wa hash wa kumbukumbu za ukaguzi unaostahimili uharibifu | INATII | Mnyororo wa hash ya SHA-256 (safu za `previousHash`/`currentHash`); mwisho wa `GET /api/audit/verify-integrity`; beji ya uadilifu ya kuona kwenye ukurasa wa ufuatiliaji wa ukaguzi. |
| REQ-RET-01 | Uhifadhi wa Data | INATII | Sera za uhifadhi kwa kila nchi zinatekelezwa katika mamlaka zote 54 za Afrika (Ghana miaka 10, Ethiopia/Uganda/Liberia miaka 7, nyingine zinaweza kusanidiwa; kumbukumbu za ukaguzi miaka 10 kimataifa). Injini ya Utekelezaji wa Uhifadhi na kipanga ratiba cha moja kwa moja cha masaa 24 na kichochezi cha mwongozo cha admin pekee. SQL iliyowekwa parameta kupitia Drizzle ORM; majina ya jedwali yanathibitishwa dhidi ya orodha ya kuruhusiwa ya `VALID_TABLES`; thamani za nchi zinathibitishwa dhidi ya seti ya `VALID_COUNTRIES`. |
| ENT-11 | Utafutaji wa Kimataifa | INATII | Utafutaji wa huluki mbalimbali kwenye wakopaji, taasisi, na akaunti za mikopo kupitia mwisho wa `/api/global-search`. Chujio la hiari la nchi. Hakuna kufichua data nyeti zaidi ya kiwango cha ufikiaji wa mtumiaji aliyethibitishwa. |
| ENT-12 | Usalama wa Kupakia Faili | INATII | Kupakia kulingana na multer na vikomo vya ukubwa wa faili (picha 5MB, hati 10MB), uthibitishaji wa aina ya MIME, majina ya faili yaliyobadilishwa kinasibu, upatikanaji uliolindwa kwa uthibitishaji kupitia njia ya `/uploads`. Kupakia kote kunarekodiwa katika ukaguzi. |
| ENT-13 | Mazingira ya Maonyesho | INATII | Maonyesho ya wawekezaji na kadi za majukumu zilizosanidiwa. Bango la njano linaonyesha hali ya maonyesho. Inatumia miundombinu iliyopo ya uthibitishaji na uidhinishaji. Data ya kubuni pekee. |
| ENT-14 | Uchambuzi wa Kuona wa Dashibodi | INATII | Mwisho wa `GET /api/dashboard/chart-data` unalindwa na middleware ya `requireAuth`. Inarudisha data ya takwimu zilizokusanywa pekee (mwenendo wa kila mwezi, mgawanyo wa hali, mgawanyo wa aina, mgawanyo wa nchi); hakuna PII ghafi inayofichuliwa. Recharts inachora data upande wa mteja. Ramani ya SVG ya Afrika inatumia jiometri za nchi zilizofafanuliwa awali bila kupata data ya nje. Msaada wa hali ya giza kupitia kugundua vigeu vya CSS. |
| ENT-15 | Ziara ya Maonyesho ya Maingiliano | INATII | Kipengele cha ziara (`demo-tour.tsx`) kinafanya kazi kabisa upande wa mteja bila miisho ya ziada ya API. Uzinduzi wa moja kwa moja unadhibitiwa kupitia bendera ya sessionStorage (muktadha wa kuingia kwa maonyesho pekee). Hakuna data nyeti inayohifadhiwa au kusafirishwa. Msaada wa lugha nyingi katika lugha 5 za AU (EN/FR/PT/AR/SW). |
| SLA-RET-01 | SLA ya Utekelezaji wa Uhifadhi | INATII | Mzunguko wa utekelezaji wa moja kwa moja wa masaa 24 unahakikisha usimamizi wa wakati wa mzunguko wa maisha ya data. Kichochezi cha mwongozo kupitia `POST /api/retention-policies/enforce` (admin pekee, RBAC imelindwa). Vitendo vyote vya utekelezaji vinarekodiwa katika ukaguzi na maelezo kamili ya matokeo. |

---

## 11. Kushughulikia Ishara na Ustahimilivu

Programu inatekeleza kushughulikia ishara kwa uangalifu:

```typescript
process.on("SIGHUP", () => { /* piga kupuuza ishara ya hangup */ });
process.on("SIGPIPE", () => { /* piga kupuuza pipe iliyovunjika */ });
process.on("uncaughtException", (err) => { console.error("Uncaught exception:", err); });
process.on("unhandledRejection", (err) => { console.error("Unhandled rejection:", err); });
```

- SIGHUP inapuuzwa kuzuia kusimamishwa kunakochochewa na mtiririko wa kazi
- SIGPIPE inapuuzwa kuzuia kuanguka kwa pipe zilizovunjika
- Hitilafu zisizotarajiwa na kukataliwa kusikoshughulikiwa vinarekodiwa lakini havishiindishi mchakato

---

## 12. Mapungufu Yanayojulikana na Mapendekezo

### 12.1 Mapungufu ya Sasa

| Eneo | Mapungufu | Kiwango cha Hatari | Pendekezo |
|------|-----------|------------|----------------|
| Hifadhi ya Kikao | MemoryStore (si ya kudumu) | Wastani | Tumia Redis au hifadhi ya kikao ya PostgreSQL kwa makundi ya uzalishaji |
| Cookie Secure | Imewekwa kuwa `false` kwa chaguomsingi | Juu | Weka `cookie.secure = true` wakati HTTPS imesanidiwa |
| Kizuizi cha Kiwango | Hakijatekelezwa kwenye miisho ya API | Wastani | Ongeza middleware ya kizuizi cha kiwango (k.m., express-rate-limit) |
| CORS | Haijasanidiwa wazi | Chini | Sanidi vichwa vya CORS ikiwa frontend inahudumiwa kutoka asili tofauti |
| CSP | Hakuna vichwa vya Content Security Policy | Chini | Ongeza vichwa vya CSP kupitia middleware au proksi ya nyuma |
| Historia ya Nywila | Haifuatiliwi | Chini | Fuatilia hash za nywila za awali kuzuia kutumia tena |
| Makundi ya Vikao | MemoryStore ni ya nodi moja pekee | Juu | Tumia Redis kwa kutumia nodi nyingi |

### 12.2 Mapendekezo ya Uimarishaji wa Uzalishaji

1. **Wezesha HTTPS** na uweke `cookie.secure = true`
2. **Badilisha MemoryStore** na Redis kwa uhifadhi wa kikao katika mazingira ya nodi nyingi
3. **Ongeza kizuizi cha kiwango** kwenye kuingia na miisho ya API
4. **Tekeleza sera ya CORS** kulingana na muundo wa kutumia
5. **Ongeza vichwa vya Content Security Policy**
6. **Weka mkusanyiko wa kumbukumbu** (ELK stack, Datadog, n.k.)
7. **Wezesha SSL ya hifadhidata** na `sslmode=verify-full`
8. **Fanya majaribio ya kupenya** kabla ya kuanza uzalishaji
9. **Tekeleza usimbaji fiche wa hifadhidata** ikiwa inahitajika na mamlaka
10. **Kagua na ubadilishe** akreditesho na siri zote za chaguomsingi
11. **Tekeleza MFA** kwa majukumu ya admin na mdhibiti katika uzalishaji
12. **Badilisha funguo za kusaini JWT za OAuth** mara kwa mara

---

## 13. Mzunguko wa Maisha ya Data na Usalama wa Uhifadhi

### 13.1 Injini ya Utekelezaji wa Uhifadhi

Mfumo unajumuisha Injini ya Utekelezaji wa Uhifadhi ya moja kwa moja inayohusika na kutekeleza sera za mzunguko wa maisha ya data kwa mujibu wa mahitaji ya udhibiti ya kila nchi.

| Udhibiti | Utekelezaji |
|---------|---------------|
| Kipanga ratiba | Mzunguko wa moja kwa moja wa masaa 24; injini inafanya kazi mara moja kila masaa 24 |
| Kichochezi cha Mwongozo | `POST /api/retention-policies/enforce` — admin pekee, imelindwa na RBAC kupitia `requireRole("admin")` |
| Mahali pa Injini | `server/retention-enforcement.ts` |

### 13.2 Sera za Uhifadhi kwa Kila Nchi

Sera za uhifadhi zinaweza kusanidiwa kwa kila mamlaka katika nchi zote 54 za Afrika. Sera za chaguomsingi ni pamoja na:

| Nchi | Kipindi cha Uhifadhi | Maelezo |
|---------|-----------------|-------|
| Ghana | Miaka 10 | Inalingana na mahitaji ya Sheria ya Ulinzi wa Data ya Ghana |
| Ethiopia | Miaka 7 | Uhifadhi wa kawaida wa data ya kifedha |
| Uganda | Miaka 7 | Uhifadhi wa kawaida wa data ya kifedha |
| Liberia | Miaka 7 | Uhifadhi wa kawaida wa data ya kifedha |
| Nchi Nyingine za Afrika | Zinaweza kusanidiwa | Wasimamizi wanaweza kuweka sera za kila nchi kupitia jedwali la retention_policies |
| Kumbukumbu za Ukaguzi | Miaka 10 (kimataifa) | Inatumika kwa usawa katika mamlaka zote |

### 13.3 Kuzuia SQL Injection katika Injini ya Uhifadhi

Injini ya Utekelezaji wa Uhifadhi inatumia tabaka nyingi za ulinzi dhidi ya SQL injection:

| Udhibiti | Utekelezaji |
|---------|---------------|
| SQL Iliyowekwa Parameta | Inatumia templeti za tagi za `sql` za Drizzle ORM pekee — hakuna uingizaji wa herufi katika hoji |
| Uthibitishaji wa Jina la Jedwali | Majina ya jedwali yanathibitishwa dhidi ya orodha ya kuruhusiwa iliyoandikwa kwa ngumu (nambari ya kudumu ya `VALID_TABLES`); jina lolote la jedwali lisilo katika orodha ya kuruhusiwa linakataliwa |
| Uthibitishaji wa Thamani ya Nchi | Thamani za nchi zinathibitishwa dhidi ya seti ya `VALID_COUNTRIES` kabla ya kutumika katika hoji |
| Ushirikiano wa ORM | Hoji zote zinaundwa kupitia Drizzle ORM, ambayo inatekeleza utekelezaji wa hoji zilizowekwa parameta |

### 13.4 Urekodi wa Ukaguzi wa Vitendo vya Uhifadhi

Vitendo vyote vya utekelezaji wa uhifadhi vinarekodiwa kikamilifu katika ukaguzi:

- Kila mzunguko wa utekelezaji unaunda ingizo la kumbukumbu ya ukaguzi na aina ya kitendo ya `RETENTION_ENFORCEMENT`
- Matokeo yanajumuisha idadi ya rekodi zilizokaguliwa, zilizofutwa, na zilizohifadhiwa kwa kila jedwali na nchi
- Vichochezi vya mwongozo vinarekodi mtumiaji wa admin anayeanzisha
- Mzunguko wa moja kwa moja unarekodi mfumo kama mtendaji
- Maelezo kamili ya matokeo yanahifadhiwa katika sehemu ya `details` ya kumbukumbu ya ukaguzi

---

## 14. Uidhinishaji

| Jukumu | Jina | Saini | Tarehe |
|------|------|-----------|------|
| Afisa wa Usalama | | | |
| Kiongozi wa Kiufundi | | | |
| Afisa wa Utiifu | | | |
| Mwakilishi wa Mteja | | | |
