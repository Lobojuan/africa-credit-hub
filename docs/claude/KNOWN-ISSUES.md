# Known Issues — africa-credit-hub

Status legend: OPEN / FIXED(date) / FALSE-POSITIVE

## Security / correctness
| # | Issue | Where | Status |
|---|-------|-------|--------|
| 1 | `keyPrefix.startsWith(client_id)` not timing-safe | server/external-api.ts ~136 | OPEN (low risk, bank due-diligence flag) |
| 2 | No OpenAPI 3.0 spec — blocks Ecobank Apigee onboarding | — | OPEN |
| 3 | No NDPR (Nigeria) consent endpoint | — | OPEN (Ghana DPA consent logic exists to replicate) |
| 4 | Zod validation inconsistent across write endpoints (36 parse calls, many raw req.body) | server/routes.ts | OPEN (audit as part of total review) |
| 5 | routes.ts is a ~19k-line monolith | server/routes.ts | OPEN (split by domain — roadmap) |
| 6 | Hardcoded localhost in tearsheet scheduler | tearsheet-scheduler.ts | FIXED 2026-07-07 (env override) |
| 7 | Fake 127.0.0.1 IP in backup audit logs | backup-service.ts | FIXED 2026-07-07 ('system') |
| 8 | as-any DB result casts crash-prone | distribute-timestamps.ts | FIXED 2026-07-07 (typed helpers) |
| 9 | Silent catch on reviewer notifications | routes.ts ~1469 | FIXED 2026-07-07 (logged) |
| 10 | Unbounded search identifier inputs reaching audit trail | routes.ts structured-search | FIXED 2026-07-07 (200-char cap) |
| 11 | console.* in sms.ts | sms.ts | FIXED 2026-07-07 (structured logger) |
| 12 | Consumer monitoring IDOR claim (Ecobank report) | storage.ts | FALSE-POSITIVE — queries scope by consumerAccountId |
| 13 | Push subscription SSRF claim | routes.ts 18720 | FALSE-POSITIVE — isSafeWebhookUrl applied |
| 14 | Pagination NaN claim | routes.ts ~1577 | FALSE-POSITIVE — parseInt()||default is NaN-safe |

## Historic (fixed earlier, keep for context)
- 39 TS errors = 4 missing @types packages (2026-05)
- Playbook PDFs unreadable = Unicode box chars vs Helvetica (2026-05/07, stripMd sanitizers)
- /loto-pos + /loto/admin/devices unreachable (sidebar entries added)
- Playbook View button hardcoded to Ghana (per-market viewUrl)
