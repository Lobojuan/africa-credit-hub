# Session Log — africa-credit-hub (append-only)

> Central memory: https://github.com/Lobojuan/AI-Brain-and-Memory — read that first.

## 2026-05 → 2026-07 (consolidated history)
- Full code review + fixes: sidebar POS/Device links, playbook View buttons, South Africa card, Ghana playbook rewrite (ASCII-art quick reference), playbook-index e2e suite
- 39 TS errors root-caused to 4 missing @types packages (pdfkit, nodemailer, web-push, pdf-parse) — fixed
- Auto-fix loop live: `.claude/settings.json` Stop hook + `ts-check.py`
- PDF unreadability root-caused: Unicode box chars vs Helvetica — stripMd() sanitizers added to all 6 playbook PDF routes + storage FK fix (remote commit `1cb789b`)
- Ecobank readiness audit: OAuth2 M2M exists (`/api/external/oauth/token`), push-SSRF + monitoring IDOR already fixed. Real gaps: OpenAPI 3.0 spec, NDPR consent endpoint, timing-safe client_id prefix check (external-api.ts ~136)
- Cross-border explainer written for client Q&A (SATA agreements + consent + native IDs)

## 2026-07-07 — code-review cleanup pass
- Fixed: hardcoded localhost (tearsheet-scheduler), fake 127.0.0.1 audit IP + NaN guard (backup-service), typed helpers replacing as-any casts (distribute-timestamps), 24 session casts removed + 8 guarded non-null assertions (routes), silent notification catch now logged, watchlist audit as-any removed, 200-char cap on structured-search params, sms.ts → structured logger
- Commit `aec8bac` on `claude/production-check-WFJxR`; patch + apply script also delivered to user for Replit main
- False positive noted: pagination parseInt||1 already NaN-safe
- Environment lesson: container reset wiped node_modules mid-session → phantom tsc 6.x errors; `npm install` fixed

## 2026-07-07 (later) — total review complete + memory system live
- Memory: brain repo Lobojuan/AI-Brain-and-Memory bootstrapped (local commits; push pending GitHub App)
- Environment shift recorded: Replit RETIRED, Claude Code only, GitHub App = push path (enabled today, takes effect next session)
- Platform sweep: 112 unvalidated write endpoints (10 money/PII P1s), 67 raw error leaks, 10 orphan admin routes, 4 tracked ZIPs, 47 untranslated pages → REVIEW-2026-07.md Part A
- Scoring deep audit: utilization factor DEAD CODE (no credit_limit column), inquiry penalties unfiltered (no consent/soft/12-mo), soft-pull endpoint always 500s, score differs per surface (decisions ~100pts high), batch tampering vectors, affordability income inflation → REVIEW-2026-07.md Part B
- Fixed + committed: timing-safe OAuth client_id (e305343)
- ROADMAP.md written: NOW (Scorecard v1.1 correctness bundle) / NEXT (bureau parity: reason codes, model governance, trended data, dispute SLA, OpenAPI, NDPR) / LATER (monolith split, i18n)

## 2026-07-07 (later still) — Scorecard v1.1: fixed F1, C1, I2 (+ F3, partial I1)
- F1/F3: utilization factor now live — effectiveLimit() derives limit from originalAmount for revolving types (credit_card/overdraft/revolving/credit_line), NaN-guarded via safeAmount(); term loans excluded (correct). No DB migration needed. +2 regression tests (20/20 pass).
- C1: score parity across all surfaces — external-api.ts and dashboard.ts now include altData; decision engine (routes.ts:15790) loads real inquiries+altData instead of 0/[]. New storage.getAlternativeDataByBorrower(). Dashboard score-cache fingerprint now includes altData.
- I1 (partial): all 9 calculateCreditScore sites use shared countScorableInquiries() = hard pulls, trailing 12mo. Consent filtering deferred (needs consent_provided backfill — documented in helper).
- I2: soft-pull endpoint repaired — was `(calculateCreditScore as any)(borrower, accounts, ...)`, threw on every call; now correct signature with judgments+altData.
- Commit 8f3c4b9. TypeScript clean, 20/20 scoring tests pass.
- REMAINING scoring: F2 (alt-data empty boost), B1/B2 (batch tampering), A1-A3 (affordability income), F4/A4/A5/B3/B4/C2/C4 (medium). See REVIEW-2026-07.md Part B.

## 2026-07-07 (i18n) — corrected finding + first public page internationalized
- CORRECTED the audit's i18n claim: locale dictionaries are NOT ~50% missing. Measured leaf strings: en~2904, fr 100% (typeof en enforced), pt 98%, ar 96%, sw 98%, es 99%, zh-CN 104%, zh-TW 117%. Dictionaries essentially COMPLETE. Earlier number counted nested keys.
- REAL gap = 47/128 pages never call useTranslation → hardcoded English bypasses the complete dictionary. This is per-page extraction, not dictionary translation.
- Policy agreed: en/fr/pt/es reliable in-session; ar/sw/zh fall back to English (tracked, no unverified content ships).
- DONE: consent-respond.tsx (legal, public) fully internationalized — new `consentRespond` namespace in en/fr/pt/es, ~35 strings, 0 hardcoded left, tsc clean (fr enforced). Commit a39abf5.
- Tracker + proven per-page recipe: docs/claude/I18N-TRACKER.md. Remaining high-value public pages queued: country-selection, consumer-portal, collections, loan-origination, collateral-registry, telco-lending, papps-settlements.

## 2026-07-09 — i18n on consent-respond page + gauge; push blocked all session; CRITICAL environment lesson
- i18n: consent-respond.tsx fully internationalized (en/fr/pt/es, ~35 strings, new `consentRespond`
  namespace). credit-score-gauge.tsx SVG band label now t()'d (`scoreGuide.<band>`).
- Corrected the review's i18n coverage claim: dictionaries are essentially complete (en~2904 leaf
  strings, fr 100% typeof-enforced, pt/es/ar/sw/zh-CN/zh-TW 96–117%). Real gap is 47/128 pages never
  calling useTranslation — a per-page extraction problem, not a translation problem.
- Fixed B1 (cross-lender tradeline tampering — lenderInstitution now forced to the caller's own org
  for "lender" role sessions, via new resolveTrustedLenderInstitution()), B2 (batch identity
  overwrite — nationalId match now scoped by country when known, conflicting identity fields reject
  the row as IDENTITY_CONFLICT instead of silently overwriting), and F2 (alt-data bonus gaming — TWO
  separate bonus code paths in credit-score.ts both lacked a minimum-sample-size floor; the thin-file
  path genuinely had the literal "assume 80% on-time" default the original review described, exactly
  reproducing the claimed 600→664 exploit; the with-accounts path had no floor at all, allowing 3
  fabricated 1-transaction sources to claim the full +90 bonus. MIN_ALT_TXNS_PER_SOURCE=5 added to
  both). +3 regression tests, tsc clean.
- **CRITICAL — had to redo this work once already.** Mid-session the container was reclaimed/restarted
  between conversation turns and came back with the repo reset to an earlier commit — every local
  commit made after that point (including a first pass at these same B1/B2/F2 fixes, plus a 66-commit
  authorship-normalization rebase) was silently gone: not in `git log --all`, not in `git fsck
  --unreachable`, nothing. **Local commits in this environment are not durable — only a successful
  push makes work survive a session boundary.** Do not treat "committed" as "safe" here.
- Push attempted repeatedly all session via 3 independent paths (git proxy, MCP push_files, MCP
  create_or_update_file) — all fail. Error signature evolved during the session: started as `403
  Resource not accessible by integration` (GitHub App not installed — user confirmed via GitHub
  Developer Settings screenshot), then after user connected the GitHub integration in Claude's own
  Connectors settings, became `403 Permission ... denied to Lobojuan` (repo-level denial, connector
  scope is read/identity-only, not Contents:write), then the dedicated git proxy port itself started
  refusing connections entirely. Root cause across all three: this session's credential was minted at
  session start and does not pick up permission changes made mid-session, compounded by the container
  reset above. **Next session should retry the push FIRST, before doing any other work**, given a
  fresh credential — if it still fails, the GitHub App/connector permissions need re-verification from
  scratch (screenshots of the exact failure are in this conversation's history if needed).
- Git commit identity for this repo should be `git config user.name "Claude"` / `user.email
  "noreply@anthropic.com"` — set this early in any session that will commit, since it doesn't persist
  across the container resets described above.

## 2026-07-10 — push finally landed (via patch-paste, not the sandbox); A1-A3 fixed
- RESOLVED (for this session): direct git/MCP push from the Claude Code sandbox is still blocked
  (`403 Permission ... denied` / `403 Resource not accessible by integration`), and even the
  session's dedicated git proxy died mid-session (stale hardcoded `pushurl` in `.git/config`,
  fixed by removing the override so git falls through to the normal, working proxy path — that
  part alone doesn't grant write access, it just gets you a real GitHub response instead of a
  dead connection). What actually worked: generating a plain `git diff`/patch as TEXT (not a
  file attachment — file downloads via the chat client were unreliable for this user across many
  attempts) and having the user paste it directly into Terminal on their own Mac, which has real
  push access (proven: they merged PR #7 through it). `git apply --check` → `git apply` → commit
  → push. For small diffs (<50KB) this is far more reliable than file bundles — no download step,
  no path-guessing, just copy/paste into a heredoc. Prefer this method first next time push is
  blocked; fall back to bundles only for very large diffs.
- Fixed A1/A2/A3 (affordability-service.ts), the last of the HIGH-severity scoring findings:
  - A1: classifyIncome/categoriseExpenses previously computed separate, mismatched spans
    (credits-only vs debits-only first-to-last-transaction gaps) — N periodic payments span only
    N-1 intervals, overstating income by N/(N-1) (e.g. x1.5 for 3 salary credits). Now both share
    one `periodMonths` computed over the full transaction set.
  - A2: loan_disbursement/savings_withdrawal credits excluded from income candidates (category +
    keyword match); momoToNormalised now preserves the real MoMo transactionType so this is
    reliable even when narration text doesn't literally say "loan".
  - A3: removed `bank_statement_pdf` from the verified-income write-back trustedSources — a
    fabricated PDF can no longer permanently overwrite borrower.monthlyIncome. open_banking/hybrid
    remain trusted (not user-fabricable the way an uploaded PDF is).
  - +5 regression tests (new server/__tests__/affordability-service.test.ts). Also wired the
    previously-orphaned server/__tests__/unit-env.ts into vitest.config.ts setupFiles (was never
    referenced anywhere; needed to stub AI_INTEGRATIONS_OPENAI_API_KEY so importing
    affordability-service.ts in tests doesn't crash on OpenAI client construction).
  - **All Scorecard v1.1 HIGH+CRITICAL findings are now fixed**: F1, I1(partial — consent filter
    still needs data backfill), I2, C1, F2, B1, B2, A1, A2, A3.

## 2026-07-10 (later) — de-Replit-ified the codebase; user now has a local Claude Code session
- User set up Claude Code locally on their Mac (`~/africa-credit-hub-recover`, working push access
  confirmed) — that session should be the primary place for future work; this sandbox's push is
  still blocked (see CRITICAL note above) and its outbound network is blocked for tunnels/hosting
  platforms entirely (tested api.render.com, api.railway.app, api.vercel.com, api.fly.io — all
  identical `403 CONNECT tunnel failed` as the tunnel providers). Local session confirmed capable
  of tunneling (found and fixed a real bug in the process: a stale unrelated process from a
  different old project squatting on the dev port, serving stale content and causing the blank
  page the user saw through the tunnel).
- Removed Replit platform coupling now that the project no longer runs there:
  - Deleted `.replit`, `.replitignore`, `replit.nix` (dead platform config)
  - Deleted `client/replit_integrations/audio/` — confirmed unused (no imports anywhere), was a
    scaffolded voice-chat utility that was never wired into any page
  - `server/index.ts`: dev-mode CSP `frameAncestors` no longer allowlists `*.replit.dev/.app`,
    `*.repl.co`; added `import "./env"` as the first import to load `.env` via dotenv (see below)
  - `server/routes.ts`: consent-notification base-URL fallback host changed from
    `universalcredithub.replit.app` to the real production domain
  - `server/routes/platform-control.ts`: `current-instance` deployment-URL detection no longer
    reads `REPLIT_DEV_DOMAIN`/`REPL_SLUG` (uses `CANONICAL_URL`); new-client onboarding
    instructions no longer say "fork this Replit project" (says clone + deploy to hosting platform
    of choice). Left the GitHub-repo-management admin feature (`ReplitConnectors` SDK) in place —
    it already degrades gracefully (try/catch → clear 500 "Ensure GitHub is connected" error) when
    Replit's connector broker isn't available, and replacing it with a real GitHub App is a bigger
    project than this cleanup pass.
  - Added `server/env.ts` (dotenv bootstrap, imported first in `server/index.ts`) so `.env` loads
    automatically — this is the actual fix for the "had to manually export every env var" pain
    point hit repeatedly this session. New `dotenv` dependency.
  - `.env.example`: corrected the AI section — was documented as "auto-provisioned by Replit AI
    Integrations, do not set manually," which is no longer true; now documents
    `AI_INTEGRATIONS_OPENAI_API_KEY`/`AI_INTEGRATIONS_ANTHROPIC_API_KEY` as normal required/optional
    vars.
  - `README.md`, `CLAUDE.md`: removed/updated Replit-specific deployment guidance and the
    "Replit Fix Files" protocol section (dead — there's no live Replit project to sync fixes to
    anymore).
  - Left `replit.md` in place (110-line project-context doc, real content, predates CLAUDE.md) —
    didn't want to delete/merge it into CLAUDE.md without the user's sign-off on which parts to
    keep; flagged for them instead.
  - Verified: `tsc` clean, 672 non-DB tests pass (same baseline, no regressions), full production
    build succeeds (`npm run build`, confirmed with placeholder assets standing in for the
    still-untracked `attached_assets/` — a separate, pre-existing gap, not something this pass
    touched).

## PENDING (next session picks up here)
1. Verify push access from a fresh sandbox session before relying on it — if still blocked, go
   straight to the patch-paste method above rather than re-diagnosing from scratch. User's local
   Claude Code session (`~/africa-credit-hub-recover`) has working push access and should be
   preferred for new work going forward.
2. Remaining scoring: I1 consent-filter data backfill; MEDIUM items F4/A4/A5/B3/B4/C2/C4 (see
   REVIEW-2026-07.md Part B) if there's appetite to keep going deeper.
3. Ecobank remaining: OpenAPI spec, NDPR consent endpoint
4. i18n: finish 7 remaining high-value public pages per docs/claude/I18N-TRACKER.md recipe (consent-respond + credit-score-gauge DONE)
5. CVM: repo creation + Phase 1 verification → Phase 2 AI engine
6. User's PAT is in this session's history — recommend ROTATING it (it cannot be used from these sessions anyway)
7. `attached_assets/` is gitignored and was never tracked in git — real production images/video are
   missing from every clone made from GitHub. If the user still has the originals (their Replit
   export, or wherever they came from), they should be added via Git LFS or a proper asset host,
   not committed raw into git history.
