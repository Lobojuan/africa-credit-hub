# Hati ya Majaribio ya Kukubalika na Mtumiaji (UAT)

## Mfumo wa Kituo cha Kati cha Data na Daftari la Mikopo kwa Mamlaka Mbalimbali v1.2

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 1.2  
**Tarehe:** Machi 2026  
**Uainishaji:** Siri

---

## Yaliyomo

1. [Usanidi wa Mazingira ya Majaribio](#1-usanidi-wa-mazingira-ya-majaribio)
2. [Moduli ya Uthibitishaji](#2-moduli-ya-uthibitishaji)
3. [Moduli ya Dashibodi](#3-moduli-ya-dashibodi)
4. [Moduli ya Usimamizi wa Wakopaji](#4-moduli-ya-usimamizi-wa-wakopaji)
5. [Moduli ya Akaunti za Mikopo](#5-moduli-ya-akaunti-za-mikopo)
6. [Moduli ya Utafutaji wa Mikopo](#6-moduli-ya-utafutaji-wa-mikopo)
7. [Moduli ya Ripoti za Mikopo](#7-moduli-ya-ripoti-za-mikopo)
8. [Moduli ya Mchakato wa Maker-Checker](#8-moduli-ya-mchakato-wa-maker-checker)
9. [Moduli ya Usimamizi wa Migogoro](#9-moduli-ya-usimamizi-wa-migogoro)
10. [Moduli ya Hukumu za Mahakama](#10-moduli-ya-hukumu-za-mahakama)
11. [Moduli ya Usimamizi wa Ridhaa](#11-moduli-ya-usimamizi-wa-ridhaa)
12. [Moduli ya Usimamizi wa Taasisi](#12-moduli-ya-usimamizi-wa-taasisi)
13. [Moduli ya Malipo](#13-moduli-ya-malipo)
14. [Moduli ya Dawati la Msaada](#14-moduli-ya-dawati-la-msaada)
15. [Moduli ya Upakiaji wa Kundi](#15-moduli-ya-upakiaji-wa-kundi)
16. [Moduli ya Njia ya Ukaguzi](#16-moduli-ya-njia-ya-ukaguzi)
17. [Moduli ya Usimamizi wa Watumiaji](#17-moduli-ya-usimamizi-wa-watumiaji)
18. [Moduli ya Funguo za API](#18-moduli-ya-funguo-za-api)
19. [Moduli ya API ya Nje](#19-moduli-ya-api-ya-nje)
20. [Moduli ya Ripoti na Usafirishaji](#20-moduli-ya-ripoti-na-usafirishaji)
21. [Moduli ya Arifa](#21-moduli-ya-arifa)
22. [Moduli ya Kimataifa (i18n)](#22-moduli-ya-kimataifa-i18n)
23. [Moduli ya Mandhari](#23-moduli-ya-mandhari)
24. [Sahihi](#24-sahihi)
25. [Uboreshaji wa Biashara: Moduli ya MFA (ENT-01)](#25-uboreshaji-wa-biashara-moduli-ya-mfa-ent-01)
26. [Uboreshaji wa Biashara: Moduli ya Ulinganishaji wa Huluki kwa Ukadirio (ENT-02)](#26-uboreshaji-wa-biashara-moduli-ya-ulinganishaji-wa-huluki-kwa-ukadirio-ent-02)
27. [Uboreshaji wa Biashara: Moduli ya Chatbot ya Migogoro (ENT-03)](#27-uboreshaji-wa-biashara-moduli-ya-chatbot-ya-migogoro-ent-03)
28. [Uboreshaji wa Biashara: Moduli ya OAuth 2.1 (ENT-04)](#28-uboreshaji-wa-biashara-moduli-ya-oauth-21-ent-04)
29. [Uboreshaji wa Biashara: Moduli ya Uboreshaji wa Bandwidth Ndogo (ENT-05)](#29-uboreshaji-wa-biashara-moduli-ya-uboreshaji-wa-bandwidth-ndogo-ent-05)
30. [Uboreshaji wa Biashara: Moduli ya Upakiaji wa XBRL (ENT-06)](#30-uboreshaji-wa-biashara-moduli-ya-upakiaji-wa-xbrl-ent-06)
31. [Uboreshaji wa Biashara: Moduli ya Kumbukumbu za Ukaguzi Zinazostahimili Uharibifu (ENT-07)](#31-uboreshaji-wa-biashara-moduli-ya-kumbukumbu-za-ukaguzi-zinazostahimili-uharibifu-ent-07)
32. [Moduli ya Usimamizi wa Viwango vya Ubadilishaji](#32-moduli-ya-usimamizi-wa-viwango-vya-ubadilishaji)
33. [Moduli ya Utawala wa API](#33-moduli-ya-utawala-wa-api)
34. [Moduli ya Sera za Uhifadhi wa Data](#34-moduli-ya-sera-za-uhifadhi-wa-data)
35. [Moduli ya Utafutaji wa Jumla](#35-moduli-ya-utafutaji-wa-jumla)
36. [Moduli ya Picha za Kitambulisho na Upakiaji wa Nyaraka](#36-moduli-ya-picha-za-kitambulisho-na-upakiaji-wa-nyaraka)
37. [Moduli ya Mazingira ya Maonyesho](#37-moduli-ya-mazingira-ya-maonyesho)
38. [Moduli ya Kubadili Lugha kwenye Ukurasa wa Kuingia](#38-moduli-ya-kubadili-lugha-kwenye-ukurasa-wa-kuingia)

---

## 1. Usanidi wa Mazingira ya Majaribio

### 1.1 Taarifa za Mfumo

| Kipengele | Maelezo |
|------|--------|
| Programu | Mfumo wa Kituo cha Kati cha Data na Daftari la Mikopo kwa Mamlaka Mbalimbali v1.2 |
| Hifadhidata | PostgreSQL yenye meza 21 |
| Majukumu ya Watumiaji | Admin, Regulator, Lender, Viewer |
| Sarafu Zinazotumika | Sarafu 42+ za Afrika pamoja na USD, EUR, GBP |
| Uboreshaji wa Biashara | MFA, Fuzzy Matching, Dispute Chatbot, OAuth 2.1, Low-Bandwidth, XBRL Upload, Tamper-Evident Audit, Exchange Rate Management, API Administration, Data Retention Policies, Global Search, ID Photos & Documents, Demo Environment |
| Mamlaka | Nchi zote 54 za Afrika |
| Lugha | English, French, Portuguese |
| Data ya Msingi | Wakopaji 102K+, akaunti za mikopo 172K+, rekodi 120K za historia ya malipo, migogoro 3,218, hukumu za mahakama 2,147 |

### 1.2 Vitambulisho vya Msingi

| Jina la Mtumiaji | Nenosiri | Jukumu | Taasisi |
|----------|----------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Regulator | NBE |
| cbe_user | cbe123 | Lender | CBE |
| dashen_user | dashen123 | Lender | Dashen |
| awash_user | awash123 | Lender | Awash |

### 1.3 Jedwali la Ufikiaji wa Majukumu

| Kipengele | Admin | Regulator | Lender | Viewer |
|---------|-------|-----------|--------|--------|
| Usimamizi wa Watumiaji | Ndiyo | Hapana | Hapana | Hapana |
| Usimamizi wa Taasisi | Ndiyo | Hapana | Hapana | Hapana |
| Usimamizi wa Funguo za API | Ndiyo | Hapana | Hapana | Hapana |
| Malipo | Ndiyo | Ndiyo | Hapana | Hapana |
| Njia ya Ukaguzi | Ndiyo | Ndiyo | Hapana | Hapana |
| Kupitisha/Kukataa Mabadiliko | Ndiyo | Ndiyo | Hapana | Hapana |
| Hukumu za Mahakama (kuunda) | Ndiyo | Ndiyo | Hapana | Hapana |
| Upakiaji wa Kundi | Ndiyo | Hapana | Ndiyo | Hapana |
| Wakopaji/Akaunti | Ndiyo | Ndiyo | Ndiyo | Ndiyo |
| Migogoro | Ndiyo | Ndiyo | Ndiyo | Ndiyo |
| Ridhaa | Ndiyo | Ndiyo | Ndiyo | Ndiyo |
| Dashibodi/Ripoti | Ndiyo | Ndiyo | Ndiyo | Ndiyo |
| Dawati la Msaada | Ndiyo | Ndiyo | Ndiyo | Ndiyo |

### 1.4 Mahitaji ya Awali ya Mazingira ya Majaribio

- Programu imewekwa na inaweza kufikiwa kupitia kivinjari
- Hifadhidata ya PostgreSQL imejazwa na data ya majaribio
- Akaunti zote za watumiaji wa msingi zinafanya kazi na hazijafungwa
- Muunganisho wa mtandao kwenye URL ya programu
- Kivinjari cha kisasa (Chrome, Firefox, Edge, au Safari)

---

## 2. Moduli ya Uthibitishaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AUTH-001 | Uthibitishaji | Kuingia kwa mafanikio na vitambulisho sahihi | Programu inapatikana, akaunti ya mtumiaji inafanya kazi | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji: `admin`. 3. Ingiza nenosiri: `admin123`. 4. Bonyeza kitufe cha "Login". | Mtumiaji amethibitishwa na ameelekezwa kwenye ukurasa wa Dashibodi. Kipindi kimeanzishwa. | | NFR-SEC-01 |
| TC-AUTH-002 | Uthibitishaji | Kushindwa kuingia kwa nenosiri batili | Programu inapatikana, akaunti ya admin inafanya kazi | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji: `admin`. 3. Ingiza nenosiri: `wrongpassword`. 4. Bonyeza "Login". | Ujumbe wa hitilafu unaonyeshwa: "Invalid credentials. 2 attempt(s) remaining." Kuingia kunashindwa. | | NFR-SEC-01 |
| TC-AUTH-003 | Uthibitishaji | Kushindwa kuingia kwa jina la mtumiaji lisilo | Programu inapatikana | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji: `nonexistent_user`. 3. Ingiza nenosiri: `any_pass`. 4. Bonyeza "Login". | Ujumbe wa hitilafu unaonyeshwa: "Invalid credentials." Kuingia kunashindwa. | | NFR-SEC-01 |
| TC-AUTH-004 | Uthibitishaji | Kufungwa kwa akaunti baada ya majaribio 3 yasiyofanikiwa | Akaunti ya Admin inafanya kazi, hakuna majaribio ya awali yaliyoshindwa | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji: `admin`, nenosiri lisilo sahihi. Bonyeza "Login". 3. Rudia hatua ya 2 mara mbili zaidi (jumla ya kushindwa 3). | Baada ya kushindwa kwa 3, ujumbe: "Account locked for 15 minutes after 3 failed attempts." Akaunti imefungwa. | | NFR-SEC-03 |
| TC-AUTH-005 | Uthibitishaji | Jaribio la kuingia kwenye akaunti iliyofungwa | Akaunti ya Admin imefungwa (kutoka TC-AUTH-004) | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji: `admin`, nenosiri sahihi: `admin123`. 3. Bonyeza "Login". | Ujumbe wa hitilafu unaonyeshwa: "Account locked. Try again in X minute(s)." Kuingia kumekataliwa. | | NFR-SEC-03 |
| TC-AUTH-006 | Uthibitishaji | Kuingia kwa akaunti iliyosimamishwa | Hali ya akaunti ya mtumiaji imewekwa kuwa "suspended" | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza vitambulisho vya mtumiaji aliyesimamishwa. 3. Bonyeza "Login". | Ujumbe wa hitilafu: "Account is suspended." Kuingia kumekataliwa. | | NFR-SEC-02 |
| TC-AUTH-007 | Uthibitishaji | Kuingia kwa akaunti iliyozimwa | Hali ya akaunti ya mtumiaji imewekwa kuwa "deactivated" | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza vitambulisho vya mtumiaji aliyezimwa. 3. Bonyeza "Login". | Ujumbe wa hitilafu: "Account is deactivated." Kuingia kumekataliwa. | | NFR-SEC-02 |
| TC-AUTH-008 | Uthibitishaji | Utekelezaji wa sera ya nenosiri - fupi sana | Mtumiaji yuko kwenye kisanduku cha kubadili nenosiri | 1. Ingia. 2. Fungua kisanduku cha kubadili nenosiri. 3. Ingiza nenosiri la sasa. 4. Ingiza nenosiri jipya: `Abc1!` (fupi sana). 5. Bonyeza "Change Password". | Ujumbe wa hitilafu: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character." | | NFR-SEC-04 |
| TC-AUTH-009 | Uthibitishaji | Utekelezaji wa sera ya nenosiri - herufi kubwa haipo | Mtumiaji yuko kwenye kisanduku cha kubadili nenosiri | 1. Ingiza nenosiri la sasa. 2. Ingiza nenosiri jipya: `abcdefg1!` (hakuna herufi kubwa). 3. Bonyeza "Change Password". | Ujumbe wa hitilafu kuhusu mahitaji ya ugumu wa nenosiri. | | NFR-SEC-04 |
| TC-AUTH-010 | Uthibitishaji | Utekelezaji wa sera ya nenosiri - herufi maalum haipo | Mtumiaji yuko kwenye kisanduku cha kubadili nenosiri | 1. Ingiza nenosiri la sasa. 2. Ingiza nenosiri jipya: `Abcdefg1` (hakuna herufi maalum). 3. Bonyeza "Change Password". | Ujumbe wa hitilafu kuhusu mahitaji ya ugumu wa nenosiri. | | NFR-SEC-04 |
| TC-AUTH-011 | Uthibitishaji | Kubadili nenosiri kwa mafanikio | Mtumiaji ameingia | 1. Fungua kisanduku cha kubadili nenosiri. 2. Ingiza nenosiri la sasa kwa usahihi. 3. Ingiza nenosiri jipya linalokidhi mahitaji yote (k.m., `NewPass1!`). 4. Bonyeza "Change Password". | Ujumbe wa mafanikio. Nenosiri limesasishwa. Rekodi ya ukaguzi imeundwa kwa PASSWORD_CHANGE. | | NFR-SEC-04 |
| TC-AUTH-012 | Uthibitishaji | Muda wa kipindi umekwisha baada ya dakika 15 bila shughuli | Mtumiaji ameingia | 1. Ingia kwa mafanikio. 2. Usishirikiane na programu kwa dakika 15+. 3. Jaribu kitendo chochote (k.m., nenda kwenye ukurasa). | Mtumiaji ametolewa nje moja kwa moja. Ameelekezwa kwenye ukurasa wa kuingia. | | NFR-SEC-09 |
| TC-AUTH-013 | Uthibitishaji | Kutoka nje kwa mafanikio | Mtumiaji ameingia | 1. Bonyeza kitufe/kiungo cha kutoka nje. | Kipindi cha mtumiaji kimeondolewa. Ameelekezwa kwenye ukurasa wa kuingia. Rekodi ya ukaguzi kwa LOGOUT imeundwa. | | NFR-SEC-01 |
| TC-AUTH-014 | Uthibitishaji | Arifa ya kumalizika muda wa nenosiri (sera ya siku 90) | Mtumiaji ana nenosiri la zaidi ya siku 90 (passwordChangedAt > siku 90 iliyopita) | 1. Ingia na mtumiaji aliyeathiriwa. | Kuingia kunafanikiwa. Bendera ya passwordExpired inarudi kama true. Onyo la kubadili nenosiri linaonyeshwa. | | NFR-SEC-04 |
| TC-AUTH-015 | Uthibitishaji | Lazima abadili nenosiri kwenye kuingia kwa mara ya kwanza | Akaunti ya mtumiaji ina mustChangePassword = true | 1. Ingia na mtumiaji aliyeathiriwa. | Kuingia kunafanikiwa lakini bendera ya passwordExpired ni true. Mtumiaji anadaiwa kubadili nenosiri. | | NFR-SEC-04 |
| TC-AUTH-016 | Uthibitishaji | Uthibitishaji wa vitambulisho vilivyokosekana | Programu inapatikana | 1. Nenda kwenye ukurasa wa kuingia. 2. Acha sehemu za jina la mtumiaji na nenosiri tupu. 3. Bonyeza "Login". | Ujumbe wa hitilafu: "Username and password required." | | NFR-SEC-01 |

---

## 3. Moduli ya Dashibodi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DASH-001 | Dashibodi | Kuonyesha kadi 8 za takwimu kwenye dashibodi | Mtumiaji ameingia | 1. Nenda kwenye Dashibodi (`/`). 2. Angalia kadi za takwimu zinazoonyeshwa. | Kadi 8 za takwimu zinaonekana: Total Borrowers, Credit Accounts, Outstanding, Delinquent, Defaults, Inquiries, Pending Approvals, Open Disputes. Kila moja inaonyesha thamani ya nambari. | | FR-REG-01 |
| TC-DASH-002 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Total Borrowers | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Total Borrowers". | Droo/karatasi ya maelezo inafunguka ikionyesha orodha ya wakopaji. | | FR-REG-01 |
| TC-DASH-003 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Credit Accounts | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Credit Accounts". | Droo/karatasi ya maelezo inafunguka ikionyesha data za akaunti za mikopo. | | FR-REG-01 |
| TC-DASH-004 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Outstanding | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Outstanding". | Droo/karatasi ya maelezo inafunguka ikionyesha data za salio zilizobaki. | | FR-REG-01 |
| TC-DASH-005 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Delinquent | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Delinquent". | Droo/karatasi ya maelezo inafunguka ikionyesha akaunti zilizochelewa. | | FR-REG-02 |
| TC-DASH-006 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Defaults | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Defaults". | Droo/karatasi ya maelezo inafunguka ikionyesha akaunti zilizoshindwa kulipa. | | FR-REG-02 |
| TC-DASH-007 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Inquiries | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Inquiries". | Droo/karatasi ya maelezo inafunguka ikionyesha maswali ya hivi karibuni ya mikopo. | | FR-CR-01 |
| TC-DASH-008 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Pending Approvals | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Pending Approvals". | Droo/karatasi ya maelezo inafunguka ikionyesha vipengele vinavyosubiri idhini. | | FR-COL-01 |
| TC-DASH-009 | Dashibodi | Kadi ya takwimu - Kuchimba kwa Open Disputes | Mtumiaji ameingia, kwenye Dashibodi | 1. Bonyeza kadi ya takwimu ya "Open Disputes". | Droo/karatasi ya maelezo inafunguka ikionyesha migogoro iliyo wazi. | | FR-CON-04 |
| TC-DASH-010 | Dashibodi | Vipengele vya orodha ya droo vinaelekeza kwenye kurasa za maelezo | Mtumiaji ameingia, droo ya kuchimba imefunguliwa | 1. Bonyeza kipengele cha mkopaji katika droo ya maelezo ya Total Borrowers. | Inaelekeza kwenye ukurasa wa maelezo ya mkopaji (`/borrowers/:id`). | | FR-COL-01 |
| TC-DASH-011 | Dashibodi | Sehemu ya shughuli za hivi karibuni | Mtumiaji ameingia, kwenye Dashibodi | 1. Angalia sehemu ya shughuli za hivi karibuni kwenye Dashibodi. | Shughuli za hivi karibuni za mfumo zinaonyeshwa na mihuri ya wakati na maelezo. | | FR-REG-01 |

---

## 4. Moduli ya Usimamizi wa Wakopaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BOR-001 | Usimamizi wa Wakopaji | Kusajili mkopaji binafsi | Mtumiaji ameingia na ruhusa za kuunda | 1. Nenda kwenye ukurasa wa Borrowers (`/borrowers`). 2. Bonyeza "Add Borrower" au sawa. 3. Chagua aina: Individual. 4. Jaza: First Name, Last Name, National ID, Date of Birth, Gender, Phone, Email, Address, City, Region, TIN Number. 5. Wasilisha. | Usajili wa mkopaji umewasilishwa kwa idhini ya maker-checker. Ujumbe wa mafanikio unaonyeshwa. Rekodi ya ukaguzi imeundwa. | | FR-COL-01 |
| TC-BOR-002 | Usimamizi wa Wakopaji | Kusajili mkopaji wa shirika | Mtumiaji ameingia na ruhusa za kuunda | 1. Nenda kwenye ukurasa wa Borrowers. 2. Bonyeza "Add Borrower". 3. Chagua aina: Corporate. 4. Jaza: Company Name, Business Reg Number, National ID, Sector, Contact Email, Contact Phone, Address, TIN Number. 5. Wasilisha. | Usajili wa mkopaji wa shirika umewasilishwa kwa idhini ya maker-checker. Ujumbe wa mafanikio unaonyeshwa. | | FR-COL-01 |
| TC-BOR-003 | Usimamizi wa Wakopaji | Kutafuta wakopaji kwa jina | Mtumiaji ameingia, data ya wakopaji ipo | 1. Nenda kwenye ukurasa wa Borrowers. 2. Ingiza jina la mkopaji katika sehemu ya utafutaji. 3. Bonyeza Enter au bonyeza Search. | Wakopaji wanaolingana wanaonyeshwa katika jedwali la matokeo. | | FR-COL-02 |
| TC-BOR-004 | Usimamizi wa Wakopaji | Kutafuta wakopaji kwa National ID | Mtumiaji ameingia, data ya wakopaji ipo | 1. Nenda kwenye ukurasa wa Borrowers. 2. Ingiza National ID katika sehemu ya utafutaji. 3. Tafuta. | Mkopaji/wakopaji wanaolingana wanaonyeshwa. | | FR-COL-02 |
| TC-BOR-005 | Usimamizi wa Wakopaji | Kuweka alama ya PEP kwa mkopaji | Mtumiaji ameingia na ruhusa za kuunda | 1. Nenda kwenye fomu ya Add Borrower. 2. Jaza sehemu zinazohitajika. 3. Washa "Politically Exposed Person" (PEP) kuwa ON. 4. Ingiza maelezo ya PEP. 5. Wasilisha. | Mkopaji amewasilishwa na isPep = true na pepDetails imejazwa. Kiashiria cha PEP kinaonekana kwenye rekodi ya mkopaji. | | FR-COL-03 |
| TC-BOR-006 | Usimamizi wa Wakopaji | Kuona ukurasa wa maelezo ya mkopaji | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye ukurasa wa Borrowers. 2. Bonyeza safu ya mkopaji ili kuelekea maelezo. | Ukurasa wa maelezo ya mkopaji (`/borrowers/:id`) unapakia na taarifa kamili za mkopaji: data ya kibinafsi/kampuni, akaunti za mikopo, maswali, hukumu za mahakama, rekodi za ridhaa. | | FR-COL-01 |
| TC-BOR-007 | Usimamizi wa Wakopaji | Kuunganisha wahusika | Mtumiaji ameingia na ruhusa za kuunda | 1. Nenda kwenye fomu ya Add Borrower. 2. Jaza sehemu zinazohitajika. 3. Weka Related Borrower ID na Relationship Type (moja ya aina 7: Spouse, Guarantor, Director, Shareholder, Beneficial Owner, Subsidiary, Parent Company). 4. Wasilisha. | Mkopaji ameundwa na relatedBorrowerId na relationshipType zimejazwa. Wahusika wanaonekana kwenye maelezo ya mkopaji. Aina zote 7 za uhusiano zinapatikana katika menyu. | | FR-COL-04 |
| TC-BOR-008 | Usimamizi wa Wakopaji | Kusasisha mkopaji kunaanzisha maker-checker | Mtumiaji ameingia | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Hariri sehemu (k.m., nambari ya simu). 3. Wasilisha sasisha. | Sasisha imewasilishwa kwa idhini ya maker-checker (rekodi ya pending_approvals imeundwa na action: UPDATE). Mtumiaji anaona ujumbe wa uthibitisho. | | FR-COL-01 |
| TC-BOR-009 | Usimamizi wa Wakopaji | Kuzuia National ID inayojirudia | Mtumiaji ameingia | 1. Nenda kwenye Add Borrower. 2. Ingiza National ID ambayo tayari ipo kwenye mfumo. 3. Wasilisha. | Ujumbe wa hitilafu unaoonyesha National ID inayojirudia. Usajili umekataliwa. | | FR-COL-01 |
| TC-BOR-010 | Usimamizi wa Wakopaji | Kurasa kwenye orodha ya wakopaji | Mtumiaji ameingia, wakopaji wengi wapo | 1. Nenda kwenye ukurasa wa Borrowers. 2. Angalia vidhibiti vya kurasa. 3. Nenda kwenye ukurasa wa 2. | Ukurasa unapakia seti inayofuata ya wakopaji. Vidhibiti vya kurasa vinaonyesha nambari sahihi za kurasa. | | FR-COL-02 |
| TC-BOR-011 | Usimamizi wa Wakopaji | Sehemu za elimu na ajira | Mtumiaji ameingia | 1. Nenda kwenye Add Borrower. 2. Jaza Education Level, Education Institution, Employment History. 3. Wasilisha. | Mkopaji amewasilishwa na data ya elimu na ajira imehifadhiwa. | | FR-COL-01 |
| TC-BOR-012 | Usimamizi wa Wakopaji | Kuona wakopaji wanaohusiana | Mtumiaji ameingia, mkopaji ana wahusika | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji ambaye ana relatedBorrowerId iliyowekwa. 2. Angalia sehemu ya wahusika. | Wakopaji wanaohusiana wanaonyeshwa na aina yao ya uhusiano. | | FR-COL-04 |

---

## 5. Moduli ya Akaunti za Mikopo

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CA-001 | Akaunti za Mikopo | Kuunda akaunti ya mkopo | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye ukurasa wa Credit Accounts (`/credit-accounts`). 2. Bonyeza "Add Credit Account". 3. Jaza: Borrower ID, Lender Institution, Account Number, Account Type, Original Amount, Current Balance, Currency, Interest Rate, Disbursement Date, Maturity Date. 4. Wasilisha. | Kuunda akaunti ya mkopo kumewasilishwa kwa idhini ya maker-checker. Ujumbe wa mafanikio. | | FR-CR-01 |
| TC-CA-002 | Akaunti za Mikopo | Msaada wa sarafu nyingi (ETB) | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Chagua sarafu: ETB. 3. Wasilisha. | Akaunti imeundwa na currency = ETB. Kiasi kinaonyeshwa katika umbizo la Ethiopian Birr. | | FR-CR-02 |
| TC-CA-003 | Akaunti za Mikopo | Msaada wa sarafu nyingi (GHS) | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Chagua sarafu: GHS. 3. Wasilisha. | Akaunti imeundwa na currency = GHS. Kiasi kinaonyeshwa katika umbizo la Ghanaian Cedi. | | FR-CR-02 |
| TC-CA-004 | Akaunti za Mikopo | Msaada wa sarafu nyingi (UGX) | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Chagua sarafu: UGX. 3. Wasilisha. | Akaunti imeundwa na currency = UGX. Kiasi kinaonyeshwa katika umbizo la Ugandan Shilling. | | FR-CR-02 |
| TC-CA-005 | Akaunti za Mikopo | Msaada wa sarafu nyingi (LRD) | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Chagua sarafu: LRD. 3. Wasilisha. | Akaunti imeundwa na currency = LRD. Kiasi kinaonyeshwa katika umbizo la Liberian Dollar. | | FR-CR-02 |
| TC-CA-006 | Akaunti za Mikopo | Bendera ya mkopo bila riba | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Washa "Interest Free" kuwa true. 3. Wasilisha. | Akaunti imeundwa na isInterestFree = true. Sehemu ya kiwango cha riba inaweza kuzimwa/kufichwa. | | FR-SPEC-03 |
| TC-CA-007 | Akaunti za Mikopo | Usanidi wa kipindi cha neema | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Weka Grace Period Months kuwa 6. 3. Wasilisha. | Akaunti imeundwa na gracePeriodMonths = 6. | | FR-SPEC-04 |
| TC-CA-008 | Akaunti za Mikopo | Ufuatiliaji wa idadi ya urekebishaji | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Weka Restructure Count kuwa 2. 3. Wasilisha. | Akaunti imeundwa na restructureCount = 2. | | FR-SPEC-05 |
| TC-CA-009 | Akaunti za Mikopo | Thamani za hali ya akaunti | Mtumiaji ameingia, akaunti zenye hali mbalimbali zipo | 1. Nenda kwenye ukurasa wa Credit Accounts. 2. Angalia akaunti zenye hali tofauti. | Hali zinaonyeshwa kwa usahihi: current, delinquent, default, closed, restructured, written_off. Kila hali inatofautiana kwa kuonekana. | | FR-CR-01 |
| TC-CA-010 | Akaunti za Mikopo | Kuona historia ya malipo (gridi ya vipindi 12) | Mtumiaji ameingia, akaunti ya mkopo yenye historia ya malipo ipo | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Angalia akaunti ya mkopo. 3. Panua historia ya malipo. | Gridi ya historia ya malipo ya vipindi 12 inaonyeshwa ikionyesha kipindi, kiasi kinachostahili, kiasi kilicholipwa, hali (on_time/late/missed/partial), na siku za kuchelewa. | | FR-CR-08 |
| TC-CA-011 | Akaunti za Mikopo | Taarifa za dhamana | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Weka Collateral Type (k.m., "Property") na Collateral Value. 3. Wasilisha. | Akaunti imeundwa na aina ya dhamana na thamani zimehifadhiwa. | | FR-CR-01 |
| TC-CA-012 | Akaunti za Mikopo | Ufuatiliaji wa tarehe ya kuandikwa deni | Mtumiaji ameingia | 1. Unda akaunti ya mkopo na status = written_off. 2. Weka Written Off Date. 3. Wasilisha. | Akaunti imeundwa na writtenOffDate imejazwa. | | FR-CR-01 |
| TC-CA-013 | Akaunti za Mikopo | Ufuatiliaji wa tarehe ya kurudishwa | Mtumiaji ameingia | 1. Unda akaunti ya mkopo. 2. Weka Reinstated Date. 3. Wasilisha. | Akaunti imeundwa na reinstatedDate imejazwa. | | FR-CR-01 |
| TC-CA-014 | Akaunti za Mikopo | Kusasisha akaunti ya mkopo kunaanzisha maker-checker | Mtumiaji ameingia, akaunti ya mkopo ipo | 1. Nenda kwenye akaunti ya mkopo. 2. Hariri sehemu. 3. Wasilisha sasisha. | Sasisha imewasilishwa kwa idhini ya maker-checker. | | FR-COL-01 |
| TC-CA-015 | Akaunti za Mikopo | Kuchuja akaunti kwa mkopaji | Mtumiaji ameingia, mkopaji ana akaunti za mikopo | 1. Nenda kwenye Credit Accounts na kichujio cha borrowerId. | Akaunti za mikopo za mkopaji aliyebainishwa pekee zinaonyeshwa. | | FR-CR-01 |

---

## 6. Moduli ya Utafutaji wa Mikopo

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CS-001 | Utafutaji wa Mikopo | Utafutaji wa mkopo wa mkopaji mmoja | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye ukurasa wa Credit Search (`/search`). 2. Ingiza kitambulisho cha mkopaji (National ID au jina). 3. Chagua madhumuni ya swali (k.m., "new_credit"). 4. Thibitisha ridhaa imetolewa. 5. Bonyeza "Search". | Swali la mkopo limeundwa. Matokeo ya utafutaji yanaonyeshwa na taarifa za mkopaji na muhtasari wa mkopo. Rekodi ya ukaguzi imeundwa. | | FR-CR-01 |
| TC-CS-002 | Utafutaji wa Mikopo | Utafutaji wa mkopo kwa wingi (vitambulisho vingi) | Mtumiaji ameingia, wakopaji wengi wapo | 1. Nenda kwenye ukurasa wa Credit Search. 2. Tumia kipengele cha utafutaji wa wingi. 3. Ingiza vitambulisho vingi vya wakopaji. 4. Wasilisha. | Utafutaji wa mkopo wa wingi umefanywa. Matokeo yamerudi kwa wakopaji wote waliolingana. | | FR-CR-03 |
| TC-CS-003 | Utafutaji wa Mikopo | Utafutaji wa mkopo bila matokeo | Mtumiaji ameingia | 1. Nenda kwenye ukurasa wa Credit Search. 2. Ingiza kitambulisho cha mkopaji kisichokuwepo. 3. Tafuta. | Ujumbe unaofaa wa "No results found" unaonyeshwa. | | FR-CR-01 |
| TC-CS-004 | Utafutaji wa Mikopo | Ufuatiliaji wa ridhaa kwenye swali | Mtumiaji ameingia | 1. Fanya utafutaji wa mkopo. 2. Weka alama ya ridhaa imetolewa. 3. Wasilisha. | Rekodi ya swali la mkopo imeundwa na consentProvided = true. | | FR-CON-01 |
| TC-CS-005 | Utafutaji wa Mikopo | Kuelekeza kwenye ripoti ya mkopo kutoka matokeo ya utafutaji | Mtumiaji ameingia, utafutaji umekamilika na matokeo | 1. Fanya utafutaji wa mkopo. 2. Bonyeza matokeo kuona ripoti ya mkopo. | Inaelekeza kwenye ukurasa wa ripoti ya mkopo (`/credit-report/:borrowerId`). | | FR-CR-06 |

---

## 7. Moduli ya Ripoti za Mikopo

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RPT-001 | Ripoti za Mikopo | Kutengeneza ripoti ya mkopo | Mtumiaji ameingia, mkopaji mwenye akaunti yupo | 1. Nenda kwenye ukurasa wa Credit Report (`/credit-report/:borrowerId`). 2. Chagua madhumuni. 3. Tengeneza ripoti. | Ripoti ya mkopo imetengenezwa na: taarifa za mkopaji, akaunti za mkopo, alama ya mkopo (300-850), misimbo ya sababu, nambari ya mfululizo (CR-{YEAR}-{ID}), historia ya maswali. | | FR-CR-06 |
| TC-RPT-002 | Ripoti za Mikopo | Uhesabuji wa alama ya mkopo (kiwango cha 300-850) | Mkopaji ana hali mchanganyiko za akaunti | 1. Tengeneza ripoti ya mkopo kwa mkopaji mwenye akaunti za delinquent na current. | Alama ya mkopo iko ndani ya kiwango cha 300-850. Alama inaonyesha afya ya akaunti (akaunti za delinquent zinapunguza alama). | | FR-CR-06 |
| TC-RPT-003 | Ripoti za Mikopo | Misimbo ya sababu kwenye ripoti ya mkopo | Mkopaji ana akaunti za delinquent | 1. Tengeneza ripoti ya mkopo kwa mkopaji mwenye akaunti za delinquent. | Msimbo wa sababu "DELINQUENT_ACCOUNTS" unaonekana katika ripoti. | | FR-CR-06 |
| TC-RPT-004 | Ripoti za Mikopo | Misimbo ya sababu - akaunti zilizoandikwa deni | Mkopaji ana akaunti zilizoandikwa deni | 1. Tengeneza ripoti ya mkopo. | Msimbo wa sababu "WRITTEN_OFF_ACCOUNTS" unaonekana. | | FR-CR-06 |
| TC-RPT-005 | Ripoti za Mikopo | Misimbo ya sababu - akaunti zilizorekebishwa | Mkopaji ana akaunti zilizorekebishwa | 1. Tengeneza ripoti ya mkopo. | Msimbo wa sababu "RESTRUCTURED_ACCOUNTS" unaonekana. | | FR-CR-06 |
| TC-RPT-006 | Ripoti za Mikopo | Misimbo ya sababu - wingi wa maswali | Mkopaji ana maswali mengi ya hivi karibuni | 1. Tengeneza ripoti ya mkopo. | Msimbo wa sababu "HIGH_INQUIRY_VOLUME" unaonekana. | | FR-CR-06 |
| TC-RPT-007 | Ripoti za Mikopo | Misimbo ya sababu - hukumu za mahakama zipo | Mkopaji ana hukumu hai za mahakama | 1. Tengeneza ripoti ya mkopo. | Msimbo wa sababu "COURT_JUDGMENTS_PRESENT" unaonekana. | | FR-CR-06 |
| TC-RPT-008 | Ripoti za Mikopo | Misimbo ya sababu - rekodi bora ya malipo | Mkopaji ana akaunti zote za current | 1. Tengeneza ripoti ya mkopo kwa mkopaji mwenye akaunti za hali ya "current" pekee. | Msimbo wa sababu "EXCELLENT_PAYMENT_RECORD" au "STRONG_REPAYMENT_HISTORY" unaonekana. Alama ya mkopo ya juu. | | FR-CR-06 |
| TC-RPT-009 | Ripoti za Mikopo | Uundaji wa nambari ya mfululizo | Mtumiaji anatengeneza ripoti ya mkopo | 1. Tengeneza ripoti ya mkopo. 2. Angalia nambari ya mfululizo. | Nambari ya mfululizo inafuata umbizo: CR-{YEAR}-{UNIQUE_ID}. Nambari ya mfululizo ni ya kipekee. Rekodi imeundwa katika jedwali la credit_report_logs. | | FR-CR-06 |
| TC-RPT-010 | Ripoti za Mikopo | Kuchapisha ripoti ya mkopo | Ripoti ya mkopo inaonyeshwa | 1. Tengeneza ripoti ya mkopo. 2. Bonyeza kitufe cha "Print". | Kisanduku cha kuchapisha cha kivinjari kinafunguka. Ripoti imeandaliwa kwa uchapishaji ikiwa na kichwa, taarifa za mkopaji, akaunti, alama, nambari ya mfululizo, na kijachini cha kanusho. | | FR-CR-06 |

---

## 8. Moduli ya Mchakato wa Maker-Checker

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-MC-001 | Maker-Checker | Kuunda mkopaji kunaunda idhini inayosubiri | Mtumiaji ameingia kama Lender | 1. Nenda kwenye Borrowers. 2. Bonyeza "Add Borrower". 3. Jaza sehemu zinazohitajika. 4. Wasilisha. | Rekodi ya pending_approvals imeundwa na entityType: "borrower", action: "CREATE", status: "pending". Ujumbe wa mafanikio unaonyesha idhini ya maker-checker inahitajika. | | FR-COL-01 |
| TC-MC-002 | Maker-Checker | Idhini inayosubiri inaonekana kwa Admin | Idhini inayosubiri ipo (kutoka TC-MC-001) | 1. Ingia kama `admin`. 2. Nenda kwenye Pending Approvals. | Idhini inayosubiri inaonekana katika orodha ikionyesha aina ya huluki, kitendo, ombi la anayeomba, na tarehe ya kuwasilisha. | | FR-COL-01 |
| TC-MC-003 | Maker-Checker | Kupitisha ombi | Mtumiaji wa Admin ameingia, idhini inayosubiri ipo na mtumiaji TOFAUTI | 1. Nenda kwenye Pending Approvals. 2. Bonyeza idhini inayosubiri. 3. Angalia data iliyowasilishwa. 4. Bonyeza "Approve". | Idhini imeidhinishwa. Rekodi imeundwa/kusasishwa katika hifadhidata. Hali inabadilika kuwa "approved". Arifa imetumwa kwa anayeomba. | | FR-COL-01 |
| TC-MC-004 | Maker-Checker | Kukataa ombi na maelezo | Mtumiaji wa Admin ameingia, idhini inayosubiri ipo | 1. Nenda kwenye Pending Approvals. 2. Bonyeza idhini inayosubiri. 3. Ingiza maelezo ya ukataji. 4. Bonyeza "Reject". | Idhini imekataliwa. Hali inabadilika kuwa "rejected". Maelezo ya ukaguzi yamehifadhiwa. Rekodi ya awali haisasishwi. | | FR-COL-01 |
| TC-MC-005 | Maker-Checker | Kanuni ya kuzuia kuidhinisha mwenyewe | Mtumiaji wa Admin ameingia, ameunda ombi mwenyewe | 1. Nenda kwenye Pending Approvals. 2. Jaribu kupitisha ombi ambalo uliwasilisha mwenyewe. | Ujumbe wa hitilafu: "You cannot approve your own request." Idhini inazuiwa. | | FR-COL-01 |
| TC-MC-006 | Maker-Checker | Ombi lililoidhinishwa linatekelezwa | Idhini ya kuunda mkopaji imeidhinishwa | 1. Nenda kwenye Borrowers. 2. Tafuta mkopaji aliyeidhinishwa hivi karibuni. | Rekodi ya mkopaji ipo katika hifadhidata na data sahihi. | | FR-COL-01 |

---

## 9. Moduli ya Usimamizi wa Migogoro

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DIS-001 | Usimamizi wa Migogoro | Kuwasilisha mgogoro | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye Disputes. 2. Bonyeza "File Dispute". 3. Chagua mkopaji. 4. Chagua aina ya mgogoro: Data Error. 5. Weka aina ya marekebisho: Financial. 6. Ingiza maelezo. 7. Wasilisha. | Mgogoro umeundwa na hali "open". Muda wa mwisho wa SLA umehesabiwa (siku 2 kwa Financial). Rekodi ya ukaguzi imeundwa kwa FILE_DISPUTE. | | FR-CON-04 |
| TC-DIS-002 | Usimamizi wa Migogoro | Uhesabuji wa SLA - marekebisho ya kifedha (siku 2) | Mgogoro umefunguka na correctionType = Financial | 1. Angalia mgogoro katika jedwali la migogoro. | Muda wa mwisho wa SLA umewekwa siku 2 za kazi kutoka tarehe ya kuwasilisha. Siku zilizobaki zinaonyeshwa. | | DQ-04 |
| TC-DIS-003 | Usimamizi wa Migogoro | Uhesabuji wa SLA - marekebisho yasiyo ya kifedha (siku 5) | Mgogoro umefunguka na correctionType = Non-Financial | 1. Angalia mgogoro katika jedwali la migogoro. | Muda wa mwisho wa SLA umewekwa siku 5 za kazi kutoka tarehe ya kuwasilisha. | | DQ-05 |
| TC-DIS-004 | Usimamizi wa Migogoro | Kutatua mgogoro | Mgogoro umefunguka | 1. Nenda kwenye Disputes. 2. Bonyeza "Resolve" kwenye mgogoro ulio wazi. 3. Chagua hali: Resolved. 4. Ingiza maelezo ya utatuzi. 5. Bonyeza "Update Dispute". | Hali ya mgogoro inabadilika kuwa "resolved". Tarehe ya utatuzi imewekwa. Rekodi ya ukaguzi imeundwa kwa RESOLVE_DISPUTE. | | FR-CON-04 |
| TC-DIS-005 | Usimamizi wa Migogoro | Kukataa mgogoro | Mgogoro umefunguka | 1. Nenda kwenye Disputes. 2. Bonyeza "Resolve". 3. Chagua hali: Rejected. 4. Ingiza maelezo ya kukataa. 5. Wasilisha. | Hali ya mgogoro inabadilika kuwa "rejected". | | FR-CON-04 |
| TC-DIS-006 | Usimamizi wa Migogoro | Kiashiria cha ukiukaji wa SLA | Mgogoro umezidi muda wa mwisho wa SLA | 1. Angalia mgogoro ambao muda wake umepita katika jedwali la migogoro. | Beji nyekundu ya "Breached" inaonyeshwa kwenye mgogoro. | | DQ-04 |
| TC-DIS-007 | Usimamizi wa Migogoro | Aina za migogoro | Mtumiaji ameingia | 1. Bonyeza "File Dispute". 2. Angalia chaguzi za aina ya mgogoro katika menyu. | Aina zifuatazo zinapatikana: Data Error, Identity Theft, Unauthorized Inquiry, Duplicate Record, Other. | | FR-CON-04 |

---

## 10. Moduli ya Hukumu za Mahakama

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CJ-001 | Hukumu za Mahakama | Kuunda hukumu ya mahakama | Mtumiaji ameingia kama Admin au Regulator, mkopaji yupo | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Bonyeza "Add Judgment". 3. Jaza: Case Number, Court, Judgment Type (Lien), Amount, Currency, Judgment Date, Status (Active), Description. 4. Wasilisha. | Hukumu ya mahakama imeundwa na imeunganishwa na mkopaji. Inaonekana kwenye ukurasa wa maelezo ya mkopaji. | | FR-COL-05 |
| TC-CJ-002 | Hukumu za Mahakama | Aina za hukumu | Mtumiaji ameingia kama Admin | 1. Bonyeza "Add Judgment". 2. Angalia chaguzi za aina ya hukumu katika menyu. | Aina zifuatazo zinapatikana: Lien, Bankruptcy, Lawsuit, Civil Judgment, Criminal Conviction. | | FR-COL-05 |
| TC-CJ-003 | Hukumu za Mahakama | Hukumu inaonekana kwenye ripoti ya mkopo | Mkopaji ana hukumu ya mahakama | 1. Tengeneza ripoti ya mkopo kwa mkopaji huyu. | Hukumu za mahakama zimejumuishwa katika sehemu ya ripoti ya mkopo. | | FR-CR-06 |
| TC-CJ-004 | Hukumu za Mahakama | Kizuizi cha jukumu - Lender hawezi kuunda | Mtumiaji ameingia kama Lender | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Jaribu kuunda hukumu ya mahakama. | Mtumiaji wa Lender hajioni chaguo la kuongeza hukumu au anazuiwa kutoka kuwasilisha. | | FR-COL-05 |

---

## 11. Moduli ya Usimamizi wa Ridhaa

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CON-001 | Usimamizi wa Ridhaa | Kutoa ridhaa | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye Consent Management. 2. Bonyeza "Grant Consent". 3. Chagua mkopaji. 4. Ingiza: Granted To, Purpose, Consent Type. 5. Wasilisha. | Rekodi ya ridhaa imeundwa na hali "active". Nambari ya risiti imezalishwa moja kwa moja (umbizo: CR-{timestamp}-{random}). | | FR-CON-06 |
| TC-CON-002 | Usimamizi wa Ridhaa | Umbizo la nambari ya risiti | Ridhaa imetolewa | 1. Angalia nambari ya risiti kwenye rekodi ya ridhaa iliyoundwa hivi karibuni. | Nambari ya risiti inafuata umbizo: CR-{timestamp}-{random_id}. Ni ya kipekee. | | FR-CON-07 |
| TC-CON-003 | Usimamizi wa Ridhaa | Kufuta ridhaa | Ridhaa hai ipo | 1. Nenda kwenye Consent Management. 2. Tafuta rekodi ya ridhaa hai. 3. Bonyeza "Revoke". | Hali ya ridhaa inabadilika kuwa "revoked". Muhuri wa tarehe ya kufutwa umewekwa. | | FR-CON-06 |
| TC-CON-004 | Usimamizi wa Ridhaa | Kuona rekodi za ridhaa | Rekodi za ridhaa zipo | 1. Nenda kwenye Consent Management. 2. Angalia jedwali la ridhaa. | Jedwali linaonyesha: jina la mkopaji, taasisi, madhumuni, aina ya ridhaa, hali, nambari ya risiti, tarehe za kutoa na kufuta. | | FR-CON-06 |

---

## 12. Moduli ya Usimamizi wa Taasisi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-INST-001 | Usimamizi wa Taasisi | Kusajili taasisi mpya | Mtumiaji ameingia kama Admin | 1. Nenda kwenye Institutions. 2. Bonyeza "Register". 3. Jaza: Name, Type (Bank), Registration Number, Country, Contact Email, Phone, Address, Submission Frequency (Monthly). 4. Wasilisha. | Taasisi imeundwa na hali "pending". Inaonekana katika orodha ya taasisi. | | FR-INST-01 |
| TC-INST-002 | Usimamizi wa Taasisi | Kupitisha taasisi | Taasisi yenye hali "pending" ipo | 1. Nenda kwenye Institutions. 2. Tafuta taasisi inayosubiri. 3. Bonyeza "Approve". | Hali ya taasisi inabadilika kuwa "active". | | FR-INST-01 |
| TC-INST-003 | Usimamizi wa Taasisi | Aina za taasisi | Mtumiaji ameingia kama Admin | 1. Bonyeza "Register". 2. Angalia chaguzi za aina katika menyu. | Aina zifuatazo zinapatikana: Bank, MFI, Utility, Telecom, Digital Lender, SACCO. | | FR-INST-01 |
| TC-INST-004 | Usimamizi wa Taasisi | Kizuizi cha jukumu - wasio Admin hawana ufikiaji | Mtumiaji ameingia kama Lender | 1. Jaribu kuelekeza kwenye Institutions. | Kipengele cha Institutions hakionekani kwenye mwambao au ufikiaji umezuiwa. | | NFR-SEC-06 |

---

## 13. Moduli ya Malipo

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BILL-001 | Malipo | Kuunda ankara | Mtumiaji ameingia kama Admin au Regulator | 1. Nenda kwenye Billing. 2. Bonyeza "Create Invoice". 3. Jaza: Institution Name, Service Type (Data Submission), Amount, Currency, Invoice Number, Period Start, Period End. 4. Wasilisha. | Ankara imeundwa na hali "pending". Inaonekana katika orodha ya ankara. | | FR-BILL-01 |
| TC-BILL-002 | Malipo | Kadi za muhtasari wa malipo | Mtumiaji ameingia, ankara zipo | 1. Nenda kwenye Billing. 2. Angalia kadi za muhtasari. | Kadi 3 za muhtasari zinaonekana: Total Revenue, Pending Amount, Overdue Amount na thamani sahihi. | | FR-BILL-01 |
| TC-BILL-003 | Malipo | Aina za huduma | Mtumiaji ameingia | 1. Bonyeza "Create Invoice". 2. Angalia chaguzi za aina ya huduma. | Aina zifuatazo zinapatikana: Data Submission, Credit Report, API Access, Subscription. | | FR-BILL-01 |

---

## 14. Moduli ya Dawati la Msaada

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-HD-001 | Dawati la Msaada | Kutafuta mkopaji katika dawati la msaada | Mtumiaji ameingia, wakopaji wapo | 1. Nenda kwenye Helpdesk. 2. Ingiza jina la mkopaji au national ID katika sehemu ya utafutaji. | Matokeo ya utafutaji yanaonyeshwa kama kadi zinazobonyezwa. Kadi za muhtasari zinaonyesha: Open Inquiries, SLA Breaches, Resolved Today. | | FR-CON-04 |
| TC-HD-002 | Dawati la Msaada | Kuona taarifa za mkopaji, migogoro, na ridhaa | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza kadi ya mkopaji ili kumchagua. | Maelezo ya mkopaji yanaonyesha: taarifa za kibinafsi, migogoro (aina, maelezo, hali, muda wa SLA), rekodi za ridhaa (taasisi, madhumuni, hali, risiti). | | FR-CON-04 |
| TC-HD-003 | Dawati la Msaada | Kuwasilisha mgogoro kutoka dawati la msaada | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza "File Dispute". 2. Jina la mkopaji limejazwa tayari. 3. Jaza: Dispute Type, Correction Type, Description. 4. Wasilisha. | Mgogoro umeundwa kwa mkopaji aliyechaguliwa. Ujumbe wa mafanikio unaonyeshwa. | | FR-CON-04 |
| TC-HD-004 | Dawati la Msaada | Kutoa ridhaa kutoka dawati la msaada | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza "Grant Consent". 2. Jaza: Granted To, Purpose, Consent Type. 3. Wasilisha. | Rekodi ya ridhaa imeundwa. Nambari ya risiti imezalishwa moja kwa moja. | | FR-CON-06 |

---

## 15. Moduli ya Upakiaji wa Kundi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BU-001 | Upakiaji wa Kundi | Upakiaji wa faili ya JSON | Mtumiaji ameingia kama Admin au Lender | 1. Nenda kwenye Batch Upload. 2. Chagua aina ya faili: JSON. 3. Pakia faili ya JSON yenye rekodi za akaunti za mikopo. | Faili imechakatwa. Matokeo ya uthibitishaji yanaonyeshwa: Total Records, Successful, Failed. | | FR-BATCH-01 |
| TC-BU-002 | Upakiaji wa Kundi | Upakiaji wa faili ya CSV | Mtumiaji ameingia kama Admin au Lender | 1. Nenda kwenye Batch Upload. 2. Chagua aina ya faili: CSV. 3. Pakia faili ya CSV yenye rekodi sahihi. | Faili imechakatwa kwa mafanikio. Rekodi zimeingizwa katika mfumo. | | FR-BATCH-01 |
| TC-BU-003 | Upakiaji wa Kundi | Hitilafu za uthibitishaji kwenye upakiaji | Mtumiaji ameingia | 1. Pakia faili yenye data batili (sehemu zinazohitajika zimekosekana). | Matokeo ya uthibitishaji yanaonyesha rekodi zilizoshindwa na maelezo ya hitilafu (nambari ya rekodi, sehemu, maelezo ya hitilafu). | | FR-BATCH-01 |
| TC-BU-004 | Upakiaji wa Kundi | Kizuizi cha jukumu - Regulator hawezi kupakia | Mtumiaji ameingia kama Regulator | 1. Jaribu kuelekeza kwenye Batch Upload. | Ufikiaji umezuiwa kwa jukumu la Regulator. | | NFR-SEC-06 |

---

## 16. Moduli ya Njia ya Ukaguzi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AUD-001 | Njia ya Ukaguzi | Kuona rekodi za ukaguzi | Mtumiaji ameingia kama Admin au Regulator | 1. Nenda kwenye Audit Trail. | Rekodi za ukaguzi zinaonyeshwa na: Timestamp, User, Action, Entity, Entity ID, Details, IP Address. | | NFR-SEC-08 |
| TC-AUD-002 | Njia ya Ukaguzi | Kuingia kunaunda rekodi ya ukaguzi | Mtumiaji anaweza kuingia | 1. Ingia kwa mafanikio. 2. Nenda kwenye Audit Trail (kama Admin). 3. Tafuta kuingia kwa hivi karibuni. | Rekodi ya ukaguzi ipo na action: LOGIN, jina la mtumiaji, muhuri wa wakati, na anwani ya IP. | | NFR-SEC-08 |
| TC-AUD-003 | Njia ya Ukaguzi | Kuingia kushindwa kunaunda rekodi ya ukaguzi | — | 1. Jaribu kuingia na vitambulisho batili. 2. Ingia kama Admin na angalia Audit Trail. | Rekodi ya ukaguzi ipo na action: LOGIN_FAILED. | | NFR-SEC-08 |
| TC-AUD-004 | Njia ya Ukaguzi | Kizuizi cha jukumu - Lender hana ufikiaji | Mtumiaji ameingia kama Lender | 1. Jaribu kuelekeza kwenye Audit Trail. | Ufikiaji umezuiwa. Ukurasa wa Audit Trail hauonekani kwenye mwambao kwa jukumu la Lender. | | NFR-SEC-06 |

---

## 17. Moduli ya Usimamizi wa Watumiaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-UM-001 | Usimamizi wa Watumiaji | Kuunda mtumiaji mpya | Mtumiaji ameingia kama Admin | 1. Nenda kwenye User Management. 2. Bonyeza "Add User". 3. Jaza: Username, Password, Full Name, Email, Role (Lender), Institution. 4. Wasilisha. | Mtumiaji mpya ameundwa na jukumu sahihi. Inaonekana katika orodha ya watumiaji. | | NFR-SEC-05 |
| TC-UM-002 | Usimamizi wa Watumiaji | Kupata majukumu | Admin ameingia | 1. Bonyeza "Add User". 2. Angalia chaguzi za jukumu katika menyu. | Majukumu yafuatayo yanapatikana: Admin, Regulator, Lender, Viewer. | | NFR-SEC-05 |
| TC-UM-003 | Usimamizi wa Watumiaji | Kubadili hali ya mtumiaji | Admin ameingia, mtumiaji yupo | 1. Nenda kwenye User Management. 2. Bonyeza "Edit" kwenye mtumiaji. 3. Badili hali kuwa "suspended". 4. Hifadhi. | Hali ya mtumiaji inabadilika kuwa "suspended". Mtumiaji hawezi kuingia. | | NFR-SEC-02 |
| TC-UM-004 | Usimamizi wa Watumiaji | Kizuizi cha jukumu - wasio Admin hawana ufikiaji | Mtumiaji ameingia kama Regulator | 1. Jaribu kuelekeza kwenye User Management. | Kipengele cha User Management hakionekani kwenye mwambao au ufikiaji umezuiwa. | | NFR-SEC-06 |

---

## 18. Moduli ya Funguo za API

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-API-001 | Funguo za API | Kuzalisha funguo ya API | Admin ameingia, taasisi hai ipo | 1. Nenda kwenye API Keys. 2. Bonyeza "Generate Key". 3. Chagua taasisi. 4. Ingiza lebo. 5. Chagua ruhusa: Full. 6. Wasilisha. | Funguo ya API imezalishwa na kuonyeshwa (mara moja tu). Funguo inaonekana katika orodha na hali "active". | | FR-API-01 |
| TC-API-002 | Funguo za API | Kufuta funguo ya API | Admin ameingia, funguo hai ipo | 1. Nenda kwenye API Keys. 2. Tafuta funguo unayotaka kufuta. 3. Bonyeza "Revoke". | Hali ya funguo inabadilika kuwa "revoked". Haitumiki tena kwa uthibitishaji wa API. | | FR-API-01 |
| TC-API-003 | Funguo za API | Viwango vya ruhusa | Admin ameingia | 1. Bonyeza "Generate Key". 2. Angalia chaguzi za ruhusa. | Chaguzi zifuatazo zinapatikana: Submit, Read, Full. | | FR-API-01 |

---

## 19. Moduli ya API ya Nje

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-EAPI-001 | API ya Nje | Uthibitishaji wa funguo ya API | Funguo hai ya API ipo | 1. Tuma ombi la GET kwenye `/api/external/borrowers/search` na kichwa: `X-API-Key: {valid_key}`. | Ombi limeidhinishwa. Jibu la 200 limerudishwa. | | FR-API-02 |
| TC-EAPI-002 | API ya Nje | Uthibitishaji wa funguo batili ya API | — | 1. Tuma ombi la GET na kichwa: `X-API-Key: invalid_key_123`. | Jibu la 401 Unauthorized limerudishwa: "Invalid or revoked API key." | | FR-API-02 |
| TC-EAPI-003 | API ya Nje | Kutafuta mkopaji kupitia API | Funguo hai ya API yenye ruhusa ya Read ipo | 1. Tuma GET `/api/external/borrowers/search?nationalId={id}`. | Jibu la 200 na data ya mkopaji limerudishwa. | | FR-API-02 |
| TC-EAPI-004 | API ya Nje | Kuwasilisha mkopaji kupitia API | Funguo hai ya API yenye ruhusa ya Submit ipo | 1. Tuma POST `/api/external/borrowers` na mwili wa JSON wenye data ya mkopaji. | Jibu la 201 Created limerudishwa. Mkopaji ameundwa. | | FR-API-02 |
| TC-EAPI-005 | API ya Nje | Kukaguliwa kwa ruhusa - Read pekee haiwezi kuwasilisha | Funguo ya API yenye ruhusa ya Read pekee | 1. Tuma POST `/api/external/borrowers` na funguo ya Read-pekee. | Jibu la 403 Forbidden: "Insufficient permissions." | | FR-API-02 |

---

## 20. Moduli ya Ripoti na Usafirishaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RPX-001 | Ripoti na Usafirishaji | Kusafirisha CSV ya kwingineko | Mtumiaji ameingia | 1. Nenda kwenye Reports. 2. Chagua Portfolio Export. 3. Bonyeza "Export CSV". | Faili ya CSV inapakuliwa na data ya akaunti za mikopo ikiwa na: akaunti, salio, hali, sarafu. | | FR-REP-01 |
| TC-RPX-002 | Ripoti na Usafirishaji | Kusafirisha CSV ya wakopaji | Mtumiaji ameingia | 1. Nenda kwenye Reports. 2. Chagua Borrowers Export. 3. Bonyeza "Export CSV". | Faili ya CSV inapakuliwa na data ya wakopaji. | | FR-REP-01 |

---

## 21. Moduli ya Arifa

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-NOT-001 | Arifa | Beji ya idadi ya arifa ambazo hazijasomwa | Mtumiaji ameingia, arifa ambazo hazijasomwa zipo | 1. Angalia aikoni ya kengele ya arifa katika kichwa. | Beji nyekundu inaonyesha idadi ya arifa ambazo hazijasomwa. | | FR-NOT-01 |
| TC-NOT-002 | Arifa | Kusoma arifa | Arifa ambazo hazijasomwa zipo | 1. Bonyeza kengele ya arifa. 2. Bonyeza arifa binafsi. | Arifa imewekwa alama ya kusomwa. Beji inasasishwa. | | FR-NOT-01 |
| TC-NOT-003 | Arifa | Kusoma arifa zote | Arifa nyingi ambazo hazijasomwa zipo | 1. Bonyeza kengele ya arifa. 2. Bonyeza "Mark All as Read". | Arifa zote zimewekwa alama ya kusomwa. Beji inatoweka. | | FR-NOT-01 |

---

## 22. Moduli ya Kimataifa (i18n)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-I18N-001 | Kimataifa | Kubadili lugha kuwa Kifaransa | Mtumiaji ameingia | 1. Bonyeza kitufe cha kubadili lugha katika kichwa. 2. Chagua "FR". | Kiolesura kinabadilika kuwa Kifaransa. Vipengele vya mwambao, kadi za takwimu, lebo za fomu, vitufe vyote vinaonyeshwa kwa Kifaransa. | | NFR-ACC-01 |
| TC-I18N-002 | Kimataifa | Kubadili lugha kuwa Kireno | Mtumiaji ameingia | 1. Bonyeza kitufe cha kubadili lugha. 2. Chagua "PT". | Kiolesura kinabadilika kuwa Kireno. Lebo zote za mwambao na kiolesura zimetafsiriwa. | | NFR-ACC-01 |
| TC-I18N-003 | Kimataifa | Kurudi Kiingereza | Mtumiaji ameingia, lugha imewekwa kuwa FR au PT | 1. Bonyeza kitufe cha kubadili lugha. 2. Chagua "EN". | Kiolesura kinarudi kuwa Kiingereza. Tafsiri zote sahihi. | | NFR-ACC-01 |
| TC-I18N-004 | Kimataifa | Kubadili lugha kwenye ukurasa wa kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia chaguzi za kubadili lugha. 3. Badili kuwa "FR". | Fomu ya kuingia inaonyeshwa kwa Kifaransa. Lebo, kitufe, na maandishi ya kisheria yametafsiriwa. | | NFR-ACC-01 |

---

## 23. Moduli ya Mandhari

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-THM-001 | Mandhari | Kubadili kuwa mandhari ya giza | Mtumiaji ameingia, mandhari angavu | 1. Bonyeza aikoni ya kubadili mandhari (jua/mwezi) katika kichwa. | Kiolesura kinabadilika kuwa mandhari ya giza. Msingi giza, maandishi meupe/mekundu. | | NFR-ACC-02 |
| TC-THM-002 | Mandhari | Kubadili kuwa mandhari angavu | Mtumiaji ameingia, mandhari ya giza | 1. Bonyeza aikoni ya kubadili mandhari tena. | Kiolesura kinarudi kuwa mandhari angavu. | | NFR-ACC-02 |
| TC-THM-003 | Mandhari | Chaguo la mandhari linaendelea | Mtumiaji ameweka mandhari ya giza | 1. Weka mandhari ya giza. 2. Unda upya ukurasa. | Mandhari ya giza inaendelea baada ya kuunda upya (imehifadhiwa katika localStorage). | | NFR-ACC-02 |

---

## 24. Sahihi

| Kipengele | Maelezo |
|------|--------|
| Jumla ya Visa vya Jaribio | 197+ |
| Moduli Zilizofunikwa | 38 |
| Rejea za SRS | Zimeorodheshwa kwa kila jaribio |

### Sahihi za Kupitisha

| Jukumu | Jina | Sahihi | Tarehe |
|------|------|-----------|------|
| Meneja wa Mradi | | | |
| Kiongozi wa QA | | | |
| Msanidi Programu | | | |
| Mwakilishi wa Mteja | | | |

---

## 25. Uboreshaji wa Biashara: Moduli ya MFA (ENT-01)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-MFA-001 | MFA | Kuanzisha MFA | Mtumiaji ameingia, MFA haijawezeshwa | 1. Nenda kwenye mipangilio ya MFA. 2. Bonyeza "Enable MFA". 3. Mfumo unazalisha siri ya TOTP na kuonyesha URI ya `otpauth://`. 4. Skani msimbo wa QR na programu ya authenticator. 5. Ingiza msimbo wa tarakimu 6 kutoka kwa programu ya authenticator. 6. Bonyeza "Verify". | MFA imewezeshwa kwa mafanikio. Ujumbe wa mafanikio unaonyeshwa. Kuingia kwa baadaye kunahitaji msimbo wa TOTP. | | ENT-01 |
| TC-MFA-002 | MFA | Kuingia na MFA | MFA imewezeshwa kwa mtumiaji | 1. Nenda kwenye ukurasa wa kuingia. 2. Ingiza jina la mtumiaji na nenosiri. 3. Bonyeza "Sign In". 4. Skrini ya pili inaonekana ikiomba msimbo wa TOTP. 5. Ingiza msimbo wa tarakimu 6 kutoka kwa programu ya authenticator. 6. Bonyeza "Verify". | Kuingia kumekamilika kwa mafanikio. Mtumiaji ameelekezwa kwenye Dashibodi. | | ENT-01 |
| TC-MFA-003 | MFA | Kuzima MFA | MFA imewezeshwa, mtumiaji ameingia | 1. Nenda kwenye mipangilio ya MFA. 2. Bonyeza "Disable MFA". | MFA imezimwa. Kuingia kwa baadaye kunahitaji jina la mtumiaji na nenosiri pekee. | | ENT-01 |
| TC-MFA-004 | MFA | Msimbo batili wa TOTP | MFA imewezeshwa kwa mtumiaji | 1. Ingiza jina la mtumiaji na nenosiri. 2. Kwenye skrini ya MFA, ingiza msimbo usio sahihi wa tarakimu 6. 3. Bonyeza "Verify". | Ujumbe wa hitilafu: msimbo batili wa MFA. Kuingia kunashindwa. | | ENT-01 |

---

## 26. Uboreshaji wa Biashara: Moduli ya Ulinganishaji wa Huluki kwa Ukadirio (ENT-02)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-FUZ-001 | Ulinganishaji wa Ukadirio | Kutambua nakala | Mtumiaji ameingia, mkopaji aliye na jina sawa yupo | 1. Nenda kwenye Add Borrower. 2. Ingiza jina sawa na mkopaji aliyepo. 3. Angalia onyo la ulinganishaji wa ukadirio. | Bango la onyo linaonekana likionyesha wakopaji walio na majina yanayofanana na alama zao za kufanana. | | ENT-02 |
| TC-FUZ-002 | Ulinganishaji wa Ukadirio | Hakuna nakala zilizopatikana | Mtumiaji ameingia | 1. Nenda kwenye Add Borrower. 2. Ingiza jina la kipekee ambalo halifanani na mkopaji yeyote aliyepo. | Hakuna onyo la ulinganishaji wa ukadirio linaloonyeshwa. | | ENT-02 |

---

## 27. Uboreshaji wa Biashara: Moduli ya Chatbot ya Migogoro (ENT-03)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BOT-001 | Chatbot ya Migogoro | Mchakato unaongozwa wa kuwasilisha mgogoro | Mtumiaji ameingia, kwenye ukurasa wa Helpdesk | 1. Anza chatbot ya migogoro. 2. Chagua aina ya tatizo (k.m., Data Error). 3. Tafuta na chagua mkopaji. 4. Chagua akaunti (hiari). 5. Ingiza maelezo ya tatizo. 6. Thibitisha na uwasilishe. | Chatbot inaongoza kupitia hatua zote kwa mafanikio. Mgogoro unaundwa moja kwa moja ukikamilika. | | ENT-03 |
| TC-BOT-002 | Chatbot ya Migogoro | Kughairi mchakato wa chatbot | Mtumiaji ameingia, chatbot imefunguliwa | 1. Anza mchakato wa chatbot. 2. Bonyeza "Cancel" au funga chatbot katika hatua yoyote. | Mchakato wa chatbot umesitishwa. Hakuna mgogoro uliowasilishwa. Kiolesura kinarudishwa. | | ENT-03 |

---

## 28. Uboreshaji wa Biashara: Moduli ya OAuth 2.1 (ENT-04)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-OAUTH-001 | OAuth 2.1 | Kubadilisha funguo ya API kuwa tokeni ya Bearer | Funguo hai ya API ipo | 1. Tuma POST `/api/external/oauth/token` na mwili: `{ "apiKey": "{valid_key}", "grantType": "client_credentials" }`. | Jibu la 200 limerudishwa na `{ "accessToken": "...", "tokenType": "bearer", "expiresIn": 3600 }`. | | ENT-04 |
| TC-OAUTH-002 | OAuth 2.1 | Kutumia tokeni ya Bearer kwa uthibitishaji | Tokeni hai ya Bearer ipo | 1. Tuma GET `/api/external/borrowers/search` na kichwa: `Authorization: Bearer {token}`. | Ombi limeidhinishwa. Jibu la 200 limerudishwa na data. | | ENT-04 |
| TC-OAUTH-003 | OAuth 2.1 | Tokeni iliyoisha muda | Tokeni ya Bearer ipo yenye muda uliomalizika | 1. Tumia tokeni iliyoisha muda katika kichwa cha Authorization. | Jibu la 401 Unauthorized limerudishwa ikionyesha tokeni imekwisha muda. | | ENT-04 |

---

## 29. Uboreshaji wa Biashara: Moduli ya Uboreshaji wa Bandwidth Ndogo (ENT-05)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-LBW-001 | Bandwidth Ndogo | Majibu yaliyobanwa kwa gzip | Programu inaendesha | 1. Tuma ombi la API na kichwa: `Accept-Encoding: gzip`. 2. Angalia vichwa vya jibu. | Jibu linajumuisha `Content-Encoding: gzip` au majibu ni madogo kuliko data isiyobanwa. | | ENT-05 |
| TC-LBW-002 | Bandwidth Ndogo | Kurasa zinapakia kwa uvivu | Mtumiaji ameingia | 1. Nenda kwenye ukurasa ambao haujapakuliwa hapo awali. | Ukurasa unapakia ikionyesha kipakiaji kwa muda mfupi kabla ya maudhui kuonekana (lazy-loading). | | ENT-05 |

---

## 30. Uboreshaji wa Biashara: Moduli ya Upakiaji wa XBRL (ENT-06)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-XBRL-001 | Upakiaji wa XBRL | Kupakia faili ya XBRL/XML | Mtumiaji ameingia na ruhusa ya upakiaji | 1. Nenda kwenye Batch Upload. 2. Bonyeza kichupo cha "XBRL". 3. Pakia faili ya `.xbrl` au `.xml` yenye rekodi za akaunti za mikopo. | Faili imechakatwa. XML imechambuliwa na kuthibitishwa. Matokeo yanaonyesha kuingizwa kwa mafanikio na hitilafu zozote za uthibitishaji. | | ENT-06 |
| TC-XBRL-002 | Upakiaji wa XBRL | Mfano wa umbizo la XBRL | Mtumiaji ameingia | 1. Nenda kwenye Batch Upload. 2. Bonyeza kichupo cha "XBRL". 3. Angalia mfano wa umbizo la XML unaoonekana. | Mfano wa XML unaonyeshwa ukionyesha muundo unaotarajiwa kwa rekodi za akaunti za mikopo. | | ENT-06 |

---

## 31. Uboreshaji wa Biashara: Moduli ya Kumbukumbu za Ukaguzi Zinazostahimili Uharibifu (ENT-07)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-TAMP-001 | Ukaguzi Unaostahimili Uharibifu | Kuthibitisha uadilifu wa mnyororo wa hash | Mtumiaji ameingia kama Admin au Regulator | 1. Nenda kwenye Audit Trail. 2. Bonyeza "Verify Integrity". | Matokeo ya uthibitishaji yanaonyeshwa: beji ya "Valid" (kijani) ikionyesha mnyororo wa hash wa SHA-256 haujaharibiwa. | | ENT-07 |
| TC-TAMP-002 | Ukaguzi Unaostahimili Uharibifu | Beji ya hali ya uadilifu | Mtumiaji ameingia kama Admin | 1. Nenda kwenye Audit Trail. 2. Angalia beji ya uadilifu juu ya ukurasa. | Beji ya uadilifu inaonekana ikionyesha "Valid" (kijani) au "Broken" (nyekundu). | | ENT-07 |

---

## 32. Moduli ya Usimamizi wa Viwango vya Ubadilishaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-EXR-001 | Viwango vya Ubadilishaji | Kuona viwango vya ubadilishaji | Admin ameingia | 1. Nenda kwenye Exchange Rates kutoka sehemu ya Administration kwenye mwambao. | Ukurasa unaonyesha jedwali la viwango vilivyosanidiwa ikiwa na: Base Currency, Target Currency, Rate, Effective Date. | | FR-EXR-01 |
| TC-EXR-002 | Viwango vya Ubadilishaji | Kuongeza kiwango kipya cha ubadilishaji | Admin ameingia | 1. Bonyeza "Add Rate". 2. Chagua sarafu ya chanzo na lengwa. 3. Ingiza kiwango. 4. Bonyeza "Save". | Rekodi ya kiwango cha ubadilishaji imeundwa na inaonekana katika jedwali. | | FR-EXR-01 |
| TC-EXR-003 | Viwango vya Ubadilishaji | Kuhariri kiwango cha ubadilishaji | Admin ameingia, kiwango cha ubadilishaji kipo | 1. Bonyeza "Edit" kwenye kiwango. 2. Badili thamani ya kiwango. 3. Bonyeza "Save". | Kiwango kimesasishwa kwa thamani mpya. | | FR-EXR-01 |
| TC-EXR-004 | Viwango vya Ubadilishaji | Kufuta kiwango cha ubadilishaji | Admin ameingia, kiwango cha ubadilishaji kipo | 1. Bonyeza "Delete" kwenye kiwango. 2. Thibitisha kufuta. | Rekodi ya kiwango cha ubadilishaji imeondolewa kabisa. | | FR-EXR-01 |
| TC-EXR-005 | Viwango vya Ubadilishaji | Kisanidi cha kubadilisha sarafu | Admin ameingia, viwango vya ubadilishaji vipo | 1. Chagua sarafu ya "From". 2. Chagua sarafu ya "To". 3. Ingiza kiasi. | Kiasi kilichobadilishwa kinaonyeshwa moja kwa moja kulingana na viwango vilivyosanidiwa. | | FR-EXR-01 |

---

## 33. Moduli ya Utawala wa API

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AADM-001 | Utawala wa API | Kuona muunganisho wa API | Admin ameingia | 1. Nenda kwenye API Administration kutoka sehemu ya Administration kwenye mwambao. | Ukurasa unaonyesha muunganisho wote wa API uliowekwa, zimeandaliwa kwa aina. | | FR-AADM-01 |
| TC-AADM-002 | Utawala wa API | Kuongeza muunganisho mpya wa API | Admin ameingia | 1. Bonyeza "Add API". 2. Jaza: Name, Category (Weather), Base URL, API Key, Description. 3. Bonyeza "Save". | Muunganisho wa API umeundwa na unaonekana katika orodha. | | FR-AADM-01 |
| TC-AADM-003 | Utawala wa API | Kujaribu muunganisho wa API | Admin ameingia, muunganisho wa API upo | 1. Bonyeza "Test Connection" kwenye muunganisho wa API. | Mfumo unajaribu kufikia URL iliyosanidiwa. Ujumbe wa mafanikio au kushindwa unaonyeshwa. | | FR-AADM-01 |
| TC-AADM-004 | Utawala wa API | Aina za API | Admin ameingia | 1. Bonyeza "Add API". 2. Angalia chaguzi za aina katika menyu. | Aina zifuatazo zinapatikana: Weather, Judicial, Payment Gateway, Other. | | FR-AADM-01 |

---

## 34. Moduli ya Sera za Uhifadhi wa Data

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RET-001 | Sera za Uhifadhi | Kuona sera za uhifadhi | Admin au Regulator ameingia | 1. Nenda kwenye Retention Policies kutoka sehemu ya Administration kwenye mwambao. | Ukurasa unaonyesha jedwali la sera zote za uhifadhi zilizosanidiwa ikiwa na: Country, Archive Period, Expunge Period, Status. | | FR-RET-01 |
| TC-RET-002 | Sera za Uhifadhi | Kuongeza sera ya uhifadhi | Admin ameingia | 1. Bonyeza "Add Policy". 2. Ingiza: Country, Archive Period (Months), Expunge Period (Months). 3. Bonyeza "Save". | Sera ya uhifadhi imeundwa na inaonekana katika jedwali. | | FR-RET-01 |
| TC-RET-003 | Sera za Uhifadhi | Kuhariri sera ya uhifadhi | Admin ameingia, sera ya uhifadhi ipo | 1. Bonyeza "Edit" kwenye sera. 2. Badili vipindi vya kuhifadhi na kufuta. 3. Bonyeza "Save". | Sera imesasishwa na thamani mpya. | | FR-RET-01 |
| TC-RET-004 | Sera za Uhifadhi | Kuendesha utekelezaji wa uhifadhi | Admin ameingia, sera za uhifadhi zipo | 1. Bonyeza "Run Enforcement". 2. Thibitisha kitendo. | Mchakato wa utekelezaji unaendesha. Ujumbe wa uthibitisho unaonyesha idadi ya rekodi zilizohifadhiwa na kufutwa. | | FR-RET-01 |

---

## 35. Moduli ya Utafutaji wa Jumla

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-GS-001 | Utafutaji wa Jumla | Kutafuta kwenye aina nyingi za huluki | Mtumiaji ameingia, data ipo | 1. Nenda kwenye Credit Search. 2. Ingiza neno la utafutaji linalolingana na mkopaji, taasisi, na akaunti ya mkopo. 3. Bonyeza "Search". | Matokeo yanaonyeshwa katika sehemu zilizogawanywa: Borrowers, Institutions, Credit Accounts. | | FR-GS-01 |
| TC-GS-002 | Utafutaji wa Jumla | Kichujio cha nchi | Mtumiaji ameingia | 1. Nenda kwenye Credit Search. 2. Ingiza neno la utafutaji. 3. Chagua nchi kutoka menyu ya kichujio. 4. Bonyeza "Search". | Matokeo tu kutoka nchi iliyochaguliwa yanaonyeshwa. | | FR-GS-01 |
| TC-GS-003 | Utafutaji wa Jumla | Matokeo ya utafutaji wa mkopaji yanaonyesha picha za wasifu | Mtumiaji ameingia, wakopaji wapo | 1. Fanya utafutaji unaorudisha wakopaji. | Kila matokeo ya mkopaji yanaonyesha picha ya wasifu (avatar iliyotengenezwa moja kwa moja au picha iliyopakiwa), jina, National ID, aina, nchi. | | FR-GS-01 |
| TC-GS-004 | Utafutaji wa Jumla | Kuelekeza kwenye maelezo kutoka matokeo ya utafutaji | Mtumiaji ameingia, matokeo ya utafutaji yameonyeshwa | 1. Bonyeza matokeo ya mkopaji katika matokeo ya utafutaji. | Inaelekeza kwenye ukurasa wa maelezo ya mkopaji. | | FR-GS-01 |

---

## 36. Moduli ya Picha za Kitambulisho na Upakiaji wa Nyaraka

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-PHOTO-001 | Picha za Kitambulisho | Kupakia picha ya wasifu | Mtumiaji ameingia, kwenye ukurasa wa maelezo ya mkopaji | 1. Elekeza juu ya picha ya wasifu ya mkopaji. 2. Bonyeza aikoni ya kamera inayoonekana. 3. Chagua faili ya picha (JPEG/PNG, ≤5MB). | Picha imepakiwa na inachukua nafasi ya avatar iliyotengenezwa moja kwa moja. Arifa ya mafanikio inaonyeshwa. | | FR-PHOTO-01 |
| TC-PHOTO-002 | Picha za Kitambulisho | Kupakia hati ya kitambulisho | Mtumiaji ameingia, kwenye ukurasa wa maelezo ya mkopaji | 1. Bonyeza kitufe cha "Upload ID" au sehemu ya kupakia katika kadi ya Personal Info. 2. Chagua faili (JPEG/PNG/PDF, ≤10MB). | Hati ya kitambulisho imepakiwa na inaonyeshwa katika sehemu ya ID Document ya kadi ya Personal Info. Arifa ya mafanikio inaonyeshwa. | | FR-PHOTO-01 |
| TC-PHOTO-003 | Picha za Kitambulisho | Kizuizi cha ukubwa wa faili | Mtumiaji ameingia | 1. Jaribu kupakia picha ya zaidi ya 5MB au hati ya zaidi ya 10MB. | Ujumbe wa hitilafu unaoonyesha kizuizi cha ukubwa wa faili. Upakiaji umekataliwa. | | FR-PHOTO-01 |
| TC-PHOTO-004 | Picha za Kitambulisho | Kubadilisha hati ya kitambulisho | Mtumiaji ameingia, hati ya kitambulisho ipo tayari | 1. Elekeza juu ya picha ya hati iliyopo. 2. Bonyeza "Replace". 3. Chagua hati mpya. | Hati mpya inachukua nafasi ya ile ya zamani. Arifa ya mafanikio inaonyeshwa. | | FR-PHOTO-01 |

---

## 37. Moduli ya Mazingira ya Maonyesho

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DEMO-001 | Mazingira ya Maonyesho | Kitufe cha "Try Interactive Demo" kwenye kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia kitufe cha "Try Interactive Demo" chini ya fomu ya kuingia. | Kitufe kinaonekana na kinabonyezwa. | | FR-DEMO-01 |
| TC-DEMO-002 | Mazingira ya Maonyesho | Skrini ya kuchagua jukumu la maonyesho | Kwenye ukurasa wa kuingia | 1. Bonyeza "Try Interactive Demo". | Skrini ya kuchagua maonyesho inaonyeshwa na kadi 3 za majukumu: Admin, Regulator, Bank Officer. Kanusho la onyo linaonyeshwa. | | FR-DEMO-01 |
| TC-DEMO-003 | Mazingira ya Maonyesho | Kuingia moja kwa moja kwa kadi ya jukumu | Kwenye skrini ya kuchagua maonyesho | 1. Bonyeza kadi ya jukumu la "Admin". | Mtumiaji ameingia moja kwa moja kama `admin` na ameelekezwa kwenye Dashibodi. Hakuna kuingia kwa mikono kunachohitajika. | | FR-DEMO-01 |
| TC-DEMO-004 | Mazingira ya Maonyesho | Kurudi kwenye kuingia kwa kawaida | Kwenye skrini ya kuchagua maonyesho | 1. Bonyeza "Back to Login". | Fomu ya kawaida ya jina la mtumiaji/nenosiri inarejeshwa. | | FR-DEMO-01 |

---

## 38. Moduli ya Kubadili Lugha kwenye Ukurasa wa Kuingia

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-LNG-001 | Kubadili Lugha | Kubadili lugha kwenye ukurasa wa kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia kitufe/menyu ya kubadili lugha. 3. Bonyeza kubadili kuwa "FR". | Ukurasa wa kuingia unaonyeshwa kwa Kifaransa. Lebo za fomu, kitufe cha kuingia, na maandishi yametafsiriwa. | | NFR-ACC-01 |
| TC-LNG-002 | Kubadili Lugha | Chaguo la lugha linaendelea baada ya kuingia | Lugha imewekwa kuwa FR kwenye kuingia | 1. Badili lugha kuwa FR kwenye kuingia. 2. Ingia kwa mafanikio. | Baada ya kuingia, kiolesura kinaendelea kuonyeshwa kwa Kifaransa. Mwambao, dashibodi, na moduli zote kwa Kifaransa. | | NFR-ACC-01 |
| TC-LNG-003 | Kubadili Lugha | Takwimu za lugha kwenye kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia maandishi ya kitakwimu. | Ukurasa wa kuingia unaonyesha takwimu: nchi 54 za Afrika, sarafu 42+, taasisi 100+, na lugha 5 za kazi za AU. | | NFR-ACC-01 |

---

*Hati hii ni siri na imekusudiwa kwa watumiaji walioidhinishwa wa Mfumo wa Daftari la Mikopo pekee. Kwa msaada wa kiufundi, wasiliana na Systems In Motion Limited.*
