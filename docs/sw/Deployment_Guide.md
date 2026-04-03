# Mwongozo wa Kupeleka (Deployment Guide)

## Kituo cha Data cha Kati cha Mamlaka Mbalimbali na Mfumo wa Rejista ya Mikopo v2.5

**Imeandaliwa kwa:** Systems In Motion Limited  
**Toleo la Hati:** 2.5  
**Tarehe:** Aprili 2026

---

## 1. Muhtasari

Mwongozo huu unatoa maelekezo ya hatua kwa hatua ya kupeleka Mfumo wa Rejista ya Mikopo. Programu hii inajumuisha kiolesura cha React kinachohudumwa na seva ya Express.js, pamoja na PostgreSQL kama hifadhidata. Hali mbili za kupeleka zinashughulikiwa: kupeleka kwa Replit na kupeleka kwa Linux/Docker kwa ujumla.

---

## 2. Mahitaji ya Awali

### 2.1 Mahitaji ya Programu

| Kipengele | Toleo la Chini | Madhumuni |
|-----------|----------------|-----------|
| Node.js | 18.x au zaidi | Mazingira ya uendeshaji |
| npm | 9.x au zaidi | Usimamizi wa vifurushi |
| PostgreSQL | 14.x au zaidi | Seva ya hifadhidata |
| Git | 2.x au zaidi | Udhibiti wa chanzo |

### 2.2 Mahitaji ya Vifaa

Jukwaa la CDH linaweza kupelekwa kwa viwango tofauti kulingana na idadi ya waombaji mikopo, watumiaji wa wakati mmoja, na wigo wa udhibiti.

#### 2.2.1 Maendeleo / Majaribio (Ofisi Moja, < 50K Waombaji Mikopo)

| Rasilimali | Maelezo |
|------------|---------|
| **Seva ya Programu** | 2 vCPU, 4 GB RAM, 20 GB SSD |
| **Seva ya Hifadhidata** | 2 vCPU, 4 GB RAM, 50 GB SSD (au PostgreSQL inayosimamiwa — Neon, RDS, n.k.) |
| **Mtandao** | 10 Mbps sawa, IPv4 ya umma |
| **OS** | Ubuntu 22.04 LTS / RHEL 9 / Debian 12 (64-bit) |
| **Watumiaji wa Wakati Mmoja** | Hadi 25 |

#### 2.2.2 Uzalishaji — Nchi Moja (Ofisi ya Kitaifa, 50K–500K Waombaji Mikopo)

| Rasilimali | Maelezo |
|------------|---------|
| **Seva ya Programu** | 4 vCPU, 8 GB RAM, 50 GB SSD |
| **Seva ya Hifadhidata** | 4 vCPU, 16 GB RAM, 200 GB SSD (NVMe inapendekezwa), kiendelezi cha pg_trgm |
| **Hifadhi ya Faili** | 100 GB+ (picha za kitambulisho, hati, PDF zilizozalishwa katika `uploads/`) |
| **Mtandao** | 100 Mbps sawa, kiungo mbadala |
| **Watumiaji wa Wakati Mmoja** | Hadi 100 |
| **Viunganisho vya BD** | Ukubwa wa pool 10–20 (tazama Sehemu 4.4) |

#### 2.2.3 Uzalishaji — Nchi Nyingi / Pan-Afrika (500K+ Waombaji Mikopo)

| Rasilimali | Maelezo |
|------------|---------|
| **Seva za Programu** | 2× (8 vCPU, 16 GB RAM, 50 GB SSD) nyuma ya msawazishaji wa mzigo |
| **Seva ya BD (Msingi)** | 8 vCPU, 32 GB RAM, 500 GB NVMe SSD, uhifadhi wa WAL umewezeshwa |
| **Seva ya BD (Nakala)** | 4 vCPU, 16 GB RAM, 500 GB NVMe SSD (replication ya kuendelea) |
| **Hifadhi ya Faili/Vitu** | 500 GB+ (S3-compatible au NFS mount kwa `uploads/`) |
| **Mtandao** | 1 Gbps sawa, viungo vya akiba, ulinzi wa DDoS |
| **Msawazishaji wa Mzigo** | Nginx / HAProxy na TLS na vikao vya kudumu |
| **Watumiaji wa Wakati Mmoja** | 100–500+ |
| **Viunganisho vya BD** | Ukubwa wa pool 20–50 |

#### 2.2.4 Kiwango cha Chini (Maendeleo Pekee)

| Rasilimali | Kiwango cha Chini |
|------------|-------------------|
| CPU | 1 vCPU |
| RAM | 512 MB |
| Diski | 1 GB |
| Mtandao | 1 Mbps |

> **Kumbuka:** Kiwango hiki cha chini kinafaa tu kwa maendeleo na maonyesho.

### 2.3 Mahitaji ya Mtandao

- Ufikiaji wa nje kwa hifadhidata ya PostgreSQL (bandari 5432 au maalum ya mtoa huduma)
- Ufikiaji wa ndani kwenye bandari ya programu (chaguo-msingi 5000)
- Usimbaji wa HTTPS (kupitia proksi ya nyuma au inayotolewa na jukwaa)
- Ufikiaji wa HTTPS wa nje kwa `api.dicebear.com` (picha za waombaji mikopo zinazozalishwa kiotomatiki)
- Ufikiaji wa HTTPS wa nje kwa `open.er-api.com` (kupata viwango vya ubadilishaji wa fedha vya moja kwa moja)
- Ufikiaji wa HTTPS wa nje kwa OpenAI API (vipengele vya AI; URL imesanidiwa kupitia `AI_INTEGRATIONS_OPENAI_BASE_URL`)

---

## 3. Vigezo vya Mazingira (Environment Variables)

| Kigezo | Kinahitajika | Maelezo | Mfano |
|--------|-------------|---------|-------|
| `DATABASE_URL` | Ndiyo | Mfuatano wa muunganisho wa PostgreSQL | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `SESSION_SECRET` | Ndiyo (uzalishaji) | Ufunguo wa usimbaji wa kikao cha Express (angalau herufi 32) | `a-long-random-string-at-least-32-characters` |
| `PORT` | Hapana | Bandari ya programu (chaguo-msingi: 5000) | `5000` |
| `NODE_ENV` | Hapana | Hali ya mazingira (development/production) | `production` |

### 3.1 Kuzalisha Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. Usanidi wa Hifadhidata

### 4.1 Utoaji wa PostgreSQL

Mfumo unahitaji hifadhidata ya PostgreSQL. Chaguzi ni pamoja na:

- **Neon** (PostgreSQL isiyo na seva, inayopendekezwa kwa Replit)
- **Amazon RDS** kwa kazi za uzalishaji
- **PostgreSQL inayojihifadhi** kwenye seva za Linux
- **Docker PostgreSQL** kwa kupeleka kwa kontena

### 4.2 Viendelezi vya PostgreSQL

Programu inahitaji kiendelezi kifuatacho cha PostgreSQL:

- **pg_trgm** — Ufanano wa trigram kwa kulinganisha taasisi kwa ukaribu (ENT-02). Inawezeshwa kiotomatiki wakati wa kuanza kwa programu kupitia `CREATE EXTENSION IF NOT EXISTS pg_trgm`.

Hakikisha mtumiaji wa PostgreSQL ana ruhusa ya kuunda viendelezi, au kiunde mapema:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4.3 Uanzishaji wa Muundo wa Hifadhidata (Schema)

Programu inatumia Drizzle ORM kwa usimamizi wa muundo. Wakati wa kuanza kwa mara ya kwanza, programu itafanya kiotomatiki:

1. Kuunganisha na hifadhidata kwa kutumia `DATABASE_URL`
2. Kuwezesha kiendelezi cha `pg_trgm` kwa kulinganisha kwa ukaribu
3. Kusukuma muundo kwa kutumia Drizzle (meza 21)
4. Kupanda data ya awali (watumiaji, waombaji mikopo, akaunti za mikopo, n.k.)

Kusukuma muundo kwa mkono:

```bash
npx drizzle-kit push
```

### 4.3 Data ya Awali (Seed Data)

Mchakato wa kupanda (`server/seed.ts`) unaunda:

- Watumiaji 6 wa mfumo wenye vitambulisho vilivyowekwa mapema
- Waombaji mikopo 102,462 kutoka nchi zote 54 za Afrika
- Taasisi 100,020
- Akaunti za mikopo 172,359
- Rekodi 120,000 za historia ya malipo
- Maswali 25,004 ya mikopo
- Rekodi 15,000 za idhini
- Kumbukumbu 5,063 za ukaguzi
- Migogoro 3,218
- Hukumu 2,147 za mahakama
- Rekodi 120 za malipo ya bili

**Vitambulisho vya Chaguo-msingi (vibadilishe katika uzalishaji):**

| Username | Password | Role | Institution |
|----------|----------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Regulator | NBE |
| cbe_user | cbe123 | Lender | CBE |
| dashen_user | dashen123 | Lender | Dashen |
| awash_user | awash123 | Lender | Awash |

### 4.4 Usanidi wa Dimbwi la Muunganisho (Connection Pool)

Programu inatumia dimbwi la muunganisho wa hifadhidata 2 kwa chaguo-msingi (`server/db.ts`). Kwa kupeleka kwa trafiki kubwa zaidi, ongeza ukubwa wa dimbwi:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

---

## 5. Mchakato wa Ujenzi (Build)

### 5.1 Sakinisha Vitegemezi

```bash
npm install
```

### 5.2 Jenga kwa Uzalishaji

```bash
npm run build
```

Hii inatekeleza hatua mbili za ujenzi:

1. **Ujenzi wa seva** (esbuild): Inakusanya msimbo wa seva wa TypeScript kuwa `dist/index.cjs`
2. **Ujenzi wa kiolesura** (Vite): Inakusanya programu ya React kuwa `dist/public/`

### 5.3 Muundo wa Matokeo ya Ujenzi

```
dist/
  index.cjs          # Bunda ya seva iliyokusanywa (CommonJS)
  public/             # Mali za kiolesura zilizokusanywa
    index.html
    assets/
      *.js            # Bunda za JavaScript
      *.css           # Bunda za mitindo
uploads/              # Faili zilizopakiwa na watumiaji (zinaundwa wakati wa uendeshaji)
  photos/             # Picha za waombaji mikopo (kiwango cha juu 5MB kila moja)
  documents/          # Hati za kitambulisho za waombaji mikopo (kiwango cha juu 10MB kila moja)
```

> **Kumbuka:** Saraka ya `uploads/` inaundwa kiotomatiki wakati wa kuanza kwa programu. Hakikisha mchakato wa programu una ruhusa ya kuandika kwenye saraka ya kazi. Kwa kupeleka kwa Docker, fikiria kuunganisha kiasi cha kudumu kwenye njia ya `uploads/` ili kuhifadhi faili zilizopakiwa katika kuanzisha upya kwa kontena.

---

## 6. Kuanza kwa Uzalishaji (Production Start)

### 6.1 Kuanza Programu

```bash
NODE_ENV=production node dist/index.cjs
```

Seva itafanya:
1. Kuunganisha na PostgreSQL
2. Kuendesha mchakato wa kupanda (idempotent, inaruka ikiwa data ipo)
3. Kuhudumia kiolesura kutoka `dist/public/`
4. Kusikiliza kwenye PORT iliyosanidiwa (chaguo-msingi 5000)

### 6.2 Usimamizi wa Mchakato

Kwa uzalishaji, tumia meneja wa mchakato:

**Kutumia PM2:**
```bash
npm install -g pm2
NODE_ENV=production pm2 start dist/index.cjs --name credit-registry
pm2 save
pm2 startup
```

**Kutumia systemd:**
```ini
[Unit]
Description=Credit Registry System
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/credit-registry
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://...
Environment=SESSION_SECRET=your-secret-here
ExecStart=/usr/bin/node dist/index.cjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 7. Kupeleka Mahususi kwa Replit

### 7.1 Usanidi

Programu imesanidiwa mapema kwa kupeleka kwa Replit. Faili ya `.replit` inafafanua:

- Amri ya ujenzi: `npm run build`
- Amri ya kuendesha: `node ./dist/index.cjs`
- Lengo la kupeleka: Autoscale

### 7.2 Siri za Mazingira (Environment Secrets)

Katika Replit, weka vigezo vya mazingira kupitia kichupo cha Secrets:
1. `DATABASE_URL` - Mfuatano wa muunganisho wa PostgreSQL (Neon inapendekezwa)
2. `SESSION_SECRET` - Mfuatano wa nasibu kwa usimbaji wa kikao

### 7.3 Hali ya Maendeleo (Development Mode)

Katika maendeleo, programu inaendeshwa na Vite HMR (Hot Module Replacement):

```bash
npm run dev
```

Hii inaanzisha:
- Seva ya Express API na TypeScript kupitia tsx
- Seva ya maendeleo ya Vite na proksi ya HMR

---

## 8. Kupeleka kwa Docker

### 8.1 Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
```

### 8.2 Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/credit_registry
      - SESSION_SECRET=your-production-secret-here
    volumes:
      - uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=credit_registry
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
  uploads:
```

### 8.3 Jenga na Endesha

```bash
docker-compose up -d --build
```

---

## 9. Ukaguzi wa Afya (Health Checks)

### 9.1 Afya ya Programu

```bash
curl http://localhost:5000/api/health
```

**Jibu Linalotarajiwa:**
```json
{ "status": "ok" }
```

### 9.2 Afya ya API ya Nje

```bash
curl http://localhost:5000/api/external/v1/health
```

**Jibu Linalotarajiwa:**
```json
{
  "status": "ok",
  "version": "1.2",
  "service": "Systems In Motion Credit Registry API"
}
```

### 9.3 Hati ya Ukaguzi wa Afya

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$RESPONSE" -eq 200 ]; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed with status: $RESPONSE"
  exit 1
fi
```

---

## 10. Usanidi wa Proksi ya Nyuma (Reverse Proxy)

### 10.1 Nginx

```nginx
server {
    listen 80;
    server_name credit-registry.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10.2 SSL/TLS

Kwa uzalishaji, tumia HTTPS kila wakati. Chaguzi:
- **Let's Encrypt** na certbot kwa vyeti vya SSL vya bure
- **SSL ya mtoa huduma wa wingu** (AWS ACM, Cloudflare, n.k.)
- **Replit** inatoa HTTPS kiotomatiki

---

## 11. Ufuatiliaji (Monitoring)

### 11.1 Kumbukumbu za Programu (Application Logging)

Programu inarekodi maombi yote ya API kwa stdout kwa muundo ufuatao:
```
10:30:00 AM [express] GET /api/health 200 in 5ms :: {"status":"ok"}
```

### 11.2 Njia ya Ukaguzi (Audit Trail)

Vitendo vyote vya watumiaji vinarekodwa katika jedwali la `audit_logs` na:
- Kitambulisho cha mtumiaji na aina ya kitendo
- Aina ya taasisi na kitambulisho
- Anwani ya IP
- Muhuri wa wakati
- Maelezo yanayosomeka na binadamu

### 11.3 Zana za Ufuatiliaji Zinazopendekezwa

| Zana | Madhumuni |
|------|-----------|
| PM2 | Ufuatiliaji wa mchakato, kuanza upya kiotomatiki |
| Datadog/New Relic | Ufuatiliaji wa utendaji wa programu |
| pgAdmin | Ufuatiliaji na usimamizi wa hifadhidata |
| Grafana + Prometheus | Kuonyesha vipimo |

---

## 12. Uhifadhi na Urejeshaji (Backup and Recovery)

### 12.1 Uhifadhi wa Hifadhidata

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 12.2 Uhifadhi wa Kiotomatiki

```bash
# Ingizo la Crontab kwa uhifadhi wa kila siku saa 2 asubuhi
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/credit_registry_$(date +\%Y\%m\%d).sql.gz
```

### 12.3 Kurejesha kutoka kwa Uhifadhi

```bash
psql $DATABASE_URL < backup_20250115_020000.sql
```

---

## 13. Utatuzi wa Matatizo (Troubleshooting)

### 13.1 Matatizo ya Kawaida

| Tatizo | Sababu | Suluhisho |
|--------|--------|-----------|
| Muunganisho umekataliwa kwenye bandari 5000 | Programu haifanyi kazi | Angalia `NODE_ENV`, thibitisha `dist/index.cjs` ipo |
| Kosa la muunganisho wa hifadhidata | `DATABASE_URL` batili | Thibitisha mfuatano wa muunganisho, angalia sheria za mtandao/kinga |
| Kikao hakihifadhiwi | `SESSION_SECRET` haipo | Weka kigezo cha mazingira cha `SESSION_SECRET` |
| 440 Kikao Kimekwisha | Muda wa kupumzika wa dakika 15 | Ingia tena; hii ni tabia ya usalama inayotarajiwa (NFR-SEC-09) |
| Kupanda kunashindwa wakati wa kuanza kwa mara ya kwanza | Meza bado hazijaundwa | Endesha `npx drizzle-kit push` kwanza, kisha uanze upya |
| Ujenzi unashindwa | Vitegemezi havipo | Endesha `npm install` kabla ya `npm run build` |
| Faili tuli hazihudumiwi | `NODE_ENV` isiyo sahihi | Hakikisha `NODE_ENV=production` kwa kuhudumia faili tuli |
| API inarudisha 401 | Haijathibitishwa | Ingia kwanza; angalia kuki ya kikao inatumwa |
| API inarudisha 403 | Jukumu halifai | Angalia jukumu la mtumiaji linalofanana na mahitaji ya njia |

### 13.2 Utatuzi wa Kina (Debugging)

Wezesha kumbukumbu za kina:
```bash
DEBUG=* NODE_ENV=production node dist/index.cjs
```

Angalia muunganisho wa hifadhidata:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

Thibitisha uundaji wa meza:
```bash
psql $DATABASE_URL -c "\dt"
```

### 13.3 Kurekebisha Utendaji (Performance Tuning)

- Ongeza ukubwa wa dimbwi la hifadhidata kwa uendeshaji wa wakati mmoja zaidi
- Wezesha dimbwi la muunganisho wa PostgreSQL (PgBouncer)
- Tumia CDN kwa mali tuli za kiolesura
- Usimbaji wa gzip umejengwa ndani ya programu kupitia middleware ya `compression` (ENT-05); usimbaji wa proksi ya nyuma ni wa hiari
- Fuatilia na uweke index kwenye safu wima zinazohojiwa mara kwa mara
- Ugawaji wa msimbo wa React.lazy unapunguza ukubwa wa bunda ya awali kwa upakiaji wa haraka wa kurasa (ENT-05)

---

## 14. Orodha ya Ukaguzi wa Kuimarisha Usalama

- [ ] Badilisha vitambulisho vyote vya chaguo-msingi vya data ya awali
- [ ] Weka `SESSION_SECRET` yenye nguvu (herufi 64+ za nasibu)
- [ ] Wezesha HTTPS kupitia proksi ya nyuma au jukwaa
- [ ] Weka `cookie.secure = true` katika uzalishaji
- [ ] Zuia ufikiaji wa hifadhidata kwa IP ya programu pekee
- [ ] Wezesha SSL ya PostgreSQL (`?sslmode=require`)
- [ ] Sanidi uhifadhi wa kiotomatiki wa hifadhidata
- [ ] Sanidi sheria za kinga (ruhusu bandari 443/80 pekee)
- [ ] Wezesha mzunguko wa kumbukumbu kwa kumbukumbu za programu
- [ ] Kagua na zuia CORS ikiwa inahitajika
- [ ] Sanidi ufuatiliaji na tahadhari
- [ ] Fanya ukaguzi wa usalama kabla ya kuanza kutumia
- [ ] Lazimisha MFA (ENT-01) kwa akaunti za msimamizi na mdhibiti
- [ ] Zungusha funguo za kusaini JWT za OAuth mara kwa mara (ENT-04)
- [ ] Thibitisha uadilifu wa kumbukumbu za ukaguzi (ENT-07) kama sehemu ya ukaguzi wa kawaida wa usalama
- [ ] Hakikisha kiendelezi cha `pg_trgm` (ENT-02) kinapatikana katika PostgreSQL ya uzalishaji
- [ ] Thibitisha upakiaji wa XBRL/XML kwa makundi (ENT-06) unafanya kazi na ukubwa wa faili unaotarajiwa; hakuna maktaba za ziada za uchambuzi zinazohitajika zaidi ya ushughulikiaji wa XML uliojengwa ndani
- [ ] Chatbot ya migogoro (ENT-03) haihitaji usanidi wa ziada; inatumia vituo vilivyopo vya kuwasilisha migogoro

---

## 15. Vitegemezi vya Uboreshaji wa Biashara (Enterprise Enhancement Dependencies)

Vifurushi vifuatavyo vya ziada viliongezwa kwa uboreshaji wa biashara (v1.1 na v2.5):

| Kifurushi | Madhumuni | Uboreshaji |
|-----------|-----------|------------|
| `otpauth` | Uzalishaji na uthibitishaji wa siri za TOTP | ENT-01 (MFA) |
| `jsonwebtoken` | Kusaini na kuthibitisha JWT kwa tokeni za Bearer | ENT-04 (OAuth 2.1) |
| `compression` | Middleware ya usimbaji wa gzip | ENT-05 (Kipimo cha Chini cha Bandwidth) |
| `multer` | Ushughulikiaji wa upakiaji wa faili za multipart/form-data | ENT-12 (Picha na Hati za Kitambulisho) |
| `recharts` | Maktaba ya taswira za data zinazobadilika kwa chati za dashibodi | ENT-14 (Uchambuzi wa Kuona wa Dashibodi) |

**Kiendelezi cha PostgreSQL:**
- `pg_trgm` — Kinahitajika kwa kulinganisha taasisi kwa ukaribu (ENT-02). Kinaundwa kiotomatiki wakati wa kuanza.

---

## 16. Vipengele na Uwezo Muhimu

Mfumo wa Rejista ya Mikopo unajumuisha moduli na uwezo ufuatao:

| Kipengele | Maelezo |
|-----------|---------|
| Usindikaji wa Fedha Nyingi | Msaada kwa fedha 42+ za Afrika pamoja na USD, EUR, GBP katika mamlaka 54 |
| Kimataifa (i18n) | Lugha tano zinazosaidiwa: Kiingereza (EN), Kifaransa (FR), Kireno (PT), Kiarabu (AR), na Kiswahili (SW) |
| Kibadilishi cha Lugha kwenye Ukurasa wa Kuingia | Watumiaji wanaweza kuchagua lugha wanayopendelea moja kwa moja kutoka kwenye skrini ya kuingia |
| Usimamizi wa Viwango vya Ubadilishaji | Moduli ya kusimamia na kusasisha viwango vya ubadilishaji wa fedha kati ya fedha zinazosaidiwa |
| Utawala wa API | Kiolesura cha utawala kwa kusimamia funguo za API, kufuatilia matumizi, na kusanidi ufikiaji wa API ya nje |
| Sera za Uhifadhi wa Data | Sera za uhifadhi zinazoweza kusanidiwa na injini ya utekelezaji wa kiotomatiki kwa utiifu wa udhibiti |
| Uthibitishaji wa MFA | Uthibitishaji wa hatua nyingi kwa kutumia TOTP kwa akaunti za msimamizi na mdhibiti (ENT-01) |
| Kulinganisha Taasisi kwa Ukaribu | Utafutaji wa waombaji mikopo unaotegemea trigram kwa kutumia pg_trgm (ENT-02) |
| Chatbot ya Migogoro | Chatbot ya mwingiliano kwa kuongoza uwasilishaji wa migogoro (ENT-03) |
| API ya Nje ya OAuth 2.1 | API ya REST iliyolindwa na JWT kwa ushirikiano wa wahusika wa tatu (ENT-04) |
| Uboreshaji wa Kipimo cha Chini cha Bandwidth | Usimbaji wa gzip na ugawaji wa msimbo kwa mitandao yenye vikwazo (ENT-05) |
| Upakiaji wa Makundi (XBRL/XML) | Uingizaji wa data kwa wingi kupitia muundo wa faili uliopangwa (ENT-06) |
| Njia ya Ukaguzi Isiyobadilishwa | Kumbukumbu za ukaguzi zilizofungwa kwa mlolongo wa hash na uthibitishaji wa uadilifu (ENT-07) |
| Utafutaji wa Kimataifa | Utafutaji wa taasisi mbalimbali kati ya waombaji mikopo, taasisi, na akaunti za mikopo (ENT-11) |
| Picha na Hati za Kitambulisho | Picha za DiceBear zinazozalishwa kiotomatiki na upakiaji wa picha/hati unaotegemea multer (ENT-12) |
| Mazingira ya Onyesho | Onyesho la kubofya mara moja kwa wawekezaji na kadi za jukumu na bango la DEMO (ENT-13) |
| Uchambuzi wa Kuona wa Dashibodi | Chati za maingiliano za Recharts (eneo la mwenendo, donut ya hali, bar ya aina za mikopo) na ramani ya choropleth ya SVG ya Afrika yenye rangi ya joto kwa nchi 54; msaada wa hali ya giza (ENT-14) |
| Ziara ya Maonyesho ya Maingiliano | Mwongozo wa hatua 11 wenye mfumo wa spotlight, vidhibiti vya urambazaji, uzinduzi wa moja kwa moja, na msaada wa lugha 5 za AU (ENT-15) |

---

## 17. Taarifa za Toleo

| Kipengele | Toleo |
|-----------|-------|
| Programu | v2.5 (Uboreshaji wa Biashara) |
| Node.js Runtime | 20.x LTS |
| Express.js | 4.x |
| Drizzle ORM | Toleo la Hivi Karibuni |
| Vite | 5.x |
| React | 18.x |
| PostgreSQL | 14+ |
| TypeScript | 5.x |
| otpauth | Toleo la Hivi Karibuni (ENT-01) |
| jsonwebtoken | Toleo la Hivi Karibuni (ENT-04) |
| compression | Toleo la Hivi Karibuni (ENT-05) |
