# Universal Credit Hub Version History

**Platform Version:** 2.8.0
**Current Commit:** `e388af7`
**Branch:** `main`
**Generated:** 2026-07-15T09:43:10.895Z

This file is generated from the repository history by `npm run version:history`.
It is refreshed automatically before `npm run dev`, `npm run build`, and `npm run check`, and by `dev-server.sh` for local previews.

## Latest Repository Changes

| Date | Commit | Change | Author |
|---|---|---|---|
| 2026-07-14 | `e388af7` | fix: load .env in server/db.ts directly (standalone scripts importing db.ts never got DATABASE_URL loaded) | Uffe J Carlson |
| 2026-07-11 | `42d101a` | fix: e2e/test-session/seed audit fixes (routes.ts, seed.ts, e2e, tests, gitignore, hooks) | Uffe J Carlson |
| 2026-07-11 | `2cd0799` | fix: load .env via dotenv (server never read it, silently ignoring all local config) | Uffe J Carlson |
| 2026-07-09 | `530e5d4` | Merge pull request #7 from Lobojuan/fix/ground-ai-reasoning-in-real-score | Uffe J Carlson |
| 2026-07-09 | `129253a` | Ground all AI credit-reasoning functions in the real computed score | Uffe J Carlson |
| 2026-07-09 | `d7f9a98` | Merge pull request #6 from Lobojuan/fix/remaining-scoring-and-integrity-issues | Uffe J Carlson |
| 2026-07-09 | `052b5cb` | Fix I1 write-path (unverified self-declared consent); update known-issues doc | Uffe J Carlson |
| 2026-07-09 | `a68a062` | Fix A4, A5: multi-currency FX conversion, robust LLM JSON extraction | Uffe J Carlson |
| 2026-07-09 | `c938596` | Fix B4, F4, C2, B3: ID validation, score cliff, dedup, batch maker-checker | Uffe J Carlson |
| 2026-07-09 | `fc508f0` | Merge pull request #5 from Lobojuan/fix/scoring-integrity-and-hygiene | Uffe J Carlson |
| 2026-07-09 | `8ac0248` | Sweep raw error-message leaks to safeErrorMessage (P2) | Uffe J Carlson |
| 2026-07-09 | `3ca28da` | Repo hygiene: remove 5 orphan server files and 4 tracked source zips | Uffe J Carlson |
