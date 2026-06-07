# Codex Project Memory

## Project
Universal Credit Hub / Universal Credit Hub is a production-facing pan-African credit intelligence platform.

Primary production site: `https://universalcredithub.com/`
Main share/test flow: landing page first, then login/dashboard.

## Working Rules
- Treat production visuals as sensitive. Do not change landing page layout, video aspect ratio, dark mode, dashboard copy, navigation, or branding unless the user explicitly asks for that specific change.
- Before changing UI, compare against the production reference when available and verify with a browser screenshot.
- Prefer narrow fixes over broad redesigns. The user wants the app cleaned up, not reinvented.
- Keep commits and pushes user-driven. Do not push unless the user asks.
- Run `npm run check` after TypeScript edits. For UI changes, also run the app locally and inspect the affected page.
- If a change affects login, routing, language switching, tunnel sharing, or production deploy behavior, test that exact workflow before calling it done.
- Use local AI helpers automatically when they can save time on low-risk work:
  - `ai-repo code "question"` for repo-aware summaries, second opinions, or finding likely files.
  - `ai-code "prompt"` for local coding drafts and implementation options.
  - `ai-deep "prompt"` for debugging, tradeoffs, and tricky reasoning.
  - `ai-diff-review` before bigger commits or when reviewing a broad diff.
- Local AI is advisory only. Codex still owns file inspection, patches, tests, browser verification, and final judgment.

## Known User Priorities
- Landing page must load at `/` and keep the original video presentation.
- French and other language modes must translate the visible dashboard text, not only the sidebar.
- Admin login credentials used during local testing: `admin` / `admin0987`.
- The user often wants a Cloudflare tunnel URL for sharing, not only localhost.
- Avoid wasting tokens: read the repo first, use existing scripts, and keep explanations short unless asked.
- Sales tools should feel consistent, polished, and app-native. Country playbooks share `client/src/components/sales-playbook-page.tsx`.
