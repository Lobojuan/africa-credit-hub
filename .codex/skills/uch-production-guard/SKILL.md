---
name: uch-production-guard
description: Use when working on Universal Credit Hub production cleanup, landing page/video behavior, language switching, login, Cloudflare tunnel sharing, or deploy safety. Keeps changes narrow and verifies the exact user-facing workflow.
---

# UCH Production Guard

Use this skill before editing production-facing UCH behavior.

## Workflow
1. Start with `git status --short --branch`.
2. Identify the exact page, route, or workflow the user reported.
3. Compare against the production reference if the issue is visual or content-related.
4. Make the smallest targeted edit.
5. Verify the exact workflow locally:
   - Landing page: `/`
   - Dashboard: `/dashboard`
   - Login: admin flow when relevant
   - Language: switcher must translate visible page content, not only navigation
   - Tunnel: confirm reachable URL when the user asks for a share link
6. Run `npm run check` after TypeScript edits.
7. Do not push unless the user explicitly asks.

## Guardrails
- Preserve the original landing video presentation unless the user asks to change it.
- Do not introduce broad theme, navigation, or layout rewrites for a focused bug.
- Do not claim production works from localhost alone.
- Keep explanations concise and include what was actually tested.

