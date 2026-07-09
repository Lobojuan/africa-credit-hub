---
name: uch-crm-gtm
description: Use when planning, designing, implementing, or reviewing Universal Credit Hub CRM/GTM Intelligence, Jarvis GTM Command OS, AI-assisted sales outreach, lead data, campaigns, email/call workflows, or GTM memory.
---

# UCH CRM/GTM Intelligence

Use this skill for CRM, GTM, Jarvis, outbound, campaign, lead, contact, sales automation, email, call, and local-memory work in Universal Credit Hub.

## First Principles

- Treat CRM/GTM Intelligence as a separate module from UCH regulated credit-registry core.
- Keep UCH core as the source of truth for borrowers, credit records, consent, regulatory workflows, and audit/security logs.
- Let GTM own leads, companies, contacts, campaigns, outreach, verification, suppression, AI prompts, call notes, and sales activity.
- Prefer human-approved AI assistance over autonomous outreach.

## Required Context

Before broad edits, read:

- `docs/CRM_GTM_Intelligence_Spec.md`
- `docs/UCH_Jarvis_GTM_Command_OS.md`
- `memory/approved-claims.md`
- `memory/forbidden-claims.md`
- `memory/outreach-compliance.md`
- `AGENTS.md`
- `CODEX_MEMORY.md`

If `graphify-out/graph.json` exists, query Graphify before broad source reads.

## Implementation Bias

- Start with data model, routes, and a clean operator UI.
- Add email/call sending only after verification, suppression, audit, and approval flows exist.
- Keep UI dense, calm, and app-native.
- Avoid landing-page-style CRM screens.
- Add tests for campaign state transitions, suppression, permissions, and API validation.

## Local AI Routing

- Use local LLMs for summaries, campaign draft critique, dedupe ideas, tagging, and second opinions.
- Use Codex/cloud for production-risk implementation, final patches, and verification.
- Treat Kimi K2.7 Code through Ollama Cloud as optional, not the default local cost-saving path.
