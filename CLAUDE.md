# UCH — Claude Code Project Instructions

## Project
Universal Credit Hub (UCH) — pan-African credit bureau platform.
Stack: Node/Express server + React/Vite client, TypeScript throughout, Drizzle ORM + Neon PostgreSQL.

Working directory: `/home/user/africa-credit-hub`
Main branch: `main` — always push fixes here.

---

## Auto-Fix Protocol (TypeScript errors)

When woken up by the Stop hook with TypeScript errors, execute this sequence automatically — no need to ask for permission:

1. **Read the errors** from the system reminder (file path + line + error code).
2. **Fix each error** — edit the affected files directly.
3. **Verify** — run `npm run check`. If still failing, fix again (max 3 iterations).
4. **Commit** — use a clear message like `fix(ts): resolve N TypeScript errors`.
5. **Push** — `git push origin main`.
6. **Report** — tell the user what was fixed, which files changed, and confirm the branch is clean.

If a fix requires architectural changes or is ambiguous, stop after step 2 and ask the user before committing.

---

## Auto-Fix Protocol (general errors)

When the user pastes an error message, stack trace, or build failure:

1. Identify the file and root cause.
2. Fix it directly in the codebase.
3. Run `npm run check` to confirm no TypeScript regressions.
4. Provide a Replit paste script if the fix also needs to go into the user's live Replit environment.
5. Commit + push to `main`.

---

## Key Project Paths

| Path | Purpose |
|------|---------|
| `client/src/pages/` | All page components (128 pages) |
| `client/src/components/app-sidebar.tsx` | Main navigation sidebar |
| `client/src/App.tsx` | Route definitions |
| `server/routes.ts` | All API endpoints |
| `server/storage.ts` | Database access layer |
| `shared/schema.ts` | Drizzle ORM schema |
| `exports/*.md` | Country sales playbooks |
| `e2e/` | Playwright end-to-end tests |
| `.claude/hooks/ts-check.py` | Background TypeScript checker |

---

## Commit & Push Rules

- Branch: always commit to `main` (or create a fix branch and merge immediately).
- Message format: `fix(scope): short description` — e.g. `fix(ts): resolve 3 TypeScript errors in server/routes.ts`.
- Never skip `npm run check` before pushing.
- Always `git push origin main` after committing a fix.

---

## Replit Fix Files

When changes need to go to the user's live Replit project (not just this repo):
- Generate a single bash script at `/tmp/replit-fixes.sh`.
- Use Python `str.replace()` for surgical edits and `cat > file << 'EOF'` for full rewrites.
- Always test the script by running it against the local clone first.
- Send the file to the user with `SendUserFile`.

---

## Standing Instructions

- **I am always the code partner for this project.** The user does not need to re-explain the codebase.
- Run `npm run check` after any TypeScript file edit, before reporting a task as done.
- When producing Replit scripts, always include an idempotency check so re-running is safe.
- Ghana playbook is at `exports/ghana-demo-playbook.md` — update it whenever the user has a new client meeting.
