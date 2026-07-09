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
- The CRM/GTM work is a separate Universal Credit Hub GTM Intelligence module, not a rewrite of the regulated UCH credit-registry core.
- The internal assistant concept is "Jarvis GTM Command OS": local-first memory, Graphify, local LLM routing, skills, task workflows, and human-approved outreach.

## CRM / GTM Intelligence Guardrails
- Keep UCH core as the regulated system of record for borrowers, credit data, consent, institutions, collections, audit, and regulatory workflows.
- Build CRM/GTM as its own module owning leads, companies, contacts, campaigns, outreach messages, verification, suppression, call notes, and sales activities.
- Store references to UCH entities when useful; do not copy regulated borrower PII into GTM tables by default.
- Cold email must support verified provenance, honest personalization, human approval for first outreach, unsubscribe, suppression, bounce tracking, and audit history.
- AI calls are not MVP. Start with AI call prep, human calling, transcript/notes, and next-action suggestions.
- Use local LLMs for summaries, drafts, tagging, dedupe, and second opinions. Use cloud/Codex only for production-risk work, final implementation, and complex architecture.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
