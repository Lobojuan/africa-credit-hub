---
name: uch-local-ai-memory
description: Use when improving Codex memory, local LLM workflow, Ollama usage, vibe-coding setup, or project-specific AI assistant habits for Universal Credit Hub.
---

# UCH Local AI Memory

Use this skill when the user asks how to make Codex, skills, memory, or local AI better for UCH work.

## Principles
- Keep memory short, factual, and project-specific.
- Put permanent repo rules in `AGENTS.md`.
- Put session handoff details in `CODEX_MEMORY.md`.
- Put repeatable workflows in focused skills under `.codex/skills/`.
- Avoid huge pasted guides; summarize and link to local files instead.

## Local Model Guidance
- Prefer `qwen2.5-coder:14b` for coding second opinions.
- Prefer `deepseek-r1:14b` for reasoning through tricky bugs.
- Prefer `gpt-oss:20b` only when memory headroom is comfortable.
- Use local LLMs for review and planning, then verify with real commands.

## Maintenance
- Update memory only when a fact will matter in future sessions.
- Remove stale notes when production behavior changes.
- Do not store secrets, passwords, API keys, or tunnel tokens in memory files.

