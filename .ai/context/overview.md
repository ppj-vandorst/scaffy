---
description: Read first. What this project is, who uses it and why it exists.
---

# scaffy

A CLI that installs AI-agent scaffolding (AGENTS.md, CLAUDE.md, and a .ai/ folder of context, prompts and skills) into an existing codebase.

Developers run it once inside a **Target Project** (`npx scaffy`) so that coding agents (Claude Code and any tool reading `AGENTS.md`) find the project's context, prompts and skills on their own. The domain language (Target Project, Scaffolding, Managed Section, Context, Prompt, Skill, Index, Preset, Base Layer) is defined in `GLOSSARY.md` at the repo root. Use those terms.

## Capabilities

- **Lays a Preset over the Base Layer.** It copies `templates/base/ai/` plus `templates/presets/<preset>/ai/` into the Target Project's `.ai/`, rendering `{{projectName}}`, `{{description}}`, `{{summary}}` and `{{preset}}`. Existing files are never overwritten.
- **Writes Indexes.** `.ai/{context,prompts,skills}/INDEX.md` list every entry on disk, using each file's frontmatter `description`. Re-runs append entries for files the user added.
- **Maintains Managed Sections** in `AGENTS.md` and `CLAUDE.md`, between `<!-- scaffy:start -->` and `<!-- scaffy:end -->`. Content outside the markers is left alone.
- **Links into Claude Code (optional).** It creates per-entry symlinks `.claude/skills/<name>` and `.claude/commands/<name>.md` pointing into `.ai/`.
- **Records a manifest** in `.ai/.scaffy.json` (version, preset, first install date, symlinks) for future upgrades.

## Presets

`java-spring-hexagonal`, `node-cli-typescript` (which scaffy itself uses) and `none`. Adding a preset needs no code change: you add a folder under `templates/presets/` (see the README).

## External systems

None at runtime. Everything is local filesystem work. It's distributed via npm or `npx github:…`.
