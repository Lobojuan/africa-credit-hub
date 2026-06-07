---
name: codex-workspace-memory
description: Use when setting up or improving Codex memory, reusable skills, safe coding workflows, local AI support, or project handoff files for any project in this workspace.
---

# Codex Workspace Memory

Use this skill to make a project easier to resume, safer to edit, and less token-wasteful.

## Default Setup
Add or update these files in a project when useful:
- `AGENTS.md` for durable coding rules and guardrails.
- `CODEX_MEMORY.md` for compact project state and handoff notes.
- `.codex/skills/<skill-name>/SKILL.md` for repeatable workflows.

## Memory Rules
- Keep memory short, factual, and actionable.
- Store workflows, not long transcripts.
- Do not store secrets, API keys, tunnel tokens, or private credentials.
- Prefer project-specific rules in the project, and reusable rules in global skills.
- Remove stale notes when they become wrong.

## Safe Coding Workflow
1. Check `git status --short --branch`.
2. Read existing project docs before editing.
3. Make narrow changes that match the repo style.
4. Run the smallest meaningful verification.
5. Report exactly what changed and what was tested.
6. Do not push or deploy unless the user asks.

## Local AI Workflow
- Use local LLMs for second opinions, drafts, summaries, and bug reasoning.
- Verify real behavior with commands, tests, and browser checks.
- Prefer stable 7B-14B coding models on 24 GB RAM unless there is clear headroom.

