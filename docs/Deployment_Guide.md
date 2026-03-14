# Deployment Guide

## Cross-Jurisdictional Central Data Hub & Credit Registry System v2.0

**Prepared for:** Systems In Motion Limited  
**Document Version:** 1.2  
**Date:** March 2026

---

## 1. Overview

This guide provides step-by-step deployment instructions for the Credit Registry System. The application consists of a React frontend served by an Express.js backend, with PostgreSQL as the database. Two deployment scenarios are covered: Replit deployment and general Linux/Docker deployment.

---

## 2. Prerequisites

### 2.1 Software Requirements

| Component | Minimum Version | Purpose |
|-----------|----------------|---------|
| Node.js | 18.x or later | Runtime environment |
| npm | 9.x or later | Package management |
| PostgreSQL | 14.x or later | Database server |
| Git | 2.x or later | Source control |

### 2.2 Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2+ vCPU |
| RAM | 512 MB | 2 GB+ |
| Disk | 1 GB | 5 GB+ (additional space required for uploaded photos and ID documents in `uploads/` directory) |
| Network | 1 Mbps | 10 Mbps+ |

### 2.3 Network Requirements

- Outbound access to PostgreSQL database (port 5432 or provider-specific)
- Inbound access on application port (default 5000)
- HTTPS termination (via reverse proxy or platform-provided)
- Outbound HTTPS access to `api.dicebear.com` (auto-generated borrower avatars)
- Outbound HTTPS access to `open.er-api.com` (live exchange rate fetching)
- Outbound HTTPS access to OpenAI API endpoint (AI-powered features; URL configured via `AI_INTEGRATIONS_OPENAI_BASE_URL`)

---

## 3. Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `SESSION_SECRET` | Yes (production) | Express session encryption key (min 32 chars) | `a-long-random-string-at-least-32-characters` |
| `PORT` | No | Application port (default: 5000) | `5000` |
| `NODE_ENV` | No | Environment mode (development/production) | `production` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | OpenAI API key for AI-powered features (credit risk analysis, report summaries, chatbot, compliance reports) | `sk-...` |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | OpenAI API base URL (provided by Replit AI Integrations) | `https://ai.replit.dev/v1` |

### 3.1 Generating a Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. Database Setup

### 4.1 PostgreSQL Provisioning

The system requires a PostgreSQL database. Options include:

- **Neon** (serverless PostgreSQL, recommended for Replit)
- **Amazon RDS** for production workloads
- **Self-hosted PostgreSQL** on Linux servers
- **Docker PostgreSQL** for containerized deployments

### 4.2 PostgreSQL Extensions

The application requires the following PostgreSQL extension:

- **pg_trgm** — Trigram similarity for fuzzy entity matching (ENT-02). Automatically enabled at application startup via `CREATE EXTENSION IF NOT EXISTS pg_trgm`.

Ensure the PostgreSQL user has permission to create extensions, or pre-create it:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4.3 Schema Initialization

The application uses Drizzle ORM for schema management. On first startup, the application will automatically:

1. Connect to the database using `DATABASE_URL`
2. Enable the `pg_trgm` extension for fuzzy matching
3. Push the schema using Drizzle (21 tables)
4. Seed initial data (users, borrowers, credit accounts, etc.)

To manually push the schema:

```bash
npx drizzle-kit push
```

### 4.3 Seed Data

The seed process (`server/seed.ts`) creates:

- 6 system users with predefined credentials (including super admin)
- 102,462 borrowers across all 54 African countries
- 100,020 institutions
- 172,359 credit accounts
- 120,000 payment history records
- 25,004 credit inquiries
- 15,000 consent records
- 5,063 audit logs
- 3,218 disputes
- 2,147 court judgments
- 120 billing records
- 11 pricing tiers (transaction-based monetization)
- 8 retention policies (per-jurisdiction data retention rules)

**Default Credentials (change in production):**

| Username | Password | Role | Institution |
|----------|----------|------|-------------|
| admin | admin123 | Admin | NBE |
| regulator1 | reg123 | Regulator | NBE |
| cbe_user | cbe123 | Lender | CBE |
| dashen_user | dashen123 | Lender | Dashen |
| awash_user | awash123 | Lender | Awash |

### 4.4 Connection Pool Configuration

The application uses a pool of 2 database connections by default (`server/db.ts`). For higher-traffic deployments, increase the pool size:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

---

## 5. Build Process

### 5.1 Install Dependencies

```bash
npm install
```

### 5.2 Build for Production

```bash
npm run build
```

This executes two build steps:

1. **Backend build** (esbuild): Compiles TypeScript server code to `dist/index.cjs`
2. **Frontend build** (Vite): Compiles React application to `dist/public/`

### 5.3 Build Output Structure

```
dist/
  index.cjs          # Compiled server bundle (CommonJS)
  public/             # Compiled frontend assets
    index.html
    assets/
      *.js            # JavaScript bundles
      *.css           # Stylesheet bundles
uploads/              # User-uploaded files (created at runtime)
  photos/             # Borrower profile photos (max 5MB each)
  documents/          # Borrower ID documents (max 10MB each)
```

> **Note:** The `uploads/` directory is created automatically at application startup. Ensure the application process has write permissions to the working directory. For Docker deployments, consider mounting a persistent volume at the `uploads/` path to preserve uploaded files across container restarts.

---

## 6. Production Start

### 6.1 Starting the Application

```bash
NODE_ENV=production node dist/index.cjs
```

The server will:
1. Connect to PostgreSQL
2. Run seed process (idempotent, skips if data exists)
3. Serve the frontend from `dist/public/`
4. Listen on the configured PORT (default 5000)

### 6.2 Process Management

For production, use a process manager:

**Using PM2:**
```bash
npm install -g pm2
NODE_ENV=production pm2 start dist/index.cjs --name credit-registry
pm2 save
pm2 startup
```

**Using systemd:**
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

## 7. Replit-Specific Deployment

### 7.1 Configuration

The application is pre-configured for Replit deployment. The `.replit` file defines:

- Build command: `npm run build`
- Run command: `node ./dist/index.cjs`
- Deployment target: Autoscale

### 7.2 Environment Secrets

In Replit, set environment variables via the Secrets tab:
1. `DATABASE_URL` - PostgreSQL connection string (Neon recommended)
2. `SESSION_SECRET` - Random string for session encryption

### 7.3 Development Mode

In development, the application runs with Vite HMR (Hot Module Replacement):

```bash
npm run dev
```

This starts:
- Express API server with TypeScript via tsx
- Vite development server with HMR proxy

---

## 8. Docker Deployment

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

### 8.3 Build and Run

```bash
docker-compose up -d --build
```

---

## 9. Health Checks

### 9.1 Application Health

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{ "status": "ok" }
```

### 9.2 External API Health

```bash
curl http://localhost:5000/api/external/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "1.2",
  "service": "Systems In Motion Credit Registry API"
}
```

### 9.3 Health Check Script

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

## 10. Reverse Proxy Configuration

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

For production, always use HTTPS. Options:
- **Let's Encrypt** with certbot for free SSL certificates
- **Cloud provider SSL** (AWS ACM, Cloudflare, etc.)
- **Replit** provides HTTPS automatically

---

## 11. Monitoring

### 11.1 Application Logging

The application logs all API requests to stdout with the format:
```
10:30:00 AM [express] GET /api/health 200 in 5ms :: {"status":"ok"}
```

### 11.2 Audit Trail

All user actions are recorded in the `audit_logs` table with:
- User ID and action type
- Entity type and ID
- IP address
- Timestamp
- Human-readable details

### 11.3 API Usage Tracking

The application includes in-memory API usage tracking that monitors all `/api` requests. This data is accessible to administrators via `GET /api/admin/api-usage` and provides metrics including total requests today, requests this hour, unique endpoints, top endpoints, and hourly distribution.

> **Note:** API usage tracking data is stored in-memory and resets on application restart. For persistent usage tracking in production, consider integrating an external analytics service or logging to a database.

### 11.4 Recommended Monitoring Tools

| Tool | Purpose |
|------|---------|
| PM2 | Process monitoring, auto-restart |
| Datadog/New Relic | Application performance monitoring |
| pgAdmin | Database monitoring and management |
| Grafana + Prometheus | Metrics visualization |

---

## 12. Backup and Recovery

### 12.1 Database Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 12.2 Automated Backups

```bash
# Crontab entry for daily backups at 2 AM
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/credit_registry_$(date +\%Y\%m\%d).sql.gz
```

### 12.3 Restore from Backup

```bash
psql $DATABASE_URL < backup_20250115_020000.sql
```

---

## 13. Troubleshooting

### 13.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused on port 5000 | Application not running | Check `NODE_ENV`, verify `dist/index.cjs` exists |
| Database connection error | Invalid `DATABASE_URL` | Verify connection string, check network/firewall rules |
| Session not persisting | Missing `SESSION_SECRET` | Set `SESSION_SECRET` environment variable |
| 440 Session Expired | 15-minute idle timeout | Re-login; this is expected security behavior (NFR-SEC-09) |
| Seed fails on first run | Tables not created yet | Run `npx drizzle-kit push` first, then restart |
| Build fails | Missing dependencies | Run `npm install` before `npm run build` |
| Static files not served | Wrong `NODE_ENV` | Ensure `NODE_ENV=production` for static file serving |
| API returns 401 | Not authenticated | Login first; check session cookie is being sent |
| API returns 403 | Insufficient role | Check user role matches route requirements |

### 13.2 Debugging

Enable verbose logging:
```bash
DEBUG=* NODE_ENV=production node dist/index.cjs
```

Check database connectivity:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

Verify table creation:
```bash
psql $DATABASE_URL -c "\dt"
```

### 13.3 Performance Tuning

- Increase database pool size for higher concurrency
- Enable PostgreSQL connection pooling (PgBouncer)
- Use a CDN for static frontend assets
- gzip compression is built into the application via the `compression` middleware (ENT-05); reverse proxy compression is optional
- Monitor and index frequently queried columns
- React.lazy code-splitting reduces initial bundle size for faster page loads (ENT-05)

---

## 14. Security Hardening Checklist

- [ ] Change all default seed credentials
- [ ] Set strong `SESSION_SECRET` (64+ random characters)
- [ ] Enable HTTPS via reverse proxy or platform
- [ ] Set `cookie.secure = true` in production
- [ ] Restrict database access to application IP only
- [ ] Enable PostgreSQL SSL (`?sslmode=require`)
- [ ] Set up automated database backups
- [ ] Configure firewall rules (allow only port 443/80)
- [ ] Enable log rotation for application logs
- [ ] Review and restrict CORS if needed
- [ ] Set up monitoring and alerting
- [ ] Conduct security audit before go-live
- [ ] Enforce MFA (ENT-01) for admin and regulator accounts
- [ ] Rotate OAuth JWT signing keys periodically (ENT-04)
- [ ] Verify audit log integrity (ENT-07) as part of routine security checks
- [ ] Ensure `pg_trgm` extension (ENT-02) is available in production PostgreSQL
- [ ] Verify XBRL/XML batch uploads (ENT-06) work with expected file sizes; no additional parsing libraries required beyond built-in XML handling
- [ ] Dispute chatbot (ENT-03) requires no additional configuration; it uses existing dispute filing endpoints
- [ ] Configure `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` for AI-powered features
- [ ] Verify AI endpoints are accessible and returning valid responses
- [ ] Monitor API usage tracking for anomaly detection

---

## 15. Enterprise Enhancement Dependencies

The following additional packages were added for enterprise enhancements (v1.1 and v2.0):

| Package | Purpose | Enhancement |
|---------|---------|-------------|
| `otpauth` | TOTP secret generation and verification | ENT-01 (MFA) |
| `jsonwebtoken` | JWT signing and verification for Bearer tokens | ENT-04 (OAuth 2.1) |
| `compression` | gzip compression middleware | ENT-05 (Low-Bandwidth) |
| `multer` | Multipart/form-data file upload handling | ENT-12 (ID Photos & Documents) |
| `recharts` | Responsive, themed data visualization charts (area, donut, bar) | ENT-14 (Dashboard Visual Analytics) |
| `exceljs` | Excel (XLSX) file generation for report exports | ENT-16 (Excel Export) |

**PostgreSQL Extension:**
- `pg_trgm` — Required for fuzzy entity matching (ENT-02). Automatically created at startup.

---

## 16. Key Features and Capabilities

The Credit Registry System includes the following modules and capabilities:

| Feature | Description |
|---------|-------------|
| Multi-Currency Processing | Support for 42+ African currencies plus USD, EUR, GBP across 54 jurisdictions |
| Internationalization (i18n) | Three languages supported: English (EN), French (FR), and Portuguese (PT) |
| Login Page Language Switcher | Users can select their preferred language directly from the login screen |
| Exchange Rate Management | Module for managing and updating currency exchange rates across supported currencies |
| API Administration | Administrative interface for managing API keys, monitoring usage, and configuring external API access |
| Data Retention Policies | Configurable retention policies with an automated enforcement engine for regulatory compliance |
| MFA Authentication | Multi-factor authentication using TOTP for admin and regulator accounts (ENT-01) |
| Fuzzy Entity Matching | Trigram-based borrower search using pg_trgm (ENT-02) |
| Dispute Chatbot | Interactive chatbot for guided dispute filing (ENT-03) |
| OAuth 2.1 External API | JWT-secured REST API for third-party integrations (ENT-04) |
| Low-Bandwidth Optimization | gzip compression and code-splitting for constrained networks (ENT-05) |
| Batch Upload (XBRL/XML) | Bulk data ingestion via structured file formats (ENT-06) |
| Tamper-Evident Audit Trail | Hash-chained audit logs with integrity verification (ENT-07) |
| Global Search | Cross-entity search across borrowers, institutions, and credit accounts (ENT-11) |
| ID Photos & Documents | DiceBear auto-generated avatars with multer-based photo/document upload (ENT-12) |
| Demo Environment | Investor-facing one-click demo with role cards and DEMO banner (ENT-13) |
| Dashboard Visual Analytics | Interactive Recharts charts (area trend, donut status, horizontal bar types) and SVG Africa map choropleth with heat coloring across 54 countries; dark mode support (ENT-14) |
| Interactive Demo Tour | 11-step guided walkthrough with spotlight overlay, auto-launch after demo login, multilingual support in 5 AU languages (ENT-15) |
| AI Credit Risk Analysis | AI-powered borrower risk assessment using OpenAI GPT-4o with risk scores, factors, and recommendations (AI-001) |
| AI Report Summary | Plain-language AI-generated credit report summaries (AI-002) |
| AI Smart Chatbot | AI assistant mode in dispute chatbot with SSE streaming responses (AI-003) |
| AI Compliance Reports | Automated regulatory compliance analysis per country using AI (AI-004) |
| Excel Export | XLSX export for portfolio, borrower, and audit trail data using exceljs (ENT-16) |
| Real-time Notifications | Notification bell with 30-second polling, mark-as-read, and popover dropdown (ENT-17) |
| API Usage Analytics | In-memory API request tracking with usage dashboard for administrators (ENT-18) |
| Dashboard Sparkline Trends | 7-day trend mini-charts on dashboard stat cards using recharts AreaChart (ENT-19) |
| Audit Trail Enhancements | Timeline view, date range filters, CSV and Excel export for audit logs (ENT-20) |
| Multi-language PDF Reports | Language selector (EN/FR/AR/SW) for credit report PDF downloads (ENT-21) |

---

## 17. Version Information

| Component | Version |
|-----------|---------|
| Application | v2.0 (Enterprise Enhancements) |
| Node.js Runtime | 20.x LTS |
| Express.js | 4.x |
| Drizzle ORM | Latest |
| Vite | 5.x |
| React | 18.x |
| PostgreSQL | 14+ |
| TypeScript | 5.x |
| otpauth | Latest (ENT-01) |
| jsonwebtoken | Latest (ENT-04) |
| compression | Latest (ENT-05) |
