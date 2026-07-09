# UCH Jarvis GTM Command OS

This is the durable plan for the Jarvis-style local assistant layer discussed for Universal Credit Hub.

## Purpose

Build a local-first operating layer that helps run UCH product, sales, and engineering work without rereading the repo every session or burning expensive cloud tokens unnecessarily.

The product-facing module name should stay serious:

- Universal Credit Hub GTM Intelligence

The internal working name can be:

- Jarvis GTM Command OS

## Core Ideas

- Local memory first: `AGENTS.md`, `CODEX_MEMORY.md`, `memory/`, Graphify, and focused Codex skills.
- Local models first: Ollama handles cheap summaries, drafts, tagging, dedupe, and second opinions.
- Cloud models only when needed: hard architecture, production-risk code, final implementation review, and complex debugging.
- Workflow buttons later: lead review, campaign draft, compliance review, call prep, repo health, deploy checklist.
- Human control: AI drafts and recommends; humans approve first outreach and any externally visible action.

## UCH-Specific Workflows

1. CRM/GTM planning
   - Define target market, ICP, claims, forbidden claims, and outreach channels.

2. Lead intelligence
   - Import leads.
   - Verify email and phone provenance.
   - Score fit against UCH product categories.
   - Prepare account briefs.

3. Email assistant
   - Draft personalized emails.
   - Check compliance requirements.
   - Require approval before first send.
   - Track replies, bounces, unsubscribes, and suppressions.

4. Call assistant
   - Prepare call briefs.
   - Capture transcript or notes.
   - Summarize customer needs.
   - Suggest next actions.
   - Do not run autonomous AI cold calls in MVP.

5. Engineering assistant
   - Query Graphify before broad repo reads.
   - Use local LLMs for low-risk second opinions.
   - Run project verification before claiming a fix is done.

## Local Model Routing

- `qwen2.5:7b`: fast tagging, categorization, small summaries.
- `deepseek-r1:14b`: reasoning through bugs and compliance edge cases.
- `gpt-oss:20b`: planning, summaries, campaign analysis.
- `qwen3-coder:30b`: coding second opinions and local implementation review.
- `kimi-k2.7-code:cloud`: optional high-power coding assistant through Ollama Cloud if available, authenticated, and covered by the user's Ollama subscription. It is registered locally but currently subscription-gated.

## Deferred Voice Stack

Add after the CRM/GTM foundation is stable:

- Speech-to-text: Faster-Whisper or the installed Codex `transcribe` skill.
- Text-to-speech: Kokoro or the installed Codex `speech` skill.
- Voice UI: local web dashboard control, not production-facing by default.

## Safety Defaults

- Do not store secrets or API keys in memory files.
- Do not mass email without unsubscribe and suppression.
- Do not make claims that UCH replaces legal, regulatory, or credit bureau obligations unless approved.
- Do not let sales workflows mutate regulated credit records.
- Do not push, deploy, or change production visuals without explicit user approval.
