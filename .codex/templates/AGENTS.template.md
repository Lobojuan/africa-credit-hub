# Codex Project Memory

## Project
Replace this with the product name, purpose, stack, and primary production URL.

## Working Rules
- At the start of a new chat, read this file and `CODEX_MEMORY.md` before making changes.
- If project-specific skills exist under `.codex/skills/`, use the relevant one for memory, safety, local AI, production cleanup, deploys, or repeatable workflows.
- Read the repo before editing.
- Preserve production behavior unless the user asks for a specific change.
- Prefer narrow fixes over broad rewrites.
- Run the relevant checks before reporting a task as done.
- Do not push or deploy unless the user asks.

## Verification
- Code/type changes:
  - Add project command here, for example `npm run check`.
- UI changes:
  - Run locally and inspect the affected page.
- Deploy/share changes:
  - Verify the actual public URL, not only localhost.

## User Priorities
- Add stable preferences, common credentials only if non-secret/test-only, and known sensitive workflows.
