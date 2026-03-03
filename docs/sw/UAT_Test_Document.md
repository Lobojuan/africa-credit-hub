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
39. [Moduli ya Uchambuzi wa Kuona wa Dashibodi (ENT-14)](#39-moduli-ya-uchambuzi-wa-kuona-wa-dashibodi-ent-14)
40. [Moduli ya Ziara ya Maonyesho ya Maingiliano (ENT-15)](#40-moduli-ya-ziara-ya-maonyesho-ya-maingiliano-ent-15)

---

## 1. Usanidi wa Mazingira ya Majaribio

### 1.1 Taarifa za Mfumo

| Kipengele | Maelezo |
|------|--------|
| Programu | Mfumo wa Kituo cha Kati cha Data na Daftari la Mikopo kwa Mamlaka Mbalimbali v1.2 |
| Hifadhidata | PostgreSQL yenye meza 21 |
| Majukumu ya Watumiaji | Admin, Regulator, Lender, Viewer |
| Sarafu Zinazotumika | Sarafu 42+ za Afrika pamoja na USD, EUR, GBP |
| Uboreshaji wa Biashara | MFA, Fuzzy Matching, Dispute Chatbot, OAuth 2.1, Low-Bandwidth, XBRL Upload, Tamper-Evident Audit, Exchange Rate Management, API Administration, Data Retention Policies, Global Search, ID Photos & Documents, Demo Environment, Dashboard Visual Analytics, Interactive Demo Tour |
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
| TC-RPT-011 | Ripoti za Mikopo | Ripoti ya mkopo inajumuisha historia ya malipo | Mkopaji ana akaunti zenye historia ya malipo | 1. Tengeneza ripoti ya mkopo. | Sehemu ya historia ya utendaji wa malipo inaonyeshwa katika ripoti. | | FR-CR-08 |
| TC-RPT-012 | Ripoti za Mikopo | Ripoti ya mkopo inajumuisha hukumu za mahakama | Mkopaji ana hukumu za mahakama | 1. Tengeneza ripoti ya mkopo. | Sehemu ya hukumu za mahakama inaonyeshwa na maelezo ya kesi. | | FR-COL-05 |
| TC-RPT-013 | Ripoti za Mikopo | Ripoti ya mkopo inajumuisha rekodi za ridhaa | Mkopaji ana rekodi za ridhaa | 1. Tengeneza ripoti ya mkopo. | Sehemu ya rekodi za ridhaa inaonyeshwa katika ripoti. | | FR-CON-06 |
| TC-RPT-014 | Ripoti za Mikopo | Ufuatiliaji wa kumbukumbu za ripoti ya mkopo | Mtumiaji anatengeneza ripoti ya mkopo | 1. Tengeneza ripoti ya mkopo. 2. Nenda kwenye kumbukumbu za ripoti ya mkopo. | Rekodi ipo katika credit_report_logs ikiwa na borrowerId, requestedBy, institution, purpose, serialNumber, na muhuri wa wakati. | | FR-CR-06 |

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
| TC-MC-007 | Maker-Checker | Jukumu lisilo na kutosha kwa idhini | Mtumiaji wa Lender ameingia | 1. Jaribu kupitisha ombi linalosubiri kupitia API. | 403 Forbidden: "Insufficient permissions." | | FR-COL-01 |
| TC-MC-008 | Maker-Checker | Kuwasilisha akaunti ya mkopo kunaanzisha idhini | Mtumiaji ameingia | 1. Wasilisha akaunti mpya ya mkopo. | Idhini inayosubiri imeundwa na entityType = "credit_account". | | FR-COL-01 |

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
| TC-DIS-008 | Usimamizi wa Migogoro | Kuona maelezo ya mgogoro binafsi | Mgogoro upo | 1. Bonyeza safu ya mgogoro. | Kisanduku cha maelezo ya mgogoro kinafunguka kikionyesha sehemu zote: mkopaji, akaunti, aina, maelezo, hali, aina ya marekebisho, muda wa mwisho wa SLA, utatuzi, mihuri ya wakati. | | FR-CON-04 |

---

## 10. Moduli ya Hukumu za Mahakama

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CJ-001 | Hukumu za Mahakama | Kuunda hukumu ya mahakama | Mtumiaji ameingia kama Admin au Regulator, mkopaji yupo | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Bonyeza "Add Judgment". 3. Jaza: Case Number, Court, Judgment Type (Lien), Amount, Currency, Judgment Date, Status (Active), Description. 4. Wasilisha. | Hukumu ya mahakama imeundwa na imeunganishwa na mkopaji. Inaonekana kwenye ukurasa wa maelezo ya mkopaji. | | FR-COL-05 |
| TC-CJ-002 | Hukumu za Mahakama | Aina za hukumu | Mtumiaji ameingia kama Admin | 1. Bonyeza "Add Judgment". 2. Angalia chaguzi za aina ya hukumu katika menyu. | Aina zifuatazo zinapatikana: Lien, Bankruptcy, Lawsuit, Civil Judgment, Criminal Conviction. | | FR-COL-05 |
| TC-CJ-003 | Hukumu za Mahakama | Hukumu inaonekana kwenye ripoti ya mkopo | Mkopaji ana hukumu ya mahakama | 1. Tengeneza ripoti ya mkopo kwa mkopaji huyu. | Hukumu za mahakama zimejumuishwa katika sehemu ya ripoti ya mkopo. | | FR-CR-06 |
| TC-CJ-004 | Hukumu za Mahakama | Kizuizi cha jukumu - Lender hawezi kuunda | Mtumiaji ameingia kama Lender | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Jaribu kuunda hukumu ya mahakama. | Mtumiaji wa Lender hajioni chaguo la kuongeza hukumu au anazuiwa kutoka kuwasilisha. | | FR-COL-05 |
| TC-CJ-005 | Hukumu za Mahakama | Kuunda hatia ya jinai | Admin/Regulator ameingia | 1. Ongeza hukumu ya mahakama na aina: "criminal_conviction". | Hukumu ya mahakama imeundwa. | | FR-COL-05 |
| TC-CJ-006 | Hukumu za Mahakama | Ufuatiliaji wa hali ya hukumu | Hukumu ya mahakama ipo | 1. Angalia hukumu. 2. Thibitisha chaguzi za hali. | Hali inaweza kuwa: active, resolved, au appealed. | | FR-COL-05 |
| TC-CJ-007 | Hukumu za Mahakama | Kuona hukumu kwa mkopaji | Mkopaji ana hukumu za mahakama | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Angalia sehemu ya hukumu za mahakama. | Hukumu zote za mahakama za mkopaji zinaonyeshwa na nambari ya kesi, mahakama, aina, kiasi, sarafu, tarehe, hali, maelezo. | | FR-COL-05 |
| TC-CJ-008 | Hukumu za Mahakama | Kuchuja hukumu kwa kitambulisho cha mkopaji | Hukumu za mahakama zipo | 1. Tafuta hukumu za mahakama kupitia API na kichujio cha ?borrowerId. | Hukumu za mkopaji aliyebainishwa pekee zinarudishwa. | | FR-COL-05 |

---

## 11. Moduli ya Usimamizi wa Ridhaa

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-CON-001 | Usimamizi wa Ridhaa | Kutoa ridhaa | Mtumiaji ameingia, mkopaji yupo | 1. Nenda kwenye Consent Management. 2. Bonyeza "Grant Consent". 3. Chagua mkopaji. 4. Ingiza: Granted To, Purpose, Consent Type. 5. Wasilisha. | Rekodi ya ridhaa imeundwa na hali "active". Nambari ya risiti imezalishwa moja kwa moja (umbizo: CR-{timestamp}-{random}). | | FR-CON-06 |
| TC-CON-002 | Usimamizi wa Ridhaa | Umbizo la nambari ya risiti | Ridhaa imetolewa | 1. Angalia nambari ya risiti kwenye rekodi ya ridhaa iliyoundwa hivi karibuni. | Nambari ya risiti inafuata umbizo: CR-{timestamp}-{random_id}. Ni ya kipekee. | | FR-CON-07 |
| TC-CON-003 | Usimamizi wa Ridhaa | Kufuta ridhaa | Ridhaa hai ipo | 1. Nenda kwenye Consent Management. 2. Tafuta rekodi ya ridhaa hai. 3. Bonyeza "Revoke". | Hali ya ridhaa inabadilika kuwa "revoked". Muhuri wa tarehe ya kufutwa umewekwa. | | FR-CON-06 |
| TC-CON-004 | Usimamizi wa Ridhaa | Kuona rekodi za ridhaa | Rekodi za ridhaa zipo | 1. Nenda kwenye Consent Management. 2. Angalia jedwali la ridhaa. | Jedwali linaonyesha: jina la mkopaji, taasisi, madhumuni, aina ya ridhaa, hali, nambari ya risiti, tarehe za kutoa na kufuta. | | FR-CON-06 |
| TC-CON-005 | Usimamizi wa Ridhaa | Kuchuja ridhaa kwa mkopaji | Mkopaji ana rekodi za ridhaa | 1. Tafuta rekodi za ridhaa na kichujio cha ?borrowerId. | Rekodi za ridhaa za mkopaji aliyebainishwa pekee zinarudishwa. | | FR-CON-06 |
| TC-CON-006 | Usimamizi wa Ridhaa | Kuona ridhaa kwenye maelezo ya mkopaji | Mkopaji ana rekodi za ridhaa | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji. 2. Angalia sehemu ya ridhaa. | Rekodi za ridhaa za mkopaji zinaonyeshwa. | | FR-CON-06 |
| TC-CON-007 | Usimamizi wa Ridhaa | Kuzuia ridhaa hai inayojirudia | Ridhaa hai ipo kwa mkopaji yule yule + grantedTo + madhumuni | 1. Jaribu kuunda ridhaa inayojirudia. | Mfumo unashughulikia ipasavyo (unazuia au kuruhusu nyingi). | | FR-CON-08 |
| TC-CON-008 | Usimamizi wa Ridhaa | Kuelekeza kutoka ridhaa kwenda kwa mkopaji | Rekodi ya ridhaa inaonyeshwa kwenye jedwali | 1. Bonyeza safu ya rekodi ya ridhaa. | Inaelekeza kwenye ukurasa wa maelezo ya mkopaji anayehusika. | | FR-CON-09 |

---

## 12. Moduli ya Usimamizi wa Taasisi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-INST-001 | Usimamizi wa Taasisi | Kusajili taasisi mpya | Mtumiaji ameingia kama Admin | 1. Nenda kwenye Institutions. 2. Bonyeza "Register". 3. Jaza: Name, Type (Bank), Registration Number, Country, Contact Email, Phone, Address, Submission Frequency (Monthly). 4. Wasilisha. | Taasisi imeundwa na hali "pending". Inaonekana katika orodha ya taasisi. | | FR-INST-01 |
| TC-INST-002 | Usimamizi wa Taasisi | Kupitisha taasisi | Taasisi yenye hali "pending" ipo | 1. Nenda kwenye Institutions. 2. Tafuta taasisi inayosubiri. 3. Bonyeza "Approve". | Hali ya taasisi inabadilika kuwa "active". | | FR-INST-01 |
| TC-INST-003 | Usimamizi wa Taasisi | Aina za taasisi | Mtumiaji ameingia kama Admin | 1. Bonyeza "Register". 2. Angalia chaguzi za aina katika menyu. | Aina zifuatazo zinapatikana: Bank, MFI, Utility, Telecom, Digital Lender, SACCO. | | FR-INST-01 |
| TC-INST-004 | Usimamizi wa Taasisi | Kizuizi cha jukumu - wasio Admin hawana ufikiaji | Mtumiaji ameingia kama Lender | 1. Jaribu kuelekeza kwenye Institutions. | Kipengele cha Institutions hakionekani kwenye mwambao au ufikiaji umezuiwa. | | NFR-SEC-06 |
| TC-INST-005 | Usimamizi wa Taasisi | Kusajili mkopeshaji wa kidijitali | Admin ameingia | 1. Ongeza taasisi na aina: "digital_lender". | Taasisi imeundwa. | | FR-DP-01 |
| TC-INST-006 | Usimamizi wa Taasisi | Kusajili SACCO | Admin ameingia | 1. Ongeza taasisi na aina: "sacco". | Taasisi imeundwa. | | FR-DP-01 |
| TC-INST-007 | Usimamizi wa Taasisi | Kupitisha taasisi (idhini) | Admin ameingia, taasisi inayosubiri ipo | 1. Nenda kwenye Institutions. 2. Chagua taasisi inayosubiri. 3. Bonyeza "Approve". | Hali ya taasisi inabadilika kuwa "active". Sehemu za approvedBy na approvedAt zimejazwa. | | FR-DP-04 |
| TC-INST-008 | Usimamizi wa Taasisi | Kusanidi masafa ya uwasilishaji | Admin ameingia, taasisi hai ipo | 1. Nenda kwenye maelezo ya taasisi. 2. Weka masafa ya uwasilishaji (k.m., "monthly", "weekly"). 3. Hifadhi. | Masafa ya uwasilishaji yamesasishwa. | | FR-DP-01 |
| TC-INST-009 | Usimamizi wa Taasisi | Msaada wa nchi nyingi | Admin ameingia | 1. Unda taasisi zenye nchi tofauti: Ethiopia, Ghana, Uganda, Liberia. | Taasisi zimeundwa na ugawaji sahihi wa nchi. | | FR-DP-01 |
| TC-INST-010 | Usimamizi wa Taasisi | Kurasa za taasisi | Taasisi nyingi zipo | 1. Nenda kwenye ukurasa wa Institutions. 2. Angalia kurasa. | Kurasa za upande wa seva zinafanya kazi. Vidhibiti vya ukurasa/kikomo vinafanya kazi. | | FR-DP-01 |
| TC-INST-011 | Usimamizi wa Taasisi | Safu za taasisi zinazobonyezwa | Taasisi zimeorodheshwa kwenye jedwali | 1. Bonyeza safu ya taasisi. | Kisanduku cha maelezo ya taasisi kinafunguka kikionyesha taarifa zote za taasisi. | | FR-DP-01 |

---

## 13. Moduli ya Malipo

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BILL-001 | Malipo | Kuunda ankara | Mtumiaji ameingia kama Admin au Regulator | 1. Nenda kwenye Billing. 2. Bonyeza "Create Invoice". 3. Jaza: Institution Name, Service Type (Data Submission), Amount, Currency, Invoice Number, Period Start, Period End. 4. Wasilisha. | Ankara imeundwa na hali "pending". Inaonekana katika orodha ya ankara. | | FR-BILL-01 |
| TC-BILL-002 | Malipo | Kadi za muhtasari wa malipo | Mtumiaji ameingia, ankara zipo | 1. Nenda kwenye Billing. 2. Angalia kadi za muhtasari. | Kadi 3 za muhtasari zinaonekana: Total Revenue, Pending Amount, Overdue Amount na thamani sahihi. | | FR-BILL-01 |
| TC-BILL-003 | Malipo | Aina za huduma | Mtumiaji ameingia | 1. Bonyeza "Create Invoice". 2. Angalia chaguzi za aina ya huduma. | Aina zifuatazo zinapatikana: Data Submission, Credit Report, API Access, Subscription. | | FR-BILL-01 |
| TC-BIL-004 | Malipo | Kuunda ankara - usajili | Admin/Regulator ameingia | 1. Unda ankara na aina ya huduma: "subscription". | Rekodi ya ankara imeundwa. | | FR-COMM-01 |
| TC-BIL-005 | Malipo | Kufuatilia hali ya malipo | Rekodi za ankara zipo | 1. Angalia rekodi za ankara. 2. Angalia thamani za hali. | Hali zinaonyeshwa: pending, paid, overdue. | | FR-COMM-05 |
| TC-BIL-006 | Malipo | Ankara za sarafu nyingi | Admin/Regulator ameingia | 1. Unda ankara katika sarafu tofauti (ETB, GHS, UGX, USD). | Ankara zimeundwa na sarafu sahihi. Kiasi kimefomatiwa kwa kila sarafu. | | FR-COMM-01 |
| TC-BIL-007 | Malipo | Safu za ankara zinazobonyezwa | Rekodi za ankara zimeorodheshwa | 1. Bonyeza safu ya rekodi ya ankara. | Kisanduku cha maelezo ya ankara kinafunguka kikionyesha taarifa kamili za ankara. | | FR-COMM-01 |
| TC-BIL-008 | Malipo | Kizuizi cha ufikiaji kwa Lender/Viewer | Mtumiaji wa Lender au Viewer ameingia | 1. Jaribu kufikia ukurasa wa Billing. | Ufikiaji umekataliwa au ukurasa hauonekani kwenye mwambao wa urambazaji. | | FR-COMM-01 |

---

## 14. Moduli ya Dawati la Msaada

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-HD-001 | Dawati la Msaada | Kutafuta mkopaji katika dawati la msaada | Mtumiaji ameingia, wakopaji wapo | 1. Nenda kwenye Helpdesk. 2. Ingiza jina la mkopaji au national ID katika sehemu ya utafutaji. | Matokeo ya utafutaji yanaonyeshwa kama kadi zinazobonyezwa. Kadi za muhtasari zinaonyesha: Open Inquiries, SLA Breaches, Resolved Today. | | FR-CON-04 |
| TC-HD-002 | Dawati la Msaada | Kuona taarifa za mkopaji, migogoro, na ridhaa | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza kadi ya mkopaji ili kumchagua. | Maelezo ya mkopaji yanaonyesha: taarifa za kibinafsi, migogoro (aina, maelezo, hali, muda wa SLA), rekodi za ridhaa (taasisi, madhumuni, hali, risiti). | | FR-CON-04 |
| TC-HD-003 | Dawati la Msaada | Kuwasilisha mgogoro kutoka dawati la msaada | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza "File Dispute". 2. Jina la mkopaji limejazwa tayari. 3. Jaza: Dispute Type, Correction Type, Description. 4. Wasilisha. | Mgogoro umeundwa kwa mkopaji aliyechaguliwa. Ujumbe wa mafanikio unaonyeshwa. | | FR-CON-04 |
| TC-HD-004 | Dawati la Msaada | Kutoa ridhaa kutoka dawati la msaada | Mkopaji amechaguliwa katika dawati la msaada | 1. Bonyeza "Grant Consent". 2. Jaza: Granted To, Purpose, Consent Type. 3. Wasilisha. | Rekodi ya ridhaa imeundwa. Nambari ya risiti imezalishwa moja kwa moja. | | FR-CON-06 |
| TC-HD-005 | Dawati la Msaada | Kuona migogoro ya mkopaji kutoka dawati la msaada | Mkopaji ana migogoro | 1. Tafuta mkopaji. 2. Angalia sehemu ya migogoro. | Migogoro yote ya mkopaji inaonyeshwa. | | FR-CON-02 |
| TC-HD-006 | Dawati la Msaada | Kuona ridhaa ya mkopaji kutoka dawati la msaada | Mkopaji ana rekodi za ridhaa | 1. Tafuta mkopaji. 2. Angalia sehemu ya ridhaa. | Rekodi zote za ridhaa za mkopaji zinaonyeshwa. | | FR-CON-02 |

---

## 15. Moduli ya Upakiaji wa Kundi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-BU-001 | Upakiaji wa Kundi | Upakiaji wa faili ya JSON | Mtumiaji ameingia kama Admin au Lender | 1. Nenda kwenye Batch Upload. 2. Chagua aina ya faili: JSON. 3. Pakia faili ya JSON yenye rekodi za akaunti za mikopo. | Faili imechakatwa. Matokeo ya uthibitishaji yanaonyeshwa: Total Records, Successful, Failed. | | FR-BATCH-01 |
| TC-BU-002 | Upakiaji wa Kundi | Upakiaji wa faili ya CSV | Mtumiaji ameingia kama Admin au Lender | 1. Nenda kwenye Batch Upload. 2. Chagua aina ya faili: CSV. 3. Pakia faili ya CSV yenye rekodi sahihi. | Faili imechakatwa kwa mafanikio. Rekodi zimeingizwa katika mfumo. | | FR-BATCH-01 |
| TC-BU-003 | Upakiaji wa Kundi | Hitilafu za uthibitishaji kwenye upakiaji | Mtumiaji ameingia | 1. Pakia faili yenye data batili (sehemu zinazohitajika zimekosekana). | Matokeo ya uthibitishaji yanaonyesha rekodi zilizoshindwa na maelezo ya hitilafu (nambari ya rekodi, sehemu, maelezo ya hitilafu). | | FR-BATCH-01 |
| TC-BU-004 | Upakiaji wa Kundi | Kizuizi cha jukumu - Regulator hawezi kupakia | Mtumiaji ameingia kama Regulator | 1. Jaribu kuelekeza kwenye Batch Upload. | Ufikiaji umezuiwa kwa jukumu la Regulator. | | NFR-SEC-06 |
| TC-BU-005 | Upakiaji wa Kundi | Kupakua ripoti ya hitilafu | Upakiaji umekamilika na hitilafu | 1. Kamilisha upakiaji na hitilafu fulani. 2. Bonyeza "Download Error Report" au sawa. | Ripoti ya hitilafu inapakuliwa ikiwa na maelezo ya rekodi zilizoshindwa na hitilafu zao za uthibitishaji. | | FR-COL-01 |
| TC-BU-006 | Upakiaji wa Kundi | Upakiaji wa faili tupu | Admin/Lender ameingia | 1. Pakia faili tupu. | Ujumbe unaofaa wa hitilafu: "Request body must contain a 'records' array" au sawa. | | FR-COL-01 |
| TC-BU-007 | Upakiaji wa Kundi | Kizuizi cha ufikiaji kwa Viewer/Regulator | Viewer au Regulator ameingia | 1. Jaribu kufikia Batch Upload. | Ufikiaji umekataliwa au ukurasa haupatikani. | | FR-COL-01 |

---

## 16. Moduli ya Njia ya Ukaguzi

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-AUD-001 | Njia ya Ukaguzi | Kuona rekodi za ukaguzi | Mtumiaji ameingia kama Admin au Regulator | 1. Nenda kwenye Audit Trail. | Rekodi za ukaguzi zinaonyeshwa na: Timestamp, User, Action, Entity, Entity ID, Details, IP Address. | | NFR-SEC-08 |
| TC-AUD-002 | Njia ya Ukaguzi | Kuingia kunaunda rekodi ya ukaguzi | Mtumiaji anaweza kuingia | 1. Ingia kwa mafanikio. 2. Nenda kwenye Audit Trail (kama Admin). 3. Tafuta kuingia kwa hivi karibuni. | Rekodi ya ukaguzi ipo na action: LOGIN, jina la mtumiaji, muhuri wa wakati, na anwani ya IP. | | NFR-SEC-08 |
| TC-AUD-003 | Njia ya Ukaguzi | Kuingia kushindwa kunaunda rekodi ya ukaguzi | — | 1. Jaribu kuingia na vitambulisho batili. 2. Ingia kama Admin na angalia Audit Trail. | Rekodi ya ukaguzi ipo na action: LOGIN_FAILED. | | NFR-SEC-08 |
| TC-AUD-004 | Njia ya Ukaguzi | Kizuizi cha jukumu - Lender hana ufikiaji | Mtumiaji ameingia kama Lender | 1. Jaribu kuelekeza kwenye Audit Trail. | Ufikiaji umezuiwa. Ukurasa wa Audit Trail hauonekani kwenye mwambao kwa jukumu la Lender. | | NFR-SEC-06 |
| TC-AUD-005 | Njia ya Ukaguzi | Kufungwa kwa akaunti kunaandikwa | Akaunti imefungwa | 1. Anzisha kufungwa kwa akaunti (majaribio 3 yaliyoshindwa). 2. Angalia Njia ya Ukaguzi. | Tukio la ACCOUNT_LOCKED limeandikwa. | | NFR-SEC-06 |
| TC-AUD-006 | Njia ya Ukaguzi | Operesheni za CRUD zinaandikwa | Kitendo chochote cha kuunda/kusasisha/kufuta | 1. Fanya operesheni ya data (k.m., wasilisha mkopaji). 2. Angalia Njia ya Ukaguzi. | Tukio la SUBMIT_APPROVAL au CREATE limeandikwa na maelezo ya huluki. | | NFR-SEC-06 |
| TC-AUD-007 | Njia ya Ukaguzi | Ufuatiliaji wa anwani ya IP | Kitendo chochote kimefanywa | 1. Fanya vitendo mbalimbali. 2. Angalia rekodi za Njia ya Ukaguzi. | Kila rekodi ina sehemu ya ipAddress iliyojazwa. | | NFR-SEC-07 |
| TC-AUD-008 | Njia ya Ukaguzi | Kubadili nenosiri kunaandikwa | Mtumiaji anabadili nenosiri | 1. Badili nenosiri. 2. Angalia Njia ya Ukaguzi. | Tukio la PASSWORD_CHANGE limeandikwa. | | NFR-SEC-06 |
| TC-AUD-009 | Njia ya Ukaguzi | Kutengeneza ripoti ya mkopo kunaandikwa | Ripoti ya mkopo imetengenezwa | 1. Tengeneza ripoti ya mkopo. 2. Angalia Njia ya Ukaguzi. | Tukio la VIEW au API_CREDIT_REPORT limeandikwa na maelezo ya mkopaji. | | NFR-SEC-06 |
| TC-AUD-010 | Njia ya Ukaguzi | Kizuizi cha ufikiaji kwa Lender/Viewer | Lender au Viewer ameingia | 1. Jaribu kufikia ukurasa wa Audit Trail. | Ufikiaji umezuiwa au ukurasa hauonekani kwenye mwambao. | | NFR-SEC-06 |
| TC-AUD-011 | Njia ya Ukaguzi | Safu za njia ya ukaguzi zinazobonyezwa | Rekodi za ukaguzi zimeorodheshwa | 1. Bonyeza rekodi ya njia ya ukaguzi. | Kisanduku cha maelezo kinafunguka kikionyesha taarifa kamili za rekodi ya ukaguzi. | | NFR-SEC-06 |

---

## 17. Moduli ya Usimamizi wa Watumiaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-UM-001 | Usimamizi wa Watumiaji | Kuunda mtumiaji mpya | Mtumiaji ameingia kama Admin | 1. Nenda kwenye User Management. 2. Bonyeza "Add User". 3. Jaza: Username, Password, Full Name, Email, Role (Lender), Institution. 4. Wasilisha. | Mtumiaji mpya ameundwa na jukumu sahihi. Inaonekana katika orodha ya watumiaji. | | NFR-SEC-05 |
| TC-UM-002 | Usimamizi wa Watumiaji | Kupata majukumu | Admin ameingia | 1. Bonyeza "Add User". 2. Angalia chaguzi za jukumu katika menyu. | Majukumu yafuatayo yanapatikana: Admin, Regulator, Lender, Viewer. | | NFR-SEC-05 |
| TC-UM-003 | Usimamizi wa Watumiaji | Kubadili hali ya mtumiaji | Admin ameingia, mtumiaji yupo | 1. Nenda kwenye User Management. 2. Bonyeza "Edit" kwenye mtumiaji. 3. Badili hali kuwa "suspended". 4. Hifadhi. | Hali ya mtumiaji inabadilika kuwa "suspended". Mtumiaji hawezi kuingia. | | NFR-SEC-02 |
| TC-UM-004 | Usimamizi wa Watumiaji | Kizuizi cha jukumu - wasio Admin hawana ufikiaji | Mtumiaji ameingia kama Regulator | 1. Jaribu kuelekeza kwenye User Management. | Kipengele cha User Management hakionekani kwenye mwambao au ufikiaji umezuiwa. | | NFR-SEC-06 |
| TC-UM-005 | Usimamizi wa Watumiaji | Kupewa jukumu la Viewer | Admin ameingia | 1. Unda mtumiaji na jukumu: "viewer". | Mtumiaji ameundwa na jukumu la viewer. Ufikiaji wa kusoma pekee. | | NFR-SEC-02 |
| TC-UM-006 | Usimamizi wa Watumiaji | Kusimamisha mtumiaji | Admin ameingia, mtumiaji hai yupo | 1. Nenda kwenye User Management. 2. Chagua mtumiaji. 3. Badili hali kuwa "suspended". | Hali ya mtumiaji imebadilika kuwa suspended. Mtumiaji hawezi kuingia tena. Rekodi ya ukaguzi. | | NFR-SEC-02 |
| TC-UM-007 | Usimamizi wa Watumiaji | Kuzima mtumiaji | Admin ameingia, mtumiaji hai yupo | 1. Chagua mtumiaji. 2. Badili hali kuwa "deactivated". | Hali ya mtumiaji imebadilika kuwa deactivated. Mtumiaji hawezi kuingia. | | NFR-SEC-02 |
| TC-UM-008 | Usimamizi wa Watumiaji | Kuwezesha tena mtumiaji | Admin ameingia, mtumiaji aliyesimamishwa/aliyezimwa yupo | 1. Chagua mtumiaji. 2. Badili hali kuwa "active". | Hali ya mtumiaji imebadilika kuwa active. Mtumiaji anaweza kuingia tena. | | NFR-SEC-02 |
| TC-UM-009 | Usimamizi wa Watumiaji | Kusasisha maelezo ya mtumiaji | Admin ameingia | 1. Chagua mtumiaji. 2. Hariri Full Name na Email. 3. Hifadhi. | Maelezo ya mtumiaji yamesasishwa. Rekodi ya ukaguzi. | | NFR-SEC-02 |
| TC-UM-010 | Usimamizi wa Watumiaji | Kizuizi cha ufikiaji kwa wasio admin | Regulator/Lender/Viewer ameingia | 1. Jaribu kufikia ukurasa wa User Management. | Ufikiaji umezuiwa au ukurasa hauonekani kwenye mwambao. | | NFR-SEC-02 |
| TC-UM-011 | Usimamizi wa Watumiaji | Kuweka upya nenosiri la mtumiaji | Admin ameingia | 1. Chagua mtumiaji. 2. Weka nenosiri jipya. 3. Hifadhi. | Nenosiri limesasishwa (limeandikwa kwa bcrypt). Mtumiaji anaweza kuingia na nenosiri jipya. | | NFR-SEC-04 |

---

## 18. Moduli ya Funguo za API

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-API-001 | Funguo za API | Kuzalisha funguo ya API | Admin ameingia, taasisi hai ipo | 1. Nenda kwenye API Keys. 2. Bonyeza "Generate Key". 3. Chagua taasisi. 4. Ingiza lebo. 5. Chagua ruhusa: Full. 6. Wasilisha. | Funguo ya API imezalishwa na kuonyeshwa (mara moja tu). Funguo inaonekana katika orodha na hali "active". | | FR-API-01 |
| TC-API-002 | Funguo za API | Kufuta funguo ya API | Admin ameingia, funguo hai ipo | 1. Nenda kwenye API Keys. 2. Tafuta funguo unayotaka kufuta. 3. Bonyeza "Revoke". | Hali ya funguo inabadilika kuwa "revoked". Haitumiki tena kwa uthibitishaji wa API. | | FR-API-01 |
| TC-API-003 | Funguo za API | Viwango vya ruhusa | Admin ameingia | 1. Bonyeza "Generate Key". 2. Angalia chaguzi za ruhusa. | Chaguzi zifuatazo zinapatikana: Submit, Read, Full. | | FR-API-01 |
| TC-API-004 | Funguo za API | Kufuta funguo ya API | Admin ameingia, funguo hai ya API ipo | 1. Nenda kwenye API Keys. 2. Chagua funguo hai. 3. Bonyeza "Revoke". | Hali ya funguo imebadilika kuwa "revoked". Muhuri wa revokedAt umewekwa. Funguo haiwezi kutumika tena kwa uthibitishaji wa API. | | NFR-SEC-08 |
| TC-API-005 | Funguo za API | Kuona matumizi ya funguo ya API | Admin ameingia, funguo ya API imetumika | 1. Nenda kwenye API Keys. 2. Angalia maelezo ya funguo. | Muhuri wa wakati wa matumizi ya mwisho unaonyeshwa. Kiambishi awali cha funguo kinaonyeshwa kwa utambulisho. | | NFR-SEC-08 |
| TC-API-006 | Funguo za API | Kizuizi cha ufikiaji kwa wasio admin | Regulator/Lender/Viewer ameingia | 1. Jaribu kufikia ukurasa wa API Keys. | Ufikiaji umezuiwa au ukurasa hauonekani. | | NFR-SEC-08 |
| TC-API-007 | Funguo za API | Uhifadhi wa funguo kwa SHA-256 | Funguo ya API imezalishwa | 1. Zalisha funguo ya API. 2. Thibitisha uhifadhi. | Funguo kamili haihifadhiwi. Hash ya SHA-256 pekee imehifadhiwa katika hifadhidata. Kiambishi awali cha funguo kimehifadhiwa tofauti kwa kuonyesha. | | NFR-SEC-08 |

---

## 19. Moduli ya API ya Nje

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-EAPI-002 | API ya Nje | Uthibitishaji wa funguo batili ya API | — | 1. Tuma ombi la GET na kichwa: `X-API-Key: invalid_key_123`. | Jibu la 401 Unauthorized limerudishwa: "Invalid or revoked API key." | | FR-API-02 |
| TC-EAPI-003 | API ya Nje | Kutafuta mkopaji kupitia API | Funguo hai ya API yenye ruhusa ya Read ipo | 1. Tuma GET `/api/external/borrowers/search?nationalId={id}`. | Jibu la 200 na data ya mkopaji limerudishwa. | | FR-API-02 |
| TC-EAPI-004 | API ya Nje | Kuwasilisha mkopaji kupitia API | Funguo hai ya API yenye ruhusa ya Submit ipo | 1. Tuma POST `/api/external/borrowers` na mwili wa JSON wenye data ya mkopaji. | Jibu la 201 Created limerudishwa. Mkopaji ameundwa. | | FR-API-02 |
| TC-EAPI-005 | API ya Nje | Kukaguliwa kwa ruhusa - Read pekee haiwezi kuwasilisha | Funguo ya API yenye ruhusa ya Read pekee | 1. Tuma POST `/api/external/borrowers` na funguo ya Read-pekee. | Jibu la 403 Forbidden: "Insufficient permissions." | | FR-API-02 |
| TC-EAPI-006 | API ya Nje | Sehemu ya ukaguzi wa afya | API inapatikana | 1. Tuma ombi la GET kwenye `/api/external/v1/health`. | Jibu: `{ "status": "ok", "version": "1.1", "service": "Systems In Motion Credit Registry API" }`. Hakuna uthibitishaji unaohitajika. | | NFR-SEC-08 |
| TC-EAPI-008 | API ya Nje | Kuwasilisha wakopaji kwa wingi | Funguo hai ya API yenye ruhusa ya "submit" | 1. Tuma POST kwenye `/api/external/v1/borrowers` na safu ya vitu vya wakopaji. | Jibu na matokeo ya kundi: idadi iliyowasilishwa, idadi iliyoshindwa, matokeo na hitilafu binafsi. Ukaguzi: API_BATCH_SUBMIT. | | FR-COL-01 |
| TC-EAPI-009 | API ya Nje | Kuwasilisha akaunti ya mkopo | Funguo hai ya API yenye ruhusa ya "submit" | 1. Tuma POST kwenye `/api/external/v1/credit-accounts` na JSON ya akaunti ya mkopo. | 201 Created. Akaunti ya mkopo imeundwa. Taasisi ya mkopeshaji inachukua thamani ya taasisi ya funguo ya API ikiwa haijabainishwa. | | FR-CR-01 |
| TC-EAPI-010 | API ya Nje | Kuwasilisha akaunti za mikopo kwa wingi | Funguo hai ya API yenye ruhusa ya "submit" | 1. Tuma POST kwenye `/api/external/v1/credit-accounts` na safu ya akaunti za mikopo. | Matokeo ya uchakataji wa kundi yamerudishwa. | | FR-CR-01 |
| TC-EAPI-011 | API ya Nje | Kuwasilisha historia ya malipo | Funguo hai ya API yenye ruhusa ya "submit" | 1. Tuma POST kwenye `/api/external/v1/payment-history` na rekodi za historia ya malipo. | Rekodi za historia ya malipo zimeundwa. Inasaidia uwasilishaji wa moja na kundi. | | FR-CR-08 |
| TC-EAPI-012 | API ya Nje | Kuwasilisha hukumu ya mahakama | Funguo hai ya API yenye ruhusa ya "submit" | 1. Tuma POST kwenye `/api/external/v1/court-judgments` na data ya hukumu. | Hukumu ya mahakama imeundwa. Rekodi ya ukaguzi. | | FR-COL-05 |
| TC-EAPI-014 | API ya Nje | Kutafuta wakopaji kwa jina | Funguo hai ya API yenye ruhusa ya "read" | 1. Tuma GET kwenye `/api/external/v1/borrowers/search?name={name}`. | Wakopaji wanaolingana wamerudishwa. | | FR-CR-01 |
| TC-EAPI-015 | API ya Nje | Kupata ripoti ya mkopo | Funguo hai ya API yenye ruhusa ya "read" | 1. Tuma GET kwenye `/api/external/v1/borrowers/{id}/credit-report`. | Ripoti kamili ya mkopo imerudishwa na: nambari ya mfululizo, alama ya mkopo, misimbo ya sababu, akaunti, maswali, hukumu za mahakama, rekodi za ridhaa. Rekodi ya ripoti imeundwa. | | FR-CR-06 |
| TC-EAPI-016 | API ya Nje | Kupata akaunti za mikopo kwa mkopaji | Funguo hai ya API yenye ruhusa ya "read" | 1. Tuma GET kwenye `/api/external/v1/credit-accounts/{borrowerId}`. | Akaunti za mikopo za mkopaji zimerudishwa. | | FR-CR-01 |
| TC-EAPI-017 | API ya Nje | Kichwa cha funguo ya API hakipo | Hakuna kichwa cha X-API-Key | 1. Tuma ombi lolote kwenye API ya nje bila kichwa cha X-API-Key. | 401 Unauthorized: `{ "error": "Missing X-API-Key header" }`. | | NFR-SEC-08 |
| TC-EAPI-019 | API ya Nje | Funguo ya API iliyofutwa | Funguo ya API iliyofutwa | 1. Tuma ombi na funguo ya API iliyofutwa. | 403 Forbidden: `{ "error": "API key has been revoked" }`. | | NFR-SEC-08 |
| TC-EAPI-021 | API ya Nje | Funguo ya API ya taasisi isiyo hai | Funguo ya API kwa taasisi iliyosimamishwa/inayosubiri | 1. Tuma ombi na funguo inayohusiana na taasisi isiyo hai. | 403 Forbidden: `{ "error": "Institution is not active" }`. | | NFR-SEC-08 |
| TC-EAPI-022 | API ya Nje | Hitilafu ya uthibitishaji kwenye uwasilishaji | Funguo hai ya API | 1. Tuma POST na data batili (sehemu zinazohitajika hazipo). | 400 Bad Request na maelezo ya hitilafu za uthibitishaji. | | FR-COL-01 |
| TC-EAPI-023 | API ya Nje | Ufuatiliaji wa matumizi ya mwisho kwenye funguo ya API | Funguo hai ya API | 1. Fanya ombi lolote la API lililothibitishwa. 2. Angalia rekodi ya funguo ya API. | Muhuri wa lastUsedAt umesasishwa kwenye funguo ya API. | | NFR-SEC-08 |

---

## 20. Moduli ya Ripoti na Usafirishaji

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-RPX-001 | Ripoti na Usafirishaji | Kusafirisha CSV ya kwingineko | Mtumiaji ameingia | 1. Nenda kwenye Reports. 2. Chagua Portfolio Export. 3. Bonyeza "Export CSV". | Faili ya CSV inapakuliwa na data ya akaunti za mikopo ikiwa na: akaunti, salio, hali, sarafu. | | FR-REP-01 |
| TC-RPX-002 | Ripoti na Usafirishaji | Kusafirisha CSV ya wakopaji | Mtumiaji ameingia | 1. Nenda kwenye Reports. 2. Chagua Borrowers Export. 3. Bonyeza "Export CSV". | Faili ya CSV inapakuliwa na data ya wakopaji. | | FR-REP-01 |
| TC-RPX-003 | Ripoti na Usafirishaji | Mwonekano wa uchambuzi wa udhibiti | Mtumiaji ameingia | 1. Nenda kwenye Reports. 2. Angalia sehemu ya uchambuzi wa udhibiti. | Uchambuzi unaonyeshwa: uwiano wa NPL, mgawanyo wa kwingineko kwa taasisi/aina ya mkopo, ufuatiliaji wa ukiukaji wa SLA. | | FR-REG-01 |
| TC-RPX-004 | Ripoti na Usafirishaji | Mgawanyo wa kwingineko kwa taasisi | Data ipo kwa taasisi nyingi | 1. Angalia uchambuzi wa udhibiti. | Data ya kwingineko imegawanywa kwa taasisi ikionyesha kiasi cha mikopo, kiasi kilichobaki, na uwiano wa NPL. | | FR-REG-02 |
| TC-RPX-005 | Ripoti na Usafirishaji | Ufuatiliaji wa ukiukaji wa SLA | Migogoro yenye muda wa mwisho wa SLA uliopitishwa ipo | 1. Angalia uchambuzi wa udhibiti. | Ukiukaji wa SLA umetambuliwa na kuhesabiwa. | | FR-REG-03 |
| TC-RPX-006 | Ripoti na Usafirishaji | Mwonekano wa kumbukumbu za ripoti ya mkopo | Ripoti za mkopo zimetengenezwa | 1. Nenda kwenye kumbukumbu za ripoti ya mkopo (kupitia API au sehemu ya ripoti). | Rekodi za kumbukumbu zinaonyesha: mkopaji, requestedBy, taasisi, madhumuni, nambari ya mfululizo, muhuri wa wakati. | | FR-CR-06 |

---

## 21. Moduli ya Arifa

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-NOT-001 | Arifa | Beji ya idadi ya arifa ambazo hazijasomwa | Mtumiaji ameingia, arifa ambazo hazijasomwa zipo | 1. Angalia aikoni ya kengele ya arifa katika kichwa. | Beji nyekundu inaonyesha idadi ya arifa ambazo hazijasomwa. | | FR-NOT-01 |
| TC-NOT-002 | Arifa | Kusoma arifa | Arifa ambazo hazijasomwa zipo | 1. Bonyeza kengele ya arifa. 2. Bonyeza arifa binafsi. | Arifa imewekwa alama ya kusomwa. Beji inasasishwa. | | FR-NOT-01 |
| TC-NOT-003 | Arifa | Kusoma arifa zote | Arifa nyingi ambazo hazijasomwa zipo | 1. Bonyeza kengele ya arifa. 2. Bonyeza "Mark All as Read". | Arifa zote zimewekwa alama ya kusomwa. Beji inatoweka. | | FR-NOT-01 |
| TC-NOT-004 | Arifa | Kuweka alama ya arifa moja kama imesomwa | Mtumiaji ana arifa ambazo hazijasomwa | 1. Bonyeza kengele ya arifa. 2. Bonyeza arifa ambayo haijasomwa. | Arifa imewekwa alama ya kusomwa. Idadi ya arifa hazijasomwa inapungua kwa 1. | | FR-CON-02 |
| TC-NOT-005 | Arifa | Kuona orodha ya arifa | Mtumiaji ana arifa | 1. Bonyeza kengele ya arifa. | Orodha ya arifa inafunguka ikionyesha kichwa, ujumbe, muhuri wa wakati, na hali ya kusomwa/kutosomwa. | | FR-CON-02 |
| TC-NOT-006 | Arifa | Arifa moja kwa moja kwa ombi la idhini | Mtumiaji anawasilisha mkopaji kwa idhini | 1. Ingia kama Lender. 2. Wasilisha mkopaji mpya. 3. Toka nje. 4. Ingia kama Admin. 5. Angalia arifa. | Admin ana arifa kuhusu ombi la idhini linalosubiri. | | FR-CON-02 |
| TC-NOT-007 | Arifa | Arifa moja kwa moja kwa matokeo ya idhini | Admin anapitisha/kukataa ombi | 1. Admin anapitisha ombi linalosubiri. 2. Toka nje. 3. Ingia kama mwombaji. 4. Angalia arifa. | Mwombaji ana arifa kuhusu matokeo ya kupitishwa/kukataliwa. | | FR-CON-02 |
| TC-NOT-008 | Arifa | Arifa moja kwa moja kwa kuwasilisha mgogoro | Mtumiaji anawasilisha mgogoro | 1. Wasilisha mgogoro. 2. Ingia kama Admin. 3. Angalia arifa. | Admin amearifiwa kuhusu mgogoro mpya. | | FR-CON-02 |

---

## 22. Moduli ya Kimataifa (i18n)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-I18N-001 | Kimataifa | Kubadili lugha kuwa Kifaransa | Mtumiaji ameingia | 1. Bonyeza kitufe cha kubadili lugha katika kichwa. 2. Chagua "FR". | Kiolesura kinabadilika kuwa Kifaransa. Vipengele vya mwambao, kadi za takwimu, lebo za fomu, vitufe vyote vinaonyeshwa kwa Kifaransa. | | NFR-ACC-01 |
| TC-I18N-002 | Kimataifa | Kubadili lugha kuwa Kireno | Mtumiaji ameingia | 1. Bonyeza kitufe cha kubadili lugha. 2. Chagua "PT". | Kiolesura kinabadilika kuwa Kireno. Lebo zote za mwambao na kiolesura zimetafsiriwa. | | NFR-ACC-01 |
| TC-I18N-003 | Kimataifa | Kurudi Kiingereza | Mtumiaji ameingia, lugha imewekwa kuwa FR au PT | 1. Bonyeza kitufe cha kubadili lugha. 2. Chagua "EN". | Kiolesura kinarudi kuwa Kiingereza. Tafsiri zote sahihi. | | NFR-ACC-01 |
| TC-I18N-004 | Kimataifa | Kubadili lugha kwenye ukurasa wa kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia chaguzi za kubadili lugha. 3. Badili kuwa "FR". | Fomu ya kuingia inaonyeshwa kwa Kifaransa. Lebo, kitufe, na maandishi ya kisheria yametafsiriwa. | | NFR-ACC-01 |
| TC-I18N-005 | Kimataifa | Maudhui ya dashibodi kwa Kifaransa | Lugha imewekwa kuwa Kifaransa | 1. Nenda kwenye Dashibodi. | Vichwa vya kadi za takwimu na maelezo yake kwa Kifaransa. | | FR-REG-01 |
| TC-I18N-006 | Kimataifa | Kuendelea kwa lugha | Mtumiaji anabadili kuwa Kifaransa | 1. Badili kuwa Kifaransa. 2. Nenda kwenye kurasa tofauti. | Lugha ya Kifaransa inaendelea katika urambazaji wote wa kurasa ndani ya kipindi. | | FR-REG-01 |
| TC-I18N-007 | Kimataifa | Kubadili lugha kuwa Kireno | Mtumiaji ameingia | 1. Tafuta kitufe cha kubadili lugha katika kichwa/mwambao. 2. Bonyeza kubadili kuwa Kireno (PT). | Maandishi yote ya kiolesura yanabadilika kuwa tafsiri za Kireno. Lebo za mwambao, vichwa vya kurasa, maandishi ya vitufe, na lebo za fomu zote kwa Kireno. | | FR-REG-01 |

---

## 23. Moduli ya Mandhari

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-THM-001 | Mandhari | Kubadili kuwa mandhari ya giza | Mtumiaji ameingia, mandhari angavu | 1. Bonyeza aikoni ya kubadili mandhari (jua/mwezi) katika kichwa. | Kiolesura kinabadilika kuwa mandhari ya giza. Msingi giza, maandishi meupe/mekundu. | | NFR-ACC-02 |
| TC-THM-002 | Mandhari | Kubadili kuwa mandhari angavu | Mtumiaji ameingia, mandhari ya giza | 1. Bonyeza aikoni ya kubadili mandhari tena. | Kiolesura kinarudi kuwa mandhari angavu. | | NFR-ACC-02 |
| TC-THM-003 | Mandhari | Chaguo la mandhari linaendelea | Mtumiaji ameweka mandhari ya giza | 1. Weka mandhari ya giza. 2. Unda upya ukurasa. | Mandhari ya giza inaendelea baada ya kuunda upya (imehifadhiwa katika localStorage). | | NFR-ACC-02 |
| TC-THM-004 | Mandhari | Mandhari ya giza - mwambao | Mandhari ya giza hai | 1. Angalia mwambao katika mandhari ya giza. | Rangi za mwambao zinabadilika ipasavyo. Maandishi yanasomeka. Aikoni zinaonekana. Kipengele hai kinatofautiana. | | NFR-SEC-01 |
| TC-THM-005 | Mandhari | Mandhari ya giza - fomu na pembejeo | Mandhari ya giza hai | 1. Nenda kwenye fomu. | Sehemu za pembejeo, lebo, mipaka, na mandhari yote yanabadilika kwa mandhari ya giza. Maandishi yanasomeka. | | NFR-SEC-01 |
| TC-THM-006 | Mandhari | Mandhari ya giza - majedwali | Mandhari ya giza hai | 1. Nenda kwenye ukurasa wenye jedwali la data. | Vichwa vya jedwali, safu, mipaka, na maandishi yote yanabadilika kwa mandhari ya giza. Rangi za safu mbadala (ikiwepo) zimesasishwa. | | NFR-SEC-01 |
| TC-THM-007 | Mandhari | Mandhari ya giza - kadi za takwimu | Mandhari ya giza hai | 1. Nenda kwenye Dashibodi. | Kadi za takwimu zinabadilika kwa mandhari ya giza na utofautishaji unaofaa. | | NFR-SEC-01 |

---

## 24. Sahihi

| Kipengele | Maelezo |
|------|--------|
| Jumla ya Visa vya Jaribio | 311 |
| Moduli Zilizofunikwa | 40 |
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
| TC-MFA-005 | MFA | Kuzima MFA | Mtumiaji ana MFA imewezeshwa, ameingia | 1. Nenda kwenye mipangilio ya MFA. 2. Bonyeza "Disable MFA". | MFA imezimwa. `mfaEnabled` = false. `mfaSecret` imefutwa. | | ENT-01 |

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
| TC-BOT-003 | Chatbot ya Migogoro | Kughairi mchakato wa chatbot | Chatbot inaendelea | 1. Bonyeza kughairi/kufunga wakati wa hatua yoyote. | Chatbot inarudishwa. Ujumbe wa "Cancelled" unaonyeshwa. Mtumiaji anaweza kuanza mchakato mpya. | | ENT-03 |

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
| TC-TAMP-003 | Ukaguzi Unaostahimili Uharibifu | Uadilifu wa mnyororo wa hash ni sahihi | Kumbukumbu za ukaguzi hazijaharibiwa | 1. Bonyeza "Verify Integrity". | Beji inaonyesha hali ya kijani "Valid". `valid: true` katika jibu. Rekodi zote zimepita uthibitishaji wa mnyororo wa hash. | | ENT-07 |

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
| TC-RET-005 | Sera za Uhifadhi | Kuhariri sera ya uhifadhi | Admin ameingia, sera ya uhifadhi ipo | 1. Bonyeza "Edit" kwenye sera. 2. Badili miaka. 3. Hifadhi. | Sera imesasishwa, arifa ya mafanikio. | | FR-RET-01 |

---

## 35. Moduli ya Utafutaji wa Jumla

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-GS-001 | Utafutaji wa Jumla | Kutafuta kwenye aina nyingi za huluki | Mtumiaji ameingia, data ipo | 1. Nenda kwenye `/search`. 2. Ingiza neno la utafutaji katika kisanduku cha utafutaji. 3. Wasilisha utafutaji. | Matokeo yanaonyeshwa katika makundi matatu: wakopaji, taasisi, na akaunti za mikopo. Rekodi zinazolingana zinaonyeshwa na maelezo husika. | | FR-COL-08 |
| TC-GS-002 | Utafutaji wa Jumla | Kichujio cha nchi | Mtumiaji ameingia | 1. Nenda kwenye `/search`. 2. Ingiza neno la utafutaji. 3. Chagua nchi kutoka menyu ya kichujio cha nchi. 4. Wasilisha utafutaji. | Matokeo yamechujwa kuonyesha rekodi kutoka nchi iliyochaguliwa pekee. | | FR-COL-08 |

---

## 36. Moduli ya Picha za Kitambulisho na Upakiaji wa Nyaraka

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-PHOTO-001 | Picha za Kitambulisho | Kupakia picha ya wasifu | Mtumiaji ameingia, kwenye ukurasa wa maelezo ya mkopaji | 1. Elekeza juu ya picha ya wasifu ya mkopaji. 2. Bonyeza aikoni ya kamera inayoonekana. 3. Chagua faili ya picha (JPEG/PNG, ≤5MB). | Picha imepakiwa na inachukua nafasi ya avatar iliyotengenezwa moja kwa moja. Arifa ya mafanikio inaonyeshwa. | | FR-PHOTO-01 |
| TC-PHOTO-002 | Picha za Kitambulisho | Kupakia hati ya kitambulisho | Mtumiaji ameingia, kwenye ukurasa wa maelezo ya mkopaji | 1. Bonyeza kitufe cha "Upload ID" au sehemu ya kupakia katika kadi ya Personal Info. 2. Chagua faili (JPEG/PNG/PDF, ≤10MB). | Hati ya kitambulisho imepakiwa na inaonyeshwa katika sehemu ya ID Document ya kadi ya Personal Info. Arifa ya mafanikio inaonyeshwa. | | FR-PHOTO-01 |
| TC-PHOTO-003 | Picha za Kitambulisho | Kuonyesha avatar ya DiceBear | Mtumiaji ameingia, mkopaji yupo bila picha iliyopakiwa | 1. Nenda kwenye ukurasa wa maelezo ya mkopaji ambaye hana picha iliyopakiwa. | Avatar iliyotengenezwa moja kwa moja ya DiceBear inaonyeshwa kama picha ya wasifu ya mkopaji. | | FR-COL-07 |

---

## 37. Moduli ya Mazingira ya Maonyesho

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-DEMO-001 | Mazingira ya Maonyesho | Kuingia kwa maonyesho kutoka ukurasa wa kuingia | Programu inapatikana | 1. Nenda kwenye ukurasa wa kuingia. 2. Bonyeza kitufe cha "Try Interactive Demo". 3. Chagua kadi ya jukumu (Admin, Regulator, au Bank Officer). | Mtumiaji ameingia na jukumu la maonyesho lililochaguliwa. Bango la DEMO ENVIRONMENT la rangi ya kaharabu linaonekana juu ya programu. | | ENT-13 |
| TC-DEMO-002 | Mazingira ya Maonyesho | Kuonekana kwa bango la maonyesho | Mtumiaji ameingia kupitia maonyesho | 1. Ingia kupitia mazingira ya maonyesho. 2. Nenda kwenye kurasa tofauti. | Bango la DEMO ENVIRONMENT la rangi ya kaharabu linaendelea kuonekana kwenye kurasa zote. Kanusho la data ya uongo linaonyeshwa. | | ENT-13 |

---

## 38. Moduli ya Kubadili Lugha kwenye Ukurasa wa Kuingia

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-LNG-001 | Kubadili Lugha | Kubadili lugha kwenye ukurasa wa kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia kitufe/menyu ya kubadili lugha. 3. Bonyeza kubadili kuwa "FR". | Ukurasa wa kuingia unaonyeshwa kwa Kifaransa. Lebo za fomu, kitufe cha kuingia, na maandishi yametafsiriwa. | | NFR-ACC-01 |
| TC-LNG-002 | Kubadili Lugha | Chaguo la lugha linaendelea baada ya kuingia | Lugha imewekwa kuwa FR kwenye kuingia | 1. Badili lugha kuwa FR kwenye kuingia. 2. Ingia kwa mafanikio. | Baada ya kuingia, kiolesura kinaendelea kuonyeshwa kwa Kifaransa. Mwambao, dashibodi, na moduli zote kwa Kifaransa. | | NFR-ACC-01 |
| TC-LNG-003 | Kubadili Lugha | Takwimu za lugha kwenye kuingia | Hakuna kipindi hai | 1. Nenda kwenye ukurasa wa kuingia. 2. Angalia maandishi ya kitakwimu. | Ukurasa wa kuingia unaonyesha takwimu: nchi 54 za Afrika, sarafu 42+, taasisi 100+, na lugha 5 za kazi za AU. | | NFR-ACC-01 |
| TC-LNG-004 | Kubadili Lugha | Lugha inaendelea baada ya kuingia | Hakuna | 1. Chagua FR kutoka kitufe cha kubadili lugha. 2. Ingia kama admin. | Dashibodi inaonyeshwa kwa Kifaransa baada ya kuingia. | | FR-REG-01 |

---

## 39. Moduli ya Uchambuzi wa Kuona wa Dashibodi (ENT-14)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-VIZ-001 | Uchambuzi wa Kuona | Chati ya eneo la ukuaji wa kwingineko inapakia na data ya miezi 12 | Mtumiaji ameingia, data ya dashibodi ipo | 1. Nenda kwenye Dashboard (`/`). 2. Sogeza hadi sehemu ya chati ya Portfolio Growth. 3. Angalia chati ya eneo. | Chati ya eneo inachorwa na pointi za data za miezi 12 zinazoonyesha mwenendo wa wakopaji na akaunti kwa muda. Mhimili wa X unaonyesha miezi, mhimili wa Y unaonyesha hesabu. Chati imechorwa kwa kutumia maktaba ya Recharts. | | ENT-14 |
| TC-VIZ-002 | Uchambuzi wa Kuona | Vidokezo vya chati ya eneo wakati wa hover | Mtumiaji ameingia, chati ya ukuaji wa kwingineko inaonekana | 1. Nenda kwenye Dashboard. 2. Weka kipanya juu ya pointi ya data kwenye chati ya eneo la ukuaji wa kwingineko. | Kidokezo kinaonekana kikioonyesha lebo ya mwezi, idadi ya wakopaji, na idadi ya akaunti kwa pointi iliyochaguliwa. | | ENT-14 |
| TC-VIZ-003 | Uchambuzi wa Kuona | Chati ya donut ya hali ya akaunti inaonyesha kategoria zote za hali | Mtumiaji ameingia, akaunti za mikopo zenye hali mbalimbali zipo | 1. Nenda kwenye Dashboard. 2. Tafuta chati ya donut ya Account Status. 3. Angalia sehemu zote zinazoonyeshwa. | Chati ya donut inachorwa na sehemu za kategoria zote za hali ya akaunti (current, delinquent, default, closed, restructured, written_off). Kila sehemu ina rangi tofauti na imeandikwa. | | ENT-14 |
| TC-VIZ-004 | Uchambuzi wa Kuona | Chati ya bar ya mlalo ya aina za mikopo inaonyesha aina kuu za akaunti | Mtumiaji ameingia, akaunti za mikopo zenye aina mbalimbali zipo | 1. Nenda kwenye Dashboard. 2. Tafuta chati ya mgawanyo wa Loan Type. 3. Angalia chati ya bar ya mlalo. | Chati ya bar ya mlalo inachorwa ikionyesha aina kuu za akaunti (k.m., personal_loan, mortgage, business_loan). Bar zinalingana na hesabu ya kila aina. | | ENT-14 |
| TC-VIZ-005 | Uchambuzi wa Kuona | Ramani ya Afrika inachora nchi zote 54 | Mtumiaji ameingia | 1. Nenda kwenye Dashboard. 2. Sogeza hadi sehemu ya Africa Map. 3. Angalia ramani ya SVG. | Ramani ya choropleth ya SVG inachorwa ikionyesha nchi zote 54 za Afrika. Kila nchi ni eneo tofauti linaloweza kuonyeshwa/kuchaguliwa. | | ENT-14 |
| TC-VIZ-006 | Uchambuzi wa Kuona | Rangi ya joto ya ramani inaonyesha viwango vya shughuli za wakopaji | Mtumiaji ameingia, data ya wakopaji ipo katika nchi mbalimbali | 1. Nenda kwenye Dashboard. 2. Angalia upigaji rangi wa ramani ya Afrika. 3. Linganisha rangi na hadithi. | Nchi zenye shughuli kubwa zaidi za wakopaji zinaonyesha rangi nyeusi/kali zaidi ya joto. Nchi zisizo na shughuli zinaonyesha rangi ya kawaida/nyepesi. Hadithi inaonekana ikioonyesha kiwango cha rangi cha viwango vya shughuli. | | ENT-14 |
| TC-VIZ-007 | Uchambuzi wa Kuona | Vidokezo vya hover vya ramani vinaonyesha maelezo ya nchi | Mtumiaji ameingia, ramani ya Afrika inaonekana | 1. Nenda kwenye Dashboard. 2. Weka kipanya juu ya nchi kwenye ramani ya Afrika. | Kidokezo kinaonekana kikioonyesha jina la nchi, idadi ya wakopaji, na idadi ya akaunti kwa nchi hiyo. | | ENT-14 |
| TC-VIZ-008 | Uchambuzi wa Kuona | Chati zinachorwa kwa usahihi katika hali ya giza | Mtumiaji ameingia, hali ya giza imewezeshwa | 1. Badili mandhari kuwa hali ya giza. 2. Nenda kwenye Dashboard. 3. Angalia chati zote (eneo, donut, bar) na ramani ya Afrika. | Chati zote zinabadilika kulingana na hali ya giza na rangi sahihi za mandharinyuma, mhimili, lebo, na vidokezo. Chati zinabaki kusomeka na zinafanana na mandhari ya giza. | | ENT-14 |
| TC-VIZ-009 | Uchambuzi wa Kuona | Miisho ya API ya chart-data inahitaji uthibitishaji | Hakuna kipindi hai | 1. Fungua kichupo kipya cha kivinjari au tumia mteja wa API. 2. Tuma ombi la GET kwa `/api/dashboard/chart-data` bila uthibitishaji. | Ombi linarudisha 401 Unauthorized. Data ya chati haifichuliwi kwa watumiaji wasiothibitishwa. | | ENT-14, NFR-SEC-01 |
| TC-VIZ-010 | Uchambuzi wa Kuona | Chati zinabadilika kwenye skrini za simu | Mtumiaji ameingia | 1. Fungua zana za msanidi wa kivinjari. 2. Weka ukubwa wa skrini kuwa wa simu (k.m., 375x667). 3. Nenda kwenye Dashboard. 4. Sogeza kupitia sehemu zote za chati. | Chati zote zinabadilika ukubwa kwa usahihi ili kutoshea skrini ya simu. Chati zinabaki kusomeka bila kusogeza kwa mlalo. Hadithi na lebo zinajirekebishe ipasavyo. | | ENT-14 |

---

## 40. Moduli ya Ziara ya Maonyesho ya Maingiliano (ENT-15)

| TC-ID | Moduli | Jina la Jaribio | Masharti ya Awali | Hatua za Jaribio | Matokeo Yanayotarajiwa | Imefaulu/Imeshindwa | Rejea ya SRS |
|-------|--------|---------------|----------------|------------|-----------------|-----------|---------------|
| TC-TOUR-001 | Ziara ya Maonyesho | Ziara inazinduka moja kwa moja baada ya kuingia kwa maonyesho | Programu inapatikana | 1. Nenda kwenye ukurasa wa kuingia. 2. Bonyeza kitufe cha "Try Interactive Demo". 3. Chagua jukumu la maonyesho (k.m., Admin). 4. Subiri Dashboard ipakia. | Baada ya kuingia kwa maonyesho, ziara ya mwongozo inazinduka moja kwa moja. Mfumo wa spotlight unaonekana ukiangazia hatua ya kwanza ya ziara. Bendera ya sessionStorage inachochea uzinduzi wa moja kwa moja. | | ENT-15 |
| TC-TOUR-002 | Ziara ya Maonyesho | Ziara ina hatua 11 na mfumo wa spotlight | Ziara inafanya kazi (kutoka TC-TOUR-001) | 1. Angalia mfumo wa ziara. 2. Bonyeza "Next" kupitia hatua zote. 3. Hesabu hatua zote. | Ziara ina hatua 11 kamili. Kila hatua inaonyesha mfumo wa spotlight unaongazia kipengele maalum cha UI (urambazaji wa mwambao, kadi za takwimu, chati, ramani ya Afrika, utafutaji, mipangilio, n.k.). Kihesabu cha hatua kinaonyesha maendeleo (k.m., "Hatua 1 ya 11"). | | ENT-15 |
| TC-TOUR-003 | Ziara ya Maonyesho | Vidhibiti vya Next/Back/Skip/Close vinafanya kazi | Ziara inafanya kazi | 1. Bonyeza "Next" kwenda hatua ya 2. 2. Bonyeza "Back" kurudi hatua ya 1. 3. Bonyeza "Next" kwenda tena. 4. Bonyeza "Skip" kumaliza ziara mapema. 5. Zindua tena ziara. 6. Bonyeza "Close" (kitufe cha X) kuondoa. | Next inaendelea hadi hatua inayofuata. Back inarudi kwenye hatua ya awali. Skip inamaliza ziara mara moja na kufunga mfumo. Close (X) inaondoa mfumo wa ziara. Vidhibiti vyote vinaitikia kwa usahihi. | | ENT-15 |
| TC-TOUR-004 | Ziara ya Maonyesho | Kitufe cha "Take a Tour" kinazindua tena ziara | Mtumiaji ameingia kupitia maonyesho, ziara ilikamilishwa au kurukwa awali | 1. Kamilisha au ruka ziara ya awali. 2. Tafuta bango la DEMO ENVIRONMENT la rangi ya kaharabu juu ya ukurasa. 3. Bonyeza kitufe cha "Take a Tour" ndani ya bango. | Ziara inazinduliwa tena kutoka hatua ya 1. Mfumo wa spotlight unaonekana tena. Ziara kamili ya hatua 11 inapatikana. | | ENT-15 |
| TC-TOUR-005 | Ziara ya Maonyesho | Ziara inafanya kazi katika lugha zote 5 za AU | Mtumiaji ameingia kupitia maonyesho | 1. Weka lugha kuwa Kifaransa (FR). 2. Zindua ziara. Angalia maandishi ya ziara yako kwa Kifaransa. 3. Rudia kwa Kireno (PT), Kiarabu (AR), na Kiswahili (SW). | Vichwa na maelezo ya hatua za ziara yametafsiriwa katika lugha iliyochaguliwa. Lugha zote 5 za AU (EN, FR, PT, AR, SW) zinaonyesha maudhui yaliyotafsiriwa kwa usahihi. | | ENT-15 |
| TC-TOUR-006 | Ziara ya Maonyesho | Ziara inashughulikia mwambao wa simu kwa usahihi | Mtumiaji ameingia kupitia maonyesho, skrini ya simu | 1. Weka ukubwa wa skrini kuwa wa simu. 2. Zindua ziara ya maonyesho. 3. Angalia tabia ya ziara wakati wa kuangazia vipengele vya mwambao. | Kwenye skrini za simu, ziara inashughulikia kwa usahihi mwambao unaokunjuka. Ikiwa hatua ya ziara inangazia kipengele cha mwambao, mwambao unafunguka moja kwa moja au hatua inabadilika kulingana na mpangilio wa simu. Ziara inabaki kutumika kwenye simu. | | ENT-15 |

---

**Mwisho wa Hati**

*Hati hii ya Majaribio ya UAT inashughulikia moduli zote za Mfumo wa Kituo cha Kati cha Data na Daftari la Mikopo kwa Mamlaka Mbalimbali v1.2, ikijumuisha uboreshaji 15 wa biashara (ENT-01 hadi ENT-15). Kila kisa cha jaribio kimeundwa kuthibitisha mahitaji ya kitendaji na yasiyo ya kitendaji kama ilivyofafanuliwa katika Maelezo ya Mahitaji ya Programu (SRS).*

*Imeandaliwa na: Systems In Motion Limited*  
*Uainishaji: Siri*
